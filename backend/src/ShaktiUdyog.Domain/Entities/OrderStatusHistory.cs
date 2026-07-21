namespace ShaktiUdyog.Domain.Entities;

/// <summary>Immutable record of every order status transition.</summary>
public class OrderStatusHistory
{
    public Guid Id { get; set; }
    public Guid OrderId { get; set; }
    public Order Order { get; set; } = null!;
    public required string FromStatus { get; set; }
    public required string ToStatus { get; set; }
    public Guid? ChangedByUserId { get; set; }
    public string ChangedByRole { get; set; } = "System";
    public string? Note { get; set; }
    public DateTimeOffset CreatedAtUtc { get; set; } = DateTimeOffset.UtcNow;
}
