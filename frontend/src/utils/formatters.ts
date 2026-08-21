/**
 * Standard data and visual formatters for the Shakti Udyog platform.
 */

/** Formats a numeric amount to Indian Rupee (INR ₹) format. */
export function formatCurrency(amount: number | null | undefined, currency = "INR"): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return "₹0.00";
  }

  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: currency || "INR",
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `₹${amount.toFixed(2)}`;
  }
}

/** Formats an ISO UTC date string into standard human-readable date. */
export function formatDate(dateString: string | null | undefined, includeTime = false): string {
  if (!dateString) return "—";
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;

    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "short",
      day: "2-digit",
      ...(includeTime && { hour: "2-digit", minute: "2-digit", hour12: true }),
    };
    return d.toLocaleDateString("en-IN", options);
  } catch {
    return dateString;
  }
}

/** Formats an ISO UTC date string to relative time (e.g. "Active now", "5m ago", "Yesterday"). */
export function formatRelativeTime(dateString: string | null | undefined): string {
  if (!dateString) return "Unknown";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHours = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSec < 60) return "Active now";
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 30) return `${diffDays}d ago`;

    return formatDate(dateString);
  } catch {
    return dateString;
  }
}

/** Formats file size in bytes to human-readable string (KB, MB, GB). */
export function formatFileSize(bytes: number | null | undefined): string {
  if (!bytes || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const size = bytes / Math.pow(1024, i);
  return `${size.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

/** Formats a 10-digit Indian phone number cleanly. */
export function formatPhoneNumber(phone: string | null | undefined): string {
  if (!phone) return "—";
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 10) {
    return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
  }
  if (cleaned.length === 12 && cleaned.startsWith("91")) {
    return `+91 ${cleaned.slice(2, 7)} ${cleaned.slice(7)}`;
  }
  return phone;
}

/** Formats a GSTIN with uppercase normalization. */
export function formatGstNumber(gst: string | null | undefined): string {
  if (!gst) return "—";
  return gst.trim().toUpperCase();
}
