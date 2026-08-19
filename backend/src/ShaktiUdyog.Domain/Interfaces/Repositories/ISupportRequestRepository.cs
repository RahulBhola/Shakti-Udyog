using ShaktiUdyog.Domain.Entities;

namespace ShaktiUdyog.Domain.Interfaces.Repositories;

/// <summary>Repository contract for customer support requests, delivery inquiries, and dispute tickets.</summary>
public interface ISupportRequestRepository : IRepository<SupportRequest>
{
    Task<SupportRequest?> GetWithDetailsAsync(Guid id, CancellationToken ct = default);
    Task<IReadOnlyList<SupportRequest>> GetByCompanyIdAsync(Guid companyId, CancellationToken ct = default);
    Task<IReadOnlyList<SupportRequest>> GetByOrderIdAsync(Guid orderId, CancellationToken ct = default);
    Task<IReadOnlyList<SupportRequest>> GetOpenTicketsAsync(CancellationToken ct = default);
}
