import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const projectRunId = searchParams.get("projectRunId");

  if (!projectRunId) {
    return NextResponse.json(
      { error: "Project run ID is required" },
      { status: 400 }
    );
  }

  const records = await prisma.urlRecord.findMany({
    where: { projectRunId },
    include: { reviewDecision: true },
    orderBy: { url: "asc" },
  });

  // Build CSV
  const headers = [
    "URL",
    "Page Type",
    "Status Code",
    "Indexable",
    "Title",
    "H1",
    "Word Count",
    "Clicks",
    "Impressions",
    "Sessions",
    "Conversions",
    "Backlinks",
    "Referring Domains",
    "Internal Links In",
    "Internal Links Out",
    "Machine Classification",
    "Final Classification",
    "Confidence",
    "Primary Reason",
    "Secondary Reason",
    "Suggested Action",
    "Suggested Target URL",
    "Needs Review",
    "Review Decision Reason",
    "Review Notes",
    "Total Score",
  ];

  const rows = records.map((r) => {
    const finalClassification =
      r.reviewDecision?.finalClassification ?? r.classification ?? "";

    return [
      r.url,
      r.pageType ?? "",
      r.statusCode?.toString() ?? "",
      r.isIndexable?.toString() ?? "",
      escapeCsvField(r.title ?? ""),
      escapeCsvField(r.h1 ?? ""),
      r.wordCount?.toString() ?? "",
      r.clicks?.toString() ?? "",
      r.impressions?.toString() ?? "",
      r.sessions?.toString() ?? "",
      r.conversions?.toString() ?? "",
      r.backlinks?.toString() ?? "",
      r.referringDomains?.toString() ?? "",
      r.internalLinksIn?.toString() ?? "",
      r.internalLinksOut?.toString() ?? "",
      r.classification ?? "",
      finalClassification,
      r.confidenceScore?.toFixed(2) ?? "",
      escapeCsvField(r.primaryReason ?? ""),
      escapeCsvField(r.secondaryReason ?? ""),
      escapeCsvField(r.suggestedAction ?? ""),
      r.suggestedTargetUrl ?? "",
      r.needsReview.toString(),
      escapeCsvField(r.reviewDecision?.reason ?? ""),
      escapeCsvField(r.reviewDecision?.notes ?? ""),
      r.totalScore?.toFixed(1) ?? "",
    ].join(",");
  });

  const csv = [headers.join(","), ...rows].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="index-mapping-export.csv"`,
    },
  });
}

function escapeCsvField(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
