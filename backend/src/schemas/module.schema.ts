export const updateModuleSchema = {
  body: {
    type: "object",
    required: ["module"],
    properties: {
      module: {
        type: "string",
        enum: ["PAGES", "AGENDS"],
      },
    },
  },
};
