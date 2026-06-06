export const registerSchema = {
  body: {
    type: "object",
    required: ["name", "email", "password", "slug", "numeroWhatsApp"],
    properties: {
      name: { type: "string", minLength: 2 },
      email: { type: "string", format: "email" },
      password: { type: "string", minLength: 6 },
      slug: { type: "string", minLength: 2 },
      numeroWhatsApp: { type: "string", minLength: 8 },
      description: { type: "string" },
      logo: { type: "string" },
      instagram: { type: "string" },
      telefone: { type: "string" },
      endereco: { type: "string" },
    },
  },
};

export const loginSchema = {
  body: {
    type: "object",
    required: ["email", "password"],
    properties: {
      email: { type: "string", format: "email" },
      password: { type: "string" },
    },
  },
};
