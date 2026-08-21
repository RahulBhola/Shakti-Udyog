import {
  HubConnection,
  HubConnectionBuilder,
  type IHttpConnectionOptions,
  LogLevel,
} from "@microsoft/signalr";
import { config } from "../config";
import { tokenStorage } from "../auth/tokenStorage";

let connection: HubConnection | null = null;

export interface StageChangedPayload {
  orderId: string;
  orderNumber: string;
  fromStage: string;
  toStage: string;
}

export interface NotificationCreatedPayload {
  id: string;
  title: string;
  body: string | null;
  linkPath: string | null;
  createdAtUtc: string;
}

export interface PaymentVerifiedPayload {
  paymentId: string;
  invoiceId: string;
  invoiceNumber: string;
  amount: number;
}

export interface SessionRevokedPayload {
  sessionId: string;
  reason: string;
  revokedAtUtc: string;
  message: string;
}

export function parseJwtSessionId(token: string | null): string | null {
  if (!token) return null;
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    const parsed = JSON.parse(jsonPayload);
    return parsed.sid ?? null;
  } catch {
    return null;
  }
}

/**
 * Lazily-created singleton SignalR connection to the portal hub. The JWT access
 * token is supplied per-connection attempt so reconnects stay authenticated.
 */
export function getRealtimeConnection(): HubConnection {
  if (connection) return connection;

  const options: IHttpConnectionOptions = {
    accessTokenFactory: () => tokenStorage.getAccessToken() ?? "",
  };

  connection = new HubConnectionBuilder()
    .withUrl(`${config.apiBaseUrl}/hubs/portal`, options)
    .withAutomaticReconnect()
    .configureLogging(LogLevel.Warning)
    .build();

  // Register system-level handler for real-time session revocation
  connection.on("SessionRevoked", (payload: SessionRevokedPayload) => {
    const token = tokenStorage.getAccessToken();
    const currentSid = parseJwtSessionId(token);

    if (payload.sessionId && currentSid && payload.sessionId.toLowerCase() === currentSid.toLowerCase()) {
      // Current session was revoked from another device or admin
      tokenStorage.clear();
      stopRealtime();
      window.dispatchEvent(new CustomEvent("shakti:session_revoked", { detail: payload }));
      window.location.href = "/login?revoked=true";
    } else {
      // Another device session was revoked; notify UI to refresh session list
      window.dispatchEvent(new CustomEvent("shakti:sessions_updated", { detail: payload }));
    }
  });

  return connection;
}

/** Starts the connection if not already connected; failures are tolerated (auto-reconnect will retry). */
export async function connectRealtime(): Promise<void> {
  const conn = getRealtimeConnection();
  if (conn.state === "Connected") return;
  try {
    await conn.start();
  } catch {
    /* transient network / auth — automatic reconnect will retry */
  }
}

export function stopRealtime(): void {
  if (!connection) return;
  const c = connection;
  connection = null;
  if (c.state !== "Disconnected" && c.state !== "Connecting") {
    void c.stop();
  }
}