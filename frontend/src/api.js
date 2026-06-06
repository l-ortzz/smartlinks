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
    if (!headers.has("Content-Type") && options.body) {
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
    listProducts() {
        return request("/products");
    },
    createProduct(input) {
        return request("/products", {
            method: "POST",
            body: JSON.stringify(input),
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
