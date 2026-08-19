using Microsoft.EntityFrameworkCore;
using ShaktiUdyog.Domain.Entities;
using ShaktiUdyog.Domain.Interfaces.Repositories;
using ShaktiUdyog.Infrastructure.Data;

namespace ShaktiUdyog.Infrastructure.Repositories;

public class DocumentRepository : Repository<Document>, IDocumentRepository
{
    public DocumentRepository(AppDbContext db) : base(db) { }

    public async Task<IReadOnlyList<Document>> GetCustomerVisibleDocumentsAsync(
        IEnumerable<Guid> companyIds, string? category = null, CancellationToken ct = default)
    {
        var companyIdList = companyIds.ToList();
        var query = Db.Documents
            .AsNoTracking()
            .Where(d => d.IsCustomerVisible && !d.IsDeleted && companyIdList.Contains(d.CompanyId));

        if (!string.IsNullOrWhiteSpace(category))
        {
            query = query.Where(d => d.Category == category);
        }

        return await query.OrderByDescending(d => d.CreatedAtUtc).ToListAsync(ct);
    }

    public async Task<Document?> GetWithVersionsAsync(Guid documentId, CancellationToken ct = default)
    {
        return await Db.Documents
            .Include(d => d.Versions)
            .Include(d => d.Folder)
            .Include(d => d.Company)
            .FirstOrDefaultAsync(d => d.Id == documentId && !d.IsDeleted, ct);
    }
}
