namespace ShaktiUdyog.Domain.Exceptions;

/// <summary>
/// Exception thrown when domain validation rules fail (HTTP 422 / 400).
/// </summary>
public class DomainValidationException : ShaktiUdyogDomainException
{
    public IDictionary<string, string[]> Errors { get; }

    public DomainValidationException(string message)
        : base(message, "VALIDATION_FAILED")
    {
        Errors = new Dictionary<string, string[]>
        {
            { "General", [message] }
        };
    }

    public DomainValidationException(string propertyName, string error)
        : base($"Validation failed for {propertyName}: {error}", "VALIDATION_FAILED")
    {
        Errors = new Dictionary<string, string[]>
        {
            { propertyName, [error] }
        };
    }

    public DomainValidationException(IDictionary<string, string[]> errors)
        : base("One or more validation failures occurred.", "VALIDATION_FAILED")
    {
        Errors = errors;
    }
}
