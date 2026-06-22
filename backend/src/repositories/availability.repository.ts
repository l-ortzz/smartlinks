import { prisma } from "../lib/prisma.ts";
import type {
  CreateAvailabilityInput,
  UpdateAvailabilityInput,
} from "../types/availability.ts";

export async function findAvailability(userId?: string) {
  return prisma.availability.findMany({
    where: {
      userId,
    },
    orderBy: [
      {
        weekday: "asc",
      },
      {
        startTime: "asc",
      },
    ],
  });
}

export async function updateAvailabilityById(
  id: string,
  userId: string,
  input: UpdateAvailabilityInput,
) {
  const result = await prisma.availability.updateMany({
    where: {
      id,
      userId,
    },
    data: {
      weekday: input.weekday,
      startTime: input.startTime,
      endTime: input.endTime,
      active: input.active,
    },
  });

  if (!result.count) {
    throw new Error("Availability not found.");
  }

  return prisma.availability.findUnique({
    where: {
      id,
    },
  });
}

export async function deleteAvailabilityById(id: string, userId: string) {
  const result = await prisma.availability.deleteMany({
    where: {
      id,
      userId,
    },
  });

  if (!result.count) {
    throw new Error("Availability not found.");
  }
}

export async function insertAvailability(input: CreateAvailabilityInput) {
  if (!input.userId) {
    throw new Error("Availability userId is required.");
  }

  return prisma.availability.create({
    data: {
      userId: input.userId,
      weekday: input.weekday,
      startTime: input.startTime,
      endTime: input.endTime,
      active: input.active ?? true,
    },
  });
}
