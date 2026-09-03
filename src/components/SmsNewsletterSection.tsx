import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Bell, ShieldCheck, Mail, ArrowLeft, CheckCircle2, Sparkles, MessageSquare, Phone } from "lucide-react";
import { toPersianDigits } from "../lib/pricing";

export const SmsNewsletterSection: React.FC = () => {
  const [phone, setPhone] = useState("");
  const [category, setCategory] = useState("همه دسته‌ها");
  const [alertType, setAlertType] = useState("all");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const formatPhone = (val: string) => {
    // Keep only numbers
    const clean = val.replace(/\D/g, "");
    if (clean.length <= 11) {
      setPhone(clean);
    }
  };

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!phone) {
      setErrorMsg("لطفاً شماره موبایل خود را وارد کنید.");
      return;
    }

    if (phone.length < 10 || (!phone.startsWith("09") && !phone.startsWith("9"))) {
      setErrorMsg("لطفاً یک شماره موبایل معتبر (مثال: ۰۹۱۲۳۴۵۶۷۸۹) وارد کنید.");
      return;
    }

    try {
      const saved = localStorage.getItem("dastavval_sms_subscribers");
      const subscribers = saved ? JSON.parse(saved) : [];
      
      const newSub = {
        id: "sub-" + Date.now(),
        phone: phone.startsWith("9") ? "0" + phone : phone,
        category,
        alertType,
        date: new Date().toLocaleDateString("fa-IR")
      };

      // Check if already subscribed
      const exists = subscribers.some((s: any) => s.phone === newSub.phone);
      if (exists) {
        setErrorMsg("این شماره موبایل قبلاً در سامانه پیامکی ثبت شده است.");
        return;
      }

      localStorage.setItem("dastavval_sms_subscribers", JSON.stringify([newSub, ...subscribers]));
      setIsSubmitted(true);
      setPhone("");
    } catch (err) {
      setErrorMsg("خطایی در ذخیره‌سازی رخ داد. لطفاً مجدداً تلاش کنید.");
    }
  };

  return (
    <section className="bg-slate-50 border-y border-slate-100 py-12 px-4 sm:px-6 lg:px-8 mt-12 text-right relative overflow-hidden" dir="rtl">
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none" />

      <div className="max-w-4xl mx-auto relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          {/* Slogan and Text */}
          <div className="md:col-span-5 space-y-3">
            <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-lg border border-emerald-100/50 text-[10px] font-black">
              <Sparkles size={11} className="text-emerald-600 animate-pulse" />
              <span>سامانه پیامک هوشمند کارخانجات</span>
            </div>
            <h3 className="text-sm sm:text-base font-black text-slate-900 tracking-tight">
              اطلاع‌رسانی فوری حراج‌های آتشی و کاهش قیمت کف بازار
            </h3>
            <p className="text-slate-500 text-[11px] font-bold leading-relaxed">
              با فعال‌سازی پیامک رایگان، به محض کاهش قیمت کالاهای منتخب یا آغاز عرضه مستقیم حراج زیر قیمت کارخانه، یک پیامک مستقیم حاوی فاکتور استعلام برای شما ارسال می‌گردد.
            </p>
          </div>

          {/* Form container */}
          <div className="md:col-span-7 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <AnimatePresence mode="wait">
              {isSubmitted ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="py-6 text-center space-y-3"
                >
                  <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center text-xl mx-auto border border-emerald-100">
                    🎉
                  </div>
                  <h4 className="text-xs font-black text-slate-800">اشتراک پیامکی شما با موفقیت فعال شد!</h4>
                  <p className="text-[10px] text-slate-400 font-bold max-w-sm mx-auto">
                    از این پس، پیامک‌های استعلام قیمت و تغییرات ناگهانی نرخ کارخانجات دست‌اول برای شما ارسال خواهد شد.
                  </p>
                  <button
                    onClick={() => setIsSubmitted(false)}
                    className="text-[10px] font-black text-emerald-700 hover:text-emerald-800 transition-colors underline cursor-pointer"
                  >
                    ثبت یک شماره دیگر
                  </button>
                </motion.div>
              ) : (
                <motion.form
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onSubmit={handleSubscribe}
                  className="space-y-4"
                >
                  {errorMsg && (
                    <div className="p-3 bg-rose-50 border border-rose-100 text-rose-800 rounded-xl text-[10px] font-bold text-right flex items-center gap-1.5 animate-shake">
                      <span>⚠️ {errorMsg}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {/* Mobile Phone Input */}
                    <div className="space-y-1.5 text-right">
                      <label className="text-[10px] font-black text-slate-500 block">شماره موبایل فعال:</label>
                      <div className="relative">
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => formatPhone(e.target.value)}
                          placeholder="مثال: ۰۹۱۲۳۴۵۶۷۸۹"
                          className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs font-bold focus:bg-white focus:border-emerald-500 outline-hidden text-right font-mono"
                          required
                        />
                        <Phone size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      </div>
                    </div>

                    {/* Category Dropdown */}
                    <div className="space-y-1.5 text-right">
                      <label className="text-[10px] font-black text-slate-500 block">دسته کالایی پرمصرف:</label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full px-3 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs font-bold focus:bg-white focus:border-emerald-500 outline-hidden text-right"
                      >
                        <option value="همه دسته‌ها">همه دسته‌ها</option>
                        <option value="نوشیدنی">نوشیدنی و آبمیوه</option>
                        <option value="کیک و کلوچه">کیک و تنقلات</option>
                        <option value="مواد غذایی پایه">مواد پایه و روغن</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5 items-center pt-1.5 border-t border-slate-100">
                    <div className="sm:col-span-7 flex flex-wrap gap-4 justify-start">
                      <label className="flex items-center gap-1.5 text-[9px] font-bold text-slate-600 cursor-pointer">
                        <input
                          type="radio"
                          name="alertType"
                          value="all"
                          checked={alertType === "all"}
                          onChange={() => setAlertType("all")}
                          className="accent-emerald-600"
                        />
                        <span>حراج‌ها + کاهش قیمت‌ها</span>
                      </label>
                      <label className="flex items-center gap-1.5 text-[9px] font-bold text-slate-600 cursor-pointer">
                        <input
                          type="radio"
                          name="alertType"
                          value="drops"
                          checked={alertType === "drops"}
                          onChange={() => setAlertType("drops")}
                          className="accent-emerald-600"
                        />
                        <span>فقط کاهش قیمت کف کارخانه</span>
                      </label>
                    </div>

                    <div className="sm:col-span-5">
                      <button
                        type="submit"
                        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all shadow-xs cursor-pointer active:scale-95 flex items-center justify-center gap-1.5"
                      >
                        <Bell size={13} />
                        <span>عضویت در سامانه پیامکی</span>
                      </button>
                    </div>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
};
