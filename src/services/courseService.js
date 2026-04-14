import api from "./api";

export const courseService = {
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

  // Assessments
  getAssessments: async (courseId) => {
     const response = await api.get(`/assessments`, { params: { course_id: courseId } });
     return response.data;
  },

  createAssessment: async (data) => {
     // data should include name, max_score, weight, course_id
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
  }
};
