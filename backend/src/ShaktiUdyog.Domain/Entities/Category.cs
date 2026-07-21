namespace ShaktiUdyog.Domain.Entities;

/// <summary>Product category grouping (Milestone 8 Phase 2).</summary>
public class Category
{
    public Guid Id { get; set; }
    public required string Name { get; set; }
    public string? Slug { get; set; }
    public string? Description { get; set; }
    public Guid? ParentId { get; set; }
    public Category? Parent { get; set; }
    public List<Category> Children { get; set; } = [];
    public int DisplayOrder { get; set; }
    public bool IsVisible { get; set; } = true;
    public DateTimeOffset CreatedAtUtc { get; set; } = DateTimeOffset.UtcNow;
}
