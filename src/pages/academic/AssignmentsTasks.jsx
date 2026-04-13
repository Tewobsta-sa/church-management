import { useState } from 'react';
import { Calendar, CheckSquare, Plus, Clock, Filter, List } from 'lucide-react';

export default function AssignmentsTasks() {
  const [tasks, setTasks] = useState([
     { id: 1, title: "Mid-term Exam Generation", type: "Exam", dueDate: "2023-11-20", status: "Pending", priority: "High", assignedTo: "Intro to Theology (Regular)" },
     { id: 2, title: "Collect Chapter 3 Assignments", type: "Assignment", dueDate: "2023-11-15", status: "Completed", priority: "Medium", assignedTo: "Advanced History (Young)" },
  ]);

  const [activeTab, setActiveTab] = useState("calendar"); // calendar | list

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Schedule & Tasks</h1>
          <p className="text-slate-500 font-medium mt-1">Manage academic events, assignments, and deadlines</p>
        </div>
        <button className="flex items-center gap-2 bg-gradient-to-r from-brand-600 to-brand-500 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-brand-500/30 hover:-translate-y-0.5 transition-all">
          <Plus className="w-5 h-5" />
          New Event
        </button>
      </div>

      <div className="glass-panel p-2 flex justify-between items-center bg-slate-50 border-b border-slate-100">
         <div className="flex bg-white p-1 rounded-xl shadow-sm border border-slate-100">
           <button onClick={() => setActiveTab('calendar')} className={`px-4 py-2 text-sm font-bold rounded-lg flex items-center gap-2 transition-all ${activeTab === 'calendar' ? 'bg-brand-50 text-brand-600 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}>
              <Calendar className="w-4 h-4" /> Calendar View
           </button>
           <button onClick={() => setActiveTab('list')} className={`px-4 py-2 text-sm font-bold rounded-lg flex items-center gap-2 transition-all ${activeTab === 'list' ? 'bg-brand-50 text-brand-600 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}>
              <List className="w-4 h-4" /> List View
           </button>
         </div>
         
         <div className="flex gap-2">
            <button className="p-2 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 bg-white shadow-sm flex items-center gap-2 text-sm font-bold">
              <Filter className="w-4 h-4" /> Filters
            </button>
         </div>
      </div>

      <div className="glass-panel overflow-hidden p-6 bg-white min-h-[400px]">
         {activeTab === 'calendar' ? (
           <div className="flex flex-col items-center justify-center pt-20 text-slate-400">
              <Calendar className="w-16 h-16 mb-4 opacity-50" />
              <p className="font-bold text-lg text-slate-600">Calendar integration pending</p>
              <p className="text-sm">Use List View to interact with tasks for now.</p>
           </div>
         ) : (
           <div className="space-y-4">
              {tasks.map(task => (
                 <div key={task.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-slate-100 rounded-2xl hover:border-brand-200 hover:shadow-md transition-all group gap-4">
                    <div className="flex items-start gap-4">
                       <div className={`mt-1 w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${task.status === 'Completed' ? 'bg-green-100 text-green-600' : 'bg-brand-100 text-brand-600'}`}>
                          {task.status === 'Completed' ? <CheckSquare className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                       </div>
                       <div>
                          <h3 className="font-bold text-slate-800 text-lg group-hover:text-brand-700 transition-colors">{task.title}</h3>
                          <div className="flex items-center gap-3 mt-1 text-sm font-medium text-slate-500">
                             <span className="bg-slate-100 px-2.5 py-0.5 rounded-md">{task.type}</span>
                             <span>Target: {task.assignedTo}</span>
                             <span className={task.priority === 'High' ? 'text-red-500' : 'text-amber-500'}>Priority: {task.priority}</span>
                          </div>
                       </div>
                    </div>
                    <div className="text-right flex flex-col sm:items-end justify-between self-stretch pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                       <span className={`text-sm font-bold uppercase tracking-widest ${task.status === 'Completed' ? 'text-green-600' : 'text-amber-600'}`}>
                          {task.status}
                       </span>
                       <span className="text-xs font-bold text-slate-400">Due: {task.dueDate}</span>
                    </div>
                 </div>
              ))}
           </div>
         )}
      </div>
    </div>
  );
}
