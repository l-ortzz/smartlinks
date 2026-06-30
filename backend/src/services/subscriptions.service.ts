import {
  listSubscriptionPayments,
  testConnection,
} from "../lib/asaas.ts";
import {
  createSubscription,
  findSubscriptionByUserId,
  updateSubscriptionByUserId,
} from "../repositories/subscriptions.repository.ts";

export async function getSubscriptionService(userId: string) {
  const subscription = await findSubscriptionByUserId(userId);

  if (
    subscription?.status !== "PENDING" ||
    !subscription.asaasSubscriptionId
  ) {
    return subscription;
  }

  const payments = await listSubscriptionPayments(
    subscription.asaasSubscriptionId,
  );
  const paymentWasConfirmed = payments.data.some((payment) =>
    ["CONFIRMED", "RECEIVED"].includes(payment.status),
  );

  if (!paymentWasConfirmed) {
    return subscription;
  }

  return updateSubscriptionByUserId(userId, {
    status: "ACTIVE",
  });
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
