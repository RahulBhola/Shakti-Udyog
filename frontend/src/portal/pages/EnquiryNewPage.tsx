import { useState, useRef, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { customerApi, type Profile, type CompanyDetail, type CompanyAddress } from "../../api/customerApi";
import { enquiryProductTypes } from "../../api/publicApi";
import { calculateProfileCompleteness } from "../components/ProfileCompletion";
import {
  Upload,
  FileText,
  X,
  Loader2,
  AlertCircle,
  GripVertical,
  ShieldAlert,
  ArrowRight,
  Lock,
  Building2,
  MapPin,
  Sparkles,
  Check,
  User,
  Phone,
  Info,
} from "lucide-react";
import { cn } from "../../lib/utils";

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

export default function EnquiryNewPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [files, setFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "submitting" | "uploading" | "error">("idle");
  const [customError, setCustomError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [dragFileIndex, setDragFileIndex] = useState<number | null>(null);

  // ── Profile & Company State ────────────────────────────────
  const [profile, setProfile] = useState<Profile | null>(null);
  const [company, setCompany] = useState<CompanyDetail | null>(null);
  const [savedAddresses, setSavedAddresses] = useState<CompanyAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("default");
  const [profileLoading, setProfileLoading] = useState(true);

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

  useEffect(() => {
    let mounted = true;
    async function loadCustomerProfile() {
      try {
        const [pRes, cRes, addrsRes] = await Promise.allSettled([
          customerApi.profile(),
          customerApi.companyDetail(),
          customerApi.addresses(),
        ]);
        if (!mounted) return;
        let prof: Profile | null = null;
        let comp: CompanyDetail | null = null;
        let addrs: CompanyAddress[] = [];

        if (pRes.status === "fulfilled" && pRes.value) {
          prof = pRes.value;
        }
        if (cRes.status === "fulfilled" && cRes.value) {
          comp = cRes.value;
          setCompany(comp);
        }
        if (addrsRes.status === "fulfilled" && Array.isArray(addrsRes.value)) {
          addrs = addrsRes.value;
          setSavedAddresses(addrs);
        }
        if (prof) {
          (prof as unknown as Record<string, unknown>).addresses = addrs;
          setProfile(prof);
        }

        // ── Auto-populate fields from Customer Profile & Company ──────
        // 1. Delivery Location
        const primaryAddr = addrs.find((a) => a.isPrimary) || addrs[0];
        let autoLoc = "";
        if (primaryAddr) {
          autoLoc = [primaryAddr.address, primaryAddr.city, primaryAddr.state, primaryAddr.pinCode].filter(Boolean).join(", ");
          setSelectedAddressId(primaryAddr.id);
        } else if (comp?.factoryAddress) {
          autoLoc = [comp.factoryAddress, comp.city, comp.state, comp.pinCode].filter(Boolean).join(", ");
        } else if (comp?.registeredAddress || comp?.city) {
          autoLoc = [comp.registeredAddress, comp.city, comp.state, comp.pinCode].filter(Boolean).join(", ");
        } else if (prof?.company?.deliveryAddresses || prof?.company?.addressLine1) {
          autoLoc = [prof.company.addressLine1, prof.company.city, prof.company.state, prof.company.postalCode].filter(Boolean).join(", ");
        }
        if (autoLoc) {
          setDeliveryLocation((prev) => prev || autoLoc);
        }

        // 2. Industry
        const rawIndustry = comp?.industry || "";
        if (rawIndustry) {
          const match = industries.find((i) => i.toLowerCase() === rawIndustry.toLowerCase());
          if (match) {
            setIndustry((prev) => prev || match);
          } else {
            setIndustry((prev) => prev || "Other");
          }
        }

        // 3. Preferred Delivery Terms
        setDeliveryTerms((prev) => prev || "Door Delivery");

        // 4. Default Expected Delivery Date (30 days from now)
        const d = new Date();
        d.setDate(d.getDate() + 30);
        const dateStr = d.toISOString().split("T")[0];
        setDeliveryDate((prev) => prev || dateStr);
      } catch (e) {
        console.error("Failed to fetch customer profile", e);
      } finally {
        if (mounted) setProfileLoading(false);
      }
    }
    void loadCustomerProfile();
    return () => { mounted = false; };
  }, []);

  const completeness = useMemo(() => calculateProfileCompleteness(profile), [profile]);
  const isProfileComplete = completeness.percentage === 100;

  function handleSelectSavedAddress(addr: CompanyAddress | "custom") {
    if (addr === "custom") {
      setSelectedAddressId("custom");
      return;
    }
    setSelectedAddressId(addr.id);
    const loc = [addr.address, addr.city, addr.state, addr.pinCode].filter(Boolean).join(", ");
    setDeliveryLocation(loc);
  }

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
    if (!isProfileComplete) {
      setCustomError("Profile Incomplete: Please complete 100% of your profile (Full Name, Phone Number, Company, and Address) before submitting an enquiry.");
      setStatus("error");
      return;
    }

    const nextErrors: Record<string, string> = {};
    if (!productType) nextErrors.productType = "Select a requirement type.";
    if (!partName) nextErrors.partName = "Enter the part name.";
    if (!productionQty) nextErrors.productionQty = "Enter the production quantity.";
    if (!application || application.length < 5) nextErrors.application = "Describe the application (5+ characters).";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setStatus("submitting");
    setCustomError(null);
    try {
      const { id } = await customerApi.createEnquiry({
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
        expectedDeliveryDate: deliveryDate ? new Date(deliveryDate).toISOString() as unknown as string : undefined,
        preferredDeliveryTerms: deliveryTerms || undefined,
        additionalRequirements: additionalReqs.length > 0 ? additionalReqs.join(", ") : undefined,
        remarks: remarks || undefined,
      });

      if (files.length > 0) {
        setStatus("uploading");
        for (let i = 0; i < files.length; i++) {
          setUploadProgress(`Uploading ${i + 1} of ${files.length}: ${files[i].name}`);
          await customerApi.uploadEnquiryFile(id, files[i]);
        }
      }

      navigate(`/customer/enquiries/${id}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Could not submit the Enquiry. Please try again.";
      setCustomError(msg);
      setStatus("error");
    }
  }

  const busy = status === "submitting" || status === "uploading";
  const qtyDisplay = productionQty || prototypeQty ? `${productionQty || "—"} pcs` : "—";

  return (
    <div className="space-y-6 pb-8">

      {/* ── Header ──────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">New Enquiry</h1>
          <p className="text-[13px] text-[var(--text-muted)] mt-0.5">
            Provide details about your requirement. Our engineering team will review it and prepare the quotation.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            disabled={busy || (!profileLoading && !isProfileComplete)}
            onClick={() => void submit(true)}
            title={!isProfileComplete ? "Complete your profile to save drafts" : undefined}
            className="inline-flex items-center gap-1.5 px-4 h-9 rounded-lg border border-[var(--border-default)] text-[12px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            {!isProfileComplete && <Lock size={12} className="text-amber-500" />}
            Save as Draft
          </button>
          <button
            type="button"
            disabled={busy || (!profileLoading && !isProfileComplete)}
            onClick={() => void submit(false)}
            title={!isProfileComplete ? "Complete your profile to submit enquiry" : undefined}
            className="inline-flex items-center gap-1.5 px-4 h-9 rounded-lg bg-[var(--color-primary)] text-white text-[12px] font-semibold hover:bg-[var(--color-primary-hover)] transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-xs cursor-pointer"
          >
            {busy ? <Loader2 size={14} className="animate-spin" /> : (!isProfileComplete ? <Lock size={13} /> : null)}
            Submit Enquiry
          </button>
        </div>
      </div>

      {/* ── Profile Completion Guard Banner ─────────────────── */}
      {!profileLoading && !isProfileComplete && (
        <div className="p-5 sm:p-6 rounded-2xl border-2 border-amber-500/30 dark:border-amber-500/40 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent shadow-sm">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5 pb-4 border-b border-amber-500/20">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30 shadow-xs">
                <ShieldAlert size={22} />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-white m-0">
                    Profile Completion Required to Submit Enquiries
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                    {completeness.percentage}% Complete
                  </span>
                </div>
                <p className="text-xs text-neutral-600 dark:text-neutral-300 mt-1 max-w-2xl leading-relaxed m-0">
                  To ensure accurate casting feasibility reviews, custom tooling estimates, and delivery logistics, all customer accounts must have a complete profile before submitting enquiries.
                </p>
              </div>
            </div>
            <Link
              to="/customer/profile"
              className="inline-flex items-center gap-2 px-4.5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md shadow-amber-500/20 no-underline cursor-pointer shrink-0 transition-all hover:scale-105 active:scale-95"
            >
              <span>Complete Profile Now</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          {/* Missing Checklist Items */}
          <div className="mt-4">
            <div className="text-[11px] font-bold text-neutral-700 dark:text-neutral-300 mb-2 flex items-center gap-2">
              <span>Required Details Pending:</span>
              <span className="text-[11px] font-normal text-neutral-500 dark:text-neutral-400">
                ({completeness.pendingItems.length} item{completeness.pendingItems.length > 1 ? "s" : ""} to fill)
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {completeness.pendingItems.map((item) => (
                <div
                  key={item.key}
                  className="flex items-center gap-2.5 p-2 rounded-xl bg-white/80 dark:bg-[#121520]/80 border border-amber-500/20 text-xs font-semibold text-neutral-800 dark:text-neutral-200"
                >
                  <span className="w-5 h-5 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center text-[10px] font-black shrink-0">
                    ✕
                  </span>
                  <span className="truncate">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Error banner ── */}
      {status === "error" && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 text-[13px] font-medium border border-red-200 dark:border-red-500/20">
          <AlertCircle size={16} className="shrink-0" />
          <span>{customError || "Could not submit the Enquiry. Please try again."}</span>
          {!isProfileComplete && (
            <Link to="/customer/profile" className="ml-auto text-xs font-bold text-red-700 dark:text-red-400 underline shrink-0">
              Go to Profile →
            </Link>
          )}
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

          {/* ── Auto-fetched Enterprise Requester Card ──────────────── */}
          <div className="rounded-xl border border-blue-500/20 bg-gradient-to-br from-blue-500/[0.06] via-white dark:via-[#0f121a] to-white dark:to-[#0f121a] p-4 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--border-default)]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold shrink-0">
                  <Building2 size={16} />
                </div>
                <div>
                  <h4 className="text-[13px] font-bold text-[var(--text-primary)] m-0 flex items-center gap-2">
                    <span>{company?.legalBusinessName || company?.name || profile?.company?.name || "Enterprise Requester"}</span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      <Check size={10} /> Auto-Fetched
                    </span>
                  </h4>
                  <p className="text-[11px] text-[var(--text-muted)] m-0 mt-0.5">
                    GSTIN: {company?.gstNumber || profile?.company?.gstNumber || "Not provided"} • {company?.city ? `${company.city}, ${company.state || ""}` : "Registered Entity"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-[var(--text-secondary)]">
                <span className="flex items-center gap-1"><User size={12} className="text-[var(--color-primary)]" /> {profile?.fullName || "Representative"}</span>
                <span className="flex items-center gap-1"><Phone size={12} className="text-[var(--color-primary)]" /> {profile?.phoneNumber || company?.companyPhone || "—"}</span>
              </div>
            </div>
            <div className="pt-2.5 flex items-center justify-between text-[11px] text-[var(--text-muted)]">
              <span className="flex items-center gap-1.5">
                <Sparkles size={13} className="text-amber-500" />
                Industry, primary delivery hub, and corporate terms have been auto-populated below from your profile.
              </span>
              <Link to="/customer/profile" className="text-blue-600 dark:text-blue-400 hover:underline font-medium text-[11px] shrink-0">
                Manage Profile →
              </Link>
            </div>
          </div>

          {/* SECTION 1: Basic Information */}
          <Section number={1} title="Basic Information">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Field label="Requirement Type" required error={errors.productType}>
                <select value={productType} onChange={(e) => setProductType(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-[13px] text-[var(--text-primary)] outline-none focus:border-[var(--color-primary)]">
                  <option value="">Select requirement type</option>
                  {enquiryProductTypes.map((t) => <option key={t} value={t}>{t}</option>)}
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
              <Field label="Industry" hint={company?.industry ? "Auto-selected from your company profile" : "Optional"}>
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
            {savedAddresses.length > 0 && (
              <div className="mb-4 p-3 rounded-lg bg-[var(--bg-surface-hover)] border border-[var(--border-default)]">
                <label className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider block mb-2">
                  Select from Saved Addresses
                </label>
                <div className="flex flex-wrap gap-2">
                  {savedAddresses.map((addr) => {
                    const isSelected = selectedAddressId === addr.id;
                    return (
                      <button
                        key={addr.id}
                        type="button"
                        onClick={() => handleSelectSavedAddress(addr)}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5",
                          isSelected
                            ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                            : "bg-[var(--bg-card)] text-[var(--text-primary)] border-[var(--border-default)] hover:border-blue-400"
                        )}
                      >
                        <MapPin size={12} />
                        <span>{addr.addressType} {addr.city ? `(${addr.city})` : ""}</span>
                        {addr.isPrimary && <span className={cn("text-[10px] px-1.5 py-0.2 rounded font-bold", isSelected ? "bg-white/20 text-white" : "bg-emerald-500/15 text-emerald-600")}>Primary</span>}
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => handleSelectSavedAddress("custom")}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer",
                      selectedAddressId === "custom"
                        ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                        : "bg-[var(--bg-card)] text-[var(--text-secondary)] border-[var(--border-default)] hover:border-blue-400"
                    )}
                  >
                    Custom Location
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Field label="Delivery Location" hint="Auto-filled from your delivery profile; editable as needed">
                <input type="text" value={deliveryLocation} onChange={(e) => { setDeliveryLocation(e.target.value); setSelectedAddressId("custom"); }} placeholder="City, State, Full Address"
                  className="w-full h-10 px-3 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--color-primary)]" />
              </Field>
              <Field label="Expected Delivery Date" hint="Auto-set to standard 30-day manufacturing lead time">
                <input type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-[13px] text-[var(--text-primary)] outline-none focus:border-[var(--color-primary)]" />
              </Field>
              <Field label="Preferred Delivery Terms" hint="Auto-selected based on standard terms">
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

          {/* Enquiry Summary */}
          <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] overflow-hidden">
            <div className="px-5 py-3.5 border-b border-[var(--border-default)]">
              <h3 className="text-[13px] font-semibold text-[var(--text-primary)] m-0">Enquiry Summary</h3>
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

          {/* Deletion Policy Card */}
          <div className="rounded-xl border border-blue-500/20 bg-gradient-to-br from-blue-500/[0.06] via-white dark:via-[#0f121a] to-white dark:to-[#0f121a] p-4.5 space-y-2 shadow-xs">
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
              <Info size={15} />
              <h4 className="text-[12px] font-bold text-[var(--text-primary)] m-0">Cancellation & Deletion Policy</h4>
            </div>
            <p className="text-[11px] text-[var(--text-muted)] m-0 leading-relaxed">
              You can delete or modify this generated enquiry anytime while it is in <strong>Draft</strong> or <strong>Submitted</strong> status. Once the Admin/Foundry engineering team begins review and advances the enquiry progress, it will be locked to preserve technical feasibility records.
            </p>
          </div>

          {/* Tips Card */}
          <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] p-5">
            <h4 className="text-[12px] font-semibold text-[var(--text-primary)] m-0 mb-3">Tips for Better Quote</h4>
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
