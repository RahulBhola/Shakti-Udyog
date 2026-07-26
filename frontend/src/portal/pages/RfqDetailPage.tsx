import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { customerApi, type RfqDetail, type RfqTimelineEntry } from "../../api/customerApi";
import { config } from "../../config";
import { tokenStorage } from "../../auth/tokenStorage";
import { Loading } from "../../components/ui";
import { formatDate } from "../shared";
import {
  Clock, CheckCircle, XCircle, AlertCircle, FileText, Package,
  Send, FileEdit, Info, CheckSquare, Loader2, Phone, Mail, Headphones
} from "lucide-react";

/* ── Status timeline steps ──────────────────────────────────── */

const RFQ_STATUSES = [
  "Draft", "Submitted", "Received", "Under Review",
  "Approved", "Rejected", "Quoted", "Accepted", "Declined", "Expired", "Cancelled",
];

const STATUS_ICONS: Record<string, any> = {
  Draft: FileEdit, Submitted: Send, Received: Clock, "Under Review": AlertCircle,
  Approved: CheckCircle, Rejected: XCircle,
  Quoted: FileText, Accepted: CheckCircle, Declined: XCircle, Expired: Clock, Cancelled: XCircle,
};

/* ── Status colors ──────────────────────────────────────────── */

const STATUS_COLORS: Record<string, string> = {
  Draft: "bg-slate-100 text-slate-600 dark:bg-slate-500/10 dark:text-slate-400",
  Submitted: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400",
  Received: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400",
  "Under Review": "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
  Approved: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
  Rejected: "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400",
  Quoted: "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400",
  Accepted: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
  Declined: "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400",
  Expired: "bg-slate-50 text-slate-600 dark:bg-slate-500/10 dark:text-slate-400",
  Cancelled: "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400",
};

function StatusBadge({ status }: { status: string }) {
  const c = STATUS_COLORS[status] ?? "bg-[#F1F5F9] text-[#64748B]";
  return (
    <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold tracking-wide ${c}`}>
      {status}
    </span>
  );
}

/* ── Field label + value ────────────────────────────────────── */

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-[var(--border-default)]/60 last:border-b-0">
      <span className="text-[11px] text-[var(--text-muted)] font-medium">{label}</span>
      <span className="text-xs font-semibold text-[var(--text-primary)] text-right">{value}</span>
    </div>
  );
}

/* ── Section card ───────────────────────────────────────────── */

function SectionCard({ title, icon: Icon, children }: { title: string; icon?: any; children: React.ReactNode }) {
  return (
    <div className="rounded-[16px] border border-[var(--border-default)] bg-[var(--bg-card)] shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-[var(--border-default)] flex items-center gap-2.5 bg-[var(--bg-surface)]/50">
        {Icon && <Icon size={16} className="text-[var(--color-primary)]" />}
        <h3 className="text-sm font-semibold text-[var(--text-primary)] m-0">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

/* ── Chip (pill with green check) ───────────────────────────── */

function Chip({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium bg-white dark:bg-[var(--bg-surface)] border border-[var(--border-default)] text-[var(--text-primary)]">
      <CheckCircle size={12} className="text-emerald-500 shrink-0" />
      {label}
    </span>
  );
}

/* ── Summary row (label / value) ────────────────────────────── */

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-2.5 border-b border-[var(--border-default)]/60 last:border-b-0">
      <span className="text-[11px] text-[var(--text-muted)]">{label}</span>
      <span className="text-xs font-semibold text-[var(--text-primary)] text-right">{value}</span>
    </div>
  );
}

/* ── RFQ Info section (numbered) ─────────────────────────────── */

function InfoSection({ number, title, children }: { number: number; title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2.5 mb-4">
        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[var(--color-primary)] text-[10px] font-bold text-white shrink-0">
          {number}
        </span>
        <h4 className="text-xs font-semibold text-[var(--text-primary)] m-0 uppercase tracking-wide">{title}</h4>
      </div>
      {children}
    </div>
  );
}

/* ── Info field (used inside RFQ Information grids) ──────────── */

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div className="py-1.5">
      <div className="text-[11px] text-[var(--text-muted)] font-medium mb-0.5">{label}</div>
      <div className="text-sm font-medium text-[var(--text-primary)]">{value}</div>
    </div>
  );
}

/* ── Auth-fetched image ─────────────────────────────────────── */

function RfqImage({ rfqId, fileId, fileName }: { rfqId: string; fileId: string; fileName: string }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    const token = tokenStorage.getAccessToken();
    fetch(`${config.apiBaseUrl}/api/v1/customer/rfqs/${rfqId}/files/${fileId}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}, credentials: "include",
    }).then((r) => { if (!r.ok) throw new Error(); return r.blob(); })
      .then((blob) => { if (!cancelled) setUrl(URL.createObjectURL(blob)); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [rfqId, fileId]);
  if (!url) return <div className="w-full h-full rounded-xl bg-[var(--bg-surface)] animate-pulse" />;
  return <img src={url} alt={fileName} className="w-full h-full object-cover rounded-xl" />;
}

/* ── Main Page ──────────────────────────────────────────────── */

export default function RfqDetailPage() {
  const { id = "" } = useParams();
  const [rfq, setRfq] = useState<RfqDetail | null>(null);
  const [timeline, setTimeline] = useState<RfqTimelineEntry[] | null>(null);
  const [missing, setMissing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    customerApi.rfq(id).then(setRfq).catch(() => setMissing(true));
    customerApi.rfqTimeline(id).then(setTimeline).catch(() => {});
  }, [id]);

  async function submitDraft() {
    setSubmitting(true);
    try {
      await customerApi.submitRfq(id);
      const updated = await customerApi.rfq(id);
      setRfq(updated);
      setTimeline(await customerApi.rfqTimeline(id));
    } catch {
      alert("Could not submit the draft.");
    } finally {
      setSubmitting(false);
    }
  }

  if (missing) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <XCircle size={48} className="text-[var(--text-muted)] mb-4 opacity-40" />
        <h2 className="text-lg font-semibold text-[var(--text-primary)] m-0">RFQ not found</h2>
        <p className="text-sm text-[var(--text-secondary)] mt-1 mb-4">This RFQ may have been removed or you may not have access.</p>
        <Link to="/customer/rfqs" className="inline-flex items-center gap-1.5 px-4 h-9 rounded-lg bg-[var(--color-primary)] text-white text-xs font-semibold hover:bg-[var(--color-primary-hover)] transition-all no-underline">Back to RFQs</Link>
      </div>
    );
  }
  if (!rfq) return <div className="py-10"><Loading label="Loading RFQ" /></div>;

  const isDraft = rfq.isDraft && rfq.status === "Draft";
  const flowIndex = RFQ_STATUSES.indexOf(rfq.status);
  const terminal = ["Rejected", "Declined", "Expired", "Cancelled"].includes(rfq.status);

  // Additional requirements array
  const additionalReqs = rfq.additionalRequirements ? rfq.additionalRequirements.split(", ").filter(Boolean) : [];

  // Tips
  const tips = [
    "Provide accurate material grade",
    "Share complete drawings",
    "Mention weight",
    "Specify machining",
    "Mention annual quantity",
  ];

  return (
    <div>
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-[var(--border-default)]">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight m-0">
            RFQ — {rfq.productType}
          </h1>
          <div className="flex items-center gap-2 mt-2">
            <StatusBadge status={isDraft ? "Draft" : rfq.status} />
          </div>
        </div>
        {isDraft && (
          <div className="flex items-center gap-2 shrink-0">
            <Link to={`/customer/rfqs/${id}/edit`}
              className="inline-flex items-center gap-1.5 px-4 h-9 rounded-lg border border-[var(--border-default)] text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)] transition-all no-underline">
              <FileEdit size={14} /> Save as Draft
            </Link>
            <button type="button" disabled={submitting} onClick={submitDraft}
              className="inline-flex items-center gap-1.5 px-4 h-9 rounded-lg bg-[var(--color-primary)] text-white text-xs font-semibold hover:bg-[var(--color-primary-hover)] disabled:opacity-50 transition-all">
              {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              Submit RFQ
            </button>
          </div>
        )}
      </div>

      {/* ── Main Grid: 3 columns ── */}
      <div className="grid grid-cols-12 gap-x-6">

        {/* ══ LEFT COLUMN (3) — Status Timeline ══ */}
        <div className="col-span-12 lg:col-span-3 lg:col-start-1 lg:row-start-1">
          <SectionCard title="Status">
            {terminal ? (
              <p className="text-sm text-[var(--text-secondary)]">This RFQ has been <strong>{rfq.status.toLowerCase()}</strong>.</p>
            ) : (
              <div className="space-y-1">
                {RFQ_STATUSES.map((step, i) => {
                  const Icon = STATUS_ICONS[step] ?? Clock;
                  const isDone = i < flowIndex;
                  const isCurrent = i === flowIndex;
                  if (isDone && step === "Rejected") return null;
                  // Approved and Rejected are mutually exclusive — show only the active one
                  if (step === "Approved" && rfq.status === "Rejected") return null;
                  if (step === "Rejected" && rfq.status === "Approved") return null;
                  return (
                    <div key={step} className={`flex gap-2.5 ${isCurrent ? "" : isDone ? "opacity-70" : "opacity-40"}`}>
                      <div className="flex flex-col items-center">
                        <div className={`w-2.5 h-2.5 rounded-full ${
                          isCurrent
                            ? "bg-[var(--color-primary)] ring-2 ring-[var(--color-primary)]/30"
                            : isDone
                            ? "border-[1.5px] border-[var(--color-primary)]"
                            : "border-[1.5px] border-[var(--border-default)]"
                        }`} />
                        {i < RFQ_STATUSES.length - 1 && <div className="w-px h-3.5 bg-[var(--border-default)]/60" />}
                      </div>
                      <div className="flex items-center gap-1.5 min-w-0 py-0.5">
                        <Icon size={11} className={isCurrent ? "text-[var(--color-primary)]" : "text-[var(--text-muted)]"} />
                        <span className={`text-[11px] ${isCurrent ? "font-semibold text-[var(--color-primary)]" : "text-[var(--text-secondary)]"}`}>
                          {step}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {isDraft && (
              <div className="mt-6 flex flex-col gap-3 pt-4 border-t border-[var(--border-default)]">
                <Link to={`/customer/rfqs/${id}/edit`}
                  className="w-full flex items-center justify-center gap-2 px-4 h-10 rounded-lg border border-[var(--border-default)] text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)] transition-all no-underline">
                  <FileEdit size={14} /> Edit RFQ
                </Link>
                <button type="button" disabled={submitting} onClick={submitDraft}
                  className="w-full flex items-center justify-center gap-2 px-4 h-10 rounded-lg bg-[var(--color-primary)] text-white text-sm font-semibold hover:bg-[var(--color-primary-hover)] disabled:opacity-50 transition-all">
                  {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  Submit Draft
                </button>
              </div>
            )}
          </SectionCard>
        </div>

        {/* ══ CENTER COLUMN (6) — Request Details ══ */}
        <div className="col-span-12 lg:col-span-6 lg:col-start-4 lg:row-start-1">
          <SectionCard title="Request Details" icon={FileText}>
            <div className="flex flex-col lg:flex-row gap-6 lg:items-start">
              <div className="flex-1 space-y-0">
                <Field label="Requirement" value={rfq.productType} />
                <Field label="Material Grade" value={rfq.materialGrade ?? "Not Available"} />
                <Field label="Quantity" value={rfq.quantity} />
                <Field label="Delivery Location" value={rfq.deliveryLocation ?? "Not Available"} />
                <Field label="Submitted Date" value={formatDate(rfq.createdAtUtc)} />
                <Field label="Draft" value={rfq.isDraft ? "Yes" : "No"} />
              </div>
              <div className="shrink-0">
                <div className="w-full sm:w-[250px] aspect-[4/3] rounded-2xl border border-[var(--border-default)] overflow-hidden">
                  {rfq.files.length > 0 ? (
                    <RfqImage rfqId={id} fileId={rfq.files[0].id} fileName={rfq.files[0].fileName} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-[var(--bg-surface)]">
                      <Package size={52} className="text-[var(--text-muted)] opacity-30" />
                    </div>
                  )}
                </div>
              </div>
            </div>
            {rfq.requirementDetails && (
              <div className="mt-6 pt-5 border-t border-[var(--border-default)]">
                <span className="text-xs font-medium text-[var(--text-muted)] mb-2 block">Details</span>
                <p className="text-sm text-[var(--text-primary)] leading-relaxed m-0">{rfq.requirementDetails}</p>
              </div>
            )}
          </SectionCard>
        </div>

        {/* ══ RIGHT COLUMN (3) — Summary & Tips ══ */}
        <div className="col-span-12 lg:col-span-3 lg:col-start-10 lg:row-span-2 space-y-6 lg:sticky lg:top-6 lg:self-start">

          {/* Card 1: RFQ Summary */}
          <SectionCard title="RFQ Summary">
            <div className="space-y-0">
              <SummaryRow label="Requirement" value={rfq.productType} />
              <SummaryRow label="Material Grade" value={rfq.materialGrade || "—"} />
              <SummaryRow label="Quantity" value={rfq.productionQuantity || rfq.quantity} />
              <SummaryRow label="Delivery Location" value={rfq.deliveryLocation || "—"} />
              <SummaryRow label="Expected Delivery" value={rfq.expectedDeliveryDate ? formatDate(rfq.expectedDeliveryDate) : "—"} />
              <SummaryRow label="Attachments" value={rfq.files.length > 0 ? `${rfq.files.length} file(s)` : "—"} />
            </div>
          </SectionCard>

          {/* Card 2: Blue Info Card */}
          <div className="rounded-[16px] border border-blue-200/60 dark:border-blue-500/20 bg-blue-50/80 dark:bg-blue-500/10 p-5">
            <div className="flex items-start gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 shrink-0">
                <Info size={16} />
              </span>
              <div>
                <h4 className="text-xs font-semibold text-[var(--text-primary)] m-0 mb-0.5 uppercase tracking-wide">Information</h4>
                <p className="text-[11px] text-[var(--text-muted)] leading-relaxed m-0">The more details you provide, the more accurate our quotation will be.</p>
              </div>
            </div>
          </div>

          {/* Card 3: Tips */}
          <div className="rounded-[16px] border border-[var(--border-default)] bg-[var(--bg-card)] p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-md bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <CheckSquare size={13} />
              </span>
              <h4 className="text-xs font-semibold text-[var(--text-primary)] m-0 uppercase tracking-wide">Tips</h4>
            </div>
            <ul className="space-y-2 m-0 p-0 list-none">
              {tips.map((tip) => (
                <li key={tip} className="flex items-start gap-2 text-xs text-[var(--text-secondary)]">
                  <span className="text-emerald-500 shrink-0 mt-0.5">•</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>

          {/* Card 4: Need Help */}
          <div className="rounded-[16px] border border-[var(--border-default)] bg-[var(--bg-card)] p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-md bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Headphones size={13} />
              </span>
              <h4 className="text-xs font-semibold text-[var(--text-primary)] m-0 uppercase tracking-wide">Need Help?</h4>
            </div>
            <p className="text-[11px] text-[var(--text-muted)] mb-3">Our support team is here to help.</p>
            <div className="space-y-1.5 text-[11px] text-[var(--text-muted)]">
              <div className="flex items-center gap-2"><Mail size={13} /> iamrahulbhola@gmail.com</div>
              <div className="flex items-center gap-2"><Phone size={13} /> +91 8283041140</div>
            </div>
          </div>
        </div>

        {/* ══ RFQ INFORMATION — below Status + Request Details ══ */}
        <div className="col-span-12 lg:col-span-9 lg:col-start-1 lg:row-start-2">
          <SectionCard title="RFQ Information" icon={Info}>
            <div className="space-y-8">

              {/* 1. Basic Information */}
              <InfoSection number={1} title="Basic Information">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InfoField label="Requirement Type" value={rfq.productType} />
                  <InfoField label="Part Name" value={rfq.partName ?? "Not Available"} />
                  <InfoField label="Part Number" value={rfq.partNumber ?? "Not Available"} />
                  <InfoField label="Application" value={rfq.application ?? "Not Available"} />
                  <InfoField label="Industry" value={rfq.industry ?? "Not Available"} />
                </div>
              </InfoSection>
              <div className="border-t border-[var(--border-default)]" />

              {/* 2. Material Details */}
              <InfoSection number={2} title="Material Details">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InfoField label="Material Grade" value={rfq.materialGrade ?? "Not Available"} />
                  <InfoField label="Standard" value={rfq.materialStandard ?? "Not Available"} />
                  <InfoField label="Approx Weight" value={rfq.approxWeight != null ? `${rfq.approxWeight} kg` : "Not Available"} />
                  <InfoField label="Machining Required" value={rfq.machiningRequired ?? "Not Available"} />
                  <InfoField label="Pattern Availability" value={rfq.patternAvailability ?? "Not Available"} />
                </div>
              </InfoSection>
              <div className="border-t border-[var(--border-default)]" />

              {/* 3. Quantity Details */}
              <InfoSection number={3} title="Quantity Details">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <InfoField label="Prototype Quantity" value={rfq.prototypeQuantity ?? "Not Available"} />
                  <InfoField label="Production Quantity" value={rfq.productionQuantity ?? rfq.quantity} />
                  <InfoField label="Annual Requirement" value={rfq.annualRequirement ?? "Not Available"} />
                </div>
              </InfoSection>
              <div className="border-t border-[var(--border-default)]" />

              {/* 4. Delivery Details */}
              <InfoSection number={4} title="Delivery Details">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InfoField label="Delivery Location" value={rfq.deliveryLocation ?? "Not Available"} />
                  <InfoField label="Expected Delivery Date" value={rfq.expectedDeliveryDate ? formatDate(rfq.expectedDeliveryDate) : "Not Available"} />
                  <InfoField label="Preferred Delivery Terms" value={rfq.preferredDeliveryTerms ?? "Not Available"} />
                </div>
              </InfoSection>
              <div className="border-t border-[var(--border-default)]" />

              {/* 5. Additional Requirements */}
              <InfoSection number={5} title="Additional Requirements">
                {additionalReqs.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {additionalReqs.map((r) => <Chip key={r} label={r} />)}
                  </div>
                ) : (
                  <p className="text-sm text-[var(--text-muted)]">None specified</p>
                )}
              </InfoSection>
              <div className="border-t border-[var(--border-default)]" />

              {/* 6. Remarks */}
              <InfoSection number={6} title="Remarks">
                {rfq.remarks ? (
                  <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] px-4 py-3">
                    <p className="text-sm text-[var(--text-primary)] leading-relaxed m-0 whitespace-pre-wrap">{rfq.remarks}</p>
                  </div>
                ) : (
                  <p className="text-sm text-[var(--text-muted)]">No remarks</p>
                )}
              </InfoSection>
            </div>
          </SectionCard>
        </div>
      </div>

      {/* ── Timeline ── */}
      {timeline && timeline.length > 0 && (
        <SectionCard title="Status History">
          <div className="space-y-0">
            {timeline.map((entry, i) => (
              <div key={i} className="flex gap-3 pb-4 last:pb-0">
                <div className="flex flex-col items-center">
                  <div className="w-2 h-2 rounded-full bg-[var(--color-primary)]/70" />
                  {i < timeline.length - 1 && <div className="flex-1 w-px bg-[var(--border-default)]/60 mt-1" />}
                </div>
                <div className="flex-1 min-w-0 pb-1">
                  <div className="text-xs font-medium text-[var(--text-primary)]">{entry.fromStatus} → {entry.toStatus}</div>
                  {entry.note && <div className="text-[11px] text-[var(--text-muted)] mt-0.5">{entry.note}</div>}
                  <div className="text-[11px] text-[var(--text-muted)] mt-0.5">{formatDate(entry.occurredAtUtc)} · {entry.changedByRole}</div>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}
    </div>
  );
}
