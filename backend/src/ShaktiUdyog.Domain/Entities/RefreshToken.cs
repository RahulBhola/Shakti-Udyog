namespace ShaktiUdyog.Domain.Entities;

/// <summary>
/// Refresh token for JWT session renewal. Only the SHA-256 hash of the token
/// is stored — the raw value is returned to the client once and never persisted.
/// Rotation: each successful refresh revokes this token and records the hash of
/// its replacement, forming a chain. Reuse of a revoked token is treated as
/// theft and revokes the entire descendant chain.
/// </summary>
public class RefreshToken
{
    public Guid Id { get; set; }

    public Guid UserId { get; set; }
    public ApplicationUser User { get; set; } = null!;

    /// <summary>SHA-256 hash (Base64) of the raw token value.</summary>
    public required string TokenHash { get; set; }

    public DateTimeOffset ExpiresAtUtc { get; set; }
    public DateTimeOffset CreatedAtUtc { get; set; } = DateTimeOffset.UtcNow;
    public string? CreatedByIp { get; set; }

    public DateTimeOffset? RevokedAtUtc { get; set; }
    public string? RevokedByIp { get; set; }
    public string? RevocationReason { get; set; }

    /// <summary>Hash of the token that replaced this one during rotation.</summary>
    public string? ReplacedByTokenHash { get; set; }

    public bool IsExpired => DateTimeOffset.UtcNow >= ExpiresAtUtc;
    public bool IsRevoked => RevokedAtUtc is not null;
    public bool IsActive => !IsRevoked && !IsExpired;
}
