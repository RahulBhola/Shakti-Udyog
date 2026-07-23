namespace ShaktiUdyog.Domain.Entities;

/// <summary>
/// Comments on production jobs — internal, production, engineering, quality, or customer-facing.
/// </summary>
public class ProductionComment
{
    public Guid Id { get; set; }
    public Guid JobId { get; set; }
    public ProductionJob Job { get; set; } = null!;
    public required string AuthorName { get; set; }
    public string? AuthorRole { get; set; }
    public required string Message { get; set; }
    public string? CommentType { get; set; }
    public DateTimeOffset CreatedAtUtc { get; set; } = DateTimeOffset.UtcNow;
}
