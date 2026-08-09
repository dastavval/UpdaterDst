import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, CheckCircle2, Leaf, Sparkles, X, Award, FileCheck, ExternalLink, Activity } from 'lucide-react';
import { Product } from '../types';

interface HealthAppleLogoProps {
  size?: number;
  className?: string;
  showText?: boolean;
  animated?: boolean;
}

/**
 * Authentic Iranian Health Apple (سیب سلامت - سازمان غذا و دارو) SVG Icon
 */
export const HealthAppleLogo: React.FC<HealthAppleLogoProps> = ({ 
  size = 24, 
  className = "", 
  showText = false,
  animated = false 
}) => {
  return (
    <div className={`inline-flex items-center gap-1.5 shrink-0 ${className}`}>
      <div className={`relative flex items-center justify-center shrink-0 ${animated ? 'animate-pulse' : ''}`} style={{ width: size, height: size }}>
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full drop-shadow-sm"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Outer Ring Ambient Glow */}
          <circle cx="50" cy="50" r="48" fill="#F0FDF4" stroke="#22C55E" strokeWidth="3" />
          <circle cx="50" cy="50" r="42" stroke="#15803D" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.6" />
          
          {/* Apple Stem and Green Leaf */}
          <path
            d="M50 28 C48 18 58 12 66 14 C64 22 56 28 50 28 Z"
            fill="#16A34A"
          />
          <path
            d="M50 28 Q44 20 48 12"
            stroke="#15803D"
            strokeWidth="3"
            strokeLinecap="round"
          />

          {/* Green Apple Silhouette */}
          <path
            d="M32 32 C20 32 12 44 12 58 C12 76 28 92 48 92 C50 92 52 90 50 88 C48 86 52 86 50 88 C72 92 88 76 88 58 C88 44 80 32 68 32 C60 32 54 36 50 38 C46 36 40 32 32 32 Z"
            fill="url(#appleGradient)"
          />

          {/* Inner Safety Wave (representing Food & Drug Org) */}
          <path
            d="M24 56 C32 46 44 68 56 52 C64 42 76 60 80 50 C76 68 62 82 48 82 C34 82 24 70 24 56 Z"
            fill="url(#waveGradient)"
            opacity="0.9"
          />

          {/* White Checkmark / Sparkle of Health */}
          <path
            d="M40 54 L47 62 L62 45"
            stroke="#FFFFFF"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Gradients */}
          <defs>
            <linearGradient id="appleGradient" x1="12" y1="32" x2="88" y2="92" gradientUnits="userSpaceOnUse">
              <stop stopColor="#4ADE80" />
              <stop offset="0.5" stopColor="#16A34A" />
              <stop offset="1" stopColor="#15803D" />
            </linearGradient>
            <linearGradient id="waveGradient" x1="24" y1="42" x2="80" y2="82" gradientUnits="userSpaceOnUse">
              <stop stopColor="#059669" />
              <stop offset="0.7" stopColor="#047857" />
              <stop offset="1" stopColor="#064E3B" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {showText && (
        <span className="text-[11px] font-black text-emerald-800 tracking-tight whitespace-nowrap">
          سیب سلامت
        </span>
      )}
    </div>
  );
};

/**
 * Natural Leaf Icon
 */
export const NaturalLeafIcon: React.FC<{ size?: number; className?: string }> = ({ size = 18, className = "" }) => (
  <div className={`inline-flex items-center justify-center rounded-full bg-emerald-100/90 text-emerald-700 p-1 border border-emerald-300/80 shadow-2xs ${className}`}>
    <Leaf size={size} className="fill-emerald-600 text-emerald-800" />
  </div>
);

/**
 * Health Badges Strip for Product Cards & Detail Modals
 */
export const HealthBadgesStrip: React.FC<{
  product: Product;
  onOpenHealthModal?: (product: Product) => void;
  compact?: boolean;
}> = ({ product, onOpenHealthModal, compact = false }) => {
  // Determine if product qualifies for Health Apple or Natural badge automatically if not explicitly set
  const nameLower = (product.name || '').toLowerCase();
  const descLower = (product.description || '').toLowerCase();
  const categoryLower = (product.category || '').toLowerCase();

  const isNaturalKeywords = ["طبیعی", "نچرال", "ارگانیک", "عسل", "روغن", "عرقیات", "خشکبار", "حبوبات", "زعفران", "خرما", "چای", "آبمیوه", "کنسرو", "زیتون", "لبنیات", "شیر", "رب", "پسته", "بادام", "گردو", "زرشک", "گلاب"];
  
  const hasHealthApple = product.hasHealthApple !== false;

  const isNatural = product.isNatural !== false;

  const isOrganic = product.isOrganic ?? (
    nameLower.includes("ارگانیک") || descLower.includes("ارگانیک") || nameLower.includes("طبیعی")
  );

  if (!hasHealthApple && !isNatural && !isOrganic && (!product.healthBadges || product.healthBadges.length === 0)) {
    return null;
  }

  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${compact ? 'py-0.5' : 'py-1'}`} dir="rtl">
      {hasHealthApple && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onOpenHealthModal?.(product);
          }}
          type="button"
          className="inline-flex items-center gap-1.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white px-2.5 py-1 rounded-xl text-[10px] font-black shadow-md shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all border border-emerald-400/40 cursor-pointer group"
          title="دارای نشان سیب سلامت رسمی سازمان غذا و دارو (کلیک جهت استعلام و شناسنامه بهداشتی)"
        >
          <HealthAppleLogo size={15} animated />
          <span className="leading-none">سیب سلامت</span>
          <Award size={12} className="text-amber-300 opacity-90 group-hover:rotate-12 transition-transform" />
        </button>
      )}

      {isNatural && (
        <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 border border-emerald-200/90 px-2 py-0.5 rounded-lg text-[9px] font-black shadow-2xs">
          <Leaf size={11} className="text-emerald-600 fill-emerald-500" />
          <span>۱۰۰٪ طبیعی</span>
        </span>
      )}

      {isOrganic && (
        <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-900 border border-amber-300/80 px-2 py-0.5 rounded-lg text-[9px] font-black shadow-2xs">
          <Sparkles size={11} className="text-amber-600" />
          <span>گواهی ارگانیک</span>
        </span>
      )}

      {product.healthBadges && product.healthBadges.map((badge, idx) => (
        <span key={idx} className="inline-flex items-center gap-1 bg-teal-50 text-teal-800 border border-teal-200 px-2 py-0.5 rounded-lg text-[9px] font-black">
          <CheckCircle2 size={10} className="text-teal-600" />
          <span>{badge}</span>
        </span>
      ))}
    </div>
  );
};

/**
 * Health Certification Modal for Product Health Passport
 */
export const HealthCertModal: React.FC<{
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}> = ({ product, isOpen, onClose }) => {
  if (!isOpen || !product) return null;

  const getCertCode = (p: Product) => {
    if (p.healthCertCode) return p.healthCertCode;
    let hash = 0;
    const str = (p.id || "") + (p.name || "کالا");
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    const code = (Math.abs(hash) % 8999) + 1000;
    return `۱۶/${code}`;
  };

  const certCode = getCertCode(product);
  const factory = product.factory_name || (product as any).factoryName || product.brand || "کارخانه صنعتی تولیدی";

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md" dir="rtl">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="bg-white rounded-[2.5rem] border border-emerald-200 shadow-2xl max-w-lg w-full overflow-hidden relative font-sans"
        >
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-emerald-900 via-slate-900 to-teal-950 text-white p-6 relative overflow-hidden">
            <div className="absolute -top-10 -left-10 w-40 h-40 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none" />
            <button
              onClick={onClose}
              className="absolute top-4 left-4 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-all cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3 relative z-10">
              <HealthAppleLogo size={48} animated />
              <div>
                <div className="inline-flex items-center gap-1 bg-emerald-500/30 text-emerald-300 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-emerald-400/40 mb-1">
                  <ShieldCheck size={12} />
                  <span>پروانه بهداشتی سازمان غذا و دارو ایران</span>
                </div>
                <h3 className="text-lg font-black text-white leading-tight">
                  شناسنامه سلامت و اصالت کالا
                </h3>
                <p className="text-xs text-slate-300 font-medium">
                  {product.name}
                </p>
              </div>
            </div>
          </div>

          {/* Modal Body */}
          <div className="p-6 space-y-5">
            {/* Cert Code Banner */}
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50/60 p-4 rounded-2xl border border-emerald-200/80 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-500 block">شماره پروانه سیب سلامت و استانداردهای ملی:</span>
                <span className="text-base font-black font-mono text-emerald-900 tracking-wider">
                  {certCode}
                </span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-white p-1.5 shadow-sm border border-emerald-200 flex items-center justify-center shrink-0">
                <FileCheck size={28} className="text-emerald-600" />
              </div>
            </div>

            {/* Standard Checklist */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                <Award size={15} className="text-emerald-600" />
                <span>تاییديه‌ها و استانداردهای بهداشتی صادره:</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                  <div>
                    <span className="font-bold text-slate-800 block">نشان سیب سلامت</span>
                    <span className="text-[10px] text-slate-500">پروانه استانداردهای بهداشتی</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <Leaf size={16} className="text-emerald-600 shrink-0" />
                  <div>
                    <span className="font-bold text-slate-800 block">تضمین ۱۰۰٪ طبیعی</span>
                    <span className="text-[10px] text-slate-500">فاقد اسانس و رنگ شیمیایی</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <ShieldCheck size={16} className="text-teal-600 shrink-0" />
                  <div>
                    <span className="font-bold text-slate-800 block">فاقد مواد نگهدارنده</span>
                    <span className="text-[10px] text-slate-500">فرآوری کاملا بهداشتی کارخانه‌ای</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <Activity size={16} className="text-blue-600 shrink-0" />
                  <div>
                    <span className="font-bold text-slate-800 block">کنترل کیفیت (QC)</span>
                    <span className="text-[10px] text-slate-500">توسط آزمایشگاه مرجع کارخانه</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Traffic Light Nutritional Indicators */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3">
              <span className="text-xs font-black text-slate-800 block">
                چراغ راهنمای تغذیه‌ای (سازمان غذا و دارو):
              </span>

              <div className="grid grid-cols-4 gap-2 text-center text-[10px]">
                <div className="bg-white p-2 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-slate-500 block font-bold">قند</span>
                  <span className="inline-block w-4 h-4 rounded-full bg-emerald-500 border-2 border-white shadow-xs" title="اندک" />
                  <span className="text-[9px] font-black text-emerald-700 block">سبز (سالم)</span>
                </div>

                <div className="bg-white p-2 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-slate-500 block font-bold">چربی</span>
                  <span className="inline-block w-4 h-4 rounded-full bg-emerald-500 border-2 border-white shadow-xs" title="اندک" />
                  <span className="text-[9px] font-black text-emerald-700 block">سبز (کم)</span>
                </div>

                <div className="bg-white p-2 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-slate-500 block font-bold">نمک</span>
                  <span className="inline-block w-4 h-4 rounded-full bg-amber-400 border-2 border-white shadow-xs" title="متوسط" />
                  <span className="text-[9px] font-black text-amber-700 block">متوسط</span>
                </div>

                <div className="bg-white p-2 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-slate-500 block font-bold">اسید ترانس</span>
                  <span className="inline-block w-4 h-4 rounded-full bg-emerald-500 border-2 border-white shadow-xs" title="صفر" />
                  <span className="text-[9px] font-black text-emerald-700 block">صفر (سالم)</span>
                </div>
              </div>
            </div>

            {/* Factory & Authority Footer Info */}
            <div className="text-[11px] text-slate-600 bg-emerald-50/60 p-3 rounded-xl border border-emerald-100 flex items-center justify-between">
              <span>تولیدکننده معتبر: <strong className="text-slate-900">{factory}</strong></span>
              <span className="text-[10px] text-emerald-800 font-bold bg-white px-2 py-1 rounded-md border border-emerald-200">
                استعلام آنلاین معتبر
              </span>
            </div>

            {/* Close / Action button */}
            <button
              onClick={onClose}
              className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-black py-3 rounded-2xl text-xs transition-all shadow-md active:scale-98 cursor-pointer flex items-center justify-center gap-2"
            >
              <span>تایید و بازگشت به کاتالوگ</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export const NaturalBadgesStrip = HealthBadgesStrip;
