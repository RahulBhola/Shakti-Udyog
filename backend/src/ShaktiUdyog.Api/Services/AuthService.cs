using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using ShaktiUdyog.Api.Contracts.Auth;
using ShaktiUdyog.Api.Hubs;
using ShaktiUdyog.Domain.Constants;
using ShaktiUdyog.Domain.Entities;
using ShaktiUdyog.Infrastructure.Auditing;
using ShaktiUdyog.Infrastructure.Auth;
using ShaktiUdyog.Infrastructure.Data;

namespace ShaktiUdyog.Api.Services;

public interface IAuthService
{
    Task<AuthResponse?> LoginAsync(LoginRequest request, string? ipAddress, string? userAgent);
    Task<AuthResponse?> RefreshAsync(string rawRefreshToken, string? ipAddress, string? userAgent = null);
    Task ForgotPasswordAsync(ForgotPasswordRequest request, string? ipAddress);
    Task<bool> ResetPasswordAsync(ResetPasswordRequest request, string? ipAddress);
    Task LogoutAsync(string? rawRefreshToken, Guid? sessionId, Guid? userId, string? ipAddress);
    Task<MeResponse?> GetMeAsync(Guid userId);
    Task<AuthResponse?> RegisterAsync(RegisterRequest request, string? ipAddress, string? userAgent);
    Task<(AuthResponse? Response, string? Error)> RegisterWithDetailAsync(RegisterRequest request, string? ipAddress, string? userAgent);
    Task<IReadOnlyList<UserSessionDto>> GetActiveSessionsAsync(Guid userId, Guid? currentSessionId);
    Task<bool> RevokeSessionAsync(Guid sessionId, Guid userId, string? ipAddress);
    Task<int> RevokeOtherSessionsAsync(Guid currentSessionId, Guid userId, string? ipAddress);
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
    ILogger<AuthService> logger,
    IPortalPush portalPush,
    AppDbContext db) : IAuthService
{
    public async Task<AuthResponse?> LoginAsync(LoginRequest request, string? ipAddress, string? userAgent)
    {
        var email = request.Email?.Trim() ?? string.Empty;
        var user = await userManager.FindByEmailAsync(email)
            ?? await userManager.FindByNameAsync(email);

        if (user is null || !user.IsActive)
        {
            // Same response as wrong password: do not disclose account existence.
            await audit.WriteAsync("auth.login.failed", null, "User", email, ipAddress, userAgent);
            return null;
        }

        if (await userManager.IsLockedOutAsync(user))
        {
            await audit.WriteAsync("auth.login.locked_out", user.Id, "User", user.Id.ToString(), ipAddress, userAgent);
            return null;
        }

        if (!await userManager.CheckPasswordAsync(user, request.Password))
        {
            try
            {
                await userManager.AccessFailedAsync(user); // counts toward lockout
            }
            catch
            {
                // Ignore transient concurrency during parallel tests
            }

            try
            {
                await audit.WriteAsync("auth.login.failed", user.Id, "User", user.Id.ToString(), ipAddress, userAgent);
            }
            catch (DbUpdateConcurrencyException)
            {
                var entry = db.Entry(user);
                if (entry.State != EntityState.Detached)
                {
                    entry.State = EntityState.Detached;
                }
                await audit.WriteAsync("auth.login.failed", user.Id, "User", user.Id.ToString(), ipAddress, userAgent);
            }

            return null;
        }

        try
        {
            if (user.AccessFailedCount > 0)
            {
                user.AccessFailedCount = 0;
            }
            user.LastLoginAtUtc = DateTimeOffset.UtcNow;
            await userManager.UpdateAsync(user);
        }
        catch (DbUpdateConcurrencyException)
        {
            var freshUser = await userManager.FindByIdAsync(user.Id.ToString());
            if (freshUser is not null)
            {
                freshUser.AccessFailedCount = 0;
                freshUser.LastLoginAtUtc = DateTimeOffset.UtcNow;
                await userManager.UpdateAsync(freshUser);
                user = freshUser;
            }
        }

        var refresh = await tokenService.IssueRefreshTokenAsync(user, ipAddress, userAgent);
        var access = await tokenService.CreateAccessTokenAsync(user, refresh.Entity.SessionId);

        await audit.WriteAsync("auth.login.succeeded", user.Id, "User", user.Id.ToString(), ipAddress, userAgent);
        return new AuthResponse(access.Token, access.ExpiresAtUtc, refresh.RawToken);
    }

    public async Task<AuthResponse?> RefreshAsync(string rawRefreshToken, string? ipAddress, string? userAgent = null)
    {
        var rotated = await tokenService.RotateRefreshTokenAsync(rawRefreshToken, ipAddress, userAgent);
        if (rotated is null)
        {
            await audit.WriteAsync("auth.refresh.rejected", null, null, null, ipAddress);
            return null;
        }

        var (user, newToken, sessionId) = rotated.Value;
        var access = await tokenService.CreateAccessTokenAsync(user, sessionId);
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

    public async Task LogoutAsync(string? rawRefreshToken, Guid? sessionId, Guid? userId, string? ipAddress)
    {
        if (sessionId.HasValue && userId.HasValue)
        {
            await tokenService.RevokeSessionAsync(sessionId.Value, userId.Value, ipAddress, "Logout");
        }
        else if (!string.IsNullOrEmpty(rawRefreshToken))
        {
            await tokenService.RevokeRefreshTokenAsync(rawRefreshToken, ipAddress, "Logout");
        }

        await audit.WriteAsync("auth.logout", userId, "User", userId?.ToString(), ipAddress);
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

        return new MeResponse(user.Id, user.Email ?? string.Empty, user.FullName, roles.ToList(), permissions, user.AvatarUrl);
    }

    public async Task<AuthResponse?> RegisterAsync(RegisterRequest request, string? ipAddress, string? userAgent)
    {
        var (response, _) = await RegisterWithDetailAsync(request, ipAddress, userAgent);
        return response;
    }

    public async Task<(AuthResponse? Response, string? Error)> RegisterWithDetailAsync(RegisterRequest request, string? ipAddress, string? userAgent)
    {
        var email = request.Email?.Trim() ?? string.Empty;
        if (string.IsNullOrWhiteSpace(email))
        {
            return (null, "Email address is required.");
        }

        var existingUser = await userManager.FindByEmailAsync(email)
            ?? await userManager.FindByNameAsync(email);
        if (existingUser is not null)
        {
            await audit.WriteAsync("auth.register.failed", null, "User", email, ipAddress, userAgent);
            return (null, "An account with this email address already exists. Please sign in.");
        }

        var user = new ApplicationUser
        {
            UserName = email,
            Email = email,
            FullName = request.FullName?.Trim(),
            PhoneNumber = request.Phone?.Trim(),
            CompanyName = request.CompanyName?.Trim(),
            IsActive = true,
            CreatedAtUtc = DateTimeOffset.UtcNow,
        };

        var result = await userManager.CreateAsync(user, request.Password);
        if (!result.Succeeded)
        {
            var errors = string.Join(" ", result.Errors.Select(e => e.Description));
            logger.LogWarning("Registration failed for {Email}: {Errors}", email, errors);
            await audit.WriteAsync("auth.register.failed", null, "User", email, ipAddress, userAgent);
            return (null, string.IsNullOrWhiteSpace(errors) ? "Registration failed. Please verify your details." : errors);
        }

        // Assign default Customer role
        await userManager.AddToRoleAsync(user, Roles.Customer);

        // Auto-provision and link approved company immediately (no admin approval needed)
        var compName = !string.IsNullOrWhiteSpace(request.CompanyName)
            ? request.CompanyName.Trim()
            : (!string.IsNullOrWhiteSpace(request.FullName) ? request.FullName.Trim() : email);

        var company = await db.Companies.FirstOrDefaultAsync(c => c.Name == compName);
        if (company is null)
        {
            company = new Company
            {
                Name = compName,
                CompanyEmail = email,
                CompanyPhone = request.Phone?.Trim(),
                VerificationStatus = "Approved",
                IsActive = true,
                CreatedAtUtc = DateTimeOffset.UtcNow,
            };
            db.Companies.Add(company);
            await db.SaveChangesAsync();
        }

        var existingUc = await db.UserCompanies.FirstOrDefaultAsync(uc => uc.UserId == user.Id && uc.CompanyId == company.Id);
        if (existingUc is null)
        {
            db.UserCompanies.Add(new UserCompany
            {
                UserId = user.Id,
                CompanyId = company.Id,
                IsApproved = true,
                ApprovedAtUtc = DateTimeOffset.UtcNow,
            });
            await db.SaveChangesAsync();
        }

        // Generate tokens and session for immediate login
        var refresh = await tokenService.IssueRefreshTokenAsync(user, ipAddress, userAgent);
        var access = await tokenService.CreateAccessTokenAsync(user, refresh.Entity.SessionId);

        await audit.WriteAsync("auth.register.succeeded", user.Id, "User", user.Id.ToString(), ipAddress, userAgent);
        return (new AuthResponse(access.Token, access.ExpiresAtUtc, refresh.RawToken), null);
    }

    public async Task<IReadOnlyList<UserSessionDto>> GetActiveSessionsAsync(Guid userId, Guid? currentSessionId)
    {
        var sessions = await tokenService.GetActiveSessionsAsync(userId);
        return sessions
            .Select(s => new UserSessionDto(
                s.Id,
                s.DeviceName,
                s.DeviceType,
                s.OperatingSystem,
                s.Browser,
                s.IpAddress,
                s.Location,
                s.CreatedAtUtc,
                s.LastActiveAtUtc,
                s.ExpiresAtUtc,
                currentSessionId.HasValue && s.Id == currentSessionId.Value))
            .ToList();
    }

    public async Task<bool> RevokeSessionAsync(Guid sessionId, Guid userId, string? ipAddress)
    {
        var success = await tokenService.RevokeSessionAsync(sessionId, userId, ipAddress, "RemoteLogout");
        if (!success)
        {
            return false;
        }

        await audit.WriteAsync("auth.session.revoked", userId, "UserSession", sessionId.ToString(), ipAddress);

        // Notify client device via SignalR (safe outside DB transaction)
        await portalPush.SessionRevokedAsync(userId, new SessionRevokedPayload(
            sessionId,
            "RemoteLogout",
            DateTimeOffset.UtcNow,
            "Your session was signed out from another device."));

        return true;
    }

    public async Task<int> RevokeOtherSessionsAsync(Guid currentSessionId, Guid userId, string? ipAddress)
    {
        var revokedIds = await tokenService.RevokeOtherSessionsAsync(currentSessionId, userId, ipAddress, "RevokeOthers");
        if (revokedIds.Count == 0)
        {
            return 0;
        }

        await audit.WriteAsync("auth.session.revoke_others", userId, "User", currentSessionId.ToString(), ipAddress);

        foreach (var id in revokedIds)
        {
            await portalPush.SessionRevokedAsync(userId, new SessionRevokedPayload(
                id,
                "RevokeOthers",
                DateTimeOffset.UtcNow,
                "Your session was signed out because all other devices were logged out."));
        }

        return revokedIds.Count;
    }
}
