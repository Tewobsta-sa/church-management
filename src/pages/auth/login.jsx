import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { Crown, KeyRound, UserCircle2, ArrowRight, Eye, EyeOff, X, HelpCircle, CheckCircle2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { getDefaultRouteForRole, getPrimaryRole } from "../../App";

export default function Login() {
  const { t } = useTranslation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Forgot password modal state
  const [forgotPasswordModal, setForgotPasswordModal] = useState(false);
  const [resetAccount, setResetAccount] = useState("");
  const [resetSubmitted, setResetSubmitted] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      const data = await login(username, password);

      if (data?.access_token) {
        const userRole = data?.role || getPrimaryRole(data?.user);
        const destination = getDefaultRouteForRole(userRole);
        navigate(destination, { replace: true });
      } else {
        setError(t("auth.invalidCredentials"));
      }
    } catch (err) {
      setError(err.response?.data?.message || t("auth.loginFailed"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetSubmit = (e) => {
    e.preventDefault();
    if (!resetAccount.trim()) return;
    setResetSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-surface-50 flex items-center justify-center relative overflow-hidden font-sans selection:bg-brand-200">
      
      {/* Immersive Background */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-25%] right-[-15%] w-[65vw] h-[65vw] rounded-full bg-brand-500/15 filter blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-20%] left-[-15%] w-[60vw] h-[60vw] rounded-full bg-amber-500/10 filter blur-[130px]"></div>
      </div>

      <div className="z-10 w-full max-w-[440px] px-6 animate-[slide-up_0.6s_cubic-bezier(0.16,1,0.3,1)]">
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
            <span className="w-2 h-2 rounded-full bg-brand-600 animate-ping"></span>
            {t("auth.adminLogin")}
          </div>
        </div>

        {/* Glass Card Form */}
        <div className="glass-panel p-8 md:p-10 border border-white/80 shadow-2xl shadow-brand-950/10">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 text-red-600 text-sm font-medium border border-red-100 flex items-start animate-[fade-in_0.3s]">
               <span className="shrink-0 mt-0.5 mr-2">⚠️</span>
               <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold tracking-wide text-slate-700">{t("auth.username")}</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-brand-600 transition-colors">
                  <UserCircle2 className="h-5 w-5" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-white/50 border border-slate-200 rounded-xl outline-none focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-500/10 transition-all font-medium text-slate-800 placeholder:text-slate-400"
                  placeholder={t("auth.usernamePlaceholder")}
                  required
                  autoComplete="username"
                  autoFocus
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm font-semibold tracking-wide text-slate-700">
                <span>{t("auth.password")}</span>
                <button
                  type="button"
                  onClick={() => {
                    setForgotPasswordModal(true);
                    setResetSubmitted(false);
                    setResetAccount(username || "");
                  }}
                  className="text-xs text-brand-700 hover:text-brand-800 hover:underline font-bold transition-all focus:outline-none"
                >
                  {t("auth.forgotPassword")}
                </button>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-brand-600 transition-colors">
                  <KeyRound className="h-5 w-5" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-11 py-3.5 bg-white/50 border border-slate-200 rounded-xl outline-none focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-500/10 transition-all font-medium text-slate-800 placeholder:text-slate-400"
                  placeholder={t("auth.passwordPlaceholder")}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-brand-600 focus:outline-none transition-colors"
                  tabIndex={-1}
                  aria-label={showPassword ? t("auth.hidePassword") : t("auth.showPassword")}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-brand-600" />
                  ) : (
                    <Eye className="h-5 w-5 hover:text-slate-600" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full relative flex items-center justify-center gap-2 py-4 mt-2 font-bold text-white rounded-xl bg-gradient-to-r from-brand-600 to-brand-800 hover:from-brand-500 hover:to-brand-700 shadow-lg shadow-brand-500/30 hover:shadow-brand-500/50 hover:-translate-y-0.5 transition-all outline-none focus:ring-4 focus:ring-brand-500/30 overflow-hidden group disabled:opacity-70 disabled:hover:translate-y-0 disabled:hover:shadow-brand-500/30"
            >
              {isLoading ? (
                 <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <span className="tracking-wide">{t("auth.signIn")}</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
          
          <div className="mt-8 text-center">
            <p className="text-xs text-slate-400">Restricted system. Authorized personnel only.</p>
          </div>
        </div>
      </div>

      {/* ── FORGOT PASSWORD MODAL ── */}
      {forgotPasswordModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-[fade-in_0.2s_ease-out]">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md border border-slate-100 overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-brand-900 via-brand-800 to-brand-950 text-white">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white p-1 flex items-center justify-center shadow-xs shrink-0">
                  <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
                </div>
                <div>
                  <h3 className="font-black text-sm uppercase tracking-wide text-white">
                    {t("auth.forgotPasswordTitle")}
                  </h3>
                  <p className="text-amber-300 text-[10px] font-bold uppercase tracking-wider">
                    {t("app.name")}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setForgotPasswordModal(false)}
                className="p-1.5 hover:bg-white/10 rounded-xl transition-colors text-white/80 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5">
              {resetSubmitted ? (
                <div className="space-y-4 text-center py-4">
                  <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="font-black text-slate-900 text-base">Request Submitted</h4>
                    <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                      {t("auth.requestSubmitted")}
                    </p>
                  </div>
                  <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200/70 text-[11px] font-bold text-amber-800 text-left">
                    💡 {t("auth.adminContactHint")}
                  </div>
                  <button
                    type="button"
                    onClick={() => setForgotPasswordModal(false)}
                    className="w-full py-3 bg-brand-800 hover:bg-brand-900 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-brand-900/20"
                  >
                    {t("common.close")}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleResetSubmit} className="space-y-4">
                  <p className="text-xs text-slate-600 leading-relaxed font-medium">
                    {t("auth.forgotPasswordDesc")}
                  </p>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">
                      {t("auth.username")} / Email
                    </label>
                    <input
                      type="text"
                      required
                      value={resetAccount}
                      onChange={(e) => setResetAccount(e.target.value)}
                      placeholder="e.g. admin or your-email@church.org"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 outline-none focus:border-brand-600 focus:bg-white text-xs"
                      autoFocus
                    />
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-[11px] text-slate-500 space-y-1 font-medium">
                    <p className="font-bold text-slate-700">📌 Password Reset Policy:</p>
                    <p>• Only Sunday School Super Administrators have authorization to reset personnel passwords.</p>
                    <p>• A temporary password will be provided upon verification of identity.</p>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setForgotPasswordModal(false)}
                      className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
                    >
                      {t("common.cancel")}
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-3 bg-gradient-to-r from-brand-700 to-brand-900 hover:from-brand-600 hover:to-brand-800 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-brand-900/20"
                    >
                      {t("auth.requestReset")}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

