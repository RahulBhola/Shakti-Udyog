namespace ShaktiUdyog.Domain.Constants;

/// <summary>
/// The 25 workflow stages for manufacturing production jobs in an iron casting ERP.
/// Ordered from RFQ intake through dispatch.
/// </summary>
public static class ProductionStageNames
{
    public const string NewRfqs = "New RFQs";
    public const string EngineeringReview = "Engineering Review";
    public const string QuotationSent = "Quotation Sent";
    public const string CustomerApproval = "Customer Approval";
    public const string OrderConfirmed = "Order Confirmed";
    public const string PatternDesign = "Pattern Design";
    public const string PatternMaking = "Pattern Making";
    public const string MaterialPlanning = "Material Planning";
    public const string RawMaterialReady = "Raw Material Ready";
    public const string CoreMaking = "Core Making";
    public const string Moulding = "Moulding";
    public const string FurnaceCharging = "Furnace Charging";
    public const string Melting = "Melting";
    public const string Pouring = "Pouring";
    public const string Cooling = "Cooling";
    public const string Shakeout = "Shakeout";
    public const string Fettling = "Fettling";
    public const string ShotBlasting = "Shot Blasting";
    public const string Machining = "Machining";
    public const string HeatTreatment = "Heat Treatment";
    public const string SurfaceFinishing = "Surface Finishing";
    public const string QualityInspection = "Quality Inspection";
    public const string Packing = "Packing";
    public const string ReadyForDispatch = "Ready for Dispatch";
    public const string Dispatched = "Dispatched";

    /// <summary>Ordered list of all stages for workflow progression.</summary>
    public static readonly IReadOnlyList<string> Workflow =
    [
        NewRfqs, EngineeringReview, QuotationSent, CustomerApproval,
        OrderConfirmed, PatternDesign, PatternMaking, MaterialPlanning,
        RawMaterialReady, CoreMaking, Moulding, FurnaceCharging, Melting,
        Pouring, Cooling, Shakeout, Fettling, ShotBlasting, Machining,
        HeatTreatment, SurfaceFinishing, QualityInspection, Packing,
        ReadyForDispatch, Dispatched
    ];

    /// <summary>Sort order for each stage (zero-based index in the workflow).</summary>
    public static readonly IReadOnlyDictionary<string, int> SortOrder = Workflow
        .Select((name, index) => (name, index))
        .ToDictionary(x => x.name, x => x.index);

    /// <summary>Stage colors for the Kanban board column headers.</summary>
    public static readonly IReadOnlyDictionary<string, string> Colors = new Dictionary<string, string>
    {
        [NewRfqs] = "#6366f1",
        [EngineeringReview] = "#8b5cf6",
        [QuotationSent] = "#a78bfa",
        [CustomerApproval] = "#c4b5fd",
        [OrderConfirmed] = "#22c55e",
        [PatternDesign] = "#14b8a6",
        [PatternMaking] = "#06b6d4",
        [MaterialPlanning] = "#0ea5e9",
        [RawMaterialReady] = "#3b82f6",
        [CoreMaking] = "#f97316",
        [Moulding] = "#f59e0b",
        [FurnaceCharging] = "#ef4444",
        [Melting] = "#dc2626",
        [Pouring] = "#b91c1c",
        [Cooling] = "#64748b",
        [Shakeout] = "#78716c",
        [Fettling] = "#a8a29e",
        [ShotBlasting] = "#57534e",
        [Machining] = "#6366f1",
        [HeatTreatment] = "#d946ef",
        [SurfaceFinishing] = "#ec4899",
        [QualityInspection] = "#eab308",
        [Packing] = "#84cc16",
        [ReadyForDispatch] = "#22c55e",
        [Dispatched] = "#10b981",
    };

    /// <summary>Stage descriptions for tooltip text.</summary>
    public static readonly IReadOnlyDictionary<string, string> Descriptions = new Dictionary<string, string>
    {
        [NewRfqs] = "Incoming RFQs awaiting initial review",
        [EngineeringReview] = "Technical feasibility and design review",
        [QuotationSent] = "Quotation sent to customer",
        [CustomerApproval] = "Awaiting customer approval of quotation",
        [OrderConfirmed] = "Customer confirmed the order",
        [PatternDesign] = "3D/2D pattern design and approval",
        [PatternMaking] = "Pattern manufacturing",
        [MaterialPlanning] = "Bill of materials and material procurement",
        [RawMaterialReady] = "Raw materials charged and ready",
        [CoreMaking] = "Sand core production",
        [Moulding] = "Mould preparation and assembly",
        [FurnaceCharging] = "Charging raw materials into furnace",
        [Melting] = "Iron melting and temperature control",
        [Pouring] = "Molten iron pouring into moulds",
        [Cooling] = "Controlled cooling of castings",
        [Shakeout] = "Breaking moulds and extracting castings",
        [Fettling] = "Removing risers, gates, and excess material",
        [ShotBlasting] = "Surface cleaning by shot blasting",
        [Machining] = "CNC and manual machining operations",
        [HeatTreatment] = "Stress relief and heat treatment",
        [SurfaceFinishing] = "Painting, coating, or surface treatment",
        [QualityInspection] = "Dimensional, visual, and NDT inspection",
        [Packing] = "Protective packing for shipment",
        [ReadyForDispatch] = "Packed and awaiting dispatch",
        [Dispatched] = "Shipped to customer",
    };
}

/// <summary>Job priority levels.</summary>
public static class JobPriorities
{
    public const string Critical = "Critical";
    public const string High = "High";
    public const string Medium = "Medium";
    public const string Low = "Low";

    public static readonly IReadOnlyList<string> All = [Critical, High, Medium, Low];
}

/// <summary>Production job status values.</summary>
public static class ProductionJobStatuses
{
    public const string Active = "Active";
    public const string OnHold = "On Hold";
    public const string Completed = "Completed";
    public const string Cancelled = "Cancelled";

    public static readonly IReadOnlyList<string> All = [Active, OnHold, Completed, Cancelled];
}

/// <summary>Quality inspection result values.</summary>
public static class QualityResults
{
    public const string Pass = "Pass";
    public const string Fail = "Fail";
    public const string Conditional = "Conditional";
    public const string Pending = "Pending";

    public static readonly IReadOnlyList<string> All = [Pass, Fail, Conditional, Pending];
}
