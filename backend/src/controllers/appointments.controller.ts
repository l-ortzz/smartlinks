import type { FastifyReply, FastifyRequest } from "fastify";
import {
  createAppointmentService,
  listAppointmentsService,
  updateAppointmentStatusService,
} from "../services/appointments.service.ts";
import type {
  AppointmentStatus,
  CreateAppointmentInput,
} from "../types/appointments.ts";

type ListAppointmentsRequest = FastifyRequest<{
  Querystring: {
    userId?: string;
  };
}>;

export async function listAppointments(request: ListAppointmentsRequest) {
  return listAppointmentsService(request.user?.id ?? request.query.userId);
}

export async function createAppointment(
  request: FastifyRequest<{ Body: CreateAppointmentInput }>,
  reply: FastifyReply,
) {
  const appointment = await createAppointmentService(request.body);
  return reply.status(201).send(appointment);
}

export async function updateAppointmentStatus(
  request: FastifyRequest<{
    Params: { id: string };
    Body: { status: AppointmentStatus };
  }>,
  reply: FastifyReply,
) {
  if (!request.user) {
    return reply.status(401).send({ message: "Authentication required." });
  }

  try {
    const appointment = await updateAppointmentStatusService(
      request.params.id,
      request.user.id,
      request.body.status,
    );
    return reply.send(appointment);
  } catch (error) {
    return reply.status(404).send({
      message: error instanceof Error ? error.message : "Could not update appointment.",
    });
  }
}
