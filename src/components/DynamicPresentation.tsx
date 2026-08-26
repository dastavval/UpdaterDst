import { useState, useEffect, useRef, useMemo } from "react";
import { DigitalEcoTree } from "./DigitalEcoTree";
import { SupplyChainLifecycleAnimation } from "./SupplyChainLifecycleAnimation";
import { FactoryHeroPowerhouse } from "./FactoryHeroPowerhouse";
import { UserGatewayHub } from "./UserGatewayHub";
import { CustomerJourneyModal } from "./CustomerJourneyModal";
import { B2BProfitSimulator } from "./B2BProfitSimulator";
import SpecialPriceBagIcon from "./SpecialPriceBagIcon";
import {
  Sparkles,
  ArrowLeft,
  Building2,
  Award,
  ShoppingBag,
  ShieldCheck,
  CheckCircle2,
  TrendingUp,
  Zap,
  Factory,
  Truck,
  ChevronRight,
  ChevronLeft,
  Search,
  X,
  Star,
  Package,
  Layers,
  Store,
  Grid,
  Download,
  Copy,
  Check,
  Plus,
  Globe,
  MapPin,
  Gift,
  Radio,
  MessageCircle,
  Coins,
  BrainCircuit,
  MessageSquare,
  Send,
  Share2,
  GraduationCap,
  BookOpen,
  CreditCard,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { B2BConfig, Product } from "../types";
import { Language } from "../lib/translations";
import ProductCard from "./ProductCard";
import MagazineSection from "./MagazineSection";
import { ReferralRewardModal } from "./ReferralRewardModal";
import EngagementHub from "./EngagementHub";
import { getDisplayImageUrl, cleanUnitName } from "../lib/image-utils";
import { getProductRolePricing } from "../lib/pricing";
import { isWarehouseBrand } from "../utils/api-utils";

interface DynamicPresentationProps {
  products: Product[];
  articles?: any[];
  onEnterPanel: () => void;
  language: Language;
  theme: "light" | "dark" | "classic";
  dailyAI?: any;
  b2bConfig: B2BConfig;
  setActiveTab?: (tab: any) => void;
  setActiveCategory?: (category: string) => void;
  onAddToCart?: (product: Product, quantityCartons: number) => void;
  onViewDetails?: (product: Product) => void;
  userBadge?: string;
  user?: any;
}

export default function DynamicPresentation({
  products,
  articles,
  onEnterPanel,
  language,
  theme,
  b2bConfig,
  setActiveTab,
  setActiveCategory,
  onAddToCart,
  onViewDetails,
  userBadge,
  user,
}: DynamicPresentationProps) {
  const [selectedCategory, setSelectedCategory] = useState("همه");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSlide, setActiveSlide] = useState(0);
  const [selectedHomeFactory, setSelectedHomeFactory] = useState<any | null>(null);
  const [copiedCoupon, setCopiedCoupon] = useState(false);
  const [isReferralOpen, setIsReferralOpen] = useState(false);
  const [isCustomerJourneyOpen, setIsCustomerJourneyOpen] = useState(false);
  const [showcaseTab, setShowcaseTab] = useState<'all' | 'products' | 'raw_materials'>('all');
  const [activeStep, setActiveStep] = useState(0);
  const [simulateCartons, setSimulateCartons] = useState(50);

  const toPersianNum = (num: number | string) => {
    if (num === undefined || num === null) return "";
    if (language === "en") return num.toString();
    const persian: Record<string, string> = {
      "0": "۰", "1": "۱", "2": "۲", "3": "۳", "4": "۴", "5": "۵", "6": "۶", "7": "۷", "8": "۸", "9": "۹"
    };
    return num.toString().replace(/[0-9]/g, (w) => persian[w]);
  };

  const defaultSlides: any[] = [];

  const slides = b2bConfig.slides && b2bConfig.slides.length > 0 
    ? b2bConfig.slides 
    : defaultSlides;

  const getCategoryImage = (catName: string) => {
    // 1. First check if b2bConfig.categories has an image for this category
    const baseConfigCats = b2bConfig.categories || [];
    const configCat = baseConfigCats.find((c: any) => {
      const name = typeof c === 'string' ? c : (c.name || c.id || c.label);
      return name === catName;
    });
    if (configCat && typeof configCat === 'object' && ((configCat as any).image || (configCat as any).imageUrl)) {
      return (configCat as any).image || (configCat as any).imageUrl;
    }

    // 2. Fallback to keyword-based stable Unsplash images
    const nameLower = (catName || "").toLowerCase();
    if (nameLower.includes("شکلات") || nameLower.includes("تنقلات") || nameLower.includes("chocolate") || nameLower.includes("snacks")) 
      return "https://images.unsplash.com/photo-1511381939415-e44015466834?auto=format&fit=crop&q=85&w=800";
    if (nameLower.includes("کیک") || nameLower.includes("بیسکویت") || nameLower.includes("کلوچه") || nameLower.includes("cake") || nameLower.includes("biscuite")) 
      return "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&q=85&w=800";
    if (nameLower.includes("کنسرو") || nameLower.includes("غذا") || nameLower.includes("روغن") || nameLower.includes("food") || nameLower.includes("oil")) 
      return "https://images.unsplash.com/photo-1534483509719-3feaee7c30da?auto=format&fit=crop&q=85&w=800";
    if (nameLower.includes("نوشیدنی") || nameLower.includes("آبمیوه") || nameLower.includes("drink") || nameLower.includes("juice")) 
      return "https://images.unsplash.com/photo-1622597467827-43f0553ad9fe?auto=format&fit=crop&q=85&w=800";
    if (nameLower.includes("شوینده") || nameLower.includes("بهداشتی") || nameLower.includes("detergent") || nameLower.includes("hygiene")) 
      return "https://images.unsplash.com/photo-1583947215259-38e31be8751f?auto=format&fit=crop&q=85&w=800";
    
    // 3. Last resort generic wholesale collection showcase image
    return "https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&q=85&w=800";
  };

  // Extract all distinct categories and tags from products
  const productCategoriesSet = new Set<string>();
  products.forEach(p => {
    if (p.category && p.category.trim()) productCategoriesSet.add(p.category.trim());
    if ((p as any).tags && Array.isArray((p as any).tags)) {
      (p as any).tags.forEach((t: string) => {
        if (t && t.trim()) productCategoriesSet.add(t.trim());
      });
    }
  });

  const baseConfigCats = b2bConfig.categories || [];

  const mergedCatMap = new Map<string, { id: string; label: string; icon: string; image: string }>();

  // Add configured categories
  baseConfigCats.forEach((c: any) => {
    const catName = typeof c === 'string' ? c : (c.name || c.id || "دسته‌بندی");
    if (catName && catName.trim() !== "همه" && catName.trim() !== "all") {
      mergedCatMap.set(catName.trim(), {
        id: catName.trim(),
        label: catName.trim(),
        icon: typeof c === 'object' && c.icon ? c.icon : "📦",
        image: (typeof c === 'object' && (c.image || c.imageUrl)) ? (c.image || c.imageUrl) : getCategoryImage(catName.trim())
      });
    }
  });

  // Add categories/tags found in products that aren't in config yet
  productCategoriesSet.forEach(catName => {
    if (catName && catName.trim() !== "همه" && catName.trim() !== "all" && !mergedCatMap.has(catName.trim())) {
      mergedCatMap.set(catName.trim(), {
        id: catName.trim(),
        label: catName.trim(),
        icon: "📦",
        image: getCategoryImage(catName.trim())
      });
    }
  });

  const categoriesList = useMemo(() => {
    return [
      { id: "همه", label: "همه اقلام", icon: "📦", image: "https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&q=85&w=800" },
      ...Array.from(mergedCatMap.values())
    ];
  }, [products, b2bConfig?.categories]);

  // Check if a product is a raw material based on category or keyword matching
  const isRawMaterial = (p: Product) => {
    const name = (p.name || "").toLowerCase();
    const desc = (p.description || "").toLowerCase();
    const cat = (p.category || "").toLowerCase();
    return (
      cat.includes("مواد اولیه") ||
      cat.includes("raw") ||
      name.includes("نشاسته") ||
      name.includes("کنسانتره") ||
      name.includes("گلوتن") ||
      name.includes("پودر مالت") ||
      name.includes("اسانس") ||
      name.includes("سوربیتول") ||
      name.includes("مواد اولیه") ||
      desc.includes("ماده اولیه") ||
      desc.includes("مواد اولیه")
    );
  };

  // Compute products for the showcase section
  const showcaseProducts = useMemo(() => {
    // Newest/recent products: marked as 'جدید' or are part of the latest products
    const recentItems = products.filter((p, index) => {
      const hasNewBadge = p.badge && (p.badge.includes("جدید") || p.badge.toLowerCase().includes("new"));
      const isRecentlyAdded = index >= Math.max(0, products.length - 8);
      return hasNewBadge || isRecentlyAdded || isRawMaterial(p);
    });

    if (showcaseTab === 'all') {
      return recentItems.slice(0, 8);
    } else if (showcaseTab === 'products') {
      return recentItems.filter(p => !isRawMaterial(p)).slice(0, 8);
    } else if (showcaseTab === 'raw_materials') {
      return products.filter(isRawMaterial).slice(0, 8);
    }
    return recentItems.slice(0, 8);
  }, [products, showcaseTab]);

  // Filter products flexibly by category name or tags
  const isCategoryMatch = (p: Product, selectedCat: string) => {
    if (selectedCat === "همه") return true;
    if (!selectedCat) return true;
    const normS = selectedCat.trim().toLowerCase();
    const normP = (p.category || "").trim().toLowerCase();
    
    if (normP === normS || normP.includes(normS) || normS.includes(normP)) return true;
    
    // Check product tags array if present
    if ((p as any).tags && Array.isArray((p as any).tags)) {
      if ((p as any).tags.some((t: string) => t.toLowerCase().includes(normS) || normS.includes(t.toLowerCase()))) {
        return true;
      }
    }

    return false;
  };

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (p.disabled) return false;
      const matchesCategory = isCategoryMatch(p, selectedCategory);
      const q = searchQuery.toLowerCase();
      const matchesSearch = searchQuery === "" || 
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        (p.tags && Array.isArray(p.tags) && p.tags.some(t => typeof t === 'string' && t.toLowerCase().includes(q))) ||
        (p.category && p.category.toLowerCase().includes(q));
      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  const featuredDisplayProducts = useMemo(() => filteredProducts.slice(0, 8), [filteredProducts]);

  const primaryColor = b2bConfig.primaryColor || "emerald";

  const colorConfig: Record<string, {
    gradientTo: string;
    btnBg: string;
    btnBorder: string;
    btnTextLight: string;
    iconBg: string;
    iconText: string;
    categorySelectedBg: string;
    categorySelectedBorder: string;
    catalogBtnBg: string;
    brandIconText: string;
  }> = {
    emerald: {
      gradientTo: "to-emerald-500/10",
      btnBg: "from-emerald-500 to-emerald-700 hover:from-emerald-600 hover:to-emerald-800",
      btnBorder: "border-emerald-400",
      btnTextLight: "text-emerald-100",
      iconBg: "bg-emerald-50",
      iconText: "text-emerald-700",
      categorySelectedBg: "bg-emerald-700 text-white border-emerald-700 shadow-emerald-700/20",
      categorySelectedBorder: "border-emerald-700",
      catalogBtnBg: "bg-emerald-700 hover:bg-emerald-800",
      brandIconText: "text-emerald-700"
    },
    teal: {
      gradientTo: "to-teal-500/10",
      btnBg: "from-teal-500 to-teal-700 hover:from-teal-600 hover:to-teal-800",
      btnBorder: "border-teal-400",
      btnTextLight: "text-teal-100",
      iconBg: "bg-teal-50",
      iconText: "text-teal-700",
      categorySelectedBg: "bg-teal-700 text-white border-teal-700 shadow-teal-700/20",
      categorySelectedBorder: "border-teal-700",
      catalogBtnBg: "bg-teal-700 hover:bg-teal-800",
      brandIconText: "text-teal-700"
    },
    indigo: {
      gradientTo: "to-indigo-500/10",
      btnBg: "from-indigo-500 to-indigo-700 hover:from-indigo-600 hover:to-indigo-800",
      btnBorder: "border-indigo-400",
      btnTextLight: "text-indigo-100",
      iconBg: "bg-indigo-50",
      iconText: "text-indigo-700",
      categorySelectedBg: "bg-indigo-700 text-white border-indigo-700 shadow-indigo-700/20",
      categorySelectedBorder: "border-indigo-700",
      catalogBtnBg: "bg-indigo-700 hover:bg-indigo-800",
      brandIconText: "text-indigo-700"
    },
    amber: {
      gradientTo: "to-amber-500/10",
      btnBg: "from-amber-500 to-amber-700 hover:from-amber-600 hover:to-amber-800",
      btnBorder: "border-amber-400",
      btnTextLight: "text-amber-100",
      iconBg: "bg-amber-50",
      iconText: "text-amber-700",
      categorySelectedBg: "bg-amber-700 text-white border-amber-700 shadow-amber-700/20",
      categorySelectedBorder: "border-amber-700",
      catalogBtnBg: "bg-amber-700 hover:bg-amber-800",
      brandIconText: "text-amber-700"
    },
    sky: {
      gradientTo: "to-sky-500/10",
      btnBg: "from-sky-500 to-sky-700 hover:from-sky-600 hover:to-sky-800",
      btnBorder: "border-sky-400",
      btnTextLight: "text-sky-100",
      iconBg: "bg-sky-50",
      iconText: "text-sky-700",
      categorySelectedBg: "bg-sky-700 text-white border-sky-700 shadow-sky-700/20",
      categorySelectedBorder: "border-sky-700",
      catalogBtnBg: "bg-sky-700 hover:bg-sky-800",
      brandIconText: "text-sky-700"
    }
  };

  const activeColors = colorConfig[primaryColor] || colorConfig.emerald;

  const CompactShowcaseCard = ({ product, idx, onViewDetails, onAddToCart, toPersianNum }: any) => {
    const isRaw = (product.category || "").includes("مواد اولیه") || (product.name || "").includes("نشاسته");
    
    // Use the central pricing utility for consistent role-based prices
    const rolePricing = getProductRolePricing(product, user, userBadge as any);
    const displayPrice = rolePricing.unitWholesalePrice;
    const profitMargin = rolePricing.profitMarginPercent;

    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, delay: idx * 0.05 }}
        className="bg-white rounded-2xl border border-slate-100 p-3 shadow-sm hover:shadow-xl hover:border-emerald-200 transition-all group flex items-center gap-4 cursor-pointer relative"
        onClick={() => onViewDetails?.(product)}
      >
        <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-xl overflow-hidden flex items-center justify-center shrink-0 bg-slate-50 border border-slate-100/50">
          <img
            key={`${product.id}-img-${product.image_url}`}
            src={getDisplayImageUrl(product.image_url)}
            alt={product.name}
            referrerPolicy="no-referrer"
            className="w-full h-full object-contain p-2 group-hover:scale-110 transition-transform duration-700"
          />
          <div className="absolute top-1.5 right-1.5">
            <span className={`px-2 py-0.5 rounded-md text-[8px] font-black text-white shadow-sm ${isRaw ? 'bg-amber-600' : 'bg-emerald-600'}`}>
              {isRaw ? 'مواد اولیه' : 'جدید'}
            </span>
          </div>
        </div>
        <div className="flex-1 min-w-0 flex flex-col justify-between py-1 h-full">
          <div className="space-y-1.5">
            <h4 className="text-xs sm:text-sm font-black text-slate-800 line-clamp-2 leading-tight">
              {product.name}
            </h4>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-[10px] font-black text-emerald-600">
                {profitMargin > 0 ? `${toPersianNum(profitMargin)}٪ حاشیه سود` : 'عرضه به قیمت تمام‌شده کارخانه'}
              </span>
            </div>
          </div>
          <div className="mt-auto flex items-center justify-between gap-2 pt-2">
            <div className="flex items-baseline gap-1">
              <span className="text-sm font-mono font-black text-emerald-800">
                {toPersianNum(displayPrice.toLocaleString())}
              </span>
              <span className="text-[10px] font-bold text-slate-400">ت</span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                // Adding to cart will naturally use the role pricing logic in App.tsx
                onAddToCart?.(product, product.min_order_cartons || 1);
              }}
              className="w-9 h-9 bg-emerald-600 text-white rounded-xl flex items-center justify-center hover:bg-emerald-700 transition-all shadow-md active:scale-90"
            >
              <Plus size={18} />
            </button>
          </div>
        </div>
      </motion.div>
    );
  };

  const baseReps = (b2bConfig as any)?.baseRepsCount || 100;
  const baseProducts = ((b2bConfig as any)?.baseProductsCount || 100) + (products?.length || 0);

  const [liveReps, setLiveReps] = useState(() => {
    const saved = localStorage.getItem("dastavval_live_reps");
    return saved ? parseInt(saved, 10) : baseReps;
  });

  const [liveProducts, setLiveProducts] = useState(() => {
    const saved = localStorage.getItem("dastavval_live_products");
    return saved ? parseInt(saved, 10) : baseProducts;
  });

  const [displayedReps, setDisplayedReps] = useState(0);
  const [displayedProducts, setDisplayedProducts] = useState(0);

  const prevRepsRef = useRef(0);
  const prevProductsRef = useRef(0);

  // Counter animation optimized with throttled steps to prevent main-thread layout thrashing
  useEffect(() => {
    const isFirstLoad = prevRepsRef.current === 0;
    const duration = isFirstLoad ? 1000 : 500;
    const startReps = prevRepsRef.current;
    const startProducts = prevProductsRef.current;
    const diffReps = liveReps - startReps;
    const diffProducts = liveProducts - startProducts;

    const startTime = Date.now();
    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = progress * (2 - progress);

      setDisplayedReps(Math.floor(startReps + ease * diffReps));
      setDisplayedProducts(Math.floor(startProducts + ease * diffProducts));

      if (progress >= 1) {
        clearInterval(timer);
        setDisplayedReps(liveReps);
        setDisplayedProducts(liveProducts);
        prevRepsRef.current = liveReps;
        prevProductsRef.current = liveProducts;
      }
    }, 50);

    return () => clearInterval(timer);
  }, [liveReps, liveProducts]);

  // Periodic automatic additions (live ticker counters)
  useEffect(() => {
    // Add 1 representative every 40 seconds
    const repsInterval = setInterval(() => {
      setLiveReps(prev => {
        const next = prev + 1;
        localStorage.setItem("dastavval_live_reps", next.toString());
        return next;
      });
    }, 40000);

    // Add 1 product every 25 seconds
    const productsInterval = setInterval(() => {
      setLiveProducts(prev => {
        const next = prev + 1;
        localStorage.setItem("dastavval_live_products", next.toString());
        return next;
      });
    }, 25000);

    return () => {
      clearInterval(repsInterval);
      clearInterval(productsInterval);
    };
  }, []);

  const rubikaUrl = (b2bConfig as any)?.rubikaChannelUrl || "https://rubika.ir/dastavval_official";
  const telegramUrl = (b2bConfig as any)?.telegramChannelUrl || "https://t.me/dastavval_official";
  const whatsappUrl = (b2bConfig as any)?.whatsappGroupUrl || "https://chat.whatsapp.com/dastavval_official";
  const instagramUrl = (b2bConfig as any)?.instagramPageUrl || "https://instagram.com/dastavval_official";

  return (
    <div className="space-y-6 py-1 text-right" dir="rtl">
      
      {/* --- REVOLUTIONARY FACTORY HERO POWERHOUSE (CONNECTED DIRECTLY TO REAL DATABASE PRODUCTS) --- */}
      <FactoryHeroPowerhouse 
        products={products}
        user={user}
        userBadge={userBadge}
        onOrderClick={() => setActiveTab?.('order')}
        onFactoryClick={() => setActiveTab?.('factories')}
        onBillboardClick={() => setActiveTab?.('billboard')}
        onAgencyClick={() => setActiveTab?.('agency')}
        onAddToCart={onAddToCart}
      />

      {/* --- 3-PILLAR SMART USER GATEWAY HUB (NO USER IS EVER LOST OR CONFUSED) --- */}
      <UserGatewayHub 
        onSelectBuyer={() => setActiveTab?.('order')}
        onSelectAgency={() => setActiveTab?.('agency')}
        onSelectFactory={() => setActiveTab?.('factories')}
        onOpenJourneyGuide={() => setIsCustomerJourneyOpen(true)}
        onOpenBillboard={() => setActiveTab?.('billboard')}
      />

      {/* --- CUSTOMER JOURNEY STEP-BY-STEP MODAL --- */}
      <CustomerJourneyModal
        isOpen={isCustomerJourneyOpen}
        onClose={() => setIsCustomerJourneyOpen(false)}
        onSelectBuyer={() => setActiveTab?.('order')}
        onSelectAgency={() => setActiveTab?.('agency')}
        onSelectFactory={() => setActiveTab?.('factories')}
      />

      {/* --- PROMINENT PURE-WHITE SYSTEM GUIDE & TRAINING CALLOUT (HIGH VISIBILITY FOR ALL USERS) --- */}
      <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6 text-right" dir="rtl">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 pb-5 border-b border-slate-100">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-black">
              <GraduationCap size={15} />
              <span>راهنمای جامع و آموزش گام‌به‌گام سامانه</span>
            </div>
            <h2 className="text-base sm:text-xl font-black text-slate-900">
              چگونه در دست اول خرید کنیم یا نماینده شویم؟
            </h2>
            <p className="text-xs text-slate-500 font-bold leading-relaxed">
              آموزش کامل ۴ مرحله اصلی: از انتخاب کالای کارتنی تا تسویه چکی و دریافت بار با بارنامه دولتی
            </p>
          </div>

          <button
            onClick={() => setActiveTab?.('learning')}
            className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer shadow-xs shrink-0 self-stretch sm:self-auto justify-center"
          >
            <BookOpen size={16} />
            <span>مشاهده آموزش کامل و جامع سیستم</span>
            <ArrowLeft size={14} className="mr-1" />
          </button>
        </div>

        {/* Interactive Steps Stepper (Compact & Gamified) */}
        <div className="space-y-5">
          {/* Tabs Stepper Header */}
          <div className="flex overflow-x-auto scrollbar-none gap-2 pb-2.5 border-b border-slate-100 md:grid md:grid-cols-4 md:gap-3 md:pb-0 md:border-0" dir="rtl">
            {[
              { id: 0, title: "۱. انتخاب و سود کالا", icon: "📦" },
              { id: 1, title: "۲. صندوق امن و چک", icon: "💳" },
              { id: 2, title: "۳. باربری و بیمه جاده‌ای", icon: "🚚" },
              { id: 3, title: "۴. عاملیت و رتبه‌بندی", icon: "📈" }
            ].map((stepItem) => {
              const isActive = activeStep === stepItem.id;
              return (
                <button
                  key={stepItem.id}
                  onClick={() => setActiveStep(stepItem.id)}
                  className={`flex-none px-4 py-3 rounded-2xl border text-xs font-black transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap md:w-full ${
                    isActive 
                      ? "bg-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-600/10 scale-[1.02]"
                      : "bg-slate-50 hover:bg-slate-100/80 border-slate-200/60 text-slate-600"
                  }`}
                >
                  <span className="text-sm">{stepItem.icon}</span>
                  <span>{stepItem.title}</span>
                  {isActive && (
                    <motion.span 
                      layoutId="activeStepDot" 
                      className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" 
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Active Step Panel Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeStep}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
              className="grid grid-cols-1 md:grid-cols-12 gap-5 p-5 sm:p-6 rounded-2xl bg-slate-50/60 border border-slate-200/70 items-center text-right"
              dir="rtl"
            >
              {/* Detailed Description */}
              <div className="md:col-span-7 space-y-3.5 order-2 md:order-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-100 text-[10px] font-black">
                  <span>مرحله {toPersianNum(activeStep + 1)} از ۴</span>
                </div>
                <h3 className="text-sm sm:text-base font-black text-slate-900">
                  {activeStep === 0 && "انتخاب تعداد کارتن و محاسبه هوشمند سود کالا"}
                  {activeStep === 1 && "تسویه امن امانی یا ثبت چک صیادی آنلاین"}
                  {activeStep === 2 && "باربری مستقیم جاده‌ای با بیمه‌نامه کامل دولتی"}
                  {activeStep === 3 && "کسب امتیاز فعالیت، ارتقای رتبه و اخذ نمایندگی انحصاری"}
                </h3>
                <p className="text-[11px] sm:text-xs text-slate-600 font-bold leading-relaxed">
                  {activeStep === 0 && "در دست اول با خرید مستقیم، قیمت نهایی شما بر اساس میزان سفارش تغییر می‌کند. با تغییر تعداد کارتن در شبیه‌ساز روبه‌رو، به صورت زنده درصد تخفیف پلکانی و سود حاصل از فروش کالا را مشاهده کنید."}
                  {activeStep === 1 && "امنیت خرید شما اولویت اصلی ماست. سرمایه شما در حساب امانی تا تحویل کامل بار نزد صندوق محافظت می‌شود؛ یا به راحتی و آنلاین بدون نیاز به سرمایه اولیه نقدی، چک صیادی بنفش خود را با کارمزد صفر ثبت کنید."}
                  {activeStep === 2 && "ارسال مستقیم محصولات از درب کارخانه بدون هیچ انبار واسطه‌ای! تمام بارها پلمپ سربی شده و با بارنامه رسمی دولتی و بیمه‌نامه ۱۰۰٪ حوادث جاده‌ای تضمین سلامت فیزیکی به انبار شما هدایت می‌شوند."}
                  {activeStep === 3 && "خرید مستمر از سامانه امتیاز شما را بالا می‌برد. با ارتقای رتبه به سطوح نقره‌ای، طلایی و VIP، تخفیف‌های ثابت فوق‌العاده روی سبدها گرفته و در اولویت دریافت حق عاملیت انحصاری شهر خود قرار می‌گیرید."}
                </p>
                <div className="pt-1.5 flex flex-wrap gap-2">
                  <button
                    onClick={() => setActiveTab?.('learning')}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <span>جزئیات و آموزش گام‌به‌گام</span>
                    <ArrowLeft size={12} />
                  </button>
                  {activeStep === 0 && (
                    <button
                      onClick={() => setActiveTab?.('order')}
                      className="px-4 py-2.5 bg-slate-200/80 hover:bg-slate-200 text-slate-800 rounded-xl text-[10px] font-black transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>ورود به ویترین کالاها</span>
                      <ShoppingBag size={12} />
                    </button>
                  )}
                  {activeStep === 3 && (
                    <button
                      onClick={() => setActiveTab?.('agency')}
                      className="px-4 py-2.5 bg-slate-200/80 hover:bg-slate-200 text-slate-800 rounded-xl text-[10px] font-black transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>درخواست نمایندگی انحصاری</span>
                      <Building2 size={12} />
                    </button>
                  )}
                </div>
              </div>

              {/* Mini Interactive Playground / Visualizer */}
              <div className="md:col-span-5 bg-white p-4 rounded-xl border border-slate-200/75 shadow-xs order-1 md:order-2 self-stretch flex flex-col justify-center">
                {activeStep === 0 && (
                  <div className="space-y-3.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-slate-500">حجم شبیه‌سازی خرید:</span>
                      <span className="text-xs font-black text-emerald-600">{toPersianNum(simulateCartons)} کارتن عمده</span>
                    </div>
                    {/* Volume Slider */}
                    <div className="relative">
                      <input 
                        type="range" 
                        min="5" 
                        max="200" 
                        value={simulateCartons} 
                        onChange={(e) => setSimulateCartons(Number(e.target.value))}
                        className="w-full accent-emerald-600 h-1.5 bg-slate-100 rounded-lg cursor-pointer"
                      />
                      <div className="flex justify-between text-[8px] text-slate-400 font-bold mt-1">
                        <span>خرید تست (۵)</span>
                        <span>متوسط (۱۰۰)</span>
                        <span>تیراژ بالا (۲۰۰)</span>
                      </div>
                    </div>
                    {/* Calculated Outcome Alert */}
                    <div className="bg-emerald-50/70 border border-emerald-100 rounded-xl p-3 text-center space-y-1">
                      <div className="text-[9px] font-black text-slate-400">سود و حاشیه تخفیف پلکانی:</div>
                      <div className="text-sm font-black text-emerald-700 animate-pulse">
                        {simulateCartons < 30 ? "۵٪ تخفیف (کف قیمت بازار)" : 
                         simulateCartons < 100 ? "۱۵٪ سود خالص کارخانه‌ای" : "۲۵٪ تخفیف طلایی VIP درب کارخانه"}
                      </div>
                      <p className="text-[8px] text-slate-500 font-bold">
                        {simulateCartons < 30 ? "مناسب تست اولیه و تامین مستقیم" : 
                         simulateCartons < 100 ? "حاشیه سود فوق‌العاده برای بنکداران" : "بهترین قیمت ویژه توزیع‌کنندگان کلان"}
                      </p>
                    </div>
                  </div>
                )}

                {activeStep === 1 && (
                  <div className="space-y-3 text-center py-1">
                    <div className="mx-auto w-10 h-10 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 text-lg shadow-2xs">
                      🔒
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs font-black text-slate-800">حساب امانی و چک آنلاین صیادی</div>
                      <p className="text-[9px] text-slate-500 font-bold leading-normal">
                        تسویه فاکتور به محض تحویل و تایید کیفیت بار در مقصد
                      </p>
                    </div>
                    {/* Compact Interactive Options */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 text-right">
                        <div className="text-[8px] font-black text-slate-400">صندوق امانی دست اول</div>
                        <div className="text-[9px] font-black text-emerald-600 mt-0.5">✓ پول شما امن است</div>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 text-right">
                        <div className="text-[8px] font-black text-slate-400">سامانه چک صیادی بنفش</div>
                        <div className="text-[9px] font-black text-indigo-600 mt-0.5">✓ استعلام آنی صادرکننده</div>
                      </div>
                    </div>
                    <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-[8px] font-bold text-slate-600">
                      <span>بدون دریافت هرگونه بهره یا کارمزد واسطه</span>
                    </div>
                  </div>
                )}

                {activeStep === 2 && (
                  <div className="space-y-3 py-1">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <span className="text-[10px] font-black text-slate-500">وضعیت لجستیک جاده‌ای:</span>
                      <span className="text-[9px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">بارنامه دولتی</span>
                    </div>
                    {/* Shipping Visualizer Map */}
                    <div className="relative h-12 bg-slate-50 rounded-lg flex items-center justify-between px-3 border border-slate-100 overflow-hidden">
                      {/* Line */}
                      <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 border-t-2 border-dashed border-slate-200" />
                      
                      <div className="relative z-10 flex flex-col items-center">
                        <div className="w-5 h-5 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center text-[9px]">🏢</div>
                        <span className="text-[8px] text-slate-400 font-bold mt-1">کارخانه</span>
                      </div>
                      
                      {/* Animating Truck */}
                      <motion.div 
                        animate={{ x: [25, -25, 25] }}
                        transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }}
                        className="relative z-10 text-lg pointer-events-none"
                      >
                        🚚
                      </motion.div>
                      
                      <div className="relative z-10 flex flex-col items-center">
                        <div className="w-5 h-5 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center text-[9px] text-emerald-700">✓</div>
                        <span className="text-[8px] text-slate-600 font-black mt-1">مقصد شما</span>
                      </div>
                    </div>
                    {/* Protection Badge */}
                    <div className="flex items-center gap-1.5 text-slate-700">
                      <ShieldCheck size={14} className="text-emerald-500 shrink-0" />
                      <span className="text-[9px] font-black">پلمپ سربی خودرو و ۱۰۰٪ تضمین بیمه کل خسارت جاده‌ای</span>
                    </div>
                  </div>
                )}

                {activeStep === 3 && (
                  <div className="space-y-3 py-1 text-center">
                    <span className="text-[10px] font-black text-slate-400 block mb-1">تکامل رتبه و ارتقای تخفیفات دائمی:</span>
                    <div className="grid grid-cols-4 gap-1.5">
                      {[
                        { name: "برنز", val: "۰٪", color: "text-amber-700 bg-amber-50 border-amber-200" },
                        { name: "نقره", val: "۱.۵٪", color: "text-slate-500 bg-slate-50 border-slate-200" },
                        { name: "طلا", val: "۲.۵٪", color: "text-amber-500 bg-amber-50/50 border-amber-300" },
                        { name: "VIP 👑", val: "۴٪ + انحصار", color: "text-purple-600 bg-purple-50 border-purple-200 font-bold" }
                      ].map((lvl, idx) => (
                        <div 
                          key={lvl.name} 
                          className={`p-1.5 rounded-lg border text-center transition-all ${lvl.color} ${
                            idx === 3 ? "ring-2 ring-purple-500/20 scale-105" : ""
                          }`}
                        >
                          <div className="text-[8px] font-black">{lvl.name}</div>
                          <div className="text-[9px] font-black mt-0.5">{lvl.val}</div>
                        </div>
                      ))}
                    </div>
                    <div className="text-[8px] text-slate-500 font-bold leading-normal pt-1 border-t border-slate-100">
                      بر اساس حجم تراکنش ماهانه، تخفیف‌های ویژه روی کل اقلام برایتان فعال می‌شود.
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      {/* --- NEW PRODUCTS AND RAW MATERIALS SHOWCASE SECTION --- */}
      <section className="bg-white rounded-[2.5rem] p-6 border border-slate-100 shadow-2xl shadow-slate-200/50 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100/80">
          <div className="space-y-1">
            <h2 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2.5">
              <div className="w-10 h-10 bg-linear-to-tr from-amber-500 to-amber-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-amber-500/20">
                <Sparkles size={20} />
              </div>
              <span>جدیدترین محصولات و تامین مواد اولیه</span>
            </h2>
            <p className="text-[11px] text-slate-400 font-bold pr-12">
              رونمایی از آخرین خروجی‌های خط تولید با نرخ مصوب و بدون واسطه
            </p>
          </div>
          
          <div className="flex items-center gap-1.5 bg-slate-50 p-1.5 rounded-2xl border border-slate-200/60">
            {[
              { id: 'all', label: 'همه اقلام' },
              { id: 'products', label: 'محصولات' },
              { id: 'raw_materials', label: 'مواد اولیه' }
            ].map((tab) => (
              <button
                key={`showcase-tab-${tab.id}`}
                onClick={() => setShowcaseTab(tab.id as any)}
                className={`px-4 py-2 rounded-xl text-[11px] font-black transition-all cursor-pointer whitespace-nowrap ${
                  showcaseTab === tab.id
                    ? 'bg-white text-emerald-700 shadow-md border border-slate-200/50 scale-[1.05]'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {showcaseProducts.length === 0 ? (
          <div className="bg-slate-50/50 rounded-3xl p-12 text-center border border-dashed border-slate-200">
            <Package className="mx-auto text-slate-300 mb-4 opacity-50" size={48} />
            <h4 className="text-sm font-black text-slate-800">کالایی در این بخش ثبت نشده است</h4>
            <p className="text-[11px] text-slate-400 font-bold mt-2">به زودی محصولات جدید کارخانجات در این بخش رونمایی خواهد شد.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {showcaseProducts.map((product, idx) => (
              <CompactShowcaseCard 
                key={`showcase-grid-${product.id}-${idx}`} 
                product={product} 
                idx={idx} 
                onViewDetails={onViewDetails} 
                onAddToCart={onAddToCart}
                toPersianNum={toPersianNum}
              />
            ))}
          </div>
        )}

        <div className="mt-4">
          <button 
            onClick={() => setActiveTab?.('order')}
            className="w-full py-3.5 bg-slate-50 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 border border-slate-200 hover:border-emerald-200 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-2 group cursor-pointer shadow-sm"
          >
            <span>ورود به سامانه خرید عمده و استعلام قیمت</span>
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Improved Call to action banner - Made White and Beautiful */}
        <motion.div 
          whileHover={{ y: -2 }}
          className="bg-white rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 text-right border border-slate-100 shadow-xl shadow-slate-200/40 relative overflow-hidden group mt-4"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform duration-1000" />
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-2xl shadow-sm border border-emerald-100">
              🏭
            </div>
            <div className="space-y-1">
              <h4 className="text-sm sm:text-base font-black text-slate-900">کارخانه شما هم تولیدکننده است؟</h4>
              <p className="text-[11px] text-slate-500 font-bold max-w-lg">
                محصولات خود را مستقیماً به سبد خرید بنکداران سراسر کشور اضافه کنید و شبکه فروش خود را هوشمند کنید.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setActiveTab?.('factories');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="px-8 py-3 bg-emerald-700 text-white text-xs font-black rounded-2xl transition-all shadow-lg shadow-emerald-700/20 hover:bg-emerald-800 active:scale-95 shrink-0 cursor-pointer relative z-10"
          >
            مشاوره و ثبت کارخانه
          </button>
        </motion.div>
      </section>

      {/* --- QUICK CATEGORY NAVIGATION - CRISP, VIBRANT & CLARIFIED --- */}
      <section className="space-y-4 pt-2" dir="rtl">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100 shadow-2xs">
              <Grid size={18} />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black text-slate-900">دسته‌بندی‌های کالا</h2>
              <p className="text-[10px] text-slate-400 font-bold">دسترسی سریع به گروه‌های کالایی و خطوط پخش</p>
            </div>
          </div>
          <button 
            onClick={() => setActiveTab?.('order')}
            className="text-[11px] font-black text-emerald-700 hover:text-emerald-800 transition-colors flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100/70 px-3 py-1.5 rounded-xl border border-emerald-200/80 cursor-pointer"
          >
            <span>کاتالوگ کامل</span>
            <ChevronLeft size={14} />
          </button>
        </div>

        <div className="relative group">
          <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-4 pt-1 -mx-2 px-2 sm:-mx-4 sm:px-4 scroll-smooth no-scrollbar snap-x snap-mandatory" style={{ WebkitOverflowScrolling: 'touch' }}>
            {categoriesList.map((cat, catIdx) => {
              const itemCount = cat.id === "همه" 
                ? products.length 
                : products.filter(p => isCategoryMatch(p, cat.id)).length;
              const isSelected = selectedCategory === cat.id;

              return (
                <motion.button
                  key={`cat-scroll-${cat.id}-${catIdx}`}
                  whileHover={{ y: -4, scale: 1.02 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => {
                    const targetCat = cat.id === "همه" ? "همه" : cat.id;
                    setSelectedCategory(targetCat);
                    if (setActiveCategory) setActiveCategory(targetCat);
                  }}
                  className={`flex flex-col items-center justify-between p-3.5 rounded-2xl min-w-[124px] sm:min-w-[136px] h-[134px] transition-all duration-300 cursor-pointer border snap-start relative overflow-hidden group/cat shadow-xs ${
                    isSelected
                      ? "bg-gradient-to-b from-emerald-600 to-teal-700 text-white border-emerald-500 ring-2 ring-emerald-500/25 shadow-md shadow-emerald-700/20"
                      : "bg-white text-slate-800 border-slate-200/80 hover:border-emerald-300 hover:shadow-sm"
                  }`}
                >
                  {/* Subtle Background Graphic without Heavy Blurring */}
                  <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                    <img 
                      src={cat.image || getCategoryImage(cat.id)} 
                      alt=""
                      className={`w-full h-full object-cover transition-transform duration-700 group-hover/cat:scale-110 ${
                        isSelected ? "opacity-15" : "opacity-25"
                      }`}
                    />
                    <div className={`absolute inset-0 ${
                      isSelected 
                        ? 'bg-gradient-to-b from-emerald-600/85 to-teal-800/95' 
                        : 'bg-gradient-to-b from-white/90 via-white/80 to-slate-50/90 group-hover/cat:from-white/70'
                    }`} />
                  </div>

                  {/* Icon Badge */}
                  <div className={`relative z-10 w-12 h-12 rounded-xl flex items-center justify-center text-2xl transition-all ${
                    isSelected 
                      ? "bg-white/20 text-white border border-white/25 shadow-inner" 
                      : "bg-white text-slate-700 border border-slate-100 shadow-2xs group-hover/cat:border-emerald-200 group-hover/cat:scale-105"
                  }`}>
                    {cat.icon || "📦"}
                  </div>

                  {/* Labels */}
                  <div className="relative z-10 text-center space-y-1 w-full mt-auto">
                    <h3 className={`text-[11px] font-black truncate ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                      {cat.label}
                    </h3>
                    <div className={`text-[9px] font-black px-2 py-0.5 rounded-full inline-flex items-center justify-center gap-1 ${
                      isSelected 
                        ? "bg-white/25 text-white border border-white/20" 
                        : "bg-slate-100 text-slate-700 border border-slate-200/60"
                    }`}>
                      <Package size={10} className="shrink-0" />
                      <span>{toPersianNum(itemCount)} کالا</span>
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>
      </section>

      {/* --- SMART B2B SEARCH & FEATURED PRODUCTS --- */}

      <section className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/70 pb-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center shrink-0">
              <Store size={20} className="text-amber-600" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900">
                خرید عمده مستقیم از کارخانه
              </h2>
              <p className="text-[10px] text-slate-500 font-bold mt-0.5">
                تامین بی‌واسطه محصولات از خطوط تولید با قیمت مصوب
              </p>
            </div>
          </div>

          {/* Smart Search Box */}
          <div className="w-full md:w-80 relative group">
            <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none">
              <Sparkles size={16} className="text-emerald-500 animate-pulse" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجوی هوشمند کالا، برند یا کارخانه..."
              className="w-full py-3 pr-10 pl-10 bg-white border border-slate-200 group-hover:border-emerald-300 focus:border-emerald-500 rounded-2xl text-xs font-bold outline-none text-slate-900 text-right shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)] transition-all"
            />
            {searchQuery ? (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 hover:text-red-500 transition-colors"
              >
                <X size={14} />
              </button>
            ) : (
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-300">
                <Search size={14} />
              </div>
            )}
          </div>
        </div>

        {/* Products Grid (Max 8) */}
        {featuredDisplayProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
            {featuredDisplayProducts.map((p, idx) => (
              <ProductCard
                key={`feat-prod-${p.id || 'item'}-${idx}`}
                index={idx}
                product={p}
                onViewDetails={onViewDetails}
                onAddToCart={(prod, qty) => {
                  if (onAddToCart) onAddToCart(prod, qty);
                }}
              />
            ))}
          </div>
        ) : (
          <div className="p-6 text-center bg-white rounded-xl space-y-1">
            <div className="text-xl">🔍</div>
            <h4 className="font-black text-xs text-slate-800">کالایی یافت نشد</h4>
          </div>
        )}

        {/* View Full Catalog Prominent CTA */}
        <div className="pt-1 text-center">
          <button
            onClick={() => setActiveTab?.('order')}
            className={`w-full sm:w-auto px-6 py-2.5 ${activeColors.catalogBtnBg} hover:opacity-90 text-white font-black text-xs rounded-xl shadow-sm transition-all cursor-pointer inline-flex items-center justify-center gap-2`}
          >
            <span>مشاهده لیست کامل محصولات در کاتالوگ عمده</span>
            <ArrowLeft size={15} />
          </button>
        </div>
      </section>

      {/* --- SUPPLY CHAIN LIFECYCLE & VALUE BANNER --- */}
      <section className="relative overflow-hidden flex flex-col lg:flex-row items-center justify-between gap-6 py-3 border-t border-slate-100/80">
        <div className="relative z-10 space-y-3.5 max-w-xl flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 bg-gradient-to-r from-emerald-800 to-teal-800 text-white px-3 py-1 rounded-full text-[11px] font-black shadow-xs border border-emerald-500/20">
              <Sparkles size={12} className="fill-emerald-300 text-emerald-300 animate-pulse" />
              <span>تامین مستقیم از خط تولید 🏭</span>
            </span>
          </div>

          <h1 className="text-sm sm:text-base font-black text-slate-900 leading-relaxed">
            {b2bConfig?.appName ? `${b2bConfig.appName}؛ ${b2bConfig.appSub || 'خرید عمده مستقیم از کارخانجات معتبر کشور'}` : 'سامانه دست اول؛ خرید مستقیم عمده از تولیدکنندگان صنایع غذایی و بهداشتی'}
          </h1>

          <p className="text-xs text-slate-500 font-semibold leading-relaxed">
            {b2bConfig?.topAnnouncement || 'ثبت سفارشات پالتی و کارتن‌های تخفیف‌دار، دریافت پیش‌فاکتور آنی کارخانه، ضمانت امن و بارنامه دولتی بیمه‌شده.'}
          </p>
        </div>

        {/* Creative Interactive B2B Supply Chain Lifecycle Animation Widget */}
        <div className="relative z-10 w-full lg:w-[480px] shrink-0">
          <SupplyChainLifecycleAnimation onOrderClick={() => setActiveTab?.('order')} />
        </div>
      </section>

      {/* --- 4 HIGH-IMPACT COMPACT & ANIMATED ACTION BUTTONS --- */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 py-4 border-y border-slate-100/60 my-2">
        {/* Button 1: Wholesale Orders */}
        <motion.button
          whileHover={{ y: -2, scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setActiveTab?.('order')}
          className="group relative overflow-hidden bg-white hover:bg-white text-slate-800 p-3 rounded-2xl flex items-center justify-between gap-2 transition-all cursor-pointer hover:shadow-md"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 group-hover:scale-105 group-hover:bg-emerald-500 group-hover:text-white transition-all shrink-0">
              <SpecialPriceBagIcon size={18} badgeSize={9} animated={true} />
            </div>
            <span className="font-black text-xs sm:text-sm text-slate-900 group-hover:text-emerald-700 transition-colors whitespace-nowrap truncate">
              سفارش عمده
            </span>
          </div>
          <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-400 group-hover:bg-emerald-500 group-hover:text-white flex items-center justify-center text-xs font-bold transition-all shrink-0">
            ←
          </span>
        </motion.button>

        {/* Button 2: Wholesaler Desk */}
        <motion.button
          whileHover={{ y: -2, scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          onClick={onEnterPanel}
          className="group relative overflow-hidden bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 p-3 rounded-2xl flex items-center justify-between gap-2 transition-all cursor-pointer shadow-xs hover:shadow-md"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-800 text-base group-hover:scale-105 transition-all shrink-0">
              🏬
            </div>
            <span className="font-black text-xs sm:text-sm text-slate-900 group-hover:text-emerald-700 transition-colors whitespace-nowrap truncate">
              پنل کاربری خریداران
            </span>
          </div>
          <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 group-hover:bg-emerald-600 group-hover:text-white flex items-center justify-center text-xs font-bold transition-all shrink-0">
            ←
          </span>
        </motion.button>

        {/* Button 3: Download Catalog PDF */}
        <motion.button
          whileHover={{ y: -2, scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            if (b2bConfig?.catalogPdfUrl) {
              window.open(b2bConfig.catalogPdfUrl, '_blank');
            } else {
              window.dispatchEvent(new CustomEvent("open-catalog-modal"));
            }
          }}
          className="group relative overflow-hidden bg-white hover:bg-white text-slate-800 p-3 rounded-2xl flex items-center justify-between gap-2 transition-all cursor-pointer hover:shadow-md"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600 group-hover:scale-105 group-hover:bg-teal-500 group-hover:text-white transition-all shrink-0">
              <Download size={18} />
            </div>
            <span className="font-black text-xs sm:text-sm text-slate-900 group-hover:text-teal-700 transition-colors whitespace-nowrap truncate">
              دانلود کاتالوگ
            </span>
          </div>
          <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-400 group-hover:bg-teal-500 group-hover:text-white flex items-center justify-center text-xs font-bold transition-all shrink-0">
            ↓
          </span>
        </motion.button>

        {/* Button 4: Factories & Direct Brands */}
        <motion.button
          whileHover={{ y: -2, scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            setActiveTab?.('factories');
          }}
          className="group relative overflow-hidden bg-white hover:bg-white text-slate-800 p-3 rounded-2xl flex items-center justify-between gap-2 transition-all cursor-pointer hover:shadow-md"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 group-hover:scale-105 group-hover:bg-amber-500 group-hover:text-white transition-all shrink-0">
              <Building2 size={18} />
            </div>
            <span className="font-black text-xs sm:text-sm text-slate-900 group-hover:text-amber-700 transition-colors whitespace-nowrap truncate">
              تولیدکنندگان
            </span>
          </div>
          <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-400 group-hover:bg-amber-500 group-hover:text-white flex items-center justify-center text-xs font-bold transition-all shrink-0">
            ←
          </span>
        </motion.button>
      </section>

      {/* --- REFERRAL & REWARD B2B BANNER --- */}
      <section>
        <motion.button
          whileHover={{ scale: 1.005, y: -1 }}
          whileTap={{ scale: 0.985 }}
          onClick={() => setIsReferralOpen(true)}
          className="w-full bg-gradient-to-r from-amber-500 via-emerald-600 to-teal-700 hover:from-amber-600 hover:to-teal-800 text-white rounded-2xl p-3 sm:p-3.5 flex items-center justify-between gap-3 shadow-sm hover:shadow-md cursor-pointer border border-amber-300/40 relative overflow-hidden transition-all"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shrink-0 border border-white/30 shadow-xs">
              <Gift size={20} className="animate-pulse" />
            </div>
            <div className="text-right min-w-0">
              <div className="font-black text-xs sm:text-sm text-white flex items-center gap-2 truncate">
                <span>سامانه دعوت از همکاران و پاداش نقدی خرید عمده</span>
                <span className="bg-amber-300 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-md hidden sm:inline-block shadow-2xs">
                  ویژه فعالان صنعت غذا و بهداشت
                </span>
              </div>
              <div className="text-[10.5px] text-amber-100 font-bold truncate mt-0.5 flex items-center gap-1.5">
                <Coins size={12} className="text-amber-200 shrink-0" />
                <span>۱,۰۰۰,۰۰۰ تومان اعتبار هدیه به ازای معرفی هر همکار + ۵٪ تخفیف فاکتور اول برای او</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white/20 hover:bg-white/30 border border-white/30 px-3.5 py-1.5 rounded-xl text-xs font-black shrink-0 flex items-center gap-1.5 transition-all shadow-2xs">
            <span>دریافت کد پاداش</span>
            <ArrowLeft size={14} />
          </div>
        </motion.button>
      </section>

      {/* --- TOP ACTIVE FACTORIES & PRODUCTION LINES (CREATIVE & FULLY RESPONSIVE) --- */}
      {(() => {
        let approvedRepsList: any[] = [];
        try {
          if (typeof window !== "undefined") {
            const local = localStorage.getItem("dastavval_representatives");
            if (local) approvedRepsList = JSON.parse(local);
          }
          if ((!approvedRepsList || approvedRepsList.length === 0) && (b2bConfig as any)?.representatives) {
            approvedRepsList = (b2bConfig as any).representatives;
          }
          approvedRepsList = approvedRepsList.filter((r: any) => r && r.isApproved !== false && (r.status === 'active' || !r.status));
        } catch {
          approvedRepsList = [];
        }

        let rawFactoriesList = Array.isArray(b2bConfig?.factories)
          ? b2bConfig.factories
          : [];

        // If no explicit factories in config, derive factories dynamically from product brands
        if (!Array.isArray(b2bConfig?.factories) && rawFactoriesList.length === 0 && products && products.length > 0) {
          const validBrands = Array.from(new Set(products.map(p => p.brand).filter(Boolean)))
            .filter(b => !isWarehouseBrand(b));

          rawFactoriesList = validBrands.map((bName, idx) => {
            const sample = products.find(p => p.brand === bName);
            const fullName = bName.startsWith("صنایع") || bName.startsWith("گروه") || bName.startsWith("کارخانه")
              ? bName
              : `گروه صنایع غذایی ${bName}`;
            return {
              id: `fac-auto-${idx}`,
              name: fullName,
              rating: 4.9,
              reviewsCount: 42 + (idx * 9) % 50,
              location: sample?.shipping_origin || "ایران، خط تولید و بسته بندی",
              logo: "🏭",
              logoUrl: sample?.brandLogoUrl || sample?.image_url,
              category: sample?.category || "صنایع غذایی و بهداشتی",
              establishedYear: 1380 + (idx * 3) % 40,
              description: `تولیدکننده رسمی محصولات ${bName} با تضمین اصالت و تامین مستقیم از درب کارخانه.`,
              contactPhone: "021-88889999",
              capacity: "ظرفیت تامین کامل",
              mainProducts: products.filter(p => p.brand === bName).map(p => p.name).slice(0, 3)
            };
          });
        }

        const configFactories = rawFactoriesList.map((f: any, idx: number) => ({
          id: f.id || `fac-custom-${idx}`,
          name: f.name || "کارخانه همکار",
          rating: f.rating || 4.9,
          reviewsCount: f.reviewsCount || 54,
          location: f.location || f.address || f.hqAddress || "ایران، خط تولید",
          logo: f.logo || "🏭",
          logoUrl: f.logoUrl || f.image_url,
          category: f.category || "صنایع تولیدی و پخش عمده",
          tag: f.establishedYear ? `تاسیس ${f.establishedYear}` : "تامین‌کننده تایید شده",
          description: f.description || f.desc || "",
          contactPhone: f.contactPhone || f.phone || "",
          capacity: f.capacity || "ظرفیت تامین نامحدود",
          mainProducts: f.mainProducts || [],
        }));

        const displayFactories = configFactories.sort((a, b) => (b.rating || 0) - (a.rating || 0));

        return (
          <section id="homepage-factories-section" className="space-y-5 relative text-right py-3" dir="rtl">
            {/* Header with Title and Navigation */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100 shadow-2xs shrink-0">
                  <Building2 size={20} className="text-emerald-700" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm sm:text-base font-black text-slate-900">
                      کارخانجات و خطوط تولید مستقیم
                    </h2>
                    <span className="text-[9.5px] font-black bg-emerald-100/70 text-emerald-900 px-2 py-0.5 rounded-md border border-emerald-200">
                      قیمت درب کارخانه
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                    تامین مستقیم و استعلام بدون واسطه از تولیدکنندگان معتبر سراسر کشور
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 self-end sm:self-auto">
                <div className="flex items-center gap-1.5 ml-2">
                   <button
                    onClick={() => {
                      const el = document.getElementById("homepage-factories-scroll");
                      if (el) el.scrollBy({ left: 320, behavior: 'smooth' });
                    }}
                    className="w-9 h-9 flex items-center justify-center bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-emerald-700 hover:border-emerald-300 transition-all cursor-pointer shadow-2xs"
                  >
                    <ChevronRight size={18} />
                  </button>
                  <button
                    onClick={() => {
                      const el = document.getElementById("homepage-factories-scroll");
                      if (el) el.scrollBy({ left: -320, behavior: 'smooth' });
                    }}
                    className="w-9 h-9 flex items-center justify-center bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-emerald-700 hover:border-emerald-300 transition-all cursor-pointer shadow-2xs"
                  >
                    <ChevronLeft size={18} />
                  </button>
                </div>
                <button
                  onClick={() => {
                    if (setActiveTab) {
                      setActiveTab('factories');
                    } else {
                      window.dispatchEvent(new CustomEvent("view-factories-tab"));
                    }
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-emerald-700 text-white text-xs font-black transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  <span>تالار کارخانجات ({toPersianNum(displayFactories.length)})</span>
                  <ArrowLeft size={13} />
                </button>
              </div>
            </div>

            {displayFactories.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center bg-white rounded-3xl border border-dashed border-slate-200 p-6 relative">
                <Building2 size={36} className="text-slate-300 stroke-[1.5]" />
                <h4 className="text-xs font-black text-slate-700 mt-2.5">کارخانه‌ای ثبت نشده است</h4>
                <p className="text-[10px] text-slate-400 mt-1 max-w-sm leading-relaxed font-bold">
                  از پنل مدیریت، کارخانجات و برندهای تحت پوشش را تعریف نمایید.
                </p>
              </div>
            ) : (
              <div 
                id="homepage-factories-scroll"
                className="flex gap-4 sm:gap-5 overflow-x-auto pb-6 pt-1 snap-x snap-mandatory no-scrollbar scroll-smooth"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {displayFactories.map((factory, idx) => {
                  const badges = ["تامین دست اول", "کیفیت صادراتی", "تضمین قیمت پایه", "ظرفیت بالا", "زنجیره تامین فعال", "تسویه اعتباری"];
                  const badge = badges[idx % badges.length];

                  // Calculate actual count of approved representatives associated with this factory or its brands
                  const matchingReps = approvedRepsList.filter((rep: any) => {
                    const repBrands = Array.isArray(rep.brands) ? rep.brands.filter((b: string) => b && !isWarehouseBrand(b)) : [];
                    if (repBrands.length === 0) return true; // general distribution representative
                    const facName = (factory.name || "").toLowerCase();
                    const facBrand = ((factory as any).brand || "").toLowerCase();
                    return repBrands.some((b: string) => {
                      const cleanB = b.toLowerCase().trim();
                      return facName.includes(cleanB) || cleanB.includes(facName) || (facBrand && (facBrand.includes(cleanB) || cleanB.includes(facBrand)));
                    });
                  });

                  const realDealershipCount = (factory as any).repCount ?? (factory as any).dealershipCount ?? matchingReps.length;

                  return (
                    <motion.div
                      key={`home-fac-card-${factory.id}-${idx}`}
                      whileHover={{ y: -4 }}
                      transition={{ duration: 0.2 }}
                      className="group bg-white rounded-3xl border border-slate-200/90 hover:border-emerald-500/80 hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden shadow-xs relative min-w-[280px] sm:min-w-[320px] max-w-[340px] shrink-0 snap-start"
                    >
                      {/* Card Header Strip */}
                      <div className="p-4 pb-0 flex items-center justify-between">
                        <span className="text-[9.5px] font-black bg-emerald-50 text-emerald-800 border border-emerald-200/80 px-2.5 py-0.5 rounded-lg">
                          {factory.category}
                        </span>
                        <div className="flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200/60 text-amber-700 text-[10px] font-black">
                          <Star size={11} className="fill-amber-400 text-amber-400" />
                          <span>{factory.rating}</span>
                        </div>
                      </div>

                      {/* Logo Stage and Brand Header */}
                      <div className="p-4 pt-3 space-y-3">
                        <div className="flex items-center gap-3">
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
                            <h3 className="text-xs sm:text-sm font-black text-slate-900 truncate group-hover:text-emerald-700 transition-colors flex items-center gap-1.5">
                              <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                              <span className="truncate">{factory.name}</span>
                            </h3>
                            <div className="flex items-center gap-1 text-[10px] text-slate-500 font-bold truncate">
                              <MapPin size={11} className="text-slate-400 shrink-0" />
                              <span className="truncate">{factory.location}</span>
                            </div>
                          </div>
                        </div>

                        {/* Metrics Pills */}
                        <div className="grid grid-cols-2 gap-2 text-[10px] font-bold bg-slate-50/80 p-2.5 rounded-2xl border border-slate-100">
                          <div className="space-y-0.5">
                            <span className="text-slate-400 text-[9px] block">نمایندگان فعال</span>
                            <span className="font-black text-slate-800">
                              {realDealershipCount > 0 ? `${toPersianNum(realDealershipCount)} عاملیت رسمی` : "بدون نماینده ثبت‌شده"}
                            </span>
                          </div>
                          <div className="space-y-0.5 text-left" dir="ltr">
                            <span className="text-slate-400 text-[9px] block text-right">وضعیت خط</span>
                            <span className="font-black text-emerald-700 flex items-center justify-end gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              <span>ارسال روزانه بار</span>
                            </span>
                          </div>
                        </div>

                        {/* Main Products / Tags */}
                        {factory.mainProducts && factory.mainProducts.length > 0 ? (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {factory.mainProducts.slice(0, 3).map((p: string, pIdx: number) => (
                              <span key={`p-chip-${factory.id}-${pIdx}`} className="text-[9px] font-bold bg-white text-slate-600 border border-slate-200/80 px-2 py-0.5 rounded-md truncate max-w-[100px]">
                                {p}
                              </span>
                            ))}
                            {factory.mainProducts.length > 3 && (
                              <span className="text-[8.5px] font-black text-slate-400">
                                +{toPersianNum(factory.mainProducts.length - 3)} کالا
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-[9.5px] text-emerald-700 font-bold">
                            <ShieldCheck size={12} />
                            <span>تاییدیه رسمی زنجیره توزیع دست اول</span>
                          </div>
                        )}
                      </div>

                      {/* Card Action Buttons */}
                      <div className="p-3 pt-0 border-t border-slate-100 mt-1 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedHomeFactory(factory)}
                          className="flex-1 py-2 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-600 text-emerald-800 hover:text-white border border-emerald-200 hover:border-transparent text-[10.5px] font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                        >
                          <span>مشاهده شناسنامه</span>
                          <ChevronLeft size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            window.dispatchEvent(new CustomEvent("view-factory", { detail: { factoryId: factory.id } }));
                          }}
                          className="py-2 px-3 rounded-xl bg-slate-900 hover:bg-emerald-700 text-white text-[10.5px] font-black transition-all flex items-center justify-center gap-1 cursor-pointer shadow-2xs"
                          title="ورود به غرفه"
                        >
                          <span>غرفه</span>
                          <ArrowLeft size={12} />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </section>
        );
      })()}

      {/* --- OFFICIAL SOCIAL CHANNELS (FRAMED CARD CONTAINER) --- */}
      <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs">
        <div className="flex items-center justify-between mb-3.5 pb-2.5 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-slate-100 text-slate-800 border border-slate-200 flex items-center justify-center shadow-xs">
              <Radio size={16} className="text-emerald-600 animate-pulse" />
            </span>
            <div>
              <h4 className="text-xs sm:text-sm font-black text-slate-900 flex items-center gap-1.5">
                <span>📢</span>
                <span>شبکه‌های اجتماعی و کانال‌های رسمی دست اول</span>
              </h4>
              <p className="text-[10px] text-slate-500 font-bold hidden sm:block">
                کانال رسمی اطلاع‌رسانی تخفیف‌های پالتی، جشنواره‌ها و اخبار زنجیره تامین
              </p>
            </div>
          </div>
          <span className="text-[10px] font-black text-slate-800 bg-slate-100 px-3 py-1 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-1">
            <span>💬</span>
            <span>ارتباط مستقیم و پشتیبانی</span>
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2.5 sm:gap-3.5">
          {/* Rubika */}
          <motion.a
            whileHover={{ y: -2, scale: 1.015 }}
            whileTap={{ scale: 0.97 }}
            href={rubikaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative overflow-hidden bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl p-3 flex items-center justify-between gap-2 transition-all cursor-pointer shadow-xs hover:shadow-md"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 border border-purple-200 flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                <Send size={16} />
              </div>
              <div className="min-w-0 text-right">
                <span className="text-xs sm:text-[13px] font-black text-slate-900 group-hover:text-purple-700 block truncate">
                  کانال روبیکا
                </span>
                <span className="text-[10px] text-slate-500 font-bold block truncate mt-0.5">
                  اطلاع‌رسانی بار کارخانه
                </span>
              </div>
            </div>
            <ChevronLeft size={16} className="text-slate-300 group-hover:text-purple-600 transition-colors hidden sm:block shrink-0" />
          </motion.a>

          {/* WhatsApp */}
          <motion.a
            whileHover={{ y: -2, scale: 1.015 }}
            whileTap={{ scale: 0.97 }}
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative overflow-hidden bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl p-3 flex items-center justify-between gap-2 transition-all cursor-pointer shadow-xs hover:shadow-md"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                <MessageCircle size={16} />
              </div>
              <div className="min-w-0 text-right">
                <span className="text-xs sm:text-[13px] font-black text-slate-900 group-hover:text-emerald-700 block truncate">
                  واتساپ پشتیبانی
                </span>
                <span className="text-[10px] text-slate-500 font-bold block truncate mt-0.5">
                  پاسخگویی سریع سفارشات
                </span>
              </div>
            </div>
            <ChevronLeft size={16} className="text-slate-300 group-hover:text-emerald-600 transition-colors hidden sm:block shrink-0" />
          </motion.a>

          {/* Instagram */}
          <motion.a
            whileHover={{ y: -2, scale: 1.015 }}
            whileTap={{ scale: 0.97 }}
            href={instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative overflow-hidden bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl p-3 flex items-center justify-between gap-2 transition-all cursor-pointer shadow-xs hover:shadow-md"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 border border-rose-200 flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                <Share2 size={16} />
              </div>
              <div className="min-w-0 text-right">
                <span className="text-xs sm:text-[13px] font-black text-slate-900 group-hover:text-rose-700 block truncate">
                  اینستاگرام رسمی
                </span>
                <span className="text-[10px] text-slate-500 font-bold block truncate mt-0.5">
                  آفرهای ویژه و خطوط
                </span>
              </div>
            </div>
            <ChevronLeft size={16} className="text-slate-300 group-hover:text-rose-600 transition-colors hidden sm:block shrink-0" />
          </motion.a>
        </div>
      </section>

      {/* --- PARTNER BRANDS STRIP --- */}
      {(() => {
        const fallbackBrands = [
          { id: "b1", name: "صنایع غذایی مینو", type: "کارخانه معتبر", icon: "🏭" },
          { id: "b2", name: "شیرین عسل", type: "کارخانه معتبر", icon: "🏭" },
          { id: "b3", name: "لبنیات چوپان", type: "کارخانه معتبر", icon: "🏭" },
          { id: "b4", name: "پاکبان", type: "کارخانه معتبر", icon: "🏭" },
          { id: "b5", name: "صنایع غذایی بهروز", type: "کارخانه معتبر", icon: "🏭" },
          { id: "b6", name: "گروه غذایی گلستان", type: "کارخانه معتبر", icon: "🏭" },
          { id: "b7", name: "صنایع غذایی تبرک", type: "کارخانه معتبر", icon: "🏭" },
          { id: "b8", name: "چی‌توز (دینا)", type: "کارخانه معتبر", icon: "🏭" },
          { id: "b9", name: "یک و یک", type: "کارخانه معتبر", icon: "🏭" },
          { id: "b10", name: "سحر همدان", type: "کارخانه معتبر", icon: "🏭" },
        ];

        const activeBrands = (b2bConfig?.brands && b2bConfig.brands.length > 0 
          ? b2bConfig.brands 
          : Array.from(new Set(products.map(p => p.brand).filter(Boolean))).map((brandName, idx) => ({
              id: `brand-${idx}`,
              name: brandName,
              type: "واحد تولیدی فعال",
              icon: "🏭",
              logoUrl: undefined
            }))).filter(b => b && b.name && !isWarehouseBrand(b.name));

        const brandsToDisplay = activeBrands.length > 0 ? activeBrands : fallbackBrands;

        return (
          <section className="space-y-2 py-3 border-b border-slate-100 mb-2">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-xs sm:text-sm font-black text-slate-800 flex items-center gap-1.5">
                <span>🏭</span>
                <span>برندهای رسمی کارخانه‌ها</span>
              </span>
              <span className="text-[10px] text-slate-800 font-bold bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-lg">
                ✨ تامین‌کنندگان مستقیم
              </span>
            </div>

            <div className="flex flex-nowrap overflow-x-auto snap-x snap-mandatory gap-2.5 pb-1 pt-1 hide-scrollbar scroll-smooth">
              {brandsToDisplay.map((brand, bIdx) => {
                const logoSrc = (brand as any).logoUrl || (brand as any).logo;
                return (
                  <button
                    key={`${brand.id || brand.name}-${bIdx}`}
                    onClick={() => {
                      window.dispatchEvent(new CustomEvent("search-brand", { detail: { brand: brand.name } }));
                      if (setActiveTab) setActiveTab('order');
                    }}
                    className="snap-start shrink-0 w-[80px] sm:w-[105px] flex flex-col items-center justify-center p-2 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200/80 transition-all duration-200 cursor-pointer group text-center shadow-xs"
                    title={`مشاهده کاتالوگ و اقلام برند ${brand.name}`}
                  >
                    {/* Logo Container - Clean, White & Prominent */}
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-center relative group-hover:scale-105 transition-transform duration-200 overflow-hidden">
                      {logoSrc ? (
                        <img 
                          src={logoSrc} 
                          alt={brand.name} 
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            const parent = e.currentTarget.parentElement;
                            if (parent) {
                              const fb = parent.querySelector('.brand-vector-fallback');
                              if (fb) (fb as HTMLElement).style.display = 'flex';
                            }
                          }}
                          className="w-full h-full object-contain p-1" 
                        />
                      ) : null}
                      <div 
                        className="brand-vector-fallback hidden absolute inset-0 bg-slate-100 text-slate-700 flex-col items-center justify-center rounded-xl"
                        style={{ display: !logoSrc ? 'flex' : 'none' }}
                      >
                        <span className="text-xl">🏭</span>
                      </div>
                    </div>

                    <div className="text-center w-full min-w-0 mt-1.5">
                      <h4 className="text-[10px] sm:text-xs font-black text-slate-800 group-hover:text-emerald-700 truncate">
                        {brand.name}
                      </h4>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        );
      })()}

      {/* --- MATERIAL B2B TRUST HIGHLIGHTS --- */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3 py-3.5 border-b border-slate-100 mb-2">
        <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="w-10 h-10 bg-slate-100 text-slate-800 border border-slate-200 rounded-xl flex items-center justify-center shrink-0 text-lg">
            🏭
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-black text-slate-900 truncate">تامین مستقیم کارخانه</h4>
            <p className="text-[10px] text-slate-500 font-bold truncate">ثبت مستقیم در خط تولید</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="w-10 h-10 bg-slate-100 text-slate-800 border border-slate-200 rounded-xl flex items-center justify-center shrink-0 text-lg">
            🚚
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-black text-slate-900 truncate">ترابری هوشمند جاده‌ای</h4>
            <p className="text-[10px] text-slate-500 font-bold truncate">ارسال بیمه‌شده سراسری</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="w-10 h-10 bg-slate-100 text-slate-800 border border-slate-200 rounded-xl flex items-center justify-center shrink-0 text-lg">
            🧾
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-black text-slate-900 truncate">فاکتور رسمی و معتبر</h4>
            <p className="text-[10px] text-slate-500 font-bold truncate">با سیب سلامت و استاندارد</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="w-10 h-10 bg-slate-100 text-slate-800 border border-slate-200 rounded-xl flex items-center justify-center shrink-0 text-lg">
            💎
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-black text-slate-900 truncate">تضمین سود بنکداری</h4>
            <p className="text-[10px] text-slate-500 font-bold truncate">پایین‌ترین نرخ خروجی کارخانه</p>
          </div>
        </div>
      </section>

      {/* --- FACTORY DETAIL MODAL --- */}
      <AnimatePresence>
        {selectedHomeFactory && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedHomeFactory(null)}
              className="absolute inset-0 bg-slate-400/50 backdrop-blur-sm"
            />
            
            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative z-10 w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden text-right"
              dir="rtl"
            >
              {/* Header Decorative cover / Background */}
              <div className="h-28 bg-gradient-to-br from-emerald-600 to-teal-700 p-4 flex justify-between items-start relative">
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
                <button
                  onClick={() => setSelectedHomeFactory(null)}
                  className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-all cursor-pointer"
                >
                  <X size={16} />
                </button>
                <span className="text-[10px] font-black bg-white/20 text-white px-2.5 py-1 rounded-full backdrop-blur-md">
                  شناسه کارخانه: {selectedHomeFactory.id}
                </span>
              </div>

              {/* Logo overlap */}
              <div className="px-6 relative -mt-10 pb-6">
                <div className="flex items-end gap-4 justify-between">
                  <div className="w-20 h-20 rounded-2xl bg-white p-1 border border-slate-200/80 shadow-md flex items-center justify-center shrink-0 overflow-hidden">
                    {selectedHomeFactory.logoUrl ? (
                      <img
                        src={selectedHomeFactory.logoUrl}
                        alt={selectedHomeFactory.name}
                        className="w-16 h-16 object-contain"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <span className="text-4xl">{selectedHomeFactory.logo || "🏭"}</span>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0 mb-1">
                    <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full inline-block mb-1.5">
                      {selectedHomeFactory.category || "صنایع تولیدی همکار"}
                    </span>
                    <h3 className="text-base font-black text-slate-800 leading-tight truncate">
                      {selectedHomeFactory.name}
                    </h3>
                  </div>
                </div>

                {/* Body details */}
                <div className="mt-6 space-y-4 text-xs font-medium text-slate-600 leading-relaxed">
                  {selectedHomeFactory.description || selectedHomeFactory.desc ? (
                    <p className="bg-white p-3.5 rounded-2xl border border-slate-100 text-[11px] text-slate-500 font-bold leading-relaxed">
                      {selectedHomeFactory.description || selectedHomeFactory.desc}
                    </p>
                  ) : (
                    <p className="text-[11px] text-slate-400 font-bold italic">توضیحاتی برای این کارخانه ثبت نشده است.</p>
                  )}

                  <div className="grid grid-cols-2 gap-3.5 pt-2">
                    <div className="flex items-center gap-2 bg-white p-2.5 rounded-xl border border-slate-100">
                      <span className="text-base">📍</span>
                      <div className="min-w-0">
                        <p className="text-[9px] text-slate-400 font-bold">موقعیت کارخانه</p>
                        <p className="text-[10px] font-black text-slate-700 truncate">{selectedHomeFactory.location || "نامشخص"}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 bg-white p-2.5 rounded-xl border border-slate-100">
                      <span className="text-base">🗓️</span>
                      <div className="min-w-0">
                        <p className="text-[9px] text-slate-400 font-bold">سال تاسیس خط تولید</p>
                        <p className="text-[10px] font-black text-slate-700 truncate">
                          {selectedHomeFactory.establishedYear || selectedHomeFactory.established || "نامشخص"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 bg-white p-2.5 rounded-xl border border-slate-100">
                      <span className="text-base">📦</span>
                      <div className="min-w-0">
                        <p className="text-[9px] text-slate-400 font-bold">ظرفیت تولید / تنوع اقلام</p>
                        <p className="text-[10px] font-black text-slate-700 truncate">{selectedHomeFactory.capacity || "بر اساس سفارشات بنکداری"}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 bg-white p-2.5 rounded-xl border border-slate-100">
                      <span className="text-base">⭐</span>
                      <div className="min-w-0">
                        <p className="text-[9px] text-slate-400 font-bold">رتبه و ارزیابی کیفی</p>
                        <p className="text-[10px] font-black text-slate-700 truncate flex items-center gap-1">
                          <span>{selectedHomeFactory.rating || 4.8} از ۵</span>
                          <span className="text-slate-400 font-bold">({toPersianNum(selectedHomeFactory.reviewsCount || 12)} نظر)</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {selectedHomeFactory.mainProducts && selectedHomeFactory.mainProducts.length > 0 && (
                    <div className="space-y-1.5 pt-2">
                      <p className="text-[10px] text-slate-400 font-bold">عمده تولیدات و محصولات شاخص:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedHomeFactory.mainProducts.map((p: string, i: number) => (
                          <span key={`fac-prod-${selectedHomeFactory.id || selectedHomeFactory.name}-${i}-${p}`} className="text-[9px] font-black bg-slate-100 text-slate-600 px-2 py-1 rounded-lg">
                            {p}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedHomeFactory.contactPhone && (() => {
                    const isVIP = userBadge === 'vip' || userBadge === 'admin';
                    return (
                      <div className="mt-2 space-y-2">
                        <div className="flex items-center justify-between p-3 bg-white border border-slate-200/60 rounded-2xl relative overflow-hidden">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">📞</span>
                            <div>
                              <p className="text-[9px] text-slate-500 font-bold">تماس مستقیم با مدیریت فروش</p>
                              {isVIP ? (
                                <p className="text-xs font-black text-slate-800 font-mono">{selectedHomeFactory.contactPhone}</p>
                              ) : (
                                <div className="flex items-center gap-1.5">
                                  <p className="text-xs font-black text-slate-400 font-mono blur-[3px] select-none">
                                    {selectedHomeFactory.contactPhone.replace(/\d/g, "*")}
                                  </p>
                                  <span className="text-[8px] font-black bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-md">
                                    مخصوص VIP
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                          {isVIP ? (
                            <a
                              href={`tel:${selectedHomeFactory.contactPhone}`}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black px-3.5 py-1.5 rounded-xl transition-all shadow-md shadow-emerald-600/15 cursor-pointer"
                            >
                              تماس تلفنی
                            </a>
                          ) : (
                            <button
                              onClick={() => {
                                alert("🔒 همکار گرامی، اطلاعات تماس مستقیم کارخانه و نمایندگان جهت حفظ امنیت اطلاعات تجاری، منحصراً برای اعضای VIP فعال می‌باشد. شما می‌توانید رتبه کاربری خود را در پنل مدیریت به VIP تغییر دهید تا تمامی شماره‌ها آنبلور شوند.");
                              }}
                              className="bg-purple-600 hover:bg-purple-700 text-white text-[10px] font-black px-3.5 py-1.5 rounded-xl transition-all shadow-md shadow-purple-600/15 cursor-pointer"
                            >
                              نمایش شماره
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Footer buttons */}
                <div className="mt-6 pt-4 border-t border-slate-100 flex gap-2.5">
                  <button
                    onClick={() => {
                      setSelectedHomeFactory(null);
                      // Dispatch view-factory custom event
                      window.dispatchEvent(new CustomEvent("view-factory", { detail: { factoryId: selectedHomeFactory.id } }));
                    }}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black py-3 rounded-2xl transition-all shadow-md shadow-emerald-600/20 cursor-pointer text-center"
                  >
                    ورود به غرفه اختصاصی کارخانه
                  </button>
                  <button
                    onClick={() => setSelectedHomeFactory(null)}
                    className="px-5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black py-3 rounded-2xl transition-all cursor-pointer"
                  >
                    بستن
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- ENGAGEMENT LOYALTY & OPERATIONS SUITE --- */}
      <EngagementHub
        products={products}
        onAddToCart={onAddToCart || (() => {})}
        userBadge={userBadge}
        theme={theme}
      />

      {/* --- AI ADVISOR BANNER --- */}
      <section className="bg-white text-slate-900 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-3.5 shadow-sm border border-slate-200/90">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center shrink-0 font-black shadow-xs">
            <BrainCircuit size={20} className="animate-pulse" />
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2">
              <h3 className="text-xs sm:text-sm font-black text-slate-900">دستیار هوشمند تحلیل بازار و حاشیه سود</h3>
              <span className="text-[9px] font-black bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-100">
                برخط و داده‌محور
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-bold mt-0.5">
              محاسبه آنی کرایه جاده‌ای، سود ناخالص سبد کالا و تخفیفات پلکانی کارخانجات
            </p>
          </div>
        </div>
        <button
          onClick={() => window.dispatchEvent(new CustomEvent("open-ai-chat"))}
          className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-black text-xs transition-all shadow-xs shrink-0 cursor-pointer flex items-center justify-center gap-2"
        >
          <MessageSquare size={14} />
          <span>شروع گفتگو و تحلیل سبد کالا</span>
        </button>
      </section>

      {/* --- REFERRAL REWARD MODAL --- */}
      <ReferralRewardModal
        isOpen={isReferralOpen}
        onClose={() => setIsReferralOpen(false)}
        userPhone={user?.phone}
      />

    </div>
  );
}
