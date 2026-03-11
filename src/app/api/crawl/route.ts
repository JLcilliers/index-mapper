import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { initializeCrawl, processCrawlBatch, computeInternalLinksIn } from "@/lib/crawler/crawler";

/**
 * POST /api/crawl — Start or continue a crawl
 *
 * Body: { projectRunId, action: "start" | "batch" | "finalize" }
 */
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { projectRunId, action } = body;

  if (!projectRunId) {
    return NextResponse.json({ error: "projectRunId is required" }, { status: 400 });
  }

  const run = await prisma.projectRun.findUnique({
    where: { id: projectRunId },
    include: { client: true },
  });

  if (!run) {
    return NextResponse.json({ error: "Run not found" }, { status: 404 });
  }

  try {
    if (action === "start") {
      // Initialize crawl
      const domain = run.client.domain.replace(/^(https?:\/\/)?(www\.)?/, "").replace(/\/$/, "");
      const result = await initializeCrawl({
        projectRunId,
        domain,
        maxPages: run.crawlMaxPages,
        maxDepth: run.crawlMaxDepth,
      });

      await prisma.projectRun.update({
        where: { id: projectRunId },
        data: {
          status: "crawling",
          crawlStarted: new Date(),
          crawlError: null,
        },
      });

      return NextResponse.json({
        status: "crawling",
        robotsRules: result.robotsRules,
        sitemaps: result.sitemaps,
      });
    }

    if (action === "batch") {
      const domain = run.client.domain.replace(/^(https?:\/\/)?(www\.)?/, "").replace(/\/$/, "");
      const robotsRules = body.robotsRules || [];

      const result = await processCrawlBatch(
        projectRunId,
        domain,
        robotsRules,
        10, // batch size
        run.crawlMaxPages,
        run.crawlMaxDepth,
        200 // delay ms
      );

      // Get progress
      const progress = await getCrawlProgress(projectRunId);

      if (result.remaining === 0) {
        // Crawl complete
        return NextResponse.json({
          status: "batch_complete",
          done: true,
          progress,
        });
      }

      return NextResponse.json({
        status: "batch_complete",
        done: false,
        processed: result.processed,
        remaining: result.remaining,
        progress,
      });
    }

    if (action === "finalize") {
      // Compute internal links in and mark crawl complete
      await computeInternalLinksIn(projectRunId);

      // Compute data completeness for crawl-only records
      await updateDataCompleteness(projectRunId);

      const urlCount = await prisma.urlRecord.count({ where: { projectRunId } });

      await prisma.projectRun.update({
        where: { id: projectRunId },
        data: {
          status: "crawl_complete",
          crawlCompleted: new Date(),
          urlCount,
        },
      });

      return NextResponse.json({
        status: "crawl_complete",
        urlCount,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Crawl failed";
    await prisma.projectRun.update({
      where: { id: projectRunId },
      data: { crawlError: message },
    });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * GET /api/crawl?projectRunId=xxx — Get crawl progress
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const projectRunId = searchParams.get("projectRunId");

  if (!projectRunId) {
    return NextResponse.json({ error: "projectRunId is required" }, { status: 400 });
  }

  const progress = await getCrawlProgress(projectRunId);
  return NextResponse.json(progress);
}

async function getCrawlProgress(projectRunId: string) {
  const [completed, failed, pending, total] = await Promise.all([
    prisma.crawlQueue.count({ where: { projectRunId, status: "completed" } }),
    prisma.crawlQueue.count({ where: { projectRunId, status: "failed" } }),
    prisma.crawlQueue.count({ where: { projectRunId, status: "pending" } }),
    prisma.crawlQueue.count({ where: { projectRunId } }),
  ]);

  const urlCount = await prisma.urlRecord.count({ where: { projectRunId } });

  return {
    completed,
    failed,
    pending,
    total,
    urlCount,
  };
}

async function updateDataCompleteness(projectRunId: string) {
  const records = await prisma.urlRecord.findMany({
    where: { projectRunId },
    select: {
      id: true, statusCode: true, title: true, h1: true,
      wordCount: true, clicks: true, impressions: true,
      sessions: true, conversions: true, backlinks: true,
      internalLinksIn: true, canonical: true,
    },
  });

  for (const record of records) {
    const fields = [
      record.statusCode, record.title, record.h1,
      record.wordCount, record.clicks, record.impressions,
      record.sessions, record.conversions, record.backlinks,
      record.internalLinksIn, record.canonical,
    ];
    const available = fields.filter((f) => f !== null && f !== undefined).length;
    const completeness = available / fields.length;

    await prisma.urlRecord.update({
      where: { id: record.id },
      data: { dataCompleteness: completeness },
    });
  }
}
