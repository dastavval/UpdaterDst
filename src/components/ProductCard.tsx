import React, { useState, useEffect, memo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Plus, Minus, Package, Factory, Sparkles, Bell, Check, X, TrendingDown, Building2, Eye, ShieldCheck, Zap, Percent, CheckCircle2 } from "lucide-react";
import { Product } from "../types";
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
      className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden hover:border-emerald-500 hover:shadow-xl transition-all duration-300 group flex flex-col relative shadow-xs h-full"
    >
      {/* Top Accent Line for VIP / Featured */}
      {product.isFeatured && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-600 via-teal-500 to-amber-400 z-10" />
      )}

      {/* Product Image Section */}
      <div 
        onClick={() => onViewDetails?.(product)}
        className="relative aspect-[4/3] w-full overflow-hidden bg-slate-50 cursor-pointer border-b border-slate-100 flex items-center justify-center group/img"
      >
        {imageError || !product.image_url ? (
          <div className="w-full h-full bg-slate-50 flex flex-col items-center justify-center gap-1.5 p-4 text-slate-400">
            <Package size={36} className="text-slate-300 stroke-[1.5]" />
            <span className="text-[11px] font-black text-slate-400">تامین مستقیم کارخانه</span>
          </div>
        ) : (
          <>
            {!imageLoaded && (
              <div className="absolute inset-0 bg-slate-100/90 animate-pulse flex items-center justify-center z-[1]">
                <span className="text-[10px] font-black text-slate-400">بارگذاری...</span>
              </div>
            )}
            <img 
              src={product.image_url} 
              alt={product.name}
              onLoad={() => setImageLoaded(true)}
              className={`w-full h-full object-contain p-2.5 group-hover:scale-105 transition-all duration-500 ease-out ${
                imageLoaded ? 'opacity-100 blur-0' : 'opacity-0 blur-xs scale-95'
              }`}
              referrerPolicy="no-referrer"
              onError={() => { 
                setImageLoaded(true);
                setImageError(true);
              }}
            />
          </>
        )}
        
        {/* Badges Overlay */}
        <div className="absolute top-2.5 right-2.5 flex flex-col gap-1 z-10 pointer-events-none">
          {product.badge && (
            <span className="bg-emerald-700 text-white px-2 py-0.5 rounded-md text-[9px] font-black shadow-xs">
              {product.badge}
            </span>
          )}
          {product.isFeatured && (
            <span className="bg-amber-500 text-slate-950 px-2 py-0.5 rounded-md text-[9px] font-black shadow-xs">
              ویژه کارخانه
            </span>
          )}
          {product.hasHealthApple && (
            <span className="bg-emerald-600 text-white px-2 py-0.5 rounded-md text-[9px] font-black shadow-xs flex items-center gap-1">
              🍏 سیب سلامت
            </span>
          )}
        </div>

        {/* Quick Profit Margin Badge */}
        {discountPercent > 0 && (
          <span className="absolute top-2.5 left-2.5 bg-rose-600 text-white px-2 py-0.5 rounded-md text-[9px] font-black shadow-xs z-10">
            ٪{toPersianNum(discountPercent)} سود بنکدار
          </span>
        )}

        {/* Quick View Button on Image Hover */}
        <div className="absolute inset-0 bg-slate-900/20 opacity-0 group-hover/img:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2 pointer-events-none">
          <span className="bg-white/95 text-slate-900 px-3 py-1.5 rounded-xl text-[11px] font-black shadow-lg flex items-center gap-1.5 transform translate-y-2 group-hover/img:translate-y-0 transition-transform">
            <Eye size={13} className="text-emerald-600" />
            مشاهده جزئیات و آنالیز
          </span>
        </div>

        {/* Price Alert Bell Button */}
        <button
          onClick={handleTogglePriceAlert}
          title={hasPriceAlert ? "هشدار قیمت فعال است" : "تنظیم هشدار قیمت"}
          className={`absolute bottom-2 right-2 z-10 p-1.5 rounded-lg transition-all shadow-xs cursor-pointer flex items-center justify-center ${
            hasPriceAlert
              ? "bg-amber-500 text-slate-950 ring-2 ring-amber-300"
              : "bg-white/90 text-slate-600 hover:bg-slate-900 hover:text-white border border-slate-200"
          }`}
        >
          <Bell size={13} className={hasPriceAlert ? "fill-slate-950" : ""} />
        </button>
      </div>

      {/* Info Section */}
      <div className="p-3.5 flex flex-col gap-2 text-right flex-1" dir="rtl">
        
        {/* Category & Brand Header */}
        <div className="flex justify-between items-center gap-1.5">
          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100/60 truncate max-w-[130px]">
            {product.category}
          </span>
          <span className="text-[10px] font-bold text-slate-500 truncate">{product.brand}</span>
        </div>

        {/* Product Title */}
        <div className="flex-1">
          <h3 
            onClick={() => onViewDetails?.(product)}
            className="text-xs sm:text-[13px] font-black text-slate-900 leading-snug line-clamp-2 group-hover:text-emerald-700 transition-colors cursor-pointer"
            title={product.name}
          >
            {product.name}
          </h3>

          {/* Factory Name & Direct Supply Verification */}
          <div className="flex items-center gap-1 text-[9px] font-bold text-slate-500 mt-1 truncate">
            <Building2 size={11} className="shrink-0 text-emerald-600" />
            <span className="truncate">کارخانه: {product.factory_name || (product as any).factoryName || product.brand || "دست‌اول"}</span>
          </div>
        </div>

        {/* Pricing & Carton Breakdown Box */}
        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/70 space-y-1.5 mt-auto">
          {/* Main Wholesale Unit Price */}
          <div className="flex justify-between items-baseline">
            <span className="text-[10px] font-bold text-slate-500">قیمت عمده (واحد):</span>
            <div className="text-left">
              {discountPercent > 0 && product.bulk_price > discountedBulkPrice && (
                <div className="text-[9px] font-bold text-slate-400 line-through decoration-rose-300 decoration-1">
                  {toPersianNum(product.bulk_price.toLocaleString())}
                </div>
              )}
              <span className="font-mono text-emerald-800 font-black text-sm">
                {toPersianNum(discountedBulkPrice.toLocaleString())}
                <span className="text-[9px] font-bold text-slate-400 mr-1">تومان</span>
              </span>
            </div>
          </div>

          {/* Consumer Price & Margin */}
          <div className="flex justify-between items-center pt-1 border-t border-slate-200/50 text-[10px]">
            <span className="text-slate-500 font-bold">قیمت مصرف‌کننده:</span>
            <span className="font-bold text-slate-700">
              {toPersianNum(displayConsumerPrice.toLocaleString())} ت
            </span>
          </div>

          {/* Carton Pack Details */}
          <div className="flex justify-between items-center pt-1 border-t border-dashed border-slate-200 text-[10px] font-bold text-slate-600">
            <span className="flex items-center gap-1">
              <Package size={11} className="text-slate-400" />
              تعداد در کارتن:
            </span>
            <span className="text-slate-900 font-black">
              {toPersianNum(product.carton_pack_count)} {product.unit || "عدد"}
            </span>
          </div>

          {/* Total Price Per Carton */}
          <div className="flex justify-between items-center pt-1 border-t border-slate-200/60 text-[10px] font-black">
            <span className="text-slate-500">مبلغ هر کارتن:</span>
            <span className="text-indigo-900 font-mono">{toPersianNum(pricePerCarton.toLocaleString())} ت</span>
          </div>
        </div>

        {/* Quantity Controls & Add to Cart */}
        <div className="flex items-center gap-1.5 pt-1">
          <div className="flex items-center border border-slate-200 rounded-xl bg-white p-0.5 shrink-0">
            <button 
              onClick={handleDecrement} 
              className="p-1.5 text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer disabled:opacity-25 transition-colors" 
              disabled={cartons <= (product.min_order_cartons || 1)}
              title="کاهش تعداد کارتن"
            >
              <Minus size={12} />
            </button>
            <span className="w-6 text-center text-xs font-black font-mono text-slate-900">{toPersianNum(cartons)}</span>
            <button 
              onClick={handleIncrement} 
              className="p-1.5 text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
              title="افزایش تعداد کارتن"
            >
              <Plus size={12} />
            </button>
          </div>

          <button 
            onClick={handleAddWithFeedback}
            className={`flex-1 py-2.5 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer ${
              isAddedFeedback
                ? "bg-emerald-600 text-white"
                : "bg-emerald-700 hover:bg-emerald-800 text-white"
            }`}
          >
            {isAddedFeedback ? (
              <>
                <CheckCircle2 size={14} className="text-amber-300" />
                <span>به سبد اضافه شد</span>
              </>
            ) : (
              <>
                <Package size={14} />
                <span>افزودن به سبد</span>
              </>
            )}
          </button>
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

