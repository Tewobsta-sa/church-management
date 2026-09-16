import { useState, useEffect } from "react";
import { adminService } from "../../services/adminService";
import { Activity, Clock } from "lucide-react";
import { format } from "date-fns";

export default function SystemLogsViewer() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await adminService.getLogs(currentPage);
      setLogs(data.data || []);
      setTotalPages(data.last_page || 1);
    } catch (err) {
      console.error("Error fetching logs", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [currentPage]);

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

  if (loading && logs.length === 0) {
    return <div className="p-8 text-center text-slate-500 font-medium">Loading activity logs...</div>;
  }

  return (
    <div className="glass-panel overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-200/60 text-slate-500 text-xs uppercase tracking-wider">
              <th className="px-6 py-4 font-bold">ተጠቃሚ (User)</th>
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
            {logs.length === 0 && (
               <tr><td colSpan="4" className="text-center py-10 text-slate-500 font-bold">No recent activities found.</td></tr>
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
  );
}
