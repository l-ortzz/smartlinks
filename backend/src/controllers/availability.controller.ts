import type { FastifyReply, FastifyRequest } from "fastify";
import {
  createAvailabilityService,
  listAvailabilityService,
} from "../services/availability.service.ts";
import type { CreateAvailabilityInput } from "../types/availability.ts";

type ListAvailabilityRequest = FastifyRequest<{
  Querystring: {
    userId?: string;
  };
}>;

export async function listAvailability(request: ListAvailabilityRequest) {
  return listAvailabilityService(request.user?.id ?? request.query.userId);
}

export async function createAvailability(
  request: FastifyRequest<{ Body: CreateAvailabilityInput }>,
  reply: FastifyReply,
) {
  if (!request.user) {
    return reply.status(401).send({
      message: "Authentication required.",
    });
  }

  const availability = await createAvailabilityService({
    ...request.body,
    userId: request.user.id,
  });
  return reply.status(201).send(availability);
}
