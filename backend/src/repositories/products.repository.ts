import { prisma } from "../lib/prisma.ts";
import type { CreateProductInput, UpdateProductInput } from "../types/products.ts";

export async function findProducts(userId?: string) {
  return prisma.product.findMany({
    where: {
      userId,
      active: true,
    },
    include: {
      attributes: {
        include: {
          values: true,
        },
      },
      tags: {
        include: {
          tag: true,
        },
      },
      relatedFrom: {
        take: 4,
        include: {
          related: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function findPublicProductBySlug(slug: string) {
  return prisma.product.findFirst({
    where: {
      slug,
      active: true,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          logo: true,
          instagram: true,
          numeroWhatsApp: true,
          telefone: true,
          endereco: true,
        },
      },
      attributes: {
        include: {
          values: true,
        },
      },
      tags: {
        include: {
          tag: true,
        },
      },
      relatedFrom: {
        take: 4,
        include: {
          related: {
            select: {
              id: true,
              slug: true,
              name: true,
              description: true,
              price: true,
              images: true,
            },
          },
        },
      },
    },
  });
}

export async function insertProductClick(input: {
  productId: string;
  ip: string;
  userAgent?: string;
}) {
  return prisma.click.create({
    data: input,
  });
}

export async function insertProduct(input: CreateProductInput) {
  if (!input.userId) {
    throw new Error("Product userId is required.");
  }

  return prisma.product.create({
    data: {
      userId: input.userId,
      slug: input.slug,
      name: input.name,
      description: input.description,
      price: input.price,
      images: input.images,
      stock: input.stock,
      active: input.active ?? true,
      attributes: {
        create: input.attributes?.map((attribute) => ({
          name: attribute.name,
          values: {
            create: attribute.values.map((value) => ({
              value: value.value,
              stock: value.stock,
            })),
          },
        })),
      },
    },
    include: {
      attributes: {
        include: {
          values: true,
        },
      },
    },
  });
}

export async function updateProductById(
  id: string,
  userId: string,
  input: UpdateProductInput,
) {
  const product = await prisma.product.findFirst({
    where: {
      id,
      userId,
    },
  });

  if (!product) {
    return null;
  }

  if (input.attributes) {
    await prisma.productAttribute.deleteMany({
      where: {
        productId: id,
      },
    });
  }

  return prisma.product.update({
    where: {
      id,
    },
    data: {
      slug: input.slug,
      name: input.name,
      description: input.description,
      price: input.price,
      images: input.images,
      stock: input.stock,
      active: input.active,
      attributes: input.attributes
        ? {
            create: input.attributes.map((attribute) => ({
              name: attribute.name,
              values: {
                create: attribute.values.map((value) => ({
                  value: value.value,
                  stock: value.stock,
                })),
              },
            })),
          }
        : undefined,
    },
    include: {
      attributes: {
        include: {
          values: true,
        },
      },
      relatedFrom: {
        include: {
          related: true,
        },
      },
    },
  });
}

export async function updateRelatedProducts(
  productId: string,
  relatedIds: string[],
) {
  await prisma.relatedProduct.deleteMany({
    where: {
      productId,
    },
  });

  if (relatedIds.length) {
    await prisma.relatedProduct.createMany({
      data: relatedIds.map((relatedId) => ({
        productId,
        relatedId,
      })),
      skipDuplicates: true,
    });
  }

  return prisma.product.findUnique({
    where: {
      id: productId,
    },
    include: {
      relatedFrom: {
        include: {
          related: true,
        },
      },
    },
  });
}
