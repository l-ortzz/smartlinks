import { prisma } from "../lib/prisma.ts";
import type {
  AppointmentStatus,
  CreateAppointmentInput,
} from "../types/appointments.ts";

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

export async function findServiceForAppointment(serviceId: string) {
  return prisma.service.findUnique({
    where: {
      id: serviceId,
    },
  });
}

export async function updateAppointmentStatusById(
  id: string,
  userId: string,
  status: AppointmentStatus,
) {
  const result = await prisma.appointment.updateMany({
    where: {
      id,
      userId,
    },
    data: {
      status,
    },
  });

  if (!result.count) {
    throw new Error("Appointment not found.");
  }

  return prisma.appointment.findUnique({
    where: {
      id,
    },
    include: {
      service: true,
    },
  });
}
