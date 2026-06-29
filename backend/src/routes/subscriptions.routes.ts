import type { FastifyInstance } from "fastify";
import {
  createSubscription,
  getSubscription,
  testAsaasConnection,
} from "../controllers/subscriptions.controller.ts";
import { requireAuth } from "../middlewares/auth.middleware.ts";

export async function subscriptionsRoutes(app: FastifyInstance) {
  app.get("/", { preHandler: requireAuth }, getSubscription);

  app.post<{ Body: { planId: string } }>(
    "/",
    { preHandler: requireAuth },
    createSubscription,
  );

  app.get("/test", { preHandler: requireAuth }, testAsaasConnection);
}

