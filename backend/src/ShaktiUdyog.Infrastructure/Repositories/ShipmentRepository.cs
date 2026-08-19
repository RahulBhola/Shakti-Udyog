using Microsoft.EntityFrameworkCore;
using ShaktiUdyog.Domain.Entities;
using ShaktiUdyog.Domain.Interfaces.Repositories;
using ShaktiUdyog.Infrastructure.Data;

namespace ShaktiUdyog.Infrastructure.Repositories;

public class ShipmentRepository(AppDbContext db) : Repository<Shipment>(db), IShipmentRepository
{
    public async Task<Shipment?> GetByTrackingNumberAsync(string trackingNumber, CancellationToken ct = default) =>
        await DbSet.AsNoTracking()
            .Include(s => s.Order)
            .FirstOrDefaultAsync(s => s.TrackingNumber == trackingNumber, ct);

    public async Task<IReadOnlyList<Shipment>> GetByOrderIdAsync(Guid orderId, CancellationToken ct = default) =>
        await DbSet.AsNoTracking()
            .Where(s => s.OrderId == orderId)
            .OrderByDescending(s => s.DispatchDateUtc)
            .ToListAsync(ct);

    public async Task<IReadOnlyList<Shipment>> GetRecentDispatchesAsync(int limit = 50, CancellationToken ct = default) =>
        await DbSet.AsNoTracking()
            .Include(s => s.Order)
            .OrderByDescending(s => s.DispatchDateUtc)
            .Take(limit)
            .ToListAsync(ct);
}
