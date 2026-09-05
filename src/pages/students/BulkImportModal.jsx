import { useState } from "react";
import { X, Upload, Download, FileSpreadsheet, CheckCircle2, AlertCircle, Info } from "lucide-react";
import { useTranslation } from "react-i18next";
import { studentService } from "../../services/studentService";

export default function BulkImportModal({ isOpen, onClose, track = "Regular", onSuccess }) {
  const { t } = useTranslation();
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  if (!isOpen) return null;

  const handleDownloadTemplate = async () => {
    try {
      const blob = await studentService.downloadImportTemplate(track);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `students-registration-template.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || "Template download failed");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setResult(null);
    if (!file) {
      setErrorMsg("Please select a valid CSV or XLSX file to upload.");
      return;
    }
    setIsSubmitting(true);
    try {
      const data = await studentService.bulkImport(file);
      setResult(data);
      if (data?.created_count > 0) {
        onSuccess?.();
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Failed to import file.");
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
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-[fade-in_0.2s_ease-out]">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-7 py-5 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-50 flex items-center justify-center text-brand-600 border border-brand-100 font-bold">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-800">
                Bulk Student Import
              </h2>
              <p className="text-xs uppercase tracking-wider text-brand-600 font-bold mt-0.5">
                Target Track: {track}
              </p>
            </div>
          </div>
          <button
            onClick={close}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-7 py-6 space-y-5 custom-scrollbar">
          {/* Download Template Banner */}
          <div className="p-4 bg-brand-50/70 border border-brand-100 rounded-2xl flex items-start justify-between gap-4">
            <div>
              <h4 className="text-xs font-black text-brand-900 uppercase tracking-wide">
                Download Official CSV Template
              </h4>
              <p className="text-xs text-brand-700/80 font-medium mt-0.5">
                The template includes clear <strong className="text-brand-900">[MANDATORY]</strong> and <strong className="text-brand-900">[OPTIONAL]</strong> tags with sample values.
              </p>
            </div>
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-brand-700 bg-white hover:bg-brand-100 border border-brand-200 rounded-xl shrink-0 shadow-sm transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              Template CSV
            </button>
          </div>

          {/* Guidelines box */}
          <div className="text-xs text-slate-600 space-y-1.5 bg-slate-50 p-4 rounded-2xl border border-slate-200/80 font-medium">
            <p className="font-bold text-slate-800 flex items-center gap-1.5 mb-1 text-[11px] uppercase tracking-wider">
              <Info className="w-3.5 h-3.5 text-brand-600" /> Key Required Columns:
            </p>
            <ul className="list-disc list-inside space-y-0.5 text-slate-500 pl-1">
              <li><strong>name*</strong>, <strong>sex*</strong> (Male/Female), <strong>education_level*</strong></li>
              <li><strong>family_guardian_name*</strong> & <strong>family_guardian_phone*</strong></li>
              <li><strong>subcity*</strong>, <strong>woreda*</strong>, and <strong>section_name*</strong></li>
              <li>Optional: birth_date, grade_level, school/office, kebele, house_no, status</li>
            </ul>
          </div>

          {/* File Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Select CSV or Excel Spreadsheet (.csv, .xlsx)
            </label>
            <input
              type="file"
              accept=".csv,.xlsx,.xls,text/csv"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="block w-full text-xs text-slate-600 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-brand-600 file:text-white hover:file:bg-brand-700 cursor-pointer border border-slate-200 rounded-2xl p-2 bg-slate-50"
            />
          </div>

          {errorMsg && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl p-3 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {result && (
            <div className="rounded-2xl border border-slate-200 overflow-hidden text-xs">
              <div
                className={`px-4 py-2.5 font-bold ${
                  result.created_count > 0
                    ? "bg-emerald-50 text-emerald-800 border-b border-emerald-100 flex items-center gap-1.5"
                    : "bg-red-50 text-red-800 border-b border-red-100 flex items-center gap-1.5"
                }`}
              >
                {result.created_count > 0 ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Successfully imported {result.created_count} student(s)!
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    Import Failed - Please fix the row errors below
                  </>
                )}
              </div>

              {Array.isArray(result.errors) && result.errors.length > 0 && (
                <div className="p-4 bg-slate-50 max-h-48 overflow-y-auto space-y-1 custom-scrollbar">
                  <p className="font-bold text-slate-700 mb-1">Validation issues found:</p>
                  <ul className="list-disc list-inside space-y-1 text-red-600 text-[11px]">
                    {result.errors.slice(0, 30).map((err, i) => (
                      <li key={i}>
                        Row {err.row}: {Array.isArray(err.errors) ? err.errors.join("; ") : err.message}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={close}
              className="px-5 py-2.5 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !file}
              className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-black text-white bg-gradient-to-r from-brand-600 to-brand-500 rounded-xl shadow-lg shadow-brand-500/20 disabled:opacity-50 transition-all uppercase tracking-wider"
            >
              <Upload className="w-4 h-4" />
              {isSubmitting ? "Importing..." : "Start Import"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
