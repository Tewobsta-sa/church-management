import api from "./api";

export const academicService = {
  getCourses: async (params = {}) => {
    const response = await api.get("/courses", { params });
    return response.data;
  },

  getAssignments: async (params = {}) => {
    const response = await api.get("/assignments", { params });
    return response.data;
  },

  createAssignment: async (data) => {
    const response = await api.post("/assignments", data);
    return response.data;
  },

  updateAssignment: async (id, data) => {
    const response = await api.put(`/assignments/${id}`, data);
    return response.data;
  },

  deleteAssignment: async (id) => {
    const response = await api.delete(`/assignments/${id}`);
    return response.data;
  },

  verifyStudent: async (studentId) => {
    const response = await api.post(`/students/${studentId}/verify`);
    return response.data;
  },

  promoteYoung: async (studentIds) => {
     // Assuming the backend takes an array of student IDs
     const response = await api.post(`/promote/young`, { student_ids: studentIds });
     return response.data;
  },

  promoteRegular: async (studentIds) => {
     const response = await api.post(`/promote/regular`, { student_ids: studentIds });
     return response.data;
  },

  getAttendance: async (params = {}) => {
    const response = await api.get("/attendance", { params });
    return response.data;
  },

  markAttendance: async (payload) => {
    const response = await api.post("/attendance/mark", payload);
    return response.data;
  },

  getGrades: async (params = {}) => {
    const response = await api.get("/grades", { params });
    return response.data;
  },

  saveGrades: async (payload) => {
    const response = await api.post("/grades", payload);
    return response.data;
  },

  getCourseGrades: async (courseId) => {
    const response = await api.get(`/courses/${courseId}/grades`);
    return response.data;
  },

  deleteGrade: async (id) => {
    const response = await api.delete(`/grades/${id}`);
    return response.data;
  },
};
