import { normalizeUrl } from "@/lib/ingestion/normalizer";
import type { GscPageData } from "@/types";

/**
 * Strips a URL down to a simple comparable key:
 * lowercase, no protocol, no www, no trailing slash.
 */
function toMatchKey(url: string): string {
  try {
    const parsed = new URL(
      url.match(/^https?:\/\//i) ? url : `https://${url}`
    );
    const bare = parsed.hostname.replace(/^www\./, "").toLowerCase();
    const path = parsed.pathname.replace(/\/+$/, "") || "";
    const search = parsed.search || "";
    return bare + path + search;
  } catch {
    return url.toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/+$/, "");
  }
}

/**
 * Match GSC page data to crawled URLs.
 *
 * The matched map uses the ORIGINAL DB URL as the key (not re-normalized),
 * so callers can safely use it for DB lookups.
 */
export function matchGscToCrawlUrls(
  gscData: GscPageData[],
  crawledUrls: string[]
): {
  matched: Map<string, GscPageData>;
  gscOnly: GscPageData[];
  crawlOnly: string[];
} {
  // Build a map from match key → original DB URL
  const keyToDbUrl = new Map<string, string>();
  for (const url of crawledUrls) {
    const key = toMatchKey(url);
    if (!keyToDbUrl.has(key)) {
      keyToDbUrl.set(key, url);
    }
  }

  const matched = new Map<string, GscPageData>();
  const gscOnly: GscPageData[] = [];
  const matchedKeys = new Set<string>();

  for (const gscRow of gscData) {
    const key = toMatchKey(gscRow.page);

    const dbUrl = keyToDbUrl.get(key);
    if (dbUrl && !matchedKeys.has(key)) {
      matched.set(dbUrl, gscRow);
      matchedKeys.add(key);
    } else if (!matchedKeys.has(key)) {
      gscOnly.push(gscRow);
    }
  }

  // Find crawl URLs not matched by any GSC row
  const crawlOnly = crawledUrls.filter(
    (url) => !matchedKeys.has(toMatchKey(url))
  );

  return { matched, gscOnly, crawlOnly };
}
