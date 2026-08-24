import React, { useState, useMemo } from "react";
import { 
  Building2, 
  Award, 
  ShieldCheck, 
  CheckCircle2, 
  MapPin, 
  FileText, 
  Phone, 
  User, 
  ArrowLeft, 
  Sparkles, 
  Truck, 
  Send, 
  Check, 
  HelpCircle,
  Clock,
  DollarSign,
  Briefcase,
  AlertCircle,
  Coins,
  TrendingUp,
  Users,
  Calculator,
  Package
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import RepresentativeCertificateView from "./RepresentativeCertificateView";
import { addCallbackRequest } from "../lib/callback-helper";
import { calculateDealershipTier } from "../utils/dealershipCityTiers";

interface DealershipRequestViewProps {
  b2bConfig?: any;
  user?: any;
  userCity?: string;
  userProvince?: string;
  onNavigateHome: () => void;
  onOpenCertificate?: () => void;
}

export default function DealershipRequestView({
  b2bConfig,
  user,
  userCity,
  userProvince,
  onNavigateHome,
  onOpenCertificate
}: DealershipRequestViewProps) {
  const [activeTab, setActiveTab] = useState<'form' | 'benefits' | 'calculator' | 'certificate' | 'tracking'>('form');
  
  // Application Form States
  const [fullName, setFullName] = useState(user?.name || "");
  const [mobile, setMobile] = useState(user?.phone || user?.mobile || "");
  const [companyName, setCompanyName] = useState(user?.company || "");

  // Initialize province and city with intelligent fallback from user prop, userCity prop, or localStorage
  const [province, setProvince] = useState<string>(() => {
    if (user?.province) return user.province;
    if (userProvince) return userProvince;
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("dastavval_user_province");
      if (saved) return saved;
    }
    return "خراسان رضوی";
  });

  const [city, setCity] = useState<string>(() => {
    if (user?.city) return user.city;
    if (userCity) return userCity;
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("dastavval_user_city");
      if (saved) return saved;
    }
    return "قوچان";
  });

  const [warehouseSpace, setWarehouseSpace] = useState("۱۰۰ تا ۳۰۰ متر مربع");
  const [distributionVehicles, setDistributionVehicles] = useState("۱ تا ۲ دستگاه وانت/کامیونت");
  const [experienceYears, setExperienceYears] = useState("۲ تا ۵ سال");
  const [capitalRange, setCapitalRange] = useState("۵۰۰ میلیون تا ۱ میلیارد تومان");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [trackingCode, setTrackingCode] = useState<string | null>(null);

  // Sync state if userCity or userProvince prop changes
  React.useEffect(() => {
    if (userCity) setCity(userCity);
    if (userProvince) setProvince(userProvince);
  }, [userCity, userProvince]);

  // Listen to events for city prefill and header location selector changes
  React.useEffect(() => {
    const handleOpenEvent = (e: any) => {
      if (e.detail?.city) {
        setCity(e.detail.city);
      }
      if (e.detail?.province) {
        setProvince(e.detail.province);
      }
      setActiveTab('form');
    };

    const handleCityChangeEvent = (e: any) => {
      if (e.detail?.city) {
        setCity(e.detail.city);
      }
      if (e.detail?.province) {
        setProvince(e.detail.province);
      }
    };

    window.addEventListener("open-dealership-request", handleOpenEvent);
    window.addEventListener("dastavval-city-changed", handleCityChangeEvent);
    return () => {
      window.removeEventListener("open-dealership-request", handleOpenEvent);
      window.removeEventListener("dastavval-city-changed", handleCityChangeEvent);
    };
  }, []);

  // Dynamic Demographic Quota Calculation for selected city
  const cityTierData = useMemo(() => {
    return calculateDealershipTier(city || "قوچان", province);
  }, [city, province]);

  // Provinces List
  const provinces = [
    "آذربایجان شرقی", "آذربایجان غربی", "اردبیل", "اصفهان", "البرز", "ایلام", "بوشهر", 
    "تهران", "چهارمحال و بختیاری", "خراسان جنوبی", "خراسان رضوی", "خراسان شمالی", 
    "خوزستان", "زنجان", "سمنان", "سیستان و بلوچستان", "فارس", "قزوین", "قم", "کردستان", 
    "کرمان", "کرمانشاه", "کهگیلویه و بویراحمد", "گلستان", "گیلان", "لرستان", "مازندران", 
    "مرکزی", "هرمزگان", "همدان", "یزد"
  ];

  const quickCities = [
    { name: "قوچان", prov: "خراسان رضوی" },
    { name: "سبزوار", prov: "خراسان رضوی" },
    { name: "نیشابور", prov: "خراسان رضوی" },
    { name: "مشهد", prov: "خراسان رضوی" },
    { name: "تهران", prov: "تهران" },
    { name: "اصفهان", prov: "اصفهان" },
    { name: "کرج", prov: "البرز" },
    { name: "شیراز", prov: "فارس" },
    { name: "تبریز", prov: "آذربایجان شرقی" },
    { name: "کاشان", prov: "اصفهان" },
    { name: "دزفول", prov: "خوزستان" },
    { name: "آمل", prov: "مازندران" },
    { name: "کرمانشاه", prov: "کرمانشاه" },
    { name: "همدان", prov: "همدان" },
    { name: "بندرعباس", prov: "هرمزگان" }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !mobile.trim()) {
      alert("لطفاً نام کامل و شماره تماس خود را وارد نمایید.");
      return;
    }

    setIsSubmitting(true);
    try {
      const generatedCode = "REP-" + Math.floor(100000 + Math.random() * 900000);
      const requestDetails = `[درخواست نمایندگی انحصاری] کد: ${generatedCode} | متقاضی: ${fullName} | شرکت: ${companyName || 'شخصی'} | استان: ${province} - شهر: ${city} (سطح جمعیتی: ${cityTierData.tierLabel} - سقف سهمیه: ${cityTierData.monthlyQuotaCeilingFormatted}) | متراژ انبار: ${warehouseSpace} | ناوگان: ${distributionVehicles} | سابقه: ${experienceYears} | توضیحات: ${notes || '-'}`;

      await addCallbackRequest(mobile, requestDetails);
      
      setTrackingCode(generatedCode);
      setSubmitSuccess(true);
      
      // Store in local storage for quick access
      try {
        const savedRequests = JSON.parse(localStorage.getItem("dastavval_agency_requests") || "[]");
        savedRequests.unshift({
          code: generatedCode,
          date: new Date().toLocaleDateString("fa-IR"),
          status: "در حال بررسی کمیسیون اعطای نمایندگی",
          fullName,
          province,
          city,
          companyName,
          tierLabel: cityTierData.tierLabel,
          monthlyQuotaCeilingFormatted: cityTierData.monthlyQuotaCeilingFormatted
        });
        localStorage.setItem("dastavval_agency_requests", JSON.stringify(savedRequests));
      } catch (err) {
        // ignore
      }

    } catch (error: any) {
      alert("خطا در ثبت درخواست: " + (error?.message || "لطفاً دوباره تلاش فرمایید."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 text-right font-sans my-4" dir="rtl">
      
      {/* Header Banner - Clean, Creative, Pure White */}
      <div className="relative bg-white text-slate-900 rounded-3xl p-5 sm:p-6 shadow-xs overflow-hidden border border-slate-200">
        <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 rounded-bl-full pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 sm:gap-6">
          <div className="flex items-center gap-3.5">
            <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-xs shrink-0">
              <Award size={30} className="text-emerald-600" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10.5px] font-black">
                  اعطای عاملیت و نمایندگی رسمی پلتفرم
                </span>
                <span className="text-[10px] text-slate-500 font-bold">شروع آسان از ۳۰ کارتن با ارتقای خودکار پلکانی</span>
              </div>
              <h1 className="text-lg sm:text-xl font-black text-slate-900">
                پورتال درخواست نمایندگی استانی و شهرستانی دست اول
              </h1>
              <p className="text-xs text-slate-500 font-bold leading-relaxed max-w-2xl">
                توزیع مستقیم محصولات کارخانجات با سهمیه کارتنی منعطف، شروع کم‌ریسک و رشد پلکانی اتوماتیک بر اساس کشش بازار هر منطقه
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <button
              onClick={onNavigateHome}
              className="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer border border-slate-200 shadow-2xs"
            >
              <span>صفحه اصلی</span>
              <ArrowLeft size={14} />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 mt-5 pt-3.5 border-t border-slate-100 overflow-x-auto pb-1 select-none">
          <button
            onClick={() => setActiveTab('form')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'form' 
                ? "bg-emerald-600 text-white shadow-xs" 
                : "text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200/60"
            }`}
          >
            <FileText size={14} />
            <span>تکمیل فرم درخواست نمایندگی</span>
          </button>

          <button
            onClick={() => setActiveTab('calculator')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'calculator' 
                ? "bg-emerald-600 text-white shadow-xs" 
                : "text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200/60"
            }`}
          >
            <Calculator size={14} />
            <span>محاسبه‌گر هوشمند سقف و سهمیه شهرها</span>
          </button>

          <button
            onClick={() => setActiveTab('benefits')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'benefits' 
                ? "bg-emerald-600 text-white shadow-xs" 
                : "text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200/60"
            }`}
          >
            <Sparkles size={14} />
            <span>مزایا، سود و شرایط اعطا</span>
          </button>

          <button
            onClick={() => setActiveTab('tracking')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'tracking' 
                ? "bg-emerald-600 text-white shadow-xs" 
                : "text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200/60"
            }`}
          >
            <Clock size={14} />
            <span>پیگیری پرونده‌های ثبت‌شده</span>
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'form' && (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {/* Form Side */}
            <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
              {submitSuccess ? (
                <div className="p-8 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-4">
                  <div className="w-16 h-16 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-600/30">
                    <CheckCircle2 size={36} />
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="text-lg font-black text-slate-900">درخواست نمایندگی شما با موفقیت ثبت شد</h3>
                    <p className="text-xs font-bold text-slate-600">
                      پرونده شما در صف بررسی سهمیه منطقه <span className="font-black text-emerald-700">{province} - {city}</span> با سقف سهمیه <span className="font-black text-emerald-700">{cityTierData.monthlyQuotaCeilingFormatted}</span> قرار گرفت.
                    </p>
                  </div>
                  <div className="inline-block p-4 bg-white border border-emerald-300 rounded-xl shadow-xs">
                    <span className="text-[11px] text-slate-500 font-bold block">کد رهگیری پرونده شما:</span>
                    <span className="text-lg font-black font-mono text-emerald-700">{trackingCode}</span>
                  </div>
                  <div className="pt-2 flex justify-center gap-3">
                    <button
                      onClick={() => setSubmitSuccess(false)}
                      className="px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-black hover:bg-slate-200 transition-all cursor-pointer"
                    >
                      ثبت فرم دیگر
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="border-b border-slate-100 pb-3">
                    <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                      <Briefcase className="text-emerald-600" size={18} />
                      <span>مشخصات متقاضی و منطقه تحت پوشش</span>
                    </h3>
                    <p className="text-[11px] text-slate-500 font-bold mt-0.5">
                      سقف خرید، سهمیه ماهانه و تسهیلات اعتباری به صورت کاملاً اتوماتیک بر اساس جمعیت شهرستان تعیین می‌گردد.
                    </p>
                  </div>

                  {/* Dynamic City Population Alert Banner */}
                  <div className="p-3.5 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl border border-emerald-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                        <Coins size={16} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-emerald-950">سقف سهمیه مصوب برای {city}:</span>
                          <span className="text-xs font-black text-emerald-700 font-mono bg-white px-2 py-0.5 rounded-md border border-emerald-200">{cityTierData.monthlyQuotaCeilingFormatted}</span>
                        </div>
                        <p className="text-[10px] font-bold text-slate-500 mt-0.5">
                          سطح جمعیتی: {cityTierData.tierLabel} • ظرفیت بار: {cityTierData.monthlyCartons}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-black text-slate-700">نام و نام خانوادگی مسئول:</label>
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="مثال: علیرضا محمدی"
                        className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 outline-hidden"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-black text-slate-700">شماره موبایل جهت تماس و پیامک:</label>
                      <input
                        type="tel"
                        required
                        value={mobile}
                        onChange={(e) => setMobile(e.target.value)}
                        placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                        className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold text-slate-800 outline-hidden"
                        dir="ltr"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-black text-slate-700">نام فروشگاه، بنکداری یا شرکت پخش:</label>
                      <input
                        type="text"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="مثال: بازرگانی پخش پیشرو البرز"
                        className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 outline-hidden"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-black text-slate-700">استان مورد تقاضا:</label>
                      <select
                        value={province}
                        onChange={(e) => setProvince(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 outline-hidden"
                      >
                        {provinces.map((p, pIdx) => (
                          <option key={`dealer-prov-opt-${p}-${pIdx}`} value={p}>{p}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-black text-slate-700">شهرستان / منطقه توزیع:</label>
                      <input
                        type="text"
                        required
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="مثال: تهران، مشهد، اصفهان، کاشان..."
                        className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 outline-hidden"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-black text-slate-700">متراژ انبار یا سوله نگهداری کالا:</label>
                      <select
                        value={warehouseSpace}
                        onChange={(e) => setWarehouseSpace(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 outline-hidden"
                      >
                        <option value="کمتر از ۱۰۰ متر">کمتر از ۱۰۰ متر مربع</option>
                        <option value="۱۰۰ تا ۳۰۰ متر مربع">۱۰۰ تا ۳۰۰ متر مربع</option>
                        <option value="۳۰۰ تا ۱۰۰۰ متر مربع">۳۰۰ تا ۱۰۰۰ متر مربع</option>
                        <option value="بیش از ۱۰۰۰ متر مربع (سوله استاندارد)">بیش از ۱۰۰۰ متر مربع (سوله استاندارد)</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-black text-slate-700">تعداد ناوگان و خودروهای پخش:</label>
                      <select
                        value={distributionVehicles}
                        onChange={(e) => setDistributionVehicles(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 outline-hidden"
                      >
                        <option value="۱ دستگاه">۱ دستگاه وانت/کامیونت</option>
                        <option value="۲ تا ۴ دستگاه">۲ تا ۴ دستگاه</option>
                        <option value="۵ تا ۱۰ دستگاه">۵ تا ۱۰ دستگاه</option>
                        <option value="بیش از ۱۰ دستگاه (ناوگان کامل)">بیش از ۱۰ دستگاه (ناوگان کامل)</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-black text-slate-700">سابقه فعالیت در حوزه مواد غذایی:</label>
                      <select
                        value={experienceYears}
                        onChange={(e) => setExperienceYears(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 outline-hidden"
                      >
                        <option value="تازه‌کار (کمتر از ۲ سال)">تازه‌کار (کمتر از ۲ سال)</option>
                        <option value="۲ تا ۵ سال">۲ تا ۵ سال</option>
                        <option value="۵ تا ۱۰ سال">۵ تا ۱۰ سال</option>
                        <option value="بیش از ۱۰ سال سابقه معتبر">بیش از ۱۰ سال سابقه معتبر</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-700">توضیحات تکمیلی یا درخواست برندهای خاص:</label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                      placeholder="در صورت تمایل به دریافت نمایندگی کارخانه خاص، یا داشتن شرایط ویژه توزیع ذکر فرمایید..."
                      className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl p-3 text-xs font-bold text-slate-800 outline-hidden"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-xl text-sm font-black transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <span>در حال ارسال اطلاعات و ثبت پرونده...</span>
                    ) : (
                      <>
                        <Send size={16} />
                        <span>ثبت نهایی درخواست و بررسی سهمیه شهری</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>

            {/* Side Highlights & Live Demographic Progressive Quota Card */}
            <div className="space-y-4">
              {/* Creative White/Emerald Compact Quota Card (No Blue Box) */}
              <div className="bg-white rounded-3xl p-5 sm:p-6 space-y-4 border border-slate-200 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-bl-full pointer-events-none" />

                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2 text-slate-900">
                    <Package size={18} className="text-emerald-600" />
                    <h3 className="text-xs sm:text-sm font-black">تحلیل سهمیه کارتنی {city}</h3>
                  </div>
                  <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                    {cityTierData.tierLabel}
                  </span>
                </div>

                {/* Progressive 3 Steps (Creative & Short) */}
                <div className="space-y-2 text-xs">
                  <div className="text-[11px] font-extrabold text-slate-700 mb-1 flex items-center justify-between">
                    <span>مراحل پیشرفت و ارتقای سهمیه:</span>
                    <span className="text-emerald-600 font-bold text-[10px]">ارتقای خودکار</span>
                  </div>

                  {cityTierData.growthSteps ? (
                    cityTierData.growthSteps.map((step, idx) => (
                      <div 
                        key={`growth-step-${step.stepNumber}-${idx}`}
                        className={`p-2.5 rounded-2xl border transition-all ${
                          idx === 0 
                            ? "bg-emerald-50/70 border-emerald-200/80 text-slate-800" 
                            : "bg-slate-50/80 border-slate-150 text-slate-700"
                        }`}
                      >
                        <div className="flex items-center justify-between font-black text-[11px] mb-1">
                          <span className="flex items-center gap-1.5">
                            <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-mono ${idx === 0 ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-700"}`}>
                              {step.stepNumber}
                            </span>
                            <span>{step.title}</span>
                          </span>
                          <span className="text-emerald-700 font-mono text-[10.5px]">
                            {step.cartonRange}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-[10px] text-slate-500 font-medium pr-5">
                          <span>سقف ارزش: {step.volumeTomanFormatted}</span>
                          <span className="text-slate-400 font-normal">{step.description} ({step.marginPercent})</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="bg-slate-50 p-2.5 rounded-xl text-slate-600 text-xs">
                      شروع از ۳۰ کارتن
                    </div>
                  )}
                </div>

                {/* Easy Guarantee Note */}
                <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100 flex items-center justify-between text-xs font-bold text-slate-700">
                  <span className="text-slate-500">ضمانت صیادی اولیه:</span>
                  <span className="font-mono text-slate-900 text-[11px]">{cityTierData.guaranteeLimitFormatted}</span>
                </div>

                <p className="text-[10.5px] text-slate-500 font-medium leading-relaxed">
                  💡 شروع آسان در {cityTierData.cityName} با حداقل {cityTierData.starterMinCartons} ({cityTierData.initialMinOrderFormatted}) بدون ریسک انبارداری؛ سهمیه و تخفیف‌ها پس از هر دوره سفارش به صورت اتوماتیک افزایش می‌یابد.
                </p>
              </div>

              {/* Exclusive Benefits Card */}
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200/70 rounded-3xl p-5 sm:p-6 space-y-3.5 shadow-2xs">
                <div className="flex items-center gap-2 text-emerald-900">
                  <ShieldCheck size={20} className="text-emerald-700" />
                  <h3 className="text-xs sm:text-sm font-black">مزایای انحصاری عاملیت</h3>
                </div>
                <ul className="space-y-2 text-xs font-bold text-slate-700">
                  <li className="flex items-start gap-2">
                    <Check size={15} className="text-emerald-600 shrink-0 mt-0.5" />
                    <span>قیمت دست اول درب کارخانه با بالاترین حاشیه سود</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check size={15} className="text-emerald-600 shrink-0 mt-0.5" />
                    <span>عدم فروش مستقیم کارخانه به سایر فروشگاه‌های شهر شما</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check size={15} className="text-emerald-600 shrink-0 mt-0.5" />
                    <span>تسهیلات خرید چکی با اعتبار‌سنجی بانکی صیاد</span>
                  </li>
                </ul>
              </div>

              {/* Direct Support Contact */}
              <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-5 space-y-2 shadow-2xs">
                <div className="flex items-center gap-2 text-slate-900 font-black text-xs">
                  <Phone size={15} className="text-emerald-600" />
                  <span>واحد هماهنگی نمایندگی‌های سراسر کشور</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-600">تلفن مستقیم:</span>
                  <a href="tel:09999123001" className="font-mono font-black text-emerald-700 text-xs sm:text-sm" dir="ltr">
                    ۰۹۹۹ ۹۱۲ ۳۰۰۱
                  </a>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Interactive Automated City Tier Calculator Tab */}
        {activeTab === 'calculator' && (
          <motion.div
            key="calculator"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-xs">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-black uppercase tracking-widest border border-emerald-200">
                  <Calculator size={14} className="text-emerald-600" />
                  سامانه محاسبات هوشمند سهمیه و رتبه‌بندی جمعیتی شهرها
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                  استعلام آنلاین سقف نمایندگی، تعداد کارتن و شرایط ضمانت بر اساس کشش شهر
                </h2>
                <p className="text-xs font-bold text-slate-500 leading-relaxed max-w-3xl">
                  در پلتفرم دست اول، سهمیه سفارشات بر اساس ظرفیت واقعی شهر <span className="text-emerald-700 font-black">{cityTierData.cityName}</span> ({cityTierData.tierLabel}) تنظیم می‌شود. برای شهرهای کوچک و متوسط مانند {cityTierData.cityName}، شرایط ورود تسهیل‌شده با حداقل سفارش <span className="text-emerald-700 font-black">{cityTierData.starterMinCartons} ({cityTierData.initialMinOrderFormatted})</span> در نظر گرفته شده تا تمامی همکاران محلی بتوانند به‌راحتی فعالیت خود را آغاز کنند.
                </p>
              </div>

              {/* Quick City Selector Chips */}
              <div className="space-y-2 pt-2">
                <span className="text-xs font-black text-slate-700">انتخاب سریع کلان‌شهرها و مراکز استان:</span>
                <div className="flex flex-wrap gap-2">
                  {quickCities.map((qc, qcIdx) => {
                    const isSelected = city === qc.name;
                    return (
                      <button
                        key={`qc-${qc.name}-${qcIdx}`}
                        onClick={() => {
                          setCity(qc.name);
                          setProvince(qc.prov);
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer border ${
                          isSelected 
                            ? "bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20" 
                            : "bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200"
                        }`}
                      >
                        {qc.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Live Calculator Results Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-2xl p-5 space-y-2 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold opacity-90">شروع آسان (ورود)</span>
                    <Package size={20} className="text-emerald-100" />
                  </div>
                  <h4 className="text-lg sm:text-xl font-black font-mono">
                    {cityTierData.starterMinCartons}
                  </h4>
                  <p className="text-[10px] text-emerald-100 font-bold">
                    حداقل سفارش شروع عاملیت ({cityTierData.initialMinOrderFormatted})
                  </p>
                </div>

                <div className="bg-gradient-to-br from-slate-800 to-slate-950 text-white rounded-2xl p-5 space-y-2 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold opacity-90">توزیع ماهانه تثبیت</span>
                    <TrendingUp size={20} className="text-slate-200" />
                  </div>
                  <h4 className="text-lg sm:text-xl font-black font-mono">
                    {cityTierData.monthlyCartons}
                  </h4>
                  <p className="text-[10px] text-slate-300 font-bold">
                    ظرفیت تأمین پیوسته ماهانه در فاز دوم
                  </p>
                </div>

                <div className="bg-gradient-to-br from-amber-600 to-amber-700 text-white rounded-2xl p-5 space-y-2 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold opacity-90">سقف سهمیه پلکانی</span>
                    <Coins size={20} className="text-amber-100" />
                  </div>
                  <h4 className="text-lg sm:text-xl font-black font-mono">
                    {cityTierData.monthlyQuotaCeilingFormatted}
                  </h4>
                  <p className="text-[10px] text-amber-100 font-bold">
                    سقف خرید ماهانه با نرخ مصوب مستقیم کارخانه
                  </p>
                </div>

                <div className="bg-gradient-to-br from-teal-700 to-slate-800 text-white rounded-2xl p-5 space-y-2 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold opacity-90">ضمانت صیادی اولیه</span>
                    <ShieldCheck size={20} className="text-teal-200" />
                  </div>
                  <h4 className="text-base sm:text-lg font-black font-mono">
                    {cityTierData.guaranteeLimitFormatted}
                  </h4>
                  <p className="text-[10px] text-teal-200 font-bold">
                    تسهیلات چکی پس از ثبت اولین دوره سفارش
                  </p>
                </div>
              </div>

              {/* Demographic Tier Breakdown Comparison Table */}
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <h3 className="text-sm font-black text-slate-900">جدول رتبه‌بندی جمعیتی شهرها، تعداد کارتن و سقف‌های مصوب</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs border border-slate-200 rounded-xl overflow-hidden">
                    <thead className="bg-slate-100 text-slate-700 font-black">
                      <tr>
                        <th className="p-3">رده جمعیتی</th>
                        <th className="p-3">نمونه شهرها</th>
                        <th className="p-3">شروع آسان اولیه</th>
                        <th className="p-3">ظرفیت تثبیت ماهانه</th>
                        <th className="p-3">سقف سهمیه پلکانی</th>
                        <th className="p-3">ضمانت صیادی</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-bold text-slate-600">
                      <tr className={cityTierData.tier === 1 ? "bg-emerald-50/80 text-emerald-950 font-black" : ""}>
                        <td className="p-3">سطح ۱: کلان‌شهرهای بالای ۱.۵ میلیون</td>
                        <td className="p-3">تهران، مشهد، اصفهان، کرج، شیراز، تبریز، قم، اهواز</td>
                        <td className="p-3 font-mono text-emerald-700 font-black">۳۰ تا ۶۰ کارتن (۳۰-۶۰ م)</td>
                        <td className="p-3 font-mono">۱۲۰ تا ۲۵۰ کارتن</td>
                        <td className="p-3 font-mono">۴۰۰ تا ۶۵۰ میلیون</td>
                        <td className="p-3 font-mono">۱۰۰ تا ۱۵۰ میلیون</td>
                      </tr>
                      <tr className={cityTierData.tier === 2 ? "bg-emerald-50/80 text-emerald-950 font-black" : ""}>
                        <td className="p-3">سطح ۲: مراکز استان پرجمعیت (۳۵۰ هزار تا ۱.۲ م)</td>
                        <td className="p-3">کرمانشاه، ارومیه، رشت، زاهدان، همدان، کرمان، یزد، بندرعباس، اراک...</td>
                        <td className="p-3 font-mono text-emerald-700 font-black">۲۵ تا ۵۰ کارتن (۲۵-۵۰ م)</td>
                        <td className="p-3 font-mono">۸۰ تا ۱۵۰ کارتن</td>
                        <td className="p-3 font-mono">۳۰۰ تا ۴۵۰ میلیون</td>
                        <td className="p-3 font-mono">۷۰ تا ۱۰۰ میلیون</td>
                      </tr>
                      <tr className={cityTierData.tier === 3 ? "bg-emerald-50/80 text-emerald-950 font-black" : ""}>
                        <td className="p-3">سطح ۳: شهرهای متوسط و صنعتی (۱۰۰ تا ۳۵۰ هزار)</td>
                        <td className="p-3">کاشان، دزفول، بابل، آمل، ساوه، سیرجان، مراغه، رفسنجان، ملایر...</td>
                        <td className="p-3 font-mono text-emerald-700 font-black">۲۰ تا ۴۰ کارتن (۲۰-۴۰ م)</td>
                        <td className="p-3 font-mono">۵۰ تا ۱۰۰ کارتن</td>
                        <td className="p-3 font-mono">۱۸۰ تا ۲۸۰ میلیون</td>
                        <td className="p-3 font-mono">۴۰ تا ۷۰ میلیون</td>
                      </tr>
                      <tr className={cityTierData.tier === 4 ? "bg-emerald-50/80 text-emerald-950 font-black" : ""}>
                        <td className="p-3">سطح ۴: شهرستان‌ها و توزیع منطقه‌ای (زیر ۱۰۰ هزار)</td>
                        <td className="p-3">سایر شهرستان‌ها و مناطق تابعه استانی</td>
                        <td className="p-3 font-mono text-emerald-700 font-black">۱۵ تا ۳۰ کارتن (۱۵-۳۰ م)</td>
                        <td className="p-3 font-mono">۳۰ تا ۶۰ کارتن</td>
                        <td className="p-3 font-mono">۱۰۰ تا ۱۶۰ میلیون</td>
                        <td className="p-3 font-mono">۲۵ تا ۴۰ میلیون</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setActiveTab('form')}
                  className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all shadow-md flex items-center gap-2 cursor-pointer"
                >
                  <span>ثبت درخواست برای {city}</span>
                  <ArrowLeft size={14} />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'benefits' && (
          <motion.div
            key="benefits"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-black">
                  <DollarSign size={24} />
                </div>
                <h3 className="text-sm font-black text-slate-900">سود تضمین‌شده ۱۸٪ تا ۳۲٪</h3>
                <p className="text-xs font-bold text-slate-500 leading-relaxed">
                  با خرید مستقیم تناژی از خط تولید کارخانه، مابه‌التفاوت قیمت مصرف‌کننده و قیمت توزیع عمده مستقیماً به حساب نماینده اختصاص می‌یابد.
                </p>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black">
                  <Truck size={24} />
                </div>
                <h3 className="text-sm font-black text-slate-900">لجستیک و باربری بدون دغدغه</h3>
                <p className="text-xs font-bold text-slate-500 leading-relaxed">
                  ارسال مستقیم با ناوگان باربری بیمه شده از درب کارخانه به انبار نماینده همراه با بارنامه رسمی و پلمپ سربی.
                </p>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black">
                  <ShieldCheck size={24} />
                </div>
                <h3 className="text-sm font-black text-slate-900">حمایت بازاریابی و مشتریان منطقه‌ای</h3>
                <p className="text-xs font-bold text-slate-500 leading-relaxed">
                  تمام سفارش‌های خرد و سوپرمارکت‌های استان ثبت‌شده در سامانه، به نماینده رسمی همان منطقه ارجاع داده خواهد شد.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'tracking' && (
          <motion.div
            key="tracking"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-4 shadow-xs">
              <h3 className="text-base font-black text-slate-900">پیگیری پرونده‌های ثبت‌شده</h3>
              {(() => {
                const requests = JSON.parse(localStorage.getItem("dastavval_agency_requests") || "[]");
                if (requests.length === 0) {
                  return (
                    <div className="text-center py-10 text-slate-400 font-bold text-xs space-y-2">
                      <Clock className="mx-auto text-slate-300" size={32} />
                      <p>هنوز درخواستی توسط شما ثبت نشده است.</p>
                    </div>
                  );
                }
                return (
                  <div className="space-y-3">
                    {requests.map((r: any, idx: number) => (
                      <div key={`req-trace-${idx}`} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-black text-emerald-700 text-sm">{r.code}</span>
                            <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md">{r.status}</span>
                          </div>
                          <p className="text-xs font-bold text-slate-700">متقاضی: {r.fullName} ({r.companyName || 'شخصی'}) - منطقه: {r.province} ({r.city})</p>
                          {r.monthlyQuotaCeilingFormatted && (
                            <p className="text-[11px] font-black text-indigo-700">سقف سهمیه مصوب: {r.monthlyQuotaCeilingFormatted}</p>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">{r.date}</span>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
