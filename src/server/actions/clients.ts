"use server";

import { prisma } from "@/lib/db";
import { clientSchema } from "@/types/schemas";
import { revalidatePath } from "next/cache";

export async function createClient(data: unknown) {
  const validated = clientSchema.parse(data);

  const client = await prisma.client.create({
    data: validated,
  });

  revalidatePath("/clients");
  revalidatePath("/");
  return client;
}

export async function updateClient(id: string, data: unknown) {
  const validated = clientSchema.parse(data);

  const client = await prisma.client.update({
    where: { id },
    data: validated,
  });

  revalidatePath("/clients");
  revalidatePath(`/clients/${id}`);
  revalidatePath("/");
  return client;
}

export async function archiveClient(id: string) {
  await prisma.client.update({
    where: { id },
    data: { isActive: false },
  });

  revalidatePath("/clients");
  revalidatePath("/");
}
