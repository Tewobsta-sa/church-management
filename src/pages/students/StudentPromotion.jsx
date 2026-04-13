import { useState, useEffect } from "react";
import { CheckCircle2, AlertCircle, TrendingUp, Filter } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { academicService } from "../../services/academicService";
import { studentService } from "../../services/studentService";

export default function StudentPromotion() {
  const { hasRole } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("young"); // 'young' | 'regular'
  
  const [candidates, setCandidates] = useState([]);

  const canPromote = hasRole("super_admin") || hasRole("tmhrt_office_admin");

  const fetchCandidates = async () => {
     try {
        // Fetching young/regular students to promote
        const res = activeTab === 'young' 
            ? await studentService.getYoungStudents(1, "", { per_page: 100 })
            : await studentService.getRegularStudents(1, "", { per_page: 100 });
        
        setCandidates(res.data || []);
     } catch (err) {
        console.error("Failed fetching candidates", err);
     }
  }

  useEffect(() => {
     fetchCandidates();
  }, [activeTab]);

  const handleVerify = async (id) => {
    try {
      await academicService.verifyStudent(id);
      // Toggle locally for fast UI
      setCandidates(prev => prev.map(c => c.id === id ? { ...c, is_verified: !c.is_verified } : c));
    } catch (err) {
      alert("Failed to verify student");
    }
  };

  const handleExecutePromotion = async () => {
    const verifiedCandidateIds = candidates.filter(c => c.is_verified).map(c => c.id);
    if(verifiedCandidateIds.length === 0) {
       alert("No verified candidates selected for promotion.");
       return;
    }

    if(confirm(`Execute promotion for ${verifiedCandidateIds.length} verified students?`)) {
       setLoading(true);
       try {
         if (activeTab === 'young') {
            await academicService.promoteYoung(verifiedCandidateIds);
         } else {
            await academicService.promoteRegular(verifiedCandidateIds);
         }
         alert("Promotion executed successfully! Students moved to new track.");
         fetchCandidates();
       } catch (err) {
         alert(err.response?.data?.message || "Promotion failed.");
       } finally {
         setLoading(false);
       }
    }
  };

  const filteredCandidates = candidates.filter(c => c.current_section.startsWith(activeTab === 'young' ? 'Y' : 'R'));

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Academic Promotion</h1>
          <p className="text-slate-500 font-medium mt-1">Verify and orchestrate section advancements</p>
        </div>
        {canPromote && (
          <button
            onClick={handleExecutePromotion}
            disabled={loading}
            className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-green-500 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-green-500/30 hover:-translate-y-0.5 transition-all disabled:opacity-50"
          >
            <TrendingUp className="w-5 h-5" />
            {loading ? "Processing..." : "Commit Promotions"}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
         <div className="glass-panel p-6 border-l-4 border-l-brand-500">
            <h3 className="text-slate-500 font-bold text-sm uppercase tracking-wider mb-2">Pending Verification</h3>
            <p className="text-4xl font-black text-slate-800">{candidates.filter(c => !c.is_verified).length}</p>
         </div>
         <div className="glass-panel p-6 border-l-4 border-l-green-500">
            <h3 className="text-slate-500 font-bold text-sm uppercase tracking-wider mb-2">Ready to Promote</h3>
            <p className="text-4xl font-black text-slate-800">{candidates.filter(c => c.is_verified).length}</p>
         </div>
         <div className="glass-panel p-6 bg-brand-50 border border-brand-100 flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-brand-600 shrink-0" />
            <div>
               <h4 className="font-bold text-brand-900 text-sm">Rules</h4>
               <p className="text-xs text-brand-700 mt-1 font-medium leading-relaxed">
                 Young (Y6) completes track to enter Regular. Regular (R6) advances to Graduate. Manual verification flag required.
               </p>
            </div>
         </div>
      </div>

      <div className="glass-panel overflow-hidden">
        <div className="bg-slate-50/50 p-4 border-b border-slate-100 flex gap-2">
            <button onClick={() => setActiveTab('young')} className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors ${activeTab === 'young' ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-500 hover:bg-slate-200/50'}`}>Young Track (Y6)</button>
            <button onClick={() => setActiveTab('regular')} className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors ${activeTab === 'regular' ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-500 hover:bg-slate-200/50'}`}>Regular Track (R6)</button>
        </div>
        
        <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/20 border-b border-slate-200/60 text-slate-500 text-sm tracking-wide">
                <th className="px-6 py-4 font-semibold">Student Name</th>
                <th className="px-6 py-4 font-semibold">Current Section</th>
                <th className="px-6 py-4 font-semibold">Attendance</th>
                <th className="px-6 py-4 font-semibold">Overall Grade</th>
                <th className="px-6 py-4 font-semibold text-right">Verification Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
               {candidates.length === 0 ? (
                 <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-slate-500 font-medium">No candidates found in this track.</td>
                 </tr>
               ) : (
                  candidates.map(c => (
                     <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                           <p className="font-bold text-slate-800">{c.name}</p>
                           <p className="text-xs text-slate-500 font-medium">{c.student_id}</p>
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-600">{c.section_name || 'Unassigned'}</td>
                        <td className="px-6 py-4 font-semibold text-brand-600">-</td>
                        <td className="px-6 py-4 font-black text-slate-700">-</td>
                        <td className="px-6 py-4 text-right flex justify-end">
                           <button 
                             onClick={() => handleVerify(c.id)}
                             disabled={!canPromote}
                             title="Toggle Verification"
                             className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${c.is_verified ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-amber-100 text-amber-700 hover:bg-amber-200'} ${!canPromote && 'opacity-50 cursor-not-allowed'}`}
                           >
                             <CheckCircle2 className="w-4 h-4" />
                             {c.is_verified ? "Verified" : "Verify Pending"}
                           </button>
                        </td>
                     </tr>
                  ))
               )}
            </tbody>
        </table>
      </div>
    </div>
  );
}
