import { findServices, insertService } from "../repositories/services.repository.ts";
import type { CreateServiceInput } from "../types/services.ts";

export async function listServicesService(userId?: string) {
  return findServices(userId);
}

export async function createServiceService(input: CreateServiceInput) {
  return insertService(input);
}
