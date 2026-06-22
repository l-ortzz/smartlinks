import {
  deleteServiceById,
  findServices,
  insertService,
  updateServiceById,
} from "../repositories/services.repository.ts";
import type { CreateServiceInput, UpdateServiceInput } from "../types/services.ts";

export async function listServicesService(userId?: string) {
  return findServices(userId);
}

export async function createServiceService(input: CreateServiceInput) {
  return insertService(input);
}

export async function updateServiceService(
  id: string,
  userId: string,
  input: UpdateServiceInput,
) {
  return updateServiceById(id, userId, input);
}

export async function deleteServiceService(id: string, userId: string) {
  await deleteServiceById(id, userId);
}
