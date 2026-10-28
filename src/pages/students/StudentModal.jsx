import { useState, useEffect } from "react";
import {
  X,
  Save,
  Trash2,
  QrCode,
  Upload,
  FileText,
  User,
  Briefcase,
  Home,
  Phone,
  Paperclip,
  CheckCircle2,
  ExternalLink,
  Flag,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useTranslation } from "react-i18next";
import { studentService } from "../../services/studentService";
import { sectionService } from "../../services/sectionService";
import { useAuth } from "../../context/AuthContext";
import { useFeedback } from "../../context/FeedbackContext";
import EthiopianDateInput from "../../components/common/EthiopianDateInput";
import { formatApiError } from "../../services/api";

const EDUCATION_LEVELS = [
  { value: "elementary", label: "Elementary School (1-8)" },
  { value: "highschool", label: "High School (9-12)" },
  { value: "diploma", label: "Diploma" },
  { value: "degree", label: "Bachelor's Degree" },
  { value: "masters", label: "Master's Degree (MSc/MA)" },
  { value: "phd", label: "PhD / Doctorate" },
];

const REGULAR_CLASSIFICATIONS = [
  { value: "htsanat", label: "Htsanat (Grades 1-4)" },
  { value: "maekelawyan", label: "Maekelawyan (Grades 5-8)" },
  { value: "wetatoch", label: "Wetatoch (Grades 9-12)" },
];

export default function StudentModal({
  isOpen,
  onClose,
  student = null,
  mode = "view",
  track = "regular",
  onSuccess,
  canEdit = false,
  canDelete = false,
}) {
  const { hasRole } = useAuth();
  const { notify, confirmAction } = useFeedback();
  const { t } = useTranslation();

  const [formData, setFormData] = useState({
    name: "",
    christian_name: "",
    birth_date: "",
    sex: "Male",
    educational_level: "elementary",
    grade_level: "",
    occupation_type: "student",
    current_school: "",
    current_office: "",
    family_guardian_name: "",
    family_guardian_phone: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    phone_number: "",
    email_address: "",
    telegram_user_name: "",
    city: "Addis Ababa",
    subcity: "",
    woreda: "",
    kebele: "",
    house_no: "",
    classification: "htsanat",
    is_night: false,
    track: "Regular",
    round: "",
    section_id: "",
    status: "new",
  });

  // File state
  const [pictureFile, setPictureFile] = useState(null);
  const [picturePreview, setPicturePreview] = useState(null);
  const [birthCertFiles, setBirthCertFiles] = useState([]);
  const [eduCertFiles, setEduCertFiles] = useState([]);

  const [sections, setSections] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [flagHistory, setFlagHistory] = useState(null);

  const isCreate = mode === "create" || !student;
  const isEdit = mode === "edit" || isCreate;
  const canSeeFlagHistory = hasRole("super_admin") || hasRole("yesew_habt");

  // List rows don't include flag_history — fetch the full profile in view
  // mode, but only for roles the backend allows to see it.
  useEffect(() => {
    setFlagHistory(null);
    if (
      isOpen &&
      mode === "view" &&
      student?.id &&
      canSeeFlagHistory
    ) {
      studentService
        .getStudent(student.id)
        .then((s) => setFlagHistory(s.flag_history ?? []))
        .catch(() => setFlagHistory([]));
    }
  }, [isOpen, mode, student?.id, canSeeFlagHistory]);

  useEffect(() => {
    if (student) {
      const addr = student.address || {};
      const guardian = student.contacts?.find(
        (c) => c.type === "Guardian" || c.type === "Parent",
      );
      const emerg = student.contacts?.find(
        (c) =>
          c.type === "Emergency" || c.relationship === "Emergency Responder",
      );

      let extractedRound = student.round || "";
      if (!extractedRound && student.student_id && student.student_id.startsWith("DIS/")) {
        const parts = student.student_id.split("/");
        if (parts.length >= 3) {
          extractedRound = parts[1];
        }
      }

      setFormData({
        name: student.name || "",
        christian_name: student.christian_name || "",
        birth_date: student.birth_date
          ? student.birth_date.substring(0, 10)
          : "",
        sex: student.sex || "Male",
        educational_level: student.educational_level || "elementary",
        grade_level: student.grade_level || "",
        occupation_type: student.occupation_type || "student",
        current_school: student.current_school || "",
        current_office: student.current_office || "",
        family_guardian_name:
          student.family_guardian_name || guardian?.name || "",
        family_guardian_phone:
          student.family_guardian_phone || guardian?.phone_number || "",
        emergency_contact_name:
          student.emergency_contact_name || emerg?.name || "",
        emergency_contact_phone:
          student.emergency_contact_phone || emerg?.phone_number || "",
        phone_number: student.phone_number || "",
        email_address: student.email_address || "",
        telegram_user_name: student.telegram_user_name || "",
        city: addr.city || "Addis Ababa",
        subcity: addr.subcity || "",
        woreda: addr.woreda || addr.district || "",
        kebele: addr.kebele || "",
        house_no: addr.house_no || addr.house_number || "",
        classification: student.classification || "htsanat",
        is_night: Boolean(student.is_night),
        track:
          student.section?.programType?.name ||
          (track === "prekg"
            ? "PreKG"
            : track === "distance"
              ? "Distance"
              : "Regular"),
        round: extractedRound || "",
        section_id: student.section_id || "",
        status: student.status || "new",
      });

      setPicturePreview(student.picture_url || null);
    } else {
      const initialTrack =
        track === "prekg"
          ? "PreKG"
          : track === "distance"
            ? "Distance"
            : "Regular";
      setFormData({
        name: "",
        christian_name: "",
        birth_date: "",
        sex: "Male",
        educational_level: "elementary",
        grade_level: "",
        occupation_type: "student",
        current_school: "",
        current_office: "",
        family_guardian_name: "",
        family_guardian_phone: "",
        emergency_contact_name: "",
        emergency_contact_phone: "",
        phone_number: "",
        email_address: "",
        telegram_user_name: "",
        city: "Addis Ababa",
        subcity: "",
        woreda: "",
        kebele: "",
        house_no: "",
        classification:
          initialTrack === "PreKG"
            ? "prekg"
            : initialTrack === "Distance"
              ? "distance"
              : "htsanat",
        is_night: false,
        track: initialTrack,
        round: "",
        section_id: "",
        status: "new",
      });
      setPicturePreview(null);
    }
    setPictureFile(null);
    setBirthCertFiles([]);
    setEduCertFiles([]);
  }, [student, isOpen, track]);

  useEffect(() => {
    if (isOpen) {
      const fetchSections = async () => {
        try {
          const res = await sectionService.getSections(1, "", "");
          setSections(res.data || []);
        } catch (err) {
          console.error("Failed to load sections", err);
        }
      };
      fetchSections();
    }
  }, [isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePictureChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPictureFile(file);
      setPicturePreview(URL.createObjectURL(file));
    }
  };

  const handleBirthCertsChange = (e) => {
    if (e.target.files) {
      setBirthCertFiles(Array.from(e.target.files));
    }
  };

  const handleEduCertsChange = (e) => {
    if (e.target.files) {
      setEduCertFiles(Array.from(e.target.files));
    }
  };

  const buildFormData = (extra = {}) => {
    const data = new FormData();
    Object.entries(formData).forEach(([key, val]) => {
      if (val !== null && val !== undefined) {
        data.append(key, typeof val === "boolean" ? (val ? 1 : 0) : val);
      }
    });
    Object.entries(extra).forEach(([key, val]) => data.append(key, val));

    if (pictureFile) {
      data.append("picture", pictureFile);
    }
    birthCertFiles.forEach((file) => {
      data.append("birth_certificates[]", file);
    });
    eduCertFiles.forEach((file) => {
      data.append("educational_certificates[]", file);
    });
    return data;
  };

  const submitStudent = async (data) => {
    if (isCreate) {
      await studentService.createStudent(data, formData.track);
    } else {
      await studentService.updateStudent(student.id, data, formData.track);
    }
  };

  const handleSubmit = async (e, allowDuplicate = false) => {
    e.preventDefault();
    if (formData.track === "Distance" && !formData.round?.trim()) {
      notify("የየርቀት ትምህርት ተማሪዎች ዙር (Round) ማስገባት ግዴታ ነው። (Round is mandatory for Distance students).", "warning");
      return;
    }
    setIsSubmitting(true);

    try {
      await submitStudent(
        buildFormData(allowDuplicate ? { allow_duplicate: 1 } : {}),
      );

      onSuccess?.();
      onClose();
    } catch (err) {
      // 409 = possible duplicate student — offer an explicit override
      if (err.response?.status === 409 && err.response?.data?.duplicate) {
        const matches = (err.response.data.duplicates || [])
          .map(
            (d) =>
              `• ${d.name} (${d.student_id}) — ${d.section || "Unassigned"}${d.birth_date ? `, born ${d.birth_date}` : ""}`,
          )
          .join("\n");
        const confirmed = await confirmAction({
          title: "ተመሳሳይ ተማሪ ተገኝቷል (Possible Duplicate)",
          message: `${err.response.data.message}\n\nSimilar existing record(s):\n${matches}\n\nRegister anyway?`,
          confirmLabel: "Register Anyway",
          cancelLabel: "Cancel",
          danger: true,
        });
        if (confirmed) {
          setIsSubmitting(false);
          return handleSubmit(e, true);
        }
      } else {
        notify(formatApiError(err, "Server error"), "error");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = await confirmAction({
      title: "Delete Student",
      message: "Are you sure you want to permanently remove this student? This action cannot be undone.",
      confirmLabel: "Delete",
      danger: true,
    });
    if (!confirmed) return;
    try {
      await studentService.deleteStudent(student.id);
      notify("Student deleted.", "success");
      onSuccess?.();
      onClose();
    } catch (err) {
      notify(formatApiError(err, "Failed to delete student"), "error");
    }
  };

  if (!isOpen) return null;

  const showGradeLevelInput =
    formData.educational_level === "elementary" ||
    formData.educational_level === "highschool";

  const filteredSections = sections.filter((s) => {
    const progName = s.program_type?.name?.toLowerCase() || "";
    const secName = s.name?.toLowerCase() || "";
    const chosenTrack = formData.track.toLowerCase();

    if (chosenTrack === "prekg") {
      return (
        progName.includes("prekg") ||
        secName.includes("prekg") ||
        secName.includes("pre kg")
      );
    }
    if (chosenTrack === "distance") {
      return (
        progName.includes("distance") ||
        secName.includes("distance") ||
        secName.startsWith("d")
      );
    }

    // Regular track: filter strictly by classification
    const isRegularProg =
      progName.includes("regular") || progName.includes("young") || !progName;
    if (!isRegularProg) return false;

    const classification = formData.classification?.toLowerCase() || "htsanat";

    // Extract any grade number or number from section name or order_no
    const match = secName.match(/grade\s*([0-9]+)|([0-9]+)/i);
    const gradeNum = match
      ? parseInt(match[1] || match[2], 10)
      : s.order_no || 0;

    if (classification === "htsanat") {
      if (
        secName.includes("htsanat") ||
        secName.includes("ህፃናት") ||
        secName.includes("ህጻናት")
      )
        return true;
      if (gradeNum >= 1 && gradeNum <= 4) return true;
      return false;
    }

    if (classification === "maekelawyan") {
      if (
        secName.includes("maekelawyan") ||
        secName.includes("ማዕከላውያን") ||
        secName.includes("ማእከላውያን")
      )
        return true;
      if (gradeNum >= 5 && gradeNum <= 8) return true;
      return false;
    }

    if (classification === "wetatoch") {
      if (secName.includes("wetatoch") || secName.includes("ወጣቶች")) return true;
      if (gradeNum >= 9 && gradeNum <= 12) return true;
      return false;
    }

    return true;
  });

  // Sparse payload — the scanner resolves the raw student_id directly.
  const qrData = student?.student_id || "";

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-[fade-in_0.2s_ease-out]">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col transform transition-all animate-[slide-up_0.3s_ease-out] overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-8 py-5 bg-gradient-to-r from-slate-50 to-white">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-brand-50 flex items-center justify-center text-brand-600 border border-brand-100 font-bold">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">
                {isCreate
                  ? t("students.modal.createTitle")
                  : mode === "view"
                    ? t("students.studentProfile")
                    : t("students.modal.editTitle")}
              </h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs font-bold text-brand-600 uppercase tracking-wider">
                  {formData.track} {t("students.modal.program")}
                </span>
                {formData.classification && (
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    {formData.classification}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto px-8 py-6 custom-scrollbar relative">
          {mode === "view" && student ? (
            /* VIEW MODE */
            <div className="space-y-6">
              {/* Profile Card with Photo & QR */}
              <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start bg-slate-50 p-6 rounded-3xl border border-slate-200/80">
                <div className="relative shrink-0">
                  {student.picture_url ? (
                    <img
                      src={student.picture_url}
                      alt={student.name}
                      className="w-28 h-28 object-cover rounded-2xl border-2 border-brand-500 shadow-md"
                    />
                  ) : (
                    <div className="w-28 h-28 rounded-2xl bg-slate-200 flex items-center justify-center text-slate-400 font-black text-2xl border-2 border-slate-300">
                      {student.name?.charAt(0) || "S"}
                    </div>
                  )}
                  <span
                    className={`absolute -bottom-2 -right-2 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase shadow ${
                      student.status === "regular"
                        ? "bg-emerald-500 text-white"
                        : "bg-amber-500 text-white"
                    }`}
                  >
                    {student.status || "new"}
                  </span>
                </div>

                <div className="flex-1 text-center sm:text-left">
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                    {student.name}
                  </h3>
                  {student.christian_name && (
                    <p className="text-sm font-semibold text-brand-600 mt-0.5">
                      {t("students.fields.christianName")}: {student.christian_name}
                    </p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-2 justify-center sm:justify-start">
                    <span className="px-3 py-1 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700">
                      ID: {student.student_id}
                    </span>
                    <span className="px-3 py-1 bg-brand-50 border border-brand-100 rounded-xl text-xs font-bold text-brand-700">
                      {t("students.modal.classLabel")}: {student.section?.name || "Unassigned"}
                    </span>
                    {student.grade_level && (
                      <span className="px-3 py-1 bg-indigo-50 border border-indigo-100 rounded-xl text-xs font-bold text-indigo-700">
                        {student.grade_level}
                      </span>
                    )}
                  </div>
                </div>

                <div className="shrink-0 flex flex-col items-center p-3 bg-white rounded-2xl border border-slate-200 shadow-sm">
                  <QRCodeSVG value={qrData} size={140} level="H" marginSize={2} bgColor="#ffffff" fgColor="#0f172a" />
                  <p className="text-[9px] font-extrabold uppercase text-slate-400 mt-1 flex items-center gap-1">
                    <QrCode className="w-3 h-3" /> {t("students.modal.idPass")}
                  </p>
                </div>
              </div>

              {/* Data Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 pt-2">
                <ViewData label={t("common.sex")} value={student.sex} />
                <ViewData
                  label={t("students.fields.birthDate")}
                  value={
                    student.birth_date
                      ? student.birth_date.substring(0, 10)
                      : "-"
                  }
                />
                <ViewData
                  label={t("students.fields.age")}
                  value={student.age ? `${student.age} yrs` : "-"}
                />

                <ViewData
                  label={t("students.fields.educationalLevel")}
                  value={student.educational_level}
                />
                <ViewData
                  label={t("students.modal.activityStatus")}
                  value={
                    student.occupation_type
                      ? student.occupation_type === "working"
                        ? t("students.modal.occupationWorking")
                        : t("students.modal.occupationStudent")
                      : "-"
                  }
                />
                <ViewData
                  label={
                    student.occupation_type === "working"
                      ? t("students.fields.currentOffice")
                      : t("students.fields.currentSchool")
                  }
                  value={
                    student.occupation_type === "working"
                      ? student.current_office
                      : student.current_school
                  }
                />

                <ViewData label={t("students.fields.phone")} value={student.phone_number} />
                <ViewData
                  label={t("students.fields.familyGuardianName")}
                  value={student.family_guardian_name}
                />
                <ViewData
                  label={t("students.fields.familyGuardianPhone")}
                  value={student.family_guardian_phone}
                />

                <ViewData
                  label={t("students.fields.emergencyContactName")}
                  value={student.emergency_contact_name}
                />
                <ViewData
                  label={t("students.fields.emergencyContactPhone")}
                  value={student.emergency_contact_phone}
                />
                <ViewData label={t("students.fields.status")} value={student.status || "new"} />
              </div>

              {/* Address Details */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/70">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <Home className="w-3.5 h-3.5" /> {t("students.modal.livingAddress")}
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <ViewData
                    label={t("students.fields.city")}
                    value={student.address?.city || "Addis Ababa"}
                  />
                  <ViewData label={t("students.fields.subcity")} value={student.address?.subcity} />
                  <ViewData
                    label={t("students.fields.woreda")}
                    value={student.address?.woreda || student.address?.district}
                  />
                  <ViewData
                    label={t("students.modal.kebeleHouseNo")}
                    value={`${student.address?.kebele || "-"} / ${student.address?.house_no || student.address?.house_number || "-"}`}
                  />
                </div>
              </div>

              {/* Documents & Certificates */}
              {(student.birth_certificates_urls?.length > 0 ||
                student.educational_certificates_urls?.length > 0) && (
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/70">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                    <Paperclip className="w-3.5 h-3.5" /> {t("students.modal.uploadedDocs")}
                  </h4>
                  <div className="space-y-3">
                    {student.birth_certificates_urls?.length > 0 && (
                      <div>
                        <p className="text-xs font-bold text-slate-500 mb-1">
                          {t("students.fields.birthCertificates")}:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {student.birth_certificates_urls.map((url, i) => (
                            <a
                              key={i}
                              href={url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-brand-700 hover:bg-brand-50"
                            >
                              <FileText className="w-3.5 h-3.5" />{" "}
                              {t("students.modal.certificate", { n: i + 1 })}
                              <ExternalLink className="w-3 h-3 ml-0.5" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {student.educational_certificates_urls?.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs font-bold text-slate-500 mb-1">
                          {t("students.fields.educationalCertificates")}:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {student.educational_certificates_urls.map(
                            (url, i) => (
                              <a
                                key={i}
                                href={url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-brand-700 hover:bg-brand-50"
                              >
                                <FileText className="w-3.5 h-3.5" />{" "}
                                {t("students.modal.certificate", { n: i + 1 })}
                                <ExternalLink className="w-3 h-3 ml-0.5" />
                              </a>
                            ),
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Flag History — fetched for Ye Sew Habt / Super Admin only */}
              {flagHistory?.length > 0 && (
                <div className="p-5 rounded-2xl bg-rose-50/60 border border-rose-200/70">
                  <h4 className="text-xs font-black text-rose-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                    <Flag className="w-3.5 h-3.5" /> የእገዳ ታሪክ (Flag History)
                  </h4>
                  <div className="space-y-2.5">
                    {flagHistory.map((evt) => (
                      <div
                        key={evt.id}
                        className="bg-white rounded-xl border border-rose-100 px-4 py-3 text-xs"
                      >
                        <p className="font-bold text-slate-800">{evt.reason}</p>
                        <p className="text-slate-500 mt-1">
                          ታግዷል (Flagged)
                          {evt.flagged_by ? ` by ${evt.flagged_by}` : ""}
                          {evt.flagged_at
                            ? ` • ${new Date(evt.flagged_at).toLocaleDateString()}`
                            : ""}
                          {evt.unflagged_at
                            ? ` — እገዳ ተነስቷል (Cleared)${evt.unflagged_by ? ` by ${evt.unflagged_by}` : ""} • ${new Date(evt.unflagged_at).toLocaleDateString()}`
                            : " — still active"}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* CREATE / EDIT FORM */
            <form
              id="student-form"
              onSubmit={handleSubmit}
              className="space-y-8"
            >
              {/* SECTION 1: Personal Information */}
              <div>
                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
                  <User className="w-4 h-4 text-brand-600" />
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">
                    {t("students.modal.section1")}
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  {/* Photo Upload Thumbnail */}
                  <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                    {picturePreview ? (
                      <img
                        src={picturePreview}
                        alt="Preview"
                        className="w-24 h-24 object-cover rounded-2xl shadow-sm mb-2"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-2xl bg-white border border-slate-200 flex flex-col items-center justify-center text-slate-400 mb-2">
                        <Upload className="w-6 h-6 mb-1" />
                        <span className="text-[10px] font-bold">
                          {t("students.modal.uploadPhoto")}
                        </span>
                      </div>
                    )}
                    <label className="cursor-pointer text-xs font-black text-brand-600 hover:text-brand-700 bg-white px-3 py-1.5 rounded-xl border border-brand-200 shadow-sm transition-all">
                      {t("students.modal.choosePhoto")}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePictureChange}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* Name Fields */}
                  <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <InputField
                      label={t("students.fields.name")}
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                    />
                    <InputField
                      label={t("students.fields.christianName")}
                      name="christian_name"
                      value={formData.christian_name}
                      onChange={handleChange}
                    />

                    <EthiopianDateInput
                      label={t("students.fields.birthDate")}
                      value={formData.birth_date}
                      onChange={(e) =>
                        handleChange({
                          target: { name: "birth_date", value: e.target.value },
                        })
                      }
                    />

                    <div>
                      <label className="text-xs font-bold text-slate-500 tracking-wide uppercase">
                        {t("students.modal.sex")} <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="sex"
                        value={formData.sex}
                        onChange={handleChange}
                        required
                        className="w-full mt-1.5 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-brand-500 focus:bg-white transition-all font-medium text-slate-800"
                      >
                        <option value="Male">{t("common.male")}</option>
                        <option value="Female">{t("common.female")}</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 2: Education & Occupation */}
              <div>
                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
                  <Briefcase className="w-4 h-4 text-brand-600" />
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">
                    {t("students.modal.section2")}
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  <div>
                    <label className="text-xs font-bold text-slate-500 tracking-wide uppercase">
                      {t("students.fields.educationalLevel")} <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="educational_level"
                      value={formData.educational_level}
                      onChange={handleChange}
                      required
                      className="w-full mt-1.5 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-brand-500 focus:bg-white transition-all font-medium text-slate-800"
                    >
                      {EDUCATION_LEVELS.map((lvl) => (
                        <option key={lvl.value} value={lvl.value}>
                          {lvl.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Conditional Exact Grade Level */}
                  {showGradeLevelInput && (
                    <InputField
                      label={t("students.modal.exactGrade")}
                      name="grade_level"
                      placeholder="e.g. Grade 4"
                      value={formData.grade_level}
                      onChange={handleChange}
                      required
                    />
                  )}

                  <div>
                    <label className="text-xs font-bold text-slate-500 tracking-wide uppercase">
                      {t("students.modal.activityStatus")} <span className="text-red-500">*</span>
                    </label>
                    <div className="mt-1.5 flex gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setFormData((p) => ({
                            ...p,
                            occupation_type: "student",
                          }))
                        }
                        className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs border transition-all ${
                          formData.occupation_type === "student"
                            ? "bg-brand-600 text-white border-brand-600 shadow"
                            : "bg-slate-50 text-slate-600 border-slate-200"
                        }`}
                      >
                        {t("students.modal.occupationStudent")}
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setFormData((p) => ({
                            ...p,
                            occupation_type: "working",
                          }))
                        }
                        className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs border transition-all ${
                          formData.occupation_type === "working"
                            ? "bg-brand-600 text-white border-brand-600 shadow"
                            : "bg-slate-50 text-slate-600 border-slate-200"
                        }`}
                      >
                        {t("students.modal.occupationWorking")}
                      </button>
                    </div>
                  </div>

                  {formData.occupation_type === "student" ? (
                    <InputField
                      label={t("students.fields.currentSchool")}
                      name="current_school"
                      placeholder="School name"
                      value={formData.current_school}
                      onChange={handleChange}
                    />
                  ) : (
                    <InputField
                      label={t("students.fields.currentOffice")}
                      name="current_office"
                      placeholder="Office / Company name"
                      value={formData.current_office}
                      onChange={handleChange}
                    />
                  )}
                </div>
              </div>

              {/* SECTION 3: Contacts & Family */}
              <div>
                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
                  <Phone className="w-4 h-4 text-brand-600" />
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">
                    {t("students.modal.section3")}
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                  <InputField
                    label={t("students.fields.familyGuardianName")}
                    name="family_guardian_name"
                    value={formData.family_guardian_name}
                    onChange={handleChange}
                    required
                  />
                  <InputField
                    label={t("students.fields.familyGuardianPhone")}
                    name="family_guardian_phone"
                    value={formData.family_guardian_phone}
                    onChange={handleChange}
                    required
                  />
                  <InputField
                    label={t("students.fields.phone")}
                    name="phone_number"
                    value={formData.phone_number}
                    onChange={handleChange}
                  />

                  <InputField
                    label={t("students.fields.emergencyContactName")}
                    name="emergency_contact_name"
                    value={formData.emergency_contact_name}
                    onChange={handleChange}
                    required
                  />
                  <InputField
                    label={t("students.fields.emergencyContactPhone")}
                    name="emergency_contact_phone"
                    value={formData.emergency_contact_phone}
                    onChange={handleChange}
                    required
                  />
                  <InputField
                    label={t("students.fields.telegram")}
                    name="telegram_user_name"
                    placeholder="@username"
                    value={formData.telegram_user_name}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* SECTION 4: Living Address */}
              <div>
                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
                  <Home className="w-4 h-4 text-brand-600" />
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">
                    {t("students.modal.section4")}
                  </h3>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                  <InputField
                    label={t("students.fields.city")}
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    required
                  />
                  <InputField
                    label={t("students.fields.subcity")}
                    name="subcity"
                    value={formData.subcity}
                    onChange={handleChange}
                    required
                  />
                  <InputField
                    label={t("students.fields.woreda")}
                    name="woreda"
                    value={formData.woreda}
                    onChange={handleChange}
                    required
                  />
                  <InputField
                    label={t("students.fields.kebele")}
                    name="kebele"
                    value={formData.kebele}
                    onChange={handleChange}
                  />
                  <InputField
                    label={t("students.fields.houseNo")}
                    name="house_no"
                    value={formData.house_no}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* SECTION 5: Program Classification & Status */}
              <div>
                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
                  <CheckCircle2 className="w-4 h-4 text-brand-600" />
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">
                    {t("students.modal.section5")}
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
                  <div>
                    <label className="text-xs font-bold text-slate-500 tracking-wide uppercase">
                      {t("students.modal.programTrack")} <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="track"
                      value={formData.track}
                      onChange={(e) => {
                        const trk = e.target.value;
                        setFormData((prev) => ({
                          ...prev,
                          track: trk,
                          classification:
                            trk === "PreKG"
                              ? "prekg"
                              : trk === "Distance"
                                ? "distance"
                                : "htsanat",
                        }));
                      }}
                      required
                      className="w-full mt-1.5 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-brand-500 focus:bg-white font-medium text-slate-800"
                    >
                      <option value="PreKG">PreKG</option>
                      <option value="Regular">Regular</option>
                      <option value="Distance">Distance</option>
                    </select>
                  </div>

                  {formData.track === "Regular" && (
                    <div>
                      <label className="text-xs font-bold text-slate-500 tracking-wide uppercase">
                        {t("students.modal.regularClassification")}{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="classification"
                        value={formData.classification}
                        onChange={handleChange}
                        required
                        className="w-full mt-1.5 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-brand-500 focus:bg-white font-medium text-slate-800"
                      >
                        {REGULAR_CLASSIFICATIONS.map((c) => (
                          <option key={c.value} value={c.value}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {formData.track === "Regular" && (
                    <div className="flex flex-col justify-end">
                      <label className="text-xs font-bold text-slate-500 tracking-wide uppercase mb-1.5">
                        {t("students.modal.shift")}
                      </label>
                      <label className="flex items-center gap-2.5 px-4 py-2.5 bg-indigo-50/80 border border-indigo-200 rounded-xl cursor-pointer hover:bg-indigo-100/70 transition-all select-none">
                        <input
                          type="checkbox"
                          name="is_night"
                          checked={Boolean(formData.is_night)}
                          onChange={(e) =>
                            setFormData((p) => ({
                              ...p,
                              is_night: e.target.checked,
                            }))
                          }
                          className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                        />
                        <span className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                          <span>🌙 {t("students.modal.nightStudent")}</span>
                          <span className="text-[10px] text-indigo-600 font-medium">
                            {t("students.modal.nightShift")}
                          </span>
                        </span>
                      </label>
                    </div>
                  )}

                  {formData.track === "Distance" && (
                    <div>
                      <label className="text-xs font-bold text-amber-900 tracking-wide uppercase flex items-center justify-between">
                        <span>{t("students.modal.round")}</span>
                        <span className="text-red-500 font-black">* {t("students.modal.roundRequired")}</span>
                      </label>
                      <input
                        type="text"
                        name="round"
                        value={formData.round || ""}
                        onChange={handleChange}
                        placeholder="ለምሳሌ፡ 1፣ 2፣ 2016"
                        required
                        className="w-full mt-1.5 px-4 py-2.5 bg-amber-50/80 border border-amber-300 rounded-xl outline-none focus:border-brand-500 focus:bg-white font-bold text-slate-800 shadow-sm"
                      />
                      <p className="text-[10px] text-amber-700 mt-1 font-medium">የተማሪ መታወቂያ: DIS/<strong>{formData.round || "ዙር"}</strong>/...</p>
                    </div>
                  )}

                  <div>
                    <label className="text-xs font-bold text-slate-500 tracking-wide uppercase">
                      {t("students.modal.assignSection")} <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="section_id"
                      value={formData.section_id}
                      onChange={handleChange}
                      required
                      className="w-full mt-1.5 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-brand-500 focus:bg-white font-medium text-slate-800"
                    >
                      <option value="">{t("students.modal.selectSection")}</option>
                      {filteredSections.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.program_type?.name || formData.track})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-500 tracking-wide uppercase">
                      {t("students.modal.enrollmentStatus")} <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      required
                      className="w-full mt-1.5 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-brand-500 focus:bg-white font-medium text-slate-800"
                    >
                      <option value="new">{t("students.modal.newStudent")}</option>
                      <option value="regular">{t("students.modal.regularStudent")}</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* SECTION 6: File Uploads (Certificates) */}
              <div>
                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
                  <Paperclip className="w-4 h-4 text-brand-600" />
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">
                    {t("students.modal.section6")}
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Birth Certificates */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                    <label className="text-xs font-bold text-slate-700 block mb-2">
                      {t("students.fields.birthCertificates")}
                    </label>
                    <input
                      type="file"
                      multiple
                      onChange={handleBirthCertsChange}
                      className="text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100 cursor-pointer"
                    />
                    {birthCertFiles.length > 0 && (
                      <p className="text-[11px] font-bold text-emerald-600 mt-2">
                        ✓ {t("students.modal.filesSelected", { count: birthCertFiles.length })}
                      </p>
                    )}
                  </div>

                  {/* Educational Certificates */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                    <label className="text-xs font-bold text-slate-700 block mb-2">
                      {t("students.fields.educationalCertificates")}
                    </label>
                    <input
                      type="file"
                      multiple
                      onChange={handleEduCertsChange}
                      className="text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100 cursor-pointer"
                    />
                    {eduCertFiles.length > 0 && (
                      <p className="text-[11px] font-bold text-emerald-600 mt-2">
                        ✓ {t("students.modal.filesSelected", { count: eduCertFiles.length })}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Modal Footer */}
        <div className="border-t border-slate-100 px-8 py-5 bg-slate-50 flex items-center justify-between">
          {!isCreate && canDelete && mode === "edit" && (
            <button
              type="button"
              onClick={handleDelete}
              className="flex items-center gap-2 text-red-500 font-bold hover:text-red-700 bg-red-50 hover:bg-red-100 px-4 py-2.5 rounded-xl transition-all"
            >
              <Trash2 className="w-4 h-4" /> {t("students.modal.deleteStudent")}
            </button>
          )}

          <div className="flex items-center gap-3 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 text-slate-600 font-bold hover:text-slate-800 transition-colors"
            >
              {t("common.close")}
            </button>
            {isEdit && (
              <button
                form="student-form"
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-7 py-2.5 bg-gradient-to-r from-brand-600 to-brand-500 text-white rounded-xl font-bold shadow-lg shadow-brand-500/20 hover:-translate-y-0.5 transition-all disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {isSubmitting
                  ? t("common.saving")
                  : isCreate
                    ? t("students.modal.enrollStudent")
                    : t("common.save")}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function InputField({
  label,
  name,
  value,
  onChange,
  type = "text",
  placeholder = "",
  required = false,
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-bold text-slate-500 tracking-wide uppercase">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-500/10 transition-all font-medium text-slate-800 text-sm"
      />
    </div>
  );
}

function ViewData({ label, value }) {
  return (
    <div>
      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
        {label}
      </p>
      <p className="text-sm font-semibold text-slate-800 mt-0.5">
        {value || "-"}
      </p>
    </div>
  );
}
