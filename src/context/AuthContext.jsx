import { createContext, useContext, useState, useEffect } from "react";
import api from "../services/api";
import { useFeedback } from "./FeedbackContext";

const AuthContext = createContext();

const ACTIVITY_KEY = "last_activity_at";
const INACTIVITY_LIMIT_MS = 10 * 60 * 1000; // 10 minutes

const clearSession = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("user");
  localStorage.removeItem(ACTIVITY_KEY);
};

const isSessionExpired = () => {
  const last = Number(localStorage.getItem(ACTIVITY_KEY)) || 0;
  return last > 0 && Date.now() - last >= INACTIVITY_LIMIT_MS;
};

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const { alertAction } = useFeedback();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(null); // null until API returns

  // Fetch user from localStorage only if token exists
  const fetchUser = async () => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (token && storedUser && !isSessionExpired()) {
      setUser(JSON.parse(storedUser));
    } else {
      // Clear stale or expired session data
      clearSession();
      setUser(null);
    }
  };

  // Check system status
  const checkSystemStatus = async () => {
    try {
      const res = await api.get("/system/status");
      setIsInitialized(!res.data.needs_initialization);
    } catch (e) {
      console.error("Failed to check system status", e);
      // Do not force setup on transient API/network failures.
      // Keep login accessible unless backend explicitly reports initialization is required.
      setIsInitialized(true);
    }
  };

  // Initialize auth context on app load
  useEffect(() => {
    const init = async () => {
      try {
        await checkSystemStatus();
        await fetchUser();
      } catch (e) {
        console.error("Auth initialization failed", e);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  // Login
  const login = async (username, password) => {
    const res = await api.post("/login", { username, password });

    // store tokens and user
    localStorage.setItem("token", res.data.access_token);
    localStorage.setItem("refresh_token", res.data.refresh_token);
    localStorage.setItem("user", JSON.stringify(res.data.user));
    localStorage.setItem(ACTIVITY_KEY, String(Date.now()));
    setUser(res.data.user);

    // refresh system status
    await checkSystemStatus();

    return res.data;
  };

  // Logout
  const logout = () => {
    clearSession();
    setUser(null);
    window.location.href = "/";
  };

  // Inactivity auto-logout: 10 minutes of idle time without user interaction.
  // Last activity is persisted in localStorage so the limit also applies
  // after the tab is closed, the browser restarts, or the device sleeps.
  useEffect(() => {
    if (!user) return;

    const expire = async () => {
      clearSession();
      setUser(null);
      await alertAction(
        "የእርስዎ ክፍለ-ጊዜ በ10 ደቂቃ እንቅስቃሴ ባለመኖሩ ምክንያት ተዘግቷል። እባክዎ እንደገና ይግቡ።\n(Your session has timed out due to 10 minutes of inactivity. Please sign in again.)",
        { title: "ክፍለ-ጊዜ አልቋል (Session Expired)", type: "warning" },
      );
      window.location.href = "/";
    };

    // If the session already expired while away, log out immediately.
    if (isSessionExpired()) {
      expire();
      return;
    }

    let lastWrite = 0;
    const markActive = () => {
      const now = Date.now();
      // Throttle localStorage writes to at most once every 5 seconds.
      if (now - lastWrite >= 5000) {
        lastWrite = now;
        localStorage.setItem(ACTIVITY_KEY, String(now));
      }
    };

    markActive();

    const events = ["mousedown", "mousemove", "keydown", "touchstart", "scroll", "click"];
    events.forEach((evt) => window.addEventListener(evt, markActive, { passive: true }));

    const checkIdle = () => {
      if (isSessionExpired()) expire();
    };

    // Re-check promptly when the user returns to the tab (covers sleep/suspend).
    const onVisibility = () => {
      if (document.visibilityState === "visible") checkIdle();
    };
    document.addEventListener("visibilitychange", onVisibility);

    const intervalId = setInterval(checkIdle, 15000); // check every 15 seconds

    return () => {
      clearInterval(intervalId);
      events.forEach((evt) => window.removeEventListener(evt, markActive));
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [user]);

  const value = {
    user,
    loading,
    isInitialized,
    login,
    logout,
    hasRole: (role) => {
      if (!user) return false;
      if (user.role === role) return true;
      if (Array.isArray(user.roles)) {
        return user.roles.some((r) => (typeof r === "string" ? r === role : r?.name === role));
      }
      return false;
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
