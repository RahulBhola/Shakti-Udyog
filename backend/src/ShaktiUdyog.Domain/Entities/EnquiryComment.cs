namespace ShaktiUdyog.Domain.Entities;

/// <summary>
/// Internal or customer-visible comment on an Enquiry (Milestone 4 Enquiry spec).
/// Internal notes are never exposed through customer APIs; customer-visible
/// comments appear in the customer portal timeline.
/// </summary>
public class EnquiryComment
{
    public Guid Id { get; set; }
    public Guid EnquiryId { get; set; }
    public Enquiry Enquiry { get; set; } = null!;
    public Guid AuthorUserId { get; set; }
    public string AuthorRole { get; set; } = "Staff";
    /// <summary>When false, this comment is visible only to staff (internal note).</summary>
    public bool IsCustomerVisible { get; set; }
    public required string Message { get; set; }
    public DateTimeOffset CreatedAtUtc { get; set; } = DateTimeOffset.UtcNow;
}
