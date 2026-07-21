import type { ReactNode } from "react";

/** Status → badge tone mapping across all portal modules. */
export function StatusBadge({ status }: { status: string }) {
  const tone =
    ["Accepted", "Paid", "Verified", "delivered", "Delivered", "Resolved"].includes(status)
      ? "badge--ok"
      : ["Declined", "Expired", "Overdue", "Rejected", "Cancelled", "on_hold"].includes(status)
        ? "badge--error"
        : ["Issued", "Quoted", "Pending Verification", "Partially Paid", "dispatched"].includes(status)
          ? "badge--warn"
          : "badge--info";
  return <span className={`badge ${tone}`}>{status.replaceAll("_", " ")}</span>;
}

export function Panel({ title, children, actions }: { title?: string; children: ReactNode; actions?: ReactNode }) {
  return (
    <section className="panel">
      {(title || actions) && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "1rem" }}>
          {title && <h2>{title}</h2>}
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" });
}

export function formatMoney(value: number | null | undefined, currency = "INR"): string {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 0 }).format(value);
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "—";
  const units = ["B", "KB", "MB"];
  let i = 0;
  let v = bytes;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}
