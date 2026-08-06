namespace ShaktiUdyog.Domain.Entities;

/// <summary>Hierarchical folder structure for organizing documents (Milestone 10).</summary>
public class DocumentFolder
{
    public Guid Id { get; set; }
    public required string Name { get; set; }
    public Guid? ParentId { get; set; }
    public DocumentFolder? Parent { get; set; }
    public List<DocumentFolder> Children { get; set; } = [];
    public DateTimeOffset CreatedAtUtc { get; set; } = DateTimeOffset.UtcNow;
}
