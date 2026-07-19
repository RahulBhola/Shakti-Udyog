namespace ShaktiUdyog.Infrastructure.Auth;

/// <summary>
/// Email abstraction. Milestone 2 ships only <see cref="NoOpEmailSender"/> —
/// a real SMTP/provider implementation arrives in a later milestone and must
/// take its credentials from environment configuration.
/// </summary>
public interface IEmailSender
{
    Task SendAsync(string toEmail, string subject, string body, CancellationToken ct = default);
}
