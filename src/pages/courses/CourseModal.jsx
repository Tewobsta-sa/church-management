import { useEffect, useState, useMemo } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { courseService } from "../../services/courseService";
import { sectionService } from "../../services/sectionService";
import { translateTrack } from "../../i18n/tracks";

export default function CourseModal({ isOpen, onClose, course = null, onSuccess }) {
  const { t } = useTranslation();
  const isEdit = !!course;

  const [name, setName] = useState("");
  const [creditHour, setCreditHour] = useState(3);
  const [duration, setDuration] = useState(16);
  const [programTypeName, setProgramTypeName] = useState("");
  const [assessments, setAssessments] = useState([]);
  const [programTypes, setProgramTypes] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    sectionService.getProgramTypes().then((data) => {
      setProgramTypes(Array.isArray(data) ? data : data?.data || []);
    }).catch(() => setProgramTypes([]));
  }, [isOpen]);

  useEffect(() => {
    setErrorMsg(null);
    if (course) {
      setName(course.name || "");
      setCreditHour(course.credit_hour || 3);
      setDuration(course.duration || 16);
      setProgramTypeName(course.program_type?.name || course.programType?.name || "");
      setAssessments(
        (course.assessments || []).map((a) => ({
          id: a.id,
          title: a.title,
          max_score: a.max_score,
          weight: a.weight,
          type: a.type || "",
        }))
      );
    } else {
      setName("");
      setCreditHour(3);
      setDuration(16);
      setProgramTypeName("");
      setAssessments([
        { title: "Mid Exam", max_score: 30, weight: 30, type: "exam" },
        { title: "Assignment", max_score: 20, weight: 20, type: "assignment" },
        { title: "Final Exam", max_score: 50, weight: 50, type: "exam" },
      ]);
    }
  }, [course, isOpen]);

  const totalWeight = useMemo(
    () => assessments.reduce((acc, a) => acc + (Number(a.weight) || 0), 0),
    [assessments]
  );

  const addAssessment = () => {
    setAssessments((prev) => [...prev, { title: "", max_score: 10, weight: 0, type: "" }]);
  };

  const removeAssessment = (idx) => {
    setAssessments((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateAssessment = (idx, field, value) => {
    setAssessments((prev) =>
      prev.map((a, i) =>
        i === idx
          ? {
              ...a,
              [field]: field === "title" || field === "type" ? value : Number(value),
            }
          : a
      )
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);

    if (Math.abs(totalWeight - 100) > 0.01) {
      setErrorMsg(t("courses.assessments.weightsMustSum", { sum: totalWeight }));
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name,
        credit_hour: Number(creditHour),
        duration: Number(duration),
        program_type_name: programTypeName,
        assessments: assessments.map((a) => ({
          ...(a.id ? { id: a.id } : {}),
          title: a.title,
          max_score: Number(a.max_score),
          weight: Number(a.weight),
          type: a.type || null,
        })),
      };
      if (isEdit) {
        await courseService.update(course.id, payload);
      } else {
        await courseService.create(payload);
      }
      onSuccess?.();
      onClose();
    } catch (err) {
      const errs = err.response?.data?.errors;
      setErrorMsg(
        errs
          ? Object.values(errs).flat().join("\n")
          : err.response?.data?.message || t("common.serverError")
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
          <h2 className="text-xl font-bold text-slate-800">
            {isEdit ? t("courses.editCourse") : t("courses.createCourse")}
          </h2>
          <button onClick={onClose} className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-widest mb-1">{t("courses.fields.name")}</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-widest mb-1">{t("courses.fields.creditHour")}</label>
              <input
                type="number"
                min={1}
                value={creditHour}
                onChange={(e) => setCreditHour(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-widest mb-1">{t("courses.fields.duration")}</label>
              <input
                type="number"
                min={1}
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-widest mb-1">{t("courses.fields.programType")}</label>
              <select
                value={programTypeName}
                onChange={(e) => setProgramTypeName(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 bg-white"
              >
                <option value="">{t("common.select")}…</option>
                {programTypes.map((pt) => (
                  <option key={pt.id} value={pt.name}>{translateTrack(t, pt.name)}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-widest">
                  {t("courses.assessments.title")}
                </h3>
                <p className="text-xs text-slate-500 mt-1">{t("courses.assessments.subtitle")}</p>
              </div>
              <button
                type="button"
                onClick={addAssessment}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-brand-700 bg-brand-50 border border-brand-200 rounded-lg hover:bg-brand-100"
              >
                <Plus className="w-4 h-4" />
                {t("courses.assessments.add")}
              </button>
            </div>

            {assessments.length === 0 ? (
              <p className="text-sm text-slate-500 bg-slate-50 rounded-lg px-4 py-3 text-center">
                {t("courses.assessments.empty")}
              </p>
            ) : (
              <div className="space-y-2">
                <div className="hidden md:grid md:grid-cols-[2fr_1.5fr_1fr_1fr_auto] gap-2 px-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <div>{t("courses.assessments.titleField")}</div>
                  <div>{t("courses.assessments.typeField")}</div>
                  <div>{t("courses.assessments.maxScore")}</div>
                  <div>{t("courses.assessments.weight")}</div>
                  <div />
                </div>
                {assessments.map((a, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-1 md:grid-cols-[2fr_1.5fr_1fr_1fr_auto] gap-2 bg-slate-50 rounded-lg px-2 py-2"
                  >
                    <input
                      type="text"
                      value={a.title}
                      required
                      placeholder={t("courses.assessments.titleField")}
                      onChange={(e) => updateAssessment(idx, "title", e.target.value)}
                      className="px-2 py-1.5 bg-white border border-slate-200 rounded-md text-sm"
                    />
                    <input
                      type="text"
                      value={a.type}
                      placeholder={t("courses.assessments.typeField")}
                      onChange={(e) => updateAssessment(idx, "type", e.target.value)}
                      className="px-2 py-1.5 bg-white border border-slate-200 rounded-md text-sm"
                    />
                    <input
                      type="number"
                      min={1}
                      value={a.max_score}
                      required
                      onChange={(e) => updateAssessment(idx, "max_score", e.target.value)}
                      className="px-2 py-1.5 bg-white border border-slate-200 rounded-md text-sm"
                    />
                    <input
                      type="number"
                      min={0}
                      max={100}
                      step="0.01"
                      value={a.weight}
                      required
                      onChange={(e) => updateAssessment(idx, "weight", e.target.value)}
                      className="px-2 py-1.5 bg-white border border-slate-200 rounded-md text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => removeAssessment(idx)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <div
                  className={`flex justify-between px-2 pt-2 text-sm font-semibold ${
                    Math.abs(totalWeight - 100) < 0.01 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  <span>{t("courses.assessments.totalWeight")}</span>
                  <span>{totalWeight}%</span>
                </div>
              </div>
            )}
          </div>

          {errorMsg && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 whitespace-pre-line">
              {errorMsg}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
            >
              {t("common.cancel")}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-sm font-bold text-white bg-gradient-to-r from-brand-600 to-brand-500 rounded-lg shadow disabled:opacity-50"
            >
              {submitting ? t("common.saving") : t("common.save")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
