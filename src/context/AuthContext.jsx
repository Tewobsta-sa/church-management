import { createContext, useContext, useState, useEffect } from "react";
import api from "../services/api";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(true);

  // Check system status on first load
  const checkSystemStatus = async () => {
    try {
      const res = await api.get("/system/status");
      setIsInitialized(res.data.initialized);
    } catch (e) {
      console.error(e);
    }
  };

  // Get current user
  const fetchUser = async () => {
    try {
      const res = await api.get("/whoami");
      setUser(res.data);
    } catch (e) {
      localStorage.removeItem("token");
    }
  };

  useEffect(() => {
    checkSystemStatus();
    const token = localStorage.getItem("token");
    if (token) fetchUser();
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const res = await api.post("/login", { email, password });
    localStorage.setItem("token", res.data.token); // adjust if your login returns different key
    await fetchUser();
    return res.data;
  };

  const logout = async () => {
    await api.post("/logout");
    localStorage.removeItem("token");
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
