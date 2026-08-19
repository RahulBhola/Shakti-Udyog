using ShaktiUdyog.Domain.Entities;

namespace ShaktiUdyog.Domain.Interfaces.Repositories;

/// <summary>Repository contract for public contact submissions and tracking.</summary>
public interface IContactRequestRepository : IRepository<ContactRequest>
{
    Task<IReadOnlyList<ContactRequest>> GetNewRequestsAsync(CancellationToken ct = default);
    Task<IReadOnlyList<ContactRequest>> GetRecentAsync(int limit = 50, CancellationToken ct = default);
}
