import type { FastifyInstance } from "fastify";
import {
  createAvailability,
  listAvailability,
} from "../controllers/availability.controller.ts";
import { requireAuth } from "../middlewares/auth.middleware.ts";
import {
  createAvailabilitySchema,
  listAvailabilitySchema,
} from "../schemas/availability.schema.ts";
import type { CreateAvailabilityInput } from "../types/availability.ts";

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
}
