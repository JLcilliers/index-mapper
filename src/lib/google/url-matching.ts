import { normalizeUrl } from "@/lib/ingestion/normalizer";
import type { GscPageData } from "@/types";

/**
 * Normalize a GSC URL for matching with crawled URLs.
 * Handles protocol, www, trailing slash, and case differences.
 */
export function normalizeGscUrl(url: string): string {
  return normalizeUrl(url);
}

/**
 * Match GSC page data to crawled URLs.
 *
 * Returns:
 * - matched: URLs found in both GSC and crawl
 * - gscOnly: URLs in GSC but not crawled (may be indexed but not reachable via crawl)
 * - crawlOnly: URLs crawled but not in GSC (may not be indexed)
 */
export function matchGscToCrawlUrls(
  gscData: GscPageData[],
  crawledUrls: string[]
): {
  matched: Map<string, GscPageData>;
  gscOnly: GscPageData[];
  crawlOnly: string[];
} {
  // Build a map of normalized crawl URLs
  const crawlUrlSet = new Set<string>();
  const crawlNormalizedToOriginal = new Map<string, string>();

  for (const url of crawledUrls) {
    const normalized = normalizeUrl(url);
    crawlUrlSet.add(normalized);
    crawlNormalizedToOriginal.set(normalized, url);
  }

  // Match GSC data
  const matched = new Map<string, GscPageData>();
  const gscOnly: GscPageData[] = [];
  const matchedCrawlUrls = new Set<string>();

  for (const gscRow of gscData) {
    const normalizedGsc = normalizeGscUrl(gscRow.page);

    if (crawlUrlSet.has(normalizedGsc)) {
      matched.set(normalizedGsc, gscRow);
      matchedCrawlUrls.add(normalizedGsc);
    } else {
      // Try with/without trailing slash
      const withSlash = normalizedGsc.endsWith("/")
        ? normalizedGsc
        : normalizedGsc + "/";
      const withoutSlash = normalizedGsc.endsWith("/")
        ? normalizedGsc.slice(0, -1)
        : normalizedGsc;

      if (crawlUrlSet.has(withSlash)) {
        matched.set(withSlash, gscRow);
        matchedCrawlUrls.add(withSlash);
      } else if (crawlUrlSet.has(withoutSlash)) {
        matched.set(withoutSlash, gscRow);
        matchedCrawlUrls.add(withoutSlash);
      } else {
        // Try www/non-www variants
        const urlObj = new URL(normalizedGsc);
        const altHostname = urlObj.hostname.startsWith("www.")
          ? urlObj.hostname.slice(4)
          : `www.${urlObj.hostname}`;
        urlObj.hostname = altHostname;
        const altUrl = normalizeUrl(urlObj.toString());

        if (crawlUrlSet.has(altUrl)) {
          matched.set(altUrl, gscRow);
          matchedCrawlUrls.add(altUrl);
        } else {
          gscOnly.push(gscRow);
        }
      }
    }
  }

  // Find crawl URLs not in GSC
  const crawlOnly = Array.from(crawlUrlSet).filter(
    (url) => !matchedCrawlUrls.has(url)
  );

  return { matched, gscOnly, crawlOnly };
}
