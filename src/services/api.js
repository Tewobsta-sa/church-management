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
        localStorage.removeItem("last_activity_at");
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
        localStorage.removeItem("last_activity_at");
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
 * Converts raw backend field keys embedded inside error messages
 * (e.g. "grades.0.score", "student_ids.2", "student.course", "family_guardian_phone")
 * into user-friendly labels so users never see technical keys.
 */
export const humanizeFieldKeys = (message) => {
  if (typeof message !== "string") return message;

  const dictionary = {
    "grades.assessment_id": "assessment",
    "grades.student_id": "student",
    "grades.score": "score",
    "student.course": "course",
    "student.section": "section",
    "student_ids": "students",
    "student_id": "student",
    "course_id": "course",
    "section_id": "section",
    "assessment_id": "assessment",
    "user_id": "assigned teacher",
    "trainer_id": "assigned trainer",
    "program_type_id": "program track",
    "target_section_id": "target section",
    "scheduled_date": "scheduled date",
    "day_of_week": "day of the week",
    "start_time": "start time",
    "end_time": "end time",
    "family_guardian_name": "guardian name",
    "family_guardian_phone": "guardian phone",
    "emergency_contact_name": "emergency contact name",
    "emergency_contact_phone": "emergency contact phone",
    "educational_level": "educational level",
    "grade_level": "grade level",
    "occupation_type": "occupation",
    "current_school": "current school",
    "current_office": "current office",
  };

  let humanized = message;

  // Replace dotted tokens like "grades.0.score", "student.course", "student_ids.0"
  humanized = humanized.replace(
    /\b[a-zA-Z_][a-zA-Z0-9_]*(?:\.[a-zA-Z0-9_]+)+\b/g,
    (token) => {
      // Remove numeric array indices: "grades.0.score" -> "grades.score"
      const cleaned = token
        .split(".")
        .filter((p) => !/^\d+$/.test(p))
        .join(".");
      if (dictionary[cleaned]) return dictionary[cleaned];
      if (dictionary[token]) return dictionary[token];
      const parts = cleaned.split(".");
      const last = parts[parts.length - 1] || token;
      return dictionary[last] || last.replace(/_/g, " ");
    },
  );

  // Replace standalone snake_case technical keys
  for (const [techKey, friendly] of Object.entries(dictionary)) {
    if (!techKey.includes(".")) {
      const regex = new RegExp(`\\b${techKey}\\b`, "g");
      humanized = humanized.replace(regex, friendly);
    }
  }

  return humanized;
};

/**
 * Resolves API and network errors into human-friendly, bilingual messages.
 */
export const formatApiError = (
  error,
  fallback = "ያልተጠበቀ ስህተት አጋጥሟል (An unexpected error occurred)",
) => {
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
    return data?.message
      ? humanizeFieldKeys(data.message)
      : "ይህን ተግባር ለማከናወን የሚያስችል ፈቃድ የለዎትም (Access denied. You do not have permission for this action.)";
  }

  if (status === 404) {
    return "የተጠየቀው መረጃ ወይም ገጽ አልተገኘም (Requested resource not found.)";
  }

  if (status === 429) {
    return "ጥያቄዎች በዝተዋል፤ እባክዎ ጥቂት ቆይተው እንደገና ይሞክሩ (Too many requests. Please wait a moment and try again.)";
  }

  if (status === 422) {
    if (data?.errors) {
      const allMsgs = Object.values(data.errors).flat();
      if (allMsgs.length > 0) {
        return allMsgs.map((m) => humanizeFieldKeys(m)).join("; ");
      }
    }
    if (data?.message) {
      return humanizeFieldKeys(data.message);
    }
  }

  if (data?.message) {
    return humanizeFieldKeys(data.message);
  }

  if (status >= 500) {
    return "የአገልጋይ የውስጥ ስህተት አጋጥሟል፤ እባክዎ ቆየት ብለው ይሞክሩ (Internal server error. Please try again later.)";
  }

  return fallback;
};

export default api;
