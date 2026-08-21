import React from "react";
import { Button } from "./Button";

export interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  title,
  description,
  icon,
  actionLabel,
  onAction,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center p-10 sm:p-14 text-center rounded-2xl border border-dashed border-slate-800/80 bg-slate-900/30 ${className}`}
    >
      {icon && (
        <div className="w-14 h-14 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-center text-sky-400 mb-4 shadow-inner">
          {icon}
        </div>
      )}
      <h3 className="text-base sm:text-lg font-semibold text-slate-200">{title}</h3>
      {description && (
        <p className="mt-1.5 max-w-sm text-sm text-slate-400 leading-relaxed">{description}</p>
      )}
      {actionLabel && onAction && (
        <div className="mt-5">
          <Button variant="primary" size="sm" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
}
