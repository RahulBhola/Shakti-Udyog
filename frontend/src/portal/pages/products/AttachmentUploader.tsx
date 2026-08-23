import { useState, useRef } from "react";
import { Upload, X, FileText, Image as ImageIcon, File, Moon, Sun, CheckCircle2, AlertTriangle } from "lucide-react";

interface AttachmentUploaderProps {
  darkImageFile: File | null;
  lightImageFile: File | null;
  existingDarkImageUrl?: string | null;
  existingLightImageUrl?: string | null;
  onSetDarkImage: (file: File | null) => void;
  onSetLightImage: (file: File | null) => void;
  files: File[];
  onAdd: (files: FileList | null) => void;
  onRemove: (index: number) => void;
}

export default function AttachmentUploader({
  darkImageFile,
  lightImageFile,
  existingDarkImageUrl,
  existingLightImageUrl,
  onSetDarkImage,
  onSetLightImage,
  files,
  onAdd,
  onRemove,
}: AttachmentUploaderProps) {
  const [docDragging, setDocDragging] = useState(false);
  const [darkDragging, setDarkDragging] = useState(false);
  const [lightDragging, setLightDragging] = useState(false);

  const darkInputRef = useRef<HTMLInputElement>(null);
  const lightInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  const hasAtLeastOneImage = Boolean(
    darkImageFile || lightImageFile || existingDarkImageUrl || existingLightImageUrl
  );

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-bold text-[var(--text-primary)] m-0">Product Images & Technical Attachments</h3>
        <p className="text-[12px] text-[var(--text-muted)] mt-1">
          Upload dual-theme 3D component renders and engineering drawings.
        </p>
      </div>

      {/* Requirement Notification Banner */}
      <div
        className={`flex items-center gap-2.5 p-3 rounded-xl border text-xs font-medium transition-all ${
          hasAtLeastOneImage
            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
            : "bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300"
        }`}
      >
        {hasAtLeastOneImage ? (
          <>
            <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
            <span>Product image is attached. (Dual-theme support enabled)</span>
          </>
        ) : (
          <>
            <AlertTriangle size={16} className="text-amber-500 shrink-0" />
            <span>
              <strong>Image Required:</strong> Please attach at least one product image (Dark Mode or Light Mode render) to proceed.
            </span>
          </>
        )}
      </div>

      {/* ── Section 1: Specific Dual-Theme Component Images ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[12px] font-bold uppercase tracking-wider text-[var(--text-primary)]">
            3D Component Renders <span className="text-red-500">*</span>
          </span>
          <span className="text-[11px] font-mono text-[var(--text-muted)]">At least 1 required</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Dark Mode Slot */}
          <div className="flex flex-col justify-between rounded-xl border border-white/10 bg-[#090b10] p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2.5">
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-500/15 border border-blue-500/30 text-sky-400 font-mono text-[11px] font-bold">
                <Moon size={12} />
                <span>Dark Theme Render</span>
              </div>
              {darkImageFile && (
                <span className="text-[10px] font-mono text-emerald-400">New Upload</span>
              )}
            </div>

            <input
              ref={darkInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/jpg"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) onSetDarkImage(e.target.files[0]);
              }}
            />

            {darkImageFile || existingDarkImageUrl ? (
              <div className="relative w-full h-36 rounded-lg overflow-hidden bg-gradient-to-b from-[#161a26] to-[#0d1017] border border-white/5 flex items-center justify-center p-2 group">
                <img
                  src={darkImageFile ? URL.createObjectURL(darkImageFile) : existingDarkImageUrl!}
                  alt="Dark Mode Preview"
                  className="max-h-32 max-w-[90%] object-contain"
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => darkInputRef.current?.click()}
                    className="px-2.5 py-1 rounded bg-blue-600 text-white text-[11px] font-semibold hover:bg-blue-500"
                  >
                    Replace
                  </button>
                  <button
                    type="button"
                    onClick={() => onSetDarkImage(null)}
                    className="px-2.5 py-1 rounded bg-red-600/80 text-white text-[11px] font-semibold hover:bg-red-500"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <div
                onDragOver={(e) => { e.preventDefault(); setDarkDragging(true); }}
                onDragLeave={() => setDarkDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDarkDragging(false);
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) onSetDarkImage(e.dataTransfer.files[0]);
                }}
                onClick={() => darkInputRef.current?.click()}
                className={`w-full h-36 rounded-lg border-2 border-dashed flex flex-col items-center justify-center p-3 text-center cursor-pointer transition-all ${
                  darkDragging
                    ? "border-sky-400 bg-sky-500/10"
                    : "border-white/15 hover:border-sky-400/50 bg-white/[0.02]"
                }`}
              >
                <Upload size={22} className="text-sky-400 mb-1.5 opacity-80" />
                <span className="text-[12px] font-semibold text-white">Upload Dark Render</span>
                <span className="text-[10px] text-neutral-400 mt-0.5">PNG, JPG or WebP</span>
              </div>
            )}

            {darkImageFile && (
              <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400 mt-2 truncate">
                <span className="truncate">{darkImageFile.name}</span>
                <span className="shrink-0 ml-2">{(darkImageFile.size / 1024).toFixed(0)} KB</span>
              </div>
            )}
          </div>

          {/* Light Mode Slot */}
          <div className="flex flex-col justify-between rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#090b10] p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2.5">
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-400 font-mono text-[11px] font-bold">
                <Sun size={12} />
                <span>Light Theme Render</span>
              </div>
              {lightImageFile && (
                <span className="text-[10px] font-mono text-emerald-400">New Upload</span>
              )}
            </div>

            <input
              ref={lightInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/jpg"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) onSetLightImage(e.target.files[0]);
              }}
            />

            {lightImageFile || existingLightImageUrl ? (
              <div className="relative w-full h-36 rounded-lg overflow-hidden bg-gradient-to-b from-neutral-50 to-neutral-100 dark:from-[#1e222d] dark:to-[#12151e] border border-neutral-200 dark:border-white/5 flex items-center justify-center p-2 group">
                <img
                  src={lightImageFile ? URL.createObjectURL(lightImageFile) : existingLightImageUrl!}
                  alt="Light Mode Preview"
                  className="max-h-32 max-w-[90%] object-contain"
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => lightInputRef.current?.click()}
                    className="px-2.5 py-1 rounded bg-amber-600 text-white text-[11px] font-semibold hover:bg-amber-500"
                  >
                    Replace
                  </button>
                  <button
                    type="button"
                    onClick={() => onSetLightImage(null)}
                    className="px-2.5 py-1 rounded bg-red-600/80 text-white text-[11px] font-semibold hover:bg-red-500"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <div
                onDragOver={(e) => { e.preventDefault(); setLightDragging(true); }}
                onDragLeave={() => setLightDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setLightDragging(false);
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) onSetLightImage(e.dataTransfer.files[0]);
                }}
                onClick={() => lightInputRef.current?.click()}
                className={`w-full h-36 rounded-lg border-2 border-dashed flex flex-col items-center justify-center p-3 text-center cursor-pointer transition-all ${
                  lightDragging
                    ? "border-amber-400 bg-amber-500/10"
                    : "border-neutral-300 dark:border-white/15 hover:border-amber-400/50 bg-neutral-50/50 dark:bg-white/[0.02]"
                }`}
              >
                <Upload size={22} className="text-amber-500 mb-1.5 opacity-80" />
                <span className="text-[12px] font-semibold text-neutral-800 dark:text-white">Upload Light Render</span>
                <span className="text-[10px] text-neutral-500 dark:text-neutral-400 mt-0.5">PNG, JPG or WebP</span>
              </div>
            )}

            {lightImageFile && (
              <div className="flex items-center justify-between text-[11px] font-mono text-neutral-500 dark:text-neutral-400 mt-2 truncate">
                <span className="truncate">{lightImageFile.name}</span>
                <span className="shrink-0 ml-2">{(lightImageFile.size / 1024).toFixed(0)} KB</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Section 2: Technical Documents & CAD Drawings ── */}
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
          <Upload size={22} className="mx-auto mb-2 text-[var(--text-muted)]" />
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