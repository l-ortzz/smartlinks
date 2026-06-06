import type { FastifyReply, FastifyRequest } from "fastify";
import { createServiceService, listServicesService } from "../services/services.service.ts";
import type { CreateServiceInput } from "../types/services.ts";

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
