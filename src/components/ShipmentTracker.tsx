import { useState } from "react";
import { motion } from "motion/react";
import { Truck, Search, CheckCircle2, Package, ShieldCheck, MapPin, Calendar, Clock, ArrowLeft, ArrowRight, BarChart3, HelpCircle, User, Factory, FileText, Anchor } from "lucide-react";
import { Product } from "../types";

interface ShipmentTrackerProps {
  theme: 'light' | 'dark' | 'classic';
  transitRoutes?: any[];
  lastOrderTracking?: string;
  lastOrderAmount?: number;
  products: Product[];
}

const STAGES = [
  { key: 'order_received', label: "دریافت و تأیید سفارش", desc: "سفارش در سیستم ثبت شده و آماده تأیید مالی است.", icon: <FileText size={18} /> },
  { key: 'raw_material_supply', label: "تأمین مواد اولیه", desc: "تأمین مواد اولیه باکیفیت و تخصیص به خط تولید.", icon: <Factory size={18} /> },
  { key: 'production_line', label: "خط تولید کارخانه", desc: "کالاها در خط تولید تمام‌اتوماتیک در حال پخت و بسته‌بندی هستند.", icon: <Clock size={18} /> },
  { key: 'factory_packaging', label: "بسته‌بندی کارتنی شیرینگ", desc: "بسته‌بندی ضربه‌گیر کارتنی جهت سهولت بارگیری.", icon: <Package size={18} /> },
  { key: 'quality_assurance', label: "کنترل کیفیت و آزمایشگاه (QA)", desc: "بررسی نشان سیب سلامت و استانداردهای بهداشتی نهایی.", icon: <ShieldCheck size={18} /> },
  { key: 'logistic_shipping', label: "بارگیری و ارسال باربری", desc: "تحویل به شرکت ترابری و صدور بارنامه رسمی وزارت راه.", icon: <Truck size={18} /> },
  { key: 'delivered', label: "تخلیه بار و تحویل نهایی", desc: "بار به سلامت در انبار بنکدار تخلیه و تحویل شد.", icon: <CheckCircle2 size={18} /> },
];

export default function ShipmentTracker({ theme, transitRoutes = [], lastOrderTracking = "", lastOrderAmount = 0, products }: ShipmentTrackerProps) {
  const [searchCode, setSearchCode] = useState(lastOrderTracking);
  const [activeTracking, setActiveTracking] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setActiveTracking(null);

    const trimmed = searchCode.trim().toUpperCase();
    if (!trimmed) {
      setErrorMsg("لطفاً یک کد پیگیری معتبر وارد نمایید.");
      return;
    }

    // If it's the last ordered item
    if (trimmed === lastOrderTracking.toUpperCase() && lastOrderTracking) {
      setActiveTracking({
        code: lastOrderTracking,
        origin: "کارخانه مرکزی دست اول - خط تولید جور",
        destination: "انبار ثبت‌شده شما در سامانه",
        status: "production_line",
        operator: "ترابری لجستیک ملی دست اول",
        amount: lastOrderAmount,
        date: "۱۴۰۲/۰۴/۱۶"
      });
    } else {
      setErrorMsg("شناسه سفارش یافت نشد. لطفاً کد پیگیری فاکتور خرید یا شماره بارنامه خود را وارد نمایید.");
    }
  };

  const getStageIndex = (statusKey: string) => {
    return STAGES.findIndex(s => s.key === statusKey);
  };

  const activeStageIdx = activeTracking ? getStageIndex(activeTracking.status) : -1;

  // Render mock transit routes if not provided
  const defaultRoutes = transitRoutes.length > 0 ? transitRoutes : [];

  return (
    <div className="space-y-10 text-right" dir="rtl">
      {/* Search Header Banner */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-3xl p-6 sm:p-10 border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full text-emerald-400 text-[10px] font-black uppercase">
            <Truck size={12} className="animate-bounce" />
            رهگیری سراسری خط ترانزیت و تولید زنده کالا
          </div>
          <h2 className="text-xl sm font-black text-white leading-tight">
            سامانه مرکزی پیگیری زنجیره تامین کالا
          </h2>
          <p className="text-slate-400 text-xs sm leading-relaxed font-bold">
            شناسه سفارش خود را وارد کنید تا وضعیت واقعی تولید در کارخانه، کنترل کیفی و ترانزیت جاده‌ای بارگیران را به صورت لحظه‌ای بررسی کنید.
          </p>

          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 pt-2 max-w-xl">
            <div className="relative flex-1">
              <input 
                type="text" 
                value={searchCode}
                onChange={(e) => setSearchCode(e.target.value)}
                placeholder="شماره پیگیری سفارش عمده را وارد کنید..." 
                className="w-full bg-slate-100/80 border border-slate-700/80 rounded-2xl pr-12 pl-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus focus font-black tracking-wider text-center"
              />
              <Search className="absolute right-4 top-3.5 text-slate-500" size={16} />
            </div>
            <button 
              type="submit"
              className="bg-emerald-600 hover text-white py-3 px-8 rounded-2xl text-xs font-black shadow-lg shadow-emerald-600/20 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
            >
              استعلام وضعیت زنده بار
            </button>
          </form>

          {errorMsg && (
            <p className="text-rose-400 text-[11px] font-black">{errorMsg}</p>
          )}
        </div>
      </div>

      {/* SEARCH RESULT: STEP TRACKER */}
      {activeTracking && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-6 sm:p-8 rounded-3xl border ${
            theme === 'dark' ? 'bg-white border-slate-800' : 'bg-white border-slate-100 shadow-xl'
          } space-y-8`}
        >
          {/* Tracker Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pb-6 border-b border-slate-100">
            <div className="p-4 rounded-2xl bg-slate-50">
              <span className="text-[10px] text-slate-400 font-bold block mb-1">کد پیگیری سفارش</span>
              <span className="text-sm font-black text-emerald-600 font-mono tracking-widest">{activeTracking.code}</span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50">
              <span className="text-[10px] text-slate-400 font-bold block mb-1">مبدا بارگیری کالا</span>
              <span className="text-xs font-black text-slate-700 flex items-center gap-1">
                <Factory size={12} className="text-slate-400 shrink-0" />
                {activeTracking.origin}
              </span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50">
              <span className="text-[10px] text-slate-400 font-bold block mb-1">مقصد تخلیه بار</span>
              <span className="text-xs font-black text-slate-700 flex items-center gap-1">
                <MapPin size={12} className="text-slate-400 shrink-0" />
                {activeTracking.destination}
              </span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50">
              <span className="text-[10px] text-slate-400 font-bold block mb-1">مأمور حمل ترانزیت</span>
              <span className="text-xs font-black text-slate-700 flex items-center gap-1">
                <Truck size={12} className="text-slate-400 shrink-0" />
                {activeTracking.operator}
              </span>
            </div>
          </div>

          {/* Timeline View (Vertically stacked on mobile, gorgeous steps with lines) */}
          <div className="relative pt-4">
            <h3 className="font-black text-sm text-slate-800 mb-8 flex items-center gap-2">
              <span className="p-1 bg-emerald-500/10 text-emerald-600 rounded-lg">📊</span>
              مراحل طی شده زنجیره تأمین مستقیم
            </h3>

            {/* Vertical Steps for all screens to keep spacing highly readable and consistent */}
            <div className="relative border-r-2 border-slate-100 pr-6 mr-3 space-y-8">
              {STAGES.map((stage, idx) => {
                const isPassed = idx < activeStageIdx;
                const isCurrent = idx === activeStageIdx;
                const isPending = idx > activeStageIdx;

                return (
                  <div key={`shipment-stage-${stage.key}-${idx}`} className="relative flex flex-col sm:flex-row items-start gap-4">
                    {/* Circle Indicator */}
                    <div className={`absolute -right-[31px] top-1.5 w-4 h-4 rounded-full border-4 flex items-center justify-center transition-all ${
                      isPassed 
                        ? 'bg-emerald-500 border-white scale-110 shadow-lg shadow-emerald-500/20' 
                        : isCurrent 
                        ? 'bg-amber-500 border-white scale-125 shadow-lg shadow-amber-500/20 ring-4 ring-amber-500/10'
                        : 'bg-slate-200 border-white'
                    }`} />

                    {/* Stage icon box */}
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-all ${
                      isPassed 
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-600' 
                        : isCurrent 
                        ? 'bg-amber-50 border-amber-200 text-amber-600 font-bold'
                        : 'bg-slate-50 border-slate-100 text-slate-400'
                    }`}>
                      {stage.icon}
                    </div>

                    {/* Stage Details */}
                    <div className="space-y-1 text-right">
                      <h4 className={`text-xs md font-black ${
                        isPassed 
                          ? 'text-emerald-700' 
                          : isCurrent 
                          ? 'text-amber-700 font-black'
                          : 'text-slate-400'
                      }`}>
                        {stage.label}
                        {isCurrent && <span className="mr-2 text-[10px] bg-amber-500/10 text-amber-600 px-2 py-0.5 rounded-full font-black animate-pulse">در حال انجام</span>}
                        {isPassed && <span className="mr-2 text-[10px] bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded-full font-black">کامل شده</span>}
                      </h4>
                      <p className="text-[10px] md text-slate-500 max-w-xl leading-relaxed">
                        {stage.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}

      {/* LIVE TRANSIT FLEETS MAP & LIST */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Fleets on Road */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-black text-sm text-slate-800 flex items-center gap-2">
              <span className="p-1 bg-emerald-500/10 text-emerald-600 rounded-lg">🚚</span>
              ناوگان ترابری فعال روی خطوط مواصلاتی کشور
            </h3>
            <span className="text-[10px] bg-emerald-500/15 text-emerald-600 px-2.5 py-1 rounded-full font-black flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
              دو خط ترانزیت فعال
            </span>
          </div>

          <div className="space-y-4">
            {defaultRoutes.map((route, idx) => (
              <div 
                key={route.id || idx}
                className={`p-5 rounded-2xl border ${
                  theme === 'dark' ? 'bg-white border-slate-200' : 'bg-white border-slate-100 shadow-sm'
                } hover transition-shadow relative overflow-hidden`}
              >
                {/* Visual Transit Progress Bar */}
                <div className="absolute bottom-0 right-0 left-0 h-1 bg-slate-100">
                  <div 
                    className={`h-full bg-gradient-to-l ${route.status === 'in_transit' ? 'from-emerald-500 to-emerald-400 animate-pulse w-2/3' : 'from-amber-500 to-amber-400 w-1/5'}`}
                  />
                </div>

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-right">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-md ${
                        route.status === 'in_transit' 
                          ? 'bg-emerald-50 text-emerald-600' 
                          : 'bg-amber-50 text-amber-600'
                      }`}>
                        {route.status === 'in_transit' ? 'در حال ترانزیت (بین راهی)' : 'در حال بارگیری در کارخانه'}
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold">حمل‌کننده: {route.operator}</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs font-black text-slate-700 mt-2">
                      <Factory size={12} className="text-slate-400 shrink-0" />
                      <span className="truncate">{route.origin}</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs font-black text-slate-700">
                      <MapPin size={12} className="text-slate-400 shrink-0" />
                      <span className="truncate">{route.destination}</span>
                    </div>
                  </div>

                  <div className="sm text-right shrink-0">
                    <span className="text-[10px] text-slate-400 font-bold block mb-1">زمان تخمینی تخلیه بار</span>
                    <span className="text-xs font-black text-emerald-600 font-mono flex items-center justify-end gap-1">
                      <Calendar size={12} />
                      {route.estimatedDays} روز کاری
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cargo Safety Seal & Compliance */}
        <div className="space-y-4">
          <h3 className="font-black text-sm text-slate-800 flex items-center gap-2">
            <span className="p-1 bg-emerald-500/10 text-emerald-600 rounded-lg">🛡️</span>
            استاندارد ایمنی پلمپ باربری
          </h3>

          <div className={`p-6 rounded-3xl border text-center ${
            theme === 'dark' ? 'bg-white border-slate-200' : 'bg-white border-slate-100 shadow-sm'
          } space-y-4`}>
            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-100">
              <ShieldCheck size={28} />
            </div>
            
            <h4 className="text-xs font-black text-slate-800">کدرهگیری پلمپ سربی بار الکترونیکی</h4>
            <p className="text-[10px] text-slate-400 leading-relaxed font-bold">
              تمامی خروجی‌های خط بسته‌بندی کارخانجات همکار با پلمپ دیجیتالی ضدسرقت بارگیری می‌شوند. کد پلمپ در بارنامه رسمی ثبت گردیده و در مقصد توسط بنکدار با شناسه سیستمی انطباق داده می‌شود تا سلامت سلامت ۱۰۰٪ محموله تأیید گردد.
            </p>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-center">
              <span className="text-[9px] text-slate-400 font-black block mb-1">کد پلمپ دیجیتالی اختصاصی</span>
              <span className="text-xs font-black font-mono tracking-widest text-emerald-600">— — — — — — —</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
