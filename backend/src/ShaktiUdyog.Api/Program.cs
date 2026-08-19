using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.EntityFrameworkCore;
using ShaktiUdyog.Api.Hubs;
using ShaktiUdyog.Api.Infrastructure;
using ShaktiUdyog.Domain.Entities;
using ShaktiUdyog.Infrastructure;
using ShaktiUdyog.Infrastructure.Data;

var builder = WebApplication.CreateBuilder(args);

// --- Register Clean Architecture Layers via Dependency Injection Extensions ---
builder.Services
    .AddInfrastructure(builder.Configuration)
    .AddIdentityInfrastructure()
    .AddApplicationServices()
    .AddJwtAuthentication(builder.Configuration)
    .AddSecurityAuthorization()
    .AddApiRateLimiting(builder.Configuration)
    .AddApiPresentation(builder.Configuration);

var app = builder.Build();

// --- Reverse Proxy & Security Headers ---
var forwardedOptions = new ForwardedHeadersOptions
{
    ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto,
    ForwardLimit = 2,
};
foreach (var ip in builder.Configuration.GetSection("ForwardedHeaders:KnownProxies").Get<string[]?>() ?? [])
{
    if (System.Net.IPAddress.TryParse(ip, out var parsed)) forwardedOptions.KnownProxies.Add(parsed);
}
foreach (var network in builder.Configuration.GetSection("ForwardedHeaders:KnownNetworks").Get<string[]?>() ?? [])
{
    var net = ParseIpNetwork(network);
    if (net is not null) forwardedOptions.KnownNetworks.Add(net);
}
app.UseForwardedHeaders(forwardedOptions);

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

// --- Endpoints & Hubs ---
app.MapControllers();
app.MapHub<PortalHub>("/api/v1/portal-hub");
app.MapHub<PortalHub>("/hubs/portal");
app.MapHealthChecks("/health");

// --- Database Migration & Development Seeding ---
using (var scope = app.Services.CreateScope())
{
    var logger = scope.ServiceProvider.GetRequiredService<ILoggerFactory>().CreateLogger("Startup");
    try
    {
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        if (await db.Database.CanConnectAsync())
        {
            // Apply any pending schema migrations so tables always exist on startup.
            await db.Database.MigrateAsync();

            var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<ApplicationRole>>();
            await RoleSeeder.SeedAsync(roleManager);

            // One-time migration: replace the retired "DataUpdater" role with "Engineer".
            await RoleMigration.MigrateDataUpdaterToEngineerAsync(db);

            if (app.Environment.IsDevelopment())
            {
                var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
                await DevAdminSeeder.SeedAsync(userManager, app.Configuration["DevAdmin:Password"], db, logger);
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

// Parses a "ip/cidr" (or bare IP) string into the forwarded-headers IPNetwork type.
static Microsoft.AspNetCore.HttpOverrides.IPNetwork? ParseIpNetwork(string value)
{
    var parts = value.Split('/');
    if (!System.Net.IPAddress.TryParse(parts[0], out var ip)) return null;
    var prefix = parts.Length > 1 && int.TryParse(parts[1], out var p)
        ? p
        : ip.AddressFamily == System.Net.Sockets.AddressFamily.InterNetwork ? 32 : 128;
    return new Microsoft.AspNetCore.HttpOverrides.IPNetwork(ip, prefix);
}

// Exposed for WebApplicationFactory-based integration tests.
public partial class Program;
