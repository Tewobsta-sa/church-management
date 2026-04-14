import { useState, useEffect, useRef } from 'react';
import { Camera, Grid, CheckCircle, XCircle, Search, Save, UserCheck, AlertCircle, X, ChevronLeft } from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useLocation, useNavigate } from 'react-router-dom';
import { attendanceService } from '../../services/attendanceService';
import { assignmentService } from '../../services/assignmentService';
import { sectionService } from '../../services/sectionService';

export default function LiveAttendance() {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const assignmentId = queryParams.get('assignment_id');

  const [mode, setMode] = useState('grid'); // 'grid' | 'qr'
  const [assignment, setAssignment] = useState(null);
  const [students, setStudents] = useState([]);
  const [records, setRecords] = useState({}); // student_id -> status
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  
  const scannerRef = useRef(null);

  const fetchData = async () => {
    if (!assignmentId) return;
    setLoading(true);
    try {
      // 1. Get Assignment details
      const assign = await assignmentService.getAssignments({ id: assignmentId });
      const currentAssign = Array.isArray(assign?.data) ? assign.data.find(a => a.id == assignmentId) : assign;
      setAssignment(currentAssign);

      if (currentAssign?.section_id) {
        // 2. Get Students in that section
        const studentData = await sectionService.getSectionStudents(currentAssign.section_id);
        setStudents(studentData || []);
      }

      // 3. Get existing attendance for this assignment
      const attendanceData = await attendanceService.getAttendanceRecords({ assignment_id: assignmentId });
      const existing = {};
      attendanceData.data?.forEach(r => {
        existing[r.student_id] = r.status;
      });
      setRecords(existing);

    } catch (err) {
      console.error("Failed to fetch attendance data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [assignmentId]);

  const handleMark = async (studentId, status) => {
    try {
      await attendanceService.markAttendance({
        assignment_id: assignmentId,
        student_id: studentId,
        status: status
      });
      setRecords(prev => ({ ...prev, [studentId]: status }));
    } catch (err) {
      alert("Failed to mark attendance");
    }
  };

  const onScanSuccess = async (decodedText) => {
    // decodedText could be a student_id like "YNG/001/16" or a student DB ID
    const student = students.find(s => s.student_id === decodedText || String(s.id) === decodedText);
    if (student) {
      if (records[student.id] === 'Present') return; // Already marked
      await handleMark(student.id, 'Present');
      // Optional: Sound effect or visual feedback
    }
  };

  // QR Scanner Logic
  useEffect(() => {
    if (mode === 'qr' && !scannerRef.current) {
      const scanner = new Html5QrcodeScanner(
        "qr-reader",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        /* verbose= */ false
      );
      scanner.render(onScanSuccess, (error) => {});
      scannerRef.current = scanner;
    }
    
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(e => console.error(e));
        scannerRef.current = null;
      }
    };
  }, [mode, students]);

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) || 
    s.student_id.toLowerCase().includes(search.toLowerCase())
  );

  if (!assignmentId) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-500">
         <AlertCircle className="w-16 h-16 mb-4 opacity-20" />
         <p className="font-bold text-lg">No active session selected</p>
         <p className="text-sm">Please select a course or training from the Schedule.</p>
         <button onClick={() => navigate('/assignments')} className="mt-4 px-6 py-2 bg-brand-600 text-white rounded-xl font-bold">Go to Schedule</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <button onClick={() => navigate('/assignments')} className="flex items-center gap-1 text-xs font-black text-brand-600 uppercase tracking-widest mb-2 hover:translate-x-[-4px] transition-transform">
              <ChevronLeft className="w-4 h-4" /> Back to Schedule
           </button>
           <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-3">
              Live Presence Tracker
              {assignment && (
                <span className="text-sm font-black bg-brand-50 text-brand-600 px-3 py-1 rounded-full border border-brand-100 uppercase">
                  {assignment.type === 'Course' ? assignment.assignment_courses?.[0]?.course?.name : 'Mezmur'}
                </span>
              )}
           </h1>
           <p className="text-slate-500 font-medium mt-1">Section: {assignment?.section?.name || '...'} | Date: {new Date().toLocaleDateString()}</p>
        </div>
        <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-slate-200">
           <button onClick={() => setMode('grid')} className={`px-5 py-2.5 text-sm font-bold rounded-xl flex items-center gap-2 transition-all ${mode === 'grid' ? 'bg-brand-50 text-brand-600 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}>
              <Grid className="w-4 h-4" /> Manual Grid
           </button>
           <button onClick={() => setMode('qr')} className={`px-5 py-2.5 text-sm font-bold rounded-xl flex items-center gap-2 transition-all ${mode === 'qr' ? 'bg-brand-50 text-brand-600 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}>
              <Camera className="w-4 h-4" /> QR Scanner
           </button>
        </div>
      </div>

      {mode === 'qr' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
           <div className="glass-panel overflow-hidden p-8 border-brand-200 bg-brand-50/10">
               <div id="qr-reader" className="w-full rounded-3xl overflow-hidden [&>div]:!border-none [&>div]:!shadow-none shadow-2xl"></div>
               <div className="mt-8 flex items-center justify-center gap-4 text-brand-700">
                  <UserCheck className="w-6 h-6 animate-pulse" />
                  <p className="font-black uppercase text-xs tracking-widest">Awaiting Scan...</p>
               </div>
           </div>
           
           <div className="glass-panel overflow-hidden flex flex-col h-[600px]">
               <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                  <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs">Recent Scans</h3>
                  <span className="text-xs font-black text-brand-600 bg-brand-50 px-3 py-1 rounded-full">
                     {Object.values(records).filter(v => v === 'Present').length} Present
                  </span>
               </div>
               <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                  {students.filter(s => records[s.id] === 'Present').length === 0 ? (
                     <div className="p-20 text-center text-slate-400 font-bold uppercase text-[10px] tracking-[0.2em]">No students scanned yet</div>
                  ) : (
                     students.filter(s => records[s.id] === 'Present').reverse().map(s => (
                        <div key={s.id} className="p-6 bg-green-50/30 flex justify-between items-center animate-[slide-in_0.3s_ease-out]">
                           <div className="flex items-center gap-4">
                              <div className="w-10 h-10 bg-green-500 text-white rounded-full flex items-center justify-center font-bold">
                                 {s.name.charAt(0)}
                              </div>
                              <div>
                                 <p className="font-extrabold text-slate-800">{s.name}</p>
                                 <p className="text-[10px] font-bold text-green-600 uppercase">{s.student_id}</p>
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
                    placeholder="Search by name or ID..." 
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl font-bold text-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all" 
                  />
               </div>
               <div className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400">
                  <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-500"></div> Present</span>
                  <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500"></div> Absent</span>
                  <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-slate-200"></div> Pending</span>
               </div>
           </div>
           
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 p-8 gap-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
              {filteredStudents.map(s => (
                 <div 
                   key={s.id} 
                   className={`p-5 rounded-3xl border-2 text-left flex flex-col transition-all duration-300 relative group overflow-hidden ${
                      records[s.id] === 'Present' ? 'bg-green-50 border-green-200' :
                      records[s.id] === 'Absent' ? 'bg-red-50 border-red-200' :
                      'bg-white border-slate-100 hover:border-brand-200 hover:shadow-xl'
                   }`}
                 >
                    <div className="flex justify-between items-start w-full mb-4 z-10">
                       <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg ${
                          records[s.id] === 'Present' ? 'bg-green-500 text-white' :
                          records[s.id] === 'Absent' ? 'bg-red-500 text-white' :
                          'bg-slate-100 text-slate-400 group-hover:bg-brand-50 group-hover:text-brand-600 transition-colors'
                       }`}>
                          {s.name.charAt(0)}
                       </div>
                       <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleMark(s.id, 'Present')} title="Mark Present" className="p-1.5 bg-green-500 text-white rounded-lg hover:scale-110 mb-1"><CheckCircle className="w-4 h-4" /></button>
                          <button onClick={() => handleMark(s.id, 'Absent')} title="Mark Absent" className="p-1.5 bg-red-500 text-white rounded-lg hover:scale-110 mb-1"><XCircle className="w-4 h-4" /></button>
                       </div>
                    </div>
                    
                    <div className="z-10">
                       <h3 className={`font-black tracking-tight leading-tight truncate ${
                          records[s.id] === 'Present' ? 'text-green-900' :
                          records[s.id] === 'Absent' ? 'text-red-900' :
                          'text-slate-800'
                       }`}>{s.name}</h3>
                       <p className={`text-[10px] font-bold mt-1 uppercase tracking-widest ${
                          records[s.id] === 'Present' ? 'text-green-600/70' :
                          records[s.id] === 'Absent' ? 'text-red-600/70' :
                          'text-slate-400'
                       }`}>{s.student_id}</p>
                    </div>

                    <div className="absolute top-0 right-0 p-3">
                       {records[s.id] === 'Present' && <CheckCircle className="w-6 h-6 text-green-500/30" />}
                       {records[s.id] === 'Absent' && <XCircle className="w-6 h-6 text-red-500/30" />}
                    </div>
                 </div>
              ))}
           </div>
        </div>
      )}
    </div>
  );
}
