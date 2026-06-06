import type { FastifyReply, FastifyRequest } from "fastify";
import {
  createReservationService,
  listReservationsService,
} from "../services/reservations.service.ts";
import type { CreateReservationInput } from "../types/reservations.ts";

type ListReservationsRequest = FastifyRequest<{
  Querystring: {
    productId?: string;
  };
}>;

export async function listReservations(request: ListReservationsRequest) {
  return listReservationsService(request.query.productId);
}

export async function createReservation(
  request: FastifyRequest<{ Body: CreateReservationInput }>,
  reply: FastifyReply,
) {
  const reservation = await createReservationService(request.body);
  return reply.status(201).send(reservation);
}
