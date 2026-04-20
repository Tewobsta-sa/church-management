import { useState, useEffect } from "react";
import { studentService } from "../../services/studentService";
import { Edit2, Trash2, Eye, Plus, Search, UserCheck, Upload } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useTranslation } from "react-i18next";
import StudentModal from "./StudentModal";
import BulkImportModal from "./BulkImportModal";
import clsx from "clsx";

const TABS = [
  { key: "young", i18n: "students.trackYoung" },
  { key: "regular", i18n: "students.trackRegular" },
  { key: "distance", i18n: "students.trackDistance" },
];

export default function StudentsList() {
  const { hasRole } = useAuth();
  const { t } = useTranslation();

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [activeTab, setActiveTab] = useState("young"); // young | regular | distance
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [modalMode, setModalMode] = useState("view");
  const [importOpen, setImportOpen] = useState(false);

  const canCreate =
    (hasRole("young_gngnunet_admin") && activeTab === "young") ||
    hasRole("gngnunet_office_admin") ||
    (hasRole("distance_admin") && activeTab === "distance");
  const canEdit = canCreate;
  const canDelete = canCreate;
  const canImport = canCreate;

  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError(null);
      let data;
      if (activeTab === "young") {
        data = await studentService.getYoungStudents(currentPage, search);
      } else if (activeTab === "regular") {
        data = await studentService.getRegularStudents(currentPage, search);
      } else if (activeTab === "distance") {
        data = await studentService.getDistanceStudents(currentPage, search);
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
     
  }, [activeTab, currentPage, search]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  const openModal = (student = null, mode = "view") => {
    setSelectedStudent(student);
    setModalMode(mode);
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t("students.confirmDelete"))) return;
    try {
      await studentService.deleteStudent(id, activeTab);
      fetchStudents();
    } catch (err) {
      alert(t("students.deleteFailed"));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">{t("students.title")}</h1>
          <p className="text-slate-500 font-medium mt-1">{t("students.subtitle")}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {canImport && (
            <button
              onClick={() => setImportOpen(true)}
              className="flex items-center gap-2 bg-white text-brand-700 border border-brand-200 px-4 py-2.5 rounded-xl font-semibold hover:bg-brand-50 transition-all"
            >
              <Upload className="w-4 h-4" />
              {t("students.import.button")}
            </button>
          )}
          {canCreate && (
            <button
              onClick={() => openModal(null, "create")}
              className="flex items-center gap-2 bg-gradient-to-r from-brand-600 to-brand-500 text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-brand-500/30 hover:-translate-y-0.5 hover:shadow-brand-500/40 transition-all"
            >
              <Plus className="w-5 h-5" />
              {t("students.enrollNew")}
            </button>
          )}
        </div>
      </div>

      <div className="glass-panel p-2 flex flex-wrap sm:flex-nowrap gap-2 items-center justify-between">
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={clsx(
                "px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors",
                activeTab === tab.key
                  ? "bg-white text-brand-700 shadow"
                  : "text-slate-500 hover:text-slate-700"
              )}
            >
              {t(tab.i18n)}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            placeholder={t("students.searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:border-brand-500 outline-none focus:ring-4 focus:ring-brand-500/10 transition-all bg-white text-sm font-medium"
          />
        </div>
      </div>

      <div className="glass-panel overflow-hidden border-slate-200/60 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200/60 text-slate-500 text-sm tracking-wide">
                <th className="px-6 py-4 font-semibold">{t("students.fields.studentId")}</th>
                <th className="px-6 py-4 font-semibold">{t("students.fields.name")}</th>
                <th className="px-6 py-4 font-semibold">{t("common.program")}</th>
                <th className="px-6 py-4 font-semibold">{t("common.section")}</th>
                <th className="px-6 py-4 font-semibold text-right">{t("common.actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                       <div className="w-8 h-8 border-4 border-brand-100 border-t-brand-500 rounded-full animate-spin mb-3"></div>
                       <p className="text-slate-500 font-medium">{t("common.loading")}</p>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                   <td colSpan="5" className="px-6 py-8 text-center text-red-500 font-medium">{error}</td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center">
                     <UserCheck className="mx-auto w-12 h-12 text-slate-300 mb-3" />
                     <p className="text-slate-500 font-medium text-lg">{t("students.noneFound")}</p>
                  </td>
                </tr>
              ) : (
                students.map((student) => (
                  <tr key={student.id} className="hover:bg-brand-50/30 transition-colors group">
                    <td className="px-6 py-4 font-bold text-slate-700">
                      {student.student_id || "-"}
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-800">{student.name}</p>
                      {student.christian_name && <p className="text-xs text-slate-500 font-medium">{t("students.fields.christianName")}: {student.christian_name}</p>}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-700/10 uppercase tracking-wider">
                        {t(`students.track${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}`)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-medium">
                      {student.section_name || t("common.none")}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex gap-2 justify-end opacity-70 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openModal(student, "view")}
                          className="p-2 hover:bg-brand-100 hover:text-brand-700 rounded-lg text-slate-400 transition-colors"
                          title={t("common.view")}
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        {canEdit && (
                          <button
                            onClick={() => openModal(student, "edit")}
                            className="p-2 hover:bg-amber-100 hover:text-amber-700 rounded-lg text-slate-400 transition-colors"
                            title={t("common.edit")}
                          >
                            <Edit2 className="w-5 h-5" />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => handleDelete(student.id)}
                            className="p-2 hover:bg-red-100 hover:text-red-700 rounded-lg text-slate-400 transition-colors"
                            title={t("common.delete")}
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="bg-slate-50/50 px-6 py-4 border-t border-slate-200/60 flex justify-between items-center">
            <span className="text-sm font-medium text-slate-500">
              {t("common.page")} <span className="text-brand-600 font-bold">{currentPage}</span> {t("common.of")} {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-slate-200 bg-white rounded-lg text-sm font-bold text-slate-600 disabled:opacity-40 hover:bg-slate-50 transition-colors"
              >
                {t("common.previous")}
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border border-slate-200 bg-white rounded-lg text-sm font-bold text-slate-600 disabled:opacity-40 hover:bg-slate-50 transition-colors"
              >
                {t("common.next")}
              </button>
            </div>
          </div>
        )}
      </div>

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

      <BulkImportModal
        isOpen={importOpen}
        onClose={() => setImportOpen(false)}
        track={activeTab}
        onSuccess={fetchStudents}
      />
    </div>
  );
}
