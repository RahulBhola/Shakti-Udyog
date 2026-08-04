namespace ShaktiUdyog.Domain.Entities;

/// <summary>
/// Metadata for a drawing/specification file attached to an Enquiry. The binary
/// lives in protected storage referenced by an opaque StorageKey — file
/// system paths are never stored here nor exposed to clients.
/// </summary>
public class EnquiryFile
{
    public Guid Id { get; set; }
    public Guid EnquiryId { get; set; }
    public Enquiry Enquiry { get; set; } = null!;
    public required string FileName { get; set; }
    public required string ContentType { get; set; }
    public long SizeBytes { get; set; }
    public required string StorageKey { get; set; }
    public Guid? UploadedByUserId { get; set; }
    public DateTimeOffset UploadedAtUtc { get; set; } = DateTimeOffset.UtcNow;
}
