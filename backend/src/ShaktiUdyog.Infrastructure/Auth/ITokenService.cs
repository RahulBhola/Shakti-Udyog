using ShaktiUdyog.Domain.Entities;

namespace ShaktiUdyog.Infrastructure.Auth;

public record AccessTokenResult(string Token, DateTimeOffset ExpiresAtUtc, Guid? SessionId = null);

/// <summary>Raw refresh token (returned to client once) plus its stored entity.</summary>
public record RefreshTokenResult(string RawToken, RefreshToken Entity);

public interface ITokenService
{
    /// <summary>Creates a signed short-lived JWT with identity, role, permission, and session (sid) claims.</summary>
    Task<AccessTokenResult> CreateAccessTokenAsync(ApplicationUser user, Guid? sessionId = null);

    /// <summary>Creates and persists a new refresh token and associated UserSession (if sessionId is not provided).</summary>
    Task<RefreshTokenResult> IssueRefreshTokenAsync(ApplicationUser user, string? ipAddress, string? userAgent = null, Guid? sessionId = null);

    /// <summary>
    /// Validates a raw refresh token and rotates it: the presented token is
    /// revoked and a replacement is issued under the same UserSession. Reuse of an
    /// already-revoked token revokes the entire session/token family and fails.
    /// Returns null when the token is invalid, expired, or reused.
    /// </summary>
    Task<(ApplicationUser User, RefreshTokenResult NewToken, Guid SessionId)?> RotateRefreshTokenAsync(string rawToken, string? ipAddress, string? userAgent = null);

    /// <summary>Revokes the refresh token presented at logout. Idempotent.</summary>
    Task RevokeRefreshTokenAsync(string rawToken, string? ipAddress, string reason);

    /// <summary>Revokes all active refresh tokens for a user (password reset, deactivation).</summary>
    Task RevokeAllRefreshTokensAsync(Guid userId, string? ipAddress, string reason);

    /// <summary>Retrieves all active (non-revoked and non-expired) sessions for a user.</summary>
    Task<IReadOnlyList<UserSession>> GetActiveSessionsAsync(Guid userId);

    /// <summary>Revokes a specific session and all its active refresh tokens. Validates user ownership.</summary>
    Task<bool> RevokeSessionAsync(Guid sessionId, Guid userId, string? ipAddress, string reason);

    /// <summary>Revokes all sessions for a user other than the current session.</summary>
    Task<IReadOnlyList<Guid>> RevokeOtherSessionsAsync(Guid currentSessionId, Guid userId, string? ipAddress, string reason);

    /// <summary>Computes the storage hash for a raw token value.</summary>
    string HashToken(string rawToken);
}
