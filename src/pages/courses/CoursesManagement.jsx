import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, Filter } from 'lucide-react';
// import { courseService } from '../../services/courseService'; // Placeholder for integration

export default function CoursesManagement() {
  const [courses, setCourses] = useState([
     { id: 1, name: "Intro to Theology", code: "THL-101", credits: 3, track: "Regular", status: "Active" },
     { id: 2, name: "Advanced History", code: "HIS-401", credits: 4, track: "Young", status: "Active" },
     { id: 3, name: "Remote Study Seminar", code: "SEM-001", credits: 2, track: "Distance", status: "Draft" },
  ]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  
  const handleCreate = () => {
     alert("Create course modal placeholder");
  }

  const handleDelete = (id) => {
     if(confirm("Delete this course?")) {
        setCourses(prev => prev.filter(c => c.id !== id));
     }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Academic Curriculum</h1>
          <p className="text-slate-500 font-medium mt-1">Manage courses, credits, and syllabus details</p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 bg-gradient-to-r from-brand-600 to-brand-500 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-brand-500/30 hover:-translate-y-0.5 transition-all"
        >
          <Plus className="w-5 h-5" />
          Add Course
        </button>
      </div>

      <div className="glass-panel p-3 flex flex-wrap sm:flex-nowrap gap-3 items-center">
        <div className="relative w-full sm:flex-1 max-w-sm">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
            <Search className="h-5 w-5" />
          </div>
          <input
            type="text"
            placeholder="Search courses by name or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-white/70 border border-slate-200 rounded-xl focus:border-brand-500 outline-none focus:ring-4 focus:ring-brand-500/10 transition-all text-sm font-medium"
          />
        </div>
        <div className="relative w-full sm:w-64">
           <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
             <Filter className="h-4 w-4" />
           </div>
           <select className="w-full pl-10 pr-4 py-2.5 bg-white/70 border border-slate-200 rounded-xl focus:border-brand-500 outline-none focus:ring-4 focus:ring-brand-500/10 transition-all text-sm font-bold text-slate-700">
             <option value="">All Tracks</option>
             <option value="Regular">Regular</option>
             <option value="Young">Young</option>
             <option value="Distance">Distance</option>
           </select>
        </div>
      </div>

      <div className="glass-panel overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-200/60 text-slate-500 text-sm tracking-wide">
              <th className="px-6 py-4 font-semibold">Course Details</th>
              <th className="px-6 py-4 font-semibold">Track</th>
              <th className="px-6 py-4 font-semibold">Credits</th>
              <th className="px-6 py-4 font-semibold">Status</th>
              <th className="px-6 py-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {courses.length === 0 ? (
               <tr><td colSpan="5" className="text-center py-10 font-medium text-slate-500">No courses setup yet.</td></tr>
            ) : (
               courses.map(course => (
                 <tr key={course.id} className="hover:bg-slate-50/50 transition-colors group">
                   <td className="px-6 py-4">
                      <div className="font-bold text-slate-800">{course.name}</div>
                      <div className="text-xs font-semibold text-slate-400">{course.code}</div>
                   </td>
                   <td className="px-6 py-4">
                     <span className="inline-flex flex-col gap-1 items-start">
                       <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-brand-50 text-brand-700 border border-brand-100 uppercase">{course.track}</span>
                     </span>
                   </td>
                   <td className="px-6 py-4 font-semibold text-slate-600">{course.credits} Cr.</td>
                   <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 rounded-full text-[10px] uppercase font-bold tracking-widest ${course.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>{course.status}</span>
                   </td>
                   <td className="px-6 py-4 text-right">
                     <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                       <button onClick={() => alert("Edit pending")} className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all" title="Edit Course">
                         <Edit2 className="w-4 h-4" />
                       </button>
                       <button onClick={() => handleDelete(course.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" title="Delete">
                         <Trash2 className="w-4 h-4" />
                       </button>
                     </div>
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
