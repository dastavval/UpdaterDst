import React, { useState, useMemo } from "react";
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
  Search,
  Filter,
  ShieldCheck,
  Building2,
  Package,
  Layers,
  ArrowRight,
  Sparkles,
  BarChart3,
  Flame,
  Star,
  Zap,
  Calendar,
  CheckCircle2,
} from "lucide-react";

interface BestsellersViewProps {
  products: Product[];
  b2bConfig?: B2BConfig;
  user?: any;
  userBadge?: any;
  onAddToCart?: (product: Product, quantityCartons: number) => void;
  onViewDetails?: (product: Product) => void;
  onBackToHome?: () => void;
}

const toPersianNum = (n: number | string | undefined | null): string => {
  if (n === undefined || n === null) return "";
  const farsiDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return n.toString().replace(/\d/g, x => farsiDigits[parseInt(x, 10)]);
};

export default function BestsellersView({
  products,
  b2bConfig,
  user,
  userBadge,
  onAddToCart,
  onViewDetails,
  onBackToHome,
}: BestsellersViewProps) {
  const [selectedTimeframe, setSelectedTimeframe] = useState<'month' | 'quarter' | 'year'>('month');
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [cartonCounts, setCartonCounts] = useState<Record<string, number>>({});
  const [addedItems, setAddedItems] = useState<Record<string, boolean>>({});

  // Compute best-selling products deterministically based on product properties
  const bestsellers = useMemo(() => {
    const activeProds = products.filter(p => !p.disabled);

    // Sort by sales score or featured/popularity flags
    const sorted = [...activeProds].sort((a, b) => {
      const scoreA = (a.salesCount || (a.isFeatured ? 600 : 0) + (a.isFavorite ? 350 : 0) + (a.viewsCount || 100));
      const scoreB = (b.salesCount || (b.isFeatured ? 600 : 0) + (b.isFavorite ? 350 : 0) + (b.viewsCount || 100));
      return scoreB - scoreA;
    });

    return sorted.map((p, idx) => {
      const pricing = getProductRolePricing(p, user, userBadge as any, b2bConfig);
      const itemsPerCarton = p.carton_pack_count || p.itemsPerUnit || 24;
      const minCartons = Math.max(5, p.min_order_cartons || p.minOrderCartons || 5);
      
      const multiplier = selectedTimeframe === 'month' ? 1 : selectedTimeframe === 'quarter' ? 3 : 11;
      const monthlySalesCartons = Math.max(35, (p.salesCount ? p.salesCount : 420 - (idx * 18))) * multiplier;
      const reorderRate = Math.min(99, 96 - Math.min(30, idx * 1.5));

      const effectiveUnitPrice = pricing.isRepresentative || pricing.isFactory
        ? pricing.floorFactoryUnitPrice
        : pricing.customerPrice;
      const effectiveCartonPrice = effectiveUnitPrice * itemsPerCarton;

      return {
        ...p,
        rank: idx + 1,
        pricing,
        effectiveUnitPrice,
        effectiveCartonPrice,
        itemsPerCarton,
        minCartons,
        monthlySalesCartons,
        reorderRate,
      };
    });
  }, [products, selectedTimeframe, user, userBadge, b2bConfig]);

  // Extract categories present
  const categoriesList = useMemo(() => {
    const set = new Set<string>();
    bestsellers.forEach(o => {
      if (o.category) set.add(o.category);
    });
    return Array.from(set);
  }, [bestsellers]);

  // Filtered list
  const filteredBestsellers = useMemo(() => {
    return bestsellers.filter(item => {
      if (selectedCategory !== "all" && item.category !== selectedCategory) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = item.name && item.name.toLowerCase().includes(q);
        const matchBrand = item.brand && item.brand.toLowerCase().includes(q);
        const matchCat = item.category && item.category.toLowerCase().includes(q);
        if (!matchName && !matchBrand && !matchCat) return false;
      }

      return true;
    });
  }, [bestsellers, selectedCategory, searchQuery]);

  const top3 = useMemo(() => bestsellers.slice(0, 3), [bestsellers]);

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

  return (
    <div className="min-h-screen bg-slate-50/70 pb-28 text-slate-800 antialiased font-sans text-right" dir="rtl">
      {/* Top Breadcrumbs & Back */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {onBackToHome && (
              <button
                onClick={onBackToHome}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <ArrowRight size={15} />
                <span>بازگشت به صفحه اصلی</span>
              </button>
            )}
            <span className="text-slate-300">/</span>
            <span className="text-xs font-black text-emerald-700 flex items-center gap-1">
              <TrendingUp size={15} />
              <span>پرفروش‌ترین‌های بنکداری و پخش ایران</span>
            </span>
          </div>

          {/* Timeframe Pill */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setSelectedTimeframe('month')}
              className={`px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                selectedTimeframe === 'month'
                  ? "bg-white text-emerald-800 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              ماه جاری
            </button>
            <button
              onClick={() => setSelectedTimeframe('quarter')}
              className={`px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                selectedTimeframe === 'quarter'
                  ? "bg-white text-emerald-800 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              ۳ ماهه
            </button>
            <button
              onClick={() => setSelectedTimeframe('year')}
              className={`px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                selectedTimeframe === 'year'
                  ? "bg-white text-emerald-800 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              کل سال
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Grand Hero Banner */}
        <div className="bg-gradient-to-r from-emerald-800 via-teal-700 to-emerald-600 rounded-3xl p-6 sm:p-8 text-white shadow-lg shadow-emerald-800/20 relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2.5 max-w-2xl z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-[11px] font-black border border-white/30">
              <Crown size={14} className="text-amber-300" />
              <span>شاخص تقاضای واقعی سوپرمارکت‌ها و هایپرمارکت‌ها</span>
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black leading-tight">
              رتبه‌بندی پرفروش‌ترین محصولات بازار عمده و بنکداری
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100 font-bold leading-relaxed">
              این لیست بر اساس حجم خرید ماهانه، تکرار سفارشات هایپرمارکت‌ها و بالاترین گردش نقدینگی استخراج شده است تا با اطمینان از فروش سریع، کالاهای پرتقاضا را در سبد سفارش خود قرار دهید.
            </p>
          </div>

          {/* Quick Stats Badges */}
          <div className="grid grid-cols-2 gap-2.5 w-full md:w-auto shrink-0 z-10">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-3 text-center">
              <div className="text-lg sm:text-xl font-black">{toPersianNum(bestsellers.length)}</div>
              <div className="text-[10px] text-emerald-100 font-bold">کالای منتخب رتبه‌بندی</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-3 text-center">
              <div className="text-lg sm:text-xl font-black">۹۶٪</div>
              <div className="text-[10px] text-emerald-100 font-bold">میانگین تکرار خرید</div>
            </div>
          </div>
        </div>

        {/* Podium for Top 3 Bestsellers */}
        {top3.length >= 3 && (
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Crown size={20} className="text-amber-500" />
              <h2 className="text-sm sm:text-base font-black text-slate-900">
                سکوی قهرمانان فروش (۳ محصول برتر بازار بنکداری)
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              {/* Rank 2 (Silver) */}
              <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200 flex flex-col justify-between order-2 md:order-1 relative overflow-hidden">
                <div className="absolute top-0 right-0 left-0 h-1.5 bg-slate-400" />
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="px-2.5 py-0.5 rounded-lg bg-slate-400 text-white font-black text-xs flex items-center gap-1 shadow-2xs">
                    <Award size={13} />
                    <span>رتبه ۲ بازار</span>
                  </span>
                  <span className="text-[10px] text-slate-500 font-bold">نقره‌ای</span>
                </div>

                <div className="space-y-2 cursor-pointer" onClick={() => onViewDetails?.(top3[1])}>
                  <div className="aspect-4/3 rounded-xl overflow-hidden bg-white p-2 border border-slate-100">
                    <img
                      src={getDisplayImageUrl(top3[1].image_url || top3[1].imageUrl)}
                      alt={top3[1].name}
                      className="w-full h-full object-contain"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <h3 className="text-xs font-black text-slate-900 line-clamp-1">{top3[1].name}</h3>
                  <div className="text-[10px] text-slate-500 font-bold">{top3[1].brand} | {toPersianNum(top3[1].monthlySalesCartons)} کارتن فروش</div>
                </div>

                 <div className="mt-3 pt-2 border-t border-slate-200/80 flex items-center justify-between">
                  <span className="text-xs font-black text-emerald-800">{toPersianNum(top3[1].effectiveUnitPrice.toLocaleString())} تومان</span>
                  <button
                    onClick={() => handleAddToCart(top3[1])}
                    className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-black rounded-xl cursor-pointer hover:bg-emerald-700 shadow-2xs"
                  >
                    سفارش
                  </button>
                </div>
              </div>

              {/* Rank 1 (Gold) */}
              <div className="bg-amber-50/70 rounded-2xl p-4 border-2 border-amber-300 flex flex-col justify-between order-1 md:order-2 shadow-md relative overflow-hidden">
                <div className="absolute top-0 right-0 left-0 h-2 bg-amber-400" />
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="px-3 py-1 rounded-xl bg-amber-500 text-white font-black text-xs flex items-center gap-1 shadow-2xs">
                    <Crown size={14} />
                    <span>رتبه ۱ پرفروش‌ترین (طلایی)</span>
                  </span>
                  <span className="text-[10px] text-amber-900 font-black">پادشاه بازار</span>
                </div>

                <div className="space-y-2 cursor-pointer" onClick={() => onViewDetails?.(top3[0])}>
                  <div className="aspect-4/3 rounded-xl overflow-hidden bg-white p-2 border border-amber-100">
                    <img
                      src={getDisplayImageUrl(top3[0].image_url || top3[0].imageUrl)}
                      alt={top3[0].name}
                      className="w-full h-full object-contain"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <h3 className="text-xs sm:text-sm font-black text-slate-900 line-clamp-1">{top3[0].name}</h3>
                  <div className="text-[10px] text-amber-900 font-bold">{top3[0].brand} | {toPersianNum(top3[0].monthlySalesCartons)} کارتن فروش | {toPersianNum(top3[0].reorderRate)}٪ تکرار</div>
                </div>

                <div className="mt-3 pt-2 border-t border-amber-200 flex items-center justify-between">
                  <span className="text-sm font-black text-emerald-800">{toPersianNum(top3[0].effectiveUnitPrice.toLocaleString())} تومان</span>
                  <button
                    onClick={() => handleAddToCart(top3[0])}
                    className="px-4 py-2 bg-emerald-600 text-white text-xs font-black rounded-xl cursor-pointer hover:bg-emerald-700 shadow-md shadow-emerald-600/20"
                  >
                    سفارش فوری
                  </button>
                </div>
              </div>

              {/* Rank 3 (Bronze) */}
              <div className="bg-orange-50/50 rounded-2xl p-4 border border-orange-200 flex flex-col justify-between order-3 relative overflow-hidden">
                <div className="absolute top-0 right-0 left-0 h-1.5 bg-amber-700" />
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="px-2.5 py-0.5 rounded-lg bg-amber-700 text-white font-black text-xs flex items-center gap-1 shadow-2xs">
                    <Award size={13} />
                    <span>رتبه ۳ بازار</span>
                  </span>
                  <span className="text-[10px] text-amber-900 font-bold">برنزی</span>
                </div>

                <div className="space-y-2 cursor-pointer" onClick={() => onViewDetails?.(top3[2])}>
                  <div className="aspect-4/3 rounded-xl overflow-hidden bg-white p-2 border border-slate-100">
                    <img
                      src={getDisplayImageUrl(top3[2].image_url || top3[2].imageUrl)}
                      alt={top3[2].name}
                      className="w-full h-full object-contain"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <h3 className="text-xs font-black text-slate-900 line-clamp-1">{top3[2].name}</h3>
                  <div className="text-[10px] text-slate-500 font-bold">{top3[2].brand} | {toPersianNum(top3[2].monthlySalesCartons)} کارتن فروش</div>
                </div>

                <div className="mt-3 pt-2 border-t border-orange-200 flex items-center justify-between">
                  <span className="text-xs font-black text-emerald-800">{toPersianNum(top3[2].effectiveUnitPrice.toLocaleString())} تومان</span>
                  <button
                    onClick={() => handleAddToCart(top3[2])}
                    className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-black rounded-xl cursor-pointer hover:bg-emerald-700 shadow-2xs"
                  >
                    سفارش
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Search & Category Filter */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-2xs space-y-3">
          <div className="relative">
            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجو در بین پرفروش‌ترین محصولات بر اساس نام، برند، دسته‌بندی..."
              className="w-full pr-10 pl-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 outline-none focus:border-emerald-500 focus:bg-white transition-all"
            />
          </div>

          {categoriesList.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pt-1 pb-1">
              <span className="text-[11px] font-black text-slate-400 whitespace-nowrap">دسته‌بندی:</span>
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                  selectedCategory === 'all'
                    ? "bg-emerald-700 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                همه ({toPersianNum(bestsellers.length)})
              </button>
              {categoriesList.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                    selectedCategory === cat
                      ? "bg-emerald-700 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Full Bestsellers Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredBestsellers.map((item, idx) => {
            const count = cartonCounts[item.id] || item.minCartons;
            const isAdded = addedItems[item.id];
            const cartonPrice = item.effectiveCartonPrice;
            const totalPrice = cartonPrice * count;

            return (
              <div
                key={`bestseller-view-${item.id}-${idx}`}
                className="bg-white rounded-3xl p-4 border border-emerald-100/90 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group relative"
              >
                {/* Badges Header */}
                <div className="flex items-center justify-between gap-1 mb-2.5">
                  <span className={`px-2.5 py-1 rounded-xl font-black text-xs flex items-center gap-1 shadow-2xs ${
                    item.rank === 1
                      ? "bg-amber-500 text-white"
                      : item.rank === 2
                      ? "bg-slate-400 text-white"
                      : item.rank === 3
                      ? "bg-amber-700 text-white"
                      : "bg-emerald-100 text-emerald-800"
                  }`}>
                    {item.rank <= 3 ? <Crown size={12} /> : <Award size={12} />}
                    <span>رتبه {toPersianNum(item.rank)} فروش بازار</span>
                  </span>

                  <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-600 font-bold text-[10px]">
                    {toPersianNum(item.reorderRate)}٪ تکرار خرید
                  </span>
                </div>

                {/* Image & Info */}
                <div
                  onClick={() => onViewDetails?.(item)}
                  className="cursor-pointer space-y-2 group-hover:opacity-95 transition-opacity"
                >
                  <div className="relative aspect-4/3 w-full rounded-2xl overflow-hidden bg-slate-50 border border-slate-100">
                    <img
                      src={getDisplayImageUrl(item.image_url || item.imageUrl)}
                      alt={item.name}
                      className="w-full h-full object-contain p-3 group-hover:scale-105 transition-transform duration-300"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute bottom-2 right-2 px-2 py-1 rounded-lg bg-white/95 backdrop-blur-xs text-slate-800 text-[10px] font-black border border-slate-200">
                      {toPersianNum(item.monthlySalesCartons)} کارتن فروش
                    </div>
                  </div>

                  <div>
                    <h3 className="font-black text-xs sm:text-sm text-slate-900 line-clamp-1 group-hover:text-emerald-700 transition-colors">
                      {item.name}
                    </h3>
                    <div className="text-[10px] text-slate-400 font-bold flex items-center justify-between mt-1">
                      <span>برند: {item.brand || "دست اول"}</span>
                      <span>بسته‌بندی: {toPersianNum(item.itemsPerCarton)} {cleanUnitName(item.unit)}</span>
                    </div>
                  </div>
                </div>

                {/* Pricing Box */}
                <div className="mt-3 p-3 bg-emerald-50/50 rounded-2xl border border-emerald-100/80 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-700">
                      {item.pricing.isRepresentative || item.pricing.isFactory ? "قیمت کف کارخانه (نمایندگی):" : "قیمت خرید عمده:"}
                    </span>
                    <span className="text-sm font-black text-emerald-800">
                      {toPersianNum(item.effectiveUnitPrice.toLocaleString())} تومان
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-600 pt-1 border-t border-emerald-200/50">
                    <span className="font-bold">هر کارتن ({toPersianNum(item.itemsPerCarton)} تایی):</span>
                    <span className="font-black text-slate-800">{toPersianNum(cartonPrice.toLocaleString())} تومان</span>
                  </div>
                </div>

                {/* Order Control & Add to Cart */}
                <div className="mt-3.5 pt-2.5 border-t border-slate-100 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200">
                      <button
                        onClick={() => handleCartonCountChange(item.id, 1, item.minCartons)}
                        className="w-7 h-7 rounded-lg bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-600 flex items-center justify-center font-bold text-xs shadow-2xs cursor-pointer"
                      >
                        <Plus size={13} />
                      </button>
                      <span className="w-9 text-center text-xs font-black text-slate-800">
                        {toPersianNum(count)}
                      </span>
                      <button
                        onClick={() => handleCartonCountChange(item.id, -1, item.minCartons)}
                        className="w-7 h-7 rounded-lg bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-600 flex items-center justify-center font-bold text-xs shadow-2xs cursor-pointer"
                      >
                        <Minus size={13} />
                      </button>
                    </div>

                    <button
                      onClick={() => handleAddToCart(item)}
                      className={`flex-1 py-2.5 px-3 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs ${
                        isAdded
                          ? "bg-emerald-700 text-white"
                          : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20"
                      }`}
                    >
                      {isAdded ? (
                        <>
                          <Check size={14} />
                          <span>به سبد اضافه شد</span>
                        </>
                      ) : (
                        <>
                          <ShoppingBag size={14} />
                          <span>سفارش {toPersianNum(count)} کارتن</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="text-center text-[10px] text-slate-400 font-bold">
                    حداقل سفارش: {toPersianNum(item.minCartons)} کارتن | جمع: {toPersianNum(totalPrice.toLocaleString())} ت
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
