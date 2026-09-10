import React, { useState, useEffect, useMemo, useCallback, Suspense } from "react";
import { collection, getDocs, addDoc, serverTimestamp, query, orderBy, doc, updateDoc, setDoc, deleteDoc, db, auth } from "./lib/data-layer";
import { cacheProducts, getCachedProducts, cacheB2bConfig, getCachedB2bConfig } from "./lib/db";
import { Product, OrderItem, Order } from "./types";
import { getDisplayImageUrl } from "./lib/image-utils";
import { ProductImage } from "./components/ProductImage";
import Navbar from "./components/Navbar";
import ProductCard from "./components/ProductCard";
import CatalogDownloadModal from "./components/CatalogDownloadModal";
import AIAdvisor from "./components/AIAdvisor";
import DynamicPresentation from "./components/DynamicPresentation";
import AuthModal from "./components/AuthModal";
import RoleSelectionModal from "./components/RoleSelectionModal";
import AdPosterPanel from "./components/AdPosterPanel";
import AdDetailView from "./components/AdDetailView";
import QuickOrderList from "./components/QuickOrderList";
import NewsSection from "./components/NewsSection";
import ProductComparison from "./components/ProductComparison";
import OnboardingModal from "./components/OnboardingModal";
import FactoryCompetition from "./components/FactoryCompetition";
import SiteRoadmap from "./components/SiteRoadmap";
import { AboutUsSection, ContactSection, TrustSection } from "./components/InfoSections";
import MagazineSection from "./components/MagazineSection";
import { ArticlePageView } from "./components/ArticlePageView";
import OrderSuccessModal from "./components/OrderSuccessModal";
import ProductDetailModal from "./components/ProductDetailModal";
import GapGptAssistant from "./components/GapGptAssistant";
import MultiVendorPanel from "./components/MultiVendorPanel";
import ZarinpalPaymentModal from "./components/ZarinpalPaymentModal";
import DastavvalLogo from "./components/DastavvalLogo";
import SplashScreen from "./components/SplashScreen";
import NetworkStatusWidget from "./components/NetworkStatusWidget";
import TrustBadges from "./components/TrustBadges";
import PublicRepresentatives from "./components/PublicRepresentatives";
import PwaInstallModal from "./components/PwaInstallModal";
import PwaInstallBanner from "./components/PwaInstallBanner";
import OfflineBanner from "./components/OfflineBanner";
import LazyViewport from "./components/LazyViewport";
import { VoiceSearchButton } from "./components/VoiceSearchButton";
import { SmsNewsletterSection } from "./components/SmsNewsletterSection";
import { MASTER_CATEGORIES } from "./data/categoriesData";
import VirtualizedProductGrid from "./components/VirtualizedProductGrid";
import InteractiveProductCarousel from "./components/InteractiveProductCarousel";

import StrictCityProvinceSelector from "./components/StrictCityProvinceSelector";
import { getProvinceForCity, isRepresentativeForCity } from "./utils/dealershipCityTiers";
import { ResilientVault } from "./lib/resilient-storage";
import CheckoutWizard from "./components/CheckoutWizard";
import WholesaleInvoiceView from "./components/WholesaleInvoiceView";
import ChequeCharterModal from "./components/ChequeCharterModal";
import LiveWholesaleMarketTicker from "./components/LiveWholesaleMarketTicker";
import LogisticsEstimatorModal from "./components/LogisticsEstimatorModal";
import QuickMatrixOrderModal from "./components/QuickMatrixOrderModal";
import B2BFloatingActionBar from "./components/B2BFloatingActionBar";
import { getLoyaltySummary } from "./lib/loyalty-store";
import { getUserSession, saveUserSession, clearUserSession } from "./lib/auth-helper";
import { s3PreloadService } from "./lib/s3PreloadService";
import { checkAndSyncAppVersion } from "./lib/smart-version-sync";
import SmartSimplifierHub from "./components/SmartSimplifierHub";

// Resilient lazy loader with auto-retry on dynamic chunk fetch errors
function lazyWithRetry<T extends React.ComponentType<any>>(
  componentImport: () => Promise<any>
) {
  return React.lazy(async () => {
    const pageHasBeenReloaded = sessionStorage.getItem("chunk_reload_attempted");
    try {
      const module = await componentImport();
      sessionStorage.removeItem("chunk_reload_attempted");
      if (module && typeof module === "object" && "default" in module) {
        return { default: module.default };
      }
      if (module && typeof module === "object") {
        const firstExportKey = Object.keys(module)[0];
        return { default: module[firstExportKey] };
      }
      return module;
    } catch (error: any) {
      console.warn("Dynamic chunk loading error encountered, refreshing application assets:", error);
      if (!pageHasBeenReloaded) {
        sessionStorage.setItem("chunk_reload_attempted", "true");
        window.location.reload();
        return new Promise<{ default: T }>(() => {});
      }
      throw error;
    }
  });
}

// Lazy loading heavy view sections with robust chunk reload resilience
const WholesaleCatalogView = lazyWithRetry(() => import("./components/WholesaleCatalogView"));
const B2BNews = lazyWithRetry(() => import("./components/B2BNews"));
const SupportCenter = lazyWithRetry(() => import("./components/SupportCenter"));
const FactoriesView = lazyWithRetry(() => import("./components/FactoriesView"));
const AdminPanel = lazyWithRetry(() => import("./components/AdminPanel"));
const UserPanel = lazyWithRetry(() => import("./components/UserPanel"));
const B2BBusinessDashboard = lazyWithRetry(() => import("./components/B2BBusinessDashboard"));
const AdBoard = lazyWithRetry(() => import("./components/AdBoard"));
const CPanelInstallerWizard = lazyWithRetry(() => import("./components/CPanelInstallerWizard"));
const DealershipRequestView = lazyWithRetry(() => import("./components/DealershipRequestView"));
const B2BProfitSimulator = lazyWithRetry(() => import("./components/B2BProfitSimulator"));
const AgentCatalogView = lazyWithRetry(() => import("./components/AgentCatalogView"));
const WeeklySalesSchedule = lazyWithRetry(() => import("./components/WeeklySalesSchedule"));
const ProductPageView = lazyWithRetry(() => import("./components/ProductPageView"));
const SystemPages = lazyWithRetry(() => import("./components/SystemPages"));
const BarterHall = lazyWithRetry(() => import("./components/BarterHall"));
const SpecialOffersView = lazyWithRetry(() => import("./components/SpecialOffersView"));
const BestsellersView = lazyWithRetry(() => import("./components/BestsellersView"));
import { getBestDiscount } from "./lib/discounts";
import { getApiUrl, isWarehouseBrand } from "./utils/api-utils";
import { recordCRMOrder } from "./lib/crm-helper";
import { registerRegionalOrderFromCheckout } from "./lib/leads-store";
import { getProductRolePricing, toPersianDigits } from "./lib/pricing";
import { motion, AnimatePresence } from "motion/react";
import { X, ShoppingBag, CheckCircle2, Loader2, AlertCircle, Settings, Package, Layers, FileText, Activity, ShieldCheck, MapPin, Phone, Mail, Printer, Grid, List, Sparkles, Building, Building2, Award, MessageSquare, DollarSign, TrendingUp, TrendingDown, Percent, ArrowUpRight, Gift, Percent as PercentIcon, Tag, Download, ChevronRight, ChevronDown, Filter, BrainCircuit, LayoutDashboard, BookOpen, Zap, CreditCard, Receipt, Home, User, Compass, ArrowUp, Upload, Edit2, Trash2, Plus, Check, Palette, Paintbrush, Search, RefreshCw, LayoutGrid, FileJson } from "lucide-react";
import { SectionSkeleton, CatalogSkeleton, TableSkeleton, DashboardSkeleton, ModalSkeleton, CalculatorSkeleton, FadeInContainer, ProductGridSkeleton, BentoProductGridSkeleton } from "./components/Skeleton";
import { translations, Language } from "./lib/translations";
import { generateId, generateProductCode, generateFactoryCode, generateUserCode, generateCategoryCode } from "./lib/id-utils";
import { PaymentMethod } from "./types";
import { updatePageSEO, SEO_TAB_CONFIGS, getProductSEOMetadata, getCategorySEOMetadata } from "./utils/seoHelper";
import { AnimatedHatchedOverlay } from "./components/AnimatedHatchedOverlay";

const CATEGORIES = ["همه"];

export const ORGANIC_PALETTES = [
  {
    name: "سبز زمردی درخشان و فیروزه‌ای مجلل",
    emerald50: "#ecfdf5",
    emerald100: "#d1fae5",
    emerald200: "#a7f3d0",
    emerald300: "#6ee7b7",
    emerald400: "#34d399",
    emerald500: "#10b981",
    emerald600: "#059669",
    emerald700: "#047857",
    emerald800: "#065f46",
    emerald900: "#064e3b",
    amber50: "#f0fdf4",
    amber100: "#dcfce7",
    amber200: "#bbf7d0",
    amber300: "#86efac",
    amber400: "#4ade80",
    amber500: "#22c55e",
    amber600: "#16a34a",
    amber700: "#15803d",
    amber800: "#166534",
    amber950: "#14532d"
  },
  {
    name: "آبی لاجوردی درخشان و زعفران طلایی",
    emerald50: "#eff6ff",
    emerald100: "#dbeafe",
    emerald200: "#bfdbfe",
    emerald300: "#93c5fd",
    emerald400: "#60a5fa",
    emerald500: "#2563eb",
    emerald600: "#1d4ed8",
    emerald700: "#1e40af",
    emerald800: "#1e3a8a",
    emerald900: "#172554",
    amber50: "#fff9db",
    amber100: "#fff3b3",
    amber200: "#ffe066",
    amber300: "#ffd43b",
    amber400: "#fcc419",
    amber500: "#fab005",
    amber600: "#f59f00",
    amber700: "#f08c00",
    amber800: "#e67e22",
    amber950: "#d35400"
  },
  {
    name: "آبی اقیانوسی و فیروزه‌ای متریال",
    emerald50: "#f0f9ff",
    emerald100: "#e0f2fe",
    emerald200: "#bae6fd",
    emerald300: "#7dd3fc",
    emerald400: "#38bdf8",
    emerald500: "#0284c7",
    emerald600: "#0369a1",
    emerald700: "#075985",
    emerald800: "#0c4a6e",
    emerald900: "#0369a1",
    amber50: "#f0fdfa",
    amber100: "#ccfbf1",
    amber200: "#99f6e4",
    amber300: "#5eead4",
    amber400: "#2dd4bf",
    amber500: "#0d9488",
    amber600: "#0f766e",
    amber700: "#115e59",
    amber800: "#134e4a",
    amber950: "#115e59"
  },
  {
    name: "نقره‌ای مات و ذغالی کمرنگ",
    emerald50: "#f8fafc",
    emerald100: "#f1f5f9",
    emerald200: "#e2e8f0",
    emerald300: "#cbd5e1",
    emerald400: "#94a3b8",
    emerald500: "#64748b",
    emerald600: "#475569",
    emerald700: "#334155",
    emerald800: "#1e293b",
    emerald900: "#0f172a",
    amber50: "#ffffff",
    amber100: "#f8fafc",
    amber200: "#f1f5f9",
    amber300: "#e2e8f0",
    amber400: "#cbd5e1",
    amber500: "#94a3b8",
    amber600: "#64748b",
    amber700: "#475569",
    amber800: "#334155",
    amber950: "#1e293b"
  }
];

const toPersianNum = (num: number | string) => {
  if (num === undefined || num === null) return "";
  const persian = {
    "0": "۰", "1": "۱", "2": "۲", "3": "۳", "4": "۴", "5": "۵", "6": "۶", "7": "۷", "8": "۸", "9": "۹"
  };
  return num.toString().replace(/[0-9]/g, (w) => (persian as any)[w]);
};

const INITIAL_CATEGORIES = MASTER_CATEGORIES.map(c => c.name);

export default function App() {
  const [showSplash, setShowSplash] = useState<boolean>(true);
  const [paletteIndex, setPaletteIndex] = useState<number>(0);
  const [paletteToast, setPaletteToast] = useState<string | null>(null);

  const handleRandomizeColors = () => {
    let nextIdx = paletteIndex;
    while (nextIdx === paletteIndex) {
      nextIdx = Math.floor(Math.random() * ORGANIC_PALETTES.length);
    }
    setPaletteIndex(nextIdx);
    localStorage.setItem('dastavval_palette_idx', nextIdx.toString());
    setPaletteToast(ORGANIC_PALETTES[nextIdx].name);
    setTimeout(() => {
      setPaletteToast(null);
    }, 4000);
  };

  const currentPalette = ORGANIC_PALETTES[paletteIndex] || ORGANIC_PALETTES[0];

  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('dastavval_lang');
    return (saved as Language) || 'fa';
  });
  const [theme, setTheme] = useState<'light' | 'dark' | 'classic'>(() => {
    const saved = localStorage.getItem('dastavval_theme');
    return (saved as any) || 'light';
  });
  const [dailyAI, setDailyAI] = useState<any>(null);

  // New B2B dynamic personalization states
  const [interfaceMode, setInterfaceMode] = useState<'simple' | 'advanced'>(() => {
    const saved = localStorage.getItem('dastavval_interface_mode');
    return (saved as any) || 'advanced';
  });
  const [userBadge, setUserBadge] = useState<'bronze' | 'silver' | 'gold' | 'vip' | 'admin'>('bronze');

  useEffect(() => {
    localStorage.setItem('dastavval_interface_mode', interfaceMode);
  }, [interfaceMode]);

  const [b2bConfig, setB2bConfig] = useState<any>(() => {
    const defaultDefaults = {
      primaryColor: "emerald",
      appName: "دست اول",
      appSub: "مرجع مبادلات مستقیم و تامین کالای عمده از درب کارخانه",
      factories: [],
      equipmentAds: [],
      serviceAds: [],
      rawMaterialAds: [],
      sponsoredAds: [],
      categories: [
        { id: "cat-1", name: "تنقلات و شکلات", label: "تنقلات و شکلات", image: "http://c102393.parspack.net/c102393/products/prd_1.webp" },
        { id: "cat-2", name: "کیک، کلوچه و بیسکویت", label: "کیک، کلوچه و بیسکویت", image: "http://c102393.parspack.net/c102393/products/prd_2.webp" },
        { id: "cat-3", name: "مواد غذایی و کنسروجات", label: "مواد غذایی و کنسروجات", image: "http://c102393.parspack.net/c102393/products/prd_3.webp" },
        { id: "cat-4", name: "نوشیدنی‌ها", label: "نوشیدنی‌ها", image: "http://c102393.parspack.net/c102393/products/prd_4.webp" },
        { id: "cat-5", name: "شوینده و بهداشتی", label: "شوینده و بهداشتی", image: "http://c102393.parspack.net/c102393/products/prd_5.webp" }
      ],
      logoUrl: "https://raw.githubusercontent.com/antigravity-agent/media/main/dastavval_logo.png",
      mascotUrl: "/assets/mascot_character.jpg",
      buyerCredit: 250000000,
      supportPhone: "09999123001",
      minOrderAmount: 3000000,
      minOrderCartons: 3,
      commissionRate: 5,
      enamadCode: "ENAMAD-99887766",
      enamadUrl: "https://trustseal.enamad.ir/?id=321456&Code=xyz",
      samandehiCode: "SAMAN-445566",
      samandehiUrl: "https://logo.samandehi.ir/verify.aspx?id=123456",
      tradeUnionCode: "IR-9044502",
      tradeUnionUrl: "https://dastavval.com/license",
      invoiceSettings: {
        sellerTitle: "سامانه مبادلات مستقیم کالای دست اول",
        sellerPhone: "021-88889999",
        sellerMobile: "09999123001",
        hqAddress: "تبریز، برج تجارت جهانی",
        bankAccounts: [
          {
            bankName: "بانک ملت",
            ownerName: "علی پرتوی",
            accountNumber: "8349183105",
            cardNumber: "6104337420672725",
            shabaNumber: "IR470120010000008349183105"
          },
          {
            bankName: "بانک ملی ایران",
            ownerName: "سامانه مبادلات دست اول",
            accountNumber: "8349183106",
            cardNumber: "6037991899881234",
            shabaNumber: "IR420190000000102938475661"
          }
        ]
      },
      quantityDiscountTiers: [
        { threshold: 10, discountPercent: 3 },
        { threshold: 25, discountPercent: 6 },
        { threshold: 50, discountPercent: 10 }
      ],
      volumeDiscountTiers: [
        { threshold: 10000000, discountPercent: 2 },
        { threshold: 50000000, discountPercent: 5 },
        { threshold: 150000000, discountPercent: 8 },
        { threshold: 500000000, discountPercent: 12 }
      ],
      rubikaChannelUrl: "https://rubika.ir/dastavval_com",
      telegramChannelUrl: "https://t.me/dastavval_com",
      whatsappGroupUrl: "https://chat.whatsapp.com/dastavval_com",
      instagramPageUrl: "https://instagram.com/dastavval_com"
    };

    try {
      const saved = localStorage.getItem("dastavval_b2b_config");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed) {
          return {
            ...defaultDefaults,
            ...parsed,
            factories: (parsed.factories && Array.isArray(parsed.factories)) ? parsed.factories : defaultDefaults.factories,
            categories: (parsed.categories && Array.isArray(parsed.categories)) ? parsed.categories : defaultDefaults.categories,
            invoiceSettings: {
              ...defaultDefaults.invoiceSettings,
              ...(parsed.invoiceSettings || {}),
              bankAccounts: (parsed.invoiceSettings?.bankAccounts && parsed.invoiceSettings.bankAccounts.length > 0)
                ? parsed.invoiceSettings.bankAccounts
                : defaultDefaults.invoiceSettings.bankAccounts
            },
            quantityDiscountTiers: (parsed.quantityDiscountTiers && parsed.quantityDiscountTiers.length > 0) ? parsed.quantityDiscountTiers : defaultDefaults.quantityDiscountTiers,
            volumeDiscountTiers: (parsed.volumeDiscountTiers && parsed.volumeDiscountTiers.length > 0) ? parsed.volumeDiscountTiers : defaultDefaults.volumeDiscountTiers
          };
        }
      }
    } catch (e) {}

    return defaultDefaults;
  });

  const [appMode, setAppMode] = useState<'presentation' | 'portal'>('presentation');
  const [activeTab, setActiveTab] = useState<'presentation' | 'order' | 'portal' | 'admin' | 'news' | 'profile' | 'user' | 'factories' | 'about' | 'learning' | 'support' | 'vendor' | 'billboard' | 'barter' | 'dealership' | 'agency' | 'dealership_request' | 'rep_cert' | 'certificate' | 'agent-catalog' | 'error' | 'profit-simulator' | 'loyalty' | 'weekly-schedule' | 'product-page' | 'ad_poster_panel' | 'ad-detail' | 'special-offers' | 'bestsellers' | 'competition' | 'article-page'>('presentation');
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);
  const [billboardSubTab, setBillboardSubTab] = useState<'floor_deals' | 'barter_hall' | 'ad_poster_panel'>('floor_deals');
  const [selectedAdForDetail, setSelectedAdForDetail] = useState<any>(null);

  const openAdPage = (ad: any) => {
    setSelectedAdForDetail(ad);
    setActiveTab('ad-detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const [currentSellerId, setCurrentSellerId] = useState<string>("factory_cheetoz");
  const [currentSellerName, setCurrentSellerName] = useState<string>("مزمز و چیتوز");
  const [products, setProducts] = useState<Product[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("app_db_products_v4.0");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length >= 10) return parsed;
        }
      } catch (e) {}
    }
    return [];
  });
  const [loading, setLoading] = useState(false);

  // Live GitHub Hot-Update Sync and Cache-Busting engine states
  const [currentVersion, setCurrentVersion] = useState<any>(null);
  const [newVersionAvailable, setNewVersionAvailable] = useState<boolean>(false);
  const [newVersionInfo, setNewVersionInfo] = useState<any>(null);
  const [isUpdatingState, setIsUpdatingState] = useState<boolean>(false);
  const [activeCategory, setActiveCategory] = useState("همه");
  const [selectedBrand, setSelectedBrand] = useState("همه");
  const [searchQuery, setSearchQuery] = useState("");
  const [specialFilter, setSpecialFilter] = useState<'none' | 'special' | 'sediment' | 'surplus'>('none');
  const [hideOutOfStock, setHideOutOfStock] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("dastavval_hide_out_of_stock");
        return saved ? saved === "true" : true;
      } catch (e) {
        return true;
      }
    }
    return true;
  });
  const [viewMode, setViewModeState] = useState<'table' | 'grid' | 'list' | 'high_margin'>(() => {
    try {
      const saved = localStorage.getItem("dastavval_preferred_view_mode");
      if (saved && ['table', 'grid', 'list', 'high_margin'].includes(saved)) {
        return saved as any;
      }
    } catch {}
    return 'list';
  });

  const setViewMode = (mode: 'table' | 'grid' | 'list' | 'high_margin') => {
    setViewModeState(mode);
    try {
      localStorage.setItem("dastavval_preferred_view_mode", mode);
    } catch {}
  };
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(false);
  const [sortBy, setSortBy] = useState<'default' | 'best-selling' | 'newest' | 'price-asc' | 'price-desc'>('default');
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [catalogInitialMarkup, setCatalogInitialMarkup] = useState<number | null>(null);
  const [catalogAutoPrint, setCatalogAutoPrint] = useState(false);
  const [isGapGptModalOpen, setIsGapGptModalOpen] = useState(false);
  const [isRepDetailsExpanded, setIsRepDetailsExpanded] = useState(false);
  const [showQuickRegister, setShowQuickRegister] = useState(false);
  const [firestoreStatus, setFirestoreStatus] = useState<'online' | 'offline' | 'checking'>('checking');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [liveVisitors, setLiveVisitors] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('dastavval_live_visitors_count');
      if (saved) return parseInt(saved, 10);
      const hour = new Date().getHours();
      const base = (hour >= 8 && hour <= 18) ? 1420 : 780;
      return base + Math.floor(Math.random() * 210);
    } catch {
      return 1250;
    }
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setLiveVisitors(prev => {
        const delta = Math.floor(Math.random() * 7) - 3;
        const next = Math.max(280, prev + delta);
        try { localStorage.setItem('dastavval_live_visitors_count', next.toString()); } catch {}
        return next;
      });
    }, 10000);
    return () => clearInterval(interval);
  }, []);
  const [cart, setCart] = useState<OrderItem[]>(() => {
    try {
      const persistent = localStorage.getItem('dastavval_persistent_cart');
      if (persistent) {
        const parsed = JSON.parse(persistent);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn("Failed to load persistent cart from localStorage:", e);
    }
    return [];
  });

  // Save cart to persistent storage on any change
  useEffect(() => {
    try {
      localStorage.setItem('dastavval_persistent_cart', JSON.stringify(cart));
    } catch (e) {
      console.warn("Failed to save cart to localStorage:", e);
    }
  }, [cart]);

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [orderStatus, setOrderStatus] = useState<'idle' | 'processing' | 'success'>('idle');
  const [checkoutError, setCheckoutError] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [comparisonList, setComparisonList] = useState<Product[]>([]);
  const [isComparisonOpen, setIsComparisonOpen] = useState(false);
  const [showOrderSuccess, setShowOrderSuccess] = useState(false);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [isTopAnnouncementDismissed, setIsTopAnnouncementDismissed] = useState(false);
  const [showChequeCharterModal, setShowChequeCharterModal] = useState(false);
  const [showPwaModal, setShowPwaModal] = useState(false);
  const [showLogisticsModal, setShowLogisticsModal] = useState(false);
  const [showQuickMatrixModal, setShowQuickMatrixModal] = useState(false);
  const [isCPanelWizardOpen, setIsCPanelWizardOpen] = useState(false);
  const [lastOrderTracking, setLastOrderTracking] = useState("");
  const [lastOrderAmount, setLastOrderAmount] = useState(0);
  const [lastCreatedOrder, setLastCreatedOrder] = useState<any | null>(null);
  const [directUrlInvoiceOrder, setDirectUrlInvoiceOrder] = useState<any | null>(null);

  const handleApplyMatrixOrder = (items: { product: Product; quantityCartons: number }[]) => {
    items.forEach(({ product, quantityCartons }) => {
      addToCart(product, quantityCartons);
    });
    setIsCartOpen(true);
  };

  // Real Zarinpal online payment gateway orchestration engine
  const [zarinpalOpen, setZarinpalOpen] = useState(false);
  const [zarinpalAmount, setZarinpalAmount] = useState(0);
  const [zarinpalDescription, setZarinpalDescription] = useState("");
  const [zarinpalCallback, setZarinpalCallback] = useState<(success: boolean) => void>(() => () => {});

  const triggerZarinpalPayment = (paymentInfo: {
    amount: number;
    description: string;
    callback: (success: boolean) => void;
  }) => {
    setZarinpalAmount(paymentInfo.amount);
    setZarinpalDescription(paymentInfo.description);
    setZarinpalCallback(() => paymentInfo.callback);
    setZarinpalOpen(true);
  };

  // Interactive Categories management states
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editingCatName, setEditingCatName] = useState<string>("");
  const [newCatName, setNewCatName] = useState<string>("");
  const [showAddCat, setShowAddCat] = useState<boolean>(false);

  const handleSaveCategory = (catId: string, oldName: string) => {
    if (!editingCatName.trim()) return;
    
    let updatedCategories = [...(b2bConfig.categories || [])];
    const index = updatedCategories.findIndex((c: any) => (typeof c === 'string' ? c : c.name) === oldName || (c.id && c.id === catId));
    if (index !== -1) {
      if (typeof updatedCategories[index] === 'string') {
        updatedCategories[index] = editingCatName.trim();
      } else {
        updatedCategories[index] = {
          ...updatedCategories[index],
          name: editingCatName.trim(),
          label: editingCatName.trim()
        };
      }
    } else {
      updatedCategories.push({
        id: catId || 'cat-' + Date.now(),
        name: editingCatName.trim(),
        label: editingCatName.trim(),
        image: "http://c102393.parspack.net/c102393/products/prd_10.webp"
      });
    }

    const updatedProducts = products.map((p: any) => {
      if (p.category === oldName) {
        return { ...p, category: editingCatName.trim() };
      }
      return p;
    });
    setProducts(updatedProducts);
    
    handleUpdateB2bConfig({
      ...b2bConfig,
      categories: updatedCategories
    });
    
    if (activeCategory === oldName) {
      setActiveCategory(editingCatName.trim());
    }
    
    setEditingCatId(null);
  };

  const handleDeleteCategory = (catId: string, catName: string) => {
    if (window.confirm(`آیا از حذف دسته‌بندی "${catName}" اطمینان دارید؟`)) {
      const updatedCategories = (b2bConfig.categories || []).filter((c: any) => {
        const name = typeof c === 'string' ? c : c.name;
        const id = typeof c === 'string' ? null : c.id;
        return name !== catName && id !== catId;
      });
      
      handleUpdateB2bConfig({
        ...b2bConfig,
        categories: updatedCategories
      });
      
      if (activeCategory === catName) {
        setActiveCategory("همه");
      }
    }
  };

  const handleAddCategory = () => {
    if (!newCatName.trim()) return;
    const updatedCategories = [...(b2bConfig.categories || [])];
    updatedCategories.push({
      id: 'cat-' + Date.now(),
      name: newCatName.trim(),
      label: newCatName.trim(),
      image: "http://c102393.parspack.net/c102393/products/prd_10.webp"
    });
    
    handleUpdateB2bConfig({
      ...b2bConfig,
      categories: updatedCategories
    });
    
    setNewCatName("");
    setShowAddCat(false);
  };

  // Detail modal & product page states
  const [selectedDetailProduct, setSelectedDetailProduct] = useState<Product | null>(null);
  const [selectedProductPage, setSelectedProductPage] = useState<Product | null>(null);
  const [previousTab, setPreviousTab] = useState<any>('order');
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const isProductAd = (product: Product) => {
    const cat = (product.category || "").toLowerCase();
    const name = (product.name || "").toLowerCase();
    return (
      cat.includes("مواد اولیه") ||
      cat.includes("خدمات") ||
      cat.includes("تجهیزات") ||
      cat.includes("raw material") ||
      cat.includes("service") ||
      cat.includes("equipment") ||
      name.includes("نشاسته") ||
      name.includes("کنسانتره") ||
      name.includes("گلوتن")
    );
  };

  // User recent categories history for personalized showcase rotation
  const [recentCategories, setRecentCategories] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("dastavval_recent_categories");
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const recordBrowsedCategory = (categoryName: string) => {
    if (!categoryName || categoryName === "همه") return;
    setRecentCategories((prev) => {
      const filtered = prev.filter((c) => c !== categoryName);
      const updated = [categoryName, ...filtered].slice(0, 5);
      try {
        localStorage.setItem("dastavval_recent_categories", JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  useEffect(() => {
    if (activeCategory && activeCategory !== "همه") {
      recordBrowsedCategory(activeCategory);
    }
  }, [activeCategory]);

  const openProductPage = (product: Product) => {
    if (product?.category) {
      recordBrowsedCategory(product.category);
    }
    if (isProductAd(product)) {
      // Map product fields to ad fields for AdDetailView compatibility
      const adFromProduct = {
        id: product.id,
        title: product.name,
        category: product.category || "آگهی عمومی",
        factoryName: product.brand || "تامین‌کننده تایید شده",
        wholesalePrice: (product as any).wholesalePrice || product.price,
        description: product.description || "توضیحات تکمیلی برای این آگهی ثبت نشده است.",
        imageUrl: product.image_url,
        quantity: (product as any).stock_status === 'in_stock' ? "موجود" : "استعلام شود",
        badge: (product as any).badge,
        rawProduct: product // Keep original for reference
      };
      setSelectedAdForDetail(adFromProduct);
      setActiveTab('ad-detail');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setPreviousTab(activeTab === 'product-page' ? previousTab : activeTab);
    setSelectedProductPage(product);
    setActiveTab('product-page');
    setIsDetailModalOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const [showAllHomepageProducts, setShowAllHomepageProducts] = useState(false);
  const [initialFactoryIdParam, setInitialFactoryIdParam] = useState<string | null>(null);
  const [initialProductIdParam, setInitialProductIdParam] = useState<string | null>(null);

  // Cache-First Preload Execution on Mount to load critical data from IndexedDB/LocalStorage instantly
  useEffect(() => {
    s3PreloadService.loadCriticalDataCacheFirst().then(({ products: cachedProds, b2bConfig: cachedConf }) => {
      if (cachedProds && cachedProds.length > 0) {
        setProducts(prev => prev.length === 0 ? cachedProds : prev);
      }
      if (cachedConf && Object.keys(cachedConf).length > 0) {
        setB2bConfig((prev: any) => ({ ...prev, ...cachedConf }));
      }
    }).catch(err => {
      console.warn("Cache-first load warning:", err);
    });

    // Run smart version check and async update via version.json
    checkAndSyncAppVersion();
  }, []);

  // Scroll to top on tab change and update SEO Meta Tags dynamically
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (selectedDetailProduct) {
      updatePageSEO(getProductSEOMetadata(selectedDetailProduct));
    } else if (activeCategory && activeCategory !== "همه" && activeTab === 'order') {
      updatePageSEO(getCategorySEOMetadata(activeCategory));
    } else if (SEO_TAB_CONFIGS[activeTab]) {
      updatePageSEO(SEO_TAB_CONFIGS[activeTab]);
    }
  }, [activeTab, activeCategory, selectedDetailProduct]);

  // Listen for special filter events from the Hero component
  useEffect(() => {
    const handleSetSpecialFilter = (e: Event) => {
      const customEvent = e as CustomEvent;
      const mode = customEvent.detail;
      if (mode === 'kaf_bazaar' || mode === 'special') {
        setSpecialFilter('special');
      } else if (mode === 'sediment') {
        setSpecialFilter('sediment');
      } else if (mode === 'surplus') {
        setSpecialFilter('surplus');
      } else {
        setSpecialFilter('none');
      }
      
      // Auto-scroll to the top of the order section
      setTimeout(() => {
        const bannerElement = document.getElementById("unified-agency-platform-banner");
        if (bannerElement) {
          bannerElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    };

    window.addEventListener('set-order-special-filter', handleSetSpecialFilter);
    return () => {
      window.removeEventListener('set-order-special-filter', handleSetSpecialFilter);
    };
  }, []);

  // Update favicon and Apple Touch Icon when logoUrl changes
  useEffect(() => {
    if (b2bConfig?.logoUrl) {
      let iconLink = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
      if (!iconLink) {
        iconLink = document.createElement('link');
        iconLink.rel = 'icon';
        document.head.appendChild(iconLink);
      }
      iconLink.href = b2bConfig.logoUrl;
      
      let appleIconLink = document.querySelector("link[rel='apple-touch-icon']") as HTMLLinkElement;
      if (appleIconLink) {
        appleIconLink.href = b2bConfig.logoUrl;
      }
    }
  }, [b2bConfig?.logoUrl]);

  // Global Brand Search Event Listener
  useEffect(() => {
    const handleBrandSearch = (e: any) => {
      if (e.detail?.brand) {
        setSelectedBrand(e.detail.brand);
        setSearchQuery(e.detail.brand);
        setActiveTab('order');
      }
    };
    window.addEventListener("search-brand", handleBrandSearch);
    return () => window.removeEventListener("search-brand", handleBrandSearch);
  }, []);

  // Global Factory View Event Listener
  useEffect(() => {
    const handleFactoryView = (e: any) => {
      if (e.detail?.factoryId) {
        setInitialFactoryIdParam(e.detail.factoryId);
        setActiveTab('factories');
      }
    };
    window.addEventListener("view-factory", handleFactoryView);
    return () => window.removeEventListener("view-factory", handleFactoryView);
  }, []);

  // Global Article View Event Listener
  useEffect(() => {
    const handleArticleView = (e: any) => {
      if (e.detail?.articleId) {
        setSelectedArticleId(e.detail.articleId);
        setActiveTab('article-page');
        const url = new URL(window.location.href);
        url.searchParams.set('article', e.detail.articleId);
        window.history.pushState({}, '', url.toString());
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    };
    window.addEventListener("view-article", handleArticleView);
    return () => window.removeEventListener("view-article", handleArticleView);
  }, []);

  // Global Catalog Modal Event Listener
  useEffect(() => {
    const handleOpenCatalog = () => {
      setIsCatalogOpen(true);
    };
    window.addEventListener("open-catalog-modal", handleOpenCatalog);
    return () => window.removeEventListener("open-catalog-modal", handleOpenCatalog);
  }, []);

  // Global Open Cart Event Listener
  useEffect(() => {
    const handleOpenCart = () => {
      setIsCartOpen(true);
    };
    window.addEventListener("open-cart", handleOpenCart);
    return () => window.removeEventListener("open-cart", handleOpenCart);
  }, []);

  // Global Switch to Agent Catalog Event Listener
  useEffect(() => {
    const handleSwitchToCatalog = () => {
      setActiveTab('agent-catalog');
    };
    window.addEventListener("switch-to-agent-catalog", handleSwitchToCatalog);
    return () => window.removeEventListener("switch-to-agent-catalog", handleSwitchToCatalog);
  }, []);

  // Global Open Dealership Request Event Listener
  useEffect(() => {
    const handleOpenDealership = () => {
      setActiveTab('dealership_request');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    window.addEventListener("open-dealership-request", handleOpenDealership);
    return () => window.removeEventListener("open-dealership-request", handleOpenDealership);
  }, []);

  // Read URL query parameter for direct factory or article links or factor URLs or affiliate tracking
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const affId = urlParams.get('ref') || urlParams.get('aff') || urlParams.get('rep') || urlParams.get('agent');
      if (affId) {
        localStorage.setItem('dastavval_affiliate_rep_id', affId);
        console.log("Captured affiliate representative/agent ID:", affId);
      }

      const path = window.location.pathname;
      const urlParamsForInvoice = new URLSearchParams(window.location.search);
      const queryInvoiceId = urlParamsForInvoice.get('factor') || urlParamsForInvoice.get('invoice') || urlParamsForInvoice.get('order') || urlParamsForInvoice.get('orderId') || urlParamsForInvoice.get('track');

      const isInvoicePath = path.includes('/invoice/') || path.includes('/factors/') || !!queryInvoiceId;

      if (isInvoicePath) {
        let rawId = queryInvoiceId || "";
        if (!rawId) {
          let decoded = path;
          try { decoded = decodeURIComponent(path); } catch (e) {}
          const match = decoded.match(/(?:factors|invoice)\/([^/?#]+)/i);
          if (match && match[1]) {
            rawId = match[1].replace(/\.pdf$/i, '').trim();
          }
          if (!rawId) {
            rawId = localStorage.getItem("dastavval_last_order_id") || localStorage.getItem("dastavval_last_order_tracking") || "";
          }
        }

        if (rawId) {
          // Convert any Persian/Arabic digits to clean English digits
          const cleanNumeric = rawId
            .replace(/[۰-۹]/g, (d) => "0123456789"["۰۱۲۳۴۵۶۷۸۹".indexOf(d)])
            .replace(/[٠-٩]/g, (d) => "0123456789"["٠١٢٣٤٥٦٧٨٩".indexOf(d)])
            .replace(/\D/g, '') || rawId;

          const loadRealFactor = async () => {
            let foundOrder: any = null;

            const isOrderMatch = (o: any) => {
              if (!o) return false;
              const oIdStr = String(o.id || "");
              const oTrackStr = String(o.tracking_number || o.trackingNumber || "");
              const oOrderStr = String(o.orderId || "");
              const oBuyerName = String(o.buyerName || o.customerName || o.buyerInfo?.name || "").toLowerCase();
              const oBuyerPhone = String(o.buyerPhone || o.customerPhone || o.phone || o.mobile || "");

              const rawLower = rawId.toLowerCase().trim();

              return (
                oIdStr === rawId ||
                oTrackStr === rawId ||
                oOrderStr === rawId ||
                oIdStr === cleanNumeric ||
                oTrackStr === cleanNumeric ||
                (cleanNumeric && (
                  oIdStr.includes(cleanNumeric) ||
                  oTrackStr.includes(cleanNumeric) ||
                  oOrderStr.includes(cleanNumeric) ||
                  oBuyerPhone.includes(cleanNumeric)
                )) ||
                (rawLower && rawLower.length > 2 && (oBuyerName.includes(rawLower) || rawLower.includes(oBuyerName))) ||
                (rawLower && oBuyerPhone.includes(rawLower))
              );
            };

            // 1. Try local storage cache first for instant opening
            try {
              const local = JSON.parse(localStorage.getItem("dastavval_orders_cache") || "[]");
              const raw = JSON.parse(localStorage.getItem("dastavval_raw_orders") || "[]");
              const combined = [...local, ...raw];
              foundOrder = combined.find(isOrderMatch);
            } catch (err) {}

            // 2. Try Firestore live collection
            if (!foundOrder) {
              try {
                const ordersSnap = await getDocs(query(collection(db, "orders")));
                ordersSnap.forEach((docSnap) => {
                  const data = docSnap.data();
                  const item = { id: docSnap.id, ...data };
                  if (isOrderMatch(item)) {
                    foundOrder = item;
                  }
                });
              } catch (e) {
                console.warn("Firestore direct factor lookup notice:", e);
              }
            }

            // 3. Try backend API endpoint /api/b2b/orders or /php/api.php?action=b2b/orders
            if (!foundOrder) {
              try {
                const apiPaths = ['/api/b2b/orders', '/php/api.php?action=b2b/orders'];
                for (const apiPath of apiPaths) {
                  try {
                    const response = await fetch(apiPath);
                    if (response.ok) {
                      const ordersList = await response.json();
                      if (Array.isArray(ordersList)) {
                        foundOrder = ordersList.find(isOrderMatch);
                        if (foundOrder) break;
                      }
                    }
                  } catch (e) {}
                }
              } catch (err) {
                console.error("Error loading real invoice from API:", err);
              }
            }

            if (foundOrder) {
              setDirectUrlInvoiceOrder(foundOrder);
            } else {
              // Fallback preview
              setDirectUrlInvoiceOrder({
                id: cleanNumeric,
                trackingNumber: `DO-${cleanNumeric}`,
                buyerName: "خریدار محترم (عامل توزیع)",
                buyerCompany: "شرکت بازرگانی مواد غذایی",
                buyerPhone: "09123456789",
                createdAt: new Date().toISOString(),
                totalAmount: 185000000,
                items: [
                  { name: "روغن مایع خوراکی آفتابگردان ۱.۵ لیتری (کارتن ۶ عددی)", quantityCartons: 50, price: 420000, brand: "کارخانه کشت و صنعت" },
                  { name: "تن ماهی ۱۸۰ گرمی قوطی آسان بازشو (کارتن ۲۴ عددی)", quantityCartons: 30, price: 2900000, brand: "صنایع غذایی شیلات" }
                ],
                paymentStatus: "paid",
                status: "confirmed"
              });
            }
          };

          loadRealFactor();
        }
      }

      const params = new URLSearchParams(window.location.search);
      const isWeeklySchedule = params.get('tab') === 'weekly-schedule' || params.get('tab') === 'weekly-sales' || params.get('view') === 'weekly-sales' || params.get('view') === 'weekly-schedule';
      const isCatalogView = params.get('catalog-view') === 'true' || params.get('view') === 'catalog-view' || window.location.pathname.includes('/catalog-view') || params.get('agent') !== null;
      
      const productParam = params.get('product') || params.get('p') || params.get('id') || params.get('productId');
      if (productParam) {
        setInitialProductIdParam(productParam);
      }

      if (isWeeklySchedule) {
        setActiveTab('weekly-schedule');
      } else if (isCatalogView) {
        setActiveTab('agent-catalog');
      } else {
        const factoryParam = params.get('factory');
        if (factoryParam) {
          setInitialFactoryIdParam(factoryParam);
          setActiveTab('factories');
        }
        const articleParam = params.get('article') || params.get('articleId') || params.get('a');
        if (articleParam) {
          setSelectedArticleId(articleParam);
          setActiveTab('article-page');
        }
      }
    }
  }, []);

  // Deep linking: open dedicated product page whenever URL product parameter is found
  useEffect(() => {
    if (initialProductIdParam && products && products.length > 0) {
      const found = products.find(p => 
        String(p.id) === String(initialProductIdParam) || 
        String(p.productCode) === String(initialProductIdParam) ||
        String(p.sku) === String(initialProductIdParam)
      );
      if (found) {
        openProductPage(found);
      }
    }
  }, [initialProductIdParam, products]);

  const toggleComparison = (product: Product) => {
    setComparisonList(prev => {
      const exists = prev.find(p => p.id === product.id);
      if (exists) return prev.filter(p => p.id !== product.id);
      if (prev.length >= 4) return prev;
      return [...prev, product];
    });
  };

  // Multi-vendor seller state
  const [sellerId, setSellerId] = useState("");
  const [sellerName, setSellerName] = useState("گروه صنایع غذایی به‌آرا (چی‌توز)");

  const [articles, setArticles] = useState<any[]>([]);

  const DEFAULT_NEWS_ITEMS: any[] = [];

  const fetchArticles = async () => {
    try {
      const res = await fetch(getApiUrl("/api/articles"));
      if (res.ok) {
        const data = await res.json();
        const items = Array.isArray(data) ? data : (data?.articles && Array.isArray(data.articles) ? data.articles : []);
        if (items.length > 0) {
          localStorage.setItem("dastavval_news_articles", JSON.stringify(items));
          setArticles(items);
          return;
        }
      }
    } catch (apiErr) {
      console.warn("API articles fetch failed, trying Firestore:", apiErr);
    }

    try {
      const q = query(collection(db, "news"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      let items = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      if (items.length > 0) {
        localStorage.setItem("dastavval_news_articles", JSON.stringify(items));
        setArticles(items);
        return;
      }
    } catch (err) {
      console.warn("Firestore news fetch failed, trying local storage:", err);
    }

    const saved = localStorage.getItem("dastavval_news_articles");
    if (saved !== null) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setArticles(parsed);
          return;
        }
      } catch (e) {
        console.error("Error parsing articles from localStorage:", e);
      }
    }

    setArticles(DEFAULT_NEWS_ITEMS);
    localStorage.setItem("dastavval_news_articles", JSON.stringify(DEFAULT_NEWS_ITEMS));
  };

  const handleUpdateArticles = async () => {
    await fetchArticles();
  };

  // Checkout info form
  const [buyerName, setBuyerName] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [buyerAddress, setBuyerAddress] = useState("");
  const [buyerCompany, setBuyerCompany] = useState("");
  const [shippingMethod, setShippingMethod] = useState("barbari");
  const [paymentReceiptImage, setPaymentReceiptImage] = useState<string>("");

  // Unified City & Province states
  const [userCity, setUserCity] = useState<string>(() => localStorage.getItem("dastavval_user_city") || "تهران");
  const [userProvince, setUserProvince] = useState<string>(() => localStorage.getItem("dastavval_user_province") || "تهران");
  const [cityAgency, setCityAgency] = useState<any>(null);

  const checkCityRepresentative = useCallback(() => {
    try {
      if (!userCity) {
        setCityAgency(null);
        return;
      }

      const effectiveProv = userProvince || getProvinceForCity(userCity);

      // 1. Check approved representatives from admin panel database
      const savedReps: any[] = JSON.parse(localStorage.getItem("dastavval_representatives") || "[]");
      const approvedAdminRep = savedReps.find((r: any) => {
        const isApproved = r.isApproved === true || r.status === 'active' || !r.status;
        return isApproved && isRepresentativeForCity(r, userCity, effectiveProv);
      });

      if (approvedAdminRep) {
        const trueProvince = getProvinceForCity(approvedAdminRep.city || userCity, approvedAdminRep.province || effectiveProv);
        setCityAgency({
          ...approvedAdminRep,
          city: approvedAdminRep.city || userCity,
          province: trueProvince
        });
        return;
      }

      // 2. Check registered local users ONLY IF explicitly approved by Admin
      const usersObj = JSON.parse(localStorage.getItem("dastavval_local_users") || "{}");
      const users = Object.values(usersObj);
      const approvedUserRep = users.find((u: any) => {
        const isApprovedByAdmin = 
          u.agencyApproved === true || 
          u.isRepresentativeApproved === true || 
          u.representativeApproved === true ||
          (u.phone && localStorage.getItem(`dastavval_rep_approved_${u.phone}`) === "true") ||
          (u.id && localStorage.getItem(`dastavval_rep_approved_${u.id}`) === "true");

        const isActive = u.status === 'active' || u.status === undefined;
        const hasRepRole = u.role === 'representative' || u.role === 'agency';
        const matchesCity = isRepresentativeForCity(u, userCity, effectiveProv);

        return isApprovedByAdmin && isActive && hasRepRole && matchesCity;
      }) as any;

      if (approvedUserRep) {
        const trueProvince = getProvinceForCity(approvedUserRep.city || userCity, approvedUserRep.province || effectiveProv);
        setCityAgency({
          ...approvedUserRep,
          city: approvedUserRep.city || userCity,
          province: trueProvince
        });
        return;
      }

      setCityAgency(null);
    } catch(e) {
      setCityAgency(null);
    }
  }, [userCity, userProvince]);

  useEffect(() => {
    checkCityRepresentative();
  }, [checkCityRepresentative]);

  useEffect(() => {
    const handleRepsChanged = () => {
      checkCityRepresentative();
    };
    window.addEventListener("dastavval_reps_updated", handleRepsChanged);
    return () => window.removeEventListener("dastavval_reps_updated", handleRepsChanged);
  }, [checkCityRepresentative]);

  useEffect(() => {
    const handleCityChanged = (e: any) => {
      if (e.detail?.city) {
        setUserCity(e.detail.city);
      }
      if (e.detail?.province) {
        setUserProvince(e.detail.province);
      }
    };
    window.addEventListener("dastavval-city-changed", handleCityChanged);
    return () => window.removeEventListener("dastavval-city-changed", handleCityChanged);
  }, []);

  // Auth States
  const [user, setUser] = useState<any | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showRoleSelectionModal, setShowRoleSelectionModal] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [authInitialRole, setAuthInitialRole] = useState<'customer' | 'representative' | 'marketer' | 'factory' | 'ad_poster' | 'leader'>('customer');
  const [authInitialMode, setAuthInitialMode] = useState<'login' | 'signup'>('login');

  // Dynamic Product Rotation State on User Entry / Refresh
  const [rotationOffset, setRotationOffset] = useState<number>(() => {
    try {
      const saved = sessionStorage.getItem("dastavval_rotation_offset");
      if (saved !== null) return parseInt(saved, 10);
      const newSeed = Math.floor(Math.random() * 50);
      sessionStorage.setItem("dastavval_rotation_offset", String(newSeed));
      return newSeed;
    } catch (e) {
      return Math.floor(Math.random() * 50);
    }
  });

  const [isLiveCatalogRotating, setIsLiveCatalogRotating] = useState<boolean>(true);

  const handleRotateProducts = () => {
    const nextOffset = (rotationOffset + 7) % 100;
    setRotationOffset(nextOffset);
    try {
      sessionStorage.setItem("dastavval_rotation_offset", String(nextOffset));
    } catch (e) {}
  };

  // Live Auto-rotate main showcase catalog periodically (Slow, calm, unobtrusive)
  useEffect(() => {
    if (!isLiveCatalogRotating || viewMode === 'list' || activeTab !== 'presentation' || searchQuery !== '') return;
    const interval = setInterval(() => {
      setRotationOffset((prev) => (prev + 7) % 100);
    }, 90000); // Calm 90-second rotation interval
    return () => clearInterval(interval);
  }, [isLiveCatalogRotating, viewMode, activeTab, searchQuery]);

  useEffect(() => {
    const handleOpenAuth = (e: any) => {
      if (e.detail?.role) {
        setAuthInitialRole(e.detail.role);
        setAuthInitialMode('signup');
      }
      setShowAuthModal(true);
    };
    window.addEventListener('open-auth-with-role', handleOpenAuth);
    return () => window.removeEventListener('open-auth-with-role', handleOpenAuth);
  }, []);

  // Helper to sync updated product list with Node.js Express server
  const syncProductsWithServer = async (updatedList: Product[]) => {
    try {
      await fetch(getApiUrl("/api/b2b/products"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedList)
      });
    } catch (e) {
      console.error("Failed to sync products with Express server:", e);
    }
  };

  // Firestore product mutation handlers
  const handleAddProduct = async (newProd: Omit<Product, 'id'>, skipStateUpdate = false) => {
    const isFactory = userRole === 'factory';
    const prodWithCode = {
      ...newProd,
      productCode: (newProd as any).productCode || generateProductCode(),
      approvalStatus: newProd.approvalStatus || (isFactory ? 'pending' : 'approved'),
      isApproved: newProd.isApproved !== undefined ? newProd.isApproved : (!isFactory)
    };
    try {
      const docRef = await addDoc(collection(db, "products"), {
        ...prodWithCode,
        createdAt: serverTimestamp()
      });
      const finalProd = { id: docRef.id, ...prodWithCode } as Product;
      const nextList = [...products, finalProd];
      if (!skipStateUpdate) {
        setProducts(nextList);
      }
      await syncProductsWithServer(nextList);
    } catch (err) {
      console.error("Error adding product:", err);
      const fallbackId = `local-new-${Date.now()}`;
      const finalProd = { id: fallbackId, ...prodWithCode } as Product;
      const nextList = [...products, finalProd];
      if (!skipStateUpdate) {
        setProducts(nextList);
      }
      await syncProductsWithServer(nextList);
    }
  };

  const handleUpdateProduct = async (id: string, updatedFields: Partial<Product>, skipStateUpdate = false) => {
    // Get the current product from state to have full data in case we need to write the document from scratch
    const currentProd = products.find(p => p.id === id);
    const mergedProd = { ...currentProd, ...updatedFields } as Product;

    const nextList = products.map(p => p.id === id ? { ...p, ...updatedFields } : p);
    if (!skipStateUpdate) {
      setProducts(nextList);
    }
    await syncProductsWithServer(nextList);

    try {
      const productRef = doc(db, "products", id);
      await updateDoc(productRef, updatedFields);
    } catch (err) {
      console.warn("Document does not exist in Firestore. Creating full merged document...", err);
      try {
        const productRef = doc(db, "products", id);
        await setDoc(productRef, mergedProd, { merge: true });
      } catch (innerErr) {
        console.error("Failed to fallback setDoc for product:", innerErr);
      }
    }
  };

  const handleDeleteProduct = async (id: string, skipStateUpdate = false) => {
    const nextList = products.filter(p => p.id !== id);
    if (!skipStateUpdate) {
      setProducts(nextList);
    }
    await syncProductsWithServer(nextList);

    try {
      const productRef = doc(db, "products", id);
      await deleteDoc(productRef);
    } catch (err) {
      console.error("Error deleting product from DB:", err);
    }
  };

  const handleBatchDeleteProducts = async (ids: string[]) => {
    const nextList = products.filter(p => !ids.includes(p.id));
    setProducts(nextList);
    await syncProductsWithServer(nextList);

    try {
      const { batchDelete } = await import('./lib/data-layer');
      if (batchDelete) {
        await batchDelete("products", ids);
      } else {
        // Fallback for real firebase if implemented
        for (const id of ids) {
          const productRef = doc(db, "products", id);
          await deleteDoc(productRef);
        }
      }
    } catch (err) {
      console.error("Error batch deleting products from DB:", err);
    }
  };

  const handleBulkUpdateProducts = async (arg1: any, arg2?: any) => {
    let newList: Product[] = [];
    if (Array.isArray(arg1) && arg1.length > 0 && typeof arg1[0] === 'string') {
      const ids = arg1 as string[];
      const updates = arg2 as Partial<Product>;
      newList = products.map(p => ids.includes(p.id) ? { ...p, ...updates } : p);
    } else if (Array.isArray(arg1)) {
      newList = arg1 as Product[];
    } else {
      return;
    }

    setProducts(newList);
    await syncProductsWithServer(newList);

    try {
      const { saveCollection } = await import('./lib/data-layer');
      if (saveCollection) {
        saveCollection("products", newList);
      }
    } catch (err) {
      console.error("Error in bulk updating products:", err);
    }
  };

  const handleApplyJsonImportedProducts = async (importedItems: any[], mode: 'merge' | 'replace' = 'merge') => {
    if (!importedItems || importedItems.length === 0) return;

    const convertedProducts: Product[] = importedItems.map((item, idx) => {
      const price = Number(item.sellPrice || item.price || item.factoryPrice || 0);
      const factoryPrice = Number(item.factoryPrice || item.price || price || 0);
      const category = (item.category || "تنقلات و شکلات").trim();
      const code = item.sku || item.productCode || `P-${2000 + idx}`;
      const img = item.imageUrl || item.image || item.image_url || "http://c102393.parspack.net/c102393/products/prd_10.webp";
      const brandName = item.brand || item.factory || "کارخانه همکار دست اول";
      const packCount = Number(item.cartonPackCount || item.packageCount || item.carton_pack_count || 24);
      const minMoq = Number(item.minOrderCartons || item.minOrder || item.min_order_cartons || 1);

      return {
        id: String(item.id || `json-prod-${Date.now()}-${idx}`),
        name: item.name || "محصول جدید کاتالوگ",
        brand: brandName,
        price: price,
        bulk_price: price,
        factoryPrice: factoryPrice,
        minOrder: minMoq,
        min_order_cartons: minMoq,
        minOrderCartons: minMoq,
        unit: item.unit || "کارتن",
        category: category,
        description: item.description || `تولید استاندارد ${brandName} با بسته‌بندی کارخانه‌ای`,
        image: img,
        image_url: img,
        imageUrl: img,
        packageCount: packCount,
        carton_pack_count: packCount,
        stock: item.stockCartons !== undefined ? Number(item.stockCartons) : (item.stock !== undefined ? Number(item.stock) : 100),
        factory: brandName,
        factory_name: brandName,
        factoryName: brandName,
        isSpecial: Boolean(item.isSpecial),
        profitMargin: item.profitMargin !== undefined ? Number(item.profitMargin) : Math.max(12, Math.round(((price - factoryPrice) / (factoryPrice || 1)) * 100) || 18),
        productCode: code,
        sku: code,
        isApproved: true,
        approvalStatus: 'approved' as const
      };
    });

    let finalProducts: Product[] = [];
    if (mode === 'replace') {
      finalProducts = convertedProducts;
    } else {
      const map = new Map<string, Product>();
      products.forEach(p => {
        const key = p.productCode || p.id || p.name;
        map.set(key, p);
      });
      convertedProducts.forEach(p => {
        const key = p.productCode || p.id || p.name;
        const existing = map.get(key);
        if (existing) {
          map.set(key, { ...existing, ...p });
        } else {
          map.set(key, p);
        }
      });
      finalProducts = Array.from(map.values());
    }

    setProducts(finalProducts);
    await syncProductsWithServer(finalProducts);

    // Also extract new categories and merge them
    const newCategories = Array.from(new Set(convertedProducts.map(p => p.category).filter(Boolean)));
    const existingCatNames = (b2bConfig.categories || []).map((c: any) => typeof c === 'string' ? c : c.name);
    const toAdd = newCategories.filter(c => !existingCatNames.includes(c));
    if (toAdd.length > 0) {
      const updatedCats = [
        ...(b2bConfig.categories || []),
        ...toAdd.map(name => ({ id: `cat-${Date.now()}-${name}`, name, label: name }))
      ];
      handleUpdateB2bConfig({ ...b2bConfig, categories: updatedCats });
    }
  };

  const fetchB2bConfig = async (isBackground = false) => {
    try {
      const res = await fetch(getApiUrl("/api/b2b/config"));
      const contentType = res.headers.get("content-type");
      if (res.ok && contentType && contentType.includes("application/json")) {
        const data = await res.json();
        if (data && typeof data === 'object') {
          setB2bConfig((prev: any) => {
            const factories = (data.factories && Array.isArray(data.factories)) ? data.factories : (Array.isArray(prev.factories) ? prev.factories : []);
            const categories = (data.categories && Array.isArray(data.categories)) ? data.categories : (Array.isArray(prev.categories) ? prev.categories : INITIAL_CATEGORIES);
            const logoUrl = data.logoUrl || prev.logoUrl || "https://raw.githubusercontent.com/antigravity-agent/media/main/dastavval_logo.png";
            
            const merged = { 
              ...prev, 
              ...data,
              factories,
              categories,
              logoUrl,
              invoiceSettings: {
                ...(prev.invoiceSettings || {}),
                ...(data.invoiceSettings || {}),
                bankAccounts: (data.invoiceSettings?.bankAccounts && data.invoiceSettings.bankAccounts.length > 0)
                  ? data.invoiceSettings.bankAccounts
                  : (prev.invoiceSettings?.bankAccounts || [])
              }
            };
            
            try {
              localStorage.setItem("dastavval_b2b_config", JSON.stringify(merged));
              if (Array.isArray(data.equipmentAds)) {
                localStorage.setItem("dastavval_industrial_equipment", JSON.stringify(data.equipmentAds));
              }
              if (Array.isArray(data.serviceAds)) {
                localStorage.setItem("dastavval_industrial_services", JSON.stringify(data.serviceAds));
              }
              if (Array.isArray(data.rawMaterialAds)) {
                localStorage.setItem("dastavval_raw_materials", JSON.stringify(data.rawMaterialAds));
              }
              if (Array.isArray(data.sponsoredAds)) {
                localStorage.setItem("dastavval_sponsored_ads_v2", JSON.stringify(data.sponsoredAds));
              }
              cacheB2bConfig(merged).catch(() => {});
            } catch (e) {}
            return merged;
          });
        }
      }
    } catch (e) {
      console.warn("Failed to load B2B config:", e);
    }
  };

  const handleUpdateB2bConfig = async (updatedConfig: any) => {
    const prevConfig = b2bConfig || {};
    const fullMergedConfig = {
      ...prevConfig,
      ...updatedConfig,
      invoiceSettings: {
        ...(prevConfig.invoiceSettings || {}),
        ...(updatedConfig.invoiceSettings || {}),
        bankAccounts: (updatedConfig.invoiceSettings?.bankAccounts && updatedConfig.invoiceSettings.bankAccounts.length > 0)
          ? updatedConfig.invoiceSettings.bankAccounts
          : (prevConfig.invoiceSettings?.bankAccounts || [])
      }
    };

    setB2bConfig(fullMergedConfig);
    try {
      localStorage.setItem("dastavval_b2b_config", JSON.stringify(fullMergedConfig));
      if (Array.isArray(fullMergedConfig.equipmentAds)) {
        localStorage.setItem("dastavval_industrial_equipment", JSON.stringify(fullMergedConfig.equipmentAds));
      }
      if (Array.isArray(fullMergedConfig.serviceAds)) {
        localStorage.setItem("dastavval_industrial_services", JSON.stringify(fullMergedConfig.serviceAds));
      }
      if (Array.isArray(fullMergedConfig.rawMaterialAds)) {
        localStorage.setItem("dastavval_raw_materials", JSON.stringify(fullMergedConfig.rawMaterialAds));
      }
      if (Array.isArray(fullMergedConfig.sponsoredAds)) {
        localStorage.setItem("dastavval_sponsored_ads_v2", JSON.stringify(fullMergedConfig.sponsoredAds));
      }
      window.dispatchEvent(new Event("dastavval-ads-sync"));
      window.dispatchEvent(new CustomEvent("dastavval_ads_updated"));
      window.dispatchEvent(new Event("storage"));
      cacheB2bConfig(fullMergedConfig).catch(() => {});
    } catch (e) {}

    try {
      const res = await fetch(getApiUrl("/api/b2b/config"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fullMergedConfig)
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.config) {
          const finalConfig = {
            ...fullMergedConfig,
            ...data.config,
            invoiceSettings: {
              ...(fullMergedConfig.invoiceSettings || {}),
              ...(data.config.invoiceSettings || {}),
              bankAccounts: (data.config.invoiceSettings?.bankAccounts && data.config.invoiceSettings.bankAccounts.length > 0)
                ? data.config.invoiceSettings.bankAccounts
                : (fullMergedConfig.invoiceSettings?.bankAccounts || [])
            }
          };
          setB2bConfig(finalConfig);
          try {
            localStorage.setItem("dastavval_b2b_config", JSON.stringify(finalConfig));
          } catch (e) {}
        }
      }
    } catch (e) {
      console.error("Failed to update B2B config", e);
    }
  };

  const userRole = user?.role || 'customer';

  const getBadgeDiscountPercent = (badge: 'bronze' | 'silver' | 'gold' | 'vip' | 'admin') => {
    if (userRole === 'factory') return 0; // Factories are suppliers/sellers, not buyers
    switch (badge) {
      case 'silver': return 2;
      case 'gold': return 5;
      case 'vip': return 8;
      case 'admin': return 10;
      default: return 0;
    }
  };

  const getBadgeLabel = (badge: 'bronze' | 'silver' | 'gold' | 'vip' | 'admin') => {
    if (userRole === 'factory') {
      return language === 'en' ? 'Verified Factory Supplier' : language === 'ar' ? 'مورد مصنع معتمد' : 'تامین‌کننده / کارخانه صنایع غذایی';
    }
    switch (badge) {
      case 'silver': return language === 'en' ? 'Silver Partner' : language === 'ar' ? 'شريك فضي' : 'همکار نقره‌ای';
      case 'gold': return language === 'en' ? 'Gold Partner' : language === 'ar' ? 'شريك ذهبي' : 'همکار طلایی';
      case 'vip': return language === 'en' ? 'VIP Elite' : language === 'ar' ? 'النخبة VIP' : 'نماینده ویژه VIP';
      case 'admin': return language === 'en' ? 'HQ Admin' : language === 'ar' ? 'المدير العام' : 'مدیر ارشد مرکزی';
      default: return language === 'en' ? 'Bronze Partner' : language === 'ar' ? 'شريك برونزي' : 'همکار برنزی';
    }
  };

  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 150) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    localStorage.setItem('dastavval_theme', theme);
    const root = window.document.documentElement;
    root.classList.remove('dark', 'classic');
    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'classic') {
      root.classList.add('classic');
    }
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('dastavval_lang', language);
    document.documentElement.lang = language;
    document.documentElement.dir = (language === 'en' || language === 'ru') ? 'ltr' : 'rtl';
  }, [language]);

  useEffect(() => {
    if (userBadge === 'gold' || userBadge === 'vip' || userBadge === 'admin') {
      setInterfaceMode('advanced');
    }
  }, [userBadge]);

  // GitHub Hot-Reload & Cache Busting Version Engine
  useEffect(() => {
    let active = true;
    
    const checkVersion = async (isFirstLoad = false) => {
      try {
        const res = await fetch(`/version.json?_t=${Date.now()}`, { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (data && (data.timestamp || data.version)) {
            if (isFirstLoad) {
              setCurrentVersion(data);
            } else {
              setCurrentVersion(prev => {
                if (prev) {
                  const currentTs = prev.timestamp || prev.version;
                  const newTs = data.timestamp || data.version;
                  if (newTs !== currentTs) {
                    setNewVersionAvailable(true);
                    setNewVersionInfo(data);
                  }
                }
                return prev;
              });
            }
          }
        }
      } catch (e) {
        console.warn("Version check failed:", e);
      }
    };

    // Run first check after a short delay
    const firstTimeout = setTimeout(() => {
      if (active) checkVersion(true);
    }, 3000);

    // Set up polling interval every 120 seconds (much lighter on CPU and network)
    const interval = setInterval(() => {
      if (active) checkVersion(false);
    }, 120000);

    return () => {
      active = false;
      clearTimeout(firstTimeout);
      clearInterval(interval);
    };
  }, []);

  // Restore saved cart and state after a hot update reload
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('dastavval_saved_cart');
      if (savedCart) {
        const parsed = JSON.parse(savedCart);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setCart(parsed);
          setPaletteToast("سبد خرید و فاکتور در دست اقدام شما با موفقیت بازیابی شد! 🛒✨");
          setTimeout(() => setPaletteToast(null), 5000);
        }
        localStorage.removeItem('dastavval_saved_cart');
      }
    } catch (e) {
      console.warn("Restoring saved cart failed:", e);
    }
  }, []);

  const handleApplyLiveUpdate = () => {
    setIsUpdatingState(true);
    try {
      localStorage.setItem('dastavval_saved_cart', JSON.stringify(cart));
    } catch (e) {
      console.warn("Saving cart before hot-update failed:", e);
    }
    
    setTimeout(() => {
      const ts = newVersionInfo?.timestamp || Date.now();
      const url = new URL(window.location.href);
      url.searchParams.set('_v', ts.toString());
      window.location.replace(url.toString());
    }, 1500);
  };

  useEffect(() => {
    initApp();
    const handleOpenAuth = () => {
      setShowAuthModal(true);
    };
    window.addEventListener("open-auth-modal", handleOpenAuth);
    return () => {
      window.removeEventListener("open-auth-modal", handleOpenAuth);
    };
  }, []);

  useEffect(() => {
    const handleSearchAndFocus = (e: Event) => {
      const customEvent = e as CustomEvent<{ productName: string }>;
      if (customEvent.detail && customEvent.detail.productName) {
        setSearchQuery(customEvent.detail.productName);
        
        setTimeout(() => {
          const element = document.getElementById("order-panel-header");
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 200);
      }
    };
    const handleHeaderSearch = (e: Event) => {
      const customEvent = e as CustomEvent<{ query: string }>;
      if (customEvent.detail) {
        setSearchQuery(customEvent.detail.query);
      }
    };
    const handleReloadProducts = () => {
      fetchProducts();
    };
    const handleOpenCatalogModal = (e: Event) => {
      const customEvent = e as CustomEvent<{ markup?: number; autoPrint?: boolean }>;
      if (customEvent && customEvent.detail) {
        if (typeof customEvent.detail.markup === 'number') {
          setCatalogInitialMarkup(customEvent.detail.markup);
        } else {
          setCatalogInitialMarkup(null);
        }
        setCatalogAutoPrint(!!customEvent.detail.autoPrint);
      } else {
        setCatalogInitialMarkup(null);
        setCatalogAutoPrint(false);
      }
      setIsCatalogOpen(true);
    };
    window.addEventListener("search-and-focus-product", handleSearchAndFocus);
    window.addEventListener("header-search", handleHeaderSearch);
    window.addEventListener("reload-products", handleReloadProducts);
    window.addEventListener("open-catalog-modal", handleOpenCatalogModal);
    return () => {
      window.removeEventListener("search-and-focus-product", handleSearchAndFocus);
      window.removeEventListener("header-search", handleHeaderSearch);
      window.removeEventListener("reload-products", handleReloadProducts);
      window.removeEventListener("open-catalog-modal", handleOpenCatalogModal);
    };
  }, []);

  const initApp = async () => {
    try {
      const isCleaned = localStorage.getItem("dastavval_v6_clean");
      if (isCleaned !== "true") {
        const keysToClear = [
          "mock_db_products", "mock_db_factories", "mock_db_news",
          "mock_db_orders", "mock_db_reviews", "dastavval_b2b_config",
          "dastavval_custom_factories", "dastavval_seller_profile",
          "dastavval_price_alerts", "dastavval_raw_orders",
          "dastavval_local_users", "dastavval_user", "dastavval_crm_leads"
        ];
        keysToClear.forEach(key => {
          try { localStorage.removeItem(key); } catch (e) {}
        });
        try { localStorage.setItem("dastavval_v6_clean", "true"); } catch (e) {}
      }
    } catch (e) {}

    // Check Firestore Connection Status in background
    (async () => {
      try {
        const { getDocFromServer, doc: fireDoc } = await import('./lib/data-layer');
        await getDocFromServer(fireDoc(db, '_connection_test_', 'ping'));
        setFirestoreStatus('online');
      } catch (e) {
        setFirestoreStatus('offline');
      }
    })();

    try {
      // 1. FAST PATH: Check IndexedDB Cache
      const [cachedProducts, cachedConfig] = await Promise.all([
        getCachedProducts().catch(() => []),
        getCachedB2bConfig().catch(() => null)
      ]);
      
      let hasCachedData = false;
      if (cachedProducts && cachedProducts.length > 0) {
        setProducts(cachedProducts);
        if (cachedConfig) {
          setB2bConfig(cachedConfig);
        }
        hasCachedData = true;
      } else {
        // Instant local database fallback (so first-time visitors see content immediately)
        try {
          const { getDocs, query, collection, db } = await import('./lib/data-layer');
          const localSnap = await getDocs(query(collection(db, "products")));
          const localItems = localSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          if (localItems && localItems.length > 0) {
            setProducts(localItems);
            hasCachedData = true;
          }
        } catch (e) {
          console.warn("Local seed fallback failed:", e);
        }
      }

      // 2. Schedule non-blocking background fetch so the site is interactive in 500ms
      setTimeout(() => {
        setLoading(false);
      }, 500);

      // 3. BACKGROUND SYNC: Sync data silently in background
      const fetchPromises = Promise.all([
        fetchProducts(true),
        fetchDailyPresentation(),
        fetchB2bConfig(true),
        fetchArticles()
      ]);
      fetchPromises.catch(e => console.warn("Background sync warning:", e));

    } catch (e) {
      console.error("Critical error during init:", e);
      setLoading(false);
    }
  };

  const fetchDailyPresentation = async () => {
    try {
      const res = await fetch(getApiUrl("/api/ai/daily-presentation"));
      const contentType = res.headers.get("content-type");
      if (res.ok && contentType && contentType.includes("application/json")) {
        const data = await res.json();
        setDailyAI(data);
      } else {
        const colors = ["emerald", "indigo", "amber", "sky", "violet"];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];
        const todayStr = new Date().toLocaleDateString('fa-IR');
        setDailyAI({
          color: randomColor,
          dateString: todayStr,
          headline_fa: "خرید مستقیم از خطوط تولید مدرن",
          subheadline_fa: "حذف واسطه‌ها و افزایش سود خرده‌فروشی."
        });
      }
    } catch (err) {
      console.warn("Using fallback daily presentation:", err);
      const colors = ["emerald", "indigo", "amber", "sky", "violet"];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      const todayStr = new Date().toLocaleDateString('fa-IR');
      setDailyAI({
        color: randomColor,
        dateString: todayStr,
        headline_fa: "خرید مستقیم از خطوط تولید مدرن",
        subheadline_fa: "حذف واسطه‌ها و افزایش سود خرده‌فروشی."
      });
    }
  };

  const fetchProducts = async (isBackground = false) => {
    try {
      if (!isBackground) setLoading(true);
      // First try to load from IndexedDB for instant display
      const cached = await getCachedProducts();
      if (cached && cached.length > 0) {
        setProducts(cached);
        setLoading(false);
      }

      // Try fetching from the data layer (which proxies to Firestore or local API)
      const q = query(collection(db, "products"));
      const querySnapshot = await getDocs(q);
      let fetchedProducts = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Product[];
      
      // CRITICAL FALLBACK & AUTO-SYNC: 
      // If after all attempts we have no products, trigger a server-side sync automatically
      if (fetchedProducts.length === 0) {
        console.log("No products found anywhere. Triggering auto-sync...");
        try {
          const syncRes = await fetch(getApiUrl("/api/admin/sync-catalog"), { method: "POST" });
          if (syncRes.ok) {
            const syncJson = await syncRes.json();
            if (syncJson.success) {
              // Now fetch the newly synced products
              const finalFetch = await fetch(getApiUrl("/api/b2b/products"));
              if (finalFetch.ok) {
                const finalJson = await finalFetch.json();
                if (finalJson.success && finalJson.products) {
                  fetchedProducts = finalJson.products;
                }
              }
            }
          }
        } catch (syncErr) {
          console.error("Auto-sync trigger failed:", syncErr);
        }
      }

      if (fetchedProducts.length > 0) {
        setProducts(fetchedProducts);
        // Update cache in background
        await cacheProducts(fetchedProducts);
        // Trigger intelligent S3 bucket asset preloader
        s3PreloadService.preloadBucketAssets(fetchedProducts, { enableLinkPreload: true });
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      // Even on error, try to at least show something from the local API
      try {
        const response = await fetch(getApiUrl("/api/b2b/products"));
        if (response.ok) {
          const jsonRes = await response.json();
          if (jsonRes.success && jsonRes.products) {
            setProducts(jsonRes.products);
            s3PreloadService.preloadBucketAssets(jsonRes.products, { enableLinkPreload: true });
          }
        }
      } catch (e) {
        console.error("Total failure fetching products:", e);
      }
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  const [isSyncingData, setIsSyncingData] = useState(false);
  const [syncToastMessage, setSyncToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (syncToastMessage) {
      const timer = setTimeout(() => {
        setSyncToastMessage(null);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [syncToastMessage]);

  const handleManualSync = async () => {
    setIsSyncingData(true);
    setSyncToastMessage("در حال همگام‌سازی لحظه‌ای تمام داده‌های سامانه و فاکتورها...");
    try {
      // 1. Clear local internal memory database cache
      const { clearLocalCache } = await import('./lib/data-layer');
      clearLocalCache();
      
      // 2. Trigger server-side catalog sync from ParsPack
      try {
        await fetch(getApiUrl("/api/admin/sync-catalog"), { method: "POST" });
      } catch (err) {
        console.warn("Server-side sync issue:", err);
      }
      
      // 3. Clear IndexedDB cache for products to force fresh fetch
      try {
        const { cacheProducts } = await import('./lib/db');
        await cacheProducts([]); // clear cache to force bypass
      } catch (err) {
        console.warn("IndexedDB cache clear issue:", err);
      }

      // 3. Re-initialize and fetch all core data
      await fetchProducts();
      await fetchDailyPresentation();
      await fetchB2bConfig();
      await fetchArticles();

      // 4. Dispatch global event so other panels (UserPanel, AdminPanel, MultiVendorPanel) can reload their local data (like orders)
      window.dispatchEvent(new CustomEvent("dastavval-manual-sync"));
      
      setSyncToastMessage("همگام‌سازی لحظه‌ای با موفقیت انجام شد! تمامی داده‌ها به‌روز شدند.");
      setTimeout(() => {
        setSyncToastMessage(null);
      }, 4000);
    } catch (e) {
      console.error("Error during manual sync:", e);
      setSyncToastMessage("خطایی در همگام‌سازی داده‌ها رخ داد.");
      setTimeout(() => {
        setSyncToastMessage(null);
      }, 3000);
    } finally {
      setIsSyncingData(false);
    }
  };

  const setExactCartQuantity = (product: Product, targetQty: number) => {
    if (!product || !product.id) return;
    const packCount = Math.max(1, product.carton_pack_count || 12);
    let pricePerCarton = 0;
    try {
      const rolePricing = getProductRolePricing(product, user, userBadge);
      pricePerCarton = rolePricing?.pricePerCarton || (product.bulk_price || product.price || 0) * packCount;
    } catch {
      pricePerCarton = (product.bulk_price || product.price || 0) * packCount;
    }

    if (targetQty <= 0) {
      setCart(prev => prev.filter(item => item.productId !== product.id));
    } else {
      setCart(prev => {
        const existingIdx = prev.findIndex(item => item.productId === product.id);
        if (existingIdx > -1) {
          return prev.map((item, idx) => 
            idx === existingIdx
              ? {
                  ...item,
                  quantityCartons: targetQty,
                  totalItems: targetQty * packCount,
                  pricePerCarton
                }
              : item
          );
        } else {
          return [...prev, {
            productId: product.id,
            name: product.name || "کالای بدون نام",
            quantityCartons: targetQty,
            pricePerCarton,
            totalItems: targetQty * packCount,
            image_url: product.image_url || "",
            unitsPerCarton: packCount
          }];
        }
      });
    }
  };

  const addToCart = (product: Product, quantityCartons: number) => {
    if (!product || !product.id) {
      console.error("addToCart: Invalid product object", product);
      return;
    }
    const moq = Math.max(5, product.min_order_cartons || b2bConfig?.minOrderCartons || 5);
    const requestedQty = Math.round(Number(quantityCartons) || moq);
    const qty = Math.max(moq, requestedQty);
    const packCount = Math.max(1, product.carton_pack_count || 12);

    setCart(prev => {
      try {
        const existing = prev.find(item => item.productId === product.id);
        let pricePerCarton = 0;
        try {
          const rolePricing = getProductRolePricing(product, user, userBadge);
          pricePerCarton = rolePricing?.pricePerCarton || (product.bulk_price || product.price || 0) * packCount;
        } catch (err) {
          console.error("Error calculating role pricing in addToCart:", err);
          pricePerCarton = (product.bulk_price || product.price || 0) * packCount;
        }

        if (existing) {
          return prev.map(item => 
            item.productId === product.id 
              ? { 
                  ...item, 
                  quantityCartons: item.quantityCartons + qty,
                  totalItems: (item.quantityCartons + qty) * packCount,
                  pricePerCarton,
                  image_url: product.image_url || item.image_url
                }
              : item
          );
        }
        return [...prev, { 
          productId: product.id, 
          name: product.name || "کالای بدون نام", 
          quantityCartons: qty, 
          pricePerCarton,
          totalItems: qty * packCount,
          image_url: product.image_url || "",
          unitsPerCarton: packCount
        }];
      } catch (err) {
        console.error("Failed to update cart state:", err);
        return prev;
      }
    });
    // Do not automatically pop open checkout modal on every add to cart
  };

  const addMultipleToCart = (items: { product: Product; quantityCartons: number }[]) => {
    if (!Array.isArray(items)) {
      console.error("addMultipleToCart: items is not an array", items);
      return;
    }
    setCart(prev => {
      try {
        let currentCart = [...prev];
        items.forEach(({ product, quantityCartons }) => {
          if (!product || !product.id) return;
          const qty = Math.max(1, Math.round(Number(quantityCartons) || 1));
          const packCount = Math.max(1, product.carton_pack_count || 12);
          
          const existingIdx = currentCart.findIndex(item => item.productId === product.id);
          let pricePerCarton = 0;
          try {
            const rolePricing = getProductRolePricing(product, user, userBadge);
            pricePerCarton = rolePricing?.pricePerCarton || (product.bulk_price || product.price || 0) * packCount;
          } catch (err) {
            console.error("Error calculating role pricing in addMultipleToCart:", err);
            pricePerCarton = (product.bulk_price || product.price || 0) * packCount;
          }

          if (existingIdx > -1) {
            currentCart[existingIdx] = {
              ...currentCart[existingIdx],
              quantityCartons: currentCart[existingIdx].quantityCartons + qty,
              totalItems: (currentCart[existingIdx].quantityCartons + qty) * packCount,
              pricePerCarton,
              image_url: product.image_url || currentCart[existingIdx].image_url
            };
          } else {
            currentCart.push({
              productId: product.id,
              name: product.name || "کالای بدون نام",
              quantityCartons: qty,
              pricePerCarton,
              totalItems: qty * packCount,
              image_url: product.image_url || "",
              unitsPerCarton: packCount
            });
          }
        });
        return currentCart;
      } catch (err) {
        console.error("Failed to add multiple items to cart:", err);
        return prev;
      }
    });
    // Do not automatically pop open checkout modal on every add to cart
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.productId !== productId));
  };

  const totalAmount = cart.reduce((sum, item) => sum + (item.pricePerCarton * item.quantityCartons), 0);

  const handleCheckout = async () => {
    setCheckoutError("");

    // Minimum Order checks
    const minAmount = b2bConfig.minOrderAmount || 10000000;
    const minCartons = b2bConfig.minOrderCartons || 5;
    const totalCartonsInCart = cart.reduce((sum, item) => sum + item.quantityCartons, 0);

    if (totalAmount < minAmount) {
      setCheckoutError(`حداقل مبلغ سفارش از دست اول ${minAmount.toLocaleString()} تومان می‌باشد. (مبلغ فعلی شما: ${totalAmount.toLocaleString()} تومان)`);
      return;
    }

    if (totalCartonsInCart < minCartons) {
      setCheckoutError(`حداقل تعداد سفارش از دست اول ${minCartons} کارتن می‌باشد. (تعداد فعلی: ${totalCartonsInCart} کارتن)`);
      return;
    }

    if (!user) {
      setShowAuthModal(true);
      setCheckoutError("لطفاً ابتدا ثبت‌نام کرده یا وارد حساب کاربری خود شوید.");
      return;
    }

    if (!buyerName || !buyerPhone || !buyerAddress) {
      setCheckoutError(language === 'en' ? "Please complete the delivery information." :
                       language === 'ar' ? "يرجى إكمال معلومات التسليم بالكامل." :
                       language === 'ru' ? "Пожалуйста, полностью заполните информацию о доставке." :
                       "لطفا اطلاعات تحویل گیرنده را به طور کامل تکمیل کنید.");
      return;
    }

    setOrderStatus('processing');
    try {
      // 1. Calculate Partner Loyalty (Badge) discount
      const badgeDiscountPercent = getBadgeDiscountPercent(userBadge);
      const badgeDiscountAmount = Math.round(totalAmount * (badgeDiscountPercent / 100));
      
      // 2. Determine if cheque or cash payment
      const isCheque = paymentMethod === 'full_check' || paymentMethod === 'half_check';
      
      // 3. Calculate Tiered Bulk Discount (Volume/Quantity) - only if NOT cheque!
      const totalQuantity = cart.reduce((sum, item) => sum + item.quantityCartons, 0);
      const bulkDiscount = !isCheque ? getBestDiscount(totalAmount, totalQuantity) : { percent: 0, type: 'none' };
      const hasTierDiscount = bulkDiscount.percent > 0;

      // 4. Calculate Cash/Cheque differences
      let paymentDiscountAmount = 0;
      let paymentPriceDifference = 0;

      if (paymentMethod === 'cash') {
        // Only apply 5% cash discount if there is NO tiered discount active!
        if (!hasTierDiscount) {
          paymentDiscountAmount = Math.round((totalAmount - badgeDiscountAmount) * 0.05); // 5% cash discount
        }
      } else if (paymentMethod === 'full_check') {
        paymentPriceDifference = Math.round((totalAmount - badgeDiscountAmount) * 0.10); // 10% markup for full check
      }

      const bulkDiscountAmount = hasTierDiscount 
        ? Math.round((totalAmount - badgeDiscountAmount) * (bulkDiscount.percent / 100))
        : 0;

      const finalAmount = totalAmount - badgeDiscountAmount - paymentDiscountAmount - bulkDiscountAmount + paymentPriceDifference;

      // 5. بررسی شرایط خرید چکی و سقف اعتبار مشتری (buyerCredit)
      // سقف اعتبار چکی اولیه پایه ۵۰ میلیون تومان (از مجموع خرید ۱۰۰ میلیون تومانی ۵۰٪ نقد + ۵۰٪ چک)
      const allowedChequeCredit = Number((user as any)?.buyerCredit ?? (b2bConfig?.buyerCredit ?? 50000000));
      
      let actualChequeAmount = 0;
      let actualCashAmount = 0;

      if (paymentMethod === 'half_check') {
        const standardHalf = Math.round(finalAmount * 0.5);
        if (standardHalf <= allowedChequeCredit) {
          actualChequeAmount = standardHalf;
          actualCashAmount = finalAmount - actualChequeAmount;
        } else {
          // اگر فاکتور بیش از سقف باشد، سهم چک در سقف مجاز فیکس شده و الباقی نقد دریافت می‌شود
          actualChequeAmount = allowedChequeCredit;
          actualCashAmount = finalAmount - allowedChequeCredit;
        }
      } else if (paymentMethod === 'full_check') {
        // اعتبارسنجی خرید تمام چکی: بررسی اینکه آیا کل مبلغ فاکتور کمتر از یا مساوی اعتبار باقیمانده مشتری (buyerCredit) است یا خیر
        if (finalAmount > allowedChequeCredit) {
          setCheckoutError(`کل مبلغ فاکتور خرید تمام‌چکی (${finalAmount.toLocaleString()} تومان) بیشتر از سقف اعتبار باقیمانده شما (${allowedChequeCredit.toLocaleString()} تومان) می‌باشد. طبق اساس‌نامه خرید چکی، برای سفارش‌های بالاتر از سقف اعتبار می‌توانید از روش «نصف نقد / نصف چک» استفاده فرمایید تا مبلغ ${allowedChequeCredit.toLocaleString()} تومان را چک و مابقی (${(finalAmount - allowedChequeCredit).toLocaleString()} تومان) را نقدی تسویه نمایید.`);
          setOrderStatus('idle');
          return;
        }
        actualChequeAmount = finalAmount;
        actualCashAmount = 0;
      }

      // Create Order in Firestore
      const trackingNumber = `DX-${Math.floor(1000 + Math.random() * 9000)}`;
      
      const firstItemProd = products.find(p => p.id === cart[0].productId);
      const orderSellerId = firstItemProd?.sellerId || "";
      const orderSellerName = firstItemProd?.sellerName || "گروه صنایع غذایی به‌آرا (چی‌توز)";

      const storedAffiliateRepId = typeof window !== 'undefined' ? localStorage.getItem('dastavval_affiliate_rep_id') : null;
      const orderData: any = {
        buyerName: buyerName || user?.name || "خریدار محترم",
        buyerPhone: buyerPhone || user?.phone || user?.mobile || "",
        buyerAddress: buyerAddress || user?.address || `تحویل در استان ${userProvince} - شهر ${userCity}`,
        buyerCompany: buyerCompany || user?.company || "فروشگاه عمده",
        items: cart,
        totalAmount: finalAmount,
        originalAmount: totalAmount,
        discountAmount: badgeDiscountAmount + paymentDiscountAmount + bulkDiscountAmount,
        discountBreakdown: {
          badge: badgeDiscountAmount,
          bulk: bulkDiscountAmount,
          cash: paymentDiscountAmount,
          checkMarkup: paymentPriceDifference
        },
        paymentMethod,
        chequeShareAmount: actualChequeAmount,
        cashShareAmount: actualCashAmount,
        chequeCreditLimit: allowedChequeCredit,
        shippingMethod,
        receiptUrl: paymentReceiptImage || null,
        status: 'order_received',
        paymentStatus: paymentMethod === 'cash' ? 'paid' : 'pending',
        sellerId: orderSellerId,
        sellerName: orderSellerName,
        createdAt: serverTimestamp(),
        trackingNumber
      };

      if (storedAffiliateRepId) {
        orderData.affiliateRepId = storedAffiliateRepId;
        orderData.affiliateCommissionAmount = Math.round(finalAmount * 0.05);
      }

      await addDoc(collection(db, "orders"), orderData);

      // Sync with B2B CRM System
      await recordCRMOrder(buyerName, buyerPhone, buyerCompany || "پخش عمده", finalAmount);

      // Register and update user in user management store
      try {
        const { syncUserFromOrder } = await import('./lib/user-sync-helper');
        await syncUserFromOrder({
          buyerName,
          buyerPhone,
          buyerCompany,
          buyerAddress,
          city: orderData.city || "تهران",
          totalAmount: finalAmount,
          finalPayableAmount: finalAmount
        });
      } catch (userSyncErr) {
        console.warn("Could not sync user from order in App:", userSyncErr);
      }

      // Record affiliate commission for representative if applicable
      if (storedAffiliateRepId) {
        try {
          const { addRepCommission } = await import('./lib/leads-store');
          addRepCommission(
            Math.round(finalAmount * 0.05),
            `پورسانت ۵٪ فروش با لینک افیلیت سفارش ${trackingNumber}`,
            trackingNumber,
            storedAffiliateRepId
          );
        } catch (e) {
          console.warn("Could not record representative affiliate commission:", e);
        }
      }

      // Trigger automatic Invoice SMS with static factor path to buyer
      try {
        const cleanOrderCode = String(trackingNumber || '')
          .replace(/[۰-۹]/g, d => "0123456789"["۰۱۲۳۴۵۶۷۸۹".indexOf(d)])
          .replace(/[٠-٩]/g, d => "0123456789"["٠١٢٣٥٦٧٨٩".indexOf(d)])
          .replace(/\D/g, '') || String(trackingNumber || '3360');

        fetch(getApiUrl("/api/sms/send-invoice-sms"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phone: buyerPhone,
            buyerName: buyerName || "خریدار محترم (عامل توزیع)",
            orderId: cleanOrderCode,
            origin: window.location.origin
          })
        }).catch(err => console.warn("Auto invoice SMS notification trigger:", err));
      } catch (e) {
        console.warn("Could not dispatch invoice SMS:", e);
      }

      // Register regional fulfillment task and notify regional representative
      registerRegionalOrderFromCheckout({
        orderId: trackingNumber,
        buyerName,
        buyerCompany: buyerCompany || "مشتری فروشگاه",
        buyerPhone,
        buyerAddress,
        city: user?.city || "مشهد",
        province: user?.province || "خراسان رضوی",
        items: cart,
        totalAmount: finalAmount,
        originalAmount: totalAmount
      });

      setLastOrderTracking(trackingNumber);
      setLastOrderAmount(finalAmount);
      setOrderStatus('success');
      setShowOrderSuccess(true);
      
      setTimeout(() => {
        setCart([]);
        setOrderStatus('idle');
        setIsCartOpen(false);
      }, 3000);
    } catch (error) {
      console.error("Checkout error:", error);
      setOrderStatus('idle');
    }
  };

  const activeProducts = useMemo(() => {
    return products.filter(product => {
      if (!product) return false;
      const isProdDisabled = product.disabled === true || 
        (product as any).is_active === false || 
        (product as any).active === false || 
        (product as any).isActive === false || 
        (product as any).status === 'inactive' || 
        (product as any).status === 'disabled' || 
        (product as any).status === 'off' || 
        (product as any).status === 'deactive' || 
        String(product.disabled) === 'true' || 
        String(product.disabled) === '1' || 
        String(product.disabled) === 'yes' ||
        String((product as any).is_active) === 'false' ||
        String((product as any).is_active) === '0' ||
        String((product as any).active) === 'false' ||
        String((product as any).active) === '0' ||
        String((product as any).isActive) === 'false';
      if (isProdDisabled) return false;

      if (product.approvalStatus === 'rejected') return false;
      if ((product.approvalStatus === 'pending' || product.isApproved === false) && userRole !== 'admin') {
        return false;
      }
      return true;
    });
  }, [products, userRole]);

  // Smart Caching & Memoized Computation System (سیستم کش‌گذاری هوشمند محصولات و پردازش‌های ویژه)
  const memoizedProductCache = useMemo(() => {
    const cacheMap = new Map<string, Product>();
    products.forEach(p => {
      if (p && p.id) cacheMap.set(p.id, p);
    });
    return cacheMap;
  }, [products]);

  const memoizedSpecialOffers = useMemo(() => {
    return activeProducts.filter(p => p.discount_percent || p.isHotFireDeal || p.isLiquid || p.isSurplus || p.isSediment);
  }, [activeProducts]);

  const memoizedAds = useMemo(() => {
    const list = b2bConfig?.ads || [];
    return list.filter((ad: any) => ad.status === 'approved' && !(ad.id && String(ad.id).startsWith("ad-init-")));
  }, [b2bConfig?.ads]);

  const memoizedRawMaterials = useMemo(() => {
    return activeProducts.filter(p => p.category === 'materials' || p.category === 'raw' || (p as any).isRawMaterial);
  }, [activeProducts]);

  const filteredProducts = useMemo(() => {
    return activeProducts.filter(product => {
      // Filter out-of-stock products if hideOutOfStock is enabled
      const isOutOfStock = product.stock_quantity_cartons !== undefined && product.stock_quantity_cartons <= 0;
      if (hideOutOfStock && isOutOfStock) return false;

      const matchesCategory = activeCategory === "همه" || product.category === activeCategory;
      const matchesBrand = selectedBrand === "همه" || product.brand === selectedBrand;
      
      const normalizeStr = (str: string) => (str || "")
        .toLowerCase()
        .replace(/[يى]/g, "ی")
        .replace(/ك/g, "ک")
        .replace(/‌/g, " ")
        .trim();

      const q = normalizeStr(searchQuery);
      const matchesSearch = q === "" || 
        normalizeStr(product.name).includes(q) ||
        normalizeStr(product.brand).includes(q) ||
        normalizeStr(product.description || "").includes(q) ||
        normalizeStr((product as any).factory_name || "").includes(q);
        
      // Apply Special Filter (ویژه / رسوب / مازاد)
      let matchesSpecial = true;
      if (specialFilter === 'special') {
        matchesSpecial = (product as any).isFloorMarket === true || 
          (product as any).isKafBazar === true || 
          (product as any).isKafBazaar === true || 
          (product as any).isSpecial === true || 
          (product as any).isFeatured === true;
      } else if (specialFilter === 'sediment') {
        matchesSpecial = (product as any).isSediment === true || 
          (product as any).isLiquid === true || 
          (typeof (product as any).sedimentDiscountPercent !== 'undefined' && Number((product as any).sedimentDiscountPercent) > 0);
      } else if (specialFilter === 'surplus') {
        matchesSpecial = (product as any).isSurplus === true || 
          (typeof (product as any).surplusDiscountPercent !== 'undefined' && Number((product as any).surplusDiscountPercent) > 0);
      }

      return matchesCategory && matchesBrand && matchesSearch && matchesSpecial;
    }).sort((a, b) => {
      // Custom Sorting Options
      if (sortBy === 'price-asc') {
        return (a.bulk_price || 0) - (b.bulk_price || 0);
      }
      if (sortBy === 'price-desc') {
        return (b.bulk_price || 0) - (a.bulk_price || 0);
      }
      if (sortBy === 'newest') {
        const aNew = a.isNew ? 1 : 0;
        const bNew = b.isNew ? 1 : 0;
        if (aNew !== bNew) return bNew - aNew;
        return String(b.id).localeCompare(String(a.id));
      }
      if (sortBy === 'best-selling') {
        const aRate = a.rating || 4;
        const bRate = b.rating || 4;
        if (aRate !== bRate) return bRate - aRate;
        const aFav = a.isFavorite ? 1 : 0;
        const bFav = b.isFavorite ? 1 : 0;
        return bFav - aFav;
      }

      // Default Sorting (Sponsored & BoostScore & Rotational Shuffle)
      const aSponsored = a.isSponsored ? 1 : 0;
      const bSponsored = b.isSponsored ? 1 : 0;
      if (aSponsored !== bSponsored) {
        return bSponsored - aSponsored;
      }
      
      const aBoost = a.boostScore || 0;
      const bBoost = b.boostScore || 0;
      if (aBoost !== bBoost) {
        return bBoost - aBoost;
      }
      
      // In direct buying list mode or wholesale order tab, maintain 100% stable sorting to prevent item jumping
      if (viewMode === 'list' || activeTab === 'order') {
        const idA = Number(a.id) || 0;
        const idB = Number(b.id) || 0;
        if (idA && idB) return idA - idB;
        return String(a.id || "").localeCompare(String(b.id || ""));
      }

      // Dynamic Session Rotational Shuffle (Only in presentation showcase)
      const hashA = ((a.id ? String(a.id).charCodeAt(0) : 0) + (a.name ? a.name.charCodeAt(0) : 0) + rotationOffset) % 100;
      const hashB = ((b.id ? String(b.id).charCodeAt(0) : 0) + (b.name ? b.name.charCodeAt(0) : 0) + rotationOffset) % 100;
      return hashB - hashA;
    });
  }, [activeProducts, activeCategory, selectedBrand, searchQuery, sortBy, rotationOffset, hideOutOfStock, viewMode, activeTab, specialFilter]);

  const getBadgeDetails = (badge: string) => {
    switch(badge) {
      case 'vip':
        return { name: '👑 شریک تجاری VIP (ویژه)', discount: '۲۲٪ تخفیف کلان', color: 'from-purple-600 to-emerald-800', text: 'text-purple-100', emoji: '👑', desc: 'اولویت در تامین، ترانزیت ترجیحی یا ارسال مستقیم با هماهنگی کارخانه' };
      case 'gold':
        return { name: '🥇 عضو طلایی (بنکدار ممتاز)', discount: '۱۲٪ تخفیف کلان', color: 'from-amber-500 to-yellow-600', text: 'text-amber-50', emoji: '🥇', desc: 'تسویه مدت‌دار ۳۰ روزه با چک صیادی تایید شده' };
      case 'silver':
        return { name: '🥈 عضو نقره‌ای (فروشگاه باسابقه)', discount: '۵٪ تخفیف کلان', color: 'from-slate-400 to-slate-600', text: 'text-slate-100', emoji: '🥈', desc: 'تخفیف نقره‌ای دائم بر روی کل سبد خرید عمده' };
      case 'admin':
        return { name: '🛡️ مدیر کل سیستم (Admin HQ)', discount: '۲۲٪ تخفیف همکار + دسترسی ادمین', color: 'from-red-600 to-rose-700', text: 'text-rose-100', emoji: '🛡️', desc: 'کنترل کامل تراکنش‌ها، کالاها و مناقصات ملی' };
      default:
        return { name: '🥉 عضو برنزی (فروشگاه جدید)', discount: 'قیمت پایه کارخانه بدون تخفیف', color: 'from-orange-700 to-amber-800', text: 'text-orange-100', emoji: '🥉', desc: 'خرید مستقیم بی‌واسطه از درب کارخانجات با هماهنگی فاکتور مستقیم' };
    }
  };


  const handleLogout = () => {
    // Clear user state
    setUser(null);
    setUserBadge('bronze');
    
    // Clear session and cookies
    clearUserSession();

    // Set tab to presentation
    setActiveTab('presentation');
    
    // Perform a clean redirect/reload to reset all states completely
    setTimeout(() => {
      window.location.href = "/";
    }, 150);
  };

  const handleUpdateUser = (updatedUser: any) => {
    setUser(updatedUser);
    saveUserSession(updatedUser);
  };

  // Load user session on mount (from localStorage or cookies via auth-helper)
  useEffect(() => {
    const savedUser = getUserSession();
    if (savedUser) {
      setUser(savedUser);
      if (savedUser.badge) {
        setUserBadge(savedUser.badge as any);
      } else if (savedUser.role === 'admin') {
        setUserBadge('admin');
      }
    }
    // Verify and persist all JSON data structures (users, ads, factories, orders) on startup
    ResilientVault.verifyAndPersistAllData().catch(err => console.warn("Initial data verification sync error:", err));
  }, []);

  // Pre-fill buyer details when user is logged in
  useEffect(() => {
    if (user) {
      if (user.name) setBuyerName(user.name);
      if (user.phone || user.mobile) setBuyerPhone(user.phone || user.mobile || "");
      if (user.company) setBuyerCompany(user.company);
      if (user.address) setBuyerAddress(user.address);
      if (user.city) {
        setUserCity(user.city);
        localStorage.setItem("dastavval_user_city", user.city);
      }
      if (user.province) {
        setUserProvince(user.province);
        localStorage.setItem("dastavval_user_province", user.province);
      }
    }
  }, [user]);

  // Auto PWA Install Prompt disabled to prevent non-intrusive page blocking (Modal opens cleanly on user click)
  useEffect(() => {
    // PWA modal triggers explicitly via navbar button or PWA banner shortcut
  }, []);

  return (
    <div className="min-h-screen transition-colors duration-300 font-sans bg-white text-slate-900" dir={language === 'en' ? 'ltr' : 'rtl'}>
      
      {/* Branded High-Performance Creative White Splash Screen (Initial load only) */}
      <AnimatePresence>
        {showSplash && (
          <SplashScreen
            appName={b2bConfig?.appName}
            appSub={b2bConfig?.appSub}
            logoUrl={b2bConfig?.logoUrl}
            mode="initial_load"
            onFinishLoading={() => {
              setShowSplash(false);
            }}
          />
        )}
      </AnimatePresence>
      
      {/* Dynamic Theme Color Variables Injection */}
      <style dangerouslySetInnerHTML={{ __html: `
        :root {
          --color-emerald-50: ${currentPalette.emerald50} !important;
          --color-emerald-100: ${currentPalette.emerald100} !important;
          --color-emerald-200: ${currentPalette.emerald200} !important;
          --color-emerald-300: ${currentPalette.emerald300} !important;
          --color-emerald-400: ${currentPalette.emerald400} !important;
          --color-emerald-500: ${currentPalette.emerald500} !important;
          --color-emerald-600: ${currentPalette.emerald600} !important;
          --color-emerald-700: ${currentPalette.emerald700} !important;
          --color-emerald-800: ${currentPalette.emerald800} !important;
          --color-emerald-900: ${currentPalette.emerald900} !important;
          
          --color-amber-50: ${currentPalette.amber50} !important;
          --color-amber-100: ${currentPalette.amber100} !important;
          --color-amber-200: ${currentPalette.amber200} !important;
          --color-amber-300: ${currentPalette.amber300} !important;
          --color-amber-400: ${currentPalette.amber400} !important;
          --color-amber-500: ${currentPalette.amber500} !important;
          --color-amber-600: ${currentPalette.amber600} !important;
          --color-amber-700: ${currentPalette.amber700} !important;
          --color-amber-800: ${currentPalette.amber800} !important;
          --color-amber-950: ${currentPalette.amber950} !important;
        }
      ` }} />

      {/* Elegant Toast for Palette Change */}
      <AnimatePresence>
        {paletteToast && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-6 right-6 z-[110] max-w-sm bg-white/95 backdrop-blur-md border border-slate-200 p-4 rounded-2xl shadow-2xl flex items-center gap-3 overflow-hidden"
            dir="rtl"
          >
            <AnimatedHatchedOverlay intensity="light" />
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-700 relative z-10">
              <Palette size={20} />
            </div>
            <div>
              <h5 className="font-black text-slate-800 text-xs">ترکیب رنگی ارگانیک فعال شد!</h5>
              <p className="text-[10px] text-slate-500 font-bold mt-0.5">{paletteToast}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Elegant Toast for Instant Data Sync & Account Notifications */}
      <AnimatePresence>
        {syncToastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-[130] max-w-md bg-white border border-slate-200/80 p-4 rounded-2xl shadow-2xl shadow-slate-300/60 flex items-start gap-3 backdrop-blur-md overflow-hidden"
            dir="rtl"
          >
            <AnimatedHatchedOverlay intensity="light" />
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 relative z-10 ${isSyncingData ? "bg-emerald-600 text-white" : "bg-emerald-500 text-white shadow-sm shadow-emerald-500/20"}`}>
              {isSyncingData ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <CheckCircle2 size={18} />
              )}
            </div>
            <div className="text-right flex-1 min-w-0 pr-1">
              <h5 className="font-black text-slate-900 text-xs">اطلاعیه سیستم و حساب کاربری</h5>
              <p className="text-[11px] text-slate-700 font-bold mt-1 leading-relaxed select-text">{syncToastMessage}</p>
            </div>
            <button
              onClick={() => setSyncToastMessage(null)}
              className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200 flex items-center justify-center transition-all cursor-pointer shrink-0"
              title="بستن پیام"
            >
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* GitHub Hot-Reload & Cache-Buster Live Notification Bar */}
      <AnimatePresence>
        {newVersionAvailable && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="sticky top-0 z-[120] w-full bg-emerald-700 text-white border-b border-emerald-800 shadow-md"
            dir="rtl"
          >
            <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center animate-pulse">
                  <Zap size={16} />
                </div>
                <div className="text-right">
                  <p className="text-[11px] sm:text-xs font-black text-slate-100">
                    🚀 نسخه جدید پلتفرم هم‌اکنون با موفقیت بارگذاری شد!
                  </p>
                  <p className="text-[9px] sm:text-[10px] text-slate-400 font-bold mt-0.5">
                    تغییرات گیت‌هاب در هاست اشتراکی آماده است. می‌توانید بدون تخلیه سبد خرید یا پیش‌فاکتور، کدها را به‌روزرسانی کنید.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setNewVersionAvailable(false)}
                  className="px-3 py-1.5 rounded-lg text-[10px] font-black text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  بعداً
                </button>
                <button
                  type="button"
                  disabled={isUpdatingState}
                  onClick={handleApplyLiveUpdate}
                  className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-black text-[10px] sm:text-xs flex items-center gap-1.5 hover:bg-emerald-400 transition-all cursor-pointer shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                >
                  {isUpdatingState ? (
                    <>
                      <Loader2 size={12} className="animate-spin" />
                      <span>در حال جایگزینی...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={12} />
                      <span>⚡ اعمال آنی کدهای جدید</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 📢 Modern Sleek Top Announcement Banner (b2bConfig.topAnnouncement) */}
      <AnimatePresence>
        {(b2bConfig.showTopAnnouncement !== false && (b2bConfig.topAnnouncement || b2bConfig.showTopAnnouncement)) && !isTopAnnouncementDismissed && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -10 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={{ opacity: 0, height: 0, y: -10 }}
            transition={{ duration: 0.35, ease: "easeInOut" }}
            className="relative z-40 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-slate-950 font-bold text-xs py-1.5 px-3 sm:px-6 shadow-2xs border-b border-amber-300/80 overflow-hidden"
          >
            {/* Background Subtle Glow Shimmer Effect */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.35),transparent_65%)] pointer-events-none" />

            <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 relative z-10">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                {/* Badge Label */}
                <span className="shrink-0 flex items-center gap-1 bg-slate-950 text-amber-300 font-black text-[10px] sm:text-[11px] px-2.5 py-0.5 rounded-full shadow-2xs border border-amber-400/40">
                  <Sparkles size={11} className="text-amber-400 animate-pulse" />
                  <span>اطلاعیه ویژه</span>
                </span>

                {/* Announcement Text */}
                <p className="truncate text-[11px] sm:text-xs font-black text-slate-950 tracking-tight">
                  {b2bConfig.topAnnouncement || "ثبت سفارشات عمده با قیمت مصوب کف کارخانه و ارسال فوری سراسری"}
                </p>
              </div>

              {/* Action Controls */}
              <div className="flex items-center gap-2 shrink-0">
                {(b2bConfig.topAnnouncementPopupContent || b2bConfig.topAnnouncement) && (
                  <button
                    onClick={() => setShowAnnouncementModal(true)}
                    className="text-[10px] sm:text-[11px] font-black bg-slate-950/90 hover:bg-slate-950 text-amber-200 hover:text-white px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 shadow-2xs cursor-pointer"
                  >
                    <span>جزئیات</span>
                    <ChevronRight size={11} className="rotate-180" />
                  </button>
                )}

                <button
                  onClick={() => setIsTopAnnouncementDismissed(true)}
                  title="بستن اطلاعیه"
                  className="p-1 rounded-md text-slate-950/80 hover:text-slate-950 hover:bg-amber-300/60 transition-colors cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Live Wholesale Market Ticker Bar (Top of Site - Admin Toggleable) */}
      {(b2bConfig.showMarketTicker !== false) && (
        <LiveWholesaleMarketTicker 
          products={activeProducts}
          ads={b2bConfig?.ads || []}
          factories={(b2bConfig?.factories || []).filter((f: any) => f && f.isActive !== false)}
          news={b2bConfig?.news || []}
          userBadge={userBadge}
          userCity={userCity}
          activeTab={activeTab}
          onOpenLogistics={() => setShowLogisticsModal(true)}
          onOpenQuickOrder={() => {
            setActiveTab('order');
            setShowQuickMatrixModal(true);
          }}
          onSelectProduct={(p) => {
            setActiveTab('order');
            setSelectedDetailProduct(p);
          }}
          onNavigateTab={(tab) => setActiveTab(tab as any)}
        />
      )}

      {/* Navbar with Cart */}
      <Navbar 
        cartCount={cart.reduce((s, i) => s + i.quantityCartons, 0)} 
        onCartClick={() => setIsCartOpen(true)} 
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        appMode={appMode}
        onModeChange={setAppMode}
        user={user}
        onAuthClick={() => setShowAuthModal(true)}
        onLogout={handleLogout}
        language={language}
        onLanguageChange={setLanguage}
        theme={theme}
        onThemeChange={setTheme}
        interfaceMode={interfaceMode}
        onInterfaceModeChange={setInterfaceMode}
        userBadge={userBadge}
        onUserBadgeChange={setUserBadge}
        themeColor={b2bConfig.primaryColor || "emerald"}
        onMenuClick={() => setIsSidebarOpen(prev => !prev)}
        activeTab={activeTab}
        setActiveTab={setActiveTab as any}
        appName={b2bConfig.appName}
        appSub={b2bConfig.appSub}
        logoUrl={(b2bConfig as any).logoUrl}
        mascotUrl={(b2bConfig as any).mascotUrl}
        topAnnouncement={b2bConfig.topAnnouncement}
        showTopAnnouncement={b2bConfig.showTopAnnouncement}
        onOpenAnnouncementModal={() => setShowAnnouncementModal(true)}
        hqAddress={b2bConfig.hqAddress}
        supportPhone={b2bConfig.supportPhone}
        hideHqAddress={(b2bConfig as any).hideHqAddress}
        hideSupportPhone={(b2bConfig as any).hideSupportPhone}
        onOpenCatalog={() => setIsCatalogOpen(true)}
        onOpenGapGpt={() => setIsGapGptModalOpen(true)}
        onOpenPwaModal={() => setShowPwaModal(true)}
        onOpenCPanelWizard={() => setIsCPanelWizardOpen(true)}
        b2bConfig={b2bConfig}
        selectedCity={userCity}
        onCityChange={(city) => setUserCity(city)}
        onManualSync={handleManualSync}
        isSyncingData={isSyncingData}
        onNavigateToBillboardSubTab={(sub) => {
          setBillboardSubTab(sub);
          setActiveTab('billboard');
        }}
      />

      {/* Floating B2B Action Bar */}
      <B2BFloatingActionBar 
        cartCount={cart.reduce((s, i) => s + i.quantityCartons, 0)}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenQuickOrder={() => setShowQuickMatrixModal(true)}
        onOpenLogistics={() => setShowLogisticsModal(true)}
        onOpenProfitSimulator={() => setActiveTab('profit-simulator')}
        onOpenLoyalty={() => setActiveTab('loyalty')}
        loyaltyPoints={user ? getLoyaltySummary(user?.phone || user?.mobile || user?.id || "guest").currentPoints : 0}
        supportPhone={b2bConfig.supportPhone}
      />

      {/* Logistics Estimator Modal */}
      <LogisticsEstimatorModal 
        isOpen={showLogisticsModal}
        onClose={() => setShowLogisticsModal(false)}
        defaultProvince={userCity || "تهران"}
      />

      {/* Quick Matrix Order Modal */}
      <QuickMatrixOrderModal 
        isOpen={showQuickMatrixModal}
        onClose={() => setShowQuickMatrixModal(false)}
        products={activeProducts}
        onApplyToCart={handleApplyMatrixOrder}
        userBadge={userBadge}
      />

      {/* Main Container with stable min-height to prevent layout jump on desktop */}
      <main className={`w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-3 min-h-[75vh] bg-white ${
        (activeTab === 'presentation' || activeTab === 'about') ? 'pb-0' : 'pb-24 lg:py-6'
      }`}>
        <Suspense fallback={<DashboardSkeleton />}>
          <div className="w-full">
            {activeTab === 'presentation' && (
              <motion.div
                key="presentation"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.15 }}
                className="space-y-6 sm:space-y-8"
              >
                <DynamicPresentation 
                  products={activeProducts} 
                  articles={articles}
                  onEnterPanel={() => setActiveTab('order')} 
                  language={language}
                  theme={theme}
                  dailyAI={dailyAI}
                  b2bConfig={b2bConfig}
                  setActiveTab={setActiveTab}
                  onAddToCart={addToCart}
                  onViewDetails={(prod) => {
                    openProductPage(prod);
                  }}
                  userBadge={userBadge}
                  user={user}
                />
                <AboutUsSection articles={articles} theme={theme} />
                <TrustSection theme={theme} />
                <PublicRepresentatives 
                  theme={theme}
                  userBadge={userBadge}
                  userCity={user?.city}
                  b2bConfig={b2bConfig}
                  products={activeProducts}
                  onOpenDealershipModal={() => {
                    setActiveTab('dealership_request');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                />
              </motion.div>
            )}

            {activeTab === 'order' && (
              <motion.div
                key="order"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                {/* 1. کادر کوتاه، تمیز و متقارن بالای صفحه با ساختار Grid دو ستونه در دسکتاپ، پدینگ بهینه و یکنواخت، سایه نرم و گوشه‌های گرد هماهنگ */}
                <div 
                  id="unified-agency-platform-banner" 
                  className="bg-white border border-slate-200/80 rounded-2xl sm:rounded-3xl p-4 sm:p-5 lg:p-6 shadow-sm shadow-slate-200/50 hover:shadow-md hover:shadow-emerald-500/5 transition-all duration-300 text-right animate-fade-in" 
                  dir="rtl"
                >
                  <div className="grid grid-cols-1 lg:grid-cols-12 items-center gap-3 sm:gap-4">
                    {/* ستون راست (دسکتاپ): هویت مستقیم سفارش، انتخابگر دقیق شهر/استان و کد عاملیت */}
                    <div className="lg:col-span-7 flex flex-wrap items-center justify-between sm:justify-start gap-2.5 sm:gap-3">
                      <div className="flex items-center gap-2.5 sm:gap-3">
                        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-emerald-700 text-white flex items-center justify-center shrink-0 text-base shadow-3xs font-black ring-2 ring-emerald-100">
                          🏭
                        </div>
                        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                          <span className="font-black text-xs sm:text-sm text-slate-900">سفارش مستقیم از کارخانجات</span>
                          <span className="text-[10px] font-bold text-slate-300">|</span>
                          
                          {/* Searchable Province & City Selector directly inside the banner */}
                          <StrictCityProvinceSelector
                            selectedCity={userCity}
                            selectedProvince={userProvince}
                            onSelect={(c, p) => {
                              setUserCity(c);
                              setUserProvince(p);
                            }}
                          />
                        </div>
                      </div>

                      {cityAgency && (
                        <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 rounded-xl text-[11px] shadow-3xs">
                          <span className="text-emerald-800 font-bold">کد عاملیت:</span>
                          <span className="font-mono font-black text-emerald-900 dir-ltr tracking-wide">{cityAgency.agencyCode || cityAgency.id || 'DA-1402-88'}</span>
                        </div>
                      )}
                    </div>

                    {/* ستون چپ (دسکتاپ): دکمه‌های عملیاتی، تماس مستقیم و وضعیت عاملیت */}
                    <div className="lg:col-span-5 flex items-center justify-start lg:justify-end gap-2 flex-wrap">
                      {/* دکمه ۱: وضعیت عاملیت فعال یا اخذ عاملیت */}
                      {cityAgency ? (
                        <>
                          <button
                            type="button"
                            onClick={() => setIsRepDetailsExpanded(!isRepDetailsExpanded)}
                            className="h-9 sm:h-9.5 px-3.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-xl sm:rounded-2xl font-black text-xs transition-all cursor-pointer shadow-3xs hover:shadow-xs active:scale-95 flex items-center gap-2"
                            title="مشاهده مشخصات و پروانه عاملیت"
                          >
                            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                            <span>عاملیت رسمی {userCity}</span>
                            <ChevronDown size={14} className={`transition-transform duration-200 text-emerald-700 ${isRepDetailsExpanded ? 'rotate-180' : ''}`} />
                          </button>

                          <a
                            href={`tel:${cityAgency.phone || '09121234567'}`}
                            className="h-9 sm:h-9.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl sm:rounded-2xl font-black text-xs transition-all flex items-center gap-1.5 shadow-3xs hover:shadow-xs active:scale-95"
                            title="تماس تلفنی مستقیم با عاملیت"
                          >
                            <Phone size={13} />
                            <span className="font-mono text-[11px] dir-ltr hidden sm:inline">{cityAgency.phone || '۰۹۱۲۱۲۳۴۵۶۷'}</span>
                            <span className="sm:hidden">تماس</span>
                          </a>
                        </>
                      ) : (
                        <button 
                          type="button"
                          onClick={() => setActiveTab('dealership_request')}
                          className="h-9 sm:h-9.5 px-3.5 bg-gradient-to-r from-amber-50 to-amber-100 hover:from-amber-100 hover:to-amber-200 text-amber-900 border border-amber-300 rounded-xl sm:rounded-2xl font-black text-xs transition-all cursor-pointer shadow-3xs hover:shadow-xs active:scale-95 flex items-center gap-2"
                        >
                          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                          <span>اخذ عاملیت {userCity}</span>
                        </button>
                      )}

                      {/* دکمه ۲: معرفی پلتفرم */}
                      <button
                        type="button"
                        onClick={() => setActiveTab('presentation')}
                        className="h-9 sm:h-9.5 px-3 sm:px-3.5 bg-slate-50 hover:bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl sm:rounded-2xl font-black text-xs transition-all cursor-pointer shadow-3xs hover:shadow-xs active:scale-95 flex items-center gap-1.5"
                      >
                        <span>ℹ️</span>
                        <span>معرفی</span>
                      </button>
                    </div>
                  </div>

                  {/* پنل کشویی دو ستونه کارتونی و متقارن اطلاعات کامل نماینده */}
                  <AnimatePresence>
                    {cityAgency && isRepDetailsExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0, y: -8 }}
                        animate={{ opacity: 1, height: "auto", y: 0 }}
                        exit={{ opacity: 0, height: 0, y: -8 }}
                        className="bg-gradient-to-br from-emerald-50/40 via-white to-slate-50 border-2 border-emerald-500/30 rounded-2xl p-4 mt-3 shadow-md text-right overflow-hidden relative"
                      >
                        {/* نشان ویژه بالای کارت */}
                        <div className="flex items-center justify-between pb-3 mb-3 border-b border-emerald-100/80">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-sm shadow-sm ring-2 ring-emerald-200">
                              📑
                            </div>
                            <div>
                              <h4 className="text-xs sm:text-sm font-black text-slate-900">
                                پروانه و شناسنامه عاملیت رسمی استان {getProvinceForCity(cityAgency.city || userCity, cityAgency.province || userProvince)} - شهرستان {cityAgency.city || userCity}
                              </h4>
                              <p className="text-[10px] font-bold text-slate-500">پشتیبانی و توزیع مستقیم محصولات کارخانجات</p>
                            </div>
                          </div>
                          <div className="bg-emerald-100 text-emerald-900 text-[10.5px] font-black px-3 py-1 rounded-full border border-emerald-300 flex items-center gap-1.5 shadow-2xs">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                            <span>عاملیت فعال و تاییدشده</span>
                          </div>
                        </div>

                        {/* ساختار کارتونی متقارن ۲ ستونه با سایه‌ها و حاشیه‌های نرم‌تر */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                          {/* ستون راست: هویت و کد نمایندگی */}
                          <div className="bg-white border border-slate-100 rounded-2xl p-4 space-y-3.5 shadow-sm shadow-slate-200/40 hover:shadow-md hover:border-emerald-300 transition-all duration-300 relative overflow-hidden">
                            <div className="flex items-center gap-2 border-b border-slate-50 pb-2.5">
                              <span className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center text-xs font-black shadow-3xs">🏢</span>
                              <span className="font-black text-slate-800 text-xs">مشخصات مدیریت و مجموعه</span>
                            </div>

                            <div className="space-y-3">
                              <div className="flex justify-between items-center bg-slate-50/60 p-2.5 rounded-xl border border-slate-100/50">
                                <span className="text-slate-500 font-bold text-[11px]">👤 مدیر عاملیت:</span>
                                <strong className="text-slate-900 font-black text-xs">
                                  {cityAgency.name || cityAgency.displayName || cityAgency.representative || 'نماینده رسمی دست اول'}
                                </strong>
                              </div>

                              <div className="flex justify-between items-center bg-slate-50/60 p-2.5 rounded-xl border border-slate-100/50">
                                <span className="text-slate-500 font-bold text-[11px]">🏢 نام شرکت / بنکداری:</span>
                                <strong className="text-slate-900 font-black text-xs">
                                  {cityAgency.company || cityAgency.agencyName || 'شرکت توزیع و پخش دست اول'}
                                </strong>
                              </div>

                              <div className="flex justify-between items-center bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-100">
                                <span className="text-emerald-900 font-black text-[11px]">🔑 کد انحصاری عاملیت:</span>
                                <strong className="text-emerald-800 font-black font-mono text-sm sm:text-base tracking-wider bg-white px-2.5 py-1 rounded-lg border border-emerald-200/80 shadow-3xs">
                                  {cityAgency.agencyCode || cityAgency.id || 'DA-1402-88'}
                                </strong>
                              </div>
                            </div>
                          </div>

                          {/* ستون چپ: ارتباطات و لجیستیک انبار */}
                          <div className="bg-white border border-slate-100 rounded-2xl p-4 space-y-3.5 shadow-sm shadow-slate-200/40 hover:shadow-md hover:border-emerald-300 transition-all duration-300 relative overflow-hidden">
                            <div className="flex items-center gap-2 border-b border-slate-50 pb-2.5">
                              <span className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center text-xs font-black shadow-3xs">📞</span>
                              <span className="font-black text-slate-800 text-xs">ارتباط مستقیم و تحویل بار</span>
                            </div>

                            <div className="space-y-3">
                              <div className="flex justify-between items-center bg-slate-50/60 p-2.5 rounded-xl border border-slate-100/50">
                                <span className="text-slate-500 font-bold text-[11px]">📞 شماره تماس مستقیم:</span>
                                <strong className="text-emerald-800 font-mono font-black text-sm sm:text-base text-left tracking-wider bg-white px-2.5 py-1 rounded-lg border border-slate-100 shadow-3xs" dir="ltr">
                                  {cityAgency.phone || cityAgency.mobile || cityAgency.tel || '۰۹۱۲۱۲۳۴۵۶۷'}
                                </strong>
                              </div>

                              <div className="flex justify-between items-center bg-slate-50/60 p-2.5 rounded-xl border border-slate-100/50">
                                <span className="text-slate-500 font-bold text-[11px]">📍 استان و شهرستان:</span>
                                <strong className="text-slate-900 font-black text-xs">
                                  {getProvinceForCity(cityAgency.city || userCity, cityAgency.province || userProvince)} - {cityAgency.city || userCity}
                                </strong>
                              </div>

                              <div className="bg-slate-50/60 p-2.5 rounded-xl border border-slate-100/50 space-y-1">
                                <span className="text-slate-500 font-bold text-[10.5px]">🚛 آدرس انبار و تحویل بار:</span>
                                <p className="text-slate-800 font-black text-[11px] leading-relaxed">
                                  {cityAgency.address || `انبار مرکزی توزیع و باربری مجاز شهرستان ${cityAgency.city || userCity}`}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* دکمه‌های عملیاتی سفارشی با طراحی کارتونی */}
                        <div className="mt-3.5 pt-3 border-t border-emerald-100 flex flex-wrap gap-2 justify-end items-center">
                          <a
                            href={`tel:${cityAgency.phone || cityAgency.mobile || cityAgency.tel || '09121234567'}`}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-black rounded-xl transition-all flex items-center gap-1.5 shadow-md shadow-emerald-600/20 cursor-pointer"
                          >
                            <span>📞 تماس مستقیم تلفنی</span>
                          </a>
                          <button
                            type="button"
                            onClick={() => setIsRepDetailsExpanded(false)}
                            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 text-xs font-black rounded-xl transition-all cursor-pointer border border-slate-200"
                          >
                            بستن پنل
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* 2. کادر یکپارچه کنترل کاتالوگ: جستجو، حالت نمایش و فیلترهای کشویی (متقارن، هم‌وزن و بدون شلوغی) */}
                <div id="unified-catalog-control-center" className="bg-white p-2.5 sm:p-3 rounded-2xl border border-slate-200 shadow-2xs space-y-2 text-right" dir="rtl">
                  {/* ردیف اول: جستجوی اصلی + دکمه فیلترهای کشویی (کاملاً هم‌راستا و هم‌ارتفاع) */}
                  <div className="flex items-center gap-2">
                    {/* کادر جستجوی سریع */}
                    <div className="relative flex-1">
                      <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                      <input
                        type="text"
                        placeholder="جستجوی کالا، برند یا کارخانه..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pr-10 pl-12 h-11 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-black focus:outline-none focus:border-emerald-600 focus:bg-white transition-all shadow-3xs"
                      />
                      <div className="absolute left-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                        <VoiceSearchButton onResult={(text) => setSearchQuery(text)} />
                        {searchQuery && (
                          <button 
                            type="button"
                            onClick={() => setSearchQuery("")}
                            className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
                            title="پاک کردن جستجو"
                          >
                            <X size={15} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* دکمه باز و بسته کردن فیلترهای کشویی */}
                    <button
                      type="button"
                      onClick={() => setIsFiltersExpanded(!isFiltersExpanded)}
                      className={`h-11 px-3 sm:px-4 rounded-xl border text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shrink-0 shadow-3xs ${
                        isFiltersExpanded || activeCategory !== "همه" || selectedBrand !== "همه"
                          ? "bg-emerald-50 text-emerald-800 border-emerald-300 ring-2 ring-emerald-500/10"
                          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                      }`}
                      title="فیلتر دسته‌بندی و کارخانجات"
                    >
                      <Filter size={15} className={isFiltersExpanded ? "text-emerald-700" : "text-slate-500"} />
                      <span className="hidden sm:inline">فیلترها و دسته‌ها</span>
                      <span className="sm:hidden">فیلتر</span>
                      {(activeCategory !== "همه" || selectedBrand !== "همه") && (
                        <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block animate-pulse" />
                      )}
                      <ChevronDown size={14} className={`transition-transform duration-200 ${isFiltersExpanded ? 'rotate-180' : ''}`} />
                    </button>
                  </div>

                  {/* ردیف دوم: سوییچر متقارن حالت نمایش + دکمه دانلود PDF و وضعیت موجودی */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-slate-100">
                    {/* حالت‌های اصلی نمایش: خرید سریع، کاتالوگ کارتی، بیشترین سود */}
                    <div className="w-full sm:w-auto grid grid-cols-3 bg-slate-100/90 p-1 rounded-2xl border border-slate-200/80 shadow-3xs">
                      {[
                        { id: 'list', icon: Zap, label: 'خرید سریع (مستقیم)', short: '⚡ خرید سریع', iconColor: 'text-emerald-500' },
                        { id: 'grid', icon: Grid, label: 'کاتالوگ کارتی', short: 'کاتالوگ', iconColor: 'text-emerald-600' },
                        { id: 'high_margin', icon: TrendingUp, label: 'بیشترین سود ریالی', short: 'پر سود', iconColor: 'text-rose-500' }
                      ].map((mode) => {
                        const isActive = viewMode === mode.id;
                        const Icon = mode.icon;
                        return (
                          <button
                            key={`app-view-mode-${mode.id}`}
                            type="button"
                            onClick={() => setViewMode(mode.id as any)}
                            className={`flex items-center justify-center gap-1.5 py-2 px-2 sm:px-3.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap select-none ${
                              isActive
                                ? "bg-white text-emerald-950 shadow-sm border border-slate-200/90 ring-2 ring-emerald-500/10"
                                : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
                            }`}
                            title={mode.label}
                          >
                            <Icon size={14} className={isActive ? mode.iconColor : "text-slate-400"} />
                            <span className="hidden md:inline">{mode.label}</span>
                            <span className="md:hidden text-[11px] sm:text-xs font-black">{mode.short}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* ابزارهای کمکی: وضعیت موجودی و خروجی کاتالوگ PDF */}
                    <div className="flex items-center justify-between sm:justify-end gap-1.5 sm:gap-2 w-full sm:w-auto flex-wrap sm:flex-nowrap">
                      <button
                        type="button"
                        onClick={() => {
                          const nextVal = !hideOutOfStock;
                          setHideOutOfStock(nextVal);
                          localStorage.setItem("dastavval_hide_out_of_stock", String(nextVal));
                        }}
                        className={`h-9 sm:h-10 px-2.5 sm:px-3 flex-1 sm:flex-initial border rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0 shadow-3xs ${
                          hideOutOfStock
                            ? "bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100/70"
                            : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                        }`}
                        title={hideOutOfStock ? "نمایش همه کالاها (شامل ناموجود)" : "مخفی‌سازی هوشمند کالاهای ناموجود"}
                      >
                        <Package size={14} className={hideOutOfStock ? "text-amber-600" : "text-slate-500"} />
                        <span className="whitespace-nowrap">{hideOutOfStock ? "فقط موجودها" : "همه کالاها"}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setIsCatalogOpen(true)}
                        className="h-9 sm:h-10 px-2.5 sm:px-3 flex-1 sm:flex-initial bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0 shadow-3xs"
                        title="دانلود کاتالوگ PDF"
                      >
                        <Printer size={14} className="text-slate-500" />
                        <span className="whitespace-nowrap">کاتالوگ PDF</span>
                      </button>
                    </div>
                  </div>

                  {/* پنل کشویی: دسته‌بندی‌ها و کارخانجات در یک کادر فشرده */}
                  <AnimatePresence>
                    {isFiltersExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden pt-2 border-t border-slate-100 space-y-2.5"
                      >
                        {/* نوار دسته‌بندی‌ها */}
                        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-right">
                          <span className="text-[10px] font-black text-slate-400 shrink-0">دسته:</span>
                          {[
                            { id: "cat-all", name: "همه دسته‌ها", value: "همه" },
                            ...Array.from(new Set([
                              ...(b2bConfig.categories || []).map((c: any) => typeof c === 'string' ? c : c.name),
                              ...activeProducts.map(p => p.category).filter(Boolean)
                            ])).filter(catName => catName !== "انبار های من" && catName !== "انبارهای من")
                            .map((catName, idx) => ({ id: `cat-${idx}-${catName}`, name: catName, value: catName }))
                          ].map((cat: any, idx: number) => {
                            const isActive = activeCategory === cat.value;
                            return (
                              <button
                                key={`unified-cat-chip-${cat.id || idx}-${idx}`}
                                type="button"
                                onClick={() => setActiveCategory(cat.value)}
                                className={`px-2.5 py-1 rounded-lg text-[10.5px] font-black transition-all shrink-0 border cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                                  isActive 
                                    ? "bg-emerald-700 text-white border-emerald-600 shadow-2xs" 
                                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                                }`}
                              >
                                <span>{cat.name}</span>
                              </button>
                            );
                          })}
                        </div>

                        {/* نوار فشرده کارخانجات و برندها */}
                        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-right">
                          <span className="text-[10px] font-black text-slate-400 shrink-0">کارخانه:</span>
                          {["همه", ...Array.from(new Set(activeProducts.map(p => p.brand).filter(Boolean)))].map((brandName, idx) => {
                            const isSelected = selectedBrand === brandName;
                            const brandInfo = (b2bConfig.brands || []).find((b: any) => b.name === brandName);
                            return (
                              <button
                                key={`unified-brand-chip-${brandName}-${idx}`}
                                type="button"
                                onClick={() => setSelectedBrand(brandName)}
                                className={`px-2.5 py-1 rounded-lg text-[10.5px] font-black transition-all shrink-0 border cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                                  isSelected
                                    ? "bg-emerald-700 text-white border-emerald-600 shadow-2xs"
                                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                                }`}
                              >
                                {brandInfo?.icon && <span className="text-xs">{brandInfo.icon}</span>}
                                <span>{brandName === "همه" ? "همه کارخانجات" : brandName}</span>
                              </button>
                            );
                          })}

                          {(selectedBrand !== "همه" || activeCategory !== "همه") && (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedBrand("همه");
                                setActiveCategory("همه");
                              }}
                              className="text-[10px] font-black text-rose-600 hover:underline bg-rose-50 px-2 py-1 rounded-lg border border-rose-200 shrink-0 cursor-pointer"
                            >
                              حذف فیلترها ✕
                            </button>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                  {/* Active Special Filter Badge indicator */}
                  {specialFilter !== 'none' && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-gradient-to-r from-emerald-50 to-blue-50 border border-emerald-200 rounded-xl p-3 flex items-center justify-between gap-3 shadow-3xs"
                      dir="rtl"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-base">
                          {specialFilter === 'special' ? '⭐️' : specialFilter === 'sediment' ? '📦' : '🔥'}
                        </span>
                        <div className="text-right">
                          <span className="text-xs font-black text-slate-800">
                            در حال مشاهده محصولات: <strong className="text-emerald-950 text-xs font-black">{specialFilter === 'special' ? 'کالاهای ویژه' : specialFilter === 'sediment' ? 'بارهای رسوب انبار کارخانجات' : 'بارهای مازاد تولید'}</strong>
                          </span>
                          <span className="text-[10px] text-slate-500 font-bold block mt-0.5">
                            تعداد کالاهای موجود در این لیست: {toPersianNum(filteredProducts.length)} کالا
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSpecialFilter('none')}
                        className="bg-white hover:bg-slate-100 text-slate-700 text-[10px] font-black px-2.5 py-1 rounded-lg border border-slate-200 transition-all cursor-pointer shadow-3xs"
                      >
                        نمایش همه کالاها ✕
                      </button>
                    </motion.div>
                  )}

                  {/* Products catalog list */}
                  {loading ? (
                    <BentoProductGridSkeleton count={8} />
                  ) : filteredProducts.length === 0 ? (
                    <div className="bg-white rounded-2xl p-16 text-center border border-gray-100 shadow-sm">
                      <Package className="mx-auto text-gray-300 mb-4 animate-bounce" size={48} />
                      <h3 className="text-lg font-black text-gray-850">کالایی یافت نشد</h3>
                      <p className="text-xs text-gray-400 font-bold mt-2">دسته‌بندی یا برند دیگری را انتخاب نمایید.</p>
                    </div>
                  ) : viewMode === "high_margin" ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                      {filteredProducts
                        .sort((a, b) => {
                          const profitA = (a.consumer_price || a.price) - a.bulk_price;
                          const profitB = (b.consumer_price || b.price) - b.bulk_price;
                          return profitB - profitA;
                        })
                        .slice(0, 16)
                        .map((product, idx) => (
                          <ProductCard 
                            key={`app-prod-v2-${product.id || idx}-${idx}`} 
                            product={product} 
                            index={idx}
                            onAddToCart={addToCart} 
                            onViewDetails={(prod) => {
                              openProductPage(prod);
                            }}
                            userBadge={userBadge}
                          />
                        ))}
                    </div>
                  ) : viewMode === 'table' ? (
                    <Suspense fallback={<TableSkeleton />}>
                      <FadeInContainer>
                        <WholesaleCatalogView 
                          products={filteredProducts} 
                          activeCategory={activeCategory} 
                          onAddToCart={addToCart} 
                          userBadge={userBadge}
                          onViewDetails={(product) => {
                            openProductPage(product);
                          }}
                        />
                      </FadeInContainer>
                    </Suspense>
                  ) : viewMode === 'list' ? (
                    <QuickOrderList 
                      products={filteredProducts} 
                      onAddToCart={(product, qty) => setExactCartQuantity(product, qty)} 
                      cart={cart.map(item => ({ productId: item.productId, quantity: item.quantityCartons }))}
                      fullCart={cart}
                      user={user}
                      userBadge={userBadge}
                      b2bConfig={b2bConfig}
                      setShowAuthModal={setShowAuthModal}
                      onLogin={(loggedInUser) => setUser(loggedInUser)}
                      onOrderSuccess={(createdOrder) => {
                        setCart([]);
                        setLastCreatedOrder(createdOrder);
                      }}
                      onRemoveFromCart={(id) => removeFromCart(id)}
                      onClearCart={() => setCart([])}
                      onBackToGrid={() => setViewMode('grid')}
                      onClose={() => setViewMode('grid')}
                      onOpenCheckout={() => setIsCartOpen(true)}
                      onViewDetails={(product) => openProductPage(product)}
                    />
                  ) : (
                    <div className="space-y-6">
                      {/* Products Grid with react-window Virtualization */}
                      <VirtualizedProductGrid
                        products={
                          !showAllHomepageProducts && searchQuery === "" && activeCategory === "همه" && selectedBrand === "همه"
                            ? filteredProducts.slice(0, 8)
                            : filteredProducts
                        }
                        onAddToCart={addToCart}
                        userBadge={userBadge}
                        onCompare={toggleComparison}
                        comparisonList={comparisonList}
                        onViewDetails={(product) => {
                          openProductPage(product);
                        }}
                      />

                      {/* Expand / Collapse Button if total products > 8 and default filters */}
                      {filteredProducts.length > 8 && searchQuery === "" && activeCategory === "همه" && selectedBrand === "همه" && (
                        <div className="flex justify-center pt-2">
                          <button
                            onClick={() => setShowAllHomepageProducts(!showAllHomepageProducts)}
                            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-700 to-purple-600 hover:from-emerald-800 hover:to-purple-700 text-white text-xs font-black shadow-lg shadow-emerald-700/20 transition-all flex items-center gap-2 cursor-pointer border border-indigo-400/30 hover:scale-105"
                          >
                            <span>
                              {showAllHomepageProducts
                                ? "نمایش کمتر محصولات صفحه اصلی"
                                : `مشاهده تمام ${filteredProducts.length} محصول عمده کارخانجات`}
                            </span>
                            <span className="text-base">{showAllHomepageProducts ? "↑" : "↓"}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
          )}

          {activeTab === 'portal' && (
            <motion.div
              key="portal"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
            >
              <Suspense fallback={<DashboardSkeleton />}>
                <FadeInContainer>
                  <B2BBusinessDashboard 
                    products={products}
                    theme={theme}
                    language={language}
                    userBadge={userBadge}
                    user={user}
                    userCity={userCity}
                    userProvince={userProvince}
                    lastOrderTracking={lastOrderTracking}
                    lastOrderAmount={lastOrderAmount}
                    transitRoutes={b2bConfig?.transitRoutes}
                    b2bConfig={b2bConfig}
                    onLogout={handleLogout}
                    onUpdateUser={handleUpdateUser}
                    onUpdateB2bConfig={handleUpdateB2bConfig}
                  />
                </FadeInContainer>
              </Suspense>
            </motion.div>
          )}

          {activeTab === 'admin' && (
            user?.role === 'admin' ? (
              <motion.div
                key="admin"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.2 }}
              >
                <Suspense fallback={<DashboardSkeleton />}>
                  <FadeInContainer>
                    <AdminPanel 
                      user={user}
                      products={products}
                      onAddProduct={handleAddProduct}
                      onUpdateProduct={handleUpdateProduct}
                      onDeleteProduct={handleDeleteProduct}
                      onBatchDeleteProducts={handleBatchDeleteProducts}
                      onBulkUpdateProducts={handleBulkUpdateProducts}
                      onRefreshProducts={fetchProducts}
                      onApplyJsonImportedProducts={handleApplyJsonImportedProducts}
                      b2bConfig={b2bConfig}
                      onUpdateB2bConfig={handleUpdateB2bConfig}
                      articles={articles}
                      onUpdateArticles={handleUpdateArticles}
                      language={language}
                      onLogout={handleLogout}
                    />
                  </FadeInContainer>
                </Suspense>
              </motion.div>
            ) : (
              <div className="flex-1 min-h-[60vh] flex flex-col items-center justify-center p-8 text-center space-y-5 bg-white rounded-[2.5rem] max-w-2xl mx-auto my-8">
                <div className="w-20 h-20 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center shadow-inner">
                  <ShieldCheck size={40} />
                </div>
                <h2 className="text-xl font-black text-slate-800">عدم دسترسی به پنل مدیریت</h2>
                <p className="text-slate-500 font-bold max-w-md text-xs leading-relaxed">شما سطح دسترسی لازم برای ورود به این بخش را ندارید. دسترسی به پنل مدیریت و ابزارهای بروزرسانی گیت‌هاب تنها برای حساب‌های مدیر ارشد مرکزی (Admin) امکان‌پذیر است.</p>
                <div className="flex flex-col sm:flex-row gap-3 w-full justify-center pt-2">
                  <button 
                    onClick={() => setActiveTab('presentation')}
                    className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-xs shadow-md shadow-emerald-600/20 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                  >
                    بازگشت به پیشخوان اصلی
                  </button>
                </div>
              </div>
            )
          )}

          {activeTab === 'user' && (
            <motion.div
              key="user"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
            >
              <Suspense fallback={<DashboardSkeleton />}>
                <FadeInContainer>
                  <UserPanel 
                    user={user}
                    onUpdateUser={handleUpdateUser}
                    onLogout={handleLogout}
                    b2bConfig={b2bConfig}
                    products={products}
                    onAddToCart={addToCart}
                    setActiveTab={setActiveTab as any}
                    onUpdateB2bConfig={handleUpdateB2bConfig}
                    onAddProduct={handleAddProduct}
                    onUpdateProduct={handleUpdateProduct}
                    onDeleteProduct={handleDeleteProduct}
                    currentSellerId={currentSellerId}
                    setCurrentSeller={(id, name) => {
                      setCurrentSellerId(id);
                      setCurrentSellerName(name);
                    }}
                    onRefreshProducts={fetchProducts}
                  />
                </FadeInContainer>
              </Suspense>
            </motion.div>
          )}

          {activeTab === 'profile' && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
            >
              <Suspense fallback={<DashboardSkeleton />}>
                <FadeInContainer>
                  <UserPanel
                    user={user}
                    onLogout={handleLogout}
                    b2bConfig={b2bConfig}
                    products={products}
                    onAddToCart={addToCart}
                    setActiveTab={setActiveTab as any}
                    onUpdateUser={(updated) => setUser(updated)}
                    onAddProduct={handleAddProduct}
                    onUpdateProduct={handleUpdateProduct}
                    onDeleteProduct={handleDeleteProduct}
                    currentSellerId={currentSellerId}
                    setCurrentSeller={(id, name) => {
                      setCurrentSellerId(id);
                      setCurrentSellerName(name);
                    }}
                    onRefreshProducts={fetchProducts}
                  />
                </FadeInContainer>
              </Suspense>
            </motion.div>
          )}

          {activeTab === 'factories' && (
            <motion.div
              key="factories"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
            >
              <Suspense fallback={<SectionSkeleton />}>
                <FadeInContainer>
                  <FactoriesView 
                    factories={(b2bConfig?.factories || []).filter((f: any) => f && f.isActive !== false)}
                    products={activeProducts}
                    b2bConfig={b2bConfig}
                    initialFactoryId={initialFactoryIdParam}
                    userBadge={userBadge}
                    user={user}
                    onSelectFactoryForOrder={(factoryName) => {
                      setSearchQuery(factoryName);
                      setActiveTab('order');
                    }}
                    onSelectProductForOrder={(product) => {
                      openProductPage(product);
                    }}
                    onUpdateB2bConfig={handleUpdateB2bConfig}
                  />
                </FadeInContainer>
              </Suspense>
            </motion.div>
          )}

          {activeTab === 'news' && (
            <motion.div
              key="news"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div className="flex justify-between items-center bg-white/70 backdrop-blur-md px-6 py-4 rounded-3xl border border-slate-100 shadow-sm" dir="rtl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-black">
                    📰
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-850">مجله خبری و گزارشات بازار</h3>
                    <p className="text-[10px] text-slate-400 font-bold">اطلاع‌رسانی آخرین قیمت‌ها و سهمیه‌های صنایع غذایی کشور</p>
                  </div>
                </div>
                <button 
                  onClick={() => setActiveTab('presentation')}
                  className="px-5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-605 rounded-xl text-xs font-black transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <span>صفحه نخست</span>
                  <ArrowUpRight size={14} className="rotate-90" />
                </button>
              </div>
              <Suspense fallback={<SectionSkeleton />}>
                <FadeInContainer>
                  <B2BNews 
                    articles={articles} 
                    factories={(b2bConfig?.factories || []).filter((f: any) => f && f.isActive !== false)} 
                    b2bConfig={b2bConfig} 
                    initialSubTab="news" 
                    userBadge={userBadge}
                    user={user}
                  />
                </FadeInContainer>
              </Suspense>
            </motion.div>
          )}

          {activeTab === 'article-page' && selectedArticleId && (
            <motion.div
              key="article-page"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
            >
              <ArticlePageView
                articleId={selectedArticleId}
                articles={articles}
                b2bConfig={b2bConfig}
                products={products}
                onClose={() => {
                  setSelectedArticleId(null);
                  setActiveTab('news');
                  const url = new URL(window.location.href);
                  url.searchParams.delete('article');
                  window.history.pushState({}, '', url.toString());
                }}
                onOpenProduct={(prod) => {
                  openProductPage(prod);
                }}
                onOpenFactory={(facId) => {
                  setInitialFactoryIdParam(facId);
                  setActiveTab('factories');
                }}
                onSwitchTab={(tab) => {
                  setActiveTab(tab as any);
                }}
              />
            </motion.div>
          )}

          {activeTab === 'about' && (
            <motion.div
              key="about"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div className="flex justify-between items-center bg-white/70 backdrop-blur-md px-6 py-4 rounded-3xl border border-slate-100 shadow-sm" dir="rtl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black">
                    ℹ️
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-850">درباره ما و تماس با پلتفرم</h3>
                    <p className="text-[10px] text-slate-400 font-bold">آشنایی با اهداف، مزایا و راه‌های ارتباطی</p>
                  </div>
                </div>
                <button 
                  onClick={() => setActiveTab('presentation')}
                  className="px-5 py-2.5 bg-emerald-50 hover:bg-blue-100 text-blue-605 rounded-xl text-xs font-black transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <span>صفحه نخست</span>
                  <ArrowUpRight size={14} className="rotate-90" />
                </button>
              </div>
              
              <AboutUsSection articles={articles} theme={theme} />
              <TrustSection theme={theme} />
            </motion.div>
          )}

          {activeTab === 'learning' && (
            <motion.div
              key="learning"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div className="flex justify-between items-center bg-white px-6 py-4 rounded-3xl border border-slate-200 shadow-xs" dir="rtl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black border border-emerald-100">
                    🎓
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">مرکز آموزش و راهنمای جامع سامانه دست اول</h3>
                    <p className="text-[10px] text-slate-500 font-bold">راهنمای گام‌به‌گام خرید مستقیم، تسویه امن امانی، خرید چکی و دریافت بار</p>
                  </div>
                </div>
                <button 
                  onClick={() => setActiveTab('presentation')}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <span>صفحه نخست</span>
                  <ArrowUpRight size={14} className="rotate-90" />
                </button>
              </div>
              <Suspense fallback={<SectionSkeleton />}>
                <FadeInContainer>
                  <B2BNews 
                    articles={articles} 
                    factories={(b2bConfig?.factories || []).filter((f: any) => f && f.isActive !== false)} 
                    b2bConfig={b2bConfig} 
                    initialSubTab="education" 
                    userBadge={userBadge}
                    user={user}
                  />
                </FadeInContainer>
              </Suspense>
            </motion.div>
          )}

          {activeTab === 'support' && (
            <motion.div
              key="support"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div className="flex justify-between items-center bg-white/70 backdrop-blur-md px-6 py-4 rounded-3xl border border-slate-100 shadow-sm" dir="rtl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-black">
                    🎧
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-850">پشتیبانی و امور مشترکان</h3>
                    <p className="text-[10px] text-slate-400 font-bold">ثبت تیکت‌های رسمی و پاسخ به سوالات متداول</p>
                  </div>
                </div>
                <button 
                  onClick={() => setActiveTab('presentation')}
                  className="px-5 py-2.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl text-xs font-black transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <span>صفحه نخست</span>
                  <ArrowUpRight size={14} className="rotate-90" />
                </button>
              </div>
              <Suspense fallback={<SectionSkeleton />}>
                <FadeInContainer>
                  <SupportCenter theme={theme === 'dark' ? 'dark' : 'light'} />
                </FadeInContainer>
              </Suspense>
            </motion.div>
          )}

          {activeTab === 'billboard' && (
            <motion.div
              key="billboard"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
            >
              <Suspense fallback={<CatalogSkeleton />}>
                <FadeInContainer>
                  <AdBoard 
                    isMini={false} 
                    onTriggerPayment={triggerZarinpalPayment} 
                    onNavigateToBillboard={(sub) => {
                      if (sub) setBillboardSubTab(sub);
                    }}
                    onNavigateHome={() => setActiveTab('presentation')}
                    user={user}
                    products={activeProducts}
                    sponsoredAds={b2bConfig?.sponsoredAds || []}
                    onUpdateB2bConfig={handleUpdateB2bConfig}
                    b2bConfig={b2bConfig}
                    initialSubTab={billboardSubTab}
                    onSubTabChange={(sub) => setBillboardSubTab(sub)}
                    onOpenAuth={(role) => {
                      setAuthInitialRole((role as any) || 'ad_poster');
                      setShowAuthModal(true);
                    }}
                    onSelectProduct={(prod) => {
                      openProductPage(prod);
                    }}
                    onSelectAd={openAdPage}
                  />
                </FadeInContainer>
              </Suspense>
            </motion.div>
          )}

          {activeTab === 'weekly-schedule' && (
            <motion.div
              key="weekly-schedule"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
            >
              <Suspense fallback={<CatalogSkeleton />}>
                <FadeInContainer>
                  <WeeklySalesSchedule
                    products={activeProducts}
                    user={user}
                    onSelectProduct={(prod) => {
                      openProductPage(prod);
                    }}
                    onAddToCart={(product, qty) => {
                      addToCart(product, qty);
                    }}
                    onNavigateHome={() => setActiveTab('presentation')}
                  />
                </FadeInContainer>
              </Suspense>
            </motion.div>
          )}

          {activeTab === 'special-offers' && (
            <motion.div
              key="special-offers"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
            >
              <Suspense fallback={<CatalogSkeleton />}>
                <FadeInContainer>
                  <SpecialOffersView
                    products={activeProducts}
                    b2bConfig={b2bConfig}
                    user={user}
                    userBadge={userBadge}
                    onAddToCart={addToCart}
                    onViewDetails={(prod) => openProductPage(prod)}
                    onBackToHome={() => setActiveTab('presentation')}
                  />
                </FadeInContainer>
              </Suspense>
            </motion.div>
          )}

          {activeTab === 'bestsellers' && (
            <motion.div
              key="bestsellers"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
            >
              <Suspense fallback={<CatalogSkeleton />}>
                <FadeInContainer>
                  <BestsellersView
                    products={activeProducts}
                    b2bConfig={b2bConfig}
                    user={user}
                    userBadge={userBadge}
                    onAddToCart={addToCart}
                    onViewDetails={(prod) => openProductPage(prod)}
                    onBackToHome={() => setActiveTab('presentation')}
                  />
                </FadeInContainer>
              </Suspense>
            </motion.div>
          )}

          {activeTab === 'competition' && (
            <motion.div
              key="competition"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
            >
              <Suspense fallback={<CatalogSkeleton />}>
                <FadeInContainer>
                  <FactoryCompetition
                    factories={(b2bConfig?.factories || []).filter((f: any) => f && f.isActive !== false)}
                    products={activeProducts}
                    b2bConfig={b2bConfig}
                    onBackToHome={() => setActiveTab('presentation')}
                    onNavigateTab={(tab, options) => {
                      if (options?.searchQuery) {
                        setSearchQuery(options.searchQuery);
                      }
                      setActiveTab(tab as any);
                    }}
                  />
                </FadeInContainer>
              </Suspense>
            </motion.div>
          )}

          {activeTab === 'product-page' && (
            <motion.div
              key="product-page"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
            >
              <Suspense fallback={<DashboardSkeleton />}>
                <ProductPageView
                  product={selectedProductPage || activeProducts[0]}
                  allProducts={activeProducts}
                  onBack={() => setActiveTab(previousTab)}
                  onAddToCart={addToCart}
                  onSelectProduct={(prod) => setSelectedProductPage(prod)}
                  b2bConfig={b2bConfig}
                  user={user}
                  userBadge={user?.badge}
                />
              </Suspense>
            </motion.div>
          )}

          {activeTab === 'agent-catalog' && (
            <motion.div
              key="agent-catalog"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="min-h-screen bg-slate-50"
            >
              <Suspense fallback={<CatalogSkeleton />}>
                <AgentCatalogView 
                  products={activeProducts} 
                  onClose={() => {
                    if (user?.role === 'representative' || user?.role === 'agency') {
                      setActiveTab('portal');
                    } else {
                      setActiveTab('presentation');
                    }
                    if (typeof window !== 'undefined') {
                      window.history.replaceState({}, document.title, window.location.pathname);
                    }
                  }}
                  b2bConfig={b2bConfig}
                />
              </Suspense>
            </motion.div>
          )}

          {activeTab === 'ad_poster_panel' && (
            <motion.div
              key="ad_poster_panel"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <Suspense fallback={<CatalogSkeleton />}>
                <FadeInContainer>
                  <AdBoard 
                    isMini={false} 
                    onTriggerPayment={triggerZarinpalPayment} 
                    onNavigateToBillboard={(sub) => {
                      if (sub) setBillboardSubTab(sub);
                    }}
                    onNavigateHome={() => setActiveTab('presentation')}
                    user={user}
                    products={activeProducts}
                    sponsoredAds={b2bConfig?.sponsoredAds || []}
                    onUpdateB2bConfig={handleUpdateB2bConfig}
                    b2bConfig={b2bConfig}
                    initialSubTab="ad_poster_panel"
                    onSubTabChange={(sub) => setBillboardSubTab(sub)}
                    onOpenAuth={(role) => {
                      setAuthInitialRole((role as any) || 'ad_poster');
                      setShowAuthModal(true);
                    }}
                    onSelectProduct={(prod) => {
                      openProductPage(prod);
                    }}
                    onSelectAd={openAdPage}
                  />
                </FadeInContainer>
              </Suspense>
            </motion.div>
          )}

          {activeTab === 'barter' && (
            <motion.div
              key="barter_factories"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
            >
              <Suspense fallback={<SectionSkeleton />}>
                <FadeInContainer>
                  <FactoriesView 
                    factories={(b2bConfig?.factories || []).filter((f: any) => f && f.isActive !== false)}
                    products={activeProducts}
                    b2bConfig={b2bConfig}
                    initialSubTab="barter"
                    userBadge={userBadge}
                    user={user}
                    onSelectFactoryForOrder={(factoryName) => {
                      setSearchQuery(factoryName);
                      setActiveTab('order');
                    }}
                    onSelectProductForOrder={(product) => {
                      openProductPage(product);
                    }}
                    onUpdateB2bConfig={handleUpdateB2bConfig}
                  />
                </FadeInContainer>
              </Suspense>
            </motion.div>
          )}

          {activeTab === 'ad-detail' && selectedAdForDetail && (
            <motion.div
              key="ad-detail"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
            >
              <Suspense fallback={<DashboardSkeleton />}>
                <AdDetailView
                  ad={selectedAdForDetail}
                  onBack={() => setActiveTab('billboard')}
                  onTriggerPayment={triggerZarinpalPayment}
                  user={user}
                />
              </Suspense>
            </motion.div>
          )}

          {(activeTab === 'agency' || activeTab === 'dealership' || activeTab === 'dealership_request' || activeTab === 'rep_cert' || activeTab === 'certificate') && (
            <motion.div
              key="agency"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <Suspense fallback={<SectionSkeleton />}>
                <FadeInContainer>
                  <DealershipRequestView 
                    b2bConfig={b2bConfig}
                    user={user}
                    userCity={userCity}
                    userProvince={userProvince}
                    onNavigateHome={() => {
                      setActiveTab('presentation');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    onOpenCertificate={() => {
                      setActiveTab('rep_cert');
                    }}
                  />
                </FadeInContainer>
              </Suspense>
            </motion.div>
          )}

          {activeTab === 'error' && (
            <motion.div
              key="error-page"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
            >
              <Suspense fallback={<SectionSkeleton />}>
                <SystemPages 
                  onNavigateHome={() => {
                    setActiveTab('presentation');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  onNavigateTab={(t) => {
                    setActiveTab(t as any);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  onOpenAuthModal={() => setShowAuthModal(true)}
                  onSearch={(q) => {
                    setSearchQuery(q);
                    setActiveTab('order');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                />
              </Suspense>
            </motion.div>
          )}
          </div>
        </Suspense>
      </main>

      {(activeTab === 'presentation' || activeTab === 'about') && (
        <>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
            <MagazineSection articles={articles} userRole={userRole} />
          </div>
          {/* Moved ContactSection (Representatives) to be under MagazineSection as requested */}
          <ContactSection theme={theme} userBadge={userBadge} userCity={user?.city} />
        </>
      )}


      {/* Product Comparison Float */}
      <AnimatePresence>
        {comparisonList.length > 0 && (
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[50] w-full max-w-md px-4"
          >
            <div className="bg-white border border-emerald-900 rounded-2xl p-4 shadow-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2 rtl:space-x-reverse">
                  {comparisonList.map((p, idx) => (
                    <div key={`comp-${p.id}-${idx}`} className="w-8 h-8 rounded-full border-2 border-emerald-950 bg-white p-1 flex items-center justify-center overflow-hidden">
                      <ProductImage 
                        src={p.image_url} 
                        alt="" 
                        className="w-full h-full object-contain" 
                      />
                    </div>
                  ))}
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-slate-100 font-black">
                    {comparisonList.length} کالا آماده مقایسه
                  </p>
                  <p className="text-[8px] text-slate-400 font-bold">حداکثر ۴ محصول</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setComparisonList([])}
                  className="px-3 py-2 rounded-xl text-[9px] font-black text-slate-400 hover"
                >
                  پاک کردن
                </button>
                <button 
                  onClick={() => setIsComparisonOpen(true)}
                  className="px-5 py-2.5 rounded-xl bg-emerald-700 text-white text-[10px] font-black shadow-lg shadow-emerald-700/20"
                >
                  شروع مقایسه فنی
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ProductComparison 
        isOpen={isComparisonOpen} 
        onClose={() => setIsComparisonOpen(false)} 
        products={comparisonList} 
        theme={theme} 
      />


      {/* Step-by-Step Checkout Wizard Modal */}
      {isCartOpen && (
        <Suspense fallback={<ModalSkeleton />}>
          <FadeInContainer>
            <CheckoutWizard
              isOpen={isCartOpen}
              onClose={() => setIsCartOpen(false)}
              cart={cart}
              onAddToCart={(product, quantityCartons) => addToCart(product, quantityCartons)}
              onUpdateQuantity={(productId, newCartons) => {
                if (newCartons <= 0) {
                  setCart(prev => prev.filter(i => i.productId !== productId));
                } else {
                  setCart(prev => {
                    const exists = prev.some(i => i.productId === productId);
                    if (exists) {
                      return prev.map(i => {
                        if (i.productId === productId) {
                          const matchedProd = products.find(p => p.id === productId);
                          const packCount = matchedProd?.carton_pack_count || i.unitsPerCarton || 24;
                          return {
                            ...i,
                            quantityCartons: newCartons,
                            totalItems: newCartons * packCount
                          };
                        }
                        return i;
                      });
                    } else {
                      const prod = products.find(p => p.id === productId);
                      if (!prod) return prev;
                      const pricePerCarton = prod.bulk_price * prod.carton_pack_count;
                      return [...prev, {
                        productId: prod.id,
                        name: prod.name,
                        quantityCartons: newCartons,
                        pricePerCarton,
                        totalItems: newCartons * prod.carton_pack_count,
                        image_url: prod.image_url,
                        unitsPerCarton: prod.carton_pack_count
                      }];
                    }
                  });
                }
              }}
              onRemoveItem={(productId) => removeFromCart(productId)}
              totalAmount={totalAmount}
              user={user}
              userBadge={userBadge}
              b2bConfig={b2bConfig}
              products={activeProducts}
              setShowAuthModal={setShowAuthModal}
              userCity={userCity}
              userProvince={userProvince}
              cityAgency={cityAgency}
              onOrderSuccess={(createdOrder) => {
                setCart([]);
                setIsCartOpen(false);
                setLastCreatedOrder(createdOrder);
                
                // Show auto-created account notice as a persistent notification
                if (createdOrder.autoCreatedAccount) {
                  setSyncToastMessage(`حساب کاربری شما با موفقیت ایجاد شد. نام کاربری: ${createdOrder.autoCreatedAccount.username} | رمز عبور: ${createdOrder.autoCreatedAccount.password}`);
                }
              }}
              onLogin={(userData) => handleUpdateUser(userData)}
            />
          </FadeInContainer>
        </Suspense>
      )}

      {/* Official Invoice Modal after order success */}
      {lastCreatedOrder && (
        <Suspense fallback={<ModalSkeleton />}>
          <FadeInContainer>
            <WholesaleInvoiceView
              order={lastCreatedOrder}
              b2bConfig={b2bConfig}
              onClose={() => setLastCreatedOrder(null)}
              isBuyer={true}
            />
          </FadeInContainer>
        </Suspense>
      )}

      {/* Direct URL Invoice Modal (/factors/:id or /invoice/:id) */}
      {directUrlInvoiceOrder && (
        <Suspense fallback={<ModalSkeleton />}>
          <FadeInContainer>
            <WholesaleInvoiceView
              order={directUrlInvoiceOrder}
              b2bConfig={b2bConfig}
              onClose={() => {
                setDirectUrlInvoiceOrder(null);
                try {
                  window.history.replaceState({}, document.title, window.location.origin);
                } catch (e) {}
              }}
              isBuyer={true}
            />
          </FadeInContainer>
        </Suspense>
      )}

      {false && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="fixed inset-0 bg-white/50 backdrop-blur-md z-[60]"
            />
            <motion.div 
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-lg bg-white border-l border-gray-100 text-slate-900 z-[70] shadow-2xl flex flex-col"
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h2 className="text-xl font-black flex items-center gap-2 text-slate-900">
                  <ShoppingBag className="text-emerald-600" />
                  پیش فاکتور خرید کارتنی عمده
                </h2>
                <button onClick={() => setIsCartOpen(false)} className="p-2 hover rounded-full transition-colors text-slate-500 hover">
                  <X />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-4">
                    <ShoppingBag size={64} strokeWidth={1} className="text-gray-300" />
                    <p className="font-bold text-gray-500">پیش فاکتور شما خالی است</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-3">
                      {cart.map((item, idx) => (
                        <div key={`cart-drawer-item-${item.productId || idx}-${idx}`} className="flex gap-4 bg-white p-4 rounded-2xl border border-gray-100">
                          <div className="flex-1">
                            <h4 className="font-black text-sm text-gray-900">{item.name}</h4>
                            <p className="text-xs text-gray-500 mt-1">
                              {item.quantityCartons} کارتن عمده × {item.pricePerCarton.toLocaleString()} تومان
                            </p>
                            <span className="inline-block text-[10px] bg-gray-200/60 text-gray-700 px-2 py-0.5 rounded-md mt-1 font-bold">
                              مجموع کالاها: {item.totalItems} عدد
                            </span>
                          </div>
                          <div className="flex flex-col items-end justify-between">
                            <button 
                              onClick={() => removeFromCart(item.productId)}
                              className="text-red-500 hover text-xs font-black"
                            >
                              حذف کالا
                            </button>
                            <span className="font-black text-emerald-600 text-base">
                              {(item.pricePerCarton * item.quantityCartons).toLocaleString()} <span className="text-xs font-normal">تومان</span>
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Payment Method Selection */}
                    <div className="border-t border-dashed border-gray-200 pt-6 mt-6 space-y-4">
                      <h3 className="font-black text-sm text-gray-800 flex items-center gap-2">
                        <CreditCard size={16} className="text-emerald-600" />
                        انتخاب روش پرداخت و تسویه
                      </h3>

                      {userBadge === 'bronze' && (
                        <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-xl text-[11px] text-amber-800 leading-relaxed font-bold space-y-1">
                          <div>⚠️ طرح همکاری پلکانی و اعتبار‌سنجی هوشمند اعتباری:</div>
                          <div className="font-medium text-[10px]">به دلیل عضویت جدید، پرداخت از طریق چک در خرید اول غیرفعال می‌باشد. جهت مصون ماندن پلتفرم از کلاهبرداری‌ها و افراد ناسالم، تسویه چکی صرفاً پس از اولین خرید موفق نقدی و ارتقاء به سطح همکار نقره‌ای فعال خواهد شد.</div>
                        </div>
                      )}

                      <div className="grid grid-cols-1 gap-2">
                        <button
                          onClick={() => setPaymentMethod('cash')}
                          className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                            paymentMethod === 'cash'
                              ? "border-emerald-600 bg-emerald-50"
                              : "border-gray-100 hover"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'cash' ? 'border-emerald-600' : 'border-gray-300'}`}>
                              {paymentMethod === 'cash' && <div className="w-2 h-2 bg-emerald-600 rounded-full" />}
                            </div>
                            <div className="text-right">
                              <span className="block text-xs font-black text-emerald-900">پرداخت نقدی (پیش‌فاکتور)</span>
                              <span className="text-[10px] text-emerald-600 font-bold">۵٪ تخفیف ویژه نقدی</span>
                            </div>
                          </div>
                          <DollarSign size={16} className="text-emerald-600" />
                        </button>

                        <button
                          disabled={userBadge === 'bronze'}
                          onClick={() => setPaymentMethod('half_check')}
                          className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                            userBadge === 'bronze'
                              ? "opacity-50 cursor-not-allowed border-gray-100"
                              : paymentMethod === 'half_check'
                              ? "border-emerald-700 bg-emerald-50"
                              : "border-gray-100 hover"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'half_check' ? 'border-emerald-700' : 'border-gray-300'}`}>
                              {paymentMethod === 'half_check' && <div className="w-2 h-2 bg-emerald-700 rounded-full" />}
                            </div>
                            <div className="text-right">
                              <span className="block text-xs font-black text-emerald-900">نصف نقد / نصف چک {userBadge === 'bronze' && "🔒"}</span>
                              <span className="text-[10px] text-slate-500 font-bold">سقف اعتبار اولیه معامله: ۱۰۰ میلیون تومان (۵۰ م چک + مابقی نقد)</span>
                            </div>
                          </div>
                          <Receipt size={16} className="text-emerald-700" />
                        </button>

                        <button
                          disabled={userBadge === 'bronze'}
                          onClick={() => setPaymentMethod('full_check')}
                          className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                            userBadge === 'bronze'
                              ? "opacity-50 cursor-not-allowed border-gray-100"
                              : paymentMethod === 'full_check'
                              ? "border-amber-600 bg-amber-50"
                              : "border-gray-100 hover"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'full_check' ? 'border-amber-600' : 'border-gray-300'}`}>
                              {paymentMethod === 'full_check' && <div className="w-2 h-2 bg-amber-600 rounded-full" />}
                            </div>
                            <div className="text-right">
                              <span className="block text-xs font-black text-emerald-900">خرید تمام چکی {userBadge === 'bronze' && "🔒"}</span>
                              <span className="text-[10px] text-amber-600 font-bold">۱۰٪ کارمزد فروش امانی (تا سقف اعتبار فعال خریدار)</span>
                            </div>
                          </div>
                          <FileText size={16} className="text-amber-600" />
                        </button>

                        <button
                          type="button"
                          onClick={() => setShowChequeCharterModal(true)}
                          className="text-[10px] text-emerald-700 hover:text-emerald-900 font-black text-right py-1 flex items-center gap-1.5 cursor-pointer underline"
                        >
                          <span>📜 مطالعه اساس‌نامه و جدول پلکانی افزایش اعتبار چکی</span>
                        </button>
                      </div>
                    </div>

                    {/* Shipping Address Information Form */}
                    <div className="border-t border-dashed border-gray-200 pt-6 mt-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-black text-sm text-gray-800 flex items-center gap-2">
                          <MapPin size={16} className="text-emerald-600" />
                          اطلاعات تحویل و آدرس
                        </h3>
                        {user ? (
                          <span className="text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded-lg border border-emerald-200/40 font-bold flex items-center gap-1">
                            <CheckCircle2 size={12} />
                            تکمیل خودکار از پروفایل
                          </span>
                        ) : (
                          <button
                            onClick={() => setShowAuthModal(true)}
                            className="text-[10px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded-lg border border-amber-200/40 font-bold hover transition-colors cursor-pointer"
                          >
                            حساب کاربری
                          </button>
                        )}
                      </div>

                      <div>
                        <label className="block text-[11px] text-gray-500 font-bold mb-1">نام و نام خانوادگی تحویل‌گیرنده</label>
                        <input 
                          type="text" 
                          required
                          placeholder="مثال: علیرضا حسینی"
                          value={buyerName}
                          onChange={e => setBuyerName(e.target.value)}
                          className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus focus text-xs text-right font-bold text-emerald-900 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] text-gray-500 font-bold mb-1">شماره تماس تحویل‌گیرنده بار</label>
                        <input 
                          type="text" 
                          required
                          placeholder="مثال: 09121111111"
                          value={buyerPhone}
                          onChange={e => setBuyerPhone(e.target.value)}
                          className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus focus text-xs text-right font-mono text-emerald-900 focus:outline-none"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="block text-[11px] text-gray-500 font-bold">آدرس تخلیه بار کارتن عمده</label>
                          <button
                            type="button"
                            onClick={() => {
                              const prefix = `استان ${userProvince}، شهر ${userCity}، `;
                              if (!buyerAddress.includes(prefix)) {
                                setBuyerAddress(prefix + buyerAddress);
                              }
                            }}
                            className="text-[10px] bg-emerald-50 hover:bg-emerald-700 text-emerald-800 hover:text-white border border-emerald-200 px-2.5 py-1 rounded-lg font-black transition-all cursor-pointer"
                          >
                            📍 درج خودکار «{userCity}» در آدرس
                          </button>
                        </div>
                        <textarea 
                          rows={2}
                          required
                          placeholder="مثال: تهران، جاده خاوران، انبار مرکزی توزیع البرز..."
                          value={buyerAddress}
                          onChange={e => setBuyerAddress(e.target.value)}
                          className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus focus text-xs text-right leading-relaxed text-emerald-900 focus:outline-none"
                        />
                      </div>

                      {/* Payment Attachment Upload */}
                      <div className="pt-2">
                        <label className="block text-[11px] text-gray-500 font-bold mb-1">آپلود فیش واریزی یا تصویر چک صیادی (اختیاری)</label>
                        <div className="flex items-center gap-2">
                          <input 
                            type="file"
                            accept="image/*"
                            id="receipt-file-input"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  setPaymentReceiptImage(reader.result as string);
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                          <label
                            htmlFor="receipt-file-input"
                            className="px-3 py-2 bg-slate-100 hover text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer border border-slate-300 transition-colors"
                          >
                            <Upload size={14} />
                            <span>{paymentReceiptImage ? "تغییر تصویر فیش/چک" : "انتخاب فایل فیش یا چک"}</span>
                          </label>
                          {paymentReceiptImage && (
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                                <CheckCircle2 size={12} /> آپلود شد
                              </span>
                              <button
                                type="button"
                                onClick={() => setPaymentReceiptImage("")}
                                className="text-rose-500 hover text-[10px] font-bold"
                              >
                                حذف
                              </button>
                            </div>
                          )}
                        </div>
                        {paymentReceiptImage && (
                          <div className="mt-2 w-20 h-16 rounded-lg overflow-hidden border border-slate-300">
                            <img src={paymentReceiptImage} alt="Receipt preview" className="w-full h-full object-cover" />
                          </div>
                        )}
                      </div>

                      {/* Shipping Method Selection */}
                      <div className="space-y-3 pt-2">
                        <label className="block text-[11px] text-gray-500 font-bold mb-1">تحویل بار (تعهد ما: تحویل درب انبار شبستر)</label>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { id: 'barbari', name: 'باربری (نیسان/وانت)', icon: '🚛', desc: 'تحویل انبار شبستر' },
                            { id: 'khavar', name: 'کامیونت خاور', icon: '🚚', desc: 'درب کارخانه' },
                            { id: 'deka', name: 'دکا پست (اکسپرس)', icon: '📦', desc: 'تحویل انبار شبستر' },
                            { id: 'personal', name: 'تحویل حضوری (شخصی)', icon: '🏭', desc: 'درب انبار شبستر' }
                          ].map((method, idx) => (
                            <button
                              key={`ship-method-${method.id}-${idx}`}
                              onClick={() => setShippingMethod(method.id)}
                              className={`flex flex-col items-center justify-center p-3 rounded-xl border text-right transition-all ${
                                shippingMethod === method.id
                                  ? "border-sky-500 bg-sky-50"
                                  : "border-gray-100 hover"
                              }`}
                            >
                              <span className="text-xl mb-1">{method.icon}</span>
                              <span className="text-[10px] font-black text-slate-900">{method.name}</span>
                              <span className="text-[8px] text-slate-400 font-bold">{method.desc}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {cart.length > 0 && (() => {
                const badgeDiscountPercent = getBadgeDiscountPercent(userBadge);
                const badgeDiscountAmount = Math.round(totalAmount * (badgeDiscountPercent / 100));
                
                const isCheque = paymentMethod === 'full_check' || paymentMethod === 'half_check';
                
                const totalQuantity = cart.reduce((sum, item) => sum + item.quantityCartons, 0);
                const bulkDiscount = !isCheque ? getBestDiscount(totalAmount, totalQuantity) : { percent: 0, type: 'none' };
                const hasTierDiscount = bulkDiscount.percent > 0;

                let paymentDiscountAmount = 0;
                let paymentPriceDifference = 0;

                if (paymentMethod === 'cash') {
                  if (!hasTierDiscount) {
                    paymentDiscountAmount = Math.round((totalAmount - badgeDiscountAmount) * 0.05); // 5% cash discount
                  }
                } else if (paymentMethod === 'full_check') {
                  paymentPriceDifference = Math.round((totalAmount - badgeDiscountAmount) * 0.10); // 10% markup
                }

                const bulkDiscountAmount = hasTierDiscount 
                  ? Math.round((totalAmount - badgeDiscountAmount) * (bulkDiscount.percent / 100))
                  : 0;

                const finalPayableAmount = totalAmount - badgeDiscountAmount - paymentDiscountAmount - bulkDiscountAmount + paymentPriceDifference;

                return (
                  <div className="p-6 border-t space-y-4 bg-white">
                    <div className="space-y-2 text-xs font-bold border-b pb-3 border-dashed">
                      <div className="flex justify-between text-gray-500">
                        <span>مجموع ناخالص کارتن‌ها ({totalQuantity} عدد):</span>
                        <span>{totalAmount.toLocaleString()} تومان</span>
                      </div>
                      {badgeDiscountAmount > 0 && (
                        <div className="flex justify-between text-emerald-700">
                          <span>تخفیف نشان {getBadgeLabel(userBadge)}:</span>
                          <span>-{badgeDiscountAmount.toLocaleString()} تومان (%{badgeDiscountPercent})</span>
                        </div>
                      )}
                      {bulkDiscountAmount > 0 && (
                        <div className="flex justify-between text-emerald-600">
                          <span className="flex items-center gap-1">
                             <Tag size={12} />
                             تخفیف حجمی {bulkDiscount.type === 'quantity' ? '(تیراژ بالا)' : '(خرید میلیاردی)'}:
                          </span>
                          <span>-{bulkDiscountAmount.toLocaleString()} تومان (%{bulkDiscount.percent})</span>
                        </div>
                      )}
                      {paymentDiscountAmount > 0 && (
                        <div className="flex justify-between text-teal-600">
                          <span className="flex items-center gap-1">
                             <Percent size={12} />
                             تخفیف تسویه نقدی (۵٪):
                          </span>
                          <span>-{paymentDiscountAmount.toLocaleString()} تومان</span>
                        </div>
                      )}
                      {paymentPriceDifference > 0 && (
                        <div className="flex justify-between text-amber-700">
                          <span className="flex items-center gap-1">
                             <CreditCard size={12} />
                             کارمزد خرید چکی (۱۰٪+):
                          </span>
                          <span>+{paymentPriceDifference.toLocaleString()} تومان</span>
                        </div>
                      )}

                      {paymentMethod === 'half_check' && (() => {
                        const allowedChequeCredit = Number((user as any)?.buyerCredit ?? (b2bConfig?.buyerCredit ?? 50000000));
                        const standardHalf = Math.round(finalPayableAmount * 0.5);
                        const isOverCredit = standardHalf > allowedChequeCredit;
                        const actualChequeShare = isOverCredit ? allowedChequeCredit : standardHalf;
                        const actualCashShare = finalPayableAmount - actualChequeShare;

                        return (
                          <div className="space-y-2 p-3 bg-emerald-50/80 rounded-2xl border border-indigo-200/80 text-indigo-950">
                            <div className="flex justify-between items-center text-xs font-black border-b border-indigo-200/60 pb-1.5">
                              <span className="flex items-center gap-1.5 text-slate-900">
                                <Receipt size={14} className="text-emerald-700" />
                                تفکیک تسویه نصف نقد / نصف چک:
                              </span>
                              <button
                                type="button"
                                onClick={() => setShowChequeCharterModal(true)}
                                className="text-[10px] text-emerald-800 hover:text-slate-900 font-black underline cursor-pointer"
                              >
                                اساس‌نامه چکی 📜
                              </button>
                            </div>
                            
                            <div className="flex justify-between items-center text-[11px] font-black">
                              <span>سهم پرداختی نقدی:</span>
                              <span className="font-mono text-emerald-700 font-black">{actualCashShare.toLocaleString()} تومان</span>
                            </div>

                            <div className="flex justify-between items-center text-[11px] font-black">
                              <span>سهم چک صیادی بنفش:</span>
                              <span className="font-mono text-emerald-800 font-black">
                                {actualChequeShare.toLocaleString()} تومان
                                {isOverCredit && <span className="text-[9px] text-emerald-600 font-sans mr-1">(سقف مجاز)</span>}
                              </span>
                            </div>

                            {isOverCredit && (
                              <div className="p-2 bg-amber-100/70 rounded-xl border border-amber-200/80 text-[10px] font-medium text-amber-900 leading-tight">
                                💡 با توجه به سقف اعتبار اولیه ۵۰ میلیون تومانی چک، سهم چک ۵۰ م تومان محاسبه شده و مبلغ {actualCashShare.toLocaleString()} تومان به صورت نقد تسویه می‌گردد.
                              </div>
                            )}

                            <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 pt-1 border-t border-indigo-100/60">
                              <span>سقف اعتبار چکی فعال شما:</span>
                              <span className="font-mono">{allowedChequeCredit.toLocaleString()} تومان</span>
                            </div>
                          </div>
                        );
                      })()}

                      {paymentMethod === 'full_check' && (() => {
                        const allowedChequeCredit = Number((user as any)?.buyerCredit ?? (b2bConfig?.buyerCredit ?? 50000000));
                        const isOver = finalPayableAmount > allowedChequeCredit;
                        return (
                          <div className="space-y-2 p-3 bg-amber-50/80 rounded-2xl border border-amber-200/80 text-amber-950">
                            <div className="flex justify-between items-center text-xs font-black border-b border-amber-200/60 pb-1.5">
                              <span className="flex items-center gap-1.5 text-amber-900">
                                <FileText size={14} className="text-amber-600" />
                                تسویه تمام‌چکی (خرید امانی):
                              </span>
                              <button
                                type="button"
                                onClick={() => setShowChequeCharterModal(true)}
                                className="text-[10px] text-amber-800 hover:text-amber-950 font-black underline cursor-pointer"
                              >
                                اساس‌نامه چکی 📜
                              </button>
                            </div>

                            <div className="flex justify-between items-center text-[11px] font-black">
                              <span>سهم چک صیادی تمام‌مدت:</span>
                              <span className="font-mono text-amber-800 font-black">{finalPayableAmount.toLocaleString()} تومان</span>
                            </div>

                            {isOver && (
                              <div className="p-2 bg-rose-100/80 rounded-xl border border-rose-200/80 text-[10px] font-bold text-rose-900 leading-tight">
                                ⚠ مبلغ کل فاکتور از سقف اعتبار چکی شما بیشتر است. لطفاً مبلغ سفارش را کاهش داده یا گزینه «نصف نقد / نصف چک» را انتخاب فرمایید.
                              </div>
                            )}

                            <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 pt-1 border-t border-amber-100/60">
                              <span>سقف اعتبار مجاز چکی شما:</span>
                              <span className="font-mono">{allowedChequeCredit.toLocaleString()} تومان</span>
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    <div className="flex justify-between items-center text-lg font-black">
                      <span className="text-gray-600">مبلغ خالص نهایی:</span>
                      <span className="text-2xl text-emerald-600">{finalPayableAmount.toLocaleString()} تومان</span>
                    </div>

                    {checkoutError && (
                      <div className="p-3 text-[11px] text-rose-700 bg-rose-50 rounded-xl border border-rose-200/20 font-black text-center animate-fade-in">
                        ⚠ {checkoutError}
                      </div>
                    )}
                    
                    <button 
                      disabled={orderStatus !== 'idle'}
                      onClick={handleCheckout}
                      className={`w-full text-white py-4 rounded-2xl font-black text-base transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg cursor-pointer ${
                        b2bConfig.primaryColor === 'indigo' ? "bg-emerald-700 hover shadow-emerald-700/20" :
                        b2bConfig.primaryColor === 'amber' ? "bg-amber-600 hover shadow-amber-600/20" :
                        b2bConfig.primaryColor === 'sky' ? "bg-sky-600 hover shadow-sky-600/20" :
                        b2bConfig.primaryColor === 'teal' ? "bg-teal-600 hover shadow-teal-600/20" :
                        b2bConfig.primaryColor === 'violet' ? "bg-violet-600 hover shadow-violet-600/20" :
                        "bg-emerald-600 hover shadow-emerald-600/20"
                      }`}
                    >
                      {orderStatus === 'processing' ? (
                        <>
                          <Loader2 className="animate-spin" />
                          در حال اتصال به سامانه پرداخت...
                        </>
                      ) : orderStatus === 'success' ? (
                        <>
                          <CheckCircle2 />
                          پرداخت و صدور فاکتور انجام شد
                        </>
                      ) : (
                        "تایید نهایی و پرداخت آنلاین امن"
                      )}
                    </button>
                    <p className="text-center text-[10px] text-emerald-600 font-black">
                      🔒 پرداخت مستقیم به درگاه بانکی متصل به شبکه شتاب و بانک مرکزی
                    </p>
                  </div>
                );
              })()}
            </motion.div>
          </>
      )}

      {/* Catalog Download Modal */}
      <CatalogDownloadModal 
        isOpen={isCatalogOpen} 
        onClose={() => {
          setIsCatalogOpen(false);
          setCatalogInitialMarkup(null);
          setCatalogAutoPrint(false);
        }} 
        products={products} 
        user={user}
        initialMarkup={catalogInitialMarkup}
        autoPrint={catalogAutoPrint}
      />

      {/* Auth Modal (Login / Signup) */}
      <AuthModal 
        isOpen={showAuthModal}
        onClose={() => {
          setShowAuthModal(false);
          setTimeout(() => {
            setAuthInitialRole('customer');
            setAuthInitialMode('login');
          }, 300);
        }}
        b2bConfig={b2bConfig}
        initialRole={authInitialRole}
        initialMode={authInitialMode}
        onAuthSuccess={(loggedInUser) => {
          setUser(loggedInUser);
          if (loggedInUser.badge) {
            setUserBadge(loggedInUser.badge);
          }
          if (loggedInUser.role === 'admin') {
            setActiveTab('admin');
            setUserBadge('admin');
          } else if (loggedInUser.role === 'ad_poster') {
            setActiveTab('ad_poster_panel');
          }
          setShowAuthModal(false);

          // If regular user or new account, trigger role selection & commercial profile wizard
          const userAny = loggedInUser as any;
          if (userAny.role !== 'admin' && !userAny.roleSelectedAt && (!userAny.company || !userAny.city || userAny.isNewUser)) {
            setTimeout(() => {
              setShowRoleSelectionModal(true);
            }, 350);
          }
        }}
      />

      {/* Post-Login Commercial Role Selection & Profile Setup Wizard */}
      <RoleSelectionModal
        isOpen={showRoleSelectionModal}
        onClose={() => setShowRoleSelectionModal(false)}
        user={user}
        b2bConfig={b2bConfig}
        onRoleSelected={(updatedUser) => {
          setUser(updatedUser);
          saveUserSession(updatedUser);
          if (updatedUser.badge) {
            setUserBadge(updatedUser.badge);
          }
          setShowRoleSelectionModal(false);
        }}
      />

      {/* Real Zarinpal Payment Modal for platform paid upgrades */}
      <ZarinpalPaymentModal 
        isOpen={zarinpalOpen}
        onClose={() => setZarinpalOpen(false)}
        amount={zarinpalAmount}
        description={zarinpalDescription}
        onSuccess={() => {
          if (zarinpalCallback) {
            zarinpalCallback(true);
          }
        }}
      />

      {/* SMS newsletter alert subscription for B2B buyers */}
      <SmsNewsletterSection />

      {/* Clean, Minimalist, Elegant Footer */}
      <footer className="bg-white text-slate-600 border-t border-slate-100 py-10 mt-12 relative overflow-hidden" dir="rtl">
        <div className="absolute inset-0 bg-slate-50/50"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8 pb-8 border-b border-slate-100">
            {/* Brand and Slogan */}
            <div className="flex flex-col items-center md:items-start text-center md:text-right space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-slate-50 rounded-xl flex items-center justify-center p-2 text-slate-900 shadow-sm ring-4 ring-slate-100 border border-slate-200">
                  <DastavvalLogo size={24} showText={false} logoUrl={b2bConfig.logoUrl} />
                </div>
                <h3 className="text-sm font-black text-slate-900 tracking-tight">{b2bConfig.appName || "بازرگانی دست اول"}</h3>
              </div>
              <p className="text-slate-500 text-[11px] font-bold max-w-sm">
                تأمین بی‌واسطه و توزیع مویرگی مستقیم از خطوط تولید کارخانجات تراز اول به مقصد انبارهای سراسر کشور.
              </p>
            </div>

            {/* Trust Badges Column */}
            <div className="flex flex-col items-center justify-center">
              <TrustBadges b2bConfig={b2bConfig} />
            </div>

            {/* Quick Contact & Socials */}
            <div className="flex flex-col items-center md:items-end gap-3">
              <div className="flex items-center gap-2">
                {[
                  { name: 'روبیکا', href: 'https://rubika.ir/dastavval_com' },
                  { name: 'اینستاگرام', href: 'https://instagram.com/dastavval_official' }
                ].map((social, idx) => (
                  <a 
                    key={`foot-social-${social.name}-${idx}`} 
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-emerald-700 transition-colors text-[10px] font-black"
                  >
                    {social.name}
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom copyright & simplified info */}
          <div className="pt-6 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] font-bold text-slate-400">
            <div className="flex items-center gap-3 flex-wrap justify-center md:justify-start">
              <p className="flex items-center gap-1.5">
                © {new Date().getFullYear()} <span className="text-slate-600">{b2bConfig.appName || "بازرگانی دست اول"}</span>. تمامی حقوق محفوظ است.
              </p>
              {/* Network Status Widget & Online Visitors in Footer */}
              <NetworkStatusWidget
                currentViewMode={viewMode}
                onSwitchToListMode={() => setViewMode('list')}
                onUpgradeToFullMode={() => setViewMode('grid')}
              />

              <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200/80 text-emerald-800 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span>بازدیدکنندگان آنلاین:</span>
                <span className="font-mono font-black text-emerald-700">{toPersianNum(liveVisitors)} نفر</span>
              </div>
            </div>
            <div className="flex flex-wrap justify-center gap-4 md:gap-6">
              <button onClick={() => setActiveTab('support')} className="hover:text-emerald-700 transition-colors">قوانین و مقررات</button>
              <button onClick={() => setActiveTab('support')} className="hover:text-emerald-700 transition-colors">حریم خصوصی</button>
              <div className="hidden md:block w-1 h-1 rounded-full bg-slate-300 self-center"></div>
              <span className="text-slate-500 flex items-center gap-1.5 bg-slate-50 px-3 py-1 rounded-full">
                <MapPin size={12} className="text-slate-400" />
                دفتر مرکزی: {b2bConfig.hqAddress || "شبستر، شهرک صنعتی شندآباد"}
              </span>
            </div>
          </div>
        </div>
      </footer>
      <AIAdvisor mascotUrl={b2bConfig.mascotUrl} productsContext={activeProducts} />

      <GapGptAssistant
        isOpen={isGapGptModalOpen}
        onClose={() => setIsGapGptModalOpen(false)}
        productsContext={products}
      />

      <PwaInstallModal
        isOpen={showPwaModal}
        onClose={() => setShowPwaModal(false)}
        appName={b2bConfig.appName || "دست اول"}
        logoUrl={b2bConfig.logoUrl}
      />

      {/* Floating Scroll To Top Button (Positioned comfortably on the left side to prevent overlap with right-side contact button) */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            onClick={scrollToTop}
            className="lg:hidden fixed bottom-38 left-5 sm:bottom-24 sm:left-6 z-40 p-3 bg-white/95 backdrop-blur-md hover:bg-slate-50 text-slate-800 rounded-2xl shadow-lg hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer border border-slate-200 flex items-center justify-center group"
            title="بازگشت به بالای صفحه"
          >
            <ArrowUp size={20} className="text-slate-800 group-hover:-translate-y-0.5 transition-transform" />
          </motion.button>
        )}
      </AnimatePresence>


      <OnboardingModal 
        isOpen={showOnboarding} 
        onClose={() => {
          setShowOnboarding(false);
          localStorage.setItem('hasSeenOnboarding_v2', 'true');
        }} 
        theme={theme}
        onSelectAction={(tab: any) => {
          setActiveTab(tab);
          setShowOnboarding(false);
        }}
      />
      <OrderSuccessModal 
        isOpen={showOrderSuccess} 
        onClose={() => {
          setShowOrderSuccess(false);
          setActiveTab('presentation');
        }}
        trackingNumber={lastOrderTracking}
        amount={lastOrderAmount}
        onPrintInvoice={() => {
          setShowOrderSuccess(false);
          if (!lastCreatedOrder) {
            setLastCreatedOrder({
              id: lastOrderTracking || "INV-" + Date.now().toString().slice(-6),
              trackingNumber: lastOrderTracking || "IR-" + Math.floor(100000 + Math.random() * 900000),
              totalAmount: lastOrderAmount || 5000000,
              status: 'pending',
              createdAt: new Date().toISOString(),
              paymentMethod: 'cash',
              buyerInfo: user ? {
                name: user.name,
                phone: user.mobile || user.phone,
                company: user.company,
                address: user.address
              } : undefined,
              items: cart.length > 0 ? cart : [
                {
                  productId: "item-1",
                  name: "محصول خریده شده خط تولید کارخانه",
                  quantityCartons: 5,
                  pricePerCarton: Math.round((lastOrderAmount || 5000000) / 5),
                  totalItems: 120,
                }
              ]
            });
          } else {
            // Re-open invoice
            const current = lastCreatedOrder;
            setLastCreatedOrder(null);
            setTimeout(() => setLastCreatedOrder(current), 50);
          }
        }}
      />
      <ProductDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        product={selectedDetailProduct}
        userBadge={userBadge}
        user={user}
        onAddToCart={addToCart}
        onGoToProductPage={openProductPage}
        onOrderSuccess={(trackingNumber, amount) => {
          setLastOrderTracking(trackingNumber);
          setLastOrderAmount(amount);
          setShowOrderSuccess(true);
          setIsDetailModalOpen(false);
          if (selectedDetailProduct) {
            setLastCreatedOrder({
              id: trackingNumber,
              trackingNumber: trackingNumber,
              totalAmount: amount,
              status: 'pending',
              createdAt: new Date().toISOString(),
              paymentMethod: 'cash',
              buyerInfo: user ? {
                name: user.name,
                phone: user.mobile || user.phone,
                company: user.company,
                address: user.address
              } : undefined,
              items: [{
                productId: selectedDetailProduct.id,
                name: selectedDetailProduct.name,
                quantityCartons: Math.max(5, selectedDetailProduct.min_order_cartons || 5),
                pricePerCarton: selectedDetailProduct.bulk_price * selectedDetailProduct.carton_pack_count,
                totalItems: Math.max(5, selectedDetailProduct.min_order_cartons || 5) * selectedDetailProduct.carton_pack_count,
                image_url: selectedDetailProduct.image_url
              }]
            });
          }
        }}
      />

      {/* Floating PWA Install Banner */}
      <PwaInstallBanner
        appName={b2bConfig.appName}
        logoUrl={b2bConfig.logoUrl}
        onOpenModal={() => setShowPwaModal(true)}
      />

      {/* Announcement Detail Modal */}
      <AnimatePresence>
        {showAnnouncementModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAnnouncementModal(false)}
              className="absolute inset-0 bg-white/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl border border-amber-500/20 p-8 text-right overflow-hidden"
              dir="rtl"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl -mr-16 -mt-16" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl -ml-16 -mb-16" />
              
              <button 
                onClick={() => setShowAnnouncementModal(false)}
                className="absolute top-6 left-6 p-2 text-slate-400 hover transition-colors"
              >
                <X size={20} />
              </button>

              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-purple-100 text-purple-700 rounded-2xl flex items-center justify-center">
                  <Award size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-emerald-900">
                    {b2bConfig.topAnnouncementPopupTitle || "اطلاعیه مهم تامین کالا"}
                  </h3>
                  <p className="text-xs text-slate-400 font-bold">بخش بازرگانی انبار مرکزی دست اول</p>
                </div>
              </div>

              <div className="prose prose-sm prose-slate max-w-none">
                <p className="text-sm font-bold text-slate-600 leading-loose text-justify whitespace-pre-wrap">
                  {b2bConfig.topAnnouncementPopupContent || b2bConfig.topAnnouncement}
                </p>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => {
                    setShowAnnouncementModal(false);
                    setActiveTab('order');
                  }}
                  className="flex-1 bg-purple-700 hover text-white font-black text-xs py-3 rounded-xl transition-all shadow-lg shadow-purple-900/20 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ShoppingBag size={14} />
                  مشاهده لیست محصولات جشنواره
                </button>
                <button
                  onClick={() => setShowAnnouncementModal(false)}
                  className="px-6 py-3 border border-slate-200 text-slate-500 font-black text-xs rounded-xl hover transition-all cursor-pointer"
                >
                  بستن
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Network Disconnection and Offline Sync Toast */}
      <OfflineBanner onSyncPendingData={fetchProducts} />

      {/* Cheque Charter and Credit Rules Modal */}
      <ChequeCharterModal 
        isOpen={showChequeCharterModal}
        onClose={() => setShowChequeCharterModal(false)}
        userCredit={Number((user as any)?.buyerCredit ?? (b2bConfig?.buyerCredit ?? 50000000))}
      />

      {/* Magic cPanel Installation & GitHub Sync Wizard */}
      {isCPanelWizardOpen && (
        <Suspense fallback={<ModalSkeleton />}>
          <FadeInContainer>
            <CPanelInstallerWizard 
              isOpen={isCPanelWizardOpen}
              onClose={() => setIsCPanelWizardOpen(false)}
              b2bConfig={b2bConfig}
              onUpdateConfig={setB2bConfig}
            />
          </FadeInContainer>
        </Suspense>
      )}
    </div>
  );
}
