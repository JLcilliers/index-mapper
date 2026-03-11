export function normalizeUrl(url: string): string {
  let normalized = url.trim();

  // Add protocol if missing
  if (!normalized.match(/^https?:\/\//i)) {
    normalized = "https://" + normalized;
  }

  try {
    const parsed = new URL(normalized);

    // Lowercase hostname
    parsed.hostname = parsed.hostname.toLowerCase();

    // Remove common tracking parameters
    const trackingParams = [
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "utm_term",
      "utm_content",
      "fbclid",
      "gclid",
      "msclkid",
      "mc_cid",
      "mc_eid",
    ];
    for (const param of trackingParams) {
      parsed.searchParams.delete(param);
    }

    // Remove fragment
    parsed.hash = "";

    // Build normalized URL
    normalized = parsed.toString();

    // Remove trailing slash (except for root paths)
    if (normalized.endsWith("/") && parsed.pathname !== "/") {
      normalized = normalized.slice(0, -1);
    }

    return normalized;
  } catch {
    // If URL parsing fails, just return lowercase trimmed version
    return normalized.toLowerCase();
  }
}

export function parseNumber(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number") return value;

  // Remove commas, spaces, percent signs
  const cleaned = String(value).replace(/[,%\s]/g, "").trim();
  if (cleaned === "" || cleaned === "-" || cleaned === "n/a") return null;

  const num = Number(cleaned);
  return isNaN(num) ? null : num;
}

export function parseBoolean(
  value: string | boolean | null | undefined
): boolean | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "boolean") return value;

  const lower = String(value).toLowerCase().trim();
  if (["true", "yes", "1", "indexable"].includes(lower)) return true;
  if (["false", "no", "0", "non-indexable", "noindex"].includes(lower))
    return false;

  return null;
}

export function parseDate(
  value: string | null | undefined
): Date | null {
  if (!value || value.trim() === "") return null;

  const date = new Date(value);
  return isNaN(date.getTime()) ? null : date;
}

export function cleanString(
  value: string | null | undefined
): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}
