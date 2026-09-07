import { useState, useEffect, useMemo } from "react";
import { 
  Camera, 
  ArrowLeft, 
  Search, 
  Users, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Clock, 
  Filter, 
  RefreshCw,
  Sparkles,
  BookOpen,
  Calendar
} from "lucide-react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { attendanceService } from "../../services/attendanceService";
import { assignmentService } from "../../services/assignmentService";

export default function MobileAttendanceViewer() {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const initialAssignmentId = queryParams.get("assignment_id");

  const [assignments, setAssignments] = useState([]);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState(initialAssignmentId || "");
  const [sessionData, setSessionData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // 'all', 'Present', 'Absent', 'Excused', 'Unmarked'

  // Load assignments list
  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        const res = await assignmentService.getAssignments();
        const list = Array.isArray(res) ? res : res?.data || [];
        setAssignments(list);
        if (!selectedAssignmentId && list.length > 0) {
          setSelectedAssignmentId(list[0].id.toString());
        }
      } catch (err) {
        console.error("Failed loading assignments", err);
      }
    };
    fetchAssignments();
  }, []);

  // Fetch session students whenever selectedAssignmentId changes
  const fetchSessionRoster = async () => {
    if (!selectedAssignmentId) return;
    setLoading(true);
    try {
      const res = await attendanceService.getSessionStudents(selectedAssignmentId);
      setSessionData(res);
    } catch (err) {
      console.error("Failed fetching session roster", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessionRoster();
  }, [selectedAssignmentId]);

  // Handle manual one-tap status toggle
  const handleUpdateStatus = async (studentId, newStatus) => {
    if (!selectedAssignmentId) return;
    setUpdatingId(studentId);
    try {
      await attendanceService.markAttendance({
        assignment_id: parseInt(selectedAssignmentId),
        student_id: studentId,
        status: newStatus,
      });

      // Update local state optimistically
      setSessionData((prev) => {
        if (!prev) return prev;
        const updatedStudents = prev.students.map((st) => {
          if (st.id === studentId) {
            return { ...st, status: newStatus, marked_at: "አሁን" };
          }
          return st;
        });

        // Recalculate stats
        let present = 0, absent = 0, excused = 0;
        updatedStudents.forEach((st) => {
          if (st.status === "Present") present++;
          else if (st.status === "Absent") absent++;
          else if (st.status === "Excused") excused++;
        });

        return {
          ...prev,
          stats: {
            total: updatedStudents.length,
            present,
            absent,
            excused,
            unmarked: updatedStudents.length - (present + absent + excused),
          },
          students: updatedStudents,
        };
      });
    } catch (err) {
      alert("መገኘት ማዘመን አልተሳካም።");
    } finally {
      setUpdatingId(null);
    }
  };

  // Filter students
  const filteredStudents = useMemo(() => {
    if (!sessionData?.students) return [];
    return sessionData.students.filter((st) => {
      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = st.name?.toLowerCase().includes(q);
        const matchesId = st.student_id?.toLowerCase().includes(q);
        const matchesChristian = st.christian_name?.toLowerCase().includes(q);
        if (!matchesName && !matchesId && !matchesChristian) return false;
      }

      // Status filter
      if (statusFilter !== "all") {
        if (st.status !== statusFilter) return false;
      }

      return true;
    });
  }, [sessionData, searchQuery, statusFilter]);

  const stats = sessionData?.stats || { total: 0, present: 0, absent: 0, excused: 0, unmarked: 0 };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-slate-950 text-white flex flex-col justify-between pb-8">
      {/* Top Header */}
      <div className="sticky top-0 z-30 bg-slate-950/90 backdrop-blur-md border-b border-white/10 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <Link
            to={`/attendance/scanner?assignment_id=${selectedAssignmentId}`}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>ወደ ስካነር</span>
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchSessionRoster}
              disabled={loading}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 transition-colors"
              title="Refresh Roster"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <Link
              to={`/attendance/scanner?assignment_id=${selectedAssignmentId}`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-brand-700 to-brand-600 hover:from-brand-600 hover:to-brand-500 text-white font-black text-xs shadow-md transition-all"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>QR ስካነር ክፈት</span>
            </Link>
          </div>
        </div>

        {/* Session Selector */}
        <div>
          <select
            value={selectedAssignmentId}
            onChange={(e) => setSelectedAssignmentId(e.target.value)}
            className="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-2.5 text-xs font-black text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            {assignments.map((a) => {
              const title =
                a.type === "Course"
                  ? `${a.assignment_courses?.[0]?.course?.name || "ኮርስ"} (${a.section?.name || "ክፍል"})`
                  : `${a.mezmurs?.[0]?.title || "የመዝሙር ስልጠና"}`;
              return (
                <option key={a.id} value={a.id}>
                  {title}
                </option>
              );
            })}
          </select>
        </div>

        {/* Live Counters */}
        <div className="grid grid-cols-4 gap-2 pt-1 text-center">
          <div className="p-2 rounded-xl bg-slate-900 border border-white/10">
            <p className="text-[9px] font-bold text-slate-400 uppercase">ጠቅላላ</p>
            <p className="text-lg font-black text-white">{stats.total}</p>
          </div>
          <div className="p-2 rounded-xl bg-emerald-950/60 border border-emerald-500/40">
            <p className="text-[9px] font-bold text-emerald-400 uppercase">ተገኝቷል</p>
            <p className="text-lg font-black text-emerald-400">{stats.present}</p>
          </div>
          <div className="p-2 rounded-xl bg-rose-950/60 border border-rose-500/40">
            <p className="text-[9px] font-bold text-rose-400 uppercase">ቀርቷል</p>
            <p className="text-lg font-black text-rose-400">{stats.absent}</p>
          </div>
          <div className="p-2 rounded-xl bg-amber-950/60 border border-amber-500/40">
            <p className="text-[9px] font-bold text-amber-400 uppercase">በፈቃድ</p>
            <p className="text-lg font-black text-amber-400">{stats.excused}</p>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 text-[11px] font-bold custom-scrollbar">
          <button
            onClick={() => setStatusFilter("all")}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-colors ${
              statusFilter === "all" ? "bg-white text-slate-950" : "bg-slate-900 text-slate-400 hover:text-white"
            }`}
          >
            ሁሉም ({stats.total})
          </button>
          <button
            onClick={() => setStatusFilter("Present")}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-colors ${
              statusFilter === "Present"
                ? "bg-emerald-500 text-slate-950 font-black"
                : "bg-emerald-950/40 text-emerald-300 hover:bg-emerald-900/40"
            }`}
          >
            የተገኙ ({stats.present})
          </button>
          <button
            onClick={() => setStatusFilter("Absent")}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-colors ${
              statusFilter === "Absent"
                ? "bg-rose-500 text-white font-black"
                : "bg-rose-950/40 text-rose-300 hover:bg-rose-900/40"
            }`}
          >
            የቀሩ ({stats.absent})
          </button>
          <button
            onClick={() => setStatusFilter("Excused")}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-colors ${
              statusFilter === "Excused"
                ? "bg-amber-500 text-slate-950 font-black"
                : "bg-amber-950/40 text-amber-300 hover:bg-amber-900/40"
            }`}
          >
            ፈቃድ ({stats.excused})
          </button>
          <button
            onClick={() => setStatusFilter("Unmarked")}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-colors ${
              statusFilter === "Unmarked"
                ? "bg-slate-300 text-slate-950 font-black"
                : "bg-slate-900 text-slate-500 hover:text-slate-300"
            }`}
          >
            ያልተመዘገቡ ({stats.unmarked})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="ተማሪ በስም ወይም መለያ ፈልግ..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs font-bold text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>
      </div>

      {/* Roster List */}
      <div className="p-4 flex-1 space-y-2">
        {loading && !sessionData ? (
          <div className="text-center py-12 text-slate-400 text-xs font-bold space-y-2">
            <div className="w-8 h-8 border-4 border-brand-500/20 border-t-brand-500 rounded-full animate-spin mx-auto"></div>
            <p>የክፍሉን መዝገብ በማምጣት ላይ...</p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-xs font-bold space-y-2 bg-slate-900/40 rounded-3xl border border-white/5 p-6">
            <AlertCircle className="w-8 h-8 text-slate-600 mx-auto" />
            <p>ምንም ተማሪ አልተገኘም።</p>
          </div>
        ) : (
          filteredStudents.map((st) => {
            const isUpdating = updatingId === st.id;
            return (
              <div
                key={st.id}
                className="p-3 rounded-2xl bg-slate-900/90 border border-white/10 flex items-center justify-between gap-3 transition-colors hover:border-white/20"
              >
                {/* Student Photo & Details */}
                <div className="flex items-center gap-3 min-w-0">
                  {st.picture_url ? (
                    <img
                      src={st.picture_url}
                      alt={st.name}
                      className="w-11 h-11 rounded-xl object-cover border border-white/10 shrink-0"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-xl bg-slate-800 border border-white/10 flex items-center justify-center font-black text-slate-400 text-base shrink-0">
                      {st.name?.charAt(0) || "S"}
                    </div>
                  )}

                  <div className="min-w-0">
                    <h4 className="font-black text-xs text-white truncate">{st.name}</h4>
                    <p className="text-[10px] text-brand-300 font-medium truncate">
                      {st.christian_name || "—"}
                    </p>
                    <p className="text-[9px] text-slate-500 font-mono">
                      ID: {st.student_id} {st.marked_at ? `· ${st.marked_at}` : ""}
                    </p>
                  </div>
                </div>

                {/* Quick 1-Tap Toggle Buttons */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleUpdateStatus(st.id, "Present")}
                    disabled={isUpdating}
                    className={`w-8 h-8 rounded-lg font-black text-[11px] flex items-center justify-center transition-all ${
                      st.status === "Present"
                        ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                        : "bg-slate-800 text-slate-400 hover:text-emerald-400 hover:bg-emerald-950/30"
                    }`}
                    title="Mark Present"
                  >
                    P
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(st.id, "Absent")}
                    disabled={isUpdating}
                    className={`w-8 h-8 rounded-lg font-black text-[11px] flex items-center justify-center transition-all ${
                      st.status === "Absent"
                        ? "bg-rose-600 text-white shadow-md shadow-rose-600/20"
                        : "bg-slate-800 text-slate-400 hover:text-rose-400 hover:bg-rose-950/30"
                    }`}
                    title="Mark Absent"
                  >
                    A
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(st.id, "Excused")}
                    disabled={isUpdating}
                    className={`w-8 h-8 rounded-lg font-black text-[11px] flex items-center justify-center transition-all ${
                      st.status === "Excused"
                        ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                        : "bg-slate-800 text-slate-400 hover:text-amber-400 hover:bg-amber-950/30"
                    }`}
                    title="Mark Excused"
                  >
                    E
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Floating Bottom Scanner Switch Button */}
      <div className="sticky bottom-3 px-4 z-20">
        <Link
          to={`/attendance/scanner?assignment_id=${selectedAssignmentId}`}
          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-brand-700 via-brand-600 to-brand-500 hover:from-brand-600 hover:to-brand-400 text-white font-black text-xs shadow-xl flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] transition-all"
        >
          <Camera className="w-4 h-4" />
          <span>ተማሪዎችን በካሜራ ለመቃኘት ክፈት (Open Scanner)</span>
        </Link>
      </div>
    </div>
  );
}
