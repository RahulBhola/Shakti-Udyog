import { Package, CheckCircle, FileEdit, FolderTree, AlertTriangle } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Stat card (reused from RfqListPage pattern)                        */
/* ------------------------------------------------------------------ */

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-3 rounded-[14px] border border-[var(--border-default)] bg-[var(--bg-card)] p-3.5 shadow-sm h-[76px]">
      <span className={`flex items-center justify-center w-10 h-10 rounded-xl shrink-0 ${color}/10`}>
        <Icon size={18} className={color} />
      </span>
      <div className="min-w-0">
        <div className="text-[22px] font-bold text-[var(--text-primary)] leading-none tabular-nums">{value}</div>
        <div className="text-[12px] text-[var(--text-secondary)] mt-0.5">{label}</div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  ProductStats — KPI cards row                                       */
/* ------------------------------------------------------------------ */

interface ProductStatsProps {
  total: number;
  active: number;
  draft: number;
  categories: number;
  lowUsage: number;
  loading?: boolean;
}

export default function ProductStats({ total, active, draft, categories, lowUsage, loading }: ProductStatsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="rounded-[14px] border border-[var(--border-default)] bg-[var(--bg-card)] p-3.5 h-[76px] animate-pulse">
            <div className="h-10 w-10 rounded-xl bg-[var(--bg-surface-hover)] mb-2" />
            <div className="h-5 w-16 bg-[var(--bg-surface-hover)] rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
      <StatCard icon={Package} label="Total Products" value={total} color="text-[var(--kpi-blue)]" />
      <StatCard icon={CheckCircle} label="Active" value={active} color="text-[var(--kpi-green)]" />
      <StatCard icon={FileEdit} label="Draft" value={draft} color="text-[var(--kpi-orange)]" />
      <StatCard icon={FolderTree} label="Categories" value={categories} color="text-[var(--kpi-purple)]" />
      <StatCard icon={AlertTriangle} label="Low Usage" value={lowUsage} color="text-[var(--kpi-pink)]" />
    </div>
  );
}