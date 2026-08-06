namespace ShaktiUdyog.Domain.Entities;

/// <summary>
/// Activity timeline events for a production job.
/// Records all significant actions and state changes.
/// </summary>
public class ProductionTimeline
{
    public Guid Id { get; set; }
    public Guid JobId { get; set; }
    public ProductionJob Job { get; set; } = null!;
    public required string Event { get; set; }
    public string? Details { get; set; }
    public string? ActorName { get; set; }
    public DateTimeOffset OccurredAtUtc { get; set; } = DateTimeOffset.UtcNow;
}
