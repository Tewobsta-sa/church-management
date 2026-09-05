import { useState, useEffect, useMemo } from "react";
import { 
  CheckCircle2, 
  AlertCircle, 
  TrendingUp, 
  Users, 
  CheckSquare, 
  Square, 
  GraduationCap, 
  Award, 
  Calendar, 
  BookOpen, 
  ChevronRight, 
  Search, 
  Filter, 
  Sparkles, 
  X, 
  Clock, 
  ArrowRight, 
  RotateCcw, 
  ShieldCheck, 
  Info,
  Layers,
  FileText,
  UserCheck,
  Percent
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { academicService } from "../../services/academicService";

export default function StudentPromotion() {
  const { user, hasRole } = useAuth();
  
  // Permissions
  const isSuperAdmin = hasRole("super_admin");
  const isTmhrt = isSuperAdmin || hasRole("tmhrt_kfl") || hasRole("tmhrt_office_admin");
  const isYesewHabt = isSuperAdmin || hasRole("yesew_habt") || hasRole("gngnunet_office_admin");

  // State
  const [activeTab, setActiveTab] = useState(isYesewHabt && !isTmhrt ? "approval" : "evaluation");
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [candidates, setCandidates] = useState([]);
  const [stats, setStats] = useState({ total_students: 0, eligible_count: 0, nominated_count: 0, promoted_count: 0 });
  const [sections, setSections] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);

  // Interactive Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSection, setSelectedSection] = useState("all");
  const [minGradeFilter, setMinGradeFilter] = useState("all"); // 'all', '75', '50', 'below50'
  const [minAttendanceFilter, setMinAttendanceFilter] = useState("all"); // 'all', '80', '60', 'below60'

  // Modals
  const [activeGradeStudent, setActiveGradeStudent] = useState(null);
  const [activeAttendanceStudent, setActiveAttendanceStudent] = useState(null);
  const [isNominateModalOpen, setIsNominateModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  
  // Form inputs for modals
  const [nominationTargetSection, setNominationTargetSection] = useState("");
  const [nominationNotes, setNominationNotes] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg, type = "success") => {
    setToastMessage({ text: msg, type });
    setTimeout(() => setToastMessage(null), 4500);
  };

  // Fetch candidates from backend
  const fetchPromotionData = async () => {
    try {
      setLoading(true);
      // Map active tab to promotion_status filter
      let statusParam = "all";
      if (activeTab === "evaluation") statusParam = "eligible";
      else if (activeTab === "approval") statusParam = "nominated";
      else if (activeTab === "history") statusParam = "promoted";

      const res = await academicService.getPromotionCandidates({
        promotion_status: statusParam,
        section_id: selectedSection !== "all" ? selectedSection : undefined,
        search: searchQuery || undefined,
      });

      setCandidates(res.candidates || []);
      if (res.stats) setStats(res.stats);
      if (res.sections) setSections(res.sections);
    } catch (err) {
      console.error("Failed fetching promotion candidates", err);
      showToast(err.response?.data?.message || "Failed to load candidates", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPromotionData();
    setSelectedIds([]);
  }, [activeTab, selectedSection]);

  // Client-side quick filter for grade & attendance sliders / thresholds
  const filteredCandidates = useMemo(() => {
    return candidates.filter((c) => {
      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = c.name?.toLowerCase().includes(q);
        const matchesId = c.student_id?.toLowerCase().includes(q);
        const matchesChristian = c.christian_name?.toLowerCase().includes(q);
        if (!matchesName && !matchesId && !matchesChristian) return false;
      }

      // Grade Threshold filter
      if (minGradeFilter !== "all") {
        if (c.overall_grade_avg === null) return false;
        if (minGradeFilter === "75" && c.overall_grade_avg < 75) return false;
        if (minGradeFilter === "50" && c.overall_grade_avg < 50) return false;
        if (minGradeFilter === "below50" && c.overall_grade_avg >= 50) return false;
      }

      // Attendance Threshold filter
      if (minAttendanceFilter !== "all") {
        if (c.overall_attendance_avg === null) return false;
        if (minAttendanceFilter === "80" && c.overall_attendance_avg < 80) return false;
        if (minAttendanceFilter === "60" && c.overall_attendance_avg < 60) return false;
        if (minAttendanceFilter === "below60" && c.overall_attendance_avg >= 60) return false;
      }

      return true;
    });
  }, [candidates, searchQuery, minGradeFilter, minAttendanceFilter]);

  // Selection handlers
  const handleToggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredCandidates.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredCandidates.map((c) => c.id));
    }
  };

  // Quick select students meeting standard passing threshold (>= 50% Grade and >= 60% Attendance)
  const handleSelectQualified = () => {
    const qualified = filteredCandidates.filter(
      (c) => (c.overall_grade_avg ?? 0) >= 50 && (c.overall_attendance_avg ?? 0) >= 60
    );
    setSelectedIds(qualified.map((c) => c.id));
    showToast(`Selected ${qualified.length} qualified candidates (Grade ≥50% & Attendance ≥60%)`);
  };

  // Execute nomination (Tmhrt Admin)
  const handleConfirmNomination = async () => {
    if (selectedIds.length === 0) return;
    try {
      setActionLoading(true);
      const res = await academicService.nominateForPromotion(
        selectedIds,
        nominationTargetSection ? parseInt(nominationTargetSection) : null,
        nominationNotes
      );
      showToast(res.message || "Students nominated successfully!");
      setIsNominateModalOpen(false);
      setSelectedIds([]);
      setNominationNotes("");
      setNominationTargetSection("");
      fetchPromotionData();
    } catch (err) {
      showToast(err.response?.data?.message || "Nomination failed", "error");
    } finally {
      setActionLoading(false);
    }
  };

  // Execute approval (Ye Sew Habt)
  const handleApprovePromotion = async () => {
    if (selectedIds.length === 0) {
      showToast("Please select at least one nominated student to approve.", "error");
      return;
    }

    if (!confirm(`Are you sure you want to approve ${selectedIds.length} student(s) and advance them to their next grade level?`)) {
      return;
    }

    try {
      setActionLoading(true);
      const res = await academicService.approvePromotion(selectedIds, "Approved by Ye Sew Habt");
      showToast(res.message || "Students successfully promoted to next grade!");
      setSelectedIds([]);
      fetchPromotionData();
    } catch (err) {
      showToast(err.response?.data?.message || "Approval failed", "error");
    } finally {
      setActionLoading(false);
    }
  };

  // Execute reject/return (Ye Sew Habt)
  const handleConfirmReject = async () => {
    if (selectedIds.length === 0) return;
    if (!rejectReason.trim()) {
      showToast("Please provide a return reason for Tmhrt Admin.", "error");
      return;
    }

    try {
      setActionLoading(true);
      const res = await academicService.rejectPromotion(selectedIds, rejectReason);
      showToast(res.message || "Nomination returned to Tmhrt Admin.");
      setIsRejectModalOpen(false);
      setSelectedIds([]);
      setRejectReason("");
      fetchPromotionData();
    } catch (err) {
      showToast(err.response?.data?.message || "Action failed", "error");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl text-sm font-bold border transition-all animate-slide-up ${
            toastMessage.type === "error"
              ? "bg-rose-900/90 text-rose-100 border-rose-700/60 shadow-rose-950/40"
              : "bg-slate-900/95 text-emerald-300 border-emerald-500/40 shadow-slate-950/50"
          }`}
        >
          {toastMessage.type === "error" ? (
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-brand-950 via-brand-900 to-slate-950 p-8 text-white shadow-sacred border border-brand-800/40">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-800/60 border border-brand-700/50 text-xs font-black tracking-widest text-gold-300 uppercase">
              <GraduationCap className="w-3.5 h-3.5 text-gold-400" />
              ቅድስት ኪዳነ ምሕረት ሰንበት ት/ቤት | St. Kidane Mehret
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white flex items-center gap-3">
              የተማሪዎች ከክፍል ወደ ክፍል እድገት
              <span className="text-lg sm:text-xl font-normal text-brand-300/90 font-mono">
                / Grade Promotion
              </span>
            </h1>
            <p className="text-sm text-brand-100/80 max-w-2xl font-medium leading-relaxed">
              የትምህርት አስተዳዳሪ (Tmhrt Admin) በውጤትና በመገኘት ላይ ተመስርቶ እጩዎችን ያቀርባል ፤ በሰው ሀብት (Ye Sew Habt) ተረጋግጦና ጸድቆ ወደ ቀጣዩ ክፍል ይዘዋወራሉ።
            </p>
          </div>

          {/* Action Hub based on Role */}
          <div className="flex flex-wrap gap-3">
            {activeTab === "evaluation" && isTmhrt && (
              <button
                onClick={() => setIsNominateModalOpen(true)}
                disabled={selectedIds.length === 0 || actionLoading}
                className="flex items-center gap-2.5 bg-gradient-to-r from-gold-500 to-amber-600 hover:from-gold-400 hover:to-amber-500 text-slate-950 font-black px-6 py-3 rounded-2xl shadow-lg shadow-gold-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-40 disabled:pointer-events-none"
              >
                <Award className="w-5 h-5 text-slate-950" />
                ወደ ቀጣይ ክፍል እጩ አድርግ ({selectedIds.length})
              </button>
            )}

            {activeTab === "approval" && isYesewHabt && (
              <div className="flex gap-2">
                <button
                  onClick={() => setIsRejectModalOpen(true)}
                  disabled={selectedIds.length === 0 || actionLoading}
                  className="flex items-center gap-2 bg-slate-900/80 hover:bg-rose-950/80 text-rose-300 border border-rose-800/40 px-5 py-3 rounded-2xl font-bold text-xs shadow-md hover:scale-[1.02] transition-all disabled:opacity-40 disabled:pointer-events-none"
                >
                  <RotateCcw className="w-4 h-4 text-rose-400" />
                  መልስ / ውድቅ አድርግ ({selectedIds.length})
                </button>
                <button
                  onClick={handleApprovePromotion}
                  disabled={selectedIds.length === 0 || actionLoading}
                  className="flex items-center gap-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black px-6 py-3 rounded-2xl shadow-lg shadow-emerald-600/30 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-40 disabled:pointer-events-none"
                >
                  <ShieldCheck className="w-5 h-5 text-emerald-200" />
                  እድገቱን አጽድቅና አሳድግ ({selectedIds.length})
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="absolute top-0 right-0 -mr-24 -mt-24 w-96 h-96 bg-brand-600/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/3 -mb-24 w-80 h-80 bg-gold-500/10 rounded-full blur-3xl pointer-events-none"></div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-2xl border-l-4 border-l-slate-400 flex items-center justify-between">
          <div>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">ጠቅላላ ተማሪዎች</p>
            <p className="text-3xl font-black text-slate-800 mt-1">{stats.total_students}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Total Enrolled Students</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border-l-4 border-l-brand-600 flex items-center justify-between">
          <div>
            <p className="text-brand-700 text-xs font-bold uppercase tracking-wider">ግምገማ ላይ ያሉ (ትምህርት)</p>
            <p className="text-3xl font-black text-brand-900 mt-1">{stats.eligible_count}</p>
            <p className="text-[11px] text-brand-600/80 mt-0.5">Under Tmhrt Evaluation</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-brand-50 flex items-center justify-center text-brand-600">
            <BookOpen className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border-l-4 border-l-amber-500 flex items-center justify-between">
          <div>
            <p className="text-amber-700 text-xs font-bold uppercase tracking-wider">የሰው ሀብት ማጽደቂያ</p>
            <p className="text-3xl font-black text-amber-900 mt-1">{stats.nominated_count}</p>
            <p className="text-[11px] text-amber-600/80 mt-0.5">Awaiting Ye Sew Habt Approval</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border-l-4 border-l-emerald-600 flex items-center justify-between">
          <div>
            <p className="text-emerald-700 text-xs font-bold uppercase tracking-wider">ያደጉ / የተዘዋወሩ</p>
            <p className="text-3xl font-black text-emerald-900 mt-1">{stats.promoted_count}</p>
            <p className="text-[11px] text-emerald-600/80 mt-0.5">Officially Promoted Roster</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Role Navigation Tabs */}
      <div className="flex border-b border-slate-200 bg-white/60 backdrop-blur-md rounded-2xl p-1.5 shadow-sm">
        <button
          onClick={() => setActiveTab("evaluation")}
          className={`flex-1 flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl text-xs sm:text-sm font-black transition-all ${
            activeTab === "evaluation"
              ? "bg-brand-900 text-white shadow-md shadow-brand-900/20"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>ደረጃ 1: የትምህርት ክፍል ግምገማ (Tmhrt Nomination)</span>
          <span
            className={`ml-1.5 px-2 py-0.5 text-[10px] rounded-full font-black ${
              activeTab === "evaluation" ? "bg-brand-700 text-white" : "bg-slate-200 text-slate-700"
            }`}
          >
            {stats.eligible_count}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("approval")}
          className={`flex-1 flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl text-xs sm:text-sm font-black transition-all ${
            activeTab === "approval"
              ? "bg-amber-600 text-white shadow-md shadow-amber-600/20"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>ደረጃ 2: የሰው ሀብት ክፍል ማጽደቂያ (Ye Sew Habt Approval)</span>
          {stats.nominated_count > 0 && (
            <span
              className={`ml-1.5 px-2 py-0.5 text-[10px] rounded-full font-black animate-pulse ${
                activeTab === "approval" ? "bg-amber-800 text-white" : "bg-amber-500 text-white"
              }`}
            >
              {stats.nominated_count} አዲስ
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("history")}
          className={`flex-1 flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl text-xs sm:text-sm font-black transition-all ${
            activeTab === "history"
              ? "bg-slate-900 text-white shadow-md shadow-slate-900/20"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>ያደጉ ተማሪዎች መዝገብ (Promoted Roster)</span>
        </button>
      </div>

      {/* Interactive Controls & Filter Bar */}
      <div className="glass-panel p-5 rounded-2xl space-y-4 border border-slate-200/80">
        <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
          {/* Search Box */}
          <div className="relative w-full lg:w-72">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="በስም ወይም መለያ ፈልግ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs font-bold rounded-xl border border-slate-200 bg-white/80 focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all placeholder:text-slate-400"
            />
          </div>

          {/* Section Filter Dropdown */}
          <div className="flex items-center gap-2 w-full lg:w-auto">
            <span className="text-xs font-extrabold text-slate-500 whitespace-nowrap">ክፍል:</span>
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="text-xs font-bold py-2.5 px-3 rounded-xl border border-slate-200 bg-white/80 focus:ring-2 focus:ring-brand-500 focus:outline-none"
            >
              <option value="all">ሁሉም ክፍሎች (All Sections)</option>
              {sections.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.program_type?.name || "Regular"})
                </option>
              ))}
            </select>
          </div>

          {/* Interactive Grade % Filter */}
          <div className="flex items-center gap-2 w-full lg:w-auto">
            <span className="text-xs font-extrabold text-slate-500 whitespace-nowrap">ውጤት %:</span>
            <select
              value={minGradeFilter}
              onChange={(e) => setMinGradeFilter(e.target.value)}
              className="text-xs font-bold py-2.5 px-3 rounded-xl border border-slate-200 bg-white/80 focus:ring-2 focus:ring-brand-500 focus:outline-none text-slate-700"
            >
              <option value="all">ሁሉም ውጤት (All Grades)</option>
              <option value="75">⭐ ከፍተኛ / Distinction (≥ 75%)</option>
              <option value="50">✅ አልፋፊ / Passing (≥ 50%)</option>
              <option value="below50">⚠️ ድጋፍ የሚሹ / Below 50%</option>
            </select>
          </div>

          {/* Interactive Attendance % Filter */}
          <div className="flex items-center gap-2 w-full lg:w-auto">
            <span className="text-xs font-extrabold text-slate-500 whitespace-nowrap">መገኘት %:</span>
            <select
              value={minAttendanceFilter}
              onChange={(e) => setMinAttendanceFilter(e.target.value)}
              className="text-xs font-bold py-2.5 px-3 rounded-xl border border-slate-200 bg-white/80 focus:ring-2 focus:ring-brand-500 focus:outline-none text-slate-700"
            >
              <option value="all">ሁሉም መገኘት (All Attendance)</option>
              <option value="80">🟢 ከፍተኛ መገኘት (≥ 80%)</option>
              <option value="60">🟡 ተቀባይነት ያለው (≥ 60%)</option>
              <option value="below60">🔴 ዝቅተኛ መገኘት (&lt; 60%)</option>
            </select>
          </div>
        </div>

        {/* Quick Selection Helpers */}
        <div className="flex flex-wrap items-center justify-between pt-3 border-t border-slate-100 text-xs font-bold">
          <div className="flex items-center gap-3">
            <span className="text-slate-400">
              የተገኙ: <strong className="text-slate-800">{filteredCandidates.length}</strong> | የተመረጡ:{" "}
              <strong className="text-brand-700">{selectedIds.length}</strong>
            </span>
          </div>

          {activeTab !== "history" && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleSelectQualified}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors"
                title="Select all students who scored >=50% and attended >=60%"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                ብቁ የሆኑትን ራስ-ሰር ምረጥ (Grade ≥50% & Att. ≥60%)
              </button>
              {selectedIds.length > 0 && (
                <button
                  onClick={() => setSelectedIds([])}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                >
                  ምርጫ አጽዳ (Clear)
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Candidate Table */}
      <div className="glass-panel rounded-3xl overflow-hidden border border-slate-200/80 shadow-glass">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 text-[11px] uppercase tracking-wider font-black">
                {activeTab !== "history" && (
                  <th className="px-5 py-4 w-12 text-center">
                    <button
                      onClick={handleSelectAll}
                      className="text-slate-400 hover:text-brand-600 transition-colors"
                      title="Toggle Select All"
                    >
                      {selectedIds.length > 0 && selectedIds.length === filteredCandidates.length ? (
                        <CheckSquare className="w-5 h-5 text-brand-600" />
                      ) : (
                        <Square className="w-5 h-5" />
                      )}
                    </button>
                  </th>
                )}
                <th className="px-6 py-4">የተማሪው መረጃ (Student)</th>
                <th className="px-6 py-4">የአሁኑ ክፍል (Current)</th>
                <th className="px-6 py-4">
                  <div className="flex items-center gap-1.5 text-brand-900">
                    <Award className="w-4 h-4 text-brand-600" />
                    <span>አማካይ ውጤት (Grade %)</span>
                  </div>
                  <span className="text-[9px] font-normal text-slate-400 lowercase">
                    (ተጫነው ዝርዝሩን እይ / click to view)
                  </span>
                </th>
                <th className="px-6 py-4">
                  <div className="flex items-center gap-1.5 text-celestial-600">
                    <Calendar className="w-4 h-4" />
                    <span>የመገኘት ምጣኔ (Attendance %)</span>
                  </div>
                  <span className="text-[9px] font-normal text-slate-400 lowercase">
                    (ተጫነው ዝርዝሩን እይ / click to view)
                  </span>
                </th>
                <th className="px-6 py-4">የታለመለት ክፍል (Target Next)</th>
                <th className="px-6 py-4 text-right">የእድገት ሁኔታ (Status)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-16 text-center text-slate-400 font-bold">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin"></div>
                      <span>መረጃዎችን በማስላት ላይ... (Calculating academic scores & attendance)</span>
                    </div>
                  </td>
                </tr>
              ) : filteredCandidates.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-16 text-center text-slate-500 font-bold">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <AlertCircle className="w-8 h-8 text-slate-300" />
                      <span>ምንም ተማሪ አልተገኘም (No candidates found matching the selected criteria).</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredCandidates.map((c) => {
                  const isSelected = selectedIds.includes(c.id);
                  const grade = c.overall_grade_avg;
                  const att = c.overall_attendance_avg;

                  return (
                    <tr
                      key={c.id}
                      className={`group transition-all ${
                        isSelected ? "bg-brand-50/40" : "hover:bg-slate-50/70"
                      }`}
                    >
                      {activeTab !== "history" && (
                        <td className="px-5 py-4 text-center">
                          <button
                            onClick={() => handleToggleSelect(c.id)}
                            className="text-slate-300 group-hover:text-brand-500 transition-colors"
                          >
                            {isSelected ? (
                              <CheckSquare className="w-5 h-5 text-brand-600" />
                            ) : (
                              <Square className="w-5 h-5" />
                            )}
                          </button>
                        </td>
                      )}

                      {/* Student Info */}
                      <td className="px-6 py-4">
                        <div className="font-black text-slate-800 text-sm">{c.name}</div>
                        <div className="text-[11px] text-brand-800 font-medium">
                          {c.christian_name || "—"}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          ID: {c.student_id}
                        </div>
                      </td>

                      {/* Current Placement */}
                      <td className="px-6 py-4">
                        <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200/80 font-bold text-slate-700">
                          <BookOpen className="w-3 h-3 text-slate-500" />
                          <span>{c.section_name}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1 font-medium">
                          Track: {c.program_name}
                        </div>
                      </td>

                      {/* Interactive Grade % Badge */}
                      <td className="px-6 py-4">
                        <button
                          onClick={() => setActiveGradeStudent(c)}
                          className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-black text-xs transition-all shadow-sm hover:scale-105 active:scale-95 cursor-pointer border ${
                            grade === null
                              ? "bg-slate-100 text-slate-500 border-slate-200"
                              : grade >= 75
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 shadow-emerald-500/10"
                              : grade >= 50
                              ? "bg-brand-50 text-brand-700 border-brand-200 hover:bg-brand-100 shadow-brand-500/10"
                              : "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 shadow-rose-500/10"
                          }`}
                          title="Click to view course-by-course assessment grades"
                        >
                          <Award className="w-4 h-4" />
                          <span>{grade !== null ? `${grade}%` : "ውጤት የለም"}</span>
                          <span className="text-[10px] text-slate-400 ml-1 font-normal underline">
                            ዝርዝር
                          </span>
                        </button>
                        {c.courses_breakdown?.length > 0 && (
                          <div className="text-[10px] text-slate-400 mt-1 font-medium">
                            {c.courses_breakdown.length} ኮርሶች ተገምግመዋል
                          </div>
                        )}
                      </td>

                      {/* Interactive Attendance % Badge */}
                      <td className="px-6 py-4">
                        <button
                          onClick={() => setActiveAttendanceStudent(c)}
                          className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-black text-xs transition-all shadow-sm hover:scale-105 active:scale-95 cursor-pointer border ${
                            att === null
                              ? "bg-slate-100 text-slate-500 border-slate-200"
                              : att >= 80
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                              : att >= 60
                              ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                              : "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
                          }`}
                          title="Click to view session breakdown"
                        >
                          <Calendar className="w-4 h-4" />
                          <span>{att !== null ? `${att}%` : "መረጃ የለም"}</span>
                          <span className="text-[10px] text-slate-400 ml-1 font-normal underline">
                            ዝርዝር
                          </span>
                        </button>
                        <div className="flex gap-2 text-[10px] text-slate-400 mt-1">
                          <span>ትምህርት: {c.course_attendance_avg ?? 0}%</span>
                          <span>•</span>
                          <span>መዝሙር: {c.mezmur_attendance_avg ?? 0}%</span>
                        </div>
                      </td>

                      {/* Target Next Section */}
                      <td className="px-6 py-4">
                        {c.next_section ? (
                          <div className="inline-flex items-center gap-1.5 text-brand-900 font-extrabold bg-brand-50/60 border border-brand-200/60 px-3 py-1 rounded-xl">
                            <ArrowRight className="w-3.5 h-3.5 text-brand-600" />
                            <span>{c.next_section.name}</span>
                          </div>
                        ) : c.is_graduating ? (
                          <span className="inline-flex items-center gap-1 text-gold-700 font-black bg-gold-50 border border-gold-200 px-3 py-1 rounded-xl">
                            🎓 ተመራቂ (Graduate)
                          </span>
                        ) : (
                          <span className="text-slate-400 font-medium text-[11px]">አልተወሰነም</span>
                        )}

                        {c.promotion_notes && (
                          <div className="text-[10px] text-slate-500 italic mt-1 max-w-xs truncate">
                            "{c.promotion_notes}"
                          </div>
                        )}
                      </td>

                      {/* Promotion Status & Actions */}
                      <td className="px-6 py-4 text-right">
                        {c.promotion_status === "promoted" ? (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-black rounded-full uppercase tracking-wider">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> ያደገ (Promoted)
                            </span>
                            {c.approver && (
                              <p className="text-[10px] text-slate-400">በ: {c.approver}</p>
                            )}
                          </div>
                        ) : c.promotion_status === "nominated" ? (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-900 text-[10px] font-black rounded-full uppercase tracking-wider">
                              <Clock className="w-3.5 h-3.5 text-amber-700" /> እጩ (Nominated)
                            </span>
                            {c.nominator && (
                              <p className="text-[10px] text-slate-400">ያቀረበው: {c.nominator}</p>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-slate-100 text-slate-600 text-[10px] font-black rounded-full uppercase tracking-wider">
                            ብቁ (Eligible)
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: Interactive Academic Grades Breakdown */}
      {activeGradeStudent && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl border border-slate-100 animate-scale-in">
            {/* Header */}
            <div className="p-6 bg-gradient-to-r from-brand-950 via-brand-900 to-slate-900 text-white flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2 text-xs text-gold-300 font-bold uppercase tracking-wider">
                  <Award className="w-4 h-4" /> የትምህርት ውጤት ዝርዝር | Academic Grade Breakdown
                </div>
                <h2 className="text-2xl font-black mt-1">{activeGradeStudent.name}</h2>
                <p className="text-xs text-brand-200 mt-0.5">
                  ID: {activeGradeStudent.student_id} | ክፍል: {activeGradeStudent.section_name}
                </p>
              </div>
              <button
                onClick={() => setActiveGradeStudent(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Cumulative Average Card */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    አጠቃላይ አማካይ ውጤት (Overall Average)
                  </p>
                  <p className="text-3xl font-black text-slate-900 mt-0.5">
                    {activeGradeStudent.overall_grade_avg !== null
                      ? `${activeGradeStudent.overall_grade_avg}%`
                      : "ውጤት አልተመዘገበም"}
                  </p>
                </div>
                <div className="text-right">
                  <span
                    className={`inline-flex px-3 py-1.5 rounded-xl text-xs font-black uppercase ${
                      activeGradeStudent.overall_grade_avg >= 75
                        ? "bg-emerald-100 text-emerald-800"
                        : activeGradeStudent.overall_grade_avg >= 50
                        ? "bg-brand-100 text-brand-800"
                        : "bg-rose-100 text-rose-800"
                    }`}
                  >
                    {activeGradeStudent.overall_grade_avg >= 75
                      ? "⭐ ከፍተኛ (Distinction)"
                      : activeGradeStudent.overall_grade_avg >= 50
                      ? "✅ አልፋፊ (Passing)"
                      : "⚠️ ዝቅተኛ (Needs Work)"}
                  </span>
                </div>
              </div>

              {/* Courses & Assessments List */}
              <div className="space-y-4">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-brand-600" />
                  የኮርሶች እና ግምገማዎች ዝርዝር
                </h3>

                {activeGradeStudent.courses_breakdown?.length === 0 ? (
                  <p className="text-xs text-slate-500 italic p-4 text-center bg-slate-50 rounded-xl">
                    ለዚህ ተማሪ እስካሁን ምንም የኮርስ ፈተና ውጤት አልተመዘገበም።
                  </p>
                ) : (
                  activeGradeStudent.courses_breakdown.map((course) => (
                    <div
                      key={course.course_id}
                      className="border border-slate-200 rounded-2xl p-4 space-y-3 bg-white hover:border-brand-300 transition-colors"
                    >
                      <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                        <span className="font-extrabold text-slate-800 text-sm">
                          {course.course_name}
                        </span>
                        <span className="font-black text-xs px-2.5 py-1 rounded-lg bg-brand-50 text-brand-800 border border-brand-100">
                          {course.percentage}%
                        </span>
                      </div>

                      {/* Assessments Table */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="text-slate-400 font-bold border-b border-slate-100">
                              <th className="py-1.5">ግምገማ (Assessment)</th>
                              <th className="py-1.5 text-center">ክብደት (Weight)</th>
                              <th className="py-1.5 text-center">ያገኘው / ከፍተኛ</th>
                              <th className="py-1.5 text-right">በመቶኛ (%)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {course.assessments.map((a, idx) => (
                              <tr key={idx} className="text-slate-600">
                                <td className="py-2 font-bold text-slate-700">{a.title}</td>
                                <td className="py-2 text-center text-slate-500">{a.weight}%</td>
                                <td className="py-2 text-center font-mono">
                                  {a.raw_score} / {a.max_score}
                                </td>
                                <td className="py-2 text-right font-black text-slate-800">
                                  {a.percentage}%
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setActiveGradeStudent(null)}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all"
              >
                ዝጋ (Close)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Interactive Attendance Breakdown */}
      {activeAttendanceStudent && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl border border-slate-100 animate-scale-in">
            {/* Header */}
            <div className="p-6 bg-gradient-to-r from-slate-950 via-slate-900 to-brand-950 text-white flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2 text-xs text-celestial-400 font-bold uppercase tracking-wider">
                  <Calendar className="w-4 h-4" /> የተማሪው መገኘት ዝርዝር | Attendance Breakdown
                </div>
                <h2 className="text-2xl font-black mt-1">{activeAttendanceStudent.name}</h2>
                <p className="text-xs text-slate-300 mt-0.5">
                  ID: {activeAttendanceStudent.student_id} | ክፍል: {activeAttendanceStudent.section_name}
                </p>
              </div>
              <button
                onClick={() => setActiveAttendanceStudent(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Attendance Gauge & Rates */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-center">
                  <p className="text-[10px] font-bold text-slate-500 uppercase">ጠቅላላ ክፍለ-ጊዜ</p>
                  <p className="text-2xl font-black text-slate-800 mt-0.5">
                    {activeAttendanceStudent.attendance_summary?.total ?? 0}
                  </p>
                </div>
                <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-center">
                  <p className="text-[10px] font-bold text-emerald-700 uppercase">የተገኘ (Present)</p>
                  <p className="text-2xl font-black text-emerald-700 mt-0.5">
                    {activeAttendanceStudent.attendance_summary?.present ?? 0}
                  </p>
                </div>
                <div className="p-3 bg-rose-50 rounded-2xl border border-rose-200 text-center">
                  <p className="text-[10px] font-bold text-rose-700 uppercase">የቀረ (Absent)</p>
                  <p className="text-2xl font-black text-rose-700 mt-0.5">
                    {activeAttendanceStudent.attendance_summary?.absent ?? 0}
                  </p>
                </div>
                <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-center">
                  <p className="text-[10px] font-bold text-amber-700 uppercase">ፈቃድ (Excused)</p>
                  <p className="text-2xl font-black text-amber-700 mt-0.5">
                    {activeAttendanceStudent.attendance_summary?.excused ?? 0}
                  </p>
                </div>
              </div>

              {/* Course vs Mezmur Breakdown */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-1">
                  <span className="text-xs font-bold text-slate-500">የትምህርት ክፍለ-ጊዜ መገኘት</span>
                  <div className="flex justify-between items-baseline">
                    <span className="text-2xl font-black text-brand-900">
                      {activeAttendanceStudent.course_attendance_avg ?? 0}%
                    </span>
                    <span className="text-xs text-slate-400">
                      {activeAttendanceStudent.attendance_summary?.course_total ?? 0} ክፍለ-ጊዜ
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-1">
                  <span className="text-xs font-bold text-slate-500">የመዝሙር ስልጠና መገኘት</span>
                  <div className="flex justify-between items-baseline">
                    <span className="text-2xl font-black text-celestial-600">
                      {activeAttendanceStudent.mezmur_attendance_avg ?? 0}%
                    </span>
                    <span className="text-xs text-slate-400">
                      {activeAttendanceStudent.attendance_summary?.mezmur_total ?? 0} ክፍለ-ጊዜ
                    </span>
                  </div>
                </div>
              </div>

              {/* Recent Logs Table */}
              <div className="space-y-3">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-600" /> የቅርብ ጊዜ የመገኘት መዝገብ (Recent Sessions)
                </h3>
                {activeAttendanceStudent.session_logs?.length === 0 ? (
                  <p className="text-xs text-slate-400 italic p-3 text-center bg-slate-50 rounded-xl">
                    ምንም የመገኘት መዝገብ አልተገኘም።
                  </p>
                ) : (
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden">
                    {activeAttendanceStudent.session_logs.map((s, idx) => (
                      <div key={idx} className="p-3 text-xs flex justify-between items-center bg-white">
                        <div>
                          <p className="font-bold text-slate-800">{s.type === 'MezmurTraining' ? 'የመዝሙር ስልጠና' : 'መደበኛ ትምህርት'}</p>
                          <p className="text-[10px] text-slate-400">ቀን: {s.date} {s.marked_at ? `(${s.marked_at})` : ''}</p>
                        </div>
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            s.status === 'Present'
                              ? 'bg-emerald-100 text-emerald-800'
                              : s.status === 'Excused'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {s.status === 'Present' ? 'ተገኝቷል' : s.status === 'Excused' ? 'በፈቃድ' : 'ቀርቷል'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setActiveAttendanceStudent(null)}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all"
              >
                ዝጋ (Close)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Tmhrt Nomination Modal */}
      {isNominateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-100 animate-scale-in">
            <div className="p-6 bg-gradient-to-r from-brand-950 to-slate-950 text-white">
              <h3 className="text-xl font-black flex items-center gap-2">
                <Award className="w-5 h-5 text-gold-400" />
                ወደ ቀጣይ ክፍል እጩ ማድረግ (Nominate for Promotion)
              </h3>
              <p className="text-xs text-brand-200 mt-1">
                የትምህርት ክፍል አስተዳዳሪ {selectedIds.length} ተማሪዎችን ለሰው ሀብት ክፍል እጩ አድርጎ ያቀርባል
              </p>
            </div>

            <div className="p-6 space-y-4 text-xs font-bold">
              <div>
                <label className="text-slate-600 block mb-1">ዒላማ ክፍል (Target Next Section):</label>
                <select
                  value={nominationTargetSection}
                  onChange={(e) => setNominationTargetSection(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                >
                  <option value="">-- በስርዓቱ በቅደም ተከተል በራስ-ሰር ይወሰን (Auto-assign next section) --</option>
                  {sections.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.program_type?.name || "Regular"})
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400 font-normal mt-1">
                  ባዶ ከተተወ ሲስተሙ በተማሪው የአሁን ክፍል ተራ ቁጥር (order_no + 1) መሰረት በቀጣዩ ክፍል ይመድበዋል።
                </p>
              </div>

              <div>
                <label className="text-slate-600 block mb-1">የትምህርት ክፍል አስተያየት / ማስታወሻ (Notes):</label>
                <textarea
                  rows="3"
                  value={nominationNotes}
                  onChange={(e) => setNominationNotes(e.target.value)}
                  placeholder="ምሳሌ፡ የዓመቱን ፈተናዎች በሚገባ ያጠናቀቁ እና ለመደበኛ ትምህርት ዝግጁ የሆኑ..."
                  className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-brand-500 focus:outline-none font-normal"
                ></textarea>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
              <button
                onClick={() => setIsNominateModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
              >
                ይቅር (Cancel)
              </button>
              <button
                onClick={handleConfirmNomination}
                disabled={actionLoading}
                className="px-6 py-2.5 bg-gradient-to-r from-brand-700 to-brand-600 hover:from-brand-600 hover:to-brand-500 text-white font-black text-xs rounded-xl shadow-md transition-all disabled:opacity-50"
              >
                {actionLoading ? "እየተላከ ነው..." : "እጩነቱን አቅርብ (Submit to Ye Sew Habt)"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Ye Sew Habt Return / Rejection Modal */}
      {isRejectModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-100 animate-scale-in">
            <div className="p-6 bg-gradient-to-r from-rose-950 to-slate-950 text-white">
              <h3 className="text-xl font-black flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-rose-400" />
                እጩነቱን ወደ ትምህርት ክፍል መልስ (Return Nomination)
              </h3>
              <p className="text-xs text-rose-200 mt-1">
                የሰው ሀብት ክፍል የተመረጡትን {selectedIds.length} ተማሪዎች ከማብራሪያ ጋር ይመልሳል
              </p>
            </div>

            <div className="p-6 space-y-4 text-xs font-bold">
              <div>
                <label className="text-slate-600 block mb-1">የመመለሻ ምክንያት (Reason for Return):</label>
                <textarea
                  rows="4"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="ምሳሌ፡ የተማሪዎቹ የሁለተኛ መንፈቅ ዓመት መገኘት እንደገና ተጣርቶ እንዲቀርብ..."
                  className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-rose-500 focus:outline-none font-normal"
                ></textarea>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
              <button
                onClick={() => setIsRejectModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
              >
                ይቅር (Cancel)
              </button>
              <button
                onClick={handleConfirmReject}
                disabled={actionLoading || !rejectReason.trim()}
                className="px-6 py-2.5 bg-rose-700 hover:bg-rose-600 text-white font-black text-xs rounded-xl shadow-md transition-all disabled:opacity-50"
              >
                {actionLoading ? "እየተላከ ነው..." : "መልስ (Return to Tmhrt)"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
