import api from "./api";

export const attendanceService = {
  markAttendance: async (data) => {
    // data: { assignment_id, student_id, status: 'Present'|'Absent'|'Excused' }
    const response = await api.post("/attendance/mark", data);
    return response.data;
  },

  getAttendanceRecords: async (params = {}) => {
    const response = await api.get("/attendance", { params });
    return response.data;
  }
};
