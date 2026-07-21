namespace ShaktiUdyog.Domain.Entities;

/// <summary>Shipment/dispatch details for an order (requirements §14/§18).</summary>
public class Shipment
{
    public Guid Id { get; set; }
    public Guid OrderId { get; set; }
    public Order Order { get; set; } = null!;
    public string? Transporter { get; set; }
    public string? TrackingNumber { get; set; }
    public DateTimeOffset? DispatchDateUtc { get; set; }
    public DateTimeOffset? EstimatedArrivalUtc { get; set; }
    public DateTimeOffset? DeliveredAtUtc { get; set; }
    /// <summary>Proof-of-delivery document in protected storage, when available.</summary>
    public Guid? ProofOfDeliveryDocumentId { get; set; }
    public DateTimeOffset CreatedAtUtc { get; set; } = DateTimeOffset.UtcNow;
}
