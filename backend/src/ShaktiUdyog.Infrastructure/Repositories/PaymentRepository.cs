using Microsoft.EntityFrameworkCore;
using ShaktiUdyog.Domain.Constants;
using ShaktiUdyog.Domain.Entities;
using ShaktiUdyog.Domain.Interfaces.Repositories;
using ShaktiUdyog.Infrastructure.Data;

namespace ShaktiUdyog.Infrastructure.Repositories;

public class PaymentRepository(AppDbContext db) : Repository<Payment>(db), IPaymentRepository
{
    public async Task<IReadOnlyList<Payment>> GetByInvoiceIdAsync(Guid invoiceId, CancellationToken ct = default) =>
        await DbSet.AsNoTracking()
            .Where(p => p.InvoiceId == invoiceId)
            .OrderByDescending(p => p.PaymentDateUtc)
            .ToListAsync(ct);

    public async Task<IReadOnlyList<Payment>> GetByCompanyIdAsync(Guid companyId, CancellationToken ct = default) =>
        await DbSet.AsNoTracking()
            .Include(p => p.Invoice)
            .Where(p => p.CompanyId == companyId)
            .OrderByDescending(p => p.PaymentDateUtc)
            .ToListAsync(ct);

    public async Task<IReadOnlyList<Payment>> GetPendingVerificationsAsync(CancellationToken ct = default) =>
        await DbSet.AsNoTracking()
            .Include(p => p.Invoice)
            .Include(p => p.Company)
            .Where(p => p.Status == PaymentStatuses.PendingVerification || p.Status == "Pending")
            .OrderBy(p => p.PaymentDateUtc)
            .ToListAsync(ct);

    public async Task<Payment?> GetByPaymentReferenceAsync(string paymentReference, CancellationToken ct = default) =>
        await DbSet.AsNoTracking()
            .FirstOrDefaultAsync(p => p.PaymentReference == paymentReference, ct);
}
