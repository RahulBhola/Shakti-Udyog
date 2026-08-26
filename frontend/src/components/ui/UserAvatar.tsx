import { useState, useEffect } from "react";
import { cn } from "../../lib/utils";

export interface UserAvatarProps {
  avatarUrl?: string | null;
  displayName?: string | null;
  initials?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  shape?: "circle" | "rounded" | "square";
  className?: string;
  alt?: string;
}

const sizeClasses: Record<NonNullable<UserAvatarProps["size"]>, string> = {
  xs: "w-6 h-6 text-[10px]",
  sm: "w-8 h-8 text-xs",
  md: "w-9 h-9 text-xs",
  lg: "w-10 h-10 text-sm",
  xl: "w-12 h-12 text-base",
  "2xl": "w-16 h-16 text-2xl font-extrabold",
};

const shapeClasses: Record<NonNullable<UserAvatarProps["shape"]>, string> = {
  circle: "rounded-full",
  rounded: "rounded-xl",
  square: "rounded-lg",
};

export function UserAvatar({
  avatarUrl,
  displayName,
  initials,
  size = "md",
  shape = "circle",
  className,
  alt,
}: UserAvatarProps) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [avatarUrl]);

  const resolvedInitials =
    initials ||
    (displayName
      ? displayName
          .trim()
          .split(" ")
          .filter(Boolean)
          .map((n) => n[0])
          .slice(0, 2)
          .join("")
          .toUpperCase()
      : "?");

  const showImage = Boolean(avatarUrl && !hasError);

  return (
    <div
      className={cn(
        "relative flex items-center justify-center shrink-0 overflow-hidden select-none font-bold text-white shadow-xs transition-all duration-200",
        sizeClasses[size],
        shapeClasses[shape],
        !showImage && "bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-hover)]",
        className
      )}
    >
      {showImage ? (
        <img
          src={avatarUrl!}
          alt={alt || displayName || "User avatar"}
          referrerPolicy="no-referrer"
          crossOrigin="anonymous"
          onError={() => setHasError(true)}
          className={cn(
            "w-full h-full object-cover",
            shapeClasses[shape]
          )}
        />
      ) : (
        <span className="leading-none">{resolvedInitials}</span>
      )}
    </div>
  );
}
