import api from './api';

export const userService = {
  getUsers: async (page = 1, search = '') => {
    const params = { page, search };
    const res = await api.get('/users', { params });
    return res.data;
  },

  createUser: async (userData) => {
    const res = await api.post('/register', userData);
    return res.data;
  },

  updateUser: async (id, userData) => {
    const res = await api.put(`/admin/users/${id}`, userData);
    return res.data;
  },

  deleteUser: async (id) => {
    const res = await api.delete(`/admin/users/${id}`);
    return res.data;
  },

  getStats: async () => {
    const res = await api.get('/admin/stats');
    return res.data.stats;
  },
};