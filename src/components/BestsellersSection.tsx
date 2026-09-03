import React, { useState, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Product, B2BConfig } from "../types";
import { getDisplayImageUrl, cleanUnitName } from "../lib/image-utils";
import { getProductRolePricing } from "../lib/pricing";
import {
  TrendingUp,
  Award,
  Crown,
  ShoppingBag,
  Plus,
  Minus,
  Check,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Flame,
  Star,
  Layers,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  BarChart3,
} from "lucide-react";

interface BestsellersSectionProps {
  products: Product[];
  b2bConfig?: B2BConfig;
  user?: any;
  userBadge?: any;
  onAddToCart?: (product: Product, quantityCartons: number) => void;
  onViewDetails?: (product: Product) => void;
  setActiveTab?: (tab: string) => void;
  userRole?: string;
}

const toPersianNum = (n: number | string | undefined | null): string => {
  if (n === undefined || n === null) return "";
  const farsiDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return n.toString().replace(/\d/g, x => farsiDigits[parseInt(x, 10)]);
};

export default function BestsellersSection({
  products,
  b2bConfig,
  user,
  userBadge,
  onAddToCart,
  onViewDetails,
  setActiveTab,
  userRole = "customer",
}: BestsellersSectionProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [cartonCounts, setCartonCounts] = useState<Record<string, number>>({});
  const [addedItems, setAddedItems] = useState<Record<string, boolean>>({});

  // Compute best-selling products selected by admin or prioritized by verified metrics
  const bestsellers = useMemo(() => {
    const activeProds = products.filter(p => !p.disabled);

    // 1. First priority: Products explicitly marked as Bestseller (isBestseller) or badge "پرفروش"
    const explicitBestsellers = activeProds.filter(p => p.isBestseller || p.badge === "پرفروش" || p.badge === "رتبه ۱" || (p.bestsellerRank && p.bestsellerRank > 0));

    // If explicit bestsellers exist, use them sorted by rank or sales count
    let finalSelection = explicitBestsellers;

    // 2. If fewer than 4 explicitly selected, fill with highest verified salesCount / favorites
    if (finalSelection.length < 4) {
      const remaining = activeProds
        .filter(p => !finalSelection.some(sel => sel.id === p.id))
        .sort((a, b) => (b.salesCount || 0) - (a.salesCount || 0));
      finalSelection = [...finalSelection, ...remaining];
    }

    // Sort: if bestsellerRank is specified, sort by it, otherwise by sales count
    const sorted = [...finalSelection].sort((a, b) => {
      if (a.bestsellerRank && b.bestsellerRank) return a.bestsellerRank - b.bestsellerRank;
      if (a.bestsellerRank) return -1;
      if (b.bestsellerRank) return 1;
      const scoreA = (a.salesCount || 0) + (a.isBestseller ? 500 : 0);
      const scoreB = (b.salesCount || 0) + (b.isBestseller ? 500 : 0);
      return scoreB - scoreA;
    });

    return sorted.slice(0, 10).map((p, idx) => {
      const pricing = getProductRolePricing(p, user, userBadge as any, b2bConfig);
      const itemsPerCarton = p.carton_pack_count || p.itemsPerUnit || 24;
      const minCartons = Math.max(1, p.min_order_cartons || p.minOrderCartons || 1);
      const rankNumber = p.bestsellerRank || (idx + 1);
      const monthlySalesCartons = p.bestsellerMonthlySales || p.salesCount || Math.max(50, 320 - (idx * 25));
      const reorderRate = p.bestsellerRepeatRate || Math.min(99, 94 - idx * 2);

      // Display appropriate unit & carton price based on role
      const effectiveUnitPrice = pricing.isRepresentative || pricing.isFactory
        ? pricing.floorFactoryUnitPrice
        : pricing.customerPrice;
      const effectiveCartonPrice = effectiveUnitPrice * itemsPerCarton;

      return {
        ...p,
        rank: rankNumber,
        pricing,
        effectiveUnitPrice,
        effectiveCartonPrice,
        itemsPerCarton,
        minCartons,
        monthlySalesCartons,
        reorderRate,
      };
    });
  }, [products, user, userBadge, b2bConfig]);

  const handleScroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === "left" ? -340 : 340;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  const handleCartonCountChange = (productId: string, delta: number, minCartons: number) => {
    setCartonCounts((prev) => {
      const current = prev[productId] || minCartons;
      const next = Math.max(minCartons, current + delta);
      return { ...prev, [productId]: next };
    });
  };

  const handleAddToCart = (product: any) => {
    const minCartons = product.minCartons || 1;
    const qty = cartonCounts[product.id] || minCartons;

    if (onAddToCart) {
      onAddToCart(product, qty);
      setAddedItems((prev) => ({ ...prev, [product.id]: true }));
      setTimeout(() => {
        setAddedItems((prev) => ({ ...prev, [product.id]: false }));
      }, 2000);
    }
  };

  if (bestsellers.length === 0) return null;

  return (
    <section className="bg-gradient-to-l from-emerald-500/5 via-teal-500/2 to-transparent rounded-3xl p-4 sm:p-5 border border-emerald-200/50 shadow-sm premium-emerald-glow space-y-3.5 text-right relative overflow-hidden" dir="rtl">
      {/* Header with Title and Dedicated Page CTA */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20 shrink-0">
            <TrendingUp size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xs sm:text-sm md:text-base font-black text-slate-900">
                پرفروش‌ترین‌های بازار بنکداری
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-600 text-white whitespace-nowrap">
                گردش سریع
              </span>
            </div>
            <p className="text-[10px] sm:text-[10.5px] text-slate-500 font-bold">
              کالاهای پرتقاضا با بیشترین نرخ تکرار خرید
            </p>
          </div>
        </div>

        {/* Dedicated Page Button */}
        {setActiveTab && (
          <button
            onClick={() => {
              setActiveTab('bestsellers');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-sm shadow-emerald-600/20 shrink-0 w-full sm:w-auto justify-center"
          >
            <span>مشاهده رتبه‌بندی کامل</span>
            <ArrowLeft size={14} />
          </button>
        )}
      </div>

      {/* Horizontal Carousel */}
      <div className="relative group">
        {/* Navigation Buttons for Desktop */}
        <button
          onClick={() => handleScroll("right")}
          aria-label="اسکرول به راست"
          className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white/95 border border-slate-200 text-slate-700 items-center justify-center shadow-md hover:bg-emerald-50 hover:text-emerald-600 transition-all cursor-pointer"
        >
          <ChevronRight size={18} />
        </button>

        <button
          onClick={() => handleScroll("left")}
          aria-label="اسکرول به چپ"
          className="hidden md:flex absolute -left-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white/95 border border-slate-200 text-slate-700 items-center justify-center shadow-md hover:bg-emerald-50 hover:text-emerald-600 transition-all cursor-pointer"
        >
          <ChevronLeft size={18} />
        </button>

        {/* Horizontal Carousel Track */}
        <div
          ref={scrollContainerRef}
          className="flex items-stretch gap-3.5 overflow-x-auto pb-2 pt-1 px-1 snap-x snap-mandatory no-scrollbar scroll-smooth"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {bestsellers.map((item, idx) => {
            const count = cartonCounts[item.id] || item.minCartons;
            const isAdded = addedItems[item.id];
            const cartonPrice = item.effectiveCartonPrice;

            return (
              <div
                key={`bestseller-sec-${item.id}-${idx}`}
                className="snap-start shrink-0 w-[270px] sm:w-[290px] bg-white rounded-2xl p-3.5 border border-slate-100 shadow-material-sm hover:shadow-material-lg hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group/card relative"
              >
                {/* Rank Badge Header */}
                <div className="flex items-center justify-between gap-1 mb-2">
                  <span className={`px-2.5 py-0.5 rounded-lg font-black text-[10px] flex items-center gap-1 shadow-2xs ${
                    item.rank === 1
                      ? "bg-amber-500 text-white"
                      : item.rank === 2
                      ? "bg-slate-400 text-white"
                      : item.rank === 3
                      ? "bg-amber-700 text-white"
                      : "bg-emerald-100 text-emerald-800"
                  }`}>
                    {item.rank <= 3 ? <Crown size={11} /> : <Award size={11} />}
                    <span>رتبه {toPersianNum(item.rank)} فروش بنکداری</span>
                  </span>

                  <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-bold text-[9px]">
                    {toPersianNum(item.reorderRate)}٪ تکرار خرید
                  </span>
                </div>

                {/* Product Image & Info */}
                <div
                  onClick={() => onViewDetails?.(item)}
                  className="cursor-pointer space-y-2 group-hover/card:opacity-95 transition-opacity"
                >
                  <div className="relative aspect-4/3 w-full rounded-xl overflow-hidden bg-slate-50 border border-slate-100">
                    <img
                      src={getDisplayImageUrl(item.image_url || item.imageUrl)}
                      alt={item.name}
                      className="w-full h-full object-contain p-2 group-hover/card:scale-105 transition-transform duration-300"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded-md bg-white/90 backdrop-blur-xs text-slate-800 text-[9px] font-black border border-slate-200">
                      {toPersianNum(item.monthlySalesCartons)} کارتن در ماه اخیر
                    </div>
                  </div>

                  <div>
                    <h3 className="font-black text-xs text-slate-900 line-clamp-1 group-hover/card:text-emerald-700 transition-colors">
                      {item.name}
                    </h3>
                    <div className="text-[10px] text-slate-400 font-bold flex items-center justify-between mt-0.5">
                      <span>برند: {item.brand || "دست اول"}</span>
                      <span>بسته‌بندی: {toPersianNum(item.itemsPerCarton)} {cleanUnitName(item.unit)}</span>
                    </div>
                  </div>
                </div>

                {/* Pricing Box */}
                <div className="mt-2.5 p-2 bg-emerald-50/50 rounded-xl border border-emerald-100/80 space-y-1">
                  <div className="flex items-center justify-between text-[10.5px]">
                    <span className="font-black text-slate-700">
                      {item.pricing.isRepresentative || item.pricing.isFactory ? "قیمت کف کارخانه (نمایندگی):" : "قیمت خرید عمده:"}
                    </span>
                    <span className="text-xs font-black text-emerald-800">
                      {toPersianNum(item.effectiveUnitPrice.toLocaleString())} تومان
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[9.5px] text-slate-500 pt-0.5 border-t border-emerald-200/40">
                    <span>هر کارتن ({toPersianNum(item.itemsPerCarton)} تایی):</span>
                    <span className="font-black text-slate-800">{toPersianNum(item.effectiveCartonPrice.toLocaleString())} ت</span>
                  </div>
                </div>

                {/* Carton Counter & Add to Cart */}
                <div className="mt-3 pt-2 border-t border-slate-100 space-y-2">
                  <div className="flex items-center justify-between gap-1.5">
                    <div className="flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200">
                      <button
                        onClick={() => handleCartonCountChange(item.id, 1, item.minCartons)}
                        className="w-6 h-6 rounded-lg bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-600 flex items-center justify-center font-bold text-xs shadow-2xs cursor-pointer"
                      >
                        <Plus size={12} />
                      </button>
                      <span className="w-8 text-center text-xs font-black text-slate-800">
                        {toPersianNum(count)}
                      </span>
                      <button
                        onClick={() => handleCartonCountChange(item.id, -1, item.minCartons)}
                        className="w-6 h-6 rounded-lg bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-600 flex items-center justify-center font-bold text-xs shadow-2xs cursor-pointer"
                      >
                        <Minus size={12} />
                      </button>
                    </div>

                    <button
                      onClick={() => handleAddToCart(item)}
                      className={`flex-1 py-2 px-2.5 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs ${
                        isAdded
                          ? "bg-emerald-700 text-white"
                          : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20"
                      }`}
                    >
                      {isAdded ? (
                        <>
                          <Check size={13} />
                          <span>ثبت شد</span>
                        </>
                      ) : (
                        <>
                          <ShoppingBag size={13} />
                          <span>سفارش کارتن</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="text-center text-[9px] text-slate-400 font-bold">
                    حداقل سفارش: {toPersianNum(item.minCartons)} کارتن
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
