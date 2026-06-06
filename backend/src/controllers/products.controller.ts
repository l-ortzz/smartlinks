import type { FastifyReply, FastifyRequest } from "fastify";
import { createProductService, listProductsService } from "../services/products.service.ts";
import type { CreateProductInput } from "../types/products.ts";

type ListProductsRequest = FastifyRequest<{
  Querystring: {
    userId?: string;
  };
}>;

export async function listProducts(request: ListProductsRequest) {
  return listProductsService(request.user?.id ?? request.query.userId);
}

export async function createProduct(
  request: FastifyRequest<{ Body: CreateProductInput }>,
  reply: FastifyReply,
) {
  if (!request.user) {
    return reply.status(401).send({
      message: "Authentication required.",
    });
  }

  const product = await createProductService({
    ...request.body,
    userId: request.user.id,
  });
  return reply.status(201).send(product);
}
