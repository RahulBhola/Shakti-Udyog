namespace ShaktiUdyog.Domain.Entities;

/// <summary>
/// Public request-for-quotation submission (requirements §10/§14). Drawing
/// file storage and the RFQ→quotation workflow arrive in Milestone 4; this
/// milestone captures the validated submission only.
/// </summary>
public class Rfq
{
    public Guid Id { get; set; }
    /// <summary>Set when submitted from the customer portal; null for anonymous public RFQs.</summary>
    public Guid? CompanyId { get; set; }
    public Company? Company { get; set; }
    public Guid? SubmittedByUserId { get; set; }
    /// <summary>Portal drafts are editable and excluded from staff review queues.</summary>
    public bool IsDraft { get; set; }
    public List<RfqFile> Files { get; set; } = [];
    public List<RfqItem> Items { get; set; } = [];
    public List<RfqStatusHistory> StatusHistory { get; set; } = [];
    public List<RfqComment> Comments { get; set; } = [];
    public List<RfqAssignment> Assignments { get; set; } = [];
    public required string FullName { get; set; }
    public required string CompanyName { get; set; }
    public required string Email { get; set; }
    public required string Phone { get; set; }
    public required string ProductType { get; set; }
    public string? MaterialGrade { get; set; }
    public required string Quantity { get; set; }
    public string? DeliveryLocation { get; set; }
    public required string RequirementDetails { get; set; }
    public bool ConsentGiven { get; set; }
    public string Status { get; set; } = "Received";
    public DateTimeOffset CreatedAtUtc { get; set; } = DateTimeOffset.UtcNow;
    public string? SubmittedByIp { get; set; }
    /// <summary>Soft-delete flag; records are never hard-deleted.</summary>
    public bool IsDeleted { get; set; }
    public DateTimeOffset? DeletedAtUtc { get; set; }
    /// <summary>Optimistic concurrency token.</summary>
    public byte[] RowVersion { get; set; } = [];
}
