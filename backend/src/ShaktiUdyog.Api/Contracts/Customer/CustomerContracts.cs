using System.ComponentModel.DataAnnotations;

namespace ShaktiUdyog.Api.Contracts.Customer;

// ---- Dashboard --------------------------------------------------------------

public record DashboardDto(
    int OpenEnquiries,
    int ActiveQuotations,
    int ActiveOrders,
    int UnpaidInvoices,
    int UnreadNotifications,
    IReadOnlyList<ActivityItemDto> RecentActivity,
    IReadOnlyList<DocumentListItemDto> RecentDocuments);

public record ActivityItemDto(string Type, string Title, string? LinkPath, DateTimeOffset OccurredAtUtc);

// ---- Enquirys -------------------------------------------------------------------

public record EnquiryListItemDto(
    Guid Id, string ProductType, string Quantity, string Status, bool IsDraft,
    int FileCount, DateTimeOffset CreatedAtUtc,
    string? PartName, string? PartNumber, string? Industry, string? ProductionQuantity,
    Guid? FirstFileId = null, string? FirstFileContentType = null);

public record EnquiryDetailDto(
    Guid Id, string FullName, string CompanyName, string ProductType,
    string? MaterialGrade, string Quantity, string? DeliveryLocation,
    string RequirementDetails, string Status, bool IsDraft,
    IReadOnlyList<EnquiryFileDto> Files, DateTimeOffset CreatedAtUtc,
    string? PartName, string? PartNumber, string? Industry, string? Application,
    string? MaterialStandard, decimal? ApproxWeight,
    string? MachiningRequired, string? PatternAvailability,
    string? PrototypeQuantity, string? ProductionQuantity, string? AnnualRequirement,
    DateTimeOffset? ExpectedDeliveryDate, string? PreferredDeliveryTerms,
    string? AdditionalRequirements, string? Remarks);

public record EnquiryFileDto(Guid Id, string FileName, long SizeBytes, DateTimeOffset UploadedAtUtc);

public record CreateEnquiryRequest(
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

public record EnquiryTimelineEntryDto(
    string FromStatus, string ToStatus, string ChangedByRole,
    string? Note, DateTimeOffset OccurredAtUtc);

/// <summary>DTO for updating a draft Enquiry. All fields are optional — only supplied fields are changed.</summary>
public record UpdateEnquiryRequest(
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
    Guid Id, string QuotationNumber, int RevisionNumber, Guid EnquiryId, string ProductType,
    decimal Total, string Currency, string Status,
    DateTimeOffset? ValidUntilUtc, DateTimeOffset CreatedAtUtc,
    string? CompanyName, int ItemCount, string? PaymentTerms, string? DeliveryTime);

public record QuotationDetailDto(
    Guid Id, string QuotationNumber, int RevisionNumber, Guid EnquiryId, string ProductType,
    decimal Subtotal, decimal Tax, decimal Discount, decimal Total,
    string Currency, string? PaymentTerms, string? DeliveryTerms,
    string? Freight, string? Packing, string? Remarks,
    string? DeliveryTime, string? Warranty,
    string Status, string? CustomerResponseComment, DateTimeOffset? CustomerRespondedAtUtc,
    DateTimeOffset? ValidUntilUtc, Guid? DocumentId, DateTimeOffset CreatedAtUtc,
    Guid? OrderId, string? OrderNumber,
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
    string? CompanyName, string? ProductType,
    Guid? AssignedToUserId, string? AssignedToName);

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
    IReadOnlyList<OrderMilestoneDto> Milestones,
    Guid? AssignedToUserId, string? AssignedToName);

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
    string? VehicleNumber, string? PhoneNumber,
    DateTimeOffset? DispatchDateUtc, DateTimeOffset? EstimatedArrivalUtc,
    DateTimeOffset? DeliveredAtUtc, bool HasProofOfDelivery);

public record CreateShipmentRequest(
    string? Transporter, string? TrackingNumber,
    string? VehicleNumber, string? PhoneNumber,
    DateTimeOffset? DispatchDateUtc, DateTimeOffset? EstimatedArrivalUtc);

public record TimelineEntryDto(
    string StatusCode, string StatusLabel, string? Message,
    string ActorType, DateTimeOffset OccurredAtUtc);

public record SupportRequestRequest(
    [Required, StringLength(200, MinimumLength = 3)] string Subject,
    [Required, StringLength(4000, MinimumLength = 10)] string Message);

public record CreateGeneralSupportRequest(
    [Required, StringLength(200, MinimumLength = 3)] string Subject,
    [Required, StringLength(4000, MinimumLength = 10)] string Message,
    Guid? OrderId = null,
    string? Category = null);

public record SupportRequestListItemDto(
    Guid Id,
    Guid? OrderId,
    string? OrderNumber,
    string Subject,
    string Message,
    string Status,
    DateTimeOffset CreatedAtUtc);

// ---- Invoices & payments ----------------------------------------------------

public record InvoiceListItemDto(
    Guid Id, Guid OrderId, string InvoiceNumber, string? OrderNumber, DateTimeOffset IssueDateUtc,
    DateTimeOffset? DueDateUtc, decimal Total, decimal AmountPaid, decimal BalanceDue,
    string Currency, string Status, string? CompanyName, string? CompanyLogoUrl,
    string? CompanyEmail, string? CompanyPhone);

public record InvoiceDetailDto(
    Guid Id, Guid OrderId, string InvoiceNumber, string? OrderNumber, DateTimeOffset IssueDateUtc,
    DateTimeOffset? DueDateUtc, decimal Subtotal, decimal Tax, decimal Total,
    decimal AmountPaid, decimal BalanceDue, string Currency, string Status,
    Guid? DocumentId, string? CompanyName,
    IReadOnlyList<InvoiceItemDto> Items, IReadOnlyList<PaymentDto> Payments);

public record InvoiceItemDto(
    Guid Id, string Description, string? HsnSacCode, int Quantity, string Unit,
    decimal UnitPrice, decimal TaxPercent, decimal LineTotal);

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
    string? OrderNumber, DateTimeOffset CreatedAtUtc,
    string? ContentType = null, Guid? OrderId = null);

// ---- Notifications ----------------------------------------------------------

public record NotificationDto(
    Guid Id, string Type, string Title, string? Body, string? LinkPath,
    bool IsRead, DateTimeOffset CreatedAtUtc);

public record PagedResult<T>(IReadOnlyList<T> Items, int Page, int PageSize, int TotalCount);

// ---- Profile ----------------------------------------------------------------

public record ProfileDto(
    string Email, string? FullName, string? PhoneNumber,
    CompanyProfileDto? Company, bool MfaEnabled,
    DateTimeOffset? AccountCreatedAtUtc = null,
    string? AvatarUrl = null,
    bool EmailConfirmed = true,
    bool PhoneNumberConfirmed = false);

public record CompanyProfileDto(
    string Name, string? AddressLine1, string? City, string? State,
    string? PostalCode, string? Country, string? GstNumber, string? DeliveryAddresses);

public record UpdateProfileRequest(
    [StringLength(150)] string? FullName,
    [StringLength(30)] string? PhoneNumber,
    [StringLength(4000)] string? DeliveryAddresses,
    [StringLength(5_000_000)] string? AvatarUrl = null);

public record ChangePasswordRequest(
    [Required] string CurrentPassword,
    [Required, MinLength(12)] string NewPassword);

public record SendPhoneOtpRequest(string? PhoneNumber);

public record SendPhoneOtpResponse(string Message, string? DemoOtp, DateTimeOffset ExpiresAtUtc);

public record VerifyPhoneOtpRequest([Required] string PhoneNumber, [Required] string Otp);

// ---- Expanded Company -------------------------------------------------------

public record CompanyDetailDto(
    Guid Id,
    string Name,
    string? LegalBusinessName,
    string? BusinessType,
    string? Industry,
    string? Website,
    string? CompanyEmail,
    string? CompanyPhone,
    string? PurchaseEmail,
    string? AccountsEmail,
    string? RegisteredAddress,
    string? FactoryAddress,
    string? City,
    string? State,
    string? Country,
    string? PinCode,
    string? GstNumber,
    string? PanNumber,
    string? CinNumber,
    string? MsmeNumber,
    string? PreferredCurrency,
    string? PreferredPaymentMethod,
    string? PreferredCommunication,
    string? PreferredLanguage,
    string? CompanyLogoUrl,
    string VerificationStatus,
    DateTimeOffset? VerificationSubmittedOn,
    DateTimeOffset? VerifiedOn,
    bool GstVerified,
    bool EmailVerified,
    bool PhoneVerified);

public record UpdateCompanyRequest(
    [StringLength(300)] string? LegalBusinessName,
    [StringLength(100)] string? BusinessType,
    [StringLength(200)] string? Industry,
    [StringLength(500)] string? Website,
    [StringLength(254)] string? CompanyEmail,
    [StringLength(30)] string? CompanyPhone,
    [StringLength(254)] string? PurchaseEmail,
    [StringLength(254)] string? AccountsEmail,
    [StringLength(500)] string? RegisteredAddress,
    [StringLength(500)] string? FactoryAddress,
    [StringLength(150)] string? City,
    [StringLength(150)] string? State,
    [StringLength(100)] string? Country,
    [StringLength(20)] string? PinCode,
    [StringLength(30)] string? GstNumber,
    [StringLength(20)] string? PanNumber,
    [StringLength(30)] string? CinNumber,
    [StringLength(30)] string? MsmeNumber,
    [StringLength(10)] string? PreferredCurrency,
    [StringLength(100)] string? PreferredPaymentMethod,
    [StringLength(100)] string? PreferredCommunication,
    [StringLength(50)] string? PreferredLanguage);

// ---- Contact Persons --------------------------------------------------------

public record ContactPersonDto(
    Guid Id,
    string FullName,
    string Designation,
    string? Department,
    string Email,
    string Phone,
    bool IsPrimary,
    DateTimeOffset CreatedAtUtc);

public record CreateContactPersonRequest(
    [Required, StringLength(200)] string FullName,
    [Required, StringLength(150)] string Designation,
    [StringLength(150)] string? Department,
    [Required, StringLength(254)] string Email,
    [Required, StringLength(30)] string Phone,
    bool IsPrimary = false);

public record UpdateContactPersonRequest(
    [StringLength(200)] string? FullName,
    [StringLength(150)] string? Designation,
    [StringLength(150)] string? Department,
    [StringLength(254)] string? Email,
    [StringLength(30)] string? Phone,
    bool? IsPrimary = null);

// ---- Company Addresses ------------------------------------------------------

public record CompanyAddressDto(
    Guid Id,
    string AddressType,
    string Address,
    string? City,
    string? State,
    string? Country,
    string? PinCode,
    bool IsPrimary,
    DateTimeOffset CreatedAtUtc);

public record CreateCompanyAddressRequest(
    [Required, StringLength(50)] string AddressType,
    [Required, StringLength(500)] string Address,
    [StringLength(150)] string? City,
    [StringLength(150)] string? State,
    [StringLength(100)] string? Country,
    [StringLength(20)] string? PinCode,
    bool IsPrimary = false);

public record UpdateCompanyAddressRequest(
    [StringLength(50)] string? AddressType,
    [StringLength(500)] string? Address,
    [StringLength(150)] string? City,
    [StringLength(150)] string? State,
    [StringLength(100)] string? Country,
    [StringLength(20)] string? PinCode,
    bool? IsPrimary = null);

// ---- Company Documents ------------------------------------------------------

public record CompanyDocumentDto(
    Guid Id,
    string DocumentType,
    string FileName,
    long SizeBytes,
    string Status,
    string? Remarks,
    DateTimeOffset UploadedAtUtc);

public record UploadDocumentResponse(
    Guid Id,
    string DocumentType,
    string FileName,
    string Message);

// ---- Security ---------------------------------------------------------------

public record ActiveSessionDto(
    Guid Id,
    string? DeviceName,
    string? IpAddress,
    DateTimeOffset CreatedAtUtc,
    DateTimeOffset? LastUsedAtUtc,
    bool IsCurrent);

public record LoginHistoryEntryDto(
    string? IpAddress,
    string? UserAgent,
    bool Succeeded,
    DateTimeOffset OccurredAtUtc);

public record SecurityInfoDto(
    bool MfaEnabled,
    IReadOnlyList<ActiveSessionDto> ActiveSessions,
    IReadOnlyList<LoginHistoryEntryDto> RecentLoginHistory);

public record MfaSetupResponse(
    bool Enabled,
    string? SecretKey,
    string? QrCodeUrl);
