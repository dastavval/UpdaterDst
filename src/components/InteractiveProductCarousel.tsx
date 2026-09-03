import React, { useState, useEffect, useRef, useMemo } from "react";
import { 
  Play, 
  Pause, 
  ChevronRight, 
  ChevronLeft, 
  ShoppingBag, 
  Factory, 
  Flame,
  Check
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Product } from "../types";
import { toPersianDigits, getProductRolePricing } from "../lib/pricing";
import { getUserSession } from "../lib/auth-helper";

interface InteractiveProductCarouselProps {
  products: Product[];
  onAddToCart: (product: Product, quantityCartons?: number) => void;
  onViewDetails: (product: Product) => void;
  userBadge?: string;
  recentCategories?: string[];
  title?: string;
}

export default function InteractiveProductCarousel({
  products,
  onAddToCart,
  onViewDetails,
  userBadge,
  recentCategories = [],
  title = "ویترین پیشنهادی کارخانجات"
}: InteractiveProductCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [progress, setProgress] = useState(0);
  const [addedSuccess, setAddedSuccess] = useState(false);

  const autoPlayDuration = 4500; // 4.5s per slide
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const progressTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Filter out inactive/disabled products and prioritize by recent categories
  const activeProducts = useMemo(() => {
    if (!products || products.length === 0) return [];

    const activeList = products.filter(p => {
      if (!p || !p.name) return false;
      const isProdDisabled = p.disabled === true || 
        (p as any).is_active === false || 
        (p as any).active === false || 
        (p as any).isActive === false ||
        (p as any).status === 'inactive' || 
        (p as any).status === 'disabled' ||
        String(p.disabled) === 'true' ||
        String(p.disabled) === '1';
      return !isProdDisabled;
    });

    if (recentCategories && recentCategories.length > 0) {
      const matched: Product[] = [];
      const others: Product[] = [];

      activeList.forEach(p => {
        if (p.category && recentCategories.includes(p.category)) {
          matched.push(p);
        } else {
          others.push(p);
        }
      });

      if (matched.length > 0) {
        return [...matched, ...others].slice(0, 15);
      }
    }

    return activeList.slice(0, 15);
  }, [products, recentCategories]);

  const totalSlides = activeProducts.length;

  useEffect(() => {
    if (!isPlaying || isHovered || totalSlides <= 1) {
      if (timerRef.current) clearInterval(timerRef.current);
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
      return;
    }

    setProgress(0);
    const stepMs = 50;
    let elapsed = 0;

    progressTimerRef.current = setInterval(() => {
      elapsed += stepMs;
      setProgress(Math.min(100, (elapsed / autoPlayDuration) * 100));
    }, stepMs);

    timerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % totalSlides);
      elapsed = 0;
      setProgress(0);
    }, autoPlayDuration);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    };
  }, [isPlaying, isHovered, totalSlides, currentIndex, autoPlayDuration]);

  if (totalSlides === 0) return null;

  const currentProduct = activeProducts[currentIndex] || activeProducts[0];
  if (!currentProduct) return null;

  const currentUser = getUserSession() || undefined;
  const pricing = getProductRolePricing(
    currentProduct,
    currentUser,
    userBadge as any
  );

  const consumerPrice = pricing.displayConsumerPrice;
  const bulkPrice = pricing.unitWholesalePrice;
  const profitMargin = pricing.profitMarginPercent;

  const factoryTitle = currentProduct.factory_name || currentProduct.brand || "کارخانه دست‌اول";
  const isPersonalized = recentCategories && currentProduct.category && recentCategories.includes(currentProduct.category);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % totalSlides);
    setProgress(0);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
    setProgress(0);
  };

  const handleDirectBuy = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToCart(currentProduct, currentProduct.minOrderCartons || 1);
    setAddedSuccess(true);
    setTimeout(() => setAddedSuccess(false), 1500);
  };

  return (
    <div 
      className="relative bg-white border border-slate-200/90 rounded-2xl p-3.5 sm:p-4 shadow-2xs overflow-hidden font-sans my-3 text-right select-none transition-all"
      dir="rtl"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={() => setIsHovered(true)}
      onTouchEnd={() => setIsHovered(false)}
    >
      {/* Top Auto-Rotate Progress Bar */}
      <div 
        className="absolute top-0 right-0 left-0 h-1 bg-emerald-500 transition-all duration-75 ease-linear"
        style={{ width: `${isPlaying && !isHovered ? progress : 100}%` }}
      />

      {/* Header Bar */}
      <div className="flex items-center justify-between gap-2 pb-2.5 mb-3 border-b border-slate-100">
        <div className="flex items-center gap-2 overflow-hidden">
          <span className="flex items-center gap-1.5 text-xs font-black text-slate-800 shrink-0">
            <Flame size={15} className="text-amber-500" />
            <span>{title}</span>
          </span>

          {isPersonalized && (
            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 truncate">
              پیشنهاد اختصاصی
            </span>
          )}
        </div>

        {/* Navigation Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            title={isPlaying ? "توقف پخش خودکار" : "شروع پخش خودکار"}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            {isPlaying ? <Pause size={13} /> : <Play size={13} />}
          </button>
          
          <div className="flex items-center gap-1 text-[11px] font-black text-slate-400 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-100">
            <button
              onClick={handlePrev}
              className="p-0.5 rounded hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer active:scale-90"
              title="محصول قبلی"
            >
              <ChevronRight size={14} />
            </button>
            <span className="text-slate-700 font-mono font-bold dir-ltr px-1">
              {toPersianDigits(currentIndex + 1)} / {toPersianDigits(totalSlides)}
            </span>
            <button
              onClick={handleNext}
              className="p-0.5 rounded hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer active:scale-90"
              title="محصول بعدی"
            >
              <ChevronLeft size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Slide Content - Fixed Stable Height without layout jump or white flash */}
      <div className="relative min-h-[100px] sm:min-h-[110px] flex items-center overflow-hidden">
        <motion.div
          key={`rot-${currentProduct.id}-${currentIndex}`}
          initial={{ opacity: 0.4, x: 8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="w-full flex flex-row items-center justify-between gap-3 sm:gap-5"
        >
          {/* Image + Info */}
          <div 
            className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0 cursor-pointer group"
            onClick={() => onViewDetails(currentProduct)}
          >
            {/* Clean, Large Image Thumbnail */}
            <div className="relative w-22 h-22 sm:w-26 sm:h-26 rounded-xl overflow-hidden bg-white border border-slate-200 shrink-0 shadow-2xs flex items-center justify-center p-1.5 group-hover:border-emerald-300 transition-all">
              <img
                src={
                  currentProduct.imageUrl || 
                  currentProduct.image_url || 
                  (currentProduct as any).image || 
                  "https://images.unsplash.com/photo-1581798459219-318e76aecc7b?auto=format&fit=crop&q=80&w=600"
                }
                alt={currentProduct.name}
                className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-200"
                loading="eager"
                referrerPolicy="no-referrer"
              />
              {profitMargin > 0 && (
                <span className="absolute bottom-0 right-0 left-0 bg-emerald-600 text-white text-[9px] font-black text-center py-0.5">
                  {toPersianDigits(profitMargin)}٪ سود
                </span>
              )}
            </div>

            {/* Product Meta */}
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
                <Factory size={12} className="text-emerald-600 shrink-0" />
                <span className="text-emerald-700 font-bold truncate">
                  {factoryTitle}
                </span>
              </div>

              <h3 className="text-sm sm:text-base font-black text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-1">
                {currentProduct.name}
              </h3>

              {/* Price Information */}
              <div className="flex items-baseline gap-2 pt-0.5 flex-wrap">
                <span className="text-sm sm:text-base font-black font-mono text-emerald-700">
                  {toPersianDigits(bulkPrice.toLocaleString())} <span className="text-xs text-slate-500 font-normal">تومان</span>
                </span>
                {consumerPrice > bulkPrice && (
                  <span className="text-xs text-slate-400 line-through font-mono">
                    {toPersianDigits(consumerPrice.toLocaleString())}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Direct Buy Action Button */}
          <div className="flex items-center shrink-0">
            <button
              onClick={handleDirectBuy}
              className={`font-black text-xs py-2 px-3 sm:px-4 rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 whitespace-nowrap ${
                addedSuccess 
                  ? 'bg-emerald-700 text-white ring-2 ring-emerald-300' 
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
              title="ثبت سفارش مستقیم"
            >
              {addedSuccess ? (
                <>
                  <Check size={14} className="animate-bounce" />
                  <span>افزوده شد</span>
                </>
              ) : (
                <>
                  <ShoppingBag size={14} />
                  <span>خرید مستقیم</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
