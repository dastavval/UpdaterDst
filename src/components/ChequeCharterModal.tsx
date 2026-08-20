import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, 
  ShieldCheck, 
  TrendingUp, 
  CheckCircle2, 
  X, 
  HelpCircle, 
  Award, 
  Receipt, 
  AlertCircle,
  Building,
  Coins,
  Scale
} from 'lucide-react';

interface ChequeCharterModalProps {
  isOpen: boolean;
  onClose: () => void;
  userCredit?: number;
}

export default function ChequeCharterModal({
  isOpen,
  onClose,
  userCredit = 50000000
}: ChequeCharterModalProps) {
  if (!isOpen) return null;

  const tiers = [
    {
      level: 1,
      title: "سطح ۱: خرید اولیه (همکاران نقره‌ای)",
      orderLimit: "۱۰۰ میلیون تومان",
      chequeLimit: "۵۰ میلیون تومان",
      cashShare: "۵۰ میلیون تومان (۵۰٪ نقد + ۵۰٪ چک)",
      duration: "۳۰ الی ۴۵ روزه",
      condition: "تکمیل احراز هویت شغلی و ارائه جواز کسب یا معرفی‌نامه بنکداری",
      badge: "پایه معامله",
      color: "border-slate-300 bg-slate-50/60 text-slate-800"
    },
    {
      level: 2,
      title: "سطح ۲: خوش‌حسابی مرحله اول (همکاران طلایی)",
      orderLimit: "۲۰۰ میلیون تومان",
      chequeLimit: "۱۰۰ میلیون تومان",
      cashShare: "۱۰۰ میلیون نقد + ۱۰۰ میلیون چک (یا ۱۰۰ م تمام‌چکی)",
      duration: "۴۵ الی ۶۰ روزه",
      condition: "وصول موفق و پاس‌شدن به‌موقع اولین چک صادر شده در پلتفرم",
      badge: "ارتقاء ۱۰۰ میلیونی",
      color: "border-amber-300 bg-amber-50/60 text-amber-900"
    },
    {
      level: 3,
      title: "سطح ۳: خریدار معتبر و ویژه (همکاران VIP)",
      orderLimit: "۵۰۰ میلیون تومان",
      chequeLimit: "۲۵۰ میلیون تومان",
      cashShare: "۲۵۰ میلیون نقد + ۲۵۰ میلیون چک (یا ۲۵۰ م تمام‌چکی)",
      duration: "۶۰ الی ۷۵ روزه",
      condition: "وصول موفق حداقل ۲ الی ۳ فقره چک متوالی بدون سابقه تاخیر یا برگشتی",
      badge: "اعتبار ۲۵۰ میلیونی",
      color: "border-indigo-300 bg-indigo-50/60 text-indigo-900"
    },
    {
      level: 4,
      title: "سطح ۴: شرکای تجاری ارشد (الماس و زنجیره‌ای)",
      orderLimit: "۱ میلیارد تومان به بالا",
      chequeLimit: "۵۰۰ میلیون الی ۱ میلیارد تومان",
      cashShare: "شناور و توافقی با خط تولید کارخانه",
      duration: "تا ۹۰ روزه",
      condition: "استعلام رتبه اعتباری A بانکی و گردش مالی مستمر فصلی بالای ۱ میلیارد تومان",
      badge: "سقف نامحدود",
      color: "border-emerald-300 bg-emerald-50/60 text-emerald-900"
    }
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 overflow-y-auto" dir="rtl">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden z-10 flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="p-5 sm:p-6 bg-gradient-to-l from-indigo-900 via-indigo-800 to-slate-900 text-white flex justify-between items-center shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-amber-400 shadow-inner">
                <Scale size={24} />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-2">
                  اساس‌نامه و آیین‌نامه رسمی خرید چکی دست اول
                  <span className="text-[10px] bg-amber-400/20 text-amber-300 border border-amber-400/40 px-2 py-0.5 rounded-full font-mono">
                    نگارش ۱۴۰۵
                  </span>
                </h2>
                <p className="text-xs text-indigo-200 font-medium">
                  ضوابط تخصیص اعتبار پلکانی، فرمول نصف نقد - نصف چک و شرایط ترخیص بار
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          {/* Body Content */}
          <div className="p-5 sm:p-6 overflow-y-auto space-y-6 text-slate-700 text-xs sm:text-sm leading-relaxed custom-scrollbar">
            
            {/* Quick Summary Card */}
            <div className="p-4 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-2xl border border-indigo-150 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                  <Receipt size={20} />
                </div>
                <div className="space-y-1">
                  <span className="font-black text-indigo-950 block text-xs sm:text-sm">
                    سقف اعتبار چکی پیش‌فرض شما در این معامله:
                  </span>
                  <p className="text-[11px] text-slate-600 font-medium">
                    در خرید اولیه تا سقف ۱۰۰ میلیون تومان (۵۰ میلیون تومان چک + ۵۰ میلیون تومان نقد).
                  </p>
                </div>
              </div>
              <div className="bg-white px-4 py-2.5 rounded-xl border border-indigo-200 shadow-xs text-center shrink-0 w-full sm:w-auto">
                <span className="text-[10px] text-slate-400 font-bold block">حداکثر سهم چک فعال</span>
                <span className="text-sm sm:text-base font-black text-indigo-700 font-mono">
                  {userCredit.toLocaleString()} تومان
                </span>
              </div>
            </div>

            {/* Section 1: The Core 50/50 Cash & Cheque Formula */}
            <div className="space-y-3">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
                <Coins size={18} className="text-amber-600" />
                ۱. ضابطه نصف نقد - نصف چک و مبالغ مازاد بر اعتبار
              </h3>
              <div className="space-y-2 text-slate-600 text-xs leading-relaxed bg-slate-50/80 p-4 rounded-2xl border border-slate-150">
                <p>
                  در شیوه معاملاتی <strong>«نصف نقد / نصف چک»</strong>، مبنای خرید با قیمت مستقیم درب کارخانه به صورت ۵۰٪ واریز نقدی و ۵۰٪ چک صیادی بنفش تنظیم گردیده است.
                </p>
                <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1.5 font-medium text-slate-800">
                  <div className="flex items-center gap-1.5 text-indigo-800 font-black">
                    <CheckCircle2 size={15} className="text-emerald-600" />
                    <span>اگر مبلغ فاکتور تا ۱۰۰ میلیون تومان باشد:</span>
                  </div>
                  <p className="text-[11px] text-slate-600 pr-5">
                    به صورت مساوی ۵۰٪ نقدی و ۵۰٪ در قالب یک فقره چک صیادی محاسبه و دریافت می‌شود.
                  </p>

                  <div className="flex items-center gap-1.5 text-indigo-800 font-black pt-2">
                    <AlertCircle size={15} className="text-amber-600" />
                    <span>اگر مبلغ فاکتور بیشتر از ۱۰۰ میلیون تومان باشد (مثلاً ۱۴۰ میلیون تومان):</span>
                  </div>
                  <p className="text-[11px] text-slate-600 pr-5">
                    با توجه به سقف اعتبار اولیه ۵۰ میلیون تومانی چک، سهم چک دقیقاً در مبلغ <strong>۵۰ میلیون تومان</strong> ثبت شده و مابه‌التفاوت کل فاکتور (یعنی <strong>۹۰ میلیون تومان</strong>) به صورت نقدی در زمان ترخیص سفارش تسویه می‌گردد.
                  </p>
                </div>
              </div>
            </div>

            {/* Section 2: Progressive Ladder of Credit */}
            <div className="space-y-3">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
                <TrendingUp size={18} className="text-indigo-600" />
                ۲. جدول پلکانی افزایش سقف اعتبار چکی بر مبنای وصول چک
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                پس از هر بار تسویه و وصول به‌موقع چک در تاریخ سررسید، سقف اعتبار شما توسط سیستم به صورت خودکار ارتقاء می‌یابد:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                {tiers.map((tier) => (
                  <div
                    key={tier.level}
                    className={`p-4 rounded-2xl border ${tier.color} space-y-2.5 flex flex-col justify-between shadow-2xs`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 border-b border-slate-200/60 pb-2 mb-2">
                        <span className="font-black text-xs">{tier.title}</span>
                        <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-white border shadow-2xs">
                          {tier.badge}
                        </span>
                      </div>

                      <div className="space-y-1.5 text-[11px]">
                        <div className="flex justify-between">
                          <span className="text-slate-500 font-bold">سقف معامله:</span>
                          <span className="font-black font-mono">{tier.orderLimit}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500 font-bold">حداکثر سهم چک:</span>
                          <span className="font-black font-mono text-indigo-700">{tier.chequeLimit}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500 font-bold">مدت زمان سررسید:</span>
                          <span className="font-bold">{tier.duration}</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200/50 text-[10px] text-slate-600 font-medium flex items-center gap-1.5">
                      <ShieldCheck size={14} className="text-emerald-600 shrink-0" />
                      <span><strong>شرط ارتقاء:</strong> {tier.condition}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Section 3: Cheque Criteria */}
            <div className="space-y-3">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
                <ShieldCheck size={18} className="text-emerald-600" />
                ۳. الزامات قانونی صدور چک صیادی بنفش
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-150 space-y-1">
                  <span className="font-black text-slate-900 block text-[11px]">۱. استعلام صیادی سفید</span>
                  <p className="text-[10px] text-slate-500">
                    صادرکننده چک نباید دارای هیچ‌گونه سابقه چک برگشتی رفع سوء اثر نشده در شبکه بانکی باشد.
                  </p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-150 space-y-1">
                  <span className="font-black text-slate-900 block text-[11px]">۲. ثبت در سامانه پیچک</span>
                  <p className="text-[10px] text-slate-500">
                    شناسه ۱۶ رقمی چک باید پیش از بارگیری در سامانه صیاد به نام ذینفع (کارخانه / پلتفرم) ثبت و تایید شود.
                  </p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-150 space-y-1">
                  <span className="font-black text-slate-900 block text-[11px]">۳. تطابق حساب با صاحب کسب</span>
                  <p className="text-[10px] text-slate-500">
                    دسته چک باید متعلق به صاحب جواز، مدیرعامل شرکت یا شخص خریدار ثبت‌نام شده باشد.
                  </p>
                </div>
              </div>
            </div>

            {/* Section 4: Notice */}
            <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-2xl flex items-start gap-2.5 text-[11px] text-amber-900">
              <AlertCircle size={17} className="text-amber-600 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                <strong>توجه مالی:</strong> در صورت عدم وصول چک در تاریخ سررسید، طبق مقررات قانون تجارت و قرارداد الکترونیکی دست اول، علاوه بر توقف فوری کلیه امتیازات اعتباری، مراتب از طریق مراجع قانونی و پیگیری وکیل پلتفرم اقدام خواهد گردید.
              </p>
            </div>

          </div>

          {/* Footer Action */}
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0">
            <span className="text-[11px] text-slate-500 font-bold hidden sm:inline">
              پلتفرم مبادلات عمده کشوری دست اول
            </span>
            <button
              onClick={onClose}
              className="w-full sm:w-auto px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition-colors cursor-pointer shadow-sm"
            >
              متوجه شدم و قبول دارم
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
