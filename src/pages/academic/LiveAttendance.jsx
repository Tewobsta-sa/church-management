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
} from "lucide-react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { useLocation, useNavigate } from "react-router-dom";
import { attendanceService } from "../../services/attendanceService";
import { assignmentService } from "../../services/assignmentService";
import { sectionService } from "../../services/sectionService";
import { useAuth } from "../../context/AuthContext";
import { formatDateTimeLLT } from "../../i18n/datetime";

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
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const assignmentId = queryParams.get("assignment_id");

  const isSuperAdmin = hasRole("super_admin");
  const isTmhrt = hasRole("tmhrt_office_admin");
  const isMezmur = hasRole("mezmur_office_admin");
  const isTeacher = hasRole("teacher");

  const canTakeLive = !isSuperAdmin && (isTmhrt || isMezmur || isTeacher);

  const canLiveForAssignment = (assign) => {
    if (!assign || !canTakeLive) return false;

    if ((isTmhrt || isTeacher) && assign.type === 'Course') {
      return true;
    }

    if (isMezmur && assign.type === 'MezmurTraining') {
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

  const [historyPage, setHistoryPage] = useState(1);
  const [historyData, setHistoryData] = useState([]);
  const [historyLastPage, setHistoryLastPage] = useState(1);
  const [historyLoading, setHistoryLoading] = useState(false);

  const scannerRef = useRef(null);
  const studentsRef = useRef([]);

  useEffect(() => {
    studentsRef.current = students;
  }, [students]);

  const fetchHistory = async (page = 1) => {
    setHistoryLoading(true);
    try {
      const res = await attendanceService.getAttendanceRecords({
        page,
        per_page: 25,
      });
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
      fetchHistory(historyPage);
    }
  }, [assignmentId, historyPage]);

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

      if (currentAssign.section_id) {
        const studentData = await sectionService.getSectionStudents(
          currentAssign.section_id,
        );
        setStudents(studentData || []);
      } else {
        setStudents([]);
      }

      const attendanceData = await attendanceService.getAttendanceRecords({
        assignment_id: assignmentId,
      });
      const existing = {};
      attendanceData.data?.forEach((r) => {
        existing[r.student_id] = r.status;
      });
      setRecords(existing);
    } catch (err) {
      console.error("Failed to fetch attendance data", err);
      setScanMessage(
        err.response?.data?.message || "Failed to load attendance session.",
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
      const backendMessage =
        err.response?.data?.message ||
        Object.values(err.response?.data?.errors || {})
          .flat()
          .join(", ") ||
        "Failed to mark attendance";
      alert(backendMessage);
      setScanMessage(backendMessage);
    }
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
        setScanMessage(`No student matched code: ${normalized}`);
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
                        {formatDateTimeLLT(row.marked_at)}
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
                              : row.status === "Absent"
                                ? "bg-red-100 text-red-800"
                                : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {row.status}
                        </span>
                      </td>
                      <td
                        className="px-4 py-3 text-slate-700 max-w-[200px] truncate"
                        title={assignmentLabel(row.assignment)}
                      >
                        {assignmentLabel(row.assignment)}
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

      {liveMode && mode === "qr" ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          <div className="glass-panel overflow-hidden p-8 border-brand-200 bg-brand-50/10">
            <div
              id="qr-reader"
              className="w-full rounded-3xl overflow-hidden [&>div]:!border-none [&>div]:!shadow-none shadow-2xl"
            />
            <div className="mt-8 flex items-center justify-center gap-4 text-brand-700">
              <UserCheck className="w-6 h-6 animate-pulse" />
              <p className="font-black uppercase text-xs tracking-widest">
                Awaiting scan…
              </p>
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
                {Object.values(records).filter((v) => v === "Present").length}{" "}
                present
              </span>
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
              {students.filter((s) => records[s.id] === "Present").length ===
              0 ? (
                <div className="p-20 text-center text-slate-400 font-bold uppercase text-[10px] tracking-[0.2em]">
                  No students scanned yet
                </div>
              ) : (
                students
                  .filter((s) => records[s.id] === "Present")
                  .reverse()
                  .map((s) => (
                    <div
                      key={s.id}
                      className="p-6 bg-green-50/30 flex justify-between items-center animate-[slide-in_0.3s_ease-out]"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-green-500 text-white rounded-full flex items-center justify-center font-bold">
                          {s.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-extrabold text-slate-800">
                            {s.name}
                          </p>
                          <p className="text-[10px] font-bold text-green-600 uppercase">
                            {s.student_id}
                          </p>
                        </div>
                      </div>
                      <CheckCircle className="w-6 h-6 text-green-500" />
                    </div>
                  ))
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
                <span className="w-2 h-2 rounded-full bg-green-500" /> Present
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-red-500" /> Absent
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-slate-200" /> Pending
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 p-8 gap-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
            {filteredStudents.map((s) => (
              <div
                key={s.id}
                className={`p-5 rounded-3xl border-2 text-left flex flex-col transition-all duration-300 relative group overflow-hidden ${
                  records[s.id] === "Present"
                    ? "bg-green-50 border-green-200"
                    : records[s.id] === "Absent"
                      ? "bg-red-50 border-red-200"
                      : "bg-white border-slate-100"
                }`}
              >
                <div className="flex justify-between items-start w-full mb-4 z-10">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg ${
                      records[s.id] === "Present"
                        ? "bg-green-500 text-white"
                        : records[s.id] === "Absent"
                          ? "bg-red-500 text-white"
                          : "bg-slate-100 text-slate-400"
                    }`}
                  >
                    {s.name.charAt(0)}
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
                        : records[s.id] === "Absent"
                          ? "text-red-900"
                          : "text-slate-800"
                    }`}
                  >
                    {s.name}
                  </h3>
                  <p
                    className={`text-[10px] font-bold mt-1 uppercase tracking-widest ${
                      records[s.id] === "Present"
                        ? "text-green-600/70"
                        : records[s.id] === "Absent"
                          ? "text-red-600/70"
                          : "text-slate-400"
                    }`}
                  >
                    {s.student_id}
                  </p>
                </div>

                <div className="absolute top-0 right-0 p-3">
                  {records[s.id] === "Present" && (
                    <CheckCircle className="w-6 h-6 text-green-500/30" />
                  )}
                  {records[s.id] === "Absent" && (
                    <XCircle className="w-6 h-6 text-red-500/30" />
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
