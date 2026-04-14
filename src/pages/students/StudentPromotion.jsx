import { useState, useEffect } from "react";
import { CheckCircle2, AlertCircle, TrendingUp, Users, CheckSquare, Square } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { academicService } from "../../services/academicService";
import { studentService } from "../../services/studentService";

export default function StudentPromotion() {
  const { hasRole } = useAuth();
  const [loading, setLoading] = useState(false);
  const [candidates, setCandidates] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);

  const canPromote = hasRole("super_admin") || hasRole("tmhrt_office_admin") || hasRole("gngnunet_office_admin");

  const fetchCandidates = async () => {
    try {
      setLoading(true);
      // Fetch young students for promotion. 
      // We might want students who are verified but not yet promoted, 
      // or all students to allow verifying them here.
      const res = await studentService.getYoungStudents(1, "", { per_page: 200 });
      setCandidates(res.data || []);
    } catch (err) {
      console.error("Failed fetching candidates", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, []);

  const handleToggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleSelectAll = (isVerifiedOnly = false) => {
    if (selectedIds.length === candidates.length) {
       setSelectedIds([]);
    } else {
       const ids = isVerifiedOnly 
        ? candidates.filter(c => c.is_verified).map(c => c.id)
        : candidates.map(c => c.id);
       setSelectedIds(ids);
    }
  };

  const handleBulkVerify = async () => {
    if (selectedIds.length === 0) return;
    try {
      setLoading(true);
      await academicService.bulkVerify(selectedIds);
      alert("Selected students verified successfully!");
      fetchCandidates();
      setSelectedIds([]);
    } catch (err) {
      alert("Bulk verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleExecutePromotion = async () => {
    const verifiedCount = candidates.filter(c => c.is_verified).length;
    if (verifiedCount === 0) {
      alert("No verified students found for promotion.");
      return;
    }

    if (confirm(`Execute promotion for all ${verifiedCount} verified young students? This will move them to their next respective sections.`)) {
      setLoading(true);
      try {
        await academicService.promoteYoung();
        alert("Promotion executed successfully!");
        fetchCandidates();
      } catch (err) {
        alert(err.response?.data?.message || "Promotion failed.");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Academic Promotion</h1>
          <p className="text-slate-500 font-medium mt-1">Manage advancements for the Young Program Track</p>
        </div>
        <div className="flex gap-3">
           <button
             onClick={handleBulkVerify}
             disabled={loading || selectedIds.length === 0}
             className="flex items-center gap-2 bg-white text-slate-700 border border-slate-200 px-5 py-2.5 rounded-xl font-bold shadow-sm hover:bg-slate-50 transition-all disabled:opacity-50"
           >
             <CheckCircle2 className="w-5 h-5 text-green-500" />
             Verify Selected ({selectedIds.length})
           </button>
           {canPromote && (
             <button
               onClick={handleExecutePromotion}
               disabled={loading}
               className="flex items-center gap-2 bg-gradient-to-r from-brand-700 to-brand-500 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-brand-500/30 hover:-translate-y-0.5 transition-all disabled:opacity-50"
             >
               <TrendingUp className="w-5 h-5" />
               Execute All Promotions
             </button>
           )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
         <div className="glass-panel p-6 border-l-4 border-l-slate-400">
            <h3 className="text-slate-500 font-bold text-xs uppercase tracking-widest mb-2">Total Candidates</h3>
            <p className="text-4xl font-black text-slate-800">{candidates.length}</p>
         </div>
         <div className="glass-panel p-6 border-l-4 border-l-brand-500">
            <h3 className="text-slate-500 font-bold text-xs uppercase tracking-widest mb-2">Verified (Ready)</h3>
            <p className="text-4xl font-black text-brand-600">{candidates.filter(c => c.is_verified).length}</p>
         </div>
         <div className="glass-panel p-6 bg-brand-50 border border-brand-100 flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-brand-600 shrink-0 mt-1" />
            <div>
               <h4 className="font-bold text-brand-900 text-sm">Promotion Logic</h4>
               <p className="text-xs text-brand-700 mt-1 font-medium leading-relaxed">
                 Promotion moves students to the next section by order. Verified students in the final Young section will transition to the Regular Track automatically.
               </p>
            </div>
         </div>
      </div>

      {/* Table */}
      <div className="glass-panel overflow-hidden border-slate-200/60 transition-all">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200/60 text-slate-500 text-[11px] uppercase tracking-widest font-black">
                <th className="px-6 py-4 w-12">
                   <button onClick={() => handleSelectAll()} className="text-slate-400 hover:text-brand-600 transition-colors">
                      {selectedIds.length === candidates.length ? <CheckSquare className="w-5 h-5 text-brand-600" /> : <Square className="w-5 h-5" />}
                   </button>
                </th>
                <th className="px-6 py-4">Student Details</th>
                <th className="px-6 py-4">Current Placement</th>
                <th className="px-6 py-4">Attendance Stats</th>
                <th className="px-6 py-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && candidates.length === 0 ? (
                <tr><td colSpan="5" className="px-6 py-12 text-center text-slate-400 font-bold">Fetching promotion candidates...</td></tr>
              ) : candidates.length === 0 ? (
                <tr><td colSpan="5" className="px-6 py-12 text-center text-slate-500 font-bold">No candidates found in the Young track.</td></tr>
              ) : (
                candidates.map((c) => (
                  <tr key={c.id} className={`group transition-colors ${selectedIds.includes(c.id) ? 'bg-brand-50/30' : 'hover:bg-slate-50/50'}`}>
                    <td className="px-6 py-4">
                       <button onClick={() => handleToggleSelect(c.id)} className="text-slate-300 group-hover:text-brand-400 transition-colors">
                          {selectedIds.includes(c.id) ? <CheckSquare className="w-5 h-5 text-brand-600" /> : <Square className="w-5 h-5" />}
                       </button>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-extrabold text-slate-800">{c.name}</p>
                      <p className="text-[10px] text-slate-500 font-bold tracking-tight">ID: {c.student_id}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="inline-flex items-center px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-[10px] font-black text-slate-600 uppercase">
                        {c.section_name || "Unassigned"}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-4">
                        <div className="flex flex-col">
                           <span className="text-[9px] font-bold text-slate-400 uppercase">Course</span>
                           <span className="text-xs font-black text-slate-700">{c.course_attendance_avg || 0}%</span>
                        </div>
                        <div className="flex flex-col">
                           <span className="text-[9px] font-bold text-slate-400 uppercase">Mezmur</span>
                           <span className="text-xs font-black text-slate-700">{c.mezmur_attendance_avg || 0}%</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {c.is_verified ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 text-[10px] font-black rounded-full border border-green-200 uppercase tracking-widest shadow-sm">
                           <CheckCircle2 className="w-3 h-3" /> Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-600 text-[10px] font-black rounded-full border border-amber-200 uppercase tracking-widest">
                           <AlertCircle className="w-3 h-3" /> Pending
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
