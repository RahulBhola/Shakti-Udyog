namespace ShaktiUdyog.Domain.Exceptions;

/// <summary>
/// Base domain exception for all Shakti Udyog business logic and domain rule violations.
/// </summary>
public abstract class ShaktiUdyogDomainException : Exception
{
    public string ErrorCode { get; }

    protected ShaktiUdyogDomainException(string message, string errorCode = "DOMAIN_ERROR")
        : base(message)
    {
        ErrorCode = errorCode;
    }

    protected ShaktiUdyogDomainException(string message, Exception innerException, string errorCode = "DOMAIN_ERROR")
        : base(message, innerException)
    {
        ErrorCode = errorCode;
    }
}
