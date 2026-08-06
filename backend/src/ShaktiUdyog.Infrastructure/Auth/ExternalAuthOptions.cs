namespace ShaktiUdyog.Infrastructure.Auth;

public class ExternalAuthOptions
{
    public const string SectionName = "ExternalAuth";
    public GoogleAuthOptions Google { get; set; } = new();
    public AppleAuthOptions Apple { get; set; } = new();
    public List<string> AllowedRedirectHosts { get; set; } = ["http://localhost:5173"];
}

public class GoogleAuthOptions
{
    public string ClientId { get; set; } = string.Empty;
    public string ClientSecret { get; set; } = string.Empty;
}

public class AppleAuthOptions
{
    public string ClientId { get; set; } = string.Empty;
    public string TeamId { get; set; } = string.Empty;
    public string KeyId { get; set; } = string.Empty;
    public string PrivateKeyPath { get; set; } = string.Empty;
}
