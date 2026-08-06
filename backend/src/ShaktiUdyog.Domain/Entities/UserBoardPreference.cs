namespace ShaktiUdyog.Domain.Entities;

/// <summary>
/// Per-user Kanban board display preferences.
/// Stores visible columns, card fields, card size, and display mode.
/// </summary>
public class UserBoardPreference
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public ApplicationUser User { get; set; } = null!;

    /// <summary>Comma-separated list of visible stage names. Null = show all.</summary>
    public string? VisibleColumns { get; set; }

    /// <summary>Comma-separated list of visible card field keys. Null = defaults.</summary>
    public string? VisibleCardFields { get; set; }

    /// <summary>Card size: Compact, Standard, Large.</summary>
    public string CardSize { get; set; } = "Standard";

    /// <summary>Display mode: Compact, Standard, Detailed.</summary>
    public string DisplayMode { get; set; } = "Standard";

    /// <summary>Comma-separated column order. Null = default order.</summary>
    public string? ColumnOrder { get; set; }

    public DateTimeOffset CreatedAtUtc { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? UpdatedAtUtc { get; set; }
}
