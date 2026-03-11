import { prisma } from "@/lib/db";

export async function getRun(id: string) {
  return prisma.projectRun.findUnique({
    where: { id },
    include: {
      client: true,
      uploadedFiles: {
        orderBy: { uploadedAt: "desc" },
      },
      _count: {
        select: { urlRecords: true },
      },
      ruleConfig: true,
    },
  });
}

export async function getRunSummary(runId: string) {
  const bucketCounts = await prisma.urlRecord.groupBy({
    by: ["classification"],
    _count: { id: true },
    where: { projectRunId: runId, classification: { not: null } },
  });

  const pageTypeCounts = await prisma.urlRecord.groupBy({
    by: ["pageType"],
    _count: { id: true },
    where: { projectRunId: runId },
  });

  const reviewCount = await prisma.urlRecord.count({
    where: { projectRunId: runId, needsReview: true },
  });

  const totalCount = await prisma.urlRecord.count({
    where: { projectRunId: runId },
  });

  const reviewedCount = await prisma.reviewDecision.count({
    where: { urlRecord: { projectRunId: runId } },
  });

  return {
    totalCount,
    reviewCount,
    reviewedCount,
    bucketCounts: bucketCounts.reduce(
      (acc, item) => {
        if (item.classification) {
          acc[item.classification] = item._count.id;
        }
        return acc;
      },
      {} as Record<string, number>
    ),
    pageTypeCounts: pageTypeCounts.reduce(
      (acc, item) => {
        if (item.pageType) {
          acc[item.pageType] = item._count.id;
        }
        return acc;
      },
      {} as Record<string, number>
    ),
  };
}
