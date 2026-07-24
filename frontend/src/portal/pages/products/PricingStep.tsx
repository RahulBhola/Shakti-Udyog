interface PricingStepProps {
  data: Record<string, any>;
  onChange: (field: string, value: any) => void;
}

export default function PricingStep({ data, onChange }: PricingStepProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-[var(--text-primary)]">Pricing & Commercial</h3>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Standard Cost" value={data.standardCost} onChange={(v) => onChange("standardCost", v)} />
        <Field label="Selling Price" value={data.sellingPrice} onChange={(v) => onChange("sellingPrice", v)} />
        <Field label="GST (%)" value={data.gstPercent} onChange={(v) => onChange("gstPercent", v)} />
        <Field label="HSN Code" value={data.hsnCode ?? ""} onChange={(v) => onChange("hsnCode", v)} />
        <Field label="Currency" value={data.currency ?? "INR"} onChange={(v) => onChange("currency", v)} />
      </div>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: any; onChange: (v: any) => void }) {
  const isNumeric = ["standardCost", "sellingPrice", "gstPercent"].some((f) =>
    label.toLowerCase().includes(f.replace(/([A-Z])/g, " $1").trim().toLowerCase().split(" ")[0])
  ) || label.includes("Cost") || label.includes("Price") || label.includes("GST");

  // Simplified numeric detection
  const numeric = label.includes("Cost") || label.includes("Price") || label.includes("GST");

  return (
    <div>
      <label className="block text-[11px] font-medium text-[var(--text-muted)] mb-1">{label}</label>
      <input type={numeric ? "number" : "text"} step="0.01" value={value ?? ""}
        onChange={(e) => onChange(numeric ? (e.target.value === "" ? null : Number(e.target.value)) : e.target.value)}
        className="w-full h-9 rounded-lg border border-[var(--border-default)] bg-[var(--bg-input)] px-3 text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]" />
    </div>
  );
}