import type { FastifyReply, FastifyRequest } from "fastify";

import {
  createProductService,
  listProductsService,
  updateProductService,
  updateRelatedProductsService,
} from "../services/products.service.ts";

import type { CreateProductInput, UpdateProductInput } from "../types/products.ts";
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

export async function updateProduct(
  request: FastifyRequest<{
    Params: { id: string };
    Body: UpdateProductInput;
  }>,
  reply: FastifyReply,
) {
  if (!request.user) {
    return reply.status(401).send({
      message: "Authentication required.",
    });
  }

  const product = await updateProductService(
    request.params.id,
    request.user.id,
    request.body,
  );

  if (!product) {
    return reply.status(404).send({
      message: "Product not found.",
    });
  }

  return reply.send(product);
}

type UpdateRelatedProductsRequest = FastifyRequest<{
  Params: {
    id: string;
  };
  Body: {
    relatedIds: string[];
  };
}>;

export async function updateRelatedProducts(
  request: UpdateRelatedProductsRequest,
  reply: FastifyReply,
) {
  if (!request.user) {
    return reply.status(401).send({
      message: "Authentication required.",
    });
  }

  try {
    const product = await updateRelatedProductsService(
      request.params.id,
      request.body.relatedIds,
    );

    return reply.send(product);
  } catch (error) {
    return reply.status(400).send({
      message:
        error instanceof Error
          ? error.message
          : "Could not update related products.",
    });
  }
}
