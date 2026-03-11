import { getValidAccessToken } from "./auth";
import type { GscPageData } from "@/types";

const GSC_API_BASE = "https://www.googleapis.com/webmasters/v3";

/**
 * List all Search Console properties accessible to the connected account.
 */
export async function listGscProperties(): Promise<
  Array<{ siteUrl: string; permissionLevel: string }>
> {
  const accessToken = await getValidAccessToken();

  const response = await fetch(`${GSC_API_BASE}/sites`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error(`Failed to list GSC properties: ${response.statusText}`);
  }

  const data = await response.json();
  return (data.siteEntry || []).map(
    (entry: { siteUrl: string; permissionLevel: string }) => ({
      siteUrl: entry.siteUrl,
      permissionLevel: entry.permissionLevel,
    })
  );
}

/**
 * Fetch page-level performance data from GSC.
 */
export async function fetchGscPageData(
  siteUrl: string,
  startDate: string,
  endDate: string
): Promise<GscPageData[]> {
  const accessToken = await getValidAccessToken();
  const allRows: GscPageData[] = [];
  let startRow = 0;
  const rowLimit = 25000;

  // Paginate through all results
  while (true) {
    const response = await fetch(
      `${GSC_API_BASE}/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          startDate,
          endDate,
          dimensions: ["page"],
          rowLimit,
          startRow,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`GSC API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    const rows = data.rows || [];

    for (const row of rows) {
      allRows.push({
        page: row.keys[0],
        clicks: row.clicks,
        impressions: row.impressions,
        ctr: row.ctr,
        position: row.position,
      });
    }

    // If we got fewer rows than the limit, we're done
    if (rows.length < rowLimit) break;
    startRow += rowLimit;
  }

  return allRows;
}

/**
 * Given a GSC property URL, generate all protocol/www variants
 * and the sc-domain: variant. Returns only properties that exist
 * in the user's account.
 */
export async function findAllPropertyVariants(
  gscProperty: string
): Promise<string[]> {
  const allProperties = await listGscProperties();
  const allUrls = new Set(allProperties.map((p) => p.siteUrl));

  // Extract bare domain from the selected property
  let bareDomain: string;
  if (gscProperty.startsWith("sc-domain:")) {
    bareDomain = gscProperty.replace("sc-domain:", "").replace(/\/+$/, "");
  } else {
    try {
      const parsed = new URL(gscProperty);
      bareDomain = parsed.hostname.replace(/^www\./, "");
    } catch {
      return [gscProperty];
    }
  }

  // Generate all possible variants
  const candidates = [
    `sc-domain:${bareDomain}`,
    `http://${bareDomain}/`,
    `https://${bareDomain}/`,
    `http://www.${bareDomain}/`,
    `https://www.${bareDomain}/`,
  ];

  // Return only variants that exist in the user's account
  const found = candidates.filter((c) => allUrls.has(c));

  // If nothing matched (shouldn't happen), fall back to original
  return found.length > 0 ? found : [gscProperty];
}

/**
 * Fetch GSC data from all property variants and merge by URL.
 * For duplicate URLs across properties, keeps the row with higher clicks.
 */
export async function fetchGscPageDataAllVariants(
  gscProperty: string,
  startDate: string,
  endDate: string
): Promise<GscPageData[]> {
  const variants = await findAllPropertyVariants(gscProperty);

  // If sc-domain is available, just use that — it covers everything
  const scDomain = variants.find((v) => v.startsWith("sc-domain:"));
  if (scDomain) {
    return fetchGscPageData(scDomain, startDate, endDate);
  }

  // Otherwise fetch from all URL-prefix variants and merge
  const allData = new Map<string, GscPageData>();

  for (const variant of variants) {
    try {
      const rows = await fetchGscPageData(variant, startDate, endDate);
      for (const row of rows) {
        // Normalize the page URL for deduplication
        const key = row.page
          .replace(/^https?:\/\//, "")
          .replace(/^www\./, "")
          .replace(/\/+$/, "")
          .toLowerCase();

        const existing = allData.get(key);
        if (!existing || row.clicks > existing.clicks) {
          allData.set(key, row);
        }
      }
    } catch (err) {
      // Skip variants that fail (e.g., unverified)
      console.warn(`GSC fetch failed for ${variant}:`, err);
    }
  }

  return Array.from(allData.values());
}

/**
 * Calculate date range strings for GSC queries.
 * GSC data has ~3 day delay, so end date is today - 3 days.
 */
export function getDateRange(range: "3m" | "6m" | "12m" | "custom", customStart?: string, customEnd?: string) {
  const endDate = new Date();
  endDate.setDate(endDate.getDate() - 3);

  if (range === "custom" && customStart && customEnd) {
    return {
      startDate: customStart,
      endDate: customEnd,
    };
  }

  const startDate = new Date(endDate);

  switch (range) {
    case "3m":
      startDate.setMonth(startDate.getMonth() - 3);
      break;
    case "6m":
      startDate.setMonth(startDate.getMonth() - 6);
      break;
    case "12m":
      startDate.setFullYear(startDate.getFullYear() - 1);
      break;
  }

  return {
    startDate: startDate.toISOString().split("T")[0],
    endDate: endDate.toISOString().split("T")[0],
  };
}
