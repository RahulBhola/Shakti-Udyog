namespace ShaktiUdyog.Domain.Entities;

/// <summary>
/// Line-item detail on an Enquiry (Milestone 4 Enquiry spec). Enables multi-part Enquirys
/// where the customer specifies several casting line items in one request.
/// </summary>
public class EnquiryItem
{
    public Guid Id { get; set; }
    public Guid EnquiryId { get; set; }
    public Enquiry Enquiry { get; set; } = null!;
    public required string PartNumber { get; set; }
    public required string Description { get; set; }
    public string? MaterialGrade { get; set; }
    public int Quantity { get; set; }
    public string Unit { get; set; } = "pcs";
    public string? DrawingRevision { get; set; }
}
