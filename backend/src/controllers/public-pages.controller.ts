import type { FastifyReply, FastifyRequest } from "fastify";
import {
  getPublicProductService,
  trackProductClickService,
} from "../services/public-pages.service.ts";
import type { PublicProductParams, TrackProductClickInput } from "../types/public.ts";

export async function getPublicProduct(
  request: FastifyRequest<{ Params: PublicProductParams }>,
  reply: FastifyReply,
) {
  try {
    const product = await getPublicProductService(request.params.slug);
    return reply.send(product);
  } catch {
    return reply.status(404).send({
      message: "Product not found.",
    });
  }
}

export async function trackProductClick(
  request: FastifyRequest<{ Body: TrackProductClickInput }>,
  reply: FastifyReply,
) {
  const ip = request.ip;
  const userAgent = request.headers["user-agent"];

  await trackProductClickService({
    productId: request.body.productId,
    ip,
    userAgent,
  });

  return reply.status(201).send({
    ok: true,
  });
}
