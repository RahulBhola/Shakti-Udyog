namespace ShaktiUdyog.Domain.Entities;

/// <summary>
/// Immutable record of every Enquiry status transition (requirements §14,
/// Milestone 4 Enquiry spec). Created alongside every status change for full
/// audit trail.
/// </summary>
public class EnquiryStatusHistory
{
    public Guid Id { get; set; }
    public Guid EnquiryId { get; set; }
    public Enquiry Enquiry { get; set; } = null!;
    public required string FromStatus { get; set; }
    public required string ToStatus { get; set; }
    public Guid? ChangedByUserId { get; set; }
    /// <summary>Role of the user who made the change (Customer, Engineer, Admin, System).</summary>
    public string ChangedByRole { get; set; } = "System";
    public string? Note { get; set; }
    public DateTimeOffset CreatedAtUtc { get; set; } = DateTimeOffset.UtcNow;
}
