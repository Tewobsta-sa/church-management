import { useState } from "react";
import { X, Upload, Download, FileSpreadsheet } from "lucide-react";
import { useTranslation } from "react-i18next";
import { studentService } from "../../services/studentService";

const TRACK_TO_BACKEND = {
  young: "young",
  regular: "regular",
  distance: "distance",
};

export default function BulkImportModal({ isOpen, onClose, track = "young", onSuccess }) {
  const { t } = useTranslation();
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  if (!isOpen) return null;

  const handleDownloadTemplate = async () => {
    try {
      const blob = await studentService.downloadImportTemplate(TRACK_TO_BACKEND[track]);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${track}-students-template.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || "Download failed");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setResult(null);
    if (!file) {
      setErrorMsg(t("students.import.noFile"));
      return;
    }
    setIsSubmitting(true);
    try {
      const data = await studentService.bulkImport(file, TRACK_TO_BACKEND[track]);
      setResult(data);
      if (data?.created_count > 0) {
        onSuccess?.();
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || t("common.serverError"));
      if (err.response?.data?.errors) {
        setResult({ created_count: 0, errors: err.response.data.errors });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const close = () => {
    setFile(null);
    setResult(null);
    setErrorMsg(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center text-brand-600">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">{t("students.import.title")}</h2>
              <p className="text-xs uppercase tracking-widest text-brand-600 font-semibold mt-0.5">
                {t("students.import.track")}: {t(`students.track${track.charAt(0).toUpperCase() + track.slice(1)}`)}
              </p>
            </div>
          </div>
          <button onClick={close} className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <p className="text-sm text-slate-600">{t("students.import.description")}</p>

          <button
            type="button"
            onClick={handleDownloadTemplate}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-brand-700 bg-brand-50 hover:bg-brand-100 border border-brand-200 rounded-lg"
          >
            <Download className="w-4 h-4" />
            {t("students.import.downloadTemplate")}
          </button>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-widest mb-2">
              {t("students.import.file")}
            </label>
            <input
              type="file"
              accept=".csv,.xlsx,.xls,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="block w-full text-sm text-slate-700 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-bold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100"
            />
            <p className="text-xs text-slate-400 mt-1">{t("students.import.fileHint")}</p>
          </div>

          {errorMsg && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
              {errorMsg}
            </div>
          )}

          {result && (
            <div className="rounded-lg border border-slate-200 overflow-hidden">
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 text-sm font-semibold text-slate-700">
                {result.created_count > 0
                  ? t("students.import.successTitle")
                  : t("students.import.errorTitle")}
              </div>
              <div className="px-4 py-3 text-sm text-slate-600 space-y-2">
                <p>{t("students.import.successBody", { count: result.created_count || 0 })}</p>
                {Array.isArray(result.errors) && result.errors.length > 0 && (
                  <ul className="list-disc list-inside space-y-1 text-red-600 text-xs">
                    {result.errors.slice(0, 20).map((err, i) => (
                      <li key={i}>
                        {t("students.import.errorRow", { row: err.row })}: {err.message}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={close}
              className="px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
            >
              {t("common.close")}
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !file}
              className="inline-flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-gradient-to-r from-brand-600 to-brand-500 rounded-lg shadow disabled:opacity-50"
            >
              <Upload className="w-4 h-4" />
              {isSubmitting ? t("students.import.importing") : t("students.import.start")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
