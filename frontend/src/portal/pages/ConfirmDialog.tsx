import { AlertTriangle } from "lucide-react";
import "./erpListView.css";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Styled confirmation dialog ("Are you sure?") used before destructive actions. */
export function ConfirmDialog({
  open, title, message, confirmLabel = "Delete", danger = true, onConfirm, onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;
  return (
    <div className="inv-modal-backdrop" onClick={onCancel}>
      <div
        className="inv-modal"
        style={{ maxWidth: 420 }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="inv-modal__body" style={{ alignItems: "center", textAlign: "center" }}>
          <span
            className="inv-avatar"
            style={{
              background: danger ? "rgba(239,68,68,0.12)" : "rgba(59,130,246,0.12)",
              color: danger ? "var(--color-danger)" : "var(--color-primary)",
              width: 48, height: 48, borderRadius: 12, marginBottom: 4,
            }}
          >
            <AlertTriangle size={22} />
          </span>
          <div className="inv-modal__title" style={{ fontSize: 17 }}>{title}</div>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: "6px 0 0", lineHeight: 1.5, whiteSpace: "pre-line" }}>
            {message}
          </p>
        </div>
        <div className="inv-modal__foot" style={{ justifyContent: "center" }}>
          <button className="inv-btn" onClick={onCancel}>Cancel</button>
          <button
            className="inv-btn"
            style={{ background: danger ? "var(--color-danger)" : "var(--color-primary)", color: "#fff", borderColor: "transparent" }}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
