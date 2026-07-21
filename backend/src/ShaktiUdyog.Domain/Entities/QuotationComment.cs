namespace ShaktiUdyog.Domain.Entities;

/// <summary>Internal or customer-visible comment on a quotation.</summary>
public class QuotationComment
{
    public Guid Id { get; set; }
    public Guid QuotationId { get; set; }
    public Quotation Quotation { get; set; } = null!;
    public Guid AuthorUserId { get; set; }
    public string AuthorRole { get; set; } = "Staff";
    public bool IsCustomerVisible { get; set; }
    public required string Message { get; set; }
    public DateTimeOffset CreatedAtUtc { get; set; } = DateTimeOffset.UtcNow;
}
