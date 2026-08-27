import React, { useState, useEffect } from "react";
import { 
  Award, Sparkles, Gift, TrendingUp, CheckCircle2, 
  ChevronLeft, ArrowLeft, ArrowUpRight, ArrowDownRight, 
  CreditCard, ShoppingBag, Clock, Percent, ShieldCheck, 
  Star, Share2, Copy, Check, Zap, Info, HelpCircle, Layers
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { 
  getLoyaltySummary, 
  LOYALTY_CONFIG, 
  calculateDiscountFromPoints, 
  determineLoyaltyTier,
  addManualBonusPoints
} from "../lib/loyalty-store";
import { LoyaltySummary, Order, User } from "../types";

interface LoyaltyRewardsClubProps {
  user: User;
  orders: Order[];
  setActiveTab: (tab: string) => void;
  onOpenQuickOrder?: () => void;
}

export default function LoyaltyRewardsClub({
  user,
  orders,
  setActiveTab,
  onOpenQuickOrder
}: LoyaltyRewardsClubProps) {
  const userIdentifier = user?.phone || user?.mobile || user?.id || "guest";
  const [summary, setSummary] = useState<LoyaltySummary>(() => getLoyaltySummary(userIdentifier, orders));
  const [filterType, setFilterType] = useState<'all' | 'earned' | 'redeemed'>('all');
  const [copiedLink, setCopiedLink] = useState(false);
  const [calcPoints, setCalcPoints] = useState<number>(summary.currentPoints || 50);

  const refreshSummary = () => {
    setSummary(getLoyaltySummary(userIdentifier, orders));
  };

  useEffect(() => {
    refreshSummary();

    const handleUpdate = () => refreshSummary();
    window.addEventListener("dastavval-loyalty-updated", handleUpdate);
    return () => window.removeEventListener("dastavval-loyalty-updated", handleUpdate);
  }, [user, orders]);

  const currentTierInfo = LOYALTY_CONFIG.TIERS[summary.tier];
  const nextTier = summary.nextTier;

  const filteredTransactions = summary.transactions.filter(tx => {
    if (filterType === 'earned') return tx.points > 0;
    if (filterType === 'redeemed') return tx.points < 0;
    return true;
  });

  const referralUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/?ref=${encodeURIComponent(user?.phone || user?.mobile || "dastavval")}`
    : `https://dastavval.com/?ref=${user?.phone || "dastavval"}`;

  const handleCopyReferral = () => {
    navigator.clipboard.writeText(referralUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const toPersianNum = (num: number | string | undefined | null) => {
    if (num === undefined || num === null) return "";
    const s = typeof num === 'number' ? num.toLocaleString('fa-IR') : String(num);
    const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
    return s.replace(/\d/g, (d) => persianDigits[parseInt(d, 10)]);
  };

  return (
    <div className="space-y-6 text-right" dir="rtl">
      
      {/* 1. HERO MEMBERSHIP CARD & QUICK STATS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Digital VIP Club Card */}
        <div className="lg:col-span-2 relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-slate-900 via-slate-850 to-slate-950 text-white shadow-xl border border-slate-700/50 flex flex-col justify-between min-h-[240px]">
          {/* Subtle Ambient Glow */}
          <div className="absolute top-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -translate-x-12 -translate-y-12" />
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none translate-x-12 translate-y-12" />
          
          {/* Card Header */}
          <div className="relative z-10 flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xl">{currentTierInfo.icon}</span>
                <span className="text-xs uppercase tracking-wider text-slate-400 font-bold">
                  باشگاه مشتریان و خریداران عمده
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
                <span>سطح {currentTierInfo.label}</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/10 text-emerald-300 font-bold border border-white/10">
                  ضریب امتیاز {currentTierInfo.multiplier}x
                </span>
              </h2>
            </div>

            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-amber-400 shadow-inner">
              <Award size={26} />
            </div>
          </div>

          {/* Card Center: Points & Value */}
          <div className="relative z-10 my-6 flex flex-wrap items-end justify-between gap-4 border-y border-white/10 py-4">
            <div>
              <div className="text-xs text-slate-400 font-medium mb-1">موجودی امتیاز فعال</div>
              <div className="text-3xl sm:text-4xl font-black text-amber-400 font-sans tracking-tight">
                {toPersianNum(summary.currentPoints)}{" "}
                <span className="text-sm font-bold text-slate-300">امتیاز</span>
              </div>
            </div>

            <div className="text-left sm:text-right">
              <div className="text-xs text-slate-400 font-medium mb-1">ارزش تخفیف در خرید بعدی</div>
              <div className="text-xl sm:text-2xl font-black text-emerald-400 font-sans">
                {toPersianNum(summary.redeemableTomanValue)}{" "}
                <span className="text-xs font-bold text-slate-300">تومان</span>
              </div>
            </div>
          </div>

          {/* Card Footer: User details */}
          <div className="relative z-10 flex items-center justify-between text-xs text-slate-400 font-bold">
            <div className="flex items-center gap-2">
              <span className="text-white">{user?.name || "عضو محترم سامانه"}</span>
              {user?.company && <span>• {user.company}</span>}
            </div>
            <div className="font-mono text-[11px] text-slate-400">
              {user?.customerCode || user?.userCode || `CST-${user?.phone ? user.phone.slice(-4) : "1001"}`}
            </div>
          </div>
        </div>

        {/* Quick Action & Redemption Card */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                <Sparkles size={20} />
              </span>
              <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg">
                اعمال خودکار در سبد خرید
              </span>
            </div>
            <h3 className="text-base font-black text-slate-900 mb-1">استفاده مستقیم از امتیازها</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              در مرحله نهایی ثبت سفارش (فاکتور)، می‌توانید به میزان امتیازهای خود تا سقف ۳۰٪ مبلغ فاکتور تخفیف نقدی دریافت کنید.
            </p>
          </div>

          <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-100 space-y-2 text-xs">
            <div className="flex justify-between font-bold text-slate-700">
              <span>مجموع امتیازهای کسب شده:</span>
              <span className="font-black text-slate-900 font-sans">{toPersianNum(summary.lifetimePoints)}</span>
            </div>
            <div className="flex justify-between font-bold text-slate-700">
              <span>کل خریدهای ثبت شده:</span>
              <span className="font-black text-slate-900 font-sans">{toPersianNum(summary.totalSpent)} تومان</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setActiveTab('order')}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 cursor-pointer active:scale-98"
          >
            <ShoppingBag size={16} />
            <span>ورود به ویترین کالا و خرید با تخفیف امتیاز</span>
          </button>
        </div>

      </div>

      {/* 2. PROGRESS TO NEXT TIER */}
      {nextTier ? (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-slate-900">مسیر ارتقا به سطح {nextTier.label}</span>
                <span className="text-xs px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 font-bold border border-amber-200">
                  {toPersianNum(nextTier.currentProgressPercent)}٪ تکمیل شده
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                با انجام {toPersianNum(nextTier.remainingSpend)} تومان خرید دیگر، به سطح {nextTier.label} ارتقاء می‌یابید و از مزایای ضریب بالاتر بهره‌مند می‌شوید.
              </p>
            </div>
            <div className="text-left sm:text-right font-mono text-xs font-black text-slate-700 shrink-0">
              {toPersianNum(summary.totalSpent)} / {toPersianNum(nextTier.requiredSpend)} تومان
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
            <div 
              className="h-full bg-gradient-to-l from-emerald-500 to-teal-600 rounded-full transition-all duration-700"
              style={{ width: `${Math.max(5, nextTier.currentProgressPercent)}%` }}
            />
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-3xl p-6 border border-purple-200 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-600 text-white flex items-center justify-center">
              <Award size={22} />
            </div>
            <div>
              <h4 className="text-sm font-black text-purple-900">شما در بالاترین سطح باشگاه (پلاتینیوم VIP) قرار دارید!</h4>
              <p className="text-xs text-purple-700 mt-0.5">از حداکثر ضریب امتیاز (۲ برابر) و اولویت ۱۰۰٪ خط تولید کارخانجات بهره‌مند هستید.</p>
            </div>
          </div>
        </div>
      )}

      {/* 3. TIER COMPARISON GRID */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-black text-slate-900">سطوح و پاداش‌های باشگاه مشتریان</h3>
            <p className="text-xs text-slate-500 mt-0.5">با افزایش حجم خریدهای سالانه، ضریب امتیاز و امکانات توزیعی شما ارتقاء می‌یابد.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 pt-2">
          {Object.values(LOYALTY_CONFIG.TIERS).map((t) => {
            const isCurrent = summary.tier === t.key;
            return (
              <div 
                key={t.key}
                className={`relative rounded-2xl p-5 border transition-all flex flex-col justify-between ${
                  isCurrent 
                    ? "bg-slate-900 text-white border-slate-800 shadow-lg scale-[1.02]" 
                    : "bg-slate-50/70 hover:bg-slate-50 text-slate-800 border-slate-200"
                }`}
              >
                {isCurrent && (
                  <span className="absolute -top-2.5 right-4 px-2.5 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-black shadow-xs">
                    سطح فعلی شما
                  </span>
                )}

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl">{t.icon}</span>
                    <span className={`text-xs font-black px-2 py-0.5 rounded-md ${
                      isCurrent ? "bg-white/10 text-amber-300" : "bg-slate-200 text-slate-700"
                    }`}>
                      ضریب {t.multiplier}x
                    </span>
                  </div>

                  <div>
                    <h4 className="text-sm font-black mb-0.5">{t.label}</h4>
                    <p className={`text-[11px] font-medium ${isCurrent ? "text-slate-300" : "text-slate-500"}`}>
                      {t.minSpend === 0 ? "شروع عضویت" : `از ${toPersianNum(t.minSpend)} تومان خرید`}
                    </p>
                  </div>

                  <ul className="space-y-1.5 pt-2 border-t border-slate-200/40 text-[11px]">
                    {t.perks.map((perk, i) => (
                      <li key={`loyaltyrewardsclub-i-${i}`} className="flex items-start gap-1.5 leading-snug">
                        <CheckCircle2 size={13} className={`shrink-0 mt-0.5 ${isCurrent ? "text-emerald-400" : "text-emerald-600"}`} />
                        <span className={isCurrent ? "text-slate-200" : "text-slate-600"}>{perk}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. MISSIONS & WAYS TO EARN MORE POINTS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Mission 1: Wholesale Orders */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <ShoppingBag size={20} />
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black text-slate-900">خرید عمده مواد غذایی و تنقلات</h4>
              <span className="text-[11px] font-black text-amber-600">+۱ امتیاز / ۱۰۰هزار تومان</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              با هر ثبت سفارش موفق از هر کدام از برندها و کارخانجات، امتیاز مستقیماً در حساب شما شارژ می‌شود.
            </p>
          </div>
        </div>

        {/* Mission 2: Cash Settlements */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Zap size={20} />
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black text-slate-900">تسویه نقدی فاکتور</h4>
              <span className="text-[11px] font-black text-emerald-600">+۳۰ امتیاز پاداش</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              علاوه بر درصد تخفیف نقدی پای فاکتور، امتیاز پاداش خوش‌حسابی ویژه به کیف امتیاز شما افزوده می‌گردد.
            </p>
          </div>
        </div>

        {/* Mission 3: Referrals */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Gift size={20} />
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black text-slate-900">دعوت از همکاران فروشگاهی</h4>
              <span className="text-[11px] font-black text-indigo-600">+۱۰۰ امتیاز هدیه</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              با اشتراک‌گذاری لینک اختصاصی خود، به ازای ثبت سفارش اولین خرید هر همکار ۱۰۰ امتیاز هدیه بگیرید.
            </p>
          </div>
        </div>

      </div>

      {/* 5. REFERRAL INVITE BOX */}
      <div className="bg-gradient-to-r from-amber-500/10 via-amber-400/5 to-transparent rounded-3xl p-6 border border-amber-300/40 shadow-xs flex flex-col md:flex-row items-center justify-between gap-5">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-amber-500/20">
            <Gift size={24} />
          </div>
          <div className="space-y-0.5">
            <h4 className="text-sm font-black text-slate-900">لینک اختصاصی دعوت از همکاران و سوپرمارکت‌ها</h4>
            <p className="text-xs text-slate-600">
              لینک زیر را کپی کرده و در گروه‌ها یا برای همکاران صنف مواد غذایی ارسال فرمایید:
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <input 
            type="text" 
            readOnly 
            value={referralUrl}
            className="w-full md:w-72 px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-700 text-left"
          />
          <button
            type="button"
            onClick={handleCopyReferral}
            className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shrink-0 shadow-xs"
          >
            {copiedLink ? <Check size={16} /> : <Copy size={16} />}
            <span>{copiedLink ? "کپی شد" : "کپی لینک"}</span>
          </button>
        </div>
      </div>

      {/* 6. TRANSACTIONS HISTORY LOG */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-black text-slate-900">تاریخچه تراکنش‌های امتیاز</h3>
            <p className="text-xs text-slate-500 mt-0.5">ریز گزارش امتیازهای دریافتی از سفارش‌ها و تخفیف‌های مصرف‌شده</p>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterType === 'all' ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              همه ({toPersianNum(summary.transactions.length)})
            </button>
            <button
              type="button"
              onClick={() => setFilterType('earned')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterType === 'earned' ? "bg-white text-emerald-700 shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              کسب شده (پاداش)
            </button>
            <button
              type="button"
              onClick={() => setFilterType('redeemed')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterType === 'redeemed' ? "bg-white text-rose-700 shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              مصرف شده (تخفیف)
            </button>
          </div>
        </div>

        {filteredTransactions.length === 0 ? (
          <div className="py-12 text-center text-slate-400 space-y-2">
            <Clock size={32} className="mx-auto text-slate-300" />
            <p className="text-xs font-bold">هیچ تراکنش امتیازی در این بخش یافت نشد.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold">
                  <th className="pb-3 pr-2">شرح فعالیت</th>
                  <th className="pb-3 text-center">شماره رهگیری / فاکتور</th>
                  <th className="pb-3 text-center">تاریخ و ساعت</th>
                  <th className="pb-3 text-left pl-2">تغییرات امتیاز</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTransactions.map((tx) => {
                  const isEarn = tx.points > 0;
                  return (
                    <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 pr-2">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                            isEarn ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                          }`}>
                            {isEarn ? <ArrowDownRight size={15} /> : <ArrowUpRight size={15} />}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">{tx.description}</div>
                            {tx.discountAmount && (
                              <div className="text-[11px] text-slate-400 mt-0.5">
                                تخفیف معادل: {toPersianNum(tx.discountAmount)} تومان
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 text-center font-mono font-bold text-slate-600">
                        {tx.orderTrackingNumber || "سیستمی"}
                      </td>

                      <td className="py-3.5 text-center text-slate-500 font-medium">
                        {new Date(tx.createdAt).toLocaleDateString('fa-IR', {
                          year: 'numeric',
                          month: 'numeric',
                          day: 'numeric'
                        })}
                      </td>

                      <td className="py-3.5 text-left pl-2 font-sans font-black">
                        <span className={`inline-flex items-center gap-0.5 px-2.5 py-1 rounded-lg text-xs ${
                          isEarn 
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200" 
                            : "bg-rose-50 text-rose-700 border border-rose-200"
                        }`}>
                          {isEarn ? `+${toPersianNum(tx.points)}` : toPersianNum(tx.points)} امتیاز
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

      </div>

    </div>
  );
}
