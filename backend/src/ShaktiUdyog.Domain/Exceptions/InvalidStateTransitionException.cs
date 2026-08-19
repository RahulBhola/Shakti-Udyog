namespace ShaktiUdyog.Domain.Exceptions;

/// <summary>
/// Exception thrown when an entity state transition violates lifecycle business rules (HTTP 422).
/// </summary>
public class InvalidStateTransitionException : ShaktiUdyogDomainException
{
    public string CurrentState { get; }
    public string TargetState { get; }
    public string EntityType { get; }

    public InvalidStateTransitionException(string entityType, string currentState, string targetState)
        : base($"Cannot transition {entityType} from '{currentState}' to '{targetState}'. This transition is invalid or disallowed.", "INVALID_STATE_TRANSITION")
    {
        EntityType = entityType;
        CurrentState = currentState;
        TargetState = targetState;
    }

    public InvalidStateTransitionException(string entityType, string currentState, string targetState, string reason)
        : base($"Cannot transition {entityType} from '{currentState}' to '{targetState}': {reason}", "INVALID_STATE_TRANSITION")
    {
        EntityType = entityType;
        CurrentState = currentState;
        TargetState = targetState;
    }
}
