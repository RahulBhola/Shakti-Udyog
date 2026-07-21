using Microsoft.Extensions.Logging;
using ShaktiUdyog.Domain.Entities;

namespace ShaktiUdyog.Infrastructure.Notifications;

/// <summary>Placeholder abstraction for future notification delivery (Milestone 6 spec).</summary>
public interface INotificationService
{
    Task NotifyOrderStatusChangedAsync(Order order, string fromStatus, string toStatus, CancellationToken ct = default);
    Task NotifyDocumentAvailableAsync(Order order, string documentTitle, CancellationToken ct = default);
}

/// <summary>Placeholder implementation — logs instead of sending. Providers come in a later milestone.</summary>
public class PlaceholderNotificationService : INotificationService
{
    private readonly ILogger<PlaceholderNotificationService> _logger;

    public PlaceholderNotificationService(ILogger<PlaceholderNotificationService> logger) => _logger = logger;

    public Task NotifyOrderStatusChangedAsync(Order order, string fromStatus, string toStatus, CancellationToken ct = default)
    {
        _logger.LogInformation("[NOTIFICATION PLACEHOLDER] Order {Order} status changed: {From} → {To}", order.OrderNumber, fromStatus, toStatus);
        return Task.CompletedTask;
    }

    public Task NotifyDocumentAvailableAsync(Order order, string documentTitle, CancellationToken ct = default)
    {
        _logger.LogInformation("[NOTIFICATION PLACEHOLDER] Document '{Doc}' available for Order {Order}", documentTitle, order.OrderNumber);
        return Task.CompletedTask;
    }
}
