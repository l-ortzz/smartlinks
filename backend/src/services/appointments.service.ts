import {
  findAppointments,
  findServiceForAppointment,
  insertAppointment,
  updateAppointmentStatusById,
} from "../repositories/appointments.repository.ts";
import type {
  AppointmentStatus,
  CreateAppointmentInput,
} from "../types/appointments.ts";
import { buildWhatsAppUrl } from "../utils/whatsapp.ts";

export async function listAppointmentsService(userId?: string) {
  return findAppointments(userId);
}

export async function createAppointmentService(input: CreateAppointmentInput) {
  const appointmentDate = new Date(input.date);

  if (Number.isNaN(appointmentDate.getTime())) {
    throw new Error("Invalid appointment date.");
  }

  if (appointmentDate.getTime() <= Date.now()) {
    throw new Error("Appointment date must be in the future.");
  }

  const service = await findServiceForAppointment(input.serviceId);

  if (!service || !service.active || service.userId !== input.userId) {
    throw new Error("Service is not available for appointments.");
  }

  const appointment = await insertAppointment(input);
  const message = [
    `Agendamento #${appointment.id}`,
    `Cliente: ${appointment.customerName}`,
    `Telefone: ${appointment.customerPhone}`,
    `Servico: ${appointment.service.name}`,
    `Data: ${appointment.date.toISOString()}`,
  ].join("\n");

  return {
    appointment,
    whatsappUrl: buildWhatsAppUrl({
      phone: appointment.user.numeroWhatsApp,
      message,
    }),
  };
}

export async function updateAppointmentStatusService(
  id: string,
  userId: string,
  status: AppointmentStatus,
) {
  return updateAppointmentStatusById(id, userId, status);
}
