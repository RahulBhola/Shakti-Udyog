using Microsoft.EntityFrameworkCore;
using ShaktiUdyog.Domain.Entities;
using ShaktiUdyog.Domain.Interfaces.Repositories;
using ShaktiUdyog.Infrastructure.Data;

namespace ShaktiUdyog.Infrastructure.Repositories;

public class AuditLogRepository(AppDbContext db) : Repository<AuditLog>(db), IAuditLogRepository
{
    public async Task<AuditLog?> GetByIdAsync(long id, CancellationToken ct = default) =>
        await DbSet.FindAsync([id], ct);

    public async Task<IReadOnlyList<AuditLog>> GetByEntityAsync(string entityType, string entityId, CancellationToken ct = default) =>
        await DbSet.AsNoTracking()
            .Where(a => a.EntityType == entityType && a.EntityId == entityId)
            .OrderByDescending(a => a.OccurredAtUtc)
            .ToListAsync(ct);

    public async Task<IReadOnlyList<AuditLog>> GetByUserIdAsync(Guid userId, int limit = 100, CancellationToken ct = default) =>
        await DbSet.AsNoTracking()
            .Where(a => a.UserId == userId)
            .OrderByDescending(a => a.OccurredAtUtc)
            .Take(limit)
            .ToListAsync(ct);

    public async Task<IReadOnlyList<AuditLog>> GetRecentActivityAsync(int limit = 50, CancellationToken ct = default) =>
        await DbSet.AsNoTracking()
            .OrderByDescending(a => a.OccurredAtUtc)
            .Take(limit)
            .ToListAsync(ct);
}
