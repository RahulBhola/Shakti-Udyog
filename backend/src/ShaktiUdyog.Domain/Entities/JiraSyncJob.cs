namespace ShaktiUdyog.Domain.Entities;

public class JiraSyncJob
{
    public Guid Id { get; set; }
    public required string JobType { get; set; } // Manual, Scheduled, Webhook
    public string Status { get; set; } = "Running";
    public int ItemsProcessed { get; set; }
    public int ItemsFailed { get; set; }
    public string? ErrorMessage { get; set; }
    public DateTimeOffset StartedAtUtc { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? CompletedAtUtc { get; set; }
}
