namespace ShaktiUdyog.Infrastructure.Storage;

public record StoredFile(string StorageKey, long SizeBytes);

/// <summary>
/// Protected file storage abstraction (requirements §16 files). Callers deal
/// only in opaque storage keys; implementations decide physical placement.
/// A cloud implementation (private object storage) can replace the local one
/// later without touching callers — bind a different implementation in DI.
/// </summary>
public interface IFileStorageService
{
    /// <summary>
    /// Validates (extension, size, magic-bytes signature) and stores the
    /// stream. Throws <see cref="FileValidationException"/> when rejected.
    /// </summary>
    Task<StoredFile> SaveAsync(Stream content, string fileName, string contentType, CancellationToken ct = default);

    /// <summary>Opens a stored file for reading. Null when the key is unknown.</summary>
    Task<Stream?> OpenReadAsync(string storageKey, CancellationToken ct = default);

    Task DeleteAsync(string storageKey, CancellationToken ct = default);
}

public class FileValidationException(string message) : Exception(message);
