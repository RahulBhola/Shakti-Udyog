namespace ShaktiUdyog.Domain.Entities;

/// <summary>
/// Lookup table for the 25 production workflow stages.
/// Pre-seeded with the standard iron casting workflow.
/// </summary>
public class ProductionStage
{
    public Guid Id { get; set; }
    public required string Name { get; set; }
    public int SortOrder { get; set; }
    public bool IsActive { get; set; } = true;
    public string? Color { get; set; }
    public string? Icon { get; set; }
    public DateTimeOffset CreatedAtUtc { get; set; } = DateTimeOffset.UtcNow;
}
