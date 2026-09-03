import React, { useState } from 'react';
import { Gift, Copy, Check, Share2, Users, ArrowLeft, Send, Sparkles, X, Award, CheckCircle2, DollarSign, ShieldCheck, Briefcase, Building2, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AnimatedHatchedOverlay } from "./AnimatedHatchedOverlay";
import { getUserReferralProfile } from "../lib/referral-system";
import { toPersianNum } from "../utils/persian-utils";

interface ReferralRewardModalProps {
  isOpen: boolean;
  onClose: () => void;
  userPhone?: string;
  user?: any;
}

export const ReferralRewardModal: React.FC<ReferralRewardModalProps> = ({
  isOpen,
  onClose,
  userPhone = '09123456789',
  user
}) => {
  const referralProfile = getUserReferralProfile(user || { phone: userPhone });
  const referralCode = referralProfile.referralCode;
  const agencyCode = referralProfile.agencyCode;
  const referralLink = referralProfile.referralLink;
  
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedAgency, setCopiedAgency] = useState(false);
  const [friendPhone, setFriendPhone] = useState('');
  const [friendShop, setFriendShop] = useState('');
  const [activeTab, setActiveTab] = useState<'tiers' | 'invite' | 'history'>('tiers');
  
  const storageKey = `dastaval_referral_list_${user?.phone || userPhone || 'default'}`;
  const [invitedList, setInvitedList] = useState<Array<{
    id: number;
    name: string;
    city: string;
    status: string;
    reward: string;
    date: string;
  }>>(() => {
    try {
      const saved = localStorage.getItem(storageKey) || localStorage.getItem('dastaval_referral_list');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [];
  });
  const [submittedMessage, setSubmittedMessage] = useState(false);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(referralCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyAgency = () => {
    if (!agencyCode) return;
    navigator.clipboard.writeText(agencyCode);
    setCopiedAgency(true);
    setTimeout(() => setCopiedAgency(false), 2000);
  };

  const handleSendInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!friendPhone) return;
    
    const newEntry = {
      id: Date.now(),
      name: friendShop || `همکار (${friendPhone.slice(-4)})`,
      city: 'در انتظار اولین سفارش',
      status: 'دعوت‌نامه ارسال شد',
      reward: referralProfile.role === 'representative' ? '۵٪ پورسانت' : referralProfile.role === 'marketer' ? '۱,۰۰۰,۰۰۰ تومان' : '۵۰۰,۰۰۰ تومان',
      date: 'امروز'
    };

    setInvitedList((prev) => {
      const updated = [newEntry, ...prev];
      try {
        localStorage.setItem(storageKey, JSON.stringify(updated));
      } catch (err) {
        console.error(err);
      }
      return updated;
    });

    setFriendPhone('');
    setFriendShop('');
    setSubmittedMessage(true);
    setTimeout(() => setSubmittedMessage(false), 3000);
  };

  const shareText = `سلام همکار گرامی، با استفاده از کد معرف «${referralCode}» در سامانه ملّی دست اول ثبت سفارش نمایید تا از تخفیف ویژه خرید مستقیم با قیمت درب کارخانه برخوردار شوید:\n${referralLink}`;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm" dir="rtl">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        >
          <AnimatedHatchedOverlay intensity="light" />
          
          {/* Header Banner */}
          <div className="relative bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white p-4 sm:p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center text-2xl shrink-0 backdrop-blur-md">
                🎁
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-sm sm:text-base">سامانه پاداش، پورسانت و تخفیف دوطرفه دست اول</h3>
                  <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full">
                    {referralProfile.roleTitle}
                  </span>
                </div>
                <p className="text-[11px] text-emerald-100 font-bold mt-0.5">
                  پاداش نقدی میلیونی برای شما + تخفیف ویژه خرید مستقیم برای طرف مقابل
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer shrink-0"
            >
              <X size={18} />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-slate-200 bg-slate-50 px-4 pt-2 gap-2 text-xs font-black">
            <button
              onClick={() => setActiveTab('tiers')}
              className={`pb-2.5 px-3 border-b-2 transition-all cursor-pointer ${
                activeTab === 'tiers'
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              طرح جامع پورسانت و پاداش‌ها
            </button>
            <button
              onClick={() => setActiveTab('invite')}
              className={`pb-2.5 px-3 border-b-2 transition-all cursor-pointer ${
                activeTab === 'invite'
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              اشتراک‌گذاری و ارسال پیامک
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`pb-2.5 px-3 border-b-2 transition-all cursor-pointer flex items-center gap-1 ${
                activeTab === 'history'
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>لیست دعوت‌ها</span>
              <span className="bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded-full text-[10px]">
                {toPersianNum(invitedList.length)}
              </span>
            </button>
          </div>

          {/* Scrollable Content Body */}
          <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
            
            {/* Active User Code Display Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="bg-emerald-50/90 border border-emerald-300/80 rounded-2xl p-3.5 flex flex-col justify-between shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-emerald-900">کد اختصاصی معرف شما</span>
                  <button
                    onClick={handleCopyCode}
                    className="text-[11px] text-emerald-700 font-black hover:text-emerald-900 flex items-center gap-1 cursor-pointer bg-white px-2 py-0.5 rounded-lg border border-emerald-200"
                  >
                    {copiedCode ? <Check size={12} /> : <Copy size={12} />}
                    <span>{copiedCode ? "کپی شد" : "کپی کد"}</span>
                  </button>
                </div>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="font-mono text-lg font-black text-emerald-900 tracking-wider">
                    {referralCode}
                  </span>
                  <span className="text-[10px] text-emerald-700 font-bold">
                    {referralProfile.rewardHeadline}
                  </span>
                </div>
              </div>

              {agencyCode ? (
                <div className="bg-amber-50/90 border border-amber-300/80 rounded-2xl p-3.5 flex flex-col justify-between shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-amber-900 flex items-center gap-1">
                      <Building2 size={14} className="text-amber-700" />
                      <span>کد نمایندگی و عاملیت رسمی</span>
                    </span>
                    <button
                      onClick={handleCopyAgency}
                      className="text-[11px] text-amber-700 font-black hover:text-amber-900 flex items-center gap-1 cursor-pointer bg-white px-2 py-0.5 rounded-lg border border-amber-200"
                    >
                      {copiedAgency ? <Check size={12} /> : <Copy size={12} />}
                      <span>{copiedAgency ? "کپی شد" : "کپی کد"}</span>
                    </button>
                  </div>
                  <div className="mt-2 flex items-baseline justify-between">
                    <span className="font-mono text-lg font-black text-amber-900 tracking-wider">
                      {agencyCode}
                    </span>
                    <span className="text-[10px] text-amber-800 font-bold">
                      ۵٪ پورسانت قطعی فاکتور
                    </span>
                  </div>
                </div>
              ) : (
                <div className="bg-blue-50/90 border border-blue-300/80 rounded-2xl p-3.5 flex flex-col justify-between shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-blue-900">تخفیف دوست / خریدار معرفی‌شده</span>
                    <Gift size={15} className="text-blue-600" />
                  </div>
                  <div className="mt-2">
                    <div className="text-sm sm:text-base font-black text-blue-900">
                      {referralProfile.buyerBonusDetail}
                    </div>
                    <div className="text-[10px] text-blue-700 font-bold mt-0.5">
                      تخفیف آنی و کسر مستقیم از فاکتور خرید
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* TAB: TIERS BREAKDOWN */}
            {activeTab === 'tiers' && (
              <div className="space-y-3">
                <div className="text-xs font-black text-slate-800 flex items-center justify-between">
                  <span>جدول سطوح و قوانین پاداش‌های ارجاع:</span>
                  <span className="text-[11px] text-emerald-700 font-bold">تخفیف برای هر دو طرف لحاظ می‌شود</span>
                </div>

                {/* Tier 1: Customer */}
                <div className={`p-3.5 rounded-2xl border transition-all ${
                  referralProfile.role === 'customer'
                    ? 'bg-emerald-50/60 border-emerald-400 ring-2 ring-emerald-400/20'
                    : 'bg-white border-slate-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white font-black text-xs flex items-center justify-center">۱</span>
                      <h4 className="text-xs font-black text-slate-900">مشتری و فروشگاه همکار (دعوت از دوستان):</h4>
                    </div>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-black">
                      ۵۰۰ هزار تومان پاداش
                    </span>
                  </div>
                  <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-600">
                    <div className="flex items-center gap-1.5 text-emerald-700 font-bold">
                      <CheckCircle2 size={13} className="shrink-0 text-emerald-600" />
                      <span>پاداش معرف: ۵۰۰,۰۰۰ تومان اعتبار خرید نقدی / کیف پول</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-blue-700 font-bold">
                      <CheckCircle2 size={13} className="shrink-0 text-blue-600" />
                      <span>تخفیف دوست: ۳٪ تخفیف آنی روی فاکتور خرید اول</span>
                    </div>
                  </div>
                </div>

                {/* Tier 2: Marketer */}
                <div className={`p-3.5 rounded-2xl border transition-all ${
                  referralProfile.role === 'marketer'
                    ? 'bg-teal-50/60 border-teal-400 ring-2 ring-teal-400/20'
                    : 'bg-white border-slate-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-teal-600 text-white font-black text-xs flex items-center justify-center">۲</span>
                      <h4 className="text-xs font-black text-slate-900">بازاریاب و مشاور رسمی دست اول:</h4>
                    </div>
                    <span className="px-2 py-0.5 rounded-md bg-teal-100 text-teal-800 text-[10px] font-black">
                      ۱ میلیون تومان + ۵٪ کارمزد
                    </span>
                  </div>
                  <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-600">
                    <div className="flex items-center gap-1.5 text-teal-800 font-bold">
                      <CheckCircle2 size={13} className="shrink-0 text-teal-600" />
                      <span>پاداش معرفی مشتری: ۱,۰۰۰,۰۰۰ تومان (۱ میلیون تومان)</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-amber-700 font-bold">
                      <CheckCircle2 size={13} className="shrink-0 text-amber-600" />
                      <span>در صورت نماینده شدن فرد دعوت‌شده: ۵٪ کارمزد همیشگی</span>
                    </div>
                  </div>
                  <div className="mt-1.5 text-[10px] text-slate-500 font-medium border-t border-slate-100 pt-1">
                    خریدار معرفی‌شده توسط بازاریاب از ۳٪ تخفیف رسمی فاکتور برخوردار می‌گردد.
                  </div>
                </div>

                {/* Tier 3: Representative */}
                <div className={`p-3.5 rounded-2xl border transition-all ${
                  referralProfile.role === 'representative'
                    ? 'bg-amber-50/60 border-amber-400 ring-2 ring-amber-400/20'
                    : 'bg-white border-slate-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-amber-600 text-white font-black text-xs flex items-center justify-center">۳</span>
                      <h4 className="text-xs font-black text-slate-900">نماینده رسمی کارخانجات (عاملیت استانی/شهری):</h4>
                    </div>
                    <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 text-[10px] font-black">
                      ۵٪ پورسانت مستقیم
                    </span>
                  </div>
                  <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-600">
                    <div className="flex items-center gap-1.5 text-amber-800 font-bold">
                      <CheckCircle2 size={13} className="shrink-0 text-amber-600" />
                      <span>پورسانت نماینده: ۵٪ مستقیم از کل مبلغ تمامی سفارش‌ها</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-emerald-700 font-bold">
                      <CheckCircle2 size={13} className="shrink-0 text-emerald-600" />
                      <span>تخفیف خریدار: ۵٪ تخفیف ویژه عاملیت رسمی کارخانه</span>
                    </div>
                  </div>
                  <div className="mt-1.5 text-[10px] text-slate-500 font-medium border-t border-slate-100 pt-1">
                    ثبت کد نمایندگی در هنگام تسویه حساب، به صورت خودکار پورسانت را به حساب نماینده منظور و به خریدار ۵٪ تخفیف اعطا می‌نماید.
                  </div>
                </div>
              </div>
            )}

            {/* TAB: INVITE & SHARE */}
            {activeTab === 'invite' && (
              <div className="space-y-4">
                {/* Link Box */}
                <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-3.5 space-y-2.5">
                  <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                    <Share2 size={14} className="text-emerald-600" />
                    <span>لینک اختصاصی دعوت شما (شامل کد معرف):</span>
                  </label>

                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 dir-ltr text-left truncate">
                      {referralLink}
                    </div>
                    <button
                      onClick={handleCopyLink}
                      className={`px-3 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                        copiedLink
                          ? 'bg-emerald-600 text-white'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      }`}
                    >
                      {copiedLink ? <Check size={14} /> : <Copy size={14} />}
                      <span>{copiedLink ? "کپی شد" : "کپی لینک"}</span>
                    </button>
                  </div>

                  {/* Quick Share Apps */}
                  <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200/60">
                    <span className="text-[10px] font-extrabold text-slate-500">ارسال مستقیم در پیام‌رسان‌ها:</span>
                    <div className="flex flex-wrap items-center gap-2">
                      <a
                        href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-xl text-[11px] font-black flex items-center gap-1 transition-colors"
                      >
                        <span>واتساپ</span>
                      </a>
                      <a
                        href={`https://rubika.ir/dastavval_com`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 px-2.5 py-1 rounded-xl text-[11px] font-black flex items-center gap-1 transition-colors"
                      >
                        <span>روبیکا</span>
                      </a>
                      <a
                        href={`sms:?body=${encodeURIComponent(shareText)}`}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 px-2.5 py-1 rounded-xl text-[11px] font-black flex items-center gap-1 transition-colors"
                      >
                        <span>پیامک گوشی</span>
                      </a>
                    </div>
                  </div>
                </div>

                {/* Direct SMS Form */}
                <form onSubmit={handleSendInvite} className="bg-white border border-slate-200 rounded-2xl p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                      <Users size={14} className="text-emerald-600" />
                      <span>دعوت مستقیم همکار با پیامک رایگان سامانه:</span>
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="نام فروشگاه / همکار"
                      value={friendShop}
                      onChange={(e) => setFriendShop(e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
                    />
                    <input
                      type="tel"
                      placeholder="شماره همراه (مثال: 0912...)"
                      value={friendPhone}
                      onChange={(e) => setFriendPhone(e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500 dir-ltr text-right"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-xl text-xs font-black transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Send size={13} />
                    <span>ارسال دعوت‌نامه اختصاصی همراه با کد {referralCode}</span>
                  </button>

                  {submittedMessage && (
                    <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-1.5 rounded-xl text-[11px] font-extrabold flex items-center gap-1.5">
                      <CheckCircle2 size={14} className="text-emerald-600" />
                      <span>دعوت‌نامه با موفقیت ثبت شد و در صورت خرید، پاداش به حسابتان منظور می‌شود.</span>
                    </div>
                  )}
                </form>
              </div>
            )}

            {/* TAB: HISTORY */}
            {activeTab === 'history' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-black text-slate-800">
                  <span>همکاران و خریداران دعوت‌شده:</span>
                  <span className="text-emerald-700">{toPersianNum(invitedList.length)} نفر ثبت‌شده</span>
                </div>

                {invitedList.length === 0 ? (
                  <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
                    <Users size={28} className="mx-auto text-slate-400" />
                    <p className="text-xs font-bold text-slate-600">هنوز همکاری را دعوت نکرده‌اید.</p>
                    <p className="text-[11px] text-slate-400">کد معرف خود را به اشتراک بگذارید تا پاداش‌ها فعال شوند.</p>
                    <button
                      onClick={() => setActiveTab('invite')}
                      className="px-4 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-black hover:bg-emerald-700 cursor-pointer"
                    >
                      شروع دعوت همکاران
                    </button>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden bg-white">
                    {invitedList.map((item) => (
                      <div key={item.id} className="p-3 flex items-center justify-between text-xs">
                        <div>
                          <div className="font-black text-slate-900">{item.name}</div>
                          <div className="text-[10px] text-slate-400">{item.date} • {item.city}</div>
                        </div>
                        <div className="text-left">
                          <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-black">
                            {item.reward}
                          </span>
                          <div className="text-[10px] text-slate-500 mt-0.5">{item.status}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>

          {/* Footer Bar */}
          <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
            <span className="text-[11px] text-slate-500 font-medium">
              پاداش‌ها بلافاصله پس از پرداخت و نهایی شدن فاکتور همکار در کیف پول شارژ می‌شود.
            </span>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-black cursor-pointer"
            >
              بستن
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
