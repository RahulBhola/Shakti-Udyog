using System.Text.RegularExpressions;

namespace ShaktiUdyog.Domain.Constants;

public static class PaymentTermsHelper
{
    public static int ExtractAdvancePercent(string? paymentTerms)
    {
        if (string.IsNullOrWhiteSpace(paymentTerms))
            return 30; // default fallback

        var terms = paymentTerms.Trim();

        // If explicitly Net credit terms (e.g. Net 30, Net 45, Net 60) or Letter of Credit without advance mentions
        if (Regex.IsMatch(terms, @"\b(?:net\s*\d+|lc\b|letter\s+of\s+credit)\b", RegexOptions.IgnoreCase) &&
            !Regex.IsMatch(terms, @"\b\d+%\s*advance\b", RegexOptions.IgnoreCase))
        {
            return 0;
        }

        // Match first percentage: e.g. "30%", "50%", "100%", "25 %"
        var match = Regex.Match(terms, @"(\d{1,3})\s*%", RegexOptions.IgnoreCase);
        if (match.Success && int.TryParse(match.Groups[1].Value, out var pct))
        {
            if (pct >= 0 && pct <= 100)
                return pct;
        }

        if (terms.Contains("100%", StringComparison.OrdinalIgnoreCase) ||
            terms.Contains("full advance", StringComparison.OrdinalIgnoreCase) ||
            terms.Contains("full payment", StringComparison.OrdinalIgnoreCase))
        {
            return 100;
        }

        return 30;
    }

    public static decimal CalculateAdvanceAmount(decimal total, string? paymentTerms)
    {
        var pct = ExtractAdvancePercent(paymentTerms);
        return Math.Round(total * (pct / 100m), 2);
    }
}
