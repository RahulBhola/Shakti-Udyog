namespace ShaktiUdyog.Domain.Entities;

/// <summary>
/// Department lookup for the production floor.
/// Pre-seeded with standard iron casting departments.
/// </summary>
public class ProductionDepartment
{
    public Guid Id { get; set; }
    public required string Name { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTimeOffset CreatedAtUtc { get; set; } = DateTimeOffset.UtcNow;
}
