import React, { useState, useEffect, useRef } from "react";
import { 
  Play, 
  Pause, 
  ChevronRight, 
  ChevronLeft, 
  ShoppingBag, 
  Factory, 
  Flame
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Product } from "../types";
import { toPersianDigits, getProductRolePricing } from "../lib/pricing";
import { getUserSession } from "../lib/auth-helper";

interface LiveRotatingShowcaseProps {
  products: Product[];
  onAddToCart: (product: Product, quantityCartons?: number) => void;
  onViewDetails: (product: Product) => void;
  userBadge?: string;
  recentCategories?: string[];
}

export default function LiveRotatingShowcase({
  products,
  onAddToCart,
  onViewDetails,
  userBadge,
  recentCategories = []
}: LiveRotatingShowcaseProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [intervalSpeed] = useState(4500); // 4.5s per slide
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Filter out inactive/disabled products and prioritize by recent categories
  const rotatingProducts = React.useMemo(() => {
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

      matched.sort((a, b) => {
        const idxA = recentCategories.indexOf(a.category || "");
        const idxB = recentCategories.indexOf(b.category || "");
        return idxA - idxB;
      });

      if (matched.length > 0) {
        return [...matched, ...others].slice(0, 10);
      }
    }

    return activeList.slice(0, 10);
  }, [products, recentCategories]);

  useEffect(() => {
    if (!isPlaying || rotatingProducts.length === 0) {
      if (timerRef.current) clearInterval(timerRef.current);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      return;
    }

    setProgress(0);
    const stepMs = 50;
    let elapsed = 0;

    progressIntervalRef.current = setInterval(() => {
      elapsed += stepMs;
      setProgress(Math.min(100, (elapsed / intervalSpeed) * 100));
    }, stepMs);

    timerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % rotatingProducts.length);
      elapsed = 0;
      setProgress(0);
    }, intervalSpeed);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, [isPlaying, intervalSpeed, rotatingProducts.length, currentIndex]);

  if (rotatingProducts.length === 0) return null;

  const currentProduct = rotatingProducts[currentIndex];
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
    setCurrentIndex((prev) => (prev + 1) % rotatingProducts.length);
    setProgress(0);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + rotatingProducts.length) % rotatingProducts.length);
    setProgress(0);
  };

  return (
    <div 
      className="relative bg-white border border-slate-200 rounded-2xl p-3.5 sm:p-4 shadow-2xs overflow-hidden font-sans my-3 text-right"
      dir="rtl"
      onMouseEnter={() => setIsPlaying(false)}
      onMouseLeave={() => setIsPlaying(true)}
    >
      {/* Top Auto-Rotate Progress Bar */}
      <div 
        className="absolute top-0 right-0 left-0 h-1 bg-emerald-500 transition-all duration-75 ease-linear"
        style={{ width: `${isPlaying ? progress : 100}%` }}
      />

      {/* Header Bar */}
      <div className="flex items-center justify-between gap-2 pb-2.5 mb-3 border-b border-slate-100">
        <div className="flex items-center gap-2 overflow-hidden">
          <span className="flex items-center gap-1.5 text-xs font-black text-slate-800 shrink-0">
            <Flame size={14} className="text-amber-500" />
            <span>ویترین پیشنهادی کارخانجات</span>
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
            title={isPlaying ? "توقف" : "چرخش"}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            {isPlaying ? <Pause size={13} /> : <Play size={13} />}
          </button>
          
          <div className="flex items-center gap-1 text-[11px] font-black text-slate-400 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-100">
            <button
              onClick={handlePrev}
              className="p-0.5 rounded hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
            >
              <ChevronRight size={13} />
            </button>
            <span className="text-slate-700 font-bold dir-ltr px-1">
              {toPersianDigits(currentIndex + 1)} / {toPersianDigits(rotatingProducts.length)}
            </span>
            <button
              onClick={handleNext}
              className="p-0.5 rounded hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
            >
              <ChevronLeft size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Slide Card */}
      <div className="relative min-h-[95px] sm:min-h-[105px] flex items-center overflow-hidden">
        <motion.div
          key={`rot-${currentProduct.id}-${currentIndex}`}
          initial={{ opacity: 0.5, x: 6 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="w-full flex flex-row items-center justify-between gap-3 sm:gap-5"
        >
          {/* Image + Info */}
          <div 
            className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0 cursor-pointer group"
            onClick={() => onViewDetails(currentProduct)}
          >
            {/* Clean, Large Image Thumbnail */}
            <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-xl overflow-hidden bg-white border border-slate-200 shrink-0 shadow-xs flex items-center justify-center p-1">
              <img
                src={currentProduct.imageUrl || currentProduct.image_url || (currentProduct as any).image || "https://images.unsplash.com/photo-1581798459219-318e76aecc7b?auto=format&fit=crop&q=80&w=600"}
                alt={currentProduct.name}
                className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-200"
              />
              {profitMargin > 0 && (
                <span className="absolute bottom-0 right-0 left-0 bg-emerald-600 text-white text-[9px] font-black text-center py-0.5">
                  {toPersianDigits(profitMargin)}٪ سود
                </span>
              )}
            </div>

            {/* Product Meta (Short & Readable) */}
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
                <span className="text-emerald-700 font-bold truncate">
                  {factoryTitle}
                </span>
              </div>

              <h3 className="text-sm sm:text-base font-black text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-1">
                {currentProduct.name}
              </h3>

              {/* Price Information */}
              <div className="flex items-baseline gap-2 pt-0.5">
                <span className="text-sm sm:text-base font-black text-emerald-700">
                  {toPersianDigits(bulkPrice.toLocaleString())} <span className="text-xs text-slate-500 font-normal">تومان</span>
                </span>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="flex items-center shrink-0">
            <button
              onClick={() => onAddToCart(currentProduct, 1)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs py-2 px-3 sm:px-4 rounded-xl shadow-xs flex items-center gap-1 cursor-pointer transition-all active:scale-95 whitespace-nowrap"
            >
              <ShoppingBag size={14} />
              <span>خرید</span>
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
