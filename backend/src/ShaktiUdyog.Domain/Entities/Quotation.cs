using ShaktiUdyog.Domain.Constants;

namespace ShaktiUdyog.Domain.Entities;

/// <summary>
/// Quotation issued against an RFQ (requirements §14/§20, Milestone 5 spec).
/// Extended with line items, commercial terms, approval tracking, and
/// revision history. Amount and terms are set only by internal staff;
/// customers may only accept/decline with a comment.
/// </summary>
public class Quotation
{
    public Guid Id { get; set; }
    public required string QuotationNumber { get; set; }
    public int RevisionNumber { get; set; } = 1;
    public Guid RfqId { get; set; }
    public Rfq Rfq { get; set; } = null!;
    public Guid CompanyId { get; set; }
    public Company Company { get; set; } = null!;
    public decimal Subtotal { get; set; }
    public decimal Tax { get; set; }
    public decimal Discount { get; set; }
    public decimal Total { get; set; }
    public string Currency { get; set; } = "INR";
    public DateTimeOffset? ValidUntilUtc { get; set; }
    public string? PaymentTerms { get; set; }
    public string? DeliveryTerms { get; set; }
    public string? Freight { get; set; }
    public string? Packing { get; set; }
    public string? Remarks { get; set; }
    public string Status { get; set; } = QuotationStatuses.Draft;
    public string? CustomerResponseComment { get; set; }
    public DateTimeOffset? CustomerRespondedAtUtc { get; set; }
    public Guid? RespondedByUserId { get; set; }
    public Guid? PreparedById { get; set; }
    public Guid? ApprovedById { get; set; }
    /// <summary>Quotation PDF in protected storage, when available.</summary>
    public Guid? DocumentId { get; set; }
    public bool IsDeleted { get; set; }
    public DateTimeOffset? DeletedAtUtc { get; set; }
    public DateTimeOffset CreatedAtUtc { get; set; } = DateTimeOffset.UtcNow;
    public byte[] RowVersion { get; set; } = [];

    // Navigation properties
    public List<QuotationItem> Items { get; set; } = [];
    public List<QuotationStatusHistory> StatusHistory { get; set; } = [];
    public List<QuotationComment> Comments { get; set; } = [];
    public List<QuotationAttachment> Attachments { get; set; } = [];
    public List<QuotationRevision> Revisions { get; set; } = [];
    public List<QuotationApproval> Approvals { get; set; } = [];
}
