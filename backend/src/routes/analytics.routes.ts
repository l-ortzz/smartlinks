import type { FastifyInstance } from "fastify";
import { listProductAnalytics } from "../controllers/analytics.controller.ts";
import { requireAuth } from "../middlewares/auth.middleware.ts";

export async function analyticsRoutes(app: FastifyInstance) {
  app.get("/products", { preHandler: requireAuth }, listProductAnalytics);
}
