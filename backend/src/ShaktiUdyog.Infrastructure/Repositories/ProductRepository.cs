using Microsoft.EntityFrameworkCore;
using ShaktiUdyog.Domain.Entities;
using ShaktiUdyog.Domain.Interfaces.Repositories;
using ShaktiUdyog.Infrastructure.Data;

namespace ShaktiUdyog.Infrastructure.Repositories;

public class ProductRepository(AppDbContext db) : Repository<Product>(db), IProductRepository
{
    public async Task<Product?> GetBySlugAsync(string slug, CancellationToken ct = default) =>
        await DbSet.AsNoTracking()
            .Include(p => p.Media)
            .Include(p => p.Category)
            .FirstOrDefaultAsync(p => p.Slug == slug && p.IsPublished, ct);

    public async Task<Product?> GetWithMediaAsync(Guid id, CancellationToken ct = default) =>
        await DbSet.AsNoTracking()
            .Include(p => p.Media.OrderBy(m => m.SortOrder))
            .Include(p => p.Category)
            .FirstOrDefaultAsync(p => p.Id == id, ct);

    public async Task<IReadOnlyList<Product>> GetByCategoryIdAsync(Guid categoryId, CancellationToken ct = default) =>
        await DbSet.AsNoTracking()
            .Include(p => p.Media)
            .Where(p => p.CategoryId == categoryId && p.IsPublished)
            .OrderBy(p => p.SortOrder)
            .ToListAsync(ct);

    public async Task<IReadOnlyList<Product>> GetPublishedProductsAsync(CancellationToken ct = default) =>
        await DbSet.AsNoTracking()
            .Include(p => p.Media)
            .Where(p => p.IsPublished)
            .OrderBy(p => p.SortOrder)
            .ToListAsync(ct);
}
