import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

/* ── ConfirmAction Modal ──────────────────────────────────────── */

interface ConfirmActionModalProps {
  open: boolean;
  title: string;
  message: string;
  placeholder?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "danger";
  onConfirm: (input?: string) => void;
  onCancel: () => void;
}

export function ConfirmActionModal({
  open, title, message, placeholder,
  confirmLabel = "Confirm", cancelLabel = "Cancel",
  variant = "default",
  onConfirm, onCancel,
}: ConfirmActionModalProps) {
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setInputValue("");
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onCancel]);

  if (!open) return null;

  const handleSubmit = () => onConfirm(inputValue || undefined);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />

      {/* Dialog */}
      <div className="relative w-full max-w-md mx-4 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-card)] shadow-2xl p-6 animate-in fade-in zoom-in-95">
        {/* Close */}
        <button type="button" onClick={onCancel}
          className="absolute top-4 right-4 flex items-center justify-center w-7 h-7 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-all">
          <X size={15} />
        </button>

        {/* Title */}
        <h3 className="text-[15px] font-bold text-[var(--text-primary)] pr-6 mb-2">{title}</h3>

        {/* Message */}
        <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed mb-5">{message}</p>

        {/* Text input (when placeholder is provided) */}
        {placeholder !== undefined && (
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={placeholder}
            onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
            className="w-full h-10 px-3.5 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] transition-all mb-5"
          />
        )}

        {/* Buttons */}
        <div className="flex items-center justify-end gap-2">
          <button type="button" onClick={onCancel}
            className="px-4 h-9 rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] text-[12px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-all">
            {cancelLabel}
          </button>
          <button type="button" onClick={handleSubmit}
            className={`px-5 h-9 rounded-xl text-[12px] font-semibold text-white transition-all ${
              variant === "danger"
                ? "bg-red-500 hover:bg-red-600"
                : "bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)]"
            }`}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
