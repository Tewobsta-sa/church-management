import { useState, useEffect } from 'react';
import { sectionService } from '../../services/sectionService';
import { Plus, Edit2, Trash2, Eye, BookOpen, Users, UserCheck, Search, Filter } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import SectionModal from './SectionModal';
import { translateTrack } from '../../i18n/tracks';

export default function SectionsManagement() {
  const { t } = useTranslation();
  const [sections, setSections] = useState([]);
  const [programTypes, setProgramTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedProgramType, setSelectedProgramType] = useState('');

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedSection, setSelectedSection] = useState(null);

  // Detail View
  const [detailSection, setDetailSection] = useState(null);
  const [detailTab, setDetailTab] = useState('courses');
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);

  useEffect(() => {
    loadProgramTypes();
    loadSections();
  }, [search, selectedProgramType]);

  const loadProgramTypes = async () => {
    try {
      const data = await sectionService.getProgramTypes();
      setProgramTypes(data);
      
      // Auto-select "Young" track initially
      if (!selectedProgramType) {
        const young = data.find(pt => pt.name.toLowerCase().includes('young'));
        if (young) {
          setSelectedProgramType(young.id);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadSections = async () => {
    try {
      setLoading(true);
      // We pass the current selectedProgramType or the one we just found
      const data = await sectionService.getSections(1, search, selectedProgramType);
      setSections(data.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setSelectedSection(null);
    setModalOpen(true);
  };

  const openEditModal = (section) => {
    setSelectedSection(section);
    setModalOpen(true);
  };

  const handleSaveSection = async (data, id = null) => {
    if (id) {
      await sectionService.updateSection(id, data);
    } else {
      await sectionService.createSection(data);
    }
    loadSections();
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this section?')) return;
    await sectionService.deleteSection(id);
    loadSections();
  };

  const viewDetails = async (section) => {
    setDetailSection(section);
    setDetailTab('courses');

    try {
      const [cRes, sRes, tRes] = await Promise.all([
        sectionService.getSectionCourses(section.id),
        sectionService.getSectionStudents(section.id),
        sectionService.getSectionTeachers(section.id),
      ]);
      setCourses(cRes);
      setStudents(sRes);
      setTeachers(tRes);
    } catch (e) {
      console.error(e);
    }
  };

  const closeDetail = () => {
    setDetailSection(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">
            {selectedProgramType ? programTypes.find(pt => pt.id == selectedProgramType)?.name : 'Academic'} Sections
          </h1>
          <p className="text-slate-500 font-medium mt-1">Organize student groups & classroom structures</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 bg-gradient-to-r from-brand-600 to-brand-500 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-brand-500/30 hover:-translate-y-0.5 transition-all"
        >
          <Plus className="w-5 h-5" />
          Create Section
        </button>
      </div>

      {/* Filters Overlay Panel */}
      <div className="glass-panel p-3 flex flex-wrap sm:flex-nowrap gap-3 items-center">
        <div className="relative w-full sm:flex-1 max-w-sm">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
            <Search className="h-5 w-5" />
          </div>
          <input
            type="text"
            placeholder="Search sections..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-white/70 border border-slate-200 rounded-xl focus:border-brand-500 outline-none focus:ring-4 focus:ring-brand-500/10 transition-all text-sm font-medium"
          />
        </div>
        <div className="relative w-full sm:w-64">
           <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
             <Filter className="h-4 w-4" />
           </div>
           <select
             value={selectedProgramType}
             onChange={(e) => setSelectedProgramType(e.target.value)}
             className="w-full pl-10 pr-4 py-2.5 bg-white/70 border border-slate-200 rounded-xl focus:border-brand-500 outline-none focus:ring-4 focus:ring-brand-500/10 transition-all text-sm font-bold text-slate-700"
           >
             <option value="">All Program Types</option>
             {programTypes.map(pt => (
               <option key={pt.id} value={pt.id}>{pt.name}</option>
             ))}
           </select>
        </div>
      </div>

      {/* Sections Table */}
      <div className="glass-panel overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-200/60 text-slate-500 text-sm tracking-wide">
              <th className="px-6 py-4 font-semibold">Section ID / Name</th>
              <th className="px-6 py-4 font-semibold">Track (Program)</th>
              <th className="px-6 py-4 font-semibold">Order No</th>
              <th className="px-6 py-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
               <tr><td colSpan="4" className="text-center py-10 font-medium text-slate-500">Loading sections...</td></tr>
            ) : sections.length === 0 ? (
               <tr><td colSpan="4" className="text-center py-10 font-medium text-slate-500">No sections found.</td></tr>
            ) : (
               sections.map(section => (
                 <tr key={section.id} className="hover:bg-slate-50/50 transition-colors">
                   <td className="px-6 py-4">
                      <div className="font-bold text-slate-800">{section.name}</div>
                   </td>
                   <td className="px-6 py-4">
                     <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-brand-50 text-brand-700 border border-brand-100 uppercase">
                        {translateTrack(t, programTypes.find(pt => pt.id === section.program_type_id)?.name) || 'N/A'}
                     </span>
                   </td>
                   <td className="px-6 py-4 font-semibold text-slate-600">{section.order_no || '-'}</td>
                   <td className="px-6 py-4 text-right">
                     <div className="flex gap-2 justify-end">
                       <button onClick={() => viewDetails(section)} className="p-2 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-all" title="View details">
                         <Eye className="w-5 h-5" />
                       </button>
                       <button onClick={() => openEditModal(section)} className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all">
                         <Edit2 className="w-5 h-5" />
                       </button>
                       <button onClick={() => handleDelete(section.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">
                         <Trash2 className="w-5 h-5" />
                       </button>
                     </div>
                   </td>
                 </tr>
               ))
            )}
          </tbody>
        </table>
      </div>

      {/* Detail Modal */}
      {detailSection && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-[fade-in_0.2s_ease-out]">
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-[slide-up_0.3s_ease-out]">
            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">{detailSection.name} Overview</h2>
                <p className="text-sm font-medium text-slate-500 mt-1 uppercase tracking-widest text-brand-600">
                  {translateTrack(t, programTypes.find(pt => pt.id === detailSection.program_type_id)?.name) || 'Unknown Track'}
                </p>
              </div>
              <button onClick={closeDetail} className="p-2 bg-slate-200/50 text-slate-500 hover:bg-slate-200 rounded-full transition-colors">
                <span className="text-2xl font-bold leading-none">&times;</span>
              </button>
            </div>

            {/* Tabs */}
            <div className="flex px-4 pt-2 border-b border-slate-200/60 bg-slate-50/50">
              {['courses', 'students', 'teachers'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setDetailTab(tab)}
                  className={`px-6 py-4 font-bold text-sm tracking-wide transition-colors flex items-center gap-2 border-b-2 ${
                    detailTab === tab ? 'border-brand-600 text-brand-700' : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {tab === 'courses' && <BookOpen className="w-4 h-4" />}
                  {tab === 'students' && <Users className="w-4 h-4" />}
                  {tab === 'teachers' && <UserCheck className="w-4 h-4" />}
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-auto p-8 custom-scrollbar">
              {detailTab === 'courses' && (
                <div>
                  <h3 className="font-bold text-slate-800 text-lg mb-4">Course Curriculum</h3>
                  {courses.length === 0 ? <p className="text-slate-500 font-medium">No courses mapped to this section yet.</p> : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {courses.map(c => (
                         <div key={c.id} className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                               <BookOpen className="w-5 h-5" />
                            </div>
                            <span className="font-bold text-slate-700">{c.name}</span>
                         </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {detailTab === 'students' && (
                <div>
                  <div className="flex justify-between items-end mb-4">
                     <h3 className="font-bold text-slate-800 text-lg">Enrolled Roster</h3>
                     <span className="text-sm font-bold text-brand-600 bg-brand-50 px-3 py-1 rounded-full">{students.length} Total</span>
                  </div>
                  {students.length === 0 ? <p className="text-slate-500 font-medium">No student assignments.</p> : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {students.map(s => (
                        <div key={s.id} className="p-4 border border-slate-200 rounded-2xl bg-white shadow-sm flex items-center gap-3">
                           <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500 text-xs shrink-0">
                             {s.name.charAt(0)}
                           </div>
                           <div>
                              <p className="font-bold text-slate-700 text-sm truncate">{s.name}</p>
                              <p className="text-xs text-slate-400 font-medium">{s.student_id}</p>
                           </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {detailTab === 'teachers' && (
                <div>
                  <h3 className="font-bold text-slate-800 text-lg mb-4">Instructors</h3>
                  {teachers.length === 0 ? <p className="text-slate-500 font-medium">No instructors assigned.</p> : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {teachers.map(t => (
                        <div key={t.id} className="p-4 border border-slate-200 rounded-2xl bg-white shadow-sm flex items-center gap-3">
                           <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-sm shrink-0">
                             {t.name.charAt(0)}
                           </div>
                           <span className="font-bold text-slate-700">{t.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      <SectionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        section={selectedSection}
        programTypes={programTypes}
        onSave={handleSaveSection}
      />
    </div>
  );
}