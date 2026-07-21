namespace ShaktiUdyog.Domain.Entities;

/// <summary>
/// Immutable record of every RFQ status transition (requirements §14,
/// Milestone 4 RFQ spec). Created alongside every status change for full
/// audit trail.
/// </summary>
public class RfqStatusHistory
{
    public Guid Id { get; set; }
    public Guid RfqId { get; set; }
    public Rfq Rfq { get; set; } = null!;
    public required string FromStatus { get; set; }
    public required string ToStatus { get; set; }
    public Guid? ChangedByUserId { get; set; }
    /// <summary>Role of the user who made the change (Customer, DataUpdater, Admin, System).</summary>
    public string ChangedByRole { get; set; } = "System";
    public string? Note { get; set; }
    public DateTimeOffset CreatedAtUtc { get; set; } = DateTimeOffset.UtcNow;
}
