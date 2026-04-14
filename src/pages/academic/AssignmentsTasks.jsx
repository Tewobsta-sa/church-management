import { useState, useEffect } from 'react';
import { Calendar as BigCalendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Calendar as CalendarIcon, List, Plus, Filter, Clock, MapPin, User, BookOpen, Music, X, CheckSquare } from 'lucide-react';
import { assignmentService } from '../../services/assignmentService';
import { sectionService } from '../../services/sectionService';
import { courseService } from '../../services/courseService';
import { adminService } from '../../services/adminService';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const locales = {
  'en-US': enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

export default function AssignmentsTasks() {
  const { hasRole } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("calendar");
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [sections, setSections] = useState([]);
  const [courses, setCourses] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [teachers, setTeachers] = useState([]);
  
  const [formData, setFormData] = useState({
    type: 'Course',
    section: '',
    user_id: '',
    trainer_id: '',
    course: '',
    location: '',
    day_of_week: '1',
    start_time: '09:00',
    end_time: '10:30',
  });

  const fetchSchedule = async () => {
    setLoading(true);
    try {
      const data = await assignmentService.getSchedule();
      // Transform backend assignments to FullCalendar events
      const formatted = data.map(ev => ({
        id: ev.id,
        title: ev.type === 'Course' ? `${ev.assignment_courses?.[0]?.course?.name} (${ev.section?.name})` : `Mezmur: ${ev.mezmurs?.[0]?.title}...`,
        start: new Date(2024, 0, ev.day_of_week + 7, ...ev.start_time.split(':')), // Dummy date for recurring
        end: new Date(2024, 0, ev.day_of_week + 7, ...ev.end_time.split(':')),
        type: ev.type,
        location: ev.location,
        teacher: ev.teacher?.name || ev.trainer?.name,
        raw: ev
      }));
      setEvents(formatted);
    } catch (err) {
      console.error("Failed to fetch schedule", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchResources = async () => {
     try {
        const [secData, courseData, userData] = await Promise.all([
           sectionService.getSections(1, "", ""),
           courseService.getCourses(),
           adminService.getUsers()
        ]);
        setSections(secData.data || []);
        setCourses(courseData.filter(c => c.program_type?.name === 'Young'));
        setTeachers(userData.filter(u => u.role === 'teacher'));
        // Trainers usually handled separately or filtered by role
        setTrainers(userData.filter(u => u.role === 'teacher')); // Placeholder if no separate trainer role
     } catch (err) {
        console.error("Resources fetch failed", err);
     }
  };

  useEffect(() => {
    fetchSchedule();
    fetchResources();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await assignmentService.createAssignment(formData);
      setModalOpen(false);
      fetchSchedule();
    } catch (err) {
      alert(err.response?.data?.message || "Creation failed");
    }
  };

  const eventStyleGetter = (event) => {
    const backgroundColor = event.type === 'Course' ? '#0F4C3A' : '#D97706';
    return {
      style: {
        backgroundColor,
        borderRadius: '8px',
        opacity: 0.9,
        color: 'white',
        border: 'none',
        display: 'block',
        fontSize: '11px',
        fontWeight: 'bold',
        padding: '2px 6px'
      }
    };
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Schedule & Tasks</h1>
          <p className="text-slate-500 font-medium mt-1">Orchestrate academic blocks and ministerial training</p>
        </div>
        <button 
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-brand-700 to-brand-500 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-brand-500/30 hover:-translate-y-0.5 transition-all"
        >
          <Plus className="w-5 h-5" />
          New Schedule Entry
        </button>
      </div>

      <div className="glass-panel p-2 flex justify-between items-center bg-slate-50 border-b border-slate-100">
         <div className="flex bg-white p-1 rounded-xl shadow-sm border border-slate-100">
           <button onClick={() => setActiveTab('calendar')} className={`px-4 py-2 text-sm font-bold rounded-lg flex items-center gap-2 transition-all ${activeTab === 'calendar' ? 'bg-brand-50 text-brand-600 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}>
              <CalendarIcon className="w-4 h-4" /> Calendar
           </button>
           <button onClick={() => setActiveTab('list')} className={`px-4 py-2 text-sm font-bold rounded-lg flex items-center gap-2 transition-all ${activeTab === 'list' ? 'bg-brand-50 text-brand-600 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}>
              <List className="w-4 h-4" /> Agenda
           </button>
         </div>
      </div>

      <div className="glass-panel p-6 bg-white min-h-[600px] relative overflow-hidden">
         {activeTab === 'calendar' ? (
           <div className="h-[600px]">
             <BigCalendar
               localizer={localizer}
               events={events}
               startAccessor="start"
               endAccessor="end"
               defaultView="work_week"
               views={['month', 'work_week', 'day']}
               eventPropGetter={eventStyleGetter}
               onSelectEvent={(event) => navigate(`/attendance?assignment_id=${event.id}`)}
               components={{
                 event: ({ event }) => (
                   <div className="flex flex-col h-full justify-between py-1">
                      <div className="truncate">{event.title}</div>
                      <div className="flex items-center gap-1 opacity-70 text-[9px]">
                         <MapPin className="w-2 h-2" /> {event.location || 'N/A'}
                      </div>
                   </div>
                 )
               }}
             />
           </div>
         ) : (
           <div className="space-y-4">
              {events.map(event => (
                 <div key={event.id} className="flex flex-col md:flex-row md:items-center justify-between p-5 border border-slate-100 rounded-2xl hover:border-brand-200 hover:shadow-lg transition-all group gap-4">
                    <div className="flex items-start gap-4">
                       <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${event.type === 'Course' ? 'bg-brand-50 text-brand-600' : 'bg-amber-50 text-amber-600'}`}>
                          {event.type === 'Course' ? <BookOpen className="w-6 h-6" /> : <Music className="w-6 h-6" />}
                       </div>
                       <div>
                          <h3 className="font-extrabold text-slate-800 text-lg leading-tight mb-1">{event.title}</h3>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-bold text-slate-400 uppercase tracking-wider">
                             <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {event.raw.start_time} - {event.raw.end_time}</span>
                             <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> {event.teacher}</span>
                             <span className="flex items-center gap-1.5 text-brand-600"><MapPin className="w-3.5 h-3.5" /> {event.location || 'Classroom A'}</span>
                          </div>
                       </div>
                    </div>
                    <div className="flex items-center gap-3">
                       <button 
                         onClick={() => navigate(`/attendance?assignment_id=${event.id}`)}
                         className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-brand-700 transition-all shadow-md shadow-brand-100"
                        >
                          <CheckSquare className="w-4 h-4" />
                          Mark Attendance
                       </button>
                    </div>
                 </div>
              ))}
           </div>
         )}
      </div>

      {/* New Entry Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
           <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto transform animate-[slide-up_0.3s_ease-out]">
              <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
                 <h2 className="text-2xl font-black text-slate-800">New Schedule Assignment</h2>
                 <button onClick={() => setModalOpen(false)}><X className="w-6 h-6 text-slate-400" /></button>
              </div>
              <form onSubmit={handleSubmit} className="p-8 space-y-6">
                 <div>
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block mb-3">Assignment Type</label>
                    <div className="flex gap-4">
                       {['Course', 'MezmurTraining'].map(type => (
                          <button key={type} type="button" onClick={() => setFormData({...formData, type})} className={`flex-1 py-3 px-4 rounded-xl border-2 font-bold transition-all ${formData.type === type ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-100 bg-slate-50 text-slate-400'}`}>
                             {type === 'Course' ? 'Academic Course' : 'Mezmur Training'}
                          </button>
                       ))}
                    </div>
                 </div>

                 {formData.type === 'Course' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <div>
                          <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">Section</label>
                          <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" value={formData.section} onChange={e => setFormData({...formData, section: e.target.value})}>
                            <option value="">Select Section</option>
                            {sections.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                          </select>
                       </div>
                       <div>
                          <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">Course</label>
                          <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" value={formData.course} onChange={e => setFormData({...formData, course: e.target.value})}>
                            <option value="">Select Course</option>
                            {courses.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                          </select>
                       </div>
                    </div>
                 ) : (
                    <div>
                        {/* Simplified for now, Mezmur dropdowns can be many */}
                        <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">Trainer</label>
                        <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" value={formData.trainer_id} onChange={e => setFormData({...formData, trainer_id: e.target.value})}>
                           <option value="">Select Trainer</option>
                           {trainers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                    </div>
                 )}

                 <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                       <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">Day</label>
                       <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm" value={formData.day_of_week} onChange={e => setFormData({...formData, day_of_week: e.target.value})}>
                          <option value="1">Monday</option>
                          <option value="2">Tuesday</option>
                          <option value="3">Wednesday</option>
                          <option value="4">Thursday</option>
                          <option value="5">Friday</option>
                          <option value="6">Saturday</option>
                          <option value="0">Sunday</option>
                       </select>
                    </div>
                    <div>
                       <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">Start Time</label>
                       <input type="time" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm" value={formData.start_time} onChange={e => setFormData({...formData, start_time: e.target.value})} />
                    </div>
                    <div>
                       <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">End Time</label>
                       <input type="time" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm" value={formData.end_time} onChange={e => setFormData({...formData, end_time: e.target.value})} />
                    </div>
                 </div>

                 <button type="submit" className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-200">
                    Create Entry
                 </button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
}
