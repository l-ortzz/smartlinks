import { computed, onMounted, ref } from "vue";
import { api, clearToken, getToken, setToken } from "./api";
import { formatCurrency, slugify } from "./format";
const route = ref(window.location.hash || "#/dashboard");
const user = ref(null);
const products = ref([]);
const company = ref(null);
const publicProduct = ref(null);
const loading = ref(false);
const error = ref("");
const notice = ref("");
const authMode = ref("login");
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
    colorValues: "",
    sizeValues: "",
});
const reservationForm = ref({
    customerName: "",
    customerPhone: "",
    quantity: 1,
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
            images: productForm.value.image ? [productForm.value.image] : undefined,
            attributes,
        });
        productForm.value = {
            name: "",
            slug: "",
            description: "",
            price: 0,
            image: "",
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
if (__VLS_ctx.currentView === 'dashboard') {
    __VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
        ...{ class: "workspace" },
    });
    /** @type {__VLS_StyleScopedClasses['workspace']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.aside, __VLS_intrinsics.aside)({
        ...{ class: "side-panel" },
    });
    /** @type {__VLS_StyleScopedClasses['side-panel']} */ ;
    if (!__VLS_ctx.user) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "segmented" },
        });
        /** @type {__VLS_StyleScopedClasses['segmented']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.currentView === 'dashboard'))
                        return;
                    if (!(!__VLS_ctx.user))
                        return;
                    __VLS_ctx.authMode = 'login';
                    // @ts-ignore
                    [user, user, user, publicCompanyUrl, logout, error, error, notice, notice, currentView, authMode,];
                } },
            ...{ class: ({ active: __VLS_ctx.authMode === 'login' }) },
            type: "button",
        });
        /** @type {__VLS_StyleScopedClasses['active']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.currentView === 'dashboard'))
                        return;
                    if (!(!__VLS_ctx.user))
                        return;
                    __VLS_ctx.authMode = 'register';
                    // @ts-ignore
                    [authMode, authMode,];
                } },
            ...{ class: ({ active: __VLS_ctx.authMode === 'register' }) },
            type: "button",
        });
        /** @type {__VLS_StyleScopedClasses['active']} */ ;
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
        }
        if (__VLS_ctx.authMode === 'register') {
            __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
                required: true,
                placeholder: "WhatsApp",
            });
            (__VLS_ctx.authForm.numeroWhatsApp);
        }
        if (__VLS_ctx.authMode === 'register') {
            __VLS_asFunctionalElement1(__VLS_intrinsics.textarea)({
                value: (__VLS_ctx.authForm.description),
                placeholder: "Descricao da empresa",
            });
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ class: "primary-button" },
            type: "submit",
            disabled: (__VLS_ctx.loading),
        });
        /** @type {__VLS_StyleScopedClasses['primary-button']} */ ;
        (__VLS_ctx.authMode === "login" ? "Entrar" : "Criar conta");
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "eyebrow" },
        });
        /** @type {__VLS_StyleScopedClasses['eyebrow']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.h1, __VLS_intrinsics.h1)({});
        (__VLS_ctx.user.name);
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "muted" },
        });
        /** @type {__VLS_StyleScopedClasses['muted']} */ ;
        (__VLS_ctx.user.email);
        __VLS_asFunctionalElement1(__VLS_intrinsics.a, __VLS_intrinsics.a)({
            ...{ class: "primary-link" },
            href: (__VLS_ctx.publicCompanyUrl),
        });
        /** @type {__VLS_StyleScopedClasses['primary-link']} */ ;
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
        ...{ class: "main-panel" },
    });
    /** @type {__VLS_StyleScopedClasses['main-panel']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "panel-heading" },
    });
    /** @type {__VLS_StyleScopedClasses['panel-heading']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "eyebrow" },
    });
    /** @type {__VLS_StyleScopedClasses['eyebrow']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "counter" },
    });
    /** @type {__VLS_StyleScopedClasses['counter']} */ ;
    (__VLS_ctx.products.length);
    if (__VLS_ctx.user) {
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
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
        (product.name);
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
        (__VLS_ctx.formatCurrency(product.price));
        __VLS_asFunctionalElement1(__VLS_intrinsics.a, __VLS_intrinsics.a)({
            href: (`#/produto/${product.slug}`),
        });
        // @ts-ignore
        [user, user, user, publicCompanyUrl, authMode, authMode, authMode, authMode, authMode, authMode, submitAuth, authForm, authForm, authForm, authForm, authForm, authForm, loading, loading, products, products, createProduct, productForm, productForm, productForm, productForm, productForm, productForm, productForm, formatCurrency,];
    }
}
if (__VLS_ctx.currentView === 'company' && __VLS_ctx.company) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
        ...{ class: "public-page" },
    });
    /** @type {__VLS_StyleScopedClasses['public-page']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "company-header" },
    });
    /** @type {__VLS_StyleScopedClasses['company-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "logo-frame" },
    });
    /** @type {__VLS_StyleScopedClasses['logo-frame']} */ ;
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
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "eyebrow" },
    });
    /** @type {__VLS_StyleScopedClasses['eyebrow']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h1, __VLS_intrinsics.h1)({});
    (__VLS_ctx.company.name);
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
    (__VLS_ctx.company.description);
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "muted" },
    });
    /** @type {__VLS_StyleScopedClasses['muted']} */ ;
    (__VLS_ctx.company.instagram);
    (__VLS_ctx.company.telefone);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "public-grid" },
    });
    /** @type {__VLS_StyleScopedClasses['public-grid']} */ ;
    for (const [product] of __VLS_vFor((__VLS_ctx.company.products))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.a, __VLS_intrinsics.a)({
            key: (product.id),
            ...{ class: "public-card" },
            href: (`#/produto/${product.slug}`),
        });
        /** @type {__VLS_StyleScopedClasses['public-card']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.img)({
            src: (product.images?.[0] || 'https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?auto=format&fit=crop&w=900&q=80'),
            alt: "",
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
        (product.name);
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        (__VLS_ctx.formatCurrency(product.price));
        // @ts-ignore
        [currentView, formatCurrency, company, company, company, company, company, company, company, company, company,];
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
            [currentView, formatCurrency, publicProduct, publicProduct, publicProduct, publicProduct, publicProduct, publicProduct, publicProduct,];
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
}
// @ts-ignore
[loading, reserveProduct, reservationForm, reservationForm, reservationForm,];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
