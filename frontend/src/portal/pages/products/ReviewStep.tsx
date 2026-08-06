interface ReviewStepProps {
  data: Record<string, any>;
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

export default function ReviewStep({ data }: ReviewStepProps) {
  return (
    <div className="space-y-5">
      <h3 className="text-sm font-semibold text-[var(--text-primary)]">Review Product Details</h3>
      <p className="text-[12px] text-[var(--text-muted)]">Review all the information before submitting.</p>

      <Section title="Basic Information">
        <Row label="Product Name" value={data.productName} />
        <Row label="Product Code" value={data.productCode} />
        <Row label="Category" value={data.categoryId} />
        <Row label="Casting Type" value={data.castingType} />
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

      {(data._files?.length ?? 0) > 0 && (
        <Section title="Attachments">
          {data._files.map((f: any, i: number) => (
            <Row key={i} label={`File ${i + 1}`} value={f.name} />
          ))}
        </Section>
      )}
    </div>
  );
}