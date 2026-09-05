import { useState, useEffect, useMemo } from "react";
import { Calendar as BigCalendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { enUS } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";
import {
  Plus,
  Clock,
  MapPin,
  User,
  BookOpen,
  Music,
  X,
  CheckSquare,
  RefreshCcw,
  CalendarDays,
  Trash2,
  Search,
  Filter,
  Calendar as CalendarIcon,
  LayoutGrid,
  List,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
} from "lucide-react";
import { assignmentService } from "../../services/assignmentService";
import { sectionService } from "../../services/sectionService";
import { courseService } from "../../services/courseService";
import { trainerService } from "../../services/trainerService";
import { teacherService } from "../../services/teacherService";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

const locales = { "en-US": enUS };

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

// Day-of-week definitions (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
const DAYS_OF_WEEK = [
  { id: "1", label: "Monday", short: "Mon" },
  { id: "2", label: "Tuesday", short: "Tue" },
  { id: "3", label: "Wednesday", short: "Wed" },
  { id: "4", label: "Thursday", short: "Thu" },
  { id: "5", label: "Friday", short: "Fri" },
  { id: "6", label: "Saturday", short: "Sat" },
  { id: "0", label: "Sunday", short: "Sun" },
];

// Safe event renderer for react-big-calendar
const CalendarEvent = (props) => {
  const event = props?.event;
  if (!event || !event.title) return null;
  const isCourse = event.type === "Course";
  return (
    <div className="flex flex-col h-full justify-between py-1 px-1 text-white">
      <div className="flex items-center gap-1 font-bold text-[11px] leading-tight truncate">
        {isCourse ? <BookOpen className="w-3 h-3 shrink-0" /> : <Music className="w-3 h-3 shrink-0" />}
        <span className="truncate">{event.title}</span>
      </div>
      <div className="flex items-center justify-between text-[9px] opacity-90 font-medium">
        <span className="flex items-center gap-0.5 truncate">
          <MapPin className="w-2.5 h-2.5 shrink-0" /> {event.location || "Sanctuary"}
        </span>
        <span className="truncate">{event.teacher}</span>
      </div>
    </div>
  );
};

export default function AssignmentsTasks() {
  const { hasRole, user } = useAuth();
  const navigate = useNavigate();

  const isSuperAdmin = hasRole("super_admin");
  const isAcademicAdmin = hasRole("tmhrt_kfl") || hasRole("tmhrt_office_admin");
  const isMezmurAdmin = hasRole("mezmur_kfl") || hasRole("mezmur_office_admin");
  const isTeacher = hasRole("teacher");
  const isMereja = hasRole("mereja_kfl");

  const attendanceActionLabel = isSuperAdmin ? "View attendance" : "Mark attendance";

  // Role locked assignment type
  const lockedType = isSuperAdmin ? null : isMezmurAdmin ? "MezmurTraining" : "Course";

  // Active view: "board" (weekly columns) | "calendar" (BigCalendar) | "agenda" (detailed list)
  const [viewMode, setViewMode] = useState("board");
  const [calendarView, setCalendarView] = useState("week");
  const [currentDate, setCurrentDate] = useState(new Date());

  // Filter and Search States
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all"); // "all" | "Course" | "MezmurTraining"
  const [filterSection, setFilterSection] = useState("all");
  const [filterDay, setFilterDay] = useState("all");

  const [rawSchedule, setRawSchedule] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // Dropdown options
  const [sections, setSections] = useState([]);
  const [courses, setCourses] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [teachers, setTeachers] = useState([]);

  const [formData, setFormData] = useState({
    type: lockedType ?? "Course",
    recurrence_type: "periodic",
    section_id: "",
    user_id: "",
    trainer_id: "",
    course_id: "",
    location: "",
    day_of_week: "1",
    scheduled_date: "",
    start_time: "09:00",
    end_time: "10:30",
  });

  // ─── Fetch schedule ────────────────────────────────────────────────
  const fetchSchedule = async () => {
    setLoading(true);
    try {
      const data = await assignmentService.getSchedule();
      const list = Array.isArray(data) ? data : [];
      setRawSchedule(list);

      const today = new Date();
      const formatted = list
        .filter((ev) => ev && ev.start_time && ev.end_time)
        .flatMap((ev) => {
          const [startH, startM] = ev.start_time.split(":").map(Number);
          const [endH, endM] = ev.end_time.split(":").map(Number);
          const title =
            ev.type === "Course"
              ? `${ev.assignment_courses?.[0]?.course?.name ?? "Course"} (${ev.section?.name ?? "Section"})`
              : `Mezmur: ${ev.mezmurs?.[0]?.title ?? "Training"}`;

          // One-time entry
          if (ev.scheduled_date) {
            const base = new Date(`${ev.scheduled_date}T00:00:00`);
            if (isNaN(base.getTime())) return [];
            const start = new Date(base);
            start.setHours(startH, startM, 0, 0);
            const end = new Date(base);
            end.setHours(endH, endM, 0, 0);

            if (isNaN(start.getTime()) || isNaN(end.getTime())) return [];
            return [
              {
                id: `${ev.id}-one-time`,
                title,
                start,
                end,
                type: ev.type || "Course",
                location: ev.location || "Main Sanctuary",
                teacher: ev.teacher?.name || ev.trainer?.name || "Unassigned",
                raw: ev,
              },
            ];
          }

          // Recurring entries: expand across nearby ±6 weeks
          if (ev.day_of_week == null) return [];
          const targetDOW = Number(ev.day_of_week);
          const entries = [];
          for (let weekOffset = -6; weekOffset <= 6; weekOffset++) {
            const diff = targetDOW - today.getDay();
            const base = new Date(today);
            base.setDate(today.getDate() + diff + weekOffset * 7);
            base.setHours(0, 0, 0, 0);

            const start = new Date(base);
            start.setHours(startH, startM, 0, 0);
            const end = new Date(base);
            end.setHours(endH, endM, 0, 0);

            if (!isNaN(start) && !isNaN(end)) {
              entries.push({
                id: `${ev.id}-w${weekOffset}`,
                title,
                start,
                end,
                type: ev.type || "Course",
                location: ev.location || "Main Sanctuary",
                teacher: ev.teacher?.name || ev.trainer?.name || "Unassigned",
                raw: ev,
              });
            }
          }
          return entries;
        });

      setCalendarEvents(formatted);
    } catch (err) {
      console.error("Failed to fetch schedule", err);
      setRawSchedule([]);
      setCalendarEvents([]);
    } finally {
      setLoading(false);
    }
  };

  // ─── Fetch dropdown resources ──────────────────────────────────────
  const fetchResources = async () => {
    const canAccessTrainers = isSuperAdmin || isMezmurAdmin;
    const canAccessTeachers = isSuperAdmin || isAcademicAdmin;

    const requests = [
      sectionService.getSections({ all: true }),
      courseService.list(),
      canAccessTeachers ? teacherService.getTeachers("", 1) : Promise.resolve({ data: [] }),
      canAccessTrainers ? trainerService.getTrainers() : Promise.resolve([]),
    ];

    const results = await Promise.allSettled(requests);
    const getValue = (idx, fallback = []) =>
      results[idx].status === "fulfilled" ? results[idx].value : fallback;

    const secData = getValue(0, { data: [] });
    const courseData = getValue(1, []);
    const teacherData = getValue(2, { data: [] });
    const trainerData = getValue(3, []);

    // All sections across PreKG, Regular (Htsanat, Maekelawyan, Wetatoch), Distance
    const secList = Array.isArray(secData) ? secData : secData?.data ?? [];
    setSections(secList);

    // All courses
    const courseList = Array.isArray(courseData) ? courseData : courseData?.data ?? [];
    setCourses(courseList);

    // Teachers
    const teacherList = teacherData?.data ?? (Array.isArray(teacherData) ? teacherData : []);
    setTeachers(teacherList);

    // Trainers
    const trainerList = Array.isArray(trainerData) ? trainerData : trainerData?.data ?? [];
    setTrainers(trainerList);
  };

  useEffect(() => {
    fetchSchedule();
    fetchResources();
  }, []);

  // ─── Filtered Assignments ──────────────────────────────────────────
  const visibleRawAssignments = useMemo(() => {
    return rawSchedule.filter((item) => {
      // Role-based visibility
      if (isAcademicAdmin && item.type !== "Course") return false;
      if (isMezmurAdmin && item.type !== "MezmurTraining") return false;
      if (isTeacher && item.user_id !== user?.id) return false;

      // Filter by Type
      if (filterType !== "all" && item.type !== filterType) return false;

      // Filter by Section
      if (filterSection !== "all" && String(item.section_id) !== String(filterSection)) return false;

      // Filter by Day of Week
      if (filterDay !== "all" && String(item.day_of_week) !== String(filterDay)) return false;

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const courseName = item.assignment_courses?.[0]?.course?.name?.toLowerCase() || "";
        const mezmurTitle = item.mezmurs?.[0]?.title?.toLowerCase() || "";
        const sectionName = item.section?.name?.toLowerCase() || "";
        const instructor = (item.teacher?.name || item.trainer?.name || "").toLowerCase();
        const location = (item.location || "").toLowerCase();

        return (
          courseName.includes(q) ||
          mezmurTitle.includes(q) ||
          sectionName.includes(q) ||
          instructor.includes(q) ||
          location.includes(q)
        );
      }

      return true;
    });
  }, [rawSchedule, isAcademicAdmin, isMezmurAdmin, isTeacher, user, filterType, filterSection, filterDay, searchQuery]);

  const visibleCalendarEvents = useMemo(() => {
    return calendarEvents.filter((ev) => {
      if (isAcademicAdmin && ev.type !== "Course") return false;
      if (isMezmurAdmin && ev.type !== "MezmurTraining") return false;
      if (isTeacher && ev.raw?.user_id !== user?.id) return false;

      if (filterType !== "all" && ev.type !== filterType) return false;
      if (filterSection !== "all" && String(ev.raw?.section_id) !== String(filterSection)) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const title = (ev.title || "").toLowerCase();
        const teacher = (ev.teacher || "").toLowerCase();
        const loc = (ev.location || "").toLowerCase();
        return title.includes(q) || teacher.includes(q) || loc.includes(q);
      }

      return true;
    });
  }, [calendarEvents, isAcademicAdmin, isMezmurAdmin, isTeacher, user, filterType, filterSection, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    const total = visibleRawAssignments.length;
    const coursesCount = visibleRawAssignments.filter((a) => a.type === "Course").length;
    const mezmurCount = visibleRawAssignments.filter((a) => a.type === "MezmurTraining").length;
    const uniqueSections = new Set(visibleRawAssignments.map((a) => a.section_id).filter(Boolean)).size;
    return { total, coursesCount, mezmurCount, uniqueSections };
  }, [visibleRawAssignments]);

  // Handle Form Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...formData };
      if (payload.recurrence_type === "periodic") {
        payload.scheduled_date = null;
      } else {
        payload.day_of_week = null;
      }

      await assignmentService.createAssignment(payload);
      setModalOpen(false);
      fetchSchedule();
      fetchResources();
    } catch (err) {
      alert(err.response?.data?.message || "Creation failed");
    }
  };

  // Handle Delete Schedule
  const handleDeleteSchedule = async (assignmentId) => {
    if (!assignmentId || deletingId) return;
    const confirmed = window.confirm("Delete this schedule entry? This action cannot be undone.");
    if (!confirmed) return;

    setDeletingId(assignmentId);
    try {
      await assignmentService.deleteAssignment(assignmentId);
      await fetchSchedule();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete schedule");
    } finally {
      setDeletingId(null);
    }
  };

  // BigCalendar styling
  const eventStyleGetter = (event) => ({
    style: {
      backgroundColor: event.type === "Course" ? "#9F1239" : "#D97706",
      borderRadius: "10px",
      opacity: 0.95,
      color: "white",
      border: event.type === "Course" ? "1px solid #BE123C" : "1px solid #F59E0B",
      fontSize: "11px",
      fontWeight: "700",
      padding: "3px 6px",
      boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
    },
  });

  const inputCls =
    "w-full px-4 py-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-800 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-500/10 transition-all shadow-xs text-sm";

  return (
    <div className="space-y-6 animate-[fade-in_0.4s_ease-out]">
      {/* ── Top Header & Hero ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white/70 backdrop-blur-xl p-6 rounded-3xl border border-white/60 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-900 via-brand-700 to-amber-500 p-0.5 shadow-lg shadow-brand-950/20 shrink-0">
            <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center p-1">
              <img src="/logo.png" alt="Finote Semaetat" className="w-full h-full object-contain" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                Schedule &amp; Timetable
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black uppercase tracking-wider border border-amber-300/60">
                ቅድስት ኪዳነ ምሕረት
              </span>
            </div>
            <p className="text-slate-500 text-xs font-semibold mt-0.5">
              {isAcademicAdmin
                ? "Academic curriculum timetable and course schedules"
                : isMezmurAdmin
                ? "Mezmur training sessions and ministry timetable"
                : "Comprehensive academic and ministerial timetable management"}
            </p>
          </div>
        </div>

        {/* Action Button */}
        {(isSuperAdmin || isAcademicAdmin || isMezmurAdmin) && !isMereja && (
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-brand-700 via-brand-800 to-brand-900 hover:from-brand-600 hover:to-brand-800 text-white px-5 py-3 rounded-2xl font-bold shadow-lg shadow-brand-900/20 hover:-translate-y-0.5 transition-all text-xs uppercase tracking-wider shrink-0 active:scale-[0.98]"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            New Schedule Entry
          </button>
        )}
      </div>

      {/* ── Stats Summary Badges ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center font-black">
            <CalendarDays className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Total Classes</p>
            <p className="text-xl font-black text-slate-900 mt-1">{stats.total}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-brand-700 flex items-center justify-center font-black">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Academic Blocks</p>
            <p className="text-xl font-black text-slate-900 mt-1">{stats.coursesCount}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-black">
            <Music className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Mezmur Sessions</p>
            <p className="text-xl font-black text-slate-900 mt-1">{stats.mezmurCount}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-black">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Sections</p>
            <p className="text-xl font-black text-slate-900 mt-1">{stats.uniqueSections}</p>
          </div>
        </div>
      </div>

      {/* ── Control Bar: View Switcher & Filters ── */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* View Switcher */}
        <div className="inline-flex bg-slate-100 p-1 rounded-xl shrink-0">
          <button
            onClick={() => setViewMode("board")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
              viewMode === "board"
                ? "bg-brand-800 text-white shadow-md shadow-brand-900/20"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            Weekly Board
          </button>
          <button
            onClick={() => setViewMode("calendar")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
              viewMode === "calendar"
                ? "bg-brand-800 text-white shadow-md shadow-brand-900/20"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <CalendarIcon className="w-3.5 h-3.5" />
            Calendar
          </button>
          <button
            onClick={() => setViewMode("agenda")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
              viewMode === "agenda"
                ? "bg-brand-800 text-white shadow-md shadow-brand-900/20"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <List className="w-3.5 h-3.5" />
            Agenda List
          </button>
        </div>

        {/* Search & Quick Filters */}
        <div className="flex flex-wrap items-center gap-2 flex-1 md:justify-end">
          {/* Search box */}
          <div className="relative min-w-[200px] flex-1 max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search course, teacher, hall…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 placeholder:text-slate-400 outline-none focus:border-brand-600 focus:bg-white transition-all"
            />
          </div>

          {/* Section Filter */}
          <select
            value={filterSection}
            onChange={(e) => setFilterSection(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-brand-600"
          >
            <option value="all">All Sections</option>
            {sections.map((sec) => (
              <option key={sec.id} value={sec.id}>
                {sec.name} ({sec.program_type?.name || "Regular"})
              </option>
            ))}
          </select>

          {/* Type Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-brand-600"
          >
            <option value="all">All Types</option>
            <option value="Course">Academic Courses</option>
            <option value="MezmurTraining">Mezmur Training</option>
          </select>
        </div>
      </div>

      {/* ── Main View Content ── */}
      <div className="glass-panel p-6 bg-white min-h-[600px] relative shadow-lg shadow-slate-200/50 border border-slate-100">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 text-slate-400 gap-3">
            <div className="w-8 h-8 border-3 border-brand-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs font-bold uppercase tracking-widest">Loading timetable…</p>
          </div>
        ) : viewMode === "board" ? (
          /* ── WEEKLY BOARD VIEW ── */
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-3">
              {DAYS_OF_WEEK.map((day) => {
                const dayAssignments = visibleRawAssignments
                  .filter((a) => String(a.day_of_week) === String(day.id))
                  .sort((a, b) => (a.start_time || "").localeCompare(b.start_time || ""));

                return (
                  <div
                    key={day.id}
                    className="flex flex-col bg-slate-50/70 rounded-2xl border border-slate-200/70 p-3 min-h-[480px]"
                  >
                    {/* Day Column Header */}
                    <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-200">
                      <div>
                        <h3 className="font-black text-xs text-slate-800 uppercase tracking-wider">{day.label}</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">
                          {dayAssignments.length} {dayAssignments.length === 1 ? "class" : "classes"}
                        </p>
                      </div>
                      <span className="w-2 h-2 rounded-full bg-brand-600/40"></span>
                    </div>

                    {/* Classes List */}
                    <div className="space-y-2.5 flex-1 custom-scrollbar overflow-y-auto">
                      {dayAssignments.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-center p-4">
                          <p className="text-[11px] font-bold text-slate-300 uppercase tracking-widest">No classes</p>
                        </div>
                      ) : (
                        dayAssignments.map((item) => {
                          const isCourse = item.type === "Course";
                          const title = isCourse
                            ? item.assignment_courses?.[0]?.course?.name || "Academic Block"
                            : item.mezmurs?.[0]?.title || "Mezmur Training";
                          const instructor = item.teacher?.name || item.trainer?.name || "Unassigned";

                          return (
                            <div
                              key={item.id}
                              className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-xs hover:border-brand-500 hover:shadow-md transition-all flex flex-col justify-between gap-2 group"
                            >
                              <div>
                                {/* Type & Time Banner */}
                                <div className="flex items-center justify-between gap-1 mb-1.5">
                                  <span
                                    className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider ${
                                      isCourse
                                        ? "bg-brand-50 text-brand-700 border border-brand-200/50"
                                        : "bg-amber-50 text-amber-700 border border-amber-200/50"
                                    }`}
                                  >
                                    {isCourse ? "Course" : "Mezmur"}
                                  </span>
                                  <span className="flex items-center gap-1 text-[10px] font-black text-slate-500">
                                    <Clock className="w-3 h-3 text-slate-400" />
                                    {item.start_time?.slice(0, 5)} - {item.end_time?.slice(0, 5)}
                                  </span>
                                </div>

                                {/* Title */}
                                <h4 className="font-black text-slate-900 text-xs leading-snug truncate" title={title}>
                                  {title}
                                </h4>

                                {/* Section chip */}
                                {item.section && (
                                  <p className="text-[10px] font-bold text-amber-700 truncate mt-0.5">
                                    📍 {item.section.name} ({item.section.program_type?.name || "Regular"})
                                  </p>
                                )}

                                {/* Teacher & Location */}
                                <div className="text-[10px] font-medium text-slate-500 space-y-0.5 mt-1.5 pt-1.5 border-t border-slate-100">
                                  <p className="flex items-center gap-1 truncate font-semibold text-slate-700">
                                    <User className="w-3 h-3 text-slate-400 shrink-0" />
                                    <span className="truncate">{instructor}</span>
                                  </p>
                                  <p className="flex items-center gap-1 truncate text-slate-400">
                                    <MapPin className="w-3 h-3 shrink-0" />
                                    <span className="truncate">{item.location || "Sanctuary"}</span>
                                  </p>
                                </div>
                              </div>

                              {/* Actions */}
                              <div className="flex items-center gap-1.5 pt-2 border-t border-slate-100">
                                <button
                                  onClick={() => navigate(`/attendance?assignment_id=${item.id}`)}
                                  className="flex-1 py-1.5 px-2 bg-brand-800 hover:bg-brand-900 text-white rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1 shadow-xs transition-colors"
                                  title={attendanceActionLabel}
                                >
                                  <CheckSquare className="w-3 h-3 text-amber-400" />
                                  Attendance
                                </button>
                                {(isSuperAdmin || isAcademicAdmin || isMezmurAdmin) && (
                                  <button
                                    onClick={() => handleDeleteSchedule(item.id)}
                                    disabled={deletingId === item.id}
                                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                    title="Delete entry"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : viewMode === "calendar" ? (
          /* ── BIG CALENDAR VIEW ── */
          <div className="space-y-4">
            {/* Calendar Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const d = new Date(currentDate);
                    if (calendarView === "month") d.setMonth(d.getMonth() - 1);
                    else if (calendarView === "week") d.setDate(d.getDate() - 7);
                    else d.setDate(d.getDate() - 1);
                    setCurrentDate(d);
                  }}
                  className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCurrentDate(new Date())}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Today
                </button>
                <button
                  onClick={() => {
                    const d = new Date(currentDate);
                    if (calendarView === "month") d.setMonth(d.getMonth() + 1);
                    else if (calendarView === "week") d.setDate(d.getDate() + 7);
                    else d.setDate(d.getDate() + 1);
                    setCurrentDate(d);
                  }}
                  className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <span className="font-black text-slate-900 text-sm ml-2">
                  {format(currentDate, calendarView === "month" ? "MMMM yyyy" : "MMM dd, yyyy")}
                </span>
              </div>

              {/* View options */}
              <div className="flex items-center bg-slate-100 p-1 rounded-xl">
                {["month", "week", "day"].map((v) => (
                  <button
                    key={v}
                    onClick={() => setCalendarView(v)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                      calendarView === v ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>

            {/* BigCalendar Component */}
            <div className="h-[680px]">
              <BigCalendar
                localizer={localizer}
                events={visibleCalendarEvents}
                startAccessor="start"
                endAccessor="end"
                view={calendarView}
                onView={setCalendarView}
                views={["month", "week", "day"]}
                date={currentDate}
                onNavigate={setCurrentDate}
                toolbar={false}
                eventPropGetter={eventStyleGetter}
                onSelectEvent={(event) =>
                  navigate(`/attendance?assignment_id=${event.raw?.id || event.id}`)
                }
                components={{ event: CalendarEvent }}
              />
            </div>
          </div>
        ) : (
          /* ── DETAILED AGENDA / LIST VIEW ── */
          <div className="space-y-3">
            {visibleRawAssignments.length === 0 ? (
              <div className="py-24 text-center">
                <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">
                  No schedule entries matching filters
                </p>
              </div>
            ) : (
              visibleRawAssignments.map((item) => {
                const isCourse = item.type === "Course";
                const title = isCourse
                  ? item.assignment_courses?.[0]?.course?.name || "Academic Block"
                  : item.mezmurs?.[0]?.title || "Mezmur Training Session";
                const instructor = item.teacher?.name || item.trainer?.name || "Unassigned";
                const dayObj = DAYS_OF_WEEK.find((d) => String(d.id) === String(item.day_of_week));

                return (
                  <div
                    key={item.id}
                    className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-slate-50/60 rounded-2xl border border-slate-200/80 hover:border-brand-500/50 hover:bg-white hover:shadow-md transition-all gap-4"
                  >
                    <div className="flex items-start gap-3.5">
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${
                          isCourse ? "bg-brand-50 text-brand-700 border border-brand-200/60" : "bg-amber-50 text-amber-700 border border-amber-200/60"
                        }`}
                      >
                        {isCourse ? <BookOpen className="w-5 h-5" /> : <Music className="w-5 h-5" />}
                      </div>

                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-extrabold text-slate-900 text-base">{title}</h3>
                          <span
                            className={`px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                              isCourse ? "bg-brand-50 text-brand-700" : "bg-amber-50 text-amber-700"
                            }`}
                          >
                            {isCourse ? "Course" : "Mezmur Training"}
                          </span>
                          {item.scheduled_date ? (
                            <span className="px-2 py-0.5 rounded-md bg-sky-100 text-sky-800 text-[10px] font-bold">
                              One-time: {item.scheduled_date}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-md bg-slate-200/70 text-slate-700 text-[10px] font-black uppercase">
                              Every {dayObj?.label || "Day"}
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-bold text-slate-500 mt-1.5">
                          <span className="flex items-center gap-1 text-slate-700">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            {item.start_time?.slice(0, 5)} - {item.end_time?.slice(0, 5)}
                          </span>
                          <span className="flex items-center gap-1 text-slate-700">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            {instructor}
                          </span>
                          {item.section && (
                            <span className="flex items-center gap-1 text-amber-800">
                              <GraduationCap className="w-3.5 h-3.5 text-amber-600" />
                              {item.section.name} ({item.section.program_type?.name || "Regular"})
                            </span>
                          )}
                          <span className="flex items-center gap-1 text-brand-700">
                            <MapPin className="w-3.5 h-3.5 text-brand-600" />
                            {item.location || "Sanctuary"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => navigate(`/attendance?assignment_id=${item.id}`)}
                        className="flex items-center gap-1.5 px-4 py-2 bg-brand-800 hover:bg-brand-900 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-xs transition-colors"
                      >
                        <CheckSquare className="w-3.5 h-3.5 text-amber-400" />
                        {attendanceActionLabel}
                      </button>
                      {(isSuperAdmin || isAcademicAdmin || isMezmurAdmin) && (
                        <button
                          type="button"
                          disabled={deletingId === item.id}
                          onClick={() => handleDeleteSchedule(item.id)}
                          className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          {deletingId === item.id ? "Deleting…" : "Delete"}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* ── CREATE NEW ENTRY MODAL ── */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-[fade-in_0.2s_ease-out]">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-slate-100">
            {/* Modal Header */}
            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-linear-to-r from-brand-900 via-brand-800 to-brand-950 text-white rounded-t-3xl sticky top-0 z-20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white p-1 flex items-center justify-center shadow-md shrink-0">
                  <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
                </div>
                <div>
                  <h2 className="text-xl font-black uppercase tracking-wide text-white">
                    {isMezmurAdmin ? "New Mezmur Training Schedule" : "New Schedule Assignment"}
                  </h2>
                  <p className="text-amber-300 text-xs font-bold uppercase tracking-widest mt-0.5">
                    ቅድስት ኪዳነ ምሕረት &bull; Timetable Management
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-2 hover:bg-white/10 rounded-xl transition-colors text-white/80 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              {/* Type selector (super_admin only) */}
              {isSuperAdmin && (
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-wider block">
                    Assignment Type
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, type: "Course" })}
                      className={`p-3.5 rounded-2xl border-2 font-black uppercase text-xs tracking-wider flex items-center justify-center gap-2.5 transition-all ${
                        formData.type === "Course"
                          ? "border-brand-700 bg-brand-50 text-brand-900 shadow-xs"
                          : "border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300"
                      }`}
                    >
                      <BookOpen className="w-4 h-4 text-brand-700" />
                      Academic Course Block
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, type: "MezmurTraining" })}
                      className={`p-3.5 rounded-2xl border-2 font-black uppercase text-xs tracking-wider flex items-center justify-center gap-2.5 transition-all ${
                        formData.type === "MezmurTraining"
                          ? "border-amber-500 bg-amber-50 text-amber-900 shadow-xs"
                          : "border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300"
                      }`}
                    >
                      <Music className="w-4 h-4 text-amber-600" />
                      Mezmur Training Block
                    </button>
                  </div>
                </div>
              )}

              {/* Schedule Pattern Selector: Periodic vs One-Time */}
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-wider block">
                  Schedule Pattern
                </label>
                <div className="grid grid-cols-2 gap-3 bg-slate-100 p-1.5 rounded-2xl">
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        recurrence_type: "periodic",
                        day_of_week: formData.day_of_week || "1",
                        scheduled_date: "",
                      })
                    }
                    className={`py-2.5 px-4 rounded-xl font-black uppercase text-xs tracking-wider flex items-center justify-center gap-2 transition-all ${
                      formData.recurrence_type === "periodic"
                        ? "bg-white text-slate-900 shadow-xs"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    <RefreshCcw className="w-3.5 h-3.5 text-brand-600" />
                    Weekly Recurring
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        recurrence_type: "one-time",
                        day_of_week: "",
                        scheduled_date: formData.scheduled_date || new Date().toISOString().split("T")[0],
                      })
                    }
                    className={`py-2.5 px-4 rounded-xl font-black uppercase text-xs tracking-wider flex items-center justify-center gap-2 transition-all ${
                      formData.recurrence_type === "one-time"
                        ? "bg-white text-slate-900 shadow-xs"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    <CalendarDays className="w-3.5 h-3.5 text-amber-600" />
                    Specific Date (One-Time)
                  </button>
                </div>
              </div>

              {/* Course Fields */}
              {formData.type === "Course" && (
                <div className="space-y-4 p-5 bg-slate-50 rounded-2xl border border-slate-200/80">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">Target Section *</label>
                      <select
                        required
                        className={inputCls}
                        value={formData.section_id}
                        onChange={(e) => setFormData({ ...formData, section_id: e.target.value })}
                      >
                        <option value="">Select Section</option>
                        {sections.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name} ({s.program_type?.name || "Regular"})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">Course / Subject *</label>
                      <select
                        required
                        className={inputCls}
                        value={formData.course_id}
                        onChange={(e) => setFormData({ ...formData, course_id: e.target.value })}
                      >
                        <option value="">Select Course</option>
                        {courses.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} ({c.program_type?.name || "Regular"})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Assigned Teacher *</label>
                    <select
                      required
                      className={inputCls}
                      value={formData.user_id}
                      onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
                    >
                      <option value="">Select Teacher</option>
                      {teachers.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Mezmur Training Fields */}
              {formData.type === "MezmurTraining" && (
                <div className="space-y-4 p-5 bg-slate-50 rounded-2xl border border-slate-200/80">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">Lead Trainer *</label>
                      <select
                        required
                        className={inputCls}
                        value={formData.trainer_id}
                        onChange={(e) => setFormData({ ...formData, trainer_id: e.target.value })}
                      >
                        <option value="">Select Trainer</option>
                        {trainers.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">Target Section (Optional)</label>
                      <select
                        className={inputCls}
                        value={formData.section_id}
                        onChange={(e) => setFormData({ ...formData, section_id: e.target.value })}
                      >
                        <option value="">General Sunday School / Open</option>
                        {sections.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name} ({s.program_type?.name || "Regular"})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Timing & Venue */}
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {formData.recurrence_type === "periodic" ? (
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">Day of Week *</label>
                      <select
                        className={inputCls}
                        value={formData.day_of_week}
                        onChange={(e) => setFormData({ ...formData, day_of_week: e.target.value })}
                      >
                        {DAYS_OF_WEEK.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">Date *</label>
                      <input
                        type="date"
                        required
                        className={inputCls}
                        value={formData.scheduled_date}
                        onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                      />
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Start Time *</label>
                    <input
                      type="time"
                      required
                      className={inputCls}
                      value={formData.start_time}
                      onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">End Time *</label>
                    <input
                      type="time"
                      required
                      className={inputCls}
                      value={formData.end_time}
                      onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Venue / Classroom / Hall</label>
                  <input
                    placeholder="e.g. Main Church Hall, Room 204, Choir Stage"
                    className={inputCls}
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full py-4 bg-gradient-to-r from-brand-700 via-brand-800 to-brand-900 hover:from-brand-600 hover:to-brand-800 text-white rounded-2xl font-black uppercase tracking-wider transition-all shadow-xl shadow-brand-900/20 flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                <Plus className="w-5 h-5 text-amber-400" />
                Publish Schedule Entry
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
