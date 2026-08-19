using Microsoft.EntityFrameworkCore;
using ShaktiUdyog.Domain.Entities;
using ShaktiUdyog.Domain.Interfaces.Repositories;
using ShaktiUdyog.Infrastructure.Data;

namespace ShaktiUdyog.Infrastructure.Repositories;

public class EnquiryRepository : Repository<Enquiry>, IEnquiryRepository
{
    public EnquiryRepository(AppDbContext db) : base(db) { }

    public async Task<Enquiry?> GetWithDetailsAsync(Guid enquiryId, CancellationToken ct = default)
    {
        return await Db.Enquiries
            .Include(e => e.Items)
            .Include(e => e.Files)
            .Include(e => e.StatusHistory)
            .Include(e => e.Comments)
            .Include(e => e.Company)
            .FirstOrDefaultAsync(e => e.Id == enquiryId, ct);
    }

    public async Task<IReadOnlyList<Enquiry>> GetByCompanyIdsAsync(IEnumerable<Guid> companyIds, CancellationToken ct = default)
    {
        var companyIdList = companyIds.ToList();
        return await Db.Enquiries
            .AsNoTracking()
            .Where(e => e.CompanyId != null && companyIdList.Contains(e.CompanyId.Value))
            .OrderByDescending(e => e.CreatedAtUtc)
            .ToListAsync(ct);
    }

    public async Task<IReadOnlyList<EnquiryStatusHistory>> GetStatusHistoryAsync(Guid enquiryId, CancellationToken ct = default)
    {
        return await Db.EnquiryStatusHistories
            .AsNoTracking()
            .Where(h => h.EnquiryId == enquiryId)
            .OrderBy(h => h.CreatedAtUtc)
            .ToListAsync(ct);
    }
}
