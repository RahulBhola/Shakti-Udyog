namespace ShaktiUdyog.Domain.Interfaces;

/// <summary>
/// High-performance caching abstraction for in-memory and distributed cache tiers.
/// Provides sliding/absolute expiration and prefix-based cache invalidation.
/// </summary>
public interface ICacheService
{
    /// <summary>
    /// Retrieves a cached item or computes and stores it if not present.
    /// </summary>
    Task<T> GetOrCreateAsync<T>(
        string key,
        Func<Task<T>> factory,
        TimeSpan? expiration = null,
        CancellationToken ct = default);

    /// <summary>
    /// Retrieves a cached item, or default if missing.
    /// </summary>
    Task<T?> GetAsync<T>(string key, CancellationToken ct = default);

    /// <summary>
    /// Sets a value in the cache with the specified expiration.
    /// </summary>
    Task SetAsync<T>(string key, T value, TimeSpan? expiration = null, CancellationToken ct = default);

    /// <summary>
    /// Removes an item by exact cache key.
    /// </summary>
    Task RemoveAsync(string key, CancellationToken ct = default);

    /// <summary>
    /// Invalidates all cached items matching the specified key prefix (e.g. "catalog:").
    /// </summary>
    Task RemoveByPrefixAsync(string prefix, CancellationToken ct = default);
}
