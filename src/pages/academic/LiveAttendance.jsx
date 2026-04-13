import { useState, useEffect } from 'react';
import { Camera, Grid, CheckCircle, XCircle, Search, Save } from 'lucide-react';
import { Html5QrcodeScanner, Html5Qrcode } from 'html5-qrcode';

export default function LiveAttendance() {
  const [mode, setMode] = useState('grid'); // 'grid' | 'qr'
  const [session, setSession] = useState({ date: new Date().toISOString().split('T')[0], section: 'Y6' });
  const [loading, setLoading] = useState(false);
  
  // Mock data
  const [students, setStudents] = useState([
     { id: 1, name: "Abebe Kebede", student_id: "YNG/001/16", status: "present" },
     { id: 2, name: "Helen Girma", student_id: "YNG/002/16", status: "absent" },
     { id: 3, name: "Dawit Solomon", student_id: "REG/120/15", status: "pending" },
     { id: 4, name: "Sofia Tadesse", student_id: "YNG/003/16", status: "pending" },
  ]);

  const toggleStatus = (id) => {
     setStudents(prev => prev.map(s => {
       if(s.id === id) {
         const next = s.status === 'pending' ? 'present' : s.status === 'present' ? 'absent' : 'pending';
         return { ...s, status: next };
       }
       return s;
     }));
  }

  const markAllPresent = () => {
    setStudents(prev => prev.map(s => ({ ...s, status: 'present' })));
  }

  // QR Scanner Logic
  useEffect(() => {
    if (mode === 'qr') {
      const scanner = new Html5QrcodeScanner(
        "qr-reader",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        false
      );

      scanner.render((decodedText) => {
         try {
           const data = JSON.parse(decodedText);
           setStudents(prev => prev.map(s => s.id === data.id || s.student_id === data.sid ? { ...s, status: 'present' } : s));
         } catch(e) {
           console.log("Invalid QR format", decodedText);
           // Fallback to simple matching if it's just raw Student ID
           setStudents(prev => prev.map(s => s.student_id === decodedText ? { ...s, status: 'present' } : s));
         }
      }, (error) => {
         // silently ignore scan errors
      });

      return () => {
        scanner.clear().catch(error => console.error("Failed to clear html5QrcodeScanner. ", error));
      };
    }
  }, [mode]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Live Attendance</h1>
          <p className="text-slate-500 font-medium mt-1">Capture real-time presence via QR or Grid Roll-call</p>
        </div>
        <div className="flex bg-white p-1 rounded-xl shadow-sm border border-slate-200">
           <button onClick={() => setMode('grid')} className={`px-4 py-2 text-sm font-bold rounded-lg flex items-center gap-2 transition-all ${mode === 'grid' ? 'bg-brand-50 text-brand-600 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}>
              <Grid className="w-4 h-4" /> Manual Grid
           </button>
           <button onClick={() => setMode('qr')} className={`px-4 py-2 text-sm font-bold rounded-lg flex items-center gap-2 transition-all ${mode === 'qr' ? 'bg-brand-50 text-brand-600 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}>
              <Camera className="w-4 h-4" /> QR Scanner
           </button>
        </div>
      </div>

      <div className="glass-panel p-4 flex flex-wrap sm:flex-nowrap gap-4 items-end">
         <div className="w-full sm:w-1/3">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Session Date</label>
            <input type="date" value={session.date} onChange={(e) => setSession({...session, date: e.target.value})} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:border-brand-500 font-bold text-slate-700" />
         </div>
         <div className="w-full sm:w-1/3">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Section/Class</label>
            <select value={session.section} onChange={(e) => setSession({...session, section: e.target.value})} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:border-brand-500 font-bold text-slate-700">
               <option value="Y6">Y6 (Young)</option>
               <option value="R2">R2 (Regular)</option>
            </select>
         </div>
         <div className="w-full sm:w-1/3">
            <button className="w-full bg-gradient-to-r from-brand-600 to-brand-500 text-white px-5 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-brand-500/20 hover:-translate-y-0.5 transition-all">
               <Save className="w-4 h-4" /> Save Record
            </button>
         </div>
      </div>

      {mode === 'qr' ? (
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            <div className="glass-panel overflow-hidden p-6">
                <div id="qr-reader" className="w-full rounded-2xl overflow-hidden [&>div]:!border-none [&>div]:!shadow-none font-sans"></div>
                <p className="text-center text-sm font-bold text-slate-500 mt-4">Point camera at Student ID Card</p>
            </div>
            
            <div className="glass-panel overflow-hidden">
                <div className="bg-slate-50/50 p-4 border-b border-slate-100 flex justify-between items-center">
                   <h3 className="font-bold text-slate-700">Recent Scans</h3>
                   <span className="text-sm font-bold text-brand-600">{students.filter(s => s.status === 'present').length} / {students.length} Present</span>
                </div>
                <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto">
                   {students.filter(s => s.status === 'present').map(s => (
                      <div key={s.id} className="p-4 bg-green-50/30 flex justify-between items-center">
                         <div>
                            <p className="font-bold text-slate-800">{s.name}</p>
                            <p className="text-xs font-semibold text-slate-500">{s.student_id}</p>
                         </div>
                         <CheckCircle className="w-6 h-6 text-green-500" />
                      </div>
                   ))}
                   {students.filter(s => s.status === 'present').length === 0 && (
                      <div className="p-10 text-center text-slate-400 font-medium text-sm">No scans yet.</div>
                   )}
                </div>
            </div>
         </div>
      ) : (
         <div className="glass-panel overflow-hidden">
            <div className="bg-slate-50/50 p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
                <button onClick={markAllPresent} className="text-sm font-bold text-white bg-slate-800 hover:bg-slate-900 px-4 py-2 rounded-lg transition-colors w-full sm:w-auto">
                   Mark All Present
                </button>
                <div className="relative w-full sm:w-64">
                   <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                   <input type="text" placeholder="Filter roster..." className="w-full pl-9 pr-4 py-2 border-slate-200 outline-none rounded-lg text-sm bg-white" />
                </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 p-4 gap-4 max-h-[60vh] overflow-y-auto">
               {students.map(s => (
                  <button 
                    key={s.id} 
                    onClick={() => toggleStatus(s.id)}
                    className={`p-4 rounded-2xl border text-left flex flex-col transition-all duration-200 ${
                       s.status === 'present' ? 'bg-green-50 border-green-200 shadow-[0_4px_12px_rgba(34,197,94,0.1)]' :
                       s.status === 'absent' ? 'bg-red-50 border-red-200 shadow-[0_4px_12px_rgba(239,68,68,0.1)]' :
                       'bg-white border-slate-200 hover:border-brand-200 shadow-sm hover:shadow-md'
                    }`}
                  >
                     <div className="flex justify-between items-start w-full mb-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                           s.status === 'present' ? 'bg-green-500 text-white' :
                           s.status === 'absent' ? 'bg-red-500 text-white' :
                           'bg-slate-100 text-slate-500'
                        }`}>
                           {s.name.charAt(0)}
                        </div>
                        {s.status === 'present' && <CheckCircle className="w-5 h-5 text-green-500" />}
                        {s.status === 'absent' && <XCircle className="w-5 h-5 text-red-500" />}
                        {s.status === 'pending' && <div className="w-5 h-5 rounded-full border-2 border-slate-300"></div>}
                     </div>
                     <div>
                        <h3 className={`font-bold truncate ${
                           s.status === 'present' ? 'text-green-900' :
                           s.status === 'absent' ? 'text-red-900' :
                           'text-slate-800'
                        }`}>{s.name}</h3>
                        <p className={`text-xs font-semibold mt-0.5 ${
                           s.status === 'present' ? 'text-green-600/70' :
                           s.status === 'absent' ? 'text-red-600/70' :
                           'text-slate-400'
                        }`}>{s.student_id}</p>
                     </div>
                  </button>
               ))}
            </div>
         </div>
      )}
    </div>
  );
}
