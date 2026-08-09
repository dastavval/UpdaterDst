import { motion } from "motion/react";
import { Award, TrendingUp, Building2, Star } from "lucide-react";
import { FactoryProfile } from "../types";

interface FactoryCompetitionProps {
  factories: FactoryProfile[];
  theme: 'light' | 'dark' | 'classic';
}

export default function FactoryCompetition({ factories, theme }: FactoryCompetitionProps) {
  const sortedFactories = [...factories].sort((a, b) => b.rating - a.rating);

  return (
    <div className="space-y-8" dir="rtl">
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div className="space-y-2 text-right">
          <h3 className="text-2xl font-black text-slate-900 flex items-center gap-3 justify-end">
            رتبه‌بندی کیفی تولیدکنندگان برتر
            <Award className="text-amber-500" />
          </h3>
          <p className="text-sm text-slate-400 font-bold">پایش عملکرد کارخانجات بر اساس تداوم تامین، کیفیت کالا و رضایت بنکداران</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedFactories.map((factory, index) => (
          <motion.div
            key={factory.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white border border-slate-100 rounded-[2.5rem] p-6 shadow-sm hover transition-all group overflow-hidden relative"
          >
            <div className="absolute -top-10 -left-10 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl group-hover transition-colors" />
            
            <div className="flex items-center gap-4 mb-6 relative z-10">
              <div className="w-9 h-9 bg-gradient-to-tr from-amber-400 to-amber-500 text-slate-950 rounded-xl flex items-center justify-center font-black text-sm shadow-md shrink-0">
                #{index + 1}
              </div>
              <div className="w-16 h-16 rounded-xl flex items-center justify-center overflow-hidden shrink-0">
                <img onError={(e) => { e.currentTarget.style.display = "none"; }} src={factory.logoUrl} alt={factory.name} className="w-full h-full object-contain" />
              </div>
              <div className="text-right flex-1 min-w-0">
                <h4 className="text-sm sm:text-base font-black text-slate-900 truncate">{factory.name}</h4>
                <div className="flex items-center gap-1 text-[11px] text-amber-500 font-black mt-0.5">
                  <Star size={13} fill="currentColor" />
                  <span>{factory.rating} امتیاز کیفی</span>
                </div>
              </div>
            </div>

            <div className="space-y-4 relative z-10">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100/50">
                  <span className="block text-[9px] text-slate-400 font-black mb-1 uppercase">مبادلات موفق</span>
                  <span className="text-xs font-black text-emerald-600">+{factory.totalDeals} معامله</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100/50">
                  <span className="block text-[9px] text-slate-400 font-black mb-1 uppercase">وضعیت تامین</span>
                  <span className="text-xs font-black text-blue-600">پایدار ✅</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 border-t border-slate-100 pt-4">
                <span className="flex items-center gap-1">
                  <TrendingUp size={12} className="text-emerald-500" />
                  رشد ۳۰ درصدی
                </span>
                <span>تاسیس {factory.establishedYear}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
