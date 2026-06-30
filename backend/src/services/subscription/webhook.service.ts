import { getPayment } from "../../lib/asaas.ts";
import { updateSubscriptionByAsaasId } from "../../repositories/subscriptions.repository.ts";

type SubscriptionStatus = "ACTIVE" | "EXPIRED" | "CANCELED";

interface AsaasWebhookPayload {
  event?: unknown;
  payment?: {
    id?: unknown;
    subscription?: unknown;
  };
}

const statusByEvent: Record<string, SubscriptionStatus> = {
  PAYMENT_RECEIVED: "ACTIVE",
  PAYMENT_CONFIRMED: "ACTIVE",
  PAYMENT_OVERDUE: "EXPIRED",
  PAYMENT_DELETED: "CANCELED",
};

async function resolveSubscriptionId(payload: AsaasWebhookPayload) {
  if (typeof payload.payment?.subscription === "string") {
    return payload.payment.subscription;
  }

  if (typeof payload.payment?.id !== "string") {
    throw new Error("Webhook payment id is missing.");
  }

  const payment = await getPayment(payload.payment.id);
  return payment.subscription;
}

export async function webhookService(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    throw new Error("Invalid webhook payload.");
  }

  const webhookPayload = payload as AsaasWebhookPayload;
  const event =
    typeof webhookPayload.event === "string"
      ? webhookPayload.event
      : null;

  if (!event) {
    throw new Error("Webhook event is missing.");
  }

  const status = statusByEvent[event];

  if (!status) {
    return;
  }

  const subscriptionId = await resolveSubscriptionId(webhookPayload);

  if (!subscriptionId) {
    throw new Error("Asaas subscription id is missing from payment.");
  }

  const updated = await updateSubscriptionByAsaasId(subscriptionId, {
    status,
  });

  if (!updated) {
    throw new Error("Local subscription not found for Asaas subscription.");
  }
}
