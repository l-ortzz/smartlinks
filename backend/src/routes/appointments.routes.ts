import type { FastifyInstance } from "fastify";
import { createAppointment, listAppointments } from "../controllers/appointments.controller.ts";
import { createAppointmentSchema, listAppointmentsSchema } from "../schemas/appointments.schema.ts";

export async function appointmentRoutes(app: FastifyInstance) {
  app.get("/", { schema: listAppointmentsSchema }, listAppointments);
  app.post("/", { schema: createAppointmentSchema }, createAppointment);
}
