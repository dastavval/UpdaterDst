import React, { useState, useEffect, useMemo } from 'react';
import { 
  ArrowLeft, Calendar, User, Clock, Share2, Copy, Check, List, 
  ShoppingBag, Building2, ArrowUpRight, Quote, ChevronLeft, ShieldCheck, Bookmark, Eye, Layers
} from "lucide-react";
import { motion } from "motion/react";
import { autoInjectProductShortcodes } from "../utils/autoLinker";
import { Product } from "../types";

interface ArticlePageViewProps {
  articleId: string;
  articles: any[];
  b2bConfig: any;
  products: Product[];
  onClose: () => void;
  onOpenProduct?: (product: Product) => void;
  onOpenFactory?: (factoryId: string) => void;
  onSwitchTab?: (tab: string) => void;
}

export const ArticlePageView: React.FC<ArticlePageViewProps> = ({
  articleId,
  articles,
  b2bConfig,
  products,
  onClose,
  onOpenProduct,
  onOpenFactory,
  onSwitchTab
}) => {
  const [copied, setCopied] = useState(false);
  const [favorite, setFavorite] = useState(false);

  // Retrieve the article
  const article = useMemo(() => {
    return articles.find(a => String(a.id) === String(articleId) || String(a.slug) === String(articleId));
  }, [articleId, articles]);

  useEffect(() => {
    if (!article) return;

    // Scroll to top when loading a new article
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Try updating page title/SEO dynamically
    try {
      document.title = `${article.metaTitle || article.title} | مجله تخصصی دست اول`;
    } catch (e) {}
  }, [article]);

  const isPillar = useMemo(() => {
    if (!article) return false;
    return article.articleType === 'pillar' || article.category?.includes('پیلار') || article.category?.includes('جامع');
  }, [article]);

  // Extract Table of Contents headings
  const tableOfContents = useMemo(() => {
    if (!article || !article.content) return [];
    const lines = article.content.split('\n');
    const headings: Array<{ id: string; text: string; level: number }> = [];
    lines.forEach((line: string, idx: number) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('## ')) {
        headings.push({ id: `heading-pv-${idx}`, text: trimmed.replace(/^##\s*/, ''), level: 2 });
      } else if (trimmed.startsWith('### ')) {
        headings.push({ id: `heading-pv-${idx}`, text: trimmed.replace(/^###\s*/, ''), level: 3 });
      }
    });
    return headings;
  }, [article]);

  // Automatically detect and link products
  const processedArticle = useMemo(() => {
    if (!article || !article.content) {
      return { updatedContent: '', linksCount: 0, linkedProducts: [] };
    }
    return autoInjectProductShortcodes(article.content, products || [], 2);
  }, [article, products]);

  // Combined linked products
  const linkedProductItems = useMemo(() => {
    if (!article) return [];
    const explicitIds = article.linkedProducts || [];
    const autoLinkedIds = (processedArticle.linkedProducts || []).map((p: any) => String(p.id));
    const combinedIds = Array.from(new Set([...explicitIds, ...autoLinkedIds]));

    return combinedIds
      .map(id => products.find(p => String(p.id) === String(id) || (p as any).productCode === id))
      .filter(Boolean) as Product[];
  }, [article, processedArticle.linkedProducts, products]);

  // Combined linked factories
  const linkedFactoryItems = useMemo(() => {
    if (!article) return [];
    const factories = b2bConfig?.factories || [];
    return (article.linkedFactories || [])
      .map((id: any) => factories.find((f: any) => String(f.id) === String(id) || f.factoryCode === id))
      .filter(Boolean);
  }, [article, b2bConfig?.factories]);

  if (!article) {
    return (
      <div className="p-12 text-center bg-white rounded-3xl border border-slate-100 max-w-2xl mx-auto my-12" dir="rtl">
        <p className="text-sm font-black text-slate-800">مقاله مورد نظر یافت نشد یا ممکن است هنوز تایید نشده باشد.</p>
        <button 
          onClick={onClose}
          className="mt-6 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
        >
          بازگشت به مجله
        </button>
      </div>
    );
  }

  const handleCopyLink = () => {
    const directUrl = `${window.location.origin}/?article=${article.id || article.slug || 'view'}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(directUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
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

  const renderInlineTokens = (text: string) => {
    if (!text) return null;

    const tokenRegex = /\[\[([\s\S]*?)\]\]/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = tokenRegex.exec(text)) !== null) {
      const matchIndex = match.index;
      if (matchIndex > lastIndex) {
        parts.push(text.substring(lastIndex, matchIndex));
      }

      const rawInner = match[1].trim();
      
      if (rawInner === 'toc') {
        parts.push(renderTocBox(`inline-toc-${matchIndex}`));
        lastIndex = tokenRegex.lastIndex;
        continue;
      }

      const colonIdx = rawInner.indexOf(':');
      let type = rawInner.toLowerCase();
      let rest = '';

      if (colonIdx !== -1) {
        type = rawInner.substring(0, colonIdx).trim().toLowerCase();
        rest = rawInner.substring(colonIdx + 1).trim();
      }

      const pipeIdx = rest.indexOf('|');
      let id = rest;
      let label = rest;

      if (pipeIdx !== -1) {
        id = rest.substring(0, pipeIdx).trim();
        label = rest.substring(pipeIdx + 1).trim();
      }

      if (!label) label = id;

      if (type === 'product') {
        const prod = products.find(p => String(p.id) === String(id) || (p as any).productCode === id || p.name === label);
        const priceDisplay = prod?.bulk_price || prod?.price 
          ? `${(prod.bulk_price || prod.price).toLocaleString('fa-IR')} تومان`
          : null;

        parts.push(
          <button
            key={`inline-prod-pv-${matchIndex}-${id}`}
            type="button"
            onClick={() => handleProductClick(prod?.id || id)}
            className="inline-flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-black border border-emerald-500 px-3 py-1 rounded-xl text-xs mx-1 my-0.5 transition-all cursor-pointer shadow-xs group active:scale-95"
          >
            <ShoppingBag size={13} className="text-emerald-200 group-hover:scale-110 transition-transform" />
            <span>{label || prod?.name || "مشاهده محصول"}</span>
            {priceDisplay && (
              <span className="bg-emerald-950/40 text-emerald-200 text-[10px] px-1.5 py-0.5 rounded-lg font-extrabold mr-1">
                {priceDisplay}
              </span>
            )}
            <ArrowUpRight size={12} className="text-emerald-300" />
          </button>
        );
      } else if (type === 'factory') {
        parts.push(
          <button
            key={`inline-fac-pv-${matchIndex}-${id}`}
            type="button"
            onClick={() => handleFactoryClick(id)}
            className="inline-flex items-center gap-1.5 bg-teal-50 hover:bg-teal-100 text-teal-900 border border-teal-300 px-3 py-1 rounded-xl text-xs font-black mx-1 my-0.5 transition-colors cursor-pointer shadow-2xs group active:scale-95"
          >
            <Building2 size={13} className="text-teal-700 group-hover:scale-110 transition-transform" />
            <span>{label || "کارخانه همکار"}</span>
            <ArrowUpRight size={12} className="text-teal-700" />
          </button>
        );
      } else if (type === 'billboard') {
        parts.push(
          <button
            key={`inline-bb-pv-${matchIndex}`}
            type="button"
            onClick={() => onSwitchTab && onSwitchTab('billboard')}
            className="inline-flex items-center gap-1.5 bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-300 px-3 py-1 rounded-xl text-xs font-black mx-1 my-0.5 transition-colors cursor-pointer shadow-2xs active:scale-95"
          >
            <Layers size={13} className="text-purple-700" />
            <span>{label || "تالار کف بازار"}</span>
          </button>
        );
      } else if (type === 'cta') {
        parts.push(
          <button
            key={`inline-cta-pv-${matchIndex}`}
            type="button"
            onClick={() => onSwitchTab && onSwitchTab('order')}
            className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black px-3.5 py-1.5 rounded-xl text-xs mx-1 my-1 transition-all cursor-pointer shadow-md shadow-emerald-600/20 active:scale-95"
          >
            <ShoppingBag size={14} />
            <span>{label || "ثبت سفارش آنلاین"}</span>
          </button>
        );
      } else if (type === 'quote') {
        parts.push(
          <span key={`inline-quote-pv-${matchIndex}`} className="block my-3 p-3.5 bg-amber-50/90 border-r-4 border-amber-500 rounded-2xl text-xs font-bold text-amber-950 shadow-2xs">
            <Quote size={15} className="text-amber-600 inline ml-1.5" />
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

  const renderTocBox = (keyStr: string) => {
    if (tableOfContents.length === 0) return null;
    return (
      <div key={keyStr} className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 my-6 shadow-2xs">
        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-200">
          <List size={15} className="text-emerald-600" />
          <h4 className="text-xs font-black text-slate-950">فهرست موضوعی راهنمای جامع (پیلار)</h4>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {tableOfContents.map((item, idx) => (
            <a
              key={`toc-pv-${idx}`}
              href={`#${item.id}`}
              onClick={(e) => {
                e.preventDefault();
                const el = document.getElementById(item.id);
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className={`text-xs font-bold text-slate-700 hover:text-emerald-700 transition-colors flex items-center gap-1.5 p-1 rounded-lg hover:bg-emerald-50/80 ${item.level === 3 ? 'mr-3 text-[11px] text-slate-600' : ''}`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0" />
              <span className="truncate">{item.text}</span>
            </a>
          ))}
        </div>
      </div>
    );
  };

  const renderFormattedContent = (content: string) => {
    if (!content) return null;
    const paragraphs = content.split('\n\n');

    return paragraphs.map((block, pIdx) => {
      const trimmed = block.trim();
      if (!trimmed) return null;

      if (trimmed === '[[toc]]') {
        return renderTocBox(`toc-inline-pv-${pIdx}`);
      }

      if (trimmed.startsWith('### ')) {
        return (
          <h3 key={`h3-pv-${pIdx}`} id={`heading-pv-${pIdx}`} className="text-sm sm:text-base font-black text-slate-900 mt-6 mb-3 flex items-center gap-2 border-r-4 border-emerald-600 pr-3 scroll-mt-24">
            {trimmed.replace(/^###\s*/, '')}
          </h3>
        );
      }

      if (trimmed.startsWith('## ')) {
        return (
          <h2 key={`h2-pv-${pIdx}`} id={`heading-pv-${pIdx}`} className="text-base sm:text-lg font-black text-slate-900 mt-8 mb-4 border-b border-slate-200 pb-2 scroll-mt-24 flex items-center justify-between">
            <span>{trimmed.replace(/^##\s*/, '')}</span>
            <span className="text-[9px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">بخش اصلی</span>
          </h2>
        );
      }

      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        const items = trimmed.split('\n');
        return (
          <ul key={`ul-pv-${pIdx}`} className="space-y-2 my-4 pr-4 list-disc marker:text-emerald-600 text-xs sm:text-sm font-semibold text-slate-700 leading-relaxed">
            {items.map((it, itIdx) => (
              <li key={`li-pv-${pIdx}-${itIdx}`}>
                {renderInlineTokens(it.replace(/^[-*]\s*/, ''))}
              </li>
            ))}
          </ul>
        );
      }

      if (/^\d+\.\s/.test(trimmed)) {
        const items = trimmed.split('\n');
        return (
          <ol key={`ol-pv-${pIdx}`} className="space-y-2 my-4 pr-5 list-decimal marker:text-emerald-700 marker:font-black text-xs sm:text-sm font-semibold text-slate-700 leading-relaxed">
            {items.map((it, itIdx) => (
              <li key={`oli-pv-${pIdx}-${itIdx}`}>
                {renderInlineTokens(it.replace(/^\d+\.\s*/, ''))}
              </li>
            ))}
          </ol>
        );
      }

      return (
        <p key={`p-pv-${pIdx}`} className="text-xs sm:text-sm font-medium text-slate-700 leading-loose mb-4 text-justify">
          {renderInlineTokens(trimmed)}
        </p>
      );
    });
  };

  return (
    <div className="w-full max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-6" dir="rtl">
      {/* Top Breadcrumb & Actions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white/80 backdrop-blur-md p-4 rounded-3xl border border-slate-100 shadow-xs">
        <div className="flex items-center gap-2 text-xs">
          <button 
            onClick={onClose}
            className="flex items-center gap-1 px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold rounded-xl transition-colors cursor-pointer"
          >
            <ArrowLeft size={14} className="rotate-180" />
            <span>بازگشت به مجله</span>
          </button>
          <span className="text-slate-300">/</span>
          <span className="text-slate-400 font-semibold">مقالات و گزارشات</span>
          <span className="text-slate-300">/</span>
          <span className="text-slate-600 font-black">{article.category}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setFavorite(!favorite)}
            className={`p-2.5 rounded-xl border transition-all cursor-pointer ${favorite ? 'bg-amber-50 border-amber-300 text-amber-600' : 'bg-slate-50 border-slate-200 text-slate-400 hover:text-slate-600'}`}
            title="نشان کردن این مطلب"
          >
            <Bookmark size={15} className={favorite ? "fill-amber-500" : ""} />
          </button>
          <button
            onClick={handleCopyLink}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
          >
            {copied ? <Check size={14} /> : <Share2 size={14} />}
            <span>{copied ? "لینک کپی شد" : "کپی لینک اختصاصی"}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Right Sticky Sidebar (TOC & Author) */}
        <div className="lg:col-span-1 space-y-6 lg:sticky lg:top-24">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-material-md space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <div className="p-2 bg-slate-50 rounded-xl">
                <User size={16} className="text-slate-500" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold">منتشرکننده خبر:</p>
                <p className="text-xs font-black text-slate-900">{article.source || "تحریریه دست اول"}</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <div className="p-2 bg-slate-50 rounded-xl">
                <Calendar size={16} className="text-slate-500" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold">تاریخ نگارش:</p>
                <p className="text-xs font-black text-slate-900">{article.date || "شهریور ۱۴۰۲"}</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-slate-50 rounded-xl">
                <Clock size={16} className="text-slate-500" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold">زمان مطالعه تقریبی:</p>
                <p className="text-xs font-black text-slate-900">{article.readTime || "۵ دقیقه"}</p>
              </div>
            </div>

            {article.isAiGenerated && (
              <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-2xl flex items-center gap-2 mt-4">
                <ShieldCheck size={16} className="text-indigo-600 shrink-0" />
                <div>
                  <p className="text-[9px] font-black text-indigo-950">نگارش تأیید شده با GapGPT</p>
                  <p className="text-[8px] text-indigo-600 font-bold mt-0.5">راستی‌آزمایی بر اساس کاتالوگ قیمت دست اول</p>
                </div>
              </div>
            )}
          </div>

          {/* Quick Table of Contents Sticky */}
          {tableOfContents.length > 0 && (
            <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-material-md">
              <p className="text-xs font-black text-slate-900 mb-3 flex items-center gap-2">
                <List size={14} className="text-emerald-600" />
                <span>فهرست موضوعی</span>
              </p>
              <div className="space-y-1.5 max-h-60 overflow-y-auto custom-scrollbar">
                {tableOfContents.map((h, idx) => (
                  <a
                    key={`toc-side-${idx}`}
                    href={`#${h.id}`}
                    onClick={(e) => {
                      e.preventDefault();
                      const el = document.getElementById(h.id);
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className={`block text-[11px] font-bold text-slate-600 hover:text-emerald-700 transition-colors py-1 ${h.level === 3 ? 'pr-3 border-r border-slate-150' : 'font-extrabold'}`}
                  >
                    {h.text}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Central Article Column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-[2rem] border border-slate-100 p-6 sm:p-8 shadow-material-md space-y-6">
            {/* Banner Meta Category */}
            <div className="flex items-center gap-2">
              <span className="px-3.5 py-1 bg-emerald-600 text-white rounded-full text-[10px] font-black">
                {article.category}
              </span>
              {isPillar && (
                <span className="px-2.5 py-1 bg-amber-100 text-amber-900 border border-amber-300 rounded-md text-[10px] font-black">
                  ⭐ پیلار سئو و راهنمای کلیدی
                </span>
              )}
            </div>

            {/* Title */}
            <h1 className="text-lg sm:text-2xl font-black text-slate-950 leading-tight">
              {article.title}
            </h1>

            {/* Cover Image */}
            <div className="w-full h-64 sm:h-80 rounded-2xl overflow-hidden shadow-inner border border-slate-100">
              <img 
                src={article.imageUrl || "https://images.unsplash.com/photo-1504711432869-efd5973e8a48?auto=format&fit=crop&q=80&w=1000"} 
                alt={article.title} 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>

            {/* Summary Block */}
            <div className="p-4 bg-slate-50 rounded-2xl border-r-4 border-slate-300 text-xs sm:text-sm font-semibold text-slate-600 leading-relaxed text-justify">
              <strong>خلاصه مطلب:</strong> {article.summary}
            </div>

            {/* Parsed Rich Text Content */}
            <div className="prose max-w-none text-slate-800 space-y-4">
              {renderFormattedContent(processedArticle.updatedContent || article.content)}
            </div>

            {/* Tags and SEO Footer */}
            {article.tags && article.tags.length > 0 && (
              <div className="pt-6 border-t border-slate-100 space-y-2">
                <p className="text-[10px] font-black text-slate-400">برچسب‌ها و خوشه‌های سئو:</p>
                <div className="flex flex-wrap gap-2">
                  {article.tags.map((tag: string, tIdx: number) => (
                    <span 
                      key={`tag-${tIdx}`} 
                      className="px-3 py-1 bg-slate-50 text-slate-600 rounded-lg text-xs font-bold border border-slate-150"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* FAQs Accordion */}
          {article.faqs && article.faqs.length > 0 && (
            <div className="bg-white rounded-[2rem] border border-slate-100 p-6 shadow-material-md space-y-4">
              <h4 className="text-sm font-black text-slate-950 flex items-center gap-2">
                ❓ سوالات متداول خریداران عمده و بنکداران
              </h4>
              <div className="space-y-3">
                {article.faqs.map((faq: any, fIdx: number) => (
                  <div key={`faq-${fIdx}`} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                    <p className="text-xs font-black text-emerald-800">سوالی دارید؟ {faq.question}</p>
                    <p className="text-[11px] font-semibold text-slate-600 leading-relaxed text-justify">{faq.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Left Sticky Sidebar (Linked Products & CTA) */}
        <div className="lg:col-span-1 space-y-6 lg:sticky lg:top-24">
          <div className="bg-gradient-to-br from-emerald-900 to-teal-950 p-6 rounded-3xl text-white shadow-material-lg space-y-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
            
            <h4 className="text-xs font-black uppercase tracking-wider text-emerald-300">سفارش مستقیم و بی‌واسطه</h4>
            <p className="text-sm font-black leading-snug">کف قیمت روز کارخانجات را در سامانه دست اول استعلام کنید.</p>
            <p className="text-[10px] text-emerald-200/80 leading-relaxed font-semibold">ارسال امن با ضمانت پرداخت امانی، بارنامه رسمی دولتی و تخفیف تناژ ویژه بنکداری‌های کشور.</p>
            
            <button
              onClick={() => onSwitchTab && onSwitchTab('order')}
              className="w-full py-3 bg-white hover:bg-emerald-50 text-emerald-950 font-black rounded-2xl text-xs transition-all shadow-md active:scale-98 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <ShoppingBag size={14} />
              <span>ورود به تالار معاملات</span>
            </button>
          </div>

          {/* Linked Products Card List */}
          {linkedProductItems.length > 0 && (
            <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-material-md space-y-3">
              <p className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                <ShoppingBag size={14} className="text-emerald-600" />
                <span>کالاهای همکار لینک‌شده</span>
              </p>
              
              <div className="space-y-3">
                {linkedProductItems.map((prod, pIdx) => (
                  <div 
                    key={`side-prod-${prod.id}-${pIdx}`}
                    onClick={() => handleProductClick(prod.id)}
                    className="p-3 bg-slate-50 hover:bg-emerald-50/50 rounded-2xl border border-slate-150 transition-all cursor-pointer group flex gap-3"
                  >
                    <div className="w-12 h-12 rounded-xl overflow-hidden border border-slate-100 shrink-0 bg-white">
                      <img src={prod.image_url || prod.imageUrl} alt={prod.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" referrerPolicy="no-referrer" />
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <p className="text-[10px] font-black text-slate-900 truncate group-hover:text-emerald-700 transition-colors">{prod.name}</p>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-[9px] font-black text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                          {prod.bulk_price ? `${prod.bulk_price.toLocaleString('fa-IR')} تومان` : 'نرخ روز'}
                        </span>
                        <ChevronLeft size={12} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Linked Factories Card List */}
          {linkedFactoryItems.length > 0 && (
            <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-material-md space-y-3">
              <p className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                <Building2 size={14} className="text-teal-700" />
                <span>خط تولید مرتبط</span>
              </p>
              
              <div className="space-y-3">
                {linkedFactoryItems.map((fac, fIdx) => (
                  <div 
                    key={`side-fac-${fac.id}-${fIdx}`}
                    onClick={() => handleFactoryClick(fac.id)}
                    className="p-3 bg-slate-50 hover:bg-teal-50/50 rounded-2xl border border-slate-150 transition-all cursor-pointer group flex gap-3"
                  >
                    <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center shrink-0 font-bold">
                      🏭
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <p className="text-[10px] font-black text-slate-900 truncate group-hover:text-teal-700 transition-colors">{fac.name}</p>
                      <p className="text-[8px] text-slate-400 font-extrabold mt-0.5">واقع در شهر: {fac.city || 'ایران'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
