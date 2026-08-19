using Microsoft.EntityFrameworkCore;
using ShaktiUdyog.Domain.Entities;
using ShaktiUdyog.Domain.Interfaces.Repositories;
using ShaktiUdyog.Infrastructure.Data;

namespace ShaktiUdyog.Infrastructure.Repositories;

public class ProductMasterRepository(AppDbContext db) : Repository<ProductMaster>(db), IProductMasterRepository
{
    public async Task<ProductMaster?> GetByProductCodeAsync(string productCode, CancellationToken ct = default) =>
        await DbSet.AsNoTracking()
            .Include(p => p.Attachments)
            .FirstOrDefaultAsync(p => p.ProductCode == productCode, ct);

    public async Task<ProductMaster?> GetByDrawingNumberAsync(string drawingNumber, CancellationToken ct = default) =>
        await DbSet.AsNoTracking()
            .Include(p => p.Attachments)
            .FirstOrDefaultAsync(p => p.DrawingNumber == drawingNumber, ct);

    public async Task<ProductMaster?> GetByPatternNumberAsync(string patternNumber, CancellationToken ct = default) =>
        await DbSet.AsNoTracking()
            .Include(p => p.Attachments)
            .FirstOrDefaultAsync(p => p.PatternNumber == patternNumber, ct);

    public async Task<ProductMaster?> GetWithAttachmentsAsync(Guid id, CancellationToken ct = default) =>
        await DbSet.AsNoTracking()
            .Include(p => p.Attachments)
            .FirstOrDefaultAsync(p => p.Id == id, ct);

    public async Task<IReadOnlyList<ProductMaster>> SearchAsync(string? query, string? materialGrade, CancellationToken ct = default)
    {
        var q = DbSet.AsNoTracking().Include(p => p.Attachments).Where(p => !p.IsArchived).AsQueryable();

        if (!string.IsNullOrWhiteSpace(query))
        {
            var match = query.Trim().ToLower();
            q = q.Where(p => p.ProductCode.ToLower().Contains(match)
                          || p.ProductName.ToLower().Contains(match)
                          || (p.DrawingNumber != null && p.DrawingNumber.ToLower().Contains(match))
                          || (p.PatternNumber != null && p.PatternNumber.ToLower().Contains(match)));
        }

        if (!string.IsNullOrWhiteSpace(materialGrade))
        {
            q = q.Where(p => p.MaterialGrade == materialGrade);
        }

        return await q.OrderBy(p => p.ProductCode).ToListAsync(ct);
    }
}
