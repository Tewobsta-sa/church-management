import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../services/api";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: "",
    security_answer: "",
    new_password: "",
    new_password_confirmation: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const onChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setIsSubmitting(true);

    try {
      const response = await api.post("/forgot-password", formData);
      setMessage(response?.data?.message || "Password reset successful. You can now sign in.");
      setTimeout(() => navigate("/", { replace: true }), 1200);
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || "Unable to reset password.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <h1 className="text-2xl font-bold text-slate-800">Reset Password</h1>
        <p className="text-sm text-slate-500 mt-1">Verify identity with your username and security answer.</p>

        {message && <div className="mt-4 rounded-lg bg-green-50 text-green-700 px-4 py-3 text-sm">{message}</div>}
        {error && <div className="mt-4 rounded-lg bg-red-50 text-red-700 px-4 py-3 text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <input
            name="username"
            value={formData.username}
            onChange={onChange}
            placeholder="Username"
            required
            className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:border-brand-500"
          />
          <input
            name="security_answer"
            value={formData.security_answer}
            onChange={onChange}
            placeholder="Security answer"
            required
            className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:border-brand-500"
          />
          <input
            type="password"
            name="new_password"
            value={formData.new_password}
            onChange={onChange}
            placeholder="New password"
            required
            className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:border-brand-500"
          />
          <input
            type="password"
            name="new_password_confirmation"
            value={formData.new_password_confirmation}
            onChange={onChange}
            placeholder="Confirm new password"
            required
            className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:border-brand-500"
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-70 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            {isSubmitting ? "Resetting..." : "Reset Password"}
          </button>
        </form>

        <Link to="/" className="inline-block mt-4 text-sm text-brand-600 hover:text-brand-700">
          Back to login
        </Link>
      </div>
    </div>
  );
}
