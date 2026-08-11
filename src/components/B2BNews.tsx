import { useState, useEffect } from "react";
import { 
  FileText, Calendar, Share2, Award, ChevronLeft, ArrowRight, TrendingUp, 
  Sparkles, Building2, Zap, PhoneCall, CheckCircle2, ShieldCheck, 
  ArrowLeft, BadgePercent, Volume2, Newspaper, ShoppingBag, Landmark,
  GraduationCap, HelpCircle, Lock, BookOpen, Compass
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { TermsAndRulesSection } from "./InfoSections";

interface NewsItem {
  id: string;
  title: string;
  summary: string;
  content: string;
  date: string;
  source: string;
  category: "تنظیم بازار" | "خط تولید" | "توزیع" | "گزارش مالی" | "تخفیف ویژه";
  imageUrl: string;
}

const NEWS_DATA: NewsItem[] = [
  {
    id: "news-101",
    title: "افتتاح فاز جدید خط تولید تمام‌اتوماتیک بسته‌بندی چیپس و اسنک با فناوری کنترل کیفی لیزری",
    summary: "با سرمایه‌گذاری بخش خصوصی، فاز جدید خط تولید اسنک با ظرفیت روزانه ۴,۰۰۰ کارتن به بهره‌برداری رسید. این خط قابلیت بسته‌بندی حجمی با تزریق گاز نیتروژن خلوص بالا را داراست.",
    content: "مراسم افتتاحیه فاز دوم توسعه خطوط تولید چیپس و اسنک با حضور فعالان بازار، بنکداران و نمایندگان بازرگانی برگزار شد. این پروژه با هدف ارتقای کیفیت ماندگاری کالا و کاهش ضایعات حمل و نقل جاده‌ای اجرا شده است. بر اساس توضیحات مدیر ارشد تولید، تمامی محصولات جدید با استاندارد سیب سلامت و کد رهگیری پلمپ جاده‌ای مستقیم به انبار بنکداران طرف قرارداد در سامانه دست اول ارسال خواهند شد.",
    date: "۱۲ تیر ۱۴۰۵",
    source: "روابط عمومی دست اول",
    category: "خط تولید",
    imageUrl: "https://images.unsplash.com/photo-1563227812-0ea4c22e6cc8?auto=format&fit=crop&q=80&w=800"
  },
  {
    id: "news-102",
    title: "اطلاعیه سازمان تنظیم بازار: تخصیص سهمیه ارز ترجیحی روغن و مواد اولیه صنایع غذایی",
    summary: "طبق مصوبه جدید کارگروه تنظیم بازار، سهمیه روغن خام و شکر کارخانجات صنایع غذایی فعال در سامانه توزیع مستقیم بدون واسطه تمدید گردید.",
    content: "به اطلاع تمامی بنکداران و نمایندگان پخش عمده می‌رساند، با موافقت ستاد تنظیم بازار، قیمت پایه ثبت سفارشات کیک، کلوچه و شکلات تا پایان فصل جاری ثبات داشته و هیچ‌گونه افزایش قیمتی بر روی فاکتورهای رسمی دست اول اعمال نخواهد شد. خریداران عمده می‌توانند با ثبت سفارش کارتنی از حداکثر حاشیه سود مصوب بهره‌مند شوند.",
    date: "۱۰ تیر ۱۴۰۵",
    source: "خبرگزاری صنایع غذایی",
    category: "تنظیم بازار",
    imageUrl: "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&q=80&w=800"
  },
  {
    id: "news-103",
    title: "کاهش ۱۸ درصدی هزینه‌های ترانزیت جاده‌ای با اتصال مستقیم به شبکه ترانزیت دست اول",
    summary: "گزارش عملکرد سه ماهه لجستیک نشان می‌دهد استفاده از ناوگان مسقف بیمه‌شده موجب کاهش زمان تحویل بار به سراسر کشور به کمتر از ۴۸ ساعت شده است.",
    content: "طی سه ماه گذشته بیش از ۱۲ هزار تن انواع کالاهای اساسی و تنقلات از طریق ناوبری هوشمند دست اول ارسال شده است. سیستم پلمپ سربی جاده‌ای و بیمه تمام‌خطر باربری تضمین می‌کند کالاها بدون کمترین خسارت به انبار مقصد تحویل شوند.",
    date: "۰۵ تیر ۱۴۰۵",
    source: "واحد لجستیک و ترانزیت",
    category: "توزیع",
    imageUrl: "https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&q=80&w=800"
  },
  {
    id: "news-104",
    title: "گزارش شفافیت مالی: واریز سود انباشته خریداران عمده و بنکداران به صندوق امانی",
    summary: "بررسی آماری عملکرد نشان می‌دهد حذف واسطه‌های غیرضروری بیش از ۲۴ میلیارد تومان سود مستقیم به حساب بنکداران عضو سامانه منتقل نموده است.",
    content: "سامانه دست اول با تسویه حساب امانی و صدور پیش‌فاکتور رسمی با ارزش افزوده قانونی، امکان تجارت امن و شفاف را برای تمامی بنکداران استانی فراهم کرده است. صورت‌های مالی عملکرد دوره به تایید حسابرسان رسمی رسیده است.",
    date: "۰۱ تیر ۱۴۰۵",
    source: "تحلیل‌گر مالی دست اول",
    category: "گزارش مالی",
    imageUrl: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=800"
  }
];

const FACTORIES_DATA: any[] = [
  {
    id: "fac-1",
    name: "صنایع غذایی و بسته‌بندی سالار",
    established: "۱۳۷۸",
    location: "آذربایجان شرقی، شهرک صنعتی شندآباد",
    capacity: "۵۰,۰۰۰ کارتن در ماه",
    contact: "۰۴۱۳۸۲۵۹۰۰۰",
    logo: "🏭",
    desc: "تولیدکننده تخصصی انواع کیک، کلوچه، ویفر و شکلات کاکائویی با استانداردهای ملی و بین‌المللی سیب سلامت.",
    specs: ["سیب سلامت سازمان غذا و دارو", "گواهینامه ISO 22000", "استاندارد ملی ایران", "مجوز صادرات به CIS"]
  },
  {
    id: "fac-2",
    name: "کنسروسازی و صنایع غذایی شاهین",
    established: "۱۳۸۵",
    location: "اردبیل، شهرک صنعتی شماره ۲",
    capacity: "۳۵,۰۰۰ کارتن در ماه",
    contact: "۰۴۵۳۳۵۵۴۰۰۰",
    logo: "🥫",
    desc: "تولید انواع رب گوجه‌فرنگی، کنسروجات گوشتی و غیرگوشتی، ترشیجات و مرباجات صنعتی با مواد اولیه تازه.",
    specs: ["سیب سلامت", "استاندارد ملی کیفی", "پلمپ جاده‌ای مسقف"]
  },
  {
    id: "fac-3",
    name: "صنایع آشامیدنی و نوشیدنی گوارا",
    established: "۱۳۹۱",
    location: "ارومیه، فاز ۲ شهرک صنعتی",
    capacity: "۶۰,۰۰۰ کارتن در ماه",
    contact: "۰۴۴۳۲۷۷۱۰۰۰",
    logo: "🥤",
    desc: "تولیدکننده انواع آبمیوه طبیعی تک‌نفره و خانواده، نکتار، ماءالشعیر و آب‌معدنی استاندارد.",
    specs: ["استاندارد ارگانیک", "سیب سلامت", "مجوز صادرات عراق و ترکیه"]
  }
];

interface B2BNewsProps {
  articles?: NewsItem[];
  factories?: any[];
  b2bConfig?: any;
  initialSubTab?: 'news' | 'earnings' | 'education' | 'terms';
  userBadge?: string;
  user?: any;
}

export default function B2BNews({ 
  articles = [], 
  factories = [], 
  b2bConfig, 
  initialSubTab = 'news',
  userBadge,
  user
}: B2BNewsProps) {
  const [exploreSubTab, setExploreSubTab] = useState<'news' | 'earnings' | 'education' | 'terms'>(initialSubTab);

  useEffect(() => {
    if (initialSubTab) {
      setExploreSubTab(initialSubTab);
    }
  }, [initialSubTab]);
  const [completedLessons, setCompletedLessons] = useState<number[]>([0]);
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [activeFactory, setActiveFactory] = useState<string>("all");
  const [newsFilter, setNewsFilter] = useState<string>("همه");

  // Merge dynamic articles with static NEWS_DATA, ensuring unique IDs
  const ALL_NEWS = Array.from(
    new Map([...NEWS_DATA, ...articles].map(item => [item.id, item])).values()
  );

  const filteredNews = newsFilter === "همه" 
    ? ALL_NEWS 
    : ALL_NEWS.filter(n => n.category === newsFilter);

  const ALL_FACTORIES = factories.length > 0 ? factories : (b2bConfig?.factories || FACTORIES_DATA);

  const filteredFactories = activeFactory === "all"
    ? ALL_FACTORIES
    : ALL_FACTORIES.filter(f => f.id === activeFactory);

  const handleShare = (news: NewsItem) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(`${window.location.origin}/#news-${news.id}`);
      alert("لینک این تحلیل و خبر با موفقیت کپی شد. می‌توانید برای همکاران بفرستید!");
    }
  };

  const triggerWholesaleTab = () => {
    // Dispatch events to switch tab
    const event = new CustomEvent("switch-tab", { detail: "order" });
    window.dispatchEvent(event);
  };

  return (
    <div className="space-y-8 py-2 text-right" dir="rtl">
      
      {/* --- ANDROID-STYLE SUB-TABS SELECTOR --- */}
      <div className="bg-slate-100 p-1 rounded-2xl flex items-center justify-between gap-1 max-w-2xl mx-auto border border-slate-200/50">
        <button
          onClick={() => setExploreSubTab('news')}
          className={`flex-1 py-2.5 px-1 rounded-xl text-[10px] sm font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            exploreSubTab === 'news'
              ? 'bg-white text-emerald-600 shadow-md shadow-emerald-500/5'
              : 'text-slate-500 hover'
          }`}
        >
          <Compass size={14} />
          <span>اخبار و تولیدی‌ها</span>
        </button>
        <button
          onClick={() => setExploreSubTab('education')}
          className={`flex-1 py-2.5 px-1 rounded-xl text-[10px] sm font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            exploreSubTab === 'education'
              ? 'bg-white text-emerald-600 shadow-md shadow-emerald-500/5'
              : 'text-slate-500 hover'
          }`}
        >
          <GraduationCap size={14} />
          <span>آموزش و هدایت</span>
        </button>
        <button
          onClick={() => setExploreSubTab('terms')}
          className={`flex-1 py-2.5 px-1 rounded-xl text-[10px] sm font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            exploreSubTab === 'terms'
              ? 'bg-white text-emerald-600 shadow-md shadow-emerald-500/5'
              : 'text-slate-500 hover'
          }`}
        >
          <ShieldCheck size={14} />
          <span>شرایط و قوانین</span>
        </button>
      </div>

      {exploreSubTab === 'news' && (
        <>
          {/* --- HERO HEADER: EXPLORE & FACTORY HUB --- */}
      <section className="relative rounded-[2.5rem] bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-950 border border-emerald-800/40 p-6 sm:p-10 overflow-hidden shadow-2xl text-white">
        <div className="absolute top-[-30%] left-[-20%] w-[70%] h-[70%] bg-emerald-500/15 rounded-full blur-[140px] pointer-events-none animate-pulse" />
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
          <div className="lg:col-span-8 space-y-4">
            <div className="inline-flex items-center gap-2 bg-emerald-500/20 border border-emerald-500/35 px-4 py-1.5 rounded-full text-emerald-300 text-[10px] font-black uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              رصدخانه هوشمند خطوط تولید و زنجیره تامین
            </div>

            <h1 className="text-2xl sm font-black leading-tight">
              شناسایی <span className="text-emerald-400">تولیدی‌های برتر</span> <br />
              و کاتالوگ محصولات واقعی
            </h1>

            <p className="text-slate-300 text-xs sm font-medium leading-relaxed max-w-xl">
            در این بخش می‌توانید اطلاعات کارخانه‌ها، ظرفیت تولید و جدیدترین اخبار بازار را رصد کنید. سامانه تحلیل‌گر هوشمند دست اول به شما کمک می‌کند تا مستقیم و با آگاهی کامل خرید کنید.
            </p>
          </div>

          {/* AI Advisor Card */}
          <div className="lg:col-span-4 bg-white/5 backdrop-blur-md rounded-3xl p-5 border border-white/10 flex flex-col items-center text-center space-y-3 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-400/10 rounded-full blur-2xl" />
            
            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20 text-3xl relative animate-pulse shadow-xl text-emerald-400">
              🧠
            </div>

            <div className="space-y-1">
              <div className="text-[10px] bg-emerald-400 text-slate-950 px-3 py-0.5 rounded-full font-black inline-block">
                دستیار هوش مصنوعی تجاری
              </div>
              <h4 className="text-sm font-black text-white">«خطوط تولید را شفاف رصد کنید!»</h4>
              <p className="text-[10px] text-emerald-100/90 leading-relaxed font-bold">
                سیستم هوش مصنوعی دست اول وضعیت موجودی مواد خام کارخانه‌ها، مجوزهای حمل و پلمپ جاده‌ای را پایش کرده و بهترین زمان ثبت فاکتور مستقیم را پیشنهاد می‌دهد.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* --- GOLDEN VIP ADVERTISEMENT SPOT (جایگاه ویژه تبلیغات طلایی) --- */}
      {b2bConfig?.showTopAnnouncement && b2bConfig?.topAnnouncement && (
        <section className="relative rounded-[2rem] p-6 sm:p-8 bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 border-2 border-emerald-400/50 overflow-hidden shadow-2xl text-white group">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6 relative z-10">
            <div className="space-y-4 text-right">
              <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-md border border-white/30 px-3 py-1 rounded-full text-[9px] font-black tracking-widest text-emerald-100 uppercase">
                <Award size={12} className="animate-pulse text-emerald-300" />
                {b2bConfig?.topAnnouncementPopupTitle || "اطلاعیه ویژه دست اول"}
              </div>
              <h2 className="text-xl sm font-black text-white leading-tight">
                {b2bConfig?.topAnnouncement}
              </h2>
            </div>
            <button
              onClick={triggerWholesaleTab}
              className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-3 px-6 rounded-2xl transition-all flex items-center justify-center gap-2 text-xs shadow-xl cursor-pointer"
            >
              <ShoppingBag size={15} />
              مشاهده محصولات
            </button>
          </div>
        </section>
      )}

      {/* --- SECTION 1: INTERACTIVE FACTORY DIRECTORY & EXPLORER --- */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-4">
          <div className="space-y-1">
            <span className="text-[10px] bg-blue-500/10 text-blue-600 px-3 py-1 rounded-full font-black border border-blue-500/20">
              🏭 وضعیت کارخانه‌ها
            </span>
            <h3 className="text-lg sm font-black text-slate-900">گزارش روزانه خطوط تولید و موجودی</h3>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto max-w-full pb-1">
            <button
              onClick={() => setActiveFactory("all")}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-black border transition-all shrink-0 cursor-pointer ${
                activeFactory === "all" 
                  ? "bg-emerald-600 text-white border-emerald-600" 
                  : "bg-slate-50 text-slate-600 border-slate-200"
              }`}
            >
              همه شرکت‌ها
            </button>
            {ALL_FACTORIES.map((fac) => (
              <button
                key={fac.id}
                onClick={() => setActiveFactory(fac.id)}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-black border transition-all shrink-0 cursor-pointer ${
                  activeFactory === fac.id 
                    ? "bg-emerald-600 text-white border-emerald-600" 
                    : "bg-slate-50 text-slate-600 border-slate-200"
                }`}
              >
                {fac.name ? fac.name.split(" ")[0] : "شرکت"} {fac.logo || "🏭"}
              </button>
            ))}
          </div>
        </div>

        {/* Factory Directory Grid */}
        {filteredFactories.length === 0 ? (
          <div className="bg-emerald-50/50 border border-dashed border-emerald-200 rounded-3xl p-10 text-center space-y-3">
            <Building2 className="mx-auto text-emerald-400" size={36} />
            <h4 className="text-xs font-black text-slate-700">هیچ شرکت یا کارخانه‌ای ثبت نشده است</h4>
            <p className="text-[11px] text-slate-400 font-bold">اطلاعات کارخانجات و تولیدکنندگان همکار پس از ثبت از پنل مدیریت در این بخش قرار می‌گیرند.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {filteredFactories.map((fac) => (
              <div 
                key={fac.id}
                className="rounded-[2.5rem] bg-white border border-slate-100 p-6 sm:p-8 hover transition-all duration-300 flex flex-col justify-between space-y-6 text-right shadow-material-sm relative overflow-hidden"
              >
                <div className="space-y-5">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-[1.25rem] bg-emerald-50/70 flex items-center justify-center text-4xl shadow-inner border border-emerald-100 shrink-0">
                        {fac.logo || "🏭"}
                      </div>
                      <div>
                        <h4 className="font-black text-base sm text-slate-900">{fac.name}</h4>
                        <p className="text-[10px] text-slate-400 font-bold mt-1">سال تأسیس: {fac.established || "—"} • فعال در زنجیره تامین</p>
                      </div>
                    </div>

                    <span className="text-[10px] bg-teal-50 text-teal-700 border border-teal-100 px-3 py-1 rounded-full font-black flex items-center gap-1 shrink-0">
                      <ShieldCheck size={12} className="text-teal-600" />
                      احراز هویت شده
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed font-medium pt-1 border-t border-slate-50">
                    {fac.desc || fac.description}
                  </p>

                  {/* Technical Corporate Stats Panel */}
                  <div className="bg-[#F8F9FA] p-5 rounded-2xl border border-slate-100/80 space-y-3.5">
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span className="text-slate-400 font-black">📍 آدرس کارخانه مرکزی:</span>
                      <span className="text-slate-700">{fac.location || "—"}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span className="text-slate-400 font-black">📊 ظرفیت ترخیص ماهانه:</span>
                      <span className="text-teal-600 font-black">{fac.capacity || "نامشخص"}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span className="text-slate-400 font-black">☎️ تلفن فروش و بازرگانی:</span>
                      <span className="text-slate-700 font-mono text-left">{fac.contact || "—"}</span>
                    </div>
                  </div>

                  {/* Certifications and Specs */}
                  {fac.specs && fac.specs.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-[10px] text-slate-400 font-black uppercase tracking-wider">گواهینامه‌ها و مجوزهای ملی صنعتی:</div>
                      <div className="flex flex-wrap gap-2">
                        {fac.specs.map((spec: string, i: number) => (
                          <span key={i} className="text-[9px] bg-emerald-50 text-emerald-700 border border-emerald-100 px-3 py-1 rounded-lg font-black">
                            ✓ {spec}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="border-t border-slate-100 pt-5 flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={triggerWholesaleTab}
                    className="w-full bg-emerald-600 hover text-white font-black py-3 px-5 rounded-xl text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/10 cursor-pointer"
                  >
                    <ShoppingBag size={14} />
                    خرید مستقیم از این کارخانه
                  </button>
                  {fac.contact && (() => {
                    const isVIP = userBadge === 'vip' || userBadge === 'admin';
                    if (isVIP) {
                      return (
                        <a
                          href={`tel:${fac.contact}`}
                          className="w-full sm:w-auto bg-slate-50 hover:bg-slate-100 text-slate-700 font-black py-3 px-5 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-slate-200/60"
                        >
                          <PhoneCall size={14} className="text-emerald-600" />
                          <span>تماس سریع ({fac.contact})</span>
                        </a>
                      );
                    } else {
                      return (
                        <button
                          type="button"
                          onClick={() => {
                            alert("🔒 همکار گرامی، اطلاعات تماس مستقیم کارخانجات جهت حفظ امنیت اطلاعات تجاری، منحصراً برای اعضای VIP فعال می‌باشد. شما می‌توانید رتبه کاربری خود را در پنل مدیریت به VIP تغییر دهید تا شماره‌ها فعال شوند.");
                          }}
                          className="w-full sm:w-auto bg-purple-50 hover:bg-purple-100 text-purple-700 font-black py-3 px-5 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-purple-200/40"
                        >
                          <PhoneCall size={14} className="text-purple-600" />
                          <span className="blur-[3.5px] select-none">{fac.contact.replace(/\d/g, "*")}</span>
                          <span className="text-[9px] bg-purple-200 text-purple-800 px-1 py-0.5 rounded">VIP</span>
                        </button>
                      );
                    }
                  })()}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* --- SECTION 2: NEWS & INDUSTRY ANALYSIS FEED --- */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-4">
          <div className="space-y-1">
            <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-600 text-[10px] font-black px-2.5 py-1 rounded-full border border-emerald-100">
              <Sparkles size={11} className="animate-spin text-emerald-500" />
              تحلیل روزانه زنجیره تامین مواد غذایی و بهداشتی
            </span>
            <h3 className="text-lg sm font-black text-slate-900 flex items-center gap-2">
              <Newspaper className="text-emerald-600" size={22} />
              اتاق خبر بازرگانی و اخبار کارخانجات همکار
            </h3>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1">
            {["همه", "تنظیم بازار", "خط تولید", "توزیع", "گزارش مالی"].map((cat) => (
              <button
                key={cat}
                onClick={() => setNewsFilter(cat)}
                className={`px-3 py-1 rounded-xl text-[10px] font-black border transition-all shrink-0 cursor-pointer ${
                  newsFilter === cat 
                    ? "bg-emerald-600 text-white border-emerald-600" 
                    : "bg-slate-50 text-slate-600 border-slate-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* News Grid */}
        {filteredNews.length === 0 ? (
          <div className="bg-slate-50 border border-dashed border-slate-200 rounded-3xl p-10 text-center space-y-3">
            <Newspaper className="mx-auto text-slate-400" size={36} />
            <h4 className="text-xs font-black text-slate-700">هیچ خبری در این دسته‌بندی ثبت نشده است</h4>
            <p className="text-[11px] text-slate-400 font-bold">اخبار و اطلاع‌رسانی‌های جدید توسط مدیریت سامانه منتشر خواهد شد.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredNews.map((news) => (
              <div 
                key={news.id}
                onClick={() => setSelectedNews(news)}
                className="group cursor-pointer bg-white hover rounded-[2rem] p-4.5 border border-slate-200/60 hover transition-all flex flex-col justify-between h-full"
              >
                <div className="space-y-3">
                  <div className="relative h-36 rounded-2xl overflow-hidden border border-slate-100">
                    <img 
                      src={news.imageUrl} 
                      alt="" 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                    <span className="absolute top-2 right-2 bg-slate-50/90 text-white text-[9px] font-black px-2 py-0.5 rounded-lg border border-white/5">
                      {news.category}
                    </span>
                  </div>

                  <h4 className="font-black text-xs sm text-slate-900 leading-snug group-hover transition-colors">
                    {news.title}
                  </h4>
                  <p className="text-[10px] text-slate-500 font-semibold leading-relaxed line-clamp-3">
                    {news.summary}
                  </p>
                </div>

                <div className="flex justify-between items-center border-t border-slate-100 pt-3 mt-4 text-[9px] text-slate-400 font-bold">
                  <span className="flex items-center gap-1">
                    <Calendar size={11} />
                    {news.date}
                  </span>
                  <span className="text-emerald-600 bg-emerald-50 border border-emerald-100/50 px-2 py-0.5 rounded-md">
                    {news.source}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
      </>
      )}

      {exploreSubTab === 'terms' && (
        <div className="space-y-6 animate-fadeIn">
          <TermsAndRulesSection theme="light" />
        </div>
      )}

      {exploreSubTab === 'education' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-emerald-800 to-emerald-950 rounded-[2rem] p-6 sm:p-8 text-white relative overflow-hidden shadow-xl border border-emerald-700/30">
            <div className="absolute top-0 left-0 w-32 h-32 bg-white/5 rounded-full blur-xl" />
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="space-y-2">
                <span className="text-[10px] bg-emerald-500/35 border border-emerald-400/35 px-2.5 py-1 rounded-full font-black">🎓 آکادمی توسعه کسب‌وکار و راهنما</span>
                <h3 className="text-xl sm font-black">آموزش گام‌به‌گام راه‌اندازی کسب‌وکار</h3>
                <p className="text-emerald-100/80 text-xs font-bold leading-relaxed">با مطالعه دروس زیر و تکمیل چالش‌ها، مدرک نماینده معتبر دست اول را دریافت کنید.</p>
              </div>
              <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl flex flex-col items-center">
                <span className="text-2xl font-black text-amber-300">
                  {Math.round((completedLessons.length / 4) * 100)}%
                </span>
                <span className="text-[9px] font-black text-emerald-200 mt-1">پیشرفت دوره آموزش</span>
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-emerald-900/50 rounded-full h-2 mt-6 overflow-hidden">
              <div 
                className="bg-amber-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${(completedLessons.length / 4) * 100}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-2">
            {/* Lessons List */}
            <div className="lg:col-span-8 space-y-4">
              {[
                {
                  id: 0,
                  title: "درس اول: معرفی مدل تجاری حذف واسطه و شروع به کار",
                  duration: "۱۰ دقیقه",
                  desc: "در این درس با تعریف سود انباشته زنجیره تامین مستقیم و نحوه توزیع آن بدون دلالان سنتی بازار آشنا می‌شوید.",
                  tips: "💡 کلید سودآوری در دست اول، تجمیع خرده‌سفارشات محله و ارسال یکپارچه از درب کارخانه است."
                },
                {
                  id: 1,
                  title: "درس دوم: نحوه ثبت نام مشتریان و رتبه‌بندی اعتباری همکاران",
                  duration: "۱۵ دقیقه",
                  desc: "یادگیری فرآیند ارزیابی و آپلود مدارک همکاران و نحوه تفکیک نشان‌های برنزی، نقره‌ای، طلایی و VIP.",
                  tips: "💡 رتبه‌های طلایی و VIP از ۲ تا ۵ درصد تخفیف مازاد نقدی بهره‌مند می‌شوند."
                },
                {
                  id: 2,
                  title: "درس سوم: صدور فاکتور رسمی و ضمانت امانی معاملات دست اول",
                  duration: "۱۲ دقیقه",
                  desc: "آموزش گام‌به‌گام نحوه واریز پول به حساب واسط امانی دست اول و صدور پیش‌فاکتور با مالیات بر ارزش افزوده قانونی.",
                  tips: "💡 تا زمان تایید تحویل کالا توسط مشتری، وجه در صندوق امانی محفوظ می‌ماند."
                },
                {
                  id: 3,
                  title: "درس چهارم: هماهنگی حمل‌ونقل دولتی، پلمپ جاده‌ای و بیمه بار",
                  duration: "۲۰ دقیقه",
                  desc: "نحوه کار با خطوط ترانزیت جاده‌ای مسقف، دریافت شماره راننده و کنترل سلامت پلمپ سربی در مقصد.",
                  tips: "💡 در صورت شکستگی یا عیب کالا، موضوع را فوراً در حضور راننده باربری صورتجلسه و امضا کنید."
                }
              ].map((lesson, idx) => {
                const isCompleted = completedLessons.includes(lesson.id);
                return (
                  <div 
                    key={idx}
                    className={`p-5 rounded-2xl border transition-all ${
                      isCompleted 
                        ? 'bg-emerald-500/5 border-emerald-500/20' 
                        : 'bg-white border-slate-150 shadow-sm'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-4">
                      <button
                        type="button"
                        onClick={() => {
                          if (isCompleted) {
                            setCompletedLessons(completedLessons.filter(id => id !== lesson.id));
                          } else {
                            setCompletedLessons([...completedLessons, lesson.id]);
                          }
                        }}
                        className={`px-3 py-1.5 rounded-xl text-[10px] font-black transition-colors flex items-center gap-1 border cursor-pointer shrink-0 ${
                          isCompleted
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-slate-50 text-slate-600 border-slate-150 hover'
                        }`}
                      >
                        {isCompleted ? "✓ خوانده شد" : "علامت به عنوان خوانده شده"}
                      </button>
                      <div className="text-right">
                        <div className="flex items-center gap-2 justify-end">
                          <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-black">⏱️ {lesson.duration}</span>
                          <h4 className="text-xs sm font-black text-slate-900">{lesson.title}</h4>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-2 font-bold leading-relaxed">{lesson.desc}</p>
                      </div>
                    </div>

                    <div className="mt-4 bg-amber-500/5 p-3 rounded-xl border border-amber-500/10 text-[10px] sm text-amber-800 font-bold leading-relaxed">
                      {lesson.tips}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Sidebar Guide Info */}
            <div className="lg:col-span-4 space-y-4">
              <div className="bg-emerald-50/40 border border-emerald-150/50 rounded-2xl p-5 space-y-4 text-right">
                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-700 text-lg">💡</div>
                <h4 className="text-xs sm font-black text-slate-900 font-sans font-sans">چرا باید این دوره را تکمیل کنیم؟</h4>
                <p className="text-[11px] text-slate-500 font-bold leading-relaxed">تکمیل دوره باعث فعال شدن نشان تاییدیه اعضای رسمی شبکه در پروفایل شما شده و اجازه دسترسی به تخفیفات تشویقی حجم بالا را به شما می‌دهد.</p>
              </div>

              <div className="bg-amber-50/40 border border-amber-150/50 rounded-2xl p-5 text-center space-y-4">
                <span className="text-3xl select-none block">🏆</span>
                <h4 className="text-xs sm font-black text-slate-900 font-sans">گواهینامه رسمی نماینده</h4>
                <p className="text-[10px] text-slate-400 font-bold leading-relaxed">با مطالعه کامل تمامی دروس، دکمه فعال شده و گواهی شما صادر می‌شود.</p>
                <button
                  disabled={completedLessons.length < 4}
                  onClick={() => alert("درخواست شما برای بررسی و صدور گواهینامه به تیم پشتیبانی دست اول ارسال شد. نتیجه تا ۲۴ ساعت آینده به شما پیامک خواهد شد.")}
                  className="w-full py-2.5 bg-emerald-600 hover disabled disabled text-white font-black text-[10px] sm rounded-xl cursor-pointer transition-all disabled:cursor-not-allowed"
                >
                  دریافت گواهی الکترونیک معتبر نمایندگی
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- DETAIL MODAL FOR NEWS --- */}
      <AnimatePresence>
        {selectedNews && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedNews(null)}
              className="fixed inset-0 bg-slate-50/75 backdrop-blur-md z-[100]"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-x-4 bottom-4 top-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 w-full max-w-2xl bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 z-[110] shadow-2xl overflow-y-auto max-h-[90vh] text-right"
              dir="rtl"
            >
              <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-4">
                <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-600 border border-emerald-100 text-[10px] font-black px-3 py-1 rounded-full">
                  {selectedNews.category}
                </span>
                <button 
                  onClick={() => setSelectedNews(null)}
                  className="flex items-center gap-1 text-xs font-black text-slate-400 hover bg-slate-50 hover px-3 py-1.5 rounded-xl transition-all"
                >
                  <ArrowRight size={14} />
                  بازگشت
                </button>
              </div>

              <div className="space-y-4">
                <div className="h-64 rounded-2xl overflow-hidden border border-slate-100 bg-slate-100">
                  <img 
                    src={selectedNews.imageUrl} 
                    alt="" 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>

                <div className="flex justify-between items-center text-xs text-slate-400 font-bold">
                  <span className="flex items-center gap-1">
                    <Calendar size={12} />
                    منتشر شده در: {selectedNews.date}
                  </span>
                  <span className="text-emerald-700 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-lg">
                    منبع خبر: {selectedNews.source}
                  </span>
                </div>

                <h3 className="text-lg sm font-black text-slate-900 leading-tight">
                  {selectedNews.title}
                </h3>

                <p className="text-xs sm text-slate-600 leading-relaxed font-bold bg-slate-50 p-4 rounded-2xl border-r-4 border-emerald-500">
                  {selectedNews.summary}
                </p>

                <p className="text-xs sm text-slate-500 leading-loose text-justify font-medium pt-2">
                  {selectedNews.content}
                </p>
              </div>

              <div className="border-t border-slate-100 pt-6 mt-6 flex justify-between items-center">
                <div className="flex items-center gap-1.5 text-[10px] font-black text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl">
                  <Award size={14} />
                  تایید شده توسط کارگروه نظارت دست اول
                </div>
                <button 
                  onClick={() => handleShare(selectedNews)}
                  className="p-2.5 bg-slate-100 hover text-slate-500 hover rounded-full transition-all cursor-pointer"
                  title="اشتراک‌گذاری"
                >
                  <Share2 size={16} />
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
