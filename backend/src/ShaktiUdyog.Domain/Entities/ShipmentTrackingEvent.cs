namespace ShaktiUdyog.Domain.Entities;

/// <summary>Granular tracking events within a shipment (Milestone 6 spec).</summary>
public class ShipmentTrackingEvent
{
    public Guid Id { get; set; }
    public Guid ShipmentId { get; set; }
    public Shipment Shipment { get; set; } = null!;
    public required string Location { get; set; }
    public required string Description { get; set; }
    public DateTimeOffset OccurredAtUtc { get; set; } = DateTimeOffset.UtcNow;
}
