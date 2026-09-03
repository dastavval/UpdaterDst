import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Flame, 
  Clock, 
  Calendar, 
  ShoppingCart, 
  CheckCircle2, 
  ArrowLeft, 
  Search, 
  Filter, 
  Sparkles, 
  Percent, 
  Package, 
  TrendingUp, 
  ShieldCheck, 
  Truck, 
  Building2, 
  ChevronLeft,
  ChevronRight,
  Info,
  Layers,
  Check,
  X,
  Lock,
  MessageSquare,
  BadgeCheck,
  Settings
} from "lucide-react";
import type { Product, User } from "../types";
import { getProductRolePricing, toPersianDigits } from "../lib/pricing";
import { getDisplayImageUrl } from "../lib/image-utils";
import { HealthAppleLogo } from "./HealthAppleBadge";
import { 
  getGlobalDiscountConfig, 
  saveGlobalDiscountConfig, 
  calculateEffectiveProductPricing,
  GlobalDiscountConfig 
} from "../lib/discount-rules-helper";
import UserTicketModal from "./UserTicketModal";

interface WeeklySalesScheduleProps {
  products: Product[];
  onSelectProduct: (product: Product) => void;
  onAddToCart: (product: Product, quantityCartons: number) => void;
  user?: User | null;
  onNavigateHome?: () => void;
  onUpdateProductSchedule?: (updatedProducts: Product[]) => void;
}

const WEEK_DAYS = [
  { id: "all", label: "همه روزهای هفته", icon: "✨", subtitle: "کل تخفیف‌های دوره جاری" },
  { id: "شنبه", label: "شنبه", icon: "🍪", subtitle: "تنقلات، کیک و بیسکویت" },
  { id: "یکشنبه", label: "یکشنبه", icon: "🧼", subtitle: "شوینده، بهداشتی و سلولزی" },
  { id: "دوشنبه", label: "دوشنبه", icon: "🥫", subtitle: "کنسرویجات، رب و روغن" },
  { id: "سه‌شنبه", label: "سه‌شنبه", icon: "🥛", subtitle: "لبنیات و نوشیدنی‌ها" },
  { id: "چهارشنبه", label: "چهارشنبه", icon: "🍫", subtitle: "شیرینی، شکلات و قهوه" },
  { id: "پنجشنبه", label: "پنجشنبه و جمعه", icon: "🔥", subtitle: "حراج پایان هفته کارخانجات" },
];

export default function WeeklySalesSchedule({
  products = [],
  onSelectProduct,
  onAddToCart,
  user,
  onNavigateHome,
  onUpdateProductSchedule
}: WeeklySalesScheduleProps) {
  const [selectedDay, setSelectedDay] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [addedItemIds, setAddedItemIds] = useState<Record<string, boolean>>({});

  // Discount Engine Rules Config
  const [discountConfig, setDiscountConfig] = useState<GlobalDiscountConfig>(() => getGlobalDiscountConfig());
  const [showDiscountModal, setShowDiscountModal] = useState(false);

  // In-app Ticket / Confidential Inquiry Modal State
  const [ticketModalProduct, setTicketModalProduct] = useState<{ id: string; name: string; brand?: string } | null>(null);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);

  // Admin Customization State
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [customScheduleMap, setCustomScheduleMap] = useState<Record<string, { active: boolean; discountPercent: number; day: string }>>(() => {
    try {
      const saved = localStorage.getItem("dastavval_weekly_schedule_custom");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [adminSearch, setAdminSearch] = useState("");
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editActive, setEditActive] = useState(true);
  const [editDiscount, setEditDiscount] = useState(15);
  const [editDay, setEditDay] = useState("شنبه");

  // Global Discount Form inside Modal
  const [tempGlobalActive, setTempGlobalActive] = useState(discountConfig.globalDiscountActive);
  const [tempGlobalPercent, setTempGlobalPercent] = useState(discountConfig.globalDiscountPercent);
  const [tempGlobalTarget, setTempGlobalTarget] = useState<"all" | "category" | "day_based">(discountConfig.globalDiscountTarget);
  const [tempTargetCategory, setTempTargetCategory] = useState(discountConfig.selectedTargetCategory);
  const [tempNote, setTempNote] = useState(discountConfig.todayDiscountNote);
  const [categoryRulesCopy, setCategoryRulesCopy] = useState(discountConfig.categoryRules);

  const isAdmin = user?.role === "admin" || user?.email === "admin@dastavval.com";

  // Listen to discount changes
  useEffect(() => {
    const handleDiscountChange = () => {
      setDiscountConfig(getGlobalDiscountConfig());
    };
    window.addEventListener("dastavval-discount-rules-changed", handleDiscountChange);
    return () => window.removeEventListener("dastavval-discount-rules-changed", handleDiscountChange);
  }, []);

  const handleSaveDiscountRules = () => {
    const updated = saveGlobalDiscountConfig({
      globalDiscountActive: tempGlobalActive,
      globalDiscountPercent: tempGlobalPercent,
      globalDiscountTarget: tempGlobalTarget,
      selectedTargetCategory: tempTargetCategory,
      todayDiscountNote: tempNote,
      categoryRules: categoryRulesCopy
    });
    setDiscountConfig(updated);
    setShowDiscountModal(false);
  };

  const saveAdminScheduleConfig = (prodId: string) => {
    const updated = {
      ...customScheduleMap,
      [prodId]: {
        active: editActive,
        discountPercent: editDiscount,
        day: editDay
      }
    };
    setCustomScheduleMap(updated);
    localStorage.setItem("dastavval_weekly_schedule_custom", JSON.stringify(updated));
    setEditingProductId(null);
  };

  // Countdown timer
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number }>({
    days: 4,
    hours: 14,
    minutes: 32,
    seconds: 45
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const dayOfWeek = now.getDay();
      const daysUntilFriday = (5 - dayOfWeek + 7) % 7 || 7;
      const targetDate = new Date(now);
      targetDate.setDate(now.getDate() + daysUntilFriday);
      targetDate.setHours(23, 59, 59, 999);

      const diff = Math.max(0, targetDate.getTime() - now.getTime());
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / 1000 / 60) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      setTimeLeft({ days, hours, minutes, seconds });
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, []);

  // Filter products that participate in weekly sales program
  const weeklyProducts = useMemo(() => {
    const mapped = products.map(p => {
      const custom = customScheduleMap[p.id];
      const pricing = calculateEffectiveProductPricing(p, discountConfig);
      
      let finalDiscount = pricing.effectiveDiscountPercent || p.discount_percent || 15;
      let finalActive = p.weeklySaleActive;
      let finalDay = p.weeklySaleDay || "همه روزها";

      if (custom) {
        finalActive = custom.active;
        finalDiscount = custom.discountPercent;
        finalDay = custom.day;
      }

      return {
        ...p,
        weeklySaleActive: finalActive,
        weeklySaleDiscount: finalDiscount,
        discount_percent: finalDiscount,
        weeklySaleDay: finalDay,
        weeklyEffectivePricing: pricing
      };
    });

    const activeWeekly = mapped.filter(p => !p.disabled && p.weeklySaleActive);

    if (activeWeekly.length < 8) {
      const remaining = mapped
        .filter(p => !p.disabled && !p.weeklySaleActive && (p.discount_percent || p.isKafBazaar || p.isFeatured || p.category))
        .slice(0, 12 - activeWeekly.length)
        .map((p, idx) => ({
          ...p,
          weeklySaleActive: true,
          weeklySaleDiscount: p.discount_percent || (10 + (idx % 3) * 5),
          weeklySaleDay: WEEK_DAYS[(idx % 6) + 1].id,
          weeklySaleQuota: 150 + (idx * 25)
        }));

      return [...activeWeekly, ...remaining];
    }

    return activeWeekly;
  }, [products, customScheduleMap, discountConfig]);

  // Extract unique categories
  const categories = useMemo(() => {
    const cats = new Set<string>();
    weeklyProducts.forEach(p => {
      if (p.category) cats.add(p.category);
    });
    return Array.from(cats);
  }, [weeklyProducts]);

  // Filter products by day, category, and search query
  const filteredProducts = useMemo(() => {
    return weeklyProducts.filter(p => {
      if (selectedDay !== "all") {
        const prodDay = p.weeklySaleDay || "همه روزها";
        if (prodDay !== "همه روزها" && prodDay !== selectedDay) {
          return false;
        }
      }

      if (selectedCategory !== "all" && p.category !== selectedCategory) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = (p.name || "").toLowerCase().includes(q);
        const matchesBrand = (p.brand || p.factoryName || "").toLowerCase().includes(q);
        const matchesCat = (p.category || "").toLowerCase().includes(q);
        if (!matchesName && !matchesBrand && !matchesCat) return false;
      }

      return true;
    });
  }, [weeklyProducts, selectedDay, selectedCategory, searchQuery]);

  const handleQuickAdd = (product: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    const qty = Math.max(5, product.min_order_cartons || 5);
    onAddToCart(product, qty);
    setAddedItemIds(prev => ({ ...prev, [product.id]: true }));
    setTimeout(() => {
      setAddedItemIds(prev => ({ ...prev, [product.id]: false }));
    }, 2000);
  };

  const handleOpenTicket = (product: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    setTicketModalProduct({
      id: product.id,
      name: product.name,
      brand: product.brand || product.factoryName
    });
    setIsTicketModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20 pt-4" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* ========================================================================= */}
        {/* 1. HERO BANNER - REDESIGNED: PRISTINE WHITE & CREATIVE HIGH-END DESIGN */}
        {/* ========================================================================= */}
        <div className="relative overflow-hidden rounded-3xl bg-white border border-slate-200/90 shadow-xl p-6 sm:p-8 text-slate-900">
          
          {/* Subtle Creative Ambient Background Glows */}
          <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:20px_20px] opacity-40 pointer-events-none" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            
            {/* Left Content Side */}
            <div className="lg:col-span-7 space-y-4">
              
              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 px-3.5 py-1.5 rounded-full text-xs font-black shadow-xs">
                  <Flame size={15} className="text-rose-500 fill-rose-100 animate-pulse" />
                  <span>برنامه فروش و حراج هفتگی کارخانجات</span>
                </div>

                {discountConfig.globalDiscountActive && (
                  <div className="inline-flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-900 px-3 py-1 rounded-full text-xs font-black shadow-xs">
                    <Sparkles size={13} className="text-amber-600" />
                    <span>٪{toPersianDigits(discountConfig.globalDiscountPercent)} تخفیف گروهی فعال</span>
                  </div>
                )}
              </div>

              <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-slate-900 leading-snug">
                تخفیف‌های سهمیه‌ای و <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-600 to-amber-600">حراج هفتگی کارخانجات</span>
              </h1>
              
              <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed max-w-2xl">
                کالاهای منتخب کارخانجات با تخفیف‌های ویژه کف کارخانه و سهمیه محدود جهت توزیع مستقیم به بنکداران، پخش‌ها و فروشگاه‌های سراسر کشور.
              </p>

              {/* Badges of Platform Guarantee */}
              <div className="flex flex-wrap items-center gap-2.5 pt-1 text-[11px] text-slate-700 font-bold">
                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-xl shadow-xs">
                  <ShieldCheck size={14} className="text-emerald-600" />
                  <span>تضمین ۱۰۰٪ کف قیمت تولید</span>
                </div>
                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-xl shadow-xs">
                  <Truck size={14} className="text-amber-600" />
                  <span>بارنامه و پلمپ مستقیم کارخانه</span>
                </div>
                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-xl shadow-xs">
                  <CheckCircle2 size={14} className="text-teal-600" />
                  <span>تسویه امانی امن</span>
                </div>
                
                {/* Admin Quick Settings Trigger */}
                {isAdmin && (
                  <button
                    onClick={() => setShowDiscountModal(true)}
                    className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer shadow-md"
                  >
                    <Settings size={13} className="text-amber-400" />
                    <span>تنظیم تخفیف گروهی و روزانه (مدیریت)</span>
                  </button>
                )}
              </div>

              {/* Live Today Discount Announcement */}
              {discountConfig.todayDiscountNote && (
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/80 rounded-2xl p-3 flex items-center justify-between text-xs text-emerald-950 font-bold">
                  <span className="flex items-center gap-2">
                    <Sparkles size={15} className="text-emerald-600 shrink-0" />
                    <span>{discountConfig.todayDiscountNote}</span>
                  </span>
                  <span className="text-[10px] bg-white text-emerald-800 px-2 py-0.5 rounded-md border border-emerald-200 font-mono">
                    اعمال خودکار در سبد خرید
                  </span>
                </div>
              )}

            </div>

            {/* Right Side: Creative Clean White Countdown Box */}
            <div className="lg:col-span-5 bg-slate-50/80 border border-slate-200/90 backdrop-blur-md p-5 rounded-2xl text-center space-y-3 shadow-inner">
              
              <div className="flex items-center justify-center gap-2 text-xs font-black text-slate-800">
                <Clock size={16} className="text-emerald-600" />
                <span>زمان باقیمانده تا پایان تخفیف‌های این دوره</span>
              </div>

              <div className="grid grid-cols-4 gap-2 pt-1">
                <div className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-xs">
                  <span className="block text-xl sm:text-2xl font-black font-mono text-slate-900">
                    {toPersianDigits(timeLeft.days)}
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold">روز</span>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-xs">
                  <span className="block text-xl sm:text-2xl font-black font-mono text-amber-600">
                    {toPersianDigits(String(timeLeft.hours).padStart(2, "0"))}
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold">ساعت</span>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-xs">
                  <span className="block text-xl sm:text-2xl font-black font-mono text-slate-900">
                    {toPersianDigits(String(timeLeft.minutes).padStart(2, "0"))}
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold">دقیقه</span>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-xs">
                  <span className="block text-xl sm:text-2xl font-black font-mono text-rose-600 animate-pulse">
                    {toPersianDigits(String(timeLeft.seconds).padStart(2, "0"))}
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold">ثانیه</span>
                </div>
              </div>

              <div className="text-[10px] text-slate-500 font-bold pt-1 flex items-center justify-center gap-1">
                <span>📌 سهمیه‌ها پس از تکمیل ظرفیت با قیمت عادی محاسبه خواهند شد.</span>
              </div>
            </div>

          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. WEEKDAYS SELECTOR TABS */}
        {/* ========================================================================= */}
        <div className="bg-white p-2 sm:p-3 rounded-2xl border border-slate-200 shadow-xs overflow-x-auto">
          <div className="flex items-center gap-2 min-w-max">
            {WEEK_DAYS.map((day) => {
              const isActive = selectedDay === day.id;
              const countForDay = day.id === "all" 
                ? weeklyProducts.length 
                : weeklyProducts.filter(p => p.weeklySaleDay === day.id || p.weeklySaleDay === "همه روزها" || !p.weeklySaleDay).length;

              return (
                <button
                  key={day.id}
                  id={`weekly-day-tab-${day.id}`}
                  onClick={() => setSelectedDay(day.id)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
                    isActive
                      ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20 scale-[1.02]"
                      : "bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/70"
                  }`}
                >
                  <span className="text-sm">{day.icon}</span>
                  <div className="text-right">
                    <div className="flex items-center gap-1.5">
                      <span>{day.label}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                        isActive ? "bg-white/20 text-white" : "bg-slate-200 text-slate-600"
                      }`}>
                        {toPersianDigits(countForDay)}
                      </span>
                    </div>
                    <div className={`text-[9px] font-normal ${isActive ? "text-emerald-100" : "text-slate-400"}`}>
                      {day.subtitle}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 3. FILTER & SEARCH BAR */}
        {/* ========================================================================= */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              id="weekly-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجو در محصولات برنامه فروش هفتگی..."
              className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:border-emerald-500 transition-colors outline-none"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                selectedCategory === "all"
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-600"
              }`}
            >
              همه دسته‌ها
            </button>
            {categories.map((cat, catIdx) => (
              <button
                key={`schedule-cat-${cat}-${catIdx}`}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  selectedCategory === cat
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 4. PRODUCTS GRID WITH CONFIDENTIAL SUPPLIER INFO & TICKET CTA */}
        {/* ========================================================================= */}
        {filteredProducts.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4 shadow-xs">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto">
              <Package size={32} />
            </div>
            <h3 className="text-base font-black text-slate-800">محصولی در این فیلتر یافت نشد</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              برای روز انتخابی یا عبارت جستجو موردی ثبت نشده است. می‌توانید فیلترها را تغییر داده یا همه روزها را انتخاب نمایید.
            </p>
            <button
              onClick={() => { setSelectedDay("all"); setSelectedCategory("all"); setSearchQuery(""); }}
              className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-black hover:bg-slate-800 transition-all cursor-pointer"
            >
              مشاهده همه تخفیف‌های هفتگی
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredProducts.map((product, idx) => {
              const rolePricing = getProductRolePricing(product, user);
              const isRep = rolePricing.isRepresentative;
              const customerBasePrice = rolePricing.customerPrice || Math.round((product.bulk_price || product.price || 100000) * 1.20);
              const discountPercent = product.weeklySaleDiscount || product.discount_percent || 15;

              // Weekly sale discount applies to customer price. Representatives get exact representative floor price without weekly discount stacking.
              const discountedPrice = isRep 
                ? rolePricing.unitWholesalePrice 
                : Math.max(rolePricing.floorFactoryUnitPrice, Math.round(customerBasePrice * (1 - discountPercent / 100)));

              const originalPrice = isRep ? rolePricing.customerPrice : customerBasePrice;
              const cartonPack = product.carton_pack_count || 24;
              const minCartons = Math.max(5, product.min_order_cartons || 5);
              const totalCartonSavings = isRep ? rolePricing.repSavingsPerCarton : Math.max(0, (originalPrice - discountedPrice) * cartonPack);
              const isAdded = !!addedItemIds[product.id];
              const remainingQuota = product.weeklySaleQuota || 180;

              return (
                <div
                  key={`weekly-sale-prod-${product.id}-${idx}`}
                  id={`weekly-product-card-${product.id}`}
                  onClick={() => onSelectProduct(product)}
                  className="group bg-white rounded-2xl border border-slate-200 hover:border-emerald-500/50 hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden cursor-pointer relative"
                >
                  {/* Top Discount & Day Badges */}
                  <div className="absolute top-3 right-3 z-10 flex flex-col items-start gap-1">
                    <span className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-[11px] font-black px-2.5 py-1 rounded-xl shadow-md flex items-center gap-1">
                      <Flame size={13} className="text-amber-300 animate-pulse" />
                      <span>٪{toPersianDigits(discountPercent)} تخفیف هفتگی</span>
                    </span>
                    {product.weeklySaleDay && product.weeklySaleDay !== "همه روزها" && (
                      <span className="bg-slate-900/80 backdrop-blur-md text-amber-300 text-[9px] font-bold px-2 py-0.5 rounded-lg">
                        روز عرضه: {product.weeklySaleDay}
                      </span>
                    )}
                  </div>

                  {/* PRODUCT IMAGE */}
                  <div className="relative aspect-4/3 bg-slate-50 p-4 flex items-center justify-center overflow-hidden border-b border-slate-100">
                    <img
                      src={getDisplayImageUrl(product.image_url)}
                      alt={product.name}
                      className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                    {product.hasHealthApple && (
                      <div className="absolute bottom-2 left-2 bg-white/95 p-1 rounded-lg shadow-xs border border-slate-100">
                        <HealthAppleLogo size={18} />
                      </div>
                    )}
                  </div>

                  {/* CARD CONTENT */}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold">
                        <span>{product.category || "صنایع غذایی"}</span>
                        <span>حداقل سفارش: {toPersianDigits(minCartons)} کارتن</span>
                      </div>

                      <h3 className="font-black text-xs sm:text-sm text-slate-900 line-clamp-2 leading-snug group-hover:text-emerald-700 transition-colors">
                        {product.name}
                      </h3>

                      {/* SUPPLIER & CONFIDENTIAL CONTACT CARD */}
                      <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-2 space-y-1">
                        <div className="flex items-center justify-between text-[10px]">
                          <div className="flex items-center gap-1 font-black text-slate-800">
                            <Building2 size={12} className="text-emerald-600" />
                            <span>تولیدکننده: {product.brand || product.factoryName || "کارخانه عضو دست‌اول"}</span>
                          </div>
                          <span title="احراز هویت شده">
                            <BadgeCheck size={13} className="text-emerald-600" />
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between text-[9px] text-slate-500 font-medium pt-0.5 border-t border-slate-200/60">
                          <span className="flex items-center gap-1 text-amber-700">
                            <Lock size={10} />
                            <span>اطلاعات تماس مستقیم: محرمانه</span>
                          </span>
                          <button
                            type="button"
                            onClick={(e) => handleOpenTicket(product, e)}
                            className="text-emerald-700 hover:text-emerald-900 font-black flex items-center gap-0.5 cursor-pointer bg-white px-1.5 py-0.5 rounded border border-emerald-200"
                            title="ارسال استعلام و پیام تیکتی به ادمین"
                          >
                            <MessageSquare size={10} />
                            <span>استعلام امن</span>
                          </button>
                        </div>
                      </div>

                    </div>

                    {/* PRICING & QUOTA */}
                    <div className="space-y-2 pt-1 border-t border-slate-100">
                      
                      {/* Quota Progress */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-bold text-slate-500">
                          <span>سهمیه حراج کارخانه</span>
                          <span className="font-mono text-emerald-700">{toPersianDigits(remainingQuota)} کارتن باقیمانده</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-emerald-600 h-1.5 rounded-full"
                            style={{ width: `${Math.min(100, (remainingQuota / 300) * 100)}%` }}
                          />
                        </div>
                      </div>

                      {/* Pricing Row */}
                      <div className="flex items-baseline justify-between pt-1">
                        <div>
                          <span className="text-[9px] text-slate-400 block line-through font-mono">
                            {toPersianDigits(originalPrice.toLocaleString())}
                          </span>
                          <div className="flex items-baseline gap-1 text-slate-900 font-black">
                            <span className="text-base sm:text-lg font-mono text-emerald-800">
                              {toPersianDigits(discountedPrice.toLocaleString())}
                            </span>
                            <span className="text-[10px] text-slate-500">تومان</span>
                          </div>
                        </div>

                        <div className="text-left">
                          <span className="text-[9px] text-emerald-600 font-bold block">سود در کارتن:</span>
                          <span className="text-xs font-mono font-black text-emerald-700">
                            {toPersianDigits(totalCartonSavings.toLocaleString())} ت
                          </span>
                        </div>
                      </div>

                      {/* ACTION BUTTONS */}
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <button
                          type="button"
                          onClick={(e) => handleOpenTicket(product, e)}
                          className="py-2.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <MessageSquare size={13} />
                          <span>استعلام ادمین</span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => handleQuickAdd(product, e)}
                          className={`py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md ${
                            isAdded
                              ? "bg-emerald-600 text-white"
                              : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20"
                          }`}
                        >
                          {isAdded ? (
                            <>
                              <Check size={14} />
                              <span>افزوده شد</span>
                            </>
                          ) : (
                            <>
                              <ShoppingCart size={14} />
                              <span>خرید عمده</span>
                            </>
                          )}
                        </button>
                      </div>

                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* ========================================================================= */}
      {/* 5. ADMIN GLOBAL & CATEGORY DISCOUNT CONFIG MODAL */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {showDiscountModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 text-right" dir="rtl">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 max-w-2xl w-full space-y-5 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Settings size={20} />
                  </div>
                  <div>
                    <h3 className="font-black text-sm text-slate-900">تنظیم تخفیف‌های همگانی، روزانه و دسته‌ای</h3>
                    <p className="text-[11px] text-slate-400 font-bold">مدیریت اعمال تخفیف سراسری برای امروز یا گروه کالاهای منتخب</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDiscountModal(false)}
                  className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Main Rule Toggle */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-800">فعال‌سازی تخفیف ویژه دوره جاری</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={tempGlobalActive}
                      onChange={(e) => setTempGlobalActive(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-[11px] font-black text-slate-700 mb-1">درصد تخفیف مورد نظر (٪)</label>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={tempGlobalPercent}
                      onChange={(e) => setTempGlobalPercent(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-black text-slate-700 mb-1">هدف اعمال تخفیف</label>
                    <select
                      value={tempGlobalTarget}
                      onChange={(e) => setTempGlobalTarget(e.target.value as any)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-emerald-500"
                    >
                      <option value="category">روی یک گروه محصول خاص (مثلاً لبنیات)</option>
                      <option value="all">روی تمام محصولات سراسر سامانه</option>
                      <option value="day_based">بر اساس جدول روزهای هفته</option>
                    </select>
                  </div>
                </div>

                {tempGlobalTarget === "category" && (
                  <div>
                    <label className="block text-[11px] font-black text-slate-700 mb-1">انتخاب گروه محصول هدف برای امروز</label>
                    <select
                      value={tempTargetCategory}
                      onChange={(e) => setTempTargetCategory(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-emerald-500"
                    >
                      <option value="لبنیات و نوشیدنی‌ها">لبنیات و نوشیدنی‌ها</option>
                      <option value="کنسرویجات، رب و روغن">کنسرویجات، رب و روغن</option>
                      <option value="شوینده، بهداشتی و سلولزی">شوینده، بهداشتی و سلولزی</option>
                      <option value="تنقلات، کیک و بیسکویت">تنقلات، کیک و بیسکویت</option>
                      <option value="شیرینی، شکلات و قهوه">شیرینی، شکلات و قهوه</option>
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-black text-slate-700 mb-1">متن اعلان و بنر بالای برنامه هفتگی</label>
                  <input
                    type="text"
                    value={tempNote}
                    onChange={(e) => setTempNote(e.target.value)}
                    placeholder="مثال: ۵٪ تخفیف ویژه امروز روی گروه محصولات منتخب صنایع غذایی"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Category-Specific Rules Matrix */}
              <div className="space-y-2">
                <h4 className="text-xs font-black text-slate-900">تخفیف پیش‌فرض گروه‌های کالایی:</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {Object.entries(categoryRulesCopy).map(([catName, rule]) => (
                    <div key={catName} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                      <span className="font-bold text-slate-800">{catName}</span>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          min="0"
                          max="40"
                          value={rule.discountPercent}
                          onChange={(e) => {
                            setCategoryRulesCopy(prev => ({
                              ...prev,
                              [catName]: {
                                ...prev[catName],
                                discountPercent: Number(e.target.value)
                              }
                            }));
                          }}
                          className="w-14 px-2 py-1 bg-white border border-slate-300 rounded-lg text-center font-mono font-black"
                        />
                        <span className="text-[10px] text-slate-500 font-bold">٪</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowDiscountModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="button"
                  onClick={handleSaveDiscountRules}
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md cursor-pointer"
                >
                  ذخیره و اعمال سراسری
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* 6. USER TICKET / CONFIDENTIAL INQUIRY MODAL */}
      {/* ========================================================================= */}
      <UserTicketModal
        isOpen={isTicketModalOpen}
        onClose={() => setIsTicketModalOpen(false)}
        initialProduct={ticketModalProduct}
        currentUserPhone={user?.phone}
        currentUserName={user?.name}
      />

    </div>
  );
}
