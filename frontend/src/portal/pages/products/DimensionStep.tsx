interface DimensionStepProps {
  data: Record<string, any>;
  onChange: (field: string, value: any) => void;
}

export default function DimensionStep({ data, onChange }: DimensionStepProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-[var(--text-primary)]">Dimensions</h3>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Length (mm)" value={data.length} onChange={(v) => onChange("length", v)} />
        <Field label="Width (mm)" value={data.width} onChange={(v) => onChange("width", v)} />
        <Field label="Height (mm)" value={data.height} onChange={(v) => onChange("height", v)} />
        <Field label="Diameter (mm)" value={data.diameter} onChange={(v) => onChange("diameter", v)} />
        <Field label="Drawing Number" value={data.drawingNumber ?? ""} onChange={(v) => onChange("drawingNumber", v)} />
        <Field label="Revision" value={data.revision ?? ""} onChange={(v) => onChange("revision", v)} />
      </div>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: any; onChange: (v: any) => void }) {
  const isDim = ["length", "width", "height", "diameter"].some((f) => label.toLowerCase().includes(f));
  return (
    <div>
      <label className="block text-[11px] font-medium text-[var(--text-muted)] mb-1">{label}</label>
      <input type={isDim ? "number" : "text"} value={value ?? ""} onChange={(e) => onChange(isDim ? (e.target.value === "" ? null : Number(e.target.value)) : e.target.value)}
        className="w-full h-9 rounded-lg border border-[var(--border-default)] bg-[var(--bg-input)] px-3 text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]" />
    </div>
  );
}