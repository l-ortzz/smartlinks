import { prisma } from "../lib/prisma.ts";
import type { ModuleType } from "../../generated/prisma/client.ts";

export async function findSelectedModuleByUserId(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { selectedModule: true },
  });

  return user?.selectedModule ?? null;
}

export async function updateSelectedModuleByUserId(
  userId: string,
  module: ModuleType,
) {
  return prisma.user.update({
    where: { id: userId },
    select: { selectedModule: true },
    data: { selectedModule: module },
  });
}
