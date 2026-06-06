import { findCompanyPageBySlug } from "../repositories/users.repository.ts";

export async function getCompanyPageService(slug: string) {
  const company = await findCompanyPageBySlug(slug);

  if (!company) {
    throw new Error("Company page not found.");
  }

  return company;
}
