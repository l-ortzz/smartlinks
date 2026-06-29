import { findSubscriptionStatusByUserId } from "../../repositories/subscriptions.repository.ts";

export async function hasActiveSubscription(userId: string) {
  const subscription = await findSubscriptionStatusByUserId(userId);

  if (!subscription) {
    return false;
  }

  return subscription.status === "ACTIVE";
}