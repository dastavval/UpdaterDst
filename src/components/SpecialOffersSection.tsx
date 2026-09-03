import React, { useState, useEffect, useMemo, useRef } from "react";
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
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Eye,
  Tag,
  BadgePercent,
  Layers,
  Building2,
  Zap,
  Star,
  ArrowLeft,
  ArrowRight,
  SlidersHorizontal,
} from "lucide-react";

interface SpecialOffersSectionProps {
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

export default function SpecialOffersSection({
  products,
  b2bConfig,
  user,
  userBadge,
  onAddToCart,
  onViewDetails,
  setActiveTab,
  userRole = "customer",
}: SpecialOffersSectionProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [cartonCounts, setCartonCounts] = useState<Record<string, number>>({});
  const [addedItems, setAddedItems] = useState<Record<string, boolean>>({});

  // Countdown timer for daily flash deals
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

  // Compute authorized special offer products directly from admin config or explicit product fields
  const specialOffers = useMemo(() => {
    const configItems: SpecialOfferItem[] = b2bConfig?.specialOffersConfig?.items || [];
    const isCampaignActive = b2bConfig?.specialOffersConfig?.campaignActive !== false;

    if (!isCampaignActive) return [];

    // 1. If admin configured items in SpecialOffersConfig, use them
    if (configItems.length > 0) {
      const activeConfigItems = configItems.filter(item => item.active !== false);
      const matched = activeConfigItems.map((item, idx) => {
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
          itemsPerCarton,
          minCartons,
          totalCampaignQuota,
          remainingQuota,
          quotaPercent: Math.min(100, Math.round(((totalCampaignQuota - remainingQuota) / totalCampaignQuota) * 100)),
        };
      });

      if (matched.length > 0) return matched;
    }

    // 2. Fallback to products explicitly marked with isFeatured, specialOfferActive, or real discount percent
    const explicitlyDiscounted = products.filter(
      p => !p.disabled && (
        p.isFeatured ||
        p.specialOfferActive ||
        (p.discount_percent && p.discount_percent > 0) ||
        (p.discountPercent && p.discountPercent > 0) ||
        p.isHotFireDeal ||
        p.weeklySaleActive
      )
    );

    return explicitlyDiscounted.map((p, idx) => {
      const rawDiscountPercent = p.discount_percent || p.discountPercent || (p.weeklySaleDiscount ? p.weeklySaleDiscount : 20);
      const offerPricing = getProductOfferPricing(p, rawDiscountPercent, user, userBadge as any, b2bConfig);
      const itemsPerCarton = p.carton_pack_count || p.itemsPerUnit || 24;
      const minCartons = Math.max(1, p.min_order_cartons || p.minOrderCartons || 1);
      const totalCampaignQuota = p.weeklySaleQuota || 50;
      const remainingQuota = Math.max(5, Math.round(totalCampaignQuota * 0.4));

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
        itemsPerCarton,
        minCartons,
        totalCampaignQuota,
        remainingQuota,
        quotaPercent: 60,
      };
    });
  }, [products, b2bConfig?.specialOffersConfig, user, userBadge, b2bConfig]);

  // Scroll handlers for horizontal carousel
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

  // If no active offers, do not render heavy empty block
  if (specialOffers.length === 0) return null;

  return (
    <section className="bg-gradient-to-l from-rose-500/5 via-amber-500/2 to-transparent rounded-3xl p-4 sm:p-5 border border-rose-200/50 shadow-sm premium-gold-glow space-y-3.5 text-right relative overflow-hidden" dir="rtl">
      {/* Header with Countdown and Dedicated Page CTA */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-rose-600 text-white flex items-center justify-center shadow-md shadow-rose-600/20 shrink-0">
            <Flame size={22} className="animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xs sm:text-sm md:text-base font-black text-slate-900">
                {b2bConfig?.specialOffersConfig?.campaignBadge || "آفرهای ویژه و حراج کارخانجات"}
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-rose-600 text-white animate-pulse whitespace-nowrap">
                قیمت کف بازار
              </span>
            </div>
            <p className="text-[10px] sm:text-[10.5px] text-slate-500 font-bold">
              تخفیف ویژه تولیدی، اشانتیون و تسویه چکی
            </p>
          </div>
        </div>

        {/* Right side: Countdown + Dedicated Page CTA */}
        <div className="flex flex-col xs:flex-row items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          {/* Compact Countdown */}
          <div className="flex items-center gap-1 bg-white/90 backdrop-blur-xs border border-rose-200/80 px-2.5 py-1.5 rounded-xl shadow-2xs">
            <Clock size={13} className="text-rose-600 shrink-0" />
            <span className="text-[10px] font-black text-slate-500">فرصت امروز:</span>
            <div className="flex items-center gap-0.5 text-rose-700 font-black text-[11px] dir-ltr">
              <span className="w-5 text-center bg-rose-50 rounded py-0.5">{toPersianNum(String(timeLeft.hours).padStart(2, '0'))}</span>:
              <span className="w-5 text-center bg-rose-50 rounded py-0.5">{toPersianNum(String(timeLeft.minutes).padStart(2, '0'))}</span>:
              <span className="w-5 text-center bg-rose-50 rounded py-0.5">{toPersianNum(String(timeLeft.seconds).padStart(2, '0'))}</span>
            </div>
          </div>

          {/* Dedicated Page Button */}
          {setActiveTab && (
            <button
              onClick={() => {
                setActiveTab('special-offers');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-sm shadow-rose-600/20 shrink-0 w-full xs:w-auto justify-center"
            >
              <span>مشاهده همه آفرها</span>
              <ArrowLeft size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Horizontal Scroll Navigation Controls */}
      <div className="relative group">
        {/* Navigation Buttons for Desktop */}
        <button
          onClick={() => handleScroll("right")}
          aria-label="اسکرول به راست"
          className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white/95 border border-slate-200 text-slate-700 items-center justify-center shadow-md hover:bg-rose-50 hover:text-rose-600 transition-all cursor-pointer"
        >
          <ChevronRight size={18} />
        </button>

        <button
          onClick={() => handleScroll("left")}
          aria-label="اسکرول به چپ"
          className="hidden md:flex absolute -left-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white/95 border border-slate-200 text-slate-700 items-center justify-center shadow-md hover:bg-rose-50 hover:text-rose-600 transition-all cursor-pointer"
        >
          <ChevronLeft size={18} />
        </button>

        {/* Horizontal Carousel Track */}
        <div
          ref={scrollContainerRef}
          className="flex items-stretch gap-3.5 overflow-x-auto pb-2 pt-1 px-1 snap-x snap-mandatory no-scrollbar scroll-smooth"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {specialOffers.map((item, idx) => {
            const count = cartonCounts[item.id] || item.minCartons;
            const isAdded = addedItems[item.id];
            const cartonPrice = item.discountedCartonPrice;
            const totalPrice = cartonPrice * count;

            return (
              <div
                key={`special-offer-sec-${item.id}-${idx}`}
                className="snap-start shrink-0 w-[270px] sm:w-[290px] bg-white rounded-2xl p-3.5 border border-slate-100 shadow-material-sm hover:shadow-material-lg hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group/card relative"
              >
                {/* Badges Header */}
                <div className="flex items-center justify-between gap-1 mb-2">
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-black text-[10px] flex items-center gap-1 shadow-xs border border-emerald-500">
                    <Star size={11} className="fill-white text-white" />
                    <span>آفر ویژه مستقیم</span>
                  </span>

                  {item.computedDiscount > 0 && (
                    <span className="px-2 py-0.5 rounded-lg bg-rose-600 text-white font-black text-[10px] flex items-center gap-1 shadow-2xs">
                      <Percent size={11} />
                      <span>{toPersianNum(item.computedDiscount)}٪ تخفیف</span>
                    </span>
                  )}

                  {item.hasBonus && item.bonusText && (
                    <span className="px-2 py-0.5 rounded-lg bg-amber-100 text-amber-900 font-black text-[9.5px] truncate max-w-[120px]" title={item.bonusText}>
                      🎁 {item.bonusText}
                    </span>
                  )}
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
                    {item.isCheque && (
                      <span className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded-md bg-white/90 backdrop-blur-xs text-slate-800 text-[9px] font-black border border-slate-200 flex items-center gap-1">
                        <CreditCard size={10} className="text-emerald-600" />
                        <span>چک صیادی</span>
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="font-black text-xs text-slate-900 line-clamp-1 group-hover/card:text-rose-600 transition-colors">
                      {item.name}
                    </h3>
                    <div className="text-[10px] text-slate-400 font-bold flex items-center justify-between mt-0.5">
                      <span>برند: {item.brand || "دست اول"}</span>
                      <span>بسته‌بندی: {toPersianNum(item.itemsPerCarton)} {cleanUnitName(item.unit)}</span>
                    </div>
                  </div>
                </div>

                {/* Pricing Box */}
                <div className="mt-2.5 p-2 bg-rose-50/50 rounded-xl border border-rose-100/80 space-y-1">
                  {item.originalPrice > item.discountedUnitPrice && (
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>{item.offerPricing.isRepresentative ? "قیمت پایه کارخانه:" : "قیمت بدون تخفیف:"}</span>
                      <span className="line-through font-bold">{toPersianNum(item.originalPrice.toLocaleString())} ت</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-[10.5px] font-black text-slate-700">
                      {item.offerPricing.priceLabel}
                    </span>
                    <span className="text-xs font-black text-rose-600">
                      {toPersianNum(item.discountedUnitPrice.toLocaleString())} تومان
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[9.5px] text-emerald-700 pt-0.5 border-t border-rose-200/40">
                    <span>هر کارتن ({toPersianNum(item.itemsPerCarton)} تایی):</span>
                    <span className="font-black">{toPersianNum(cartonPrice.toLocaleString())} ت</span>
                  </div>
                </div>

                {/* Carton Counter & Add to Cart */}
                <div className="mt-3 pt-2 border-t border-slate-100 space-y-2">
                  <div className="flex items-center justify-between gap-1.5">
                    <div className="flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200">
                      <button
                        onClick={() => handleCartonCountChange(item.id, 1, item.minCartons)}
                        className="w-6 h-6 rounded-lg bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-600 flex items-center justify-center font-bold text-xs shadow-2xs cursor-pointer"
                      >
                        <Plus size={12} />
                      </button>
                      <span className="w-8 text-center text-xs font-black text-slate-800">
                        {toPersianNum(count)}
                      </span>
                      <button
                        onClick={() => handleCartonCountChange(item.id, -1, item.minCartons)}
                        className="w-6 h-6 rounded-lg bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-600 flex items-center justify-center font-bold text-xs shadow-2xs cursor-pointer"
                      >
                        <Minus size={12} />
                      </button>
                    </div>

                    <button
                      onClick={() => handleAddToCart(item)}
                      className={`flex-1 py-2 px-2.5 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs ${
                        isAdded
                          ? "bg-emerald-600 text-white"
                          : "bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20"
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
