import { useCallback, useEffect, useState } from "react";
import { apiGet, apiDelete, apiUpload } from "../../api/client";
import { EmptyState, Loading } from "../../components/ui";
import { Panel, formatDate, formatBytes } from "../shared";

export default function AdminDocumentsPage() {
  const [docs, setDocs] = useState<any[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(() => { apiGet<any[]>("/api/v1/documents?search=&category=").then(setDocs).catch((e: Error) => setError(e.message)); }, []);

  useEffect(load, [load]);

  async function handleUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    try { await apiUpload("/api/v1/documents/upload", data); load(); } catch { alert("Upload failed."); }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this document?")) return;
    try { await apiDelete(`/api/v1/documents/${id}`); load(); } catch { alert("Delete failed."); }
  }

  return (
    <>
      <h1>Documents</h1>
      <Panel title="Upload document">
        <form className="form" onSubmit={handleUpload} style={{ maxWidth: "none" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: "var(--sp-3)", alignItems: "end" }}>
            <div className="form__field"><label>Title *</label><input name="title" required /></div>
            <div className="form__field"><label>Category</label><select name="category" defaultValue="Other"><option>Drawing</option><option>Certificate</option><option>Invoice</option><option>Report</option><option>Other</option></select></div>
            <div className="form__field"><label>File *</label><input name="file" type="file" required /></div>
            <input name="companyId" value="00000000-0000-0000-0000-000000000000" type="hidden" />
            <button className="btn btn--primary" type="submit">Upload</button>
          </div>
        </form>
      </Panel>
      {error && <EmptyState title="Documents unavailable" text={error} />}
      {!docs && !error && <Loading label="Loading documents" />}
      {docs && docs.length === 0 && <EmptyState title="No documents" />}
      {docs && docs.length > 0 && (
        <div className="list-rows">
          {docs.map((d: any) => (
            <div key={d.id} className="list-row">
              <div className="list-row__main">
                <div className="list-row__title">{d.title}</div>
                <div className="list-row__meta">{d.category} · {d.fileName} · {formatBytes(d.sizeBytes)} · {formatDate(d.createdAtUtc)} · v{d.currentVersion}</div>
              </div>
              <div className="quick-actions">
                <a className="btn btn--ghost" style={{ color: "var(--c-ink)", padding: "0.2rem 0.6rem", fontSize: "var(--fs-xs)" }} href={`/api/v1/documents/${d.id}/download`}>Download</a>
                <button className="btn btn--ghost" style={{ color: "var(--c-error)", padding: "0.2rem 0.6rem", fontSize: "var(--fs-xs)" }} onClick={() => void handleDelete(d.id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
