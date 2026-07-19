namespace ShaktiUdyog.Domain.Entities;

/// <summary>
/// Immutable audit record for sensitive actions (permission, order, invoice,
/// payment, and status changes). Rows are insert-only: the DbContext rejects
/// updates and deletes to this table.
/// </summary>
public class AuditLog
{
    public long Id { get; set; }

    /// <summary>Acting user, if authenticated. Null for anonymous/system events.</summary>
    public Guid? UserId { get; set; }

    /// <summary>Action identifier, e.g. "role.assigned", "order.status.changed".</summary>
    public required string Action { get; set; }

    /// <summary>Entity type the action applies to, e.g. "Order", "User".</summary>
    public string? EntityType { get; set; }

    /// <summary>Identifier of the affected entity, stored as text.</summary>
    public string? EntityId { get; set; }

    /// <summary>JSON snapshot of relevant old values, when applicable.</summary>
    public string? OldValues { get; set; }

    /// <summary>JSON snapshot of relevant new values, when applicable.</summary>
    public string? NewValues { get; set; }

    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }
    public DateTimeOffset OccurredAtUtc { get; set; } = DateTimeOffset.UtcNow;
}
