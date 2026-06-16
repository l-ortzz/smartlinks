import type { FastifyInstance } from "fastify";
import {
  uploadLogo,
  uploadProductImages,
} from "../controllers/uploads.controller.ts";
import { requireAuth } from "../middlewares/auth.middleware.ts";

export async function uploadRoutes(app: FastifyInstance) {
  app.post("/logo", { preHandler: requireAuth }, uploadLogo);
  app.post("/product", { preHandler: requireAuth }, uploadProductImages);
}
