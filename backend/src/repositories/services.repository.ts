import { prisma } from "../lib/prisma.ts";
import type { CreateServiceInput } from "../types/services.ts";

export async function findServices(userId?: string) {
  return prisma.service.findMany({
    where: {
      userId,
      active: true,
    },
    orderBy: {
      name: "asc",
    },
  });
}

export async function insertService(input: CreateServiceInput) {
  if (!input.userId) {
    throw new Error("Service userId is required.");
  }

  return prisma.service.create({
    data: {
      userId: input.userId,
      name: input.name,
      description: input.description,
      duration: input.duration,
      price: input.price,
      active: input.active ?? true,
    },
  });
}
