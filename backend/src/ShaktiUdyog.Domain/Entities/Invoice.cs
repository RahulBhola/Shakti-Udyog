using ShaktiUdyog.Domain.Constants;

namespace ShaktiUdyog.Domain.Entities;

public class Invoice
{
    public Guid Id { get; set; }
    public required string InvoiceNumber { get; set; }
    public Guid CompanyId { get; set; }
    public Company Company { get; set; } = null!;
    public Guid? OrderId { get; set; }
    public Order? Order { get; set; }
    public DateTimeOffset IssueDateUtc { get; set; }
    public DateTimeOffset? DueDateUtc { get; set; }
    public decimal Subtotal { get; set; }
    public decimal Tax { get; set; }
    public decimal Discount { get; set; }
    public decimal Freight { get; set; }
    public decimal Packing { get; set; }
    public decimal OtherCharges { get; set; }
    public decimal Total { get; set; }
    public decimal AmountPaid { get; set; }
    public decimal BalanceDue { get; set; }
    public string Currency { get; set; } = "INR";
    public string Status { get; set; } = InvoiceStatuses.Draft;
    public string? PaymentTerms { get; set; }
    public string? Notes { get; set; }
    public string? HsnSacCode { get; set; }
    public Guid? DocumentId { get; set; }
    public DateTimeOffset CreatedAtUtc { get; set; } = DateTimeOffset.UtcNow;
    public byte[] RowVersion { get; set; } = [];

    public List<InvoiceItem> Items { get; set; } = [];
    public List<InvoiceStatusHistory> StatusHistory { get; set; } = [];
    public List<InvoiceAttachment> Attachments { get; set; } = [];
}
