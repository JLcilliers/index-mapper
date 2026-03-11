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
  const recommendationCounts = await prisma.urlRecord.groupBy({
    by: ["recommendation"],
    _count: { id: true },
    where: { projectRunId: runId, recommendation: { not: null } },
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

  const gscMatchedCount = await prisma.urlRecord.count({
    where: { projectRunId: runId, gscMatched: true },
  });

  return {
    totalCount,
    reviewCount,
    reviewedCount,
    gscMatchedCount,
    bucketCounts: recommendationCounts.reduce(
      (acc, item) => {
        if (item.recommendation) {
          acc[item.recommendation] = item._count.id;
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
