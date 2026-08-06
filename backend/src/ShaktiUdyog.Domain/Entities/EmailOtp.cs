namespace ShaktiUdyog.Domain.Entities;

/// <summary>
/// One-time email code used to complete login (MFA-style step, requirement:
/// email OTP during login). Only the SHA-256 hash of the code is stored (never
/// the plain code). Codes are short-lived (5 minutes), single-use, and a
/// challenge is invalidated after a limited number of wrong attempts.
/// </summary>
public class EmailOtp
{
    public Guid Id { get; set; }

    public Guid UserId { get; set; }
    public ApplicationUser User { get; set; } = null!;

    /// <summary>SHA-256 hash (Base64) of the raw 6-digit code.</summary>
    public required string CodeHash { get; set; }

    public DateTimeOffset ExpiresAtUtc { get; set; }
    public DateTimeOffset CreatedAtUtc { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? UsedAtUtc { get; set; }

    /// <summary>Failed verification attempts; the challenge is burned once this crosses the threshold.</summary>
    public int Attempts { get; set; }
    public string? CreatedByIp { get; set; }

    public bool IsUsable => UsedAtUtc is null && DateTimeOffset.UtcNow < ExpiresAtUtc;
}
