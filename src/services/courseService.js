import api from "./api";

export const courseService = {
  // Preferred names (new API)
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

  // Legacy aliases (kept so existing callers on the-so-called-done keep working)
  getCourses: async (search = "") => {
    const response = await api.get("/courses", { params: { search } });
    return response.data;
  },

  createCourse: async (data) => {
    const response = await api.post("/courses", data);
    return response.data;
  },

  getCourse: async (id) => {
    const response = await api.get(`/courses/${id}`);
    return response.data;
  },

  updateCourse: async (id, data) => {
    const response = await api.put(`/courses/${id}`, data);
    return response.data;
  },

  deleteCourse: async (id) => {
    const response = await api.delete(`/courses/${id}`);
    return response.data;
  },

  getAssessments: async (courseId) => {
    const response = await api.get(`/assessments`, {
      params: { course_id: courseId, per_page: 100 },
    });
    return response.data.data || [];
  },

  createAssessment: async (data) => {
    const response = await api.post("/assessments", data);
    return response.data;
  },

  updateAssessment: async (id, data) => {
    const response = await api.put(`/assessments/${id}`, data);
    return response.data;
  },

  deleteAssessment: async (id) => {
    const response = await api.delete(`/assessments/${id}`);
    return response.data;
  },
};
