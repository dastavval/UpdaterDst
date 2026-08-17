import React, { useState } from 'react';
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
  DollarSign, 
  Truck, 
  Coins, 
  FileText, 
  Percent,
  Compass,
  Zap,
  Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

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
  const [activeTab, setActiveTab] = useState<'buyer' | 'agency' | 'factory'>('buyer');

  return (
    <section className="w-full space-y-4 my-2 text-right" dir="rtl">
      
      {/* Top Value Banner Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 text-slate-900 border border-slate-200 shadow-xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-3 max-w-2xl relative z-10">
          <div className="flex flex-wrap items-center gap-2">
            <span className="bg-emerald-600 text-white px-3.5 py-1 rounded-full text-[10px] font-black flex items-center gap-1.5 shadow-sm">
              <Sparkles size={13} className="fill-white" />
              <span>راهنمای ۳ مسیر اصلی دست اول</span>
            </span>
            <span className="text-[10px] text-emerald-600 font-bold hidden sm:inline-block">
              🎯 هدفتان را مشخص کنید تا هوشمندانه خرید کنید
            </span>
          </div>

          <h2 className="text-lg sm:text-2xl font-black text-slate-900 leading-tight">
            کدام مسیر برای شما مناسب است؟
          </h2>

          <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed">
            چه به دنبال <strong className="text-emerald-600">خرید زیر قیمت بازار</strong> باشید، چه خواهان <strong className="text-amber-600">کسب درآمد ماهانه از نمایندگی</strong> یا <strong className="text-indigo-600">فروش مستقیم محصولات کارخانه خود</strong>، ما مسیر را برایتان هموار کرده‌ایم.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 relative z-10 w-full md:w-auto shrink-0">
          <button
            onClick={onOpenJourneyGuide}
            className="w-full sm:w-auto bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 hover:border-emerald-500 px-6 py-3.5 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
          >
            <HelpCircle size={18} className="text-emerald-500" />
            <span>چگونه کار می‌کند؟</span>
          </button>

          <button
            onClick={onOpenBillboard}
            className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white font-black text-xs px-6 py-3.5 rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer active:scale-95"
          >
            <TrendingDown size={18} className="text-amber-400" />
            <span>تالار اجناس زیر کف بازار</span>
          </button>
        </div>

        {/* Ambient Decorative Elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* 3 Pillar Cards (Buyer, Agent, Factory) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Pillar 1: Buyer / Shopkeeper (Low Price Seeker) */}
        <div 
          onClick={onSelectBuyer}
          className="group relative bg-white hover:bg-emerald-50/40 rounded-3xl p-6 border-2 border-emerald-100 hover:border-emerald-500 shadow-md hover:shadow-2xl transition-all duration-300 cursor-pointer flex flex-col justify-between overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-500" />
          
          <div className="space-y-4 relative z-10">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-600/20 group-hover:scale-110 transition-transform">
                <ShoppingBag size={22} />
              </div>
              <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full border border-emerald-200">
                🎯 مسیر اول: خریداران
              </span>
            </div>

            <div>
              <h3 className="text-base font-black text-slate-900 group-hover:text-emerald-700 transition-colors">
                ۱. خرید عمده زیر قیمت بازار
              </h3>
              <p className="text-xs text-slate-500 font-bold mt-1 leading-relaxed">
                مخصوص بنکداران، سوپرمارکت‌ها، سازمان‌ها و فروشگاه‌ها
              </p>
            </div>

            {/* 4-Step Transparent Journey */}
            <div className="space-y-2 bg-slate-50 p-3.5 rounded-2xl border border-slate-100 text-[11px] font-bold text-slate-700">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] flex items-center justify-center font-black shrink-0">۱</span>
                <span>انتخاب کالا با قیمت تمام‌شده کارخانه</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] flex items-center justify-center font-black shrink-0">۲</span>
                <span>استعلام موجودی و صدور آنی پیش‌فاکتور</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] flex items-center justify-center font-black shrink-0">۳</span>
                <span>واریز به حساب امانی امن (تضمین برگشت وجه)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] flex items-center justify-center font-black shrink-0">۴</span>
                <span>تحویل بار با بارنامه بیمه‌شده درب انبار شما</span>
              </div>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-2.5 rounded-xl text-[11px] font-black flex items-center gap-2">
              <Percent size={15} className="shrink-0 text-emerald-600" />
              <span>حاشیه سود: تا ۳۵٪ ارزان‌تر از بازار سنتی دلالان</span>
            </div>
          </div>

          <div className="pt-5 border-t border-slate-100 flex items-center justify-between mt-4">
            <span className="text-xs font-black text-emerald-700 flex items-center gap-1 group-hover:gap-2 transition-all">
              <span>ورود به تالار خرید عمده</span>
              <ArrowLeft size={16} />
            </span>
            <span className="text-[10px] text-slate-400 font-bold">بیش از ۵۰۰ قلم کالا</span>
          </div>
        </div>

        {/* Pillar 2: Agency & Income Seekers (Representation in 31 Provinces) */}
        <div 
          onClick={onSelectAgency}
          className="group relative bg-white hover:bg-amber-50/40 rounded-3xl p-6 border-2 border-amber-200 hover:border-amber-500 shadow-md hover:shadow-2xl transition-all duration-300 cursor-pointer flex flex-col justify-between overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-500" />
          
          <div className="space-y-4 relative z-10">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-500/20 group-hover:scale-110 transition-transform">
                <Briefcase size={22} />
              </div>
              <span className="text-[10px] font-black bg-amber-100 text-amber-900 px-3 py-1 rounded-full border border-amber-200">
                🎯 مسیر دوم: کسب درآمد
              </span>
            </div>

            <div>
              <h3 className="text-base font-black text-slate-900 group-hover:text-amber-700 transition-colors">
                ۲. اخذ نمایندگی و پورسانت بازاریابی
              </h3>
              <p className="text-xs text-slate-500 font-bold mt-1 leading-relaxed">
                مخصوص بازاریابان، شرکت‌های پخش استانی و افراد جویای درآمد
              </p>
            </div>

            {/* 4-Step Transparent Journey */}
            <div className="space-y-2 bg-slate-50 p-3.5 rounded-2xl border border-slate-100 text-[11px] font-bold text-slate-700">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 text-[10px] flex items-center justify-center font-black shrink-0">۱</span>
                <span>انتخاب استان و خط تولید مورد علاقه شما</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 text-[10px] flex items-center justify-center font-black shrink-0">۲</span>
                <span>دریافت کاتالوگ، لیست قیمت و گواهی نمایندگی</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 text-[10px] flex items-center justify-center font-black shrink-0">۳</span>
                <span>بازاریابی و ثبت سفارش بدون نیاز به سرمایه اولیه</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 text-[10px] flex items-center justify-center font-black shrink-0">۴</span>
                <span>واریز قطعی پورسانت و سود ماهانه (۲۰ تا ۱۰۰ م)</span>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 text-amber-900 p-2.5 rounded-xl text-[11px] font-black flex items-center gap-2">
              <Coins size={15} className="shrink-0 text-amber-600" />
              <span>پتانسیل درآمد: سود تضمینی از هر کارتن بدون انبارداری</span>
            </div>
          </div>

          <div className="pt-5 border-t border-slate-100 flex items-center justify-between mt-4">
            <span className="text-xs font-black text-amber-700 flex items-center gap-1 group-hover:gap-2 transition-all">
              <span>درخواست نمایندگی ۳۱ استان</span>
              <ArrowLeft size={16} />
            </span>
            <span className="text-[10px] text-slate-400 font-bold">ظرفیت محدود استانی</span>
          </div>
        </div>

        {/* Pillar 3: Factory Owner / Manufacturer (Fast Cash & Ton Sale) */}
        <div 
          onClick={onSelectFactory}
          className="group relative bg-white hover:bg-indigo-50/40 rounded-3xl p-6 border-2 border-indigo-100 hover:border-indigo-500 shadow-md hover:shadow-2xl transition-all duration-300 cursor-pointer flex flex-col justify-between overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-500" />
          
          <div className="space-y-4 relative z-10">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/20 group-hover:scale-110 transition-transform">
                <Factory size={22} />
              </div>
              <span className="text-[10px] font-black bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full border border-indigo-200">
                🎯 مسیر سوم: کارخانجات
              </span>
            </div>

            <div>
              <h3 className="text-base font-black text-slate-900 group-hover:text-indigo-700 transition-colors">
                ۳. فروش تناژ بار و تامین نقدینگی
              </h3>
              <p className="text-xs text-slate-500 font-bold mt-1 leading-relaxed">
                مخصوص تولیدکنندگان، کارخانه‌داران و صاحبان صنایع غذایی
              </p>
            </div>

            {/* 4-Step Transparent Journey */}
            <div className="space-y-2 bg-slate-50 p-3.5 rounded-2xl border border-slate-100 text-[11px] font-bold text-slate-700">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] flex items-center justify-center font-black shrink-0">۱</span>
                <span>ثبت مشخصات خط تولید و ظرفیت خالی روزانه</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] flex items-center justify-center font-black shrink-0">۲</span>
                <span>بررسی کیفی، اصالت سیب سلامت و استاندارد</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] flex items-center justify-center font-black shrink-0">۳</span>
                <span>معرفی محصول به شبکه ۱۲,۸۰۰ خریدار فعال</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] flex items-center justify-center font-black shrink-0">۴</span>
                <span>تسویه نقدی قبل از خروج بار (بدون ریسک چک)</span>
              </div>
            </div>

            <div className="bg-indigo-50 border border-indigo-200 text-indigo-800 p-2.5 rounded-xl text-[11px] font-black flex items-center gap-2">
              <ShieldCheck size={15} className="shrink-0 text-indigo-600" />
              <span>امنیت مالی: تسویه ۱۰۰٪ نقدی بدون بازگشت چک</span>
            </div>
          </div>

          <div className="pt-5 border-t border-slate-100 flex items-center justify-between mt-4">
            <span className="text-xs font-black text-indigo-700 flex items-center gap-1 group-hover:gap-2 transition-all">
              <span>ثبت خط تولید کارخانه</span>
              <ArrowLeft size={16} />
            </span>
            <span className="text-[10px] text-slate-400 font-bold">عضویت سراسری ۳۱ استان</span>
          </div>
        </div>

      </div>
    </section>
  );
};
