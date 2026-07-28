using System.ComponentModel.DataAnnotations;

namespace ShaktiUdyog.Api.Contracts.Customer;

// ---- Dashboard --------------------------------------------------------------

public record DashboardDto(
    int OpenRfqs,
    int ActiveQuotations,
    int ActiveOrders,
    int UnpaidInvoices,
    int UnreadNotifications,
    IReadOnlyList<ActivityItemDto> RecentActivity,
    IReadOnlyList<DocumentListItemDto> RecentDocuments);

public record ActivityItemDto(string Type, string Title, string? LinkPath, DateTimeOffset OccurredAtUtc);

// ---- RFQs -------------------------------------------------------------------

public record RfqListItemDto(
    Guid Id, string ProductType, string Quantity, string Status, bool IsDraft,
    int FileCount, DateTimeOffset CreatedAtUtc,
    string? PartName, string? PartNumber, string? Industry, string? ProductionQuantity);

public record RfqDetailDto(
    Guid Id, string FullName, string CompanyName, string ProductType,
    string? MaterialGrade, string Quantity, string? DeliveryLocation,
    string RequirementDetails, string Status, bool IsDraft,
    IReadOnlyList<RfqFileDto> Files, DateTimeOffset CreatedAtUtc,
    string? PartName, string? PartNumber, string? Industry, string? Application,
    string? MaterialStandard, decimal? ApproxWeight,
    string? MachiningRequired, string? PatternAvailability,
    string? PrototypeQuantity, string? ProductionQuantity, string? AnnualRequirement,
    DateTimeOffset? ExpectedDeliveryDate, string? PreferredDeliveryTerms,
    string? AdditionalRequirements, string? Remarks);

public record RfqFileDto(Guid Id, string FileName, long SizeBytes, DateTimeOffset UploadedAtUtc);

public record CreateRfqRequest(
    [Required, StringLength(100)] string ProductType,
    [StringLength(200)] string? MaterialGrade,
    [Required, StringLength(100)] string Quantity,
    [StringLength(300)] string? DeliveryLocation,
    [Required, StringLength(8000, MinimumLength = 10)] string RequirementDetails,
    bool SaveAsDraft,
    // New optional fields
    [StringLength(200)] string? PartName = null,
    [StringLength(100)] string? PartNumber = null,
    [StringLength(100)] string? Industry = null,
    [StringLength(8000)] string? Application = null,
    [StringLength(200)] string? MaterialStandard = null,
    decimal? ApproxWeight = null,
    [StringLength(50)] string? MachiningRequired = null,
    [StringLength(50)] string? PatternAvailability = null,
    [StringLength(100)] string? PrototypeQuantity = null,
    [StringLength(100)] string? ProductionQuantity = null,
    [StringLength(100)] string? AnnualRequirement = null,
    DateTimeOffset? ExpectedDeliveryDate = null,
    [StringLength(100)] string? PreferredDeliveryTerms = null,
    [StringLength(2000)] string? AdditionalRequirements = null,
    [StringLength(4000)] string? Remarks = null);

public record RfqTimelineEntryDto(
    string FromStatus, string ToStatus, string ChangedByRole,
    string? Note, DateTimeOffset OccurredAtUtc);

/// <summary>DTO for updating a draft RFQ. All fields are optional — only supplied fields are changed.</summary>
public record UpdateRfqRequest(
    string? ProductType, string? MaterialGrade, string? Quantity,
    string? DeliveryLocation, string? RequirementDetails,
    string? PartName = null, string? PartNumber = null,
    string? Industry = null, string? Application = null,
    string? MaterialStandard = null, decimal? ApproxWeight = null,
    string? MachiningRequired = null, string? PatternAvailability = null,
    string? PrototypeQuantity = null, string? ProductionQuantity = null,
    string? AnnualRequirement = null, DateTimeOffset? ExpectedDeliveryDate = null,
    string? PreferredDeliveryTerms = null, string? AdditionalRequirements = null,
    string? Remarks = null);

// ---- Quotations -------------------------------------------------------------

public record QuotationListItemDto(
    Guid Id, string QuotationNumber, int RevisionNumber, Guid RfqId, string ProductType,
    decimal Total, string Currency, string Status,
    DateTimeOffset? ValidUntilUtc, DateTimeOffset CreatedAtUtc);

public record QuotationDetailDto(
    Guid Id, string QuotationNumber, int RevisionNumber, Guid RfqId, string ProductType,
    decimal Subtotal, decimal Tax, decimal Discount, decimal Total,
    string Currency, string? PaymentTerms, string? DeliveryTerms,
    string? Freight, string? Packing, string? Remarks,
    string? DeliveryTime, string? Warranty,
    string Status, string? CustomerResponseComment, DateTimeOffset? CustomerRespondedAtUtc,
    DateTimeOffset? ValidUntilUtc, Guid? DocumentId, DateTimeOffset CreatedAtUtc,
    IReadOnlyList<QuotationItemDto> Items);

public record QuotationItemDto(
    int LineNumber, string PartNumber, string Description, string? MaterialGrade,
    int Quantity, string Unit, decimal UnitPrice, decimal TaxPercent, decimal LineTotal);

public record QuotationTimelineEntryDto(
    string FromStatus, string ToStatus, string ChangedByRole, string? Note, DateTimeOffset OccurredAtUtc);

public record QuotationResponseRequest(
    [Required, RegularExpression("^(accept|decline|negotiate)$", ErrorMessage = "Response must be 'accept', 'decline', or 'negotiate'.")]
    string Response,
    [StringLength(2000)] string? Comment);

// ---- Orders -----------------------------------------------------------------

public record OrderListItemDto(
    Guid Id, string OrderNumber, string Status, string StatusLabel,
    DateTimeOffset PlacedAtUtc, DateTimeOffset? PromisedDispatchDateUtc,
    int TotalQuantity, DateTimeOffset LastUpdatedAtUtc,
    string? CompanyName, string? ProductType);

public record OrderDetailDto(
    Guid Id, string OrderNumber, string? PurchaseOrderReference,
    string Status, string StatusLabel, string StatusDescription,
    DateTimeOffset PlacedAtUtc, DateTimeOffset? PromisedDispatchDateUtc,
    string? DeliveryAddress, DateTimeOffset LastUpdatedAtUtc,
    IReadOnlyList<OrderItemDto> Items,
    IReadOnlyList<ShipmentDto> Shipments,
    OrderCommercialDto? Commercial,
    IReadOnlyList<DocumentListItemDto> Documents,
    int AdvancePercent, decimal? AdvanceAmount, bool AdvancePaid,
    DateTimeOffset? AdvancePaidAtUtc, string? AdvancePaymentRef,
    DateTimeOffset? AdvanceVerifiedAtUtc,
    decimal? QuotationTotal, string? PaymentTerms, Guid? QuotationId,
    IReadOnlyList<OrderMilestoneDto> Milestones);

public record OrderItemDto(
    Guid Id, string PartNumber, string Description, string? MaterialGrade, string? DrawingRevision,
    string Unit, int QuantityOrdered, int QuantityProduced, int QuantityDispatched, decimal? UnitRate);

public record OrderMilestoneDto(
    Guid Id, string StatusCode, string? CustomerMessage, DateTimeOffset OccurredAtUtc);

public record OrderCommercialDto(
    string? InvoiceNumber, DateTimeOffset? InvoiceDateUtc, DateTimeOffset? DueDateUtc,
    decimal? Total, decimal? AmountPaid, decimal? BalanceDue, string? PaymentStatus);

public record ShipmentDto(
    Guid Id, string? Transporter, string? TrackingNumber,
    DateTimeOffset? DispatchDateUtc, DateTimeOffset? EstimatedArrivalUtc,
    DateTimeOffset? DeliveredAtUtc, bool HasProofOfDelivery);

public record TimelineEntryDto(
    string StatusCode, string StatusLabel, string? Message,
    string ActorType, DateTimeOffset OccurredAtUtc);

public record SupportRequestRequest(
    [Required, StringLength(200, MinimumLength = 3)] string Subject,
    [Required, StringLength(4000, MinimumLength = 10)] string Message);

// ---- Invoices & payments ----------------------------------------------------

public record InvoiceListItemDto(
    Guid Id, string InvoiceNumber, string? OrderNumber, DateTimeOffset IssueDateUtc,
    DateTimeOffset? DueDateUtc, decimal Total, decimal AmountPaid, decimal BalanceDue,
    string Currency, string Status);

public record InvoiceDetailDto(
    Guid Id, string InvoiceNumber, string? OrderNumber, DateTimeOffset IssueDateUtc,
    DateTimeOffset? DueDateUtc, decimal Subtotal, decimal Tax, decimal Total,
    decimal AmountPaid, decimal BalanceDue, string Currency, string Status,
    Guid? DocumentId, IReadOnlyList<PaymentDto> Payments);

public record PaymentDto(
    Guid Id, string PaymentReference, string Method, decimal Amount,
    DateTimeOffset PaymentDateUtc, string Status, DateTimeOffset CreatedAtUtc);

public record PaymentProofRequest(
    [Required] Guid InvoiceId,
    [Required, StringLength(100, MinimumLength = 3)] string PaymentReference,
    [Required, StringLength(50)] string Method,
    [Required, Range(0.01, 999999999)] decimal Amount,
    [Required] DateTimeOffset PaymentDateUtc);

// ---- Documents --------------------------------------------------------------

public record DocumentListItemDto(
    Guid Id, string Title, string Category, string FileName, long SizeBytes,
    string? OrderNumber, DateTimeOffset CreatedAtUtc);

// ---- Notifications ----------------------------------------------------------

public record NotificationDto(
    Guid Id, string Type, string Title, string? Body, string? LinkPath,
    bool IsRead, DateTimeOffset CreatedAtUtc);

public record PagedResult<T>(IReadOnlyList<T> Items, int Page, int PageSize, int TotalCount);

// ---- Profile ----------------------------------------------------------------

public record ProfileDto(
    string Email, string? FullName, string? PhoneNumber,
    CompanyProfileDto? Company, bool MfaEnabled);

public record CompanyProfileDto(
    string Name, string? AddressLine1, string? City, string? State,
    string? PostalCode, string? Country, string? GstNumber, string? DeliveryAddresses);

public record UpdateProfileRequest(
    [StringLength(150)] string? FullName,
    [StringLength(30)] string? PhoneNumber,
    [StringLength(4000)] string? DeliveryAddresses);

public record ChangePasswordRequest(
    [Required] string CurrentPassword,
    [Required, MinLength(12)] string NewPassword);
