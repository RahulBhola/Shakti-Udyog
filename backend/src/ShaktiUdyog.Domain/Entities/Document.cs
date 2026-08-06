namespace ShaktiUdyog.Domain.Entities;

public class Document
{
    public Guid Id { get; set; }
    public Guid CompanyId { get; set; }
    public Company Company { get; set; } = null!;
    public Guid? OrderId { get; set; }
    public Guid? FolderId { get; set; }
    public DocumentFolder? Folder { get; set; }
    public required string Title { get; set; }
    public required string Category { get; set; }
    public required string FileName { get; set; }
    public required string ContentType { get; set; }
    public long SizeBytes { get; set; }
    public required string StorageKey { get; set; }
    public bool IsCustomerVisible { get; set; }
    public string Status { get; set; } = "Uploaded";
    public string? Tags { get; set; }
    public int CurrentVersion { get; set; } = 1;
    public bool IsDeleted { get; set; }
    public DateTimeOffset? DeletedAtUtc { get; set; }
    public DateTimeOffset CreatedAtUtc { get; set; } = DateTimeOffset.UtcNow;
    public List<DocumentVersion> Versions { get; set; } = [];
}
