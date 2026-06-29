export const subscriptionPaymentSchema = {
  body: {
    type: "object",
    required: ["cpfCnpj", "billingType"],
    additionalProperties: false,
    properties: {
      cpfCnpj: {
        type: "string",
        minLength: 11,
        maxLength: 18,
      },
      billingType: {
        type: "string",
        enum: ["PIX", "BOLETO"],
      },
    },
  },
};
