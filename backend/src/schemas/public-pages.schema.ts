export const getPublicProductSchema = {
  params: {
    type: "object",
    required: ["slug"],
    properties: {
      slug: { type: "string" },
    },
  },
};

export const trackProductClickSchema = {
  body: {
    type: "object",
    required: ["productId"],
    properties: {
      productId: { type: "string" },
    },
  },
};
