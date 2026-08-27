using System.Net.Http;
using System.Net.Http.Headers;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace ShaktiUdyog.Infrastructure.Notifications;

public interface ISmsService
{
    Task<bool> SendSmsAsync(string phoneNumber, string message, CancellationToken ct = default);
    Task<bool> SendOtpAsync(string phoneNumber, string otp, CancellationToken ct = default);
}

public class SmsSettings
{
    public string Provider { get; set; } = "Auto"; // Auto, Fast2SMS, Twilio, MSG91, Console
    public string? ApiKey { get; set; }
    public string? SenderId { get; set; }
    public string? TwilioAccountSid { get; set; }
    public string? TwilioAuthToken { get; set; }
    public string? TwilioFromNumber { get; set; }
    public string? Msg91AuthKey { get; set; }
    public string? Msg91TemplateId { get; set; }
    public string? Fast2SmsApiKey { get; set; }
}

public class SmsService : ISmsService
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<SmsService> _logger;
    private readonly SmsSettings _settings;

    public SmsService(
        IHttpClientFactory httpClientFactory,
        IConfiguration configuration,
        ILogger<SmsService> logger)
    {
        _httpClientFactory = httpClientFactory;
        _logger = logger;
        _settings = configuration.GetSection("Sms").Get<SmsSettings>() ?? new SmsSettings();
    }

    public async Task<bool> SendOtpAsync(string phoneNumber, string otp, CancellationToken ct = default)
    {
        var message = $"Your Shakti Udyog verification code is: {otp}. Valid for 10 minutes. Do not share this OTP with anyone.";
        return await SendSmsAsync(phoneNumber, message, ct);
    }

    public async Task<bool> SendSmsAsync(string phoneNumber, string message, CancellationToken ct = default)
    {
        var cleanPhone = CleanPhoneNumber(phoneNumber);
        if (string.IsNullOrWhiteSpace(cleanPhone))
        {
            _logger.LogWarning("[SMS] Invalid phone number provided: {Phone}", phoneNumber);
            return false;
        }

        // 1. Check if Fast2SMS API Key is configured
        var fast2SmsKey = _settings.Fast2SmsApiKey ?? (_settings.Provider.Equals("Fast2SMS", StringComparison.OrdinalIgnoreCase) ? _settings.ApiKey : null);
        if (!string.IsNullOrWhiteSpace(fast2SmsKey))
        {
            return await SendViaFast2SmsAsync(cleanPhone, message, fast2SmsKey, ct);
        }

        // 2. Check if Twilio is configured
        if (!string.IsNullOrWhiteSpace(_settings.TwilioAccountSid) &&
            !string.IsNullOrWhiteSpace(_settings.TwilioAuthToken) &&
            !string.IsNullOrWhiteSpace(_settings.TwilioFromNumber))
        {
            return await SendViaTwilioAsync(cleanPhone, message, ct);
        }

        // 3. Check if MSG91 is configured
        var msg91Key = _settings.Msg91AuthKey ?? (_settings.Provider.Equals("MSG91", StringComparison.OrdinalIgnoreCase) ? _settings.ApiKey : null);
        if (!string.IsNullOrWhiteSpace(msg91Key))
        {
            return await SendViaMsg91Async(cleanPhone, message, msg91Key, ct);
        }

        // 4. Default fallback: Log to server console so developer can see the OTP immediately in terminal/logs
        _logger.LogInformation(
            "═══════════════════════════════════════════════════════════════\n" +
            "📱 [SMS GATEWAY SIMULATION] Outgoing SMS to {Phone}\n" +
            "Message: {Message}\n" +
            "Note: To dispatch real SMS via telecom carriers, configure Twilio, Fast2SMS, or MSG91 in appsettings.json (Sms section).\n" +
            "═══════════════════════════════════════════════════════════════",
            phoneNumber, message);

        return true;
    }

    private async Task<bool> SendViaFast2SmsAsync(string phone, string message, string apiKey, CancellationToken ct)
    {
        try
        {
            var client = _httpClientFactory.CreateClient();
            client.DefaultRequestHeaders.Add("authorization", apiKey);

            // Strip country code if India (+91)
            var localNumber = phone.StartsWith("91") && phone.Length == 12 ? phone[2..] : phone;

            var payload = new
            {
                route = "q",
                message = message,
                language = "english",
                flash = 0,
                numbers = localNumber
            };

            var content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");
            var response = await client.PostAsync("https://www.fast2sms.com/dev/bulkV2", content, ct);

            if (response.IsSuccessStatusCode)
            {
                _logger.LogInformation("[SMS] Successfully dispatched SMS to {Phone} via Fast2SMS.", phone);
                return true;
            }

            var err = await response.Content.ReadAsStringAsync(ct);
            _logger.LogError("[SMS] Fast2SMS error for {Phone}: {Error}", phone, err);
            return false;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[SMS] Exception sending SMS to {Phone} via Fast2SMS", phone);
            return false;
        }
    }

    private async Task<bool> SendViaTwilioAsync(string phone, string message, CancellationToken ct)
    {
        try
        {
            var client = _httpClientFactory.CreateClient();
            var authBytes = Encoding.ASCII.GetBytes($"{_settings.TwilioAccountSid}:{_settings.TwilioAuthToken}");
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Basic", Convert.ToBase64String(authBytes));

            var targetPhone = phone.StartsWith('+') ? phone : $"+{phone}";
            var formValues = new Dictionary<string, string>
            {
                { "To", targetPhone },
                { "From", _settings.TwilioFromNumber! },
                { "Body", message }
            };

            var response = await client.PostAsync(
                $"https://api.twilio.com/2010-04-01/Accounts/{_settings.TwilioAccountSid}/Messages.json",
                new FormUrlEncodedContent(formValues),
                ct);

            if (response.IsSuccessStatusCode)
            {
                _logger.LogInformation("[SMS] Successfully dispatched SMS to {Phone} via Twilio.", targetPhone);
                return true;
            }

            var err = await response.Content.ReadAsStringAsync(ct);
            _logger.LogError("[SMS] Twilio error for {Phone}: {Error}", targetPhone, err);
            return false;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[SMS] Exception sending SMS to {Phone} via Twilio", phone);
            return false;
        }
    }

    private async Task<bool> SendViaMsg91Async(string phone, string message, string authKey, CancellationToken ct)
    {
        try
        {
            var client = _httpClientFactory.CreateClient();
            client.DefaultRequestHeaders.Add("authkey", authKey);

            var payload = new
            {
                sender = _settings.SenderId ?? "SHAKTI",
                route = "4",
                country = "91",
                sms = new[]
                {
                    new { message = message, to = new[] { phone } }
                }
            };

            var content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");
            var response = await client.PostAsync("https://control.msg91.com/api/v2/sendsms", content, ct);

            if (response.IsSuccessStatusCode)
            {
                _logger.LogInformation("[SMS] Successfully dispatched SMS to {Phone} via MSG91.", phone);
                return true;
            }

            var err = await response.Content.ReadAsStringAsync(ct);
            _logger.LogError("[SMS] MSG91 error for {Phone}: {Error}", phone, err);
            return false;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[SMS] Exception sending SMS to {Phone} via MSG91", phone);
            return false;
        }
    }

    private static string CleanPhoneNumber(string raw)
    {
        if (string.IsNullOrWhiteSpace(raw)) return string.Empty;
        var digits = new string(raw.Where(char.IsDigit).ToArray());
        return digits;
    }
}
