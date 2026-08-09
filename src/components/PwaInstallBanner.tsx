import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Download, Smartphone, X, Sparkles, CheckCircle, ArrowLeft } from "lucide-react";

interface PwaInstallBannerProps {
  appName?: string;
  logoUrl?: string;
  onOpenModal?: () => void;
}

export default function PwaInstallBanner({ appName = "دست اول", logoUrl, onOpenModal }: PwaInstallBannerProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if running in standalone mode
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // Check if dismissed in this session or permanently
    const dismissed = localStorage.getItem("pwa_banner_dismissed_permanently") || sessionStorage.getItem("pwa_banner_dismissed");
    if (dismissed) return;

    // Show banner after 20 seconds of calm browsing
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 20000);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsVisible(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsVisible(false);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallShortcut = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
      setIsVisible(false);
      sessionStorage.setItem("pwa_banner_dismissed", "true");
    } else {
      // Open detailed instructions modal (especially for iOS or manual install)
      if (onOpenModal) onOpenModal();
      setIsVisible(false);
      sessionStorage.setItem("pwa_banner_dismissed", "true");
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    sessionStorage.setItem("pwa_banner_dismissed", "true");
    localStorage.setItem("pwa_banner_dismissed_permanently", "true");
  };

  if (!isVisible || isInstalled) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 100, opacity: 0, scale: 0.95 }}
        className="fixed bottom-20 left-3 right-3 sm:bottom-6 sm:left-auto sm:right-6 sm:max-w-md z-[9999] bg-slate-900/95 text-white p-4 rounded-3xl border border-amber-500/30 shadow-2xl backdrop-blur-2xl flex items-center justify-between gap-3 text-right"
        dir="rtl"
      >
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-2 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/20">
            <img
              src={logoUrl || "/assets/logo.svg"}
              alt={appName}
              className="w-full h-full object-contain filter drop-shadow"
            />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black text-white">نصب اپلیکیشن {appName}</span>
              <span className="px-2 py-0.2 rounded-full bg-amber-500/20 text-amber-300 text-[9px] font-black border border-amber-500/30">
                PWA نسخه وب
              </span>
            </div>
            <p className="text-[11px] text-slate-300 font-bold mt-0.5 line-clamp-1">
              ایجاد میانبر روی گوشی یا دسکتاپ بدون اشغال حافظه
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleInstallShortcut}
            className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
          >
            <Download size={14} />
            <span>نصب میانبر</span>
          </button>

          <button
            onClick={handleDismiss}
            className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-red-600/80 border border-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition-all cursor-pointer shrink-0"
            title="بستن دائمی اعلان"
          >
            <X size={16} />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
