namespace ShaktiUdyog.Domain.Exceptions;

/// <summary>
/// Exception thrown when an operation conflicts with the current database state, such as duplicate keys or unique constraints (HTTP 409).
/// </summary>
public class ConflictException : ShaktiUdyogDomainException
{
    public string? ConflictField { get; }
    public object? ConflictValue { get; }

    public ConflictException(string message)
        : base(message, "CONFLICT")
    {
    }

    public ConflictException(string conflictField, object conflictValue, string message)
        : base(message, "CONFLICT")
    {
        ConflictField = conflictField;
        ConflictValue = conflictValue;
    }
}
