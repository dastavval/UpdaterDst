import React from 'react';
import { 
  ShoppingBag, 
  Briefcase, 
  Factory, 
  TrendingDown, 
  ArrowLeft, 
  CheckCircle2, 
  Sparkles, 
  ShieldCheck, 
  HelpCircle, 
  Search, 
  Handshake,
  Zap,
  Award,
  Layers,
  ArrowUpRight
} from 'lucide-react';

interface UserGatewayHubProps {
  onSelectBuyer: () => void;
  onSelectAgency: () => void;
  onSelectFactory: () => void;
  onOpenJourneyGuide: () => void;
  onOpenBillboard: () => void;
}

export const UserGatewayHub: React.FC<UserGatewayHubProps> = ({
  onSelectBuyer,
  onSelectAgency,
  onSelectFactory,
  onOpenJourneyGuide,
  onOpenBillboard
}) => {
  return (
    <section className="w-full space-y-4 my-2 text-right" dir="rtl">
      
      {/* Smart Hub Banner - Compact, Sleek & Modern */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-white via-slate-50/80 to-emerald-50/30 p-4 sm:p-5 border border-emerald-100/80 shadow-xs">
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-right">
            <div className="w-10 h-10 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold shadow-xs shrink-0">
              <Sparkles size={18} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">پورتال هوشمند</span>
                <span className="text-[10px] font-medium text-slate-500">مبادلات مستقیم دست اول</span>
              </div>
              <h2 className="text-sm sm:text-base font-black text-slate-900 tracking-tight mt-0.5">
                درگاه یکپارچه خرید و فروش عمده بدون واسطه
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
            <button
              onClick={onOpenJourneyGuide}
              className="flex-1 md:flex-none px-3.5 py-2 rounded-lg bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300/80 font-bold text-xs transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <HelpCircle size={14} />
              <span>راهنمای ورود</span>
            </button>
            <button
              onClick={onOpenBillboard}
              className="flex-1 md:flex-none h-9 px-3.5 sm:px-4 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 whitespace-nowrap border border-amber-400"
            >
              <TrendingDown size={14} className="shrink-0" />
              <span>تالار کف بازار</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3 Interactive Portal Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
        
        {/* Pillar 1: Buyer */}
        <div 
          onClick={onSelectBuyer}
          className="group relative bg-white rounded-xl p-5 border border-slate-200/80 hover:border-emerald-500 hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between"
        >
          <div className="space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                <ShoppingBag size={20} />
              </div>
              <span className="text-[10px] font-bold bg-emerald-50 text-emerald-800 px-2.5 py-0.5 rounded border border-emerald-200/60">
                بنکداران و مغازه‌داران
              </span>
            </div>

            <div>
              <h3 className="text-sm font-black text-slate-900 group-hover:text-emerald-700 transition-colors">
                ۱. خرید مستقیم از کارخانه
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed font-normal">
                استعلام زنده قیمت کف بازار و ثبت سفارش عمده مستقیم از خطوط تولید.
              </p>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-100">
              {[
                "صدور آنی پیش‌فاکتور رسمی با اعمال تخفیف پلکانی",
                "ارسال مطمئن با ناوگان سراسری و بارنامه دولتی",
                "ضمانت اصالت، سیب سلامت و گواهی استاندارد کالا"
              ].map((txt, idx) => (
                <div key={`buyer-benefit-${idx}`} className="flex items-center gap-1.5">
                  <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                  <span className="text-[11px] font-medium text-slate-700">{txt}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4">
            <button className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all">
              <Search size={14} />
              <span>مشاهده و استعلام قیمت محصولات</span>
            </button>
          </div>
        </div>

        {/* Pillar 2: Agency */}
        <div 
          onClick={onSelectAgency}
          className="group relative bg-white rounded-xl p-5 border border-amber-200/90 hover:border-amber-500 hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between"
        >
          <div className="space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                <Briefcase size={20} />
              </div>
              <span className="text-[10px] font-bold bg-amber-50 text-amber-900 px-2.5 py-0.5 rounded border border-amber-200">
                متقاضیان عاملیت
              </span>
            </div>

            <div>
              <h3 className="text-sm font-black text-slate-900 group-hover:text-amber-800 transition-colors">
                ۲. اخذ نمایندگی و پورسانت
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed font-normal">
                اخذ حق انحصار پخش استانی کالا و ثبت سفارشات اعتباری با چک صیادی.
              </p>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-100">
              {[
                "دسترسی به سود انحصاری عاملیت‌های فروش استانی",
                "شرایط تسویه اعتباری و پشتیبانی بازاریابی مویرگی",
                "عقد قرارداد رسمی و کتبی نمایندگی انحصاری"
              ].map((txt, idx) => (
                <div key={`agency-benefit-${idx}`} className="flex items-center gap-1.5">
                  <CheckCircle2 size={13} className="text-amber-600 shrink-0" />
                  <span className="text-[11px] font-medium text-slate-700">{txt}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4">
            <button className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all">
              <Handshake size={14} />
              <span>درخواست نمایندگی انحصاری</span>
            </button>
          </div>
        </div>

        {/* Pillar 3: Factory */}
        <div 
          onClick={onSelectFactory}
          className="group relative bg-white rounded-xl p-5 border border-slate-200/80 hover:border-indigo-500 hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between"
        >
          <div className="space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                <Factory size={20} />
              </div>
              <span className="text-[10px] font-bold bg-indigo-50 text-indigo-800 px-2.5 py-0.5 rounded border border-indigo-200/60">
                تولیدکنندگان
              </span>
            </div>

            <div>
              <h3 className="text-sm font-black text-slate-900 group-hover:text-indigo-700 transition-colors">
                ۳. ثبت غرفه و فروش کارخانه
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed font-normal">
                عرضه مستقیم خط تولید به خریداران عمده سراسر کشور با تسویه نقدی و سریع.
              </p>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-100">
              {[
                "مدیریت ۱۰۰٪ قیمت‌گذاری و کنترل شبکه توزیع",
                "تسویه نقدی و امن پیش از خروج بار از کارخانه",
                "معرفی خطوط تولید به بیش از ۵۰ هزار خریدار فعال"
              ].map((txt, idx) => (
                <div key={`factory-benefit-${idx}`} className="flex items-center gap-1.5">
                  <CheckCircle2 size={13} className="text-indigo-600 shrink-0" />
                  <span className="text-[11px] font-medium text-slate-700">{txt}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4">
            <button className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all">
              <Layers size={14} />
              <span>ثبت غرفه کارخانه و خط تولید</span>
            </button>
          </div>
        </div>

      </div>

    </section>
  );
};
