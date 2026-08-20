import React from "react";
import { motion } from "motion/react";
import { ShieldCheck, Zap, Factory, Map, TrendingUp, Handshake } from "lucide-react";

const ADVANTAGES = [
  {
    title: "توزیع مستقیم از خط تولید",
    desc: "حذف کامل واسطه‌ها و دلالان بازار؛ خرید مستقیم از انبار کارخانه با قیمت رسمی خروجی.",
    icon: <Factory size={24} />,
    color: "bg-emerald-500"
  },
  {
    title: "شبکه گسترده کشوری",
    desc: "ارسال سریع محصولات به تمامی نقاط ایران با ناوگان اختصاصی جاده‌ای و بیمه کالا.",
    icon: <Map size={24} />,
    color: "bg-blue-500"
  },
  {
    title: "تضمین اصالت و کیفیت",
    desc: "تمامی کالاها با نظارت مستقیم تیم بازرسی دست اول و ضمانت بازگشت وجه تامین می‌شوند.",
    icon: <ShieldCheck size={24} />,
    color: "bg-indigo-500"
  },
  {
    title: "تسویه اعتباری هوشمند",
    desc: "امکان خرید اقساطی و اعتباری برای بنکداران دارای رتبه طلایی و وی‌آی‌پی.",
    icon: <Handshake size={24} />,
    color: "bg-violet-500"
  }
];

export default function PlatformAdvantages({ theme }: { theme: 'light' | 'dark' | 'classic' }) {
  return (
    <div className="py-12">
      <div className="text-center mb-12">
        <h2 className={`text-2xl font-black mb-3 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
          چرا "دست اول" انتخاب اول صنایع غذایی است؟
        </h2>
        <p className="text-xs font-bold text-slate-400">مزایای رقابتی که تجارت شما را متحول می‌کند</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {ADVANTAGES.map((adv, idx) => {
          const bgColors = [
            "bg-emerald-50/40 border-emerald-200/70",
            "bg-blue-50/40 border-blue-200/70",
            "bg-indigo-50/40 border-indigo-200/70",
            "bg-violet-50/40 border-violet-200/70"
          ];
          const bgStyle = bgColors[idx % bgColors.length];
          return (
            <motion.div
              key={`plat-adv-${adv.title}-${idx}`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "100px" }}
              transition={{ delay: idx * 0.1 }}
              className={`p-6 rounded-[2.5rem] border transition-all hover hover:-translate-y-1 ${bgStyle} shadow-sm`}
            >
              <div className={`w-12 h-12 rounded-2xl ${adv.color} text-white flex items-center justify-center mb-6 shadow-lg shadow-${adv.color.split('-')[1]}-500/20`}>
                {adv.icon}
              </div>
              <h3 className={`text-sm font-black mb-3 ${theme === 'dark' ? 'text-slate-100' : 'text-slate-850'}`}>{adv.title}</h3>
              <p className="text-[11px] leading-relaxed text-slate-500 font-bold">{adv.desc}</p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
