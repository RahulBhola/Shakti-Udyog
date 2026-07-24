interface BasicInfoStepProps {
  data: Record<string, any>;
  onChange: (field: string, value: any) => void;
  categories?: { id: string; name: string }[];
}

export default function BasicInfoStep({ data, onChange, categories }: BasicInfoStepProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-[var(--text-primary)]">Basic Information</h3>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Product Name *" value={data.productName ?? ""} onChange={(v) => onChange("productName", v)} placeholder="e.g. Grey Iron Housing" />
        <Field label="Product Code *" value={data.productCode ?? ""} onChange={(v) => onChange("productCode", v)} placeholder="e.g. PRD-001" />
      </div>
      <div>
        <label className="block text-[11px] font-medium text-[var(--text-muted)] mb-1">Description</label>
        <textarea
          value={data.description ?? ""}
          onChange={(e) => onChange("description", e.target.value)}
          placeholder="Brief description of the product..."
          rows={3}
          className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-input)] px-3 py-2 text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] resize-none"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <SelectField label="Category *" value={data.categoryId ?? ""} onChange={(v) => onChange("categoryId", v)} options={categories ?? []} placeholder="Select category" />
        <SelectField label="Casting Type" value={data.castingType ?? ""} onChange={(v) => onChange("castingType", v)}
          options={[
            { id: "Sand Casting", name: "Sand Casting" },
            { id: "Investment Casting", name: "Investment Casting" },
            { id: "Die Casting", name: "Die Casting" },
            { id: "Centrifugal Casting", name: "Centrifugal Casting" },
            { id: "Continuous Casting", name: "Continuous Casting" },
          ]} placeholder="Select type" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Unit" value={data.unit ?? ""} onChange={(v) => onChange("unit", v)} placeholder="e.g. Pcs, Kg, Set" />
        <SelectField label="Status" value={data.status ?? "Draft"} onChange={(v) => onChange("status", v)}
          options={[
            { id: "Draft", name: "Draft" },
            { id: "Active", name: "Active" },
          ]} />
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="block text-[11px] font-medium text-[var(--text-muted)] mb-1">{label}</label>
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full h-9 rounded-lg border border-[var(--border-default)] bg-[var(--bg-input)] px-3 text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]" />
    </div>
  );
}

function SelectField({ label, value, onChange, options, placeholder }: { label: string; value: string; onChange: (v: string) => void; options: { id: string; name: string }[]; placeholder?: string }) {
  return (
    <div>
      <label className="block text-[11px] font-medium text-[var(--text-muted)] mb-1">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full h-9 rounded-lg border border-[var(--border-default)] bg-[var(--bg-input)] px-3 text-[13px] text-[var(--text-primary)] outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]">
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
      </select>
    </div>
  );
}