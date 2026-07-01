import { prisma } from "../lib/prisma.ts";

export async function findSubscriptionByUserId(userId: string) {
  return prisma.subscription.findUnique({
    where: {
      userId,
    },
    include: {
      plan: true,
    },
  });
}

export async function updateSubscriptionByUserId(
  userId: string,
  data: {
    status?: "PENDING" | "ACTIVE" | "CANCELED" | "EXPIRED";
    planId?: string;

    asaasCustomerId?: string;
    asaasSubscriptionId?: string;

    paymentMethod?: string;

    nextDueDate?: Date | null;

    startsAt?: Date;
    endsAt?: Date | null;
  },
) {
  return prisma.subscription.update({
    where: {
      userId,
    },
    data,
    include: {
      plan: true,
    },
  });
}

export async function createSubscription(input: {
  userId: string;
  planId: string;
}) {
  return prisma.subscription.create({
    data: {
      userId: input.userId,
      planId: input.planId,
    },
    include: {
      plan: true,
    },
  });
}
export async function createInitialSubscription(input: {
  userId: string;
  asaasCustomerId: string;
}) {
  const plan = await prisma.plan.upsert({
    where: {
      name: "Smart Links",
    },
    update: {},
    create: {
      name: "Smart Links",
      price: "97.00",
      features: {
        pages: true,
        agends: true,
      },
    },
  });

  return prisma.subscription.create({
    data: {
      userId: input.userId,
      planId: plan.id,
      status: "PENDING",
      asaasCustomerId: input.asaasCustomerId,
    },
    include: {
      plan: true,
    },
  });
}

export async function findSubscriptionWithCustomer(userId: string) {
  return prisma.subscription.findUnique({
    where: {
      userId,
    },
    include: {
      plan: true,
    },
  });
}

export async function updateSubscriptionByAsaasId(
  asaasSubscriptionId: string,
  data: {
    status?: "PENDING" | "ACTIVE" | "CANCELED" | "EXPIRED";
    nextDueDate?: Date | null;
    endsAt?: Date | null;
  },
) {
  const subscription = await prisma.subscription.findUnique({
    where: {
      asaasSubscriptionId,
    },
  });

  if (!subscription) {
    return null;
  }

  return prisma.subscription.update({
    where: {
      asaasSubscriptionId,
    },
    data,
    include: {
      plan: true,
    },
  });
}

export async function findSubscriptionStatusByUserId(
  userId: string,
) {
  return prisma.subscription.findUnique({
    where: {
      userId,
    },
    select: {
      status: true,
    },
  });
}
