import { prisma } from "../lib/prisma.ts";
import type { CreateAppointmentInput } from "../types/appointments.ts";

export async function findAppointments(userId?: string) {
  return prisma.appointment.findMany({
    where: {
      userId,
    },
    include: {
      service: true,
    },
    orderBy: {
      date: "asc",
    },
  });
}

export async function insertAppointment(input: CreateAppointmentInput) {
  return prisma.appointment.create({
    data: {
      userId: input.userId,
      serviceId: input.serviceId,
      customerName: input.customerName,
      customerPhone: input.customerPhone,
      date: new Date(input.date),
    },
    include: {
      service: true,
      user: true,
    },
  });
}
