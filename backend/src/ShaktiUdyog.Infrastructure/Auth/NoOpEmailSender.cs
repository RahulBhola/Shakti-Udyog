using Microsoft.Extensions.Logging;

namespace ShaktiUdyog.Infrastructure.Auth;

/// <summary>
/// Development placeholder: logs that an email would have been sent. Never
/// logs message bodies, which may contain reset links/tokens.
/// </summary>
public class NoOpEmailSender(ILogger<NoOpEmailSender> logger) : IEmailSender
{
    public Task SendAsync(string toEmail, string subject, string body, CancellationToken ct = default)
    {
        logger.LogInformation(
            "Email sending is not configured. Would send \"{Subject}\" to {Recipient}.",
            subject, toEmail);
        return Task.CompletedTask;
    }
}
