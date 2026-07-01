const API_URL = "/api";
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

export type ModuleType = "PAGES" | "AGENDS";

export type ModuleResponse = {
  selectedModule: ModuleType | null;
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

export type Service = {
  id: string;
  name: string;
  description?: string | null;
  duration: number;
  price: string | number;
  image?: string | null;
  active: boolean;
};

export type CompanyPage = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  logo?: string | null;
  heroImage?: string | null;
  instagram?: string | null;
  numeroWhatsApp: string;
  telefone?: string | null;
  endereco?: string | null;
  products: Product[];
  services?: Service[];
  availability?: Availability[];
};

export type UpdateCompanyInput = {
  name?: string;
  description?: string;
  logo?: string;
  heroImage?: string;
  instagram?: string;
  telefone?: string;
  numeroWhatsApp?: string;
  endereco?: string;
};

export type PublicProduct = Product & {
  user: Omit<CompanyPage, "products">;
  relatedFrom?: Array<{
    related: Product;
  }>;
};

export type ProductAnalytics = {
  productId: string;
  productName: string;
  clicks: number;
  reservations: number;
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

export type ServiceInput = {
  name: string;
  description?: string;
  duration: number;
  price: number;
  image?: string;
  active?: boolean;
};

export type Weekday =
  | "MONDAY"
  | "TUESDAY"
  | "WEDNESDAY"
  | "THURSDAY"
  | "FRIDAY"
  | "SATURDAY"
  | "SUNDAY";

export type Availability = {
  id: string;
  weekday: Weekday;
  startTime: string;
  endTime: string;
  active: boolean;
};

export type AvailabilityInput = Omit<Availability, "id">;

export type AppointmentStatus =
  | "SCHEDULED"
  | "CONFIRMED"
  | "COMPLETED"
  | "CANCELED";

export type Appointment = {
  id: string;
  customerName: string;
  customerPhone: string;
  date: string;
  status: AppointmentStatus;
  service: Service;
};

export type Subscription = {
  id: string;
  status: "PENDING" | "ACTIVE" | "CANCELED" | "EXPIRED";
  asaasSubscriptionId?: string | null;
  paymentMethod?: "PIX" | "BOLETO" | null;
  nextDueDate?: string | null;
  plan: {
    name: string;
    price: string | number;
  };
};

export type SubscriptionPaymentResult = {
  status: Subscription["status"];
  asaasSubscriptionId: string;
  paymentMethod: "PIX" | "BOLETO";
  nextDueDate: string;
  payment: {
    id: string;
    status: string;
    value: number;
    dueDate: string;
  };
  pix: {
    encodedImage: string;
    payload: string;
    expirationDate: string;
  } | null;
  boleto: {
    url: string | null;
    identificationField: string;
    barCode: string | null;
  } | null;
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
  const isFormData = options.body instanceof FormData;
  const isAuthRequest =
    path === "/auth/login" ||
    path === "/auth/register";

  if (!headers.has("Content-Type") && options.body && !isFormData) {
    headers.set("Content-Type", "application/json");
  }

  const token = getToken();

  if (token && !isAuthRequest) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let response: Response;

  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
    });
  } catch {
    throw new Error(
      "Não foi possível conectar ao servidor. Tente novamente.",
    );
  }

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: "Não foi possível concluir a solicitação." }));
    const messageByBackendError: Record<string, string> = {
      "Invalid credentials.": "Credenciais inválidas.",
      "Email already registered.": "Este email já está cadastrado.",
    };
    const backendMessage =
      typeof error.message === "string"
        ? error.message
        : "Não foi possível concluir a solicitação.";

    if (response.status === 401 && !isAuthRequest) {
      clearToken();
    }

    const requestError = new Error(
      messageByBackendError[backendMessage] ?? backendMessage,
    ) as Error & {
      status?: number;
      code?: string;
    };

    requestError.status = response.status;
    requestError.code = error.code;

    throw requestError;
  }                                 

  if (response.status === 204) {
    return undefined as T;
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
  
  getMyProfile() {
  return request<CompanyProfile>("/users/me");
},

  updateProfile(input: UpdateCompanyInput) {
  return request("/users/me", {
    method: "PUT",
    body: JSON.stringify(input),
  });
},

  uploadLogo(file: File) {
    const formData = new FormData();
    formData.append("file", file);

    return request<{ url: string }>("/uploads/logo", {
      method: "POST",
      body: formData,
    });
  },

  uploadProductImages(files: File[]) {
    const formData = new FormData();

    files.forEach((file) => {
      formData.append("files[]", file);
    });

    return request<{ urls: string[] }>("/uploads/product", {
      method: "POST",
      body: formData,
    });
  },

  listProducts() {
    return request<Product[]>("/products");
  },

  getAnalytics() {
  return request<ProductAnalytics[]>("/analytics/products");
},

  listServices() {
    return request<Service[]>("/services");
  },

  createService(input: ServiceInput) {
    return request<Service>("/services", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  updateService(id: string, input: Partial<ServiceInput>) {
    return request<Service>(`/services/${id}`, {
      method: "PUT",
      body: JSON.stringify(input),
    });
  },

  deleteService(id: string) {
    return request<void>(`/services/${id}`, {
      method: "DELETE",
    });
  },

  listAvailability() {
    return request<Availability[]>("/availability");
  },

  createAvailability(input: AvailabilityInput) {
    return request<Availability>("/availability", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  updateAvailability(id: string, input: Partial<AvailabilityInput>) {
    return request<Availability>(`/availability/${id}`, {
      method: "PUT",
      body: JSON.stringify(input),
    });
  },

  deleteAvailability(id: string) {
    return request<void>(`/availability/${id}`, {
      method: "DELETE",
    });
  },

  listAppointments() {
    return request<Appointment[]>("/appointments");
  },

  createAppointment(input: {
    userId: string;
    serviceId: string;
    customerName: string;
    customerPhone: string;
    date: string;
  }) {
    return request<{
      appointment: Appointment;
      whatsappUrl: string;
    }>("/appointments", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  updateAppointmentStatus(id: string, status: AppointmentStatus) {
    return request<Appointment>(`/appointments/${id}/status`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    });
  },

  getSubscription() {
    return request<Subscription>("/subscriptions");
  },

  createSubscriptionPayment(input: {
    cpfCnpj: string;
    billingType: "PIX" | "BOLETO";
  }) {
    return request<SubscriptionPaymentResult>("/subscription-payment", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  getModule() {
    return request<ModuleResponse>("/module");
  },

  updateModule(module: ModuleType) {
    return request<ModuleResponse>("/module", {
      method: "PATCH",
      body: JSON.stringify({ module }),
    });
  },

  createProduct(input: CreateProductInput) {
    return request<Product>("/products", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  updateProduct(id: string, input: CreateProductInput) {
    return request<Product>(`/products/${id}`, {
      method: "PUT",
      body: JSON.stringify(input),
    });
  },

  updateRelatedProducts(
  productId: string,
  relatedIds: string[],
) {
  return request(`/products/${productId}/related`, {
    method: "PUT",
    body: JSON.stringify({
      relatedIds,
    }),
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

export type CompanyProfile = {
  id: string;
  name: string;
  email: string;
  slug: string;
  description?: string | null;
  logo?: string | null;
  heroImage?: string | null;
  instagram?: string | null;
  numeroWhatsApp?: string | null;
  telefone?: string | null;
  endereco?: string | null;
};
