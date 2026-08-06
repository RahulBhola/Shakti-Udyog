using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ShaktiUdyog.Api.Services;
using ShaktiUdyog.Domain.Constants;

namespace ShaktiUdyog.Api.Controllers;

/// <summary>
/// Admin report generation. Returns a downloadable report file (CSV, or Excel —
/// served as CSV which Excel opens directly).
/// </summary>
[ApiController]
[Route("api/v1/admin")]
[Authorize(Policy = AuthPolicies.AdminOnly)]
public class ReportsController(IReportService reportService) : ControllerBase
{
    [HttpGet("reports/{key}")]
    public async Task<IActionResult> Generate(string key, [FromQuery] string format = "csv")
    {
        try
        {
            var result = await reportService.GenerateAsync(key, format);
            return File(result.Content, result.ContentType, result.FileName);
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new { message = "Unknown report." });
        }
    }
}
