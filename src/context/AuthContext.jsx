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
      setIsInitialized(false); // assume not initialized if API fails
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
    window.location.href = "/login";
  };

  const value = {
    user,
    loading,
    isInitialized,
    login,
    logout,
    hasRole: (role) => user?.roles?.some((r) => r.name === role) || false,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
