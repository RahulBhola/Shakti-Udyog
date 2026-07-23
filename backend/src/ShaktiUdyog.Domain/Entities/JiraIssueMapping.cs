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

    // Additional fields for richer Kanban display
    public string? Title { get; set; }
    public int? StoryPoints { get; set; }
    public string? Priority { get; set; } // High, Medium, Low
    public string? Assignee { get; set; }
    public string? AssigneeAvatarUrl { get; set; }
    public string? IssueType { get; set; } // Story, Task, Bug
    public string? ParentKey { get; set; } // Parent issue key if linked
    public string? Labels { get; set; } // Comma-separated labels
}
