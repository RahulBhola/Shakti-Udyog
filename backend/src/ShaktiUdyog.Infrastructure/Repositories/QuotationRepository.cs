using Microsoft.EntityFrameworkCore;
using ShaktiUdyog.Domain.Entities;
using ShaktiUdyog.Domain.Interfaces.Repositories;
using ShaktiUdyog.Infrastructure.Data;

namespace ShaktiUdyog.Infrastructure.Repositories;

public class QuotationRepository : Repository<Quotation>, IQuotationRepository
{
    public QuotationRepository(AppDbContext db) : base(db) { }

    public async Task<Quotation?> GetWithItemsAndRevisionsAsync(Guid quotationId, CancellationToken ct = default)
    {
        return await Db.Quotations
            .AsSplitQuery()
            .Include(q => q.Items)
            .Include(q => q.Revisions)
            .Include(q => q.Approvals)
            .Include(q => q.Company)
            .Include(q => q.Enquiry)
            .FirstOrDefaultAsync(q => q.Id == quotationId, ct);
    }

    public async Task<IReadOnlyList<Quotation>> GetByCompanyIdsAsync(IEnumerable<Guid> companyIds, CancellationToken ct = default)
    {
        var companyIdList = companyIds.ToList();
        return await Db.Quotations
            .AsNoTracking()
            .Where(q => companyIdList.Contains(q.CompanyId))
            .OrderByDescending(q => q.CreatedAtUtc)
            .ToListAsync(ct);
    }

    public async Task<IReadOnlyList<QuotationRevision>> GetRevisionsAsync(Guid quotationId, CancellationToken ct = default)
    {
        return await Db.QuotationRevisions
            .AsNoTracking()
            .Where(r => r.QuotationId == quotationId)
            .OrderByDescending(r => r.RevisionNumber)
            .ToListAsync(ct);
    }
}
