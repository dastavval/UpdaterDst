import React, { useState } from "react";
import { 
  Plus, 
  CheckCircle, 
  AlertTriangle, 
  Package, 
  UploadCloud, 
  Lock, 
  Trash2, 
  Camera, 
  Sparkles, 
  AlertCircle,
  Eye,
  ArrowRight,
  TrendingDown,
  Clock,
  User,
  Phone,
  Building2,
  ChevronLeft
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { uploadToParsPackStorage } from "../utils/storage";
import { getAdFallbackImage, AdItem } from "../utils/ad-utils";

interface AddAdButtonProps {
  variant?: "desktop" | "mobile-fab" | "inline";
  className?: string;
  onAdAdded?: () => void;
}

export default function AddAdButton({ 
  variant = "desktop", 
  className = "", 
  onAdAdded 
}: AddAdButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false); // Debounce / prevent double-clicks

  // Form Fields
  const [category, setCategory] = useState<"under_market" | "liquid" | "direct_supply">("under_market");
  const [title, setTitle] = useState("");
  const [factoryName, setFactoryName] = useState("");
  const [wholesalePrice, setWholesalePrice] = useState("");
  const [marketPrice, setMarketPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [description, setDescription] = useState("");
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [isSpecialRequested, setIsSpecialRequested] = useState(false);
  const [specialMessage, setSpecialMessage] = useState("");
  const [phoneWarning, setPhoneWarning] = useState("");

  const detectAndScrubPhoneNumbers = (text: string) => {
    const phoneRegex = /(۰|0|۹|9)[۰-۹0-9]{9,10}/g;
    return text.replace(phoneRegex, "[تلفن مستقیم طبق قوانین حذف شد - معامله از طریق واسطه امن]");
  };

  // Pre-calculate values for preview
  const getPreparedAdData = () => {
    const cleanTitle = detectAndScrubPhoneNumbers(title || "نام محصول نمونه");
    const cleanDescription = detectAndScrubPhoneNumbers(description || "توضیحات و مشخصات فنی وارد نشده است.");

    const forbiddenBrands = ["چی‌توز", "مینو", "میهن", "تبرک", "یک‌ویک", "تبرک", "چی توز", "دامداران", "کاله"];
    let finalTitle = cleanTitle;
    let finalDesc = cleanDescription;
    
    forbiddenBrands.forEach(brand => {
      if (finalTitle.includes(brand) || finalDesc.includes(brand)) {
        finalTitle = finalTitle.replace(new RegExp(brand, "g"), "[برند تجاری طبق قوانین سانسور شد]");
        finalDesc = finalDesc.replace(new RegExp(brand, "g"), "[به منظور جلوگیری از آسیب به اعتبار نمایندگی‌های رسمی، نام برند تجاری حذف و با کلمه عمومی جایگزین گردید]");
      }
    });

    const numericWholesale = parseInt(wholesalePrice.replace(/[^0-9]/g, "")) || 0;
    const numericMarket = parseInt(marketPrice.replace(/[^0-9]/g, "")) || 0;
    const savings = numericMarket > numericWholesale ? numericMarket - numericWholesale : 0;
    const profitPercentage = numericMarket > 0 ? Math.round((savings / numericMarket) * 100) : 0;
    const calculatedProfitText = savings > 0 
      ? `${profitPercentage}٪ سود ناخالص (${savings.toLocaleString()} تومان اختلاف)` 
      : "برآورد سود بعد از استعلام نهایی";

    let finalBadge = "📦 تامین مستقیم";
    if (category === "under_market") finalBadge = "📉 زیر قیمت بازار";
    else if (category === "liquid") finalBadge = "🔥 حراج عمده";

    return {
      title: finalTitle,
      description: finalDesc,
      factoryName: factoryName || "متقاضی تامین مستقیم",
      contactPerson: contactPerson || "مدیریت مربوطه",
      contactPhone: contactPhone || "درج نشده",
      badgeText: finalBadge,
      category,
      quantity: quantity || "توافقی",
      wholesalePrice: wholesalePrice.includes("تومان") || wholesalePrice.includes("توافقی") || !wholesalePrice ? wholesalePrice : `${wholesalePrice} تومان`,
      marketPrice: marketPrice.includes("تومان") || marketPrice.includes("توافقی") || !marketPrice ? marketPrice : `${marketPrice} تومان`,
      buyerProfit: calculatedProfitText,
      imageUrl: uploadedImages[0] || getAdFallbackImage(finalTitle, category),
      imageUrls: uploadedImages,
    };
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !wholesalePrice || !marketPrice || !contactPhone) return;

    // Safety check / Debounce trigger
    if (isSubmitting) return;
    setIsSubmitting(true);

    // Add a slight delay to feel the "processing" and ensure debounce
    setTimeout(() => {
      const preparedData = getPreparedAdData();

      const newAd = {
        id: `ad-${Date.now()}`,
        title: preparedData.title,
        description: preparedData.description,
        factoryName: preparedData.factoryName,
        contactPerson: preparedData.contactPerson,
        contactPhone: preparedData.contactPhone,
        badgeText: preparedData.badgeText,
        category,
        quantity: preparedData.quantity,
        wholesalePrice: preparedData.wholesalePrice,
        marketPrice: preparedData.marketPrice,
        buyerProfit: preparedData.buyerProfit,
        isSponsored: false,
        date: new Date().toLocaleDateString("fa-IR"),
        imageUrl: preparedData.imageUrl,
        imageUrls: preparedData.imageUrls,
        status: "pending",
        specialRequest: isSpecialRequested,
        specialRequestMessage: isSpecialRequested ? specialMessage : undefined
      };

      // Load existing ads
      const savedAds = localStorage.getItem("dastavval_sponsored_ads_v2");
      let adsList: any[] = [];
      if (savedAds) {
        try {
          adsList = JSON.parse(savedAds);
        } catch (err) {
          adsList = [];
        }
      }

      const updated = [newAd, ...adsList];
      localStorage.setItem("dastavval_sponsored_ads_v2", JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent("dastavval_ads_updated"));

      setSubmitSuccess(true);
      setIsPreviewMode(false);
      
      if (onAdAdded) {
        onAdAdded();
      }

      // Allow new submission after some time or after modal close
      setTimeout(() => {
        setIsSubmitting(false);
        setSubmitSuccess(false);
        setIsOpen(false);
        // Reset form
        setTitle("");
        setDescription("");
        setFactoryName("");
        setContactPerson("");
        setContactPhone("");
        setQuantity("");
        setWholesalePrice("");
        setMarketPrice("");
        setUploadedImages([]);
        setIsSpecialRequested(false);
        setSpecialMessage("");
      }, 3500);
    }, 800);
  };

  const triggerUpload = () => {
    document.getElementById("unified-ad-upload")?.click();
  };

  const previewAd = getPreparedAdData();

  return (
    <>
      {/* Dynamic render based on variant */}
      {variant === "desktop" && (
        <button
          onClick={() => setIsOpen(true)}
          className={`px-5 py-2.5 bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-slate-950 hover:text-white rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer shadow-md shadow-amber-500/10 active:scale-[0.98] whitespace-nowrap min-w-fit ${className}`}
        >
          <Plus size={16} />
          <span>عرضه بار / ثبت فروش فوری</span>
        </button>
      )}

      {variant === "inline" && (
        <button
          onClick={() => setIsOpen(true)}
          className={`w-full py-3.5 px-4 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-slate-950 hover:text-slate-950 font-black rounded-2xl text-xs shadow-md shadow-amber-500/20 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer ${className}`}
        >
          <Plus size={16} />
          <span>ثبت آگهی جدید / عرضه بار در تالار</span>
        </button>
      )}

      {variant === "mobile-fab" && (
        <div className={`fixed bottom-24 left-5 z-[100] md:hidden ${className}`}>
          <button
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600 text-slate-950 font-black px-5 py-3.5 rounded-full shadow-lg shadow-amber-500/35 border border-amber-400 active:scale-95 transition-all text-xs"
          >
            <Plus size={18} />
            <span>ثبت عرضه بار</span>
          </button>
        </div>
      )}

      {/* Unified Form Modal */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-md overflow-y-auto" dir="rtl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white w-full max-w-xl rounded-[28px] border border-slate-100 p-6 sm:p-8 shadow-2xl relative text-right my-8 max-h-[90vh] overflow-y-auto"
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setIsPreviewMode(false);
                }}
                className="absolute top-5 left-5 w-9 h-9 bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800 rounded-full flex items-center justify-center transition-all cursor-pointer text-sm font-bold"
              >
                ✕
              </button>

              {submitSuccess ? (
                <div className="py-10 flex flex-col items-center text-center space-y-5">
                  <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center border border-emerald-100 shadow-md shadow-emerald-100/50 animate-bounce">
                    <CheckCircle size={40} />
                  </div>
                  <h4 className="font-black text-slate-900 text-base">درخواست شما با موفقیت ثبت گردید</h4>
                  <p className="text-xs text-slate-500 font-bold max-w-sm leading-relaxed">
                    اطلاعات با موفقیت ذخیره گردید و جهت تایید فنی در صف بررسی کارشناسان دست‌اول قرار گرفت. به محض تایید، آگهی شما فعال و قابل معامله امن خواهد شد.
                  </p>
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      setIsPreviewMode(false);
                    }}
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition-all cursor-pointer shadow-md"
                  >
                    بستن پنجره
                  </button>
                </div>
              ) : isPreviewMode ? (
                /* 🔍 QUICK PREVIEW STEP */
                <div className="space-y-6">
                  {/* Header Preview Title */}
                  <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                    <button
                      type="button"
                      onClick={() => setIsPreviewMode(false)}
                      className="p-1 bg-slate-50 text-slate-600 hover:bg-slate-100 rounded-xl transition-all ml-1"
                      title="برگشت به ویرایش فرم"
                    >
                      <ArrowRight size={20} />
                    </button>
                    <div>
                      <h4 className="font-black text-slate-900 text-base">پیش‌نمایش سریع آگهی قبل از انتشار</h4>
                      <p className="text-[10px] text-slate-400 font-bold mt-0.5">آگهی شما با این ظاهر شکیل و ایمن در بیلبورد تالار کف بازار نمایش داده خواهد شد</p>
                    </div>
                  </div>

                  {/* Aesthetic Replica Card of AdBoard */}
                  <div className="bg-slate-50 rounded-3xl p-4 sm:p-5 border border-slate-200/60 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 bg-amber-500 text-slate-950 text-[10px] font-black px-3 py-1.5 rounded-br-2xl shadow-sm">
                      {previewAd.badgeText}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 mt-4">
                      {/* Left: Product Image */}
                      <div className="w-full sm:w-32 h-32 rounded-2xl overflow-hidden border border-slate-200 shrink-0 bg-white relative">
                        <img 
                          src={previewAd.imageUrl} 
                          alt="Ad Preview" 
                          className="w-full h-full object-cover" 
                        />
                      </div>

                      {/* Right: Info */}
                      <div className="flex-1 space-y-3">
                        <div className="space-y-1">
                          <h5 className="font-black text-slate-900 text-sm leading-tight">{previewAd.title}</h5>
                          <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-bold">
                            <Building2 size={12} />
                            <span>تامین‌کننده: {previewAd.factoryName}</span>
                          </div>
                        </div>

                        {/* Prices block */}
                        <div className="grid grid-cols-2 gap-2 bg-white p-3 rounded-2xl border border-slate-100">
                          <div>
                            <span className="block text-[9px] text-slate-400 font-bold">قیمت عمده دست‌اول:</span>
                            <span className="text-xs font-black text-emerald-600">{previewAd.wholesalePrice || "توافقی"}</span>
                          </div>
                          <div>
                            <span className="block text-[9px] text-slate-400 font-bold">قیمت آزاد بازار:</span>
                            <span className="text-xs font-black text-slate-600 line-through decoration-rose-500/50">{previewAd.marketPrice || "توافقی"}</span>
                          </div>
                        </div>

                        {/* Buyer profit block */}
                        <div className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl text-[10px] font-black">
                          <TrendingDown size={14} />
                          <span>{previewAd.buyerProfit}</span>
                        </div>
                      </div>
                    </div>

                    {/* Technical details */}
                    <div className="mt-4 pt-3 border-t border-slate-200/50 space-y-2">
                      <div className="flex justify-between text-[10px] font-bold text-slate-500">
                        <span>📦 تناژ و میزان عرضه:</span>
                        <span className="text-slate-800 font-black">{previewAd.quantity}</span>
                      </div>
                      <p className="text-[10px] text-slate-600 leading-relaxed font-medium bg-white p-3 rounded-xl border border-slate-100">
                        {previewAd.description}
                      </p>
                    </div>

                    {/* Escrow protection indicator */}
                    <div className="mt-3 bg-indigo-50 border border-indigo-100/50 rounded-xl p-2.5 flex items-center gap-2 text-[9px] text-indigo-900 font-black">
                      <Lock size={12} className="text-indigo-600" />
                      <span>محافظت تحت صندوق امانی دست‌اول فعال است. اطلاعات تماس مستقیم مخفی می‌ماند.</span>
                    </div>
                  </div>

                  {/* Submission and Edit Buttons */}
                  <div className="flex gap-3 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={handleFormSubmit}
                      className={`flex-1 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black rounded-xl text-xs shadow-md shadow-emerald-600/10 cursor-pointer flex items-center justify-center gap-2 transition-all ${
                        isSubmitting ? "opacity-75 cursor-not-allowed" : "hover:scale-[1.01] active:scale-[0.99]"
                      }`}
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                          <span>در حال ثبت... لطفا منتظر بمانید</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle size={16} />
                          <span>تایید و ارسال نهایی برای ادمین</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsPreviewMode(false)}
                      className="px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer transition-all"
                    >
                      ویرایش مجدد اطلاعات
                    </button>
                  </div>
                </div>
              ) : (
                /* 📝 STANDARD FORM VIEW */
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!title || !wholesalePrice || !marketPrice || !contactPhone) return;
                    setIsPreviewMode(true); // Jump to preview step first
                  }} 
                  className="space-y-5 text-right"
                >
                  {/* Header Title */}
                  <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                    <div className="w-10 h-10 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                      <Package size={20} />
                    </div>
                    <div>
                      <h4 className="font-black text-slate-900 text-base">درج محصول جدید در تالار کف بازار</h4>
                      <p className="text-[10px] text-slate-400 font-bold mt-0.5">معرفی مستقیم کالا و فرصت‌های خرید زیر قیمت بازار به صنایع سراسر کشور</p>
                    </div>
                  </div>

                  {/* Informative Guidance */}
                  <div className="bg-gradient-to-r from-indigo-50/70 to-blue-50/70 border border-indigo-100/60 rounded-2xl p-4 flex gap-3 text-[11px] text-indigo-950 font-medium leading-relaxed shadow-xs">
                    <AlertTriangle className="text-indigo-600 shrink-0 mt-0.5" size={16} />
                    <div>
                      <span className="font-black block text-indigo-900 mb-0.5">امنیت و واسطه‌گری امین دست‌اول:</span>
                      کلیه هماهنگی‌های مالی، آنالیزهای فنی بار و عقد قراردادهای رسمی جهت محافظت از خریدار و فروشنده، به صورت مستقیم و امن توسط مدیریت واسطه‌گری پلتفرم دست‌اول صورت می‌پذیرد.
                    </div>
                  </div>

                  {/* Category Selection */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[11px] font-black text-slate-500 mb-2">نوع پیشنهاد محصول زیر قیمت بازار:</label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        <button
                          type="button"
                          onClick={() => setCategory("under_market")}
                          className={`p-3 rounded-2xl border text-right transition-all cursor-pointer relative flex flex-col justify-between ${
                            category === "under_market"
                              ? "bg-emerald-50/80 border-emerald-500 ring-2 ring-emerald-500/20 shadow-sm"
                              : "bg-slate-50 hover:bg-slate-100 border-slate-200"
                          }`}
                        >
                          <div className="flex justify-between items-center w-full">
                            <span className="text-xs font-black text-slate-800 font-sans">📉 زیر قیمت بازار</span>
                            <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${category === "under_market" ? "border-emerald-600" : "border-slate-300"}`}>
                              {category === "under_market" && <div className="w-1.5 h-1.5 rounded-full bg-emerald-600" />}
                            </div>
                          </div>
                          <p className="text-[9px] text-slate-500 font-bold mt-1.5 leading-tight">
                            کالای مصرفی و عمده زیر قیمت بنکداری
                          </p>
                        </button>

                        <button
                          type="button"
                          onClick={() => setCategory("liquid")}
                          className={`p-3 rounded-2xl border text-right transition-all cursor-pointer relative flex flex-col justify-between ${
                            category === "liquid"
                              ? "bg-amber-50/80 border-amber-500 ring-2 ring-amber-500/20 shadow-sm"
                              : "bg-slate-50 hover:bg-slate-100 border-slate-200"
                          }`}
                        >
                          <div className="flex justify-between items-center w-full">
                            <span className="text-xs font-black text-slate-800 font-sans">🔥 حراج و مازاد</span>
                            <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${category === "liquid" ? "border-amber-600" : "border-slate-300"}`}>
                              {category === "liquid" && <div className="w-1.5 h-1.5 rounded-full bg-amber-600" />}
                            </div>
                          </div>
                          <p className="text-[9px] text-slate-500 font-bold mt-1.5 leading-tight">
                            حراج فوری بار مازاد خط تولید کارخانه
                          </p>
                        </button>

                        <button
                          type="button"
                          onClick={() => setCategory("direct_supply")}
                          className={`p-3 rounded-2xl border text-right transition-all cursor-pointer relative flex flex-col justify-between ${
                            category === "direct_supply"
                              ? "bg-blue-50/80 border-blue-500 ring-2 ring-blue-500/20 shadow-sm"
                              : "bg-slate-50 hover:bg-slate-100 border-slate-200"
                          }`}
                        >
                          <div className="flex justify-between items-center w-full">
                            <span className="text-xs font-black text-slate-800 font-sans">📦 تامین مستقیم</span>
                            <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${category === "direct_supply" ? "border-blue-600" : "border-slate-300"}`}>
                              {category === "direct_supply" && <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />}
                            </div>
                          </div>
                          <p className="text-[9px] text-slate-500 font-bold mt-1.5 leading-tight">
                            تامین مستقیم از انبار درب کارخانه
                          </p>
                        </button>
                      </div>
                    </div>

                    {/* Product Title */}
                    <div>
                      <label className="block text-[11px] font-black text-slate-500 mb-1.5">
                        نام محصول یا کالای زیر قیمت بازار (بدون افشای مستقیم برند):
                      </label>
                      <input
                        type="text"
                        required
                        value={title}
                        onChange={(e) => {
                          setTitle(e.target.value);
                          if (/(۰|0|۹|9)[۰-۹0-9]{9,10}/.test(e.target.value)) {
                            setPhoneWarning("درج شماره تماس مستقیم در فیلد عنوان ممنوع است. هماهنگی‌ها بصورت امن و واسطه‌ای صورت می‌گیرد.");
                          } else {
                            setPhoneWarning("");
                          }
                        }}
                        placeholder="مثال: ۵۰۰ کارتن تن ماهی ۱۸۰ گرمی یا ۵۰ تن شکر ۵ کیلویی"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-3 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-indigo-600 transition-colors"
                      />
                      {phoneWarning && <span className="text-[10px] text-rose-500 font-bold block mt-1">{phoneWarning}</span>}
                    </div>

                    {/* Brand / Factory */}
                    <div>
                      <label className="block text-[11px] font-black text-slate-500 mb-1.5">
                        برند یا کارخانه تولیدکننده (اختیاری):
                      </label>
                      <input
                        type="text"
                        value={factoryName}
                        onChange={(e) => setFactoryName(e.target.value)}
                        placeholder="مثال: کارخانه کشت و صنعت دهخدا یا برند معتبر ایرانی"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-3 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-indigo-600 transition-colors"
                      />
                    </div>

                    {/* Pricing Group */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-black text-slate-500 mb-1.5">
                          قیمت زیر قیمت بازار (تومان):
                        </label>
                        <input
                          type="text"
                          required
                          value={wholesalePrice}
                          onChange={(e) => setWholesalePrice(e.target.value)}
                          placeholder="مثال: ۴۲,۰۰۰ تومان"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-3 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-indigo-600"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-black text-slate-500 mb-1.5">
                          قیمت معمول در بازار آزاد (تومان):
                        </label>
                        <input
                          type="text"
                          required
                          value={marketPrice}
                          onChange={(e) => setMarketPrice(e.target.value)}
                          placeholder="مثال: ۶۵,۰۰۰ تومان"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-3 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-indigo-600"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-black text-slate-500 mb-1.5">
                          میزان بار / تناژ عرضه شده:
                        </label>
                        <input
                          type="text"
                          required
                          value={quantity}
                          onChange={(e) => setQuantity(e.target.value)}
                          placeholder="مثال: ۲۰ تن"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-3 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-indigo-600"
                        />
                      </div>
                    </div>

                    {/* Contact Info Group */}
                    <div className="grid grid-cols-2 gap-3 bg-indigo-50/30 p-4 rounded-2xl border border-indigo-100/20">
                      <div className="col-span-2 flex items-center gap-1.5 text-indigo-900 text-[10px] font-black mb-1">
                        <Lock size={12} className="text-indigo-600" />
                        <span>اطلاعات هماهنگی کارشناسی (محفوظ نزد ادمین جهت معامله امن واسطه‌ای):</span>
                      </div>
                      <div>
                        <label className="block text-[9px] font-black text-slate-500 mb-1">نام و نام خانوادگی:</label>
                        <input
                          type="text"
                          required
                          value={contactPerson}
                          onChange={(e) => setContactPerson(e.target.value)}
                          placeholder="مثال: مهندس رضوانی"
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-black text-slate-500 mb-1">شماره تماس (محفوظ و مخفی):</label>
                        <input
                          type="tel"
                          required
                          value={contactPhone}
                          onChange={(e) => setContactPhone(e.target.value)}
                          placeholder="مثال: ۰۹۱۲۳۴۵۶۷۸۹"
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 outline-none font-mono text-left"
                        />
                      </div>
                    </div>

                    {/* Multi Image Upload */}
                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="block text-[11px] font-black text-slate-500">
                          تصاویر محصول، اسناد آنالیز فنی یا کاتالوگ خدمات (آپلود چندگانه):
                        </label>
                        <span className="text-[9px] font-black bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                          {uploadedImages.length} از ۵ تصویر آپلود شده
                        </span>
                      </div>
                      
                      {uploadedImages.length > 0 ? (
                        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5 p-3 bg-slate-50 rounded-2xl border border-slate-200">
                          {uploadedImages.map((imgUrl, idx) => (
                            <div key={`add-ad-img-${imgUrl.slice(-10)}-${idx}`} className="relative group aspect-square rounded-xl overflow-hidden border border-slate-300 bg-white shadow-xs">
                              <img src={imgUrl} alt={`preview-${idx}`} className="w-full h-full object-cover" />
                              <button
                                type="button"
                                onClick={() => setUploadedImages(prev => prev.filter((_, i) => i !== idx))}
                                className="absolute top-1 left-1 bg-rose-600 hover:bg-rose-700 text-white p-1 rounded-full transition-colors cursor-pointer shadow-sm"
                              >
                                <Trash2 size={11} />
                              </button>
                            </div>
                          ))}
                          {uploadedImages.length < 5 && (
                            <label className="border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center text-slate-500 hover:bg-slate-100 hover:border-indigo-400 cursor-pointer aspect-square transition-all">
                              <Camera size={20} className="text-slate-400 animate-pulse" />
                              <span className="text-[9px] font-black mt-1">افزودن عکس</span>
                              <input
                                type="file"
                                accept="image/*"
                                multiple
                                className="hidden"
                                onChange={async (e) => {
                                  if (e.target.files) {
                                    setIsUploading(true);
                                    const files = Array.from(e.target.files);
                                    for (const file of files) {
                                      if (uploadedImages.length >= 5) break;
                                      const result = await uploadToParsPackStorage(file, "ads");
                                      if (result.success && result.url) {
                                        setUploadedImages((prev) => [...prev, result.url!]);
                                      } else {
                                        const reader = new FileReader();
                                        reader.onloadend = () => {
                                          setUploadedImages((prev) => [...prev, reader.result as string]);
                                        };
                                        reader.readAsDataURL(file);
                                      }
                                    }
                                    setIsUploading(false);
                                  }
                                }}
                              />
                            </label>
                          )}
                        </div>
                      ) : (
                        <div
                          onDragOver={(e) => {
                            e.preventDefault();
                            setIsDraggingImage(true);
                          }}
                          onDragLeave={() => setIsDraggingImage(false)}
                          onDrop={(e) => {
                            e.preventDefault();
                            setIsDraggingImage(false);
                            if (e.dataTransfer.files) {
                              Array.from(e.dataTransfer.files).forEach((file) => {
                                if (file.type.startsWith("image/")) {
                                  const reader = new FileReader();
                                  reader.onloadend = () => {
                                    setUploadedImages((prev) => [...prev, reader.result as string]);
                                  };
                                  reader.readAsDataURL(file);
                                }
                              });
                            }
                          }}
                          className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                            isDraggingImage
                              ? "border-indigo-500 bg-indigo-50/50"
                              : "border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-indigo-400"
                          }`}
                          onClick={triggerUpload}
                        >
                          <input
                            id="unified-ad-upload"
                            type="file"
                            accept="image/*"
                            multiple
                            className="hidden"
                            onChange={async (e) => {
                              if (e.target.files) {
                                setIsUploading(true);
                                const files = Array.from(e.target.files);
                                for (const file of files) {
                                  if (uploadedImages.length >= 5) break;
                                  const result = await uploadToParsPackStorage(file, "ads");
                                  if (result.success && result.url) {
                                    setUploadedImages((prev) => [...prev, result.url!]);
                                  } else {
                                    const reader = new FileReader();
                                    reader.onloadend = () => {
                                      setUploadedImages((prev) => [...prev, reader.result as string]);
                                    };
                                    reader.readAsDataURL(file);
                                  }
                                }
                                setIsUploading(false);
                              }
                            }}
                          />
                          {isUploading ? (
                            <div className="flex flex-col items-center justify-center space-y-2">
                              <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto"></div>
                              <span className="text-[10px] font-black text-indigo-600">در حال آپلود...</span>
                            </div>
                          ) : (
                            <>
                              <UploadCloud className="text-indigo-600 mx-auto" size={28} />
                              <span className="text-xs font-black text-slate-800 block mt-2">
                                کشیدن و رها کردن تصاویر نمونه کالا یا اسناد آنالیز
                              </span>
                              <span className="text-[10px] text-slate-400 block mt-1">
                                یا جهت انتخاب مستقیم از گالری کلیک کنید (قابلیت انتخاب همزمان چند فایل)
                              </span>
                            </>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-[11px] font-black text-slate-500 mb-1.5">
                        مشخصات فنی بار، آنالیز شیمیایی و فیزیکی، نحوه تسویه:
                      </label>
                      <textarea
                        required
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={3}
                        placeholder="مثال: محصول با گرید آزمایشگاهی استاندارد و مدارک COA معتبر، حداقل خرید ۵ تن، تحویل روی جک خریدار در محل کارخانه..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-indigo-600 resize-none transition-colors"
                      />
                    </div>

                    {/* Special Escrow Brokerage Checkbox */}
                    <div className="bg-amber-50/40 border border-amber-100/60 rounded-2xl p-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="checkbox"
                          checked={isSpecialRequested}
                          onChange={(e) => setIsSpecialRequested(e.target.checked)}
                          className="w-4 h-4 rounded accent-amber-600 cursor-pointer"
                        />
                        <span className="text-[10px] font-black text-amber-900">درخواست مشاوره و نظارت کارگزار اختصاصی معامله (عقد قرارداد امن)</span>
                      </label>
                      {isSpecialRequested && (
                        <div className="mt-2.5 space-y-1">
                          <label className="block text-[9px] font-black text-amber-800">توضیحات تکمیلی یا درخواست خاص از سرپرستی پلتفرم:</label>
                          <textarea
                            value={specialMessage}
                            onChange={(e) => setSpecialMessage(e.target.value)}
                            rows={2}
                            placeholder="مثال: نیاز مبرم به تست کیفیت در آزمایشگاه معتمد قبل از بارگیری..."
                            className="w-full bg-white border border-amber-200/50 rounded-xl p-2.5 text-xs font-semibold text-amber-900 outline-none focus:border-amber-400"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Submit and Cancel Buttons */}
                  <div className="flex gap-3 pt-3 border-t border-slate-100">
                    <button
                      type="submit"
                      className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white font-black rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.01] active:scale-[0.99] transition-all"
                    >
                      <Eye size={16} />
                      <span>مشاهده پیش‌نمایش آگهی</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsOpen(false);
                        setIsPreviewMode(false);
                      }}
                      className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl text-xs cursor-pointer transition-all"
                    >
                      انصراف
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

