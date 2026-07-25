import { useState, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { customerApi } from "../../api/customerApi";
import { rfqProductTypes } from "../../api/publicApi";
import { Upload, FileText, X, ChevronRight, Loader2, AlertCircle, GripVertical } from "lucide-react";

/* ── Constants ──────────────────────────────────────────────── */

const allowedExtensions = ["pdf", "dwg", "dxf", "step", "stp", "iges", "igs", "jpg", "jpeg", "png", "zip"];
const maxFileMb = 10;
const maxFiles = 10;

const industries = ["Automobile", "Agriculture", "Pump", "Motor", "Railway", "Power", "General Engineering", "Other"];
const deliveryTermOptions = ["Ex Works", "FOB", "Door Delivery", "Customer Pickup"];
const additionalOptions = ["Heat Treatment", "Shot Blasting", "Painting", "Machining", "NDT Inspection", "Special Packaging", "Other"];

/* ── Section wrapper ────────────────────────────────────────── */

function Section({ number, title, children }: { number: number; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] overflow-hidden">
      <div className="px-5 py-3.5 border-b border-[var(--border-default)] flex items-center gap-3">
        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[var(--color-primary)]/10 text-[11px] font-bold text-[var(--color-primary)] shrink-0">
          {number}
        </span>
        <h3 className="text-[13px] font-semibold text-[var(--text-primary)] m-0">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

/* ── Field wrapper ──────────────────────────────────────────── */

function Field({ label, required, error, hint, children }: { label: string; required?: boolean; error?: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[12px] font-medium text-[var(--text-primary)] flex items-center gap-1">
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {error && <p className="text-[11px] text-red-500 m-0">{error}</p>}
      {hint && <p className="text-[11px] text-[var(--text-muted)] m-0">{hint}</p>}
    </div>
  );
}

/* ── Main Page ──────────────────────────────────────────────── */

export default function RfqNewPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [files, setFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "submitting" | "uploading" | "error">("idle");
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [dragFileIndex, setDragFileIndex] = useState<number | null>(null);

  // ── Form fields ────────────────────────────────────────────
  const [productType, setProductType] = useState("");
  const [partName, setPartName] = useState("");
  const [partNumber, setPartNumber] = useState("");
  const [application, setApplication] = useState("");
  const [industry, setIndustry] = useState("");
  const [materialGrade, setMaterialGrade] = useState("");
  const [materialStandard, setMaterialStandard] = useState("");
  const [approxWeight, setApproxWeight] = useState("");
  const [machiningRequired, setMachiningRequired] = useState("Casting Only");
  const [patternAvailability, setPatternAvailability] = useState("");
  const [prototypeQty, setPrototypeQty] = useState("");
  const [productionQty, setProductionQty] = useState("");
  const [annualReq, setAnnualReq] = useState("");
  const [deliveryLocation, setDeliveryLocation] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [deliveryTerms, setDeliveryTerms] = useState("");
  const [additionalReqs, setAdditionalReqs] = useState<string[]>([]);
  const [remarks, setRemarks] = useState("");

  // ── File handlers ──────────────────────────────────────────
  function handleFiles(list: FileList | null) {
    setFileError(null);
    if (!list || list.length === 0) return;
    const next: File[] = [];
    for (const file of Array.from(list)) {
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
      if (!allowedExtensions.includes(ext)) { setFileError(`"${file.name}": .${ext} not accepted`); continue; }
      if (file.size > maxFileMb * 1024 * 1024) { setFileError(`"${file.name}": exceeds ${maxFileMb} MB`); continue; }
      next.push(file);
    }
    const total = files.length + next.length;
    if (total > maxFiles) { setFileError(`Max ${maxFiles} files`); return; }
    setFiles((prev) => [...prev, ...next]);
  }
  function removeFile(index: number) { setFiles((prev) => prev.filter((_, i) => i !== index)); }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  }

  // ── Additional requirements toggle ─────────────────────────
  function toggleAdditional(req: string) {
    setAdditionalReqs((prev) => prev.includes(req) ? prev.filter((r) => r !== req) : [...prev, req]);
  }

  // ── Submit ─────────────────────────────────────────────────
  async function submit(saveAsDraft: boolean) {
    const nextErrors: Record<string, string> = {};
    if (!productType) nextErrors.productType = "Select a requirement type.";
    if (!partName) nextErrors.partName = "Enter the part name.";
    if (!productionQty) nextErrors.productionQty = "Enter the production quantity.";
    if (!application || application.length < 5) nextErrors.application = "Describe the application (5+ characters).";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setStatus("submitting");
    try {
      const { id } = await customerApi.createRfq({
        productType,
        materialGrade: materialGrade || undefined,
        quantity: productionQty,
        deliveryLocation: deliveryLocation || undefined,
        requirementDetails: application,
        saveAsDraft,
        partName: partName || undefined,
        partNumber: partNumber || undefined,
        industry: industry || undefined,
        application: application || undefined,
        materialStandard: materialStandard || undefined,
        approxWeight: approxWeight ? Number(approxWeight) : undefined,
        machiningRequired: machiningRequired || undefined,
        patternAvailability: patternAvailability || undefined,
        prototypeQuantity: prototypeQty || undefined,
        productionQuantity: productionQty || undefined,
        annualRequirement: annualReq || undefined,
        expectedDeliveryDate: deliveryDate ? new Date(deliveryDate).toISOString() as any : undefined,
        preferredDeliveryTerms: deliveryTerms || undefined,
        additionalRequirements: additionalReqs.length > 0 ? additionalReqs.join(", ") : undefined,
        remarks: remarks || undefined,
      });

      if (files.length > 0) {
        setStatus("uploading");
        for (let i = 0; i < files.length; i++) {
          setUploadProgress(`Uploading ${i + 1} of ${files.length}: ${files[i].name}`);
          await customerApi.uploadRfqFile(id, files[i]);
        }
      }

      navigate(`/customer/rfqs/${id}`);
    } catch {
      setStatus("error");
    }
  }

  const busy = status === "submitting" || status === "uploading";
  const qtyDisplay = productionQty || prototypeQty ? `${productionQty || "—"} pcs` : "—";

  return (
    <div className="space-y-6 pb-8">

      {/* ── Header ──────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-[12px] text-[var(--text-muted)] mb-1">
            <span>Home</span>
            <ChevronRight size={12} />
            <span>RFQ</span>
            <ChevronRight size={12} />
            <span className="text-[var(--text-primary)] font-medium">New RFQ</span>
          </div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">New RFQ</h1>
          <p className="text-[13px] text-[var(--text-muted)] mt-0.5">
            Provide details about your requirement. Our engineering team will review it and prepare the quotation.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-4">
          <button type="button" disabled={busy} onClick={() => void submit(true)}
            className="inline-flex items-center gap-1.5 px-4 h-9 rounded-lg border border-[var(--border-default)] text-[12px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all disabled:opacity-50">
            Save as Draft
          </button>
          <button type="button" disabled={busy} onClick={() => void submit(false)}
            className="inline-flex items-center gap-1.5 px-4 h-9 rounded-lg bg-[var(--color-primary)] text-white text-[12px] font-semibold hover:bg-[var(--color-primary-hover)] transition-all disabled:opacity-50">
            {busy ? <Loader2 size={14} className="animate-spin" /> : null}
            Submit RFQ
          </button>
        </div>
      </div>

      {/* ── Error banner ── */}
      {status === "error" && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 text-[13px] font-medium">
          <AlertCircle size={14} />
          Could not submit the RFQ. Please try again.
        </div>
      )}
      {uploadProgress && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 text-[13px] font-medium">
          <Loader2 size={14} className="animate-spin" />
          {uploadProgress}
        </div>
      )}

      {/* ── Two-column layout ───────────────────────────────── */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">

        {/* ══ LEFT COLUMN ══ */}
        <div className="flex-1 min-w-0 space-y-5">

          {/* SECTION 1: Basic Information */}
          <Section number={1} title="Basic Information">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Field label="Requirement Type" required error={errors.productType}>
                <select value={productType} onChange={(e) => setProductType(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-[13px] text-[var(--text-primary)] outline-none focus:border-[var(--color-primary)]">
                  <option value="">Select requirement type</option>
                  {rfqProductTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </Field>
              <Field label="Part Name" required error={errors.partName}>
                <input type="text" value={partName} onChange={(e) => setPartName(e.target.value)} placeholder="e.g. Motor Housing"
                  className="w-full h-10 px-3 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--color-primary)]" />
              </Field>
              <Field label="Part Number" hint="Optional">
                <input type="text" value={partNumber} onChange={(e) => setPartNumber(e.target.value)} placeholder="e.g. MH-1002"
                  className="w-full h-10 px-3 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--color-primary)]" />
              </Field>
              <Field label="Industry" hint="Optional">
                <select value={industry} onChange={(e) => setIndustry(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-[13px] text-[var(--text-primary)] outline-none focus:border-[var(--color-primary)]">
                  <option value="">Select industry</option>
                  {industries.map((i) => <option key={i} value={i}>{i}</option>)}
                </select>
              </Field>
            </div>
            <div className="mt-5">
              <Field label="Application / End Use" required error={errors.application}>
                <textarea value={application} onChange={(e) => setApplication(e.target.value)} rows={3} placeholder="Describe how the part will be used, its function, and operating conditions..."
                  className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-3.5 py-2.5 text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--color-primary)] resize-none" />
              </Field>
            </div>
          </Section>

          {/* SECTION 2: Material Details */}
          <Section number={2} title="Material Details">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Field label="Material Grade" hint="Optional">
                <input type="text" value={materialGrade} onChange={(e) => setMaterialGrade(e.target.value)} placeholder="e.g. EN-GJL-250"
                  className="w-full h-10 px-3 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--color-primary)]" />
              </Field>
              <Field label="Material Standard" hint="Optional">
                <input type="text" value={materialStandard} onChange={(e) => setMaterialStandard(e.target.value)} placeholder="e.g. ASTM A536, IS 210, EN 1561"
                  className="w-full h-10 px-3 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--color-primary)]" />
              </Field>
              <Field label="Approx Weight per Piece" hint="Optional">
                <div className="flex gap-2">
                  <input type="number" value={approxWeight} onChange={(e) => setApproxWeight(e.target.value)} placeholder="0.00" min="0" step="0.01"
                    className="flex-1 h-10 px-3 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--color-primary)]" />
                  <span className="flex items-center px-3 text-[12px] text-[var(--text-muted)] bg-[var(--bg-surface-hover)] rounded-lg border border-[var(--border-default)]">kg</span>
                </div>
              </Field>
              <Field label="Machining Required">
                <div className="flex gap-3 h-10 items-center">
                  {["Casting Only", "Casting + Machining"].map((opt) => (
                    <label key={opt} className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="machining" value={opt} checked={machiningRequired === opt} onChange={() => setMachiningRequired(opt)}
                        className="accent-[var(--color-primary)]" />
                      <span className="text-[12px] text-[var(--text-primary)]">{opt}</span>
                    </label>
                  ))}
                </div>
              </Field>
              <Field label="Pattern Availability">
                <div className="flex flex-wrap gap-3 h-10 items-center">
                  {["Pattern Available", "Need New Pattern", "Not Sure"].map((opt) => (
                    <label key={opt} className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="pattern" value={opt} checked={patternAvailability === opt} onChange={() => setPatternAvailability(opt)}
                        className="accent-[var(--color-primary)]" />
                      <span className="text-[12px] text-[var(--text-primary)]">{opt}</span>
                    </label>
                  ))}
                </div>
              </Field>
            </div>
          </Section>

          {/* SECTION 3: Quantity */}
          <Section number={3} title="Quantity">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <Field label="Prototype Quantity" hint="Optional">
                <input type="text" value={prototypeQty} onChange={(e) => setPrototypeQty(e.target.value)} placeholder="e.g. 5"
                  className="w-full h-10 px-3 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--color-primary)]" />
              </Field>
              <Field label="Production Quantity" required error={errors.productionQty}>
                <input type="text" value={productionQty} onChange={(e) => setProductionQty(e.target.value)} placeholder="e.g. 1000"
                  className="w-full h-10 px-3 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--color-primary)]" />
              </Field>
              <Field label="Annual Requirement" hint="Optional">
                <input type="text" value={annualReq} onChange={(e) => setAnnualReq(e.target.value)} placeholder="e.g. 5000/year"
                  className="w-full h-10 px-3 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--color-primary)]" />
              </Field>
            </div>
          </Section>

          {/* SECTION 4: Delivery Details */}
          <Section number={4} title="Delivery Details">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Field label="Delivery Location" hint="Optional">
                <input type="text" value={deliveryLocation} onChange={(e) => setDeliveryLocation(e.target.value)} placeholder="City, State"
                  className="w-full h-10 px-3 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--color-primary)]" />
              </Field>
              <Field label="Expected Delivery Date" hint="Optional">
                <input type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-[13px] text-[var(--text-primary)] outline-none focus:border-[var(--color-primary)]" />
              </Field>
              <Field label="Preferred Delivery Terms" hint="Optional">
                <select value={deliveryTerms} onChange={(e) => setDeliveryTerms(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-[13px] text-[var(--text-primary)] outline-none focus:border-[var(--color-primary)]">
                  <option value="">Select terms</option>
                  {deliveryTermOptions.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </Field>
            </div>
          </Section>

          {/* SECTION 5: Attachments */}
          <Section number={5} title="Attachments">
            <p className="text-[11px] text-[var(--text-muted)] mb-3 flex items-center gap-1.5">
              <GripVertical size={12} /> Drag files to reorder
            </p>
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`flex flex-col items-center justify-center py-10 px-6 rounded-xl border-2 border-dashed cursor-pointer transition-all ${
                dragOver ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5" : "border-[var(--border-default)] hover:border-[var(--color-primary)]/50 hover:bg-[var(--bg-surface-hover)]"
              }`}
            >
              <Upload size={28} className="text-[var(--text-muted)] mb-3" />
              <p className="text-[13px] font-medium text-[var(--text-primary)] m-0">Drop files here or click to browse</p>
              <p className="text-[11px] text-[var(--text-muted)] mt-1">
                PDF, DWG, DXF, STEP, IGES, STP, JPG, PNG, ZIP · up to {maxFileMb} MB each · max {maxFiles} files
              </p>
              <input ref={fileInputRef} type="file" multiple className="hidden" accept={allowedExtensions.map((e) => `.${e}`).join(",")}
                onChange={(e) => handleFiles(e.target.files)} />
            </div>

            {files.length > 0 && (
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {files.map((f, i) => {
                  const ext = f.name.split(".").pop()?.toLowerCase() ?? "";
                  const isImage = ["jpg", "jpeg", "png"].includes(ext);
                  const url = isImage ? URL.createObjectURL(f) : null;
                  return (
                    <div key={i} draggable
                      onDragStart={() => setDragFileIndex(i)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => { e.preventDefault(); if (dragFileIndex === null || dragFileIndex === i) return; setFiles((p) => { const a = [...p]; const [r] = a.splice(dragFileIndex, 1); a.splice(i, 0, r); return a; }); setDragFileIndex(null); }}
                      onDragEnd={() => setDragFileIndex(null)}
                      className={`relative group rounded-xl border overflow-hidden cursor-grab active:cursor-grabbing transition-all ${dragFileIndex === i ? "border-[var(--color-primary)] opacity-60 ring-2 ring-[var(--color-primary)]/30" : "border-[var(--border-default)] bg-[var(--bg-surface)] hover:shadow-md"}`}>
                      <div className="aspect-square bg-[var(--bg-card)] flex items-center justify-center overflow-hidden">
                        {url ? <img src={url} alt={f.name} className="w-full h-full object-cover" /> : <FileText size={28} className="text-[var(--text-muted)]" />}
                      </div>
                      <div className="px-2.5 py-2">
                        <p className="text-[11px] font-medium text-[var(--text-primary)] break-words m-0">{f.name}</p>
                        <p className="text-[10px] text-[var(--text-muted)] m-0">{(f.size / 1024).toFixed(0)} KB</p>
                      </div>
                      <button type="button" onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                        className="absolute top-1.5 right-1.5 flex items-center justify-center w-6 h-6 rounded-md bg-red-500/80 text-white hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity" title="Remove"><X size={12} /></button>
                    </div>
                  );
                })}
              </div>
            )}
            {fileError && <p className="mt-2 text-[11px] text-red-500">{fileError}</p>}
          </Section>

          {/* SECTION 6: Additional Requirements */}
          <Section number={6} title="Additional Requirements">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {additionalOptions.map((opt) => (
                <label key={opt} className="flex items-center gap-2.5 p-3 rounded-lg border border-[var(--border-default)] hover:border-[var(--color-primary)]/50 cursor-pointer transition-all">
                  <input type="checkbox" checked={additionalReqs.includes(opt)} onChange={() => toggleAdditional(opt)}
                    className="accent-[var(--color-primary)]" />
                  <span className="text-[12px] text-[var(--text-primary)]">{opt}</span>
                </label>
              ))}
            </div>
          </Section>

          {/* SECTION 7: Remarks */}
          <Section number={7} title="Remarks">
            <textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} rows={3} placeholder="Mention any additional information that will help us prepare a quotation."
              className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-3.5 py-2.5 text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--color-primary)] resize-none" />
          </Section>

        </div>

        {/* ══ RIGHT COLUMN — Sticky Summary ══ */}
        <div className="w-full lg:w-[300px] xl:w-[340px] shrink-0 lg:sticky lg:top-6 lg:self-start space-y-4">

          {/* RFQ Summary */}
          <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] overflow-hidden">
            <div className="px-5 py-3.5 border-b border-[var(--border-default)]">
              <h3 className="text-[13px] font-semibold text-[var(--text-primary)] m-0">RFQ Summary</h3>
            </div>
            <div className="p-5 space-y-2.5 text-[13px]">
              <div className="flex justify-between"><span className="text-[var(--text-muted)]">Requirement Type</span><span className="font-medium text-[var(--text-primary)] text-right">{productType || "—"}</span></div>
              <div className="flex justify-between"><span className="text-[var(--text-muted)]">Material Grade</span><span className="font-medium text-[var(--text-primary)] text-right">{materialGrade || "—"}</span></div>
              <div className="flex justify-between"><span className="text-[var(--text-muted)]">Quantity</span><span className="font-medium text-[var(--text-primary)] text-right">{qtyDisplay}</span></div>
              <div className="flex justify-between"><span className="text-[var(--text-muted)]">Delivery Location</span><span className="font-medium text-[var(--text-primary)] text-right">{deliveryLocation || "—"}</span></div>
              <div className="flex justify-between"><span className="text-[var(--text-muted)]">Expected Delivery</span><span className="font-medium text-[var(--text-primary)] text-right">{deliveryDate || "—"}</span></div>
              <div className="flex justify-between"><span className="text-[var(--text-muted)]">Attachments</span><span className="font-medium text-[var(--text-primary)] text-right">{files.length > 0 ? `${files.length} file(s)` : "—"}</span></div>
            </div>
          </div>

          {/* Info Card */}
          <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] p-5">
            <h4 className="text-[12px] font-semibold text-[var(--text-primary)] m-0 mb-2">Fill the required fields</h4>
            <p className="text-[12px] text-[var(--text-muted)] m-0 leading-relaxed">
              The more details you provide, the more accurate our quotation will be.
            </p>
          </div>

          {/* Tips Card */}
          <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] p-5">
            <h4 className="text-[12px] font-semibold text-[var(--text-primary)] m-0 mb-3">Tips for Better Quotation</h4>
            <ul className="space-y-1.5 m-0 p-0 list-none">
              {["Provide drawing", "Mention material grade", "Mention approximate weight", "Mention delivery expectations", "Mention annual requirement if known"].map((tip) => (
                <li key={tip} className="flex items-center gap-2 text-[12px] text-[var(--text-secondary)]">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                  {tip}
                </li>
              ))}
            </ul>
          </div>

          {/* Need Help Card */}
          <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] p-5">
            <h4 className="text-[12px] font-semibold text-[var(--text-primary)] m-0 mb-2">Need Help?</h4>
            <p className="text-[12px] text-[var(--text-muted)] m-0">iamrahulbhola@gmail.com</p>
            <p className="text-[12px] text-[var(--text-muted)] m-0">+91 8283041140</p>
          </div>

        </div>
      </div>
    </div>
  );
}
