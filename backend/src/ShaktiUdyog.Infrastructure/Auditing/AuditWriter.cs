using ShaktiUdyog.Domain.Entities;
using ShaktiUdyog.Infrastructure.Data;

namespace ShaktiUdyog.Infrastructure.Auditing;

public interface IAuditWriter
{
    Task WriteAsync(
        string action,
        Guid? userId = null,
        string? entityType = null,
        string? entityId = null,
        string? ipAddress = null,
        string? userAgent = null);
}

/// <summary>
/// Appends entries to the immutable AuditLogs table. Failures to write an
/// audit record must not be swallowed — auditing sensitive actions is a
/// requirement, so exceptions propagate to the caller.
/// </summary>
public class AuditWriter(AppDbContext db) : IAuditWriter
{
    public async Task WriteAsync(
        string action,
        Guid? userId = null,
        string? entityType = null,
        string? entityId = null,
        string? ipAddress = null,
        string? userAgent = null)
    {
        db.AuditLogs.Add(new AuditLog
        {
            Action = action,
            UserId = userId,
            EntityType = entityType,
            EntityId = entityId,
            IpAddress = ipAddress,
            UserAgent = userAgent,
        });
        await db.SaveChangesAsync();
    }
}
