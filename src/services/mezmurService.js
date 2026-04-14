import api from "./api";

export const mezmurService = {
  // Trainers
  getTrainers: async () => {
    const response = await api.get("/trainers");
    return response.data;
  },
  createTrainer: async (data) => {
    const response = await api.post("/trainers", data);
    return response.data;
  },
  updateTrainer: async (id, data) => {
    const response = await api.put(`/trainers/${id}`, data);
    return response.data;
  },
  deleteTrainer: async (id) => {
    const response = await api.delete(`/trainers/${id}`);
    return response.data;
  },

  // Mezmur Category Types
  getCategoryTypes: async () => {
    const response = await api.get("/mezmur-category-types");
    return response.data;
  },
  createCategoryType: async (data) => {
    const response = await api.post("/mezmur-category-types", data);
    return response.data;
  },
  updateCategoryType: async (id, data) => {
    const response = await api.put(`/mezmur-category-types/${id}`, data);
    return response.data;
  },
  deleteCategoryType: async (id) => {
    const response = await api.delete(`/mezmur-category-types/${id}`);
    return response.data;
  },

  // Mezmur Categories
  getCategories: async () => {
    const response = await api.get("/mezmur-categories");
    return response.data;
  },
  createCategory: async (data) => {
    const response = await api.post("/mezmur-categories", data);
    return response.data;
  },
  updateCategory: async (id, data) => {
    const response = await api.put(`/mezmur-categories/${id}`, data);
    return response.data;
  },
  deleteCategory: async (id) => {
    const response = await api.delete(`/mezmur-categories/${id}`);
    return response.data;
  },

  // Mezmurs
  getMezmurs: async () => {
    const response = await api.get("/mezmurs");
    return response.data;
  },
  createMezmur: async (data) => {
    const response = await api.post("/mezmurs", data);
    return response.data;
  },
  updateMezmur: async (id, data) => {
    const response = await api.put(`/mezmurs/${id}`, data);
    return response.data;
  },
  deleteMezmur: async (id) => {
    const response = await api.delete(`/mezmurs/${id}`);
    return response.data;
  },

  // Ministry Assignments
  getAssignments: async () => {
    const response = await api.get("/ministry-assignments");
    return response.data;
  },
  getAssignmentById: async (id) => {
    const response = await api.get(`/ministry-assignments/${id}`);
    return response.data;
  },

  createAssignment: async (data) => {
    const response = await api.post("/ministry-assignments", data);
    return response.data;
  },
  updateAssignment: async (id, data) => {
    const response = await api.put(`/ministry-assignments/${id}`, data);
    return response.data;
  },
  deleteAssignment: async (id) => {
    const response = await api.delete(`/ministry-assignments/${id}`);
    return response.data;
  },
  addStudentsToAssignment: async (id, studentIds) => {
    const response = await api.post(`/ministry-assignments/${id}/students/add`, { student_ids: studentIds });
    return response.data;
  },
  removeStudentsFromAssignment: async (id, studentIds) => {
    const response = await api.post(`/ministry-assignments/${id}/students/remove`, { student_ids: studentIds });
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
  unassignStudent: async (studentId, categoryId) => {
    const response = await api.post("/students/mezmur/unassign", {
      student_id: studentId,
      mezmur_category_id: categoryId,
    });
    return response.data;
  }
};
