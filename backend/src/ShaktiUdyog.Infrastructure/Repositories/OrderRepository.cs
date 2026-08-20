using Microsoft.EntityFrameworkCore;
using ShaktiUdyog.Domain.Entities;
using ShaktiUdyog.Domain.Interfaces.Repositories;
using ShaktiUdyog.Infrastructure.Data;

namespace ShaktiUdyog.Infrastructure.Repositories;

public class OrderRepository : Repository<Order>, IOrderRepository
{
    public OrderRepository(AppDbContext db) : base(db) { }

    public async Task<Order?> GetWithMilestonesAndShipmentsAsync(Guid orderId, CancellationToken ct = default)
    {
        return await Db.Orders
            .AsSplitQuery()
            .Include(o => o.Items)
            .Include(o => o.Milestones)
            .Include(o => o.Shipments)
            .Include(o => o.Company)
            .Include(o => o.Assignments)
            .FirstOrDefaultAsync(o => o.Id == orderId, ct);
    }

    public async Task<IReadOnlyList<Order>> GetByCompanyIdsAsync(IEnumerable<Guid> companyIds, CancellationToken ct = default)
    {
        var companyIdList = companyIds.ToList();
        return await Db.Orders
            .AsNoTracking()
            .Where(o => companyIdList.Contains(o.CompanyId))
            .OrderByDescending(o => o.PlacedAtUtc)
            .ToListAsync(ct);
    }

    public async Task<IReadOnlyList<Order>> GetAssignedToEngineerAsync(string engineerUserId, CancellationToken ct = default)
    {
        if (!Guid.TryParse(engineerUserId, out var engineerGuid))
        {
            return [];
        }

        return await Db.Orders
            .AsNoTracking()
            .Where(o => o.AssignedToUserId == engineerGuid)
            .OrderByDescending(o => o.PlacedAtUtc)
            .ToListAsync(ct);
    }

    public async Task<IReadOnlyList<OrderMilestone>> GetOrderTimelineAsync(Guid orderId, bool customerVisibleOnly = true, CancellationToken ct = default)
    {
        var query = Db.OrderMilestones.AsNoTracking().Where(m => m.OrderId == orderId);
        if (customerVisibleOnly)
        {
            query = query.Where(m => m.IsCustomerVisible);
        }
        return await query.OrderBy(m => m.OccurredAtUtc).ToListAsync(ct);
    }
}
