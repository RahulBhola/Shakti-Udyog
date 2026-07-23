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
  title?: string;
  storyPoints?: number;
  priority?: string;
  assignee?: string;
  assigneeAvatarUrl?: string;
  issueType?: string;
  parentKey?: string;
  labels?: string;
}

interface KanbanColumn {
  status: string;
  issues: KanbanIssue[];
}

interface KanbanData {
  connected: boolean;
  projectName: string;
  columns: KanbanColumn[];
}

const STATUS_COLORS: Record<string, string> = {
  "BLOCKER": "#ef4444",
  "TO DO": "#6366f1",
  "IN PROGRESS": "#f59e0b",
  "TESTING (DEV)": "#3b82f6",
  "UAT(QA)": "#8b5cf6",
  "READY FOR PROD": "#10b981",
  "DONE": "#22c55e",
  "Created": "#9ca3af",
  "Unknown": "#9ca3af",
};

const ISSUE_TYPE_ICONS: Record<string, string> = {
  "Story": " ",
  "Task": " ",
  "Bug": " ",
  "Sub-task": " ",
  "Epic": " ",
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getAvatarColor(name: string): string {
  const colors = [
    "#6366f1", "#8b5cf6", "#ec4899", "#f43f5e",
    "#f97316", "#eab308", "#22c55e", "#14b8a6",
    "#06b6d4", "#3b82f6",
  ];
  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
}

export function JiraKanban() {
  const [data, setData] = useState<KanbanData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedIssue, setSelectedIssue] = useState<KanbanIssue | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterLabels, setFilterLabels] = useState<string[]>([]);

  useEffect(() => {
    apiGet<KanbanData>("/api/v1/admin/jira/kanban")
      .then(setData)
      .catch(() => setData({ connected: false, projectName: "Project", columns: [] }))
      .finally(() => setLoading(false));
  }, []);

  // Extract unique labels from all issues
  const allLabels = data?.columns
    .flatMap((col) => col.issues)
    .flatMap((issue) => issue.labels?.split(",") || [])
    .filter(Boolean)
    .filter((label, index, arr) => arr.indexOf(label) === index)
    .slice(0, 10) || [];

  // Filter issues based on search and labels
  const filteredData = data?.columns.map((col) => ({
    ...col,
    issues: col.issues.filter((issue) => {
      const matchesSearch = searchQuery === "" ||
        issue.jiraIssueKey.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (issue.title?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
        (issue.entityType.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesLabels = filterLabels.length === 0 ||
        filterLabels.some((label) => issue.labels?.includes(label));
      return matchesSearch && matchesLabels;
    }),
  })) || [];

  const allIssues = filteredData.reduce((sum, c) => sum + c.issues.length, 0);

  if (loading) {
    return (
      <Panel title="Jira Kanban Board">
        <div className="loading">
          <div className="spinner" />
        </div>
      </Panel>
    );
  }

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

  if (allIssues === 0 && !searchQuery && filterLabels.length === 0) {
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
    <div className="jira-board">
      {/* Board Header */}
      <div className="jira-board__header">
        <div className="jira-board__title">
          <h2>{data.projectName}</h2>
          <span className="jira-board__subtitle">Active sprints</span>
        </div>
        <div className="jira-board__tabs">
          <button className="jira-board__tab">Summary</button>
          <button className="jira-board__tab">Timeline</button>
          <button className="jira-board__tab">Backlog</button>
          <button className="jira-board__tab jira-board__tab--active">Active sprints</button>
          <button className="jira-board__tab">Reports</button>
          <button className="jira-board__tab">List</button>
        </div>
      </div>

      {/* Filters */}
      <div className="jira-board__filters">
        <div className="jira-board__search">
          <input
            type="text"
            placeholder="Search board"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="jira-board__filter-chips">
          {allLabels.map((label) => (
            <button
              key={label}
              className={`jira-board__chip ${filterLabels.includes(label) ? "jira-board__chip--active" : ""}`}
              onClick={() => {
                setFilterLabels((prev) =>
                  prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
                );
              }}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="jira-board__filter-actions">
          <button className="btn btn--ghost">Quick filters</button>
          <button className="btn btn--ghost">Label</button>
        </div>
      </div>

      {/* Kanban Columns */}
      <div className="jira-board__columns">
        {filteredData.map((col) => (
          <div key={col.status} className="jira-board__column">
            <div className="jira-board__column-header">
              <span
                className="jira-board__column-dot"
                style={{ backgroundColor: STATUS_COLORS[col.status] || "#9ca3af" }}
              />
              <span className="jira-board__column-title">{col.status}</span>
              <span className="jira-board__column-count">{col.issues.length}</span>
            </div>
            <div className="jira-board__cards">
              {col.issues.map((issue) => (
                <div
                  key={issue.id}
                  className="jira-board__card"
                  onClick={() => setSelectedIssue(issue)}
                >
                  {/* Parent issue */}
                  {issue.parentKey && (
                    <div className="jira-board__card-parent">
                      {issue.parentKey}
                    </div>
                  )}

                  {/* Issue key and type */}
                  <div className="jira-board__card-header">
                    <span className="jira-board__card-key">{issue.jiraIssueKey}</span>
                    {issue.issueType && (
                      <span className="jira-board__card-type">
                        {ISSUE_TYPE_ICONS[issue.issueType] || " "}
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <div className="jira-board__card-title">
                    {issue.title || `${issue.entityType}: ${issue.entityId}`}
                  </div>

                  {/* Story points and priority */}
                  <div className="jira-board__card-meta">
                    {issue.storyPoints && (
                      <span className="jira-board__card-points">{issue.storyPoints}</span>
                    )}
                    {issue.priority && (
                      <span
                        className="jira-board__card-priority"
                        title={issue.priority}
                      >
                        {issue.priority === "High" ? "  " : issue.priority === "Medium" ? " " : " "}
                      </span>
                    )}
                  </div>

                  {/* Assignee */}
                  {issue.assignee && (
                    <div className="jira-board__card-assignee">
                      {issue.assigneeAvatarUrl ? (
                        <img
                          src={issue.assigneeAvatarUrl}
                          alt={issue.assignee}
                          className="jira-board__card-avatar"
                        />
                      ) : (
                        <div
                          className="jira-board__card-avatar jira-board__card-avatar--initials"
                          style={{ backgroundColor: getAvatarColor(issue.assignee) }}
                          title={issue.assignee}
                        >
                          {getInitials(issue.assignee)}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Labels */}
                  {issue.labels && (
                    <div className="jira-board__card-labels">
                      {issue.labels.split(",").slice(0, 2).map((label) => (
                        <span key={label} className="jira-board__card-label">
                          {label.trim()}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Issue Detail Panel */}
      {selectedIssue && (
        <div className="jira-board__detail-overlay" onClick={() => setSelectedIssue(null)}>
          <div className="jira-board__detail-panel" onClick={(e) => e.stopPropagation()}>
            <div className="jira-board__detail-header">
              <div className="jira-board__detail-key">{selectedIssue.jiraIssueKey}</div>
              <button className="jira-board__detail-close" onClick={() => setSelectedIssue(null)}>
                ×
              </button>
            </div>
            <div className="jira-board__detail-content">
              <h3>{selectedIssue.title || `${selectedIssue.entityType}: ${selectedIssue.entityId}`}</h3>
              <div className="jira-board__detail-meta">
                <div><strong>Status:</strong> {selectedIssue.status}</div>
                <div><strong>Type:</strong> {selectedIssue.issueType || "Task"}</div>
                <div><strong>Priority:</strong> {selectedIssue.priority || "Medium"}</div>
                {selectedIssue.assignee && <div><strong>Assignee:</strong> {selectedIssue.assignee}</div>}
                {selectedIssue.storyPoints && <div><strong>Story Points:</strong> {selectedIssue.storyPoints}</div>}
                <div><strong>Entity:</strong> {selectedIssue.entityType}</div>
                <div><strong>Created:</strong> {formatDate(selectedIssue.createdAtUtc)}</div>
                {selectedIssue.lastSyncAtUtc && (
                  <div><strong>Last Sync:</strong> {formatDate(selectedIssue.lastSyncAtUtc)}</div>
                )}
              </div>
              {selectedIssue.jiraIssueUrl && (
                <a
                  href={selectedIssue.jiraIssueUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn--primary"
                  style={{ marginTop: "1rem" }}
                >
                  Open in Jira
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
