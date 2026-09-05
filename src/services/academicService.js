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

  // 🚀 New Role-Guarded Promotion Workflow APIs
  getPromotionCandidates: async (params = {}) => {
    const response = await api.get('/promotions/candidates', { params });
    return response.data;
  },

  nominateForPromotion: async (studentIds, targetSectionId = null, notes = "") => {
    const response = await api.post('/promotions/nominate', {
      student_ids: studentIds,
      target_section_id: targetSectionId,
      notes: notes,
    });
    return response.data;
  },

  approvePromotion: async (studentIds, notes = "") => {
    const response = await api.post('/promotions/approve', {
      student_ids: studentIds,
      notes: notes,
    });
    return response.data;
  },

  rejectPromotion: async (studentIds, reason = "") => {
    const response = await api.post('/promotions/reject', {
      student_ids: studentIds,
      reason: reason,
    });
    return response.data;
  },
  
  // Stubs for future implementation
  getAttendance: async () => {},
  markAttendance: async () => {}
};
