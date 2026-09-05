import api from "./api";

export const studentService = {
  getPreKGStudents: async (page = 1, search = "", filters = {}) => {
    const params = { page, search, ...filters };
    const response = await api.get("/students/prekg", { params });
    return response.data;
  },

  getRegularStudents: async (page = 1, search = "", filters = {}) => {
    const params = { page, search, ...filters };
    const response = await api.get("/students/regular", { params });
    return response.data;
  },

  getYoungStudents: async (page = 1, search = "", filters = {}) => {
    const params = { page, search, ...filters };
    const response = await api.get("/students/regular", { params });
    return response.data;
  },

  getDistanceStudents: async (page = 1, search = "", filters = {}) => {
    const params = { page, search, ...filters };
    const response = await api.get("/students/distance", { params });
    return response.data;
  },

  getAllStudents: async (page = 1, search = "", filters = {}) => {
    const params = { page, search, ...filters };
    const response = await api.get("/students/all", { params });
    return response.data;
  },

  createStudent: async (data, track = "regular") => {
    // If data is FormData, send multipart
    if (data instanceof FormData) {
      const response = await api.post("/students/unified", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data;
    }
    const response = await api.post("/students/unified", { ...data, track });
    return response.data;
  },

  updateStudent: async (id, data, track = "regular") => {
    if (data instanceof FormData) {
      const response = await api.post(`/students/unified/${id}`, data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data;
    }
    const response = await api.put(`/students/unified/${id}`, data);
    return response.data;
  },

  deleteStudent: async (id) => {
    const response = await api.delete(`/students/${id}`);
    return response.data;
  },

  bulkUpdateStatus: async (studentIds, status = "regular") => {
    const response = await api.post("/students/bulk-status", {
      student_ids: studentIds,
      status,
    });
    return response.data;
  },

  getIdCardsData: async (params = {}) => {
    const response = await api.get("/students/id-cards/export", { params });
    return response.data;
  },

  verifyStudent: async (id) => {
    const response = await api.post(`/students/${id}/verify`);
    return response.data;
  },

  assignMezmur: async (studentIds) => {
    const response = await api.post("/students/mezmur/assign", {
      student_ids: studentIds,
    });
    return response.data;
  },

  unassignMezmur: async (studentIds) => {
    const response = await api.post("/students/mezmur/unassign", {
      student_ids: studentIds,
    });
    return response.data;
  },

  downloadImportTemplate: async (track = "Regular") => {
    const response = await api.get(`/students/import/template/${track}`, {
      responseType: "blob",
    });
    return response.data;
  },

  bulkImport: async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post("/students/import", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },
};
