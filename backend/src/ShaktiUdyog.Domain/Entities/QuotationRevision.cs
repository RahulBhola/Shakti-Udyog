namespace ShaktiUdyog.Domain.Entities;

/// <summary>Revision history for a quotation when it is updated and re-issued.</summary>
public class QuotationRevision
{
    public Guid Id { get; set; }
    public Guid QuotationId { get; set; }
    public Quotation Quotation { get; set; } = null!;
    public int RevisionNumber { get; set; }
    public decimal PreviousTotal { get; set; }
    public decimal NewTotal { get; set; }
    public string? ChangeNotes { get; set; }
    public Guid ChangedByUserId { get; set; }
    public DateTimeOffset CreatedAtUtc { get; set; } = DateTimeOffset.UtcNow;
}
