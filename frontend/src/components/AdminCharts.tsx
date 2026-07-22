import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { Panel } from "../portal/shared";

const COLORS = ["#7dd3fc", "#c8a0f0", "#6ee7b7", "#fbbf24", "#f87171", "#94a3b8", "#38bdf8", "#a78bfa"];

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload) return null;
  return (
    <div style={{ background: "var(--glass-strong)", backdropFilter: "blur(16px)", border: "1px solid var(--c-line)", borderRadius: "var(--radius)", padding: "var(--sp-3)", fontSize: "var(--fs-sm)" }}>
      <div style={{ fontWeight: 700, color: "var(--c-ink)", marginBottom: "var(--sp-1)" }}>{label ?? payload[0]?.name}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ color: "var(--c-ink-soft)" }}>{p.name}: <strong>{p.value}</strong></div>
      ))}
    </div>
  );
}

export function OrdersPieChart({ data }: { data?: { name: string; value: number }[] }) {
  if (!data || data.length === 0) return <p className="placeholder-note">No order data</p>;
  return (
    <Panel title="Orders by Status">
      <ResponsiveContainer width="100%" height={280}>
        <PieChart><Pie data={data} cx="50%" cy="50%" outerRadius={90} label={({ name, percent }: any) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`} dataKey="value">{data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip content={<CustomTooltip />} /></PieChart>
      </ResponsiveContainer>
    </Panel>
  );
}

export function InvoicesPieChart({ data }: { data?: { name: string; value: number }[] }) {
  if (!data || data.length === 0) return <p className="placeholder-note">No invoice data</p>;
  return (
    <Panel title="Invoices by Status">
      <ResponsiveContainer width="100%" height={280}>
        <PieChart><Pie data={data} cx="50%" cy="50%" outerRadius={90} label={({ name, percent }: any) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`} dataKey="value">{data.map((_, i) => <Cell key={i} fill={COLORS[(i + 2) % COLORS.length]} />)}</Pie><Tooltip content={<CustomTooltip />} /></PieChart>
      </ResponsiveContainer>
    </Panel>
  );
}

export function MonthlyBarChart({ data }: { data?: { year: number; month: number; count: number }[] }) {
  if (!data || data.length === 0) return <p className="placeholder-note">No monthly data</p>;
  const chartData = data.map(d => ({ name: `${d.year}-${String(d.month).padStart(2, "0")}`, count: d.count }));
  return (
    <Panel title="RFQs per Month (12 months)">
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={chartData}><CartesianGrid strokeDasharray="3 3" stroke="var(--c-line)" /><XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--c-ink-muted)" }} /><YAxis tick={{ fontSize: 11, fill: "var(--c-ink-muted)" }} /><Tooltip content={<CustomTooltip />} /><Bar dataKey="count" fill="#7dd3fc" radius={[4, 4, 0, 0]} /></BarChart>
      </ResponsiveContainer>
    </Panel>
  );
}

export function RevenueLineChart() {
  const data = [{ name: "Jan", revenue: 0 }, { name: "Feb", revenue: 0 }, { name: "Mar", revenue: 0 }, { name: "Apr", revenue: 0 }, { name: "May", revenue: 0 }, { name: "Jun", revenue: 0 }];
  return (
    <Panel title="Revenue Trend (Placeholder)">
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data}><CartesianGrid strokeDasharray="3 3" stroke="var(--c-line)" /><XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--c-ink-muted)" }} /><YAxis tick={{ fontSize: 11, fill: "var(--c-ink-muted)" }} /><Tooltip content={<CustomTooltip />} /><Line type="monotone" dataKey="revenue" stroke="#c8a0f0" strokeWidth={2} dot={{ r: 4 }} /></LineChart>
      </ResponsiveContainer>
    </Panel>
  );
}
