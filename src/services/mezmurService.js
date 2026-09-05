import api from "./api";

export const mezmurService = {
  // Trainers
  getTrainers: async () => {
    const response = await api.get("/trainers");
    return response.data;
  },

  // Mezmur Categories
  getCategories: async () => {
    const response = await api.get("/mezmur-categories");
    return response.data;
  },

  // Ministries
  getMinistries: async (params = {}) => {
    const response = await api.get("/ministries", { params });
    return response.data;
  },

  createMinistry: async (data) => {
    const response = await api.post("/ministries", data);
    return response.data;
  },

  updateMinistry: async (id, data) => {
    const response = await api.put(`/ministries/${id}`, data);
    return response.data;
  },

  deleteMinistry: async (id) => {
    const response = await api.delete(`/ministries/${id}`);
    return response.data;
  },

  bulkAssignToMinistry: async (data) => {
    const response = await api.post("/ministries/bulk-assign", data);
    return response.data;
  },

  // Ministry Assignments
  getAssignments: async () => {
    const response = await api.get("/ministry-assignments");
    return response.data;
  },

  createAssignment: async (data) => {
    const response = await api.post("/ministry-assignments", data);
    return response.data;
  },

  autoAssign: async (id) => {
    const response = await api.post(`/ministry-assignments/${id}/auto-assign`);
    return response.data;
  },
  
  // Students Mezmur logic
  getAssignedStudents: async () => {
    const response = await api.get("/students/mezmur");
    return response.data;
  },

  assignStudent: async (studentId, categoryId) => {
    const response = await api.post("/students/mezmur/assign", {
      student_id: studentId,
      mezmur_category_id: categoryId,
    });
    return response.data;
  },

  // Mezmur Exams
  getExams: async () => {
    const response = await api.get("/mezmur-exams");
    return response.data;
  },

  getExam: async (id) => {
    const response = await api.get(`/mezmur-exams/${id}`);
    return response.data;
  },

  createExam: async (data) => {
    const response = await api.post("/mezmur-exams", data);
    return response.data;
  },

  getExamCandidates: async (search = "") => {
    const response = await api.get("/mezmur-exams-candidates", { params: { search } });
    return response.data;
  },

  bulkSaveExamResults: async (data) => {
    const response = await api.post("/mezmur-exams/bulk-results", data);
    return response.data;
  },

  sendPassedStudentsToYesewHabt: async (data) => {
    const response = await api.post("/mezmur-exams/send-passed", data);
    return response.data;
  },

  getPassedStudentsForMinistry: async (params = {}) => {
    const response = await api.get("/mezmur/passed-for-ministry", { params });
    return response.data;
  },
};
