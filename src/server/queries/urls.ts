import { prisma } from "@/lib/db";
import type { UrlFilterParams, PaginatedResult } from "@/types";
import type { UrlRecord } from "@prisma/client";
import { Prisma } from "@prisma/client";

export async function getUrlRecords(
  params: UrlFilterParams
): Promise<PaginatedResult<UrlRecord>> {
  const {
    projectRunId,
    recommendation,
    pageType,
    needsReview,
    isIndexable,
    hasTraffic,
    hasBacklinks,
    hasConversions,
    isThinContent,
    isOrphan,
    search,
    page = 1,
    pageSize = 50,
    sortBy = "url",
    sortOrder = "asc",
  } = params;

  const where: Prisma.UrlRecordWhereInput = {
    projectRunId,
    ...(recommendation && { recommendation }),
    ...(pageType && { pageType }),
    ...(needsReview !== undefined && { needsReview }),
    ...(isIndexable !== undefined && { isIndexable }),
    ...(hasTraffic !== undefined && { hasTraffic }),
    ...(hasBacklinks !== undefined && { hasBacklinks }),
    ...(hasConversions !== undefined && { hasConversions }),
    ...(isThinContent !== undefined && { isThinContent }),
    ...(isOrphan !== undefined && { isOrphan }),
    ...(search && {
      OR: [
        { url: { contains: search, mode: "insensitive" as const } },
        { title: { contains: search, mode: "insensitive" as const } },
      ],
    }),
  };

  const [data, total] = await Promise.all([
    prisma.urlRecord.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        reviewDecision: true,
      },
    }),
    prisma.urlRecord.count({ where }),
  ]);

  return {
    data,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getUrlRecord(id: string) {
  return prisma.urlRecord.findUnique({
    where: { id },
    include: {
      reviewDecision: true,
      projectRun: {
        include: {
          client: { select: { name: true, domain: true } },
        },
      },
    },
  });
}
