import { useState } from 'react';
import { Lock, User, LifeBuoy, ShieldCheck, Save, AlertCircle, CheckCircle2, KeyRound } from 'lucide-react';
import { userService } from '../../services/userService';
import { useAuth } from '../../context/AuthContext';

export default function SecuritySettings() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [formData, setFormData] = useState({
    name: user?.name || '',
    username: user?.username || '',
    current_password: '',
    password: '',
    password_confirmation: '',
    security_question: user?.security_question || '',
    security_answer: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      await userService.updateProfile(formData);
      setMessage({ type: 'success', text: 'Profile and security settings updated successfully!' });
      // Reset sensitive fields
      setFormData(prev => ({ ...prev, current_password: '', password: '', password_confirmation: '', security_answer: '' }));
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Update failed. Check your current password.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-[fade-in_0.4s_ease-out]">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Security & Profile</h1>
          <p className="text-slate-500 font-medium mt-1">Manage your identity, access keys, and recovery options</p>
        </div>
        <div className="p-2 bg-brand-50 rounded-2xl border border-brand-100">
           <ShieldCheck className="w-8 h-8 text-brand-600" />
        </div>
      </div>

      {message.text && (
        <div className={`p-4 rounded-2xl flex items-center gap-3 border ${message.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
          {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <p className="font-bold text-sm tracking-tight">{message.text}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Info */}
        <div className="lg:col-span-2 space-y-6">
           <div className="glass-panel p-8">
              <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs flex items-center gap-2 mb-6">
                 <User className="w-4 h-4 text-brand-600" /> Identity Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Display Name</label>
                    <input 
                      type="text" 
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold focus:border-brand-500 outline-none transition-all"
                    />
                 </div>
                 <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Username</label>
                    <input 
                      type="text" 
                      value={formData.username}
                      onChange={e => setFormData({...formData, username: e.target.value})}
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold focus:border-brand-500 outline-none transition-all"
                    />
                 </div>
              </div>
           </div>

           {/* Security Question */}
           <div className="glass-panel p-8 border-l-4 border-l-amber-500">
              <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs flex items-center gap-2 mb-6">
                 <LifeBuoy className="w-4 h-4 text-amber-500" /> Recovery Option
              </h3>
              <p className="text-sm text-slate-500 font-medium mb-6">This question will be used to verify your identity if you forget your password.</p>
              <div className="space-y-6">
                 <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Security Question</label>
                    <input 
                      type="text" 
                      placeholder="e.g. What is your grandmother's maiden name?"
                      value={formData.security_question}
                      onChange={e => setFormData({...formData, security_question: e.target.value})}
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold focus:border-brand-500 outline-none transition-all"
                    />
                 </div>
                 <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Secret Answer</label>
                    <input 
                      type="password" 
                      placeholder="••••••••"
                      value={formData.security_answer}
                      onChange={e => setFormData({...formData, security_answer: e.target.value})}
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold focus:border-brand-500 outline-none transition-all"
                    />
                 </div>
              </div>
           </div>
        </div>

        {/* Password Update */}
        <div className="space-y-6 text-slate-100">
           <div className="bg-slate-900 rounded-[2.5rem] p-8 shadow-2xl shadow-slate-200 border border-slate-800">
              <h3 className="font-black text-white uppercase tracking-widest text-[10px] flex items-center gap-2 mb-8">
                 <Lock className="w-4 h-4 text-brand-400" /> Change Password
              </h3>
              <div className="space-y-6">
                 <div>
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-2">Existing Password</label>
                    <input 
                      type="password" 
                      value={formData.current_password}
                      onChange={e => setFormData({...formData, current_password: e.target.value})}
                      className="w-full p-3.5 bg-white/5 border border-white/10 rounded-xl font-bold text-white focus:bg-white/10 outline-none transition-all text-sm"
                    />
                 </div>
                 <div className="h-px bg-white/5 w-full"></div>
                 <div>
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-2 text-brand-400">New Vault Key</label>
                    <input 
                      type="password" 
                      value={formData.password}
                      onChange={e => setFormData({...formData, password: e.target.value})}
                      className="w-full p-3.5 bg-white/5 border border-white/10 rounded-xl font-bold text-white focus:bg-white/10 outline-none transition-all text-sm"
                    />
                 </div>
                 <div>
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-2">Confirm Key</label>
                    <input 
                      type="password" 
                      value={formData.password_confirmation}
                      onChange={e => setFormData({...formData, password_confirmation: e.target.value})}
                      className="w-full p-3.5 bg-white/10 border border-white/20 rounded-xl font-bold text-white focus:bg-white/20 outline-none transition-all text-sm"
                    />
                 </div>
              </div>
           </div>

           <button 
             type="submit"
             disabled={loading}
             className="w-full bg-brand-600 hover:bg-brand-700 text-white p-5 rounded-3xl font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-brand-200 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
           >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white"></div>
              ) : (
                <><Save className="w-5 h-5" /> Commit Changes</>
              )}
           </button>
        </div>
      </form>
    </div>
  );
}
