using ShaktiUdyog.Domain.Entities;

namespace ShaktiUdyog.Domain.Interfaces.Repositories;

/// <summary>Repository contract for Shipment aggregates and dispatch tracking.</summary>
public interface IShipmentRepository : IRepository<Shipment>
{
    Task<Shipment?> GetByTrackingNumberAsync(string trackingNumber, CancellationToken ct = default);
    Task<IReadOnlyList<Shipment>> GetByOrderIdAsync(Guid orderId, CancellationToken ct = default);
    Task<IReadOnlyList<Shipment>> GetRecentDispatchesAsync(int limit = 50, CancellationToken ct = default);
}
