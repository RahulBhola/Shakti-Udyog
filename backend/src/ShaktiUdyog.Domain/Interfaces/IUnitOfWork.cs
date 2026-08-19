using ShaktiUdyog.Domain.Entities;
using ShaktiUdyog.Domain.Interfaces.Repositories;

namespace ShaktiUdyog.Domain.Interfaces;

/// <summary>
/// Unit of Work pattern interface for managing domain repositories and transactional integrity.
/// </summary>
public interface IUnitOfWork : IDisposable, IAsyncDisposable
{
    IEnquiryRepository Enquiries { get; }
    IQuotationRepository Quotations { get; }
    IOrderRepository Orders { get; }
    IInvoiceRepository Invoices { get; }
    IProductionJobRepository ProductionJobs { get; }
    ICompanyRepository Companies { get; }
    IDocumentRepository Documents { get; }
    IShipmentRepository Shipments { get; }
    IPaymentRepository Payments { get; }
    IProductMasterRepository ProductMasters { get; }
    INotificationRepository Notifications { get; }
    ISupportRequestRepository SupportRequests { get; }
    IProductRepository Products { get; }
    IAuditLogRepository AuditLogs { get; }
    IKanbanTaskRepository KanbanTasks { get; }
    IContactRequestRepository ContactRequests { get; }

    IRepository<TEntity> Repository<TEntity>() where TEntity : class;

    /// <summary>
    /// Persists all pending entity changes to the database within a single transaction.
    /// </summary>
    Task<int> SaveChangesAsync(CancellationToken ct = default);

    /// <summary>
    /// Begins an explicit database transaction.
    /// </summary>
    Task<IDisposable> BeginTransactionAsync(CancellationToken ct = default);
}
