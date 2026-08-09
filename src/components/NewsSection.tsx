import React from "react";
import { NewsArticle } from "../types";
import { motion } from "motion/react";
import { Calendar, User, ArrowLeft, Newspaper } from "lucide-react";

interface NewsSectionProps {
  news: NewsArticle[];
  theme: "light" | "dark" | "classic";
}

export default function NewsSection({ news, theme }: NewsSectionProps) {
  if (!news || news.length === 0) {
    return (
      <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-3xl space-y-2">
        <Newspaper className="mx-auto text-slate-400" size={28} />
        <p className="text-xs font-black text-slate-600">هنوز هیچ خبر یا تحلیلی منتشر نشده است.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600">
            <Newspaper size={20} />
          </div>
          <div>
            <h2 className={`text-lg font-black ${theme === "dark" ? "text-white" : "text-slate-900"}`}>
              تازه‌های دنیای صنایع غذایی
            </h2>
            <p className="text-[10px] font-bold text-slate-400">آخرین اخبار، تحلیل‌ها و گزارش‌های بازار عمده</p>
          </div>
        </div>
        <button className="text-xs font-black text-emerald-600 hover:underline">مشاهده آرشیو</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {news.map((item, idx) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className={`group flex flex-col sm:flex-row gap-4 p-4 rounded-3xl border transition-all hover ${
              theme === "dark" 
              ? "bg-white/50 border-slate-800 hover" 
              : "bg-white border-slate-100 hover"
            }`}
          >
            <div className="w-full sm:w-32 h-32 rounded-2xl overflow-hidden shrink-0 bg-slate-50 flex items-center justify-center">
              <img 
                src={item.imageUrl} 
                alt={item.title} 
                className="w-full h-full object-cover transition-transform group-hover:scale-110" 
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&q=80&w=400";
                }}
              />
            </div>
            <div className="flex flex-col justify-between py-1 min-w-0">
              <div className="space-y-2">
                <div className="flex items-center gap-3 text-[9px] font-black uppercase tracking-wider">
                  <span className={`px-2 py-0.5 rounded-full ${
                    item.category === 'industry' ? 'bg-blue-100 text-blue-600' : 'bg-amber-100 text-amber-600'
                  }`}>
                    {item.category === 'industry' ? 'اخبار صنعت' : 'تحلیل بازار'}
                  </span>
                  <div className="flex items-center gap-1 text-slate-400">
                    <Calendar size={10} />
                    {item.date}
                  </div>
                </div>
                <h3 className={`text-xs font-black leading-relaxed line-clamp-2 ${theme === "dark" ? "text-slate-200" : "text-slate-800"}`}>
                  {item.title}
                </h3>
                <p className="text-[10px] font-medium text-slate-400 line-clamp-2">
                  {item.summary}
                </p>
              </div>
              <button className="flex items-center gap-1.5 text-[10px] font-black text-emerald-600 mt-2">
                ادامه مطلب
                <ArrowLeft size={12} />
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
