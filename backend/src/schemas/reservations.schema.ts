export const listReservationsSchema = {
  querystring: {
    type: "object",
    properties: {
      productId: { type: "string" },
    },
  },
};

export const createReservationSchema = {
  body: {
    type: "object",
    required: ["productId", "customerName", "customerPhone"],
    properties: {
      productId: { type: "string" },
      customerName: { type: "string" },
      customerPhone: { type: "string" },
      quantity: { type: "integer", minimum: 1 },
      expiresAt: { type: "string", format: "date-time" },
    },
  },
};
