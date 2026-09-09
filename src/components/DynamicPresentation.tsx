import { useState, useEffect, useRef, useMemo } from "react";
import { DigitalEcoTree } from "./DigitalEcoTree";
// import { SupplyChainLifecycleAnimation } from "./SupplyChainLifecycleAnimation";
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
  ChevronDown,
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
import SpecialOffersSection from "./SpecialOffersSection";
import BestsellersSection from "./BestsellersSection";
import MagazineSection from "./MagazineSection";
import { ReferralRewardModal } from "./ReferralRewardModal";
// import EngagementHub from "./EngagementHub";
import ImageLightbox from "./ImageLightbox";
import { VoiceSearchButton } from "./VoiceSearchButton";
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
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState("");
  const [copiedCoupon, setCopiedCoupon] = useState(false);
  const [isReferralOpen, setIsReferralOpen] = useState(false);
  const [isCustomerJourneyOpen, setIsCustomerJourneyOpen] = useState(false);
  const [showcaseTab, setShowcaseTab] = useState<'all' | 'products' | 'raw_materials'>('all');
  const [activeStep, setActiveStep] = useState(0);
  const [simulateCartons, setSimulateCartons] = useState(50);
  const [showGuideStepper, setShowGuideStepper] = useState(false);
  const [expandedGroup, setExpandedGroup] = useState<string | null>("food");

  const showcaseScrollRef = useRef<HTMLDivElement>(null);

  const [showAllCategories, setShowAllCategories] = useState(false);

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

  // Filter products flexibly by category name, keywords, product name or tags
  const isCategoryMatch = (p: Product, selectedCat: string) => {
    if (selectedCat === "همه" || !selectedCat) return true;
    const normS = selectedCat.trim().toLowerCase();
    const normP = (p.category || "").trim().toLowerCase();
    const normN = (p.name || "").trim().toLowerCase();
    const normB = (p.brand || "").trim().toLowerCase();

    if (normP === normS || normP.includes(normS) || normS.includes(normP)) return true;
    if (normN.includes(normS) || normB.includes(normS)) return true;

    // Split category into keywords (e.g. "روغن و چاشنی" -> ["روغن", "چاشنی"])
    const keywords = normS.split(/[\s,،و-]+/).filter(k => k.length >= 3);
    for (const kw of keywords) {
      if (normP.includes(kw) || normN.includes(kw) || normB.includes(kw)) {
        return true;
      }
    }

    if ((p as any).tags && Array.isArray((p as any).tags)) {
      if ((p as any).tags.some((t: string) => {
        const normT = typeof t === 'string' ? t.toLowerCase() : '';
        return normT.includes(normS) || normS.includes(normT) || keywords.some(kw => normT.includes(kw));
      })) {
        return true;
      }
    }

    return false;
  };

  const filteredProducts = useMemo(() => {
    const list = products.filter((p) => {
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

    // Priority Sort: Special / Featured / Floor Market items ALWAYS COME FIRST
    return list.sort((a, b) => {
      const aIsSpecial = (a as any).isSpecial || a.isFeatured || (a as any).isFloorMarket || (a as any).isKafBazar ? 1 : 0;
      const bIsSpecial = (b as any).isSpecial || b.isFeatured || (b as any).isFloorMarket || (b as any).isKafBazar ? 1 : 0;
      if (aIsSpecial !== bIsSpecial) return bIsSpecial - aIsSpecial;
      return 0;
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
      gradientTo: "to-emerald-500/10",
      btnBg: "from-emerald-500 to-emerald-700 hover:from-emerald-600 hover:to-emerald-900",
      btnBorder: "border-indigo-400",
      btnTextLight: "text-emerald-100",
      iconBg: "bg-emerald-50",
      iconText: "text-emerald-700",
      categorySelectedBg: "bg-emerald-700 text-white border-emerald-700 shadow-emerald-700/20",
      categorySelectedBorder: "border-emerald-700",
      catalogBtnBg: "bg-emerald-700 hover:bg-emerald-900",
      brandIconText: "text-emerald-700"
    },
    amber: {
      gradientTo: "to-emerald-500/10",
      btnBg: "from-emerald-500 to-amber-700 hover:from-emerald-600 hover:to-amber-800",
      btnBorder: "border-amber-400",
      btnTextLight: "text-emerald-100",
      iconBg: "bg-emerald-50",
      iconText: "text-amber-700",
      categorySelectedBg: "bg-amber-700 text-white border-amber-700 shadow-amber-700/20",
      categorySelectedBorder: "border-amber-700",
      catalogBtnBg: "bg-amber-700 hover:bg-amber-800",
      brandIconText: "text-amber-700"
    },
    sky: {
      gradientTo: "to-emerald-500/10",
      btnBg: "from-emerald-500 to-sky-700 hover:from-emerald-600 hover:to-sky-800",
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
    const isRaw = isRawMaterial(product);
    
    // Use the central pricing utility for consistent role-based prices
    const rolePricing = getProductRolePricing(product, user, userBadge as any);
    const displayPrice = rolePricing.unitWholesalePrice;
    const profitMargin = rolePricing.profitMarginPercent;

    const handleImageClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      setPreviewImage(getDisplayImageUrl(product.image_url));
      setPreviewTitle(product.name);
    };

    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, delay: idx * 0.05 }}
        className="bg-white rounded-2xl border border-slate-100 p-3 shadow-sm hover:shadow-xl hover:border-emerald-200 transition-all group flex items-center gap-4 cursor-pointer relative"
        onClick={() => onViewDetails?.(product)}
      >
        <div 
          onClick={handleImageClick}
          className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-xl overflow-hidden flex items-center justify-center shrink-0 bg-slate-50 border border-slate-100/50 cursor-zoom-in"
        >
          <img
            key={`${product.id}-img-${product.image_url}`}
            src={getDisplayImageUrl(product.image_url)}
            alt={product.name}
            referrerPolicy="no-referrer"
            className="w-full h-full object-contain p-2 group-hover:scale-110 transition-transform duration-700"
          />
          <div className="absolute top-1.5 right-1.5">
            <span className={`px-2 py-0.5 rounded-md text-[8px] font-black text-white shadow-sm ${isRaw ? 'bg-emerald-600' : 'bg-emerald-600'}`}>
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
              className="w-9 h-9 bg-emerald-600 text-white rounded-full flex items-center justify-center hover:bg-emerald-700 hover:shadow-md transition-all duration-200 active:scale-[0.88] shadow-sm cursor-pointer"
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

  // Auto-scroll effect for showcase products
  useEffect(() => {
    const scrollContainer = showcaseScrollRef.current;
    if (!scrollContainer || showcaseProducts.length <= 1) return;
    
    let intervalId: any;
    
    const startAutoScroll = () => {
      intervalId = setInterval(() => {
        const { scrollLeft, scrollWidth, clientWidth } = scrollContainer;
        // In RTL, scrollLeft is 0 at the rightmost and negative as you scroll left
        // However, behavior can vary. A safer way is to check if we can scroll more.
        
        const isAtEnd = Math.abs(scrollLeft) + clientWidth >= scrollWidth - 10;
        
        if (isAtEnd) {
          scrollContainer.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          scrollContainer.scrollBy({ left: -320, behavior: 'smooth' });
        }
      }, 3500);
    };

    startAutoScroll();

    const handleMouseEnter = () => clearInterval(intervalId);
    const handleMouseLeave = () => startAutoScroll();

    scrollContainer.addEventListener('mouseenter', handleMouseEnter);
    scrollContainer.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      clearInterval(intervalId);
      scrollContainer.removeEventListener('mouseenter', handleMouseEnter);
      scrollContainer.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [showcaseProducts]);

  const rubikaUrl = "https://rubika.ir/dastavval_com";
  const telegramUrl = (b2bConfig as any)?.telegramChannelUrl || "https://t.me/dastavval_com";
  const whatsappUrl = (b2bConfig as any)?.whatsappGroupUrl || "https://chat.whatsapp.com/dastavval_com";
  const instagramUrl = (b2bConfig as any)?.instagramPageUrl || "https://instagram.com/dastavval_com";

  return (
    <div className="space-y-6 py-1 text-right" dir="rtl">
      
      {/* --- REVOLUTIONARY FACTORY HERO POWERHOUSE (CONNECTED DIRECTLY TO REAL DATABASE PRODUCTS) --- */}
      <FactoryHeroPowerhouse 
        products={products}
        user={user}
        userBadge={userBadge}
        b2bConfig={b2bConfig}
        onOrderClick={() => setActiveTab?.('order')}
        onFactoryClick={() => setActiveTab?.('factories')}
        onBillboardClick={() => setActiveTab?.('billboard')}
        onAgencyClick={() => setActiveTab?.('agency')}
        onAddToCart={onAddToCart}
      />

      {/* --- 3-PILLAR SMART USER GATEWAY HUB (AUTOMATICALLY HIDDEN IF USER IS LOGGED IN) --- */}
      <UserGatewayHub 
        user={user}
        onSelectBuyer={() => setActiveTab?.('order')}
        onSelectAgency={() => setActiveTab?.('agency')}
        onSelectFactory={() => setActiveTab?.('factories')}
        onSelectLeader={() => {
          // Open Auth modal with leader role pre-selected if possible, or just set role and open
          window.dispatchEvent(new CustomEvent('open-auth-with-role', { detail: { role: 'leader' } }));
        }}
        onSelectAdPoster={() => {
          window.dispatchEvent(new CustomEvent('open-auth-with-role', { detail: { role: 'ad_poster' } }));
        }}
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

      {/* --- QUICK CHANNELS & SIMPLE DIRECT CATALOG DOWNLOAD (HIGH ACCESSIBILITY BANNER) --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4" dir="rtl">
        {/* Box 1: Rubika Official Channel Announcement */}
        <div className="bg-white border border-slate-200/80 hover:border-purple-200 rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-2xs transition-all">
          <div className="space-y-2 mb-4">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-purple-50 text-purple-800 border border-purple-200/50 text-[10.5px] font-black">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-600"></span>
              </span>
              <span>عضویت در اطلاع‌رسانی رسمی</span>
            </div>
            <h3 className="text-xs sm:text-sm font-black text-slate-900 flex items-center gap-2">
              <span className="text-base">📢</span>
              <span>کانال روبیکا بازرگانی دست اول</span>
            </h3>
            <p className="text-[11px] text-slate-500 font-bold leading-relaxed">
              جدیدترین موجودی انبارها، زمان‌بندی دقیق تخلیه بار کارخانه‌ها، جشنواره‌های تخفیف فوق‌العاده و پاسخگویی آنلاین در پیام‌رسان روبیکا.
            </p>
          </div>
          <a
            href={rubikaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-700 text-white text-xs font-black rounded-xl text-center transition-all flex items-center justify-center gap-2 cursor-pointer shadow-3xs hover:shadow-sm active:scale-98"
          >
            <Send size={14} className="rotate-180" />
            <span>ورود به کانال روبیکا</span>
          </a>
        </div>

        {/* Box 2: Direct Interactive Catalog Download (Representative vs. Customer) */}
        <div className="bg-white border border-slate-200/80 hover:border-emerald-200 rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-2xs transition-all">
          <div className="space-y-2 mb-4">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200/50 text-[10.5px] font-black">
              <span>📋 دانلود فوری لیست قیمت</span>
            </div>
            <h3 className="text-xs sm:text-sm font-black text-slate-900 flex items-center gap-2">
              <span className="text-base">📥</span>
              <span>دانلود کاتالوگ جامع و لیست قیمت محصولات</span>
            </h3>
            <p className="text-[11px] text-slate-500 font-bold leading-relaxed">
              لطفاً نوع قیمت‌گذاری کاتالوگ مورد نیاز خود را جهت دانلود و پرینت مستقیم انتخاب کنید:
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {/* Representative Pricing (Catalog Floor Price) */}
            <button
              onClick={() => {
                window.dispatchEvent(new CustomEvent("open-catalog-modal", { detail: { markup: 0, autoPrint: true } }));
              }}
              className="py-3 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl text-center transition-all flex flex-col items-center justify-center gap-1 cursor-pointer shadow-3xs hover:shadow-sm active:scale-98 border border-emerald-500"
            >
              <div className="flex items-center gap-1.5">
                <Download size={13} />
                <span>قیمت نمایندگی (کف کارخانه)</span>
              </div>
              <span className="text-[9px] text-emerald-100 font-medium">مخصوص خرید کارتنی و تناژ بالا</span>
            </button>

            {/* Customer/Wholesale Pricing (With standard B2B markup) */}
            <button
              onClick={() => {
                const markup = b2bConfig?.customerMarkupPercent || 20;
                window.dispatchEvent(new CustomEvent("open-catalog-modal", { detail: { markup: markup, autoPrint: true } }));
              }}
              className="py-3 px-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-black rounded-xl text-center transition-all flex flex-col items-center justify-center gap-1 cursor-pointer shadow-3xs hover:shadow-sm active:scale-98 border border-slate-800"
            >
              <div className="flex items-center gap-1.5">
                <Download size={13} />
                <span>قیمت همکار و مشتری عمومی</span>
              </div>
              <span className="text-[9px] text-slate-300 font-medium">مخصوص مغازه‌داران و خریدهای خرد</span>
            </button>
          </div>
        </div>
      </div>

      {/* --- PROMINENT PURE-WHITE SYSTEM GUIDE & TRAINING CALLOUT (HIGH VISIBILITY FOR ALL USERS) --- */}
      <section className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-4 text-right" dir="rtl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-600 text-white border border-emerald-200 text-[10px] font-black">
              <GraduationCap size={13} />
              <span>راهنمای خرید و عاملیت</span>
            </div>
            <h2 className="text-xs sm:text-sm font-black text-slate-900">
              چگونه در دست اول خرید کنیم یا نماینده شویم؟
            </h2>
            <p className="text-[11px] text-slate-500 font-bold leading-relaxed">
              آموزش ۴ مرحله اصلی: سفارش کارتنی، تسویه امانی، باربری و عاملیت
            </p>
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-auto shrink-0">
            <button
              onClick={() => setShowGuideStepper(!showGuideStepper)}
              className="flex-1 sm:flex-none px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-[11px] font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-emerald-200/80"
            >
              <span>{showGuideStepper ? "بستن شبیه‌ساز" : "مشاهده شبیه‌ساز ۴ مرحله‌ای"}</span>
              <ChevronDown size={13} className={`transition-transform duration-200 ${showGuideStepper ? "rotate-180" : ""}`} />
            </button>
            <button
              onClick={() => setActiveTab?.('learning')}
              className="flex-1 sm:flex-none px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[11px] font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-3xs"
            >
              <BookOpen size={13} />
              <span>آموزش کامل</span>
              <ArrowLeft size={12} />
            </button>
          </div>
        </div>

        {/* Interactive Steps Stepper (Expandable) */}
        {showGuideStepper && (
          <div className="space-y-4 pt-3 border-t border-slate-100 animate-fade-in">
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
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-600 text-white border border-emerald-100 text-[10px] font-black">
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
                    <div className="mx-auto w-10 h-10 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 text-lg shadow-2xs">
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
                        <div className="text-[9px] font-black text-emerald-600 mt-0.5">✓ استعلام آنی صادرکننده</div>
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
                      <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">بارنامه دولتی</span>
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
                        { name: "برنز", val: "۰٪", color: "text-amber-700 bg-emerald-50 border-emerald-200" },
                        { name: "نقره", val: "۱.۵٪", color: "text-slate-500 bg-slate-50 border-slate-200" },
                        { name: "طلا", val: "۲.۵٪", color: "text-emerald-500 bg-emerald-50/50 border-amber-300" },
                        { name: "VIP 👑", val: "۴٪ + انحصار", color: "text-purple-600 bg-purple-50 border-purple-200 font-bold" }
                      ].map((lvl, idx) => (
                        <div 
                          key={`rank-lvl-${lvl.name}-${idx}`} 
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
        )}
      </section>

      {/* --- NEW PRODUCTS AND RAW MATERIALS SHOWCASE SECTION --- */}
      <section className="bg-white rounded-[2.5rem] p-6 border border-slate-100 shadow-2xl shadow-slate-200/50 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100/80">
          <div className="space-y-1">
            <h2 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2.5">
              <div className="w-10 h-10 bg-linear-to-tr from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
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
          <div className="relative group/showcase">
            <div
              ref={showcaseScrollRef}
              className="flex items-stretch gap-4 overflow-x-auto pb-4 pt-1 px-1 snap-x snap-mandatory scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
              style={{ WebkitOverflowScrolling: "touch" }}
            >
              {showcaseProducts.map((product, idx) => (
                <div 
                  key={`showcase-grid-${product.id}-${idx}`} 
                  className="snap-start shrink-0 w-[285px] xs:w-[315px] sm:w-[340px]"
                >
                  <CompactShowcaseCard 
                    product={product} 
                    idx={idx} 
                    onViewDetails={onViewDetails} 
                    onAddToCart={onAddToCart}
                    toPersianNum={toPersianNum}
                  />
                </div>
              ))}
            </div>
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

      {/* --- DYNAMIC CATEGORY SYSTEM - COMPACT & SEARCHABLE --- */}
      <section className="space-y-4 pt-2" dir="rtl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-1">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center border border-emerald-100 shadow-sm">
              <Grid size={18} />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black text-slate-900">ویترین دسته‌بندی‌ها</h2>
              <p className="text-[10px] text-slate-400 font-bold">دسترسی مستقیم به خطوط تامین و تولید</p>
            </div>
          </div>
          
          {/* Quick Search Categories */}
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input 
              type="text"
              placeholder="جستجوی سریع دسته..."
              onChange={(e) => {
                const term = e.target.value.toLowerCase();
                // We'll filter the visible grid based on this
                const items = document.querySelectorAll('.category-grid-item');
                items.forEach((item: any) => {
                  const label = item.getAttribute('data-label')?.toLowerCase() || "";
                  if (label.includes(term)) {
                    item.style.display = 'flex';
                  } else {
                    item.style.display = 'none';
                  }
                });
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pr-9 pl-3 text-[11px] font-bold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-8 gap-2 sm:gap-3">
          {categoriesList.slice(0, showAllCategories ? categoriesList.length : 6).map((cat, catIdx) => {
            const rawMatchingCount = cat.id === "همه" 
              ? products.length 
              : products.filter(p => isCategoryMatch(p, cat.id)).length;
            const itemCount = cat.id === "همه" 
              ? products.length 
              : (rawMatchingCount > 0 ? rawMatchingCount : Math.max(2, Math.round(products.length / (categoriesList.length || 1))));
            const isSelected = selectedCategory === cat.id;

            return (
              <motion.button
                key={`cat-grid-real-${cat.id}-${catIdx}`}
                data-label={cat.label}
                whileHover={{ y: -2, scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  const targetCat = cat.id === "همه" ? "همه" : cat.id;
                  setSelectedCategory(targetCat);
                  if (setActiveCategory) setActiveCategory(targetCat);
                }}
                className={`category-grid-item flex flex-col items-center justify-center p-2 rounded-2xl h-[92px] transition-all duration-300 cursor-pointer border relative overflow-hidden group/cat ${
                  isSelected
                    ? "bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-600/20"
                    : "bg-white text-slate-800 border-slate-100 hover:border-emerald-200 hover:shadow-sm"
                }`}
              >
                {/* Subtle Visual Background */}
                <div className="absolute inset-0 opacity-[0.02] pointer-events-none">
                  <img src={cat.image || getCategoryImage(cat.id)} alt="" className="w-full h-full object-cover" />
                </div>

                <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xl mb-1.5 transition-all duration-500 ${
                  isSelected 
                    ? "bg-white/20 text-white" 
                    : "bg-slate-50 text-slate-600 group-hover/cat:bg-emerald-50 group-hover/cat:text-emerald-600"
                }`}>
                  {cat.icon || "📦"}
                </div>

                <div className="text-center space-y-0.5 relative z-10 w-full px-1">
                  <h3 className={`text-[9px] font-black leading-tight truncate ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                    {cat.label}
                  </h3>
                  <div className={`text-[8px] font-bold inline-flex items-center gap-0.5 ${
                    isSelected ? "text-emerald-50" : "text-slate-400"
                  }`}>
                    <span>{toPersianNum(itemCount)}</span>
                    <span>کالا</span>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>

        {categoriesList.length > 6 && (
          <div className="flex justify-center pt-1">
            <button 
              onClick={() => setShowAllCategories(!showAllCategories)}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-black transition-all border border-slate-200/50 cursor-pointer"
            >
              <span>{showAllCategories ? "بستن لیست" : `مشاهده ${toPersianNum(categoriesList.length - 6)} دسته دیگر`}</span>
              <ChevronLeft size={12} className={`transition-transform duration-300 ${showAllCategories ? 'rotate-90' : '-rotate-90'}`} />
            </button>
          </div>
        )}
      </section>

      {/* --- WEEKLY SALES SCHEDULE ATTRACTION BANNER --- */}
      <section className="mb-6">
        <div className="relative overflow-hidden rounded-3xl bg-white text-slate-800 p-6 sm:p-8 border border-slate-200/80 shadow-md">
          <div className="absolute top-0 left-0 -mt-8 -ml-8 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 right-0 -mb-8 -mr-8 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl text-right">
              <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-800 border border-emerald-200/60 px-3 py-1.5 rounded-full text-xs font-black">
                <Sparkles size={14} className="text-emerald-600 animate-pulse" />
                <span>برنامه فروش هفتگی کارخانجات و تخفیف‌های تناژ</span>
              </div>

              <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 leading-tight">
                حراج استثنایی کارخانجات در برنامه فروش هفتگی دست اول
              </h2>

              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed font-bold">
                هر روز هفته تخفیف‌های مازاد برای دسته‌بندی‌های خاص تنقلات، شوینده، کنسرو، لبنیات و نوشیدنی‌ها! حاشیه سود بنکداری و پخش خود را حداکثر کنید.
              </p>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto shrink-0">
              {setActiveTab && (
                <button
                  onClick={() => setActiveTab('weekly-schedule')}
                  className="w-full md:w-auto px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm rounded-2xl flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-600/10 hover:shadow-lg hover:shadow-emerald-600/20 active:scale-95 cursor-pointer"
                >
                  <Zap size={18} className="fill-current" />
                  <span>مشاهده برنامه و جدول تخفیف‌های هفتگی</span>
                  <ArrowLeft size={16} />
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* --- 1. SPECIAL OFFERS & FLASH PROMOTIONS SECTION --- */}
      <SpecialOffersSection
        products={products}
        b2bConfig={b2bConfig}
        user={user}
        userBadge={userBadge}
        onAddToCart={onAddToCart}
        onViewDetails={onViewDetails}
        setActiveTab={setActiveTab}
        userRole={user?.role || userBadge || 'customer'}
      />

      {/* --- 2. BESTSELLERS & TOP VOLUME WHOLESALES SECTION --- */}
      <BestsellersSection
        products={products}
        b2bConfig={b2bConfig}
        user={user}
        userBadge={userBadge}
        onAddToCart={onAddToCart}
        onViewDetails={onViewDetails}
        setActiveTab={setActiveTab}
        userRole={user?.role || userBadge || 'customer'}
      />

      {/* --- SMART B2B SEARCH & FEATURED PRODUCTS --- */}

      <section className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/70 pb-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 flex items-center justify-center shrink-0">
              <Store size={20} className="text-emerald-600" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900">
                خرید عمده مستقیم از کارخانه
              </h2>
              <p className="text-[10px] text-slate-500 font-bold mt-0.5">
                تامین مستقیم از خطوط تولید با قیمت مصوب
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
              placeholder="جستجوی کالا، برند یا کارخانه..."
              className="w-full py-3 pr-10 pl-14 bg-white border border-slate-200 group-hover:border-emerald-300 focus:border-emerald-500 rounded-2xl text-xs font-bold outline-none text-slate-900 text-right shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)] transition-all"
            />
            <div className="absolute inset-y-0 left-0 pl-2 flex items-center gap-1">
              <VoiceSearchButton onResult={(text) => setSearchQuery(text)} />
              {searchQuery ? (
                <button
                  onClick={() => setSearchQuery("")}
                  className="flex items-center text-slate-400 hover:text-red-500 transition-colors p-1.5"
                >
                  <X size={14} />
                </button>
              ) : (
                <div className="flex items-center pointer-events-none text-slate-300 p-1.5">
                  <Search size={14} />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Products Grid (Max 8) - Horizontal scroll */}
        {featuredDisplayProducts.length > 0 ? (
          <div className="relative group/feat">
            <div
              className="flex items-stretch gap-4 overflow-x-auto pb-4 pt-1 px-1 snap-x snap-mandatory scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
              style={{ WebkitOverflowScrolling: "touch" }}
            >
              {featuredDisplayProducts.map((p, idx) => (
                <div 
                  key={`feat-prod-${p.id || 'item'}-${idx}`} 
                  className="snap-start shrink-0 w-[240px] sm:w-[280px]"
                >
                  <ProductCard
                    index={idx}
                    product={p}
                    onViewDetails={onViewDetails}
                    onAddToCart={(prod, qty) => {
                      if (onAddToCart) onAddToCart(prod, qty);
                    }}
                  />
                </div>
              ))}
            </div>
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

      {/* --- 3 HIGH-IMPACT COMPACT & ANIMATED ACTION BUTTONS --- */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-4 border-b border-slate-100/60 my-2">
        {/* Button 1: Wholesale Orders */}
        <motion.button
          whileHover={{ y: -2, scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setActiveTab?.('order')}
          className="group relative overflow-hidden bg-white border border-slate-100 hover:border-emerald-200 text-slate-800 p-3 rounded-2xl flex items-center justify-between gap-2 transition-all duration-300 cursor-pointer shadow-material-sm hover:shadow-material-lg"
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
          className="group relative overflow-hidden bg-white border border-slate-100 hover:border-emerald-200 text-slate-800 p-3 rounded-2xl flex items-center justify-between gap-2 transition-all duration-300 cursor-pointer shadow-material-sm hover:shadow-material-lg"
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

        {/* Button 3: Factories & Direct Brands */}
        <motion.button
          whileHover={{ y: -2, scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            setActiveTab?.('factories');
          }}
          className="group relative overflow-hidden bg-white border border-slate-100 hover:border-emerald-200 text-slate-800 p-3 rounded-2xl flex items-center justify-between gap-2 transition-all duration-300 cursor-pointer shadow-material-sm hover:shadow-material-lg"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 group-hover:scale-105 group-hover:bg-emerald-500 group-hover:text-white transition-all shrink-0">
              <Building2 size={18} />
            </div>
            <span className="font-black text-xs sm:text-sm text-slate-900 group-hover:text-amber-700 transition-colors whitespace-nowrap truncate">
              تولیدکنندگان
            </span>
          </div>
          <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-400 group-hover:bg-emerald-500 group-hover:text-white flex items-center justify-center text-xs font-bold transition-all shrink-0">
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
          className="w-full bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-700 hover:from-emerald-600 hover:to-teal-800 text-white rounded-2xl p-3 sm:p-3.5 flex items-center justify-between gap-3 shadow-sm hover:shadow-md cursor-pointer border border-amber-300/40 relative overflow-hidden transition-all"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shrink-0 border border-white/30 shadow-xs">
              <Gift size={20} className="animate-pulse" />
            </div>
            <div className="text-right min-w-0">
              <div className="font-black text-xs sm:text-sm text-white flex items-center gap-2 truncate">
                <span>پاداش دعوت از همکاران صنف عمده‌فروشی</span>
                <span className="bg-amber-300 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-md hidden sm:inline-block shadow-2xs">
                  ویژه همکاران
                </span>
              </div>
              <div className="text-[10.5px] text-emerald-100 font-bold truncate mt-0.5 flex items-center gap-1.5">
                <Coins size={12} className="text-emerald-200 shrink-0" />
                <span>۱ میلیون تومان پاداش هدیه + ۵٪ تخفیف خرید اول همکار</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white/20 hover:bg-white/30 border border-white/30 px-3.5 py-1.5 rounded-xl text-xs font-black shrink-0 flex items-center gap-1.5 transition-all shadow-2xs">
            <span>دریافت پاداش</span>
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
            .filter(b => !isWarehouseBrand(b))
            .filter(b => {
              const brandName = b.toString().trim().toLowerCase();
              const configMatch = (b2bConfig?.factories as any[])?.find((f: any) => {
                const fName = (f.name || "").toString().trim().toLowerCase();
                return fName === brandName || fName.includes(brandName) || brandName.includes(fName);
              });
              return configMatch ? (configMatch as any).isActive !== false : true;
            });

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

        const configFactories = rawFactoriesList
          .filter((f: any) => f && f.isActive !== false)
          .map((f: any, idx: number) => ({
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
                <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center border border-emerald-100 shadow-2xs shrink-0">
                  <Building2 size={20} className="text-emerald-700" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xs sm:text-sm md:text-base font-black text-slate-900">
                      تولیدکنندگان مستقیم
                    </h2>
                    <span className="text-[9px] font-black bg-emerald-100/70 text-emerald-900 px-2 py-0.5 rounded-md border border-emerald-200 whitespace-nowrap">
                      قیمت مصوب خط تولید
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                    تامین مستقیم و بدون واسطه از کارخانه‌های سراسر کشور
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
                      setActiveTab('competition');
                    }
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition-all flex items-center gap-1.5 shadow-md cursor-pointer border border-emerald-500/50"
                >
                  <Award size={13} className="fill-white text-white animate-bounce" />
                  <span className="text-white">لیگ رقابتی برترین‌ها 🏆</span>
                </button>
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
                        <span className="text-[9.5px] font-black bg-emerald-600 text-white border border-emerald-200/80 px-2.5 py-0.5 rounded-lg">
                          {factory.category}
                        </span>
                        <div className="flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200/60 text-amber-700 text-[10px] font-black">
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

      {/* Official Social Channels section has been removed as requested by the user */}

      {/* --- PARTNER BRANDS STRIP: Revolutionary Creative White Design --- */}
      {(() => {
        const activeBrands = (b2bConfig?.factories && b2bConfig.factories.length > 0 
          ? b2bConfig.factories
              .filter(f => f.isActive !== false && f.logoUrl)
              .map(f => ({
                id: f.id,
                name: f.name,
                logoUrl: f.logoUrl,
                description: f.description || f.factoryDescription || "",
                type: "واحد تولیدی فعال"
              }))
          : []).filter(b => b && b.name && !isWarehouseBrand(b.name));

        if (activeBrands.length === 0) return null;

        return (
          <section className="relative py-12 overflow-hidden bg-white rounded-[3rem] border border-slate-100 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.04)] mb-4">
            {/* Background Decorative Elements */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden opacity-40">
              <div className="absolute -top-24 -left-24 w-96 h-96 bg-emerald-50 rounded-full blur-3xl" />
              <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-amber-50 rounded-full blur-3xl" />
            </div>

            <div className="relative z-10 px-8 mb-10 text-center space-y-2">
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-widest border border-emerald-100 mb-2"
              >
                <Award size={14} />
                <span>Verified Official Production Hubs</span>
              </motion.div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                برندهای رسمی و <span className="text-emerald-600">تامین‌کنندگان برتر</span> سامانه
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 font-bold max-w-2xl mx-auto leading-relaxed">
                دسترسی مستقیم و بدون واسطه به خطوط تولید کارخانجات بزرگ کشور با تضمین قیمت پایه و اصالت کالا
              </p>
            </div>

            <div className="relative">
              {/* Seamless Scrolling Marquee Effect or Grid */}
              <div className="flex flex-nowrap overflow-x-auto gap-8 px-8 pb-10 no-scrollbar scroll-smooth snap-x snap-mandatory" dir="rtl">
                {activeBrands.map((brand, bIdx) => (
                  <motion.button
                    key={`${brand.id || brand.name}-${bIdx}`}
                    whileHover={{ y: -8 }}
                    onClick={() => {
                      window.dispatchEvent(new CustomEvent("search-brand", { detail: { brand: brand.name } }));
                      if (setActiveTab) setActiveTab('order');
                    }}
                    className="snap-start shrink-0 w-52 sm:w-64 h-20 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg hover:border-emerald-200 transition-all duration-500 group flex items-center p-3 text-right relative overflow-hidden"
                  >
                    {/* Horizontal Layout: Logo on the right, Name on the left (RTL) */}
                    <div className="flex items-center gap-3 w-full">
                      {/* Brand Logo - Rectangular/Square Box */}
                      <div className="w-14 h-14 rounded-xl bg-slate-50 border border-slate-100/50 flex items-center justify-center p-2 group-hover:bg-white transition-colors overflow-hidden shrink-0">
                        {brand.logoUrl ? (
                          <img 
                            src={brand.logoUrl} 
                            alt={brand.name} 
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-700" 
                          />
                        ) : (
                          <Building2 size={20} className="text-slate-200" strokeWidth={1.5} />
                        )}
                      </div>
                      
                      {/* Brand Name and Small Info */}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-[11px] sm:text-xs font-black text-slate-900 group-hover:text-emerald-700 transition-colors truncate leading-tight">
                          {brand.name}
                        </h4>
                        <div className="flex items-center gap-1 mt-1">
                          <div className="w-1 h-1 rounded-full bg-emerald-500" />
                          <span className="text-[9px] font-black text-slate-400">تامین مستقیم</span>
                        </div>
                      </div>

                      {/* Small Arrow Indicator on Hover */}
                      <div className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                        <ArrowLeft size={14} className="text-emerald-500" />
                      </div>
                    </div>
                  </motion.button>
                ))}
                
                {/* View All Factories Card - Compact Horizontal */}
                <motion.button
                  whileHover={{ x: -5 }}
                  onClick={() => setActiveTab?.('factories')}
                  className="snap-start shrink-0 w-44 sm:w-52 h-20 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center p-4 text-center gap-3 hover:border-emerald-500 hover:bg-emerald-50 transition-all cursor-pointer"
                >
                  <Layers size={18} className="text-slate-400" />
                  <span className="text-[11px] font-black text-slate-600 whitespace-nowrap">مشاهده همه برندها</span>
                </motion.button>
              </div>
            </div>
          </section>
        );
      })()}

      {/* --- COMPACT CREATIVE B2B TRUST HIGHLIGHTS (ULTRA-SHORT & BEAUTIFUL) --- */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3 py-6 px-1">
        {[
          { title: "تامین مستقیم", subtitle: "ارسال از درب کارخانه", icon: Factory, color: "emerald", gradient: "from-emerald-50 to-emerald-100/50" },
          { title: "فاکتور رسمی", subtitle: "۱۰۰٪ اصالت کالا", icon: ShieldCheck, color: "blue", gradient: "from-blue-50 to-blue-100/50" },
          { title: "لجستیک سریع", subtitle: "بیمه‌نامه سراسری", icon: Truck, color: "purple", gradient: "from-purple-50 to-purple-100/50" },
          { title: "کف قیمت", subtitle: "نرخ مصوب کارخانه", icon: TrendingUp, color: "amber", gradient: "from-amber-50 to-amber-100/50" }
        ].map((item, i) => (
          <div 
            key={i}
            className={`flex items-center gap-3 p-3 rounded-2xl bg-white border border-slate-100 shadow-sm hover:border-emerald-200 transition-all group cursor-default relative overflow-hidden`}
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-0 group-hover:opacity-100 transition-opacity`} />
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 relative z-10 transition-transform group-hover:scale-110 ${
              item.color === 'emerald' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' :
              item.color === 'blue' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' :
              item.color === 'purple' ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20' :
              'bg-amber-600 text-white shadow-lg shadow-amber-600/20'
            }`}>
              <item.icon size={20} />
            </div>
            <div className="min-w-0 flex flex-col justify-center relative z-10">
              <h4 className="text-[12px] font-black text-slate-900 leading-tight truncate">{item.title}</h4>
              <p className="text-[9px] text-slate-400 font-bold leading-tight truncate mt-1">{item.subtitle}</p>
            </div>
          </div>
        ))}
      </section>

      {/* Image Lightbox */}
      <ImageLightbox 
        isOpen={!!previewImage}
        onClose={() => setPreviewImage(null)}
        imageUrl={previewImage}
        title={previewTitle}
        subtitle="پیش‌نمایش تصویر محصول"
      />

      {/* FACTORY DETAIL MODAL */}
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

      {/* --- AI ADVISOR BANNER --- */}
      <section className="bg-white text-slate-900 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-3.5 shadow-sm border border-slate-200/90">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-600 text-white rounded-xl flex items-center justify-center shrink-0 font-black shadow-xs">
            <BrainCircuit size={20} className="animate-pulse" />
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2">
              <h3 className="text-xs sm:text-sm font-black text-slate-900 font-sans">تحلیل سود و هزینه حمل جاده‌ای</h3>
              <span className="text-[9px] font-black bg-emerald-600 text-white px-2 py-0.5 rounded border border-emerald-100 whitespace-nowrap">
                برخط
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-bold mt-0.5 font-sans">
              محاسبه خودکار کرایه بار، تخفیفات و سود ناخالص سبد کالا
            </p>
          </div>
        </div>
        <button
          onClick={() => window.dispatchEvent(new CustomEvent("open-ai-chat"))}
          className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-black text-xs transition-all shadow-xs shrink-0 cursor-pointer flex items-center justify-center gap-2"
        >
          <MessageSquare size={14} />
          <span>شروع تحلیل سود</span>
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
