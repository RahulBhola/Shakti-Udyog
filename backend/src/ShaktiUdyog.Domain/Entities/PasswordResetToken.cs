namespace ShaktiUdyog.Domain.Entities;

/// <summary>
/// One-time password-reset token. Only the SHA-256 hash is stored (requirements
/// §19: "Store only hashed reset tokens; never save reset tokens in plain
/// text"). Tokens are short-lived and invalidated on first use.
/// </summary>
public class PasswordResetToken
{
    public Guid Id { get; set; }

    public Guid UserId { get; set; }
    public ApplicationUser User { get; set; } = null!;

    /// <summary>SHA-256 hash (Base64) of the raw token value.</summary>
    public required string TokenHash { get; set; }

    public DateTimeOffset ExpiresAtUtc { get; set; }
    public DateTimeOffset CreatedAtUtc { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? UsedAtUtc { get; set; }
    public string? RequestedByIp { get; set; }

    public bool IsUsable => UsedAtUtc is null && DateTimeOffset.UtcNow < ExpiresAtUtc;
}
