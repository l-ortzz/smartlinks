import type { FastifyInstance } from "fastify";
import {
  getCompanyPage,
  getMyProfile,
  updateMyProfile,
} from "../controllers/users.controller.ts";

import { requireAuth } from "../middlewares/auth.middleware.ts";
import { getCompanyPageSchema } from "../schemas/users.schema.ts";

export async function userRoutes(app: FastifyInstance) {
  app.get(
    "/companies/:slug",
    { schema: getCompanyPageSchema },
    getCompanyPage,
  );

app.get(
  "/users/me",
  { preHandler: requireAuth },
  getMyProfile,
);

  app.put(
    "/users/me",
    { preHandler: requireAuth },
    updateMyProfile,
  );
}