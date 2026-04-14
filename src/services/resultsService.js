import api from "./api";

export const resultsService = {
  getSectionRankings: async (sectionId) => {
    const response = await api.get(`/sections/${sectionId}/rankings`);
    return response.data;
  },

  getStudentReport: async (studentId) => {
    const response = await api.get(`/students/${studentId}/totals`);
    return response.data;
  }
};
