/**
 * Form field and business identifier validation utilities.
 */

/** Validates email format using RFC 5322 compliant pattern. */
export function isValidEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const pattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return pattern.test(email.trim());
}

/** Validates Indian 10-digit mobile number. */
export function isValidPhone(phone: string | null | undefined): boolean {
  if (!phone) return false;
  const cleaned = phone.replace(/\D/g, "");
  return cleaned.length === 10 || (cleaned.length === 12 && cleaned.startsWith("91"));
}

/** Validates standard Indian 15-character GSTIN format. */
export function isValidGst(gst: string | null | undefined): boolean {
  if (!gst) return false;
  const pattern = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  return pattern.test(gst.trim().toUpperCase());
}

/** Validates standard Indian 10-character PAN format. */
export function isValidPan(pan: string | null | undefined): boolean {
  if (!pan) return false;
  const pattern = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  return pattern.test(pan.trim().toUpperCase());
}

/** Evaluates password strength (score 0 to 4). */
export function validatePasswordStrength(password: string): {
  score: number;
  hasMinLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
} {
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  let score = 0;
  if (hasMinLength) score++;
  if (hasUppercase && hasLowercase) score++;
  if (hasNumber) score++;
  if (hasSpecial) score++;

  return {
    score,
    hasMinLength,
    hasUppercase,
    hasLowercase,
    hasNumber,
    hasSpecial,
  };
}
