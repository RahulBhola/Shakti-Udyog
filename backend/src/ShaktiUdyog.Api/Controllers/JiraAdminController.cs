using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ShaktiUdyog.Api.Contracts.Auth;
using ShaktiUdyog.Api.Services;
using ShaktiUdyog.Domain.Constants;

namespace ShaktiUdyog.Api.Controllers;

[ApiController]
[Route("api/v1/admin/jira")]
[Authorize(Policy = AuthPolicies.AdminOnly)]
public class JiraAdminController(IJiraService service) : ControllerBase
{
    private string? ClientIp => HttpContext.Connection.RemoteIpAddress?.ToString();
    private Guid UserId => Guid.Parse(HttpContext.User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value!);

    [HttpGet("configuration")] public async Task<IActionResult> GetConfiguration() => Ok(await service.GetConfigurationAsync());
    [HttpPut("configuration")] public async Task<IActionResult> SaveConfiguration(JiraConfigRequest r) { await service.SaveConfigurationAsync(r.JiraUrl, r.ProjectKey, r.ApiToken, r.Email, r.WebhookSecret, r.IssueTypeMappings, UserId, ClientIp); return Ok(new { message = "Configuration saved." }); }
    [HttpPost("test")] public async Task<IActionResult> TestConnection() => Ok(new { status = await service.TestConnectionAsync() });
    [HttpPost("sync")] public async Task<IActionResult> RunSync() { var job = await service.RunFullSyncAsync(UserId, ClientIp); return Ok(job); }
    [HttpPost("sync-status")] public async Task<IActionResult> SyncStatus(string entityType, Guid entityId) { var status = await service.SyncStatusAsync(entityType, entityId); return Ok(new { status }); }
    [HttpPost("sync-comment")] public async Task<IActionResult> SyncComment(string entityType, Guid entityId, string comment) => Ok(new { success = await service.SyncCommentAsync(entityType, entityId, comment) });
    [HttpGet("logs")] public async Task<IActionResult> GetLogs() => Ok(await service.GetSyncLogsAsync());
    [HttpGet("webhook-logs")] public async Task<IActionResult> GetWebhookLogs() => Ok(await service.GetWebhookLogsAsync());
    [HttpGet("mappings")] public async Task<IActionResult> GetMappings() => Ok(await service.GetMappingsAsync());
}

public record JiraConfigRequest(string JiraUrl, string ProjectKey, string ApiToken, string Email, string? WebhookSecret, string? IssueTypeMappings);
