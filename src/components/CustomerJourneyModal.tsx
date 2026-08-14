import React, { useState } from 'react';
import { 
  X, 
  ShoppingBag, 
  Briefcase, 
  Factory, 
  CheckCircle2, 
  ShieldCheck, 
  Truck, 
  Coins, 
  ArrowLeft, 
  HelpCircle, 
  PhoneCall, 
  Sparkles, 
  Percent, 
  FileText, 
  Scale, 
  DollarSign, 
  Package, 
  Layers,
  ChevronRight,
  TrendingDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CustomerJourneyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectBuyer: () => void;
  onSelectAgency: () => void;
  onSelectFactory: () => void;
}

export const CustomerJourneyModal: React.FC<CustomerJourneyModalProps> = ({
  isOpen,
  onClose,
  onSelectBuyer,
  onSelectAgency,
  onSelectFactory
}) => {
  const [activePersona, setActivePersona] = useState<'buyer' | 'agency' | 'factory'>('buyer');
  
  // Interactive Profit Calculator State for Modal
  const [calculatorCartons, setCalculatorCartons] = useState<number>(100);
  const [unitMarketPrice, setUnitMarketPrice] = useState<number>(450000); // 450,000 Toman per carton
  const factoryPrice = Math.round(unitMarketPrice * 0.68); // 32% discount
  const savingsPerCarton = unitMarketPrice - factoryPrice;
  const totalSavings = savingsPerCarton * calculatorCartons;

  if (!isOpen) return null;

  const toPersianNum = (num: number | string) => {
    if (num === undefined || num === null) return '';
    const p: Record<string, string> = {
      '0': '۰', '1': '۱', '2': '۲', '3': '۳', '4': '۴', '5': '۵', '6': '۶', '7': '۷', '8': '۸', '9': '۹'
    };
    return num.toString().replace(/[0-9]/g, w => p[w]);
  };

  const formatPrice = (p: number) => {
    return toPersianNum(p.toLocaleString('fa-IR')) + ' تومان';
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md" dir="rtl">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 text-right p-6 sm:p-8"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-6 left-6 p-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition-colors z-10 cursor-pointer"
          >
            <X size={20} />
          </button>

          {/* Header */}
          <div className="space-y-2 border-b border-slate-100 pb-5 mb-6">
            <div className="flex items-center gap-2">
              <span className="bg-emerald-100 text-emerald-800 text-[11px] font-black px-3 py-1 rounded-full flex items-center gap-1 border border-emerald-200">
                <Sparkles size={14} />
                <span>راهنمای جامع ورود و نقشه راه کاربران</span>
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
              در دست اول دقیقاً چه اتفاقی می‌افتد؟ راهنمای شفاف خریداران، نمایندگان و کارخانجات
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-bold">
              بدون هیچ سردرگمی، هدف خود را انتخاب کنید تا ببینید مرحله به مرحله چطور به حداکثر سود و امنیت مالی می‌رسید.
            </p>
          </div>

          {/* Persona Switcher Tabs */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-6 bg-slate-100 p-1.5 rounded-2xl">
            <button
              onClick={() => setActivePersona('buyer')}
              className={`py-3 px-2 sm:px-4 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activePersona === 'buyer'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <ShoppingBag size={17} />
              <span>من خریدار کالا هستم</span>
            </button>

            <button
              onClick={() => setActivePersona('agency')}
              className={`py-3 px-2 sm:px-4 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activePersona === 'agency'
                  ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Briefcase size={17} />
              <span>من جویای نمایندگی/درآمدم</span>
            </button>

            <button
              onClick={() => setActivePersona('factory')}
              className={`py-3 px-2 sm:px-4 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activePersona === 'factory'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Factory size={17} />
              <span>من کارخانه‌دار/تولیدکننده‌ام</span>
            </button>
          </div>

          {/* Dynamic Step Content based on Selected Persona */}
          <div className="space-y-6">
            
            {/* Persona 1: Buyer Flow */}
            {activePersona === 'buyer' && (
              <div className="space-y-6">
                <div className="bg-emerald-50/60 border border-emerald-100 rounded-3xl p-5 space-y-3">
                  <h3 className="text-base font-black text-emerald-950 flex items-center gap-2">
                    <ShoppingBag size={20} className="text-emerald-600" />
                    <span>مسیر خریدار: از مشاهده کالا تا تحویل درب انبار شما</span>
                  </h3>
                  <p className="text-xs text-emerald-800 font-bold leading-relaxed">
                    هدف شما خرید کالا با کف قیمت واقعی کارخانه و حذف دلالان است. در این فرآیند، وجه شما نزد حساب امانی پلتفرم باقی می‌ماند تا بار صحیح و سالم به دستتان برسد.
                  </p>
                </div>

                {/* 4 Steps Visual Timeline */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-2 text-right relative">
                    <span className="w-8 h-8 rounded-xl bg-emerald-600 text-white font-black text-xs flex items-center justify-center">۱</span>
                    <h4 className="text-xs font-black text-slate-900">جستجو و مقایسه قیمت</h4>
                    <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                      از میان صدها محصول کارخانه‌ای، کالای مورد نظر را انتخاب و قیمت پایه کارخانه را با بازار مقایسه کنید.
                    </p>
                  </div>

                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-2 text-right relative">
                    <span className="w-8 h-8 rounded-xl bg-emerald-600 text-white font-black text-xs flex items-center justify-center">۲</span>
                    <h4 className="text-xs font-black text-slate-900">صدور پیش‌فاکتور رسمی</h4>
                    <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                      تعداد کارتن یا پالت را مشخص کنید؛ سیستم تخفیف پلکانی حجمی را به طور خودکار اعمال می‌کند.
                    </p>
                  </div>

                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-2 text-right relative">
                    <span className="w-8 h-8 rounded-xl bg-emerald-600 text-white font-black text-xs flex items-center justify-center">۳</span>
                    <h4 className="text-xs font-black text-slate-900">پرداخت امن امانی</h4>
                    <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                      مبلغ پرداخت‌شده تا زمان تایید تحویل بار در حساب امانی محفوظ است و هیچ خطری متوجه شما نیست.
                    </p>
                  </div>

                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-2 text-right relative">
                    <span className="w-8 h-8 rounded-xl bg-emerald-600 text-white font-black text-xs flex items-center justify-center">۴</span>
                    <h4 className="text-xs font-black text-slate-900">بارگیری مسقف و تحویل</h4>
                    <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                      بار با بارنامه رسمی، بیمه حوادث جاده‌ای و کد رهگیری زنده مستقیماً از کارخانه به مقصد شما ارسال می‌شود.
                    </p>
                  </div>
                </div>

                {/* Live Profit Savings Calculator */}
                <div className="bg-gradient-to-br from-slate-900 to-emerald-950 text-white p-6 rounded-3xl space-y-4 border border-emerald-500/30">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-black text-emerald-400 flex items-center gap-2">
                      <Scale size={18} />
                      <span>محاسبه‌گر زنده سود شما از خرید مستقیم کارخانه</span>
                    </h4>
                    <span className="text-[11px] bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full border border-emerald-500/40">
                      ۳۲٪ صرفه‌جویی میانگین
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                    <div className="space-y-1.5">
                      <label className="text-slate-300 font-bold block">تعداد کارتن سفارشی:</label>
                      <input 
                        type="number"
                        min="10"
                        max="5000"
                        step="10"
                        value={calculatorCartons}
                        onChange={(e) => setCalculatorCartons(Math.max(1, Number(e.target.value)))}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white font-mono font-bold"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-slate-300 font-bold block">قیمت حدودی بازار آزاد (هر کارتن):</label>
                      <input 
                        type="number"
                        step="10000"
                        value={unitMarketPrice}
                        onChange={(e) => setUnitMarketPrice(Math.max(10000, Number(e.target.value)))}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white font-mono font-bold"
                      />
                    </div>

                    <div className="bg-emerald-950/80 border border-emerald-500/40 p-3 rounded-2xl flex flex-col justify-center text-center">
                      <span className="text-[11px] text-emerald-300 font-bold">سود خالص شما از این سفارش:</span>
                      <span className="text-base sm:text-lg font-black text-emerald-400 font-mono mt-1">
                        {formatPrice(totalSavings)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Direct Action Button */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    onClick={() => {
                      onClose();
                      onSelectBuyer();
                    }}
                    className="px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-xs sm:text-sm transition-all shadow-xl shadow-emerald-600/20 flex items-center gap-2 cursor-pointer"
                  >
                    <span>ورود به تالار خرید عمده و استعلام قیمت</span>
                    <ArrowLeft size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* Persona 2: Agency & Income Flow */}
            {activePersona === 'agency' && (
              <div className="space-y-6">
                <div className="bg-amber-50/60 border border-amber-100 rounded-3xl p-5 space-y-3">
                  <h3 className="text-base font-black text-amber-950 flex items-center gap-2">
                    <Briefcase size={20} className="text-amber-600" />
                    <span>مسیر اخذ نمایندگی: درآمد ماهانه بدون نیاز به سرمایه انبارداری</span>
                  </h3>
                  <p className="text-xs text-amber-800 font-bold leading-relaxed">
                    اگر در حوزه بازاریابی فعالید یا در استان خود شبکه سوپرمارکت و بنکداری دارید، کارخانه به شما نمایندگی انحصاری یا عاملیت اعطا می‌کند و به ازای هر کارتن فروخته‌شده پورسانت قطعی دریافت می‌کنید.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-2 text-right">
                    <span className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center">۱</span>
                    <h4 className="text-xs font-black text-slate-900">ثبت فرم نمایندگی</h4>
                    <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                      استان، شهر و دسته کالایی مورد نظر خود را انتخاب و فرم کوتاه درخواست را تکمیل کنید.
                    </p>
                  </div>

                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-2 text-right">
                    <span className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center">۲</span>
                    <h4 className="text-xs font-black text-slate-900">دریافت مجوز و کاتالوگ</h4>
                    <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                      گواهی رسمی نمایندگی، کاتالوگ دیجیتال و نمونه سمپل برای ارائه به مشتریان در اختیارتان قرار می‌گیرد.
                    </p>
                  </div>

                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-2 text-right">
                    <span className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center">۳</span>
                    <h4 className="text-xs font-black text-slate-900">ثبت سفارش خریداران</h4>
                    <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                      سفارشات مشتریان خود را در سامانه ثبت کنید؛ ارسال بار و تسویه حساب با خریدار تماماً توسط ما انجام می‌شود.
                    </p>
                  </div>

                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-2 text-right">
                    <span className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center">۴</span>
                    <h4 className="text-xs font-black text-slate-900">تسویه منظم هفتگی</h4>
                    <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                      پورسانت فروش هر سفارش بلافاصله پس از تحویل بار به شماره شبای شما واریز می‌شود.
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    onClick={() => {
                      onClose();
                      onSelectAgency();
                    }}
                    className="px-8 py-3.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-2xl font-black text-xs sm:text-sm transition-all shadow-xl shadow-amber-500/20 flex items-center gap-2 cursor-pointer"
                  >
                    <span>ثبت‌نام و اخذ نمایندگی ۳۱ استان</span>
                    <ArrowLeft size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* Persona 3: Factory Owner Flow */}
            {activePersona === 'factory' && (
              <div className="space-y-6">
                <div className="bg-indigo-50/60 border border-indigo-100 rounded-3xl p-5 space-y-3">
                  <h3 className="text-base font-black text-indigo-950 flex items-center gap-2">
                    <Factory size={20} className="text-indigo-600" />
                    <span>مسیر کارخانه: فروش نقدی و توزیع در شبکه ۱۲,۸۰۰ خریدار کشوری</span>
                  </h3>
                  <p className="text-xs text-indigo-800 font-bold leading-relaxed">
                    ظرفیت مازاد خط تولید خود را بدون دردسر چک برگشتی و بازاریابی سنتی، به خریداران عمده سراسر کشور با تسویه نقدی ۱۰۰٪ عرضه کنید.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-2 text-right">
                    <span className="w-8 h-8 rounded-xl bg-indigo-600 text-white font-black text-xs flex items-center justify-center">۱</span>
                    <h4 className="text-xs font-black text-slate-900">ثبت خط تولید و محصولات</h4>
                    <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                      مشخصات کارخانه، مجوز بهداشت، سیب سلامت و کاتالوگ کالاهای تولیدی خود را وارد کنید.
                    </p>
                  </div>

                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-2 text-right">
                    <span className="w-8 h-8 rounded-xl bg-indigo-600 text-white font-black text-xs flex items-center justify-center">۲</span>
                    <h4 className="text-xs font-black text-slate-900">تایید کیفی و لیست قیمت</h4>
                    <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                      قیمت پایه کارخانه برای پالت و کارتن ثبت شده و در صفحه اختصاصی کارخانه شما قرار می‌گیرد.
                    </p>
                  </div>

                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-2 text-right">
                    <span className="w-8 h-8 rounded-xl bg-indigo-600 text-white font-black text-xs flex items-center justify-center">۳</span>
                    <h4 className="text-xs font-black text-slate-900">دریافت سفارشات عمده</h4>
                    <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                      سفارشات حجمی از سراسر کشور تجمیع شده و پیش‌فاکتور قطعی صادر می‌شود.
                    </p>
                  </div>

                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-2 text-right">
                    <span className="w-8 h-8 rounded-xl bg-indigo-600 text-white font-black text-xs flex items-center justify-center">۴</span>
                    <h4 className="text-xs font-black text-slate-900">تسویه نقدی و بارگیری</h4>
                    <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                      مبلغ قبل از بارگیری به حساب کارخانه منظور شده و ناوگان حمل بار را تحویل می‌گیرد.
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    onClick={() => {
                      onClose();
                      onSelectFactory();
                    }}
                    className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-xs sm:text-sm transition-all shadow-xl shadow-indigo-600/20 flex items-center gap-2 cursor-pointer"
                  >
                    <span>ثبت مشخصات کارخانه و خطوط تولید</span>
                    <ArrowLeft size={16} />
                  </button>
                </div>
              </div>
            )}

          </div>

          {/* Quick FAQ / Guarantee Section at Bottom */}
          <div className="mt-8 pt-6 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4 text-right">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-1">
              <h5 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                <ShieldCheck size={16} className="text-emerald-600" />
                <span>ضمانت سلامت فیزیکی و تاریخ انقضا</span>
              </h5>
              <p className="text-[11px] text-slate-500 font-bold leading-relaxed">
                تمامی بارها مستقیماً از خط تولید با حداکثر تاریخ انقضا و بارنامه بیمه‌شده ارسال می‌شوند؛ در صورت بروز هرگونه خسارت جاده‌ای، ۱۰۰٪ خسارت جبران می‌شود.
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-1">
              <h5 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                <PhoneCall size={16} className="text-amber-600" />
                <span>مشاوره و پشتیبانی ۲۴ ساعته بازرگانی</span>
              </h5>
              <p className="text-[11px] text-slate-500 font-bold leading-relaxed">
                تیم کارشناسان تامین و لجستیک دست اول در تمام ساعات شبانه‌روز آماده هماهنگی بارگیری، استعلام تناژ و راهنمایی تجاری شما هستند.
              </p>
            </div>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
};
