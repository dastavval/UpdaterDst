import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  X, Package, ShieldCheck, Truck, Info, FileText, CheckCircle2, 
  Plus, Minus, Building, Phone, User as UserIcon, MapPin, UploadCloud, 
  AlertCircle, ArrowRight, ArrowLeft, Check, Sparkles, Scale, BadgeAlert,
  Star, MessageSquare, ShoppingCart, Lock
} from "lucide-react";
import type { Product, User } from "../types";
import { getDisplayImageUrl } from "../lib/image-utils";
import ProductReviews from "./ProductReviews";
import StarRating from "./StarRating";
import { ExpandableText } from "./ExpandableText";
import { HealthAppleLogo, HealthBadgesStrip, HealthCertModal } from "./HealthAppleBadge";
import { getProductRolePricing, toPersianDigits } from "../lib/pricing";

interface ProductDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  userBadge?: 'bronze' | 'silver' | 'gold' | 'vip' | 'admin';
  user?: User | null;
  onAddToCart: (product: Product, quantityCartons: number) => void;
  onOrderSuccess: (trackingNumber: string, amount: number) => void;
}

export default function ProductDetailModal({ 
  isOpen, 
  onClose, 
  product, 
  userBadge = 'bronze', 
  user,
  onAddToCart,
  onOrderSuccess
}: ProductDetailModalProps) {
  const [step, setStep] = useState(1);
  const [activeView, setActiveView] = useState<'order' | 'reviews'>('order');
  const initialMinCartons = Math.max(5, product?.min_order_cartons || 5);
  const [cartons, setCartons] = useState(initialMinCartons);
  const [unitType, setUnitType] = useState<'carton' | 'kg' | 'ton' | 'pack'>('carton');
  const [detailImgError, setDetailImgError] = useState(false);
  
  // Form fields with intelligent initial auto-fill
  const [buyerName, setBuyerName] = useState(() => user?.name || "");
  const [buyerPhone, setBuyerPhone] = useState(() => user?.mobile || user?.phone || "");
  const [buyerCompany, setBuyerCompany] = useState(() => user?.company || "");
  const [buyerAddress, setBuyerAddress] = useState(() => user?.address || "");
  const [transportType, setTransportType] = useState("road_truck"); // road_truck, local_cargo, heavy_trailer

  // Reset/sync state whenever active product changes
  useEffect(() => {
    if (product) {
      const pMin = Math.max(5, product.min_order_cartons || 5);
      setCartons(pMin);
      setStep(1);
      setActiveView('order');
      setDetailImgError(false);
      setErrors({});
    }
  }, [product?.id, isOpen]);

  // Auto-fill from user prop or saved localStorage info
  useEffect(() => {
    let saved: any = {};
    try {
      const stored = localStorage.getItem('dast1_saved_delivery_info');
      if (stored) saved = JSON.parse(stored);
    } catch (e) {
      // ignore
    }

    if (user?.name) setBuyerName(user.name);
    else if (!buyerName && saved.name) setBuyerName(saved.name);

    if (user?.mobile || user?.phone) setBuyerPhone(user.mobile || user.phone || "");
    else if (!buyerPhone && saved.phone) setBuyerPhone(saved.phone);

    if (user?.company) setBuyerCompany(user.company);
    else if (!buyerCompany && saved.company) setBuyerCompany(saved.company);

    if (user?.address) setBuyerAddress(user.address);
    else if (!buyerAddress && saved.address) setBuyerAddress(saved.address);
  }, [user, isOpen]);

  // Persist delivery fields when user edits
  useEffect(() => {
    if (buyerName || buyerPhone || buyerAddress) {
      try {
        localStorage.setItem('dast1_saved_delivery_info', JSON.stringify({
          name: buyerName,
          phone: buyerPhone,
          company: buyerCompany,
          address: buyerAddress
        }));
      } catch (e) {
        // ignore
      }
    }
  }, [buyerName, buyerPhone, buyerCompany, buyerAddress]);
  
  // Document uploading state
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  const toPersianNum = (num: number | string) => {
    if (num === undefined || num === null) return "";
    const persian = {
      "0": "۰", "1": "۱", "2": "۲", "3": "۳", "4": "۴", "5": "۵", "6": "۶", "7": "۷", "8": "۸", "9": "۹"
    };
    return num.toString().replace(/[0-9]/g, (w) => (persian as any)[w]);
  };

  const toEnglishNum = (str: string): string => {
    const persian = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
    const arabic = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
    let out = str;
    for (let i = 0; i < 10; i++) {
      out = out.replace(new RegExp(persian[i], "g"), i.toString());
      out = out.replace(new RegExp(arabic[i], "g"), i.toString());
    }
    return out;
  };

  const getDiscountPercent = (badge?: string) => {
    switch (badge) {
      case 'silver': return 2;
      case 'gold': return 5;
      case 'vip': return 8;
      case 'admin': return 10;
      default: return 0;
    }
  };

  const minCartons = Math.max(5, product?.min_order_cartons || 5);
  const packCount = product?.carton_pack_count || 1;
  const rolePricing = product ? getProductRolePricing(product, user, userBadge) : null;
  const bulkPrice = rolePricing ? rolePricing.unitWholesalePrice : (product?.bulk_price || 0);

  const getVolumeDiscountPercent = (c: number) => {
    if (c >= 50) return 8; // Pallet volume tier
    if (c >= 20) return 5; // Medium wholesale tier
    if (c >= 10) return 3; // Light wholesale tier
    return 0;
  };

  const volumeDiscountPercent = getVolumeDiscountPercent(cartons);
  const effectiveBulkPrice = volumeDiscountPercent > 0
    ? Math.round(bulkPrice * (1 - volumeDiscountPercent / 100))
    : bulkPrice;

  const pricePerCarton = effectiveBulkPrice * packCount;
  const totalOrderPrice = pricePerCarton * cartons;
  const originalTotalPrice = (rolePricing ? rolePricing.unitWholesalePrice : bulkPrice) * packCount * cartons;
  const discountSavings = originalTotalPrice - totalOrderPrice;

  const consumerPrice = product?.consumer_price || product?.price || (bulkPrice * 1.3);
  const totalConsumerValue = consumerPrice * packCount * cartons;
  const totalNetProfit = Math.max(0, totalConsumerValue - totalOrderPrice);
  // B2B Markup Return on Cost: (Consumer Total - Order Cost) / Order Cost
  const profitMarginPercent = totalOrderPrice > 0 
    ? Math.round((totalNetProfit / totalOrderPrice) * 100) 
    : 0;

  // Approximate weight calculation
  // Let's assume each pack has an average weight of 250 grams
  const packWeightKg = 0.25; 
  const totalPacks = cartons * packCount;
  const totalWeightKg = Math.round(totalPacks * packWeightKg);
  const totalWeightTons = (totalWeightKg / 1000).toFixed(2);

  const handleIncrement = () => {
    setCartons(prev => prev + 1);
  };

  const handleDecrement = () => {
    setCartons(prev => Math.max(minCartons, prev - 1));
  };

  // Convert unit input to equivalent cartons
  const handleUnitQuantityChange = (val: number, unit: typeof unitType) => {
    if (isNaN(val) || val <= 0 || !product) return;
    let computedCartons = minCartons;
    
    if (unit === 'carton') {
      computedCartons = val;
    } else if (unit === 'pack') {
      computedCartons = Math.ceil(val / packCount);
    } else if (unit === 'kg') {
      const computedPacks = val / packWeightKg;
      computedCartons = Math.ceil(computedPacks / packCount);
    } else if (unit === 'ton') {
      const computedKg = val * 1000;
      const computedPacks = computedKg / packWeightKg;
      computedCartons = Math.ceil(computedPacks / packCount);
    }

    setCartons(Math.max(minCartons, computedCartons));
  };

  // Client side validation
  const validateStep2 = () => {
    const errs: Record<string, string> = {};
    if (!buyerName.trim()) {
      errs.buyerName = "نام و نام خانوادگی رابط الزامی است.";
    }
    
    const phoneRegex = /^09\d{9}$/;
    if (!buyerPhone.trim()) {
      errs.buyerPhone = "تلفن همراه همراه الزامی است.";
    } else if (!phoneRegex.test(buyerPhone)) {
      errs.buyerPhone = "فرمت شماره موبایل نامعتبر است (مثال: 09123456789).";
    }

    if (!buyerCompany.trim()) {
      errs.buyerCompany = "نام فروشگاه / شرکت بنکداری الزامی است.";
    }

    if (!buyerAddress.trim() || buyerAddress.length < 10) {
      errs.buyerAddress = "آدرس دقیق تخلیه بار الزامی است (حداقل ۱۰ کاراکتر).";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNextStep = () => {
    if (step === 1) {
      setStep(2);
    } else if (step === 2) {
      if (validateStep2()) {
        setStep(3);
      }
    } else if (step === 3) {
      setStep(4);
    }
  };

  const handlePrevStep = () => {
    setStep(prev => Math.max(1, prev - 1));
  };

  // Simulation upload handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      setIsUploading(true);
      setUploadProgress(0);

      const interval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setIsUploading(false);
            return 100;
          }
          return prev + 10;
        });
      }, 100);
    }
  };

  const handleOrderSubmit = () => {
    if (!product) return;
    // Generate simulated tracking number
    const randTrack = `TRK-${Math.floor(10000 + Math.random() * 90000)}`;
    onAddToCart(product, cartons);
    onOrderSuccess(randTrack, totalOrderPrice);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && product && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 text-right" dir="rtl">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-white/70 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 30 }}
            className="relative w-full max-w-4xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row h-[90vh] md:h-auto max-h-[92vh] border border-gray-100"
          >
            {/* Close Button */}
            <button 
              onClick={onClose}
              className="absolute top-4 left-4 p-2.5 bg-slate-50 text-slate-500 border border-slate-200 hover:bg-white rounded-full transition-all z-20 cursor-pointer shadow-sm"
            >
              <X size={16} />
            </button>

            {/* LEFT HALF: Product Details Display Panel */}
            <div className="w-full md:w-[42%] bg-white p-6 flex flex-col justify-between border-l border-gray-100 overflow-y-auto max-h-[40vh] md:max-h-[92vh]">
              <div className="space-y-6">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100/50">
                      {product.category}
                    </span>
                    {product.badge && (
                      <span className="bg-indigo-600 text-white text-[8px] px-2 py-1 rounded-lg uppercase font-black shadow-sm">{product.badge}</span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {product.isFavorite && <Sparkles size={16} className="text-amber-500" />}
                    {product.brandLogoUrl && (
                      <div className="bg-white p-1 rounded-lg border border-slate-200 shadow-2xs inline-flex items-center justify-center">
                        <img 
                          src={product.brandLogoUrl} 
                          alt={product.brand} 
                          className="h-6 object-contain clean-logo-filter"
                          referrerPolicy="no-referrer"
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Product Main Display Image - Clean Floating Single Frame */}
                <div className="aspect-square w-full bg-white rounded-3xl overflow-hidden flex items-center justify-center border border-slate-100 shadow-material-sm relative group">
                  {detailImgError || !product.image_url ? (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-1.5 text-slate-400 p-4">
                      <Package size={42} className="text-slate-200 stroke-[1]" />
                      <span className="text-xs font-black text-slate-400">بدون تصویر رسمی</span>
                    </div>
                  ) : (
                    <>
                      <div className="absolute inset-x-8 bottom-6 h-6 bg-slate-100/50 blur-2xl rounded-full transition-all group-hover:bg-emerald-500/10" />
                      <img 
                        src={getDisplayImageUrl(product.image_url)} 
                        alt={product.name}
                        className="w-full h-full object-contain p-1.5 group-hover:scale-[1.03] transition-all duration-500 relative z-10"
                        referrerPolicy="no-referrer"
                        onError={() => setDetailImgError(true)}
                      />
                    </>
                  )}
                  {product.isFeatured && (
                    <span className="absolute top-3 left-3 bg-amber-500 text-white px-2 py-0.5 rounded-lg text-[8px] font-black flex items-center gap-1 shadow-md z-20">
                      <Sparkles size={10} />
                      منتخب
                    </span>
                  )}
                </div>

                <div className="space-y-3">
                  <h3 className="text-base font-black text-slate-900 leading-tight">
                    {product.name}
                  </h3>
                  <div className="flex items-center justify-between bg-white px-3.5 py-2 rounded-2xl border border-slate-100 shadow-2xs">
                    <span className="text-[10px] font-black text-slate-500">امتیاز کیفی و رضایت:</span>
                    <StarRating 
                      rating={product.rating || 5} 
                      size={14} 
                      interactive={true} 
                      showCount={true} 
                      count={(product as any).ratingCount || 24} 
                      onRate={() => setActiveView('reviews')}
                    />
                  </div>
                  <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-2xs">
                    <ExpandableText text={product.description || ""} maxChars={120} scrollableIfLong={true} />
                  </div>
                </div>

                {/* B2B Pricing Metrics Block */}
                <div className="grid grid-cols-2 gap-3 p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 block">قیمت مصرف‌کننده:</span>
                    <span className="text-xs font-black text-slate-700">
                      {toPersianNum((product.consumer_price || 0).toLocaleString())} تومان
                    </span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 block">تعداد در کارتن:</span>
                    <span className="text-xs font-black text-slate-700">
                      {toPersianNum(product.carton_pack_count)} عدد
                    </span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 block">حاشیه سود بنکدار:</span>
                    <span className="text-xs font-black text-emerald-600">
                      {toPersianNum((((product.consumer_price || 0) - (product.bulk_price || 0)) / (product.consumer_price || 1) * 100).toFixed(1))}٪ سود
                    </span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 block">قیمت هر کارتن:</span>
                    <span className="text-xs font-black text-indigo-600">
                      {toPersianNum((product.bulk_price * product.carton_pack_count).toLocaleString())} تومان
                    </span>
                  </div>
                </div>

                {/* Health & FDA Certification Passport Block */}
                <div className="bg-gradient-to-br from-emerald-50 via-teal-50 to-white p-4 rounded-2xl border border-emerald-200 space-y-3 relative overflow-hidden shadow-sm">
                  <div className="flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-2">
                      <HealthAppleLogo size={28} animated />
                      <div>
                        <span className="text-[10px] font-black text-emerald-600 block">پروانه بهداشتی و سلامت کالا</span>
                        <h4 className="text-xs font-black text-slate-900">نشان سیب سلامت سازمان غذا و دارو</h4>
                      </div>
                    </div>
                    <span className="bg-emerald-500/10 text-emerald-700 text-[9px] font-mono font-bold px-2 py-0.5 rounded-md border border-emerald-400/30">
                      کد: {product.healthCertCode || "۱۶/۱۲۴۵۸"}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-[10px] text-slate-700 relative z-10">
                    <div className="bg-white p-2 rounded-xl border border-emerald-100 text-center">
                      <span className="text-slate-400 block font-bold text-[9px]">درجه خلوص</span>
                      <span className="font-black text-emerald-600">۱۰۰٪ طبیعی</span>
                    </div>
                    <div className="bg-white p-2 rounded-xl border border-teal-100 text-center">
                      <span className="text-slate-400 block font-bold text-[9px]">مواد نگهدارنده</span>
                      <span className="font-black text-teal-600">فاقد افزودنی</span>
                    </div>
                    <div className="bg-white p-2 rounded-xl border border-amber-100 text-center">
                      <span className="text-slate-400 block font-bold text-[9px]">آزمایشگاه</span>
                      <span className="font-black text-amber-700">کنترل کیفیت کارخانه</span>
                    </div>
                  </div>
                </div>

                {/* Technical Specifications Block */}
                <div className="space-y-2 pt-2 border-t border-gray-200/50">
                  <h4 className="text-xs font-black text-indigo-800">مشخصات فنی و استانداردها</h4>
                  
                  <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-600">
                    <div className="p-2.5 bg-white rounded-xl border border-gray-100">
                      <span className="text-slate-400 font-bold block">مبدا تولید:</span>
                      <span className="font-black mt-0.5 block">{product.brand}</span>
                    </div>
                    <div className="p-2.5 bg-white rounded-xl border border-gray-100">
                      <span className="text-slate-400 font-bold block">محل بارگیری ترانزیت:</span>
                      <span className="font-black mt-0.5 block truncate">{product.shipping_origin || "البرز - کارخانه مرکزی"}</span>
                    </div>
                    <div className="p-2.5 bg-white rounded-xl border border-gray-100">
                      <span className="text-slate-400 font-bold block">بسته‌بندی ضربه‌گیر:</span>
                      <span className="font-black mt-0.5 block truncate">{product.pack_description || "شیرینگ حرارتی کارتنی"}</span>
                    </div>
                    <div className="p-2.5 bg-white rounded-xl border border-gray-100">
                      <span className="text-slate-400 font-bold block">زمان تامین بارنامه:</span>
                      <span className="font-black mt-0.5 block">{toPersianNum(product.production_lead_time_days || 3)} روز کاری</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Badges of Standard Compliance */}
              <div className="pt-4 border-t border-gray-200/50 mt-4 flex items-center justify-center gap-4">
                <div className="flex items-center gap-1.5 text-emerald-600 font-bold text-[10px]">
                  <ShieldCheck size={14} />
                  <span>نشان رسمی سیب سلامت</span>
                </div>
                <div className="flex items-center gap-1.5 text-blue-600 font-bold text-[10px]">
                  <CheckCircle2 size={14} />
                  <span>استاندارد ملی کیفیت</span>
                </div>
              </div>
            </div>

            {/* RIGHT HALF: Interactive Multi-step Order Form */}
            <div className="flex-1 p-6 sm:p-8 flex flex-col justify-between overflow-y-auto max-h-[50vh] md:max-h-[92vh]">
              {/* Stepper Progress Header */}
              <div className="pb-4 border-b border-gray-100 flex items-center justify-between">
                <span className="text-xs font-black text-indigo-800">
                  {step === 1 && "مرحله اول: انتخاب حجم و بسته‌بندی"}
                  {step === 2 && "مرحله دوم: مشخصات خریدار و ترابری"}
                  {step === 3 && "مرحله سوم: بارگذاری پروانه کسب و چک"}
                  {step === 4 && "مرحله چهارم: تأیید فاکتور و صدور حواله"}
                </span>

                {/* Progress Indicators */}
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4].map((s, sIdx) => (
                    <div 
                      key={`modal-step-indicator-${s}-${sIdx}`}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        s === step 
                          ? "w-6 bg-emerald-600" 
                          : s < step 
                          ? "w-2 bg-emerald-300" 
                          : "w-2 bg-gray-150"
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* STEP CONTENTS */}
              <div className="py-6 flex-1 flex flex-col">
                {/* View Switcher */}
                <div className="flex gap-2 mb-6 bg-slate-50 p-1.5 rounded-2xl w-fit border border-slate-100">
                  <button
                    onClick={() => setActiveView('order')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black transition-all cursor-pointer ${
                      activeView === 'order' 
                        ? "bg-white text-emerald-600 shadow-sm" 
                        : "text-slate-500 hover"
                    }`}
                  >
                    <Package size={14} />
                    ثبت سفارش
                  </button>
                  <button
                    onClick={() => setActiveView('reviews')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black transition-all cursor-pointer ${
                      activeView === 'reviews' 
                        ? "bg-white text-emerald-600 shadow-sm" 
                        : "text-slate-500 hover"
                    }`}
                  >
                    <MessageSquare size={14} />
                    نظرات مشتریان
                  </button>
                </div>

                {activeView === 'reviews' ? (
                  <div className="animate-fadeIn h-full overflow-y-auto pr-2">
                    <ProductReviews productId={product.id} theme="light" />
                  </div>
                ) : (
                  <>
                    {/* STEP 1: QUANTITY AND PACKAGING SELECTOR */}
                    {step === 1 && (
                  <div className="space-y-4 animate-fadeIn">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-black text-slate-700">انتخاب حجم و پله‌های تخفیف تیراژ:</h4>
                        <span className="text-[10px] font-black text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200 flex items-center gap-1">
                          <Package size={11} className="text-emerald-600" />
                          <span>حداقل سفارش: {toPersianNum(minCartons)} کارتن</span>
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 leading-relaxed font-bold">
                        با افزایش حجم خرید، به صورت خودکار درصد تخفیف مازاد روی کل سفارش اعمال می‌شود.
                      </p>
                    </div>

                    {/* Tiered Volume Discount Progression */}
                    <div className="grid grid-cols-4 gap-1.5 text-center">
                      {[
                        { tier: `${toPersianNum(minCartons)} تا ۹ کارتن`, disc: "پایه کارخانه", active: cartons < 10, min: minCartons },
                        { tier: "۱۰ تا ۱۹ کارتن", disc: "۳٪ تخفیف", active: cartons >= 10 && cartons < 20, min: 10 },
                        { tier: "۲۰ تا ۴۹ کارتن", disc: "۵٪ تخفیف", active: cartons >= 20 && cartons < 50, min: 20 },
                        { tier: "۵۰+ کارتن (پالت)", disc: "۸٪ تخفیف", active: cartons >= 50, min: 50 },
                      ].map((t, idx) => (
                        <button
                          key={`tier-disc-${product.id}-${idx}-${t.min}`}
                          type="button"
                          onClick={() => setCartons(t.min)}
                          className={`p-2 rounded-xl border transition-all cursor-pointer flex flex-col items-center justify-center ${
                            t.active
                              ? "bg-emerald-700 text-white border-emerald-600 shadow-md ring-2 ring-emerald-400/40"
                              : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          <span className="text-[9px] font-bold opacity-90">{t.tier}</span>
                          <span className="text-[10px] font-black mt-0.5">{t.disc}</span>
                        </button>
                      ))}
                    </div>

                    {/* Unit Selector Chips */}
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'carton', label: "کارتن عمده" },
                        { id: 'pack', label: `پاکت (${product.unit})` },
                        { id: 'kg', label: "کیلوگرم (وزنی)" }
                      ].map((u, uIdx) => (
                        <button
                          key={`unit-chip-${u.id}-${uIdx}`}
                          onClick={() => setUnitType(u.id as any)}
                          className={`py-2 px-1 text-center rounded-xl text-[10px] font-black border transition-all cursor-pointer ${
                            unitType === u.id 
                              ? "bg-emerald-600 text-white border-emerald-500 shadow-md" 
                              : "bg-slate-50 text-slate-500 border-gray-100"
                          }`}
                        >
                          {u.label}
                        </button>
                      ))}
                    </div>

                    {/* Quantity Selector input panel */}
                    <div className="bg-slate-50 p-4 rounded-2xl border border-gray-100 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center border border-gray-200 rounded-xl bg-white p-0.5 shadow-sm">
                          <button 
                            onClick={handleIncrement}
                            className="p-1 hover text-emerald-600 rounded-lg transition-colors cursor-pointer"
                          >
                            <Plus size={16} />
                          </button>
                          <input 
                            type="text"
                            inputMode="numeric"
                            value={cartons === 0 ? "" : cartons}
                            onChange={(e) => {
                              const clean = toEnglishNum(e.target.value).replace(/[^0-9]/g, '');
                              const numVal = clean === "" ? 0 : parseInt(clean, 10);
                              handleUnitQuantityChange(numVal, 'carton');
                            }}
                            className="w-14 text-center font-black text-sm text-gray-800 font-mono focus:outline-none"
                          />
                          <button 
                            disabled={cartons <= minCartons}
                            onClick={handleDecrement}
                            className="p-1 hover text-emerald-600 rounded-lg transition-colors disabled:opacity-30 cursor-pointer"
                          >
                            <Minus size={16} />
                          </button>
                        </div>
                        <span className="text-xs font-black text-indigo-800">کارتن کالا</span>
                      </div>

                      <div className="text-left">
                        <span className="text-[10px] text-slate-400 font-bold block">مجموع فاکتور عمده:</span>
                        <span className="text-base font-black text-emerald-600 font-mono">{toPersianNum(totalOrderPrice.toLocaleString())} <span className="text-[10px] font-black">تومان</span></span>
                      </div>
                    </div>

                    {/* Dynamic Profit & Return Summary Banner */}
                    <div className="bg-gradient-to-l from-emerald-50 via-teal-50 to-amber-50/50 p-3.5 rounded-2xl border border-emerald-200/90 space-y-2 text-right">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <span className="text-[9px] font-bold text-slate-500 block">سود ناخالص تخمینی شما از این سفارش:</span>
                          <span className="text-xs font-black text-emerald-800 font-mono">
                            +{toPersianNum(totalNetProfit.toLocaleString())} تومان ({toPersianNum(profitMarginPercent)}٪ حاشیه سود)
                          </span>
                        </div>
                        {discountSavings > 0 && (
                          <div className="bg-emerald-600 text-white px-2.5 py-1 rounded-xl text-[9px] font-black shadow-xs">
                            {toPersianNum(discountSavings.toLocaleString())} ت صرفه‌جویی تیراژ
                          </div>
                        )}
                      </div>

                      {/* Daily & Compound Nudges */}
                      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-emerald-200/50 text-[10px] font-black">
                        <div className="bg-white/80 p-2 rounded-xl border border-emerald-100 flex items-center justify-between">
                          <span className="text-slate-500 text-[9px]">سود روزانه:</span>
                          <span className="text-cyan-800 font-mono">+{toPersianNum(Math.round(totalNetProfit / 30).toLocaleString())} ت/روز</span>
                        </div>
                        <div className="bg-white/80 p-2 rounded-xl border border-amber-200 flex items-center justify-between">
                          <span className="text-slate-500 text-[9px]">سود مرکب ۶ ماهه:</span>
                          <span className="text-amber-900 font-mono">
                            +{toPersianNum(Math.round(totalOrderPrice * (Math.pow(1 + ((profitMarginPercent / 100) * 0.7), 6) - 1)).toLocaleString())} ت
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Dynamic Conversions display */}
                    <div className="grid grid-cols-3 gap-3 text-center bg-slate-50/50 p-3 rounded-2xl border border-gray-150 text-[10px] text-slate-500 font-black">
                      <div>
                        <span className="text-slate-400 block mb-0.5">تعداد کل بسته‌ها:</span>
                        <span className="text-indigo-800 font-mono text-xs">{toPersianNum(totalPacks.toLocaleString())} {product.unit}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block mb-0.5">وزن تقریبی مرسوله:</span>
                        <span className="text-indigo-800 font-mono text-xs">{toPersianNum(totalWeightKg)} کیلوگرم</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block mb-0.5">بار حجمی ترانزیت:</span>
                        <span className="text-indigo-800 font-mono text-xs">{toPersianNum(cartons)} کارتن</span>
                      </div>
                    </div>

                    {/* Official Tax Invoice & Escrow Assurance */}
                    <div className="bg-slate-50 border border-slate-200 p-3 rounded-2xl flex items-center justify-between text-[10px] font-bold text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <FileText size={14} className="text-indigo-600" />
                        <span>امکان صدور فاکتور رسمی معتبر کارخانه همراه با ارزش افزوده</span>
                      </div>
                      <div className="flex items-center gap-1 text-emerald-700 font-black">
                        <ShieldCheck size={14} className="text-emerald-600" />
                        <span>تسویه امانی امن</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 2: CUSTOMER AND SHIPPING DETAILS */}
                {step === 2 && (
                  <div className="space-y-4 animate-fadeIn">
                    <div className="space-y-1 mb-2">
                      <h4 className="text-xs font-black text-slate-700">اطلاعات تحویل و ترابری سفارش</h4>
                      <p className="text-[10px] text-slate-400 leading-relaxed font-bold">
                        اطلاعات دقیق بنکداری و محل تخلیه بار خودروهای سنگین را در این بخش تکمیل نمایید.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3.5">
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-500 font-black flex items-center gap-1">
                          <UserIcon size={12} />
                          نام و نام خانوادگی رابط
                        </label>
                        <input 
                          type="text" 
                          value={buyerName}
                          onChange={(e) => setBuyerName(e.target.value)}
                          placeholder="مثال: علی رضایی"
                          className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs text-indigo-800 outline-none focus focus font-bold"
                        />
                        {errors.buyerName && <p className="text-rose-500 text-[9px] font-black">{errors.buyerName}</p>}
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-500 font-black flex items-center gap-1">
                          <Phone size={12} />
                          شماره موبایل رابط
                        </label>
                        <input 
                          type="text" 
                          value={buyerPhone}
                          onChange={(e) => setBuyerPhone(e.target.value)}
                          placeholder="مثال: 09123456789"
                          className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs text-indigo-800 font-mono outline-none focus focus text-left"
                        />
                        {errors.buyerPhone && <p className="text-rose-500 text-[9px] font-black">{errors.buyerPhone}</p>}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-500 font-black flex items-center gap-1">
                        <Building size={12} />
                        نام بنکداری / فروشگاه
                      </label>
                      <input 
                        type="text" 
                        value={buyerCompany}
                        onChange={(e) => setBuyerCompany(e.target.value)}
                        placeholder="مثال: پخش همکاران البرز"
                        className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs text-indigo-800 outline-none focus focus font-bold"
                      />
                      {errors.buyerCompany && <p className="text-rose-500 text-[9px] font-black">{errors.buyerCompany}</p>}
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-500 font-black flex items-center gap-1">
                        <MapPin size={12} />
                        نشانی تخلیه بار
                      </label>
                      <textarea 
                        value={buyerAddress}
                        onChange={(e) => setBuyerAddress(e.target.value)}
                        placeholder="مثال: تهران، جاده قدیم کرج، انبار توزیع شماره ۳"
                        rows={2}
                        className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-indigo-800 outline-none focus focus font-bold"
                      />
                      {errors.buyerAddress && <p className="text-rose-500 text-[9px] font-black">{errors.buyerAddress}</p>}
                    </div>

                    {/* Transport Selection */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-slate-500 font-black flex items-center gap-1">
                        <Truck size={12} />
                        ناوگان ترجیحی حمل و ترابری
                      </label>
                      <div className="grid grid-cols-3 gap-2.5">
                        {[
                          { id: "road_truck", label: "کامیون تک/ده‌چرخ", desc: "ظرفیت ۱,۰۰۰ الی ۱,۵۰۰ کارتن" },
                          { id: "heavy_trailer", label: "تریلر چادری", desc: "ظرفیت ۲,۰۰۰ الی ۲,۵۰۰ کارتن" },
                          { id: "local_cargo", label: "ایسوزو/خاور مسقف", desc: "ظرفیت ۳۰۰ الی ۶۰۰ کارتن" }
                        ].map((t, tIdx) => (
                          <div 
                            key={`transport-type-${t.id}-${tIdx}`}
                            onClick={() => setTransportType(t.id)}
                            className={`p-2.5 rounded-xl border text-center cursor-pointer transition-all ${
                              transportType === t.id 
                                ? "bg-emerald-500/10 border-emerald-500 text-emerald-800" 
                                : "bg-slate-50 border-gray-100 text-slate-500"
                            }`}
                          >
                            <span className="text-[10px] font-black block">{t.label}</span>
                            <span className="text-[8px] text-slate-400 font-bold block mt-0.5">{t.desc}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 3: DOCUMENT UPLOAD */}
                {step === 3 && (
                  <div className="space-y-5 animate-fadeIn text-center">
                    <div className="space-y-1 text-right">
                      <h4 className="text-xs font-black text-slate-700">مستندات اعتباری و تجاری بنکداری</h4>
                      <p className="text-[10px] text-slate-400 leading-relaxed font-bold">
                        جهت بررسی شرایط پرداخت اعتباری (خرید با چک صیادی) در مجتمع دست اول، تصویر جواز کسب یا چک صیادی خود را آپلود کنید.
                      </p>
                    </div>

                    {/* Drag and drop panel */}
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-gray-200 bg-slate-50 rounded-3xl p-8 hover transition-colors flex flex-col items-center justify-center gap-3 cursor-pointer"
                    >
                      <div className="w-12 h-12 bg-emerald-500/10 text-emerald-600 rounded-full flex items-center justify-center">
                        <UploadCloud size={24} />
                      </div>
                      
                      <div className="space-y-1">
                        <p className="text-xs font-black text-indigo-800">آپلود جواز کسب یا برگه چک صیادی</p>
                        <p className="text-[9px] text-slate-400 font-bold">فایل‌های مجاز: JPG, PNG, PDF حداکثر ۵ مگابایت</p>
                      </div>

                      <input 
                        type="file" 
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        className="hidden" 
                        accept=".jpg,.jpeg,.png,.pdf"
                      />
                    </div>

                    {/* Upload progress or file info */}
                    {uploadedFile && (
                      <div className="bg-slate-50 p-4 rounded-2xl border border-gray-150 text-right space-y-2">
                        <div className="flex justify-between items-center text-[10px] font-black">
                          <span className="text-emerald-600 flex items-center gap-1.5">
                            <CheckCircle2 size={12} />
                            فایل با موفقیت بارگذاری شد
                          </span>
                          <span className="text-slate-500 truncate max-w-[150px]">{uploadedFile.name}</span>
                        </div>
                        
                        {/* Progress Bar */}
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-emerald-500 transition-all duration-300" 
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Quality Assurance info */}
                    <div className="bg-blue-50/50 border border-blue-200/50 p-3.5 rounded-2xl flex gap-2 text-right">
                      <ShieldCheck className="text-blue-600 shrink-0 mt-0.5" size={16} />
                      <div className="text-[10px] text-blue-800 leading-relaxed font-bold">
                        تمامی اسناد آپلود شده توسط دپارتمان مالی و اعتباری دست اول طی ۲ ساعت کاری بررسی می‌شوند. خرید نقدی نیازی به تأیید مدارک ندارد.
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 4: FINAL INVOICE & SUMS */}
                {step === 4 && (
                  <div className="space-y-4 animate-fadeIn">
                    <div className="space-y-1 mb-2">
                      <h4 className="text-xs font-black text-slate-700">پیش‌فاکتور مستقیم و بدون واسطه کارخانه</h4>
                      <p className="text-[10px] text-slate-400 leading-relaxed font-bold">
                        محاسبه نهایی فاکتور بر اساس تخفیف‌های ویژه سطح همکار و فاقد کارمزد واسطه‌گری صادر گردیده است.
                      </p>
                    </div>

                    {/* Invoice visual panel */}
                    <div className="bg-slate-50 rounded-3xl p-5 border border-gray-150 text-[11px] space-y-3 font-bold text-slate-600">
                      <div className="flex justify-between pb-2 border-b border-gray-200/50 font-black text-indigo-800">
                        <span>شرح کالا</span>
                        <span>مبلغ نهایی</span>
                      </div>
                      
                      <div className="flex justify-between text-xs text-slate-700">
                        <span>{product.name} (تعداد {toPersianNum(cartons)} کارتن)</span>
                        <span className="font-mono">{toPersianNum(originalTotalPrice.toLocaleString())} تومان</span>
                      </div>

                      {discountSavings > 0 && (
                        <div className="flex justify-between text-emerald-600 text-[10px] font-black">
                          <span>تخفیف تیراژ و حجم خرید ({toPersianNum(volumeDiscountPercent)}٪)</span>
                          <span className="font-mono">-{toPersianNum(discountSavings.toLocaleString())} تومان</span>
                        </div>
                      )}

                      <div className="flex justify-between text-blue-600 text-[10px]">
                        <span>هزینه حمل و ترانزیت جاده‌ای</span>
                        <span className="font-black font-mono">پس‌کرایه در مقصد</span>
                      </div>

                      <div className="flex justify-between pt-2.5 border-t border-gray-200/50 font-black text-indigo-800 text-xs sm bg-slate-100/40 -mx-5 px-5 py-2">
                        <span>مبلغ قابل پرداخت فاکتور:</span>
                        <span className="font-mono text-emerald-600">{toPersianNum(totalOrderPrice.toLocaleString())} تومان</span>
                      </div>
                    </div>

                    {/* Bottom notes */}
                    <div className="p-3 bg-emerald-50/40 rounded-2xl border border-emerald-100/50 text-[9px] text-slate-500 font-bold">
                      💡 پس از ثبت سفارش، بارنامه رسمی وزارت راه همراه با پلمپ دیجیتال در منوی «رهگیری ناوگان» صادر خواهد شد و می‌توانید وضعیت تخلیه کالا را لحظه به لحظه رصد کنید.
                    </div>
                  </div>
                )}
                </>
              )}
              </div>

              {/* ACTION BUTTONS PANEL */}
              <div className="pt-4 border-t border-gray-150 flex flex-wrap items-center justify-between gap-2 shrink-0">
                {step > 1 ? (
                  <button 
                    onClick={handlePrevStep}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-2xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <ArrowRight size={14} />
                    مرحله قبل
                  </button>
                ) : (
                  <button 
                    onClick={onClose}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer"
                  >
                    بستن جزئیات
                  </button>
                )}

                {step === 1 ? (
                  !user ? (
                    <button 
                      onClick={() => {
                        onClose();
                        window.dispatchEvent(new CustomEvent('open-auth-modal', { detail: { mode: 'signup' } }));
                      }}
                      className="bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white px-6 py-2.5 rounded-2xl text-xs font-black flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer mr-auto"
                    >
                      <Lock size={14} className="text-amber-300" />
                      ثبت‌نام همکاران جهت مشاهده قیمت و خرید
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 mr-auto">
                      <button
                        onClick={() => {
                          onAddToCart(product, cartons);
                          onClose();
                        }}
                        className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/80 px-4 py-2.5 rounded-2xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                      >
                        <ShoppingCart size={14} />
                        افزودن به سبد
                      </button>
                      <button 
                        onClick={handleNextStep}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-2xl text-xs font-black flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
                      >
                        تسویه و صدور فاکتور
                        <ArrowLeft size={14} />
                      </button>
                    </div>
                  )
                ) : step < 4 ? (
                  <button 
                    onClick={handleNextStep}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-2.5 rounded-2xl text-xs font-black flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer mr-auto"
                  >
                    گام بعدی
                    <ArrowLeft size={14} />
                  </button>
                ) : (
                  <button 
                    onClick={handleOrderSubmit}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-2.5 rounded-2xl text-xs font-black flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer mr-auto"
                  >
                    تأیید نهایی و صدور فاکتور مستقیم
                    <CheckCircle2 size={14} />
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
