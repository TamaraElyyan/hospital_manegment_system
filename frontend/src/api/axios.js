import axios from "axios";

/** Must be absolute https?:// — matches frontend/.env.production when a host omits VITE at build. */
const PRODUCTION_API_ORIGIN = "https://hospital-api-production-d897.up.railway.app";

function resolveApiBaseURL() {
  const raw = import.meta.env.VITE_API_URL;
  const env = raw != null ? String(raw).trim() : "";

  if (env) {
    const base = env.replace(/\/$/, "");
    if (/^https?:\/\//i.test(base)) {
      return `${base}/api`;
    }
    // A relative value (e.g. "/") makes axios hit the static host (Render) → 404 on /api/*
    if (import.meta.env.PROD) {
      console.warn(
        "[api] VITE_API_URL is not an absolute URL; using PRODUCTION_API_ORIGIN. Set VITE_API_URL in the host (e.g. Render) to your API (https://...), no /api suffix."
      );
      return `${PRODUCTION_API_ORIGIN}/api`;
    }
    return `${base}/api`;
  }

  // Dev: same-origin /api so Vite proxy runs (works with http://<LAN-IP>:5000, not only localhost).
  if (import.meta.env.DEV) {
    return "/api";
  }
  if (import.meta.env.PROD) {
    return `${PRODUCTION_API_ORIGIN}/api`;
  }
  return "http://localhost:8080/api";
}

const axiosInstance = axios.create({
  baseURL: resolveApiBaseURL(),
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach token to requests (never send stale JWT on login/register — it used to break the backend filter chain)
axiosInstance.interceptors.request.use(
  (config) => {
    const url = config.url || "";
    const isAuthPublic =
      url.includes("/auth/login") ||
      url.includes("/auth/register") ||
      url.includes("/auth/forgot-password") ||
      url.includes("/auth/reset-password");
    if (!isAuthPublic) {
      const token = localStorage.getItem("token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } else {
      delete config.headers.Authorization;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle unauthorized responses
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const url = error.config?.url || "";
      const isAuthPublic =
        url.includes("/auth/login") ||
        url.includes("/auth/register") ||
        url.includes("/auth/forgot-password") ||
        url.includes("/auth/reset-password");
      if (!isAuthPublic) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
