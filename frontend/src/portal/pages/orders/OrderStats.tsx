import { Package, CheckCircle2, Cog, ShieldCheck, Truck, PackageCheck } from "lucide-react";

interface OrderStat {
  label: string;
  value: number;
  icon: typeof Package;
  color: string;
}

interface OrderStatsProps {
  stats: {
    total: number;
    confirmed: number;
    production: number;
    qualityCheck: number;
    readyToDispatch: number;
    delivered: number;
  } | null;
  loading?: boolean;
}

export default function OrderStats({ stats, loading }: OrderStatsProps) {
  const cards: OrderStat[] = [
    { label: "Total Orders", value: stats?.total ?? 0, icon: Package, color: "from-blue-500/20 to-blue-600/10 text-blue-600 dark:text-blue-400" },
    { label: "Confirmed", value: stats?.confirmed ?? 0, icon: CheckCircle2, color: "from-emerald-500/20 to-emerald-600/10 text-emerald-600 dark:text-emerald-400" },
    { label: "In Production", value: stats?.production ?? 0, icon: Cog, color: "from-violet-500/20 to-violet-600/10 text-violet-600 dark:text-violet-400" },
    { label: "Quality Check", value: stats?.qualityCheck ?? 0, icon: ShieldCheck, color: "from-amber-500/20 to-amber-600/10 text-amber-600 dark:text-amber-400" },
    { label: "Ready to Dispatch", value: stats?.readyToDispatch ?? 0, icon: PackageCheck, color: "from-orange-500/20 to-orange-600/10 text-orange-600 dark:text-orange-400" },
    { label: "Delivered", value: stats?.delivered ?? 0, icon: Truck, color: "from-teal-500/20 to-teal-600/10 text-teal-600 dark:text-teal-400" },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] p-4 animate-pulse">
            <div className="h-3 w-16 bg-[var(--border-default)] rounded mb-3" />
            <div className="h-7 w-12 bg-[var(--border-default)] rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div key={card.label}
            className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] p-4 hover:shadow-sm hover:border-[var(--color-primary)]/30 transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-wider">{card.label}</span>
              <span className={`flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-br ${card.color}`}>
                <Icon size={14} />
              </span>
            </div>
            <div className="text-2xl font-bold text-[var(--text-primary)] tabular-nums">
              {card.value.toLocaleString()}
            </div>
          </div>
        );
      })}
    </div>
  );
}
