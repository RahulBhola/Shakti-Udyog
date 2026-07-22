namespace ShaktiUdyog.Domain.Entities;

public class InvoiceStatusHistory
{
    public Guid Id { get; set; }
    public Guid InvoiceId { get; set; }
    public Invoice Invoice { get; set; } = null!;
    public required string FromStatus { get; set; }
    public required string ToStatus { get; set; }
    public Guid? ChangedByUserId { get; set; }
    public string ChangedByRole { get; set; } = "System";
    public string? Note { get; set; }
    public DateTimeOffset CreatedAtUtc { get; set; } = DateTimeOffset.UtcNow;
}
