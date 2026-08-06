namespace ShaktiUdyog.Domain.Entities;

/// <summary>
/// Central production job card linking manufacturing work to the sales pipeline.
/// Tracks a casting from RFQ through dispatch across 25 workflow stages.
/// </summary>
public class ProductionJob
{
    public Guid Id { get; set; }
    public required string JobNumber { get; set; }

    // Links to business entities
    public Guid? OrderId { get; set; }
    public Order? Order { get; set; }
    public Guid? RfqId { get; set; }
    public Rfq? Rfq { get; set; }
    public Guid? QuotationId { get; set; }
    public Quotation? Quotation { get; set; }
    public Guid CompanyId { get; set; }
    public Company Company { get; set; } = null!;

    // Casting details
    public required string CastingName { get; set; }
    public string? PartNumber { get; set; }
    public string? DrawingNumber { get; set; }
    public string? PatternNumber { get; set; }
    public string? MaterialGrade { get; set; }
    public decimal? CastingWeight { get; set; }
    public int Quantity { get; set; }

    // Production tracking
    public string CurrentStage { get; set; } = "New RFQs";
    public string Priority { get; set; } = "Medium";
    public string? ProductionBatch { get; set; }
    public int ProgressPercent { get; set; }
    public DateTimeOffset? TargetDispatchDateUtc { get; set; }
    public DateTimeOffset? EstimatedCompletionUtc { get; set; }
    public string? CurrentMachine { get; set; }
    public string? CurrentOperator { get; set; }

    // Assignment
    public string? AssignedEngineer { get; set; }
    public string? AssignedSupervisor { get; set; }
    public string? Department { get; set; }

    // Status
    public string Status { get; set; } = "Active";
    public bool IsBlocked { get; set; }
    public string? BlockReason { get; set; }

    // Auditing
    public DateTimeOffset CreatedAtUtc { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? UpdatedAtUtc { get; set; }
    public bool IsDeleted { get; set; }
    public DateTimeOffset? DeletedAtUtc { get; set; }
    public byte[] RowVersion { get; set; } = [];

    // Navigation collections
    public List<ProductionStageHistory> StageHistory { get; set; } = [];
    public List<ProductionQuality> QualityInspections { get; set; } = [];
    public List<ProductionComment> Comments { get; set; } = [];
    public List<ProductionTimeline> Timeline { get; set; } = [];
}
