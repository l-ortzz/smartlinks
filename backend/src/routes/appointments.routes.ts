import type { FastifyInstance } from "fastify";
import {
  createAppointment,
  listAppointments,
  updateAppointmentStatus,
} from "../controllers/appointments.controller.ts";
import { requireAuth } from "../middlewares/auth.middleware.ts";
import {
  createAppointmentSchema,
  listAppointmentsSchema,
  updateAppointmentStatusSchema,
} from "../schemas/appointments.schema.ts";
import type { AppointmentStatus } from "../types/appointments.ts";

export async function appointmentRoutes(app: FastifyInstance) {
  app.get<{ Querystring: { userId?: string } }>(
    "/",
    { preHandler: requireAuth, schema: listAppointmentsSchema },
    listAppointments,
  );
  app.post("/", { schema: createAppointmentSchema }, createAppointment);
  app.put<{
    Params: { id: string };
    Body: { status: AppointmentStatus };
  }>(
    "/:id/status",
    { preHandler: requireAuth, schema: updateAppointmentStatusSchema },
    updateAppointmentStatus,
  );
}
