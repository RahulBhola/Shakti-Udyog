using Microsoft.EntityFrameworkCore;
using ShaktiUdyog.Domain.Entities;
using ShaktiUdyog.Infrastructure.Auditing;
using ShaktiUdyog.Infrastructure.Data;
using ShaktiUdyog.Infrastructure.Storage;

namespace ShaktiUdyog.Api.Services;

public interface IDocumentService
{
    Task<List<Document>> GetAllAsync(string? search, string? category);
    Task<Document?> GetAsync(Guid id);
    Task<Document> UploadAsync(Guid companyId, string title, string category, IFormFile file, Guid? folderId, bool isCustomerVisible, Guid userId, string? ip);
    Task<bool> UpdateAsync(Guid id, string title, string? tags, Guid userId, string? ip);
    Task<bool> DeleteAsync(Guid id);
    Task<bool> RestoreAsync(Guid id);
    Task<(Stream Content, string FileName, string ContentType)?> DownloadAsync(Guid id);
    Task<List<DocumentVersion>> GetVersionsAsync(Guid id);
    Task<List<DocumentFolder>> GetFoldersAsync(Guid? parentId);
    Task<DocumentFolder> CreateFolderAsync(string name, Guid? parentId);
    Task<bool> ApproveAsync(Guid id, Guid userId, string? ip);
    Task<bool> RejectAsync(Guid id, string reason, Guid userId, string? ip);
    Task<bool> AddCommentAsync(Guid id, string message, Guid userId, string? ip);
    Task<DocumentVersion> UploadNewVersionAsync(Guid id, IFormFile file, string? comment, Guid userId, string? ip);
    Task<(Stream Content, string FileName, string ContentType)?> DownloadVersionAsync(Guid versionId);
    Task<(Stream Content, string ContentType)?> PreviewAsync(Guid id);
    Task<object> GetDashboardStatsAsync();
}

public class DocumentService(AppDbContext db, IFileStorageService storage, IAuditWriter audit) : IDocumentService
{
    public async Task<List<Document>> GetAllAsync(string? search, string? category)
    {
        var query = db.Documents.AsQueryable();
        if (!string.IsNullOrWhiteSpace(search))
        { var t = search.Trim(); query = query.Where(d => d.Title.Contains(t) || d.FileName.Contains(t) || (d.Tags != null && d.Tags.Contains(t))); }
        if (!string.IsNullOrWhiteSpace(category)) query = query.Where(d => d.Category == category);
        return await query.OrderByDescending(d => d.CreatedAtUtc).ToListAsync();
    }

    public async Task<Document?> GetAsync(Guid id) => await db.Documents.Include(d => d.Versions).SingleOrDefaultAsync(d => d.Id == id);

    public async Task<Document> UploadAsync(Guid companyId, string title, string category, IFormFile file, Guid? folderId, bool isCustomerVisible, Guid userId, string? ip)
    {
        await using var stream = file.OpenReadStream();
        var stored = await storage.SaveAsync(stream, file.FileName, file.ContentType);
        var doc = new Document
        {
            Id = Guid.NewGuid(), CompanyId = companyId, Title = title, Category = category,
            FileName = file.FileName, ContentType = file.ContentType, SizeBytes = stored.SizeBytes,
            StorageKey = stored.StorageKey, FolderId = folderId, IsCustomerVisible = isCustomerVisible,
        };
        doc.Versions.Add(new DocumentVersion
        {
            Id = Guid.NewGuid(), DocumentId = doc.Id, VersionNumber = 1,
            FileName = file.FileName, ContentType = file.ContentType, SizeBytes = stored.SizeBytes,
            StorageKey = stored.StorageKey, UploadedByUserId = userId, Comment = "Initial upload",
        });
        db.Documents.Add(doc);
        await db.SaveChangesAsync();
        await audit.WriteAsync("documents.uploaded", userId, "Document", doc.Id.ToString(), ip);
        return doc;
    }

    public async Task<bool> UpdateAsync(Guid id, string title, string? tags, Guid userId, string? ip)
    {
        var doc = await db.Documents.FindAsync(id);
        if (doc is null) return false;
        doc.Title = title; doc.Tags = tags;
        await db.SaveChangesAsync();
        await audit.WriteAsync("documents.updated", userId, "Document", id.ToString(), ip);
        return true;
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        var doc = await db.Documents.FindAsync(id);
        if (doc is null) return false;
        doc.IsDeleted = true; doc.DeletedAtUtc = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync();
        return true;
    }

    public async Task<bool> RestoreAsync(Guid id)
    {
        var doc = await db.Documents.IgnoreQueryFilters().SingleOrDefaultAsync(d => d.Id == id);
        if (doc is null || !doc.IsDeleted) return false;
        doc.IsDeleted = false; doc.DeletedAtUtc = null;
        await db.SaveChangesAsync();
        return true;
    }

    public async Task<(Stream Content, string FileName, string ContentType)?> DownloadAsync(Guid id)
    {
        var doc = await db.Documents.FindAsync(id);
        if (doc is null) return null;
        var stream = await storage.OpenReadAsync(doc.StorageKey);
        return stream is null ? null : (stream, doc.FileName, doc.ContentType);
    }

    public async Task<List<DocumentVersion>> GetVersionsAsync(Guid id) =>
        await db.DocumentVersions.Where(v => v.DocumentId == id).OrderByDescending(v => v.VersionNumber).ToListAsync();

    public async Task<List<DocumentFolder>> GetFoldersAsync(Guid? parentId) =>
        await db.DocumentFolders.Where(f => f.ParentId == parentId).OrderBy(f => f.Name).ToListAsync();

    public async Task<DocumentFolder> CreateFolderAsync(string name, Guid? parentId)
    {
        var folder = new DocumentFolder { Id = Guid.NewGuid(), Name = name, ParentId = parentId };
        db.DocumentFolders.Add(folder);
        await db.SaveChangesAsync();
        return folder;
    }

    public async Task<bool> ApproveAsync(Guid id, Guid userId, string? ip)
    {
        var doc = await db.Documents.FindAsync(id);
        if (doc is null) return false;
        doc.Status = "Approved";
        await db.SaveChangesAsync();
        await audit.WriteAsync("documents.approved", userId, "Document", id.ToString(), ip);
        return true;
    }

    public async Task<bool> RejectAsync(Guid id, string reason, Guid userId, string? ip)
    {
        var doc = await db.Documents.FindAsync(id);
        if (doc is null) return false;
        doc.Status = "PendingReview";
        await db.SaveChangesAsync();
        await audit.WriteAsync("documents.rejected", userId, "Document", id.ToString(), ip);
        return true;
    }

    public async Task<bool> AddCommentAsync(Guid id, string message, Guid userId, string? ip)
    {
        var doc = await db.Documents.AnyAsync(d => d.Id == id);
        if (!doc) return false;
        // Comment stored as audit log for simplicity
        await audit.WriteAsync("documents.comment_added", userId, "Document", id.ToString(), ip, message);
        return true;
    }

    public async Task<DocumentVersion> UploadNewVersionAsync(Guid id, IFormFile file, string? comment, Guid userId, string? ip)
    {
        var doc = await db.Documents.FindAsync(id) ?? throw new InvalidOperationException("Document not found.");
        await using var stream = file.OpenReadStream();
        var stored = await storage.SaveAsync(stream, file.FileName, file.ContentType);
        var version = new DocumentVersion
        {
            Id = Guid.NewGuid(), DocumentId = id, VersionNumber = doc.CurrentVersion + 1,
            FileName = file.FileName, ContentType = file.ContentType, SizeBytes = stored.SizeBytes,
            StorageKey = stored.StorageKey, UploadedByUserId = userId, Comment = comment,
        };
        doc.CurrentVersion = version.VersionNumber;
        doc.FileName = file.FileName;
        doc.SizeBytes = stored.SizeBytes;
        doc.StorageKey = stored.StorageKey;
        db.DocumentVersions.Add(version);
        await db.SaveChangesAsync();
        await audit.WriteAsync("documents.version_uploaded", userId, "DocumentVersion", version.Id.ToString(), ip);
        return version;
    }

    public async Task<(Stream Content, string FileName, string ContentType)?> DownloadVersionAsync(Guid versionId)
    {
        var version = await db.DocumentVersions.FindAsync(versionId);
        if (version is null) return null;
        var stream = await storage.OpenReadAsync(version.StorageKey);
        return stream is null ? null : (stream, version.FileName, version.ContentType);
    }

    public async Task<(Stream Content, string ContentType)?> PreviewAsync(Guid id)
    {
        var doc = await db.Documents.FindAsync(id);
        if (doc is null) return null;
        if (doc.ContentType is not ("application/pdf" or "image/png" or "image/jpeg" or "image/jpg" or "image/gif" or "image/webp")) return null;
        var stream = await storage.OpenReadAsync(doc.StorageKey);
        return stream is null ? null : (stream, doc.ContentType);
    }

    public async Task<object> GetDashboardStatsAsync()
    {
        var total = await db.Documents.CountAsync();
        var pendingApproval = await db.Documents.CountAsync(d => d.Status == "PendingReview");
        var today = DateTimeOffset.UtcNow.Date;
        var uploadedToday = await db.Documents.CountAsync(d => d.CreatedAtUtc >= today);
        var totalSize = await db.Documents.SumAsync(d => (long?)d.SizeBytes) ?? 0;
        return new { totalDocuments = total, pendingApproval, uploadedToday, totalSizeBytes = totalSize };
    }
}
