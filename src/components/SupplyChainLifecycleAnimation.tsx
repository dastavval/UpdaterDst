import React, { useState, useEffect } from 'react';
import { 
  Factory, 
  PackageCheck, 
  Truck, 
  Store, 
  ShoppingCart, 
  ShieldCheck, 
  Play, 
  Pause, 
  ArrowLeft, 
  Clock, 
  FileText, 
  Gauge, 
  QrCode, 
  Sparkles, 
  TrendingUp, 
  CheckCircle2, 
  Zap, 
  MapPin,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface StepInfo {
  id: number;
  title: string;
  emoji: string;
  icon: React.FC<{ size?: number; className?: string }>;
  label: string;
  shortDesc: string;
  longDesc: string;
  docTitle: string;
  timeEstimate: string;
  keyMetric: string;
  color: string;
  bgColor: string;
  badgeBg: string;
  borderColor: string;
  glowColor: string;
}

interface SupplyChainProps {
  onOrderClick?: () => void;
}

export const SupplyChainLifecycleAnimation: React.FC<SupplyChainProps> = ({ onOrderClick }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [speed, setSpeed] = useState<1 | 2 | 3>(1);
  const [expandedDoc, setExpandedDoc] = useState(false);
  const [simulatedKm, setSimulatedKm] = useState(180);

  const steps: StepInfo[] = [
    { 
      id: 1, 
      title: 'اتوماسیون پخت و تولید', 
      emoji: '🏭', 
      icon: Factory,
      label: 'خط تولید مدرن و مکانیزه کارخانه',
      shortDesc: 'ورود سفارش مستقیم به اتوماسیون صنعتی و فرآوری استاندارد مواد اولیه.', 
      longDesc: 'در این گام، سفارش شما پس از احراز مالی مستقیماً به سیستم اتوماسیون صنعتی PLC کارخانه متصل شده و پخت، فرآوری و فرمولاسیون دقیق با پایش دمایی اتوماتیک آغاز می‌شود.',
      docTitle: 'برگه تاییدیه پخت و آنالیز آزمایشگاهی (COA)',
      timeEstimate: '۱۲ الی ۲۴ ساعت',
      keyMetric: 'ظرفیت تولید: ۵۰ تن در روز',
      color: 'text-emerald-700', 
      bgColor: 'bg-emerald-500',
      badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      borderColor: 'border-emerald-400',
      glowColor: 'rgba(16, 185, 129, 0.25)'
    },
    { 
      id: 2, 
      title: 'کنترل کیفیت و سورتینگ', 
      emoji: '🔬', 
      icon: ShieldCheck,
      label: 'اسکن لیزری و پایش بهداشتی',
      shortDesc: 'نمونه‌برداری میکروبی، سنجش وزن دقیق و انطباق کامل با استاندارد ملی.', 
      longDesc: 'محصولات خروجی از خط تولید تحت بازرسی سنسورهای وزن‌سنج هوشمند و اسکن لیزری قرار گرفته تا هرگونه ضایعات حذف شده و علامت سیب سلامت و کد رهگیری روی کالا درج شود.',
      docTitle: 'پروانه بهداشتی ساخت و پروانه بهره‌برداری',
      timeEstimate: '۲ الی ۴ ساعت',
      keyMetric: 'میزان دقت سورتینگ: ۹۹.۹٪',
      color: 'text-teal-700', 
      bgColor: 'bg-teal-500',
      badgeBg: 'bg-teal-50 text-teal-800 border-teal-200',
      borderColor: 'border-teal-400',
      glowColor: 'rgba(20, 184, 166, 0.25)'
    },
    { 
      id: 3, 
      title: 'بسته‌بندی و شرینک پالت', 
      emoji: '📦', 
      icon: PackageCheck,
      label: 'کارتن ۵ لایه و شرینک حرارتی',
      shortDesc: 'چیدمان کارتنی مقاوم در برابر رطوبت، تسمه‌کشی و صدور شناسه پالت.', 
      longDesc: 'کالای تاییدشده در کارتن‌های ۵ لایه صادراتی چیده شده، روی پالت‌های چوبی استاندار قرار گرفته و با نایلون استرچ حرارتی و تسمه‌کشی مکانیزه جهت ترانزیت جاده‌ای کاملاً ایمن می‌شود.',
      docTitle: 'شناسه اختصاصی پالت و بارکد ردیابی GS1',
      timeEstimate: '۳ الی ۶ ساعت',
      keyMetric: 'مقاومت کارتنی: ضد ضربه و ضد رطوبت',
      color: 'text-amber-700', 
      bgColor: 'bg-amber-500',
      badgeBg: 'bg-amber-50 text-amber-800 border-amber-200',
      borderColor: 'border-amber-400',
      glowColor: 'rgba(245, 158, 11, 0.25)'
    },
    { 
      id: 4, 
      title: 'ترانزیت و پلمپ سربی', 
      emoji: '🚚', 
      icon: Truck,
      label: 'بارگیری مسقف و بارنامه دولتی',
      shortDesc: 'پلمپ سربی وزارت راه، بیمه‌نامه ۱۰۰٪ حوادث و حرکت تریلر اختصاصی.', 
      longDesc: 'بارگیری مستقیماً در انبار کارخانه انجام شده، پلمپ سربی ثبت شده و با صدور بارنامه رسمی دولتی و بیمه کامل، تریلر یخچال‌دار یا مسقف به سمت مقصد شما حرکت می‌کند.',
      docTitle: 'بارنامه سراسری تمبردار + بیمه‌نامه رسمی ایران',
      timeEstimate: '۲۴ الی ۴۸ ساعت',
      keyMetric: 'پایش موقعیت مکانی: GPS زنده آنلاین',
      color: 'text-indigo-700', 
      bgColor: 'bg-indigo-500',
      badgeBg: 'bg-indigo-50 text-indigo-800 border-indigo-200',
      borderColor: 'border-indigo-400',
      glowColor: 'rgba(99, 102, 241, 0.25)'
    },
    { 
      id: 5, 
      title: 'تحویل بنکداری و سود نهایی', 
      emoji: '🛒', 
      icon: Store,
      label: 'تخلیه سالم در انبار بنکدار',
      shortDesc: 'بررسی سلامت پلمپ، مطابقت فاکتور رسمی و کسب سود حداکثری بی‌واسطه.', 
      longDesc: 'محموله درب مغازه یا انبار شما تخلیه شده و با حذف کامل دلالان و واسطه‌های کاذب، بیشترین حاشیه سود بنکداری (+۳۰٪ تا +۴۵٪) مستقیماً به حساب شما سرازیر می‌شود.',
      docTitle: 'فاکتور رسمی خریدار با ارزش افزوده قانونی',
      timeEstimate: 'تحویل نهایی فوری',
      keyMetric: 'افزایش حاشیه سود خالص: +۳۵٪',
      color: 'text-rose-700', 
      bgColor: 'bg-rose-500',
      badgeBg: 'bg-rose-50 text-rose-800 border-rose-200',
      borderColor: 'border-rose-400',
      glowColor: 'rgba(244, 63, 94, 0.25)'
    }
  ];

  // Cycle interval based on speed
  useEffect(() => {
    if (!isPlaying) return;
    const intervalTime = (5000 / speed);
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % steps.length);
      setSimulatedKm((prev) => (prev > 20 ? prev - 35 : 240));
    }, intervalTime);
    return () => clearInterval(timer);
  }, [isPlaying, speed, steps.length]);

  const currentStep = steps[activeStep];

  return (
    <div className="relative w-full bg-white border border-slate-200/80 rounded-[2rem] p-4 sm:p-6 shadow-sm overflow-hidden select-none text-right" dir="rtl">
      {/* Decorative Atmospheric Radial Gradients */}
      <div className="absolute -top-20 -right-20 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* HEADER CONTROLS BAR */}
      <div className="relative z-10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-4 mb-5 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center font-black shadow-md shadow-emerald-500/20 shrink-0">
            <Sparkles size={20} className="animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-black text-slate-900">
                شبیه‌ساز هوشمند و زنده چرخه تامین و فروش
              </h3>
              <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                نسخه ۵.۰
              </span>
            </div>
            <p className="text-[11px] font-bold text-slate-500 mt-0.5">
              مسیر هوشمند کالا از دیگ پخت کارخانه تا ثبت سود خالص در حساب بنکدار
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {/* Speed Selector */}
          <div className="flex items-center bg-slate-100/80 p-1 rounded-xl border border-slate-200/80 text-[11px] font-black">
            <span className="text-slate-400 px-1.5 hidden md:inline">سرعت:</span>
            {([1, 2, 3] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSpeed(s)}
                className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                  speed === s 
                    ? 'bg-white text-emerald-700 shadow-xs font-black' 
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>

          {/* Play/Pause Button */}
          <button
            type="button"
            onClick={() => setIsPlaying(!isPlaying)}
            className={`p-2 rounded-xl border font-black text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${
              isPlaying 
                ? 'bg-amber-50 text-amber-700 border-amber-200/80 hover:bg-amber-100' 
                : 'bg-emerald-600 text-white border-emerald-700 hover:bg-emerald-700'
            }`}
          >
            {isPlaying ? (
              <>
                <Pause size={14} />
                <span className="hidden xs:inline">توقف</span>
              </>
            ) : (
              <>
                <Play size={14} />
                <span className="hidden xs:inline">ادامه چرخه</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* INTERACTIVE STAGE ANIMATION CANVAS */}
      <div className="relative w-full h-52 sm:h-60 bg-slate-900 rounded-3xl mb-6 overflow-hidden border border-slate-800 shadow-inner flex flex-col justify-between p-4 sm:p-5 text-white">
        {/* Animated Cyber Grid Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />

        {/* Top Info Bar inside Canvas */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`text-[11px] font-black px-3 py-1 rounded-xl backdrop-blur-md border ${currentStep.badgeBg}`}>
              مرحله {activeStep + 1} از ۵: {currentStep.title}
            </span>
          </div>

          <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400 bg-slate-800/80 backdrop-blur-md border border-slate-700/60 px-2.5 py-1 rounded-xl">
            <Clock size={12} className="text-emerald-400" />
            <span>زمان تخمینی: {currentStep.timeEstimate}</span>
          </div>
        </div>

        {/* MAIN DYNAMIC ANIMATED DISPLAY CONTENT */}
        <div className="relative z-10 flex-1 flex items-center justify-center py-2">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeStep}
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -10 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="w-full flex flex-col items-center justify-center text-center"
            >
              {/* STAGE 1: FACTORY PRODUCTION */}
              {activeStep === 0 && (
                <div className="relative flex flex-col items-center justify-center space-y-2">
                  <div className="flex items-center justify-center gap-4">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 6 / speed, ease: 'linear' }}
                      className="text-3xl text-emerald-400"
                    >
                      ⚙️
                    </motion.div>
                    <span className="text-6xl filter drop-shadow-xl">🏭</span>
                    <motion.div
                      animate={{ rotate: -360 }}
                      transition={{ repeat: Infinity, duration: 4 / speed, ease: 'linear' }}
                      className="text-2xl text-teal-400"
                    >
                      ⚙️
                    </motion.div>
                  </div>

                  {/* Rising steam clouds */}
                  <motion.div
                    animate={{ y: [-10, -35], opacity: [0.8, 0], scale: [0.6, 1.4] }}
                    transition={{ repeat: Infinity, duration: 2 / speed, ease: 'easeOut' }}
                    className="absolute top-0 right-1/3 text-lg pointer-events-none"
                  >
                    ☁️
                  </motion.div>

                  {/* Conveyor belt */}
                  <div className="w-56 h-3 bg-slate-800 rounded-full relative overflow-hidden border border-slate-700 shadow-inner flex items-center">
                    <motion.div
                      animate={{ x: [-80, 220] }}
                      transition={{ repeat: Infinity, duration: 2.5 / speed, ease: 'linear' }}
                      className="absolute text-base flex gap-8"
                    >
                      <span>🥫</span>
                      <span>📦</span>
                      <span>🍫</span>
                    </motion.div>
                  </div>

                  <div className="flex items-center gap-3 mt-2 text-[10px] font-black text-emerald-300 bg-emerald-950/80 border border-emerald-800/60 px-3 py-1 rounded-full">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span>پایش خودکار دما: ۱۸۵°C | سیستم اتوماسیون PLC فعال</span>
                  </div>
                </div>
              )}

              {/* STAGE 2: QUALITY CONTROL & LASER SCAN */}
              {activeStep === 1 && (
                <div className="relative flex flex-col items-center justify-center space-y-2">
                  <div className="relative">
                    <span className="text-6xl filter drop-shadow-xl">🔬</span>
                    {/* Laser beam scan */}
                    <motion.div
                      animate={{ y: [-20, 20, -20] }}
                      transition={{ repeat: Infinity, duration: 1.5 / speed, ease: 'easeInOut' }}
                      className="absolute inset-x-[-20px] h-0.5 bg-teal-400 shadow-[0_0_12px_#2dd4bf]"
                    />
                  </div>

                  <div className="flex items-center gap-2 bg-slate-800/90 border border-slate-700 px-3 py-1.5 rounded-2xl text-xs font-black">
                    <CheckCircle2 size={16} className="text-teal-400" />
                    <span>تایید سلامت بهداشتی + وزن‌سنجی دیجیتال</span>
                  </div>

                  <div className="flex items-center gap-2 text-[10px] text-teal-300 font-mono">
                    <span className="bg-teal-950 px-2.5 py-0.5 rounded-lg border border-teal-800">
                      دقت اسکن: ۹۹.۹٪
                    </span>
                    <span className="bg-emerald-950 px-2.5 py-0.5 rounded-lg border border-emerald-800">
                      کد سیب سلامت: OK
                    </span>
                  </div>
                </div>
              )}

              {/* STAGE 3: ROBOTIC PACKAGING & PALLET */}
              {activeStep === 2 && (
                <div className="relative flex flex-col items-center justify-center space-y-2">
                  <motion.div
                    animate={{ y: [0, -6, 0] }}
                    transition={{ repeat: Infinity, duration: 2 / speed, ease: 'easeInOut' }}
                    className="text-6xl filter drop-shadow-xl relative"
                  >
                    📦
                    <motion.span
                      animate={{ scale: [1, 1.3, 1], opacity: [0.3, 1, 0.3] }}
                      transition={{ repeat: Infinity, duration: 1.5 / speed }}
                      className="absolute -top-2 -right-3 text-xl"
                    >
                      ✨
                    </motion.span>
                  </motion.div>

                  <div className="flex items-center gap-2 bg-amber-950/80 border border-amber-800/80 px-3.5 py-1.5 rounded-full text-xs font-black text-amber-200">
                    <QrCode size={16} className="text-amber-400" />
                    <span>پالت‌بندی مکانیزه ۵ لایه + پلمپ حرارتی</span>
                  </div>

                  <span className="text-[10px] font-mono text-amber-300/80">
                    شناسه ثبت‌شده پالت: PLT-90824-IR
                  </span>
                </div>
              )}

              {/* STAGE 4: ROAD TRANSIT & GPS TRACKING */}
              {activeStep === 3 && (
                <div className="relative flex flex-col items-center justify-center space-y-2 w-full max-w-sm">
                  {/* Moving Road Line */}
                  <div className="relative w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mb-1">
                    <motion.div
                      animate={{ x: [-100, 300] }}
                      transition={{ repeat: Infinity, duration: 1.2 / speed, ease: 'linear' }}
                      className="w-20 h-full bg-indigo-500 shadow-[0_0_8px_#6366f1]"
                    />
                  </div>

                  <motion.div
                    animate={{ y: [0, -4, 0], rotate: [0, 1, -1, 0] }}
                    transition={{ repeat: Infinity, duration: 0.8 / speed }}
                    className="text-6xl filter drop-shadow-xl"
                  >
                    🚚
                  </motion.div>

                  <div className="flex items-center gap-2 bg-indigo-950/90 border border-indigo-800/80 px-3.5 py-1.5 rounded-full text-xs font-black text-indigo-200">
                    <MapPin size={14} className="text-indigo-400 animate-bounce" />
                    <span>ترانزیت با بارنامه تمبردار دولتی و بیمه‌نامه</span>
                  </div>

                  <div className="flex items-center gap-3 text-[10px] font-mono text-indigo-300">
                    <span>فاصله تا انبار: {simulatedKm} کیلومتر</span>
                    <span>•</span>
                    <span>وضعیت پلمپ سربی: دست‌نخورده</span>
                  </div>
                </div>
              )}

              {/* STAGE 5: STORE DELIVERY & MAX PROFIT */}
              {activeStep === 4 && (
                <div className="relative flex flex-col items-center justify-center space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="text-6xl filter drop-shadow-xl">🏪</span>
                    <span className="text-3xl animate-bounce">➡️</span>
                    <span className="text-6xl filter drop-shadow-xl">🛒</span>
                  </div>

                  <div className="flex items-center gap-2 bg-gradient-to-r from-rose-600 to-pink-600 text-white px-4 py-1.5 rounded-full text-xs font-black shadow-lg shadow-rose-600/30">
                    <TrendingUp size={16} />
                    <span>حذف کامل ۵ واسطه کاذب + سود خالص +۳۵٪</span>
                  </div>

                  <p className="text-[11px] font-bold text-rose-200">
                    تحویل ۱۰۰٪ سالم بار در محل انبار بنکدار همراه با فاکتور رسمی
                  </p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Bottom Banner inside Canvas */}
        <div className="relative z-10 flex items-center justify-between text-[11px] font-bold text-slate-400 border-t border-slate-800/80 pt-2">
          <div className="flex items-center gap-1.5 text-slate-300">
            <Zap size={14} className="text-amber-400" />
            <span>ویژگی کلیدی: {currentStep.keyMetric}</span>
          </div>

          <button
            type="button"
            onClick={() => setExpandedDoc(!expandedDoc)}
            className="text-emerald-400 hover:text-emerald-300 underline underline-offset-4 flex items-center gap-1 cursor-pointer transition-colors"
          >
            <FileText size={13} />
            <span>{expandedDoc ? "بستن مدارک" : "مشاهده سند رسمی این گام"}</span>
          </button>
        </div>
      </div>

      {/* EXPANDABLE DOCUMENT & TECHNICAL SPEC SHEET */}
      <AnimatePresence>
        {expandedDoc && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 overflow-hidden"
          >
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-right space-y-2">
              <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                  <FileText size={16} className="text-emerald-600" />
                  {currentStep.docTitle}
                </span>
                <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md">
                  تاییدشده در سامانه
                </span>
              </div>
              <p className="text-[11px] text-slate-600 font-bold leading-relaxed">
                این سند به صورت خودکار پس از گذراندن موفقیت‌آمیز مرحله «{currentStep.title}» توسط واحد کنترل کیفیت و اتوماسیون کارخانه صادر شده و یک نسخه نسخه الکترونیکی آن همراه با بارنامه صادر می‌شود.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 5 INTERACTIVE PIPELINE STEP NODES */}
      <div className="relative z-10 mb-6">
        {/* Progress Progress Track Bar */}
        <div className="relative w-full h-3 bg-slate-100 rounded-full overflow-hidden mb-4 shadow-inner">
          <motion.div
            className="h-full bg-gradient-to-r from-emerald-500 via-teal-500 via-amber-500 via-indigo-500 to-rose-500 rounded-full"
            initial={false}
            animate={{ width: `${((activeStep + 1) / steps.length) * 100}%` }}
            transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          />
        </div>

        {/* 5 Step Buttons */}
        <div className="grid grid-cols-5 gap-1.5 sm:gap-3 text-center">
          {steps.map((step, idx) => {
            const isActive = activeStep === idx;
            const isPassed = activeStep > idx;
            const StepIcon = step.icon;

            return (
              <button
                key={step.id}
                type="button"
                onClick={() => {
                  setActiveStep(idx);
                  setIsPlaying(false);
                }}
                className="flex flex-col items-center group cursor-pointer focus:outline-none"
              >
                {/* Node Box */}
                <motion.div
                  animate={{ 
                    scale: isActive ? 1.12 : 1,
                    boxShadow: isActive ? `0 10px 20px -3px ${step.glowColor}` : 'none'
                  }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  className={`relative w-11 h-11 xs:w-12 xs:h-12 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center text-lg sm:text-2xl transition-all duration-300 border-2 ${
                    isActive
                      ? `bg-white ${step.borderColor} text-slate-900 font-bold ring-4 ring-slate-100 shadow-md`
                      : isPassed
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                      : 'bg-slate-50 border-slate-200 text-slate-400 group-hover:border-slate-300 hover:bg-white'
                  }`}
                >
                  <span className={isActive ? 'animate-bounce' : ''}>{step.emoji}</span>

                  {isActive && (
                    <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white shadow-sm animate-ping" />
                  )}
                </motion.div>

                {/* Step Title */}
                <span className={`text-[10px] sm:text-xs font-black mt-2 transition-colors leading-tight truncate max-w-full block ${
                  isActive ? 'text-slate-900 font-black' : 'text-slate-400 font-bold'
                }`}>
                  {step.title}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* DETAILED SUMMARY & CALL TO ACTION FOOTER */}
      <div className="relative z-10 pt-4 border-t border-slate-100 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 text-right">
        <div className="space-y-1.5 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className={`text-xs font-black px-3 py-1 rounded-xl ${currentStep.badgeBg}`}>
              {currentStep.label}
            </span>
          </div>
          <p className="text-xs font-bold text-slate-600 leading-relaxed">
            {currentStep.longDesc}
          </p>
        </div>

        {onOrderClick && (
          <button
            type="button"
            onClick={onOrderClick}
            className="shrink-0 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white px-5 py-3 rounded-2xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 cursor-pointer"
          >
            <span>ثبت استعلام و سفارش مستقیم از کارخانه</span>
            <ArrowLeft size={16} />
          </button>
        )}
      </div>
    </div>
  );
};
