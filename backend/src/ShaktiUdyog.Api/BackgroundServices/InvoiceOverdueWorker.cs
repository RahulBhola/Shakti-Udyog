using Microsoft.EntityFrameworkCore;
using ShaktiUdyog.Domain.Constants;
using ShaktiUdyog.Domain.Entities;
using ShaktiUdyog.Domain.Interfaces;

namespace ShaktiUdyog.Api.BackgroundServices;

/// <summary>
/// Background worker that periodically audits issued invoices and transitions
/// unpaid invoices past their due date to Overdue status.
/// </summary>
public class InvoiceOverdueWorker(
    IServiceScopeFactory scopeFactory,
    ILogger<InvoiceOverdueWorker> logger) : BackgroundService
{
    private static readonly TimeSpan Interval = TimeSpan.FromHours(4);

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        logger.LogInformation("InvoiceOverdueWorker background service started.");

        using var timer = new PeriodicTimer(Interval);

        try
        {
            // Initial check on application startup
            await ProcessOverdueInvoicesAsync(stoppingToken);

            while (!stoppingToken.IsCancellationRequested && await timer.WaitForNextTickAsync(stoppingToken))
            {
                await ProcessOverdueInvoicesAsync(stoppingToken);
            }
        }
        catch (OperationCanceledException)
        {
            logger.LogInformation("InvoiceOverdueWorker background service stopped gracefully.");
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Unhandled exception in InvoiceOverdueWorker.");
        }
    }

    private async Task ProcessOverdueInvoicesAsync(CancellationToken ct)
    {
        try
        {
            using var scope = scopeFactory.CreateScope();
            var uow = scope.ServiceProvider.GetRequiredService<IUnitOfWork>();

            var now = DateTimeOffset.UtcNow;
            var overdueInvoices = await uow.Invoices
                .Query(asNoTracking: false)
                .Where(i => (i.Status == InvoiceStatuses.Issued || i.Status == InvoiceStatuses.PartiallyPaid)
                            && i.DueDateUtc != null
                            && i.DueDateUtc < now)
                .ToListAsync(ct);

            if (overdueInvoices.Count == 0)
            {
                return;
            }

            foreach (var invoice in overdueInvoices)
            {
                var fromStatus = invoice.Status;
                invoice.Status = InvoiceStatuses.Overdue;

                invoice.StatusHistory.Add(new InvoiceStatusHistory
                {
                    Id = Guid.NewGuid(),
                    InvoiceId = invoice.Id,
                    FromStatus = fromStatus,
                    ToStatus = InvoiceStatuses.Overdue,
                    ChangedByRole = "System",
                    Note = "Invoice payment overdue past due date.",
                    CreatedAtUtc = now,
                });
            }

            await uow.SaveChangesAsync(ct);
            logger.LogInformation("InvoiceOverdueWorker: Marked {Count} invoice(s) as Overdue.", overdueInvoices.Count);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error processing overdue invoices.");
        }
    }
}
