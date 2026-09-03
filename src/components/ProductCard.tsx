import React, { useState, useEffect, memo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Plus, Minus, Package, Factory, Sparkles, Bell, Check, X, TrendingDown, TrendingUp, Building2, Eye, ShieldCheck, Zap, Percent, CheckCircle2, ShoppingCart, Lock, Award, Tag, Heart } from "lucide-react";
import { Product } from "../types";
import { getDisplayImageUrl, cleanUnitName } from "../lib/image-utils";
import { ProductImage } from "./ProductImage";
import { HealthBadgesStrip, HealthCertModal, HealthAppleLogo } from "./HealthAppleBadge";
import { getProductRolePricing, toPersianDigits } from "../lib/pricing";

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product, quantityCartons: number) => void;
  userBadge?: 'bronze' | 'silver' | 'gold' | 'vip' | 'admin';
  user?: any;
  b2bConfig?: any;
  onRequireAuth?: () => void;
  onCompare?: (product: Product) => void;
  isComparing?: boolean;
  onViewDetails?: (product: Product) => void;
  index?: number;
}

const ProductCard = memo(({ product, onAddToCart, userBadge, user, b2bConfig, onRequireAuth, onCompare, isComparing, onViewDetails, index = 0 }: ProductCardProps) => {
  const minCartonsLimit = Math.max(5, product.min_order_cartons || 5);
  const [cartons, setCartons] = useState(minCartonsLimit);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const handleImageError = () => {
    if (retryCount < 2) {
      setTimeout(() => {
        setRetryCount(prev => prev + 1);
        setImageError(false);
      }, 1000);
    } else {
      setImageError(true);
    }
  };
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
  const pricing = getProductRolePricing(product, user, userBadge, b2bConfig);
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

  const [isBookmarked, setIsBookmarked] = useState(false);

  // Check if bookmarked
  const checkBookmark = () => {
    try {
      const saved = localStorage.getItem("dastavval_wishlist");
      if (saved) {
        const list = JSON.parse(saved);
        setIsBookmarked(list.includes(product.id));
      } else {
        setIsBookmarked(false);
      }
    } catch (e) {
      setIsBookmarked(false);
    }
  };

  useEffect(() => {
    checkBookmark();
    window.addEventListener("dastavval-wishlist-changed", checkBookmark);
    return () => {
      window.removeEventListener("dastavval-wishlist-changed", checkBookmark);
    };
  }, [product.id]);

  const handleToggleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const saved = localStorage.getItem("dastavval_wishlist");
      let list = saved ? JSON.parse(saved) : [];
      if (list.includes(product.id)) {
        list = list.filter((id: string) => id !== product.id);
        setIsBookmarked(false);
      } else {
        list.push(product.id);
        setIsBookmarked(true);
      }
      localStorage.setItem("dastavval_wishlist", JSON.stringify(list));
      window.dispatchEvent(new CustomEvent("dastavval-wishlist-changed"));
    } catch (err) {}
  };

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
      initial={{ opacity: 0, y: 24, scale: 0.98 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-30px", amount: 0.05 }}
      transition={{ 
        duration: 0.35, 
        ease: [0.16, 1, 0.3, 1],
        delay: Math.min((index % 4) * 0.04, 0.16)
      }}
      style={{ willChange: "transform, opacity" }}
      className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-emerald-500/40 transition-shadow duration-300 group flex flex-col relative h-full overflow-hidden transform-gpu"
    >
      {/* Top Accent Line for Featured */}
      {product.isFeatured && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-linear-to-r from-emerald-600 to-amber-400 z-10" />
      )}

      {/* Product Image Section */}
      <div 
        onClick={() => onViewDetails?.(product)}
        className="relative aspect-square w-full overflow-hidden bg-white cursor-pointer border-b border-slate-50 flex items-center justify-center group/img"
      >
        {/* Subtle Backdrop Glow */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.02)_0%,transparent_70%)] opacity-0 group-hover/img:opacity-100 transition-opacity duration-700" />

        {/* High Margin Floating Indicator */}
        {((product.consumer_price || product.price) - product.bulk_price) > 5000 && (
           <div className="absolute top-2.5 right-2.5 z-[15]">
             <motion.div 
               animate={{ y: [0, -2, 0] }}
               transition={{ repeat: Infinity, duration: 4 }}
               className="bg-emerald-600 text-white px-2.5 py-1 rounded-lg text-[9px] font-black flex items-center gap-1 shadow-lg shadow-emerald-600/10"
             >
               <TrendingUp size={10} />
               سود ویژه
             </motion.div>
           </div>
        )}

        <ProductImage 
          src={product.image_url} 
          alt={product.name}
          className="w-full h-full object-contain p-2.5 transition-all duration-700 ease-out group-hover/img:scale-105"
        />
        
        {/* Action Icons Bar */}
        <div className="absolute bottom-2.5 right-2.5 flex flex-col gap-2 transform translate-x-12 group-hover/img:translate-x-0 transition-transform duration-500">
          <button
            onClick={handleToggleBookmark}
            className={`w-8 h-8 rounded-lg transition-all shadow-lg cursor-pointer flex items-center justify-center ${
              isBookmarked
                ? "bg-rose-500 text-white"
                : "bg-white/90 backdrop-blur-md text-slate-600 hover:bg-rose-500 hover:text-white border border-slate-100"
            }`}
            title={isBookmarked ? "حذف از نشان‌شده‌ها" : "نشان‌گذاری کالا"}
          >
            <Heart size={13} className={isBookmarked ? "fill-white" : ""} />
          </button>

          <button
            onClick={handleTogglePriceAlert}
            className={`w-8 h-8 rounded-lg transition-all shadow-lg cursor-pointer flex items-center justify-center ${
              hasPriceAlert
                ? "bg-emerald-600 text-white"
                : "bg-white/90 backdrop-blur-md text-slate-600 hover:bg-emerald-600 hover:text-white border border-slate-100"
            }`}
            title="ثبت هشدار قیمت"
          >
            <Bell size={13} className={hasPriceAlert ? "fill-slate-900" : ""} />
          </button>
        </div>
      </div>

      {/* Info Section */}
      <div className="p-3.5 flex flex-col gap-2.5 text-right flex-1" dir="rtl">
        <div className="space-y-1">
          <div className="flex justify-between items-center text-[8px] sm:text-[9px] font-black gap-1 flex-wrap">
            <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 shrink-0">
              {product.category}
            </span>
            <span className="text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded text-[8px] sm:text-[8.5px] font-bold flex items-center gap-1.5 truncate max-w-[120px] sm:max-w-none border border-slate-200/50" title="تولیدکننده رسمی صنایع غذایی">
              {product.brandLogoUrl ? (
                <div className="w-4 h-4 bg-white rounded-md border border-slate-200 p-0.5 flex items-center justify-center overflow-hidden shrink-0 shadow-[inset_0_1px_4px_rgba(0,0,0,0.05)]">
                  <img src={product.brandLogoUrl} alt={product.brand} className="w-full h-full object-contain" />
                </div>
              ) : (
                <Factory size={10} className="text-slate-500" />
              )}
              <span className="truncate">{product.brand || "تولیدکننده رسمی"}</span>
              <div className="flex items-center gap-0.5 shrink-0">
                <CheckCircle2 size={8} className="text-emerald-500" />
                <Lock size={8} className="text-amber-500" />
              </div>
            </span>
          </div>

          <h3 
            onClick={() => onViewDetails?.(product)}
            className="text-[10px] sm:text-xs font-black text-slate-800 leading-snug line-clamp-2 sm:line-clamp-2 min-h-[1.8rem] sm:min-h-[2.4rem] group-hover:text-emerald-700 transition-colors cursor-pointer"
          >
            {product.name}
          </h3>
          <div className="flex items-center justify-between gap-1.5 mt-0.5">
            <span className="text-[9px] sm:text-[10px] font-black text-emerald-600 truncate max-w-[120px] sm:max-w-none">
              {profitPercent > 0 ? `${toPersianNum(profitPercent)}٪ حاشیه سود` : 'نرخ مستقیم کارخانه'}
            </span>
            <span className="text-[8px] text-slate-400 font-bold bg-slate-50 px-1 py-0.2 rounded border border-slate-100 shrink-0">
              آگهی کارخانه
            </span>
          </div>
        </div>

        {/* Pricing Architecture - Streamlined */}
        <div className="mt-auto space-y-1.5 sm:space-y-2.5">
          <div className="bg-slate-50 p-1.5 sm:p-2.5 rounded-xl sm:rounded-2xl border border-slate-100/80 space-y-1 sm:space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-[8px] sm:text-[9px] font-black text-slate-400">نرخ عمده:</span>
              <div className="flex items-baseline gap-0.5">
                <span className="font-mono text-emerald-800 font-black text-xs sm:text-sm">
                  {toPersianNum(discountedBulkPrice.toLocaleString())}
                </span>
                <span className="text-[7px] sm:text-[8px] font-bold text-slate-400">تومان</span>
              </div>
            </div>

            <div className="flex justify-between items-center pt-1 border-t border-slate-200/50">
              <div className="flex flex-col">
                <span className="text-[7px] sm:text-[8px] font-bold text-slate-400">بسته‌بندی</span>
                <span className="text-[8px] sm:text-[9px] font-black text-slate-600 truncate max-w-[50px] sm:max-w-none">
                  {toPersianNum(product.carton_pack_count)} {cleanUnitName(product.unit)}
                </span>
              </div>
              <div className="text-left">
                <span className="text-[7px] sm:text-[8px] font-bold text-slate-400 block">فاکتور کارتن</span>
                <span className="text-[9px] sm:text-[10px] font-black text-indigo-900 font-mono">
                  {toPersianNum(pricePerCarton.toLocaleString())} <span className="text-[7px]">ت</span>
                </span>
              </div>
            </div>
          </div>

          {/* Quantity & CTA */}
          <div className="flex items-center gap-1 sm:gap-2">
            <div className="flex items-center bg-white border border-slate-200 rounded-lg sm:rounded-xl p-0.5">
              <button 
                onClick={handleDecrement} 
                className="w-5 h-5 sm:w-7 sm:h-7 flex items-center justify-center text-slate-400 hover:text-emerald-600 transition-colors cursor-pointer disabled:opacity-20" 
                disabled={cartons <= minCartonsLimit}
              >
                <Minus size={10} />
              </button>
              <span className="w-5 sm:w-6 text-center text-[10px] sm:text-[11px] font-black font-mono text-slate-700">{toPersianNum(cartons)}</span>
              <button 
                onClick={handleIncrement} 
                className="w-5 h-5 sm:w-7 sm:h-7 flex items-center justify-center text-slate-400 hover:text-emerald-600 transition-colors cursor-pointer"
              >
                <Plus size={10} />
              </button>
            </div>

            <button 
              onClick={handleAddWithFeedback}
              className={`flex-1 h-7 sm:h-9 rounded-full font-black text-[9px] sm:text-[10px] flex items-center justify-center gap-1.5 transition-all duration-250 active:scale-[0.93] hover:scale-[1.01] cursor-pointer ${
                isAddedFeedback
                  ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                  : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs hover:shadow-md active:shadow-xs"
              }`}
            >
              {isAddedFeedback ? (
                <>
                  <CheckCircle2 size={11} className="shrink-0 text-emerald-700" />
                  <span className="tracking-wide">ثبت شد</span>
                </>
              ) : (
                <>
                  <ShoppingCart size={11} className="shrink-0" />
                  <span className="tracking-wide">سبد خرید</span>
                </>
              )}
            </button>
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
            className="absolute bottom-2 left-2 right-2 z-30 bg-emerald-50 border border-emerald-100 text-indigo-900 px-3 py-2 rounded-xl text-[10px] font-black flex items-center justify-between shadow-lg"
          >
            <span className="flex items-center gap-1.5">
              <Check size={12} className="text-emerald-600" />
              {alertSuccessMsg}
            </span>
            <button onClick={() => setAlertSuccessMsg(null)} className="text-indigo-400 hover:text-emerald-600">
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
                  <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
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
                    className="w-full py-2 px-3 border border-slate-200 rounded-xl text-xs font-mono font-black outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 text-left dir-ltr"
                  />
                </div>

                {/* Quick Presets */}
                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-slate-400 block">میانبرهای سریع:</span>
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setTargetPriceInput(Math.round(discountedBulkPrice * 0.95).toString())}
                      className="py-1.5 bg-emerald-50 text-amber-800 text-[10px] font-black rounded-lg border border-emerald-200 hover:bg-emerald-100 transition-all"
                    >
                      ۵٪ تخفیف بیشتر
                    </button>
                    <button
                      type="button"
                      onClick={() => setTargetPriceInput(Math.round(discountedBulkPrice * 0.90).toString())}
                      className="py-1.5 bg-emerald-50 text-amber-800 text-[10px] font-black rounded-lg border border-emerald-200 hover:bg-emerald-100 transition-all"
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
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
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

