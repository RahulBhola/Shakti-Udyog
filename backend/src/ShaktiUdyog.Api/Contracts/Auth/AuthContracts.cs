using System.ComponentModel.DataAnnotations;

namespace ShaktiUdyog.Api.Contracts.Auth;

public record LoginRequest(
    [Required, EmailAddress] string Email,
    [Required] string Password);

public record RegisterRequest(
    [Required] string FullName,
    [Required, EmailAddress] string Email,
    [Required] string Phone,
    [Required] string CompanyName,
    [Required, MinLength(8)] string Password);

public record RefreshRequest(string? RefreshToken);

public record ForgotPasswordRequest([Required, EmailAddress] string Email);

public record ResetPasswordRequest(
    [Required] string Token,
    [Required, MinLength(12)] string NewPassword);

public record LogoutRequest(string? RefreshToken);

/// <summary>Auth response. The refresh token is also set as an HttpOnly cookie.</summary>
public record AuthResponse(
    string AccessToken,
    DateTimeOffset AccessTokenExpiresAtUtc,
    string RefreshToken,
    string TokenType = "Bearer");

/// <summary>Base type for the login result: either tokens or an OTP challenge.</summary>
public abstract record LoginResult;

/// <summary>Login completed directly (OTP step disabled) with access + refresh tokens.</summary>
public sealed record LoginTokens(AuthResponse Response) : LoginResult;

/// <summary>
/// Credentials accepted but the email OTP step must be completed before tokens
/// are issued. <see cref="DebugOtp"/> is populated in Development only so a
/// human can finish login without a mail server.
/// </summary>
public sealed record LoginOtpChallenge(Guid ChallengeId, string? DebugOtp) : LoginResult;

/// <summary>Login challenge issued; no token yet — verify with /verify-otp.</summary>
public record OtpChallengeResponse(bool RequiresOtp, Guid ChallengeId, string? DebugOtp);

public record VerifyOtpRequest([Required] Guid ChallengeId, [Required, StringLength(6, MinimumLength = 6)] string Code);

public record ResendOtpRequest([Required] Guid ChallengeId);

public record MeResponse(
    Guid Id,
    string Email,
    string? FullName,
    IReadOnlyList<string> Roles,
    IReadOnlyList<string> Permissions);

public record MessageResponse(string Message);
