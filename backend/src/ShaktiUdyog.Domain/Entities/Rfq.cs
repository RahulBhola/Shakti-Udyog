namespace ShaktiUdyog.Domain.Entities;

/// <summary>
/// Public request-for-quotation submission (requirements §10/§14). Drawing
/// file storage and the RFQ→quotation workflow arrive in Milestone 4; this
/// milestone captures the validated submission only.
/// </summary>
public class Rfq
{
    public Guid Id { get; set; }
    public required string FullName { get; set; }
    public required string CompanyName { get; set; }
    public required string Email { get; set; }
    public required string Phone { get; set; }
    public required string ProductType { get; set; }
    public string? MaterialGrade { get; set; }
    public required string Quantity { get; set; }
    public string? DeliveryLocation { get; set; }
    public required string RequirementDetails { get; set; }
    public bool ConsentGiven { get; set; }
    public string Status { get; set; } = "Received";
    public DateTimeOffset CreatedAtUtc { get; set; } = DateTimeOffset.UtcNow;
    public string? SubmittedByIp { get; set; }
}
