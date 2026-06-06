export type RegisterInput = {
  name: string;
  email: string;
  password: string;
  slug: string;
  numeroWhatsApp: string;
  description?: string;
  logo?: string;
  instagram?: string;
  telefone?: string;
  endereco?: string;
};

export type LoginInput = {
  email: string;
  password: string;
};
