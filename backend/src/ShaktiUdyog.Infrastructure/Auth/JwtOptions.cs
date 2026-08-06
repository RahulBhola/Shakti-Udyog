namespace ShaktiUdyog.Infrastructure.Auth;

/// <summary>
/// JWT and refresh-token settings bound from configuration. The signing key
/// must come from environment variables or user secrets — never appsettings
/// committed to source control.
/// </summary>
public class JwtOptions
{
    public const string SectionName = "Jwt";

    public string SigningKey { get; set; } = string.Empty;
    public string Issuer { get; set; } = "ShaktiUdyog.Api";
    public string Audience { get; set; } = "ShaktiUdyog.Clients";

    /// <summary>Access-token lifetime. Kept short; sessions renew via refresh tokens.</summary>
    public int AccessTokenMinutes { get; set; } = 15;

    /// <summary>Refresh-token lifetime in days.</summary>
    public int RefreshTokenDays { get; set; } = 7;
}
