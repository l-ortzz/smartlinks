export interface AsaasCustomer {
  id: string;
  name: string;
  email: string;
  mobilePhone: string;
}

function getRequiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is required.`);
  }

  return value;
}

async function request<T>(endpoint: string, options: RequestInit = {}) {
  const response = await fetch(`${getRequiredEnv("ASAAS_API_URL")}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "SmartLinks/1.0",
      access_token: getRequiredEnv("ASAAS_API_KEY"),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null) as {
      errors?: Array<{ description?: string }>;
      message?: string;
    } | null;
    const message =
      body?.errors?.map((error) => error.description).filter(Boolean).join(" ") ||
      body?.message ||
      `Asaas request failed with status ${response.status}.`;

    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

export async function createCustomer(data: {
  name: string;
  email: string;
  mobilePhone: string;
}): Promise<AsaasCustomer> {
  return request("/customers", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getCustomers() {
  return request("/customers");
}

export async function testConnection() {
  return getCustomers();
}

export interface AsaasSubscription {
  id: string;
  customer: string;
  billingType: string;
  value: number;
  nextDueDate: string;
  status: string;
}

export interface AsaasPayment {
  id: string;
  subscription?: string;
  billingType: string;
  status: string;
  value: number;
  dueDate: string;
  invoiceUrl?: string;
  bankSlipUrl?: string;
}

type AsaasListResponse<T> = {
  object: "list";
  hasMore: boolean;
  totalCount: number;
  limit: number;
  offset: number;
  data: T[];
};

export interface AsaasPixQrCode {
  encodedImage: string;
  payload: string;
  expirationDate: string;
}

export interface AsaasIdentificationField {
  identificationField: string;
  nossoNumero?: string;
  barCode?: string;
}

export async function createSubscription(data: {
  customer: string;
  billingType: "PIX" | "BOLETO" | "UNDEFINED";
  value: number;
  nextDueDate: string;
  cycle: "MONTHLY";
  description: string;
}): Promise<AsaasSubscription> {
  return request("/subscriptions", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function listSubscriptionPayments(subscriptionId: string) {
  return request<AsaasListResponse<AsaasPayment>>(
    `/subscriptions/${subscriptionId}/payments`,
  );
}

export async function getPayment(paymentId: string) {
  return request<AsaasPayment>(`/payments/${paymentId}`);
}

export async function getPixQrCode(paymentId: string) {
  return request<AsaasPixQrCode>(`/payments/${paymentId}/pixQrCode`);
}

export async function getPaymentIdentificationField(paymentId: string) {
  return request<AsaasIdentificationField>(
    `/payments/${paymentId}/identificationField`,
  );
}

export async function updateCustomer(
  customerId: string,
  data: {
    cpfCnpj: string;
  },
) {
  return request<AsaasCustomer>(`/customers/${customerId}`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

