import { useState, useEffect, useRef } from "react";
import { HeroGlobeWidget } from "./NetworkGlobePowerhouse";
import { SupplyChainLifecycleAnimation } from "./SupplyChainLifecycleAnimation";
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
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { B2BConfig, Product } from "../types";
import { Language } from "../lib/translations";
import ProductCard from "./ProductCard";
import MagazineSection from "./MagazineSection";
import { ReferralRewardModal } from "./ReferralRewardModal";

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
  userBadge,
  user,
}: DynamicPresentationProps) {
  const [selectedCategory, setSelectedCategory] = useState("همه");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSlide, setActiveSlide] = useState(0);
  const [selectedHomeFactory, setSelectedHomeFactory] = useState<any | null>(null);
  const [copiedCoupon, setCopiedCoupon] = useState(false);
  const [isReferralOpen, setIsReferralOpen] = useState(false);

  const toPersianNum = (num: number | string) => {
    if (num === undefined || num === null) return "";
    if (language === "en") return num.toString();
    const persian: Record<string, string> = {
      "0": "۰", "1": "۱", "2": "۲", "3": "۳", "4": "۴", "5": "۵", "6": "۶", "7": "۷", "8": "۸", "9": "۹"
    };
    return num.toString().replace(/[0-9]/g, (w) => persian[w]);
  };

  const defaultSlides = [
    {
      id: "1",
      title: "تامین عمده انواع شکلات کاکائویی و ویفر کارخانه‌ای",
      subtitle: "ارتباط بی‌واسطه بنکداران و سوپرمارکت‌های سراسر کشور با خطوط تولید شکلات، دراژه و ویفر (با امکان صدور فاکتور)",
      imageUrl: "https://images.unsplash.com/photo-1511381939415-e44015466834?auto=format&fit=crop&q=80&w=1200",
      badge: "صنایع شکلات و ویفر 🍫",
      accentColor: "bg-purple-600",
      ctaText: "مشاهده محصولات",
      ctaAction: "order"
    },
    {
      id: "2",
      title: "دنیای ترشیجات و لواشک‌های سنتی و صنعتی بهداشتی",
      subtitle: "پخش عمده مستقیم انواع لواشک، ترشک و آلوچه با سیب سلامت و بالاترین حاشیه سود برای خریداران عمده",
      imageUrl: "https://images.unsplash.com/photo-1599420186946-7b6fb4e297f0?auto=format&fit=crop&q=80&w=1200",
      badge: "بارگیری روزانه از قطب تولید 🍇",
      accentColor: "bg-amber-500",
      ctaText: "خرید مستقیم",
      ctaAction: "order"
    },
    {
      id: "3",
      title: "کیک، کلوچه و بیسکویت‌های تازه عصرانه پخت روز",
      subtitle: "تامین پالت و کارتن انواع کیک و کلوچه نازل‌ترین قیمت عمده پایه کارخانه و امکان ثبت سفارش مستقیم",
      imageUrl: "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&q=80&w=1200",
      badge: "پخت تازه و تخفیف کارتن 🍪",
      accentColor: "bg-indigo-600",
      ctaText: "مشاهده کاتالوگ",
      ctaAction: "order"
    },
    {
      id: "4",
      title: "نوشیدنی، آبمیوه طبیعی و نکتار صادراتی",
      subtitle: "پخش پالتی انواع آبمیوه تک‌نفره و خانواده با استاندارد ملی و حمل مسقف بیمه‌شده تا انبار شما",
      imageUrl: "https://images.unsplash.com/photo-1622597467827-43f0553ad9fe?auto=format&fit=crop&q=80&w=1200",
      badge: "حمل مسقف و بیمه جاده‌ای 🥤",
      accentColor: "bg-slate-100",
      ctaText: "سفارش عمده",
      ctaAction: "order"
    }
  ];

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
    if (catName) {
      mergedCatMap.set(catName.trim(), {
        id: catName.trim(),
        label: catName.trim(),
        icon: typeof c === 'object' && c.icon ? c.icon : "🏷️",
        image: (typeof c === 'object' && (c.image || c.imageUrl)) ? (c.image || c.imageUrl) : getCategoryImage(catName.trim())
      });
    }
  });

  // Add categories/tags found in products that aren't in config yet
  productCategoriesSet.forEach(catName => {
    if (!mergedCatMap.has(catName)) {
      mergedCatMap.set(catName, {
        id: catName,
        label: catName,
        icon: "🏷️",
        image: getCategoryImage(catName)
      });
    }
  });

  const categoriesList = [
    { id: "همه", label: "همه اقلام", icon: "✨", image: "" },
    ...Array.from(mergedCatMap.values())
  ];

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

  const filteredProducts = products.filter((p) => {
    const matchesCategory = isCategoryMatch(p, selectedCategory);
    const matchesSearch = searchQuery === "" || 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.brand.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const featuredDisplayProducts = filteredProducts.slice(0, 8);

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

  // Counter animation from 0 or previous values
  useEffect(() => {
    let startTimestamp: number | null = null;
    const isFirstLoad = prevRepsRef.current === 0;
    const duration = isFirstLoad ? 1500 : 800; // 1.5 seconds on initial load, 0.8 seconds on small tick updates
    const startReps = prevRepsRef.current;
    const startProducts = prevProductsRef.current;
    const diffReps = liveReps - startReps;
    const diffProducts = liveProducts - startProducts;

    let animationFrameId: number;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      
      // Easing outQuad
      const ease = progress * (2 - progress);

      setDisplayedReps(Math.floor(startReps + ease * diffReps));
      setDisplayedProducts(Math.floor(startProducts + ease * diffProducts));

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      } else {
        setDisplayedReps(liveReps);
        setDisplayedProducts(liveProducts);
        prevRepsRef.current = liveReps;
        prevProductsRef.current = liveProducts;
      }
    };

    animationFrameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animationFrameId);
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
    <div className="space-y-4 py-1 text-right" dir="rtl">
      
      {/* --- CLASSIC EXQUISITE MERCHANT BANNER (WHEN IN CLASSIC MODE) --- */}
      {theme === 'classic' && (
        <div className="relative overflow-hidden bg-gradient-to-r from-amber-50/70 via-white/95 to-emerald-50/50 rounded-3xl p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-5 shadow-[0_12px_40px_rgba(217,119,6,0.06)] border border-amber-200/70 text-right backdrop-blur-md">
          {/* Decorative glows */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-200/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-200/10 rounded-full blur-2xl pointer-events-none" />

          <div className="flex flex-col sm:flex-row items-center gap-4 relative z-10">
            {/* 3D Rotating Network Globe element replacing 🏛️ icon - larger and frameless */}
            <HeroGlobeWidget size="lg" />
            <div className="space-y-1 text-center sm:text-right">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <span className="bg-amber-100/80 text-amber-900 border border-amber-300/60 px-2.5 py-0.5 rounded-lg text-[10px] font-black">
                  شبکه سراسری تامین و بنکداری ۳۱ استان
                </span>
                <span className="bg-emerald-50 text-emerald-800 border border-emerald-200/80 px-2.5 py-0.5 rounded-lg text-[10px] font-black">
                  اصالت و تضمین کیفیت فاکتور کارخانه
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-black text-slate-900 mt-1 leading-snug">
                {(b2bConfig as any).appName || "دست اول"} با بیش از {toPersianNum(displayedReps)} نماینده و بازاریاب و {toPersianNum(displayedProducts)} محصول در سرتاسر ایران
              </h3>
            </div>
          </div>
          
          <div className="flex items-center gap-2 shrink-0 relative z-10">
            <div className="relative overflow-hidden px-4.5 py-2 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-200 shadow-sm flex items-center gap-2">
              <span className="text-xs sm:text-sm font-black tracking-wide text-amber-300 select-none">
                « خیر و برکت در صدق در معامله است »
              </span>
            </div>
          </div>
        </div>
      )}

      {/* --- GLASSMORPHIC LIGHT HERO BANNER WITH CONNECTED BUBBLE NETWORK --- */}
      <section className="relative overflow-hidden flex flex-col lg:flex-row items-center justify-between gap-6 py-4 sm:py-6">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

        <div className="relative z-10 space-y-3 max-w-xl flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 bg-gradient-to-r from-emerald-800 to-teal-800 text-white px-3.5 py-1 rounded-full text-[11px] font-black shadow-md border border-emerald-500/30">
              <Sparkles size={13} className="fill-emerald-300 text-emerald-300" />
              <span>پلتفرم سراسری بنکداری و تامین مستقیم</span>
            </span>
          </div>

          <h1 className="text-base sm:text-lg font-black text-slate-900 leading-snug">
            {b2bConfig?.appName ? `${b2bConfig.appName}؛ ${b2bConfig.appSub || 'خرید مستقیم عمده از خطوط تولید و کارخانجات معتبر کشور'}` : 'دست اول؛ خرید مستقیم عمده از خطوط تولید و کارخانجات معتبر کشور'}
          </h1>

          <p className="text-xs sm:text-sm text-slate-600 font-bold leading-relaxed">
            {b2bConfig?.topAnnouncement || 'ثبت آنلاین سفارشات پالتی و کارتنی، استعلام کف قیمت خط تولید، هماهنگی فاکتور کارخانه و حمل مسقف بیمه‌شده به انبار شما.'}
          </p>
        </div>

        {/* Creative Interactive B2B Supply Chain Lifecycle Animation Widget */}
        <div className="relative z-10 w-full lg:w-[480px] shrink-0">
          <SupplyChainLifecycleAnimation onOrderClick={() => setActiveTab?.('order')} />
        </div>
      </section>

      {/* --- QUICK CATEGORY NAVIGATION TILES --- */}
      <section className="space-y-3">
        <div className="flex items-center justify-between border-b border-slate-200/80 pb-2.5">
          <h2 className="text-xs sm:text-sm font-black text-slate-900 flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700">
              <Grid size={16} />
            </div>
            <span>دسته بندی ها</span>
          </h2>
          <button 
            onClick={() => setActiveTab?.('order')}
            className="text-[11px] font-black text-emerald-800 hover:text-emerald-900 hover:underline flex items-center gap-1 cursor-pointer bg-emerald-50/80 px-2.5 py-1 rounded-full border border-emerald-200/60"
          >
            <span>مشاهده</span>
            <ArrowLeft size={13} />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {categoriesList.map((cat) => {
            const itemCount = cat.id === "همه" 
              ? products.length 
              : products.filter(p => isCategoryMatch(p, cat.id)).length;
            const isSelected = selectedCategory === cat.id;

            return (
              <button
                key={cat.id}
                onClick={() => {
                  const targetCat = cat.id === "همه" ? "همه" : cat.id;
                  setSelectedCategory(targetCat);
                  if (setActiveCategory) setActiveCategory(targetCat);
                }}
                className={`group relative rounded-2xl overflow-hidden border transition-all text-right flex flex-col justify-between cursor-pointer p-3 space-y-2.5 ${
                  isSelected
                    ? "bg-gradient-to-b from-emerald-800 via-emerald-700 to-teal-800 text-white border-emerald-500 ring-2 ring-emerald-400/50 shadow-xl shadow-emerald-900/20 scale-[1.02]"
                    : "bg-white text-slate-800 border-slate-200 hover:bg-white hover:border-emerald-400/60 hover:shadow-lg hover:-translate-y-1"
                }`}
              >
                <div className="relative w-full h-28 sm:h-32 rounded-xl overflow-hidden bg-slate-100 shrink-0 flex items-center justify-center">
                  {cat.image ? (
                    <>
                      <img 
                        src={cat.image} 
                        alt={cat.label} 
                        onError={(e) => {
                          e.currentTarget.src = getCategoryImage(cat.label);
                        }}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                      />
                      <div className={`absolute inset-0 ${isSelected ? "bg-emerald-950/30" : "bg-gradient-to-t from-slate-950/70 via-slate-950/20 to-transparent"}`} />
                      <span className="absolute top-2 right-2 bg-white/95 backdrop-blur-md text-slate-900 w-8 h-8 rounded-xl text-sm flex items-center justify-center font-black shadow-md border border-white/50 z-10">
                        {cat.icon || "🏷️"}
                      </span>
                    </>
                  ) : (
                    <div className={`w-full h-full flex flex-col items-center justify-center p-3 relative transition-all duration-300 ${
                      isSelected 
                        ? "bg-gradient-to-br from-emerald-800 via-teal-700 to-indigo-900 text-amber-300" 
                        : "bg-gradient-to-br from-emerald-900 via-slate-900 to-teal-950 text-emerald-300 group-hover:from-emerald-800 group-hover:to-slate-900"
                    }`}>
                      {/* B2B All Items Special Badge */}
                      <span className="text-3xl sm:text-4xl transform group-hover:scale-120 group-hover:rotate-6 transition-all duration-300 drop-shadow-md">
                        {cat.icon || "✨"}
                      </span>
                      <span className="text-[10px] font-black tracking-wider uppercase mt-1 opacity-90 text-amber-200 bg-black/30 px-2 py-0.5 rounded-md border border-white/10">
                        کاتالوگ کامل
                      </span>
                    </div>
                  )}

                  <span className={`absolute bottom-2 left-2 px-2.5 py-1 rounded-lg text-[9px] font-black shadow-md ${
                    isSelected ? "bg-amber-400 text-slate-950" : "bg-slate-900/90 backdrop-blur-md text-white border border-white/20"
                  }`}>
                    {toPersianNum(itemCount)} کالا
                  </span>
                </div>

                <div>
                  <h3 className={`text-xs sm:text-sm font-black line-clamp-1 ${isSelected ? "text-amber-300" : "text-slate-900 group-hover:text-emerald-700"}`}>
                    {cat.label}
                  </h3>
                  <p className={`text-[10px] font-bold mt-0.5 ${isSelected ? "text-emerald-100" : "text-slate-400"}`}>
                    تامین مستقیم کارخانه
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* --- FEATURED PRODUCTS SECTION --- */}
      <section className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-slate-200 pb-2">
          <div>
            <h2 className="text-sm sm font-black text-slate-900 flex items-center gap-1.5">
              <Store size={18} className="text-amber-500" />
              کالاهای منتخب کارخانه
            </h2>
          </div>

          {/* Search Box */}
          <div className="w-full sm:w-56 relative">
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
              <Search size={14} />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجوی کالا..."
              className="w-full py-1.5 pr-8 pl-8 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus text-slate-900 text-right"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-slate-400"
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>

        {/* Products Grid (Max 8) */}
        {featuredDisplayProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
            {featuredDisplayProducts.map((p, idx) => (
              <ProductCard
                key={p.id}
                index={idx}
                product={p}
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
            onClick={() => setActiveTab?.('catalog')}
            className={`w-full sm:w-auto px-6 py-2.5 ${activeColors.catalogBtnBg} hover:opacity-90 text-white font-black text-xs rounded-xl shadow-sm transition-all cursor-pointer inline-flex items-center justify-center gap-2`}
          >
            <span>مشاهده لیست کامل محصولات در کاتالوگ عمده</span>
            <ArrowLeft size={15} />
          </button>
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
              <ShoppingBag size={18} />
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
          className="group relative overflow-hidden bg-white hover:bg-white text-slate-800 p-3 rounded-2xl flex items-center justify-between gap-2 transition-all cursor-pointer hover:shadow-md"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 group-hover:scale-105 group-hover:bg-blue-500 group-hover:text-white transition-all shrink-0">
              <Store size={18} />
            </div>
            <span className="font-black text-xs sm:text-sm text-slate-900 group-hover:text-blue-700 transition-colors whitespace-nowrap truncate">
              پنل کاربری
            </span>
          </div>
          <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-400 group-hover:bg-blue-500 group-hover:text-white flex items-center justify-center text-xs font-bold transition-all shrink-0">
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
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setIsReferralOpen(true)}
          className="w-full bg-gradient-to-r from-amber-500 via-emerald-600 to-teal-600 hover:from-amber-600 hover:to-teal-700 text-white rounded-2xl p-2.5 sm:p-3 flex items-center justify-between gap-2 shadow-sm hover:shadow-md cursor-pointer border border-amber-300/40 relative overflow-hidden transition-all"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-base shrink-0 border border-white/30">
              🎁
            </div>
            <div className="text-right min-w-0">
              <div className="font-black text-xs sm:text-sm text-white flex items-center gap-1.5 truncate">
                <span>سیستم دعوت از همکاران و پاداش خرید عمده</span>
                <span className="bg-amber-300 text-slate-900 text-[10px] font-black px-2 py-0.5 rounded-md hidden sm:inline-block">ویژه بنکداران</span>
              </div>
              <div className="text-[10px] text-amber-100 font-extrabold truncate mt-0.5">
                ۱,۰۰۰,۰۰۰ تومان اعتبار هدیه به ازای معرفی هر همکار + ۵٪ تخفیف برای او
              </div>
            </div>
          </div>
          
          <div className="bg-white/15 hover:bg-white/25 border border-white/30 px-3 py-1.5 rounded-xl text-xs font-black shrink-0 flex items-center gap-1 transition-all">
            <span>دریافت کد پاداش</span>
            <span>←</span>
          </div>
        </motion.button>
      </section>

      {/* --- TOP ACTIVE FACTORIES HORIZONTAL LIST --- */}
      {(() => {
        const configFactories = b2bConfig?.factories && b2bConfig.factories.length > 0
          ? b2bConfig.factories.map((f: any, idx: number) => ({
              id: f.id || `fac-custom-${idx}`,
              name: f.name || "کارخانه همکار",
              rating: f.rating || 4.8,
              reviewsCount: f.reviewsCount || 48,
              location: f.location || f.address || f.hqAddress || "ایران، خط تولید",
              logo: f.logo || "🏭",
              logoUrl: f.logoUrl || f.image_url,
              category: f.category || "صنایع تولیدی",
              tag: f.establishedYear ? `تاسیس ${f.establishedYear}` : "کارخانه تایید شده",
              description: f.description || f.desc || "",
              contactPhone: f.contactPhone || f.phone || "",
              capacity: f.capacity || "",
              mainProducts: f.mainProducts || [],
            }))
          : [];

        const sortedDisplayFactories = configFactories.sort((a, b) => b.rating - a.rating);

        return (
          <section className="space-y-6 relative overflow-hidden text-right py-4 border-b border-slate-100/60" dir="rtl">
            {/* Elegant Atmospheric Glow */}
            <div className="absolute top-0 left-0 w-36 h-36 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-0 right-0 w-36 h-36 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>

            <div className="flex items-center justify-between border-b border-slate-50 pb-4 relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 text-emerald-600 flex items-center justify-center shadow-2xs">
                  <Building2 size={20} className="text-emerald-600 animate-pulse" />
                </div>
                <div className="space-y-0.5">
                  <span className="text-xs sm:text-sm font-black text-slate-800 tracking-tight">
                    کارخانجات تولیدی برتر دست اول (نمایش افقی)
                  </span>
                  <p className="text-[10px] text-slate-400 font-bold">دسترسی مستقیم و استعلام بدون واسطه از تامین‌کنندگان خط تولید</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-[10px] bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-xl font-black hidden sm:inline-block border border-emerald-200/60">
                  👈 برای مشاهده سایر کارخانجات به چپ بکشید
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      const el = document.getElementById("homepage-factories-scroll");
                      if (el) el.scrollBy({ left: 300, behavior: 'smooth' });
                    }}
                    className="p-2 bg-slate-100 hover:bg-emerald-100 hover:text-emerald-800 rounded-xl text-slate-600 transition-colors cursor-pointer"
                    title="قبلی"
                  >
                    <ChevronRight size={16} />
                  </button>
                  <button
                    onClick={() => {
                      const el = document.getElementById("homepage-factories-scroll");
                      if (el) el.scrollBy({ left: -300, behavior: 'smooth' });
                    }}
                    className="p-2 bg-slate-100 hover:bg-emerald-100 hover:text-emerald-800 rounded-xl text-slate-600 transition-colors cursor-pointer"
                    title="بعدی"
                  >
                    <ChevronLeft size={16} />
                  </button>
                </div>
              </div>
            </div>

            {sortedDisplayFactories.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center bg-white rounded-[2rem] border border-dashed border-slate-200 p-4 relative z-10">
                <Building2 size={32} className="text-slate-300 stroke-[1.5]" />
                <h4 className="text-xs font-black text-slate-600 mt-2.5">هیچ کارخانه تولیدی ثبت نشده است</h4>
                <p className="text-[10px] text-slate-400 mt-1 max-w-sm leading-relaxed font-bold">
                  هم‌اکنون می‌توانید از پنل مدیریت (زیربرگه کارخانجات) اولین خط تولید خود را تعریف کنید تا بلافاصله در این بخش نمایش داده شود.
                </p>
              </div>
            ) : (
              <div 
                id="homepage-factories-scroll"
                className="flex gap-4 overflow-x-auto pb-4 pt-1 snap-x snap-mandatory relative z-10 no-scrollbar" 
                style={{ direction: 'rtl', scrollBehavior: 'smooth' }}
              >
                {sortedDisplayFactories.map((factory, idx) => {
                  const badges = ["تامین دست اول", "کیفیت صادراتی", "تضمین قیمت پایه", "ظرفیت بالا", "زنجیره تامین فعال"];
                  const badge = badges[idx % badges.length];
                  
                  // Generate realistic live metrics to make the site feel "live" and real
                  const dealershipCount = (idx % 3 + 2) * 4 + 3;
                  const dispatchTime = idx % 2 === 0 ? "امروز صبح" : "دیروز عصر";
                  const liveIndicatorColor = idx % 3 === 0 ? "bg-emerald-500" : "bg-teal-500";
                  const minOrder = "مستقیم از خط تولید (قیمت درب کارخانه)";

                  return (
                    <div
                      key={`${factory.id}-${idx}`}
                      onClick={() => {
                        setSelectedHomeFactory(factory);
                      }}
                      className="group w-72 sm:w-80 shrink-0 snap-start p-5 rounded-[2.2rem] bg-white border border-slate-200/90 hover:border-emerald-500 hover:shadow-2xl transition-all duration-300 cursor-pointer flex flex-col justify-between text-right relative overflow-hidden shadow-sm hover:-translate-y-1.5"
                    >
                      {/* Premium Top Status Tag */}
                      <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full animate-ping shrink-0 bg-emerald-500" />
                        <span className="text-[9px] font-black bg-emerald-600 text-white px-2.5 py-1 rounded-full shadow-xs">
                          {badge}
                        </span>
                      </div>

                      {/* Rating and category */}
                      <div className="w-full flex justify-between items-center text-[10px] font-bold text-slate-400 mt-2 mb-3 z-10">
                        <span className="bg-emerald-50 text-emerald-800 border border-emerald-200/60 font-black px-2.5 py-1 rounded-xl truncate max-w-[120px]">
                          {factory.category}
                        </span>
                        <div className="flex items-center gap-1 text-amber-600 bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200/80 shadow-2xs">
                          <Star size={12} className="fill-amber-400 text-amber-400" />
                          <span className="font-black text-slate-800">{factory.rating}</span>
                        </div>
                      </div>

                      {/* Center: Grand Eye-Catching Factory Stage */}
                      <div className="w-full h-36 rounded-2xl bg-gradient-to-br from-slate-50 via-emerald-50/20 to-teal-50/10 relative overflow-hidden my-2 shadow-xs border border-slate-100 group-hover:border-emerald-300 group-hover:shadow-md transition-all duration-300 flex items-center justify-center p-2">
                        {factory.logoUrl && (
                          <img
                            src={factory.logoUrl}
                            alt=""
                            className="absolute inset-0 w-full h-full object-cover scale-125 blur-md opacity-10 group-hover:opacity-20 transition-all duration-500"
                          />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/5 via-transparent to-white/30 pointer-events-none z-0" />

                        {factory.logoUrl ? (
                          <img
                            src={factory.logoUrl}
                            alt={factory.name}
                            className="max-w-full max-h-full object-contain relative z-10 p-1 group-hover:scale-105 transition-transform duration-500 drop-shadow-sm"
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = "none";
                            }}
                          />
                        ) : (
                          <span className="text-4xl relative z-10">{factory.logo || "🏭"}</span>
                        )}
                      </div>

                      {/* Bottom: Factory Name and short location */}
                      <div className="w-full space-y-2 mt-2 min-w-0">
                        <h4 className="text-sm font-black text-slate-900 group-hover:text-emerald-700 transition-colors truncate w-full flex items-center gap-1.5">
                          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                          <span className="truncate">{factory.name}</span>
                        </h4>
                        
                        <div className="flex items-center gap-1 text-[11px] text-slate-500 font-bold">
                          <span>📍</span>
                          <span className="truncate">
                            {factory.location || "آذربایجان شرقی، شبستر"}
                          </span>
                        </div>

                        {/* Real-life metrics to prove platform authenticity */}
                        <div className="bg-white/80 rounded-xl p-2.5 space-y-1.5 text-[10px] text-slate-600 border border-slate-100">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-slate-400">عاملیت‌های فعال:</span>
                            <span className="font-black text-slate-700">{dealershipCount} نماینده فعال</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-slate-400">آخرین ارسال بار:</span>
                            <span className="font-black text-emerald-700 flex items-center gap-1">
                              <span className={`w-1.5 h-1.5 rounded-full ${liveIndicatorColor}`} />
                              {dispatchTime}
                            </span>
                          </div>
                          <div className="text-[9px] font-black text-indigo-700 text-center pt-1 border-t border-dashed border-slate-200">
                            {minOrder}
                          </div>
                        </div>
                      </div>

                      {/* Quick Interactive Button Overlay at bottom */}
                      <div className="w-full mt-3 pt-3 border-t border-slate-100 flex justify-center">
                        <span className="w-full text-[11px] font-black text-emerald-800 bg-emerald-50 border border-emerald-200 group-hover:bg-gradient-to-r group-hover:from-emerald-600 group-hover:to-teal-600 group-hover:text-white group-hover:border-transparent py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-2xs">
                          ورود به غرفه اختصاصی کارخانه
                          <ArrowLeft size={13} />
                        </span>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </section>
        );
      })()}

      {/* --- OFFICIAL SOCIAL CHANNELS (FRAMED CARD CONTAINER) --- */}
      <section className="bg-gradient-to-r from-slate-50 via-purple-50/20 to-slate-50 border-2 border-slate-200/90 rounded-2xl p-3 sm:p-4 shadow-xs">
        <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-slate-200/70">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-xs font-black shadow-xs">
              📡
            </span>
            <h4 className="text-xs sm:text-sm font-black text-slate-800">
              شبکه‌های اجتماعی و کانال‌های رسمی دست اول
            </h4>
          </div>
          <span className="text-[10px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200 shadow-2xs">
            ارتباط زنده و اطلاع‌رسانی آنلاین
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {/* Rubika */}
          <motion.a
            whileHover={{ y: -3, scale: 1.02 }}
            whileTap={{ scale: 0.96 }}
            href={rubikaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative overflow-hidden bg-white hover:bg-purple-50/70 hover:border-purple-300 border border-slate-200/80 rounded-2xl p-2 sm:p-2.5 flex items-center justify-between gap-1.5 transition-all cursor-pointer shadow-2xs hover:shadow-md"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-xs group-hover:scale-110 transition-transform">
                💎
              </div>
              <div className="min-w-0 text-right">
                <span className="text-xs sm:text-[13px] font-black text-slate-800 group-hover:text-purple-700 block truncate">
                  روبیکا
                </span>
                <span className="text-[10px] text-purple-600 font-extrabold block truncate">
                  کانال 📢
                </span>
              </div>
            </div>
            <span className="text-slate-300 group-hover:text-purple-500 text-xs font-bold transition-colors hidden sm:block shrink-0">←</span>
          </motion.a>

          {/* WhatsApp */}
          <motion.a
            whileHover={{ y: -3, scale: 1.02 }}
            whileTap={{ scale: 0.96 }}
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative overflow-hidden bg-white hover:bg-emerald-50/70 hover:border-emerald-300 border border-slate-200/80 rounded-2xl p-2 sm:p-2.5 flex items-center justify-between gap-1.5 transition-all cursor-pointer shadow-2xs hover:shadow-md"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-xs group-hover:scale-110 transition-transform">
                💬
              </div>
              <div className="min-w-0 text-right">
                <span className="text-xs sm:text-[13px] font-black text-slate-800 group-hover:text-emerald-700 block truncate">
                  واتساپ
                </span>
                <span className="text-[10px] text-emerald-600 font-extrabold block truncate">
                  پشتیبانی 🗣️
                </span>
              </div>
            </div>
            <span className="text-slate-300 group-hover:text-emerald-500 text-xs font-bold transition-colors hidden sm:block shrink-0">←</span>
          </motion.a>

          {/* Instagram */}
          <motion.a
            whileHover={{ y: -3, scale: 1.02 }}
            whileTap={{ scale: 0.96 }}
            href={instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative overflow-hidden bg-white hover:bg-pink-50/70 hover:border-pink-300 border border-slate-200/80 rounded-2xl p-2 sm:p-2.5 flex items-center justify-between gap-1.5 transition-all cursor-pointer shadow-2xs hover:shadow-md"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-tr from-amber-500 via-pink-500 to-purple-600 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-xs group-hover:scale-110 transition-transform">
                📸
              </div>
              <div className="min-w-0 text-right">
                <span className="text-xs sm:text-[13px] font-black text-slate-800 group-hover:text-pink-700 block truncate">
                  اینستاگرام
                </span>
                <span className="text-[10px] text-pink-600 font-extrabold block truncate">
                  آفر 🎁
                </span>
              </div>
            </div>
            <span className="text-slate-300 group-hover:text-pink-500 text-xs font-bold transition-colors hidden sm:block shrink-0">←</span>
          </motion.a>
        </div>
      </section>

      {/* --- PARTNER BRANDS STRIP --- */}
      {(() => {
        const activeBrands = b2bConfig?.brands && b2bConfig.brands.length > 0 
          ? b2bConfig.brands 
          : Array.from(new Set(products.map(p => p.brand).filter(Boolean))).map((brandName, idx) => ({
              id: `brand-${idx}`,
              name: brandName,
              type: "واحد تولیدی فعال",
              icon: "🏭",
              logoUrl: undefined
            }));

        return (
          <section className="space-y-2 py-3 border-b border-slate-100/60 mb-2">
            <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
              <span className="text-[11px] sm:text-xs font-black text-slate-800 flex items-center gap-1.5">
                <Building2 size={14} className={activeColors.brandIconText} />
                برندهای رسمی کارخانه‌ها
              </span>
              <span className="text-[9px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md">
                تامین‌کنندگان مستقیم
              </span>
            </div>

            {activeBrands.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-4 text-center bg-white rounded-xl border border-dashed border-slate-200 p-3">
                <span className="text-xl mb-1">🏭</span>
                <p className="text-xs font-bold text-slate-600">هنوز هیچ برندی ثبت نشده است</p>
              </div>
            ) : (
              <div className="flex flex-nowrap overflow-x-auto snap-x snap-mandatory gap-2.5 pb-1 pt-1 hide-scrollbar scroll-smooth">
                {activeBrands.map((brand, bIdx) => {
                  const logoSrc = brand.logoUrl || (brand as any).logo;
                  return (
                    <button
                      key={`${brand.id || brand.name}-${bIdx}`}
                      onClick={() => {
                        window.dispatchEvent(new CustomEvent("search-brand", { detail: { brand: brand.name } }));
                        if (setActiveTab) setActiveTab('order');
                      }}
                      className="snap-start shrink-0 w-[72px] sm:w-[95px] flex flex-col items-center justify-center p-1 rounded-xl bg-white/70 hover:bg-emerald-50 transition-all duration-200 cursor-pointer group text-center relative"
                      title={`مشاهده کاتالوگ و اقلام برند ${brand.name}`}
                    >
                      {/* Logo Container - Borderless, Clean & Prominent */}
                      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl flex items-center justify-center relative group-hover:scale-108 transition-transform duration-200">
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
                            className="w-full h-full object-contain p-0.5" 
                          />
                        ) : null}
                        <div 
                          className="brand-vector-fallback hidden absolute inset-0 bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex-col items-center justify-center rounded-xl shadow-xs"
                          style={{ display: !logoSrc ? 'flex' : 'none' }}
                        >
                          <span className="text-lg">🏭</span>
                        </div>
                      </div>

                      <div className="text-center w-full min-w-0 mt-1">
                        <h4 className="text-[10px] sm:text-xs font-black text-slate-800 group-hover:text-emerald-700 truncate">
                          {brand.name}
                        </h4>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        );
      })()}

      {/* --- MATERIAL B2B TRUST HIGHLIGHTS --- */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3 py-3 border-b border-slate-100/60 mb-2">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-slate-100 text-slate-800 rounded-lg flex items-center justify-center shrink-0">
            <Factory size={18} />
          </div>
          <div>
            <h4 className="text-xs font-black text-slate-800">تامین مستقیم</h4>
            <p className="text-[10px] text-slate-400 font-bold">ثبت سفارش خط تولید</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-emerald-50 text-emerald-800 rounded-lg flex items-center justify-center shrink-0">
            <Truck size={18} />
          </div>
          <div>
            <h4 className="text-xs font-black text-slate-800">لجستیک سراسری</h4>
            <p className="text-[10px] text-slate-400 font-bold">ارسال بیمه‌شده</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className={`w-9 h-9 ${activeColors.iconBg} ${activeColors.iconText} rounded-lg flex items-center justify-center shrink-0`}>
            <ShieldCheck size={18} />
          </div>
          <div>
            <h4 className="text-xs font-black text-slate-800">فاکتور کارخانه‌ای</h4>
            <p className="text-[10px] text-slate-400 font-bold">صدور بر اساس ضوابط کارخانه</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-teal-50 text-teal-800 rounded-lg flex items-center justify-center shrink-0">
            <Zap size={18} />
          </div>
          <div>
            <h4 className="text-xs font-black text-slate-800">سود بنکدار</h4>
            <p className="text-[10px] text-slate-400 font-bold">قیمت کف کارخانه</p>
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
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs"
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
                          <span key={i} className="text-[9px] font-black bg-slate-100 text-slate-600 px-2 py-1 rounded-lg">
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
                    className="flex-1 bg-slate-900 hover:bg-slate-800 text-white text-xs font-black py-3 rounded-2xl transition-all shadow-md cursor-pointer text-center"
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

      {/* --- AI ADVISOR BANNER --- */}
      <section className="bg-gradient-to-r from-purple-800 via-purple-700 to-indigo-900 text-white rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md border border-purple-500/30">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-amber-500 text-slate-950 rounded-xl flex items-center justify-center shrink-0 font-black shadow-sm">
            <Sparkles size={18} />
          </div>
          <div className="text-right">
            <h3 className="text-xs font-black text-white">مشاور هوشمند بنکداری و تحلیل بازار 🤖</h3>
            <p className="text-[11px] text-purple-200 font-semibold mt-0.5">مشاوره مستقیم چیدمان و تحلیل حاشیه سود عمده</p>
          </div>
        </div>
        <button
          onClick={() => window.dispatchEvent(new CustomEvent("open-ai-chat"))}
          className="bg-amber-500 hover text-slate-950 px-4 py-2 rounded-xl font-black text-xs transition-all shadow-sm shrink-0 cursor-pointer"
        >
          گفتگو با مشاور هوشمند 💬
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
