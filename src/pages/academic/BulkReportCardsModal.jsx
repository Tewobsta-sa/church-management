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
import { captureElement } from "../../utils/pdfCapture";
import { toEthiopianDate } from "../../utils/ethiopianDate";
import { resultsService } from "../../services/resultsService";
import { sectionService } from "../../services/sectionService";
import { useFeedback } from "../../context/FeedbackContext";

const COLOR_PRESETS = [
  { name: "Royal Navy", primary: "#1e3a8a", secondary: "#3b82f6", light: "#eff6ff", border: "#bfdbfe" },
  { name: "Emerald", primary: "#065f46", secondary: "#10b981", light: "#ecfdf5", border: "#a7f3d0" },
  { name: "Crimson", primary: "#881337", secondary: "#e11d48", light: "#fff1f2", border: "#fecdd3" },
  { name: "Imperial Purple", primary: "#581c87", secondary: "#9333ea", light: "#faf5ff", border: "#e9d5ff" },
  { name: "Golden Amber", primary: "#78350f", secondary: "#d97706", light: "#fffbeb", border: "#fde68a" },
  { name: "Slate Onyx", primary: "#1e293b", secondary: "#475569", light: "#f8fafc", border: "#cbd5e1" },
];

export default function BulkReportCardsModal({ isOpen, onClose, initialSectionId = null }) {
  const { notify } = useFeedback();
  const [sections, setSections] = useState([]);
  const [selectedSectionId, setSelectedSectionId] = useState(initialSectionId || "");
  const [selectedTheme, setSelectedTheme] = useState(COLOR_PRESETS[0]);
  const [customPrimary, setCustomPrimary] = useState("#1e3a8a");
  const [isCustomColor, setIsCustomColor] = useState(false);

  const [loading, setLoading] = useState(false);
  const [reportCards, setReportCards] = useState([]);
  const [activePreviewIndex, setActivePreviewIndex] = useState(0);
  const [downloading, setDownloading] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState({ current: 0, total: 0 });
  // Hidden print pages mount lazily (on export/print) so opening the modal for a
  // large section doesn't render a full report card per student up front.
  const [sheetsMounted, setSheetsMounted] = useState(false);

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

  // Reset lazy-mounted print pages each time the modal reopens
  useEffect(() => {
    if (isOpen) setSheetsMounted(false);
  }, [isOpen]);

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

  // Mount the hidden print pages (if not yet) and wait for React to commit them.
  const ensureSheetsMounted = async () => {
    setSheetsMounted(true);
    for (
      let i = 0;
      i < 120 && !printContainerRef.current?.querySelector(".report-card-page");
      i++
    ) {
      await new Promise((resolve) => requestAnimationFrame(resolve));
    }
    await document.fonts?.ready;
    await new Promise((resolve) => setTimeout(resolve, 150));
  };

  const handleDownloadPDF = async () => {
    if (downloading || reportCards.length === 0) return;
    setDownloading(true);

    try {
      await ensureSheetsMounted();

      const cardElements = Array.from(
        printContainerRef.current?.querySelectorAll(".report-card-page") || []
      );

      if (cardElements.length === 0) {
        throw new Error("No report cards found to export");
      }

      setDownloadProgress({ current: 0, total: cardElements.length });

      const pdf = new jsPDF("p", "mm", "a4");
      // Large exports: slightly lower JPEG quality keeps hundreds of pages
      // fast and the PDF at a reasonable size.
      const jpegQuality = cardElements.length > 40 ? 0.9 : 0.95;

      let renderedCount = 0;

      for (let i = 0; i < cardElements.length; i++) {
        setDownloadProgress({ current: i + 1, total: cardElements.length });
        const el = cardElements[i];

        const canvas = await captureElement(el, {
          scale: 2,
          // Skip sibling report-card pages so each capture clones only the
          // current page instead of the whole stack (critical for 100+ cards).
          ignoreElements: (node) =>
            node.nodeType === 1 &&
            node.classList?.contains("report-card-page") &&
            node !== el,
        });

        if (!canvas.width || !canvas.height) {
          throw new Error(`Report card ${i + 1} captured as empty canvas`);
        }

        const imgData = canvas.toDataURL("image/jpeg", jpegQuality);
        const pdfWidth = 210; // A4 width in mm
        const pdfHeight = Math.min(297, (canvas.height * pdfWidth) / canvas.width);

        if (renderedCount > 0) {
          pdf.addPage();
        }

        pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, pdfHeight);
        renderedCount += 1;
      }

      const sectionNameClean = (selectedSection?.name || "Section").replace(/[^a-zA-Z0-9]/g, "_");
      pdf.save(`${sectionNameClean}_Report_Cards_${currentYear}.pdf`);
    } catch (err) {
      console.error("Failed to generate PDF", err);
      notify("An error occurred while generating the PDF. Try printing directly.", "error");
    } finally {
      setDownloading(false);
      setDownloadProgress({ current: 0, total: 0 });
    }
  };

  const handlePrint = async () => {
    setPrinting(true);
    try {
      await ensureSheetsMounted();
      window.print();
    } finally {
      setPrinting(false);
    }
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
                ? downloadProgress.total === 0
                  ? "Preparing pages..."
                  : `Exporting ${downloadProgress.current}/${downloadProgress.total}...`
                : `Download All PDFs (${reportCards.length})`}
            </button>

            <button
              onClick={handlePrint}
              disabled={reportCards.length === 0 || printing}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50"
            >
              <Printer className="w-4 h-4" />
              {printing ? "Preparing..." : "Print"}
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
              className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none hover:border-brand-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all shadow-xs"
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

              {/* Single Student Card Live Preview (front + back) */}
              {currentStudent && (
                <div className="space-y-6">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">
                    Front Side
                  </p>
                  <div className="shadow-2xl rounded-2xl overflow-hidden bg-white border border-slate-200 transition-all">
                    <ReportCardFront student={currentStudent} theme={currentTheme} />
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">
                    Back Side
                  </p>
                  <div className="shadow-2xl rounded-2xl overflow-hidden bg-white border border-slate-200 transition-all">
                    <ReportCardBack student={currentStudent} theme={currentTheme} />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Off-screen print layout parked at left:-10000px so it never paints
            over the translucent modal backdrop (negative z-index would still
            show through it). html2canvas renders the element's own bounds, so
            the off-screen position does not affect capture. */}
        <div
          aria-hidden="true"
          style={{
            position: "fixed",
            left: "-10000px",
            top: 0,
            width: "210mm",
            pointerEvents: "none",
            backgroundColor: "#ffffff",
          }}
        >
          <div ref={printContainerRef}>
            {sheetsMounted && reportCards.map((student) => (
              <div key={student.id}>
                <div
                  className="report-card-page bg-white"
                  style={{
                    width: "210mm",
                    minHeight: "297mm",
                    boxSizing: "border-box",
                    padding: "12mm 14mm",
                    pageBreakAfter: "always",
                    backgroundColor: "#ffffff",
                  }}
                >
                  <ReportCardFront student={student} theme={currentTheme} />
                </div>
                <div
                  className="report-card-page bg-white"
                  style={{
                    width: "210mm",
                    minHeight: "297mm",
                    boxSizing: "border-box",
                    padding: "12mm 14mm",
                    pageBreakAfter: "always",
                    backgroundColor: "#ffffff",
                  }}
                >
                  <ReportCardBack student={student} theme={currentTheme} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const ETHIOPIC_FONT =
  '"Noto Sans Ethiopic","Nyala","Ebrima","Abyssinica SIL",serif';

const GRADE_SCALE = [
  ["ከ100 እስከ 85", "እጅግ በጣም ጥሩ"],
  ["ከ84 እስከ 75", "በጣም ጥሩ"],
  ["ከ74 እስከ 65", "ደህና"],
  ["ከ64 እስከ 50", "መካከለኛ"],
  ["ከ49 በታች", "ዝቅተኛ"],
];

const CARD_NOTES = [
  "ይህ የትምህርት ውጤት መግለጫ ካርድ በዓመት አንዴ በትምህርት ማብቂያ ላይ ለተማሪው/ዋ ይሰጣል።",
  "ይህ የትምህርት ውጤት መግለጫ ካርድ የደብሩ አስተዳዳሪ ፊርማና ማኅተም፣ የሰንበት ትምህርት ቤት ልዑክ መንበር ፊርማ እንዲሁም የትምህርት ክፍል ተጠሪው ፊርማ ከሌለበት ዋጋ አይኖረውም።",
];

const underlinedValue = (value, minWidth = 120) => (
  <span
    style={{
      display: "inline-block",
      minWidth,
      borderBottom: "1px solid #334155",
      paddingBottom: 2,
      textAlign: "center",
      fontWeight: 700,
    }}
  >
    {value || " "}
  </span>
);

/**
 * FRONT — cover page: church header, school name, verse, student info fields.
 */
function ReportCardFront({ student, theme }) {
  const ethYear = toEthiopianDate().year;
  const frame = { border: `3px solid ${theme.primary}`, borderRadius: 4 };

  return (
    <div
      style={{
        ...frame,
        minHeight: "100%",
        padding: "26px 34px",
        fontFamily: ETHIOPIC_FONT,
        color: "#111",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#fff",
      }}
    >
      {/* Cross + church hierarchy */}
      <div style={{ textAlign: "center", fontWeight: 800, fontSize: 14, lineHeight: 1.9 }}>
        <div style={{ fontSize: 26, lineHeight: 1 }}>✝</div>
        <div>በኢትዮጵያ ኦርቶዶክስ ተዋሕዶ ቤተ ክርስቲያን</div>
        <div>የሰ/ት/ቤቶች ማደራጃ መምሪያ ሰ/ት/ቤቶች አንድነት</div>
        <div>የአዲስ አበባ ሀገረ ስብከት</div>
        <div style={{ fontSize: 16 }}>የጃቴ ኪዳነ ምሕረት ፍኖተ ሰማዕታት ሰ/ት/ቤት</div>
      </div>

      {/* Logo */}
      <div style={{ display: "flex", justifyContent: "center", margin: "22px 0" }}>
        <img
          src="/logo.png"
          alt="School seal"
          style={{ width: 150, height: 150, objectFit: "contain" }}
          crossOrigin="anonymous"
        />
      </div>

      {/* Verse */}
      <div style={{ textAlign: "center", fontWeight: 700, fontSize: 13, lineHeight: 1.8, marginBottom: 26 }}>
        <div>
          «እንደ ቤተመጽሐፍትና በተረዳህበት ነገር ጸንተህ ኑር፤ ከማን እንደ ተማርክም ታውቃለህና፤»
        </div>
        <div style={{ fontSize: 12 }}>2ኛ ጢሞ 3፡14</div>
      </div>

      {/* Card title */}
      <div
        style={{
          textAlign: "center",
          fontWeight: 900,
          fontSize: 17,
          marginBottom: 26,
          letterSpacing: 0.5,
        }}
      >
        የትምህርት ውጤት መግለጫ
      </div>

      {/* Student info fields */}
      <div style={{ fontSize: 13, fontWeight: 700, lineHeight: 3.1, padding: "0 8px" }}>
        <div>የተማሪው/ዋ ስም ከነ አያት {underlinedValue(student.name, 260)}</div>
        <div>የክርስትና ስም {underlinedValue(student.christian_name, 320)}</div>
        <div>
          ትምህርት የተከታተለበት አጠባበብ{" "}
          {underlinedValue(
            [student.track, student.classification].filter(Boolean).join(" • "),
            210,
          )}
        </div>
        <div>
          አድራሻ {underlinedValue(null, 110)} ከተማ {underlinedValue(null, 90)} ቀበሌ{" "}
          {underlinedValue(null, 90)}
        </div>
        <div>
          የትምህርት ዘመን {underlinedValue(`${ethYear} ዓ.ም.`, 110)} ክፍል ደረጃ{" "}
          {underlinedValue(student.section_name, 140)} መለያ ቁጥር{" "}
          {underlinedValue(student.student_id, 110)}
        </div>
      </div>
    </div>
  );
}

/**
 * BACK — marks table, grading scale, notes, photo box, signatures & seal.
 */
function ReportCardBack({ student, theme }) {
  const frame = { border: `3px solid ${theme.primary}`, borderRadius: 4 };
  const cell = {
    border: "1.5px solid #000",
    padding: "7px 9px",
    fontSize: 12,
    fontWeight: 700,
  };

  return (
    <div
      style={{
        ...frame,
        minHeight: "100%",
        padding: "22px 26px",
        fontFamily: ETHIOPIC_FONT,
        color: "#111",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#fff",
      }}
    >
      {/* Photo box + verse */}
      <div style={{ display: "flex", justifyContent: "space-between", gap: 20, marginBottom: 18 }}>
        <div style={{ flex: 1, alignSelf: "center", textAlign: "center", fontWeight: 700, fontSize: 13, lineHeight: 1.9 }}>
          <div>
            «መልካም ሥራችሁን አይተው በሰማያት ያለውን አባታችሁን እንዲያመሰግኑ፤ ብርሃናችሁ በሰዎች ፊት ይብራ።»
          </div>
          <div style={{ fontSize: 12, marginTop: 4 }}>የማቴዎስ 5፡16</div>
        </div>
        <div
          style={{
            width: 120,
            height: 140,
            borderRadius: 8,
            backgroundColor: "#4b5563",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            fontWeight: 800,
            fontSize: 12,
            overflow: "hidden",
            flexShrink: 0,
          }}
        >
          {student.picture_url ? (
            <img
              src={student.picture_url}
              alt={student.name}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
              crossOrigin="anonymous"
            />
          ) : (
            <span>የተማሪው<br />ፎቶ ግራፍ</span>
          )}
        </div>
      </div>

      {/* Marks table */}
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 20 }}>
        <thead>
          <tr>
            <th style={{ ...cell, textAlign: "left", width: "34%" }}>የትምህረት ዓይነት</th>
            <th style={{ ...cell, textAlign: "center", width: "44%" }}>ምዘና ውጤቶች</th>
            <th style={{ ...cell, textAlign: "center" }}>አማካይ ውጤት</th>
          </tr>
        </thead>
        <tbody>
          {student.courses && student.courses.length > 0 ? (
            student.courses.map((course, idx) => (
              <tr key={course.course_id || idx}>
                <td style={cell}>{course.course_name}</td>
                <td style={{ ...cell, textAlign: "center", fontWeight: 600 }}>
                  {course.assessments && course.assessments.length > 0
                    ? course.assessments
                        .map((a) => `${a.title}: ${a.score}/${a.max_score}`)
                        .join("  •  ")
                    : "—"}
                </td>
                <td style={{ ...cell, textAlign: "center" }}>
                  {course.course_percentage}%
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={3} style={{ ...cell, textAlign: "center", color: "#64748b" }}>
                የተመዘገቡ ውጤቶች የሉም
              </td>
            </tr>
          )}
          {/* Summary rows */}
          <tr>
            <td style={cell}>አማካይ ውጤት</td>
            <td style={{ ...cell, textAlign: "center" }} colSpan={2}>
              {student.overall_average ?? "—"}%
            </td>
          </tr>
          <tr>
            <td style={cell}>ፀባይ</td>
            <td style={cell} colSpan={2}>&nbsp;</td>
          </tr>
          <tr>
            <td style={cell}>ደረጃ</td>
            <td style={{ ...cell, textAlign: "center" }} colSpan={2}>
              {student.rank ? `${student.rank} / ${student.total_students}` : "—"}
            </td>
          </tr>
        </tbody>
      </table>

      {/* Grading scale + notes */}
      <div style={{ display: "flex", gap: 22, marginBottom: "auto" }}>
        <div style={{ width: "42%", fontSize: 11.5, fontWeight: 700 }}>
          <div style={{ marginBottom: 6, fontSize: 12.5, fontWeight: 900 }}>የነጥብ አያያዝ</div>
          {GRADE_SCALE.map(([range, label]) => (
            <div key={range} style={{ lineHeight: 1.9 }}>
              {range} {label}
            </div>
          ))}
        </div>
        <div style={{ flex: 1, fontSize: 11.5, fontWeight: 600, lineHeight: 2 }}>
          <div style={{ marginBottom: 6, fontSize: 12.5, fontWeight: 900 }}>ማስብብያ</div>
          {CARD_NOTES.map((note, i) => (
            <div key={i} style={{ display: "flex", gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 14, lineHeight: 1.4 }}>●</span>
              <span>{note}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Signatures */}
      <div style={{ display: "flex", justifyContent: "space-between", gap: 30, marginTop: 30 }}>
        <div style={{ flex: 1, textAlign: "center", fontSize: 11.5, fontWeight: 700 }}>
          <div style={{ borderTop: "1.5px solid #000", paddingTop: 6 }}>
            የሰንበት ትምህርት ቤት ልዑክ መንበር<br />ስምና ፊርማ
          </div>
        </div>
        <div style={{ flex: 1, textAlign: "center", fontSize: 11.5, fontWeight: 700 }}>
          <div style={{ borderTop: "1.5px solid #000", paddingTop: 6 }}>
            የሰንበት ትምህርት ቤት ትምህርት ክፍል<br />ተጠሪ
          </div>
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 30, marginTop: 26 }}>
        <div style={{ flex: 1, textAlign: "center", fontSize: 11.5, fontWeight: 700 }}>
          <div style={{ borderTop: "1.5px solid #000", paddingTop: 6 }}>
            የደብሩ አስተዳዳሪ ስምና ፊርማ
          </div>
        </div>
        <div style={{ flex: 1, textAlign: "center", fontSize: 11.5, fontWeight: 700 }}>
          <div style={{ borderTop: "1.5px solid #000", paddingTop: 6 }}>
            የደብሩ ማኅተም
          </div>
        </div>
      </div>
    </div>
  );
}
