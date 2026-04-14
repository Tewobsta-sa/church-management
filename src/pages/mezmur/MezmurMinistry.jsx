import { useState, useEffect } from 'react';
import { Music, Users } from 'lucide-react';
import { mezmurService } from "../../services/mezmurService";

export default function MezmurMinistry() {
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
     const fetchData = async () => {
        try {
           const asData = await mezmurService.getAssignments();
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
          <p className="text-slate-500 font-medium mt-1">View ministry assignments, classes, and assigned students</p>
        </div>
      </div>

      <div className="glass-panel overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50/60 border-b border-slate-200/60 text-slate-500 text-xs uppercase tracking-widest font-bold">
              <th className="px-6 py-4">Ministry</th>
              <th className="px-6 py-4">Trainer</th>
              <th className="px-6 py-4">No. Students</th>
              <th className="px-6 py-4">Class Count</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {assignments.map((a) => (
              <tr key={a.id} onClick={() => setSelected(a)} className="hover:bg-slate-50 transition-colors cursor-pointer">
                <td className="px-6 py-4 font-bold text-slate-800">{a.group_name || `Ministry ${a.id}`}</td>
                <td className="px-6 py-4 text-slate-700">{a.trainer?.user?.name || "-"}</td>
                <td className="px-6 py-4 font-semibold text-brand-700">{a.students_count || 0}</td>
                <td className="px-6 py-4 text-slate-600">{a.mezmurs?.length || 0}</td>
              </tr>
            ))}
            {assignments.length === 0 && !loading && (
              <tr><td colSpan="4" className="px-6 py-8 text-center text-slate-500">No active ministry assignments.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {selected && (
        <div className="glass-panel p-6">
          <h3 className="font-bold text-lg mb-2">{selected.group_name || `Ministry ${selected.id}`}</h3>
          <p className="text-sm text-slate-600 mb-4">Trainer: {selected.trainer?.user?.name || "-"}</p>
          <div className="mb-4">
            <p className="text-xs uppercase tracking-wider text-slate-500 mb-2">Mezmur Classes</p>
            <div className="flex flex-wrap gap-2">
              {(selected.mezmurs || []).map((m) => (
                <span key={m.id} className="px-3 py-1 rounded-full bg-brand-50 text-brand-700 text-sm">{m.title || m.name}</span>
              ))}
              {(selected.mezmurs || []).length === 0 && <span className="text-sm text-slate-500">No classes assigned.</span>}
            </div>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-500 mb-2">Assigned Students</p>
            <div className="space-y-2 max-h-56 overflow-y-auto">
              {(selected.students || []).map((s) => (
                <div key={s.id} className="p-2 bg-slate-50 rounded text-sm flex items-center gap-2">
                  <Users className="w-4 h-4 text-brand-700" /> {s.name}
                </div>
              ))}
              {(selected.students || []).length === 0 && <p className="text-sm text-slate-500">No students assigned in this ministry.</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
