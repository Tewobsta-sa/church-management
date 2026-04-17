import { useState, useEffect } from "react";
import { studentService } from "../../services/studentService";
import { sectionService } from "../../services/sectionService";
import { Edit2, Trash2, Eye, Plus, Search, UserCheck, Music, Check, Clock, Filter } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import StudentModal from "./StudentModal";
import clsx from "clsx";

export default function StudentsList() {
  const { hasRole } = useAuth();

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [activeTab, setActiveTab] = useState("young"); // young | regular | distance
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [sections, setSections] = useState([]);
  const [selectedSection, setSelectedSection] = useState("");
  const [selectedMezmur, setSelectedMezmur] = useState(""); // "" | "1" | "0"

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [modalMode, setModalMode] = useState("view");

  const canCreate =
    (hasRole("young_gngnunet_admin") && activeTab === "young") ||
    hasRole("gngnunet_office_admin") ||
    (hasRole("distance_admin") && activeTab === "distance");
  const canEdit = canCreate;
  const canDelete = canCreate;

  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError(null);
      let data;
      const params = { 
        section_id: selectedSection,
        is_mezmur: selectedMezmur === "" ? undefined : selectedMezmur 
      };
      if (activeTab === "young") {
        data = await studentService.getYoungStudents(currentPage, search, params);
      } else if (activeTab === "regular") {
        data = await studentService.getRegularStudents(currentPage, search, params);
      } else if (activeTab === "distance") {
        data = await studentService.getDistanceStudents(currentPage, search, params);
      }
      setStudents(data?.data || []);
      setCurrentPage(data?.current_page || 1);
      setTotalPages(data?.last_page || 1);
      setTotal(data?.total || 0);
    } catch (err) {
      setError("Failed to load students data.");
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  // Pre-fetch sections for the active track
  useEffect(() => {
    const fetchSections = async () => {
      try {
        const res = await sectionService.getSections(1, "", "");
        // Only show sections matching the current tab (track name)
        const filtered = res.data?.filter(s => 
          s.program_type?.name?.toLowerCase() === activeTab.toLowerCase()
        ) || [];
        setSections(filtered);
        setSelectedSection(""); // Reset section when track changes
      } catch (err) {
        console.error("Failed to fetch sections", err);
      }
    };
    fetchSections();
  }, [activeTab]);

  // Re-fetch when tab or page or search or section/mezmur changes
  useEffect(() => {
    fetchStudents();
  }, [activeTab, currentPage, search, selectedSection, selectedMezmur]);

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
    if (!window.confirm("Are you sure you want to delete this student?")) return;
    try {
      await studentService.deleteStudent(id, activeTab);
      fetchStudents();
    } catch (err) {
      alert("Failed to delete student.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Students Explorer</h1>
          <p className="text-slate-500 font-medium mt-1">Manage enrollments across all academic tracks</p>
        </div>
        {canCreate && (
          <button
            onClick={() => openModal(null, "create")}
            className="flex items-center gap-2 bg-gradient-to-r from-brand-600 to-brand-500 text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-brand-500/30 hover:-translate-y-0.5 hover:shadow-brand-500/40 transition-all"
          >
            <Plus className="w-5 h-5" />
            Enroll Student
          </button>
        )}
      </div>

      <div className="glass-panel p-2 flex flex-wrap sm:flex-nowrap gap-2 items-center justify-between">
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-72">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="h-4 w-4" />
            </div>
            <input
              type="text"
              placeholder="Search roster..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:border-brand-500 outline-none focus:ring-4 focus:ring-brand-500/10 transition-all bg-white text-sm font-medium"
            />
          </div>

          <div className="flex items-center gap-2 bg-white px-3 py-1.5 border border-slate-200 rounded-xl shadow-sm">
            <Filter className="w-4 h-4 text-slate-400" />
            <select 
              className="bg-transparent border-none outline-none text-sm font-bold text-slate-700 min-w-[140px] cursor-pointer"
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
            >
              <option value="">All Sections</option>
              {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          <div className="flex items-center gap-2 bg-white px-3 py-1.5 border border-slate-200 rounded-xl shadow-sm">
            <Music className="w-4 h-4 text-slate-400" />
            <select 
              className="bg-transparent border-none outline-none text-sm font-bold text-slate-700 min-w-[140px] cursor-pointer"
              value={selectedMezmur}
              onChange={(e) => setSelectedMezmur(e.target.value)}
            >
              <option value="">All Students</option>
              <option value="1">Mezmur Students</option>
              <option value="0">Not Mezmur</option>
            </select>
          </div>
          </div>
        </div>

      {/* Table Section */}
      <div className="glass-panel overflow-hidden border-slate-200/60 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200/60 text-slate-500 text-sm tracking-wide">
                <th className="px-6 py-4 font-semibold">Student ID</th>
                <th className="px-6 py-4 font-semibold">Full Name</th>
                <th className="px-6 py-4 font-semibold">Program</th>
                <th className="px-6 py-4 font-semibold">Section</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                       <div className="w-8 h-8 border-4 border-brand-100 border-t-brand-500 rounded-full animate-spin mb-3"></div>
                       <p className="text-slate-500 font-medium">Fetching roster...</p>
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
                     <p className="text-slate-500 font-medium text-lg">No students found</p>
                     <p className="text-slate-400 text-sm">Adjust search criteria or enroll new students.</p>
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
                      {student.christian_name && <p className="text-xs text-slate-500 font-medium">Baptismal: {student.christian_name}</p>}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-indigo-50 text-indigo-700 border border-indigo-100">
                          {activeTab}
                        </span>
                        {student.status === 'Graduated' ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase">
                             Graduated
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-green-600 uppercase">
                            <UserCheck className="w-3 h-3" /> Active
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-medium">
                      <div className="flex flex-col">
                        <span>{student.section?.name || student.section_name || "Unassigned"}</span>
                        {student.is_mezmur && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-brand-600 uppercase">
                            <Music className="w-3 h-3" /> Mezmur Ministry
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex gap-2 justify-end opacity-70 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openModal(student, "view")}
                          className="p-2 hover:bg-brand-100 hover:text-brand-700 rounded-lg text-slate-400 transition-colors tooltip"
                          title="View Profile & QR"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        
                        {/* Verify Button (Hidden for Super Admin) */}
                        {hasRole("tmhrt_office_admin") && !student.is_verified && (
                          <button
                            onClick={async () => {
                              if(confirm("Verify this student?")) {
                                try {
                                  await studentService.verifyStudent(student.id);
                                  fetchStudents();
                                } catch(err) { alert("Verification failed"); }
                              }
                            }}
                            className="p-2 hover:bg-green-100 hover:text-green-700 rounded-lg text-slate-400 transition-colors tooltip"
                            title="Verify Student"
                          >
                            <Check className="w-5 h-5" />
                          </button>
                        )}

                        {/* Mezmur Toggle */}
                        {(hasRole("super_admin") || hasRole("mezmur_office_admin")) && (
                          <button
                             onClick={async () => {
                               try {
                                 if (student.is_mezmur) {
                                   await studentService.unassignMezmur([student.id]);
                                 } else {
                                   await studentService.assignMezmur([student.id]);
                                 }
                                 fetchStudents();
                               } catch(err) { alert("Mezmur toggle failed"); }
                             }}
                             className={clsx(
                               "p-2 rounded-lg transition-colors tooltip",
                               student.is_mezmur 
                                ? "bg-brand-100 text-brand-700 hover:bg-brand-200" 
                                : "text-slate-400 hover:bg-brand-50 hover:text-brand-600"
                             )}
                             title={student.is_mezmur ? "Remove from Mezmur" : "Assign to Mezmur"}
                          >
                            <Music className="w-5 h-5" />
                          </button>
                        )}

                        {canEdit && (
                          <button
                            onClick={() => openModal(student, "edit")}
                            className="p-2 hover:bg-amber-100 hover:text-amber-700 rounded-lg text-slate-400 transition-colors"
                          >
                            <Edit2 className="w-5 h-5" />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => handleDelete(student.id)}
                            className="p-2 hover:bg-red-100 hover:text-red-700 rounded-lg text-slate-400 transition-colors"
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

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="bg-slate-50/50 px-6 py-4 border-t border-slate-200/60 flex justify-between items-center">
            <span className="text-sm font-medium text-slate-500">
              Showing directory page <span className="text-brand-600 font-bold">{currentPage}</span> of {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-slate-200 bg-white rounded-lg text-sm font-bold text-slate-600 disabled:opacity-40 hover:bg-slate-50 transition-colors"
              >
                Prev
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border border-slate-200 bg-white rounded-lg text-sm font-bold text-slate-600 disabled:opacity-40 hover:bg-slate-50 transition-colors"
              >
                Next
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
    </div>
  );
}
