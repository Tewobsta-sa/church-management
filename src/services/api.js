import axios from "axios";

const baseURL = import.meta.env.VITE_API_BASE_URL || "/api";

const api = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Request Interceptor: inject Bearer token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Token refresh queue management
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Response Interceptor: silent refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (!error.response) {
      return Promise.reject(error);
    }

    const isAuthUrl =
      originalRequest.url?.includes("/login") ||
      originalRequest.url?.includes("/refresh") ||
      originalRequest.url?.includes("/system/");

    if (error.response.status === 401 && !originalRequest._retry && !isAuthUrl) {
      const refreshToken = localStorage.getItem("refresh_token");

      if (!refreshToken) {
        localStorage.removeItem("token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("user");
        if (window.location.pathname !== "/" && window.location.pathname !== "/login") {
          window.location.href = "/";
        }
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((newToken) => {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshResponse = await axios.post(`${baseURL}/refresh`, {
          refresh_token: refreshToken,
        });

        const newAccessToken = refreshResponse.data.access_token;
        const newRefreshToken = refreshResponse.data.refresh_token;

        localStorage.setItem("token", newAccessToken);
        if (newRefreshToken) {
          localStorage.setItem("refresh_token", newRefreshToken);
        }

        api.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;
        processQueue(null, newAccessToken);

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        localStorage.removeItem("token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("user");
        if (window.location.pathname !== "/" && window.location.pathname !== "/login") {
          window.location.href = "/";
        }
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

/**
 * Resolves API and network errors into human-friendly, bilingual messages.
 */
export const formatApiError = (error, fallback = "ያልተጠበቀ ስህተት አጋጥሟል (An unexpected error occurred)") => {
  if (!error) return fallback;

  if (error.code === "ERR_NETWORK" || !error.response) {
    return "የአውታረ መረብ ግንኙነት አልተገኘም፤ እባክዎ ኢንተርኔትዎን ያረጋግጡ (Unable to reach server. Please check your network connection.)";
  }

  const status = error.response.status;
  const data = error.response.data;

  if (status === 401) {
    return "የመግቢያ ክፍለ-ጊዜ አልቋል፤ እባክዎ እንደገና ይግቡ (Session expired. Please sign in again.)";
  }

  if (status === 403) {
    return "ይህን ተግባር ለማከናወን የሚያስችል ፈቃድ የለዎትም (Access denied. You do not have permission for this action.)";
  }

  if (status === 404) {
    return "የተጠየቀው መረጃ ወይም ገጽ አልተገኘም (Requested resource not found.)";
  }

  if (status === 429) {
    return "ጥያቄዎች በዝተዋል፤ እባክዎ ጥቂት ቆይተው እንደገና ይሞክሩ (Too many requests. Please wait a moment and try again.)";
  }

  if (status === 422 && data?.errors) {
    const firstKey = Object.keys(data.errors)[0];
    const messages = data.errors[firstKey];
    if (Array.isArray(messages) && messages.length > 0) {
      return messages[0];
    }
  }

  if (data?.message) {
    return data.message;
  }

  if (status >= 500) {
    return "የአገልጋይ የውስጥ ስህተት አጋጥሟል፤ እባክዎ ቆየት ብለው ይሞክሩ (Internal server error. Please try again later.)";
  }

  return fallback;
};

export default api;
