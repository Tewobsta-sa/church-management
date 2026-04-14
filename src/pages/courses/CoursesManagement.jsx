import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, Filter, BookOpen, Layers, Save, X, Calculator } from 'lucide-react';
import { courseService } from '../../services/courseService';
import { useAuth } from '../../context/AuthContext';

export default function CoursesManagement() {
  const { hasRole } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  
  // Modal states
  const [courseModalOpen, setCourseModalOpen] = useState(false);
  const [assessmentModalOpen, setAssessmentModalOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  
  const [formData, setFormData] = useState({ name: '', credit_hour: '', duration: '', program_type_name: 'Young' });
  const [assessments, setAssessments] = useState([]);
  const [newAssessment, setNewAssessment] = useState({ name: '', max_score: 100, weight: 0 });

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const data = await courseService.getCourses();
      // Filter for Young track only as per request
      setCourses(data.filter(c => c.program_type?.name === 'Young'));
    } catch (err) {
      console.error("Failed to fetch courses", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const openCourseModal = (course = null) => {
    if (course) {
      setSelectedCourse(course);
      setFormData({ 
        name: course.name, 
        credit_hour: course.credit_hour, 
        duration: course.duration, 
        program_type_name: 'Young' 
      });
    } else {
      setSelectedCourse(null);
      setFormData({ name: '', credit_hour: '', duration: '', program_type_name: 'Young' });
    }
    setCourseModalOpen(true);
  };

  const handleCourseSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedCourse) {
        await courseService.updateCourse(selectedCourse.id, formData);
      } else {
        await courseService.createCourse(formData);
      }
      setCourseModalOpen(false);
      fetchCourses();
    } catch (err) {
      alert("Error saving course");
    }
  };

  const openAssessmentModal = async (course) => {
    setSelectedCourse(course);
    setAssessmentModalOpen(true);
    try {
      const data = await courseService.getAssessments(course.id);
      setAssessments(data || []);
    } catch (err) {
      setAssessments([]);
    }
  };

  const handleAddAssessment = async () => {
    if (!newAssessment.name || !newAssessment.weight) return;
    try {
      await courseService.createAssessment({ ...newAssessment, course_id: selectedCourse.id });
      setNewAssessment({ name: '', max_score: 100, weight: 0 });
      const data = await courseService.getAssessments(selectedCourse.id);
      setAssessments(data || []);
    } catch (err) {
      alert("Error adding assessment");
    }
  };

  const handleDeleteAssessment = async (id) => {
    if(!confirm("Delete this assessment?")) return;
    try {
      await courseService.deleteAssessment(id);
      const data = await courseService.getAssessments(selectedCourse.id);
      setAssessments(data || []);
    } catch (err) {
      alert("Error deleting assessment");
    }
  };

  const totalWeight = assessments.reduce((sum, a) => sum + (Number(a.weight) || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Young Program Curriculum</h1>
          <p className="text-slate-500 font-medium mt-1">Manage courses and weighted assessment structures</p>
        </div>
        <button
          onClick={() => openCourseModal()}
          className="flex items-center gap-2 bg-gradient-to-r from-brand-700 to-brand-500 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-brand-500/30 hover:-translate-y-0.5 transition-all"
        >
          <Plus className="w-5 h-5" />
          Create New Course
        </button>
      </div>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
           <div className="col-span-full py-20 text-center font-bold text-slate-400">Loading curriculum...</div>
        ) : courses.length === 0 ? (
           <div className="col-span-full py-20 text-center font-bold text-slate-400">No courses found for the Young track.</div>
        ) : (
          courses.map(course => (
            <div key={course.id} className="glass-panel group hover:border-brand-300 transition-all flex flex-col">
              <div className="p-6 flex-1">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-brand-50 text-brand-600 rounded-2xl">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openCourseModal(course)} className="p-2 text-slate-300 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-all">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={async () => { if(confirm("Delete course?")) { await courseService.deleteCourse(course.id); fetchCourses(); } }} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <h3 className="text-xl font-black text-slate-800 leading-tight mb-1">{course.name}</h3>
                <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
                  <span>{course.credit_hour} Credit Hours</span>
                  <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
                  <span>{course.duration} Months</span>
                </div>
              </div>
              <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex justify-between items-center rounded-b-3xl">
                <button 
                  onClick={() => openAssessmentModal(course)}
                  className="flex items-center gap-1.5 text-xs font-black text-brand-600 uppercase tracking-wider hover:text-brand-700 transition-colors"
                >
                  <Layers className="w-4 h-4" />
                  Manage Assessments
                </button>
                <span className="text-[10px] font-black uppercase text-slate-400">Young Track</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Course Modal */}
      {courseModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md transform transition-all animate-[slide-up_0.3s_ease-out]">
             <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center">
                <h2 className="text-2xl font-black text-slate-800">{selectedCourse ? 'Edit Course' : 'New Course'}</h2>
                <button onClick={() => setCourseModalOpen(false)}><X className="w-6 h-6 text-slate-400" /></button>
             </div>
             <form onSubmit={handleCourseSubmit} className="p-8 space-y-4">
                <div>
                   <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block mb-2">Course Name</label>
                   <input 
                     required
                     value={formData.name}
                     onChange={e => setFormData({...formData, name: e.target.value})}
                     className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all font-bold"
                     placeholder="e.g. Intro to Theology"
                   />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block mb-2">Credit Hours</label>
                    <input 
                      type="number"
                      required
                      value={formData.credit_hour}
                      onChange={e => setFormData({...formData, credit_hour: e.target.value})}
                      className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-brand-500 transition-all font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block mb-2">Duration (Months)</label>
                    <input 
                      type="number"
                      required
                      value={formData.duration}
                      onChange={e => setFormData({...formData, duration: e.target.value})}
                      className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-brand-500 transition-all font-bold"
                    />
                  </div>
                </div>
                <button type="submit" className="w-full py-4 bg-slate-800 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-slate-700 transition-all shadow-xl shadow-slate-200">
                  {selectedCourse ? 'Update Course' : 'Create Course'}
                </button>
             </form>
          </div>
        </div>
      )}

      {/* Assessment Modal */}
      {assessmentModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl transform transition-all flex flex-col max-h-[90vh]">
             <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center shrink-0">
                <div>
                  <h2 className="text-2xl font-black text-slate-800">Weights & Assessments</h2>
                  <p className="text-xs font-bold text-brand-600 uppercase tracking-widest">{selectedCourse?.name}</p>
                </div>
                <button onClick={() => setAssessmentModalOpen(false)}><X className="w-6 h-6 text-slate-400" /></button>
             </div>
             
             <div className="p-8 overflow-y-auto">
                {/* Total Weight Alert */}
                <div className={`mb-6 p-4 rounded-2xl border flex items-center justify-between ${totalWeight === 100 ? 'bg-green-50 border-green-100 text-green-700' : 'bg-amber-50 border-amber-100 text-amber-700'}`}>
                   <div className="flex items-center gap-3">
                      <Calculator className="w-5 h-5" />
                      <div>
                        <span className="font-black uppercase text-xs tracking-wider">Total Combined Weight:</span>
                        <span className="ml-2 font-black text-lg">{totalWeight}%</span>
                      </div>
                   </div>
                   {totalWeight !== 100 && (
                     <span className="text-[10px] font-black uppercase tracking-tighter opacity-70">Should equal 100%</span>
                   )}
                </div>

                {/* List */}
                <div className="space-y-3 mb-8">
                   {assessments.length === 0 ? (
                     <p className="text-center py-6 text-slate-400 font-bold uppercase text-[10px] tracking-widest border-2 border-dashed border-slate-100 rounded-2xl">No assessments defined yet</p>
                   ) : (
                     assessments.map(a => (
                       <div key={a.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200">
                          <div>
                            <p className="font-black text-slate-800">{a.name}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Max Score: {a.max_score}</p>
                          </div>
                          <div className="flex items-center gap-4">
                             <div className="px-3 py-1 bg-white border border-slate-200 rounded-lg font-black text-brand-600">
                                {a.weight}%
                             </div>
                             <button onClick={() => handleDeleteAssessment(a.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                                <Trash2 className="w-4 h-4" />
                             </button>
                          </div>
                       </div>
                     ))
                   )}
                </div>

                {/* Add Form */}
                <div className="bg-slate-50 p-6 rounded-2xl border-2 border-slate-200 border-dashed">
                   <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Add New Assessment</h4>
                   <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="lg:col-span-2">
                        <input 
                          placeholder="e.g. Midterm Exam"
                          value={newAssessment.name}
                          onChange={e => setNewAssessment({...newAssessment, name: e.target.value})}
                          className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:border-brand-500 font-bold text-sm"
                        />
                      </div>
                      <div>
                        <input 
                          type="number"
                          placeholder="Weight %"
                          value={newAssessment.weight || ''}
                          onChange={e => setNewAssessment({...newAssessment, weight: e.target.value})}
                          className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:border-brand-500 font-bold text-sm text-center"
                        />
                      </div>
                      <button 
                        onClick={handleAddAssessment}
                        className="bg-brand-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-brand-700 transition-all"
                      >
                         Add Component
                      </button>
                   </div>
                </div>
             </div>

             <div className="p-8 border-t border-slate-100 bg-slate-50 rounded-b-3xl">
                <button onClick={() => setAssessmentModalOpen(false)} className="w-full py-4 bg-slate-800 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-slate-200">Done</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
