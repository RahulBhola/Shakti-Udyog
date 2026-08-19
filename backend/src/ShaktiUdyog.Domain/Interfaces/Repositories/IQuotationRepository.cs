using ShaktiUdyog.Domain.Entities;

namespace ShaktiUdyog.Domain.Interfaces.Repositories;

/// <summary>
/// Domain repository interface for Commercial Quotations and revisions.
/// </summary>
public interface IQuotationRepository : IRepository<Quotation>
{
    Task<Quotation?> GetWithItemsAndRevisionsAsync(Guid quotationId, CancellationToken ct = default);
    Task<IReadOnlyList<Quotation>> GetByCompanyIdsAsync(IEnumerable<Guid> companyIds, CancellationToken ct = default);
    Task<IReadOnlyList<QuotationRevision>> GetRevisionsAsync(Guid quotationId, CancellationToken ct = default);
}
