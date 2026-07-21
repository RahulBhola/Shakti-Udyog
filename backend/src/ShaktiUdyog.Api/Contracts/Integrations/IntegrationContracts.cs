namespace ShaktiUdyog.Api.Contracts.Integrations;

/// <summary>Webhook payload for incoming invoice from a vendor/external system.</summary>
public record InvoiceWebhookRequest(
    string InvoiceNumber,
    string VendorReference,
    string CustomerEmail,
    string CompanyName,
    Guid? OrderId,
    DateTimeOffset IssueDate,
    DateTimeOffset? DueDate,
    decimal Subtotal,
    decimal Tax,
    decimal Total,
    string Currency,
    string? PurchaseOrderReference,
    IReadOnlyList<InvoiceLineWebhookItem>? LineItems);

public record InvoiceLineWebhookItem(
    string Description,
    int Quantity,
    string Unit,
    decimal UnitPrice,
    decimal? TaxPercent,
    decimal LineTotal);

public record WebhookResponse(string Status, string Message, Guid? InvoiceId);
