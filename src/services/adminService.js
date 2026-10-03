import api from "./api";

export const adminService = {
  getUsers: async (page = 1, search = "", perPage) => {
    const params = { page };
    if (search) params.search = search;
    if (perPage) params.per_page = perPage;
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

  getLogs: async (page = 1, filters = {}) => {
    const params = { page };
    if (filters.user_id) params.user_id = filters.user_id;
    if (filters.role) params.role = filters.role;
    if (filters.action) params.action = filters.action;
    if (filters.start_date) params.start_date = filters.start_date;
    if (filters.end_date) params.end_date = filters.end_date;
    const response = await api.get("/admin/logs", { params });
    return response.data;
  }
};
