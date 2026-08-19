using ShaktiUdyog.Domain.Entities;

namespace ShaktiUdyog.Domain.Interfaces.Repositories;

/// <summary>
/// Domain repository interface for Manufacturing Orders, Milestones, and Shipments.
/// </summary>
public interface IOrderRepository : IRepository<Order>
{
    Task<Order?> GetWithMilestonesAndShipmentsAsync(Guid orderId, CancellationToken ct = default);
    Task<IReadOnlyList<Order>> GetByCompanyIdsAsync(IEnumerable<Guid> companyIds, CancellationToken ct = default);
    Task<IReadOnlyList<Order>> GetAssignedToEngineerAsync(string engineerUserId, CancellationToken ct = default);
    Task<IReadOnlyList<OrderMilestone>> GetOrderTimelineAsync(Guid orderId, bool customerVisibleOnly = true, CancellationToken ct = default);
}
