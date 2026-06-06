import type { FastifyInstance } from "fastify";
import { authRoutes } from "./auth.routes.ts";
import { healthRoutes } from "./health.routes.ts";
import { appointmentRoutes } from "./appointments.routes.ts";
import { availabilityRoutes } from "./availability.routes.ts";
import { productRoutes } from "./products.routes.ts";
import { publicPagesRoutes } from "./public-pages.routes.ts";
import { reservationRoutes } from "./reservations.routes.ts";
import { serviceRoutes } from "./services.routes.ts";
import { userRoutes } from "./users.routes.ts";

export async function registerRoutes(app: FastifyInstance) {
  await app.register(healthRoutes);
  await app.register(authRoutes, { prefix: "/auth" });
  await app.register(publicPagesRoutes, { prefix: "/public" });
  await app.register(userRoutes);
  await app.register(productRoutes, { prefix: "/products" });
  await app.register(reservationRoutes, { prefix: "/reservations" });
  await app.register(serviceRoutes, { prefix: "/services" });
  await app.register(availabilityRoutes, { prefix: "/availability" });
  await app.register(appointmentRoutes, { prefix: "/appointments" });
}
