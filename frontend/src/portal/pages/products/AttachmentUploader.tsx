import { useState } from "react";
import { Upload, X, FileText, Image, File } from "lucide-react";

interface AttachmentUploaderProps {
  files: { name: string; size: number; type: string }[];
  onAdd: (files: FileList | null) => void;
  onRemove: (index: number) => void;
}

export default function AttachmentUploader({ files, onAdd, onRemove }: AttachmentUploaderProps) {
  const [dragging, setDragging] = useState(false);

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-[var(--text-primary)]">Attachments</h3>
      <p className="text-[12px] text-[var(--text-muted)]">
        Supported formats: <strong>JPG</strong>, <strong>PNG</strong> (image preview), <strong>PDF</strong>, <strong>DWG</strong>, <strong>DXF</strong>, <strong>STEP</strong>, <strong>ZIP</strong>
      </p>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); onAdd(e.dataTransfer.files); }}
        className={`border-2 border-dashed rounded-[14px] p-8 text-center transition-all cursor-pointer ${
          dragging
            ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5"
            : "border-[var(--border-default)] hover:border-[var(--color-primary)]/50"
        }`}
        onClick={() => document.getElementById("file-input")?.click()}
      >
        <input id="file-input" type="file" multiple className="hidden" onChange={(e) => onAdd(e.target.files)} accept=".pdf,.dwg,.step,.stp,.dxf,.cad,.png,.jpg,.jpeg" />
        <Upload size={28} className="mx-auto mb-3 text-[var(--text-muted)]" />
        <p className="text-[13px] font-medium text-[var(--text-primary)]">Drop files here or click to browse</p>
        <p className="text-[11px] text-[var(--text-muted)] mt-1">Max file size: 10 MB</p>
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
  );
}

function FileItem({ file, onRemove }: { file: { name: string; size: number; type: string }; onRemove: () => void }) {
  const ext = file.name.split(".").pop()?.toLowerCase();
  const Icon = [".png", ".jpg", ".jpeg"].includes("." + ext)
    ? Image
    : [".pdf"].includes("." + ext)
    ? FileText
    : File;

  const sizeStr = file.size > 1024 * 1024
    ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
    : `${(file.size / 1024).toFixed(0)} KB`;

  return (
    <div className="flex items-center gap-3 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] p-3">
      <Icon size={18} className="text-[var(--color-primary)] shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-medium text-[var(--text-primary)] truncate">{file.name}</p>
        <p className="text-[11px] text-[var(--text-muted)]">{sizeStr}</p>
      </div>
      <button type="button" onClick={onRemove}
        className="flex items-center justify-center w-6 h-6 rounded-md text-[var(--text-muted)] hover:text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10">
        <X size={14} />
      </button>
    </div>
  );
}