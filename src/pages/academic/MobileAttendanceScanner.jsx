import { useState, useEffect, useRef } from "react";
import { 
  Camera, 
  Flashlight, 
  FlashlightOff, 
  RotateCcw, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Search, 
  Users, 
  ListChecks, 
  Clock, 
  ChevronDown, 
  Volume2, 
  VolumeX, 
  ArrowRight,
  BookOpen,
  Music,
  Sparkles,
  Smartphone
} from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";
import { Link, useNavigate } from "react-router-dom";
import { attendanceService } from "../../services/attendanceService";
import { assignmentService } from "../../services/assignmentService";
import { useAuth } from "../../context/AuthContext";

export default function MobileAttendanceScanner() {
  const { user, hasRole } = useAuth();
  const navigate = useNavigate();

  const isSuperAdmin = hasRole("super_admin");
  const isYesewHabt = hasRole("yesew_habt") || hasRole("gngnunet_office_admin");
  const canRecordAttendance = isSuperAdmin || isYesewHabt;

  // State
  const [assignments, setAssignments] = useState([]);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState("");
  const [activeAssignment, setActiveAssignment] = useState(null);
  const [loadingAssignments, setLoadingAssignments] = useState(true);

  // Scanner State
  const [isScanning, setIsScanning] = useState(false);
  const [cameraFacing, setCameraFacing] = useState("environment"); // rear camera
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [scannerError, setScannerError] = useState("");

  // Scan Result Feedback
  const [lastScannedStudent, setLastScannedStudent] = useState(null);
  const [recentScans, setRecentScans] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Manual fallback search
  const [manualQuery, setManualQuery] = useState("");
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualSearching, setManualSearching] = useState(false);

  const html5QrCodeRef = useRef(null);
  const lastScannedCodeRef = useRef("");
  const scanLockRef = useRef(false);

  // Synthesize audible beep using browser Web Audio API
  const playBeep = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // High pitch A5
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.15);
    } catch (e) {
      console.log("Audio not supported", e);
    }
  };

  // Trigger haptic vibration on mobile
  const triggerHaptic = () => {
    if ("vibrate" in navigator) {
      navigator.vibrate([80, 40, 80]);
    }
  };

  // Fetch available assignments/classes for today or general schedule
  useEffect(() => {
    const loadAssignments = async () => {
      setLoadingAssignments(true);
      try {
        const res = await assignmentService.getAssignments();
        const list = Array.isArray(res) ? res : res?.data || [];
        setAssignments(list);
        if (list.length > 0) {
          setSelectedAssignmentId(list[0].id.toString());
          setActiveAssignment(list[0]);
        }
      } catch (err) {
        console.error("Failed loading assignments", err);
      } finally {
        setLoadingAssignments(false);
      }
    };
    loadAssignments();
  }, []);

  // Update active assignment when dropdown selection changes
  useEffect(() => {
    if (selectedAssignmentId && assignments.length > 0) {
      const found = assignments.find((a) => a.id.toString() === selectedAssignmentId.toString());
      setActiveAssignment(found || null);
    }
  }, [selectedAssignmentId, assignments]);

  // Start Camera Scanner
  const startCamera = async () => {
    setScannerError("");
    try {
      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode("qr-reader");
      }

      const config = {
        fps: 15,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      };

      await html5QrCodeRef.current.start(
        { facingMode: cameraFacing },
        config,
        onScanSuccess,
        onScanFailure
      );

      setIsScanning(true);
    } catch (err) {
      console.error("Camera start failed", err);
      setScannerError("ካሜራውን መክፈት አልተቻለም። እባክዎ የካሜራ ፈቃድ (Camera Permission) ያረጋግጡ።");
      setIsScanning(false);
    }
  };

  // Stop Camera Scanner
  const stopCamera = async () => {
    if (html5QrCodeRef.current && isScanning) {
      try {
        await html5QrCodeRef.current.stop();
        setIsScanning(false);
      } catch (err) {
        console.error("Camera stop failed", err);
      }
    }
  };

  // Toggle Torch/Flashlight if supported
  const toggleTorch = async () => {
    if (!html5QrCodeRef.current || !isScanning) return;
    try {
      const capabilities = html5QrCodeRef.current.getRunningTrackCapabilities();
      if (capabilities && capabilities.torch) {
        const nextTorch = !torchEnabled;
        await html5QrCodeRef.current.applyVideoConstraints({
          advanced: [{ torch: nextTorch }],
        });
        setTorchEnabled(nextTorch);
      } else {
        alert("የስልክዎ ካሜራ ፍላሽ በብራውዘር በኩል አይደገፍም።");
      }
    } catch (e) {
      console.error("Torch error", e);
    }
  };

  // Flip Camera (Front / Rear)
  const flipCamera = async () => {
    await stopCamera();
    const nextFacing = cameraFacing === "environment" ? "user" : "environment";
    setCameraFacing(nextFacing);
    setTimeout(() => {
      startCamera();
    }, 300);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        html5QrCodeRef.current.stop().catch((e) => console.log(e));
      }
    };
  }, []);

  // Scan Success Handler
  const onScanSuccess = async (decodedText) => {
    if (scanLockRef.current) return;
    if (decodedText === lastScannedCodeRef.current) {
      return; // prevent rapid duplicate scans
    }

    if (!selectedAssignmentId) {
      alert("እባክዎ መጀመሪያ ክፍለ-ጊዜ (Assignment/Session) ይምረጡ።");
      return;
    }

    scanLockRef.current = true;
    lastScannedCodeRef.current = decodedText;
    setIsProcessing(true);

    try {
      playBeep();
      triggerHaptic();

      const res = await attendanceService.scanAndMark(selectedAssignmentId, decodedText, "Present");
      const studentData = res.student;

      setLastScannedStudent(studentData);
      setRecentScans((prev) => [studentData, ...prev.slice(0, 9)]);
    } catch (err) {
      console.error("Scan attendance error", err);
      const msg = err.response?.data?.message || "ተማሪውን ማረጋገጥ አልተቻለም።";
      setLastScannedStudent({
        error: true,
        message: msg,
      });
    } finally {
      setIsProcessing(false);
      // Release scan lock after 2.5 seconds
      setTimeout(() => {
        scanLockRef.current = false;
        lastScannedCodeRef.current = "";
      }, 2500);
    }
  };

  const onScanFailure = (error) => {
    // Continuous scanning frames - ignore frame drop
  };

  // Manual mark attendance helper
  const handleManualMark = async (e) => {
    e.preventDefault();
    if (!manualQuery.trim() || !selectedAssignmentId) return;

    setManualSearching(true);
    try {
      const res = await attendanceService.scanAndMark(selectedAssignmentId, manualQuery.trim(), "Present");
      const studentData = res.student;
      setLastScannedStudent(studentData);
      setRecentScans((prev) => [studentData, ...prev.slice(0, 9)]);
      setShowManualModal(false);
      setManualQuery("");
      playBeep();
      triggerHaptic();
    } catch (err) {
      alert(err.response?.data?.message || "ተማሪው አልተገኘም ወይም መመዝገብ አልተቻለም።");
    } finally {
      setManualSearching(false);
    }
  };

  if (!canRecordAttendance) {
    return (
      <div className="max-w-md mx-auto min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-3xl bg-rose-900/30 border border-rose-500/40 flex items-center justify-center text-rose-400 mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-black text-white">የመገኘት መመዝገቢያ ፈቃድ የለዎትም</h2>
        <p className="text-xs text-slate-400 mt-2 max-w-xs leading-relaxed">
          የተማሪዎችን መገኘት የመቃኘትና የመመዝገብ ኃላፊነት የሰው ሀብት ክፍል (Ye Sew Habt) እና የበላይ አስተዳዳሪ ብቻ ነው።
        </p>
        <Link
          to="/attendance"
          className="mt-6 px-6 py-3 rounded-2xl bg-brand-700 hover:bg-brand-600 text-white font-black text-xs transition-all shadow-lg"
        >
          ወደ መገኘት መመልከቻ ሂድ (Go to Attendance View)
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto min-h-screen bg-slate-950 text-white flex flex-col justify-between pb-8">
      {/* Top Header */}
      <div className="sticky top-0 z-30 bg-slate-950/90 backdrop-blur-md border-b border-white/10 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-white/10 p-1 border border-gold-400/30 flex items-center justify-center shrink-0">
              <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="text-sm font-black text-white tracking-tight flex items-center gap-1">
                ጃቴ ኪዳነ ምሕረት
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-brand-700 text-brand-100 font-bold">
                  ስካነር
                </span>
              </h1>
              <p className="text-[10px] text-brand-300 font-medium">ፍኖተ ሰማዕታት የሞባይል መገኘት</p>
            </div>
          </div>

          {/* Quick Roster Link */}
          <Link
            to={`/attendance/mobile-viewer?assignment_id=${selectedAssignmentId}`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-gold-300 font-bold text-xs border border-white/10 transition-colors"
          >
            <ListChecks className="w-4 h-4" />
            <span>ዝርዝር (Roster)</span>
          </Link>
        </div>

        {/* Assignment / Session Selector */}
        <div className="mt-3.5 space-y-1">
          <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span>የዛሬ ክፍለ-ጊዜ (Active Session):</span>
            <span className="text-gold-400">
              {activeAssignment?.type === "MezmurTraining" ? "መዝሙር ስልጠና" : "መደበኛ ትምህርት"}
            </span>
          </label>
          <div className="relative">
            <select
              value={selectedAssignmentId}
              onChange={(e) => setSelectedAssignmentId(e.target.value)}
              className="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-2.5 text-xs font-black text-white appearance-none pr-8 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              {assignments.map((a) => {
                const title =
                  a.type === "Course"
                    ? `${a.assignment_courses?.[0]?.course?.name || "ኮርስ"} (${a.section?.name || "ክፍል"})`
                    : `${a.mezmurs?.[0]?.title || "የመዝሙር ስልጠና"}`;
                const time = a.start_time ? ` · ${a.start_time.slice(0, 5)}` : "";
                return (
                  <option key={a.id} value={a.id}>
                    {title} {time}
                  </option>
                );
              })}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Main Viewport / Camera Section */}
      <div className="p-4 flex-1 flex flex-col gap-4">
        {/* Camera Container */}
        <div className="relative rounded-3xl overflow-hidden bg-slate-900 border-2 border-brand-800/60 shadow-2xl aspect-square flex flex-col items-center justify-center">
          {/* HTML5 QR Scanner DOM container */}
          <div id="qr-reader" className="w-full h-full object-cover"></div>

          {/* Fallback overlay when camera is not running */}
          {!isScanning && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-slate-900/90 gap-4">
              <div className="w-20 h-20 rounded-3xl bg-brand-900/40 border border-brand-500/40 flex items-center justify-center text-gold-400 shadow-xl">
                <Camera className="w-10 h-10" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">ካሜራውን ያስጀምሩ</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-xs leading-relaxed">
                  የተማሪዎችን መታወቂያ QR ኮድ በፍጥነት ለመቃኘት የካሜራ ቁልፉን ይጫኑ
                </p>
              </div>
              <button
                onClick={startCamera}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-brand-700 via-brand-600 to-brand-500 hover:from-brand-600 hover:to-brand-400 text-white font-black text-sm shadow-lg shadow-brand-700/30 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <Camera className="w-5 h-5" />
                ካሜራውን ክፈት (Start Camera)
              </button>
            </div>
          )}

          {/* Overlay Corner Reticles (Active when camera is running) */}
          {isScanning && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="w-60 h-60 border-2 border-gold-400/80 rounded-3xl relative shadow-[0_0_50px_rgba(234,179,8,0.2)]">
                {/* Laser animation line */}
                <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-gold-400 to-transparent animate-pulse mt-12"></div>
                <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-gold-400"></div>
                <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-gold-400"></div>
                <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-gold-400"></div>
                <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-gold-400"></div>
              </div>
            </div>
          )}

          {/* Quick Floating Controls (Torch, Flip, Sound) */}
          {isScanning && (
            <div className="absolute top-3 right-3 flex items-center gap-2 z-20">
              <button
                onClick={toggleTorch}
                className={`w-10 h-10 rounded-xl backdrop-blur-md flex items-center justify-center transition-colors border ${
                  torchEnabled
                    ? "bg-gold-500 text-slate-950 border-gold-300"
                    : "bg-slate-900/70 text-white border-white/20"
                }`}
                title="Toggle Torch"
              >
                {torchEnabled ? <Flashlight className="w-5 h-5" /> : <FlashlightOff className="w-5 h-5" />}
              </button>
              <button
                onClick={flipCamera}
                className="w-10 h-10 rounded-xl bg-slate-900/70 backdrop-blur-md text-white border border-white/20 flex items-center justify-center transition-colors"
                title="Flip Camera"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="w-10 h-10 rounded-xl bg-slate-900/70 backdrop-blur-md text-white border border-white/20 flex items-center justify-center transition-colors"
                title="Toggle Audio Beep"
              >
                {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </button>
            </div>
          )}

          {/* Stop Camera Trigger at Bottom */}
          {isScanning && (
            <div className="absolute bottom-3 left-3 right-3 z-20">
              <button
                onClick={stopCamera}
                className="w-full py-2 bg-slate-950/80 backdrop-blur-md hover:bg-slate-900 text-slate-300 text-xs font-bold rounded-xl border border-white/15 transition-all"
              >
                ካሜራውን አቁም (Stop)
              </button>
            </div>
          )}
        </div>

        {/* Error notice if any */}
        {scannerError && (
          <div className="p-3 bg-rose-950/80 border border-rose-800 text-rose-200 text-xs rounded-2xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{scannerError}</span>
          </div>
        )}

        {/* LIVE SCAN RESULT CARD */}
        {lastScannedStudent && (
          <div
            className={`p-4 rounded-3xl border shadow-2xl transition-all animate-[slide-up_0.2s_ease-out] ${
              lastScannedStudent.error
                ? "bg-rose-950/90 border-rose-700/80 text-rose-100"
                : "bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 border-emerald-500/60 text-white"
            }`}
          >
            {lastScannedStudent.error ? (
              <div className="flex items-center gap-3">
                <XCircle className="w-7 h-7 text-rose-400 shrink-0" />
                <div>
                  <h4 className="font-black text-sm">ስህተት ተከስቷል</h4>
                  <p className="text-xs text-rose-300 mt-0.5">{lastScannedStudent.message}</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  {lastScannedStudent.picture_url ? (
                    <img
                      src={lastScannedStudent.picture_url}
                      alt={lastScannedStudent.name}
                      className="w-14 h-14 rounded-2xl object-cover border-2 border-emerald-400 shadow-md shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-emerald-900/50 border-2 border-emerald-400/60 flex items-center justify-center font-black text-emerald-300 text-xl shrink-0">
                      {lastScannedStudent.name?.charAt(0) || "S"}
                    </div>
                  )}

                  <div>
                    <div className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-emerald-400">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>ተገኝቷል (Present)</span>
                      <span className="text-slate-400 ml-1">· {lastScannedStudent.marked_at}</span>
                    </div>
                    <h3 className="font-black text-base leading-tight mt-0.5 text-white">
                      {lastScannedStudent.name}
                    </h3>
                    <p className="text-[11px] text-emerald-300 font-bold">
                      {lastScannedStudent.christian_name || "—"}
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                      ID: {lastScannedStudent.student_id} · {lastScannedStudent.section_name}
                    </p>
                  </div>
                </div>

                <div className="w-9 h-9 rounded-full bg-emerald-500/20 border border-emerald-400 flex items-center justify-center text-emerald-400 shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Manual Fallback Trigger */}
        <div className="flex gap-2">
          <button
            onClick={() => setShowManualModal(true)}
            className="flex-1 py-3 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-white/10 font-bold text-xs flex items-center justify-center gap-2 transition-colors"
          >
            <Search className="w-4 h-4 text-gold-400" />
            መታወቂያ የሌለው (Manual Search)
          </button>
          <Link
            to={`/attendance/mobile-viewer?assignment_id=${selectedAssignmentId}`}
            className="flex-1 py-3 px-4 rounded-2xl bg-brand-900/60 hover:bg-brand-900 text-brand-200 border border-brand-700/50 font-bold text-xs flex items-center justify-center gap-2 transition-colors"
          >
            <Users className="w-4 h-4 text-brand-300" />
            የክፍሉ መዝገብ (Roster)
          </Link>
        </div>

        {/* Recent Scanned Feed */}
        <div className="space-y-2 mt-2">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span>በቅርቡ የተቃኙ ({recentScans.length})</span>
            <Clock className="w-3.5 h-3.5 text-slate-500" />
          </h4>

          {recentScans.length === 0 ? (
            <p className="text-xs text-slate-500 italic text-center py-6 bg-slate-900/40 rounded-2xl border border-white/5">
              እስካሁን ምንም ተማሪ አልተቃኘም።
            </p>
          ) : (
            <div className="space-y-1.5 max-h-44 overflow-y-auto custom-scrollbar">
              {recentScans.map((st, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-xl bg-slate-900 border border-white/5 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-[10px] font-mono text-slate-500 w-4">{idx + 1}.</span>
                    <div className="truncate">
                      <p className="font-black text-white truncate">{st.name}</p>
                      <p className="text-[10px] text-slate-400 font-mono">
                        {st.student_id} · {st.section_name}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
                    {st.marked_at || "ተገኝቷል"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* MANUAL SEARCH MODAL */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/15 rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl">
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <Search className="w-5 h-5 text-gold-400" />
              በእጅ መለያ አስገባ (Manual Entry)
            </h3>
            <p className="text-xs text-slate-400">
              የተማሪውን መለያ ቁጥር (ምሳሌ፡ REG/1) ወይም የተማሪ ID ያስገቡ
            </p>

            <form onSubmit={handleManualMark} className="space-y-3">
              <input
                type="text"
                placeholder="Student ID ወይም ስም ያስገቡ..."
                value={manualQuery}
                onChange={(e) => setManualQuery(e.target.value)}
                autoFocus
                className="w-full bg-slate-950 border border-white/20 rounded-xl p-3 text-sm font-bold text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="flex-1 py-2.5 bg-slate-800 text-slate-300 font-bold text-xs rounded-xl"
                >
                  ሰርዝ (Cancel)
                </button>
                <button
                  type="submit"
                  disabled={manualSearching || !manualQuery.trim()}
                  className="flex-1 py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-black text-xs rounded-xl transition-all disabled:opacity-50"
                >
                  {manualSearching ? "በመመዝገብ ላይ..." : "ተገኝቷል በል (Mark)"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
