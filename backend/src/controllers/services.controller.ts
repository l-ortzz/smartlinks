import type { FastifyReply, FastifyRequest } from "fastify";
import {
  createServiceService,
  deleteServiceService,
  listServicesService,
  updateServiceService,
} from "../services/services.service.ts";
import type { CreateServiceInput, UpdateServiceInput } from "../types/services.ts";

type ListServicesRequest = FastifyRequest<{
  Querystring: {
    userId?: string;
  };
}>;

export async function listServices(request: ListServicesRequest) {
  return listServicesService(request.user?.id ?? request.query.userId);
}

export async function createService(
  request: FastifyRequest<{ Body: CreateServiceInput }>,
  reply: FastifyReply,
) {
  if (!request.user) {
    return reply.status(401).send({
      message: "Authentication required.",
    });
  }

  const service = await createServiceService({
    ...request.body,
    userId: request.user.id,
  });
  return reply.status(201).send(service);
}

type ServiceIdRequest = FastifyRequest<{
  Params: {
    id: string;
  };
}>;

export async function updateService(
  request: FastifyRequest<{
    Params: { id: string };
    Body: UpdateServiceInput;
  }>,
  reply: FastifyReply,
) {
  if (!request.user) {
    return reply.status(401).send({
      message: "Authentication required.",
    });
  }

  try {
    const service = await updateServiceService(
      request.params.id,
      request.user.id,
      request.body,
    );

    return reply.send(service);
  } catch (error) {
    return reply.status(404).send({
      message:
        error instanceof Error
          ? error.message
          : "Could not update service.",
    });
  }
}

export async function deleteService(
  request: ServiceIdRequest,
  reply: FastifyReply,
) {
  if (!request.user) {
    return reply.status(401).send({
      message: "Authentication required.",
    });
  }

  try {
    await deleteServiceService(request.params.id, request.user.id);

    return reply.status(204).send();
  } catch (error) {
    return reply.status(404).send({
      message:
        error instanceof Error
          ? error.message
          : "Could not delete service.",
    });
  }
}
