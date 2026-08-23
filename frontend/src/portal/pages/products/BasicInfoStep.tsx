import { Sun, Moon } from "lucide-react";

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
            { id: "Ductile Iron Casting", name: "Ductile Iron Casting" },
          ]} placeholder="Select type" />
      </div>

      <div>
        <Field label="Application / Industrial Use" value={data.application ?? ""} onChange={(v) => onChange("application", v)} placeholder="e.g. Industrial garment machinery, Tractor axle support" />
      </div>

      {/* Dual Theme Visual Renders */}
      <div className="rounded-xl border border-[var(--border-default)] p-3.5 bg-neutral-50/50 dark:bg-white/[0.02] space-y-3">
        <span className="text-[12px] font-bold text-[var(--text-primary)] block">
          3D Studio Component Images (Dual Theme)
        </span>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <div className="flex items-center gap-1.5 mb-1 text-[11px] font-semibold text-neutral-600 dark:text-neutral-300">
              <Moon size={13} className="text-blue-500" />
              <span>Dark Mode Image URL</span>
            </div>
            <input
              type="text"
              value={data.imageUrl ?? ""}
              onChange={(e) => onChange("imageUrl", e.target.value)}
              placeholder="e.g. /images/.../part.png"
              className="w-full h-9 rounded-lg border border-[var(--border-default)] bg-[var(--bg-input)] px-3 text-[12px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--color-primary)]"
            />
          </div>

          <div>
            <div className="flex items-center gap-1.5 mb-1 text-[11px] font-semibold text-neutral-600 dark:text-neutral-300">
              <Sun size={13} className="text-amber-500" />
              <span>Light Mode Image URL</span>
            </div>
            <input
              type="text"
              value={data.lightImageUrl ?? ""}
              onChange={(e) => onChange("lightImageUrl", e.target.value)}
              placeholder="e.g. /images/.../part light mode.png"
              className="w-full h-9 rounded-lg border border-[var(--border-default)] bg-[var(--bg-input)] px-3 text-[12px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--color-primary)]"
            />
          </div>
        </div>

        {(data.imageUrl || data.lightImageUrl) && (
          <div className="grid grid-cols-2 gap-3 pt-2">
            {data.imageUrl && (
              <div className="rounded-lg p-2 bg-[#090b10] border border-white/10 text-center">
                <span className="text-[10px] text-neutral-400 font-mono block mb-1">Dark Mode Preview</span>
                <img src={data.imageUrl} alt="Dark Preview" className="h-16 mx-auto object-contain" />
              </div>
            )}
            {data.lightImageUrl && (
              <div className="rounded-lg p-2 bg-neutral-100 border border-neutral-200 text-center">
                <span className="text-[10px] text-neutral-600 font-mono block mb-1">Light Mode Preview</span>
                <img src={data.lightImageUrl} alt="Light Preview" className="h-16 mx-auto object-contain" />
              </div>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Unit" value={data.unit ?? ""} onChange={(v) => onChange("unit", v)} placeholder="e.g. Nos, Pcs, Kg, Set" />
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