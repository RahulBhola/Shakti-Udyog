import { useEffect, useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { updaterApi, type UpdaterRfqDetail } from "../../../api/updaterApi";
import { adminApi } from "../../../api/adminApi";
import {
  ArrowLeft, Building2, Mail, Phone, Package, Calendar, Clock,
  FileText, Paperclip, Plus, Trash2, Save, Send,
  Loader2, AlertCircle, CheckCircle, User,
} from "lucide-react";

/* ── Types ────────────────────────────────────────────────────── */

interface QuotationLineItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  discountPercent: number;
  gstPercent: number;
  amount: number;
}

/* ── Helpers ──────────────────────────────────────────────────── */

function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" });
}

function formatMoney(value: number): string {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
}

function calcLineAmount(qty: number, price: number, discPct: number, gstPct: number): number {
  const subtotal = qty * price;
  const discount = subtotal * (discPct / 100);
  const afterDiscount = subtotal - discount;
  const gst = afterDiscount * (gstPct / 100);
  return afterDiscount + gst;
}

/* ── Styled Section ───────────────────────────────────────────── */

function Section({ title, children, icon: Icon }: { title: string; children: React.ReactNode; icon?: any }) {
  return (
    <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] overflow-hidden">
      <div className="px-5 py-3.5 border-b border-[var(--border-default)] flex items-center gap-2.5">
        {Icon && <Icon size={15} className="text-[var(--color-primary)]" />}
        <h3 className="text-[13px] font-semibold text-[var(--text-primary)] m-0">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

/* ── Read-only Field ──────────────────────────────────────────── */

function Field({ label, value, icon: Icon }: { label: string; value: string; icon?: any }) {
  return (
    <div className="flex items-start gap-2.5">
      {Icon && <Icon size={14} className="text-[var(--text-muted)] mt-0.5 shrink-0" />}
      <div className="min-w-0">
        <div className="text-[11px] text-[var(--text-muted)] font-medium">{label}</div>
        <div className="text-[13px] text-[var(--text-primary)] font-medium truncate">{value}</div>
      </div>
    </div>
  );
}

/* ── Main Page ────────────────────────────────────────────────── */

export default function CreateQuotationPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const rfqIdParam = searchParams.get("rfqId") ?? "";

  // ── State ─────────────────────────────────────────────────────
  const [rfq, setRfq] = useState<UpdaterRfqDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Form fields
  const [validUntil, setValidUntil] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("");
  const [deliveryTerms, setDeliveryTerms] = useState("");
  const [deliveryTime, setDeliveryTime] = useState("");
  const [warranty, setWarranty] = useState("");
  const [currency, setCurrency] = useState("INR");
  const [customerNotes, setCustomerNotes] = useState("");
  const [internalNotes, setInternalNotes] = useState("");
  const [freight, setFreight] = useState(0);
  const [packing, setPacking] = useState(0);
  const [otherCharges, setOtherCharges] = useState(0);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  // Line items
  const [items, setItems] = useState<QuotationLineItem[]>([
    { id: "1", description: "", quantity: 0, unit: "pcs", unitPrice: 0, discountPercent: 0, gstPercent: 18, amount: 0 },
  ]);

  // ── Load RFQ ─────────────────────────────────────────────────
  useEffect(() => {
    if (!rfqIdParam) { setLoading(false); setError("No RFQ ID provided."); return; }
    updaterApi.rfq(rfqIdParam)
      .then((data) => { setRfq(data); setLoading(false); })
      .catch(() => { setError("RFQ not found or inaccessible."); setLoading(false); });
  }, [rfqIdParam]);

  // ── Auto-calculate line amounts ───────────────────────────────
  const calculatedItems = useMemo(() =>
    items.map((i) => ({
      ...i,
      amount: calcLineAmount(i.quantity, i.unitPrice, i.discountPercent, i.gstPercent),
    })),
    [items]
  );

  // ── Totals ────────────────────────────────────────────────────
  const totals = useMemo(() => {
    const subtotal = calculatedItems.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
    const discountAmt = calculatedItems.reduce((s, i) => s + i.quantity * i.unitPrice * (i.discountPercent / 100), 0);
    const gstAmt = calculatedItems.reduce((s, i) => {
      const afterDiscount = i.quantity * i.unitPrice * (1 - i.discountPercent / 100);
      return s + afterDiscount * (i.gstPercent / 100);
    }, 0);
    const lineTotal = calculatedItems.reduce((s, i) => s + i.amount, 0);
    const grandTotal = lineTotal + freight + packing + otherCharges;
    return { subtotal, discountAmt, gstAmt, lineTotal, grandTotal };
  }, [calculatedItems, freight, packing, otherCharges]);

  // ── Item management ───────────────────────────────────────────
  function updateItem(id: string, field: keyof QuotationLineItem, value: number | string) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, [field]: value } : i)));
  }

  function addItem() {
    setItems((prev) => [...prev, { id: crypto.randomUUID(), description: "", quantity: 0, unit: "pcs", unitPrice: 0, discountPercent: 0, gstPercent: 18, amount: 0 }]);
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  // ── Save ──────────────────────────────────────────────────────
  async function handleSave(submit: boolean) {
    if (!rfq) return;
    setSaving(true);
    setSaveMsg(null);
    try {
      // Resolve companyId if missing (RFQ may not have a linked company)
      let companyId = rfq.companyId;
      if (!companyId || companyId === "00000000-0000-0000-0000-000000000000") {
        const companies = await adminApi.companies();
        const match = companies.find((c: any) => c.name === rfq.companyName);
        if (match) companyId = match.id;
      }
      if (!companyId || companyId === "00000000-0000-0000-0000-000000000000") {
        setSaveMsg("Failed: No company linked to this RFQ.");
        setSaving(false);
        return;
      }

      const payload = {
        rfqId: rfq.id,
        companyId,
        currency,
        subtotal: totals.subtotal,
        tax: totals.gstAmt,
        discount: totals.discountAmt,
        total: totals.grandTotal,
        validUntilUtc: validUntil || undefined,
        paymentTerms: paymentTerms || undefined,
        deliveryTerms: deliveryTerms || undefined,
        freight: freight ? String(freight) : undefined,
        packing: packing ? String(packing) : undefined,
        remarks: [customerNotes, internalNotes ? `[Internal] ${internalNotes}` : ""].filter(Boolean).join("\n") || undefined,
        items: calculatedItems.filter((i) => i.description).map((i, idx) => ({
          lineNumber: idx + 1,
          partNumber: `ITEM-${idx + 1}`,
          description: i.description,
          materialGrade: rfq.materialGrade ?? undefined,
          quantity: i.quantity,
          unit: i.unit,
          unitPrice: i.unitPrice,
          taxPercent: i.gstPercent,
        })),
      };

      const { id } = await updaterApi.createQuotation(payload);
      // Advance RFQ to Quoted — removes from RFQ list, appears in Quotations
      await updaterApi.updateRfqStatus(rfq.id, "Quoted").catch(() => {});
      if (submit) {
        await updaterApi.submitQuotation(id);
      }
      navigate(`/admin/quotations/${id}`);
    } catch {
      setSaveMsg("Failed to create quotation. Please check the data and try again.");
    } finally {
      setSaving(false);
    }
  }

  // ── Loading ───────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={28} className="animate-spin text-[var(--color-primary)]" />
          <span className="text-[13px] text-[var(--text-muted)]">Loading RFQ details...</span>
        </div>
      </div>
    );
  }

  // ── Error ─────────────────────────────────────────────────────
  if (error || !rfq) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-4">
        <div className="w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center mb-4">
          <AlertCircle size={28} className="text-red-500" />
        </div>
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-1">Cannot Create Quotation</h3>
        <p className="text-[13px] text-[var(--text-muted)] mb-6">{error ?? "RFQ data could not be loaded."}</p>
        <button type="button" onClick={() => navigate("/admin/rfqs")}
          className="inline-flex items-center gap-1.5 px-4 h-9 rounded-lg border border-[var(--border-default)] text-[12px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all">
          <ArrowLeft size={14} /> Back to RFQs
        </button>
      </div>
    );
  }

  const hasItems = calculatedItems.some((i) => i.description && i.quantity > 0);

  return (
    <div className="space-y-6 pb-8">
      {/* ── Header ───────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => navigate(`/admin/rfqs/${rfq.id}`)}
            className="flex items-center justify-center w-8 h-8 rounded-lg border border-[var(--border-default)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-all">
            <ArrowLeft size={15} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-[var(--text-primary)]">Create Quotation</h1>
            <p className="text-[12px] text-[var(--text-muted)]">Based on RFQ — {rfq.productType}</p>
          </div>
        </div>
        {rfq.status !== "Approved" && (
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 text-[12px] font-medium">
            <AlertCircle size={14} />
            RFQ must be Approved to generate quotation
          </div>
        )}
      </div>

      {/* ── Status message ── */}
      {saveMsg && (
        <div className={`px-4 py-2.5 rounded-xl text-[13px] font-medium flex items-center gap-2 ${
          saveMsg.includes("Failed") ? "bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400" : "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
        }`}>
          {saveMsg.includes("Failed") ? <AlertCircle size={14} /> : <CheckCircle size={14} />}
          {saveMsg}
        </div>
      )}

      {/* ── Two-column layout ────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">

        {/* ══ LEFT COLUMN ══ */}
        <div className="flex-1 min-w-0 space-y-5">

          {/* ── RFQ Information (read-only) ──────────────────── */}
          <Section title="RFQ Information" icon={FileText}>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <Field label="RFQ ID" value={`RFQ-${rfq.id.slice(0, 8).toUpperCase()}`} icon={Hash} />
              <Field label="Customer" value={rfq.companyName} icon={Building2} />
              <Field label="Contact Person" value={rfq.fullName} icon={User} />
              <Field label="Email" value={rfq.email} icon={Mail} />
              <Field label="Phone" value={rfq.phone || "—"} icon={Phone} />
              <Field label="RFQ Date" value={formatDate(rfq.createdAtUtc)} icon={Calendar} />
              <Field label="Status" value={rfq.status} icon={Clock} />
            </div>
          </Section>

          {/* ── Product Information (read-only) ──────────────── */}
          <Section title="Product Information" icon={Package}>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <Field label="Product Type" value={rfq.productType} />
              <Field label="Material Grade" value={rfq.materialGrade ?? "—"} />
              <Field label="Quantity" value={rfq.quantity} />
              <Field label="Delivery Location" value={rfq.deliveryLocation ?? "—"} />
            </div>
            {rfq.requirementDetails && (
              <div className="mt-4 pt-4 border-t border-[var(--border-default)]">
                <div className="text-[11px] text-[var(--text-muted)] font-medium mb-1.5">Requirements</div>
                <p className="text-[13px] text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap m-0">{rfq.requirementDetails}</p>
              </div>
            )}
            {rfq.files.length > 0 && (
              <div className="mt-4 pt-4 border-t border-[var(--border-default)]">
                <div className="text-[11px] text-[var(--text-muted)] font-medium mb-2 flex items-center gap-1.5">
                  <Paperclip size={12} /> Attachments ({rfq.files.length})
                </div>
                <div className="flex flex-wrap gap-2">
                  {rfq.files.map((f) => (
                    <span key={f.id} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--bg-surface-hover)] text-[11px] text-[var(--text-secondary)]">
                      <FileText size={11} />
                      {f.fileName}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </Section>

          {/* ── Quotation Items (editable) ───────────────────── */}
          <Section title="Quotation Items" icon={Package}>
            <div className="overflow-x-auto">
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="border-b border-[var(--border-default)] text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                    <th className="text-left py-2 pr-2 min-w-[120px]">Description</th>
                    <th className="text-right py-2 px-2 w-[55px]">Qty</th>
                    <th className="text-center py-2 px-2 w-[65px]">Unit</th>
                    <th className="text-right py-2 px-2 w-[85px]">Unit Price</th>
                    <th className="text-right py-2 px-2 w-[65px]">Disc %</th>
                    <th className="text-center py-2 px-2 w-[65px]">GST %</th>
                    <th className="text-right py-2 px-2 w-[85px]">Amount</th>
                    <th className="w-[28px]" />
                  </tr>
                </thead>
                <tbody>
                  {calculatedItems.map((item) => (
                    <tr key={item.id} className="border-b border-[var(--border-default)] last:border-0">
                      <td className="py-1 pr-2">
                        <input type="text" value={item.description} placeholder="Description"
                          onChange={(e) => updateItem(item.id, "description", e.target.value)}
                          className="w-full h-7 px-2 rounded-md border border-[var(--border-input)] bg-[var(--bg-card)] text-[11px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--color-primary)]" />
                      </td>
                      <td className="py-1 px-2">
                        <input type="number" value={item.quantity || ""} placeholder="0" min="0"
                          onChange={(e) => updateItem(item.id, "quantity", Math.max(0, Number(e.target.value)))}
                          className="w-full h-7 px-1.5 rounded-md border border-[var(--border-input)] bg-[var(--bg-card)] text-[11px] text-[var(--text-primary)] text-right outline-none focus:border-[var(--color-primary)]" />
                      </td>
                      <td className="py-1 px-2">
                        <select value={item.unit} onChange={(e) => updateItem(item.id, "unit", e.target.value)}
                          className="w-full h-7 px-1.5 rounded-md border border-[var(--border-input)] bg-[var(--bg-card)] text-[11px] text-[var(--text-primary)] text-center outline-none focus:border-[var(--color-primary)]">
                          <option>pcs</option><option>kg</option><option>set</option><option>lot</option>
                        </select>
                      </td>
                      <td className="py-1 px-2">
                        <input type="number" value={item.unitPrice || ""} placeholder="0" min="0" step="0.01"
                          onChange={(e) => updateItem(item.id, "unitPrice", Math.max(0, Number(e.target.value)))}
                          className="w-full h-7 px-1.5 rounded-md border border-[var(--border-input)] bg-[var(--bg-card)] text-[11px] text-[var(--text-primary)] text-right outline-none focus:border-[var(--color-primary)]" />
                      </td>
                      <td className="py-1 px-2">
                        <input type="number" value={item.discountPercent || ""} placeholder="0" min="0" max="100"
                          onChange={(e) => updateItem(item.id, "discountPercent", Math.min(100, Math.max(0, Number(e.target.value))))}
                          className="w-full h-7 px-1.5 rounded-md border border-[var(--border-input)] bg-[var(--bg-card)] text-[11px] text-[var(--text-primary)] text-right outline-none focus:border-[var(--color-primary)]" />
                      </td>
                      <td className="py-1 px-2">
                        <select value={item.gstPercent} onChange={(e) => updateItem(item.id, "gstPercent", Number(e.target.value))}
                          className="w-full h-7 px-1.5 rounded-md border border-[var(--border-input)] bg-[var(--bg-card)] text-[11px] text-[var(--text-primary)] text-center outline-none focus:border-[var(--color-primary)]">
                          <option value={0}>0%</option><option value={5}>5%</option><option value={12}>12%</option><option value={18}>18%</option><option value={28}>28%</option>
                        </select>
                      </td>
                      <td className="py-1 px-2 text-right text-[11px] font-semibold text-[var(--text-primary)] tabular-nums">
                        {item.amount > 0 ? formatMoney(item.amount) : "—"}
                      </td>
                      <td className="py-1 pl-2">
                        <button type="button" onClick={() => removeItem(item.id)} disabled={items.length <= 1}
                          className="flex items-center justify-center w-6 h-6 rounded-md text-[var(--text-muted)] hover:text-red-500 hover:bg-red-50 disabled:opacity-30 transition-all mx-auto">
                          <Trash2 size={11} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button type="button" onClick={addItem}
              className="mt-3 flex items-center gap-1.5 px-3.5 h-8 rounded-lg border border-dashed border-[var(--border-default)] text-[12px] font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--color-primary)] hover:bg-[var(--bg-surface-hover)] transition-all">
              <Plus size={13} /> Add Line Item
            </button>
          </Section>

          {/* ── Commercial Terms ─────────────────────────────── */}
          <Section title="Commercial Terms" icon={FileText}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-medium text-[var(--text-muted)] block mb-1">Valid Until</label>
                <input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-[13px] text-[var(--text-primary)] outline-none focus:border-[var(--color-primary)]" />
              </div>
              <div>
                <label className="text-[11px] font-medium text-[var(--text-muted)] block mb-1">Currency</label>
                <select value={currency} onChange={(e) => setCurrency(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-[13px] text-[var(--text-primary)] outline-none focus:border-[var(--color-primary)]">
                  <option value="INR">INR (₹)</option><option value="USD">USD ($)</option><option value="EUR">EUR (€)</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] font-medium text-[var(--text-muted)] block mb-1">Payment Terms</label>
                <input type="text" value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)} placeholder="e.g. 30% advance, 70% on delivery"
                  className="w-full h-9 px-3 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--color-primary)]" />
              </div>
              <div>
                <label className="text-[11px] font-medium text-[var(--text-muted)] block mb-1">Delivery Terms</label>
                <input type="text" value={deliveryTerms} onChange={(e) => setDeliveryTerms(e.target.value)} placeholder="e.g. FOB Ludhiana"
                  className="w-full h-9 px-3 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--color-primary)]" />
              </div>
              <div>
                <label className="text-[11px] font-medium text-[var(--text-muted)] block mb-1">Delivery Time</label>
                <input type="text" value={deliveryTime} onChange={(e) => setDeliveryTime(e.target.value)} placeholder="e.g. 4-6 weeks"
                  className="w-full h-9 px-3 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--color-primary)]" />
              </div>
              <div>
                <label className="text-[11px] font-medium text-[var(--text-muted)] block mb-1">Warranty</label>
                <input type="text" value={warranty} onChange={(e) => setWarranty(e.target.value)} placeholder="e.g. 12 months"
                  className="w-full h-9 px-3 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--color-primary)]" />
              </div>
            </div>
          </Section>

          {/* ── Customer Notes ───────────────────────────────── */}
          <Section title="Customer Notes (printed on PDF)" icon={FileText}>
            <textarea value={customerNotes} onChange={(e) => setCustomerNotes(e.target.value)} rows={3} placeholder="Notes that will appear on the quotation document..."
              className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-3.5 py-2.5 text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--color-primary)] resize-none" />
          </Section>

          {/* ── Internal Notes ───────────────────────────────── */}
          <Section title="Internal Notes (staff only)" icon={FileText}>
            <textarea value={internalNotes} onChange={(e) => setInternalNotes(e.target.value)} rows={2} placeholder="Visible only to company staff..."
              className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-3.5 py-2.5 text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--color-primary)] resize-none" />
          </Section>
        </div>

        {/* ══ RIGHT COLUMN — Sticky Summary ══ */}
        <div className="w-full lg:w-[300px] xl:w-[340px] shrink-0 lg:sticky lg:top-6 lg:self-start space-y-4">
          <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] overflow-hidden">
            <div className="px-5 py-3.5 border-b border-[var(--border-default)]">
              <h3 className="text-[13px] font-semibold text-[var(--text-primary)] m-0">Summary</h3>
            </div>
            <div className="p-5 space-y-3">
              {/* Line totals */}
              <div className="space-y-2 text-[13px]">
                <div className="flex items-center justify-between">
                  <span className="text-[var(--text-muted)]">Subtotal</span>
                  <span className="font-medium text-[var(--text-primary)] tabular-nums">{formatMoney(totals.subtotal)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[var(--text-muted)]">Discount</span>
                  <span className="font-medium text-red-500 tabular-nums">−{formatMoney(totals.discountAmt)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[var(--text-muted)]">GST</span>
                  <span className="font-medium text-[var(--text-primary)] tabular-nums">{formatMoney(totals.gstAmt)}</span>
                </div>
              </div>

              <div className="border-t border-[var(--border-default)] pt-3 space-y-2 text-[13px]">
                <div className="flex items-center justify-between">
                  <span className="text-[var(--text-muted)]">Freight</span>
                  <input type="number" value={freight || ""} min="0" onChange={(e) => setFreight(Math.max(0, Number(e.target.value)))}
                    className="w-28 h-7 px-2 rounded-md border border-[var(--border-input)] bg-[var(--bg-surface)] text-[12px] text-[var(--text-primary)] text-right outline-none focus:border-[var(--color-primary)] tabular-nums" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[var(--text-muted)]">Packing</span>
                  <input type="number" value={packing || ""} min="0" onChange={(e) => setPacking(Math.max(0, Number(e.target.value)))}
                    className="w-28 h-7 px-2 rounded-md border border-[var(--border-input)] bg-[var(--bg-surface)] text-[12px] text-[var(--text-primary)] text-right outline-none focus:border-[var(--color-primary)] tabular-nums" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[var(--text-muted)]">Other Charges</span>
                  <input type="number" value={otherCharges || ""} min="0" onChange={(e) => setOtherCharges(Math.max(0, Number(e.target.value)))}
                    className="w-28 h-7 px-2 rounded-md border border-[var(--border-input)] bg-[var(--bg-surface)] text-[12px] text-[var(--text-primary)] text-right outline-none focus:border-[var(--color-primary)] tabular-nums" />
                </div>
              </div>

              {/* Grand Total */}
              <div className="border-t border-[var(--border-default)] pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-[15px] font-bold text-[var(--text-primary)]">Grand Total</span>
                  <span className="text-[18px] font-bold text-[var(--color-primary)] tabular-nums">{formatMoney(totals.grandTotal)}</span>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="px-5 pb-5 space-y-2">
              <button type="button" disabled={saving || !hasItems || rfq.status !== "Approved"} onClick={() => void handleSave(false)}
                className="w-full flex items-center justify-center gap-1.5 h-10 rounded-xl bg-[var(--color-primary)] text-white text-[12px] font-semibold hover:bg-[var(--color-primary-hover)] disabled:opacity-50 transition-all">
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                Save Draft
              </button>
              <button type="button" disabled={saving || !hasItems || rfq.status !== "Approved"} onClick={() => void handleSave(true)}
                className="w-full flex items-center justify-center gap-1.5 h-10 rounded-xl border border-[var(--border-default)] text-[12px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] disabled:opacity-50 transition-all">
                <Send size={14} /> Submit for Approval
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const Hash = ({ size, className }: { size: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="4" y1="9" x2="20" y2="9" /><line x1="4" y1="15" x2="20" y2="15" /><line x1="10" y1="3" x2="8" y2="21" /><line x1="16" y1="3" x2="14" y2="21" />
  </svg>
);
