namespace ShaktiUdyog.Domain.Entities;

/// <summary>
/// Persistent user device/browser session. Represents a physical device or browser profile
/// login. Rotating refresh tokens belong to this session.
/// </summary>
public class UserSession
{
    public Guid Id { get; set; }

    public Guid UserId { get; set; }
    public ApplicationUser User { get; set; } = null!;

    public string DeviceName { get; set; } = string.Empty;
    public string DeviceType { get; set; } = "Unknown"; // Desktop, Mobile, Tablet, Unknown
    public string OperatingSystem { get; set; } = "Unknown"; // Windows, macOS, iOS, Android, Linux, Unknown
    public string Browser { get; set; } = "Unknown"; // Chrome, Safari, Edge, Firefox, Opera, Brave, Unknown

    public string? UserAgent { get; set; }
    public string? IpAddress { get; set; }
    public string? Location { get; set; }

    public DateTimeOffset CreatedAtUtc { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset LastActiveAtUtc { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset ExpiresAtUtc { get; set; } = DateTimeOffset.UtcNow.AddDays(90);

    public DateTimeOffset? RevokedAtUtc { get; set; }
    public string? RevocationReason { get; set; }

    /// <summary>
    /// Derived non-persisted active status.
    /// </summary>
    public bool IsActive => RevokedAtUtc is null && ExpiresAtUtc > DateTimeOffset.UtcNow;

    public ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();
}
