import "dotenv/config";
import cors from "@fastify/cors";
import Fastify from "fastify";
import { registerRoutes } from "./routes/index.ts";

const app = Fastify({
  logger: true,
});

await app.register(cors, {
  origin: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
});

await registerRoutes(app);

const port = Number(process.env.PORT ?? 3333);
const host = process.env.HOST ?? "0.0.0.0";

try {
  await app.listen({ port, host });
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
