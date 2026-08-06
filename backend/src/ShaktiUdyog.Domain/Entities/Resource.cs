namespace ShaktiUdyog.Domain.Entities;

/// <summary>Blog, case study, or technical resource (Milestone 8 Phase 3).</summary>
public class Resource
{
    public Guid Id { get; set; }
    public required string Title { get; set; }
    public required string Slug { get; set; }
    public required string Summary { get; set; }
    public string? Body { get; set; }
    public string? Category { get; set; } // Blog, Case Study, Technical, Download
    public string? SeoTitle { get; set; }
    public string? SeoDescription { get; set; }
    public bool IsPublished { get; set; }
    public DateTimeOffset CreatedAtUtc { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? UpdatedAtUtc { get; set; }
}
