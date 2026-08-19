using System.Text;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.IdentityModel.Tokens;
using ShaktiUdyog.Api.Authorization;
using ShaktiUdyog.Api.BackgroundServices;
using ShaktiUdyog.Api.Hubs;
using ShaktiUdyog.Api.Services;
using ShaktiUdyog.Domain.Constants;
using ShaktiUdyog.Domain.Entities;
using ShaktiUdyog.Infrastructure.Auth;
using ShaktiUdyog.Infrastructure.Data;
using ShaktiUdyog.Infrastructure.Notifications;
using ShaktiUdyog.Infrastructure.Storage;

namespace ShaktiUdyog.Api.Infrastructure;

/// <summary>
/// Service collection extension methods for registering API layer presentation, security, and application services.
/// </summary>
public static class DependencyInjection
{
    public static IServiceCollection AddIdentityInfrastructure(this IServiceCollection services)
    {
        services
            .AddIdentityCore<ApplicationUser>(options =>
            {
                options.Password.RequiredLength = 12;
                options.Password.RequireDigit = true;
                options.Password.RequireLowercase = true;
                options.Password.RequireUppercase = true;
                options.Password.RequireNonAlphanumeric = true;
                options.User.RequireUniqueEmail = true;
                options.Lockout.AllowedForNewUsers = true;
                options.Lockout.MaxFailedAccessAttempts = 5;
                options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(15);
            })
            .AddRoles<ApplicationRole>()
            .AddEntityFrameworkStores<AppDbContext>()
            .AddDefaultTokenProviders();

        return services;
    }

    public static IServiceCollection AddApplicationServices(this IServiceCollection services)
    {
        services.AddHttpContextAccessor();
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IExternalAuthService, ExternalAuthService>();
        services.AddSingleton<IPublicContentService, PublicContentService>();
        services.AddScoped<IPublicSubmissionService, PublicSubmissionService>();
        services.AddScoped<ICustomerContextService, CustomerContextService>();
        services.AddScoped<ICustomerService, CustomerService>();
        services.AddScoped<ICustomerProfileService, CustomerProfileService>();
        services.AddScoped<ICustomerCompanyService, CustomerCompanyService>();
        services.AddScoped<ICustomerContactService, CustomerContactService>();
        services.AddScoped<ICustomerAddressService, CustomerAddressService>();
        services.AddScoped<ICustomerDocumentService, CustomerDocumentService>();
        services.AddScoped<ICustomerSecurityService, CustomerSecurityService>();
        services.AddScoped<IEngineerService, EngineerService>();
        services.AddScoped<IReportService, ReportService>();
        services.AddScoped<IAdminService, AdminService>();
        services.AddScoped<IQuotationEngineerService, QuotationEngineerService>();
        services.AddScoped<IQuotationAdminService, QuotationAdminService>();
        services.AddSingleton<IQuotationPdfService, PlaceholderQuotationPdfService>();
        services.AddSingleton<IInvoicePdfService, PlaceholderInvoicePdfService>();
        services.AddScoped<IInvoiceWebhookService, InvoiceWebhookService>();
        services.AddScoped<IAdminContentService, AdminContentService>();
        services.AddScoped<IDocumentService, DocumentService>();
        services.AddScoped<IInvoiceAdminService, InvoiceAdminService>();
        services.AddScoped<IInvoiceManagementService, InvoiceManagementService>();
        services.AddSingleton<INotificationService, PlaceholderNotificationService>();
        services.AddScoped<IOrderAdminService, OrderAdminService>();
        services.AddScoped<IProductionBoardService, ProductionBoardService>();
        services.AddScoped<IProductMasterService, ProductMasterService>();
        services.AddScoped<IEngineerManufacturingService, EngineerManufacturingService>();
        services.AddScoped<IPortalPush, PortalPushService>();

        // Background Workers (Automated Scheduled Hosted Services)
        services.AddHostedService<QuotationExpirationWorker>();
        services.AddHostedService<InvoiceOverdueWorker>();
        services.AddHostedService<EmailSmsQueueDispatcherWorker>();
        services.AddHostedService<CadFileCleanupWorker>();
        services.AddHostedService<ShopFloorSlaAlertWorker>();

        return services;
    }

    public static IServiceCollection AddJwtAuthentication(this IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<JwtOptions>(configuration.GetSection(JwtOptions.SectionName));
        services.Configure<ExternalAuthOptions>(configuration.GetSection(ExternalAuthOptions.SectionName));

        var jwtOptions = configuration.GetSection(JwtOptions.SectionName).Get<JwtOptions>() ?? new JwtOptions();

        if (string.IsNullOrEmpty(jwtOptions.SigningKey) || Encoding.UTF8.GetByteCount(jwtOptions.SigningKey) < 32)
        {
            throw new InvalidOperationException(
                "Jwt:SigningKey is missing or shorter than 32 bytes. Set a strong random secret via "
                + "user secrets or the Jwt__SigningKey environment variable.");
        }

        var authBuilder = services
            .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(options =>
            {
                options.MapInboundClaims = false;
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidIssuer = jwtOptions.Issuer,
                    ValidateAudience = true,
                    ValidAudience = jwtOptions.Audience,
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtOptions.SigningKey)),
                    ValidateLifetime = true,
                    ClockSkew = TimeSpan.Zero,
                    RoleClaimType = System.Security.Claims.ClaimTypes.Role,
                    NameClaimType = "sub",
                };
            })
            .AddCookie(IdentityConstants.ExternalScheme);

        var externalAuthConfig = configuration
            .GetSection(ExternalAuthOptions.SectionName).Get<ExternalAuthOptions>() ?? new ExternalAuthOptions();

        if (!string.IsNullOrEmpty(externalAuthConfig.Google.ClientId))
        {
            authBuilder.AddGoogle("Google", options =>
            {
                options.ClientId = externalAuthConfig.Google.ClientId;
                options.ClientSecret = externalAuthConfig.Google.ClientSecret;
                options.CallbackPath = "/signin-google";
                options.SaveTokens = false;
                options.SignInScheme = IdentityConstants.ExternalScheme;
            });
        }

        if (!string.IsNullOrEmpty(externalAuthConfig.Apple.ClientId))
        {
            authBuilder.AddOpenIdConnect("Apple", options =>
            {
                options.ClientId = externalAuthConfig.Apple.ClientId;
                options.Authority = "https://appleid.apple.com";
                options.CallbackPath = "/signin-apple";
                options.ResponseType = "code id_token";
                options.ResponseMode = "form_post";
                options.SaveTokens = false;
                options.SignInScheme = IdentityConstants.ExternalScheme;
            });
        }

        return services;
    }

    public static IServiceCollection AddSecurityAuthorization(this IServiceCollection services)
    {
        services.AddSingleton<IAuthorizationPolicyProvider, PermissionPolicyProvider>();
        services.AddSingleton<IAuthorizationHandler, PermissionAuthorizationHandler>();
        services.AddAuthorization(options =>
        {
            void AddRolePolicy(string name, params string[] roles) =>
                options.AddPolicy(name, p => p.RequireRole(roles));

            AddRolePolicy(AuthPolicies.AdminOnly, Roles.Admin);
            AddRolePolicy(AuthPolicies.EngineerOnly, Roles.Engineer, Roles.Admin);
            AddRolePolicy(AuthPolicies.CustomerOnly, Roles.Customer);

            AddRolePolicy(AuthPolicies.RequireAdmin, Roles.Admin);
            AddRolePolicy(AuthPolicies.RequireCustomer, Roles.Customer);
        });

        return services;
    }

    public static IServiceCollection AddApiRateLimiting(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddRateLimiter(options =>
        {
            options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
            options.AddPolicy("auth", httpContext =>
                RateLimitPartition.GetFixedWindowLimiter(
                    httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
                    _ => new FixedWindowRateLimiterOptions
                    {
                        PermitLimit = 10,
                        Window = TimeSpan.FromMinutes(1),
                        QueueLimit = 0,
                    }));

            var publicLimit = configuration.GetValue("RateLimits:PublicPerMinute", 20);
            options.AddPolicy("public", httpContext =>
                RateLimitPartition.GetFixedWindowLimiter(
                    httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
                    _ => new FixedWindowRateLimiterOptions
                    {
                        PermitLimit = publicLimit,
                        Window = TimeSpan.FromMinutes(1),
                        QueueLimit = 0,
                    }));
        });

        return services;
    }

    public static IServiceCollection AddApiPresentation(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddControllers();
        services.AddSignalR();
        services.AddProblemDetails();
        services.AddExceptionHandler<GlobalExceptionHandler>();
        services.AddSwaggerDocumentation();

        services.AddHealthChecks()
            .AddDbContextCheck<AppDbContext>("database");

        var frontendOrigin = configuration["Frontend:BaseUrl"] ?? "http://localhost:5173";
        services.AddCors(options =>
            options.AddPolicy("Frontend", policy => policy
                .WithOrigins(frontendOrigin)
                .AllowAnyHeader()
                .AllowAnyMethod()
                .AllowCredentials()));

        return services;
    }
}
