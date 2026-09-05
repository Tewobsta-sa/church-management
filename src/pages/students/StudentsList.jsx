import { useState, useEffect } from "react";
import { studentService } from "../../services/studentService";
import {
  Edit2,
  Trash2,
  Eye,
  Plus,
  Search,
  UserCheck,
  Upload,
  QrCode,
  CheckCircle2,
  Filter,
  CheckSquare,
  Square,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useTranslation } from "react-i18next";
import StudentModal from "./StudentModal";
import BulkImportModal from "./BulkImportModal";
import IdCardExportModal from "./IdCardExportModal";
import clsx from "clsx";

const TABS = [
  { key: "prekg", label: "PreKG Program" },
  { key: "regular", label: "Regular Program" },
  { key: "distance", label: "Distance Learning" },
];

const REGULAR_SUB_FILTERS = [
  { key: "all", label: "All Regular" },
  { key: "htsanat", label: "Htsanat (1-4)" },
  { key: "maekelawyan", label: "Maekelawyan (5-8)" },
  { key: "wetatoch", label: "Wetatoch (9-12)" },
];

export default function StudentsList() {
  const { hasRole } = useAuth();
  const { t } = useTranslation();

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [activeTab, setActiveTab] = useState("regular"); // prekg | regular | distance
  const [regularSubFilter, setRegularSubFilter] = useState("all"); // all | htsanat | maekelawyan | wetatoch
  const [statusFilter, setStatusFilter] = useState("all"); // all | new | regular

  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Selection state for bulk actions
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkLoading, setBulkLoading] = useState(false);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [modalMode, setModalMode] = useState("view");
  const [importOpen, setImportOpen] = useState(false);
  const [idCardModalOpen, setIdCardModalOpen] = useState(false);

  // Permissions
  const isSuperAdmin = hasRole("super_admin");
  const isYesewHabt = hasRole("yesew_habt") || hasRole("gngnunet_office_admin");
  const isMereja = hasRole("mereja_kfl");

  const canCreate = (isYesewHabt || isSuperAdmin) && !isMereja;
  const canEdit = canCreate;
  const canDelete = canCreate;
  const canImport = canCreate;
  const canBulkUpdate = canCreate;

  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError(null);

      const filters = {};
      if (activeTab === "regular" && regularSubFilter !== "all") {
        filters.classification = regularSubFilter;
      }
      if (statusFilter !== "all") {
        filters.status = statusFilter;
      }

      let data;
      if (activeTab === "prekg") {
        data = await studentService.getPreKGStudents(currentPage, search, filters);
      } else if (activeTab === "regular") {
        data = await studentService.getRegularStudents(currentPage, search, filters);
      } else if (activeTab === "distance") {
        data = await studentService.getDistanceStudents(currentPage, search, filters);
      }

      setStudents(data?.data || []);
      setCurrentPage(data?.current_page || 1);
      setTotalPages(data?.last_page || 1);
      setTotal(data?.total || 0);
    } catch (err) {
      setError(t("common.serverError"));
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
    setSelectedIds([]);
  }, [activeTab, regularSubFilter, statusFilter, currentPage, search]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setCurrentPage(1);
    setSelectedIds([]);
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(students.map((s) => s.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBulkUpdateStatus = async () => {
    if (selectedIds.length === 0) {
      alert("Please select at least one student to update.");
      return;
    }

    if (
      !confirm(
        `Are you sure you want to change the status of ${selectedIds.length} student(s) from 'New' to 'Regular'?`
      )
    ) {
      return;
    }

    setBulkLoading(true);
    try {
      await studentService.bulkUpdateStatus(selectedIds, "regular");
      alert(`Successfully updated ${selectedIds.length} student(s) to Regular status.`);
      setSelectedIds([]);
      fetchStudents();
    } catch (err) {
      console.error(err);
      alert("Failed to update status. Please try again.");
    } finally {
      setBulkLoading(false);
    }
  };

  const openModal = (student = null, mode = "view") => {
    setSelectedStudent(student);
    setModalMode(mode);
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this student record?")) return;
    try {
      await studentService.deleteStudent(id);
      fetchStudents();
    } catch (err) {
      alert("Failed to delete student");
    }
  };

  const selectedStudentsData = students.filter((s) => selectedIds.includes(s.id));
  const studentsForIdCards = selectedStudentsData.length > 0 ? selectedStudentsData : students;

  return (
    <div className="space-y-6 animate-[fade-in_0.3s_ease-out]">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">
            Student Management
          </h1>
          <p className="text-slate-500 font-medium mt-0.5">
            Registration, classification progression, ID cards, and student records
          </p>
        </div>

        <div className="flex gap-2 flex-wrap items-center">
          {/* Export ID Cards Button */}
          <button
            onClick={() => setIdCardModalOpen(true)}
            disabled={students.length === 0}
            className="flex items-center gap-2 bg-white text-brand-700 border border-brand-200 px-4 py-2.5 rounded-xl font-bold shadow-sm hover:bg-brand-50 transition-all text-xs uppercase tracking-wider disabled:opacity-40"
          >
            <QrCode className="w-4 h-4 text-brand-600" />
            Export ID Cards ({selectedIds.length > 0 ? selectedIds.length : "All"})
          </button>

          {/* Import Button */}
          {canImport && (
            <button
              onClick={() => setImportOpen(true)}
              className="flex items-center gap-2 bg-white text-slate-700 border border-slate-200 px-4 py-2.5 rounded-xl font-bold hover:bg-slate-50 transition-all text-xs uppercase tracking-wider"
            >
              <Upload className="w-4 h-4 text-slate-500" />
              Bulk Import
            </button>
          )}

          {/* Enroll New Student Button */}
          {canCreate && (
            <button
              onClick={() => openModal(null, "create")}
              className="flex items-center gap-2 bg-gradient-to-r from-brand-600 to-brand-500 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-brand-500/25 hover:-translate-y-0.5 transition-all text-xs uppercase tracking-wider"
            >
              <Plus className="w-4 h-4" />
              Enroll Student
            </button>
          )}
        </div>
      </div>

      {/* Program Track Tabs */}
      <div className="glass-panel p-2 flex flex-wrap sm:flex-nowrap gap-3 items-center justify-between">
        <div className="flex gap-1.5 bg-slate-100/90 rounded-2xl p-1.5 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={clsx(
                "px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all shrink-0",
                activeTab === tab.key
                  ? "bg-white text-brand-700 shadow-md shadow-brand-900/5"
                  : "text-slate-500 hover:text-slate-800"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-72">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            placeholder="Search by name or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:border-brand-500 outline-none bg-white text-sm font-medium"
          />
        </div>
      </div>

      {/* Sub-Filters for Regular Program (Htsanat, Maekelawyan, Wetatoch) & Status */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-sm">
        {/* Classification Sub-filters (if Regular) */}
        {activeTab === "regular" ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-extrabold uppercase text-slate-400 mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Group:
            </span>
            {REGULAR_SUB_FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setRegularSubFilter(f.key)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  regularSubFilter === f.key
                    ? "bg-brand-50 text-brand-700 border border-brand-200 font-extrabold"
                    : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        ) : (
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wide">
            {activeTab === "prekg" ? "PreKG Early Childhood Sections" : "Distance Learning Students"}
          </div>
        )}

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-extrabold uppercase text-slate-400">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="new">New Students</option>
            <option value="regular">Regular Students</option>
          </select>
        </div>
      </div>

      {/* Bulk Action Bar (Visible when students selected) */}
      {selectedIds.length > 0 && canBulkUpdate && (
        <div className="bg-gradient-to-r from-brand-900 to-brand-800 text-white p-4 rounded-2xl shadow-xl flex flex-wrap items-center justify-between gap-4 animate-[slide-up_0.2s_ease-out]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center font-bold text-amber-300">
              {selectedIds.length}
            </div>
            <div>
              <p className="font-bold text-sm">
                {selectedIds.length} student(s) selected
              </p>
              <p className="text-xs text-brand-200">
                Perform bulk status update or batch export
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleBulkUpdateStatus}
              disabled={bulkLoading}
              className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider shadow transition-all disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              {bulkLoading ? "Updating..." : "Bulk Update Status (New → Regular)"}
            </button>

            <button
              onClick={() => setIdCardModalOpen(true)}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all"
            >
              <QrCode className="w-4 h-4" />
              Export Selected IDs
            </button>
          </div>
        </div>
      )}

      {/* Students Data Table */}
      <div className="glass-panel overflow-hidden border-slate-200/60 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200/60 text-slate-500 text-xs tracking-wider uppercase font-bold">
                <th className="px-5 py-4 w-10">
                  <input
                    type="checkbox"
                    onChange={handleSelectAll}
                    checked={
                      students.length > 0 && selectedIds.length === students.length
                    }
                    className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 cursor-pointer"
                  />
                </th>
                <th className="px-4 py-4">Student</th>
                <th className="px-4 py-4">Program & Class</th>
                <th className="px-4 py-4">Contact / Address</th>
                <th className="px-4 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mb-3"></div>
                      <p className="text-slate-500 font-medium">Loading student records...</p>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-red-500 font-medium">
                    {error}
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <UserCheck className="mx-auto w-12 h-12 text-slate-300 mb-3" />
                    <p className="text-slate-500 font-bold text-base">No students found in this category</p>
                    <p className="text-xs text-slate-400 mt-1">Enroll new students or adjust your filters above.</p>
                  </td>
                </tr>
              ) : (
                students.map((student) => {
                  const isSelected = selectedIds.includes(student.id);

                  return (
                    <tr
                      key={student.id}
                      className={clsx(
                        "transition-colors group",
                        isSelected ? "bg-brand-50/40" : "hover:bg-slate-50/60"
                      )}
                    >
                      {/* Checkbox */}
                      <td className="px-5 py-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(student.id)}
                          className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 cursor-pointer"
                        />
                      </td>

                      {/* Photo & Name */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          {student.picture_url ? (
                            <img
                              src={student.picture_url}
                              alt={student.name}
                              className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center font-bold text-brand-700 shrink-0 text-sm">
                              {student.name?.charAt(0) || "S"}
                            </div>
                          )}
                          <div>
                            <p className="font-extrabold text-slate-900 leading-tight">
                              {student.name}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[11px] font-bold text-brand-600">
                                {student.student_id}
                              </span>
                              {student.christian_name && (
                                <span className="text-[11px] text-slate-400 font-medium truncate max-w-[120px]">
                                  • {student.christian_name}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Program & Section */}
                      <td className="px-4 py-4">
                        <p className="font-bold text-slate-800 text-xs">
                          {student.section?.name || student.section_name || "Unassigned"}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                            {student.classification || student.section?.programType?.name || activeTab}
                          </span>
                          {student.grade_level && (
                            <span className="text-[10px] font-bold text-slate-400">
                              {student.grade_level}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Contact & Address */}
                      <td className="px-4 py-4 text-xs text-slate-600">
                        <p className="font-semibold text-slate-800">
                          {student.phone_number || student.family_guardian_phone || "-"}
                        </p>
                        <p className="text-[11px] text-slate-400 truncate max-w-[180px]">
                          {student.address?.subcity ? `${student.address.subcity}, W.${student.address.woreda || student.address.district || ""}` : "Addis Ababa"}
                        </p>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-4">
                        <span
                          className={clsx(
                            "inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                            student.status === "regular"
                              ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20"
                              : "bg-amber-50 text-amber-700 ring-1 ring-amber-600/20"
                          )}
                        >
                          {student.status || "new"}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex gap-1.5 justify-end opacity-80 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openModal(student, "view")}
                            className="p-2 hover:bg-brand-50 hover:text-brand-700 rounded-lg text-slate-400 transition-colors"
                            title="View Profile"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {canEdit && (
                            <button
                              onClick={() => openModal(student, "edit")}
                              className="p-2 hover:bg-amber-50 hover:text-amber-700 rounded-lg text-slate-400 transition-colors"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}
                          {canDelete && (
                            <button
                              onClick={() => handleDelete(student.id)}
                              className="p-2 hover:bg-red-50 hover:text-red-700 rounded-lg text-slate-400 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-slate-50/50 px-6 py-4 border-t border-slate-200/60 flex justify-between items-center text-xs">
            <span className="font-semibold text-slate-500">
              Page <strong className="text-brand-700">{currentPage}</strong> of{" "}
              {totalPages} ({total} total students)
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-slate-200 bg-white rounded-xl font-bold text-slate-600 disabled:opacity-40 hover:bg-slate-50 transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border border-slate-200 bg-white rounded-xl font-bold text-slate-600 disabled:opacity-40 hover:bg-slate-50 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Student Details / Edit Modal */}
      <StudentModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        student={selectedStudent}
        mode={modalMode}
        track={activeTab}
        onSuccess={fetchStudents}
        canEdit={canEdit}
        canDelete={canDelete}
      />

      {/* Bulk CSV Import Modal */}
      <BulkImportModal
        isOpen={importOpen}
        onClose={() => setImportOpen(false)}
        track={activeTab}
        onSuccess={fetchStudents}
      />

      {/* Identification Card Export Modal */}
      <IdCardExportModal
        isOpen={idCardModalOpen}
        onClose={() => setIdCardModalOpen(false)}
        students={studentsForIdCards}
      />
    </div>
  );
}
