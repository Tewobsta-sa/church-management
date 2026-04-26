import { useState } from "react";
import { Upload, Download, X, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { gradeService } from "../../services/gradeService";

export default function BulkImportGrades({ courseId, courseName, sectionId, onClose, onSuccess }) {
  const { t } = useTranslation();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState([]);
  const [savedCount, setSavedCount] = useState(null);

  const handleDownloadTemplate = async () => {
    try {
      const blob = await gradeService.importTemplate(courseId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `grades-template-${courseName?.replace(/\s+/g, "_") || courseId}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setErrors([{ message: err.response?.data?.message || t("common.serverError") }]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    setErrors([]);
    setSavedCount(null);
    try {
      const res = await gradeService.importExcel(courseId, file, sectionId);
      setSavedCount(res?.saved_count ?? 0);
      if ((res?.errors || []).length) {
        setErrors(res.errors);
      } else {
        onSuccess?.();
      }
    } catch (err) {
      const data = err.response?.data;
      if (data?.errors && Array.isArray(data.errors)) {
        setErrors(data.errors);
      } else {
        setErrors([{ message: data?.message || t("common.serverError") }]);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-black text-slate-800">{t("grades.bulkImport.title")}</h2>
            <p className="text-sm text-slate-500 font-medium mt-1">{courseName}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-xl">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <button
            type="button"
            onClick={handleDownloadTemplate}
            className="flex items-center gap-2 text-sm font-bold text-brand-600 hover:text-brand-700"
          >
            <Download className="w-4 h-4" />
            {t("grades.bulkImport.downloadTemplate")}
          </button>

          <label className="flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed border-slate-200 rounded-2xl cursor-pointer hover:border-brand-300 hover:bg-brand-50/30 transition-all">
            <Upload className="w-8 h-8 text-slate-400" />
            <span className="text-sm font-bold text-slate-600">
              {file ? file.name : t("grades.bulkImport.chooseFile")}
            </span>
            <span className="text-xs text-slate-400 font-medium">CSV / XLSX</span>
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </label>

          {savedCount !== null && (
            <div className="p-4 bg-green-50 border border-green-100 rounded-xl flex items-start gap-3 text-green-800 text-sm font-bold">
              <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
              {t("grades.bulkImport.savedCount", { count: savedCount })}
            </div>
          )}

          {errors.length > 0 && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-700 text-sm">
              <div className="flex items-center gap-2 font-bold mb-2">
                <AlertCircle className="w-5 h-5" />
                {t("grades.bulkImport.errorsHeading")}
              </div>
              <ul className="list-disc pl-6 space-y-1 font-medium">
                {errors.map((e, i) => (
                  <li key={i}>
                    {e.row ? `Row ${e.row}: ` : ""}
                    {e.message || JSON.stringify(e)}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors"
            >
              {t("common.cancel")}
            </button>
            <button
              type="submit"
              disabled={!file || loading}
              className="flex-1 py-3 bg-gradient-to-r from-brand-600 to-brand-500 text-white rounded-xl font-bold shadow-lg shadow-brand-500/30 hover:-translate-y-0.5 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
              {t("grades.bulkImport.upload")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
