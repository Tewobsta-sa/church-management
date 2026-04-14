import api from "./api";

export const adminService = {
  getUsers: async (page = 1, search = "") => {
    const params = { page };
    if (search) params.search = search;
    const response = await api.get("/users", { params });
    return response.data;
  },

  registerUser: async (userData) => {
    const response = await api.post("/register", userData);
    return response.data;
  },

  updateUser: async (id, userData) => {
    const response = await api.put(`/admin/users/${id}`, userData);
    return response.data;
  },

  deleteUser: async (id) => {
    const response = await api.delete(`/admin/users/${id}`);
    return response.data;
  },

  getStats: async () => {
    const response = await api.get("/admin/stats");
    return response.data;
  },

  getLogs: async (page = 1) => {
    const response = await api.get("/admin/logs", { params: { page } });
    return response.data;
  }
};
