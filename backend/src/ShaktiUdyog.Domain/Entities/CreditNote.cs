namespace ShaktiUdyog.Domain.Entities;

public class CreditNote
{
    public Guid Id { get; set; }
    public required string CreditNoteNumber { get; set; }
    public Guid InvoiceId { get; set; }
    public Invoice Invoice { get; set; } = null!;
    public Guid CompanyId { get; set; }
    public Company Company { get; set; } = null!;
    public decimal Total { get; set; }
    public string Currency { get; set; } = "INR";
    public required string Reason { get; set; }
    public string Status { get; set; } = "Issued";
    public DateTimeOffset CreatedAtUtc { get; set; } = DateTimeOffset.UtcNow;
}
