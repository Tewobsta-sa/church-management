import { useState, useRef } from "react";
import { X, Download, Printer, QrCode, Shield, Check } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export default function IdCardExportModal({ isOpen, onClose, students = [] }) {
  const [downloading, setDownloading] = useState(false);
  const containerRef = useRef(null);

  if (!isOpen || students.length === 0) return null;

  const handleDownloadPDF = async () => {
    if (!containerRef.current) return;
    setDownloading(true);

    try {
      const pdf = new jsPDF("p", "mm", "a4");
      const cardElements = containerRef.current.querySelectorAll(".id-card-item");

      for (let i = 0; i < cardElements.length; i++) {
        const el = cardElements[i];
        const canvas = await html2canvas(el, {
          scale: 3,
          useCORS: true,
          logging: false,
        });

        const imgData = canvas.toDataURL("image/png");
        const pdfWidth = 85.6; // standard credit card / ID card width in mm
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

        // Arrange on A4 (e.g. 2 columns x 4 rows per page)
        const col = i % 2;
        const row = Math.floor((i % 8) / 2);

        if (i > 0 && i % 8 === 0) {
          pdf.addPage();
        }

        const x = 15 + col * (pdfWidth + 10);
        const y = 15 + row * (pdfHeight + 10);

        pdf.addImage(imgData, "PNG", x, y, pdfWidth, pdfHeight);
      }

      pdf.save(`student_id_cards_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (err) {
      console.error("Failed to generate PDF", err);
      alert("Failed to export ID cards PDF. Please try printing directly.");
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-[fade-in_0.2s_ease-out]">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
              <QrCode className="w-6 h-6 text-brand-600" />
              Student Identification Cards ({students.length})
            </h2>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">
              Printable badges formatted for standard ID card printing
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleDownloadPDF}
              disabled={downloading}
              className="flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold shadow-lg shadow-brand-500/20 transition-all text-xs uppercase tracking-wider disabled:opacity-50"
            >
              {downloading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              {downloading ? "Generating PDF..." : "Download PDF"}
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs uppercase tracking-wider transition-all"
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

        {/* ID Cards Preview Container */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-slate-100/60">
          <div
            ref={containerRef}
            className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto"
          >
            {students.map((st) => {
              const qrValue = JSON.stringify({
                id: st.id,
                sid: st.student_id,
                name: st.name,
                class: st.section?.name || st.section_name,
                addr: st.address?.subcity ? `${st.address.subcity}, Woreda ${st.address.woreda || st.address.district || ""}` : "",
              });

              return (
                <div
                  key={st.id}
                  className="id-card-item bg-white rounded-2xl shadow-md border-2 border-brand-200 overflow-hidden flex flex-col relative w-full h-[220px] transition-transform select-none"
                  style={{ width: "350px", height: "220px", margin: "0 auto" }}
                >
                  {/* Top Brand Banner */}
                  <div className="bg-gradient-to-r from-brand-900 via-brand-800 to-brand-950 text-white px-3.5 py-2 flex items-center justify-between border-b border-amber-400/30">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-white p-0.5 flex items-center justify-center shadow-sm shrink-0">
                        <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
                      </div>
                      <div>
                        <h4 className="text-[11px] font-black tracking-wide uppercase leading-tight text-white">
                          ቅድስት ኪዳነ ምሕረት ሰ/ት/ቤት
                        </h4>
                        <p className="text-[7.5px] font-bold text-amber-300 uppercase tracking-widest leading-none">
                          St. Kidane Mehret Sunday School &bull; ID Card
                        </p>
                      </div>
                    </div>
                    <span className="text-[9px] font-extrabold px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30">
                      {st.section?.programType?.name || st.track || "Regular"}
                    </span>
                  </div>

                  {/* Card Main Body */}
                  <div className="flex-1 p-3.5 flex gap-3.5 items-center">
                    {/* Photo */}
                    <div className="shrink-0 flex flex-col items-center">
                      {st.picture_url ? (
                        <img
                          src={st.picture_url}
                          alt={st.name}
                          className="w-20 h-24 object-cover rounded-xl border-2 border-brand-500 shadow-sm"
                        />
                      ) : (
                        <div className="w-20 h-24 rounded-xl bg-slate-100 border-2 border-slate-300 flex flex-col items-center justify-center text-slate-400 font-black text-xl">
                          {st.name?.charAt(0) || "S"}
                        </div>
                      )}
                      <span className="text-[8px] font-black text-brand-700 uppercase mt-1">
                        {st.student_id}
                      </span>
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div>
                        <h3 className="text-sm font-black text-slate-900 leading-snug truncate">
                          {st.name}
                        </h3>
                        {st.christian_name && (
                          <p className="text-[10px] font-bold text-brand-600 truncate">
                            {st.christian_name}
                          </p>
                        )}
                      </div>

                      <div className="pt-0.5 border-t border-slate-100 text-[10px] space-y-0.5 text-slate-600">
                        <p>
                          <span className="font-bold text-slate-400 uppercase text-[8px] mr-1">
                            Class:
                          </span>
                          <span className="font-bold text-slate-800">
                            {st.section?.name || st.section_name || "Unassigned"}
                          </span>
                        </p>
                        <p className="truncate">
                          <span className="font-bold text-slate-400 uppercase text-[8px] mr-1">
                            Address:
                          </span>
                          <span>
                            {st.address?.subcity ? `${st.address.subcity}, W.${st.address.woreda || st.address.district || ""}` : "Addis Ababa"}
                          </span>
                        </p>
                        <p>
                          <span className="font-bold text-slate-400 uppercase text-[8px] mr-1">
                            Contact:
                          </span>
                          <span>
                            {st.family_guardian_phone || st.phone_number || "N/A"}
                          </span>
                        </p>
                      </div>
                    </div>

                    {/* QR Code */}
                    <div className="shrink-0 flex flex-col items-center bg-slate-50 p-1.5 rounded-xl border border-slate-200">
                      <QRCodeSVG value={qrValue} size={60} level="M" />
                      <span className="text-[7px] font-black text-slate-400 uppercase mt-0.5">
                        VERIFY
                      </span>
                    </div>
                  </div>

                  {/* Card Bottom Strip */}
                  <div className="bg-slate-50 px-3 py-1 border-t border-slate-100 flex justify-between items-center text-[8px] text-slate-400 font-bold uppercase">
                    <span>Authorized Student Card</span>
                    <span>Valid For Academic Year</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-4 bg-white border-t border-slate-100 flex justify-between items-center text-xs text-slate-500 font-medium">
          <span>
            Showing <strong className="text-slate-800">{students.length}</strong> selected student ID card(s).
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 font-bold text-slate-600 hover:text-slate-800"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
