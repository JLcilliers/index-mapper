import { prisma } from "@/lib/db";

export async function getClients(includeInactive = false) {
  return prisma.client.findMany({
    where: includeInactive ? {} : { isActive: true },
    include: {
      _count: {
        select: { projectRuns: true },
      },
    },
    orderBy: { name: "asc" },
  });
}

export async function getClient(id: string) {
  return prisma.client.findUnique({
    where: { id },
    include: {
      projectRuns: {
        orderBy: { createdAt: "desc" },
        include: {
          _count: {
            select: { urlRecords: true, uploadedFiles: true },
          },
        },
      },
    },
  });
}

export async function getDashboardStats() {
  const [clientCount, runCount, urlCount, reviewCount] = await Promise.all([
    prisma.client.count({ where: { isActive: true } }),
    prisma.projectRun.count(),
    prisma.urlRecord.count(),
    prisma.urlRecord.count({ where: { needsReview: true } }),
  ]);

  const bucketCounts = await prisma.urlRecord.groupBy({
    by: ["classification"],
    _count: { id: true },
    where: { classification: { not: null } },
  });

  const recentRuns = await prisma.projectRun.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    include: {
      client: { select: { name: true, domain: true } },
      _count: { select: { urlRecords: true } },
    },
  });

  return {
    clientCount,
    runCount,
    urlCount,
    reviewCount,
    bucketCounts: bucketCounts.reduce(
      (acc, item) => {
        if (item.classification) {
          acc[item.classification] = item._count.id;
        }
        return acc;
      },
      {} as Record<string, number>
    ),
    recentRuns,
  };
}
