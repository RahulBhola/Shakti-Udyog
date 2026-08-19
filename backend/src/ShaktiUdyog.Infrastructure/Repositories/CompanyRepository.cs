using Microsoft.EntityFrameworkCore;
using ShaktiUdyog.Domain.Entities;
using ShaktiUdyog.Domain.Interfaces.Repositories;
using ShaktiUdyog.Infrastructure.Data;

namespace ShaktiUdyog.Infrastructure.Repositories;

public class CompanyRepository : Repository<Company>, ICompanyRepository
{
    public CompanyRepository(AppDbContext db) : base(db) { }

    public async Task<Company?> GetWithFullProfileAsync(Guid companyId, CancellationToken ct = default)
    {
        return await Db.Companies
            .Include(c => c.Addresses)
            .Include(c => c.ContactPersons)
            .Include(c => c.Documents)
            .FirstOrDefaultAsync(c => c.Id == companyId, ct);
    }

    public async Task<IReadOnlyList<Company>> GetApprovedCompaniesAsync(CancellationToken ct = default)
    {
        return await Db.Companies
            .AsNoTracking()
            .Where(c => c.VerificationStatus == "Approved" && c.IsActive)
            .OrderBy(c => c.Name)
            .ToListAsync(ct);
    }

    public async Task<IReadOnlyList<Company>> GetPendingApprovalCompaniesAsync(CancellationToken ct = default)
    {
        return await Db.Companies
            .AsNoTracking()
            .Where(c => c.VerificationStatus == "Pending" && c.IsActive)
            .OrderByDescending(c => c.CreatedAtUtc)
            .ToListAsync(ct);
    }
}
