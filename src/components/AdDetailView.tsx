import React, { useState, useEffect } from "react";
import { 
  ShieldCheck, Calendar, Building2, TrendingDown, 
  ChevronRight, Share2, AlertTriangle, Phone, 
  MessageCircle, Zap, Eye, X, ShoppingBag, Send, CheckCircle2, Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { AdItem, getAdFallbackImage } from "../utils/ad-utils";
import { createNewTicket } from "../lib/tickets-helper";

interface AdDetailViewProps {
  ad: AdItem;
  onBack: () => void;
  onTriggerPayment?: (paymentInfo: any) => void;
  user?: any;
}

export const AdDetailView: React.FC<AdDetailViewProps> = ({ 
  ad, 
  onBack, 
  onTriggerPayment,
  user 
}) => {
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [escrowLoading, setEscrowLoading] = useState(false);
  const [buyerPhone, setBuyerPhone] = useState("");
  const [showEscrowForm, setShowEscrowForm] = useState(false);

  // States for Purchase Request Ticket
  const [showPurchaseForm, setShowPurchaseForm] = useState(false);
  const [purchaseQuantity, setPurchaseQuantity] = useState("");
  const [purchasePhone, setPurchasePhone] = useState("");
  const [purchaseMessage, setPurchaseMessage] = useState("");
  const [purchaseName, setPurchaseName] = useState("");
  const [isSubmittingPurchase, setIsSubmittingPurchase] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);
  const [ticketTrackingCode, setTicketTrackingCode] = useState("");

  const activeUser = user || (() => {
    try {
      const raw = localStorage.getItem("dastavval_user");
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  })();

  useEffect(() => {
    if (activeUser) {
      setPurchasePhone(activeUser.phone || activeUser.mobile || "");
      setPurchaseName(activeUser.name || activeUser.fullName || "");
    }
  }, [user]);

  const handlePurchaseRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!purchasePhone.trim()) {
      alert("لطفا شماره تماس خود را وارد کنید.");
      return;
    }
    if (!purchaseQuantity.trim()) {
      alert("لطفا تعداد یا مقدار درخواستی را وارد کنید.");
      return;
    }
    
    setIsSubmittingPurchase(true);
    try {
      const msg = `درخواست خرید برای آگهی "${ad.title}"\n` +
                  `-------------------------------\n` +
                  `📦 آگهی: ${ad.title}\n` +
                  `🏢 کارخانه/برند: ${ad.factoryName}\n` +
                  `💰 قیمت واحد عمده: ${ad.wholesalePrice} تومان\n` +
                  `🔢 تعداد درخواستی: ${purchaseQuantity}\n` +
                  `👤 نام متقاضی: ${purchaseName || "ناشناس"}\n` +
                  `📞 شماره تماس: ${purchasePhone}\n` +
                  `📝 توضیحات خریدار: ${purchaseMessage || "بدون توضیحات اضافی"}`;
                  
      const newTck = await createNewTicket({
        userName: purchaseName || "خریدار آگهی",
        userPhone: purchasePhone,
        userRole: activeUser?.role || "customer",
        category: "درخواست خرید",
        subject: `درخواست خرید آگهی: ${ad.title}`,
        initialMessage: msg,
        priority: "high",
        productContext: {
          productId: ad.id ? String(ad.id) : `ad_${Date.now()}`,
          productName: ad.title,
          brand: ad.factoryName
        }
      });
      
      setTicketTrackingCode(newTck.trackingCode);
      setPurchaseSuccess(true);
      // Clean up fields
      setPurchaseQuantity("");
      setPurchaseMessage("");
    } catch (error) {
      console.error(error);
      alert("خطایی در ثبت درخواست رخ داد. لطفا دوباره تلاش کنید.");
    } finally {
      setIsSubmittingPurchase(false);
    }
  };

  const getDisplayImageUrl = (url: string) => {
    if (url.startsWith('http')) return url;
    return `https://dastavval.com/storage/${url}`;
  };

  const adImg = ad.imageUrl ? getDisplayImageUrl(ad.imageUrl) : getAdFallbackImage(ad.title, ad.category);

  return (
    <div className="min-h-screen bg-slate-50 pb-20 text-right" dir="rtl">
      {/* Top Header/Navigation */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 py-3 flex items-center justify-between">
        <button 
          onClick={onBack}
          className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
        >
          <ChevronRight size={22} />
        </button>
        <h2 className="text-sm font-black text-slate-900 truncate max-w-[200px]">جزئیات آگهی: {ad.title}</h2>
        <button className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors">
          <Share2 size={18} />
        </button>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Main Content Card */}
        <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-200">
          {/* Image Section */}
          <div 
            className="w-full aspect-video sm:aspect-square md:aspect-video relative bg-slate-100 flex items-center justify-center cursor-zoom-in"
            onClick={() => setPreviewImage(adImg)}
          >
            <img 
              src={adImg} 
              alt={ad.title}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute top-4 right-4 flex flex-wrap items-center gap-2">
              {(ad.isSponsored || (ad as any).isSpecial || (ad as any).plan === 'vip') && (
                <span className="bg-emerald-600 text-white text-[10px] font-black px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 border border-emerald-400">
                  <Sparkles size={12} className="fill-white text-white" />
                  <span>ویژه 🌟</span>
                </span>
              )}
              <span className="bg-emerald-600 text-white text-[10px] font-black px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5">
                <Zap size={12} className="animate-pulse" />
                {ad.category === "liquid" ? "حراج مازاد خط تولید" : ad.category === "under_market" ? "کف قیمت بازار" : "تامین مستقیم"}
              </span>
            </div>
            <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-xl text-[10px] font-black text-slate-800 shadow-sm border border-slate-200">
              🔍 کلیک برای بزرگنمایی
            </div>
          </div>

          {/* Details Section */}
          <div className="p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold">
                  <Calendar size={12} />
                  <span>تاریخ ثبت: {ad.date}</span>
                </div>
                <h1 className="text-xl font-black text-slate-900 leading-tight">{ad.title}</h1>
                <div className="flex items-center gap-2 text-emerald-700 font-black">
                  <Building2 size={16} />
                  <span>{ad.factoryName}</span>
                </div>
              </div>

              <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 flex flex-col items-end gap-1 shrink-0">
                <span className="text-[10px] text-slate-500 font-bold">قیمت عمده پلتفرم:</span>
                <span className="text-2xl font-black text-emerald-700 font-mono">{ad.wholesalePrice} <span className="text-xs">تومان</span></span>
                <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold">
                  <span>قیمت بازار:</span>
                  <span className="line-through">{ad.marketPrice}</span>
                </div>
              </div>
            </div>

            {/* Advertiser Profile Card */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="relative shrink-0">
                  {ad.creatorAvatar ? (
                    <img
                      src={ad.creatorAvatar}
                      alt={ad.contactPerson || ad.creatorName || "آگهی‌دهنده"}
                      className="w-13 h-13 rounded-2xl object-cover border-2 border-emerald-500/30 shadow-sm"
                    />
                  ) : (
                    <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-emerald-500 text-white flex items-center justify-center text-xl font-black shadow-md border-2 border-white ring-2 ring-emerald-100">
                      <span>{ad.contactPerson ? ad.contactPerson.charAt(0) : "👔"}</span>
                    </div>
                  )}
                  <div className="absolute -bottom-1 -left-1 bg-amber-400 text-slate-950 w-5 h-5 rounded-full flex items-center justify-center text-[10px] shadow-sm border border-white font-black" title="تامین‌کننده برتر">
                    👑
                  </div>
                </div>

                <div className="space-y-0.5 text-right">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9.5px] text-emerald-700 font-black bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                      آگهی‌دهنده تاییدشده
                    </span>
                    <span className="text-slate-300">|</span>
                    <span className="text-[10px] text-slate-500 font-bold">پروفایل واقعی</span>
                  </div>
                  <h4 className="text-base font-black text-slate-900 leading-tight">
                    {ad.contactPerson || ad.creatorName || (ad as any).author || "مهندس رضایی (مدیر ارشد تامین)"}
                  </h4>
                  <p className="text-[11px] text-slate-500 font-bold flex items-center gap-1 mt-0.5">
                    <Building2 size={12} className="text-slate-400" />
                    <span>{ad.factoryName || "تامین‌کننده رسمی بازار دست‌اول"}</span>
                  </p>
                </div>
              </div>

              <div className="text-right sm:text-left shrink-0">
                <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200/80 px-3 py-1.5 rounded-xl text-[11px] font-black shadow-3xs">
                  <ShieldCheck size={14} className="text-emerald-600" />
                  <span>احراز هویت صنفی و تضمین اصالت</span>
                </span>
              </div>
            </div>

            {/* Metrics Row */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex flex-col items-center gap-1">
                <span className="text-[10px] text-slate-400 font-bold">موجودی کل</span>
                <span className="text-sm font-black text-slate-800">{ad.quantity}</span>
              </div>
              <div className="bg-amber-50 p-3 rounded-2xl border border-amber-100 flex flex-col items-center gap-1">
                <span className="text-[10px] text-amber-600 font-bold">سود خریدار</span>
                <span className="text-sm font-black text-amber-800">{ad.buyerProfit}</span>
              </div>
              <div className="bg-emerald-50 p-3 rounded-2xl border border-emerald-100 flex flex-col items-center gap-1 col-span-2 sm:col-span-1">
                <span className="text-[10px] text-emerald-600 font-bold">وضعیت معامله</span>
                <span className="text-xs font-black text-emerald-800">آماده معامله امن</span>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-3">
              <h3 className="font-black text-slate-900 flex items-center gap-2">
                <div className="w-1.5 h-4 bg-emerald-600 rounded-full" />
                توضیحات و شرایط فروش
              </h3>
              <p className="text-sm text-slate-600 font-medium leading-loose text-justify whitespace-pre-wrap">
                {ad.description}
              </p>
            </div>

            {/* Safety Warning */}
            <div className="bg-amber-50/50 border border-amber-200 p-4 rounded-2xl flex items-start gap-3">
              <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={20} />
              <div className="space-y-1">
                <h4 className="text-xs font-black text-amber-900">هشدار ایمنی معامله</h4>
                <p className="text-[10px] text-amber-800 font-bold leading-relaxed">
                  جهت جلوگیری از هرگونه کلاهبرداری یا تضییع حقوق، توصیه می‌شود معامله خود را از طریق درگاه "معامله امن دست‌اول" نهایی کنید. واریز وجه مستقیم به حساب آگهی‌دهنده قبل از دریافت کالا ریسک بالایی دارد.
                </p>
              </div>
            </div>
          </div>

          {/* Footer Actions - Material 3 High-Elevation Purchase Button */}
          <div className="p-5 sm:p-6 bg-white border-t border-slate-100 flex flex-col sm:flex-row items-center gap-4">
            <button 
              onClick={() => {
                setShowPurchaseForm(true);
                setPurchaseSuccess(false);
              }}
              className="flex-1 w-full h-14 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-2xl font-black text-sm transition-all duration-200 flex items-center justify-center gap-2.5 shadow-lg shadow-emerald-600/30 hover:shadow-xl hover:shadow-emerald-600/40 active:scale-[0.98] cursor-pointer border border-emerald-500/40 relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-white/15 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-white shrink-0">
                <ShoppingBag size={18} className="text-white animate-bounce" />
              </div>
              <span className="text-base font-black tracking-wide">درخواست خرید مستقیم و تماس</span>
              <ChevronRight size={18} className="rotate-180 opacity-80 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {previewImage && (
          <div 
            className="fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => setPreviewImage(null)}
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative max-w-5xl w-full aspect-square sm:aspect-video flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <img 
                src={previewImage} 
                alt="Full preview" 
                className="max-w-full max-h-full object-contain rounded-2xl"
              />
              <button 
                onClick={() => setPreviewImage(null)}
                className="absolute -top-12 right-0 w-10 h-10 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-colors"
              >
                <X size={24} />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Escrow Simple Form Overlay */}
      <AnimatePresence>
        {showEscrowForm && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm p-0 sm:p-4">
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-lg font-black text-slate-900">درخواست معامله امن</h3>
                <button onClick={() => setShowEscrowForm(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={24} />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-700">شماره موبایل شما جهت هماهنگی:</label>
                  <input 
                    type="tel" 
                    value={buyerPhone}
                    onChange={(e) => setBuyerPhone(e.target.value)}
                    placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-left font-mono outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 text-[10px] text-emerald-800 font-bold leading-relaxed">
                  با ثبت این درخواست، کارشناسان پلتفرم دست‌اول جهت احراز پلمپ و هماهنگی ارسال بار با شما تماس خواهند گرفت.
                </div>
                <button 
                  onClick={() => {
                    alert("درخواست شما با موفقیت ثبت شد. بزودی با شما تماس می‌گیریم.");
                    setShowEscrowForm(false);
                  }}
                  className="w-full py-4 bg-emerald-600 text-white rounded-xl font-black shadow-lg shadow-emerald-600/20"
                >
                  تایید و ثبت نهایی درخواست
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Ticket-based Purchase Request Modal */}
      <AnimatePresence>
        {showPurchaseForm && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm p-0 sm:p-4" dir="rtl">
            <motion.div 
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600">
                    <ShoppingBag size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900">ثبت درخواست خرید مستقیم</h3>
                    <p className="text-[10px] text-slate-400 font-bold mt-0.5">ارسال مستقیم تیکت به مدیریت و پیگیری فوری</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowPurchaseForm(false)} 
                  className="w-8 h-8 rounded-lg bg-slate-200/60 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-5">
                {purchaseSuccess ? (
                  <div className="py-8 text-center space-y-4">
                    <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-100">
                      <CheckCircle2 size={36} />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-lg font-black text-slate-900">درخواست شما با موفقیت ثبت شد</h4>
                      <p className="text-xs text-slate-500 font-bold">این درخواست به عنوان تیکت اولویت بالا برای مدیریت ارسال گردید.</p>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 max-w-xs mx-auto text-center space-y-1.5">
                      <span className="text-[10px] text-slate-400 font-bold">کد پیگیری تیکت خرید</span>
                      <span className="block text-lg font-black text-emerald-700 font-mono tracking-wider">{ticketTrackingCode}</span>
                    </div>

                    <p className="text-[11px] text-amber-700 font-bold bg-amber-50 p-3 rounded-xl border border-amber-100 max-w-sm mx-auto">
                      کارشناسان بخش بازرگانی و پشتیبانی دست‌اول به زودی جهت هماهنگی فاکتور و ترخیص کالا با شما تماس خواهند گرفت.
                    </p>

                    <button
                      onClick={() => setShowPurchaseForm(false)}
                      className="w-full max-w-xs py-3.5 bg-slate-900 text-white rounded-xl font-black text-sm hover:bg-slate-800 transition-colors"
                    >
                      بستن پنجره
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handlePurchaseRequestSubmit} className="space-y-4">
                    {/* Compact Product Card */}
                    <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 flex items-center gap-3">
                      <img 
                        src={adImg} 
                        alt={ad.title} 
                        className="w-12 h-12 rounded-xl object-cover border border-slate-200"
                        referrerPolicy="no-referrer"
                      />
                      <div className="space-y-1 text-right">
                        <span className="text-[10px] text-slate-400 font-bold block">{ad.factoryName}</span>
                        <h4 className="text-xs font-black text-slate-800 line-clamp-1">{ad.title}</h4>
                        <span className="text-[11px] text-emerald-600 font-black block">{ad.wholesalePrice} تومان</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Name */}
                      <div className="space-y-1 text-right">
                        <label className="text-xs font-black text-slate-700">نام و نام خانوادگی:</label>
                        <input 
                          type="text"
                          required
                          value={purchaseName}
                          onChange={(e) => setPurchaseName(e.target.value)}
                          placeholder="مثال: علیرضا محمدی"
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-right font-medium text-sm outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all"
                        />
                      </div>

                      {/* Phone */}
                      <div className="space-y-1 text-right">
                        <label className="text-xs font-black text-slate-700">شماره همراه تماس:</label>
                        <input 
                          type="tel"
                          required
                          value={purchasePhone}
                          onChange={(e) => setPurchasePhone(e.target.value)}
                          placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-left font-mono text-sm outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all"
                        />
                      </div>
                    </div>

                    {/* Quantity */}
                    <div className="space-y-1 text-right">
                      <label className="text-xs font-black text-slate-700">تعداد یا حجم خرید مورد نظر:</label>
                      <input 
                        type="text"
                        required
                        value={purchaseQuantity}
                        onChange={(e) => setPurchaseQuantity(e.target.value)}
                        placeholder="مثال: ۵۰۰ کارتن یا ۳ تن"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-right font-medium text-sm outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all"
                      />
                    </div>

                    {/* Message */}
                    <div className="space-y-1 text-right">
                      <label className="text-xs font-black text-slate-700">توضیحات تکمیلی یا پیام به مدیریت:</label>
                      <textarea 
                        value={purchaseMessage}
                        onChange={(e) => setPurchaseMessage(e.target.value)}
                        placeholder="در صورتی که شرایط خاصی نظیر نحوه پرداخت، محل تخلیه یا درخواست نمونه دارید، در این بخش ذکر فرمایید..."
                        rows={3}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-right font-medium text-xs leading-relaxed outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all resize-none"
                      />
                    </div>

                    <div className="bg-amber-50 p-3.5 rounded-2xl border border-amber-100 flex items-start gap-2.5">
                      <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={16} />
                      <p className="text-[10px] text-amber-800 font-bold leading-relaxed">
                        این درخواست بلافاصله به کارتابل پشتیبانی و تیکت‌های مدیریت کل ارسال می‌شود و تحت نظارت مستقیم ناظر پلتفرم دست‌اول جهت ایمنی کامل معامله نهایی خواهد شد.
                      </p>
                    </div>

                    <button 
                      type="submit"
                      disabled={isSubmittingPurchase}
                      className="w-full h-13 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl shadow-lg shadow-amber-500/10 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
                    >
                      {isSubmittingPurchase ? (
                        <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <Send size={16} />
                          <span>ثبت و ارسال درخواست خرید به مدیریت</span>
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdDetailView;
