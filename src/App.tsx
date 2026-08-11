import React, { useState, useEffect } from "react";
import { collection, getDocs, addDoc, serverTimestamp, query, orderBy, doc, updateDoc, deleteDoc } from "./lib/firebase-mock";
import { db } from "./lib/firebase";
import { seedProductsIfEmpty, INITIAL_PRODUCTS } from "./lib/db-helper";
import { Product, OrderItem, Order } from "./types";
import Navbar from "./components/Navbar";
import ProductCard from "./components/ProductCard";
import WholesaleCatalogView from "./components/WholesaleCatalogView";
import CatalogDownloadModal from "./components/CatalogDownloadModal";
import B2BNews from "./components/B2BNews";
import SupportCenter from "./components/SupportCenter";
import FactoriesView from "./components/FactoriesView";
import AIAdvisor from "./components/AIAdvisor";
import FloatingSupport from "./components/FloatingSupport";
import DynamicPresentation from "./components/DynamicPresentation";
import AuthModal from "./components/AuthModal";
import AdminPanel from "./components/AdminPanel";
import UserPanel from "./components/UserPanel";
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
import B2BBusinessDashboard from "./components/B2BBusinessDashboard";
import CheckoutWizard from "./components/CheckoutWizard";
import WholesaleInvoiceView from "./components/WholesaleInvoiceView";
import DastavvalLogo from "./components/DastavvalLogo";
import TrustBadges from "./components/TrustBadges";
import PwaInstallModal from "./components/PwaInstallModal";
import PwaInstallBanner from "./components/PwaInstallBanner";
import CPanelInstallerWizard from "./components/CPanelInstallerWizard";
import { INITIAL_NEWS, INITIAL_FACTORIES, INITIAL_CATEGORIES } from "./lib/db-helper";
import { getBestDiscount } from "./lib/discounts";
import { recordCRMOrder } from "./lib/crm-helper";
import { motion, AnimatePresence } from "motion/react";
import { X, ShoppingBag, CheckCircle2, Loader2, AlertCircle, Settings, Package, Layers, FileText, Activity, ShieldCheck, MapPin, Phone, Mail, Printer, Grid, List, Sparkles, Building, Building2, Award, MessageSquare, DollarSign, Percent, ArrowUpRight, Gift, Percent as PercentIcon, Tag, Download, ChevronRight, BrainCircuit, LayoutDashboard, BookOpen, Zap, CreditCard, Receipt, Home, User, Compass, ArrowUp, Upload, Edit2, Trash2, Plus, Check, Palette, Paintbrush } from "lucide-react";
import { translations, Language } from "./lib/translations";
import { generateId, generateProductCode, generateFactoryCode, generateUserCode, generateCategoryCode } from "./lib/id-utils";
import { PaymentMethod } from "./types";

const CATEGORIES = ["همه", "تنقلات و شکلات", "کیک، کلوچه و بیسکویت", "مواد غذایی و کنسروجات", "نوشیدنی‌ها", "شوینده و بهداشتی"];

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
    name: "آبی دیپلمات و نقره‌ای براق",
    emerald50: "#f8fafc",
    emerald100: "#f1f5f9",
    emerald200: "#e2e8f0",
    emerald300: "#cbd5e1",
    emerald400: "#94a3b8",
    emerald500: "#3b82f6",
    emerald600: "#2563eb",
    emerald700: "#1d4ed8",
    emerald800: "#1e40af",
    emerald900: "#1e3b8a",
    amber50: "#f1f5f9",
    amber100: "#cbd5e1",
    amber200: "#94a3b8",
    amber300: "#64748b",
    amber400: "#475569",
    amber500: "#334155",
    amber600: "#1e293b",
    amber700: "#0f172a",
    amber800: "#020617",
    amber950: "#000000"
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
    return (saved as any) || 'classic';
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
      primaryColor: "sky",
      appName: "دست اول",
      appSub: "مرجع مبادلات مستقیم و تامین کالای عمده",
      factories: [],
      categories: [],
      logoUrl: "/assets/logo.svg",
      mascotUrl: "/assets/mascot_character.jpg",
      buyerCredit: 250000000,
      minOrderAmount: 3000000, // 3 Million Toman default minimum order
      minOrderCartons: 3,
      topAnnouncement: "",
      showTopAnnouncement: false
    };
  });

  const [appMode, setAppMode] = useState<'presentation' | 'portal'>('presentation');
  const [activeTab, setActiveTab] = useState<'presentation' | 'order' | 'portal' | 'admin' | 'news' | 'profile' | 'user' | 'factories' | 'about' | 'learning' | 'support'>('presentation');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("همه");
  const [selectedBrand, setSelectedBrand] = useState("همه");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<'table' | 'grid' | 'list'>('grid');
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
  const [showPwaModal, setShowPwaModal] = useState(false);
  const [isCPanelWizardOpen, setIsCPanelWizardOpen] = useState(false);
  const [lastOrderTracking, setLastOrderTracking] = useState("");
  const [lastOrderAmount, setLastOrderAmount] = useState(0);
  const [lastCreatedOrder, setLastCreatedOrder] = useState<any | null>(null);

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
        image: "https://images.unsplash.com/photo-1511381939415-e44015466834?auto=format&fit=crop&q=80&w=600"
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
      image: "https://images.unsplash.com/photo-1511381939415-e44015466834?auto=format&fit=crop&q=80&w=600"
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

  // Read URL query parameter for direct factory links
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const factoryParam = params.get('factory');
      if (factoryParam) {
        setInitialFactoryIdParam(factoryParam);
        setActiveTab('factories');
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

  const DEFAULT_NEWS_ITEMS = [
    {
      id: "news-sample-1",
      title: "ابلاغیه جدید تخصیص سهمیه بنکداری و تخفیفات جاده‌ای کارخانجات",
      summary: "تعرفه حمل و جابه‌جایی بار مستقیم از درب کارخانجات با حذف واسطه‌ها تا ۱۸ درصد کاهش یافت.",
      content: "با هماهنگی انجمن بنکداران و مدیریت سامانه دست اول، نرخ حمل مستقیم سفارشات بالک و کارتن بالا از درب کارخانجات تا انبار بنکداران تحت پوشش تخفیف ویژه جاده‌ای قرار گرفت. تمامی همکارانی که سفارش خود را ثبت نمایند شامل پشتیبانی آنلاین باربری می‌باشند.",
      category: "تنظیم بازار",
      imageUrl: "https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&q=80&w=1000",
      source: "روابط عمومی سامانه دست اول",
      date: new Date().toLocaleDateString('fa-IR'),
    },
    {
      id: "news-sample-2",
      title: "افتتاح خطوط جدید تولید اتوماتیک در کارخانجات رزطلا، نظری و باغبان",
      summary: "با بهره‌برداری از فاز توسعه اتوماتیک، زمان تامین و تحویل محموله‌های عمده به کمتر از ۴۸ ساعت رسید.",
      content: "گروه‌های صنعتی تولیدی رزطلا، کیک نظری و کنسروجات باغبان تحویل سفارشی خریداران عمده را با مکانیزاسیون بسته‌بندی سرعت بخشیدند. اکنون امکان استعلام آنلاین قیمت و ثبت سفارش مستقیم خط تولید فراهم گردیده است.",
      category: "خط تولید",
      imageUrl: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=1000",
      source: "اتاق خبر صنایع غذایی",
      date: new Date().toLocaleDateString('fa-IR'),
    },
    {
      id: "news-sample-3",
      title: "طرح تضمین اصالت برند و سلامت بسته‌بندی محموله‌های بنکداری",
      summary: "ارسال کلیه بارهای کارخانجات با بارکد اصالت، بیمه جاده‌ای و هولوگرام تضمین کیفیت صورت می‌گیرد.",
      content: "به منظور ارتقای امنیت خریدهای بنکداری و عمده، تمامی کارخانجات طرف قرارداد سامانه موظف به صدور فاکتور یا پیش‌فاکتور معتبر و گواهی اصالت باربری شدند.",
      category: "توزیع",
      imageUrl: "https://images.unsplash.com/photo-1580674684081-7617fbf3d745?auto=format&fit=crop&q=80&w=1000",
      source: "بازرسی و نظارت بر توزیع",
      date: new Date().toLocaleDateString('fa-IR'),
    }
  ];

  const fetchArticles = async () => {
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
        if (Array.isArray(parsed)) {
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

  // Auth States
  const [user, setUser] = useState<any | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Firestore product mutation handlers
  const handleAddProduct = async (newProd: Omit<Product, 'id'>, skipStateUpdate = false) => {
    const prodWithCode = {
      ...newProd,
      productCode: (newProd as any).productCode || generateProductCode()
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
      if (window.scrollY > 300) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
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
      const isCleaned = localStorage.getItem("dastavval_v4_clean");
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
          "dastavval_user"
        ];
        keysToClear.forEach(key => {
          try { localStorage.removeItem(key); } catch (e) {}
        });
        try { localStorage.setItem("dastavval_v4_clean", "true"); } catch (e) {}
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
      const q = query(collection(db, "products"));
      const querySnapshot = await getDocs(q);
      const fetchedProducts = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Product[];
      
      setProducts(fetchedProducts);
    } catch (error) {
      console.error("Error fetching products from Firestore:", error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (product: Product, quantityCartons: number) => {
    setCart(prev => {
      const existing = prev.find(item => item.productId === product.id);
      const pricePerCarton = product.bulk_price * product.carton_pack_count;
      if (existing) {
        return prev.map(item => 
          item.productId === product.id 
            ? { 
                ...item, 
                quantityCartons: item.quantityCartons + quantityCartons,
                totalItems: (item.quantityCartons + quantityCartons) * product.carton_pack_count,
                image_url: product.image_url || item.image_url
              }
            : item
        );
      }
      return [...prev, { 
        productId: product.id, 
        name: product.name, 
        quantityCartons, 
        pricePerCarton,
        totalItems: quantityCartons * product.carton_pack_count,
        image_url: product.image_url,
        unitsPerCarton: product.carton_pack_count
      }];
    });
    setIsCartOpen(true);
  };

  const addMultipleToCart = (items: { product: Product; quantityCartons: number }[]) => {
    setCart(prev => {
      let currentCart = [...prev];
      items.forEach(({ product, quantityCartons }) => {
        const existingIdx = currentCart.findIndex(item => item.productId === product.id);
        const pricePerCarton = product.bulk_price * product.carton_pack_count;
        if (existingIdx > -1) {
          currentCart[existingIdx] = {
            ...currentCart[existingIdx],
            quantityCartons: currentCart[existingIdx].quantityCartons + quantityCartons,
            totalItems: (currentCart[existingIdx].quantityCartons + quantityCartons) * product.carton_pack_count,
            image_url: product.image_url || currentCart[existingIdx].image_url
          };
        } else {
          currentCart.push({
            productId: product.id,
            name: product.name,
            quantityCartons,
            pricePerCarton,
            totalItems: quantityCartons * product.carton_pack_count,
            image_url: product.image_url,
            unitsPerCarton: product.carton_pack_count
          });
        }
      });
      return currentCart;
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
    const minAmount = b2bConfig.minOrderAmount || 3000000;
    const minCartons = b2bConfig.minOrderCartons || 3;
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
      
      // 2. Payment Method Logic
      let paymentDiscountAmount = 0;
      let paymentPriceDifference = 0;

      if (paymentMethod === 'cash') {
        paymentDiscountAmount = Math.round((totalAmount - badgeDiscountAmount) * 0.05); // 5% cash discount
      } else if (paymentMethod === 'full_check') {
        paymentPriceDifference = Math.round((totalAmount - badgeDiscountAmount) * 0.10); // 10% markup for full check
      }
      
      // 3. Calculate Tiered Bulk Discount (Volume/Quantity)
      const totalQuantity = cart.reduce((sum, item) => sum + item.quantityCartons, 0);
      const bulkDiscount = getBestDiscount(totalAmount, totalQuantity);
      const bulkDiscountAmount = Math.round((totalAmount - badgeDiscountAmount - paymentDiscountAmount) * (bulkDiscount.percent / 100));

      const finalAmount = totalAmount - badgeDiscountAmount - paymentDiscountAmount - bulkDiscountAmount + paymentPriceDifference;

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
    setUser(null);
    localStorage.removeItem('dastavval_user');
    if (activeTab === 'admin' || activeTab === 'portal') {
      setActiveTab('presentation');
    }
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
    <div className={`min-h-screen transition-colors duration-300 font-sans selection ${
      theme === 'classic' 
        ? 'bg-white text-slate-900 theme-classic' 
        : theme === 'dark' 
        ? 'bg-slate-950 text-slate-100' 
        : 'bg-white text-slate-900'
    }`} dir={language === 'en' ? 'ltr' : 'rtl'}>
      
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
      />

      {/* Main Container */}
      <main className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 ${
        (activeTab === 'presentation' || activeTab === 'about') ? 'pb-0' : 'pb-24 lg:py-8'
      }`}>
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
                setActiveCategory={setActiveCategory}
                onAddToCart={addToCart}
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
              className="space-y-8"
            >
              {/* Simple order presentation header */}
              <div id="order-panel-header" className="bg-white text-indigo-900 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row justify-between items-center gap-6 relative overflow-hidden text-right" dir="rtl">
                <div className="absolute top-0 left-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
                <div className="relative z-10 flex items-center gap-4 text-right">
                  <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center text-xl font-bold border border-emerald-100">
                    🛒
                  </div>
                  <div>
                    <h4 className="font-black text-indigo-900 text-base">ثبت سفارش عمده و مستقیم محصولات صنایع غذایی</h4>
                    <p className="text-[11px] text-slate-500 font-bold mt-1">
                      ثبت سفارش مستقیم و بی‌واسطه از خط تولید کارخانه؛ استعلام قیمت عمده و ارسال ناوگان حمل ترابری
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('presentation')}
                  className="relative z-10 bg-white hover text-indigo-800 font-black text-xs px-5 py-3 rounded-xl transition-all border border-slate-150 cursor-pointer shrink-0"
                >
                  مطالعه معرفی پلتفرم دست اول
                </button>
              </div>

              {/* Ordering Panel Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start" dir="rtl">
                
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
                      ])).map((catName, idx) => ({ id: `mob-cat-${idx}-${catName}`, name: catName, value: catName }))
                    ].map((cat: any) => {
                      const isActive = activeCategory === cat.value;
                      return (
                        <button
                          key={cat.id}
                          onClick={() => setActiveCategory(cat.value)}
                          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-full text-[11px] font-black transition-all shrink-0 border cursor-pointer ${
                            isActive 
                              ? "bg-emerald-600 text-white border-emerald-500 shadow-md" 
                              : "bg-white text-slate-600 border-gray-200 hover:bg-white"
                          }`}
                        >
                          <span>{cat.name}</span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 -mx-4 px-4 scroll-smooth no-scrollbar" style={{ WebkitOverflowScrolling: 'touch' }}>
                    {["همه", ...Array.from(new Set(products.map(p => p.brand).filter(Boolean)))].map((brand, idx) => {
                      const isActive = selectedBrand === brand;
                      return (
                        <button
                          key={`mob-brand-${idx}-${brand}`}
                          onClick={() => setSelectedBrand(brand)}
                          className={`px-3 py-1.5 rounded-full text-[10px] font-black transition-all shrink-0 border cursor-pointer ${
                            isActive
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-white text-slate-500 border-gray-100"
                          }`}
                        >
                          {brand === "همه" ? "همه کارخانه‌ها" : brand}
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
                          <span>📂</span>
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
                          { id: "همه", name: "همه محصولات", value: "همه" },
                          ...Array.from(new Set([
                            ...(b2bConfig.categories || []).map((c: any) => typeof c === 'string' ? c : c.name),
                            ...products.map(p => p.category).filter(Boolean)
                          ])).map((catName, idx) => {
                            const found = (b2bConfig.categories || []).find((c: any) => (typeof c === 'string' ? c : c.name) === catName);
                            const id = found && typeof found !== 'string' ? found.id : `cat-gen-${idx}`;
                            return { id, name: catName, value: catName };
                          })
                        ].map((cat: any) => {
                          const isActive = activeCategory === cat.value;
                          const isEditing = editingCatId === cat.id && cat.value !== "همه";

                          return (
                            <div
                              key={cat.id}
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
                                    className="flex-1 text-right px-3.5 py-2.5 text-xs font-bold transition-all cursor-pointer"
                                  >
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
                <div className="lg:col-span-3 space-y-6">
                  {/* Display View modes controls */}
                  <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3 bg-white p-3 sm:p-4 rounded-[1.5rem] text-right">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-xs font-black text-gray-500 hidden sm:inline">حالت نمایش:</span>
                      <button
                        onClick={() => setViewMode('table')}
                        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[10px] sm font-black transition-all cursor-pointer ${
                          viewMode === 'table'
                          ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/10"
                          : "bg-white text-gray-650 hover"
                        }`}
                      >
                        <List size={13} />
                        <span className="hidden sm:inline">کاتالوگ رسمی</span>
                        <span className="sm:hidden">کاتالوگ</span>
                      </button>
                      <button
                        onClick={() => setViewMode('grid')}
                        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[10px] sm font-black transition-all cursor-pointer ${
                          viewMode === 'grid'
                          ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/10"
                          : "bg-white text-gray-650 hover"
                        }`}
                      >
                        <Grid size={13} />
                        <span className="hidden sm:inline">نمای شبکه‌ای کارتی</span>
                        <span className="sm:hidden">کارتی</span>
                      </button>
                      <button
                        onClick={() => setViewMode('list')}
                        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[10px] sm font-black transition-all cursor-pointer ${
                          viewMode === 'list'
                          ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/10"
                          : "bg-white text-gray-650 hover"
                        }`}
                      >
                        <List size={13} />
                        <span className="hidden sm:inline">لیست سفارش سریع</span>
                        <span className="sm:hidden">سریع</span>
                      </button>
                    </div>

                    <button
                      onClick={() => setIsCatalogOpen(true)}
                      className="flex items-center justify-center gap-2 bg-emerald-50 hover text-emerald-700 border border-emerald-200/50 px-4 py-2.5 rounded-xl text-xs font-black transition-all shadow-sm"
                    >
                      <Printer size={14} />
                      دانلود کاتالوگ محصولات (A4 PDF)
                    </button>
                  </div>

                  {/* Products catalog list */}
                  {loading ? (
                    <div className="flex flex-nowrap overflow-x-auto snap-x snap-mandatory hide-scrollbar scroll-smooth gap-4 pb-4 px-2">
                      {[...Array(6)].map((_, i) => (
                        <div key={i} className="min-w-[85vw] sm:min-w-[320px] snap-center shrink-0 bg-white rounded-2xl h-96 animate-pulse border border-gray-100" />
                      ))}
                    </div>
                  ) : filteredProducts.length === 0 ? (
                    <div className="bg-white rounded-2xl p-16 text-center border border-gray-100 shadow-sm">
                      <Package className="mx-auto text-gray-300 mb-4 animate-bounce" size={48} />
                      <h3 className="text-lg font-black text-gray-850">کالایی یافت نشد</h3>
                      <p className="text-xs text-gray-400 font-bold mt-2">دسته‌بندی یا برند دیگری را انتخاب نمایید.</p>
                    </div>
                  ) : viewMode === 'table' ? (
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
                      {/* Products Grid with Limit */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                        {(
                          !showAllHomepageProducts && searchQuery === "" && activeCategory === "همه" && selectedBrand === "همه"
                            ? filteredProducts.slice(0, 8)
                            : filteredProducts
                        ).map(product => (
                          <ProductCard 
                            key={product.id}
                            product={product} 
                            onAddToCart={addToCart} 
                            userBadge={userBadge}
                            onCompare={toggleComparison}
                            isComparing={!!comparisonList.find(p => p.id === product.id)}
                            onViewDetails={(product) => {
                              setSelectedDetailProduct(product);
                              setIsDetailModalOpen(true);
                            }}
                          />
                        ))}
                      </div>

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
                <AdminPanel 
                  products={products}
                  onAddProduct={handleAddProduct}
                  onUpdateProduct={handleUpdateProduct}
                  onDeleteProduct={handleDeleteProduct}
                  onBatchDeleteProducts={handleBatchDeleteProducts}
                  onRefreshProducts={fetchProducts}
                  b2bConfig={b2bConfig}
                  onUpdateB2bConfig={handleUpdateB2bConfig}
                  articles={articles}
                  onUpdateArticles={handleUpdateArticles}
                  language={language}
                  onLogout={handleLogout}
                />
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
                    className="px-6 py-3 bg-slate-900 text-white rounded-2xl font-black text-xs shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer"
                  >
                    بازگشت به پیشخوان اصلی
                  </button>
                  <button 
                    onClick={() => {
                      const adminAccount = {
                        name: "مدیر ارشد پلتفرم",
                        email: "admin@dastavval.ir",
                        role: "admin",
                        userCode: "ADM-001",
                        company: "دفتر مرکزی دست اول",
                        badge: "admin"
                      };
                      setUser(adminAccount);
                      setUserBadge("admin");
                      localStorage.setItem('dastavval_user', JSON.stringify(adminAccount));
                    }}
                    className="px-6 py-3 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 rounded-2xl font-black text-xs shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2 border border-amber-300"
                  >
                    🛡️ ورود سریع یک‌کلیکه به عنوان مدیر ارشد (Admin HQ)
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
              />
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
              <UserPanel
                user={user}
                onLogout={handleLogout}
                b2bConfig={b2bConfig}
                products={products}
                onAddToCart={addToCart}
                setActiveTab={setActiveTab as any}
                onUpdateUser={(updated) => setUser(updated)}
              />
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
              <B2BNews 
                articles={articles} 
                factories={b2bConfig?.factories || []} 
                b2bConfig={b2bConfig} 
                initialSubTab="news" 
                userBadge={userBadge}
                user={user}
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
              <B2BNews 
                articles={articles} 
                factories={b2bConfig?.factories || []} 
                b2bConfig={b2bConfig} 
                initialSubTab="education" 
                userBadge={userBadge}
                user={user}
              />
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
              <SupportCenter theme={theme === 'dark' ? 'dark' : 'light'} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {(activeTab === 'presentation' || activeTab === 'about') && (
        <>
          <ContactSection theme={theme} userBadge={userBadge} userCity={user?.city} />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
            <MagazineSection articles={articles} />
          </div>
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
                  {comparisonList.map(p => (
                    <div key={p.id} className="w-8 h-8 rounded-full border-2 border-indigo-900 bg-white p-1 flex items-center justify-center overflow-hidden">
                      {p.image_url ? (
                        <img 
                          src={p.image_url} 
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
        <CheckoutWizard
          isOpen={isCartOpen}
          onClose={() => setIsCartOpen(false)}
          cart={cart}
          onUpdateQuantity={(productId, newCartons) => {
            if (newCartons <= 0) {
              setCart(prev => prev.filter(i => i.productId !== productId));
            } else {
              setCart(prev => prev.map(i => i.productId === productId ? { ...i, quantityCartons: newCartons, totalItems: newCartons * (i.totalItems / i.quantityCartons || 1) } : i));
            }
          }}
          onRemoveItem={(productId) => removeFromCart(productId)}
          totalAmount={totalAmount}
          user={user}
          userBadge={userBadge}
          b2bConfig={b2bConfig}
          products={products}
          setShowAuthModal={setShowAuthModal}
          onOrderSuccess={(createdOrder) => {
            setCart([]);
            setIsCartOpen(false);
            setLastCreatedOrder(createdOrder);
          }}
        />
      )}

      {/* Official Invoice Modal after order success */}
      {lastCreatedOrder && (
        <WholesaleInvoiceView
          order={lastCreatedOrder}
          b2bConfig={b2bConfig}
          onClose={() => setLastCreatedOrder(null)}
          isBuyer={true}
        />
      )}

      {false && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-md z-[60]"
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
                      {cart.map(item => (
                        <div key={item.productId} className="flex gap-4 bg-white p-4 rounded-2xl border border-gray-100">
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
                              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">قیمت مستقیم درب کارخانه (ویژه بنکداران)</span>
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
                              <span className="text-[10px] text-amber-600 font-bold">۱۰٪ کارمزد فروش امانی (مخصوص همکاران طلایی و VIP)</span>
                            </div>
                          </div>
                          <FileText size={16} className="text-amber-600" />
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
                        <label className="block text-[11px] text-gray-500 font-bold mb-1">آدرس تخلیه بار کارتن عمده</label>
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
                          ].map((method) => (
                            <button
                              key={method.id}
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
                
                const totalQuantity = cart.reduce((sum, item) => sum + item.quantityCartons, 0);
                const bulkDiscount = getBestDiscount(totalAmount, totalQuantity);
                const bulkDiscountAmount = Math.round((totalAmount - badgeDiscountAmount) * (bulkDiscount.percent / 100));

                const finalPayableAmount = totalAmount - badgeDiscountAmount - bulkDiscountAmount;

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

      {/* Clean Light Material B2B Responsive Footer */}
      <footer className="bg-white text-slate-800 border-t border-slate-200/90 pt-16 pb-10 mt-12 relative" dir="rtl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10 text-right">
          
          {/* Column 1: Brand & Logo */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-600 rounded-2xl flex items-center justify-center p-1.5 text-white shadow-md shadow-emerald-600/20">
                <DastavvalLogo size={32} showText={false} logoUrl={b2bConfig.logoUrl} />
              </div>
              <div>
                <h3 className="text-lg font-black tracking-tight text-slate-900">{b2bConfig.appName || "بازرگانی دست اول"}</h3>
                <p className="text-[10px] text-emerald-700 font-bold">پلتفرم مبادلات مستقیم کارخانه به بنکدار</p>
              </div>
            </div>
            <p className="text-slate-600 text-xs font-bold leading-relaxed">
              سامانه هوشمند و شفاف بدون واسطه تامین مستقیم صنایع غذایی کشور. دسترسی آنی به تولیدکنندگان برتر و ثبت سفارشات عمده.
            </p>
            <div className="flex flex-wrap gap-2">
              {[
                { name: 'ایتا', icon: '🇮🇷', href: 'https://eitaa.com/dastavval_b2b' },
                { name: 'تلگرام', icon: '✈️', href: 'https://t.me/dastavval_b2b' },
                { name: 'واتساپ', icon: '💬', href: 'https://wa.me/989044502900' },
                { name: 'تماس تلفنی', icon: '📞', href: 'tel:09044502900' }
              ].map(social => (
                <a 
                  key={social.name} 
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 rounded-xl bg-white border border-slate-200 hover:border-emerald-500 hover:text-emerald-700 hover:bg-emerald-50/50 transition-all cursor-pointer flex items-center gap-1 text-xs font-black shadow-2xs hover:shadow-xs text-slate-800"
                >
                  <span className="text-xs">{social.icon}</span>
                  <span className="text-[10px]">{social.name}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h4 className="text-xs font-black mb-4 text-emerald-800 border-r-2 border-emerald-600 pr-2">دسترسی سریع به بخش‌ها</h4>
            <ul className="space-y-2.5 text-xs font-bold text-slate-600">
              <li 
                onClick={() => {
                  setActiveTab('order');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }} 
                className="hover:text-emerald-700 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <span className="text-emerald-600 font-black">‹</span>
                <span>ثبت سفارش و خرید عمده</span>
              </li>
              <li 
                onClick={() => {
                  setActiveTab('factories');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }} 
                className="hover:text-emerald-700 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <span className="text-emerald-600 font-black">‹</span>
                <span>ویترین کارخانجات برتر</span>
              </li>
              <li 
                onClick={() => {
                  setActiveTab('order');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }} 
                className="hover:text-emerald-700 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <span className="text-emerald-600 font-black">‹</span>
                <span>استعلام قیمت رسمی (RFQ)</span>
              </li>
              <li 
                onClick={() => {
                  setActiveTab('factories');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }} 
                className="hover:text-emerald-700 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <span className="text-emerald-600 font-black">‹</span>
                <span>شبکه نمایندگی‌های استانی</span>
              </li>
              <li 
                onClick={() => {
                  setActiveTab('news');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }} 
                className="hover:text-emerald-700 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <span className="text-emerald-600 font-black">‹</span>
                <span>اخبار و تحلیلهای بازار</span>
              </li>
            </ul>
          </div>

          {/* Column 3: Contact & Headquarters */}
          <div>
            <h4 className="text-xs font-black mb-4 text-emerald-800 border-r-2 border-emerald-600 pr-2">ارتباط با ستاد مرکزی</h4>
            <ul className="space-y-3 text-xs font-bold text-slate-600">
              <li className="flex items-start gap-2">
                <MapPin size={15} className="text-emerald-600 shrink-0 mt-0.5" />
                <span className="leading-relaxed text-[11px]">{b2bConfig.hqAddress || "آذربایجان شرقی، شبستر، شهرک صنعتی شندآباد، مجتمع انبار مرکزی"}</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone size={15} className="text-emerald-600 shrink-0" />
                <a href={`tel:${b2bConfig.supportPhone || '09044502900'}`} className="font-mono text-slate-900 font-black hover:text-emerald-700 transition-colors" dir="ltr">
                  {b2bConfig.supportPhone || "0904 450 2900"}
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Mail size={15} className="text-emerald-600 shrink-0" />
                <span className="font-mono text-slate-700 text-[11px]">info@dastavval.com</span>
              </li>
              <li className="pt-1">
                <div className="p-2.5 bg-emerald-50/80 border border-emerald-200/80 rounded-xl text-[10px] text-emerald-900 font-bold leading-snug">
                  ⏰ ساعات پاسخگویی: شنبه تا چهارشنبه ۸:۰۰ الی ۱۸:۰۰
                </div>
              </li>
            </ul>
          </div>

          {/* Column 4: Legal Guarantees & Trust Symbols */}
          <div className="space-y-3">
            <h4 className="text-xs font-black mb-2 text-emerald-800 border-r-2 border-emerald-600 pr-2">مجوزها و نمادهای اعتماد</h4>
            <div className="p-3 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-2">
              <div className="flex flex-wrap gap-2 justify-start">
                <TrustBadges b2bConfig={b2bConfig} />
              </div>
              <p className="text-[10px] text-slate-500 font-bold leading-relaxed pt-1 border-t border-slate-100">
                تضمین اصالت کالای کارخانه، بیمه ترانزیت بار و نظارت مستقیم اتاق بازرگانی.
              </p>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-12 pt-6 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-3 text-[11px] font-bold text-slate-500">
          <p>© {new Date().getFullYear()} {b2bConfig.appName || "بازرگانی دست اول"}. تمامی حقوق مادی و معنوی محفوظ است.</p>
          <div className="flex gap-4">
            <span onClick={() => setActiveTab('support')} className="hover:text-emerald-700 cursor-pointer transition-colors">قوانین و مقررات B2B</span>
            <span onClick={() => setActiveTab('support')} className="hover:text-emerald-700 cursor-pointer transition-colors">حریم خصوصی</span>
            <span onClick={() => setActiveTab('order')} className="hover:text-emerald-700 cursor-pointer transition-colors">ضوابط فاکتور رسمی</span>
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

      {/* Floating Scroll To Top Button */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            onClick={scrollToTop}
            className="fixed bottom-6 left-5 z-40 p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl shadow-xl hover:scale-110 active:scale-95 transition-all duration-300 cursor-pointer border border-blue-400/40 flex items-center justify-center group"
            title="بازگشت به بالای صفحه"
          >
            <ArrowUp size={20} className="group-hover:-translate-y-0.5 transition-transform" />
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
                quantityCartons: selectedDetailProduct.min_order_cartons,
                pricePerCarton: selectedDetailProduct.bulk_price * selectedDetailProduct.carton_pack_count,
                totalItems: selectedDetailProduct.min_order_cartons * selectedDetailProduct.carton_pack_count,
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
      {/* Magic cPanel Installation & GitHub Sync Wizard */}
      <CPanelInstallerWizard 
        isOpen={isCPanelWizardOpen}
        onClose={() => setIsCPanelWizardOpen(false)}
        b2bConfig={b2bConfig}
        onUpdateConfig={setB2bConfig}
      />

      {/* Full-screen Glassmorphic Shimmer Preloader */}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-2xl flex flex-col items-center justify-center space-y-6 text-white p-6 font-sans"
            dir="rtl"
          >
            <div className="relative">
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-indigo-500/20 via-white/10 to-purple-500/20 border border-white/30 backdrop-blur-2xl shadow-2xl shadow-indigo-500/20 flex items-center justify-center animate-pulse">
                <Building2 size={44} className="text-indigo-400" />
              </div>
              <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-indigo-500 to-purple-500 opacity-30 blur-lg" />
            </div>

            <div className="text-center space-y-2">
              <h2 className="text-xl font-black tracking-tight text-white">مرجع دست اول</h2>
              <p className="text-xs text-slate-300 font-bold">در حال همگام‌سازی کاتالوگ مرکزی و شبکه کارخانجات کشور...</p>
            </div>

            {/* Shimmer progress bar */}
            <div className="w-64 h-1.5 bg-white/10 backdrop-blur-md rounded-full overflow-hidden border border-white/20 relative">
              <div className="h-full bg-gradient-to-r from-indigo-500 via-indigo-300 to-purple-500 animate-pulse w-3/4 rounded-full" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
