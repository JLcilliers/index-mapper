import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const projectRunId = searchParams.get("projectRunId");
  const format = searchParams.get("format") || "full"; // full, noindex, urls

  if (!projectRunId) {
    return NextResponse.json(
      { error: "Project run ID is required" },
      { status: 400 }
    );
  }

  const run = await prisma.projectRun.findUnique({
    where: { id: projectRunId },
    include: { client: true },
  });

  if (!run) {
    return NextResponse.json({ error: "Run not found" }, { status: 404 });
  }

  const records = await prisma.urlRecord.findMany({
    where: { projectRunId },
    include: { reviewDecision: true },
    orderBy: { url: "asc" },
  });

  if (format === "noindex") {
    return buildNoindexExport(records, run.client.name, run.client.domain, run.name);
  }

  if (format === "urls") {
    return buildUrlListExport(records);
  }

  return buildFullExport(records, run.client.name, run.client.domain, run.name);
}

function buildFullExport(
  records: Array<Record<string, unknown>>,
  clientName: string,
  domain: string,
  runName: string
) {
  const headers = [
    "Client",
    "Domain",
    "Run",
    "URL",
    "Page Type",
    "Status Code",
    "Meta Robots",
    "Indexable",
    "Title",
    "H1",
    "Word Count",
    "Clicks",
    "Impressions",
    "CTR",
    "Avg Position",
    "Sessions",
    "Conversions",
    "Backlinks",
    "Referring Domains",
    "Internal Links In",
    "Internal Links Out",
    "Recommendation",
    "Final Recommendation",
    "Secondary Action",
    "Confidence",
    "Primary Reason",
    "Secondary Reason",
    "Suggested Action",
    "Suggested Target URL",
    "Needs Review",
    "Review Decision Reason",
    "Review Notes",
    "Noindex Approved",
    "Total Score",
    "GSC Matched",
    "Data Sources",
  ];

  const rows = records.map((r: Record<string, unknown>) => {
    const review = r.reviewDecision as Record<string, unknown> | null;
    const finalRec = review?.finalRecommendation ?? r.recommendation ?? "";

    return [
      escapeCsvField(clientName),
      domain,
      escapeCsvField(runName),
      r.url as string,
      (r.pageType as string) ?? "",
      r.statusCode?.toString() ?? "",
      (r.metaRobots as string) ?? "",
      r.isIndexable?.toString() ?? "",
      escapeCsvField((r.title as string) ?? ""),
      escapeCsvField((r.h1 as string) ?? ""),
      r.wordCount?.toString() ?? "",
      r.clicks?.toString() ?? "",
      r.impressions?.toString() ?? "",
      typeof r.ctr === "number" ? (r.ctr as number).toFixed(4) : "",
      typeof r.position === "number" ? (r.position as number).toFixed(1) : "",
      r.sessions?.toString() ?? "",
      r.conversions?.toString() ?? "",
      r.backlinks?.toString() ?? "",
      r.referringDomains?.toString() ?? "",
      r.internalLinksIn?.toString() ?? "",
      r.internalLinksOut?.toString() ?? "",
      (r.recommendation as string) ?? "",
      finalRec as string,
      (r.secondaryAction as string) ?? "",
      typeof r.confidenceScore === "number" ? (r.confidenceScore as number).toFixed(2) : "",
      escapeCsvField((r.primaryReason as string) ?? ""),
      escapeCsvField((r.secondaryReason as string) ?? ""),
      escapeCsvField((r.suggestedAction as string) ?? ""),
      (r.suggestedTargetUrl as string) ?? "",
      (r.needsReview as boolean)?.toString() ?? "",
      escapeCsvField((review?.reason as string) ?? ""),
      escapeCsvField((review?.notes as string) ?? ""),
      review?.approved?.toString() ?? "",
      typeof r.totalScore === "number" ? (r.totalScore as number).toFixed(1) : "",
      r.gscMatched?.toString() ?? "",
      Array.isArray(r.dataSources) ? (r.dataSources as string[]).join("; ") : "",
    ].join(",");
  });

  const csv = [headers.join(","), ...rows].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="index-mapper-full-report.csv"`,
    },
  });
}

function buildNoindexExport(
  records: Array<Record<string, unknown>>,
  clientName: string,
  domain: string,
  runName: string
) {
  // Only include URLs that are recommended for noindex AND approved by reviewer
  const noindexRecords = records.filter((r) => {
    const review = r.reviewDecision as Record<string, unknown> | null;
    const finalRec = review?.finalRecommendation ?? r.recommendation;
    return finalRec === "CONSIDER_NOINDEX" && (review?.approved === true || !review);
  });

  const headers = [
    "Client",
    "Domain",
    "URL",
    "Page Type",
    "Recommendation",
    "Confidence",
    "Primary Reason",
    "Implementation Method",
    "Secondary Action",
    "Clicks",
    "Impressions",
    "Word Count",
    "Review Status",
    "Reviewer Notes",
  ];

  const rows = noindexRecords.map((r: Record<string, unknown>) => {
    const review = r.reviewDecision as Record<string, unknown> | null;
    const reviewStatus = review?.approved ? "Approved" : review ? "Reviewed" : "Pending";

    return [
      escapeCsvField(clientName),
      domain,
      r.url as string,
      (r.pageType as string) ?? "",
      "NOINDEX",
      typeof r.confidenceScore === "number" ? (r.confidenceScore as number).toFixed(2) : "",
      escapeCsvField((r.primaryReason as string) ?? ""),
      (r.secondaryAction as string) ?? "noindex_only",
      (r.secondaryAction as string) ?? "",
      r.clicks?.toString() ?? "0",
      r.impressions?.toString() ?? "0",
      r.wordCount?.toString() ?? "",
      reviewStatus,
      escapeCsvField((review?.notes as string) ?? ""),
    ].join(",");
  });

  const csv = [headers.join(","), ...rows].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="noindex-action-sheet.csv"`,
    },
  });
}

function buildUrlListExport(records: Array<Record<string, unknown>>) {
  const noindexUrls = records
    .filter((r) => {
      const review = r.reviewDecision as Record<string, unknown> | null;
      const finalRec = review?.finalRecommendation ?? r.recommendation;
      return finalRec === "CONSIDER_NOINDEX";
    })
    .map((r) => r.url as string);

  const text = noindexUrls.join("\n");

  return new NextResponse(text, {
    headers: {
      "Content-Type": "text/plain",
      "Content-Disposition": `attachment; filename="noindex-urls.txt"`,
    },
  });
}

function escapeCsvField(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
