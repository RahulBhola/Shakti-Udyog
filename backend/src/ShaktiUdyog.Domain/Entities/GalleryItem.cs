namespace ShaktiUdyog.Domain.Entities;

/// <summary>Gallery image/album item (Milestone 8 Phase 3).</summary>
public class GalleryItem
{
    public Guid Id { get; set; }
    public required string FileName { get; set; }
    public required string ContentType { get; set; }
    public long SizeBytes { get; set; }
    public required string StorageKey { get; set; }
    public string? Caption { get; set; }
    public string? AltText { get; set; }
    public string? Album { get; set; }
    public int SortOrder { get; set; }
    public bool IsVisible { get; set; } = true;
    public DateTimeOffset CreatedAtUtc { get; set; } = DateTimeOffset.UtcNow;
}
