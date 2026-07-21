namespace ShaktiUdyog.Domain.Entities;

/// <summary>Internal or customer-visible comment on an order.</summary>
public class OrderComment
{
    public Guid Id { get; set; }
    public Guid OrderId { get; set; }
    public Order Order { get; set; } = null!;
    public Guid AuthorUserId { get; set; }
    public string AuthorRole { get; set; } = "Staff";
    public bool IsCustomerVisible { get; set; }
    public required string Message { get; set; }
    public DateTimeOffset CreatedAtUtc { get; set; } = DateTimeOffset.UtcNow;
}
