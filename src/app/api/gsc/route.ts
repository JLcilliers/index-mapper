import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { listGscProperties, fetchGscPageData, getDateRange } from "@/lib/google/search-console";
import { matchGscToCrawlUrls } from "@/lib/google/url-matching";
import { normalizeUrl } from "@/lib/ingestion/normalizer";

/**
 * GET /api/gsc?action=properties — List available GSC properties
 * GET /api/gsc?action=fetch&projectRunId=xxx&range=6m — Fetch GSC data for a run
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action");

  try {
    if (action === "properties") {
      const properties = await listGscProperties();
      return NextResponse.json({ properties });
    }

    if (action === "fetch") {
      const projectRunId = searchParams.get("projectRunId");
      const range = (searchParams.get("range") || "6m") as "3m" | "6m" | "12m" | "custom";
      const customStart = searchParams.get("startDate") || undefined;
      const customEnd = searchParams.get("endDate") || undefined;

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

      if (!run.client.gscProperty) {
        return NextResponse.json(
          { error: "No GSC property linked to this client. Set it in client settings." },
          { status: 400 }
        );
      }

      // Update status
      await prisma.projectRun.update({
        where: { id: projectRunId },
        data: { status: "fetching_gsc" },
      });

      // Get date range
      const dates = getDateRange(range, customStart, customEnd);

      // Fetch GSC data
      const gscData = await fetchGscPageData(
        run.client.gscProperty,
        dates.startDate,
        dates.endDate
      );

      // Get all crawled URLs
      const crawledRecords = await prisma.urlRecord.findMany({
        where: { projectRunId },
        select: { url: true },
      });
      const crawledUrls = crawledRecords.map((r) => r.url);

      // Match GSC data to crawled URLs
      const { matched, gscOnly } = matchGscToCrawlUrls(gscData, crawledUrls);

      // Update matched URL records with GSC data
      let updatedCount = 0;
      for (const [normalizedUrl, gscRow] of matched) {
        await prisma.urlRecord.update({
          where: {
            projectRunId_url: { projectRunId, url: normalizedUrl },
          },
          data: {
            clicks: gscRow.clicks,
            impressions: gscRow.impressions,
            ctr: gscRow.ctr,
            position: gscRow.position,
            hasTraffic: gscRow.clicks > 0,
            gscMatched: true,
            dataSources: { set: ["crawl", "gsc"] },
          },
        });
        updatedCount++;
      }

      // Create records for GSC-only URLs (not found via crawl)
      let gscOnlyCount = 0;
      for (const gscRow of gscOnly) {
        const normalized = normalizeUrl(gscRow.page);
        await prisma.urlRecord.upsert({
          where: {
            projectRunId_url: { projectRunId, url: normalized },
          },
          update: {
            clicks: gscRow.clicks,
            impressions: gscRow.impressions,
            ctr: gscRow.ctr,
            position: gscRow.position,
            hasTraffic: gscRow.clicks > 0,
            gscMatched: true,
            dataSources: ["gsc"],
          },
          create: {
            projectRunId,
            url: normalized,
            urlRaw: gscRow.page,
            clicks: gscRow.clicks,
            impressions: gscRow.impressions,
            ctr: gscRow.ctr,
            position: gscRow.position,
            hasTraffic: gscRow.clicks > 0,
            gscMatched: true,
            dataSources: ["gsc"],
          },
        });
        gscOnlyCount++;
      }

      // Mark URLs not in GSC
      await prisma.urlRecord.updateMany({
        where: {
          projectRunId,
          gscMatched: null,
        },
        data: {
          gscMatched: false,
          hasTraffic: false,
        },
      });

      // Update run
      const urlCount = await prisma.urlRecord.count({ where: { projectRunId } });
      await prisma.projectRun.update({
        where: { id: projectRunId },
        data: {
          gscDateRangeStart: new Date(dates.startDate),
          gscDateRangeEnd: new Date(dates.endDate),
          gscFetchedAt: new Date(),
          status: "merging",
          urlCount,
        },
      });

      return NextResponse.json({
        totalGscPages: gscData.length,
        matched: updatedCount,
        gscOnly: gscOnlyCount,
        crawlOnly: crawledUrls.length - updatedCount,
        urlCount,
        dateRange: dates,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "GSC fetch failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
