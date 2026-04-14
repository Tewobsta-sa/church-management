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

  const getMethodColor = (method) => {
    switch (method?.toUpperCase()) {
      case "POST": return "bg-green-100 text-green-700 border-green-200";
      case "PUT":
      case "PATCH": return "bg-amber-100 text-amber-700 border-amber-200";
      case "DELETE": return "bg-red-100 text-red-700 border-red-200";
      default: return "bg-blue-100 text-blue-700 border-blue-200";
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
            <tr className="bg-slate-50/50 border-b border-slate-200/60 text-slate-500 text-sm tracking-wide">
              <th className="px-6 py-4 font-semibold">User</th>
              <th className="px-6 py-4 font-semibold">Action</th>
              <th className="px-6 py-4 font-semibold">Endpoint</th>
              <th className="px-6 py-4 font-semibold text-right">Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-semibold text-slate-800">
                    {log.user?.name || "System"}
                  </div>
                  <div className="text-xs text-slate-500">ID: {log.user_id}</div>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider border ${getMethodColor(log.method)}`}>
                    {log.method}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="font-mono text-sm text-slate-600 font-medium tracking-tight bg-slate-100 px-2 py-1 rounded inline-block">
                    {log.url}
                  </div>
                </td>
                <td className="px-6 py-4 text-right text-sm text-slate-500">
                  <div className="flex items-center justify-end gap-1">
                    <Clock className="w-3 h-3" />
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
