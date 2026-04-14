import api from "./api";

export const academicService = {
  verifyStudent: async (studentId) => {
    const response = await api.post(`/students/${studentId}/verify`);
    return response.data;
  },

  promoteYoung: async () => {
     const response = await api.post(`/promote/young`);
     return response.data;
  },

  promoteRegular: async () => {
     const response = await api.post(`/promote/regular`);
     return response.data;
  },

  bulkVerify: async (studentIds) => {
     const response = await api.post(`/students/bulk-verify`, { student_ids: studentIds });
     return response.data;
  },
  
  // Stubs for future implementation
  getAttendance: async () => {},
  markAttendance: async () => {}
};
