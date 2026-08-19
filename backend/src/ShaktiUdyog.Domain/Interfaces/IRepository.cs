using System.Linq.Expressions;

namespace ShaktiUdyog.Domain.Interfaces;

/// <summary>
/// Generic repository interface defining data access abstractions for domain entities.
/// </summary>
/// <typeparam name="T">Domain entity type</typeparam>
public interface IRepository<T> where T : class
{
    /// <summary>
    /// Retrieves an entity by its primary key identifier.
    /// </summary>
    Task<T?> GetByIdAsync(Guid id, CancellationToken ct = default);

    /// <summary>
    /// Returns all entities in the table as a read-only list.
    /// </summary>
    Task<IReadOnlyList<T>> ListAllAsync(CancellationToken ct = default);

    /// <summary>
    /// Returns all entities matching the specified predicate expression.
    /// </summary>
    Task<IReadOnlyList<T>> ListAsync(Expression<Func<T, bool>> predicate, CancellationToken ct = default);

    /// <summary>
    /// Returns the first entity matching the specified predicate expression, or null if none found.
    /// </summary>
    Task<T?> FirstOrDefaultAsync(Expression<Func<T, bool>> predicate, CancellationToken ct = default);

    /// <summary>
    /// Checks whether any entity matches the specified predicate expression.
    /// </summary>
    Task<bool> ExistsAsync(Expression<Func<T, bool>> predicate, CancellationToken ct = default);

    /// <summary>
    /// Counts total entities, optionally filtered by a predicate expression.
    /// </summary>
    Task<int> CountAsync(Expression<Func<T, bool>>? predicate = null, CancellationToken ct = default);

    /// <summary>
    /// Adds a new entity to the repository.
    /// </summary>
    Task<T> AddAsync(T entity, CancellationToken ct = default);

    /// <summary>
    /// Adds a collection of new entities to the repository.
    /// </summary>
    Task AddRangeAsync(IEnumerable<T> entities, CancellationToken ct = default);

    /// <summary>
    /// Marks an existing entity as modified for update.
    /// </summary>
    void Update(T entity);

    /// <summary>
    /// Removes an entity from the repository.
    /// </summary>
    void Remove(T entity);

    /// <summary>
    /// Removes a collection of entities from the repository.
    /// </summary>
    void RemoveRange(IEnumerable<T> entities);

    /// <summary>
    /// Exposes a queryable interface for complex projection, sorting, and eager loading pipelines.
    /// </summary>
    /// <param name="asNoTracking">If true, optimizes queries by disabling EF change tracker allocation.</param>
    IQueryable<T> Query(bool asNoTracking = true);
}
