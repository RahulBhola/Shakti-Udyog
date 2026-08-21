import React from "react";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  glass?: boolean;
  glow?: boolean;
}

export function Card({
  glass = true,
  glow = false,
  children,
  className = "",
  ...props
}: CardProps) {
  const baseStyle =
    "rounded-xl border transition-all duration-200";

  const glassStyle = glass
    ? "bg-slate-900/60 backdrop-blur-xl border-slate-800/80 shadow-lg shadow-black/20"
    : "bg-slate-900 border-slate-800";

  const glowStyle = glow
    ? "hover:border-sky-500/40 hover:shadow-sky-500/10 hover:shadow-xl"
    : "";

  return (
    <div className={`${baseStyle} ${glassStyle} ${glowStyle} ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`p-5 sm:p-6 border-b border-slate-800/80 flex items-center justify-between ${className}`}>
      {children}
    </div>
  );
}

export function CardContent({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`p-5 sm:p-6 ${className}`}>{children}</div>;
}

export function CardFooter({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`p-4 sm:p-5 border-t border-slate-800/80 bg-slate-950/30 flex items-center justify-between ${className}`}>
      {children}
    </div>
  );
}
