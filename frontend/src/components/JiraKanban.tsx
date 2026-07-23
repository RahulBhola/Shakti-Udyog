import { useEffect, useState } from "react";
import { apiGet } from "../api/client";
import { Panel, formatDate } from "../portal/shared";

interface KanbanIssue {
  id: string;
  entityType: string;
  entityId: string;
  jiraIssueKey: string;
  jiraIssueUrl: string | null;
  status: string;
  createdAtUtc: string;
  lastSyncAtUtc: string | null;
}

interface KanbanColumn {
  status: string;
  issues: KanbanIssue[];
}

interface KanbanData {
  connected: boolean;
  columns: KanbanColumn[];
}

const STATUS_COLORS: Record<string, string> = {
  "To Do": "#4a90d9",
  "In Progress": "#f5a623",
  Done: "#7ed321",
  Created: "#9b9b9b",
  Unknown: "#9b9b9b",
};

export function JiraKanban() {
  const [data, setData] = useState<KanbanData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet<KanbanData>("/api/v1/admin/jira/kanban")
      .then(setData)
      .catch(() => setData({ connected: false, columns: [] }))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return null;

  if (!data?.connected) {
    return (
      <Panel title="Jira Kanban Board">
        <p className="placeholder-note" style={{ padding: "2rem", textAlign: "center" }}>
          Jira is not connected.{' '}
          <a href="/admin/jira" style={{ color: "var(--c-primary)" }}>Configure Jira integration</a>
        </p>
      </Panel>
    );
  }

  const allIssues = data.columns.reduce((sum, c) => sum + c.issues.length, 0);
  if (allIssues === 0) {
    return (
      <Panel title="Jira Kanban Board">
        <p className="placeholder-note" style={{ padding: "2rem", textAlign: "center" }}>
          No synced issues yet.{' '}
          <a href="/admin/jira" style={{ color: "var(--c-primary)" }}>Run a sync</a>
        </p>
      </Panel>
    );
  }

  return (
    <Panel title={`Jira Kanban Board (${allIssues} issues)`}>
      <div className="kanban-board" style={{ display: "grid", gridTemplateColumns: `repeat(${data.columns.length}, 1fr)`, gap: "var(--sp-3)", overflowX: "auto", minHeight: "200px" }}>
        {data.columns.map((col) => (
          <div key={col.status} className="kanban-column" style={{ minWidth: "220px", background: "rgba(15,21,36,0.3)", borderRadius: "var(--radius)", padding: "var(--sp-3)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "var(--sp-3)" }}>
              <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: STATUS_COLORS[col.status] ?? "#9b9b9b", display: "inline-block" }} />
              <strong>{col.status}</strong>
              <span style={{ color: "var(--c-muted)", fontSize: "var(--fs-sm)" }}>({col.issues.length})</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-2)" }}>
              {col.issues.map((issue) => (
                <div key={issue.id} className="kanban-card" style={{ background: "var(--c-card)", borderRadius: "var(--radius)", padding: "var(--sp-3)", border: "1px solid var(--c-line)", fontSize: "var(--fs-sm)" }}>
                  <div style={{ fontWeight: 600, marginBottom: "0.25rem" }}>
                    {issue.jiraIssueUrl ? (
                      <a href={issue.jiraIssueUrl} target="_blank" rel="noopener noreferrer" style={{ color: "var(--c-primary)" }}>
                        {issue.jiraIssueKey}
                      </a>
                    ) : (
                      issue.jiraIssueKey
                    )}
                  </div>
                  <div style={{ color: "var(--c-muted)", marginBottom: "0.25rem" }}>
                    <span className="badge badge--info" style={{ fontSize: "0.7rem" }}>{issue.entityType}</span>
                  </div>
                  <div style={{ color: "var(--c-muted)", fontSize: "0.75rem" }}>
                    {issue.lastSyncAtUtc ? formatDate(issue.lastSyncAtUtc) : formatDate(issue.createdAtUtc)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}
