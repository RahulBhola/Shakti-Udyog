import { useEffect, useState } from "react";
import { apiDownload } from "../../api/client";
import { customerApi, type DocumentItem } from "../../api/customerApi";
import { EmptyState, Loading } from "../../components/ui";
import { Panel, formatBytes, formatDate } from "../shared";

const categories = [
  "Inspection Report", "Invoice", "Packing List", "Certificate", "Delivery Challan", "Drawing",
];

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<DocumentItem[] | null>(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  useEffect(() => {
    const handle = setTimeout(() => {
      customerApi.documents(search || undefined, category || undefined)
        .then(setDocuments)
        .catch((e: Error) => setError(e.message));
    }, 250);
    return () => clearTimeout(handle);
  }, [search, category]);

  async function download(doc: DocumentItem) {
    setDownloadError(null);
    try {
      await apiDownload(customerApi.downloadDocument(doc.id), doc.fileName);
    } catch {
      setDownloadError(
        `Could not download "${doc.title}". Demo documents have no file content; real files download normally.`);
    }
  }

  return (
    <>
      <h1>Documents</h1>

      <Panel>
        <div className="form" style={{ maxWidth: "none", gridTemplateColumns: "1fr 1fr", display: "grid" }}>
          <div className="form__field">
            <label htmlFor="d-search">Search</label>
            <input id="d-search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Title or file name" />
          </div>
          <div className="form__field">
            <label htmlFor="d-category">Category</label>
            <select id="d-category" value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">All categories</option>
              {categories.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>
      </Panel>

      {downloadError && <p className="form-status form-status--error" role="alert">{downloadError}</p>}
      {error && <EmptyState title="Documents unavailable" text={error} />}
      {!documents && !error && <Loading label="Loading documents" />}
      {documents && documents.length === 0 && (
        <EmptyState title="No documents" text="No approved documents match your filters." />
      )}
      {documents && documents.length > 0 && (
        <div className="list-rows">
          {documents.map((d) => (
            <div className="list-row" key={d.id}>
              <div className="list-row__main">
                <div className="list-row__title">{d.title}</div>
                <div className="list-row__meta">
                  {d.category}{d.orderNumber && ` · ${d.orderNumber}`} · {formatBytes(d.sizeBytes)} · {formatDate(d.createdAtUtc)}
                </div>
              </div>
              <button className="btn btn--ghost" style={{ color: "var(--c-ink)", padding: "0.4rem 0.9rem" }} type="button" onClick={() => void download(d)}>
                Download
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
