namespace ShaktiUdyog.Domain.Entities;

/// <summary>Casting product family entity for the product catalogue (Milestone 8 Phase 2).</summary>
public class Product
{
    public Guid Id { get; set; }
    public required string Title { get; set; }
    public required string Slug { get; set; }
    public required string Summary { get; set; }
    public string? Description { get; set; }
    public string? TypicalApplications { get; set; }
    public string? CommonGrades { get; set; }
    public string? CastingWeightRange { get; set; }
    public string? AvailableFinish { get; set; }
    public string? MaterialGrades { get; set; }
    public Guid? CategoryId { get; set; }
    public Category? Category { get; set; }
    public string? SeoTitle { get; set; }
    public string? SeoDescription { get; set; }
    public bool IsPublished { get; set; }
    public int SortOrder { get; set; }
    public DateTimeOffset CreatedAtUtc { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? UpdatedAtUtc { get; set; }
    public byte[] RowVersion { get; set; } = [];

    public List<ProductMedia> Media { get; set; } = [];
}

public class ProductMedia
{
    public Guid Id { get; set; }
    public Guid ProductId { get; set; }
    public Product Product { get; set; } = null!;
    public required string FileName { get; set; }
    public required string ContentType { get; set; }
    public long SizeBytes { get; set; }
    public required string StorageKey { get; set; }
    public string? AltText { get; set; }
    public int SortOrder { get; set; }
    public DateTimeOffset CreatedAtUtc { get; set; } = DateTimeOffset.UtcNow;
}
