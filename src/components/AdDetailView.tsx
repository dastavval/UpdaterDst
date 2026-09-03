import React, { useState } from "react";
import { 
  ShieldCheck, Calendar, Building2, TrendingDown, 
  ChevronRight, Share2, AlertTriangle, Phone, 
  MessageCircle, Zap, Eye, X
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { AdItem, getAdFallbackImage } from "../utils/ad-utils";

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
            <div className="absolute top-4 right-4 flex flex-col gap-2">
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

          {/* Footer Actions */}
          <div className="p-6 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row gap-4">
            <button 
              onClick={() => setShowEscrowForm(true)}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white h-14 rounded-2xl font-black transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 active:scale-95"
            >
              <ShieldCheck size={20} />
              <span>شروع معامله امن و ثبت سفارش</span>
            </button>
            <button className="px-8 h-14 bg-white border border-slate-200 text-slate-700 rounded-2xl font-black hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
              <MessageCircle size={20} />
              <span>چت با فروشنده</span>
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
    </div>
  );
};

export default AdDetailView;
