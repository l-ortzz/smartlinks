import type { FastifyReply, FastifyRequest } from "fastify";
import { createSubscriptionPaymentService } from "../services/subscription/payment.service.ts";

type SubscriptionPaymentRequest = FastifyRequest<{
  Body: {
    cpfCnpj: string;
    billingType: "PIX" | "BOLETO";
  };
}>;

export async function createSubscriptionPayment(
  request: SubscriptionPaymentRequest,
  reply: FastifyReply,
) {
  if (!request.user) {
    return reply.status(401).send({
      message: "Authentication required.",
    });
  }

  try {
    const result = await createSubscriptionPaymentService({
      userId: request.user.id,
      cpfCnpj: request.body.cpfCnpj,
      billingType: request.body.billingType,
    });

    return reply.send(result);
  } catch (error) {
    return reply.status(400).send({
      message:
        error instanceof Error
          ? error.message
          : "Could not create subscription payment.",
    });
  }
}
