import api from "./api";

export const reportingService = {
  /**
   * Export a CSV report. Optional params (section_id, status, type,
   * start_date, end_date, classification, track, is_night) are forwarded
   * to the backend export endpoint.
   */
  exportCSV: async (type, params = {}) => {
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(
        ([, v]) => v !== undefined && v !== null && v !== "" && v !== "all",
      ),
    );

    const response = await api.get(`/reports/export/${type}`, {
      params: cleanParams,
      responseType: "blob",
    });

    // Create a link and trigger download
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `${type}_report_${new Date().toISOString().slice(0, 10)}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};
