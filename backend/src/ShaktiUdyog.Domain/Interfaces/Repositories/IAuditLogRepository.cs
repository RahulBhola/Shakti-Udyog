using ShaktiUdyog.Domain.Entities;

namespace ShaktiUdyog.Domain.Interfaces.Repositories;

/// <summary>Repository contract for immutable system security and data mutation audit logs.</summary>
public interface IAuditLogRepository : IRepository<AuditLog>
{
    Task<AuditLog?> GetByIdAsync(long id, CancellationToken ct = default);
    Task<IReadOnlyList<AuditLog>> GetByEntityAsync(string entityType, string entityId, CancellationToken ct = default);
    Task<IReadOnlyList<AuditLog>> GetByUserIdAsync(Guid userId, int limit = 100, CancellationToken ct = default);
    Task<IReadOnlyList<AuditLog>> GetRecentActivityAsync(int limit = 50, CancellationToken ct = default);
}
