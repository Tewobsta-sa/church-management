import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Crown, KeyRound, UserCircle2, ArrowRight } from "lucide-react";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      const data = await login(username, password);

      if (data?.access_token) {
        navigate("/");
      } else {
        setError("Invalid login credentials.");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Login failed due to server error.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-50 flex items-center justify-center relative overflow-hidden font-sans selection:bg-brand-200">
      
      {/* Immersive Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-20%] right-[-10%] w-[70vw] h-[70vw] rounded-full bg-brand-400 mix-blend-multiply opacity-20 filter blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-[-20%] left-[-10%] w-[60vw] h-[60vw] rounded-full bg-brand-600 mix-blend-multiply opacity-20 filter blur-[120px]"></div>
      </div>

      <div className="z-10 w-full max-w-[420px] px-6 animate-[slide-up_0.6s_cubic-bezier(0.16,1,0.3,1)]">
        {/* Brand Header */}
        <div className="text-center mb-10">
          <div className="mx-auto w-20 h-20 bg-gradient-to-tr from-brand-500 to-brand-700 rounded-2xl flex items-center justify-center shadow-xl shadow-brand-500/30 mb-6 rotate-3">
             <Crown className="w-10 h-10 text-white drop-shadow-md -rotate-3" />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-800 mb-2">MGT System</h1>
          <p className="text-slate-500 font-medium">Secure Administrative Login</p>
        </div>

        {/* Glass Card Form */}
        <div className="glass-panel p-8 md:p-10">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 text-red-600 text-sm font-medium border border-red-100 flex items-start animate-[fade-in_0.3s]">
               <span className="shrink-0 mt-0.5 mr-2">⚠️</span>
               <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold tracking-wide text-slate-700">Username / ID</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-brand-600 transition-colors">
                  <UserCircle2 className="h-5 w-5" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-white/50 border border-slate-200 rounded-xl outline-none focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-500/10 transition-all font-medium text-slate-800 placeholder:text-slate-400"
                  placeholder="Enter administrative ID"
                  required
                  autoComplete="username"
                  autoFocus
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="flex justify-between text-sm font-semibold tracking-wide text-slate-700">
                <span>Passcode</span>
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
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
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
                  <span className="tracking-wide">Authorize Access</span>
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
    </div>
  );
}
