import type { FastifyInstance } from "fastify";
import { receiveWebhook } from "../controllers/webhook.controller.ts";

export async function webhookRoutes(app: FastifyInstance) {
  app.post("/", receiveWebhook);
}