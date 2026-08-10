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
  TrendingUp,
  PhoneCall
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
      shortDesc: 'ورود سفارش مستقیم به سیستم پخت و تولید کارخانه', 
      longDesc: 'سفارش شما پس از ثبت، مستقیماً وارد سیستم تولید مکانیزه کارخانه شده و بر اساس فرمولاسیون استاندارد آماده می‌گردد.',
      timeEstimate: '۱۲ الی ۲۴ ساعت',
      keyMetric: 'پایش خودکار دما و کیفیت تولید',
      badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      borderColor: 'border-emerald-500'
    },
    { 
      id: 2, 
      title: 'سنجش کیفیت', 
      icon: ShieldCheck,
      shortDesc: 'آزمایش بهداشتی و درج علامت سیب سلامت', 
      longDesc: 'محصولات توسط واحد کنترل کیفیت بررسی گردیده و تاییدیه بهداشتی و سیب سلامت روی تمام اقلام درج می‌گردد.',
      timeEstimate: '۲ الی ۴ ساعت',
      keyMetric: 'تاییدیه بهداشتی و انطباق استاندارد',
      badgeBg: 'bg-teal-50 text-teal-800 border-teal-200',
      borderColor: 'border-teal-500'
    },
    { 
      id: 3, 
      title: 'بسته‌بندی کارتنی', 
      icon: PackageCheck,
      shortDesc: 'چیدمان در کارتن ۵ لایه و پالت‌بندی ایمن', 
      longDesc: 'کالاهای تایید شده در کارتن‌های ۵ لایه صادراتی چیده شده و جهت حمل جاده‌ای تسمه‌کشی و شرینک حرارتی می‌شوند.',
      timeEstimate: '۳ الی ۶ ساعت',
      keyMetric: 'کارتن صادراتی مقاوم ضد رطوبت',
      badgeBg: 'bg-amber-50 text-amber-800 border-amber-200',
      borderColor: 'border-amber-500'
    },
    { 
      id: 4, 
      title: 'ترانزیت مسقف', 
      icon: Truck,
      shortDesc: 'ارسال با بارنامه دولتی و بیمه‌نامه ۱۰۰٪ حوادث', 
      longDesc: 'محموله با تریلر مسقف/یخچال‌دار پلمپ شده و همراه با بارنامه رسمی کشوری مستقیماً به انبار شما ارسال می‌گردد.',
      timeEstimate: '۲۴ الی ۴۸ ساعت',
      keyMetric: 'پلمپ سربی + بیمه کامل کالا',
      badgeBg: 'bg-indigo-50 text-indigo-800 border-indigo-200',
      borderColor: 'border-indigo-500'
    },
    { 
      id: 5, 
      title: 'تحویل بنکدار', 
      icon: Store,
      shortDesc: 'تحویل سالم در محل انبار + حذف کامل واسطه‌ها', 
      longDesc: 'محموله سالم درب انبار یا فروشگاه شما تخلیه شده و بیشترین حاشیه سود بنکداری مستقیماً به حساب شما سرازیر می‌شود.',
      timeEstimate: 'تحویل فوری',
      keyMetric: 'افزایش سود بنکدار تا +۳۵٪',
      badgeBg: 'bg-rose-50 text-rose-800 border-rose-200',
      borderColor: 'border-rose-500'
    }
  ];

  // Cycle interval
  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % steps.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [isPlaying, steps.length]);

  const currentStep = steps[activeStep];
  const StepIcon = currentStep.icon;

  return (
    <div className="relative w-full bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-xs select-none text-right" dir="rtl">
      
      {/* HEADER BAR */}
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Sparkles size={16} />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-black text-slate-900">
              چرخه شفاف تأمین و توزیع مستقیم
            </h3>
            <p className="text-[10px] font-bold text-slate-500 mt-0.5">
              از خط تولید کارخانه تا تحویل سالم در انبار شما
            </p>
          </div>
        </div>

        {/* Play/Pause Button */}
        <button
          type="button"
          onClick={() => setIsPlaying(!isPlaying)}
          className="px-2.5 py-1 rounded-xl border border-slate-200 text-slate-700 bg-slate-50 hover:bg-slate-100 text-[11px] font-black transition-all flex items-center gap-1 cursor-pointer"
        >
          {isPlaying ? (
            <>
              <Pause size={12} className="text-amber-600" />
              <span>توقف</span>
            </>
          ) : (
            <>
              <Play size={12} className="text-emerald-600" />
              <span>پخش</span>
            </>
          )}
        </button>
      </div>

      {/* ANIMATED MAIN DISPLAY */}
      <div className="relative w-full h-44 sm:h-48 bg-slate-900 rounded-2xl mb-4 overflow-hidden flex flex-col justify-between p-4 text-white">
        
        {/* Top Info */}
        <div className="flex items-center justify-between text-[10px] font-bold z-10">
          <span className={`px-2.5 py-0.5 rounded-lg border font-black ${currentStep.badgeBg}`}>
            مرحله {activeStep + 1} از ۵: {currentStep.title}
          </span>
          <span className="flex items-center gap-1 text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-lg border border-slate-700">
            <Clock size={11} className="text-emerald-400" />
            <span>زمان: {currentStep.timeEstimate}</span>
          </span>
        </div>

        {/* Center Dynamic Stage */}
        <div className="relative z-10 my-auto flex flex-col items-center justify-center text-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeStep}
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center"
            >
              <div className="w-14 h-14 rounded-2xl bg-slate-800/90 border border-slate-700/80 flex items-center justify-center text-emerald-400 shadow-md mb-2">
                <StepIcon size={28} />
              </div>

              <h4 className="text-sm font-black text-white mb-1">
                {currentStep.shortDesc}
              </h4>

              <div className="inline-flex items-center gap-1.5 bg-emerald-950/80 border border-emerald-800/80 text-emerald-300 px-3 py-1 rounded-full text-[10px] font-black">
                <CheckCircle2 size={12} className="text-emerald-400" />
                <span>{currentStep.keyMetric}</span>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Bottom Progress Line */}
        <div className="relative z-10 w-full h-1 bg-slate-800 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-emerald-500 rounded-full"
            initial={false}
            animate={{ width: `${((activeStep + 1) / steps.length) * 100}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>
      </div>

      {/* 5 STEP TABS */}
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
              className={`p-2 rounded-xl border flex flex-col items-center gap-1 transition-all cursor-pointer ${
                isActive
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-black shadow-xs'
                  : 'bg-slate-50/80 border-slate-200/80 text-slate-500 hover:bg-slate-100 hover:text-slate-800'
              }`}
            >
              <IconComponent size={16} className={isActive ? 'text-emerald-600' : 'text-slate-400'} />
              <span className="text-[10px] font-black leading-tight truncate w-full">
                {step.title}
              </span>
            </button>
          );
        })}
      </div>

      {/* FOOTER & CTA */}
      <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-right">
        <p className="text-[11px] font-bold text-slate-600 leading-relaxed max-w-sm">
          {currentStep.longDesc}
        </p>

        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
          <a
            href="tel:09999123001"
            className="flex-1 sm:flex-none bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs group"
            title="تماس مستقیم با پشتیبانی مشتریان"
          >
            <div className="relative flex items-center justify-center">
              <PhoneCall size={14} className="text-emerald-600 group-hover:rotate-12 transition-transform" />
              <span className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
            </div>
            <span>پشتیبان تلفنی</span>
          </a>

          {onOrderClick && (
            <button
              type="button"
              onClick={onOrderClick}
              className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
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
