namespace ShaktiUdyog.Domain.Entities;

/// <summary>Line item within a quotation (Milestone 5 spec).</summary>
public class QuotationItem
{
    public Guid Id { get; set; }
    public Guid QuotationId { get; set; }
    public Quotation Quotation { get; set; } = null!;
    public int LineNumber { get; set; }
    public required string PartNumber { get; set; }
    public required string Description { get; set; }
    public string? MaterialGrade { get; set; }
    public int Quantity { get; set; }
    public string Unit { get; set; } = "pcs";
    public decimal UnitPrice { get; set; }
    public decimal TaxPercent { get; set; }
    public decimal LineTotal { get; set; }
}
