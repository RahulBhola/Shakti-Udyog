namespace ShaktiUdyog.Infrastructure.Auth;

/// <summary>
/// Authentication configuration (section "Auth"). Controls the login OTP step
/// so non-OTP environments (and the integration test suite) can keep the
/// classic single-step login.
/// </summary>
public class AuthOptions
{
    public const string SectionName = "Auth";

    /// <summary>When true, a correct password issues an emailed OTP before tokens are minted.</summary>
    public bool OtpEnabled { get; set; } = true;

    /// <summary>
    /// When true (Development only), the login challenge response echoes the
    /// generated code so a human can complete login without a mail server.
    /// Never echoed outside Development.
    /// </summary>
    public bool DebugOtpInDevelopment { get; set; } = true;
}
