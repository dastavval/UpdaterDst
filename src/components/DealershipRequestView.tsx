import React, { useState } from "react";
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
  AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import RepresentativeCertificateView from "./RepresentativeCertificateView";
import { addCallbackRequest } from "../lib/callback-helper";

interface DealershipRequestViewProps {
  b2bConfig?: any;
  user?: any;
  onNavigateHome: () => void;
  onOpenCertificate?: () => void;
}

export default function DealershipRequestView({
  b2bConfig,
  user,
  onNavigateHome,
  onOpenCertificate
}: DealershipRequestViewProps) {
  const [activeTab, setActiveTab] = useState<'form' | 'benefits' | 'certificate' | 'tracking'>('form');
  
  // Application Form States
  const [fullName, setFullName] = useState(user?.name || "");
  const [mobile, setMobile] = useState(user?.phone || user?.mobile || "");
  const [companyName, setCompanyName] = useState(user?.company || "");
  const [province, setProvince] = useState(user?.province || "تهران");
  const [city, setCity] = useState(user?.city || "تهران");
  const [warehouseSpace, setWarehouseSpace] = useState("۲۰۰ تا ۵۰۰ متر مربع");
  const [distributionVehicles, setDistributionVehicles] = useState("۲ تا ۴ دستگاه وانت/کامیونت");
  const [experienceYears, setExperienceYears] = useState("۵ تا ۱۰ سال");
  const [capitalRange, setCapitalRange] = useState("۱ تا ۳ میلیارد تومان");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [trackingCode, setTrackingCode] = useState<string | null>(null);

  // Provinces List
  const provinces = [
    "آذربایجان شرقی", "آذربایجان غربی", "اردبیل", "اصفهان", "البرز", "ایلام", "بوشهر", 
    "تهران", "چهارمحال و بختیاری", "خراسان جنوبی", "خراسان رضوی", "خراسان شمالی", 
    "خوزستان", "زنجان", "سمنان", "سیستان و بلوچستان", "فارس", "قزوین", "قم", "کردستان", 
    "کرمان", "کرمانشاه", "کهگیلویه و بویراحمد", "گلستان", "گیلان", "لرستان", "مازندران", 
    "مرکزی", "هرمزگان", "همدان", "یزد"
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
      const requestDetails = `[درخواست نمایندگی انحصاری] کد: ${generatedCode} | متقاضی: ${fullName} | شرکت: ${companyName || 'شخصی'} | استان: ${province} - شهر: ${city} | متراژ انبار: ${warehouseSpace} | ناوگان: ${distributionVehicles} | سابقه: ${experienceYears} | سرمایه در گردش: ${capitalRange} | توضیحات: ${notes || '-'}`;

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
          companyName
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
      
      {/* Header Banner */}
      <div className="relative bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl overflow-hidden border border-emerald-500/20">
        <div className="absolute top-0 left-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-white text-3xl shadow-inner shrink-0">
              <Award size={36} className="text-emerald-400" />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-black">
                  اعطای نمایندگی رسمی و انحصاری
                </span>
                <span className="text-[10px] text-slate-300 font-bold">شبکه سراسری صنایع غذایی کشور</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white">
                پورتال درخواست نمایندگی استانی و شهرستانی دست اول
              </h1>
              <p className="text-xs text-slate-300 font-bold leading-relaxed max-w-2xl">
                توزیع مستقیم تولیدات کارخانجات برتر با حاشیه سود تضمینی، بدون واسطه و با قرارداد رسمی حقوقی
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <button
              onClick={onNavigateHome}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer border border-white/20"
            >
              <span>صفحه اصلی</span>
              <ArrowLeft size={14} />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-white/10 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveTab('form')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'form' 
                ? "bg-white text-slate-900 shadow-md" 
                : "text-white/80 hover:text-white bg-white/5"
            }`}
          >
            <FileText size={14} />
            <span>تکمیل فرم درخواست نمایندگی</span>
          </button>

          <button
            onClick={() => setActiveTab('benefits')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'benefits' 
                ? "bg-white text-slate-900 shadow-md" 
                : "text-white/80 hover:text-white bg-white/5"
            }`}
          >
            <Sparkles size={14} />
            <span>مزایا، سود و شرایط اعطا</span>
          </button>

          <button
            onClick={() => setActiveTab('certificate')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'certificate' 
                ? "bg-white text-slate-900 shadow-md" 
                : "text-white/80 hover:text-white bg-white/5"
            }`}
          >
            <Award size={14} />
            <span>صدور و مشاهده حکم نمایندگی رسمی</span>
          </button>

          <button
            onClick={() => setActiveTab('tracking')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'tracking' 
                ? "bg-white text-slate-900 shadow-md" 
                : "text-white/80 hover:text-white bg-white/5"
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
                      کارشناسان امور نمایندگی‌های سراسر کشور تا حداکثر ۲۴ ساعت کاری جهت احراز هویت و عقد قرارداد با شما تماس خواهند گرفت.
                    </p>
                  </div>
                  <div className="inline-block p-4 bg-white border border-emerald-300 rounded-xl shadow-xs">
                    <span className="text-[11px] text-slate-500 font-bold block">کد رهگیری پرونده شما:</span>
                    <span className="text-lg font-black font-mono text-emerald-700">{trackingCode}</span>
                  </div>
                  <div className="pt-2 flex justify-center gap-3">
                    <button
                      onClick={() => setActiveTab('certificate')}
                      className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-black hover:bg-emerald-700 transition-all shadow-md cursor-pointer flex items-center gap-1.5"
                    >
                      <Award size={15} />
                      <span>مشاهده نمونه حکم نمایندگی</span>
                    </button>
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
                      <span>مشخصات متقاضی و مجموعه توزیع</span>
                    </h3>
                    <p className="text-[11px] text-slate-500 font-bold mt-0.5">
                      اطلاعات زیر به صورت مستقیم به دبیرخانه اعطای سهمیه و نمایندگی ارسال می‌گردد.
                    </p>
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
                        {provinces.map((p) => (
                          <option key={p} value={p}>{p}</option>
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
                        placeholder="مثال: کرج و حومه"
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
                        <span>ثبت نهایی درخواست و دریافت کد رهگیری رسمی</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>

            {/* Side Highlights */}
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-3xl p-6 space-y-4">
                <div className="flex items-center gap-2.5 text-emerald-800">
                  <ShieldCheck size={22} className="text-emerald-600" />
                  <h3 className="text-sm font-black">شرایط اعطای نمایندگی انحصاری</h3>
                </div>
                <ul className="space-y-2.5 text-xs font-bold text-slate-700">
                  <li className="flex items-start gap-2">
                    <Check size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                    <span>انحصار کامل فروش در محدوده جغرافیایی ثبت‌شده</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                    <span>قیمت پایه درب کارخانه بدون هیچ‌گونه کارمزد واسطه‌ای</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                    <span>تسهیلات خرید چکی با اعتبار‌سنجی بانکی صیاد</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                    <span>صدور حکم رسمی نمایندگی با قابلیت دانلود و چاپ A4</span>
                  </li>
                </ul>
              </div>

              <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-3">
                <div className="flex items-center gap-2 text-slate-900 font-black text-sm">
                  <Phone size={18} className="text-indigo-600" />
                  <span>واحد هماهنگی نمایندگی‌ها</span>
                </div>
                <p className="text-xs font-bold text-slate-500 leading-relaxed">
                  جهت پیگیری فوری یا هماهنگی جلسات حضوری با کارخانجات همکار:
                </p>
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-600">تلفن مستقیم:</span>
                  <a href="tel:09044502900" className="font-mono font-black text-emerald-700 text-sm" dir="ltr">
                    ۰۹۰۴ ۴۵۰ ۲۹۰۰
                  </a>
                </div>
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

        {activeTab === 'certificate' && (
          <motion.div
            key="certificate"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row justify-between items-center gap-4">
              <div>
                <h3 className="text-sm font-black text-slate-900">حکم نمایندگی رسمی و انحصاری</h3>
                <p className="text-xs font-bold text-slate-500 mt-1">
                  این گواهی معتبر حقوقی نشان‌دهنده احراز صلاحیت تجاری و توزیع مستقیم محصولات کارخانجات در استان می‌باشد.
                </p>
              </div>
              <button
                onClick={() => {
                  if (onOpenCertificate) onOpenCertificate();
                }}
                className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-black hover:bg-emerald-700 transition-all shadow-md cursor-pointer flex items-center gap-2 shrink-0"
              >
                <Award size={16} />
                <span>باز کردن گواهی تمام‌صفحه و چاپ</span>
              </button>
            </div>

            {/* Embedded Certificate Preview */}
            <div className="bg-slate-100 p-4 rounded-3xl overflow-x-auto flex justify-center">
              <RepresentativeCertificateView
                repName={user?.name || fullName || "بازرگان محترم البرز"}
                companyName={user?.company || companyName || "شرکت پخش سراسری فرتاک"}
                city={user?.city || city || "تهران و حومه"}
                agencyCode={trackingCode || "DS-AG-7821"}
                badge="نماینده انحصاری توزیع استانی"
                onClose={() => setActiveTab('form')}
                b2bConfig={b2bConfig}
              />
            </div>
          </motion.div>
        )}

        {activeTab === 'tracking' && (
          <motion.div
            key="tracking"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6"
          >
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900">پیگیری پرونده‌های ثبت‌شده</h3>
              <p className="text-xs font-bold text-slate-500">وضعیت بررسی درخواست‌های نمایندگی خود را در این بخش مشاهده فرمایید.</p>
            </div>

            {(() => {
              let localRequests: any[] = [];
              try {
                localRequests = JSON.parse(localStorage.getItem("dastavval_agency_requests") || "[]");
              } catch (e) {
                localRequests = [];
              }

              if (localRequests.length === 0) {
                return (
                  <div className="p-12 text-center text-slate-400 space-y-3">
                    <FileText size={48} className="mx-auto text-slate-300" strokeWidth={1.5} />
                    <p className="text-xs font-bold">هنوز درخواستی از این دستگاه ثبت نشده است.</p>
                    <button
                      onClick={() => setActiveTab('form')}
                      className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-black hover:bg-emerald-700 transition-all cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <span>تکمیل اولین درخواست</span>
                    </button>
                  </div>
                );
              }

              return (
                <div className="space-y-3">
                  {localRequests.map((req, idx) => (
                    <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-xs text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                            {req.code}
                          </span>
                          <h4 className="text-xs font-black text-slate-900">
                            درخواست نمایندگی استان {req.province} ({req.city})
                          </h4>
                        </div>
                        <p className="text-[11px] font-bold text-slate-500 mt-1">
                          متقاضی: {req.fullName} | تاریخ ثبت: {req.date}
                        </p>
                      </div>
                      <span className="px-3 py-1 bg-amber-100 text-amber-900 border border-amber-300 rounded-full text-[10px] font-black shrink-0">
                        {req.status}
                      </span>
                    </div>
                  ))}
                </div>
              );
            })()}
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
