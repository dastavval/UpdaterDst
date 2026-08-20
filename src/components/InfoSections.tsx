import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Info, BookOpen, TrendingUp, Mail, MapPin, Phone, MessageSquare, BrainCircuit, Lightbulb, Users, BarChart3, Download, Grid, FileText, ShieldCheck, DollarSign, Percent, Gavel, Clock, Send, CheckCircle2, ArrowLeft, Calendar, X, Eye, Search, Building2, ExternalLink, ChevronRight, ChevronLeft, ArrowRight, Scale, ShieldAlert, Leaf } from "lucide-react";
import { addCallbackRequest } from "../lib/callback-helper";
import { NetworkDiamondWidget } from "./NetworkDiamondWidget";
import { CompetitiveAdvantagesAndRoadmap } from "./CompetitiveAdvantagesAndRoadmap";

export function AboutUsSection({ theme }: { articles?: any[]; theme: 'light' | 'dark' | 'classic' }) {
  return (
    <div id="about-us" className="py-6 md:py-10 text-right" dir="rtl">
      <div className="space-y-8 max-w-7xl mx-auto">
        {/* Render Creative Comparison Matrix Table & Newcomer Roles Roadmap */}
        <CompetitiveAdvantagesAndRoadmap theme={theme} />
      </div>
    </div>
  );
}

export function LearningCenter({ theme }: { theme: 'light' | 'dark' | 'classic' }) {
  const courses = [
    { title: "اصول انبارداری مواد غذایی", icon: <BookOpen className="text-blue-500" />, level: "مقدماتی", time: "۴۵ دقیقه" },
    { title: "مدیریت نقدینگی در خرید عمده", icon: <TrendingUp className="text-emerald-500" />, level: "متوسط", time: "۶۰ دقیقه" },
    { title: "بازاریابی محصولات در خرده‌فروشی", icon: <Lightbulb className="text-amber-500" />, level: "پیشرفته", time: "۳۰ دقیقه" },
  ];

  return (
    <div id="learning-center" className="py-6 sm:py-8" dir="rtl">
      <div className="flex justify-between items-end mb-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-[10px] font-black uppercase tracking-widest">
            <BookOpen size={14} />
            مرکز آموزش و مهارت‌آموزی
          </div>
          <h2 className="text-lg font-black text-slate-900">دانش خود را در تجارت عمده بروز کنید</h2>
        </div>
        <button className="text-xs font-black text-emerald-600 hover:underline">مشاهده همه دوره‌ها</button>
      </div>

      <div className="flex flex-nowrap overflow-x-auto snap-x snap-mandatory hide-scrollbar scroll-smooth gap-4 md:grid md:grid-cols-3 px-1 pb-2 md:px-0 md:pb-0">
        {courses.map((course, idx) => (
          <motion.div 
            key={`info-course-${course.title}-${idx}`}
            whileHover={{ y: -3 }}
            className="min-w-[80vw] md:min-w-0 snap-center shrink-0 p-4 rounded-2xl border bg-white border-slate-200 shadow-sm transition-all"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center mb-3">
               {course.icon}
            </div>
            <h4 className="text-xs font-black mb-2 text-slate-800">{course.title}</h4>
            <div className="flex items-center justify-between mt-auto">
              <span className="text-[10px] font-black text-slate-500">{course.level}</span>
              <span className="text-[10px] font-black text-slate-500">{course.time} مطالعه</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export function AIAdvisorSection({ theme }: { theme: 'light' | 'dark' | 'classic' }) {
  return (
    <div id="ai-advisor" className="py-10 md:py-16" dir="rtl">
      <div className="p-6 md:p-10 rounded-3xl md:rounded-[3rem] bg-emerald-50 border border-emerald-100 border relative overflow-hidden">
        <div className="absolute top-0 left-0 w-64 h-64 bg-emerald-400/10 blur-[100px] rounded-full -translate-x-1/2 -translate-y-1/2" />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10 items-center relative z-10">
          <div className="space-y-4 md:space-y-6 text-right">
             <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-600/20">
                <BrainCircuit size={14} />
                موتور هوشمند برآورد سود و تحلیل زنجیره تأمین دست اول
             </div>
             <h2 className="text-2xl md font-black leading-tight text-slate-900">
               بخش برآورد خودکار سود ناخالص <br />و حاشیه سود مغازه‌داران و بنکداران
             </h2>
             <p className="text-xs md font-bold text-slate-600 leading-relaxed">
               سیستم هوشمند دست اول به صورت پویا هزینه‌های باربری جاده‌ای، میزان تخفیف حجمی خرید کارخانه، و قیمت مصرف‌کننده را با یکدیگر تطبیق داده و پرسودترین سبد کالا را برای فروشگاه یا انبار شما شبیه‌سازی می‌کند.
             </p>
             <button 
               onClick={() => window.dispatchEvent(new CustomEvent("open-ai-chat"))}
               className="w-full md:w-auto px-8 py-3.5 md:py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-xs shadow-xl transition-all cursor-pointer"
             >
                ورود به سامانه شبیه‌سازی سود و استعلام مالی
             </button>
          </div>
          <div className="flex justify-center">
             <div className="relative w-full max-w-sm bg-white/80 backdrop-blur-md p-5 rounded-3xl border border-slate-200/80 shadow-xl space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                    <span className="text-[10px] font-black text-slate-500">پایش پویا و زنده بازار عمده</span>
                  </div>
                  <span className="text-[9px] font-black bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md">بخش محاسبات سود</span>
                </div>
                
                <div className="space-y-2.5 text-right">
                  <div className="p-3 bg-indigo-50/50 rounded-2xl border border-indigo-100/50 flex justify-between items-center">
                    <div>
                      <p className="text-[9px] text-slate-500 font-bold">میانگین حاشیه سود بنکداری</p>
                      <p className="text-xs font-black text-indigo-950 mt-0.5">محاسبه بر اساس MOQ کارخانجات</p>
                    </div>
                    <span className="text-base font-black text-indigo-700 font-mono">۲۸.۴٪</span>
                  </div>

                  <div className="p-3 bg-emerald-50/50 rounded-2xl border border-emerald-100/50 flex justify-between items-center">
                    <div>
                      <p className="text-[9px] text-slate-500 font-bold">بیشترین رشد سود خرده‌فروشی</p>
                      <p className="text-xs font-black text-emerald-950 mt-0.5">گروه محصولات شوینده و بهداشتی</p>
                    </div>
                    <span className="text-base font-black text-emerald-750 font-mono">+۴۲٪</span>
                  </div>

                  <div className="p-3 bg-amber-50/50 rounded-2xl border border-amber-100/50 flex justify-between items-center">
                    <div>
                      <p className="text-[9px] text-slate-500 font-bold">پیش‌بینی ثبات قیمت کارخانه</p>
                      <p className="text-xs font-black text-amber-950 mt-0.5">تحلیل فصلی تا انتهای ماه جاری</p>
                    </div>
                    <span className="text-xs font-black text-amber-700">پایدار (۹۲٪)</span>
                  </div>
                </div>

                <div className="text-[9px] text-slate-400 font-bold text-center">
                  بروزرسانی شده بر اساس بارنامه‌های رسمی صادره در سراسر کشور
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function BusinessModelSection({ theme }: { theme: 'light' | 'dark' | 'classic' }) {
  const models = [
    { title: "خرید و پخش", desc: "کالا را مستقیم بخرید و با سود بالا در منطقه خودتان پخش کنید.", icon: <TrendingUp size={24} />, color: "text-blue-500" },
    { title: "نمایندگی شهر شما", desc: "نماینده ما باشید و روی هر فروش پورسانت عالی بگیرید.", icon: <Users size={24} />, color: "text-emerald-500" },
    { title: "تامین برای ادارات", desc: "مواد غذایی اداره‌ها و سازمان‌ها را با سود مطمئن تامین کنید.", icon: <BarChart3 size={24} />, color: "text-amber-500" },
  ];

  return (
    <div className="py-16" dir="rtl">
      <div className="text-center mb-12 space-y-3">
         <h2 className="text-2xl font-black text-slate-900">چطور درآمد کسب کنید؟</h2>
         <p className="text-xs font-bold text-slate-500">راه‌های ساده برای رشد کسب‌وکار شما با دست اول.</p>
      </div>
      <div className="flex flex-nowrap overflow-x-auto snap-x snap-mandatory hide-scrollbar scroll-smooth gap-6 md:grid md:grid-cols-3 px-2 pb-4 md:px-0 md:pb-0">
         {models.map((m, idx) => (
           <div key={`info-model-${m.title}-${idx}`} className="min-w-[85vw] md:min-w-0 snap-center shrink-0 p-6 rounded-2xl bg-white border border-slate-150 shadow-sm hover transition-shadow text-center space-y-4">
              <div className={`mx-auto w-12 h-12 flex items-center justify-center ${m.color}`}>
                 {m.icon}
              </div>
              <h4 className="text-sm font-black text-slate-900">{m.title}</h4>
              <p className="text-[11px] text-slate-500 font-bold leading-relaxed">{m.desc}</p>
           </div>
         ))}
      </div>
    </div>
  );
}

export function CatalogueSection({ theme }: { theme: 'light' | 'dark' | 'classic' }) {
  const catalogues = [
    { title: "کاتالوگ محصولات سلولزی", brand: "برندهای برتر", size: "۴.۵ مگابایت", date: "تیر ۱۴۰۵" },
    { title: "لیست قیمت رسمی شوینده عمده", brand: "تامین سراسری", size: "۲.۱ مگابایت", date: "بروز رسانی امروز" },
    { title: "راهنمای کار کارخانجات", brand: "ویژه تولیدکننده", size: "۸.۹ مگابایت", date: "خرداد ۱۴۰۵" },
  ];

  return (
    <div id="catalogues" className="py-16" dir="rtl">
      <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6">
        <div className="space-y-2 text-center md">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 text-[10px] font-black uppercase tracking-widest">
            <Download size={14} />
            دریافت لیست قیمت‌ها
          </div>
          <h2 className="text-2xl font-black text-slate-900">کاتالوگ محصولات و لیست قیمت رسمی</h2>
        </div>
        <button className="px-6 py-3 bg-white text-white rounded-2xl font-black text-xs hover transition-all flex items-center gap-2">
           <Grid size={16} />
           آرشیو کامل اسناد
        </button>
      </div>

      <div className="flex flex-nowrap overflow-x-auto snap-x snap-mandatory hide-scrollbar scroll-smooth gap-6 md:grid md:grid-cols-3 px-2 pb-4 md:px-0 md:pb-0">
        {catalogues.map((cat, idx) => (
          <div key={`info-cat-${cat.title}-${idx}`} className="min-w-[80vw] md:min-w-0 snap-center shrink-0 p-6 rounded-2xl border bg-white border-slate-200 shadow-sm flex items-center justify-between group hover transition-all cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                 <FileText size={24} />
              </div>
              <div className="text-right">
                <h4 className="text-xs font-black text-slate-850">{cat.title}</h4>
                <p className="text-[10px] text-slate-500 font-bold mt-1">{cat.brand} • {cat.size}</p>
              </div>
            </div>
            <div className="p-2 rounded-xl bg-slate-50 text-slate-400 group-hover transition-colors">
               <Download size={18} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function TrustSection({ theme }: { theme: 'light' | 'dark' | 'classic' }) {
  const steps = [
    { title: "حذف کامل واسطه‌ها", desc: "خرید مستقیم از درب کارخانجات با کوتاه کردن زنجیره تامین و دستیابی به سود واقعی و نهایی تولید.", icon: <Users size={22} />, color: "from-blue-500 to-indigo-600", bg: "bg-blue-50", text: "text-blue-600", border: "border-blue-200" },
    { title: "تضمین مالی امانی وجه", desc: "حفاظت کامل از سرمایه و نقدینگی شما در حساب امانی دست اول تا تایید تخلیه فیزیکی و امضای بارنامه.", icon: <ShieldCheck size={22} />, color: "from-emerald-500 to-teal-600", bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-200" },
    { title: "عدالت در قیمت‌گذاری کشوری", desc: "قیمت‌های دست اول منطبق بر نرخ مصوب سازمان حمایت و خروجی رسمی خطوط تولید بدون پورسانت.", icon: <Scale size={22} />, color: "from-amber-500 to-orange-600", bg: "bg-amber-50", text: "text-amber-600", border: "border-amber-200" },
    { title: "اصالت بهداشتی و سلامت کالا", desc: "تایید سیب سلامت، استانداردهای اجباری، کدهای ترخیص بهداشتی و تاریخ تولید مستقیم کارخانه.", icon: <ShieldAlert size={22} />, color: "from-rose-500 to-pink-600", bg: "bg-rose-50", text: "text-rose-600", border: "border-rose-200" },
    { title: "حمایت از تغذیه ارگانیک", desc: "رتبه‌بندی ویژه کارخانجات سبز و ترویج عرضه محصولات فاقد افزودنی‌های غیرمجاز و باکیفیت.", icon: <Leaf size={22} />, color: "from-teal-500 to-emerald-600", bg: "bg-teal-50", text: "text-teal-600", border: "border-teal-200" },
  ];

  return (
    <div className="py-8 md:py-12" dir="rtl">
      <div className="flex flex-col items-center text-center space-y-5 md:space-y-6 overflow-hidden relative">
        {/* Futuristic Network Diamond */}
        <div className="relative w-36 h-36 flex items-center justify-center">
          <div className="absolute inset-0 bg-emerald-500/10 rounded-full blur-2xl animate-pulse" />
          <NetworkDiamondWidget size={140} />
        </div>

        <div className="max-w-3xl space-y-2 md:space-y-3 relative z-10">
           <span className="inline-block px-3.5 py-1 rounded-full bg-emerald-550/10 text-emerald-700 text-[11px] font-black border border-emerald-500/20 shadow-sm animate-pulse">
             🛡️ پروتکل چندلایه امنیت تجاری و مالی کشور
           </span>
           <h2 className="text-xl md:text-3xl font-black text-slate-900 tracking-tight">
             پروتکل چندلایه امنیت مالی و تسویه هوشمند دست اول
           </h2>
           <p className="text-xs md:text-sm font-bold text-slate-650 leading-relaxed max-w-2xl mx-auto">
             پلتفرم کشوری دست اول از نظام یکپارچه «پرداخت امانی زنجیره تامین» استفاده می‌کند. سرمایه شما تا لحظه تحویل فیزیکی کالا، تخلیه کامل در انبار و تایید بارنامه دولتی، به طور امن در حساب واسط نگهداری می‌شود. این سیستم ریسک را برای خریداران به صفر و سود تولید را برای کارخانه تضمین می‌کند.
           </p>
        </div>
        
        {/* Horizontal scrollable row */}
        <div className="flex flex-row overflow-x-auto gap-3 sm:gap-4 w-full pt-4 md:pt-6 pb-3 no-scrollbar scroll-smooth relative z-10">
           {steps.map((s, idx) => (
             <div 
                key={`info-step-${s.title}-${idx}`} 
                className={`min-w-[220px] sm:min-w-[240px] flex-1 shrink-0 space-y-3 bg-white/95 backdrop-blur-md p-4 rounded-2xl border ${s.border} shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between text-right`}
             >
                <div className="flex items-center justify-between">
                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${s.color} text-white shadow-md flex items-center justify-center`}>
                     {s.icon}
                  </div>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${s.bg} ${s.text}`}>
                    سطح امنیتی ۰{idx + 1}
                  </span>
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-black text-slate-900 mb-1">{s.title}</h4>
                  <p className="text-[10px] sm:text-[11px] text-slate-600 font-medium leading-relaxed">{s.desc}</p>
                </div>
             </div>
           ))}
        </div>
      </div>
    </div>
  );
}

export function ContactSection({ theme, userBadge, userCity }: { theme: 'light' | 'dark' | 'classic'; userBadge?: string; userCity?: string }) {
  const [phone, setPhone] = React.useState('');
  const [submitted, setSubmitted] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const [representatives, setRepresentatives] = useState<any[]>(() => {
    const DEFAULT_REPS: any[] = [];

    const saved = localStorage.getItem("dastavval_representatives");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error("Error parsing representatives from localStorage:", e);
      }
    }
    localStorage.setItem("dastavval_representatives", JSON.stringify(DEFAULT_REPS));
    return DEFAULT_REPS;
  });

  useEffect(() => {
    const handleRepsUpdated = () => {
      const saved = localStorage.getItem("dastavval_representatives");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) setRepresentatives(parsed);
        } catch (e) {
          console.error(e);
        }
      }
    };

    window.addEventListener("dastavval_reps_updated", handleRepsUpdated);
    return () => window.removeEventListener("dastavval_reps_updated", handleRepsUpdated);
  }, []);

  const filteredReps = representatives.filter(rep => 
    rep.city.includes(searchTerm) || 
    rep.name.includes(searchTerm) || 
    rep.address.includes(searchTerm)
  );

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 300;
      // standard scrollBy on RTL viewport: negative scrolls left (towards end)
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const handleCallbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone.length < 10) return;
    setLoading(true);
    try {
      await addCallbackRequest(phone, "مشاوره عمومی (صفحه اصلی)");
      setLoading(false);
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setPhone('');
      }, 5000);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  return (
    <div id="contact-section" className="mt-16 mb-0 pb-0 w-full" dir="rtl">
      {/* Top Card is wrapped in max-w-7xl to align with other grid contents */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Card: Contact info & Callback form */}
        <div className="p-6 md:p-10 rounded-t-3xl bg-gradient-to-br from-slate-50 via-white to-slate-50 border border-slate-200 shadow-[0_24px_50px_rgba(16,185,129,0.06)] border-b-0 relative overflow-hidden">
        
        {/* Subtle glowing background effects */}
        <div className="absolute top-0 left-1/4 w-72 h-72 bg-emerald-500/5 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-teal-500/5 rounded-full blur-[80px] pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Right Column: Title and Direct Call cards (7 cols) */}
          <div className="lg:col-span-7 space-y-6 text-right">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-[10px] font-black uppercase tracking-widest border border-emerald-500/15">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                پشتیبانی آنلاین و ۲۴ ساعته
              </div>
              <h2 className="text-xl md font-black tracking-tight leading-tight">
                <span className="block text-slate-900">ارتباط مستقیم با شبکه تامین</span>
                <span className="bg-gradient-to-l from-emerald-500 to-teal-500 bg-clip-text text-transparent mt-1 block">دست اول همواره پاسخگوی شماست</span>
              </h2>
              <p className="text-xs font-bold text-slate-500 leading-relaxed max-w-lg">
                بدون واسطه خرید کنید و بدون واسطه راهنمایی بگیرید. کارشناسان تخصصی بخش‌های تامین و تدارکات آماده شنیدن صدای گرم شما هستند.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Unit 1: Sales */}
              <a 
                href="tel:09999123001"
                className="p-4 rounded-2xl bg-white/70 border border-slate-200 hover:bg-slate-50 transition-all duration-300 group block relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500" />
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/10 flex items-center justify-center text-emerald-600 shrink-0 group-hover:scale-110 transition-all duration-300">
                     <Phone size={18} />
                  </div>
                  <div>
                     <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 text-[8.5px] font-black">
                       <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                       استعلام سریع و سفارش
                     </span>
                     <h4 className="text-xs md font-black text-slate-800 mt-1">بخش تامین و بازرگانی</h4>
                     <p className="text-xs font-black text-emerald-600 tracking-wider mt-1 font-mono">۰۹۹۹ ۹۱۲ ۳۰۰۱</p>
                  </div>
                </div>
              </a>

              {/* Unit 2: Support */}
              <a 
                href="tel:09999123001"
                className="p-4 rounded-2xl bg-white/70 border border-slate-200 hover:bg-slate-50 transition-all duration-300 group block relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-1.5 h-full bg-teal-500" />
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-teal-500/10 border border-teal-500/10 flex items-center justify-center text-teal-600 shrink-0 group-hover:scale-110 transition-all duration-300">
                     <Phone size={18} />
                  </div>
                  <div>
                     <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-teal-500/10 text-teal-600 text-[8.5px] font-black">
                       <span className="w-1 h-1 rounded-full bg-teal-500 animate-pulse" />
                       پیگیری بار ۲۴ ساعته
                     </span>
                     <h4 className="text-xs md font-black text-slate-800 mt-1">پشتیبانی ارسال و ترابری بار</h4>
                     <p className="text-xs font-black text-teal-600 tracking-wider mt-1 font-mono">۰۹۹۹ ۹۱۲ ۳۰۰۱</p>
                  </div>
                </div>
              </a>
            </div>
          </div>

          {/* Left Column: Direct Call-back form (No tabs, highly polished!) */}
          <div className="lg:col-span-5 h-full flex flex-col justify-center">
            <div className="p-5 md:p-6 rounded-2xl border bg-white border-slate-200 shadow-md relative overflow-hidden flex flex-col min-h-[220px] justify-center text-right">
              
              <AnimatePresence mode="wait">
                {!submitted ? (
                  <motion.div
                    key="callback-form-only"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                        <Send size={15} className="animate-pulse" />
                      </div>
                      <div>
                        <h4 className="text-xs md font-black text-slate-900">درخواست تماس فوری و مشاوره</h4>
                        <p className="text-[10px] text-slate-400 font-bold mt-0.5">شماره موبایل خود را وارد کنید تا کارشناسان دست اول تا ۱۵ دقیقه دیگر با شما تماس بگیرند.</p>
                      </div>
                    </div>

                    <form onSubmit={handleCallbackSubmit} className="space-y-3">
                      <div className="relative">
                        <input
                          type="tel"
                          required
                          value={phone}
                          onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
                          placeholder="مثال: ۰۹۱۲۳۴۵۶۷۸۹"
                          className="w-full py-2.5 px-4 rounded-xl text-right text-xs font-bold font-mono border transition-all outline-none bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400 focus:border-emerald-500"
                        />
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[9px] text-slate-400 font-bold pointer-events-none">شماره موبایل</span>
                      </div>

                      <button
                        type="submit"
                        disabled={loading || phone.length < 10}
                        className={`w-full py-2.5 rounded-xl text-xs font-black text-white flex items-center justify-center gap-1.5 transition-all shadow-md ${
                          phone.length < 10 
                            ? 'bg-slate-400 cursor-not-allowed opacity-50' 
                            : 'bg-gradient-to-l from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 cursor-pointer shadow-emerald-500/20'
                        }`}
                      >
                        {loading ? (
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <>
                            <span>تماس فوری با من</span>
                            <Phone size={13} />
                          </>
                        )}
                      </button>
                    </form>
                  </motion.div>
                ) : (
                  <motion.div
                    key="callback-form-success"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="flex flex-col items-center justify-center text-center space-y-3 py-4"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: [0, 1.2, 1] }}
                      transition={{ duration: 0.4 }}
                      className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center justify-center"
                    >
                      <CheckCircle2 size={24} />
                    </motion.div>
                    <div className="space-y-1">
                      <h4 className="text-xs md font-black text-emerald-600">درخواست شما با موفقیت ثبت شد</h4>
                      <p className="text-[10px] md text-slate-500 font-bold max-w-xs leading-relaxed">
                        کارشناسان پشتیبانی دست اول تا حداکثر <span className="text-emerald-600 font-black">۱۵ دقیقه آینده</span> با شماره شما تماس خواهند گرفت. از همراهی شما سپاسگزاریم!
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

            </div>
          </div>

        </div>
      </div>

      {/* Close the max-w-7xl Top Card wrapper so the Bottom Panel can go full-width screen size */}
      </div>

      {/* Bottom Panel: Creative, Beautiful Horizontal Sliding Representatives List */}
      {/* This stretches full width, stitches seamlessly with the top card, and touches the footer below. */}
      <div className="border border-t-0 border-b-0 rounded-b-none w-full bg-slate-50 border-slate-200 relative overflow-hidden text-right py-8">
        
        {/* Inner container to center-align the sliding reps list inside the full-width block */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Subtle decorative background glow */}
        <div className="absolute right-0 bottom-0 w-48 h-48 bg-emerald-500/[0.03] rounded-full blur-[40px] pointer-events-none" />

        {/* Section Header with Live Search & Arrows */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-5 border-b border-slate-100 pb-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/15 flex items-center justify-center text-emerald-600">
                <Building2 size={14} />
              </div>
              <h3 className="text-xs md:text-sm font-black text-slate-850">
                لیست دفاتر و نمایندگان رسمی توزیع سراسری دست اول
              </h3>
            </div>
            <p className="text-[10px] text-slate-400 font-bold">
              برای ارتباط مستقیم و دریافت فاکتور فیزیکی معتبر با نزدیک‌ترین دفتر استان خود تماس حاصل فرمایید.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto shrink-0">
            {/* Elegant compact Search box */}
            <div className="relative w-full sm:w-48 md:w-56">
              <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="جستجوی شهر، استان یا نام..."
                className="w-full py-1.5 pr-8 pl-6 rounded-lg text-right text-[10px] font-bold border transition-all outline-none bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-emerald-500/50 shadow-inner"
              />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-[9px] font-black"
                >
                  حذف
                </button>
              )}
            </div>

            {/* Slider Controls */}
            <div className="flex gap-1 shrink-0">
              <button 
                onClick={() => scroll('right')} 
                className="w-8 h-8 rounded-lg border flex items-center justify-center transition-all cursor-pointer border-slate-200 bg-white text-slate-500 hover:text-emerald-600 hover:bg-slate-50 shadow-sm"
                title="بعدی"
              >
                <ChevronRight size={15} />
              </button>
              <button 
                onClick={() => scroll('left')} 
                className="w-8 h-8 rounded-lg border flex items-center justify-center transition-all cursor-pointer border-slate-200 bg-white text-slate-500 hover:text-emerald-600 hover:bg-slate-50 shadow-sm"
                title="قبلی"
              >
                <ChevronLeft size={15} />
              </button>
            </div>
          </div>
        </div>

        {/* Horizontal Slider Area */}
        <div 
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory scroll-smooth no-scrollbar select-none cursor-grab active:cursor-grabbing"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {filteredReps.length > 0 ? (
            filteredReps.map((rep, idx) => {
              const cleanName = rep.name.replace(/^(حاج\s+|مهندس\s+|آقای\s+|خانم\s+)/, "");
              const initialChar = cleanName.charAt(0) || "👤";
              return (
                <div 
                  key={`info-rep-${rep.city}-${rep.name}-${idx}`}
                  className="w-[260px] md:w-[290px] shrink-0 snap-start p-4 rounded-xl border text-right transition-all duration-300 hover:translate-y-[-2px] bg-white border-slate-100/90 hover:border-emerald-500/20 hover:shadow-md shadow-sm"
                >
                  {/* Badge and Title */}
                  <div className="flex justify-between items-center gap-2 mb-3">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 text-[9px] font-black">
                      <MapPin size={9} />
                      {rep.city}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-500/10 text-slate-500 text-[9px] font-black">
                      دفتر توزیع مستقیم
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5 mb-2.5">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-500/10 to-teal-500/10 text-emerald-600 flex items-center justify-center text-[11px] font-black shrink-0 border border-emerald-500/15">
                      {initialChar}
                    </div>
                    <h4 className="text-[11px] font-black text-slate-850">
                      {rep.name}
                    </h4>
                  </div>

                  <p className="text-[9.5px] text-slate-500 font-bold leading-relaxed mb-3 flex items-start gap-1 min-h-[36px]">
                    <MapPin size={10} className="text-slate-400 shrink-0 mt-0.5" />
                    <span>{rep.address}</span>
                  </p>

                  {/* Direct Calling strip */}
                  <div className="flex justify-between items-center p-2 rounded-lg border bg-slate-50/70 border-slate-100">
                    {(() => {
                      const isAuthorized = userBadge === 'admin' || (userCity && rep.city.includes(userCity)) || (userCity && userCity.includes(rep.city));
                      return (
                        <>
                          <span className={`text-[10px] font-black font-mono transition-all ${isAuthorized ? 'text-emerald-600' : 'text-slate-400 blur-[3px] select-none'}`}>
                            {isAuthorized ? rep.phone : (rep.phone ? rep.phone.replace(/\d/g, "*") : "***********")}
                          </span>
                          {isAuthorized ? (
                            <a 
                              href={`tel:${rep.tel}`}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-gradient-to-l from-emerald-600 to-teal-500 text-white hover:from-emerald-500 hover:to-teal-400 text-[9px] font-black transition-all cursor-pointer shadow-sm shadow-emerald-600/10"
                            >
                              <Phone size={9} />
                              تماس مستقیم
                            </a>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                alert("🔒 دسترسی به شماره تماس نمایندگان تنها برای کاربرانی مجاز است که شهر ثبت‌نامی آنها با منطقه تحت پوشش نماینده یکسان باشد.");
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-purple-600 hover:bg-purple-700 text-white text-[9px] font-black transition-all cursor-pointer shadow-sm shadow-purple-600/10"
                            >
                              <Phone size={9} />
                              اطلاعات VIP
                            </button>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="w-full text-center py-8 space-y-2 flex flex-col items-center justify-center">
              <span className="text-xl">🔍</span>
              <p className="text-[10px] text-slate-400 font-bold">نماینده‌ای با مشخصات مورد نظر یافت نشد.</p>
            </div>
          )}
        </div>

        {/* Close the inner container of the Bottom Panel */}
        </div>

      </div>
    </div>
  );
}

export function TermsAndRulesSection({ theme }: { theme: 'light' | 'dark' | 'classic' }) {
  const [openIndex, setOpenIndex] = React.useState<number | null>(0);

  const rules = [
    {
      title: "قوانین اصالت برند، تایید مجوز و عضویت همکاران",
      desc: "تنها اشخاص حقیقی یا حقوقی که دارای پروانه کسب معتبر از نهادهای مربوطه، سوپرمارکت‌داران، بنکداران یا مدارک ثبتی شرکت پخش فعال باشند می‌توانند به عنوان خریدار عمده ثبت نام کنند. تمامی مدارک پیوست شده در پنل ادمین بررسی و پس از احراز هویت، اجازه دسترسی به نرخ‌های کارخانه‌ای و فاکتور رسمی تایید می‌شود.",
      icon: "📜"
    },
    {
      title: "شرایط تسویه حساب، تضمین امانی وجه",
      desc: "به منظور تامین امنیت کامل معامله، مبالغ واریز شده توسط خریداران در حساب امانی واسط دست اول نگهداری می‌شود. کارخانه موظف است طبق تعهد زمانی بار را بارگیری کند. پس از تحویل کالا و تایید سلامت آن توسط خریدار (یا حداکثر ۷۲ ساعت پس از تایید تحویل بارنامه دولتی)، کل وجه به حساب کارخانه واریز می‌گردد.",
      icon: "🔒"
    },
    {
      title: "قوانین پلمپ گمرکی، ترانزیت دولتی و بیمه حمل جاده‌ای",
      desc: "تمامی ارسال‌های بار مستقیماً از خط تولید کارخانه با بارنامه رسمی دولتی و پلمپ سربی شرکتی صادر می‌گردد. رانندگان موظف به رعایت پروتکل بهداشتی ترانزیت مواد غذایی هستند. کلیه محموله‌ها از لحظه خروج از درب کارخانه تا مقصد نهایی تحت پوشش بیمه کامل مسئولیت مدنی و حوادث باربری جاده‌ای قرار دارند.",
      icon: "🚚"
    },
    {
      title: "شرایط کسری بار، معیوب بودن و عودت محصولات فاسد شدنی",
      desc: "در صورت بروز هرگونه شکستگی، پارگی بسته‌بندی یا کسری بار در زمان تخلیه، خریدار موظف است موضوع را در حضور نماینده باربری صورتجلسه کرده و تصاویر آن را در پرتال کاربری آپلود کند. کارخانجات متعهد به جبران ۱۰۰ درصد خسارت‌های وارده و یا عودت بار و ارسال مجدد بدون دریافت هزینه اضافه در کوتاه‌ترین زمان ممکن هستند.",
      icon: "🛡️"
    }
  ];

  return (
    <div className={`p-6 sm:p-8 rounded-[2rem] border text-right space-y-6 ${
      theme === 'dark' ? 'bg-white/40 border-slate-800' : 'bg-gradient-to-br from-teal-500/[0.04] via-teal-500/[0.01] to-blue-500/[0.04] border-teal-200/50 shadow-sm'
    }`} dir="rtl">
      <div className="space-y-1">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
          <Gavel size={12} />
          آیین‌نامه انضباطی و تعاونی
        </div>
        <h3 className={`text-lg sm font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>شرایط، قوانین و پروتکل‌های حقوقی دست اول</h3>
        <p className="text-xs text-slate-400 font-bold">مقررات رسمی حاکم بر زنجیره تامین مستقیم و نحوه تضمین سلامت معاملات عمده.</p>
      </div>

      <div className="space-y-3 pt-2">
        {rules.map((rule, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div 
              key={`info-rule-${rule.title}-${idx}`}
              className={`rounded-2xl border transition-all overflow-hidden ${
                isOpen 
                  ? theme === 'dark' ? 'bg-slate-50 border-emerald-500/35' : 'bg-white border-emerald-500/25 shadow-md shadow-emerald-500/5' 
                  : theme === 'dark' ? 'bg-white/20 border-slate-800 hover' : 'bg-white border-slate-150 hover'
              }`}
            >
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : idx)}
                className="w-full px-5 py-4 flex items-center justify-between gap-4 font-black text-xs sm text-right text-slate-800 cursor-pointer animate-none bg-transparent border-none"
              >
                <span className="text-slate-400 text-xs">{isOpen ? "▲" : "▼"}</span>
                <div className="flex items-center gap-3 justify-end text-right">
                  <span>{rule.title}</span>
                  <span className="text-base select-none shrink-0">{rule.icon}</span>
                </div>
              </button>
              
              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="border-t border-slate-100 px-5 py-4 text-[11px] sm font-bold leading-relaxed text-slate-500 bg-slate-50/50"
                  >
                    {rule.desc}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
