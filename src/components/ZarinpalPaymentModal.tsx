import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ShieldCheck, Phone, CheckCircle2, MessageSquare, Send, Award, HelpCircle } from "lucide-react";

interface ZarinpalPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  description: string;
  onSuccess: () => void;
}

export default function ZarinpalPaymentModal({
  isOpen,
  onClose,
  amount,
  description,
  onSuccess
}: ZarinpalPaymentModalProps) {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [userName, setUserName] = useState("");

  if (!isOpen) return null;

  const handleRequestActivation = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
    setTimeout(() => {
      onSuccess();
      setIsSubmitted(false);
      onClose();
    }, 3000);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-white/80 backdrop-blur-md" dir="rtl">
      <motion.div
        initial={{ opacity: 0, y: 15, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 15, scale: 0.96 }}
        className="bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border border-slate-200 text-right"
      >
        {/* Top Branding Panel */}
        <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-indigo-900 p-6 text-white relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center gap-3.5 relative z-10">
            <div className="w-11 h-11 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center text-xl shadow-inner border border-white/10">
              👑
            </div>
            <div>
              <h4 className="font-black text-sm">سامانه فعال‌سازی و تایید خدمات دست‌اول</h4>
              <p className="text-[10px] text-emerald-200 font-bold mt-1">پل ارتباطی مستقیم تولیدکنندگان با مدیریت پلتفرم</p>
            </div>
          </div>
        </div>

        {/* Dynamic Detail Alert */}
        <div className="bg-emerald-50 p-4 border-b border-emerald-100 flex justify-between items-center text-right">
          <div>
            <span className="text-[9px] text-emerald-800 font-black block">خدمت درخواستی:</span>
            <span className="text-[11px] text-slate-800 font-bold">{description}</span>
          </div>
          <div className="text-left">
            <span className="text-[9px] text-emerald-800 font-black block">وضعیت پرداخت:</span>
            <span className="text-xs font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">رایگان / هماهنگی مستقیم</span>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-6 sm:p-8 space-y-6">
          {isSubmitted ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-6 flex flex-col items-center justify-center space-y-4 text-center"
            >
              <div className="w-16 h-16 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-3xl animate-bounce">
                <CheckCircle2 size={32} />
              </div>
              <div className="space-y-1.5">
                <h5 className="font-black text-slate-900 text-sm">درخواست فعال‌سازی با موفقیت ثبت شد</h5>
                <p className="text-xs text-slate-500 font-bold max-w-sm leading-relaxed">
                  اطلاعات شما با موفقیت برای کارشناسان و مدیریت ارشد دست اول ارسال گردید. جهت تسریع در روند تایید کاتالوگ و احراز هویت، تا چند لحظه دیگر با شماره ثبت شده شما تماس گرفته خواهد شد.
                </p>
              </div>
            </motion.div>
          ) : (
            <form onSubmit={handleRequestActivation} className="space-y-5">
              {/* Core Information Note */}
              <div className="bg-slate-50 border border-slate-150/80 rounded-2xl p-4 space-y-2.5">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="text-emerald-600" size={18} />
                  <span className="font-black text-xs text-slate-800">اطلاعیه عدم نیاز به پرداخت آنلاین:</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed font-bold">
                  به جهت حفظ امنیت مالی معاملات عمده و تضمین سلامت استعلام‌های خط تولید، فرآیند فعال‌سازی کلیه حساب‌های کارخانجات، نشان‌های اصالت، ارتقای VIP و کاتالوگ‌ها توسط <strong className="text-slate-800">مدیریت پلتفرم</strong> به صورت مستقیم، دستی و پس از هماهنگی تلفنی تایید و فعال می‌گردد.
                </p>
              </div>

              {/* Direct Admin Call Info */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-indigo-50/50 border border-indigo-100/50 rounded-2xl p-3.5 flex flex-col justify-between">
                  <div className="flex items-center gap-1.5 text-indigo-700 mb-1">
                    <Phone size={14} />
                    <span className="text-[10px] font-black">ارتباط تلفنی مستقیم:</span>
                  </div>
                  <span className="text-xs font-mono font-black text-slate-800">۰۹۱۴۴۷۱۳۴۰۵</span>
                  <span className="text-[8px] text-slate-400 font-bold mt-1">ساعات تماس: ۸ الی ۲۲</span>
                </div>

                <div className="bg-teal-50/50 border border-teal-100/50 rounded-2xl p-3.5 flex flex-col justify-between">
                  <div className="flex items-center gap-1.5 text-teal-700 mb-1">
                    <MessageSquare size={14} />
                    <span className="text-[10px] font-black">پشتیبانی آنلاین:</span>
                  </div>
                  <div className="flex gap-2">
                    <a href="https://t.me/dastavval_official" target="_blank" rel="noopener noreferrer" className="text-[10px] font-black text-indigo-600 hover:underline">تلگرام</a>
                    <span className="text-slate-300">|</span>
                    <a href="https://rubika.ir/dastavval_official" target="_blank" rel="noopener noreferrer" className="text-[10px] font-black text-emerald-600 hover:underline">روبیکا</a>
                  </div>
                  <span className="text-[8px] text-slate-400 font-bold mt-1">پاسخگویی سریع ۲۴ ساعته</span>
                </div>
              </div>

              {/* Form Input for easy follow up */}
              <div className="space-y-3 pt-2">
                <span className="text-[10px] font-black text-slate-600 block">لطفاً اطلاعات تماس خود را جهت برقراری ارتباط سریع‌تر وارد کنید:</span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <input
                      type="text"
                      required
                      placeholder="نام و نام خانوادگی شما"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-emerald-600"
                    />
                  </div>
                  <div>
                    <input
                      type="tel"
                      required
                      placeholder="شماره همراه یا ثابت"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-emerald-600 font-mono text-left"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-3 bg-slate-100 text-slate-600 rounded-xl text-xs font-black transition-all cursor-pointer border border-slate-200 shadow-xs"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-emerald-600/10"
                >
                  <Send size={13} />
                  <span>درخواست تایید مدیریت</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
