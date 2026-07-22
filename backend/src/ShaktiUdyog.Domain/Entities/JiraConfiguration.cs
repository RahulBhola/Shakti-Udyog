namespace ShaktiUdyog.Domain.Entities;

public class JiraConfiguration
{
    public Guid Id { get; set; }
    public required string JiraUrl { get; set; }
    public required string ProjectKey { get; set; }
    public required string ApiToken { get; set; }
    public required string Email { get; set; }
    public string? WebhookSecret { get; set; }
    public string? IssueTypeMappings { get; set; }
    public bool IsConnected { get; set; }
    public DateTimeOffset? LastSyncAtUtc { get; set; }
    public DateTimeOffset CreatedAtUtc { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? UpdatedAtUtc { get; set; }
}
