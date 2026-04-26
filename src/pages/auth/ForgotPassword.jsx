import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { KeyRound, ShieldCheck, ArrowLeft, Send, AlertCircle, CheckCircle2 } from 'lucide-react';
import { userService } from '../../services/userService';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Username, 2: Security Q, 3: Success
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    username: '',
    security_answer: '',
    new_password: '',
    new_password_confirmation: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await userService.forgotPassword({
        username: formData.username,
        security_answer: formData.security_answer,
        new_password: formData.new_password,
        new_password_confirmation: formData.new_password_confirmation
      });
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.error || 'Validation failed. Check your security answer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-brand-100 via-slate-50 to-white">
      <div className="w-full max-w-md animate-[slide-up_0.5s_ease-out]">
        <Link to="/" className="inline-flex items-center gap-2 text-sm font-black text-brand-600 uppercase tracking-widest mb-8 hover:translate-x-[-4px] transition-transform">
          <ArrowLeft className="w-4 h-4" /> Back to Login
        </Link>
        
        <div className="glass-panel p-10">
          <div className="text-center mb-10">
            <div className="mx-auto w-16 h-16 bg-brand-50 rounded-2xl flex items-center justify-center mb-4">
              <ShieldCheck className="w-8 h-8 text-brand-600" />
            </div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Access Recovery</h2>
            <p className="text-slate-500 font-medium text-sm mt-1">Verify identity to reset passcode</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-700 text-sm font-bold">
              <AlertCircle className="w-5 h-5" />
              {error}
            </div>
          )}

          {step === 1 ? (
             <div className="space-y-6">
                <div>
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Identification ID</label>
                   <input 
                     type="text" 
                     placeholder="Enter your username"
                     value={formData.username}
                     onChange={e => setFormData({...formData, username: e.target.value})}
                     className="w-full p-4 bg-white border border-slate-200 rounded-2xl font-bold outline-none focus:border-brand-500 transition-all text-sm"
                   />
                </div>
                <button 
                  onClick={() => formData.username ? setStep(2) : setError('Identification required.')}
                  className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
                >
                  Confirm Identity
                </button>
             </div>
          ) : step === 2 ? (
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Security Answer</label>
                  <input 
                    type="password" 
                    placeholder="Provide secret answer"
                    value={formData.security_answer}
                    onChange={e => setFormData({...formData, security_answer: e.target.value})}
                    className="w-full p-4 bg-white border border-slate-200 rounded-2xl font-bold outline-none focus:border-brand-500 transition-all text-sm"
                  />
                </div>
                <div className="h-px bg-slate-100 w-full my-2"></div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 text-brand-600">New Secure Passcode</label>
                  <input 
                    type="password" 
                    placeholder="Minimum 8 characters"
                    value={formData.new_password}
                    onChange={e => setFormData({...formData, new_password: e.target.value})}
                    className="w-full p-4 bg-white border border-slate-200 rounded-2xl font-bold outline-none focus:border-brand-500 transition-all text-sm"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Retype Passcode</label>
                  <input 
                    type="password" 
                    placeholder="Must match exactly"
                    value={formData.new_password_confirmation}
                    onChange={e => setFormData({...formData, new_password_confirmation: e.target.value})}
                    className="w-full p-4 bg-white border border-slate-200 rounded-2xl font-bold outline-none focus:border-brand-500 transition-all text-sm"
                  />
                </div>
                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-brand-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-brand-700 transition-all shadow-xl shadow-brand-200 flex items-center justify-center gap-2"
                >
                  {loading ? <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-white"></div> : <><KeyRound className="w-5 h-5" /> Reset Passcode</>}
                </button>
            </form>
          ) : (
            <div className="text-center py-4 space-y-6">
               <div className="mx-auto w-20 h-20 bg-green-50 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-10 h-10 text-green-500" />
               </div>
               <h3 className="text-xl font-black text-slate-800">Passcode Reset Complete</h3>
               <p className="text-slate-500 font-medium">Your identity has been re-authorized. You can now login with your new key.</p>
               <Link to="/login" className="block w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-slate-800 transition-all">
                  Return to Dashboard
               </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
