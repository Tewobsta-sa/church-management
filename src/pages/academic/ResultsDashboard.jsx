import { useState, useEffect } from "react";
import {
  Trophy,
  Medal,
  Star,
  FileText,
  Filter,
  X,
  Printer,
  BookOpen,
  Layers,
} from "lucide-react";
import { resultsService } from "../../services/resultsService";
import { sectionService } from "../../services/sectionService";

export default function ResultsDashboard() {
  const [sections, setSections] = useState([]);
  const [selectedSection, setSelectedSection] = useState("");
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(false);

  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [selectedStudentReport, setSelectedStudentReport] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);

  const currentYear = new Date().getFullYear();

  useEffect(() => {
    const fetchSections = async () => {
      try {
        const data = await sectionService.getSections(1, "", "");

        const youngSections =
          data?.data?.filter((s) => s.program_type?.name === "Young") || [];

        setSections(youngSections);

        if (youngSections.length > 0) {
          setSelectedSection(youngSections[0].id);
        }
      } catch (err) {
        console.error("Failed to load sections", err);
      }
    };

    fetchSections();
  }, []);

  const fetchRankings = async () => {
    if (!selectedSection) return;

    setLoading(true);

    try {
      const data = await resultsService.getSectionRankings(selectedSection);
      setRankings(data || []);
    } catch (err) {
      console.error("Failed to load rankings", err);
      setRankings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRankings();
  }, [selectedSection]);

  const handleViewReport = async (studentId) => {
    setReportModalOpen(true);
    setReportLoading(true);

    try {
      const data = await resultsService.getStudentReport(studentId);

      // FETCH REAL COURSE GRADES
      const coursesWithAssessments = await Promise.all(
        data.courses.map(async (course) => {
          const courseGrades = await resultsService.getCourseGrades(
            course.course_id,
          );

          return {
            ...course,
            assessments: courseGrades.assessments,
          };
        }),
      );

      setSelectedStudentReport({
        ...data,
        courses: coursesWithAssessments,
      });
    } catch (err) {
      console.error(err);
      alert("Failed to load student report");
    } finally {
      setReportLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const top3 = rankings.slice(0, 3);
  const others = rankings.slice(3, 10);

  const reportData = selectedStudentReport?.courses
    ? selectedStudentReport.courses
    : selectedStudentReport?.course
      ? [selectedStudentReport.course]
      : selectedStudentReport?.assessments
        ? [
            {
              course_name: selectedStudentReport.course_name,
              assessments: selectedStudentReport.assessments,
            },
          ]
        : [];

  return (
    <div className="space-y-8 animate-[fade-in_0.3s_ease-out]">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-3">
            <Trophy className="w-8 h-8 text-amber-500" />
            Section Rankings
          </h1>
          <p className="text-slate-500 font-medium mt-1">
            Performance leaderboard for the Young Program sections
          </p>
        </div>

        <div className="flex items-center gap-4 bg-white p-2 rounded-2xl shadow-sm border border-slate-200">
          <Filter className="w-4 h-4 text-slate-400 ml-2" />
          <select
            value={selectedSection}
            onChange={(e) => setSelectedSection(e.target.value)}
            className="bg-transparent border-none outline-none font-bold text-slate-700 min-w-[180px] cursor-pointer"
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

      {/* Top 3 */}
      {rankings.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-end max-w-4xl mx-auto pt-10">
          {/* 2nd */}
          {top3[1] && (
            <div
              className="flex flex-col items-center group cursor-pointer"
              onClick={() => handleViewReport(top3[1].id)}
            >
              <div className="relative mb-4">
                <div className="w-24 h-24 bg-slate-200 rounded-full flex items-center justify-center text-slate-500 shadow-xl border-4 border-white">
                  <Medal className="w-12 h-12" />
                </div>
                <div className="absolute -top-2 -right-2 bg-slate-400 text-white w-8 h-8 rounded-full flex items-center justify-center font-black">
                  2
                </div>
              </div>
              <p className="font-black text-slate-800">{top3[1].name}</p>
              <p className="text-brand-600 font-black text-xl">
                {top3[1].overall_average}%
              </p>
            </div>
          )}

          {/* 1st */}
          {top3[0] && (
            <div
              className="flex flex-col items-center"
              onClick={() => handleViewReport(top3[0].id)}
            >
              <div className="relative mb-6">
                <div className="w-32 h-32 bg-amber-100 rounded-full flex items-center justify-center text-amber-500 shadow-2xl border-4 border-white">
                  <Trophy className="w-16 h-16" />
                </div>
                <Star className="absolute -top-8 left-1/2 -translate-x-1/2 text-amber-400 w-8 h-8" />
              </div>
              <p className="font-black text-slate-900 text-2xl">
                {top3[0].name}
              </p>
              <p className="text-amber-600 font-extrabold text-3xl">
                {top3[0].overall_average}%
              </p>
            </div>
          )}

          {/* 3rd */}
          {top3[2] && (
            <div
              className="flex flex-col items-center"
              onClick={() => handleViewReport(top3[2].id)}
            >
              <div className="relative mb-4">
                <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center text-orange-500 shadow-xl border-4 border-white">
                  <Medal className="w-10 h-10" />
                </div>
              </div>
              <p className="font-black text-slate-800">{top3[2].name}</p>
              <p className="text-orange-600 font-black text-lg">
                {top3[2].overall_average}%
              </p>
            </div>
          )}
        </div>
      )}

      {/* Leaderboard */}
      <div className="max-w-4xl mx-auto glass-panel overflow-hidden border-slate-200">
        <div className="px-8 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 className="font-black text-slate-800 uppercase tracking-widest text-sm flex items-center gap-2">
            <Layers className="w-4 h-4 text-brand-600" />
            Complete Leaderboard
          </h3>
        </div>

        <div className="divide-y divide-slate-100">
          {loading ? (
            <div className="p-12 text-center">Loading...</div>
          ) : (
            others.map((s, idx) => (
              <div key={s.id} className="px-8 py-5 flex justify-between">
                <div>
                  <p className="font-black text-slate-800">
                    {idx + 4}. {s.name}
                  </p>
                  <p className="text-xs text-slate-400">{s.student_id}</p>
                </div>

                <button onClick={() => handleViewReport(s.id)} className="p-2">
                  <FileText className="w-5 h-5" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Report Modal */}
      {reportModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-6">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="px-10 py-8 border-b border-slate-100 flex justify-between items-start">
              <div>
                <h2 className="text-3xl font-black text-slate-800">
                  Student Report Card
                </h2>
                <p className="text-sm font-bold text-brand-600 uppercase tracking-widest">
                  {selectedStudentReport?.student?.name}
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl"
                >
                  <Printer className="w-4 h-4" />
                  Print / Save PDF
                </button>

                <button onClick={() => setReportModalOpen(false)}>
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-10">
              {reportLoading ? (
                <div>Loading report...</div>
              ) : (
                <div className="space-y-8">
                  {/* Summary */}
                  <div className="bg-slate-900 rounded-3xl p-8 text-white">
                    <p className="text-slate-400 uppercase text-xs">
                      Academic Year {currentYear}
                    </p>
                    <h4 className="text-4xl font-black mt-2">
                      Overall Average: {selectedStudentReport?.overall_average}%
                    </h4>
                  </div>

                  {/* Table */}
                  <div className="overflow-x-auto rounded-2xl border border-slate-200">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-100">
                        <tr>
                          <th className="p-4 text-left">Course</th>
                          <th className="p-4 text-left">Assessment</th>
                          <th className="p-4 text-center">Score</th>
                          <th className="p-4 text-center">Max</th>
                          <th className="p-4 text-center">Weight</th>
                          <th className="p-4 text-center">%</th>
                        </tr>
                      </thead>

                      <tbody>
                        {selectedStudentReport?.courses?.map((course) =>
                          course.assessments?.map((a) =>
                            a.grades
                              ?.filter(
                                (g) =>
                                  g.student_id ===
                                  selectedStudentReport.student.id,
                              )
                              .map((g, idx) => (
                                <tr
                                  key={`${course.course_id}-${a.assessment_id}-${idx}`}
                                  className="border-t"
                                >
                                  <td className="p-4 font-bold">
                                    {course.course_name}
                                  </td>

                                  <td className="p-4">{a.assessment_title}</td>

                                  <td className="p-4 text-center">{g.score}</td>

                                  <td className="p-4 text-center">
                                    {a.max_score}
                                  </td>

                                  <td className="p-4 text-center">
                                    {a.weight}%
                                  </td>

                                  <td className="p-4 text-center">
                                    {((g.score / a.max_score) * 100).toFixed(1)}
                                    %
                                  </td>
                                </tr>
                              )),
                          ),
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
