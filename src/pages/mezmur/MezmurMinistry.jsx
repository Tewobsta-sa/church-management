import { useState, useEffect } from 'react';
import { Music, Users, Star, Plus, Settings, Trash2, Edit2, Layers, X, Save, CheckCircle2, AlertCircle } from 'lucide-react';
import { mezmurService } from "../../services/mezmurService";
import { useAuth } from "../../context/AuthContext";

export default function MezmurMinistry() {
  const { hasRole } = useAuth();
  const isMezmurAdmin = hasRole("mezmur_office_admin") || hasRole("super_admin");
  
  const [loading, setLoading] = useState(true);
  const [trainers, setTrainers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [assignments, setAssignments] = useState([]);
  
  // Modals
  const [trainerModal, setTrainerModal] = useState(false);
  const [categoryModal, setCategoryModal] = useState(false);
  const [assignModal, setAssignModal] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [tr, cat, assign] = await Promise.all([
        mezmurService.getTrainers(),
        mezmurService.getCategories(),
        mezmurService.getAssignments()
      ]);
      setTrainers(tr.data || []);
      setCategories(cat.data || []);
      setAssignments(assign.data || []);
    } catch (err) {
      console.error("Failed to load ministry data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="space-y-8 animate-[fade-in_0.3s_ease-out]">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-3">
             Mezmur Ministry
             <span className="bg-brand-50 text-brand-700 text-[10px] px-3 py-1 rounded-full uppercase tracking-[0.2em] font-black border border-brand-100">
               Choir Dept
             </span>
          </h1>
          <p className="text-slate-500 font-medium mt-1">Manage choir categories, trainer specialties, and student groupings</p>
        </div>
        {isMezmurAdmin && (
          <div className="flex gap-2">
            <button onClick={() => setCategoryModal(true)} className="flex items-center gap-2 bg-white text-slate-700 border border-slate-200 px-5 py-2.5 rounded-xl font-bold shadow-sm hover:bg-slate-50 transition-all">
              <Layers className="w-4 h-4 text-brand-600" />
              Build Category
            </button>
            <button onClick={() => setTrainerModal(true)} className="flex items-center gap-2 bg-gradient-to-r from-brand-700 to-brand-500 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-brand-500/30 hover:-translate-y-0.5 transition-all">
              <Plus className="w-5 h-5" />
              Add Trainer
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
         {/* Sidebar: Categories & Trainers */}
         <div className="xl:col-span-1 space-y-6">
            {/* Categories */}
            <div className="glass-panel p-6 border-t-4 border-t-brand-500">
               <div className="flex justify-between items-center mb-6">
                  <h3 className="font-extrabold text-slate-800 flex items-center gap-2 uppercase tracking-widest text-[11px]">
                     <Music className="w-4 h-4 text-brand-600" /> Categories
                  </h3>
               </div>
               <div className="space-y-3">
                  {categories.map(cat => (
                    <div key={cat.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center group">
                       <span className="font-bold text-slate-700 text-sm">{cat.name}</span>
                       <span className="text-[10px] font-black text-brand-600 uppercase bg-white px-2 py-0.5 rounded border border-slate-200">{cat.type}</span>
                    </div>
                  ))}
               </div>
            </div>

            {/* Trainers */}
            <div className="glass-panel p-6 border-t-4 border-t-amber-500">
               <div className="flex justify-between items-center mb-6">
                  <h3 className="font-extrabold text-slate-800 flex items-center gap-2 uppercase tracking-widest text-[11px]">
                     <Star className="w-4 h-4 text-amber-500" /> Experts / Trainers
                  </h3>
               </div>
               <div className="space-y-4">
                  {trainers.map(t => (
                    <div key={t.id} className="flex items-center gap-3 p-1">
                       <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center font-black text-slate-400">
                           {t.user?.name?.charAt(0) || 'T'}
                       </div>
                       <div>
                          <p className="font-black text-slate-800 text-sm leading-none mb-1">{t.user?.name}</p>
                          <div className="flex gap-1 flex-wrap">
                             {t.specialties?.map(s => (
                               <span key={s} className="text-[9px] font-black uppercase text-amber-600 px-1.5 bg-amber-50 rounded border border-amber-100">{s}</span>
                             ))}
                          </div>
                       </div>
                    </div>
                  ))}
               </div>
            </div>
         </div>

         {/* Main Content: Assignments */}
         <div className="xl:col-span-3 space-y-8">
            <div className="glass-panel overflow-hidden border-slate-200">
               <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                  <h3 className="font-black text-slate-800 uppercase tracking-widest text-sm flex items-center gap-2">
                     <Users className="w-5 h-5 text-brand-600" /> Training Group Matrix
                  </h3>
               </div>
               <div className="overflow-x-auto">
                  <table className="w-full text-left">
                     <thead>
                        <tr className="bg-white border-b border-slate-100 text-[10px] uppercase tracking-[0.2em] font-black text-slate-400">
                           <th className="px-8 py-4">Ministry Group</th>
                           <th className="px-8 py-4">Assigned Mentor</th>
                           <th className="px-8 py-4">Presence</th>
                           <th className="px-8 py-4 text-right">Activity</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100">
                        {assignments.length === 0 ? (
                           <tr><td colSpan="4" className="px-8 py-20 text-center font-bold text-slate-400 uppercase text-xs tracking-widest">No active training groups established</td></tr>
                        ) : (
                           assignments.map(a => (
                              <tr key={a.id} className="hover:bg-slate-50/50 transition-colors group">
                                 <td className="px-8 py-5">
                                    <p className="font-black text-slate-800">{a.group_name || `Squad ${a.id}`}</p>
                                    <p className="text-[10px] font-bold text-brand-600 uppercase">{a.category?.name || 'Vocal'}</p>
                                 </td>
                                 <td className="px-8 py-5 flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-black text-xs">
                                       {a.trainer?.user?.name?.charAt(0)}
                                    </div>
                                    <span className="font-bold text-slate-700 text-sm">{a.trainer?.user?.name || 'Pending'}</span>
                                 </td>
                                 <td className="px-8 py-5">
                                    <div className="flex items-center gap-2">
                                       <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                          <div className="bg-brand-500 h-full rounded-full" style={{width: `${(a.students_count/20)*100}%`}}></div>
                                       </div>
                                       <span className="text-[10px] font-black text-slate-500 uppercase">{a.students_count || 0} Members</span>
                                    </div>
                                 </td>
                                 <td className="px-8 py-5 text-right">
                                    <button className="text-[10px] font-black uppercase text-brand-600 tracking-widest hover:underline">View Detail</button>
                                 </td>
                              </tr>
                           ))
                        )}
                     </tbody>
                  </table>
               </div>
            </div>

            {/* Unassigned Warning Roster */}
            <div className="bg-amber-50 border-2 border-amber-200 border-dashed rounded-3xl p-8 relative overflow-hidden">
               <div className="relative z-10">
                  <h3 className="font-black text-amber-900 uppercase tracking-widest text-sm mb-4 flex items-center gap-2">
                     <AlertCircle className="w-5 h-5" /> Pipeline Members (Pending Assignment)
                  </h3>
                  <div className="flex flex-wrap gap-3">
                     {[1,2,3].map(i => (
                        <div key={i} className="bg-white px-4 py-2 rounded-2xl border border-amber-200 shadow-sm flex items-center gap-3">
                           <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
                           <span className="font-black text-xs text-slate-700 uppercase">Student #{i}...</span>
                           <button onClick={() => setAssignModal(true)} className="ml-2 text-[9px] font-black text-amber-600 underline uppercase">Assign</button>
                        </div>
                     ))}
                  </div>
               </div>
               <Music className="absolute -bottom-10 -right-10 w-48 h-48 text-amber-200/20 rotate-12" />
            </div>
         </div>
      </div>
      
      {/* Simple Modals Placeholders */}
      {trainerModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-6">
           <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8">
              <div className="flex justify-between items-center mb-6">
                 <h2 className="text-2xl font-black text-slate-800">New Trainer</h2>
                 <button onClick={() => setTrainerModal(false)}><X /></button>
              </div>
              <p className="text-sm text-slate-500 font-medium mb-6">Promote a user to Mezmur Trainer status.</p>
              <div className="space-y-4">
                 <select className="w-full p-3 bg-slate-50 border-slate-200 rounded-xl font-bold">
                    <option>Select User...</option>
                 </select>
                 <button className="w-full py-4 bg-brand-600 text-white rounded-2xl font-black uppercase tracking-widest">Register Trainer</button>
              </div>
           </div>
        </div>
      )}

      {categoryModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-6">
           <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8">
              <div className="flex justify-between items-center mb-6">
                 <h2 className="text-2xl font-black text-slate-800">New Category</h2>
                 <button onClick={() => setCategoryModal(false)}><X /></button>
              </div>
              <div className="space-y-4">
                 <input placeholder="Category Name (e.g. Vocal)" className="w-full p-3 bg-slate-50 border-slate-200 rounded-xl font-bold" />
                 <select className="w-full p-3 bg-slate-50 border-slate-200 rounded-xl font-bold">
                    <option>Type: Vocal</option>
                    <option>Type: Instrument</option>
                    <option>Type: Theory</option>
                 </select>
                 <button className="w-full py-4 bg-brand-600 text-white rounded-2xl font-black uppercase tracking-widest">Create Category</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
