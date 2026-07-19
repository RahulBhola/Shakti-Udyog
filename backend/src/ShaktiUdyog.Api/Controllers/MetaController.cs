using Microsoft.AspNetCore.Mvc;

namespace ShaktiUdyog.Api.Controllers;

/// <summary>
/// Public, unauthenticated metadata endpoint used to verify the API is up
/// and to let clients confirm the API version they are talking to.
/// </summary>
[ApiController]
[Route("api/v1/meta")]
public class MetaController : ControllerBase
{
    [HttpGet]
    public IActionResult Get() => Ok(new
    {
        name = "Shakti Udyog API",
        apiVersion = "v1",
        environment = HttpContext.RequestServices
            .GetRequiredService<IWebHostEnvironment>().EnvironmentName,
    });
}
