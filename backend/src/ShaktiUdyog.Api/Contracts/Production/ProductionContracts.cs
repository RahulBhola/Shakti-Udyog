namespace ShaktiUdyog.Api.Contracts.Production;

// ── Board DTOs ──────────────────────────────────────────────────────────────

public record ProductionBoardDto(Guid Id, string Name, string? Description, bool IsActive, int JobCount, DateTimeOffset CreatedAtUtc);

// ── Job DTOs ────────────────────────────────────────────────────────────────

public record ProductionJobListItemDto(
    Guid Id,
    string JobNumber,
    string CastingName,
    string CurrentStage,
    int StagePosition,
    string? Priority,
    string? PartNumber,
    string? DrawingNumber,
    string? MaterialGrade,
    decimal? CastingWeight,
    int Quantity,
    string CompanyName,
    DateTimeOffset? TargetDispatchDateUtc,
    int ProgressPercent,
    string Status,
    bool IsBlocked,
    string? AssignedEngineer,
    string? AssignedSupervisor,
    DateTimeOffset CreatedAtUtc
);

public record ProductionJobDetailDto(
    Guid Id,
    string JobNumber,
    string CastingName,
    string CurrentStage,
    string? Priority,
    string? PartNumber,
    string? DrawingNumber,
    string? PatternNumber,
    string? MaterialGrade,
    decimal? CastingWeight,
    int Quantity,
    int ProgressPercent,
    string? ProductionBatch,
    DateTimeOffset? TargetDispatchDateUtc,
    DateTimeOffset? EstimatedCompletionUtc,
    string? CurrentMachine,
    string? CurrentOperator,
    string? AssignedEngineer,
    string? AssignedSupervisor,
    string? Department,
    string Status,
    bool IsBlocked,
    string? BlockReason,
    // Linked entities
    Guid CompanyId,
    string CompanyName,
    Guid? OrderId,
    string? OrderNumber,
    Guid? RfqId,
    string? RfqProductType,
    Guid? QuotationId,
    string? QuotationNumber,
    // Timestamps
    DateTimeOffset CreatedAtUtc,
    DateTimeOffset? UpdatedAtUtc,
    // Sub-collections
    IReadOnlyList<StageHistoryDto> StageHistory,
    IReadOnlyList<QualityDto> QualityInspections,
    IReadOnlyList<CommentDto> Comments,
    IReadOnlyList<TimelineDto> Timeline
);

// ── Sub-DTOs ────────────────────────────────────────────────────────────────

public record StageHistoryDto(
    Guid Id,
    string FromStage,
    string ToStage,
    string? ChangedByName,
    string? Remarks,
    DateTimeOffset OccurredAtUtc
);

public record QualityDto(
    Guid Id,
    string InspectionStatus,
    int AcceptedQuantity,
    int RejectedQuantity,
    int ReworkQuantity,
    bool HardnessTest,
    bool ChemicalAnalysis,
    bool DimensionalInspection,
    bool VisualInspection,
    string? NdtResult,
    string? Inspector,
    DateTimeOffset? InspectionDateUtc,
    string? Remarks,
    DateTimeOffset CreatedAtUtc
);

public record CommentDto(
    Guid Id,
    string AuthorName,
    string? AuthorRole,
    string Message,
    string? CommentType,
    DateTimeOffset CreatedAtUtc
);

public record TimelineDto(
    Guid Id,
    string Event,
    string? Details,
    string? ActorName,
    DateTimeOffset OccurredAtUtc
);

// ── Dashboard DTOs ──────────────────────────────────────────────────────────

public record ProductionDashboardDto(
    int TotalActiveJobs,
    int JobsInProduction,
    int DelayedJobs,
    int JobsDueThisWeek,
    int CompletedThisMonth,
    decimal QualityPassRate,
    IReadOnlyList<StageCountDto> JobsByStage,
    IReadOnlyList<PriorityCountDto> JobsByPriority
);

public record StageCountDto(string Stage, int Count);
public record PriorityCountDto(string Priority, int Count);

// ── Request DTOs ────────────────────────────────────────────────────────────

public record CreateProductionJobRequest(
    Guid CompanyId,
    string CastingName,
    int Quantity,
    Guid? OrderId,
    Guid? RfqId,
    Guid? QuotationId,
    string? PartNumber,
    string? DrawingNumber,
    string? PatternNumber,
    string? MaterialGrade,
    decimal? CastingWeight,
    string? Priority,
    DateTimeOffset? TargetDispatchDateUtc,
    string? AssignedEngineer,
    string? AssignedSupervisor,
    string? Department,
    string? ProductionBatch,
    string? Notes
);

public record UpdateProductionJobRequest(
    string? CastingName,
    int? Quantity,
    string? PartNumber,
    string? DrawingNumber,
    string? PatternNumber,
    string? MaterialGrade,
    decimal? CastingWeight,
    string? Priority,
    DateTimeOffset? TargetDispatchDateUtc,
    string? AssignedEngineer,
    string? AssignedSupervisor,
    string? Department,
    string? ProductionBatch,
    string? Status,
    int? ProgressPercent,
    string? CurrentMachine,
    string? CurrentOperator,
    string? Notes
);

public record MoveStageRequest(string ToStage, string? Remarks);

public record UpdateQualityRequest(
    string InspectionStatus,
    int AcceptedQuantity,
    int RejectedQuantity,
    int ReworkQuantity,
    bool HardnessTest,
    bool ChemicalAnalysis,
    bool DimensionalInspection,
    bool VisualInspection,
    string? NdtResult,
    string? Inspector,
    string? Remarks
);

public record AddProductionCommentRequest(string Message, string? CommentType);

// ── Lookup DTOs ─────────────────────────────────────────────────────────────

public record StageDto(Guid Id, string Name, int SortOrder, string? Color, bool IsActive);
public record DepartmentDto(Guid Id, string Name);
public record MachineDto(Guid Id, string Name, string? Department, string? Status);

// ── Board Preferences ───────────────────────────────────────────────────────

public record BoardPreferenceDto(
    string? VisibleColumns,
    string? VisibleCardFields,
    string CardSize,
    string DisplayMode,
    string? ColumnOrder
);

public record SaveBoardPreferenceRequest(
    string? VisibleColumns,
    string? VisibleCardFields,
    string? CardSize,
    string? DisplayMode,
    string? ColumnOrder
);

// ── Shared ──────────────────────────────────────────────────────────────────

public record MessageResponse(string Message);
