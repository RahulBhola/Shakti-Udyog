using Microsoft.EntityFrameworkCore;
using ShaktiUdyog.Domain.Entities;
using ShaktiUdyog.Domain.Interfaces.Repositories;
using ShaktiUdyog.Infrastructure.Data;

namespace ShaktiUdyog.Infrastructure.Repositories;

public class KanbanTaskRepository(AppDbContext db) : Repository<KanbanTask>(db), IKanbanTaskRepository
{
    public async Task<IReadOnlyList<KanbanTask>> GetByColumnAsync(string column, CancellationToken ct = default) =>
        await DbSet.AsNoTracking()
            .Where(k => k.Column == column)
            .OrderBy(k => k.Position)
            .ToListAsync(ct);

    public async Task<IReadOnlyList<KanbanTask>> GetAssignedToAsync(string assignedTo, CancellationToken ct = default) =>
        await DbSet.AsNoTracking()
            .Where(k => k.AssignedTo == assignedTo)
            .OrderBy(k => k.Position)
            .ToListAsync(ct);
}
