import {
  findCompanyPageBySlug,
  findProfileByUserId,
  findUserById,
  updateUserById,
} from "../repositories/users.repository.ts";

export async function getCompanyPageService(slug: string) {
  const company = await findCompanyPageBySlug(slug);

  if (!company) {
    throw new Error("Company page not found.");
  }

  return company;
}

export async function updateUserProfileService(
  userId: string,
  input: {
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
  const user = await findUserById(userId);

  if (!user) {
    throw new Error("User not found.");
  }

  return updateUserById(userId, input);
}

export async function getMyProfileService(userId: string) {
  const user = await findProfileByUserId(userId);

  if (!user) {
    throw new Error("User not found.");
  }

  return user;
}