import { useState, useEffect, useRef } from "react";
import {
  X,
  Download,
  Printer,
  FileText,
  Palette,
  Check,
  ChevronRight,
  Sparkles,
  Award,
  BookOpen,
  Calendar,
  Layers,
  GraduationCap
} from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { resultsService } from "../../services/resultsService";
import { sectionService } from "../../services/sectionService";

const COLOR_PRESETS = [
  { name: "Royal Navy", primary: "#1e3a8a", secondary: "#3b82f6", light: "#eff6ff", border: "#bfdbfe" },
  { name: "Emerald", primary: "#065f46", secondary: "#10b981", light: "#ecfdf5", border: "#a7f3d0" },
  { name: "Crimson", primary: "#881337", secondary: "#e11d48", light: "#fff1f2", border: "#fecdd3" },
  { name: "Imperial Purple", primary: "#581c87", secondary: "#9333ea", light: "#faf5ff", border: "#e9d5ff" },
  { name: "Golden Amber", primary: "#78350f", secondary: "#d97706", light: "#fffbeb", border: "#fde68a" },
  { name: "Slate Onyx", primary: "#1e293b", secondary: "#475569", light: "#f8fafc", border: "#cbd5e1" },
];

export default function BulkReportCardsModal({ isOpen, onClose, initialSectionId = null }) {
  const [sections, setSections] = useState([]);
  const [selectedSectionId, setSelectedSectionId] = useState(initialSectionId || "");
  const [selectedTheme, setSelectedTheme] = useState(COLOR_PRESETS[0]);
  const [customPrimary, setCustomPrimary] = useState("#1e3a8a");
  const [isCustomColor, setIsCustomColor] = useState(false);

  const [loading, setLoading] = useState(false);
  const [reportCards, setReportCards] = useState([]);
  const [activePreviewIndex, setActivePreviewIndex] = useState(0);
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState({ current: 0, total: 0 });

  const printContainerRef = useRef(null);
  const currentYear = new Date().getFullYear();

  // Load sections
  useEffect(() => {
    if (!isOpen) return;
    const fetchSections = async () => {
      try {
        const res = await sectionService.getSections({ all: true });
        const list = Array.isArray(res) ? res : (res?.data || []);
        setSections(list);
        if (!selectedSectionId && list.length > 0) {
          setSelectedSectionId(list[0].id);
        }
      } catch (err) {
        console.error("Failed to load sections", err);
      }
    };
    fetchSections();
  }, [isOpen]);

  // Load report cards when section changes
  useEffect(() => {
    if (!isOpen || !selectedSectionId) return;

    const fetchReportCards = async () => {
      setLoading(true);
      try {
        const data = await resultsService.getSectionReportCards(selectedSectionId);
        setReportCards(data || []);
        setActivePreviewIndex(0);
      } catch (err) {
        console.error("Failed to load section report cards", err);
        setReportCards([]);
      } finally {
        setLoading(false);
      }
    };

    fetchReportCards();
  }, [isOpen, selectedSectionId]);

  if (!isOpen) return null;

  const currentTheme = isCustomColor
    ? {
        name: "Custom",
        primary: customPrimary,
        secondary: customPrimary,
        light: "#f8fafc",
        border: "#e2e8f0",
      }
    : selectedTheme;

  const selectedSection = sections.find((s) => String(s.id) === String(selectedSectionId));

  const handleDownloadPDF = async () => {
    if (!printContainerRef.current || reportCards.length === 0) return;
    setDownloading(true);
    setDownloadProgress({ current: 0, total: reportCards.length });

    try {
      const pdf = new jsPDF("p", "mm", "a4");
      const cardElements = printContainerRef.current.querySelectorAll(".report-card-page");

      for (let i = 0; i < cardElements.length; i++) {
        setDownloadProgress({ current: i + 1, total: cardElements.length });
        const el = cardElements[i];

        const canvas = await html2canvas(el, {
          scale: 2,
          useCORS: true,
          logging: false,
        });

        const imgData = canvas.toDataURL("image/jpeg", 0.95);
        const pdfWidth = 210; // A4 width in mm
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

        if (i > 0) {
          pdf.addPage();
        }

        pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, pdfHeight);
      }

      const sectionNameClean = (selectedSection?.name || "Section").replace(/[^a-zA-Z0-9]/g, "_");
      pdf.save(`${sectionNameClean}_Report_Cards_${currentYear}.pdf`);
    } catch (err) {
      console.error("Failed to generate PDF", err);
      alert("An error occurred while generating the PDF. Try printing directly.");
    } finally {
      setDownloading(false);
      setDownloadProgress({ current: 0, total: 0 });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const currentStudent = reportCards[activePreviewIndex] || null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-[fade-in_0.2s_ease-out]">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl max-h-[94vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between px-8 py-5 border-b border-slate-100 bg-slate-50/50 gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full inline-block"
                style={{ backgroundColor: currentTheme.primary }}
              />
              <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                <GraduationCap className="w-6 h-6 text-brand-600" />
                Section Report Cards Bulk Export
              </h2>
            </div>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">
              Customize colors, preview student records, and generate high-resolution section PDF cards
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleDownloadPDF}
              disabled={downloading || reportCards.length === 0}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold shadow-lg transition-all text-xs uppercase tracking-wider text-white disabled:opacity-50"
              style={{
                backgroundColor: currentTheme.primary,
                boxShadow: `0 10px 20px -5px ${currentTheme.primary}40`,
              }}
            >
              {downloading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              {downloading
                ? `Exporting ${downloadProgress.current}/${downloadProgress.total}...`
                : `Download All PDFs (${reportCards.length})`}
            </button>

            <button
              onClick={handlePrint}
              disabled={reportCards.length === 0}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50"
            >
              <Printer className="w-4 h-4" />
              Print
            </button>

            <button
              onClick={onClose}
              className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full transition-colors ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Controls Bar: Section Selector & Color Themes */}
        <div className="px-8 py-4 bg-white border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
          {/* Section Selection */}
          <div className="flex items-center gap-3">
            <label className="text-xs font-black uppercase tracking-wider text-slate-500">
              Select Section:
            </label>
            <select
              value={selectedSectionId}
              onChange={(e) => setSelectedSectionId(e.target.value)}
              className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            >
              <option value="">-- Choose Section --</option>
              {sections.map((sec) => (
                <option key={sec.id} value={sec.id}>
                  {sec.name} ({sec.program_type?.name || "Standard"})
                </option>
              ))}
            </select>
            <span className="text-xs font-bold text-slate-400">
              {reportCards.length} students enrolled
            </span>
          </div>

          {/* Color Palettes */}
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Palette className="w-4 h-4 text-brand-600" />
              Card Theme:
            </span>

            <div className="flex items-center gap-2">
              {COLOR_PRESETS.map((preset) => {
                const isSelected = !isCustomColor && selectedTheme.name === preset.name;
                return (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => {
                      setSelectedTheme(preset);
                      setIsCustomColor(false);
                    }}
                    className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                      isSelected
                        ? "ring-2 ring-offset-2 ring-slate-800 scale-110 shadow-sm"
                        : "hover:scale-105 opacity-80 hover:opacity-100"
                    }`}
                    style={{ backgroundColor: preset.primary }}
                    title={preset.name}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                  </button>
                );
              })}

              {/* Custom color picker */}
              <div className="relative flex items-center ml-2 border-l border-slate-200 pl-3">
                <input
                  type="color"
                  id="customColorPicker"
                  value={customPrimary}
                  onChange={(e) => {
                    setCustomPrimary(e.target.value);
                    setIsCustomColor(true);
                  }}
                  className="w-7 h-7 rounded-lg border border-slate-200 cursor-pointer overflow-hidden p-0"
                  title="Choose custom section color"
                />
                <label
                  htmlFor="customColorPicker"
                  className="text-xs font-semibold text-slate-600 ml-1.5 cursor-pointer"
                >
                  Custom
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Main Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-100/60 flex flex-col items-center">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mb-4" />
              <p className="font-bold text-slate-600">Gathering section report data & grades...</p>
            </div>
          ) : reportCards.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl p-12 max-w-lg border border-slate-200">
              <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-black text-slate-700">No Student Records Found</h3>
              <p className="text-sm text-slate-400 mt-2">
                This section currently does not have enrolled students or recorded grades. Please select another section.
              </p>
            </div>
          ) : (
            <div className="w-full max-w-4xl space-y-6">
              {/* Student Carousel Navigation */}
              <div className="flex items-center justify-between bg-white px-6 py-3 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-xs font-bold text-slate-500">
                  Previewing Student <span className="text-slate-900 font-black">{activePreviewIndex + 1}</span> of{" "}
                  <span className="text-slate-900 font-black">{reportCards.length}</span>:
                  <strong className="text-slate-800 ml-2">{currentStudent?.name}</strong>
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActivePreviewIndex((prev) => Math.max(0, prev - 1))}
                    disabled={activePreviewIndex === 0}
                    className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold disabled:opacity-30"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setActivePreviewIndex((prev) => Math.min(reportCards.length - 1, prev + 1))}
                    disabled={activePreviewIndex === reportCards.length - 1}
                    className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold disabled:opacity-30"
                  >
                    Next
                  </button>
                </div>
              </div>

              {/* Single Student Card Live Preview */}
              {currentStudent && (
                <div className="shadow-2xl rounded-2xl overflow-hidden bg-white border border-slate-200 transition-all">
                  <ReportCardTemplate student={currentStudent} theme={currentTheme} year={currentYear} />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Hidden Container containing ALL student cards for PDF Generation */}
        <div className="hidden">
          <div ref={printContainerRef}>
            {reportCards.map((student) => (
              <div
                key={student.id}
                className="report-card-page bg-white"
                style={{
                  width: "210mm",
                  minHeight: "297mm",
                  boxSizing: "border-box",
                  padding: "16mm 18mm",
                  pageBreakAfter: "always",
                }}
              >
                <ReportCardTemplate student={student} theme={currentTheme} year={currentYear} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Report Card Visual Layout
 */
function ReportCardTemplate({ student, theme, year }) {
  const isPassing = (student.overall_average || 0) >= 50;

  return (
    <div className="p-8 font-sans text-slate-800 relative bg-white">
      {/* Top Banner Accent */}
      <div
        className="h-3.5 w-full rounded-t-lg -mt-8 -mx-8 mb-6"
        style={{ backgroundColor: theme.primary }}
      />

      {/* Institutional Header */}
      <div className="flex items-center justify-between border-b pb-5 mb-6" style={{ borderColor: theme.border }}>
        <div className="flex items-center gap-4">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center p-1.5 shadow-md bg-white border border-slate-200 shrink-0"
          >
            <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="text-xl font-black uppercase tracking-wider text-slate-900">
              ቅድስት ኪዳነ ምሕረት ሰንበት ት/ቤት
            </h1>
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: theme.secondary }}>
              St. Kidane Mehret Sunday School &bull; Academic Report
            </p>
            <p className="text-[11px] text-slate-400 font-medium">
              Academic Year {year} &bull; Section: {student.section_name} ({student.classification})
            </p>
          </div>
        </div>

        <div className="text-right">
          <div
            className="inline-block px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest text-white shadow-sm"
            style={{ backgroundColor: theme.primary }}
          >
            Rank #{student.rank} of {student.total_students}
          </div>
          <p className="text-[11px] text-slate-400 font-bold mt-1">
            Generated: {new Date().toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Student Profile Info Box */}
      <div
        className="rounded-2xl p-5 mb-6 flex items-center justify-between border shadow-sm"
        style={{ backgroundColor: theme.light, borderColor: theme.border }}
      >
        <div className="flex items-center gap-5">
          {student.picture_url ? (
            <img
              src={student.picture_url}
              alt={student.name}
              className="w-18 h-18 rounded-2xl object-cover border-2 shadow-sm"
              style={{ borderColor: theme.primary }}
              crossOrigin="anonymous"
            />
          ) : (
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center font-black text-2xl text-white shadow-sm"
              style={{ backgroundColor: theme.primary }}
            >
              {student.name ? student.name.charAt(0).toUpperCase() : "S"}
            </div>
          )}

          <div>
            <h2 className="text-lg font-black text-slate-900">{student.name}</h2>
            {student.christian_name && (
              <p className="text-xs font-bold text-slate-600">
                Christian Name: <span className="font-extrabold">{student.christian_name}</span>
              </p>
            )}
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              ID: <span className="font-mono font-bold text-slate-700">{student.student_id}</span> &bull; Track:{" "}
              <span className="font-bold">{student.track}</span>
            </p>
          </div>
        </div>

        {/* Overall Average Display */}
        <div className="text-right pl-6 border-l" style={{ borderColor: theme.border }}>
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
            Overall Average
          </span>
          <div
            className="text-3xl font-black"
            style={{ color: theme.primary }}
          >
            {student.overall_average}%
          </div>
          <span
            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase mt-1 ${
              isPassing ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
            }`}
          >
            {isPassing ? "Passed / Promoted" : "Needs Improvement"}
          </span>
        </div>
      </div>

      {/* Academic Courses & Assessments Table */}
      <div className="mb-6">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-2">
          <BookOpen className="w-4 h-4" style={{ color: theme.primary }} />
          Course Assessments & Weighted Grades
        </h3>

        <div className="overflow-hidden rounded-xl border border-slate-200">
          <table className="w-full text-xs text-left">
            <thead>
              <tr style={{ backgroundColor: theme.primary, color: "#ffffff" }}>
                <th className="p-3 font-bold uppercase tracking-wider">Course Subject</th>
                <th className="p-3 font-bold uppercase tracking-wider text-center">Assessments & Scores</th>
                <th className="p-3 font-bold uppercase tracking-wider text-right">Weighted Final</th>
                <th className="p-3 font-bold uppercase tracking-wider text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {student.courses && student.courses.length > 0 ? (
                student.courses.map((course, idx) => {
                  const coursePass = (course.course_percentage || 0) >= 50;
                  return (
                    <tr key={course.course_id || idx} className={idx % 2 === 1 ? "bg-slate-50/50" : "bg-white"}>
                      <td className="p-3.5 font-bold text-slate-800">
                        {course.course_name}
                      </td>
                      <td className="p-3.5">
                        <div className="flex flex-wrap gap-2 justify-center">
                          {course.assessments && course.assessments.length > 0 ? (
                            course.assessments.map((a, aIdx) => (
                              <span
                                key={aIdx}
                                className="px-2 py-1 rounded-md bg-slate-100 text-slate-700 text-[11px] font-medium border border-slate-200"
                              >
                                {a.title}: <strong className="text-slate-900">{a.score}</strong>/{a.max_score}
                              </span>
                            ))
                          ) : (
                            <span className="text-slate-400 text-[11px] italic">No individual components</span>
                          )}
                        </div>
                      </td>
                      <td className="p-3.5 font-black text-right text-sm" style={{ color: theme.primary }}>
                        {course.course_percentage}%
                      </td>
                      <td className="p-3.5 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                            coursePass ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                          }`}
                        >
                          {coursePass ? "Pass" : "Fail"}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-slate-400 italic">
                    No graded courses recorded for this student in this academic period.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Signatures & Accreditation Footer */}
      <div className="pt-8 border-t border-slate-200 grid grid-cols-3 gap-6 text-center mt-8">
        <div>
          <div className="border-b border-slate-300 pb-12 mb-1"></div>
          <p className="text-[11px] font-black uppercase tracking-wider text-slate-700">Class Instructor</p>
          <p className="text-[10px] text-slate-400">Signature & Date</p>
        </div>

        <div>
          <div className="border-b border-slate-300 pb-12 mb-1"></div>
          <p className="text-[11px] font-black uppercase tracking-wider text-slate-700">Tmhrt Kfl Head</p>
          <p className="text-[10px] text-slate-400">Approved & Verified</p>
        </div>

        <div>
          <div className="border-b border-slate-300 pb-12 mb-1"></div>
          <p className="text-[11px] font-black uppercase tracking-wider text-slate-700">Official Church Seal</p>
          <p className="text-[10px] text-slate-400">Saint Mary / St. Michael Parish</p>
        </div>
      </div>
    </div>
  );
}
