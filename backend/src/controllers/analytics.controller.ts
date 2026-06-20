import type { FastifyReply, FastifyRequest } from "fastify";
import { listProductAnalyticsService } from "../services/analytics.service.ts";

export async function listProductAnalytics(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  if (!request.user) {
    return reply.status(401).send({
      message: "Authentication required.",
    });
  }

  const analytics = await listProductAnalyticsService(request.user.id);

  return reply.send(analytics);
}
