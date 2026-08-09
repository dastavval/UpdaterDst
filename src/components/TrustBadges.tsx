import React from "react";
import { ShieldCheck, Award, CheckCircle2, ExternalLink } from "lucide-react";

interface TrustBadgesProps {
  b2bConfig?: {
    enamadImage?: string;
    enamadCode?: string;
    enamadUrl?: string;
    samandehiImage?: string;
    samandehiCode?: string;
    samandehiUrl?: string;
    tradeUnionCode?: string;
    tradeUnionUrl?: string;
  };
  className?: string;
  badgeSize?: 'sm' | 'md' | 'lg';
}

export default function TrustBadges({ b2bConfig, className = "", badgeSize = 'md' }: TrustBadgesProps) {
  const enamadImage = b2bConfig?.enamadImage?.trim();
  const enamadCode = b2bConfig?.enamadCode?.trim();
  const enamadUrl = b2bConfig?.enamadUrl?.trim() || "https://trustseal.enamad.ir";
  
  const samandehiImage = b2bConfig?.samandehiImage?.trim();
  const samandehiCode = b2bConfig?.samandehiCode?.trim();
  const samandehiUrl = b2bConfig?.samandehiUrl?.trim() || "https://logo.samandehi.ir";
  
  const tradeUnionCode = b2bConfig?.tradeUnionCode?.trim() || "IR-9044502";
  const tradeUnionUrl = b2bConfig?.tradeUnionUrl?.trim() || "https://dastavval.com/license";

  return (
    <div className={`flex flex-wrap items-center justify-center md:justify-end gap-3 ${className}`} dir="rtl">
      {/* 1. E-namad (ای‌نماد) - Only render if explicitly configured */}
      {enamadImage ? (
        <a
          href={enamadUrl}
          target="_blank"
          rel="noopener noreferrer"
          title="مشاهده تاییدیه رسمی نماد اعتماد الکترونیکی (ای‌نماد)"
          className="group bg-white border border-emerald-200 p-2 rounded-2xl flex flex-col items-center justify-center w-24 h-28 transition-all shadow-xs hover:shadow-md cursor-pointer overflow-hidden hover:border-emerald-500"
        >
          <div className="w-14 h-14 bg-white rounded-xl p-1 flex items-center justify-center mb-1 shadow-2xs border border-slate-100">
            <img src={enamadImage} alt="لوگوی ای‌نماد" className="w-full h-full object-contain group-hover:scale-105 transition-transform" />
          </div>
          <span className="text-[10px] text-slate-800 font-black leading-tight">نماد اعتماد</span>
          <span className="text-[8px] text-emerald-600 font-bold mt-0.5 flex items-center gap-0.5">
            <span>درگاه رسمی</span>
            <ExternalLink size={8} />
          </span>
        </a>
      ) : enamadCode ? (
        <div
          className="bg-white border border-emerald-200 rounded-2xl p-2 flex items-center justify-center min-w-[90px] min-h-[100px] shadow-xs hover:shadow transition-all overflow-hidden"
          dangerouslySetInnerHTML={{ __html: enamadCode }}
        />
      ) : null}

      {/* 2. Samandehi (ساماندهی) - Only render if explicitly configured */}
      {samandehiImage ? (
        <a
          href={samandehiUrl}
          target="_blank"
          rel="noopener noreferrer"
          title="مشاهده تاییدیه رسمی نشان ساماندهی رسانه دیجیتال"
          className="group bg-white border border-indigo-200 p-2 rounded-2xl flex flex-col items-center justify-center w-24 h-28 transition-all shadow-xs hover:shadow-md cursor-pointer overflow-hidden hover:border-indigo-500"
        >
          <div className="w-14 h-14 bg-white rounded-xl p-1 flex items-center justify-center mb-1 shadow-2xs border border-slate-100">
            <img src={samandehiImage} alt="لوگوی ساماندهی" className="w-full h-full object-contain group-hover:scale-105 transition-transform" />
          </div>
          <span className="text-[10px] text-slate-800 font-black leading-tight">ساماندهی</span>
          <span className="text-[8px] text-indigo-600 font-bold mt-0.5 flex items-center gap-0.5">
            <span>وزارت ارشاد</span>
            <ExternalLink size={8} />
          </span>
        </a>
      ) : samandehiCode ? (
        <div
          className="bg-white border border-indigo-200 rounded-2xl p-2 flex items-center justify-center min-w-[90px] min-h-[100px] shadow-xs hover:shadow transition-all overflow-hidden"
          dangerouslySetInnerHTML={{ __html: samandehiCode }}
        />
      ) : null}

      {/* 3. Trade Union / Legal Verification - Only render if explicitly configured */}
      {tradeUnionCode && (
        <a
          href={tradeUnionUrl}
          target="_blank"
          rel="noopener noreferrer"
          title="مشاهده پروانه ثبت قانونی تعاونی / انجمن صنفی"
          className="group bg-white border border-amber-200 hover:border-amber-500 p-2.5 rounded-2xl flex flex-col items-center justify-center text-center w-24 h-28 transition-all shadow-xs hover:shadow-md cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
            <CheckCircle2 size={24} />
          </div>
          <span className="text-[10px] text-slate-800 font-black leading-tight">پروانه تعاونی</span>
          <span className="text-[8px] text-amber-600 font-mono font-bold mt-0.5">
            {tradeUnionCode}
          </span>
        </a>
      )}

      {/* If nothing is configured, render a clean and professional small assurance badge */}
      {!enamadImage && !enamadCode && !samandehiImage && !samandehiCode && !tradeUnionCode && (
        <div className="px-4 py-3 rounded-2xl bg-emerald-50/50 border border-emerald-100 flex items-center gap-2">
          <ShieldCheck className="text-emerald-600" size={16} />
          <span className="text-[11px] text-emerald-800 font-black">بستر امن معاملات مستقیم کارخانجات سراسر کشور</span>
        </div>
      )}
    </div>
  );
}
