import type { FastifyInstance } from "fastify";
import {
  createAvailability,
  deleteAvailability,
  listAvailability,
  updateAvailability,
} from "../controllers/availability.controller.ts";
import { requireAuth } from "../middlewares/auth.middleware.ts";
import {
  createAvailabilitySchema,
  listAvailabilitySchema,
  updateAvailabilitySchema,
} from "../schemas/availability.schema.ts";
import type {
  CreateAvailabilityInput,
  UpdateAvailabilityInput,
} from "../types/availability.ts";

export async function availabilityRoutes(app: FastifyInstance) {
  app.get<{ Querystring: { userId?: string } }>(
    "/",
    { preHandler: requireAuth, schema: listAvailabilitySchema },
    listAvailability,
  );
  app.post<{ Body: CreateAvailabilityInput }>(
    "/",
    { preHandler: requireAuth, schema: createAvailabilitySchema },
    createAvailability,
  );
  app.put<{ Params: { id: string }; Body: UpdateAvailabilityInput }>(
    "/:id",
    { preHandler: requireAuth, schema: updateAvailabilitySchema },
    updateAvailability,
  );
  app.delete<{ Params: { id: string } }>(
    "/:id",
    { preHandler: requireAuth },
    deleteAvailability,
  );
}
