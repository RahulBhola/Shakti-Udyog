import { useCallback, useEffect, useState } from "react";
import { apiGet, apiPatch } from "../../api/client";
import { EmptyState, Loading } from "../../components/ui";
import { formatDate } from "../shared";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    apiGet<any[]>("/api/v1/admin/users").then(setUsers).catch((e: Error) => setError(e.message));
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function toggleActive(id: string) {
    await apiPatch(`/api/v1/admin/users/${id}/toggle-active`, {});
    load();
  }

  if (error) return <EmptyState title="Users unavailable" text={error} />;
  if (!users) return <Loading label="Loading users" />;
  return (
    <>
      <h1>Users</h1>
      <div className="list-rows">
        {users.map((u: any) => (
          <div key={u.id} className="list-row">
            <div className="list-row__main">
              <div className="list-row__title">{u.fullName ?? u.email}</div>
              <div className="list-row__meta">{u.email} · {u.phoneNumber ?? "—"} · Joined {formatDate(u.createdAtUtc)}</div>
            </div>
            <button className="btn btn--ghost" style={{ color: u.isActive ? "var(--c-error)" : "var(--c-success)", padding: "0.3rem 0.7rem", fontSize: "var(--fs-xs)" }} onClick={() => void toggleActive(u.id)}>
              {u.isActive ? "Deactivate" : "Activate"}
            </button>
          </div>
        ))}
      </div>
    </>
  );
}
