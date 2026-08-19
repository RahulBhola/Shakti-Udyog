using Microsoft.EntityFrameworkCore;
using ShaktiUdyog.Api.Hubs;
using ShaktiUdyog.Domain.Entities;
using ShaktiUdyog.Domain.Interfaces;

namespace ShaktiUdyog.Api.BackgroundServices;

/// <summary>
/// Background worker that monitors shop-floor job cards across the 25-stage manufacturing Kanban board.
/// Identifies jobs exceeding target dispatch dates or stuck in bottleneck stages, and broadcasts
/// real-time alerts to engineers and foundry supervisors.
/// </summary>
public class ShopFloorSlaAlertWorker(
    IServiceScopeFactory scopeFactory,
    ILogger<ShopFloorSlaAlertWorker> logger) : BackgroundService
{
    private static readonly TimeSpan Interval = TimeSpan.FromMinutes(30);

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        logger.LogInformation("ShopFloorSlaAlertWorker background service started.");

        using var timer = new PeriodicTimer(Interval);

        try
        {
            while (!stoppingToken.IsCancellationRequested && await timer.WaitForNextTickAsync(stoppingToken))
            {
                await AuditShopFloorSlaAsync(stoppingToken);
            }
        }
        catch (OperationCanceledException)
        {
            logger.LogInformation("ShopFloorSlaAlertWorker background service stopped gracefully.");
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Unhandled exception in ShopFloorSlaAlertWorker.");
        }
    }

    private async Task AuditShopFloorSlaAsync(CancellationToken ct)
    {
        try
        {
            using var scope = scopeFactory.CreateScope();
            var uow = scope.ServiceProvider.GetRequiredService<IUnitOfWork>();
            var portalPush = scope.ServiceProvider.GetRequiredService<IPortalPush>();

            var now = DateTimeOffset.UtcNow;

            // Find active jobs that breached target dispatch date and are not already blocked
            var overdueJobs = await uow.ProductionJobs
                .Query(asNoTracking: false)
                .Where(j => !j.IsDeleted
                            && j.Status == "Active"
                            && j.TargetDispatchDateUtc != null
                            && j.TargetDispatchDateUtc < now
                            && !j.IsBlocked)
                .Take(20)
                .ToListAsync(ct);

            if (overdueJobs.Count == 0)
            {
                return;
            }

            foreach (var job in overdueJobs)
            {
                job.IsBlocked = true;
                job.BlockReason = $"SLA Delay Alert: Target dispatch date ({job.TargetDispatchDateUtc:yyyy-MM-dd}) elapsed while in stage '{job.CurrentStage}'.";
                job.UpdatedAtUtc = now;

                var alertComment = new ProductionComment
                {
                    Id = Guid.NewGuid(),
                    JobId = job.Id,
                    AuthorId = Guid.Empty,
                    AuthorName = "SLA Alert Engine",
                    AuthorRole = "System",
                    CommentType = "Alert",
                    Message = $"Automated SLA Alert: Dispatch target date elapsed while in stage '{job.CurrentStage}'. Immediate supervisor review required.",
                    CreatedAtUtc = now,
                };

                await uow.Repository<ProductionComment>().AddAsync(alertComment, ct);

                if (job.OrderId.HasValue)
                {
                    // Real-time broadcast to engineers and administrators
                    await portalPush.StageChangedAsync(
                        job.OrderId.Value,
                        job.JobNumber,
                        job.CurrentStage,
                        $"{job.CurrentStage} (SLA Alert)");
                }
            }

            await uow.SaveChangesAsync(ct);
            logger.LogInformation("ShopFloorSlaAlertWorker: Flagged {Count} production job(s) with SLA delay alerts.", overdueJobs.Count);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error running shop-floor SLA audit.");
        }
    }
}
