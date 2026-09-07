import { createContext, useContext, useState, useEffect } from "react";
import api from "../services/api";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(null); // null until API returns

  // Fetch user from localStorage only if token exists
  const fetchUser = async () => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (token && storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      // Clear stale data
      localStorage.removeItem("token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("user");
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
    setUser(res.data.user);

    // refresh system status
    await checkSystemStatus();

    return res.data;
  };

  // Logout
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
    setUser(null);
    window.location.href = "/";
  };

  // Inactivity auto-logout: 2 minutes of idle time without user interaction
  useEffect(() => {
    if (!user) return;

    const INACTIVITY_LIMIT_MS = 2 * 60 * 1000; // 2 minutes
    let lastActive = Date.now();

    const updateActivity = () => {
      lastActive = Date.now();
    };

    const events = ["mousedown", "mousemove", "keydown", "touchstart", "scroll", "click"];
    events.forEach((evt) => window.addEventListener(evt, updateActivity, { passive: true }));

    const intervalId = setInterval(() => {
      if (Date.now() - lastActive >= INACTIVITY_LIMIT_MS) {
        clearInterval(intervalId);
        events.forEach((evt) => window.removeEventListener(evt, updateActivity));
        alert("የእርስዎ የይለፍ ቃል ክፍለ-ጊዜ በ2 ደቂቃ ባለመንቀሳቀስ ምክንያት ተዘግቷል። እባክዎ እንደገና ይግቡ።\n(Session expired due to 2 minutes of inactivity. Please log in again.)");
        logout();
      }
    }, 10000); // check every 10 seconds

    return () => {
      clearInterval(intervalId);
      events.forEach((evt) => window.removeEventListener(evt, updateActivity));
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
