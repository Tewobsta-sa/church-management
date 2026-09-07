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
  },

  // 📱 Mobile Scanner endpoint
  scanAndMark: async (assignmentId, qrData, status = "Present") => {
    const response = await api.post("/attendance/scan-mark", {
      assignment_id: assignmentId,
      qr_data: qrData,
      status: status,
    });
    return response.data;
  },

  // 📋 Mobile Viewer session roster
  getSessionStudents: async (assignmentId) => {
    const response = await api.get("/attendance/session-students", {
      params: { assignment_id: assignmentId }
    });
    return response.data;
  }
};
