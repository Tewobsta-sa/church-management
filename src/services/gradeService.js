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
};
