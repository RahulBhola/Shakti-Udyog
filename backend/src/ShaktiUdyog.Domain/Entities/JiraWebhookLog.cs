namespace ShaktiUdyog.Domain.Entities;

public class JiraWebhookLog
{
    public Guid Id { get; set; }
    public required string EventType { get; set; }
    public string? Payload { get; set; }
    public bool Processed { get; set; }
    public string? ErrorMessage { get; set; }
    public DateTimeOffset ReceivedAtUtc { get; set; } = DateTimeOffset.UtcNow;
}
