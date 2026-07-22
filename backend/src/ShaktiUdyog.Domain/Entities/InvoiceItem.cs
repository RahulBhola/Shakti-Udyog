namespace ShaktiUdyog.Domain.Entities;

public class InvoiceItem
{
    public Guid Id { get; set; }
    public Guid InvoiceId { get; set; }
    public Invoice Invoice { get; set; } = null!;
    public required string Description { get; set; }
    public string? HsnSacCode { get; set; }
    public int Quantity { get; set; }
    public string Unit { get; set; } = "pcs";
    public decimal UnitPrice { get; set; }
    public decimal TaxPercent { get; set; }
    public decimal LineTotal { get; set; }
}
