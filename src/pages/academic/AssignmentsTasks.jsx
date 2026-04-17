import { useState, useEffect } from 'react';
import { Calendar as BigCalendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import {
  Plus, Clock, MapPin, User, BookOpen, Music, X,
  CheckSquare, RefreshCcw, CalendarDays, Trash2,
} from 'lucide-react';
import { assignmentService } from '../../services/assignmentService';
import { sectionService } from '../../services/sectionService';
import { courseService } from '../../services/courseService';
import { trainerService } from '../../services/trainerService';
import { teacherService } from '../../services/teacherService';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const locales = { 'en-US': enUS };

const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

// Safe event renderer — BigCalendar can pass undefined props in edge cases
const CalendarEvent = (props) => {
  const event = props?.event;
  if (!event || !event.title) return null;
  return (
    <div className="flex flex-col h-full justify-between py-1">
      <div className="truncate">{event.title}</div>
      <div className="flex items-center gap-1 opacity-70 text-[9px]">
        <MapPin className="w-2 h-2" /> {event.location || 'N/A'}
      </div>
    </div>
  );
};

export default function AssignmentsTasks() {
  const { hasRole } = useAuth();
  const navigate = useNavigate();

  const isSuperAdmin   = hasRole('super_admin');
  const isAcademicAdmin = hasRole('tmhrt_office_admin');
  const isMezmurAdmin  = hasRole('mezmur_office_admin');

  const attendanceActionLabel = isSuperAdmin ? 'View attendance' : 'Mark attendance';

  // Which assignment type this role can create (null = can create both via selector)
  const lockedType = isSuperAdmin ? null : isMezmurAdmin ? 'MezmurTraining' : 'Course';

  const [activeTab, setActiveTab]   = useState('calendar');
  const [events, setEvents]         = useState([]);
  const [loading, setLoading]       = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView]             = useState('week');
  const [modalOpen, setModalOpen]   = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // Dropdown data
  const [sections, setSections] = useState([]);
  const [courses, setCourses]   = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [teachers, setTeachers] = useState([]);

  const [formData, setFormData] = useState({
    type:            lockedType ?? 'Course',
    recurrence_type: 'periodic',
    section_id:      '',
    user_id:         '',
    trainer_id:      '',
    course_id:       '',
    location:        '',
    day_of_week:     '1',
    scheduled_date:  '',
    start_time:      '09:00',
    end_time:        '10:30',
  });

  // ─── Fetch schedule ────────────────────────────────────────────────
  const fetchSchedule = async () => {
    setLoading(true);
    try {
      const data = await assignmentService.getSchedule();
      const today = new Date();

      // For each recurring event, generate one entry per week for ±6 weeks
      // so the calendar shows them regardless of which week/month the user navigates to.
      const formatted = (data || [])
        .filter(ev => ev && ev.start_time && ev.end_time)
        .flatMap(ev => {
          const [startH, startM] = ev.start_time.split(':').map(Number);
          const [endH,   endM]   = ev.end_time.split(':').map(Number);
          const title = ev.type === 'Course'
            ? `${ev.assignment_courses?.[0]?.course?.name ?? 'Course'} (${ev.section?.name ?? 'Section'})`
            : `Mezmur: ${ev.mezmurs?.[0]?.title ?? 'Training'}`;

          // One-time entries (scheduled_date) should appear on their exact date.
          if (ev.scheduled_date) {
            const base = new Date(`${ev.scheduled_date}T00:00:00`);
            if (isNaN(base.getTime())) return [];

            const start = new Date(base);
            start.setHours(startH, startM, 0, 0);
            const end = new Date(base);
            end.setHours(endH, endM, 0, 0);

            if (isNaN(start.getTime()) || isNaN(end.getTime())) return [];

            return [{
              id:       `${ev.id}-one-time`,
              title,
              start,
              end,
              type:     ev.type || 'Unknown',
              location: ev.location || 'N/A',
              teacher:  ev.teacher?.name || ev.trainer?.name || 'Unassigned',
              raw:      ev,
            }];
          }

          // Recurring entries (day_of_week) are expanded across nearby weeks.
          if (ev.day_of_week == null) return [];
          const targetDOW = Number(ev.day_of_week); // 0=Sun … 6=Sat (matches JS getDay())

          const entries = [];
          for (let weekOffset = -6; weekOffset <= 6; weekOffset++) {
            // Day diff from today to the target day of week in the same week
            const diff = targetDOW - today.getDay();
            const base = new Date(today);
            base.setDate(today.getDate() + diff + weekOffset * 7);
            base.setHours(0, 0, 0, 0);

            const start = new Date(base);
            start.setHours(startH, startM, 0, 0);
            const end = new Date(base);
            end.setHours(endH, endM, 0, 0);

            if (!isNaN(start) && !isNaN(end)) {
              entries.push({
                id:       `${ev.id}-w${weekOffset}`,
                title,
                start,
                end,
                type:     ev.type     || 'Unknown',
                location: ev.location || 'N/A',
                teacher:  ev.teacher?.name || ev.trainer?.name || 'Unassigned',
                raw:      ev,
              });
            }
          }
          return entries;
        });

      setEvents(formatted);
    } catch (err) {
      console.error('Failed to fetch schedule', err);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  // ─── Fetch dropdown resources ──────────────────────────────────────
  const fetchResources = async () => {
    // Build parallel requests — only fetch trainers for roles that can access /trainers
    const canAccessTrainers = isSuperAdmin || isMezmurAdmin;

    const requests = [
      sectionService.getSections(1, '', ''),  // 0
      courseService.getCourses(),              // 1
      teacherService.getTeachers('', 1),       // 2  paginated: { data: [...] }
      canAccessTrainers
        ? trainerService.getTrainers()         // 3
        : Promise.resolve([]),
    ];

    // allSettled — one 403/500 never kills the rest
    const results = await Promise.allSettled(requests);

    const getValue = (idx, fallback = []) =>
      results[idx].status === 'fulfilled' ? results[idx].value : fallback;

    const secData     = getValue(0, { data: [] });
    const courseData  = getValue(1, []);
    const teacherData = getValue(2, { data: [] });
    const trainerData  = getValue(3, []);

    // Young sections only
    setSections((secData?.data ?? []).filter(s => s.program_type?.name === 'Young'));

    // Young courses only
    setCourses(
      (Array.isArray(courseData) ? courseData : courseData?.data ?? [])
        .filter(c => c.program_type?.name === 'Young')
    );

    // Show ALL teachers — teacherData is paginated: { data: [...], total, ... }
    const allTeachers = teacherData?.data ?? (Array.isArray(teacherData) ? teacherData : []);
    setTeachers(allTeachers);

    // Trainers (separate Trainer model — not users)
    const allTrainers = Array.isArray(trainerData) ? trainerData : trainerData?.data ?? [];
    setTrainers(allTrainers);
  };

  useEffect(() => {
    fetchSchedule();
    fetchResources();
  }, []);

  // ─── Form submit ───────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...formData };

      // Send only one schedule mode to prevent stale hidden values.
      if (payload.recurrence_type === 'periodic') {
        payload.scheduled_date = null;
      } else {
        payload.day_of_week = null;
      }

      await assignmentService.createAssignment(payload);
      setModalOpen(false);
      fetchSchedule();
      fetchResources(); // refresh teacher list after assignment
    } catch (err) {
      alert(err.response?.data?.message || 'Creation failed');
    }
  };

  const handleDeleteSchedule = async (assignmentId) => {
    if (!assignmentId || deletingId) return;

    const confirmed = window.confirm('Delete this schedule entry? This action cannot be undone.');
    if (!confirmed) return;

    setDeletingId(assignmentId);
    try {
      await assignmentService.deleteAssignment(assignmentId);
      await fetchSchedule();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete schedule');
    } finally {
      setDeletingId(null);
    }
  };

  // ─── Calendar helpers ──────────────────────────────────────────────
  const eventStyleGetter = (event) => ({
    style: {
      backgroundColor: event.type === 'Course' ? '#0F4C3A' : '#D97706',
      borderRadius: '12px',
      opacity: 0.9,
      color: 'white',
      border: 'none',
      fontSize: '11px',
      fontWeight: 'bold',
      padding: '4px 8px',
      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
    },
  });

  // Filter events to only what this role should see
  const visibleEvents = events.filter(ev => {
    if (isSuperAdmin)    return true;
    if (isAcademicAdmin) return ev.type === 'Course';
    if (isMezmurAdmin)   return ev.type === 'MezmurTraining';
    return true;
  });

  // Modal title/subtitle per role
  const modalTitle    = isMezmurAdmin ? 'New Mezmur Training' : 'New Schedule Assignment';
  const modalSubtitle = isMezmurAdmin
    ? 'Configure a mezmur training session'
    : isAcademicAdmin
      ? 'Configure an academic course block'
      : 'Configure academic or ministerial blocks';

  // Input style shorthand
  const inputCls = 'w-full p-4 bg-white border border-slate-200 rounded-2xl font-bold text-slate-700 outline-none focus:border-brand-500 shadow-sm';

  return (
    <div className="space-y-6 animate-[fade-in_0.5s_ease-out]">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Schedule &amp; Tasks</h1>
          <p className="text-slate-500 font-medium mt-1">
            {isAcademicAdmin ? 'Academic course schedule' : isMezmurAdmin ? 'Mezmur training schedule' : 'Academic & ministerial schedule'}
          </p>
        </div>
        {(isSuperAdmin || isAcademicAdmin || isMezmurAdmin) && (
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-brand-700 to-brand-500 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-brand-500/30 hover:-translate-y-0.5 transition-all"
          >
            <Plus className="w-5 h-5" />
            New Schedule Entry
          </button>
        )}
      </div>

      {/* ── Tab bar ── */}
      <div className="glass-panel p-2 flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-50 border-b border-slate-100">
        <div className="flex bg-white p-1 rounded-xl shadow-sm border border-slate-100 w-full md:w-auto">
          {[
            { key: 'month',     label: 'Month',  setV: 'month' },
            { key: 'week', label: 'Week',   setV: 'week' },
            { key: 'day',       label: 'Day',    setV: 'day' },
            { key: 'list',      label: 'Agenda', setV: null },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.setV ? 'calendar' : 'list'); if (tab.setV) setView(tab.setV); }}
              className={`flex-1 md:flex-none px-4 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg flex items-center justify-center gap-2 transition-all ${
                (tab.setV ? activeTab === 'calendar' && view === tab.setV : activeTab === 'list')
                  ? 'bg-brand-600 text-white shadow-md'
                  : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'calendar' && (
          <div className="flex items-center gap-2 bg-white p-1 rounded-xl shadow-sm border border-slate-100">
            <button
              onClick={() => {
                const d = new Date(currentDate);
                if (view === 'month') d.setMonth(d.getMonth() - 1);
                else if (view === 'week') d.setDate(d.getDate() - 7);
                else d.setDate(d.getDate() - 1);
                setCurrentDate(d);
              }}
              className="p-2 hover:bg-slate-50 text-slate-400 hover:text-brand-600 transition-all"
            >
              <X className="w-4 h-4 rotate-180" />
            </button>
            <span className="px-4 text-xs font-black text-slate-700 uppercase tracking-widest">
              {format(currentDate, view === 'month' ? 'MMMM yyyy' : 'MMM dd')}
            </span>
            <button
              onClick={() => {
                const d = new Date(currentDate);
                if (view === 'month') d.setMonth(d.getMonth() + 1);
                else if (view === 'week') d.setDate(d.getDate() + 7);
                else d.setDate(d.getDate() + 1);
                setCurrentDate(d);
              }}
              className="p-2 hover:bg-slate-50 text-slate-400 hover:text-brand-600 transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* ── Calendar / Agenda panel ── */}
      <div className="glass-panel p-6 bg-white min-h-[600px] relative overflow-hidden shadow-xl shadow-slate-200/50">
        {activeTab === 'calendar' ? (
          <div className="h-[700px]">
            <BigCalendar
              localizer={localizer}
              events={visibleEvents}
              startAccessor="start"
              endAccessor="end"
              view={view}
              onView={setView}
              views={['month', 'week', 'day', 'agenda']}
              date={currentDate}
              onNavigate={setCurrentDate}
              toolbar={false}
              eventPropGetter={eventStyleGetter}
              onSelectEvent={(event) => navigate(`/attendance?assignment_id=${event.raw?.id || event.id}`)}
              components={{ event: CalendarEvent }}
            />
          </div>
        ) : (
          <div className="space-y-4">
            {visibleEvents.length === 0 ? (
              <div className="py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-sm">
                No assignments on record
              </div>
            ) : (
              visibleEvents.map(event => (
                <div key={event.id} className="flex flex-col md:flex-row md:items-center justify-between p-5 border border-slate-100 rounded-2xl hover:border-brand-200 hover:shadow-lg transition-all gap-4 bg-slate-50/30">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-inner ${event.type === 'Course' ? 'bg-brand-50 text-brand-600' : 'bg-amber-50 text-amber-600'}`}>
                      {event.type === 'Course' ? <BookOpen className="w-6 h-6" /> : <Music className="w-6 h-6" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-extrabold text-slate-800 text-lg leading-tight">{event.title}</h3>
                        {event.raw?.scheduled_date && (
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[9px] font-black uppercase rounded-md tracking-tighter">One-time</span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-bold text-slate-400 uppercase tracking-wider">
                        <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {event.raw?.start_time} - {event.raw?.end_time}</span>
                        <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> {event.teacher}</span>
                        <span className="flex items-center gap-1.5 text-brand-600"><MapPin className="w-3.5 h-3.5" /> {event.location}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => navigate(`/attendance?assignment_id=${event.raw?.id || event.id}`)}
                      className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-brand-700 transition-all shadow-md shadow-brand-100"
                    >
                      <CheckSquare className="w-4 h-4" />
                      {attendanceActionLabel}
                    </button>
                    <button
                      type="button"
                      disabled={deletingId === event.raw?.id}
                      onClick={() => handleDeleteSchedule(event.raw?.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-rose-700 transition-all shadow-md shadow-rose-100 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      <Trash2 className="w-4 h-4" />
                      {deletingId === event.raw?.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* ── New Entry Modal ── */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto transform animate-[slide-up_0.3s_ease-out]">
            {/* Modal header */}
            <div className="px-10 py-8 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
              <div>
                <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">{modalTitle}</h2>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">{modalSubtitle}</p>
              </div>
              <button onClick={() => setModalOpen(false)} className="p-2 hover:bg-slate-50 rounded-2xl transition-all">
                <X className="w-6 h-6 text-slate-300" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-10 space-y-8">

              {/* ── Type selector: super_admin only ── */}
              {isSuperAdmin && (
                <div className="space-y-3">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block ml-1">Assignment Type</label>
                  <div className="flex gap-4">
                    {[
                      { id: 'Course',        label: 'Academic Block',   icon: BookOpen },
                      { id: 'MezmurTraining', label: 'Mezmur Training', icon: Music },
                    ].map(type => (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, type: type.id })}
                        className={`flex-1 py-4 px-6 rounded-2xl border-2 font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-3 transition-all ${
                          formData.type === type.id
                            ? 'border-brand-600 bg-brand-50 text-brand-700 shadow-md shadow-brand-100'
                            : 'border-slate-100 bg-slate-50 text-slate-400 hover:border-brand-200'
                        }`}
                      >
                        <type.icon className="w-4 h-4" />
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Recurrence Toggle ── */}
              <div className="space-y-3">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block ml-1">Schedule Pattern</label>
                <div className="inline-flex bg-slate-100 p-1.5 rounded-2xl w-full">
                  {[
                    { val: 'periodic', label: 'Periodic',  Icon: RefreshCcw },
                    { val: 'one-time', label: 'One-time',  Icon: CalendarDays },
                  ].map(({ val, label, Icon }) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setFormData({
                        ...formData,
                        recurrence_type: val,
                        day_of_week: val === 'periodic' ? (formData.day_of_week || '1') : '',
                        scheduled_date: val === 'one-time' ? formData.scheduled_date : '',
                      })}
                      className={`flex-1 py-3 px-4 rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 transition-all ${
                        formData.recurrence_type === val ? 'bg-white text-slate-800 shadow-md shadow-slate-200' : 'text-slate-400'
                      }`}
                    >
                      <Icon className="w-4 h-4" /> {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Role-specific form fields ── */}
              <div className="bg-slate-50/50 p-8 rounded-3xl border border-slate-100 space-y-6">

                {/* Course fields — shown for tmhrt_office_admin, super_admin (when type=Course) */}
                {formData.type === 'Course' && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Target Section</label>
                        <select required className={inputCls} value={formData.section_id} onChange={e => setFormData({ ...formData, section_id: e.target.value })}>
                          <option value="">Select Section</option>
                          {sections.length === 0
                            ? <option disabled>No Young sections found</option>
                            : sections.map(s => <option key={s.id} value={s.id}>{s.name} ({s.program_type?.name})</option>)
                          }
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Assigned Course</label>
                        <select required className={inputCls} value={formData.course_id} onChange={e => setFormData({ ...formData, course_id: e.target.value })}>
                          <option value="">Select Course</option>
                          {courses.length === 0
                            ? <option disabled>No Young courses found</option>
                            : courses.map(c => <option key={c.id} value={c.id}>{c.name} ({c.program_type?.name})</option>)
                          }
                        </select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Assigned Teacher</label>
                      <select required className={inputCls} value={formData.user_id} onChange={e => setFormData({ ...formData, user_id: e.target.value })}>
                        <option value="">Select Teacher</option>
                        {teachers.length === 0
                          ? <option disabled>No available teachers</option>
                          : teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)
                        }
                      </select>
                    </div>
                  </>
                )}

                {/* MezmurTraining fields — shown for mezmur_office_admin, super_admin (when type=MezmurTraining) */}
                {formData.type === 'MezmurTraining' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Lead Trainer</label>
                      <select required className={inputCls} value={formData.trainer_id} onChange={e => setFormData({ ...formData, trainer_id: e.target.value })}>
                        <option value="">Select Trainer</option>
                        {trainers.length === 0
                          ? <option disabled>No trainers found</option>
                          : trainers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)
                        }
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Venue / Hall</label>
                      <input
                        placeholder="e.g. Main Sanctuary"
                        className={inputCls}
                        value={formData.location}
                        onChange={e => setFormData({ ...formData, location: e.target.value })}
                      />
                    </div>
                  </div>
                )}

                {/* Timing: shared by both types */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {formData.recurrence_type === 'periodic' ? (
                    <div className="md:col-span-2 space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Day of Week</label>
                      <select className={inputCls} value={formData.day_of_week} onChange={e => setFormData({ ...formData, day_of_week: e.target.value })}>
                        {['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].map((d, i) => (
                          <option key={d} value={i === 6 ? '0' : String(i + 1)}>{d}</option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div className="md:col-span-2 space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Event Date</label>
                      <input type="date" className={inputCls} value={formData.scheduled_date} onChange={e => setFormData({ ...formData, scheduled_date: e.target.value })} />
                    </div>
                  )}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Start</label>
                    <input type="time" className={`${inputCls} text-center`} value={formData.start_time} onChange={e => setFormData({ ...formData, start_time: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">End</label>
                    <input type="time" className={`${inputCls} text-center`} value={formData.end_time} onChange={e => setFormData({ ...formData, end_time: e.target.value })} />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-5 bg-brand-600 text-white rounded-3xl font-black uppercase tracking-widest hover:bg-brand-700 transition-all shadow-2xl shadow-brand-500/30 flex items-center justify-center gap-3 active:scale-[0.98]"
              >
                <Plus className="w-6 h-6" />
                Publish Schedule
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
