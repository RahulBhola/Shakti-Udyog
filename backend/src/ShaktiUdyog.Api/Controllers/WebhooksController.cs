using Microsoft.AspNetCore.Mvc;
using ShaktiUdyog.Api.Services;
using ShaktiUdyog.Domain.Entities;
using ShaktiUdyog.Infrastructure.Data;
using System.Text.Json;

namespace ShaktiUdyog.Api.Controllers;

[ApiController]
[Route("api/v1/webhooks")]
public class WebhooksController(AppDbContext db, IJiraService jiraService) : ControllerBase
{
    [HttpPost("jira")]
    public async Task<IActionResult> ReceiveJiraWebhook([FromBody] JsonElement payload)
    {
        var eventType = "unknown";
        try { eventType = payload.TryGetProperty("issue_event_type_name", out var e) ? e.GetString() ?? "unknown" : "unknown"; } catch { }
        var processed = await jiraService.ProcessWebhookAsync(payload);
        var log = new JiraWebhookLog
        {
            Id = Guid.NewGuid(), EventType = eventType,
            Payload = JsonSerializer.Serialize(payload),
            Processed = processed,
        };
        db.JiraWebhookLogs.Add(log);
        await db.SaveChangesAsync();
        return Ok(new { received = true, processed });
    }
}
