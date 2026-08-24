import React from "react";
import { ShieldCheck, Award, CheckCircle2 } from "lucide-react";

interface TrustBadgeItem {
  id: string;
  title: string;
  subtitle: string;
  url: string;
  imageUrl?: string;
}

interface TrustBadgesProps {
  b2bConfig?: {
    trustBadges?: TrustBadgeItem[];
    enamadImage?: string;
    enamadUrl?: string;
    samandehiImage?: string;
    samandehiUrl?: string;
    tradeUnionImage?: string;
    tradeUnionCode?: string;
    tradeUnionUrl?: string;
  };
  className?: string;
}

export default function TrustBadges({ b2bConfig, className = "" }: TrustBadgesProps) {
  // Exactly 3 badges in a single horizontal row
  const badges: TrustBadgeItem[] = [
    {
      id: 'badge_1',
      title: 'ای‌نماد رسمی ۵ ستاره',
      subtitle: 'مرکز توسعه تجارت الکترونیکی',
      url: b2bConfig?.enamadUrl || 'https://trustseal.enamad.ir',
      imageUrl: b2bConfig?.enamadImage || ''
    },
    {
      id: 'badge_2',
      title: 'نشان ثبت ساماندهی',
      subtitle: 'وزارت فرهنگ و ارشاد اسلامی',
      url: b2bConfig?.samandehiUrl || 'https://logo.samandehi.ir',
      imageUrl: b2bConfig?.samandehiImage || ''
    },
    {
      id: 'badge_3',
      title: 'پروانه کسب کشوری',
      subtitle: b2bConfig?.tradeUnionCode ? `شناسه صنفی: ${b2bConfig.tradeUnionCode}` : 'اتحادیه کسب‌وکارهای مجازی',
      url: b2bConfig?.tradeUnionUrl || 'https://dastavval.com/license',
      imageUrl: b2bConfig?.tradeUnionImage || ''
    }
  ];

  return (
    <div className={`w-full max-w-5xl mx-auto py-5 px-2 ${className}`} dir="rtl">
      <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mx-auto">
        {badges.map((badge, idx) => (
          <a
            key={badge.id || idx}
            href={badge.url || "#"}
            target="_blank"
            rel="noopener noreferrer"
            title={`${badge.title} - ${badge.subtitle}`}
            className="group relative bg-white hover:bg-slate-50/80 border border-slate-200/90 hover:border-emerald-500 rounded-2xl flex items-center gap-3 transition-all shadow-xs hover:shadow-md cursor-pointer px-4 py-3 min-w-[200px] sm:min-w-[230px]"
          >
            <div className="w-12 h-12 rounded-xl bg-slate-50 group-hover:bg-emerald-50/50 border border-slate-100 flex items-center justify-center shrink-0 transition-colors overflow-hidden">
              {badge.imageUrl ? (
                <img src={badge.imageUrl} alt={badge.title} className="w-full h-full object-contain mix-blend-multiply" />
              ) : idx === 0 ? (
                <ShieldCheck className="text-emerald-600 w-7 h-7 group-hover:scale-110 transition-transform" />
              ) : idx === 1 ? (
                <Award className="text-blue-600 w-7 h-7 group-hover:scale-110 transition-transform" />
              ) : (
                <CheckCircle2 className="text-indigo-600 w-7 h-7 group-hover:scale-110 transition-transform" />
              )}
            </div>
            <div className="text-right min-w-0">
              <h4 className="text-xs font-black text-slate-850 group-hover:text-emerald-700 transition-colors truncate">
                {badge.title}
              </h4>
              <p className="text-[10px] text-slate-400 font-bold truncate mt-0.5">
                {badge.subtitle}
              </p>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
