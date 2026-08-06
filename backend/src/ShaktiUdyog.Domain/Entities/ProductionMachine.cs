namespace ShaktiUdyog.Domain.Entities;

/// <summary>
/// Machine/equipment lookup for the production floor.
/// Tracks operational status and department assignment.
/// </summary>
public class ProductionMachine
{
    public Guid Id { get; set; }
    public required string Name { get; set; }
    public string? Department { get; set; }
    public string? Status { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTimeOffset CreatedAtUtc { get; set; } = DateTimeOffset.UtcNow;
}
