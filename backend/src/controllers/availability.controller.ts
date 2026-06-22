import type { FastifyReply, FastifyRequest } from "fastify";
import {
  createAvailabilityService,
  deleteAvailabilityService,
  listAvailabilityService,
  updateAvailabilityService,
} from "../services/availability.service.ts";
import type {
  CreateAvailabilityInput,
  UpdateAvailabilityInput,
} from "../types/availability.ts";

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

export async function updateAvailability(
  request: FastifyRequest<{
    Params: { id: string };
    Body: UpdateAvailabilityInput;
  }>,
  reply: FastifyReply,
) {
  if (!request.user) {
    return reply.status(401).send({ message: "Authentication required." });
  }

  try {
    const availability = await updateAvailabilityService(
      request.params.id,
      request.user.id,
      request.body,
    );
    return reply.send(availability);
  } catch (error) {
    return reply.status(400).send({
      message: error instanceof Error ? error.message : "Could not update availability.",
    });
  }
}

export async function deleteAvailability(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  if (!request.user) {
    return reply.status(401).send({ message: "Authentication required." });
  }

  try {
    await deleteAvailabilityService(request.params.id, request.user.id);
    return reply.status(204).send();
  } catch (error) {
    return reply.status(404).send({
      message: error instanceof Error ? error.message : "Could not delete availability.",
    });
  }
}
