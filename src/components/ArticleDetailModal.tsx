import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Calendar, Clock, Share2, Tag, ArrowLeft, Building2, ShoppingBag, 
  Sparkles, CheckCircle2, ChevronDown, ChevronUp, Copy, Check, 
  ExternalLink, Layers, ArrowUpRight, HelpCircle
} from 'lucide-react';
import { Product } from '../types';
import { updatePageSEO } from '../utils/seoHelper';

export interface ArticleData {
  id?: string;
  title: string;
  slug?: string;
  summary: string;
  content: string;
  category: string;
  imageUrl: string;
  source: string;
  date: string;
  readTime?: string;
  tags?: string[];
  linkedProducts?: string[];
  linkedFactories?: string[];
  isAiGenerated?: boolean;
  aiProvider?: string;
  faqs?: Array<{ question: string; answer: string }>;
}

interface ArticleDetailModalProps {
  article: ArticleData | null;
  onClose: () => void;
  products?: Product[];
  factories?: any[];
  onOpenProduct?: (product: Product) => void;
  onOpenFactory?: (factoryId: string) => void;
  onSwitchTab?: (tab: string) => void;
}

export const ArticleDetailModal: React.FC<ArticleDetailModalProps> = ({
  article,
  onClose,
  products = [],
  factories = [],
  onOpenProduct,
  onOpenFactory,
  onSwitchTab
}) => {
  const [copied, setCopied] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  useEffect(() => {
    if (!article) return;

    // Dynamically update Google SEO Meta Tags & Article JSON-LD Schema
    const canonical = `https://dastavval.com/?article=${article.id || article.slug || 'view'}`;
    const schema = {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": canonical
      },
      "headline": article.title,
      "description": article.summary,
      "image": [article.imageUrl || "https://dastavval.com/assets/logo.png"],
      "datePublished": new Date().toISOString(),
      "dateModified": new Date().toISOString(),
      "author": {
        "@type": "Organization",
        "name": "تحریریه هوش مصنوعی دست‌اول",
        "url": "https://dastavval.com"
      },
      "publisher": {
        "@type": "Organization",
        "name": "سامانه ملی دست اول",
        "logo": {
          "@type": "ImageObject",
          "url": "https://raw.githubusercontent.com/antigravity-agent/media/main/dastavval_logo.png"
        }
      },
      "keywords": article.tags ? article.tags.join(', ') : "خرید عمده, صنایع غذایی, دست اول"
    };

    updatePageSEO({
      title: `${article.title} | مجله تخصصی بنکداری دست اول`,
      description: article.summary,
      keywords: article.tags || ["خرید عمده", "صنایع غذایی", "دست اول"],
      canonicalUrl: canonical,
      ogImage: article.imageUrl,
      ogType: "article",
      schema
    });

    // Handle ESC key to close
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [article, onClose]);

  if (!article) return null;

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(`${window.location.origin}/?article=${article.id}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const handleProductClick = (productId: string) => {
    const found = products.find(p => p.id === productId || (p as any).productCode === productId);
    if (found && onOpenProduct) {
      onOpenProduct(found);
    } else {
      if (onSwitchTab) onSwitchTab('order');
    }
  };

  const handleFactoryClick = (factoryId: string) => {
    if (onOpenFactory) {
      onOpenFactory(factoryId);
    } else if (onSwitchTab) {
      onSwitchTab('factories');
    }
  };

  // Find linked products & factories for bottom carousel
  const linkedProductItems = (article.linkedProducts || [])
    .map(id => products.find(p => p.id === id || (p as any).productCode === id))
    .filter(Boolean) as Product[];

  const linkedFactoryItems = (article.linkedFactories || [])
    .map(id => factories.find(f => f.id === id || f.factoryCode === id))
    .filter(Boolean);

  /**
   * Parser that replaces internal link tokens [[product:ID|Label]], [[factory:ID|Label]], etc.
   * with clickable Iranian interactive elements.
   */
  const renderFormattedContent = (content: string) => {
    if (!content) return null;

    // Split content by paragraphs or headings
    const paragraphs = content.split('\n\n');

    return paragraphs.map((block, pIdx) => {
      const trimmed = block.trim();
      if (!trimmed) return null;

      // H3 Heading
      if (trimmed.startsWith('### ')) {
        return (
          <h3 key={`h3-${pIdx}`} className="text-base sm:text-lg font-black text-slate-900 mt-6 mb-3 flex items-center gap-2 border-r-4 border-emerald-600 pr-3">
            {trimmed.replace(/^###\s*/, '')}
          </h3>
        );
      }

      // H2 Heading
      if (trimmed.startsWith('## ')) {
        return (
          <h2 key={`h2-${pIdx}`} className="text-lg sm:text-xl font-black text-slate-900 mt-8 mb-4 border-b border-slate-200 pb-2">
            {trimmed.replace(/^##\s*/, '')}
          </h2>
        );
      }

      // Unordered list items
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        const items = trimmed.split('\n');
        return (
          <ul key={`ul-${pIdx}`} className="space-y-2 my-4 pr-4 list-disc marker:text-emerald-600 text-xs sm:text-sm font-semibold text-slate-700 leading-relaxed">
            {items.map((it, itIdx) => (
              <li key={`li-${pIdx}-${itIdx}`}>
                {renderInlineTokens(it.replace(/^[-*]\s*/, ''))}
              </li>
            ))}
          </ul>
        );
      }

      // Numbered list items
      if (/^\d+\.\s/.test(trimmed)) {
        const items = trimmed.split('\n');
        return (
          <ol key={`ol-${pIdx}`} className="space-y-2 my-4 pr-5 list-decimal marker:text-emerald-700 marker:font-black text-xs sm:text-sm font-semibold text-slate-700 leading-relaxed">
            {items.map((it, itIdx) => (
              <li key={`oli-${pIdx}-${itIdx}`}>
                {renderInlineTokens(it.replace(/^\d+\.\s*/, ''))}
              </li>
            ))}
          </ol>
        );
      }

      // Regular paragraph with inline link tokens
      return (
        <p key={`p-${pIdx}`} className="text-xs sm:text-sm font-medium text-slate-700 leading-loose mb-4">
          {renderInlineTokens(trimmed)}
        </p>
      );
    });
  };

  /**
   * Helper to parse inline tokens like [[product:PRD-1001|چیپس چی‌توز]] or [[factory:fac-1|به‌آرا]]
   */
  const renderInlineTokens = (text: string) => {
    // Regex for [[type:id|label]] or [[type:label]]
    const tokenRegex = /\[\[([a-zA-Z0-9_-]+):?([^|\]]*)\|?([^\]]*)\]\]/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = tokenRegex.exec(text)) !== null) {
      const matchIndex = match.index;
      if (matchIndex > lastIndex) {
        parts.push(text.substring(lastIndex, matchIndex));
      }

      const type = match[1];
      const param1 = match[2];
      const param2 = match[3];

      let id = param1;
      let label = param2 || param1;

      // Handle cases where label is the only param
      if (!param2 && param1) {
        label = param1;
        id = param1;
      }

      if (type === 'product') {
        const prod = products.find(p => p.id === id || (p as any).productCode === id);
        parts.push(
          <button
            key={`inline-prod-${matchIndex}`}
            type="button"
            onClick={() => handleProductClick(id)}
            className="inline-flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300/80 px-2 py-0.5 rounded-lg text-xs font-black mx-1 transition-colors cursor-pointer shadow-2xs group"
          >
            <ShoppingBag size={12} className="text-emerald-600 group-hover:scale-110 transition-transform" />
            <span>{label || prod?.name || "مشاهده محصول"}</span>
            <ArrowUpRight size={11} className="text-emerald-500" />
          </button>
        );
      } else if (type === 'factory') {
        parts.push(
          <button
            key={`inline-fac-${matchIndex}`}
            type="button"
            onClick={() => handleFactoryClick(id)}
            className="inline-flex items-center gap-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300/80 px-2 py-0.5 rounded-lg text-xs font-black mx-1 transition-colors cursor-pointer shadow-2xs group"
          >
            <Building2 size={12} className="text-amber-600 group-hover:scale-110 transition-transform" />
            <span>{label || "کارخانه همکار"}</span>
            <ArrowUpRight size={11} className="text-amber-600" />
          </button>
        );
      } else if (type === 'billboard') {
        parts.push(
          <button
            key={`inline-bb-${matchIndex}`}
            type="button"
            onClick={() => onSwitchTab && onSwitchTab('billboard')}
            className="inline-flex items-center gap-1 bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-300/80 px-2 py-0.5 rounded-lg text-xs font-black mx-1 transition-colors cursor-pointer shadow-2xs"
          >
            <Layers size={12} className="text-purple-600" />
            <span>{label || "تالار کف بازار"}</span>
          </button>
        );
      } else if (type === 'category' || type === 'tab') {
        parts.push(
          <button
            key={`inline-tab-${matchIndex}`}
            type="button"
            onClick={() => onSwitchTab && onSwitchTab(id === 'order' || type === 'category' ? 'order' : id)}
            className="inline-flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 px-2 py-0.5 rounded-lg text-xs font-black mx-1 transition-colors cursor-pointer"
          >
            <span>{label}</span>
          </button>
        );
      } else {
        parts.push(label || match[0]);
      }

      lastIndex = tokenRegex.lastIndex;
    }

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts;
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.25 }}
          className="bg-white rounded-3xl sm:rounded-[2.5rem] max-w-3xl w-full shadow-2xl border border-slate-200 text-right relative overflow-hidden my-auto max-h-[92vh] flex flex-col"
          dir="rtl"
        >
          {/* Top Sticky Action Bar */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-white/90 backdrop-blur-md sticky top-0 z-20 shrink-0">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-emerald-200">
                <Sparkles size={11} className="text-emerald-600" />
                {article.category || "مقاله تخصصی"}
              </span>
              {article.isAiGenerated && (
                <span className="bg-purple-100 text-purple-800 text-[9px] font-black px-2 py-0.5 rounded-md border border-purple-200">
                  🤖 تولید شده با GapGPT
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyLink}
                className="p-2 rounded-xl text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer border border-slate-200 text-xs flex items-center gap-1.5"
                title="کپی لینک مقاله"
              >
                {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                <span className="text-[10px] font-bold">{copied ? "کپی شد" : "اشتراک"}</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer border border-slate-200"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Scrollable Modal Body */}
          <div className="flex-1 overflow-y-auto px-5 sm:px-8 py-6 space-y-6">
            {/* Banner Image */}
            <div className="relative w-full h-56 sm:h-72 rounded-2xl sm:rounded-3xl overflow-hidden shadow-md bg-slate-100">
              <img
                src={article.imageUrl}
                alt={article.title}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&q=80&w=1000";
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />

              <div className="absolute bottom-4 right-4 left-4 text-white space-y-2">
                <div className="flex items-center gap-3 text-[10px] font-black text-slate-200">
                  <span className="flex items-center gap-1 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10">
                    <Calendar size={11} className="text-amber-400" />
                    {article.date}
                  </span>
                  <span className="flex items-center gap-1 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10">
                    <Clock size={11} className="text-emerald-400" />
                    {article.readTime || "۴ دقیقه مطالعه"}
                  </span>
                  <span className="bg-emerald-600/90 px-2.5 py-1 rounded-lg font-bold">
                    منبع: {article.source || "دست اول"}
                  </span>
                </div>
              </div>
            </div>

            {/* Title & Summary */}
            <div className="space-y-3">
              <h1 className="text-lg sm:text-2xl font-black text-slate-900 leading-snug tracking-tight">
                {article.title}
              </h1>

              {article.summary && (
                <div className="p-4 bg-emerald-50/80 border-r-4 border-emerald-600 rounded-2xl text-xs sm:text-sm font-bold text-emerald-950 leading-relaxed shadow-2xs">
                  {article.summary}
                </div>
              )}
            </div>

            {/* Article Markdown Body */}
            <div className="prose prose-slate max-w-none text-right">
              {renderFormattedContent(article.content)}
            </div>

            {/* Embedded Linked Products Card Box */}
            {linkedProductItems.length > 0 && (
              <div className="bg-gradient-to-br from-emerald-900 to-slate-900 rounded-2xl sm:rounded-3xl p-5 text-white space-y-4 shadow-xl border border-emerald-700/40">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
                      <ShoppingBag size={16} />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-black">محصولات بررسی شده در این مقاله</h4>
                      <p className="text-[10px] text-emerald-200">استعلام قیمت روز و خرید مستقیم با صدور پیش‌فاکتور رسمی</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {linkedProductItems.map((prod) => (
                    <div
                      key={`linked-p-${prod.id}`}
                      onClick={() => handleProductClick(prod.id)}
                      className="bg-white/10 hover:bg-white/15 backdrop-blur-md rounded-2xl p-3 border border-white/10 flex items-center justify-between gap-3 cursor-pointer group transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={prod.image_url || (prod as any).imageUrl || "https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&q=80&w=200"}
                          alt={prod.name}
                          className="w-12 h-12 rounded-xl object-cover shrink-0 border border-white/10 group-hover:scale-105 transition-transform"
                          referrerPolicy="no-referrer"
                        />
                        <div className="space-y-0.5">
                          <h5 className="text-xs font-black text-white group-hover:text-emerald-300 transition-colors line-clamp-1">
                            {prod.name}
                          </h5>
                          <span className="text-[10px] text-emerald-300 font-bold block">
                            {prod.bulk_price ? `${new Intl.NumberFormat('fa-IR').format(prod.bulk_price)} تومان` : "استعلام قیمت مستقیم"}
                          </span>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 bg-emerald-500 group-hover:bg-emerald-400 text-slate-950 font-black text-[10px] rounded-xl shrink-0 transition-colors flex items-center gap-1">
                        خرید
                        <ArrowLeft size={10} />
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Embedded Linked Factories Box */}
            {linkedFactoryItems.length > 0 && (
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl sm:rounded-3xl p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <Building2 size={18} className="text-amber-600" />
                  <h4 className="text-xs sm:text-sm font-black text-slate-900">کارخانجات همکار مرتبط</h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {linkedFactoryItems.map((fac: any) => (
                    <div
                      key={`linked-fac-${fac.id}`}
                      onClick={() => handleFactoryClick(fac.id)}
                      className="bg-white rounded-2xl p-3 border border-slate-200 hover:border-amber-500 transition-all flex items-center justify-between cursor-pointer group shadow-2xs"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-700 font-black text-sm shrink-0 border border-amber-200/60">
                          🏢
                        </div>
                        <div>
                          <h5 className="text-xs font-black text-slate-900 group-hover:text-amber-700 transition-colors">
                            {fac.name}
                          </h5>
                          <span className="text-[10px] text-slate-500 font-semibold">
                            {fac.city || fac.province || "ایران"} • ظرفیت {fac.capacityPerMonth || fac.capacity || "بالا"}
                          </span>
                        </div>
                      </div>
                      <ArrowLeft size={14} className="text-slate-400 group-hover:text-amber-600 transition-colors" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* FAQs Accordion for Google SEO Rich Snippets */}
            {article.faqs && article.faqs.length > 0 && (
              <div className="space-y-3 pt-2">
                <h4 className="text-xs sm:text-sm font-black text-slate-900 flex items-center gap-1.5">
                  <HelpCircle size={16} className="text-emerald-600" />
                  پرسش‌های متداول درباره این موضوع
                </h4>

                <div className="space-y-2">
                  {article.faqs.map((faq, idx) => (
                    <div key={`faq-${idx}`} className="border border-slate-200 rounded-2xl overflow-hidden bg-white">
                      <button
                        type="button"
                        onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                        className="w-full px-4 py-3 text-right flex items-center justify-between font-black text-xs text-slate-800 hover:bg-slate-50 transition-colors cursor-pointer"
                      >
                        <span>{faq.question}</span>
                        {activeFaq === idx ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                      {activeFaq === idx && (
                        <div className="px-4 pb-3 pt-1 text-xs font-medium text-slate-600 leading-relaxed border-t border-slate-100 bg-slate-50/50">
                          {faq.answer}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Article Tags */}
            {article.tags && article.tags.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-slate-100">
                <Tag size={13} className="text-slate-400 shrink-0" />
                <span className="text-[10px] font-bold text-slate-500">برچسب‌ها:</span>
                {article.tags.map((t, idx) => (
                  <span
                    key={`tag-${idx}`}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold px-2.5 py-0.5 rounded-lg transition-colors"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Footer Call To Action */}
          <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
              <CheckCircle2 size={16} className="text-emerald-600" />
              <span>پلتفرم مبادلات B2B صنایع غذایی دست اول</span>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onSwitchTab) onSwitchTab('order');
                }}
                className="flex-1 sm:flex-initial bg-emerald-600 hover:bg-emerald-700 text-white font-black px-5 py-2.5 rounded-xl text-xs transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ShoppingBag size={14} />
                <span>مشاهده کاتالوگ و استعلام قیمت</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ArticleDetailModal;
