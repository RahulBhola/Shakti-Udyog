namespace ShaktiUdyog.Domain.Entities;

/// <summary>Immutable version record for a document (Milestone 10).</summary>
public class DocumentVersion
{
    public Guid Id { get; set; }
    public Guid DocumentId { get; set; }
    public Document Document { get; set; } = null!;
    public int VersionNumber { get; set; }
    public required string FileName { get; set; }
    public required string ContentType { get; set; }
    public long SizeBytes { get; set; }
    public required string StorageKey { get; set; }
    public Guid UploadedByUserId { get; set; }
    public string? Comment { get; set; }
    public DateTimeOffset CreatedAtUtc { get; set; } = DateTimeOffset.UtcNow;
}
