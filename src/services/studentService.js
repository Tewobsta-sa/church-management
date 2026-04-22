import api from "./api";

export const studentService = {
  getYoungStudents: async (page = 1, search = "", filters = {}) => {
    const params = { page, search, ...filters };
    const response = await api.get("/students/young", { params });
    return response.data;
  },

  getRegularStudents: async (page = 1, search = "", filters = {}) => {
    const params = { page, search, ...filters };
    const response = await api.get("/students/regular", { params });
    return response.data;
  },

  getDistanceStudents: async (page = 1, search = "", filters = {}) => {
    const params = { page, search, ...filters };
    const response = await api.get("/students/distance", { params });
    return response.data;
  },

  createStudent: async (data, track) => {
    const response = await api.post(`/students/${track}`, data);
    return response.data;
  },

  updateStudent: async (id, data, track) => {
    const response = await api.put(`/students/${track}/${id}`, data);
    return response.data;
  },

  deleteStudent: async (id, track) => {
    const response = await api.delete(`/students/${track}/${id}`);
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

  /**
   * Download a CSV template for bulk import of a given track.
   * Returns a Blob which the caller can save as a file.
   */
  downloadImportTemplate: async (track) => {
    const response = await api.get(`/students/import/template/${track}`, {
      responseType: "blob",
    });
    return response.data;
  },

  /**
   * Upload a CSV/XLSX file to bulk-import students for a given track.
   * Returns the server response body (success + error rows).
   */
  bulkImport: async (file, track) => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post(`/students/import/${track}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },
};
