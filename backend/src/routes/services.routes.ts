import type { FastifyInstance } from "fastify";
import {
  createService,
  deleteService,
  listServices,
  updateService,
} from "../controllers/services.controller.ts";
import { requireAuth } from "../middlewares/auth.middleware.ts";
import {
  createServiceSchema,
  listServicesSchema,
  updateServiceSchema,
} from "../schemas/services.schema.ts";
import type { CreateServiceInput, UpdateServiceInput } from "../types/services.ts";

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
  app.put<{ Params: { id: string }; Body: UpdateServiceInput }>(
    "/:id",
    { preHandler: requireAuth, schema: updateServiceSchema },
    updateService,
  );
  app.delete<{ Params: { id: string } }>(
    "/:id",
    { preHandler: requireAuth },
    deleteService,
  );
}
