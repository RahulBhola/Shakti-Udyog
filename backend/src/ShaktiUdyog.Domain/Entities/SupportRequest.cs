namespace ShaktiUdyog.Domain.Entities;

/// <summary>Customer support request, optionally linked to an order (requirements §18).</summary>
public class SupportRequest
{
    public Guid Id { get; set; }
    public Guid CompanyId { get; set; }
    public Company Company { get; set; } = null!;
    public Guid? OrderId { get; set; }
    public Order? Order { get; set; }
    public Guid RaisedByUserId { get; set; }
    public required string Subject { get; set; }
    public required string Message { get; set; }
    /// <summary>Open | In Progress | Resolved | Closed (staff-managed later).</summary>
    public string Status { get; set; } = "Open";
    public DateTimeOffset CreatedAtUtc { get; set; } = DateTimeOffset.UtcNow;
}
