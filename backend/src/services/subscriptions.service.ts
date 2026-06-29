import { testConnection } from "../lib/asaas.ts";
import {
  createSubscription,
  findSubscriptionByUserId,
} from "../repositories/subscriptions.repository.ts";

export async function getSubscriptionService(userId: string) {
  return findSubscriptionByUserId(userId);
}

export async function createSubscriptionService(userId: string, planId: string) {
  return createSubscription({
    userId,
    planId,
  });
}

export async function testAsaasConnectionService() {
  return testConnection();
}