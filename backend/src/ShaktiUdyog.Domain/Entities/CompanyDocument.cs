namespace ShaktiUdyog.Domain.Entities;

/// <summary>
/// Document uploaded by a customer for company verification purposes
/// (e.g., GST Certificate, PAN Card, Registration Certificate, etc.).
/// </summary>
public class CompanyDocument
{
    public Guid Id { get; set; }
    public Guid CompanyId { get; set; }
    public Company Company { get; set; } = null!;
    public required string DocumentType { get; set; }
    public required string FileName { get; set; }
    public string? ContentType { get; set; }
    public long SizeBytes { get; set; }
    public required string StorageKey { get; set; }
    public string Status { get; set; } = "Pending";
    public string? Remarks { get; set; }
    public Guid UploadedByUserId { get; set; }
    public DateTimeOffset UploadedAtUtc { get; set; } = DateTimeOffset.UtcNow;
}