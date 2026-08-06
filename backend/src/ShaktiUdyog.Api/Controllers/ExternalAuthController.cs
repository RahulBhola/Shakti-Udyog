using System.Security.Claims;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.Options;
using ShaktiUdyog.Api.Contracts.Auth;
using ShaktiUdyog.Api.Services;
using ShaktiUdyog.Infrastructure.Auth;

namespace ShaktiUdyog.Api.Controllers;

/// <summary>
/// OAuth endpoints for external providers (Google, Apple). The authorize
/// endpoint challenges the provider; the post-callback endpoint processes
/// the result and issues JWT tokens.
/// </summary>
[ApiController]
[Route("api/v1/auth/external")]
[EnableRateLimiting("auth")]
public class ExternalAuthController(
    IExternalAuthService externalAuthService,
    IOptions<ExternalAuthOptions> externalAuthOptions) : ControllerBase
{
    private const string RefreshCookieName = "shakti_refresh";
    private static readonly HashSet<string> SupportedProviders = ["google", "apple"];

    /// <summary>
    /// Initiates the OAuth flow. Redirects the browser to the provider's
    /// consent screen. The returnUrl is validated against AllowedRedirectHosts.
    /// </summary>
    [HttpGet("{provider}/authorize")]
    public IActionResult Authorize(string provider, [FromQuery] string? returnUrl)
    {
        var providerLower = provider.ToLowerInvariant();
        if (!SupportedProviders.Contains(providerLower))
        {
            return BadRequest(new MessageResponse("Unsupported provider."));
        }

        // Map lowercase URL parameter to the registered scheme name (capitalized).
        var schemeName = providerLower switch
        {
            "google" => "Google",
            "apple" => "Apple",
            _ => provider,
        };

        // Check if the authentication scheme is registered (credentials configured).
        var schemeProvider = HttpContext.RequestServices
            .GetRequiredService<IAuthenticationSchemeProvider>();
        if (schemeProvider.GetSchemeAsync(schemeName).GetAwaiter().GetResult() is null)
        {
            return BadRequest(new MessageResponse(
                $"{schemeName} login is not configured. Please set up OAuth credentials first."));
        }

        // Validate returnUrl against allowed hosts to prevent open redirect attacks.
        if (!string.IsNullOrEmpty(returnUrl))
        {
            if (!Uri.TryCreate(returnUrl, UriKind.Absolute, out var returnUri))
            {
                return BadRequest(new MessageResponse("Invalid return URL."));
            }

            var allowedHosts = externalAuthOptions.Value.AllowedRedirectHosts;
            if (!allowedHosts.Any(h =>
                string.Equals(h, returnUri.GetLeftPart(UriPartial.Authority), StringComparison.OrdinalIgnoreCase)))
            {
                return BadRequest(new MessageResponse("Return URL is not in the allowed hosts list."));
            }
        }

        var redirectUri = Url.Action(nameof(PostCallback))!;

        var properties = new AuthenticationProperties
        {
            RedirectUri = redirectUri,
            Items =
            {
                { "returnUrl", returnUrl ?? "/customer/dashboard" },
                { "loginProvider", providerLower },
            },
        };

        // Challenge the specific provider scheme. The middleware handles code
        // exchange, state validation, and nonce management automatically.
        return Challenge(properties, schemeName);
    }

    /// <summary>
    /// Post-callback endpoint. After the OAuth middleware processes the
    /// provider response, this endpoint reads the external user claims,
    /// finds/creates the local user, and redirects to the frontend with tokens.
    /// </summary>
    [HttpGet("post-callback")]
    [ProducesResponseType(StatusCodes.Status302Found)]
    public async Task<IActionResult> PostCallback()
    {
        var logger = HttpContext.RequestServices.GetRequiredService<ILogger<ExternalAuthController>>();

        // Authenticate against the temporary external login cookie.
        var authenticateResult = await HttpContext.AuthenticateAsync(IdentityConstants.ExternalScheme);

        if (!authenticateResult.Succeeded || authenticateResult.Principal is null)
        {
            // External login failed or was cancelled by the user.
            var error = authenticateResult.Failure?.Message ?? "No principal";
            logger.LogWarning("External login authenticate failed: {Error}", error);
            return Redirect(BuildFrontendRedirectUrl("/login", "error=auth_failed"));
        }

        var externalUser = authenticateResult.Principal;
        var provider = externalUser.FindFirstValue(ClaimTypes.AuthenticationMethod);
        if (string.IsNullOrEmpty(provider) && authenticateResult.Properties?.Items.TryGetValue("loginProvider", out var prov) == true)
        {
            provider = prov;
        }
        provider ??= "unknown";

        try
        {
            var result = await externalAuthService.HandleExternalLoginAsync(
                provider,
                externalUser,
                ClientIp,
                UserAgent);

            if (result is null)
            {
                logger.LogWarning("External login HandleExternalLoginAsync returned null for provider={Provider}", provider);
                return Redirect(BuildFrontendRedirectUrl("/login", "error=auth_failed"));
            }

            // Set refresh cookie (same pattern as AuthController).
            Response.Cookies.Append(RefreshCookieName, result.RefreshToken, new CookieOptions
            {
                HttpOnly = true,
                // Secure only in production (HTTPS); on HTTP the browser won't send it back.
                Secure = Request.IsHttps,
                SameSite = SameSiteMode.Lax,
                Path = "/api/v1/auth",
                MaxAge = TimeSpan.FromDays(7),
            });

            // Redirect to frontend with access token in hash fragment.
            // The hash fragment is never sent to the server, is read and
            // cleared immediately by frontend JavaScript, and the 15-minute
            // access token lifetime limits exposure.
            var frontendUrl = BuildFrontendRedirectUrl(
                "/auth/callback",
                $"access_token={Uri.EscapeDataString(result.AccessToken)}&expires={result.AccessTokenExpiresAtUtc:o}");

            logger.LogInformation("External login successful for provider={Provider}, redirecting to frontend.", provider);
            return Redirect(frontendUrl);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "External login callback failed for provider={Provider}", provider);
            return Redirect(BuildFrontendRedirectUrl("/login", "error=auth_failed"));
        }
        finally
        {
            // Always clear the temporary external login cookie.
            await HttpContext.SignOutAsync(IdentityConstants.ExternalScheme);
        }
    }

    private string BuildFrontendRedirectUrl(string path, string? queryOrFragment)
    {
        var frontendBase = HttpContext.RequestServices
            .GetRequiredService<IConfiguration>()["Frontend:BaseUrl"]
            ?? "http://localhost:5173";

        var uriBuilder = new UriBuilder(frontendBase)
        {
            Path = path,
        };

        if (!string.IsNullOrEmpty(queryOrFragment))
        {
            // Use fragment for hash-fragment delivery (access token).
            // Use query for error params.
            if (queryOrFragment.StartsWith("access_token="))
            {
                uriBuilder.Fragment = queryOrFragment;
            }
            else
            {
                uriBuilder.Query = queryOrFragment;
            }
        }

        return uriBuilder.ToString();
    }

    private string? ClientIp => HttpContext.Connection.RemoteIpAddress?.ToString();
    private string? UserAgent => Request.Headers.UserAgent.ToString() is { Length: > 0 } ua ? ua : null;
}
