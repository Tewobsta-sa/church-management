import { useState, useEffect } from "react";
import { X, Save, UserPlus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useFeedback } from "../../context/FeedbackContext";

// Canonical 5 system roles only
const availableRoles = [
  { value: "super_admin", label: "Super Admin" },
  { value: "yesew_habt", label: "Yesew Habt" },
  { value: "mereja_kfl", label: "Mereja Kfl" },
  { value: "mezmur_kfl", label: "Mezmur Kfl" },
  { value: "tmhrt_kfl", label: "Tmhrt Kfl" },
];

export default function UserModal({
  isOpen,
  onClose,
  user = null,
  onSave,
  mode = "create",
}) {
  const { notify } = useFeedback();
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    password: "",
    password_confirmation: "",
    role: "super_admin",
    security_question: "",
    security_answer: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEdit = mode === "edit";
  const defaultRole = "super_admin";
  const selectableRoles = availableRoles;

  useEffect(() => {
    if (user && isEdit) {
      setFormData({
        name: user.name || "",
        username: user.username || "",
        password: "",
        password_confirmation: "",
        role: user.roles?.[0]?.name || "super_admin",
        security_question: user.security_question || "",
        security_answer: "",
      });
    } else {
      setFormData({
        name: "",
        username: "",
        password: "",
        password_confirmation: "",
        role: defaultRole,
        security_question: "",
        security_answer: "",
      });
    }
  }, [user, isEdit, defaultRole]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password && formData.password !== formData.password_confirmation) {
      notify(t("users.modal.passwordsMismatch"), "error");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave(formData, isEdit ? user.id : null);
      onClose();
    } catch (err) {
      console.log(err.response);
      notify(err.response?.data?.error || "Failed to save user", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[95vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-800">
                {isEdit ? t("users.modal.editTitle") : t("users.modal.createTitle")}
              </h2>
              <p className="text-xs font-semibold text-slate-500 mt-0.5">
                {t("users.modal.manageAccess")}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-white transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-6 space-y-5"
        >
          {/* Name */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">
              {t("users.modal.fullName")} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10"
            />
          </div>

          {/* Username */}
          <div>
            <label className="block text-sm font-medium mb-1">
              {t("users.modal.username")} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required={!isEdit}
              readOnly={isEdit}
              disabled={isEdit}
              title={isEdit ? t("users.modal.usernameLocked") : undefined}
              className={`w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 ${
                isEdit ? "bg-slate-100 text-slate-400 cursor-not-allowed" : ""
              }`}
            />
            {isEdit && (
              <p className="text-[11px] text-slate-400 mt-1">{t("users.modal.usernameLocked")}</p>
            )}
          </div>

          {/* Password — required on create; optional reset on edit */}
          {!isEdit ? (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">
                  {t("users.modal.password")} <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  {t("users.modal.confirmPassword")} <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  name="password_confirmation"
                  value={formData.password_confirmation}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10"
                />
              </div>
            </>
          ) : (
            <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 space-y-4">
              <p className="text-xs font-bold text-amber-800 uppercase tracking-wider">
                {t("users.modal.resetOptional")}
              </p>
              <div>
                <label className="block text-sm font-medium mb-1">{t("users.modal.newPassword")}</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  minLength={8}
                  placeholder="Min. 8 characters"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t("users.modal.confirmNewPassword")}</label>
                <input
                  type="password"
                  name="password_confirmation"
                  value={formData.password_confirmation}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 bg-white"
                />
              </div>
            </div>
          )}

          {/* Role */}
          <div>
            <label className="block text-sm font-medium mb-1">
              {t("users.role")} <span className="text-red-500">*</span>
            </label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10"
            >
              {selectableRoles.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
          </div>

          {/* Security Question */}
          {!isEdit && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">
                  {t("users.modal.securityQuestion")} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="security_question"
                  value={formData.security_question}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  {t("users.modal.securityAnswer")} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="security_answer"
                  value={formData.security_answer}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10"
                />
              </div>
            </>
          )}
        </form>

        {/* Footer */}
        <div className="border-t border-slate-200 px-6 py-4 flex justify-end gap-3 bg-slate-50/70">
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-slate-600 hover:bg-white border border-slate-200 rounded-lg font-bold transition-colors"
          >
            {t("common.cancel")}
          </button>

          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 disabled:bg-brand-300 text-white px-4 py-2.5 rounded-lg font-bold shadow-sm transition-colors"
          >
            <Save className="w-5 h-5" />
            {isSubmitting
              ? t("common.saving")
              : isEdit
                ? t("users.modal.updateUser")
                : t("users.modal.createTitle")}
          </button>
        </div>
      </div>
    </div>
  );
}
