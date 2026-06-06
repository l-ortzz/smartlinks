import {
  findAvailability,
  insertAvailability,
} from "../repositories/availability.repository.ts";
import type { CreateAvailabilityInput } from "../types/availability.ts";

export async function listAvailabilityService(userId?: string) {
  return findAvailability(userId);
}

export async function createAvailabilityService(input: CreateAvailabilityInput) {
  if (input.startTime >= input.endTime) {
    throw new Error("Availability startTime must be before endTime.");
  }

  return insertAvailability(input);
}
