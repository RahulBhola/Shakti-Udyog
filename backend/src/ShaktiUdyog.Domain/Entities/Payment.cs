using ShaktiUdyog.Domain.Constants;

namespace ShaktiUdyog.Domain.Entities;

/// <summary>
/// Customer payment record (requirements §14/§20). Milestone 4 supports only
/// offline payment-proof submission; gateway integration is a future,
/// abstracted concern. No card data is ever stored.
/// </summary>
public class Payment
{
    public Guid Id { get; set; }
    public Guid CompanyId { get; set; }
    public Company Company { get; set; } = null!;
    public Guid InvoiceId { get; set; }
    public Invoice Invoice { get; set; } = null!;
    /// <summary>Bank/UPI/NEFT reference supplied by the customer.</summary>
    public required string PaymentReference { get; set; }
    public string Method { get; set; } = "Bank Transfer";
    public decimal Amount { get; set; }
    public DateTimeOffset PaymentDateUtc { get; set; }
    public string Status { get; set; } = PaymentStatuses.PendingVerification;
    /// <summary>Uploaded proof document in protected storage.</summary>
    public Guid? ProofDocumentId { get; set; }
    public Guid? SubmittedByUserId { get; set; }
    public string? VerificationNote { get; set; }
    public DateTimeOffset CreatedAtUtc { get; set; } = DateTimeOffset.UtcNow;
}
