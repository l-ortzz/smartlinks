import type { FastifyInstance } from "fastify";
import { getCompanyPage } from "../controllers/users.controller.ts";
import { getCompanyPageSchema } from "../schemas/users.schema.ts";

export async function userRoutes(app: FastifyInstance) {
  app.get("/companies/:slug", { schema: getCompanyPageSchema }, getCompanyPage);
}
