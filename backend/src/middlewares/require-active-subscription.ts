import type { FastifyReply, FastifyRequest } from "fastify";
import { hasActiveSubscription } from "../services/subscription/subscription-access.service.ts";

export async function requireActiveSubscription(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  if (!request.user) {
    return reply.status(401).send({
      message: "Authentication required.",
    });
  }

  const hasAccess = await hasActiveSubscription(request.user.id);

  if (!hasAccess) {
    return reply.status(403).send({
    code: "SUBSCRIPTION_REQUIRED",
    message: "Active subscription required.",
    });
  }
}