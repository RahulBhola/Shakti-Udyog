using System.Collections.Concurrent;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using ShaktiUdyog.Domain.Interfaces;

namespace ShaktiUdyog.Infrastructure.Caching;

/// <summary>
/// Thread-safe in-memory cache implementation with prefix-based bulk invalidation
/// and cache telemetry.
/// </summary>
public class MemoryCacheService(
    IMemoryCache memoryCache,
    ILogger<MemoryCacheService> logger) : ICacheService
{
    private static readonly ConcurrentDictionary<string, byte> AllKeys = new();
    private static readonly TimeSpan DefaultExpiration = TimeSpan.FromMinutes(15);

    public async Task<T> GetOrCreateAsync<T>(
        string key,
        Func<Task<T>> factory,
        TimeSpan? expiration = null,
        CancellationToken ct = default)
    {
        if (memoryCache.TryGetValue(key, out T? cachedValue) && cachedValue is not null)
        {
            logger.LogDebug("Cache HIT: {CacheKey}", key);
            return cachedValue;
        }

        logger.LogDebug("Cache MISS: {CacheKey}. Fetching from origin...", key);
        var value = await factory();

        if (value is not null)
        {
            var exp = expiration ?? DefaultExpiration;
            var options = new MemoryCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = exp,
                SlidingExpiration = TimeSpan.FromMinutes(Math.Min(5, exp.TotalMinutes / 2)),
                Size = 1
            };

            options.RegisterPostEvictionCallback((k, _, _, _) =>
            {
                AllKeys.TryRemove(k.ToString()!, out _);
            });

            memoryCache.Set(key, value, options);
            AllKeys.TryAdd(key, 0);
        }

        return value;
    }

    public Task<T?> GetAsync<T>(string key, CancellationToken ct = default)
    {
        if (memoryCache.TryGetValue(key, out T? value))
        {
            return Task.FromResult(value);
        }
        return Task.FromResult(default(T));
    }

    public Task SetAsync<T>(string key, T value, TimeSpan? expiration = null, CancellationToken ct = default)
    {
        var exp = expiration ?? DefaultExpiration;
        var options = new MemoryCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = exp,
            SlidingExpiration = TimeSpan.FromMinutes(Math.Min(5, exp.TotalMinutes / 2)),
            Size = 1
        };

        options.RegisterPostEvictionCallback((k, _, _, _) =>
        {
            AllKeys.TryRemove(k.ToString()!, out _);
        });

        memoryCache.Set(key, value, options);
        AllKeys.TryAdd(key, 0);

        return Task.CompletedTask;
    }

    public Task RemoveAsync(string key, CancellationToken ct = default)
    {
        memoryCache.Remove(key);
        AllKeys.TryRemove(key, out _);
        logger.LogDebug("Cache INVALIDATED key: {CacheKey}", key);
        return Task.CompletedTask;
    }

    public Task RemoveByPrefixAsync(string prefix, CancellationToken ct = default)
    {
        var matchedKeys = AllKeys.Keys
            .Where(k => k.StartsWith(prefix, StringComparison.OrdinalIgnoreCase))
            .ToList();

        foreach (var key in matchedKeys)
        {
            memoryCache.Remove(key);
            AllKeys.TryRemove(key, out _);
        }

        logger.LogInformation("Cache INVALIDATED prefix: {Prefix} ({Count} keys cleared)", prefix, matchedKeys.Count);
        return Task.CompletedTask;
    }
}
