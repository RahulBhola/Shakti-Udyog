using System.Collections.Concurrent;
using System.Security.Cryptography;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using ShaktiUdyog.Api.Contracts.Customer;
using ShaktiUdyog.Domain.Entities;
using ShaktiUdyog.Infrastructure.Auditing;
using ShaktiUdyog.Infrastructure.Auth;
using ShaktiUdyog.Infrastructure.Data;
using ShaktiUdyog.Infrastructure.Notifications;

namespace ShaktiUdyog.Api.Services;

public interface ICustomerProfileService
{
    Task<ProfileDto?> GetProfileAsync(CustomerContext ctx);
    Task<bool> UpdateProfileAsync(CustomerContext ctx, UpdateProfileRequest request, string? ip);
    Task<(bool Succeeded, string? Error)> ChangePasswordAsync(CustomerContext ctx, ChangePasswordRequest request, string? ip);
    Task<SendPhoneOtpResponse> SendPhoneOtpAsync(CustomerContext ctx, SendPhoneOtpRequest request, string? ip);
    Task<(bool Succeeded, string Message)> VerifyPhoneOtpAsync(CustomerContext ctx, VerifyPhoneOtpRequest request, string? ip);
}

public class CustomerProfileService(
    AppDbContext db,
    UserManager<ApplicationUser> userManager,
    ITokenService tokenService,
    ISmsService smsService,
    IAuditWriter audit) : ICustomerProfileService
{
    private static readonly ConcurrentDictionary<string, (string Otp, DateTimeOffset ExpiresAt)> PhoneOtpStore = new();

    public async Task<ProfileDto?> GetProfileAsync(CustomerContext ctx)
    {
        var user = await userManager.FindByIdAsync(ctx.UserId.ToString());
        if (user is null)
        {
            return null;
        }

        var company = await db.Companies
            .Where(c => c.Id == ctx.CompanyIds[0])
            .Select(c => new CompanyProfileDto(
                c.Name, c.AddressLine1, c.City, c.State, c.PostalCode, c.Country,
                c.GstNumber, c.DeliveryAddresses))
            .SingleOrDefaultAsync();

        var mfaEnabled = await userManager.GetTwoFactorEnabledAsync(user);

        return new ProfileDto(
            user.Email ?? string.Empty, user.FullName, user.PhoneNumber, company,
            mfaEnabled, user.CreatedAtUtc, user.AvatarUrl,
            user.EmailConfirmed, user.PhoneNumberConfirmed);
    }

    public async Task<bool> UpdateProfileAsync(CustomerContext ctx, UpdateProfileRequest request, string? ip)
    {
        var user = await userManager.FindByIdAsync(ctx.UserId.ToString());
        if (user is null)
        {
            return false;
        }

        if (request.FullName is not null)
        {
            user.FullName = request.FullName.Trim();
        }
        if (request.PhoneNumber is not null)
        {
            var newPhone = request.PhoneNumber.Trim();
            if (!string.Equals(user.PhoneNumber, newPhone, StringComparison.OrdinalIgnoreCase))
            {
                user.PhoneNumber = newPhone;
                user.PhoneNumberConfirmed = false;
            }
        }
        if (request.AvatarUrl is not null)
        {
            user.AvatarUrl = string.IsNullOrWhiteSpace(request.AvatarUrl) ? null : request.AvatarUrl.Trim();
        }
        await userManager.UpdateAsync(user);

        // Delivery addresses live on the company record (§13: maintain
        // approved delivery addresses).
        if (request.DeliveryAddresses is not null)
        {
            var company = await db.Companies.SingleAsync(c => c.Id == ctx.CompanyIds[0]);
            company.DeliveryAddresses = request.DeliveryAddresses.Trim();
            await db.SaveChangesAsync();
        }

        await audit.WriteAsync("customer.profile.updated", ctx.UserId, "User", ctx.UserId.ToString(), ip);
        return true;
    }

    public async Task<(bool Succeeded, string? Error)> ChangePasswordAsync(
        CustomerContext ctx, ChangePasswordRequest request, string? ip)
    {
        var user = await userManager.FindByIdAsync(ctx.UserId.ToString());
        if (user is null)
        {
            return (false, "User not found.");
        }

        var result = await userManager.ChangePasswordAsync(user, request.CurrentPassword, request.NewPassword);
        if (!result.Succeeded)
        {
            return (false, string.Join(" ", result.Errors.Select(e => e.Description)));
        }

        // Password change ends all other sessions (requirements §19).
        await tokenService.RevokeAllRefreshTokensAsync(ctx.UserId, ip, "Password changed");
        await audit.WriteAsync("customer.password.changed", ctx.UserId, "User", ctx.UserId.ToString(), ip);
        return (true, null);
    }

    public async Task<SendPhoneOtpResponse> SendPhoneOtpAsync(CustomerContext ctx, SendPhoneOtpRequest request, string? ip)
    {
        var user = await userManager.FindByIdAsync(ctx.UserId.ToString());
        var phone = !string.IsNullOrWhiteSpace(request.PhoneNumber)
            ? request.PhoneNumber.Trim()
            : (user?.PhoneNumber?.Trim() ?? string.Empty);

        if (string.IsNullOrWhiteSpace(phone))
        {
            return new SendPhoneOtpResponse("Please provide a valid phone number.", DateTimeOffset.UtcNow);
        }

        // Generate genuine cryptographically random 6-digit OTP
        var otp = RandomNumberGenerator.GetInt32(100000, 1000000).ToString();
        var expiresAt = DateTimeOffset.UtcNow.AddMinutes(10);
        var key = $"{ctx.UserId}:{phone}";
        PhoneOtpStore[key] = (otp, expiresAt);

        // Dispatch real SMS via configured SMS gateway (Fast2SMS / Twilio / MSG91 / Console logger)
        await smsService.SendOtpAsync(phone, otp);

        await audit.WriteAsync("customer.phone_otp.sent", ctx.UserId, "User", phone, ip);
        return new SendPhoneOtpResponse($"OTP sent to {phone}.", expiresAt);
    }

    public async Task<(bool Succeeded, string Message)> VerifyPhoneOtpAsync(CustomerContext ctx, VerifyPhoneOtpRequest request, string? ip)
    {
        var phone = request.PhoneNumber.Trim();
        var otp = request.Otp.Trim();
        var key = $"{ctx.UserId}:{phone}";

        var valid = false;
        if (PhoneOtpStore.TryGetValue(key, out var entry) && entry.ExpiresAt > DateTimeOffset.UtcNow && entry.Otp == otp)
        {
            valid = true;
            PhoneOtpStore.TryRemove(key, out _);
        }

        if (!valid)
        {
            await audit.WriteAsync("customer.phone_otp.failed", ctx.UserId, "User", phone, ip);
            return (false, "Invalid or expired verification code.");
        }

        var user = await userManager.FindByIdAsync(ctx.UserId.ToString());
        if (user is not null)
        {
            user.PhoneNumber = phone;
            user.PhoneNumberConfirmed = true;
            await userManager.UpdateAsync(user);
        }

        await audit.WriteAsync("customer.phone.verified", ctx.UserId, "User", phone, ip);
        return (true, "Phone number verified successfully.");
    }
}
