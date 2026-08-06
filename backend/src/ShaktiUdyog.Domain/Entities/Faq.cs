namespace ShaktiUdyog.Domain.Entities;

/// <summary>Frequently Asked Question (Milestone 8 Phase 3).</summary>
public class Faq
{
    public Guid Id { get; set; }
    public required string Question { get; set; }
    public required string Answer { get; set; }
    public string? Category { get; set; }
    public int DisplayOrder { get; set; }
    public bool IsPublished { get; set; }
    public DateTimeOffset CreatedAtUtc { get; set; } = DateTimeOffset.UtcNow;
}
