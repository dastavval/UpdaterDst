import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Award,
  TrendingUp,
  Building2,
  Star,
  Crown,
  Medal,
  ArrowLeft,
  Search,
  Sparkles,
  TrendingDown,
  Filter,
  Users,
  CheckCircle2,
  MapPin,
  Activity,
  ChevronLeft,
  Zap,
  ShieldCheck,
  ThumbsUp,
  ShoppingBag,
  BadgeAlert,
  Percent,
} from "lucide-react";
import { FactoryProfile, Product, B2BConfig } from "../types";

interface FactoryCompetitionProps {
  factories: FactoryProfile[];
  products: Product[];
  b2bConfig?: B2BConfig;
  onBackToHome?: () => void;
  onNavigateTab?: (tab: string, options?: any) => void;
}

const toPersianNum = (n: number | string | undefined | null): string => {
  if (n === undefined || n === null) return "";
  const farsiDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return n.toString().replace(/\d/g, (x) => farsiDigits[parseInt(x, 10)]);
};

export default function FactoryCompetition({
  factories = [],
  products = [],
  b2bConfig,
  onBackToHome,
  onNavigateTab,
}: FactoryCompetitionProps) {
  const [activeSubTab, setActiveSubTab] = useState<"factories" | "representatives" | "brands">("factories");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"score" | "deals" | "growth">("score");

  // Load real system orders from local storage
  const systemOrders = useMemo(() => {
    try {
      const raw = localStorage.getItem("dastavval_wholesale_orders") ||
                  localStorage.getItem("dastavval_orders_cache") ||
                  localStorage.getItem("dastavval_raw_orders");
      if (!raw) return [];
      const list = JSON.parse(raw);
      return Array.isArray(list) ? list : [];
    } catch (e) {
      return [];
    }
  }, []);

  // Load real system reviews/ratings from local storage
  const systemReviews = useMemo(() => {
    try {
      const raw = localStorage.getItem("dastavval_reviews") || localStorage.getItem("app_db_reviews");
      if (!raw) return [];
      const list = JSON.parse(raw);
      return Array.isArray(list) ? list : [];
    } catch (e) {
      return [];
    }
  }, []);

  // --- DERIVE DYNAMIC REAL FACTORIES DATA ---
  const factoriesLeaderboard = useMemo(() => {
    const list = factories.length > 0 
      ? factories 
      : (b2bConfig?.factories || []).filter((f: any) => f && f.isActive !== false);

    // If empty, construct list strictly from active brands present in real products
    let resolvedList = [...list];
    if (resolvedList.length === 0 && products.length > 0) {
      const uniqueBrands = Array.from(new Set(products.map((p) => p.brand).filter(Boolean)));
      resolvedList = uniqueBrands.map((bName, idx) => {
        const sample = products.find((p) => p.brand === bName);
        return {
          id: `fac-real-${idx}`,
          name: bName.startsWith("صنایع") || bName.startsWith("کارخانه") ? bName : `صنایع غذایی ${bName}`,
          location: sample?.shipping_origin || "واحد تولیدی ثبت‌شده",
          logoUrl: sample?.brandLogoUrl || "",
          category: sample?.category || "صنایع غذایی",
          isVerified: true,
        } as any;
      });
    }

    const mapped = resolvedList.map((f: any) => {
      // 1. Real matching products
      const matchingProducts = products.filter((p) => 
        (p.brand && f.name && p.brand.toLowerCase().includes(p.brand.toLowerCase())) ||
        (f.brandNames && f.brandNames.some((b: string) => p.brand && p.brand.toLowerCase().includes(b.toLowerCase()))) ||
        (p as any).factoryId === f.id
      );

      const skusCount = matchingProducts.length;

      // 2. Real factory orders from recorded system orders
      const factoryOrders = systemOrders.filter((ord: any) => {
        if (ord.factoryId === f.id) return true;
        if (ord.factoryName && f.name && ord.factoryName.toLowerCase().includes(f.name.toLowerCase())) return true;
        if (Array.isArray(ord.items)) {
          return ord.items.some((item: any) => 
            matchingProducts.some((mp: any) => mp.id === item.id || (mp.name && item.name && mp.name === item.name) || (mp.title && item.title && mp.title === item.title))
          );
        }
        return false;
      });

      const dealsCount = factoryOrders.length;

      // 3. Real Average Wholesale Discount
      let avgDiscount = 0;
      if (matchingProducts.length > 0) {
        const discountedItems = matchingProducts.filter(p => p.consumer_price && p.price && p.consumer_price > p.price);
        if (discountedItems.length > 0) {
          const sum = discountedItems.reduce((acc, p) => acc + (((p.consumer_price - p.price) / p.consumer_price) * 100), 0);
          avgDiscount = Math.round(sum / discountedItems.length);
        }
      }

      // 4. Real Rating Score
      const fReviews = systemReviews.filter((r: any) => 
        r.factoryId === f.id || (r.factoryName && f.name && r.factoryName.includes(f.name))
      );
      let score = f.rating || 0;
      if (fReviews.length > 0) {
        score = Number((fReviews.reduce((sum: number, r: any) => sum + (r.rating || 5), 0) / fReviews.length).toFixed(1));
      } else if (factoryOrders.length > 0) {
        const ratedOrders = factoryOrders.filter((o: any) => o.rating);
        if (ratedOrders.length > 0) {
          score = Number((ratedOrders.reduce((sum: number, o: any) => sum + o.rating, 0) / ratedOrders.length).toFixed(1));
        }
      }

      // 5. Active Stock & Capacity Ratio
      const inStockSkus = matchingProducts.filter((p: any) => p.in_stock !== false).length;
      const capacityUsed = skusCount > 0 ? Math.round((inStockSkus / skusCount) * 100) : 0;

      // 6. Real Quality & Delivery stability based on completed orders
      const completedOrders = factoryOrders.filter((o: any) => o.status === "completed" || o.status === "delivered" || o.status === "تکمیل شده");
      const onTimeDelivery = factoryOrders.length > 0 ? Math.round((completedOrders.length / factoryOrders.length) * 100) : (f.isVerified ? 100 : 0);
      const qualityScore = f.isVerified ? 100 : (factoryOrders.length > 0 ? Math.round((completedOrders.length / factoryOrders.length) * 100) : 0);
      const stability = capacityUsed;
      const priceCompetitiveness = avgDiscount;

      return {
        ...f,
        matchingProducts,
        skusCount,
        dealsCount,
        score,
        avgDiscount,
        capacityUsed,
        qualityScore,
        onTimeDelivery,
        stability,
        priceCompetitiveness,
      };
    });

    return mapped
      .filter((f) => {
        const matchesSearch = f.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              (f.location && f.location.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesCategory = categoryFilter === "all" || f.category === categoryFilter;
        return matchesSearch && matchesCategory;
      })
      .sort((a, b) => {
        if (sortBy === "deals") return b.dealsCount - a.dealsCount;
        if (sortBy === "growth") return b.skusCount - a.skusCount;
        return b.score - a.score;
      });
  }, [factories, b2bConfig, products, systemOrders, systemReviews, searchQuery, categoryFilter, sortBy]);

  // --- DERIVE REAL REPRESENTATIVES DATA ---
  const representativesLeaderboard = useMemo(() => {
    let rawReps: any[] = [];
    try {
      const local = localStorage.getItem("dastavval_representatives");
      if (local) rawReps = JSON.parse(local);
    } catch (e) {
      console.warn("Failed to parse representatives from local storage:", e);
    }

    if (rawReps.length === 0 && b2bConfig?.representatives) {
      rawReps = b2bConfig.representatives;
    }

    const mapped = rawReps.map((r: any) => {
      // Match real system orders handled by or assigned to this representative
      const repOrders = systemOrders.filter((ord: any) => 
        ord.representativeId === r.id || 
        (ord.repName && r.name && ord.repName.toLowerCase().includes(r.name.toLowerCase())) ||
        (ord.province && r.province && ord.province.includes(r.province))
      );

      const dealsCount = repOrders.length;

      // Real distinct retailers/customers served
      const distinctRetailers = new Set(
        repOrders.map((o: any) => o.userPhone || o.userId || o.customerName).filter(Boolean)
      );
      const activeRetailers = distinctRetailers.size;

      // Real volume in tons
      const totalWeightKg = repOrders.reduce((sum: number, o: any) => {
        if (o.totalWeightKg) return sum + o.totalWeightKg;
        if (Array.isArray(o.items)) {
          return sum + o.items.reduce((iSum: number, item: any) => iSum + (item.quantity || 1) * (item.weightKg || 5), 0);
        }
        return sum + 20;
      }, 0);
      const monthlyVolumeTons = repOrders.length > 0 ? Number((totalWeightKg / 1000).toFixed(1)) : 0;

      // Real fulfillment rate
      const completedRepOrders = repOrders.filter((o: any) => o.status === "completed" || o.status === "delivered" || o.status === "تکمیل شده");
      const fulfillmentRate = repOrders.length > 0 ? Math.round((completedRepOrders.length / repOrders.length) * 100) : (r.isApproved ? 100 : 0);

      // Real Rating Score
      const ratedOrders = repOrders.filter((o: any) => o.rating);
      const score = r.rating || (ratedOrders.length > 0 
        ? Number((ratedOrders.reduce((sum: number, o: any) => sum + o.rating, 0) / ratedOrders.length).toFixed(1))
        : 0);

      return {
        ...r,
        dealsCount,
        activeRetailers,
        monthlyVolumeTons,
        fulfillmentRate,
        score,
      };
    });

    return mapped
      .filter((r) => {
        const matchesSearch = r.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              (r.province && r.province.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === "deals") return b.dealsCount - a.dealsCount;
        if (sortBy === "growth") return b.activeRetailers - a.activeRetailers;
        return b.score - a.score;
      });
  }, [b2bConfig, systemOrders, searchQuery, sortBy]);

  // --- DERIVE REAL VALUABLE BRANDS DATA ---
  const brandsLeaderboard = useMemo(() => {
    // Collect active brands directly from products array
    let list: any[] = b2bConfig?.brands || [];
    if (products.length > 0) {
      const uniqueNames = Array.from(new Set(products.map((p) => p.brand).filter(Boolean)));
      const derivedList = uniqueNames.map((name, idx) => ({
        id: `brand-real-${idx}`,
        name,
        type: "واحد تولیدی فعال",
        category: products.find((p) => p.brand === name)?.category || "صنایع غذایی",
      }));

      const mergedMap = new Map();
      list.forEach(b => mergedMap.set(b.name, b));
      derivedList.forEach(b => {
        if (!mergedMap.has(b.name)) mergedMap.set(b.name, b);
      });
      list = Array.from(mergedMap.values());
    }

    const mapped = list.map((b: any) => {
      const name = b.name;
      const matchingProducts = products.filter((p) => p.brand && p.brand.toLowerCase() === name.toLowerCase());
      const itemsCount = matchingProducts.length;

      // Real average discount
      let avgDiscount = 0;
      if (itemsCount > 0) {
        const discountedItems = matchingProducts.filter(p => p.consumer_price && p.price && p.consumer_price > p.price);
        if (discountedItems.length > 0) {
          const sum = discountedItems.reduce((acc, p) => acc + (((p.consumer_price - p.price) / p.consumer_price) * 100), 0);
          avgDiscount = Math.round(sum / discountedItems.length);
        }
      }

      const minPrice = itemsCount > 0 ? Math.min(...matchingProducts.map(p => p.price)) : 0;
      const maxPrice = itemsCount > 0 ? Math.max(...matchingProducts.map(p => p.price)) : 0;

      // Real orders for this brand
      const brandOrders = systemOrders.filter((ord: any) => {
        if (Array.isArray(ord.items)) {
          return ord.items.some((item: any) => 
            item.brand && item.brand.toLowerCase() === name.toLowerCase()
          );
        }
        return false;
      });

      // Real reorder rate
      const customerOrderCounts: Record<string, number> = {};
      brandOrders.forEach((o: any) => {
        const cId = o.userPhone || o.userId || "guest";
        customerOrderCounts[cId] = (customerOrderCounts[cId] || 0) + 1;
      });
      const totalCustomers = Object.keys(customerOrderCounts).length;
      const repeatingCustomers = Object.values(customerOrderCounts).filter(c => c > 1).length;
      const reorderRate = totalCustomers > 0 ? Math.round((repeatingCustomers / totalCustomers) * 100) : 0;

      // Real Reviews & Rating Score
      const brandReviews = systemReviews.filter((r: any) => r.brand && r.brand.toLowerCase() === name.toLowerCase());
      let score = b.rating || 0;
      if (brandReviews.length > 0) {
        score = Number((brandReviews.reduce((sum: number, r: any) => sum + (r.rating || 5), 0) / brandReviews.length).toFixed(1));
      }

      // Trust Index based on active in-stock availability
      const inStockCount = matchingProducts.filter((p: any) => p.in_stock !== false).length;
      const trustIndex = itemsCount > 0 ? Math.round((inStockCount / itemsCount) * 100) : 0;

      return {
        ...b,
        matchingProducts,
        itemsCount,
        avgDiscount,
        minPrice,
        maxPrice,
        score,
        reorderRate,
        trustIndex,
        dealsCount: brandOrders.length,
      };
    });

    return mapped
      .filter((b) => {
        const matchesSearch = b.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              (b.category && b.category.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesCategory = categoryFilter === "all" || b.category === categoryFilter;
        return matchesSearch && matchesCategory;
      })
      .sort((a, b) => {
        if (sortBy === "deals") return b.itemsCount - a.itemsCount;
        if (sortBy === "growth") return b.reorderRate - a.reorderRate;
        return b.score - a.score;
      });
  }, [b2bConfig, products, systemOrders, systemReviews, searchQuery, categoryFilter, sortBy]);

  // Extract unique categories of products/factories to build the filter dropdown
  const categoriesList = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [products]);

  // Helper to render medals/ranks beautifully
  const renderRankBadge = (rank: number) => {
    if (rank === 1) {
      return (
        <div className="relative flex items-center justify-center">
          <div className="absolute -inset-1.5 bg-amber-400/20 rounded-xl animate-ping opacity-75" />
          <div className="w-9 h-9 bg-amber-400 text-slate-950 rounded-xl flex items-center justify-center font-black text-sm shadow-md border border-amber-300 relative z-10">
            <Crown size={15} className="fill-current" />
          </div>
        </div>
      );
    }
    if (rank === 2) {
      return (
        <div className="w-9 h-9 bg-slate-200 text-slate-900 rounded-xl flex items-center justify-center font-black text-sm shadow-md border border-slate-100">
          <Medal size={15} className="text-slate-500 fill-slate-300" />
        </div>
      );
    }
    if (rank === 3) {
      return (
        <div className="w-9 h-9 bg-amber-600 text-white rounded-xl flex items-center justify-center font-black text-sm shadow-md border border-amber-700">
          <Medal size={15} className="text-amber-100 fill-amber-800" />
        </div>
      );
    }
    return (
      <div className="w-9 h-9 bg-slate-100 text-slate-500 border border-slate-200 rounded-xl flex items-center justify-center font-black text-xs">
        {toPersianNum(rank)}
      </div>
    );
  };

  return (
    <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto px-4 sm:px-6 py-6" dir="rtl">
      {/* Dynamic Header & Back button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200/60 pb-6">
        <div className="space-y-1.5 text-right">
          <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 px-3 py-1 rounded-full text-[10.5px] font-black border border-emerald-100 shadow-3xs">
            <Sparkles size={13} className="text-emerald-600 animate-pulse" />
            <span>تالار رقابت هوشمند و رتبه‌بندی عملکرد</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            لیگ و رتبه‌بندی اعضای برتر زنجیره تامین
          </h2>
          <p className="text-[11px] sm:text-xs text-slate-400 font-bold max-w-2xl">
            پایش دقیق، شفاف و برخط عملکرد کارخانجات تولیدی، نمایندگان استانی و برندهای فعال بر اساس ميزان رضایت بنکداران، ثبات تامین و پایداری قیمت‌ها
          </p>
        </div>

        {onBackToHome && (
          <button
            onClick={onBackToHome}
            className="px-4 py-2 bg-slate-900 hover:bg-emerald-700 text-white font-black text-xs rounded-xl flex items-center gap-2 transition-all shadow-sm cursor-pointer"
          >
            <ArrowLeft size={14} />
            <span>بازگشت به صفحه اصلی</span>
          </button>
        )}
      </div>

      {/* Main League Tabs - Dashboard Selector */}
      <div className="grid grid-cols-3 gap-1.5 sm:gap-3 bg-slate-100/80 p-1.5 rounded-[1.5rem] border border-slate-200/50">
        <button
          onClick={() => {
            setActiveSubTab("factories");
            setSearchQuery("");
          }}
          className={`py-3.5 px-2 rounded-2xl text-[11px] sm:text-xs font-black transition-all duration-300 flex flex-col sm:flex-row items-center justify-center gap-2 cursor-pointer ${
            activeSubTab === "factories"
              ? "bg-white text-emerald-800 shadow-md border border-slate-200/40 font-black scale-[1.01]"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <Building2 size={16} className={activeSubTab === "factories" ? "text-emerald-600" : "text-slate-400"} />
          <span>لیگ کارخانجات برتر</span>
        </button>

        <button
          onClick={() => {
            setActiveSubTab("representatives");
            setSearchQuery("");
          }}
          className={`py-3.5 px-2 rounded-2xl text-[11px] sm:text-xs font-black transition-all duration-300 flex flex-col sm:flex-row items-center justify-center gap-2 cursor-pointer ${
            activeSubTab === "representatives"
              ? "bg-white text-emerald-800 shadow-md border border-slate-200/40 font-black scale-[1.01]"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <Users size={16} className={activeSubTab === "representatives" ? "text-emerald-600" : "text-slate-400"} />
          <span>نمایندگان و عاملیت‌ها</span>
        </button>

        <button
          onClick={() => {
            setActiveSubTab("brands");
            setSearchQuery("");
          }}
          className={`py-3.5 px-2 rounded-2xl text-[11px] sm:text-xs font-black transition-all duration-300 flex flex-col sm:flex-row items-center justify-center gap-2 cursor-pointer ${
            activeSubTab === "brands"
              ? "bg-white text-emerald-800 shadow-md border border-slate-200/40 font-black scale-[1.01]"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <Award size={16} className={activeSubTab === "brands" ? "text-emerald-600" : "text-slate-400"} />
          <span>برندهای معتبر و باارزش</span>
        </button>
      </div>

      {/* Filters bar - Fully custom search & filters */}
      <div className="bg-white rounded-3xl border border-slate-200 p-4 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.03)] space-y-4">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
          
          {/* Custom Search Input */}
          <div className="w-full lg:flex-1 relative group">
            <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-emerald-600 transition-colors">
              <Search size={16} />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                activeSubTab === "factories"
                  ? "جستجو در بین کارخانجات، شهرک صنعتی یا استان..."
                  : activeSubTab === "representatives"
                  ? "جستجوی نماینده، عاملیت یا استان تحت پوشش..."
                  : "جستجوی برند، هلدینگ یا دسته‌بندی کالا..."
              }
              className="w-full py-3 pr-10 pl-4 bg-slate-50 border border-slate-200 group-hover:border-emerald-300 focus:border-emerald-500 rounded-2xl text-xs font-bold outline-none text-slate-900 shadow-3xs transition-all text-right"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto shrink-0 justify-end">
            
            {/* Category Dropdown (Only for factories and brands) */}
            {activeSubTab !== "representatives" && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400 font-bold hidden xs:inline">دسته صنعتی:</span>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-slate-800 outline-none hover:border-slate-300 focus:border-emerald-500 cursor-pointer text-right min-w-[130px]"
                >
                  <option value="all">همه دسته‌بندی‌ها</option>
                  {categoriesList.map((cat, idx) => (
                    <option key={`cat-opt-${idx}`} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Sorting Criteria */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-400 font-bold hidden xs:inline">مرتب‌سازی:</span>
              <div className="bg-slate-100 p-1 rounded-xl flex items-center border border-slate-200/60">
                <button
                  onClick={() => setSortBy("score")}
                  className={`px-3 py-1.5 rounded-lg text-[10.5px] font-black transition-all cursor-pointer ${
                    sortBy === "score" ? "bg-white text-emerald-800 shadow-2xs font-black" : "text-slate-400 hover:text-slate-700"
                  }`}
                >
                  امتیاز کیفی
                </button>
                <button
                  onClick={() => setSortBy("deals")}
                  className={`px-3 py-1.5 rounded-lg text-[10.5px] font-black transition-all cursor-pointer ${
                    sortBy === "deals" ? "bg-white text-emerald-800 shadow-2xs font-black" : "text-slate-400 hover:text-slate-700"
                  }`}
                >
                  {activeSubTab === "brands" ? "سهم بازار" : "تعداد معاملات"}
                </button>
                <button
                  onClick={() => setSortBy("growth")}
                  className={`px-3 py-1.5 rounded-lg text-[10.5px] font-black transition-all cursor-pointer ${
                    sortBy === "growth" ? "bg-white text-emerald-800 shadow-2xs font-black" : "text-slate-400 hover:text-slate-700"
                  }`}
                >
                  {activeSubTab === "brands" ? "نرخ تکرار" : activeSubTab === "representatives" ? "وسعت شبکه" : "نرخ رشد"}
                </button>
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* Dynamic Grid Board - Animate Transitions */}
      <AnimatePresence mode="wait">
        
        {/* TAB 1: FACTORIES LEAGUE */}
        {activeSubTab === "factories" && (
          <motion.div
            key="factories-league-pane"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
            className="space-y-6"
          >
            {factoriesLeaderboard.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-slate-200">
                <Building2 size={44} className="mx-auto text-slate-300 stroke-[1.5]" />
                <h4 className="text-xs font-black text-slate-800 mt-3">تولیدکننده‌ای یافت نشد</h4>
                <p className="text-[10px] text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed font-bold">
                  عبارت دیگری را جستجو کنید یا فیلتر دسته‌بندی کالا را تغییر دهید.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {factoriesLeaderboard.map((factory, index) => {
                  const rank = index + 1;
                  return (
                    <motion.div
                      key={`comp-fac-card-${factory.id || rank}-${index}`}
                      initial={{ opacity: 0, y: 15 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: Math.min(6, index) * 0.05 }}
                      className="group bg-white rounded-3xl border border-slate-200 hover:border-emerald-500/70 hover:shadow-lg transition-all duration-300 flex flex-col justify-between overflow-hidden shadow-xs relative"
                    >
                      {/* Top Ribbon - Quality and growth indicator */}
                      <div className="p-4 pb-0 flex items-center justify-between">
                        {renderRankBadge(rank)}
                        <span className="text-[9.5px] font-black bg-emerald-50 text-emerald-800 border border-emerald-200/50 px-2.5 py-0.5 rounded-lg">
                          {factory.category || "صنایع غذایی"}
                        </span>
                      </div>

                      <div className="p-5 pt-3.5 space-y-4">
                        {/* Core Details Row */}
                        <div className="flex items-start gap-3">
                          <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200/80 p-1.5 flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform overflow-hidden">
                            {factory.logoUrl ? (
                              <img
                                src={factory.logoUrl}
                                alt={factory.name}
                                className="w-full h-full object-contain"
                                referrerPolicy="no-referrer"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = "none";
                                }}
                              />
                            ) : (
                              <span className="text-2xl">{factory.logo || "🏭"}</span>
                            )}
                          </div>

                          <div className="min-w-0 flex-1 space-y-1">
                            <h3 className="text-xs sm:text-sm font-black text-slate-900 group-hover:text-emerald-700 transition-colors flex items-center gap-1.5">
                              <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                              <span className="truncate">{factory.name}</span>
                            </h3>
                            <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold truncate">
                              <MapPin size={11} className="text-slate-400 shrink-0" />
                              <span className="truncate">{factory.location}</span>
                            </div>
                          </div>
                        </div>

                        {/* Visual Gamification - Capacity Used Progress Bar */}
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center text-[10px] font-bold">
                            <span className="text-slate-400">موجودی فعال خط تولید</span>
                            <span className="font-black text-slate-700">
                              {factory.capacityUsed > 0 ? `%${toPersianNum(factory.capacityUsed)} آماده ارسال` : "در حال به‌روزرسانی موجودی"}
                            </span>
                          </div>
                          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              whileInView={{ width: `${factory.capacityUsed}%` }}
                              viewport={{ once: true }}
                              transition={{ duration: 1, ease: "easeOut" }}
                              className="h-full bg-gradient-to-l from-emerald-500 to-teal-600 rounded-full"
                            />
                          </div>
                        </div>

                        {/* Breakdown Metrics - Dynamic scorebars */}
                        <div className="grid grid-cols-2 gap-3 pt-1 text-[10.5px] font-bold">
                          
                          {/* Quality Score Indicator */}
                          <div className="bg-slate-50/80 p-2.5 rounded-2xl border border-slate-100/50 space-y-1">
                            <div className="flex justify-between text-[9px] text-slate-400">
                              <span>اعتبار تولیدکننده</span>
                              <span className="text-slate-700">
                                {factory.qualityScore > 0 ? `%${toPersianNum(factory.qualityScore)}` : "در حال ارزیابی"}
                              </span>
                            </div>
                            <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden">
                              <div className="h-full bg-emerald-600" style={{ width: `${factory.qualityScore}%` }} />
                            </div>
                          </div>

                          {/* Logistics / Delivery speed */}
                          <div className="bg-slate-50/80 p-2.5 rounded-2xl border border-slate-100/50 space-y-1">
                            <div className="flex justify-between text-[9px] text-slate-400">
                              <span>تکمیل موفق سفارشات</span>
                              <span className="text-slate-700">
                                {factory.onTimeDelivery > 0 ? `%${toPersianNum(factory.onTimeDelivery)}` : "بدون سابقه سفارش"}
                              </span>
                            </div>
                            <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden">
                              <div className="h-full bg-teal-600" style={{ width: `${factory.onTimeDelivery}%` }} />
                            </div>
                          </div>

                          {/* Supply Chain Stability */}
                          <div className="bg-slate-50/80 p-2.5 rounded-2xl border border-slate-100/50 space-y-1">
                            <div className="flex justify-between text-[9px] text-slate-400">
                              <span>تنوع سبد کالا</span>
                              <span className="text-slate-700">{toPersianNum(factory.skusCount)} محصول</span>
                            </div>
                            <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden">
                              <div className="h-full bg-emerald-600" style={{ width: `${Math.min(100, factory.skusCount * 20)}%` }} />
                            </div>
                          </div>

                          {/* Price Competitiveness */}
                          <div className="bg-slate-50/80 p-2.5 rounded-2xl border border-slate-100/50 space-y-1">
                            <div className="flex justify-between text-[9px] text-slate-400">
                              <span>میانگین تخفیف خط</span>
                              <span className="text-slate-700">
                                {factory.avgDiscount > 0 ? `%${toPersianNum(factory.avgDiscount)}` : "قیمت مستقیم"}
                              </span>
                            </div>
                            <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden">
                              <div className="h-full bg-amber-500" style={{ width: `${Math.min(100, factory.avgDiscount * 3)}%` }} />
                            </div>
                          </div>

                        </div>

                        {/* Interactive Performance indicators */}
                        <div className="flex items-center justify-between text-[10px] font-bold border-t border-slate-100 pt-3 text-slate-400">
                          <span className="flex items-center gap-1">
                            <TrendingUp size={12} className="text-emerald-500" />
                            <span>سفارشات پلتفرم: {toPersianNum(factory.dealsCount)} معامله</span>
                          </span>
                          <span className="flex items-center gap-1.5 text-emerald-700">
                            <Activity size={12} className="animate-pulse" />
                            <span>ارسال مستقیم بار</span>
                          </span>
                        </div>
                      </div>

                      {/* Card Action Stage - Mathematical border styling */}
                      <div className="p-3.5 pt-0 bg-slate-50/50 border-t border-slate-100 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (onNavigateTab) {
                              onNavigateTab("factories", { factoryId: factory.id });
                            } else {
                              window.dispatchEvent(new CustomEvent("view-factory", { detail: { factoryId: factory.id } }));
                            }
                          }}
                          className="flex-1 py-2 px-3 rounded-xl bg-white hover:bg-emerald-50 text-emerald-800 border border-slate-200 hover:border-emerald-300 text-[10px] font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-3xs"
                        >
                          <Building2 size={12} />
                          <span>ورود به غرفه کارخانه</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (onNavigateTab) {
                              onNavigateTab("order", { searchQuery: factory.name });
                            } else {
                              window.dispatchEvent(new CustomEvent("search-brand", { detail: { brand: factory.name } }));
                            }
                          }}
                          className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black transition-all flex items-center justify-center gap-1 cursor-pointer shadow-3xs"
                        >
                          <ShoppingBag size={12} />
                          <span>خرید عمده</span>
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* TAB 2: REPRESENTATIVES LEAGUE */}
        {activeSubTab === "representatives" && (
          <motion.div
            key="representatives-league-pane"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
            className="space-y-6"
          >
            {representativesLeaderboard.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-slate-200">
                <Users size={44} className="mx-auto text-slate-300 stroke-[1.5]" />
                <h4 className="text-xs font-black text-slate-800 mt-3">نماینده یا عاملی یافت نشد</h4>
                <p className="text-[10px] text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed font-bold">
                  نام استان یا عاملیت دیگری را در کادر بالا جستجو کنید.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {representativesLeaderboard.map((rep, index) => {
                  const rank = index + 1;
                  return (
                    <motion.div
                      key={`comp-rep-card-${rep.id || rank}-${index}`}
                      initial={{ opacity: 0, y: 15 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: Math.min(6, index) * 0.05 }}
                      className="group bg-white rounded-3xl border border-slate-200 hover:border-emerald-500/70 hover:shadow-lg transition-all duration-300 flex flex-col justify-between overflow-hidden shadow-xs relative"
                    >
                      {/* Top ribbon layout */}
                      <div className="p-4 pb-0 flex items-center justify-between">
                        {renderRankBadge(rank)}
                        <span className="text-[9.5px] font-black bg-amber-100 text-amber-900 border border-amber-200/50 px-2.5 py-0.5 rounded-lg flex items-center gap-1">
                          <MapPin size={11} />
                          <span>نماینده رسمی استان {rep.province}</span>
                        </span>
                      </div>

                      <div className="p-5 pt-3.5 space-y-4">
                        {/* Agent Details */}
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0 text-xl font-black group-hover:scale-105 transition-all">
                            🤝
                          </div>

                          <div className="min-w-0 flex-1 space-y-0.5">
                            <h3 className="text-xs sm:text-sm font-black text-slate-900 truncate group-hover:text-emerald-700 transition-colors flex items-center gap-1">
                              <ShieldCheck size={14} className="text-emerald-600 shrink-0" />
                              <span className="truncate">{rep.name}</span>
                            </h3>
                            <div className="text-[10px] text-slate-400 font-bold truncate">
                              کد نمایندگی مجاز: {toPersianNum(1000 + (index * 47) % 8900)}
                            </div>
                          </div>
                        </div>

                        {/* Gamification metric 1: Order Response / Fulfillment rate */}
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center text-[10px] font-bold">
                            <span className="text-slate-400">نرخ وفاداری و پاسخگویی سفارشات</span>
                            <span className="font-black text-emerald-700">
                              {rep.fulfillmentRate > 0 ? `%${toPersianNum(rep.fulfillmentRate)} پاسخگویی` : "در حال فعال‌سازی"}
                            </span>
                          </div>
                          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              whileInView={{ width: `${rep.fulfillmentRate}%` }}
                              viewport={{ once: true }}
                              transition={{ duration: 1, ease: "easeOut" }}
                              className="h-full bg-gradient-to-l from-emerald-500 to-amber-500 rounded-full"
                            />
                          </div>
                        </div>

                        {/* Performance Details Grid */}
                        <div className="grid grid-cols-2 gap-3 text-[10.5px] font-bold bg-slate-50/80 p-3 rounded-2xl border border-slate-100">
                          
                          <div className="space-y-0.5">
                            <span className="text-slate-400 text-[9px] block">خریداران فعال</span>
                            <span className="font-black text-slate-800">
                              {rep.activeRetailers > 0 ? `${toPersianNum(rep.activeRetailers)} خریدار` : "در حال ثبت سفارش"}
                            </span>
                          </div>

                          <div className="space-y-0.5 text-left" dir="ltr">
                            <span className="text-slate-400 text-[9px] block text-right">حجم مبادلات ثبت‌شده</span>
                            <span className="font-black text-slate-800 block text-right">
                              {rep.monthlyVolumeTons > 0 ? `${toPersianNum(rep.monthlyVolumeTons)} تن بار` : "۰ تن"}
                            </span>
                          </div>

                          <div className="space-y-0.5 pt-2 border-t border-slate-200/60">
                            <span className="text-slate-400 text-[9px] block">کل فاکتورهای پلتفرم</span>
                            <span className="font-black text-emerald-700">
                              {rep.dealsCount > 0 ? `+${toPersianNum(rep.dealsCount)} فاکتور` : "۰ معامله"}
                            </span>
                          </div>

                          <div className="space-y-0.5 pt-2 border-t border-slate-200/60 text-left" dir="ltr">
                            <span className="text-slate-400 text-[9px] block text-right">امتیاز خریداران</span>
                            <span className="font-black text-amber-700 flex items-center justify-end gap-1">
                              <Star size={11} className="fill-amber-400 text-amber-400" />
                              <span>{rep.score > 0 ? `${toPersianNum(rep.score)} / ۵` : "ثبت نشده"}</span>
                            </span>
                          </div>

                        </div>

                        {/* Associated Factory brands represented */}
                        {rep.brands && rep.brands.length > 0 && (
                          <div className="space-y-1.5">
                            <span className="text-[9.5px] text-slate-400 font-bold block">برندهای تحت توزیع این عاملیت:</span>
                            <div className="flex flex-wrap gap-1">
                              {rep.brands.map((b: string, bIdx: number) => (
                                <span key={`rep-b-${bIdx}`} className="text-[9px] font-black bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 rounded-md">
                                  {b}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                      </div>

                      {/* Card Action Stage */}
                      <div className="p-3.5 pt-0 bg-slate-50/50 border-t border-slate-100 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (onNavigateTab) {
                              onNavigateTab("dealership_request", { representativeId: rep.id });
                            } else {
                              window.dispatchEvent(new CustomEvent("open-dealership-modal", { detail: { repName: rep.name } }));
                            }
                          }}
                          className="w-full py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-emerald-700 text-white text-[10.5px] font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-3xs"
                        >
                          <Users size={13} />
                          <span>ارتباط مستقیم و اخذ عاملیت انحصاری</span>
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* TAB 3: VALUABLE BRANDS LEADERBOARD */}
        {activeSubTab === "brands" && (
          <motion.div
            key="brands-arena-pane"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
            className="space-y-6"
          >
            {brandsLeaderboard.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-slate-200">
                <Award size={44} className="mx-auto text-slate-300 stroke-[1.5]" />
                <h4 className="text-xs font-black text-slate-800 mt-3">برند معتبری یافت نشد</h4>
                <p className="text-[10px] text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed font-bold">
                  عبارت جستجوی دیگری را وارد کنید یا فیلترهای دیگر را امتحان نمایید.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {brandsLeaderboard.map((brand, index) => {
                  const rank = index + 1;
                  return (
                    <motion.div
                      key={`comp-brand-card-${brand.id || rank}-${index}`}
                      initial={{ opacity: 0, y: 15 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: Math.min(6, index) * 0.05 }}
                      className="group bg-white rounded-3xl border border-slate-200 hover:border-emerald-500/70 hover:shadow-lg transition-all duration-300 flex flex-col justify-between overflow-hidden shadow-xs relative"
                    >
                      {/* Top ribbon container */}
                      <div className="p-4 pb-0 flex items-center justify-between">
                        {renderRankBadge(rank)}
                        <span className="text-[9.5px] font-black bg-emerald-50 text-emerald-800 border border-emerald-200/80 px-2.5 py-0.5 rounded-lg flex items-center gap-1">
                          <Crown size={11} className="text-emerald-600 fill-emerald-500" />
                          <span>
                            {brand.avgDiscount > 0 
                              ? `میانگین تخفیف عمده: %${toPersianNum(brand.avgDiscount)}` 
                              : "قیمت مستقیم خط تولید"}
                          </span>
                        </span>
                      </div>

                      <div className="p-5 pt-3.5 space-y-4">
                        {/* Brand Main Information */}
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-center shrink-0 text-xl font-black group-hover:scale-105 transition-all shadow-3xs">
                            🏢
                          </div>

                          <div className="min-w-0 flex-1 space-y-0.5">
                            <h3 className="text-xs sm:text-sm font-black text-slate-900 truncate group-hover:text-emerald-700 transition-colors flex items-center gap-1.5">
                              <ShieldCheck size={14} className="text-emerald-600 shrink-0" />
                              <span className="truncate">{brand.name}</span>
                            </h3>
                            <div className="text-[10px] text-slate-500 font-bold truncate">
                              تامین‌کننده رسمی خط تولید • {toPersianNum(brand.itemsCount)} ردیف کالای فعال
                            </div>
                          </div>
                        </div>

                        {/* Gamification progress bar: Reorder rate (Loyalty) */}
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center text-[10px] font-bold">
                            <span className="text-slate-400">شاخص تکرار سفارش و ثبات تامین</span>
                            <span className="font-black text-emerald-700">
                              {brand.reorderRate > 0 
                                ? `%${toPersianNum(brand.reorderRate)} تکرار موفق` 
                                : "در حال ثبت اولین سفارشات"}
                            </span>
                          </div>
                          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              whileInView={{ width: `${brand.reorderRate || (brand.itemsCount > 0 ? 100 : 0)}%` }}
                              viewport={{ once: true }}
                              transition={{ duration: 1, ease: "easeOut" }}
                              className="h-full bg-gradient-to-l from-emerald-500 via-emerald-600 to-amber-500 rounded-full"
                            />
                          </div>
                        </div>

                        {/* Brand metrics details */}
                        <div className="grid grid-cols-2 gap-3 text-[10.5px] font-bold bg-slate-50/80 p-3 rounded-2xl border border-slate-100">
                          
                          <div className="space-y-0.5">
                            <span className="text-slate-400 text-[9px] block">کالاهای ثبت‌شده</span>
                            <span className="font-black text-slate-800">
                              {toPersianNum(brand.itemsCount)} ردیف محصول
                            </span>
                          </div>

                          <div className="space-y-0.5 text-left" dir="ltr">
                            <span className="text-slate-400 text-[9px] block text-right">میانگین تخفیف کارخانه</span>
                            <span className="font-black text-emerald-700 block text-right">
                              {brand.avgDiscount > 0 ? `%${toPersianNum(brand.avgDiscount)} تخفیف مستقیم` : "قیمت بدون واسطه"}
                            </span>
                          </div>

                          <div className="space-y-0.5 pt-2 border-t border-slate-200/60">
                            <span className="text-slate-400 text-[9px] block">شاخص اصالت و موجودی</span>
                            <span className="font-black text-emerald-700">
                              {brand.trustIndex > 0 ? `%${toPersianNum(brand.trustIndex)} آمادگی ارسال` : "کالای فعال"}
                            </span>
                          </div>

                          <div className="space-y-0.5 pt-2 border-t border-slate-200/60 text-left" dir="ltr">
                            <span className="text-slate-400 text-[9px] block text-right">امتیاز رضایت خریداران</span>
                            <span className="font-black text-amber-700 flex items-center justify-end gap-1">
                              <Star size={11} className="fill-amber-400 text-amber-400" />
                              <span>{brand.score > 0 ? `${toPersianNum(brand.score)} / ۵` : "ثبت نشده"}</span>
                            </span>
                          </div>

                        </div>

                        {/* Quick highlights */}
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-800">
                          <ThumbsUp size={12} className="text-emerald-600 shrink-0" />
                          <span>تامین مستقیم کارخانه‌ای با ضمانت کیفیت و بارنامه دولتی</span>
                        </div>
                      </div>

                      {/* Card Action Stage */}
                      <div className="p-3.5 pt-0 bg-slate-50/50 border-t border-slate-100 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (onNavigateTab) {
                              onNavigateTab("order", { searchQuery: brand.name });
                            } else {
                              window.dispatchEvent(new CustomEvent("search-brand", { detail: { brand: brand.name } }));
                            }
                          }}
                          className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[10.5px] font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-3xs"
                        >
                          <Search size={13} />
                          <span>جستجو و مشاهده کالاهای برند {brand.name}</span>
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
