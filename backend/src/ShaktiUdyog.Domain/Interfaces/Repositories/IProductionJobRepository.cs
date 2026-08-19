using ShaktiUdyog.Domain.Entities;

namespace ShaktiUdyog.Domain.Interfaces.Repositories;

/// <summary>
/// Domain repository interface for the 25-stage Production Kanban Board, stages, and quality inspection metrics.
/// </summary>
public interface IProductionJobRepository : IRepository<ProductionJob>
{
    Task<ProductionJob?> GetWithStageHistoryAndQualityAsync(Guid jobId, CancellationToken ct = default);
    Task<IReadOnlyList<ProductionJob>> GetActiveBoardJobsAsync(CancellationToken ct = default);
    Task<IReadOnlyList<ProductionJob>> GetByDepartmentAsync(string department, CancellationToken ct = default);
}
