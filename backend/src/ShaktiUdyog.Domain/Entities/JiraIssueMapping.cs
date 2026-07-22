namespace ShaktiUdyog.Domain.Entities;

public class JiraIssueMapping
{
    public Guid Id { get; set; }
    public required string EntityType { get; set; } // RFQ, Quotation, Order, SupportRequest
    public Guid EntityId { get; set; }
    public required string JiraIssueKey { get; set; }
    public required string JiraIssueUrl { get; set; }
    public string Status { get; set; } = "Created";
    public DateTimeOffset CreatedAtUtc { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? LastSyncAtUtc { get; set; }
}
