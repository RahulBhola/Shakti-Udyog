namespace ShaktiUdyog.Domain.Entities;

/// <summary>
/// Structured address for a customer company. Supports multiple address types
/// such as Head Office, Factory, Warehouse, Billing, Shipping.
/// </summary>
public class CompanyAddress
{
    public Guid Id { get; set; }
    public Guid CompanyId { get; set; }
    public Company Company { get; set; } = null!;
    public required string AddressType { get; set; }
    public required string Address { get; set; }
    public string? City { get; set; }
    public string? State { get; set; }
    public string? Country { get; set; }
    public string? PinCode { get; set; }
    public bool IsPrimary { get; set; }
    public DateTimeOffset CreatedAtUtc { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAtUtc { get; set; } = DateTimeOffset.UtcNow;
}