using ShaktiUdyog.Domain.Entities;

namespace ShaktiUdyog.Domain.Interfaces.Repositories;

/// <summary>Repository contract for internal administrative task management.</summary>
public interface IKanbanTaskRepository : IRepository<KanbanTask>
{
    Task<IReadOnlyList<KanbanTask>> GetByColumnAsync(string column, CancellationToken ct = default);
    Task<IReadOnlyList<KanbanTask>> GetAssignedToAsync(string assignedTo, CancellationToken ct = default);
}
