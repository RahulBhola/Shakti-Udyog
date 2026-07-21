using ShaktiUdyog.Domain.Constants;

namespace ShaktiUdyog.Domain.Entities;

/// <summary>
/// Invoice against an order (requirements §14/§20). Issued invoices are never
/// overwritten — corrections use credit notes / revisions with an audit trail
/// (enforced by staff workflows in a later milestone).
/// </summary>
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
    public decimal Total { get; set; }
    public decimal AmountPaid { get; set; }
    public decimal BalanceDue { get; set; }
    public string Currency { get; set; } = "INR";
    public string Status { get; set; } = InvoiceStatuses.Draft;
    /// <summary>Invoice PDF in protected storage, when available.</summary>
    public Guid? DocumentId { get; set; }
    public DateTimeOffset CreatedAtUtc { get; set; } = DateTimeOffset.UtcNow;
}
