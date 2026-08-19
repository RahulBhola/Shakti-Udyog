using ShaktiUdyog.Domain.Entities;

namespace ShaktiUdyog.Domain.Interfaces.Repositories;

/// <summary>
/// Domain repository interface for Tax Invoices, Credit/Debit Notes, and Payments.
/// </summary>
public interface IInvoiceRepository : IRepository<Invoice>
{
    Task<Invoice?> GetWithItemsAndPaymentsAsync(Guid invoiceId, CancellationToken ct = default);
    Task<IReadOnlyList<Invoice>> GetByCompanyIdsAsync(IEnumerable<Guid> companyIds, CancellationToken ct = default);
    Task<decimal> GetTotalOutstandingAmountAsync(IEnumerable<Guid> companyIds, CancellationToken ct = default);
}
