interface ManufacturingStepProps {
  data: Record<string, any>;
  onChange: (field: string, value: any) => void;
}

export default function ManufacturingStep({ data, onChange }: ManufacturingStepProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-[var(--text-primary)]">Manufacturing Details</h3>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Pattern Number" value={data.patternNumber ?? ""} onChange={(v) => onChange("patternNumber", v)} />
        <Field label="Cycle Time (min)" value={data.cycleTimeMinutes} onChange={(v) => onChange("cycleTimeMinutes", v)} type="number" />
      </div>
      <div className="space-y-3">
        <h4 className="text-[12px] font-medium text-[var(--text-secondary)]">Requirements</h4>
        <Checkbox label="Core Required" checked={data.coreRequired ?? false} onChange={(v) => onChange("coreRequired", v)} />
        <Checkbox label="Machine Required" checked={data.machineRequired ?? false} onChange={(v) => onChange("machineRequired", v)} />
        <Checkbox label="Inspection Required" checked={data.inspectionRequired ?? false} onChange={(v) => onChange("inspectionRequired", v)} />
        <Checkbox label="Machining Required" checked={data.machiningRequired ?? false} onChange={(v) => onChange("machiningRequired", v)} />
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type }: { label: string; value: any; onChange: (v: any) => void; type?: string }) {
  return (
    <div>
      <label className="block text-[11px] font-medium text-[var(--text-muted)] mb-1">{label}</label>
      <input type={type ?? "text"} value={value ?? ""} onChange={(e) => onChange(type === "number" ? (e.target.value === "" ? null : Number(e.target.value)) : e.target.value)}
        className="w-full h-9 rounded-lg border border-[var(--border-default)] bg-[var(--bg-input)] px-3 text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]" />
    </div>
  );
}

function Checkbox({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)}
        className="rounded border-[var(--border-input)] text-[var(--color-primary)] focus:ring-[var(--color-primary)]" />
      <span className="text-[13px] text-[var(--text-primary)]">{label}</span>
    </label>
  );
}