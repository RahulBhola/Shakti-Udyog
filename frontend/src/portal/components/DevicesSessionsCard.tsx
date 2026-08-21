import { useState, useEffect, useCallback } from "react";
import { authService, type UserSession } from "../../auth/authService";
import {
  Laptop,
  Smartphone,
  Tablet,
  Monitor,
  Globe,
  MapPin,
  Clock,
  Trash2,
  LogOut,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Shield,
} from "lucide-react";

export function DevicesSessionsCard() {
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionBusy, setActionBusy] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Modal / Confirm state
  const [sessionToRevoke, setSessionToRevoke] = useState<UserSession | null>(null);
  const [confirmRevokeOthers, setConfirmRevokeOthers] = useState(false);

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await authService.getSessions();
      setSessions(data);
    } catch {
      setError("Failed to load active sessions.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchSessions();

    const handleSessionsUpdated = () => {
      void fetchSessions();
    };

    window.addEventListener("shakti:sessions_updated", handleSessionsUpdated);
    return () => {
      window.removeEventListener("shakti:sessions_updated", handleSessionsUpdated);
    };
  }, [fetchSessions]);

  const handleRevokeSingle = async () => {
    if (!sessionToRevoke) return;
    setActionBusy(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const ok = await authService.revokeSession(sessionToRevoke.id);
      if (ok) {
        setSuccessMessage(`Logged out from ${sessionToRevoke.deviceName}.`);
        setSessionToRevoke(null);
        await fetchSessions();
      } else {
        setError("Could not revoke session. It may have already been logged out.");
      }
    } catch {
      setError("Failed to revoke session.");
    } finally {
      setActionBusy(false);
    }
  };

  const handleRevokeOthers = async () => {
    setActionBusy(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const ok = await authService.revokeOtherSessions();
      if (ok) {
        setSuccessMessage("All other devices have been logged out.");
        setConfirmRevokeOthers(false);
        await fetchSessions();
      } else {
        setError("Failed to log out other devices.");
      }
    } catch {
      setError("Failed to log out other devices.");
    } finally {
      setActionBusy(false);
    }
  };

  const formatRelativeTime = (isoString: string) => {
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    if (diffMins < 2) return "Active now";
    if (diffMins < 60) return `Active ${diffMins} minutes ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `Active ${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return "Active yesterday";
    return `Active ${diffDays} days ago`;
  };

  const getDeviceIcon = (deviceType: string, os: string) => {
    const t = deviceType.toLowerCase();
    const o = os.toLowerCase();
    if (t === "mobile" || o.includes("iphone") || o.includes("android")) {
      return <Smartphone size={20} className="text-blue-500" />;
    }
    if (t === "tablet" || o.includes("ipad")) {
      return <Tablet size={20} className="text-purple-500" />;
    }
    if (t === "desktop" && (o.includes("mac") || o.includes("windows"))) {
      return <Laptop size={20} className="text-cyan-500" />;
    }
    return <Monitor size={20} className="text-slate-500" />;
  };

  const otherSessions = sessions.filter((s) => !s.isCurrent);
  const currentSession = sessions.find((s) => s.isCurrent);

  return (
    <div
      style={{
        background: "var(--bg-card, #ffffff)",
        border: "1px solid var(--border-default, #e2e8f0)",
        borderRadius: 16,
        padding: 24,
        boxShadow: "var(--shadow-sm, 0 1px 3px rgba(0,0,0,0.05))",
        marginTop: 24,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 16,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Shield size={20} style={{ color: "var(--color-primary, #0284c7)" }} />
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: "var(--text-primary, #0f172a)" }}>
              Devices & Sessions
            </h3>
          </div>
          <p style={{ fontSize: 13, color: "var(--text-muted, #64748b)", margin: "4px 0 0" }}>
            Manage devices currently signed into your account. You can log out from any device remotely.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            type="button"
            onClick={() => void fetchSessions()}
            disabled={loading}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 12px",
              borderRadius: 8,
              border: "1px solid var(--border-default, #e2e8f0)",
              background: "var(--bg-surface, #f8fafc)",
              color: "var(--text-primary, #0f172a)",
              fontSize: 12,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            <span>Refresh</span>
          </button>

          {otherSessions.length > 0 && (
            <button
              type="button"
              onClick={() => setConfirmRevokeOthers(true)}
              disabled={actionBusy}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 12px",
                borderRadius: 8,
                border: "1px solid rgba(239, 68, 68, 0.2)",
                background: "rgba(239, 68, 68, 0.08)",
                color: "#ef4444",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <LogOut size={13} />
              <span>Log out all other devices</span>
            </button>
          )}
        </div>
      </div>

      {successMessage && (
        <div
          style={{
            padding: "10px 14px",
            borderRadius: 8,
            background: "rgba(34, 197, 94, 0.12)",
            color: "#16a34a",
            fontSize: 13,
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 16,
          }}
        >
          <CheckCircle2 size={16} />
          <span>{successMessage}</span>
        </div>
      )}

      {error && (
        <div
          style={{
            padding: "10px 14px",
            borderRadius: 8,
            background: "rgba(239, 68, 68, 0.12)",
            color: "#ef4444",
            fontSize: 13,
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 16,
          }}
        >
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {loading && sessions.length === 0 ? (
        <div style={{ padding: "24px 0", textAlign: "center", color: "var(--text-muted, #64748b)", fontSize: 13 }}>
          <RefreshCw size={18} className="animate-spin" style={{ margin: "0 auto 8px" }} />
          Loading active sessions…
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Current Session */}
          {currentSession && (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "14px 16px",
                borderRadius: 12,
                background: "rgba(2, 132, 199, 0.05)",
                border: "1px solid rgba(2, 132, 199, 0.2)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: "rgba(2, 132, 199, 0.12)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {getDeviceIcon(currentSession.deviceType, currentSession.operatingSystem)}
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary, #0f172a)" }}>
                      {currentSession.deviceName}
                    </span>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        textTransform: "uppercase",
                        padding: "2px 8px",
                        borderRadius: 999,
                        background: "#0284c7",
                        color: "#ffffff",
                        letterSpacing: "0.04em",
                      }}
                    >
                      ✓ This Device
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      marginTop: 4,
                      fontSize: 12,
                      color: "var(--text-muted, #64748b)",
                      flexWrap: "wrap",
                    }}
                  >
                    <span>
                      {currentSession.operatingSystem} • {currentSession.browser}
                    </span>
                    {currentSession.location && (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
                        <MapPin size={11} />
                        {currentSession.location}
                      </span>
                    )}
                    {currentSession.ipAddress && (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
                        <Globe size={11} />
                        {currentSession.ipAddress}
                      </span>
                    )}
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 3, color: "#16a34a", fontWeight: 500 }}>
                      <Clock size={11} />
                      {formatRelativeTime(currentSession.lastActiveAtUtc)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Other Sessions */}
          {otherSessions.map((session) => (
            <div
              key={session.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "14px 16px",
                borderRadius: 12,
                background: "var(--bg-surface, #f8fafc)",
                border: "1px solid var(--border-default, #e2e8f0)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: "var(--bg-card, #ffffff)",
                    border: "1px solid var(--border-default, #e2e8f0)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {getDeviceIcon(session.deviceType, session.operatingSystem)}
                </div>
                <div>
                  <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary, #0f172a)" }}>
                    {session.deviceName}
                  </span>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      marginTop: 4,
                      fontSize: 12,
                      color: "var(--text-muted, #64748b)",
                      flexWrap: "wrap",
                    }}
                  >
                    <span>
                      {session.operatingSystem} • {session.browser}
                    </span>
                    {session.location && (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
                        <MapPin size={11} />
                        {session.location}
                      </span>
                    )}
                    {session.ipAddress && (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
                        <Globe size={11} />
                        {session.ipAddress}
                      </span>
                    )}
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
                      <Clock size={11} />
                      {formatRelativeTime(session.lastActiveAtUtc)}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSessionToRevoke(session)}
                disabled={actionBusy}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  padding: "6px 12px",
                  borderRadius: 8,
                  border: "1px solid var(--border-default, #e2e8f0)",
                  background: "var(--bg-card, #ffffff)",
                  color: "#ef4444",
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                <Trash2 size={13} />
                <span>Remove</span>
              </button>
            </div>
          ))}

          {sessions.length === 0 && !loading && (
            <p style={{ margin: "12px 0", fontSize: 13, color: "var(--text-muted, #64748b)" }}>
              No active sessions found.
            </p>
          )}
        </div>
      )}

      {/* Revoke Single Session Confirmation Modal */}
      {sessionToRevoke && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: 16,
          }}
        >
          <div
            style={{
              background: "var(--bg-card, #ffffff)",
              borderRadius: 16,
              padding: 24,
              maxWidth: 420,
              width: "100%",
              boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)",
              border: "1px solid var(--border-default, #e2e8f0)",
            }}
          >
            <h4 style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 700, color: "var(--text-primary, #0f172a)" }}>
              Log out of this device?
            </h4>
            <p style={{ fontSize: 13, color: "var(--text-muted, #64748b)", margin: "0 0 20px", lineHeight: 1.5 }}>
              Are you sure you want to log out <strong>{sessionToRevoke.deviceName}</strong>? Any unsaved work on that
              device will be lost and the user will be redirected to the login screen.
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button
                type="button"
                onClick={() => setSessionToRevoke(null)}
                disabled={actionBusy}
                style={{
                  padding: "8px 14px",
                  borderRadius: 8,
                  border: "1px solid var(--border-default, #e2e8f0)",
                  background: "var(--bg-surface, #f8fafc)",
                  color: "var(--text-primary, #0f172a)",
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleRevokeSingle()}
                disabled={actionBusy}
                style={{
                  padding: "8px 14px",
                  borderRadius: 8,
                  border: "none",
                  background: "#ef4444",
                  color: "#ffffff",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {actionBusy ? "Logging out…" : "Log Out Device"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Revoke All Other Sessions Confirmation Modal */}
      {confirmRevokeOthers && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: 16,
          }}
        >
          <div
            style={{
              background: "var(--bg-card, #ffffff)",
              borderRadius: 16,
              padding: 24,
              maxWidth: 440,
              width: "100%",
              boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)",
              border: "1px solid var(--border-default, #e2e8f0)",
            }}
          >
            <h4 style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 700, color: "var(--text-primary, #0f172a)" }}>
              Log out of all other devices?
            </h4>
            <p style={{ fontSize: 13, color: "var(--text-muted, #64748b)", margin: "0 0 20px", lineHeight: 1.5 }}>
              This will immediately sign out all {otherSessions.length} other device(s) logged into your account. Only
              this current session will remain active.
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button
                type="button"
                onClick={() => setConfirmRevokeOthers(false)}
                disabled={actionBusy}
                style={{
                  padding: "8px 14px",
                  borderRadius: 8,
                  border: "1px solid var(--border-default, #e2e8f0)",
                  background: "var(--bg-surface, #f8fafc)",
                  color: "var(--text-primary, #0f172a)",
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleRevokeOthers()}
                disabled={actionBusy}
                style={{
                  padding: "8px 14px",
                  borderRadius: 8,
                  border: "none",
                  background: "#ef4444",
                  color: "#ffffff",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {actionBusy ? "Logging out…" : "Log Out All Other Devices"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
