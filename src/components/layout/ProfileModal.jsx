import { useState, useEffect } from "react";
import { X, Lock, Shield, Settings } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/AuthContext";
import { useFeedback } from "../../context/FeedbackContext";
import { userService } from "../../services/userService";

export default function ProfileModal({ isOpen, onClose }) {
  const { user } = useAuth();
  const { notify } = useFeedback();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("general");

  const [generalData, setGeneralData] = useState({ name: "" });

  const [passwordData, setPasswordData] = useState({
    current_password: "",
    password: "",
    password_confirmation: ""
  });

  const [securityData, setSecurityData] = useState({
    security_question: "",
    security_answer: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user && isOpen) {
      setGeneralData({ name: user.name || "" });
      setPasswordData({ current_password: "", password: "", password_confirmation: "" });
      setSecurityData({ security_question: user.security_question || "", security_answer: "" });
      setActiveTab("general");
    }
  }, [user, isOpen]);

  const handleUpdate = async (data, { reload = false } = {}) => {
    setIsSubmitting(true);
    try {
      const response = await userService.updateProfile(data);
      notify(response.message || "Profile updated successfully!", "success");
      onClose();
      if (reload) window.location.reload();
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.message || "Operation failed";
      notify(msg, "error");
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
            <Settings className="w-5 h-5 text-brand-600" /> {t("profile.title")}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 bg-gray-100/50 p-2 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex border-b">
           <button onClick={() => setActiveTab("general")} className={`flex-1 py-3 text-sm font-bold flex justify-center items-center gap-2 transition-colors ${activeTab === 'general' ? 'text-brand-600 border-b-2 border-brand-600' : 'text-slate-500 hover:bg-slate-50'}`}>
              <Settings className="h-4 w-4" /> {t("profile.info")}
           </button>
           <button onClick={() => setActiveTab("password")} className={`flex-1 py-3 text-sm font-bold flex justify-center items-center gap-2 transition-colors ${activeTab === 'password' ? 'text-brand-600 border-b-2 border-brand-600' : 'text-slate-500 hover:bg-slate-50'}`}>
              <Lock className="h-4 w-4" /> {t("profile.password")}
           </button>
           <button onClick={() => setActiveTab("security")} className={`flex-1 py-3 text-sm font-bold flex justify-center items-center gap-2 transition-colors ${activeTab === 'security' ? 'text-brand-600 border-b-2 border-brand-600' : 'text-slate-500 hover:bg-slate-50'}`}>
              <Shield className="h-4 w-4" /> {t("profile.security")}
           </button>
        </div>

        <div className="p-6">
           {activeTab === 'general' && (
             <form onSubmit={(e) => { e.preventDefault(); handleUpdate({ name: generalData.name }, { reload: true }); }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-700">{t("profile.fullName")}</label>
                  <input required placeholder={t("profile.fullNamePlaceholder")} type="text" value={generalData.name} onChange={(e) => setGeneralData({ name: e.target.value })} className="w-full px-4 py-3 border rounded-xl focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-700">{t("profile.username")}</label>
                  <input type="text" value={user?.username || ""} readOnly disabled title={t("profile.usernameLocked")} className="w-full px-4 py-3 border rounded-xl bg-slate-100 text-slate-500 cursor-not-allowed outline-none" />
                  <p className="text-xs text-slate-400 mt-1">{t("profile.usernameLocked")}</p>
                </div>
                <button type="submit" disabled={isSubmitting} className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-3 rounded-xl disabled:opacity-50 mt-4 transition-colors">
                  {isSubmitting ? t("profile.updating") : t("profile.saveInfo")}
                </button>
             </form>
           )}

           {activeTab === 'password' && (
             <form onSubmit={(e) => { e.preventDefault(); handleUpdate(passwordData); }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-700">{t("profile.currentPassword")}</label>
                  <input required type="password" value={passwordData.current_password} onChange={(e) => setPasswordData({...passwordData, current_password: e.target.value})} className="w-full px-4 py-3 border rounded-xl focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-700">{t("profile.newPassword")}</label>
                  <input required type="password" minLength={8} value={passwordData.password} onChange={(e) => setPasswordData({...passwordData, password: e.target.value})} className="w-full px-4 py-3 border rounded-xl focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-700">{t("profile.confirmNewPassword")}</label>
                  <input required type="password" value={passwordData.password_confirmation} onChange={(e) => setPasswordData({...passwordData, password_confirmation: e.target.value})} className="w-full px-4 py-3 border rounded-xl focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none" />
                </div>
                <button type="submit" disabled={isSubmitting} className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-3 rounded-xl disabled:opacity-50 mt-4 transition-colors">
                  {isSubmitting ? t("profile.updating") : t("profile.updatePassword")}
                </button>
             </form>
           )}

           {activeTab === 'security' && (
             <form onSubmit={(e) => { e.preventDefault(); handleUpdate(securityData); }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-700">{t("profile.securityQuestion")}</label>
                  <input required type="text" placeholder={t("profile.securityQuestionPlaceholder")} value={securityData.security_question} onChange={(e) => setSecurityData({...securityData, security_question: e.target.value})} className="w-full px-4 py-3 border rounded-xl focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-700">{t("profile.securityAnswer")}</label>
                  <input required type="text" placeholder={t("profile.securityAnswerPlaceholder")} value={securityData.security_answer} onChange={(e) => setSecurityData({...securityData, security_answer: e.target.value})} className="w-full px-4 py-3 border rounded-xl focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none" />
                  <p className="text-xs text-slate-400 mt-1">{t("profile.securityAnswerHint")}</p>
                </div>
                <button type="submit" disabled={isSubmitting} className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-3 rounded-xl disabled:opacity-50 mt-4 transition-colors">
                  {isSubmitting ? t("profile.updating") : t("profile.updateSecurity")}
                </button>
             </form>
           )}
        </div>
      </div>
    </div>
  );
}
