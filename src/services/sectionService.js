import api from './api';

export const sectionService = {
  // Program Types
  getProgramTypes: async () => {
    const res = await api.get('/program-types');
    return res.data;
  },

  // Sections
  getSections: async () => {
    const res = await api.get("/sections", {
      params: {
        program_type: "Young", // 👈 tailored to your use case
      },
    });

    return res.data;
  },

  getSection: async (id) => {
    const res = await api.get(`/sections/${id}`);
    return res.data;
  },

  createSection: async (data) => {
    const res = await api.post('/sections', data);
    return res.data;
  },

  updateSection: async (id, data) => {
    const res = await api.put(`/sections/${id}`, data);
    return res.data;
  },

  deleteSection: async (id) => {
    const res = await api.delete(`/sections/${id}`);
    return res.data;
  },

  // Relations
  getSectionCourses: async (id) => {
    const res = await api.get(`/sections/${id}/courses`);
    return res.data;
  },

  getSectionStudents: async (id) => {
    const res = await api.get(`/sections/${id}/students`);
    return res.data;
  },

  getSectionTeachers: async (id) => {
    const res = await api.get(`/sections/${id}/teachers`);
    return res.data;
  },

  assignCourse: async (sectionId, courseId) => {
    const res = await api.post(`/sections/${sectionId}/assign-course`, { course_id: courseId });
    return res.data;
  },
};