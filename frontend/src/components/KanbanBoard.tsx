import { useEffect, useState } from "react";
import { apiGet, apiPost, apiPatch, apiDelete } from "../api/client";
import { Panel } from "../portal/shared";

interface KanbanTask {
  id: string;
  title: string;
  description: string | null;
  assignedTo: string | null;
  column: string;
  position: number;
  priority: string | null;
  createdAtUtc: string;
  updatedAtUtc: string | null;
}

const COLUMNS = ["To Do", "In Progress", "Done"];
const PRIORITIES = ["Low", "Medium", "High", "Critical"];

const PRIORITY_COLORS: Record<string, string> = {
  Low: "#9b9b9b",
  Medium: "#f5a623",
  High: "#e67e22",
  Critical: "#e74c3c",
};

const COLORS = ["#4a90d9", "#f5a623", "#7ed321"];

export function KanbanBoard() {
  const [tasks, setTasks] = useState<KanbanTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newPriority, setNewPriority] = useState("Medium");
  const [newColumn, setNewColumn] = useState("To Do");
  const [busy, setBusy] = useState<string | null>(null);

  const load = () => apiGet<KanbanTask[]>("/api/v1/kanban").then(setTasks).catch(() => {}).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  async function addTask() {
    if (!newTitle.trim()) return;
    await apiPost("/api/v1/kanban", { title: newTitle, description: newDesc || null, column: newColumn, priority: newPriority });
    setNewTitle(""); setNewDesc(""); setShowForm(false);
    load();
  }

  async function moveTask(id: string, col: string) {
    const pos = tasks.filter(t => t.column === col).length;
    await apiPatch(`/api/v1/kanban/${id}/move`, { column: col, position: pos });
    load();
  }

  async function deleteTask(id: string) {
    setBusy(id);
    await apiDelete(`/api/v1/kanban/${id}`);
    setBusy(null);
    load();
  }

  return (
    <Panel title="Kanban Board">
      <div style={{ marginBottom: "var(--sp-4)" }}>
        <button className="btn btn--primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : "+ Add Task"}
        </button>
      </div>

      {showForm && (
        <div style={{ marginBottom: "var(--sp-4)", display: "flex", flexDirection: "column", gap: "var(--sp-3)", maxWidth: "500px" }}>
          <input placeholder="Task title *" value={newTitle} onChange={(e) => setNewTitle(e.target.value)}
            style={{ padding: "0.6rem", background: "rgba(15,21,36,0.55)", color: "var(--c-ink)", border: "1px solid var(--c-line)", borderRadius: "var(--radius)" }} />
          <input placeholder="Description (optional)" value={newDesc} onChange={(e) => setNewDesc(e.target.value)}
            style={{ padding: "0.6rem", background: "rgba(15,21,36,0.55)", color: "var(--c-ink)", border: "1px solid var(--c-line)", borderRadius: "var(--radius)" }} />
          <div style={{ display: "flex", gap: "var(--sp-3)" }}>
            <select value={newColumn} onChange={(e) => setNewColumn(e.target.value)}
              style={{ padding: "0.6rem", background: "rgba(15,21,36,0.55)", color: "var(--c-ink)", border: "1px solid var(--c-line)", borderRadius: "var(--radius)" }}>
              {COLUMNS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={newPriority} onChange={(e) => setNewPriority(e.target.value)}
              style={{ padding: "0.6rem", background: "rgba(15,21,36,0.55)", color: "var(--c-ink)", border: "1px solid var(--c-line)", borderRadius: "var(--radius)" }}>
              {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <button className="btn btn--primary" onClick={() => void addTask()}>Create</button>
        </div>
      )}

      {loading ? <p>Loading…</p> : (
        <div className="kanban-board" style={{ display: "grid", gridTemplateColumns: `repeat(${COLUMNS.length}, 1fr)`, gap: "var(--sp-3)", overflowX: "auto", minHeight: "200px" }}>
          {COLUMNS.map((col, i) => {
            const colTasks = tasks.filter(t => t.column === col).sort((a, b) => a.position - b.position);
            return (
              <div key={col} className="kanban-column" style={{ background: "rgba(15,21,36,0.3)", borderRadius: "var(--radius)", padding: "var(--sp-3)", minWidth: "220px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "var(--sp-3)" }}>
                  <span style={{ width: "12px", height: "12px", borderRadius: "3px", background: COLORS[i], display: "inline-block" }} />
                  <strong>{col}</strong>
                  <span style={{ color: "var(--c-muted)", fontSize: "var(--fs-sm)" }}>({colTasks.length})</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-2)" }}>
                  {colTasks.map(task => (
                    <div key={task.id} className="kanban-card" style={{
                      background: "var(--c-card)", borderRadius: "var(--radius)", padding: "var(--sp-3)",
                      border: "1px solid var(--c-line)", fontSize: "var(--fs-sm)", cursor: "default"
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.25rem" }}>
                        <strong style={{ fontSize: "0.95rem" }}>{task.title}</strong>
                        <span style={{
                          fontSize: "0.65rem", padding: "0.1rem 0.4rem", borderRadius: "var(--radius)",
                          background: PRIORITY_COLORS[task.priority ?? "Medium"] ?? "#9b9b9b", color: "#fff", whiteSpace: "nowrap"
                        }}>
                          {task.priority ?? "Medium"}
                        </span>
                      </div>
                      {task.description && <p style={{ color: "var(--c-muted)", fontSize: "0.8rem", margin: "0.25rem 0" }}>{task.description}</p>}
                      {task.assignedTo && <p style={{ color: "var(--c-muted)", fontSize: "0.75rem" }}>👤 {task.assignedTo}</p>}
                      <div style={{ display: "flex", gap: "0.25rem", marginTop: "0.5rem" }}>
                        {col !== "To Do" && <button className="btn btn--ghost" style={{ fontSize: "0.65rem", padding: "0.2rem 0.4rem" }} onClick={() => void moveTask(task.id, COLUMNS[i - 1])}>←</button>}
                        {col !== "Done" && <button className="btn btn--ghost" style={{ fontSize: "0.65rem", padding: "0.2rem 0.4rem" }} onClick={() => void moveTask(task.id, COLUMNS[i + 1])}>→</button>}
                        <button className="btn btn--ghost" style={{ fontSize: "0.65rem", padding: "0.2rem 0.4rem", color: "var(--c-error)", marginLeft: "auto" }}
                          disabled={busy === task.id} onClick={() => void deleteTask(task.id)}>✕</button>
                      </div>
                    </div>
                  ))}
                  {colTasks.length === 0 && <p style={{ color: "var(--c-muted)", textAlign: "center", padding: "1rem 0", fontSize: "0.8rem" }}>Empty</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Panel>
  );
}
