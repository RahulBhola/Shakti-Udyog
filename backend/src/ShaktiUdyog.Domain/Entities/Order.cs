using ShaktiUdyog.Domain.Constants;

namespace ShaktiUdyog.Domain.Entities;

/// <summary>
/// Confirmed customer order (requirements §14/§18). Customers see only
/// customer-visible fields and milestones; internal notes stay internal.
/// </summary>
public class Order
{
    public Guid Id { get; set; }
    public required string OrderNumber { get; set; }
    public Guid CompanyId { get; set; }
    public Company Company { get; set; } = null!;
    public Guid? QuotationId { get; set; }
    public Quotation? Quotation { get; set; }
    public string? PurchaseOrderReference { get; set; }
    public string Status { get; set; } = OrderStatuses.Confirmed;
    public DateTimeOffset PlacedAtUtc { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? PromisedDispatchDateUtc { get; set; }
    public string? DeliveryAddress { get; set; }
    public DateTimeOffset LastUpdatedAtUtc { get; set; } = DateTimeOffset.UtcNow;

    public List<OrderItem> Items { get; set; } = [];
    public List<OrderMilestone> Milestones { get; set; } = [];
    public List<Shipment> Shipments { get; set; } = [];
}

public class OrderItem
{
    public Guid Id { get; set; }
    public Guid OrderId { get; set; }
    public Order Order { get; set; } = null!;
    public required string PartNumber { get; set; }
    public required string Description { get; set; }
    public string? MaterialGrade { get; set; }
    public string? DrawingRevision { get; set; }
    public string Unit { get; set; } = "pcs";
    public int QuantityOrdered { get; set; }
    public int QuantityProduced { get; set; }
    public int QuantityDispatched { get; set; }
    /// <summary>Line value data is commercial; exposed to customers only in summaries.</summary>
    public decimal? UnitRate { get; set; }
}

public class OrderMilestone
{
    public Guid Id { get; set; }
    public Guid OrderId { get; set; }
    public Order Order { get; set; } = null!;
    public required string StatusCode { get; set; }
    /// <summary>Message shown to the customer when IsCustomerVisible is true.</summary>
    public string? CustomerMessage { get; set; }
    /// <summary>Internal production note — NEVER exposed through customer APIs.</summary>
    public string? InternalNote { get; set; }
    public bool IsCustomerVisible { get; set; } = true;
    public string ActorType { get; set; } = "Staff";
    public DateTimeOffset OccurredAtUtc { get; set; } = DateTimeOffset.UtcNow;
}
