export const listProductsSchema = {
  querystring: {
    type: "object",
    properties: {
      userId: { type: "string" },
    },
  },
};

export const createProductSchema = {
  body: {
    type: "object",
    required: ["slug", "name", "price"],
    properties: {
      userId: { type: "string" },
      slug: { type: "string" },
      name: { type: "string" },
      description: { type: "string" },
      price: { type: "number" },
      images: {
        type: "array",
        items: { type: "string" },
      },
      stock: { type: "integer", minimum: 0 },
      active: { type: "boolean" },
      attributes: {
        type: "array",
        items: {
          type: "object",
          required: ["name", "values"],
          properties: {
            name: { type: "string" },
            values: {
              type: "array",
              items: {
                type: "object",
                required: ["value"],
                properties: {
                  value: { type: "string" },
                  stock: { type: "integer", minimum: 0 },
                },
              },
            },
          },
        },
      },
    },
  },
};
