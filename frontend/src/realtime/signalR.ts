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
    .withUrl(`${config.apiBaseUrl}/api/v1/portal-hub`, options)
    .withAutomaticReconnect()
    .configureLogging(LogLevel.Warning)
    .build();

  return connection;
}

/** Starts the connection if not already connected; failures are tolerated (auto-reconnect will retry).
 */
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
