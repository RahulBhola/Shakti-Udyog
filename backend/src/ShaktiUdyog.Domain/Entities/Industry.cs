namespace ShaktiUdyog.Domain.Entities;

/// <summary>Target industry for casting applications (Milestone 8 Phase 2).</summary>
public class Industry
{
    public Guid Id { get; set; }
    public required string Name { get; set; }
    public string? Description { get; set; }
    public string? ExampleComponents { get; set; }
    public bool IsActive { get; set; } = true;
    public int DisplayOrder { get; set; }
    public DateTimeOffset CreatedAtUtc { get; set; } = DateTimeOffset.UtcNow;
}
