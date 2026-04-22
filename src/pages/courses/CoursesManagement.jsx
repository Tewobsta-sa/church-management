import { useEffect, useMemo, useState } from "react";
import { Plus, Edit2, Trash2, Search, Filter, BookOpen } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/AuthContext";
import { courseService } from "../../services/courseService";
import { sectionService } from "../../services/sectionService";
import CourseModal from "./CourseModal";
import { translateTrack } from "../../i18n/tracks";

export default function CoursesManagement() {
  const { t } = useTranslation();
  const { hasRole } = useAuth();

  const [courses, setCourses] = useState([]);
  const [programTypes, setProgramTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [programFilter, setProgramFilter] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const canManage =
    hasRole("tmhrt_office_admin") ||
    hasRole("distance_admin") ||
    hasRole("super_admin");

  const fetchCourses = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await courseService.list();
      setCourses(Array.isArray(data) ? data : data?.data || []);
    } catch {
      setError(t("common.serverError"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
    sectionService
      .getProgramTypes()
      .then((data) => setProgramTypes(Array.isArray(data) ? data : data?.data || []))
      .catch(() => setProgramTypes([]));
     
  }, []);

  const filtered = useMemo(() => {
    return courses.filter((c) => {
      const matchesSearch =
        !search ||
        c.name?.toLowerCase().includes(search.toLowerCase());
      const matchesProgram =
        !programFilter ||
        c.program_type?.name === programFilter ||
        c.programType?.name === programFilter;
      return matchesSearch && matchesProgram;
    });
  }, [courses, search, programFilter]);

  const handleDelete = async (course) => {
    if (!window.confirm(t("courses.confirmDelete"))) return;
    try {
      await courseService.remove(course.id);
      fetchCourses();
    } catch (err) {
      alert(err.response?.data?.message || t("common.serverError"));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">{t("courses.title")}</h1>
          <p className="text-slate-500 font-medium mt-1">{t("courses.subtitle")}</p>
        </div>
        {canManage && (
          <button
            onClick={() => { setEditing(null); setModalOpen(true); }}
            className="flex items-center gap-2 bg-gradient-to-r from-brand-600 to-brand-500 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-brand-500/30 hover:-translate-y-0.5 transition-all"
          >
            <Plus className="w-5 h-5" />
            {t("courses.createCourse")}
          </button>
        )}
      </div>

      <div className="glass-panel p-3 flex flex-wrap sm:flex-nowrap gap-3 items-center">
        <div className="relative w-full sm:flex-1 max-w-sm">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
            <Search className="h-5 w-5" />
          </div>
          <input
            type="text"
            placeholder={t("common.search") + "…"}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-white/70 border border-slate-200 rounded-xl focus:border-brand-500 outline-none focus:ring-4 focus:ring-brand-500/10 transition-all text-sm font-medium"
          />
        </div>
        <div className="relative w-full sm:w-64">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
            <Filter className="h-4 w-4" />
          </div>
          <select
            value={programFilter}
            onChange={(e) => setProgramFilter(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white/70 border border-slate-200 rounded-xl focus:border-brand-500 outline-none focus:ring-4 focus:ring-brand-500/10 transition-all text-sm font-bold text-slate-700"
          >
            <option value="">{t("common.all")} {t("common.programType")}</option>
            {programTypes.map((pt) => (
              <option key={pt.id} value={pt.name}>{translateTrack(t, pt.name)}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="glass-panel overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-200/60 text-slate-500 text-sm tracking-wide">
              <th className="px-6 py-4 font-semibold">{t("courses.fields.name")}</th>
              <th className="px-6 py-4 font-semibold">{t("courses.fields.programType")}</th>
              <th className="px-6 py-4 font-semibold">{t("courses.fields.creditHour")}</th>
              <th className="px-6 py-4 font-semibold">{t("courses.assessments.title")}</th>
              <th className="px-6 py-4 font-semibold text-right">{t("common.actions")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan="5" className="text-center py-10 font-medium text-slate-500">{t("common.loading")}</td></tr>
            ) : error ? (
              <tr><td colSpan="5" className="text-center py-10 font-medium text-red-500">{error}</td></tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center py-10 font-medium text-slate-500">
                  <BookOpen className="mx-auto w-10 h-10 text-slate-300 mb-2" />
                  {t("courses.noCourses")}
                </td>
              </tr>
            ) : (
              filtered.map((course) => {
                const assessments = course.assessments || [];
                const weightsSum = assessments.reduce((a, b) => a + (Number(b.weight) || 0), 0);
                return (
                  <tr key={course.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-800">{course.name}</div>
                      <div className="text-xs font-semibold text-slate-400">
                        {t("courses.fields.duration")}: {course.duration}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-brand-50 text-brand-700 border border-brand-100">
                        {translateTrack(
                          t,
                          course.program_type?.name || course.programType?.name,
                        ) || "—"}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-600">{course.credit_hour}</td>
                    <td className="px-6 py-4">
                      {assessments.length === 0 ? (
                        <span className="text-xs text-slate-400">{t("common.none")}</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {assessments.map((a) => (
                            <span
                              key={a.id || a.title}
                              className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[11px] rounded"
                              title={`${a.title} · ${a.max_score} ${t("grades.maxShort")}`}
                            >
                              {a.title} {a.weight}%
                            </span>
                          ))}
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                              Math.abs(weightsSum - 100) < 0.01
                                ? "bg-green-50 text-green-700"
                                : "bg-red-50 text-red-700"
                            }`}
                          >
                            Σ {weightsSum}%
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {canManage && (
                        <div className="flex gap-2 justify-end opacity-70 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => { setEditing(course); setModalOpen(true); }}
                            className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
                            title={t("courses.editCourse")}
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(course)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                            title={t("courses.deleteCourse")}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <CourseModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        course={editing}
        onSuccess={fetchCourses}
      />
    </div>
  );
}
