import type { FastifyInstance } from "fastify";
import { getModule, updateModule } from "../controllers/module.controller.ts";
import { requireAuth } from "../middlewares/auth.middleware.ts";
import { updateModuleSchema } from "../schemas/module.schema.ts";

export async function moduleRoutes(app: FastifyInstance) {
  app.get("/", { preHandler: requireAuth }, getModule);
  app.patch("/", {
    preHandler: requireAuth,
    schema: updateModuleSchema,
  }, updateModule);
}
