import { useState, useEffect } from "react";
import {
  Music,
  Users,
  Star,
  Plus,
  Settings,
  Trash2,
  Edit2,
  Layers,
  X,
  Save,
  CheckCircle2,
  AlertCircle,
  Award,
  Send,
  FileCheck,
  Search,
  Check,
  ChevronRight,
  Landmark,
  MapPin,
  Calendar,
  UserCheck,
  Building2,
} from "lucide-react";
import { mezmurService } from "../../services/mezmurService";
import { useAuth } from "../../context/AuthContext";

export default function MezmurMinistry() {
  const { hasRole } = useAuth();

  const isSuperAdmin = hasRole("super_admin");
  const isMezmurAdmin = hasRole("mezmur_kfl") || hasRole("mezmur_office_admin");
  const isYesewHabt = hasRole("yesew_habt") || hasRole("gngnunet_office_admin");
  const isMereja = hasRole("mereja_kfl");

  const canManageMezmur = (isMezmurAdmin || isSuperAdmin) && !isMereja;
  const canManageMinistry = (isYesewHabt || isSuperAdmin || isMezmurAdmin) && !isMereja;

  const [activeMainTab, setActiveMainTab] = useState("groups"); // groups | exams | passed_queue
  const [loading, setLoading] = useState(true);

  // Data
  const [trainers, setTrainers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [ministries, setMinistries] = useState([]);

  // Exams Data
  const [exams, setExams] = useState([]);
  const [selectedExam, setSelectedExam] = useState(null);
  const [examCandidates, setExamCandidates] = useState([]);
  const [examResults, setExamResults] = useState({}); // student_id => { score, status, notes, sent }
  const [examSearch, setExamSearch] = useState("");
  const [examLoading, setExamLoading] = useState(false);
  const [savingResults, setSavingResults] = useState(false);
  const [sendingPassed, setSendingPassed] = useState(false);

  // Bulk Assign from Exam
  const [selectedExamStudents, setSelectedExamStudents] = useState([]);
  const [examTargetMinistryId, setExamTargetMinistryId] = useState("");
  const [bulkAssigningExam, setBulkAssigningExam] = useState(false);

  // Yesew Habt passed students queue
  const [passedQueue, setPassedQueue] = useState([]);
  const [queueLoading, setQueueLoading] = useState(false);
  const [selectedQueueIds, setSelectedQueueIds] = useState([]);
  const [queueTargetMinistryId, setQueueTargetMinistryId] = useState("");
  const [bulkAssigningQueue, setBulkAssigningQueue] = useState(false);

  // Modals
  const [createExamModal, setCreateExamModal] = useState(false);
  const [examTitle, setExamTitle] = useState("");
  const [examDate, setExamDate] = useState(new Date().toISOString().slice(0, 10));
  const [examDesc, setExamDesc] = useState("");
  const [examMinistryId, setExamMinistryId] = useState("");

  const [createMinistryModal, setCreateMinistryModal] = useState(false);
  const [ministryName, setMinistryName] = useState("");
  const [ministryDate, setMinistryDate] = useState(new Date().toISOString().slice(0, 10));
  const [ministryLocation, setMinistryLocation] = useState("");
  const [ministryNotes, setMinistryNotes] = useState("");
  const [creatingMinistry, setCreatingMinistry] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [tr, cat, assign, exList, minList] = await Promise.all([
        mezmurService.getTrainers(),
        mezmurService.getCategories(),
        mezmurService.getAssignments(),
        mezmurService.getExams(),
        mezmurService.getMinistries(),
      ]);
      setTrainers(tr.data || []);
      setCategories(cat.data || []);
      setAssignments(assign.data || []);
      setExams(exList.data || []);
      setMinistries(minList || []);

      if (exList.data?.length > 0 && !selectedExam) {
        loadExamDetails(exList.data[0]);
      }
    } catch (err) {
      console.error("Failed to load ministry data", err);
    } finally {
      setLoading(false);
    }
  };

  const loadExamDetails = async (exam) => {
    setSelectedExam(exam);
    setExamLoading(true);
    setSelectedExamStudents([]);
    if (exam.ministry_id) {
      setExamTargetMinistryId(exam.ministry_id);
    } else if (ministries.length > 0) {
      setExamTargetMinistryId(ministries[0].id);
    }
    try {
      const [fullExam, candidates] = await Promise.all([
        mezmurService.getExam(exam.id),
        mezmurService.getExamCandidates(),
      ]);

      // Enforce rule: ONLY regular students (status !== 'new') can take Mezmur exams
      const regularOnly = (candidates || []).filter((st) => {
        const status = (st.status || "").toLowerCase();
        return status === "regular" && status !== "new";
      });

      setExamCandidates(regularOnly);

      const resultsMap = {};
      fullExam.results?.forEach((r) => {
        resultsMap[r.student_id] = {
          score: r.score,
          status: r.status,
          notes: r.notes || "",
          sent_to_yesew_habt: r.sent_to_yesew_habt,
        };
      });
      setExamResults(resultsMap);
    } catch (err) {
      console.error("Failed to load exam details", err);
    } finally {
      setExamLoading(false);
    }
  };

  const fetchPassedQueue = async () => {
    setQueueLoading(true);
    setSelectedQueueIds([]);
    try {
      const res = await mezmurService.getPassedStudentsForMinistry();
      const rawList = res.data || [];
      // Enforce rule: ONLY regular students (status !== 'new') in passed queue for ministry assignment
      const list = rawList.filter((item) => {
        const status = (item.student?.status || "").toLowerCase();
        return status === "regular" && status !== "new";
      });
      setPassedQueue(list);
      if (list.length > 0 && !queueTargetMinistryId && ministries.length > 0) {
        setQueueTargetMinistryId(ministries[0].id);
      }
    } catch (err) {
      console.error("Failed to load passed queue", err);
    } finally {
      setQueueLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    if (isYesewHabt || isSuperAdmin) {
      fetchPassedQueue();
    }
  }, []);

  const handleCreateMinistry = async (e) => {
    e.preventDefault();
    if (!ministryName) return;
    setCreatingMinistry(true);
    try {
      const res = await mezmurService.createMinistry({
        name: ministryName,
        ministry_date: ministryDate || null,
        location: ministryLocation || null,
        notes: ministryNotes || null,
      });
      alert("Ministry created successfully!");
      setCreateMinistryModal(false);
      setMinistryName("");
      setMinistryLocation("");
      setMinistryNotes("");
      const updated = await mezmurService.getMinistries();
      setMinistries(updated || []);
      if (res?.data?.id) {
        setExamMinistryId(res.data.id);
        setExamTargetMinistryId(res.data.id);
        setQueueTargetMinistryId(res.data.id);
      }
    } catch (err) {
      alert("Failed to create ministry");
    } finally {
      setCreatingMinistry(false);
    }
  };

  const handleCreateExam = async (e) => {
    e.preventDefault();
    if (!examTitle || !examDate) return;
    try {
      const res = await mezmurService.createExam({
        ministry_id: examMinistryId ? Number(examMinistryId) : null,
        title: examTitle,
        exam_date: examDate,
        description: examDesc,
      });
      setCreateExamModal(false);
      setExamTitle("");
      setExamDesc("");
      setExamMinistryId("");
      fetchData();
      loadExamDetails(res);
    } catch (err) {
      alert("Failed to create exam");
    }
  };

  const handleResultChange = (studentId, field, value) => {
    setExamResults((prev) => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || { status: "pending", score: "" }),
        [field]: value,
      },
    }));
  };

  const handleSaveAllResults = async () => {
    if (!selectedExam) return;
    setSavingResults(true);

    const payloadResults = Object.entries(examResults).map(([studentId, data]) => ({
      student_id: Number(studentId),
      score: data.score !== "" && data.score !== null ? Number(data.score) : null,
      status: data.status || "pending",
      notes: data.notes || null,
    }));

    try {
      await mezmurService.bulkSaveExamResults({
        mezmur_exam_id: selectedExam.id,
        results: payloadResults,
      });
      alert("Exam results saved successfully!");
      loadExamDetails(selectedExam);
      fetchData();
    } catch (err) {
      alert("Failed to save exam results");
    } finally {
      setSavingResults(false);
    }
  };

  const handleSendPassedToYesewHabt = async () => {
    if (!selectedExam) return;

    // Collect passed students
    const passedStudentIds = Object.entries(examResults)
      .filter(([_, data]) => data.status === "passed")
      .map(([sid]) => Number(sid));

    if (passedStudentIds.length === 0) {
      alert("No students marked as 'Passed' to send.");
      return;
    }

    if (
      !confirm(
        `Send ${passedStudentIds.length} passed student(s) to Yesew Habt for ministry assignment?`
      )
    ) {
      return;
    }

    setSendingPassed(true);
    try {
      const res = await mezmurService.sendPassedStudentsToYesewHabt({
        mezmur_exam_id: selectedExam.id,
        student_ids: passedStudentIds,
      });
      alert(res.message || "Passed students successfully forwarded to Yesew Habt!");
      loadExamDetails(selectedExam);
      fetchData();
      if (isYesewHabt || isSuperAdmin) {
        fetchPassedQueue();
      }
    } catch (err) {
      alert("Failed to forward passed students.");
    } finally {
      setSendingPassed(false);
    }
  };

  const handleBulkAssignFromExam = async () => {
    if (selectedExamStudents.length === 0) {
      alert("Please select at least one student to assign to a ministry.");
      return;
    }

    const targetId = examTargetMinistryId || selectedExam?.ministry_id || (ministries.length > 0 ? ministries[0].id : null);
    if (!targetId) {
      alert("No ministry selected or available. Please create a ministry first.");
      return;
    }

    const ministryObj = ministries.find((m) => String(m.id) === String(targetId));
    const mName = ministryObj?.name || "the selected ministry";

    if (!confirm(`Assign ${selectedExamStudents.length} student(s) directly to ministry '${mName}'?`)) {
      return;
    }

    setBulkAssigningExam(true);
    try {
      const res = await mezmurService.bulkAssignToMinistry({
        ministry_id: Number(targetId),
        student_ids: selectedExamStudents,
        mezmur_exam_id: selectedExam?.id,
      });
      alert(res.message || "Students successfully assigned to ministry!");
      setSelectedExamStudents([]);
      loadExamDetails(selectedExam);
      fetchData();
      if (isYesewHabt || isSuperAdmin) {
        fetchPassedQueue();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to assign students to ministry.");
    } finally {
      setBulkAssigningExam(false);
    }
  };

  const handleBulkAssignFromQueue = async () => {
    if (selectedQueueIds.length === 0) {
      alert("Please select at least one candidate from the queue.");
      return;
    }

    const targetId = queueTargetMinistryId || (ministries.length > 0 ? ministries[0].id : null);
    if (!targetId) {
      alert("Please choose or create a target ministry.");
      return;
    }

    const ministryObj = ministries.find((m) => String(m.id) === String(targetId));
    const mName = ministryObj?.name || "the chosen ministry";

    if (!confirm(`Assign ${selectedQueueIds.length} candidate(s) to '${mName}'?`)) {
      return;
    }

    setBulkAssigningQueue(true);
    try {
      const res = await mezmurService.bulkAssignToMinistry({
        ministry_id: Number(targetId),
        student_ids: selectedQueueIds,
      });
      alert(res.message || "Candidates successfully assigned to ministry!");
      setSelectedQueueIds([]);
      fetchPassedQueue();
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to assign candidates.");
    } finally {
      setBulkAssigningQueue(false);
    }
  };

  const filteredCandidates = examCandidates.filter((st) => {
    if (!examSearch) return true;
    const q = examSearch.toLowerCase();
    return (
      st.name?.toLowerCase().includes(q) ||
      st.student_id?.toLowerCase().includes(q)
    );
  });

  const passedStudentCandidates = filteredCandidates.filter(
    (st) => examResults[st.id]?.status === "passed"
  );

  const toggleSelectAllPassed = () => {
    if (selectedExamStudents.length === passedStudentCandidates.length && passedStudentCandidates.length > 0) {
      setSelectedExamStudents([]);
    } else {
      setSelectedExamStudents(passedStudentCandidates.map((st) => st.id));
    }
  };

  const toggleSelectAllQueue = () => {
    if (selectedQueueIds.length === passedQueue.length && passedQueue.length > 0) {
      setSelectedQueueIds([]);
    } else {
      setSelectedQueueIds(passedQueue.map((item) => item.student?.id).filter(Boolean));
    }
  };

  return (
    <div className="space-y-8 animate-[fade-in_0.3s_ease-out]">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-3">
            <Music className="w-8 h-8 text-brand-600" />
            Mezmur Department &amp; Ministry
          </h1>
          <p className="text-slate-500 font-medium mt-0.5">
            Choir training, student examinations linked to ministries, and bulk assignments
          </p>
        </div>

        <div className="flex gap-2.5 flex-wrap">
          {canManageMinistry && (
            <button
              onClick={() => setCreateMinistryModal(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-emerald-500/20 hover:-translate-y-0.5 transition-all text-xs uppercase tracking-wider cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Create Ministry
            </button>
          )}

          {canManageMezmur && (
            <button
              onClick={() => setCreateExamModal(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-brand-700 to-brand-500 hover:from-brand-800 hover:to-brand-600 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-brand-500/30 hover:-translate-y-0.5 transition-all text-xs uppercase tracking-wider cursor-pointer"
            >
              <Award className="w-4 h-4" />
              New Mezmur Exam
            </button>
          )}
        </div>
      </div>

      {/* Main Tabs */}
      <div className="flex gap-2 p-1.5 bg-slate-100 rounded-2xl w-fit flex-wrap">
        <button
          onClick={() => setActiveMainTab("groups")}
          className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
            activeMainTab === "groups"
              ? "bg-white text-brand-700 shadow-md"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <Users className="w-4 h-4" />
          Ministries &amp; Groups ({ministries.length})
        </button>

        <button
          onClick={() => setActiveMainTab("exams")}
          className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
            activeMainTab === "exams"
              ? "bg-white text-brand-700 shadow-md"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <Award className="w-4 h-4" />
          Exams &amp; Evaluations ({exams.length})
        </button>

        {(isYesewHabt || isSuperAdmin) && (
          <button
            onClick={() => setActiveMainTab("passed_queue")}
            className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
              activeMainTab === "passed_queue"
                ? "bg-white text-brand-700 shadow-md"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Send className="w-4 h-4 text-emerald-600" />
            Passed Queue ({passedQueue.length})
          </button>
        )}
      </div>

      {/* TAB 1: MINISTRIES & MINISTRY GROUPS */}
      {activeMainTab === "groups" && (
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          {/* Left Panel: Categories & Trainers */}
          <div className="xl:col-span-1 space-y-6">
            <div className="glass-panel p-6 border-t-4 border-t-brand-500">
              <h3 className="font-extrabold text-slate-800 uppercase tracking-widest text-[11px] mb-4 flex items-center gap-2">
                <Music className="w-4 h-4 text-brand-600" /> Hymn Categories
              </h3>
              <div className="space-y-2.5">
                {categories.map((cat) => (
                  <div
                    key={cat.id}
                    className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center"
                  >
                    <span className="font-bold text-slate-700 text-sm">
                      {cat.name}
                    </span>
                    <span className="text-[10px] font-black text-brand-600 uppercase bg-white px-2 py-0.5 rounded border border-slate-200">
                      {cat.type}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-panel p-6 border-t-4 border-t-amber-500">
              <h3 className="font-extrabold text-slate-800 uppercase tracking-widest text-[11px] mb-4 flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-500" /> Instructors &amp; Trainers
              </h3>
              <div className="space-y-3">
                {trainers.map((t) => (
                  <div key={t.id} className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center font-black text-slate-400 text-xs">
                      {t.user?.name?.charAt(0) || "T"}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 text-xs">
                        {t.user?.name}
                      </p>
                      <div className="flex gap-1 flex-wrap mt-0.5">
                        {t.specialties?.map((s) => (
                          <span
                            key={s}
                            className="text-[9px] font-bold uppercase text-amber-600 px-1 bg-amber-50 rounded"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Panel: Established Ministries Directory & Assignments */}
          <div className="xl:col-span-3 space-y-8">
            {/* Established Ministries Card */}
            <div className="glass-panel overflow-hidden border-slate-200">
              <div className="px-8 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div>
                  <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs flex items-center gap-2">
                    <Landmark className="w-4 h-4 text-emerald-600" /> Established Ministries ({ministries.length})
                  </h3>
                  <p className="text-[11px] font-semibold text-slate-500 mt-0.5">
                    Ministries and choirs available for examinations and student assignments
                  </p>
                </div>

                {canManageMinistry && (
                  <button
                    onClick={() => setCreateMinistryModal(true)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    New Ministry
                  </button>
                )}
              </div>

              <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {ministries.length === 0 ? (
                  <div className="col-span-full py-10 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                    <Landmark className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="text-slate-500 font-bold text-xs uppercase tracking-wider">
                      No ministries created yet
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Click "Create Ministry" to set up your first church choir or service ministry.
                    </p>
                    {canManageMinistry && (
                      <button
                        onClick={() => setCreateMinistryModal(true)}
                        className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow transition-all cursor-pointer"
                      >
                        + Create Ministry Now
                      </button>
                    )}
                  </div>
                ) : (
                  ministries.map((m) => (
                    <div
                      key={m.id}
                      className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-emerald-300 hover:shadow-md transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-black text-slate-800 text-sm">{m.name}</h4>
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 shrink-0">
                            #{m.id}
                          </span>
                        </div>
                        {m.location && (
                          <p className="text-xs text-slate-500 flex items-center gap-1 mt-2 font-medium">
                            <MapPin className="w-3 h-3 text-slate-400" /> {m.location}
                          </p>
                        )}
                        {m.ministry_date && (
                          <p className="text-xs text-slate-500 flex items-center gap-1 mt-1 font-medium">
                            <Calendar className="w-3 h-3 text-slate-400" /> {m.ministry_date}
                          </p>
                        )}
                        {m.notes && (
                          <p className="text-[11px] text-slate-400 italic mt-2 line-clamp-2">
                            {m.notes}
                          </p>
                        )}
                      </div>

                      <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-600">
                          {m.total_students_count || 0} assigned
                        </span>
                        <span className="text-[10px] font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded">
                          {m.exams_count || 0} exam(s)
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Ministry Squad Assignments */}
            <div className="glass-panel overflow-hidden border-slate-200">
              <div className="px-8 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs flex items-center gap-2">
                  <Users className="w-4 h-4 text-brand-600" /> Active Ministry Groups &amp; Squads
                </h3>
              </div>

              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-200/60 text-slate-400 text-xs tracking-wider uppercase font-bold">
                    <th className="px-8 py-4">Ministry Squad</th>
                    <th className="px-8 py-4">Trainer / Mentor</th>
                    <th className="px-8 py-4">Total Students</th>
                    <th className="px-8 py-4">Start / End Dates</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {assignments.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-8 py-12 text-center text-slate-400 font-bold text-xs uppercase tracking-widest">
                        No active squad assignments established
                      </td>
                    </tr>
                  ) : (
                    assignments.map((a) => (
                      <tr key={a.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-8 py-5">
                          <p className="font-extrabold text-slate-800">
                            {a.ministry?.name || `Ministry Group #${a.id}`}
                          </p>
                          <p className="text-[11px] text-brand-600 font-semibold mt-0.5">
                            {a.mezmurs?.map((m) => m.title).join(", ") || "Hymn Practice"}
                          </p>
                        </td>
                        <td className="px-8 py-5 font-bold text-slate-700 text-xs">
                          {a.creator?.name || "Appointed Trainer"}
                        </td>
                        <td className="px-8 py-5">
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-brand-50 text-brand-700">
                            {a.students_count || 0} Students
                          </span>
                        </td>
                        <td className="px-8 py-5 text-xs text-slate-500 font-medium">
                          {a.duration_start_date} → {a.duration_end_date}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: EXAMS & PASS/FAIL EVALUATIONS */}
      {activeMainTab === "exams" && (
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          {/* Left Column: Exams List */}
          <div className="xl:col-span-1 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">
                Exam Sessions ({exams.length})
              </h3>
              {canManageMezmur && (
                <button
                  onClick={() => setCreateExamModal(true)}
                  className="p-1.5 bg-brand-50 hover:bg-brand-100 text-brand-700 rounded-lg text-xs font-bold cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="space-y-2">
              {exams.length === 0 ? (
                <div className="p-8 text-center glass-panel text-slate-400 text-xs font-bold uppercase">
                  No exams created yet
                </div>
              ) : (
                exams.map((ex) => {
                  const isSelected = selectedExam?.id === ex.id;
                  return (
                    <div
                      key={ex.id}
                      onClick={() => loadExamDetails(ex)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                        isSelected
                          ? "bg-white border-brand-500 shadow-md ring-2 ring-brand-500/10"
                          : "bg-slate-50/60 border-slate-200 hover:bg-white"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-extrabold text-slate-900 text-sm">
                            {ex.title}
                          </h4>
                          {ex.ministry && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded mt-1">
                              <Landmark className="w-2.5 h-2.5" /> {ex.ministry.name}
                            </span>
                          )}
                        </div>
                        <ChevronRight className={`w-4 h-4 transition-transform ${isSelected ? "text-brand-600 translate-x-1" : "text-slate-300"}`} />
                      </div>
                      <p className="text-[11px] font-bold text-slate-400 mt-2">
                        Date: {ex.exam_date}
                      </p>
                      <div className="flex gap-2 mt-3 pt-2 border-t border-slate-100 text-[10px] font-black uppercase">
                        <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                          {ex.passed_count || 0} Passed
                        </span>
                        <span className="text-red-500 bg-red-50 px-2 py-0.5 rounded">
                          {ex.failed_count || 0} Failed
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Candidate Evaluation Matrix */}
          <div className="xl:col-span-3 space-y-6">
            {selectedExam ? (
              <div className="glass-panel overflow-hidden border-slate-200">
                {/* Exam Title & Action Bar */}
                <div className="p-6 border-b border-slate-100 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-slate-50/50">
                  <div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="text-xl font-black text-slate-900">
                        {selectedExam.title}
                      </h3>
                      {selectedExam.ministry ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full font-black text-xs">
                          <Landmark className="w-3.5 h-3.5" /> For: {selectedExam.ministry.name}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-200 text-slate-600 rounded-full font-bold text-[10px]">
                          Unassigned Ministry
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-semibold text-brand-600 mt-1">
                      Exam Date: {selectedExam.exam_date} &bull; Evaluate Candidates &bull; Direct Bulk Ministry Assignment
                    </p>
                  </div>

                  <div className="flex gap-2 flex-wrap items-center">
                    {canManageMezmur && (
                      <>
                        <button
                          onClick={handleSaveAllResults}
                          disabled={savingResults}
                          className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow transition-all disabled:opacity-50 cursor-pointer"
                        >
                          <Save className="w-3.5 h-3.5" />
                          {savingResults ? "Saving..." : "Save Scores"}
                        </button>

                        <button
                          onClick={handleSendPassedToYesewHabt}
                          disabled={sendingPassed}
                          className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5 text-emerald-600" />
                          {sendingPassed ? "Sending..." : "Forward to Yesew Habt"}
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Bulk Assignment Bar */}
                <div className="px-6 py-3.5 bg-gradient-to-r from-emerald-50 via-teal-50 to-slate-50 border-b border-emerald-100 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={toggleSelectAllPassed}
                      className="text-xs font-black uppercase tracking-wider px-3 py-1.5 bg-white border border-emerald-200 text-emerald-800 rounded-lg hover:bg-emerald-100 transition-colors cursor-pointer"
                    >
                      {selectedExamStudents.length === passedStudentCandidates.length && passedStudentCandidates.length > 0
                        ? "Deselect All"
                        : `Select All Passed (${passedStudentCandidates.length})`}
                    </button>
                    <span className="text-xs font-bold text-slate-600">
                      {selectedExamStudents.length} candidate(s) selected
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                      Assign To:
                    </label>
                    <select
                      value={examTargetMinistryId}
                      onChange={(e) => setExamTargetMinistryId(e.target.value)}
                      className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none"
                    >
                      <option value="">-- Choose Ministry --</option>
                      {ministries.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} {m.location ? `(${m.location})` : ""}
                        </option>
                      ))}
                    </select>

                    <button
                      onClick={handleBulkAssignFromExam}
                      disabled={bulkAssigningExam || selectedExamStudents.length === 0}
                      className="flex items-center gap-2 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md shadow-emerald-600/20 transition-all disabled:opacity-40 cursor-pointer"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      {bulkAssigningExam ? "Assigning..." : "Bulk Assign to Ministry"}
                    </button>
                  </div>
                </div>

                {/* Search Bar */}
                <div className="p-4 border-b border-slate-100 bg-white flex items-center gap-4">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Filter student candidates..."
                      value={examSearch}
                      onChange={(e) => setExamSearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 bg-amber-50 text-amber-800 text-[10px] font-black uppercase rounded-lg border border-amber-200">
                      መደበኛ ተማሪዎች ብቻ &bull; Regular Students Only
                    </span>
                    <span className="text-xs font-bold text-slate-400">
                      {filteredCandidates.length} candidate(s)
                    </span>
                  </div>
                </div>

                {/* Evaluation Table */}
                <div className="overflow-x-auto max-h-[550px] custom-scrollbar">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50/70 text-[10px] uppercase font-bold text-slate-400 tracking-wider sticky top-0 bg-white z-10 border-b border-slate-200">
                        <th className="px-4 py-3.5 w-10 text-center">
                          <input
                            type="checkbox"
                            checked={
                              passedStudentCandidates.length > 0 &&
                              selectedExamStudents.length === passedStudentCandidates.length
                            }
                            onChange={toggleSelectAllPassed}
                            className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                            title="Select/Deselect All Passed"
                          />
                        </th>
                        <th className="px-6 py-3.5">Student</th>
                        <th className="px-6 py-3.5">Section</th>
                        <th className="px-6 py-3.5 w-24">Score (0-100)</th>
                        <th className="px-6 py-3.5">Evaluation Status</th>
                        <th className="px-6 py-3.5">Forwarded / Assigned</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {examLoading ? (
                        <tr>
                          <td colSpan="6" className="px-6 py-12 text-center text-slate-400">
                            Loading exam candidates...
                          </td>
                        </tr>
                      ) : filteredCandidates.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="px-6 py-12 text-center text-slate-400 font-bold">
                            No student candidates found
                          </td>
                        </tr>
                      ) : (
                        filteredCandidates.map((st) => {
                          const res = examResults[st.id] || {
                            status: "pending",
                            score: "",
                            sent_to_yesew_habt: false,
                          };

                          const isSelected = selectedExamStudents.includes(st.id);

                          return (
                            <tr key={st.id} className="hover:bg-slate-50/60 transition-colors">
                              <td className="px-4 py-4 text-center">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedExamStudents((prev) => [...prev, st.id]);
                                    } else {
                                      setSelectedExamStudents((prev) => prev.filter((id) => id !== st.id));
                                    }
                                  }}
                                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                />
                              </td>

                              <td className="px-6 py-4">
                                <p className="font-extrabold text-slate-900">
                                  {st.name}
                                </p>
                                <p className="text-[10px] font-bold text-brand-600">
                                  {st.student_id}
                                </p>
                              </td>

                              <td className="px-6 py-4 font-bold text-slate-600">
                                {st.section?.name || "Unassigned"}
                              </td>

                              {/* Score Input */}
                              <td className="px-6 py-4">
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  placeholder="--"
                                  value={res.score ?? ""}
                                  disabled={!canManageMezmur}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    handleResultChange(st.id, "score", val);
                                    if (Number(val) >= 50 && res.status === "pending") {
                                      handleResultChange(st.id, "status", "passed");
                                    }
                                  }}
                                  className="w-16 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-center font-bold text-slate-800 outline-none focus:border-brand-500 text-xs"
                                />
                              </td>

                              {/* Pass / Fail Toggle */}
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    disabled={!canManageMezmur}
                                    onClick={() =>
                                      handleResultChange(st.id, "status", "passed")
                                    }
                                    className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase transition-all cursor-pointer ${
                                      res.status === "passed"
                                        ? "bg-emerald-500 text-white shadow-sm"
                                        : "bg-slate-100 text-slate-500 hover:bg-emerald-50 hover:text-emerald-700"
                                    }`}
                                  >
                                    Passed
                                  </button>

                                  <button
                                    type="button"
                                    disabled={!canManageMezmur}
                                    onClick={() =>
                                      handleResultChange(st.id, "status", "failed")
                                    }
                                    className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase transition-all cursor-pointer ${
                                      res.status === "failed"
                                        ? "bg-red-500 text-white shadow-sm"
                                        : "bg-slate-100 text-slate-500 hover:bg-red-50 hover:text-red-700"
                                    }`}
                                  >
                                    Failed
                                  </button>

                                  {res.status === "pending" && (
                                    <span className="text-[10px] font-bold text-amber-500 italic">
                                      Pending
                                    </span>
                                  )}
                                </div>
                              </td>

                              {/* Forwarded Status */}
                              <td className="px-6 py-4">
                                {res.sent_to_yesew_habt ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    <Check className="w-3 h-3" /> Assigned / Sent
                                  </span>
                                ) : res.status === "passed" ? (
                                  <span className="text-[10px] font-bold text-brand-600">
                                    Ready to Assign
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-slate-300 font-bold">
                                    --
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
            ) : (
              <div className="glass-panel p-16 text-center text-slate-400 font-bold uppercase text-xs">
                Select an exam from the left panel to begin evaluation
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: PASSED STUDENTS QUEUE (FOR YESEW HABT) */}
      {activeMainTab === "passed_queue" && (isYesewHabt || isSuperAdmin) && (
        <div className="glass-panel overflow-hidden border-slate-200 space-y-4">
          <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/50">
            <div>
              <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <Send className="w-5 h-5 text-emerald-600" />
                Passed Mezmur Students Awaiting Ministry Assignment
              </h3>
              <p className="text-xs font-semibold text-slate-500 mt-0.5">
                Students forwarded from Mezmur examinations ready to be assigned to ministries in bulk
              </p>
            </div>
            <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full font-bold text-xs">
              {passedQueue.length} Qualified Candidates
            </span>
          </div>

          {/* Bulk Action Controls */}
          <div className="px-6 py-3.5 bg-gradient-to-r from-emerald-50 via-teal-50 to-slate-50 border-b border-emerald-100 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={toggleSelectAllQueue}
                className="text-xs font-black uppercase tracking-wider px-3 py-1.5 bg-white border border-emerald-200 text-emerald-800 rounded-lg hover:bg-emerald-100 transition-colors cursor-pointer"
              >
                {selectedQueueIds.length === passedQueue.length && passedQueue.length > 0
                  ? "Deselect All"
                  : `Select All (${passedQueue.length})`}
              </button>
              <span className="text-xs font-bold text-slate-600">
                {selectedQueueIds.length} candidate(s) selected
              </span>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                Target Ministry:
              </label>
              <select
                value={queueTargetMinistryId}
                onChange={(e) => setQueueTargetMinistryId(e.target.value)}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none"
              >
                <option value="">-- Select Target Ministry --</option>
                {ministries.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} {m.location ? `(${m.location})` : ""}
                  </option>
                ))}
              </select>

              <button
                onClick={handleBulkAssignFromQueue}
                disabled={bulkAssigningQueue || selectedQueueIds.length === 0}
                className="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md shadow-emerald-600/20 transition-all disabled:opacity-40 cursor-pointer"
              >
                <UserCheck className="w-4 h-4" />
                {bulkAssigningQueue ? "Assigning..." : "Bulk Assign to Ministry"}
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200/60 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  <th className="px-4 py-4 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={
                        passedQueue.length > 0 &&
                        selectedQueueIds.length === passedQueue.length
                      }
                      onChange={toggleSelectAllQueue}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                  </th>
                  <th className="px-6 py-4">Student Name</th>
                  <th className="px-6 py-4">Exam Passed</th>
                  <th className="px-6 py-4">Exam's Linked Ministry</th>
                  <th className="px-6 py-4">Score</th>
                  <th className="px-6 py-4">Section</th>
                  <th className="px-6 py-4 text-right">Direct Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {queueLoading ? (
                  <tr>
                    <td colSpan="7" className="px-8 py-12 text-center text-slate-400">
                      Loading queue...
                    </td>
                  </tr>
                ) : passedQueue.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-8 py-16 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">
                      No passed candidates awaiting assignment. Candidates appear here after passing Mezmur exams.
                    </td>
                  </tr>
                ) : (
                  passedQueue.map((item) => {
                    const isSelected = selectedQueueIds.includes(item.student?.id);
                    const examMinistry = item.exam?.ministry;

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-4 py-5 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              const sid = item.student?.id;
                              if (!sid) return;
                              if (e.target.checked) {
                                setSelectedQueueIds((prev) => [...prev, sid]);
                              } else {
                                setSelectedQueueIds((prev) => prev.filter((id) => id !== sid));
                              }
                            }}
                            className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                          />
                        </td>

                        <td className="px-6 py-5">
                          <p className="font-extrabold text-slate-900 text-sm">
                            {item.student?.name}
                          </p>
                          <p className="text-[10px] font-bold text-brand-600">
                            {item.student?.student_id}
                          </p>
                        </td>

                        <td className="px-6 py-5 font-bold text-slate-700">
                          {item.exam?.title || "Mezmur Exam"}
                        </td>

                        <td className="px-6 py-5">
                          {examMinistry ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              <Landmark className="w-3 h-3" /> {examMinistry.name}
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">
                              General Exam
                            </span>
                          )}
                        </td>

                        <td className="px-6 py-5">
                          <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg font-black text-xs">
                            {item.score ?? "100"}%
                          </span>
                        </td>

                        <td className="px-6 py-5 font-semibold text-slate-600">
                          {item.student?.section?.name || "Unassigned"}
                        </td>

                        <td className="px-6 py-5 text-right">
                          <button
                            onClick={async () => {
                              const targetId = examMinistry?.id || queueTargetMinistryId || (ministries.length > 0 ? ministries[0].id : null);
                              if (!targetId) {
                                alert("Please select or create a ministry first.");
                                return;
                              }
                              const sid = item.student?.id;
                              if (!sid) return;

                              try {
                                const res = await mezmurService.bulkAssignToMinistry({
                                  ministry_id: Number(targetId),
                                  student_ids: [sid],
                                });
                                alert(res.message || "Student assigned successfully!");
                                fetchPassedQueue();
                                fetchData();
                              } catch (err) {
                                alert("Failed to assign student to ministry.");
                              }
                            }}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold uppercase tracking-wider text-[10px] shadow cursor-pointer"
                          >
                            Assign to Ministry
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Ministry Modal */}
      {createMinistryModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-[fade-in_0.2s_ease-out]">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between px-7 py-5 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                <Landmark className="w-5 h-5 text-emerald-600" />
                Create New Church Ministry
              </h3>
              <button
                onClick={() => setCreateMinistryModal(false)}
                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateMinistry} className="p-7 space-y-5">
              <div>
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1.5">
                  Ministry Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. St. Michael Feast Choir Ministry, Youth Outreach..."
                  value={ministryName}
                  onChange={(e) => setMinistryName(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1.5">
                    Ministry / Service Date
                  </label>
                  <input
                    type="date"
                    value={ministryDate}
                    onChange={(e) => setMinistryDate(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none focus:border-emerald-500 text-xs"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1.5">
                    Location / Parish
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Main Sanctuary, Parish Hall"
                    value={ministryLocation}
                    onChange={(e) => setMinistryLocation(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none focus:border-emerald-500 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1.5">
                  Description &amp; Notes
                </label>
                <textarea
                  placeholder="Purpose of ministry, requirements, choir robes, schedule notes..."
                  value={ministryNotes}
                  onChange={(e) => setMinistryNotes(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none focus:border-emerald-500 text-xs"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCreateMinistryModal(false)}
                  className="px-5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingMinistry}
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow cursor-pointer disabled:opacity-50"
                >
                  {creatingMinistry ? "Creating..." : "Save Ministry"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Exam Modal */}
      {createExamModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-[fade-in_0.2s_ease-out]">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between px-7 py-5 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                <Award className="w-5 h-5 text-brand-600" />
                New Mezmur Examination Session
              </h3>
              <button
                onClick={() => setCreateExamModal(false)}
                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateExam} className="p-7 space-y-5">
              {/* Linked Ministry Selection */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Exam For Ministry:
                  </label>
                  {canManageMinistry && (
                    <button
                      type="button"
                      onClick={() => setCreateMinistryModal(true)}
                      className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 underline cursor-pointer"
                    >
                      + New Ministry
                    </button>
                  )}
                </div>
                <select
                  value={examMinistryId}
                  onChange={(e) => setExamMinistryId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none focus:border-brand-500 text-sm"
                >
                  <option value="">-- General Exam (No specific ministry) --</option>
                  {ministries.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} {m.location ? `(${m.location})` : ""}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  Linking this exam to a ministry allows direct bulk assignment of passed candidates to this ministry.
                </p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1.5">
                  Exam Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Midterm Hymn &amp; Tone Recitation"
                  value={examTitle}
                  onChange={(e) => setExamTitle(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1.5">
                  Examination Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={examDate}
                  onChange={(e) => setExamDate(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1.5">
                  Description / Focus Mezmurs
                </label>
                <textarea
                  placeholder="Notes, hymn titles, passing criteria..."
                  value={examDesc}
                  onChange={(e) => setExamDesc(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none focus:border-brand-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCreateExamModal(false)}
                  className="px-5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow cursor-pointer"
                >
                  Create Exam
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
