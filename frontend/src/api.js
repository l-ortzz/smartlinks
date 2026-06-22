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
    if (response.status === 204) {
        return undefined;
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
    uploadProductImages(files) {
        const formData = new FormData();
        files.forEach((file) => {
            formData.append("files[]", file);
        });
        return request("/uploads/product", {
            method: "POST",
            body: formData,
        });
    },
    listProducts() {
        return request("/products");
    },
    getAnalytics() {
        return request("/analytics/products");
    },
    listServices() {
        return request("/services");
    },
    createService(input) {
        return request("/services", {
            method: "POST",
            body: JSON.stringify(input),
        });
    },
    updateService(id, input) {
        return request(`/services/${id}`, {
            method: "PUT",
            body: JSON.stringify(input),
        });
    },
    deleteService(id) {
        return request(`/services/${id}`, {
            method: "DELETE",
        });
    },
    listAvailability() {
        return request("/availability");
    },
    createAvailability(input) {
        return request("/availability", {
            method: "POST",
            body: JSON.stringify(input),
        });
    },
    updateAvailability(id, input) {
        return request(`/availability/${id}`, {
            method: "PUT",
            body: JSON.stringify(input),
        });
    },
    deleteAvailability(id) {
        return request(`/availability/${id}`, {
            method: "DELETE",
        });
    },
    listAppointments() {
        return request("/appointments");
    },
    createAppointment(input) {
        return request("/appointments", {
            method: "POST",
            body: JSON.stringify(input),
        });
    },
    updateAppointmentStatus(id, status) {
        return request(`/appointments/${id}/status`, {
            method: "PUT",
            body: JSON.stringify({ status }),
        });
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
