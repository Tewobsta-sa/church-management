import api from "./api";

export const courseService = {
  list: async () => {
    const response = await api.get("/courses");
    return response.data;
  },

  get: async (id) => {
    const response = await api.get(`/courses/${id}`);
    return response.data;
  },

  create: async (payload) => {
    const response = await api.post("/courses", payload);
    return response.data;
  },

  update: async (id, payload) => {
    const response = await api.put(`/courses/${id}`, payload);
    return response.data;
  },

  remove: async (id) => {
    const response = await api.delete(`/courses/${id}`);
    return response.data;
  },

  assessments: async (id) => {
    const response = await api.get(`/courses/${id}/assessments`);
    return response.data;
  },

  courseStudents: async (id, sectionId = null) => {
    const params = sectionId ? { section_id: sectionId } : {};
    const response = await api.get(`/courses/${id}/students`, { params });
    return response.data;
  },

  gradesForCourse: async (id) => {
    const response = await api.get(`/courses/${id}/grades`);
    return response.data;
  },
};
