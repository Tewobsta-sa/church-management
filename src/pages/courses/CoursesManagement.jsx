import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { academicService } from '../../services/academicService';

export default function CoursesManagement() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        const response = await academicService.getCourses({ search });
        setCourses(Array.isArray(response?.data) ? response.data : (Array.isArray(response) ? response : []));
      } catch {
        setCourses([]);
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, [search]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Academic Curriculum</h1>
          <p className="text-slate-500 font-medium mt-1">Manage young program courses</p>
        </div>
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
      </div>

      <div className="glass-panel overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-200/60 text-slate-500 text-sm tracking-wide">
              <th className="px-6 py-4 font-semibold">Name</th>
              <th className="px-6 py-4 font-semibold">Title</th>
              <th className="px-6 py-4 font-semibold">Description</th>
              <th className="px-6 py-4 font-semibold">Program Type</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan="4" className="text-center py-10 font-medium text-slate-500">Loading courses...</td></tr>
            ) : courses.length === 0 ? (
               <tr><td colSpan="4" className="text-center py-10 font-medium text-slate-500">No courses found.</td></tr>
            ) : (
               courses.map(course => (
                 <tr key={course.id} className="hover:bg-slate-50/50 transition-colors group">
                   <td className="px-6 py-4 font-semibold text-slate-800">{course.name}</td>
                   <td className="px-6 py-4 text-slate-700">{course.title || "-"}</td>
                   <td className="px-6 py-4 text-slate-600">{course.description || "-"}</td>
                   <td className="px-6 py-4 font-medium text-brand-700">{course.program_type_id ?? "-"}</td>
                 </tr>
               ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
