import React, { useState, useEffect, Suspense } from "react";
import { collection, getDocs, addDoc, serverTimestamp, query, orderBy, doc, updateDoc, deleteDoc } from "./lib/firebase-mock";
import { db } from "./lib/firebase";
import { seedProductsIfEmpty, INITIAL_PRODUCTS } from "./lib/db-helper";
import { cacheProducts, getCachedProducts } from "./lib/db";
import { Product, OrderItem, Order } from "./types";
import { getDisplayImageUrl } from "./lib/image-utils";
import Navbar from "./components/Navbar";
import ProductCard from "./components/ProductCard";
import CatalogDownloadModal from "./components/CatalogDownloadModal";
import AIAdvisor from "./components/AIAdvisor";
import DynamicPresentation from "./components/DynamicPresentation";
import AuthModal from "./components/AuthModal";
import QuickOrderList from "./components/QuickOrderList";
import NewsSection from "./components/NewsSection";
import ProductComparison from "./components/ProductComparison";
import OnboardingModal from "./components/OnboardingModal";
import FactoryCompetition from "./components/FactoryCompetition";
import SiteRoadmap from "./components/SiteRoadmap";
import { AboutUsSection, ContactSection, TrustSection } from "./components/InfoSections";
import MagazineSection from "./components/MagazineSection";
import OrderSuccessModal from "./components/OrderSuccessModal";
import ProductDetailModal from "./components/ProductDetailModal";
import MultiVendorPanel from "./components/MultiVendorPanel";
import ZarinpalPaymentModal from "./components/ZarinpalPaymentModal";
import DastavvalLogo from "./components/DastavvalLogo";
import TrustBadges from "./components/TrustBadges";
import PwaInstallModal from "./components/PwaInstallModal";
import PwaInstallBanner from "./components/PwaInstallBanner";
import LazyViewport from "./components/LazyViewport";
import VirtualizedProductGrid from "./components/VirtualizedProductGrid";

import CheckoutWizard from "./components/CheckoutWizard";
import WholesaleInvoiceView from "./components/WholesaleInvoiceView";
import ChequeCharterModal from "./components/ChequeCharterModal";

// Lazy loading heavy view sections for optimal page-load and rendering performance
const WholesaleCatalogView = React.lazy(() => import("./components/WholesaleCatalogView"));
const B2BNews = React.lazy(() => import("./components/B2BNews"));
const SupportCenter = React.lazy(() => import("./components/SupportCenter"));
const FactoriesView = React.lazy(() => import("./components/FactoriesView"));
const AdminPanel = React.lazy(() => import("./components/AdminPanel"));
const UserPanel = React.lazy(() => import("./components/UserPanel"));
const B2BBusinessDashboard = React.lazy(() => import("./components/B2BBusinessDashboard"));
const AdBoard = React.lazy(() => import("./components/AdBoard"));
const CPanelInstallerWizard = React.lazy(() => import("./components/CPanelInstallerWizard"));
const DealershipRequestView = React.lazy(() => import("./components/DealershipRequestView"));
const B2BProfitSimulator = React.lazy(() => import("./components/B2BProfitSimulator").then(m => ({ default: m.B2BProfitSimulator })));
import { INITIAL_NEWS, INITIAL_FACTORIES, INITIAL_CATEGORIES } from "./lib/db-helper";
import { getBestDiscount } from "./lib/discounts";
import { recordCRMOrder } from "./lib/crm-helper";
import { registerRegionalOrderFromCheckout } from "./lib/leads-store";
import { getProductRolePricing, toPersianDigits } from "./lib/pricing";
import { motion, AnimatePresence } from "motion/react";
import { X, ShoppingBag, CheckCircle2, Loader2, AlertCircle, Settings, Package, Layers, FileText, Activity, ShieldCheck, MapPin, Phone, Mail, Printer, Grid, List, Sparkles, Building, Building2, Award, MessageSquare, DollarSign, TrendingUp, TrendingDown, Percent, ArrowUpRight, Gift, Percent as PercentIcon, Tag, Download, ChevronRight, BrainCircuit, LayoutDashboard, BookOpen, Zap, CreditCard, Receipt, Home, User, Compass, ArrowUp, Upload, Edit2, Trash2, Plus, Check, Palette, Paintbrush, Search } from "lucide-react";
import { SectionSkeleton, CatalogSkeleton, TableSkeleton, DashboardSkeleton, ModalSkeleton, CalculatorSkeleton, FadeInContainer } from "./components/Skeleton";
import { translations, Language } from "./lib/translations";
import { generateId, generateProductCode, generateFactoryCode, generateUserCode, generateCategoryCode } from "./lib/id-utils";
import { PaymentMethod } from "./types";
import { updatePageSEO, SEO_TAB_CONFIGS, getProductSEOMetadata, getCategorySEOMetadata } from "./utils/seoHelper";

const CATEGORIES = ["همه"];

export const ORGANIC_PALETTES = [
  {
    name: "آبی متریال گوگل و فیروزه‌ای مجلل",
    emerald50: "#f0f7ff",
    emerald100: "#e0effe",
    emerald200: "#bcdbfe",
    emerald300: "#84beff",
    emerald400: "#4396ff",
    emerald500: "#1a73e8",
    emerald600: "#1557b0",
    emerald700: "#174ea6",
    emerald800: "#185abc",
    emerald900: "#0d47a1",
    amber50: "#e0f7fa",
    amber100: "#b2ebf2",
    amber200: "#80deea",
    amber300: "#4dd0e1",
    amber400: "#26c6da",
    amber500: "#00bcd4",
    amber600: "#00acc1",
    amber700: "#0097a7",
    amber800: "#00838f",
    amber950: "#006064"
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

export default function App() {
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
  const [interfaceMode, setInterfaceMode] = useState<'simple' | 'advanced'>('advanced');
  const [userBadge, setUserBadge] = useState<'bronze' | 'silver' | 'gold' | 'vip' | 'admin'>('bronze');
  const INITIAL_DEFAULT_FACTORIES: any[] = [];

  const [b2bConfig, setB2bConfig] = useState<any>(() => {
    try {
      const saved = localStorage.getItem("dastavval_b2b_config");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed) {
          if (!parsed.factories) {
            parsed.factories = [];
          }
          parsed.primaryColor = "sky";
          return parsed;
        }
      }
    } catch (e) {}
    return {
      primaryColor: "emerald",
      appName: "دست اول",
      appSub: "مرجع مبادلات مستقیم و تامین کالای عمده از درب کارخانه",
      factories: [],
      categories: [],
      logoUrl: "https://raw.githubusercontent.com/antigravity-agent/media/main/dastavval_logo.png",
      mascotUrl: "/assets/mascot_character.jpg",
      buyerCredit: 250000000,
      supportPhone: "09999123001",
      minOrderAmount: 3000000, // 3 Million Toman default minimum order
      minOrderCartons: 3,
      topAnnouncement: "",
      showTopAnnouncement: false,
      lastGithubUpdate: null
    };
  });

  const [appMode, setAppMode] = useState<'presentation' | 'portal'>('presentation');
  const [activeTab, setActiveTab] = useState<'presentation' | 'order' | 'portal' | 'admin' | 'news' | 'profile' | 'user' | 'factories' | 'about' | 'learning' | 'support' | 'vendor' | 'billboard' | 'dealership' | 'agency' | 'dealership_request' | 'rep_cert' | 'certificate'>('presentation');
  const [currentSellerId, setCurrentSellerId] = useState<string>("factory_cheetoz");
  const [currentSellerName, setCurrentSellerName] = useState<string>("مزمز و چیتوز");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Live GitHub Hot-Update Sync and Cache-Busting engine states
  const [currentVersion, setCurrentVersion] = useState<any>(null);
  const [newVersionAvailable, setNewVersionAvailable] = useState<boolean>(false);
  const [newVersionInfo, setNewVersionInfo] = useState<any>(null);
  const [isUpdatingState, setIsUpdatingState] = useState<boolean>(false);
  const [activeCategory, setActiveCategory] = useState("همه");
  const [selectedBrand, setSelectedBrand] = useState("همه");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<'table' | 'grid' | 'list' | 'high_margin'>('grid');
  const [sortBy, setSortBy] = useState<'default' | 'best-selling' | 'newest' | 'price-asc' | 'price-desc'>('default');
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [showQuickRegister, setShowQuickRegister] = useState(false);
  const [firestoreStatus, setFirestoreStatus] = useState<'online' | 'offline' | 'checking'>('checking');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [orderStatus, setOrderStatus] = useState<'idle' | 'processing' | 'success'>('idle');
  const [checkoutError, setCheckoutError] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [comparisonList, setComparisonList] = useState<Product[]>([]);
  const [isComparisonOpen, setIsComparisonOpen] = useState(false);
  const [showOrderSuccess, setShowOrderSuccess] = useState(false);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [showChequeCharterModal, setShowChequeCharterModal] = useState(false);
  const [showPwaModal, setShowPwaModal] = useState(false);
  const [isCPanelWizardOpen, setIsCPanelWizardOpen] = useState(false);
  const [lastOrderTracking, setLastOrderTracking] = useState("");
  const [lastOrderAmount, setLastOrderAmount] = useState(0);
  const [lastCreatedOrder, setLastCreatedOrder] = useState<any | null>(null);

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
        image: "https://images.unsplash.com/photo-1581798459219-318e76aecc7b?auto=format&fit=crop&q=80&w=600"
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
      image: "https://images.unsplash.com/photo-1581798459219-318e76aecc7b?auto=format&fit=crop&q=80&w=600"
    });
    
    handleUpdateB2bConfig({
      ...b2bConfig,
      categories: updatedCategories
    });
    
    setNewCatName("");
    setShowAddCat(false);
  };

  // Detail modal states
  const [selectedDetailProduct, setSelectedDetailProduct] = useState<Product | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [showAllHomepageProducts, setShowAllHomepageProducts] = useState(false);
  const [initialFactoryIdParam, setInitialFactoryIdParam] = useState<string | null>(null);

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

  // Read URL query parameter for direct factory or article links
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const factoryParam = params.get('factory');
      if (factoryParam) {
        setInitialFactoryIdParam(factoryParam);
        setActiveTab('factories');
      }
      const articleParam = params.get('article');
      if (articleParam) {
        setActiveTab('news');
      }
    }
  }, []);

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
      const res = await fetch("/api/articles");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          localStorage.setItem("dastavval_news_articles", JSON.stringify(data));
          setArticles(data);
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

  useEffect(() => {
    try {
      const usersObj = JSON.parse(localStorage.getItem("dastavval_local_users") || "{}");
      const users = Object.values(usersObj);
      const rep = users.find((u: any) => 
        (u.agencyApproved === true || u.role === 'representative' || u.role === 'agency') && 
        (u.city === userCity || u.province === userProvince || u.agencyProvince === userProvince)
      );
      setCityAgency(rep || null);
    } catch(e) {
      setCityAgency(null);
    }
  }, [userCity, userProvince]);

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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
      if (!skipStateUpdate) {
        setProducts(prev => [...prev, { id: docRef.id, ...prodWithCode } as Product]);
      }
    } catch (err) {
      console.error("Error adding product:", err);
      if (!skipStateUpdate) {
        const fallbackId = `local-new-${Date.now()}`;
        setProducts(prev => [...prev, { id: fallbackId, ...prodWithCode } as Product]);
      }
    }
  };

  const handleUpdateProduct = async (id: string, updatedFields: Partial<Product>, skipStateUpdate = false) => {
    if (!skipStateUpdate) {
      setProducts(prev => prev.map(p => p.id === id ? { ...p, ...updatedFields } : p));
    }
    try {
      const productRef = doc(db, "products", id);
      await updateDoc(productRef, updatedFields);
    } catch (err) {
      console.error("Error updating product:", err);
    }
  };

  const handleDeleteProduct = async (id: string, skipStateUpdate = false) => {
    if (!skipStateUpdate) {
      setProducts(prev => prev.filter(p => p.id !== id));
    }
    try {
      const productRef = doc(db, "products", id);
      await deleteDoc(productRef);
    } catch (err) {
      console.error("Error deleting product from DB:", err);
    }
  };

  const handleBatchDeleteProducts = async (ids: string[]) => {
    setProducts(prev => prev.filter(p => !ids.includes(p.id)));
    try {
      const { batchDelete } = await import('./lib/firebase-mock');
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

  const handleBulkUpdateProducts = async (updatedProductsList: Product[]) => {
    setProducts(updatedProductsList);
    try {
      const { saveCollection } = await import('./lib/firebase-mock');
      if (saveCollection) {
        saveCollection("products", updatedProductsList);
      }
    } catch (err) {
      console.error("Error in bulk updating products:", err);
    }
  };

  const fetchB2bConfig = async () => {
    try {
      const res = await fetch("/api/b2b/config");
      const contentType = res.headers.get("content-type");
      if (res.ok && contentType && contentType.includes("application/json")) {
        const data = await res.json();
        if (data && typeof data === 'object') {
          setB2bConfig((prev: any) => {
            // Smart Merge: If server returns empty factories/categories but prev had them, 
            // it might be a temporary server-side issue or uninitialized file.
            // We only overwrite if data actually has items OR if it's explicitly non-empty.
            const factories = (data.factories && data.factories.length > 0) ? data.factories : (prev.factories?.length > 0 ? prev.factories : INITIAL_FACTORIES);
            const categories = (data.categories && data.categories.length > 0) ? data.categories : (prev.categories?.length > 0 ? prev.categories : INITIAL_CATEGORIES);
            const logoUrl = data.logoUrl || prev.logoUrl || "https://raw.githubusercontent.com/antigravity-agent/media/main/dastavval_logo.png";
            
            const merged = { 
              ...prev, 
              ...data,
              factories,
              categories,
              logoUrl
            };
            
            try {
              localStorage.setItem("dastavval_b2b_config", JSON.stringify(merged));
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
    setB2bConfig(updatedConfig);
    try {
      localStorage.setItem("dastavval_b2b_config", JSON.stringify(updatedConfig));
    } catch (e) {}

    try {
      const res = await fetch("/api/b2b/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedConfig)
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.config) {
          setB2bConfig(data.config);
          try {
            localStorage.setItem("dastavval_b2b_config", JSON.stringify(data.config));
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
    const handleOpenCatalogModal = () => setIsCatalogOpen(true);
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
          "mock_db_products",
          "mock_db_factories",
          "mock_db_news",
          "mock_db_orders",
          "mock_db_reviews",
          "dastavval_b2b_config",
          "dastavval_custom_factories",
          "dastavval_seller_profile",
          "dastavval_price_alerts",
          "dastavval_raw_orders",
          "dastavval_local_users",
          "dastavval_user",
          "dastavval_crm_leads"
        ];
        keysToClear.forEach(key => {
          try { localStorage.removeItem(key); } catch (e) {}
        });
        try { localStorage.setItem("dastavval_v6_clean", "true"); } catch (e) {}
      }
    } catch (e) {
      console.warn("localStorage initialization check error:", e);
    }

    setLoading(true);
    
    // Check Firestore Connection Status
    try {
      const { getDocFromServer, doc: fireDoc } = await import('./lib/firebase-mock');
      await getDocFromServer(fireDoc(db, '_connection_test_', 'ping'));
      setFirestoreStatus('online');
    } catch (e) {
      console.warn("Firestore status check failed:", e);
      setFirestoreStatus('offline');
    }

    try {
      await seedProductsIfEmpty();
    } catch (e) {
      console.warn("Seeding failed, proceeding to load products:", e);
    }
    await fetchProducts();
    await fetchDailyPresentation();
    await fetchB2bConfig();
    await fetchArticles();
  };

  const fetchDailyPresentation = async () => {
    try {
      const res = await fetch("/api/ai/daily-presentation");
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

  const fetchProducts = async () => {
    try {
      // First try to load from IndexedDB for instant display
      const cached = await getCachedProducts();
      if (cached && cached.length > 0) {
        setProducts(cached);
        setLoading(false);
      }

      const q = query(collection(db, "products"));
      const querySnapshot = await getDocs(q);
      const fetchedProducts = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Product[];
      
      setProducts(fetchedProducts);
      
      // Update cache in background
      if (fetchedProducts.length > 0) {
        await cacheProducts(fetchedProducts);
      }
    } catch (error) {
      console.error("Error fetching products from Firestore:", error);
      // Fallback is handled by the initial cached state
    } finally {
      setLoading(false);
    }
  };

  const [isSyncingData, setIsSyncingData] = useState(false);
  const [syncToastMessage, setSyncToastMessage] = useState<string | null>(null);

  const handleManualSync = async () => {
    setIsSyncingData(true);
    setSyncToastMessage("در حال همگام‌سازی لحظه‌ای تمام داده‌های سامانه و فاکتورها...");
    try {
      // 1. Clear firebase mock internal memory database cache
      const { clearMockCache } = await import('./lib/firebase-mock');
      clearMockCache();
      
      // 2. Clear IndexedDB cache for products to force fresh fetch
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

  const addToCart = (product: Product, quantityCartons: number) => {
    if (!product || !product.id) {
      console.error("addToCart: Invalid product object", product);
      return;
    }
    const qty = Math.max(1, Math.round(Number(quantityCartons) || 1));
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
    setIsCartOpen(true);
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
    setIsCartOpen(true);
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

      await addDoc(collection(db, "orders"), {
        buyerName,
        buyerPhone,
        buyerAddress,
        buyerCompany: buyerCompany || "فروشگاه عمده",
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
      });

      // Sync with B2B CRM System
      await recordCRMOrder(buyerName, buyerPhone, buyerCompany || "پخش عمده", finalAmount);

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

  const filteredProducts = products.filter(product => {
    // Hide disabled products on public pages
    if (product.disabled) return false;

    // Hide unapproved factory products from public showcase until approved
    if (product.approvalStatus === 'pending' || product.isApproved === false) {
      if (userRole !== 'admin') return false;
    }

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
      
    return matchesCategory && matchesBrand && matchesSearch;
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

    // Default Sorting (Sponsored & BoostScore)
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
    
    return 0;
  });

  const getBadgeDetails = (badge: string) => {
    switch(badge) {
      case 'vip':
        return { name: '👑 شریک تجاری VIP (ویژه)', discount: '۲۲٪ تخفیف کلان', color: 'from-purple-600 to-indigo-700', text: 'text-purple-100', emoji: '👑', desc: 'اولویت در تامین، ترانزیت ترجیحی یا ارسال مستقیم با هماهنگی کارخانه' };
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
    
    // Clear all user-related localStorage items
    localStorage.removeItem('dastavval_user');
    localStorage.removeItem('dastavval_user_token');
    
    // Call firebase mock signout if imported
    try {
      import("./lib/auth-helper").then(({ logoutUser }) => {
        logoutUser().catch(() => {});
      });
    } catch (e) {
      console.warn("Could not log out firebase user:", e);
    }

    // Set tab to presentation
    setActiveTab('presentation');
    
    // Perform a clean redirect/reload to reset all states completely
    setTimeout(() => {
      window.location.href = "/";
    }, 150);
  };

  const handleUpdateUser = (updatedUser: any) => {
    setUser(updatedUser);
    localStorage.setItem('dastavval_user', JSON.stringify(updatedUser));
  };

  // Load user session on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('dastavval_user');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        setUser(parsed);
        if (parsed.badge) {
          setUserBadge(parsed.badge);
        } else if (parsed.role === 'admin') {
          setUserBadge('admin');
        }
      } catch (e) {
        console.warn("Could not load saved user", e);
      }
    }
  }, []);

  // Pre-fill buyer details when user is logged in
  useEffect(() => {
    if (user) {
      if (user.name) setBuyerName(user.name);
      if (user.phone) setBuyerPhone(user.phone);
      if (user.company) setBuyerCompany(user.company);
      if (user.address) setBuyerAddress(user.address);
    }
  }, [user]);

  // Auto PWA Install Prompt Timer based on b2bConfig delay
  useEffect(() => {
    const delaySec = (b2bConfig as any)?.pwaPromptDelaySeconds || 35;
    const hasSeenPwaPrompt = sessionStorage.getItem("has_seen_pwa_prompt");
    
    if (!hasSeenPwaPrompt) {
      const timer = setTimeout(() => {
        setShowPwaModal(true);
        sessionStorage.setItem("has_seen_pwa_prompt", "true");
      }, delaySec * 1000);
      
      return () => clearTimeout(timer);
    }
  }, [(b2bConfig as any)?.pwaPromptDelaySeconds]);

  return (
    <div className="min-h-screen transition-colors duration-300 font-sans bg-white text-slate-900" dir={language === 'en' ? 'ltr' : 'rtl'}>
      
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
            className="fixed top-6 right-6 z-[110] max-w-sm bg-white/95 backdrop-blur-md border border-slate-200 p-4 rounded-2xl shadow-2xl flex items-center gap-3"
            dir="rtl"
          >
            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
              <Palette size={20} />
            </div>
            <div>
              <h5 className="font-black text-slate-800 text-xs">ترکیب رنگی ارگانیک فعال شد!</h5>
              <p className="text-[10px] text-slate-500 font-bold mt-0.5">{paletteToast}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Elegant Toast for Instant Data Sync */}
      <AnimatePresence>
        {syncToastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-[130] max-w-md bg-white border border-slate-200/60 p-4 rounded-2xl shadow-2xl shadow-slate-200/60 flex items-center gap-3.5 backdrop-blur-md"
            dir="rtl"
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isSyncingData ? "bg-emerald-50 text-emerald-600" : "bg-emerald-500 text-white shadow-sm shadow-emerald-500/20"}`}>
              {isSyncingData ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <CheckCircle2 size={18} />
              )}
            </div>
            <div className="text-right">
              <h5 className="font-black text-slate-900 text-xs">همگام‌سازی لحظه‌ای داده‌ها</h5>
              <p className="text-[10px] text-slate-500 font-bold mt-0.5 leading-relaxed">{syncToastMessage}</p>
            </div>
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
                  className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-black text-[10px] sm:text-xs flex items-center gap-1.5 hover:bg-emerald-400 transition-all cursor-pointer shadow-lg shadow-emerald-500/20 disabled:opacity-50"
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
        onOpenPwaModal={() => setShowPwaModal(true)}
        onOpenCPanelWizard={() => setIsCPanelWizardOpen(true)}
        b2bConfig={b2bConfig}
        selectedCity={userCity}
        onCityChange={(city) => setUserCity(city)}
        onManualSync={handleManualSync}
        isSyncingData={isSyncingData}
      />

      {/* Main Container */}
      <main className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-3 bg-white ${
        (activeTab === 'presentation' || activeTab === 'about') ? 'pb-0' : 'pb-24 lg:py-6'
      }`}>
        <Suspense fallback={<DashboardSkeleton />}>
          <AnimatePresence mode="wait">
            {activeTab === 'presentation' && (
              <motion.div
                key="presentation"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.2 }}
                className="space-y-6 sm:space-y-8"
              >
                <DynamicPresentation 
                  products={products} 
                  articles={articles}
                  onEnterPanel={() => setActiveTab('order')} 
                  language={language}
                  theme={theme}
                  dailyAI={dailyAI}
                  b2bConfig={b2bConfig}
                  setActiveTab={setActiveTab}
                  onAddToCart={addToCart}
                  onViewDetails={(prod) => {
                    setSelectedDetailProduct(prod);
                    setIsDetailModalOpen(true);
                  }}
                  userBadge={userBadge}
                  user={user}
                />
                <AboutUsSection articles={articles} theme={theme} />
                <TrustSection theme={theme} />
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
                {/* Simple order presentation header */}
                <div id="order-panel-header" className="bg-white text-indigo-900 rounded-2xl p-2.5 sm:p-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2.5 relative overflow-hidden text-right border border-slate-100 shadow-xs" dir="rtl">
                  <div className="absolute top-0 left-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />
                  <div className="relative z-10 flex items-center gap-3 text-right">
                    <div className="w-8 h-8 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center text-xs font-bold border border-emerald-100 shrink-0">
                      🛒
                    </div>
                    <div>
                      <h4 className="font-black text-indigo-900 text-[10.5px] sm:text-xs">سفارش عمده مستقیم از کارخانجات</h4>
                      <p className="text-[8px] sm:text-[9px] text-slate-400 font-bold mt-0.5">
                        خرید مستقیم خط تولید با قیمت کارتن عمده و ترابری یکپارچه جاده‌ای
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveTab('presentation')}
                    className="relative z-10 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 font-black text-[8px] px-2.5 py-1 rounded-lg transition-all border border-indigo-100 cursor-pointer shrink-0 sm:self-auto self-end"
                  >
                    معرفی پلتفرم دست اول
                  </button>
                </div>

              {/* Ordering Panel Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start" dir="rtl">
                
                {/* Mobile-Only Horizontal Navigation Chips */}
                <div className="block lg:hidden space-y-3 w-full">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[10px] font-black text-slate-500">دسته‌بندی‌های کالا:</span>
                  </div>
                  <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-4 px-4 scroll-smooth no-scrollbar" style={{ WebkitOverflowScrolling: 'touch' }}>
                    {[
                      { id: "mob-cat-all", name: "همه محصولات", value: "همه" },
                      ...Array.from(new Set([
                        ...(b2bConfig.categories || []).map((c: any) => typeof c === 'string' ? c : c.name),
                        ...products.map(p => p.category).filter(Boolean)
                      ])).filter(catName => catName !== "انبار های من" && catName !== "انبارهای من")
                      .map((catName, idx) => ({ id: `mob-cat-${idx}-${catName}`, name: catName, value: catName }))
                    ].map((cat: any, idx: number) => {
                      const isActive = activeCategory === cat.value;
                      return (
                        <button
                          key={`mob-cat-${cat.id || idx}-${idx}`}
                          onClick={() => setActiveCategory(cat.value)}
                          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[11px] font-black transition-all shrink-0 border cursor-pointer ${
                            isActive 
                              ? "bg-emerald-600 text-white border-emerald-500 shadow-md" 
                              : "bg-white text-slate-600 border-gray-200 hover:bg-white"
                          }`}
                        >
                          <span>📦 {cat.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Desktop-Only Categories and Brand Sidebar */}
                <div className="hidden lg:block lg:col-span-1 space-y-6">
                  <div className="space-y-6">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-black text-xs text-gray-800 flex items-center gap-2">
                          <span>📦</span>
                          <span>دسته‌بندی‌های کالا</span>
                        </h3>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setShowAddCat(!showAddCat);
                              setNewCatName("");
                            }}
                            className="px-2 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg transition-all text-[11px] font-black flex items-center gap-1 cursor-pointer border border-emerald-200"
                            title="افزودن دسته‌بندی جدید"
                          >
                            <Plus size={13} />
                            <span>افزودن</span>
                          </button>
                        </div>
                      </div>

                      {/* Inline Category Creation Input */}
                      {showAddCat && (
                        <div className="bg-white p-2.5 rounded-xl border border-slate-200 mb-3 space-y-2 animate-fade-in">
                          <input
                            type="text"
                            value={newCatName}
                            onChange={(e) => setNewCatName(e.target.value)}
                            placeholder="نام دسته‌بندی جدید..."
                            className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 outline-none"
                            dir="rtl"
                          />
                          <div className="flex justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setShowAddCat(false)}
                              className="px-2.5 py-1 bg-slate-200 text-slate-650 rounded-lg text-[10px] font-black cursor-pointer"
                            >
                              انصراف
                            </button>
                            <button
                              type="button"
                              onClick={handleAddCategory}
                              className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-[10px] font-black cursor-pointer hover:bg-emerald-700"
                            >
                              ذخیره
                            </button>
                          </div>
                        </div>
                      )}

                      <div className="space-y-1.5">
                        {[
                          { id: "desk-cat-all", name: "همه محصولات", value: "همه" },
                          ...Array.from(new Set([
                            ...(b2bConfig.categories || []).map((c: any) => typeof c === 'string' ? c : c.name),
                            ...products.map(p => p.category).filter(Boolean)
                          ])).filter(catName => catName !== "انبار های من" && catName !== "انبارهای من")
                          .map((catName, idx) => {
                            const found = (b2bConfig.categories || []).find((c: any) => (typeof c === 'string' ? c : c.name) === catName);
                            const id = (found && typeof found !== 'string' && found.id) ? `cat-${found.id}` : `cat-gen-${idx}-${catName}`;
                            return { id, name: catName, value: catName };
                          })
                        ].map((cat: any, idx: number) => {
                          const isActive = activeCategory === cat.value;
                          const isEditing = editingCatId === cat.id && cat.value !== "همه";

                          return (
                            <div
                              key={`desk-cat-item-${cat.id || idx}-${idx}`}
                              className={`group relative flex items-center justify-between rounded-xl transition-all ${
                                isActive 
                                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20 font-black" 
                                  : "text-slate-700 hover:bg-white hover:text-emerald-800"
                              }`}
                            >
                              {isEditing ? (
                                <div className="w-full flex items-center gap-1.5 p-1.5">
                                  <input
                                    type="text"
                                    value={editingCatName}
                                    onChange={(e) => setEditingCatName(e.target.value)}
                                    className="flex-1 bg-white border border-slate-200 text-slate-900 rounded-lg px-2 py-1 text-xs font-bold outline-none"
                                    dir="rtl"
                                    autoFocus
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleSaveCategory(cat.id, cat.name)}
                                    className="p-1 bg-emerald-500 text-white rounded-md cursor-pointer"
                                  >
                                    <Check size={12} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setEditingCatId(null)}
                                    className="p-1 bg-rose-500 text-white rounded-md cursor-pointer"
                                  >
                                    <X size={12} />
                                  </button>
                                </div>
                              ) : (
                                <>
                                  <button
                                    onClick={() => setActiveCategory(cat.value)}
                                    className="flex-1 text-right px-3.5 py-2.5 text-xs font-bold transition-all cursor-pointer flex items-center gap-2"
                                  >
                                    <span>📦</span>
                                    <span>{cat.name}</span>
                                  </button>

                                  {cat.value !== "همه" && (
                                    <div className="opacity-0 group-hover:opacity-100 transition-all flex items-center gap-1 pl-2">
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setEditingCatId(cat.id);
                                          setEditingCatName(cat.name);
                                        }}
                                        className={`p-1 rounded hover:bg-slate-200 ${isActive ? 'text-white hover:bg-emerald-700' : 'text-slate-400 hover:text-emerald-600'}`}
                                        title="ویرایش نام دسته‌بندی"
                                      >
                                        <Edit2 size={11} />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDeleteCategory(cat.id, cat.name);
                                        }}
                                        className={`p-1 rounded hover:bg-slate-200 ${isActive ? 'text-white hover:bg-emerald-700' : 'text-slate-400 hover:text-rose-600'}`}
                                        title="حذف دسته‌بندی"
                                      >
                                        <Trash2 size={11} />
                                      </button>
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100 text-center">
                        <button
                          onClick={() => {
                            setActiveTab('admin');
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className="w-full py-2 bg-white hover:bg-slate-100 text-slate-700 rounded-xl text-[11px] font-black border border-slate-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Settings size={13} className="text-emerald-600" />
                          <span>مدیریت کامل گروه‌های کالایی در پنل مدیریت</span>
                        </button>
                      </div>
                    </div>

                    <div className="border-t border-gray-100 pt-4">
                      <h3 className="font-black text-xs text-gray-800 mb-4 flex items-center gap-2">
                        <span>🏭</span>
                        <span>فیلتر بر اساس کارخانه</span>
                      </h3>
                      <div className="space-y-1 max-h-48 overflow-y-auto">
                        {["همه", ...Array.from(new Set(products.map(p => p.brand).filter(Boolean)))].map((brand, idx) => (
                          <button
                            key={`desk-brand-${idx}-${brand}`}
                            onClick={() => setSelectedBrand(brand)}
                            className={`w-full text-right px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              selectedBrand === brand
                                ? "bg-indigo-50 text-indigo-700 font-black"
                                : "text-slate-500 hover:bg-white"
                            }`}
                          >
                            {brand === "همه" ? "همه برندها و کارخانه‌ها" : brand}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Catalog & Products list */}
                <div className="lg:col-span-3 space-y-4">
                  {/* Display View modes controls - Refined Design */}
                  <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3 bg-white p-3 sm:p-3.5 rounded-2xl border border-slate-100 shadow-material-sm text-right">
                    <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 flex-1">
                      {/* Search Input - Sophisticated Focus */}
                      <div className="relative flex-1 min-w-[200px]">
                        <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors" size={15} />
                        <input
                          type="text"
                          placeholder="جستجو در نام محصول، برند یا دسته‌بندی..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full pr-11 pl-5 py-2.5 bg-slate-50/50 border border-slate-100 rounded-xl text-[11px] font-black focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/5 transition-all shadow-inner-sm"
                        />
                        {searchQuery && (
                          <button 
                            onClick={() => setSearchQuery("")}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-600 p-1.5 transition-colors cursor-pointer"
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-2 border-r border-slate-100 pr-4">
                        <span className="text-[11px] font-black text-slate-400 hidden sm:inline tracking-tight">حالت نمایش:</span>
                        <div className="bg-slate-50 p-1 rounded-2xl border border-slate-100 flex items-center gap-1">
                          {[
                            { id: 'table', icon: List, label: 'کاتالوگ رسمی', short: 'کاتالوگ' },
                            { id: 'grid', icon: Grid, label: 'نمای کارتی', short: 'کارتی' },
                            { id: 'list', icon: ShoppingBag, label: 'سفارش سریع', short: 'سریع' },
                            { id: 'high_margin', icon: TrendingDown, label: 'حاشیه سود بالا', short: 'پرسود' }
                          ].map((mode, idx) => (
                            <button
                              key={`app-view-mode-${mode.id}-${idx}`}
                              onClick={() => setViewMode(mode.id as any)}
                              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-black transition-all cursor-pointer ${
                                viewMode === mode.id
                                ? "bg-white text-emerald-600 shadow-material-sm border border-slate-200/50 scale-[1.02]"
                                : "text-slate-400 hover:text-slate-600 hover:bg-white/50"
                              }`}
                            >
                              <mode.icon size={14} />
                              <span className="hidden sm:inline">{mode.label}</span>
                              <span className="sm:hidden">{mode.short}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 border-r border-slate-100 pr-4">
                        <span className="text-[11px] font-black text-slate-400 tracking-tight">ترتیب:</span>
                        <select
                          value={sortBy}
                          onChange={(e) => setSortBy(e.target.value as any)}
                          className="bg-slate-50 border border-slate-200/80 rounded-xl px-2.5 py-1.5 text-[10px] font-black text-slate-700 focus:outline-hidden focus:border-emerald-500 cursor-pointer"
                        >
                          <option value="default">⭐ پیش‌فرض (ویژه و پیشنهادی)</option>
                          <option value="best-selling">🔥 پرفروش‌ترین و محبوب‌ترین</option>
                          <option value="newest">✨ جدیدترین محصولات</option>
                          <option value="price-asc">📉 ارزان‌ترین قیمت عمده</option>
                          <option value="price-desc">📈 گران‌ترین قیمت عمده</option>
                        </select>
                      </div>
                    </div>

                    <button
                      onClick={() => setIsCatalogOpen(true)}
                      className="flex items-center justify-center gap-2 bg-emerald-50 hover text-emerald-700 border border-emerald-200/50 px-4 py-2.5 rounded-xl text-xs font-black transition-all shadow-sm"
                    >
                      <Printer size={14} />
                      دانلود کاتالوگ محصولات (A4 PDF)
                    </button>
                  </div>

                  {/* Dynamic City/Geographic Optimization Banner */}
                  <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-500/25 rounded-2xl p-4.5 mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-3xs text-right animate-fade-in" dir="rtl">
                    <div className="flex items-start gap-3.5">
                      <div className="w-12 h-12 rounded-xl bg-emerald-600/10 text-emerald-800 flex items-center justify-center shrink-0">
                        <MapPin size={22} className="text-emerald-600 animate-bounce" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-black text-xs sm:text-sm text-slate-900">
                          بومی‌سازی و هماهنگی ترابری ویژه شهرستان <span className="text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200/50">{userCity} ({userProvince})</span>
                        </h4>
                        <p className="text-[10px] sm:text-[11px] text-slate-500 font-bold leading-relaxed">
                          سفارشات عمده شما بر اساس ضوابط ویژه باربری مستقیم از درب نزدیک‌ترین خطوط تولید کشور به مقصد <strong className="text-slate-800">{userCity}</strong> بارگیری خواهند شد. تمامی تخفیفات ترانزیت جاده‌ای و تخصیص عاملیت‌ها به صورت منطقه‌ای محاسبه می‌شود.
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 shrink-0 self-stretch md:self-auto justify-between border-t border-slate-100 md:border-t-0 pt-3 md:pt-0">
                      <div className="flex flex-col text-right">
                        <span className="text-[9px] text-slate-400 font-black uppercase">وضعیت عاملیت {userCity}:</span>
                        {cityAgency ? (
                          <span className="text-[10px] text-emerald-700 font-black flex items-center gap-1 mt-0.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
                            نماینده: {cityAgency.company || cityAgency.agencyName || cityAgency.displayName || 'عاملیت مجاز'}
                          </span>
                        ) : (
                          <button 
                            onClick={() => setActiveTab('dealership_request')}
                            className="text-[10px] text-amber-600 hover:text-amber-700 transition-colors font-black flex items-center gap-1 mt-0.5"
                          >
                            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse inline-block" />
                            فاقد نماینده - شما اولین نفر باشید!
                          </button>
                        )}
                      </div>
                      <button
                        onClick={() => {
                          const customEvent = new CustomEvent("open-city-picker-modal-from-banner");
                          window.dispatchEvent(customEvent);
                        }}
                        className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-[10px] font-black shadow-3xs cursor-pointer transition-all hover:scale-102 shrink-0 mr-3"
                      >
                        تغییر شهر
                      </button>
                    </div>
                  </div>

                  {/* Products catalog list */}
                  {loading ? (
                    <div className="flex flex-nowrap overflow-x-auto snap-x snap-mandatory hide-scrollbar scroll-smooth gap-4 pb-4 px-2">
                      {[...Array(6)].map((_, i) => (
                        <div key={`app-skel-prod-${i}`} className="min-w-[85vw] sm:min-w-[320px] snap-center shrink-0 bg-white rounded-2xl h-96 animate-pulse border border-gray-100" />
                      ))}
                    </div>
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
                            key={`app-prod-${product.id || idx}-${idx}`} 
                            product={product} 
                            index={idx}
                            onAddToCart={addToCart} 
                            onViewDetails={(prod) => {
                              setSelectedDetailProduct(prod);
                              setIsDetailModalOpen(true);
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
                            setSelectedDetailProduct(product);
                            setIsDetailModalOpen(true);
                          }}
                        />
                      </FadeInContainer>
                    </Suspense>
                  ) : viewMode === 'list' ? (
                    <QuickOrderList 
                      products={filteredProducts} 
                      onAddToCart={(product, qty) => addToCart(product, qty)} 
                      onCheckout={() => setIsCartOpen(true)}
                      cart={cart.map(item => ({ productId: item.productId, quantity: item.quantityCartons }))}
                      onRemoveFromCart={(id) => removeFromCart(id)}
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
                          setSelectedDetailProduct(product);
                          setIsDetailModalOpen(true);
                        }}
                      />

                      {/* Expand / Collapse Button if total products > 8 and default filters */}
                      {filteredProducts.length > 8 && searchQuery === "" && activeCategory === "همه" && selectedBrand === "همه" && (
                        <div className="flex justify-center pt-2">
                          <button
                            onClick={() => setShowAllHomepageProducts(!showAllHomepageProducts)}
                            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-xs font-black shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-2 cursor-pointer border border-indigo-400/30 hover:scale-105"
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
                  
                </div>
              </div>
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
                      products={products}
                      onAddProduct={handleAddProduct}
                      onUpdateProduct={handleUpdateProduct}
                      onDeleteProduct={handleDeleteProduct}
                      onBatchDeleteProducts={handleBatchDeleteProducts}
                      onBulkUpdateProducts={handleBulkUpdateProducts}
                      onRefreshProducts={fetchProducts}
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
                    factories={b2bConfig?.factories || []}
                    products={products}
                    b2bConfig={b2bConfig}
                    initialFactoryId={initialFactoryIdParam}
                    userBadge={userBadge}
                    user={user}
                    onSelectFactoryForOrder={(factoryName) => {
                      setSearchQuery(factoryName);
                      setActiveTab('order');
                    }}
                    onSelectProductForOrder={(product) => {
                      setSelectedDetailProduct(product);
                      setIsDetailModalOpen(true);
                    }}
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
                    factories={b2bConfig?.factories || []} 
                    b2bConfig={b2bConfig} 
                    initialSubTab="news" 
                    userBadge={userBadge}
                    user={user}
                  />
                </FadeInContainer>
              </Suspense>
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
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-black">
                    ℹ️
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-850">درباره ما و تماس با پلتفرم</h3>
                    <p className="text-[10px] text-slate-400 font-bold">آشنایی با اهداف، مزایا و راه‌های ارتباطی</p>
                  </div>
                </div>
                <button 
                  onClick={() => setActiveTab('presentation')}
                  className="px-5 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-605 rounded-xl text-xs font-black transition-colors flex items-center gap-1.5 cursor-pointer"
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
              <div className="flex justify-between items-center bg-white/70 backdrop-blur-md px-6 py-4 rounded-3xl border border-slate-100 shadow-sm" dir="rtl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-black">
                    🎓
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-850">مرکز آموزش و مهارت‌آموزی تجاری</h3>
                    <p className="text-[10px] text-slate-400 font-bold">مهارت‌ها و ترفندهای سودآوری انبارداری و خرده‌فروشی</p>
                  </div>
                </div>
                <button 
                  onClick={() => setActiveTab('presentation')}
                  className="px-5 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-605 rounded-xl text-xs font-black transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <span>صفحه نخست</span>
                  <ArrowUpRight size={14} className="rotate-90" />
                </button>
              </div>
              <Suspense fallback={<SectionSkeleton />}>
                <FadeInContainer>
                  <B2BNews 
                    articles={articles} 
                    factories={b2bConfig?.factories || []} 
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
                    onNavigateToBillboard={() => {}}
                    onNavigateHome={() => setActiveTab('presentation')}
                    user={user}
                    products={products}
                    onSelectProduct={(prod) => {
                      setSelectedDetailProduct(prod);
                      setIsDetailModalOpen(true);
                    }}
                  />
                </FadeInContainer>
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
        </AnimatePresence>
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
            <div className="bg-white border border-indigo-800 rounded-2xl p-4 shadow-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2 rtl:space-x-reverse">
                  {comparisonList.map((p, idx) => (
                    <div key={`comp-${p.id}-${idx}`} className="w-8 h-8 rounded-full border-2 border-indigo-900 bg-white p-1 flex items-center justify-center overflow-hidden">
                      {p.image_url ? (
                        <img 
                          src={getDisplayImageUrl(p.image_url)} 
                          alt="" 
                          className="w-full h-full object-contain" 
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                      ) : (
                        <Package size={14} className="text-slate-400" />
                      )}
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
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-[10px] font-black shadow-lg shadow-indigo-600/20"
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
              products={products}
              setShowAuthModal={setShowAuthModal}
              userCity={userCity}
              userProvince={userProvince}
              cityAgency={cityAgency}
              onOrderSuccess={(createdOrder) => {
                setCart([]);
                setIsCartOpen(false);
                setLastCreatedOrder(createdOrder);
              }}
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
              className="fixed right-0 top-0 bottom-0 w-full max-w-lg bg-white border-l border-gray-100 text-indigo-900 z-[70] shadow-2xl flex flex-col"
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h2 className="text-xl font-black flex items-center gap-2 text-indigo-900">
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
                              <span className="block text-xs font-black text-indigo-800">پرداخت نقدی (پیش‌فاکتور)</span>
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
                              ? "border-indigo-600 bg-indigo-50"
                              : "border-gray-100 hover"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'half_check' ? 'border-indigo-600' : 'border-gray-300'}`}>
                              {paymentMethod === 'half_check' && <div className="w-2 h-2 bg-indigo-600 rounded-full" />}
                            </div>
                            <div className="text-right">
                              <span className="block text-xs font-black text-indigo-800">نصف نقد / نصف چک {userBadge === 'bronze' && "🔒"}</span>
                              <span className="text-[10px] text-slate-500 font-bold">سقف اعتبار اولیه معامله: ۱۰۰ میلیون تومان (۵۰ م چک + مابقی نقد)</span>
                            </div>
                          </div>
                          <Receipt size={16} className="text-indigo-600" />
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
                              <span className="block text-xs font-black text-indigo-800">خرید تمام چکی {userBadge === 'bronze' && "🔒"}</span>
                              <span className="text-[10px] text-amber-600 font-bold">۱۰٪ کارمزد فروش امانی (تا سقف اعتبار فعال خریدار)</span>
                            </div>
                          </div>
                          <FileText size={16} className="text-amber-600" />
                        </button>

                        <button
                          type="button"
                          onClick={() => setShowChequeCharterModal(true)}
                          className="text-[10px] text-indigo-600 hover:text-indigo-800 font-black text-right py-1 flex items-center gap-1.5 cursor-pointer underline"
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
                          <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-lg border border-emerald-200/40 font-bold flex items-center gap-1">
                            <CheckCircle2 size={12} />
                            تکمیل خودکار از پروفایل
                          </span>
                        ) : (
                          <button
                            onClick={() => setShowAuthModal(true)}
                            className="text-[10px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded-lg border border-amber-200/40 font-bold hover transition-colors cursor-pointer"
                          >
                            ثبت‌نام سریع / ورود
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
                          className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus focus text-xs text-right font-bold text-indigo-800 focus:outline-none"
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
                          className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus focus text-xs text-right font-mono text-indigo-800 focus:outline-none"
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
                            className="text-[10px] bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/50 px-2.5 py-1 rounded-lg font-black transition-all cursor-pointer"
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
                          className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus focus text-xs text-right leading-relaxed text-indigo-800 focus:outline-none"
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
                              <span className="text-[10px] font-black text-indigo-900">{method.name}</span>
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
                        <div className="flex justify-between text-indigo-600">
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
                          <div className="space-y-2 p-3 bg-indigo-50/80 rounded-2xl border border-indigo-200/80 text-indigo-950">
                            <div className="flex justify-between items-center text-xs font-black border-b border-indigo-200/60 pb-1.5">
                              <span className="flex items-center gap-1.5 text-indigo-900">
                                <Receipt size={14} className="text-indigo-600" />
                                تفکیک تسویه نصف نقد / نصف چک:
                              </span>
                              <button
                                type="button"
                                onClick={() => setShowChequeCharterModal(true)}
                                className="text-[10px] text-indigo-700 hover:text-indigo-900 font-black underline cursor-pointer"
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
                              <span className="font-mono text-indigo-700 font-black">
                                {actualChequeShare.toLocaleString()} تومان
                                {isOverCredit && <span className="text-[9px] text-indigo-500 font-sans mr-1">(سقف مجاز)</span>}
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
                        b2bConfig.primaryColor === 'indigo' ? "bg-indigo-600 hover shadow-indigo-600/20" :
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
        onClose={() => setIsCatalogOpen(false)} 
        products={products} 
        user={user}
      />

      {/* Auth Modal (Login / Signup) */}
      <AuthModal 
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onAuthSuccess={(loggedInUser) => {
          setUser(loggedInUser);
          if (loggedInUser.badge) {
            setUserBadge(loggedInUser.badge);
          }
          if (loggedInUser.role === 'admin') {
            setActiveTab('admin');
            setUserBadge('admin');
          }
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
                  { name: 'روبیکا', href: 'https://rubika.ir/dastavval_official' },
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
            <p className="flex items-center gap-1.5">
              © {new Date().getFullYear()} <span className="text-slate-600">{b2bConfig.appName || "بازرگانی دست اول"}</span>. تمامی حقوق محفوظ است.
            </p>
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
      <AIAdvisor mascotUrl={b2bConfig.mascotUrl} />

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
            className="fixed bottom-24 left-6 lg:bottom-8 lg:left-8 z-[90] p-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl shadow-2xl hover:scale-110 active:scale-95 transition-all duration-300 cursor-pointer border border-blue-400/50 flex items-center justify-center group"
            title="بازگشت به بالای صفحه"
          >
            <ArrowUp size={22} className="group-hover:-translate-y-1 transition-transform" />
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
                  <h3 className="text-lg font-black text-indigo-800">
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

      {/* Unified Minimalist White Splash Preloader */}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 z-[9999] bg-white flex flex-col items-center justify-center space-y-6 text-slate-900 p-6 font-sans"
            dir="rtl"
          >
            <div className="relative">
              <div className="w-24 h-24 rounded-3xl bg-slate-50 border border-slate-100 flex items-center justify-center">
                <ShoppingBag size={44} className="text-emerald-600" />
              </div>
            </div>

            <div className="text-center space-y-2">
              <h2 className="text-xl font-black tracking-tight text-slate-900">مرجع دست اول</h2>
              <p className="text-xs text-slate-400 font-bold">در حال همگام‌سازی کاتالوگ مرکزی و شبکه کارخانجات کشور...</p>
            </div>

            {/* Subtle progress bar */}
            <div className="w-64 h-1 bg-slate-100 rounded-full overflow-hidden relative">
              <motion.div 
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 2, repeat: Infinity }}
                className="h-full bg-emerald-500 rounded-full" 
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
