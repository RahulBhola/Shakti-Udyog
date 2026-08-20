using System.Diagnostics;
using System.Runtime.InteropServices;

namespace ShaktiUdyog.Api.Infrastructure.Performance;

public interface IPerformanceMetricsService
{
    PerformanceSnapshot GetMetrics();
}

public record PerformanceSnapshot(
    DateTimeOffset TimestampUtc,
    TimeSpan Uptime,
    MemoryMetrics Memory,
    ThreadPoolMetrics ThreadPool,
    SystemMetrics System);

public record MemoryMetrics(
    double WorkingSetMb,
    double PrivateMemoryMb,
    double GcAllocatedMb,
    int Gen0Collections,
    int Gen1Collections,
    int Gen2Collections);

public record ThreadPoolMetrics(
    int AvailableWorkerThreads,
    int AvailableCompletionPortThreads,
    int MaxWorkerThreads,
    int MaxCompletionPortThreads,
    long PendingWorkItemCount,
    int CurrentThreadCount);

public record SystemMetrics(
    string FrameworkDescription,
    string OsDescription,
    int ProcessorCount,
    string ProcessArchitecture);

public class PerformanceMetricsService : IPerformanceMetricsService
{
    private static readonly Process CurrentProcess = Process.GetCurrentProcess();
    private static readonly DateTimeOffset StartTime = DateTimeOffset.UtcNow;

    public PerformanceSnapshot GetMetrics()
    {
        CurrentProcess.Refresh();

        ThreadPool.GetAvailableThreads(out var availWorker, out var availIo);
        ThreadPool.GetMaxThreads(out var maxWorker, out var maxIo);

        var memory = new MemoryMetrics(
            WorkingSetMb: Math.Round(CurrentProcess.WorkingSet64 / (1024.0 * 1024.0), 2),
            PrivateMemoryMb: Math.Round(CurrentProcess.PrivateMemorySize64 / (1024.0 * 1024.0), 2),
            GcAllocatedMb: Math.Round(GC.GetTotalMemory(false) / (1024.0 * 1024.0), 2),
            Gen0Collections: GC.CollectionCount(0),
            Gen1Collections: GC.CollectionCount(1),
            Gen2Collections: GC.CollectionCount(2));

        var threadPool = new ThreadPoolMetrics(
            AvailableWorkerThreads: availWorker,
            AvailableCompletionPortThreads: availIo,
            MaxWorkerThreads: maxWorker,
            MaxCompletionPortThreads: maxIo,
            PendingWorkItemCount: ThreadPool.PendingWorkItemCount,
            CurrentThreadCount: ThreadPool.ThreadCount);

        var system = new SystemMetrics(
            FrameworkDescription: RuntimeInformation.FrameworkDescription,
            OsDescription: RuntimeInformation.OSDescription,
            ProcessorCount: Environment.ProcessorCount,
            ProcessArchitecture: RuntimeInformation.ProcessArchitecture.ToString());

        return new PerformanceSnapshot(
            TimestampUtc: DateTimeOffset.UtcNow,
            Uptime: DateTimeOffset.UtcNow - StartTime,
            Memory: memory,
            ThreadPool: threadPool,
            System: system);
    }
}
