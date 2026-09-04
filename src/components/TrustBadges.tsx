import React from "react";

interface TrustBadgeItem {
  id: string;
  title: string;
  url: string;
  imageUrl?: string;
  codeSnippet?: string;
}

interface TrustBadgesProps {
  b2bConfig?: {
    trustBadges?: TrustBadgeItem[];
    enamadImage?: string;
    enamadUrl?: string;
    enamadCode?: string;
    hideEnamad?: boolean;
    samandehiImage?: string;
    samandehiUrl?: string;
    samandehiCode?: string;
    hideSamandehi?: boolean;
    tradeUnionImage?: string;
    tradeUnionCode?: string;
    tradeUnionUrl?: string;
    hideTradeUnion?: boolean;
  };
  className?: string;
}

export default function TrustBadges({ b2bConfig, className = "" }: TrustBadgesProps) {
  const [failedBadges, setFailedBadges] = React.useState<Record<string, boolean>>({});

  const badges = [
    {
      id: 'enamad',
      title: 'نماد اعتماد الکترونیکی (ای‌نماد)',
      url: b2bConfig?.enamadUrl || 'https://trustseal.enamad.ir',
      imageUrl: b2bConfig?.enamadImage || '/assets/enamad.svg',
      fallbackUrl: '/assets/enamad.svg',
      hidden: !!b2bConfig?.hideEnamad
    },
    {
      id: 'samandehi',
      title: 'نشان ثبت ساماندهی پایگاه‌های اینترنتی',
      url: b2bConfig?.samandehiUrl || 'https://logo.samandehi.ir',
      imageUrl: b2bConfig?.samandehiImage || '/assets/samandehi.svg',
      fallbackUrl: '/assets/samandehi.svg',
      hidden: !!b2bConfig?.hideSamandehi
    },
    {
      id: 'tradeUnion',
      title: 'پروانه اتحادیه کشوری کسب‌وکارهای مجازی',
      url: b2bConfig?.tradeUnionUrl || 'https://dastavval.com/license',
      imageUrl: b2bConfig?.tradeUnionImage || '/assets/trade_union.svg',
      fallbackUrl: '/assets/trade_union.svg',
      hidden: !!b2bConfig?.hideTradeUnion
    }
  ];

  const visibleBadges = badges.filter(b => !b.hidden);

  if (visibleBadges.length === 0) return null;

  return (
    <div className={`w-full max-w-4xl mx-auto py-3 px-2 ${className}`} dir="rtl">
      {/* Horizontal row of simple clickable square badge boxes without text */}
      <div className="flex flex-row flex-wrap items-center justify-center gap-3 sm:gap-4 md:gap-5 mx-auto">
        {visibleBadges.map((badge, idx) => {
          const isFailed = failedBadges[badge.id];
          const currentSrc = isFailed ? badge.fallbackUrl : badge.imageUrl;

          return (
            <a
              key={`trust-badge-${badge.id || idx}-${idx}`}
              href={badge.url || "#"}
              target="_blank"
              rel="noopener noreferrer"
              title={badge.title}
              aria-label={badge.title}
              className="group relative w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 bg-white hover:bg-slate-50 border border-slate-200/90 hover:border-emerald-500/80 rounded-2xl flex items-center justify-center p-2.5 sm:p-3 transition-all duration-200 shadow-xs hover:shadow-md cursor-pointer shrink-0 overflow-hidden"
            >
              <img 
                src={currentSrc} 
                alt={badge.title} 
                className="w-full h-full object-contain transition-transform duration-200 group-hover:scale-105" 
                loading="lazy"
                onError={() => {
                  if (!failedBadges[badge.id]) {
                    setFailedBadges(prev => ({ ...prev, [badge.id]: true }));
                  }
                }}
              />
            </a>
          );
        })}
      </div>
    </div>
  );
}

