namespace ShaktiUdyog.Domain.Entities;

/// <summary>Approval action record for a quotation.</summary>
public class QuotationApproval
{
    public Guid Id { get; set; }
    public Guid QuotationId { get; set; }
    public Quotation Quotation { get; set; } = null!;
    public Guid ApprovedByUserId { get; set; }
    public string Action { get; set; } = "Approved"; // Approved | Rejected
    public string? Comment { get; set; }
    public DateTimeOffset CreatedAtUtc { get; set; } = DateTimeOffset.UtcNow;
}
