import api from "./api";

export const reportingService = {
  exportCSV: async (type) => {
    const response = await api.get(`/reports/export/${type}`, {
      responseType: 'blob',
    });
    
    // Create a link and trigger download
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${type}_report_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  }
};
