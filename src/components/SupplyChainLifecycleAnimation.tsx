import React, { useState, useEffect } from 'react';
import { ShoppingBag, ArrowLeft, ChevronLeft, Play, Pause, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface StepInfo {
  id: number;
  title: string;
  emoji: string;
  label: string;
  desc: string;
  longDesc: string;
  color: string;
  bgColor: string;
  borderColor: string;
  glowColor: string;
}

interface SupplyChainProps {
  onOrderClick?: () => void;
}

export const SupplyChainLifecycleAnimation: React.FC<SupplyChainProps> = ({ onOrderClick }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  const steps: StepInfo[] = [
    { 
      id: 1, 
      title: 'تولید مستقیم', 
      emoji: '🏭', 
      label: 'خط تولید مدرن کارخانه',
      desc: 'سفارش مستقیم شما در خط تولید پیشرفته و مکانیزه کارخانه قرار می‌گیرد.', 
      longDesc: 'در این مرحله، سفارش شما پس از تایید مالی مستقیماً به سیستم اتوماسیون صنعتی کارخانه مقصد متصل شده و فرآیند پخت، فرآوری و پایش بهداشتی کالا با بروزترین ماشین‌آلات روز دنیا آغاز می‌گردد.',
      color: 'text-emerald-605', 
      bgColor: 'bg-emerald-500',
      borderColor: 'border-emerald-300',
      glowColor: 'rgba(16, 185, 129, 0.2)'
    },
    { 
      id: 2, 
      title: 'بسته‌بندی استاندارد', 
      emoji: '📦', 
      label: 'چیدمان کارتنی و شرینک پالت',
      desc: 'بسته‌بندی ضدضربه، پالت‌بندی مکانیزه و صدور شناسه ردیابی اختصاصی کالا.', 
      longDesc: 'محصولات خروجی خط تولید در کارتن‌های ۵ لایه ضد رطوبت چیده شده و سپس بر روی پالت‌های استاندارد صادراتی، شرینک‌پیچ و تسمه‌کشی می‌شوند تا در طول مسیر ترانزیت جاده‌ای کاملاً سالم بمانند.',
      color: 'text-teal-650', 
      bgColor: 'bg-teal-500',
      borderColor: 'border-teal-300',
      glowColor: 'rgba(20, 184, 166, 0.2)'
    },
    { 
      id: 3, 
      title: 'ارسال و لجستیک', 
      emoji: '🚚', 
      label: 'بارگیری فوری و ترانزیت جاده‌ای',
      desc: 'بارگیری مسقف دولتی، پلمپ سربی کارخانه و صدور فوری بارنامه معتبر.', 
      longDesc: 'محموله شما مستقیماً در محل انبار کارخانه درون تریلرهای مسقف و ایمن بارگیری شده، پلمپ سربی وزارت راه می‌خورد و با صدور سریع بارنامه سراسری دولتی و بیمه‌نامه کامل حوادث، روانه انبار شما می‌شود.',
      color: 'text-amber-650', 
      bgColor: 'bg-amber-500',
      borderColor: 'border-amber-300',
      glowColor: 'rgba(245, 158, 11, 0.2)'
    },
    { 
      id: 4, 
      title: 'تحویل فروشگاه', 
      emoji: '🏪', 
      label: 'تخلیه بارنامه و انبارداری بنکدار',
      desc: 'وصول فیزیکی بار، بررسی سلامت پلمپ و هماهنگی توزیع مویرگی در بازار.', 
      longDesc: 'بار ترانزیت با سلامت ۱۰۰٪ درب انبار یا مغازه شما تخلیه می‌گردد. پس از بررسی پلمپ و اصالت کالا توسط انباردار شما، تاییدیه تحویل در سامانه ثبت شده و فاکتور نهایی بسته می‌شود.',
      color: 'text-indigo-650', 
      bgColor: 'bg-indigo-500',
      borderColor: 'border-indigo-300',
      glowColor: 'rgba(99, 102, 241, 0.2)'
    },
    { 
      id: 5, 
      title: 'مصرف‌کننده نهایی', 
      emoji: '🛒', 
      label: 'عرضه با حاشیه سود عالی',
      desc: 'دستیابی به سود نهایی واقعی با کوتاه شدن زنجیره توزیع و واسطه‌ها.', 
      longDesc: 'با حذف کامل دلالان، دپوهای غیرضروری و واسطه‌های کاذب بازار، محصول با مناسب‌ترین قیمت مصرف‌کننده و بالاترین سود خالص ممکن به سبد خرید مشتریان نهایی شما منتقل می‌شود.',
      color: 'text-rose-650', 
      bgColor: 'bg-rose-500',
      borderColor: 'border-rose-300',
      glowColor: 'rgba(244, 63, 94, 0.2)'
    }
  ];

  // Auto cycle logic
  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % steps.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [isPlaying, steps.length]);

  return (
    <div className="relative w-full overflow-hidden select-none" dir="rtl">
      {/* Background Glows */}
      <div className="absolute -top-12 -right-12 w-48 h-48 bg-emerald-100/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-indigo-100/30 rounded-full blur-3xl pointer-events-none" />

      {/* Header Bar */}
      <div className="relative z-10 flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-3 w-3">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${steps[activeStep].bgColor} opacity-60`} />
            <span className={`relative inline-flex rounded-full h-3 w-3 ${steps[activeStep].bgColor}`} />
          </span>
          <div>
            <h4 className="text-xs sm:text-sm font-black text-slate-900">
              شبیه‌ساز هوشمند چرخه زنده تامین کالا
            </h4>
            <p className="text-[10px] text-slate-400 font-bold hidden sm:block">رهگیری گام‌به‌گام محصول از دیگ پخت کارخانه تا قفسه فروشگاه</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Play / Pause Control */}
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-150 text-slate-500 hover:text-slate-800 transition-all cursor-pointer flex items-center justify-center"
            title={isPlaying ? "توقف چرخه خودکار" : "شروع چرخه خودکار"}
          >
            {isPlaying ? <Pause size={12} /> : <Play size={12} />}
          </button>

          <div className="bg-slate-50 text-slate-650 border border-slate-200 px-2.5 py-1 rounded-full text-[10px] font-black flex items-center gap-1">
            <span>مرحله {activeStep + 1} از ۵</span>
          </div>
        </div>
      </div>

      {/* STAGE ANIMATION FIELD (HIGH FIDELITY VISUAL PLAYGROUND) */}
      <div className="relative w-full h-40 bg-gradient-to-b from-slate-50/80 to-white border border-slate-100 rounded-2xl mb-4 overflow-hidden flex items-center justify-center">
        {/* Decorative Grid Grid Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(241,245,249,0.5)_1px,transparent_1px),linear-gradient(to_bottom,rgba(241,245,249,0.5)_1px,transparent_1px)] bg-[size:14px_14px]" />
        
        <AnimatePresence mode="wait">
          <motion.div
            key={activeStep}
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -8 }}
            transition={{ type: 'spring', stiffness: 350, damping: 26 }}
            className="relative w-full h-full flex flex-col items-center justify-center p-4 text-center z-10"
          >
            {/* Custom Interactive Stage Render */}
            {activeStep === 0 && (
              <div className="relative flex flex-col items-center justify-center">
                {/* Gears spinning */}
                <div className="flex gap-4 items-center justify-center mb-1">
                  <motion.span 
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 6, ease: "linear" }}
                    className="text-4xl filter drop-shadow"
                  >
                    ⚙️
                  </motion.span>
                  <motion.span 
                    animate={{ rotate: -360 }}
                    transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                    className="text-3xl filter drop-shadow -mt-3"
                  >
                    ⚙️
                  </motion.span>
                  <span className="text-5xl filter drop-shadow">🏭</span>
                </div>
                {/* Smoke particle rising */}
                <motion.div 
                  initial={{ y: -10, opacity: 0.8, scale: 0.5 }}
                  animate={{ y: -30, opacity: 0, scale: 1.3 }}
                  transition={{ repeat: Infinity, duration: 2, ease: "easeOut" }}
                  className="absolute right-10 top-0 text-xs font-black text-slate-350 select-none pointer-events-none"
                >
                  ☁️
                </motion.div>
                {/* Conveyor Belt representation */}
                <div className="w-40 h-2 bg-slate-300 rounded-full mt-2 relative overflow-hidden shadow-inner border border-slate-400">
                  <motion.div 
                    animate={{ x: [-40, 120] }}
                    transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                    className="absolute top-[-4px] text-[10px]"
                  >
                    🥫
                  </motion.div>
                  <motion.div 
                    animate={{ x: [-100, 60] }}
                    transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                    className="absolute top-[-4px] text-[10px]"
                  >
                    🥫
                  </motion.div>
                </div>
              </div>
            )}

            {activeStep === 1 && (
              <div className="relative flex flex-col items-center justify-center">
                {/* 3D Box scaling with wrap tape */}
                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                  className="text-6xl filter drop-shadow-md mb-2 relative"
                >
                  📦
                  <motion.span
                    initial={{ scale: 0.8, opacity: 0.2 }}
                    animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.7, 0.2] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="absolute -top-1 -right-2 text-base"
                  >
                    ✨
                  </motion.span>
                </motion.div>
                {/* Packing hands/tape effect */}
                <div className="flex gap-2 text-xs font-black bg-teal-500/10 text-teal-800 border border-teal-200/50 px-2.5 py-0.5 rounded-full">
                  <span>شرینک اتوماتیک</span>
                  <span className="animate-pulse">🔒</span>
                </div>
              </div>
            )}

            {activeStep === 2 && (
              <div className="relative flex flex-col items-center justify-center w-full">
                {/* Road Line moving */}
                <div className="absolute w-44 h-1 bg-slate-200 rounded bottom-12 overflow-hidden flex">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <motion.div
                      key={i}
                      animate={{ x: [-20, 120] }}
                      transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
                      className="w-4 h-full bg-slate-400 shrink-0 mr-4"
                    />
                  ))}
                </div>
                {/* Truck driving */}
                <motion.div
                  animate={{ y: [0, -3, 0], rotate: [0, 1, 0] }}
                  transition={{ repeat: Infinity, duration: 0.6, ease: "easeInOut" }}
                  className="text-6xl filter drop-shadow-md mb-2 z-10"
                >
                  🚚
                </motion.div>
                <div className="flex gap-1.5 items-center text-[10px] font-black text-amber-700 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200/40 mt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-550 animate-ping" />
                  <span>ترانزیت با بیمه‌نامه و پلمپ رسمی</span>
                </div>
              </div>
            )}

            {activeStep === 3 && (
              <div className="relative flex flex-col items-center justify-center">
                {/* Store Front with open indicator */}
                <div className="relative mb-2">
                  <span className="text-6xl filter drop-shadow-md">🏪</span>
                  {/* Neon sign */}
                  <motion.span
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="absolute top-2 left-1/2 -translate-x-1/2 bg-red-500 text-[8px] font-black text-white px-1 rounded border border-red-400 shadow shadow-red-500/50"
                  >
                    OPEN
                  </motion.span>
                </div>
                <div className="flex gap-2 text-xs font-black bg-indigo-500/10 text-indigo-850 border border-indigo-200/40 px-2.5 py-0.5 rounded-full">
                  <span>وصول مستقیم در انبار بنکدار</span>
                </div>
              </div>
            )}

            {activeStep === 4 && (
              <div className="relative flex flex-col items-center justify-center">
                {/* Shopping cart jumping with boxes */}
                <motion.div
                  animate={{ scale: [1, 1.05, 1], rotate: [0, -2, 2, 0] }}
                  transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
                  className="text-6xl filter drop-shadow-md mb-2 relative"
                >
                  🛒
                  <motion.span
                    animate={{ y: [-10, 0, -10] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="absolute -top-3 right-1 text-2xl"
                  >
                    🥫
                  </motion.span>
                </motion.div>
                <div className="flex gap-1.5 items-center text-xs font-black text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200/40">
                  <span>سود حداکثری و حذف دلالان بازار</span>
                </div>
              </div>
            )}

            {/* Step Label & short title */}
            <span className={`text-xs font-black mt-2 ${steps[activeStep].color}`}>
              {steps[activeStep].label}
            </span>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Interactive Responsive Pipeline Line */}
      <div className="relative z-10 my-4">
        {/* Track Bar with Moving Pulse Dot */}
        <div className="relative w-full h-2.5 bg-slate-100 rounded-full overflow-hidden mb-5">
          <motion.div
            className="h-full bg-gradient-to-r from-emerald-500 via-teal-500 via-amber-500 via-indigo-500 to-rose-500 rounded-full"
            initial={false}
            animate={{ width: `${((activeStep + 1) / steps.length) * 100}%` }}
            transition={{ type: 'spring', stiffness: 90, damping: 18 }}
          />
        </div>

        {/* 5 Step Nodes with Custom Hover and States */}
        <div className="grid grid-cols-5 gap-1.5 sm:gap-3 text-center">
          {steps.map((step, idx) => {
            const isActive = activeStep === idx;
            const isPassed = activeStep > idx;

            return (
              <button
                key={step.id}
                type="button"
                onClick={() => {
                  setActiveStep(idx);
                  setIsPlaying(false); // pause autoplay on user manual selection
                }}
                className="flex flex-col items-center group cursor-pointer focus:outline-none"
              >
                {/* Node Box */}
                <motion.div
                  animate={{ 
                    scale: isActive ? 1.15 : 1,
                    boxShadow: isActive ? `0 10px 15px -3px ${step.glowColor}` : 'none'
                  }}
                  transition={{ type: 'spring', stiffness: 300, damping: 18 }}
                  className={`relative w-10 h-10 xs:w-11 xs:h-11 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center text-base xs:text-lg sm:text-2xl transition-all duration-300 border-2 ${
                    isActive
                      ? `bg-white ${step.borderColor} text-slate-900 font-bold ring-4 ring-slate-100`
                      : isPassed
                      ? 'bg-emerald-50 border-emerald-300/60 text-slate-700'
                      : 'bg-white border-slate-200/80 text-slate-400 group-hover:border-slate-350'
                  }`}
                >
                  <span className={isActive ? 'animate-bounce' : ''}>{step.emoji}</span>

                  {isActive && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white shadow-sm animate-ping" />
                  )}
                </motion.div>

                {/* Short Title */}
                <span className={`text-[10px] sm:text-xs font-black mt-2 transition-colors leading-none truncate max-w-full block ${
                  isActive ? 'text-slate-900 font-black' : 'text-slate-400 font-extrabold'
                }`}>
                  {step.title}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Detailed Description Sub-Banner */}
      <div className="relative z-10 mt-4 pt-3.5 border-t border-slate-100 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-right">
        <div className="space-y-1 max-w-xl">
          <div className="flex items-center gap-1.5">
            <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${steps[activeStep].bgColor} text-white`}>
              {steps[activeStep].title}
            </span>
            <span className="text-[11px] font-black text-slate-800">{steps[activeStep].label}</span>
          </div>
          <p className="text-[11px] font-bold text-slate-500 leading-relaxed">
            {steps[activeStep].longDesc}
          </p>
        </div>

        {onOrderClick && (
          <button
            onClick={onOrderClick}
            className="shrink-0 bg-slate-900 hover:bg-emerald-600 active:scale-95 text-white px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 shadow-md shadow-slate-900/10 cursor-pointer"
          >
            <span>سفارش مستقیم از کارخانه</span>
            <ArrowLeft size={14} />
          </button>
        )}
      </div>
    </div>
  );
};
