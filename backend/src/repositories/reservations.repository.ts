import { prisma } from "../lib/prisma.ts";
import type { CreateReservationInput } from "../types/reservations.ts";

const DEFAULT_RESERVATION_HOURS = 24;

export async function findReservations(productId?: string) {
  return prisma.reservation.findMany({
    where: {
      productId,
    },
    include: {
      product: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function insertReservation(input: CreateReservationInput) {
  const defaultExpiresAt = new Date(Date.now() + DEFAULT_RESERVATION_HOURS * 60 * 60 * 1000);

  return prisma.reservation.create({
    data: {
      productId: input.productId,
      customerName: input.customerName,
      customerPhone: input.customerPhone,
      quantity: input.quantity ?? 1,
      expiresAt: input.expiresAt ? new Date(input.expiresAt) : defaultExpiresAt,
    },
    include: {
      product: {
        include: {
          user: true,
        },
      },
    },
  });
}
