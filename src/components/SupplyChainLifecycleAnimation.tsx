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
  Box,
  TrendingUp,
  RotateCcw,
  Layers,
  Thermometer,
  Zap,
  MapPin,
  Check,
  ChevronRight,
  ChevronLeft
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
  techSpecs: string[];
  financialBenefit: string;
}

interface SupplyChainProps {
  onOrderClick?: () => void;
}

export const SupplyChainLifecycleAnimation: React.FC<SupplyChainProps> = ({ onOrderClick }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'tech'>('overview');

  const steps: StepInfo[] = [
    { 
      id: 1, 
      title: 'پخت و تولید', 
      icon: Factory,
      shortDesc: 'ورود مستقیم سفارش به خط پخت و تولید مکانیزه کارخانه', 
      longDesc: 'سفارش شما بلافاصله وارد خط تولید مدرن کارخانه شده و طبق فرمولاسیون استاندارد با دستگاه‌های اتوماتیک و فر صنعتی پیشرفته پخته می‌شود.',
      timeEstimate: '۱۲ الی ۲۴ ساعت',
      keyMetric: 'پایش خودکار دما (۱۸۵°C) و رطوبت پخت',
      badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      borderColor: 'border-emerald-500',
      accentColor: 'text-emerald-600',
      techSpecs: ['فر تونلی حرارت غیرمستقیم', 'کنترل دیجیتال رطوبت و تردی نان', 'ظرفیت تولید ۱۰ تن در روز'],
      financialBenefit: 'کاهش ۳۰٪ هزینه‌های ضایعات و انبارداری با سفارش مستقیم روز'
    },
    { 
      id: 2, 
      title: 'سنجش کیفیت', 
      icon: ShieldCheck,
      shortDesc: 'آزمایش میکروبیولوژی، وزن‌سنجی و درج سیب سلامت', 
      longDesc: 'محصولات توسط واحد آزمایشگاه کنترل کیفیت (QC) بررسی شده، وزن‌سنجی دقیق انجام گرفته و علامت سیب سلامت و کد رهگیری بهداشتی ثبت می‌شود.',
      timeEstimate: '۲ الی ۴ ساعت',
      keyMetric: 'تاییدیه بهداشتی ۹۹.۹٪ و سیب سلامت رسمی',
      badgeBg: 'bg-teal-100 text-teal-800 border-teal-300',
      borderColor: 'border-teal-500',
      accentColor: 'text-teal-600',
      techSpecs: ['آزمایشگاه تخصصی شیمی و میکروبیولوژی', 'سورتر لیزری جهت ابعاد یکدست', 'ثبت تاریخ انقضا و سری ساخت پلمپ'],
      financialBenefit: 'ضمانت ۱۰۰٪ مرجوعی در صورت عدم تطابق با استاندارد کیفیت'
    },
    { 
      id: 3, 
      title: 'بسته‌بندی کارتنی', 
      icon: PackageCheck,
      shortDesc: 'چیدمان در کارتن ۵ لایه، شرینک حرارتی و پالت‌بندی', 
      longDesc: 'محصولات در کارتن‌های مقاوم ۵ لایه صادراتی قرار گرفته، شرینک حرارتی ضد رطوبت شده و جهت ایمنی کامل جاده‌ای تسمه‌کشی و پالت‌بندی می‌شوند.',
      timeEstimate: '۳ الی ۶ ساعت',
      keyMetric: 'کارتن ۵ لایه لمینت صادراتی مقاوم در برابر رطوبت',
      badgeBg: 'bg-amber-100 text-amber-800 border-amber-300',
      borderColor: 'border-amber-500',
      accentColor: 'text-amber-600',
      techSpecs: ['کارتن ۵ لایه با تحمل فشار ۱۲۰ کیلوگرم', 'سلفون‌کشی پالتی ضدرطوبت', 'کدنویسی بارکد استاندارد جهت انبارداری آسان'],
      financialBenefit: 'صفر شدن درصد شکستگی بار در حمل به شهرستان‌ها'
    },
    { 
      id: 4, 
      title: 'ترانزیت مسقف', 
      icon: Truck,
      shortDesc: 'حمل با ناوگان مسقف/یخچال‌دار همراه با بارنامه دولتی', 
      longDesc: 'بارگیری در تریلر مسقف پلمپ شده صورت گرفته و با بیمه‌نامه ۱۰۰٪ رسمی صادره از باربری دولتی مستقیم به سمت انبار شما حرکت می‌کند.',
      timeEstimate: '۲۴ الی ۴۸ ساعت',
      keyMetric: 'پلمپ سربی + بیمه کامل حوادث و سرقت کالا',
      badgeBg: 'bg-indigo-100 text-indigo-800 border-indigo-300',
      borderColor: 'border-indigo-500',
      accentColor: 'text-indigo-600',
      techSpecs: ['ردیابی زنده GPS کامیون ترانزیت', 'پلمپ اختصاصی شماره‌دار درب کارخانه', 'بارنامه رسمی و بیمه آسیا/ایران'],
      financialBenefit: 'ارسال ایمن و تحویل سر وقت بدون ریسک مالی خسارت در راه'
    },
    { 
      id: 5, 
      title: 'تحویل بنکدار', 
      icon: Store,
      shortDesc: 'تخلیه سالم در انبار + سود کامل بنکداری بدون واسطه', 
      longDesc: 'محموله سالم و با اصالت درب فروشگاه یا انبار شما تخلیه شده و بیشترین حاشیه سود بنکداری و پخش مستقیماً عاید شما می‌شود.',
      timeEstimate: 'تحویل فوری',
      keyMetric: 'افزایش سود بنکدار تا +۳۵٪ نسبت به واسطه‌ها',
      badgeBg: 'bg-rose-100 text-rose-800 border-rose-300',
      borderColor: 'border-rose-500',
      accentColor: 'text-rose-600',
      techSpecs: ['تحویل با فاکتور رسمی و گارانتی اصالت', 'ارائه عکس و چک‌لیست قبل و بعد بارگیری', 'پشتیبانی اختصاصی تا زمان فروش کامل'],
      financialBenefit: 'حذف کامل واسطه‌ها، خریدی با کمترین قیمت ممکن در بازار ایران'
    }
  ];

  // Auto-cycle animation
  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % steps.length);
    }, 4800);
    return () => clearInterval(timer);
  }, [isPlaying, steps.length]);

  const currentStep = steps[activeStep];

  const handleNext = () => {
    setIsPlaying(false);
    setActiveStep((prev) => (prev + 1) % steps.length);
  };

  const handlePrev = () => {
    setIsPlaying(false);
    setActiveStep((prev) => (prev - 1 + steps.length) % steps.length);
  };

  return (
    <div className="relative w-full bg-white border border-slate-200/90 rounded-2xl p-3.5 sm:p-5 shadow-xs select-none text-right transition-all" dir="rtl">
      
      {/* HEADER BAR */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pb-3 mb-3.5 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Sparkles size={17} />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-black text-slate-900 leading-tight">
              چرخه هوشمند تأمین و توزیع مستقیم کارخانه
            </h3>
            <p className="text-[10px] font-bold text-slate-500 mt-0.5">
              از پخت اولیه در فر صنعتی تا تخلیه در انبار بنکدار
            </p>
          </div>
        </div>

        {/* Play/Pause & Nav Controls */}
        <div className="flex items-center gap-1.5 shrink-0 mr-auto sm:mr-0">
          <button
            type="button"
            onClick={handlePrev}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 flex items-center justify-center transition-all cursor-pointer"
            title="مرحله قبل"
          >
            <ChevronRight size={15} />
          </button>

          <button
            type="button"
            onClick={() => setIsPlaying(!isPlaying)}
            className="px-2.5 sm:px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 bg-slate-50 hover:bg-slate-100 text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            {isPlaying ? (
              <>
                <Pause size={12} className="text-amber-600 animate-pulse" />
                <span className="text-[11px]">توقف</span>
              </>
            ) : (
              <>
                <Play size={12} className="text-emerald-600" />
                <span className="text-[11px]">پخش</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleNext}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 flex items-center justify-center transition-all cursor-pointer"
            title="مرحله بعد"
          >
            <ChevronLeft size={15} />
          </button>
        </div>
      </div>

      {/* PIPELINE VISUAL TRACK (RESPONSIVE STEPS TRACKER) */}
      <div className="relative mb-4 bg-slate-50/90 border border-slate-200/80 rounded-xl p-2 sm:p-3 overflow-x-auto scrollbar-none">
        
        {/* Connecting Progress Line (Desktop/Tablet) */}
        <div className="hidden sm:block absolute top-1/2 left-8 right-8 h-1 bg-slate-200 -translate-y-1/2 z-0 rounded-full" />
        <motion.div 
          className="hidden sm:block absolute top-1/2 right-8 h-1 bg-gradient-to-l from-emerald-500 via-teal-500 to-indigo-500 -translate-y-1/2 z-0 rounded-full transition-all duration-500"
          style={{
            width: `${(activeStep / (steps.length - 1)) * 88}%`
          }}
        />

        <div className="relative z-10 flex items-center justify-between min-w-[340px] sm:min-w-0 gap-1.5 sm:gap-2">
          {steps.map((step, idx) => {
            const isActive = activeStep === idx;
            const isCompleted = activeStep > idx;
            const IconComponent = step.icon;

            return (
              <button
                key={step.id}
                type="button"
                onClick={() => {
                  setActiveStep(idx);
                  setIsPlaying(false);
                }}
                className={`flex-1 flex flex-col items-center gap-1 sm:gap-1.5 p-1.5 sm:p-2 rounded-xl transition-all cursor-pointer group ${
                  isActive 
                    ? 'bg-white border-2 border-emerald-500 shadow-sm scale-102 ring-2 ring-emerald-100' 
                    : isCompleted
                    ? 'bg-emerald-50/80 border border-emerald-200 text-emerald-800'
                    : 'bg-white/70 border border-slate-200/80 text-slate-500 hover:bg-slate-100'
                }`}
              >
                {/* Step Circle Icon */}
                <div className={`relative w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-transform ${
                  isActive 
                    ? 'bg-emerald-600 text-white shadow-xs scale-105' 
                    : isCompleted
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-slate-100 text-slate-500 group-hover:text-slate-800'
                }`}>
                  {isCompleted ? (
                    <Check size={16} className="text-emerald-700 stroke-[3]" />
                  ) : (
                    <IconComponent size={18} />
                  )}

                  {/* Active Ripple */}
                  {isActive && (
                    <span className="absolute -inset-1 rounded-xl border border-emerald-400 animate-ping opacity-30" />
                  )}
                </div>

                {/* Step Title */}
                <span className={`text-[10px] sm:text-[11px] font-black leading-tight text-center truncate w-full ${
                  isActive ? 'text-emerald-950 font-black' : isCompleted ? 'text-emerald-800' : 'text-slate-600'
                }`}>
                  {step.title}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* DYNAMIC STAGE CONTAINER */}
      <div className="relative w-full min-h-[260px] sm:min-h-[270px] bg-gradient-to-br from-slate-50 via-white to-emerald-50/20 border border-slate-200 rounded-2xl p-3.5 sm:p-5 mb-3.5 overflow-hidden flex flex-col justify-between shadow-2xs">
        
        {/* Top Info Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 z-10 pb-2 border-b border-slate-100/80">
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-1 rounded-lg border text-[11px] font-black ${currentStep.badgeBg} shadow-2xs`}>
              مرحله {activeStep + 1} از ۵: {currentStep.title}
            </span>
            
            <span className="inline-flex items-center gap-1 bg-white border border-slate-200 text-slate-700 px-2.5 py-1 rounded-lg text-[10px] sm:text-[11px] font-bold shadow-2xs">
              <Clock size={12} className="text-emerald-600" />
              <span>زمان: {currentStep.timeEstimate}</span>
            </span>
          </div>

          {/* Tab Switcher: Overview vs Technical Details */}
          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-[10px] font-bold">
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                activeTab === 'overview' ? 'bg-white text-slate-900 font-black shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              نمای کلی
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('tech')}
              className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                activeTab === 'tech' ? 'bg-white text-slate-900 font-black shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              جزئیات فنی
            </button>
          </div>
        </div>

        {/* Animated Main Graphic Display */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeStep + '-' + activeTab}
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.3 }}
            className="my-auto py-3 z-10"
          >
            {activeTab === 'overview' ? (
              <div className="flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6 text-center md:text-right">
                
                {/* Visual Graphic Box */}
                <div className="relative shrink-0 flex items-center justify-center">
                  
                  {/* Stage 1: Factory Production */}
                  {activeStep === 0 && (
                    <div className="relative w-24 h-24 sm:w-28 sm:h-28 bg-emerald-50/90 border-2 border-emerald-300 rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm overflow-hidden">
                      <motion.div 
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
                        className="absolute top-2 left-2 text-emerald-400 opacity-60"
                      >
                        <Settings size={22} />
                      </motion.div>
                      
                      <Factory size={44} className="text-emerald-600 z-10 drop-shadow-xs" />

                      {/* Flame steam */}
                      <motion.div 
                        animate={{ y: [-2, -14], opacity: [0, 0.9, 0] }}
                        transition={{ repeat: Infinity, duration: 1.8 }}
                        className="absolute top-2 right-4 text-emerald-500"
                      >
                        <Flame size={16} />
                      </motion.div>

                      {/* Temperature Badge */}
                      <div className="absolute top-1.5 left-1.5 bg-emerald-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shadow-2xs">
                        <Thermometer size={10} />
                        <span>۱۸۵°C</span>
                      </div>

                      {/* Moving Belt */}
                      <div className="absolute bottom-1.5 inset-x-2 h-1.5 bg-emerald-200 rounded-full overflow-hidden">
                        <motion.div 
                          animate={{ x: [-30, 30] }}
                          transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
                          className="w-full h-full bg-emerald-500 rounded-full"
                        />
                      </div>
                    </div>
                  )}

                  {/* Stage 2: Quality Control */}
                  {activeStep === 1 && (
                    <div className="relative w-24 h-24 sm:w-28 sm:h-28 bg-teal-50/90 border-2 border-teal-300 rounded-2xl flex items-center justify-center text-teal-600 shadow-sm overflow-hidden">
                      <ShieldCheck size={46} className="text-teal-600 z-10" />
                      
                      {/* Laser Line */}
                      <motion.div 
                        animate={{ y: [-32, 32] }}
                        transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}
                        className="absolute inset-x-0 h-0.5 bg-teal-500 shadow-[0_0_10px_#14b8a6]"
                      />

                      <div className="absolute top-1.5 left-1.5 bg-teal-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full shadow-2xs">
                        سیب سلامت
                      </div>
                    </div>
                  )}

                  {/* Stage 3: Packaging */}
                  {activeStep === 2 && (
                    <div className="relative w-24 h-24 sm:w-28 sm:h-28 bg-amber-50/90 border-2 border-amber-300 rounded-2xl flex items-center justify-center text-amber-600 shadow-sm overflow-hidden">
                      <motion.div
                        animate={{ y: [0, -5, 0] }}
                        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                        className="flex items-center justify-center"
                      >
                        <Box size={46} className="text-amber-600 z-10" />
                      </motion.div>

                      {/* Strapping Band */}
                      <motion.div 
                        animate={{ scaleX: [0, 1] }}
                        transition={{ repeat: Infinity, duration: 1.8 }}
                        className="absolute h-1 bg-amber-500 inset-x-2 top-1/2 -translate-y-1/2 rounded-full"
                      />

                      <div className="absolute bottom-1.5 right-1.5 bg-amber-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full shadow-2xs">
                        ۵ لایه لمینت
                      </div>
                    </div>
                  )}

                  {/* Stage 4: Transit Truck */}
                  {activeStep === 3 && (
                    <div className="relative w-28 h-24 sm:w-32 sm:h-28 bg-indigo-50/90 border-2 border-indigo-300 rounded-2xl flex flex-col items-center justify-center text-indigo-600 shadow-sm overflow-hidden">
                      <motion.div
                        animate={{ x: [-6, 6, -6], y: [0, -1, 0] }}
                        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                        className="flex items-center justify-center z-10"
                      >
                        <Truck size={46} className="text-indigo-600" />
                      </motion.div>

                      <div className="absolute top-1.5 left-1.5 bg-indigo-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shadow-2xs">
                        <MapPin size={9} />
                        <span>ردیابی GPS</span>
                      </div>

                      {/* Road Line */}
                      <div className="absolute bottom-2 inset-x-2 h-1 flex justify-between overflow-hidden">
                        <motion.div 
                          animate={{ x: [30, -30] }}
                          transition={{ repeat: Infinity, duration: 0.7, ease: "linear" }}
                          className="flex gap-1.5 text-indigo-400"
                        >
                          <span className="w-3 h-1 bg-indigo-400 rounded-full" />
                          <span className="w-3 h-1 bg-indigo-400 rounded-full" />
                          <span className="w-3 h-1 bg-indigo-400 rounded-full" />
                        </motion.div>
                      </div>
                    </div>
                  )}

                  {/* Stage 5: Store Delivery */}
                  {activeStep === 4 && (
                    <div className="relative w-24 h-24 sm:w-28 sm:h-28 bg-rose-50/90 border-2 border-rose-300 rounded-2xl flex items-center justify-center text-rose-600 shadow-sm overflow-hidden">
                      <Store size={46} className="text-rose-600 z-10" />

                      <motion.div 
                        animate={{ y: [4, -5, 4], opacity: [0.7, 1, 0.7] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                        className="absolute top-1.5 left-1.5 bg-rose-600 text-white p-1 rounded-full shadow-2xs"
                      >
                        <TrendingUp size={12} />
                      </motion.div>

                      <div className="absolute bottom-1.5 bg-rose-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-2xs">
                        +۳۵٪ سود بنکدار
                      </div>
                    </div>
                  )}
                </div>

                {/* Text Description Block */}
                <div className="flex-1 flex flex-col justify-center">
                  <h4 className="text-sm sm:text-base font-black text-slate-900 leading-snug mb-1">
                    {currentStep.shortDesc}
                  </h4>

                  <p className="text-xs font-bold text-slate-600 leading-relaxed mb-3">
                    {currentStep.longDesc}
                  </p>

                  <div className="flex flex-wrap items-center gap-2 justify-center md:justify-start">
                    <div className="inline-flex items-center gap-1.5 bg-white border border-slate-200 text-slate-800 px-3 py-1 rounded-xl text-[11px] font-black shadow-2xs">
                      <CheckCircle2 size={14} className={currentStep.accentColor} />
                      <span>{currentStep.keyMetric}</span>
                    </div>

                    <div className="inline-flex items-center gap-1 bg-amber-50 border border-amber-200 text-amber-800 px-2.5 py-1 rounded-xl text-[10px] font-black">
                      <Zap size={11} className="text-amber-600" />
                      <span>مزیت: {currentStep.financialBenefit}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Technical Specs Tab View */
              <div className="w-full text-right">
                <h4 className="text-xs font-black text-slate-900 mb-2.5 flex items-center gap-1.5">
                  <Layers size={14} className="text-emerald-600" />
                  <span>مشخصات فنی و استانداردهای این مرحله ({currentStep.title}):</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {currentStep.techSpecs.map((spec, index) => (
                    <div 
                      key={index}
                      className="p-2.5 bg-white border border-slate-200/90 rounded-xl text-[11px] font-bold text-slate-700 flex items-start gap-2 shadow-2xs"
                    >
                      <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">
                        {index + 1}
                      </span>
                      <span className="leading-tight">{spec}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-3 p-2.5 bg-emerald-50/80 border border-emerald-200 rounded-xl text-[11px] font-bold text-emerald-900 flex items-center justify-between">
                  <span>تاثیر روی حاشیه سود بنکداری: {currentStep.financialBenefit}</span>
                  <span className="font-black text-emerald-700">تضمین کارخانه</span>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Bottom Progress Line */}
        <div className="relative z-10 w-full h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/60 mt-2">
          <motion.div
            className="h-full bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-500 rounded-full"
            initial={false}
            animate={{ width: `${((activeStep + 1) / steps.length) * 100}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>
      </div>

      {/* FOOTER ACTION BAR */}
      <div className="pt-2.5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-right">
        <div className="flex items-center gap-2 text-[11px] font-bold text-slate-600">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping shrink-0" />
          <span>پاسخگویی سریع کارشناسان فروش عمده و سفارش بنکداری</span>
        </div>

        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
          {/* Support Call Button (With pulse and green theme) */}
          <a
            href="tel:09999123001"
            className="flex-1 sm:flex-none bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 px-3.5 py-2 rounded-full text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs group"
            title="تماس مستقیم تلفنی با پشتیبانی مشتریان"
          >
            <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform">
              <PhoneCall size={13} className="animate-pulse" />
            </div>
            <span>پشتیبان تلفنی</span>
          </a>

          {/* Quick Order Button */}
          {onOrderClick && (
            <button
              type="button"
              onClick={onOrderClick}
              className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-full text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
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

