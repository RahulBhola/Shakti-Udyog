import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { adminApi, type ProductMasterDetail } from "../../api/adminApi";
import { apiDownload } from "../../api/client";
import { tokenStorage } from "../../auth/tokenStorage";
import { config } from "../../config";
import { Loading } from "../../components/ui";
import ProductDrawer from "./products/ProductDrawer";
import { formatDate } from "../shared";
import {
  ArrowLeft, Package, CheckCircle, Clock, AlertTriangle,
  FileText, Image, Download, Archive, Copy, Edit3,
  Calendar, Hash, FileEdit, Activity, Ruler, Weight,
  Beaker, Cog, DollarSign, Paperclip, Building2,
  ChevronDown, ChevronUp, ExternalLink,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Status badge                                                        */
/* ------------------------------------------------------------------ */

const statusColors: Record<string, string> = {
  Active: "bg-[#F0FDF4] text-[#22C55E]",
  Draft: "bg-[#FFF7ED] text-[#F97316]",
  Archived: "bg-[#F1F5F9] text-[#64748B]",
};

function StatusBadge({ status }: { status: string }) {
  const c = statusColors[status] ?? "bg-[#F1F5F9] text-[#64748B]";
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-semibold ${c}`}>{status}</span>;
}

/* ------------------------------------------------------------------ */
/*  Info card                                                          */
/* ------------------------------------------------------------------ */

function InfoCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string; color?: string }) {
  return (
    <div className="flex items-center gap-3 rounded-[14px] border border-[var(--border-default)] bg-[var(--bg-card)] p-4 shadow-sm">
      <span className={`flex items-center justify-center w-10 h-10 rounded-xl shrink-0 ${color ?? "bg-[var(--color-primary)]/10"}`}>
        <Icon size={18} className={color?.replace("bg-", "text-") ?? "text-[var(--color-primary)]"} />
      </span>
      <div className="min-w-0">
        <div className="text-[11px] text-[var(--text-muted)]">{label}</div>
        <div className="text-sm font-semibold text-[var(--text-primary)]">{value}</div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Collapsible Section                                                */
/* ------------------------------------------------------------------ */

function Section({ icon: Icon, title, children, defaultOpen = true }: { icon: any; title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="rounded-[16px] border border-[var(--border-default)] bg-[var(--bg-card)] shadow-sm overflow-hidden">
      <button type="button" onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full px-5 py-4 hover:bg-[var(--bg-surface-hover)] transition-all text-left">
        <div className="flex items-center gap-2.5">
          <Icon size={15} className="text-[var(--color-primary)]" />
          <h2 className="text-sm font-semibold text-[var(--text-primary)] m-0">{title}</h2>
        </div>
        {open ? <ChevronUp size={15} className="text-[var(--text-muted)]" /> : <ChevronDown size={15} className="text-[var(--text-muted)]" />}
      </button>
      {open && <div className="px-5 pb-5">{children}</div>}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Field pair                                                        */
/* ------------------------------------------------------------------ */

function Field({ label, value }: { label: string; value: string | number | boolean | null | undefined }) {
  const display = value === null || value === undefined || value === "" ? "—" : String(value);
  return (
    <div className="flex justify-between py-1.5 border-b border-[var(--border-default)]/50 last:border-0">
      <span className="text-[12px] text-[var(--text-muted)]">{label}</span>
      <span className="text-[12px] font-medium text-[var(--text-primary)] text-right">{display}</span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function AdminProductDetailPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<ProductMasterDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    setLoading(true);
    adminApi.productMaster.detail(id)
      .then(setProduct)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    adminApi.categories()
      .then((cats) => setCategories(cats.map((c: any) => ({ id: c.id, name: c.name }))))
      .catch(() => {});
  }, []);

  const handleUpdate = async (payload: Record<string, any>, files: File[]) => {
    await adminApi.productMaster.update(id, payload);
    // Upload each file — errors propagate to drawer error banner
    for (const file of files) {
      await adminApi.productMaster.uploadAttachment(id, file);
    }
    setDrawerOpen(false);
    // Reload product detail
    const updated = await adminApi.productMaster.detail(id);
    setProduct(updated);
  };

  useEffect(() => {
    setLoading(true);
    adminApi.productMaster.detail(id)
      .then(setProduct)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="py-12">
        <Loading label="Loading product details" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <AlertTriangle size={36} className="text-[var(--color-danger)] mb-4" />
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-1">Product not found</h2>
        <p className="text-[13px] text-[var(--text-secondary)] mb-4">{error ?? "This product does not exist or has been removed."}</p>
        <Link to="/admin/products" className="inline-flex items-center gap-1.5 px-4 h-9 rounded-lg bg-[var(--color-primary)] text-white text-[12px] font-semibold">
          <ArrowLeft size={14} />
          Back to Products
        </Link>
      </div>
    );
  }

  const p = product;
  const usage = p.usage;

  return (
    <>
      {/* Sticky Header */}
      <div className="sticky top-0 z-20 -mx-6 px-6 py-4 bg-[var(--bg-app)]/80 backdrop-blur-xl border-b border-[var(--border-default)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button type="button" onClick={() => navigate("/admin/products")}
              className="flex items-center justify-center w-8 h-8 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]">
              <ArrowLeft size={16} />
            </button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold text-[var(--text-primary)] m-0">{p.productName}</h1>
                <StatusBadge status={p.status} />
              </div>
              <p className="text-[12px] text-[var(--text-secondary)] mt-0.5 m-0">
                <Hash size={12} className="inline mr-1" />
                {p.productCode}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setDrawerOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 h-8 rounded-lg bg-[var(--color-primary)] text-white text-[12px] font-semibold hover:bg-[var(--color-primary-hover)] transition-all">
              <Edit3 size={13} />
              Edit
            </button>
            <button type="button" onClick={() => adminApi.productMaster.duplicate(p.id).then(() => navigate(0))}
              className="inline-flex items-center gap-1.5 px-3.5 h-8 rounded-lg border border-[var(--border-default)] text-[12px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-all">
              <Copy size={13} />
              Duplicate
            </button>
            <button type="button" onClick={() => { adminApi.productMaster.archive(p.id).then(() => navigate("/admin/products")); }}
              className="inline-flex items-center gap-1.5 px-3.5 h-8 rounded-lg border border-[var(--border-default)] text-[12px] font-medium text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10 transition-all">
              <Archive size={13} />
              Archive
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <InfoCard icon={Calendar} label="Created" value={formatDate(p.createdAtUtc)} color="bg-[var(--kpi-blue)]/10" />
        <InfoCard icon={Clock} label="Updated" value={p.updatedAtUtc ? formatDate(p.updatedAtUtc) : "—"} color="bg-[var(--kpi-teal)]/10" />
        <InfoCard icon={Building2} label="Category" value={p.categoryName ?? "—"} color="bg-[var(--kpi-purple)]/10" />
        <InfoCard icon={Package} label="Used In" value={`${usage.rfqCount + usage.quotationCount + usage.orderCount} records`} color="bg-[var(--kpi-orange)]/10" />
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
        {/* Left Column */}
        <div className="space-y-4">
          {/* Product Information */}
          <Section icon={FileText} title="Product Information">
            <div className="grid grid-cols-2 gap-x-6">
              <Field label="Product Name" value={p.productName} />
              <Field label="Product Code" value={p.productCode} />
              <Field label="Category" value={p.categoryName} />
              <Field label="Casting Type" value={p.castingType} />
              <Field label="Unit" value={p.unit} />
              <Field label="Status" value={p.status} />
            </div>
            {p.description && (
              <div className="mt-3 pt-3 border-t border-[var(--border-default)]">
                <span className="text-[11px] text-[var(--text-muted)] block mb-1">Description</span>
                <p className="text-[13px] text-[var(--text-primary)] m-0">{p.description}</p>
              </div>
            )}
          </Section>

          {/* Material Information */}
          <Section icon={Beaker} title="Material Specifications">
            <div className="grid grid-cols-2 gap-x-6">
              <Field label="Material" value={p.material} />
              <Field label="Grade" value={p.materialGrade} />
              <Field label="Weight" value={p.weight ? `${p.weight} kg` : null} />
              <Field label="Tolerance" value={p.tolerance} />
              <Field label="Density" value={p.density} />
              <Field label="Hardness" value={p.hardness} />
              <Field label="Heat Treatment" value={p.heatTreatment} />
              <Field label="Surface Finish" value={p.surfaceFinish} />
            </div>
          </Section>

          {/* Dimensions */}
          <Section icon={Ruler} title="Dimensions">
            <div className="grid grid-cols-2 gap-x-6">
              <Field label="Length" value={p.length ? `${p.length} mm` : null} />
              <Field label="Width" value={p.width ? `${p.width} mm` : null} />
              <Field label="Height" value={p.height ? `${p.height} mm` : null} />
              <Field label="Diameter" value={p.diameter ? `${p.diameter} mm` : null} />
              <Field label="Drawing Number" value={p.drawingNumber} />
              <Field label="Revision" value={p.revision} />
            </div>
          </Section>

          {/* Manufacturing Information */}
          <Section icon={Cog} title="Manufacturing">
            <div className="grid grid-cols-2 gap-x-6">
              <Field label="Pattern Number" value={p.patternNumber} />
              <Field label="Cycle Time" value={p.cycleTimeMinutes ? `${p.cycleTimeMinutes} min` : null} />
              <Field label="Core Required" value={p.coreRequired ? "Yes" : "No"} />
              <Field label="Machine Required" value={p.machineRequired ? "Yes" : "No"} />
              <Field label="Inspection Required" value={p.inspectionRequired ? "Yes" : "No"} />
              <Field label="Machining Required" value={p.machiningRequired ? "Yes" : "No"} />
            </div>
          </Section>

          {/* Pricing */}
          <Section icon={DollarSign} title="Pricing">
            <div className="grid grid-cols-2 gap-x-6">
              <Field label="Standard Cost" value={p.standardCost ? `₹ ${p.standardCost.toLocaleString()}` : null} />
              <Field label="Selling Price" value={p.sellingPrice ? `₹ ${p.sellingPrice.toLocaleString()}` : null} />
              <Field label="GST" value={p.gstPercent ? `${p.gstPercent}%` : null} />
              <Field label="HSN Code" value={p.hsnCode} />
              <Field label="Currency" value={p.currency} />
            </div>
          </Section>
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          {/* Attachments */}
          <Section icon={Paperclip} title="Attachments" defaultOpen>
            {p.attachments.length === 0 ? (
              <div className="text-center py-6 text-[var(--text-muted)] text-[12px]">
                <Paperclip size={24} className="mx-auto mb-2 opacity-40" />
                <p>No attachments</p>
              </div>
            ) : (
              <div className="space-y-2">
                {p.attachments.map((a) => (
                  <div key={a.id} className="flex items-center gap-3 rounded-lg border border-[var(--border-default)] p-3">
                    {a.contentType.startsWith("image/") ? (
                      <SecureImage
                        src={adminApi.productMaster.downloadAttachmentUrl(p.id, a.id)}
                        alt={a.fileName}
                      />
                    ) : (
                      <span className="flex items-center justify-center w-10 h-10 rounded-lg shrink-0 bg-[var(--color-primary)]/10">
                        <FileText size={18} className="text-[var(--color-primary)]" />
                      </span>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-medium text-[var(--text-primary)] truncate">{a.fileName}</p>
                      <p className="text-[10px] text-[var(--text-muted)]">
                        {a.sizeBytes > 1024 * 1024
                          ? `${(a.sizeBytes / (1024 * 1024)).toFixed(1)} MB`
                          : `${(a.sizeBytes / 1024).toFixed(0)} KB`}
                      </p>
                    </div>
                    <button type="button" onClick={() => apiDownload(adminApi.productMaster.downloadAttachmentUrl(p.id, a.id), a.fileName)}
                      className="flex items-center justify-center w-7 h-7 rounded-md text-[var(--text-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--bg-surface-hover)]">
                      <Download size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Section>

          {/* Usage */}
          <Section icon={Activity} title="Usage">
            <div className="space-y-3">
              <UsageRow label="RFQs" count={usage.rfqCount} />
              <UsageRow label="Quotations" count={usage.quotationCount} />
              <UsageRow label="Orders" count={usage.orderCount} />
            </div>
          </Section>
        </div>
      </div>

      {/* Edit Drawer */}
      <ProductDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSave={handleUpdate}
        categories={categories}
        initialData={product ? mapProductToFormData(product) : undefined}
      />
    </>
  );
}

function mapProductToFormData(p: ProductMasterDetail): Record<string, any> {
  return {
    productName: p.productName,
    productCode: p.productCode,
    description: p.description ?? "",
    categoryId: p.categoryId ?? "",
    castingType: p.castingType ?? "",
    unit: p.unit ?? "",
    status: p.status,
    material: p.material ?? "",
    materialGrade: p.materialGrade ?? "",
    weight: p.weight,
    tolerance: p.tolerance ?? "",
    density: p.density ?? "",
    hardness: p.hardness ?? "",
    heatTreatment: p.heatTreatment ?? "",
    surfaceFinish: p.surfaceFinish ?? "",
    length: p.length,
    width: p.width,
    height: p.height,
    diameter: p.diameter,
    drawingNumber: p.drawingNumber ?? "",
    revision: p.revision ?? "",
    patternNumber: p.patternNumber ?? "",
    coreRequired: p.coreRequired,
    machineRequired: p.machineRequired,
    inspectionRequired: p.inspectionRequired,
    machiningRequired: p.machiningRequired,
    cycleTimeMinutes: p.cycleTimeMinutes,
    standardCost: p.standardCost,
    sellingPrice: p.sellingPrice,
    gstPercent: p.gstPercent,
    hsnCode: p.hsnCode ?? "",
    currency: p.currency ?? "INR",
    _files: [],
  };
}

function UsageRow({ label, count }: { label: string; count: number }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-[var(--border-default)]/50 last:border-0">
      <span className="text-[12px] text-[var(--text-secondary)]">{label}</span>
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[var(--color-primary)]/10 text-[11px] font-semibold text-[var(--color-primary)]">
        {count}
      </span>
    </div>
  );
}

/* ── Secure Image (loads via authenticated fetch) ──────────────────── */

function SecureImage({ src, alt }: { src: string; alt: string }) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const token = tokenStorage.getAccessToken();
        const response = await fetch(`${config.apiBaseUrl}${src}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          credentials: "include",
        });
        if (!response.ok) return;
        const blob = await response.blob();
        if (!cancelled) setBlobUrl(URL.createObjectURL(blob));
      } catch { /* ignore */ }
    })();
    return () => { cancelled = true; if (blobUrl) URL.revokeObjectURL(blobUrl); };
  }, [src]);

  if (!blobUrl) {
    return <span className="flex items-center justify-center w-10 h-10 rounded-lg shrink-0 bg-[var(--bg-surface-hover)] animate-pulse" />;
  }

  return (
    <img
      src={blobUrl}
      alt={alt}
      className="w-10 h-10 rounded-lg object-cover shrink-0 bg-[var(--bg-surface-hover)]"
    />
  );
}