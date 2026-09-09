import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Sparkles, ArrowLeft, ShieldCheck, Activity, 
  Building2, Factory, Truck, CheckCircle2, Zap
} from "lucide-react";
import DastavvalLogo from "./DastavvalLogo";
import { toPersianNum } from "../utils/persian-utils";

interface SplashScreenProps {
  appName?: string;
  appSub?: string;
  logoUrl?: string;
  onFinishLoading: () => void;
  mode?: 'initial_load' | 'data_sync';
}

const TRADING_HUBS = [
  { name: "تهران", x: "50%", y: "35%", delay: 0 },
  { name: "اصفهان", x: "52%", y: "52%", delay: 0.2 },
  { name: "تبریز", x: "28%", y: "25%", delay: 0.4 },
  { name: "مشهد", x: "78%", y: "28%", delay: 0.6 },
  { name: "شیراز", x: "54%", y: "68%", delay: 0.8 },
  { name: "خوزستان", x: "36%", y: "62%", delay: 1.0 }
];

const PLATFORM_HIGHLIGHTS = [
  "خرید مستقیم از خطوط تولید سراسر کشور",
  "ضمانت تحویل کالا با حساب امن امانی",
  "ارسال سریع باربری و صدور فاکتور رسمی"
];

const QUICK_BENEFITS = [
  { icon: Factory, title: "+۴۵۰ کارخانه", desc: "خطوط تولید دست‌اول" },
  { icon: ShieldCheck, title: "حساب امن امانی", desc: "تضمین ۱۰۰٪ تسویه" },
  { icon: Truck, title: "ارسال سراسری", desc: "باربری تخصصی B2B" }
];

export default function SplashScreen({
  appName = "دست‌اول",
  appSub = "سامانه سراسری معاملات مستقیم کارخانجات و بنکداران ایران",
  logoUrl,
  onFinishLoading,
  mode = 'initial_load'
}: SplashScreenProps) {
  const [progress, setProgress] = useState(0);
  const [highlightIdx, setHighlightIdx] = useState(0);
  const isSync = mode === 'data_sync';

  const [windowDimensions, setWindowDimensions] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 400,
    height: typeof window !== 'undefined' ? window.innerHeight : 700
  });

  const [statusText, setStatusText] = useState(
    isSync ? "همگام‌سازی داده‌های ابری..." : "برقراری ارتباط با شبکه سراسری کارخانجات..."
  );

  useEffect(() => {
    const handleResize = () => {
      setWindowDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Compute adaptive logo size based on viewport
  const responsiveLogoSize = Math.min(
    180,
    Math.max(90, Math.floor(Math.min(windowDimensions.height * 0.16, windowDimensions.width * 0.35)))
  );

  // Rotate platform highlights
  useEffect(() => {
    const hInterval = setInterval(() => {
      setHighlightIdx((prev) => (prev + 1) % PLATFORM_HIGHLIGHTS.length);
    }, 1900);
    return () => clearInterval(hInterval);
  }, []);

  // Progress steps
  useEffect(() => {
    const steps = [
      { p: 25, text: "استعلام قیمت‌های دست‌اول خط تولید..." },
      { p: 60, text: "برقراری ارتباط امن با شبکه بنکداران..." },
      { p: 88, text: "بارگذاری سامانه معاملات مستقیم..." },
      { p: 100, text: "خوش آمدید..." }
    ];

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
        }, 80);
      }
    }, 70);

    return () => clearInterval(interval);
  }, [isSync, onFinishLoading]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.99 }}
      transition={{ duration: 0.25, ease: "easeInOut" }}
      className="fixed inset-0 z-[99999] flex flex-col items-center justify-between bg-gradient-to-b from-white via-slate-50/95 to-emerald-50/30 text-slate-900 px-4 sm:px-8 py-5 sm:py-7 select-none overflow-hidden"
      dir="rtl"
    >
      {/* 🌟 Glossy Luminous Ambient Lighting & Reflections */}
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[380px] sm:w-[650px] h-[380px] sm:h-[650px] rounded-full bg-emerald-400/10 blur-[130px] pointer-events-none" />
      <div className="absolute top-1/2 -right-20 w-[280px] sm:w-[480px] h-[280px] sm:h-[480px] rounded-full bg-teal-400/10 blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-[260px] sm:w-[420px] h-[260px] sm:h-[420px] rounded-full bg-emerald-300/15 blur-[110px] pointer-events-none" />

      {/* 🌐 Subtle Supply Network Constellation Nodes in Background */}
      <div className="absolute inset-0 opacity-40 pointer-events-none overflow-hidden">
        {TRADING_HUBS.map((hub, idx) => (
          <motion.div
            key={hub.name}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: [0.4, 0.9, 0.4], scale: [1, 1.15, 1] }}
            transition={{ duration: 3.5, repeat: Infinity, delay: hub.delay, ease: "easeInOut" }}
            style={{ top: hub.y, left: hub.x }}
            className="absolute -translate-x-1/2 -translate-y-1/2 flex items-center gap-1.5"
          >
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] border border-white" />
            <span className="text-[10px] font-black text-emerald-800 tracking-wider hidden sm:inline-block bg-white/80 px-2 py-0.5 rounded-md border border-emerald-100 shadow-2xs">
              {hub.name}
            </span>
          </motion.div>
        ))}
        {/* Subtle grid lines */}
        <svg className="w-full h-full stroke-emerald-600/15" strokeWidth="0.75" strokeDasharray="3 3">
          <line x1="28%" y1="25%" x2="50%" y2="35%" />
          <line x1="50%" y1="35%" x2="78%" y2="28%" />
          <line x1="50%" y1="35%" x2="52%" y2="52%" />
          <line x1="52%" y1="52%" x2="54%" y2="68%" />
          <line x1="52%" y1="52%" x2="36%" y2="62%" />
        </svg>
      </div>

      {/* 🧭 Top Bar - Status & Fast Entry (Glossy Material Pill) */}
      <header className="w-full max-w-xl flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-2 bg-white/90 backdrop-blur-xl px-3.5 py-1.5 rounded-full border border-emerald-200/80 shadow-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span className="text-[11px] sm:text-xs font-black text-emerald-900 tracking-tight flex items-center gap-1.5">
            <Activity size={13} className="text-emerald-600" />
            <span>شبکه کارخانجات آنلاین</span>
          </span>
        </div>

        <button
          onClick={onFinishLoading}
          type="button"
          className="px-4 py-1.5 rounded-full text-[11px] sm:text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white active:scale-95 flex items-center gap-1.5 transition-all cursor-pointer shadow-sm shadow-emerald-600/20 hover:shadow-md"
        >
          <span>ورود مستقیم</span>
          <ArrowLeft size={13} />
        </button>
      </header>

      {/* 🏢 Main Center: Responsive Brand & Material Cards */}
      <main className="my-auto flex flex-col items-center text-center max-w-lg w-full z-10 px-3 py-2 space-y-4">
        {/* Logo with clean glowing backdrop */}
        <div className="relative flex items-center justify-center">
          {/* Animated Ambient Halo */}
          <motion.div 
            animate={{ scale: [1, 1.12, 1], opacity: [0.35, 0.6, 0.35] }}
            transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut" }}
            className="absolute w-36 sm:w-44 h-36 sm:h-44 rounded-full bg-emerald-400/20 blur-2xl pointer-events-none"
          />

          {/* Square and tightly-fitted logo container */}
          <motion.div
            animate={{ y: [0, -3, 0] }}
            transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
            className="relative w-28 h-28 sm:w-36 sm:h-36 aspect-square rounded-2xl bg-white/95 backdrop-blur-xl border border-slate-200/90 shadow-lg shadow-emerald-950/5 flex items-center justify-center p-2.5 shrink-0 overflow-hidden"
          >
            <DastavvalLogo size={88} showText={false} logoUrl={logoUrl} className="w-full h-full flex items-center justify-center" />
          </motion.div>
        </div>

        {/* Clean Brand Title & Slogan */}
        <motion.div 
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.35 }}
          className="space-y-2.5 w-full"
        >
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-50 text-[11px] sm:text-xs font-black text-emerald-800 border border-emerald-200 shadow-3xs">
            <ShieldCheck size={13} className="text-emerald-600" />
            <span>پلتفرم تخصصی تجارت B2B و بنکداری ایران</span>
          </div>

          <p className="text-xs sm:text-sm text-slate-600 font-bold tracking-tight px-3 leading-relaxed max-w-md mx-auto">
            {appSub}
          </p>

          {/* Dynamic Rotating Highlight (Glossy Material Card) */}
          <div className="pt-1 h-9 flex items-center justify-center overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={highlightIdx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
                className="inline-flex items-center gap-2 text-[11px] sm:text-xs text-emerald-950 font-black bg-white/95 px-4 py-1.5 rounded-full border border-emerald-200/80 shadow-sm"
              >
                <Zap size={13} className="text-amber-500 shrink-0 fill-amber-500" />
                <span>{PLATFORM_HIGHLIGHTS[highlightIdx]}</span>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Quick Responsive Feature Chips (Material 3 Cards) */}
          <div className="grid grid-cols-3 gap-2 pt-2 max-w-md mx-auto">
            {QUICK_BENEFITS.map((item, i) => (
              <div 
                key={`benefit-${i}`}
                className="bg-white/85 backdrop-blur-md p-2 rounded-2xl border border-slate-200/80 shadow-3xs flex flex-col items-center text-center"
              >
                <div className="w-6 h-6 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-1 border border-emerald-100">
                  <item.icon size={13} />
                </div>
                <div className="text-[10px] sm:text-[11px] font-black text-slate-800 truncate w-full">{item.title}</div>
                <div className="text-[8.5px] sm:text-[9.5px] text-slate-500 font-bold truncate w-full">{item.desc}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </main>

      {/* 📊 Bottom - Progress Indicator & Live Status (Material Card) */}
      <footer className="w-full max-w-lg bg-white/90 backdrop-blur-xl p-3 sm:p-4 rounded-3xl border border-slate-200/80 shadow-md shadow-emerald-950/5 space-y-2.5 z-10 shrink-0">
        <div className="flex items-center justify-between text-[11px] sm:text-xs font-bold text-slate-600 px-1">
          <span className="flex items-center gap-1.5 text-emerald-800 font-black truncate max-w-[260px]">
            <Sparkles size={14} className="text-emerald-600 shrink-0 animate-spin" />
            <span className="truncate">{statusText}</span>
          </span>
          <span className="font-mono text-emerald-800 font-black bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 text-[11px] sm:text-xs shrink-0">
            {toPersianNum(progress)}٪
          </span>
        </div>

        {/* Linear High-Tech Material Progress Bar */}
        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200 p-[1px] shadow-inner">
          <motion.div
            className="h-full bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-500 rounded-full relative"
            initial={{ width: "0%" }}
            animate={{ width: `${progress}%` }}
            transition={{ ease: "easeInOut", duration: 0.2 }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent animate-pulse rounded-full" />
          </motion.div>
        </div>
      </footer>
    </motion.div>
  );
}
