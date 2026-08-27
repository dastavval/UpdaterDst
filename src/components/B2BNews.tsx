import { useState, useEffect } from "react";
import { 
  FileText, Calendar, Share2, Award, ChevronLeft, ArrowRight, TrendingUp, 
  Sparkles, Building2, Zap, PhoneCall, CheckCircle2, ShieldCheck, 
  ArrowLeft, BadgePercent, Volume2, Newspaper, ShoppingBag, Landmark,
  GraduationCap, HelpCircle, Lock, BookOpen, Compass, Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { TermsAndRulesSection } from "./InfoSections";
import { ArticleDetailModal } from "./ArticleDetailModal";
import { ComprehensiveSystemGuide } from "./ComprehensiveSystemGuide";

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

const NEWS_DATA: NewsItem[] = [];

const FACTORIES_DATA: any[] = [];

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
  const [selectedNews, setSelectedNews] = useState<any | null>(null);
  const [activeFactory, setActiveFactory] = useState<string>("all");
  const [newsFilter, setNewsFilter] = useState<string>("همه");
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateAIArticles = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch("/api/articles/generate-daily-batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      const data = await res.json();
      if (data && data.success) {
        window.location.reload();
      }
    } catch (e) {
      console.error("Failed to generate AI articles:", e);
    } finally {
      setIsGenerating(false);
    }
  };

  // Merge dynamic articles with static NEWS_DATA, ensuring unique IDs
  const ALL_NEWS = Array.from(
    new Map([...NEWS_DATA, ...articles].map(item => [item.id, item])).values()
  );

  const filteredNews = newsFilter === "همه" 
    ? ALL_NEWS 
    : ALL_NEWS.filter(n => n.category === newsFilter);

  const ALL_FACTORIES = (factories.length > 0 ? factories : (b2bConfig?.factories || FACTORIES_DATA))
    .filter((f: any) => f && f.isActive !== false);

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
          {/* --- HERO HEADER: EXPLORE & FACTORY HUB (REDESIGNED TO WHITE) --- */}
      <section className="relative rounded-[2.5rem] bg-white border border-slate-200 p-6 sm:p-10 overflow-hidden shadow-material-sm text-slate-900">
        <div className="absolute top-[-30%] left-[-20%] w-[70%] h-[70%] bg-emerald-500/5 rounded-full blur-[140px] pointer-events-none animate-pulse" />
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
          <div className="lg:col-span-8 space-y-4">
            <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-100 px-4 py-1.5 rounded-full text-emerald-600 text-[10px] font-black uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              رصدخانه هوشمند خطوط تولید و زنجیره تامین
            </div>

            <h1 className="text-2xl sm font-black leading-tight text-slate-900">
              شناسایی <span className="text-emerald-600">تولیدی‌های برتر</span> <br />
              و کاتالوگ محصولات واقعی
            </h1>

            <p className="text-slate-500 text-xs sm font-medium leading-relaxed max-w-xl">
            در این بخش می‌توانید اطلاعات کارخانه‌ها، ظرفیت تولید و جدیدترین اخبار بازار را رصد کنید. سامانه تحلیل‌گر هوشمند دست اول به شما کمک می‌کند تا مستقیم و با آگاهی کامل خرید کنید.
            </p>
          </div>

          {/* AI Advisor Card (Light Mode Refined) */}
          <div className="lg:col-span-4 bg-slate-50 rounded-3xl p-5 border border-slate-200 flex flex-col items-center text-center space-y-3 relative overflow-hidden group hover:shadow-lg transition-all duration-300">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl" />
            
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center border border-emerald-100 text-3xl relative animate-pulse shadow-sm text-emerald-600">
              🧠
            </div>

            <div className="space-y-1">
              <div className="text-[10px] bg-emerald-600 text-white px-3 py-0.5 rounded-full font-black inline-block">
                دستیار هوش مصنوعی تجاری
              </div>
              <h4 className="text-sm font-black text-slate-900">«خطوط تولید را شفاف رصد کنید!»</h4>
              <p className="text-[10px] text-slate-500 leading-relaxed font-bold">
                سیستم هوش مصنوعی دست اول وضعیت موجودی مواد خام کارخانه‌ها، مجوزهای حمل و پلمپ جاده‌ای را پایش کرده و بهترین زمان ثبت فاکتور مستقیم را پیشنهاد می‌دهد.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* --- GOLDEN VIP ADVERTISEMENT SPOT (REDESIGNED TO LIGHT) --- */}
      {b2bConfig?.showTopAnnouncement && b2bConfig?.topAnnouncement && (
        <section className="relative rounded-[2rem] p-6 sm:p-8 bg-emerald-50 border-2 border-emerald-100 overflow-hidden shadow-sm text-slate-900 group">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6 relative z-10">
            <div className="space-y-4 text-right">
              <div className="inline-flex items-center gap-1.5 bg-emerald-600 text-white px-3 py-1 rounded-full text-[9px] font-black tracking-widest uppercase">
                <Award size={12} className="animate-pulse text-white" />
                {b2bConfig?.topAnnouncementPopupTitle || "اطلاعیه ویژه دست اول"}
              </div>
              <h2 className="text-xl sm font-black text-slate-900 leading-tight">
                {b2bConfig?.topAnnouncement}
              </h2>
            </div>
            <button
              onClick={triggerWholesaleTab}
              className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3 px-6 rounded-2xl transition-all flex items-center justify-center gap-2 text-xs shadow-lg cursor-pointer"
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
            {ALL_FACTORIES.map((fac, idx) => (
              <button
                key={`b2b-fac-tab-v2-${fac.id || 'no-id'}-${idx}`}
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
            {filteredFactories.map((fac, idx) => (
              <div 
                key={`b2b-fac-card-v2-${fac.id || 'no-id'}-${idx}`}
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

                  {/* Technical Corporate Stats Panel (Clean White) */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-100 space-y-3.5 shadow-sm">
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
                      <div className="text-[10px] text-slate-400 font-black uppercase tracking-wider">گواهینامه‌ها و استانداردهای معتبر صنعتی:</div>
                      <div className="flex flex-wrap gap-2">
                        {fac.specs.map((spec: string, i: number) => (
                          <span key={`b2b-fac-spec-${spec.slice(0, 5)}-${i}`} className="text-[9px] bg-emerald-50 text-emerald-700 border border-emerald-100 px-3 py-1 rounded-lg font-black">
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

          <div className="flex items-center gap-2 overflow-x-auto max-w-full pb-1">
            <button
              onClick={handleGenerateAIArticles}
              disabled={isGenerating}
              className="px-3.5 py-1.5 rounded-xl text-[10px] font-black bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-sm flex items-center gap-1.5 transition-all shrink-0 cursor-pointer disabled:opacity-50"
              title="تولید خودکار ۳ الی ۴ مقاله تخصصی توسط GapGPT"
            >
              {isGenerating ? (
                <>
                  <Loader2 size={12} className="animate-spin" />
                  <span>در حال نگارش هوشمند...</span>
                </>
              ) : (
                <>
                  <Sparkles size={12} className="text-amber-300" />
                  <span>تولید مقالات روزانه با AI</span>
                </>
              )}
            </button>

            {["همه", "تنظیم بازار", "خط تولید", "توزیع", "گزارش مالی"].map((cat, idx) => (
              <button
                key={`b2b-news-cat-${cat}-${idx}`}
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
            {filteredNews.map((news, idx) => (
              <div 
                key={`b2b-news-card-v2-${news.id || 'no-id'}-${idx}`}
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
        <div className="space-y-6 animate-fadeIn">
          <ComprehensiveSystemGuide 
            onSwitchTab={(tab) => {
              window.dispatchEvent(new CustomEvent("switch-tab", { detail: tab }));
            }} 
            userBadge={userBadge}
          />
        </div>
      )}

      {/* --- DETAIL MODAL FOR NEWS & ARTICLES --- */}
      <ArticleDetailModal
        article={selectedNews}
        onClose={() => setSelectedNews(null)}
        factories={ALL_FACTORIES}
        onOpenFactory={(facId) => {
          setSelectedNews(null);
          window.dispatchEvent(new CustomEvent("view-factory", { detail: { factoryId: facId } }));
        }}
        onSwitchTab={(tab) => {
          setSelectedNews(null);
          window.dispatchEvent(new CustomEvent("switch-tab", { detail: tab }));
        }}
      />
    </div>
  );
}
