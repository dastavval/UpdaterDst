import { motion } from "motion/react";
import { CheckCircle2, Circle, ArrowRight, Zap, ShieldCheck, Truck, PackageCheck } from "lucide-react";

interface SiteRoadmapProps {
  theme: 'light' | 'dark' | 'classic';
}

export default function SiteRoadmap({ theme }: SiteRoadmapProps) {
  const steps = [
    {
      id: 1,
      title: "استعلام هوشمند و بررسی موجودی",
      desc: "انتخاب کالا از کاتالوگ آنلاین و بررسی لحظه‌ای موجودی انبار مرکزی کارخانه",
      status: "completed",
      icon: <Zap size={20} />
    },
    {
      id: 2,
      title: "ثبت سفارش و صدور پیش‌فاکتور",
      desc: "ثبت تعداد کارتن مورد نیاز و دریافت پیش‌فاکتور سیستمی با لحاظ تخفیفات همکار",
      status: "active",
      icon: <ShieldCheck size={20} />
    },
    {
      id: 3,
      title: "تایید مالی و تخصیص بارنامه",
      desc: "بررسی مدارک پرداخت و رزرو ظرفیت ناوگان حمل و نقل اختصاصی دست اول",
      status: "pending",
      icon: <Truck size={20} />
    },
    {
      id: 4,
      title: "تحویل مستقیم درب فروشگاه",
      desc: "بارگیری از کارخانه و تخلیه در مقصد با نظارت مستقیم تیم پشتیبانی",
      status: "pending",
      icon: <PackageCheck size={20} />
    }
  ];

  return (
    <div className="space-y-12 py-12" dir="rtl">
      <div className="text-center space-y-3">
        <h3 className="text-2xl font-black text-slate-900">نقشه راه خرید بی‌واسطه</h3>
        <p className="text-sm text-slate-400 font-bold max-w-2xl mx-auto">ما فرآیند پیچیده تامین کالا را به ۴ مرحله شفاف و سریع تبدیل کرده‌ایم</p>
      </div>

      <div className="relative">
        {/* Connection Line */}
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-100 -translate-y-1/2 hidden lg:block" />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative z-10">
          {steps.map((step, index) => (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className={`p-6 rounded-[2.5rem] border ${
                step.status === 'active' 
                  ? 'bg-emerald-600 text-white border-emerald-500 shadow-xl shadow-emerald-600/20' 
                  : step.status === 'completed'
                  ? 'bg-white border-emerald-100 text-slate-900'
                  : 'bg-slate-50 border-slate-100 text-slate-400'
              } transition-all relative overflow-hidden`}
            >
              {step.status === 'completed' && (
                <div className="absolute top-4 left-4 text-emerald-500">
                  <CheckCircle2 size={16} />
                </div>
              )}
              
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 shadow-lg ${
                step.status === 'active' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
              }`}>
                {step.icon}
              </div>

              <h4 className="text-sm font-black mb-3">{step.title}</h4>
              <p className={`text-[11px] font-bold leading-relaxed ${
                step.status === 'active' ? 'text-emerald-50' : 'text-slate-400'
              }`}>
                {step.desc}
              </p>

              {index < steps.length - 1 && (
                <div className="mt-6 flex justify-end lg:hidden">
                  <ArrowRight size={20} className="text-slate-300 -rotate-90" />
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
