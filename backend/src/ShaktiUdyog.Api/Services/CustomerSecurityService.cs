using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using ShaktiUdyog.Api.Contracts.Customer;
using ShaktiUdyog.Domain.Entities;
using ShaktiUdyog.Infrastructure.Auditing;
using ShaktiUdyog.Infrastructure.Auth;
using ShaktiUdyog.Infrastructure.Data;

namespace ShaktiUdyog.Api.Services;

public interface ICustomerSecurityService
{
    Task<SecurityInfoDto> GetSecurityInfoAsync(CustomerContext ctx);
    Task<bool> ChangePasswordAsync(CustomerContext ctx, ChangePasswordRequest request, string? ip);
    Task<MfaSetupResponse> SetupMfaAsync(CustomerContext ctx, string? ip);
    Task<bool> DisableMfaAsync(CustomerContext ctx, string? ip);
}

public class CustomerSecurityService(
    AppDbContext db,
    UserManager<ApplicationUser> userManager,
    ITokenService tokenService,
    IAuditWriter audit) : ICustomerSecurityService
{
    public async Task<SecurityInfoDto> GetSecurityInfoAsync(CustomerContext ctx)
    {
        var sessions = await db.UserSessions
            .Where(s => s.UserId == ctx.UserId && s.RevokedAtUtc == null && s.ExpiresAtUtc > DateTimeOffset.UtcNow)
            .OrderByDescending(s => s.LastActiveAtUtc)
            .Take(10)
            .Select(s => new ActiveSessionDto(
                s.Id,
                s.DeviceName,
                s.IpAddress,
                s.CreatedAtUtc,
                s.LastActiveAtUtc,
                true))
            .ToListAsync();

        var user = await userManager.FindByIdAsync(ctx.UserId.ToString());
        if (user is null)
        {
            return new SecurityInfoDto(false, [], []);
        }

        var mfaEnabled = await userManager.GetTwoFactorEnabledAsync(user);

        return new SecurityInfoDto(mfaEnabled, sessions, []);
    }

    public async Task<bool> ChangePasswordAsync(CustomerContext ctx, ChangePasswordRequest request, string? ip)
    {
        var user = await userManager.FindByIdAsync(ctx.UserId.ToString());
        if (user is null) return false;

        var result = await userManager.ChangePasswordAsync(user, request.CurrentPassword, request.NewPassword);
        if (!result.Succeeded) return false;

        await tokenService.RevokeAllRefreshTokensAsync(ctx.UserId, ip, "Password changed");
        await audit.WriteAsync("customer.password.changed", ctx.UserId, "User", ctx.UserId.ToString(), ip);
        return true;
    }

    public async Task<MfaSetupResponse> SetupMfaAsync(CustomerContext ctx, string? ip)
    {
        var user = await userManager.FindByIdAsync(ctx.UserId.ToString());
        if (user is null) return new MfaSetupResponse(false, null, null);

        var result = await userManager.SetTwoFactorEnabledAsync(user, true);
        await audit.WriteAsync("customer.mfa.enabled", ctx.UserId, "User", ctx.UserId.ToString(), ip);

        return new MfaSetupResponse(result.Succeeded, null, null);
    }

    public async Task<bool> DisableMfaAsync(CustomerContext ctx, string? ip)
    {
        var user = await userManager.FindByIdAsync(ctx.UserId.ToString());
        if (user is null) return false;

        var result = await userManager.SetTwoFactorEnabledAsync(user, false);
        await audit.WriteAsync("customer.mfa.disabled", ctx.UserId, "User", ctx.UserId.ToString(), ip);
        return result.Succeeded;
    }
}
