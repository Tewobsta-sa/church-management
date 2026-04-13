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
  }
};
