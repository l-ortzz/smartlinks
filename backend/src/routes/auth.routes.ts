import type { FastifyInstance } from "fastify";
import { login, me, register } from "../controllers/auth.controller.ts";
import { requireAuth } from "../middlewares/auth.middleware.ts";
import { loginSchema, registerSchema } from "../schemas/auth.schema.ts";

export async function authRoutes(app: FastifyInstance) {
  app.post("/register", { schema: registerSchema }, register);
  app.post("/login", { schema: loginSchema }, login);
  app.get("/me", { preHandler: requireAuth }, me);
}
