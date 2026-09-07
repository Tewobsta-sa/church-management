import { useState, useEffect } from "react";
import { Download, X, Smartphone, Share, PlusSquare, Check } from "lucide-react";

export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showIosInstructions, setShowIosInstructions] = useState(false);

  useEffect(() => {
    // Check if already in standalone mode (already installed)
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone;
    if (isStandalone) {
      return;
    }

    // Check if device is iOS (Safari)
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIos(isIosDevice);

    // Listen for beforeinstallprompt (Android / Chrome)
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Check if user dismissed recently
      const dismissedUntil = localStorage.getItem("jkm_pwa_dismissed");
      if (!dismissedUntil || Date.now() > parseInt(dismissedUntil)) {
        setShowPrompt(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    // For iOS users who haven't dismissed
    if (isIosDevice) {
      const dismissedUntil = localStorage.getItem("jkm_pwa_dismissed");
      if (!dismissedUntil || Date.now() > parseInt(dismissedUntil)) {
        setShowPrompt(true);
      }
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIos) {
      setShowIosInstructions(true);
      return;
    }

    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // Remember dismissal for 2 days
    localStorage.setItem("jkm_pwa_dismissed", (Date.now() + 2 * 24 * 60 * 60 * 1000).toString());
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-50 animate-[slide-up_0.3s_ease-out]">
      <div className="bg-gradient-to-r from-brand-950 via-slate-900 to-brand-900 text-white rounded-3xl p-4 shadow-2xl border border-gold-500/30 backdrop-blur-xl flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/10 border border-gold-400/40 p-1 flex items-center justify-center shrink-0 shadow-md">
              <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h4 className="font-black text-sm text-white flex items-center gap-1.5 leading-snug">
                <span>ጃቴ ኪዳነ ምሕረት መተግበሪያ</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-gold-400 text-slate-950 font-black">
                  FREE
                </span>
              </h4>
              <p className="text-[11px] text-brand-200 font-medium">
                ለፈጣን የካሜራ ስካነር እና መገኘት በስልክዎ ይጫኑ
              </p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-slate-400 hover:text-white p-1 rounded-full transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* iOS Step-by-step instruction helper */}
        {showIosInstructions ? (
          <div className="bg-white/10 rounded-2xl p-3 text-xs space-y-2 text-brand-100 border border-white/10">
            <p className="font-bold text-gold-300">በ iPhone/iPad ላይ ለመጫን፡</p>
            <ol className="list-decimal list-inside space-y-1 text-[11px]">
              <li className="flex items-center gap-1">
                በ Safari ግርጌ የሚገኘውን <Share className="w-3.5 h-3.5 text-blue-400" /> Share ይንኩ
              </li>
              <li className="flex items-center gap-1">
                ወደ ታች ዝቅ ብለው <PlusSquare className="w-3.5 h-3.5 text-slate-200" /> "Add to Home Screen" ይምረጡ
              </li>
              <li className="flex items-center gap-1">
                ከላይ በቀኝ በኩል "Add" የሚለውን ይጫኑ
              </li>
            </ol>
            <button
              onClick={() => setShowIosInstructions(false)}
              className="w-full py-1.5 bg-brand-700 hover:bg-brand-600 rounded-xl text-white font-bold text-[11px] mt-1"
            >
              ተረድቻለሁ (Got it)
            </button>
          </div>
        ) : (
          <div className="flex gap-2 pt-1">
            <button
              onClick={handleDismiss}
              className="flex-1 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-white/5 transition-all"
            >
              አሁን አይደለም (Later)
            </button>
            <button
              onClick={handleInstallClick}
              className="flex-1 py-2 px-4 rounded-xl text-xs font-black bg-gradient-to-r from-gold-500 to-amber-500 hover:from-gold-400 hover:to-amber-400 text-slate-950 flex items-center justify-center gap-1.5 shadow-lg shadow-gold-500/20 hover:scale-[1.02] transition-all"
            >
              <Smartphone className="w-3.5 h-3.5 text-slate-950" />
              መተግበሪያውን ጫን (Install)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
