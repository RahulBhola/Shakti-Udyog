using Microsoft.EntityFrameworkCore;
using ShaktiUdyog.Domain.Constants;
using ShaktiUdyog.Domain.Entities;
using ShaktiUdyog.Domain.Interfaces;

namespace ShaktiUdyog.Api.BackgroundServices;

/// <summary>
/// Background worker that periodically scans active quotations and transitions
/// expired quotations whose ValidUntilUtc timestamp has elapsed.
/// </summary>
public class QuotationExpirationWorker(
    IServiceScopeFactory scopeFactory,
    ILogger<QuotationExpirationWorker> logger) : BackgroundService
{
    private static readonly TimeSpan Interval = TimeSpan.FromHours(1);

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        logger.LogInformation("QuotationExpirationWorker background service started.");

        using var timer = new PeriodicTimer(Interval);

        try
        {
            // Initial grace period delay to let migrations and seeders finish on startup
            await Task.Delay(TimeSpan.FromSeconds(10), stoppingToken);

            // Initial check on application startup
            await ProcessExpiredQuotationsAsync(stoppingToken);

            while (!stoppingToken.IsCancellationRequested && await timer.WaitForNextTickAsync(stoppingToken))
            {
                await ProcessExpiredQuotationsAsync(stoppingToken);
            }
        }
        catch (OperationCanceledException)
        {
            logger.LogInformation("QuotationExpirationWorker background service stopped gracefully.");
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Unhandled exception in QuotationExpirationWorker.");
        }
    }

    private async Task ProcessExpiredQuotationsAsync(CancellationToken ct)
    {
        try
        {
            using var scope = scopeFactory.CreateScope();
            var uow = scope.ServiceProvider.GetRequiredService<IUnitOfWork>();

            var now = DateTimeOffset.UtcNow;
            var expiredQuotes = await uow.Quotations
                .Query(asNoTracking: false)
                .Where(q => q.Status == QuotationStatuses.Issued && q.ValidUntilUtc != null && q.ValidUntilUtc < now && !q.IsDeleted)
                .ToListAsync(ct);

            if (expiredQuotes.Count == 0)
            {
                return;
            }

            foreach (var quote in expiredQuotes)
            {
                var fromStatus = quote.Status;
                quote.Status = QuotationStatuses.Expired;

                quote.StatusHistory.Add(new QuotationStatusHistory
                {
                    Id = Guid.NewGuid(),
                    QuotationId = quote.Id,
                    FromStatus = fromStatus,
                    ToStatus = QuotationStatuses.Expired,
                    ChangedByRole = "System",
                    Note = "Quotation validity period expired automatically.",
                    CreatedAtUtc = now,
                });
            }

            try
            {
                await uow.SaveChangesAsync(ct);
                logger.LogInformation("QuotationExpirationWorker: Marked {Count} quotation(s) as Expired.", expiredQuotes.Count);
            }
            catch (DbUpdateConcurrencyException ex)
            {
                logger.LogWarning(ex, "QuotationExpirationWorker: Concurrency conflict detected while expiring quotations. Will re-evaluate on next cycle.");
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error processing expired quotations.");
        }
    }
}
