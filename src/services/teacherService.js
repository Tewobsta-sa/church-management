import api from './api';

export const teacherService = {
  getTeachers: async (search = "", page = 1) => {
    const response = await api.get('/teachers', { params: { search, page, role: 'teacher' } });
    return response.data;
  },

  getTeacher: async (id) => {
    const response = await api.get(`/teachers/${id}`);
    return response.data;
  },

  createTeacher: async (data) => {
    // Add the required role field for RegisteredUserController
    const response = await api.post('/teachers', { ...data, role: 'teacher' });
    return response.data;
  },

  updateTeacher: async (id, data) => {
    const response = await api.put(`/teachers/${id}`, data);
    return response.data;
  },

  deleteTeacher: async (id) => {
    const response = await api.delete(`/teachers/${id}`);
    return response.data;
  }
};
