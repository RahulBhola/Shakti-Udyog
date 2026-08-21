using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.IdentityModel.JsonWebTokens;
using ShaktiUdyog.Api.Contracts.Auth;
using ShaktiUdyog.Api.Services;

namespace ShaktiUdyog.Api.Controllers;

/// <summary>
/// Authentication and multi-device session endpoints. All business rules live
/// in <see cref="IAuthService"/>. The refresh token travels in the response body
/// and as an HttpOnly cookie scoped to this controller's path.
/// </summary>
[ApiController]
[Route("api/v1/auth")]
[EnableRateLimiting("auth")]
public class AuthController(IAuthService authService) : ControllerBase
{
    private const string RefreshCookieName = "shakti_refresh";

    [HttpPost("login")]
    [ProducesResponseType<AuthResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Login(LoginRequest request)
    {
        var result = await authService.LoginAsync(request, ClientIp, UserAgent);
        if (result is null)
        {
            // Uniform message: never reveals whether the account exists or is locked.
            return Unauthorized(new MessageResponse("Invalid credentials."));
        }

        SetRefreshCookie(result.RefreshToken);
        return Ok(result);
    }

    [HttpPost("register")]
    [ProducesResponseType<AuthResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Register(RegisterRequest request)
    {
        var result = await authService.RegisterAsync(request, ClientIp, UserAgent);
        if (result is null)
        {
            return BadRequest(new MessageResponse("Registration failed. Please try again."));
        }

        SetRefreshCookie(result.RefreshToken);
        return Ok(result);
    }

    [HttpPost("refresh")]
    [ProducesResponseType<AuthResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Refresh(RefreshRequest request)
    {
        var rawToken = request.RefreshToken ?? Request.Cookies[RefreshCookieName];
        if (string.IsNullOrEmpty(rawToken))
        {
            return Unauthorized(new MessageResponse("Refresh token is required."));
        }

        var result = await authService.RefreshAsync(rawToken, ClientIp, UserAgent);
        if (result is null)
        {
            ClearRefreshCookie();
            return Unauthorized(new MessageResponse("Invalid or expired refresh token."));
        }

        SetRefreshCookie(result.RefreshToken);
        return Ok(result);
    }

    [HttpPost("forgot-password")]
    [ProducesResponseType<MessageResponse>(StatusCodes.Status200OK)]
    public async Task<IActionResult> ForgotPassword(ForgotPasswordRequest request)
    {
        await authService.ForgotPasswordAsync(request, ClientIp);
        // Always the same response, whether or not the email exists.
        return Ok(new MessageResponse("If the email address is registered, a reset link has been sent."));
    }

    [HttpPost("reset-password")]
    [ProducesResponseType<MessageResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ResetPassword(ResetPasswordRequest request)
    {
        var succeeded = await authService.ResetPasswordAsync(request, ClientIp);
        if (!succeeded)
        {
            return BadRequest(new MessageResponse(
                "The reset link is invalid or expired, or the new password does not meet the password policy."));
        }

        return Ok(new MessageResponse("Password has been reset. Please sign in with your new password."));
    }

    [HttpPost("logout")]
    [ProducesResponseType<MessageResponse>(StatusCodes.Status200OK)]
    public async Task<IActionResult> Logout(LogoutRequest request)
    {
        var rawToken = request.RefreshToken ?? Request.Cookies[RefreshCookieName];
        await authService.LogoutAsync(rawToken, CurrentSessionId, CurrentUserId, ClientIp);
        ClearRefreshCookie();
        return Ok(new MessageResponse("Logged out."));
    }

    [HttpGet("me")]
    [Authorize]
    [DisableRateLimiting]
    [ProducesResponseType<MeResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Me()
    {
        if (CurrentUserId is not { } userId)
        {
            return Unauthorized();
        }

        var me = await authService.GetMeAsync(userId);
        return me is null ? Unauthorized() : Ok(me);
    }

    [HttpGet("sessions")]
    [Authorize]
    [DisableRateLimiting]
    [ProducesResponseType<IReadOnlyList<UserSessionDto>>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetSessions()
    {
        if (CurrentUserId is not { } userId)
        {
            return Unauthorized();
        }

        var sessions = await authService.GetActiveSessionsAsync(userId, CurrentSessionId);
        return Ok(sessions);
    }

    [HttpDelete("sessions/{sessionId:guid}")]
    [Authorize]
    [ProducesResponseType<MessageResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RevokeSession(Guid sessionId)
    {
        if (CurrentUserId is not { } userId)
        {
            return Unauthorized();
        }

        var succeeded = await authService.RevokeSessionAsync(sessionId, userId, ClientIp);
        if (!succeeded)
        {
            return NotFound(new MessageResponse("Session not found or already revoked."));
        }

        return Ok(new MessageResponse("Session revoked."));
    }

    [HttpPost("sessions/revoke-others")]
    [Authorize]
    [ProducesResponseType<MessageResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> RevokeOtherSessions()
    {
        if (CurrentUserId is not { } userId)
        {
            return Unauthorized();
        }

        if (CurrentSessionId is not { } sessionId)
        {
            return BadRequest(new MessageResponse("Current session could not be identified from token."));
        }

        var count = await authService.RevokeOtherSessionsAsync(sessionId, userId, ClientIp);
        return Ok(new MessageResponse($"Revoked {count} other active session(s)."));
    }

    private Guid? CurrentUserId =>
        Guid.TryParse(User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value
            ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value, out var id) ? id : null;

    private Guid? CurrentSessionId =>
        Guid.TryParse(
            User.FindFirst("sid")?.Value
            ?? User.FindFirst(System.Security.Claims.ClaimTypes.Sid)?.Value
            ?? User.FindFirst(JwtRegisteredClaimNames.Sid)?.Value
            ?? User.Claims.FirstOrDefault(c => c.Type == "sid" || c.Type.EndsWith("/sid", StringComparison.OrdinalIgnoreCase))?.Value,
            out var sid) ? sid : null;

    private string? ClientIp => HttpContext.Connection.RemoteIpAddress?.ToString();
    private string? UserAgent => Request.Headers.UserAgent.ToString() is { Length: > 0 } ua ? ua : null;

    private void SetRefreshCookie(string rawToken) =>
        Response.Cookies.Append(RefreshCookieName, rawToken, new CookieOptions
        {
            HttpOnly = true,
            Secure = Request.IsHttps,
            SameSite = SameSiteMode.Lax,
            Path = "/api/v1/auth",
            MaxAge = TimeSpan.FromDays(7),
        });

    private void ClearRefreshCookie() =>
        Response.Cookies.Delete(RefreshCookieName, new CookieOptions { Path = "/api/v1/auth" });
}
