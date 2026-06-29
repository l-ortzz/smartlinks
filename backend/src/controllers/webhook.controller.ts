import type { FastifyReply, FastifyRequest } from "fastify";
import { webhookService } from "../services/subscription/webhook.service.ts";

export async function receiveWebhook(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    await webhookService(request.body);

    return reply.status(200).send({
      received: true,
    });
  } catch (error) {
    request.log.error({ err: error }, "Failed to process Asaas webhook.");

    return reply.status(500).send({
      message:
        error instanceof Error
          ? error.message
          : "Webhook error.",
    });
  }
}
