using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ShaktiUdyog.Api.Contracts.Auth;
using ShaktiUdyog.Domain.Constants;
using ShaktiUdyog.Domain.Entities;
using ShaktiUdyog.Infrastructure.Data;

namespace ShaktiUdyog.Api.Controllers;

[ApiController]
[Route("api/v1/kanban")]
[Authorize(Policy = AuthPolicies.AdminOnly)]
public class KanbanController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var tasks = await db.KanbanTasks.OrderBy(t => t.Position).ThenBy(t => t.CreatedAtUtc).ToListAsync();
        return Ok(tasks);
    }

    [HttpPost]
    public async Task<IActionResult> Create(CreateKanbanTaskRequest request)
    {
        var maxPos = await db.KanbanTasks.Where(t => t.Column == request.Column).MaxAsync(t => (int?)t.Position) ?? -1;
        var task = new KanbanTask
        {
            Id = Guid.NewGuid(),
            Title = request.Title,
            Description = request.Description,
            AssignedTo = request.AssignedTo,
            Column = request.Column,
            Position = maxPos + 1,
            Priority = request.Priority,
        };
        db.KanbanTasks.Add(task);
        await db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetAll), new { id = task.Id }, task);
    }

    [HttpPatch("{id:guid}/move")]
    public async Task<IActionResult> Move(Guid id, MoveKanbanRequest request)
    {
        var task = await db.KanbanTasks.FindAsync(id);
        if (task is null) return NotFound();

        task.Column = request.Column;
        task.Position = request.Position;
        task.UpdatedAtUtc = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync();
        return Ok(new MessageResponse("Moved."));
    }

    [HttpPatch("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, UpdateKanbanRequest request)
    {
        var task = await db.KanbanTasks.FindAsync(id);
        if (task is null) return NotFound();

        if (request.Title is not null) task.Title = request.Title;
        if (request.Description is not null) task.Description = request.Description;
        if (request.AssignedTo is not null) task.AssignedTo = request.AssignedTo;
        if (request.Priority is not null) task.Priority = request.Priority;
        task.UpdatedAtUtc = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync();
        return Ok(new MessageResponse("Updated."));
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var task = await db.KanbanTasks.FindAsync(id);
        if (task is null) return NotFound();
        db.KanbanTasks.Remove(task);
        await db.SaveChangesAsync();
        return Ok(new MessageResponse("Deleted."));
    }
}

public record CreateKanbanTaskRequest(string Title, string? Description, string? AssignedTo, string Column = "To Do", string? Priority = "Medium");
public record MoveKanbanRequest(string Column, int Position);
public record UpdateKanbanRequest(string? Title, string? Description, string? AssignedTo, string? Priority);
