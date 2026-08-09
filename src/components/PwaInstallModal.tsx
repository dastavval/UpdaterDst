import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Download, Share2, PlusSquare, Smartphone, Monitor, CheckCircle, X, ShieldCheck, Sparkles, ArrowDown } from "lucide-react";

interface PwaInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  appName?: string;
  logoUrl?: string;
}

export default function PwaInstallModal({ isOpen, onClose, appName = "دست اول", logoUrl }: PwaInstallModalProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // Check if running as PWA
    const inStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(inStandalone);

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // Listen for install prompt on Android/Chrome/Desktop
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    window.addEventListener("appinstalled", () => {
      setInstalled(true);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setInstalled(true);
    }
    setDeferredPrompt(null);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md" dir="rtl">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="bg-white w-full max-w-lg rounded-3xl p-6 border border-slate-100 shadow-2xl space-y-6 text-right relative overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200/60 p-2 flex items-center justify-center shrink-0">
                <img
                  src={logoUrl || "/assets/logo.svg"}
                  alt={appName}
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-1.5">
                  <span>دانلود و نصب اپلیکیشن {appName}</span>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-black">PWA</span>
                </h3>
                <p className="text-xs font-bold text-slate-500 mt-0.5">بدون نیاز به دانلود از بازار یا اپ‌استور (سرعت بالا + کارکرد آفلاین)</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-900 transition-all cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Installed State */}
          {isStandalone || installed ? (
            <div className="bg-emerald-50 border border-emerald-200/80 rounded-2xl p-6 text-center space-y-3">
              <div className="w-14 h-14 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-600/20">
                <CheckCircle size={32} />
              </div>
              <h4 className="text-sm font-black text-emerald-900">اپلیکیشن با موفقیت نصب گردید!</h4>
              <p className="text-xs text-emerald-700 font-bold leading-relaxed">
                شما هم‌اکنون در حال استفاده از نسخه مستقیم وب‌اپلیکیشن پیشرفته (PWA) هستید. می‌توانید آیکون برنامه را از صفحه اصلی گوشی یا دسکتاپ خود اجرا کنید.
              </p>
              <button
                onClick={onClose}
                className="mt-2 px-6 py-2.5 rounded-xl bg-emerald-700 text-white text-xs font-black hover:bg-emerald-800 transition-all cursor-pointer shadow-md"
              >
                بستن راهنما
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Features Pill */}
              <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                <div className="bg-slate-50 border border-slate-100 p-3 rounded-2xl flex items-center gap-2 text-slate-700">
                  <Smartphone className="text-emerald-600 shrink-0" size={18} />
                  <span>سازگار کامل با iOS و آیفون</span>
                </div>
                <div className="bg-slate-50 border border-slate-100 p-3 rounded-2xl flex items-center gap-2 text-slate-700">
                  <Monitor className="text-indigo-600 shrink-0" size={18} />
                  <span>اجرا روی اندروید و دسکتاپ</span>
                </div>
              </div>

              {/* Direct Native Install for Chrome / Android / Desktop */}
              {deferredPrompt && (
                <div className="bg-emerald-50 border border-emerald-200/80 rounded-2xl p-4 text-center space-y-3">
                  <div className="flex items-center justify-center gap-2 text-emerald-800 text-xs font-black">
                    <Sparkles size={16} className="text-amber-500" />
                    <span>مرورگر شما آماده نصب خودکار برنامه است!</span>
                  </div>
                  <button
                    onClick={handleInstallClick}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Download size={18} />
                    <span>نصب فوری وب‌اپلیکیشن {appName}</span>
                  </button>
                </div>
              )}

              {/* iOS Safari Installation Steps */}
              {isIOS && (
                <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                  <h4 className="text-xs font-black text-slate-900 flex items-center gap-2 border-b border-slate-200/80 pb-2">
                    <Share2 size={16} className="text-indigo-600" />
                    <span>راهنمای نصب اختصاصی روی آیفون و آیپد (iOS):</span>
                  </h4>
                  <ol className="space-y-2.5 text-xs text-slate-700 font-bold">
                    <li className="flex items-start gap-2.5">
                      <span className="w-5 h-5 bg-indigo-600 text-white rounded-full flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">۱</span>
                      <span>در مرورگر Safari، دکمه <strong className="text-indigo-700">Share (اشتراک‌گذاری)</strong> را در نوار پایینی لمس کنید.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="w-5 h-5 bg-indigo-600 text-white rounded-full flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">۲</span>
                      <span>در منوی بازشده، گزینه <strong className="text-indigo-700">Add to Home Screen (افزودن به صفحه اصلی)</strong> را انتخاب کنید.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="w-5 h-5 bg-indigo-600 text-white rounded-full flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">۳</span>
                      <span>در بالای صفحه سمت راست، روی دکمه <strong className="text-emerald-700">Add (افزودن)</strong> بزنید.</span>
                    </li>
                  </ol>
                </div>
              )}

              {/* General Desktop / Chrome Manual Steps if prompt is not auto-triggered */}
              {!deferredPrompt && !isIOS && (
                <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/80 text-xs text-slate-700 font-bold">
                  <h4 className="font-black text-slate-900 flex items-center gap-2 border-b border-slate-200 pb-2">
                    <Monitor size={16} className="text-emerald-600" />
                    <span>نصب در مرورگر Chrome / Edge دسکتاپ و اندروید:</span>
                  </h4>
                  <p className="leading-relaxed text-slate-600">
                    روی آیکون نصب (<Download size={14} className="inline text-emerald-600" />) در انتهای آدرس‌بار مرورگر بزنید یا از سه نقطه بالای مرورگر گزینه <strong>"Install Application"</strong> را انتخاب نمایید.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Footer Note */}
          <div className="border-t border-slate-100 pt-3 text-center text-[11px] text-slate-400 font-bold flex items-center justify-center gap-1.5">
            <ShieldCheck size={14} className="text-emerald-600" />
            <span>پشتیبانی کامل از آخرین متدهای PWA و لایسنس امنیتی SSL</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
