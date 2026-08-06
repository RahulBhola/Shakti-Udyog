using ShaktiUdyog.Domain.Constants;

namespace ShaktiUdyog.Domain.Entities;

/// <summary>In-app notification for a portal user (requirements §14).</summary>
public class Notification
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public ApplicationUser User { get; set; } = null!;
    /// <summary>One of Constants.NotificationTypes.</summary>
    public string Type { get; set; } = NotificationTypes.General;
    public required string Title { get; set; }
    public string? Body { get; set; }
    /// <summary>Portal-relative link, e.g. /customer/orders/{id}.</summary>
    public string? LinkPath { get; set; }
    public bool IsRead { get; set; }
    public DateTimeOffset CreatedAtUtc { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? ReadAtUtc { get; set; }
}
