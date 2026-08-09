import React, { useState } from 'react';
import { Gift, Copy, Check, Share2, Users, ArrowLeft, Send, Sparkles, X, Award, CheckCircle2, DollarSign } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ReferralRewardModalProps {
  isOpen: boolean;
  onClose: () => void;
  userPhone?: string;
}

export const ReferralRewardModal: React.FC<ReferralRewardModalProps> = ({
  isOpen,
  onClose,
  userPhone = '09123456789'
}) => {
  const referralCode = `BONK-${userPhone.slice(-4) || '8832'}`;
  const referralLink = `https://dastaval.ir/join?ref=${referralCode}`;
  
  const [copied, setCopied] = useState(false);
  const [friendPhone, setFriendPhone] = useState('');
  const [friendShop, setFriendShop] = useState('');
  const [invitedList, setInvitedList] = useState<Array<{
    id: number;
    name: string;
    city: string;
    status: string;
    reward: string;
    date: string;
  }>>(() => {
    try {
      const saved = localStorage.getItem('dastaval_referral_list');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [];
  });
  const [submittedMessage, setSubmittedMessage] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!friendPhone) return;
    
    const newEntry = {
      id: Date.now(),
      name: friendShop || `همکار (${friendPhone.slice(-4)})`,
      city: 'در حال استعلام',
      status: 'دعوت‌نامه ارسال شد',
      reward: 'در جریان',
      date: 'امروز'
    };

    setInvitedList((prev) => {
      const updated = [newEntry, ...prev];
      try {
        localStorage.setItem('dastaval_referral_list', JSON.stringify(updated));
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

  const shareText = `سلام همکار گرامی، برای تامین مستقیم کالا از کارخانه با قیمت بنکداری دست اول و تخفیف ویژه، از طریق لینک زیر ثبت‌نام کنید:\n${referralLink}`;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm" dir="rtl">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header Banner */}
          <div className="relative bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-700 text-white p-4 sm:p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center text-xl shrink-0 backdrop-blur-md">
                🎁
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-black text-sm sm:text-base">طرح دعوت از همکاران (پاداش بنکداری)</h3>
                  <span className="bg-amber-400 text-slate-900 text-[10px] font-black px-2 py-0.5 rounded-full">ویژه همکاران</span>
                </div>
                <p className="text-[11px] text-emerald-100 font-bold mt-0.5">
                  معرفی بنکداران و فروشگاه‌ها و دریافت اعتبار هدیه مستقیم
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

          {/* Scrollable Content Body */}
          <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
            
            {/* Rewards Highlight Box */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-2xl p-3 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black text-emerald-800">پاداش شما</span>
                  <Award size={16} className="text-emerald-600" />
                </div>
                <div className="mt-2">
                  <div className="text-sm sm:text-base font-black text-emerald-900">۱,۰۰۰,۰۰۰ تومان</div>
                  <div className="text-[10px] text-emerald-700 font-bold mt-0.5">اعتبار خرید به ازای هر همکار</div>
                </div>
              </div>

              <div className="bg-blue-50/80 border border-blue-200/80 rounded-2xl p-3 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black text-blue-800">هدیه همکار دعوت‌شده</span>
                  <Gift size={16} className="text-blue-600" />
                </div>
                <div className="mt-2">
                  <div className="text-sm sm:text-base font-black text-blue-900">۵٪ تخفیف ویژه</div>
                  <div className="text-[10px] text-blue-700 font-bold mt-0.5">روی اولین فاکتور ثبت سفارش</div>
                </div>
              </div>
            </div>

            {/* Quick Share Link Box */}
            <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-3.5 space-y-2.5">
              <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                <Share2 size={14} className="text-indigo-600" />
                <span>لینک و کد اختصاصی دعوت شما:</span>
              </label>

              <div className="flex items-center gap-2">
                <div className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 dir-ltr text-left truncate">
                  {referralLink}
                </div>
                <button
                  onClick={handleCopy}
                  className={`px-3 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                    copied
                      ? 'bg-emerald-600 text-white'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                  }`}
                >
                  {copied ? (
                    <>
                      <Check size={14} />
                      <span>کپی شد!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={14} />
                      <span>کپی لینک</span>
                    </>
                  )}
                </button>
              </div>

              {/* Direct Quick Share Apps */}
              <div className="pt-1 flex items-center justify-between gap-2">
                <span className="text-[10px] font-extrabold text-slate-500">ارسال مستقیم در:</span>
                <div className="flex items-center gap-2">
                  {/* WhatsApp */}
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-xl text-[11px] font-black flex items-center gap-1 transition-colors"
                  >
                    <span>واتساپ</span>
                  </a>
                  {/* Rubika */}
                  <a
                    href={`https://rubika.ir`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 px-2.5 py-1 rounded-xl text-[11px] font-black flex items-center gap-1 transition-colors"
                  >
                    <span>روبیکا</span>
                  </a>
                  {/* SMS */}
                  <a
                    href={`sms:?body=${encodeURIComponent(shareText)}`}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 px-2.5 py-1 rounded-xl text-[11px] font-black flex items-center gap-1 transition-colors"
                  >
                    <span>پیامک</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Direct Form SMS Invite */}
            <form onSubmit={handleSendInvite} className="bg-white border border-slate-200 rounded-2xl p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                  <Users size={14} className="text-emerald-600" />
                  <span>دعوت مستقیم همکار با پیامک رایگان:</span>
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
                className="w-full bg-slate-900 hover:bg-emerald-700 text-white py-2 rounded-xl text-xs font-black transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Send size={13} />
                <span>ارسال پیامک دعوت‌نامه همکار</span>
              </button>

              {submittedMessage && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-1.5 rounded-xl text-[11px] font-extrabold flex items-center gap-1.5">
                  <CheckCircle2 size={14} className="text-emerald-600" />
                  <span>دعوت‌نامه با موفقیت ارسال شد و در فهرست ثبت گردید.</span>
                </div>
              )}
            </form>

            {/* Invited Colleagues Table */}
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-black text-slate-800">سوابق همکاران دعوت‌شده شما ({invitedList.length})</span>
                {invitedList.length > 0 && (
                  <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    فعالیت ثبت شده: {invitedList.length} همکار
                  </span>
                )}
              </div>

              <div className="space-y-1.5 max-h-36 overflow-y-auto">
                {invitedList.length > 0 ? (
                  invitedList.map((item) => (
                    <div key={item.id} className="bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 flex items-center justify-between text-xs">
                      <div className="space-y-0.5">
                        <div className="font-black text-slate-900">{item.name}</div>
                        <div className="text-[10px] text-slate-500 font-bold">{item.city} • {item.date}</div>
                      </div>
                      <div className="text-left space-y-0.5">
                        <div className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                          item.status.includes('خرید')
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {item.status}
                        </div>
                        <div className="text-[10px] text-slate-700 font-extrabold dir-ltr">{item.reward}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl p-4 text-center space-y-1">
                    <div className="text-lg">🤝</div>
                    <div className="text-xs font-black text-slate-700">هنوز همکاری دعوت نشده است</div>
                    <p className="text-[11px] text-slate-400 font-bold">
                      با ارسال لینک یا پیامک دعوت، اولین سابقه شما در اینجا قرار می‌گیرد.
                    </p>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Footer Action */}
          <div className="bg-slate-50 border-t border-slate-200 p-3 flex justify-between items-center">
            <span className="text-[10px] font-bold text-slate-500">پاداش‌ها بلافاصله پس از اولین خرید همکار به کیف پول اضافه می‌شود.</span>
            <button
              onClick={onClose}
              className="bg-slate-200 hover:bg-slate-300 text-slate-800 px-4 py-1.5 rounded-xl text-xs font-black transition-colors cursor-pointer"
            >
              بستن
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
