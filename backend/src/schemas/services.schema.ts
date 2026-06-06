export const listServicesSchema = {
  querystring: {
    type: "object",
    properties: {
      userId: { type: "string" },
    },
  },
};

export const createServiceSchema = {
  body: {
    type: "object",
    required: ["name", "duration", "price"],
    properties: {
      userId: { type: "string" },
      name: { type: "string" },
      description: { type: "string" },
      duration: { type: "integer", minimum: 1 },
      price: { type: "number" },
      active: { type: "boolean" },
    },
  },
};
