namespace ShaktiUdyog.Domain.Entities;

public class KanbanTask
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? AssignedTo { get; set; }
    public string Column { get; set; } = "To Do";
    public int Position { get; set; }
    public string? Priority { get; set; }
    public DateTimeOffset CreatedAtUtc { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? UpdatedAtUtc { get; set; }
}
