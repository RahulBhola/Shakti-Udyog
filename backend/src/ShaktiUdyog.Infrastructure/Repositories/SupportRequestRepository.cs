using Microsoft.EntityFrameworkCore;
using ShaktiUdyog.Domain.Entities;
using ShaktiUdyog.Domain.Interfaces.Repositories;
using ShaktiUdyog.Infrastructure.Data;

namespace ShaktiUdyog.Infrastructure.Repositories;

public class SupportRequestRepository(AppDbContext db) : Repository<SupportRequest>(db), ISupportRequestRepository
{
    public async Task<SupportRequest?> GetWithDetailsAsync(Guid id, CancellationToken ct = default) =>
        await DbSet.AsNoTracking()
            .Include(s => s.Company)
            .Include(s => s.Order)
            .FirstOrDefaultAsync(s => s.Id == id, ct);

    public async Task<IReadOnlyList<SupportRequest>> GetByCompanyIdAsync(Guid companyId, CancellationToken ct = default) =>
        await DbSet.AsNoTracking()
            .Include(s => s.Order)
            .Where(s => s.CompanyId == companyId)
            .OrderByDescending(s => s.CreatedAtUtc)
            .ToListAsync(ct);

    public async Task<IReadOnlyList<SupportRequest>> GetByOrderIdAsync(Guid orderId, CancellationToken ct = default) =>
        await DbSet.AsNoTracking()
            .Where(s => s.OrderId == orderId)
            .OrderByDescending(s => s.CreatedAtUtc)
            .ToListAsync(ct);

    public async Task<IReadOnlyList<SupportRequest>> GetOpenTicketsAsync(CancellationToken ct = default) =>
        await DbSet.AsNoTracking()
            .Include(s => s.Company)
            .Include(s => s.Order)
            .Where(s => s.Status != "Resolved" && s.Status != "Closed")
            .OrderByDescending(s => s.CreatedAtUtc)
            .ToListAsync(ct);
}
