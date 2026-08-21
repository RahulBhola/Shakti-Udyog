namespace ShaktiUdyog.Api.Contracts.Auth;

/// <summary>
/// Active user device session representation.
/// </summary>
public record UserSessionDto(
    Guid Id,
    string DeviceName,
    string DeviceType,
    string OperatingSystem,
    string Browser,
    string? IpAddress,
    string? Location,
    DateTimeOffset CreatedAtUtc,
    DateTimeOffset LastActiveAtUtc,
    DateTimeOffset ExpiresAtUtc,
    bool IsCurrent);

/// <summary>
/// Realtime SignalR notification payload dispatched when a session is revoked.
/// </summary>
public record SessionRevokedPayload(
    Guid SessionId,
    string Reason,
    DateTimeOffset RevokedAtUtc,
    string Message);
