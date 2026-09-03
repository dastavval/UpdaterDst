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
  const [isPlaying, setIsPlaying] = useState(false);
  const [animSpeed, setAnimSpeed] = useState<number>(3500); // 3.5 seconds
  const [activeTab, setActiveTab] = useState<'flow' | 'calculator'>('flow');

  // Interactive Profit Margin Calculator State (Carton-based / کارتنی)
  const [orderCartons, setOrderCartons] = useState<number>(50); // Cartons count
  const [sellingPricePerCarton, setSellingPricePerCarton] = useState<number>(380000); // Tomans per carton

  // Calculations for Wholesaler
  const factoryDiscountPercent = orderCartons >= 200 ? 35 : orderCartons >= 100 ? 30 : orderCartons >= 50 ? 25 : 20;
  const factoryCostPerCarton = Math.round(sellingPricePerCarton * (1 - factoryDiscountPercent / 100));
  const netProfitPerCarton = sellingPricePerCarton - factoryCostPerCarton;
  const profitMarginPercent = Math.round((netProfitPerCarton / factoryCostPerCarton) * 100);
  const totalNetProfit = netProfitPerCarton * orderCartons;
  const estWeightTons = ((orderCartons * 12) / 1000).toFixed(2);

  const steps: CommercialStep[] = [
    { 
      id: 1, 
      title: 'تحویل کالا از خط تولید', 
      icon: Building2,
      shortDesc: 'ما کالا را به قیمت تمام‌شده کارخانه تحویل می‌دهیم', 
      longDesc: 'محصولات مستقیم از خط تولید با حداقل قیمت مصوب صادر می‌شوند؛ ۱۰۰٪ سود فروش و تعیین قیمت نهایی در اختیار کامل شماست.',
      timeEstimate: 'صدور فوری پیش‌فاکتور',
      profitImpact: 'قیمت خروجی کارخانه',
      badgeBg: 'bg-emerald-600 text-white border-emerald-300',
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
      longDesc: 'بسته‌بندی لمینت صادراتی با بارکد ملی و طرح مشتری‌پسند، باعث خروج سریع‌تر بار از انبار شما و خرید مجدد مغازه‌داران می‌شود.',
      timeEstimate: 'فروش ۲ برابری',
      profitImpact: 'صفر شدن خواب سرمایه',
      badgeBg: 'bg-emerald-100 text-amber-800 border-amber-300',
      borderColor: 'border-emerald-500',
      accentColor: 'text-emerald-600',
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
      borderColor: 'border-emerald-500',
      accentColor: 'text-emerald-600',
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
      badgeBg: 'bg-emerald-100 text-rose-800 border-rose-300',
      borderColor: 'border-emerald-500',
      accentColor: 'text-emerald-600',
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
    <div className="relative w-full bg-white border border-slate-200 rounded-2xl p-2.5 sm:p-4 shadow-xs select-none text-right transition-all overflow-hidden" dir="rtl">
      
      {/* HEADER BAR */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 pb-2 mb-2 border-b border-slate-150">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Coins size={16} className="animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[8px] sm:text-[9px] font-black bg-emerald-600 text-white px-1.5 py-0.5 rounded-md border border-emerald-300">
                سود ۱۰۰٪ اختیاری
              </span>
              <h3 className="text-xs sm:text-sm font-black text-slate-900 leading-tight">
                چرخه تامین محصول و سودآوری فروشنده
              </h3>
            </div>
            <p className="hidden xs:block text-[10px] font-bold text-slate-400 mt-0.5">
              تعیین قیمت فروش و سود حاصله کاملاً در اختیار شماست
            </p>
          </div>
        </div>

        {/* Tab & Navigation Controls */}
        <div className="flex items-center gap-1.5 shrink-0 mr-auto sm:mr-0 text-[10px]">
          <div className="flex items-center p-0.5 bg-slate-100 rounded-lg border border-slate-200">
            <button
              type="button"
              onClick={() => setActiveTab('flow')}
              className={`px-2 py-0.5 rounded-md text-[10px] font-black transition-all cursor-pointer ${
                activeTab === 'flow' 
                  ? 'bg-emerald-600 text-white shadow-2xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              چرخه کالا
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('calculator')}
              className={`px-2 py-0.5 rounded-md text-[10px] font-black transition-all cursor-pointer ${
                activeTab === 'calculator' 
                  ? 'bg-emerald-600 text-white shadow-2xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ماشین‌حساب سود
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsPlaying(!isPlaying)}
            className={`px-2 py-1 rounded-lg border text-[9px] sm:text-[10px] font-black flex items-center gap-1 transition-all cursor-pointer ${
              isPlaying 
                ? 'bg-emerald-600 text-white border-emerald-300' 
                : 'bg-slate-100 text-slate-600 border-slate-200'
            }`}
          >
            {isPlaying ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                <Pause size={10} />
                <span>پخش خودکار</span>
              </>
            ) : (
              <>
                <Play size={10} className="text-emerald-600" />
                <span>شروع</span>
              </>
            )}
          </button>
        </div>
      </div>

      {activeTab === 'flow' ? (
        <>
          {/* PIPELINE STEPS TRACKER */}
          <div className="relative z-10 mb-2 bg-slate-50 border border-slate-150 rounded-xl p-1 overflow-x-auto scrollbar-none">
            <div className="relative z-10 flex items-center justify-between min-w-[320px] sm:min-w-0 gap-1 sm:gap-2">
              {steps.map((step, idx) => {
                const isActive = activeStep === idx;
                const isCompleted = activeStep > idx;
                const IconComponent = step.icon;

                return (
                  <button
                    key={`sc-step-btn-${step.id || idx}-${idx}`}
                    type="button"
                    onClick={() => {
                      setActiveStep(idx);
                      setIsPlaying(false);
                    }}
                    className={`flex-1 flex flex-col items-center gap-1 p-1 rounded-lg transition-all cursor-pointer group ${
                      isActive 
                        ? 'bg-white border border-emerald-600 shadow-2xs ring-1 ring-emerald-100' 
                        : isCompleted
                        ? 'bg-emerald-50/50 border border-emerald-100 text-emerald-800'
                        : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    <div className={`relative w-6 h-6 sm:w-7 sm:h-7 rounded-md flex items-center justify-center transition-transform ${
                      isActive 
                        ? 'bg-emerald-600 text-white shadow-2xs' 
                        : isCompleted
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 text-slate-500'
                    }`}>
                      {isCompleted ? (
                        <Check size={12} className="text-white stroke-[3]" />
                      ) : (
                        <IconComponent size={12} />
                      )}
                    </div>

                    <span className={`text-[8px] sm:text-[10px] font-black leading-none text-center truncate w-full ${
                      isActive ? 'text-slate-900 font-black' : 'text-slate-500'
                    }`}>
                      {step.title}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* WHITE-THEMED HIGH-IMPACT DISPLAY STAGE */}
          <div className="relative z-10 w-full bg-white border border-slate-200 rounded-xl p-2.5 sm:p-3.5 mb-2 overflow-hidden flex flex-col justify-between shadow-2xs">
            
            {/* TOP STATUS HEADER */}
            <div className="flex items-center justify-between gap-1.5 z-10 pb-1.5 border-b border-slate-100 text-[10px]">
              <div className="flex items-center gap-1.5">
                <span className="px-1.5 py-0.5 rounded-md bg-emerald-600 text-white font-black border border-emerald-300 flex items-center gap-1 text-[8px] sm:text-[9px]">
                  مرحله {activeStep + 1}
                </span>
                
                <span className="inline-flex items-center gap-1 bg-slate-50 border border-slate-150 text-slate-600 px-1.5 py-0.5 rounded-md font-bold text-[8px] sm:text-[10px]">
                  <Clock size={10} className="text-emerald-600" />
                  <span>{currentStep.timeEstimate}</span>
                </span>
              </div>

              <div className="text-[8px] sm:text-[10px] font-black text-amber-800 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1">
                <Zap size={10} className="text-emerald-600" />
                <span>{currentStep.profitImpact}</span>
              </div>
            </div>

            {/* ANIMATED MAIN CONTENT */}
            <AnimatePresence mode="wait">
              <motion.div
                key={`sc-lifecycle-card-${activeStep}`}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.15 }}
                className="my-auto py-2 z-10"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-right">
                  
                  {/* COMPACT GRAPHIC ICON */}
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="relative w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 shrink-0 shadow-2xs">
                      {activeStep === 0 && <Building2 size={20} className="text-emerald-600" />}
                      {activeStep === 1 && <BadgePercent size={20} className="text-emerald-600" />}
                      {activeStep === 2 && <ShoppingBag size={20} className="text-emerald-600" />}
                      {activeStep === 3 && <Truck size={20} className="text-emerald-600" />}
                      {activeStep === 4 && <HandCoins size={20} className="text-emerald-600" />}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs sm:text-sm font-black text-slate-900 leading-snug flex items-center gap-1">
                        <Sparkles size={12} className="text-emerald-500 shrink-0" />
                        <span>{currentStep.shortDesc}</span>
                      </h4>
                      <p className="text-[10px] sm:text-xs text-slate-500 font-bold mt-0.5 leading-normal">
                        {currentStep.longDesc}
                      </p>
                    </div>
                  </div>

                  {/* Key Metrics */}
                  <div className="grid grid-cols-3 gap-1.5 w-full sm:w-auto shrink-0">
                    {currentStep.commercialMetrics.map((metric, i) => (
                      <div key={`supply-metric-${activeStep}-${metric.label}-${i}`} className="p-1 sm:p-1.5 bg-slate-50 border border-slate-200/60 rounded-lg text-center min-w-[70px] sm:min-w-[85px]">
                        <span className="block text-[8px] sm:text-[9px] font-bold text-slate-400 leading-none mb-0.5">{metric.label}</span>
                        <span className="block text-[9px] sm:text-xs font-black text-emerald-800 leading-tight">{metric.value}</span>
                      </div>
                    ))}
                  </div>

                </div>
              </motion.div>
            </AnimatePresence>

            {/* Step Progress Line */}
            <div className="relative z-10 w-full h-1 bg-slate-100 rounded-full overflow-hidden mt-1">
              <motion.div
                className="h-full bg-emerald-600 rounded-full"
                initial={false}
                animate={{ width: `${((activeStep + 1) / steps.length) * 100}%` }}
                transition={{ duration: 0.2 }}
              />
            </div>
          </div>
        </>
      ) : (
        /* TAB 2: WHITE-THEMED PROFIT CALCULATOR (CARTON-BASED) */
        <div className="relative z-10 my-1 p-3 bg-white border border-slate-200 text-slate-900 rounded-xl shadow-2xs">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
            <div className="flex items-center gap-1.5">
              <Banknote className="text-emerald-600" size={16} />
              <h4 className="text-[10px] sm:text-xs font-black text-slate-900">محاسبه‌گر سود کارتنی فروشنده (تعیین سود دلخواه تا ۱۰۰٪)</h4>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Inputs */}
            <div className="space-y-2.5 bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-right">
              <div>
                <div className="flex justify-between items-center text-[10px] font-black mb-1">
                  <span className="text-slate-700">حجم سفارش خرید (تعداد کارتن):</span>
                  <span className="text-emerald-700 font-bold bg-emerald-100 px-1.5 py-0.5 rounded text-[10px]">{orderCartons} کارتن (~{estWeightTons} تن)</span>
                </div>
                <input 
                  type="range" 
                  min="5" 
                  max="500" 
                  step="5"
                  value={orderCartons}
                  onChange={(e) => setOrderCartons(Number(e.target.value))}
                  className="w-full accent-emerald-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-700 mb-1">قیمت پیشنهادی فروش شما به بازار (تومان / هر کارتن):</label>
                <div className="relative">
                  <input 
                    type="number"
                    step="5000"
                    value={sellingPricePerCarton}
                    onChange={(e) => setSellingPricePerCarton(Number(e.target.value))}
                    className="w-full bg-white border border-slate-300 text-slate-900 rounded-lg px-2.5 py-1.5 text-[10px] font-black text-left focus:outline-none focus:border-emerald-600 pl-10"
                  />
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[9px] font-bold text-slate-400">تومان</span>
                </div>
              </div>
            </div>

            {/* Results */}
            <div className="bg-emerald-50/50 border border-emerald-100 p-2.5 rounded-xl flex flex-col justify-between text-right">
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-[10px] pb-1 border-b border-emerald-200/40">
                  <span className="text-slate-500 font-bold">خرید از کارخانه:</span>
                  <span className="text-slate-900 font-black">{factoryCostPerCarton.toLocaleString('fa-IR')} ت ({factoryDiscountPercent}٪ آفر)</span>
                </div>

                <div className="flex justify-between items-center text-[10px] pb-1 border-b border-emerald-200/40">
                  <span className="text-slate-500 font-bold">سود خالص در هر کارتن:</span>
                  <span className="text-emerald-800 font-black">{netProfitPerCarton.toLocaleString('fa-IR')} تومان</span>
                </div>

                <div className="flex justify-between items-center text-[10px] pb-1 border-b border-emerald-200/40">
                  <span className="text-slate-500 font-bold">درصد حاشیه سود (مارژین):</span>
                  <span className="text-amber-800 font-black">+{profitMarginPercent}٪</span>
                </div>
              </div>

              <div className="mt-2 pt-1.5 border-t border-emerald-200 text-center">
                <span className="text-[9px] font-bold text-slate-500">کل سود خالص شما ({orderCartons} کارتن):</span>
                <span className="block text-sm font-black text-emerald-800 tracking-tight">
                  {totalNetProfit.toLocaleString('fa-IR')} <span className="text-[10px]">تومان</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER ACTION BAR */}
      <div className="relative z-10 pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-right">
        <div className="flex items-center gap-1.5 text-[9px] sm:text-[10px] font-bold text-slate-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping shrink-0" />
          <span>پاسخگویی مستقیم واحد فروش عمده کارخانه و صدور پیش‌فاکتور رسمی</span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 w-full sm:w-auto justify-end">
          <a
            href="tel:09999123001"
            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 px-3 py-1.5 rounded-full text-[10px] font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <PhoneCall size={12} className="text-emerald-600" />
            <span>مشاوره تلفنی</span>
          </a>

          {onOrderClick && (
            <button
              type="button"
              onClick={onOrderClick}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-1.5 rounded-full text-[10px] font-black transition-all flex items-center justify-center gap-1 cursor-pointer"
            >
              <span>ثبت سفارش عمده</span>
              <ArrowLeft size={12} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
