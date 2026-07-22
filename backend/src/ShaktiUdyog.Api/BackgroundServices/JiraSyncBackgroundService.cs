using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using ShaktiUdyog.Domain.Entities;
using ShaktiUdyog.Infrastructure.Data;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

namespace ShaktiUdyog.Api.BackgroundServices;

public class JiraSyncBackgroundService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<JiraSyncBackgroundService> _logger;
    private static readonly TimeSpan SyncInterval = TimeSpan.FromHours(6);

    public JiraSyncBackgroundService(IServiceScopeFactory scopeFactory, ILogger<JiraSyncBackgroundService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Jira sync background service started");
        await Task.Delay(TimeSpan.FromMinutes(5), stoppingToken);
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = _scopeFactory.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                var config = await db.JiraConfigurations.FirstOrDefaultAsync(stoppingToken);
                if (config?.IsConnected == true)
                {
                    _logger.LogInformation("Starting scheduled Jira sync");
                    var client = new HttpClient();
                    var auth = Convert.ToBase64String(Encoding.ASCII.GetBytes($"{config.Email}:{config.ApiToken}"));
                    client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Basic", auth);
                    client.BaseAddress = new Uri(config.JiraUrl.TrimEnd('/'));
                    var job = new JiraSyncJob { Id = Guid.NewGuid(), JobType = "Scheduled" };
                    db.JiraSyncJobs.Add(job);
                    int processed = 0, failed = 0;
                    foreach (var rfq in db.Rfqs.Where(r => !db.JiraIssueMappings.Any(m => m.EntityType == "RFQ" && m.EntityId == r.Id)).ToList())
                    {
                        try
                        {
                            var payload = new { fields = new { project = new { key = config.ProjectKey }, summary = $"RFQ: {rfq.Id}", issuetype = new { name = "Task" } } };
                            var response = await client.PostAsync("/rest/api/3/issue", new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json"), stoppingToken);
                            if (response.IsSuccessStatusCode)
                            {
                                var json = await response.Content.ReadAsStringAsync(stoppingToken);
                                var doc = JsonDocument.Parse(json);
                                var key = doc.RootElement.GetProperty("key").GetString() ?? "";
                                db.JiraIssueMappings.Add(new JiraIssueMapping { Id = Guid.NewGuid(), EntityType = "RFQ", EntityId = rfq.Id, JiraIssueKey = key, JiraIssueUrl = $"{config.JiraUrl}/browse/{key}" });
                                processed++;
                            }
                            else failed++;
                        }
                        catch { failed++; }
                    }
                    job.ItemsProcessed = processed; job.ItemsFailed = failed; job.Status = "Completed"; job.CompletedAtUtc = DateTimeOffset.UtcNow;
                    await db.SaveChangesAsync(stoppingToken);
                    _logger.LogInformation("Scheduled Jira sync done: {Processed} ok, {Failed} failed", processed, failed);
                }
            }
            catch (OperationCanceledException) { break; }
            catch (Exception ex) { _logger.LogError(ex, "Jira sync background error"); }
            await Task.Delay(SyncInterval, stoppingToken);
        }
    }
}
