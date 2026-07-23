using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ShaktiUdyog.Api.Contracts.Production;
using ShaktiUdyog.Api.Services;
using ShaktiUdyog.Domain.Constants;
using System.Security.Claims;

namespace ShaktiUdyog.Api.Controllers;

[ApiController]
[Route("api/v1/admin/production-board")]
[Authorize(Policy = AuthPolicies.AdminOnly)]
public class ProductionBoardController(IProductionBoardService service) : ControllerBase
{
    private string? ClientIp => HttpContext.Connection.RemoteIpAddress?.ToString();
    private Guid UserId => Guid.Parse(User.FindFirstValue("sub")!);

    // ── Stages / Lookups ────────────────────────────────────────────────────

    [HttpGet("stages")]
    public async Task<IActionResult> GetStages() => Ok(await service.GetStagesAsync());

    [HttpGet("departments")]
    public async Task<IActionResult> GetDepartments() => Ok(await service.GetDepartmentsAsync());

    [HttpGet("machines")]
    public async Task<IActionResult> GetMachines() => Ok(await service.GetMachinesAsync());

    // ── Board Jobs ──────────────────────────────────────────────────────────

    [HttpGet("jobs")]
    public async Task<IActionResult> GetJobs(
        [FromQuery] string? search,
        [FromQuery] string? stage,
        [FromQuery] string? priority,
        [FromQuery] string? status)
    {
        var jobs = await service.GetBoardJobsAsync(search, stage, priority, status);
        return Ok(jobs);
    }

    [HttpGet("jobs/{id:guid}")]
    public async Task<IActionResult> GetJob(Guid id)
    {
        var job = await service.GetJobAsync(id);
        return job is null ? NotFound() : Ok(job);
    }

    [HttpPost("jobs")]
    public async Task<IActionResult> CreateJob([FromBody] CreateProductionJobRequest request)
    {
        var job = await service.CreateJobAsync(request, UserId, ClientIp);
        return CreatedAtAction(nameof(GetJob), new { id = job.Id }, job);
    }

    [HttpPut("jobs/{id:guid}")]
    public async Task<IActionResult> UpdateJob(Guid id, [FromBody] UpdateProductionJobRequest request)
    {
        return await service.UpdateJobAsync(id, request, UserId, ClientIp) ? Ok(new MessageResponse("Job updated.")) : NotFound();
    }

    [HttpDelete("jobs/{id:guid}")]
    public async Task<IActionResult> DeleteJob(Guid id)
    {
        return await service.DeleteJobAsync(id, UserId, ClientIp) ? Ok(new MessageResponse("Job deleted.")) : NotFound();
    }

    // ── Stage Movement (Drag & Drop) ────────────────────────────────────────

    [HttpPut("jobs/{id:guid}/stage")]
    public async Task<IActionResult> MoveStage(Guid id, [FromBody] MoveStageRequest request)
    {
        return await service.MoveStageAsync(id, request, UserId, ClientIp) ? Ok(new MessageResponse("Stage updated.")) : NotFound();
    }

    // ── Quality ─────────────────────────────────────────────────────────────

    [HttpPut("jobs/{id:guid}/quality")]
    public async Task<IActionResult> UpdateQuality(Guid id, [FromBody] UpdateQualityRequest request)
    {
        return await service.UpdateQualityAsync(id, request, UserId, ClientIp)
            ? Ok(new MessageResponse("Quality record added."))
            : NotFound();
    }

    // ── Comments ────────────────────────────────────────────────────────────

    [HttpPost("jobs/{id:guid}/comments")]
    public async Task<IActionResult> AddComment(Guid id, [FromBody] AddProductionCommentRequest request)
    {
        var comment = await service.AddCommentAsync(id, request, UserId, ClientIp);
        return Ok(comment);
    }

    // ── Dashboard ───────────────────────────────────────────────────────────

    [HttpGet("dashboard")]
    public async Task<IActionResult> GetDashboard() => Ok(await service.GetDashboardAsync());

    // ── Board Preferences ───────────────────────────────────────────────────

    [HttpGet("preferences")]
    public async Task<IActionResult> GetPreferences()
    {
        var pref = await service.GetPreferencesAsync(UserId);
        return pref is null ? Ok(new BoardPreferenceDto(null, null, "Standard", "Standard", null)) : Ok(pref);
    }

    [HttpPut("preferences")]
    public async Task<IActionResult> SavePreferences([FromBody] SaveBoardPreferenceRequest request)
    {
        var pref = await service.SavePreferencesAsync(UserId, request);
        return Ok(pref);
    }
}
