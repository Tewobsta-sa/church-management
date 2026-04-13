import { useState, useEffect } from 'react';
import { Music, Users, Star, Plus, Settings } from 'lucide-react';
import { mezmurService } from "../../services/mezmurService";
import { useAuth } from "../../context/AuthContext";

export default function MezmurMinistry() {
  const { hasRole } = useAuth();
  const isSuperAdmin = hasRole("super_admin");
  const [loading, setLoading] = useState(true);
  const [trainers, setTrainers] = useState([]);
  const [assignments, setAssignments] = useState([]);
  
  // Fallbacks for unassigned logic locally
  const [unassignedMembers, setUnassignedMembers] = useState([]);

  useEffect(() => {
     const fetchData = async () => {
        try {
           const trData = await mezmurService.getTrainers();
           const asData = await mezmurService.getAssignments();
           setTrainers(trData?.data || []);
           setAssignments(asData?.data || []);
        } catch(err) {
           console.error("Failed to load ministry data", err);
        } finally {
           setLoading(false);
        }
     }
     fetchData();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-3">
             Mezmur Ministry
             <span className="bg-brand-100 text-brand-700 text-xs px-2.5 py-1 rounded-full uppercase tracking-widest font-black flex items-center gap-1">
               <Music className="w-3 h-3" /> Dept
             </span>
          </h1>
          <p className="text-slate-500 font-medium mt-1">Manage choir groups, trainer specialties, and assignments</p>
        </div>
        {!isSuperAdmin && (
          <button className="flex items-center gap-2 bg-gradient-to-r from-brand-600 to-brand-500 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-brand-500/30 hover:-translate-y-0.5 transition-all">
            <Plus className="w-5 h-5" />
            Assign Member
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         {/* Trainers & Specialties Card */}
         <div className="lg:col-span-1 space-y-6">
            <div className="glass-panel p-6">
               <div className="flex justify-between items-center mb-6">
                  <h3 className="font-extrabold text-slate-800 text-lg flex items-center gap-2">
                     <Star className="w-5 h-5 text-amber-500" /> Trainers
                  </h3>
                  {!isSuperAdmin && <button className="text-brand-600 hover:text-brand-700 font-bold text-sm">Add Trainer</button>}
               </div>
               <div className="space-y-4">
                  {trainers.map(trainer => (
                     <div key={trainer.id} className="p-4 border border-slate-100 rounded-2xl bg-slate-50/50 hover:bg-slate-50 transition-colors">
                        <p className="font-bold text-slate-800 text-base">{trainer.user?.name || `Trainer #${trainer.id}`}</p>
                        <p className="text-xs font-bold text-brand-600 mb-2 mt-0.5">{trainer.specialty || "General"}</p>
                     </div>
                  ))}
                  {trainers.length === 0 && !loading && (
                     <p className="text-sm text-slate-500 font-medium">No registered trainers.</p>
                  )}
               </div>
            </div>
         </div>

         {/* Training Groups Card */}
         <div className="lg:col-span-2 space-y-6">
            <div className="glass-panel overflow-hidden">
               <div className="bg-slate-50/50 p-6 border-b border-slate-100 flex justify-between items-center">
                  <h3 className="font-extrabold text-slate-800 text-lg flex items-center gap-2">
                     <Users className="w-5 h-5 text-brand-600" /> Training Groups
                  </h3>
                  <button className="text-slate-400 hover:text-brand-600 transition-colors">
                     <Settings className="w-5 h-5" />
                  </button>
               </div>
               
               <table className="w-full text-left">
                 <thead>
                   <tr className="bg-white border-b border-slate-200/60 text-slate-500 text-xs uppercase tracking-widest font-bold">
                     <th className="px-6 py-4">Group Name</th>
                     <th className="px-6 py-4">Assigned Trainer</th>
                     <th className="px-6 py-4">Member Count</th>
                     <th className="px-6 py-4 text-right">Actions</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                    {assignments.length > 0 ? assignments.map(a => (
                      <tr key={a.id} className="hover:bg-slate-50 transition-colors group">
                         <td className="px-6 py-4 font-bold text-slate-800">{a.group_name || `Group ${a.id}`}</td>
                         <td className="px-6 py-4 font-medium text-brand-600">{a.trainer?.user?.name || "Unassigned Trainer"}</td>
                         <td className="px-6 py-4 font-semibold text-slate-600">{a.students_count || 0} Members</td>
                         <td className="px-6 py-4 text-right">
                            {!isSuperAdmin && <button className="text-sm font-bold text-brand-600 hover:underline">Manage</button>}
                         </td>
                      </tr>
                    )) : (
                      <tr><td colSpan="4" className="px-6 py-8 text-center text-slate-500">No active ministry assignments mapped.</td></tr>
                    )}
                 </tbody>
               </table>
            </div>

            <div className="glass-panel p-6 border-l-4 border-l-amber-400">
               <h3 className="font-bold text-amber-900 text-sm mb-1">Unassigned Members</h3>
               <p className="font-medium text-amber-700 text-xs mb-3">There are members that need group assignment.</p>
               <div className="flex flex-wrap gap-2">
                  {unassignedMembers.map(m => (
                     <span key={m.id} className="bg-white px-3 py-1.5 rounded-lg border border-amber-200 text-amber-800 font-bold text-sm shadow-sm flex items-center gap-2">
                        {m.name || "Member"} 
                        {m.specialties && <span className="text-[10px] uppercase text-amber-500 border border-amber-200 px-1 rounded bg-amber-50">{m.specialties[0]}</span>}
                     </span>
                  ))}
                  {unassignedMembers.length === 0 && (
                     <p className="text-xs text-amber-600 font-bold opacity-80 mb-2">All members are correctly assigned at this time.</p>
                  )}
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}
