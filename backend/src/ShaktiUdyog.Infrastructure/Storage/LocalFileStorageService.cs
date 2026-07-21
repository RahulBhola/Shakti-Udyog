using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace ShaktiUdyog.Infrastructure.Storage;

/// <summary>
/// Local development implementation. Files live OUTSIDE the web root in a
/// configurable directory (Storage:LocalPath, default App_Data/protected-files
/// under the content root's parent-safe app data folder). Keys are random
/// GUIDs + sanitized extension — original names are stored only in metadata.
/// Malware scanning is a placeholder hook for a future implementation.
/// </summary>
public class LocalFileStorageService : IFileStorageService
{
    private const long MaxSizeBytes = 10 * 1024 * 1024; // 10 MB per requirements §10

    private static readonly Dictionary<string, byte[][]> KnownSignatures = new(StringComparer.OrdinalIgnoreCase)
    {
        [".pdf"] = [[0x25, 0x50, 0x44, 0x46]],                    // %PDF
        [".png"] = [[0x89, 0x50, 0x4E, 0x47]],
        [".jpg"] = [[0xFF, 0xD8, 0xFF]],
        [".zip"] = [[0x50, 0x4B, 0x03, 0x04], [0x50, 0x4B, 0x05, 0x06]],
        // CAD/exchange formats (dwg/dxf/step/stp/iges/igs) have text or
        // vendor-specific headers; extension + size checks apply, signature
        // verification is skipped for them.
    };

    private static readonly string[] AllowedExtensions =
        [".pdf", ".dwg", ".dxf", ".step", ".stp", ".iges", ".igs", ".jpg", ".png", ".zip"];

    private readonly string _rootPath;
    private readonly ILogger<LocalFileStorageService> _logger;

    public LocalFileStorageService(IConfiguration configuration, ILogger<LocalFileStorageService> logger)
    {
        _logger = logger;
        _rootPath = configuration["Storage:LocalPath"]
            ?? Path.Combine(AppContext.BaseDirectory, "App_Data", "protected-files");
        Directory.CreateDirectory(_rootPath);
    }

    public async Task<StoredFile> SaveAsync(Stream content, string fileName, string contentType, CancellationToken ct = default)
    {
        var extension = Path.GetExtension(fileName);
        if (string.IsNullOrEmpty(extension) || !AllowedExtensions.Contains(extension, StringComparer.OrdinalIgnoreCase))
        {
            throw new FileValidationException($"File type '{extension}' is not permitted.");
        }

        // Buffer to memory-bounded temp file to check size + signature before committing.
        var tempPath = Path.Combine(_rootPath, $"tmp-{Guid.NewGuid():N}");
        try
        {
            long total = 0;
            await using (var temp = File.Create(tempPath))
            {
                var buffer = new byte[81920];
                int read;
                while ((read = await content.ReadAsync(buffer, ct)) > 0)
                {
                    total += read;
                    if (total > MaxSizeBytes)
                    {
                        throw new FileValidationException("File exceeds the 10 MB size limit.");
                    }
                    await temp.WriteAsync(buffer.AsMemory(0, read), ct);
                }
            }

            if (total == 0)
            {
                throw new FileValidationException("File is empty.");
            }

            if (KnownSignatures.TryGetValue(extension, out var signatures))
            {
                var header = new byte[8];
                await using var check = File.OpenRead(tempPath);
                var headerLen = await check.ReadAsync(header, ct);
                var matches = signatures.Any(sig =>
                    headerLen >= sig.Length && sig.AsSpan().SequenceEqual(header.AsSpan(0, sig.Length)));
                if (!matches)
                {
                    throw new FileValidationException("File content does not match its declared type.");
                }
            }

            // Placeholder for malware scanning integration (future milestone).

            var storageKey = $"{Guid.NewGuid():N}{extension.ToLowerInvariant()}";
            File.Move(tempPath, Path.Combine(_rootPath, storageKey));
            _logger.LogInformation("Stored protected file {StorageKey} ({Size} bytes).", storageKey, total);
            return new StoredFile(storageKey, total);
        }
        finally
        {
            if (File.Exists(tempPath))
            {
                File.Delete(tempPath);
            }
        }
    }

    public Task<Stream?> OpenReadAsync(string storageKey, CancellationToken ct = default)
    {
        // Storage keys are server-generated GUID+ext; reject anything else to
        // eliminate path traversal.
        if (storageKey.Contains("..") || storageKey.Contains('/') || storageKey.Contains('\\'))
        {
            return Task.FromResult<Stream?>(null);
        }

        var path = Path.Combine(_rootPath, storageKey);
        return Task.FromResult<Stream?>(File.Exists(path) ? File.OpenRead(path) : null);
    }

    public Task DeleteAsync(string storageKey, CancellationToken ct = default)
    {
        var path = Path.Combine(_rootPath, storageKey);
        if (File.Exists(path))
        {
            File.Delete(path);
        }
        return Task.CompletedTask;
    }
}
