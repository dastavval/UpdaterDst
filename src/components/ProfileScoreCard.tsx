import React, { useState } from "react";
import { 
  Award, CheckCircle2, ShieldCheck, Sparkles, Gift, 
  ChevronDown, ChevronUp, Star, Phone, User, Building, 
  MapPin, CreditCard, ArrowLeft, RefreshCw, Zap
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const toPersianNum = (n: number | string) => 
  String(n ?? "").replace(/[0-9]/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)]);

interface ProfileScoreCardProps {
  user: any;
  onOpenEditProfile: () => void;
  onChangeRole?: () => void;
}

export default function ProfileScoreCard({
  user,
  onOpenEditProfile,
  onChangeRole
}: ProfileScoreCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Profile completion criteria
  const isPhoneVerified = Boolean(user?.phone || user?.mobile || user?.username);
  const isNameCompleted = Boolean(user?.name && user?.name.trim().length >= 3);
  const isCompanyCompleted = Boolean(user?.company && user?.company.trim().length >= 2);
  const isCityCompleted = Boolean(user?.city && user?.city.trim().length >= 2);
  const isAddressCompleted = Boolean(user?.address && user?.address.trim().length >= 5);
  const isIbanCompleted = Boolean(user?.iban && user?.iban.trim().length >= 10);

  // Weights
  const score = (
    (isPhoneVerified ? 20 : 0) +
    (isNameCompleted ? 15 : 0) +
    (isCompanyCompleted ? 15 : 0) +
    (isCityCompleted ? 15 : 0) +
    (isAddressCompleted ? 15 : 0) +
    (isIbanCompleted ? 20 : 0)
  );

  const getTier = (s: number) => {
    if (s >= 100) return { name: "الماس VIP (احراز کامل)", bg: "bg-purple-50 text-purple-900 border-purple-200", badge: "VIP 💎", perk: "تخفیف کلان ۲۲٪ + تسویه ۳۰ روزه اعتباری" };
    if (s >= 80) return { name: "طلایی ممتاز", bg: "bg-emerald-50 text-amber-900 border-emerald-200", badge: "Gold 🥇", perk: "۱۲٪ تخفیف کلان + سهمیه بارهای پرفروش" };
    if (s >= 50) return { name: "نقره‌ای فعال", bg: "bg-slate-100 text-slate-900 border-slate-300", badge: "Silver 🥈", perk: "۵٪ تخفیف دائم بر روی کل سبد خرید" };
    return { name: "برنزی نوپا", bg: "bg-emerald-50 text-emerald-900 border-emerald-200", badge: "Bronze 🥉", perk: "خرید مستقیم بی‌واسطه کارخانه" };
  };

  const currentTier = getTier(score);

  const items = [
    { label: "شماره همراه تایید شده پیامکی", points: 20, done: isPhoneVerified, icon: Phone },
    { label: "نام و نام خانوادگی مدیر یا مسئول", points: 15, done: isNameCompleted, icon: User },
    { label: "نام فروشگاه / کارخانه / برند", points: 15, done: isCompanyCompleted, icon: Building },
    { label: "استان و شهر محل استقرار", points: 15, done: isCityCompleted, icon: MapPin },
    { label: "نشانی کامل انبار یا فروشگاه", points: 15, done: isAddressCompleted, icon: MapPin },
    { label: "شماره شبا بانکی جهت تسویه سود/عودت", points: 20, done: isIbanCompleted, icon: CreditCard },
  ];

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200 shadow-xs relative overflow-hidden text-right" dir="rtl">
      <div className="relative z-10 space-y-5">
        {/* Top Header & Progress */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-emerald-50 text-amber-700 border border-emerald-200 flex items-center justify-center font-black text-xl shadow-xs shrink-0">
              <Award size={26} className="text-amber-600" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm sm:text-base font-black text-slate-900">
                  امتیاز اعتبار و تکمیل پروفایل تجاری
                </h3>
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-black border ${currentTier.bg}`}>
                  {currentTier.badge}
                </span>
              </div>
              <p className="text-xs text-slate-600 font-medium">
                سطح فعلی: <strong className="text-slate-900 font-bold">{currentTier.name}</strong> • <span className="text-emerald-700 font-bold">پاداش فعال: {currentTier.perk}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
            <div className="text-left">
              <span className="text-2xl sm:text-3xl font-black font-sans text-emerald-700">
                {toPersianNum(score)}
              </span>
              <span className="text-xs font-bold text-slate-400"> / ۱۰۰</span>
            </div>

            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-black text-slate-700 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <span>{isExpanded ? "بستن جزئیات" : "مشاهده چک‌لیست امتیاز"}</span>
              {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/80">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${score}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-amber-500 via-emerald-500 to-teal-600 rounded-full shadow-xs"
            />
          </div>
          <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 px-1">
            <span>ثبت اولیه (۲۰٪)</span>
            <span>احراز هویت همکار (۵۰٪)</span>
            <span>عضویت طلایی (۸۰٪)</span>
            <span className="text-amber-800 font-black">احراز کامل VIP (۱۰۰٪)</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-wrap items-center gap-3">
          {score < 100 ? (
            <button
              type="button"
              onClick={onOpenEditProfile}
              className="px-4 sm:px-5 py-2.5 bg-emerald-600 hover:bg-amber-700 text-white rounded-2xl text-xs font-black flex items-center gap-2 shadow-xs active:scale-95 transition-all cursor-pointer"
            >
              <Sparkles size={15} />
              <span>تکمیل فوری اطلاعات و دریافت ۱۰۰ امتیاز کامل</span>
              <ArrowLeft size={14} />
            </button>
          ) : (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-2xl text-xs font-black">
              <ShieldCheck size={16} className="text-emerald-600" />
              <span>تبریک! حساب کاربری شما در بالاترین سطح اعتبار و اعتماد تایید شده است.</span>
            </div>
          )}

          {onChangeRole && (
            <button
              type="button"
              onClick={onChangeRole}
              className="px-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-2xl text-xs font-black border border-slate-200 flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
            >
              <RefreshCw size={14} />
              <span>تغییر نوع نقش تجاری (تولیدکننده / نماینده / خریدار)</span>
            </button>
          )}
        </div>

        {/* Expandable Checklist */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="pt-4 border-t border-slate-100 space-y-3"
            >
              <h4 className="text-xs font-black text-slate-700">
                چک‌لیست مراحل ارتقای امتیاز و دریافت جوایز:
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {items.map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={idx}
                      className={`p-3 rounded-2xl border flex items-center justify-between gap-3 transition-colors ${
                        item.done 
                          ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900' 
                          : 'bg-slate-50 border-slate-200/80 text-slate-600'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Icon size={16} className={`shrink-0 ${item.done ? 'text-emerald-600' : 'text-slate-400'}`} />
                        <span className="text-[11px] font-bold truncate">{item.label}</span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className={`text-[10px] font-black font-sans px-2 py-0.5 rounded-md ${
                          item.done ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                        }`}>
                          +{item.points}
                        </span>
                        {item.done ? (
                          <CheckCircle2 size={16} className="text-emerald-600" />
                        ) : (
                          <div className="w-4 h-4 rounded-full border border-slate-300" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
