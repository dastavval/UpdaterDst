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
  Package,
  Layers,
  Crown,
  FastForward,
  Sparkle
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
  const [animSpeed, setAnimSpeed] = useState<number>(3500); // 3.5 seconds
  const [activeTab, setActiveTab] = useState<'flow' | 'calculator'>('flow');

  // Interactive Profit Margin Calculator State
  const [orderTonnage, setOrderTonnage] = useState<number>(3); // Tons
  const [sellingPricePerKg, setSellingPricePerKg] = useState<number>(140000); // Tomans

  // Calculations for Wholesaler
  const factoryDiscountPercent = orderTonnage >= 10 ? 35 : orderTonnage >= 5 ? 30 : orderTonnage >= 2 ? 25 : 20;
  const factoryCostPerKg = sellingPricePerKg * (1 - factoryDiscountPercent / 100);
  const netProfitPerKg = sellingPricePerKg - factoryCostPerKg;
  const profitMarginPercent = Math.round((netProfitPerKg / factoryCostPerKg) * 100);
  const totalNetProfit = netProfitPerKg * orderTonnage * 1000;

  const steps: CommercialStep[] = [
    { 
      id: 1, 
      title: 'تحویل کالا از خط تولید', 
      icon: Building2,
      shortDesc: 'ما کالا را به قیمت تمام‌شده کارخانه تحویل می‌دهیم', 
      longDesc: 'محصولات مستقیم از خط تولید با حداقل قیمت مصوب صادر می‌شوند؛ ۱۰۰٪ سود فروش و تعیین قیمت نهایی در اختیار کامل شماست.',
      timeEstimate: 'صدور فوری پیش‌فاکتور',
      profitImpact: 'قیمت خروجی کارخانه',
      badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      borderColor: 'border-emerald-500',
      accentColor: 'text-emerald-600',
      commercialMetrics: [
        { label: 'حذف واسطه', value: '۱۰۰٪ مستقیم' },
        { label: 'تخفیف حجمی', value: 'تا ۳۵٪ پایه' },
        { label: 'کنترل قیمت', value: '۱۰۰٪ دست شما' }
      ],
      wholesalerBenefit: 'تضمین تامین پایدار کالا با کف قیمت تمام‌شده'
    },
    { 
      id: 2, 
      title: 'سود ۱۰۰٪ در اختیار شما', 
      icon: BadgePercent,
      shortDesc: 'تعیین قیمت فروش و حاشیه سود تا ۱۰۰٪ کاملاً دست خودتان است', 
      longDesc: 'چون کالا را مستقیم از کارخانه دریافت می‌کنید، دست شما برای سودآوری، قیمت‌گذاری دلخواه و اعطای تخفیف به خریداران باز است.',
      timeEstimate: 'سودآوری حداکثری',
      profitImpact: 'حاشیه سود تا ۱۰۰٪ دست شماست',
      badgeBg: 'bg-teal-100 text-teal-800 border-teal-300',
      borderColor: 'border-teal-500',
      accentColor: 'text-teal-600',
      commercialMetrics: [
        { label: 'حاشیه سود', value: 'اختیاری (تا ۱۰۰٪)' },
        { label: 'مدیریت بازار', value: 'کاملاً مستقل' },
        { label: 'قدرت مانور', value: 'فوق‌العاده بالا' }
      ],
      wholesalerBenefit: 'امکان قیمت‌گذاری رقابتی در منطقه و کسب بیشترین سود ممکن'
    },
    { 
      id: 3, 
      title: 'بسته‌بندی پرفروش و شکیل', 
      icon: ShoppingBag,
      shortDesc: 'گردش سریع کالا (Turnover) در شلف و فروش بی‌دردسر', 
      longDesc: 'بسته‌بندی لمینت صادراتی با بارکد ملی و طرح مشتری‌پسند، باعث تسریع در خروج بار از انبار شما و خرید مجدد مغازه‌داران می‌شود.',
      timeEstimate: 'فروش ۲ برابری',
      profitImpact: 'صفر شدن خواب سرمایه',
      badgeBg: 'bg-amber-100 text-amber-800 border-amber-300',
      borderColor: 'border-amber-500',
      accentColor: 'text-amber-600',
      commercialMetrics: [
        { label: 'نوع بسته‌بندی', value: '۵ لایه لمینت' },
        { label: 'ماندگاری کالا', value: '۱۲ ماه کامل' },
        { label: 'سرعت خروج', value: 'فوق‌العاده بالا' }
      ],
      wholesalerBenefit: 'تضمین عدم ماندگاری جنس در انبار و نقدشوندگی سریع'
    },
    { 
      id: 4, 
      title: 'ارسال ایمن + بیمه بار', 
      icon: Truck,
      shortDesc: 'ارسال با پلمپ اختصاصی کارخانه و بیمه ۱۰۰٪ سرمایه خریدار', 
      longDesc: 'محموله با پلمپ رسمی و بیمه کامل حوادث ترانزیت بارگیری شده و بدون هیچ‌گونه خسارت یا شکستگی درب انبار شما تخلیه می‌شود.',
      timeEstimate: 'ارسال به سراسر ایران',
      profitImpact: 'صفر شدن خسارت باربری',
      badgeBg: 'bg-blue-100 text-blue-800 border-blue-300',
      borderColor: 'border-blue-500',
      accentColor: 'text-blue-600',
      commercialMetrics: [
        { label: 'پلمپ ترانزیت', value: 'اختصاصی کارخانه' },
        { label: 'پوشش بیمه', value: '۱۰۰٪ ارزش بار' },
        { label: 'تخفیف کرایه', value: 'سفارشات پالتی' }
      ],
      wholesalerBenefit: 'تحویل سر وقت کالا بدون کوچک‌ترین آسیب و ریسک جاده‌ای'
    },
    { 
      id: 5, 
      title: 'ضمانت ۱۰۰٪ مرجوعی', 
      icon: HandCoins,
      shortDesc: 'تضمین تعویض و مرجوعی کالا بدون قید و شرط توسط کارخانه', 
      longDesc: 'با خیال راحت سفارش دهید؛ در صورت عدم رضایت یا نیاز به تعویض، کارخانه ۱۰۰٪ مرجوعی و جایگزینی بار را تضمین می‌کند.',
      timeEstimate: 'خرید ۱۰۰٪ امن',
      profitImpact: 'تضمین بازگشت سرمایه',
      badgeBg: 'bg-rose-100 text-rose-800 border-rose-300',
      borderColor: 'border-rose-500',
      accentColor: 'text-rose-600',
      commercialMetrics: [
        { label: 'گارانتی مرجوعی', value: '۱۰۰٪ تضمین تعویض' },
        { label: 'بازگشت سرمایه', value: 'زیر ۱۵ روز' },
        { label: 'پشتیبانی', value: 'استند و اکران رایگان' }
      ],
      wholesalerBenefit: 'تجارت ۱۰۰٪ بدون ریسک با پشتیبانی همه‌جانبه کارخانه'
    }
  ];

  const currentStep = steps[activeStep];

  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % steps.length);
    }, animSpeed);
    return () => clearInterval(timer);
  }, [isPlaying, steps.length, animSpeed]);

  return (
    <div className="relative w-full bg-white border border-slate-200 rounded-3xl p-3 sm:p-6 shadow-sm select-none text-right transition-all overflow-hidden" dir="rtl">
      
      {/* HEADER BAR */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-2.5 pb-4 mb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
            <Coins size={22} className="animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md border border-emerald-300">
                سود ۱۰۰٪ دست خودتان
              </span>
              <h3 className="text-sm sm:text-base font-black text-slate-900 leading-tight">
                چرخه تامین محصول و سودآوری فروشنده
              </h3>
            </div>
            <p className="text-[11px] font-bold text-slate-500 mt-0.5">
              ما کالا را به قیمت کارخانه می‌دهیم؛ تعیین قیمت فروش و سود حاصله کاملاً دست شماست
            </p>
          </div>
        </div>

        {/* Tab & Navigation Controls */}
        <div className="flex items-center gap-2 shrink-0 mr-auto sm:mr-0">
          <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setActiveTab('flow')}
              className={`px-3 py-1 rounded-lg text-[11px] font-black transition-all cursor-pointer ${
                activeTab === 'flow' 
                  ? 'bg-emerald-600 text-white shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              چرخه انیمیشنی
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('calculator')}
              className={`px-3 py-1 rounded-lg text-[11px] font-black transition-all cursor-pointer ${
                activeTab === 'calculator' 
                  ? 'bg-emerald-600 text-white shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              محاسبه‌گر سود
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsPlaying(!isPlaying)}
            className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-black flex items-center gap-1.5 transition-all cursor-pointer ${
              isPlaying 
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300' 
                : 'bg-slate-100 text-slate-600 border-slate-200'
            }`}
          >
            {isPlaying ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <Pause size={13} />
                <span>پخش خودکار</span>
              </>
            ) : (
              <>
                <Play size={13} className="text-emerald-600" />
                <span>شروع</span>
              </>
            )}
          </button>
        </div>
      </div>

      {activeTab === 'flow' ? (
        <>
          {/* PIPELINE STEPS TRACKER */}
          <div className="relative z-10 mb-4 bg-slate-50 border border-slate-200 rounded-2xl p-2 sm:p-2.5 overflow-x-auto scrollbar-none">
            <div className="relative z-10 flex items-center justify-between min-w-[360px] sm:min-w-0 gap-2 sm:gap-3">
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
                    className={`flex-1 flex flex-col items-center gap-1.5 p-2 rounded-2xl transition-all cursor-pointer group ${
                      isActive 
                        ? 'bg-white border-2 border-emerald-600 shadow-md scale-102 ring-2 ring-emerald-100' 
                        : isCompleted
                        ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                        : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    <div className={`relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-transform ${
                      isActive 
                        ? 'bg-emerald-600 text-white shadow-sm' 
                        : isCompleted
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      {isCompleted ? (
                        <Check size={18} className="text-emerald-700 stroke-[3]" />
                      ) : (
                        <IconComponent size={18} />
                      )}
                    </div>

                    <span className={`text-[11px] font-black leading-tight text-center truncate w-full ${
                      isActive ? 'text-emerald-950 font-black' : 'text-slate-700'
                    }`}>
                      {step.title}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* WHITE-THEMED HIGH-IMPACT DISPLAY STAGE */}
          <div className="relative z-10 w-full bg-white border-2 border-emerald-300 rounded-2xl p-4 sm:p-6 mb-4 overflow-hidden flex flex-col justify-between shadow-xs">
            
            {/* TOP STATUS HEADER */}
            <div className="flex flex-wrap items-center justify-between gap-2 z-10 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-black border border-emerald-300 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping" />
                  مرحله {activeStep + 1} از ۵: {currentStep.title}
                </span>
                
                <span className="inline-flex items-center gap-1 bg-slate-100 border border-slate-200 text-slate-700 px-3 py-1 rounded-xl text-xs font-bold">
                  <Clock size={14} className="text-emerald-600" />
                  <span>{currentStep.timeEstimate}</span>
                </span>
              </div>

              <div className="text-xs font-black text-amber-800 bg-amber-50 px-3 py-1 rounded-xl border border-amber-200 flex items-center gap-1.5">
                <Zap size={14} className="text-amber-600" />
                <span>{currentStep.profitImpact}</span>
              </div>
            </div>

            {/* ANIMATED MAIN CONTENT */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeStep}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
                className="my-auto py-4 z-10"
              >
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8 text-center md:text-right">
                  
                  {/* WHITE GRAPHIC ANIMATION BOX */}
                  <div className="relative shrink-0 flex items-center justify-center">
                    
                    {/* Stage 1: Factory Direct */}
                    {activeStep === 0 && (
                      <div className="relative w-32 h-32 sm:w-36 sm:h-36 bg-emerald-50 border-2 border-emerald-400 rounded-3xl flex flex-col items-center justify-center text-emerald-700 shadow-md">
                        <Building2 size={52} className="text-emerald-600" />
                        <div className="absolute bottom-2 bg-emerald-600 text-white text-[10px] font-black px-3 py-0.5 rounded-full shadow-xs">
                          قیمت کارخانه
                        </div>
                      </div>
                    )}

                    {/* Stage 2: Profit Margin */}
                    {activeStep === 1 && (
                      <div className="relative w-32 h-32 sm:w-36 sm:h-36 bg-amber-50 border-2 border-amber-400 rounded-3xl flex flex-col items-center justify-center text-amber-800 shadow-md">
                        <BadgePercent size={54} className="text-amber-600" />
                        <motion.div 
                          animate={{ scale: [1, 1.1, 1] }}
                          transition={{ repeat: Infinity, duration: 1.5 }}
                          className="absolute top-2 left-2 bg-emerald-600 text-white font-black text-[10px] px-2.5 py-0.5 rounded-full shadow-xs"
                        >
                          سود تا ۱۰۰٪
                        </motion.div>
                        <div className="absolute bottom-2 bg-amber-600 text-white text-[10px] font-black px-3 py-0.5 rounded-full">
                          کنترل کامل سود
                        </div>
                      </div>
                    )}

                    {/* Stage 3: Packaging */}
                    {activeStep === 2 && (
                      <div className="relative w-32 h-32 sm:w-36 sm:h-36 bg-blue-50 border-2 border-blue-400 rounded-3xl flex flex-col items-center justify-center text-blue-700 shadow-md">
                        <ShoppingBag size={52} className="text-blue-600" />
                        <div className="absolute bottom-2 bg-blue-600 text-white text-[10px] font-black px-3 py-0.5 rounded-full">
                          فروش سریع شلف
                        </div>
                      </div>
                    )}

                    {/* Stage 4: Insured Transit */}
                    {activeStep === 3 && (
                      <div className="relative w-36 h-32 sm:w-40 sm:h-36 bg-indigo-50 border-2 border-indigo-400 rounded-3xl flex flex-col items-center justify-center text-indigo-700 shadow-md">
                        <Truck size={52} className="text-indigo-600" />
                        <div className="absolute top-2 left-2 bg-indigo-600 text-white font-black text-[10px] px-2 py-0.5 rounded-full">
                          بیمه ۱۰۰٪ بار
                        </div>
                      </div>
                    )}

                    {/* Stage 5: Return Guarantee */}
                    {activeStep === 4 && (
                      <div className="relative w-32 h-32 sm:w-36 sm:h-36 bg-rose-50 border-2 border-rose-400 rounded-3xl flex flex-col items-center justify-center text-rose-700 shadow-md">
                        <HandCoins size={52} className="text-rose-600" />
                        <div className="absolute bottom-2 bg-rose-600 text-white text-[10px] font-black px-3 py-0.5 rounded-full">
                          گارانتی تعویض ۱۰۰٪
                        </div>
                      </div>
                    )}
                  </div>

                  {/* COMMERCIAL DETAILED TEXT */}
                  <div className="flex-1 flex flex-col justify-center text-right">
                    <h4 className="text-base sm:text-lg font-black text-slate-900 leading-snug mb-1.5 flex items-center gap-2">
                      <Sparkles size={18} className="text-amber-500 shrink-0" />
                      <span>{currentStep.shortDesc}</span>
                    </h4>

                    <p className="text-xs sm:text-sm font-bold text-slate-600 leading-relaxed mb-4">
                      {currentStep.longDesc}
                    </p>

                    {/* Key Metrics */}
                    <div className="grid grid-cols-3 gap-2">
                      {currentStep.commercialMetrics.map((metric, i) => (
                        <div key={i} className="p-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-center">
                          <span className="block text-[10px] font-bold text-slate-500 mb-0.5">{metric.label}</span>
                          <span className="block text-xs sm:text-sm font-black text-emerald-800">{metric.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Step Progress Line */}
            <div className="relative z-10 w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mt-2">
              <motion.div
                className="h-full bg-emerald-600 rounded-full"
                initial={false}
                animate={{ width: `${((activeStep + 1) / steps.length) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
        </>
      ) : (
        /* TAB 2: WHITE-THEMED PROFIT CALCULATOR */
        <div className="relative z-10 my-2 p-5 bg-white border-2 border-emerald-300 text-slate-900 rounded-3xl shadow-sm">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Banknote className="text-emerald-600" size={22} />
              <h4 className="text-xs sm:text-sm font-black text-slate-900">محاسبه‌گر سود فروشنده (تعیین سود دلخواه تا ۱۰۰٪)</h4>
            </div>
            <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 px-2.5 py-1 rounded-lg">
              سود دست خودتان است
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Inputs */}
            <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-right">
              <div>
                <div className="flex justify-between text-xs font-black mb-1.5">
                  <span className="text-slate-700">حجم سفارش خرید (تن):</span>
                  <span className="text-emerald-700 font-bold">{orderTonnage} تن ({orderTonnage * 1000} کیلوگرم)</span>
                </div>
                <input 
                  type="range" 
                  min="1" 
                  max="20" 
                  step="1"
                  value={orderTonnage}
                  onChange={(e) => setOrderTonnage(Number(e.target.value))}
                  className="w-full accent-emerald-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">قیمت پیشنهادی فروش شما به بازار (تومان / کیلو):</label>
                <input 
                  type="number"
                  step="5000"
                  value={sellingPricePerKg}
                  onChange={(e) => setSellingPricePerKg(Number(e.target.value))}
                  className="w-full bg-white border border-slate-300 text-slate-900 rounded-xl px-3 py-2 text-xs font-black text-left focus:outline-none focus:border-emerald-600"
                />
              </div>
            </div>

            {/* Results */}
            <div className="bg-emerald-50/80 border border-emerald-200 p-4 rounded-2xl flex flex-col justify-between text-right">
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs pb-1.5 border-b border-emerald-200/60">
                  <span className="text-slate-600 font-bold">قیمت خرید شما از کارخانه (کیلو):</span>
                  <span className="text-slate-900 font-black">{factoryCostPerKg.toLocaleString('fa-IR')} تومان</span>
                </div>

                <div className="flex justify-between items-center text-xs pb-1.5 border-b border-emerald-200/60">
                  <span className="text-slate-600 font-bold">سود شما در هر کیلوگرم:</span>
                  <span className="text-emerald-800 font-black">{netProfitPerKg.toLocaleString('fa-IR')} تومان</span>
                </div>

                <div className="flex justify-between items-center text-xs pb-1.5 border-b border-emerald-200/60">
                  <span className="text-slate-600 font-bold">درصد سود شما (نسبت به قیمت کارخانه):</span>
                  <span className="text-amber-800 font-black text-sm">+{profitMarginPercent}٪ سود خالص</span>
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-emerald-300 bg-white p-3 rounded-2xl text-center shadow-2xs">
                <span className="block text-[11px] font-bold text-slate-600 mb-0.5">کل سود خالص شما در این سفارش ({orderTonnage} تن):</span>
                <span className="text-xl font-black text-emerald-800 tracking-tight">
                  {totalNetProfit.toLocaleString('fa-IR')} <span className="text-xs">تومان</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER ACTION BAR */}
      <div className="relative z-10 pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-right">
        <div className="flex items-center gap-2 text-[11px] font-bold text-slate-600">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping shrink-0" />
          <span>پاسخگویی مستقیم واحد فروش عمده کارخانه و صدور پیش‌فاکتور با تخفیف ویژه</span>
        </div>

        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
          <a
            href="tel:09999123001"
            className="flex-1 sm:flex-none bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 px-4 py-2 rounded-full text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <PhoneCall size={14} className="text-emerald-600" />
            <span>مشاوره تلفنی</span>
          </a>

          {onOrderClick && (
            <button
              type="button"
              onClick={onOrderClick}
              className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-full text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
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
