const API_URL = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:3333";
const TOKEN_KEY = "smartlinks.token";
export function getToken() {
    return localStorage.getItem(TOKEN_KEY);
}
export function setToken(token) {
    localStorage.setItem(TOKEN_KEY, token);
}
export function clearToken() {
    localStorage.removeItem(TOKEN_KEY);
}
async function request(path, options = {}) {
    const headers = new Headers(options.headers);
    const isFormData = options.body instanceof FormData;
    if (!headers.has("Content-Type") && options.body && !isFormData) {
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
    return response.json();
}
export const api = {
    register(input) {
        return request("/auth/register", {
            method: "POST",
            body: JSON.stringify(input),
        });
    },
    login(input) {
        return request("/auth/login", {
            method: "POST",
            body: JSON.stringify(input),
        });
    },
    me() {
        return request("/auth/me");
    },
    getMyProfile() {
        return request("/users/me");
    },
    updateProfile(input) {
        return request("/users/me", {
            method: "PUT",
            body: JSON.stringify(input),
        });
    },
    uploadLogo(file) {
        const formData = new FormData();
        formData.append("file", file);
        return request("/uploads/logo", {
            method: "POST",
            body: formData,
        });
    },
    listProducts() {
        return request("/products");
    },
    createProduct(input) {
        return request("/products", {
            method: "POST",
            body: JSON.stringify(input),
        });
    },
    updateRelatedProducts(productId, relatedIds) {
        return request(`/products/${productId}/related`, {
            method: "PUT",
            body: JSON.stringify({
                relatedIds,
            }),
        });
    },
    getCompany(slug) {
        return request(`/companies/${slug}`);
    },
    getPublicProduct(slug) {
        return request(`/public/products/${slug}`);
    },
    createReservation(input) {
        return request("/public/reservations", {
            method: "POST",
            body: JSON.stringify(input),
        });
    },
};
