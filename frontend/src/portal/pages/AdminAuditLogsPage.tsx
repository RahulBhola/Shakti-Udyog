import { useEffect, useState } from "react";
import { apiGet } from "../../api/client";
import { EmptyState, Loading } from "../../components/ui";
import { formatDate } from "../shared";

export default function AdminAuditLogsPage() {
  const [data, setData] = useState<{ items: any[]; page: number; totalCount: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  useEffect(() => { apiGet<any>(`/api/v1/admin/audit-logs?page=${page}&pageSize=50`).then(setData).catch((e: Error) => setError(e.message)); }, [page]);
  if (error) return <EmptyState title="Audit logs unavailable" text={error} />;
  if (!data) return <Loading label="Loading audit logs" />;

  const totalPages = Math.max(1, Math.ceil(data.totalCount / 50));
  return (
    <>
      <h1>Audit Logs</h1>
      <div className="list-rows">
        {data.items.map((log: any) => (
          <div key={log.id} className="list-row">
            <div className="list-row__main">
              <div className="list-row__title">{log.action}</div>
              <div className="list-row__meta">{log.entityType} #{log.entityId} · {log.ipAddress ?? "—"} · {formatDate(log.occurredAtUtc)}</div>
            </div>
          </div>
        ))}
      </div>
      {totalPages > 1 && (
        <div className="quick-actions" style={{ justifyContent: "center" }}>
          <button className="btn btn--ghost" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Previous</button>
          <span style={{ color: "var(--c-ink-muted)", fontSize: "var(--fs-sm)" }}>Page {page} of {totalPages}</span>
          <button className="btn btn--ghost" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
        </div>
      )}
    </>
  );
}
