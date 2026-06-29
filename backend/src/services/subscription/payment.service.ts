import {
  createSubscription as createAsaasSubscription,
  getPaymentIdentificationField,
  getPixQrCode,
  listSubscriptionPayments,
  updateCustomer,
  type AsaasPayment,
} from "../../lib/asaas.ts";

import {
  findSubscriptionWithCustomer,
  updateSubscriptionByUserId,
} from "../../repositories/subscriptions.repository.ts";

import {
  updateUserCpfCnpj,
} from "../../repositories/users.repository.ts";

import type {
  SubscriptionPaymentInput,
} from "../../types/subscription-payment.ts";

const MAX_PAYMENT_RETRIES = 5;
const PAYMENT_RETRY_DELAY_MS = 300;

export async function createSubscriptionPaymentService(
  input: SubscriptionPaymentInput,
) {
  const subscription = await findSubscriptionWithCustomer(input.userId);

  if (!subscription?.asaasCustomerId) {
    throw new Error("Subscription not found.");
  }

  const cpfCnpj = input.cpfCnpj.replace(/\D/g, "");

  if (![11, 14].includes(cpfCnpj.length)) {
    throw new Error("CPF/CNPJ is invalid.");
  }

  await updateCustomer(subscription.asaasCustomerId, {
    cpfCnpj,
  });

  const existingPaymentMethod = subscription.paymentMethod as
    | "PIX"
    | "BOLETO"
    | null;

  if (
    subscription.asaasSubscriptionId &&
    existingPaymentMethod &&
    existingPaymentMethod !== input.billingType
  ) {
    throw new Error(
      `Subscription was already created with ${existingPaymentMethod}.`,
    );
  }

  const billingType = existingPaymentMethod ?? input.billingType;
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 1);

  const nextBillingDate = dueDate.toISOString().slice(0, 10);  let asaasSubscriptionId = subscription.asaasSubscriptionId;
  let nextDueDate = subscription.nextDueDate
    ? subscription.nextDueDate.toISOString().slice(0, 10)
    : nextBillingDate;

  if (!asaasSubscriptionId) {
    const asaasSubscription = await createAsaasSubscription({
      customer: subscription.asaasCustomerId,
      billingType,
      value: Number(subscription.plan.price),
      nextDueDate: nextBillingDate,
      cycle: "MONTHLY",
      description: `Assinatura ${subscription.plan.name}`,
    });

    asaasSubscriptionId = asaasSubscription.id;
    nextDueDate = asaasSubscription.nextDueDate;

      await updateUserCpfCnpj(
        input.userId,
        cpfCnpj,
      );
      
    await updateSubscriptionByUserId(input.userId, {
      asaasSubscriptionId,
      paymentMethod: billingType,
      nextDueDate: new Date(`${nextDueDate}T12:00:00`),
    });
  }

  const payment = await findFirstPayment(asaasSubscriptionId);
  const pix =
    billingType === "PIX"
      ? await getPixQrCode(payment.id)
      : null;
  const boleto =
    billingType === "BOLETO"
      ? await getPaymentIdentificationField(payment.id)
      : null;

  return {
    subscriptionStatus: subscription.status,
    paymentStatus: payment.status,
    asaasSubscriptionId,
    paymentMethod: billingType,
    nextDueDate,
    payment: {
      id: payment.id,
      status: payment.status,
      value: payment.value,
      dueDate: payment.dueDate,
    },
    pix,
    boleto: boleto
      ? {
          url: payment.bankSlipUrl ?? payment.invoiceUrl ?? null,
          identificationField: boleto.identificationField,
          barCode: boleto.barCode ?? null,
        }
      : null,
  };
}

async function findFirstPayment(subscriptionId: string): Promise<AsaasPayment> {
  for (let attempt = 0; attempt < MAX_PAYMENT_RETRIES; attempt += 1) {
    const payments = await listSubscriptionPayments(subscriptionId);
    const firstPayment = payments.data
    .slice()
    .sort((a, b) =>
      a.dueDate.localeCompare(b.dueDate),
    )[0];

    if (firstPayment) {
      return firstPayment;
    }

    await new Promise((resolve) => setTimeout(resolve, PAYMENT_RETRY_DELAY_MS));
  }

  throw new Error("Asaas did not return the first subscription payment.");
}
