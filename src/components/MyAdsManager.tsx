import React, { useState, useEffect } from "react";
import { 
  Megaphone, Plus, Users, Sparkles, Edit, Trash2, X, ShieldAlert, 
  CheckCircle, UploadCloud, Loader2, MegaphoneOff
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface MyAdsManagerProps {
  user: any;
  setActiveTab?: (tab: string) => void;
}

export default function MyAdsManager({ user, setActiveTab }: MyAdsManagerProps) {
  const [userAds, setUserAds] = useState<any[]>([]);
  const [adLeads, setAdLeads] = useState<any[]>([]);
  const [selectedAdForLeads, setSelectedAdForLeads] = useState<any | null>(null);
  const [showSpecialModal, setShowSpecialModal] = useState<any | null>(null);
  const [isUploadingReceipt, setIsUploadingReceipt] = useState(false);
  const [specialSuccess, setSpecialSuccess] = useState(false);

  const toPersianNum = (num: number | string | undefined | null) => {
    if (num === undefined || num === null || num === "") return "۰";
    const s = String(num);
    const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
    return s.replace(/\d/g, (d) => persianDigits[parseInt(d, 10)]);
  };

  const [editingAd, setEditingAd] = useState<any | null>(null);

  // Edit Form States
  const [editTitle, setEditTitle] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editQuantity, setEditQuantity] = useState("");
  const [editDescription, setEditDescription] = useState("");

  const openEditModal = (ad: any) => {
    setEditingAd(ad);
    setEditTitle(ad.title || "");
    setEditPrice(ad.wholesalePrice || "");
    setEditQuantity(ad.quantity || "");
    setEditDescription(ad.description || "");
  };

  const handleSaveEdit = () => {
    if (!editingAd) return;
    handleUpdateAd(editingAd.id, {
      title: editTitle,
      wholesalePrice: editPrice,
      quantity: editQuantity,
      description: editDescription,
      status: 'pending' // Re-verify after edit
    });
    setEditingAd(null);
  };

  const fetchUserAds = () => {
    if (!user) return;
    try {
      const allAds = JSON.parse(localStorage.getItem("dastavval_sponsored_ads_v2") || "[]");
      const uPhone = (user.phone || user.mobile || "").trim();
      const filtered = allAds.filter((ad: any) => ad.creatorPhone === uPhone || ad.contactPhone === uPhone);
      setUserAds(filtered);
      
      const allLeads = JSON.parse(localStorage.getItem("dastavval_safe_buy_requests") || "[]");
      const myAdIds = filtered.map((a: any) => a.id);
      const filteredLeads = allLeads.filter((l: any) => myAdIds.includes(l.adId));
      setAdLeads(filteredLeads);
    } catch (e) {}
  };

  useEffect(() => {
    fetchUserAds();
    window.addEventListener("dastavval_ads_updated", fetchUserAds);
    return () => window.removeEventListener("dastavval_ads_updated", fetchUserAds);
  }, [user]);

  const handleDeleteAd = (id: string) => {
    if (!window.confirm("آیا از حذف این آگهی اطمینان دارید؟")) return;
    try {
      const allAds = JSON.parse(localStorage.getItem("dastavval_sponsored_ads_v2") || "[]");
      const filtered = allAds.filter((ad: any) => ad.id !== id);
      localStorage.setItem("dastavval_sponsored_ads_v2", JSON.stringify(filtered));
      window.dispatchEvent(new CustomEvent("dastavval_ads_updated"));
      fetchUserAds();
    } catch (e) {}
  };

  const handleUpdateAd = (id: string, updates: any) => {
    try {
      const allAds = JSON.parse(localStorage.getItem("dastavval_sponsored_ads_v2") || "[]");
      const updated = allAds.map((ad: any) => ad.id === id ? { ...ad, ...updates } : ad);
      localStorage.setItem("dastavval_sponsored_ads_v2", JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent("dastavval_ads_updated"));
      fetchUserAds();
    } catch (e) {}
  };

  const handleUploadReceipt = async (e: React.ChangeEvent<HTMLInputElement>, adId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingReceipt(true);
    try {
      const reader = new FileReader();
      reader.onloadend = () => {
        const url = reader.result as string;
        handleUpdateAd(adId, { 
          specialPaymentStatus: "pending", 
          specialReceiptUrl: url,
          specialRequest: true 
        });
        setSpecialSuccess(true);
        setTimeout(() => {
          setSpecialSuccess(false);
          setShowSpecialModal(null);
        }, 3000);
      };
      reader.readAsDataURL(file);
    } catch (e) {
    } finally {
      setIsUploadingReceipt(false);
    }
  };

  return (
    <div className="space-y-6 text-right" dir="rtl">
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-emerald-600 text-white rounded-2xl flex items-center justify-center text-2xl">
              📢
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">مدیریت آگهی‌های من</h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">تاریخچه، ویرایش و ارتقا به آگهی ویژه</p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab && setActiveTab('billboard')}
            className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-black flex items-center gap-2 hover:bg-emerald-700 transition-all shadow-xs"
          >
            <Plus size={16} />
            <span>ثبت آگهی جدید</span>
          </button>
        </div>

        {userAds.length === 0 ? (
          <div className="text-center py-12 space-y-4">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
              <Megaphone size={40} className="text-slate-300" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-black text-slate-800">شما هنوز هیچ آگهی ثبت نکرده‌اید</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">برای ثبت بار مازاد، کالای زیر قیمت یا درخواست تامین مستقیم از دکمه ثبت آگهی استفاده کنید.</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {userAds.map((ad, idx) => (
              <div key={`my-ads-item-${ad.id || idx}-${idx}`} className="bg-slate-50/50 rounded-2xl border border-slate-200/60 p-4 flex flex-col md:flex-row gap-5 items-start md:items-center">
                <div className="w-24 h-24 rounded-xl overflow-hidden border border-slate-200 shrink-0 bg-white shadow-2xs">
                  <img src={ad.imageUrl} alt={ad.title} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-sm font-black text-slate-900">{ad.title}</h4>
                    {ad.status === 'approved' ? (
                      <span className="bg-emerald-600 text-white text-[10px] px-2 py-0.5 rounded-full border border-emerald-200 font-bold">تایید شده</span>
                    ) : ad.status === 'rejected' ? (
                      <span className="bg-emerald-600 text-white text-[10px] px-2 py-0.5 rounded-full border border-emerald-200 font-bold">رد شده</span>
                    ) : (
                      <span className="bg-emerald-50 text-amber-700 text-[10px] px-2 py-0.5 rounded-full border border-emerald-200 font-bold">در انتظار تایید</span>
                    )}
                    {ad.isSponsored && (
                      <span className="bg-[#10b981] text-white text-[9px] px-2 py-0.5 rounded-full font-black shadow-xs">ویژه شده 🌟</span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-[11px] text-slate-500 font-bold">
                    <span>تاریخ: {toPersianNum(ad.date)}</span>
                    <span>دسته: {ad.category === 'under_market' ? 'زیر قیمت' : ad.category === 'liquid' ? 'مازاد' : 'تامین مستقیم'}</span>
                    <span>قیمت: {toPersianNum(ad.wholesalePrice)}</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                  <button
                    onClick={() => setSelectedAdForLeads(ad)}
                    className="px-3 py-2 bg-white text-slate-700 border border-slate-200 rounded-xl text-[11px] font-black hover:bg-emerald-50 transition-all flex items-center gap-1.5"
                  >
                    <Users size={14} className="text-[#10b981]" />
                    <span>درخواست‌ها ({toPersianNum(adLeads.filter(l => l.adId === ad.id).length)})</span>
                  </button>

                  {!ad.isSponsored && (
                    <button
                      onClick={() => setShowSpecialModal(ad)}
                      className="px-3 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl text-[11px] font-black hover:from-emerald-600 transition-all flex items-center gap-1.5 shadow-xs"
                    >
                      <Sparkles size={14} />
                      <span>ویژه کردن</span>
                    </button>
                  )}
                  
                  <button
                    onClick={() => openEditModal(ad)}
                    className="p-2 text-slate-400 hover:text-emerald-600 transition-colors"
                  >
                    <Edit size={18} />
                  </button>
                  
                  <button
                    onClick={() => handleDeleteAd(ad.id)}
                    className="p-2 text-slate-400 hover:text-emerald-600 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* EDIT AD MODAL */}
      <AnimatePresence>
        {editingAd && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm" onClick={() => setEditingAd(null)}>
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-[2rem] p-6 sm:p-8 w-full max-w-lg border border-slate-200 shadow-2xl space-y-5"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h3 className="text-base font-black text-slate-900">ویرایش آگهی</h3>
                <button onClick={() => setEditingAd(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                  <X size={20} className="text-slate-400" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] font-black text-slate-500 mb-1.5">عنوان آگهی:</label>
                  <input 
                    type="text" 
                    value={editTitle}
                    onChange={e => setEditTitle(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-black text-slate-500 mb-1.5">قیمت پیشنهادی:</label>
                    <input 
                      type="text" 
                      value={editPrice}
                      onChange={e => setEditPrice(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-black text-slate-500 mb-1.5">مقدار موجودی:</label>
                    <input 
                      type="text" 
                      value={editQuantity}
                      onChange={e => setEditQuantity(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-black text-slate-500 mb-1.5">توضیحات و شرایط:</label>
                  <textarea 
                    value={editDescription}
                    onChange={e => setEditDescription(e.target.value)}
                    rows={4}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => setEditingAd(null)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-black transition-all"
                >
                  انصراف
                </button>
                <button 
                  onClick={handleSaveEdit}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all shadow-md"
                >
                  ذخیره تغییرات
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* PAYMENTS HISTORY SECTION */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="w-10 h-10 bg-emerald-50 text-[#10b981] rounded-xl flex items-center justify-center">
            <CheckCircle size={20} />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900">تاریخچه پرداخت‌ها و ارتقاها</h3>
            <p className="text-xs text-slate-500 font-bold mt-0.5">مشاهده وضعیت تراکنش‌های مالی و تایید فیش‌های ارسالی بابت ویژه کردن آگهی‌ها.</p>
          </div>
        </div>

        <div className="space-y-3">
          {userAds.filter(ad => ad.specialPaymentStatus && ad.specialPaymentStatus !== 'none').length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs font-bold bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              هنوز پرداختی بابت ارتقای آگهی ثبت نکرده‌اید.
            </div>
          ) : (
            userAds.filter(ad => ad.specialPaymentStatus && ad.specialPaymentStatus !== 'none').map((ad) => (
              <div key={`payment-${ad.id}`} className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden border border-slate-200">
                    <img src={ad.imageUrl} alt={ad.title} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900">{ad.title}</h4>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[10px] text-slate-400 font-bold">بابت: ویژه کردن آگهی</span>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                        ad.specialPaymentStatus === 'approved' ? 'bg-emerald-600 text-white border border-emerald-100' :
                        ad.specialPaymentStatus === 'pending' ? 'bg-emerald-50 text-amber-700 border border-emerald-100' :
                        'bg-emerald-600 text-white border border-emerald-100'
                      }`}>
                        {ad.specialPaymentStatus === 'approved' ? 'تایید شده' : 
                         ad.specialPaymentStatus === 'pending' ? 'در انتظار تایید' : 'رد شده'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-left">
                  <span className="text-[10px] text-slate-400 block mb-1">مبلغ: ۳۵۰,۰۰۰ تومان</span>
                  <span className="text-[10px] font-black text-slate-900">{toPersianNum(ad.date)}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      <AnimatePresence>
        {selectedAdForLeads && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm" onClick={() => setSelectedAdForLeads(null)}>
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-[2rem] p-6 sm:p-8 w-full max-w-2xl border border-slate-200 shadow-2xl space-y-6"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h3 className="text-base font-black text-slate-900">لیست درخواست‌های خرید (لیدها)</h3>
                <button onClick={() => setSelectedAdForLeads(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                  <X size={20} className="text-slate-400" />
                </button>
              </div>

              <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-4 flex gap-3 text-[11px] text-amber-900 font-bold leading-relaxed">
                <ShieldAlert size={18} className="text-emerald-600 shrink-0" />
                <p>به منظور رعایت حریم خصوصی و امنیت معامله، مشخصات مستقیم خریداران پنهان است. جهت پیگیری و نهایی‌سازی معامله با کارشناسان پلتفرم تماس حاصل فرمایید.</p>
              </div>

              <div className="space-y-3 overflow-y-auto max-h-[50vh] pr-1">
                {adLeads.filter(l => l.adId === selectedAdForLeads.id).length === 0 ? (
                  <div className="text-center py-10 text-slate-400 text-xs font-bold">هنوز درخواستی برای این آگهی ثبت نشده است.</div>
                ) : (
                  adLeads.filter(l => l.adId === selectedAdForLeads.id).map((lead, idx) => (
                    <div key={`my-ads-lead-${lead.id || idx}-${idx}`} className="bg-slate-50 rounded-xl p-4 border border-slate-200/60 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-black text-[#10b981]">درخواست کد: {lead.id}</span>
                        <span className="text-[10px] text-slate-400">{toPersianNum(lead.date)}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <span className="text-[10px] text-slate-400 block">نام متقاضی:</span>
                          <span className="text-[11px] font-bold text-slate-700">*** (پنهان)</span>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[10px] text-slate-400 block">شماره تماس:</span>
                          <span className="text-[11px] font-bold text-slate-700">*** (پنهان)</span>
                        </div>
                      </div>
                      <div className="pt-2 border-t border-slate-200/50">
                        <span className="text-[10px] text-slate-400 block mb-1">پیام خریدار:</span>
                        <p className="text-[11px] text-slate-600 italic leading-relaxed">{lead.buyerMessage || "بدون پیام"}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SPECIAL AD UPGRADE MODAL */}
      <AnimatePresence>
        {showSpecialModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowSpecialModal(null)}>
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-[2rem] p-6 sm:p-8 w-full max-w-lg border border-slate-200 shadow-2xl space-y-6"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Sparkles className="text-emerald-500" size={20} />
                  <span>ارتقا به آگهی ویژه (اسپانسر شده)</span>
                </h3>
                <button onClick={() => setShowSpecialModal(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                  <X size={20} className="text-slate-400" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100 space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-600 font-bold">هزینه ارتقا (۷ روز نمایش):</span>
                    <span className="text-[#10b981] font-black">۲۵۰,۰۰۰ تومان</span>
                  </div>
                  <div className="pt-2 border-t border-emerald-200/50 space-y-2">
                    <span className="text-[10px] text-emerald-700 font-black block">شماره کارت جهت واریز:</span>
                    <div className="bg-white p-3 rounded-xl border border-emerald-200 text-center text-sm font-mono font-bold tracking-widest text-slate-800">
                      ۶۰۳۷ - ۹۹۷۵ - ۱۲۳۴ - ۵۶۷۸
                    </div>
                    <span className="text-[9px] text-slate-500 text-center block">به نام: پلتفرم مدیریت تامین دست‌اول</span>
                  </div>
                </div>

                {specialSuccess ? (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 text-center space-y-2">
                    <CheckCircle size={32} className="text-emerald-600 mx-auto" />
                    <h4 className="text-sm font-black text-emerald-900">رسید با موفقیت ارسال شد</h4>
                    <p className="text-[10px] text-emerald-700">پس از تایید واحد مالی، آگهی شما ویژه خواهد شد.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[11px] font-black text-slate-700 block">بارگذاری تصویر فیش واریزی:</label>
                      <div className="relative">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleUploadReceipt(e, showSpecialModal.id)}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                          disabled={isUploadingReceipt}
                        />
                        <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center bg-slate-50 hover:bg-slate-100 transition-all flex flex-col items-center gap-2">
                          {isUploadingReceipt ? (
                            <Loader2 size={30} className="text-[#10b981] animate-spin" />
                          ) : (
                            <UploadCloud size={30} className="text-slate-400" />
                          )}
                          <span className="text-xs font-bold text-slate-500">
                            {isUploadingReceipt ? "در حال بارگذاری..." : "برای انتخاب فیش کلیک کنید"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
