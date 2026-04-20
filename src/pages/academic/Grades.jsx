import { useState, useEffect, useMemo } from "react";
import { Search, Save, Filter, BookOpen, Layers } from "lucide-react";
import { sectionService } from "../../services/sectionService";
import { courseService } from "../../services/courseService";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";

export default function Grades() {
  const { hasRole } = useAuth();
  const canEdit = hasRole("tmhrt_office_admin") || hasRole("teacher");
  const isSuperAdmin = hasRole("super_admin");

  const [sections, setSections] = useState([]);
  const [selectedSection, setSelectedSection] = useState("");
  const [courses, setCourses] = useState([]);
  const [sectionCourses, setSectionCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [students, setStudents] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [gradesByStudent, setGradesByStudent] = useState({});
  const [pendingChanges, setPendingChanges] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const secRes = await sectionService.getSections(1, "", "");

        const fetchedSections = secRes?.data || [];
        setSections(fetchedSections);

        if (fetchedSections.length > 0) {
          const firstSectionId = String(fetchedSections[0].id);
          setSelectedSection(firstSectionId);

          const courseRes =
            await sectionService.getSectionCourses(firstSectionId);

          setCourses(Array.isArray(courseRes) ? courseRes : []);
        }
      } catch (err) {
        console.error("Failed to fetch initial data", err);
      }
    };
    fetchInitialData();
  }, []);

  useEffect(() => {
    const fetchStudents = async () => {
      if (!selectedSection || !selectedCourse) return;

      setLoading(true);

      try {
        let res;

        if (hasRole("teacher")) {
          res = await sectionService.getSectionStudents(selectedSection);
          setStudents(res || []);
        } else {
          // admin can still view whole section
          res = await sectionService.getSectionStudents(selectedSection);
          setStudents(res || []);
        }
      } catch (err) {
        console.error("Failed to fetch students", err);
        setStudents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, [selectedSection, selectedCourse]);

  useEffect(() => {
    const fetchSectionCourses = async () => {
      if (!selectedSection) {
        setSectionCourses([]);
        setSelectedCourse("");
        return;
      }

      try {
        const assigned =
          await sectionService.getSectionCourses(selectedSection);

        const courseList = Array.isArray(assigned) ? assigned : [];

        setSectionCourses(courseList);
        setCourses(courseList);

        if (courseList.length > 0) {
          setSelectedCourse(String(courseList[0].id));
        } else {
          setSelectedCourse("");
        }
      } catch (err) {
        console.error("Failed to fetch section courses", err);
        setSectionCourses([]);
        setSelectedCourse("");
      }
    };

    fetchSectionCourses();
  }, [selectedSection]);

  useEffect(() => {
    const fetchCourseGrades = async () => {
      if (!selectedCourse) {
        setAssessments([]);
        setGradesByStudent({});
        setPendingChanges({});
        return;
      }

      setLoading(true);
      try {
        const res = await api.get(`/courses/${selectedCourse}/grades`);
        const courseAssessments = res.data?.assessments || [];
        setAssessments(courseAssessments);

        const byStudent = {};
        courseAssessments.forEach((assessment) => {
          (assessment.grades || []).forEach((grade) => {
            if (!byStudent[grade.student_id]) byStudent[grade.student_id] = {};
            byStudent[grade.student_id][assessment.assessment_id] = Number(
              grade.score,
            );
          });
        });
        setGradesByStudent(byStudent);
        setPendingChanges({});
      } catch (err) {
        console.error("Failed to fetch course grades", err);
        setAssessments([]);
        setGradesByStudent({});
      } finally {
        setLoading(false);
      }
    };

    fetchCourseGrades();
  }, [selectedCourse]);

  const availableCourses = useMemo(() => {
    const assignedIds = new Set(sectionCourses.map((c) => String(c.id)));
    return courses.filter((c) => assignedIds.has(String(c.id)));
  }, [courses, sectionCourses]);

  const handleGradeChange = (studentId, assessment, value) => {
    if (!canEdit) return;

    const key = `${studentId}-${assessment.assessment_id}`;
    const numVal = value === "" ? "" : Number(value);
    if (
      numVal !== "" &&
      (Number.isNaN(numVal) ||
        numVal < 0 ||
        numVal > Number(assessment.max_score))
    )
      return;

    setPendingChanges((prev) => ({ ...prev, [key]: numVal }));
  };

  const getLetterGrade = (total) => {
    if (total >= 90) return "A+";
    if (total >= 85) return "A";
    if (total >= 80) return "A-";
    if (total >= 75) return "B+";
    if (total >= 70) return "B";
    if (total >= 65) return "B-";
    if (total >= 60) return "C+";
    if (total >= 50) return "C";
    if (total >= 40) return "D";
    return "F";
  };

  const getGradeColor = (grade) => {
    if (grade.startsWith("A"))
      return "text-green-600 bg-green-50 border-green-200";
    if (grade.startsWith("B"))
      return "text-brand-600 bg-brand-50 border-brand-200";
    if (grade.startsWith("C"))
      return "text-amber-600 bg-amber-50 border-amber-200";
    return "text-red-600 bg-red-50 border-red-200";
  };

  const getCellValue = (studentId, assessmentId) => {
    const changeKey = `${studentId}-${assessmentId}`;
    if (Object.prototype.hasOwnProperty.call(pendingChanges, changeKey)) {
      return pendingChanges[changeKey];
    }
    return gradesByStudent?.[studentId]?.[assessmentId] ?? "";
  };

  const assessmentsWeightTotal = useMemo(
    () => assessments.reduce((sum, a) => sum + Number(a.weight || 0), 0),
    [assessments],
  );

  const computeWeightedTotal = (studentId) => {
    if (!assessments.length) return 0;

    let weightedPoints = 0;
    let totalWeights = 0;

    assessments.forEach((a) => {
      const weight = Number(a.weight || 0);
      const maxScore = Number(a.max_score || 0);
      const score = Number(getCellValue(studentId, a.assessment_id));

      totalWeights += weight;

      if (!Number.isNaN(score) && maxScore > 0 && weight > 0) {
        weightedPoints += (score / maxScore) * weight;
      }
    });

    // Normalize to 100 so grading stays consistent even if configured weights != 100.
    if (totalWeights <= 0) return 0;
    return Number(((weightedPoints / totalWeights) * 100).toFixed(2));
  };

  const filteredStudents = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return students;
    return students.filter(
      (s) =>
        (s.name || "").toLowerCase().includes(q) ||
        (s.student_id || "").toLowerCase().includes(q),
    );
  }, [students, search]);

  const hasPendingChanges = useMemo(
    () => Object.values(pendingChanges).some((v) => v !== ""),
    [pendingChanges],
  );

  const handlePublishGrades = async () => {
    if (!canEdit || saving) return;

    const payloads = Object.entries(pendingChanges)
      .filter(([, score]) => score !== "")
      .map(([key, score]) => {
        const [studentId, assessmentId] = key.split("-");
        return {
          student_id: Number(studentId),
          assessment_id: Number(assessmentId),
          score: Number(score),
        };
      });

    if (!payloads.length) {
      setMessage("No grade changes to publish.");
      return;
    }

    setSaving(true);
    setMessage("");
    try {
      await Promise.all(
        payloads.map((payload) => api.post("/grades", payload)),
      );
      setMessage("Grades published successfully.");
      setPendingChanges({});

      // Refresh latest saved grades from server
      const res = await api.get(`/courses/${selectedCourse}/grades`);
      const byStudent = {};
      (res.data?.assessments || []).forEach((assessment) => {
        (assessment.grades || []).forEach((grade) => {
          if (!byStudent[grade.student_id]) byStudent[grade.student_id] = {};
          byStudent[grade.student_id][assessment.assessment_id] = Number(
            grade.score,
          );
        });
      });
      setAssessments(res.data?.assessments || []);
      setGradesByStudent(byStudent);
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to publish grades.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">
            Academic Results
          </h1>
          <p className="text-slate-500 font-medium mt-1">
            {isSuperAdmin
              ? "View configured assessments and grade sheets"
              : "Manage grading sheets and compute final scores"}
          </p>
        </div>
        <button
          type="button"
          disabled={!canEdit || saving}
          onClick={handlePublishGrades}
          className="flex items-center gap-2 bg-gradient-to-r from-brand-600 to-brand-500 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-brand-500/30 hover:-translate-y-0.5 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <Save className="w-5 h-5" />
          {saving ? "Publishing..." : canEdit ? "Publish Grades" : "View Only"}
        </button>
      </div>
      {message && (
        <div className="text-sm font-bold text-slate-600 bg-slate-100 px-4 py-3 rounded-xl border border-slate-200">
          {message}
        </div>
      )}
      {canEdit && hasPendingChanges && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm font-bold text-amber-800 bg-amber-50 px-4 py-3 rounded-xl border border-amber-200">
          <span>You have unsaved grade changes.</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPendingChanges({})}
              className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 transition-colors"
            >
              Discard
            </button>
            <button
              type="button"
              onClick={handlePublishGrades}
              disabled={saving}
              className="px-4 py-2 rounded-lg bg-brand-600 text-white hover:bg-brand-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      )}
      {assessments.length > 0 && (
        <div
          className={`text-sm font-bold px-4 py-3 rounded-xl border ${Math.round(assessmentsWeightTotal) === 100 ? "text-green-700 bg-green-50 border-green-200" : "text-amber-700 bg-amber-50 border-amber-200"}`}
        >
          Assessment weights total: {Number(assessmentsWeightTotal.toFixed(2))}
          %.
          {Math.round(assessmentsWeightTotal) !== 100
            ? " Grades are normalized to /100 automatically."
            : ""}
        </div>
      )}

      <div className="glass-panel p-4 flex flex-wrap sm:flex-nowrap gap-8 items-center border-b-[3px] border-b-brand-500">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center text-brand-600">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">
              Section
            </label>
            <select
              disabled={hasRole("teacher")}
              className="bg-transparent border-none outline-none font-bold text-slate-700 p-0 cursor-pointer hover:text-brand-600 transition-colors"
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
            >
              <option value="">Select Section</option>
              {sections.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="w-px h-10 bg-slate-200 hidden sm:block"></div>

        <div className="flex items-center gap-3 mr-auto">
          <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-500">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">
              Active Course
            </label>
            <select
              disabled={hasRole("teacher")}
              className="bg-transparent border-none outline-none font-bold text-slate-700 p-0 cursor-pointer hover:text-brand-600 transition-colors"
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
            >
              <option value="">Select Course</option>
              {availableCourses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search student..."
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm font-medium bg-white outline-none focus:border-brand-500"
          />
        </div>
        <button className="p-2 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 bg-white">
          <Filter className="w-4 h-4" />
        </button>
      </div>

      <div className="glass-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200/60 text-slate-500 text-xs uppercase tracking-widest font-bold">
                <th className="px-6 py-4">Student</th>
                {assessments.map((assessment) => (
                  <th key={assessment.assessment_id} className="px-6 py-4 w-36">
                    {assessment.assessment_title}
                    <span className="text-slate-400 normal-case tracking-normal ml-1">
                      ({assessment.weight}% / {assessment.max_score})
                    </span>
                  </th>
                ))}
                <th className="px-6 py-4 w-32 text-center">Total Score</th>
                <th className="px-6 py-4 w-24 text-center">Grade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td
                    colSpan={Math.max(3, assessments.length + 3)}
                    className="px-6 py-12 text-center text-slate-400 font-bold animate-pulse"
                  >
                    Loading...
                  </td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td
                    colSpan={Math.max(3, assessments.length + 3)}
                    className="px-6 py-12 text-center text-slate-400 font-bold"
                  >
                    No students found in this section
                  </td>
                </tr>
              ) : availableCourses.length === 0 ? (
                <tr>
                  <td
                    colSpan={Math.max(3, assessments.length + 3)}
                    className="px-6 py-12 text-center text-slate-400 font-bold"
                  >
                    No course is assigned to this section
                  </td>
                </tr>
              ) : assessments.length === 0 ? (
                <tr>
                  <td
                    colSpan={Math.max(3, assessments.length + 3)}
                    className="px-6 py-12 text-center text-slate-400 font-bold"
                  >
                    No assessments configured for this course
                  </td>
                </tr>
              ) : (
                filteredStudents.map((s) => {
                  const total = computeWeightedTotal(s.id);
                  const letter = getLetterGrade(total);
                  return (
                    <tr
                      key={s.id}
                      className="hover:bg-slate-50/50 transition-colors group"
                    >
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-800">{s.name}</p>
                        <p className="text-xs font-semibold text-slate-500">
                          {s.student_id}
                        </p>
                      </td>
                      {assessments.map((assessment) => (
                        <td
                          key={`${s.id}-${assessment.assessment_id}`}
                          className="px-6 py-4"
                        >
                          <input
                            type="number"
                            max={assessment.max_score}
                            min="0"
                            disabled={!canEdit}
                            value={getCellValue(s.id, assessment.assessment_id)}
                            onChange={(e) =>
                              handleGradeChange(
                                s.id,
                                assessment,
                                e.target.value,
                              )
                            }
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-center font-bold text-slate-700 outline-none focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-500/20 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                          />
                        </td>
                      ))}
                      <td className="px-6 py-4 text-center">
                        <span className="text-xl font-black text-slate-800">
                          {total}
                        </span>
                        <span className="text-xs font-bold text-slate-400">
                          /100
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-flex items-center justify-center w-10 h-10 rounded-xl border text-xl font-black ${getGradeColor(letter)}`}
                        >
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
