import { findAppointments, insertAppointment } from "../repositories/appointments.repository.ts";
import type { CreateAppointmentInput } from "../types/appointments.ts";
import { buildWhatsAppUrl } from "../utils/whatsapp.ts";

export async function listAppointmentsService(userId?: string) {
  return findAppointments(userId);
}

export async function createAppointmentService(input: CreateAppointmentInput) {
  const appointmentDate = new Date(input.date);

  if (Number.isNaN(appointmentDate.getTime())) {
    throw new Error("Invalid appointment date.");
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
