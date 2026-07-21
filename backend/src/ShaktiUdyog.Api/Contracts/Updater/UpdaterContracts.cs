using ShaktiUdyog.Api.Contracts.Customer;

namespace ShaktiUdyog.Api.Contracts.Updater;

// ---- RFQs -------------------------------------------------------------------

public record UpdaterRfqListItemDto(
    Guid Id, string ProductType, string? CompanyName, string Quantity,
    string Status, bool IsDraft, Guid? AssignedToUserId, int FileCount,
    DateTimeOffset CreatedAtUtc);

public record UpdaterRfqDetailDto(
    Guid Id, string FullName, string CompanyName, string Email, string Phone,
    string ProductType, string? MaterialGrade, string Quantity,
    string? DeliveryLocation, string RequirementDetails, string Status, bool IsDraft,
    string? SubmittedByIp, DateTimeOffset CreatedAtUtc,
    IReadOnlyList<UpdaterRfqFileDto> Files,
    IReadOnlyList<RfqTimelineEntryDto> StatusHistory,
    IReadOnlyList<RfqCommentDto> Comments,
    Guid? AssignedToUserId);

public record UpdaterRfqFileDto(
    Guid Id, string FileName, string ContentType, long SizeBytes,
    string StorageKey, Guid? UploadedByUserId, DateTimeOffset UploadedAtUtc);

public record RfqCommentDto(
    Guid Id, Guid AuthorUserId, string AuthorRole, bool IsCustomerVisible,
    string Message, DateTimeOffset CreatedAtUtc);
