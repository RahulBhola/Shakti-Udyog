using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using ShaktiUdyog.Api.Contracts.Customer;
using ShaktiUdyog.Domain.Entities;
using ShaktiUdyog.Infrastructure.Auditing;
using ShaktiUdyog.Infrastructure.Auth;
using ShaktiUdyog.Infrastructure.Data;

namespace ShaktiUdyog.Api.Services;

public interface ICustomerProfileService
{
    Task<ProfileDto?> GetProfileAsync(CustomerContext ctx);
    Task<bool> UpdateProfileAsync(CustomerContext ctx, UpdateProfileRequest request, string? ip);
    Task<(bool Succeeded, string? Error)> ChangePasswordAsync(CustomerContext ctx, ChangePasswordRequest request, string? ip);
}

public class CustomerProfileService(
    AppDbContext db,
    UserManager<ApplicationUser> userManager,
    ITokenService tokenService,
    IAuditWriter audit) : ICustomerProfileService
{
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

        return new ProfileDto(
            user.Email ?? string.Empty, user.FullName, user.PhoneNumber, company,
            MfaEnabled: false); // MFA arrives in a later milestone
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
            user.PhoneNumber = request.PhoneNumber.Trim();
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
}
