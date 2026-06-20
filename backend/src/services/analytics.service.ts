import {
  findProductAnalyticsByUserId,
  type ProductAnalyticsItem,
} from "../repositories/analytics.repository.ts";

export async function listProductAnalyticsService(
  userId: string,
): Promise<ProductAnalyticsItem[]> {
  return findProductAnalyticsByUserId(userId);
}
