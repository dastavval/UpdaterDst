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
    <section className="w-full space-y-6 my-4 text-right" dir="rtl">
      
      {/* Smart Hub Banner - Compact, Sleek & Creative */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white via-slate-50 to-emerald-50/40 p-5 sm:p-6 border border-emerald-100 shadow-md">
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 text-right">
            <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black shadow-md shadow-emerald-500/20 shrink-0">
              <Sparkles size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-md">پورتال هوشمند</span>
                <span className="text-[10px] font-bold text-slate-500">مبادلات مستقیم دست اول</span>
              </div>
              <h2 className="text-base sm:text-xl font-black text-slate-900 tracking-tight mt-0.5">
                درگاه یکپارچه خرید و فروش عمده بدون واسطه
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
            <button
              onClick={onOpenJourneyGuide}
              className="flex-1 md:flex-none px-4 py-2.5 rounded-xl bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 font-black text-xs transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <HelpCircle size={15} />
              <span>راهنمای ورود</span>
            </button>
            <button
              onClick={onOpenBillboard}
              className="flex-1 md:flex-none h-10 px-3 sm:px-5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-[10px] sm:text-xs transition-all shadow-md flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer active:scale-95 whitespace-nowrap border border-amber-400"
            >
              <TrendingDown size={14} className="shrink-0" />
              <span>تالار کف بازار</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3 Interactive Portal Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 pt-2">
        
        {/* Pillar 1: Buyer */}
        <div 
          onClick={onSelectBuyer}
          className="group relative bg-white rounded-[2.2rem] p-7 border-2 border-slate-100 hover:border-emerald-500 shadow-lg hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-300 cursor-pointer flex flex-col justify-between"
        >
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div className="w-13 h-13 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/30 group-hover:scale-110 transition-transform">
                <ShoppingBag size={24} />
              </div>
              <span className="text-[10px] font-black bg-emerald-50 text-emerald-800 px-3 py-1 rounded-full border border-emerald-200">
                بنکداران و مغازه‌داران
              </span>
            </div>

            <div>
              <h3 className="text-lg font-black text-slate-900 group-hover:text-emerald-700 transition-colors">
                ۱. خرید مستقیم از کارخانه
              </h3>
              <p className="text-xs font-bold text-slate-500 mt-1.5 leading-relaxed">
                استعلام زنده قیمت کف بازار و ثبت سفارش عمده مستقیم از انبارهای اصلی تولیدکننده.
              </p>
            </div>

            <div className="space-y-2.5 pt-2 border-t border-slate-100">
              {[
                "صدور آنی پیش‌فاکتور معتبر و سیب سلامت کالا",
                "ارسال مطمئن با ناوگان اختصاصی حمل‌ونقل کالا",
                "ضمانت اصالت، تاریخ انقضای معتبر و بازگشت کالا"
              ].map((txt, idx) => (
                <div key={`buyer-benefit-${idx}`} className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                  <span className="text-[11px] font-black text-slate-700">{txt}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-6">
            <button className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs flex items-center justify-center gap-2 shadow-sm transition-all group-hover:shadow-md">
              <Search size={16} />
              <span>مشاهده و استعلام قیمت محصولات</span>
            </button>
          </div>
        </div>

        {/* Pillar 2: Agency */}
        <div 
          onClick={onSelectAgency}
          className="group relative bg-white rounded-[2.2rem] p-7 border-2 border-amber-200 hover:border-amber-500 shadow-xl hover:shadow-2xl hover:shadow-amber-500/10 transition-all duration-300 cursor-pointer flex flex-col justify-between"
        >
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div className="w-13 h-13 rounded-2xl bg-amber-500 text-slate-900 flex items-center justify-center shadow-md shadow-amber-500/30 group-hover:scale-110 transition-transform">
                <Briefcase size={24} />
              </div>
              <span className="text-[10px] font-black bg-amber-50 text-amber-900 px-3 py-1 rounded-full border border-amber-300">
                متقاضیان عاملیت
              </span>
            </div>

            <div>
              <h3 className="text-lg font-black text-slate-900 group-hover:text-amber-800 transition-colors">
                ۲. اخذ نمایندگی و پورسانت
              </h3>
              <p className="text-xs font-bold text-slate-500 mt-1.5 leading-relaxed">
                اخذ حق انحصار پخش استانی کالا و ثبت سفارشات اعتباری با چک صیادی.
              </p>
            </div>

            <div className="space-y-2.5 pt-2 border-t border-slate-100">
              {[
                "دسترسی به سود انحصاری عاملیت‌های فروش استانی",
                "شرایط تسویه اعتباری و پشتیبانی بازاریابی مویرگی",
                "عقد قرارداد رسمی و کتبی نمایندگی انحصاری"
              ].map((txt, idx) => (
                <div key={`agency-benefit-${idx}`} className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-amber-600 shrink-0" />
                  <span className="text-[11px] font-black text-slate-700">{txt}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-6">
            <button className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 text-slate-900 rounded-xl font-black text-xs flex items-center justify-center gap-2 shadow-sm transition-all group-hover:shadow-md">
              <Handshake size={16} />
              <span>درخواست نمایندگی انحصاری</span>
            </button>
          </div>
        </div>

        {/* Pillar 3: Factory */}
        <div 
          onClick={onSelectFactory}
          className="group relative bg-white rounded-[2.2rem] p-7 border-2 border-slate-100 hover:border-indigo-500 shadow-lg hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300 cursor-pointer flex flex-col justify-between"
        >
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div className="w-13 h-13 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/30 group-hover:scale-110 transition-transform">
                <Factory size={24} />
              </div>
              <span className="text-[10px] font-black bg-indigo-50 text-indigo-800 px-3 py-1 rounded-full border border-indigo-200">
                تولیدکنندگان
              </span>
            </div>

            <div>
              <h3 className="text-lg font-black text-slate-900 group-hover:text-indigo-700 transition-colors">
                ۳. ثبت غرفه و فروش کارخانه
              </h3>
              <p className="text-xs font-bold text-slate-500 mt-1.5 leading-relaxed">
                عرضه مستقیم خط تولید به خریداران عمده سراسر کشور با تسویه نقدی و سریع.
              </p>
            </div>

            <div className="space-y-2.5 pt-2 border-t border-slate-100">
              {[
                "مدیریت ۱۰۰٪ قیمت‌گذاری و کنترل شبکه توزیع",
                "تسویه نقدی و امن پیش از خروج بار از کارخانه",
                "معرفی خطوط تولید به بیش از ۵۰ هزار خریدار فعال"
              ].map((txt, idx) => (
                <div key={`factory-benefit-${idx}`} className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-indigo-600 shrink-0" />
                  <span className="text-[11px] font-black text-slate-700">{txt}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-6">
            <button className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-xs flex items-center justify-center gap-2 shadow-sm transition-all group-hover:shadow-md">
              <Layers size={16} />
              <span>ثبت غرفه کارخانه و خط تولید</span>
            </button>
          </div>
        </div>

      </div>

    </section>
  );
};
