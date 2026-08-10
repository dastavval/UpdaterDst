import React, { useState, useEffect } from 'react';
import { 
  Factory, 
  PackageCheck, 
  Truck, 
  Store, 
  ShieldCheck, 
  Play, 
  Pause, 
  ArrowLeft, 
  Clock, 
  CheckCircle2, 
  Sparkles,
  PhoneCall,
  Settings,
  Flame,
  Scan,
  Box,
  MapPin,
  TrendingUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface StepInfo {
  id: number;
  title: string;
  icon: React.FC<{ size?: number; className?: string }>;
  shortDesc: string;
  longDesc: string;
  timeEstimate: string;
  keyMetric: string;
  badgeBg: string;
  borderColor: string;
  accentColor: string;
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
      title: 'پخت و تولید', 
      icon: Factory,
      shortDesc: 'ورود مستقیم سفارش به خط پخت و تولید مکانیزه کارخانه', 
      longDesc: 'سفارش شما بلافاصله وارد خط تولید مدرن کارخانه شده و طبق فرمولاسیون استاندارد با دستگاه‌های اتوماتیک تولید می‌شود.',
      timeEstimate: '۱۲ الی ۲۴ ساعت',
      keyMetric: 'پایش خودکار دما (۱۸۵°C) و کیفیت پخت',
      badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      borderColor: 'border-emerald-500',
      accentColor: 'text-emerald-600'
    },
    { 
      id: 2, 
      title: 'سنجش کیفیت', 
      icon: ShieldCheck,
      shortDesc: 'آزمایش میکروبیولوژی، وزن‌سنجی و درج سیب سلامت', 
      longDesc: 'محصولات توسط واحد کنترل کیفیت (QC) آزمایش شده و علامت سیب سلامت و استانداردهای بهداشتی روی آن‌ها درج می‌گردد.',
      timeEstimate: '۲ الی ۴ ساعت',
      keyMetric: 'تاییدیه بهداشتی ۹۹.۹٪ و سیب سلامت',
      badgeBg: 'bg-teal-100 text-teal-800 border-teal-300',
      borderColor: 'border-teal-500',
      accentColor: 'text-teal-600'
    },
    { 
      id: 3, 
      title: 'بسته‌بندی کارتنی', 
      icon: PackageCheck,
      shortDesc: 'چیدمان در کارتن ۵ لایه، شرینک حرارتی و پالت‌بندی', 
      longDesc: 'محصولات اولیه در کارتن‌های مقاوم ۵ لایه صادراتی چیده شده و جهت جلوگیری از آسیب در حمل جاده‌ای تسمه‌کشی می‌شوند.',
      timeEstimate: '۳ الی ۶ ساعت',
      keyMetric: 'کارتن ۵ لایه ضد رطوبت و ضربه',
      badgeBg: 'bg-amber-100 text-amber-800 border-amber-300',
      borderColor: 'border-amber-500',
      accentColor: 'text-amber-600'
    },
    { 
      id: 4, 
      title: 'ترانزیت مسقف', 
      icon: Truck,
      shortDesc: 'حمل با ناوگان مسقف/یخچال‌دار همراه با بارنامه دولتی', 
      longDesc: 'بارگیری در تریلر مسقف پلمپ شده صورت گرفته و با بیمه‌نامه ۱۰۰٪ رسمی مستقیم به سمت انبار شما حرکت می‌کند.',
      timeEstimate: '۲۴ الی ۴۸ ساعت',
      keyMetric: 'پلمپ سربی + بیمه کامل حوادث کالا',
      badgeBg: 'bg-indigo-100 text-indigo-800 border-indigo-300',
      borderColor: 'border-indigo-500',
      accentColor: 'text-indigo-600'
    },
    { 
      id: 5, 
      title: 'تحویل بنکدار', 
      icon: Store,
      shortDesc: 'تخلیه سالم در انبار + سود کامل بنکداری بدون واسطه', 
      longDesc: 'محموله سالم و با اصالت درب فروشگاه یا انبار شما تخلیه شده و بیشترین حاشیه سود بنکداری مستقیماً عاید شما می‌شود.',
      timeEstimate: 'تحویل فوری',
      keyMetric: 'افزایش سود بنکدار تا +۳۵٪',
      badgeBg: 'bg-rose-100 text-rose-800 border-rose-300',
      borderColor: 'border-rose-500',
      accentColor: 'text-rose-600'
    }
  ];

  // Auto-cycle animation
  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % steps.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [isPlaying, steps.length]);

  const currentStep = steps[activeStep];

  return (
    <div className="relative w-full bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-sm select-none text-right" dir="rtl">
      
      {/* HEADER BAR */}
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Sparkles size={18} />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-black text-slate-900">
              نمایش زنده چرخه تأمین و توزیع مستقیم کارخانه
            </h3>
            <p className="text-[10px] font-bold text-slate-500 mt-0.5">
              شفافیت کامل از پخت اولیه تا تحویل سالم در انبار شما
            </p>
          </div>
        </div>

        {/* Play/Pause Button */}
        <button
          type="button"
          onClick={() => setIsPlaying(!isPlaying)}
          className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 bg-slate-50 hover:bg-slate-100 text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
        >
          {isPlaying ? (
            <>
              <Pause size={13} className="text-amber-600" />
              <span>توقف</span>
            </>
          ) : (
            <>
              <Play size={13} className="text-emerald-600" />
              <span>پخش انیمیشن</span>
            </>
          )}
        </button>
      </div>

      {/* WHITE THEME ANIMATED DISPLAY STAGE */}
      <div className="relative w-full min-h-[220px] sm:min-h-[240px] bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 border border-slate-200/80 rounded-2xl mb-4 overflow-hidden flex flex-col justify-between p-4 sm:p-5 shadow-xs">
        
        {/* Top Info Header */}
        <div className="flex items-center justify-between text-[11px] font-bold z-10">
          <span className={`px-3 py-1 rounded-xl border font-black ${currentStep.badgeBg} shadow-2xs`}>
            مرحله {activeStep + 1} از ۵: {currentStep.title}
          </span>
          <span className="flex items-center gap-1.5 text-slate-600 bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded-xl border border-slate-200 shadow-2xs">
            <Clock size={12} className="text-emerald-600" />
            <span>زمان تخمینی: {currentStep.timeEstimate}</span>
          </span>
        </div>

        {/* Dynamic Interactive Stage Art (WHITE BACKGROUND) */}
        <div className="relative z-10 my-auto py-2 flex flex-col items-center justify-center text-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeStep}
              initial={{ opacity: 0, y: 12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.96 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="flex flex-col items-center w-full max-w-lg"
            >
              {/* STAGE SPECIFIC ANIMATED GRAPHICS */}
              <div className="relative mb-3 flex items-center justify-center">
                
                {/* Stage 1: Factory Production Line */}
                {activeStep === 0 && (
                  <div className="relative w-20 h-20 bg-emerald-50 border-2 border-emerald-200 rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm overflow-hidden">
                    {/* Spinning Gears */}
                    <motion.div 
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 6, ease: "linear" }}
                      className="absolute top-2 left-2 text-emerald-400 opacity-60"
                    >
                      <Settings size={20} />
                    </motion.div>
                    
                    <Factory size={36} className="text-emerald-600 z-10" />

                    {/* Rising Steam */}
                    <motion.div 
                      animate={{ y: [-2, -12], opacity: [0, 0.8, 0] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                      className="absolute top-1 right-4 text-emerald-400"
                    >
                      <Flame size={14} />
                    </motion.div>

                    {/* Moving Conveyor Belt below */}
                    <div className="absolute bottom-1 inset-x-2 h-1 bg-emerald-200 rounded-full overflow-hidden">
                      <motion.div 
                        animate={{ x: [-20, 20] }}
                        transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                        className="w-full h-full bg-emerald-500 rounded-full"
                      />
                    </div>
                  </div>
                )}

                {/* Stage 2: Quality Control & Health Seal */}
                {activeStep === 1 && (
                  <div className="relative w-20 h-20 bg-teal-50 border-2 border-teal-200 rounded-2xl flex items-center justify-center text-teal-600 shadow-sm overflow-hidden">
                    <ShieldCheck size={38} className="text-teal-600 z-10" />
                    
                    {/* Animated Laser Scanner Line */}
                    <motion.div 
                      animate={{ y: [-28, 28] }}
                      transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
                      className="absolute inset-x-0 h-0.5 bg-teal-500 shadow-[0_0_8px_#14b8a6]"
                    />

                    {/* Health Check Pulse Ring */}
                    <motion.div 
                      animate={{ scale: [1, 1.25, 1], opacity: [0.3, 0.7, 0.3] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                      className="absolute inset-2 rounded-xl border border-teal-400"
                    />
                  </div>
                )}

                {/* Stage 3: Packaging & Strapping */}
                {activeStep === 2 && (
                  <div className="relative w-20 h-20 bg-amber-50 border-2 border-amber-200 rounded-2xl flex items-center justify-center text-amber-600 shadow-sm overflow-hidden">
                    <motion.div
                      animate={{ y: [0, -4, 0] }}
                      transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                      className="flex items-center justify-center"
                    >
                      <Box size={38} className="text-amber-600 z-10" />
                    </motion.div>

                    {/* Tape / Strap Animation */}
                    <motion.div 
                      animate={{ scaleX: [0, 1] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                      className="absolute h-1 bg-amber-500 inset-x-3 top-1/2 -translate-y-1/2 rounded-full"
                    />

                    <div className="absolute bottom-2 right-2 bg-amber-200 text-amber-800 text-[9px] font-black px-1 rounded">
                      ۵ لایه
                    </div>
                  </div>
                )}

                {/* Stage 4: Transit Truck on Road */}
                {activeStep === 3 && (
                  <div className="relative w-24 h-20 bg-indigo-50 border-2 border-indigo-200 rounded-2xl flex flex-col items-center justify-center text-indigo-600 shadow-sm overflow-hidden">
                    <motion.div
                      animate={{ x: [-8, 8, -8], y: [0, -1, 0] }}
                      transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
                      className="flex items-center justify-center z-10"
                    >
                      <Truck size={38} className="text-indigo-600" />
                    </motion.div>

                    {/* Animated Moving Road Dots */}
                    <div className="absolute bottom-2 inset-x-2 h-1 flex justify-between overflow-hidden">
                      <motion.div 
                        animate={{ x: [20, -20] }}
                        transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                        className="flex gap-1.5 text-indigo-400"
                      >
                        <span className="w-2 h-1 bg-indigo-400 rounded-full" />
                        <span className="w-2 h-1 bg-indigo-400 rounded-full" />
                        <span className="w-2 h-1 bg-indigo-400 rounded-full" />
                        <span className="w-2 h-1 bg-indigo-400 rounded-full" />
                      </motion.div>
                    </div>
                  </div>
                )}

                {/* Stage 5: Store Delivery & Profit */}
                {activeStep === 4 && (
                  <div className="relative w-20 h-20 bg-rose-50 border-2 border-rose-200 rounded-2xl flex items-center justify-center text-rose-600 shadow-sm overflow-hidden">
                    <Store size={38} className="text-rose-600 z-10" />

                    {/* Floating Profit Arrow */}
                    <motion.div 
                      animate={{ y: [4, -6, 4], opacity: [0.6, 1, 0.6] }}
                      transition={{ repeat: Infinity, duration: 1.6 }}
                      className="absolute top-1 left-2 bg-rose-500 text-white p-0.5 rounded-full shadow-2xs"
                    >
                      <TrendingUp size={12} />
                    </motion.div>

                    <div className="absolute bottom-1 bg-rose-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full shadow-2xs">
                      +۳۵٪ سود
                    </div>
                  </div>
                )}
              </div>

              {/* Title & Short Description */}
              <h4 className="text-sm sm:text-base font-black text-slate-900 mb-1">
                {currentStep.shortDesc}
              </h4>

              {/* Key Metric Badge */}
              <div className="inline-flex items-center gap-1.5 bg-white border border-slate-200 text-slate-800 px-3 py-1 rounded-full text-[11px] font-black shadow-2xs mt-1">
                <CheckCircle2 size={13} className={currentStep.accentColor} />
                <span>{currentStep.keyMetric}</span>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Bottom Step Progress Line */}
        <div className="relative z-10 w-full h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/60">
          <motion.div
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
            initial={false}
            animate={{ width: `${((activeStep + 1) / steps.length) * 100}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>
      </div>

      {/* 5 PIPELINE STEP BUTTONS */}
      <div className="grid grid-cols-5 gap-1.5 text-center mb-4">
        {steps.map((step, idx) => {
          const isActive = activeStep === idx;
          const IconComponent = step.icon;

          return (
            <button
              key={step.id}
              type="button"
              onClick={() => {
                setActiveStep(idx);
                setIsPlaying(false);
              }}
              className={`p-2 sm:p-2.5 rounded-xl border flex flex-col items-center gap-1 transition-all cursor-pointer ${
                isActive
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-black shadow-xs ring-1 ring-emerald-200'
                  : 'bg-slate-50/80 border-slate-200/80 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <IconComponent size={17} className={isActive ? 'text-emerald-600' : 'text-slate-400'} />
              <span className="text-[10px] sm:text-[11px] font-black leading-tight truncate w-full">
                {step.title}
              </span>
            </button>
          );
        })}
      </div>

      {/* FOOTER ACTION BAR */}
      <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-right">
        <p className="text-[11px] font-bold text-slate-600 leading-relaxed max-w-sm">
          {currentStep.longDesc}
        </p>

        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
          {/* Customer Support Call Button */}
          <a
            href="tel:09999123001"
            className="flex-1 sm:flex-none bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs group"
            title="تماس مستقیم تلفنی با پشتیبانی مشتریان"
          >
            <div className="relative flex items-center justify-center">
              <PhoneCall size={14} className="text-emerald-600 group-hover:rotate-12 transition-transform" />
              <span className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
            </div>
            <span>پشتیبان تلفنی</span>
          </a>

          {/* Quick Order Button */}
          {onOrderClick && (
            <button
              type="button"
              onClick={onOrderClick}
              className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
            >
              <span>ثبت سفارش</span>
              <ArrowLeft size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
