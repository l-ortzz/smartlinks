import type { FastifyInstance } from "fastify";
import { createSubscriptionPayment } from "../controllers/subscription-payment.controller.ts";
import { requireAuth } from "../middlewares/auth.middleware.ts";
import { subscriptionPaymentSchema } from "../schemas/subscription-payment.schema.ts";

export async function subscriptionPaymentRoutes(app: FastifyInstance) {
  app.post<{
    Body: {
      cpfCnpj: string;
      billingType: "PIX" | "BOLETO";
    };
  }>(
    "/",
    {
      preHandler: requireAuth,
      schema: subscriptionPaymentSchema,
    },
    createSubscriptionPayment,
  );
}
