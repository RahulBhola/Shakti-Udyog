using System.ComponentModel.DataAnnotations;

namespace ShaktiUdyog.Api.Contracts.Auth;

public record LoginRequest(
    [Required, EmailAddress] string Email,
    [Required] string Password);

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

public record MeResponse(
    Guid Id,
    string Email,
    string? FullName,
    IReadOnlyList<string> Roles,
    IReadOnlyList<string> Permissions);

public record MessageResponse(string Message);
