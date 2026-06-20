import { computed, onMounted, ref } from "vue";
import { api, clearToken, getToken, setToken } from "./api";
import { formatCurrency, slugify } from "./format";
const route = ref(window.location.hash || "#/dashboard");
const user = ref(null);
const products = ref([]);
const analytics = ref([]);
const company = ref(null);
const publicProduct = ref(null);
const loading = ref(false);
const uploadingLogo = ref(false);
const uploadingProductImages = ref(false);
const error = ref("");
const notice = ref("");
const authMode = ref("login");
const dashboardTab = ref("products");
const selectedProductId = ref("");
const relatedSelection = ref([]);
const productSearch = ref("");
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
const currentView = computed(() => {
    if (route.value.startsWith("#/empresa/"))
        return "company";
    if (route.value.startsWith("#/produto/"))
        return "product";
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
function showError(message) {
    error.value = message;
    notice.value = "";
}
function showNotice(message) {
    notice.value = message;
    error.value = "";
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
        await loadProducts();
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
        await loadProducts();
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
        if (colors.length)
            attributes.push({ name: "Cor", values: colors });
        if (sizes.length)
            attributes.push({ name: "Tamanho", values: sizes });
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
    }
    catch (err) {
        showError(err instanceof Error ? err.message : "Nao foi possivel criar o produto.");
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
    selectedProductId.value = product.id;
    relatedSelection.value =
        product.relatedFrom?.map((item) => item.related.id) ?? [];
}
function toggleRelatedProduct(productId) {
    const index = relatedSelection.value.indexOf(productId);
    if (index >= 0) {
        relatedSelection.value.splice(index, 1);
        return;
    }
    if (relatedSelection.value.length >= 4) {
        showError("Voce pode selecionar no maximo 4 produtos.");
        return;
    }
    relatedSelection.value.push(productId);
}
async function saveRelatedProducts() {
    if (!selectedProductId.value)
        return;
    try {
        await api.updateRelatedProducts(selectedProductId.value, relatedSelection.value);
        showNotice("Relacionamentos atualizados.");
        await loadProducts();
    }
    catch {
        showError("Nao foi possivel salvar os relacionamentos.");
    }
}
onMounted(async () => {
    await loadSession();
    await loadRoute();
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
if (__VLS_ctx.currentView === 'dashboard' && !__VLS_ctx.user) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
        ...{ class: "workspace" },
    });
    /** @type {__VLS_StyleScopedClasses['workspace']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
        ...{ class: "main-panel" },
    });
    /** @type {__VLS_StyleScopedClasses['main-panel']} */ ;
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
        : 'Crie sua empresa gratuitamente.');
    __VLS_asFunctionalElement1(__VLS_intrinsics.form, __VLS_intrinsics.form)({
        ...{ onSubmit: (__VLS_ctx.submitAuth) },
        ...{ class: "form-grid" },
    });
    /** @type {__VLS_StyleScopedClasses['form-grid']} */ ;
    if (__VLS_ctx.authMode === 'register') {
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            required: true,
            placeholder: "Nome da empresa",
        });
        (__VLS_ctx.authForm.name);
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        required: true,
        type: "email",
        placeholder: "Email",
    });
    (__VLS_ctx.authForm.email);
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        required: true,
        type: "password",
        placeholder: "Senha",
    });
    (__VLS_ctx.authForm.password);
    if (__VLS_ctx.authMode === 'register') {
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            placeholder: "slug-da-empresa",
        });
        (__VLS_ctx.authForm.slug);
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            required: true,
            placeholder: "WhatsApp",
        });
        (__VLS_ctx.authForm.numeroWhatsApp);
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
                [user, user, user, publicCompanyUrl, logout, error, error, notice, notice, currentView, authMode, authMode, authMode, authMode, authMode, authMode, authMode, submitAuth, authForm, authForm, authForm, authForm, authForm, authForm, loading,];
            } },
        ...{ class: "ghost-button" },
        type: "button",
    });
    /** @type {__VLS_StyleScopedClasses['ghost-button']} */ ;
    (__VLS_ctx.authMode === 'login'
        ? 'Criar conta'
        : 'Já tenho conta');
}
if (__VLS_ctx.currentView === 'dashboard' && __VLS_ctx.user) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
        ...{ class: "workspace" },
    });
    /** @type {__VLS_StyleScopedClasses['workspace']} */ ;
    if (__VLS_ctx.user) {
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
        __VLS_asFunctionalElement1(__VLS_intrinsics.nav, __VLS_intrinsics.nav)({
            ...{ class: "sidebar-nav" },
        });
        /** @type {__VLS_StyleScopedClasses['sidebar-nav']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.currentView === 'dashboard' && __VLS_ctx.user))
                        return;
                    if (!(__VLS_ctx.user))
                        return;
                    __VLS_ctx.dashboardTab = 'products';
                    // @ts-ignore
                    [user, user, currentView, authMode, dashboardTab,];
                } },
            type: "button",
            ...{ class: "sidebar-item" },
            ...{ class: ({
                    active: __VLS_ctx.dashboardTab === 'products'
                }) },
        });
        /** @type {__VLS_StyleScopedClasses['sidebar-item']} */ ;
        /** @type {__VLS_StyleScopedClasses['active']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.currentView === 'dashboard' && __VLS_ctx.user))
                        return;
                    if (!(__VLS_ctx.user))
                        return;
                    __VLS_ctx.dashboardTab = 'company';
                    // @ts-ignore
                    [dashboardTab, dashboardTab,];
                } },
            type: "button",
            ...{ class: "sidebar-item" },
            ...{ class: ({
                    active: __VLS_ctx.dashboardTab === 'company'
                }) },
        });
        /** @type {__VLS_StyleScopedClasses['sidebar-item']} */ ;
        /** @type {__VLS_StyleScopedClasses['active']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.currentView === 'dashboard' && __VLS_ctx.user))
                        return;
                    if (!(__VLS_ctx.user))
                        return;
                    __VLS_ctx.dashboardTab = 'analytics';
                    __VLS_ctx.loadAnalytics();
                    ;
                    // @ts-ignore
                    [dashboardTab, dashboardTab, loadAnalytics,];
                } },
            type: "button",
            ...{ class: "sidebar-item" },
            ...{ class: ({
                    active: __VLS_ctx.dashboardTab === 'analytics'
                }) },
        });
        /** @type {__VLS_StyleScopedClasses['sidebar-item']} */ ;
        /** @type {__VLS_StyleScopedClasses['active']} */ ;
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
    if (__VLS_ctx.user) {
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
        (__VLS_ctx.dashboardTab === 'products'
            ? 'Produtos'
            : __VLS_ctx.dashboardTab === 'analytics'
                ? 'Analytics'
                : 'Minha Empresa');
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "dashboard-subtitle" },
        });
        /** @type {__VLS_StyleScopedClasses['dashboard-subtitle']} */ ;
        (__VLS_ctx.dashboardTab === 'products'
            ? 'Gerencie seu catálogo e publique novos produtos.'
            : __VLS_ctx.dashboardTab === 'analytics'
                ? 'Acompanhe o desempenho dos seus produtos.'
                : 'Gerencie as informações da sua empresa.');
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "dashboard-counter" },
        });
        /** @type {__VLS_StyleScopedClasses['dashboard-counter']} */ ;
        (__VLS_ctx.dashboardTab === 'products'
            ? `${__VLS_ctx.products.length} produtos`
            : __VLS_ctx.dashboardTab === 'analytics'
                ? `${__VLS_ctx.monitoredProducts} produtos`
                : 'Perfil');
        if (__VLS_ctx.user && __VLS_ctx.dashboardTab === 'products') {
            __VLS_asFunctionalElement1(__VLS_intrinsics.form, __VLS_intrinsics.form)({
                ...{ onSubmit: (__VLS_ctx.createProduct) },
                ...{ class: "product-form" },
            });
            /** @type {__VLS_StyleScopedClasses['product-form']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
                required: true,
                placeholder: "Nome do produto",
            });
            (__VLS_ctx.productForm.name);
            __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
                placeholder: "slug-do-produto",
            });
            (__VLS_ctx.productForm.slug);
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
                                if (!(__VLS_ctx.currentView === 'dashboard' && __VLS_ctx.user))
                                    return;
                                if (!(__VLS_ctx.user))
                                    return;
                                if (!(__VLS_ctx.user && __VLS_ctx.dashboardTab === 'products'))
                                    return;
                                if (!(__VLS_ctx.productForm.images.length))
                                    return;
                                __VLS_ctx.removeProductImage(index);
                                // @ts-ignore
                                [user, user, publicCompanyUrl, dashboardTab, dashboardTab, dashboardTab, dashboardTab, dashboardTab, dashboardTab, dashboardTab, dashboardTab, products, monitoredProducts, createProduct, productForm, productForm, productForm, productForm, productForm, productForm, uploadProductImages, uploadingProductImages, removeProductImage,];
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
            __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
                placeholder: "URL da imagem",
            });
            (__VLS_ctx.productForm.image);
            __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
                placeholder: "Cores: Preto, Branco",
            });
            (__VLS_ctx.productForm.colorValues);
            __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
                placeholder: "Tamanhos: P, M, G",
            });
            (__VLS_ctx.productForm.sizeValues);
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
        }
        if (__VLS_ctx.dashboardTab === 'products') {
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
                            if (!(__VLS_ctx.currentView === 'dashboard' && __VLS_ctx.user))
                                return;
                            if (!(__VLS_ctx.user))
                                return;
                            if (!(__VLS_ctx.dashboardTab === 'products'))
                                return;
                            __VLS_ctx.copyProductLink(product.slug);
                            // @ts-ignore
                            [loading, dashboardTab, products, productForm, productForm, productForm, productForm, formatCurrency, copyProductLink,];
                        } },
                    type: "button",
                    ...{ class: "ghost-button" },
                });
                /** @type {__VLS_StyleScopedClasses['ghost-button']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                    ...{ onClick: (...[$event]) => {
                            if (!(__VLS_ctx.currentView === 'dashboard' && __VLS_ctx.user))
                                return;
                            if (!(__VLS_ctx.user))
                                return;
                            if (!(__VLS_ctx.dashboardTab === 'products'))
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
                    __VLS_asFunctionalElement1(__VLS_intrinsics.h4, __VLS_intrinsics.h4)({});
                    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
                    for (const [candidate] of __VLS_vFor((__VLS_ctx.products))) {
                        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                            key: (candidate.id),
                        });
                        if (candidate.id !== product.id) {
                            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                                ...{ onClick: (...[$event]) => {
                                        if (!(__VLS_ctx.currentView === 'dashboard' && __VLS_ctx.user))
                                            return;
                                        if (!(__VLS_ctx.user))
                                            return;
                                        if (!(__VLS_ctx.dashboardTab === 'products'))
                                            return;
                                        if (!(__VLS_ctx.selectedProductId === product.id))
                                            return;
                                        if (!(candidate.id !== product.id))
                                            return;
                                        __VLS_ctx.toggleRelatedProduct(candidate.id);
                                        // @ts-ignore
                                        [products, selectedProductId, toggleRelatedProduct,];
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
        if (__VLS_ctx.dashboardTab === 'analytics') {
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
                [dashboardTab, monitoredProducts, totalClicks, totalReservations, analytics,];
            }
            if (!__VLS_ctx.analytics.length) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({});
                __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                    colspan: "3",
                });
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
            __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
                placeholder: "Nome da empresa",
            });
            (__VLS_ctx.companyForm.name);
            __VLS_asFunctionalElement1(__VLS_intrinsics.textarea)({
                value: (__VLS_ctx.companyForm.description),
                placeholder: "Descrição",
            });
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
            __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
                placeholder: "Telefone",
            });
            (__VLS_ctx.companyForm.telefone);
            __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
                placeholder: "WhatsApp",
            });
            (__VLS_ctx.companyForm.numeroWhatsApp);
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
            __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
                placeholder: "URL do Banner",
            });
            (__VLS_ctx.companyForm.heroImage);
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
        [currentView, loading, dashboardTab, formatCurrency, analytics, companyForm, companyForm, companyForm, companyForm, companyForm, companyForm, companyForm, companyForm, companyForm, companyForm, companyForm, companyForm, companyForm, saveCompany, uploadCompanyLogo, uploadingLogo, uploadingLogo, uploadCompanyHero, company, company, company, company, company, company, company, company, company, company, company, company, productSearch, filteredProducts,];
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
            [currentView, publicProduct, publicProduct, publicProduct, publicProduct, publicProduct,];
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
