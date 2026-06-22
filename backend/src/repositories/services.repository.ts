import { prisma } from "../lib/prisma.ts";
import type { CreateServiceInput, UpdateServiceInput } from "../types/services.ts";

export async function findServices(userId?: string) {
  return prisma.service.findMany({
    where: {
      userId,
    },
    orderBy: {
      name: "asc",
    },
  });
}

export async function updateServiceById(
  id: string,
  userId: string,
  input: UpdateServiceInput,
) {
  const result = await prisma.service.updateMany({
    where: {
      id,
      userId,
    },
    data: {
      name: input.name,
      description: input.description,
      duration: input.duration,
      price: input.price,
      image: input.image,
      active: input.active,
    },
  });

  if (!result.count) {
    throw new Error("Service not found.");
  }

  return prisma.service.findUnique({
    where: {
      id,
    },
  });
}

export async function deleteServiceById(id: string, userId: string) {
  const result = await prisma.service.updateMany({
    where: {
      id,
      userId,
    },
    data: {
      active: false,
    },
  });

  if (!result.count) {
    throw new Error("Service not found.");
  }
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
      image: input.image,
      active: input.active ?? true,
    },
  });
}
