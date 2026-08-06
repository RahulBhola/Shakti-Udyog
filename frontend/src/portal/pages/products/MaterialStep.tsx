interface MaterialStepProps {
  data: Record<string, any>;
  onChange: (field: string, value: any) => void;
}

export default function MaterialStep({ data, onChange }: MaterialStepProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-[var(--text-primary)]">Material Specifications</h3>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Material *" value={data.material ?? ""} onChange={(v) => onChange("material", v)} placeholder="e.g. Grey Iron, Ductile Iron" />
        <Field label="Material Grade" value={data.materialGrade ?? ""} onChange={(v) => onChange("materialGrade", v)} placeholder="e.g. FG 260, SG 500/7" />
        <Field label="Weight (kg)" value={data.weight ?? ""} onChange={(v) => onChange("weight", v === "" ? null : Number(v))} placeholder="e.g. 45.5" type="number" />
        <Field label="Tolerance" value={data.tolerance ?? ""} onChange={(v) => onChange("tolerance", v)} placeholder="e.g. ±0.5 mm" />
        <Field label="Density" value={data.density ?? ""} onChange={(v) => onChange("density", v)} placeholder="e.g. 7.2 g/cm³" />
        <Field label="Hardness" value={data.hardness ?? ""} onChange={(v) => onChange("hardness", v)} placeholder="e.g. HB 180-220" />
        <Field label="Heat Treatment" value={data.heatTreatment ?? ""} onChange={(v) => onChange("heatTreatment", v)} placeholder="e.g. Annealing, Normalizing" />
        <Field label="Surface Finish" value={data.surfaceFinish ?? ""} onChange={(v) => onChange("surfaceFinish", v)} placeholder="e.g. Shot Blasted, Machined" />
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type }: { label: string; value: any; onChange: (v: any) => void; placeholder?: string; type?: string }) {
  return (
    <div>
      <label className="block text-[11px] font-medium text-[var(--text-muted)] mb-1">{label}</label>
      <input type={type ?? "text"} value={value ?? ""} onChange={(e) => onChange(type === "number" ? (e.target.value === "" ? null : Number(e.target.value)) : e.target.value)} placeholder={placeholder}
        className="w-full h-9 rounded-lg border border-[var(--border-default)] bg-[var(--bg-input)] px-3 text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]" />
    </div>
  );
}