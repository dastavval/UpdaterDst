import React, { useState, useEffect, memo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Plus, Minus, Package, Factory, Sparkles, Bell, Check, X, TrendingDown, TrendingUp, Building2, Eye, ShieldCheck, Zap, Percent, CheckCircle2, ShoppingCart, Lock, Award, Tag } from "lucide-react";
import { Product } from "../types";
import { getDisplayImageUrl } from "../lib/image-utils";
import { HealthBadgesStrip, HealthCertModal, HealthAppleLogo } from "./HealthAppleBadge";
import { getProductRolePricing, toPersianDigits } from "../lib/pricing";

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product, quantityCartons: number) => void;
  userBadge?: 'bronze' | 'silver' | 'gold' | 'vip' | 'admin';
  user?: any;
  onRequireAuth?: () => void;
  onCompare?: (product: Product) => void;
  isComparing?: boolean;
  onViewDetails?: (product: Product) => void;
  index?: number;
}

const ProductCard = memo(({ product, onAddToCart, userBadge, user, onRequireAuth, onCompare, isComparing, onViewDetails, index = 0 }: ProductCardProps) => {
  const minCartonsLimit = Math.max(5, product.min_order_cartons || 5);
  const [cartons, setCartons] = useState(minCartonsLimit);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [hasPriceAlert, setHasPriceAlert] = useState(false);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [targetPriceInput, setTargetPriceInput] = useState("");
  const [alertSuccessMsg, setAlertSuccessMsg] = useState<string | null>(null);
  const [showHealthCertModal, setShowHealthCertModal] = useState(false);
  const [isAddedFeedback, setIsAddedFeedback] = useState(false);
  const [showPriceDetails, setShowPriceDetails] = useState(false);

  useEffect(() => {
    if (cartons < minCartonsLimit) {
      setCartons(minCartonsLimit);
    }
  }, [minCartonsLimit]);

  const toPersianNum = (num: number | string) => toPersianDigits(num);

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

  // Compute Dynamic Multi-Tier Role Pricing
  const pricing = getProductRolePricing(product, user, userBadge);
  const discountedBulkPrice = pricing.unitWholesalePrice;
  const displayConsumerPrice = pricing.displayConsumerPrice;
  const pricePerCarton = pricing.pricePerCarton;
  const profitPerCarton = pricing.profitPerCartonVsConsumer;
  const profitPercent = pricing.profitMarginPercent;

  // Check if price alert is set
  useEffect(() => {
    try {
      const saved = localStorage.getItem("dastavval_price_alerts");
      if (saved) {
        const alerts = JSON.parse(saved);
        const exists = alerts.some((a: any) => a.productId === product.id);
        setHasPriceAlert(exists);
      }
    } catch (e) {}
  }, [product.id]);

  const handleTogglePriceAlert = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasPriceAlert) {
      // Remove alert
      try {
        const saved = localStorage.getItem("dastavval_price_alerts");
        if (saved) {
          const alerts = JSON.parse(saved).filter((a: any) => a.productId !== product.id);
          localStorage.setItem("dastavval_price_alerts", JSON.stringify(alerts));
          setHasPriceAlert(false);
          window.dispatchEvent(new CustomEvent("dastavval-price-alert-changed"));
        }
      } catch (err) {}
    } else {
      // Open modal to set target price
      const suggestedTarget = Math.round(discountedBulkPrice * 0.95);
      setTargetPriceInput(suggestedTarget.toString());
      setShowAlertModal(true);
    }
  };

  const handleSavePriceAlert = (targetPriceNum: number) => {
    try {
      const saved = localStorage.getItem("dastavval_price_alerts");
      const alerts = saved ? JSON.parse(saved) : [];
      const newAlert = {
        id: "alert-" + Date.now(),
        productId: product.id,
        productName: product.name,
        productImage: product.image_url,
        brand: product.brand,
        category: product.category,
        originalPrice: discountedBulkPrice,
        targetPrice: targetPriceNum,
        currentPrice: discountedBulkPrice,
        createdAt: new Date().toLocaleDateString('fa-IR'),
        isTriggered: discountedBulkPrice <= targetPriceNum
      };
      const updated = [newAlert, ...alerts.filter((a: any) => a.productId !== product.id)];
      localStorage.setItem("dastavval_price_alerts", JSON.stringify(updated));
      setHasPriceAlert(true);
      setShowAlertModal(false);
      setAlertSuccessMsg("هشدار قیمت با موفقیت ثبت شد");
      setTimeout(() => setAlertSuccessMsg(null), 3000);
      window.dispatchEvent(new CustomEvent("dastavval-price-alert-changed"));
    } catch (e) {}
  };

  const handleIncrement = () => {
    setCartons(prev => prev + 1);
  };

  const handleDecrement = () => {
    setCartons(prev => Math.max(minCartonsLimit, prev - 1));
  };

  const handleAddWithFeedback = () => {
    onAddToCart(product, cartons);
    setIsAddedFeedback(true);
    setTimeout(() => setIsAddedFeedback(false), 1600);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "100px" }}
      transition={{ 
        duration: 0.4, 
        delay: (index % 4) * 0.05, 
        ease: [0.21, 0.47, 0.32, 0.98] 
      }}
      className="bg-white rounded-[2rem] border border-slate-200/70 shadow-sm hover:shadow-2xl hover:shadow-emerald-500/10 hover:border-emerald-500/40 transition-all duration-500 group flex flex-col relative h-full overflow-hidden"
    >
      {/* Top Accent Line for Featured */}
      {product.isFeatured && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-emerald-600 via-teal-500 to-amber-400 z-10" />
      )}

      {/* Product Image Section */}
      <div 
        onClick={() => onViewDetails?.(product)}
        className="relative aspect-square w-full overflow-hidden bg-white cursor-pointer border-b border-slate-100 flex items-center justify-center group/img"
      >
        {/* Subtle Backdrop Glow */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.03)_0%,transparent_70%)] opacity-0 group-hover/img:opacity-100 transition-opacity duration-700" />

        {/* High Margin Floating Indicator */}
        {((product.consumer_price || product.price) - product.bulk_price) > 5000 && (
           <div className="absolute top-3 right-3 z-[15]">
             <motion.div 
               animate={{ scale: [1, 1.05, 1], opacity: [0.95, 1, 0.95] }}
               transition={{ repeat: Infinity, duration: 3 }}
               className="bg-emerald-600/95 backdrop-blur-md text-white px-3 py-1 rounded-xl text-[10px] font-black flex items-center gap-1.5 shadow-md shadow-emerald-600/20 border border-white/20"
             >
               <TrendingUp size={12} className="animate-bounce" />
               سود ویژه بنکداری
             </motion.div>
           </div>
        )}

        {imageError || !product.image_url ? (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-4 text-slate-300">
            <Package size={42} className="stroke-[1.25]" />
            <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">DIRECT SUPPLY</span>
          </div>
        ) : (
          <>
            {!imageLoaded && (
              <div className="absolute inset-0 bg-slate-100 flex items-center justify-center z-[1] overflow-hidden">
                <div className="w-full h-full bg-linear-to-r from-transparent via-white/50 to-transparent -translate-x-full animate-shimmer" />
              </div>
            )}
            <img 
              src={getDisplayImageUrl(product.image_url)} 
              alt={product.name}
              onLoad={() => setImageLoaded(true)}
              className={`w-full h-full object-contain p-1 transition-all duration-500 ease-out group-hover/img:scale-105 ${
                imageLoaded ? 'opacity-100 blur-0' : 'opacity-0 blur-md scale-95'
              }`}
              referrerPolicy="no-referrer"
              onError={() => { 
                setImageLoaded(true);
                setImageError(true);
              }}
            />
          </>
        )}
        
        {/* Quick View Trigger Overlay */}
        <div className="absolute inset-0 bg-white/20 opacity-0 group-hover/img:opacity-100 transition-opacity duration-500 flex items-center justify-center backdrop-blur-[2px]">
          <div className="bg-white text-slate-950 px-6 py-2.5 rounded-2xl text-[11px] font-black shadow-2xl flex items-center gap-2 transform translate-y-4 group-hover/img:translate-y-0 transition-all duration-500 border border-slate-100 scale-90 group-hover/img:scale-100">
            <Eye size={14} className="text-emerald-600" />
            تحلیل حاشیه سود
          </div>
        </div>

        {/* Action Icons Bar */}
        <div className="absolute bottom-3 right-3 flex flex-col gap-2 transform translate-x-12 group-hover/img:translate-x-0 transition-transform duration-500">
          <button
            onClick={handleTogglePriceAlert}
            className={`p-2.5 rounded-xl transition-all shadow-xl cursor-pointer flex items-center justify-center ${
              hasPriceAlert
                ? "bg-amber-500 text-slate-950 ring-2 ring-amber-300"
                : "bg-white text-slate-600 hover:bg-emerald-600 hover:text-white border border-slate-100"
            }`}
          >
            <Bell size={14} className={hasPriceAlert ? "fill-slate-950" : ""} />
          </button>
        </div>
      </div>

      {/* Info Section */}
      <div className="p-4 flex flex-col gap-3 text-right flex-1" dir="rtl">
        <div className="space-y-1">
          <div className="flex justify-between items-center text-[10px] font-bold">
            <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60 font-black">
              {product.category}
            </span>
            <span className="text-slate-400 font-bold">{product.brand}</span>
          </div>

          <h3 
            onClick={() => onViewDetails?.(product)}
            className="text-xs sm:text-sm font-black text-slate-900 leading-snug line-clamp-2 group-hover:text-emerald-700 transition-colors cursor-pointer"
          >
            {product.name}
          </h3>

          <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500">
            <Factory size={11} className="text-emerald-600 shrink-0" />
            <span className="truncate">تامین: {product.factory_name || product.brand}</span>
          </div>
        </div>

        {/* Multi-Tier Role Pricing Architecture */}
        <div className="mt-auto space-y-2">
          <div className="bg-slate-50/95 p-3 rounded-2xl border border-slate-200/80 space-y-2">
            {/* Role Header Badge */}
            <div className="flex justify-between items-center text-[10px]">
              <span className={`px-2 py-0.5 rounded-md font-bold text-[9.5px] border ${pricing.badgeColor}`}>
                {pricing.badgeLabel}
              </span>
              <span className="text-slate-400 font-bold text-[9px]">{pricing.roleTitleFa}</span>
            </div>

            {/* Wholesale Unit Price Display */}
            <div className="flex justify-between items-center pt-0.5">
              <span className="text-[10px] font-black text-slate-600">{pricing.priceTagLabel}:</span>
              <div className="flex flex-col items-end">
                {pricing.isRepresentative && pricing.displayConsumerPrice > discountedBulkPrice && (
                  <span className="text-[9px] text-slate-400 line-through font-mono opacity-60">
                    {toPersianNum(pricing.floorFactoryUnitPrice * 1.10)}
                  </span>
                )}
                <span className="font-mono text-emerald-800 font-black text-xs sm:text-sm">
                  {toPersianNum(discountedBulkPrice.toLocaleString())}
                  <span className="text-[9px] font-bold text-slate-400 mr-1">تومان</span>
                </span>
              </div>
            </div>

            {/* Micro Tier Upsell & Margin Hint */}
            <div className="text-[9px] leading-tight text-slate-500 font-medium bg-white/90 p-1.5 rounded-lg border border-slate-200/50">
              {pricing.isRepresentative ? (
                <span className="text-emerald-700 font-bold flex items-center gap-1">
                  <Award size={11} className="text-emerald-600 shrink-0" />
                  <span>نرخ کف کارخانه برای عاملیت فعال است (۱۰٪ ارزان‌تر)</span>
                </span>
              ) : pricing.isMarketer ? (
                <span className="text-purple-700 font-bold flex items-center gap-1">
                  <Percent size={11} className="text-purple-600 shrink-0" />
                  <span>پورسانت واریزی: +{toPersianNum(pricing.marketerCommissionPerCarton.toLocaleString())} تومان در هر کارتن</span>
                </span>
              ) : (
                <span className="text-slate-600 flex items-center gap-1">
                  <Tag size={10} className="text-indigo-500 shrink-0" />
                  <span>تضمین اصالت بار مستقیم از خط تولید کارخانه</span>
                </span>
              )}
            </div>

            {/* Collapsible Pricing & Margin Detail Button */}
            <button
              type="button"
              onClick={() => setShowPriceDetails(!showPriceDetails)}
              className="w-full flex items-center justify-between text-[9px] font-black text-slate-500 hover:text-emerald-700 transition-colors bg-white/80 p-1.5 rounded-lg border border-slate-200/50 cursor-pointer"
            >
              <span className="flex items-center gap-1">📊 آنالیز سود و نرخ مصرف‌کننده</span>
              <span className="text-[8px] font-bold text-slate-400">
                {showPriceDetails ? "بستن ↑" : "جزئیات ↓"}
              </span>
            </button>

            {/* Collapsible pricing detail block */}
            <AnimatePresence initial={false}>
              {showPriceDetails && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden space-y-2 pt-2 border-t border-slate-200/60 text-[10px] flex flex-col"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-[8.5px] font-bold text-slate-400">نرخ مصوب مصرف‌کننده:</span>
                    <span className="font-black text-slate-700 font-mono">
                      {toPersianNum(displayConsumerPrice.toLocaleString())} ت
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[8.5px] font-bold text-emerald-600">سود هر کارتن ({toPersianNum(profitPercent)}٪):</span>
                    <span className="font-black text-emerald-700 font-mono">
                      +{toPersianNum(profitPerCarton.toLocaleString())} ت
                    </span>
                  </div>
                  {pricing.isRepresentative && (
                    <div className="flex justify-between items-center bg-emerald-50/70 p-1 rounded-md text-[8.5px] font-bold text-emerald-800">
                      <span>مزیت انحصاری عاملیت:</span>
                      <span>+{toPersianNum(pricing.repSavingsPerCarton.toLocaleString())} تومان در هر کارتن</span>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Packing & Total */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-1.5">
              <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                <Package size={13} />
              </div>
              <div className="flex flex-col">
                <span className="text-[8px] font-bold text-slate-400 uppercase">بسته‌بندی</span>
                <span className="text-[10px] font-black text-slate-800">
                  {toPersianNum(product.carton_pack_count)} {product.unit || "عدد"} در کارتن
                </span>
              </div>
            </div>
            <div className="text-left">
              <span className="text-[8px] font-bold text-slate-400 block mb-0.5 uppercase">
                قیمت هر کارتن
              </span>
              <span className="text-[11px] font-black text-indigo-900 font-mono">
                {toPersianNum(pricePerCarton.toLocaleString())} ت
              </span>
            </div>
          </div>

          {/* Quantity Controls & Call-to-Action */}
          <div className="space-y-1.5 pt-0.5">
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-slate-50 p-0.5 rounded-xl border border-slate-200/80 shrink-0">
                <button 
                  onClick={handleDecrement} 
                  className="w-7 h-7 flex items-center justify-center text-slate-600 hover:bg-white hover:text-emerald-600 rounded-lg transition-all cursor-pointer disabled:opacity-30" 
                  disabled={cartons <= minCartonsLimit}
                  title="کاهش تعداد کارتن"
                >
                  <Minus size={13} />
                </button>
                <span className="w-7 text-center text-xs font-black font-mono text-slate-900">{toPersianNum(cartons)}</span>
                <button 
                  onClick={handleIncrement} 
                  className="w-7 h-7 flex items-center justify-center text-slate-600 hover:bg-white hover:text-emerald-600 rounded-lg transition-all cursor-pointer"
                  title="افزایش تعداد کارتن"
                >
                  <Plus size={13} />
                </button>
              </div>

              <button 
                onClick={handleAddWithFeedback}
                className={`flex-1 h-9 rounded-xl font-black text-[11px] flex items-center justify-center gap-1.5 transition-all shadow-2xs hover:shadow-xs hover:scale-[1.02] active:scale-[0.98] cursor-pointer ${
                  isAddedFeedback
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-emerald-700 hover:bg-emerald-800 text-white shadow-emerald-700/15"
                }`}
              >
                {isAddedFeedback ? (
                  <>
                    <CheckCircle2 size={15} />
                    <span>اضافه شد ({toPersianNum(cartons)} کارتن)</span>
                  </>
                ) : (
                  <>
                    <ShoppingCart size={15} />
                    <span>ثبت در سبد ({toPersianNum(cartons)} کارتن)</span>
                  </>
                )}
              </button>
            </div>

            {/* Minimum Order & Factory Direct Badge */}
            <div className="flex items-center justify-between pt-0.5 px-0.5 text-[9px] text-slate-400 font-bold">
              <span className="flex items-center gap-1 text-emerald-700 font-black">
                <ShieldCheck size={11} className="text-emerald-600" />
                تضمین بار تازه خط تولید
              </span>
              <span className="text-slate-500 font-black bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200/60">
                حداقل سفارش: {toPersianNum(minCartonsLimit)} کارتن
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Success Toast Banner */}
      <AnimatePresence>
        {alertSuccessMsg && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-2 left-2 right-2 z-30 bg-indigo-50 border border-indigo-100 text-indigo-900 px-3 py-2 rounded-xl text-[10px] font-black flex items-center justify-between shadow-lg"
          >
            <span className="flex items-center gap-1.5">
              <Check size={12} className="text-emerald-600" />
              {alertSuccessMsg}
            </span>
            <button onClick={() => setAlertSuccessMsg(null)} className="text-indigo-400 hover:text-indigo-600">
              <X size={12} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Price Alert Target Modal */}
      <AnimatePresence>
        {showAlertModal && (
          <div className="fixed inset-0 z-50 bg-slate-400/50 backdrop-blur-sm flex items-center justify-center p-4 text-right" dir="rtl">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-5 max-w-sm w-full space-y-4 shadow-2xl border border-slate-100"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2 text-slate-900">
                  <div className="p-2 bg-amber-50 rounded-xl text-amber-600">
                    <Bell size={18} />
                  </div>
                  <div>
                    <h3 className="font-black text-xs">تعیین هشدار قیمت کالا</h3>
                    <p className="text-[10px] text-slate-400 font-bold">{product.name}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowAlertModal(false)}
                  className="p-1 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-3">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1">
                  <div className="flex justify-between text-[11px] font-bold text-slate-600">
                    <span>قیمت عمده فعلی (درب کارخانه):</span>
                    <span className="font-mono font-black text-emerald-700">{toPersianNum(discountedBulkPrice.toLocaleString())} تومان</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-slate-700 block">
                    قیمت هدف برای ارسال اعلان (تومان):
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={targetPriceInput}
                    onChange={(e) => {
                      const clean = toEnglishNum(e.target.value).replace(/[^0-9]/g, '');
                      setTargetPriceInput(clean);
                    }}
                    placeholder="مثلاً ۲۵۰۰۰"
                    className="w-full py-2 px-3 border border-slate-200 rounded-xl text-xs font-mono font-black outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 text-left dir-ltr"
                  />
                </div>

                {/* Quick Presets */}
                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-slate-400 block">میانبرهای سریع:</span>
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setTargetPriceInput(Math.round(discountedBulkPrice * 0.95).toString())}
                      className="py-1.5 bg-amber-50 text-amber-800 text-[10px] font-black rounded-lg border border-amber-200 hover:bg-amber-100 transition-all"
                    >
                      ۵٪ تخفیف بیشتر
                    </button>
                    <button
                      type="button"
                      onClick={() => setTargetPriceInput(Math.round(discountedBulkPrice * 0.90).toString())}
                      className="py-1.5 bg-amber-50 text-amber-800 text-[10px] font-black rounded-lg border border-amber-200 hover:bg-amber-100 transition-all"
                    >
                      ۱۰٪ تخفیف بیشتر
                    </button>
                    <button
                      type="button"
                      onClick={() => setTargetPriceInput(discountedBulkPrice.toString())}
                      className="py-1.5 bg-slate-100 text-slate-700 text-[10px] font-black rounded-lg border border-slate-200 hover:bg-slate-200 transition-all"
                    >
                      هر کاهش قیمتی
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowAlertModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition-all"
                >
                  انصراف
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const num = parseInt(targetPriceInput, 10);
                    if (num > 0) {
                      handleSavePriceAlert(num);
                    }
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Bell size={14} className="fill-slate-950" />
                  ثبت هشدار قیمت
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Health Certification Modal */}
      <HealthCertModal
        product={product}
        isOpen={showHealthCertModal}
        onClose={() => setShowHealthCertModal(false)}
      />
    </motion.div>
  );
});

export default ProductCard;

