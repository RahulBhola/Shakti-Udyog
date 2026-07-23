import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Area } from "recharts";
import { ChartCard } from "./dashboard/ChartCard";

/* ------------------------------------------------------------------ */
/*  Shared helpers                                                     */
/* ------------------------------------------------------------------ */

const TOOLTIP_CLASS = "!rounded-xl !border !border-[var(--border-default)] !bg-[var(--bg-card)]/95 !shadow-lg !text-xs";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className={`${TOOLTIP_CLASS} !p-2.5`} style={{ background: "var(--bg-card)" }}>
      <div className="font-semibold text-[var(--text-primary)] mb-0.5 text-xs">{label ?? payload[0].name}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2 text-[var(--text-secondary)] text-xs">
          {p.color && <span className="w-2 h-2 rounded-full shrink-0" style={{ background: p.color }} />}
          {p.name}: <span className="font-semibold text-[var(--text-primary)]">{p.value}</span>
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
    <text x={x} y={y} fill="#FFFFFF" textAnchor="middle" dominantBaseline="central" fontSize={10} fontWeight={600}>
      {(percent * 100).toFixed(0)}%
    </text>
  );
}

/* ------------------------------------------------------------------ */
/*  Chart colors                                                       */
/* ------------------------------------------------------------------ */

const CHART = {
  blue: ["#3B82F6", "#60A5FA"],
  purple: ["#8B5CF6", "#A78BFA"],
  green: ["#22C55E", "#4ADE80"],
  amber: ["#F59E0B", "#FBBF24"],
  red: ["#EF4444", "#F87171"],
  orange: ["#F97316", "#FB923C"],
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
        <div className="flex items-center justify-center h-[140px] text-sm text-[var(--text-secondary)]">No data available</div>
      </ChartCard>
    );
  }

  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <ChartCard title={title} subtitle={subtitle}>
      <div className="flex items-center gap-5">
        <div className="shrink-0">
          <ResponsiveContainer width={150} height={150}>
            <PieChart>
              <defs>
                {gradients.map(([from, to], i) => (
                  <linearGradient key={i} id={`dg-${i}`} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor={from} />
                    <stop offset="100%" stopColor={to} />
                  </linearGradient>
                ))}
              </defs>
              <Pie
                data={data} cx="50%" cy="50%" innerRadius={45} outerRadius={65}
                dataKey="value" strokeWidth={0} label={renderCustomLabel} labelLine={false}
                animationBegin={100} animationDuration={800} animationEasing="ease-out"
              >
                {data.map((_, i) => <Cell key={i} fill={`url(#dg-${i % gradients.length})`} />)}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-col gap-2 min-w-0 flex-1">
          {data.map((item, i) => {
            const [from] = gradients[i % gradients.length];
            const pct = total > 0 ? ((item.value / total) * 100).toFixed(1) : "0";
            return (
              <div key={item.name} className="flex items-center justify-between gap-2 text-[12px]">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: from }} />
                  <span className="text-[var(--text-secondary)] truncate">{item.name}</span>
                </div>
                <span className="text-[var(--text-primary)] font-semibold tabular-nums whitespace-nowrap">{item.value}</span>
              </div>
            );
          })}
        </div>
      </div>
    </ChartCard>
  );
}

/* ------------------------------------------------------------------ */
/*  Exported chart components                                         */
/* ------------------------------------------------------------------ */

export function OrdersPieChart({ data }: { data?: { name: string; value: number }[] }) {
  return (
    <DoughnutChartCard
      data={data}
      gradients={[CHART.blue, CHART.purple, CHART.green, CHART.orange]}
      title="Orders by Status" subtitle="Distribution of current orders"
    />
  );
}

export function InvoicesPieChart({ data }: { data?: { name: string; value: number }[] }) {
  return (
    <DoughnutChartCard
      data={data}
      gradients={[CHART.green, CHART.amber, CHART.red, CHART.blue]}
      title="Invoices by Status" subtitle="Invoice distribution overview"
    />
  );
}

/* ------------------------------------------------------------------ */
/*  RFQ Bar Chart                                                      */
/* ------------------------------------------------------------------ */

export function MonthlyBarChart({ data }: { data?: { year: number; month: number; count: number }[] }) {
  if (!data || data.length === 0) {
    return (
      <ChartCard title="RFQs per Month" subtitle="Last 12 months">
        <div className="flex items-center justify-center h-[140px] text-sm text-[var(--text-secondary)]">No data available</div>
      </ChartCard>
    );
  }

  const chartData = data.map(d => ({ name: `${d.year}-${String(d.month).padStart(2, "0")}`, count: d.count }));
  const maxCount = Math.max(...chartData.map(d => d.count), 1);

  return (
    <ChartCard title="RFQs per Month" subtitle="Last 12 months">
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

/* ------------------------------------------------------------------ */
/*  Revenue Line Chart                                                 */
/* ------------------------------------------------------------------ */

export function RevenueLineChart() {
  const data = [
    { name: "Jan", revenue: 0 }, { name: "Feb", revenue: 0 }, { name: "Mar", revenue: 0 },
    { name: "Apr", revenue: 0 }, { name: "May", revenue: 0 }, { name: "Jun", revenue: 0 }, { name: "Jul", revenue: 0 },
  ];

  return (
    <ChartCard title="Revenue Trend" subtitle="Monthly revenue (placeholder)">
      <ResponsiveContainer width="100%" height={140}>
        <LineChart data={data} margin={{ top: 4, right: 4, left: -12, bottom: 0 }}>
          <defs>
            <linearGradient id="revG" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.15} />
              <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 9, fill: "var(--text-muted)" }} axisLine={{ stroke: "var(--border-default)" }} tickLine={false} />
          <YAxis tick={{ fontSize: 9, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <Area type="monotone" dataKey="revenue" fill="url(#revG)" stroke="none" />
          <Line type="monotone" dataKey="revenue" stroke="var(--color-primary)" strokeWidth={2.5} dot={{ r: 3, fill: "var(--color-primary)", stroke: "var(--bg-card)", strokeWidth: 2 }} activeDot={{ r: 5, fill: "var(--color-primary)", stroke: "var(--bg-card)", strokeWidth: 2 }} animationBegin={300} animationDuration={800} animationEasing="ease-out" />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}