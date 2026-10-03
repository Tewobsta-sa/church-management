import { useState, useEffect } from "react";
import {
  FileDown,
  Users,
  CheckSquare,
  Award,
  Download,
  AlertCircle,
  GraduationCap,
  Palette,
  Filter,
  CalendarDays,
} from "lucide-react";
import { reportingService } from "../../services/reportingService";
import { sectionService } from "../../services/sectionService";
import { formatApiError } from "../../services/api";
import { useFeedback } from "../../context/FeedbackContext";
import BulkReportCardsModal from "./BulkReportCardsModal";

const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "new", label: "New" },
  { value: "regular", label: "Regular" },
  { value: "Graduated", label: "Graduated" },
  { value: "Inactive", label: "Inactive" },
];

const CLASSIFICATION_OPTIONS = [
  { value: "all", label: "All Classifications" },
  { value: "prekg", label: "PreKG" },
  { value: "htsanat", label: "Htsanat (1-4)" },
  { value: "maekelawyan", label: "Maekelawyan (5-8)" },
  { value: "wetatoch", label: "Wetatoch (9-12)" },
  { value: "distance", label: "Distance" },
];

const ATTENDANCE_TYPE_OPTIONS = [
  { value: "all", label: "All Session Types" },
  { value: "Course", label: "Course Sessions" },
  { value: "MezmurTraining", label: "Mezmur Training" },
];

const ATTENDANCE_STATUS_OPTIONS = [
  { value: "all", label: "All Attendance Statuses" },
  { value: "Present", label: "Present" },
  { value: "Late", label: "Late" },
  { value: "Absent", label: "Absent" },
  { value: "Excused", label: "Excused" },
];

const SHIFT_OPTIONS = [
  { value: "all", label: "All Shifts" },
  { value: "0", label: "Day (ቀን)" },
  { value: "1", label: "Night (ማታ)" },
];

export default function ReportsHub() {
  const { notify } = useFeedback();
  const [loading, setLoading] = useState("");
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [sections, setSections] = useState([]);

  // Shared filters
  const [sectionId, setSectionId] = useState("all");
  const [status, setStatus] = useState("all");
  const [classification, setClassification] = useState("all");
  const [isNight, setIsNight] = useState("all");
  const [attendanceType, setAttendanceType] = useState("all");
  const [attendanceStatus, setAttendanceStatus] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await sectionService.getSections(1, "", "");
        setSections(res.data || res || []);
      } catch (err) {
        console.error("Failed to load sections", err);
      }
    };
    load();
  }, []);

  const buildParams = (reportId) => {
    const base = { section_id: sectionId };
    if (reportId === "students") {
      return { ...base, status, classification, is_night: isNight };
    }
    if (reportId === "attendance") {
      return {
        ...base,
        type: attendanceType,
        status: attendanceStatus,
        is_night: isNight,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
      };
    }
    // grades / academic status
    return { ...base };
  };

  const handleExport = async (type) => {
    setLoading(type);
    try {
      await reportingService.exportCSV(type, buildParams(type));
      notify("Report generated and downloaded.", "success");
    } catch (err) {
      console.error("Export failed", err);
      notify(formatApiError(err, "Failed to generate report. Please try again."), "error");
    } finally {
      setLoading("");
    }
  };

  const reports = [
    {
      id: "students",
      title: "የተማሪዎች ዝርዝር (Student Roster)",
      desc: "Complete roster — IDs, names, section, track, classification, status, shift, contacts, guardian, and address. Honors section, status, classification and shift filters.",
      icon: Users,
      color: "bg-blue-50 text-blue-600",
      activeFilters: ["section", "status", "classification", "shift"],
    },
    {
      id: "attendance",
      title: "የመገኘት ሪፖርት (Attendance Report)",
      desc: "Chronological presence records across course and mezmur sessions. Filter by section, session type, status, shift and date range.",
      icon: CheckSquare,
      color: "bg-amber-50 text-amber-600",
      activeFilters: ["section", "attendanceType", "attendanceStatus", "shift", "dates"],
    },
    {
      id: "grades",
      title: "የትምህርት ሁኔታ (Academic Status)",
      desc: "Consolidated grade sheets per student — course-by-course assessment scores, weights and averages. Filter by section.",
      icon: Award,
      color: "bg-brand-50 text-brand-600",
      activeFilters: ["section"],
    },
  ];

  const selectCls =
    "px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none hover:border-brand-400 focus:ring-2 focus:ring-brand-500/15 focus:border-brand-500 transition-all shadow-xs";

  return (
    <div className="space-y-8 animate-[fade-in_0.4s_ease-out]">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">
            Reports & Exports
          </h1>
          <p className="text-slate-500 font-medium mt-1 uppercase text-xs tracking-widest">
            Generate archival data, administrative spreadsheets, and printable PDF documents
          </p>
        </div>
        <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100">
          <FileDown className="w-6 h-6 text-brand-600" />
        </div>
      </div>

      {/* Featured: Official Section Report Cards PDF Generator */}
      <div className="bg-gradient-to-br from-brand-900 via-slate-900 to-indigo-950 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-500/20 text-brand-300 rounded-full text-xs font-black uppercase tracking-wider mb-4 border border-brand-500/30">
            <Palette className="w-3.5 h-3.5" /> Customizable Section Themes
          </div>
          <h2 className="text-2xl font-black tracking-tight mb-2">
            Section Student Academic Report Cards (PDF)
          </h2>
          <p className="text-slate-300 text-sm font-medium leading-relaxed">
            Generate and download multi-page, print-ready student report cards in
            bulk for any section (PreKG, Regular, Distance). Customize color
            themes to match sections or grade levels, view live previews, and
            export with one click.
          </p>
        </div>

        <div className="relative z-10 flex-shrink-0">
          <button
            onClick={() => setBulkModalOpen(true)}
            className="flex items-center gap-3 px-6 py-4 bg-brand-500 hover:bg-brand-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-brand-900/50 hover:scale-105 transition-all cursor-pointer"
          >
            <GraduationCap className="w-5 h-5" />
            Launch Bulk PDF Generator
          </button>
        </div>
      </div>

      {/* Shared Filters Panel */}
      <div className="glass-panel p-5 rounded-3xl border border-slate-200/80 space-y-4">
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-500">
          <Filter className="w-4 h-4 text-brand-600" />
          Report Filters (applied to the exports below)
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          <div>
            <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">
              Section
            </label>
            <select value={sectionId} onChange={(e) => setSectionId(e.target.value)} className={`${selectCls} w-full`}>
              <option value="all">All Sections</option>
              {sections.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                  {s.program_type?.name ? ` (${s.program_type.name})` : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">
              Student Status
            </label>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className={`${selectCls} w-full`}>
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">
              Classification
            </label>
            <select value={classification} onChange={(e) => setClassification(e.target.value)} className={`${selectCls} w-full`}>
              {CLASSIFICATION_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">
              Shift (ፈረቃ)
            </label>
            <select value={isNight} onChange={(e) => setIsNight(e.target.value)} className={`${selectCls} w-full`}>
              {SHIFT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">
              Session Type
            </label>
            <select value={attendanceType} onChange={(e) => setAttendanceType(e.target.value)} className={`${selectCls} w-full`}>
              {ATTENDANCE_TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">
              Attendance Status
            </label>
            <select value={attendanceStatus} onChange={(e) => setAttendanceStatus(e.target.value)} className={`${selectCls} w-full`}>
              {ATTENDANCE_STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">
              <CalendarDays className="w-3 h-3 inline mr-1" />From Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className={`${selectCls} w-full`}
            />
          </div>

          <div>
            <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">
              <CalendarDays className="w-3 h-3 inline mr-1" />To Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className={`${selectCls} w-full`}
            />
          </div>
        </div>

        <p className="text-[10px] text-slate-400 font-medium">
          Note: Section, status, classification and shift filters apply to the
          roster; session type, attendance status and date range apply to the
          attendance report; the academic status report honors the section filter.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {reports.map((report) => (
          <div
            key={report.id}
            className="glass-panel p-10 flex flex-col justify-between group hover:border-brand-200 transition-all"
          >
            <div>
              <div
                className={`w-14 h-14 rounded-2xl ${report.color} flex items-center justify-center mb-8 group-hover:scale-110 transition-transform`}
              >
                <report.icon className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-black text-slate-800 mb-4 tracking-tight">
                {report.title}
              </h3>
              <p className="text-slate-500 font-medium text-sm leading-relaxed mb-6">
                {report.desc}
              </p>
            </div>

            <button
              onClick={() => handleExport(report.id)}
              disabled={loading === report.id}
              className={`w-full flex items-center justify-center gap-3 py-4 rounded-3xl font-black uppercase tracking-[0.2em] text-[10px] transition-all ${
                loading === report.id
                  ? "bg-slate-100 text-slate-400"
                  : "bg-slate-900 text-white hover:bg-brand-600 shadow-xl shadow-slate-200"
              }`}
            >
              {loading === report.id ? (
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-slate-400"></div>
              ) : (
                <>
                  <Download className="w-4 h-4" /> Download CSV
                </>
              )}
            </button>
          </div>
        ))}
      </div>

      {/* Bulk Report Cards Modal */}
      <BulkReportCardsModal
        isOpen={bulkModalOpen}
        onClose={() => setBulkModalOpen(false)}
      />

      {/* Info Box */}
      <div className="bg-brand-50 border border-brand-100 rounded-[2rem] p-8 flex items-start gap-4">
        <div className="p-2 bg-white rounded-xl shadow-sm border border-brand-100">
          <AlertCircle className="w-5 h-5 text-brand-600" />
        </div>
        <div>
          <h4 className="font-black text-brand-900 text-sm uppercase tracking-wide mb-1">
            Data Privacy Notice
          </h4>
          <p className="text-brand-700/80 text-sm font-medium leading-relaxed max-w-2xl">
            Reports contain sensitive student information including contact
            details and academic standings. Always handle exported documents
            according to the church's data security guidelines. Exports are
            logged in the system audit trail.
          </p>
        </div>
      </div>
    </div>
  );
}
