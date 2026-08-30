/**
 * Utility functions for parsing and calculating payment terms and advance requirements.
 */

export function extractAdvancePercent(paymentTerms: string | null | undefined): number {
  if (!paymentTerms || !paymentTerms.trim()) return 30; // fallback default
  const terms = paymentTerms.trim();

  // If Net credit terms (e.g. Net 30, Net 45, Net 60) or Letter of Credit without advance mention
  if (/\b(?:net\s*\d+|lc\b|letter\s+of\s+credit)\b/i.test(terms) && !/\b\d+%\s*advance\b/i.test(terms)) {
    return 0;
  }

  // Extract percentage: e.g. "30%", "50%", "100%", "25 %", "20%"
  const match = terms.match(/(\d{1,3})\s*%/);
  if (match) {
    const val = parseInt(match[1], 10);
    if (!isNaN(val) && val >= 0 && val <= 100) return val;
  }

  if (/100%|full\s+advance|full\s+payment/i.test(terms)) {
    return 100;
  }

  return 30;
}

export function calculateAdvanceAmount(total: number, paymentTerms: string | null | undefined): number {
  const pct = extractAdvancePercent(paymentTerms);
  return Math.round(total * (pct / 100) * 100) / 100;
}
