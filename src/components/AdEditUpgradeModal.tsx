import React, { useState, useEffect } from "react";
import { 
  X, Edit3, Trash2, TrendingUp, Sparkles, Zap, Flame, ShieldCheck, 
  CheckCircle2, AlertTriangle, UploadCloud, RotateCw, Image as ImageIcon 
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { AdItem, getAdFallbackImage } from "../utils/ad-utils";
import { db } from "../lib/data-layer";
import { doc, updateDoc, deleteDoc } from "../lib/data-layer";
import { uploadToParsPackStorage } from "../utils/storage";

interface AdEditUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  ad: AdItem | null;
  mode: "edit" | "upgrade" | "delete";
  onAdUpdated: (updatedAd: AdItem) => void;
  onAdDeleted: (adId: string) => void;
  currentUser?: any;
}

export default function AdEditUpgradeModal({
  isOpen,
  onClose,
  ad,
  mode: initialMode,
  onAdUpdated,
  onAdDeleted,
  currentUser
}: AdEditUpgradeModalProps) {
  const [activeMode, setActiveMode] = useState<"edit" | "upgrade" | "delete">(initialMode);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Edit Form state
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<string>("under_market");
  const [wholesalePrice, setWholesalePrice] = useState("");
  const [marketPrice, setMarketPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [factoryName, setFactoryName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  // Upgrade state
  const [upgradeType, setUpgradeType] = useState<"ladder" | "vip" | "floor">("ladder");

  useEffect(() => {
    setActiveMode(initialMode);
  }, [initialMode, isOpen]);

  useEffect(() => {
    if (ad) {
      setTitle(ad.title || "");
      setCategory(ad.category || "under_market");
      setWholesalePrice(ad.wholesalePrice || "");
      setMarketPrice((ad as any).marketPrice || "");
      setQuantity((ad as any).quantity || "");
      setFactoryName(ad.factoryName || "");
      setContactPerson((ad as any).contactPerson || "");
      setContactPhone((ad as any).contactPhone || (ad as any).creatorPhone || "");
      setDescription(ad.description || "");
      setImageUrl(ad.imageUrl || "");
    }
  }, [ad]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  if (!isOpen || !ad) return null;

  // Handle Image Upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const res = await uploadToParsPackStorage(file, "ads");
      setImageUrl(res.url);
      showToast("تصویر با موفقیت بارگذاری شد.");
    } catch (err) {
      const objectUrl = URL.createObjectURL(file);
      setImageUrl(objectUrl);
      showToast("تصویر انتخاب گردید.");
    } finally {
      setIsUploading(false);
    }
  };

  // 1. Save Edited Ad
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !wholesalePrice.trim()) {
      alert("لطفاً عنوان آگهی و قیمت عمده را تکمیل فرمایید.");
      return;
    }

    setIsSubmitting(true);
    try {
      const updatedAd: AdItem = {
        ...ad,
        title: title.trim(),
        category: category as any,
        wholesalePrice: wholesalePrice.trim(),
        marketPrice: marketPrice.trim(),
        quantity: quantity.trim() || "توافقی",
        factoryName: factoryName.trim() || ad.factoryName,
        contactPerson: contactPerson.trim() || (ad as any).contactPerson,
        contactPhone: contactPhone.trim() || (ad as any).contactPhone,
        description: description.trim(),
        imageUrl: imageUrl || ad.imageUrl || getAdFallbackImage(title, category as any),
        date: "امروز (ویرایش‌شده)"
      };

      // Sync Firestore
      try {
        await updateDoc(doc(db, "ads", ad.id), updatedAd as any);
      } catch (err) {
        console.warn("Firestore edit update note:", err);
      }

      // Sync Local Storage
      syncAdToLocalStorage(updatedAd, false);

      onAdUpdated(updatedAd);
      showToast("آگهی با موفقیت ویرایش شد.");
      setTimeout(() => {
        onClose();
      }, 500);
    } catch (error) {
      console.error("Error updating ad:", error);
      alert("خطا در ذخیره تغییرات آگهی.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2. Perform Upgrade / Ladder
  const handleApplyUpgrade = async () => {
    setIsSubmitting(true);
    try {
      let updatedAd: AdItem = { ...ad };

      if (upgradeType === "ladder") {
        // Instant ladder: set date to right now & bump to top
        updatedAd = {
          ...updatedAd,
          date: "همین الان (نردبان شده)",
          ladderTimestamp: Date.now()
        };
      } else if (upgradeType === "vip") {
        // VIP / Sponsored ad
        updatedAd = {
          ...updatedAd,
          isSponsored: true,
          badgeText: "⭐ آگهی ویژه و فوری",
          sponsoredUntil: Date.now() + 30 * 24 * 60 * 60 * 1000
        };
      } else if (upgradeType === "floor") {
        // Floor Deal
        updatedAd = {
          ...updatedAd,
          category: "liquid",
          badgeText: "🔥 حراج داغ کف بازار",
          isFloorMarket: true
        };
      }

      // Sync Firestore
      try {
        await updateDoc(doc(db, "ads", ad.id), updatedAd as any);
      } catch (err) {
        console.warn("Firestore upgrade update note:", err);
      }

      // Sync Local Storage
      syncAdToLocalStorage(updatedAd, true);

      onAdUpdated(updatedAd);
      showToast("آگهی شما با موفقیت ارتقا یافت و در صدر قرار گرفت.");
      setTimeout(() => {
        onClose();
      }, 600);
    } catch (error) {
      console.error("Error upgrading ad:", error);
      alert("خطا در ارتقای آگهی.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. Confirm Delete
  const handleConfirmDelete = async () => {
    setIsSubmitting(true);
    try {
      try {
        await deleteDoc(doc(db, "ads", ad.id));
      } catch (err) {
        console.warn("Firestore delete ad note:", err);
      }

      // Remove from local storage arrays
      const storageKeys = [
        "dastavval_user_ads",
        "dastavval_user_ads_pool",
        "dastavval_sponsored_ads_v2",
        "dastavval_raw_materials",
        "dastavval_industrial_equipment"
      ];

      storageKeys.forEach((key) => {
        try {
          const items = JSON.parse(localStorage.getItem(key) || "[]");
          const filtered = items.filter((item: any) => item.id !== ad.id);
          localStorage.setItem(key, JSON.stringify(filtered));
        } catch (e) {}
      });

      onAdDeleted(ad.id);
      showToast("آگهی با موفقیت حذف گردید.");
      setTimeout(() => {
        onClose();
      }, 500);
    } catch (error) {
      console.error("Error deleting ad:", error);
      alert("خطا در حذف آگهی.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper to sync updated ad across all storage keys
  const syncAdToLocalStorage = (newAd: AdItem, bumpToTop: boolean) => {
    const storageKeys = ["dastavval_user_ads", "dastavval_user_ads_pool", "dastavval_sponsored_ads_v2"];

    storageKeys.forEach((key) => {
      try {
        const items = JSON.parse(localStorage.getItem(key) || "[]");
        let exists = false;
        let mapped = items.map((item: any) => {
          if (item.id === newAd.id) {
            exists = true;
            return newAd;
          }
          return item;
        });

        if (bumpToTop) {
          mapped = mapped.filter((item: any) => item.id !== newAd.id);
          mapped.unshift(newAd);
        } else if (!exists) {
          mapped.unshift(newAd);
        }

        localStorage.setItem(key, JSON.stringify(mapped));
      } catch (e) {}
    });
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto" dir="rtl">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden my-auto text-right"
      >
        {/* Header Tabs */}
        <div className="p-5 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveMode("edit")}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                activeMode === "edit"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "bg-white/10 text-white hover:bg-white/20"
              }`}
            >
              <Edit3 size={13} />
              <span>ویرایش آگهی</span>
            </button>
            <button
              onClick={() => setActiveMode("upgrade")}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                activeMode === "upgrade"
                  ? "bg-amber-400 text-slate-950 shadow-sm"
                  : "bg-white/10 text-white hover:bg-white/20"
              }`}
            >
              <TrendingUp size={13} />
              <span>ارتقا و نردبان</span>
            </button>
            <button
              onClick={() => setActiveMode("delete")}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                activeMode === "delete"
                  ? "bg-rose-500 text-white shadow-sm"
                  : "bg-white/10 text-rose-300 hover:bg-rose-500/20"
              }`}
            >
              <Trash2 size={13} />
              <span>حذف</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 max-h-[75vh] overflow-y-auto space-y-4">
          {/* 1. EDIT MODE */}
          {activeMode === "edit" && (
            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-150">
                <span className="text-xs font-black text-slate-800">
                  ویرایش اطلاعات و مشخصات آگهی:
                </span>
                <span className="text-[11px] font-mono text-slate-400">کد: {ad.id}</span>
              </div>

              {/* Title */}
              <div className="space-y-1">
                <label className="text-xs font-black text-slate-700 block">عنوان آگهی / کالا:</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  required
                />
              </div>

              {/* Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-700 block">بخش تالار:</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="under_market">📉 زیر قیمت بازار (کف بازار)</option>
                    <option value="liquid">🔥 حراج فوری و مازاد انبار</option>
                    <option value="direct_supply">📦 تامین مستقیم از کارخانه</option>
                    <option value="materials">🧪 مواد اولیه و ملزومات تولید</option>
                    <option value="equipment">⚙️ ماشین‌آلات و تجهیزات صنعتی</option>
                    <option value="services">🛠️ خدمات صنعتی و کارمزدی</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-700 block">حجم موجودی / تعداد:</label>
                  <input
                    type="text"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="مثال: ۵۰۰ کارتن / ۱۰ تن"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Pricing */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-700 block">قیمت عمده / کف بازار:</label>
                  <input
                    type="text"
                    value={wholesalePrice}
                    onChange={(e) => setWholesalePrice(e.target.value)}
                    placeholder="مثال: ۱۲۰,۰۰۰ تومان"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-emerald-700 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-700 block">قیمت روی جلد یا بازار آزاد:</label>
                  <input
                    type="text"
                    value={marketPrice}
                    onChange={(e) => setMarketPrice(e.target.value)}
                    placeholder="مثال: ۱۸۰,۰۰۰ تومان"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-700 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-xs font-black text-slate-700 block">توضیحات و شرایط فروش:</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              {/* Image Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-700 block">تصویر آگهی:</label>
                <div className="flex items-center gap-3">
                  {imageUrl && (
                    <div className="w-14 h-14 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 shrink-0">
                      <img src={imageUrl} alt="Ad Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <label className="flex-1 border-2 border-dashed border-slate-200 hover:border-emerald-400 rounded-xl p-3 text-center cursor-pointer transition-colors flex items-center justify-center gap-2 bg-slate-50 hover:bg-emerald-50/30">
                    <UploadCloud size={16} className="text-slate-400" />
                    <span className="text-xs font-bold text-slate-600">
                      {isUploading ? "در حال بارگذاری..." : "تغییر یا بارگذاری تصویر کالا"}
                    </span>
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </label>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3 rounded-xl text-xs transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {isSubmitting ? <RotateCw size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                  <span>ذخیره تغییرات آگهی</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  انصراف
                </button>
              </div>
            </form>
          )}

          {/* 2. UPGRADE MODE */}
          {activeMode === "upgrade" && (
            <div className="space-y-4">
              <div className="text-center space-y-1 pb-2 border-b border-slate-150">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
                  <TrendingUp size={24} />
                </div>
                <h4 className="text-sm font-black text-slate-900">
                  ارتقا و افزایش بازدید آگهی «{ad.title}»
                </h4>
                <p className="text-xs text-slate-500 font-medium">
                  با ارتقای آگهی، تماس‌ها و سفارشات خرید خود را تا ۱۰ برابر افزایش دهید.
                </p>
              </div>

              {/* Upgrade Options */}
              <div className="space-y-3">
                {/* Option 1: Instant Ladder */}
                <div
                  onClick={() => setUpgradeType("ladder")}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer text-right space-y-1.5 ${
                    upgradeType === "ladder"
                      ? "border-emerald-500 bg-emerald-50/50 shadow-sm"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Zap size={16} className="text-emerald-600" />
                      <span className="text-xs font-black text-slate-900">نردبان فوری (Instant Ladder)</span>
                    </div>
                    <span className="text-[11px] font-black text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                      رایگان / هدیه
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 font-medium">
                    آگهی شما با تاریخ همین الان در صدر تالار معاملات و بالاتر از همه آگهی‌های قدیمی قرار می‌گیرد.
                  </p>
                </div>

                {/* Option 2: VIP & Pin to Top */}
                <div
                  onClick={() => setUpgradeType("vip")}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer text-right space-y-1.5 ${
                    upgradeType === "vip"
                      ? "border-amber-500 bg-amber-50/50 shadow-sm"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles size={16} className="text-amber-600" />
                      <span className="text-xs font-black text-slate-900">آگهی ویژه و ستاره‌دار (VIP)</span>
                    </div>
                    <span className="text-[11px] font-black text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md">
                      نشان طلایی ویژه
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 font-medium">
                    کادر طلایی درخشان، نشان اختصاصی «⭐ آگهی ویژه» و سنجاق شدن در بنر بالای تالار به مدت ۳۰ روز.
                  </p>
                </div>

                {/* Option 3: Floor Market */}
                <div
                  onClick={() => setUpgradeType("floor")}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer text-right space-y-1.5 ${
                    upgradeType === "floor"
                      ? "border-rose-500 bg-rose-50/50 shadow-sm"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Flame size={16} className="text-rose-600" />
                      <span className="text-xs font-black text-slate-900">ورود به حراج آتشین کف بازار</span>
                    </div>
                    <span className="text-[11px] font-black text-rose-800 bg-rose-100 px-2 py-0.5 rounded-md">
                      📉 تخفیف طلایی
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 font-medium">
                    انتقال مستقیم به تب حراج و کف بازار با اولویت در استعلام عمده‌فروشان سراسر کشور.
                  </p>
                </div>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleApplyUpgrade}
                  disabled={isSubmitting}
                  className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black py-3 rounded-xl text-xs transition-all shadow-md shadow-orange-500/20 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {isSubmitting ? <RotateCw size={14} className="animate-spin" /> : <TrendingUp size={14} />}
                  <span>اعمال فوری ارتقا</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  انصراف
                </button>
              </div>
            </div>
          )}

          {/* 3. DELETE MODE */}
          {activeMode === "delete" && (
            <div className="space-y-4 text-center py-2">
              <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                <AlertTriangle size={28} />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-black text-slate-900">
                  آیا از حذف این آگهی اطمینان دارید؟
                </h4>
                <p className="text-xs text-slate-500 font-medium max-w-sm mx-auto leading-relaxed">
                  با حذف آگهی «{ad.title}»، این کالا از فهرست تالار معاملات و بانک آگهی‌ها به طور دائم حذف خواهد شد.
                </p>
              </div>

              <div className="pt-3 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={isSubmitting}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-black px-6 py-3 rounded-xl text-xs transition-all shadow-md shadow-rose-600/20 flex items-center gap-1.5 cursor-pointer"
                >
                  {isSubmitting ? <RotateCw size={14} className="animate-spin" /> : <Trash2 size={14} />}
                  <span>بله، حذف شود</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-5 py-3 rounded-xl text-xs transition-colors cursor-pointer"
                >
                  انصراف و بازگشت
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
