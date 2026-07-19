using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using ShaktiUdyog.Api.Infrastructure;
using ShaktiUdyog.Domain.Constants;
using ShaktiUdyog.Domain.Entities;
using ShaktiUdyog.Infrastructure.Data;

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
// Identity core services only (user/role stores, secure password hashing).
// JWT issuance, refresh-token rotation, and login endpoints are Milestone 2.
builder.Services
    .AddIdentityCore<ApplicationUser>(options =>
    {
        options.Password.RequiredLength = 12;
        options.Password.RequireDigit = true;
        options.Password.RequireLowercase = true;
        options.Password.RequireUppercase = true;
        options.Password.RequireNonAlphanumeric = true;
        options.User.RequireUniqueEmail = true;
        options.Lockout.MaxFailedAccessAttempts = 5;
        options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(15);
    })
    .AddRoles<ApplicationRole>()
    .AddEntityFrameworkStores<AppDbContext>();

// --- Authorization ----------------------------------------------------------
// Backend-enforced role policies. Fine-grained permission policies are added
// in Milestone 2; nothing relies on frontend-only checks.
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy(AuthPolicies.RequireAdmin, p => p.RequireRole(Roles.Admin));
    options.AddPolicy(AuthPolicies.RequireDataUpdater, p => p.RequireRole(Roles.DataUpdater, Roles.Admin));
    options.AddPolicy(AuthPolicies.RequireCustomer, p => p.RequireRole(Roles.Customer));
});

// --- API plumbing -----------------------------------------------------------
builder.Services.AddControllers();
builder.Services.AddProblemDetails();
builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
builder.Services.AddSwaggerDocumentation();

builder.Services.AddHealthChecks()
    .AddDbContextCheck<AppDbContext>("database");

// CORS: allow only the configured frontend origin (no wildcard).
var frontendOrigin = builder.Configuration["Frontend:BaseUrl"] ?? "http://localhost:5173";
builder.Services.AddCors(options =>
    options.AddPolicy("Frontend", policy => policy
        .WithOrigins(frontendOrigin)
        .AllowAnyHeader()
        .AllowAnyMethod()));

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
app.UseAuthorization();

app.MapControllers();
app.MapHealthChecks("/health");

// Seed fixed roles at startup (idempotent). Skipped when the database is not
// reachable in Development so the API can still start for frontend work.
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
            logger.LogInformation("Role seeding completed.");
        }
        else
        {
            logger.LogWarning("Database not reachable; skipped role seeding. Apply migrations and restart.");
        }
    }
    catch (Exception ex) when (app.Environment.IsDevelopment())
    {
        logger.LogWarning(ex, "Role seeding failed in Development; continuing startup.");
    }
}

app.Run();

// Exposed for WebApplicationFactory-based integration tests.
public partial class Program;
