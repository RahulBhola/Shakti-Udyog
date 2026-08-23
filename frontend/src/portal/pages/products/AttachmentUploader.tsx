import { useState, useRef } from "react";
import { Upload, X, FileText, Image as ImageIcon, File, CheckCircle2, AlertTriangle, Sparkles } from "lucide-react";
import { getThemedImage } from "../../../utils/themeImage";

interface AttachmentUploaderProps {
  productImageFile: File | null;
  existingImageUrl?: string | null;
  onSetProductImage: (file: File | null) => void;
  files: File[];
  onAdd: (files: FileList | null) => void;
  onRemove: (index: number) => void;
}

export default function AttachmentUploader({
  productImageFile,
  existingImageUrl,
  onSetProductImage,
  files,
  onAdd,
  onRemove,
}: AttachmentUploaderProps) {
  const [imgDragging, setImgDragging] = useState(false);
  const [docDragging, setDocDragging] = useState(false);

  const imgInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  const hasProductImage = Boolean(productImageFile || existingImageUrl);
  const resolvedExistingUrl = existingImageUrl ? getThemedImage(existingImageUrl, false) : null;
  const previewSrc = productImageFile ? URL.createObjectURL(productImageFile) : resolvedExistingUrl;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-bold text-[var(--text-primary)] m-0">Product Image & Technical Attachments</h3>
        <p className="text-[12px] text-[var(--text-muted)] mt-1">
          Upload a transparent PNG/WebP product image that seamlessly renders across all themes.
        </p>
      </div>

      {/* Requirement Notification Banner */}
      <div
        className={`flex items-center gap-2.5 p-3 rounded-xl border text-xs font-medium transition-all ${
          hasProductImage
            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
            : "bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300"
        }`}
      >
        {hasProductImage ? (
          <>
            <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
            <span>Product image attached.</span>
          </>
        ) : (
          <>
            <AlertTriangle size={16} className="text-amber-500 shrink-0" />
            <span>
              <strong>Image Required:</strong> Please upload a primary product image (transparent PNG or WebP recommended).
            </span>
          </>
        )}
      </div>

      {/* ── Section 1: Single Primary Product Image Preview ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[12px] font-bold uppercase tracking-wider text-[var(--text-primary)] flex items-center gap-1.5">
            <Sparkles size={14} className="text-[var(--color-primary)]" />
            Primary Component Image <span className="text-red-500">*</span>
          </span>
          <span className="text-[11px] font-mono text-[var(--text-muted)]">Transparent PNG / WebP</span>
        </div>

        <input
          ref={imgInputRef}
          type="file"
          accept="image/png,image/webp,image/jpeg,image/jpg"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) onSetProductImage(e.target.files[0]);
          }}
        />

        {previewSrc ? (
          <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-primary)]">
                Product Image Preview
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => imgInputRef.current?.click()}
                  className="px-2.5 py-1 rounded-lg bg-[var(--color-primary)] text-white text-[11px] font-semibold hover:brightness-110 shadow-sm transition-all"
                >
                  Replace Image
                </button>
                <button
                  type="button"
                  onClick={() => onSetProductImage(null)}
                  className="px-2.5 py-1 rounded-lg border border-red-500/20 bg-red-500/10 text-red-500 text-[11px] font-semibold hover:bg-red-500/20 transition-all"
                >
                  Remove
                </button>
              </div>
            </div>

            {/* Single Unified Studio Stage */}
            <div className="w-full h-48 rounded-xl border border-neutral-200/80 dark:border-white/10 bg-gradient-to-b from-neutral-50 to-neutral-100/90 dark:from-[#161a26] dark:to-[#0d1017] flex items-center justify-center p-4 shadow-inner">
              <img
                src={previewSrc}
                alt="Product Preview"
                className="max-h-40 max-w-[85%] w-auto h-auto object-contain filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.12)] dark:drop-shadow-[0_12px_24px_rgba(0,0,0,0.85)] transition-transform hover:scale-105 duration-300"
              />
            </div>

            {productImageFile && (
              <div className="flex items-center justify-between text-[11px] font-mono text-[var(--text-muted)] pt-1 border-t border-[var(--border-default)]">
                <span className="truncate">Selected file: {productImageFile.name}</span>
                <span className="shrink-0 ml-2">{(productImageFile.size / 1024).toFixed(0)} KB</span>
              </div>
            )}
          </div>
        ) : (
          <div
            onDragOver={(e) => { e.preventDefault(); setImgDragging(true); }}
            onDragLeave={() => setImgDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setImgDragging(false);
              if (e.dataTransfer.files && e.dataTransfer.files[0]) onSetProductImage(e.dataTransfer.files[0]);
            }}
            onClick={() => imgInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer ${
              imgDragging
                ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10"
                : "border-[var(--border-default)] hover:border-[var(--color-primary)]/60 bg-[var(--bg-surface)]"
            }`}
          >
            <Upload size={32} className="mx-auto mb-2 text-[var(--color-primary)] opacity-80" />
            <p className="text-[13px] font-bold text-[var(--text-primary)]">
              Drop product image here or click to browse
            </p>
            <p className="text-[11px] text-[var(--text-muted)] mt-1">
              Supports <strong>PNG (transparent background)</strong>, <strong>WebP</strong>, or <strong>JPG</strong> (Max 10 MB)
            </p>
          </div>
        )}
      </div>

      {/* ── Section 2: Technical Documents & CAD Drawings (Optional) ── */}
      <div className="space-y-3 pt-3 border-t border-[var(--border-default)]">
        <div className="flex items-center justify-between">
          <span className="text-[12px] font-bold uppercase tracking-wider text-[var(--text-primary)]">
            Engineering Drawings & Documents <span className="text-[11px] font-normal text-[var(--text-muted)]">(Optional)</span>
          </span>
          <span className="text-[11px] font-mono text-[var(--text-muted)]">PDF, DWG, STEP, ZIP</span>
        </div>

        {/* Drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDocDragging(true); }}
          onDragLeave={() => setDocDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDocDragging(false); onAdd(e.dataTransfer.files); }}
          className={`border-2 border-dashed rounded-xl p-5 text-center transition-all cursor-pointer ${
            docDragging
              ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5"
              : "border-[var(--border-default)] hover:border-[var(--color-primary)]/50 bg-[var(--bg-surface)]/50"
          }`}
          onClick={() => docInputRef.current?.click()}
        >
          <input
            ref={docInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => onAdd(e.target.files)}
            accept=".pdf,.dwg,.step,.stp,.dxf,.cad,.zip"
          />
          <Upload size={20} className="mx-auto mb-1.5 text-[var(--text-muted)]" />
          <p className="text-[12px] font-medium text-[var(--text-primary)]">Drop CAD drawings, PDFs, or specs here</p>
          <p className="text-[10px] text-[var(--text-muted)] mt-0.5">Max size: 10 MB per file</p>
        </div>

        {/* File list */}
        {files.length > 0 && (
          <div className="space-y-2">
            {files.map((f, i) => (
              <FileItem key={i} file={f} onRemove={() => onRemove(i)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function FileItem({ file, onRemove }: { file: File; onRemove: () => void }) {
  const ext = file.name.split(".").pop()?.toLowerCase();
  const Icon = [".png", ".jpg", ".jpeg", ".webp"].includes("." + ext)
    ? ImageIcon
    : [".pdf"].includes("." + ext)
    ? FileText
    : File;

  const sizeStr = file.size > 1024 * 1024
    ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
    : `${(file.size / 1024).toFixed(0)} KB`;

  return (
    <div className="flex items-center gap-3 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] p-2.5">
      <Icon size={16} className="text-[var(--color-primary)] shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-medium text-[var(--text-primary)] truncate">{file.name}</p>
        <p className="text-[10px] text-[var(--text-muted)]">{sizeStr}</p>
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="flex items-center justify-center w-6 h-6 rounded-md text-[var(--text-muted)] hover:text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10"
      >
        <X size={13} />
      </button>
    </div>
  );
}