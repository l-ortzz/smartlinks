export const getCompanyPageSchema = {
  params: {
    type: "object",
    required: ["slug"],
    properties: {
      slug: { type: "string" },
    },
  },
};
