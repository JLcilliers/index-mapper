import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { parseCSV } from "@/lib/ingestion/parser";
import { mergeRecords } from "@/lib/ingestion/merger";
import { computeDerivedFields } from "@/lib/ingestion/derived-fields";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const projectRunId = formData.get("projectRunId") as string;

    if (!projectRunId) {
      return NextResponse.json(
        { error: "Project run ID is required" },
        { status: 400 }
      );
    }

    // Verify run exists
    const run = await prisma.projectRun.findUnique({
      where: { id: projectRunId },
    });
    if (!run) {
      return NextResponse.json(
        { error: "Project run not found" },
        { status: 404 }
      );
    }

    const files = formData.getAll("files") as File[];
    if (files.length === 0) {
      return NextResponse.json(
        { error: "No files uploaded" },
        { status: 400 }
      );
    }

    const allRecords: ReturnType<typeof parseCSV>[] = [];
    const uploadedFileRecords = [];

    for (const file of files) {
      const content = await file.text();
      const result = parseCSV(content, file.name);

      // Save uploaded file record
      const uploadedFile = await prisma.uploadedFile.create({
        data: {
          fileName: file.name,
          fileType: result.fileType,
          fileSize: file.size,
          rowCount: result.rowCount,
          columnMapping: result.columnMapping as Record<string, string>,
          projectRunId,
        },
      });

      uploadedFileRecords.push({
        ...uploadedFile,
        errors: result.errors,
      });

      allRecords.push(result);
    }

    // Merge records from all files
    const allParsedRecords = allRecords.flatMap((r) => r.records);
    const merged = mergeRecords(allParsedRecords);

    // Compute derived fields
    const enriched = merged.map(computeDerivedFields);

    // Upsert URL records
    for (const record of enriched) {
      try {
        await prisma.urlRecord.upsert({
          where: {
            projectRunId_url: {
              projectRunId,
              url: record.url,
            },
          },
          create: {
            projectRunId,
            url: record.url,
            urlRaw: record.urlRaw,
            pageType: record.pageType,
            statusCode: record.statusCode,
            indexability: record.indexability,
            canonical: record.canonical,
            title: record.title,
            h1: record.h1,
            wordCount: record.wordCount,
            clicks: record.clicks,
            impressions: record.impressions,
            ctr: record.ctr,
            position: record.position,
            sessions: record.sessions,
            bounceRate: record.bounceRate,
            conversions: record.conversions,
            backlinks: record.backlinks,
            referringDomains: record.referringDomains,
            internalLinksIn: record.internalLinksIn,
            internalLinksOut: record.internalLinksOut,
            lastModified: record.lastModified,
            isIndexable: record.isIndexable,
            isOrphan: record.isOrphan,
            isThinContent: record.isThinContent,
            hasBacklinks: record.hasBacklinks,
            hasConversions: record.hasConversions,
            hasTraffic: record.hasTraffic,
            missingTitle: record.missingTitle,
            missingH1: record.missingH1,
            dataCompleteness: record.dataCompleteness,
            dataSources: record.dataSources,
          },
          update: {
            statusCode: record.statusCode,
            indexability: record.indexability,
            canonical: record.canonical,
            title: record.title,
            h1: record.h1,
            wordCount: record.wordCount,
            clicks: record.clicks,
            impressions: record.impressions,
            ctr: record.ctr,
            position: record.position,
            sessions: record.sessions,
            bounceRate: record.bounceRate,
            conversions: record.conversions,
            backlinks: record.backlinks,
            referringDomains: record.referringDomains,
            internalLinksIn: record.internalLinksIn,
            internalLinksOut: record.internalLinksOut,
            lastModified: record.lastModified,
            isIndexable: record.isIndexable,
            isOrphan: record.isOrphan,
            isThinContent: record.isThinContent,
            hasBacklinks: record.hasBacklinks,
            hasConversions: record.hasConversions,
            hasTraffic: record.hasTraffic,
            missingTitle: record.missingTitle,
            missingH1: record.missingH1,
            dataCompleteness: record.dataCompleteness,
            dataSources: record.dataSources,
            pageType: record.pageType,
          },
        });
      } catch {
        // Record already exists, skip
      }
    }

    // Update run URL count
    const totalUrls = await prisma.urlRecord.count({
      where: { projectRunId },
    });
    await prisma.projectRun.update({
      where: { id: projectRunId },
      data: { urlCount: totalUrls },
    });

    return NextResponse.json({
      success: true,
      files: uploadedFileRecords,
      urlsProcessed: enriched.length,
      totalUrlsInRun: totalUrls,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to process upload" },
      { status: 500 }
    );
  }
}
