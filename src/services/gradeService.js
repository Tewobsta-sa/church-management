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

  downloadTemplate: async (courseId, sectionId = null) => {
    const response = await api.get(`/courses/${courseId}/grades/template`, {
      params: sectionId ? { section_id: sectionId } : {},
      responseType: "blob",
    });
    return response.data;
  },

  importGrades: async (courseId, file) => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post(`/courses/${courseId}/grades/import`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },
};
