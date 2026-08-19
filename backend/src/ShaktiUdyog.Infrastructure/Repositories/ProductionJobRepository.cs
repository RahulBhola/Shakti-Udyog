using Microsoft.EntityFrameworkCore;
using ShaktiUdyog.Domain.Entities;
using ShaktiUdyog.Domain.Interfaces.Repositories;
using ShaktiUdyog.Infrastructure.Data;

namespace ShaktiUdyog.Infrastructure.Repositories;

public class ProductionJobRepository : Repository<ProductionJob>, IProductionJobRepository
{
    public ProductionJobRepository(AppDbContext db) : base(db) { }

    public async Task<ProductionJob?> GetWithStageHistoryAndQualityAsync(Guid jobId, CancellationToken ct = default)
    {
        return await Db.ProductionJobs
            .Include(j => j.StageHistory)
            .Include(j => j.QualityInspections)
            .Include(j => j.Order)
            .FirstOrDefaultAsync(j => j.Id == jobId && !j.IsDeleted, ct);
    }

    public async Task<IReadOnlyList<ProductionJob>> GetActiveBoardJobsAsync(CancellationToken ct = default)
    {
        return await Db.ProductionJobs
            .AsNoTracking()
            .Include(j => j.StageHistory)
            .Where(j => !j.IsDeleted)
            .OrderBy(j => j.Priority)
            .ThenBy(j => j.CreatedAtUtc)
            .ToListAsync(ct);
    }

    public async Task<IReadOnlyList<ProductionJob>> GetByDepartmentAsync(string department, CancellationToken ct = default)
    {
        return await Db.ProductionJobs
            .AsNoTracking()
            .Where(j => j.Department == department && !j.IsDeleted)
            .OrderBy(j => j.Priority)
            .ToListAsync(ct);
    }
}
