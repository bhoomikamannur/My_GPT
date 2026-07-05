export const API_BASE = "http://localhost:8080/api";

// Wraps fetch to automatically attach the JWT auth token (if present)
// and prefix requests with the API base URL.
export const apiFetch = (path, options = {}) => {
    const token = localStorage.getItem("mygpt_token");

    const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;

    const headers = {
        ...(options.body && !isFormData ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers
    };

    return fetch(`${API_BASE}${path}`, { ...options, headers });
};
