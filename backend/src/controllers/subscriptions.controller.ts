import type { FastifyReply, FastifyRequest } from "fastify";
import { testAsaasConnectionService } from "../services/subscriptions.service.ts";

import {
  createSubscriptionService,
  getSubscriptionService,
} from "../services/subscriptions.service.ts";

type CreateSubscriptionRequest = FastifyRequest<{
  Body: {
    planId: string;
  };
}>;

export async function getSubscription(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  if (!request.user) {
    return reply.status(401).send({
      message: "Authentication required.",
    });
  }

  const subscription = await getSubscriptionService(request.user.id);

  return reply.send(subscription);
}

export async function createSubscription(
  request: CreateSubscriptionRequest,
  reply: FastifyReply,
) {
  if (!request.user) {
    return reply.status(401).send({
      message: "Authentication required.",
    });
  }

  const subscription = await createSubscriptionService(
    request.user.id,
    request.body.planId,
  );

  return reply.status(201).send(subscription);
}

export async function testAsaasConnection(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    const result = await testAsaasConnectionService();

    return reply.send(result);
  } catch (error) {
    return reply.status(500).send({
      message:
        error instanceof Error ? error.message : "Erro ao conectar ao Asaas.",
    });
  }
}