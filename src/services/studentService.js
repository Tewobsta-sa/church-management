import api from "./api";

export const studentService = {
  getYoungStudents: async (page = 1, search = "", filters = {}) => {
    const params = { page, search, ...filters };
    const response = await api.get("/students/young", { params });
    return response.data;
  },
  getYoungStudentById: async (id) => {
    const response = await api.get(`/students/young/${id}`);
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
    // track could be 'young', 'regular', 'distance'
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

  assignMezmur: async (studentIds) => {
    const response = await api.post("/students/mezmur/assign", { student_ids: studentIds });
    return response.data;
  },

  unassignMezmur: async (studentIds) => {
    const response = await api.post("/students/mezmur/unassign", { student_ids: studentIds });
    return response.data;
  }
};
