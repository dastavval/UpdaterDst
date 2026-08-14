import { motion, AnimatePresence } from "motion/react";
import { 
  X, 
  CheckCircle2, 
  Factory, 
  ShoppingBag, 
  ShieldCheck, 
  ArrowLeft, 
  ArrowRight, 
  Zap, 
  Briefcase, 
  TrendingDown, 
  Sparkles,
  Award
} from "lucide-react";
import { useState } from "react";

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: 'light' | 'dark' | 'classic';
  onSelectAction?: (tab: string) => void;
}

const STEPS = [
  {
    title: "خوش آمدید به پلتفرم استراتژیک دست اول",
    badge: "پلتفرم سراسری بنکداری و تامین مستقیم",
    desc: "اینجا بدون واسطه و دلال، مستقیماً به خطوط تولید کارخانجات متصل می‌شوید. تمام معاملات با ضمانت ۱۰۰٪ امانی و بارنامه رسمی بیمه‌شده انجام می‌شود.",
    icon: Sparkles,
    color: "from-emerald-600 to-teal-700",
    role: "general",
    actionText: "مشاهده مسیرها",
    actionTab: "presentation"
  },
  {
    title: "۱. به دنبال خرید اجناس با ارزان‌ترین قیمت هستید؟",
    badge: "ویژه بنکداران، سوپرمارکت‌ها و فروشگاه‌ها",
    desc: "کالاها را تا ۳۵٪ ارزان‌تر از بازار سنتی مستقیماً از خط تولید کارخانه بخرید، پیش‌فاکتور رسمی بگیرید و از حاشیه سود حداکثری لذت ببرید.",
    icon: ShoppingBag,
    color: "from-emerald-600 to-green-700",
    role: "buyer",
    actionText: "ورود به تالار خرید عمده",
    actionTab: "order"
  },
  {
    title: "۲. به دنبال اخذ نمایندگی و کسب درآمد هستید؟",
    badge: "فرصت نمایندگی ۳۱ استان با سود و پورسانت عالی",
    desc: "بدون نیاز به سرمایه اولیه سنگین و انبارداری، عاملیت یا نمایندگی استانی محصولات معتبر را بگیرید و درآمد ماهانه ۲۰ تا ۱۰۰ میلیون تومان بسازید.",
    icon: Briefcase,
    color: "from-amber-500 to-yellow-600",
    role: "agency",
    actionText: "درخواست نمایندگی استانی",
    actionTab: "agency"
  },
  {
    title: "۳. شما کارخانه‌دار و تولیدکننده هستید؟",
    badge: "فروش تضمینی تناژ بار و نقدینگی فوری",
    desc: "ظرفیت تولید خود را به شبکه ۱۲,۸۰۰ خریدار فعال عرضه کنید. تسویه نقدی پیش از بارگیری تضمین شده و ریسک چک صیادی برگشتی صفر است.",
    icon: Factory,
    color: "from-indigo-600 to-blue-700",
    role: "factory",
    actionText: "ثبت کارخانه و خط تولید",
    actionTab: "factories"
  },
  {
    title: "امنیت ۱۰۰٪ و ضمانت سلامت بار",
    badge: "حساب امانی و تضمین بازگشت وجه",
    desc: "وجه پرداختی خریدار در حساب امانی دست اول محفوظ می‌ماند تا بار صحیح و سالم درب انبار تخلیه و تایید شود؛ سپس تسویه با کارخانه صورت می‌گیرد.",
    icon: ShieldCheck,
    color: "from-teal-600 to-emerald-800",
    role: "security",
    actionText: "شروع معامله مطمئن",
    actionTab: "billboard"
  }
];

export default function OnboardingModal({ isOpen, onClose, theme, onSelectAction }: OnboardingModalProps) {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const current = STEPS[currentStep];
  const IconComp = current.icon;

  const handleActionClick = (tab: string) => {
    onClose();
    if (onSelectAction) {
      onSelectAction(tab);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md" dir="rtl">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className={`relative w-full max-w-2xl overflow-hidden rounded-[2.5rem] border ${
            theme === 'dark' ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-100 shadow-2xl text-slate-900'
          }`}
        >
          <button 
            onClick={onClose}
            className="absolute top-6 left-6 p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors z-10 cursor-pointer"
          >
            <X size={20} />
          </button>

          <div className="p-8 md:p-10">
            <div className="flex flex-col items-center text-center space-y-6">
              
              {/* Dynamic Icon Badge */}
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                className={`w-28 h-28 rounded-3xl bg-gradient-to-tr ${current.color} flex items-center justify-center overflow-hidden shadow-2xl text-white shrink-0 border-4 border-white/20`}
              >
                <IconComp size={48} className="animate-pulse" />
              </motion.div>

              <div className="space-y-3">
                <span className="inline-block bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-black px-3.5 py-1 rounded-full border border-slate-200 dark:border-slate-700">
                  {current.badge}
                </span>

                <h2 className="text-xl sm:text-2xl font-black leading-tight">
                  {current.title}
                </h2>
                
                <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-bold leading-relaxed max-w-lg mx-auto">
                  {current.desc}
                </p>
              </div>

              {/* Step indicator dots */}
              <div className="flex items-center gap-1.5 pt-1">
                {STEPS.map((_, idx) => (
                  <button 
                    key={idx}
                    onClick={() => setCurrentStep(idx)}
                    className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                      idx === currentStep ? 'w-8 bg-emerald-500' : 'w-2 bg-slate-200 dark:bg-slate-700'
                    }`}
                  />
                ))}
              </div>

              {/* Direct Path Action Button for this step */}
              {current.actionTab && (
                <button
                  onClick={() => handleActionClick(current.actionTab)}
                  className="px-6 py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 font-black text-xs hover:bg-emerald-100 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Zap size={14} className="text-amber-500" />
                  <span>انتقال مستقیم: {current.actionText}</span>
                  <ArrowLeft size={14} />
                </button>
              )}

              {/* Nav buttons */}
              <div className="flex items-center justify-between w-full pt-4 border-t border-slate-100 dark:border-slate-800">
                {currentStep > 0 ? (
                  <button 
                    onClick={() => setCurrentStep(prev => prev - 1)}
                    className="flex items-center gap-2 text-slate-400 font-black text-xs sm:text-sm hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                  >
                    <ArrowRight size={18} />
                    مرحله قبلی
                  </button>
                ) : <div />}

                {currentStep < STEPS.length - 1 ? (
                  <button 
                    onClick={() => setCurrentStep(prev => prev + 1)}
                    className="px-8 py-3.5 bg-emerald-600 text-white rounded-2xl font-black text-xs sm:text-sm flex items-center gap-2 hover:bg-emerald-700 shadow-xl shadow-emerald-600/20 transition-all cursor-pointer"
                  >
                    مرحله بعدی
                    <ArrowLeft size={18} />
                  </button>
                ) : (
                  <button 
                    onClick={onClose}
                    className="px-8 py-3.5 bg-emerald-600 text-white rounded-2xl font-black text-xs sm:text-sm flex items-center gap-2 hover:bg-emerald-700 shadow-xl shadow-emerald-600/20 transition-all cursor-pointer"
                  >
                    ورود به دست اول و شروع
                    <CheckCircle2 size={18} />
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
