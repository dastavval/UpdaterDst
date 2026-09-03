import React from "react";
import { motion } from "motion/react";
import { ShieldCheck, Factory, Truck, Coins } from "lucide-react";

const ADVANTAGES = [
  {
    title: "توزیع مستقیم از خط تولید",
    desc: "حذف ۱۰۰٪ واسطه‌ها و دلالان بازار؛ خرید مستقیم از انبار کارخانه با قیمت رسمی و مصوب خروجی.",
    icon: <Factory size={22} />,
    color: "bg-emerald-600",
    badge: "نرخ مصوب کارخانه"
  },
  {
    title: "لجستیک و ترابری سراسری",
    desc: "ارسال سریع محصولات به سراسر کشور با ناوگان ترابری مجهز، بارنامه دولتی و بیمه کامل کالا.",
    icon: <Truck size={22} />,
    color: "bg-emerald-600",
    badge: "پوشش ۳۱ استان"
  },
  {
    title: "تضمین اصالت و سلامت کالا",
    desc: "تمامی اقلام دارای پروانه بهداشتی، سیب سلامت، تاریخ مصرف معتبر و ضمانت عودت وجه می‌باشند.",
    icon: <ShieldCheck size={22} />,
    color: "bg-emerald-600",
    badge: "نشان استاندارد و سلامت"
  },
  {
    title: "تسویه اعتباری و تسهیلات",
    desc: "امکان ثبت سفارش با چک صیادی و شرایط اعتباری ویژه برای بنکداران و خریداران خوش‌حساب.",
    icon: <Coins size={22} />,
    color: "bg-emerald-600",
    badge: "اعتبار خرید سازمانی"
  }
];

export default function PlatformAdvantages({ theme }: { theme: 'light' | 'dark' | 'classic' }) {
  return (
    <div className="py-8" dir="rtl">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-600 text-white text-[11px] font-black border border-emerald-200/70 mb-2">
          مزایای زیرساختی دست اول
        </div>
        <h2 className={`text-xl sm:text-2xl font-black mb-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
          چرا "دست اول" انتخاب اول بنکداران و صنایع غذایی است؟
        </h2>
        <p className="text-xs font-bold text-slate-500 max-w-xl mx-auto">
          زیرساخت هوشمند و قانونی اتصال مستقیم خریداران عمده به برترین کارخانجات کشور
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {ADVANTAGES.map((adv, idx) => {
          return (
            <motion.div
              key={`plat-adv-${adv.title}-${idx}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: idx * 0.04 }}
              className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:shadow-md hover:border-emerald-400 transition-all duration-200 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-11 h-11 rounded-xl ${adv.color} text-white flex items-center justify-center shadow-xs`}>
                    {adv.icon}
                  </div>
                  <span className="text-[10px] font-black text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/60">
                    {adv.badge}
                  </span>
                </div>
                <h3 className={`text-sm font-black mb-2 ${theme === 'dark' ? 'text-slate-100' : 'text-slate-850'}`}>
                  {adv.title}
                </h3>
                <p className="text-[11.5px] leading-relaxed text-slate-500 font-bold">
                  {adv.desc}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

