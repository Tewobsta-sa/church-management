import { useState } from "react";
import api from "../../services/api";
import { useNavigate } from "react-router-dom";
import { Crown, ShieldCheck, UserPlus, KeyRound } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function Setup() {
  // Canonical 5 system roles
  const hardcodedRoles = {
    super_admin: "Super Administrator (Full Access)",
    yesew_habt: "Yesew Habt (Student Registration, Attendance, Ministry)",
    mereja_kfl: "Mereja Kfl (System-wide View-Only Access)",
    mezmur_kfl: "Mezmur Kfl (Mezmur Schedules, Exams, Handoff)",
    tmhrt_kfl: "Tmhrt Kfl (Tmhrt Schedules, Courses, Grades, Teachers)",
  };

  const [roles] = useState(hardcodedRoles);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [role, setRole] = useState(Object.keys(hardcodedRoles)[0]);
  const [securityQuestion, setSecurityQuestion] = useState("");
  const [securityAnswer, setSecurityAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (
      !name ||
      !username ||
      !password ||
      !passwordConfirm ||
      !role ||
      !securityQuestion ||
      !securityAnswer
    ) {
      setError("Please fill all fields");
      return;
    }

    if (password !== passwordConfirm) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      await api.post("/system/initialize", {
        name,
        username,
        password,
        password_confirmation: passwordConfirm,
        role,
        security_question: securityQuestion,
        security_answer: securityAnswer,
      });

      // Clear previous user/session
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      localStorage.removeItem("refresh_token");

      navigate("/", { replace: true });
      window.location.reload();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Setup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-50 flex items-center justify-center relative overflow-hidden font-sans selection:bg-brand-200 p-4">
      {/* Immersive Background */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-25%] right-[-15%] w-[65vw] h-[65vw] rounded-full bg-brand-500/15 filter blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-20%] left-[-15%] w-[60vw] h-[60vw] rounded-full bg-amber-500/10 filter blur-[130px]"></div>
      </div>

      <div className="z-10 w-full max-w-[480px] animate-[slide-up_0.6s_cubic-bezier(0.16,1,0.3,1)]">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-24 h-24 rounded-3xl p-1 bg-gradient-to-tr from-brand-800 via-brand-600 to-amber-500 shadow-2xl shadow-brand-900/40 flex items-center justify-center mb-5 hover:scale-105 transition-transform">
            <div className="w-full h-full bg-white rounded-[22px] flex items-center justify-center p-2 shadow-inner">
              <img
                src="/logo.png"
                alt="St. Kidane Mehret Church Logo"
                className="w-full h-full object-contain filter drop-shadow"
              />
            </div>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 mb-1">
            {t("app.name")}
          </h1>
          <p className="text-amber-700 font-bold text-xs uppercase tracking-widest">
            {t("app.subtitle")}
          </p>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 border border-brand-200/60 text-brand-700 text-[11px] font-bold mt-3">
            <Crown className="w-3.5 h-3.5 text-amber-500" />
            System Initialization
          </div>
        </div>

        {/* Glass Card Form */}
        <div className="glass-panel p-8 md:p-10 border border-white/80 shadow-2xl shadow-brand-950/10">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 text-red-600 text-sm font-medium border border-red-100 animate-[fade-in_0.3s]">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Full Name */}
            <div className="space-y-2">
              <label className="text-sm font-semibold tracking-wide text-slate-700">
                Full Name
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-brand-600 transition-colors">
                  <UserPlus className="h-5 w-5" />
                </div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-white/50 border border-slate-200 rounded-xl outline-none focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-500/10 transition-all font-medium text-slate-800 placeholder:text-slate-400"
                  placeholder="Administrator full name"
                  required
                />
              </div>
            </div>

            {/* Username */}
            <div className="space-y-2">
              <label className="text-sm font-semibold tracking-wide text-slate-700">
                Username
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-brand-600 transition-colors">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-white/50 border border-slate-200 rounded-xl outline-none focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-500/10 transition-all font-medium text-slate-800 placeholder:text-slate-400"
                  placeholder="Unique login username"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="text-sm font-semibold tracking-wide text-slate-700">
                Password
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-brand-600 transition-colors">
                  <KeyRound className="h-5 w-5" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-white/50 border border-slate-200 rounded-xl outline-none focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-500/10 transition-all font-medium text-slate-800 placeholder:text-slate-400"
                  placeholder="Minimum 8 characters"
                  required
                />
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <label className="text-sm font-semibold tracking-wide text-slate-700">
                Confirm Password
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-brand-600 transition-colors">
                  <KeyRound className="h-5 w-5" />
                </div>
                <input
                  type="password"
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-white/50 border border-slate-200 rounded-xl outline-none focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-500/10 transition-all font-medium text-slate-800 placeholder:text-slate-400"
                  placeholder="Retype password"
                  required
                />
              </div>
            </div>

            {/* Security Question */}
            <div className="space-y-2">
              <label className="text-sm font-semibold tracking-wide text-slate-700">
                Security Question
              </label>
              <input
                type="text"
                value={securityQuestion}
                onChange={(e) => setSecurityQuestion(e.target.value)}
                className="w-full px-4 py-3.5 bg-white/50 border border-slate-200 rounded-xl outline-none focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-500/10 transition-all font-medium text-slate-800 placeholder:text-slate-400"
                placeholder="e.g. What is your mother's maiden name?"
                required
              />
            </div>

            {/* Security Answer */}
            <div className="space-y-2">
              <label className="text-sm font-semibold tracking-wide text-slate-700">
                Security Answer
              </label>
              <input
                type="text"
                value={securityAnswer}
                onChange={(e) => setSecurityAnswer(e.target.value)}
                className="w-full px-4 py-3.5 bg-white/50 border border-slate-200 rounded-xl outline-none focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-500/10 transition-all font-medium text-slate-800 placeholder:text-slate-400"
                placeholder="Answer used to recover account"
                required
              />
            </div>

            {/* Role */}
            <div className="space-y-2">
              <label className="text-sm font-semibold tracking-wide text-slate-700">
                Initial Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-4 py-3.5 bg-white/50 border border-slate-200 rounded-xl outline-none focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-500/10 transition-all font-medium text-slate-800"
                required
              >
                {Object.entries(roles).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full relative flex items-center justify-center gap-2 py-4 mt-2 font-bold text-white rounded-xl bg-gradient-to-r from-brand-600 to-brand-800 hover:from-brand-500 hover:to-brand-700 shadow-lg shadow-brand-500/30 hover:shadow-brand-500/50 hover:-translate-y-0.5 transition-all outline-none focus:ring-4 focus:ring-brand-500/30 overflow-hidden group disabled:opacity-70 disabled:hover:translate-y-0 disabled:hover:shadow-brand-500/30"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <span className="tracking-wide">Initialize System</span>
                  <Crown className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-xs text-slate-400">
              This creates the first system administrator. Other users can be registered afterwards.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
