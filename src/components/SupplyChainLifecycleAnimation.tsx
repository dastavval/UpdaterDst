import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Coins, 
  TrendingUp, 
  Percent, 
  ShieldCheck, 
  Truck, 
  Store, 
  ArrowLeft, 
  Clock, 
  CheckCircle2, 
  Sparkles,
  PhoneCall,
  Play, 
  Pause, 
  Zap, 
  Check, 
  ChevronRight, 
  ChevronLeft,
  Banknote,
  BadgePercent,
  Receipt,
  Scale,
  Award,
  RefreshCw,
  ShoppingBag,
  HandCoins,
  Package
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CommercialStep {
  id: number;
  title: string;
  icon: React.FC<{ size?: number; className?: string }>;
  shortDesc: string;
  longDesc: string;
  timeEstimate: string;
  profitImpact: string;
  badgeBg: string;
  borderColor: string;
  accentColor: string;
  commercialMetrics: { label: string; value: string }[];
  wholesalerBenefit: string;
}

interface SupplyChainProps {
  onOrderClick?: () => void;
}

export const SupplyChainLifecycleAnimation: React.FC<SupplyChainProps> = ({ onOrderClick }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  const steps: CommercialStep[] = [
    { 
      id: 1, 
      title: 'خرید مستقیم کارخانه', 
      icon: Building2,
      shortDesc: 'حذف ۱۰۰٪ دلالان + صدور پیش‌فاکتور با کف قیمت تولیدی کشور', 
      longDesc: 'با خرید مستقیم از درب کارخانه، تمام کمیسیون‌ها و سودهای واسطه‌ای حذف شده و کالا با کمترین قیمت ممکن در ایران فاکتور می‌شود.',
      timeEstimate: 'صدور فوری پیش‌فاکتور',
      profitImpact: 'خرید با ۱۰٪ تا ۲۰٪ ارزان‌تر از بازار بنکداری',
      badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      borderColor: 'border-emerald-500',
      accentColor: 'text-emerald-600',
      commercialMetrics: [
        { label: 'حذف واسطه', value: '۱۰۰٪ مستقیم' },
        { label: 'تخفیف حجمی', value: 'تا ۳۲٪ پلکانی' },
        { label: 'نوع فاکتور', value: 'رسمی / شرکتی' }
      ],
      wholesalerBenefit: 'تضمین بهترین قیمت تمام‌شده در بنکداری‌های کشور'
    },
    { 
      id: 2, 
      title: 'حاشیه سود +۳۰٪ بنکدار', 
      icon: BadgePercent,
      shortDesc: 'تضمین حاشیه سود بالا و سودآوری عالی برای ویزیتور و پخش‌کننده', 
      longDesc: 'اختلاف قیمت مناسب درب کارخانه تا مصرف‌کننده، سود خالص فوق‌العاده‌ای برای شرکت‌های پخش، بنکداران و فروشگاه‌های زنجیره‌ای فراهم می‌سازد.',
      timeEstimate: 'تضمین بازدهی سرمایه',
      profitImpact: 'حاشیه سود خالص ۲۵٪ تا ۳۵٪ جهت مانور فروش',
      badgeBg: 'bg-teal-100 text-teal-800 border-teal-300',
      borderColor: 'border-teal-500',
      accentColor: 'text-teal-600',
      commercialMetrics: [
        { label: 'سود ناخالص', value: '۲۵٪ الی ۳۵٪' },
        { label: 'سود ویزیتوری', value: 'بالا و جذاب' },
        { label: 'رقابت قیمتی', value: 'قدرت چانه‌زنی بالا' }
      ],
      wholesalerBenefit: 'امکان اعطای تخفیف ویژه به فروشگاه‌های طرف قرارداد شما'
    },
    { 
      id: 3, 
      title: 'بسته‌بندی پرفروش و شکیل', 
      icon: ShoppingBag,
      shortDesc: 'گردش سریع کالا (Turnover) در شلف و بدون ماندگاری در انبار', 
      longDesc: 'بسته‌بندی لمینت صادراتی با بارکد استانداردملی و طرح مشتری‌پسند، باعث تسریع در خروج بار از انبار بنکدار و خرید مجدد خرده‌فروشان می‌شود.',
      timeEstimate: 'سرعت فروش ۲ برابری',
      profitImpact: 'حداقل خواب سرمایه و سرعت گردش پول بالا',
      badgeBg: 'bg-amber-100 text-amber-800 border-amber-300',
      borderColor: 'border-amber-500',
      accentColor: 'text-amber-600',
      commercialMetrics: [
        { label: 'کارتن صادراتی', value: '۵ لایه لمینت' },
        { label: 'ماندگاری محصول', value: '۱۲ ماه شمسی' },
        { label: 'نرخ خروج انبار', value: 'فوق‌العاده سریع' }
      ],
      wholesalerBenefit: 'تضمین صفر شدن ضایعات و عدم ماندگاری جنس در انبار شما'
    },
    { 
      id: 4, 
      title: 'ارسال ایمن + بیمه بار', 
      icon: Truck,
      shortDesc: 'ارسال با بارنامه دولتی، پلمپ کارخانه و بیمه ۱۰۰٪ سرمایه خریدار', 
      longDesc: 'محموله با پلمپ اختصاصی کارخانه و بیمه کامل حوادث ترانزیت بارگیری شده و بدون هیچ‌گونه خسارت یا شکستگی درب انبار شما تخلیه می‌شود.',
      timeEstimate: 'ارسال سریع به سراسر ایران',
      profitImpact: 'صفر شدن هزینه‌های پنهان شکستگی و آسیب بار',
      badgeBg: 'bg-indigo-100 text-indigo-800 border-indigo-300',
      borderColor: 'border-indigo-500',
      accentColor: 'text-indigo-600',
      commercialMetrics: [
        { label: 'پلمپ باربری', value: 'اختصاصی کارخانه' },
        { label: 'بیمه محموله', value: '۱۰۰٪ ارزش بار' },
        { label: 'تخفیف کرایه', value: 'برای سفارشات حجمی' }
      ],
      wholesalerBenefit: 'تحویل سر وقت کالا بدون ریسک مالی و خسارت جاده‌ای'
    },
    { 
      id: 5, 
      title: 'نقدشوندگی + گارانتی مرجوعی', 
      icon: HandCoins,
      shortDesc: 'بازگشت سریع اصل و سود سرمایه + تضمین ۱۰۰٪ تعویض کالا', 
      longDesc: 'به دلیل تقاضای دائمی بازار برای محصولات غذایی و نان ترخینه/ویفر، سرمایه شما در کمتر از ۱۵ روز با سود کامل نقد می‌شود. کارخانه ۱۰۰٪ مرجوعی را تضمین می‌کند.',
      timeEstimate: 'بازگشت سرمایه زیر ۱۵ روز',
      profitImpact: 'ضمانت ۱۰۰٪ مرجوعی و جایگزینی بدون قید و شرط',
      badgeBg: 'bg-rose-100 text-rose-800 border-rose-300',
      borderColor: 'border-rose-500',
      accentColor: 'text-rose-600',
      commercialMetrics: [
        { label: 'بازگشت سرمایه', value: '۱۰ الی ۱۵ روز' },
        { label: 'ضمانت مرجوعی', value: '۱۰۰٪ گارانتی' },
        { label: 'پشتیبانی فروش', value: 'استند و بنر رایگان' }
      ],
      wholesalerBenefit: 'خرید ۱۰۰٪ بدون ریسک با تضمین تعویض و پشتیبانی اکران'
    }
  ];

  const currentStep = steps[activeStep];

  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % steps.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [isPlaying, steps.length]);

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
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Coins size={18} />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-black text-slate-900 leading-tight">
              چرخه تجاری، سودآوری و فروش عمده کارخانه
            </h3>
            <p className="text-[10px] font-bold text-slate-500 mt-0.5">
              مزایای خرید مستقیم B2B، حاشیه سود بنکداری و تضمین فروش سریع
            </p>
          </div>
        </div>

        {/* Navigation & Controls */}
        <div className="flex items-center gap-1.5 shrink-0 mr-auto sm:mr-0">
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 p-0.5 rounded-xl">
            <button
              type="button"
              onClick={handlePrev}
              className="w-7 h-7 rounded-lg hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-all cursor-pointer"
              title="مرحله قبل"
            >
              <ChevronRight size={15} />
            </button>

            <button
              type="button"
              onClick={() => setIsPlaying(!isPlaying)}
              className="px-2 py-1 text-[11px] font-black text-slate-700 flex items-center gap-1 hover:bg-slate-200 rounded-lg transition-all cursor-pointer"
            >
              {isPlaying ? (
                <>
                  <Pause size={11} className="text-amber-600 animate-pulse" />
                  <span>توقف</span>
                </>
              ) : (
                <>
                  <Play size={11} className="text-emerald-600" />
                  <span>پخش</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleNext}
              className="w-7 h-7 rounded-lg hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-all cursor-pointer"
              title="مرحله بعد"
            >
              <ChevronLeft size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* PIPELINE VISUAL TRACK (RESPONSIVE STEPS TRACKER) */}
      <div className="relative mb-3.5 bg-slate-50/90 border border-slate-200/80 rounded-xl p-2 sm:p-2.5 overflow-x-auto scrollbar-none">
        
        {/* Connecting Progress Line (Desktop) */}
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
                className={`flex-1 flex flex-col items-center gap-1 sm:gap-1.5 p-1.5 rounded-xl transition-all cursor-pointer group ${
                  isActive 
                    ? 'bg-white border-2 border-emerald-500 shadow-sm scale-102 ring-2 ring-emerald-100' 
                    : isCompleted
                    ? 'bg-emerald-50/80 border border-emerald-200 text-emerald-800'
                    : 'bg-white/70 border border-slate-200/80 text-slate-500 hover:bg-slate-100'
                }`}
              >
                {/* Step Icon */}
                <div className={`relative w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center transition-transform ${
                  isActive 
                    ? 'bg-emerald-600 text-white shadow-xs scale-105' 
                    : isCompleted
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-slate-100 text-slate-500 group-hover:text-slate-800'
                }`}>
                  {isCompleted ? (
                    <Check size={16} className="text-emerald-700 stroke-[3]" />
                  ) : (
                    <IconComponent size={17} />
                  )}

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
      <div className="relative w-full min-h-[250px] bg-gradient-to-br from-emerald-50/40 via-white to-slate-50 border border-slate-200 rounded-2xl p-3.5 sm:p-5 mb-3.5 overflow-hidden flex flex-col justify-between shadow-2xs">
        
        {/* Top Badge Info Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 z-10 pb-2 border-b border-slate-100/80">
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-1 rounded-lg border text-[11px] font-black ${currentStep.badgeBg} shadow-2xs`}>
              مرحله {activeStep + 1} از ۵: {currentStep.title}
            </span>
            
            <span className="inline-flex items-center gap-1 bg-white border border-slate-200 text-slate-700 px-2.5 py-1 rounded-lg text-[10px] sm:text-[11px] font-bold shadow-2xs">
              <Clock size={12} className="text-emerald-600" />
              <span>زمان‌بندی: {currentStep.timeEstimate}</span>
            </span>
          </div>

          <div className="text-[10px] sm:text-[11px] font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 flex items-center gap-1">
            <Zap size={12} className="text-emerald-600" />
            <span>{currentStep.profitImpact}</span>
          </div>
        </div>

        {/* Animated Main Stage Display */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeStep}
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.3 }}
            className="my-auto py-2 z-10"
          >
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6 text-center md:text-right">
              
              {/* Visual Graphic Box */}
              <div className="relative shrink-0 flex items-center justify-center">
                
                {/* Stage 1: Factory Direct */}
                {activeStep === 0 && (
                  <div className="relative w-24 h-24 sm:w-28 sm:h-28 bg-emerald-500/10 border-2 border-emerald-400 rounded-2xl flex items-center justify-center text-emerald-700 shadow-xs overflow-hidden">
                    <Building2 size={46} className="text-emerald-600 drop-shadow-xs" />
                    <motion.div 
                      animate={{ scale: [1, 1.15, 1], opacity: [0.6, 1, 0.6] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                      className="absolute top-1.5 left-1.5 bg-emerald-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full shadow-2xs"
                    >
                      کف قیمت
                    </motion.div>
                    <div className="absolute bottom-1 bg-emerald-800 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-2xs">
                      بدون دلال
                    </div>
                  </div>
                )}

                {/* Stage 2: Profit Margin */}
                {activeStep === 1 && (
                  <div className="relative w-24 h-24 sm:w-28 sm:h-28 bg-teal-500/10 border-2 border-teal-400 rounded-2xl flex items-center justify-center text-teal-700 shadow-xs overflow-hidden">
                    <BadgePercent size={48} className="text-teal-600 drop-shadow-xs" />
                    <motion.div 
                      animate={{ y: [-3, 3, -3] }}
                      transition={{ repeat: Infinity, duration: 1.6 }}
                      className="absolute top-1.5 left-1.5 bg-teal-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full shadow-2xs"
                    >
                      +۳۵٪ سود
                    </motion.div>
                  </div>
                )}

                {/* Stage 3: Packaging & Turnover */}
                {activeStep === 2 && (
                  <div className="relative w-24 h-24 sm:w-28 sm:h-28 bg-amber-500/10 border-2 border-amber-400 rounded-2xl flex items-center justify-center text-amber-700 shadow-xs overflow-hidden">
                    <ShoppingBag size={46} className="text-amber-600 drop-shadow-xs" />
                    <div className="absolute bottom-1 bg-amber-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-2xs">
                      فروش ۲x سریع‌تر
                    </div>
                  </div>
                )}

                {/* Stage 4: Insured Transit */}
                {activeStep === 3 && (
                  <div className="relative w-28 h-24 sm:w-32 sm:h-28 bg-indigo-500/10 border-2 border-indigo-400 rounded-2xl flex items-center justify-center text-indigo-700 shadow-xs overflow-hidden">
                    <Truck size={46} className="text-indigo-600 drop-shadow-xs" />
                    <div className="absolute top-1.5 left-1.5 bg-indigo-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full shadow-2xs">
                      بیمه ۱۰۰٪
                    </div>
                  </div>
                )}

                {/* Stage 5: Fast Liquidity & Return Guarantee */}
                {activeStep === 4 && (
                  <div className="relative w-24 h-24 sm:w-28 sm:h-28 bg-rose-500/10 border-2 border-rose-400 rounded-2xl flex items-center justify-center text-rose-700 shadow-xs overflow-hidden">
                    <HandCoins size={46} className="text-rose-600 drop-shadow-xs" />
                    <div className="absolute bottom-1 bg-rose-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-2xs">
                      گارانتی مرجوعی
                    </div>
                  </div>
                )}
              </div>

              {/* Commercial Text Block */}
              <div className="flex-1 flex flex-col justify-center">
                <h4 className="text-sm sm:text-base font-black text-slate-900 leading-snug mb-1">
                  {currentStep.shortDesc}
                </h4>

                <p className="text-xs font-bold text-slate-600 leading-relaxed mb-3">
                  {currentStep.longDesc}
                </p>

                {/* 3 Commercial Key Metrics Cards */}
                <div className="grid grid-cols-3 gap-1.5">
                  {currentStep.commercialMetrics.map((metric, i) => (
                    <div key={i} className="p-2 bg-white border border-slate-200/90 rounded-xl text-center shadow-2xs">
                      <span className="block text-[10px] font-bold text-slate-500 mb-0.5">{metric.label}</span>
                      <span className="block text-[11px] font-black text-slate-900">{metric.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Bottom Progress Bar */}
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
          <span>پاسخگویی مستقیم واحد فروش عمده و صدور پیش‌فاکتور با تخفیف ویژه</span>
        </div>

        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
          {/* Support Call Button */}
          <a
            href="tel:09999123001"
            className="flex-1 sm:flex-none bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 px-3.5 py-2 rounded-full text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs group"
          >
            <PhoneCall size={14} className="text-emerald-600 group-hover:scale-110 transition-transform" />
            <span>مشاوره تلفنی</span>
          </a>

          {/* Direct Order Button */}
          {onOrderClick && (
            <button
              type="button"
              onClick={onOrderClick}
              className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-full text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
            >
              <span>ثبت سفارش عمده</span>
              <ArrowLeft size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
