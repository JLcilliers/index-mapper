"use server";

import { prisma } from "@/lib/db";
import { projectRunSchema } from "@/types/schemas";
import { revalidatePath } from "next/cache";
import type { RunStatus } from "@/types";

export async function createRun(data: unknown) {
  const validated = projectRunSchema.parse(data);

  const run = await prisma.projectRun.create({
    data: {
      name: validated.name,
      description: validated.description,
      clientId: validated.clientId,
      crawlMaxPages: validated.crawlMaxPages,
      crawlMaxDepth: validated.crawlMaxDepth,
    },
  });

  revalidatePath(`/clients/${validated.clientId}`);
  return run;
}

export async function updateRunStatus(runId: string, status: RunStatus) {
  const run = await prisma.projectRun.update({
    where: { id: runId },
    data: { status },
  });

  revalidatePath(`/clients/${run.clientId}`);
  revalidatePath(`/clients/${run.clientId}/runs/${runId}`);
  return run;
}

export async function deleteRun(runId: string) {
  const run = await prisma.projectRun.findUnique({
    where: { id: runId },
    select: { clientId: true },
  });

  if (!run) throw new Error("Run not found");

  await prisma.projectRun.delete({ where: { id: runId } });

  revalidatePath(`/clients/${run.clientId}`);
  revalidatePath("/");
}
