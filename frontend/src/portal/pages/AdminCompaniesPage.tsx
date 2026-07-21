import { useEffect, useState } from "react";
import { apiGet } from "../../api/client";
import { EmptyState, Loading } from "../../components/ui";
import { formatDate } from "../shared";

export default function AdminCompaniesPage() {
  const [companies, setCompanies] = useState<any[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiGet<any[]>("/api/v1/admin/companies").then(setCompanies).catch((e: Error) => setError(e.message));
  }, []);

  if (error) return <EmptyState title="Companies unavailable" text={error} />;
  if (!companies) return <Loading label="Loading companies" />;
  return (
    <>
      <h1>Companies</h1>
      {companies.length === 0 && <EmptyState title="No companies" />}
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
    </>
  );
}
