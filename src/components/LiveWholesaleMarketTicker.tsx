import React, { useState, useMemo } from "react";
import { 
  TrendingUp, 
  X,
  Megaphone,
  Building,
  Package,
  Truck,
  CreditCard
} from "lucide-react";
import { Product } from "../types";
import { getProductRolePricing } from "../lib/pricing";

interface LiveWholesaleMarketTickerProps {
  products?: Product[];
  ads?: any[];
  factories?: any[];
  news?: any[];
  userBadge?: string;
  userCity?: string;
  activeTab?: string;
  onOpenLogistics?: () => void;
  onOpenQuickOrder?: () => void;
  onSelectProduct?: (product: Product) => void;
  onNavigateTab?: (tab: string) => void;
  onClose?: () => void;
}

export default function LiveWholesaleMarketTicker({ 
  products = [], 
  ads = [],
  factories = [],
  news = [],
  userBadge = "bronze",
  userCity = "تهران",
  activeTab,
  onOpenLogistics, 
  onOpenQuickOrder,
  onSelectProduct,
  onNavigateTab,
  onClose
}: LiveWholesaleMarketTickerProps) {
  const [isPaused, setIsPaused] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // Auto resume scrolling on tab change
  React.useEffect(() => {
    setIsPaused(false);
  }, [activeTab]);

  // Generate REAL ticker items directly covering Products, Ads, Factories, Raw Materials & Logistics
  const tickerItems = useMemo(() => {
    const items: Array<{
      id: string;
      title: string;
      value: string;
      change: string;
      tag: string;
      product?: Product;
      type: "product" | "ad" | "factory" | "raw_material" | "logistics" | "promo";
      targetTab: string;
      badgeBg?: string;
      badgeText?: string;
    }> = [];

    // 1. PRODUCTS (کالای عمده کارخانه)
    if (products && products.length > 0) {
      const activeProducts = products.filter(p => {
        if (!p) return false;
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
      activeProducts.slice(0, 6).forEach((prod, index) => {
        const pricing = getProductRolePricing(prod, userBadge);
        const packCount = prod.carton_pack_count || 24;
        const unitWholesalePrice = pricing.unitWholesalePrice;
        const consumerPrice = pricing.consumerPrice || Math.round(unitWholesalePrice * 1.25);
        const unitProfit = Math.max(0, consumerPrice - unitWholesalePrice);
        const profitPercent = consumerPrice > 0 ? Math.round((unitProfit / consumerPrice) * 100) : 20;

        items.push({
          id: `prod-ticker-${prod.id || index}`,
          title: prod.name,
          value: `خرید تکی: ${unitWholesalePrice.toLocaleString('fa-IR')} تومان`,
          change: `🔥 سود تکی: ${unitProfit.toLocaleString('fa-IR')} تومان (${profitPercent.toLocaleString('fa-IR')}٪ سود) | کارتن ${packCount.toLocaleString('fa-IR')} عددی`,
          tag: "کالای عمده",
          product: prod,
          type: "product",
          targetTab: "order",
          badgeBg: "bg-emerald-100 border-emerald-300 text-emerald-900"
        });
      });
    } else {
      items.push(
        { id: "fb-p1", title: "چی‌توز موتوری کچاپ", value: "خرید تکی: ۱۰,۰۰۰ تومان", change: "🔥 سود تکی: ۳,۰۰۰ تومان (۲۳٪ سود) | کارتن ۲۴ عددی", tag: "کالای عمده", type: "product", targetTab: "order", badgeBg: "bg-emerald-100 border-emerald-300 text-emerald-900" },
        { id: "fb-p2", title: "مزمز طلایی پیاز جعفری", value: "خرید تکی: ۱۰,۷۵۰ تومان", change: "🔥 سود تکی: ۲,۲۵0 تومان (۱۷٪ سود) | کارتن ۲۰ عددی", tag: "کالای عمده", type: "product", targetTab: "order", badgeBg: "bg-emerald-100 border-emerald-300 text-emerald-900" }
      );
    }

    // 2. ADS / AUCTIONS / BILLBOARD (آگهی‌ها و حراج)
    if (ads && ads.length > 0) {
      ads.slice(0, 4).forEach((ad, idx) => {
        items.push({
          id: `ad-ticker-${ad.id || idx}`,
          title: ad.title || "حراج فوری کف بازار",
          value: `قیمت: ${ad.wholesalePrice || 'زیر نرخ صنف'}`,
          change: "📢 مشاهده آگهی در تالار عرضه بار",
          tag: "آگهی فوری",
          type: "ad",
          targetTab: "billboard",
          badgeBg: "bg-emerald-100 border-amber-300 text-amber-900"
        });
      });
    } else {
      items.push(
        { id: "fb-ad1", title: "حراج ۱,۰۰۰ کارتن رب گوجه فرنگی", value: "کف قیمت کارخانه ۵٪ زیر بازار", change: "📢 مشاهده آگهی در تالار عرضه بار", tag: "آگهی فوری", type: "ad", targetTab: "billboard", badgeBg: "bg-emerald-100 border-amber-300 text-amber-900" },
        { id: "fb-ad2", title: "واگذاری فوری ۵۰۰ کارتن تن ماهی جنوب", value: "حراج نقدی امانی با ضمانت پلتفرم", change: "📢 مشاهده آگهی در تالار عرضه بار", tag: "آگهی فوری", type: "ad", targetTab: "billboard", badgeBg: "bg-emerald-100 border-amber-300 text-amber-900" }
      );
    }

    // 3. FACTORIES (ویترین کارخانجات)
    if (factories && factories.length > 0) {
      factories.slice(0, 3).forEach((fac, idx) => {
        items.push({
          id: `fac-ticker-${fac.id || idx}`,
          title: `کارخانه ${fac.name || fac.title || 'صنایع غذایی'}`,
          value: `تولیدکننده رسمی: ${fac.category || fac.city || 'عرضه مستقیم'}`,
          change: "🏭 مشاهده ویترین و ثبت سفارش مستقیم",
          tag: "کارخانه",
          type: "factory",
          targetTab: "factories",
          badgeBg: "bg-emerald-100 border-indigo-300 text-indigo-900"
        });
      });
    }

    // 4. RAW MATERIALS & BOURSE NEWS (مواد اولیه و بورس)
    if (news && news.length > 0) {
      news.slice(0, 3).forEach((nw, idx) => {
        items.push({
          id: `nw-ticker-${nw.id || idx}`,
          title: nw.title || "عرضه مواد اولیه صنایع غذایی",
          value: "نرخ مرجع بورس کالا",
          change: "📦 مشاهده اخبار بورس و مواد اولیه",
          tag: "مواد اولیه",
          type: "raw_material",
          targetTab: "news",
          badgeBg: "bg-purple-100 border-purple-300 text-purple-900"
        });
      });
    } else {
      items.push(
        { id: "fb-rm1", title: "عرضه بورس شکر خام و روغن صنعتی", value: "تحویل درب کارخانه با فاکتور رسمی", change: "📦 مشاهده بورس و مواد اولیه", tag: "مواد اولیه", type: "raw_material", targetTab: "news", badgeBg: "bg-purple-100 border-purple-300 text-purple-900" },
        { id: "fb-rm2", title: "قیمت مرجع گندم و آرد صنف و صنعت", value: "استعلام نرخ زنده بازارگاه", change: "📦 مشاهده بورس و مواد اولیه", tag: "مواد اولیه", type: "raw_material", targetTab: "news", badgeBg: "bg-purple-100 border-purple-300 text-purple-900" }
      );
    }

    // 5. LOGISTICS & CREDIT
    items.push(
      { 
        id: "logistics-1", 
        title: `حمل مستقیم باربری از انبار به ${userCity || "سراسر کشور"}`, 
        value: "بارنامه رسمی + ۱۰۰٪ ضمانت سلامت بار", 
        change: "🚛 محاسبه آنلاین هزینه‌های ترابری", 
        tag: "لجستیک",
        type: "logistics",
        targetTab: "logistics",
        badgeBg: "bg-blue-100 border-blue-300 text-blue-900"
      },
      { 
        id: "promo-1", 
        title: "اعتبار خرید چکی بنکداران و سوپرمارکت‌ها", 
        value: "تسویه چکی صیادی تا ۴ ماه بدون ضامن", 
        change: "💳 ثبت درخواست اعتبار خرید", 
        tag: "اعتبار چکی",
        type: "promo",
        targetTab: "order",
        badgeBg: "bg-emerald-100 border-rose-300 text-rose-900"
      }
    );

    return items;
  }, [products, ads, factories, news, userBadge, userCity]);

  if (isDismissed) return null;

  return (
    <div 
      className="relative bg-white text-slate-800 border-b border-slate-200/90 py-2 overflow-hidden text-xs shadow-2xs select-none z-30"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="max-w-7xl mx-auto px-2 sm:px-4 flex items-center justify-between gap-2">
        {/* Marquee Ticker Container */}
        <div className="relative flex-1 overflow-hidden">
          <div 
            className="flex items-center gap-6 whitespace-nowrap"
            style={{
              animation: 'marquee 120s linear infinite',
              animationPlayState: isPaused ? 'paused' : 'running',
              display: 'inline-flex'
            }}
          >
            {[...tickerItems, ...tickerItems].map((item, idx) => (
              <div 
                key={`${item.id}-${idx}`}
                className="inline-flex items-center gap-2 text-slate-700 hover:text-indigo-950 transition-colors cursor-pointer group bg-slate-50 hover:bg-emerald-50/90 px-3 py-1 rounded-xl border border-slate-200/80 shadow-2xs text-[11px]"
                onClick={(e) => {
                  try {
                    e.stopPropagation();
                    setIsPaused(false);
                    if (item.type === "product") {
                      if (onNavigateTab) onNavigateTab("order");
                      if (item.product && onSelectProduct) onSelectProduct(item.product);
                    } else if (item.type === "ad") {
                      if (onNavigateTab) onNavigateTab("billboard");
                    } else if (item.type === "factory") {
                      if (onNavigateTab) onNavigateTab("factories");
                    } else if (item.type === "raw_material") {
                      if (onNavigateTab) onNavigateTab("news");
                    } else if (item.type === "logistics") {
                      if (onOpenLogistics) onOpenLogistics();
                    } else if (item.type === "promo") {
                      if (onNavigateTab) onNavigateTab("order");
                      if (onOpenQuickOrder) onOpenQuickOrder();
                    } else if (item.targetTab && onNavigateTab) {
                      onNavigateTab(item.targetTab);
                    }
                  } catch (err) {
                    console.error("Ticker click navigation error:", err);
                  }
                }}
              >
                <span className={`text-[10px] px-2 py-0.5 rounded-lg font-black border ${item.badgeBg || "bg-emerald-100 text-amber-900 border-amber-300"}`}>
                  {item.tag}
                </span>
                <span className="font-bold text-slate-900">{item.title}:</span>
                <span className="font-black text-indigo-950 font-sans">{item.value}</span>
                <span className="text-[10px] font-sans font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/80 flex items-center gap-1">
                  <TrendingUp size={11} />
                  {item.change}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Dismiss / Close Button */}
        <button
          onClick={() => {
            setIsDismissed(true);
            if (onClose) onClose();
          }}
          title="بستن نوار زنده"
          className="shrink-0 p-1 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer flex items-center justify-center border border-transparent hover:border-slate-200"
        >
          <X size={15} />
        </button>
      </div>

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(50%); }
        }
      `}</style>
    </div>
  );
}
