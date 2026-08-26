using System.Security.Claims;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using ShaktiUdyog.Api.Contracts.Auth;
using ShaktiUdyog.Domain.Constants;
using ShaktiUdyog.Domain.Entities;
using ShaktiUdyog.Infrastructure.Auditing;
using ShaktiUdyog.Infrastructure.Auth;
using ShaktiUdyog.Infrastructure.Data;

namespace ShaktiUdyog.Api.Services;

public interface IExternalAuthService
{
    Task<AuthResponse?> HandleExternalLoginAsync(string provider, ClaimsPrincipal externalUser, string? ipAddress, string? userAgent);
}

public class ExternalAuthService(
    UserManager<ApplicationUser> userManager,
    ITokenService tokenService,
    IAuditWriter audit,
    ILogger<ExternalAuthService> logger,
    AppDbContext db) : IExternalAuthService
{
    public async Task<AuthResponse?> HandleExternalLoginAsync(string provider, ClaimsPrincipal externalUser, string? ipAddress, string? userAgent)
    {
        var providerKey = externalUser.FindFirstValue(ClaimTypes.NameIdentifier);
        var email = externalUser.FindFirstValue(ClaimTypes.Email);
        var fullName = externalUser.FindFirstValue(ClaimTypes.Name);
        var picture = externalUser.FindFirstValue("picture")
            ?? externalUser.FindFirstValue("urn:google:picture")
            ?? externalUser.FindFirstValue("image")
            ?? externalUser.FindFirstValue("avatar_url")
            ?? externalUser.Claims.FirstOrDefault(c =>
                c.Type.EndsWith("picture", StringComparison.OrdinalIgnoreCase) ||
                c.Type.EndsWith("avatar_url", StringComparison.OrdinalIgnoreCase) ||
                c.Type.Contains("image", StringComparison.OrdinalIgnoreCase))?.Value;

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
                if (!string.IsNullOrWhiteSpace(picture))
                {
                    user.AvatarUrl = picture;
                }
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
                    AvatarUrl = picture,
                    IsActive = true,
                    CreatedAtUtc = DateTimeOffset.UtcNow,
                };
                var createResult = await userManager.CreateAsync(user);
                if (!createResult.Succeeded) return null;
                await userManager.AddLoginAsync(user, new UserLoginInfo(provider, providerKey, provider));
                await userManager.AddToRoleAsync(user, Roles.Customer);

                // Auto-provision company for new OAuth customer
                var compName = !string.IsNullOrWhiteSpace(fullName) ? fullName.Trim() : email.Trim();
                var company = await db.Companies.FirstOrDefaultAsync(c => c.Name == compName);
                if (company is null)
                {
                    company = new Company
                    {
                        Name = compName,
                        CompanyEmail = email.Trim(),
                        VerificationStatus = "Approved",
                        IsActive = true,
                        CreatedAtUtc = DateTimeOffset.UtcNow,
                    };
                    db.Companies.Add(company);
                    await db.SaveChangesAsync();
                }

                db.UserCompanies.Add(new UserCompany
                {
                    UserId = user.Id,
                    CompanyId = company.Id,
                    IsApproved = true,
                    ApprovedAtUtc = DateTimeOffset.UtcNow,
                });
                await db.SaveChangesAsync();

                await audit.WriteAsync("auth.external.registered", user.Id, "User", user.Id.ToString(), ipAddress, userAgent);
            }
        }

        if (!user.IsActive) return null;

        if (!string.IsNullOrWhiteSpace(picture) && user.AvatarUrl != picture)
        {
            user.AvatarUrl = picture;
        }
        if (!string.IsNullOrWhiteSpace(fullName) && string.IsNullOrWhiteSpace(user.FullName))
        {
            user.FullName = fullName;
        }

        user.LastLoginAtUtc = DateTimeOffset.UtcNow;
        await userManager.UpdateAsync(user);

        var refresh = await tokenService.IssueRefreshTokenAsync(user, ipAddress, userAgent);
        var access = await tokenService.CreateAccessTokenAsync(user, refresh.Entity.SessionId);

        await audit.WriteAsync("auth.external.login.succeeded", user.Id, "User", user.Id.ToString(), ipAddress, userAgent);
        return new AuthResponse(access.Token, access.ExpiresAtUtc, refresh.RawToken);
    }
}
