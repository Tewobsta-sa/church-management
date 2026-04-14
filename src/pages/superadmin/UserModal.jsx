import { useState, useEffect } from "react";
import { X, Save } from "lucide-react";

// ✅ Match EXACT backend roles
const availableRoles = [
  { value: "super_admin", label: "Super Admin" },
  { value: "teacher", label: "Teacher" },
  { value: "gngnunet_office_admin", label: "Gngnunet Office Admin" },
  { value: "tmhrt_office_admin", label: "Tmhrt Office Admin" },
  { value: "mezmur_office_admin", label: "Mezmur Office Admin" }
];

export default function UserModal({
  isOpen,
  onClose,
  user = null,
  onSave,
  mode = "create",
}) {
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    password: "",
    password_confirmation: "",
    role: "super_admin", // ✅ default valid role
    security_question: "",
    security_answer: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEdit = mode === "edit";

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
        role: "super_admin",
        security_question: "",
        security_answer: "",
      });
    }
  }, [user, isEdit]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isEdit && formData.password !== formData.password_confirmation) {
      alert("Passwords do not match");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave(formData, isEdit ? user.id : null);
      onClose();
    } catch (err) {
      console.log(err.response);
      alert(err.response?.data?.error || "Failed to save user");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 border-b flex items-center justify-between">
          <h2 className="text-2xl font-semibold">
            {isEdit ? "Edit User" : "Create New User"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-6 space-y-6"
        >
          {/* Name */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Username */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Username <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Password (only create) */}
          {!isEdit && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  name="password_confirmation"
                  value={formData.password_confirmation}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:border-blue-500"
                />
              </div>
            </>
          )}

          {/* Role */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Role <span className="text-red-500">*</span>
            </label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:border-blue-500"
            >
              {availableRoles.map((role) => (
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
                  Security Question <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="security_question"
                  value={formData.security_question}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Security Answer <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="security_answer"
                  value={formData.security_answer}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:border-blue-500"
                />
              </div>
            </>
          )}
        </form>

        {/* Footer */}
        <div className="border-t px-6 py-4 flex justify-end gap-3 bg-gray-50">
          <button
            onClick={onClose}
            className="px-6 py-2.5 text-gray-700 hover:bg-gray-100 rounded-xl"
          >
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2.5 rounded-xl font-medium"
          >
            <Save className="w-5 h-5" />
            {isSubmitting
              ? "Saving..."
              : isEdit
                ? "Update User"
                : "Create User"}
          </button>
        </div>
      </div>
    </div>
  );
}
