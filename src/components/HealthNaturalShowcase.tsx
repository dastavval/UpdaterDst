import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { HealthAppleLogo } from './HealthAppleBadge';
import { ShieldCheck, Info, Leaf, Award, Sparkles, X, FileCheck, ArrowLeft, Filter, CheckCircle2 } from 'lucide-react';
import { Product } from '../types';

interface HealthNaturalShowcaseProps {
  products: Product[];
  onAddToCart?: (product: Product, quantityCartons: number) => void;
  onViewDetails?: (product: Product) => void;
  onFilterCategory?: (category: string) => void;
}

export const HealthNaturalShowcase: React.FC<HealthNaturalShowcaseProps> = ({
  products,
  onFilterCategory
}) => {
  const [showGuideModal, setShowGuideModal] = useState(false);

  const toPersianNum = (num: number | string) => {
    if (num === undefined || num === null) return "";
    const farsiDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    return num.toString().replace(/\d/g, x => farsiDigits[parseInt(x)]);
  };

  const healthAppleProductsCount = products.filter(p => p.hasHealthApple !== false).length;

  const handleFilterAppleItems = () => {
    if (onFilterCategory) {
      onFilterCategory("سیب سلامت");
    } else {
      window.dispatchEvent(new CustomEvent("search-brand", { detail: { brand: "سیب سلامت" } }));
    }
  };

  return (
    <div className="my-5 font-sans font-medium" dir="rtl">
      {/* GUIDANCE BOX (کادر هدایت سیب سلامت و استانداردهای بهداشتی) */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 text-white p-5 sm:p-7 border border-emerald-500/40 shadow-2xl shadow-emerald-950/20">
        
        {/* Ambient Glow Effects */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20 animate-pulse" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-teal-500/20 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

        <div className="relative z-10 space-y-5">
          
          {/* Header Row */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-emerald-500/20 pb-4">
            
            <div className="flex items-center gap-3.5">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500/30 to-teal-500/40 border border-emerald-400/50 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-950/50 backdrop-blur-md">
                <HealthAppleLogo size={36} animated />
              </div>

              <div>
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-3 py-0.5 rounded-full text-[10px] font-black shadow-sm">
                    کادر هدایت و استعلام بهداشتی 🍏
                  </span>
                  <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 backdrop-blur-md">
                    <ShieldCheck size={12} className="text-emerald-400" />
                    <span>{toPersianNum(healthAppleProductsCount)} کالا با پروانه ساخت فعال</span>
                  </span>
                </div>

                <h3 className="text-base sm:text-lg font-black text-white">
                  درگاه هدایت کالاهای دارای سیب سبز سلامت و پروانه غذا و دارو
                </h3>
              </div>
            </div>

            {/* Badges */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/15 text-[11px] font-bold text-slate-200">
                <Award size={14} className="text-amber-400" />
                <span>پروانه بهداشتی ساخت</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/15 text-[11px] font-bold text-slate-200">
                <Leaf size={14} className="text-emerald-400" />
                <span>ارسال پلمپ کارخانه</span>
              </div>
            </div>

          </div>

          {/* Interactive Guidance Stepper / Actions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-1">
            
            {/* Guidance Step 1: Filter Certified Items */}
            <button
              onClick={handleFilterAppleItems}
              className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-900/80 to-teal-900/60 hover:from-emerald-800 hover:to-teal-800 border border-emerald-400/40 transition-all hover:scale-[1.02] cursor-pointer group text-right flex items-center justify-between gap-3 shadow-md"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-black text-emerald-300">
                  <Filter size={14} className="text-emerald-400" />
                  <span>۱. تفکیک اقلام استاندارد</span>
                </div>
                <p className="text-[11px] text-slate-200 font-bold">
                  فیلتر مستقیم کالاهای دارای سیب سلامت
                </p>
              </div>
              <div className="w-8 h-8 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center shrink-0 group-hover:translate-x-1 transition-transform font-black">
                <ArrowLeft size={16} />
              </div>
            </button>

            {/* Guidance Step 2: Health Lookup Modal */}
            <button
              onClick={() => setShowGuideModal(true)}
              className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-950/60 to-slate-900/80 hover:from-amber-900/80 hover:to-slate-800 border border-amber-400/30 transition-all hover:scale-[1.02] cursor-pointer group text-right flex items-center justify-between gap-3 shadow-md"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-black text-amber-300">
                  <FileCheck size={14} className="text-amber-400" />
                  <span>۲. استعلام پروانه بهداشتی</span>
                </div>
                <p className="text-[11px] text-slate-200 font-bold">
                  راهنما و کد پیامکی استعلام ۱۰۰۰۰۲
                </p>
              </div>
              <div className="w-8 h-8 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform font-black">
                <Info size={16} />
              </div>
            </button>

            {/* Guidance Step 3: Formal Health Guarantee */}
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-teal-500/20 text-teal-300 flex items-center justify-center shrink-0 border border-teal-400/30">
                <CheckCircle2 size={18} />
              </div>
              <div className="text-right">
                <h4 className="text-xs font-black text-white">ضمانت اصالت و سلامت ۱۰۰٪</h4>
                <p className="text-[10px] text-slate-300 font-bold mt-0.5">تحویل بار با پلمپ بهداشتی کارخانه</p>
              </div>
            </div>

          </div>

          {/* FOUNDERS SECTION - BONYANGHOZARAN DASTAVVAL */}
          <div className="mt-5 pt-4 border-t border-emerald-500/20 flex flex-col sm:flex-row items-center justify-between gap-3 bg-white/5 backdrop-blur-md p-3.5 rounded-2xl border border-white/10">
            <div className="flex items-center gap-2 shrink-0">
              <Sparkles size={16} className="text-amber-400" />
              <span className="text-xs font-black text-amber-300">بنیان‌گذاران هلدینگ دست اول:</span>
            </div>
            
            <div className="flex items-center gap-3 sm:gap-6 flex-wrap justify-center">
              {/* Founder 1 */}
              <div className="flex items-center gap-2.5 bg-emerald-900/70 border border-emerald-400/30 px-3.5 py-1.5 rounded-xl shadow-sm">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-amber-400 to-amber-500 text-slate-950 font-black text-[11px] flex items-center justify-center shadow-xs shrink-0">
                  ع
                </div>
                <div className="text-right">
                  <h4 className="text-xs font-black text-white">علی پرتوی زیناب</h4>
                  <p className="text-[9px] font-bold text-emerald-300">بنیان‌گذار هلدینگ دست اول</p>
                </div>
              </div>

              {/* Founder 2 */}
              <div className="flex items-center gap-2.5 bg-teal-900/70 border border-teal-400/30 px-3.5 py-1.5 rounded-xl shadow-sm">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-teal-300 to-emerald-400 text-slate-950 font-black text-[11px] flex items-center justify-center shadow-xs shrink-0">
                  ز
                </div>
                <div className="text-right">
                  <h4 className="text-xs font-black text-white">زهرا بهبودی</h4>
                  <p className="text-[9px] font-bold text-teal-300">هم‌بنیان‌گذار دست اول</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* COMPACT IRANIAN HEALTH APPLE OFFICIAL GUIDE MODAL */}
      <AnimatePresence>
        {showGuideModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-400/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-5 text-right relative overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center">
                    <HealthAppleLogo size={24} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">راهنمای جامع استعلام سیب سلامت</h3>
                    <p className="text-[10px] font-bold text-slate-400">سازمان غذا و دارو جمهوری اسلامی ایران</p>
                  </div>
                </div>

                <button
                  onClick={() => setShowGuideModal(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Guide Content */}
              <div className="space-y-3.5 text-xs leading-relaxed text-slate-600 font-bold">
                <div className="bg-emerald-50/80 p-3.5 rounded-2xl border border-emerald-100 space-y-1">
                  <div className="flex items-center gap-2 text-emerald-800 font-black text-xs">
                    <ShieldCheck size={16} className="text-emerald-600" />
                    <span>نشان سیب سلامت چیست؟</span>
                  </div>
                  <p className="text-[11px] text-emerald-900/80 leading-normal">
                    نشان سیب سلامت گواهی رسمی سازمان غذا و دارو است که تایید می‌کند فرآورده خوراکی و آشامیدنی از کلیه ضوابط بهداشتی و استانداردهای کیفی تولید برخوردار است.
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                    <FileCheck size={14} className="text-emerald-600" />
                    روش‌های استعلام پروانه ساخت بهداشتی:
                  </h4>
                  <ul className="space-y-1.5 text-[11px] text-slate-600 list-disc list-inside bg-slate-50 p-3 rounded-2xl border border-slate-100">
                    <li>مشاهده شماره پروانه بهداشتی ساخت (مثال: ۱۶/۱۲۳۴) درج شده روی بسته بندی.</li>
                    <li>استعلام پیامکی کد پروانه ساخت به شماره سامانه رسمی <strong>۱۰۰۰۰۲</strong>.</li>
                    <li>امکان صدور فاکتور و مدارک سیب سلامت جهت ثبت سفارشات عمده سازمان‌ها و بنکداران.</li>
                  </ul>
                </div>

                <div className="bg-amber-50 p-3 rounded-2xl border border-amber-200/60 text-amber-900 text-[11px] flex items-start gap-2">
                  <Sparkles size={16} className="text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    تمامی محصولات درج شده در این سامانه با ضمانت اصالت پروانه ساخت و پلمپ اولیه کارخانه عرضه می‌گردند.
                  </span>
                </div>
              </div>

              {/* Modal Action Buttons */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={() => {
                    setShowGuideModal(false);
                    handleFilterAppleItems();
                  }}
                  className="flex-1 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span>مشاهده کالاهای دارای سیب سلامت</span>
                  <ArrowLeft size={14} />
                </button>
                <button
                  onClick={() => setShowGuideModal(false)}
                  className="px-4 py-2.5 rounded-2xl bg-slate-100 text-slate-700 text-xs font-black hover:bg-slate-200 transition-colors cursor-pointer"
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
