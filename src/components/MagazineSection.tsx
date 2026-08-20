import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Newspaper, BookOpen, Calendar, ArrowLeft, Eye, Sparkles, Tag, ChevronLeft, X, MessageSquare, Award } from 'lucide-react';

export interface Article {
  id?: string;
  title: string;
  summary: string;
  content: string;
  category: string;
  imageUrl: string;
  source: string;
  date: string;
}

interface MagazineSectionProps {
  articles: Article[];
  onOpenArticleModal?: (article: Article) => void;
}

export const MagazineSection: React.FC<MagazineSectionProps> = ({
  articles,
  onOpenArticleModal
}) => {
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  const displayArticles = articles && articles.length > 0 ? articles : [];

  const handleArticleClick = (article: Article) => {
    if (onOpenArticleModal) {
      onOpenArticleModal(article);
    } else {
      setSelectedArticle(article);
    }
  };

  return (
    <div className="my-6 font-sans font-medium text-right" dir="rtl">
      {/* Container: Dast-e-Aval Magazine Header - Light Theme */}
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-emerald-50/90 via-white to-amber-50/50 text-slate-800 p-5 sm:p-7 border border-emerald-200/80 shadow-md shadow-emerald-950/5">
        {/* Soft Decorative Ambient Circles */}
        <div className="absolute top-0 right-1/4 w-80 h-80 bg-emerald-300/20 rounded-full blur-3xl pointer-events-none animate-pulse" />
        <div className="absolute bottom-0 left-10 w-72 h-72 bg-amber-300/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-5">
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-emerald-100 pb-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-amber-400 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-600/20">
                <Newspaper size={24} />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="bg-emerald-600 text-white font-black px-2.5 py-0.5 rounded-full text-[10px] shadow-2xs">
                    ✨ مجله و اخبار رسمی دست اول
                  </span>
                  <span className="bg-amber-100 text-amber-800 border border-amber-200/80 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                    آخرین تحلیل‌های بازار عمده و خطوط تولید
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                  مجله تخصصی بنکداری و صنایع غذایی
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center">
              <span className="text-xs font-bold text-emerald-800 bg-emerald-100/80 border border-emerald-200/80 px-3 py-1 rounded-xl shadow-2xs">
                {displayArticles.length} خبر و مقاله فعال
              </span>
            </div>
          </div>

          {/* Magazine Horizontal Cards List */}
          <div className="flex flex-nowrap overflow-x-auto snap-x snap-mandatory gap-4 pb-2 pt-1 hide-scrollbar scroll-smooth">
            {displayArticles.map((article, idx) => (
              <div
                key={`mag-art-${article.id || idx}-${idx}`}
                onClick={() => handleArticleClick(article)}
                className="snap-start shrink-0 w-[290px] sm:w-[350px] bg-white border border-slate-200/90 hover:border-emerald-500 rounded-2xl p-3.5 transition-all duration-300 cursor-pointer group flex flex-col justify-between shadow-xs hover:shadow-xl hover:-translate-y-1 relative overflow-hidden"
              >
                <div className="space-y-3">
                  {/* Article Image Container */}
                  <div className="relative w-full h-36 sm:h-40 rounded-xl overflow-hidden bg-slate-100 shadow-inner">
                    <img
                      src={article.imageUrl}
                      alt={article.title}
                      className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-700"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&q=80&w=800";
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-white/60 via-transparent to-transparent opacity-60" />
                    
                    <span className="absolute top-2.5 right-2.5 bg-emerald-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-lg shadow-sm">
                      {article.category || "خبر بازار"}
                    </span>

                    <span className="absolute bottom-2 right-2.5 text-[10px] font-black text-slate-900 flex items-center gap-1 bg-white/70 px-2 py-0.5 rounded-md backdrop-blur-md border border-slate-200">
                      <Calendar size={11} className="text-amber-300" />
                      {article.date}
                    </span>
                  </div>

                  {/* Title & Short Summary */}
                  <div className="space-y-1 min-h-[60px]">
                    <h4 className="text-xs sm:text-sm font-black text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-2 leading-snug">
                      {article.title}
                    </h4>
                    <p className="text-[11px] font-bold text-slate-500 line-clamp-2 leading-relaxed">
                      {article.summary}
                    </p>
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="pt-2.5 mt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-500 truncate max-w-[160px]">
                    📌 {article.source || "دست اول"}
                  </span>
                  <span className="text-[11px] font-black text-emerald-700 group-hover:text-emerald-800 bg-emerald-50 group-hover:bg-emerald-100 px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all border border-emerald-200/60">
                    مطالعه مقاله
                    <ArrowLeft size={12} />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ARTICLE READER MODAL */}
      <AnimatePresence>
        {selectedArticle && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-white/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl border border-slate-100 text-right space-y-5 relative overflow-hidden max-h-[90vh] flex flex-col"
              dir="rtl"
            >
              {/* Top Banner Image */}
              <div className="relative w-full h-52 sm:h-64 rounded-2xl overflow-hidden shrink-0 shadow-md">
                <img
                  src={selectedArticle.imageUrl}
                  alt={selectedArticle.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-white/90 via-white/20 to-transparent" />
                <button
                  onClick={() => setSelectedArticle(null)}
                  className="absolute top-4 left-4 p-2.5 bg-white/70 hover:bg-white text-slate-900 rounded-full transition-colors cursor-pointer border border-slate-200 shadow-sm"
                >
                  <X size={18} />
                </button>

                <div className="absolute bottom-4 right-4 left-4 text-slate-900">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2.5 py-0.5 bg-rose-600 text-white rounded-md text-[10px] font-black">
                      {selectedArticle.category}
                    </span>
                    <span className="text-[10px] text-slate-600 font-bold flex items-center gap-1">
                      <Calendar size={11} />
                      {selectedArticle.date}
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-black leading-tight">{selectedArticle.title}</h3>
                </div>
              </div>

              {/* Content text */}
              <div className="flex-1 overflow-y-auto space-y-4 pr-1 pl-1">
                <div className="p-4 bg-slate-50 border-r-4 border-rose-500 rounded-xl text-xs font-black text-slate-700 leading-relaxed">
                  {selectedArticle.summary}
                </div>

                <div className="text-xs sm:text-sm font-bold text-slate-700 leading-loose whitespace-pre-wrap">
                  {selectedArticle.content || selectedArticle.summary}
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-400">
                  <span>منبع: {selectedArticle.source || "دست اول"}</span>
                  <span>مجله تخصصی تامین کالا</span>
                </div>
              </div>

              {/* Close Footer */}
              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => setSelectedArticle(null)}
                  className="px-6 py-2.5 bg-slate-100 text-slate-900 border border-slate-200 font-black text-xs rounded-xl hover:bg-slate-200 transition-all cursor-pointer"
                >
                  بستن
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MagazineSection;
