import { prisma } from "../lib/prisma.ts";
import type { CreateAvailabilityInput } from "../types/availability.ts";

export async function findAvailability(userId?: string) {
  return prisma.availability.findMany({
    where: {
      userId,
      active: true,
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
