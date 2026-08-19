using Microsoft.EntityFrameworkCore;
using ShaktiUdyog.Domain.Entities;
using ShaktiUdyog.Domain.Interfaces;
using ShaktiUdyog.Infrastructure.Storage;

namespace ShaktiUdyog.Api.BackgroundServices;

/// <summary>
/// Background worker that periodically cleans up abandoned temporary CAD drawings (.dwg, .step, .pdf)
/// and files attached to stale drafts older than 24 hours.
/// </summary>
public class CadFileCleanupWorker(
    IServiceScopeFactory scopeFactory,
    ILogger<CadFileCleanupWorker> logger) : BackgroundService
{
    private static readonly TimeSpan Interval = TimeSpan.FromHours(12);

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        logger.LogInformation("CadFileCleanupWorker background service started.");

        using var timer = new PeriodicTimer(Interval);

        try
        {
            while (!stoppingToken.IsCancellationRequested && await timer.WaitForNextTickAsync(stoppingToken))
            {
                await CleanStaleDrawingsAsync(stoppingToken);
            }
        }
        catch (OperationCanceledException)
        {
            logger.LogInformation("CadFileCleanupWorker background service stopped gracefully.");
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Unhandled exception in CadFileCleanupWorker.");
        }
    }

    private async Task CleanStaleDrawingsAsync(CancellationToken ct)
    {
        try
        {
            using var scope = scopeFactory.CreateScope();
            var uow = scope.ServiceProvider.GetRequiredService<IUnitOfWork>();
            var storage = scope.ServiceProvider.GetRequiredService<IFileStorageService>();

            var cutoff = DateTimeOffset.UtcNow.AddHours(-24);

            // Find files attached to draft enquiries that haven't been touched in 24 hours and have no active company link
            var staleDraftFiles = await uow.Repository<EnquiryFile>()
                .Query(asNoTracking: false)
                .Include(f => f.Enquiry)
                .Where(f => f.Enquiry.IsDraft && f.UploadedAtUtc < cutoff && f.Enquiry.CompanyId == null)
                .ToListAsync(ct);

            if (staleDraftFiles.Count == 0)
            {
                return;
            }

            foreach (var file in staleDraftFiles)
            {
                try
                {
                    await storage.DeleteAsync(file.StorageKey, ct);
                }
                catch (Exception ex)
                {
                    logger.LogWarning(ex, "Failed to delete physical file {StorageKey} from storage.", file.StorageKey);
                }

                uow.Repository<EnquiryFile>().Remove(file);
            }

            await uow.SaveChangesAsync(ct);
            logger.LogInformation("CadFileCleanupWorker: Cleaned {Count} stale temporary drawing file(s).", staleDraftFiles.Count);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error executing CadFileCleanupWorker cleanup.");
        }
    }
}
