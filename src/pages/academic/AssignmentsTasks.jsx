import { useEffect, useMemo, useState } from "react";
import { Calendar, Plus, Clock, List } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { academicService } from "../../services/academicService";
import { sectionService } from "../../services/sectionService";
import { adminService } from "../../services/adminService";
import { mezmurService } from "../../services/mezmurService";

const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function AssignmentsTasks() {
  const { hasRole } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [activeTab, setActiveTab] = useState("calendar");
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [sections, setSections] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [mezmurs, setMezmurs] = useState([]);
  const [attendanceRows, setAttendanceRows] = useState([]);
  const [form, setForm] = useState({
    scheduleType: "course",
    section: "",
    user_id: "",
    course: "",
    trainer_id: "",
    mezmur_ids: [],
    day_of_week: "",
    scheduled_date: "",
    start_time: "",
    end_time: "",
    default_period_order: "",
    location: "",
  });

  const isSuperAdmin = hasRole("super_admin");
  const canCreateCourse = hasRole("tmhrt_office_admin") || isSuperAdmin;
  const canCreateMezmur = hasRole("mezmur_office_admin") || isSuperAdmin;

  const fetchAll = async () => {
    try {
      setLoading(true);
      const data = await academicService.getAssignments({ per_page: 100 });
      const rows = Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []);
      setAssignments(rows);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  useEffect(() => {
    const fetchLookups = async () => {
      try {
        const [sectionRes, userRes, trainerRes, mezmurRes] = await Promise.all([
          sectionService.getSections(1, "", ""),
          adminService.getUsers(1, ""),
          mezmurService.getTrainers(),
          mezmurService.getMezmurs(),
        ]);
        setSections(sectionRes?.data || []);
        setTeachers((userRes?.data || []).filter((u) => u.roles?.some((r) => r.name === "teacher")));
        setTrainers(trainerRes?.data || []);
        setMezmurs(mezmurRes?.data || []);
      } catch {
        setSections([]);
      }
    };
    fetchLookups();
  }, []);

  const handleCreate = async () => {
    const payload = form.scheduleType === "course"
      ? {
          section: form.section,
          user_id: Number(form.user_id),
          course: form.course,
          start_time: form.start_time,
          end_time: form.end_time,
          day_of_week: form.day_of_week === "" ? null : Number(form.day_of_week),
          scheduled_date: form.scheduled_date || null,
          default_period_order: form.default_period_order ? Number(form.default_period_order) : null,
          location: form.location || null,
        }
      : {
          trainer_id: Number(form.trainer_id),
          mezmur_ids: form.mezmur_ids.map(Number),
          start_time: form.start_time,
          end_time: form.end_time,
          day_of_week: form.day_of_week === "" ? null : Number(form.day_of_week),
          scheduled_date: form.scheduled_date || null,
          location: form.location || null,
        };

    await academicService.createAssignment(payload);
    setShowCreate(false);
    setForm({
      scheduleType: "course",
      section: "",
      user_id: "",
      course: "",
      trainer_id: "",
      mezmur_ids: [],
      day_of_week: "",
      scheduled_date: "",
      start_time: "",
      end_time: "",
      default_period_order: "",
      location: "",
    });
    fetchAll();
  };

  const eventsByDay = useMemo(() => {
    return assignments.reduce((acc, item) => {
      const key = item.day_of_week ?? -1;
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    }, {});
  }, [assignments]);

  const openEvent = async (eventItem) => {
    setSelected(eventItem);
    const attendance = await academicService.getAttendance({ assignment_id: eventItem.id, per_page: 100 });
    setAttendanceRows(attendance?.data || []);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Schedule & Tasks</h1>
          <p className="text-slate-500 font-medium mt-1">Manage schedule events and attendance details</p>
        </div>
        {(canCreateCourse || canCreateMezmur) && (
          <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 bg-gradient-to-r from-brand-700 to-brand-600 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-brand-500/20">
            <Plus className="w-5 h-5" /> New Event
          </button>
        )}
      </div>

      <div className="glass-panel p-2 flex justify-between items-center">
        <div className="flex bg-white p-1 rounded-xl shadow-sm border border-slate-100">
          <button onClick={() => setActiveTab("calendar")} className={`px-4 py-2 text-sm font-bold rounded-lg flex items-center gap-2 ${activeTab === "calendar" ? "bg-brand-50 text-brand-700" : "text-slate-500"}`}>
            <Calendar className="w-4 h-4" /> Calendar View
          </button>
          <button onClick={() => setActiveTab("list")} className={`px-4 py-2 text-sm font-bold rounded-lg flex items-center gap-2 ${activeTab === "list" ? "bg-brand-50 text-brand-700" : "text-slate-500"}`}>
            <List className="w-4 h-4" /> List View
          </button>
        </div>
      </div>

      {activeTab === "calendar" ? (
        <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
          {dayLabels.map((d, idx) => (
            <div key={d} className="glass-panel p-4 min-h-[180px]">
              <p className="font-bold text-slate-700 mb-3">{d}</p>
              <div className="space-y-2">
                {(eventsByDay[idx] || []).map((evt) => (
                  <button key={evt.id} onClick={() => openEvent(evt)} className="w-full text-left p-2 rounded-lg bg-brand-50 hover:bg-brand-100">
                    <p className="text-sm font-semibold text-slate-800">{evt.type}</p>
                    <p className="text-xs text-slate-500">{evt.start_time} - {evt.end_time}</p>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-panel overflow-hidden">
          {loading ? <p className="p-6">Loading...</p> : (
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Day/Date</th>
                  <th className="px-4 py-3">Time</th>
                  <th className="px-4 py-3">Location</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map((evt) => (
                  <tr key={evt.id} onClick={() => openEvent(evt)} className="border-t cursor-pointer hover:bg-slate-50">
                    <td className="px-4 py-3 font-semibold">{evt.type}</td>
                    <td className="px-4 py-3">{evt.scheduled_date || dayLabels[evt.day_of_week] || "-"}</td>
                    <td className="px-4 py-3">{evt.start_time} - {evt.end_time}</td>
                    <td className="px-4 py-3">{evt.location || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {selected && (
        <div className="glass-panel p-5">
          <h3 className="font-bold text-lg">Event Details</h3>
          <p className="text-sm text-slate-600 mt-1">
            {selected.type} | {selected.scheduled_date || dayLabels[selected.day_of_week] || "-"} | {selected.start_time} - {selected.end_time}
          </p>
          <p className="text-sm text-slate-600">Teacher/Trainer: {selected.teacher?.name || selected.trainer?.user?.name || "-"}</p>
          <h4 className="font-semibold mt-4 mb-2">Attendance for this event</h4>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {attendanceRows.map((row) => (
              <div key={row.id} className="p-2 rounded bg-slate-50 text-sm flex justify-between">
                <span>{row.student?.name || row.student_id}</span>
                <span className="font-semibold">{row.status}</span>
              </div>
            ))}
            {attendanceRows.length === 0 && <p className="text-sm text-slate-500">No attendance records yet.</p>}
          </div>
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-xl p-6 space-y-4">
            <h3 className="text-xl font-bold">Create Schedule Event</h3>
            {isSuperAdmin && (
              <select value={form.scheduleType} onChange={(e) => setForm((p) => ({ ...p, scheduleType: e.target.value }))} className="w-full border rounded-lg px-3 py-2">
                <option value="course">Course Assignment</option>
                <option value="mezmur">Mezmur Training</option>
              </select>
            )}
            {form.scheduleType === "course" ? (
              <>
                <select value={form.section} onChange={(e) => setForm((p) => ({ ...p, section: e.target.value }))} className="w-full border rounded-lg px-3 py-2">
                  <option value="">Section</option>
                  {sections.map((s) => <option key={s.id} value={s.name}>{s.name}</option>)}
                </select>
                <select value={form.user_id} onChange={(e) => setForm((p) => ({ ...p, user_id: e.target.value }))} className="w-full border rounded-lg px-3 py-2">
                  <option value="">Teacher</option>
                  {teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
                <input placeholder="Course name" value={form.course} onChange={(e) => setForm((p) => ({ ...p, course: e.target.value }))} className="w-full border rounded-lg px-3 py-2" />
                <input placeholder="Default period order" value={form.default_period_order} onChange={(e) => setForm((p) => ({ ...p, default_period_order: e.target.value }))} className="w-full border rounded-lg px-3 py-2" />
              </>
            ) : (
              <>
                <select value={form.trainer_id} onChange={(e) => setForm((p) => ({ ...p, trainer_id: e.target.value }))} className="w-full border rounded-lg px-3 py-2">
                  <option value="">Trainer</option>
                  {trainers.map((t) => <option key={t.id} value={t.id}>{t.user?.name || `Trainer ${t.id}`}</option>)}
                </select>
                <select multiple value={form.mezmur_ids} onChange={(e) => setForm((p) => ({ ...p, mezmur_ids: Array.from(e.target.selectedOptions).map((o) => o.value) }))} className="w-full border rounded-lg px-3 py-2 h-28">
                  {mezmurs.map((m) => <option key={m.id} value={m.id}>{m.title || m.name}</option>)}
                </select>
              </>
            )}
            <div className="grid grid-cols-2 gap-3">
              <input type="time" value={form.start_time} onChange={(e) => setForm((p) => ({ ...p, start_time: e.target.value }))} className="border rounded-lg px-3 py-2" />
              <input type="time" value={form.end_time} onChange={(e) => setForm((p) => ({ ...p, end_time: e.target.value }))} className="border rounded-lg px-3 py-2" />
              <select value={form.day_of_week} onChange={(e) => setForm((p) => ({ ...p, day_of_week: e.target.value }))} className="border rounded-lg px-3 py-2">
                <option value="">Weekly Day</option>
                {dayLabels.map((d, i) => <option key={d} value={i}>{d}</option>)}
              </select>
              <input type="date" value={form.scheduled_date} onChange={(e) => setForm((p) => ({ ...p, scheduled_date: e.target.value }))} className="border rounded-lg px-3 py-2" />
            </div>
            <input placeholder="Location" value={form.location} onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))} className="w-full border rounded-lg px-3 py-2" />
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowCreate(false)} className="px-4 py-2 rounded-lg border">Cancel</button>
              <button onClick={handleCreate} className="px-4 py-2 rounded-lg bg-brand-700 text-white">Create</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
