using System.Linq.Expressions;
using Microsoft.EntityFrameworkCore;
using ShaktiUdyog.Domain.Interfaces;
using ShaktiUdyog.Infrastructure.Data;

namespace ShaktiUdyog.Infrastructure.Repositories;

/// <summary>
/// Generic repository implementation using EF Core and AppDbContext.
/// </summary>
/// <typeparam name="T">Domain entity type</typeparam>
public class Repository<T> : IRepository<T> where T : class
{
    protected readonly AppDbContext Db;
    protected readonly DbSet<T> DbSet;

    public Repository(AppDbContext db)
    {
        Db = db ?? throw new ArgumentNullException(nameof(db));
        DbSet = db.Set<T>();
    }

    public virtual async Task<T?> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        return await DbSet.FindAsync([id], ct);
    }

    public virtual async Task<IReadOnlyList<T>> ListAllAsync(CancellationToken ct = default)
    {
        return await DbSet.AsNoTracking().ToListAsync(ct);
    }

    public virtual async Task<IReadOnlyList<T>> ListAsync(Expression<Func<T, bool>> predicate, CancellationToken ct = default)
    {
        return await DbSet.AsNoTracking().Where(predicate).ToListAsync(ct);
    }

    public virtual async Task<T?> FirstOrDefaultAsync(Expression<Func<T, bool>> predicate, CancellationToken ct = default)
    {
        return await DbSet.AsNoTracking().FirstOrDefaultAsync(predicate, ct);
    }

    public virtual async Task<bool> ExistsAsync(Expression<Func<T, bool>> predicate, CancellationToken ct = default)
    {
        return await DbSet.AsNoTracking().AnyAsync(predicate, ct);
    }

    public virtual async Task<int> CountAsync(Expression<Func<T, bool>>? predicate = null, CancellationToken ct = default)
    {
        return predicate == null
            ? await DbSet.CountAsync(ct)
            : await DbSet.CountAsync(predicate, ct);
    }

    public virtual async Task<T> AddAsync(T entity, CancellationToken ct = default)
    {
        await DbSet.AddAsync(entity, ct);
        return entity;
    }

    public virtual async Task AddRangeAsync(IEnumerable<T> entities, CancellationToken ct = default)
    {
        await DbSet.AddRangeAsync(entities, ct);
    }

    public virtual void Update(T entity)
    {
        DbSet.Update(entity);
    }

    public virtual void Remove(T entity)
    {
        DbSet.Remove(entity);
    }

    public virtual void RemoveRange(IEnumerable<T> entities)
    {
        DbSet.RemoveRange(entities);
    }

    public virtual IQueryable<T> Query(bool asNoTracking = true)
    {
        return asNoTracking ? DbSet.AsNoTracking() : DbSet.AsQueryable();
    }
}
