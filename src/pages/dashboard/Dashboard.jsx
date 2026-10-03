import { useState, useEffect } from "react";
import {
  Users,
  UserCheck,
  Music,
  Layers,
  BookOpen,
  Landmark,
  ShieldAlert,
  BadgeCheck,
  Moon,
  UserPlus,
  TrendingUp,
  Calendar,
  Activity,
  QrCode,
  ArrowRight,
  ArrowUpRight,
  GraduationCap,
  Flag,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";
import { dashboardService } from "../../services/dashboardService";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { formatEthiopianDate } from "../../utils/ethiopianDate";

const TRACK_COLORS = [
  "#0F4C3A",
  "#d97706",
  "#7c3aed",
  "#0284c7",
  "#dc2626",
  "#65a30d",
];
const DONUT_COLORS = { present: "#0F4C3A", absent: "#dc2626", excused: "#d97706" };

const ROLE_LABELS = {
  super_admin: "Super Admin",
  yesew_habt: "Yesew Habt",
  mereja_kfl: "Mereja Kfl",
  mezmur_kfl: "Mezmur Kfl",
  tmhrt_kfl: "Tmhrt Kfl",
};

const formatRoleName = (name) =>
  ROLE_LABELS[name] ||
  (name ? name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "—");

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

  const today = stats?.attendance_today || { present: 0, absent: 0, excused: 0 };
  const todayTotal = today.present + today.absent + today.excused;
  const attendanceRate = todayTotal
    ? Math.round((today.present / todayTotal) * 100)
    : 0;

  const promotion = stats?.promotion || {
    eligible: 0,
    nominated: 0,
    endorsed: 0,
    promoted: 0,
  };

  const todayDonut = [
    { name: "Present / Late", key: "present", value: today.present },
    { name: "Absent", key: "absent", value: today.absent },
    { name: "Excused", key: "excused", value: today.excused },
  ].filter((d) => d.value > 0);

  const kpis = [
    {
      label: "Active Students",
      am: "ንቁ ተማሪዎች",
      value: stats?.active_students ?? 0,
      sub: `${stats?.total_students ?? 0} total records`,
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-50",
      link: "/students",
    },
    {
      label: "Today's Attendance",
      am: "የዛሬ መገኘት",
      value: `${attendanceRate}%`,
      sub: `${today.present} present · ${today.absent} absent`,
      icon: UserCheck,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      link: "/attendance",
    },
    {
      label: "Promotion Eligible",
      am: "ለደረጃ ብቁ",
      value: promotion.eligible,
      sub: `${promotion.nominated} nominated · ${promotion.endorsed} endorsed`,
      icon: GraduationCap,
      color: "text-purple-600",
      bg: "bg-purple-50",
      link: "/promotions",
    },
    {
      label: "Flagged Students",
      am: "የተጣለባቸው",
      value: stats?.flagged_students ?? 0,
      sub: "suspended from activities",
      icon: ShieldAlert,
      color: "text-rose-600",
      bg: "bg-rose-50",
      link: "/students",
    },
  ];

  const miniStats = [
    {
      label: "New (30d)",
      value: stats?.new_registrations_30d ?? 0,
      icon: UserPlus,
      color: "text-teal-600",
      bg: "bg-teal-50",
    },
    {
      label: "Verified",
      value: stats?.verified_students ?? 0,
      icon: BadgeCheck,
      color: "text-brand-600",
      bg: "bg-brand-50",
    },
    {
      label: "Mezmur",
      value: stats?.mezmur_members ?? 0,
      icon: Music,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      label: "Night Shift",
      value: stats?.night_shift_students ?? 0,
      icon: Moon,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
    },
    {
      label: "Sections",
      value: stats?.active_sections ?? 0,
      icon: Layers,
      color: "text-cyan-600",
      bg: "bg-cyan-50",
    },
    {
      label: "Courses",
      value: stats?.total_courses ?? 0,
      icon: BookOpen,
      color: "text-sky-600",
      bg: "bg-sky-50",
    },
    {
      label: "Ministries",
      value: stats?.total_ministries ?? 0,
      icon: Landmark,
      color: "text-orange-600",
      bg: "bg-orange-50",
    },
    {
      label: "Staff Users",
      value: stats?.total_users ?? 0,
      icon: Users,
      color: "text-slate-600",
      bg: "bg-slate-100",
    },
  ];

  const pipelineStages = [
    {
      label: "Eligible",
      am: "ብቁ",
      value: promotion.eligible,
      desc: "Met grade & attendance thresholds",
      color: "from-blue-500 to-blue-600",
      chip: "bg-blue-50 text-blue-700",
    },
    {
      label: "Nominated",
      am: "ተመርጠዋል",
      value: promotion.nominated,
      desc: "Forwarded by Tmhrt Kfl",
      color: "from-purple-500 to-purple-600",
      chip: "bg-purple-50 text-purple-700",
    },
    {
      label: "Endorsed",
      am: "ጸድቋል",
      value: promotion.endorsed,
      desc: "Approved by Ye Sew Habt",
      color: "from-amber-500 to-amber-600",
      chip: "bg-amber-50 text-amber-700",
    },
    {
      label: "Promoted",
      am: "ደረጃቸው ተነስቷል",
      value: promotion.promoted,
      desc: "Moved to the next section",
      color: "from-emerald-500 to-emerald-600",
      chip: "bg-emerald-50 text-emerald-700",
    },
  ];

  const roleTotal = (stats?.users_by_role || []).reduce(
    (sum, r) => sum + r.count,
    0,
  );

  return (
    <div className="space-y-6 animate-[fade-in_0.4s_ease-out]">
      {/* ── Header strip ─────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-brand-950 via-brand-900 to-slate-950 px-6 py-5 text-white shadow-sacred border border-brand-800/40">
        <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md p-1 border border-gold-400/40 shrink-0 flex items-center justify-center">
              <img
                src="/logo.png"
                alt="Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <p className="text-[10px] font-black tracking-widest text-gold-300 uppercase">
                ጃቴ ኪዳነ ምሕረት ፍኖተ ሰማዕታት ሰንበት ት/ቤት
              </p>
              <h1 className="text-xl font-black tracking-tight">
                Command Center
              </h1>
              <p className="text-[11px] text-brand-200/80 font-medium">
                እንኳን ደህና መጡ፣ <span className="text-gold-300 font-bold">{user?.name}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/15 text-[11px] font-bold text-slate-200">
              <Calendar className="w-3.5 h-3.5 text-gold-400" />
              {formatEthiopianDate(new Date())}
            </div>
            <button
              onClick={() => navigate("/attendance/scanner")}
              className="flex items-center gap-2 bg-gradient-to-r from-gold-500 to-amber-500 hover:from-gold-400 hover:to-amber-400 text-slate-950 font-black px-4 py-2 rounded-xl shadow-lg shadow-gold-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all text-[11px]"
            >
              <QrCode className="w-3.5 h-3.5" />
              QR Scanner
            </button>
          </div>
        </div>
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-brand-600/20 rounded-full blur-3xl pointer-events-none"></div>
      </div>

      {/* ── Primary KPI cards ────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            onClick={() => navigate(kpi.link)}
            className="glass-panel p-5 cursor-pointer group hover:border-brand-300 hover:-translate-y-0.5 transition-all active:scale-[0.98]"
          >
            <div className="flex justify-between items-start mb-4">
              <div
                className={`p-2.5 rounded-xl ${kpi.bg} ${kpi.color} transition-transform group-hover:scale-110`}
              >
                <kpi.icon className="w-5 h-5" />
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-brand-500 transition-colors" />
            </div>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">
              {kpi.am}
            </p>
            <h3 className="text-3xl font-black text-slate-800 leading-tight">
              {kpi.value}
            </h3>
            <p className="text-[11px] font-bold text-slate-500 mt-1">
              {kpi.label} · {kpi.sub}
            </p>
          </div>
        ))}
      </div>

      {/* ── Mini stat strip ──────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-3">
        {miniStats.map((s) => (
          <div
            key={s.label}
            className="glass-panel px-4 py-3.5 flex items-center gap-3 hover:border-brand-200 transition-colors"
          >
            <div className={`p-2 rounded-lg ${s.bg} ${s.color} shrink-0`}>
              <s.icon className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-lg font-black text-slate-800 leading-none">
                {s.value}
              </p>
              <p className="text-[9px] font-black uppercase tracking-wider text-slate-400 mt-1 truncate">
                {s.label}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Promotion pipeline ───────────────────────────────────── */}
      <div
        onClick={() => navigate("/promotions")}
        className="glass-panel p-6 cursor-pointer group hover:border-brand-300 transition-all"
      >
        <div className="flex justify-between items-center mb-5">
          <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs flex items-center gap-2">
            <Flag className="w-4 h-4 text-brand-600" /> የክፍል እድገት ፓይፕላይን
            (Promotion Pipeline)
          </h3>
          <span className="flex items-center gap-1 text-[10px] font-black uppercase text-brand-600 group-hover:translate-x-1 transition-transform">
            Open Promotions <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {pipelineStages.map((stage, i) => (
            <div key={stage.label} className="relative">
              <div
                className={`rounded-2xl bg-gradient-to-br ${stage.color} p-[1.5px]`}
              >
                <div className="bg-white rounded-2xl px-4 py-4">
                  <span
                    className={`inline-flex px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider ${stage.chip}`}
                  >
                    {stage.am}
                  </span>
                  <p className="text-3xl font-black text-slate-800 mt-2">
                    {stage.value}
                  </p>
                  <p className="text-xs font-bold text-slate-700">{stage.label}</p>
                  <p className="text-[10px] font-medium text-slate-400 mt-0.5 leading-snug">
                    {stage.desc}
                  </p>
                </div>
              </div>
              {i < pipelineStages.length - 1 && (
                <ArrowRight className="hidden lg:block absolute top-1/2 -right-[13px] -translate-y-1/2 w-4 h-4 text-slate-300 z-10" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Charts row 1: attendance trend + today donut ─────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-panel p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-brand-600" /> Attendance Trend
            </h3>
            <span className="text-[10px] font-black uppercase text-brand-600 bg-brand-50 px-2 py-1 rounded-lg">
              Last 7 Days
            </span>
          </div>
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats?.attendance_trend || []}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0F4C3A" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#0F4C3A" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f1f5f9"
                />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fontWeight: 700, fill: "#94a3b8" }}
                  dy={8}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fontWeight: 700, fill: "#94a3b8" }}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "14px",
                    border: "none",
                    boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                  }}
                  itemStyle={{ fontWeight: 800, color: "#0F4C3A" }}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  name="Present / Late"
                  stroke="#0F4C3A"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorCount)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-panel p-6">
          <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs flex items-center gap-2 mb-4">
            <UserCheck className="w-4 h-4 text-emerald-600" /> Today's Attendance
          </h3>
          <div className="h-[180px] relative">
            {todayTotal > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={todayDonut}
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {todayDonut.map((entry) => (
                      <Cell key={entry.key} fill={DONUT_COLORS[entry.key]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: "12px", border: "none" }}
                    itemStyle={{ fontSize: "11px", fontWeight: 900 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs font-bold text-slate-400">
                No attendance marked today
              </div>
            )}
            {todayTotal > 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-black text-slate-800">
                  {attendanceRate}%
                </span>
                <span className="text-[9px] font-black uppercase text-slate-400">
                  present
                </span>
              </div>
            )}
          </div>
          <div className="mt-4 space-y-2">
            {[
              { label: "Present / Late", key: "present", value: today.present },
              { label: "Absent", key: "absent", value: today.absent },
              { label: "Excused", key: "excused", value: today.excused },
            ].map((d) => (
              <div
                key={d.key}
                className="flex justify-between items-center text-xs"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: DONUT_COLORS[d.key] }}
                  ></span>
                  <span className="font-bold text-slate-600">{d.label}</span>
                </div>
                <span className="font-black text-slate-800">{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Charts row 2: sections + tracks + roles ──────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="glass-panel p-6">
          <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs flex items-center gap-2 mb-5">
            <Layers className="w-4 h-4 text-cyan-600" /> Section Enrollment
          </h3>
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={stats?.section_distribution || []}
                layout="vertical"
                margin={{ left: 0, right: 12 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  horizontal={false}
                  stroke="#f1f5f9"
                />
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  width={70}
                  tick={{ fontSize: 10, fontWeight: 700, fill: "#64748b" }}
                />
                <Tooltip
                  contentStyle={{ borderRadius: "12px", border: "none" }}
                  itemStyle={{ fontSize: "11px", fontWeight: 900 }}
                  cursor={{ fill: "#f8fafc" }}
                />
                <Bar
                  dataKey="count"
                  name="Students"
                  fill="#0F4C3A"
                  radius={[0, 6, 6, 0]}
                  barSize={14}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-panel p-6">
          <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs flex items-center gap-2 mb-5">
            <BookOpen className="w-4 h-4 text-amber-600" /> Program Tracks
          </h3>
          <div className="h-[150px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats?.track_distribution || []}
                  innerRadius={40}
                  outerRadius={62}
                  paddingAngle={4}
                  dataKey="count"
                >
                  {(stats?.track_distribution || []).map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={TRACK_COLORS[index % TRACK_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: "12px", border: "none" }}
                  itemStyle={{ fontSize: "11px", fontWeight: 900 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-2">
            {(stats?.track_distribution || []).map((track, i) => (
              <div
                key={track.name}
                className="flex justify-between items-center text-xs"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{
                      backgroundColor: TRACK_COLORS[i % TRACK_COLORS.length],
                    }}
                  ></span>
                  <span className="font-bold text-slate-600">{track.name}</span>
                </div>
                <span className="font-black text-slate-800">{track.count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-panel p-6">
          <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs flex items-center gap-2 mb-5">
            <Users className="w-4 h-4 text-slate-600" /> Staff by Role
          </h3>
          <div className="space-y-3">
            {(stats?.users_by_role || []).map((r) => {
              const pct = roleTotal
                ? Math.round((r.count / roleTotal) * 100)
                : 0;
              return (
                <div key={r.name}>
                  <div className="flex justify-between items-center text-xs mb-1">
                    <span className="font-bold text-slate-600">
                      {formatRoleName(r.name)}
                    </span>
                    <span className="font-black text-slate-800">{r.count}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-brand-600 to-brand-400"
                      style={{ width: `${pct}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
            {(stats?.users_by_role || []).length === 0 && (
              <p className="text-xs font-bold text-slate-400 text-center py-8">
                No role data
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Charts row 3: registrations + audit trail ────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-panel p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-teal-600" /> New Registrations
            </h3>
            <span className="text-[10px] font-black uppercase text-teal-600 bg-teal-50 px-2 py-1 rounded-lg">
              Last 8 Weeks
            </span>
          </div>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.registration_trend || []}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f1f5f9"
                />
                <XAxis
                  dataKey="week"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 9, fontWeight: 700, fill: "#94a3b8" }}
                  dy={8}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fontWeight: 700, fill: "#94a3b8" }}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{ borderRadius: "12px", border: "none" }}
                  itemStyle={{ fontSize: "11px", fontWeight: 900 }}
                  cursor={{ fill: "#f8fafc" }}
                />
                <Bar
                  dataKey="count"
                  name="New Students"
                  fill="#0d9488"
                  radius={[6, 6, 0, 0]}
                  barSize={22}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Activities (System Audit Trail) */}
        <div className="glass-panel overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs flex items-center gap-2">
              <Activity className="w-4 h-4 text-brand-600" /> የስርዓት ክንውኖች (Audit
              Trail)
            </h3>
            {stats?.recent_logs && (
              <button
                onClick={() => navigate("/admin/logs")}
                className="text-[11px] font-black text-brand-600 uppercase hover:underline"
              >
                ሙሉ ዝርዝር (Full Log)
              </button>
            )}
          </div>
          <div className="divide-y divide-slate-100">
            {stats?.recent_logs?.map((log) => {
              const badgeStyle =
                {
                  create: "bg-emerald-50 text-emerald-700 border-emerald-200",
                  update: "bg-amber-50 text-amber-700 border-amber-200",
                  delete: "bg-rose-50 text-rose-700 border-rose-200",
                  attendance: "bg-blue-50 text-blue-700 border-blue-200",
                  promotion: "bg-purple-50 text-purple-700 border-purple-200",
                  grade: "bg-indigo-50 text-indigo-700 border-indigo-200",
                  schedule: "bg-cyan-50 text-cyan-700 border-cyan-200",
                  mezmur: "bg-violet-50 text-violet-700 border-violet-200",
                  user: "bg-slate-100 text-slate-700 border-slate-200",
                  info: "bg-slate-50 text-slate-600 border-slate-200",
                }[log.badge_type || "info"] ||
                "bg-slate-50 text-slate-600 border-slate-200";

              return (
                <div
                  key={log.id}
                  className="px-6 py-3.5 flex justify-between items-center hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-black text-slate-600 text-xs shrink-0">
                      {log.user?.charAt(0)?.toUpperCase() || "U"}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border shrink-0 ${badgeStyle}`}
                        >
                          {log.category || "ክንውን"}
                        </span>
                        <p className="text-xs sm:text-sm font-bold text-slate-800 truncate">
                          {log.action}
                        </p>
                      </div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase truncate">
                        {log.user}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter shrink-0 pl-3">
                    {log.time}
                  </span>
                </div>
              );
            })}
            {(!stats?.recent_logs || stats.recent_logs.length === 0) && (
              <div className="p-10 text-center text-slate-400 text-xs font-bold uppercase tracking-widest">
                ምንም የቅርብ ጊዜ የስርዓት ክንውን የለም (No recent activity)
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
