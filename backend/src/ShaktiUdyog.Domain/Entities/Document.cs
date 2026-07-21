namespace ShaktiUdyog.Domain.Entities;

/// <summary>
/// Protected document metadata (requirements §14). Binary content lives in
/// private storage under an opaque StorageKey; every download is authorized
/// server-side against the requesting user's company and the visibility flag.
/// </summary>
public class Document
{
    public Guid Id { get; set; }
    public Guid CompanyId { get; set; }
    public Company Company { get; set; } = null!;
    public Guid? OrderId { get; set; }
    public required string Title { get; set; }
    /// <summary>One of Constants.DocumentCategories.</summary>
    public required string Category { get; set; }
    public required string FileName { get; set; }
    public required string ContentType { get; set; }
    public long SizeBytes { get; set; }
    public required string StorageKey { get; set; }
    /// <summary>Customers can see/download only documents marked visible.</summary>
    public bool IsCustomerVisible { get; set; }
    public DateTimeOffset CreatedAtUtc { get; set; } = DateTimeOffset.UtcNow;
}
