import { useEffect, useState } from "react";
import { apiGet, apiPost } from "../../api/client";
import { EmptyState } from "../../components/ui";
import { formatDate } from "../shared";

interface PendingUser {
  id: string;
  fullName: string | null;
  companyName: string | null;
  email: string;
  phoneNumber: string | null;
  createdAtUtc: string;
}

export default function AdminCompaniesPage() {
  const [pending, setPending] = useState<PendingUser[] | null>(null);
  const [companies, setCompanies] = useState<any[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const load = () => {
    apiGet<any[]>("/api/v1/admin/companies").then(setCompanies).catch((e: Error) => setError(e.message));
    apiGet<PendingUser[]>("/api/v1/admin/pending-approvals").then(setPending).catch(() => {});
  };

  useEffect(() => { load(); }, []);

  async function approve(userId: string, companyName: string) {
    setBusy(userId); setMsg(null);
    try {
      const r = await apiPost<{ message: string }>(`/api/v1/admin/pending-approvals/${userId}/approve`, { companyName });
      setMsg(r.message);
      load();
    } catch { setMsg("Approval failed."); }
    finally { setBusy(null); }
  }

  return (
    <>
      <h1>Companies & Approvals</h1>

      {msg && <p className="form-status form-status--ok">{msg}</p>}
      {error && <EmptyState title="Error" text={error} />}

      {pending && pending.length > 0 && (
        <div className="panel" style={{ border: "2px solid var(--c-warn)" }}>
          <div className="panel__header"><h2>Pending approvals</h2></div>
          <p style={{ color: "var(--c-warn)", marginBottom: "var(--sp-3)" }}>
            {pending.length} user{pending.length > 1 ? "s" : ""} waiting for company approval
          </p>
          <div className="list-rows">
            {pending.map((u) => (
              <div key={u.id} className="list-row">
                <div className="list-row__main">
                  <div className="list-row__title">{u.fullName ?? u.email}</div>
                  <div className="list-row__meta">
                    {u.email} · {u.phoneNumber ?? "—"} · Company: <strong>{u.companyName}</strong> · {formatDate(u.createdAtUtc)}
                  </div>
                </div>
                <button className="btn btn--primary" style={{ padding: "0.3rem 0.7rem", fontSize: "var(--fs-xs)" }}
                  disabled={busy === u.id} onClick={() => void approve(u.id, u.companyName ?? u.email)}>
                  {busy === u.id ? "Approving…" : "Approve"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <h2 style={{ marginTop: "var(--sp-6)" }}>All Companies</h2>
      {companies && companies.length === 0 && <EmptyState title="No companies" />}
      {companies && companies.length > 0 && (
        <div className="list-rows">
          {companies.map((c) => (
            <div key={c.id} className="list-row">
              <div className="list-row__main">
                <div className="list-row__title">{c.name}</div>
                <div className="list-row__meta">{c.city ?? "—"} · GST: {c.gstNumber ?? "—"} · {formatDate(c.createdAtUtc)}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
