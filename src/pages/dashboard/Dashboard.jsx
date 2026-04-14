import { useState, useEffect } from 'react';
import { 
  Users, CheckCircle2, Music, Layers, Clock, ArrowUpRight, 
  TrendingUp, Calendar, ArrowRight, Activity, AlertCircle
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar 
} from 'recharts';
import { dashboardService } from '../../services/dashboardService';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const COLORS = ['#0F4C3A', '#10B981', '#34D399', '#6EE7B7', '#A7F3D0'];

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await dashboardService.getStats();
        setStats(data);
      } catch (err) {
        console.error("Dashboard fetch failed", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  const kpis = [
    { label: 'Total Students', value: stats?.total_students || 0, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50', link: '/students' },
    { label: 'Verified', value: stats?.verified_students || 0, icon: CheckCircle2, color: 'text-brand-600', bg: 'bg-brand-50', link: '/promotions' },
    { label: 'Mezmur Members', value: stats?.mezmur_members || 0, icon: Music, color: 'text-amber-600', bg: 'bg-amber-50', link: '/mezmur' },
    { label: 'Academic Sections', value: stats?.active_sections || 0, icon: Layers, color: 'text-purple-600', bg: 'bg-purple-50', link: '/courses' },
  ];

  return (
    <div className="space-y-8 animate-[fade-in_0.4s_ease-out]">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Executive Dashboard</h1>
          <p className="text-slate-500 font-medium mt-1 uppercase text-xs tracking-widest">
            Welcome back, <span className="text-brand-600 font-black">{user?.name}</span> • Young Program Track
          </p>
        </div>
        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl shadow-sm border border-slate-100">
           <Calendar className="w-4 h-4 text-brand-600" />
           <span className="text-sm font-bold text-slate-600">{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, idx) => (
          <div 
            key={idx} 
            onClick={() => navigate(kpi.link)}
            className="glass-panel p-6 cursor-pointer group hover:border-brand-300 transition-all active:scale-95"
          >
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-2xl ${kpi.bg} ${kpi.color} transition-transform group-hover:scale-110`}>
                <kpi.icon className="w-6 h-6" />
              </div>
              <ArrowUpRight className="w-5 h-5 text-slate-300 group-hover:text-brand-500 transition-colors" />
            </div>
            <p className="text-slate-500 text-xs font-black uppercase tracking-widest mb-1">{kpi.label}</p>
            <h3 className="text-3xl font-black text-slate-800">{kpi.value}</h3>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Attendance Trend */}
        <div className="lg:col-span-2 glass-panel p-8">
          <div className="flex justify-between items-center mb-8">
            <h3 className="font-black text-slate-800 uppercase tracking-widest text-sm flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-brand-600" /> Attendance Multi-Trend
            </h3>
            <div className="flex gap-2">
               <span className="flex items-center gap-1.5 text-[10px] font-black uppercase text-brand-600 bg-brand-50 px-2 py-1 rounded-lg">Last 7 Days</span>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats?.attendance_trend || []}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0F4C3A" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#0F4C3A" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ fontWeight: 800, color: '#0F4C3A' }}
                />
                <Area type="monotone" dataKey="count" stroke="#0F4C3A" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Section Distribution */}
        <div className="glass-panel p-8">
          <h3 className="font-black text-slate-800 uppercase tracking-widest text-sm flex items-center gap-2 mb-8">
            <Layers className="w-5 h-5 text-purple-600" /> Section Load
          </h3>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats?.section_distribution || []}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="count"
                >
                  {stats?.section_distribution?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', overflow: 'hidden' }}
                  itemStyle={{ fontSize: '11px', fontWeight: 900 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-6 space-y-3">
             {stats?.section_distribution?.slice(0, 3).map((sec, i) => (
               <div key={i} className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2">
                     <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                     <span className="font-bold text-slate-600">{sec.name}</span>
                  </div>
                  <span className="font-black text-slate-800">{sec.count} Students</span>
               </div>
             ))}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         {/* Activities */}
         <div className="glass-panel overflow-hidden">
            <div className="px-8 py-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
               <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs flex items-center gap-2">
                  <Activity className="w-4 h-4 text-brand-600" /> System Audit Trail
               </h3>
               <button onClick={() => navigate('/admin/logs')} className="text-[10px] font-black text-brand-600 uppercase hover:underline">Full Log</button>
            </div>
            <div className="divide-y divide-slate-100">
               {stats?.recent_logs?.map(log => (
                 <div key={log.id} className="px-8 py-4 flex justify-between items-center group hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-4">
                       <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-400 text-[10px]">
                          {log.user.charAt(0)}
                       </div>
                       <div>
                          <p className="text-sm font-bold text-slate-800 leading-tight mb-0.5">{log.action}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">{log.user}</p>
                       </div>
                    </div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter shrink-0">{log.time}</span>
                 </div>
               ))}
               {(!stats?.recent_logs || stats.recent_logs.length === 0) && (
                 <div className="p-10 text-center text-slate-400 text-sm font-bold opacity-30 uppercase tracking-[0.2em]">No recent activity</div>
               )}
            </div>
         </div>

         {/* Upcoming Academic Actions */}
         <div className="bg-brand-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-2xl shadow-brand-900/40">
            <div className="relative z-10 h-full flex flex-col justify-between">
               <div>
                  <h3 className="text-3xl font-black mb-4">Quick Batch Actions</h3>
                  <p className="text-brand-200 font-medium text-lg max-w-xs leading-relaxed">System-wide modifications for the current semester.</p>
               </div>
               <div className="mt-12 grid grid-cols-2 gap-4">
                  <button onClick={() => navigate('/promotions')} className="px-6 py-4 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 rounded-3xl transition-all text-left group">
                     <AlertCircle className="w-6 h-6 mb-3 text-brand-300" />
                     <p className="font-black uppercase tracking-widest text-[10px] text-brand-400">Promotions</p>
                     <p className="font-bold text-sm">Verify Batch</p>
                  </button>
                  <button onClick={() => navigate('/results')} className="px-6 py-4 bg-brand-500 text-white rounded-3xl transition-all text-left shadow-xl shadow-brand-500/20 hover:-translate-y-1">
                     <TrendingUp className="w-6 h-6 mb-3" />
                     <p className="font-black uppercase tracking-widest text-[10px] text-brand-100">Performance</p>
                     <p className="font-bold text-sm">View Rankings</p>
                  </button>
               </div>
            </div>
            <Activity className="absolute -bottom-10 -right-10 w-64 h-64 text-white/5 rotate-12" />
         </div>
      </div>
    </div>
  );
}
