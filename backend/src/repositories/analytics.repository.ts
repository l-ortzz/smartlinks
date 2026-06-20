import { prisma } from "../lib/prisma.ts";

export type ProductAnalyticsItem = {
  productId: string;
  productName: string;
  clicks: number;
  reservations: number;
};

export async function findProductAnalyticsByUserId(
  userId: string,
): Promise<ProductAnalyticsItem[]> {
  const products = await prisma.product.findMany({
    where: {
      userId,
    },
    select: {
      id: true,
      name: true,
      _count: {
        select: {
          clicks: true,
          reservations: true,
        },
      },
    },
  });

  return products
    .map((product) => ({
      productId: product.id,
      productName: product.name,
      clicks: product._count.clicks,
      reservations: product._count.reservations,
    }))
    .sort((a, b) => b.clicks - a.clicks);
}
