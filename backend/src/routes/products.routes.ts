import type { FastifyInstance } from "fastify";
import { createProduct, listProducts } from "../controllers/products.controller.ts";
import { requireAuth } from "../middlewares/auth.middleware.ts";
import { createProductSchema, listProductsSchema } from "../schemas/products.schema.ts";
import type { CreateProductInput } from "../types/products.ts";

export async function productRoutes(app: FastifyInstance) {
  app.get<{ Querystring: { userId?: string } }>(
    "/",
    { preHandler: requireAuth, schema: listProductsSchema },
    listProducts,
  );
  app.post<{ Body: CreateProductInput }>(
    "/",
    { preHandler: requireAuth, schema: createProductSchema },
    createProduct,
  );
}
