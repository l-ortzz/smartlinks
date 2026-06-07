<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { api, clearToken, getToken, setToken, type CompanyPage, type Product, type PublicProduct, type SessionUser } from "./api";
import { formatCurrency, slugify } from "./format";

console.log("API OBJ", api);
console.log("UPDATE", api.updateProfile);

type View = "dashboard" | "company" | "product";

const route = ref(window.location.hash || "#/dashboard");
const user = ref<SessionUser | null>(null);
const products = ref<Product[]>([]);
const company = ref<CompanyPage | null>(null);
const publicProduct = ref<PublicProduct | null>(null);
const loading = ref(false);
const error = ref("");
const notice = ref("");
const authMode = ref<"login" | "register">("login");
const dashboardTab = ref<"products" | "company">("products");

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

const companyForm = ref({
  name: "",
  description: "",
  logo: "",
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
      instagram: profile.instagram ?? "",
      telefone: profile.telefone ?? "",
      numeroWhatsApp: profile.numeroWhatsApp ?? "",
      endereco: profile.endereco ?? "",
    };

    await loadProducts();
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

async function saveCompany() {
  loading.value = true;

  try {
    await api.updateProfile({
      name: companyForm.value.name,
      description: companyForm.value.description,
      logo: companyForm.value.logo,
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
  } catch (err) {
    showError(err instanceof Error ? err.message : "Nao foi possivel criar o produto.");
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

    <section v-if="currentView === 'dashboard'" class="workspace">
      <aside class="side-panel">
        <template v-if="!user">
          <div class="segmented">
            <button :class="{ active: authMode === 'login' }" type="button" @click="authMode = 'login'">
              Entrar
            </button>
            <button :class="{ active: authMode === 'register' }" type="button" @click="authMode = 'register'">
              Criar conta
            </button>
          </div>

          <form class="form-grid" @submit.prevent="submitAuth">
            <input v-if="authMode === 'register'" v-model="authForm.name" required placeholder="Nome da empresa" />
            <input v-model="authForm.email" required type="email" placeholder="Email" />
            <input v-model="authForm.password" required type="password" placeholder="Senha" />
            <input v-if="authMode === 'register'" v-model="authForm.slug" placeholder="slug-da-empresa" />
            <input v-if="authMode === 'register'" v-model="authForm.numeroWhatsApp" required placeholder="WhatsApp" />
            <textarea v-if="authMode === 'register'" v-model="authForm.description" placeholder="Descricao da empresa" />
            <button class="primary-button" type="submit" :disabled="loading">
              {{ authMode === "login" ? "Entrar" : "Criar conta" }}
            </button>
          </form>
        </template>

        <template v-else>
          <p class="eyebrow">Empresa</p>
          <h1>{{ user.name }}</h1>
          <p class="muted">{{ user.email }}</p>
          <a class="primary-link" :href="publicCompanyUrl">Abrir pagina publica</a>
        </template>
      </aside>

      <section class="main-panel">
        <div class="panel-heading">
          <div class="segmented">
            <button
              type="button"
              :class="{ active: dashboardTab === 'products' }"
              @click="dashboardTab = 'products'"
            >
              Produtos
            </button>

            <button
              type="button"
              :class="{ active: dashboardTab === 'company' }"
              @click="dashboardTab = 'company'"
            >
              Minha Empresa
            </button>
          </div>
          <div>
            <p class="eyebrow">Smart Pages</p>
            <h2>Produtos</h2>
          </div>
          <span class="counter">{{ products.length }} itens</span>
        </div>

<form
  v-if="user && dashboardTab === 'products'"
  class="product-form"
  @submit.prevent="createProduct"
>          <input v-model="productForm.name" required placeholder="Nome do produto" />
          <input v-model="productForm.slug" placeholder="slug-do-produto" />
          <input v-model.number="productForm.price" required type="number" min="0" step="0.01" placeholder="Preco" />
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
            <div>
                <h3>{{ product.name }}</h3>

                <p>{{ formatCurrency(product.price) }}</p>

                <div class="product-actions">
                  <a :href="`#/produto/${product.slug}`">
                    Ver pagina
                  </a>

                  <button
                    type="button"
                    class="ghost-button"
                    @click="copyProductLink(product.slug)"
                  >
                    Copiar link
                  </button>
                </div>
              </div>
          </article>
        </div>
        <div
          v-if="dashboardTab === 'company'"
          class="company-settings"
        >
          <div class="panel-heading">
            <div>
              <p class="eyebrow">Smart Links</p>
              <h2>Minha Empresa</h2>
            </div>
          </div>

          <div class="product-form">
           <form class="product-form" @submit.prevent="saveCompany">
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

              <input
                v-model="companyForm.telefone"
                placeholder="Telefone"
              />

              <input
                v-model="companyForm.numeroWhatsApp"
                placeholder="WhatsApp"
              />

              <input
                v-model="companyForm.logo"
                placeholder="URL da Logo"
              />

              <input
                v-model="companyForm.endereco"
                placeholder="Endereço"
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

    <section v-if="currentView === 'company' && company" class="public-page">
      <div class="company-header">
        <div class="logo-frame">
          <img v-if="company.logo" :src="company.logo" alt="" />
          <span v-else>{{ company.name.slice(0, 2).toUpperCase() }}</span>
        </div>
        <div>
          <p class="eyebrow">Loja</p>
          <h1>{{ company.name }}</h1>
          <p>{{ company.description }}</p>
          <p class="muted">{{ company.instagram }} {{ company.telefone }}</p>
        </div>
      </div>

      <div class="public-grid">
        <a v-for="product in company.products" :key="product.id" class="public-card" :href="`#/produto/${product.slug}`">
          <img :src="product.images?.[0] || 'https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?auto=format&fit=crop&w=900&q=80'" alt="" />
          <strong>{{ product.name }}</strong>
          <span>{{ formatCurrency(product.price) }}</span>
        </a>
      </div>
    </section>

    <section v-if="currentView === 'product' && publicProduct" class="product-page">
      <div class="product-media">
        <img :src="publicProduct.images?.[0] || 'https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?auto=format&fit=crop&w=1200&q=80'" alt="" />
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
      </div>
    </section>
  </main>
</template>
