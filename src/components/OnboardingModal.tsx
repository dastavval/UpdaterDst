import { motion, AnimatePresence } from "motion/react";
import { X, CheckCircle2, Factory, ShoppingBag, ShieldCheck, ArrowLeft, ArrowRight, Zap } from "lucide-react";
import { useState } from "react";

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: 'light' | 'dark' | 'classic';
}

const STEPS = [
  {
    title: "خوش آمدید به دست اول",
    desc: "پلتفرم استراتژیک برای معاملات میلیاردی مستقیم بین کارخانه و بنکدار.",
    image: "/assets/mascot_character.jpg",
    role: "general"
  },
  {
    title: "شما تولیدکننده هستید؟",
    desc: "محصولات خود را به هزاران بنکدار معرفی کنید، ما نقدینگی شما را تضمین می‌کنیم و ریسک چک صیادی را می‌پذیریم.",
    image: "/assets/mascot_character.jpg",
    role: "factory"
  },
  {
    title: "شما بنکدار یا عمده‌فروش هستید؟",
    desc: "مستقیماً از خط تولید خرید کنید، قیمت کارخانه بگیرید و از اعتبار خرید اقساطی بهره‌مند شوید.",
    image: "/assets/mascot_character.jpg",
    role: "customer"
  },
  {
    title: "امنیت ۱۰۰٪ معاملات",
    desc: "وجه شما در حساب امانی دست اول می‌ماند تا بار صحیح و سالم تخلیه شود. سپس تسویه با کارخانه انجام می‌شود.",
    image: "/assets/mascot_character.jpg",
    role: "security"
  }
];

export default function OnboardingModal({ isOpen, onClose, theme }: OnboardingModalProps) {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-white/60 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className={`relative w-full max-w-2xl overflow-hidden rounded-[3rem] border ${
            theme === 'dark' ? 'bg-white border-slate-800' : 'bg-white border-slate-100 shadow-2xl'
          }`}
          dir="rtl"
        >
          <button 
            onClick={onClose}
            className="absolute top-6 left-6 p-2 rounded-xl hover text-slate-400 transition-colors z-10"
          >
            <X size={20} />
          </button>

          <div className="p-8 md:p-12">
            <div className="flex flex-col items-center text-center space-y-8">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-40 h-40 rounded-full bg-white flex items-center justify-center overflow-hidden shadow-2xl border-4 border-emerald-500 shrink-0"
              >
                <img src={STEPS[currentStep].image} alt="Guide" className="w-full h-full object-contain p-2" referrerPolicy="no-referrer" />
              </motion.div>

              <div className="space-y-4">
                <h2 className={`text-2xl md font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  {STEPS[currentStep].title}
                </h2>
                <p className="text-slate-500 font-bold leading-relaxed max-w-md mx-auto">
                  {STEPS[currentStep].desc}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {STEPS.map((_, idx) => (
                  <div 
                    key={idx}
                    className={`h-1.5 rounded-full transition-all duration-500 ${
                      idx === currentStep ? 'w-8 bg-emerald-500' : 'w-2 bg-slate-200'
                    }`}
                  />
                ))}
              </div>

              <div className="flex items-center justify-between w-full pt-8">
                {currentStep > 0 ? (
                  <button 
                    onClick={() => setCurrentStep(prev => prev - 1)}
                    className="flex items-center gap-2 text-slate-400 font-black text-sm hover transition-colors"
                  >
                    <ArrowRight size={20} />
                    قبلی
                  </button>
                ) : <div />}

                {currentStep < STEPS.length - 1 ? (
                  <button 
                    onClick={() => setCurrentStep(prev => prev + 1)}
                    className="px-8 py-4 bg-emerald-600 text-white rounded-2xl font-black flex items-center gap-2 hover shadow-xl shadow-emerald-600/20 transition-all"
                  >
                    بعدی
                    <ArrowLeft size={20} />
                  </button>
                ) : (
                  <button 
                    onClick={onClose}
                    className="px-8 py-4 bg-emerald-600 text-white rounded-2xl font-black flex items-center gap-2 hover shadow-xl shadow-emerald-600/20 transition-all"
                  >
                    بزن بریم!
                    <CheckCircle2 size={20} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
