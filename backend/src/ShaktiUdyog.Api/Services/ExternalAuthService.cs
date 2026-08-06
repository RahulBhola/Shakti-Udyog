using System.Security.Claims;
using Microsoft.AspNetCore.Identity;
using ShaktiUdyog.Api.Contracts.Auth;
using ShaktiUdyog.Domain.Constants;
using ShaktiUdyog.Domain.Entities;
using ShaktiUdyog.Infrastructure.Auditing;
using ShaktiUdyog.Infrastructure.Auth;

namespace ShaktiUdyog.Api.Services;

public interface IExternalAuthService
{
    Task<AuthResponse?> HandleExternalLoginAsync(string provider, ClaimsPrincipal externalUser, string? ipAddress, string? userAgent);
}

public class ExternalAuthService(
    UserManager<ApplicationUser> userManager,
    ITokenService tokenService,
    IAuditWriter audit,
    ILogger<ExternalAuthService> logger) : IExternalAuthService
{
    public async Task<AuthResponse?> HandleExternalLoginAsync(string provider, ClaimsPrincipal externalUser, string? ipAddress, string? userAgent)
    {
        var providerKey = externalUser.FindFirstValue(ClaimTypes.NameIdentifier);
        var email = externalUser.FindFirstValue(ClaimTypes.Email);
        var fullName = externalUser.FindFirstValue(ClaimTypes.Name);

        if (string.IsNullOrEmpty(providerKey) || string.IsNullOrEmpty(email))
        {
            logger.LogWarning("External login missing required claims (provider={Provider}).", provider);
            return null;
        }

        var user = await userManager.FindByLoginAsync(provider, providerKey);

        if (user is null)
        {
            user = await userManager.FindByEmailAsync(email);
            if (user is not null)
            {
                var linkResult = await userManager.AddLoginAsync(user, new UserLoginInfo(provider, providerKey, provider));
                if (!linkResult.Succeeded) return null;
                await audit.WriteAsync("auth.external.linked", user.Id, "User", user.Id.ToString(), ipAddress, userAgent);
            }
            else
            {
                user = new ApplicationUser
                {
                    UserName = email,
                    Email = email,
                    EmailConfirmed = true,
                    FullName = fullName,
                    IsActive = true,
                    CreatedAtUtc = DateTimeOffset.UtcNow,
                };
                var createResult = await userManager.CreateAsync(user);
                if (!createResult.Succeeded) return null;
                await userManager.AddLoginAsync(user, new UserLoginInfo(provider, providerKey, provider));
                await userManager.AddToRoleAsync(user, Roles.Customer);
                await audit.WriteAsync("auth.external.registered", user.Id, "User", user.Id.ToString(), ipAddress, userAgent);
            }
        }

        if (!user.IsActive) return null;

        user.LastLoginAtUtc = DateTimeOffset.UtcNow;
        await userManager.UpdateAsync(user);

        var access = await tokenService.CreateAccessTokenAsync(user);
        var refresh = await tokenService.IssueRefreshTokenAsync(user, ipAddress);

        await audit.WriteAsync("auth.external.login.succeeded", user.Id, "User", user.Id.ToString(), ipAddress, userAgent);
        return new AuthResponse(access.Token, access.ExpiresAtUtc, refresh.RawToken);
    }
}
