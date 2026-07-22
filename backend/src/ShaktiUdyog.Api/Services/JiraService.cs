using Microsoft.EntityFrameworkCore;
using ShaktiUdyog.Domain.Entities;
using ShaktiUdyog.Infrastructure.Auditing;
using ShaktiUdyog.Infrastructure.Data;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

namespace ShaktiUdyog.Api.Services;

public interface IJiraService
{
    Task<JiraConfiguration?> GetConfigurationAsync();
    Task SaveConfigurationAsync(string url, string projectKey, string apiToken, string email, string? webhookSecret, string? issueTypeMappings, Guid userId, string? ip);
    Task<string?> TestConnectionAsync();
    Task<bool> SyncEntityAsync(string entityType, Guid entityId);
    Task<bool> SyncCommentAsync(string entityType, Guid entityId, string comment);
    Task<bool> SyncAttachmentAsync(string entityType, Guid entityId, string fileName, Stream fileStream, string contentType);
    Task<string?> SyncStatusAsync(string entityType, Guid entityId);
    Task<bool> ProcessWebhookAsync(JsonElement payload);
    Task<JiraSyncJob> RunFullSyncAsync(Guid userId, string? ip);
    Task<List<JiraSyncJob>> GetSyncLogsAsync();
    Task<List<JiraWebhookLog>> GetWebhookLogsAsync();
    Task<List<JiraIssueMapping>> GetMappingsAsync();
}

public class JiraService(AppDbContext db, IHttpClientFactory httpClientFactory, IAuditWriter audit) : IJiraService
{
    private async Task<HttpClient?> GetClientAsync()
    {
        var config = await db.JiraConfigurations.FirstOrDefaultAsync();
        if (config is null) return null;
        var client = httpClientFactory.CreateClient("Jira");
        var auth = Convert.ToBase64String(Encoding.ASCII.GetBytes($"{config.Email}:{config.ApiToken}"));
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Basic", auth);
        client.BaseAddress = new Uri(config.JiraUrl.TrimEnd('/'));
        return client;
    }

    private string? GetIssueType(string entityType, JiraConfiguration config)
    {
        if (string.IsNullOrWhiteSpace(config.IssueTypeMappings)) return "Task";
        try
        {
            var mappings = JsonSerializer.Deserialize<Dictionary<string, string>>(config.IssueTypeMappings);
            return mappings?.TryGetValue(entityType, out var type) == true ? type : "Task";
        }
        catch { return "Task"; }
    }

    public async Task<JiraConfiguration?> GetConfigurationAsync() => await db.JiraConfigurations.FirstOrDefaultAsync();

    public async Task SaveConfigurationAsync(string url, string projectKey, string apiToken, string email, string? webhookSecret, string? issueTypeMappings, Guid userId, string? ip)
    {
        var config = await db.JiraConfigurations.FirstOrDefaultAsync();
        if (config is null)
        {
            config = new JiraConfiguration { Id = Guid.NewGuid(), JiraUrl = url, ProjectKey = projectKey, ApiToken = apiToken, Email = email, WebhookSecret = webhookSecret, IssueTypeMappings = issueTypeMappings };
            db.JiraConfigurations.Add(config);
        }
        else
        {
            config.JiraUrl = url; config.ProjectKey = projectKey; config.ApiToken = apiToken;
            config.Email = email; config.WebhookSecret = webhookSecret; config.IssueTypeMappings = issueTypeMappings;
            config.UpdatedAtUtc = DateTimeOffset.UtcNow;
        }
        await db.SaveChangesAsync();
        await audit.WriteAsync("admin.jira.config_saved", userId, "JiraConfiguration", config.Id.ToString(), ip);
    }

    public async Task<string?> TestConnectionAsync()
    {
        var client = await GetClientAsync();
        if (client is null) return "Not configured.";
        try
        {
            var response = await client.GetAsync("/rest/api/3/myself");
            return response.IsSuccessStatusCode ? "Connected" : $"Failed: {response.StatusCode}";
        }
        catch (Exception ex) { return $"Error: {ex.Message}"; }
    }

    public async Task<bool> SyncEntityAsync(string entityType, Guid entityId)
    {
        var client = await GetClientAsync();
        var config = await db.JiraConfigurations.FirstOrDefaultAsync();
        if (client is null || config is null) return false;
        try
        {
            var issueType = GetIssueType(entityType, config);
            var payload = new { fields = new { project = new { key = config.ProjectKey }, summary = $"{entityType}: {entityId}", issuetype = new { name = issueType } } };
            var response = await client.PostAsync("/rest/api/3/issue", new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json"));
            if (!response.IsSuccessStatusCode) return false;
            var json = await response.Content.ReadAsStringAsync();
            var doc = JsonDocument.Parse(json);
            var key = doc.RootElement.GetProperty("key").GetString() ?? "";
            if (!config.IsConnected) { config.IsConnected = true; config.LastSyncAtUtc = DateTimeOffset.UtcNow; }
            db.JiraIssueMappings.Add(new JiraIssueMapping { Id = Guid.NewGuid(), EntityType = entityType, EntityId = entityId, JiraIssueKey = key, JiraIssueUrl = $"{config.JiraUrl.TrimEnd('/')}/browse/{key}" });
            await db.SaveChangesAsync();
            return true;
        }
        catch { return false; }
    }

    public async Task<bool> SyncCommentAsync(string entityType, Guid entityId, string comment)
    {
        var client = await GetClientAsync();
        var mapping = await db.JiraIssueMappings.FirstOrDefaultAsync(m => m.EntityType == entityType && m.EntityId == entityId);
        if (client is null || mapping is null) return false;
        try
        {
            var payload = new { body = new { type = "doc", version = 1, content = new[] { new { type = "paragraph", content = new[] { new { type = "text", text = comment } } } } } };
            var response = await client.PostAsync($"/rest/api/3/issue/{mapping.JiraIssueKey}/comment", new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json"));
            return response.IsSuccessStatusCode;
        }
        catch { return false; }
    }

    public async Task<bool> SyncAttachmentAsync(string entityType, Guid entityId, string fileName, Stream fileStream, string contentType)
    {
        var client = await GetClientAsync();
        var mapping = await db.JiraIssueMappings.FirstOrDefaultAsync(m => m.EntityType == entityType && m.EntityId == entityId);
        if (client is null || mapping is null) return false;
        try
        {
            var content = new MultipartFormDataContent();
            content.Add(new StreamContent(fileStream), "file", fileName);
            var response = await client.PostAsync($"/rest/api/3/issue/{mapping.JiraIssueKey}/attachments", content);
            return response.IsSuccessStatusCode;
        }
        catch { return false; }
    }

    public async Task<string?> SyncStatusAsync(string entityType, Guid entityId)
    {
        var client = await GetClientAsync();
        var mapping = await db.JiraIssueMappings.FirstOrDefaultAsync(m => m.EntityType == entityType && m.EntityId == entityId);
        if (client is null || mapping is null) return null;
        try
        {
            var response = await client.GetAsync($"/rest/api/3/issue/{mapping.JiraIssueKey}?fields=status");
            if (!response.IsSuccessStatusCode) return null;
            var json = await response.Content.ReadAsStringAsync();
            var doc = JsonDocument.Parse(json);
            var status = doc.RootElement.GetProperty("fields").GetProperty("status").GetProperty("name").GetString();
            mapping.LastSyncAtUtc = DateTimeOffset.UtcNow;
            await db.SaveChangesAsync();
            return status;
        }
        catch { return null; }
    }

    public async Task<bool> ProcessWebhookAsync(JsonElement payload)
    {
        try
        {
            var issueKey = payload.TryGetProperty("issue", out var issue) && issue.TryGetProperty("key", out var key) ? key.GetString() : null;
            if (issueKey is null) return false;
            var mapping = await db.JiraIssueMappings.FirstOrDefaultAsync(m => m.JiraIssueKey == issueKey);
            if (mapping is null) return false;
            var status = payload.TryGetProperty("issue", out var i2) && i2.TryGetProperty("fields", out var f) && f.TryGetProperty("status", out var s) && s.TryGetProperty("name", out var n) ? n.GetString() : null;
            if (status is not null) mapping.Status = status;
            mapping.LastSyncAtUtc = DateTimeOffset.UtcNow;
            await db.SaveChangesAsync();
            return true;
        }
        catch { return false; }
    }

    public async Task<JiraSyncJob> RunFullSyncAsync(Guid userId, string? ip)
    {
        var job = new JiraSyncJob { Id = Guid.NewGuid(), JobType = "Manual" };
        db.JiraSyncJobs.Add(job);
        await db.SaveChangesAsync();
        int processed = 0, failed = 0;
        foreach (var entityType in new[] { "RFQ", "Quotation", "Order" })
        {
            foreach (var id in await db.Rfqs.Where(r => !db.JiraIssueMappings.Any(m => m.EntityType == entityType && m.EntityId == r.Id)).Select(r => r.Id).ToListAsync())
            { if (await SyncEntityAsync(entityType, id)) processed++; else failed++; }
        }
        job.ItemsProcessed = processed; job.ItemsFailed = failed; job.Status = "Completed"; job.CompletedAtUtc = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync();
        await audit.WriteAsync("admin.jira.sync_completed", userId, "JiraSyncJob", job.Id.ToString(), ip);
        return job;
    }

    public async Task<List<JiraSyncJob>> GetSyncLogsAsync() => await db.JiraSyncJobs.OrderByDescending(j => j.StartedAtUtc).Take(50).ToListAsync();
    public async Task<List<JiraWebhookLog>> GetWebhookLogsAsync() => await db.JiraWebhookLogs.OrderByDescending(j => j.ReceivedAtUtc).Take(50).ToListAsync();
    public async Task<List<JiraIssueMapping>> GetMappingsAsync() => await db.JiraIssueMappings.OrderByDescending(j => j.CreatedAtUtc).Take(100).ToListAsync();
}
