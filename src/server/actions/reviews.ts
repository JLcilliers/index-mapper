"use server";

import { prisma } from "@/lib/db";
import { reviewDecisionSchema } from "@/types/schemas";
import { revalidatePath } from "next/cache";

export async function submitReview(data: unknown) {
  const validated = reviewDecisionSchema.parse(data);

  const urlRecord = await prisma.urlRecord.findUnique({
    where: { id: validated.urlRecordId },
    select: {
      classification: true,
      projectRunId: true,
      projectRun: { select: { clientId: true } },
    },
  });

  if (!urlRecord) throw new Error("URL record not found");

  const decision = await prisma.reviewDecision.upsert({
    where: { urlRecordId: validated.urlRecordId },
    create: {
      urlRecordId: validated.urlRecordId,
      originalClassification: urlRecord.classification || "unknown",
      finalClassification: validated.finalClassification,
      reason: validated.reason,
      notes: validated.notes,
      targetUrl: validated.targetUrl,
    },
    update: {
      finalClassification: validated.finalClassification,
      reason: validated.reason,
      notes: validated.notes,
      targetUrl: validated.targetUrl,
      reviewedAt: new Date(),
    },
  });

  revalidatePath(
    `/clients/${urlRecord.projectRun.clientId}/runs/${urlRecord.projectRunId}`
  );

  return decision;
}
