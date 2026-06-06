import type { FastifyReply, FastifyRequest } from "fastify";
import {
  createAppointmentService,
  listAppointmentsService,
} from "../services/appointments.service.ts";
import type { CreateAppointmentInput } from "../types/appointments.ts";

type ListAppointmentsRequest = FastifyRequest<{
  Querystring: {
    userId?: string;
  };
}>;

export async function listAppointments(request: ListAppointmentsRequest) {
  return listAppointmentsService(request.query.userId);
}

export async function createAppointment(
  request: FastifyRequest<{ Body: CreateAppointmentInput }>,
  reply: FastifyReply,
) {
  const appointment = await createAppointmentService(request.body);
  return reply.status(201).send(appointment);
}
