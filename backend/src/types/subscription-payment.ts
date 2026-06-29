export interface SubscriptionPaymentInput {
  userId: string;
  cpfCnpj: string;
  billingType: "PIX" | "BOLETO";
}