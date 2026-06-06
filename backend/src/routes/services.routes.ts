import type { FastifyInstance } from "fastify";
import { createService, listServices } from "../controllers/services.controller.ts";
import { requireAuth } from "../middlewares/auth.middleware.ts";
import { createServiceSchema, listServicesSchema } from "../schemas/services.schema.ts";
import type { CreateServiceInput } from "../types/services.ts";

export async function serviceRoutes(app: FastifyInstance) {
  app.get<{ Querystring: { userId?: string } }>(
    "/",
    { preHandler: requireAuth, schema: listServicesSchema },
    listServices,
  );
  app.post<{ Body: CreateServiceInput }>(
    "/",
    { preHandler: requireAuth, schema: createServiceSchema },
    createService,
  );
}
