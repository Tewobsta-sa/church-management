import { useState, useEffect } from "react";
import { X, Save, Trash2, QrCode } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { studentService } from "../../services/studentService";

export default function StudentModal({
  isOpen,
  onClose,
  student = null,
  mode = "view",
  track = "young",
  onSuccess,
  canEdit = false,
  canDelete = false,
}) {
  const [formData, setFormData] = useState({
    name: "",
    christian_name: "",
    age: "",
    educational_level: "",
    subcity: "",
    district: "",
    special_place: "",
    house_number: "",
    parent_name: "",
    phone_number: "",
    parent_phone_number: "",
    section_name: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showQR, setShowQR] = useState(false);

  const isCreate = mode === "create" || !student;
  const isEdit = mode === "edit" || isCreate;

  useEffect(() => {
    if (student) {
      setFormData({
        name: student.name || "",
        christian_name: student.christian_name || "",
        age: student.age || "",
        educational_level: student.educational_level || "",
        subcity: student.subcity || "",
        district: student.district || "",
        special_place: student.special_place || "",
        house_number: student.house_number || "",
        parent_name: student.parent_name || "",
        phone_number: student.phone_number || "",
        parent_phone_number: student.parent_phone_number || "",
        section_name: student.section_name || "",
      });
    } else {
      setFormData({
        name: "", christian_name: "", age: "", educational_level: "",
        subcity: "", district: "", special_place: "", house_number: "",
        parent_name: "", phone_number: "", parent_phone_number: "", section_name: "",
      });
    }
  }, [student, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = { ...formData, age: Number(formData.age) || null };
      
      if (isCreate) {
        await studentService.createStudent(payload, track);
      } else {
        await studentService.updateStudent(student.id, payload, track);
      }
      onSuccess?.();
      onClose();
    } catch (err) {
      const msgs = err.response?.data?.errors ? Object.values(err.response.data.errors).flat().join("\n") : err.response?.data?.message || "Server error";
      alert(msgs);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if(!confirm("Permanently remove this student?")) return;
    try {
      await studentService.deleteStudent(student.id, track);
      onSuccess?.();
      onClose();
    } catch(err) {
      alert("Failed to delete student");
    }
  };

  if (!isOpen) return null;

  const qrData = student ? JSON.stringify({ sid: student.student_id, id: student.id, t: track }) : "";

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-[fade-in_0.2s_ease-out]">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col transform transition-all animate-[slide-up_0.3s_ease-out]">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-8 py-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">
              {isCreate ? "Enroll New Student" : mode === "view" ? "Student Profile" : "Edit Details"}
            </h2>
            <p className="text-sm font-medium text-brand-600 uppercase tracking-widest mt-1">
              {track} Track
            </p>
          </div>
          <button onClick={onClose} className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-8 py-6 custom-scrollbar relative">
          
          {mode === "view" && student && (
             <div className="mb-8 flex flex-col md:flex-row gap-6 items-start bg-slate-50 p-6 rounded-2xl border border-slate-100">
               {/* QR Section */}
               <div className="flex flex-col items-center gap-3 bg-white p-4 rounded-xl shadow-sm border border-slate-200 w-full md:w-auto shrink-0">
                 <QRCodeSVG value={qrData} size={120} level={"H"} className="rounded-lg" />
                 <p className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                   <QrCode className="w-3 h-3" /> Scanner Pass
                 </p>
               </div>
               {/* Name Info */}
               <div className="flex-1">
                 <h3 className="text-3xl font-black tracking-tight text-slate-800 mb-1">{student.name}</h3>
                 <p className="text-sm text-slate-500 font-medium">Baptismal Name: <span className="text-slate-800">{student.christian_name || "N/A"}</span></p>
                 <div className="mt-4 inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-brand-100 text-brand-700">
                    ID: {student.student_id}
                 </div>
               </div>
             </div>
          )}

          {mode === "view" && student ? (
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-8">
               <ViewData label="Age" value={student.age} />
               <ViewData label="Gender" value={student.sex} />
               <ViewData label="Phone Number" value={student.phone_number} />
               <ViewData label="Educational Level" value={student.educational_level} />
               <ViewData label="Parent Name" value={student.parent_name} />
               <ViewData label="Parent Phone" value={student.parent_phone_number} />
               
               <div className="sm:col-span-2 mt-4 pt-4 border-t border-slate-100">
                 <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Address Details</h4>
                 <div className="grid grid-cols-2 gap-4">
                   <ViewData label="Subcity" value={student.subcity} />
                   <ViewData label="District (Woreda)" value={student.district} />
                   <ViewData label="Special Place" value={student.special_place} />
                   <ViewData label="House Number" value={student.house_number} />
                 </div>
               </div>
             </div>
          ) : (
            <form id="student-form" onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
              <InputField label="Full Name" name="name" value={formData.name} onChange={handleChange} required />
              <InputField label="Christian Name" name="christian_name" value={formData.christian_name} onChange={handleChange} />
              
              <InputField label="Age" name="age" type="number" value={formData.age} onChange={handleChange} />
              <InputField label="Educational Level" name="educational_level" value={formData.educational_level} onChange={handleChange} />
              
              <InputField label="Student Phone" name="phone_number" value={formData.phone_number} onChange={handleChange} />
              <InputField label="Parent Name" name="parent_name" value={formData.parent_name} onChange={handleChange} />
              <InputField label="Parent Phone" name="parent_phone_number" value={formData.parent_phone_number} onChange={handleChange} />
              
              <div className="space-y-1.5 flex flex-col justify-end">
                <label className="text-xs font-bold text-slate-500 tracking-wide uppercase">Section / Class</label>
                <select name="section_name" value={formData.section_name} onChange={handleChange} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-500/10 transition-all font-medium text-slate-800">
                  <option value="">Unassigned</option>
                  <option value="Section A">Section A</option>
                  <option value="Section B">Section B</option>
                </select>
              </div>

              <div className="sm:col-span-2 pt-4 border-t border-slate-100 mt-2">
                 <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Address</h4>
              </div>
              <InputField label="Subcity" name="subcity" value={formData.subcity} onChange={handleChange} />
              <InputField label="District" name="district" value={formData.district} onChange={handleChange} />
              <InputField label="Special Place" name="special_place" value={formData.special_place} onChange={handleChange} />
              <InputField label="House Number" name="house_number" value={formData.house_number} onChange={handleChange} />
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 px-8 py-5 bg-slate-50 flex items-center justify-between rounded-b-3xl">
          {mode === "view" && canEdit && (
            <button onClick={() => setModalMode("edit")} className="text-brand-600 font-bold hover:text-brand-700 transition-colors">
              Edit Details
            </button>
          )}
          
          {!isCreate && canDelete && mode === "edit" && (
            <button type="button" onClick={handleDelete} className="flex items-center gap-2 text-red-500 font-bold hover:text-red-700 bg-red-50 hover:bg-red-100 px-4 py-2 rounded-xl transition-all">
              <Trash2 className="w-4 h-4" /> Delete
            </button>
          )}

          <div className="flex items-center gap-3 ml-auto">
            <button type="button" onClick={onClose} className="px-5 py-2.5 text-slate-500 font-bold hover:text-slate-700 transition-colors">
              Close
            </button>
            {isEdit && (
               <button form="student-form" type="submit" disabled={isSubmitting} className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-brand-600 to-brand-500 text-white rounded-xl font-bold shadow-lg shadow-brand-500/20 hover:-translate-y-0.5 transition-all disabled:opacity-50">
                 <Save className="w-4 h-4" />
                 {isSubmitting ? "Saving..." : isCreate ? "Enroll Student" : "Save Changes"}
               </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

function InputField({ label, name, value, onChange, type = "text", required = false }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-bold text-slate-500 tracking-wide uppercase">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-500/10 transition-all font-medium text-slate-800"
      />
    </div>
  );
}

function ViewData({ label, value }) {
  return (
    <div>
      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{label}</p>
      <p className="text-sm font-semibold text-slate-800 mt-1">{value || "-"}</p>
    </div>
  );
}
