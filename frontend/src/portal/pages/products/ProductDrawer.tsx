import { useEffect, useState } from "react";
import { X, ChevronLeft, ChevronRight, Check, FileText, Sparkles } from "lucide-react";
import BasicInfoStep from "./BasicInfoStep";
import MaterialStep from "./MaterialStep";
import DimensionStep from "./DimensionStep";
import ManufacturingStep from "./ManufacturingStep";
import PricingStep from "./PricingStep";
import AttachmentUploader from "./AttachmentUploader";
import ReviewStep from "./ReviewStep";

const STEPS = [
  { key: "basic", label: "Basic Information" },
  { key: "material", label: "Material" },
  { key: "dimensions", label: "Dimensions" },
  { key: "manufacturing", label: "Manufacturing" },
  { key: "pricing", label: "Pricing" },
  { key: "attachments", label: "Attachments" },
  { key: "review", label: "Review" },
];

interface ProductDrawerProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: Record<string, any>, files: File[]) => Promise<void>;
  categories?: { id: string; name: string }[];
  initialData?: Record<string, any>;
}

export default function ProductDrawer({ open, onClose, onSave, categories, initialData }: ProductDrawerProps) {
  const isEditing = !!initialData;
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [data, setData] = useState<Record<string, any>>(initialData ?? {
    productName: "", productCode: "", description: "", categoryId: "", castingType: "", unit: "", status: "Draft",
    application: "", imageUrl: "", lightImageUrl: "",
    material: "", materialGrade: "", weight: null, tolerance: "", density: "", hardness: "", tensileStrength: "", heatTreatment: "", surfaceFinish: "",
    length: null, width: null, height: null, diameter: null, drawingNumber: "", revision: "",
    patternNumber: "", coreRequired: false, machineRequired: false, inspectionRequired: false, machiningRequired: false, cycleTimeMinutes: null,
    standardCost: null, sellingPrice: null, gstPercent: null, hsnCode: "", currency: "INR",
    _productImageFile: null as File | null,
    _files: [] as File[],
  });

  const handleChange = (field: string, value: any) => {
    setData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSetProductImage = (file: File | null) => {
    setData((prev) => ({ ...prev, _productImageFile: file }));
    if (saveError) setSaveError(null);
  };

  const handleAddFiles = (fileList: FileList | null) => {
    if (!fileList) return;
    const newFiles = Array.from(fileList);
    setData((prev) => ({ ...prev, _files: [...(prev._files || []), ...newFiles] }));
  };

  const handleRemoveFile = (index: number) => {
    setData((prev) => ({
      ...prev,
      _files: (prev._files || []).filter((_: File, i: number) => i !== index),
    }));
  };

  const hasProductImage = Boolean(
    data._productImageFile ||
    data.imageUrl ||
    data.lightImageUrl ||
    (initialData && (initialData.imageUrl || initialData.lightImageUrl || initialData.firstAttachmentId))
  );

  const handleNext = () => {
    setSaveError(null);
    setStep(Math.min(STEPS.length - 1, step + 1));
  };

  const handleSave = async (targetStatus?: string) => {
    const finalStatus = targetStatus || data.status || "Draft";

    // Validate required fields
    if (!data.productName?.trim()) {
      setSaveError("Please enter a Product Name before saving.");
      setStep(0);
      return;
    }

    // For publishing as Active, require product image
    if (finalStatus === "Active" && !hasProductImage) {
      setSaveError("Cannot publish as Active: A primary product image is required. Please upload an image in Attachments (Step 6) or save as Draft.");
      setStep(5);
      return;
    }

    setSaving(true);
    try {
      // Clean payload: convert empty strings to null for nullable server-side fields
      const nullableFields = [
        "categoryId", "description", "castingType", "unit", "material", "materialGrade",
        "tolerance", "density", "hardness", "tensileStrength", "heatTreatment", "surfaceFinish",
        "application", "imageUrl", "lightImageUrl",
        "drawingNumber", "revision", "patternNumber", "hsnCode", "currency",
      ];
      const payload: Record<string, any> = {};
      const files: File[] = [];

      if (data._productImageFile) {
        files.push(data._productImageFile);
      }
      if (data._files && Array.isArray(data._files)) {
        files.push(...data._files);
      }

      for (const [key, value] of Object.entries(data)) {
        if (key.startsWith("_")) continue;
        if (nullableFields.includes(key) && value === "") {
          payload[key] = null;
        } else {
          payload[key] = value;
        }
      }

      // Explicitly set target status
      payload.status = finalStatus;

      await onSave(payload, files);
      setStep(0);
    } catch (err: any) {
      setSaveError(err?.message || "Failed to save product. Check console for details.");
      console.error("Product save error:", err);
    } finally {
      setSaving(false);
    }
  };

  // Reset error state and lock body scroll when drawer opens
  useEffect(() => {
    if (open) {
      setSaveError(null);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  const renderStep = () => {
    switch (step) {
      case 0: return <BasicInfoStep data={data} onChange={handleChange} categories={categories} />;
      case 1: return <MaterialStep data={data} onChange={handleChange} />;
      case 2: return <DimensionStep data={data} onChange={handleChange} />;
      case 3: return <ManufacturingStep data={data} onChange={handleChange} />;
      case 4: return <PricingStep data={data} onChange={handleChange} />;
      case 5: return (
        <AttachmentUploader
          productImageFile={data._productImageFile ?? null}
          existingImageUrl={data.imageUrl || data.lightImageUrl}
          onSetProductImage={handleSetProductImage}
          files={data._files ?? []}
          onAdd={handleAddFiles}
          onRemove={handleRemoveFile}
        />
      );
      case 6: return <ReviewStep data={data} onChange={handleChange} categories={categories} />;
      default: return null;
    }
  };

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 z-40 transition-opacity" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-2xl bg-[var(--bg-card)] border-l border-[var(--border-default)] shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-default)] shrink-0">
          <div>
            <h2 className="text-lg font-bold text-[var(--text-primary)]">
              {isEditing ? "Edit Product" : "New Product"}
            </h2>
            <p className="text-[12px] text-[var(--text-muted)]">
              Step {step + 1} of {STEPS.length} — {STEPS[step].label}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body with step sidebar */}
        <div className="flex-1 flex overflow-hidden">
          {/* Step list sidebar */}
          <div className="w-48 border-r border-[var(--border-default)] p-4 shrink-0 hidden md:block">
            <div className="space-y-0">
              {STEPS.map((s, i) => (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => {
                    setSaveError(null);
                    setStep(i);
                  }}
                  className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-left transition-all text-[12px] cursor-pointer ${
                    i === step
                      ? "bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-semibold"
                      : i < step
                      ? "text-[var(--text-primary)]"
                      : "text-[var(--text-muted)]"
                  }`}
                >
                  <span className={`flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold shrink-0 ${
                    i === step
                      ? "bg-[var(--color-primary)] text-white"
                      : i < step
                      ? "bg-[var(--color-success)] text-white"
                      : "bg-[var(--bg-surface-hover)] text-[var(--text-muted)]"
                  }`}>
                    {i < step ? <Check size={10} /> : i + 1}
                  </span>
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Step content */}
          <div className="flex-1 overflow-y-auto p-6">
            {saveError && (
              <div className="mb-4 p-3 rounded-lg bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/20 text-[12px] text-[var(--color-danger)] font-medium">
                {saveError}
              </div>
            )}
            {renderStep()}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[var(--border-default)] bg-[var(--bg-card)] shrink-0 gap-3">
          <button
            type="button"
            onClick={() => setStep(Math.max(0, step - 1))}
            disabled={step === 0}
            className="inline-flex items-center gap-1.5 px-3.5 h-9 rounded-lg border border-[var(--border-default)] text-[12px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer"
          >
            <ChevronLeft size={14} />
            Back
          </button>

          <div className="flex items-center gap-2.5">
            {/* Save as Draft Button */}
            <button
              type="button"
              onClick={() => handleSave("Draft")}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-3.5 h-9 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400 text-[12px] font-semibold hover:bg-amber-500/20 disabled:opacity-60 transition-all cursor-pointer shadow-sm"
              title="Save specifications as an internal Draft"
            >
              <FileText size={14} />
              {saving ? "Saving..." : "Save as Draft"}
            </button>

            {step < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={handleNext}
                className="inline-flex items-center gap-1.5 px-4 h-9 rounded-lg bg-[var(--color-primary)] text-white text-[12px] font-semibold hover:bg-[var(--color-primary-hover)] transition-all cursor-pointer shadow-sm"
              >
                Next
                <ChevronRight size={14} />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleSave("Active")}
                disabled={saving}
                className="inline-flex items-center gap-1.5 px-5 h-9 rounded-lg bg-[var(--color-success)] text-white text-[12px] font-semibold hover:opacity-90 disabled:opacity-60 transition-all cursor-pointer shadow-sm shadow-emerald-500/20"
              >
                <Sparkles size={14} />
                {saving ? "Saving..." : isEditing ? "Update & Publish" : "Create & Publish"}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}