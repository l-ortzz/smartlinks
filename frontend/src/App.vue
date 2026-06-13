<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { api, clearToken, getToken, setToken, type CompanyPage, type Product, type PublicProduct, type SessionUser } from "./api";
import { formatCurrency, slugify } from "./format";


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
const selectedProductId = ref("");
const relatedSelection = ref<string[]>([]);
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

   <section v-if="currentView === 'dashboard' "class="workspace">
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
          class="sidebar-item disabled"
        >
          📈 Analytics
          <small>(em breve)</small>
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
                : 'Minha Empresa'
            }}
          </h1>

          <p class="dashboard-subtitle">
            {{
              dashboardTab === 'products'
                ? 'Gerencie seu catálogo e publique novos produtos.'
                : 'Gerencie as informações da sua empresa.'
            }}
          </p>
        </div>

        <div class="dashboard-counter">
          {{
            dashboardTab === 'products'
              ? `${products.length} produtos`
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

          <div class="company-banner"></div>

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
