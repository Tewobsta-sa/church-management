import { useState, useEffect } from "react";
import { X, Save, Lock, Shield, Settings } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

export default function ProfileModal({ isOpen, onClose }) {
  const { user, login } = useAuth(); // We might need to refresh user context after updating name
  const [activeTab, setActiveTab] = useState("general");
  
  const [generalData, setGeneralData] = useState({
    name: "",
    username: ""
  });

  const [passwordData, setPasswordData] = useState({
    current_password: "",
    password: "",
    password_confirmation: ""
  });

  const [securityData, setSecurityData] = useState({
    security_question: "",
    security_answer: "",
    password: "" // password needed to verify identity
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user && isOpen) {
      setGeneralData({
        name: user.name || "",
        username: user.username || "",
      });
      setPasswordData({ current_password: "", password: "", password_confirmation: "" });
      setSecurityData({ security_question: user.security_question || "", security_answer: "", password: "" });
      setActiveTab("general");
    }
  }, [user, isOpen]);

  const handleUpdate = async (path, data) => {
    setIsSubmitting(true);
    try {
      const response = await api.post(path, data);
      alert(response.data.message || "Profile updated successfully!");
      if (path === "/profile/info") {
         // Reload page to reflect new name in context
         window.location.reload(); 
      }
      onClose();
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.message || "Operation failed";
      alert(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden flex flex-col shadow-2xl">
        <div className="px-6 py-5 border-b flex items-center justify-between">
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <Settings className="w-5 h-5 text-brand-600" /> My Profile
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 bg-gray-100/50 p-2 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex border-b">
           <button onClick={() => setActiveTab("general")} className={`flex-1 py-3 text-sm font-bold flex justify-center items-center gap-2 transition-colors ${activeTab === 'general' ? 'text-brand-600 border-b-2 border-brand-600' : 'text-slate-500 hover:bg-slate-50'}`}>
              <Settings className="h-4 w-4" /> Info
           </button>
           <button onClick={() => setActiveTab("password")} className={`flex-1 py-3 text-sm font-bold flex justify-center items-center gap-2 transition-colors ${activeTab === 'password' ? 'text-brand-600 border-b-2 border-brand-600' : 'text-slate-500 hover:bg-slate-50'}`}>
              <Lock className="h-4 w-4" /> Password
           </button>
           <button onClick={() => setActiveTab("security")} className={`flex-1 py-3 text-sm font-bold flex justify-center items-center gap-2 transition-colors ${activeTab === 'security' ? 'text-brand-600 border-b-2 border-brand-600' : 'text-slate-500 hover:bg-slate-50'}`}>
              <Shield className="h-4 w-4" /> Security
           </button>
        </div>

        <div className="p-6">
           {activeTab === 'general' && (
             <form onSubmit={(e) => { e.preventDefault(); handleUpdate("/profile/info", generalData); }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-700">Full Name</label>
                  <input required placeholder="Enter full name" type="text" value={generalData.name} onChange={(e) => setGeneralData({...generalData, name: e.target.value})} className="w-full px-4 py-3 border rounded-xl focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-700">Username</label>
                  <input required placeholder="Enter username" type="text" value={generalData.username} onChange={(e) => setGeneralData({...generalData, username: e.target.value})} className="w-full px-4 py-3 border rounded-xl focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none" />
                </div>
                <button type="submit" disabled={isSubmitting} className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-3 rounded-xl disabled:opacity-50 mt-4 transition-colors">
                  {isSubmitting ? "Updating..." : "Save Information"}
                </button>
             </form>
           )}

           {activeTab === 'password' && (
             <form onSubmit={(e) => { e.preventDefault(); handleUpdate("/profile/password", passwordData); }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-700">Current Password</label>
                  <input required type="password" value={passwordData.current_password} onChange={(e) => setPasswordData({...passwordData, current_password: e.target.value})} className="w-full px-4 py-3 border rounded-xl focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-700">New Password</label>
                  <input required type="password" value={passwordData.password} onChange={(e) => setPasswordData({...passwordData, password: e.target.value})} className="w-full px-4 py-3 border rounded-xl focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-700">Confirm New Password</label>
                  <input required type="password" value={passwordData.password_confirmation} onChange={(e) => setPasswordData({...passwordData, password_confirmation: e.target.value})} className="w-full px-4 py-3 border rounded-xl focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none" />
                </div>
                <button type="submit" disabled={isSubmitting} className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-3 rounded-xl disabled:opacity-50 mt-4 transition-colors">
                  {isSubmitting ? "Updating..." : "Update Password"}
                </button>
             </form>
           )}

           {activeTab === 'security' && (
             <form onSubmit={(e) => { e.preventDefault(); handleUpdate("/profile/security", securityData); }} className="space-y-4">
               <div>
                  <label className="block text-sm font-medium mb-1 text-slate-700">Verify Current Password</label>
                  <input required type="password" placeholder="Enter your current password" value={securityData.password} onChange={(e) => setSecurityData({...securityData, password: e.target.value})} className="w-full px-4 py-3 border rounded-xl focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none mb-4 bg-slate-50" />
                </div>
                <hr className="mb-4" />
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-700">New Security Question</label>
                  <input required type="text" placeholder="e.g., What was your childhood nickname?" value={securityData.security_question} onChange={(e) => setSecurityData({...securityData, security_question: e.target.value})} className="w-full px-4 py-3 border rounded-xl focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-700">Security Answer</label>
                  <input required type="text" placeholder="Enter answer" value={securityData.security_answer} onChange={(e) => setSecurityData({...securityData, security_answer: e.target.value})} className="w-full px-4 py-3 border rounded-xl focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none" />
                </div>
                <button type="submit" disabled={isSubmitting} className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-3 rounded-xl disabled:opacity-50 mt-4 transition-colors">
                  {isSubmitting ? "Updating..." : "Update Security Settings"}
                </button>
             </form>
           )}
        </div>
      </div>
    </div>
  );
}
