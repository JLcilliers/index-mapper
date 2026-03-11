import * as cheerio from "cheerio";
import type { CrawlResult } from "@/types";

export function extractSeoFields(
  url: string,
  html: string,
  statusCode: number,
  responseTimeMs: number,
  contentType: string | null
): CrawlResult {
  const $ = cheerio.load(html);

  // Title
  const title = $("title").first().text().trim() || null;

  // Meta description
  const metaDescription =
    $('meta[name="description"]').attr("content")?.trim() || null;

  // H1
  const h1 = $("h1").first().text().trim() || null;

  // Canonical
  const canonical = $('link[rel="canonical"]').attr("href")?.trim() || null;

  // Meta robots
  const metaRobots =
    $('meta[name="robots"]').attr("content")?.trim() || null;

  // Word count — visible text only
  // Remove scripts, styles, nav, header, footer for cleaner count
  const $clone = cheerio.load(html);
  $clone("script, style, nav, header, footer, noscript").remove();
  const visibleText = $clone("body").text();
  const wordCount = visibleText
    ? visibleText.split(/\s+/).filter((w) => w.length > 0).length
    : 0;

  // Internal and external links
  const baseUrl = new URL(url);
  const internalLinks: string[] = [];
  const externalLinks: string[] = [];

  $("a[href]").each((_, el) => {
    const href = $(el).attr("href");
    if (!href) return;

    try {
      const resolved = new URL(href, url);

      // Skip non-http protocols
      if (!resolved.protocol.startsWith("http")) return;

      // Skip fragments and mailto
      if (href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return;

      // Normalize
      resolved.hash = "";
      const resolvedUrl = resolved.toString();

      if (resolved.hostname === baseUrl.hostname) {
        if (!internalLinks.includes(resolvedUrl)) {
          internalLinks.push(resolvedUrl);
        }
      } else {
        if (!externalLinks.includes(resolvedUrl)) {
          externalLinks.push(resolvedUrl);
        }
      }
    } catch {
      // Invalid URL, skip
    }
  });

  return {
    url,
    statusCode,
    canonical,
    metaRobots,
    title,
    metaDescription,
    h1,
    wordCount,
    contentType,
    responseTimeMs,
    internalLinks,
    externalLinks,
  };
}
