<script setup lang="ts">

import {
  ref,
  computed,
  watch,
  onMounted,
  nextTick,
} from "vue";

import {
  api,
  clearToken,
  getToken,
  setToken,
  type Appointment,
  type AppointmentStatus,
  type Availability,
  type CompanyPage,
  type ModuleType,
  type Product,
  type ProductAnalytics,
  type PublicProduct,
  type Service,
  type SessionUser,
  type Subscription,
  type SubscriptionPaymentResult,
  type Weekday,
} from "./api";

import {
  formatCurrency,
  slugify,
} from "./format";

function goToDashboard() {  window.location.hash = "#/dashboard";}
function scrollToBenefits() {
  document
    .getElementById("beneficios")
    ?.scrollIntoView({
      behavior: "smooth",
    });
}
type View =  | "landing"  | "dashboard"  | "company"  | "product";
type DashboardTab =
  | "dashboard"
  | "company"
  | "products"
  | "analytics"
  | "services"
  | "availability"
  | "agenda"
  | "subscription"
  | "settings"
  | "support";

const weekdayOptions: Array<{ value: Weekday; label: string }> = [
  { value: "MONDAY", label: "Segunda-feira" },
  { value: "TUESDAY", label: "Terca-feira" },
  { value: "WEDNESDAY", label: "Quarta-feira" },
  { value: "THURSDAY", label: "Quinta-feira" },
  { value: "FRIDAY", label: "Sexta-feira" },
  { value: "SATURDAY", label: "Sabado" },
  { value: "SUNDAY", label: "Domingo" },
];

const weekdayByDayIndex: Weekday[] = [
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
];

const route = ref(window.location.hash || "#/");
const user = ref<SessionUser | null>(null);
const products = ref<Product[]>([]);
const services = ref<Service[]>([]);
const availability = ref<Availability[]>([]);
const appointments = ref<Appointment[]>([]);
const analytics = ref<ProductAnalytics[]>([]);
const company = ref<CompanyPage | null>(null);
const publicProduct = ref<PublicProduct | null>(null);
const loading = ref(false);
const uploadingLogo = ref(false);
const uploadingProductImages = ref(false);
const error = ref("");
const notice = ref("");
const authMode = ref<"login" | "register">("login");
const dashboardTab = ref<DashboardTab>("dashboard");
const selectedModule = ref<ModuleType | null>(null);
const showOnboarding = ref(false);
const onboardingStorageKey = "smartlinks:onboarding-dismissed";
const selectedProductId = ref("");
const editingProductId = ref("");
const relatedSelection = ref<string[]>([]);
const productSearch = ref("");
const editingServiceId = ref("");
const editingAvailabilityId = ref("");
const selectedServiceId = ref("");
const subscription = ref<Subscription | null>(null);
const subscriptionPayment = ref<SubscriptionPaymentResult | null>(null);
let subscriptionPolling: number | null = null;

const authForm = ref({
  name: "",
  email: "",
  password: "",
  slug: "",
  numeroWhatsApp: "",
  description: "",
});

const productForm = ref({
  name: "",
  slug: "",
  description: "",
  price: 0,
  image: "",
  images: [] as string[],
  colorValues: "",
  sizeValues: "",
});

const serviceForm = ref({
  name: "",
  description: "",
  duration: 60,
  price: 0,
  image: "",
  active: true,
});

const availabilityForm = ref({
  weekday: "MONDAY" as Weekday,
  startTime: "09:00",
  endTime: "18:00",
  active: true,
});

const appointmentForm = ref({
  date: "",
  time: "",
  customerName: "",
  customerPhone: "",
});

const subscriptionForm = ref({
  cpfCnpj: "",
  billingType: "PIX" as "PIX" | "BOLETO",
});

const reservationForm = ref({
  customerName: "",
  customerPhone: "",
  quantity: 1,
});

const companyForm = ref({
  name: "",
  description: "",
  logo: "",
  heroImage: "",
  instagram: "",
  telefone: "",
  numeroWhatsApp: "",
  endereco: "",
});
const dashboardSections = {
  dashboard: {
    title: "Dashboard",
    subtitle: "Visão geral do seu módulo.",
    counter: "Visão geral",
  },

  company: {
    title: "Minha Empresa",
    subtitle: "Gerencie as informações da sua empresa.",
    counter: "Perfil",
  },

  products: {
    title: "Produtos",
    subtitle: "Gerencie seu catálogo e publique novos produtos.",
    counter: () => `${products.value.length} produtos`,
  },

  analytics: {
    title: "Analytics",
    subtitle: "Acompanhe o desempenho dos seus produtos.",
    counter: () => `${monitoredProducts.value} produtos`,
  },

  services: {
    title: "Serviços",
    subtitle: "Gerencie os serviços oferecidos pela empresa.",
    counter: () => `${services.value.length} serviço(s)`,
  },

  availability: {
    title: "Disponibilidade",
    subtitle: "Defina os dias e horários de atendimento.",
    counter: () => `${availability.value.length} horários`,
  },

  agenda: {
    title: "Agenda",
    subtitle: "Acompanhe e gerencie seus agendamentos.",
    counter: () => `${appointments.value.length} agendamentos`,
  },

  subscription: {
    title: "Mensalidade",
    subtitle: "Gerencie sua assinatura Smart Links.",
    counter: "R$97/mês",
  },

  settings: {
    title: "Configurações",
    subtitle: "Gerencie sua conta.",
    counter: "Conta",
  },

  support: {
    title: "Ajuda",
    subtitle: "Central de ajuda da Smart Links.",
    counter: "Suporte",
  },
} as const;

const currentDashboardSection = computed(
  () => dashboardSections[dashboardTab.value],
);

const currentDashboardCounter = computed(() => {
  const counter = currentDashboardSection.value.counter;
  return typeof counter === "function" ? counter() : counter;
});

const isSubscriptionActive = computed(
  () => subscription.value?.status === "ACTIVE",
);

const needsModuleChoice = computed(
  () =>
    Boolean(user.value) &&
    isSubscriptionActive.value &&
    !selectedModule.value,
);

const canShowDashboardWorkspace = computed(
  () =>
    Boolean(user.value) &&
    !needsModuleChoice.value,
);

const sidebarMode = computed(() => {
  if (!user.value) {
    return "none";
  }

  if (!isSubscriptionActive.value) {
    return "none";
  }

  if (!selectedModule.value) {
    return "none";
  }

  return selectedModule.value === "PAGES"
    ? "pages"
    : "agends";
});

const showPagesContent = computed(
  () => selectedModule.value === "PAGES",
);

const showAgendsContent = computed(
  () => selectedModule.value === "AGENDS",
);

const pagesTabs: DashboardTab[] = [
  "dashboard",
  "products",
  "company",
  "analytics",
  "settings",
];

const agendsTabs: DashboardTab[] = [
  "dashboard",
  "services",
  "availability",
  "agenda",
  "company",
  "settings",
];

function normalizeDashboardTab() {
  if (!user.value) {
    dashboardTab.value = "dashboard";
    return;
  }

  if (!isSubscriptionActive.value) {
    dashboardTab.value = "subscription";
    return;
  }

  if (!selectedModule.value) {
    dashboardTab.value = "dashboard";
    return;
  }

  const allowedTabs =
    selectedModule.value === "PAGES"
      ? pagesTabs
      : agendsTabs;

  if (!allowedTabs.includes(dashboardTab.value)) {
    dashboardTab.value = "dashboard";
  }
}

watch(
  [user, subscription, selectedModule],
  normalizeDashboardTab,
);

window.addEventListener("hashchange", () => {
  route.value = window.location.hash || "#/";
  loadRoute();
});

const currentView = computed<View>(() => {
  if (
    route.value === "#" ||
    route.value === "#/" ||
    route.value === ""
  ) {
    return "landing";
  }
  if (route.value.startsWith("#/empresa/")) {
    return "company";
  }
  if (route.value.startsWith("#/produto/")) {
    return "product";
  }
  return "dashboard";
});

const routeSlug = computed(() => {
  const parts = route.value.split("/");
  return parts[parts.length - 1] ?? "";
});

const publicCompanyUrl = computed(() => (user.value ? `#/empresa/${user.value.slug}` : "#/dashboard"));
const filteredProducts = computed(() => {
  if (!company.value) return [];

  const search = productSearch.value
    .toLowerCase()
    .trim();

  if (!search) {
    return company.value.products;
  }

  return company.value.products.filter(
    (product) =>
      product.name
        .toLowerCase()
        .includes(search)
  );
});

const totalClicks = computed(() =>
  analytics.value.reduce(
    (sum, item) => sum + item.clicks,
    0,
  ),
);

const totalReservations = computed(() =>
  analytics.value.reduce(
    (sum, item) => sum + item.reservations,
    0,
  ),
);

const monitoredProducts = computed(
  () => analytics.value.length,
);

const appointmentFormRef = ref<HTMLElement | null>(null);

const selectedPublicService = computed(() =>
  company.value?.services?.find(
    (service) => service.id === selectedServiceId.value,
  ),
);

const availableAppointmentTimes = computed(() => {
  const service = selectedPublicService.value;
  const date = appointmentForm.value.date;

  if (!service || !date) return [];

  const weekday = weekdayByDayIndex[new Date(`${date}T12:00:00`).getDay()];
  const blocks = company.value?.availability?.filter(
    (item) => item.active && item.weekday === weekday,
  ) ?? [];
  const times = new Set<string>();

  for (const block of blocks) {
    const [startHour, startMinute] = block.startTime.split(":").map(Number);
    const [endHour, endMinute] = block.endTime.split(":").map(Number);
    let current = startHour * 60 + startMinute;
    const end = endHour * 60 + endMinute;

    while (current + service.duration <= end) {
      const hour = Math.floor(current / 60).toString().padStart(2, "0");
      const minute = (current % 60).toString().padStart(2, "0");
      times.add(`${hour}:${minute}`);
      current += service.duration;
    }
  }

  return [...times].sort();
});

const todayAppointments = computed(() => {
  const today = toLocalDateKey(new Date());
  return appointments.value.filter(
    (appointment) => toLocalDateKey(new Date(appointment.date)) === today,
  );
});

const upcomingAppointments = computed(() => {
  const today = toLocalDateKey(new Date());
  return appointments.value.filter(
    (appointment) => toLocalDateKey(new Date(appointment.date)) > today,
  );
});

function toLocalDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatAppointmentDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function weekdayLabel(weekday: Weekday) {
  return weekdayOptions.find((item) => item.value === weekday)?.label ?? weekday;
}

function showError(message: string) {
  error.value = message;
  notice.value = "";
}

function showNotice(message: string) {
  notice.value = message;
  error.value = "";
}

function openDashboard() {
  dashboardTab.value = "dashboard";

  if (selectedModule.value === "PAGES") {
    loadAnalytics();
  }
}

function startOnboarding() {
  localStorage.setItem(onboardingStorageKey, "true");
  showOnboarding.value = false;
  dashboardTab.value = "company";
}

async function loadModule() {
  const result = await api.getModule();
  selectedModule.value = result.selectedModule;
}

async function loadModuleDataForSelected() {
  if (selectedModule.value === "PAGES") {
    await loadProducts();
    await loadAnalytics();
    return;
  }

  if (selectedModule.value === "AGENDS") {
    await loadServices();
    await loadAvailability();
    await loadAppointments();
  }
}

async function selectModule(module: ModuleType) {
  loading.value = true;

  try {
    const result = await api.updateModule(module);
    selectedModule.value = result.selectedModule;
    dashboardTab.value = "dashboard";

    if (!localStorage.getItem(onboardingStorageKey)) {
      showOnboarding.value = true;
    }

    await loadModuleDataForSelected();
    showNotice("Módulo configurado.");
  } catch (err) {
    showError(
      err instanceof Error
        ? err.message
        : "Nao foi possivel salvar o modulo.",
    );
  } finally {
    loading.value = false;
  }
}

async function loadSession() {
  if (!getToken()) return;

  try {
    user.value = await api.me();

    const profile = await api.getMyProfile();

    companyForm.value = {
      name: profile.name ?? "",
      description: profile.description ?? "",
      logo: profile.logo ?? "",
      heroImage: profile.heroImage ?? "",
      instagram: profile.instagram ?? "",
      telefone: profile.telefone ?? "",
      numeroWhatsApp: profile.numeroWhatsApp ?? "",
      endereco: profile.endereco ?? "",
    };

      await loadSubscription();

      if (subscription.value?.status !== "ACTIVE") {
          dashboardTab.value = "subscription";
          return;
      }

      await loadModule();

      if (!selectedModule.value) {
        return;
      }

      await loadModuleDataForSelected();

      if (!localStorage.getItem(onboardingStorageKey)) {
        showOnboarding.value = true;
      }
  } catch {
    clearToken();
    user.value = null;
  }
}

async function submitAuth() {
  loading.value = true;
  error.value = "";

  try {
    const session =
      authMode.value === "login"
        ? await api.login({
            email: authForm.value.email,
            password: authForm.value.password,
          })
        : await api.register({
            name: authForm.value.name,
            email: authForm.value.email,
            password: authForm.value.password,
            slug: authForm.value.slug || slugify(authForm.value.name),
            numeroWhatsApp: authForm.value.numeroWhatsApp,
            description: authForm.value.description,
          });

    setToken(session.token);
    user.value = session.user;
    await loadSubscription();

    if (subscription.value?.status !== "ACTIVE") {
    dashboardTab.value = "subscription";
    return;
    }

    await loadModule();

    if (!selectedModule.value) {
      showNotice("Sessao iniciada.");
      return;
    }

    await loadModuleDataForSelected();

    showNotice("Sessao iniciada.");
  } catch (err) {
    showError(err instanceof Error ? err.message : "Nao foi possivel autenticar.");
  } finally {
    loading.value = false;
  }
}

async function loadProducts() {
  if (!user.value) return;
  products.value = await api.listProducts();
}

async function loadServices() {
  if (!user.value) return;
  services.value = await api.listServices();
}

async function loadAvailability() {
  if (!user.value) return;
  availability.value = await api.listAvailability();
}

async function loadAppointments() {
  if (!user.value) return;
  appointments.value = await api.listAppointments();
}

async function loadSubscription() {
  try {
    const result = await api.getSubscription();
    subscription.value = result;

    if (result.paymentMethod) {
      subscriptionForm.value.billingType = result.paymentMethod;
    }
  } catch (err) {
    showError(
      err instanceof Error
        ? err.message
        : "Nao foi possivel carregar a assinatura.",
    );
  }
}

async function generateSubscriptionPayment() {
  loading.value = true;

  try {
    subscriptionPayment.value = await api.createSubscriptionPayment({
      cpfCnpj: subscriptionForm.value.cpfCnpj,
      billingType: subscriptionForm.value.billingType,
    });
    await loadSubscription();
    startSubscriptionPolling();
    showNotice("Cobranca gerada.");
  } catch (err) {
    showError(
      err instanceof Error
        ? err.message
        : "Nao foi possivel gerar a cobranca.",
    );
  } finally {
    loading.value = false;
  }
}

async function copyPaymentCode(value: string) {
  try {
    await navigator.clipboard.writeText(value);
    showNotice("Codigo copiado.");
  } catch {
    showError("Nao foi possivel copiar o codigo.");
  }
}

async function startSubscriptionPolling() {
  if (subscriptionPolling) {
    clearInterval(subscriptionPolling);
  }

  subscriptionPolling = window.setInterval(async () => {
    await loadSubscription();

    if (subscription.value?.status !== "ACTIVE") {
      return;
    }

    clearInterval(subscriptionPolling!);
    subscriptionPolling = null;

    await loadModule();

    if (!selectedModule.value) {
      subscriptionPayment.value = null;
      showNotice("Pagamento confirmado! Escolha seu modulo.");
      return;
    }

    await loadModuleDataForSelected();

    dashboardTab.value = "dashboard";

    subscriptionPayment.value = null;

    showNotice("Pagamento confirmado! Bem-vindo ao Smart Links.");
  }, 5000);
}

async function loadAnalytics() {
  if (!user.value) return;

  analytics.value = await api.getAnalytics();
}

async function saveCompany() {
  loading.value = true;

  try {
    await api.updateProfile({
      name: companyForm.value.name,
      description: companyForm.value.description,
      logo: companyForm.value.logo,
      heroImage: companyForm.value.heroImage,
      instagram: companyForm.value.instagram,
      telefone: companyForm.value.telefone,
      numeroWhatsApp: companyForm.value.numeroWhatsApp,
      endereco: companyForm.value.endereco,
    });

    showNotice("Empresa atualizada.");
  } catch (err) {
    showError(
      err instanceof Error
        ? err.message
        : "Nao foi possivel atualizar a empresa.",
    );
  } finally {
    loading.value = false;
  }
}

async function uploadCompanyLogo(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];

  if (!file) return;

  uploadingLogo.value = true;

  try {
    const result = await api.uploadLogo(file);

    companyForm.value.logo = result.url;

    await api.updateProfile({
      logo: result.url,
    });

    showNotice("Logo atualizada.");
  } catch (err) {
    showError(
      err instanceof Error
        ? err.message
        : "Nao foi possivel enviar a logo.",
    );
  } finally {
    uploadingLogo.value = false;
    input.value = "";
  }
}

async function uploadCompanyHero(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];

  if (!file) return;

  uploadingLogo.value = true;

  try {
    const result = await api.uploadLogo(file);

    companyForm.value.heroImage = result.url;

    await api.updateProfile({
      heroImage: result.url,
    });

    showNotice("Banner atualizado.");
  } catch (err) {
    showError(
      err instanceof Error
        ? err.message
        : "Nao foi possivel enviar o banner.",
    );
  } finally {
    uploadingLogo.value = false;
    input.value = "";
  }
}

async function uploadProductImages(event: Event) {
  const input = event.target as HTMLInputElement;
  const selectedFiles = Array.from(input.files ?? []);

  if (!selectedFiles.length) return;

  const availableSlots = 5 - productForm.value.images.length;

  if (availableSlots <= 0) {
    showError("Voce pode enviar no maximo 5 imagens por produto.");
    input.value = "";
    return;
  }

  const files = selectedFiles.slice(0, availableSlots);

  if (selectedFiles.length > availableSlots) {
    showNotice(`Apenas ${availableSlots} imagem(ns) foram enviadas.`);
  }

  uploadingProductImages.value = true;

  try {
    const result = await api.uploadProductImages(files);

    productForm.value.images = [
      ...productForm.value.images,
      ...result.urls,
    ].slice(0, 5);

    showNotice("Imagem(ns) do produto enviada(s).");
  } catch (err) {
    showError(
      err instanceof Error
        ? err.message
        : "Nao foi possivel enviar as imagens.",
    );
  } finally {
    uploadingProductImages.value = false;
    input.value = "";
  }
}

function removeProductImage(index: number) {
  productForm.value.images.splice(index, 1);
}

function parseValues(value: string) {
  return value
    .replace(/\s+e\s+/gi, ",")
    .split(/[,\n;]/)
    .map((item) => item.trim())
    .filter(Boolean);
    }

function resetProductForm() {
  editingProductId.value = "";
  productForm.value = {
    name: "",
    slug: "",
    description: "",
    price: 0,
    image: "",
    images: [],
    colorValues: "",
    sizeValues: "",
  };
}

function buildProductInput() {
  const attributes = [];
  const colors = parseValues(productForm.value.colorValues);
  const sizes = parseValues(productForm.value.sizeValues);

  if (colors.length) {
    attributes.push({
      name: "Cor",
      values: colors.map((value) => ({ value })),
    });
  }

  if (sizes.length) {
    attributes.push({
      name: "Tamanho",
      values: sizes.map((value) => ({ value })),
    });
  }

  return {
    name: productForm.value.name,
    slug: productForm.value.slug || slugify(productForm.value.name),
    description: productForm.value.description,
    price: Number(productForm.value.price),
    images: productForm.value.images.length
      ? productForm.value.images
      : productForm.value.image
        ? [productForm.value.image]
        : undefined,
    attributes,
  };
}

function editProduct(product: Product) {
  editingProductId.value = product.id;

  productForm.value = {
    name: product.name,
    slug: product.slug,
    description: product.description ?? "",
    price: Number(product.price),
    image: "",
    images: product.images ?? [],
    colorValues:
      product.attributes
        ?.find((attribute) => attribute.name === "Cor")
        ?.values.map((value) => value.value)
        .join(", ") ?? "",
    sizeValues:
      product.attributes
        ?.find((attribute) => attribute.name === "Tamanho")
        ?.values.map((value) => value.value)
        .join(", ") ?? "",
  };
}

    async function createProduct() {
      loading.value = true;

      try {
    const input = buildProductInput();
    const wasEditing = Boolean(editingProductId.value);

    if (editingProductId.value) {
      await api.updateProduct(editingProductId.value, input);
    } else {
      await api.createProduct(input);
    }

    resetProductForm();

    await loadProducts();
    showNotice(wasEditing ? "Produto atualizado." : "Produto criado.");
  } catch (err) {
    showError(err instanceof Error ? err.message : "Nao foi possivel salvar o produto.");
  } finally {
    loading.value = false;
  }
}

function resetServiceForm() {
  editingServiceId.value = "";
  serviceForm.value = {
    name: "",
    description: "",
    duration: 60,
    price: 0,
    image: "",
    active: true,
  };
}

function editService(service: Service) {
  editingServiceId.value = service.id;
  serviceForm.value = {
    name: service.name,
    description: service.description ?? "",
    duration: service.duration,
    price: Number(service.price),
    image: service.image ?? "",
    active: service.active,
  };
}

async function uploadServiceImage(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];

  if (!file) return;

  uploadingProductImages.value = true;

  try {
    const result = await api.uploadProductImages([file]);
    serviceForm.value.image = result.urls[0] ?? "";
    showNotice("Imagem do serviÃ§o enviada.");
  } catch (err) {
    showError(
      err instanceof Error
        ? err.message
        : "Nao foi possivel enviar a imagem do serviço.",
    );
  } finally {
    uploadingProductImages.value = false;
    input.value = "";
  }
}

async function saveService() {
  loading.value = true;

  try {
    const input = {
      name: serviceForm.value.name,
      description: serviceForm.value.description,
      duration: Number(serviceForm.value.duration),
      price: Number(serviceForm.value.price),
      image: serviceForm.value.image,
      active: serviceForm.value.active,
    };

    if (editingServiceId.value) {
      await api.updateService(editingServiceId.value, input);
      showNotice("Serviço atualizado.");
    } else {
      await api.createService(input);
      showNotice("Serviço criado.");
    }

    resetServiceForm();
    await loadServices();
  } catch (err) {
    showError(
      err instanceof Error
        ? err.message
        : "Nao foi possivel salvar o serviço.",
    );
  } finally {
    loading.value = false;
  }
}

async function removeService(serviceId: string) {
  loading.value = true;

  try {
    await api.deleteService(serviceId);
    await loadServices();
    showNotice("Serviço excluido.");
  } catch (err) {
    showError(
      err instanceof Error
        ? err.message
        : "Nao foi possivel excluir o serviço.",
    );
  } finally {
    loading.value = false;
  }
}

function resetAvailabilityForm() {
  editingAvailabilityId.value = "";
  availabilityForm.value = {
    weekday: "MONDAY",
    startTime: "09:00",
    endTime: "18:00",
    active: true,
  };
}

function editAvailability(item: Availability) {
  editingAvailabilityId.value = item.id;
  availabilityForm.value = {
    weekday: item.weekday,
    startTime: item.startTime,
    endTime: item.endTime,
    active: item.active,
  };
}

async function saveAvailability() {
  loading.value = true;

  try {
    const input = { ...availabilityForm.value };

    if (editingAvailabilityId.value) {
      await api.updateAvailability(editingAvailabilityId.value, input);
      showNotice("Disponibilidade atualizada.");
    } else {
      await api.createAvailability(input);
      showNotice("Disponibilidade criada.");
    }

    resetAvailabilityForm();
    await loadAvailability();
  } catch (err) {
    showError(
      err instanceof Error
        ? err.message
        : "Nao foi possivel salvar a disponibilidade.",
    );
  } finally {
    loading.value = false;
  }
}

async function removeAvailability(id: string) {
  loading.value = true;

  try {
    await api.deleteAvailability(id);
    await loadAvailability();
    showNotice("Disponibilidade excluida.");
  } catch (err) {
    showError(
      err instanceof Error
        ? err.message
        : "Nao foi possivel excluir a disponibilidade.",
    );
  } finally {
    loading.value = false;
  }
}

function selectServiceForAppointment(serviceId: string) {
  selectedServiceId.value = serviceId;

  nextTick(() => {
    appointmentFormRef.value?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  });
}

async function createPublicAppointment() {
  if (!company.value || !selectedServiceId.value) return;

  loading.value = true;

  try {
    const date = new Date(
      `${appointmentForm.value.date}T${appointmentForm.value.time}:00`,
    );
    const result = await api.createAppointment({
      userId: company.value.id,
      serviceId: selectedServiceId.value,
      customerName: appointmentForm.value.customerName,
      customerPhone: appointmentForm.value.customerPhone,
      date: date.toISOString(),
    });

    showNotice("Agendamento criado.");
    appointmentForm.value = {
      date: "",
      time: "",
      customerName: "",
      customerPhone: "",
    };
    window.open(result.whatsappUrl, "_blank", "noopener,noreferrer");
  } catch (err) {
    showError(
      err instanceof Error
        ? err.message
        : "Nao foi possivel criar o agendamento.",
    );
  } finally {
    loading.value = false;
  }
}

async function changeAppointmentStatus(
  id: string,
  status: AppointmentStatus,
) {
  loading.value = true;

  try {
    await api.updateAppointmentStatus(id, status);
    await loadAppointments();
    showNotice("Status do agendamento atualizado.");
  } catch (err) {
    showError(
      err instanceof Error
        ? err.message
        : "Nao foi possivel atualizar o agendamento.",
    );
  } finally {
    loading.value = false;
  }
}

async function loadRoute() {
  error.value = "";
  notice.value = "";

  if (currentView.value === "company") {
    company.value = await api.getCompany(routeSlug.value);
  }

  if (currentView.value === "product") {
    publicProduct.value = await api.getPublicProduct(routeSlug.value);
  }
}

async function reserveProduct() {
  if (!publicProduct.value) return;

  loading.value = true;

  try {
    const result = await api.createReservation({
      productId: publicProduct.value.id,
      customerName: reservationForm.value.customerName,
      customerPhone: reservationForm.value.customerPhone,
      quantity: reservationForm.value.quantity,
    });

    showNotice(`Reserva ${result.reservation.status.toLowerCase()} criada.`);
    window.open(result.whatsappUrl, "_blank", "noopener,noreferrer");
  } catch (err) {
    showError(err instanceof Error ? err.message : "Nao foi possivel reservar.");
  } finally {
    loading.value = false;
  }
}

function logout() {
  clearToken();
  user.value = null;
  products.value = [];
  selectedModule.value = null;
}
async function copyProductLink(productSlug: string) {
  try {
    const url = `${window.location.origin}/#/produto/${productSlug}`;

    await navigator.clipboard.writeText(url);

    showNotice("Link copiado.");
  } catch {
    showError("Nao foi possivel copiar o link.");
  }
}

function openRelatedProducts(product: any) {
  if (selectedProductId.value === product.id) {
    selectedProductId.value = "";
    relatedSelection.value = [];
    return;
  }

  selectedProductId.value = product.id;

  relatedSelection.value =
    product.relatedFrom?.map(
      (item: any) => item.related.id,
    ) ?? [];
}

async function saveRelatedProducts() {
  if (!selectedProductId.value) return;

  try {
    await api.updateRelatedProducts(
      selectedProductId.value,
      relatedSelection.value,
    );

      showNotice("Relacionamentos atualizados.");

      selectedProductId.value = "";
      relatedSelection.value = [];

      await loadProducts();

    await loadProducts();
  } catch {
    showError(
      "Nao foi possivel salvar os relacionamentos.",
    );
  }
}

onMounted(async () => {
  await loadSession();
  await loadRoute();

  if (
    dashboardTab.value === "subscription" &&
    subscription.value?.status === "PENDING"
  ) {
    startSubscriptionPolling();
  }
});
</script>

<template>
  <main class="app-shell">
    <header  v-if="currentView !== 'landing'"  class="topbar">      <a class="brand" href="#/dashboard">
        <span class="brand-mark">SL</span>
        <span>Smart Links</span>
      </a>

      <nav class="nav-links">
        <a href="#/dashboard">Dashboard</a>
        <a v-if="user" :href="publicCompanyUrl">Página publica</a>
        <button v-if="user" class="ghost-button" type="button" @click="logout">Sair</button>
      </nav>
    </header>

    <p v-if="error" class="feedback error">{{ error }}</p>
    <p v-if="notice" class="feedback success">{{ notice }}</p>

    <section
      v-if="currentView === 'landing'"class="landing-page">
      <header class="landing-navbar">

      <div class="landing-logo">
        <span class="brand-mark">SL</span>
        <strong>Smart Links</strong>
      </div>

      <nav class="landing-menu">

        <a href="#beneficios">
          Benefícios
        </a>

        <a href="#como-funciona">
          Como Funciona
        </a>

        <a href="#modulos">
          Recursos
        </a>

      </nav>

      <button
        class="primary-button"
        @click="goToDashboard"
      >
        Criar Conta
      </button>

    </header>
    <section class="landing-hero">

      <div class="hero-content">

      <p class="eyebrow">
        SMART LINKS
      </p>

      <h1 class="landing-title">
        Organize vendas e agendamentos
        em um único lugar.
      </h1>

      <p class="landing-subtitle">
        Crie páginas de produtos, receba pedidos,
        organize agendamentos e acompanhe resultados
        em uma única plataforma.
      </p>

      <div class="landing-actions">

        <button
          class="primary-button"
          @click="goToDashboard"
        >
          Criar Conta
        </button>

        <button
          class="ghost-button"
          @click="scrollToBenefits"
        >
          Ver Como Funciona
        </button>

      </div>

        </div>

        <div class="hero-image">

      <img
        src="/dashboard-preview.png"
        alt="Dashboard Smart Links"
      />

        </div>

      </section>

      <section id="beneficios" class="landing-benefits">

        <div class="section-header">

          <p class="section-eyebrow">
            POR QUE USAR A SMART LINKS
          </p>

          <h2 class="section-title">
            Tudo que você precisa para vender mais e se organizar melhor
          </h2>

        </div>

        <img
          class="benefits-image"
          src="/benefits-grid.png"
          alt="Benefícios Smart Links"
        />

      </section>

      <section
        id="como-funciona"
        class="landing-steps"
      >

        <p class="section-eyebrow">
          COMO FUNCIONA
        </p>

        <h2 class="section-title">
          Em 4 passos simples
        </h2>

        <img
          class="steps-image"
          src="/steps-grid.png"
          alt="Passos Smart Links"
        />

      </section>

      <section
        id="modulos"
        class="landing-modules"
        >

        <div class="module-item">

        <div class="module-info">

        <p class="section-eyebrow">
        SMART PAGES
        </p>

        <h2 class="section-title">
        Sua página completa na internet.
        </h2>

        <p>

        Crie sua vitrine online, apresente seus produtos,
        receba pedidos pelo WhatsApp e tenha uma presença
        profissional.

        </p>

        <button
        class="primary-button"
        @click="goToDashboard"
        >

        Começar

        </button>

        </div>

        <img
        src="/smart-pages.png"
        alt="Smart Pages"
        />

        </div>

        <div class="module-item">

        <div class="module-info">

        <p class="section-eyebrow">
        SMART AGENDS
        </p>

        <h2 class="section-title">
        Organize todos os seus atendimentos.
        </h2>

        <p>

        Cadastre serviços, horários,
        receba agendamentos online
        e acompanhe tudo em uma agenda única.

        </p>

        <button
        class="primary-button"
        @click="goToDashboard"
        >

        Conhecer

        </button>

        </div>

        <img
        src="/smart-agends.png"
        alt="Smart Agends"
        />

        </div>

        </section>

    <section class="landing-faq">

      <h2>
        Perguntas Frequentes
      </h2>

      <div class="faq-item">
        <h3>Preciso instalar algo?</h3>
        <p>Não. Tudo funciona pelo navegador.</p>
      </div>

      <div class="faq-item">
        <h3>Funciona pelo celular?</h3>
        <p>Sim. Toda a plataforma é responsiva.</p>
      </div>

      <div class="faq-item">
        <h3>Posso usar apenas produtos?</h3>
        <p>Sim. Você escolhe os módulos que deseja utilizar.</p>
      </div>

      <div class="faq-item">
        <h3>Posso usar apenas agendamentos?</h3>
        <p>Sim. O Smart Agends funciona de forma independente.</p>
      </div>

    </section>

    <section class="landing-cta">

      <div class="cta-box">

        <p class="section-eyebrow">
          PRONTO PARA COMEÇAR?
        </p>

        <h2>
          Organize sua empresa em um único lugar.
        </h2>

        <p>
          Produtos, serviços, agendamentos e atendimento via WhatsApp
          em uma plataforma simples e organizada.
        </p>

        <button
          class="primary-button"
          @click="goToDashboard"
        >
          Criar Minha Conta
        </button>

      </div>

    </section>

    <footer class="landing-footer">

        <div class="footer-brand">

          <div class="landing-logo">

            <span class="brand-mark">
              SL
            </span>

            <strong>
              Smart Links
            </strong>

          </div>

          <p>
            Infraestrutura digital para empresas venderem,
            organizarem clientes e gerenciarem agendamentos.
          </p>

        </div>

        <div class="footer-links">

          <div>

            <h4>Produto</h4>

            <a href="#beneficios">
              Benefícios
            </a>

            <a href="#como-funciona">
              Como Funciona
            </a>

            <a href="#modulos">
              Recursos
            </a>

          </div>

          <div>

            <h4>Empresa</h4>

            <a href="#">
              Contato
            </a>

            <a href="#">
              Instagram
            </a>

          </div>

        </div>

        <div class="footer-copy">

          © 2026 Smart Links. Todos os direitos reservados.

        </div>

      </footer>

    </section>
    <section
      v-if="currentView === 'dashboard' && !user"
      class="auth-page"
    >

      <section class="auth-card">
        <p class="eyebrow">Smart Links</p>

        <h1>
          {{
            authMode === 'login'
              ? 'Entrar'
              : 'Criar conta'
          }}
        </h1>

        <p class="muted">
          {{
            authMode === 'login'
              ? 'Acesse sua vitrine.'
              : 'Crie sua empresa.'
          }}
        </p>

        <form
          class="form-grid"
          @submit.prevent="submitAuth"
        >

          <label
            v-if="authMode === 'register'"
            class="form-field"
          >
            <span>Nome da empresa</span>
            <input
              v-model="authForm.name"
              required
              placeholder="Nome da empresa"
            />
          </label>

          <label class="form-field">
            <span>Email</span>
            <input
              v-model="authForm.email"
              required
              type="email"
              placeholder="Email"
            />
          </label>

          <label class="form-field">
            <span>Senha</span>
            <input
              v-model="authForm.password"
              required
              type="password"
              placeholder="Senha"
            />
          </label>

          <template v-if="authMode === 'register'">

            <label class="form-field">
              <span>Slug</span>
              <input
                v-model="authForm.slug"
                placeholder="slug-da-empresa"
              />
            </label>

            <label class="form-field">
              <span>WhatsApp</span>
              <input
                v-model="authForm.numeroWhatsApp"
                required
                placeholder="WhatsApp"
              />
            </label>

            <label class="form-field">
              <span>Descrição</span>
              <textarea
                v-model="authForm.description"
                placeholder="Descrição"
              />
            </label>

          </template>

          <button
            class="primary-button"
            type="submit"
            :disabled="loading"
          >
            {{
              authMode === 'login'
                ? 'Entrar'
                : 'Criar conta'
            }}
          </button>

        </form>

        <button
          class="ghost-button"
          type="button"
          @click="
            authMode =
              authMode === 'login'
                ? 'register'
                : 'login'
          "
        >
          {{
            authMode === 'login'
              ? 'Criar conta'
              : 'Já tenho conta'
          }}
        </button>
      </section>

    </section>

      <section
        v-if="
          currentView === 'dashboard' &&
          user &&
          isSubscriptionActive &&
          needsModuleChoice
        "
        class="choose-module-page">
        <div class="choose-module-header">
        <p class="eyebrow">Smart Links</p>
        <h1>Escolha seu módulo</h1>
        <p class="muted">
          Escolha o módulo que melhor representa seu negócio. Essa escolha define seu painel inicial.
        </p>
      </div>

      <div class="choose-module-grid">
        <article class="choose-module-card">
          <p class="eyebrow">Smart Pages</p>
          <h2>Produtos e vendas</h2>
          <ul>
            <li>Produtos</li>
            <li>Reservas</li>
            <li>Analytics</li>
            <li>WhatsApp</li>
          </ul>
          <button
            class="primary-button"
            type="button"
            :disabled="loading"
            @click="selectModule('PAGES')"
          >
            Começar
          </button>
        </article>

        <article class="choose-module-card">
          <p class="eyebrow">Smart Agends</p>
          <h2>Serviços e agenda</h2>
          <ul>
            <li>Serviços</li>
            <li>Agenda</li>
            <li>Disponibilidade</li>
            <li>Agendamentos</li>
          </ul>
          <button
            class="primary-button"
            type="button"
            :disabled="loading"
            @click="selectModule('AGENDS')"
          >
            Começar
          </button>
        </article>
      </div>
    </section>

    <section
      v-if="currentView === 'dashboard' && canShowDashboardWorkspace && showOnboarding"
      class="onboarding-page"
    >
      <div class="onboarding-content">
        <p class="eyebrow">Bem-vindo à Smart Links</p>

        <h1>
          Sua vitrine digital está quase pronta
        </h1>

        <p class="onboarding-subtitle">
          Complete as informações principais e comece a receber clientes pelo WhatsApp.
        </p>

        <div class="onboarding-steps">
          <div class="onboarding-step">
            <span>1</span>
            <div>
              <strong>Complete os dados da empresa</strong>
              <p>Adicione logo, descrição, WhatsApp e redes sociais.</p>
            </div>
          </div>

          <div class="onboarding-step">
            <span>2</span>
            <div>
              <strong>Cadastre seu primeiro produto ou serviço</strong>
              <p>Mostre o que sua empresa oferece aos clientes.</p>
            </div>
          </div>

          <div class="onboarding-step">
            <span>3</span>
            <div>
              <strong>Compartilhe sua página</strong>
              <p>Envie o link para seus clientes e comece a vender.</p>
            </div>
          </div>
        </div>

        <button
          type="button"
          class="primary-button onboarding-button"
          @click="startOnboarding"
        >
          Começar agora →
        </button>

        <p class="onboarding-note">
          Você pode editar tudo depois nas configurações.
        </p>
      </div>

      <div class="onboarding-visual">
      <img
        src="/onboarding-preview.png"
        alt="Prévia Smart Links"
      />
    </div>
    </section>

    <section
    v-if="currentView === 'dashboard' && canShowDashboardWorkspace && !showOnboarding"
    class="workspace"
    :class="{ 'workspace-single': sidebarMode === 'none' }"
  >
      <aside
        v-if="sidebarMode !== 'none'"
        class="dashboard-sidebar"
    >
      <div class="sidebar-brand">

        <span class="brand-mark">
          SL
        </span>

        <div>
          <strong>
            Smart Links
          </strong>
        </div>

      </div>

      <nav
        v-if="sidebarMode === 'pages'"
        class="sidebar-nav"
      >
        <button
          type="button"
          class="sidebar-item"
          :class="{ active: dashboardTab === 'dashboard' }"
          @click="openDashboard()"
        >
          Dashboard
        </button>

        <button
          type="button"
          class="sidebar-item"
          :class="{ active: dashboardTab === 'products' }"
          @click="dashboardTab = 'products'"
        >
          Produtos
        </button>

        <button
          type="button"
          class="sidebar-item"
          :class="{ active: dashboardTab === 'analytics' }"
          @click="dashboardTab = 'analytics'; loadAnalytics()"
        >
          Analytics
        </button>

        <button
          type="button"
          class="sidebar-item"
          :class="{ active: dashboardTab === 'company' }"
          @click="dashboardTab = 'company'"
        >
          Minha Empresa
        </button>

        <button
          type="button"
          class="sidebar-item"
          :class="{ active: dashboardTab === 'settings' }"
          @click="dashboardTab = 'settings'"
        >
          Configurações
        </button>
      </nav>

        <nav
          v-if="sidebarMode === 'agends'"
          class="sidebar-nav"
        >
        <button
          type="button"
          class="sidebar-item"
          :class="{ active: dashboardTab === 'dashboard' }"
          @click="openDashboard()"
        >
          Dashboard
        </button>

        <button
          type="button"
          class="sidebar-item"
          :class="{ active: dashboardTab === 'services' }"
          @click="dashboardTab = 'services'; loadServices()"
        >
          Serviços
        </button>

        <button
          type="button"
          class="sidebar-item"
          :class="{ active: dashboardTab === 'availability' }"
          @click="dashboardTab = 'availability'; loadAvailability()"
        >
          Disponibilidade
        </button>

        <button
          type="button"
          class="sidebar-item"
          :class="{ active: dashboardTab === 'agenda' }"
          @click="dashboardTab = 'agenda'; loadAppointments()"
        >
          Agenda
        </button>

        <button
          type="button"
          class="sidebar-item"
          :class="{ active: dashboardTab === 'company' }"
          @click="dashboardTab = 'company'"
        >
          Minha Empresa
        </button>

        <button
          type="button"
          class="sidebar-item"
          :class="{ active: dashboardTab === 'settings' }"
          @click="dashboardTab = 'settings'"
        >
          Configurações
        </button>
      </nav>

      <div class="sidebar-footer">

        <p class="eyebrow">
          Página Pública
        </p>

        <a
          class="primary-link"
          :href="publicCompanyUrl"
          target="_blank"
        >
          Abrir Vitrine
        </a>

      </div>

    </aside>
        
      <section  v-if="
        user &&
        !needsModuleChoice
      "
      class="main-panel">
        <div class="dashboard-header">

        <div>
          <p class="eyebrow">
            Smart Links
          </p>

          <h1 class="dashboard-title">
            {{ currentDashboardSection.title }}
          </h1>

          <p class="dashboard-subtitle">
            {{ currentDashboardSection.subtitle }}
          </p>
        </div>

        <div class="dashboard-counter">
          {{ currentDashboardCounter }}
        </div>

      </div>

        <div
          v-if="dashboardTab === 'dashboard' && showPagesContent"
        >
          <div class="analytics-cards">
            <div class="analytics-card">
              <span>Produtos</span>
              <strong>{{ products.length }}</strong>
            </div>

            <div class="analytics-card">
              <span>Total de Cliques</span>
              <strong>{{ totalClicks }}</strong>
            </div>

            <div class="analytics-card">
              <span>Total de Reservas</span>
              <strong>{{ totalReservations }}</strong>
            </div>
          </div>
        </div>

        <div
          v-if="dashboardTab === 'dashboard' && selectedModule === 'AGENDS'"
          class="analytics-page"
        >
          <div class="analytics-cards">
            <div class="analytics-card">
              <span>Serviços</span>
              <strong>{{ services.length }}</strong>
            </div>

            <div class="analytics-card">
              <span>Agendamentos Hoje</span>
              <strong>{{ todayAppointments.length }}</strong>
            </div>

            <div class="analytics-card">
              <span>Horários Cadastrados</span>
              <strong>{{ availability.length }}</strong>
            </div>
          </div>
        </div>

        <form
          v-if="user && dashboardTab === 'products' && showPagesContent"
          class="product-form"
          @submit.prevent="createProduct"
        >
          <label class="form-field">
            <span>Nome do produto</span>
            <input v-model="productForm.name" required placeholder="Nome do produto" />
          </label>

          <label class="form-field">
            <span>Slug</span>
            <input v-model="productForm.slug" placeholder="slug-do-produto" />
          </label>

          <label class="form-field">
            <span>Preço</span>
            <input v-model.number="productForm.price" required type="number" min="0" step="0.01" placeholder="Preco" />
          </label>

          <label class="logo-upload product-image-upload">
            <span>Imagens do produto</span>
            <input
              type="file"
              multiple
              accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
              :disabled="uploadingProductImages || productForm.images.length >= 5"
              @change="uploadProductImages"
            />
          </label>

          <div
            v-if="productForm.images.length"
            class="product-image-preview-grid"
          >
            <div
              v-for="(image, index) in productForm.images"
              :key="image"
              class="product-image-preview"
            >
              <img
                :src="image"
                alt=""
              />

              <button
                type="button"
                class="product-image-remove"
                @click="removeProductImage(index)"
              >
                Remover
              </button>

              <span v-if="index === 0">
                Capa
              </span>
            </div>
          </div>

          <label class="form-field">
            <span>URL da imagem</span>
            <input v-model="productForm.image" placeholder="URL da imagem" />
          </label>

          <label class="form-field">
            <span>Cores</span>
            <input v-model="productForm.colorValues" placeholder="Cores: Preto, Branco" />
          </label>

          <label class="form-field">
            <span>Tamanhos</span>
            <input v-model="productForm.sizeValues" placeholder="Tamanhos: P, M, G" />
          </label>

          <label class="form-field">
            <span>Descrição</span>
            <textarea v-model="productForm.description" placeholder="Descricao" />
          </label>

          <button class="primary-button" type="submit" :disabled="loading">
            {{ editingProductId ? 'Salvar alterações' : 'Criar produto' }}
          </button>

          <button
            v-if="editingProductId"
            class="ghost-button"
            type="button"
            @click="resetProductForm"
          >
            Cancelar Edição
          </button>
        </form>

          <div
            v-if="dashboardTab === 'products' && showPagesContent"
            class="product-list"
          >
          <article v-for="product in products" :key="product.id" class="product-card">
            <img :src="product.images?.[0] || 'https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?auto=format&fit=crop&w=900&q=80'" alt="" />
            <div class="product-card-content">
                <h3>{{ product.name }}</h3>

                <p>{{ formatCurrency(product.price) }}</p>

                <div class="product-actions">
                  <a class="product-action-link" :href="`#/produto/${product.slug}`">
                    Ver pagina
                  </a>

                  <button
                    type="button"
                    class="ghost-button"
                    @click="copyProductLink(product.slug)"
                    >
                    Copiar link
                  </button>

                  <button
                    type="button"
                    class="ghost-button"
                    @click="editProduct(product)"
                  >
                    Editar
                  </button>

                  <button
                    type="button"
                    class="ghost-button"
                    @click="openRelatedProducts(product)"
                  >
                    Relacionados
                  </button>
                  </div>
                  </div>

                  <div
                    v-if="selectedProductId === product.id"
                    class="related-products-panel"
                  >
                    <div class="panel-header">
                    <h3>Produtos relacionados</h3>

                    <button
                      type="button"
                      class="ghost-button"
                      @click="selectedProductId = ''; relatedSelection = []"                    >
                      Fechar
                    </button>
                  </div>

                    <p>
                      Selecione até 4 produtos.
                    </p>
                    <div
                      v-for="candidate in products"
                      :key="candidate.id"
                    >
                      <div
                        v-if="candidate.id !== product.id"
                        class="related-option"
                        :class="{
                          selected:
                            relatedSelection.includes(candidate.id)
                        }"
                        @click="selectedProductId = ''; relatedSelection = []"
                      >
                        <img
                          :src="
                            candidate.images?.[0] ||
                            'https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?auto=format&fit=crop&w=900&q=80'
                          "
                          alt=""
                        />

                        <div class="related-option-content">
                          <strong>
                            {{ candidate.name }}
                          </strong>

                          <span>
                            {{ formatCurrency(candidate.price) }}
                          </span>
                        </div>

                        <div class="related-check">
                          {{
                            relatedSelection.includes(candidate.id)
                              ? '✓'
                              : '+'
                          }}
                        </div>
                      </div>
                    </div>
                      <div class="related-counter">
                      {{ relatedSelection.length }}/4 selecionados
                    </div>

                    <button
                      type="button"
                      class="primary-button"
                      @click="saveRelatedProducts"
                    >
                      Salvar Relacionamentos
                    </button>
                  </div>

                  </article>
        </div>
        <div
          v-if="dashboardTab === 'analytics' && showPagesContent"
          class="analytics-page"
        >
          <div class="analytics-cards">

            <div class="analytics-card">
              <span>Total de Cliques</span>
              <strong>{{ totalClicks }}</strong>
            </div>

            <div class="analytics-card">
              <span>Total de Reservas</span>
              <strong>{{ totalReservations }}</strong>
            </div>

            <div class="analytics-card">
              <span>Produtos Monitorados</span>
              <strong>{{ monitoredProducts }}</strong>
            </div>

          </div>

          <div class="analytics-table-wrapper">

            <table class="analytics-table">

              <thead>
                <tr>
                  <th>Produto</th>
                  <th>Cliques</th>
                  <th>Reservas</th>
                </tr>
              </thead>

              <tbody>

                <tr
                  v-for="item in analytics"
                  :key="item.productId"
                >
                  <td>{{ item.productName }}</td>
                  <td>{{ item.clicks }}</td>
                  <td>{{ item.reservations }}</td>
                </tr>

                <tr v-if="!analytics.length">
                  <td colspan="3">
                    Nenhum dado encontrado.
                  </td>
                </tr>

              </tbody>

            </table>

          </div>
        </div>

        <div
          v-if="dashboardTab === 'services' && showAgendsContent"
          class="services-dashboard"
        >
          <form
            class="product-form"
            @submit.prevent="saveService"
          >
            <label class="form-field">
              <span>Nome do serviço</span>
              <input
                v-model="serviceForm.name"
                required
                placeholder="Nome do serviço"
              />
            </label>

            <label class="form-field">
              <span>Duração em minutos</span>
              <input
                v-model.number="serviceForm.duration"
                required
                type="number"
                min="1"
                placeholder="Duração em minutos"
              />
            </label>

            <label class="form-field">
              <span>Preço</span>
              <input
                v-model.number="serviceForm.price"
                required
                type="number"
                min="0"
                step="0.01"
                placeholder="Preço"
              />
            </label>

            <label class="service-active-toggle">
              <input
                v-model="serviceForm.active"
                type="checkbox"
              />
              <span>Ativo</span>
            </label>

            <label class="logo-upload product-image-upload">
              <span>Imagem do serviço</span>
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                :disabled="uploadingProductImages"
                @change="uploadServiceImage"
              />
            </label>

            <div
              v-if="serviceForm.image"
              class="product-image-preview-grid"
            >
              <div class="product-image-preview">
                <img
                  :src="serviceForm.image"
                  alt=""
                />

                <button
                  type="button"
                  class="product-image-remove"
                  @click="serviceForm.image = ''"
                >
                  Remover
                </button>
              </div>
            </div>

            <label class="form-field">
              <span>Descrição</span>
              <textarea
                v-model="serviceForm.description"
                placeholder="Descrição"
              />
            </label>

            <button
              class="primary-button"
              type="submit"
              :disabled="loading"
            >
              {{ editingServiceId ? 'Salvar serviço' : 'Criar serviço' }}
            </button>

            <button
              v-if="editingServiceId"
              class="ghost-button"
              type="button"
              @click="resetServiceForm"
            >
              Cancelar edição
            </button>
          </form>

          <div class="service-list">
            <article
              v-for="service in services"
              :key="service.id"
              class="service-card"
            >
              <div>
                <img
                  v-if="service.image"
                  class="service-card-image"
                  :src="service.image"
                  alt=""
                />

                <h3>{{ service.name }}</h3>
                <p>{{ service.description }}</p>
                <span>
                  {{ service.duration }} min - {{ formatCurrency(service.price) }}
                </span>
              </div>

              <strong
                :class="{
                  inactive: !service.active
                }"
              >
                {{ service.active ? 'Ativo' : 'Inativo' }}
              </strong>

              <div class="product-actions">
                <button
                  type="button"
                  class="ghost-button"
                  @click="editService(service)"
                >
                  Editar
                </button>

                <button
                  type="button"
                  class="ghost-button"
                  @click="removeService(service.id)"
                >
                  Excluir
                </button>
              </div>
            </article>

            <p
              v-if="!services.length"
              class="muted"
            >
              Nenhum serviço cadastrado.
            </p>
          </div>
        </div>

        <div
          v-if="dashboardTab === 'availability' && showAgendsContent"
          class="availability-dashboard"
        >
          <form
            class="availability-form"
            @submit.prevent="saveAvailability"
          >
            <label class="form-field">
              <span>Dia da semana</span>
              <select v-model="availabilityForm.weekday">
                <option
                  v-for="weekday in weekdayOptions"
                  :key="weekday.value"
                  :value="weekday.value"
                >
                  {{ weekday.label }}
                </option>
              </select>
            </label>

            <label>
              <span>Hora inicial</span>
              <input
                v-model="availabilityForm.startTime"
                required
                type="time"
              />
            </label>

            <label>
              <span>Hora final</span>
              <input
                v-model="availabilityForm.endTime"
                required
                type="time"
              />
            </label>

            <label class="service-active-toggle">
              <input
                v-model="availabilityForm.active"
                type="checkbox"
              />
              <span>Ativo</span>
            </label>

            <button
              class="primary-button"
              type="submit"
              :disabled="loading"
            >
              {{ editingAvailabilityId ? 'Salvar horario' : 'Adicionar horario' }}
            </button>

            <button
              v-if="editingAvailabilityId"
              class="ghost-button"
              type="button"
              @click="resetAvailabilityForm"
            >
              Cancelar edicao
            </button>
          </form>

          <div class="availability-list">
            <article
              v-for="item in availability"
              :key="item.id"
              class="availability-card"
            >
              <div>
                <strong>{{ weekdayLabel(item.weekday) }}</strong>
                <span>{{ item.startTime }} - {{ item.endTime }}</span>
              </div>

              <span :class="{ inactive: !item.active }">
                {{ item.active ? 'Ativo' : 'Inativo' }}
              </span>

              <div class="product-actions">
                <button
                  type="button"
                  class="ghost-button"
                  @click="editAvailability(item)"
                >
                  Editar
                </button>
                <button
                  type="button"
                  class="ghost-button"
                  @click="removeAvailability(item.id)"
                >
                  Excluir
                </button>
              </div>
            </article>

            <p v-if="!availability.length" class="muted">
              Nenhum horário cadastrado.
            </p>
          </div>
        </div>

        <div
          v-if="dashboardTab === 'agenda' && showAgendsContent"
          class="agenda-dashboard"
        >
          <section class="agenda-group">
            <h2>Hoje</h2>
            <article
              v-for="appointment in todayAppointments"
              :key="appointment.id"
              class="appointment-card"
            >
              <div>
                <strong>{{ appointment.service.name }}</strong>
                <p>{{ appointment.customerName }} - {{ appointment.customerPhone }}</p>
                <span>{{ formatAppointmentDate(appointment.date) }}</span>
              </div>
              <span class="appointment-status">{{ appointment.status }}</span>
              <div class="product-actions">
                <button
                  v-if="!['CONFIRMED', 'COMPLETED', 'CANCELED'].includes(appointment.status)"
                  type="button"
                  @click="changeAppointmentStatus(appointment.id, 'CONFIRMED')"
                >Confirmar</button>
                <button
                  v-if="!['COMPLETED', 'CANCELED'].includes(appointment.status)"
                  type="button"
                  @click="changeAppointmentStatus(appointment.id, 'COMPLETED')"
                >Concluir</button>
                <button
                  v-if="!['COMPLETED', 'CANCELED'].includes(appointment.status)"
                  type="button"
                  @click="changeAppointmentStatus(appointment.id, 'CANCELED')"
                >Cancelar</button>
              </div>
            </article>
            <p v-if="!todayAppointments.length" class="muted">
              Nenhum agendamento para hoje.
            </p>
          </section>

          <section class="agenda-group">
            <h2>Proximos</h2>
            <article
              v-for="appointment in upcomingAppointments"
              :key="appointment.id"
              class="appointment-card"
            >
              <div>
                <strong>{{ appointment.service.name }}</strong>
                <p>{{ appointment.customerName }} - {{ appointment.customerPhone }}</p>
                <span>{{ formatAppointmentDate(appointment.date) }}</span>
              </div>
              <span class="appointment-status">{{ appointment.status }}</span>
              <div class="product-actions">
                <button
                  v-if="!['CONFIRMED', 'COMPLETED', 'CANCELED'].includes(appointment.status)"
                  type="button"
                  @click="changeAppointmentStatus(appointment.id, 'CONFIRMED')"
                >Confirmar</button>
                <button
                  v-if="!['COMPLETED', 'CANCELED'].includes(appointment.status)"
                  type="button"
                  @click="changeAppointmentStatus(appointment.id, 'COMPLETED')"
                >Concluir</button>
                <button
                  v-if="!['COMPLETED', 'CANCELED'].includes(appointment.status)"
                  type="button"
                  @click="changeAppointmentStatus(appointment.id, 'CANCELED')"
                >Cancelar</button>
              </div>
            </article>
            <p v-if="!upcomingAppointments.length" class="muted">
              Nenhum proximo agendamento.
            </p>
          </section>
        </div>

        <div
          v-if="dashboardTab === 'company'"
          class="company-settings"
        >
          <div class="company-profile-header">

          <div class="company-avatar-preview">

            <img
              v-if="companyForm.logo"
              :src="companyForm.logo"
              alt=""
            />

            <span v-else>
              {{
                (companyForm.name || 'SL')
                  .slice(0, 2)
                  .toUpperCase()
              }}
            </span>

          </div>

          <div>

            <h2>
              {{ companyForm.name || 'Minha Empresa' }}
            </h2>

            <p class="muted">
              {{ companyForm.instagram || '@instagram' }}
            </p>

          </div>

        </div>

          <div class="product-form">
           <form class="product-form" @submit.prevent="saveCompany">
            <div class="settings-section">

              <h3>
                Identidade da Empresa
              </h3>

              <p class="muted">
                Informações públicas exibidas na sua vitrine.
              </p>

            </div>  
            <div class="settings-divider"></div>
            <label class="form-field">
              <span>Nome da empresa</span>
              <input
                v-model="companyForm.name"
                placeholder="Nome da empresa"
              />
            </label>

              <label class="form-field">
                <span>Descrição</span>
                <textarea
                v-model="companyForm.description"
                placeholder="Descrição"
              />
              </label>

              <label class="form-field">
                <span>Instagram</span>
                <input
                v-model="companyForm.instagram"
                placeholder="Instagram"
              />
              </label>

              <div class="settings-divider"></div>
                <div class="settings-section">
                  <h3>Contato</h3>
                </div>
              <label class="form-field">
                <span>Telefone</span>
                <input
                v-model="companyForm.telefone"
                placeholder="Telefone"
              />
              </label>

              <label class="form-field">
                <span>WhatsApp</span>
                <input
                v-model="companyForm.numeroWhatsApp"
                placeholder="WhatsApp"
              />
              </label>

              <label class="form-field">
                <span>Endereço</span>
                <input
                v-model="companyForm.endereco"
                placeholder="Endereço"
              />
              </label>

              <div class="settings-divider"></div>
              <label class="logo-upload">
                <span>Logo da empresa</span>
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                  :disabled="uploadingLogo"
                  @change="uploadCompanyLogo"
                />
                <div class="settings-divider"></div>

                <label class="logo-upload">
                  <span>Banner Hero</span>

                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                    :disabled="uploadingLogo"
                    @change="uploadCompanyHero"
                  />
                </label>

                <label class="form-field">
                  <span>URL do banner</span>
                  <input
                  v-model="companyForm.heroImage"
                  placeholder="URL do Banner"
                />
                </label>
              </label>

              <label class="form-field">
                <span>URL da logo</span>
                <input
                v-model="companyForm.logo"
                placeholder="URL da Logo"
              />
              </label>

              <button
                class="primary-button"
                type="submit"
                :disabled="loading"
              >
                Salvar Alterações
              </button>
            </form>
          </div>
        </div>
        <div
          v-if="dashboardTab === 'subscription'"
          class="subscription-page"
        >
          <div class="subscription-card">
            <div class="subscription-header">
              <div>
                <p class="eyebrow">ASSINATURA</p>
                <h2>{{ subscription?.plan.name ?? 'Smart Links' }}</h2>
                <p>
                  Sua assinatura mantém sua empresa online e libera todos os recursos da plataforma.
                </p>
              </div>

              <span
                class="subscription-status"
                :class="(subscription?.status ?? 'PENDING').toLowerCase()"
              >
                {{ subscription?.status ?? 'PENDING' }}
              </span>
            </div>

            <div class="subscription-grid">
              <div class="subscription-item">
                <span>Plano</span>
                <strong>{{ subscription?.plan.name ?? 'Smart Links' }}</strong>
              </div>

              <div class="subscription-item">
                <span>Valor</span>
                <strong>
                  {{ formatCurrency(subscription?.plan.price ?? 97) }}/mês
                </strong>
              </div>

              <div class="subscription-item">
                <span>Próximo vencimento</span>
                <strong>{{ subscription?.nextDueDate?.slice(0, 10) ?? 'A definir' }}</strong>
              </div>

              <div class="subscription-item">
                <span>Forma de pagamento</span>
                <strong>{{ subscription?.paymentMethod ?? 'Não definida' }}</strong>
              </div>
            </div>

            <form
              v-if="!subscriptionPayment"
              class="subscription-payment-form"
              @submit.prevent="generateSubscriptionPayment"
            >
              <div>
                <h3>
                  {{ subscription?.asaasSubscriptionId ? 'Consultar cobrança' : 'Gerar primeira cobrança' }}
                </h3>
                <p class="muted">
                  Informe o documento do titular e escolha a forma de pagamento.
                </p>
              </div>

              <input
                v-model="subscriptionForm.cpfCnpj"
                required
                inputmode="numeric"
                placeholder="CPF ou CNPJ"
              />

              <div class="payment-method-control">
                <label :class="{ active: subscriptionForm.billingType === 'PIX' }">
                  <input
                    v-model="subscriptionForm.billingType"
                    type="radio"
                    value="PIX"
                  />
                  PIX
                </label>
                <label :class="{ active: subscriptionForm.billingType === 'BOLETO' }">
                  <input
                    v-model="subscriptionForm.billingType"
                    type="radio"
                    value="BOLETO"
                  />
                  Boleto
                </label>
              </div>

              <button
                class="primary-button"
                type="submit"
                :disabled="loading"
              >
                {{ loading ? 'Gerando...' : 'Gerar cobrança' }}
              </button>
            </form>

            <div
              v-if="subscriptionPayment"
              class="payment-result"
            >
              <div>
                <p class="eyebrow">COBRANÇA GERADA</p>
                <h3>{{ formatCurrency(subscriptionPayment.payment.value) }}</h3>
                <p class="muted">
                  Vencimento: {{ subscriptionPayment.payment.dueDate }}
                </p>
              </div>

              <template v-if="subscriptionPayment.pix">
                <img
                  class="pix-qr-code"
                  :src="`data:image/png;base64,${subscriptionPayment.pix.encodedImage}`"
                  alt="QR Code PIX"
                />
                <textarea
                  readonly
                  :value="subscriptionPayment.pix.payload"
                />
                <button
                  class="primary-button"
                  type="button"
                  @click="copyPaymentCode(subscriptionPayment.pix.payload)"
                >
                  Copiar PIX
                </button>
              </template>

              <template v-if="subscriptionPayment.boleto">
                <textarea
                  readonly
                  :value="subscriptionPayment.boleto.identificationField"
                />
                <button
                  class="primary-button"
                  type="button"
                  @click="copyPaymentCode(subscriptionPayment.boleto.identificationField)"
                >
                  Copiar linha digitável
                </button>
                <a
                  v-if="subscriptionPayment.boleto.url"
                  class="primary-link"
                  :href="subscriptionPayment.boleto.url"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Abrir boleto
                </a>
              </template>
            </div>

          </div>
        </div>

        <div
          v-if="dashboardTab === 'settings'"
          class="settings-page"
        >
        <div class="empty-state">
          <h3>Configurações</h3>
          <p class="muted">
            Seu módulo já foi definido para esta empresa.
          </p>
        </div>
         
      </div>
      </section>
    </section>

      <section
        v-if="currentView === 'company' && company"
        class="public-page"
      >
        <div class="company-hero">

         <div class="company-banner">
            <img
              v-if="company.heroImage"
              :src="company.heroImage"
              alt=""
            />

          </div>

          <div class="company-hero-content">

            <div class="company-logo-large">
              <img
                v-if="company.logo"
                :src="company.logo"
                alt=""
              />

              <span v-else>
                {{ company.name.slice(0, 2).toUpperCase() }}
              </span>
            </div>

            <h1>
              {{ company.name }}
            </h1>

            <p class="company-description">
              {{ company.description }}
            </p>

            <div
              v-if="company.instagram"
              class="company-social"
            >
              {{ company.instagram }}
            </div>

            <a
              v-if="company.numeroWhatsApp"
              class="primary-link"
              :href="`https://wa.me/${company.numeroWhatsApp.replace(/\D/g,'')}`"
              target="_blank"
            >
              Falar no WhatsApp
            </a>

          </div>

          <div class="company-info-cards">

            <div class="info-card">
              <strong>WhatsApp</strong>
              <span>Atendimento rápido</span>
            </div>

            <div class="info-card">
              <strong>Catálogo Online</strong>
              <span>Produtos disponíveis</span>
            </div>

            <div class="info-card">
              <strong>Empresa Verificada</strong>
              <span>Perfil ativo</span>
            </div>

          </div>

          <div class="catalog-header">

            <input
              v-model="productSearch"
              class="product-search"
              placeholder="Buscar produtos..."
            />

          </div>

        </div>

        <div class="public-grid">
          <a
            v-for="product in filteredProducts"
            :key="product.id"
            class="public-card"
            :href="`#/produto/${product.slug}`"
          >
            <img
              :src="
                product.images?.[0] ||
                'https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?auto=format&fit=crop&w=900&q=80'
              "
              alt=""
            />

            <strong>
              {{ product.name }}
            </strong>

            <span>
              {{ formatCurrency(product.price) }}
            </span>

            <span class="public-card-link">
              Ver Produto →
            </span>
          </a>
        </div>

        <section
          v-if="company.services?.length"
          class="public-services"
        >
          <div class="related-products-header">
            <h2>Serviços</h2>
            <p class="muted">
              Fale no WhatsApp para agendar ou tirar dúvidas.
            </p>
          </div>

          <div class="service-public-grid">
            <article
              v-for="service in company.services"
              :key="service.id"
              class="service-public-card"
            >
              <h3>{{ service.name }}</h3>
              <img
                v-if="service.image"
                :src="service.image"
                alt=""
              />
              <p>{{ service.description }}</p>
              <span>
                {{ service.duration }} min - {{ formatCurrency(service.price) }}
              </span>

              <button
                class="primary-button"
                type="button"
                @click="selectServiceForAppointment(service.id)"
              >
                Agendar
              </button>
            </article>
          </div>

          <form
            v-if="selectedPublicService"
            ref="appointmentFormRef"
            class="public-appointment-form"
            @submit.prevent="createPublicAppointment"
          >
            <div>
              <p class="eyebrow">Agendamento</p>
              <h3>{{ selectedPublicService.name }}</h3>
            </div>

            <label>
              <span>Data</span>
              <input
                v-model="appointmentForm.date"
                required
                type="date"
                :min="toLocalDateKey(new Date())"
                @change="appointmentForm.time = ''"
              />
            </label>

            <label>
              <span>Horário</span>
              <select
                v-model="appointmentForm.time"
                required
                :disabled="!availableAppointmentTimes.length"
              >
                <option value="" disabled>Selecione</option>
                <option
                  v-for="time in availableAppointmentTimes"
                  :key="time"
                  :value="time"
                >
                  {{ time }}
                </option>
              </select>
            </label>

            <label class="form-field">
              <span>Nome</span>
              <input
                v-model="appointmentForm.customerName"
                required
                placeholder="Seu nome"
              />
            </label>

            <label class="form-field">
              <span>WhatsApp</span>
              <input
                v-model="appointmentForm.customerPhone"
                required
                placeholder="Seu WhatsApp"
              />
            </label>

            <p
              v-if="appointmentForm.date && !availableAppointmentTimes.length"
              class="muted"
            >
              Não ha horários disponiveis para esta data.
            </p>

            <button
              class="primary-button"
              type="submit"
              :disabled="loading || !appointmentForm.time"
            >
              Agendar no WhatsApp
            </button>
          </form>
        </section>

      </section>

    <section v-if="currentView === 'product' && publicProduct" class="product-page">
      <div class="product-media">
        <img :src="publicProduct.images?.[0] || 'https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?auto=format&fit=crop&w=1200&q=80'" alt="" />

        <div
          v-if="publicProduct.images?.length && publicProduct.images.length > 1"
          class="product-media-thumbs"
        >
          <img
            v-for="image in publicProduct.images"
            :key="image"
            :src="image"
            alt=""
          />
        </div>
      </div>

      <div class="purchase-panel">
        <p class="eyebrow">{{ publicProduct.user.name }}</p>
        <h1>{{ publicProduct.name }}</h1>
        <p class="price">{{ formatCurrency(publicProduct.price) }}</p>
        <p>{{ publicProduct.description }}</p>

        <div v-for="attribute in publicProduct.attributes" :key="attribute.id" class="swatch-group">
          <span>{{ attribute.name }}</span>
          <div>
            <button v-for="value in attribute.values" :key="value.id" type="button" class="swatch">
              {{ value.value }}
            </button>
          </div>
        </div>

        <form class="reservation-box" @submit.prevent="reserveProduct">
          <input v-model="reservationForm.customerName" required placeholder="Seu nome" />
          <input v-model="reservationForm.customerPhone" required placeholder="Seu WhatsApp" />
          <input v-model.number="reservationForm.quantity" required type="number" min="1" />
          <button class="primary-button" type="submit" :disabled="loading">Reservar no WhatsApp</button>
        </form>
        <section
          v-if="publicProduct.relatedFrom?.length"
          class="related-products-public"
        >
          <div class="related-products-header">
            <h3>Você também pode gostar</h3>

            <p class="muted">
              Produtos selecionados pela loja
            </p>
          </div>

          <div class="related-products-grid">
            <a
              v-for="item in publicProduct.relatedFrom"
              :key="item.related.id"
              class="related-public-card"
              :href="`#/produto/${item.related.slug}`"
            >
              <img
                :src="
                  item.related.images?.[0] ||
                  'https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?auto=format&fit=crop&w=900&q=80'
                "
                alt=""
              />

              <div class="related-public-content">
                <strong>
                  {{ item.related.name }}
                </strong>

                <span>
                  {{ formatCurrency(item.related.price) }}
                </span>

                <div class="related-public-link">
                  Ver Produto →
                </div>
              </div>
            </a>
          </div>
        </section>
      </div>
    </section>
  </main>
</template>
