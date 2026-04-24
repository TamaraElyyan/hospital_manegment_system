import axios from "axios";

function resolveApiBaseURL() {
  const env = import.meta.env.VITE_API_URL;
  if (env && String(env).trim()) {
    return `${String(env).replace(/\/$/, "")}/api`;
  }
  // Dev: same-origin /api so Vite proxy runs (works with http://<LAN-IP>:5000, not only localhost).
  if (import.meta.env.DEV) {
    return "/api";
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
      url.includes("/auth/login") || url.includes("/auth/register");
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
        url.includes("/auth/login") || url.includes("/auth/register");
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
