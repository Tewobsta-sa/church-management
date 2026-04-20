import { useEffect, useMemo, useState } from "react";
import { Search, Save, BookOpen } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/AuthContext";
import { courseService } from "../../services/courseService";
import { gradeService } from "../../services/gradeService";

/**
 * Letter grade based on percentage (0-100).
 */
function getLetterGrade(pct) {
  if (pct >= 90) return "A+";
  if (pct >= 85) return "A";
  if (pct >= 80) return "A-";
  if (pct >= 75) return "B+";
  if (pct >= 70) return "B";
  if (pct >= 65) return "B-";
  if (pct >= 60) return "C+";
  if (pct >= 50) return "C";
  if (pct >= 40) return "D";
  return "F";
}

function getGradeColor(grade) {
  if (grade.startsWith("A")) return "text-green-600 bg-green-50 border-green-200";
  if (grade.startsWith("B")) return "text-brand-600 bg-brand-50 border-brand-200";
  if (grade.startsWith("C")) return "text-amber-600 bg-amber-50 border-amber-200";
  return "text-red-600 bg-red-50 border-red-200";
}

export default function Grades() {
  const { t } = useTranslation();
  const { hasRole } = useAuth();
  const isTeacher = hasRole("teacher") && !hasRole("tmhrt_office_admin") && !hasRole("super_admin");

  const [myCourses, setMyCourses] = useState([]);
  const [selected, setSelected] = useState(null); // { course_id, section_id }

  const [assessments, setAssessments] = useState([]);
  const [students, setStudents] = useState([]);
  // grades[studentId][assessmentId] = score | ""
  const [grades, setGrades] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [search, setSearch] = useState("");

  // Load the teacher's courses (or admin view: all courses with assessments)
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        if (isTeacher) {
          const data = await gradeService.myCourses();
          setMyCourses(Array.isArray(data) ? data : data?.data || []);
        } else {
          const data = await courseService.list();
          const list = (Array.isArray(data) ? data : data?.data || []).map((c) => ({
            course_id: c.id,
            course_name: c.name,
            section_id: null,
            section_name: null,
            program_type: c.program_type?.name || c.programType?.name || "",
          }));
          setMyCourses(list);
        }
      } catch (err) {
        setError(err.response?.data?.message || t("common.serverError"));
      } finally {
        setLoading(false);
      }
    };
    load();
     
  }, [isTeacher]);

  // Auto-pick first course when list loads
  useEffect(() => {
    if (!selected && myCourses.length > 0) {
      const first = myCourses[0];
      setSelected({ course_id: first.course_id, section_id: first.section_id });
    }
  }, [myCourses, selected]);

  // When selected changes, load assessments + students
  useEffect(() => {
    if (!selected) return;
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        setSuccessMsg(null);
        const [assessRes, studentsRes] = await Promise.all([
          courseService.assessments(selected.course_id),
          courseService.courseStudents(selected.course_id, selected.section_id),
        ]);
        const assessList = Array.isArray(assessRes) ? assessRes : assessRes?.data || [];
        const studentList = studentsRes?.students || [];
        setAssessments(assessList);
        setStudents(studentList);

        // Build initial grades map from students[].grades[]
        const initial = {};
        studentList.forEach((s) => {
          initial[s.id] = {};
          (s.grades || []).forEach((g) => {
            initial[s.id][g.assessment_id] = g.score;
          });
        });
        setGrades(initial);
      } catch (err) {
        setError(err.response?.data?.message || t("common.serverError"));
      } finally {
        setLoading(false);
      }
    };
    load();
     
  }, [selected]);

  const totalWeight = useMemo(
    () => assessments.reduce((acc, a) => acc + (Number(a.weight) || 0), 0),
    [assessments]
  );

  const computeWeightedScore = (studentId) => {
    if (assessments.length === 0) return 0;
    let sum = 0;
    assessments.forEach((a) => {
      const raw = grades[studentId]?.[a.id];
      if (raw === undefined || raw === null || raw === "") return;
      const pct = Math.max(0, Math.min(1, Number(raw) / Number(a.max_score))) || 0;
      sum += pct * Number(a.weight);
    });
    return Math.round(sum * 100) / 100;
  };

  const handleGradeChange = (studentId, assessmentId, value) => {
    setGrades((prev) => ({
      ...prev,
      [studentId]: { ...(prev[studentId] || {}), [assessmentId]: value },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const payload = [];
      for (const s of students) {
        for (const a of assessments) {
          const value = grades[s.id]?.[a.id];
          if (value === undefined) continue;
          // Treat "" as deletion (null)
          payload.push({
            assessment_id: a.id,
            student_id: s.id,
            score: value === "" ? null : Number(value),
          });
        }
      }
      if (payload.length === 0) {
        setError(t("grades.noChanges"));
        return;
      }
      const res = await gradeService.saveBulk(payload);
      const okCount = res?.saved_count ?? payload.length;
      const errs = res?.errors || [];
      if (errs.length > 0) {
        setError(
          errs
            .map((e) => `${e.assessment_id ?? ""}/${e.student_id ?? ""}: ${e.message || ""}`)
            .join("\n")
        );
      } else {
        setSuccessMsg(t("grades.savedCount", { count: okCount }));
      }
    } catch (err) {
      setError(err.response?.data?.message || t("common.serverError"));
    } finally {
      setSaving(false);
    }
  };

  const filteredStudents = useMemo(() => {
    if (!search) return students;
    const q = search.toLowerCase();
    return students.filter(
      (s) =>
        s.name?.toLowerCase().includes(q) ||
        s.student_id?.toLowerCase().includes(q)
    );
  }, [students, search]);

  const activeCourse = myCourses.find(
    (c) => c.course_id === selected?.course_id && c.section_id === selected?.section_id
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">{t("grades.title")}</h1>
          <p className="text-slate-500 font-medium mt-1">{t("grades.subtitle")}</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving || !selected || students.length === 0}
          className="flex items-center gap-2 bg-gradient-to-r from-brand-600 to-brand-500 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-brand-500/30 hover:-translate-y-0.5 transition-all disabled:opacity-50"
        >
          <Save className="w-5 h-5" />
          {saving ? t("common.saving") : t("grades.saveGrades")}
        </button>
      </div>

      <div className="glass-panel p-4 flex flex-wrap sm:flex-nowrap gap-4 items-center border-b-[3px] border-b-brand-500">
        <div className="flex items-center gap-3 mr-auto">
          <div className="w-12 h-12 bg-brand-50 rounded-xl flex items-center justify-center text-brand-600">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest leading-none mb-1">
              {t("grades.activeCourse")}
            </label>
            <select
              className="bg-transparent border-none outline-none font-black text-xl text-slate-800 p-0 cursor-pointer hover:text-brand-600 transition-colors"
              value={selected ? `${selected.course_id}:${selected.section_id ?? ""}` : ""}
              onChange={(e) => {
                const [cid, sid] = e.target.value.split(":");
                setSelected({
                  course_id: Number(cid),
                  section_id: sid ? Number(sid) : null,
                });
              }}
            >
              {myCourses.length === 0 ? (
                <option value="">{t("grades.noCourses")}</option>
              ) : (
                myCourses.map((c) => (
                  <option
                    key={`${c.course_id}:${c.section_id ?? ""}`}
                    value={`${c.course_id}:${c.section_id ?? ""}`}
                  >
                    {c.course_name}{c.section_name ? ` · ${c.section_name}` : ""}
                  </option>
                ))
              )}
            </select>
            {activeCourse?.program_type && (
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                {activeCourse.program_type}
              </p>
            )}
          </div>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={t("grades.searchStudent")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm font-medium bg-white outline-none focus:border-brand-500"
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 whitespace-pre-line">
          {error}
        </div>
      )}
      {successMsg && (
        <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-3">
          {successMsg}
        </div>
      )}

      {assessments.length > 0 && Math.abs(totalWeight - 100) > 0.01 && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-lg px-4 py-3">
          {t("grades.weightWarning", { sum: totalWeight })}
        </div>
      )}

      <div className="glass-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200/60 text-slate-500 text-xs uppercase tracking-widest font-bold">
                <th className="px-6 py-4">{t("grades.student")}</th>
                {assessments.map((a) => (
                  <th key={a.id} className="px-4 py-4 w-36">
                    {a.title}{" "}
                    <span className="text-slate-400 normal-case tracking-normal ml-1">
                      ({a.weight}% · /{a.max_score})
                    </span>
                  </th>
                ))}
                <th className="px-4 py-4 w-28 text-center">{t("grades.total")}</th>
                <th className="px-4 py-4 w-20 text-center">{t("grades.letter")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={assessments.length + 3} className="px-6 py-12 text-center text-slate-500">
                    {t("common.loading")}
                  </td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={assessments.length + 3} className="px-6 py-12 text-center text-slate-500">
                    {t("grades.noStudents")}
                  </td>
                </tr>
              ) : (
                filteredStudents.map((s) => {
                  const pct = computeWeightedScore(s.id);
                  const letter = getLetterGrade(pct);
                  return (
                    <tr key={s.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-800">{s.name}</p>
                        <p className="text-xs font-semibold text-slate-500">{s.student_id}</p>
                      </td>
                      {assessments.map((a) => (
                        <td key={a.id} className="px-4 py-4">
                          <input
                            type="number"
                            min={0}
                            max={a.max_score}
                            step="0.01"
                            value={
                              grades[s.id]?.[a.id] === undefined || grades[s.id]?.[a.id] === null
                                ? ""
                                : grades[s.id][a.id]
                            }
                            onChange={(e) => handleGradeChange(s.id, a.id, e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-center font-bold text-slate-700 outline-none focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-500/20 transition-all"
                          />
                        </td>
                      ))}
                      <td className="px-4 py-4 text-center">
                        <span className="text-xl font-black text-slate-800">{pct}</span>
                        <span className="text-xs font-bold text-slate-400">/100</span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className={`inline-flex items-center justify-center w-10 h-10 rounded-xl border text-xl font-black ${getGradeColor(letter)}`}>
                          {letter}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
