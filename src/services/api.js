console.log("API BASE URL:", import.meta.env.VITE_API_BASE_URL);

import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true, // important for Sanctum
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLoginRequest = error.config?.url?.includes("/login");
    if (error.response?.status === 401 && !isLoginRequest) {
      localStorage.removeItem("token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("user");
      if (window.location.pathname !== "/" && window.location.pathname !== "/login") {
        window.location.href = "/";
      }
    }
    return Promise.reject(error);
  },
);

export default api;
