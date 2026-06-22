<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { api, clearToken, getToken, setToken, type Appointment, type AppointmentStatus, type Availability, type CompanyPage, type ProductAnalytics, type Product, type PublicProduct, type Service, type SessionUser, type Weekday } from "./api";
import { formatCurrency, slugify } from "./format";


type View = "dashboard" | "company" | "product";

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

const route = ref(window.location.hash || "#/dashboard");
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
const dashboardTab = ref<"products" | "company" | "analytics" | "services" | "availability" | "agenda">("products");
const selectedProductId = ref("");
const relatedSelection = ref<string[]>([]);
const productSearch = ref("");
const editingServiceId = ref("");
const editingAvailabilityId = ref("");
const selectedServiceId = ref("");

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

window.addEventListener("hashchange", () => {
  route.value = window.location.hash || "#/dashboard";
  loadRoute();
});

const currentView = computed<View>(() => {
  if (route.value.startsWith("#/empresa/")) return "company";
  if (route.value.startsWith("#/produto/")) return "product";
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

    await loadProducts();
    await loadServices();
    await loadAvailability();
    await loadAppointments();
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
    await loadProducts();
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
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => ({ value: item }));
}

async function createProduct() {
  loading.value = true;

  try {
    const attributes = [];
    const colors = parseValues(productForm.value.colorValues);
    const sizes = parseValues(productForm.value.sizeValues);

    if (colors.length) attributes.push({ name: "Cor", values: colors });
    if (sizes.length) attributes.push({ name: "Tamanho", values: sizes });

    await api.createProduct({
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
    });

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

    await loadProducts();
    showNotice("Produto criado.");
  } catch (err) {
    showError(err instanceof Error ? err.message : "Nao foi possivel criar o produto.");
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
        : "Nao foi possivel enviar a imagem do servico.",
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
      showNotice("Servico atualizado.");
    } else {
      await api.createService(input);
      showNotice("Servico criado.");
    }

    resetServiceForm();
    await loadServices();
  } catch (err) {
    showError(
      err instanceof Error
        ? err.message
        : "Nao foi possivel salvar o servico.",
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
    showNotice("Servico excluido.");
  } catch (err) {
    showError(
      err instanceof Error
        ? err.message
        : "Nao foi possivel excluir o servico.",
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
  appointmentForm.value.time = "";
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
  selectedProductId.value = product.id;

  relatedSelection.value =
    product.relatedFrom?.map(
      (item: any) => item.related.id,
    ) ?? [];
}

function toggleRelatedProduct(productId: string) {
  const index =
    relatedSelection.value.indexOf(productId);

  if (index >= 0) {
    relatedSelection.value.splice(index, 1);
    return;
  }

  if (relatedSelection.value.length >= 4) {
    showError(
      "Voce pode selecionar no maximo 4 produtos.",
    );
    return;
  }

  relatedSelection.value.push(productId);
}

async function saveRelatedProducts() {
  if (!selectedProductId.value) return;

  try {
    await api.updateRelatedProducts(
      selectedProductId.value,
      relatedSelection.value,
    );

    showNotice("Relacionamentos atualizados.");

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
});
</script>

<template>
  <main class="app-shell">
    <header class="topbar">
      <a class="brand" href="#/dashboard">
        <span class="brand-mark">SL</span>
        <span>Smart Links</span>
      </a>

      <nav class="nav-links">
        <a href="#/dashboard">Dashboard</a>
        <a v-if="user" :href="publicCompanyUrl">Pagina publica</a>
        <button v-if="user" class="ghost-button" type="button" @click="logout">Sair</button>
      </nav>
    </header>

    <p v-if="error" class="feedback error">{{ error }}</p>
    <p v-if="notice" class="feedback success">{{ notice }}</p>

    <section
      v-if="currentView === 'dashboard' && !user"
      class="workspace"
    >
      <section class="main-panel">

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
              : 'Crie sua empresa gratuitamente.'
          }}
        </p>

        <form
          class="form-grid"
          @submit.prevent="submitAuth"
        >

          <input
            v-if="authMode === 'register'"
            v-model="authForm.name"
            required
            placeholder="Nome da empresa"
          />

          <input
            v-model="authForm.email"
            required
            type="email"
            placeholder="Email"
          />

          <input
            v-model="authForm.password"
            required
            type="password"
            placeholder="Senha"
          />

          <template v-if="authMode === 'register'">

            <input
              v-model="authForm.slug"
              placeholder="slug-da-empresa"
            />

            <input
              v-model="authForm.numeroWhatsApp"
              required
              placeholder="WhatsApp"
            />

            <textarea
              v-model="authForm.description"
              placeholder="Descrição"
            />

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

    <section v-if="currentView === 'dashboard' && user"class="workspace">

      <aside
      v-if="user"
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

      <nav class="sidebar-nav">

        <button
          type="button"
          class="sidebar-item"
          :class="{
            active: dashboardTab === 'products'
          }"
          @click="dashboardTab = 'products'"
        >
          📦 Produtos
        </button>

        <button
          type="button"
          class="sidebar-item"
          :class="{
            active: dashboardTab === 'company'
          }"
          @click="dashboardTab = 'company'"
        >
          🏢 Minha Empresa
        </button>

      <button
        type="button"
        class="sidebar-item"
        :class="{
          active: dashboardTab === 'analytics'
        }"
        @click="
          dashboardTab = 'analytics';
          loadAnalytics();
        "
      >
        📈 Analytics
      </button>

      </nav>

      <nav class="sidebar-nav smart-agends-nav">
        <button
          type="button"
          class="sidebar-item"
          :class="{ active: dashboardTab === 'services' }"
          @click="dashboardTab = 'services'; loadServices()"
        >
          Servicos
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
        
      <section v-if="user"class="main-panel">
        <div class="dashboard-header">

        <div>
          <p class="eyebrow">
            Smart Links
          </p>

          <h1 class="dashboard-title">
          {{
            dashboardTab === 'products'
              ? 'Produtos'
              : dashboardTab === 'analytics'
                ? 'Analytics'
                : dashboardTab === 'services'
                  ? 'ServiÃ§os'
                  : dashboardTab === 'availability'
                    ? 'Disponibilidade'
                    : dashboardTab === 'agenda'
                      ? 'Agenda'
                      : 'Minha Empresa'
          }}
          </h1>

          <p class="dashboard-subtitle">
          {{
            dashboardTab === 'products'
              ? 'Gerencie seu catálogo e publique novos produtos.'
              : dashboardTab === 'analytics'
                ? 'Acompanhe o desempenho dos seus produtos.'
                : dashboardTab === 'services'
                  ? 'Gerencie os servicos oferecidos pela empresa.'
                  : dashboardTab === 'availability'
                    ? 'Defina os dias e horarios de atendimento.'
                    : dashboardTab === 'agenda'
                      ? 'Acompanhe e gerencie seus agendamentos.'
                      : 'Gerencie as informações da sua empresa.'
          }}
          </p>
        </div>

        <div class="dashboard-counter">
        {{
          dashboardTab === 'products'
            ? `${products.length} produtos`
            : dashboardTab === 'analytics'
              ? `${monitoredProducts} produtos`
              : dashboardTab === 'services'
                ? `${services.length} serviÃ§os`
                : dashboardTab === 'availability'
                  ? `${availability.length} horarios`
                  : dashboardTab === 'agenda'
                    ? `${appointments.length} agendamentos`
                    : 'Perfil'
        }}
        </div>

      </div>

        <form
          v-if="user && dashboardTab === 'products'"
          class="product-form"
          @submit.prevent="createProduct"
        >          <input v-model="productForm.name" required placeholder="Nome do produto" />
          <input v-model="productForm.slug" placeholder="slug-do-produto" />
          <input v-model.number="productForm.price" required type="number" min="0" step="0.01" placeholder="Preco" />
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

          <input v-model="productForm.image" placeholder="URL da imagem" />
          <input v-model="productForm.colorValues" placeholder="Cores: Preto, Branco" />
          <input v-model="productForm.sizeValues" placeholder="Tamanhos: P, M, G" />
          <textarea v-model="productForm.description" placeholder="Descricao" />
          <button class="primary-button" type="submit" :disabled="loading">Criar produto</button>
        </form>

          <div
            v-if="dashboardTab === 'products'"
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
                    <h4>Produtos Relacionados</h4>

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
                        @click="toggleRelatedProduct(candidate.id)"
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
          v-if="dashboardTab === 'analytics'"
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
          v-if="dashboardTab === 'services'"
          class="services-dashboard"
        >
          <form
            class="product-form"
            @submit.prevent="saveService"
          >
            <input
              v-model="serviceForm.name"
              required
              placeholder="Nome do serviÃ§o"
            />

            <input
              v-model.number="serviceForm.duration"
              required
              type="number"
              min="1"
              placeholder="DuraÃ§Ã£o em minutos"
            />

            <input
              v-model.number="serviceForm.price"
              required
              type="number"
              min="0"
              step="0.01"
              placeholder="PreÃ§o"
            />

            <label class="service-active-toggle">
              <input
                v-model="serviceForm.active"
                type="checkbox"
              />
              <span>Ativo</span>
            </label>

            <label class="logo-upload product-image-upload">
              <span>Imagem do serviÃ§o</span>
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

            <textarea
              v-model="serviceForm.description"
              placeholder="DescriÃ§Ã£o"
            />

            <button
              class="primary-button"
              type="submit"
              :disabled="loading"
            >
              {{ editingServiceId ? 'Salvar serviÃ§o' : 'Criar serviÃ§o' }}
            </button>

            <button
              v-if="editingServiceId"
              class="ghost-button"
              type="button"
              @click="resetServiceForm"
            >
              Cancelar ediÃ§Ã£o
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
              Nenhum serviÃ§o cadastrado.
            </p>
          </div>
        </div>

        <div
          v-if="dashboardTab === 'availability'"
          class="availability-dashboard"
        >
          <form
            class="availability-form"
            @submit.prevent="saveAvailability"
          >
            <select v-model="availabilityForm.weekday">
              <option
                v-for="weekday in weekdayOptions"
                :key="weekday.value"
                :value="weekday.value"
              >
                {{ weekday.label }}
              </option>
            </select>

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
              Nenhum horario cadastrado.
            </p>
          </div>
        </div>

        <div
          v-if="dashboardTab === 'agenda'"
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
            <input
                v-model="companyForm.name"
                placeholder="Nome da empresa"
              />

              <textarea
                v-model="companyForm.description"
                placeholder="Descrição"
              />

              <input
                v-model="companyForm.instagram"
                placeholder="Instagram"
              />

              <div class="settings-divider"></div>
                <div class="settings-section">
                  <h3>Contato</h3>
                </div>
              <input
                v-model="companyForm.telefone"
                placeholder="Telefone"
              />

              <input
                v-model="companyForm.numeroWhatsApp"
                placeholder="WhatsApp"
              />

              <input
                v-model="companyForm.endereco"
                placeholder="Endereço"
              />

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

                <input
                  v-model="companyForm.heroImage"
                  placeholder="URL do Banner"
                />
              </label>

              <input
                v-model="companyForm.logo"
                placeholder="URL da Logo"
              />

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
            <h2>ServiÃ§os</h2>
            <p class="muted">
              Fale no WhatsApp para agendar ou tirar dÃºvidas.
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
              <span>Horario</span>
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

            <input
              v-model="appointmentForm.customerName"
              required
              placeholder="Seu nome"
            />

            <input
              v-model="appointmentForm.customerPhone"
              required
              placeholder="Seu WhatsApp"
            />

            <p
              v-if="appointmentForm.date && !availableAppointmentTimes.length"
              class="muted"
            >
              Nao ha horarios disponiveis para esta data.
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
