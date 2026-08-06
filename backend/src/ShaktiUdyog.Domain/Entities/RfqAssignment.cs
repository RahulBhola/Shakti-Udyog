namespace ShaktiUdyog.Domain.Entities;

/// <summary>
/// Tracks staff (Data Updater) assignment to an RFQ (Milestone 4 RFQ spec).
/// Only the most recent active assignment per RFQ is used for routing; history
/// is preserved for audit.
/// </summary>
public class RfqAssignment
{
    public Guid Id { get; set; }
    public Guid RfqId { get; set; }
    public Rfq Rfq { get; set; } = null!;
    public Guid AssignedToUserId { get; set; }
    public Guid AssignedByUserId { get; set; }
    /// <summary>True when this is the current active assignment; historical entries are false.</summary>
    public bool IsActive { get; set; } = true;
    public DateTimeOffset AssignedAtUtc { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? UnassignedAtUtc { get; set; }
}
