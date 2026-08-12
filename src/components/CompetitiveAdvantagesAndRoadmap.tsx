import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, 
  X, 
  Check, 
  Sparkles, 
  Users, 
  Store, 
  Award, 
  Crown, 
  Building2, 
  ArrowLeft, 
  CheckCircle2, 
  TrendingUp, 
  HandCoins, 
  MapPin, 
  Zap, 
  ArrowRight,
  ChevronDown,
  Info,
  DollarSign,
  Truck,
  FileText,
  BadgePercent
} from 'lucide-react';

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

  // Comparison matrix rows
  const comparisonData = [
    {
      metric: 'قیمت و حاشیه سود فروشنده',
      icon: DollarSign,
      traditional: 'سود محدود و گران به دلیل وجود واسطه‌ها و دست‌به‌دست شدن',
      dastavval: 'سود ۱۰۰٪ دست شماست! خرید با قیمت کارخانه و آزادی کامل در تعیین سود',
      highlight: true
    },
    {
      metric: 'اصالت کالا و فاکتور',
      icon: FileText,
      traditional: 'فاکتور غیررسمی، دستی یا بدون کد شناسه کالا',
      dastavval: 'پیش‌فاکتور و فاکتور رسمی شرکتی با کد شناسه کالا',
      highlight: false
    },
    {
      metric: 'ضمانت سلامت و بیمه بار',
      icon: Truck,
      traditional: 'مسئولیت شکستگی یا خسارت جاده‌ای تماماً با خریدار',
      dastavval: 'پلمپ اختصاصی کارخانه + ۱۰۰٪ بیمه حوادث ترانزیت جاده‌ای',
      highlight: true
    },
    {
      metric: 'گارانتی تعویض و مرجوعی',
      icon: ShieldCheck,
      traditional: 'عدم پذیرش مرجوعی و خواب طولانی سرمایه در انبار',
      dastavval: 'تضمین ۱۰۰٪ تعویض و مرجوعی بدون قید و شرط',
      highlight: false
    },
    {
      metric: 'شرایط مالی و تسویه',
      icon: BadgePercent,
      traditional: 'تسویه نقدی کامل بدون تخفیف یا امتیاز اعتباری',
      dastavval: 'امکان خرید اعتباری VIP + امتیاز نقدشوندگی سریع',
      highlight: true
    },
    {
      metric: 'سرعت تحویل بار',
      icon: Zap,
      traditional: '۳ تا ۷ روز معطلی در انبارهای واسطه‌ای',
      dastavval: 'ارسال مستقیم از خط تولید کارخانه زیر ۴۸ ساعت',
      highlight: false
    }
  ];

  // Newcomer Career Roles on Roadmap
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
      income: 'پورسانت ۵٪ تا ۱۲٪ از هر ثبت سفارش',
      desc: 'با کاتالوگ آنلاین اختصاصی، محصولات کارخانجات را به فروشگاه‌ها و بنکداران معرفی کرده و بلافاصله پورسانت نقدی دریافت کنید.',
      features: [
        'بدون نیاز به چک، سفته یا سرمایه اولیه',
        'دسترسی به کاتالوگ آنلاین و پیش‌فاکتور سریع',
        'پشتیبانی و آموزش رایگان اصول ویزیتوری'
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
      income: 'حاشیه سود اختیاری و دلخواه شما',
      desc: 'سفارش مستقیم از کارخانه با قیمت خروجی، تعیین قیمت فروش دلخواه و کسب بیشترین سود در عرضه به سوپرمارکت‌ها.',
      features: [
        'خرید مستقیم با قیمت مصوب تولیدی',
        'تعیین آزادانه قیمت فروش و حاشیه سود',
        'ارسال سریع با پلمپ باربری و بیمه'
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
      desc: 'انبارداری منطقه‌ای و توزیع بارهای پالتی و تریلی کارخانجات در سطح استان با پشتیبانی کامل تبلیغاتی و استندهای رایگان.',
      features: [
        'دریافت عاملیت انحصاری توزیع استانی',
        'تخفیف ویژه حجمی تا ۳۵٪ پایه کارخانه',
        'پنل اختصاصی مدیریت انبار و سفارشات'
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
      income: 'پاداش مدیریت از کل گردش شبکه',
      desc: 'تشکیل و رهبری شبکه بازاریابان و نمایندگان فروش، بهره‌مندی از اعتبارات مالی خرید و دریافت پاداش‌های دوره‌ای.',
      features: [
        'داشبورد هوشمند تحلیل آمار و عملکرد تیم',
        'دریافت حد اعتباری تسویه چک و سفته VIP',
        'پاداش‌های ماهانه و تسهیلات توسعه کسب‌وکار'
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
      desc: 'اتصال مستقیم خطوط تولید کارخانه به بیش از ۵,۰۰۰ بنکدار و خریدار عمده سراسر کشور بدون هزینه تبلیغات و واسطه.',
      features: [
        'خروج مستقیم بار از خط تولید به مقصد خریدار',
        'تسویه حساب تضمین شده در سامانه امن',
        'حذف هزینه‌های سنگین بازاریابی سنتی'
      ],
      actionText: 'ثبت کارخانه و محصولات'
    }
  ];

  return (
    <div className="w-full space-y-8 my-6 text-right" dir="rtl">
      
      {/* ========================================== */}
      {/* 1. CREATIVE WHITE COMPARISON TABLE         */}
      {/* ========================================== */}
      <section className="relative bg-white border border-slate-200 rounded-3xl p-4 sm:p-8 shadow-xs overflow-hidden">
        <div className="relative z-10 space-y-6">
          {/* Header */}
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-black border border-emerald-300">
              <Sparkles size={14} className="text-emerald-600 animate-pulse" />
              <span>جدول شفافیت و سودآوری</span>
            </div>
            <h3 className="text-lg sm:text-2xl font-black text-slate-900 leading-snug">
              مقایسه خریـد از <span className="text-red-600 line-through">بازار واسطه‌ای</span> با <span className="text-emerald-600">سامانه دست اول</span>
            </h3>
            <p className="text-xs sm:text-sm font-bold text-slate-500">
              ما محصول را مستقیم از کارخانه می‌دهیم؛ تعیین قیمت فروش و سود حاصله تا ۱۰۰٪ کاملاً دست شماست
            </p>
          </div>

          {/* WHITE MATRIX TABLE */}
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-right border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-slate-100 text-slate-800 text-xs font-black">
                  <th className="p-3.5 sm:p-4 text-right w-1/4 rounded-tr-2xl border-b border-slate-200">معیار کلیدی</th>
                  <th className="p-3.5 sm:p-4 text-center w-3/8 bg-slate-50 text-slate-600 border-b border-slate-200">
                    <span className="flex items-center justify-center gap-1.5">
                      <X size={15} className="text-red-500" />
                      <span>بازار واسطه‌ای و سنتی</span>
                    </span>
                  </th>
                  <th className="p-3.5 sm:p-4 text-center w-3/8 bg-emerald-600 text-white rounded-tl-2xl">
                    <span className="flex items-center justify-center gap-1.5">
                      <Check size={16} className="text-white stroke-[3]" />
                      <span>پلتفرم مستقیم "دست اول"</span>
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-bold">
                {comparisonData.map((row, idx) => {
                  const RowIcon = row.icon;
                  return (
                    <tr 
                      key={idx} 
                      className={`transition-colors hover:bg-slate-50 ${
                        row.highlight ? 'bg-emerald-50/40' : 'bg-white'
                      }`}
                    >
                      {/* Metric Name */}
                      <td className="p-3.5 sm:p-4 text-slate-900 font-black flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                          <RowIcon size={15} />
                        </div>
                        <span>{row.metric}</span>
                      </td>

                      {/* Traditional Market */}
                      <td className="p-3.5 sm:p-4 text-slate-500 text-center bg-slate-50/60">
                        <div className="inline-flex items-center gap-1.5 text-red-700 bg-red-50 px-2.5 py-1 rounded-xl border border-red-200 text-[11px] font-bold">
                          <X size={13} className="shrink-0 text-red-500" />
                          <span>{row.traditional}</span>
                        </div>
                      </td>

                      {/* DastAvval Direct */}
                      <td className="p-3.5 sm:p-4 text-slate-900 font-black text-center bg-emerald-50/80 border-r border-emerald-200">
                        <div className="inline-flex items-center gap-1.5 bg-emerald-600 text-white px-3 py-1 rounded-xl shadow-2xs text-[11px] font-black">
                          <Check size={14} className="shrink-0 text-white stroke-[3]" />
                          <span>{row.dastavval}</span>
                        </div>
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
      {/* 2. CREATIVE WHITE ROADMAP FOR NEWCOMERS    */}
      {/* ========================================== */}
      <section className="relative bg-white border-2 border-slate-200 rounded-3xl p-4 sm:p-8 text-slate-900 shadow-xs overflow-hidden">
        <div className="relative z-10 space-y-6">
          
          {/* Header */}
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-black border border-emerald-300">
              <Crown size={15} className="text-amber-600" />
              <span>نقشه راه رشد و کسب درآمد تازه واردین</span>
            </div>
            <h3 className="text-lg sm:text-2xl font-black text-slate-900 leading-snug">
              مسیر فعالیت شما؛ محصول از ما، سود ۱۰۰٪ دست شماست
            </h3>
            <p className="text-xs sm:text-sm font-bold text-slate-500">
              نقش خود را انتخاب کرده و فعالیت خود را بدون ریسک آغاز کنید!
            </p>
          </div>

          {/* 5 ROADMAP STEP CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 relative z-10">
            {roles.map((role, idx) => {
              const RoleIcon = role.icon;
              const isSelected = selectedRole === idx;

              return (
                <motion.div
                  key={role.id}
                  whileHover={{ y: -3 }}
                  onClick={() => {
                    setSelectedRole(idx);
                    if (onRoleSelect) onRoleSelect(role.key);
                  }}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between relative ${
                    isSelected 
                      ? 'bg-emerald-50/80 border-emerald-500 shadow-md ring-2 ring-emerald-200' 
                      : 'bg-slate-50 border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/30'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-md border ${role.badgeBg}`}>
                      {role.badge}
                    </span>
                    <span className="text-[10px] font-mono font-black text-slate-400">#0{role.id}</span>
                  </div>

                  <div className="flex flex-col items-center text-center space-y-2 my-2">
                    <div className={`w-11 h-11 rounded-2xl ${role.color} text-white flex items-center justify-center shadow-xs`}>
                      <RoleIcon size={22} />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-black text-slate-900">{role.title}</h4>
                      <p className="text-[10px] font-bold text-emerald-700 mt-0.5">{role.subtitle}</p>
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200 p-2 rounded-xl text-center mb-3">
                    <span className="text-[10px] font-black text-amber-800 block truncate">
                      {role.income}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setModalRole(role);
                    }}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[11px] font-black transition-all flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <span>جزئیات و ثبت‌نام</span>
                    <ArrowLeft size={13} />
                  </button>
                </motion.div>
              );
            })}
          </div>

          {/* ACTIVE ROLE DETAILED EXPANDED BANNER */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-6 text-right">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-black ${roles[selectedRole].badgeBg}`}>
                    {roles[selectedRole].badge}
                  </span>
                  <h4 className="text-base font-black text-slate-900">
                    {roles[selectedRole].title} — <span className="text-emerald-700">{roles[selectedRole].subtitle}</span>
                  </h4>
                </div>
                <p className="text-xs font-bold text-slate-600 leading-relaxed max-w-3xl">
                  {roles[selectedRole].desc}
                </p>

                <div className="flex flex-wrap gap-2 pt-1">
                  {roles[selectedRole].features.map((feat, i) => (
                    <span key={i} className="inline-flex items-center gap-1 bg-white border border-slate-200 text-slate-800 px-2.5 py-1 rounded-lg text-[10px] font-bold">
                      <CheckCircle2 size={12} className="text-emerald-600" />
                      <span>{feat}</span>
                    </span>
                  ))}
                </div>
              </div>

              <div className="shrink-0 w-full md:w-auto">
                <button
                  type="button"
                  onClick={() => setModalRole(roles[selectedRole])}
                  className="w-full md:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Sparkles size={16} />
                  <span>{roles[selectedRole].actionText}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ROLE DETAILS & ACTION MODAL */}
      <AnimatePresence>
        {modalRole && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs" dir="rtl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 max-w-md w-full border border-slate-200 shadow-xl text-slate-900 space-y-4 text-right relative"
            >
              <button
                type="button"
                onClick={() => setModalRole(null)}
                className="absolute top-4 left-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-all cursor-pointer"
              >
                <X size={18} />
              </button>

              <div className="flex items-center gap-3">
                <div className={`w-11 h-11 rounded-2xl ${modalRole.color} text-white flex items-center justify-center shadow-xs`}>
                  {React.createElement(modalRole.icon, { size: 22 })}
                </div>
                <div>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-md border ${modalRole.badgeBg}`}>
                    {modalRole.badge}
                  </span>
                  <h3 className="text-base font-black text-slate-900 mt-0.5">{modalRole.title}</h3>
                </div>
              </div>

              <p className="text-xs font-bold text-slate-600 leading-relaxed">
                {modalRole.desc}
              </p>

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl">
                <span className="block text-[10px] font-black text-emerald-800 mb-0.5">مزیت مالی و سودآوری:</span>
                <span className="text-xs font-black text-emerald-950">{modalRole.income}</span>
              </div>

              <div className="space-y-1.5 pt-1">
                <span className="block text-xs font-black text-slate-800">ویژگی‌ها و مزایای این نقش:</span>
                {modalRole.features.map((f: string, i: number) => (
                  <div key={i} className="flex items-center gap-2 text-xs font-bold text-slate-600">
                    <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                    <span>{f}</span>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-slate-100 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    alert(`درخواست ثبت‌نام شما برای نقش «${modalRole.title}» با موفقیت ثبت شد. همکاران پشتیبانی جهت فعال‌سازی حساب با شما تماس خواهند گرفت.`);
                    setModalRole(null);
                  }}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all shadow-xs cursor-pointer text-center"
                >
                  تایید و شروع ثبت‌نام
                </button>
                <button
                  type="button"
                  onClick={() => setModalRole(null)}
                  className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black transition-all cursor-pointer"
                >
                  انصراف
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
