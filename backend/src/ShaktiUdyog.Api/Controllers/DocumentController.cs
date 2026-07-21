using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ShaktiUdyog.Api.Contracts.Auth;
using ShaktiUdyog.Api.Services;

namespace ShaktiUdyog.Api.Controllers;

[ApiController]
[Route("api/v1/documents")]
[Authorize]
public class DocumentController(IDocumentService service) : ControllerBase
{
    private Guid UserId => Guid.Parse(HttpContext.User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value!);
    private string? ClientIp => HttpContext.Connection.RemoteIpAddress?.ToString();

    [HttpGet] public async Task<IActionResult> GetAll([FromQuery] string? search, [FromQuery] string? category) => Ok(await service.GetAllAsync(search, category));
    [HttpGet("dashboard")] public async Task<IActionResult> GetDashboardStats() => Ok(await service.GetDashboardStatsAsync());
    [HttpGet("{id:guid}")] public async Task<IActionResult> Get(Guid id) { var d = await service.GetAsync(id); return d is null ? NotFound() : Ok(d); }
    [HttpPost("upload")] public async Task<IActionResult> Upload([FromForm] Guid companyId, [FromForm] string title, [FromForm] string category, IFormFile file, [FromForm] Guid? folderId, [FromForm] bool isCustomerVisible = true) { var doc = await service.UploadAsync(companyId, title, category, file, folderId, isCustomerVisible, UserId, ClientIp); return CreatedAtAction(nameof(Get), new { id = doc.Id }, doc); }
    [HttpPut("{id:guid}")] public async Task<IActionResult> Update(Guid id, UpdateDocRequest r) => Ok(await service.UpdateAsync(id, r.Title, r.Tags, UserId, ClientIp) ? new { message = "Updated." } : NotFound());
    [HttpDelete("{id:guid}")] public async Task<IActionResult> Delete(Guid id) => Ok(await service.DeleteAsync(id) ? new { message = "Deleted." } : NotFound());
    [HttpPost("{id:guid}/restore")] public async Task<IActionResult> Restore(Guid id) => Ok(await service.RestoreAsync(id) ? new { message = "Restored." } : NotFound());
    [HttpGet("{id:guid}/download")] public async Task<IActionResult> Download(Guid id) { var f = await service.DownloadAsync(id); return f is null ? NotFound() : File(f.Value.Content, f.Value.ContentType, f.Value.FileName); }
    [HttpGet("{id:guid}/preview")] public async Task<IActionResult> Preview(Guid id) { var p = await service.PreviewAsync(id); return p is null ? NotFound() : File(p.Value.Content, p.Value.ContentType); }
    [HttpGet("{id:guid}/versions")] public async Task<IActionResult> GetVersions(Guid id) => Ok(await service.GetVersionsAsync(id));
    [HttpPost("{id:guid}/versions")] public async Task<IActionResult> UploadNewVersion(Guid id, IFormFile file, [FromForm] string? comment) { var v = await service.UploadNewVersionAsync(id, file, comment, UserId, ClientIp); return CreatedAtAction(nameof(GetVersions), new { id }, v); }
    [HttpGet("versions/{versionId:guid}/download")] public async Task<IActionResult> DownloadVersion(Guid versionId) { var f = await service.DownloadVersionAsync(versionId); return f is null ? NotFound() : File(f.Value.Content, f.Value.ContentType, f.Value.FileName); }
    [HttpPost("{id:guid}/approve")] public async Task<IActionResult> Approve(Guid id) => Ok(await service.ApproveAsync(id, UserId, ClientIp) ? new { message = "Approved." } : NotFound());
    [HttpPost("{id:guid}/reject")] public async Task<IActionResult> Reject(Guid id, [FromBody] string reason) => Ok(await service.RejectAsync(id, reason, UserId, ClientIp) ? new { message = "Rejected." } : NotFound());
    [HttpPost("{id:guid}/comments")] public async Task<IActionResult> AddComment(Guid id, [FromBody] string message) => Ok(await service.AddCommentAsync(id, message, UserId, ClientIp) ? new { message = "Comment added." } : NotFound());
    [HttpGet("folders")] public async Task<IActionResult> GetFolders([FromQuery] Guid? parentId) => Ok(await service.GetFoldersAsync(parentId));
    [HttpPost("folders")] public async Task<IActionResult> CreateFolder(CreateFolderRequest r) { var f = await service.CreateFolderAsync(r.Name, r.ParentId); return CreatedAtAction(nameof(GetFolders), null, f); }
}

public record UpdateDocRequest(string Title, string? Tags);
public record CreateFolderRequest(string Name, Guid? ParentId);
