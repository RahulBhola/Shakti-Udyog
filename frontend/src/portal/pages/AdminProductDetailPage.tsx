import { useEffect, useState, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { adminApi, type ProductMasterDetail } from "../../api/adminApi";
import { apiDownload } from "../../api/client";
import { tokenStorage } from "../../auth/tokenStorage";
import { config } from "../../config";
import { Loading } from "../../components/ui";
import ProductDrawer from "./products/ProductDrawer";
import { formatDate } from "../shared";
import { getThemedImage } from "../../utils/themeImage";
import {
  ArrowLeft, Package, Clock, AlertTriangle,
  FileText, Download, Archive, Copy, Edit3,
  Calendar, Hash, Activity, Ruler,
  Beaker, Cog, Paperclip, Building2,
  ChevronDown, ChevronUp, Sun, Moon, Upload, Plus,
  FileSpreadsheet, Image as ImageIcon,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Status badge                                                        */
/* ------------------------------------------------------------------ */

const statusColors: Record<string, string> = {
  Active: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20",
  Draft: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20",
  Archived: "bg-neutral-500/10 text-neutral-600 dark:text-neutral-400 border border-neutral-500/20",
};

function StatusBadge({ status }: { status: string }) {
  const c = statusColors[status] ?? "bg-neutral-500/10 text-neutral-600 dark:text-neutral-400 border border-neutral-500/20";
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-semibold ${c}`}>{status}</span>;
}

/* ------------------------------------------------------------------ */
/*  Info card                                                          */
/* ------------------------------------------------------------------ */

function InfoCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string; color?: string }) {
  return (
    <div className="flex items-center gap-3 rounded-[14px] border border-neutral-200/90 dark:border-white/[0.08] bg-white dark:bg-[#0f121a] p-4 shadow-sm">
      <span className={`flex items-center justify-center w-10 h-10 rounded-xl shrink-0 ${color ?? "bg-[var(--color-primary)]/10"}`}>
        <Icon size={18} className={color?.replace("bg-", "text-") ?? "text-[var(--color-primary)]"} />
      </span>
      <div className="min-w-0">
        <div className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400">{label}</div>
        <div className="text-sm font-bold text-neutral-900 dark:text-white truncate">{value}</div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Collapsible Section                                                */
/* ------------------------------------------------------------------ */

function Section({
  icon: Icon,
  title,
  children,
  defaultOpen = true,
  action,
}: {
  icon: any;
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  action?: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="rounded-[16px] border border-neutral-200/90 dark:border-white/[0.08] bg-white dark:bg-[#0f121a] shadow-sm overflow-hidden">
      <div className="flex items-center justify-between w-full px-5 py-4 bg-neutral-50/50 dark:bg-white/[0.02] border-b border-neutral-200/60 dark:border-white/[0.06]">
        <div
          className="flex items-center gap-2.5 cursor-pointer flex-1"
          onClick={() => setOpen(!open)}
        >
          <Icon size={16} className="text-[var(--color-primary)]" />
          <h2 className="text-sm font-bold text-neutral-900 dark:text-white m-0">{title}</h2>
        </div>
        <div className="flex items-center gap-2">
          {action}
          <button
            type="button"
            onClick={() => setOpen(!open)}
            className="p-1 rounded-md text-neutral-400 hover:text-neutral-700 dark:hover:text-white"
          >
            {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>
      {open && <div className="px-5 py-4">{children}</div>}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Field pair                                                        */
/* ------------------------------------------------------------------ */

function Field({ label, value }: { label: string; value: string | number | boolean | null | undefined }) {
  const display = value === null || value === undefined || value === "" ? "—" : String(value);
  return (
    <div className="flex justify-between py-2 border-b border-neutral-100 dark:border-white/[0.04] last:border-0">
      <span className="text-[12px] font-medium text-neutral-500 dark:text-neutral-400">{label}</span>
      <span className="text-[12px] font-semibold text-neutral-900 dark:text-neutral-200 text-right">{display}</span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function AdminProductDetailPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [product, setProduct] = useState<ProductMasterDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);

  const loadProduct = () => {
    setLoading(true);
    adminApi.productMaster.detail(id)
      .then(setProduct)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadProduct();
  }, [id]);

  useEffect(() => {
    adminApi.categories()
      .then((cats) => setCategories(cats.map((c: any) => ({ id: c.id, name: c.name }))))
      .catch(() => {});
  }, []);

  const handleUpdate = async (payload: Record<string, any>, files: File[]) => {
    await adminApi.productMaster.update(id, payload);
    for (const file of files) {
      await adminApi.productMaster.uploadAttachment(id, file);
    }
    setDrawerOpen(false);
    loadProduct();
  };

  const handleDirectUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        await adminApi.productMaster.uploadAttachment(id, files[i]);
      }
      loadProduct();
    } catch (e: any) {
      alert("Failed to upload attachment: " + e.message);
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-12">
        <Loading label="Loading product specifications..." />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <AlertTriangle size={36} className="text-red-500 mb-4" />
        <h2 className="text-lg font-bold text-neutral-900 dark:text-white mb-1">Product not found</h2>
        <p className="text-[13px] text-neutral-500 mb-4">{error ?? "This product does not exist or has been removed."}</p>
        <Link to="/admin/products" className="inline-flex items-center gap-1.5 px-4 h-9 rounded-lg bg-[var(--color-primary)] text-white text-[12px] font-semibold">
          <ArrowLeft size={14} />
          Back to Products
        </Link>
      </div>
    );
  }

  const p = product;
  const usage = p.usage;

  const darkImage = p.imageUrl || (p.lightImageUrl ? getThemedImage(p.lightImageUrl, false) : "/images/Industrial Iron Casting.png");
  const lightImage = p.lightImageUrl || (p.imageUrl ? getThemedImage(p.imageUrl, true) : "/images/Industrial Iron Casting light mode.png");

  return (
    <div className="space-y-6">
      {/* Sticky Header */}
      <div className="sticky top-0 z-20 -mx-6 px-6 py-4 bg-white/90 dark:bg-[#090b10]/90 backdrop-blur-xl border-b border-neutral-200 dark:border-white/10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate("/admin/products")}
              className="flex items-center justify-center w-9 h-9 rounded-xl border border-neutral-200 dark:border-white/10 bg-neutral-50 hover:bg-neutral-100 dark:bg-white/5 dark:hover:bg-white/10 text-neutral-600 dark:text-neutral-300 transition-all"
            >
              <ArrowLeft size={16} />
            </button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-extrabold text-neutral-900 dark:text-white tracking-tight m-0">{p.productName}</h1>
                <StatusBadge status={p.status} />
              </div>
              <p className="text-[12px] font-mono text-neutral-500 dark:text-neutral-400 mt-0.5 m-0">
                <Hash size={12} className="inline mr-1" />
                {p.productCode}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 h-9 rounded-xl bg-[var(--color-primary)] text-white text-xs font-bold hover:brightness-110 shadow-sm shadow-orange-500/20 transition-all"
            >
              <Edit3 size={14} />
              Edit Specification
            </button>
            <button
              type="button"
              onClick={() => adminApi.productMaster.duplicate(p.id).then(() => navigate(0))}
              className="inline-flex items-center gap-1.5 px-3.5 h-9 rounded-xl border border-neutral-200 dark:border-white/10 bg-neutral-50 hover:bg-neutral-100 dark:bg-white/5 dark:hover:bg-white/10 text-xs font-semibold text-neutral-700 dark:text-neutral-300 transition-all"
            >
              <Copy size={13} />
              Duplicate
            </button>
            <button
              type="button"
              onClick={() => { adminApi.productMaster.archive(p.id).then(() => navigate("/admin/products")); }}
              className="inline-flex items-center gap-1.5 px-3.5 h-9 rounded-xl border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/10 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 transition-all"
            >
              <Archive size={13} />
              Archive
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <InfoCard icon={Calendar} label="Created" value={formatDate(p.createdAtUtc)} color="bg-blue-500/10" />
        <InfoCard icon={Clock} label="Last Updated" value={p.updatedAtUtc ? formatDate(p.updatedAtUtc) : "—"} color="bg-teal-500/10" />
        <InfoCard icon={Building2} label="Category" value={p.categoryName ?? "—"} color="bg-purple-500/10" />
        <InfoCard icon={Package} label="Referenced In" value={`${usage.enquiryCount + usage.quotationCount + usage.orderCount} records`} color="bg-orange-500/10" />
      </div>

      {/* DUAL-THEME 3D STUDIO VISUAL SHOWCASE */}
      <div className="rounded-2xl border border-neutral-200/90 dark:border-white/[0.08] bg-white dark:bg-[#0f121a] p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-neutral-100 dark:border-white/[0.06] pb-3">
          <div className="flex items-center gap-2">
            <ImageIcon size={18} className="text-[var(--color-primary)]" />
            <h2 className="text-sm font-bold text-neutral-900 dark:text-white m-0">3D Studio Renders & Theme Visuals</h2>
          </div>
          <span className="text-[11px] font-mono text-neutral-500 dark:text-neutral-400">
            Dual-Theme Foundry Asset Sync
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Dark Mode Studio Stage */}
          <div className="rounded-2xl border border-white/10 bg-[#090b10] p-4 flex flex-col justify-between shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/15 border border-blue-500/30 text-sky-400 font-mono text-[11px] font-bold">
                <Moon size={12} />
                <span>Dark Theme Render</span>
              </div>
              <span className="text-[10px] font-mono text-neutral-400 truncate max-w-[200px]">{darkImage}</span>
            </div>

            <div className="w-full h-52 rounded-xl flex items-center justify-center p-4 bg-gradient-to-b from-[#161a26] to-[#0d1017] border border-white/5 my-2">
              <img
                src={darkImage}
                alt={`${p.productName} Dark Render`}
                className="max-h-44 max-w-[90%] w-auto h-auto object-contain filter drop-shadow-[0_12px_24px_rgba(0,0,0,0.8)] transition-transform hover:scale-105 duration-300"
              />
            </div>

            <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400 mt-2 pt-2 border-t border-white/5">
              <span>Resolution: High-Res 3D Studio</span>
              <a href={darkImage} target="_blank" rel="noreferrer" className="text-orange-400 hover:underline">
                View Full Size ↗
              </a>
            </div>
          </div>

          {/* Light Mode Studio Stage */}
          <div className="rounded-2xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#090b10] p-4 flex flex-col justify-between shadow-md dark:shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-400 font-mono text-[11px] font-bold">
                <Sun size={12} />
                <span>Light Theme Render</span>
              </div>
              <span className="text-[10px] font-mono text-neutral-500 dark:text-neutral-400 truncate max-w-[200px]">{lightImage}</span>
            </div>

            <div className="w-full h-52 rounded-xl flex items-center justify-center p-4 bg-gradient-to-b from-neutral-50 to-neutral-100/90 dark:from-[#1e222d] dark:to-[#12151e] border border-neutral-200/80 dark:border-white/5 my-2">
              <img
                src={lightImage}
                alt={`${p.productName} Light Render`}
                className="max-h-44 max-w-[90%] w-auto h-auto object-contain filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.15)] transition-transform hover:scale-105 duration-300"
              />
            </div>

            <div className="flex items-center justify-between text-[11px] font-mono text-neutral-500 dark:text-neutral-400 mt-2 pt-2 border-t border-neutral-100 dark:border-white/5">
              <span>Resolution: High-Res 3D Studio</span>
              <a href={lightImage} target="_blank" rel="noreferrer" className="text-orange-600 dark:text-orange-400 hover:underline">
                View Full Size ↗
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
        {/* Left Column: Specifications */}
        <div className="space-y-5">
          {/* Product Information */}
          <Section icon={FileText} title="Product Master Details">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
              <Field label="Product Name" value={p.productName} />
              <Field label="Product Code" value={p.productCode} />
              <Field label="Category" value={p.categoryName} />
              <Field label="Casting Type" value={p.castingType} />
              <Field label="Application" value={p.application} />
              <Field label="Unit of Measure" value={p.unit} />
              <Field label="Lifecycle Status" value={p.status} />
              <Field label="Standard Cost" value={p.standardCost ? `₹ ${p.standardCost.toLocaleString()}` : null} />
              <Field label="Selling Price" value={p.sellingPrice ? `₹ ${p.sellingPrice.toLocaleString()}` : null} />
            </div>
            {p.description && (
              <div className="mt-3 pt-3 border-t border-neutral-100 dark:border-white/[0.04]">
                <span className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 block mb-1">Engineering Description & Scope</span>
                <p className="text-[13px] leading-relaxed text-neutral-800 dark:text-neutral-200 m-0">{p.description}</p>
              </div>
            )}
          </Section>

          {/* Material Information */}
          <Section icon={Beaker} title="Metallurgical & Physical Specifications">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
              <Field label="Base Material" value={p.material} />
              <Field label="Material Grade" value={p.materialGrade} />
              <Field label="Tensile Strength" value={p.tensileStrength} />
              <Field label="Component Weight" value={p.weight ? `${p.weight} kg` : null} />
              <Field label="Machining Tolerance" value={p.tolerance} />
              <Field label="Density" value={p.density} />
              <Field label="Hardness (Brinell)" value={p.hardness} />
              <Field label="Heat Treatment" value={p.heatTreatment} />
              <Field label="Surface Finish" value={p.surfaceFinish} />
            </div>
          </Section>

          {/* Dimensions */}
          <Section icon={Ruler} title="Dimensional Specifications">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
              <Field label="Length" value={p.length ? `${p.length} mm` : null} />
              <Field label="Width" value={p.width ? `${p.width} mm` : null} />
              <Field label="Height" value={p.height ? `${p.height} mm` : null} />
              <Field label="Outer Diameter" value={p.diameter ? `${p.diameter} mm` : null} />
              <Field label="Drawing Number" value={p.drawingNumber} />
              <Field label="Revision" value={p.revision} />
            </div>
          </Section>

          {/* Manufacturing Information */}
          <Section icon={Cog} title="Foundry Manufacturing Constraints">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
              <Field label="Pattern Tooling Number" value={p.patternNumber} />
              <Field label="Foundry Cycle Time" value={p.cycleTimeMinutes ? `${p.cycleTimeMinutes} min` : null} />
              <Field label="Core Required" value={p.coreRequired ? "Yes" : "No"} />
              <Field label="Moulding Machine Required" value={p.machineRequired ? "Yes" : "No"} />
              <Field label="NDT / CMM Inspection Required" value={p.inspectionRequired ? "Yes" : "No"} />
              <Field label="Post-Cast CNC Machining" value={p.machiningRequired ? "Yes" : "No"} />
            </div>
          </Section>
        </div>

        {/* Right Column: Attachments & Usage */}
        <div className="space-y-5">
          {/* Attachments Section */}
          <Section
            icon={Paperclip}
            title="Attached Documents & Drawings"
            defaultOpen
            action={
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[var(--color-primary)] text-white text-[11px] font-bold hover:brightness-110 shadow-sm"
              >
                <Upload size={12} />
                <span>{uploading ? "Uploading..." : "Attach File"}</span>
              </button>
            }
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => void handleDirectUpload(e.target.files)}
              accept=".pdf,.dwg,.step,.stp,.dxf,.png,.jpg,.jpeg,.zip"
            />

            {p.attachments.length === 0 ? (
              <div className="text-center py-8 text-neutral-400 text-xs">
                <Paperclip size={28} className="mx-auto mb-2 opacity-40" />
                <p className="font-medium text-neutral-500 dark:text-neutral-400">No attachments uploaded yet.</p>
                <p className="text-[11px] text-neutral-400 mt-1">Upload CAD drawings, PDF test certificates, or 3D renders.</p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-white/10 text-xs font-semibold text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-white/5"
                >
                  <Plus size={13} /> Select Files
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {p.attachments.map((a) => {
                  const isImage = a.contentType.startsWith("image/");
                  const isPdf = a.contentType.includes("pdf") || a.fileName.toLowerCase().endsWith(".pdf");

                  return (
                    <div
                      key={a.id}
                      className="flex items-center gap-3 rounded-xl border border-neutral-200/80 dark:border-white/[0.08] bg-neutral-50/50 dark:bg-white/[0.02] p-3 hover:border-orange-500/30 transition-all"
                    >
                      {isImage ? (
                        <SecureAttachmentThumbnail
                          productId={p.id}
                          attachmentId={a.id}
                          fileName={a.fileName}
                        />
                      ) : isPdf ? (
                        <span className="flex items-center justify-center w-10 h-10 rounded-xl shrink-0 bg-red-500/10 text-red-500 border border-red-500/20">
                          <FileText size={18} />
                        </span>
                      ) : (
                        <span className="flex items-center justify-center w-10 h-10 rounded-xl shrink-0 bg-blue-500/10 text-blue-500 border border-blue-500/20">
                          <FileSpreadsheet size={18} />
                        </span>
                      )}

                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-bold text-neutral-900 dark:text-white truncate m-0">{a.fileName}</p>
                        <p className="text-[10.5px] text-neutral-500 dark:text-neutral-400 mt-0.5 m-0">
                          {a.description ? `${a.description} • ` : ""}
                          {a.sizeBytes > 1024 * 1024
                            ? `${(a.sizeBytes / (1024 * 1024)).toFixed(1)} MB`
                            : `${(a.sizeBytes / 1024).toFixed(0)} KB`}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => apiDownload(adminApi.productMaster.downloadAttachmentUrl(p.id, a.id), a.fileName)}
                        className="flex items-center justify-center w-8 h-8 rounded-lg text-neutral-500 hover:text-[var(--color-primary)] hover:bg-neutral-100 dark:hover:bg-white/10 transition-all"
                        title="Download Attachment"
                      >
                        <Download size={15} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </Section>

          {/* ERP Cross-Module Usage */}
          <Section icon={Activity} title="ERP Cross-Module Tracking">
            <div className="space-y-3">
              <UsageRow label="Active Enquiries" count={usage.enquiryCount} />
              <UsageRow label="Formal Quotations" count={usage.quotationCount} />
              <UsageRow label="Production Work Orders" count={usage.orderCount} />
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
    </div>
  );
}

function mapProductToFormData(p: ProductMasterDetail): Record<string, any> {
  return {
    productName: p.productName,
    productCode: p.productCode,
    description: p.description ?? "",
    categoryId: p.categoryId ?? "",
    castingType: p.castingType ?? "",
    unit: p.unit ?? "Nos",
    status: p.status,
    material: p.material ?? "",
    materialGrade: p.materialGrade ?? "",
    weight: p.weight,
    tolerance: p.tolerance ?? "",
    density: p.density ?? "",
    hardness: p.hardness ?? "",
    tensileStrength: p.tensileStrength ?? "",
    application: p.application ?? "",
    imageUrl: p.imageUrl ?? "",
    lightImageUrl: p.lightImageUrl ?? "",
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
    hsnCode: p.hsnCode ?? "7325",
    currency: p.currency ?? "INR",
    _files: [],
  };
}

function UsageRow({ label, count }: { label: string; count: number }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-neutral-100 dark:border-white/[0.04] last:border-0">
      <span className="text-[12px] font-medium text-neutral-600 dark:text-neutral-400">{label}</span>
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-[11px] font-bold text-neutral-900 dark:text-white">
        {count}
      </span>
    </div>
  );
}

/* ── Secure Image Attachment Thumbnail ─────────────────────────────── */

function SecureAttachmentThumbnail({
  productId,
  attachmentId,
  fileName,
}: {
  productId: string;
  attachmentId: string;
  fileName: string;
}) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const token = tokenStorage.getAccessToken();
        const url = adminApi.productMaster.downloadAttachmentUrl(productId, attachmentId);
        const response = await fetch(`${config.apiBaseUrl}${url}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          credentials: "include",
        });
        if (!response.ok) return;
        const blob = await response.blob();
        if (!cancelled) setBlobUrl(URL.createObjectURL(blob));
      } catch { /* ignore */ }
    })();
    return () => { cancelled = true; if (blobUrl) URL.revokeObjectURL(blobUrl); };
  }, [productId, attachmentId]);

  if (!blobUrl) {
    return <span className="flex items-center justify-center w-10 h-10 rounded-xl shrink-0 bg-neutral-100 dark:bg-white/5 animate-pulse" />;
  }

  return (
    <img
      src={blobUrl}
      alt={fileName}
      className="w-10 h-10 rounded-xl object-contain shrink-0 bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 p-0.5"
    />
  );
}