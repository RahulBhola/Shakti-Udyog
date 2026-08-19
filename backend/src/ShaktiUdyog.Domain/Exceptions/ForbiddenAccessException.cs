namespace ShaktiUdyog.Domain.Exceptions;

/// <summary>
/// Exception thrown when the caller lacks authorization/ownership over the target resource (HTTP 403).
/// </summary>
public class ForbiddenAccessException : ShaktiUdyogDomainException
{
    public ForbiddenAccessException(string message = "You do not have permission to access or modify this resource.")
        : base(message, "FORBIDDEN")
    {
    }
}
