using Microsoft.AspNetCore.Identity;
using ShaktiUdyog.Api.Contracts.Auth;
using ShaktiUdyog.Domain.Constants;
using ShaktiUdyog.Domain.Entities;
using ShaktiUdyog.Infrastructure.Auditing;
using ShaktiUdyog.Infrastructure.Auth;

namespace ShaktiUdyog.Api.Services;

public interface IAuthService
{
    Task<AuthResponse?> LoginAsync(LoginRequest request, string? ipAddress, string? userAgent);
    Task<AuthResponse?> RefreshAsync(string rawRefreshToken, string? ipAddress);
    Task ForgotPasswordAsync(ForgotPasswordRequest request, string? ipAddress);
    Task<bool> ResetPasswordAsync(ResetPasswordRequest request, string? ipAddress);
    Task LogoutAsync(string? rawRefreshToken, string? ipAddress);
    Task<MeResponse?> GetMeAsync(Guid userId);
    Task<AuthResponse?> RegisterAsync(RegisterRequest request, string? ipAddress, string? userAgent);
}

/// <summary>
/// Authentication application service. Controllers stay thin; all rules live
/// here. Login failure responses are uniform (no user-existence disclosure),
/// lockout is enforced by Identity, and every sensitive event is audited.
/// </summary>
public class AuthService(
    UserManager<ApplicationUser> userManager,
    ITokenService tokenService,
    IPasswordResetService passwordResetService,
    IEmailSender emailSender,
    IAuditWriter audit,
    ILogger<AuthService> logger) : IAuthService
{
    public async Task<AuthResponse?> LoginAsync(LoginRequest request, string? ipAddress, string? userAgent)
    {
        var user = await userManager.FindByEmailAsync(request.Email);
        if (user is null || !user.IsActive)
        {
            // Same response as wrong password: do not disclose account existence.
            await audit.WriteAsync("auth.login.failed", null, "User", request.Email, ipAddress, userAgent);
            return null;
        }

        if (await userManager.IsLockedOutAsync(user))
        {
            await audit.WriteAsync("auth.login.locked_out", user.Id, "User", user.Id.ToString(), ipAddress, userAgent);
            return null;
        }

        if (!await userManager.CheckPasswordAsync(user, request.Password))
        {
            await userManager.AccessFailedAsync(user); // counts toward lockout
            await audit.WriteAsync("auth.login.failed", user.Id, "User", user.Id.ToString(), ipAddress, userAgent);
            return null;
        }

        await userManager.ResetAccessFailedCountAsync(user);
        user.LastLoginAtUtc = DateTimeOffset.UtcNow;
        await userManager.UpdateAsync(user);

        var access = await tokenService.CreateAccessTokenAsync(user);
        var refresh = await tokenService.IssueRefreshTokenAsync(user, ipAddress);

        await audit.WriteAsync("auth.login.succeeded", user.Id, "User", user.Id.ToString(), ipAddress, userAgent);
        return new AuthResponse(access.Token, access.ExpiresAtUtc, refresh.RawToken);
    }

    public async Task<AuthResponse?> RefreshAsync(string rawRefreshToken, string? ipAddress)
    {
        var rotated = await tokenService.RotateRefreshTokenAsync(rawRefreshToken, ipAddress);
        if (rotated is null)
        {
            await audit.WriteAsync("auth.refresh.rejected", null, null, null, ipAddress);
            return null;
        }

        var (user, newToken) = rotated.Value;
        var access = await tokenService.CreateAccessTokenAsync(user);
        return new AuthResponse(access.Token, access.ExpiresAtUtc, newToken.RawToken);
    }

    public async Task ForgotPasswordAsync(ForgotPasswordRequest request, string? ipAddress)
    {
        var user = await userManager.FindByEmailAsync(request.Email);
        if (user is null || !user.IsActive)
        {
            // Neutral outcome; do the same amount of visible work either way.
            logger.LogInformation("Password reset requested for unknown or inactive account.");
            return;
        }

        var rawToken = await passwordResetService.CreateTokenAsync(user, ipAddress);

        // Placeholder email path (no SMTP in this milestone). The token is
        // passed only to the email abstraction, never logged or returned.
        await emailSender.SendAsync(
            user.Email!,
            "Shakti Udyog password reset",
            $"Use this one-time code to reset your password (valid 20 minutes): {rawToken}");

        await audit.WriteAsync("auth.password_reset.requested", user.Id, "User", user.Id.ToString(), ipAddress);
    }

    public async Task<bool> ResetPasswordAsync(ResetPasswordRequest request, string? ipAddress)
    {
        var user = await passwordResetService.ConsumeTokenAsync(request.Token);
        if (user is null)
        {
            await audit.WriteAsync("auth.password_reset.rejected", null, null, null, ipAddress);
            return false;
        }

        // Identity's own reset flow re-validates password policy and updates
        // the security stamp, which invalidates outstanding sessions.
        var identityToken = await userManager.GeneratePasswordResetTokenAsync(user);
        var result = await userManager.ResetPasswordAsync(user, identityToken, request.NewPassword);
        if (!result.Succeeded)
        {
            logger.LogWarning("Password reset failed policy validation for user {UserId}.", user.Id);
            return false;
        }

        await tokenService.RevokeAllRefreshTokensAsync(user.Id, ipAddress, "Password reset");
        await audit.WriteAsync("auth.password_reset.completed", user.Id, "User", user.Id.ToString(), ipAddress);

        await emailSender.SendAsync(
            user.Email!,
            "Shakti Udyog password changed",
            "Your password was just changed. If this was not you, contact support immediately.");

        return true;
    }

    public async Task LogoutAsync(string? rawRefreshToken, string? ipAddress)
    {
        if (!string.IsNullOrEmpty(rawRefreshToken))
        {
            await tokenService.RevokeRefreshTokenAsync(rawRefreshToken, ipAddress, "Logout");
        }

        await audit.WriteAsync("auth.logout", null, null, null, ipAddress);
    }

    public async Task<MeResponse?> GetMeAsync(Guid userId)
    {
        var user = await userManager.FindByIdAsync(userId.ToString());
        if (user is null || !user.IsActive)
        {
            return null;
        }

        var roles = await userManager.GetRolesAsync(user);
        var permissions = roles
            .SelectMany(r => RolePermissions.Defaults.TryGetValue(r, out var p) ? p : [])
            .Distinct()
            .ToList();

        return new MeResponse(user.Id, user.Email ?? string.Empty, user.FullName, roles.ToList(), permissions);
    }

    public async Task<AuthResponse?> RegisterAsync(RegisterRequest request, string? ipAddress, string? userAgent)
    {
        var existingUser = await userManager.FindByEmailAsync(request.Email);
        if (existingUser is not null)
        {
            // Same response as login failure: do not disclose account existence.
            await audit.WriteAsync("auth.register.failed", null, "User", request.Email, ipAddress, userAgent);
            return null;
        }

        var user = new ApplicationUser
        {
            UserName = request.Email,
            Email = request.Email,
            FullName = request.FullName,
            PhoneNumber = request.Phone,
            CompanyName = request.CompanyName,
            IsActive = true,
            CreatedAtUtc = DateTimeOffset.UtcNow,
        };

        var result = await userManager.CreateAsync(user, request.Password);
        if (!result.Succeeded)
        {
            var errors = string.Join(", ", result.Errors.Select(e => e.Description));
            logger.LogWarning("Registration failed for {Email}: {Errors}", request.Email, errors);
            await audit.WriteAsync("auth.register.failed", null, "User", request.Email, ipAddress, userAgent);
            return null;
        }

        // Assign default Customer role
        await userManager.AddToRoleAsync(user, Roles.Customer);

        // Generate tokens for immediate login
        var access = await tokenService.CreateAccessTokenAsync(user);
        var refresh = await tokenService.IssueRefreshTokenAsync(user, ipAddress);

        await audit.WriteAsync("auth.register.succeeded", user.Id, "User", user.Id.ToString(), ipAddress, userAgent);
        return new AuthResponse(access.Token, access.ExpiresAtUtc, refresh.RawToken);
    }
}
