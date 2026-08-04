import { useEffect, useState, type CSSProperties } from "react";
import { apiGet } from "../api/client";
import { Loading } from "./ui";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { Package, Cog, AlertTriangle, Calendar, CheckCircle2, ShieldCheck } from "lucide-react";
import "../portal/pages/erpListView.css";

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

const PRIORITY_COLORS: Record<string, string> = {
  Critical: "#ef4444", High: "#f97316", Medium: "#eab308", Low: "#22c55e",
};
const STAGE_BAR_COLORS = [
  "#6366f1", "#8b5cf6", "#a78bfa", "#c4b5fd", "#22c55e", "#14b8a6", "#06b6d4", "#0ea5e9", "#3b82f6", "#f97316",
  "#f59e0b", "#ef4444", "#dc2626", "#b91c1c", "#64748b", "#78716c", "#a8a29e", "#57534e", "#d946ef", "#ec4899",
  "#eab308", "#84cc16", "#10b981",
];

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload) return null;
  return (
    <div style={{
      background: "var(--bg-card)", border: "1px solid var(--border-input)", borderRadius: 12,
      padding: "12px 14px", fontSize: 12, boxShadow: "var(--shadow-lg)",
    }}>
      <div style={{ fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>{label ?? payload[0]?.name}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ color: "var(--text-secondary)" }}>{p.name}: <strong>{p.value}</strong></div>
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

  if (error) return <div className="inv-status" style={{ color: "var(--color-danger)" }}>Dashboard unavailable</div>;
  if (loading) return <div className="inv-status"><Loading label="Loading dashboard" /></div>;
  if (!data) return null;

  const kpis = [
    { label: "Total Active Jobs", value: data.totalActiveJobs, hint: "Open production jobs", icon: Package, color: "var(--kpi-blue)", bg: "var(--kpi-blue-bg)", glow: "rgba(59,130,246,0.25)" },
    { label: "In Production", value: data.jobsInProduction, hint: "Currently in the foundry", icon: Cog, color: "var(--kpi-purple)", bg: "var(--kpi-purple-bg)", glow: "rgba(167,139,250,0.22)" },
    { label: "Delayed Jobs", value: data.delayedJobs, hint: "Past target dispatch", icon: AlertTriangle, color: "var(--color-danger)", bg: "rgba(239,68,68,0.10)", glow: "rgba(239,68,68,0.22)" },
    { label: "Due This Week", value: data.jobsDueThisWeek, hint: "Scheduled to complete", icon: Calendar, color: "var(--kpi-orange)", bg: "var(--kpi-orange-bg)", glow: "rgba(249,115,22,0.22)" },
    { label: "Completed (Month)", value: data.completedThisMonth, hint: "Finished this month", icon: CheckCircle2, color: "var(--kpi-green)", bg: "var(--kpi-green-bg)", glow: "rgba(34,197,94,0.22)" },
    { label: "Quality Pass Rate", value: `${data.qualityPassRate}%`, hint: "Passing inspection", icon: ShieldCheck, color: "var(--kpi-teal)", bg: "var(--kpi-teal-bg)", glow: "rgba(20,184,166,0.22)" },
  ];

  return (
    <div className="inv-page" style={{ gap: 18 }}>
      {/* KPI cards */}
      <div className="inv-kpi-grid">
        {kpis.map((k) => (
          <div key={k.label} className="inv-kpi"
            style={{ "--inv-kpi-color": k.color, "--inv-kpi-bg": k.bg, "--inv-kpi-glow": k.glow } as CSSProperties}>
            <span className="inv-kpi__icon"><k.icon size={20} /></span>
            <span className="inv-kpi__value">{k.value}</span>
            <span className="inv-kpi__label">{k.label}</span>
            <span className="inv-kpi__hint">{k.hint}</span>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="inv-chart-grid">
        <div className="inv-chart-card">
          <h3 className="inv-chart-card__title">Jobs by Production Stage</h3>
          <p className="inv-chart-card__sub">Distribution of active jobs across stages</p>
          {data.jobsByStage.length === 0 ? (
            <div className="inv-status" style={{ padding: 24 }}>No active jobs</div>
          ) : (
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={data.jobsByStage} layout="vertical" margin={{ left: 120 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" />
                <XAxis type="number" tick={{ fontSize: 11, fill: "var(--text-muted)" }} />
                <YAxis type="category" dataKey="stage" tick={{ fontSize: 10, fill: "var(--text-muted)" }} width={120} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="count" name="Jobs" radius={[0, 4, 4, 0]}>
                  {data.jobsByStage.map((_, i) => (
                    <Cell key={i} fill={STAGE_BAR_COLORS[i % STAGE_BAR_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="inv-chart-card">
          <h3 className="inv-chart-card__title">Jobs by Priority</h3>
          <p className="inv-chart-card__sub">Active jobs grouped by priority</p>
          {data.jobsByPriority.length === 0 ? (
            <div className="inv-status" style={{ padding: 24 }}>No active jobs</div>
          ) : (
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={data.jobsByPriority}
                  cx="50%" cy="50%" outerRadius={110} dataKey="count" nameKey="priority"
                  label={({ priority, percent }: any) => `${priority} ${((percent ?? 0) * 100).toFixed(0)}%`}
                >
                  {data.jobsByPriority.map((entry) => (
                    <Cell key={entry.priority} fill={PRIORITY_COLORS[entry.priority] || "#6b7280"} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Summary table */}
      {data.jobsByStage.length > 0 && (
        <div className="inv-table-wrap">
          <div className="inv-scroll">
            <table className="inv-table">
              <colgroup>
                <col style={{ width: "50%" }} />
                <col style={{ width: "25%" }} />
                <col style={{ width: "25%" }} />
              </colgroup>
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
                    <td><div className="inv-date">{s.stage}</div></td>
                    <td style={{ textAlign: "right", fontWeight: 600 }}>{s.count}</td>
                    <td style={{ textAlign: "right" }}>
                      {data.totalActiveJobs > 0 ? `${((s.count / data.totalActiveJobs) * 100).toFixed(1)}%` : "0%"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
