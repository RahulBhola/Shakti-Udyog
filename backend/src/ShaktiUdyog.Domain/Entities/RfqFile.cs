namespace ShaktiUdyog.Domain.Entities;

/// <summary>
/// Metadata for a drawing/specification file attached to an RFQ. The binary
/// lives in protected storage referenced by an opaque StorageKey — file
/// system paths are never stored here nor exposed to clients.
/// </summary>
public class RfqFile
{
    public Guid Id { get; set; }
    public Guid RfqId { get; set; }
    public Rfq Rfq { get; set; } = null!;
    public required string FileName { get; set; }
    public required string ContentType { get; set; }
    public long SizeBytes { get; set; }
    public required string StorageKey { get; set; }
    public Guid? UploadedByUserId { get; set; }
    public DateTimeOffset UploadedAtUtc { get; set; } = DateTimeOffset.UtcNow;
}
