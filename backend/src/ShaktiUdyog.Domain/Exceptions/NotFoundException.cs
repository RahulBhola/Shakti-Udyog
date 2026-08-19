namespace ShaktiUdyog.Domain.Exceptions;

/// <summary>
/// Exception thrown when a requested domain entity or resource does not exist (HTTP 404).
/// </summary>
public class NotFoundException : ShaktiUdyogDomainException
{
    public string? EntityName { get; }
    public object? Key { get; }

    public NotFoundException(string message)
        : base(message, "NOT_FOUND")
    {
    }

    public NotFoundException(string entityName, object key)
        : base($"{entityName} with identifier '{key}' was not found.", "NOT_FOUND")
    {
        EntityName = entityName;
        Key = key;
    }
}
