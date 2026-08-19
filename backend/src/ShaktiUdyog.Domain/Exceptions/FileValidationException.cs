namespace ShaktiUdyog.Domain.Exceptions;

/// <summary>
/// Exception thrown when an uploaded file violates security or format validations (HTTP 400 / 415).
/// </summary>
public class FileValidationException : ShaktiUdyogDomainException
{
    public string? FileName { get; }
    public long? FileSizeBytes { get; }

    public FileValidationException(string message)
        : base(message, "FILE_VALIDATION_ERROR")
    {
    }

    public FileValidationException(string message, string fileName, long? fileSizeBytes = null)
        : base(message, "FILE_VALIDATION_ERROR")
    {
        FileName = fileName;
        FileSizeBytes = fileSizeBytes;
    }
}
