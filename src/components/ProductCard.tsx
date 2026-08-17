import React, { useState, useEffect, memo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Plus, Minus, Package, Factory, Sparkles, Bell, Check, X, TrendingDown, TrendingUp, Building2, Eye, ShieldCheck, Zap, Percent, CheckCircle2, ShoppingCart } from "lucide-react";
import { Product } from "../types";
import { getDisplayImageUrl } from "../lib/image-utils";
import { HealthBadgesStrip, HealthCertModal, HealthAppleLogo } from "./HealthAppleBadge";

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product, quantityCartons: number) => void;
  userBadge?: 'bronze' | 'silver' | 'gold' | 'vip' | 'admin';
  onCompare?: (product: Product) => void;
  isComparing?: boolean;
  onViewDetails?: (product: Product) => void;
  index?: number;
}

const ProductCard = memo(({ product, onAddToCart, userBadge, onCompare, isComparing, onViewDetails, index = 0 }: ProductCardProps) => {
  const [cartons, setCartons] = useState(product.min_order_cartons || 1);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [hasPriceAlert, setHasPriceAlert] = useState(false);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [targetPriceInput, setTargetPriceInput] = useState("");
  const [alertSuccessMsg, setAlertSuccessMsg] = useState<string | null>(null);
  const [showHealthCertModal, setShowHealthCertModal] = useState(false);
  const [isAddedFeedback, setIsAddedFeedback] = useState(false);

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

  const currentDiscountPercent = getDiscountPercent(userBadge);
  const discountedBulkPrice = currentDiscountPercent > 0 
    ? Math.round(product.bulk_price * (1 - currentDiscountPercent / 100))
    : product.bulk_price;

  const displayConsumerPrice = product.consumer_price || product.price;
  const pricePerCarton = discountedBulkPrice * product.carton_pack_count;
  const discountPercent = Math.max(0, Math.round(((displayConsumerPrice - discountedBulkPrice) / displayConsumerPrice) * 100));

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
    setCartons(prev => Math.max(product.min_order_cartons || 1, prev - 1));
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
      viewport={{ once: true, margin: "-20px" }}
      transition={{ 
        duration: 0.4, 
        delay: (index % 4) * 0.05, 
        ease: [0.21, 0.47, 0.32, 0.98] 
      }}
      className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-md hover:border-emerald-300 transition-all duration-300 group flex flex-col relative h-full overflow-hidden"
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
        <div className="absolute inset-0 bg-slate-950/20 opacity-0 group-hover/img:opacity-100 transition-opacity duration-500 flex items-center justify-center backdrop-blur-[2px]">
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
            <Building2 size={11} className="text-emerald-600 shrink-0" />
            <span className="truncate">تامین: {product.factory_name || product.brand}</span>
          </div>
        </div>

        {/* Pricing Architecture */}
        <div className="mt-auto space-y-3">
          <div className="bg-slate-50/90 p-3 rounded-xl border border-slate-200/70 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black text-slate-500">قیمت بنکداری:</span>
              <div className="flex flex-col items-end">
                {discountPercent > 0 && product.bulk_price > discountedBulkPrice && (
                  <span className="text-[9px] text-slate-400 line-through font-mono opacity-60">
                    {toPersianNum(product.bulk_price.toLocaleString())}
                  </span>
                )}
                <span className="font-mono text-emerald-800 font-black text-sm sm:text-base">
                  {toPersianNum(discountedBulkPrice.toLocaleString())}
                  <span className="text-[9px] font-bold text-slate-400 mr-1">تومان</span>
                </span>
              </div>
            </div>

            <div className="h-px bg-slate-200/50" />

            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-0.5">
                <span className="text-[8px] font-bold text-slate-400">قیمت مصرف‌کننده:</span>
                <span className="text-[10px] font-black text-slate-700">
                  {toPersianNum(displayConsumerPrice.toLocaleString())} ت
                </span>
              </div>
              <div className="flex flex-col gap-0.5 items-end">
                <span className="text-[8px] font-bold text-amber-600">سود ناخالص واحد:</span>
                <span className="text-[10px] font-black text-emerald-700">
                  {toPersianNum((displayConsumerPrice - discountedBulkPrice).toLocaleString())} ت
                </span>
              </div>
            </div>
          </div>

          {/* Packing & Total */}
          <div className="flex items-center justify-between px-0.5">
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
              <span className="text-[8px] font-bold text-slate-400 block mb-0.5 uppercase">قیمت کارتن</span>
              <span className="text-[11px] font-black text-indigo-900 font-mono">
                {toPersianNum(pricePerCarton.toLocaleString())}
              </span>
            </div>
          </div>

          {/* Quantity Controls & Call-to-Action */}
          <div className="flex items-center gap-2 pt-1">
            <div className="flex items-center bg-slate-50 p-0.5 rounded-xl border border-slate-200/80 shrink-0">
              <button 
                onClick={handleDecrement} 
                className="w-7 h-7 flex items-center justify-center text-slate-600 hover:bg-white hover:text-emerald-600 rounded-lg transition-all cursor-pointer disabled:opacity-30" 
                disabled={cartons <= (product.min_order_cartons || 1)}
              >
                <Minus size={13} />
              </button>
              <span className="w-7 text-center text-xs font-black font-mono text-slate-900">{toPersianNum(cartons)}</span>
              <button 
                onClick={handleIncrement} 
                className="w-7 h-7 flex items-center justify-center text-slate-600 hover:bg-white hover:text-emerald-600 rounded-lg transition-all cursor-pointer"
              >
                <Plus size={13} />
              </button>
            </div>

            <button 
              onClick={handleAddWithFeedback}
              className={`flex-1 h-9 rounded-xl font-black text-[11px] flex items-center justify-center gap-1.5 transition-all shadow-2xs hover:shadow-xs hover:scale-[1.02] active:scale-[0.98] cursor-pointer ${
                isAddedFeedback
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-emerald-700 text-white shadow-emerald-700/15"
              }`}
            >
              {isAddedFeedback ? (
                <>
                  <CheckCircle2 size={15} />
                  <span>اضافه شد</span>
                </>
              ) : (
                <>
                  <ShoppingCart size={15} />
                  <span>سفارش</span>
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
            className="absolute bottom-2 left-2 right-2 z-30 bg-slate-900 text-amber-300 px-3 py-2 rounded-xl text-[10px] font-black flex items-center justify-between shadow-xl border border-amber-400/30"
          >
            <span className="flex items-center gap-1.5">
              <Check size={12} className="text-emerald-400" />
              {alertSuccessMsg}
            </span>
            <button onClick={() => setAlertSuccessMsg(null)} className="text-slate-400 hover:text-white">
              <X size={12} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Price Alert Target Modal */}
      <AnimatePresence>
        {showAlertModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 text-right" dir="rtl">
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

