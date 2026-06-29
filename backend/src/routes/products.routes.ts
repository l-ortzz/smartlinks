import type { FastifyInstance } from "fastify";
import {
  createProduct,
  listProducts,
  updateRelatedProducts,
} from "../controllers/products.controller.ts";

import { requireAuth } from "../middlewares/auth.middleware.ts";
import {
  createProductSchema,
  listProductsSchema,
} from "../schemas/products.schema.ts";

import type { CreateProductInput } from "../types/products.ts";
import { requireActiveSubscription } from "../middlewares/require-active-subscription.ts";

export async function productRoutes(app: FastifyInstance) {
  app.get<{ Querystring: { userId?: string } }>(
    "/",
    {
      preHandler: [
        requireAuth,
        requireActiveSubscription,
      ],
      schema: listProductsSchema,
    },
    listProducts,
  );
  app.post<{ Body: CreateProductInput }>(
    "/",
        {
      preHandler: [
        requireAuth,
        requireActiveSubscription,
      ],
      schema: listProductsSchema,
    },
    createProduct,
  );
    app.put<{
    Params: { id: string };
    Body: { relatedIds: string[] };
  }>(
    "/:id/related",
        {
      preHandler: [
        requireAuth,
        requireActiveSubscription,
      ],
      schema: listProductsSchema,
    },
    updateRelatedProducts,
  );
}
