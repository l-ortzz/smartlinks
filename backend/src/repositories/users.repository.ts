import { prisma } from "../lib/prisma.ts";
import type { RegisterInput } from "../types/auth.ts";

export async function findUserById(id: string) {
  return prisma.user.findUnique({
    where: {
      id,
    },
  });
}

export async function findUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: {
      email,
    },
  });
}

export async function insertUser(input: RegisterInput & { passwordHash: string }) {
  return prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      slug: input.slug,
      numeroWhatsApp: input.numeroWhatsApp,
      passwordHash: input.passwordHash,
      description: input.description,
      logo: input.logo,
      instagram: input.instagram,
      telefone: input.telefone,
      endereco: input.endereco,
    },
  });
}

export async function updateUserById(
  id: string,
  data: {
    name?: string;
    description?: string;
    logo?: string;
    heroImage?: string;
    instagram?: string;
    telefone?: string;
    numeroWhatsApp?: string;
    endereco?: string;
  },
) {
  return prisma.user.update({
    where: {
      id,
    },
    data,
  });
}

export async function findCompanyPageBySlug(slug: string) {
  return prisma.user.findUnique({
    where: {
      slug,
    },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      logo: true,
      heroImage: true,
      instagram: true,
      numeroWhatsApp: true,
      telefone: true,
      endereco: true,
      products: {
        where: {
          active: true,
        },
        take: 12,
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          slug: true,
          name: true,
          description: true,
          price: true,
          images: true,
          active: true,
          createdAt: true,
        },
      },
    },
  });
}
export async function findProfileByUserId(id: string) {
  return prisma.user.findUnique({
    where: {
      id,
    },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      logo: true,
      heroImage: true,
      instagram: true,
      numeroWhatsApp: true,
      telefone: true,
      endereco: true,
      email: true,
    },
  });
}