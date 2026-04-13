import api from "./api";

export const academicService = {
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
  
  // Stubs for future implementation
  getAttendance: async () => {},
  markAttendance: async () => {}
};
