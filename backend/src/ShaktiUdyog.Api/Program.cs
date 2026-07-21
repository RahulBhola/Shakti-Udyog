using System.Text;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using ShaktiUdyog.Api.Authorization;
using ShaktiUdyog.Api.Infrastructure;
using ShaktiUdyog.Api.Services;
using ShaktiUdyog.Domain.Constants;
using ShaktiUdyog.Domain.Entities;
using ShaktiUdyog.Infrastructure.Auditing;
using ShaktiUdyog.Infrastructure.Auth;
using ShaktiUdyog.Infrastructure.Data;
using ShaktiUdyog.Infrastructure.Notifications;
using ShaktiUdyog.Infrastructure.Storage;

var builder = WebApplication.CreateBuilder(args);

// --- Database ---------------------------------------------------------------
// Connection string comes from configuration / environment variables only.
// See .env.example and appsettings.json; never commit real credentials.
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException(
        "Connection string 'DefaultConnection' is not configured. "
        + "Set it via user secrets or the ConnectionStrings__DefaultConnection environment variable.");

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(connectionString, sql =>
        sql.MigrationsAssembly(typeof(AppDbContext).Assembly.FullName)));

// --- Identity ---------------------------------------------------------------
// Secure password hashing, password policy, and lockout are provided by
// ASP.NET Core Identity (requirements §16/§19).
builder.Services
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

// --- JWT --------------------------------------------------------------------
// Signing key must come from env vars / user secrets (Jwt__SigningKey).
builder.Services.Configure<JwtOptions>(builder.Configuration.GetSection(JwtOptions.SectionName));
var jwtOptions = builder.Configuration.GetSection(JwtOptions.SectionName).Get<JwtOptions>() ?? new JwtOptions();

if (string.IsNullOrEmpty(jwtOptions.SigningKey) || Encoding.UTF8.GetByteCount(jwtOptions.SigningKey) < 32)
{
    throw new InvalidOperationException(
        "Jwt:SigningKey is missing or shorter than 32 bytes. Set a strong random secret via "
        + "user secrets or the Jwt__SigningKey environment variable. Example to generate one: "
        + "dotnet run --project tools or `openssl rand -base64 48`.");
}

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.MapInboundClaims = false; // keep raw claim names (sub, email, permission)
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
    });

// --- Authorization ----------------------------------------------------------
// Role policies plus dynamic "permission:<name>" policies. Authorization is
// always enforced here in the backend, never only in the frontend.
builder.Services.AddSingleton<IAuthorizationPolicyProvider, PermissionPolicyProvider>();
builder.Services.AddSingleton<IAuthorizationHandler, PermissionAuthorizationHandler>();
builder.Services.AddAuthorization(options =>
{
    void AddRolePolicy(string name, params string[] roles) =>
        options.AddPolicy(name, p => p.RequireRole(roles));

    AddRolePolicy(AuthPolicies.AdminOnly, Roles.Admin);
    AddRolePolicy(AuthPolicies.DataUpdaterOnly, Roles.DataUpdater, Roles.Admin);
    AddRolePolicy(AuthPolicies.CustomerOnly, Roles.Customer);

    // Milestone 1 aliases.
    AddRolePolicy(AuthPolicies.RequireAdmin, Roles.Admin);
    AddRolePolicy(AuthPolicies.RequireDataUpdater, Roles.DataUpdater, Roles.Admin);
    AddRolePolicy(AuthPolicies.RequireCustomer, Roles.Customer);
});

// --- Rate limiting ----------------------------------------------------------
// Strict per-IP limits on authentication endpoints (requirements §16).
builder.Services.AddRateLimiter(options =>
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

    // Public enquiry/RFQ submissions (requirements §16: rate-limit RFQ endpoints).
    // Limit is configurable (RateLimits:PublicPerMinute) so tests can raise it.
    var publicLimit = builder.Configuration.GetValue("RateLimits:PublicPerMinute", 5);
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

// --- Application services ---------------------------------------------------
builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddScoped<IPasswordResetService, PasswordResetService>();
builder.Services.AddScoped<IEmailSender, NoOpEmailSender>();
builder.Services.AddScoped<IAuditWriter, AuditWriter>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddSingleton<IPublicContentService, PublicContentService>();
builder.Services.AddScoped<IPublicSubmissionService, PublicSubmissionService>();
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<ICustomerContextService, CustomerContextService>();
builder.Services.AddScoped<ICustomerService, CustomerService>();
builder.Services.AddScoped<ICustomerProfileService, CustomerProfileService>();
builder.Services.AddScoped<IDataUpdaterService, DataUpdaterService>();
builder.Services.AddScoped<IAdminService, AdminService>();
builder.Services.AddScoped<IQuotationUpdaterService, QuotationUpdaterService>();
builder.Services.AddScoped<IQuotationAdminService, QuotationAdminService>();
builder.Services.AddSingleton<IFileStorageService, LocalFileStorageService>();
builder.Services.AddSingleton<IQuotationPdfService, PlaceholderQuotationPdfService>();
builder.Services.AddSingleton<INotificationService, PlaceholderNotificationService>();
builder.Services.AddScoped<IOrderUpdaterService, OrderUpdaterService>();
builder.Services.AddScoped<IOrderAdminService, OrderAdminService>();

// --- API plumbing -----------------------------------------------------------
builder.Services.AddControllers();
builder.Services.AddProblemDetails();
builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
builder.Services.AddSwaggerDocumentation();

builder.Services.AddHealthChecks()
    .AddDbContextCheck<AppDbContext>("database");

// CORS: allow only the configured frontend origin; credentials enabled for
// the HttpOnly refresh cookie.
var frontendOrigin = builder.Configuration["Frontend:BaseUrl"] ?? "http://localhost:5173";
builder.Services.AddCors(options =>
    options.AddPolicy("Frontend", policy => policy
        .WithOrigins(frontendOrigin)
        .AllowAnyHeader()
        .AllowAnyMethod()
        .AllowCredentials()));

var app = builder.Build();

app.UseExceptionHandler();

if (app.Environment.IsDevelopment())
{
    // Swagger UI is exposed only in development, per requirements §15.
    app.UseSwagger();
    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint("/swagger/v1/swagger.json", "Shakti Udyog API v1");
    });
}
else
{
    app.UseHsts();
}
app.UseHttpsRedirection();
app.UseCors("Frontend");
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHealthChecks("/health");

// Seed fixed roles (idempotent) and, in Development only, a demo admin.
using (var scope = app.Services.CreateScope())
{
    var logger = scope.ServiceProvider.GetRequiredService<ILoggerFactory>().CreateLogger("Startup");
    try
    {
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        if (await db.Database.CanConnectAsync())
        {
            var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<ApplicationRole>>();
            await RoleSeeder.SeedAsync(roleManager);

            if (app.Environment.IsDevelopment())
            {
                var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
                await DevAdminSeeder.SeedAsync(userManager, app.Configuration["DevAdmin:Password"], logger);
                await DevPortalSeeder.SeedAsync(db, userManager, app.Configuration["DevCustomer:Password"], logger);
            }

            logger.LogInformation("Startup seeding completed.");
        }
        else
        {
            logger.LogWarning("Database not reachable; skipped seeding. Apply migrations and restart.");
        }
    }
    catch (Exception ex) when (app.Environment.IsDevelopment())
    {
        logger.LogWarning(ex, "Startup seeding failed in Development; continuing startup.");
    }
}

app.Run();

// Exposed for WebApplicationFactory-based integration tests.
public partial class Program;
