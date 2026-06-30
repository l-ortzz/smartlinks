import {
  findProducts,
  insertProduct,
  updateProductById,
  updateRelatedProducts,
} from "../repositories/products.repository.ts";

import type { CreateProductInput, UpdateProductInput } from "../types/products.ts";

export async function listProductsService(userId?: string) {
  return findProducts(userId);
}

export async function createProductService(input: CreateProductInput) {
  return insertProduct(input);
}

export async function updateProductService(
  id: string,
  userId: string,
  input: UpdateProductInput,
) {
  return updateProductById(id, userId, input);
}

export async function updateRelatedProductsService(
  productId: string,
  relatedIds: string[],
) {
  const uniqueIds = [...new Set(relatedIds)];

  if (uniqueIds.includes(productId)) {
    throw new Error(
      "A product cannot be related to itself.",
    );
  }

  if (uniqueIds.length > 4) {
    throw new Error(
      "Maximum of 4 related products allowed.",
    );
  }

  return updateRelatedProducts(
    productId,
    uniqueIds,
  );
}
