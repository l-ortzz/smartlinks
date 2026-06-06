import {
  findPublicProductBySlug,
  insertProductClick,
} from "../repositories/products.repository.ts";
import type { TrackProductClickInput } from "../types/public.ts";

export async function getPublicProductService(slug: string) {
  const product = await findPublicProductBySlug(slug);

  if (!product) {
    throw new Error("Product not found.");
  }

  return product;
}

export async function trackProductClickService(input: TrackProductClickInput & {
  ip: string;
  userAgent?: string;
}) {
  return insertProductClick(input);
}
