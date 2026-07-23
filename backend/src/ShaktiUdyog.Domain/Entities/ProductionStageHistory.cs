namespace ShaktiUdyog.Domain.Entities;

/// <summary>
/// Audit trail of production stage transitions for a job.
/// Records every drag-drop move and manual stage change.
/// </summary>
public class ProductionStageHistory
{
    public Guid Id { get; set; }
    public Guid JobId { get; set; }
    public ProductionJob Job { get; set; } = null!;
    public required string FromStage { get; set; }
    public required string ToStage { get; set; }
    public string? Remarks { get; set; }
    public string? ChangedByUserId { get; set; }
    public string? ChangedByName { get; set; }
    public DateTimeOffset OccurredAtUtc { get; set; } = DateTimeOffset.UtcNow;
}
