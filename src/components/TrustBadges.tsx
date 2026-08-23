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
      title: 'ای‌نماد رسمی',
      subtitle: 'تایید شده و معتبر',
      url: b2bConfig?.enamadUrl || 'https://trustseal.enamad.ir',
      imageUrl: b2bConfig?.enamadImage || ''
    },
    {
      id: 'badge_2',
      title: 'نشان ساماندهی',
      subtitle: 'وزارت فرهنگ و ارشاد',
      url: b2bConfig?.samandehiUrl || 'https://logo.samandehi.ir',
      imageUrl: b2bConfig?.samandehiImage || ''
    },
    {
      id: 'badge_3',
      title: 'پروانه کسب صنفی',
      subtitle: b2bConfig?.tradeUnionCode || 'IR-9044502',
      url: b2bConfig?.tradeUnionUrl || 'https://dastavval.com/license',
      imageUrl: b2bConfig?.tradeUnionImage || ''
    }
  ];

  return (
    <div className={`w-full max-w-5xl mx-auto py-4 px-2 overflow-x-auto no-scrollbar ${className}`} dir="rtl">
      <div className="flex flex-row flex-nowrap items-center justify-center gap-3 sm:gap-5 min-w-max mx-auto">
        {badges.map((badge, idx) => (
          <a
            key={badge.id || idx}
            href={badge.url || "#"}
            target="_blank"
            rel="noopener noreferrer"
            title={badge.title}
            className="group relative bg-white hover:bg-slate-50 border border-slate-200/90 hover:border-emerald-500 rounded-2xl flex items-center justify-center transition-all shadow-sm hover:shadow-lg cursor-pointer w-24 h-24 sm:w-32 sm:h-32 shrink-0 p-3 sm:p-4"
          >
            <div className="w-full h-full flex items-center justify-center group-hover:scale-105 transition-transform overflow-hidden">
              {badge.imageUrl ? (
                <img src={badge.imageUrl} alt={badge.title} className="w-full h-full object-contain mix-blend-multiply" />
              ) : idx === 0 ? (
                <ShieldCheck className="text-slate-300 w-12 h-12 sm:w-16 sm:h-16" />
              ) : idx === 1 ? (
                <Award className="text-slate-300 w-12 h-12 sm:w-16 sm:h-16" />
              ) : (
                <CheckCircle2 className="text-slate-300 w-12 h-12 sm:w-16 sm:h-16" />
              )}
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
