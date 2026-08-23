import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Area, AreaChart, Legend
} from "recharts";
import { ChartCard } from "./dashboard/ChartCard";

/* ------------------------------------------------------------------ */
/*  Shared helpers                                                     */
/* ------------------------------------------------------------------ */

const TOOLTIP_CLASS = "!rounded-xl !border !border-[var(--border-default)] !bg-[var(--bg-card)]/95 !shadow-lg !text-xs";

const inr = (v: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(v);

const inrCompact = (v: number) => {
  if (v >= 10_000_000) return `₹${(v / 10_000_000).toFixed(1)}Cr`;
  if (v >= 100_000) return `₹${(v / 100_000).toFixed(1)}L`;
  if (v >= 1_000) return `₹${(v / 1_000).toFixed(0)}k`;
  return `₹${v}`;
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className={`${TOOLTIP_CLASS} !p-2.5`} style={{ background: "var(--bg-card)" }}>
      <div className="font-semibold text-[var(--text-primary)] mb-1 text-xs">{label ?? payload[0].name}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center justify-between gap-3 text-[var(--text-secondary)] text-xs my-0.5">
          <div className="flex items-center gap-1.5">
            {p.color && <span className="w-2 h-2 rounded-full shrink-0" style={{ background: p.color }} />}
            <span>{p.name}:</span>
          </div>
          <span className="font-semibold text-[var(--text-primary)] tabular-nums">{p.value}</span>
        </div>
      ))}
    </div>
  );
};

const RADIAN = Math.PI / 180;

function renderCustomLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.6;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  if (percent < 0.05) return null;
  return (
    <text x={x} y={y} fill="#FFFFFF" textAnchor="middle" dominantBaseline="central" fontSize={10} fontWeight={700}>
      {(percent * 100).toFixed(0)}%
    </text>
  );
}

/* ------------------------------------------------------------------ */
/*  Chart colors                                                       */
/* ------------------------------------------------------------------ */

const CHART: Record<string, [string, string]> = {
  blue: ["#3B82F6", "#60A5FA"],
  purple: ["#8B5CF6", "#A78BFA"],
  green: ["#22C55E", "#4ADE80"],
  amber: ["#F59E0B", "#FBBF24"],
  red: ["#EF4444", "#F87171"],
  orange: ["#F97316", "#FB923C"],
  cyan: ["#06B6D4", "#67E8F9"],
};

/* ------------------------------------------------------------------ */
/*  Doughnut chart factory                                             */
/* ------------------------------------------------------------------ */

interface DoughnutChartProps {
  data?: { name: string; value: number }[];
  gradients: [string, string][];
  title: string;
  subtitle?: string;
}

function DoughnutChartCard({ data, gradients, title, subtitle }: DoughnutChartProps) {
  if (!data || data.length === 0) {
    return (
      <ChartCard title={title} subtitle={subtitle}>
        <div className="flex items-center justify-center h-[160px] text-sm text-[var(--text-secondary)]">No data available</div>
      </ChartCard>
    );
  }

  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <ChartCard title={title} subtitle={subtitle}>
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div className="w-[140px] h-[140px] shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <defs>
                {gradients.map(([from, to], i) => (
                  <linearGradient key={i} id={`grad-${i}`} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor={from} />
                    <stop offset="100%" stopColor={to} />
                  </linearGradient>
                ))}
              </defs>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={36}
                outerRadius={60}
                paddingAngle={3}
                labelLine={false}
                label={renderCustomLabel}
                animationBegin={100}
                animationDuration={700}
                animationEasing="ease-out"
              >
                {data.map((_, i) => (
                  <Cell key={i} fill={`url(#grad-${i % gradients.length})`} stroke="var(--bg-card)" strokeWidth={2} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-col gap-2 min-w-0 flex-1 w-full">
          {data.map((item, i) => {
            const [from] = gradients[i % gradients.length];
            const pct = total > 0 ? (item.value / total) * 100 : 0;
            return (
              <div key={item.name} className="flex items-center justify-between gap-2 text-[12px]">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: from }} />
                  <span className="text-[var(--text-secondary)] truncate">{item.name}</span>
                </div>
                <span className="text-[var(--text-primary)] font-semibold tabular-nums whitespace-nowrap">
                  {item.value} <span className="text-[10px] text-[var(--text-muted)] font-normal">({pct.toFixed(0)}%)</span>
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </ChartCard>
  );
}

/* ------------------------------------------------------------------ */
/*  1. Orders by Status                                                */
/* ------------------------------------------------------------------ */

const STATUS_BAR_COLORS = [CHART.blue[0], CHART.purple[0], CHART.green[0], CHART.orange[0], CHART.red[0], CHART.amber[0]];

export function OrdersStatusChart({ data }: { data?: { name: string; value: number }[] }) {
  if (!data || data.length === 0) {
    return (
      <ChartCard title="Orders by Status" subtitle="Current order distribution">
        <div className="flex items-center justify-center h-[160px] text-sm text-[var(--text-secondary)]">No data available</div>
      </ChartCard>
    );
  }

  const total = data.reduce((s, d) => s + d.value, 0);
  const max = Math.max(...data.map((d) => d.value), 1);
  const sorted = [...data].sort((a, b) => b.value - a.value);

  return (
    <ChartCard title="Orders by Status" subtitle="Current active and fulfilled order stages">
      <div className="space-y-3">
        {sorted.map((item, i) => {
          const pct = total > 0 ? (item.value / total) * 100 : 0;
          return (
            <div key={item.name}>
              <div className="flex items-center justify-between gap-2 text-[12px] mb-1">
                <span className="text-[var(--text-secondary)] truncate">{item.name}</span>
                <span className="text-[var(--text-primary)] font-semibold tabular-nums whitespace-nowrap">
                  {item.value} · {pct.toFixed(0)}%
                </span>
              </div>
              <div className="h-2 rounded-full bg-[var(--bg-surface-hover)] overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${(item.value / max) * 100}%`, background: STATUS_BAR_COLORS[i % STATUS_BAR_COLORS.length] }}
                />
              </div>
            </div>
          );
        })}
        <div className="pt-2 text-[11px] text-[var(--text-muted)] flex justify-between border-t border-[var(--border-default)]">
          <span>Active Pipeline:</span>
          <span className="font-semibold text-[var(--text-primary)]">{total} orders</span>
        </div>
      </div>
    </ChartCard>
  );
}

/* ------------------------------------------------------------------ */
/*  2. Invoices by Status Donut                                       */
/* ------------------------------------------------------------------ */

export function InvoicesPieChart({ data }: { data?: { name: string; value: number }[] }) {
  return (
    <DoughnutChartCard
      data={data}
      gradients={[CHART.green, CHART.amber, CHART.red, CHART.blue]}
      title="Invoices & Receivables"
      subtitle="Billed vs. collected payments status"
    />
  );
}

/* ------------------------------------------------------------------ */
/*  3. Metallurgy & Material Grade Mix                                */
/* ------------------------------------------------------------------ */

export function MetallurgyDonutChart({ data }: { data?: { name: string; value: number; color?: string; pct?: number }[] }) {
  if (!data || data.length === 0) {
    return (
      <ChartCard title="Metallurgy & Grade Mix" subtitle="Grey vs. Ductile Iron volume">
        <div className="flex items-center justify-center h-[160px] text-sm text-[var(--text-secondary)]">No data available</div>
      </ChartCard>
    );
  }

  const gradients: [string, string][] = [CHART.orange, CHART.blue, CHART.purple, CHART.cyan];

  return (
    <DoughnutChartCard
      data={data}
      gradients={gradients}
      title="Metallurgy & Grade Mix"
      subtitle="Grey Iron (FG) vs Ductile SG Iron volume"
    />
  );
}

/* ------------------------------------------------------------------ */
/*  4. MES Manufacturing Kanban Stage Throughput                      */
/* ------------------------------------------------------------------ */

export function MesStageBreakdownChart({ data }: { data?: { stage: string; count: number; color?: string }[] }) {
  if (!data || data.length === 0) {
    return (
      <ChartCard title="Foundry MES Stage Throughput" subtitle="Active production workflow">
        <div className="flex items-center justify-center h-[160px] text-sm text-[var(--text-secondary)]">No data available</div>
      </ChartCard>
    );
  }

  const max = Math.max(...data.map((d) => d.count), 1);
  const total = data.reduce((s, d) => s + d.count, 0);

  return (
    <ChartCard title="Foundry MES Production Stages" subtitle="Job distribution across casting workflow">
      <div className="space-y-2.5">
        {data.map((item, i) => (
          <div key={item.stage}>
            <div className="flex items-center justify-between gap-2 text-[11px] mb-0.5">
              <span className="text-[var(--text-secondary)] font-medium truncate">{item.stage}</span>
              <span className="text-[var(--text-primary)] font-bold tabular-nums">
                {item.count} <span className="text-[10px] text-[var(--text-muted)] font-normal">jobs</span>
              </span>
            </div>
            <div className="h-2 rounded-full bg-[var(--bg-surface-hover)] overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${Math.max((item.count / max) * 100, item.count > 0 ? 8 : 2)}%`,
                  background: item.color ?? STATUS_BAR_COLORS[i % STATUS_BAR_COLORS.length],
                }}
              />
            </div>
          </div>
        ))}
        <div className="pt-1.5 text-[11px] text-[var(--text-muted)] flex justify-between border-t border-[var(--border-default)]">
          <span>In-Process Capacity:</span>
          <span className="font-semibold text-[var(--text-primary)]">{total} Jobs Scheduled</span>
        </div>
      </div>
    </ChartCard>
  );
}

/* ------------------------------------------------------------------ */
/*  5. Cashflow Velocity (Invoiced vs. Collected) Dual Area Chart     */
/* ------------------------------------------------------------------ */

const CashflowTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className={`${TOOLTIP_CLASS} !p-3`} style={{ background: "var(--bg-card)" }}>
      <div className="font-bold text-[var(--text-primary)] mb-1.5 text-xs">{label}</div>
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-1.5 text-[var(--text-secondary)]">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0" />
            <span>Invoiced:</span>
          </div>
          <span className="font-bold text-[var(--text-primary)] tabular-nums">{inr(payload[0]?.value ?? 0)}</span>
        </div>
        <div className="flex items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-1.5 text-[var(--text-secondary)]">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
            <span>Collected:</span>
          </div>
          <span className="font-bold text-emerald-500 tabular-nums">{inr(payload[1]?.value ?? 0)}</span>
        </div>
      </div>
    </div>
  );
};

export function CashflowDualAreaChart({ data }: { data?: { name: string; invoiced: number; collected: number }[] }) {
  if (!data || data.length === 0) {
    return (
      <ChartCard title="Revenue vs. Collected Cashflow" subtitle="Billed vs. realized cash inflow">
        <div className="flex items-center justify-center h-[180px] text-sm text-[var(--text-secondary)]">No data available</div>
      </ChartCard>
    );
  }

  return (
    <ChartCard title="Revenue vs. Collected Cashflow" subtitle="12-Month billed invoices vs realized cash receipts">
      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="invGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#3B82F6" stopOpacity={0.0} />
            </linearGradient>
            <linearGradient id="colGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22C55E" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#22C55E" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 9, fill: "var(--text-muted)" }} axisLine={{ stroke: "var(--border-default)" }} tickLine={false} />
          <YAxis tick={{ fontSize: 9, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} tickFormatter={inrCompact} width={44} />
          <Tooltip content={<CashflowTooltip />} />
          <Area type="monotone" dataKey="invoiced" name="Invoiced" stroke="#3B82F6" strokeWidth={2} fill="url(#invGrad)" />
          <Area type="monotone" dataKey="collected" name="Collected" stroke="#22C55E" strokeWidth={2} fill="url(#colGrad)" />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

/* ------------------------------------------------------------------ */
/*  6. Commercial Pipeline (Enquiries -> Quotes -> Orders) Grouped Bar*/
/* ------------------------------------------------------------------ */

export function PipelineGroupedBarChart({ data }: { data?: { name: string; enquiries: number; quotations: number; orders: number }[] }) {
  if (!data || data.length === 0) {
    return (
      <ChartCard title="Commercial Deal Pipeline" subtitle="Monthly funnel progression">
        <div className="flex items-center justify-center h-[180px] text-sm text-[var(--text-secondary)]">No data available</div>
      </ChartCard>
    );
  }

  return (
    <ChartCard title="Commercial Deal Pipeline" subtitle="Enquiries received → Quotes issued → Confirmed orders">
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 9, fill: "var(--text-muted)" }} axisLine={{ stroke: "var(--border-default)" }} tickLine={false} />
          <YAxis tick={{ fontSize: 9, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} allowDecimals={false} />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="top"
            align="right"
            iconType="circle"
            wrapperStyle={{ fontSize: 10, paddingBottom: 6 }}
          />
          <Bar dataKey="enquiries" name="Enquiries" fill="#8B5CF6" radius={[4, 4, 0, 0]} maxBarSize={12} />
          <Bar dataKey="quotations" name="Quotations" fill="#3B82F6" radius={[4, 4, 0, 0]} maxBarSize={12} />
          <Bar dataKey="orders" name="Orders" fill="#22C55E" radius={[4, 4, 0, 0]} maxBarSize={12} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

/* ------------------------------------------------------------------ */
/*  7. Industry Sector Breakdown                                      */
/* ------------------------------------------------------------------ */

export function IndustrySectorBreakdownChart({ data }: { data?: { name: string; value: number }[] }) {
  if (!data || data.length === 0) {
    return (
      <ChartCard title="Industry Sector Distribution" subtitle="Orders by sector">
        <div className="flex items-center justify-center h-[160px] text-sm text-[var(--text-secondary)]">No data available</div>
      </ChartCard>
    );
  }

  const max = Math.max(...data.map((d) => d.value), 1);
  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <ChartCard title="Industry Sector Distribution" subtitle="Active casting catalog portfolio by sector">
      <div className="space-y-2.5">
        {data.slice(0, 6).map((item, i) => {
          const pct = total > 0 ? (item.value / total) * 100 : 0;
          return (
            <div key={item.name}>
              <div className="flex items-center justify-between gap-2 text-[11px] mb-0.5">
                <span className="text-[var(--text-secondary)] truncate">{item.name}</span>
                <span className="text-[var(--text-primary)] font-bold tabular-nums">
                  {item.value} <span className="text-[10px] text-[var(--text-muted)] font-normal">({pct.toFixed(0)}%)</span>
                </span>
              </div>
              <div className="h-2 rounded-full bg-[var(--bg-surface-hover)] overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${Math.max((item.value / max) * 100, item.value > 0 ? 8 : 2)}%`,
                    background: STATUS_BAR_COLORS[i % STATUS_BAR_COLORS.length],
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </ChartCard>
  );
}

/* ------------------------------------------------------------------ */
/*  8. Legacy Exports                                                 */
/* ------------------------------------------------------------------ */

export function MonthlyBarChart({ data }: { data?: { year: number; month: number; count: number }[] }) {
  if (!data || data.length === 0) {
    return (
      <ChartCard title="Enquiries per Month" subtitle="Last 12 months">
        <div className="flex items-center justify-center h-[140px] text-sm text-[var(--text-secondary)]">No data available</div>
      </ChartCard>
    );
  }

  const chartData = data.map((d) => ({ name: new Date(d.year, d.month - 1).toLocaleString("en", { month: "short" }), count: d.count }));
  const maxCount = Math.max(...chartData.map((d) => d.count), 1);

  return (
    <ChartCard title="Enquiries per Month" subtitle="Last 12 months">
      <ResponsiveContainer width="100%" height={140}>
        <BarChart data={chartData} margin={{ top: 4, right: 4, left: -12, bottom: 0 }}>
          <defs>
            <linearGradient id="barG" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.9} />
              <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0.4} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 9, fill: "var(--text-muted)" }} axisLine={{ stroke: "var(--border-default)" }} tickLine={false} />
          <YAxis tick={{ fontSize: 9, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} domain={[0, maxCount + 1]} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="count" fill="url(#barG)" radius={[6, 6, 0, 0]} animationBegin={200} animationDuration={800} animationEasing="ease-out" />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function RevenueLineChart({ data }: { data?: { year: number; month: number; revenue: number }[] }) {
  if (!data || data.length === 0) {
    return (
      <ChartCard title="Revenue Trend" subtitle="Monthly billed revenue">
        <div className="flex items-center justify-center h-[140px] text-sm text-[var(--text-secondary)]">No data available</div>
      </ChartCard>
    );
  }

  const chartData = data.map((d) => ({
    name: new Date(d.year, d.month - 1).toLocaleString("en", { month: "short" }),
    revenue: d.revenue,
  }));

  return (
    <ChartCard title="Revenue Trend" subtitle="Monthly billed revenue">
      <ResponsiveContainer width="100%" height={140}>
        <LineChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="revG" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.18} />
              <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 9, fill: "var(--text-muted)" }} axisLine={{ stroke: "var(--border-default)" }} tickLine={false} interval={1} />
          <YAxis tick={{ fontSize: 9, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} tickFormatter={(v: number) => inrCompact(v)} width={44} />
          <Tooltip content={<CustomTooltip />} />
          <Area type="monotone" dataKey="revenue" fill="url(#revG)" stroke="none" />
          <Line type="monotone" dataKey="revenue" stroke="var(--color-primary)" strokeWidth={2.5} dot={{ r: 3, fill: "var(--color-primary)", stroke: "var(--bg-card)", strokeWidth: 2 }} activeDot={{ r: 5, fill: "var(--color-primary)", stroke: "var(--bg-card)", strokeWidth: 2 }} animationBegin={300} animationDuration={800} animationEasing="ease-out" />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function OrdersPieChart({ data }: { data?: { name: string; value: number }[] }) {
  return (
    <DoughnutChartCard
      data={data}
      gradients={[CHART.blue, CHART.purple, CHART.green, CHART.orange]}
      title="Orders by Status"
      subtitle="Distribution of current orders"
    />
  );
}