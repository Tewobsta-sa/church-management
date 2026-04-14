import { useState, useEffect } from "react";
import { adminService } from "../../services/adminService";
import { Plus, Trash2, Users, Search, Shield, Settings, Activity } from "lucide-react";
import UserModal from "./UserModal";
import SystemLogsViewer from "./SystemLogsViewer";
import { useAuth } from "../../context/AuthContext";

export default function UsersManagement() {
  const { hasRole } = useAuth();
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const [totalPages, setTotalPages] = useState(1);
  const [activeTab, setActiveTab] = useState("users");

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalMode, setModalMode] = useState("create");

  const isSuperAdmin = hasRole("super_admin");

  const fetchUsers = async () => {
    try {
      const data = await adminService.getUsers(currentPage, search);
      setUsers(data.data || []);
      setTotalPages(data.last_page || 1);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchStats = async () => {
    if (!isSuperAdmin) return;
    try {
      const statsData = await adminService.getStats();
      setStats(statsData?.stats || null);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchStats();
  }, [currentPage, search]);

  const openModal = (user = null, mode = "create") => {
    setSelectedUser(user);
    setModalMode(mode);
    setModalOpen(true);
  };

  const handleSave = async (formData, id = null) => {
    try {
      if (id) {
        await adminService.updateUser(id, formData);
      } else {
        await adminService.registerUser(formData);
      }
      fetchUsers();
      if(isSuperAdmin) fetchStats();
      setModalOpen(false);
    } catch (err) {
      const msgs = err.response?.data?.errors ? Object.values(err.response.data.errors).flat().join("\n") : err.response?.data?.error || "Operation failed";
      alert(msgs);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    try {
      await adminService.deleteUser(id);
      fetchUsers();
      if(isSuperAdmin) fetchStats();
    } catch (err) {
      alert(err.response?.data?.error || err.response?.data?.message || "Delete failed");
    }
  };

  const getUserRole = (user) => {
    if (user?.roles?.length > 0) return user.roles[0].name;
    if (user?.role) return user.role;
    return null;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">System & Users</h1>
          <p className="text-slate-500 font-medium mt-1">Manage global access and user accounts</p>
        </div>
        <button
          onClick={() => openModal(null, "create")}
          className="flex items-center gap-2 bg-gradient-to-r from-brand-600 to-brand-500 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-brand-500/30 hover:-translate-y-0.5 transition-all"
        >
          <Plus className="w-5 h-5" />
          Register User
        </button>
      </div>

      {/* Stats Cards (Super Admin Only) */}
      {isSuperAdmin && stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Accounts" value={stats.total_users || 0} icon={Users} color="brand" />
          <StatCard title="Super Admins" value={stats.super_admin_count || 0} icon={Shield} color="indigo" />
          <StatCard title="Office Admins" value={stats.other_admin_count || 0} icon={Settings} color="purple" />
          <StatCard title="Staff Users" value={(stats.total_users || 0) - (stats.super_admin_count || 0)} icon={Activity} color="green" />
        </div>
      )}

      <div className="glass-panel p-2">
        <div className="relative w-full">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by name or username..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-3 bg-white/70 border border-slate-200 rounded-xl outline-none focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-500/10 font-medium text-slate-800 transition-all"
          />
        </div>
      </div>

        <div className="flex gap-4 border-b border-slate-200/60 pb-4 mb-4 mt-6">
          <button 
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 font-bold rounded-lg transition-all ${activeTab === 'users' ? 'bg-brand-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100'}`}
          >
            User Accounts
          </button>
          {isSuperAdmin && (
            <button 
              onClick={() => setActiveTab('logs')}
              className={`px-4 py-2 font-bold rounded-lg transition-all ${activeTab === 'logs' ? 'bg-brand-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100'}`}
            >
              System Activity Logs
            </button>
          )}
        </div>

      {activeTab === 'users' ? (
        <div className="glass-panel overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200/60 text-slate-500 text-sm tracking-wide">
                <th className="px-6 py-4 font-semibold">User Details</th>
                <th className="px-6 py-4 font-semibold">System Privileges</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <p className="font-extrabold text-slate-800 flex items-center gap-2">
                       {user.name} 
                       {getUserRole(user) === 'super_admin' && <Shield className="w-4 h-4 text-amber-500" />}
                    </p>
                    <p className="text-xs font-semibold text-slate-500 mt-0.5">@{user.username}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-3 py-1 rounded-full text-[10px] uppercase font-black tracking-widest border
                        ${getUserRole(user) === 'super_admin' ? 'bg-amber-50 text-amber-700 border-amber-200' : 
                          getUserRole(user)?.includes('admin') ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 
                          'bg-slate-100 text-slate-600 border-slate-200'}`}>
                      {getUserRole(user)?.replaceAll("_", " ")}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                      {isSuperAdmin && (
                         <>
                           <button onClick={() => openModal(user, "edit")} className="p-2 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-colors tooltip" title="Edit Admin">
                              <Settings className="w-4 h-4" />
                           </button>
                           <button onClick={() => handleDelete(user.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors tooltip" title="Delete User">
                              <Trash2 className="w-4 h-4" />
                           </button>
                         </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                 <tr><td colSpan="3" className="text-center py-10 text-slate-500 font-bold">No users constructed.</td></tr>
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
      ) : (
        <SystemLogsViewer />
      )}

      <UserModal isOpen={modalOpen} onClose={() => setModalOpen(false)} user={selectedUser} mode={modalMode} onSave={handleSave} />
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color }) {
  const colors = {
    brand: "bg-brand-50 text-brand-700 border-brand-200",
    indigo: "bg-indigo-50 text-indigo-700 border-indigo-200",
    purple: "bg-purple-50 text-purple-700 border-purple-200",
    green: "bg-green-50 text-green-700 border-green-200",
  };

  return (
    <div className={`p-5 rounded-2xl glass-panel ${colors[color]} border shadow-sm flex items-center justify-between`}>
      <div>
        <p className="text-xs uppercase font-bold tracking-widest opacity-80 mb-1">{title}</p>
        <p className="text-3xl font-black">{value}</p>
      </div>
      <Icon className="w-10 h-10 opacity-30" />
    </div>
  );
}
