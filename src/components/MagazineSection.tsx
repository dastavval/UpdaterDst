import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Newspaper, BookOpen, Calendar, ArrowLeft, Eye, Sparkles, Tag, 
  ChevronLeft, X, MessageSquare, Award, RefreshCw, Wand2, PlusCircle
} from 'lucide-react';
import { ArticleDetailModal, ArticleData } from './ArticleDetailModal';
import { Product } from '../types';

export interface Article extends ArticleData {}

interface MagazineSectionProps {
  articles: Article[];
  onOpenArticleModal?: (article: Article) => void;
  products?: Product[];
  factories?: any[];
  onOpenProduct?: (product: Product) => void;
  onOpenFactory?: (factoryId: string) => void;
  onSwitchTab?: (tab: string) => void;
  onRefreshArticles?: () => void;
  userRole?: string;
}

export const MagazineSection: React.FC<MagazineSectionProps> = ({
  articles,
  onOpenArticleModal,
  products = [],
  factories = [],
  onOpenProduct,
  onOpenFactory,
  onSwitchTab,
  onRefreshArticles,
  userRole
}) => {
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [isGenerating, setIsGenerating] = useState(false);
  const [genMessage, setGenMessage] = useState<string | null>(null);

  const displayArticles = articles && articles.length > 0 ? articles : [];

  const categories = ['all', ...Array.from(new Set(displayArticles.map(a => a.category).filter(Boolean)))];

  const filteredArticles = activeCategory === 'all'
    ? displayArticles
    : displayArticles.filter(a => a.category === activeCategory);

  const handleArticleClick = (article: Article) => {
    if (onOpenArticleModal) {
      onOpenArticleModal(article);
    } else {
      setSelectedArticle(article);
    }
  };

  const handleGenerateBatch = async () => {
    setIsGenerating(true);
    setGenMessage("در حال تولید ۳ الی ۴ مقاله تخصصی با هوش مصنوعی GapGPT...");
    try {
      const res = await fetch("/api/ai/generate-daily-batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count: 3 })
      });
      const data = await res.json();
      if (data.success) {
        setGenMessage("✅ مقالات جدید با موفقیت تولید و منتشر شدند!");
        if (onRefreshArticles) onRefreshArticles();
        setTimeout(() => setGenMessage(null), 4000);
      } else {
        setGenMessage("❌ خطا در ارتباط با سرویس هوش مصنوعی.");
        setTimeout(() => setGenMessage(null), 4000);
      }
    } catch (e) {
      setGenMessage("❌ خطا در ارسال درخواست.");
      setTimeout(() => setGenMessage(null), 4000);
    } finally {
      setIsGenerating(false);
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
                  <span className="bg-purple-100 text-purple-900 border border-purple-200/80 px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1">
                    <Sparkles size={10} className="text-purple-600" />
                    تولید محتوای هوشمند روزانه با GapGPT
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                  مجله تخصصی بنکداری و صنایع غذایی
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center flex-wrap">
              {(userRole === 'admin' || userRole === 'manager') && (
                <button
                  type="button"
                  onClick={handleGenerateBatch}
                  disabled={isGenerating}
                  className="text-xs font-black text-purple-900 bg-purple-100 hover:bg-purple-200 border border-purple-300/80 px-3 py-1.5 rounded-xl shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  title="تولید خودکار روزانه مقالات سئو با هوش مصنوعی"
                >
                  <Wand2 size={13} className={`text-purple-700 ${isGenerating ? 'animate-spin' : ''}`} />
                  <span>{isGenerating ? "در حال تولید..." : "تولید مقالات روزانه با AI"}</span>
                </button>
              )}

              <span className="text-xs font-bold text-emerald-800 bg-emerald-100/80 border border-emerald-200/80 px-3 py-1.5 rounded-xl shadow-2xs">
                {displayArticles.length} خبر و تحلیل بازار
              </span>
            </div>
          </div>

          {/* Toast / Message */}
          {genMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-xs font-black text-purple-950 flex items-center justify-between"
            >
              <span>{genMessage}</span>
              <Sparkles size={14} className="text-purple-600" />
            </motion.div>
          )}

          {/* Category Filter Chips */}
          {categories.length > 2 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 hide-scrollbar">
              {categories.map((cat) => (
                <button
                  key={`cat-${cat}`}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3 py-1 rounded-xl text-xs font-black transition-all shrink-0 cursor-pointer ${
                    activeCategory === cat
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {cat === 'all' ? 'همه موضوعات' : cat}
                </button>
              ))}
            </div>
          )}

          {/* Magazine Horizontal Cards List */}
          <div className="flex flex-nowrap overflow-x-auto snap-x snap-mandatory gap-4 pb-2 pt-1 hide-scrollbar scroll-smooth">
            {filteredArticles.map((article, idx) => (
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
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent opacity-60" />
                    
                    <span className="absolute top-2.5 right-2.5 bg-emerald-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-lg shadow-sm">
                      {article.category || "خبر بازار"}
                    </span>

                    {article.isAiGenerated && (
                      <span className="absolute top-2.5 left-2.5 bg-purple-600/90 text-white text-[9px] font-black px-2 py-0.5 rounded-lg shadow-sm backdrop-blur-xs flex items-center gap-1">
                        <Sparkles size={10} />
                        GapGPT
                      </span>
                    )}

                    <span className="absolute bottom-2 right-2.5 text-[10px] font-black text-slate-900 flex items-center gap-1 bg-white/90 px-2 py-0.5 rounded-md backdrop-blur-md border border-slate-200 shadow-xs">
                      <Calendar size={11} className="text-amber-500" />
                      {article.date}
                    </span>
                  </div>

                  {/* Title & Short Summary */}
                  <div className="space-y-1 min-h-[60px]">
                    <h4 className="text-xs sm:text-sm font-black text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-2 leading-snug">
                      {article.title}
                    </h4>
                    <p className="text-[11px] font-medium text-slate-500 line-clamp-2 leading-relaxed">
                      {article.summary}
                    </p>
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="pt-2.5 mt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-500 truncate max-w-[150px]">
                    📌 {article.source || "دست اول"}
                  </span>
                  <span className="text-[11px] font-black text-emerald-700 group-hover:text-emerald-800 bg-emerald-50 group-hover:bg-emerald-100 px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all border border-emerald-200/60">
                    مطالعه تحلیل
                    <ArrowLeft size={12} />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Interactive Article Detail Modal */}
      {selectedArticle && (
        <ArticleDetailModal
          article={selectedArticle}
          onClose={() => setSelectedArticle(null)}
          products={products}
          factories={factories}
          onOpenProduct={onOpenProduct}
          onOpenFactory={onOpenFactory}
          onSwitchTab={onSwitchTab}
        />
      )}
    </div>
  );
};

export default MagazineSection;
