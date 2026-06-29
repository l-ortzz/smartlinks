import type { FastifyReply, FastifyRequest } from "fastify";
import {
  getSelectedModuleService,
  updateSelectedModuleService,
} from "../services/module.service.ts";

export async function getModule(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  if (!request.user) {
    return reply.status(401).send({
      message: "Authentication required.",
    });
  }

  const result = await getSelectedModuleService(request.user.id);
  return reply.send(result);
}

export async function updateModule(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  if (!request.user) {
    return reply.status(401).send({
      message: "Authentication required.",
    });
  }

  const { module } = request.body as { module: string };

  if (module !== "PAGES" && module !== "AGENDS") {
    return reply.status(400).send({
      message: "Invalid module. Use PAGES or AGENDS.",
    });
  }

  const result = await updateSelectedModuleService(request.user.id, module);
  return reply.send(result);
}
