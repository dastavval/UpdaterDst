import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, 
  X, 
  Check, 
  Sparkles, 
  Users, 
  Store, 
  Crown, 
  Building2, 
  ArrowLeft, 
  CheckCircle2, 
  MapPin, 
  Zap, 
  DollarSign,
  Truck,
  FileText,
  BadgePercent
} from 'lucide-react';
import { addCallbackRequest } from '../lib/callback-helper';

interface CompetitiveAdvantagesAndRoadmapProps {
  theme?: 'light' | 'dark' | 'classic';
  onRoleSelect?: (roleKey: string) => void;
}

export const CompetitiveAdvantagesAndRoadmap: React.FC<CompetitiveAdvantagesAndRoadmapProps> = ({ 
  theme = 'light',
  onRoleSelect
}) => {
  const [selectedRole, setSelectedRole] = useState<number>(0);
  const [modalRole, setModalRole] = useState<any | null>(null);

  // Real registration form state
  const [regFullName, setRegFullName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regCity, setRegCity] = useState('');
  const [regStoreName, setRegStoreName] = useState('');
  const [regSubmitting, setRegSubmitting] = useState(false);
  const [regSuccess, setRegSuccess] = useState(false);

  // Comparison matrix rows (Short & Compact for mobile)
  const comparisonData = [
    {
      metric: 'قیمت و حاشیه سود',
      icon: DollarSign,
      traditional: 'سود محدود و گران با واسطه',
      dastavval: 'سود ۱۰۰٪ با قیمت کارخانه',
    },
    {
      metric: 'اصالت کالا و فاکتور',
      icon: FileText,
      traditional: 'فاکتور غیررسمی و دستی',
      dastavval: 'فاکتور رسمی با شناسه کالا',
    },
    {
      metric: 'ضمانت سلامت و بیمه',
      icon: Truck,
      traditional: 'مسئولیت خسارت با خریدار',
      dastavval: 'پلمپ کارخانه + بیمه ترانزیت',
    },
    {
      metric: 'گارانتی مرجوعی',
      icon: ShieldCheck,
      traditional: 'بدون پذیرش مرجوعی',
      dastavval: 'تضمین تعویض بی‌قید و شرط',
    },
    {
      metric: 'شرایط تسویه',
      icon: BadgePercent,
      traditional: 'تسویه نقدی بدون تخفیف',
      dastavval: 'خرید اعتباری VIP + امتیاز نقد',
    },
    {
      metric: 'سرعت تحویل بار',
      icon: Zap,
      traditional: '۳ تا ۷ روز معطلی انبار',
      dastavval: 'ارسال مستقیم زیر ۴۸ ساعت',
    }
  ];

  // Professional Roles on Roadmap for B2B Wholesale
  const roles = [
    {
      id: 1,
      key: 'marketer',
      title: 'بازاریاب و ویزیتور',
      subtitle: 'شروع بدون سرمایه اولیه',
      badge: 'سطح ۱ - ورود سریع',
      badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      icon: Users,
      color: 'bg-emerald-600',
      income: 'پورسانت ۵٪ تا ۱۲٪ از هر سفارش',
      desc: 'با کاتالوگ آنلاین اختصاصی، محصولات کارخانجات را به فروشگاه‌ها معرفی کرده و پورسانت نقدی دریافت کنید.',
      features: [
        'بدون نیاز به چک یا سرمایه اولیه',
        'دسترسی به کاتالوگ آنلاین و پیش‌فاکتور',
        'پشتیبانی و آموزش رایگان ویزیتوری'
      ],
      actionText: 'ثبت‌نام به عنوان بازاریاب'
    },
    {
      id: 2,
      key: 'seller',
      title: 'فروشنده و بنکدار خرد',
      subtitle: 'سود ۱۰۰٪ دست شماست',
      badge: 'سطح ۲ - خریدار عمده',
      badgeBg: 'bg-teal-100 text-teal-800 border-teal-300',
      icon: Store,
      color: 'bg-teal-600',
      income: 'حاشیه سود اختیاری و دلخواه',
      desc: 'سفارش مستقیم از کارخانه با قیمت خروجی و کسب بیشترین سود در عرضه به سوپرمارکت‌ها.',
      features: [
        'خرید مستقیم با قیمت مصوب تولیدی',
        'تعیین آزادانه قیمت فروش و سود',
        'ارسال سریع با پلمپ و بیمه باربری'
      ],
      actionText: 'شروع خرید عمده'
    },
    {
      id: 3,
      key: 'representative',
      title: 'نماینده استانی و عاملیت',
      subtitle: 'سهمیه اختصاصی استان',
      badge: 'سطح ۳ - نماینده رسمی',
      badgeBg: 'bg-blue-100 text-blue-800 border-blue-300',
      icon: MapPin,
      color: 'bg-blue-600',
      income: 'سهمیه انحصاری + سود حجمی',
      desc: 'انبارداری منطقه‌ای و توزیع بارهای پالتی و تریلی کارخانجات در سطح استان با پشتیبانی تبلیغاتی.',
      features: [
        'عاملیت انحصاری توزیع استانی',
        'تخفیف ویژه حجمی تا ۳۵٪ پایه کارخانه',
        'پنل اختصاصی مدیریت انبار'
      ],
      actionText: 'درخواست نمایندگی استانی'
    },
    {
      id: 4,
      key: 'leader',
      title: 'لیدر و مدیر شبکه توزیع',
      subtitle: 'رهبری تیم فروش کشوری',
      badge: 'سطح ۴ - مدیریت شبکه',
      badgeBg: 'bg-purple-100 text-purple-800 border-purple-300',
      icon: Crown,
      color: 'bg-purple-600',
      income: 'پاداش مدیریت از گردش شبکه',
      desc: 'تشکیل و رهبری شبکه بازاریابان و نمایندگان فروش، بهره‌مندی از اعتبارات مالی خرید.',
      features: [
        'داشبورد هوشمند تحلیل آمار تیم',
        'حد اعتباری تسویه چک و سفته VIP',
        'پاداش‌های ماهانه و تسهیلات توسعه'
      ],
      actionText: 'ورود به سطح لیدری'
    },
    {
      id: 5,
      key: 'supplier',
      title: 'تامین‌کننده و کارخانه‌دار',
      subtitle: 'عرضه مستقیم محصولات',
      badge: 'سطح ۵ - مرجع تولید',
      badgeBg: 'bg-amber-100 text-amber-800 border-amber-300',
      icon: Building2,
      color: 'bg-amber-600',
      income: 'فروش یکپارچه و نقدی حجمی',
      desc: 'اتصال مستقیم خطوط تولید کارخانه به بیش از ۵,۰۰۰ بنکدار و خریدار عمده سراسر کشور.',
      features: [
        'خروج مستقیم بار از خط تولید',
        'تسویه حساب تضمین شده در سامانه امن',
        'حذف هزینه‌های سنگین بازاریابی سنتی'
      ],
      actionText: 'ثبت کارخانه و محصولات'
    }
  ];

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regFullName.trim() || !regPhone.trim()) {
      alert("لطفاً نام و نام خانوادگی و شماره تماس خود را وارد کنید.");
      return;
    }

    setRegSubmitting(true);
    try {
      const details = `ثبت‌نام نقش نقشه راه: [${modalRole?.title}] | نام: ${regFullName} | شهر: ${regCity || 'نامشخص'} | فروشگاه/مجموعه: ${regStoreName || 'عادی'}`;
      await addCallbackRequest(regPhone, details);
      setRegSuccess(true);
      setTimeout(() => {
        setRegSuccess(false);
        setRegFullName('');
        setRegPhone('');
        setRegCity('');
        setRegStoreName('');
        setModalRole(null);
      }, 2500);
    } catch (err: any) {
      alert("خطا در ثبت‌نام: " + err.message);
    } finally {
      setRegSubmitting(false);
    }
  };

  return (
    <div className="w-full space-y-6 my-4 text-right" dir="rtl">
      
      {/* ========================================== */}
      {/* 1. SHORT & RESPONSIVE COMPETITIVE TABLE    */}
      {/* ========================================== */}
      <section className="relative bg-white border border-slate-200 rounded-3xl p-3.5 sm:p-6 shadow-xs overflow-hidden">
        <div className="relative z-10 space-y-4">
          <div className="text-center max-w-xl mx-auto space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] sm:text-xs font-black border border-emerald-300">
              <Sparkles size={13} className="text-emerald-600 animate-pulse" />
              <span>جدول مزیت رقابتی دست اول</span>
            </div>
            <h3 className="text-sm sm:text-lg font-black text-slate-900 leading-snug">
              مقایسه سریع <span className="text-red-600 line-through">واسطه‌های سنتی</span> با <span className="text-emerald-600">دست اول</span>
            </h3>
          </div>

          {/* MOBILE CARDS VIEW (Clean, No Horizontal Scroll needed on Phone) */}
          <div className="grid grid-cols-1 gap-2.5 sm:hidden">
            {comparisonData.map((row, idx) => {
              const RowIcon = row.icon;
              return (
                <div key={idx} className="bg-slate-50/80 p-3 rounded-2xl border border-slate-200 space-y-2">
                  <div className="flex items-center gap-2 text-slate-900 font-black text-xs border-b border-slate-200/60 pb-1.5">
                    <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                      <RowIcon size={13} />
                    </div>
                    <span>{row.metric}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[10.5px]">
                    <div className="p-2 bg-red-50/70 border border-red-200/70 rounded-xl space-y-0.5">
                      <span className="text-[9px] font-black text-red-600 flex items-center gap-0.5">
                        <X size={10} />
                        بازار واسطه‌ای
                      </span>
                      <p className="text-red-950 font-bold leading-tight">{row.traditional}</p>
                    </div>
                    <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-xl space-y-0.5">
                      <span className="text-[9px] font-black text-emerald-700 flex items-center gap-0.5">
                        <Check size={10} />
                        سامانه دست اول
                      </span>
                      <p className="text-emerald-950 font-black leading-tight">{row.dastavval}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* TABLE VIEW FOR TABLET & DESKTOP (or swipeable view) */}
          <div className="hidden sm:block overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-right border-collapse min-w-[500px] text-[11px] sm:text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-800 font-black">
                  <th className="p-2.5 sm:p-3 text-right w-1/4 border-b border-slate-200">معیار کلیدی</th>
                  <th className="p-2.5 sm:p-3 text-center w-3/8 bg-slate-50 text-slate-600 border-b border-slate-200">
                    <span className="flex items-center justify-center gap-1">
                      <X size={13} className="text-red-500" />
                      <span>بازار واسطه‌ای</span>
                    </span>
                  </th>
                  <th className="p-2.5 sm:p-3 text-center w-3/8 bg-emerald-600 text-white font-black">
                    <span className="flex items-center justify-center gap-1">
                      <Check size={14} className="text-white stroke-[3]" />
                      <span>سامانه دست اول</span>
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-bold">
                {comparisonData.map((row, idx) => {
                  const RowIcon = row.icon;
                  return (
                    <tr key={idx} className="transition-colors hover:bg-slate-50">
                      <td className="p-2.5 sm:p-3 text-slate-900 font-black flex items-center gap-1.5">
                        <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                          <RowIcon size={13} />
                        </div>
                        <span className="truncate">{row.metric}</span>
                      </td>
                      <td className="p-2.5 sm:p-3 text-slate-500 text-center bg-slate-50/60">
                        <span className="text-red-700 bg-red-50 px-2 py-0.5 rounded-lg border border-red-200 text-[10px] font-bold inline-block">
                          {row.traditional}
                        </span>
                      </td>
                      <td className="p-2.5 sm:p-3 text-slate-900 font-black text-center bg-emerald-50/80 border-r border-emerald-200">
                        <span className="bg-emerald-600 text-white px-2.5 py-0.5 rounded-lg shadow-2xs text-[10px] font-black inline-block">
                          {row.dastavval}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>


      {/* ========================================== */}
      {/* 2. REAL ROADMAP FOR NEWCOMERS & ROLES      */}
      {/* ========================================== */}
      <section className="relative bg-white border-2 border-slate-200 rounded-3xl p-4 sm:p-6 text-slate-900 shadow-xs overflow-hidden">
        <div className="relative z-10 space-y-4">
          
          <div className="text-center max-w-xl mx-auto space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] sm:text-xs font-black border border-emerald-300">
              <Crown size={14} className="text-amber-600" />
              <span>نقشه راه رشد و ثبت‌نام نقش‌ها</span>
            </div>
            <h3 className="text-sm sm:text-xl font-black text-slate-900 leading-snug">
              انتخاب نقش حرفه‌ای و ثبت‌نام آنلاین در زنجیره تأمین
            </h3>
            <p className="text-[11px] sm:text-xs font-bold text-slate-500">
              یکی از نقش‌های زیر را انتخاب کنید و فرم ثبت‌نام را تکمیل فرمایید
            </p>
          </div>

          {/* 5 ROADMAP CARDS */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 relative z-10">
            {roles.map((role, idx) => {
              const RoleIcon = role.icon;
              const isSelected = selectedRole === idx;

              return (
                <motion.div
                  key={role.id}
                  whileHover={{ y: -2 }}
                  onClick={() => {
                    setSelectedRole(idx);
                    if (onRoleSelect) onRoleSelect(role.key);
                  }}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between relative ${
                    isSelected 
                      ? 'bg-emerald-50/90 border-emerald-500 shadow-sm ring-2 ring-emerald-200' 
                      : 'bg-slate-50 border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/20'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded border ${role.badgeBg}`}>
                      {role.badge.split('-')[0]}
                    </span>
                    <span className="text-[9px] font-mono font-black text-slate-400">#0{role.id}</span>
                  </div>

                  <div className="flex flex-col items-center text-center space-y-1.5 my-1.5">
                    <div className={`w-9 h-9 rounded-xl ${role.color} text-white flex items-center justify-center shadow-xs`}>
                      <RoleIcon size={18} />
                    </div>
                    <div>
                      <h4 className="text-[11px] sm:text-xs font-black text-slate-900 leading-tight">{role.title}</h4>
                      <p className="text-[9px] font-bold text-emerald-700 mt-0.5">{role.subtitle}</p>
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200 p-1.5 rounded-lg text-center mb-2">
                    <span className="text-[9px] font-black text-amber-800 block truncate">
                      {role.income}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setModalRole(role);
                    }}
                    className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-black transition-all flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <span>ثبت‌نام این نقش</span>
                    <ArrowLeft size={11} />
                  </button>
                </motion.div>
              );
            })}
          </div>

          {/* ACTIVE ROLE BANNER */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 sm:p-5 text-right">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-black ${roles[selectedRole].badgeBg}`}>
                    {roles[selectedRole].badge}
                  </span>
                  <h4 className="text-xs sm:text-sm font-black text-slate-900">
                    {roles[selectedRole].title} — <span className="text-emerald-700">{roles[selectedRole].subtitle}</span>
                  </h4>
                </div>
                <p className="text-[11px] sm:text-xs font-bold text-slate-600 leading-relaxed max-w-3xl">
                  {roles[selectedRole].desc}
                </p>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {roles[selectedRole].features.map((feat, i) => (
                    <span key={i} className="inline-flex items-center gap-1 bg-white border border-slate-200 text-slate-800 px-2 py-0.5 rounded-md text-[9px] sm:text-[10px] font-bold">
                      <CheckCircle2 size={11} className="text-emerald-600" />
                      <span>{feat}</span>
                    </span>
                  ))}
                </div>
              </div>

              <div className="shrink-0 w-full md:w-auto">
                <button
                  type="button"
                  onClick={() => setModalRole(roles[selectedRole])}
                  className="w-full md:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Sparkles size={14} />
                  <span>تکمیل فرم ثبت‌نام {roles[selectedRole].title}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* REAL REGISTRATION MODAL */}
      <AnimatePresence>
        {modalRole && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs" dir="rtl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-5 sm:p-6 max-w-md w-full border border-slate-200 shadow-xl text-slate-900 space-y-4 text-right relative max-h-[90vh] overflow-y-auto"
            >
              <button
                type="button"
                onClick={() => setModalRole(null)}
                className="absolute top-4 left-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-all cursor-pointer"
              >
                <X size={18} />
              </button>

              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl ${modalRole.color} text-white flex items-center justify-center shadow-xs`}>
                  {React.createElement(modalRole.icon, { size: 20 })}
                </div>
                <div>
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded border ${modalRole.badgeBg}`}>
                    {modalRole.badge}
                  </span>
                  <h3 className="text-sm font-black text-slate-900 mt-0.5">فرم ثبت‌نام {modalRole.title}</h3>
                </div>
              </div>

              {regSuccess ? (
                <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-3">
                  <div className="w-12 h-12 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto shadow-md">
                    <CheckCircle2 size={24} />
                  </div>
                  <h4 className="text-sm font-black text-emerald-950">ثبت‌نام شما با موفقیت انجام شد!</h4>
                  <p className="text-xs font-bold text-emerald-800">
                    اطلاعات شما در سامانه ثبت گردید. همکاران واحد پذیرش دست اول جهت فعال‌سازی پنل و هماهنگی بزودی با شما تماس خواهند گرفت.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleRegisterSubmit} className="space-y-3">
                  <p className="text-[11px] font-bold text-slate-600">
                    جهت دریافت دسترسی، کاتالوگ و فعال‌سازی حساب کاربری به‌عنوان <span className="text-emerald-700 font-black">{modalRole.title}</span>، اطلاعات زیر را وارد کنید:
                  </p>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-700">نام و نام خانوادگی <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      required
                      value={regFullName}
                      onChange={(e) => setRegFullName(e.target.value)}
                      placeholder="مثال: علی رضایی"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-700">شماره موبایل (جهت تماس و تایید) <span className="text-red-500">*</span></label>
                    <input
                      type="tel"
                      required
                      dir="ltr"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="09123456789"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-right focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-700">شهر / استان</label>
                      <input
                        type="text"
                        value={regCity}
                        onChange={(e) => setRegCity(e.target.value)}
                        placeholder="مثال: تهران"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-700">نام فروشگاه / شرکت (اختیاری)</label>
                      <input
                        type="text"
                        value={regStoreName}
                        onChange={(e) => setRegStoreName(e.target.value)}
                        placeholder="مثال: پخش مرکزی"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="p-3 bg-emerald-50/60 border border-emerald-100 rounded-xl text-[10px] font-bold text-emerald-900">
                    ✨ <strong className="text-emerald-950">مزیت پیوستن:</strong> {modalRole.income}
                  </div>

                  <div className="pt-2 flex gap-2">
                    <button
                      type="submit"
                      disabled={regSubmitting}
                      className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all shadow-xs cursor-pointer text-center disabled:opacity-50"
                    >
                      {regSubmitting ? 'در حال ثبت...' : 'ثبت‌نام نهایی و ارسال درخواست'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setModalRole(null)}
                      className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black transition-all cursor-pointer"
                    >
                      انصراف
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

