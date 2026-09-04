import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Sparkles, ShieldCheck, Zap, Factory, ArrowLeft, Signal, RefreshCw, CheckCircle2, PackageCheck } from "lucide-react";
import DastavvalLogo from "./DastavvalLogo";

interface SplashScreenProps {
  appName?: string;
  appSub?: string;
  logoUrl?: string;
  onFinishLoading: () => void;
  isDataReady?: boolean;
  mode?: 'initial_load' | 'data_sync';
}

export default function SplashScreen({
  appName = "دست اول",
  appSub = "مرجع مبادلات مستقیم و تامین کالای عمده از درب کارخانه",
  logoUrl,
  onFinishLoading,
  mode = 'initial_load'
}: SplashScreenProps) {
  const [progress, setProgress] = useState(0);
  const isSync = mode === 'data_sync';
  
  const [statusText, setStatusText] = useState(
    isSync ? "در حال فراخوانی قیمت‌های بروز و موجودی انبار..." : "در حال آماده‌سازی سامانه دست اول..."
  );

  const [isLowBandwidth, setIsLowBandwidth] = useState<boolean>(() => {
    try {
      return localStorage.getItem("dastavval_low_bandwidth_mode") === "true";
    } catch (e) {
      return false;
    }
  });

  const toggleLowBandwidth = () => {
    const nextVal = !isLowBandwidth;
    setIsLowBandwidth(nextVal);
    try {
      localStorage.setItem("dastavval_low_bandwidth_mode", String(nextVal));
    } catch (e) {}
  };

  useEffect(() => {
    const initialSteps = [
      { p: 25, text: "بارگیری لیست کالاها و قیمت‌های درب کارخانه..." },
      { p: 55, text: "همگام‌سازی کش محلی و فعال‌سازی لود سریع..." },
      { p: 85, text: "بررسی تاییده‌های بازرسی و انبار مرکزی..." },
      { p: 100, text: "سامانه با موفقیت آماده شد!" }
    ];

    const syncSteps = [
      { p: 35, text: "دریافت آخرین تغییرات قیمت درب کارخانه..." },
      { p: 70, text: "بهینه‌سازی کاتالوگ و ثبت موجودی‌های جدید..." },
      { p: 90, text: "بروزرسانی کش سریع و داده‌های آفلاین..." },
      { p: 100, text: "داده‌های کاتالوگ با موفقیت بروزرسانی شدند!" }
    ];

    const steps = isSync ? syncSteps : initialSteps;

    let currentStepIdx = 0;
    const interval = setInterval(() => {
      if (currentStepIdx < steps.length) {
        const step = steps[currentStepIdx];
        setProgress(step.p);
        setStatusText(step.text);
        currentStepIdx++;
      } else {
        clearInterval(interval);
        setTimeout(() => {
          onFinishLoading();
        }, 280);
      }
    }, isLowBandwidth ? 150 : 250);

    return () => clearInterval(interval);
  }, [isLowBandwidth, isSync, onFinishLoading]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-0 z-[99999] flex flex-col items-center justify-between bg-white text-slate-900 p-6 select-none overflow-hidden"
      dir="rtl"
    >
      {/* Background Solid Subtle Geometric Accents (Non-glass, Crisp White Aesthetic) */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-50 rounded-full blur-2xl -mr-20 -mt-20 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-amber-50 rounded-full blur-2xl -ml-20 -mb-20 pointer-events-none" />

      {/* Top Header Controls - Solid White Buttons */}
      <div className="w-full max-w-md flex items-center justify-between z-10 pt-2">
        <button
          onClick={toggleLowBandwidth}
          className={`px-3.5 py-2 rounded-2xl text-[11px] font-black flex items-center gap-1.5 border transition-all cursor-pointer shadow-2xs ${
            isLowBandwidth
              ? "bg-amber-100 text-amber-950 border-amber-300"
              : "bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
          }`}
          title="فعال‌سازی حالت مصرف پایین داده و سرعت بالا"
        >
          <Signal size={13} className={isLowBandwidth ? "text-amber-600 animate-pulse" : "text-slate-500"} />
          <span>{isLowBandwidth ? "⚡ حالت اینترنت ضعیف (فعال)" : "حالت اینترنت کم‌سرعت"}</span>
        </button>

        <button
          onClick={onFinishLoading}
          className="px-4 py-2 rounded-2xl text-[11px] font-black bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all cursor-pointer border border-emerald-500"
        >
          <span>{isSync ? "بستن" : "ورود مستقیم"}</span>
          <ArrowLeft size={13} />
        </button>
      </div>

      {/* Center Branding Hero - Pure Solid White Creative Card */}
      <div className="my-auto flex flex-col items-center text-center space-y-6 max-w-md w-full z-10 px-2">
        {/* Main Solid White Card */}
        <div className="w-full bg-white rounded-3xl p-6 border-2 border-emerald-100 shadow-2xl shadow-emerald-950/10 flex flex-col items-center space-y-5 relative">
          
          {/* Logo Badge Container */}
          <div className="relative flex items-center justify-center p-6 bg-slate-50 rounded-3xl border border-slate-200 shadow-inner">
            <DastavvalLogo size={88} showText={false} logoUrl={logoUrl} />
            
            <div className="absolute -bottom-2 -right-2 bg-emerald-600 text-white p-2.5 rounded-2xl shadow-md border-2 border-white">
              {isSync ? (
                <RefreshCw size={18} className="animate-spin text-white" />
              ) : (
                <Zap size={18} className="fill-white text-white" />
              )}
            </div>
          </div>

          {/* App Title & Slogan */}
          <div className="space-y-1.5">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 flex items-center justify-center gap-2">
              <span>{appName}</span>
              <span className="text-[11px] px-2.5 py-0.5 rounded-xl bg-emerald-100 text-emerald-900 font-black border border-emerald-300">
                {isSync ? "همگام‌سازی" : "v4.0 Pro"}
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 font-bold leading-relaxed max-w-xs mx-auto">
              {isSync ? "در حال دریافت آخرین قیمت‌های کارخانه و بروزرسانی انبار..." : appSub}
            </p>
          </div>

          {/* Solid Badges */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1 text-[10.5px] text-slate-700 font-bold">
            <span className="px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-1.5 text-slate-800">
              <ShieldCheck size={14} className="text-emerald-600 shrink-0" />
              تضمین قیمت درب کارخانه
            </span>
            <span className="px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-1.5 text-slate-800">
              <Factory size={14} className="text-amber-600 shrink-0" />
              تامین مستقیم بی‌واسطه
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Progress & Loading Status Card - Pure Solid White */}
      <div className="w-full max-w-sm space-y-3 z-10 pb-2">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-lg shadow-slate-200/50 space-y-3">
          <div className="flex items-center justify-between text-xs font-black text-slate-900 px-0.5">
            <span className="flex items-center gap-1.5 text-emerald-800">
              <Sparkles size={14} className="animate-spin text-emerald-600 shrink-0" />
              <span>{statusText}</span>
            </span>
            <span className="font-mono text-emerald-900 font-black text-sm">{progress}٪</span>
          </div>

          {/* High Contrast Progress Bar */}
          <div className="w-full h-3 bg-slate-100 rounded-full p-0.5 border border-slate-200 overflow-hidden relative shadow-inner">
            <motion.div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full shadow-xs"
              initial={{ width: "0%" }}
              animate={{ width: `${progress}%` }}
              transition={{ ease: "easeInOut", duration: 0.2 }}
            />
          </div>

          <div className="flex items-center justify-center gap-1 text-[10px] text-slate-500 font-black pt-0.5">
            <PackageCheck size={13} className="text-emerald-600 shrink-0" />
            <span>سامانه ملی تامین و بنکداری صنایع غذایی دست اول</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
