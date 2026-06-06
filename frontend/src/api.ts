const API_URL = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:3333";
const TOKEN_KEY = "smartlinks.token";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  slug: string;
};

export type Session = {
  user: SessionUser;
  token: string;
};

export type ProductAttributeValue = {
  id: string;
  value: string;
  stock?: number | null;
};

export type ProductAttribute = {
  id: string;
  name: string;
  values: ProductAttributeValue[];
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  price: string | number;
  images?: string[] | null;
  active?: boolean;
  attributes?: ProductAttribute[];
};

export type CompanyPage = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  logo?: string | null;
  instagram?: string | null;
  numeroWhatsApp: string;
  telefone?: string | null;
  endereco?: string | null;
  products: Product[];
};

export type PublicProduct = Product & {
  user: Omit<CompanyPage, "products">;
  relatedFrom?: Array<{
    related: Product;
  }>;
};

export type CreateProductInput = {
  slug: string;
  name: string;
  description?: string;
  price: number;
  images?: string[];
  attributes?: Array<{
    name: string;
    values: Array<{ value: string }>;
  }>;
};

export type ReservationInput = {
  productId: string;
  customerName: string;
  customerPhone: string;
  quantity: number;
};

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(path: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers);

  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }

  const token = getToken();

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Request failed." }));
    throw new Error(error.message ?? "Request failed.");
  }

  return response.json() as Promise<T>;
}

export const api = {
  register(input: {
    name: string;
    email: string;
    password: string;
    slug: string;
    numeroWhatsApp: string;
    description?: string;
  }) {
    return request<Session>("/auth/register", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  login(input: { email: string; password: string }) {
    return request<Session>("/auth/login", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  me() {
    return request<SessionUser>("/auth/me");
  },

  listProducts() {
    return request<Product[]>("/products");
  },

  createProduct(input: CreateProductInput) {
    return request<Product>("/products", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  getCompany(slug: string) {
    return request<CompanyPage>(`/companies/${slug}`);
  },

  getPublicProduct(slug: string) {
    return request<PublicProduct>(`/public/products/${slug}`);
  },

  createReservation(input: ReservationInput) {
    return request<{ reservation: { id: string; status: string }; whatsappUrl: string }>(
      "/public/reservations",
      {
        method: "POST",
        body: JSON.stringify(input),
      },
    );
  },
};
