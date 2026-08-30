namespace ShaktiUdyog.Domain.Constants;

/// <summary>
/// The five-column Engineer manufacturing Kanban (requirements §18). Each stage
/// maps to an existing <see cref="OrderStatuses"/> code so the admin order
/// timeline, customer tracking, and the board stay in sync.
/// </summary>
public static class ManufacturingStages
{
    public const string PatternDevelopment = OrderStatuses.PatternDevelopment;
    public const string Production = OrderStatuses.Production;
    public const string QualityCheck = OrderStatuses.QualityCheck;
    public const string Packed = OrderStatuses.Packed;
    public const string ReadyToDispatch = OrderStatuses.ReadyToDispatch;

    /// <summary>Ordered progression of the board columns (left → right).</summary>
    public static readonly IReadOnlyList<string> Workflow =
        [PatternDevelopment, Production, QualityCheck, Packed, ReadyToDispatch];

    /// <summary>Zero-based column index of each stage.</summary>
    public static readonly IReadOnlyDictionary<string, int> SortOrder = Workflow
        .Select((name, index) => (name, index))
        .ToDictionary(x => x.name, x => x.index);

    /// <summary>Column header labels.</summary>
    public static readonly IReadOnlyDictionary<string, string> Labels =
        new Dictionary<string, string>
        {
            [PatternDevelopment] = "Pattern Development",
            [Production] = "Production",
            [QualityCheck] = "QC",
            [Packed] = "Packed",
            [ReadyToDispatch] = "Ready To Dispatch",
        };

    /// <summary>
    /// Customer-facing notification message emitted when an order enters a stage.
    /// Exactly the copy required for the manufacturing workflow.
    /// </summary>
    public static readonly IReadOnlyDictionary<string, string> CustomerNotification =
        new Dictionary<string, string>
        {
            [PatternDevelopment] = "Your order has entered Pattern Development.",
            [Production] = "Your order is now in Production.",
            [QualityCheck] = "Your order is under Quality Check.",
            [Packed] = "Your order has been Packed.",
            [ReadyToDispatch] = "Your order is ready for dispatch.",
        };

    /// <summary>
    /// Returns true when both <paramref name="from"/> and <paramref name="to"/> are valid stages
    /// and <paramref name="to"/> is a different stage in the workflow.
    /// Supports both forward progression and backward rework/re-inspection transitions.
    /// </summary>
    public static bool IsValidTransition(string from, string to)
    {
        if (!SortOrder.ContainsKey(from)) return false;
        if (!SortOrder.ContainsKey(to)) return false;
        return from != to;
    }

    /// <summary>Backward-compatible alias allowing bidirectional movement.</summary>
    public static bool IsValidForwardTransition(string from, string to) => IsValidTransition(from, to);

    /// <summary>Labels for the admin order detail page / stage summary.</summary>
    public static string LabelFor(string stage) =>
        Labels.TryGetValue(stage, out var label) ? label : stage;

    /// <summary>Notification message for a stage, or a safe default.</summary>
    public static string MessageFor(string stage) =>
        CustomerNotification.TryGetValue(stage, out var message) ? message : $"Your order has moved to {LabelFor(stage)}.";
}
