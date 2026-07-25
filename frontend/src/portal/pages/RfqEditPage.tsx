import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { customerApi, type RfqDetail } from "../../api/customerApi";
import { rfqProductTypes } from "../../api/publicApi";
import { config } from "../../config";
import { tokenStorage } from "../../auth/tokenStorage";
import { EmptyState, Loading } from "../../components/ui";
import { ArrowLeft, Loader2, AlertCircle, ChevronRight, Upload, FileText, X, GripVertical, Send } from "lucide-react";

const allowedExtensions = ["pdf", "dwg", "dxf", "step", "stp", "iges", "igs", "jpg", "jpeg", "png", "zip"];
const maxFileMb = 10;
const maxFiles = 10;

const industries = ["Automobile", "Agriculture", "Pump", "Motor", "Railway", "Power", "General Engineering", "Other"];
const deliveryTermOptions = ["Ex Works", "FOB", "Door Delivery", "Customer Pickup"];
const additionalOptions = ["Heat Treatment", "Shot Blasting", "Painting", "Machining", "NDT Inspection", "Special Packaging", "Other"];

/* ── FileCard component ─────────────────────────────────────── */

function FileCard({ fileName, sizeBytes, dragIdx, totalCount, dragFileIndex, onDragStart, onDragOver, onDrop, onDragEnd, onDelete, src, localUrl, isServerFile }: {
  fileName: string; sizeBytes: number; dragIdx: number; totalCount: number;
  dragFileIndex: number | null;
  onDragStart: () => void; onDragOver: (e: React.DragEvent) => void; onDrop: (e: React.DragEvent) => void; onDragEnd: () => void;
  onDelete: () => void; src?: string; localUrl?: string | null; isServerFile: boolean;
}) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  const isImage = ["jpg", "jpeg", "png"].includes(ext);

  useEffect(() => {
    if (!isImage || !isServerFile || !src) return;
    let cancelled = false;
    const token = tokenStorage.getAccessToken();
    fetch(src, { headers: token ? { Authorization: `Bearer ${token}` } : {}, credentials: "include" })
      .then((r) => { if (!r.ok) throw new Error(); return r.blob(); })
      .then((blob) => { if (!cancelled) setBlobUrl(URL.createObjectURL(blob)); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [src, isImage, isServerFile]);

  const previewUrl = isServerFile ? blobUrl : localUrl;
  const isDragged = dragFileIndex === dragIdx;

  return (
    <div draggable
      onDragStart={onDragStart} onDragOver={onDragOver} onDrop={onDrop} onDragEnd={onDragEnd}
      className={`relative group rounded-xl border overflow-hidden cursor-grab active:cursor-grabbing transition-all ${isDragged ? "border-[var(--color-primary)] opacity-60 ring-2 ring-[var(--color-primary)]/30" : "border-[var(--border-default)] bg-[var(--bg-surface)] hover:shadow-md"}`}>
      <div className="aspect-square bg-[var(--bg-card)] flex items-center justify-center overflow-hidden">
        {previewUrl ? <img src={previewUrl} alt={fileName} className="w-full h-full object-cover" />
          : <div className="flex flex-col items-center gap-1 text-[var(--text-muted)]"><FileText size={28} /><span className="text-[10px] font-medium uppercase">.{ext}</span></div>}
      </div>
      <div className="px-2.5 py-2">
        <p className="text-[11px] font-medium text-[var(--text-primary)] break-words m-0">{fileName}</p>
        <p className="text-[10px] text-[var(--text-muted)] m-0">{(sizeBytes / 1024).toFixed(0)} KB</p>
      </div>
      {isDragged && <div className="absolute inset-0 flex items-center justify-center bg-[var(--color-primary)]/10"><span className="text-[11px] font-semibold text-[var(--color-primary)]">Drop here</span></div>}
      <button type="button" onClick={(e) => { e.stopPropagation(); onDelete(); }}
        className="absolute top-1.5 right-1.5 flex items-center justify-center w-6 h-6 rounded-md bg-red-500/80 text-white hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity" title="Delete"><X size={12} /></button>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] overflow-hidden">
      <div className="px-5 py-3.5 border-b border-[var(--border-default)]">
        <h3 className="text-[13px] font-semibold text-[var(--text-primary)] m-0">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function Field({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[12px] font-medium text-[var(--text-primary)] flex items-center gap-1">
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {hint && <p className="text-[11px] text-[var(--text-muted)] m-0">{hint}</p>}
    </div>
  );
}

export default function RfqEditPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const [rfq, setRfq] = useState<RfqDetail | null>(null);
  const [missing, setMissing] = useState(false);
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");

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
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragFileIndex, setDragFileIndex] = useState<number | null>(null);
  const dragIdxRef = useRef<number | null>(null);
  const [fileOrder, setFileOrder] = useState<string[]>([]);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitBusy, setSubmitBusy] = useState(false);
  useEffect(() => { if (rfq) setFileOrder(rfq.files.map((f) => f.id)); }, [rfq]);

  function handleFiles(list: FileList | null) {
    setFileError(null);
    if (!list || list.length === 0) return;
    const valid: File[] = [];
    for (const f of Array.from(list)) {
      const ext = f.name.split(".").pop()?.toLowerCase() ?? "";
      if (!allowedExtensions.includes(ext)) { setFileError(`"${f.name}": .${ext} not accepted`); continue; }
      if (f.size > maxFileMb * 1024 * 1024) { setFileError(`"${f.name}": exceeds ${maxFileMb} MB`); continue; }
      valid.push(f);
    }
    const total = newFiles.length + valid.length;
    if (total > maxFiles) { setFileError(`Max ${maxFiles} files`); return; }
    setNewFiles((prev) => [...prev, ...valid]);
  }
  function removeNewFile(i: number) { setNewFiles((prev) => prev.filter((_, idx) => idx !== i)); }
  function handleDrop(e: React.DragEvent) { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }

  useEffect(() => {
    customerApi.rfq(id).then((data) => {
      setRfq(data);
      setProductType(data.productType);
      setPartName(data.partName ?? "");
      setPartNumber(data.partNumber ?? "");
      setApplication(data.application ?? "");
      setIndustry(data.industry ?? "");
      setMaterialGrade(data.materialGrade ?? "");
      setMaterialStandard(data.materialStandard ?? "");
      setApproxWeight(data.approxWeight != null ? String(data.approxWeight) : "");
      setMachiningRequired(data.machiningRequired ?? "Casting Only");
      setPatternAvailability(data.patternAvailability ?? "");
      setPrototypeQty(data.prototypeQuantity ?? "");
      setProductionQty(data.productionQuantity ?? data.quantity);
      setAnnualReq(data.annualRequirement ?? "");
      setDeliveryLocation(data.deliveryLocation ?? "");
      setDeliveryDate(data.expectedDeliveryDate ? data.expectedDeliveryDate.slice(0, 10) : "");
      setDeliveryTerms(data.preferredDeliveryTerms ?? "");
      setAdditionalReqs(data.additionalRequirements ? data.additionalRequirements.split(", ").filter(Boolean) : []);
      setRemarks(data.remarks ?? "");
    }).catch(() => setMissing(true));
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setStatus("saving");
    try {
      await customerApi.updateRfq(id, {
        productType,
        materialGrade: materialGrade || undefined,
        quantity: productionQty,
        deliveryLocation: deliveryLocation || undefined,
        requirementDetails: application,
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
        expectedDeliveryDate: deliveryDate ? new Date(deliveryDate).toISOString() : undefined,
        preferredDeliveryTerms: deliveryTerms || undefined,
        additionalRequirements: additionalReqs.length > 0 ? additionalReqs.join(", ") : undefined,
        remarks: remarks || undefined,
      });
      for (let i = 0; i < newFiles.length; i++) {
        await customerApi.uploadRfqFile(id, newFiles[i]).catch(() => {});
      }
      navigate(`/customer/rfqs/${id}`);
    } catch {
      setStatus("error");
    }
  }

  function toggleAdditional(req: string) {
    setAdditionalReqs((prev) => prev.includes(req) ? prev.filter((r) => r !== req) : [...prev, req]);
  }

  async function handleSubmitDraft() {
    setSubmitBusy(true);
    try { await customerApi.submitRfq(id); navigate(`/customer/rfqs/${id}`); }
    catch { setSubmitBusy(false); setShowSubmitModal(false); }
  }

  if (missing) return <EmptyState title="RFQ not found" />;
  if (!rfq) return <Loading label="Loading RFQ" />;
  if (!rfq.isDraft || rfq.status !== "Draft") {
    return <EmptyState title="Cannot edit" text="This RFQ has already been submitted and cannot be edited." />;
  }

  const busy = status === "saving";

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => navigate(`/customer/rfqs/${id}`)}
            className="flex items-center justify-center w-8 h-8 rounded-lg border border-[var(--border-default)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-all">
            <ArrowLeft size={15} />
          </button>
          <div>
            <div className="flex items-center gap-2 text-[12px] text-[var(--text-muted)] mb-0.5">
              <span>Home</span><ChevronRight size={12} /><span>RFQ</span><ChevronRight size={12} />
              <span className="text-[var(--text-primary)] font-medium">Edit Draft</span>
            </div>
            <h1 className="text-xl font-bold text-[var(--text-primary)]">Edit Draft RFQ</h1>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button type="submit" form="edit-form" disabled={busy}
            className="inline-flex items-center gap-1.5 px-4 h-9 rounded-lg bg-[var(--color-primary)] text-white text-[12px] font-semibold hover:bg-[var(--color-primary-hover)] disabled:opacity-50">
            {busy ? <Loader2 size={14} className="animate-spin" /> : null}
            Save Changes
          </button>
          <button type="button" onClick={() => setShowSubmitModal(true)}
            className="inline-flex items-center gap-1.5 px-4 h-9 rounded-lg border border-emerald-500 text-emerald-600 text-[12px] font-semibold hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-all">
            Submit Draft
          </button>
        </div>
      </div>

      {status === "error" && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 text-[13px] font-medium">
          <AlertCircle size={14} /> Could not save changes. Please try again.
        </div>
      )}

      <form id="edit-form" onSubmit={handleSubmit} className="space-y-5">
        {/* Section 1: Basic Information */}
        <Section title="1. Basic Information">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Field label="Requirement Type" required>
              <select value={productType} onChange={(e) => setProductType(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-[13px] text-[var(--text-primary)] outline-none focus:border-[var(--color-primary)]">
                <option value="">Select requirement type</option>
                {rfqProductTypes.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="Part Name" required>
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
            <Field label="Application / End Use" required>
              <textarea value={application} onChange={(e) => setApplication(e.target.value)} rows={3}
                className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-3.5 py-2.5 text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--color-primary)] resize-none" />
            </Field>
          </div>
        </Section>

        {/* Section 2: Material Details */}
        <Section title="2. Material Details">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Field label="Material Grade" hint="Optional">
              <input type="text" value={materialGrade} onChange={(e) => setMaterialGrade(e.target.value)} placeholder="e.g. EN-GJL-250"
                className="w-full h-10 px-3 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--color-primary)]" />
            </Field>
            <Field label="Material Standard" hint="Optional">
              <input type="text" value={materialStandard} onChange={(e) => setMaterialStandard(e.target.value)} placeholder="e.g. ASTM A536"
                className="w-full h-10 px-3 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--color-primary)]" />
            </Field>
            <Field label="Approx Weight per Piece" hint="Optional">
              <div className="flex gap-2">
                <input type="number" value={approxWeight} onChange={(e) => setApproxWeight(e.target.value)} placeholder="0.00" min="0" step="0.01"
                  className="flex-1 h-10 px-3 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-[13px] text-[var(--text-primary)] outline-none focus:border-[var(--color-primary)]" />
                <span className="flex items-center px-3 text-[12px] text-[var(--text-muted)] bg-[var(--bg-surface-hover)] rounded-lg border border-[var(--border-default)]">kg</span>
              </div>
            </Field>
            <Field label="Machining Required">
              <div className="flex gap-3 h-10 items-center">
                {["Casting Only", "Casting + Machining"].map((opt) => (
                  <label key={opt} className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="machining" checked={machiningRequired === opt} onChange={() => setMachiningRequired(opt)} className="accent-[var(--color-primary)]" />
                    <span className="text-[12px] text-[var(--text-primary)]">{opt}</span>
                  </label>
                ))}
              </div>
            </Field>
            <Field label="Pattern Availability">
              <div className="flex flex-wrap gap-3 h-10 items-center">
                {["Pattern Available", "Need New Pattern", "Not Sure"].map((opt) => (
                  <label key={opt} className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="pattern" checked={patternAvailability === opt} onChange={() => setPatternAvailability(opt)} className="accent-[var(--color-primary)]" />
                    <span className="text-[12px] text-[var(--text-primary)]">{opt}</span>
                  </label>
                ))}
              </div>
            </Field>
          </div>
        </Section>

        {/* Section 3: Quantity */}
        <Section title="3. Quantity">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <Field label="Prototype Quantity" hint="Optional">
              <input type="text" value={prototypeQty} onChange={(e) => setPrototypeQty(e.target.value)} placeholder="e.g. 5"
                className="w-full h-10 px-3 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-[13px] text-[var(--text-primary)] outline-none focus:border-[var(--color-primary)]" />
            </Field>
            <Field label="Production Quantity" required>
              <input type="text" value={productionQty} onChange={(e) => setProductionQty(e.target.value)} placeholder="e.g. 1000"
                className="w-full h-10 px-3 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-[13px] text-[var(--text-primary)] outline-none focus:border-[var(--color-primary)]" />
            </Field>
            <Field label="Annual Requirement" hint="Optional">
              <input type="text" value={annualReq} onChange={(e) => setAnnualReq(e.target.value)} placeholder="e.g. 5000/year"
                className="w-full h-10 px-3 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-[13px] text-[var(--text-primary)] outline-none focus:border-[var(--color-primary)]" />
            </Field>
          </div>
        </Section>

        {/* Section 4: Delivery Details */}
        <Section title="4. Delivery Details">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Field label="Delivery Location" hint="Optional">
              <input type="text" value={deliveryLocation} onChange={(e) => setDeliveryLocation(e.target.value)} placeholder="City, State"
                className="w-full h-10 px-3 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-[13px] text-[var(--text-primary)] outline-none focus:border-[var(--color-primary)]" />
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

        {/* Section 5: Attachments */}
        <Section title="5. Attachments">
          <p className="text-[11px] text-[var(--text-muted)] mb-3 flex items-center gap-1.5">
            <GripVertical size={12} /> Drag files to reorder
          </p>

          {/* Combined file grid (existing + new) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3" onDragOver={(e) => e.preventDefault()}>
            {fileOrder.map((fid, fileIdx) => {
              const f = rfq.files.find((x) => x.id === fid);
              if (!f) return null;
              return (
                <FileCard key={f.id} fileName={f.fileName} sizeBytes={f.sizeBytes}
                  dragIdx={fileIdx} totalCount={fileOrder.length + newFiles.length}
                  dragFileIndex={dragFileIndex}
                  onDragStart={() => { setDragFileIndex(fileIdx); dragIdxRef.current = fileIdx; }}
                  onDragOver={(e) => { e.preventDefault(); }}
                  onDrop={(e) => { const from = dragIdxRef.current; e.preventDefault(); if (from === null || from === fileIdx) return; setFileOrder((prev) => { const a = [...prev]; const [r] = a.splice(from, 1); a.splice(fileIdx, 0, r); return a; }); setDragFileIndex(null); dragIdxRef.current = null; }}
                  onDragEnd={() => { setDragFileIndex(null); dragIdxRef.current = null; }}
                  onDelete={() => {
                    setFileOrder((prev) => prev.filter((x) => x !== f.id));
                    fetch(`${config.apiBaseUrl}/api/v1/customer/rfqs/${id}/files/${f.id}`, { method: "DELETE", headers: { Authorization: `Bearer ${tokenStorage.getAccessToken()}` }, credentials: "include" }).catch(() => {});
                  }}
                  src={`${config.apiBaseUrl}/api/v1/customer/rfqs/${id}/files/${f.id}`} isServerFile />
              );
            })}
            {newFiles.map((f, i) => {
              const idx = fileOrder.length + i;
              const url = ["jpg", "jpeg", "png"].includes(f.name.split(".").pop()?.toLowerCase() ?? "") ? URL.createObjectURL(f) : null;
              return (
                <FileCard key={`new-${i}`} fileName={f.name} sizeBytes={f.size}
                  dragIdx={idx} totalCount={fileOrder.length + newFiles.length}
                  dragFileIndex={dragFileIndex}
                  onDragStart={() => { setDragFileIndex(idx); dragIdxRef.current = idx; }}
                  onDragOver={(e) => { e.preventDefault(); }}
                  onDrop={(e) => { const from = dragIdxRef.current; e.preventDefault(); if (from === null || from === idx) return; setNewFiles((prev) => { const a = [...prev]; const srcIdx = from - fileOrder.length; const dstIdx = idx - fileOrder.length; if (srcIdx < 0 || dstIdx < 0) return a; const [r] = a.splice(srcIdx, 1); a.splice(dstIdx, 0, r); return a; }); setDragFileIndex(null); dragIdxRef.current = null; }}
                  onDragEnd={() => { setDragFileIndex(null); dragIdxRef.current = null; }}
                  onDelete={() => removeNewFile(i)}
                  localUrl={url}
                  isServerFile={false}
                />
              );
            })}
          </div>

          {/* Upload new files */}
          <div className="mt-4" onDragOver={(e) => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`flex flex-col items-center justify-center py-8 px-6 rounded-xl border-2 border-dashed cursor-pointer transition-all ${
              dragOver ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5" : "border-[var(--border-default)] hover:border-[var(--color-primary)]/50"
            }`}>
            <Upload size={24} className="text-[var(--text-muted)] mb-2" />
            <p className="text-[12px] font-medium text-[var(--text-primary)] m-0">Drop files here or click to browse</p>
            <p className="text-[10px] text-[var(--text-muted)] mt-0.5">Max {maxFiles} files · {maxFileMb} MB each</p>
            <input ref={fileInputRef} type="file" multiple className="hidden" accept={allowedExtensions.map((e) => `.${e}`).join(",")}
              onChange={(e) => handleFiles(e.target.files)} />
          </div>
          {fileError && <p className="mt-2 text-[11px] text-red-500">{fileError}</p>}
        </Section>

        {/* Section 6: Additional Requirements */}
        <Section title="6. Additional Requirements">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {additionalOptions.map((opt) => (
              <label key={opt} className="flex items-center gap-2.5 p-3 rounded-lg border border-[var(--border-default)] hover:border-[var(--color-primary)]/50 cursor-pointer transition-all">
                <input type="checkbox" checked={additionalReqs.includes(opt)} onChange={() => toggleAdditional(opt)} className="accent-[var(--color-primary)]" />
                <span className="text-[12px] text-[var(--text-primary)]">{opt}</span>
              </label>
            ))}
          </div>
        </Section>

        {/* Section 7: Remarks */}
        <Section title="7. Remarks">
          <textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} rows={3} placeholder="Additional information..."
            className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-3.5 py-2.5 text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--color-primary)] resize-none" />
        </Section>
      </form>

      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-md" onClick={() => !submitBusy && setShowSubmitModal(false)} />
          <div className="relative w-full max-w-sm mx-4 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-card)] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Top accent bar */}
            <div className="h-1.5 bg-gradient-to-r from-emerald-500 to-emerald-400" />
            <div className="p-6">
              {/* Icon + Title */}
              <div className="flex items-center gap-4 mb-5">
                <span className="flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 shrink-0">
                  <Send size={22} />
                </span>
                <div>
                  <h3 className="text-[16px] font-bold text-[var(--text-primary)] m-0">Submit Draft RFQ</h3>
                  <p className="text-[12px] text-[var(--text-muted)] m-0 mt-0.5">This action cannot be undone</p>
                </div>
              </div>

              {/* Message */}
              <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed m-0 mb-6">
                Once submitted, this RFQ will be sent to our engineering team for review and quotation. You will not be able to edit it further.
              </p>

              {/* Divider */}
              <div className="border-t border-[var(--border-default)] mb-4" />

              {/* Buttons */}
              <div className="flex items-center justify-end gap-2.5">
                <button type="button" disabled={submitBusy} onClick={() => setShowSubmitModal(false)}
                  className="px-4 h-9 rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] text-[12px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-all disabled:opacity-50">
                  Cancel
                </button>
                <button type="button" disabled={submitBusy} onClick={handleSubmitDraft}
                  className="px-5 h-9 rounded-xl bg-emerald-500 text-white text-[12px] font-semibold hover:bg-emerald-600 disabled:opacity-50 transition-all flex items-center gap-1.5 shadow-sm">
                  {submitBusy ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  {submitBusy ? "Submitting..." : "Yes, Submit"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
