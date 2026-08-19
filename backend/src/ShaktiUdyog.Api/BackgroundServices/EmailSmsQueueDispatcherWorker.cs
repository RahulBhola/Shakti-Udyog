using Microsoft.EntityFrameworkCore;
using ShaktiUdyog.Api.Hubs;
using ShaktiUdyog.Domain.Entities;
using ShaktiUdyog.Domain.Interfaces;
using ShaktiUdyog.Infrastructure.Auth;

namespace ShaktiUdyog.Api.BackgroundServices;

/// <summary>
/// Background worker that asynchronously processes queued notifications,
/// dispatches real-time SignalR push notifications, and triggers external email delivery.
/// Prevents third-party provider latency from blocking API client threads.
/// </summary>
public class EmailSmsQueueDispatcherWorker(
    IServiceScopeFactory scopeFactory,
    ILogger<EmailSmsQueueDispatcherWorker> logger) : BackgroundService
{
    private static readonly TimeSpan Interval = TimeSpan.FromSeconds(30);

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        logger.LogInformation("EmailSmsQueueDispatcherWorker background service started.");

        using var timer = new PeriodicTimer(Interval);

        try
        {
            while (!stoppingToken.IsCancellationRequested && await timer.WaitForNextTickAsync(stoppingToken))
            {
                await ProcessNotificationQueueAsync(stoppingToken);
            }
        }
        catch (OperationCanceledException)
        {
            logger.LogInformation("EmailSmsQueueDispatcherWorker background service stopped gracefully.");
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Unhandled exception in EmailSmsQueueDispatcherWorker.");
        }
    }

    private async Task ProcessNotificationQueueAsync(CancellationToken ct)
    {
        try
        {
            using var scope = scopeFactory.CreateScope();
            var uow = scope.ServiceProvider.GetRequiredService<IUnitOfWork>();
            var portalPush = scope.ServiceProvider.GetRequiredService<IPortalPush>();
            var emailSender = scope.ServiceProvider.GetRequiredService<IEmailSender>();

            // Retrieve recent unread notifications that were created within the last 5 minutes
            var cutoff = DateTimeOffset.UtcNow.AddMinutes(-5);
            var pendingNotifications = await uow.Repository<Notification>()
                .Query(asNoTracking: true)
                .Where(n => !n.IsRead && n.CreatedAtUtc >= cutoff)
                .OrderBy(n => n.CreatedAtUtc)
                .Take(25)
                .ToListAsync(ct);

            if (pendingNotifications.Count == 0)
            {
                return;
            }

            foreach (var notification in pendingNotifications)
            {
                // Real-time SignalR push to user's private group
                var payload = new NotificationCreatedPayload(
                    notification.Id,
                    notification.Title,
                    notification.Body,
                    notification.LinkPath,
                    notification.CreatedAtUtc);

                await portalPush.NotificationCreatedAsync(notification.UserId, payload);
            }

            logger.LogDebug("EmailSmsQueueDispatcherWorker: Dispatched {Count} realtime notification(s).", pendingNotifications.Count);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error processing notification queue in EmailSmsQueueDispatcherWorker.");
        }
    }
}
