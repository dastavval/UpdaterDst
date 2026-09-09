import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  X, Package, ShieldCheck, Truck, Info, FileText, CheckCircle2, 
  Plus, Minus, Building, Building2, Phone, User as UserIcon, MapPin, UploadCloud, 
  AlertCircle, ArrowRight, ArrowLeft, Check, Sparkles, Scale, BadgeAlert,
  Star, MessageSquare, ShoppingCart, Lock, Tag
} from "lucide-react";
import type { Product, User } from "../types";
import { getDisplayImageUrl, cleanUnitName } from "../lib/image-utils";
import ProductReviews from "./ProductReviews";
import StarRating from "./StarRating";
import { ExpandableText } from "./ExpandableText";
import { HealthAppleLogo, HealthBadgesStrip, HealthCertModal } from "./HealthAppleBadge";
import { getProductRolePricing, toPersianDigits } from "../lib/pricing";
import { getEffectiveProductTags } from "../utils/api-utils";
import { AnimatedHatchedOverlay } from "./AnimatedHatchedOverlay";

interface ProductDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  userBadge?: 'bronze' | 'silver' | 'gold' | 'vip' | 'admin';
  user?: User | null;
  onAddToCart: (product: Product, quantityCartons: number) => void;
  onOrderSuccess: (trackingNumber: string, amount: number) => void;
  onGoToProductPage?: (product: Product) => void;
}

export default function ProductDetailModal({ 
  isOpen, 
  onClose, 
  product, 
  userBadge = 'bronze', 
  user,
  onAddToCart,
  onOrderSuccess,
  onGoToProductPage
}: ProductDetailModalProps) {
  const [step, setStep] = useState(1);
  const [activeView, setActiveView] = useState<'order' | 'reviews'>('order');
  const initialMinCartons = Math.max(5, product?.min_order_cartons || 5);
  const [cartons, setCartons] = useState(initialMinCartons);
  const [unitType, setUnitType] = useState<'carton' | 'kg' | 'ton' | 'pack'>('carton');
  const [detailImgError, setDetailImgError] = useState(false);
  
  // Form fields with intelligent initial auto-fill
  const [buyerName, setBuyerName] = useState(() => user?.role !== 'admin' && user?.name !== "مدیریت کل سامانه" ? user?.name || "" : "");
  const [buyerPhone, setBuyerPhone] = useState(() => user?.mobile || user?.phone || "");
  const [buyerCompany, setBuyerCompany] = useState(() => user?.role !== 'admin' ? user?.company || "" : "");
  const [buyerAddress, setBuyerAddress] = useState(() => user?.role !== 'admin' ? user?.address || "" : "");
  const [transportType, setTransportType] = useState("road_truck"); // road_truck, local_cargo, heavy_trailer

  const [activeImg, setActiveImg] = useState<string | null>(null);
  
  // Reset/sync state whenever active product changes
  useEffect(() => {
    if (product) {
      const pMin = Math.max(5, product.min_order_cartons || 5);
      setCartons(pMin);
      setStep(1);
      setActiveView('order');
      setDetailImgError(false);
      setErrors({});
      setActiveImg(null);
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

    if (user?.name && user.role !== 'admin' && user.name !== "مدیریت کل سامانه") setBuyerName(user.name);
    else if (!buyerName && saved.name) setBuyerName(saved.name);

    if (user?.mobile || user?.phone) setBuyerPhone(user.mobile || user.phone || "");
    else if (!buyerPhone && saved.phone) setBuyerPhone(saved.phone);

    if (user?.company && user.role !== 'admin') setBuyerCompany(user.company);
    else if (!buyerCompany && saved.company) setBuyerCompany(saved.company);

    if (user?.address && user.role !== 'admin') setBuyerAddress(user.address);
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

  // Sales Unit Type & Clean Unit Name Determination
  const salesUnitType: 'carton' | 'count' | 'weight' = product?.sales_unit_type || (
    product?.unit === 'کیلوگرم' || product?.unit === 'گرم' ? 'weight' : 'carton'
  );
  const cleanUnit = cleanUnitName(product?.unit);

  // Approximate weight calculation
  const unitsPerBox = product?.carton_pack_count || 1;
  const unitWeightKg = (product as any)?.unit_weight_kg || 0.040; // 40g default
  const kgPerCartonRaw = product?.weight_per_carton_kg || (salesUnitType === 'weight' ? 20 : (unitsPerBox * unitWeightKg));
  
  // Sanity check for weight: if it's over 40kg for a small unit count, it's likely wrong
  const kgPerCarton = (kgPerCartonRaw > 40 && unitsPerBox < 100) ? (unitsPerBox * 0.05) : kgPerCartonRaw;
  
  const cartonNetWeight = product?.carton_net_weight_kg || (kgPerCarton * 0.95);
  const cartonGrossWeight = product?.carton_gross_weight_kg || kgPerCarton;

  const totalWeightKg = Math.round(cartons * cartonGrossWeight);
  const totalNetWeightKg = Math.round(cartons * cartonNetWeight);
  const totalWeightTons = (totalWeightKg / 1000).toFixed(2);
  const totalPacks = cartons * packCount;

  const handleIncrement = () => {
    setCartons(prev => prev + 1);
  };

  const handleDecrement = () => {
    setCartons(prev => Math.max(minCartons, prev - 1));
  };

  // Convert unit input to equivalent cartons
  const handleUnitQuantityChange = (val: number, targetUnit: typeof unitType) => {
    if (isNaN(val) || val <= 0 || !product) return;
    let computedCartons = minCartons;
    
    if (targetUnit === 'carton') {
      computedCartons = val;
    } else if (targetUnit === 'pack') {
      computedCartons = Math.ceil(val / Math.max(1, packCount));
    } else if (targetUnit === 'kg') {
      computedCartons = Math.ceil(val / Math.max(1, kgPerCarton));
    } else if (targetUnit === 'ton') {
      const computedKg = val * 1000;
      computedCartons = Math.ceil(computedKg / Math.max(1, kgPerCarton));
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
            <AnimatedHatchedOverlay intensity="light" />
            
            {/* Close Button */}
            <button 
              onClick={onClose}
              className="absolute top-4 left-4 p-2.5 bg-slate-50 text-slate-500 border border-slate-200 hover:bg-white rounded-full transition-all z-20 cursor-pointer shadow-sm"
            >
              <X size={16} />
            </button>

            {/* LEFT HALF: Product Details Display Panel */}
            <div className="w-full md:w-[45%] bg-white p-5 flex flex-col justify-between border-l border-gray-100 overflow-y-auto max-h-[50vh] md:max-h-[92vh]">
              <div className="space-y-5">
                {/* Trust Banner - Simpler Version */}
                <div className="bg-emerald-50/80 border border-emerald-100 rounded-2xl p-3.5 flex items-start gap-3">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-emerald-200 shrink-0 shadow-xs">
                    <ShieldCheck size={22} className="text-emerald-600" />
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <h4 className="text-[11px] font-black text-slate-900">ضمانت اصالت و سلامت بار</h4>
                      <span className="bg-emerald-600 text-white text-[8px] px-1.5 py-0.5 rounded font-black">دست اول</span>
                    </div>
                    <p className="text-[9px] text-slate-500 font-bold leading-relaxed">
                      تحویل مستقیم از درب کارخانه با فاکتور رسمی و تضمین تاریخ انقضای معتبر.
                    </p>
                  </div>
                </div>

                {/* Product Media Gallery */}
                <div className="space-y-3">
                  <div className="aspect-square w-full bg-slate-50 rounded-3xl overflow-hidden flex items-center justify-center border border-slate-100 relative group">
                    {detailImgError || (!product.image_url && !activeImg) ? (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-1.5 text-slate-400">
                        <Package size={40} className="text-slate-200 stroke-[1]" />
                        <span className="text-[10px] font-black">تصویر موجود نیست</span>
                      </div>
                    ) : (
                      <img 
                        src={getDisplayImageUrl(activeImg || product.image_url || product.imageUrl, product.name, product.brand)} 
                        alt={product.name}
                        className="w-full h-full object-contain p-4 group-hover:scale-[1.04] transition-transform duration-500"
                        referrerPolicy="no-referrer"
                        onError={() => setDetailImgError(true)}
                      />
                    )}
                  </div>

                  {/* Thumbs */}
                  {(product.galleryUrls && product.galleryUrls.length > 0) && (
                    <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar justify-center">
                      {[product.image_url || product.imageUrl, ...product.galleryUrls].filter(Boolean).map((url, idx) => (
                        <button
                          key={`gallery-${product.id}-${idx}`}
                          onClick={() => setActiveImg(url as string)}
                          className={`w-12 h-12 rounded-xl border-2 shrink-0 transition-all overflow-hidden bg-white ${
                            (activeImg === url || (!activeImg && url === (product.image_url || product.imageUrl)))
                              ? "border-emerald-500 shadow-sm"
                              : "border-transparent hover:border-slate-200"
                          }`}
                        >
                          <img 
                            src={getDisplayImageUrl(url as string, product.name, product.brand)} 
                            alt={`${product.name} - ${idx}`}
                            className="w-full h-full object-contain p-1"
                            referrerPolicy="no-referrer"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Product Identity */}
                <div className="space-y-2 text-right">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      {((product as any).isSpecial || product.isFeatured) && (
                        <span className="text-[10px] font-black text-white bg-emerald-600 px-2.5 py-0.5 rounded-lg border border-emerald-500 shadow-2xs flex items-center gap-1">
                          <Sparkles size={11} className="fill-white text-white" />
                          <span>ویژه 🌟</span>
                        </span>
                      )}
                      <span className="text-[10px] font-black text-slate-600">برند: {product.brand}</span>
                      {product.factoryName && (
                        <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">
                          مبدا بارگیری (کارخانه): {product.factoryName}
                        </span>
                      )}
                      {product.supplierName && (
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-lg">
                          تأمین‌کننده: {product.supplierName}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-lg">کد: {product.sku?.split('-')[1] || '۱۲۴'}</span>
                  </div>
                  <h3 className="text-lg font-black text-slate-900 leading-tight">
                    {product.name}
                  </h3>
                  <p className="text-[10px] text-slate-500 font-bold">
                    {product.pack_description || `داخل کارتن: ${toPersianNum(product.carton_pack_count)} عدد ${product.unit || 'بسته'}`}
                  </p>
                </div>

                {/* Info Grid - The 4 key boxes requested by user */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-xs text-center space-y-1">
                    <span className="text-[9px] font-bold text-slate-400 block">تعداد در کارتن</span>
                    <span className="text-xs font-black text-slate-800">{toPersianNum(product.carton_pack_count)} عدد</span>
                  </div>
                  <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-xs text-center space-y-1">
                    <span className="text-[9px] font-bold text-slate-400 block">ظرفیت هر پالت</span>
                    <span className="text-xs font-black text-slate-800">{toPersianNum((product as any).palletCapacity || 48)} کارتن</span>
                  </div>
                  <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-xs text-center space-y-1">
                    <span className="text-[9px] font-bold text-slate-400 block">ارسال سفارش</span>
                    <span className="text-xs font-black text-emerald-600">{toPersianNum(product.production_lead_time_days || 3)} الی ۵ روز</span>
                  </div>
                  <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-xs text-center space-y-1">
                    <span className="text-[9px] font-bold text-slate-400 block">نوع تسویه</span>
                    <span className="text-xs font-black text-slate-800">نقد / چک صیادی</span>
                  </div>
                </div>

                {/* Confidential Seller Block - Simplified */}
                <div className="bg-slate-900 text-white p-3.5 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <div className="flex items-center gap-2">
                      <Building2 size={14} className="text-emerald-400" />
                      <span className="text-[10px] font-black">اطلاعات تولیدکننده و آگهی</span>
                    </div>
                    <Lock size={10} className="text-amber-400" />
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-slate-400 font-bold">🏢 کارخانه:</span>
                      <span className="font-black text-emerald-400">{product.brand}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-slate-400 font-bold">🛡️ وضعیت اعتبار:</span>
                      <span className="font-black text-teal-300">احراز هویت شده ✅</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      window.dispatchEvent(new CustomEvent("dastavval-open-ticket-with-product", {
                        detail: { productId: product.id, productName: product.name }
                      }));
                    }}
                    className="w-full py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-[10px] font-black transition-all flex items-center justify-center gap-2 border border-white/5"
                  >
                    <MessageSquare size={12} />
                    <span>تیکت استعلام مستقیم</span>
                  </button>
                </div>
              </div>

              {/* Badges of Standard Compliance */}
              <div className="pt-4 border-t border-gray-200/50 mt-4 flex items-center justify-center gap-4">
                <div className="flex items-center gap-1.5 text-emerald-600 font-bold text-[10px]">
                  <ShieldCheck size={14} />
                  <span>نشان رسمی سیب سلامت</span>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-600 font-bold text-[10px]">
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
                  {[1, 2, 3, 4].map((s) => (
                    <div 
                      key={`modal-step-indicator-${s}`}
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
                        : "text-slate-500 hover:text-slate-700"
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
                        : "text-slate-500 hover:text-slate-700"
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
                  <div className="flex-1">
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
                        {/* Discount Progression */}
                        <div className="grid grid-cols-4 gap-1.5 text-center">
                          {[
                            { tier: `${toPersianNum(minCartons)} تا ۹ کارتن`, disc: "پایه کارخانه", active: cartons < 10, min: minCartons },
                            { tier: "۱۰ تا ۱۹ کارتن", disc: "۳٪ تخفیف", active: cartons >= 10 && cartons < 20, min: 10 },
                            { tier: "۲۰ تا ۴۹ کارتن", disc: "۵٪ تخفیف", active: cartons >= 20 && cartons < 50, min: 20 },
                            { tier: "۵۰+ کارتن (پالت)", disc: "۸٪ تخفیف", active: cartons >= 50, min: 50 },
                          ].map((t, idx) => (
                            <button
                              key={`tier-disc-${idx}`}
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
                        {/* Unit Selector */}
                        {(() => {
                          const unitChips = salesUnitType === 'weight'
                            ? [{ id: 'carton', label: `کیسه / کارتن (${toPersianNum(kgPerCarton)} کیلوگرم)` }, { id: 'kg', label: `کیلوگرم` }]
                            : [{ id: 'carton', label: `کارتن عمده (${toPersianNum(packCount)} ${cleanUnit})` }, { id: 'pack', label: cleanUnit !== 'کارتن' ? cleanUnit : 'واحد خرد' }];
                          return (
                            <div className={`grid gap-2 ${unitChips.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                              {unitChips.map((u) => (
                                <button
                                  key={`unit-chip-${u.id}`}
                                  onClick={() => setUnitType(u.id as any)}
                                  className={`py-2 px-1 text-center rounded-xl text-[10px] font-black border transition-all cursor-pointer ${unitType === u.id ? "bg-emerald-600 text-white border-emerald-500 shadow-md" : "bg-slate-50 text-slate-500 border-gray-100"}`}
                                >
                                  {u.label}
                                </button>
                              ))}
                            </div>
                          );
                        })()}
                        {/* Quantity Counter */}
                        <div className="bg-slate-50 p-4 rounded-2xl border border-gray-100 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center border border-gray-200 rounded-xl bg-white p-0.5 shadow-sm">
                              <button onClick={handleIncrement} className="p-1 hover text-emerald-600 rounded-lg transition-colors cursor-pointer"><Plus size={16} /></button>
                              <input 
                                type="text"
                                inputMode="numeric"
                                value={cartons === 0 ? "" : unitType === 'carton' ? cartons : unitType === 'pack' ? (cartons * packCount) : unitType === 'kg' ? Math.round(cartons * kgPerCarton) : cartons}
                                onChange={(e) => {
                                  const clean = toEnglishNum(e.target.value).replace(/[^0-9]/g, '');
                                  handleUnitQuantityChange(clean === "" ? 0 : parseInt(clean, 10), unitType);
                                }}
                                className="w-16 text-center font-black text-sm text-gray-800 font-mono focus:outline-none"
                              />
                              <button disabled={cartons <= minCartons} onClick={handleDecrement} className="p-1 hover text-emerald-600 rounded-lg transition-colors disabled:opacity-30 cursor-pointer"><Minus size={16} /></button>
                            </div>
                            <span className="text-xs font-black text-indigo-800">
                              {unitType === 'carton' ? (salesUnitType === 'weight' ? 'کیسه / کارتن' : 'کارتن') : unitType === 'kg' ? 'کیلوگرم' : cleanUnit}
                            </span>
                          </div>
                          <div className="text-left">
                            <span className="text-[10px] text-slate-400 font-bold block">مجموع فاکتور:</span>
                            <span className="text-base font-black text-emerald-600 font-mono">{toPersianNum(totalOrderPrice.toLocaleString())} <span className="text-[10px] font-black">تومان</span></span>
                          </div>
                        </div>
                        {/* Profit Banner */}
                        <div className="bg-gradient-to-l from-emerald-50 via-teal-50 to-emerald-50/50 p-3.5 rounded-2xl border border-emerald-200/90 space-y-2 text-right">
                          <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                              <span className="text-[9px] font-bold text-slate-500 block">سود تخمینی شما:</span>
                              <span className="text-xs font-black text-emerald-800 font-mono">
                                {totalNetProfit > 0 ? `+${toPersianNum(totalNetProfit.toLocaleString())} تومان (${toPersianNum(profitMarginPercent)}٪)` : "تامین بدون واسطه"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    {/* STEP 2: SHIPPING */}
                    {step === 2 && (
                      <div className="space-y-4 animate-fadeIn">
                        <div className="space-y-1 mb-2 text-right">
                          <h4 className="text-xs font-black text-slate-700">اطلاعات تحویل و ترابری</h4>
                          <p className="text-[10px] text-slate-400 font-bold">اطلاعات دقیق محل تخلیه بار خودروهای سنگین را تکمیل نمایید.</p>
                        </div>
                        <div className="grid grid-cols-2 gap-3.5">
                          <div className="space-y-1">
                            <label className="text-[10px] text-slate-500 font-black flex items-center gap-1"><UserIcon size={12} />نام رابط</label>
                            <input type="text" value={buyerName} onChange={(e) => setBuyerName(e.target.value)} className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs text-indigo-800 outline-none font-bold" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] text-slate-500 font-black flex items-center gap-1"><Phone size={12} />شماره موبایل</label>
                            <input type="text" value={buyerPhone} onChange={(e) => setBuyerPhone(e.target.value)} className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs text-indigo-800 font-mono outline-none text-left" />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-500 font-black flex items-center gap-1"><Building size={12} />نام شرکت / فروشگاه</label>
                          <input type="text" value={buyerCompany} onChange={(e) => setBuyerCompany(e.target.value)} className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs text-indigo-800 outline-none font-bold" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-500 font-black flex items-center gap-1"><MapPin size={12} />نشانی انبار</label>
                          <textarea value={buyerAddress} onChange={(e) => setBuyerAddress(e.target.value)} rows={2} className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-indigo-800 outline-none font-bold" />
                        </div>
                      </div>
                    )}
                    {/* STEP 3: UPLOAD */}
                    {step === 3 && (
                      <div className="space-y-5 animate-fadeIn text-center">
                        <div className="space-y-1 text-right">
                          <h4 className="text-xs font-black text-slate-700">مستندات اعتباری</h4>
                          <p className="text-[10px] text-slate-400 font-bold">تصویر جواز کسب یا چک صیادی خود را آپلود کنید.</p>
                        </div>
                        <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-gray-200 bg-slate-50 rounded-3xl p-8 hover transition-colors flex flex-col items-center justify-center gap-3 cursor-pointer">
                          <UploadCloud size={24} className="text-emerald-600" />
                          <p className="text-xs font-black text-indigo-800">آپلود جواز کسب یا برگه چک</p>
                          <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".jpg,.jpeg,.png,.pdf" />
                        </div>
                        {uploadedFile && (
                          <div className="bg-slate-50 p-4 rounded-2xl border border-gray-150 text-right">
                            <span className="text-emerald-600 text-[10px] font-black flex items-center justify-end gap-2"><CheckCircle2 size={12} /> فایل بارگذاری شد: {uploadedFile.name}</span>
                          </div>
                        )}
                      </div>
                    )}
                    {/* STEP 4: FINAL */}
                    {step === 4 && (
                      <div className="space-y-4 animate-fadeIn">
                        <div className="space-y-1 mb-2 text-right">
                          <h4 className="text-xs font-black text-slate-700">پیش‌فاکتور نهایی</h4>
                          <p className="text-[10px] text-slate-400 font-bold">محاسبه نهایی فاکتور بر اساس قیمت مستقیم کارخانه.</p>
                        </div>
                        <div className="bg-slate-50 rounded-3xl p-5 border border-gray-150 text-[11px] space-y-3 font-bold text-slate-600 text-right">
                          <div className="flex justify-between pb-2 border-b border-gray-200/50 font-black text-indigo-800"><span>شرح کالا</span><span>مبلغ نهایی</span></div>
                          <div className="flex justify-between text-xs text-slate-700"><span>{product.name} ({toPersianNum(cartons)} کارتن)</span><span className="font-mono">{toPersianNum(originalTotalPrice.toLocaleString())} تومان</span></div>
                          {discountSavings > 0 && <div className="flex justify-between text-emerald-600 text-[10px] font-black"><span>تخفیف تیراژ ({toPersianNum(volumeDiscountPercent)}٪)</span><span className="font-mono">-{toPersianNum(discountSavings.toLocaleString())} تومان</span></div>}
                          <div className="flex justify-between pt-2.5 border-t border-gray-200/50 font-black text-indigo-800 text-xs bg-slate-100/40 -mx-5 px-5 py-2"><span>مبلغ قابل پرداخت:</span><span className="font-mono text-emerald-600">{toPersianNum(totalOrderPrice.toLocaleString())} تومان</span></div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* ACTION BUTTONS PANEL */}
              <div className="pt-4 border-t border-gray-150 flex flex-wrap items-center justify-between gap-2 shrink-0">
                {step > 1 ? (
                  <button onClick={handlePrevStep} className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-full text-xs font-black flex items-center gap-1.5 transition-all duration-200 active:scale-[0.95] cursor-pointer"><ArrowRight size={14} />مرحله قبل</button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button onClick={onClose} className="bg-slate-50 hover:bg-slate-100 text-slate-700 px-4 py-2.5 rounded-full text-xs font-black transition-all duration-200 active:scale-[0.95] cursor-pointer">بستن</button>
                    {onGoToProductPage && <button onClick={() => onGoToProductPage(product)} className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-4 py-2.5 rounded-full text-xs font-black flex items-center justify-center gap-1.5 transition-all duration-200 active:scale-[0.95] cursor-pointer border border-emerald-200"><Tag size={14} />صفحه محصول</button>}
                  </div>
                )}

                {step === 1 ? (
                  <div className="flex items-center gap-2 mr-auto w-full sm:w-auto justify-end">
                    <button onClick={() => { onAddToCart(product, cartons); onClose(); }} className="bg-emerald-100 hover:bg-emerald-200 text-emerald-900 px-5 py-2.5 rounded-full text-xs font-black flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.95] cursor-pointer border border-emerald-300/40 flex-1 sm:flex-initial"><ShoppingCart size={16} />افزودن به سبد</button>
                    <button onClick={handleNextStep} className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-full text-xs font-black flex items-center justify-center gap-1.5 transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95] cursor-pointer flex-1 sm:flex-initial">خرید نهایی <ArrowLeft size={14} /></button>
                  </div>
                ) : step < 4 ? (
                  <button onClick={handleNextStep} className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-2.5 rounded-full text-xs font-black flex items-center gap-1.5 transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95] cursor-pointer mr-auto">گام بعدی <ArrowLeft size={14} /></button>
                ) : (
                  <button onClick={handleOrderSubmit} className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-2.5 rounded-full text-xs font-black flex items-center gap-1.5 transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.95] cursor-pointer mr-auto">تأیید نهایی <CheckCircle2 size={14} /></button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
