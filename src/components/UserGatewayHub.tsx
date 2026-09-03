import React, { useState } from 'react';
import { 
  ShoppingBag, 
  Briefcase, 
  Factory, 
  TrendingDown, 
  Sparkles, 
  HelpCircle, 
  Search, 
  Handshake,
  Zap,
  Award,
  Layers,
  ArrowUpRight,
  ChevronDown,
  CheckCircle2
} from 'lucide-react';

interface UserGatewayHubProps {
  onSelectBuyer: () => void;
  onSelectAgency: () => void;
  onSelectFactory: () => void;
  onSelectLeader: () => void;
  onSelectAdPoster: () => void;
  onOpenJourneyGuide: () => void;
  onOpenBillboard: () => void;
  user?: any;
}

export const UserGatewayHub: React.FC<UserGatewayHubProps> = ({
  onSelectBuyer,
  onSelectAgency,
  onSelectFactory,
  onSelectLeader,
  onSelectAdPoster,
  onOpenJourneyGuide,
  onOpenBillboard,
  user
}) => {
  // If user is registered/logged in, automatically hide registration & onboarding gateway views!
  if (user) {
    return null;
  }

  const pillars = [
    {
      id: 1,
      role: "بنکداران و مغازه‌داران",
      title: "خرید مستقیم از کارخانه",
      subtitle: "استعلام زنده قیمت خط تولید و ثبت سفارش عمده کارتنی",
      icon: ShoppingBag,
      btnText: "استعلام قیمت محصولات",
      btnIcon: Search,
      action: onSelectBuyer,
      details: [
        "صدور آنی پیش‌فاکتور رسمی با حسابرسی مالیاتی",
        "تخفیف پلکانی عمده بر اساس میزان سفارش",
        "تحویل سراسری با ناوگان حمل‌ونقل دولتی"
      ]
    },
    {
      id: 2,
      role: "متقاضیان عاملیت",
      title: "اخذ نمایندگی و پورسانت",
      subtitle: "انحصار پخش استانی، سفارش اعتباری با چک و سود نمایندگی",
      icon: Briefcase,
      btnText: "درخواست نمایندگی انحصاری",
      btnIcon: Handshake,
      action: onSelectAgency,
      details: [
        "سود انحصاری عاملیت‌های استانی و منطقه‌ای",
        "خرید اعتباری با چک صیادی و تسویه دوره‌ای",
        "عقد قرارداد کتبی و ارجاع سفارش‌های بومی"
      ]
    },
    {
      id: 3,
      role: "تولیدکنندگان",
      title: "ثبت غرفه و فروش کارخانه",
      subtitle: "عرضه مستقیم محصولات خط تولید با تسویه نقد و امن",
      icon: Factory,
      btnText: "ثبت غرفه کارخانه",
      btnIcon: Layers,
      action: onSelectFactory,
      details: [
        "مدیریت ۱۰۰٪ قیمت‌گذاری و شبکه توزیع کالا",
        "تسویه کامل نقدی و امن قبل از خروج بار",
        "معرفی محصولات به ۵۰ هزار خریدار معتبر"
      ]
    },
    {
      id: 4,
      role: "مدیر شبکه توزیع",
      title: "مدیریت تیم و بازاریابی",
      subtitle: "ایجاد شبکه فروش سراسری و دریافت پورسانت متمرکز",
      icon: Award,
      btnText: "ثبت‌نام لیدر فروش",
      btnIcon: Zap,
      action: onSelectLeader,
      details: [
        "پنل مانیتورینگ آنلاین فروش زیرمجموعه",
        "محاسبه خودکار پورسانت و پاداش‌های ماهیانه",
        "دسترسی به دوره‌های تخصصی رهبری بازار"
      ]
    },
    {
      id: 5,
      role: "تامین‌کنندگان و فروشندگان",
      title: "فروش مازاد و خدمات صنعتی",
      subtitle: "درج رایگان آگهی‌های بار عمده، تجهیزات و خدمات صنعتی",
      icon: TrendingDown,
      btnText: "ثبت آگهی کف بازار",
      btnIcon: ArrowUpRight,
      action: onSelectAdPoster,
      details: [
        "انتشار مستقیم در تالار معاملات کف بازار",
        "ارتباط مستقیم و بدون واسطه با خریدار اصلی",
        "امکان نردبان و ویژه کردن آگهی‌های عمده"
      ]
    }
  ];

  return (
    <section className="w-full space-y-4 my-4 text-right font-sans" dir="rtl">
      
      {/* Premium Attractive Header Banner - Restored & Enhanced */}
      <div className="relative overflow-hidden rounded-2xl bg-white p-5 sm:p-6 text-slate-900 shadow-sm border border-slate-200/80">
        {/* Abstract Decorative Background Elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/5 rounded-full translate-y-1/2 -translate-x-1/4 blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-lg shadow-emerald-200/50 shrink-0">
              <Sparkles size={24} className="animate-pulse" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-black bg-emerald-100/50 text-emerald-800 border border-emerald-200/50 px-3 py-1 rounded-full shadow-sm">
                  پورتال هوشمند انتخاب نقش
                </span>
                <span className="text-[11px] text-slate-500 font-bold flex items-center gap-1">
                  <div className="w-1 h-1 rounded-full bg-emerald-400" />
                  ورود و ثبت‌نام تخصصی فعالان بازار
                </span>
              </div>
              <h2 className="text-sm sm:text-lg font-black text-slate-900 mt-1.5 leading-tight">
                درگاه یکپارچه خرید و فروش عمده کالا مستقیم از خط تولید کارخانجات
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full lg:w-auto shrink-0 justify-end">
            <button
              onClick={onOpenJourneyGuide}
              className="flex-1 lg:flex-none h-11 px-4 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 whitespace-nowrap shadow-xs"
            >
              <HelpCircle size={17} className="text-slate-500" />
              <span>راهنمای کامل سیستم</span>
            </button>
            <button
              onClick={onOpenBillboard}
              className="flex-1 lg:flex-none h-11 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs transition-all shadow-md shadow-emerald-200/50 flex items-center justify-center gap-2 cursor-pointer active:scale-95 whitespace-nowrap"
            >
              <TrendingDown size={17} />
              <span>تالار کف بازار</span>
            </button>
          </div>
        </div>
      </div>

      {/* Structured Role Cards - Single column on mobile for better readability */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {pillars.map((item) => {
          const IconComponent = item.icon;
          const BtnIcon = item.btnIcon;

          return (
            <div 
              key={item.id}
              className="bg-white rounded-2xl p-4 border border-slate-200/90 hover:border-emerald-500 hover:shadow-xs shadow-2xs transition-all duration-200 flex flex-col justify-between group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/80 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors shrink-0 shadow-3xs">
                    <IconComponent size={18} />
                  </div>
                  <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/80">
                    {item.role}
                  </span>
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 group-hover:text-emerald-700 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed font-medium">
                    {item.subtitle}
                  </p>
                </div>
                {/* Key Benefits */}
                <div className="pt-2.5 border-t border-slate-100 space-y-2">
                  {item.details.map((detail, idx) => (
                    <div key={idx} className="flex items-start gap-1.5 text-[11px] text-slate-600 font-bold leading-snug">
                      <CheckCircle2 size={13} className="text-emerald-600 shrink-0 mt-0.5" />
                      <span>{detail}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4">
                <button
                  onClick={item.action}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95"
                >
                  <BtnIcon size={14} />
                  <span>{item.btnText}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

    </section>
  );
};
