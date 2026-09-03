import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Product, B2BConfig, SpecialOfferItem } from "../types";
import { getDisplayImageUrl, cleanUnitName } from "../lib/image-utils";
import { getProductOfferPricing } from "../lib/pricing";
import {
  Flame,
  Clock,
  Gift,
  CreditCard,
  TrendingDown,
  Sparkles,
  ShoppingBag,
  Percent,
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
  TrendingUp,
  Award,
  Zap,
  CheckCircle2,
  Info,
  Star,
} from "lucide-react";

interface SpecialOffersViewProps {
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

export default function SpecialOffersView({
  products,
  b2bConfig,
  user,
  userBadge,
  onAddToCart,
  onViewDetails,
  onBackToHome,
}: SpecialOffersViewProps) {
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'high_discount' | 'has_bonus' | 'cheque_allowed' | 'kafbazaar'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [cartonCounts, setCartonCounts] = useState<Record<string, number>>({});
  const [addedItems, setAddedItems] = useState<Record<string, boolean>>({});

  // Countdown timer
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number }>({
    hours: 14,
    minutes: 35,
    seconds: 42,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);
      const diff = Math.max(0, Math.floor((endOfDay.getTime() - now.getTime()) / 1000));

      const hours = Math.floor(diff / 3600);
      const minutes = Math.floor((diff % 3600) / 60);
      const seconds = diff % 60;

      setTimeLeft({ hours, minutes, seconds });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Compute special offer products directly from admin config or explicit products
  const specialOffers = useMemo(() => {
    const configItems: SpecialOfferItem[] = b2bConfig?.specialOffersConfig?.items || [];
    
    // 1. If admin configured items in SpecialOffersConfig, use them
    if (configItems.length > 0) {
      const activeConfigItems = configItems.filter(item => item.active !== false);
      const matched = activeConfigItems.map((item) => {
        const prod = products.find(p => p.id === item.productId) || {
          id: item.productId,
          name: item.productName || "محصول ویژه",
          brand: item.brand || "دست اول",
          bulk_price: item.bulkPrice || 10000,
          price: item.bulkPrice || 10000,
          image_url: item.imageUrl || "",
          category: item.category || "عمومی",
          carton_pack_count: 24,
          min_order_cartons: item.minOrderCartons || 5,
        } as Product;

        const rawDiscountPercent = item.discountPercent || prod.discount_percent || prod.discountPercent || 20;
        const offerPricing = getProductOfferPricing(prod, rawDiscountPercent, user, userBadge as any, b2bConfig);
        const itemsPerCarton = prod.carton_pack_count || prod.itemsPerUnit || 24;
        const minCartons = Math.max(1, item.minOrderCartons || prod.min_order_cartons || prod.minOrderCartons || 1);

        const totalCampaignQuota = item.campaignQuotaCartons || 50;
        const remainingQuota = Math.max(3, totalCampaignQuota - (item.soldQuotaCartons || 0));

        return {
          ...prod,
          offerPricing,
          computedDiscount: offerPricing.appliedDiscountPercent,
          hasBonus: !!item.bonusDescription || !!item.bonusGiftCartons,
          bonusText: item.bonusDescription || (item.bonusGiftCartons ? `هر ۱۰ کارتن + ${toPersianNum(item.bonusGiftCartons)} کارتن هدیه` : null),
          isCheque: item.chequeAllowed !== false,
          isKafBazaar: item.isKafBazaar !== false,
          originalPrice: offerPricing.originalUnitPrice,
          discountedUnitPrice: offerPricing.discountedUnitPrice,
          discountedCartonPrice: offerPricing.discountedCartonPrice,
          consumerPrice: prod.consumer_price || prod.consumerPrice || Math.round(offerPricing.originalUnitPrice * 1.35),
          itemsPerCarton,
          minCartons,
          totalCampaignQuota,
          remainingQuota,
          quotaPercent: Math.min(100, Math.round(((totalCampaignQuota - remainingQuota) / totalCampaignQuota) * 100)),
        };
      });

      if (matched.length > 0) return matched;
    }

    // 2. Fallback to explicitly marked products
    const explicitlyDiscounted = products.filter(
      p => !p.disabled && (
        (p.discount_percent && p.discount_percent > 0) ||
        (p.discountPercent && p.discountPercent > 0) ||
        p.isHotFireDeal ||
        p.weeklySaleActive
      )
    );

    return explicitlyDiscounted.map((p) => {
      const rawDiscountPercent = p.discount_percent || p.discountPercent || (p.weeklySaleDiscount ? p.weeklySaleDiscount : 20);
      const offerPricing = getProductOfferPricing(p, rawDiscountPercent, user, userBadge as any, b2bConfig);
      const itemsPerCarton = p.carton_pack_count || p.itemsPerUnit || 24;
      const minCartons = Math.max(1, p.min_order_cartons || p.minOrderCartons || 1);
      const totalCampaignQuota = p.weeklySaleQuota || 50;
      const remainingQuota = 15;

      return {
        ...p,
        offerPricing,
        computedDiscount: offerPricing.appliedDiscountPercent,
        hasBonus: p.badge && p.badge.includes("اشانتیون"),
        bonusText: p.badge && p.badge.includes("اشانتیون") ? p.badge : null,
        isCheque: p.chequeAllowed !== false,
        isKafBazaar: !!p.isKafBazaar,
        originalPrice: offerPricing.originalUnitPrice,
        discountedUnitPrice: offerPricing.discountedUnitPrice,
        discountedCartonPrice: offerPricing.discountedCartonPrice,
        consumerPrice: p.consumer_price || p.consumerPrice || Math.round(offerPricing.originalUnitPrice * 1.35),
        itemsPerCarton,
        minCartons,
        totalCampaignQuota,
        remainingQuota,
        quotaPercent: 65,
      };
    });
  }, [products, b2bConfig?.specialOffersConfig, user, userBadge, b2bConfig]);

  // Extract categories present in offers
  const categoriesInOffers = useMemo(() => {
    const set = new Set<string>();
    specialOffers.forEach(o => {
      if (o.category) set.add(o.category);
    });
    return Array.from(set);
  }, [specialOffers]);

  // Filtered list
  const filteredOffers = useMemo(() => {
    return specialOffers.filter(item => {
      // Category filter
      if (selectedCategory !== "all" && item.category !== selectedCategory) return false;

      // Type filter
      if (selectedFilter === "high_discount" && item.computedDiscount < 10) return false;
      if (selectedFilter === "has_bonus" && !item.hasBonus) return false;
      if (selectedFilter === "cheque_allowed" && !item.isCheque) return false;
      if (selectedFilter === "kafbazaar" && !item.isKafBazaar) return false;

      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = item.name && item.name.toLowerCase().includes(q);
        const matchBrand = item.brand && item.brand.toLowerCase().includes(q);
        const matchCat = item.category && item.category.toLowerCase().includes(q);
        if (!matchName && !matchBrand && !matchCat) return false;
      }

      return true;
    });
  }, [specialOffers, selectedCategory, selectedFilter, searchQuery]);

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
            <span className="text-xs font-black text-rose-600 flex items-center gap-1">
              <Flame size={15} />
              <span>پیشنهادات ویژه و آفرهای کارخانجات</span>
            </span>
          </div>

          {/* Countdown Clock */}
          <div className="flex items-center gap-1.5 bg-rose-50 border border-rose-200/80 px-3 py-1.5 rounded-xl">
            <Clock size={14} className="text-rose-600 shrink-0" />
            <span className="text-[11px] font-black text-slate-700">اعتبار آفرها:</span>
            <div className="flex items-center gap-1 text-rose-700 font-black text-xs dir-ltr">
              <span className="bg-white px-1.5 py-0.5 rounded shadow-2xs">{toPersianNum(String(timeLeft.hours).padStart(2, '0'))}</span>:
              <span className="bg-white px-1.5 py-0.5 rounded shadow-2xs">{toPersianNum(String(timeLeft.minutes).padStart(2, '0'))}</span>:
              <span className="bg-white px-1.5 py-0.5 rounded shadow-2xs">{toPersianNum(String(timeLeft.seconds).padStart(2, '0'))}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Grand Hero Banner */}
        <div className="bg-gradient-to-r from-rose-700 via-rose-600 to-amber-600 rounded-3xl p-6 sm:p-8 text-white shadow-lg shadow-rose-700/20 relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2.5 max-w-2xl z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-[11px] font-black border border-white/30">
              <Sparkles size={14} />
              <span>{b2bConfig?.specialOffersConfig?.campaignBadge || "جشنواره سراسری بنکداری و پخش ایران"}</span>
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black leading-tight">
              {b2bConfig?.specialOffersConfig?.campaignTitle || "پیشنهادات ویژه، تخفیفات تناژ و اشانتیون کارخانجات"}
            </h1>
            <p className="text-xs sm:text-sm text-rose-100 font-bold leading-relaxed">
              {b2bConfig?.specialOffersConfig?.campaignSubtitle || "خرید مستقیم از خط تولید با تضمین کف قیمت بازار، اشانتیون‌های رسمی کارتنی و امکان تسویه چکی صیادی برای سوپرمارکت‌ها و عمده‌فروشان"}
            </p>
          </div>

          {/* Quick Stats Badges */}
          <div className="grid grid-cols-2 gap-2.5 w-full md:w-auto shrink-0 z-10">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-3 text-center">
              <div className="text-lg sm:text-xl font-black">{toPersianNum(specialOffers.length)}</div>
              <div className="text-[10px] text-rose-100 font-bold">محصول در جشنواره</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-3 text-center">
              <div className="text-lg sm:text-xl font-black">تا {toPersianNum(25)}٪</div>
              <div className="text-[10px] text-rose-100 font-bold">حداکثر تخفیف مصوب</div>
            </div>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-2xs space-y-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="جستجو در نام کالا، برند یا دسته‌بندی پیشنهادات ویژه..."
                className="w-full pr-10 pl-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 outline-none focus:border-rose-500 focus:bg-white transition-all"
              />
            </div>

            {/* Sub-Filters Buttons */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
              <button
                onClick={() => setSelectedFilter('all')}
                className={`px-3 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                  selectedFilter === 'all'
                    ? "bg-rose-600 text-white shadow-xs"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                }`}
              >
                همه آفرها ({toPersianNum(specialOffers.length)})
              </button>

              <button
                onClick={() => setSelectedFilter('high_discount')}
                className={`px-3 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                  selectedFilter === 'high_discount'
                    ? "bg-rose-600 text-white shadow-xs"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                }`}
              >
                <Percent size={13} />
                <span>تخفیف‌های بالای ۱۰٪</span>
              </button>

              <button
                onClick={() => setSelectedFilter('has_bonus')}
                className={`px-3 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                  selectedFilter === 'has_bonus'
                    ? "bg-rose-600 text-white shadow-xs"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                }`}
              >
                <Gift size={13} />
                <span>دارای اشانتیون</span>
              </button>

              <button
                onClick={() => setSelectedFilter('cheque_allowed')}
                className={`px-3 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                  selectedFilter === 'cheque_allowed'
                    ? "bg-rose-600 text-white shadow-xs"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                }`}
              >
                <CreditCard size={13} />
                <span>تسویه چکی</span>
              </button>
            </div>
          </div>

          {/* Category Pills if more than 1 */}
          {categoriesInOffers.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pt-2 border-t border-slate-100 pb-1">
              <span className="text-[11px] font-black text-slate-400 whitespace-nowrap">دسته‌بندی:</span>
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                  selectedCategory === 'all'
                    ? "bg-slate-800 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                همه
              </button>
              {categoriesInOffers.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                    selectedCategory === cat
                      ? "bg-slate-800 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Offers Grid */}
        {filteredOffers.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-3">
            <Flame size={40} className="mx-auto text-slate-300" />
            <h3 className="text-sm font-black text-slate-700">هیچ پیشنهادی مطابق با فیلتر انتخابی یافت نشد</h3>
            <p className="text-xs text-slate-400 font-bold">لطفاً فیلترها را تغییر داده یا از جستجوی کلمات دیگر استفاده کنید.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredOffers.map((item, idx) => {
              const count = cartonCounts[item.id] || item.minCartons;
              const isAdded = addedItems[item.id];
              const cartonPrice = item.discountedCartonPrice;
              const totalPrice = cartonPrice * count;

              // Retailer potential profit per carton
              const consumerCartonRevenue = item.consumerPrice * item.itemsPerCarton;
              const retailerProfitPerCarton = consumerCartonRevenue - cartonPrice;
              const profitPercent = Math.round((retailerProfitPerCarton / cartonPrice) * 100);

              return (
                <div
                  key={`special-offer-view-${item.id}-${idx}`}
                  className="bg-white rounded-3xl p-4 border border-rose-100/90 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group relative"
                >
                  {/* Badges Bar */}
                  <div className="flex items-center justify-between gap-1 mb-2.5">
                    <span className="px-2.5 py-1 rounded-xl bg-emerald-600 text-white font-black text-xs flex items-center gap-1 shadow-xs border border-emerald-500">
                      <Star size={12} className="fill-white text-white" />
                      <span>آفر ویژه مستقیم</span>
                    </span>

                    {item.computedDiscount > 0 && (
                      <span className="px-2.5 py-1 rounded-xl bg-rose-600 text-white font-black text-xs flex items-center gap-1 shadow-2xs">
                        <Percent size={13} />
                        <span>{toPersianNum(item.computedDiscount)}٪ تخفیف</span>
                      </span>
                    )}

                    {item.hasBonus && item.bonusText && (
                      <span className="px-2 py-0.5 rounded-lg bg-amber-100 text-amber-900 font-black text-[10px] truncate max-w-[150px]" title={item.bonusText}>
                        🎁 {item.bonusText}
                      </span>
                    )}
                  </div>

                  {/* Image & Click */}
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
                      {item.isCheque && (
                        <span className="absolute bottom-2 right-2 px-2 py-1 rounded-lg bg-white/95 backdrop-blur-xs text-slate-800 text-[10px] font-black border border-slate-200 flex items-center gap-1 shadow-2xs">
                          <CreditCard size={12} className="text-emerald-600" />
                          <span>تسویه چکی صیادی</span>
                        </span>
                      )}
                    </div>

                    <div>
                      <h3 className="font-black text-xs sm:text-sm text-slate-900 line-clamp-1 group-hover:text-rose-600 transition-colors">
                        {item.name}
                      </h3>
                      <div className="text-[10px] text-slate-400 font-bold flex items-center justify-between mt-1">
                        <span>برند: {item.brand || "دست اول"}</span>
                        <span>بسته‌بندی: {toPersianNum(item.itemsPerCarton)} {cleanUnitName(item.unit)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Pricing Details */}
                  <div className="mt-3 p-3 bg-rose-50/50 rounded-2xl border border-rose-100/80 space-y-1.5">
                    {item.originalPrice > item.discountedUnitPrice && (
                      <div className="flex items-center justify-between text-[10.5px] text-slate-400">
                        <span>{item.offerPricing.isRepresentative ? "قیمت پایه کارخانه:" : "قیمت بدون تخفیف:"}</span>
                        <span className="line-through font-bold">{toPersianNum(item.originalPrice.toLocaleString())} تومان</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-700">
                        {item.offerPricing.priceLabel}
                      </span>
                      <span className="text-sm font-black text-rose-600">
                        {toPersianNum(item.discountedUnitPrice.toLocaleString())} تومان
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-emerald-700 pt-1 border-t border-rose-200/50">
                      <span className="font-bold">قیمت هر کارتن ({toPersianNum(item.itemsPerCarton)} تایی):</span>
                      <span className="font-black">{toPersianNum(cartonPrice.toLocaleString())} تومان</span>
                    </div>

                    {retailerProfitPerCarton > 0 && (
                      <div className="flex items-center justify-between text-[10px] text-emerald-800 bg-emerald-50 px-2 py-1 rounded-lg font-bold border border-emerald-200/70">
                        <span>حاشیه سود مغازه‌دار:</span>
                        <span>+{toPersianNum(profitPercent)}٪ ({toPersianNum(retailerProfitPerCarton.toLocaleString())} ت در هر کارتن)</span>
                      </div>
                    )}
                  </div>

                  {/* Campaign Quota Progress */}
                  <div className="mt-3 space-y-1">
                    <div className="flex justify-between text-[10px] text-slate-500 font-bold">
                      <span>سهمیه باقی‌مانده خط تولید:</span>
                      <span className="text-rose-700 font-black">{toPersianNum(item.remainingQuota)} از {toPersianNum(item.totalCampaignQuota)} کارتن</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-rose-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${item.quotaPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Order Control & Add to Cart */}
                  <div className="mt-3.5 pt-2.5 border-t border-slate-100 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200">
                        <button
                          onClick={() => handleCartonCountChange(item.id, 1, item.minCartons)}
                          className="w-7 h-7 rounded-lg bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-600 flex items-center justify-center font-bold text-xs shadow-2xs cursor-pointer"
                        >
                          <Plus size={13} />
                        </button>
                        <span className="w-9 text-center text-xs font-black text-slate-800">
                          {toPersianNum(count)}
                        </span>
                        <button
                          onClick={() => handleCartonCountChange(item.id, -1, item.minCartons)}
                          className="w-7 h-7 rounded-lg bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-600 flex items-center justify-center font-bold text-xs shadow-2xs cursor-pointer"
                        >
                          <Minus size={13} />
                        </button>
                      </div>

                      <button
                        onClick={() => handleAddToCart(item)}
                        className={`flex-1 py-2.5 px-3 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs ${
                          isAdded
                            ? "bg-emerald-600 text-white"
                            : "bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20"
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
        )}
      </div>
    </div>
  );
}
