import type { FastifyInstance } from "fastify";
import { createReservation, listReservations } from "../controllers/reservations.controller.ts";
import { createReservationSchema, listReservationsSchema } from "../schemas/reservations.schema.ts";

export async function reservationRoutes(app: FastifyInstance) {
  app.get("/", { schema: listReservationsSchema }, listReservations);
  app.post("/", { schema: createReservationSchema }, createReservation);
}
