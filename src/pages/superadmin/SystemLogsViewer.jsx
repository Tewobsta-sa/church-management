import { useState, useEffect } from "react";
import { adminService } from "../../services/adminService";
import { Clock, Filter, X } from "lucide-react";
import { format } from "date-fns";

const ROLE_OPTIONS = [
  { value: "super_admin", label: "Super Admin" },
  { value: "yesew_habt", label: "Yesew Habt" },
  { value: "mereja_kfl", label: "Mereja Kfl" },
  { value: "mezmur_kfl", label: "Mezmur Kfl" },
  { value: "tmhrt_kfl", label: "Tmhrt Kfl" },
];

const METHOD_OPTIONS = [
  { value: "POST", label: "Created (POST)" },
  { value: "PUT", label: "Updated (PUT)" },
  { value: "PATCH", label: "Updated (PATCH)" },
  { value: "DELETE", label: "Deleted (DELETE)" },
];

const formatRole = (name) =>
  ROLE_OPTIONS.find((r) => r.value === name)?.label ||
  (name ? name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "—");

export default function SystemLogsViewer() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [users, setUsers] = useState([]);

  const [userFilter, setUserFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [methodFilter, setMethodFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const hasFilters =
    userFilter || roleFilter || methodFilter || startDate || endDate;

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await adminService.getLogs(currentPage, {
        user_id: userFilter,
        role: roleFilter,
        action: methodFilter,
        start_date: startDate,
        end_date: endDate,
      });
      setLogs(data.data || []);
      setTotalPages(data.last_page || 1);
    } catch (err) {
      console.error("Error fetching logs", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const res = await adminService.getUsers(1, "", 500);
        setUsers(res.data || []);
      } catch (err) {
        console.error("Failed loading users for log filter", err);
      }
    };
    loadUsers();
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [currentPage, userFilter, roleFilter, methodFilter, startDate, endDate]);

  const applyFilter = (setter) => (e) => {
    setter(e.target.value);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setUserFilter("");
    setRoleFilter("");
    setMethodFilter("");
    setStartDate("");
    setEndDate("");
    setCurrentPage(1);
  };

  const getCategoryBadgeStyle = (badgeType) => {
    switch (badgeType) {
      case "create": return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "update": return "bg-amber-50 text-amber-700 border-amber-200";
      case "delete": return "bg-rose-50 text-rose-700 border-rose-200";
      case "attendance": return "bg-blue-50 text-blue-700 border-blue-200";
      case "promotion": return "bg-purple-50 text-purple-700 border-purple-200";
      case "grade": return "bg-indigo-50 text-indigo-700 border-indigo-200";
      case "schedule": return "bg-cyan-50 text-cyan-700 border-cyan-200";
      case "mezmur": return "bg-violet-50 text-violet-700 border-violet-200";
      default: return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const selectClass =
    "px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none hover:border-brand-400 focus:ring-2 focus:ring-brand-500/15 focus:border-brand-500 transition-all shadow-xs cursor-pointer";
  const dateClass =
    "px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none hover:border-brand-400 focus:ring-2 focus:ring-brand-500/15 focus:border-brand-500 transition-all shadow-xs";

  return (
    <div className="space-y-4">
      <div className="glass-panel p-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex items-center gap-1.5 text-xs font-black uppercase text-slate-500">
            <Filter className="w-3.5 h-3.5" />
            ማጣሪያ (Filters)
          </span>

          <select
            value={userFilter}
            onChange={applyFilter(setUserFilter)}
            className={selectClass}
          >
            <option value="">ሁሉም ተጠቃሚዎች (All Users)</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} (@{u.username})
              </option>
            ))}
          </select>

          <select
            value={roleFilter}
            onChange={applyFilter(setRoleFilter)}
            className={selectClass}
          >
            <option value="">ሁሉም ሚናዎች (All Roles)</option>
            {ROLE_OPTIONS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>

          <select
            value={methodFilter}
            onChange={applyFilter(setMethodFilter)}
            className={selectClass}
          >
            <option value="">ሁሉም ተግባራት (All Actions)</option>
            {METHOD_OPTIONS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={startDate}
            onChange={applyFilter(setStartDate)}
            className={dateClass}
            title="Start date"
          />
          <span className="text-xs font-bold text-slate-400">—</span>
          <input
            type="date"
            value={endDate}
            onChange={applyFilter(setEndDate)}
            className={dateClass}
            title="End date"
          />

          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="flex items-center gap-1 px-3 py-2 text-xs font-black text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              አጽዳ (Clear)
            </button>
          )}
        </div>
      </div>

      <div className="glass-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200/60 text-slate-500 text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-bold">ተጠቃሚ (User)</th>
                <th className="px-6 py-4 font-bold">ሚና (Role)</th>
                <th className="px-6 py-4 font-bold">ዘርፍ (Category)</th>
                <th className="px-6 py-4 font-bold">የተከናወነ ተግባር (Action)</th>
                <th className="px-6 py-4 font-bold">ኢላማ (Target Path)</th>
                <th className="px-6 py-4 font-bold text-right">ቀንና ሰዓት (Timestamp)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-800 text-sm">
                      {log.user?.name || "System"}
                    </div>
                    <div className="text-xs text-slate-400">@{log.user?.username || `ID: ${log.user_id || 'sys'}`}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider bg-slate-800 text-white">
                      {formatRole(log.user?.roles?.[0]?.name)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border ${getCategoryBadgeStyle(log.badge_type)}`}>
                      {log.category || "ስርዓት (System)"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-semibold text-slate-800">
                      {log.formatted_action || log.action || "ክንውን (Action)"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-mono text-[11px] text-slate-600 font-medium bg-slate-100/70 px-2 py-1 rounded border border-slate-200/50 max-w-[260px] truncate" title={log.details?.url}>
                      {log.details?.url ? new URL(log.details.url).pathname : "---"}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right text-xs text-slate-500 font-medium">
                    <div className="flex items-center justify-end gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {log.created_at ? format(new Date(log.created_at), "MMM d, yyyy HH:mm:ss") : "N/A"}
                    </div>
                  </td>
                </tr>
              ))}
              {logs.length === 0 && !loading && (
                <tr><td colSpan="6" className="text-center py-10 text-slate-500 font-bold">
                  {hasFilters ? "No logs match the selected filters." : "No recent activities found."}
                </td></tr>
              )}
              {loading && (
                <tr><td colSpan="6" className="text-center py-10 text-slate-400 font-medium">Loading activity logs...</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="bg-slate-50/50 px-6 py-4 border-t border-slate-200/60 flex justify-between items-center text-sm font-medium text-slate-500">
            <span>Viewing page <span className="text-brand-600 font-bold">{currentPage}</span> of {totalPages}</span>
            <div className="flex gap-2">
              <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-4 py-2 border bg-white rounded-lg disabled:opacity-40 hover:bg-slate-50 transition-colors font-bold">Prev</button>
              <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-4 py-2 border bg-white rounded-lg disabled:opacity-40 hover:bg-slate-50 transition-colors font-bold">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
