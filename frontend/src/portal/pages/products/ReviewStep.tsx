interface ReviewStepProps {
  data: Record<string, any>;
  onChange?: (field: string, value: any) => void;
  categories?: { id: string; name: string }[];
}

function Row({ label, value }: { label: string; value: any }) {
  const display = value === null || value === undefined || value === "" ? "—" : String(value);
  return (
    <div className="flex justify-between py-1.5 border-b border-[var(--border-default)]/50 last:border-0">
      <span className="text-[12px] text-[var(--text-muted)]">{label}</span>
      <span className="text-[12px] font-medium text-[var(--text-primary)]">{display}</span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="text-[12px] font-semibold text-[var(--color-primary)] uppercase tracking-wider mb-2">{title}</h4>
      <div className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] p-3">
        {children}
      </div>
    </div>
  );
}

export default function ReviewStep({ data, onChange, categories = [] }: ReviewStepProps) {
  const categoryName = categories.find((c) => c.id === data.categoryId)?.name || data.categoryName || data.categoryId || "—";
  const hasImage = Boolean(data._productImageFile || data.imageUrl || data.lightImageUrl);

  return (
    <div className="space-y-5">
      <h3 className="text-sm font-semibold text-[var(--text-primary)]">Review Product Details</h3>
      <p className="text-[12px] text-[var(--text-muted)]">Review all the information before submitting.</p>

      {/* Publishing Status Toggle Card */}
      {onChange && (
        <div className="p-3.5 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
          <div>
            <div className="text-[12px] font-bold text-[var(--text-primary)]">Target Publishing Status</div>
            <div className="text-[11px] text-[var(--text-muted)]">
              {data.status === "Draft"
                ? "Draft: Hidden from customer catalog while specs/drawings are being prepared."
                : "Active: Published live in the public catalog and available for customer enquiries."}
            </div>
            {!hasImage && data.status === "Active" && (
              <div className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold mt-1">
                ⚠️ Primary image required before publishing as Active.
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onChange("status", "Draft")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                data.status === "Draft"
                  ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 font-bold"
                  : "bg-[var(--bg-card)] text-[var(--text-muted)] border-[var(--border-default)] hover:text-[var(--text-primary)]"
              }`}
            >
              Draft
            </button>
            <button
              type="button"
              onClick={() => onChange("status", "Active")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                data.status === "Active"
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-bold"
                  : "bg-[var(--bg-card)] text-[var(--text-muted)] border-[var(--border-default)] hover:text-[var(--text-primary)]"
              }`}
            >
              Active (Live)
            </button>
          </div>
        </div>
      )}

      <Section title="Basic Information">
        <Row label="Product Name" value={data.productName} />
        <Row label="Product Code" value={data.productCode} />
        <Row label="Category" value={categoryName} />
        <Row label="Casting Type" value={data.castingType} />
        <Row label="Application" value={data.application} />
        <Row label="Unit" value={data.unit} />
        <Row label="Status" value={data.status} />
      </Section>

      <Section title="Material">
        <Row label="Material" value={data.material} />
        <Row label="Grade" value={data.materialGrade} />
        <Row label="Weight" value={data.weight ? `${data.weight} kg` : null} />
        <Row label="Tolerance" value={data.tolerance} />
        <Row label="Density" value={data.density} />
        <Row label="Hardness" value={data.hardness} />
        <Row label="Heat Treatment" value={data.heatTreatment} />
        <Row label="Surface Finish" value={data.surfaceFinish} />
      </Section>

      <Section title="Dimensions">
        <Row label="Length" value={data.length ? `${data.length} mm` : null} />
        <Row label="Width" value={data.width ? `${data.width} mm` : null} />
        <Row label="Height" value={data.height ? `${data.height} mm` : null} />
        <Row label="Diameter" value={data.diameter ? `${data.diameter} mm` : null} />
        <Row label="Drawing Number" value={data.drawingNumber} />
        <Row label="Revision" value={data.revision} />
      </Section>

      <Section title="Manufacturing">
        <Row label="Pattern Number" value={data.patternNumber} />
        <Row label="Cycle Time" value={data.cycleTimeMinutes ? `${data.cycleTimeMinutes} min` : null} />
        <Row label="Core Required" value={data.coreRequired ? "Yes" : "No"} />
        <Row label="Machine Required" value={data.machineRequired ? "Yes" : "No"} />
        <Row label="Inspection Required" value={data.inspectionRequired ? "Yes" : "No"} />
        <Row label="Machining Required" value={data.machiningRequired ? "Yes" : "No"} />
      </Section>

      <Section title="Pricing">
        <Row label="Standard Cost" value={data.standardCost ? `₹ ${data.standardCost}` : null} />
        <Row label="Selling Price" value={data.sellingPrice ? `₹ ${data.sellingPrice}` : null} />
        <Row label="GST" value={data.gstPercent ? `${data.gstPercent}%` : null} />
        <Row label="HSN Code" value={data.hsnCode} />
        <Row label="Currency" value={data.currency} />
      </Section>

      <Section title="Media & Attachments">
        <Row
          label="Primary Product Image"
          value={data._productImageFile ? `Attached: ${data._productImageFile.name}` : data.imageUrl ? data.imageUrl : "Not specified"}
        />
        <Row
          label="Technical Drawings / PDFs"
          value={data._files?.length ? `${data._files.length} document(s) attached` : "None"}
        />
      </Section>
    </div>
  );
}