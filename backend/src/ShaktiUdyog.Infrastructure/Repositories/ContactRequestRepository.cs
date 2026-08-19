using Microsoft.EntityFrameworkCore;
using ShaktiUdyog.Domain.Entities;
using ShaktiUdyog.Domain.Interfaces.Repositories;
using ShaktiUdyog.Infrastructure.Data;

namespace ShaktiUdyog.Infrastructure.Repositories;

public class ContactRequestRepository(AppDbContext db) : Repository<ContactRequest>(db), IContactRequestRepository
{
    public async Task<IReadOnlyList<ContactRequest>> GetNewRequestsAsync(CancellationToken ct = default) =>
        await DbSet.AsNoTracking()
            .Where(c => c.Status == "New")
            .OrderByDescending(c => c.CreatedAtUtc)
            .ToListAsync(ct);

    public async Task<IReadOnlyList<ContactRequest>> GetRecentAsync(int limit = 50, CancellationToken ct = default) =>
        await DbSet.AsNoTracking()
            .OrderByDescending(c => c.CreatedAtUtc)
            .Take(limit)
            .ToListAsync(ct);
}
