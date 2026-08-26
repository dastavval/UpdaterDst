import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  GraduationCap,
  BookOpen,
  CheckCircle2,
  HelpCircle,
  Truck,
  ShieldCheck,
  CreditCard,
  Building2,
  Package,
  Layers,
  ChevronDown,
  ArrowRight,
  TrendingUp,
  Percent,
  Award,
  Download,
  Share2,
  PhoneCall,
  Sparkles,
  FileCheck2,
  Receipt,
  Store,
  Users,
  Search,
  Check,
  Info,
  Clock
} from "lucide-react";

interface ComprehensiveSystemGuideProps {
  onSwitchTab?: (tab: string) => void;
  userBadge?: string;
}

export function ComprehensiveSystemGuide({ onSwitchTab, userBadge }: ComprehensiveSystemGuideProps) {
  const [activeCategory, setActiveCategory] = useState<'all' | 'buyer' | 'payment' | 'logistics' | 'dealership' | 'faq'>('all');
  const [completedSteps, setCompletedSteps] = useState<number[]>([1]);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const toggleStep = (id: number) => {
    if (completedSteps.includes(id)) {
      setCompletedSteps(completedSteps.filter(s => s !== id));
    } else {
      setCompletedSteps([...completedSteps, id]);
    }
  };

  const guideSections = [
    {
      id: 1,
      category: 'buyer',
      badge: "گام اول",
      title: "راهنمای کامل ثبت سفارش و خرید عمده مستقیم از کارخانجات",
      duration: "۵ دقیقه مطالعه",
      icon: <Package className="w-5 h-5 text-emerald-600" />,
      steps: [
        {
          title: "۱. انتخاب کالا و بررسی مشخصات فنی و بسته‌بندی",
          desc: "در بخش «خرید مستقیم» یا «کارخانجات»، محصولات را بر اساس برند، دسته‌بندی یا حداقل تیراژ سفارش (MOQ) فیلتر نمایید. تعداد عدد در هر کارتن، وزن، تاریخ انقضا و نرخ مصرف‌کننده روی جلد با شفافیت ۱۰۰٪ درج شده است."
        },
        {
          title: "۲. تعیین تعداد کارتن و محاسبه خودکار تخفیف پله‌ای",
          desc: "با افزایش تعداد کارتن، سیستم به صورت هوشمند تخفیفات پلکانی خرید حجمی و نرخ نهایی کف بازار را محاسبه کرده و حاشیه سود ناخالص فروشگاه شما را نمایش می‌دهد."
        },
        {
          title: "۳. افزودن به سبد خرید و تعیین آدرس تخلیه بار",
          desc: "آدرس دقیق فروشگاه یا انبار، کدپستی و شماره تماس تحویل‌گیرنده را وارد کنید. سیستم نزدیک‌ترین انبار کارخانه یا نمایندگی رسمی شهر شما را برای ارسال انتخاب می‌کند."
        }
      ],
      proTip: "💡 نکته کلیدی سودآوری: با تجمیع سفارش چند قلم کالا از یک هلدینگ یا کارخانه، هزینه باربری جاده‌ای به ازای هر کارتن تا ۶۵٪ کاهش می‌یابد."
    },
    {
      id: 2,
      category: 'payment',
      badge: "گام دوم",
      title: "روش‌های پرداخت، حساب امانی امن و شرایط تسویه چکی صیادی",
      duration: "۷ دقیقه مطالعه",
      icon: <CreditCard className="w-5 h-5 text-blue-600" />,
      steps: [
        {
          title: "۱. پرداخت نقدی و درگاه امن شتابی (شامل تخفیف نقدی آنی)",
          desc: "پرداخت مستقیم از طریق درگاه‌های شاپرکی معتبر. خریدهای نقدی مشمول بالاترین درصد تخفیف ویژه نقدی خط تولید می‌گردند."
        },
        {
          title: "۲. سیستم تضمین امانی دست اول (Safe-Buy Escrow)",
          desc: "وجه پرداختی شما در صندوق امانی پلتفرم قفل می‌شود و تنها پس از اینکه باربری محموله را در سلامت کامل تحویل شما داد و شما در سایت «تایید تحویل» زدید، با کارخانه تسویه می‌شود."
        },
        {
          title: "۳. خرید اعتباری با چک صیادی بنفش (کارمزد ۰٪)",
          desc: "همکاران دارای رتبه اعتباری نقره‌ای، طلایی و VIP می‌توانند خریدهای عمده خود را به صورت چک‌های ۳۰ الی ۹۰ روزه صیادی ثبت نمایند. استعلام چک به صورت برخط و آنی در کمتر از ۲ دقیقه انجام می‌گیرد."
        }
      ],
      proTip: "🔒 امنیت تضمین‌شده: در صورت هرگونه مغایرت در تعداد یا سلامت کارتن‌ها، وجه تا رفع کامل مشکل به حساب خریدار عودت داده می‌شود."
    },
    {
      id: 3,
      category: 'logistics',
      badge: "گام سوم",
      title: "لجستیک، حمل‌ونقل جاده‌ای، بیمه‌نامه و تحویل کالا درب انبار",
      duration: "۶ دقیقه مطالعه",
      icon: <Truck className="w-5 h-5 text-amber-600" />,
      steps: [
        {
          title: "۱. صدور بارنامه دولتی و بیمه کامل حوادث",
          desc: "تمامی بارهای ارسالی دارای بارنامه رسمی وزارت راه و شهرسازی و بیمه‌نامه ۱۰۰٪ خسارت جاده‌ای هستند."
        },
        {
          title: "۲. پلمپ سربی خودرو و ارسال پیامک مشخصات راننده",
          desc: "محموله در درب کارخانه بارگیری و با پلمپ شماره‌دار اختصاصی مهروموم می‌شود. همزمان نام راننده، شماره پلاک و شماره تماس برای تحویل‌گیرنده پیامک می‌شود."
        },
        {
          title: "۳. فرآیند بازرسی و تحویل در مقصد",
          desc: "هنگام رسیدن خودرو، ابتدا سلامت پلمپ را کنترل نموده و کارتن‌ها را تخلیه کنید. در صورت مشاهده هرگونه پارگی یا آسیب، مراتب فوراً در بارنامه قید و فوتوگرافی می‌شود."
        }
      ],
      proTip: "🚚 هماهنگی تخلیه: پیش از رسیدن راننده، پیامک زمان تقریبی ورود ارسال می‌شود تا کارگر تخلیه و فضای انبار آماده باشد."
    },
    {
      id: 4,
      category: 'dealership',
      badge: "گام چهارم",
      title: "کسب درآمد، نمایندگی استانی، پورسانت بازاریابی و عاملیت فروش",
      duration: "۸ دقیقه مطالعه",
      icon: <TrendingUp className="w-5 h-5 text-purple-600" />,
      steps: [
        {
          title: "۱. دریافت عاملیت رسمی توزیع و نمایندگی منطقه",
          desc: "بنکداران، شرکت‌های پخش و فعالان باسابقه می‌توانند با تکمیل فرم درخواست نمایندگی، حقوق توزیع انحصاری برندهای معتبر را در شهر یا استان خود اخذ نمایند."
        },
        {
          title: "۲. سیستم کدهای معرف و سود مادام‌العمر (Referral)",
          desc: "با معرفی سوپرمارکت‌ها و فروشگاه‌های محله خود، به ازای هر خرید آنها به صورت همیشگی بین ۱ تا ۳ درصد از ارزش فاکتور به کیف پول شما واریز می‌شود."
        },
        {
          title: "۳. دانلود کاتالوگ الکترونیک و قیمت‌گذاری اختصاصی برای ویزیتورها",
          desc: "ویزیتورها می‌توانند با دانلود PDF کاتالوگ با فرمت چاپ رسمی و مشخصات فروشگاهی خود، به صورت میدانی سفارش‌گیری کنند."
        }
      ],
      proTip: "🎖️ رتبه‌بندی اعتباری: با فعالیت مستمر، نشان‌های اعتباری طلایی و VIP فعال شده و اعتبار اسنادی میلیاردی به شما تعلق می‌گیرد."
    }
  ];

  const faqList = [
    {
      q: "حداقل میزان سفارش (MOQ) در سامانه دست اول چقدر است؟",
      a: "حداقل خرید بر اساس سیاست هر کارخانه بر حسب کارتن تعریف شده است (معمولاً بین ۲ تا ۱۰ کارتن برای خرده‌فروشان و پالت/خاور برای بنکداران). شما مجبور به خرید یک تریلی کامل نیستید و می‌توانید سفارشات کارتنی خرد را با قیمت درب کارخانه تحویل بگیرید."
    },
    {
      q: "آیا برای خریدها فاکتور رسمی دارایی و ارزش افزوده صادر می‌شود؟",
      a: "بله، ۱۰۰٪ سفارشات سامانه دست اول با صدور فاکتور معتبر رسمی شرکتی و ثبت در سامانه مودیان مالیاتی ارائه می‌شوند و برای شرکت‌ها، سازمان‌ها و فروشگاه‌ها کاملاً قابل استناد قانونی است."
    },
    {
      q: "چگونه می‌توانم خریدم را با چک صیادی پرداخت کنم؟",
      a: "در مرحله پرداخت فاکتور، گزینه «پرداخت با چک صیادی» را انتخاب کنید. شناسه صیادی ۱۶ رقمی چک را وارد نمایید. پس از استعلام خودکار سفید بودن وضعیت حساب بانکی، چک شما تایید و کالا بارگیری می‌شود."
    },
    {
      q: "اگر بار در جاده آسیب ببیند یا مغایرت داشته باشد چه می‌شود؟",
      a: "تمامی مرسولات دارای بیمه کامل باربری هستند. علاوه بر این، وجه شما در حساب امانی محفوظ است. کافی است در حضور راننده با پشتیبانی ۲۴ ساعته تماس بگیرید تا کسر بار یا خسارت بلافاصله جبران شود."
    },
    {
      q: "تفاوت قیمت دست اول با بازار عمده‌فروشان سنتی چقدر است؟",
      a: "به دلیل حذف حداقل ۳ لایه واسطه، حق‌العمل‌کار و بنکدار سنتی، قیمت تمام‌شده در دست اول بین ۸ الی ۲۵ درصد ارزان‌تر از میدان‌های سنتی است و مستقیماً از خط تولید کارخانه با آخرین تاریخ روز ارسال می‌شود."
    }
  ];

  const filteredSections = guideSections.filter(sec => {
    if (activeCategory !== 'all' && sec.category !== activeCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = sec.title.toLowerCase().includes(q);
      const matchSteps = sec.steps.some(s => s.title.toLowerCase().includes(q) || s.desc.toLowerCase().includes(q));
      return matchTitle || matchSteps;
    }
    return true;
  });

  const progressPercentage = Math.round((completedSteps.length / guideSections.length) * 100);

  return (
    <div className="space-y-6 text-right font-sans" dir="rtl">
      
      {/* 1. Pure White High-Contrast Hero Banner */}
      <div className="bg-white border border-slate-200/90 rounded-[2rem] p-6 sm:p-8 text-slate-900 shadow-xs relative overflow-hidden">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 relative z-10">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-[11px] font-black">
              <GraduationCap size={15} className="text-emerald-600" />
              <span>راهنمای جامع، مصور و آکادمی معاملات دست اول</span>
            </div>
            
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 leading-tight">
              راهنمای گام‌به‌گام کار با سامانه ملی دست اول
            </h1>
            
            <p className="text-xs sm:text-sm text-slate-600 font-bold leading-relaxed">
              آموزش جامع صفر تا صد: از نحوه انتخاب کالا، ثبت سفارش کارتنی عمده با نرخ کارخانه، تا روش‌های تسویه امن امانی، خرید چکی و تحویل با بارنامه رسمی.
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-2">
              <span className="text-[11px] bg-slate-100 text-slate-700 px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5">
                <CheckCircle2 size={13} className="text-emerald-600" />
                خرید مستقیم بدون واسطه
              </span>
              <span className="text-[11px] bg-slate-100 text-slate-700 px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5">
                <ShieldCheck size={13} className="text-blue-600" />
                تضمین امانی ۱۰۰٪ وجه
              </span>
              <span className="text-[11px] bg-slate-100 text-slate-700 px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5">
                <CreditCard size={13} className="text-purple-600" />
                تسویه اعتباری و چکی
              </span>
            </div>
          </div>

          {/* Progress Card */}
          <div className="w-full lg:w-72 bg-slate-50 border border-slate-200 p-5 rounded-2xl flex flex-col items-center text-center space-y-3 shrink-0">
            <div className="flex items-center justify-between w-full">
              <span className="text-[11px] font-black text-slate-500">میزان یادگیری شما:</span>
              <span className="text-base font-black text-emerald-600">{progressPercentage}%</span>
            </div>

            <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
              <div 
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>

            <p className="text-[10px] text-slate-500 font-bold">
              {completedSteps.length} از {guideSections.length} فصل مطالعه شده است
            </p>

            {onSwitchTab && (
              <button
                onClick={() => onSwitchTab('order')}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <span>شروع خرید عمده در سایت</span>
                <ArrowRight size={14} className="rotate-180" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. Interactive Navigation Filters & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scroll-smooth no-scrollbar">
          {[
            { id: 'all', label: 'همه بخش‌های آموزشی' },
            { id: 'buyer', label: '🛒 راهنمای خرید کارتنی' },
            { id: 'payment', label: '💳 پرداخت امن و چک' },
            { id: 'logistics', label: '🚚 باربری و تحویل کالا' },
            { id: 'dealership', label: '💼 عاملیت و کسب سود' },
            { id: 'faq', label: '❓ سوالات متداول' }
          ].map((cat) => (
            <button
              key={`guide-cat-${cat.id}`}
              onClick={() => setActiveCategory(cat.id as any)}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all shrink-0 cursor-pointer border ${
                activeCategory === cat.id
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search Box */}
        <div className="relative w-full sm:w-64">
          <input 
            type="text"
            placeholder="جستجو در موضوعات راهنما..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 font-bold"
          />
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
        </div>
      </div>

      {/* 3. Comprehensive Interactive Chapters */}
      {activeCategory !== 'faq' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            {filteredSections.map((section) => {
              const isCompleted = completedSteps.includes(section.id);
              return (
                <div 
                  key={`guide-section-${section.id}`}
                  className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-7 shadow-xs space-y-5 transition-all hover:border-slate-300"
                >
                  {/* Header of Section */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                        {section.icon}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] bg-slate-100 text-slate-700 font-black px-2 py-0.5 rounded-md">
                            {section.badge}
                          </span>
                          <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                            <Clock size={11} />
                            {section.duration}
                          </span>
                        </div>
                        <h2 className="text-base sm:text-lg font-black text-slate-900 mt-1">
                          {section.title}
                        </h2>
                      </div>
                    </div>

                    <button
                      onClick={() => toggleStep(section.id)}
                      className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 border cursor-pointer shrink-0 ${
                        isCompleted
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <Check size={14} className={isCompleted ? 'text-emerald-600' : 'text-slate-400'} />
                      <span>{isCompleted ? "✓ این فصل را فرا گرفتم" : "علامت به عنوان خوانده شده"}</span>
                    </button>
                  </div>

                  {/* Step Cards Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {section.steps.map((step, sIdx) => (
                      <div 
                        key={`guide-step-${section.id}-${sIdx}`}
                        className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 space-y-2 text-right"
                      >
                        <h3 className="text-xs font-black text-slate-900 leading-snug">
                          {step.title}
                        </h3>
                        <p className="text-[11px] text-slate-600 font-bold leading-relaxed">
                          {step.desc}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Pro Tip Box */}
                  <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3.5 text-xs text-amber-900 font-bold leading-relaxed">
                    {section.proTip}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. Frequently Asked Questions Section */}
      {(activeCategory === 'all' || activeCategory === 'faq') && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-5">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-black">
              <HelpCircle size={20} />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900">پرسش‌های پرتکرار همکاران و خریداران</h2>
              <p className="text-[11px] text-slate-500 font-bold">پاسخ شفاف به مهم‌ترین سوالات پیرامون روند خرید و تحویل کالا</p>
            </div>
          </div>

          <div className="space-y-3">
            {faqList.map((item, idx) => {
              const isOpen = expandedFaq === idx;
              return (
                <div 
                  key={`faq-guide-${idx}`}
                  className="border border-slate-200 rounded-xl overflow-hidden transition-colors"
                >
                  <button
                    onClick={() => setExpandedFaq(isOpen ? null : idx)}
                    className="w-full p-4 text-right flex items-center justify-between gap-3 bg-slate-50/50 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <span className="text-xs sm:text-sm font-black text-slate-850">{item.q}</span>
                    <ChevronDown size={16} className={`text-slate-400 transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="p-4 bg-white border-t border-slate-100 text-xs text-slate-600 font-bold leading-relaxed"
                      >
                        {item.a}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. Direct Support & Quick Action Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1 text-center sm:text-right">
          <h3 className="text-sm sm:text-base font-black text-white">نیاز به راهنمایی تلفنی یا مشاوره خرید حجمی دارید؟</h3>
          <p className="text-xs text-slate-300 font-bold">کارشناسان زنجیره تامین دست اول به صورت ۲۴ ساعته پاسخگوی سوالات شما هستند.</p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <a
            href="tel:02191000000"
            className="px-4 py-2.5 bg-white text-slate-900 rounded-xl text-xs font-black hover:bg-slate-100 transition-all flex items-center gap-2"
          >
            <PhoneCall size={14} className="text-emerald-600" />
            <span>تماس با واحد پشتیبانی</span>
          </a>
          
          {onSwitchTab && (
            <button
              onClick={() => onSwitchTab('order')}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all cursor-pointer"
            >
              مشاهده محصولات و سفارش
            </button>
          )}
        </div>
      </div>

    </div>
  );
}
