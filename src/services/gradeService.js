import api from "./api";

export const gradeService = {
  saveSingle: async ({ assessment_id, student_id, score }) => {
    const response = await api.post("/grades", { assessment_id, student_id, score });
    return response.data;
  },

  saveBulk: async (grades) => {
    const response = await api.post("/grades/bulk", { grades });
    return response.data;
  },

  myCourses: async () => {
    const response = await api.get("/teacher/my-courses");
    return response.data;
  },

  importTemplate: async (courseId) => {
    const response = await api.get(`/grades/import/template/${courseId}`, {
      responseType: "blob",
    });
    return response.data;
  },

  importExcel: async (courseId, file, sectionId = null) => {
    const fd = new FormData();
    fd.append("file", file);
    if (sectionId) fd.append("section_id", sectionId);
    const response = await api.post(`/grades/import/${courseId}`, fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },
};
