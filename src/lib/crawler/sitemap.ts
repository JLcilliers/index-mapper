const USER_AGENT = "Mozilla/5.0 (compatible; IndexMapper/1.0)";

/**
 * Fetch and parse a sitemap (or sitemap index) and return all page URLs.
 * Handles both sitemap index files and regular sitemaps.
 * Follows sitemap index entries recursively (one level deep).
 */
export async function parseSitemap(sitemapUrl: string): Promise<string[]> {
  const urls: string[] = [];

  try {
    const response = await fetch(sitemapUrl, {
      headers: { "User-Agent": USER_AGENT },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) return urls;

    const text = await response.text();

    // Check if this is a sitemap index (contains <sitemapindex> or <sitemap>)
    if (text.includes("<sitemapindex") || (text.includes("<sitemap>") && !text.includes("<url>"))) {
      // Extract child sitemap URLs
      const childSitemaps = extractLocs(text);
      // Fetch each child sitemap (but don't recurse further)
      for (const childUrl of childSitemaps) {
        try {
          const childResponse = await fetch(childUrl, {
            headers: { "User-Agent": USER_AGENT },
            signal: AbortSignal.timeout(15000),
          });
          if (childResponse.ok) {
            const childText = await childResponse.text();
            urls.push(...extractLocs(childText));
          }
        } catch {
          // Skip failed child sitemaps
        }
      }
    } else {
      // Regular sitemap — extract URLs directly
      urls.push(...extractLocs(text));
    }
  } catch {
    // Sitemap fetch failed — not critical
  }

  return urls;
}

/**
 * Extract all <loc> values from XML text.
 */
function extractLocs(xml: string): string[] {
  const locs: string[] = [];
  const regex = /<loc>\s*(.*?)\s*<\/loc>/gi;
  let match;
  while ((match = regex.exec(xml)) !== null) {
    const url = match[1].trim();
    if (url && url.startsWith("http")) {
      locs.push(url);
    }
  }
  return locs;
}
