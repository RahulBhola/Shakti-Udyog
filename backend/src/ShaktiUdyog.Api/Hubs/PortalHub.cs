using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using ShaktiUdyog.Api.Contracts.Auth;
using ShaktiUdyog.Domain.Constants;

namespace ShaktiUdyog.Api.Hubs;

/// <summary>Client-side contract for realtime portal events (SignalR).</summary>
public interface IPortalClient
{
    /// <summary>An order moved to a new manufacturing stage (Engineers + Admins).</summary>
    Task StageChanged(StageChangedPayload payload);

    /// <summary>A notification was created for the current user (→ that user's private group).</summary>
    Task NotificationCreated(NotificationCreatedPayload payload);

    /// <summary>A payment was verified by finance (Admins).</summary>
    Task PaymentVerified(PaymentVerifiedPayload payload);

    /// <summary>A user session was revoked (→ that user's private group).</summary>
    Task SessionRevoked(SessionRevokedPayload payload);
}

/// <summary>Broadcast payload for an order entering a new manufacturing stage.</summary>
public record StageChangedPayload(Guid OrderId, string OrderNumber, string FromStage, string ToStage);

/// <summary>Broadcast payload for a newly-created in-app notification.</summary>
public record NotificationCreatedPayload(Guid Id, string Title, string? Body, string? LinkPath, DateTimeOffset CreatedAtUtc);

/// <summary>Broadcast payload for an admin-verified payment.</summary>
public record PaymentVerifiedPayload(Guid PaymentId, Guid InvoiceId, string InvoiceNumber, decimal Amount);

/// <summary>
/// Realtime portal hub. Connections are grouped purely from the authenticated
/// user's JWT claims on connect — never from client-declared roles — so a
/// customer cannot subscribe to administrative groups by sending a role name.
/// </summary>
[Authorize]
public class PortalHub : Hub<IPortalClient>
{
    public override async Task OnConnectedAsync()
    {
        // All authenticated users get a private, single-recipient group.
        if (TryGetUserId(out var userId))
            await Groups.AddToGroupAsync(Context.ConnectionId, $"user:{userId}");

        await AddRoleGroupsAsync();
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        if (TryGetUserId(out var userId))
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"user:{userId}");

        await RemoveRoleGroupsAsync();
        await base.OnDisconnectedAsync(exception);
    }

    private bool TryGetUserId(out Guid id)
    {
        var value = Context.User?.FindFirst("sub")?.Value
            ?? Context.User?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        return Guid.TryParse(value, out id);
    }

    private async Task AddRoleGroupsAsync()
    {
        var roles = Context.User?.FindAll(System.Security.Claims.ClaimTypes.Role)
            .Select(c => c.Value)
            .ToHashSet(StringComparer.OrdinalIgnoreCase) ?? [];

        if (roles.Contains(Roles.Admin))
            await Groups.AddToGroupAsync(Context.ConnectionId, "admins");
        if (roles.Contains(Roles.Engineer))
            await Groups.AddToGroupAsync(Context.ConnectionId, "engineers");
    }

    private Task RemoveRoleGroupsAsync() =>
        Task.WhenAll(
            Groups.RemoveFromGroupAsync(Context.ConnectionId, "admins"),
            Groups.RemoveFromGroupAsync(Context.ConnectionId, "engineers"));
}

/// <summary>
/// Server-side facade that services use to broadcast portal events. Targeting
/// only the safe groups is enforced here, not left to callers.
/// </summary>
public interface IPortalPush
{
    Task StageChangedAsync(Guid orderId, string orderNumber, string fromStage, string toStage);
    Task NotificationCreatedAsync(Guid userId, NotificationCreatedPayload payload);
    Task PaymentVerifiedAsync(PaymentVerifiedPayload payload);
    Task SessionRevokedAsync(Guid userId, SessionRevokedPayload payload);
}

public class PortalPushService(IHubContext<PortalHub, IPortalClient> hub) : IPortalPush
{
    public async Task StageChangedAsync(Guid orderId, string orderNumber, string fromStage, string toStage)
    {
        var payload = new StageChangedPayload(orderId, orderNumber, fromStage, toStage);
        await hub.Clients.Group("engineers").StageChanged(payload);
        await hub.Clients.Group("admins").StageChanged(payload);
    }

    public async Task NotificationCreatedAsync(Guid userId, NotificationCreatedPayload payload) =>
        await hub.Clients.Group($"user:{userId}").NotificationCreated(payload);

    public async Task PaymentVerifiedAsync(PaymentVerifiedPayload payload) =>
        await hub.Clients.Group("admins").PaymentVerified(payload);

    public async Task SessionRevokedAsync(Guid userId, SessionRevokedPayload payload) =>
        await hub.Clients.Group($"user:{userId}").SessionRevoked(payload);
}
