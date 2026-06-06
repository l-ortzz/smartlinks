import { findProducts, insertProduct } from "../repositories/products.repository.ts";
import type { CreateProductInput } from "../types/products.ts";

export async function listProductsService(userId?: string) {
  return findProducts(userId);
}

export async function createProductService(input: CreateProductInput) {
  return insertProduct(input);
}
