using ShaktiUdyog.Domain.Entities;

namespace ShaktiUdyog.Domain.Interfaces.Repositories;

/// <summary>Repository contract for customer payments and financial reconciliations.</summary>
public interface IPaymentRepository : IRepository<Payment>
{
    Task<IReadOnlyList<Payment>> GetByInvoiceIdAsync(Guid invoiceId, CancellationToken ct = default);
    Task<IReadOnlyList<Payment>> GetByCompanyIdAsync(Guid companyId, CancellationToken ct = default);
    Task<IReadOnlyList<Payment>> GetPendingVerificationsAsync(CancellationToken ct = default);
    Task<Payment?> GetByPaymentReferenceAsync(string paymentReference, CancellationToken ct = default);
}
