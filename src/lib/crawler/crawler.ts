import { prisma } from "@/lib/db";
import { extractSeoFields } from "./extractor";
import { fetchRobotsTxt, isPathAllowed } from "./robots";
import { parseSitemap } from "./sitemap";
import { normalizeUrl } from "@/lib/ingestion/normalizer";
import { detectPageType } from "@/lib/classification/page-types";

interface CrawlOptions {
  projectRunId: string;
  domain: string;
  maxPages: number;
  maxDepth: number;
  delayMs?: number;
}

const USER_AGENT = "Mozilla/5.0 (compatible; IndexMapper/1.0)";

/**
 * Initialize a crawl job: seed the queue with the homepage, fetch robots.txt.
 */
export async function initializeCrawl(options: CrawlOptions) {
  const { projectRunId, domain } = options;

  // Fetch robots.txt
  const robotsData = await fetchRobotsTxt(domain);

  // Seed queue with homepage
  const homepage = normalizeUrl(`https://${domain}/`);
  await prisma.crawlQueue.upsert({
    where: {
      projectRunId_url: { projectRunId, url: homepage },
    },
    update: {},
    create: {
      projectRunId,
      url: homepage,
      depth: 0,
      status: "pending",
    },
  });

  // Parse sitemaps and seed queue with discovered URLs
  const bareDomain = domain.replace(/^www\./, "");
  let sitemapUrlsAdded = 0;

  // If no sitemaps in robots.txt, try common sitemap locations
  const sitemapUrls = robotsData.sitemaps.length > 0
    ? robotsData.sitemaps
    : [`https://${domain}/sitemap.xml`, `https://${domain}/sitemap_index.xml`];

  for (const sitemapUrl of sitemapUrls) {
    const urls = await parseSitemap(sitemapUrl);

    // Filter to same domain and normalize
    const samedomainUrls = urls
      .filter((u) => {
        try {
          const h = new URL(u).hostname.replace(/^www\./, "");
          return h === bareDomain;
        } catch { return false; }
      })
      .filter((u) => {
        const lower = u.toLowerCase();
        return !lower.match(/\.(jpg|jpeg|png|gif|svg|webp|pdf|css|js|ico|woff|woff2|ttf|eot|mp4|mp3|zip|rar)$/);
      })
      .map(normalizeUrl);

    if (samedomainUrls.length > 0) {
      // Check which URLs are already in the queue
      const existing = await prisma.crawlQueue.findMany({
        where: { projectRunId, url: { in: samedomainUrls } },
        select: { url: true },
      });
      const existingSet = new Set(existing.map((e) => e.url));

      const toCreate = samedomainUrls
        .filter((u) => !existingSet.has(u))
        .map((u) => ({
          projectRunId,
          url: u,
          depth: 1, // Sitemap URLs treated as depth 1
          status: "pending",
        }));

      if (toCreate.length > 0) {
        await prisma.crawlQueue.createMany({ data: toCreate, skipDuplicates: true });
        sitemapUrlsAdded += toCreate.length;
      }
    }
  }

  return { robotsRules: robotsData.rules, sitemaps: robotsData.sitemaps, sitemapUrlsAdded };
}

/**
 * Process a batch of URLs from the crawl queue.
 * Returns the number of URLs processed and whether there are more to do.
 */
export async function processCrawlBatch(
  projectRunId: string,
  domain: string,
  robotsRules: Array<{ type: "allow" | "disallow"; path: string }>,
  batchSize: number = 10,
  maxPages: number = 500,
  maxDepth: number = 10,
  delayMs: number = 200
): Promise<{ processed: number; remaining: number }> {
  // Check how many we've already completed
  const completedCount = await prisma.crawlQueue.count({
    where: { projectRunId, status: "completed" },
  });

  if (completedCount >= maxPages) {
    return { processed: 0, remaining: 0 };
  }

  // Get next batch of pending URLs
  const batch = await prisma.crawlQueue.findMany({
    where: { projectRunId, status: "pending" },
    orderBy: { depth: "asc" }, // BFS: process shallow pages first
    take: Math.min(batchSize, maxPages - completedCount),
  });

  if (batch.length === 0) {
    return { processed: 0, remaining: 0 };
  }

  let processed = 0;

  for (const item of batch) {
    // Mark as processing
    await prisma.crawlQueue.update({
      where: { id: item.id },
      data: { status: "processing" },
    });

    try {
      // Check robots.txt
      const urlObj = new URL(item.url);
      if (!isPathAllowed(urlObj.pathname, robotsRules)) {
        await prisma.crawlQueue.update({
          where: { id: item.id },
          data: { status: "completed", errorMessage: "Blocked by robots.txt" },
        });
        processed++;
        continue;
      }

      // Fetch the page
      const startTime = Date.now();
      const response = await fetch(item.url, {
        headers: {
          "User-Agent": USER_AGENT,
          "Accept": "text/html,application/xhtml+xml",
        },
        redirect: "follow",
        signal: AbortSignal.timeout(10000),
      });
      const responseTimeMs = Date.now() - startTime;

      const contentType = response.headers.get("content-type") || null;

      // Only parse HTML pages
      if (!contentType || !contentType.includes("text/html")) {
        await prisma.crawlQueue.update({
          where: { id: item.id },
          data: { status: "completed", errorMessage: `Non-HTML: ${contentType}` },
        });
        processed++;
        continue;
      }

      const html = await response.text();
      const result = extractSeoFields(
        item.url,
        html,
        response.status,
        responseTimeMs,
        contentType
      );

      // Detect page type
      const pageType = detectPageType(result.url, result.title);

      // Determine indexability from meta robots
      let isIndexable: boolean | null = null;
      if (result.metaRobots) {
        isIndexable = !result.metaRobots.toLowerCase().includes("noindex");
      } else if (result.statusCode === 200) {
        isIndexable = true;
      } else if (result.statusCode >= 300) {
        isIndexable = false;
      }

      // Upsert URL record
      const normalizedUrl = normalizeUrl(item.url);
      await prisma.urlRecord.upsert({
        where: {
          projectRunId_url: { projectRunId, url: normalizedUrl },
        },
        update: {
          statusCode: result.statusCode,
          canonical: result.canonical,
          metaRobots: result.metaRobots,
          title: result.title,
          metaDescription: result.metaDescription,
          h1: result.h1,
          wordCount: result.wordCount,
          contentType: result.contentType,
          responseTimeMs: result.responseTimeMs,
          internalLinksOut: result.internalLinks.length,
          outlinks: result.internalLinks,
          pageType,
          isIndexable,
          isThinContent: result.wordCount < 200,
          missingTitle: !result.title,
          missingH1: !result.h1,
          dataSources: ["crawl"],
        },
        create: {
          projectRunId,
          url: normalizedUrl,
          urlRaw: item.url,
          statusCode: result.statusCode,
          canonical: result.canonical,
          metaRobots: result.metaRobots,
          title: result.title,
          metaDescription: result.metaDescription,
          h1: result.h1,
          wordCount: result.wordCount,
          contentType: result.contentType,
          responseTimeMs: result.responseTimeMs,
          crawlDepth: item.depth,
          internalLinksOut: result.internalLinks.length,
          outlinks: result.internalLinks,
          pageType,
          isIndexable,
          isThinContent: result.wordCount < 200,
          missingTitle: !result.title,
          missingH1: !result.h1,
          dataSources: ["crawl"],
        },
      });

      // Add discovered internal links to queue (if within depth limit)
      if (item.depth < maxDepth) {
        const newLinks = result.internalLinks
          .map(normalizeUrl)
          .filter((link) => {
            try {
              const linkUrl = new URL(link);
              return linkUrl.hostname === domain ||
                     linkUrl.hostname === `www.${domain}` ||
                     `www.${linkUrl.hostname}` === domain;
            } catch {
              return false;
            }
          })
          .filter((link) => {
            // Skip non-page URLs
            const lower = link.toLowerCase();
            return !lower.match(/\.(jpg|jpeg|png|gif|svg|webp|pdf|css|js|ico|woff|woff2|ttf|eot|mp4|mp3|zip|rar)$/);
          });

        if (newLinks.length > 0) {
          // Batch upsert new queue entries (skip existing ones)
          const existingUrls = await prisma.crawlQueue.findMany({
            where: {
              projectRunId,
              url: { in: newLinks },
            },
            select: { url: true },
          });
          const existingSet = new Set(existingUrls.map((e) => e.url));

          const toCreate = newLinks
            .filter((link) => !existingSet.has(link))
            .map((link) => ({
              projectRunId,
              url: link,
              depth: item.depth + 1,
              status: "pending",
            }));

          if (toCreate.length > 0) {
            await prisma.crawlQueue.createMany({
              data: toCreate,
              skipDuplicates: true,
            });
          }
        }
      }

      // Mark queue item complete
      await prisma.crawlQueue.update({
        where: { id: item.id },
        data: { status: "completed" },
      });

      processed++;

      // Politeness delay
      if (delayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    } catch (error) {
      // Mark as failed
      await prisma.crawlQueue.update({
        where: { id: item.id },
        data: {
          status: "failed",
          errorMessage: error instanceof Error ? error.message : "Unknown error",
        },
      });
      processed++;
    }
  }

  // Count remaining
  const remaining = await prisma.crawlQueue.count({
    where: { projectRunId, status: "pending" },
  });

  // Update run URL count
  const urlCount = await prisma.urlRecord.count({ where: { projectRunId } });
  await prisma.projectRun.update({
    where: { id: projectRunId },
    data: { urlCount },
  });

  return { processed, remaining };
}

/**
 * Post-crawl: compute internal links IN for each URL by analyzing outlinks.
 */
export async function computeInternalLinksIn(projectRunId: string) {
  const records = await prisma.urlRecord.findMany({
    where: { projectRunId },
    select: { id: true, url: true, outlinks: true },
  });

  // Build a map of url → count of pages linking to it
  const inlinkCounts = new Map<string, number>();

  for (const record of records) {
    const outlinks = (record.outlinks as string[]) || [];
    for (const link of outlinks) {
      const normalized = normalizeUrl(link);
      inlinkCounts.set(normalized, (inlinkCounts.get(normalized) || 0) + 1);
    }
  }

  // Update each record with its inlink count
  for (const record of records) {
    const inlinks = inlinkCounts.get(record.url) || 0;
    await prisma.urlRecord.update({
      where: { id: record.id },
      data: {
        internalLinksIn: inlinks,
        isOrphan: inlinks === 0,
      },
    });
  }
}
