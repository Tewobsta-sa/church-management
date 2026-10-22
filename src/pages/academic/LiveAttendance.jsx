import { useState, useEffect, useRef, useCallback } from "react";
import {
  Camera,
  Grid,
  CheckCircle,
  XCircle,
  Search,
  UserCheck,
  AlertCircle,
  ChevronLeft,
  ClipboardList,
  ChevronRight,
  Clock,
  Moon,
  Sun,
  CheckCheck,
  CheckSquare,
  Square,
  Shield,
  Download,
} from "lucide-react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { useLocation, useNavigate } from "react-router-dom";
import { attendanceService } from "../../services/attendanceService";
import { assignmentService } from "../../services/assignmentService";
import { sectionService } from "../../services/sectionService";
import { reportingService } from "../../services/reportingService";
import { useAuth } from "../../context/AuthContext";
import { useFeedback } from "../../context/FeedbackContext";
import { formatEthiopianDateTime } from "../../utils/ethiopianDate";
import { formatApiError } from "../../services/api";

function assignmentLabel(a) {
  if (!a) return "—";
  if (a.type === "Course") {
    const course = a.assignment_courses?.[0]?.course?.name;
    const sec = a.section?.name;
    return [course, sec].filter(Boolean).join(" · ") || `Course #${a.id}`;
  }
  const m = a.mezmurs?.[0]?.title;
  return m ? `Mezmur: ${m}` : `Training #${a.id}`;
}

export default function LiveAttendance() {
  const { hasRole } = useAuth();
  const { notify } = useFeedback();
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const assignmentId = queryParams.get("assignment_id");

  const isSuperAdmin = hasRole("super_admin");
  const isTmhrt = hasRole("tmhrt_kfl") || hasRole("tmhrt_office_admin");
  const isYesewHabt = hasRole("yesew_habt");
  const isMezmur = hasRole("mezmur_office_admin");
  const isTeacher = hasRole("teacher");

  const canTakeLive = isYesewHabt;

  const canLiveForAssignment = (assign) => {
    if (!assign || !canTakeLive) return false;

    if (isYesewHabt) {
      return true;
    }

    if (isMezmur && assign.type === "MezmurTraining") {
      return true;
    }

    return false;
  };

  const [mode, setMode] = useState("grid");
  const [assignment, setAssignment] = useState(null);
  const [students, setStudents] = useState([]);
  const [records, setRecords] = useState({});
  const [loading, setLoading] = useState(() => Boolean(assignmentId));
  const [search, setSearch] = useState("");
  const [scanMessage, setScanMessage] = useState("");
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [bulkLoading, setBulkLoading] = useState(false);

  const [historyPage, setHistoryPage] = useState(1);
  const [historyData, setHistoryData] = useState([]);
  const [historyLastPage, setHistoryLastPage] = useState(1);
  const [historyLoading, setHistoryLoading] = useState(false);

  const scannerRef = useRef(null);
  const studentsRef = useRef([]);

  useEffect(() => {
    studentsRef.current = students;
  }, [students]);

  const [historyShiftFilter, setHistoryShiftFilter] = useState("all");
  const [historySectionFilter, setHistorySectionFilter] = useState("all");
  const [historySections, setHistorySections] = useState([]);
  const [exportingCsv, setExportingCsv] = useState(false);
  const [availableAssignments, setAvailableAssignments] = useState([]);
  const [selectedLiveId, setSelectedLiveId] = useState("");

  // Load available schedules for live attendance on the web + sections for filtering
  useEffect(() => {
    const loadAssignments = async () => {
      try {
        const res = await assignmentService.getAssignments({ per_page: 100 });
        const list = Array.isArray(res) ? res : res?.data || [];
        setAvailableAssignments(list);
        if (list.length > 0) {
          setSelectedLiveId(String(list[0].id));
        }
      } catch (err) {
        console.error("Failed loading assignments for live attendance", err);
      }
    };
    const loadSections = async () => {
      try {
        const res = await sectionService.getSections(1, "", "");
        setHistorySections(res?.data || res || []);
      } catch (err) {
        console.error("Failed loading sections for attendance filter", err);
      }
    };
    loadAssignments();
    loadSections();
  }, []);

  const fetchHistory = async (page = 1, shift = historyShiftFilter, section = historySectionFilter) => {
    setHistoryLoading(true);
    try {
      const params = {
        page,
        per_page: 25,
      };
      if (shift && shift !== "all") {
        params.is_night = shift === "night";
      }
      if (section && section !== "all") {
        params.section_id = section;
      }
      const res = await attendanceService.getAttendanceRecords(params);
      setHistoryData(res.data || []);
      setHistoryLastPage(res.last_page || 1);
      setHistoryPage(res.current_page || page);
    } catch (err) {
      console.error("Failed to load attendance history", err);
      setHistoryData([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (!assignmentId) {
      fetchHistory(historyPage, historyShiftFilter, historySectionFilter);
    }
  }, [assignmentId, historyPage, historyShiftFilter, historySectionFilter]);

  const handleExportCsv = async () => {
    setExportingCsv(true);
    try {
      await reportingService.exportCSV("attendance", {
        section_id: historySectionFilter !== "all" ? historySectionFilter : undefined,
        is_night:
          historyShiftFilter !== "all"
            ? historyShiftFilter === "night"
            : undefined,
      });
      notify("Attendance CSV downloaded.", "success");
    } catch (err) {
      notify(formatApiError(err, "Failed to export attendance CSV."), "error");
    } finally {
      setExportingCsv(false);
    }
  };

  const fetchSessionData = async () => {
    if (!assignmentId) return;
    setLoading(true);
    try {
      let currentAssign = null;
      try {
        const assign = await assignmentService.getAssignments({
          q: assignmentId,
          per_page: 1,
        });
        currentAssign = Array.isArray(assign?.data)
          ? assign.data.find((a) => String(a.id) === String(assignmentId))
          : null;
      } catch (searchErr) {
        console.warn(
          "Assignment search failed, falling back to list fetch.",
          searchErr,
        );
        const fallback = await assignmentService.getAssignments();
        currentAssign = Array.isArray(fallback?.data)
          ? fallback.data.find((a) => String(a.id) === String(assignmentId))
          : null;
      }
      setAssignment(currentAssign);

      if (!currentAssign) {
        setStudents([]);
        setScanMessage(
          "Assignment not found. Open it from Schedules or history.",
        );
        return;
      }

      // Unified session students: handles Course & Mezmur, strictly filtering matching Day/Night shift
      const sessionData = await attendanceService.getSessionStudents(assignmentId);
      const studentList = sessionData?.students || [];
      setStudents(studentList);

      const existing = {};
      studentList.forEach((st) => {
        if (st.status && st.status !== "Unmarked") {
          existing[st.id] = st.status;
        }
      });
      setRecords(existing);
    } catch (err) {
      console.error("Failed to fetch attendance data", err);
      setScanMessage(
        formatApiError(err, "Failed to load attendance session."),
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (scannerRef.current) {
      scannerRef.current.clear().catch(() => {});
      scannerRef.current = null;
    }
    if (assignmentId) {
      fetchSessionData();
    }
  }, [assignmentId]);

  const liveMode = Boolean(
    assignmentId && assignment && canLiveForAssignment(assignment),
  );

  const handleMark = async (studentId, status) => {
    if (!liveMode) return;
    try {
      await attendanceService.markAttendance({
        assignment_id: Number(assignmentId),
        student_id: Number(studentId),
        status,
      });
      setRecords((prev) => ({ ...prev, [studentId]: status }));
      setScanMessage(`Marked ${status}.`);
    } catch (err) {
      const backendMessage = formatApiError(err, "Failed to mark attendance");
      notify(backendMessage, "error");
      setScanMessage(backendMessage);
    }
  };

  const toggleSelectStudent = (id) => {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (filtered) => {
    if (selectedStudentIds.length === filtered.length && filtered.length > 0) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(filtered.map((s) => s.id));
    }
  };

  const handleBulkMark = async (status, targetIds = null) => {
    if (!liveMode) return;
    const ids = targetIds || selectedStudentIds;
    if (!ids || ids.length === 0) return;

    try {
      setBulkLoading(true);
      const res = await attendanceService.bulkMarkAttendance({
        assignment_id: Number(assignmentId),
        student_ids: ids,
        status,
      });

      const updated = {};
      ids.forEach((sid) => {
        updated[sid] = status;
      });
      setRecords((prev) => ({ ...prev, ...updated }));
      setSelectedStudentIds([]);
      setScanMessage(res.message || `Marked ${ids.length} students as ${status}.`);
    } catch (err) {
      const backendMessage = formatApiError(err, "Failed to bulk mark attendance");
      notify(backendMessage, "error");
      setScanMessage(backendMessage);
    } finally {
      setBulkLoading(false);
    }
  };

  const handleMarkAllUnmarkedPresent = () => {
    const unmarked = students.filter(
      (s) => !records[s.id] || records[s.id] === "Unmarked"
    );
    if (unmarked.length === 0) {
      notify("All students are already marked for this session.", "info");
      return;
    }
    handleBulkMark("Present", unmarked.map((s) => s.id));
  };

  const onScanSuccess = useCallback(
    async (decodedText) => {
      if (!liveMode) return;
      const normalized = String(decodedText || "").trim();
      let candidateSid = normalized;
      let candidateId = normalized;

      if (normalized.startsWith("{") && normalized.endsWith("}")) {
        try {
          const parsed = JSON.parse(normalized);
          candidateSid = String(parsed?.sid ?? parsed?.student_id ?? "").trim();
          candidateId = String(parsed?.id ?? "").trim();
        } catch {
          // plain text
        }
      }

      const student = studentsRef.current.find(
        (s) =>
          (candidateSid && s.student_id === candidateSid) ||
          (candidateId && String(s.id) === candidateId) ||
          s.student_id === normalized ||
          String(s.id) === normalized,
      );

      if (student) {
        if (records[student.id] === "Present") return;
        await handleMark(student.id, "Present");
      } else if (normalized) {
        setScanMessage(`ተማሪው በክፍለ-ጊዜው ዝርዝር ውስጥ አልተገኘም (ወይም የፈረቃ ልዩነት አለ): ${normalized}`);
      }
    },
    [records, assignmentId, liveMode],
  );

  useEffect(() => {
    if (!liveMode || mode !== "qr" || scannerRef.current) return;

    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      false,
    );
    scanner.render(onScanSuccess, () => {});
    scannerRef.current = scanner;

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch((e) => console.error(e));
        scannerRef.current = null;
      }
    };
  }, [mode, onScanSuccess, liveMode]);

  const filteredStudents = students.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.student_id.toLowerCase().includes(search.toLowerCase()),
  );

  const readOnlySession = Boolean(assignmentId && assignment && !liveMode);

  if (!assignmentId) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-3">
            <ClipboardList className="w-8 h-8 text-brand-600" />
            Attendance records
          </h1>
          <p className="text-slate-500 font-medium mt-1">
            {isSuperAdmin && "All course and mezmur training sessions."}
            {isTmhrt && !isSuperAdmin && "Course schedule attendance only."}
            {isMezmur &&
              !isTmhrt &&
              !isSuperAdmin &&
              "Mezmur training attendance only."}
            {hasRole("teacher") &&
              !isTmhrt &&
              !isMezmur &&
              !isSuperAdmin &&
              "Course attendance you can view."}
          </p>
        </div>

        {canTakeLive && availableAssignments.length > 0 && (
          <div className="bg-brand-50 border border-brand-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4 shadow-sm">
            <div className="flex-1 w-full sm:w-auto">
              <label className="block text-[10px] font-black uppercase text-brand-700 mb-1">
                Take live attendance (የቀጥታ መገኘት ይመዝግቡ)
              </label>
              <select
                value={selectedLiveId}
                onChange={(e) => setSelectedLiveId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-brand-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 hover:border-brand-400 transition-all shadow-xs"
              >
                {availableAssignments.map((a) => (
                  <option key={a.id} value={a.id}>
                    {assignmentLabel(a)}
                    {a.is_night ? " · ማታ (Night)" : ""}
                    {a.start_time ? ` · ${a.start_time.slice(0, 5)}` : ""}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              disabled={!selectedLiveId}
              onClick={() =>
                navigate(`/attendance?assignment_id=${selectedLiveId}`)
              }
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm shadow-md disabled:opacity-50 disabled:hover:bg-brand-600"
            >
              Start live attendance
            </button>
          </div>
        )}

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase text-slate-500">ክፍል (Section):</span>
            <select
              value={historySectionFilter}
              onChange={(e) => {
                setHistorySectionFilter(e.target.value);
                setHistoryPage(1);
              }}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none hover:border-brand-400 focus:ring-2 focus:ring-brand-500/15 focus:border-brand-500 transition-all shadow-xs cursor-pointer"
            >
              <option value="all">ሁሉም ክፍሎች (All Sections)</option>
              {historySections.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                  {s.program_type?.name ? ` (${s.program_type.name})` : ""}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase text-slate-500">ፈረቃ (Shift):</span>
            <div className="inline-flex rounded-xl bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => setHistoryShiftFilter("all")}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                  historyShiftFilter === "all"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                ሁሉም (All)
              </button>
              <button
                type="button"
                onClick={() => setHistoryShiftFilter("day")}
                className={`flex items-center gap-1 px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                  historyShiftFilter === "day"
                    ? "bg-white text-amber-700 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Sun className="w-3.5 h-3.5 text-amber-500" />
                ቀን (Day)
              </button>
              <button
                type="button"
                onClick={() => setHistoryShiftFilter("night")}
                className={`flex items-center gap-1 px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                  historyShiftFilter === "night"
                    ? "bg-white text-indigo-700 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Moon className="w-3.5 h-3.5 text-indigo-500" />
                ማታ (Night)
              </button>
            </div>
          </div>
          </div>

          <button
            type="button"
            onClick={handleExportCsv}
            disabled={exportingCsv}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-brand-700 text-white rounded-xl font-black text-xs uppercase tracking-wider shadow-sm transition-all disabled:opacity-50 shrink-0"
            title="Download attendance records as CSV (honors section & shift filters)"
          >
            {exportingCsv ? (
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            {exportingCsv ? "Exporting..." : "Export CSV"}
          </button>
        </div>

        <div className="glass-panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-500">
                  <th className="px-4 py-3">Marked at</th>
                  <th className="px-4 py-3">Student</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Schedule</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {historyLoading ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-12 text-center text-slate-400 font-bold"
                    >
                      Loading…
                    </td>
                  </tr>
                ) : historyData.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-12 text-center text-slate-400 font-bold"
                    >
                      No attendance recorded yet
                    </td>
                  </tr>
                ) : (
                  historyData.map((row) => (
                    <tr
                      key={row.id}
                      className="hover:bg-slate-50/80 cursor-pointer"
                      onClick={() =>
                        navigate(
                          `/attendance?assignment_id=${row.assignment_id}`,
                        )
                      }
                    >
                      <td className="px-4 py-3 font-medium text-slate-700 whitespace-nowrap">
                        {row.marked_at
                          ? formatEthiopianDateTime(row.marked_at)
                          : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-800">
                          {row.student?.name}
                        </div>
                        <div className="text-xs text-slate-500">
                          {row.student?.student_id}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs font-black uppercase px-2 py-1 rounded-lg ${
                            row.status === "Present"
                              ? "bg-green-100 text-green-800"
                              : row.status === "Late"
                                ? "bg-amber-100 text-amber-900 border border-amber-300 font-black"
                                : row.status === "Absent"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {row.status}
                          {row.status === "Late" && row.late_minutes ? ` (${row.late_minutes}m)` : ""}
                        </span>
                      </td>
                      <td
                        className="px-4 py-3 text-slate-700 max-w-[200px]"
                        title={assignmentLabel(row.assignment)}
                      >
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="truncate">{assignmentLabel(row.assignment)}</span>
                          {row.assignment?.is_night && (
                            <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 shrink-0 flex items-center gap-0.5">
                              <Moon className="w-2.5 h-2.5" />
                              ማታ
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">
                        {row.assignment?.type === "MezmurTraining"
                          ? "Mezmur"
                          : "Course"}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {row.marked_by?.name || "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {historyLastPage > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50/50">
              <button
                type="button"
                disabled={historyPage <= 1 || historyLoading}
                onClick={() => setHistoryPage((p) => Math.max(1, p - 1))}
                className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-bold uppercase text-slate-600 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" /> Prev
              </button>
              <span className="text-xs font-bold text-slate-500">
                Page {historyPage} / {historyLastPage}
              </span>
              <button
                type="button"
                disabled={historyPage >= historyLastPage || historyLoading}
                onClick={() => setHistoryPage((p) => p + 1)}
                className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-bold uppercase text-slate-600 disabled:opacity-40"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        <p className="text-xs text-slate-400 font-medium">
          Tip: click a row to open that schedule and view details.
          {canTakeLive &&
            " Use Schedules to take live attendance for your programs."}
        </p>
      </div>
    );
  }

  if (!assignment && loading) {
    return (
      <div className="py-20 text-center text-slate-400 font-bold animate-pulse">
        Loading session…
      </div>
    );
  }

  if (!assignment && !loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-500">
        <AlertCircle className="w-16 h-16 mb-4 opacity-20" />
        <p className="font-bold text-lg">Session not found</p>
        <button
          onClick={() => navigate("/attendance")}
          className="mt-4 px-6 py-2 bg-brand-600 text-white rounded-xl font-bold"
        >
          Back to records
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <button
            onClick={() => navigate("/attendance")}
            className="flex items-center gap-1 text-xs font-black text-brand-600 uppercase tracking-widest mb-2 hover:translate-x-[-4px] transition-transform"
          >
            <ChevronLeft className="w-4 h-4" /> All attendance records
          </button>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-3 flex-wrap">
            {liveMode ? "Live presence" : "Attendance (view only)"}
            {assignment && (
              <span className="text-sm font-black bg-brand-50 text-brand-600 px-3 py-1 rounded-full border border-brand-100 uppercase">
                {assignment.type === "Course"
                  ? assignment.assignment_courses?.[0]?.course?.name
                  : "Mezmur"}
              </span>
            )}
            {assignment?.is_night && (
              <span className="text-sm font-black bg-indigo-100 text-indigo-900 px-3 py-1 rounded-full border border-indigo-200 uppercase flex items-center gap-1.5 shadow-xs">
                <Moon className="w-3.5 h-3.5 fill-indigo-900" />
                Night Shift (የማታ ፈረቃ)
              </span>
            )}
          </h1>
          <p className="text-slate-500 font-medium mt-1">
            {assignment?.section?.name || assignment?.trainer?.name || "—"}
            {readOnlySession && isSuperAdmin && (
              <span className="ml-2 text-amber-700 font-bold text-xs uppercase">
                Super admin: view only
              </span>
            )}
          </p>
        </div>
        {liveMode && (
          <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-slate-200">
            <button
              type="button"
              onClick={() => setMode("grid")}
              className={`px-5 py-2.5 text-sm font-bold rounded-xl flex items-center gap-2 transition-all ${
                mode === "grid"
                  ? "bg-brand-50 text-brand-600 shadow-sm"
                  : "text-slate-500 hover:bg-slate-50"
              }`}
            >
              <Grid className="w-4 h-4" /> Manual grid
            </button>
            <button
              type="button"
              onClick={() => setMode("qr")}
              className={`px-5 py-2.5 text-sm font-bold rounded-xl flex items-center gap-2 transition-all ${
                mode === "qr"
                  ? "bg-brand-50 text-brand-600 shadow-sm"
                  : "text-slate-500 hover:bg-slate-50"
              }`}
            >
              <Camera className="w-4 h-4" /> QR scanner
            </button>
          </div>
        )}
      </div>

      {mode === "qr" && liveMode ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="glass-panel p-6 flex flex-col items-center justify-center min-h-[500px]">
            <div
              id="qr-reader"
              className="w-full max-w-sm rounded-2xl overflow-hidden border-2 border-brand-500 shadow-2xl"
            />
            <div className="mt-6 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
              <span className="w-2 h-2 rounded-full bg-brand-500 animate-ping" />
              <p>Awaiting scan…</p>
            </div>
            {scanMessage && (
              <p className="mt-4 text-center text-xs font-bold text-slate-600">
                {scanMessage}
              </p>
            )}
          </div>

          <div className="glass-panel overflow-hidden flex flex-col h-[600px]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs">
                Recent scans
              </h3>
              <span className="text-xs font-black text-brand-600 bg-brand-50 px-3 py-1 rounded-full">
                {Object.values(records).filter((v) => v === "Present" || v === "Late").length}{" "}
                marked
              </span>
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
              {students.filter((s) => records[s.id] === "Present" || records[s.id] === "Late").length ===
              0 ? (
                <div className="p-20 text-center text-slate-400 font-bold uppercase text-[10px] tracking-[0.2em]">
                  No students scanned yet
                </div>
              ) : (
                students
                  .filter((s) => records[s.id] === "Present" || records[s.id] === "Late")
                  .reverse()
                  .map((s) => {
                    const isLate = records[s.id] === "Late";
                    return (
                      <div
                        key={s.id}
                        className={`p-6 flex justify-between items-center animate-[slide-in_0.3s_ease-out] ${
                          isLate ? "bg-amber-50/50" : "bg-green-50/30"
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                              isLate ? "bg-amber-500" : "bg-green-500"
                            }`}
                          >
                            {s.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-extrabold text-slate-800">
                              {s.name}
                            </p>
                            <p
                              className={`text-[10px] font-bold uppercase ${
                                isLate ? "text-amber-700" : "text-green-600"
                              }`}
                            >
                              {s.student_id} {isLate ? "· LATE" : ""}
                            </p>
                          </div>
                        </div>
                        {isLate ? (
                          <Clock className="w-6 h-6 text-amber-500" />
                        ) : (
                          <CheckCircle className="w-6 h-6 text-green-500" />
                        )}
                      </div>
                    );
                  })
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="glass-panel overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-50/50">
            <div className="relative w-full md:w-96">
              <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name or ID…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl font-bold text-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all"
              />
            </div>
            <div className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500" /> Present (ተገኝቷል)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-blue-500" /> Excused (ፈቃድ)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-red-500" /> Absent (ቀርቷል)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-slate-200" /> Pending (ያልተመዘገበ)
              </span>
            </div>
          </div>

          {liveMode && (
            <div className="px-6 py-3 bg-slate-50 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleSelectAll(filteredStudents)}
                  className="inline-flex items-center gap-2 font-bold text-slate-700 hover:text-brand-600 transition-colors"
                >
                  {selectedStudentIds.length === filteredStudents.length && filteredStudents.length > 0 ? (
                    <CheckSquare className="w-4 h-4 text-brand-600" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-400" />
                  )}
                  <span>
                    {selectedStudentIds.length > 0
                      ? `${selectedStudentIds.length} Selected (የተመረጡ)`
                      : "Select All (ሁሉንም ምረጥ)"}
                  </span>
                </button>
                {selectedStudentIds.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedStudentIds([])}
                    className="text-[11px] text-slate-400 underline hover:text-slate-600"
                  >
                    Clear selection
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                {selectedStudentIds.length > 0 ? (
                  <>
                    <span className="text-[11px] font-black uppercase text-slate-400 mr-1">
                      Mark Selected:
                    </span>
                    <button
                      type="button"
                      disabled={bulkLoading}
                      onClick={() => handleBulkMark("Present")}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-sm transition-all disabled:opacity-50"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      Present (ተገኝቷል)
                    </button>
                    <button
                      type="button"
                      disabled={bulkLoading}
                      onClick={() => handleBulkMark("Excused")}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-sm transition-all disabled:opacity-50"
                    >
                      <Shield className="w-3.5 h-3.5" />
                      Excused (ፈቃድ)
                    </button>
                    <button
                      type="button"
                      disabled={bulkLoading}
                      onClick={() => handleBulkMark("Absent")}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-sm transition-all disabled:opacity-50"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      Absent (ቀርቷል)
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    disabled={bulkLoading}
                    onClick={handleMarkAllUnmarkedPresent}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-brand-50 border border-brand-200 text-brand-700 hover:bg-brand-100 font-bold shadow-sm transition-all"
                  >
                    <CheckCheck className="w-4 h-4 text-brand-600" />
                    Mark All Unmarked as Present (ቀሪዎችን በሙሉ ተገኝተዋል በል)
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 p-8 gap-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
            {filteredStudents.map((s) => (
              <div
                key={s.id}
                className={`p-5 rounded-3xl border-2 text-left flex flex-col transition-all duration-300 relative group overflow-hidden ${
                  selectedStudentIds.includes(s.id)
                    ? "ring-2 ring-brand-500 border-brand-400"
                    : ""
                } ${
                  records[s.id] === "Present"
                    ? "bg-green-50 border-green-200"
                    : records[s.id] === "Excused"
                      ? "bg-blue-50 border-blue-200"
                      : records[s.id] === "Absent"
                        ? "bg-red-50 border-red-200"
                        : "bg-white border-slate-100"
                }`}
              >
                <div className="flex justify-between items-start w-full mb-4 z-10">
                  <div className="flex items-center gap-2.5">
                    {liveMode && (
                      <button
                        type="button"
                        onClick={() => toggleSelectStudent(s.id)}
                        className="p-1 rounded-lg hover:bg-slate-200/60 transition-colors"
                      >
                        {selectedStudentIds.includes(s.id) ? (
                          <CheckSquare className="w-5 h-5 text-brand-600" />
                        ) : (
                          <Square className="w-5 h-5 text-slate-300" />
                        )}
                      </button>
                    )}
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg ${
                        records[s.id] === "Present"
                          ? "bg-green-500 text-white"
                          : records[s.id] === "Excused"
                            ? "bg-blue-500 text-white"
                            : records[s.id] === "Absent"
                              ? "bg-red-500 text-white"
                              : "bg-slate-100 text-slate-400"
                      }`}
                    >
                      {s.name.charAt(0)}
                    </div>
                  </div>
                  {liveMode && (
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => handleMark(s.id, "Present")}
                        title="Mark present"
                        className="p-1.5 bg-green-500 text-white rounded-lg hover:scale-110 mb-1"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMark(s.id, "Excused")}
                        title="Mark excused"
                        className="p-1.5 bg-blue-500 text-white rounded-lg hover:scale-110 mb-1"
                      >
                        <Shield className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMark(s.id, "Absent")}
                        title="Mark absent"
                        className="p-1.5 bg-red-500 text-white rounded-lg hover:scale-110 mb-1"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="z-10">
                  <h3
                    className={`font-black tracking-tight leading-tight truncate ${
                      records[s.id] === "Present"
                        ? "text-green-900"
                        : records[s.id] === "Excused"
                          ? "text-blue-900"
                          : records[s.id] === "Absent"
                            ? "text-red-900"
                            : "text-slate-800"
                    }`}
                  >
                    {s.name}
                  </h3>
                  <div className="flex items-center justify-between mt-1">
                    <p
                      className={`text-[10px] font-bold uppercase tracking-widest ${
                        records[s.id] === "Present"
                          ? "text-green-600/70"
                          : records[s.id] === "Excused"
                            ? "text-blue-600/70"
                            : records[s.id] === "Absent"
                              ? "text-red-600/70"
                              : "text-slate-400"
                      }`}
                    >
                      {s.student_id}
                    </p>
                    {records[s.id] && records[s.id] !== "Unmarked" && (
                      <span
                        className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                          records[s.id] === "Present"
                            ? "bg-green-100 text-green-800 border border-green-200"
                            : records[s.id] === "Excused"
                              ? "bg-blue-100 text-blue-800 border border-blue-200"
                              : "bg-red-100 text-red-800 border border-red-200"
                        }`}
                      >
                        {records[s.id]}
                      </span>
                    )}
                  </div>
                </div>

                <div className="absolute top-0 right-0 p-3 pointer-events-none">
                  {records[s.id] === "Present" && (
                    <CheckCircle className="w-6 h-6 text-green-500/20" />
                  )}
                  {records[s.id] === "Excused" && (
                    <Shield className="w-6 h-6 text-blue-500/20" />
                  )}
                  {records[s.id] === "Absent" && (
                    <XCircle className="w-6 h-6 text-red-500/20" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
