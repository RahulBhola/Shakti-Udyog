import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { customerApi, type NotificationItem, type Paged } from "../../api/customerApi";
import { EmptyState, Loading } from "../../components/ui";
import { formatDate } from "../shared";

export default function NotificationsPage() {
  const [data, setData] = useState<Paged<NotificationItem> | null>(null);
  const [page, setPage] = useState(1);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    customerApi.notifications(page, 10, unreadOnly || undefined)
      .then(setData)
      .catch((e: Error) => setError(e.message));
  }, [page, unreadOnly]);

  useEffect(load, [load]);

  async function markRead(id: string) {
    await customerApi.markNotificationRead(id).catch(() => {});
    load();
  }

  const totalPages = data ? Math.max(1, Math.ceil(data.totalCount / data.pageSize)) : 1;

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
        <h1>Notifications</h1>
        <label className="form__consent" style={{ alignItems: "center" }}>
          <input type="checkbox" checked={unreadOnly} onChange={(e) => { setUnreadOnly(e.target.checked); setPage(1); }} />
          <span>Unread only</span>
        </label>
      </div>

      {error && <EmptyState title="Notifications unavailable" text={error} />}
      {!data && !error && <Loading label="Loading notifications" />}
      {data && data.items.length === 0 && <EmptyState title="No notifications" />}
      {data && data.items.length > 0 && (
        <div className="list-rows">
          {data.items.map((n) => (
            <div className={`list-row ${n.isRead ? "" : "notification--unread"}`} key={n.id}>
              <div className="list-row__main">
                <div className="list-row__title">{n.title}</div>
                <div className="list-row__meta">{n.type} · {formatDate(n.createdAtUtc)}</div>
                {n.body && <p style={{ margin: "var(--sp-2) 0 0" }}>{n.body}</p>}
              </div>
              <div className="quick-actions">
                {n.linkPath && <Link to={n.linkPath}>Open</Link>}
                {!n.isRead && (
                  <button
                    className="btn btn--ghost"
                    style={{ color: "var(--c-ink)", padding: "0.3rem 0.7rem" }}
                    type="button"
                    onClick={() => void markRead(n.id)}
                  >
                    Mark read
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {data && totalPages > 1 && (
        <div className="quick-actions">
          <button className="btn btn--ghost" style={{ color: "var(--c-ink)" }} type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            ← Previous
          </button>
          <span style={{ alignSelf: "center" }}>Page {page} of {totalPages}</span>
          <button className="btn btn--ghost" style={{ color: "var(--c-ink)" }} type="button" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
            Next →
          </button>
        </div>
      )}
    </>
  );
}
