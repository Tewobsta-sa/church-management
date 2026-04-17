import { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, User, Mail, Shield, Layers, X, Save, Calculator, Loader2, KeyRound, HelpCircle } from 'lucide-react';
import { teacherService } from '../../services/teacherService';
import { sectionService } from '../../services/sectionService';
import { useAuth } from '../../context/AuthContext';

export default function TeachersManagement() {
  const { hasRole } = useAuth();
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    password_confirmation: '',
    security_question: 'What was the name of your first school?',
    security_answer: '',
    program_type_ids: [2] // Default to Young track (ID: 2)
  });

  const fetchTeachers = async () => {
    setLoading(true);
    try {
      const data = await teacherService.getTeachers(search, page);
      setTeachers(data.data || []);
      setTotalPages(data.last_page || 1);
    } catch (err) {
      console.error("Failed to fetch teachers", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, [page]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchTeachers();
  };

  const openModal = (teacher = null) => {
    if (teacher) {
      setSelectedTeacher(teacher);
      setFormData({
        name: teacher.name,
        username: teacher.username,
        password: '',
        password_confirmation: '',
        security_question: teacher.security_question || 'What was the name of your first school?',
        security_answer: '',
        program_type_ids: teacher.program_types?.map(pt => pt.id) || [2]
      });
    } else {
      setSelectedTeacher(null);
      setFormData({
        name: '',
        username: '',
        password: '',
        password_confirmation: '',
        security_question: 'What was the name of your first school?',
        security_answer: '',
        program_type_ids: [2]
      });
    }
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedTeacher) {
        // For updates, we only send password if provided
        const payload = { ...formData };
        if (!payload.password) {
            delete payload.password;
            delete payload.password_confirmation;
        }
        await teacherService.updateTeacher(selectedTeacher.id, payload);
      } else {
        await teacherService.createTeacher(formData);
      }
      setModalOpen(false);
      fetchTeachers();
    } catch (err) {
      alert(err.response?.data?.message || err.response?.data?.error || "Operation failed");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this teacher? This will also remove them from all their assigned schedules.")) return;
    try {
      await teacherService.deleteTeacher(id);
      fetchTeachers();
    } catch (err) {
      alert("Error deleting teacher");
    }
  };

  const canEdit = hasRole('tmhrt_office_admin');

  return (
    <div className="space-y-6 animate-[fade-in_0.5s_ease-out]">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Teaching Roster</h1>
          <p className="text-slate-500 font-medium mt-1">Manage academic staff for the Young Program Track</p>
        </div>
        {canEdit && (
          <button 
            onClick={() => openModal()}
            className="flex items-center gap-2 bg-gradient-to-r from-brand-700 to-brand-500 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-brand-500/30 hover:-translate-y-0.5 transition-all"
          >
            <Plus className="w-5 h-5" />
            Register Teacher
          </button>
        )}
      </div>

      <div className="glass-panel p-2 flex flex-col md:flex-row gap-4 items-center bg-slate-50 border-b border-slate-100">
         <form onSubmit={handleSearch} className="relative flex-1 group w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-brand-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Search by name or username..."
              className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/5 transition-all font-medium text-sm"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
         </form>
         <button onClick={fetchTeachers} className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-brand-500 hover:border-brand-200 transition-all shadow-sm">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
         </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {teachers.length === 0 && !loading ? (
          <div className="col-span-full py-20 text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
              <User className="w-10 h-10 text-slate-200" />
            </div>
            <h3 className="text-slate-400 font-bold uppercase tracking-widest text-sm">No teachers found</h3>
          </div>
        ) : (
          teachers.map(teacher => (
            <div key={teacher.id} className="group glass-panel p-6 bg-white hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 border border-slate-100 relative overflow-hidden flex flex-col justify-between h-full">
               <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex gap-2">
                    {canEdit && (
                      <button onClick={() => openModal(teacher)} className="p-2 bg-brand-50 text-brand-600 rounded-lg hover:bg-brand-600 hover:text-white transition-all shadow-sm">
                        <Edit2 className="w-4 h-4" />
                      </button>
                    )}
                    {canEdit && (
                      <button onClick={() => handleDelete(teacher.id)} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition-all shadow-sm">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
               </div>
               
               <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 bg-gradient-to-br from-brand-50 to-brand-100 rounded-2xl flex items-center justify-center text-brand-600 font-black text-xl shadow-inner border border-brand-200/50">
                    {teacher.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="overflow-hidden">
                    <h3 className="font-extrabold text-slate-800 text-lg truncate group-hover:text-brand-600 transition-colors">{teacher.name}</h3>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">@{teacher.username}</p>
                  </div>
               </div>

               <div className="space-y-4">
                  <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Program Tracks</span>
                    <div className="flex flex-wrap gap-1.5">
                      {teacher.program_types?.map(pt => (
                        <span key={pt.id} className="px-2.5 py-1 bg-brand-50 text-brand-700 rounded-lg text-[10px] font-black uppercase tracking-tight border border-brand-100">
                          {pt.name}
                        </span>
                      ))}
                    </div>
                  </div>
               </div>
            </div>
          ))
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 pt-8">
           {[...Array(totalPages)].map((_, i) => (
              <button 
                key={i} 
                onClick={() => setPage(i + 1)}
                className={`w-10 h-10 rounded-xl font-black transition-all ${page === i + 1 ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/30' : 'bg-white text-slate-400 hover:bg-slate-50 border border-slate-100'}`}
              >
                {i + 1}
              </button>
           ))}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-sans">
           <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto transform animate-[slide-up_0.3s_ease-out]">
              <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
                 <h2 className="text-2xl font-black text-slate-800">{selectedTeacher ? 'Update Teacher' : 'Register Teacher'}</h2>
                 <button onClick={() => setModalOpen(false)} className="p-2 hover:bg-slate-50 rounded-xl transition-colors"><X className="w-6 h-6 text-slate-400" /></button>
              </div>
              <form onSubmit={handleSubmit} className="p-8 space-y-8">
                 <div className="bg-slate-50/50 p-6 rounded-3xl border border-slate-100 space-y-6">
                    <div>
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block mb-1.5 ml-1">Full Name</label>
                        <div className="relative group">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-brand-500" />
                        <input 
                            required
                            className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl outline-none focus:border-brand-500 transition-all font-bold text-slate-700 shadow-sm"
                            value={formData.name}
                            onChange={e => setFormData({...formData, name: e.target.value})}
                            placeholder="e.g. Deacon Solomon"
                        />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block mb-1.5 ml-1">Username</label>
                        <input 
                            required
                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl outline-none focus:border-brand-500 transition-all font-bold text-slate-700 placeholder:font-medium placeholder:opacity-50 shadow-sm"
                            value={formData.username}
                            onChange={e => setFormData({...formData, username: e.target.value})}
                            placeholder="username"
                            disabled={selectedTeacher}
                        />
                        </div>
                        <div>
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block mb-1.5 ml-1">Password {selectedTeacher && '(Optional)'}</label>
                        <div className="relative group">
                            <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-brand-500" />
                            <input 
                                required={!selectedTeacher}
                                type="password"
                                className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl outline-none focus:border-brand-500 transition-all font-bold text-slate-700 placeholder:font-medium placeholder:opacity-50 shadow-sm"
                                value={formData.password}
                                onChange={e => setFormData({...formData, password: e.target.value})}
                                placeholder="••••••••"
                            />
                        </div>
                        </div>
                    </div>

                    {!selectedTeacher && (
                        <div>
                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block mb-1.5 ml-1">Confirm Password</label>
                            <input 
                                required
                                type="password"
                                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl outline-none focus:border-brand-500 transition-all font-bold text-slate-700 shadow-sm"
                                value={formData.password_confirmation}
                                onChange={e => setFormData({...formData, password_confirmation: e.target.value})}
                                placeholder="••••••••"
                            />
                        </div>
                    )}
                 </div>

                 <div className="bg-brand-50/30 p-6 rounded-3xl border border-brand-100 space-y-6">
                    <h3 className="text-xs font-black text-brand-700 uppercase tracking-widest flex items-center gap-2">
                        <Shield className="w-4 h-4" /> Account Security
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block mb-1.5 ml-1">Security Question</label>
                            <div className="relative group">
                                <HelpCircle className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-brand-500" />
                                <select 
                                    className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl outline-none focus:border-brand-500 font-bold text-slate-700 shadow-sm"
                                    value={formData.security_question}
                                    onChange={e => setFormData({...formData, security_question: e.target.value})}
                                >
                                    <option>What was the name of your first school?</option>
                                    <option>What is your mother's maiden name?</option>
                                    <option>What was the name of your first pet?</option>
                                    <option>What city were you born in?</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block mb-1.5 ml-1">Security Answer</label>
                            <input 
                                required
                                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl outline-none focus:border-brand-500 transition-all font-bold text-slate-700 shadow-sm"
                                value={formData.security_answer}
                                onChange={e => setFormData({...formData, security_answer: e.target.value})}
                                placeholder="Your answer"
                            />
                        </div>
                    </div>
                 </div>

                 <div className="pt-4">
                    <button type="submit" className="w-full py-5 bg-brand-600 text-white rounded-3xl font-black uppercase tracking-widest hover:bg-brand-700 transition-all shadow-2xl shadow-brand-500/30 active:scale-[0.98] flex items-center justify-center gap-3">
                       <Save className="w-6 h-6" />
                       {selectedTeacher ? 'Update Teacher' : 'Register Teacher'}
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
}
