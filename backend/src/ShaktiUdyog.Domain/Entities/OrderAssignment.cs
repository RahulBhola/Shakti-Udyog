namespace ShaktiUdyog.Domain.Entities;

/// <summary>
/// Tracks staff (Engineer) assignment to an Order. Only the most recent active
/// assignment per Order is used for routing; history is preserved for audit.
/// The Order.AssignedToUserId denormalizes the current assignee for fast listing.
/// </summary>
public class OrderAssignment
{
    public Guid Id { get; set; }
    public Guid OrderId { get; set; }
    public Order Order { get; set; } = null!;
    public Guid AssignedToUserId { get; set; }
    public Guid AssignedByUserId { get; set; }
    /// <summary>True when this is the current active assignment; historical entries are false.</summary>
    public bool IsActive { get; set; } = true;
    public DateTimeOffset AssignedAtUtc { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? UnassignedAtUtc { get; set; }
}
