using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using ShaktiUdyog.Domain.Entities;
using ShaktiUdyog.Domain.Interfaces;
using ShaktiUdyog.Domain.Interfaces.Repositories;
using ShaktiUdyog.Infrastructure.Auditing;
using ShaktiUdyog.Infrastructure.Auth;
using ShaktiUdyog.Infrastructure.Caching;
using ShaktiUdyog.Infrastructure.Data;
using ShaktiUdyog.Infrastructure.Data.Interceptors;
using ShaktiUdyog.Infrastructure.Notifications;
using ShaktiUdyog.Infrastructure.Repositories;
using ShaktiUdyog.Infrastructure.Storage;

namespace ShaktiUdyog.Infrastructure;

/// <summary>
/// Service collection extension methods for registering Infrastructure layer dependencies.
/// </summary>
public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        // Database Context & Performance Interceptor
        var connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException(
                "Connection string 'DefaultConnection' is not configured. "
                + "Set it via user secrets or the ConnectionStrings__DefaultConnection environment variable.");

        services.AddSingleton<SlowQueryInterceptor>();
        services.AddDbContext<AppDbContext>((sp, options) =>
        {
            options.UseSqlServer(connectionString, sql =>
                sql.MigrationsAssembly(typeof(AppDbContext).Assembly.FullName));
            options.ConfigureWarnings(warnings =>
                warnings.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.RelationalEventId.PendingModelChangesWarning));
            options.AddInterceptors(sp.GetRequiredService<SlowQueryInterceptor>());
        });

        // Caching
        services.AddMemoryCache();
        services.AddSingleton<ICacheService, MemoryCacheService>();

        // Repositories & Unit of Work
        services.AddScoped(typeof(IRepository<>), typeof(Repository<>));
        services.AddScoped<IEnquiryRepository, EnquiryRepository>();
        services.AddScoped<IQuotationRepository, QuotationRepository>();
        services.AddScoped<IOrderRepository, OrderRepository>();
        services.AddScoped<IInvoiceRepository, InvoiceRepository>();
        services.AddScoped<IProductionJobRepository, ProductionJobRepository>();
        services.AddScoped<ICompanyRepository, CompanyRepository>();
        services.AddScoped<IDocumentRepository, DocumentRepository>();
        services.AddScoped<IShipmentRepository, ShipmentRepository>();
        services.AddScoped<IPaymentRepository, PaymentRepository>();
        services.AddScoped<IProductMasterRepository, ProductMasterRepository>();
        services.AddScoped<INotificationRepository, NotificationRepository>();
        services.AddScoped<ISupportRequestRepository, SupportRequestRepository>();
        services.AddScoped<IProductRepository, ProductRepository>();
        services.AddScoped<IAuditLogRepository, AuditLogRepository>();
        services.AddScoped<IKanbanTaskRepository, KanbanTaskRepository>();
        services.AddScoped<IContactRequestRepository, ContactRequestRepository>();
        services.AddScoped<IUnitOfWork, UnitOfWork>();

        // Infrastructure Services
        services.AddHttpClient();
        services.AddScoped<ITokenService, TokenService>();
        services.AddScoped<IPasswordResetService, PasswordResetService>();
        services.AddScoped<IEmailSender, NoOpEmailSender>();
        services.AddScoped<ISmsService, SmsService>();
        services.AddScoped<IAuditWriter, AuditWriter>();
        services.AddSingleton<IFileStorageService, LocalFileStorageService>();

        return services;
    }
}
