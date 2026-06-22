import {
  deleteAvailabilityById,
  findAvailability,
  insertAvailability,
  updateAvailabilityById,
} from "../repositories/availability.repository.ts";
import type {
  CreateAvailabilityInput,
  UpdateAvailabilityInput,
} from "../types/availability.ts";

export async function listAvailabilityService(userId?: string) {
  return findAvailability(userId);
}

export async function createAvailabilityService(input: CreateAvailabilityInput) {
  if (input.startTime >= input.endTime) {
    throw new Error("Availability startTime must be before endTime.");
  }

  return insertAvailability(input);
}

export async function updateAvailabilityService(
  id: string,
  userId: string,
  input: UpdateAvailabilityInput,
) {
  if (
    input.startTime !== undefined &&
    input.endTime !== undefined &&
    input.startTime >= input.endTime
  ) {
    throw new Error("Availability startTime must be before endTime.");
  }

  return updateAvailabilityById(id, userId, input);
}

export async function deleteAvailabilityService(id: string, userId: string) {
  await deleteAvailabilityById(id, userId);
}
