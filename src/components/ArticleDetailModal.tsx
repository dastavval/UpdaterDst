import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Calendar, Clock, Share2, Tag, ArrowLeft, Building2, ShoppingBag, 
  Sparkles, CheckCircle2, ChevronDown, ChevronUp, Copy, Check, 
  ExternalLink, Layers, ArrowUpRight, HelpCircle, List, Compass, Target, Quote, MessageSquareText, Link2
} from 'lucide-react';
import { Product } from '../types';
import { updatePageSEO } from '../utils/seoHelper';
import { autoInjectProductShortcodes } from '../utils/autoLinker';

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
  articleType?: 'pillar' | 'cluster';
  focusKeyword?: string;
  secondaryKeywords?: string[];
  metaTitle?: string;
  metaDescription?: string;
  pillarTopic?: string;
}

interface ArticleDetailModalProps {
  article: ArticleData | null;
  onClose: () => void;
  products?: Product[];
  factories?: any[];
  onOpenProduct?: (product: Product) => void;
  onOpenFactory?: (factoryId: string) => void;
  onSwitchTab?: (tab: string) => void;
  onSelectArticle?: (article: ArticleData) => void;
}

export const ArticleDetailModal: React.FC<ArticleDetailModalProps> = ({
  article,
  onClose,
  products = [],
  factories = [],
  onOpenProduct,
  onOpenFactory,
  onSwitchTab,
  onSelectArticle
}) => {
  const [copied, setCopied] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(0);

  // Deep Linking & PushState URL update
  useEffect(() => {
    if (!article) return;

    // Update Browser Address Bar for Dedicated Article URL
    const originalUrl = window.location.href;
    const articleIdOrSlug = article.id || article.slug || 'view';
    const newUrl = `${window.location.origin}/?article=${encodeURIComponent(articleIdOrSlug)}`;
    
    try {
      window.history.pushState({ articleId: articleIdOrSlug }, '', newUrl);
    } catch (e) {
      console.warn("Could not pushState:", e);
    }

    // Dynamically update Google SEO Meta Tags & Article JSON-LD Schema
    const canonical = newUrl;
    const schema = {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": canonical
      },
      "headline": article.metaTitle || article.title,
      "description": article.metaDescription || article.summary,
      "image": [article.imageUrl || "https://dastavval.com/assets/logo.png"],
      "datePublished": new Date().toISOString(),
      "dateModified": new Date().toISOString(),
      "author": {
        "@type": "Organization",
        "name": article.source || "تحریریه هوش مصنوعی دست‌اول",
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
      "keywords": [article.focusKeyword, ...(article.secondaryKeywords || []), ...(article.tags || [])].filter(Boolean).join(', ')
    };

    // FAQ Page Schema
    let faqSchema: any = null;
    if (article.faqs && article.faqs.length > 0) {
      faqSchema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": article.faqs.map(faq => ({
          "@type": "Question",
          "name": faq.question,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": faq.answer
          }
        }))
      };
    }

    updatePageSEO({
      title: `${article.metaTitle || article.title} | مجله B2B دست اول`,
      description: article.metaDescription || article.summary,
      keywords: [article.focusKeyword, ...(article.secondaryKeywords || []), ...(article.tags || [])].filter(Boolean) as string[],
      canonicalUrl: canonical,
      ogImage: article.imageUrl,
      ogType: "article",
      schema: faqSchema ? [schema, faqSchema] : schema
    });

    // Handle ESC key to close
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      try {
        window.history.replaceState({}, '', originalUrl);
      } catch (e) {}
    };
  }, [article, onClose]);

  if (!article) return null;

  const isPillar = article.articleType === 'pillar' || article.category?.includes('پیلار') || article.category?.includes('جامع');

  // Extract Table of Contents headings from markdown content
  const extractHeadings = (text: string) => {
    if (!text) return [];
    const lines = text.split('\n');
    const headings: Array<{ id: string; text: string; level: number }> = [];
    lines.forEach((line, idx) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('## ')) {
        const titleText = trimmed.replace(/^##\s*/, '');
        headings.push({ id: `heading-${idx}`, text: titleText, level: 2 });
      } else if (trimmed.startsWith('### ')) {
        const titleText = trimmed.replace(/^###\s*/, '');
        headings.push({ id: `heading-${idx}`, text: titleText, level: 3 });
      }
    });
    return headings;
  };

  const tableOfContents = extractHeadings(article.content);

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      const directUrl = `${window.location.origin}/?article=${article.id || article.slug || 'view'}`;
      navigator.clipboard.writeText(directUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const handleProductClick = (productId: string) => {
    const found = products.find(p => String(p.id) === String(productId) || (p as any).productCode === productId);
    if (found && onOpenProduct) {
      onOpenProduct(found);
    } else if (onSwitchTab) {
      onSwitchTab('order');
    }
  };

  const handleFactoryClick = (factoryId: string) => {
    if (onOpenFactory) {
      onOpenFactory(factoryId);
    } else if (onSwitchTab) {
      onSwitchTab('factories');
    }
  };

  // Automatically detect and inject internal product links into article text
  const processedArticle = useMemo(() => {
    if (!article || !article.content) {
      return { updatedContent: '', linksCount: 0, linkedProducts: [] };
    }
    return autoInjectProductShortcodes(article.content, products || [], 2);
  }, [article, products]);

  const linkedProductItems = useMemo(() => {
    const explicitIds = (article?.linkedProducts || []);
    const autoLinkedIds = (processedArticle.linkedProducts || []).map(p => String(p.id));
    const combinedIds = Array.from(new Set([...explicitIds, ...autoLinkedIds]));

    return combinedIds
      .map(id => products.find(p => String(p.id) === String(id) || (p as any).productCode === id))
      .filter(Boolean) as Product[];
  }, [article?.linkedProducts, processedArticle.linkedProducts, products]);

  const linkedFactoryItems = (article?.linkedFactories || [])
    .map(id => factories.find(f => String(f.id) === String(id) || f.factoryCode === id))
    .filter(Boolean);

  /**
   * Helper to parse inline tokens like [[product:PRD-1001|چیپس چی‌توز]]
   */
  const renderInlineTokens = (text: string) => {
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

      if (!param2 && param1) {
        label = param1;
        id = param1;
      }

      if (type === 'product') {
        const prod = products.find(p => String(p.id) === String(id) || (p as any).productCode === id);
        const priceDisplay = prod?.bulk_price || prod?.price 
          ? `${(prod.bulk_price || prod.price).toLocaleString('fa-IR')} تومان`
          : null;

        parts.push(
          <button
            key={`inline-prod-${matchIndex}`}
            type="button"
            onClick={() => handleProductClick(id)}
            title={`لینک داخلی سئو به محصول: ${prod?.name || label} ${priceDisplay ? '| قیمت عمده: ' + priceDisplay : ''}`}
            className="inline-flex items-center gap-1 bg-gradient-to-r from-emerald-700 to-teal-700 hover:from-emerald-800 hover:to-teal-800 text-white font-black border border-emerald-500 px-2.5 py-0.5 rounded-lg text-xs mx-1 transition-all cursor-pointer shadow-xs group"
          >
            <ShoppingBag size={12} className="text-emerald-200 group-hover:scale-110 transition-transform" />
            <span>{label || prod?.name || "مشاهده محصول"}</span>
            {priceDisplay && (
              <span className="bg-emerald-950/40 text-emerald-200 text-[10px] px-1.5 py-0.2 rounded font-extrabold mr-0.5">
                {priceDisplay}
              </span>
            )}
            <ArrowUpRight size={11} className="text-emerald-300" />
          </button>
        );
      } else if (type === 'factory') {
        parts.push(
          <button
            key={`inline-fac-${matchIndex}`}
            type="button"
            onClick={() => handleFactoryClick(id)}
            className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-950 border border-emerald-300 px-2.5 py-0.5 rounded-lg text-xs font-black mx-1 transition-colors cursor-pointer shadow-2xs group hover:bg-emerald-200"
          >
            <Building2 size={12} className="text-emerald-700 group-hover:scale-110 transition-transform" />
            <span>{label || "کارخانه همکار"}</span>
            <ArrowUpRight size={11} className="text-emerald-700" />
          </button>
        );
      } else if (type === 'billboard') {
        parts.push(
          <button
            key={`inline-bb-${matchIndex}`}
            type="button"
            onClick={() => onSwitchTab && onSwitchTab('billboard')}
            className="inline-flex items-center gap-1 bg-purple-100 hover:bg-purple-200 text-purple-900 border border-purple-300 px-2.5 py-0.5 rounded-lg text-xs font-black mx-1 transition-colors cursor-pointer shadow-2xs"
          >
            <Layers size={12} className="text-purple-700" />
            <span>{label || "تالار کف بازار"}</span>
          </button>
        );
      } else if (type === 'cta') {
        parts.push(
          <button
            key={`inline-cta-${matchIndex}`}
            type="button"
            onClick={() => onSwitchTab && onSwitchTab('order')}
            className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black px-3 py-1 rounded-xl text-xs mx-1 my-1 transition-all cursor-pointer shadow-md shadow-emerald-600/20"
          >
            <ShoppingBag size={13} />
            <span>{label || "ثبت سفارش آنلاین"}</span>
          </button>
        );
      } else if (type === 'quote') {
        parts.push(
          <span key={`inline-quote-${matchIndex}`} className="block my-3 p-3 bg-amber-50 border-r-4 border-amber-500 rounded-xl text-xs font-bold text-amber-950">
            <Quote size={14} className="text-amber-600 inline ml-1" />
            {label}
          </span>
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

  /**
   * Parser that replaces markdown paragraphs and headings
   */
  const renderFormattedContent = (content: string) => {
    if (!content) return null;

    const paragraphs = content.split('\n\n');

    return paragraphs.map((block, pIdx) => {
      const trimmed = block.trim();
      if (!trimmed) return null;

      // Handle [[toc]] shortcode inline insertion
      if (trimmed === '[[toc]]') {
        return renderTocBox(`toc-inline-${pIdx}`);
      }

      // H3 Heading
      if (trimmed.startsWith('### ')) {
        const titleText = trimmed.replace(/^###\s*/, '');
        return (
          <h3 key={`h3-${pIdx}`} id={`heading-${pIdx}`} className="text-base sm:text-lg font-black text-slate-900 mt-6 mb-3 flex items-center gap-2 border-r-4 border-emerald-600 pr-3 scroll-mt-20">
            {titleText}
          </h3>
        );
      }

      // H2 Heading
      if (trimmed.startsWith('## ')) {
        const titleText = trimmed.replace(/^##\s*/, '');
        return (
          <h2 key={`h2-${pIdx}`} id={`heading-${pIdx}`} className="text-lg sm:text-xl font-black text-slate-900 mt-8 mb-4 border-b border-slate-200 pb-2 scroll-mt-20 flex items-center justify-between">
            <span>{titleText}</span>
            <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">بخش اصلی</span>
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

      // Regular paragraph with inline tokens
      return (
        <p key={`p-${pIdx}`} className="text-xs sm:text-sm font-medium text-slate-700 leading-loose mb-4">
          {renderInlineTokens(trimmed)}
        </p>
      );
    });
  };

  const renderTocBox = (keyStr: string) => {
    if (tableOfContents.length === 0) return null;
    return (
      <div key={keyStr} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 my-6 shadow-2xs">
        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-200">
          <List size={16} className="text-emerald-600" />
          <h4 className="text-xs sm:text-sm font-black text-slate-900">فهرست مطالب این مقاله (سئو پیلار)</h4>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {tableOfContents.map((item, idx) => (
            <a
              key={`toc-${idx}`}
              href={`#${item.id}`}
              onClick={(e) => {
                e.preventDefault();
                const el = document.getElementById(item.id);
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className={`text-xs font-bold text-slate-700 hover:text-emerald-700 transition-colors flex items-center gap-1.5 p-1.5 rounded-lg hover:bg-emerald-50/80 ${item.level === 3 ? 'mr-3 text-[11px] text-slate-600' : ''}`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0" />
              <span className="truncate">{item.text}</span>
            </a>
          ))}
        </div>
      </div>
    );
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
              <span className="inline-flex items-center gap-1 bg-emerald-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full border border-emerald-200">
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
              {/* Pillar Page & SEO Badge */}
              <div className="flex flex-wrap items-center gap-2">
                {isPillar ? (
                  <span className="bg-emerald-600 text-white text-[10px] font-black px-3 py-1 rounded-xl shadow-xs flex items-center gap-1">
                    <Compass size={12} className="text-emerald-200" />
                    📌 مقاله مادر (Pillar Page) | استراتژی جامع سئو
                  </span>
                ) : (
                  <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-extrabold px-2.5 py-0.5 rounded-lg flex items-center gap-1">
                    <Target size={11} className="text-emerald-600" />
                    مقاله خوشه‌ای (Cluster Content)
                  </span>
                )}

                {article.focusKeyword && (
                  <span className="bg-amber-50 text-amber-900 border border-amber-200 text-[10px] font-black px-2.5 py-0.5 rounded-lg flex items-center gap-1">
                    🎯 کلیدواژه اصلی: {article.focusKeyword}
                  </span>
                )}

                {processedArticle.linksCount > 0 && (
                  <span className="bg-teal-50 text-teal-900 border border-teal-300 text-[10px] font-black px-2.5 py-0.5 rounded-lg flex items-center gap-1 shadow-2xs">
                    <Link2 size={11} className="text-teal-600" />
                    🔗 لینک‌دهی سئو داخلی: {processedArticle.linksCount.toLocaleString('fa-IR')} کلمه محصول
                  </span>
                )}
              </div>

              <h1 className="text-lg sm:text-2xl font-black text-slate-900 leading-snug tracking-tight">
                {article.title}
              </h1>

              {article.summary && (
                <div className="p-4 bg-emerald-50/80 border-r-4 border-emerald-600 rounded-2xl text-xs sm:text-sm font-bold text-slate-900 leading-relaxed shadow-2xs">
                  {article.summary}
                </div>
              )}

              {/* Table of Contents */}
              {renderTocBox('top-toc-box')}
            </div>

            {/* Article Markdown Body */}
            <div className="prose prose-slate max-w-none text-right">
              {renderFormattedContent(processedArticle.updatedContent || article.content)}
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
                  {linkedProductItems.map((prod, pIdx) => (
                    <div
                      key={`linked-p-${prod.id || pIdx}-${pIdx}`}
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
                  <Building2 size={18} className="text-emerald-600" />
                  <h4 className="text-xs sm:text-sm font-black text-slate-900">کارخانجات همکار مرتبط</h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {linkedFactoryItems.map((fac: any, fIdx: number) => (
                    <div
                      key={`linked-fac-${fac.id || fIdx}-${fIdx}`}
                      onClick={() => handleFactoryClick(fac.id)}
                      className="bg-white rounded-2xl p-3 border border-slate-200 hover:border-emerald-500 transition-all flex items-center justify-between cursor-pointer group shadow-2xs"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-amber-700 font-black text-sm shrink-0 border border-emerald-200/60">
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
                      <ArrowLeft size={14} className="text-slate-400 group-hover:text-emerald-600 transition-colors" />
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
