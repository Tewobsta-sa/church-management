import api from "./api";

export const assignmentService = {
  getAssignments: async (params = {}) => {
    const response = await api.get("/assignments", { params });
    return response.data;
  },

  getSchedule: async (dayOfWeek = null) => {
    const params = dayOfWeek !== null ? { day_of_week: dayOfWeek } : {};
    const response = await api.get("/schedule", { params });
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
  }
};
