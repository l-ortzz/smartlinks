import { ref, computed, watch, onMounted, nextTick, } from "vue";
import { api, clearToken, getToken, setToken, } from "./api";
import { formatCurrency, slugify, } from "./format";
function goToDashboard() { window.location.hash = "#/dashboard"; }
function scrollToBenefits() {
    document
        .getElementById("beneficios")
        ?.scrollIntoView({
        behavior: "smooth",
    });
}
const weekdayOptions = [
    { value: "MONDAY", label: "Segunda-feira" },
    { value: "TUESDAY", label: "Terca-feira" },
    { value: "WEDNESDAY", label: "Quarta-feira" },
    { value: "THURSDAY", label: "Quinta-feira" },
    { value: "FRIDAY", label: "Sexta-feira" },
    { value: "SATURDAY", label: "Sabado" },
    { value: "SUNDAY", label: "Domingo" },
];
const weekdayByDayIndex = [
    "SUNDAY",
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY",
];
const route = ref(window.location.hash || "#/");
const user = ref(null);
const products = ref([]);
const services = ref([]);
const availability = ref([]);
const appointments = ref([]);
const analytics = ref([]);
const company = ref(null);
const publicProduct = ref(null);
const loading = ref(false);
const uploadingLogo = ref(false);
const uploadingProductImages = ref(false);
const error = ref("");
const notice = ref("");
const authMode = ref("login");
const dashboardTab = ref("dashboard");
const selectedModule = ref(null);
const showOnboarding = ref(false);
const onboardingStorageKey = "smartlinks:onboarding-dismissed";
const selectedProductId = ref("");
const editingProductId = ref("");
const relatedSelection = ref([]);
const productSearch = ref("");
const editingServiceId = ref("");
const editingAvailabilityId = ref("");
const selectedServiceId = ref("");
const subscription = ref(null);
const subscriptionPayment = ref(null);
let subscriptionPolling = null;
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
    images: [],
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
    weekday: "MONDAY",
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
    billingType: "PIX",
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
};
const currentDashboardSection = computed(() => dashboardSections[dashboardTab.value]);
const currentDashboardCounter = computed(() => {
    const counter = currentDashboardSection.value.counter;
    return typeof counter === "function" ? counter() : counter;
});
const isSubscriptionActive = computed(() => subscription.value?.status === "ACTIVE");
const needsModuleChoice = computed(() => Boolean(user.value) &&
    isSubscriptionActive.value &&
    !selectedModule.value);
const canShowDashboardWorkspace = computed(() => Boolean(user.value) &&
    !needsModuleChoice.value);
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
const showPagesContent = computed(() => selectedModule.value === "PAGES");
const showAgendsContent = computed(() => selectedModule.value === "AGENDS");
const pagesTabs = [
    "dashboard",
    "products",
    "company",
    "analytics",
    "settings",
];
const agendsTabs = [
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
    const allowedTabs = selectedModule.value === "PAGES"
        ? pagesTabs
        : agendsTabs;
    if (!allowedTabs.includes(dashboardTab.value)) {
        dashboardTab.value = "dashboard";
    }
}
watch([user, subscription, selectedModule], normalizeDashboardTab);
window.addEventListener("hashchange", () => {
    route.value = window.location.hash || "#/";
    loadRoute();
});
const currentView = computed(() => {
    if (route.value === "#" ||
        route.value === "#/" ||
        route.value === "") {
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
    if (!company.value)
        return [];
    const search = productSearch.value
        .toLowerCase()
        .trim();
    if (!search) {
        return company.value.products;
    }
    return company.value.products.filter((product) => product.name
        .toLowerCase()
        .includes(search));
});
const totalClicks = computed(() => analytics.value.reduce((sum, item) => sum + item.clicks, 0));
const totalReservations = computed(() => analytics.value.reduce((sum, item) => sum + item.reservations, 0));
const monitoredProducts = computed(() => analytics.value.length);
const appointmentFormRef = ref(null);
const selectedPublicService = computed(() => company.value?.services?.find((service) => service.id === selectedServiceId.value));
const availableAppointmentTimes = computed(() => {
    const service = selectedPublicService.value;
    const date = appointmentForm.value.date;
    if (!service || !date)
        return [];
    const weekday = weekdayByDayIndex[new Date(`${date}T12:00:00`).getDay()];
    const blocks = company.value?.availability?.filter((item) => item.active && item.weekday === weekday) ?? [];
    const times = new Set();
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
    return appointments.value.filter((appointment) => toLocalDateKey(new Date(appointment.date)) === today);
});
const upcomingAppointments = computed(() => {
    const today = toLocalDateKey(new Date());
    return appointments.value.filter((appointment) => toLocalDateKey(new Date(appointment.date)) > today);
});
function toLocalDateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}
function formatAppointmentDate(value) {
    return new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "short",
        timeStyle: "short",
    }).format(new Date(value));
}
function weekdayLabel(weekday) {
    return weekdayOptions.find((item) => item.value === weekday)?.label ?? weekday;
}
function showError(message) {
    error.value = message;
    notice.value = "";
}
function showNotice(message) {
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
async function selectModule(module) {
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
    }
    catch (err) {
        showError(err instanceof Error
            ? err.message
            : "Nao foi possivel salvar o modulo.");
    }
    finally {
        loading.value = false;
    }
}
async function loadSession() {
    if (!getToken())
        return;
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
    }
    catch {
        clearToken();
        user.value = null;
    }
}
async function submitAuth() {
    loading.value = true;
    error.value = "";
    try {
        const session = authMode.value === "login"
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
    }
    catch (err) {
        showError(err instanceof Error ? err.message : "Nao foi possivel autenticar.");
    }
    finally {
        loading.value = false;
    }
}
async function loadProducts() {
    if (!user.value)
        return;
    products.value = await api.listProducts();
}
async function loadServices() {
    if (!user.value)
        return;
    services.value = await api.listServices();
}
async function loadAvailability() {
    if (!user.value)
        return;
    availability.value = await api.listAvailability();
}
async function loadAppointments() {
    if (!user.value)
        return;
    appointments.value = await api.listAppointments();
}
async function loadSubscription() {
    try {
        const result = await api.getSubscription();
        subscription.value = result;
        if (result.paymentMethod) {
            subscriptionForm.value.billingType = result.paymentMethod;
        }
    }
    catch (err) {
        showError(err instanceof Error
            ? err.message
            : "Nao foi possivel carregar a assinatura.");
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
    }
    catch (err) {
        showError(err instanceof Error
            ? err.message
            : "Nao foi possivel gerar a cobranca.");
    }
    finally {
        loading.value = false;
    }
}
async function copyPaymentCode(value) {
    try {
        await navigator.clipboard.writeText(value);
        showNotice("Codigo copiado.");
    }
    catch {
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
        clearInterval(subscriptionPolling);
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
    if (!user.value)
        return;
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
    }
    catch (err) {
        showError(err instanceof Error
            ? err.message
            : "Nao foi possivel atualizar a empresa.");
    }
    finally {
        loading.value = false;
    }
}
async function uploadCompanyLogo(event) {
    const input = event.target;
    const file = input.files?.[0];
    if (!file)
        return;
    uploadingLogo.value = true;
    try {
        const result = await api.uploadLogo(file);
        companyForm.value.logo = result.url;
        await api.updateProfile({
            logo: result.url,
        });
        showNotice("Logo atualizada.");
    }
    catch (err) {
        showError(err instanceof Error
            ? err.message
            : "Nao foi possivel enviar a logo.");
    }
    finally {
        uploadingLogo.value = false;
        input.value = "";
    }
}
async function uploadCompanyHero(event) {
    const input = event.target;
    const file = input.files?.[0];
    if (!file)
        return;
    uploadingLogo.value = true;
    try {
        const result = await api.uploadLogo(file);
        companyForm.value.heroImage = result.url;
        await api.updateProfile({
            heroImage: result.url,
        });
        showNotice("Banner atualizado.");
    }
    catch (err) {
        showError(err instanceof Error
            ? err.message
            : "Nao foi possivel enviar o banner.");
    }
    finally {
        uploadingLogo.value = false;
        input.value = "";
    }
}
async function uploadProductImages(event) {
    const input = event.target;
    const selectedFiles = Array.from(input.files ?? []);
    if (!selectedFiles.length)
        return;
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
    }
    catch (err) {
        showError(err instanceof Error
            ? err.message
            : "Nao foi possivel enviar as imagens.");
    }
    finally {
        uploadingProductImages.value = false;
        input.value = "";
    }
}
function removeProductImage(index) {
    productForm.value.images.splice(index, 1);
}
function parseValues(value) {
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
function editProduct(product) {
    editingProductId.value = product.id;
    productForm.value = {
        name: product.name,
        slug: product.slug,
        description: product.description ?? "",
        price: Number(product.price),
        image: "",
        images: product.images ?? [],
        colorValues: product.attributes
            ?.find((attribute) => attribute.name === "Cor")
            ?.values.map((value) => value.value)
            .join(", ") ?? "",
        sizeValues: product.attributes
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
        }
        else {
            await api.createProduct(input);
        }
        resetProductForm();
        await loadProducts();
        showNotice(wasEditing ? "Produto atualizado." : "Produto criado.");
    }
    catch (err) {
        showError(err instanceof Error ? err.message : "Nao foi possivel salvar o produto.");
    }
    finally {
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
function editService(service) {
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
async function uploadServiceImage(event) {
    const input = event.target;
    const file = input.files?.[0];
    if (!file)
        return;
    uploadingProductImages.value = true;
    try {
        const result = await api.uploadProductImages([file]);
        serviceForm.value.image = result.urls[0] ?? "";
        showNotice("Imagem do serviÃ§o enviada.");
    }
    catch (err) {
        showError(err instanceof Error
            ? err.message
            : "Nao foi possivel enviar a imagem do serviço.");
    }
    finally {
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
        }
        else {
            await api.createService(input);
            showNotice("Serviço criado.");
        }
        resetServiceForm();
        await loadServices();
    }
    catch (err) {
        showError(err instanceof Error
            ? err.message
            : "Nao foi possivel salvar o serviço.");
    }
    finally {
        loading.value = false;
    }
}
async function removeService(serviceId) {
    loading.value = true;
    try {
        await api.deleteService(serviceId);
        await loadServices();
        showNotice("Serviço excluido.");
    }
    catch (err) {
        showError(err instanceof Error
            ? err.message
            : "Nao foi possivel excluir o serviço.");
    }
    finally {
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
function editAvailability(item) {
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
        }
        else {
            await api.createAvailability(input);
            showNotice("Disponibilidade criada.");
        }
        resetAvailabilityForm();
        await loadAvailability();
    }
    catch (err) {
        showError(err instanceof Error
            ? err.message
            : "Nao foi possivel salvar a disponibilidade.");
    }
    finally {
        loading.value = false;
    }
}
async function removeAvailability(id) {
    loading.value = true;
    try {
        await api.deleteAvailability(id);
        await loadAvailability();
        showNotice("Disponibilidade excluida.");
    }
    catch (err) {
        showError(err instanceof Error
            ? err.message
            : "Nao foi possivel excluir a disponibilidade.");
    }
    finally {
        loading.value = false;
    }
}
function selectServiceForAppointment(serviceId) {
    selectedServiceId.value = serviceId;
    nextTick(() => {
        appointmentFormRef.value?.scrollIntoView({
            behavior: "smooth",
            block: "start",
        });
    });
}
async function createPublicAppointment() {
    if (!company.value || !selectedServiceId.value)
        return;
    loading.value = true;
    try {
        const date = new Date(`${appointmentForm.value.date}T${appointmentForm.value.time}:00`);
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
    }
    catch (err) {
        showError(err instanceof Error
            ? err.message
            : "Nao foi possivel criar o agendamento.");
    }
    finally {
        loading.value = false;
    }
}
async function changeAppointmentStatus(id, status) {
    loading.value = true;
    try {
        await api.updateAppointmentStatus(id, status);
        await loadAppointments();
        showNotice("Status do agendamento atualizado.");
    }
    catch (err) {
        showError(err instanceof Error
            ? err.message
            : "Nao foi possivel atualizar o agendamento.");
    }
    finally {
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
    if (!publicProduct.value)
        return;
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
    }
    catch (err) {
        showError(err instanceof Error ? err.message : "Nao foi possivel reservar.");
    }
    finally {
        loading.value = false;
    }
}
function logout() {
    clearToken();
    user.value = null;
    products.value = [];
    selectedModule.value = null;
}
async function copyProductLink(productSlug) {
    try {
        const url = `${window.location.origin}/#/produto/${productSlug}`;
        await navigator.clipboard.writeText(url);
        showNotice("Link copiado.");
    }
    catch {
        showError("Nao foi possivel copiar o link.");
    }
}
function openRelatedProducts(product) {
    if (selectedProductId.value === product.id) {
        selectedProductId.value = "";
        relatedSelection.value = [];
        return;
    }
    selectedProductId.value = product.id;
    relatedSelection.value =
        product.relatedFrom?.map((item) => item.related.id) ?? [];
}
async function saveRelatedProducts() {
    if (!selectedProductId.value)
        return;
    try {
        await api.updateRelatedProducts(selectedProductId.value, relatedSelection.value);
        showNotice("Relacionamentos atualizados.");
        selectedProductId.value = "";
        relatedSelection.value = [];
        await loadProducts();
        await loadProducts();
    }
    catch {
        showError("Nao foi possivel salvar os relacionamentos.");
    }
}
onMounted(async () => {
    await loadSession();
    await loadRoute();
    if (dashboardTab.value === "subscription" &&
        subscription.value?.status === "PENDING") {
        startSubscriptionPolling();
    }
});
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
__VLS_asFunctionalElement1(__VLS_intrinsics.main, __VLS_intrinsics.main)({
    ...{ class: "app-shell" },
});
/** @type {__VLS_StyleScopedClasses['app-shell']} */ ;
if (__VLS_ctx.currentView !== 'landing') {
    __VLS_asFunctionalElement1(__VLS_intrinsics.header, __VLS_intrinsics.header)({
        ...{ class: "topbar" },
    });
    /** @type {__VLS_StyleScopedClasses['topbar']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.a, __VLS_intrinsics.a)({
        ...{ class: "brand" },
        href: "#/dashboard",
    });
    /** @type {__VLS_StyleScopedClasses['brand']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "brand-mark" },
    });
    /** @type {__VLS_StyleScopedClasses['brand-mark']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.nav, __VLS_intrinsics.nav)({
        ...{ class: "nav-links" },
    });
    /** @type {__VLS_StyleScopedClasses['nav-links']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.a, __VLS_intrinsics.a)({
        href: "#/dashboard",
    });
    if (__VLS_ctx.user) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.a, __VLS_intrinsics.a)({
            href: (__VLS_ctx.publicCompanyUrl),
        });
    }
    if (__VLS_ctx.user) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (__VLS_ctx.logout) },
            ...{ class: "ghost-button" },
            type: "button",
        });
        /** @type {__VLS_StyleScopedClasses['ghost-button']} */ ;
    }
}
if (__VLS_ctx.error) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "feedback error" },
    });
    /** @type {__VLS_StyleScopedClasses['feedback']} */ ;
    /** @type {__VLS_StyleScopedClasses['error']} */ ;
    (__VLS_ctx.error);
}
if (__VLS_ctx.notice) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "feedback success" },
    });
    /** @type {__VLS_StyleScopedClasses['feedback']} */ ;
    /** @type {__VLS_StyleScopedClasses['success']} */ ;
    (__VLS_ctx.notice);
}
if (__VLS_ctx.currentView === 'landing') {
    __VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
        ...{ class: "landing-page" },
    });
    /** @type {__VLS_StyleScopedClasses['landing-page']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.header, __VLS_intrinsics.header)({
        ...{ class: "landing-navbar" },
    });
    /** @type {__VLS_StyleScopedClasses['landing-navbar']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "landing-logo" },
    });
    /** @type {__VLS_StyleScopedClasses['landing-logo']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "brand-mark" },
    });
    /** @type {__VLS_StyleScopedClasses['brand-mark']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.nav, __VLS_intrinsics.nav)({
        ...{ class: "landing-menu" },
    });
    /** @type {__VLS_StyleScopedClasses['landing-menu']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.a, __VLS_intrinsics.a)({
        href: "#beneficios",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.a, __VLS_intrinsics.a)({
        href: "#como-funciona",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.a, __VLS_intrinsics.a)({
        href: "#modulos",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.goToDashboard) },
        ...{ class: "primary-button" },
    });
    /** @type {__VLS_StyleScopedClasses['primary-button']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
        ...{ class: "landing-hero" },
    });
    /** @type {__VLS_StyleScopedClasses['landing-hero']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "hero-content" },
    });
    /** @type {__VLS_StyleScopedClasses['hero-content']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "eyebrow" },
    });
    /** @type {__VLS_StyleScopedClasses['eyebrow']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h1, __VLS_intrinsics.h1)({
        ...{ class: "landing-title" },
    });
    /** @type {__VLS_StyleScopedClasses['landing-title']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "landing-subtitle" },
    });
    /** @type {__VLS_StyleScopedClasses['landing-subtitle']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "landing-actions" },
    });
    /** @type {__VLS_StyleScopedClasses['landing-actions']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.goToDashboard) },
        ...{ class: "primary-button" },
    });
    /** @type {__VLS_StyleScopedClasses['primary-button']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.scrollToBenefits) },
        ...{ class: "ghost-button" },
    });
    /** @type {__VLS_StyleScopedClasses['ghost-button']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "hero-image" },
    });
    /** @type {__VLS_StyleScopedClasses['hero-image']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.img)({
        src: "/dashboard-preview.png",
        alt: "Dashboard Smart Links",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
        id: "beneficios",
        ...{ class: "landing-benefits" },
    });
    /** @type {__VLS_StyleScopedClasses['landing-benefits']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "section-header" },
    });
    /** @type {__VLS_StyleScopedClasses['section-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "section-eyebrow" },
    });
    /** @type {__VLS_StyleScopedClasses['section-eyebrow']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({
        ...{ class: "section-title" },
    });
    /** @type {__VLS_StyleScopedClasses['section-title']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.img)({
        ...{ class: "benefits-image" },
        src: "/benefits-grid.png",
        alt: "Benefícios Smart Links",
    });
    /** @type {__VLS_StyleScopedClasses['benefits-image']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
        id: "como-funciona",
        ...{ class: "landing-steps" },
    });
    /** @type {__VLS_StyleScopedClasses['landing-steps']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "section-eyebrow" },
    });
    /** @type {__VLS_StyleScopedClasses['section-eyebrow']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({
        ...{ class: "section-title" },
    });
    /** @type {__VLS_StyleScopedClasses['section-title']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.img)({
        ...{ class: "steps-image" },
        src: "/steps-grid.png",
        alt: "Passos Smart Links",
    });
    /** @type {__VLS_StyleScopedClasses['steps-image']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
        id: "modulos",
        ...{ class: "landing-modules" },
    });
    /** @type {__VLS_StyleScopedClasses['landing-modules']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "module-item" },
    });
    /** @type {__VLS_StyleScopedClasses['module-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "module-info" },
    });
    /** @type {__VLS_StyleScopedClasses['module-info']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "section-eyebrow" },
    });
    /** @type {__VLS_StyleScopedClasses['section-eyebrow']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({
        ...{ class: "section-title" },
    });
    /** @type {__VLS_StyleScopedClasses['section-title']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.goToDashboard) },
        ...{ class: "primary-button" },
    });
    /** @type {__VLS_StyleScopedClasses['primary-button']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.img)({
        src: "/smart-pages.png",
        alt: "Smart Pages",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "module-item" },
    });
    /** @type {__VLS_StyleScopedClasses['module-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "module-info" },
    });
    /** @type {__VLS_StyleScopedClasses['module-info']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "section-eyebrow" },
    });
    /** @type {__VLS_StyleScopedClasses['section-eyebrow']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({
        ...{ class: "section-title" },
    });
    /** @type {__VLS_StyleScopedClasses['section-title']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.goToDashboard) },
        ...{ class: "primary-button" },
    });
    /** @type {__VLS_StyleScopedClasses['primary-button']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.img)({
        src: "/smart-agends.png",
        alt: "Smart Agends",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
        ...{ class: "landing-faq" },
    });
    /** @type {__VLS_StyleScopedClasses['landing-faq']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "faq-item" },
    });
    /** @type {__VLS_StyleScopedClasses['faq-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "faq-item" },
    });
    /** @type {__VLS_StyleScopedClasses['faq-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "faq-item" },
    });
    /** @type {__VLS_StyleScopedClasses['faq-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "faq-item" },
    });
    /** @type {__VLS_StyleScopedClasses['faq-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
        ...{ class: "landing-cta" },
    });
    /** @type {__VLS_StyleScopedClasses['landing-cta']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "cta-box" },
    });
    /** @type {__VLS_StyleScopedClasses['cta-box']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "section-eyebrow" },
    });
    /** @type {__VLS_StyleScopedClasses['section-eyebrow']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.goToDashboard) },
        ...{ class: "primary-button" },
    });
    /** @type {__VLS_StyleScopedClasses['primary-button']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.footer, __VLS_intrinsics.footer)({
        ...{ class: "landing-footer" },
    });
    /** @type {__VLS_StyleScopedClasses['landing-footer']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "footer-brand" },
    });
    /** @type {__VLS_StyleScopedClasses['footer-brand']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "landing-logo" },
    });
    /** @type {__VLS_StyleScopedClasses['landing-logo']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "brand-mark" },
    });
    /** @type {__VLS_StyleScopedClasses['brand-mark']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "footer-links" },
    });
    /** @type {__VLS_StyleScopedClasses['footer-links']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.h4, __VLS_intrinsics.h4)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.a, __VLS_intrinsics.a)({
        href: "#beneficios",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.a, __VLS_intrinsics.a)({
        href: "#como-funciona",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.a, __VLS_intrinsics.a)({
        href: "#modulos",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.h4, __VLS_intrinsics.h4)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.a, __VLS_intrinsics.a)({
        href: "#",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.a, __VLS_intrinsics.a)({
        href: "#",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "footer-copy" },
    });
    /** @type {__VLS_StyleScopedClasses['footer-copy']} */ ;
}
if (__VLS_ctx.currentView === 'dashboard' && !__VLS_ctx.user) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
        ...{ class: "auth-page" },
    });
    /** @type {__VLS_StyleScopedClasses['auth-page']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
        ...{ class: "auth-card" },
    });
    /** @type {__VLS_StyleScopedClasses['auth-card']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "eyebrow" },
    });
    /** @type {__VLS_StyleScopedClasses['eyebrow']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h1, __VLS_intrinsics.h1)({});
    (__VLS_ctx.authMode === 'login'
        ? 'Entrar'
        : 'Criar conta');
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "muted" },
    });
    /** @type {__VLS_StyleScopedClasses['muted']} */ ;
    (__VLS_ctx.authMode === 'login'
        ? 'Acesse sua vitrine.'
        : 'Crie sua empresa.');
    __VLS_asFunctionalElement1(__VLS_intrinsics.form, __VLS_intrinsics.form)({
        ...{ onSubmit: (__VLS_ctx.submitAuth) },
        ...{ class: "form-grid" },
    });
    /** @type {__VLS_StyleScopedClasses['form-grid']} */ ;
    if (__VLS_ctx.authMode === 'register') {
        __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
            ...{ class: "form-field" },
        });
        /** @type {__VLS_StyleScopedClasses['form-field']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            required: true,
            placeholder: "Nome da empresa",
        });
        (__VLS_ctx.authForm.name);
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        ...{ class: "form-field" },
    });
    /** @type {__VLS_StyleScopedClasses['form-field']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        required: true,
        type: "email",
        placeholder: "Email",
    });
    (__VLS_ctx.authForm.email);
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        ...{ class: "form-field" },
    });
    /** @type {__VLS_StyleScopedClasses['form-field']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        required: true,
        type: "password",
        placeholder: "Senha",
    });
    (__VLS_ctx.authForm.password);
    if (__VLS_ctx.authMode === 'register') {
        __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
            ...{ class: "form-field" },
        });
        /** @type {__VLS_StyleScopedClasses['form-field']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            placeholder: "slug-da-empresa",
        });
        (__VLS_ctx.authForm.slug);
        __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
            ...{ class: "form-field" },
        });
        /** @type {__VLS_StyleScopedClasses['form-field']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            required: true,
            placeholder: "WhatsApp",
        });
        (__VLS_ctx.authForm.numeroWhatsApp);
        __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
            ...{ class: "form-field" },
        });
        /** @type {__VLS_StyleScopedClasses['form-field']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.textarea)({
            value: (__VLS_ctx.authForm.description),
            placeholder: "Descrição",
        });
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ class: "primary-button" },
        type: "submit",
        disabled: (__VLS_ctx.loading),
    });
    /** @type {__VLS_StyleScopedClasses['primary-button']} */ ;
    (__VLS_ctx.authMode === 'login'
        ? 'Entrar'
        : 'Criar conta');
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.currentView === 'dashboard' && !__VLS_ctx.user))
                    return;
                __VLS_ctx.authMode =
                    __VLS_ctx.authMode === 'login'
                        ? 'register'
                        : 'login';
                // @ts-ignore
                [currentView, currentView, currentView, user, user, user, publicCompanyUrl, logout, error, error, notice, notice, goToDashboard, goToDashboard, goToDashboard, goToDashboard, goToDashboard, scrollToBenefits, authMode, authMode, authMode, authMode, authMode, authMode, authMode, submitAuth, authForm, authForm, authForm, authForm, authForm, authForm, loading,];
            } },
        ...{ class: "ghost-button" },
        type: "button",
    });
    /** @type {__VLS_StyleScopedClasses['ghost-button']} */ ;
    (__VLS_ctx.authMode === 'login'
        ? 'Criar conta'
        : 'Já tenho conta');
}
if (__VLS_ctx.currentView === 'dashboard' &&
    __VLS_ctx.user &&
    __VLS_ctx.isSubscriptionActive &&
    __VLS_ctx.needsModuleChoice) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
        ...{ class: "choose-module-page" },
    });
    /** @type {__VLS_StyleScopedClasses['choose-module-page']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "choose-module-header" },
    });
    /** @type {__VLS_StyleScopedClasses['choose-module-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "eyebrow" },
    });
    /** @type {__VLS_StyleScopedClasses['eyebrow']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h1, __VLS_intrinsics.h1)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "muted" },
    });
    /** @type {__VLS_StyleScopedClasses['muted']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "choose-module-grid" },
    });
    /** @type {__VLS_StyleScopedClasses['choose-module-grid']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.article, __VLS_intrinsics.article)({
        ...{ class: "choose-module-card" },
    });
    /** @type {__VLS_StyleScopedClasses['choose-module-card']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "eyebrow" },
    });
    /** @type {__VLS_StyleScopedClasses['eyebrow']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.ul, __VLS_intrinsics.ul)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.currentView === 'dashboard' &&
                    __VLS_ctx.user &&
                    __VLS_ctx.isSubscriptionActive &&
                    __VLS_ctx.needsModuleChoice))
                    return;
                __VLS_ctx.selectModule('PAGES');
                // @ts-ignore
                [currentView, user, authMode, isSubscriptionActive, needsModuleChoice, selectModule,];
            } },
        ...{ class: "primary-button" },
        type: "button",
        disabled: (__VLS_ctx.loading),
    });
    /** @type {__VLS_StyleScopedClasses['primary-button']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.article, __VLS_intrinsics.article)({
        ...{ class: "choose-module-card" },
    });
    /** @type {__VLS_StyleScopedClasses['choose-module-card']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "eyebrow" },
    });
    /** @type {__VLS_StyleScopedClasses['eyebrow']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.ul, __VLS_intrinsics.ul)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.currentView === 'dashboard' &&
                    __VLS_ctx.user &&
                    __VLS_ctx.isSubscriptionActive &&
                    __VLS_ctx.needsModuleChoice))
                    return;
                __VLS_ctx.selectModule('AGENDS');
                // @ts-ignore
                [loading, selectModule,];
            } },
        ...{ class: "primary-button" },
        type: "button",
        disabled: (__VLS_ctx.loading),
    });
    /** @type {__VLS_StyleScopedClasses['primary-button']} */ ;
}
if (__VLS_ctx.currentView === 'dashboard' && __VLS_ctx.canShowDashboardWorkspace && __VLS_ctx.showOnboarding) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
        ...{ class: "onboarding-page" },
    });
    /** @type {__VLS_StyleScopedClasses['onboarding-page']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "onboarding-content" },
    });
    /** @type {__VLS_StyleScopedClasses['onboarding-content']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "eyebrow" },
    });
    /** @type {__VLS_StyleScopedClasses['eyebrow']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h1, __VLS_intrinsics.h1)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "onboarding-subtitle" },
    });
    /** @type {__VLS_StyleScopedClasses['onboarding-subtitle']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "onboarding-steps" },
    });
    /** @type {__VLS_StyleScopedClasses['onboarding-steps']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "onboarding-step" },
    });
    /** @type {__VLS_StyleScopedClasses['onboarding-step']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "onboarding-step" },
    });
    /** @type {__VLS_StyleScopedClasses['onboarding-step']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "onboarding-step" },
    });
    /** @type {__VLS_StyleScopedClasses['onboarding-step']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.startOnboarding) },
        type: "button",
        ...{ class: "primary-button onboarding-button" },
    });
    /** @type {__VLS_StyleScopedClasses['primary-button']} */ ;
    /** @type {__VLS_StyleScopedClasses['onboarding-button']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "onboarding-note" },
    });
    /** @type {__VLS_StyleScopedClasses['onboarding-note']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "onboarding-visual" },
    });
    /** @type {__VLS_StyleScopedClasses['onboarding-visual']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.img)({
        src: "/onboarding-preview.png",
        alt: "Prévia Smart Links",
    });
}
if (__VLS_ctx.currentView === 'dashboard' && __VLS_ctx.canShowDashboardWorkspace && !__VLS_ctx.showOnboarding) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
        ...{ class: "workspace" },
        ...{ class: ({ 'workspace-single': __VLS_ctx.sidebarMode === 'none' }) },
    });
    /** @type {__VLS_StyleScopedClasses['workspace']} */ ;
    /** @type {__VLS_StyleScopedClasses['workspace-single']} */ ;
    if (__VLS_ctx.sidebarMode !== 'none') {
        __VLS_asFunctionalElement1(__VLS_intrinsics.aside, __VLS_intrinsics.aside)({
            ...{ class: "dashboard-sidebar" },
        });
        /** @type {__VLS_StyleScopedClasses['dashboard-sidebar']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "sidebar-brand" },
        });
        /** @type {__VLS_StyleScopedClasses['sidebar-brand']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "brand-mark" },
        });
        /** @type {__VLS_StyleScopedClasses['brand-mark']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
        if (__VLS_ctx.sidebarMode === 'pages') {
            __VLS_asFunctionalElement1(__VLS_intrinsics.nav, __VLS_intrinsics.nav)({
                ...{ class: "sidebar-nav" },
            });
            /** @type {__VLS_StyleScopedClasses['sidebar-nav']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (...[$event]) => {
                        if (!(__VLS_ctx.currentView === 'dashboard' && __VLS_ctx.canShowDashboardWorkspace && !__VLS_ctx.showOnboarding))
                            return;
                        if (!(__VLS_ctx.sidebarMode !== 'none'))
                            return;
                        if (!(__VLS_ctx.sidebarMode === 'pages'))
                            return;
                        __VLS_ctx.openDashboard();
                        // @ts-ignore
                        [currentView, currentView, loading, canShowDashboardWorkspace, canShowDashboardWorkspace, showOnboarding, showOnboarding, startOnboarding, sidebarMode, sidebarMode, sidebarMode, openDashboard,];
                    } },
                type: "button",
                ...{ class: "sidebar-item" },
                ...{ class: ({ active: __VLS_ctx.dashboardTab === 'dashboard' }) },
            });
            /** @type {__VLS_StyleScopedClasses['sidebar-item']} */ ;
            /** @type {__VLS_StyleScopedClasses['active']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (...[$event]) => {
                        if (!(__VLS_ctx.currentView === 'dashboard' && __VLS_ctx.canShowDashboardWorkspace && !__VLS_ctx.showOnboarding))
                            return;
                        if (!(__VLS_ctx.sidebarMode !== 'none'))
                            return;
                        if (!(__VLS_ctx.sidebarMode === 'pages'))
                            return;
                        __VLS_ctx.dashboardTab = 'products';
                        // @ts-ignore
                        [dashboardTab, dashboardTab,];
                    } },
                type: "button",
                ...{ class: "sidebar-item" },
                ...{ class: ({ active: __VLS_ctx.dashboardTab === 'products' }) },
            });
            /** @type {__VLS_StyleScopedClasses['sidebar-item']} */ ;
            /** @type {__VLS_StyleScopedClasses['active']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (...[$event]) => {
                        if (!(__VLS_ctx.currentView === 'dashboard' && __VLS_ctx.canShowDashboardWorkspace && !__VLS_ctx.showOnboarding))
                            return;
                        if (!(__VLS_ctx.sidebarMode !== 'none'))
                            return;
                        if (!(__VLS_ctx.sidebarMode === 'pages'))
                            return;
                        __VLS_ctx.dashboardTab = 'analytics';
                        __VLS_ctx.loadAnalytics();
                        // @ts-ignore
                        [dashboardTab, dashboardTab, loadAnalytics,];
                    } },
                type: "button",
                ...{ class: "sidebar-item" },
                ...{ class: ({ active: __VLS_ctx.dashboardTab === 'analytics' }) },
            });
            /** @type {__VLS_StyleScopedClasses['sidebar-item']} */ ;
            /** @type {__VLS_StyleScopedClasses['active']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (...[$event]) => {
                        if (!(__VLS_ctx.currentView === 'dashboard' && __VLS_ctx.canShowDashboardWorkspace && !__VLS_ctx.showOnboarding))
                            return;
                        if (!(__VLS_ctx.sidebarMode !== 'none'))
                            return;
                        if (!(__VLS_ctx.sidebarMode === 'pages'))
                            return;
                        __VLS_ctx.dashboardTab = 'company';
                        // @ts-ignore
                        [dashboardTab, dashboardTab,];
                    } },
                type: "button",
                ...{ class: "sidebar-item" },
                ...{ class: ({ active: __VLS_ctx.dashboardTab === 'company' }) },
            });
            /** @type {__VLS_StyleScopedClasses['sidebar-item']} */ ;
            /** @type {__VLS_StyleScopedClasses['active']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (...[$event]) => {
                        if (!(__VLS_ctx.currentView === 'dashboard' && __VLS_ctx.canShowDashboardWorkspace && !__VLS_ctx.showOnboarding))
                            return;
                        if (!(__VLS_ctx.sidebarMode !== 'none'))
                            return;
                        if (!(__VLS_ctx.sidebarMode === 'pages'))
                            return;
                        __VLS_ctx.dashboardTab = 'settings';
                        // @ts-ignore
                        [dashboardTab, dashboardTab,];
                    } },
                type: "button",
                ...{ class: "sidebar-item" },
                ...{ class: ({ active: __VLS_ctx.dashboardTab === 'settings' }) },
            });
            /** @type {__VLS_StyleScopedClasses['sidebar-item']} */ ;
            /** @type {__VLS_StyleScopedClasses['active']} */ ;
        }
        if (__VLS_ctx.sidebarMode === 'agends') {
            __VLS_asFunctionalElement1(__VLS_intrinsics.nav, __VLS_intrinsics.nav)({
                ...{ class: "sidebar-nav" },
            });
            /** @type {__VLS_StyleScopedClasses['sidebar-nav']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (...[$event]) => {
                        if (!(__VLS_ctx.currentView === 'dashboard' && __VLS_ctx.canShowDashboardWorkspace && !__VLS_ctx.showOnboarding))
                            return;
                        if (!(__VLS_ctx.sidebarMode !== 'none'))
                            return;
                        if (!(__VLS_ctx.sidebarMode === 'agends'))
                            return;
                        __VLS_ctx.openDashboard();
                        // @ts-ignore
                        [sidebarMode, openDashboard, dashboardTab,];
                    } },
                type: "button",
                ...{ class: "sidebar-item" },
                ...{ class: ({ active: __VLS_ctx.dashboardTab === 'dashboard' }) },
            });
            /** @type {__VLS_StyleScopedClasses['sidebar-item']} */ ;
            /** @type {__VLS_StyleScopedClasses['active']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (...[$event]) => {
                        if (!(__VLS_ctx.currentView === 'dashboard' && __VLS_ctx.canShowDashboardWorkspace && !__VLS_ctx.showOnboarding))
                            return;
                        if (!(__VLS_ctx.sidebarMode !== 'none'))
                            return;
                        if (!(__VLS_ctx.sidebarMode === 'agends'))
                            return;
                        __VLS_ctx.dashboardTab = 'services';
                        __VLS_ctx.loadServices();
                        // @ts-ignore
                        [dashboardTab, dashboardTab, loadServices,];
                    } },
                type: "button",
                ...{ class: "sidebar-item" },
                ...{ class: ({ active: __VLS_ctx.dashboardTab === 'services' }) },
            });
            /** @type {__VLS_StyleScopedClasses['sidebar-item']} */ ;
            /** @type {__VLS_StyleScopedClasses['active']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (...[$event]) => {
                        if (!(__VLS_ctx.currentView === 'dashboard' && __VLS_ctx.canShowDashboardWorkspace && !__VLS_ctx.showOnboarding))
                            return;
                        if (!(__VLS_ctx.sidebarMode !== 'none'))
                            return;
                        if (!(__VLS_ctx.sidebarMode === 'agends'))
                            return;
                        __VLS_ctx.dashboardTab = 'availability';
                        __VLS_ctx.loadAvailability();
                        // @ts-ignore
                        [dashboardTab, dashboardTab, loadAvailability,];
                    } },
                type: "button",
                ...{ class: "sidebar-item" },
                ...{ class: ({ active: __VLS_ctx.dashboardTab === 'availability' }) },
            });
            /** @type {__VLS_StyleScopedClasses['sidebar-item']} */ ;
            /** @type {__VLS_StyleScopedClasses['active']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (...[$event]) => {
                        if (!(__VLS_ctx.currentView === 'dashboard' && __VLS_ctx.canShowDashboardWorkspace && !__VLS_ctx.showOnboarding))
                            return;
                        if (!(__VLS_ctx.sidebarMode !== 'none'))
                            return;
                        if (!(__VLS_ctx.sidebarMode === 'agends'))
                            return;
                        __VLS_ctx.dashboardTab = 'agenda';
                        __VLS_ctx.loadAppointments();
                        // @ts-ignore
                        [dashboardTab, dashboardTab, loadAppointments,];
                    } },
                type: "button",
                ...{ class: "sidebar-item" },
                ...{ class: ({ active: __VLS_ctx.dashboardTab === 'agenda' }) },
            });
            /** @type {__VLS_StyleScopedClasses['sidebar-item']} */ ;
            /** @type {__VLS_StyleScopedClasses['active']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (...[$event]) => {
                        if (!(__VLS_ctx.currentView === 'dashboard' && __VLS_ctx.canShowDashboardWorkspace && !__VLS_ctx.showOnboarding))
                            return;
                        if (!(__VLS_ctx.sidebarMode !== 'none'))
                            return;
                        if (!(__VLS_ctx.sidebarMode === 'agends'))
                            return;
                        __VLS_ctx.dashboardTab = 'company';
                        // @ts-ignore
                        [dashboardTab, dashboardTab,];
                    } },
                type: "button",
                ...{ class: "sidebar-item" },
                ...{ class: ({ active: __VLS_ctx.dashboardTab === 'company' }) },
            });
            /** @type {__VLS_StyleScopedClasses['sidebar-item']} */ ;
            /** @type {__VLS_StyleScopedClasses['active']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (...[$event]) => {
                        if (!(__VLS_ctx.currentView === 'dashboard' && __VLS_ctx.canShowDashboardWorkspace && !__VLS_ctx.showOnboarding))
                            return;
                        if (!(__VLS_ctx.sidebarMode !== 'none'))
                            return;
                        if (!(__VLS_ctx.sidebarMode === 'agends'))
                            return;
                        __VLS_ctx.dashboardTab = 'settings';
                        // @ts-ignore
                        [dashboardTab, dashboardTab,];
                    } },
                type: "button",
                ...{ class: "sidebar-item" },
                ...{ class: ({ active: __VLS_ctx.dashboardTab === 'settings' }) },
            });
            /** @type {__VLS_StyleScopedClasses['sidebar-item']} */ ;
            /** @type {__VLS_StyleScopedClasses['active']} */ ;
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "sidebar-footer" },
        });
        /** @type {__VLS_StyleScopedClasses['sidebar-footer']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "eyebrow" },
        });
        /** @type {__VLS_StyleScopedClasses['eyebrow']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.a, __VLS_intrinsics.a)({
            ...{ class: "primary-link" },
            href: (__VLS_ctx.publicCompanyUrl),
            target: "_blank",
        });
        /** @type {__VLS_StyleScopedClasses['primary-link']} */ ;
    }
    if (__VLS_ctx.user &&
        !__VLS_ctx.needsModuleChoice) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
            ...{ class: "main-panel" },
        });
        /** @type {__VLS_StyleScopedClasses['main-panel']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "dashboard-header" },
        });
        /** @type {__VLS_StyleScopedClasses['dashboard-header']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "eyebrow" },
        });
        /** @type {__VLS_StyleScopedClasses['eyebrow']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.h1, __VLS_intrinsics.h1)({
            ...{ class: "dashboard-title" },
        });
        /** @type {__VLS_StyleScopedClasses['dashboard-title']} */ ;
        (__VLS_ctx.currentDashboardSection.title);
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "dashboard-subtitle" },
        });
        /** @type {__VLS_StyleScopedClasses['dashboard-subtitle']} */ ;
        (__VLS_ctx.currentDashboardSection.subtitle);
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "dashboard-counter" },
        });
        /** @type {__VLS_StyleScopedClasses['dashboard-counter']} */ ;
        (__VLS_ctx.currentDashboardCounter);
        if (__VLS_ctx.dashboardTab === 'dashboard' && __VLS_ctx.showPagesContent) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "analytics-cards" },
            });
            /** @type {__VLS_StyleScopedClasses['analytics-cards']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "analytics-card" },
            });
            /** @type {__VLS_StyleScopedClasses['analytics-card']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
            (__VLS_ctx.products.length);
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "analytics-card" },
            });
            /** @type {__VLS_StyleScopedClasses['analytics-card']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
            (__VLS_ctx.totalClicks);
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "analytics-card" },
            });
            /** @type {__VLS_StyleScopedClasses['analytics-card']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
            (__VLS_ctx.totalReservations);
        }
        if (__VLS_ctx.dashboardTab === 'dashboard' && __VLS_ctx.selectedModule === 'AGENDS') {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "analytics-page" },
            });
            /** @type {__VLS_StyleScopedClasses['analytics-page']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "analytics-cards" },
            });
            /** @type {__VLS_StyleScopedClasses['analytics-cards']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "analytics-card" },
            });
            /** @type {__VLS_StyleScopedClasses['analytics-card']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
            (__VLS_ctx.services.length);
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "analytics-card" },
            });
            /** @type {__VLS_StyleScopedClasses['analytics-card']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
            (__VLS_ctx.todayAppointments.length);
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "analytics-card" },
            });
            /** @type {__VLS_StyleScopedClasses['analytics-card']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
            (__VLS_ctx.availability.length);
        }
        if (__VLS_ctx.user && __VLS_ctx.dashboardTab === 'products' && __VLS_ctx.showPagesContent) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.form, __VLS_intrinsics.form)({
                ...{ onSubmit: (__VLS_ctx.createProduct) },
                ...{ class: "product-form" },
            });
            /** @type {__VLS_StyleScopedClasses['product-form']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
                ...{ class: "form-field" },
            });
            /** @type {__VLS_StyleScopedClasses['form-field']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
                required: true,
                placeholder: "Nome do produto",
            });
            (__VLS_ctx.productForm.name);
            __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
                ...{ class: "form-field" },
            });
            /** @type {__VLS_StyleScopedClasses['form-field']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
                placeholder: "slug-do-produto",
            });
            (__VLS_ctx.productForm.slug);
            __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
                ...{ class: "form-field" },
            });
            /** @type {__VLS_StyleScopedClasses['form-field']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
                required: true,
                type: "number",
                min: "0",
                step: "0.01",
                placeholder: "Preco",
            });
            (__VLS_ctx.productForm.price);
            __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
                ...{ class: "logo-upload product-image-upload" },
            });
            /** @type {__VLS_StyleScopedClasses['logo-upload']} */ ;
            /** @type {__VLS_StyleScopedClasses['product-image-upload']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
                ...{ onChange: (__VLS_ctx.uploadProductImages) },
                type: "file",
                multiple: true,
                accept: ".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp",
                disabled: (__VLS_ctx.uploadingProductImages || __VLS_ctx.productForm.images.length >= 5),
            });
            if (__VLS_ctx.productForm.images.length) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "product-image-preview-grid" },
                });
                /** @type {__VLS_StyleScopedClasses['product-image-preview-grid']} */ ;
                for (const [image, index] of __VLS_vFor((__VLS_ctx.productForm.images))) {
                    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                        key: (image),
                        ...{ class: "product-image-preview" },
                    });
                    /** @type {__VLS_StyleScopedClasses['product-image-preview']} */ ;
                    __VLS_asFunctionalElement1(__VLS_intrinsics.img)({
                        src: (image),
                        alt: "",
                    });
                    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                        ...{ onClick: (...[$event]) => {
                                if (!(__VLS_ctx.currentView === 'dashboard' && __VLS_ctx.canShowDashboardWorkspace && !__VLS_ctx.showOnboarding))
                                    return;
                                if (!(__VLS_ctx.user &&
                                    !__VLS_ctx.needsModuleChoice))
                                    return;
                                if (!(__VLS_ctx.user && __VLS_ctx.dashboardTab === 'products' && __VLS_ctx.showPagesContent))
                                    return;
                                if (!(__VLS_ctx.productForm.images.length))
                                    return;
                                __VLS_ctx.removeProductImage(index);
                                // @ts-ignore
                                [user, user, publicCompanyUrl, needsModuleChoice, dashboardTab, dashboardTab, dashboardTab, dashboardTab, currentDashboardSection, currentDashboardSection, currentDashboardCounter, showPagesContent, showPagesContent, products, totalClicks, totalReservations, selectedModule, services, todayAppointments, availability, createProduct, productForm, productForm, productForm, productForm, productForm, productForm, uploadProductImages, uploadingProductImages, removeProductImage,];
                            } },
                        type: "button",
                        ...{ class: "product-image-remove" },
                    });
                    /** @type {__VLS_StyleScopedClasses['product-image-remove']} */ ;
                    if (index === 0) {
                        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
                    }
                    // @ts-ignore
                    [];
                }
            }
            __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
                ...{ class: "form-field" },
            });
            /** @type {__VLS_StyleScopedClasses['form-field']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
                placeholder: "URL da imagem",
            });
            (__VLS_ctx.productForm.image);
            __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
                ...{ class: "form-field" },
            });
            /** @type {__VLS_StyleScopedClasses['form-field']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
                placeholder: "Cores: Preto, Branco",
            });
            (__VLS_ctx.productForm.colorValues);
            __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
                ...{ class: "form-field" },
            });
            /** @type {__VLS_StyleScopedClasses['form-field']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
                placeholder: "Tamanhos: P, M, G",
            });
            (__VLS_ctx.productForm.sizeValues);
            __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
                ...{ class: "form-field" },
            });
            /** @type {__VLS_StyleScopedClasses['form-field']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.textarea)({
                value: (__VLS_ctx.productForm.description),
                placeholder: "Descricao",
            });
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ class: "primary-button" },
                type: "submit",
                disabled: (__VLS_ctx.loading),
            });
            /** @type {__VLS_StyleScopedClasses['primary-button']} */ ;
            (__VLS_ctx.editingProductId ? 'Salvar alterações' : 'Criar produto');
            if (__VLS_ctx.editingProductId) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                    ...{ onClick: (__VLS_ctx.resetProductForm) },
                    ...{ class: "ghost-button" },
                    type: "button",
                });
                /** @type {__VLS_StyleScopedClasses['ghost-button']} */ ;
            }
        }
        if (__VLS_ctx.dashboardTab === 'products' && __VLS_ctx.showPagesContent) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "product-list" },
            });
            /** @type {__VLS_StyleScopedClasses['product-list']} */ ;
            for (const [product] of __VLS_vFor((__VLS_ctx.products))) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.article, __VLS_intrinsics.article)({
                    key: (product.id),
                    ...{ class: "product-card" },
                });
                /** @type {__VLS_StyleScopedClasses['product-card']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.img)({
                    src: (product.images?.[0] || 'https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?auto=format&fit=crop&w=900&q=80'),
                    alt: "",
                });
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "product-card-content" },
                });
                /** @type {__VLS_StyleScopedClasses['product-card-content']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
                (product.name);
                __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
                (__VLS_ctx.formatCurrency(product.price));
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "product-actions" },
                });
                /** @type {__VLS_StyleScopedClasses['product-actions']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.a, __VLS_intrinsics.a)({
                    ...{ class: "product-action-link" },
                    href: (`#/produto/${product.slug}`),
                });
                /** @type {__VLS_StyleScopedClasses['product-action-link']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                    ...{ onClick: (...[$event]) => {
                            if (!(__VLS_ctx.currentView === 'dashboard' && __VLS_ctx.canShowDashboardWorkspace && !__VLS_ctx.showOnboarding))
                                return;
                            if (!(__VLS_ctx.user &&
                                !__VLS_ctx.needsModuleChoice))
                                return;
                            if (!(__VLS_ctx.dashboardTab === 'products' && __VLS_ctx.showPagesContent))
                                return;
                            __VLS_ctx.copyProductLink(product.slug);
                            // @ts-ignore
                            [loading, dashboardTab, showPagesContent, products, productForm, productForm, productForm, productForm, editingProductId, editingProductId, resetProductForm, formatCurrency, copyProductLink,];
                        } },
                    type: "button",
                    ...{ class: "ghost-button" },
                });
                /** @type {__VLS_StyleScopedClasses['ghost-button']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                    ...{ onClick: (...[$event]) => {
                            if (!(__VLS_ctx.currentView === 'dashboard' && __VLS_ctx.canShowDashboardWorkspace && !__VLS_ctx.showOnboarding))
                                return;
                            if (!(__VLS_ctx.user &&
                                !__VLS_ctx.needsModuleChoice))
                                return;
                            if (!(__VLS_ctx.dashboardTab === 'products' && __VLS_ctx.showPagesContent))
                                return;
                            __VLS_ctx.editProduct(product);
                            // @ts-ignore
                            [editProduct,];
                        } },
                    type: "button",
                    ...{ class: "ghost-button" },
                });
                /** @type {__VLS_StyleScopedClasses['ghost-button']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                    ...{ onClick: (...[$event]) => {
                            if (!(__VLS_ctx.currentView === 'dashboard' && __VLS_ctx.canShowDashboardWorkspace && !__VLS_ctx.showOnboarding))
                                return;
                            if (!(__VLS_ctx.user &&
                                !__VLS_ctx.needsModuleChoice))
                                return;
                            if (!(__VLS_ctx.dashboardTab === 'products' && __VLS_ctx.showPagesContent))
                                return;
                            __VLS_ctx.openRelatedProducts(product);
                            // @ts-ignore
                            [openRelatedProducts,];
                        } },
                    type: "button",
                    ...{ class: "ghost-button" },
                });
                /** @type {__VLS_StyleScopedClasses['ghost-button']} */ ;
                if (__VLS_ctx.selectedProductId === product.id) {
                    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                        ...{ class: "related-products-panel" },
                    });
                    /** @type {__VLS_StyleScopedClasses['related-products-panel']} */ ;
                    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                        ...{ class: "panel-header" },
                    });
                    /** @type {__VLS_StyleScopedClasses['panel-header']} */ ;
                    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
                    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                        ...{ onClick: (...[$event]) => {
                                if (!(__VLS_ctx.currentView === 'dashboard' && __VLS_ctx.canShowDashboardWorkspace && !__VLS_ctx.showOnboarding))
                                    return;
                                if (!(__VLS_ctx.user &&
                                    !__VLS_ctx.needsModuleChoice))
                                    return;
                                if (!(__VLS_ctx.dashboardTab === 'products' && __VLS_ctx.showPagesContent))
                                    return;
                                if (!(__VLS_ctx.selectedProductId === product.id))
                                    return;
                                __VLS_ctx.selectedProductId = '';
                                __VLS_ctx.relatedSelection = [];
                                // @ts-ignore
                                [selectedProductId, selectedProductId, relatedSelection,];
                            } },
                        type: "button",
                        ...{ class: "ghost-button" },
                    });
                    /** @type {__VLS_StyleScopedClasses['ghost-button']} */ ;
                    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
                    for (const [candidate] of __VLS_vFor((__VLS_ctx.products))) {
                        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                            key: (candidate.id),
                        });
                        if (candidate.id !== product.id) {
                            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                                ...{ onClick: (...[$event]) => {
                                        if (!(__VLS_ctx.currentView === 'dashboard' && __VLS_ctx.canShowDashboardWorkspace && !__VLS_ctx.showOnboarding))
                                            return;
                                        if (!(__VLS_ctx.user &&
                                            !__VLS_ctx.needsModuleChoice))
                                            return;
                                        if (!(__VLS_ctx.dashboardTab === 'products' && __VLS_ctx.showPagesContent))
                                            return;
                                        if (!(__VLS_ctx.selectedProductId === product.id))
                                            return;
                                        if (!(candidate.id !== product.id))
                                            return;
                                        __VLS_ctx.selectedProductId = '';
                                        __VLS_ctx.relatedSelection = [];
                                        // @ts-ignore
                                        [products, selectedProductId, relatedSelection,];
                                    } },
                                ...{ class: "related-option" },
                                ...{ class: ({
                                        selected: __VLS_ctx.relatedSelection.includes(candidate.id)
                                    }) },
                            });
                            /** @type {__VLS_StyleScopedClasses['related-option']} */ ;
                            /** @type {__VLS_StyleScopedClasses['selected']} */ ;
                            __VLS_asFunctionalElement1(__VLS_intrinsics.img)({
                                src: (candidate.images?.[0] ||
                                    'https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?auto=format&fit=crop&w=900&q=80'),
                                alt: "",
                            });
                            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                                ...{ class: "related-option-content" },
                            });
                            /** @type {__VLS_StyleScopedClasses['related-option-content']} */ ;
                            __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
                            (candidate.name);
                            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
                            (__VLS_ctx.formatCurrency(candidate.price));
                            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                                ...{ class: "related-check" },
                            });
                            /** @type {__VLS_StyleScopedClasses['related-check']} */ ;
                            (__VLS_ctx.relatedSelection.includes(candidate.id)
                                ? '✓'
                                : '+');
                        }
                        // @ts-ignore
                        [formatCurrency, relatedSelection, relatedSelection,];
                    }
                    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                        ...{ class: "related-counter" },
                    });
                    /** @type {__VLS_StyleScopedClasses['related-counter']} */ ;
                    (__VLS_ctx.relatedSelection.length);
                    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                        ...{ onClick: (__VLS_ctx.saveRelatedProducts) },
                        type: "button",
                        ...{ class: "primary-button" },
                    });
                    /** @type {__VLS_StyleScopedClasses['primary-button']} */ ;
                }
                // @ts-ignore
                [relatedSelection, saveRelatedProducts,];
            }
        }
        if (__VLS_ctx.dashboardTab === 'analytics' && __VLS_ctx.showPagesContent) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "analytics-page" },
            });
            /** @type {__VLS_StyleScopedClasses['analytics-page']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "analytics-cards" },
            });
            /** @type {__VLS_StyleScopedClasses['analytics-cards']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "analytics-card" },
            });
            /** @type {__VLS_StyleScopedClasses['analytics-card']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
            (__VLS_ctx.totalClicks);
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "analytics-card" },
            });
            /** @type {__VLS_StyleScopedClasses['analytics-card']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
            (__VLS_ctx.totalReservations);
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "analytics-card" },
            });
            /** @type {__VLS_StyleScopedClasses['analytics-card']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
            (__VLS_ctx.monitoredProducts);
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "analytics-table-wrapper" },
            });
            /** @type {__VLS_StyleScopedClasses['analytics-table-wrapper']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.table, __VLS_intrinsics.table)({
                ...{ class: "analytics-table" },
            });
            /** @type {__VLS_StyleScopedClasses['analytics-table']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.thead, __VLS_intrinsics.thead)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.tbody, __VLS_intrinsics.tbody)({});
            for (const [item] of __VLS_vFor((__VLS_ctx.analytics))) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({
                    key: (item.productId),
                });
                __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
                (item.productName);
                __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
                (item.clicks);
                __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
                (item.reservations);
                // @ts-ignore
                [dashboardTab, showPagesContent, totalClicks, totalReservations, monitoredProducts, analytics,];
            }
            if (!__VLS_ctx.analytics.length) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({});
                __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                    colspan: "3",
                });
            }
        }
        if (__VLS_ctx.dashboardTab === 'services' && __VLS_ctx.showAgendsContent) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "services-dashboard" },
            });
            /** @type {__VLS_StyleScopedClasses['services-dashboard']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.form, __VLS_intrinsics.form)({
                ...{ onSubmit: (__VLS_ctx.saveService) },
                ...{ class: "product-form" },
            });
            /** @type {__VLS_StyleScopedClasses['product-form']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
                ...{ class: "form-field" },
            });
            /** @type {__VLS_StyleScopedClasses['form-field']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
                required: true,
                placeholder: "Nome do serviço",
            });
            (__VLS_ctx.serviceForm.name);
            __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
                ...{ class: "form-field" },
            });
            /** @type {__VLS_StyleScopedClasses['form-field']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
                required: true,
                type: "number",
                min: "1",
                placeholder: "Duração em minutos",
            });
            (__VLS_ctx.serviceForm.duration);
            __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
                ...{ class: "form-field" },
            });
            /** @type {__VLS_StyleScopedClasses['form-field']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
                required: true,
                type: "number",
                min: "0",
                step: "0.01",
                placeholder: "Preço",
            });
            (__VLS_ctx.serviceForm.price);
            __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
                ...{ class: "service-active-toggle" },
            });
            /** @type {__VLS_StyleScopedClasses['service-active-toggle']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
                type: "checkbox",
            });
            (__VLS_ctx.serviceForm.active);
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
                ...{ class: "logo-upload product-image-upload" },
            });
            /** @type {__VLS_StyleScopedClasses['logo-upload']} */ ;
            /** @type {__VLS_StyleScopedClasses['product-image-upload']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
                ...{ onChange: (__VLS_ctx.uploadServiceImage) },
                type: "file",
                accept: ".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp",
                disabled: (__VLS_ctx.uploadingProductImages),
            });
            if (__VLS_ctx.serviceForm.image) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "product-image-preview-grid" },
                });
                /** @type {__VLS_StyleScopedClasses['product-image-preview-grid']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "product-image-preview" },
                });
                /** @type {__VLS_StyleScopedClasses['product-image-preview']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.img)({
                    src: (__VLS_ctx.serviceForm.image),
                    alt: "",
                });
                __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                    ...{ onClick: (...[$event]) => {
                            if (!(__VLS_ctx.currentView === 'dashboard' && __VLS_ctx.canShowDashboardWorkspace && !__VLS_ctx.showOnboarding))
                                return;
                            if (!(__VLS_ctx.user &&
                                !__VLS_ctx.needsModuleChoice))
                                return;
                            if (!(__VLS_ctx.dashboardTab === 'services' && __VLS_ctx.showAgendsContent))
                                return;
                            if (!(__VLS_ctx.serviceForm.image))
                                return;
                            __VLS_ctx.serviceForm.image = '';
                            // @ts-ignore
                            [dashboardTab, uploadingProductImages, analytics, showAgendsContent, saveService, serviceForm, serviceForm, serviceForm, serviceForm, serviceForm, serviceForm, serviceForm, uploadServiceImage,];
                        } },
                    type: "button",
                    ...{ class: "product-image-remove" },
                });
                /** @type {__VLS_StyleScopedClasses['product-image-remove']} */ ;
            }
            __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
                ...{ class: "form-field" },
            });
            /** @type {__VLS_StyleScopedClasses['form-field']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.textarea)({
                value: (__VLS_ctx.serviceForm.description),
                placeholder: "Descrição",
            });
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ class: "primary-button" },
                type: "submit",
                disabled: (__VLS_ctx.loading),
            });
            /** @type {__VLS_StyleScopedClasses['primary-button']} */ ;
            (__VLS_ctx.editingServiceId ? 'Salvar serviço' : 'Criar serviço');
            if (__VLS_ctx.editingServiceId) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                    ...{ onClick: (__VLS_ctx.resetServiceForm) },
                    ...{ class: "ghost-button" },
                    type: "button",
                });
                /** @type {__VLS_StyleScopedClasses['ghost-button']} */ ;
            }
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "service-list" },
            });
            /** @type {__VLS_StyleScopedClasses['service-list']} */ ;
            for (const [service] of __VLS_vFor((__VLS_ctx.services))) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.article, __VLS_intrinsics.article)({
                    key: (service.id),
                    ...{ class: "service-card" },
                });
                /** @type {__VLS_StyleScopedClasses['service-card']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
                if (service.image) {
                    __VLS_asFunctionalElement1(__VLS_intrinsics.img)({
                        ...{ class: "service-card-image" },
                        src: (service.image),
                        alt: "",
                    });
                    /** @type {__VLS_StyleScopedClasses['service-card-image']} */ ;
                }
                __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
                (service.name);
                __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
                (service.description);
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
                (service.duration);
                (__VLS_ctx.formatCurrency(service.price));
                __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({
                    ...{ class: ({
                            inactive: !service.active
                        }) },
                });
                /** @type {__VLS_StyleScopedClasses['inactive']} */ ;
                (service.active ? 'Ativo' : 'Inativo');
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "product-actions" },
                });
                /** @type {__VLS_StyleScopedClasses['product-actions']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                    ...{ onClick: (...[$event]) => {
                            if (!(__VLS_ctx.currentView === 'dashboard' && __VLS_ctx.canShowDashboardWorkspace && !__VLS_ctx.showOnboarding))
                                return;
                            if (!(__VLS_ctx.user &&
                                !__VLS_ctx.needsModuleChoice))
                                return;
                            if (!(__VLS_ctx.dashboardTab === 'services' && __VLS_ctx.showAgendsContent))
                                return;
                            __VLS_ctx.editService(service);
                            // @ts-ignore
                            [loading, services, formatCurrency, serviceForm, editingServiceId, editingServiceId, resetServiceForm, editService,];
                        } },
                    type: "button",
                    ...{ class: "ghost-button" },
                });
                /** @type {__VLS_StyleScopedClasses['ghost-button']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                    ...{ onClick: (...[$event]) => {
                            if (!(__VLS_ctx.currentView === 'dashboard' && __VLS_ctx.canShowDashboardWorkspace && !__VLS_ctx.showOnboarding))
                                return;
                            if (!(__VLS_ctx.user &&
                                !__VLS_ctx.needsModuleChoice))
                                return;
                            if (!(__VLS_ctx.dashboardTab === 'services' && __VLS_ctx.showAgendsContent))
                                return;
                            __VLS_ctx.removeService(service.id);
                            // @ts-ignore
                            [removeService,];
                        } },
                    type: "button",
                    ...{ class: "ghost-button" },
                });
                /** @type {__VLS_StyleScopedClasses['ghost-button']} */ ;
                // @ts-ignore
                [];
            }
            if (!__VLS_ctx.services.length) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                    ...{ class: "muted" },
                });
                /** @type {__VLS_StyleScopedClasses['muted']} */ ;
            }
        }
        if (__VLS_ctx.dashboardTab === 'availability' && __VLS_ctx.showAgendsContent) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "availability-dashboard" },
            });
            /** @type {__VLS_StyleScopedClasses['availability-dashboard']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.form, __VLS_intrinsics.form)({
                ...{ onSubmit: (__VLS_ctx.saveAvailability) },
                ...{ class: "availability-form" },
            });
            /** @type {__VLS_StyleScopedClasses['availability-form']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
                ...{ class: "form-field" },
            });
            /** @type {__VLS_StyleScopedClasses['form-field']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
                value: (__VLS_ctx.availabilityForm.weekday),
            });
            for (const [weekday] of __VLS_vFor((__VLS_ctx.weekdayOptions))) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
                    key: (weekday.value),
                    value: (weekday.value),
                });
                (weekday.label);
                // @ts-ignore
                [dashboardTab, services, showAgendsContent, saveAvailability, availabilityForm, weekdayOptions,];
            }
            __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
                required: true,
                type: "time",
            });
            (__VLS_ctx.availabilityForm.startTime);
            __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
                required: true,
                type: "time",
            });
            (__VLS_ctx.availabilityForm.endTime);
            __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
                ...{ class: "service-active-toggle" },
            });
            /** @type {__VLS_StyleScopedClasses['service-active-toggle']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
                type: "checkbox",
            });
            (__VLS_ctx.availabilityForm.active);
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ class: "primary-button" },
                type: "submit",
                disabled: (__VLS_ctx.loading),
            });
            /** @type {__VLS_StyleScopedClasses['primary-button']} */ ;
            (__VLS_ctx.editingAvailabilityId ? 'Salvar horario' : 'Adicionar horario');
            if (__VLS_ctx.editingAvailabilityId) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                    ...{ onClick: (__VLS_ctx.resetAvailabilityForm) },
                    ...{ class: "ghost-button" },
                    type: "button",
                });
                /** @type {__VLS_StyleScopedClasses['ghost-button']} */ ;
            }
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "availability-list" },
            });
            /** @type {__VLS_StyleScopedClasses['availability-list']} */ ;
            for (const [item] of __VLS_vFor((__VLS_ctx.availability))) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.article, __VLS_intrinsics.article)({
                    key: (item.id),
                    ...{ class: "availability-card" },
                });
                /** @type {__VLS_StyleScopedClasses['availability-card']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
                __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
                (__VLS_ctx.weekdayLabel(item.weekday));
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
                (item.startTime);
                (item.endTime);
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: ({ inactive: !item.active }) },
                });
                /** @type {__VLS_StyleScopedClasses['inactive']} */ ;
                (item.active ? 'Ativo' : 'Inativo');
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "product-actions" },
                });
                /** @type {__VLS_StyleScopedClasses['product-actions']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                    ...{ onClick: (...[$event]) => {
                            if (!(__VLS_ctx.currentView === 'dashboard' && __VLS_ctx.canShowDashboardWorkspace && !__VLS_ctx.showOnboarding))
                                return;
                            if (!(__VLS_ctx.user &&
                                !__VLS_ctx.needsModuleChoice))
                                return;
                            if (!(__VLS_ctx.dashboardTab === 'availability' && __VLS_ctx.showAgendsContent))
                                return;
                            __VLS_ctx.editAvailability(item);
                            // @ts-ignore
                            [loading, availability, availabilityForm, availabilityForm, availabilityForm, editingAvailabilityId, editingAvailabilityId, resetAvailabilityForm, weekdayLabel, editAvailability,];
                        } },
                    type: "button",
                    ...{ class: "ghost-button" },
                });
                /** @type {__VLS_StyleScopedClasses['ghost-button']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                    ...{ onClick: (...[$event]) => {
                            if (!(__VLS_ctx.currentView === 'dashboard' && __VLS_ctx.canShowDashboardWorkspace && !__VLS_ctx.showOnboarding))
                                return;
                            if (!(__VLS_ctx.user &&
                                !__VLS_ctx.needsModuleChoice))
                                return;
                            if (!(__VLS_ctx.dashboardTab === 'availability' && __VLS_ctx.showAgendsContent))
                                return;
                            __VLS_ctx.removeAvailability(item.id);
                            // @ts-ignore
                            [removeAvailability,];
                        } },
                    type: "button",
                    ...{ class: "ghost-button" },
                });
                /** @type {__VLS_StyleScopedClasses['ghost-button']} */ ;
                // @ts-ignore
                [];
            }
            if (!__VLS_ctx.availability.length) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                    ...{ class: "muted" },
                });
                /** @type {__VLS_StyleScopedClasses['muted']} */ ;
            }
        }
        if (__VLS_ctx.dashboardTab === 'agenda' && __VLS_ctx.showAgendsContent) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "agenda-dashboard" },
            });
            /** @type {__VLS_StyleScopedClasses['agenda-dashboard']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
                ...{ class: "agenda-group" },
            });
            /** @type {__VLS_StyleScopedClasses['agenda-group']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({});
            for (const [appointment] of __VLS_vFor((__VLS_ctx.todayAppointments))) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.article, __VLS_intrinsics.article)({
                    key: (appointment.id),
                    ...{ class: "appointment-card" },
                });
                /** @type {__VLS_StyleScopedClasses['appointment-card']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
                __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
                (appointment.service.name);
                __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
                (appointment.customerName);
                (appointment.customerPhone);
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
                (__VLS_ctx.formatAppointmentDate(appointment.date));
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "appointment-status" },
                });
                /** @type {__VLS_StyleScopedClasses['appointment-status']} */ ;
                (appointment.status);
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "product-actions" },
                });
                /** @type {__VLS_StyleScopedClasses['product-actions']} */ ;
                if (!['CONFIRMED', 'COMPLETED', 'CANCELED'].includes(appointment.status)) {
                    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                        ...{ onClick: (...[$event]) => {
                                if (!(__VLS_ctx.currentView === 'dashboard' && __VLS_ctx.canShowDashboardWorkspace && !__VLS_ctx.showOnboarding))
                                    return;
                                if (!(__VLS_ctx.user &&
                                    !__VLS_ctx.needsModuleChoice))
                                    return;
                                if (!(__VLS_ctx.dashboardTab === 'agenda' && __VLS_ctx.showAgendsContent))
                                    return;
                                if (!(!['CONFIRMED', 'COMPLETED', 'CANCELED'].includes(appointment.status)))
                                    return;
                                __VLS_ctx.changeAppointmentStatus(appointment.id, 'CONFIRMED');
                                // @ts-ignore
                                [dashboardTab, todayAppointments, availability, showAgendsContent, formatAppointmentDate, changeAppointmentStatus,];
                            } },
                        type: "button",
                    });
                }
                if (!['COMPLETED', 'CANCELED'].includes(appointment.status)) {
                    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                        ...{ onClick: (...[$event]) => {
                                if (!(__VLS_ctx.currentView === 'dashboard' && __VLS_ctx.canShowDashboardWorkspace && !__VLS_ctx.showOnboarding))
                                    return;
                                if (!(__VLS_ctx.user &&
                                    !__VLS_ctx.needsModuleChoice))
                                    return;
                                if (!(__VLS_ctx.dashboardTab === 'agenda' && __VLS_ctx.showAgendsContent))
                                    return;
                                if (!(!['COMPLETED', 'CANCELED'].includes(appointment.status)))
                                    return;
                                __VLS_ctx.changeAppointmentStatus(appointment.id, 'COMPLETED');
                                // @ts-ignore
                                [changeAppointmentStatus,];
                            } },
                        type: "button",
                    });
                }
                if (!['COMPLETED', 'CANCELED'].includes(appointment.status)) {
                    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                        ...{ onClick: (...[$event]) => {
                                if (!(__VLS_ctx.currentView === 'dashboard' && __VLS_ctx.canShowDashboardWorkspace && !__VLS_ctx.showOnboarding))
                                    return;
                                if (!(__VLS_ctx.user &&
                                    !__VLS_ctx.needsModuleChoice))
                                    return;
                                if (!(__VLS_ctx.dashboardTab === 'agenda' && __VLS_ctx.showAgendsContent))
                                    return;
                                if (!(!['COMPLETED', 'CANCELED'].includes(appointment.status)))
                                    return;
                                __VLS_ctx.changeAppointmentStatus(appointment.id, 'CANCELED');
                                // @ts-ignore
                                [changeAppointmentStatus,];
                            } },
                        type: "button",
                    });
                }
                // @ts-ignore
                [];
            }
            if (!__VLS_ctx.todayAppointments.length) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                    ...{ class: "muted" },
                });
                /** @type {__VLS_StyleScopedClasses['muted']} */ ;
            }
            __VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
                ...{ class: "agenda-group" },
            });
            /** @type {__VLS_StyleScopedClasses['agenda-group']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({});
            for (const [appointment] of __VLS_vFor((__VLS_ctx.upcomingAppointments))) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.article, __VLS_intrinsics.article)({
                    key: (appointment.id),
                    ...{ class: "appointment-card" },
                });
                /** @type {__VLS_StyleScopedClasses['appointment-card']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
                __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
                (appointment.service.name);
                __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
                (appointment.customerName);
                (appointment.customerPhone);
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
                (__VLS_ctx.formatAppointmentDate(appointment.date));
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "appointment-status" },
                });
                /** @type {__VLS_StyleScopedClasses['appointment-status']} */ ;
                (appointment.status);
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "product-actions" },
                });
                /** @type {__VLS_StyleScopedClasses['product-actions']} */ ;
                if (!['CONFIRMED', 'COMPLETED', 'CANCELED'].includes(appointment.status)) {
                    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                        ...{ onClick: (...[$event]) => {
                                if (!(__VLS_ctx.currentView === 'dashboard' && __VLS_ctx.canShowDashboardWorkspace && !__VLS_ctx.showOnboarding))
                                    return;
                                if (!(__VLS_ctx.user &&
                                    !__VLS_ctx.needsModuleChoice))
                                    return;
                                if (!(__VLS_ctx.dashboardTab === 'agenda' && __VLS_ctx.showAgendsContent))
                                    return;
                                if (!(!['CONFIRMED', 'COMPLETED', 'CANCELED'].includes(appointment.status)))
                                    return;
                                __VLS_ctx.changeAppointmentStatus(appointment.id, 'CONFIRMED');
                                // @ts-ignore
                                [todayAppointments, formatAppointmentDate, changeAppointmentStatus, upcomingAppointments,];
                            } },
                        type: "button",
                    });
                }
                if (!['COMPLETED', 'CANCELED'].includes(appointment.status)) {
                    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                        ...{ onClick: (...[$event]) => {
                                if (!(__VLS_ctx.currentView === 'dashboard' && __VLS_ctx.canShowDashboardWorkspace && !__VLS_ctx.showOnboarding))
                                    return;
                                if (!(__VLS_ctx.user &&
                                    !__VLS_ctx.needsModuleChoice))
                                    return;
                                if (!(__VLS_ctx.dashboardTab === 'agenda' && __VLS_ctx.showAgendsContent))
                                    return;
                                if (!(!['COMPLETED', 'CANCELED'].includes(appointment.status)))
                                    return;
                                __VLS_ctx.changeAppointmentStatus(appointment.id, 'COMPLETED');
                                // @ts-ignore
                                [changeAppointmentStatus,];
                            } },
                        type: "button",
                    });
                }
                if (!['COMPLETED', 'CANCELED'].includes(appointment.status)) {
                    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                        ...{ onClick: (...[$event]) => {
                                if (!(__VLS_ctx.currentView === 'dashboard' && __VLS_ctx.canShowDashboardWorkspace && !__VLS_ctx.showOnboarding))
                                    return;
                                if (!(__VLS_ctx.user &&
                                    !__VLS_ctx.needsModuleChoice))
                                    return;
                                if (!(__VLS_ctx.dashboardTab === 'agenda' && __VLS_ctx.showAgendsContent))
                                    return;
                                if (!(!['COMPLETED', 'CANCELED'].includes(appointment.status)))
                                    return;
                                __VLS_ctx.changeAppointmentStatus(appointment.id, 'CANCELED');
                                // @ts-ignore
                                [changeAppointmentStatus,];
                            } },
                        type: "button",
                    });
                }
                // @ts-ignore
                [];
            }
            if (!__VLS_ctx.upcomingAppointments.length) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                    ...{ class: "muted" },
                });
                /** @type {__VLS_StyleScopedClasses['muted']} */ ;
            }
        }
        if (__VLS_ctx.dashboardTab === 'company') {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "company-settings" },
            });
            /** @type {__VLS_StyleScopedClasses['company-settings']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "company-profile-header" },
            });
            /** @type {__VLS_StyleScopedClasses['company-profile-header']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "company-avatar-preview" },
            });
            /** @type {__VLS_StyleScopedClasses['company-avatar-preview']} */ ;
            if (__VLS_ctx.companyForm.logo) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.img)({
                    src: (__VLS_ctx.companyForm.logo),
                    alt: "",
                });
            }
            else {
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
                ((__VLS_ctx.companyForm.name || 'SL')
                    .slice(0, 2)
                    .toUpperCase());
            }
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({});
            (__VLS_ctx.companyForm.name || 'Minha Empresa');
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                ...{ class: "muted" },
            });
            /** @type {__VLS_StyleScopedClasses['muted']} */ ;
            (__VLS_ctx.companyForm.instagram || '@instagram');
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "product-form" },
            });
            /** @type {__VLS_StyleScopedClasses['product-form']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.form, __VLS_intrinsics.form)({
                ...{ onSubmit: (__VLS_ctx.saveCompany) },
                ...{ class: "product-form" },
            });
            /** @type {__VLS_StyleScopedClasses['product-form']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "settings-section" },
            });
            /** @type {__VLS_StyleScopedClasses['settings-section']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                ...{ class: "muted" },
            });
            /** @type {__VLS_StyleScopedClasses['muted']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "settings-divider" },
            });
            /** @type {__VLS_StyleScopedClasses['settings-divider']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
                ...{ class: "form-field" },
            });
            /** @type {__VLS_StyleScopedClasses['form-field']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
                placeholder: "Nome da empresa",
            });
            (__VLS_ctx.companyForm.name);
            __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
                ...{ class: "form-field" },
            });
            /** @type {__VLS_StyleScopedClasses['form-field']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.textarea)({
                value: (__VLS_ctx.companyForm.description),
                placeholder: "Descrição",
            });
            __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
                ...{ class: "form-field" },
            });
            /** @type {__VLS_StyleScopedClasses['form-field']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
                placeholder: "Instagram",
            });
            (__VLS_ctx.companyForm.instagram);
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "settings-divider" },
            });
            /** @type {__VLS_StyleScopedClasses['settings-divider']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "settings-section" },
            });
            /** @type {__VLS_StyleScopedClasses['settings-section']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
                ...{ class: "form-field" },
            });
            /** @type {__VLS_StyleScopedClasses['form-field']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
                placeholder: "Telefone",
            });
            (__VLS_ctx.companyForm.telefone);
            __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
                ...{ class: "form-field" },
            });
            /** @type {__VLS_StyleScopedClasses['form-field']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
                placeholder: "WhatsApp",
            });
            (__VLS_ctx.companyForm.numeroWhatsApp);
            __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
                ...{ class: "form-field" },
            });
            /** @type {__VLS_StyleScopedClasses['form-field']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
                placeholder: "Endereço",
            });
            (__VLS_ctx.companyForm.endereco);
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "settings-divider" },
            });
            /** @type {__VLS_StyleScopedClasses['settings-divider']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
                ...{ class: "logo-upload" },
            });
            /** @type {__VLS_StyleScopedClasses['logo-upload']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
                ...{ onChange: (__VLS_ctx.uploadCompanyLogo) },
                type: "file",
                accept: ".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp",
                disabled: (__VLS_ctx.uploadingLogo),
            });
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "settings-divider" },
            });
            /** @type {__VLS_StyleScopedClasses['settings-divider']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
                ...{ class: "logo-upload" },
            });
            /** @type {__VLS_StyleScopedClasses['logo-upload']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
                ...{ onChange: (__VLS_ctx.uploadCompanyHero) },
                type: "file",
                accept: ".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp",
                disabled: (__VLS_ctx.uploadingLogo),
            });
            __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
                ...{ class: "form-field" },
            });
            /** @type {__VLS_StyleScopedClasses['form-field']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
                placeholder: "URL do Banner",
            });
            (__VLS_ctx.companyForm.heroImage);
            __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
                ...{ class: "form-field" },
            });
            /** @type {__VLS_StyleScopedClasses['form-field']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
                placeholder: "URL da Logo",
            });
            (__VLS_ctx.companyForm.logo);
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ class: "primary-button" },
                type: "submit",
                disabled: (__VLS_ctx.loading),
            });
            /** @type {__VLS_StyleScopedClasses['primary-button']} */ ;
        }
        if (__VLS_ctx.dashboardTab === 'subscription') {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "subscription-page" },
            });
            /** @type {__VLS_StyleScopedClasses['subscription-page']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "subscription-card" },
            });
            /** @type {__VLS_StyleScopedClasses['subscription-card']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "subscription-header" },
            });
            /** @type {__VLS_StyleScopedClasses['subscription-header']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                ...{ class: "eyebrow" },
            });
            /** @type {__VLS_StyleScopedClasses['eyebrow']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({});
            (__VLS_ctx.subscription?.plan.name ?? 'Smart Links');
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "subscription-status" },
                ...{ class: ((__VLS_ctx.subscription?.status ?? 'PENDING').toLowerCase()) },
            });
            /** @type {__VLS_StyleScopedClasses['subscription-status']} */ ;
            (__VLS_ctx.subscription?.status ?? 'PENDING');
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "subscription-grid" },
            });
            /** @type {__VLS_StyleScopedClasses['subscription-grid']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "subscription-item" },
            });
            /** @type {__VLS_StyleScopedClasses['subscription-item']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
            (__VLS_ctx.subscription?.plan.name ?? 'Smart Links');
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "subscription-item" },
            });
            /** @type {__VLS_StyleScopedClasses['subscription-item']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
            (__VLS_ctx.formatCurrency(__VLS_ctx.subscription?.plan.price ?? 97));
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "subscription-item" },
            });
            /** @type {__VLS_StyleScopedClasses['subscription-item']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
            (__VLS_ctx.subscription?.nextDueDate?.slice(0, 10) ?? 'A definir');
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "subscription-item" },
            });
            /** @type {__VLS_StyleScopedClasses['subscription-item']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
            (__VLS_ctx.subscription?.paymentMethod ?? 'Não definida');
            if (!__VLS_ctx.subscriptionPayment) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.form, __VLS_intrinsics.form)({
                    ...{ onSubmit: (__VLS_ctx.generateSubscriptionPayment) },
                    ...{ class: "subscription-payment-form" },
                });
                /** @type {__VLS_StyleScopedClasses['subscription-payment-form']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
                __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
                (__VLS_ctx.subscription?.asaasSubscriptionId ? 'Consultar cobrança' : 'Gerar primeira cobrança');
                __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                    ...{ class: "muted" },
                });
                /** @type {__VLS_StyleScopedClasses['muted']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
                    required: true,
                    inputmode: "numeric",
                    placeholder: "CPF ou CNPJ",
                });
                (__VLS_ctx.subscriptionForm.cpfCnpj);
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "payment-method-control" },
                });
                /** @type {__VLS_StyleScopedClasses['payment-method-control']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
                    ...{ class: ({ active: __VLS_ctx.subscriptionForm.billingType === 'PIX' }) },
                });
                /** @type {__VLS_StyleScopedClasses['active']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
                    type: "radio",
                    value: "PIX",
                });
                (__VLS_ctx.subscriptionForm.billingType);
                __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
                    ...{ class: ({ active: __VLS_ctx.subscriptionForm.billingType === 'BOLETO' }) },
                });
                /** @type {__VLS_StyleScopedClasses['active']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
                    type: "radio",
                    value: "BOLETO",
                });
                (__VLS_ctx.subscriptionForm.billingType);
                __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                    ...{ class: "primary-button" },
                    type: "submit",
                    disabled: (__VLS_ctx.loading),
                });
                /** @type {__VLS_StyleScopedClasses['primary-button']} */ ;
                (__VLS_ctx.loading ? 'Gerando...' : 'Gerar cobrança');
            }
            if (__VLS_ctx.subscriptionPayment) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "payment-result" },
                });
                /** @type {__VLS_StyleScopedClasses['payment-result']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
                __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                    ...{ class: "eyebrow" },
                });
                /** @type {__VLS_StyleScopedClasses['eyebrow']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
                (__VLS_ctx.formatCurrency(__VLS_ctx.subscriptionPayment.payment.value));
                __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                    ...{ class: "muted" },
                });
                /** @type {__VLS_StyleScopedClasses['muted']} */ ;
                (__VLS_ctx.subscriptionPayment.payment.dueDate);
                if (__VLS_ctx.subscriptionPayment.pix) {
                    __VLS_asFunctionalElement1(__VLS_intrinsics.img)({
                        ...{ class: "pix-qr-code" },
                        src: (`data:image/png;base64,${__VLS_ctx.subscriptionPayment.pix.encodedImage}`),
                        alt: "QR Code PIX",
                    });
                    /** @type {__VLS_StyleScopedClasses['pix-qr-code']} */ ;
                    __VLS_asFunctionalElement1(__VLS_intrinsics.textarea)({
                        readonly: true,
                        value: (__VLS_ctx.subscriptionPayment.pix.payload),
                    });
                    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                        ...{ onClick: (...[$event]) => {
                                if (!(__VLS_ctx.currentView === 'dashboard' && __VLS_ctx.canShowDashboardWorkspace && !__VLS_ctx.showOnboarding))
                                    return;
                                if (!(__VLS_ctx.user &&
                                    !__VLS_ctx.needsModuleChoice))
                                    return;
                                if (!(__VLS_ctx.dashboardTab === 'subscription'))
                                    return;
                                if (!(__VLS_ctx.subscriptionPayment))
                                    return;
                                if (!(__VLS_ctx.subscriptionPayment.pix))
                                    return;
                                __VLS_ctx.copyPaymentCode(__VLS_ctx.subscriptionPayment.pix.payload);
                                // @ts-ignore
                                [loading, loading, loading, dashboardTab, dashboardTab, formatCurrency, formatCurrency, upcomingAppointments, companyForm, companyForm, companyForm, companyForm, companyForm, companyForm, companyForm, companyForm, companyForm, companyForm, companyForm, companyForm, companyForm, saveCompany, uploadCompanyLogo, uploadingLogo, uploadingLogo, uploadCompanyHero, subscription, subscription, subscription, subscription, subscription, subscription, subscription, subscription, subscriptionPayment, subscriptionPayment, subscriptionPayment, subscriptionPayment, subscriptionPayment, subscriptionPayment, subscriptionPayment, subscriptionPayment, generateSubscriptionPayment, subscriptionForm, subscriptionForm, subscriptionForm, subscriptionForm, subscriptionForm, copyPaymentCode,];
                            } },
                        ...{ class: "primary-button" },
                        type: "button",
                    });
                    /** @type {__VLS_StyleScopedClasses['primary-button']} */ ;
                }
                if (__VLS_ctx.subscriptionPayment.boleto) {
                    __VLS_asFunctionalElement1(__VLS_intrinsics.textarea)({
                        readonly: true,
                        value: (__VLS_ctx.subscriptionPayment.boleto.identificationField),
                    });
                    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                        ...{ onClick: (...[$event]) => {
                                if (!(__VLS_ctx.currentView === 'dashboard' && __VLS_ctx.canShowDashboardWorkspace && !__VLS_ctx.showOnboarding))
                                    return;
                                if (!(__VLS_ctx.user &&
                                    !__VLS_ctx.needsModuleChoice))
                                    return;
                                if (!(__VLS_ctx.dashboardTab === 'subscription'))
                                    return;
                                if (!(__VLS_ctx.subscriptionPayment))
                                    return;
                                if (!(__VLS_ctx.subscriptionPayment.boleto))
                                    return;
                                __VLS_ctx.copyPaymentCode(__VLS_ctx.subscriptionPayment.boleto.identificationField);
                                // @ts-ignore
                                [subscriptionPayment, subscriptionPayment, subscriptionPayment, copyPaymentCode,];
                            } },
                        ...{ class: "primary-button" },
                        type: "button",
                    });
                    /** @type {__VLS_StyleScopedClasses['primary-button']} */ ;
                    if (__VLS_ctx.subscriptionPayment.boleto.url) {
                        __VLS_asFunctionalElement1(__VLS_intrinsics.a, __VLS_intrinsics.a)({
                            ...{ class: "primary-link" },
                            href: (__VLS_ctx.subscriptionPayment.boleto.url),
                            target: "_blank",
                            rel: "noopener noreferrer",
                        });
                        /** @type {__VLS_StyleScopedClasses['primary-link']} */ ;
                    }
                }
            }
        }
        if (__VLS_ctx.dashboardTab === 'settings') {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "settings-page" },
            });
            /** @type {__VLS_StyleScopedClasses['settings-page']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "empty-state" },
            });
            /** @type {__VLS_StyleScopedClasses['empty-state']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                ...{ class: "muted" },
            });
            /** @type {__VLS_StyleScopedClasses['muted']} */ ;
        }
    }
}
if (__VLS_ctx.currentView === 'company' && __VLS_ctx.company) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
        ...{ class: "public-page" },
    });
    /** @type {__VLS_StyleScopedClasses['public-page']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "company-hero" },
    });
    /** @type {__VLS_StyleScopedClasses['company-hero']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "company-banner" },
    });
    /** @type {__VLS_StyleScopedClasses['company-banner']} */ ;
    if (__VLS_ctx.company.heroImage) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.img)({
            src: (__VLS_ctx.company.heroImage),
            alt: "",
        });
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "company-hero-content" },
    });
    /** @type {__VLS_StyleScopedClasses['company-hero-content']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "company-logo-large" },
    });
    /** @type {__VLS_StyleScopedClasses['company-logo-large']} */ ;
    if (__VLS_ctx.company.logo) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.img)({
            src: (__VLS_ctx.company.logo),
            alt: "",
        });
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        (__VLS_ctx.company.name.slice(0, 2).toUpperCase());
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.h1, __VLS_intrinsics.h1)({});
    (__VLS_ctx.company.name);
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "company-description" },
    });
    /** @type {__VLS_StyleScopedClasses['company-description']} */ ;
    (__VLS_ctx.company.description);
    if (__VLS_ctx.company.instagram) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "company-social" },
        });
        /** @type {__VLS_StyleScopedClasses['company-social']} */ ;
        (__VLS_ctx.company.instagram);
    }
    if (__VLS_ctx.company.numeroWhatsApp) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.a, __VLS_intrinsics.a)({
            ...{ class: "primary-link" },
            href: (`https://wa.me/${__VLS_ctx.company.numeroWhatsApp.replace(/\D/g, '')}`),
            target: "_blank",
        });
        /** @type {__VLS_StyleScopedClasses['primary-link']} */ ;
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "company-info-cards" },
    });
    /** @type {__VLS_StyleScopedClasses['company-info-cards']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-card" },
    });
    /** @type {__VLS_StyleScopedClasses['info-card']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-card" },
    });
    /** @type {__VLS_StyleScopedClasses['info-card']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-card" },
    });
    /** @type {__VLS_StyleScopedClasses['info-card']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "catalog-header" },
    });
    /** @type {__VLS_StyleScopedClasses['catalog-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        ...{ class: "product-search" },
        placeholder: "Buscar produtos...",
    });
    (__VLS_ctx.productSearch);
    /** @type {__VLS_StyleScopedClasses['product-search']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "public-grid" },
    });
    /** @type {__VLS_StyleScopedClasses['public-grid']} */ ;
    for (const [product] of __VLS_vFor((__VLS_ctx.filteredProducts))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.a, __VLS_intrinsics.a)({
            key: (product.id),
            ...{ class: "public-card" },
            href: (`#/produto/${product.slug}`),
        });
        /** @type {__VLS_StyleScopedClasses['public-card']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.img)({
            src: (product.images?.[0] ||
                'https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?auto=format&fit=crop&w=900&q=80'),
            alt: "",
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
        (product.name);
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        (__VLS_ctx.formatCurrency(product.price));
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "public-card-link" },
        });
        /** @type {__VLS_StyleScopedClasses['public-card-link']} */ ;
        // @ts-ignore
        [currentView, dashboardTab, formatCurrency, subscriptionPayment, subscriptionPayment, company, company, company, company, company, company, company, company, company, company, company, company, productSearch, filteredProducts,];
    }
    if (__VLS_ctx.company.services?.length) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
            ...{ class: "public-services" },
        });
        /** @type {__VLS_StyleScopedClasses['public-services']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "related-products-header" },
        });
        /** @type {__VLS_StyleScopedClasses['related-products-header']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "muted" },
        });
        /** @type {__VLS_StyleScopedClasses['muted']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "service-public-grid" },
        });
        /** @type {__VLS_StyleScopedClasses['service-public-grid']} */ ;
        for (const [service] of __VLS_vFor((__VLS_ctx.company.services))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.article, __VLS_intrinsics.article)({
                key: (service.id),
                ...{ class: "service-public-card" },
            });
            /** @type {__VLS_StyleScopedClasses['service-public-card']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
            (service.name);
            if (service.image) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.img)({
                    src: (service.image),
                    alt: "",
                });
            }
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
            (service.description);
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            (service.duration);
            (__VLS_ctx.formatCurrency(service.price));
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (...[$event]) => {
                        if (!(__VLS_ctx.currentView === 'company' && __VLS_ctx.company))
                            return;
                        if (!(__VLS_ctx.company.services?.length))
                            return;
                        __VLS_ctx.selectServiceForAppointment(service.id);
                        // @ts-ignore
                        [formatCurrency, company, company, selectServiceForAppointment,];
                    } },
                ...{ class: "primary-button" },
                type: "button",
            });
            /** @type {__VLS_StyleScopedClasses['primary-button']} */ ;
            // @ts-ignore
            [];
        }
        if (__VLS_ctx.selectedPublicService) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.form, __VLS_intrinsics.form)({
                ...{ onSubmit: (__VLS_ctx.createPublicAppointment) },
                ref: "appointmentFormRef",
                ...{ class: "public-appointment-form" },
            });
            /** @type {__VLS_StyleScopedClasses['public-appointment-form']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                ...{ class: "eyebrow" },
            });
            /** @type {__VLS_StyleScopedClasses['eyebrow']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
            (__VLS_ctx.selectedPublicService.name);
            __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
                ...{ onChange: (...[$event]) => {
                        if (!(__VLS_ctx.currentView === 'company' && __VLS_ctx.company))
                            return;
                        if (!(__VLS_ctx.company.services?.length))
                            return;
                        if (!(__VLS_ctx.selectedPublicService))
                            return;
                        __VLS_ctx.appointmentForm.time = '';
                        // @ts-ignore
                        [selectedPublicService, selectedPublicService, createPublicAppointment, appointmentForm,];
                    } },
                required: true,
                type: "date",
                min: (__VLS_ctx.toLocalDateKey(new Date())),
            });
            (__VLS_ctx.appointmentForm.date);
            __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
                value: (__VLS_ctx.appointmentForm.time),
                required: true,
                disabled: (!__VLS_ctx.availableAppointmentTimes.length),
            });
            __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
                value: "",
                disabled: true,
            });
            for (const [time] of __VLS_vFor((__VLS_ctx.availableAppointmentTimes))) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
                    key: (time),
                    value: (time),
                });
                (time);
                // @ts-ignore
                [appointmentForm, appointmentForm, toLocalDateKey, availableAppointmentTimes, availableAppointmentTimes,];
            }
            __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
                ...{ class: "form-field" },
            });
            /** @type {__VLS_StyleScopedClasses['form-field']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
                required: true,
                placeholder: "Seu nome",
            });
            (__VLS_ctx.appointmentForm.customerName);
            __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
                ...{ class: "form-field" },
            });
            /** @type {__VLS_StyleScopedClasses['form-field']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
                required: true,
                placeholder: "Seu WhatsApp",
            });
            (__VLS_ctx.appointmentForm.customerPhone);
            if (__VLS_ctx.appointmentForm.date && !__VLS_ctx.availableAppointmentTimes.length) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                    ...{ class: "muted" },
                });
                /** @type {__VLS_StyleScopedClasses['muted']} */ ;
            }
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ class: "primary-button" },
                type: "submit",
                disabled: (__VLS_ctx.loading || !__VLS_ctx.appointmentForm.time),
            });
            /** @type {__VLS_StyleScopedClasses['primary-button']} */ ;
        }
    }
}
if (__VLS_ctx.currentView === 'product' && __VLS_ctx.publicProduct) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
        ...{ class: "product-page" },
    });
    /** @type {__VLS_StyleScopedClasses['product-page']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "product-media" },
    });
    /** @type {__VLS_StyleScopedClasses['product-media']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.img)({
        src: (__VLS_ctx.publicProduct.images?.[0] || 'https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?auto=format&fit=crop&w=1200&q=80'),
        alt: "",
    });
    if (__VLS_ctx.publicProduct.images?.length && __VLS_ctx.publicProduct.images.length > 1) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "product-media-thumbs" },
        });
        /** @type {__VLS_StyleScopedClasses['product-media-thumbs']} */ ;
        for (const [image] of __VLS_vFor((__VLS_ctx.publicProduct.images))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.img)({
                key: (image),
                src: (image),
                alt: "",
            });
            // @ts-ignore
            [currentView, loading, appointmentForm, appointmentForm, appointmentForm, appointmentForm, availableAppointmentTimes, publicProduct, publicProduct, publicProduct, publicProduct, publicProduct,];
        }
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "purchase-panel" },
    });
    /** @type {__VLS_StyleScopedClasses['purchase-panel']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "eyebrow" },
    });
    /** @type {__VLS_StyleScopedClasses['eyebrow']} */ ;
    (__VLS_ctx.publicProduct.user.name);
    __VLS_asFunctionalElement1(__VLS_intrinsics.h1, __VLS_intrinsics.h1)({});
    (__VLS_ctx.publicProduct.name);
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "price" },
    });
    /** @type {__VLS_StyleScopedClasses['price']} */ ;
    (__VLS_ctx.formatCurrency(__VLS_ctx.publicProduct.price));
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
    (__VLS_ctx.publicProduct.description);
    for (const [attribute] of __VLS_vFor((__VLS_ctx.publicProduct.attributes))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            key: (attribute.id),
            ...{ class: "swatch-group" },
        });
        /** @type {__VLS_StyleScopedClasses['swatch-group']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        (attribute.name);
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
        for (const [value] of __VLS_vFor((attribute.values))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                key: (value.id),
                type: "button",
                ...{ class: "swatch" },
            });
            /** @type {__VLS_StyleScopedClasses['swatch']} */ ;
            (value.value);
            // @ts-ignore
            [formatCurrency, publicProduct, publicProduct, publicProduct, publicProduct, publicProduct,];
        }
        // @ts-ignore
        [];
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.form, __VLS_intrinsics.form)({
        ...{ onSubmit: (__VLS_ctx.reserveProduct) },
        ...{ class: "reservation-box" },
    });
    /** @type {__VLS_StyleScopedClasses['reservation-box']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        required: true,
        placeholder: "Seu nome",
    });
    (__VLS_ctx.reservationForm.customerName);
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        required: true,
        placeholder: "Seu WhatsApp",
    });
    (__VLS_ctx.reservationForm.customerPhone);
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        required: true,
        type: "number",
        min: "1",
    });
    (__VLS_ctx.reservationForm.quantity);
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ class: "primary-button" },
        type: "submit",
        disabled: (__VLS_ctx.loading),
    });
    /** @type {__VLS_StyleScopedClasses['primary-button']} */ ;
    if (__VLS_ctx.publicProduct.relatedFrom?.length) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
            ...{ class: "related-products-public" },
        });
        /** @type {__VLS_StyleScopedClasses['related-products-public']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "related-products-header" },
        });
        /** @type {__VLS_StyleScopedClasses['related-products-header']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "muted" },
        });
        /** @type {__VLS_StyleScopedClasses['muted']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "related-products-grid" },
        });
        /** @type {__VLS_StyleScopedClasses['related-products-grid']} */ ;
        for (const [item] of __VLS_vFor((__VLS_ctx.publicProduct.relatedFrom))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.a, __VLS_intrinsics.a)({
                key: (item.related.id),
                ...{ class: "related-public-card" },
                href: (`#/produto/${item.related.slug}`),
            });
            /** @type {__VLS_StyleScopedClasses['related-public-card']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.img)({
                src: (item.related.images?.[0] ||
                    'https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?auto=format&fit=crop&w=900&q=80'),
                alt: "",
            });
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "related-public-content" },
            });
            /** @type {__VLS_StyleScopedClasses['related-public-content']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
            (item.related.name);
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            (__VLS_ctx.formatCurrency(item.related.price));
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "related-public-link" },
            });
            /** @type {__VLS_StyleScopedClasses['related-public-link']} */ ;
            // @ts-ignore
            [loading, formatCurrency, publicProduct, publicProduct, reserveProduct, reservationForm, reservationForm, reservationForm,];
        }
    }
}
// @ts-ignore
[];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
