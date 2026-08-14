import { useEffect, useState } from "react";
import { apiGet } from "../api/client";
import { Panel } from "../portal/shared";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

/* ── Types ─────────────────────────────────────────────────────────────────── */

interface DashboardData {
  totalActiveJobs: number;
  jobsInProduction: number;
  delayedJobs: number;
  jobsDueThisWeek: number;
  completedThisMonth: number;
  qualityPassRate: number;
  jobsByStage: { stage: string; count: number }[];
  jobsByPriority: { priority: string; count: number }[];
}

/* ── Constants ─────────────────────────────────────────────────────────────── */

const PRIORITY_COLORS: Record<string, string> = {
  Critical: "#ef4444",
  High: "#f97316",
  Medium: "#eab308",
  Low: "#22c55e",
};

const STAGE_BAR_COLORS = [
  "#6366f1", "#8b5cf6", "#a78bfa", "#c4b5fd", "#22c55e",
  "#14b8a6", "#06b6d4", "#0ea5e9", "#3b82f6", "#f97316",
  "#f59e0b", "#ef4444", "#dc2626", "#b91c1c", "#64748b",
  "#78716c", "#a8a29e", "#57534e", "#6366f1", "#d946ef",
  "#ec4899", "#eab308", "#84cc16", "#22c55e", "#10b981",
];

/* ── Tooltip ───────────────────────────────────────────────────────────────── */

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload) return null;
  return (
    <div style={{
      background: "var(--glass-strong)", backdropFilter: "blur(16px)",
      border: "1px solid var(--c-line)", borderRadius: "var(--radius)",
      padding: "var(--sp-3)", fontSize: "var(--fs-sm)",
    }}>
      <div style={{ fontWeight: 700, color: "var(--c-ink)", marginBottom: "var(--sp-1)" }}>
        {label ?? payload[0]?.name}
      </div>
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ color: "var(--c-ink-soft)" }}>
          {p.name}: <strong>{p.value}</strong>
        </div>
      ))}
    </div>
  );
}

/* ── ProductionDashboard ──────────────────────────────────────────────────── */

export function ProductionDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    apiGet<DashboardData>("/api/v1/admin/production-board/dashboard")
      .then(setData)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  if (error) return <p className="form-status form-status--error">Dashboard unavailable</p>;
  if (loading) return <div className="prod-board__loading"><div className="spinner" /></div>;
  if (!data) return null;

  const kpis = [
    { label: "Total Active Jobs", value: data.totalActiveJobs, color: "var(--c-primary)" },
    { label: "In Production", value: data.jobsInProduction, color: "#3b82f6" },
    { label: "Delayed Jobs", value: data.delayedJobs, color: "var(--c-error)" },
    { label: "Due This Week", value: data.jobsDueThisWeek, color: "#f59e0b" },
    { label: "Completed (Month)", value: data.completedThisMonth, color: "var(--c-ok)" },
    { label: "Quality Pass Rate", value: `${data.qualityPassRate}%`, color: "#8b5cf6" },
  ];

  return (
    <div className="prod-dashboard">
      {/* KPI Cards */}
      <div className="prod-dashboard__kpis">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="prod-dashboard__kpi">
            <div className="prod-dashboard__kpi-value" style={{ color: kpi.color }}>
              {kpi.value}
            </div>
            <div className="prod-dashboard__kpi-label">{kpi.label}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="prod-dashboard__charts">
        {/* Jobs by Stage */}
        <Panel title="Jobs by Production Stage">
          {data.jobsByStage.length === 0 ? (
            <p className="placeholder-note">No active jobs</p>
          ) : (
            <ResponsiveContainer width="100%" height={350}>
              <BarChart
                data={data.jobsByStage}
                layout="vertical"
                margin={{ left: 120 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--c-line)" />
                <XAxis type="number" tick={{ fontSize: 11, fill: "var(--c-muted)" }} />
                <YAxis
                  type="category"
                  dataKey="stage"
                  tick={{ fontSize: 10, fill: "var(--c-muted)" }}
                  width={120}
                />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="count" name="Jobs" radius={[0, 4, 4, 0]}>
                  {data.jobsByStage.map((_, i) => (
                    <Cell key={i} fill={STAGE_BAR_COLORS[i % STAGE_BAR_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </Panel>

        {/* Jobs by Priority */}
        <Panel title="Jobs by Priority">
          {data.jobsByPriority.length === 0 ? (
            <p className="placeholder-note">No active jobs</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={data.jobsByPriority}
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  dataKey="count"
                  nameKey="priority"
                  label={({ priority, percent }: any) =>
                    `${priority} ${((percent ?? 0) * 100).toFixed(0)}%`
                  }
                >
                  {data.jobsByPriority.map((entry) => (
                    <Cell
                      key={entry.priority}
                      fill={PRIORITY_COLORS[entry.priority] || "#6b7280"}
                    />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Panel>
      </div>

      {/* Summary Table */}
      {data.jobsByStage.length > 0 && (
        <Panel title="Stage Summary">
          <div className="prod-dashboard__table-wrapper">
            <table className="prod-dashboard__table">
              <thead>
                <tr>
                  <th>Stage</th>
                  <th style={{ textAlign: "right" }}>Job Count</th>
                  <th style={{ textAlign: "right" }}>% of Total</th>
                </tr>
              </thead>
              <tbody>
                {data.jobsByStage.map((s) => (
                  <tr key={s.stage}>
                    <td>{s.stage}</td>
                    <td style={{ textAlign: "right", fontWeight: 600 }}>{s.count}</td>
                    <td style={{ textAlign: "right" }}>
                      {data.totalActiveJobs > 0
                        ? `${((s.count / data.totalActiveJobs) * 100).toFixed(1)}%`
                        : "0%"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      )}
    </div>
  );
}
