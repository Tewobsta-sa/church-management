import { useState, useRef, useEffect } from "react";
import { X, Download, Printer, QrCode, Moon } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import jsPDF from "jspdf";
import { captureElement } from "../../utils/pdfCapture";
import { useFeedback } from "../../context/FeedbackContext";

const PREVIEW_BATCH = 45;
// Large exports: lower raster scale + JPEG quality keep hundreds of pages fast
// and the resulting PDF at a reasonable size, with no visible quality loss.
const LARGE_PAGE_COUNT = 20;

export default function IdCardExportModal({ isOpen, onClose, students = [] }) {
  const { notify } = useFeedback();
  const [downloading, setDownloading] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState({ current: 0, total: 0 });
  // Hidden A4 sheets mount lazily (on export/print) so opening the modal with
  // hundreds of students doesn't render N extra QR codes + photos up front.
  const [sheetsMounted, setSheetsMounted] = useState(false);
  // Visible preview renders in batches for the same reason.
  const [previewLimit, setPreviewLimit] = useState(PREVIEW_BATCH);
  const containerRef = useRef(null);
  const exportPagesRef = useRef(null);

  useEffect(() => {
    setPreviewLimit(PREVIEW_BATCH);
    setSheetsMounted(false);
  }, [students, isOpen]);

  // Group students in chunks of 9 for exact 9 IDs per A4 page
  const chunkedPages = students.reduce((acc, st, i) => {
    const pageIndex = Math.floor(i / 9);
    if (!acc[pageIndex]) acc[pageIndex] = [];
    acc[pageIndex].push(st);
    return acc;
  }, []);

  if (!isOpen || students.length === 0) return null;

  // Color & category mapping according to requirement:
  // Htsanat -> Emerald Green
  // Maekelawyan -> Royal Blue
  // Wetatoch -> Cathedral Crimson
  // PreKG -> Golden Amber
  // Distance -> Teal / Slate
  const getCardTheme = (st) => {
    const track = (st.track || "").toLowerCase();
    const classification = (st.classification || "").toLowerCase();
    const progName = (st.section?.programType?.name || "").toLowerCase();
    const secName = (st.section?.name || st.section_name || "").toLowerCase();

    if (track === "prekg" || progName.includes("pre") || classification.includes("pre")) {
      return {
        headerGradient: "from-amber-600 via-amber-700 to-amber-900",
        borderClass: "border-amber-400/80 shadow-amber-900/10",
        badgeBg: "bg-amber-100 text-amber-900 border-amber-300",
        categoryTitleAm: "ቅድመ ሕፃናት",
        categoryTitleEn: "Pre-KG Program",
        accentColor: "#d97706",
      };
    }

    if (classification === "htsanat" || secName.includes("ሕፃናት") || progName.includes("htsanat")) {
      return {
        headerGradient: "from-emerald-700 via-emerald-800 to-emerald-950",
        borderClass: "border-emerald-500/80 shadow-emerald-900/10",
        badgeBg: "bg-emerald-100 text-emerald-900 border-emerald-300",
        categoryTitleAm: "ሕፃናት (1-4)",
        categoryTitleEn: "Htsanat (Grades 1-4)",
        accentColor: "#059669",
      };
    }

    if (classification === "maekelawyan" || secName.includes("ማዕከላውያን") || progName.includes("maekelawyan")) {
      return {
        headerGradient: "from-blue-700 via-blue-800 to-indigo-950",
        borderClass: "border-blue-500/80 shadow-blue-900/10",
        badgeBg: "bg-blue-100 text-blue-900 border-blue-300",
        categoryTitleAm: "ማዕከላውያን (5-8)",
        categoryTitleEn: "Maekelawyan (Grades 5-8)",
        accentColor: "#2563eb",
      };
    }

    if (classification === "wetatoch" || secName.includes("ወጣቶች") || progName.includes("wetatoch")) {
      return {
        headerGradient: "from-rose-800 via-rose-900 to-slate-950",
        borderClass: "border-rose-500/80 shadow-rose-900/10",
        badgeBg: "bg-rose-100 text-rose-900 border-rose-300",
        categoryTitleAm: "ወጣቶች (9-12)",
        categoryTitleEn: "Wetatoch (Grades 9-12)",
        accentColor: "#e11d48",
      };
    }

    if (track === "distance" || progName.includes("distance") || progName.includes("የርቀት")) {
      return {
        headerGradient: "from-teal-700 via-teal-800 to-slate-950",
        borderClass: "border-teal-500/80 shadow-teal-900/10",
        badgeBg: "bg-teal-100 text-teal-900 border-teal-300",
        categoryTitleAm: "የርቀት ትምህርት",
        categoryTitleEn: "Distance Learning",
        accentColor: "#0d9488",
      };
    }

    // Default regular
    return {
      headerGradient: "from-brand-900 via-brand-950 to-slate-950",
      borderClass: "border-brand-500/80 shadow-brand-900/10",
      badgeBg: "bg-amber-100 text-brand-950 border-amber-300",
      categoryTitleAm: "መደበኛ",
      categoryTitleEn: "Regular Student",
      accentColor: "#854d0e",
    };
  };

  // Mount the hidden A4 sheets (if not yet) and wait for React to commit them.
  const ensureSheetsMounted = async () => {
    setSheetsMounted(true);
    for (
      let i = 0;
      i < 120 && !exportPagesRef.current?.querySelector(".id-card-a4-sheet");
      i++
    ) {
      await new Promise((resolve) => requestAnimationFrame(resolve));
    }
    await document.fonts?.ready;
    await new Promise((resolve) => setTimeout(resolve, 150));
  };

  const handleDownloadPDF = async () => {
    if (downloading || chunkedPages.length === 0) return;
    setDownloading(true);

    try {
      await ensureSheetsMounted();

      const pageElements = Array.from(
        exportPagesRef.current?.querySelectorAll(".id-card-a4-sheet") || []
      );

      if (pageElements.length === 0) {
        throw new Error("No ID card pages found to export");
      }

      setDownloadProgress({ current: 0, total: pageElements.length });

      // A4 Landscape (297mm x 210mm) — cards are wider than tall
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
        compress: true,
      });

      const large = pageElements.length > LARGE_PAGE_COUNT;
      const scale = large ? 2 : 2.5;
      const jpegQuality = large ? 0.9 : 0.95;

      for (let p = 0; p < pageElements.length; p++) {
        setDownloadProgress({ current: p + 1, total: pageElements.length });
        const sheetEl = pageElements[p];

        const canvas = await captureElement(sheetEl, {
          scale,
          scrollX: 0,
          scrollY: 0,
          // Skip the preview grid and all sibling sheets so each capture clones
          // only ~9 cards instead of the whole document (critical for 100+ pages).
          ignoreElements: (node) =>
            node.nodeType === 1 &&
            (node.id === "id-cards-print-section" ||
              (node.classList?.contains("id-card-a4-sheet") &&
                node !== sheetEl)),
        });

        if (!canvas.width || !canvas.height) {
          throw new Error(`ID card page ${p + 1} captured as empty canvas`);
        }

        const imgData = canvas.toDataURL("image/jpeg", jpegQuality);

        if (p > 0) {
          pdf.addPage();
        }

        pdf.addImage(imgData, "JPEG", 0, 0, 297, 210);
      }

      pdf.save(`Sunday_School_ID_Cards_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (err) {
      console.error("Failed to generate PDF", err);
      notify("Failed to export ID cards PDF. Please try printing directly.", "error");
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

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-6 animate-[fade-in_0.2s_ease-out]">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl max-h-[94vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80 gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-brand-50 text-brand-700">
                <QrCode className="w-5 h-5 text-brand-600" />
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                የተማሪዎች መታወቂያ ካርድ ማተሚያ (ID Card Center)
              </h2>
            </div>
            <p className="text-xs font-semibold text-slate-500 mt-1">
              በአንድ A4 ገፅ በትክክል 9 መታወቂያዎች (3x3 grid) • በደረጃ የተከፋፈሉ ቀለማትና የማታ ፈረቃ ምልክቶች
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-end sm:self-auto">
            <button
              onClick={handleDownloadPDF}
              disabled={downloading}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-brand-700 to-brand-600 hover:from-brand-600 hover:to-brand-500 text-white rounded-xl font-bold shadow-md shadow-brand-700/20 transition-all text-xs uppercase tracking-wider disabled:opacity-50"
            >
              {downloading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              {downloading
                ? downloadProgress.total === 0
                  ? "ፒዲኤፍ እየተዘጋጀ ነው (preparing pages)..."
                  : `ፒዲኤፍ እየተዘጋጀ ነው (${downloadProgress.current}/${downloadProgress.total})...`
                : "Download PDF (9 per A4)"}
            </button>

            <button
              onClick={handlePrint}
              disabled={printing}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50"
            >
              <Printer className="w-4 h-4" />
              {printing ? "Preparing..." : "Print"}
            </button>

            <button
              onClick={onClose}
              className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Print Stylesheet: prints the exact A4 landscape export sheets (same size for 1 or 9 IDs) */}
        <style>{`
          @media print {
            @page {
              size: A4 landscape;
              margin: 0;
            }
            body * {
              visibility: hidden !important;
            }
            #id-cards-a4-section,
            #id-cards-a4-section * {
              visibility: visible !important;
            }
            #id-cards-a4-section {
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 297mm !important;
              margin: 0 !important;
              padding: 0 !important;
              background: #ffffff !important;
              z-index: 9999 !important;
            }
            .id-card-a4-sheet {
              page-break-after: always !important;
              break-after: page !important;
            }
            .id-card-a4-sheet:last-child {
              page-break-after: auto !important;
              break-after: auto !important;
            }
          }
        `}</style>

        {/* ID Cards Preview Container */}
        <div
          id="id-cards-print-section"
          className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-slate-100/70"
        >
          <div
            ref={containerRef}
            className="id-card-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto"
          >
            {students.slice(0, previewLimit).map((st) => (
              <IdCardItem
                key={st.id}
                st={st}
                theme={getCardTheme(st)}
                isExportMode={false}
              />
            ))}
          </div>
          {previewLimit < students.length && (
            <div className="flex justify-center mt-4">
              <button
                onClick={() =>
                  setPreviewLimit((c) =>
                    Math.min(c + PREVIEW_BATCH, students.length)
                  )
                }
                className="px-5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl font-bold text-xs uppercase tracking-wider shadow-sm transition-all"
              >
                Show more ({students.length - previewLimit} remaining — all{" "}
                {students.length} are included in the export)
              </button>
            </div>
          )}
        </div>

        {/* Off-screen A4 landscape pages: 9 wide IDs per page for PDF export and browser print.
            Parked at left:-10000px — negative z-index still paints over the translucent
            modal backdrop, so position it off-screen instead. The @media print rule
            below re-pins it to left:0 for printing. */}
        <div
          id="id-cards-a4-section"
          aria-hidden="true"
          style={{
            position: "fixed",
            left: "-10000px",
            top: 0,
            width: "297mm",
            pointerEvents: "none",
            backgroundColor: "#ffffff",
          }}
        >
          <div ref={exportPagesRef}>
            {sheetsMounted && chunkedPages.map((pageStudents, pIdx) => (
              <div
                key={pIdx}
                className="id-card-a4-sheet bg-white"
                style={{
                  width: "297mm",
                  height: "210mm",
                  boxSizing: "border-box",
                  padding: "10mm 12mm",
                  backgroundColor: "#ffffff",
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 88mm)",
                  gridTemplateRows: "repeat(3, 58mm)",
                  columnGap: "4mm",
                  rowGap: "6mm",
                  justifyContent: "center",
                  alignContent: "center",
                }}
              >
                {pageStudents.map((st) => (
                  <IdCardItem
                    key={st.id}
                    st={st}
                    theme={getCardTheme(st)}
                    isExportMode={true}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-white border-t border-slate-100 flex justify-between items-center text-xs text-slate-500 font-medium">
          <span>
            Showing <strong className="text-slate-800">{students.length}</strong> selected student ID card(s) across <strong className="text-slate-800">{chunkedPages.length}</strong> page(s) (9 IDs per page).
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 font-bold text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors"
          >
            Close (ዝጋ)
          </button>
        </div>
      </div>
    </div>
  );
}

function IdCardItem({ st, theme, isExportMode = false }) {
  const isNight = Boolean(st.is_night);
  const [imgFailed, setImgFailed] = useState(false);

  const qrValue = JSON.stringify({
    id: st.id,
    sid: st.student_id,
    name: st.name,
    class: st.section?.name || st.section_name,
    night: isNight ? 1 : 0,
    cat: theme.categoryTitleAm,
  });

  return (
    <div
      className={`id-card-item bg-white rounded-xl shadow-sm border-2 ${theme.borderClass} overflow-hidden flex flex-col relative select-none`}
      style={
        isExportMode
          ? { width: "88mm", height: "58mm", margin: "0 auto", boxSizing: "border-box" }
          : { width: "340px", height: "220px", margin: "0 auto" }
      }
    >
      {/* Top Banner */}
      <div
        className={`bg-gradient-to-r ${theme.headerGradient} text-white ${
          isExportMode ? "px-2 py-1" : "px-3 py-1.5"
        } flex items-center justify-between border-b border-white/20`}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <div
            className={`${
              isExportMode ? "w-5 h-5 rounded" : "w-6 h-6 rounded-lg"
            } bg-white p-0.5 flex items-center justify-center shadow-sm shrink-0`}
          >
            <img
              src="/logo.png"
              alt="Logo"
              className="w-full h-full object-contain"
              onError={(e) => {
                e.target.style.display = "none";
              }}
            />
          </div>
          <div className="min-w-0">
            <h4
              className={`${
                isExportMode ? "text-[8px]" : "text-[10px]"
              } font-black tracking-wide uppercase leading-tight truncate text-white`}
            >
              ጃቴ ቅ/ኪዳነ ምሕረት ፍ/ሰ/ሰ/ት/ቤት
            </h4>
            <p
              className={`${
                isExportMode ? "text-[6px]" : "text-[7px]"
              } font-bold text-amber-200 uppercase tracking-wider leading-none truncate`}
            >
              Jate Kidane Mehret Fnote Semaetat S.S.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {isNight && (
            <span
              className={`${
                isExportMode ? "text-[6.5px] px-1" : "text-[8px] px-1.5"
              } py-0.5 rounded bg-amber-400 text-slate-950 font-black flex items-center gap-0.5 shadow-sm`}
            >
              <Moon className={isExportMode ? "w-2 h-2 fill-slate-950" : "w-2.5 h-2.5 fill-slate-950"} />
              ማታ
            </span>
          )}
          <span
            className={`${
              isExportMode ? "text-[6.5px] px-1" : "text-[8px] px-1.5"
            } font-extrabold py-0.5 rounded border ${theme.badgeBg}`}
          >
            {theme.categoryTitleAm}
          </span>
        </div>
      </div>

      {/* Card Main Body */}
      <div className={`flex-1 ${isExportMode ? "p-2 gap-2" : "p-3 gap-3"} flex items-center bg-white`}>
        {/* Photo & Student ID */}
        <div className="shrink-0 flex flex-col items-center">
          {st.picture_url && !imgFailed ? (
            <img
              src={st.picture_url}
              alt={st.name}
              loading={isExportMode ? "eager" : "lazy"}
              className={`${
                isExportMode ? "rounded-lg" : "rounded-xl"
              } object-cover border border-slate-300 shadow-sm`}
              style={
                isExportMode
                  ? { width: "18mm", height: "23mm" }
                  : { width: "70px", height: "86px" }
              }
              crossOrigin="anonymous"
              referrerPolicy="no-referrer"
              onError={() => setImgFailed(true)}
            />
          ) : (
            <div
              className={`${
                isExportMode ? "rounded-lg text-sm" : "rounded-xl text-xl"
              } bg-slate-100 border border-slate-300 flex flex-col items-center justify-center text-slate-400 font-black shadow-inner`}
              style={
                isExportMode
                  ? { width: "18mm", height: "23mm" }
                  : { width: "70px", height: "86px" }
              }
            >
              {st.name?.charAt(0) || "S"}
            </div>
          )}
          <span
            className={`${
              isExportMode ? "text-[7px]" : "text-[8.5px]"
            } font-black text-slate-900 tracking-wider uppercase mt-1 truncate max-w-[18mm]`}
          >
            {st.student_id}
          </span>
        </div>

        {/* Details Column */}
        <div className="flex-1 min-w-0 space-y-0.5">
          <div>
            <h3
              className={`${
                isExportMode ? "text-[8.5px]" : "text-xs"
              } font-black text-slate-900 leading-snug truncate`}
            >
              {st.name}
            </h3>
            {st.christian_name && (
              <p
                className={`${
                  isExportMode ? "text-[7px]" : "text-[9.5px]"
                } font-bold text-brand-700 truncate`}
              >
                {st.christian_name}
              </p>
            )}
          </div>

          <div
            className={`pt-1 border-t border-slate-100 ${
              isExportMode ? "text-[6.5px]" : "text-[9px]"
            } space-y-0.5 text-slate-600`}
          >
            <p className="truncate">
              <span className="font-bold text-slate-400 uppercase text-[6px] mr-1">ክፍል:</span>
              <span className="font-bold text-slate-800">
                {st.section?.name || st.section_name || "Unassigned"}
              </span>
            </p>
            <p className="truncate">
              <span className="font-bold text-slate-400 uppercase text-[6px] mr-1">አድራሻ:</span>
              <span>
                {st.address?.subcity
                  ? `${st.address.subcity}, W.${st.address.woreda || ""}`
                  : "Addis Ababa"}
              </span>
            </p>
            <p className="truncate">
              <span className="font-bold text-slate-400 uppercase text-[6px] mr-1">ስልክ:</span>
              <span>{st.family_guardian_phone || st.phone_number || "N/A"}</span>
            </p>
          </div>
        </div>

        {/* QR Code */}
        <div className="shrink-0 flex flex-col items-center bg-slate-50 p-1 rounded-xl border border-slate-200">
          <QRCodeCanvas value={qrValue} size={isExportMode ? 42 : 54} level="M" />
          <span
            className={`${
              isExportMode ? "text-[5.5px]" : "text-[6.5px]"
            } font-black text-slate-400 uppercase mt-0.5 tracking-wider`}
          >
            SCAN ME
          </span>
        </div>
      </div>

      {/* Card Bottom Strip */}
      <div
        className={`bg-slate-50 ${
          isExportMode ? "px-2 py-0.5 text-[6px]" : "px-3 py-1 text-[7.5px]"
        } border-t border-slate-100 flex justify-between items-center text-slate-400 font-bold uppercase`}
      >
        <span className="truncate">ፍኖተ ሰማዕታት ሰንበት ት/ቤት</span>
        <span className="shrink-0 text-slate-500">2018 E.C.</span>
      </div>
    </div>
  );
}
