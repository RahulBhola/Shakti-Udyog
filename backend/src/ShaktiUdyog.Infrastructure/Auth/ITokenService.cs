using ShaktiUdyog.Domain.Entities;

namespace ShaktiUdyog.Infrastructure.Auth;

public record AccessTokenResult(string Token, DateTimeOffset ExpiresAtUtc);

/// <summary>Raw refresh token (returned to client once) plus its stored entity.</summary>
public record RefreshTokenResult(string RawToken, RefreshToken Entity);

public interface ITokenService
{
    /// <summary>Creates a signed short-lived JWT with identity, role, and permission claims.</summary>
    Task<AccessTokenResult> CreateAccessTokenAsync(ApplicationUser user);

    /// <summary>Creates and persists a new refresh token (hash only stored).</summary>
    Task<RefreshTokenResult> IssueRefreshTokenAsync(ApplicationUser user, string? ipAddress);

    /// <summary>
    /// Validates a raw refresh token and rotates it: the presented token is
    /// revoked and a replacement is issued. Reuse of an already-revoked token
    /// revokes the user's entire active token chain and fails.
    /// Returns null when the token is invalid, expired, or reused.
    /// </summary>
    Task<(ApplicationUser User, RefreshTokenResult NewToken)?> RotateRefreshTokenAsync(string rawToken, string? ipAddress);

    /// <summary>Revokes the refresh token presented at logout. Idempotent.</summary>
    Task RevokeRefreshTokenAsync(string rawToken, string? ipAddress, string reason);

    /// <summary>Revokes all active refresh tokens for a user (password reset, deactivation).</summary>
    Task RevokeAllRefreshTokensAsync(Guid userId, string? ipAddress, string reason);

    /// <summary>Computes the storage hash for a raw token value.</summary>
    string HashToken(string rawToken);
}
