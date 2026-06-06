import type { FastifyInstance } from "fastify";
import {
  getPublicProduct,
  trackProductClick,
} from "../controllers/public-pages.controller.ts";
import { createReservation } from "../controllers/reservations.controller.ts";
import {
  getPublicProductSchema,
  trackProductClickSchema,
} from "../schemas/public-pages.schema.ts";
import { createReservationSchema } from "../schemas/reservations.schema.ts";
import type { PublicProductParams, TrackProductClickInput } from "../types/public.ts";
import type { CreateReservationInput } from "../types/reservations.ts";

export async function publicPagesRoutes(app: FastifyInstance) {
  app.get<{ Params: PublicProductParams }>(
    "/products/:slug",
    { schema: getPublicProductSchema },
    getPublicProduct,
  );

  app.post<{ Body: TrackProductClickInput }>(
    "/products/clicks",
    { schema: trackProductClickSchema },
    trackProductClick,
  );

  app.post<{ Body: CreateReservationInput }>(
    "/reservations",
    { schema: createReservationSchema },
    createReservation,
  );
}
