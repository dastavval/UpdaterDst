import React, { useState, useEffect, useMemo, useRef } from "react";
import { getApiUrl } from "../utils/api-utils";
import {
  Package,
  Plus,
  Edit2,
  Trash2,
  Search,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Building2,
  DollarSign,
  Upload,
  RefreshCw,
  Eye,
  Filter,
  Check,
  X,
  Sparkles,
  Layers,
  FileText,
  Activity,
  ShieldCheck,
  Megaphone,
  User,
  Sliders,
  Send,
  HelpCircle,
  PhoneCall,
  Flame,
  Zap,
  Tag,
  Percent,
  Calendar,
  Grid,
  List,
  Save,
  Download,
  Boxes,
  Database,
  ArrowUpRight,
  ShoppingCart,
  Users,
  Award,
  BookOpen,
  Receipt,
  Settings,
  Bell,
  MessageSquare,
  Handshake,
  ClipboardList,
  LogOut,
  Repeat,
  Star,
  Warehouse,
  Truck,
  CreditCard,
  Hash,
  Info,
  MapPin,
  Clock,
  PlusCircle,
  FolderPlus,
  CheckSquare,
  Trophy,
  TrendingDown,
  Ticket
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Product, B2BConfig, NewsArticle, Category } from "../types";
import { Language } from "../lib/translations";
import { uploadToParsPackStorage } from "../utils/storage";
import { getDisplayImageUrl } from "../lib/image-utils";
import { generateProductCode, generateFactoryCode } from "../lib/id-utils";
import { getCacheStatus, clearAllCaches, CacheStatus } from "../lib/db-helper";
import { 
  triggerAutoChannelPost, 
  postSpecialOfferToChannel, 
  postKafBazaarToChannel, 
  postWeeklySaleToChannel, 
  postNewProductToChannel,
  postBestsellerToChannel,
  postSurplusApprovedToChannel
} from "../utils/channel-utils";

// Sub-components
import AdminAdsManagement from "./AdminAdsManagement";
import AdminPendingApprovals from "./AdminPendingApprovals";
import AdminOrders from "./AdminOrders";
import AdminCRM from "./AdminCRM";
import AdminArticles from "./AdminArticles";
import AdminSystemConfig from "./AdminSystemConfig";
import { AdminSalesCharts } from "./AdminSalesCharts";
import AdminAlertsCenter from "./AdminAlertsCenter";
import AdminChannelPosts from "./AdminChannelPosts";
import AdminRepresentatives from "./AdminRepresentatives";
import AdminSafeBuy from "./AdminSafeBuy";
import AdminInvoiceSettings from "./AdminInvoiceSettings";
import AdminFactoryProductAudit from "./AdminFactoryProductAudit";
import AdminRfqs from "./AdminRfqs";
import AdminCategoriesManagement from "./AdminCategoriesManagement";
import AdminBrandsManagement from "./AdminBrandsManagement";
import AdminFactoriesManagement from "./AdminFactoriesManagement";
import AdminUsersManagement from "./AdminUsersManagement";
import AdminTicketManagement from "./AdminTicketManagement";
import AdminSpecialOffersManagement from "./AdminSpecialOffersManagement";
import AdminCoupons from "./AdminCoupons";
import { BarterHall } from "./BarterHall";
import { ResilientVault } from "../lib/resilient-storage";
import { SmartJsonCatalogModal } from "./SmartJsonCatalogModal";
import WholesaleInvoiceView from "./WholesaleInvoiceView";
import { getGlobalDiscountConfig, saveGlobalDiscountConfig, GlobalDiscountConfig } from "../lib/discount-rules-helper";

interface AdminPanelProps {
  products: Product[];
  onAddProduct: (product: Omit<Product, "id">, skipSync?: boolean) => Promise<any> | void;
  onUpdateProduct: (id: string, product: Partial<Product>) => Promise<any> | void;
  onDeleteProduct: (id: string) => Promise<any> | void;
  onBatchDeleteProducts?: (ids: string[]) => Promise<any> | void;
  onBulkUpdateProducts?: (ids: any[], updates?: Partial<Product>) => Promise<any> | void;
  onRefreshProducts?: () => Promise<void> | void;
  b2bConfig: B2BConfig;
  onUpdateB2bConfig: (updated: Partial<B2BConfig>) => Promise<void>;
  articles?: NewsArticle[];
  onUpdateArticles?: (articles: NewsArticle[]) => Promise<void>;
  language?: Language;
  onLogout?: () => void;
}

const toPersianNum = (n: number | string | undefined | null): string => {
  if (n === undefined || n === null) return "";
  const farsiDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return n.toString().replace(/\d/g, x => farsiDigits[parseInt(x, 10)]);
};

const toEnglishNum = (str: string): string => {
  if (!str) return "";
  return str
    .replace(/[۰-۹]/g, d => "0123456789"["۰۱۲۳۴۵۶۷۸۹".indexOf(d)])
    .replace(/[٠-٩]/g, d => "0123456789"["٠١٢٣٤٥٦٧٨٩".indexOf(d)]);
};

export default function AdminPanel({
  products = [],
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onBatchDeleteProducts,
  onBulkUpdateProducts,
  onRefreshProducts,
  b2bConfig,
  onUpdateB2bConfig,
  articles = [],
  onUpdateArticles,
  language = 'fa',
  onLogout
}: AdminPanelProps) {
  // Navigation & Tabs
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [activeProductSubTab, setActiveProductSubTab] = useState<'all' | 'weekly_sale' | 'featured' | 'bestsellers' | 'surplus' | 'kafbazaar' | 'disabled' | 'low_stock'>('all');

  // Messages
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showJsonCatalogModal, setShowJsonCatalogModal] = useState(false);
  const [selectedOrderToPrint, setSelectedOrderToPrint] = useState<any | null>(null);

  // Bulk Product Management State
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [bulkPriceValue, setBulkPriceValue] = useState<string>("");
  const [bulkPriceChangeType, setBulkPriceChangeType] = useState<'set' | 'percent_increase' | 'percent_decrease'>('set');
  const [bulkStockValue, setBulkStockValue] = useState<string>("");
  const [bulkStockChangeType, setBulkStockChangeType] = useState<'set' | 'add' | 'subtract'>('set');
  const [showBulkPriceModal, setShowBulkPriceModal] = useState(false);
  const [showBulkStockModal, setShowBulkStockModal] = useState(false);

  // Cache Management
  const [cacheStatus, setCacheStatus] = useState<CacheStatus>({ isHealthy: false, itemCount: 0, lastUpdate: null });
  const [isClearingCache, setIsClearingCache] = useState(false);

  // Ad and Request states
  const [sponsoredAds, setSponsoredAds] = useState<any[]>([]);
  const [rawMaterialAds, setRawMaterialAds] = useState<any[]>([]);
  const [equipmentAds, setEquipmentAds] = useState<any[]>([]);
  const [serviceAds, setServiceAds] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersSearch, setOrdersSearch] = useState("");

  // Admin Capacity Ads State with auto-synchronization
  const [adminCapacityAds, setAdminCapacityAds] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem("dastavval_capacity_ads");
      if (saved) return JSON.parse(saved);
    } catch(e){}
    return [];
  });

  useEffect(() => {
    const handleStorageChange = () => {
      try {
        const saved = localStorage.getItem("dastavval_capacity_ads");
        if (saved) setAdminCapacityAds(JSON.parse(saved));
      } catch(e){}
    };
    window.addEventListener("dastavval_ads_updated", handleStorageChange);
    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("dastavval_ads_updated", handleStorageChange);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const handleAdminDeleteCapacityAd = (adId: string) => {
    if (window.confirm("آیا از حذف این آگهی ظرفیت خالی به عنوان ادمین اطمینان دارید؟")) {
      const updated = adminCapacityAds.filter(ad => ad.id !== adId);
      setAdminCapacityAds(updated);
      localStorage.setItem("dastavval_capacity_ads", JSON.stringify(updated));
      window.dispatchEvent(new Event("dastavval_ads_updated"));
      setSuccessMsg("آگهی ظرفیت خالی با موفقیت حذف شد.");
      setTimeout(() => setSuccessMsg(null), 3000);
    }
  };

  const handleAdminUpdateCapacityAd = (adId: string, status: string) => {
    const updated = adminCapacityAds.map(ad => {
      if (ad.id === adId || String(ad.id) === String(adId)) {
        return { ...ad, status, isPending: status === 'pending' };
      }
      return ad;
    });
    setAdminCapacityAds(updated);
    localStorage.setItem("dastavval_capacity_ads", JSON.stringify(updated));
    window.dispatchEvent(new Event("dastavval_ads_updated"));
    setSuccessMsg("وضعیت آگهی ظرفیت خالی با موفقیت بروزرسانی شد.");
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleAdminUpdateCoopStatus = (adId: string, reqIndex: number, newStatus: string) => {
    const updated = adminCapacityAds.map(ad => {
      if (ad.id === adId && ad.cooperationRequests) {
        const reqs = [...ad.cooperationRequests];
        reqs[reqIndex] = { ...reqs[reqIndex], status: newStatus };
        return { ...ad, cooperationRequests: reqs };
      }
      return ad;
    });
    setAdminCapacityAds(updated);
    localStorage.setItem("dastavval_capacity_ads", JSON.stringify(updated));
    window.dispatchEvent(new Event("dastavval_ads_updated"));
    setSuccessMsg("وضعیت درخواست همکاری با موفقیت بروزرسانی شد.");
    setTimeout(() => setSuccessMsg(null), 3000);
  };
  const [safeBuyRequests, setSafeBuyRequests] = useState<any[]>([]);
  const [barterDeals, setBarterDeals] = useState<any[]>([]);
  const [representativesList, setRepresentativesList] = useState<any[]>([]);
  const [suppliersList, setSuppliersList] = useState<any[]>([]);
  const [callbackRequests, setCallbackRequests] = useState<any[]>([]);
  const [supportTickets, setSupportTickets] = useState<any[]>([]);
  const [crmCustomers, setCrmCustomers] = useState<any[]>([]);
  const [crmLoading, setCrmLoading] = useState(false);
  const [rfqCount, setRfqCount] = useState<number>(0);

  // Product Filters & Form States
  const [productSearch, setProductSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [productViewMode, setProductViewMode] = useState<'grid' | 'table'>('table');
  const [showProductForm, setShowProductForm] = useState(false);
  const [isEditingProductId, setIsEditingProductId] = useState<string | null>(null);

  // Product Form Fields
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [factoryName, setFactoryName] = useState("");
  const [supplierName, setSupplierName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("تنقلات و شکلات");
  const [price, setPrice] = useState<number>(0);
  const [bulkPrice, setBulkPrice] = useState<number>(0);
  const [consumerPrice, setConsumerPrice] = useState<number>(0);
  const [purchasePrice, setPurchasePrice] = useState<number>(0);
  const [cartonPackCount, setCartonPackCount] = useState<number>(24);
  const [minOrderCartons, setMinOrderCartons] = useState<number>(5);
  const [stockQuantityCartons, setStockQuantityCartons] = useState<number>(100);
  const [imageUrl, setImageUrl] = useState("");
  const [unit, setUnit] = useState("بسته");
  const [badge, setBadge] = useState("");
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isFeatured, setIsFeatured] = useState(false);
  const [isBestseller, setIsBestseller] = useState(false);
  const [bestsellerRank, setBestsellerRank] = useState<number>(1);
  const [bestsellerMonthlySales, setBestsellerMonthlySales] = useState<number>(500);
  const [bestsellerRepeatRate, setBestsellerRepeatRate] = useState<number>(85);
  const [isKafBazaar, setIsKafBazaar] = useState(false);
  const [chequeAllowed, setChequeAllowed] = useState(true);
  const [hasHealthApple, setHasHealthApple] = useState(false);
  const [isNatural, setIsNatural] = useState(false);
  const [isOrganic, setIsOrganic] = useState(false);
  const [healthCertCode, setHealthCertCode] = useState("");
  const [productTags, setProductTags] = useState("");
  const [packDescription, setPackDescription] = useState("");
  const [shippingOrigin, setShippingOrigin] = useState("");
  const [leadTimeDays, setLeadTimeDays] = useState(2);

  // Inline Supplier Creation States
  const [showNewSupplierInline, setShowNewSupplierInline] = useState(false);
  const [newSupName, setNewSupName] = useState("");
  const [newSupLocation, setNewSupLocation] = useState("");
  const [newSupPhone, setNewSupPhone] = useState("");
  const [newSupCategory, setNewSupCategory] = useState("مواد اولیه و تولیدی");

  // Inline Custom Category Creation States
  const [showNewCategoryInline, setShowNewCategoryInline] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatEmoji, setNewCatEmoji] = useState("🏷️");
  const [newCatType, setNewCatType] = useState<string>("product");
  const [newCatDescription, setNewCatDescription] = useState("");

  // Weekly Sale Form Fields
  const [weeklySaleActive, setWeeklySaleActive] = useState(false);
  const [weeklySaleDiscount, setWeeklySaleDiscount] = useState<number>(15);
  const [weeklySaleDay, setWeeklySaleDay] = useState<string>("همه روزها");
  const [weeklySaleQuota, setWeeklySaleQuota] = useState<number>(200);

  // Automated Social Post settings
  const [autoPostSettings, setAutoPostSettings] = useState({
    new_product: true,
    new_discount: true,
    new_ad: true,
    new_factory: true
  });

  // Load all local data on mount & listen to sync events
  const loadLocalData = async () => {
    try {
      // 1. Ads (Sponsored / General)
      const savedAds = localStorage.getItem("dastavval_sponsored_ads_v2");
      let adsList: any[] = [];
      if (savedAds) {
        try { adsList = JSON.parse(savedAds); } catch (e) {}
      }
      if (b2bConfig?.sponsoredAds && Array.isArray(b2bConfig.sponsoredAds)) {
        const adMap: Record<string, any> = {};
        adsList.forEach(a => { if (a && a.id) adMap[a.id] = a; });
        b2bConfig.sponsoredAds.forEach((a: any) => { if (a && a.id) adMap[a.id] = a; });
        adsList = Object.values(adMap);
      }
      setSponsoredAds(adsList);

      // 1b. Raw Material Ads
      const savedRaw = localStorage.getItem("dastavval_raw_materials");
      let rawList: any[] = [];
      if (savedRaw) {
        try { rawList = JSON.parse(savedRaw); } catch (e) {}
      }
      if (b2bConfig?.rawMaterialAds && Array.isArray(b2bConfig.rawMaterialAds)) {
        const rawMap: Record<string, any> = {};
        rawList.forEach(a => { if (a && a.id) rawMap[a.id] = a; });
        b2bConfig.rawMaterialAds.forEach((a: any) => { if (a && a.id) rawMap[a.id] = a; });
        rawList = Object.values(rawMap);
      }
      setRawMaterialAds(rawList);

      // 1c. Equipment Ads
      const savedEq = localStorage.getItem("dastavval_industrial_equipment");
      let eqList: any[] = [];
      if (savedEq) {
        try { eqList = JSON.parse(savedEq); } catch (e) {}
      }
      if (b2bConfig?.equipmentAds && Array.isArray(b2bConfig.equipmentAds)) {
        const eqMap: Record<string, any> = {};
        eqList.forEach(a => { if (a && a.id) eqMap[a.id] = a; });
        b2bConfig.equipmentAds.forEach((a: any) => { if (a && a.id) eqMap[a.id] = a; });
        eqList = Object.values(eqMap);
      }
      setEquipmentAds(eqList);

      // 1d. Service Ads
      const savedSrv = localStorage.getItem("dastavval_industrial_services");
      let srvList: any[] = [];
      if (savedSrv) {
        try { srvList = JSON.parse(savedSrv); } catch (e) {}
      }
      if (b2bConfig?.serviceAds && Array.isArray(b2bConfig.serviceAds)) {
        const srvMap: Record<string, any> = {};
        srvList.forEach(a => { if (a && a.id) srvMap[a.id] = a; });
        b2bConfig.serviceAds.forEach((a: any) => { if (a && a.id) srvMap[a.id] = a; });
        srvList = Object.values(srvMap);
      }
      setServiceAds(srvList);

      // 2. Orders (Multi-layer Resilient load)
      try {
        const unifiedOrders = await ResilientVault.getOrders();
        if (unifiedOrders && unifiedOrders.length > 0) {
          setOrders(unifiedOrders);
        } else {
          const savedOrders = localStorage.getItem("dastavval_orders_cache") || localStorage.getItem("dastavval_wholesale_orders") || localStorage.getItem("dastavval_raw_orders");
          if (savedOrders) setOrders(JSON.parse(savedOrders));
        }
      } catch (e) {
        const savedOrders = localStorage.getItem("dastavval_orders_cache") || localStorage.getItem("dastavval_wholesale_orders") || localStorage.getItem("dastavval_raw_orders");
        if (savedOrders) setOrders(JSON.parse(savedOrders));
      }

      // 3. Safe Buy Requests
      const savedSafeBuy = localStorage.getItem("dastavval_safe_buy_requests");
      if (savedSafeBuy) {
        try { setSafeBuyRequests(JSON.parse(savedSafeBuy)); } catch (e) {}
      }

      // 4. Barter Deals
      const savedBarter = localStorage.getItem("dastavval_barter_deals");
      if (savedBarter) {
        try { setBarterDeals(JSON.parse(savedBarter)); } catch (e) {}
      }

      // 5. Representatives & Dealership Requests (Multi-layer Resilient load)
      try {
        const unifiedReps = await ResilientVault.getDealershipRequests();
        if (unifiedReps && unifiedReps.length > 0) {
          setRepresentativesList(unifiedReps);
        } else {
          const savedReps = localStorage.getItem("dastavval_dealership_requests") || localStorage.getItem("dastavval_agency_requests");
          if (savedReps) setRepresentativesList(JSON.parse(savedReps));
        }
      } catch (e) {
        const savedReps = localStorage.getItem("dastavval_dealership_requests") || localStorage.getItem("dastavval_agency_requests");
        if (savedReps) setRepresentativesList(JSON.parse(savedReps));
      }

      // 6. Callback Requests
      const savedCallbacks = localStorage.getItem("dastavval_callback_requests");
      if (savedCallbacks) {
        try { setCallbackRequests(JSON.parse(savedCallbacks)); } catch (e) {}
      }

      // 7. Support Tickets
      const savedTickets = localStorage.getItem("dastavval_tickets");
      if (savedTickets) {
        try { setSupportTickets(JSON.parse(savedTickets)); } catch (e) {}
      }

      // 8. CRM Leads
      const savedCrm = localStorage.getItem("dastavval_crm_leads");
      if (savedCrm) {
        try { setCrmCustomers(JSON.parse(savedCrm)); } catch (e) {}
      }

      // 9. RFQs count
      try {
        const savedRfqs = localStorage.getItem("dastavval_raw_orders");
        if (savedRfqs) {
          const parsed = JSON.parse(savedRfqs);
          if (Array.isArray(parsed)) {
            setRfqCount(parsed.length);
          }
        }
      } catch (e) {}

      // 10. Suppliers List
      const savedSuppliers = localStorage.getItem("dastavval_raw_suppliers");
      let supsList: any[] = [];
      if (savedSuppliers) {
        try { supsList = JSON.parse(savedSuppliers); } catch (e) {}
      }
      if (!Array.isArray(supsList) || supsList.length === 0) {
        supsList = [
          { id: "sup-1", companyName: "توسعه نیشکر و صنایع جانبی خوزستان", location: "اهواز - کارون", contactPhone: "09121112233", category: "مواد اولیه و شکر" },
          { id: "sup-2", companyName: "صنایع نشاسته و گلوکز زرین گلوکز", location: "قزوین - شهرک صنعتی لیا", contactPhone: "09123334455", category: "شیرین‌کننده و گلوکز" },
          { id: "sup-3", companyName: "بازرگانی بین‌المللی ارس تجارت نوین", location: "منطقه آزاد ارس (جلفا)", contactPhone: "09145556677", category: "تنقلات و شکلات" },
          { id: "sup-4", companyName: "صنایع روغن‌کشی و تصفیه بهارستان", location: "کرج - شهرک صنعتی اشتهارد", contactPhone: "09127778899", category: "روغن و چربی خوراکی" },
          { id: "sup-5", companyName: "مجتمع چاپ و بسته‌بندی نگین پویا", location: "تبریز - شهرک صنعتی شهید سلیمی", contactPhone: "09141112233", category: "چاپ و کارتن‌سازی" },
          { id: "sup-6", companyName: "کشت و صنعت دشت طلایی خراسان", location: "مشهد - شهرک صنعتی چناران", contactPhone: "09151112233", category: "رب و کنسروجات" }
        ];
      }
      setSuppliersList(supsList);
    } catch (e) {
      console.error("Error loading local data in AdminPanel:", e);
    }
  };

  useEffect(() => {
    loadLocalData();
    const handleSync = () => loadLocalData();
    window.addEventListener("dastavval_ads_updated", handleSync);
    window.addEventListener("dastavval_products_updated", handleSync);
    window.addEventListener("dastavval_orders_updated", handleSync);
    window.addEventListener("dastavval_data_refreshed", handleSync);
    window.addEventListener("dastavval-ads-sync", handleSync);
    window.addEventListener("dastavval-manual-sync", handleSync);
    window.addEventListener("storage", handleSync);

    // Check DB cache
    getCacheStatus().then(status => setCacheStatus(status));

    return () => {
      window.removeEventListener("dastavval_ads_updated", handleSync);
      window.removeEventListener("dastavval_products_updated", handleSync);
      window.removeEventListener("dastavval_orders_updated", handleSync);
      window.removeEventListener("dastavval_data_refreshed", handleSync);
      window.removeEventListener("dastavval-ads-sync", handleSync);
      window.removeEventListener("dastavval-manual-sync", handleSync);
      window.removeEventListener("storage", handleSync);
    };
  }, [b2bConfig]);

  // Add Inline Supplier
  const handleAddInlineSupplier = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newSupName.trim()) {
      setErrorMsg("لطفاً نام شرکت یا شخص تامین‌کننده را وارد کنید.");
      return;
    }
    const newSup = {
      id: `sup-${Date.now()}`,
      companyName: newSupName.trim(),
      location: newSupLocation.trim() || "ایران",
      contactPhone: newSupPhone.trim() || "ثبت نشده",
      category: newSupCategory.trim() || "تولیدی و تامین",
      isVerified: true
    };
    const updated = [newSup, ...suppliersList];
    setSuppliersList(updated);
    try {
      localStorage.setItem("dastavval_raw_suppliers", JSON.stringify(updated));
    } catch (err) {}
    setSupplierName(newSup.companyName);
    setNewSupName("");
    setNewSupLocation("");
    setNewSupPhone("");
    setShowNewSupplierInline(false);
    setSuccessMsg(`تامین‌کننده «${newSup.companyName}» با موفقیت تعریف و متصل شد.`);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  // Quick One-Click Toggle for Products directly from Card or Table without entering edit form
  const handleQuickToggleProductFlag = async (
    product: Product,
    flag: 'isFeatured' | 'isBestseller' | 'isKafBazaar' | 'weeklySaleActive' | 'chequeAllowed' | 'disabled'
  ) => {
    try {
      const currentVal = !!product[flag];
      const nextVal = !currentVal;
      let updates: Partial<Product> = { [flag]: nextVal };

      if (flag === 'weeklySaleActive') {
        updates = {
          weeklySaleActive: nextVal,
          weeklySaleDiscount: product.weeklySaleDiscount || 15,
          weeklySaleDay: product.weeklySaleDay || "همه روزها",
          weeklySaleQuota: product.weeklySaleQuota || 200,
          weeklySalePrice: Math.round((product.bulk_price || product.price || 0) * (1 - (product.weeklySaleDiscount || 15) / 100))
        };
      }

      await onUpdateProduct(product.id, updates);

      // Automatically broadcast to the official notification channel when enabled
      if (nextVal) {
        if (flag === 'isFeatured') {
          postSpecialOfferToChannel({ ...product, ...updates });
        } else if (flag === 'isKafBazaar') {
          postKafBazaarToChannel({ ...product, ...updates });
        } else if (flag === 'weeklySaleActive') {
          postWeeklySaleToChannel({ ...product, ...updates });
        } else if (flag === 'isBestseller') {
          postBestsellerToChannel({ ...product, ...updates });
        }
      }

      const flagLabels: Record<string, { on: string; off: string }> = {
        isFeatured: { on: `«${product.name}» به بخش فروش ویژه اضافه و در کانال اطلاع‌رسانی منتشر شد ⭐`, off: `«${product.name}» از فروش ویژه خارج شد.` },
        isBestseller: { on: `«${product.name}» به عنوان پرفروش‌ترین بنکداری علامت‌گذاری و در صفحه اصلی منتشر شد 🏆`, off: `«${product.name}» از لیست پرفروش‌ترین‌ها خارج شد.` },
        isKafBazaar: { on: `«${product.name}» به تالار کف بازار اضافه و در کانال اطلاع‌رسانی منتشر شد 🔥`, off: `«${product.name}» از کف بازار خارج شد.` },
        weeklySaleActive: { on: `«${product.name}» به برنامه فروش هفتگی پیوست و در کانال اطلاع‌رسانی منتشر شد 📅`, off: `«${product.name}» از برنامه فروش هفتگی خارج شد.` },
        chequeAllowed: { on: `امکان پرداخت چکی برای «${product.name}» فعال شد 💳`, off: `پرداخت چکی برای «${product.name}» غیرفعال شد.` },
        disabled: { on: `«${product.name}» غیرفعال و مخفی شد 🔒`, off: `«${product.name}» فعال و نمایان شد 🔓` }
      };

      setSuccessMsg(nextVal ? flagLabels[flag].on : flagLabels[flag].off);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setErrorMsg("خطا در به‌روزرسانی سریع وضعیت کالا: " + (err?.message || ""));
      setTimeout(() => setErrorMsg(null), 3000);
    }
  };

  // Surplus Factory Product Approval Workflow (تایید/رد مازاد خط تولید کارخانجات توسط مدیر)
  const handleApproveSurplus = async (product: Product, approve: boolean) => {
    try {
      if (approve) {
        const updates: Partial<Product> = {
          isSurplus: true,
          surplusStatus: 'approved',
          isKafBazaar: true,
          bulk_price: product.surplusPrice || product.bulk_price || product.price,
        };
        await onUpdateProduct(product.id, updates);
        postSurplusApprovedToChannel({ ...product, ...updates });
        setSuccessMsg(`مازاد خط تولید کالا «${product.name}» تأیید و در کف بازار و کانال اطلاع‌رسانی منتشر شد! 🔥`);
      } else {
        await onUpdateProduct(product.id, {
          isSurplus: false,
          surplusStatus: 'rejected',
        });
        setSuccessMsg(`درخواست مازاد خط کالا «${product.name}» رد شد.`);
      }
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err: any) {
      setErrorMsg("خطا در تصمیم‌گیری مازاد خط: " + (err?.message || ""));
      setTimeout(() => setErrorMsg(null), 3000);
    }
  };

  // Bulk actions helpers
  const handleBulkToggleDisable = async (disable: boolean) => {
    if (selectedProductIds.length === 0) return;
    try {
      setLoading(true);
      if (onBulkUpdateProducts) {
        await onBulkUpdateProducts(selectedProductIds, { disabled: disable });
      } else {
        for (const id of selectedProductIds) {
          await onUpdateProduct(id, { disabled: disable });
        }
      }
      setSelectedProductIds([]);
      setSuccessMsg(disable ? "کالاهای انتخاب شده غیرفعال شدند." : "کالاهای انتخاب شده فعال شدند.");
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      setErrorMsg("خطا در به روزرسانی وضعیت کالاها");
      setTimeout(() => setErrorMsg(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedProductIds.length === 0) return;
    const confirmMsg = `آیا از حذف گروهی ${toPersianNum(selectedProductIds.length)} کالا اطمینان دارید؟ این عمل غیر قابل بازگشت است.`;
    if (!window.confirm(confirmMsg)) return;

    try {
      setLoading(true);
      if (onBatchDeleteProducts) {
        await onBatchDeleteProducts(selectedProductIds);
      } else {
        for (const id of selectedProductIds) {
          await onDeleteProduct(id);
        }
      }
      setSelectedProductIds([]);
      setSuccessMsg("کالاهای انتخاب شده با موفقیت حذف شدند.");
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      setErrorMsg("خطا در حذف گروهی کالاها");
      setTimeout(() => setErrorMsg(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyBulkPrice = async () => {
    if (selectedProductIds.length === 0) return;
    const val = parseFloat(toEnglishNum(bulkPriceValue));
    if (isNaN(val) || val <= 0) {
      alert("لطفا مقدار عددی معتبری وارد کنید.");
      return;
    }

    try {
      setLoading(true);
      const updatedProducts = products.map(p => {
        if (!selectedProductIds.includes(p.id)) return p;
        let newPrice = p.bulk_price || p.price || 0;
        if (bulkPriceChangeType === 'set') {
          newPrice = val;
        } else if (bulkPriceChangeType === 'percent_increase') {
          newPrice = Math.round(newPrice * (1 + val / 100));
        } else if (bulkPriceChangeType === 'percent_decrease') {
          newPrice = Math.round(newPrice * (1 - val / 100));
        }
        return {
          ...p,
          bulk_price: newPrice,
          price: newPrice
        };
      });

      if (onBulkUpdateProducts) {
        await (onBulkUpdateProducts as any)(updatedProducts);
      } else {
        for (const p of updatedProducts) {
          if (selectedProductIds.includes(p.id)) {
            await onUpdateProduct(p.id, { bulk_price: p.bulk_price, price: p.price });
          }
        }
      }

      setSelectedProductIds([]);
      setBulkPriceValue("");
      setShowBulkPriceModal(false);
      setSuccessMsg("قیمت کالاها با موفقیت به روزرسانی شد.");
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      setErrorMsg("خطا در ویرایش گروهی قیمت‌ها");
      setTimeout(() => setErrorMsg(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyBulkStock = async () => {
    if (selectedProductIds.length === 0) return;
    const val = parseInt(toEnglishNum(bulkStockValue), 10);
    if (isNaN(val)) {
      alert("لطفا مقدار عددی معتبری وارد کنید.");
      return;
    }

    try {
      setLoading(true);
      const updatedProducts = products.map(p => {
        if (!selectedProductIds.includes(p.id)) return p;
        let newStock = p.stock_quantity_cartons || 0;
        if (bulkStockChangeType === 'set') {
          newStock = Math.max(0, val);
        } else if (bulkStockChangeType === 'add') {
          newStock = Math.max(0, newStock + val);
        } else if (bulkStockChangeType === 'subtract') {
          newStock = Math.max(0, newStock - val);
        }
        return {
          ...p,
          stock_quantity_cartons: newStock
        };
      });

      if (onBulkUpdateProducts) {
        await (onBulkUpdateProducts as any)(updatedProducts);
      } else {
        for (const p of updatedProducts) {
          if (selectedProductIds.includes(p.id)) {
            await onUpdateProduct(p.id, { stock_quantity_cartons: p.stock_quantity_cartons });
          }
        }
      }

      setSelectedProductIds([]);
      setBulkStockValue("");
      setShowBulkStockModal(false);
      setSuccessMsg("موجودی کالاها با موفقیت به روزرسانی شد.");
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      setErrorMsg("خطا در ویرایش گروهی موجودی‌ها");
      setTimeout(() => setErrorMsg(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  // Categories list
  const categoriesList = useMemo(() => {
    if (b2bConfig?.categories && b2bConfig.categories.length > 0) {
      return b2bConfig.categories.map((c: any) => typeof c === 'string' ? c : (c.name || c.id));
    }
    const fromProds = Array.from(new Set(products.map(p => p.category).filter(Boolean)));
    return fromProds.length > 0 ? fromProds : ["تنقلات و شکلات", "شوینده و بهداشتی", "کنسرو و مواد غذایی", "نوشیدنی و لبنیات"];
  }, [b2bConfig, products]);

  // Detailed categories list with emojis and types
  const detailedCategoriesList = useMemo(() => {
    let list: Array<{ id: string; name: string; emoji: string; type: string; description?: string; isCustom?: boolean }> = [];
    if (b2bConfig?.categories && Array.isArray(b2bConfig.categories) && b2bConfig.categories.length > 0) {
      list = b2bConfig.categories.map((c: any, idx: number) => {
        if (typeof c === 'string') {
          return { id: `cat-${idx + 1}`, name: c, emoji: '🏷️', type: 'product', isCustom: false };
        }
        return {
          id: c.id || `cat-${idx + 1}`,
          name: c.name || '',
          emoji: c.emoji || '🏷️',
          type: c.type || 'product',
          description: c.description || '',
          isCustom: !!c.isCustom
        };
      }).filter(c => !!c.name);
    }

    const existingNames = new Set(list.map(c => c.name));
    products.forEach((p, idx) => {
      if (p.category && !existingNames.has(p.category)) {
        list.push({
          id: `cat-prod-${idx}`,
          name: p.category,
          emoji: '🏷️',
          type: 'product',
          isCustom: false
        });
        existingNames.add(p.category);
      }
    });

    if (list.length === 0) {
      list = [
        { id: 'cat-1', name: 'تنقلات و شکلات', emoji: '🍫', type: 'product', isCustom: false },
        { id: 'cat-2', name: 'شوینده و بهداشتی', emoji: '🧼', type: 'product', isCustom: false },
        { id: 'cat-3', name: 'کنسرو و مواد غذایی', emoji: '🥫', type: 'product', isCustom: false },
        { id: 'cat-4', name: 'نوشیدنی و لبنیات', emoji: '🥛', type: 'product', isCustom: false },
        { id: 'cat-5', name: 'مواد اولیه و شیمیایی', emoji: '🧪', type: 'raw_material', isCustom: false },
        { id: 'cat-6', name: 'ماشین‌آلات و تجهیزات', emoji: '⚙️', type: 'equipment', isCustom: false },
        { id: 'cat-7', name: 'خدمات صنعتی و بسته بندی', emoji: '📦', type: 'service', isCustom: false },
        { id: 'cat-8', name: 'تهاتر کارخانه‌ای', emoji: '🔄', type: 'barter', isCustom: false },
      ];
    }
    return list;
  }, [b2bConfig?.categories, products]);

  // Handler for adding dynamic custom category inline
  const handleAddInlineCategory = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmedName = newCatName.trim();
    if (!trimmedName) {
      setErrorMsg("لطفاً عنوان دسته‌بندی سفارشی را وارد کنید.");
      setTimeout(() => setErrorMsg(null), 3000);
      return;
    }

    const newCategoryObj = {
      id: `cat-${Date.now()}`,
      name: trimmedName,
      emoji: newCatEmoji || "🏷️",
      type: newCatType || "product",
      description: newCatDescription.trim() || "",
      isCustom: true
    };

    const currentCats = b2bConfig?.categories && Array.isArray(b2bConfig.categories)
      ? [...b2bConfig.categories]
      : [];

    const exists = currentCats.some((c: any) => (typeof c === 'string' ? c : c.name) === trimmedName);
    let updatedCats = currentCats;
    if (!exists) {
      updatedCats = [...currentCats, newCategoryObj];
      try {
        await onUpdateB2bConfig({
          ...b2bConfig,
          categories: updatedCats as any
        });
        localStorage.setItem("dastavval_custom_categories", JSON.stringify(updatedCats));
      } catch (err) {
        console.error("Failed to sync category config", err);
      }
    }

    setCategory(trimmedName);
    setNewCatName("");
    setNewCatEmoji("🏷️");
    setNewCatDescription("");
    setShowNewCategoryInline(false);
    setSuccessMsg(`دسته‌بندی پویا «${newCategoryObj.emoji} ${trimmedName}» با موفقیت ثبت و برای این کالا انتخاب شد.`);
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      // 1. Search
      if (productSearch.trim()) {
        const query = productSearch.toLowerCase();
        const matches = 
          (p.name && p.name.toLowerCase().includes(query)) ||
          (p.brand && p.brand.toLowerCase().includes(query)) ||
          (p.category && p.category.toLowerCase().includes(query)) ||
          (p.productCode && p.productCode.toLowerCase().includes(query));
        if (!matches) return false;
      }

      // 2. Category
      if (selectedCategory !== "all" && p.category !== selectedCategory) {
        return false;
      }

      // 3. Sub-tab filter
      if (activeProductSubTab === 'weekly_sale') return !!p.weeklySaleActive;
      if (activeProductSubTab === 'featured') return !!p.isFeatured;
      if (activeProductSubTab === 'bestsellers') return !!p.isBestseller;
      if (activeProductSubTab === 'surplus') return !!p.isSurplus;
      if (activeProductSubTab === 'kafbazaar') return !!p.isKafBazaar;
      if (activeProductSubTab === 'disabled') return !!p.disabled;
      if (activeProductSubTab === 'low_stock') return (p.stock_quantity_cartons || 0) < 15;

      return true;
    });
  }, [products, productSearch, selectedCategory, activeProductSubTab]);

  // Counts for pending items
  const pendingAdsCount = useMemo(() => {
    const p1 = sponsoredAds.filter(a => a.status === 'pending' || !a.status).length;
    const p2 = rawMaterialAds.filter(a => a.isPendingApproval || a.status === 'pending' || !a.status || a.status === 'در حال بررسی').length;
    const p3 = equipmentAds.filter(a => a.isPendingApproval || a.status === 'pending' || !a.status || a.status === 'در حال بررسی').length;
    const p4 = serviceAds.filter(a => a.isPendingApproval || a.status === 'pending' || !a.status || a.status === 'در حال بررسی').length;
    return p1 + p2 + p3 + p4;
  }, [sponsoredAds, rawMaterialAds, equipmentAds, serviceAds]);

  const pendingOrdersCount = useMemo(() => {
    return orders.filter(o => o.status === 'pending' || o.status === 'ثبت شده').length;
  }, [orders]);

  const weeklySaleProductsCount = useMemo(() => {
    return products.filter(p => !!p.weeklySaleActive).length;
  }, [products]);

  const bestsellersCount = useMemo(() => {
    return products.filter(p => !!p.isBestseller).length;
  }, [products]);

  const pendingSurplusCount = useMemo(() => {
    return products.filter(p => !!p.isSurplus && p.surplusStatus === 'pending').length;
  }, [products]);

  // Handle Clear Cache
  const handleClearCache = async () => {
    setIsClearingCache(true);
    try {
      await clearAllCaches();
      const status = await getCacheStatus();
      setCacheStatus(status);
      setSuccessMsg("حافظه کَش موقت و دیتابیس لوکال با موفقیت نوسازی شد.");
      if (onRefreshProducts) await onRefreshProducts();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (e: any) {
      setErrorMsg("خطا در پاکسازی حافظه کش: " + e.message);
    } finally {
      setIsClearingCache(false);
    }
  };

  // Handle Product Form Reset
  const handleResetProductForm = () => {
    setIsEditingProductId(null);
    setShowProductForm(false);
    setName("");
    setBrand("");
    setFactoryName("");
    setSupplierName("");
    setDescription("");
    setCategory(categoriesList[0] || "تنقلات و شکلات");
    setPrice(0);
    setBulkPrice(0);
    setConsumerPrice(0);
    setPurchasePrice(0);
    setCartonPackCount(24);
    setMinOrderCartons(5);
    setStockQuantityCartons(100);
    setImageUrl("");
    setUnit("بسته");
    setBadge("");
    setDiscountPercent(0);
    setIsFavorite(false);
    setIsFeatured(false);
    setIsBestseller(false);
    setBestsellerRank(1);
    setBestsellerMonthlySales(500);
    setBestsellerRepeatRate(85);
    setIsKafBazaar(false);
    setChequeAllowed(true);
    setHasHealthApple(false);
    setIsNatural(false);
    setIsOrganic(false);
    setHealthCertCode("");
    setProductTags("");
    setPackDescription("");
    setShippingOrigin("");
    setLeadTimeDays(2);
    setWeeklySaleActive(false);
    setWeeklySaleDiscount(15);
    setWeeklySaleDay("همه روزها");
    setWeeklySaleQuota(200);
  };

  // Handle JSON Catalog Importer Application
  const handleApplyJsonProducts = async (newItems: any[], importMode: 'merge' | 'replace') => {
    try {
      setLoading(true);
      let updatedCount = 0;
      let addedCount = 0;
      
      const currentProductsCopy = importMode === 'replace' ? [] : [...products];
      
      newItems.forEach((incItem: any, idx: number) => {
        const sku = incItem.sku || incItem.code || incItem.productCode || String(incItem.id) || `PRD-${idx + 1}`;
        const existingIdx = currentProductsCopy.findIndex(p => p.sku === sku || String(p.id) === String(incItem.id) || p.sku === String(incItem.id) || p.name === incItem.name);
        
        const rawImageUrl = incItem.imageUrl || incItem.image_url || incItem.image || incItem.pic || incItem.photo || incItem.picture || incItem.thumb || incItem.thumbnail || incItem.src;
        const processedImage = getDisplayImageUrl(rawImageUrl || incItem.imageUrl);
        
        const dastAvvalSellPrice = incItem.sellPrice || incItem.bulk_price || incItem.base_price || incItem.wholesalePrice || incItem.factoryPrice || 780000;
        const customerMarkup = b2bConfig?.customerMarkupPercent || 20;
        const customerPrice = Math.round(dastAvvalSellPrice * (1 + customerMarkup / 100));

        if (existingIdx >= 0) {
          currentProductsCopy[existingIdx] = {
            ...currentProductsCopy[existingIdx],
            name: incItem.name || incItem.title || currentProductsCopy[existingIdx].name,
            price: customerPrice || currentProductsCopy[existingIdx].price,
            bulk_price: dastAvvalSellPrice || currentProductsCopy[existingIdx].bulk_price,
            consumer_price: incItem.consumerPrice || incItem.consumer_price || incItem.retailPrice || incItem.market_price || currentProductsCopy[existingIdx].consumer_price,
            carton_pack_count: incItem.cartonPackCount || incItem.pack_count || incItem.pack_size || currentProductsCopy[existingIdx].carton_pack_count,
            stock_quantity_cartons: incItem.stockCartons || incItem.inventory || 10,
            min_order_cartons: incItem.minOrderCartons || incItem.moq || 1,
            min_stock_alert: incItem.minStockAlert || 5,
            unit: incItem.unit || incItem.measure || currentProductsCopy[existingIdx].unit || "عدد",
            image_url: processedImage || currentProductsCopy[existingIdx].image_url,
            category: incItem.category || incItem.group || incItem.cat || currentProductsCopy[existingIdx].category,
            brand: incItem.brand || incItem.manufacturer || currentProductsCopy[existingIdx].brand,
            sellerName: incItem.brand || incItem.manufacturer || currentProductsCopy[existingIdx].sellerName || "انبار دست اول",
            description: incItem.description || incItem.info || incItem.body || currentProductsCopy[existingIdx].description,
            updated_at: new Date().toLocaleDateString('fa-IR') + ' - ' + new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })
          } as Product;
          updatedCount++;
        } else {
          const newProd: Product = {
            id: String(sku),
            sku: sku,
            name: incItem.name || incItem.title || "محصول کاتالوگ",
            brand: incItem.brand || incItem.manufacturer || "انبار دست اول",
            category: incItem.category || incItem.group || "محصولات غذایی",
            price: customerPrice || 1100000,
            bulk_price: dastAvvalSellPrice || 1000000,
            consumer_price: incItem.consumerPrice || incItem.consumer_price || incItem.retailPrice || 1300000,
            carton_pack_count: incItem.cartonPackCount || incItem.pack_count || 1,
            min_order_cartons: incItem.minOrderCartons || incItem.moq || 1,
            stock_quantity_cartons: incItem.stockCartons || incItem.inventory || 10,
            min_stock_alert: incItem.minStockAlert || 5,
            unit: incItem.unit || incItem.measure || "عدد",
            sellerId: "factory-json",
            sellerName: incItem.brand || "انبار دست اول",
            production_lead_time_days: 1,
            image_url: processedImage,
            description: incItem.description || incItem.info || "واردشده از موتور هوشمند کاتالوگ‌ساز",
            updated_at: new Date().toLocaleDateString('fa-IR') + ' - ' + new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })
          } as Product;
          currentProductsCopy.unshift(newProd);
          addedCount++;
        }
      });

      if (onBulkUpdateProducts) {
        await onBulkUpdateProducts(currentProductsCopy);
      }
      setSuccessMsg(`بروزرسانی کاتالوگ با موفقیت انجام شد: ${addedCount} کالای جدید اضافه و ${updatedCount} کالا بروزرسانی شدند.`);
      setShowJsonCatalogModal(false);
    } catch (err: any) {
      setErrorMsg("خطا در همگام‌سازی کاتالوگ جیسون: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Open Edit Product Modal
  const handleEditProductClick = (p: Product) => {
    setIsEditingProductId(p.id);
    setName(p.name || "");
    setBrand(p.brand || "");
    setFactoryName(p.factoryName || "");
    setSupplierName(p.supplierName || "");
    setDescription(p.description || "");
    setCategory(p.category || categoriesList[0] || "تنقلات و شکلات");
    setPrice(p.price || 0);
    setBulkPrice(p.bulk_price || p.price || 0);
    setConsumerPrice(p.consumer_price || p.consumerPrice || 0);
    setDiscountPercent(p.discount_percent || p.discountPercent || 0);
    setPurchasePrice(p.purchase_price || 0);
    setCartonPackCount(p.carton_pack_count || 24);
    setMinOrderCartons(p.min_order_cartons || 5);
    setStockQuantityCartons(p.stock_quantity_cartons || 100);
    setImageUrl(p.image_url || "");
    setUnit(p.unit || "بسته");
    setBadge(p.badge || "");
    setIsFavorite(!!p.isFavorite);
    setIsFeatured(!!p.isFeatured);
    setIsBestseller(!!p.isBestseller);
    setBestsellerRank(p.bestsellerRank || 1);
    setBestsellerMonthlySales(p.bestsellerMonthlySales || 500);
    setBestsellerRepeatRate(p.bestsellerRepeatRate || 85);
    setIsKafBazaar(!!p.isKafBazaar);
    setChequeAllowed(p.chequeAllowed !== false);
    setHasHealthApple(!!p.hasHealthApple);
    setIsNatural(!!p.isNatural);
    setIsOrganic(!!p.isOrganic);
    setHealthCertCode(p.healthCertCode || "");
    setProductTags(p.tags && Array.isArray(p.tags) ? p.tags.join("، ") : "");
    setPackDescription(p.pack_description || "");
    setShippingOrigin(p.shipping_origin || "");
    setLeadTimeDays(p.production_lead_time_days || 2);
    setWeeklySaleActive(!!p.weeklySaleActive);
    setWeeklySaleDiscount(p.weeklySaleDiscount || 15);
    setWeeklySaleDay(p.weeklySaleDay || "همه روزها");
    setWeeklySaleQuota(p.weeklySaleQuota || 200);
    setShowProductForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle Product Save Submit
  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !bulkPrice) {
      setErrorMsg("لطفاً نام محصول و قیمت عمده را وارد نمایید.");
      return;
    }

    setLoading(true);
    const computedTags = productTags ? productTags.split(/[،,]/).map(t => t.trim()).filter(Boolean) : [];
    const discountVal = Number(weeklySaleDiscount) || 15;
    const computedWeeklyPrice = Math.round(Number(bulkPrice) * (1 - discountVal / 100));

    const matchedFactory = (b2bConfig?.factories || []).find((fac: any) => fac.name.trim() === factoryName.trim());
    const matchedSupplier = (suppliersList || []).find((sup: any) => (sup.companyName || sup.name || "").trim() === supplierName.trim());

    const payload: any = {
      name: name.trim(),
      brand: brand.trim() || "دست اول",
      factoryName: factoryName.trim() || "نامشخص",
      factoryId: matchedFactory ? matchedFactory.id : undefined,
      supplierName: supplierName.trim() || "نامشخص",
      supplierId: matchedSupplier ? matchedSupplier.id : undefined,
      description: description.trim() || "تامین مستقیم و بدون واسطه از کارخانجات همکار",
      category,
      price: Number(price) || Number(bulkPrice),
      bulk_price: Number(bulkPrice),
      consumer_price: Number(consumerPrice) || Math.round(Number(bulkPrice) * 1.3),
      consumerPrice: Number(consumerPrice) || Math.round(Number(bulkPrice) * 1.3),
      discount_percent: Number(discountPercent) || 0,
      discountPercent: Number(discountPercent) || 0,
      purchase_price: Number(purchasePrice) || 0,
      carton_pack_count: Number(cartonPackCount) || 24,
      min_order_cartons: Number(minOrderCartons) || 5,
      stock_quantity_cartons: Number(stockQuantityCartons) || 100,
      image_url: imageUrl || "https://images.unsplash.com/photo-1550547660-d9450f859349?w=500",
      unit: unit || "بسته",
      sellerId: "factory-central",
      sellerName: brand.trim() || "کارخانه همکار",
      production_lead_time_days: Number(leadTimeDays) || 2,
      badge,
      isFavorite,
      isFeatured,
      isBestseller: !!isBestseller,
      bestsellerRank: isBestseller ? Number(bestsellerRank) : undefined,
      bestsellerMonthlySales: isBestseller ? Number(bestsellerMonthlySales) : undefined,
      bestsellerRepeatRate: isBestseller ? Number(bestsellerRepeatRate) : undefined,
      isKafBazaar,
      chequeAllowed: !!chequeAllowed,
      hasHealthApple,
      isNatural,
      isOrganic,
      healthCertCode,
      weeklySaleActive: !!weeklySaleActive,
      weeklySaleDiscount: discountVal,
      weeklySaleDay: weeklySaleDay || "همه روزها",
      weeklySaleQuota: Number(weeklySaleQuota) || 200,
      weeklySalePrice: computedWeeklyPrice,
      tags: computedTags,
      pack_description: packDescription,
      shipping_origin: shippingOrigin
    };

    try {
      const targetProdData = {
        ...payload,
        id: isEditingProductId || undefined
      };

      if (isEditingProductId) {
        await onUpdateProduct(isEditingProductId, payload);
        setSuccessMsg("محصول با موفقیت به‌روزرسانی شد.");
      } else {
        await onAddProduct({
          ...payload,
          productCode: generateProductCode()
        });
        setSuccessMsg("محصول جدید با موفقیت به انبار مرکزی اضافه شد.");
      }

      // Auto broadcast to official announcement channel based on flags
      if (isKafBazaar) {
        postKafBazaarToChannel(targetProdData);
      } else if (isFeatured) {
        postSpecialOfferToChannel(targetProdData);
      } else if (weeklySaleActive) {
        postWeeklySaleToChannel(targetProdData);
      } else if (!isEditingProductId) {
        postNewProductToChannel(targetProdData);
      }

      handleResetProductForm();
      if (onRefreshProducts) await onRefreshProducts();
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err: any) {
      setErrorMsg("خطا در ذخیره‌سازی محصول: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Ad Status Update handler
  const handleUpdateAdStatus = async (adId: string, status: 'approved' | 'rejected' | 'pending', rejectionReason?: string) => {
    try {
      const strId = String(adId);
      
      const allAds = [...rawMaterialAds, ...equipmentAds, ...serviceAds, ...sponsoredAds];
      const targetAd = allAds.find(a => String(a.id) === strId);

      // Check which category ad belongs to:
      if (rawMaterialAds.some(a => String(a.id) === strId)) {
        const updated = rawMaterialAds.map(ad => {
          if (String(ad.id) === strId) {
            return {
              ...ad,
              status,
              isPendingApproval: status === 'pending',
              rejectionReason: rejectionReason || ad.rejectionReason,
              updatedAt: new Date().toISOString()
            };
          }
          return ad;
        });
        setRawMaterialAds(updated);
        localStorage.setItem("dastavval_raw_materials", JSON.stringify(updated));
        if (onUpdateB2bConfig && b2bConfig) {
          await onUpdateB2bConfig({ ...b2bConfig, rawMaterialAds: updated });
        }
      } else if (equipmentAds.some(a => String(a.id) === strId)) {
        const updated = equipmentAds.map(ad => {
          if (String(ad.id) === strId) {
            return {
              ...ad,
              status,
              isPendingApproval: status === 'pending',
              rejectionReason: rejectionReason || ad.rejectionReason,
              updatedAt: new Date().toISOString()
            };
          }
          return ad;
        });
        setEquipmentAds(updated);
        localStorage.setItem("dastavval_industrial_equipment", JSON.stringify(updated));
        if (onUpdateB2bConfig && b2bConfig) {
          await onUpdateB2bConfig({ ...b2bConfig, equipmentAds: updated });
        }
      } else if (serviceAds.some(a => String(a.id) === strId)) {
        const updated = serviceAds.map(ad => {
          if (String(ad.id) === strId) {
            return {
              ...ad,
              status,
              isPendingApproval: status === 'pending',
              rejectionReason: rejectionReason || ad.rejectionReason,
              updatedAt: new Date().toISOString()
            };
          }
          return ad;
        });
        setServiceAds(updated);
        localStorage.setItem("dastavval_industrial_services", JSON.stringify(updated));
        if (onUpdateB2bConfig && b2bConfig) {
          await onUpdateB2bConfig({ ...b2bConfig, serviceAds: updated });
        }
      } else {
        const updatedAds = sponsoredAds.map(ad => {
          if (String(ad.id) === strId) {
            return {
              ...ad,
              status,
              rejectionReason: rejectionReason || ad.rejectionReason,
              updatedAt: new Date().toISOString()
            };
          }
          return ad;
        });
        setSponsoredAds(updatedAds);
        localStorage.setItem("dastavval_sponsored_ads_v2", JSON.stringify(updatedAds));
        if (onUpdateB2bConfig && b2bConfig) {
          await onUpdateB2bConfig({ ...b2bConfig, sponsoredAds: updatedAds });
        }
      }

      window.dispatchEvent(new CustomEvent("dastavval_ads_updated"));

      // Trigger SMS to the ad owner
      if (targetAd && (status === 'approved' || status === 'rejected')) {
        const adPhone = targetAd.contactPhone || targetAd.creatorPhone || targetAd.phone || targetAd.mobile;
        if (adPhone) {
          try {
            fetch(getApiUrl("/api/sms/send-ad-status-sms"), {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                phone: adPhone,
                userName: targetAd.contactPerson || targetAd.factoryName || targetAd.name || "کاربر گرامی",
                adTitle: targetAd.title || targetAd.name || "آگهی شما",
                status,
                rejectionReason
              })
            }).catch(() => {});
          } catch (e) {}
        }
      }

      if (status === 'approved' && targetAd) {
        triggerAutoChannelPost(
          `📢 آگهی جدید: ${targetAd.title || targetAd.name || 'آگهی جدید'}`,
          `یک آگهی جدید با عنوان "${targetAd.title || targetAd.name || ''}" تایید و در تالار دست اول منتشر شد.\n\nتامین‌کننده: ${targetAd.factoryName || targetAd.brand || 'مشخص نشده'}\nتوضیحات: ${targetAd.description || 'درخواست خرید/فروش مستقیم.'}`,
          "info",
          "مشاهده آگهی",
          "#billboard"
        );
      }

      setSuccessMsg(status === 'approved' ? "آگهی با موفقیت تایید و در پلتفرم منتشر شد." : status === 'rejected' ? "آگهی رد شد و علت آن به کاربر اعلام گردید." : "وضعیت آگهی به در انتظار بررسی تغییر یافت.");
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (e: any) {
      setErrorMsg("خطا در به‌روزرسانی آگهی: " + e.message);
    }
  };

  // Edit Ad details handler
  const handleEditAd = async (adId: string, updatedFields: any) => {
    try {
      const strId = String(adId);

      if (rawMaterialAds.some(a => String(a.id) === strId)) {
        const updated = rawMaterialAds.map(ad => String(ad.id) === strId ? { ...ad, ...updatedFields, updatedAt: new Date().toISOString() } : ad);
        setRawMaterialAds(updated);
        localStorage.setItem("dastavval_raw_materials", JSON.stringify(updated));
        if (onUpdateB2bConfig && b2bConfig) await onUpdateB2bConfig({ ...b2bConfig, rawMaterialAds: updated });
      } else if (equipmentAds.some(a => String(a.id) === strId)) {
        const updated = equipmentAds.map(ad => String(ad.id) === strId ? { ...ad, ...updatedFields, updatedAt: new Date().toISOString() } : ad);
        setEquipmentAds(updated);
        localStorage.setItem("dastavval_industrial_equipment", JSON.stringify(updated));
        if (onUpdateB2bConfig && b2bConfig) await onUpdateB2bConfig({ ...b2bConfig, equipmentAds: updated });
      } else if (serviceAds.some(a => String(a.id) === strId)) {
        const updated = serviceAds.map(ad => String(ad.id) === strId ? { ...ad, ...updatedFields, updatedAt: new Date().toISOString() } : ad);
        setServiceAds(updated);
        localStorage.setItem("dastavval_industrial_services", JSON.stringify(updated));
        if (onUpdateB2bConfig && b2bConfig) await onUpdateB2bConfig({ ...b2bConfig, serviceAds: updated });
      } else {
        const updatedAds = sponsoredAds.map(ad => String(ad.id) === strId ? { ...ad, ...updatedFields, updatedAt: new Date().toISOString() } : ad);
        setSponsoredAds(updatedAds);
        localStorage.setItem("dastavval_sponsored_ads_v2", JSON.stringify(updatedAds));
        if (onUpdateB2bConfig && b2bConfig) await onUpdateB2bConfig({ ...b2bConfig, sponsoredAds: updatedAds });
      }

      window.dispatchEvent(new CustomEvent("dastavval_ads_updated"));

      setSuccessMsg("تغییرات آگهی با موفقیت اعمال گردید.");
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (e: any) {
      setErrorMsg("خطا در ویرایش آگهی: " + e.message);
    }
  };

  // Update order status
  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    try {
      const targetOrder = orders.find(o => o.id === orderId);
      if (targetOrder) {
        const updatedOrder = { ...targetOrder, status, updatedAt: new Date().toISOString() };
        await ResilientVault.saveOrder(updatedOrder);
        const updatedOrders = orders.map(o => o.id === orderId ? updatedOrder : o);
        setOrders(updatedOrders);
      } else {
        const updatedOrders = orders.map(o => o.id === orderId ? { ...o, status } : o);
        setOrders(updatedOrders);
        localStorage.setItem("dastavval_wholesale_orders", JSON.stringify(updatedOrders));
      }
      setSuccessMsg(`وضعیت سفارش ${orderId} با موفقیت به «${status}» تغییر یافت.`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (e: any) {
      setErrorMsg("خطا در تغییر وضعیت سفارش: " + e.message);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    try {
      setLoading(true);
      // 1. Delete from ResilientVault
      await ResilientVault.deleteOrder(orderId);

      // 2. Filter from state
      const nextOrders = orders.filter(o => o.id !== orderId && o.trackingNumber !== orderId);
      setOrders(nextOrders);

      // 3. Update localStorage as fallback
      localStorage.setItem("dastavval_wholesale_orders", JSON.stringify(nextOrders));
      localStorage.setItem("dastavval_orders_cache", JSON.stringify(nextOrders));
      localStorage.setItem("dastavval_raw_orders", JSON.stringify(nextOrders));

      // 4. Sync with server if endpoint exists
      try {
        await fetch(getApiUrl(`/api/b2b/orders/${orderId}`), { method: 'DELETE' });
      } catch (e) {}

      setSuccessMsg(`سفارش #${orderId} با موفقیت از سیستم حذف گردید.`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setErrorMsg("خطا در حذف سفارش: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBatchDeleteOrders = async (ids: string[]) => {
    try {
      setLoading(true);
      let successCount = 0;

      for (const id of ids) {
        try {
          await ResilientVault.deleteOrder(id);
          try {
            await fetch(getApiUrl(`/api/b2b/orders/${id}`), { method: 'DELETE' });
          } catch (e) {}
          successCount++;
        } catch (err) {}
      }

      const nextOrders = orders.filter(o => !ids.includes(o.id) && !ids.includes(o.trackingNumber));
      setOrders(nextOrders);

      localStorage.setItem("dastavval_wholesale_orders", JSON.stringify(nextOrders));
      localStorage.setItem("dastavval_orders_cache", JSON.stringify(nextOrders));
      localStorage.setItem("dastavval_raw_orders", JSON.stringify(nextOrders));

      setSuccessMsg(`${toPersianNum(successCount)} فاکتور با موفقیت حذف گردید.`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setErrorMsg("خطا در حذف گروهی سفارشات: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/60 pb-24 font-sans text-slate-800 antialiased" dir="rtl">
      {/* Top Banner & Control Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center justify-between w-full md:w-auto">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20 font-black">
                <Building2 size={22} />
              </div>
              <div>
                <h1 className="text-base font-black text-slate-900 leading-tight flex items-center gap-2">
                  <span>پیشخوان مدیریت ارشد دست اول</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-600 text-white border border-emerald-200">
                    نسخه جامع ۳.۰
                  </span>
                </h1>
                <p className="text-[11px] text-slate-500 font-bold">
                  مدیریت کالاها، آگهی‌های کف بازار، برنامه فروش هفتگی، سفارشات و تایید هوشمند
                </p>
              </div>
            </div>

            {onLogout && (
              <button
                onClick={onLogout}
                className="md:hidden p-2 text-emerald-600 bg-emerald-50 rounded-xl hover:bg-emerald-100 transition-colors"
                title="خروج از حساب مدیریت"
              >
                <LogOut size={18} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
            {/* Quick Actions */}
            <button
              onClick={handleClearCache}
              disabled={isClearingCache}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap shadow-2xs"
              title="نوسازی دیتابیس لوکال و حافظه کش"
            >
              <RefreshCw size={14} className={isClearingCache ? "animate-spin text-emerald-600" : ""} />
              <span>{isClearingCache ? "در حال پاکسازی..." : "نوسازی کش و داده‌ها"}</span>
            </button>

            {onRefreshProducts && (
              <button
                onClick={() => onRefreshProducts()}
                className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap shadow-2xs"
              >
                <Database size={14} />
                <span>همگام‌سازی انبار ({toPersianNum(products.length)} کالا)</span>
              </button>
            )}

            {onLogout && (
              <button
                onClick={onLogout}
                className="hidden md:flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap"
              >
                <LogOut size={14} />
                <span>خروج از پنل</span>
              </button>
            )}
          </div>
        </div>

        {/* Global Tab Navigation */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 overflow-x-auto custom-scrollbar border-t border-slate-100">
          <nav className="flex items-center gap-1 py-2 min-w-max">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === "dashboard"
                  ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/30"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Activity size={15} />
              <span>داشبورد و آمار</span>
            </button>

            <button
              onClick={() => setActiveTab("pending")}
              className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer relative ${
                activeTab === "pending"
                  ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/30"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <ShieldCheck size={15} />
              <span>پیشخوان تاییدها</span>
              {(pendingAdsCount + pendingOrdersCount) > 0 && (
                <span className="px-1.5 py-0.5 text-[9px] font-black rounded-full bg-emerald-500 text-white animate-pulse">
                  {toPersianNum(pendingAdsCount + pendingOrdersCount)}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("products")}
              className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === "products"
                  ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/30"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Package size={15} />
              <span>مدیریت محصولات</span>
              <span className="text-[10px] opacity-80">({toPersianNum(products.length)})</span>
            </button>

            <button
              onClick={() => setActiveTab("weekly_schedule")}
              className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === "weekly_schedule"
                  ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/30"
                  : "text-slate-600 hover:bg-slate-100 text-emerald-700 bg-emerald-50/50"
              }`}
            >
              <Flame size={15} className="text-emerald-500" />
              <span>برنامه فروش هفتگی</span>
              <span className="px-1.5 py-0.5 text-[9px] font-black rounded-full bg-emerald-100 text-emerald-700">
                {toPersianNum(weeklySaleProductsCount)}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("special_offers_manager")}
              className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === "special_offers_manager"
                  ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/30"
                  : "text-amber-850 bg-amber-50 hover:bg-amber-100 border border-amber-200/70"
              }`}
            >
              <Percent size={15} className="text-amber-600" />
              <span>تنظیمات پیشنهادات ویژه و آفرها</span>
              <span className="bg-amber-500 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full">سود و سقف تخفیف</span>
            </button>

            <button
              onClick={() => setActiveTab("coupons")}
              className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === "coupons"
                  ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/30"
                  : "text-amber-900 bg-amber-50/80 hover:bg-amber-100 border border-amber-300/80"
              }`}
            >
              <Ticket size={15} className="text-amber-600" />
              <span>مدیریت کوپن‌های تخفیف</span>
              <span className="bg-emerald-600 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full">درصدی و مبلغی</span>
            </button>

            <button
              onClick={() => setActiveTab("ads")}
              className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === "ads"
                  ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/30"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Megaphone size={15} />
              <span>آگهی‌ها و تالار معاملات</span>
              <span className="text-[10px] opacity-80">({toPersianNum(sponsoredAds.length)})</span>
            </button>

            <button
              onClick={() => setActiveTab("capacity_ads")}
              className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === "capacity_ads"
                  ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/30"
                  : "text-amber-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/50"
              }`}
            >
              <Megaphone size={15} className={activeTab === "capacity_ads" ? "text-white" : "text-emerald-600"} />
              <span>📢 ظرفیت خالی کارخانجات (OEM)</span>
              <span className="text-[10px] opacity-80">({toPersianNum(adminCapacityAds.length)})</span>
            </button>

            <button
              onClick={() => setActiveTab("barter")}
              className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === "barter"
                  ? "bg-teal-700 text-white shadow-sm shadow-teal-700/30"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Repeat size={15} />
              <span>🔄 تهاتر و معامله امن</span>
              <span className="text-[10px] opacity-80">({toPersianNum(barterDeals.length)})</span>
            </button>

            <button
              onClick={() => setActiveTab("orders")}
              className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === "orders"
                  ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/30"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <ShoppingCart size={15} />
              <span>سفارشات عمده</span>
              <span className="text-[10px] opacity-80">({toPersianNum(orders.length)})</span>
            </button>

            <button
              onClick={() => setActiveTab("rfqs")}
              className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === "rfqs"
                  ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/30"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Handshake size={15} />
              <span>استعلام قیمت و پروپوزال‌ها (RFQs)</span>
              <span className="text-[10px] opacity-80">({toPersianNum(rfqCount)})</span>
            </button>

            <button
              onClick={() => setActiveTab("crm")}
              className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === "crm"
                  ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/30"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Users size={15} />
              <span>باشگاه مشتریان (CRM)</span>
            </button>

            <button
              onClick={() => setActiveTab("users_management")}
              className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === "users_management"
                  ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/30"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <User size={15} />
              <span>مدیریت کاربران و خریداران</span>
            </button>

            <button
              onClick={() => setActiveTab("articles")}
              className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === "articles"
                  ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/30"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <BookOpen size={15} />
              <span>مجله و مقالات</span>
            </button>

            <button
              onClick={() => setActiveTab("reps")}
              className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === "reps"
                  ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/30"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Award size={15} />
              <span>نمایندگان و عاملیت‌ها</span>
            </button>

            <button
              onClick={() => setActiveTab("safebuy")}
              className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === "safebuy"
                  ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/30"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <ShieldCheck size={15} />
              <span>خرید امن (SafeBuy)</span>
            </button>

            <button
              onClick={() => setActiveTab("categories_manager")}
              className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === "categories_manager"
                  ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/30"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Layers size={15} />
              <span>مدیریت دسته‌بندی‌ها</span>
            </button>

            <button
              onClick={() => setActiveTab("brands_manager")}
              className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === "brands_manager"
                  ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/30"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Award size={15} />
              <span>مدیریت و ویرایش برندها</span>
              <span className="bg-emerald-500 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full">جدید</span>
            </button>

            <button
              onClick={() => setActiveTab("factories_manager")}
              className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === "factories_manager"
                  ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/30"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Building2 size={15} />
              <span>مدیریت کارخانجات</span>
              <span className="bg-amber-500 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full">جدید</span>
            </button>

            <button
              onClick={() => setActiveTab("tickets")}
              className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === "tickets"
                  ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/30"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <MessageSquare size={15} />
              <span>مرکز تیکت و پاسخگویی</span>
              <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-1.5 py-0.2 rounded-full">جدید</span>
            </button>

            <button
              onClick={() => setActiveTab("system")}
              className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === "system"
                  ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/30"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Settings size={15} />
              <span>تنظیمات و ووکامرس</span>
            </button>

            <button
              onClick={() => setActiveTab("channel_posts")}
              className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === "channel_posts"
                  ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/30"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Send size={15} />
              <span>کانال‌ها و شبکه‌ها</span>
            </button>

            <button
              onClick={() => setActiveTab("invoices")}
              className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === "invoices"
                  ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/30"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Receipt size={15} />
              <span>فاکتورها و مالیات</span>
            </button>

            <button
              onClick={() => setActiveTab("factory_audit")}
              className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === "factory_audit"
                  ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/30"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Building2 size={15} />
              <span>ممیزی کالای کارخانجات</span>
            </button>
          </nav>
        </div>
      </header>

      {/* Main Toast Notifications */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4">
        <AnimatePresence>
          {successMsg && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center justify-between gap-3 shadow-sm mb-4"
            >
              <div className="flex items-center gap-2.5">
                <CheckCircle className="text-emerald-600 shrink-0" size={18} />
                <p className="text-xs font-black">{successMsg}</p>
              </div>
              <button onClick={() => setSuccessMsg(null)} className="text-emerald-700 hover:text-emerald-900">
                <X size={16} />
              </button>
            </motion.div>
          )}

          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-4 bg-emerald-50 border border-emerald-200 text-rose-800 rounded-2xl flex items-center justify-between gap-3 shadow-sm mb-4"
            >
              <div className="flex items-center gap-2.5">
                <AlertCircle className="text-emerald-600 shrink-0" size={18} />
                <p className="text-xs font-black">{errorMsg}</p>
              </div>
              <button onClick={() => setErrorMsg(null)} className="text-emerald-700 hover:text-rose-900">
                <X size={16} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-4">
        {/* 1. DASHBOARD TAB */}
        {activeTab === "dashboard" && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Top Metric Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs space-y-2">
                <div className="flex justify-between items-center text-slate-400">
                  <span className="text-xs font-black">کل کالاهای فعال</span>
                  <Package size={18} className="text-emerald-600" />
                </div>
                <div className="text-2xl font-black text-slate-900">
                  {toPersianNum(products.length)}
                </div>
                <p className="text-[10px] text-slate-500 font-bold">
                  {toPersianNum(products.filter(p => !p.disabled).length)} کالا در دسترس خریداران
                </p>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs space-y-2">
                <div className="flex justify-between items-center text-slate-400">
                  <span className="text-xs font-black">فروش هفتگی کارخانجات</span>
                  <Flame size={18} className="text-emerald-600" />
                </div>
                <div className="text-2xl font-black text-emerald-600">
                  {toPersianNum(weeklySaleProductsCount)}
                </div>
                <p className="text-[10px] text-slate-500 font-bold">
                  کالای سهمیه‌ای با تخفیف طلایی
                </p>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs space-y-2">
                <div className="flex justify-between items-center text-slate-400">
                  <span className="text-xs font-black">آگهی‌های تالار معاملات</span>
                  <Megaphone size={18} className="text-emerald-600" />
                </div>
                <div className="text-2xl font-black text-slate-900">
                  {toPersianNum(sponsoredAds.length)}
                </div>
                <p className="text-[10px] text-emerald-600 font-bold">
                  {toPersianNum(pendingAdsCount)} آگهی جدید در انتظار تایید
                </p>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs space-y-2">
                <div className="flex justify-between items-center text-slate-400">
                  <span className="text-xs font-black">سفارشات عمده ثبت شده</span>
                  <ShoppingCart size={18} className="text-emerald-600" />
                </div>
                <div className="text-2xl font-black text-slate-900">
                  {toPersianNum(orders.length)}
                </div>
                <p className="text-[10px] text-slate-500 font-bold">
                  {toPersianNum(pendingOrdersCount)} سفارش جدید در انتظار اقدام
                </p>
              </div>
            </div>

            {/* Alerts Center Component */}
            <AdminAlertsCenter
              orders={orders}
              representativesList={representativesList}
              callbackRequests={callbackRequests}
              supportTickets={supportTickets}
              sponsoredAds={sponsoredAds}
              rawMaterialAds={rawMaterialAds}
              equipmentAds={equipmentAds}
              serviceAds={serviceAds}
              safeBuyRequests={safeBuyRequests}
              onNavigateTab={(tab) => setActiveTab(tab)}
              onRefresh={() => loadLocalData()}
            />

            {/* Sales Charts */}
            <AdminSalesCharts />
          </div>
        )}

        {/* 2. PENDING APPROVALS TAB */}
        {activeTab === "pending" && (
          <div className="animate-in fade-in duration-300">
            <AdminPendingApprovals
              orders={orders}
              onUpdateOrderStatus={handleUpdateOrderStatus}
              safeBuyRequests={safeBuyRequests}
              onUpdateSafeBuyStatus={async (id, fbId, status) => {
                const updated = safeBuyRequests.map(r => r.id === id ? { ...r, status } : r);
                setSafeBuyRequests(updated);
                localStorage.setItem("dastavval_safe_buy_requests", JSON.stringify(updated));
                setSuccessMsg("وضعیت درخواست خرید امن بروزرسانی شد.");
              }}
              sponsoredAds={sponsoredAds}
              rawMaterialAds={rawMaterialAds}
              equipmentAds={equipmentAds}
              serviceAds={serviceAds}
              onUpdateAdStatus={handleUpdateAdStatus}
              onEditAd={handleEditAd}
              barterDeals={barterDeals}
              onUpdateBarterStatus={(id, status) => {
                const updated = barterDeals.map(b => b.id === id ? { ...b, status } : b);
                setBarterDeals(updated);
                localStorage.setItem("dastavval_barter_deals", JSON.stringify(updated));
              }}
              representativesList={representativesList}
              onUpdateRepStatus={async (id, isApproved, badge) => {
                const newStatus = isApproved ? 'approved' : 'rejected';
                const updated = representativesList.map(r => (r.id === id || r.code === id) ? { ...r, status: newStatus, badge } : r);
                setRepresentativesList(updated);
                localStorage.setItem("dastavval_dealership_requests", JSON.stringify(updated));
                localStorage.setItem("dastavval_agency_requests", JSON.stringify(updated));

                if (isApproved) {
                  try {
                    const req = representativesList.find(r => r.id === id || r.code === id);
                    const phone = req?.phone || req?.mobile;
                    if (phone) {
                      const users = JSON.parse(localStorage.getItem('dastavval_local_users') || '[]');
                      const uIdx = users.findIndex((u: any) => u.phone === phone || u.mobile === phone || u.dealershipCode === id);
                      if (uIdx >= 0) {
                        users[uIdx].role = 'representative';
                        users[uIdx].isRepresentative = true;
                        users[uIdx].repApproved = true;
                        users[uIdx].dealershipStatus = 'approved';
                        users[uIdx].badge = badge || 'gold';
                        localStorage.setItem('dastavval_local_users', JSON.stringify(users));
                        const currentUser = JSON.parse(localStorage.getItem('dastavval_user') || '{}');
                        if (currentUser.phone === phone || currentUser.mobile === phone || currentUser.dealershipCode === id) {
                          localStorage.setItem('dastavval_user', JSON.stringify({ ...currentUser, ...users[uIdx] }));
                        }
                      }

                      // Also push to dastavval_representatives for public home page showcase
                      const savedReps = JSON.parse(localStorage.getItem('dastavval_representatives') || '[]');
                      const repExists = savedReps.find((r: any) => r.phone === phone || r.id === id);
                      const repObj = {
                        id: req?.id || `rep_${Date.now()}`,
                        name: req?.fullName || req?.name || 'نماینده رسمی',
                        company: req?.companyName || req?.company || 'عاملیت توزیع',
                        city: req?.city || 'تهران',
                        province: req?.province || 'تهران',
                        address: req?.address || `دفتر مرکزی توزیع در ${req?.city || 'استان'}`,
                        phone: phone,
                        tel: phone,
                        isApproved: true,
                        status: 'active',
                        badgeTitle: badge || 'نشان امین',
                        badgeLevel: badge === 'vip' ? 'vip' : badge === 'silver' ? 'silver' : 'gold',
                        agencyCode: req?.code || `AGN-1405-${Math.floor(1000 + Math.random() * 9000)}`,
                        brands: req?.brands || ['برندهای برتر دست اول']
                      };
                      if (repExists) {
                        const idx = savedReps.indexOf(repExists);
                        savedReps[idx] = { ...repExists, ...repObj, isApproved: true, status: 'active' };
                      } else {
                        savedReps.unshift(repObj);
                      }
                      localStorage.setItem('dastavval_representatives', JSON.stringify(savedReps));
                    }
                  } catch (e) {}
                }

                try {
                  await fetch(`/api/dealership-requests/${id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ status: newStatus, badge })
                  });
                } catch (e) {}
                setSuccessMsg(`درخواست نمایندگی ${isApproved ? 'با موفقیت تایید و پنل کاربر فعال گردید' : 'رد شد'}.`);
              }}
              suppliersList={suppliersList}
              onUpdateSupplierStatus={async (id, status) => {
                const updated = suppliersList.map(s => (s.id === id || s.email === id) ? { ...s, status } : s);
                setSuppliersList(updated);
                localStorage.setItem("dastavval_raw_suppliers", JSON.stringify(updated));

                const sup = suppliersList.find(s => s.id === id || s.email === id);
                if (sup) {
                  try {
                    const localFactories = JSON.parse(localStorage.getItem("dastavval_factories") || "[]");
                    const fIdx = localFactories.findIndex((f: any) => f.id === id || f.name === sup.company || f.name === sup.name);
                    if (fIdx >= 0) {
                      localFactories[fIdx].isActive = (status === 'active');
                      localFactories[fIdx].status = status;
                      if (status === 'active') {
                        localFactories[fIdx].isFirstHand = true;
                      }
                      localStorage.setItem("dastavval_factories", JSON.stringify(localFactories));
                    }
                    if (b2bConfig?.factories) {
                      const updatedFacs = b2bConfig.factories.map((f: any) => 
                        (f.id === id || f.name === sup.company || f.name === sup.name)
                          ? { ...f, isActive: status === 'active', status, isFirstHand: status === 'active' ? true : f.isFirstHand }
                          : f
                      );
                      await onUpdateB2bConfig({ ...b2bConfig, factories: updatedFacs });
                    }
                    window.dispatchEvent(new CustomEvent("dastavval_factories_updated"));
                  } catch (e) {}
                }
                setSuccessMsg(status === 'active' ? "کارخانه تایید و در سامانه سراسری فعال گردید." : "کارخانه به حالت تعلیق درآمد.");
              }}
              b2bConfig={b2bConfig}
              onUpdateB2bConfig={onUpdateB2bConfig}
              capacityAds={adminCapacityAds}
              onUpdateCapacityAdStatus={async (adId, status) => {
                handleAdminUpdateCapacityAd(adId, status);
              }}
              onUpdateProductStatus={async (id: string, isApproved: boolean, reason?: string) => {
                if (onBulkUpdateProducts) {
                  await onBulkUpdateProducts([id], {
                    approvalStatus: isApproved ? 'approved' : 'rejected',
                    isApproved,
                    rejectionReason: reason || undefined,
                    disabled: !isApproved
                  });
                } else {
                  await onUpdateProduct(id, {
                    approvalStatus: isApproved ? 'approved' : 'rejected',
                    isApproved,
                    rejectionReason: reason || undefined,
                    disabled: !isApproved
                  });
                }
                setSuccessMsg(isApproved ? "کالا تایید و در کاتالوگ منتشر شد." : "کالا رد شد.");
              }}
              callbackRequests={callbackRequests}
              onUpdateCallback={async (id, status) => {
                const updated = callbackRequests.map(c => c.id === id ? { ...c, status } : c);
                setCallbackRequests(updated);
                localStorage.setItem("dastavval_callback_requests", JSON.stringify(updated));
              }}
              supportTickets={supportTickets}
              onUpdateTicketStatus={async (id, status) => {
                const updated = supportTickets.map(t => t.id === id ? { ...t, status } : t);
                setSupportTickets(updated);
                localStorage.setItem("dastavval_tickets", JSON.stringify(updated));
              }}
              onNavigateTab={(tab) => setActiveTab(tab)}
              products={products}
              onDeleteProduct={onDeleteProduct}
            />
          </div>
        )}

        {/* 3. PRODUCTS MANAGEMENT TAB */}
        {activeTab === "products" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Action Bar */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-base font-black text-slate-900">بانک اطلاعات محصولات و انبار مرکزی</h2>
                  <p className="text-xs text-slate-500 font-bold">تعریف و مدیریت قیمت، موجودی کارتن، فروش چکی و برنامه فروش هفتگی</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowJsonCatalogModal(true)}
                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-black flex items-center gap-1.5 transition-all shadow-md shadow-blue-600/20 cursor-pointer"
                  >
                    <Repeat size={16} />
                    <span>بروز رسانی از کاتالوگ جیسون</span>
                  </button>

                  <button
                    onClick={() => {
                      handleResetProductForm();
                      setShowProductForm(true);
                    }}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-black flex items-center gap-1.5 transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
                  >
                    <Plus size={16} />
                    <span>افزودن محصول جدید</span>
                  </button>
                </div>
              </div>

              {/* Smart JSON Catalog Import Modal */}
              <SmartJsonCatalogModal
                isOpen={showJsonCatalogModal}
                onClose={() => setShowJsonCatalogModal(false)}
                onApplyProducts={handleApplyJsonProducts}
              />

              {/* Search & Sub-tabs */}
              <div className="flex flex-col md:flex-row gap-3 pt-2">
                <div className="flex-1 relative">
                  <Search className="absolute right-3.5 top-3 text-slate-400" size={16} />
                  <input
                    type="text"
                    value={productSearch}
                    onChange={e => setProductSearch(e.target.value)}
                    placeholder="جستجو در نام محصول، برند، کد کالا یا دسته‌بندی..."
                    className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold focus:bg-white transition-all text-slate-800"
                  />
                </div>

                <div className="flex items-center gap-2 overflow-x-auto">
                  <select
                    value={selectedCategory}
                    onChange={e => setSelectedCategory(e.target.value)}
                    className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-black text-slate-700"
                  >
                    <option value="all">همه دسته‌ها</option>
                    {categoriesList.map((cat: string, idx: number) => (
                      <option key={`cat-select-${idx}`} value={cat}>{cat}</option>
                    ))}
                  </select>

                  <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200">
                    <button
                      onClick={() => setProductViewMode("table")}
                      className={`p-2 rounded-xl text-xs font-black transition-all ${
                        productViewMode === "table" ? "bg-white text-emerald-600 shadow-2xs" : "text-slate-500"
                      }`}
                      title="نمایش جدولی"
                    >
                      <List size={16} />
                    </button>
                    <button
                      onClick={() => setProductViewMode("grid")}
                      className={`p-2 rounded-xl text-xs font-black transition-all ${
                        productViewMode === "grid" ? "bg-white text-emerald-600 shadow-2xs" : "text-slate-500"
                      }`}
                      title="نمایش کارت‌ها"
                    >
                      <Grid size={16} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Sub-Filter Tabs */}
              <div className="flex items-center gap-2 overflow-x-auto pt-2 border-t border-slate-100">
                <button
                  onClick={() => setActiveProductSubTab('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                    activeProductSubTab === 'all' ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  همه ({toPersianNum(products.length)})
                </button>
                <button
                  onClick={() => setActiveProductSubTab('weekly_sale')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1 ${
                    activeProductSubTab === 'weekly_sale' ? "bg-emerald-600 text-white" : "bg-emerald-600 text-white border border-emerald-200"
                  }`}
                >
                  <Flame size={12} />
                  <span>فروش هفتگی ({toPersianNum(weeklySaleProductsCount)})</span>
                </button>
                <button
                  onClick={() => setActiveProductSubTab('featured')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                    activeProductSubTab === 'featured' ? "bg-amber-500 text-white" : "bg-amber-50 text-amber-800 border border-amber-200"
                  }`}
                >
                  ⭐ فروش ویژه ({toPersianNum(products.filter(p => p.isFeatured).length)})
                </button>
                <button
                  onClick={() => setActiveProductSubTab('bestsellers')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1 ${
                    activeProductSubTab === 'bestsellers' ? "bg-indigo-600 text-white shadow-xs" : "bg-indigo-50 text-indigo-800 border border-indigo-200 hover:bg-indigo-100"
                  }`}
                >
                  <Trophy size={13} />
                  <span>پرفروش‌ترین بنکداری ({toPersianNum(bestsellersCount)})</span>
                </button>
                <button
                  onClick={() => setActiveProductSubTab('surplus')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1 ${
                    activeProductSubTab === 'surplus' ? "bg-rose-600 text-white shadow-xs" : "bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100"
                  }`}
                >
                  <TrendingDown size={13} />
                  <span>مازاد خط تولید کارخانجات ({toPersianNum(products.filter(p => p.isSurplus).length)}{pendingSurplusCount > 0 ? ` - ${toPersianNum(pendingSurplusCount)} در انتظار` : ''})</span>
                </button>
                <button
                  onClick={() => setActiveProductSubTab('kafbazaar')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                    activeProductSubTab === 'kafbazaar' ? "bg-emerald-600 text-white" : "bg-emerald-50 text-emerald-800 border border-emerald-200"
                  }`}
                >
                  📉 کف بازار ({toPersianNum(products.filter(p => p.isKafBazaar).length)})
                </button>
                <button
                  onClick={() => setActiveProductSubTab('low_stock')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                    activeProductSubTab === 'low_stock' ? "bg-orange-600 text-white" : "bg-orange-50 text-orange-700 border border-orange-200"
                  }`}
                >
                  ⚠️ کسری موجودی ({toPersianNum(products.filter(p => (p.stock_quantity_cartons || 0) < 15).length)})
                </button>
                <button
                  onClick={() => setActiveProductSubTab('disabled')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                    activeProductSubTab === 'disabled' ? "bg-slate-600 text-white" : "bg-slate-100 text-slate-500"
                  }`}
                >
                  🚫 غیرفعال ({toPersianNum(products.filter(p => p.disabled).length)})
                </button>
              </div>
            </div>

            {/* Product Add / Edit Modal */}
            <AnimatePresence>
              {showProductForm && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="bg-white p-6 sm:p-8 rounded-3xl border-2 border-emerald-500 shadow-xl space-y-6 relative"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-emerald-600 text-white rounded-xl">
                        <Package size={20} />
                      </div>
                      <h3 className="text-base font-black text-slate-900">
                        {isEditingProductId ? "ویرایش مشخصات کالا" : "ثبت محصول جدید در انبار دست اول"}
                      </h3>
                    </div>
                    <button
                      onClick={handleResetProductForm}
                      className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-all cursor-pointer"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  <form onSubmit={handleProductSubmit} className="space-y-6">
                    {/* 1. Identity & Basic Info */}
                    <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-slate-800 font-black text-xs">
                          <Tag size={15} className="text-emerald-600" />
                          <span>۱. هویت کالا، نام، برند و دسته‌بندی سفارشی و پویا</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setShowNewCategoryInline(!showNewCategoryInline)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-black transition-all flex items-center gap-1 cursor-pointer shadow-xs"
                          >
                            <FolderPlus size={13} />
                            <span>{showNewCategoryInline ? "بستن تعریف دسته" : "+ دسته‌بندی جدید / سفارشی"}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setActiveTab("categories_manager")}
                            className="px-2.5 py-1 bg-slate-200/80 hover:bg-slate-300 text-slate-700 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                          >
                            <Layers size={13} />
                            <span>مدیریت جامع دسته‌ها</span>
                          </button>
                        </div>
                      </div>

                      {/* Inline Dynamic Category Creator */}
                      <AnimatePresence>
                        {showNewCategoryInline && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-3"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-black text-emerald-950 flex items-center gap-1.5">
                                <Sparkles size={14} className="text-emerald-600" />
                                <span>ایجاد دسته‌بندی سفارشی و پویای جدید</span>
                              </span>
                              <span className="text-[10px] text-emerald-700 font-bold">بلافاصله در تمامی فرم‌ها و فیلترها فعال خواهد شد</span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              <div className="space-y-1 sm:col-span-2">
                                <label className="text-[11px] font-black text-emerald-900 block">عنوان دسته‌بندی سفارشی *</label>
                                <input
                                  type="text"
                                  value={newCatName}
                                  onChange={e => setNewCatName(e.target.value)}
                                  placeholder="مثلاً: لبنیات و پنیر، روغن‌های صنعتی، خشکبار، کارتن و بسته‌بندی"
                                  className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-xl text-xs font-black text-slate-800 focus:outline-none focus:border-emerald-500"
                                />
                              </div>

                              <div className="space-y-1">
                                <label className="text-[11px] font-black text-emerald-900 block">بخش مربوطه</label>
                                <select
                                  value={newCatType}
                                  onChange={e => setNewCatType(e.target.value)}
                                  className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
                                >
                                  <option value="product">کالاهای کارخانه‌ای</option>
                                  <option value="raw_material">مواد اولیه و شیمیایی</option>
                                  <option value="equipment">ماشین‌آلات و تجهیزات</option>
                                  <option value="service">خدمات و بسته‌بندی</option>
                                  <option value="barter">تهاتر کارخانه‌ای</option>
                                  <option value="general">عمومی</option>
                                </select>
                              </div>
                            </div>

                            {/* Quick Emoji Picker */}
                            <div className="space-y-1">
                              <div className="flex items-center justify-between">
                                <label className="text-[11px] font-black text-emerald-900">انتخاب نماد / ایموجی دسته:</label>
                                <span className="text-xs font-black text-emerald-800">نماد انتخابی: <span className="text-lg">{newCatEmoji}</span></span>
                              </div>
                              <div className="flex flex-wrap gap-1.5 p-2 bg-white rounded-xl border border-emerald-200 max-h-24 overflow-y-auto custom-scrollbar">
                                {['🍫', '🥛', '🛢️', '🥜', '🌾', '🧂', '🍾', '🧴', '🧼', '🥫', '🧪', '⚙️', '📦', '🔄', '🥩', '🧊', '🍯', '🍞', '🥤', '🍇', '☕', '🏷️', '✨', '🔥'].map(em => (
                                  <button
                                    key={`em-${em}`}
                                    type="button"
                                    onClick={() => setNewCatEmoji(em)}
                                    className={`w-7 h-7 rounded-lg text-sm flex items-center justify-center transition-all cursor-pointer ${
                                      newCatEmoji === em ? "bg-emerald-600 text-white shadow-xs scale-110" : "hover:bg-slate-100"
                                    }`}
                                  >
                                    {em}
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div className="flex items-center gap-2 pt-1">
                              <button
                                type="button"
                                onClick={() => handleAddInlineCategory()}
                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                              >
                                <Check size={14} />
                                <span>ثبت و انتخاب آنی دسته‌بندی</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setShowNewCategoryInline(false)}
                                className="px-3 py-2 bg-white text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-bold border border-slate-200 transition-all cursor-pointer"
                              >
                                انصراف
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
                        <div className="space-y-1 sm:col-span-2">
                          <label className="text-[11px] font-black text-slate-600 block">نام کامل محصول *</label>
                          <input
                            type="text"
                            required
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="مثلاً چیپس مزمز سرکه‌ای ۶۰ گرمی"
                            className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-black text-slate-800"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-black text-slate-600 block">برند تجاری محصول *</label>
                          <input
                            type="text"
                            required
                            value={brand}
                            onChange={e => setBrand(e.target.value)}
                            placeholder="مثلاً مزمز، چی‌توز، تبرک"
                            className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-black text-slate-800"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-black text-slate-600 flex items-center justify-between">
                            <span>دسته‌بندی پویا / سفارشی *</span>
                            <span className="text-[10px] text-emerald-600 font-bold">({detailedCategoriesList.length} دسته موجود)</span>
                          </label>
                          <select
                            value={category}
                            onChange={e => setCategory(e.target.value)}
                            className="w-full px-3.5 py-2 bg-white border border-emerald-300 rounded-xl text-xs font-black text-slate-800 focus:outline-none focus:border-emerald-500"
                          >
                            {detailedCategoriesList.map((c, idx: number) => (
                              <option key={`opt-cat-${idx}`} value={c.name}>
                                {c.emoji} {c.name} {c.isCustom ? "★" : ""}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Quick Chips for One-Click Category Selection */}
                      <div className="pt-2 border-t border-slate-200/60 flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] font-black text-slate-500">انتخاب سریع دسته:</span>
                        {detailedCategoriesList.slice(0, 10).map((c, cIdx) => (
                          <button
                            key={`chip-cat-${cIdx}`}
                            type="button"
                            onClick={() => setCategory(c.name)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                              category === c.name
                                ? "bg-emerald-600 text-white shadow-xs font-black"
                                : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
                            }`}
                          >
                            <span>{c.emoji}</span>
                            <span>{c.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 2. Supplier & Factory Connection */}
                    <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-blue-950 font-black text-xs">
                          <Building2 size={15} className="text-blue-600" />
                          <span>۲. اتصال به تأمین‌کننده، تعریف تأمین‌کننده و کارخانه تولیدکننده</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowNewSupplierInline(!showNewSupplierInline)}
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-black transition-all flex items-center gap-1 cursor-pointer shadow-xs"
                        >
                          <PlusCircle size={13} />
                          <span>{showNewSupplierInline ? "بستن فرم تعریف" : "+ تعریف تأمین‌کننده جدید"}</span>
                        </button>
                      </div>

                      {/* Inline Supplier Creation Form */}
                      <AnimatePresence>
                        {showNewSupplierInline && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="bg-white p-4 rounded-xl border-2 border-blue-400 space-y-3 overflow-hidden shadow-xs"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-black text-blue-900 flex items-center gap-1.5">
                                <Users size={14} className="text-blue-600" />
                                <span>ثبت سریع تامین‌کننده / بازرگانی جدید</span>
                              </span>
                              <span className="text-[10px] text-slate-400">پس از ثبت، به عنوان تامین‌کننده محصول انتخاب می‌شود</span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-600 block">نام شرکت / شخص تامین‌کننده *</label>
                                <input
                                  type="text"
                                  value={newSupName}
                                  onChange={e => setNewSupName(e.target.value)}
                                  placeholder="مثلاً بازرگانی پارس پخش"
                                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-600 block">شهر / موقعیت دفتر</label>
                                <input
                                  type="text"
                                  value={newSupLocation}
                                  onChange={e => setNewSupLocation(e.target.value)}
                                  placeholder="مثلاً تهران - بازار بزرگ"
                                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-600 block">شماره تماس / همراه</label>
                                <input
                                  type="text"
                                  value={newSupPhone}
                                  onChange={e => setNewSupPhone(e.target.value)}
                                  placeholder="مثلاً ۰۹۱۲۱۲۳۴۵۶۷"
                                  dir="ltr"
                                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-left"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-600 block">حوزه فعالیت</label>
                                <select
                                  value={newSupCategory}
                                  onChange={e => setNewSupCategory(e.target.value)}
                                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold"
                                >
                                  <option value="مواد غذایی و خوراکی">مواد غذایی و خوراکی</option>
                                  <option value="شوینده و بهداشتی">شوینده و بهداشتی</option>
                                  <option value="مواد اولیه کارخانجات">مواد اولیه کارخانجات</option>
                                  <option value="بسته‌بندی و چاپ">بسته‌بندی و چاپ</option>
                                  <option value="واردات و بازرگانی">واردات و بازرگانی</option>
                                </select>
                              </div>
                            </div>
                            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                              <button
                                type="button"
                                onClick={() => setShowNewSupplierInline(false)}
                                className="px-3 py-1 text-slate-500 hover:bg-slate-100 text-xs font-bold rounded-lg"
                              >
                                انصراف
                              </button>
                              <button
                                type="button"
                                onClick={handleAddInlineSupplier}
                                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-lg shadow-xs cursor-pointer flex items-center gap-1"
                              >
                                <Check size={13} />
                                <span>ثبت و اتصال تامین‌کننده</span>
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                        <div className="space-y-1">
                          <label className="text-[11px] font-black text-blue-900 block">
                            انتخاب یا نام تأمین‌کننده
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              list="suppliersDatalist"
                              value={supplierName}
                              onChange={e => setSupplierName(e.target.value)}
                              placeholder="انتخاب از لیست یا تایپ نام تامین‌کننده..."
                              className="w-full px-3.5 py-2 bg-white border border-blue-200 rounded-xl text-xs font-black text-slate-800"
                            />
                            <datalist id="suppliersDatalist">
                              {suppliersList.map((sup: any, sIdx: number) => (
                                <option key={`sup-opt-${sIdx}`} value={sup.companyName || sup.name}>
                                  {sup.companyName || sup.name} {sup.location ? `(${sup.location})` : ''}
                                </option>
                              ))}
                            </datalist>
                          </div>
                          <span className="text-[10px] text-slate-400 block">می‌توانید نام شرکت بازرگانی یا تامین‌کننده مجاز را وارد کنید</span>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-black text-blue-900 block">
                            نام کارخانه تولیدکننده (واحد صنعتی)
                          </label>
                          <input
                            type="text"
                            list="factoriesDatalist"
                            value={factoryName}
                            onChange={e => setFactoryName(e.target.value)}
                            placeholder="مثلاً کارخانجات صنعتی چی‌توز"
                            className="w-full px-3.5 py-2 bg-white border border-blue-200 rounded-xl text-xs font-black text-slate-800"
                          />
                          <datalist id="factoriesDatalist">
                            {(b2bConfig?.factories || []).map((fac: any, fIdx: number) => (
                              <option key={`fac-opt-${fIdx}`} value={fac.name}>
                                {fac.name} {fac.industrialPark ? `(${fac.industrialPark})` : (fac.province ? `(${fac.province})` : '')}
                              </option>
                            ))}
                          </datalist>
                          <span className="text-[10px] text-slate-400 block">نام مجتمع صنعتی تولیدی (انتخاب از بین کارخانه‌های ثبت‌شده)</span>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-black text-slate-700 block">واحد شمارش کالا</label>
                          <select
                            value={unit}
                            onChange={e => setUnit(e.target.value)}
                            className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                          >
                            <option value="بسته">بسته</option>
                            <option value="قوطی">قوطی</option>
                            <option value="بطری">بطری</option>
                            <option value="پاکت">پاکت</option>
                            <option value="کیلوگرم">کیلوگرم</option>
                            <option value="کارتن">کارتن</option>
                            <option value="عدل">عدل</option>
                          </select>
                          <span className="text-[10px] text-slate-400 block">واحد فروش جزء و محتویات هر کارتن</span>
                        </div>
                      </div>
                    </div>

                    {/* 3. Pricing, Packaging & Stock */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3.5 p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
                      <div className="space-y-1">
                        <label className="text-[11px] font-black text-emerald-900 block">قیمت عمده هر واحد (تومان) *</label>
                        <input
                          type="number"
                          required
                          value={bulkPrice || ""}
                          onChange={e => setBulkPrice(Number(e.target.value))}
                          placeholder="مثلاً ۳۲۰۰۰"
                          className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-xl text-xs font-mono font-black text-emerald-700"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-black text-slate-700 block">قیمت مصرف‌کننده (تومان)</label>
                        <input
                          type="number"
                          value={consumerPrice || ""}
                          onChange={e => setConsumerPrice(Number(e.target.value))}
                          placeholder="مثلاً ۴۵۰۰۰"
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-800"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-black text-rose-900 block">تخفیف مصوب خط (٪)</label>
                        <input
                          type="number"
                          min="0"
                          max="80"
                          value={discountPercent || ""}
                          onChange={e => setDiscountPercent(Number(e.target.value))}
                          placeholder="مثلاً ۱۵"
                          className="w-full px-3 py-2 bg-white border border-rose-300 rounded-xl text-xs font-mono font-bold text-rose-700 text-center"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-black text-slate-700 block">تعداد در هر کارتن *</label>
                        <input
                          type="number"
                          required
                          min="1"
                          value={cartonPackCount || ""}
                          onChange={e => setCartonPackCount(Number(e.target.value))}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-800 text-center"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-black text-slate-700 block">حداقل سفارش (کارتن) *</label>
                        <input
                          type="number"
                          required
                          min="1"
                          value={minOrderCartons || ""}
                          onChange={e => setMinOrderCartons(Number(e.target.value))}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-800 text-center"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-black text-slate-700 block">موجودی انبار (کارتن) *</label>
                        <input
                          type="number"
                          required
                          value={stockQuantityCartons || ""}
                          onChange={e => setStockQuantityCartons(Number(e.target.value))}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-800 text-center"
                        />
                      </div>
                    </div>

                    {/* 4. Shipping Origin, Warehouse & Logistics */}
                    <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-200/70 space-y-3">
                      <div className="flex items-center gap-2 text-amber-950 font-black text-xs">
                        <Truck size={15} className="text-amber-600" />
                        <span>۳. مبدأ بارگیری، انبار و لجستیک ارسال</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                        <div className="space-y-1 sm:col-span-2">
                          <label className="text-[11px] font-black text-amber-950 block">مبدأ بارگیری و انبار ارسال</label>
                          <input
                            type="text"
                            value={shippingOrigin}
                            onChange={e => setShippingOrigin(e.target.value)}
                            placeholder="مثلاً انبار مرکزی تهران (شورآباد) یا درب کارخانه تبریز"
                            className="w-full px-3.5 py-2 bg-white border border-amber-200 rounded-xl text-xs font-bold text-slate-800"
                          />
                          {/* Quick Warehouse Chips */}
                          <div className="flex flex-wrap items-center gap-1.5 pt-1">
                            <span className="text-[10px] text-amber-900 font-bold">پیشنهاد سریع:</span>
                            {[
                              "انبار مرکزی تهران (شورآباد)",
                              "درب کارخانه مبدأ",
                              "انبار تبریز (شهرک سلیمی)",
                              "انبار اصفهان (محمودآباد)",
                              "انبار مشهد (شهرک چناران)",
                              "انبار البرز (کرج - اشتهارد)",
                              "انبار شیراز"
                            ].map((wName, wIdx) => (
                              <button
                                key={`w-chip-${wIdx}`}
                                type="button"
                                onClick={() => setShippingOrigin(wName)}
                                className="px-2 py-0.5 bg-white hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-md text-[10px] font-bold transition-all cursor-pointer"
                              >
                                {wName}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-black text-amber-950 block">زمان آماده‌سازی و بارگیری (روز)</label>
                          <input
                            type="number"
                            min="1"
                            max="30"
                            value={leadTimeDays}
                            onChange={e => setLeadTimeDays(Number(e.target.value))}
                            className="w-full px-3 py-2 bg-white border border-amber-200 rounded-xl text-xs font-mono font-bold text-slate-800 text-center"
                          />
                          <div className="flex items-center gap-1 pt-1">
                            {[
                              { label: "تحویل فوری", val: 1 },
                              { label: "۲ روز کاری", val: 2 },
                              { label: "۳ روز", val: 3 },
                              { label: "۵ روز", val: 5 }
                            ].map((lt, ltIdx) => (
                              <button
                                key={`lt-chip-${ltIdx}`}
                                type="button"
                                onClick={() => setLeadTimeDays(lt.val)}
                                className="flex-1 py-0.5 bg-white hover:bg-amber-100 text-amber-900 border border-amber-200 rounded text-[9px] font-bold"
                              >
                                {lt.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 5. Keywords, SEO Tags, Descriptions & Packaging Details */}
                    <div className="bg-purple-50/50 p-4 rounded-2xl border border-purple-100 space-y-3">
                      <div className="flex items-center gap-2 text-purple-950 font-black text-xs">
                        <Hash size={15} className="text-purple-600" />
                        <span>۴. کلیدواژه‌ها، برچسب‌های سئو و مشخصات بسته‌بندی</span>
                      </div>
                      
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-black text-purple-900 block">
                          کلیدواژه‌ها و برچسب‌های جستجو (با ویرگول «،» جدا کنید)
                        </label>
                        <input
                          type="text"
                          value={productTags}
                          onChange={e => setProductTags(e.target.value)}
                          placeholder="مثلاً خرید عمده، قیمت کارخانه، ارسال سریع، تنقلات، چیپس، مزمز"
                          className="w-full px-3.5 py-2 bg-white border border-purple-200 rounded-xl text-xs font-bold text-slate-800"
                        />
                        {/* Quick Tag Chips */}
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          <span className="text-[10px] text-purple-900 font-bold">برچسب‌های آماده:</span>
                          {[
                            "خرید عمده",
                            "قیمت کارخانه",
                            "ارسال سراسری",
                            "بدون واسطه",
                            "تخفیف ویژه",
                            "کف بازار",
                            "تسویه چکی و نقدی",
                            "پرفروش",
                            "سهمیه بنکداری"
                          ].map((tagItem, tagIdx) => (
                            <button
                              key={`tag-chip-${tagIdx}`}
                              type="button"
                              onClick={() => {
                                const current = productTags ? productTags.split(/[،,]/).map(t => t.trim()).filter(Boolean) : [];
                                if (!current.includes(tagItem)) {
                                  const updated = [...current, tagItem].join("، ");
                                  setProductTags(updated);
                                }
                              }}
                              className="px-2 py-0.5 bg-white hover:bg-purple-100 text-purple-900 border border-purple-200 rounded-md text-[10px] font-bold transition-all cursor-pointer"
                            >
                              + {tagItem}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div className="space-y-1">
                          <label className="text-[11px] font-black text-purple-900 block">مشخصات بسته‌بندی و کارتن</label>
                          <input
                            type="text"
                            value={packDescription}
                            onChange={e => setPackDescription(e.target.value)}
                            placeholder="مثلاً هر کارتن شامل ۲۴ بسته، وزن ناخالص ۲.۴ کیلوگرم، ابعاد ۳۰×۲۰×۱۵"
                            className="w-full px-3.5 py-2 bg-white border border-purple-200 rounded-xl text-xs font-bold text-slate-800"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-black text-purple-900 block">توضیحات تکمیلی محصول و شرایط فروش</label>
                          <input
                            type="text"
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="توضیحات کوتاه جهت نمایش به خریداران در صفحه محصول..."
                            className="w-full px-3.5 py-2 bg-white border border-purple-200 rounded-xl text-xs font-bold text-slate-800"
                          />
                        </div>
                      </div>

                      {/* Health & Quality Flags */}
                      <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-purple-100/80">
                        <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-emerald-900 bg-white px-3 py-1.5 rounded-xl border border-emerald-200">
                          <input
                            type="checkbox"
                            checked={hasHealthApple}
                            onChange={e => setHasHealthApple(e.target.checked)}
                            className="w-4 h-4 rounded text-emerald-600"
                          />
                          <span>🍏 نشان سیب سلامت غذا و دارو</span>
                        </label>

                        <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-emerald-900 bg-white px-3 py-1.5 rounded-xl border border-emerald-200">
                          <input
                            type="checkbox"
                            checked={isNatural}
                            onChange={e => setIsNatural(e.target.checked)}
                            className="w-4 h-4 rounded text-emerald-600"
                          />
                          <span>🌿 ۱۰۰٪ طبیعی</span>
                        </label>

                        <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-emerald-900 bg-white px-3 py-1.5 rounded-xl border border-emerald-200">
                          <input
                            type="checkbox"
                            checked={isOrganic}
                            onChange={e => setIsOrganic(e.target.checked)}
                            className="w-4 h-4 rounded text-emerald-600"
                          />
                          <span>🌾 ارگانیک</span>
                        </label>

                        <div className="flex items-center gap-2">
                          <label className="text-[11px] font-bold text-slate-600">کد پروانه سلامت:</label>
                          <input
                            type="text"
                            value={healthCertCode}
                            onChange={e => setHealthCertCode(e.target.value)}
                            placeholder="مثلاً ۱۶/۱۲۳۴۵"
                            dir="ltr"
                            className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-mono text-left w-28"
                          />
                        </div>
                      </div>
                    </div>

                    {/* 6. Weekly Sales Program Box */}
                    <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200 space-y-3">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          id="weeklySaleToggle"
                          checked={weeklySaleActive}
                          onChange={e => setWeeklySaleActive(e.target.checked)}
                          className="w-5 h-5 rounded-lg border-rose-300 text-emerald-600 focus"
                        />
                        <label htmlFor="weeklySaleToggle" className="text-xs font-black text-rose-950 cursor-pointer select-none flex items-center gap-1.5">
                          <span>🔥 حضور در «برنامه فروش و حراج هفتگی کارخانجات»</span>
                          <span className="text-[10px] text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full font-bold">تخفیف سهمیه‌ای ویژه خریداران عمده</span>
                        </label>
                      </div>

                      {weeklySaleActive && (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-emerald-200/60">
                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-rose-900 block">درصد تخفیف حراج هفتگی (٪):</label>
                            <input
                              type="number"
                              min="1"
                              max="90"
                              value={weeklySaleDiscount}
                              onChange={e => setWeeklySaleDiscount(Number(e.target.value))}
                              className="w-full px-3 py-2 bg-white border border-rose-300 rounded-xl text-xs font-mono font-black text-emerald-700 text-center"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-rose-900 block">روز عرضه در هفته:</label>
                            <select
                              value={weeklySaleDay}
                              onChange={e => setWeeklySaleDay(e.target.value)}
                              className="w-full px-3 py-2 bg-white border border-rose-300 rounded-xl text-xs font-bold text-slate-800"
                            >
                              <option value="همه روزها">همه روزهای هفته</option>
                              <option value="شنبه">شنبه (تنقلات و کیک)</option>
                              <option value="یکشنبه">یکشنبه (شوینده و بهداشتی)</option>
                              <option value="دوشنبه">دوشنبه (کنسرو و روغن)</option>
                              <option value="سه‌شنبه">سه‌شنبه (لبنیات و نوشیدنی)</option>
                              <option value="چهارشنبه">چهارشنبه (شیرینی و قهوه)</option>
                              <option value="پنجشنبه">پنجشنبه و جمعه (حراج آخر هفته)</option>
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-rose-900 block">سهمیه تخفیف (کارتن):</label>
                            <input
                              type="number"
                              min="5"
                              value={weeklySaleQuota}
                              onChange={e => setWeeklySaleQuota(Number(e.target.value))}
                              className="w-full px-3 py-2 bg-white border border-rose-300 rounded-xl text-xs font-mono font-bold text-slate-800 text-center"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 7. Image URL & Upload */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-black text-slate-600 block">لینک یا آپلود تصویر محصول</label>
                        <label className="cursor-pointer text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg hover:bg-emerald-100 transition-all flex items-center gap-1.5">
                          <Upload size={12} />
                          <span>انتخاب تصویر از کامپیوتر / موبایل</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setLoading(true);
                                const result = await uploadToParsPackStorage(file, "products");
                                setLoading(false);
                                if (result.success && result.url) {
                                  setImageUrl(result.url);
                                  setSuccessMsg("تصویر محصول با موفقیت آپلود شد.");
                                  setTimeout(() => setSuccessMsg(null), 3000);
                                } else {
                                  setErrorMsg(result.error || "خطا در آپلود عکس");
                                }
                              }
                            }}
                          />
                        </label>
                      </div>
                      <input
                        type="text"
                        value={imageUrl}
                        onChange={e => setImageUrl(e.target.value)}
                        placeholder="https://..."
                        dir="ltr"
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono text-slate-800 text-left"
                      />
                    </div>

                    {/* 8. Feature Checkboxes */}
                    <div className="space-y-3 pt-2">
                      <div className="flex flex-wrap items-center gap-4">
                        <label className="flex items-center gap-2 cursor-pointer text-xs font-black text-indigo-950 bg-indigo-50/70 p-2.5 rounded-xl border border-indigo-200">
                          <input
                            type="checkbox"
                            checked={chequeAllowed}
                            onChange={e => setChequeAllowed(e.target.checked)}
                            className="w-4 h-4 rounded text-indigo-600"
                          />
                          <span>💳 تسویه چکی مجاز است (۵۰٪ نقد + ۵۰٪ چک صیادی)</span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer text-xs font-black text-amber-950 bg-amber-50/70 p-2.5 rounded-xl border border-amber-200">
                          <input
                            type="checkbox"
                            checked={isFeatured}
                            onChange={e => setIsFeatured(e.target.checked)}
                            className="w-4 h-4 rounded text-amber-600"
                          />
                          <span>⭐ نمایش در بخش فروش ویژه صفحه اول</span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer text-xs font-black text-indigo-950 bg-indigo-50/70 p-2.5 rounded-xl border border-indigo-300">
                          <input
                            type="checkbox"
                            checked={isBestseller}
                            onChange={e => setIsBestseller(e.target.checked)}
                            className="w-4 h-4 rounded text-indigo-600"
                          />
                          <span className="flex items-center gap-1">
                            <Trophy size={14} className="text-indigo-600" />
                            <span>انتخاب به عنوان «پرفروش‌ترین بنکداری و بازار»</span>
                          </span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer text-xs font-black text-emerald-950 bg-emerald-50/70 p-2.5 rounded-xl border border-emerald-200">
                          <input
                            type="checkbox"
                            checked={isKafBazaar}
                            onChange={e => setIsKafBazaar(e.target.checked)}
                            className="w-4 h-4 rounded text-emerald-600"
                          />
                          <span>🔥 افزودن به «کف بازار» (قیمت زیرکارخانه)</span>
                        </label>
                      </div>

                      {/* Bestseller extra fields */}
                      {isBestseller && (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-indigo-50/80 rounded-2xl border border-indigo-200 animate-in fade-in duration-200">
                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-indigo-900 block">رتبه در پرفروش‌ها (۱ تا ۲۰):</label>
                            <input
                              type="number"
                              min="1"
                              max="20"
                              value={bestsellerRank}
                              onChange={e => setBestsellerRank(Number(e.target.value))}
                              className="w-full px-3 py-1.5 bg-white border border-indigo-300 rounded-xl text-xs font-mono font-black text-indigo-900 text-center"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-indigo-900 block">تیراژ فروش ۳۰ روز اخیر (کارتن):</label>
                            <input
                              type="number"
                              min="10"
                              value={bestsellerMonthlySales}
                              onChange={e => setBestsellerMonthlySales(Number(e.target.value))}
                              className="w-full px-3 py-1.5 bg-white border border-indigo-300 rounded-xl text-xs font-mono font-black text-indigo-900 text-center"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-indigo-900 block">نرخ سفارش مجدد مغازه‌داران (٪):</label>
                            <input
                              type="number"
                              min="1"
                              max="100"
                              value={bestsellerRepeatRate}
                              onChange={e => setBestsellerRepeatRate(Number(e.target.value))}
                              className="w-full px-3 py-1.5 bg-white border border-indigo-300 rounded-xl text-xs font-mono font-black text-indigo-900 text-center"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Submit Buttons */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={handleResetProductForm}
                        className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black rounded-xl cursor-pointer"
                      >
                        انصراف
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl cursor-pointer shadow-md shadow-emerald-600/20 flex items-center gap-2"
                      >
                        <Save size={16} />
                        <span>{loading ? "در حال ذخیره..." : isEditingProductId ? "به‌روزرسانی کالا" : "ثبت و تایید نهایی کالا"}</span>
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Bulk Actions Bar */}
            <AnimatePresence>
              {selectedProductIds.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mb-4 bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-black">
                      ✓
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-black text-slate-800">
                        {toPersianNum(selectedProductIds.length)} کالا انتخاب شده است
                      </span>
                      <p className="text-[10px] text-slate-500 font-bold">می‌توانید عملیات گروهی زیر را روی این کالاها اعمال کنید.</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
                    <button
                      onClick={() => handleBulkToggleDisable(false)}
                      className="px-3 py-2 bg-white hover:bg-emerald-100/50 text-emerald-800 text-xs font-black rounded-xl border border-emerald-200 transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      🔓 فعال‌سازی گروهی
                    </button>
                    <button
                      onClick={() => handleBulkToggleDisable(true)}
                      className="px-3 py-2 bg-white hover:bg-emerald-100/50 text-slate-700 text-xs font-black rounded-xl border border-slate-200 transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      🔒 غیرفعال‌سازی گروهی
                    </button>
                    <button
                      onClick={() => setShowBulkPriceModal(true)}
                      className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
                    >
                      ✏️ ویرایش قیمت
                    </button>
                    <button
                      onClick={() => setShowBulkStockModal(true)}
                      className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
                    >
                      📦 ویرایش موجودی
                    </button>
                    <button
                      onClick={handleBulkDelete}
                      className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-black rounded-xl border border-rose-200 transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      🗑️ حذف گروهی
                    </button>
                    <button
                      onClick={() => setSelectedProductIds([])}
                      className="px-2.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-black rounded-xl transition-all cursor-pointer"
                    >
                      انصراف
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Products Table View */}
            {productViewMode === "table" ? (
              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-black">
                      <tr>
                        <th className="py-3 px-3 w-10 text-center">
                          <input
                            type="checkbox"
                            checked={filteredProducts.length > 0 && selectedProductIds.length === filteredProducts.length}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedProductIds(filteredProducts.map(p => p.id));
                              } else {
                                setSelectedProductIds([]);
                              }
                            }}
                            className="w-4.5 h-4.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                          />
                        </th>
                        <th className="py-3 px-3">کالا / تصویر</th>
                        <th className="py-3 px-3">تأمین‌کننده / کارخانه / مبدأ بارگیری</th>
                        <th className="py-3 px-3">دسته‌بندی و برند</th>
                        <th className="py-3 px-3 text-center">قیمت عمده (تومان)</th>
                        <th className="py-3 px-3 text-center">موجودی</th>
                        <th className="py-3 px-3 text-center min-w-[210px]">نشان‌ها و دسترسی سریع (یک‌کلیک)</th>
                        <th className="py-3 px-3 text-center">عملیات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-bold text-slate-800">
                      {filteredProducts.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-12 text-center text-slate-400 font-bold">
                            هیچ محصولی با معیارهای جستجو یافت نشد.
                          </td>
                        </tr>
                      ) : (
                        filteredProducts.map((p, idx) => (
                          <tr 
                            key={`prod-row-${p.id || idx}-${idx}`} 
                            className={`transition-colors ${p.disabled ? 'opacity-60 bg-slate-50/50' : ''} ${selectedProductIds.includes(p.id) ? 'bg-emerald-50/30 hover:bg-emerald-50/50' : 'hover:bg-slate-50/80'}`}
                          >
                            <td className="py-3 px-3 text-center">
                              <input
                                type="checkbox"
                                checked={selectedProductIds.includes(p.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedProductIds(prev => [...prev, p.id]);
                                  } else {
                                    setSelectedProductIds(prev => prev.filter(id => id !== p.id));
                                  }
                                }}
                                className="w-4.5 h-4.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                              />
                            </td>
                            <td className="py-3 px-3">
                              <div className="flex items-center gap-2.5">
                                <img
                                  src={getDisplayImageUrl(p.image_url)}
                                  alt={p.name}
                                  className="w-11 h-11 rounded-xl object-cover border border-slate-200 shrink-0"
                                  onError={(e) => { e.currentTarget.src = "https://images.unsplash.com/photo-1550547660-d9450f859349?w=200"; }}
                                />
                                <div>
                                  <h4 className="font-black text-slate-900 line-clamp-1 text-xs">{p.name}</h4>
                                  <span className="text-[10px] text-slate-400 font-mono">{p.productCode || p.id}</span>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-3">
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-1 text-[11px] font-black text-blue-900">
                                  <Users size={11} className="text-blue-600 shrink-0" />
                                  <span className="line-clamp-1">{p.supplierName || "تأمین‌کننده مرکزی"}</span>
                                </div>
                                <div className="text-[10px] text-slate-500 flex items-center gap-1">
                                  <Building2 size={10} className="text-slate-400 shrink-0" />
                                  <span className="line-clamp-1">{p.factoryName || p.brand || "کارخانه همکار"}</span>
                                </div>
                                {p.shipping_origin && (
                                  <div className="text-[9px] text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100 flex items-center gap-1 w-fit">
                                    <MapPin size={9} className="text-amber-600 shrink-0" />
                                    <span className="line-clamp-1">{p.shipping_origin}</span>
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-3">
                              <div>
                                <span className="font-black text-slate-800 block">{p.brand}</span>
                                <span className="text-[10px] text-slate-400">{p.category}</span>
                              </div>
                            </td>
                            <td className="py-3 px-3 text-center font-mono font-black text-emerald-600">
                              <div>{(p.bulk_price || p.price || 0).toLocaleString()}</div>
                              <span className="text-[9px] text-slate-400 font-normal">کارتن: {((p.bulk_price || p.price || 0) * (p.carton_pack_count || 1)).toLocaleString()}</span>
                            </td>
                            <td className="py-3 px-3 text-center font-mono">
                              <span className={(p.stock_quantity_cartons || 0) < 15 ? "text-rose-600 font-black" : "text-slate-800"}>
                                {toPersianNum(p.stock_quantity_cartons)} کارتن
                              </span>
                            </td>

                            {/* Quick Action Icons & Flag Toggles */}
                            <td className="py-3 px-3 text-center">
                              {/* If Pending Surplus Approval */}
                              {p.isSurplus && p.surplusStatus === 'pending' ? (
                                <div className="flex items-center justify-center gap-1.5 p-1 bg-rose-50 border border-rose-200 rounded-xl">
                                  <div className="text-right">
                                    <span className="text-[10px] font-black text-rose-800 block">مازاد خط کارخانه ({toPersianNum(p.surplusQuantityCartons || p.stock_quantity_cartons || 50)} کارتن)</span>
                                    <span className="text-[9px] text-rose-600 font-bold">تخفیف ٪{toPersianNum(p.surplusDiscountPercent || p.discountPercent || 20)}</span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleApproveSurplus(p, true)}
                                    className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-black cursor-pointer shadow-xs"
                                    title="تایید و انتشار در سایت و کانال"
                                  >
                                    تایید
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleApproveSurplus(p, false)}
                                    className="px-1.5 py-1 bg-slate-200 hover:bg-rose-100 text-slate-700 hover:text-rose-700 rounded-lg text-[10px] font-bold cursor-pointer"
                                    title="رد پیشنهاد مازاد"
                                  >
                                    رد
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center justify-center gap-1 flex-wrap">
                                  {/* 1. Featured Star */}
                                  <button
                                    type="button"
                                    onClick={() => handleQuickToggleProductFlag(p, 'isFeatured')}
                                    title={p.isFeatured ? "ویژه صفحه اول (فعال) - برای لغو کلیک کنید" : "ویژه کردن کالا در صفحه اول"}
                                    className={`p-1.5 rounded-lg border transition-all cursor-pointer flex items-center gap-0.5 text-[10px] font-black ${
                                      p.isFeatured
                                        ? "bg-amber-400 text-amber-950 border-amber-500 shadow-xs ring-1 ring-amber-300"
                                        : "bg-slate-50 text-slate-400 border-slate-200 hover:bg-amber-50 hover:text-amber-600 hover:border-amber-300"
                                    }`}
                                  >
                                    <Star size={12} className={p.isFeatured ? "fill-amber-950" : ""} />
                                    <span>ویژه</span>
                                  </button>

                                  {/* 2. Bestseller Trophy */}
                                  <button
                                    type="button"
                                    onClick={() => handleQuickToggleProductFlag(p, 'isBestseller')}
                                    title={p.isBestseller ? "پرفروش‌ترین (فعال) - برای لغو کلیک کنید" : "انتخاب به عنوان پرفروش‌ترین بنکداری"}
                                    className={`p-1.5 rounded-lg border transition-all cursor-pointer flex items-center gap-0.5 text-[10px] font-black ${
                                      p.isBestseller
                                        ? "bg-indigo-600 text-white border-indigo-700 shadow-xs ring-1 ring-indigo-300"
                                        : "bg-slate-50 text-slate-400 border-slate-200 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-300"
                                    }`}
                                  >
                                    <Trophy size={12} />
                                    <span>پرفروش</span>
                                  </button>

                                  {/* 3. Kaf Bazaar Flame */}
                                  <button
                                    type="button"
                                    onClick={() => handleQuickToggleProductFlag(p, 'isKafBazaar')}
                                    title={p.isKafBazaar ? "کف بازار (فعال) - برای خروج کلیک کنید" : "افزودن به تالار معاملات کف بازار"}
                                    className={`p-1.5 rounded-lg border transition-all cursor-pointer flex items-center gap-0.5 text-[10px] font-black ${
                                      p.isKafBazaar
                                        ? "bg-rose-500 text-white border-rose-600 shadow-xs ring-1 ring-rose-300"
                                        : "bg-slate-50 text-slate-400 border-slate-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-300"
                                    }`}
                                  >
                                    <Flame size={12} className={p.isKafBazaar ? "fill-white" : ""} />
                                    <span>کف‌بازار</span>
                                  </button>

                                  {/* 4. Weekly Sale */}
                                  <button
                                    type="button"
                                    onClick={() => handleQuickToggleProductFlag(p, 'weeklySaleActive')}
                                    title={p.weeklySaleActive ? "حراج هفتگی فعال - برای خروج کلیک کنید" : "افزودن به برنامه فروش هفتگی"}
                                    className={`p-1.5 rounded-lg border transition-all cursor-pointer flex items-center gap-0.5 text-[10px] font-black ${
                                      p.weeklySaleActive
                                        ? "bg-emerald-600 text-white border-emerald-700 shadow-xs ring-1 ring-emerald-300"
                                        : "bg-slate-50 text-slate-400 border-slate-200 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-300"
                                    }`}
                                  >
                                    <Calendar size={12} />
                                    <span>هفتگی</span>
                                  </button>

                                  {/* 5. Cheque Allowed */}
                                  <button
                                    type="button"
                                    onClick={() => handleQuickToggleProductFlag(p, 'chequeAllowed')}
                                    title={p.chequeAllowed !== false ? "فروش چکی مجاز - برای لغو کلیک کنید" : "مجاز کردن پرداخت چکی (۵۰٪ نقد + چک صیادی)"}
                                    className={`p-1.5 rounded-lg border transition-all cursor-pointer flex items-center gap-0.5 text-[10px] font-black ${
                                      p.chequeAllowed !== false
                                        ? "bg-slate-800 text-white border-slate-900 shadow-xs"
                                        : "bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-200 hover:text-slate-700"
                                    }`}
                                  >
                                    <CreditCard size={12} />
                                    <span>چکی</span>
                                  </button>
                                </div>
                              )}
                            </td>

                            <td className="py-3 px-3 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() => handleEditProductClick(p)}
                                  className="p-1.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-600 rounded-lg text-slate-600 transition-all cursor-pointer"
                                  title="ویرایش کالا"
                                >
                                  <Edit2 size={14} />
                                </button>
                                <button
                                  onClick={() => {
                                    if (confirm(`آیا از حذف محصول «${p.name}» مطمئن هستید؟`)) {
                                      onDeleteProduct(p.id);
                                    }
                                  }}
                                  className="p-1.5 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 rounded-lg text-slate-600 transition-all cursor-pointer"
                                  title="حذف کالا"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              /* Products Grid View */
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredProducts.map((p, idx) => (
                  <div key={`prod-grid-${p.id || idx}-${idx}`} className={`bg-white rounded-3xl border p-4 shadow-2xs space-y-3 flex flex-col justify-between transition-colors ${selectedProductIds.includes(p.id) ? 'border-emerald-500 bg-emerald-50/10' : 'border-slate-200/80'} ${p.disabled ? 'opacity-60' : ''}`}>
                    <div className="space-y-2.5">
                      <div className="relative aspect-square rounded-2xl overflow-hidden bg-slate-50 border border-slate-100">
                        {/* Checkbox Top Left */}
                        <div className="absolute top-2 left-2 z-10 bg-white/95 backdrop-blur-xs p-1.5 rounded-lg border border-slate-200/80 shadow-3xs">
                          <input
                            type="checkbox"
                            checked={selectedProductIds.includes(p.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedProductIds(prev => [...prev, p.id]);
                              } else {
                                setSelectedProductIds(prev => prev.filter(id => id !== p.id));
                              }
                            }}
                            className="w-4.5 h-4.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer block"
                          />
                        </div>

                        {/* Top Badges */}
                        <div className="absolute top-2 right-2 z-10 flex flex-col items-end gap-1">
                          {p.isFeatured && (
                            <span className="bg-amber-400 text-amber-950 text-[9px] font-black px-2 py-0.5 rounded-md shadow-xs flex items-center gap-0.5">
                              <Star size={10} className="fill-amber-950" />
                              <span>ویژه</span>
                            </span>
                          )}
                          {p.isBestseller && (
                            <span className="bg-indigo-600 text-white text-[9px] font-black px-2 py-0.5 rounded-md shadow-xs flex items-center gap-0.5">
                              <Trophy size={10} />
                              <span>پرفروش {p.bestsellerRank ? `#${toPersianNum(p.bestsellerRank)}` : ''}</span>
                            </span>
                          )}
                          {p.isSurplus && (
                            <span className={`${p.surplusStatus === 'approved' ? 'bg-emerald-600' : 'bg-rose-600'} text-white text-[9px] font-black px-2 py-0.5 rounded-md shadow-xs flex items-center gap-0.5`}>
                              <TrendingDown size={10} />
                              <span>{p.surplusStatus === 'approved' ? 'مازاد تاییدشده' : 'مازاد در انتظار'}</span>
                            </span>
                          )}
                          {p.isKafBazaar && (
                            <span className="bg-rose-500 text-white text-[9px] font-black px-2 py-0.5 rounded-md shadow-xs flex items-center gap-0.5">
                              <Flame size={10} className="fill-white" />
                              <span>کف‌بازار</span>
                            </span>
                          )}
                          {p.weeklySaleActive && (
                            <span className="bg-emerald-600 text-white text-[9px] font-black px-2 py-0.5 rounded-md shadow-xs flex items-center gap-0.5">
                              <Calendar size={10} />
                              <span>تخفیف ٪{toPersianNum(p.weeklySaleDiscount || 15)}</span>
                            </span>
                          )}
                        </div>

                        <img
                          src={getDisplayImageUrl(p.image_url)}
                          alt={p.name}
                          className="w-full h-full object-cover"
                          onError={(e) => { e.currentTarget.src = "https://images.unsplash.com/photo-1550547660-d9450f859349?w=300"; }}
                        />

                        {/* Bottom Origin Pill */}
                        {p.shipping_origin && (
                          <div className="absolute bottom-2 right-2 left-2 bg-slate-900/80 backdrop-blur-xs text-white text-[9px] font-bold px-2 py-0.5 rounded-lg flex items-center gap-1 line-clamp-1">
                            <MapPin size={10} className="text-amber-400 shrink-0" />
                            <span className="truncate">{p.shipping_origin}</span>
                          </div>
                        )}
                      </div>

                      <div>
                        <h4 className="font-black text-slate-900 text-xs line-clamp-1">{p.name}</h4>
                        <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold pt-0.5">
                          <span>{p.brand} • {p.category}</span>
                          {p.supplierName && (
                            <span className="text-blue-600 font-bold line-clamp-1">{p.supplierName}</span>
                          )}
                        </div>
                      </div>

                      {/* If Pending Surplus Approval Box in Grid */}
                      {p.isSurplus && p.surplusStatus === 'pending' && (
                        <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-2xl space-y-1.5">
                          <div className="flex items-center justify-between text-[11px] font-black text-rose-900">
                            <span>پیشنهاد مازاد کارخانه:</span>
                            <span className="text-rose-700 font-mono">٪{toPersianNum(p.surplusDiscountPercent || p.discountPercent || 20)} تخفیف</span>
                          </div>
                          <div className="text-[10px] text-rose-700 font-bold">
                            تعداد عرضه: {toPersianNum(p.surplusQuantityCartons || p.stock_quantity_cartons || 50)} کارتن
                          </div>
                          <div className="flex items-center gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => handleApproveSurplus(p, true)}
                              className="flex-1 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-black cursor-pointer shadow-xs"
                            >
                              تایید و انتشار
                            </button>
                            <button
                              type="button"
                              onClick={() => handleApproveSurplus(p, false)}
                              className="px-3 py-1 bg-slate-200 hover:bg-rose-100 text-slate-700 hover:text-rose-700 rounded-xl text-[10px] font-bold cursor-pointer"
                            >
                              رد
                            </button>
                          </div>
                        </div>
                      )}

                      <div className="pt-1 border-t border-slate-100 flex justify-between items-center text-xs">
                        <span className="text-[10px] text-slate-400 font-bold">قیمت عمده:</span>
                        <span className="font-black text-emerald-600 font-mono">{(p.bulk_price || p.price || 0).toLocaleString()} تومان</span>
                      </div>

                      {/* Quick 1-Click Toggle Icons Bar */}
                      <div className="pt-2 border-t border-slate-100 grid grid-cols-5 gap-1">
                        <button
                          type="button"
                          onClick={() => handleQuickToggleProductFlag(p, 'isFeatured')}
                          title="ویژه کردن کالا"
                          className={`py-1 rounded-lg border text-[10px] font-black flex items-center justify-center gap-0.5 transition-all cursor-pointer ${
                            p.isFeatured
                              ? "bg-amber-400 text-amber-950 border-amber-500 shadow-xs"
                              : "bg-slate-50 text-slate-400 border-slate-200 hover:bg-amber-50 hover:text-amber-700"
                          }`}
                        >
                          <Star size={11} className={p.isFeatured ? "fill-amber-950" : ""} />
                          <span>ویژه</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleQuickToggleProductFlag(p, 'isBestseller')}
                          title="پرفروش‌ترین بازار"
                          className={`py-1 rounded-lg border text-[10px] font-black flex items-center justify-center gap-0.5 transition-all cursor-pointer ${
                            p.isBestseller
                              ? "bg-indigo-600 text-white border-indigo-700 shadow-xs"
                              : "bg-slate-50 text-slate-400 border-slate-200 hover:bg-indigo-50 hover:text-indigo-700"
                          }`}
                        >
                          <Trophy size={11} />
                          <span>پرفروش</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleQuickToggleProductFlag(p, 'isKafBazaar')}
                          title="کف بازار"
                          className={`py-1 rounded-lg border text-[10px] font-black flex items-center justify-center gap-0.5 transition-all cursor-pointer ${
                            p.isKafBazaar
                              ? "bg-rose-500 text-white border-rose-600 shadow-xs"
                              : "bg-slate-50 text-slate-400 border-slate-200 hover:bg-rose-50 hover:text-rose-700"
                          }`}
                        >
                          <Flame size={11} className={p.isKafBazaar ? "fill-white" : ""} />
                          <span>کف</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleQuickToggleProductFlag(p, 'weeklySaleActive')}
                          title="برنامه فروش هفتگی"
                          className={`py-1 rounded-lg border text-[10px] font-black flex items-center justify-center gap-0.5 transition-all cursor-pointer ${
                            p.weeklySaleActive
                              ? "bg-emerald-600 text-white border-emerald-700 shadow-xs"
                              : "bg-slate-50 text-slate-400 border-slate-200 hover:bg-emerald-50 hover:text-emerald-700"
                          }`}
                        >
                          <Calendar size={11} />
                          <span>هفتگی</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleQuickToggleProductFlag(p, 'chequeAllowed')}
                          title="فروش چکی"
                          className={`py-1 rounded-lg border text-[10px] font-black flex items-center justify-center gap-0.5 transition-all cursor-pointer ${
                            p.chequeAllowed !== false
                              ? "bg-slate-800 text-white border-slate-900 shadow-xs"
                              : "bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-200 hover:text-slate-700"
                          }`}
                        >
                          <CreditCard size={11} />
                          <span>چکی</span>
                        </button>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                      <button
                        onClick={() => handleEditProductClick(p)}
                        className="flex-1 py-1.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-600 rounded-xl text-xs font-black text-slate-700 transition-all flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Edit2 size={13} />
                        <span>ویرایش کامل</span>
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`آیا از حذف «${p.name}» مطمئن هستید؟`)) onDeleteProduct(p.id);
                        }}
                        className="p-1.5 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 rounded-xl text-slate-500 transition-all cursor-pointer"
                        title="حذف کالا"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 4. WEEKLY SALES SCHEDULE TAB */}
        {activeTab === "weekly_schedule" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="bg-gradient-to-r from-emerald-600 to-orange-500 text-white p-6 rounded-3xl shadow-lg space-y-2">
              <div className="flex items-center gap-2">
                <Flame size={24} className="animate-bounce" />
                <h2 className="text-lg font-black">مدیریت برنامه فروش و حراج هفتگی کارخانجات</h2>
              </div>
              <p className="text-xs text-emerald-100 font-bold leading-relaxed max-w-3xl">
                در این بخش می‌توانید کالاهایی را که با تخفیف طلایی کارخانه‌ای و سهمیه ویژه در روزهای مشخص هفته به متقاضیان عمده عرضه می‌شوند فعال یا غیرفعال کنید.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.filter(p => p.weeklySaleActive).length === 0 ? (
                <div className="col-span-full py-16 text-center text-slate-400 font-bold bg-white rounded-3xl border border-slate-200">
                  در حال حاضر هیچ محصولی در برنامه فروش هفتگی تعریف نشده است. از تب «مدیریت محصولات» می‌توانید کالاهای دلخواه را به این برنامه اضافه کنید.
                </div>
              ) : (
                products.filter(p => p.weeklySaleActive).map((p, idx) => (
                  <div key={`weekly-p-${p.id || idx}-${idx}`} className="bg-white p-4 rounded-3xl border-2 border-emerald-200 shadow-sm space-y-3">
                    <div className="relative aspect-square rounded-2xl overflow-hidden bg-slate-50">
                      <img
                        src={getDisplayImageUrl(p.image_url)}
                        alt={p.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 right-2 bg-emerald-600 text-white text-[10px] font-black px-2 py-0.5 rounded-lg shadow-sm">
                        ٪{toPersianNum(p.weeklySaleDiscount || 15)} تخفیف
                      </div>
                      <div className="absolute bottom-2 left-2 bg-slate-900/80 backdrop-blur-xs text-white text-[9px] font-bold px-2 py-0.5 rounded-lg">
                        {p.weeklySaleDay || "همه روزها"}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-black text-slate-900 text-xs line-clamp-1">{p.name}</h4>
                      <p className="text-[10px] text-slate-400 font-bold">{p.brand} • سهمیه: {toPersianNum(p.weeklySaleQuota || 200)} کارتن</p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-400 line-through text-[11px]">{(p.bulk_price || p.price || 0).toLocaleString()}</span>
                      <span className="text-emerald-600 font-black text-sm">{(p.weeklySalePrice || Math.round((p.bulk_price || p.price || 0) * (1 - (p.weeklySaleDiscount || 15) / 100))).toLocaleString()} تومان</span>
                    </div>

                    <button
                      onClick={() => {
                        onUpdateProduct(p.id, { weeklySaleActive: false });
                        setSuccessMsg(`«${p.name}» از برنامه فروش هفتگی خارج شد.`);
                        setTimeout(() => setSuccessMsg(null), 3000);
                      }}
                      className="w-full py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-xs font-black transition-all cursor-pointer"
                    >
                      خروج از حراج هفتگی
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* 5. ADS & FLOOR MARKET TAB */}
        {activeTab === "ads" && (
          <div className="animate-in fade-in duration-300">
            <AdminAdsManagement
              sponsoredAds={sponsoredAds}
              rawMaterialAds={rawMaterialAds}
              equipmentAds={equipmentAds}
              serviceAds={serviceAds}
              barterDeals={barterDeals}
              onUpdateAdStatus={handleUpdateAdStatus}
              onEditAd={handleEditAd}
              onUpdateB2bConfig={onUpdateB2bConfig}
              b2bConfig={b2bConfig}
              setSuccessMsg={setSuccessMsg}
              setErrorMsg={setErrorMsg}
            />
          </div>
        )}

        {/* 5.1 CAPACITY ADS MANAGEMENT TAB */}
        {activeTab === "capacity_ads" && (
          <div className="space-y-6 text-right animate-in fade-in duration-300" dir="rtl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200">
              <div className="space-y-1">
                <h2 className="text-base sm:text-lg font-black text-slate-900">
                  مدیریت آگهی‌های ظرفیت خالی کارخانجات کشور (OEM)
                </h2>
                <p className="text-xs text-slate-400 font-bold">
                  نظارت، تایید، حذف آگهی‌های ظرفیت خالی فعال و بررسی درخواست‌های ثبت‌شده بین برندها و کارخانجات
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 font-black rounded-xl text-xs">
                  {toPersianNum(adminCapacityAds.length)} آگهی کل
                </span>
                <span className="px-3 py-1.5 bg-teal-50 text-teal-800 border border-teal-200 font-black rounded-xl text-xs">
                  {toPersianNum(adminCapacityAds.reduce((acc, c) => acc + (c.cooperationRequests?.length || 0), 0))} درخواست همکاری
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Col: All Cooperation Requests */}
              <div className="lg:col-span-7 space-y-4">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-xs font-black text-slate-500 flex items-center gap-1.5">
                    <CheckCircle size={14} className="text-emerald-600" />
                    <span>درخواست‌های همکاری و تولید قراردادی فیمابین</span>
                  </h3>
                </div>

                {adminCapacityAds.reduce((acc, c) => acc + (c.cooperationRequests?.length || 0), 0) === 0 ? (
                  <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center space-y-4">
                    <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-400">
                      <CheckCircle size={20} />
                    </div>
                    <p className="text-xs text-slate-400 font-bold leading-relaxed max-w-xs mx-auto">
                      هیچ درخواست همکاری روی آگهی‌های ظرفیت خالی در پلتفرم ثبت نشده است.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {adminCapacityAds.flatMap(ad => 
                      (ad.cooperationRequests || []).map((req: any, index: number) => ({
                        ...req,
                        adId: ad.id,
                        adTitle: ad.title,
                        factoryName: ad.factoryName,
                        index
                      }))
                    ).map((req, i) => (
                      <div key={`admin-panel-coop-req-${req.trackingCode || i}-${i}`} className="bg-white border border-slate-200 rounded-3xl p-5 hover:border-slate-300 transition-all space-y-4 shadow-2xs">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                          <div>
                            <span className="text-[10px] text-teal-600 font-black block">کارخانه مقصد: {req.factoryName}</span>
                            <h4 className="text-xs font-black text-slate-900 leading-snug line-clamp-1">{req.adTitle}</h4>
                          </div>
                          <span className={`text-[9px] font-black px-2.5 py-1 rounded-full ${
                            req.status === 'بررسی شده' 
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                              : req.status === 'رد پیشنهاد' 
                              ? 'bg-red-50 text-red-800 border border-red-200' 
                              : 'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}>
                            {req.status || 'در انتظار بررسی'}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-1">
                            <span className="text-[10px] text-slate-400 font-bold block">متقاضی / برند تجاری:</span>
                            <div className="font-black text-slate-800">{req.brandName}</div>
                            <div className="font-bold text-slate-500">رابط: {req.contactPerson}</div>
                            <div className="font-bold text-teal-700 text-left" dir="ltr">{req.phone}</div>
                          </div>

                          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-1">
                            <span className="text-[10px] text-slate-400 font-bold block">جزئیات سفارش درخواستی:</span>
                            <div className="font-black text-slate-800">محصول: {req.targetProduct || "طبق کاتالوگ"}</div>
                            <div className="font-bold text-slate-600">برآورد ماهانه: {req.estimatedMonthlyQty || "توافقی"}</div>
                            <div className="font-bold text-slate-400 font-mono text-[9px]">کد پیگیری: {req.trackingCode}</div>
                          </div>
                        </div>

                        {req.notes && (
                          <div className="bg-slate-50 p-3 rounded-2xl border border-dashed border-slate-200 text-xs text-slate-600 font-medium leading-relaxed">
                            <span className="text-[10px] text-slate-400 font-bold block mb-1">شرح پیشنهاد و شرایط تسویه برند:</span>
                            {req.notes}
                          </div>
                        )}

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 text-[10px]">
                          <span className="text-slate-400 font-bold">ارسال شده در: {req.createdAt}</span>
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleAdminUpdateCoopStatus(req.adId, req.index, "بررسی شده")}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-lg transition-all cursor-pointer"
                            >
                              تایید و بررسی شد
                            </button>
                            <button
                              onClick={() => handleAdminUpdateCoopStatus(req.adId, req.index, "رد پیشنهاد")}
                              className="px-3 py-1.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 font-black rounded-lg transition-all cursor-pointer"
                            >
                              رد درخواست
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Right Col: All Ads Listed */}
              <div className="lg:col-span-5 space-y-4">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-xs font-black text-slate-500 flex items-center gap-1.5">
                    <Megaphone size={14} className="text-teal-600" />
                    <span>آگهی‌های ظرفیت خالی فعال کشور</span>
                  </h3>
                </div>

                {adminCapacityAds.length === 0 ? (
                  <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center space-y-4">
                    <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-400">
                      <Megaphone size={20} />
                    </div>
                    <p className="text-xs text-slate-400 font-bold leading-relaxed max-w-xs mx-auto">
                      هیچ آگهی ظرفیت خالی فعالی در سیستم ثبت نشده است.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {adminCapacityAds.map((ad, idx) => (
                      <div key={`admin-panel-cap-ad-${ad.id || idx}-${idx}`} className="bg-white border border-slate-200 rounded-3xl p-5 hover:border-slate-300 transition-all space-y-3.5 shadow-2xs">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <span className="inline-block px-2.5 py-0.5 bg-slate-100 border border-slate-200 text-[9px] font-black rounded-full text-slate-600">
                              {ad.category}
                            </span>
                            <div className="text-[10px] text-teal-600 font-black block mt-1">کارخانه: {ad.factoryName}</div>
                          </div>
                          <button
                            onClick={() => handleAdminDeleteCapacityAd(ad.id)}
                            className="p-1.5 rounded-xl text-slate-400 hover:bg-red-50 hover:text-red-600 transition-all cursor-pointer"
                            title="حذف کامل آگهی"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>

                        <h4 className="text-xs font-black text-slate-900 leading-snug">{ad.title}</h4>

                        <div className="text-[10px] text-slate-500 space-y-1 font-bold border-b border-slate-100 pb-3">
                          <div>محل کارخانه: {ad.location}</div>
                          <div>حداقل سفارش قابل پذیرش: {ad.minOrderQty}</div>
                          <div>شماره تماس مستقیم مسئول خط: {ad.phone}</div>
                        </div>

                        {ad.machineryDetails && (
                          <p className="text-[10px] text-slate-600 font-medium leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                            <span className="font-black text-slate-800 block mb-0.5">تجهیزات و ماشین‌آلات:</span>
                            {ad.machineryDetails}
                          </p>
                        )}

                        <div className="flex items-center justify-between text-[10px] pt-1">
                          <span className="text-slate-400 font-bold">ثبت شده در: {ad.createdAt}</span>
                          <span className="px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 font-black rounded-lg text-[9px]">
                            {toPersianNum(ad.cooperationRequests?.length || 0)} درخواست همکاری دریافتی
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 5b. BARTER & SAFE SWAP TAB */}
        {activeTab === "barter" && (
          <div className="animate-in fade-in duration-300">
            <BarterHall
              user={{ name: "مدیریت دست‌اول", company: "تیم بازرگانی دست‌اول", city: "تهران" }}
            />
          </div>
        )}

        {/* 6. ORDERS TAB */}
        {activeTab === "orders" && (
          <div className="animate-in fade-in duration-300">
            <AdminOrders
              orders={orders}
              ordersLoading={ordersLoading}
              ordersSearch={ordersSearch}
              setOrdersSearch={setOrdersSearch}
              fetchOrders={() => loadLocalData()}
              handleUpdateOrderStatus={handleUpdateOrderStatus}
              onDeleteOrder={handleDeleteOrder}
              onBatchDeleteOrders={handleBatchDeleteOrders}
              formatOrderDate={(d) => d || new Date().toLocaleDateString("fa-IR")}
              getStatusLabel={(s) => ({
                text: s === 'approved' ? 'تایید شده' : s === 'pending' ? 'در انتظار' : s,
                color: s === 'approved' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-amber-700'
              })}
              setShowPrintInvoice={(order) => {
                setSelectedOrderToPrint(order);
              }}
            />

            {/* Print/Download Invoice Modal */}
            {selectedOrderToPrint && (
              <WholesaleInvoiceView
                order={selectedOrderToPrint}
                b2bConfig={b2bConfig}
                isAdmin={true}
                onClose={() => setSelectedOrderToPrint(null)}
              />
            )}
          </div>
        )}

        {/* 6.5. RFQS TAB */}
        {activeTab === "rfqs" && (
          <div className="animate-in fade-in duration-300">
            <AdminRfqs
              setSuccessMsg={setSuccessMsg}
              setErrorMsg={setErrorMsg}
            />
          </div>
        )}

        {/* 7. CRM TAB */}
        {activeTab === "crm" && (
          <div className="animate-in fade-in duration-300">
            <AdminCRM
              crmCustomers={crmCustomers}
              crmLoading={crmLoading}
              products={products}
              setLoading={setLoading}
              setSuccessMsg={setSuccessMsg}
              setErrorMsg={setErrorMsg}
              confirmAction={(title, msg, onConfirm) => {
                if (confirm(`${title}\n${msg}`)) onConfirm();
              }}
              loadCrmCustomers={async () => loadLocalData()}
            />
          </div>
        )}

        {/* 7.5. USERS MANAGEMENT TAB */}
        {activeTab === "users_management" && (
          <div className="animate-in fade-in duration-300">
            <AdminUsersManagement
              orders={orders}
              setLoading={setLoading}
              setSuccessMsg={setSuccessMsg}
              setErrorMsg={setErrorMsg}
              confirmAction={(title, msg, onConfirm) => {
                if (confirm(`${title}\n${msg}`)) onConfirm();
              }}
              b2bConfig={b2bConfig}
            />
          </div>
        )}

        {/* 8. ARTICLES TAB */}
        {activeTab === "articles" && (
          <div className="animate-in fade-in duration-300">
            <AdminArticles
              articles={articles}
              products={products}
              b2bConfig={b2bConfig}
              setLoading={setLoading}
              setSuccessMsg={setSuccessMsg}
              setErrorMsg={setErrorMsg}
              confirmAction={(title, msg, onConfirm) => {
                if (confirm(`${title}\n${msg}`)) onConfirm();
              }}
              onUpdateArticles={async () => {
                if (onRefreshProducts) await onRefreshProducts();
              }}
            />
          </div>
        )}

        {/* 9. REPRESENTATIVES TAB */}
        {activeTab === "reps" && (
          <div className="animate-in fade-in duration-300">
            <AdminRepresentatives
              representativesList={representativesList}
              allAvailableBrandsList={Array.from(new Set(products.map(p => p.brand).filter(Boolean)))}
              setLoading={setLoading}
              setSuccessMsg={setSuccessMsg}
              setErrorMsg={setErrorMsg}
              confirmAction={(title, msg, onConfirm) => {
                if (confirm(`${title}\n${msg}`)) onConfirm();
              }}
              setSelectedRepForCertificate={() => {}}
              onUpdateReps={async () => loadLocalData()}
            />
          </div>
        )}

        {/* 10. SAFEBUY TAB */}
        {activeTab === "safebuy" && (
          <div className="animate-in fade-in duration-300">
            <AdminSafeBuy
              products={products}
              sponsoredAds={sponsoredAds}
              setSuccessMsg={setSuccessMsg}
              setErrorMsg={setErrorMsg}
              setLoading={setLoading}
            />
          </div>
        )}

        {/* 11. SYSTEM CONFIG & WOOCOMMERCE TAB */}
        {activeTab === "system" && (
          <div className="animate-in fade-in duration-300">
            <AdminSystemConfig
              b2bConfig={b2bConfig}
              onUpdateB2bConfig={onUpdateB2bConfig}
              products={products}
              orders={orders}
              articles={articles}
              onRefreshProducts={async () => {
                if (onRefreshProducts) await onRefreshProducts();
              }}
            />
          </div>
        )}

        {/* 12. CHANNEL POSTS TAB */}
        {activeTab === "channel_posts" && (
          <div className="animate-in fade-in duration-300">
            <AdminChannelPosts
              setSuccessMsg={setSuccessMsg}
              autoPostSettings={autoPostSettings}
              setAutoPostSettings={setAutoPostSettings}
            />
          </div>
        )}

        {/* 13. INVOICES SETTINGS TAB */}
        {activeTab === "invoices" && (
          <div className="animate-in fade-in duration-300">
            <AdminInvoiceSettings
              b2bConfig={b2bConfig}
              onUpdateB2bConfig={onUpdateB2bConfig}
            />
          </div>
        )}

        {/* CATEGORIES MANAGEMENT TAB */}
        {activeTab === "categories_manager" && (
          <div className="animate-in fade-in duration-300">
            <AdminCategoriesManagement
              b2bConfig={b2bConfig}
              products={products}
              onUpdateB2bConfig={onUpdateB2bConfig}
            />
          </div>
        )}

        {/* BRANDS MANAGEMENT TAB */}
        {activeTab === "brands_manager" && (
          <div className="animate-in fade-in duration-300">
            <AdminBrandsManagement
              b2bConfig={b2bConfig}
              products={products}
              onUpdateB2bConfig={onUpdateB2bConfig}
              onBulkUpdateProducts={onBulkUpdateProducts}
              onRefreshProducts={onRefreshProducts}
            />
          </div>
        )}

        {/* FACTORIES MANAGEMENT TAB */}
        {activeTab === "factories_manager" && (
          <div className="animate-in fade-in duration-300">
            <AdminFactoriesManagement
              b2bConfig={b2bConfig}
              products={products}
              onUpdateB2bConfig={onUpdateB2bConfig}
            />
          </div>
        )}

        {/* 14. FACTORY PRODUCT AUDIT TAB */}
        {activeTab === "factory_audit" && (
          <div className="animate-in fade-in duration-300">
            <AdminFactoryProductAudit
              products={products}
              onUpdateProduct={onUpdateProduct}
              onDeleteProduct={onDeleteProduct}
            />
          </div>
        )}

        {/* SPECIAL OFFERS & PROFIT-MARGIN SYSTEM CONFIG TAB */}
        {activeTab === "special_offers_manager" && (
          <div className="animate-in fade-in duration-300">
            <AdminSpecialOffersManagement
              products={products}
              b2bConfig={b2bConfig}
              onUpdateB2bConfig={onUpdateB2bConfig}
              onUpdateProduct={onUpdateProduct}
            />
          </div>
        )}

        {/* DISCOUNT COUPONS TAB */}
        {activeTab === "coupons" && (
          <div className="animate-in fade-in duration-300">
            <AdminCoupons />
          </div>
        )}

        {/* 15. SUPPORT TICKETS & CHAT TAB */}
        {activeTab === "tickets" && (
          <div className="animate-in fade-in duration-300">
            <AdminTicketManagement
              setLoading={setLoading}
              setSuccessMsg={setSuccessMsg}
              setErrorMsg={setErrorMsg}
            />
          </div>
        )}
      </main>

      {/* Bulk Price Modal */}
      <AnimatePresence>
        {showBulkPriceModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl border border-slate-200 shadow-xl max-w-md w-full p-6 text-right"
            >
              <h3 className="text-sm font-black text-slate-900 mb-2">
                ✏️ ویرایش گروهی قیمت ({toPersianNum(selectedProductIds.length)} کالا)
              </h3>
              <p className="text-[11px] text-slate-500 font-bold mb-4">
                نوع و مقدار تغییر قیمت را مشخص کنید تا روی تمامی کالاهای انتخاب‌شده اعمال شود.
              </p>

              <div className="space-y-4">
                {/* Change Type Selection */}
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setBulkPriceChangeType('set')}
                    className={`px-2 py-2 rounded-xl text-[10px] font-black border transition-all cursor-pointer ${
                      bulkPriceChangeType === 'set'
                        ? 'bg-emerald-600 text-white border-emerald-700 shadow-2xs'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    تنظیم قیمت ثابت
                  </button>
                  <button
                    type="button"
                    onClick={() => setBulkPriceChangeType('percent_increase')}
                    className={`px-2 py-2 rounded-xl text-[10px] font-black border transition-all cursor-pointer ${
                      bulkPriceChangeType === 'percent_increase'
                        ? 'bg-emerald-600 text-white border-emerald-700 shadow-2xs'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    افزایش درصدی (٪)
                  </button>
                  <button
                    type="button"
                    onClick={() => setBulkPriceChangeType('percent_decrease')}
                    className={`px-2 py-2 rounded-xl text-[10px] font-black border transition-all cursor-pointer ${
                      bulkPriceChangeType === 'percent_decrease'
                        ? 'bg-emerald-600 text-white border-emerald-700 shadow-2xs'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    کاهش درصدی (٪)
                  </button>
                </div>

                {/* Input Value */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-slate-700 block">
                    {bulkPriceChangeType === 'set' ? 'قیمت جدید کالا (تومان)' : 'درصد تغییر قیمت (٪)'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={bulkPriceChangeType === 'set' ? 'مثلا ۱۵۰۰۰' : 'مثلا ۱۰'}
                    value={bulkPriceValue}
                    onChange={e => setBulkPriceValue(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-center"
                  />
                </div>
              </div>

              {/* Action Row */}
              <div className="mt-6 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowBulkPriceModal(false);
                    setBulkPriceValue("");
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-black rounded-xl transition-all cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="button"
                  onClick={handleApplyBulkPrice}
                  disabled={loading}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl transition-all cursor-pointer shadow-md shadow-emerald-600/10"
                >
                  {loading ? 'در حال اعمال...' : 'اعمال گروهی قیمت'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Bulk Stock Modal */}
      <AnimatePresence>
        {showBulkStockModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl border border-slate-200 shadow-xl max-w-md w-full p-6 text-right"
            >
              <h3 className="text-sm font-black text-slate-900 mb-2">
                📦 ویرایش گروهی موجودی ({toPersianNum(selectedProductIds.length)} کالا)
              </h3>
              <p className="text-[11px] text-slate-500 font-bold mb-4">
                تغییر مورد نظر برای موجودی کالاها (به تعداد کارتن) را مشخص کنید.
              </p>

              <div className="space-y-4">
                {/* Change Type Selection */}
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setBulkStockChangeType('set')}
                    className={`px-2 py-2 rounded-xl text-[10px] font-black border transition-all cursor-pointer ${
                      bulkStockChangeType === 'set'
                        ? 'bg-emerald-600 text-white border-emerald-700 shadow-2xs'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    تنظیم تعداد ثابت
                  </button>
                  <button
                    type="button"
                    onClick={() => setBulkStockChangeType('add')}
                    className={`px-2 py-2 rounded-xl text-[10px] font-black border transition-all cursor-pointer ${
                      bulkStockChangeType === 'add'
                        ? 'bg-emerald-600 text-white border-emerald-700 shadow-2xs'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    افزودن به موجودی (+)
                  </button>
                  <button
                    type="button"
                    onClick={() => setBulkStockChangeType('subtract')}
                    className={`px-2 py-2 rounded-xl text-[10px] font-black border transition-all cursor-pointer ${
                      bulkStockChangeType === 'subtract'
                        ? 'bg-emerald-600 text-white border-emerald-700 shadow-2xs'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    کاهش از موجودی (-)
                  </button>
                </div>

                {/* Input Value */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-slate-700 block">
                    تعداد کارتن جدید یا مقدار تغییر
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="مثلا ۵۰"
                    value={bulkStockValue}
                    onChange={e => setBulkStockValue(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-center"
                  />
                </div>
              </div>

              {/* Action Row */}
              <div className="mt-6 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowBulkStockModal(false);
                    setBulkStockValue("");
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-black rounded-xl transition-all cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="button"
                  onClick={handleApplyBulkStock}
                  disabled={loading}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl transition-all cursor-pointer shadow-md shadow-emerald-600/10"
                >
                  {loading ? 'در حال اعمال...' : 'اعمال گروهی موجودی'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
