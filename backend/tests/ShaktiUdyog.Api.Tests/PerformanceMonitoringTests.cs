using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging.Abstractions;
using ShaktiUdyog.Api.Infrastructure.Performance;
using ShaktiUdyog.Infrastructure.Caching;

namespace ShaktiUdyog.Api.Tests;

public class PerformanceMonitoringTests(ApiFactory factory) : IClassFixture<ApiFactory>
{
    private readonly HttpClient _client = factory.CreateClient();

    [Fact]
    public async Task Performance_diagnostic_endpoint_returns_valid_metrics()
    {
        var response = await _client.GetAsync("/api/v1/meta/performance");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var snapshot = await response.Content.ReadFromJsonAsync<PerformanceSnapshot>();

        Assert.NotNull(snapshot);
        Assert.True(snapshot.Memory.WorkingSetMb > 0);
        Assert.True(snapshot.ThreadPool.MaxWorkerThreads > 0);
        Assert.NotNull(snapshot.System.FrameworkDescription);
        Assert.NotNull(snapshot.System.OsDescription);
    }

    [Fact]
    public async Task Api_response_contains_server_timing_and_response_time_headers()
    {
        var response = await _client.GetAsync("/api/v1/meta");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.True(response.Headers.Contains("Server-Timing"));
        Assert.True(response.Headers.Contains("X-Response-Time-Ms"));

        var timingHeader = response.Headers.GetValues("Server-Timing").FirstOrDefault();
        Assert.NotNull(timingHeader);
        Assert.StartsWith("total;dur=", timingHeader);
    }

    [Fact]
    public async Task MemoryCacheService_GetOrCreate_caches_and_supports_prefix_invalidation()
    {
        using var memoryCache = new MemoryCache(new MemoryCacheOptions());
        var cacheService = new MemoryCacheService(memoryCache, NullLogger<MemoryCacheService>.Instance);

        var computeCount = 0;
        Task<string> Factory()
        {
            computeCount++;
            return Task.FromResult("computed-value");
        }

        // 1. Initial call computes
        var val1 = await cacheService.GetOrCreateAsync("catalog:product-1", Factory);
        Assert.Equal("computed-value", val1);
        Assert.Equal(1, computeCount);

        // 2. Second call returns from cache
        var val2 = await cacheService.GetOrCreateAsync("catalog:product-1", Factory);
        Assert.Equal("computed-value", val2);
        Assert.Equal(1, computeCount);

        // 3. Prefix invalidation clears catalog items
        await cacheService.RemoveByPrefixAsync("catalog:");

        // 4. Next call re-computes
        var val3 = await cacheService.GetOrCreateAsync("catalog:product-1", Factory);
        Assert.Equal("computed-value", val3);
        Assert.Equal(2, computeCount);
    }

    [Fact]
    public void PerformanceMetricsService_returns_accurate_process_telemetry()
    {
        var service = new PerformanceMetricsService();
        var snapshot = service.GetMetrics();

        Assert.NotNull(snapshot);
        Assert.True(snapshot.Memory.WorkingSetMb > 0);
        Assert.True(snapshot.Memory.PrivateMemoryMb > 0);
        Assert.True(snapshot.ThreadPool.AvailableWorkerThreads > 0);
        Assert.True(snapshot.System.ProcessorCount > 0);
    }
}
