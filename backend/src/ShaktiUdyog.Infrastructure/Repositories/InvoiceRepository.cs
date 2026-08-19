using Microsoft.EntityFrameworkCore;
using ShaktiUdyog.Domain.Constants;
using ShaktiUdyog.Domain.Entities;
using ShaktiUdyog.Domain.Interfaces.Repositories;
using ShaktiUdyog.Infrastructure.Data;

namespace ShaktiUdyog.Infrastructure.Repositories;

public class InvoiceRepository : Repository<Invoice>, IInvoiceRepository
{
    public InvoiceRepository(AppDbContext db) : base(db) { }

    public async Task<Invoice?> GetWithItemsAndPaymentsAsync(Guid invoiceId, CancellationToken ct = default)
    {
        return await Db.Invoices
            .Include(i => i.Items)
            .Include(i => i.StatusHistory)
            .Include(i => i.Attachments)
            .Include(i => i.Company)
            .Include(i => i.Order)
            .FirstOrDefaultAsync(i => i.Id == invoiceId, ct);
    }

    public async Task<IReadOnlyList<Invoice>> GetByCompanyIdsAsync(IEnumerable<Guid> companyIds, CancellationToken ct = default)
    {
        var companyIdList = companyIds.ToList();
        return await Db.Invoices
            .AsNoTracking()
            .Where(i => companyIdList.Contains(i.CompanyId))
            .OrderByDescending(i => i.IssueDateUtc)
            .ToListAsync(ct);
    }

    public async Task<decimal> GetTotalOutstandingAmountAsync(IEnumerable<Guid> companyIds, CancellationToken ct = default)
    {
        var companyIdList = companyIds.ToList();
        return await Db.Invoices
            .AsNoTracking()
            .Where(i => companyIdList.Contains(i.CompanyId) &&
                        (i.Status == InvoiceStatuses.Issued || i.Status == InvoiceStatuses.PartiallyPaid || i.Status == InvoiceStatuses.Overdue))
            .SumAsync(i => (decimal?)i.BalanceDue, ct) ?? 0m;
    }
}
