using System.Collections.Concurrent;
using Microsoft.EntityFrameworkCore.Storage;
using ShaktiUdyog.Domain.Interfaces;
using ShaktiUdyog.Domain.Interfaces.Repositories;
using ShaktiUdyog.Infrastructure.Data;

namespace ShaktiUdyog.Infrastructure.Repositories;

/// <summary>
/// Unit of Work implementation coordinating EF Core database persistence and repository instances.
/// </summary>
public class UnitOfWork : IUnitOfWork
{
    private readonly AppDbContext _db;
    private readonly ConcurrentDictionary<Type, object> _repositories = new();
    private IDbContextTransaction? _currentTransaction;
    private bool _disposed;

    private IEnquiryRepository? _enquiries;
    private IQuotationRepository? _quotations;
    private IOrderRepository? _orders;
    private IInvoiceRepository? _invoices;
    private IProductionJobRepository? _productionJobs;
    private ICompanyRepository? _companies;
    private IDocumentRepository? _documents;

    public UnitOfWork(AppDbContext db)
    {
        _db = db ?? throw new ArgumentNullException(nameof(db));
    }

    public IEnquiryRepository Enquiries => _enquiries ??= new EnquiryRepository(_db);
    public IQuotationRepository Quotations => _quotations ??= new QuotationRepository(_db);
    public IOrderRepository Orders => _orders ??= new OrderRepository(_db);
    public IInvoiceRepository Invoices => _invoices ??= new InvoiceRepository(_db);
    public IProductionJobRepository ProductionJobs => _productionJobs ??= new ProductionJobRepository(_db);
    public ICompanyRepository Companies => _companies ??= new CompanyRepository(_db);
    public IDocumentRepository Documents => _documents ??= new DocumentRepository(_db);

    public IRepository<TEntity> Repository<TEntity>() where TEntity : class
    {
        return (IRepository<TEntity>)_repositories.GetOrAdd(
            typeof(TEntity),
            _ => new Repository<TEntity>(_db));
    }

    public async Task<int> SaveChangesAsync(CancellationToken ct = default)
    {
        return await _db.SaveChangesAsync(ct);
    }

    public async Task<IDisposable> BeginTransactionAsync(CancellationToken ct = default)
    {
        if (_currentTransaction != null)
        {
            return _currentTransaction;
        }

        _currentTransaction = await _db.Database.BeginTransactionAsync(ct);
        return _currentTransaction;
    }

    public void Dispose()
    {
        Dispose(true);
        GC.SuppressFinalize(this);
    }

    public async ValueTask DisposeAsync()
    {
        await DisposeAsyncCore();
        Dispose(false);
        GC.SuppressFinalize(this);
    }

    protected virtual void Dispose(bool disposing)
    {
        if (!_disposed)
        {
            if (disposing)
            {
                _currentTransaction?.Dispose();
                _db.Dispose();
            }
            _disposed = true;
        }
    }

    protected virtual async ValueTask DisposeAsyncCore()
    {
        if (_currentTransaction != null)
        {
            await _currentTransaction.DisposeAsync();
        }
        await _db.DisposeAsync();
    }
}
