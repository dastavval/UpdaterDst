import React, { useState, useEffect } from 'react';
import { ShoppingBag, ArrowLeft, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface StepInfo {
  id: number;
  title: string;
  emoji: string;
  desc: string;
  color: string;
  bgColor: string;
}

interface SupplyChainProps {
  onOrderClick?: () => void;
}

export const SupplyChainLifecycleAnimation: React.FC<SupplyChainProps> = ({ onOrderClick }) => {
  const [activeStep, setActiveStep] = useState(0);

  const steps: StepInfo[] = [
    { id: 1, title: 'تولید', emoji: '🏭', desc: 'تولید مستقیم در خط تولید کارخانه', color: 'text-emerald-600', bgColor: 'bg-emerald-500' },
    { id: 2, title: 'بسته‌بندی', emoji: '📦', desc: 'چیدمان کارتنی و پالت صادراتی', color: 'text-teal-600', bgColor: 'bg-teal-500' },
    { id: 3, title: 'ارسال', emoji: '🚚', desc: 'بارگیری مسقف و ترانزیت فوری', color: 'text-amber-600', bgColor: 'bg-amber-500' },
    { id: 4, title: 'فروشگاه', emoji: '🏪', desc: 'تحویل به مغازه‌دار و بنکدار', color: 'text-indigo-600', bgColor: 'bg-indigo-500' },
    { id: 5, title: 'خریدار', emoji: '🛒', desc: 'تحویل به مشتری نهایی', color: 'text-rose-600', bgColor: 'bg-rose-500' }
  ];

  // Auto cycle animation
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % steps.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [steps.length]);

  return (
    <div className="relative w-full bg-white border border-slate-200/90 rounded-3xl p-3.5 sm:p-5 shadow-lg shadow-slate-200/50 overflow-hidden select-none" dir="rtl">
      {/* Background Subtle Ambient Glow */}
      <div className="absolute top-0 right-0 w-36 h-36 bg-emerald-100/40 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-36 h-36 bg-teal-100/40 rounded-full blur-2xl pointer-events-none" />

      {/* Header Bar */}
      <div className="relative z-10 flex items-center justify-between pb-2.5 mb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </span>
          <h4 className="text-xs sm:text-sm font-black text-slate-900">
            چرخه زنده کالا
          </h4>
        </div>

        <div className="bg-emerald-50/90 text-emerald-800 border border-emerald-200/80 px-2.5 py-0.5 rounded-full text-[10px] font-black flex items-center gap-1">
          <span>مرحله {activeStep + 1} از ۵</span>
        </div>
      </div>

      {/* Interactive Responsive Pipeline */}
      <div className="relative z-10 my-2">
        {/* Track Bar with Moving Pulse Dot */}
        <div className="relative w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-3">
          <motion.div
            className="h-full bg-gradient-to-r from-emerald-500 via-teal-500 to-amber-500 rounded-full"
            initial={false}
            animate={{ width: `${((activeStep + 1) / steps.length) * 100}%` }}
            transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          />
        </div>

        {/* 5 Step Nodes */}
        <div className="grid grid-cols-5 gap-1 sm:gap-2 text-center">
          {steps.map((step, idx) => {
            const isActive = activeStep === idx;
            const isPassed = activeStep > idx;

            return (
              <button
                key={step.id}
                onClick={() => setActiveStep(idx)}
                className="flex flex-col items-center group cursor-pointer focus:outline-none"
              >
                {/* Node Box */}
                <motion.div
                  animate={{ scale: isActive ? 1.12 : 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  className={`relative w-8 h-8 xs:w-10 xs:h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center text-sm xs:text-base sm:text-xl transition-all duration-300 border ${
                    isActive
                      ? 'bg-emerald-50 border-emerald-500 shadow-md ring-4 ring-emerald-100/80 text-slate-900 font-bold'
                      : isPassed
                      ? 'bg-slate-50 border-emerald-300/80 text-slate-700'
                      : 'bg-white border-slate-200/80 text-slate-400 group-hover:border-slate-300'
                  }`}
                >
                  <span className={isActive ? 'animate-bounce' : ''}>{step.emoji}</span>

                  {isActive && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white shadow-sm" />
                  )}
                </motion.div>

                {/* Short Title */}
                <span className={`text-[10px] sm:text-xs font-black mt-1.5 transition-colors leading-none truncate max-w-full ${
                  isActive ? 'text-emerald-800 font-black' : 'text-slate-500'
                }`}>
                  {step.title}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Phase Mini Banner */}
      <div className="relative z-10 mt-3 pt-2.5 border-t border-slate-100/90 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 overflow-hidden">
          <span className={`text-xs font-black px-2 py-0.5 rounded-lg shrink-0 ${steps[activeStep].bgColor} text-white`}>
            {steps[activeStep].title}
          </span>
          <p className="text-[11px] font-bold text-slate-600 truncate">
            {steps[activeStep].desc}
          </p>
        </div>

        {onOrderClick && (
          <button
            onClick={onOrderClick}
            className="shrink-0 bg-slate-900 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-xl text-[11px] font-black transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <span>سفارش عمده</span>
            <ArrowLeft size={12} />
          </button>
        )}
      </div>
    </div>
  );
};
