namespace ShaktiUdyog.Domain.Entities;

/// <summary>
/// Line-item detail on an RFQ (Milestone 4 RFQ spec). Enables multi-part RFQs
/// where the customer specifies several casting line items in one request.
/// </summary>
public class RfqItem
{
    public Guid Id { get; set; }
    public Guid RfqId { get; set; }
    public Rfq Rfq { get; set; } = null!;
    public required string PartNumber { get; set; }
    public required string Description { get; set; }
    public string? MaterialGrade { get; set; }
    public int Quantity { get; set; }
    public string Unit { get; set; } = "pcs";
    public string? DrawingRevision { get; set; }
}
