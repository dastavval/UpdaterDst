import { useState, useEffect, useMemo } from "react";
import { Plus, Menu, Edit2, Trash2, CheckCircle, XCircle, Package, Layers, Image, DollarSign, RefreshCw, BarChart2, ShieldAlert, ArrowLeft, Layers2, Sparkles, Cpu, MapPin, Palette, Edit3, Settings, Save, Users, Search, Phone, Building2, Map, Tag, ShoppingBag, ShoppingCart, ClipboardList, Check, Clock, Truck, ShieldCheck, CreditCard, Activity, Printer, X, Award, ChevronRight, Percent, UserPlus, User, BookOpen, LogOut, PlusCircle, Zap, Calendar, Newspaper, FileSpreadsheet, Download, Upload, FileText, Copy, HelpCircle, FileCode, MessageSquare, Eye, Code2, Server, Terminal, Network, Share2, Github, Megaphone, TrendingDown, HardDrive, Globe, Pin, Scale, Bot, Wand2, Smartphone } from "lucide-react";
import Papa from "papaparse";
import { logoutUser, changePassword, updateDisplayName } from "../lib/auth-helper";
import { motion, AnimatePresence } from "motion/react";
import { Product, B2BConfig, OrderItem, SlideItem, BrandItem } from "../types";
import { fetchCRMCustomers, CRMCustomer, updateCRMCustomer, deleteCRMCustomer, addCRMCustomer } from "../lib/crm-helper";
import { fetchCallbackRequests, updateCallbackStatus, deleteCallbackRequest } from "../lib/callback-helper";
import { db } from "../lib/data-layer";
import { collection, getDocs, doc, updateDoc, query, orderBy, addDoc, deleteDoc, serverTimestamp, where } from "../lib/data-layer";
import WholesaleInvoiceView from "./WholesaleInvoiceView";
import RepresentativeCertificateView from "./RepresentativeCertificateView";
import CatalogPrintView from "./CatalogPrintView";
import AdminInvoiceSettings from "./AdminInvoiceSettings";
import AdminSystemConfig from "./AdminSystemConfig";
import AdminPendingApprovals from "./AdminPendingApprovals";
import AdminFactoryProductAudit from "./AdminFactoryProductAudit";
import AdminChannelPosts from "./AdminChannelPosts";
import AdminSafeBuy from "./AdminSafeBuy";
import AdminAdsManagement from "./AdminAdsManagement";
import AdminOrders from "./AdminOrders";
import AdminCRM from "./AdminCRM";
import AdminArticles from "./AdminArticles";
import AdminRepresentatives from "./AdminRepresentatives";
import ProgressIndicator from "./ProgressIndicator";
import ConfirmModal from "./ConfirmModal";
import { generateId, generateProductCode, generateFactoryCode, generateUserCode, generateCategoryCode } from "../lib/id-utils";
import { uploadToParsPackStorage } from "../utils/storage";
import { getApiUrl, isWarehouseBrand, getEffectiveProductTags } from "../utils/api-utils";
import { toPersianNum, toEnglishNum } from "../utils/persian-utils";
import { getDisplayImageUrl, cleanUnitName } from "../lib/image-utils";
import { ProductImage } from "./ProductImage";
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  BarChart, 
  Bar, 
  Legend, 
  LineChart, 
  Line, 
  Cell,
  PieChart,
  Pie
} from "recharts";
import AddAdButton from "./AddAdButton";

interface AdminPanelProps {
  products: Product[];
  onAddProduct: (product: Omit<Product, 'id'>, skipStateUpdate?: boolean) => Promise<void>;
  onUpdateProduct: (id: string, updated: Partial<Product>, skipStateUpdate?: boolean) => Promise<void>;
  onDeleteProduct: (id: string, skipStateUpdate?: boolean) => Promise<void>;
  onBatchDeleteProducts?: (ids: string[]) => Promise<void>;
  onBulkUpdateProducts?: (updatedProducts: Product[]) => Promise<void>;
  onRefreshProducts?: () => Promise<void>;
  articles?: any[];
  onUpdateArticles?: () => Promise<void>;
  
  // Custom B2B configuration props
  b2bConfig: B2BConfig;
  onUpdateB2bConfig: (updatedConfig: B2BConfig) => Promise<void>;
  language: string;
  onLogout?: () => void;
}

import { AdminSalesCharts } from "./AdminSalesCharts";
import { getCacheStatus, CacheStatus, cacheProducts } from "../lib/db";
import ProductSyncStatusView from "./ProductSyncStatusView";

type SubTab = 'dashboard' | 'approvals' | 'products' | 'factory_audit' | 'branding' | 'crm' | 'factories' | 'orders' | 'accounting' | 'system' | 'pages' | 'catalog' | 'profile' | 'reports' | 'categories' | 'barter' | 'news' | 'invoice' | 'brands' | 'representatives' | 'ads' | 'safe_buy' | 'parspack_storage' | 'sms' | 'product_sync_status' | 'channel_posts';

export default function AdminPanel({ 
  products, 
  onAddProduct, 
  onUpdateProduct, 
  onDeleteProduct,
  onBatchDeleteProducts,
  onBulkUpdateProducts,
  onRefreshProducts,
  articles = [],
  onUpdateArticles,
  b2bConfig,
  onUpdateB2bConfig,
  language,
  onLogout
}: AdminPanelProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('dashboard');

  useEffect(() => {
    const handleTabChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ tab: string }>;
      if (customEvent.detail?.tab) {
        setActiveSubTab(customEvent.detail.tab as any);
      }
    };
    window.addEventListener("change-admin-tab", handleTabChange);
    return () => window.removeEventListener("change-admin-tab", handleTabChange);
  }, []);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Profile states
  const [newDisplayName, setNewDisplayName] = useState("");
  const [newPassword, setNewPassword] = useState("");

  // Bulk action states
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [batchPriceChange, setBatchPriceChange] = useState<number>(0);
  const [globalPriceChangePercent, setGlobalPriceChangePercent] = useState<string>("");
  const [globalPriceChangeDirection, setGlobalPriceChangeDirection] = useState<'increase' | 'decrease'>('increase');

  // Overarching 3-part Panel Role selector & AI Marketing States
  const [panelRole, setPanelRole] = useState<'sellers' | 'suppliers' | 'customers'>('sellers');
  const [aiMarketingProduct, setAiMarketingProduct] = useState<string>("");
  const [aiMarketingLoading, setAiMarketingLoading] = useState(false);
  const [aiMarketingDesc, setAiMarketingDesc] = useState<string>("");
  const [aiMarketingPitch, setAiMarketingPitch] = useState<string>("");
  const [aiMarketingAdvice, setAiMarketingAdvice] = useState<string>("");
  const [liveVisitors, setLiveVisitors] = useState<number>(() => Math.floor(Math.random() * (4 - 1 + 1) + 1));
  const [allUsers, setAllUsers] = useState<any[]>([]);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/b2b/users");
      if (res.ok) {
        const data = await res.json();
        // Deduplicate users by unique ID to get precise, accurate count
        const uniqueList: any[] = [];
        const seenIds = new Set();
        Object.values(data).forEach((u: any) => {
          if (u && u.id) {
            if (!seenIds.has(u.id)) {
              seenIds.add(u.id);
              uniqueList.push(u);
            }
          } else if (u) {
            uniqueList.push(u);
          }
        });
        setAllUsers(uniqueList);
      }
    } catch (err) {
      console.error("Failed to fetch all users:", err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setLiveVisitors(prev => {
        const change = Math.floor(Math.random() * 3) - 1; // -1 to +1
        const newValue = prev + change;
        return Math.max(1, Math.min(7, newValue));
      });
    }, 30000); // update every 30s
    return () => clearInterval(interval);
  }, []);

  // Brands Management State
  const [brands, setBrands] = useState<BrandItem[]>([]);
  const [editingBrandId, setEditingBrandId] = useState<string | null>(null);
  const [brandFormName, setBrandFormName] = useState("");
  const [brandFormType, setBrandFormType] = useState("");
  const [brandFormIcon, setBrandFormIcon] = useState("🏭");
  const [brandFormLogoUrl, setBrandFormLogoUrl] = useState("");

  const handleGenerateAiMarketing = async () => {
    if (!aiMarketingProduct) return;
    const selectedProd = products.find(p => p.id === aiMarketingProduct);
    if (!selectedProd) return;

    setAiMarketingLoading(true);
    setAiMarketingDesc("");
    setAiMarketingPitch("");
    setAiMarketingAdvice("");
    
    try {
      // 1. Describe Endpoint
      const descRes = await fetch("/api/ai/describe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: selectedProd.name, category: selectedProd.category })
      });
      if (descRes.ok) {
        const descData = await descRes.json();
        setAiMarketingDesc(descData.description || descData.text || "");
      }

      // 2. Pitch Endpoint
      const pitchRes = await fetch("/api/ai/pitch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productName: selectedProd.name, benefits: selectedProd.description })
      });
      if (pitchRes.ok) {
        const pitchData = await pitchRes.json();
        setAiMarketingPitch(pitchData.pitch || pitchData.text || "");
      }

      // 3. Advisor Endpoint
      const advRes = await fetch("/api/ai/advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: `تحلیل سود و استراتژی فروش برای کالا: ${selectedProd.name} از برند ${selectedProd.brand}. قیمت عمده واحد ${selectedProd.bulk_price} تومان و قیمت تک‌فروشی واحد ${selectedProd.price} تومان است.` })
      });
      if (advRes.ok) {
        const advData = await advRes.json();
        setAiMarketingAdvice(advData.advice || advData.text || "");
      }

    } catch (err) {
      console.error("AI Marketing gen failed:", err);
      setErrorMsg("خطا در برقراری ارتباط با هسته هوش مصنوعی تجاری.");
      setTimeout(() => setErrorMsg(null), 3000);
    } finally {
      setAiMarketingLoading(false);
    }
  };

  const handleApplyAiDescription = async () => {
    if (!aiMarketingProduct || !aiMarketingDesc) return;
    try {
      setLoading(true);
      await onUpdateProduct(aiMarketingProduct, { description: aiMarketingDesc });
      setSuccessMsg("توصیف کاتالوگ کالا با محتوای بازاریابی هوش مصنوعی با موفقیت به‌روزرسانی شد.");
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      setErrorMsg("خطا در اعمال تغییرات هوش مصنوعی.");
    } finally {
      setLoading(false);
    }
  };

  // Barter Logic Handlers
  const handleCreateOrUpdateBarter = () => {
    if (!bFormFactory || !bFormSupplier || !bFormProductId) {
      setErrorMsg("لطفاً تمامی فیلدهای الزامی را پر کنید.");
      setTimeout(() => setErrorMsg(null), 4000);
      return;
    }

    const mat = rawMaterials.find(r => r.id === bFormMaterialId) || rawMaterials[0];
    const prod = products.find(p => p.id === bFormProductId);
    const materialValue = bFormMaterialQty * mat.pricePerUnit;
    
    // Calculate equivalent cartons
    const productPrice = prod ? prod.bulk_price : 150000;
    const cartons = Math.round(materialValue / (productPrice || 150000));

    if (editingBarterId) {
      setBarterDeals(prev => prev.map(item => {
        if (item.id === editingBarterId) {
          return {
            ...item,
            factoryName: bFormFactory,
            supplierName: bFormSupplier,
            materialName: mat.name,
            materialQty: Number(bFormMaterialQty).toLocaleString(),
            materialUnit: mat.unit,
            materialPricePerUnit: mat.pricePerUnit,
            totalMaterialValue: materialValue,
            requestedProductId: bFormProductId,
            requestedProductName: prod ? prod.name : "محصول سفارشی کارخانه",
            requestedQtyCartons: cartons,
            description: bFormDesc,
            status: bFormStatus
          };
        }
        return item;
      }));
      setSuccessMsg("قرارداد تهاتر با موفقیت ویرایش و ثبت گردید.");
    } else {
      const newDeal = {
        id: "barter_" + Date.now(),
        factoryName: bFormFactory,
        supplierName: bFormSupplier,
        materialName: mat.name,
        materialQty: Number(bFormMaterialQty).toLocaleString(),
        materialUnit: mat.unit,
        materialPricePerUnit: mat.pricePerUnit,
        totalMaterialValue: materialValue,
        requestedProductId: bFormProductId,
        requestedProductName: prod ? prod.name : "محصول سفارشی کارخانه",
        requestedQtyCartons: cartons,
        dealDate: new Date().toLocaleDateString("fa-IR"),
        status: "در انتظار تایید مدارک",
        description: bFormDesc
      };
      setBarterDeals(prev => [newDeal, ...prev]);
      setSuccessMsg("درخواست تهاتر کالا و مواد اولیه جدید با موفقیت ثبت و به کارتابل کارخانه ارسال گردید.");
    }

    // Reset Form
    setIsAddingBarter(false);
    setEditingBarterId(null);
    setBFormFactory("");
    setBFormSupplier("");
    setBFormDesc("");
    setBFormStatus("در انتظار تایید مدارک");
    
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const handleEditBarterClick = (deal: any) => {
    setEditingBarterId(deal.id);
    setBFormFactory(deal.factoryName);
    setBFormSupplier(deal.supplierName);
    setBFormDesc(deal.description || "");
    setBFormStatus(deal.status);
    
    const mat = rawMaterials.find(r => r.name === deal.materialName);
    if (mat) setBFormMaterialId(mat.id);
    
    const prod = products.find(p => p.name === deal.requestedProductName);
    if (prod) setBFormProductId(prod.id);
    
    setIsAddingBarter(true);
  };

  const handleDeleteBarter = (id: string) => {
    setBarterDeals(prev => prev.filter(b => b.id !== id));
    setSuccessMsg("قرارداد تهاتر مربوطه با موفقیت از سیستم حذف شد.");
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const handleUpdateBarterStatus = (id: string, newStatus: string) => {
    setBarterDeals(prev => prev.map(b => b.id === id ? { ...b, status: newStatus } : b));
    setSuccessMsg(`وضعیت تهاتر به "${newStatus}" تغییر یافت.`);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  // Orders states
  const [editingOrder, setEditingOrder] = useState<any | null>(null);
  const [editBuyerName, setEditBuyerName] = useState("");
  const [editBuyerPhone, setEditBuyerPhone] = useState("");
  const [editBuyerCompany, setEditBuyerCompany] = useState("");
  const [editBuyerAddress, setEditBuyerAddress] = useState("");
  const [editTotalAmount, setEditTotalAmount] = useState<number | string>("");
  const [editPaymentStatus, setEditPaymentStatus] = useState("");
  const [showDirectInvoiceModal, setShowDirectInvoiceModal] = useState<any | null>(null);
  const [directPaymentStatus, setDirectPaymentStatus] = useState("naghdi");
  const [directShippingMethod, setDirectShippingMethod] = useState("peyk");
  const [directAddress, setDirectAddress] = useState("");
  const [directInvoiceItems, setDirectInvoiceItems] = useState<any[]>([]);
  const handleCreateDirectInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg("فاکتور با موفقیت ایجاد شد.");
    setShowDirectInvoiceModal(null);
  };
  const [orders, setOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [crmLoading, setCrmLoading] = useState(false);
  const [ordersSearch, setOrdersSearch] = useState("");

  const fetchOrders = async () => {
    setOrdersLoading(true);
    const orderMap: Record<string, any> = {};

    // 1. Try backend PHP/MySQL API first
    try {
      const apiEndpoints = ['/api/b2b/orders', '/php/api.php?action=b2b/orders'];
      for (const endpoint of apiEndpoints) {
        try {
          const res = await fetch(endpoint);
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data) && data.length > 0) {
              data.forEach((item: any) => {
                const key = String(item.id || item.tracking_number || item.trackingNumber || Math.random());
                orderMap[key] = {
                  id: item.id || item.tracking_number,
                  trackingNumber: item.tracking_number || item.trackingNumber || `DO-${String(item.id || '').slice(-6)}`,
                  buyerName: item.buyer_name || item.buyerName || "مشتری همکار",
                  buyerPhone: item.buyer_phone || item.buyerPhone || item.phone || item.mobile || "ثبت نشده",
                  buyerCompany: item.buyer_company || item.buyerCompany || "",
                  buyerAddress: item.buyer_address || item.buyerAddress || "",
                  totalAmount: Number(item.total_amount || item.totalAmount || 0),
                  items: Array.isArray(item.items) ? item.items : (typeof item.items_json === 'string' ? JSON.parse(item.items_json || '[]') : []),
                  status: item.status || 'pending',
                  createdAt: item.created_at || item.createdAt || new Date().toISOString(),
                  ...item
                };
              });
              break;
            }
          }
        } catch (e) {}
      }
    } catch (err) {
      console.warn("Backend API orders fetch notice:", err);
    }

    // 2. Try Firestore live collection
    try {
      const ordersQuery = query(collection(db, "orders"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(ordersQuery);
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const key = String(docSnap.id || data.trackingNumber || Math.random());
        if (!orderMap[key]) {
          orderMap[key] = {
            id: docSnap.id,
            trackingNumber: data.trackingNumber || `DO-${docSnap.id.slice(-6)}`,
            buyerName: data.buyerName || data.buyer || "مشتری سازمانی",
            buyerPhone: data.buyerPhone || data.customerPhone || data.phone || data.mobile || data.userPhone || data.buyerInfo?.phone || data.buyerInfo?.mobile || "ثبت نشده",
            buyerCompany: data.buyerCompany || "",
            buyerAddress: data.buyerAddress || data.buyerInfo?.address || "",
            totalAmount: Number(data.totalAmount || data.amount || 0),
            items: Array.isArray(data.items) ? data.items : [],
            status: data.status || 'pending',
            createdAt: data.createdAt || new Date().toISOString(),
            ...data
          };
        }
      });
    } catch (e) {
      console.warn("Firestore orders fetch notice:", e);
    }

    // 3. Merge with localStorage cache
    try {
      const local = JSON.parse(localStorage.getItem("dastavval_orders_cache") || "[]");
      const raw = JSON.parse(localStorage.getItem("dastavval_raw_orders") || "[]");
      const combined = [...local, ...raw];
      combined.forEach((item: any) => {
        const key = String(item.id || item.trackingNumber || Math.random());
        if (!orderMap[key]) {
          orderMap[key] = item;
        }
      });
    } catch (err) {}

    const finalOrders: any[] = Object.values(orderMap);

    if (finalOrders.length > 0) {
      // Sort newest first
      finalOrders.sort((a: any, b: any) => {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        return dateB - dateA;
      });
      setOrders(finalOrders);
      localStorage.setItem("dastavval_orders_cache", JSON.stringify(finalOrders));
    } else {
      // Sample fallback order
      if (localStorage.getItem("dastavval_hide_mock_data") === "true") {
        setOrders([]);
      } else {
        setOrders([
          {
            id: "3001",
            trackingNumber: "DO-3001",
            buyerName: "شرکت پخش مواد غذایی پاک",
            buyerPhone: "09123456789",
            buyerCompany: "پخش پاک",
            totalAmount: 185000000,
            items: [
              { name: "روغن مایع آفتابگردان ۱.۵ لیتری", quantityCartons: 50, pricePerCarton: 420000, brand: "کارخانه کشت و صنعت" },
              { name: "تن ماهی ۱۸۰ گرمی", quantityCartons: 30, pricePerCarton: 2900000, brand: "صنایع غذایی شیلات" }
            ],
            status: "confirmed",
            createdAt: new Date().toISOString()
          }
        ]);
      }
    }

    setOrdersLoading(false);
  };



  const loadCrmCustomers = async () => {
    setCrmLoading(true);
    try {
      const data = await fetchCRMCustomers();
      setCrmCustomers(data);
    } catch (e) {
      console.error("Failed to load CRM customers", e);
    } finally {
      setCrmLoading(false);
    }
  };

  useEffect(() => {
    if (activeSubTab === 'orders') {
      fetchOrders();
    } else if (activeSubTab === 'crm') {
      loadCrmCustomers();
      loadCallbackRequests();
      loadSupportTickets();
    } else if (activeSubTab === 'safe_buy') {
      // Handled by AdminSafeBuy component
    } else if (activeSubTab === 'dashboard' || activeSubTab === 'approvals') {
      fetchOrders();
      loadCallbackRequests();
      loadSupportTickets();
      onUpdateReps();
    }
  }, [activeSubTab]);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "dastavval_sponsored_ads_v2" && (activeSubTab === 'ads' || activeSubTab === 'dashboard' || activeSubTab === 'approvals')) {
        try {
          if (e.newValue) setSponsoredAds(JSON.parse(e.newValue));
        } catch (err) {}
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [activeSubTab]);

  useEffect(() => {
    fetchOrders();
    fetchSafeBuyRequests();
    loadCallbackRequests();
    loadSupportTickets();
    onUpdateReps();

    const handleNewCallback = () => {
      loadCallbackRequests();
    };

    const handleSync = () => {
      fetchOrders();
      fetchSafeBuyRequests();
      loadCallbackRequests();
      loadSupportTickets();
      onUpdateReps();
    };

    window.addEventListener("dastavval_callback_added", handleNewCallback);
    window.addEventListener("dastavval-manual-sync", handleSync);
    return () => {
      window.removeEventListener("dastavval_callback_added", handleNewCallback);
      window.removeEventListener("dastavval-manual-sync", handleSync);
    };
  }, []);

  const handleUpdateOrderStatus = async (orderId: string, nextStatus: string) => {
    try {
      const orderRef = doc(db, "orders", orderId);
      await updateDoc(orderRef, { status: nextStatus });
      setSuccessMsg("وضعیت فاکتور عمده با موفقیت در زنجیره تامین به روز رسانی شد.");
      fetchOrders();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (e) {
      console.error("Error updating order status:", e);
      setErrorMsg("خطا در بروزرسانی وضعیت فاکتور.");
      setTimeout(() => setErrorMsg(null), 4000);
    }
  };

  const formatOrderDate = (createdAt: any) => {
    if (!createdAt) return "هم‌اکنون";
    try {
      if (createdAt.seconds) {
        return new Date(createdAt.seconds * 1000).toLocaleDateString("fa-IR", {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit"
        });
      }
      return new Date(createdAt).toLocaleDateString("fa-IR", {
        year: "numeric",
        month: "long",
        day: "numeric"
      });
    } catch (e) {
      return "اخیراً";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'order_received': return { text: "در انتظار بررسی اولیه", color: "text-blue-600 bg-blue-50 border-blue-200" };
      case 'payment_verified': return { text: "تایید مالی واریز/چک", color: "text-indigo-600 bg-indigo-50 border-indigo-200" };
      case 'warehouse_packing': return { text: "جمع‌آوری و بسته‌بندی انبار", color: "text-amber-600 bg-amber-50 border-amber-200" };
      case 'loading_freight': return { text: "بارگیری و تحویل باربری", color: "text-purple-600 bg-purple-50 border-purple-200" };
      case 'in_transit': 
      case 'shipped': return { text: "در حال حمل و ارسال (ترانزیت)", color: "text-emerald-600 bg-emerald-50 border-emerald-200" };
      case 'delivered': return { text: "تحویل نهایی به خریدار", color: "text-teal-600 bg-teal-50 border-teal-200" };
      case 'cancelled': return { text: "لغو شده", color: "text-rose-600 bg-rose-50 border-rose-200" };
      default: return { text: "در حال پردازش", color: "text-slate-600 bg-slate-50 border-slate-200" };
    }
  };

  // CRM states
  const [crmCustomers, setCrmCustomers] = useState<CRMCustomer[]>([]);

  // Callbacks and Tickets state
  const [callbackRequests, setCallbackRequests] = useState<any[]>([]);
  const [supportTickets, setSupportTickets] = useState<any[]>([]);
  const [callbacksLoading, setCallbacksLoading] = useState(false);

  const loadCallbackRequests = async () => {
    setCallbacksLoading(true);
    try {
      const fetched = await fetchCallbackRequests();
      setCallbackRequests(fetched);
    } catch (e) {
      console.error("Error loading callback requests:", e);
    } finally {
      setCallbacksLoading(false);
    }
  };

  const loadSupportTickets = async () => {
    try {
      const ticketsQuery = query(collection(db, "tickets"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(ticketsQuery);
      const fetchedTickets: any[] = [];
      querySnapshot.forEach((doc) => {
        fetchedTickets.push({ id: doc.id, ...doc.data() });
      });
      // Fallback if empty and we have local storage or mock
      if (fetchedTickets.length === 0) {
        const saved = localStorage.getItem("dastavval_tickets");
        if (saved) {
          try {
            fetchedTickets.push(...JSON.parse(saved));
          } catch (e) {}
        }
      } else {
        localStorage.setItem("dastavval_tickets", JSON.stringify(fetchedTickets));
      }
      // Sort by date desc
      fetchedTickets.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      setSupportTickets(fetchedTickets);
    } catch (e) {
      console.error("Error fetching support tickets:", e);
      // fallback to localStorage
      const saved = localStorage.getItem("dastavval_tickets");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          parsed.sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
          setSupportTickets(parsed);
        } catch (e) {}
      }
    }
  };

  const handleUpdateTicketStatus = async (id: string, newStatus: string) => {
    try {
      const docRef = doc(db, "tickets", id);
      await updateDoc(docRef, { status: newStatus });
      setSuccessMsg("وضعیت تیکت پشتیبانی به روز رسانی شد.");
      loadSupportTickets();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (e) {
      console.error(e);
      // fallback local update
      const saved = localStorage.getItem("dastavval_tickets");
      if (saved) {
        try {
          let currentList = JSON.parse(saved);
          currentList = currentList.map((t: any) => t.id === id ? { ...t, status: newStatus } : t);
          localStorage.setItem("dastavval_tickets", JSON.stringify(currentList));
          setSupportTickets(currentList);
        } catch (err) {}
      }
    }
  };

  const handleUpdateCallback = async (id: string, status: 'pending' | 'called' | 'archived', notes: string = "") => {
    try {
      await updateCallbackStatus(id, status, notes);
      setSuccessMsg("وضعیت درخواست تماس بروزرسانی شد.");
      loadCallbackRequests();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteCallback = async (id: string) => {
    if (confirm("آیا از حذف این درخواست تماس مطمئن هستید؟")) {
      try {
        await deleteCallbackRequest(id);
        setSuccessMsg("درخواست تماس با موفقیت حذف شد.");
        loadCallbackRequests();
        setTimeout(() => setSuccessMsg(null), 4000);
      } catch (e) {
        console.error(e);
      }
    }
  };

  // Form states for Product
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [processingProductId, setProcessingProductId] = useState<string | null>(null);
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number; message: string } | null>(null);
  const [inlineEditingId, setInlineEditingId] = useState<string | null>(null);
  const [inlinePriceVal, setInlinePriceVal] = useState<number>(0);
  const [inlineStockVal, setInlineStockVal] = useState<number>(0);

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {}
  });

  const confirmAction = (title: string, message: string, onConfirm: () => void) => {
    setConfirmDialog({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        onConfirm();
      }
    });
  };

  // Barter (تهاتر کالا و مواد اولیه) States
  const [barterDeals, setBarterDeals] = useState<any[]>([]);

  const [rawMaterials, setRawMaterials] = useState<any[]>([]);

  const [isAddingBarter, setIsAddingBarter] = useState(false);
  const [editingBarterId, setEditingBarterId] = useState<string | null>(null);

  // Form states for new Barter deal
  const [bFormFactory, setBFormFactory] = useState("");
  const [bFormSupplier, setBFormSupplier] = useState("");
  const [bFormMaterialId, setBFormMaterialId] = useState("rm1");
  const [bFormMaterialQty, setBFormMaterialQty] = useState(10000);
  const [bFormProductId, setBFormProductId] = useState("");
  const [bFormDesc, setBFormDesc] = useState("");
  const [bFormStatus, setBFormStatus] = useState("در انتظار تایید مدارک");

  const [cacheStatus, setCacheStatus] = useState<CacheStatus>({ isHealthy: false, itemCount: 0, lastUpdate: null });
  const [isCacheExpanded, setIsCacheExpanded] = useState(false);
  const [isClearingCache, setIsClearingCache] = useState(false);

  const checkCacheStatus = async () => {
    const status = await getCacheStatus();
    setCacheStatus(status);
  };

  useEffect(() => {
    checkCacheStatus();
    const interval = setInterval(checkCacheStatus, 15000);
    return () => clearInterval(interval);
  }, [products]);

  // AI Settings states
  const [showAiSettings, setShowAiSettings] = useState(false);
  const [adminCategory, setAdminCategory] = useState<'monitoring' | 'catalog' | 'sales' | 'system' | 'ads'>('monitoring');
  const [aiProvider, setAiProvider] = useState("gemini");
  const [aiApiKey, setAiApiKey] = useState("");
  const [aiEndpointUrl, setAiEndpointUrl] = useState("https://api.gapgpt.ir/v1");
  const [aiConfigMsg, setAiConfigMsg] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Branding states
  const [customAppName, setCustomAppName] = useState("دست اول");
  const [customAppSub, setCustomAppSub] = useState("مرجع مبادلات مستقیم و تامین کالای عمده");
  const [customTopAnnouncement, setCustomTopAnnouncement] = useState("🚀 تخفیف ویژه جشنواره تابستانه کارخانجات - ارسال مستقیم و هماهنگ‌شده بر اساس ضوابط کارخانه");
  const [customShowTopAnnouncement, setCustomShowTopAnnouncement] = useState(false);
  const [customTopAnnouncementPopupTitle, setCustomTopAnnouncementPopupTitle] = useState("جزئیات جشنواره تابستانه دست اول");
  const [customTopAnnouncementPopupContent, setCustomTopAnnouncementPopupContent] = useState("همکار گرامی، برخی کارخانجات در جشنواره تابستانه بسته به شرایط خرید، هزینه حمل و نقل تا باربری شهر مقصد را پرداخت می‌نمایند و برخی دیگر نیز ارسال با کمترین هزینه ترانزیت خط تولید را دارند.");
  const [customSlides, setCustomSlides] = useState<SlideItem[]>([]);
  const [selectedColor, setSelectedColor] = useState("emerald");
  const [catalogPdfUrl, setCatalogPdfUrl] = useState("");
  const [customLogoUrl, setCustomLogoUrl] = useState("/assets/logo.svg");
  const [mascotUrl, setMascotUrl] = useState("/assets/mascot_character.jpg");
  const [catalogJsonSyncUrl, setCatalogJsonSyncUrl] = useState("http://c102393.parspack.net/c102393/catalog.json");
  const [isSyncingCatalogJsonUrl, setIsSyncingCatalogJsonUrl] = useState(false);
  const [enamadImage, setEnamadImage] = useState("");
  const [enamadCode, setEnamadCode] = useState("");
  const [enamadUrl, setEnamadUrl] = useState("https://trustseal.enamad.ir");
  const [samandehiImage, setSamandehiImage] = useState("");
  const [samandehiCode, setSamandehiCode] = useState("");
  const [samandehiUrl, setSamandehiUrl] = useState("https://logo.samandehi.ir");
  const [tradeUnionImage, setTradeUnionImage] = useState("");
  const [tradeUnionCode, setTradeUnionCode] = useState("IR-9044502");
  const [tradeUnionUrl, setTradeUnionUrl] = useState("https://dastavval.com/license");
  const [hideEnamad, setHideEnamad] = useState(false);
  const [hideSamandehi, setHideSamandehi] = useState(false);
  const [hideTradeUnion, setHideTradeUnion] = useState(false);
  const [hideSsl, setHideSsl] = useState(false);
  const [customBadges, setCustomBadges] = useState<any[]>([]);
  const [newBadgeTitle, setNewBadgeTitle] = useState("");
  const [newBadgeSubtitle, setNewBadgeSubtitle] = useState("");
  const [newBadgeUrl, setNewBadgeUrl] = useState("");
  const [newBadgeImage, setNewBadgeImage] = useState("");
  const [zarinpalMerchantCode, setZarinpalMerchantCode] = useState("");
  const [officialSealUrl, setOfficialSealUrl] = useState("");
  const [brandImages, setBrandImages] = useState<any[]>([]);
  const [adsMainTab, setAdsMainTab] = useState<'billboard' | 'equipment' | 'services' | 'raw_materials'>('billboard');

  const [equipmentAds, setEquipmentAds] = useState<any[]>(() => {
    if (b2bConfig?.equipmentAds && Array.isArray(b2bConfig.equipmentAds)) {
      return b2bConfig.equipmentAds;
    }
    try {
      const saved = localStorage.getItem("dastavval_industrial_equipment");
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });

  const [serviceAds, setServiceAds] = useState<any[]>(() => {
    if (b2bConfig?.serviceAds && Array.isArray(b2bConfig.serviceAds)) {
      return b2bConfig.serviceAds;
    }
    try {
      const saved = localStorage.getItem("dastavval_industrial_services");
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });

  const [rawMaterialAds, setRawMaterialAds] = useState<any[]>(() => {
    if (b2bConfig?.rawMaterialAds && Array.isArray(b2bConfig.rawMaterialAds)) {
      return b2bConfig.rawMaterialAds;
    }
    try {
      const saved = localStorage.getItem("dastavval_raw_materials");
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });

  const [editingAdItem, setEditingAdItem] = useState<{ type: 'equipment' | 'service' | 'raw_material'; data: any } | null>(null);

  const [sponsoredAds, setSponsoredAds] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem("dastavval_sponsored_ads_v2");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return [];
  });
  const [selectedAdIds, setSelectedAdIds] = useState<string[]>([]);

  useEffect(() => {
    const loadAds = () => {
      try {
        const saved = localStorage.getItem("dastavval_sponsored_ads_v2");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) setSponsoredAds(parsed);
        }
        const savedEq = localStorage.getItem("dastavval_industrial_equipment");
        if (savedEq) setEquipmentAds(JSON.parse(savedEq));
        const savedSrv = localStorage.getItem("dastavval_industrial_services");
        if (savedSrv) setServiceAds(JSON.parse(savedSrv));
        const savedRaw = localStorage.getItem("dastavval_raw_materials");
        if (savedRaw) setRawMaterialAds(JSON.parse(savedRaw));
      } catch (e) {}
    };
    loadAds();
    window.addEventListener("storage", loadAds);
    window.addEventListener("dastavval_ads_updated", loadAds);
    window.addEventListener("dastavval-ads-sync", loadAds);
    return () => {
      window.removeEventListener("storage", loadAds);
      window.removeEventListener("dastavval_ads_updated", loadAds);
      window.removeEventListener("dastavval-ads-sync", loadAds);
    };
  }, []);

  const getProductDetailsForSafeBuy = (req: any) => {
    if (!req) return {
      title: 'کالای سفارشی دست‌اول (زیر قیمت کف)',
      brand: 'تأمین‌کننده رسمی / معتبر همکار',
      quantity: '۱۰۰ عدد (بسته‌بندی عمده)',
      wholesalePrice: 'توافقی (زیر قیمت بازار)',
      marketPrice: 'تعیین نشده',
      buyerProfit: '۱۲٪ الی ۱۵٪ سود ناخالص عمده‌فروشی',
      description: 'این کالا به صورت مستقیم و بدون واسطه از کارخانه یا تأمین‌کننده دست‌اول تهیه می‌شود و دارای ضمانت اصالت و سلامت فیزیکی است.',
      imageUrl: 'https://images.unsplash.com/photo-1607344645866-009c320c5ab8?auto=format&fit=crop&q=80&w=400'
    };
    
    // 1. Try to find in sponsoredAds
    const adsRaw = localStorage.getItem("dastavval_sponsored_ads_v2");
    let adsList: any[] = sponsoredAds;
    if (adsRaw) {
      try {
        adsList = JSON.parse(adsRaw);
      } catch (e) {}
    }
    
    const ad = adsList.find(a => String(a.id) === String(req.adId) || String(a.id) === String(req.productId));
    // 2. Try to find in products prop
    const prod = products?.find(p => String(p.id) === String(req.productId) || String(p.id) === String(req.adId));
    
    const isInvalid = (val: any) => !val || val === 'نامشخص' || val === 'undefined';
    
    const title = (!isInvalid(req.productTitle) ? req.productTitle : '') || (!isInvalid(req.productName) ? req.productName : '') || ad?.title || prod?.name || 'کالای سفارشی دست‌اول (زیر قیمت کف)';
    const brand = (!isInvalid(req.brand) ? req.brand : '') || ad?.factoryName || prod?.brand || prod?.factoryName || 'تأمین‌کننده رسمی / معتبر همکار';
    const quantity = (!isInvalid(req.quantity) ? req.quantity : '') || ad?.quantity || '۱۰۰ عدد (بسته‌بندی عمده)';
    const wholesalePrice = (!isInvalid(req.wholesalePrice) ? req.wholesalePrice : '') || ad?.wholesalePrice || (prod?.price ? prod.price.toLocaleString('fa-IR') + ' تومان' : '') || 'توافقی (زیر قیمت بازار)';
    const marketPrice = (!isInvalid(req.marketPrice) ? req.marketPrice : '') || ad?.marketPrice || (prod?.consumer_price ? prod.consumer_price.toLocaleString('fa-IR') + ' تومان' : '') || 'تعیین نشده';
    const buyerProfit = (!isInvalid(req.buyerProfit) ? req.buyerProfit : '') || ad?.buyerProfit || '۱۲٪ الی ۱۵٪ سود ناخالص عمده‌فروشی';
    const description = (!isInvalid(req.description) ? req.description : '') || ad?.description || prod?.description || 'توضیحات تکمیلی توسط خریدار ارائه نشده است. کالا با تضمین سلامت فیزیکی و اصالت کالا تحت بستر امن دست‌اول معامله می‌شود.';
    const imageUrl = ad?.imageUrl || prod?.image_url || 'https://images.unsplash.com/photo-1607344645866-009c320c5ab8?auto=format&fit=crop&q=80&w=400';
    
    return {
      title,
      brand,
      quantity,
      wholesalePrice,
      marketPrice,
      buyerProfit,
      description,
      imageUrl
    };
  };

  const [selectedAdForView, setSelectedAdForView] = useState<any | null>(null);
  const [adsFilter, setAdsFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [adsCategoryFilter, setAdsCategoryFilter] = useState<'all' | 'under_market' | 'buy' | 'sell' | 'barter' | 'liquid' | 'direct_supply'>('all');
  const [showRejectionReasonModal, setShowRejectionReasonModal] = useState(false);
  const [rejectionReasonInput, setRejectionReasonInput] = useState("");
  const [adToReject, setAdToReject] = useState<any | null>(null);
  const [adToEdit, setAdToEdit] = useState<any>(null);
  const [editAdForm, setEditAdForm] = useState<any>(null);

  const updateAdsState = async (newAds: any[], msg: string) => {
    setSponsoredAds(newAds);
    localStorage.setItem("dastavval_sponsored_ads_v2", JSON.stringify(newAds));
    if (onUpdateB2bConfig && b2bConfig) { await onUpdateB2bConfig({ ...b2bConfig, sponsoredAds: newAds }); }
    window.dispatchEvent(new Event("storage"));
    window.dispatchEvent(new CustomEvent("dastavval_ads_updated"));
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 2000);
  };

  const handleUpdateAd = () => {
    if (!editAdForm) return;
    const newAds = sponsoredAds.map(a => a.id === editAdForm.id ? editAdForm : a);
    updateAdsState(newAds, "آگهی با موفقیت به‌روزرسانی شد.");
    setAdToEdit(null);
    setEditAdForm(null);
  };

  const handleUpdateAdStatus = async (adId: string, status: 'approved' | 'rejected' | 'pending', rejectionReason?: string) => {
    let found = false;
    if (sponsoredAds.some(a => a.id === adId)) {
      found = true;
      const ad = sponsoredAds.find(a => a.id === adId);
      const newAds = sponsoredAds.map(a => a.id === adId ? { ...a, status, rejectionReason: rejectionReason || '' } : a);
      updateAdsState(newAds, status === 'approved' ? "آگهی با موفقیت تایید و در تالار منتشر شد." : "وضعیت آگهی بروزرسانی شد.");
      if (status === 'approved' && ad && ad.phone) {
        try {
          fetch("/api/sms/send-ad-status-sms", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phone: ad.phone, userName: ad.userName || ad.ownerName || "کاربر گرامی", adTitle: ad.title || "آگهی شما", status: 'approved' }) });
        } catch (e) {}
      }
      return;
    }
    if (rawMaterialAds.some(a => a.id === adId)) {
      found = true;
      const newAds = rawMaterialAds.map(a => a.id === adId ? { ...a, status, isPendingApproval: status !== 'approved', rejectionReason: rejectionReason || '' } : a);
      setRawMaterialAds(newAds);
      localStorage.setItem("dastavval_raw_materials", JSON.stringify(newAds));
      if (onUpdateB2bConfig && b2bConfig) await onUpdateB2bConfig({ ...b2bConfig, rawMaterialAds: newAds });
    } else if (equipmentAds.some(a => a.id === adId)) {
      found = true;
      const newAds = equipmentAds.map(a => a.id === adId ? { ...a, status, isPendingApproval: status !== 'approved', rejectionReason: rejectionReason || '' } : a);
      setEquipmentAds(newAds);
      localStorage.setItem("dastavval_industrial_equipment", JSON.stringify(newAds));
      if (onUpdateB2bConfig && b2bConfig) await onUpdateB2bConfig({ ...b2bConfig, equipmentAds: newAds });
    } else if (serviceAds.some(a => a.id === adId)) {
      found = true;
      const newAds = serviceAds.map(a => a.id === adId ? { ...a, status, isPendingApproval: status !== 'approved', rejectionReason: rejectionReason || '' } : a);
      setServiceAds(newAds);
      localStorage.setItem("dastavval_industrial_services", JSON.stringify(newAds));
      if (onUpdateB2bConfig && b2bConfig) await onUpdateB2bConfig({ ...b2bConfig, serviceAds: newAds });
    }
    if (found) {
      setSuccessMsg(status === 'approved' ? "آگهی با موفقیت تایید و منتشر شد." : "وضعیت آگهی بروزرسانی شد.");
      setTimeout(() => setSuccessMsg(null), 2000);
      window.dispatchEvent(new Event("storage"));
    }
  };

  const handleEditAdFromApprovals = async (adId: string, updatedFields: any) => {
    const newAds = sponsoredAds.map(a => a.id === adId ? { ...a, ...updatedFields } : a);
    updateAdsState(newAds, "آگهی با موفقیت ویرایش شد.");
    if (onUpdateB2bConfig && b2bConfig) {
      await onUpdateB2bConfig({ ...b2bConfig, sponsoredAds: newAds });
    }
  };

  const handleUpdateRepStatus = (id: string, isApproved: boolean, badge?: string) => {
    const updated = representativesList.map(r => 
      (r.id === id || r.agencyCode === id) 
        ? { 
            ...r, 
            isApproved, 
            status: isApproved ? 'active' : 'rejected',
            badge: badge || r.badge || 'نماینده رسمی',
            approvedAt: isApproved ? new Date().toISOString() : r.approvedAt,
            lastPurchaseAt: isApproved ? new Date().toISOString() : r.lastPurchaseAt // Initialize last purchase on approval
          } 
        : r
    );
    setRepresentativesList(updated);
    localStorage.setItem("dastavval_representatives", JSON.stringify(updated));

    // Also synchronize registered user in dastavval_local_users & push to backend
    try {
      const localUsers = JSON.parse(localStorage.getItem("dastavval_local_users") || "{}");
      let userUpdated = false;
      const targetRep = updated.find(r => r.id === id || r.agencyCode === id);
      
      Object.keys(localUsers).forEach(key => {
        const u = localUsers[key];
        if (u && (u.userCode === id || u.agencyCode === id || (targetRep && (u.phone === targetRep.phone || u.email === targetRep.email)))) {
          localUsers[key] = {
            ...u,
            role: 'representative',
            isRepresentativeApproved: isApproved,
            agencyApproved: isApproved,
            status: isApproved ? 'active' : 'rejected',
            agencyCode: targetRep?.agencyCode || u.agencyCode,
            badge: badge || targetRep?.badge || u.badge || 'نماینده رسمی'
          };
          userUpdated = true;
        }
      });

      if (userUpdated) {
        localStorage.setItem("dastavval_local_users", JSON.stringify(localUsers));
        try {
          fetch("/api/b2b/users", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(localUsers)
          }).catch(() => {});
        } catch (e) {}
      }
    } catch (err) {
      console.warn("Error updating user status for rep:", err);
    }

    setSuccessMsg(isApproved ? "درخواست عاملیت و نمایندگی با موفقیت تایید شد." : "درخواست نمایندگی رد شد.");
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleAuditReps = () => {
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const updated = representativesList.map(r => {
      if (r.isApproved && r.status === 'active' && r.lastPurchaseAt) {
        const lastPurchase = new Date(r.lastPurchaseAt);
        if (lastPurchase < threeMonthsAgo) {
          return { ...r, status: 'inactive', deactivationReason: 'عدم خرید به مدت بیش از ۳ ماه' };
        }
      }
      return r;
    });

    setRepresentativesList(updated);
    localStorage.setItem("dastavval_representatives", JSON.stringify(updated));
    setSuccessMsg("حسابرسی نمایندگان انجام شد. پنل‌های غیرفعال تعلیق گردیدند.");
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleUpdateSupplierStatus = async (id: string, status: 'active' | 'suspended' | 'pending') => {
    setLoading(true);
    try {
      // Find in local list first
      const sup = suppliersList.find(s => (s.id === id || s.email === id));
      if (!sup) throw new Error("Supplier not found");

      // 1. Update status in Firestore (suppliers collection)
      const q = query(collection(db, "suppliers"), where("email", "==", sup.email));
      const snap = await getDocs(q);
      if (!snap.empty) {
        await updateDoc(doc(db, "suppliers", snap.docs[0].id), { status });
      }

      // 1.5 Sync approved status inside local users database to enable instant logins
      try {
        const localUsers = JSON.parse(localStorage.getItem("dastavval_local_users") || "{}");
        // Find key by matching email/phone
        const userKey = Object.keys(localUsers).find(key => 
          key.toLowerCase().trim() === sup.email?.toLowerCase().trim() ||
          localUsers[key].email?.toLowerCase().trim() === sup.email?.toLowerCase().trim() ||
          localUsers[key].phone?.trim() === sup.phone?.trim()
        );
        if (userKey) {
          localUsers[userKey].status = status;
          localStorage.setItem("dastavval_local_users", JSON.stringify(localUsers));
        }
      } catch (localSyncErr) {
        console.warn("Could not sync approval status to dastavval_local_users:", localSyncErr);
      }

      // 2. If approved, add to b2bConfig factories if not already there
      if (status === 'active') {
        const factoryId = sup.factoryCode || `fac_${Date.now()}`;
        const newFactory = {
          id: factoryId,
          factoryCode: factoryId,
          name: sup.company || sup.name,
          city: sup.city || "تهران",
          province: sup.city || "تهران",
          isVerified: true,
          badge: "silver",
          category: sup.category || "تنقلات و شکلات",
          logoUrl: "https://raw.githubusercontent.com/antigravity-agent/media/main/dastavval_logo.png",
          managerName: sup.name,
          phone: sup.phone,
          status: 'active',
          rating: 5,
          location: sup.city || "تهران"
        };

        const existingFactories = b2bConfig.factories || [];
        if (!existingFactories.some((f: any) => f.factoryCode === factoryId || f.name === newFactory.name)) {
          const updatedFactories = [newFactory, ...existingFactories];
          await onUpdateB2bConfig({ ...b2bConfig, factories: updatedFactories });
        }

        // 📢 Automatic channel post for new approved factory
        try {
          triggerAutoChannelPost(
            `🏢 الحاق کارخانه جدید: ${newFactory.name}`,
            `با افتخار، کارخانه جدید "${newFactory.name}" از خطه "${newFactory.city}" پس از بررسی و احراز هویت، تایید و به شبکه توزیع سرتاسری «دست اول» ملحق شد.\n\n👤 مدیریت: ${newFactory.managerName || 'نامشخص'}\n📂 دسته‌بندی کالا: ${newFactory.category}\n\nجهت ارتباط مستقیم با واحد فروش این کارخانه، کاتالوگ آن را بررسی بفرمایید.`,
            "urgent",
            "مشاهده کارخانجات فعال",
            `#factories`
          );
        } catch (autoPostErr) {
          console.error("Failed to auto-post factory approval:", autoPostErr);
        }
      }

      // 3. Update local state
      setSuppliersList(prev => prev.map(s => (s.id === id || s.email === id) ? { ...s, status } : s));
      setSuccessMsg(status === 'active' ? "پنل کارخانه با موفقیت تایید و فعال شد." : "وضعیت کارخانه بروزرسانی شد.");
    } catch (err) {
      console.error("Error updating supplier status:", err);
      setErrorMsg("خطا در بروزرسانی وضعیت کارخانه.");
    } finally {
      setLoading(false);
      setTimeout(() => setSuccessMsg(null), 3000);
    }
  };
  const [hqAddress, setHqAddress] = useState("آذربایجان شرقی، شبستر، شهرک صنعتی شندآباد");
  const [supportPhone, setSupportPhone] = useState("۰۹۰۴ ۴۵۰ ۲۹۰۰");
  const [hideHqAddress, setHideHqAddress] = useState(false);
  const [hideSupportPhone, setHideSupportPhone] = useState(false);
  const [termsAndConditions, setTermsAndConditions] = useState("");
  const [buyerCredit, setBuyerCredit] = useState<number>(250000000);
  const [commissionRate, setCommissionRate] = useState<number>(5);
  // B2B Pricing Rules & Regional Rep Profit Sharing States
  const [customerMarkupPercent, setCustomerMarkupPercent] = useState<number>(10);
  const [marketerCommissionPercent, setMarketerCommissionPercent] = useState<number>(5);
  const [repRegionalProfitSharePercent, setRepRegionalProfitSharePercent] = useState<number>(50);
  const [repFloorSalesThreshold, setRepFloorSalesThreshold] = useState<number>(300000000);
  const [requireAdminApprovalForRep, setRequireAdminApprovalForRep] = useState<boolean>(true);
  const [categories, setCategories] = useState<any[]>([]);
  const [userLevels, setUserLevels] = useState<any[]>([]);

  // Social media states
  const [customRubikaUrl, setCustomRubikaUrl] = useState("https://rubika.ir/dastavval_official");
  const [customTelegramUrl, setCustomTelegramUrl] = useState("https://t.me/dastavval_official");
  const [customWhatsappUrl, setCustomWhatsappUrl] = useState("https://chat.whatsapp.com/dastavval_official");
  const [customInstagramUrl, setCustomInstagramUrl] = useState("https://instagram.com/dastavval_official");

  // Site Builder / Page Editor states
  const [sitePages, setSitePages] = useState<any[]>([]);
  const [activePageId, setActivePageId] = useState<string | null>(null);
  const [pageEditorContent, setPageEditorContent] = useState("");

  // Category CRUD states
  const [showCatalogPrint, setShowCatalogPrint] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [catName, setCatName] = useState("");
  const [catImage, setCatImage] = useState("");
  const [catDesc, setCatDesc] = useState("");

  // Goods JSON Import and System Backup states
  const [jsonImportText, setJsonImportText] = useState("");
  const [wpImportUrl, setWpImportUrl] = useState("");
  const [backupText, setBackupText] = useState("");

  // Order/Invoice editing states
  const [showPrintInvoice, setShowPrintInvoice] = useState<any | null>(null);


  const handleBackupSite = () => {
    const backupData = {
      products,
      articles,
      b2bConfig,
      backupDate: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `dastavval_backup_${new Date().toLocaleDateString("fa-IR").replace(/\//g, "-")}.json`;
    link.click();
    setSuccessMsg("فایل پشتیبان با موفقیت تولید و دانلود شد.");
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const handleResetSite = async () => {
    confirmAction(
      "ریست کلی سامانه",
      "⚠️ هشدار جدی: آیا از حذف تمامی محصولات و مقالات اطمینان دارید؟ این عمل غیرقابل بازگشت است.",
      async () => {
        setLoading(true);
        try {
          // Delete all products
          const productsSnap = await getDocs(collection(db, "products"));
          const deletePromises = productsSnap.docs.map(d => deleteDoc(doc(db, "products", d.id)));
          
          // Delete all news
          const newsSnap = await getDocs(collection(db, "news"));
          const newsDeletePromises = newsSnap.docs.map(d => deleteDoc(doc(db, "news", d.id)));
          
          await Promise.all([...deletePromises, ...newsDeletePromises]);
          
          if (onRefreshProducts) await onRefreshProducts();
          if (onUpdateArticles) await onUpdateArticles();
          
          setSuccessMsg("تمامی داده‌های انبار و اخبار با موفقیت پاکسازی شد.");
          setTimeout(() => setSuccessMsg(null), 4000);
        } catch (err) {
          console.error("Reset failed:", err);
          setErrorMsg("خطا در پاکسازی داده‌ها.");
          setTimeout(() => setErrorMsg(null), 4000);
        } finally {
          setLoading(false);
        }
      }
    );
  };

  // Factory management states
  const [factories, setFactories] = useState<any[]>([]);
  const [isEditingFactory, setIsEditingFactory] = useState<string | null>(null);
  const [showFactoryForm, setShowFactoryForm] = useState(false);
  const [factoryName, setFactoryName] = useState("");
  const [factoryCategory, setFactoryCategory] = useState("تنقلات و شکلات");
  const [factoryLogo, setFactoryLogo] = useState("");
  const [factoryCover, setFactoryCover] = useState("");
  const [factoryGalleryImages, setFactoryGalleryImages] = useState<{ url: string; title: string; category?: 'production' | 'machinery' | 'warehouse' | 'lab' | 'exterior' }[]>([]);
  const [newGalleryUrl, setNewGalleryUrl] = useState("");
  const [newGalleryTitle, setNewGalleryTitle] = useState("");
  const [newGalleryCategory, setNewGalleryCategory] = useState<'production' | 'machinery' | 'warehouse' | 'lab' | 'exterior'>('production');
  const [aiFactoryLoading, setAiFactoryLoading] = useState(false);
  const [factoryDesc, setFactoryDesc] = useState("");
  const [factoryLocation, setFactoryLocation] = useState("");
  const [factoryRating, setFactoryRating] = useState(4.5);
  const [factoryYear, setFactoryYear] = useState(1380);
  const [factoryPhone, setFactoryPhone] = useState("");
  const [factoryIsActive, setFactoryIsActive] = useState(true);
  const [factoryIsFeatured, setFactoryIsFeatured] = useState(false);
  const [factoryCode, setFactoryCode] = useState("");
  const [factoryProfileDesignMode, setFactoryProfileDesignMode] = useState<'simple' | 'advanced'>('simple');
  const [factoryCustomHtml, setFactoryCustomHtml] = useState("");
  const [factoryCustomCss, setFactoryCustomCss] = useState("");
  const [factoryCustomJs, setFactoryCustomJs] = useState("");
  const [factoryCatalogs, setFactoryCatalogs] = useState<{ name: string; url: string }[]>([]);
  const [newCatalogName, setNewCatalogName] = useState("");
  const [newCatalogUrl, setNewCatalogUrl] = useState("");
  const [selectedFactoryForProducts, setSelectedFactoryForProducts] = useState<any | null>(null);

  // CRM expanded states

  // Safe Buy state
  const [safeBuyRequests, setSafeBuyRequests] = useState<any[]>([]);

  // Representatives Management state
  const [representativesList, setRepresentativesList] = useState<any[]>(() => {
    const saved = localStorage.getItem("dastavval_representatives");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) { console.error(e); }
    }
    return [];
  });
  const [suppliersList, setSuppliersList] = useState<any[]>([]);
  const [selectedRepForCertificate, setSelectedRepForCertificate] = useState<any | null>(null);

  // Categories Management (Enhanced)
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [newCatName, setNewCatName] = useState("");
  const [newCatIcon, setNewCatIcon] = useState("");
  const [newCatEmoji, setNewCatEmoji] = useState("");
  const [newCatDesc, setNewCatDesc] = useState("");
  const [selectedCategoryNames, setSelectedCategoryNames] = useState<string[]>([]);
  const [showBulkEditCatModal, setShowBulkEditCatModal] = useState(false);
  const [bulkCatEmoji, setBulkCatEmoji] = useState("");
  const [bulkCatDesc, setBulkCatDesc] = useState("");
  const [bulkCatImageUrl, setBulkCatImageUrl] = useState("");
  const [wpCk, setWpCk] = useState("");
  const [wpCs, setWpCs] = useState("");
  const [importerStoreType, setImporterStoreType] = useState<'wordpress' | 'woocommerce'>('woocommerce');
  const [previewProducts, setPreviewProducts] = useState<any[]>([]);
  const [selectedPreviewIds, setSelectedPreviewIds] = useState<string[]>([]);
  const [bulkPriceFactor, setBulkPriceFactor] = useState<number>(1.0); // wholesale multiplier (0% change from source)
  const [consumerPriceFactor, setConsumerPriceFactor] = useState<number>(1.2); // retail multiplier (+20% markup from source)
  const [importProgress, setImportProgress] = useState<number | null>(null);
  const [importLogs, setImportLogs] = useState<string[]>([]);
  const [showImporterDashboard, setShowImporterDashboard] = useState(false);
  const [importerSourceMode, setImporterSourceMode] = useState<'csv' | 'api'>('csv');
  const [csvTextData, setCsvTextData] = useState(`SKU,Name,Published,Is featured?,Visibility in catalog,Short description,Description,In stock?,Stock,Regular price,Sale price,Categories,Images
PRD-101,"کالای نمونه یک",1,0,visible,"واحد: عدد","توضیحات کامل محصول نمونه",1,25,150000,135000,"مواد غذایی","https://images.unsplash.com/photo-1581798459219-318e76aecc7b?w=500"
PRD-102,"کالای نمونه دو",1,0,visible,"واحد: بسته","شرح کالا",1,10,85000,,"لوازم مصرفی",""`);
  const [updateExistingBySku, setUpdateExistingBySku] = useState(true);
  const [showWooGuideModal, setShowWooGuideModal] = useState(false);
  const [showWarehouseGuideModal, setShowWarehouseGuideModal] = useState(false);
  const [importFormat, setImportFormat] = useState<'csv' | 'json'>('csv');
  const [csvParsedProducts, setCsvParsedProducts] = useState<any[]>([]);
  const [selectedCsvIndices, setSelectedCsvIndices] = useState<number[]>([]);
  const [csvInputTab, setCsvInputTab] = useState<'upload' | 'text'>('upload');
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [uploadedFileSize, setUploadedFileSize] = useState<string>('');
  const [showImportSuccessModal, setShowImportSuccessModal] = useState<boolean>(false);
  const [importSummary, setImportSummary] = useState<{ imported: number; updated: number; newCats: number; total: number } | null>(null);

  // Send Notification States

  // Create Direct Invoice States

  useEffect(() => {
    if (activeSubTab === 'dashboard' || activeSubTab === 'reports') {
      setAdminCategory('monitoring');
    } else if (activeSubTab === 'products' || activeSubTab === 'categories' || activeSubTab === 'brands' || activeSubTab === 'factories' || activeSubTab === 'catalog' || activeSubTab === 'branding' || (activeSubTab as any) === 'factory_audit' || (activeSubTab as any) === 'product_sync_status') {
      setAdminCategory('catalog');
    } else if (activeSubTab === 'approvals' || activeSubTab === 'orders' || activeSubTab === 'crm' || activeSubTab === 'representatives' || activeSubTab === 'invoice' || activeSubTab === 'accounting' || activeSubTab === 'barter' || activeSubTab === ('vip-wallet' as any) || activeSubTab === ('ai-marketing' as any)) {
      setAdminCategory('sales');
    } else if (activeSubTab === 'ads' || activeSubTab === 'safe_buy' || activeSubTab === 'channel_posts') {
      setAdminCategory('ads');
    } else {
      setAdminCategory('system');
    }
  }, [activeSubTab]);

  useEffect(() => {
    if (showImporterDashboard || showAiSettings) {
      setAdminCategory('system');
    }
  }, [showImporterDashboard, showAiSettings]);

  // Synchronize registered representative users from dastavval_local_users to representativesList
  useEffect(() => {
    try {
      const localUsers = JSON.parse(localStorage.getItem("dastavval_local_users") || "{}");
      const savedReps = JSON.parse(localStorage.getItem("dastavval_representatives") || "[]");
      
      let updated = [...savedReps];
      let needsUpdate = false;
      
      Object.values(localUsers).forEach((u: any) => {
        if (u.role === 'representative') {
          // Check if this representative is already in the list
          const exists = updated.find(r => r.phone === u.phone || r.email === u.email);
          if (!exists) {
            updated.push({
              id: u.userCode || `REP-${Math.floor(1000 + Math.random() * 9000)}`,
              name: u.name,
              phone: u.phone,
              email: u.email,
              city: u.city || "تهران",
              address: u.address || "",
              agencyCode: u.agencyCode || `AGN-${Math.floor(1000 + Math.random() * 9000)}`,
              badge: u.badge || "نماینده فعال",
              isApproved: u.isRepresentativeApproved === true || u.agencyApproved === true || false
            });
            needsUpdate = true;
          }
        }
      });
      
      if (needsUpdate) {
        setRepresentativesList(updated);
        localStorage.setItem("dastavval_representatives", JSON.stringify(updated));
      }
    } catch (err) {
      console.warn("Failed to sync representative local users to representativesList:", err);
    }
  }, []);

  const handlePurgeMockData = async () => {
    confirmAction(
      "پاک‌سازی داده‌های نمونه و فرضی",
      "آیا از حذف تمام سفارشات نمونه، تیکت‌های فرضی و داده‌های آزمایشی اطمینان دارید؟ سیستم بعد از پاک‌سازی آماده ثبت سفارشات کاملاً واقعی خواهد بود.",
      async () => {
        setLoading(true);
        try {
          // 1. Set the flag to hide/prevent mock data in lists
          localStorage.setItem("dastavval_hide_mock_data", "true");

          // 2. Clear all mock caches
          localStorage.removeItem("dastavval_orders_cache");
          localStorage.removeItem("dastavval_raw_orders");
          localStorage.removeItem("dastavval_callback_requests");
          localStorage.removeItem("dastavval_tickets");
          localStorage.removeItem("dastavval_representatives_kyc");
          localStorage.removeItem("dastavval_crm_leads");

          // 3. Clear states
          setOrders([]);
          setCallbackRequests([]);
          setSupportTickets([]);

          // 4. Force reload empty/real data from database
          await fetchOrders();
          await loadCallbackRequests();
          await loadSupportTickets();

          setSuccessMsg("کلیه سفارشات نمونه و داده‌های فرضی آزمایشی با موفقیت پاک‌سازی شدند. پلتفرم آماده فعالیت واقعی است.");
          setTimeout(() => setSuccessMsg(null), 5000);
        } catch (err: any) {
          console.error(err);
          setErrorMsg(`خطا در پاک‌سازی داده‌ها: ${err.message}`);
        } finally {
          setLoading(false);
        }
      }
    );
  };

  const handleDeleteAllProducts = async () => {
    confirmAction(
      "پاکسازی محصولات",
      "آیا از حذف تمام محصولات موجود در دیتابیس اطمینان دارید؟ این عمل غیرقابل بازگشت است.",
      async () => {
        setLoading(true);
        try {
          const productsSnapshot = await getDocs(collection(db, "products"));
          const deletePromises = productsSnapshot.docs.map(d => deleteDoc(doc(db, "products", d.id)));
          await Promise.all(deletePromises);
          if (onRefreshProducts) await onRefreshProducts();
          setSuccessMsg("تمام محصولات با موفقیت از دیتابیس حذف شدند.");
          setImportLogs(prev => [`[CLEANUP] تمام محصولات دیتابیس پاکسازی شدند.`, ...prev]);
        } catch (err: any) {
          console.error(err);
          setErrorMsg(`خطا در پاکسازی: ${err.message}`);
        } finally {
          setLoading(false);
        }
      }
    );
  };

  // Dynamically compute all real site brands across products, factories, and brand config
  const allAvailableBrandsList = useMemo(() => {
    const set = new Set<string>();
    if (brands && Array.isArray(brands)) {
      brands.forEach(b => {
        if (b?.name && !isWarehouseBrand(b.name)) set.add(b.name.trim());
      });
    }
    if (products && Array.isArray(products)) {
      products.forEach(p => {
        if (p?.brand && !isWarehouseBrand(p.brand)) set.add(p.brand.trim());
      });
    }
    if (b2bConfig?.factories && Array.isArray(b2bConfig.factories)) {
      b2bConfig.factories.forEach((f: any) => {
        if (f?.name && !isWarehouseBrand(f.name)) set.add(f.name.trim());
      });
    }
    return Array.from(set);
  }, [brands, products, b2bConfig]);

  // News & Articles States

  // GapGPT AI Article Generator States

  // Channel Posts States

  const [autoPostSettings, setAutoPostSettings] = useState<{
    new_product: boolean;
    new_discount: boolean;
    new_ad: boolean;
    new_factory: boolean;
  }>(() => {
    const saved = localStorage.getItem("dastavval_autopost_settings");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return {
      new_product: true,
      new_discount: true,
      new_ad: true,
      new_factory: true
    };
  });

  useEffect(() => {
    localStorage.setItem("dastavval_autopost_settings", JSON.stringify(autoPostSettings));
  }, [autoPostSettings]);

  const triggerAutoChannelPost = (title: string, content: string, category: string, actionLabel?: string, actionUrl?: string) => {
    try {
      const saved = localStorage.getItem("dastavval_announcements");
      let currentPosts = [];
      if (saved) {
        try { currentPosts = JSON.parse(saved); } catch(e){}
      }
      const newPost = {
        id: `ann_${Date.now()}_auto`,
        title,
        content,
        category,
        actionLabel,
        actionUrl,
        createdAt: new Date().toLocaleDateString('fa-IR'),
        isAuto: true
      };
      currentPosts = [newPost, ...currentPosts];
      localStorage.setItem("dastavval_announcements", JSON.stringify(currentPosts));
      window.dispatchEvent(new CustomEvent("dastavval_announcements_updated"));
    } catch (e) {
      console.error("Auto post failed:", e);
    }
  };

  const handleToggleKafBazaar = async (p: any) => {
    const nextVal = !p.isKafBazaar;
    await onUpdateProduct(p.id, { isKafBazaar: nextVal });
    
    // If we turned it ON, trigger auto post!
    if (nextVal) {
      if (autoPostSettings.new_product !== false) {
        triggerAutoChannelPost(
          `📉 الحاق محصول جدید به «کف بازار»: ${p.name}`,
          `محصول "${p.name}" از برند "${p.brand || p.factory_name || 'تولیدکننده همکار'}" با موفقیت تایید و به بخش کف بازار دست اول الحاق گردید.\n\nقیمت پیشنهادی کف: ${p.bulk_price?.toLocaleString()} تومان\nبسته‌بندی: کارتن ${p.carton_pack_count || p.unitsPerCarton || 24} عددی\nحداقل سفارش: ${p.min_order_cartons || p.minOrderCartons || 5} کارتن`,
          "urgent",
          "مشاهده در کف بازار بیلبورد",
          `#billboard`
        );
      }
    }
  };

  // Product field states
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [brandLogoUrl, setBrandLogoUrl] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState(0);
  const [bulkPrice, setBulkPrice] = useState(0);
  const [consumerPrice, setConsumerPrice] = useState(0);
  const [packDescription, setPackDescription] = useState("");
  const [shippingOrigin, setShippingOrigin] = useState("");
  const [cartonPackCount, setCartonPackCount] = useState(0);
  const [minOrderCartons, setMinOrderCartons] = useState(0);
  const [stockQuantityCartons, setStockQuantityCartons] = useState(0);
  const [imageUrl, setImageUrl] = useState("");
  const [unit, setUnit] = useState("بسته");
  const [salesUnitType, setSalesUnitType] = useState<'carton' | 'count' | 'weight'>('carton');
  const [weightPerCartonKg, setWeightPerCartonKg] = useState<number>(0);
  const [leadTimeDays, setLeadTimeDays] = useState(0);
  const [purchasePrice, setPurchasePrice] = useState(0);
  const [badge, setBadge] = useState("");
  const [isFavorite, setIsFavorite] = useState(false);
  const [hasHealthApple, setHasHealthApple] = useState(false);
  const [isNatural, setIsNatural] = useState(false);
  const [isOrganic, setIsOrganic] = useState(false);
  const [healthCertCode, setHealthCertCode] = useState("");
  const [chequeAllowed, setChequeAllowed] = useState(true);
  const [productTags, setProductTags] = useState("");

  const handleResetForm = () => {
    setIsEditing(null);
    setShowForm(false);
    setName("");
    setBrand("");
    setBrandLogoUrl("");
    setDescription("");
    setPrice(0);
    setBulkPrice(0);
    setConsumerPrice(0);
    setPurchasePrice(0);
    setBadge("");
    setIsFavorite(false);
    setHasHealthApple(true);
    setIsNatural(true);
    setIsOrganic(false);
    setHealthCertCode("۱۶/۱۲۴۵۸");
    setChequeAllowed(true);
    setProductTags("");
    setPackDescription("");
    setShippingOrigin("");
    setCartonPackCount(24);
    setMinOrderCartons(10);
    setCategory(categories.length > 0 ? (typeof categories[0] === 'string' ? categories[0] : categories[0].name) : "تنقلات و شکلات");
    setStockQuantityCartons(100);
    setImageUrl("");
    setUnit("بسته");
    setSalesUnitType("carton");
    setWeightPerCartonKg(0);
    setLeadTimeDays(3);
  };

  // Initialize branding and factories states from b2bConfig
  useEffect(() => {
    if (b2bConfig) {
      setSelectedColor(b2bConfig.primaryColor || "indigo");
      setCustomAppName(b2bConfig.appName || "دست اول");
      setCustomAppSub(b2bConfig.appSub || "مرجع مبادلات مستقیم و تامین کالای عمده");
      setCustomTopAnnouncement(b2bConfig.topAnnouncement || "");
      setCustomShowTopAnnouncement(!!b2bConfig.showTopAnnouncement);
      setCustomTopAnnouncementPopupTitle(b2bConfig.topAnnouncementPopupTitle || "");
      setCustomTopAnnouncementPopupContent(b2bConfig.topAnnouncementPopupContent || "");
      setCustomSlides(b2bConfig.slides || []);
      setCatalogPdfUrl(b2bConfig.catalogPdfUrl || "");
      setFactories(b2bConfig.factories || []);
      setCustomLogoUrl((b2bConfig as any).logoUrl || "/assets/logo.svg");
      setMascotUrl((b2bConfig as any).mascotUrl || "/assets/mascot_character.jpg");
      setEnamadImage((b2bConfig as any).enamadImage || "");
      setEnamadCode((b2bConfig as any).enamadCode || "");
      setEnamadUrl((b2bConfig as any).enamadUrl || "https://trustseal.enamad.ir");
      setSamandehiImage((b2bConfig as any).samandehiImage || "");
      setSamandehiCode((b2bConfig as any).samandehiCode || "");
      setSamandehiUrl((b2bConfig as any).samandehiUrl || "https://logo.samandehi.ir");
      setTradeUnionImage((b2bConfig as any).tradeUnionImage || "");
      setTradeUnionCode((b2bConfig as any).tradeUnionCode || "IR-9044502");
      setTradeUnionUrl((b2bConfig as any).tradeUnionUrl || "https://dastavval.com/license");
      setZarinpalMerchantCode((b2bConfig as any).zarinpalMerchantCode || "");
      setOfficialSealUrl((b2bConfig as any).officialSealUrl || "");
      setHideEnamad(!!(b2bConfig as any).hideEnamad);
      setHideSamandehi(!!(b2bConfig as any).hideSamandehi);
      setHideTradeUnion(!!(b2bConfig as any).hideTradeUnion);
      setHideSsl(!!(b2bConfig as any).hideSsl);
      setCustomBadges((b2bConfig as any).customBadges || []);
      setBrandImages((b2bConfig as any).brandImages || []);
      setHqAddress((b2bConfig as any).hqAddress || "");
      setSupportPhone((b2bConfig as any).supportPhone || "");
      setHideHqAddress(!!(b2bConfig as any).hideHqAddress);
      setHideSupportPhone(!!(b2bConfig as any).hideSupportPhone);
      setTermsAndConditions((b2bConfig as any).termsAndConditions || "");
      setBuyerCredit((b2bConfig as any).buyerCredit !== undefined ? (b2bConfig as any).buyerCredit : 250000000);
      setCommissionRate((b2bConfig as any).commissionRate || 5);
      setCustomerMarkupPercent(b2bConfig.customerMarkupPercent !== undefined ? b2bConfig.customerMarkupPercent : 10);
      setMarketerCommissionPercent(b2bConfig.marketerCommissionPercent !== undefined ? b2bConfig.marketerCommissionPercent : 5);
      setRepRegionalProfitSharePercent(b2bConfig.repRegionalProfitSharePercent !== undefined ? b2bConfig.repRegionalProfitSharePercent : 50);
      setRepFloorSalesThreshold(b2bConfig.repFloorSalesThreshold !== undefined ? b2bConfig.repFloorSalesThreshold : 300000000);
      setRequireAdminApprovalForRep(b2bConfig.requireAdminApprovalForRep !== undefined ? b2bConfig.requireAdminApprovalForRep : true);
      setCategories((b2bConfig as any).categories || []);
      setBrands(b2bConfig.brands || []);
      if (Array.isArray(b2bConfig.equipmentAds)) {
        setEquipmentAds(b2bConfig.equipmentAds);
      }
      if (Array.isArray(b2bConfig.serviceAds)) {
        setServiceAds(b2bConfig.serviceAds);
      }
      if (Array.isArray(b2bConfig.rawMaterialAds)) {
        setRawMaterialAds(b2bConfig.rawMaterialAds);
      }
      setUserLevels((b2bConfig as any).userLevels || []);
      setCustomRubikaUrl(b2bConfig.rubikaChannelUrl || "https://rubika.ir/dastavval_official");
      setCustomTelegramUrl(b2bConfig.telegramChannelUrl || "https://t.me/dastavval_official");
      setCustomWhatsappUrl(b2bConfig.whatsappGroupUrl || "https://chat.whatsapp.com/dastavval_official");
      setCustomInstagramUrl(b2bConfig.instagramPageUrl || "https://instagram.com/dastavval_official");
      if ((b2bConfig as any).sitePages) setSitePages((b2bConfig as any).sitePages);
    }
  }, [b2bConfig]);

  useEffect(() => {
    fetchAiConfig();
  }, []);

  const fetchAiConfig = async () => {
    // ... existing ...
  };

  const fetchSuppliers = async () => {
    try {
      const q = query(collection(db, "suppliers"));
      const snap = await getDocs(q);
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setSuppliersList(list);
    } catch (err) {
      console.error("Error fetching suppliers:", err);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const handleAiConfigSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAiLoading(true);
    setAiConfigMsg(null);
    try {
      const res = await fetch("/api/admin/ai-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: aiProvider,
          apiKey: aiApiKey,
          endpointUrl: aiEndpointUrl
        })
      });
      const data = await res.json();
      if (res.ok) {
        setAiConfigMsg("تنظیمات کلیدهای هوش مصنوعی با موفقیت بروزرسانی شدند.");
        setAiApiKey("");
        fetchAiConfig();
      } else {
        setAiConfigMsg("خطا در همگام‌سازی تنظیمات: " + (data.error || ""));
      }
    } catch (err: any) {
      setAiConfigMsg("خطای نامشخص در ارتباط با پایگاه داده ادمین.");
    } finally {
      setAiLoading(false);
    }
  };

  const handleTestAiConnection = async () => {
    setAiLoading(true);
    setAiConfigMsg("در حال ارسال درخواست تست به درگاه هوش مصنوعی (GapGPT / Gemini)...");
    try {
      const res = await fetch("/api/admin/ai-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: aiProvider,
          apiKey: aiApiKey,
          endpointUrl: aiEndpointUrl
        })
      });
      const data = await res.json();
      if (data.success) {
        setAiConfigMsg(`✅ ${data.message} | پاسخ زنده درگاه: "${data.reply}"`);
      } else {
        setAiConfigMsg(`❌ ${data.error || "تست اتصال ناموفق بود."}`);
      }
    } catch (err: any) {
      setAiConfigMsg("❌ خطا در ارتباط با سرور تست: " + err.message);
    } finally {
      setAiLoading(false);
    }
  };

  const handleEditClick = (p: Product) => {
    setIsEditing(p.id);
    setName(p.name);
    setBrand(p.brand);
    setBrandLogoUrl(p.brandLogoUrl || "");
    setDescription(p.description);
    setCategory(p.category);
    setPrice(p.price);
    setBulkPrice(p.bulk_price);
    setConsumerPrice(p.consumer_price || p.bulk_price * 1.3);
    setPackDescription(p.pack_description || "");
    setShippingOrigin(p.shipping_origin || "");
    setCartonPackCount(p.carton_pack_count);
    setMinOrderCartons(p.min_order_cartons);
    setStockQuantityCartons(p.stock_quantity_cartons);
    setImageUrl(p.image_url);
    setUnit(p.unit ? cleanUnitName(p.unit) : "بسته");
    setSalesUnitType(p.sales_unit_type || (p.unit === 'کیلوگرم' || p.unit === 'گرم' ? 'weight' : 'carton'));
    setWeightPerCartonKg(p.weight_per_carton_kg || 0);
    setLeadTimeDays(p.production_lead_time_days);
    setPurchasePrice(p.purchase_price || 0);
    setBadge(p.badge || "");
    setIsFavorite(p.isFavorite || false);
    setHasHealthApple(p.hasHealthApple !== false);
    setIsNatural(p.isNatural !== false);
    setIsOrganic(!!p.isOrganic);
    setHealthCertCode(p.healthCertCode || "۱۶/۱۲۴۵۸");
    setChequeAllowed(p.chequeAllowed !== false);
    setProductTags(p.tags && Array.isArray(p.tags) ? p.tags.join("، ") : "");
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Batch Operations
  const handleToggleSelectAll = () => {
    if (selectedProductIds.length === products.length) {
      setSelectedProductIds([]);
    } else {
      setSelectedProductIds(products.map(p => p.id));
    }
  };

  const handleToggleSelectProduct = (id: string) => {
    setSelectedProductIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBatchDelete = async () => {
    if (selectedProductIds.length === 0) return;
    const count = selectedProductIds.length;
    confirmAction(
      "حذف دسته‌جمعی",
      `آیا از حذف دسته جمعی ${count} کالا مطمئن هستید؟`,
      async () => {
        setLoading(true);
        let successCount = 0;
        const idsToDelete = [...selectedProductIds];
        setSelectedProductIds([]);

        try {
          for (let i = 0; i < idsToDelete.length; i++) {
            const id = idsToDelete[i];
            setBatchProgress({
              current: i + 1,
              total: idsToDelete.length,
              message: `در حال حذف کالا ${i + 1} از ${idsToDelete.length}...`
            });
            
            // Let the UI update and avoid freezing the main thread
            await new Promise(resolve => setTimeout(resolve, 10)); 
            
            try {
              // Pass skipStateUpdate = true to prevent unnecessary renders per item
              await onDeleteProduct(id, true);
              successCount++;
            } catch (err) {
              console.error(`Failed to delete product ${id}:`, err);
            }
          }

          if (onRefreshProducts) await onRefreshProducts();
          setSuccessMsg(`${successCount} کالا با موفقیت حذف شدند.`);
        } catch (err) {
          setErrorMsg("خطا در عملیات حذف دسته جمعی.");
        } finally {
          setLoading(false);
          setBatchProgress(null);
        }
      }
    );
  };

  const handleBatchStatusToggle = async (disabled: boolean) => {
    setLoading(true);
    const ids = [...selectedProductIds];
    try {
      for (let i = 0; i < ids.length; i++) {
        if (i % 5 === 0 || i === ids.length - 1) {
          setBatchProgress({
            current: i + 1,
            total: ids.length,
            message: `در حال تغییر وضعیت کالا ${i + 1} از ${ids.length}...`
          });
        }
        await new Promise(resolve => setTimeout(resolve, 0)); // Yield to main thread
        await onUpdateProduct(ids[i], { disabled }, true);
      }
      setSuccessMsg(`وضعیت ${ids.length} کالا با موفقیت تغییر کرد.`);
      if (onRefreshProducts) await onRefreshProducts();
    } catch (err) {
      setErrorMsg("خطا در تغییر وضعیت کالاها.");
    } finally {
      setLoading(false);
      setBatchProgress(null);
    }
  };

  const handleBatchPriceUpdate = async () => {
    if (batchPriceChange === 0) return;
    setLoading(true);
    const ids = [...selectedProductIds];
    try {
      for (let i = 0; i < ids.length; i++) {
        const id = ids[i];
        const prod = products.find(p => p.id === id);
        if (i % 5 === 0 || i === ids.length - 1) {
          setBatchProgress({
            current: i + 1,
            total: ids.length,
            message: `در حال بروزرسانی قیمت کالا ${i + 1} از ${ids.length}...`
          });
        }
        await new Promise(resolve => setTimeout(resolve, 0)); // Yield to main thread
        if (prod) {
          const multiplier = 1 + (batchPriceChange / 100);
          await onUpdateProduct(id, {
            bulk_price: Math.round(prod.bulk_price * multiplier),
            price: Math.round(prod.price * multiplier)
          }, true);
        }
      }
      if (batchPriceChange < 0 && autoPostSettings.new_discount) {
        triggerAutoChannelPost(
          `🔥 تخفیف گروهی جدید ویژه بنکداران!`,
          `یک تخفیف گروهی جذاب به میزان ${Math.abs(batchPriceChange)}٪ روی ${ids.length} محصول از سبد کالاهای رسمی سامانه دست اول اعمال گردید.\n\nهم‌اکنون می‌توانید کالاها را با قیمت‌های باورنکردنی و حاشیه سود بالا تهیه نمایید.`,
          "promotion",
          "مشاهده کاتالوگ تخفیف‌دار",
          `#catalog`
        );
      }
      setBatchPriceChange(0);
      setSuccessMsg("بروزرسانی دسته جمعی قیمت‌ها اعمال شد.");
      if (onRefreshProducts) await onRefreshProducts();
    } catch (err) {
      setErrorMsg("خطا در بروزرسانی قیمت‌ها.");
    } finally {
      setLoading(false);
      setBatchProgress(null);
    }
  };

  const handleGlobalPriceUpdate = async () => {
    const percentNum = Number(globalPriceChangePercent);
    if (isNaN(percentNum) || percentNum <= 0) {
      setErrorMsg("لطفا درصد معتبری وارد نمایید.");
      return;
    }
    
    if (!confirm(`آیا مطمئن هستید که می‌خواهید قیمت تمام محصولات را به میزان ${percentNum}٪ ${globalPriceChangeDirection === 'increase' ? 'افزایش' : 'کاهش'} دهید؟`)) {
      return;
    }

    setLoading(true);
    try {
      const totalCount = products.length;
      for (let i = 0; i < totalCount; i++) {
        const prod = products[i];
        if (i % 5 === 0 || i === totalCount - 1) {
          setBatchProgress({
            current: i + 1,
            total: totalCount,
            message: `در حال بروزرسانی قیمت کلی محصولات: ${i + 1} از ${totalCount}...`
          });
        }
        await new Promise(resolve => setTimeout(resolve, 0)); // Yield thread
        
        const sign = globalPriceChangeDirection === 'increase' ? 1 : -1;
        const multiplier = 1 + (sign * percentNum / 100);
        
        await onUpdateProduct(prod.id, {
          bulk_price: Math.round(prod.bulk_price * multiplier),
          price: Math.round(prod.price * multiplier)
        }, true);
      }
      setGlobalPriceChangePercent("");
      setSuccessMsg("تغییر سراسری قیمت تمام محصولات با موفقیت انجام شد.");
      if (onRefreshProducts) await onRefreshProducts();
    } catch (err) {
      setErrorMsg("خطا در بروزرسانی سراسری قیمت‌ها.");
    } finally {
      setLoading(false);
      setBatchProgress(null);
    }
  };

  // Category CRUD
  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newCat = { id: editingCategoryId || Date.now().toString(), name: catName, imageUrl: catImage, description: catDesc };
    let updatedCats = [...categories];
    if (editingCategoryId) {
      updatedCats = updatedCats.map(c => c.id === editingCategoryId ? newCat : c);
    } else {
      updatedCats.push(newCat);
    }
    setCategories(updatedCats);
    await onUpdateB2bConfig({ ...b2bConfig, categories: updatedCats });
    setShowCategoryForm(false);
    setEditingCategoryId(null);
    setCatName(""); setCatImage(""); setCatDesc("");
  };

  // Site Builder Save
  const handleSavePage = async () => {
    if (!activePageId) return;
    const updatedPages = sitePages.map(p => p.id === activePageId ? { ...p, content: pageEditorContent } : p);
    setSitePages(updatedPages);
    await onUpdateB2bConfig({ ...b2bConfig, sitePages: updatedPages } as any);
    setSuccessMsg("تغییرات صفحه با موفقیت ذخیره شد.");
    setActivePageId(null);
  };

  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [showGallery, setShowGallery] = useState(false);

  const fetchGallery = async () => {
    try {
      const res = await fetch('/api/gallery');
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.images)) {
          setGalleryImages(data.images);
          return;
        }
      }
    } catch (err) {
      // Fallback gracefully
    }
    const b2bGallery = (b2bConfig as any)?.gallery || [];
    if (b2bGallery.length > 0) {
      setGalleryImages(b2bGallery);
    }
  };

  const addToGallery = async (url: string) => {
    if (!url) return;
    setGalleryImages(prev => [url, ...prev.filter(img => img !== url)]);
    try {
      await fetch('/api/gallery/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
    } catch (err) {
      // Ignore network errors
    }
    if (onUpdateB2bConfig) {
      const currentGallery = (b2bConfig as any)?.gallery || [];
      if (!currentGallery.includes(url)) {
        onUpdateB2bConfig({ ...b2bConfig, gallery: [url, ...currentGallery] });
      }
    }
  };

  useEffect(() => {
    fetchGallery();
  }, []);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (imageUrl) addToGallery(imageUrl);
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const customTags = productTags ? productTags.split(/[\n،,]+/).map(t => t.trim()).filter(Boolean) : [];
    const computedTags = getEffectiveProductTags({
      name,
      brand,
      category,
      tags: customTags,
      hasHealthApple,
      isOrganic,
      isNatural
    });

    const productPayload = {
      name,
      brand,
      brandLogoUrl,
      description,
      category,
      price: Number(price) || 0,
      bulk_price: Number(bulkPrice) || 0,
      consumer_price: Number(consumerPrice) || Number(bulkPrice) * 1.3,
      pack_description: packDescription,
      shipping_origin: shippingOrigin,
      carton_pack_count: Number(cartonPackCount) || 24,
      min_order_cartons: Number(minOrderCartons) || 5,
      stock_quantity_cartons: Number(stockQuantityCartons) || 100,
      image_url: imageUrl || "https://images.unsplash.com/photo-1550547660-d9450f859349?w=500",
      unit: cleanUnitName(unit),
      sales_unit_type: salesUnitType,
      weight_per_carton_kg: Number(weightPerCartonKg) || 0,
      sellerId: "hq_admin",
      sellerName: "مدیریت مرکزی دست اول",
      production_lead_time_days: Number(leadTimeDays) || 2,
      purchase_price: Number(purchasePrice) || 0,
      badge,
      isFavorite,
      hasHealthApple,
      isNatural,
      isOrganic,
      healthCertCode,
      chequeAllowed: !!chequeAllowed,
      tags: computedTags
    };

    try {
      if (isEditing) {
        await onUpdateProduct(isEditing, productPayload);
        setSuccessMsg("محصول با موفقیت به روز رسانی شد.");
      } else {
        await onAddProduct(productPayload);
        setSuccessMsg("محصول جدید با موفقیت به خط تولید دیجیتال اضافه شد.");
        if (autoPostSettings.new_product) {
          triggerAutoChannelPost(
            `📦 محصول جدید: ${name.trim()}`,
            `محصول جدید "${name.trim()}" متعلق به برند "${brand || 'بدون برند'}" با قیمت عمده شگفت‌انگیز در دست اول قرار گرفت.\n\nتوضیحات: ${description || 'ارسال مستقیم و دست اول از درب کارخانه'}\nحداقل تعداد سفارش: ${minOrderCartons || 5} کارتن.`,
            "info",
            "مشاهده و ثبت سفارش محصول",
            `#product-${name.trim()}`
          );
        }
      }
      handleResetForm();
      if (onRefreshProducts) await onRefreshProducts();
    } catch (err: any) {
      setErrorMsg(err.message || "خطایی در ثبت یا ویرایش کالا رخ داد.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = async (id: string) => {
    confirmAction(
      "حذف محصول",
      "آیا از حذف این محصول مطمئن هستید؟",
      async () => {
        setProcessingProductId(id);
        setErrorMsg(null);
        setSuccessMsg(null);
        try {
          await onDeleteProduct(id);
          setSuccessMsg("محصول با موفقیت از سیستم حذف گردید.");
          if (onRefreshProducts) await onRefreshProducts();
        } catch (err: any) {
          setErrorMsg("حذف کالا با خطا مواجه شد: " + (err.message || ""));
        } finally {
          setProcessingProductId(null);
        }
      }
    );
  };

  // Submit visual theme and colors settings
  const handleBrandingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const updatedConfig = {
        ...b2bConfig,
        primaryColor: selectedColor,
        appName: customAppName,
        appSub: customAppSub,
        rubikaChannelUrl: customRubikaUrl,
        telegramChannelUrl: customTelegramUrl,
        whatsappGroupUrl: customWhatsappUrl,
        instagramPageUrl: customInstagramUrl,
        topAnnouncement: customTopAnnouncement,
        showTopAnnouncement: customShowTopAnnouncement,
        topAnnouncementPopupTitle: customTopAnnouncementPopupTitle,
        topAnnouncementPopupContent: customTopAnnouncementPopupContent,
        slides: customSlides,
        catalogPdfUrl: catalogPdfUrl,
        factories: factories,
        logoUrl: customLogoUrl,
        mascotUrl: mascotUrl,
        enamadImage: enamadImage,
        enamadCode: enamadCode,
        enamadUrl: enamadUrl,
        samandehiImage: samandehiImage,
        samandehiCode: samandehiCode,
        samandehiUrl: samandehiUrl,
        tradeUnionImage: tradeUnionImage,
        tradeUnionCode: tradeUnionCode,
        tradeUnionUrl: tradeUnionUrl,
        zarinpalMerchantCode: zarinpalMerchantCode,
        officialSealUrl: officialSealUrl,
        hideEnamad: hideEnamad,
        hideSamandehi: hideSamandehi,
        hideTradeUnion: hideTradeUnion,
        hideSsl: hideSsl,
        customBadges: customBadges,
        brandImages: brandImages,
        hqAddress: hqAddress,
        supportPhone: supportPhone,
        hideHqAddress: hideHqAddress,
        hideSupportPhone: hideSupportPhone,
        termsAndConditions: termsAndConditions,
        buyerCredit: Number(buyerCredit),
        commissionRate: Number(commissionRate),
        customerMarkupPercent: Number(customerMarkupPercent),
        marketerCommissionPercent: Number(marketerCommissionPercent),
        repRegionalProfitSharePercent: Number(repRegionalProfitSharePercent),
        repFloorSalesThreshold: Number(repFloorSalesThreshold),
        requireAdminApprovalForRep: requireAdminApprovalForRep,
        categories: categories,
        userLevels: userLevels
      };
      await onUpdateB2bConfig(updatedConfig);
      setSuccessMsg("تنظیمات هویت بصری، رنگ برندینگ، لوگوی اختصاصی، آدرس‌ها، شماره تماس، قوانین و درگاه زرین‌پال با موفقیت ذخیره شد!");
    } catch (err: any) {
      setErrorMsg("ذخیره تنظیمات پوسته با خطا مواجه شد.");
    } finally {
      setLoading(false);
    }
  };

  // Save edited Order/Invoice
  const handleSaveOrderEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrder) return;
    setLoading(true);
    try {
      const { doc: orderDoc, updateDoc: orderUpdate } = await import("../lib/data-layer");
      const orderRef = orderDoc(db, "orders", editingOrder.id);
      await orderUpdate(orderRef, {
        buyerName: editBuyerName,
        buyerPhone: editBuyerPhone,
        buyerCompany: editBuyerCompany,
        buyerAddress: editBuyerAddress,
        totalAmount: Number(editTotalAmount),
        paymentStatus: editPaymentStatus
      });
      setSuccessMsg("تغییرات فاکتور با موفقیت در دیتابیس ابر ثبت و ذخیره شد.");
      setEditingOrder(null);
      fetchOrders();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (e: any) {
      console.error("Error editing order:", e);
      setErrorMsg("خطا در ثبت ویرایش فاکتور: " + e.message);
      setTimeout(() => setErrorMsg(null), 4000);
    } finally {
      setLoading(false);
    }
  };

  // Handle direct JSON URL sync for Products
  const handleCatalogJsonSyncFromUrl = async () => {
    if (!catalogJsonSyncUrl.trim()) {
      setErrorMsg("لطفاً آدرس لینک JSON کاتالوگ را وارد کنید.");
      return;
    }
    setIsSyncingCatalogJsonUrl(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      let rawData: any = null;
      try {
        const res = await fetch("/api/proxy-fetch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: catalogJsonSyncUrl.trim() })
        });
        if (res.ok) {
          rawData = await res.json();
          // Verify if response is a default PHP status response instead of catalog
          if (rawData && typeof rawData === 'object' && !Array.isArray(rawData)) {
            const hasProducts = Array.isArray(rawData.products) || Array.isArray(rawData.items) || Array.isArray(rawData.data) || Array.isArray(rawData.catalog) || Array.isArray(rawData.result) || Array.isArray(rawData.goods) || Array.isArray(rawData.rows) || (rawData.data && Array.isArray(rawData.data.products));
            if (!hasProducts && (rawData.platform || rawData.status === 'online')) {
              rawData = null;
            }
          }
        }
      } catch (e) {}

      if (!rawData) {
        try {
          const phpRes = await fetch(`/php/api.php?action=proxy-fetch&url=${encodeURIComponent(catalogJsonSyncUrl.trim())}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url: catalogJsonSyncUrl.trim() })
          });
          if (phpRes.ok) {
            rawData = await phpRes.json();
          }
        } catch (e) {}
      }

      if (!rawData) {
        try {
          const directRes = await fetch(catalogJsonSyncUrl.trim());
          if (directRes.ok) {
            rawData = await directRes.json();
          }
        } catch (e) {}
      }

      if (!rawData) {
        throw new Error("امکان خواندن فایل JSON از لینک فوق وجود ندارد. از صحت آدرس مطمئن شوید.");
      }

      if (typeof rawData === 'string') {
        try {
          rawData = JSON.parse(rawData.replace(/^\uFEFF/, '').trim());
        } catch (e) {}
      }

      let incomingProducts: any[] = [];
      if (Array.isArray(rawData)) {
        incomingProducts = rawData;
      } else if (rawData && typeof rawData === 'object') {
        if (Array.isArray(rawData.products)) incomingProducts = rawData.products;
        else if (Array.isArray(rawData.items)) incomingProducts = rawData.items;
        else if (Array.isArray(rawData.data)) incomingProducts = rawData.data;
        else if (rawData.data && Array.isArray(rawData.data.products)) incomingProducts = rawData.data.products;
        else if (Array.isArray(rawData.catalog)) incomingProducts = rawData.catalog;
        else if (Array.isArray(rawData.result)) incomingProducts = rawData.result;
        else if (Array.isArray(rawData.goods)) incomingProducts = rawData.goods;
        else if (Array.isArray(rawData.rows)) incomingProducts = rawData.rows;
      }

      if (!incomingProducts || incomingProducts.length === 0) {
        const keysFound = (rawData && typeof rawData === 'object') ? Object.keys(rawData).join(", ") : typeof rawData;
        throw new Error(`هیچ آرایه‌ای از محصولات در فایل JSON یافت نشد. (کلیدهای شناسایی شده: ${keysFound})`);
      }

      let updatedCount = 0;
      let addedCount = 0;
      const updatedProductsList = [...products];

      for (const incItem of incomingProducts) {
        const sku = incItem.sku || String(incItem.id) || `PRD-${Math.random().toString(36).substring(2, 7)}`;
        const existingIdx = updatedProductsList.findIndex(p => p.sku === sku || String(p.id) === String(incItem.id) || p.sku === String(incItem.id) || p.name === incItem.name);

        const factoryBuyPrice = Number(incItem.factoryPrice || incItem.wholesalePrice || incItem.price || 0);
        const dastAvvalSellPrice = Number(incItem.sellPrice || incItem.marketPrice || incItem.bulk_price || (factoryBuyPrice ? Math.round(factoryBuyPrice * 1.04) : 0));
        const consumerRetailPrice = Number(incItem.consumerPrice || incItem.consumer_price || incItem.retailPrice || 0);

        const rawImageUrl = incItem.imageUrl || incItem.image_url || incItem.image;
        const processedImage = getDisplayImageUrl(rawImageUrl);

        const itemsPerCarton = Number(incItem.itemsPerUnit || incItem.carton_pack_count || incItem.pack_count || 1);
        const stockCartons = Number(incItem.stock !== undefined ? incItem.stock : incItem.stock_quantity_cartons || 10);
        const minOrderCartons = Number(incItem.min_order_cartons || incItem.minOrder || 1) || 1;
        const safetyThreshold = Number(incItem.minimumStock || incItem.min_stock_alert || 5);
        const brandName = incItem.location || incItem.factoryName || incItem.brand || "انبار دست اول";

        if (existingIdx >= 0) {
          const existing = updatedProductsList[existingIdx];
          updatedProductsList[existingIdx] = {
            ...existing,
            name: incItem.name || existing.name,
            price: factoryBuyPrice || existing.price,
            bulk_price: dastAvvalSellPrice || existing.bulk_price,
            consumer_price: consumerRetailPrice || existing.consumer_price,
            carton_pack_count: itemsPerCarton || existing.carton_pack_count,
            stock_quantity_cartons: stockCartons,
            min_order_cartons: minOrderCartons,
            min_stock_alert: safetyThreshold,
            unit: incItem.unit || existing.unit || "عدد",
            image_url: processedImage || existing.image_url,
            category: incItem.category || existing.category,
            brand: brandName || existing.brand,
            sellerName: brandName || existing.sellerName,
            description: incItem.description || existing.description,
            updated_at: new Date().toLocaleDateString('fa-IR') + ' - ' + new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })
          };
          updatedCount++;
        } else {
          const newId = `doc_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
          updatedProductsList.push({
            id: newId,
            sku: sku,
            name: incItem.name || "محصول جدید کاتالوگ",
            brand: brandName,
            category: incItem.category || "صنایع عمومی",
            price: factoryBuyPrice || 750000,
            bulk_price: dastAvvalSellPrice || 780000,
            consumer_price: consumerRetailPrice || 1000000,
            carton_pack_count: itemsPerCarton,
            min_order_cartons: minOrderCartons,
            stock_quantity_cartons: stockCartons,
            min_stock_alert: safetyThreshold,
            unit: incItem.unit || "عدد",
            sellerId: "factory-android",
            sellerName: brandName,
            production_lead_time_days: 1,
            image_url: processedImage,
            description: incItem.description || "واردشده از لینک JSON باکت پارس‌پک",
            updated_at: new Date().toLocaleDateString('fa-IR') + ' - ' + new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })
          });
          addedCount++;
        }
      }

      if (onBulkUpdateProducts) {
        await onBulkUpdateProducts(updatedProductsList);
      } else {
        for (const p of updatedProductsList) {
          const existing = products.find(ep => ep.id === p.id);
          if (existing) {
            await onUpdateProduct(p.id, p);
          } else {
            await onAddProduct(p);
          }
        }
      }

      if (onRefreshProducts) await onRefreshProducts();
      setSuccessMsg(`همگام‌سازی کامل شد! ${updatedCount} کالا بروزرسانی شد و ${addedCount} کالای جدید اضافه گردید.`);
    } catch (err: any) {
      setErrorMsg("خطا در همگام‌سازی لینک JSON: " + err.message);
    } finally {
      setIsSyncingCatalogJsonUrl(false);
    }
  };

  // Advanced WooCommerce & WordPress REST API live synchronization engine
  const handleWpFetchProducts = async () => {
    if (!wpImportUrl.trim()) {
      setErrorMsg("لطفا آدرس سایت وردپرس یا ووکامرس خود را وارد کنید.");
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    setPreviewProducts([]);
    setSelectedPreviewIds([]);
    setImportLogs([`شروع ارتباط با دامنه مبدا: ${wpImportUrl.trim()}...`]);
    try {
      let rawInput = wpImportUrl.trim().replace(/\s+/g, '');
      if (!rawInput.startsWith('http://') && !rawInput.startsWith('https://')) {
        rawInput = 'https://' + rawInput;
      }
      let finalUrl = rawInput;
      
      if (importerStoreType === 'woocommerce') {
        if (!finalUrl.includes('/wp-json/')) {
          finalUrl = finalUrl.replace(/\/$/, '') + '/wp-json/wc/v3/products';
        }
        if (wpCk.trim() && wpCs.trim()) {
          const separator = finalUrl.includes('?') ? '&' : '?';
          finalUrl += `${separator}consumer_key=${wpCk.trim()}&consumer_secret=${wpCs.trim()}&per_page=100`;
          setImportLogs(prev => [...prev, "کلید امنیتی CK/CS شناسایی شد. فراخوانی به صورت احرازهویت شده (V3) صورت می‌پذیرد."]);
        } else {
          if (!finalUrl.includes('/wc/store/')) {
            finalUrl = finalUrl.replace(/\/$/, '') + '/wp-json/wc/store/v1/products?per_page=100';
            setImportLogs(prev => [...prev, "کلید امنیتی ارائه نشده است. تلاش برای برقراری ارتباط با درگاه عمومی Store API..."]);
          }
        }
      } else {
        if (!finalUrl.includes('/wp-json/')) {
          finalUrl = finalUrl.replace(/\/$/, '') + '/wp-json/wp/v2/posts?per_page=100';
        }
      }

      setImportLogs(prev => [...prev, `ارسال درخواست پروکسی به آدرس نهایی: ${finalUrl}`]);
      
      const res = await fetch("/api/proxy-fetch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: finalUrl })
      });
      
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `سرور خطا داد با وضعیت ${res.status}`);
      }
      
      const data = await res.json();
      const rawItems = Array.isArray(data) ? data : (data.products && Array.isArray(data.products)) ? data.products : [];
      
      if (rawItems.length === 0) {
        throw new Error("هیچ محصول یا مطلبی در این خروجی یافت نشد. صحت آدرس یا اعتبار دسترسی را بررسی نمایید.");
      }

      setImportLogs(prev => [...prev, `موفقیت‌آمیز! تعداد ${rawItems.length} ردیف داده خام با موفقیت خوانده شد. آماده پردازش...`]);

      const processed = rawItems.map((item: any, idx: number) => {
        let name = item.name || "";
        if (!name && item.title) {
          name = typeof item.title === 'object' ? item.title.rendered : String(item.title);
        }
        if (!name) name = `محصول ووکامرس کد ${idx + 1}`;

        let originalPrice = 0;
        if (item.price) {
          originalPrice = Math.round(parseFloat(item.price)) || 0;
        } else if (item.regular_price) {
          originalPrice = Math.round(parseFloat(item.regular_price)) || 0;
        } else if (item.prices && item.prices.price) {
          originalPrice = Math.round(parseFloat(item.prices.price) / 100) || 0;
        }

        let category = "سایر محصولات";
        if (item.categories && Array.isArray(item.categories) && item.categories.length > 0) {
          category = item.categories[0].name || category;
        }

        let desc = item.description || item.short_description || "";
        if (!desc && item.excerpt) {
          desc = typeof item.excerpt === 'object' ? item.excerpt.rendered : String(item.excerpt);
        }
        if (!desc && item.content) {
          desc = typeof item.content === 'object' ? item.content.rendered : String(item.content);
        }
        const cleanDesc = desc 
          ? desc.replace(/<\/?[^>]+(>|$)/g, "").replace(/\s+/g, " ").trim().substring(0, 300) 
          : "محصول باکیفیت و استاندارد عمده.";

        let imageUrl = "https://images.unsplash.com/photo-1581798459219-318e76aecc7b?w=500";
        if (item.images && Array.isArray(item.images) && item.images.length > 0) {
          imageUrl = item.images[0].src || item.images[0].url || imageUrl;
        } else if (item.featured_media_src_url) {
          imageUrl = item.featured_media_src_url;
        }

        let cartonPackCount = 1;
        if (item.meta_data && Array.isArray(item.meta_data)) {
           const meta = item.meta_data.find((m: any) => 
             m.key === 'carton_pack_count' || 
             m.key === '_carton_pack_count' || 
             m.key === 'units_per_carton' ||
             m.key === 'pack_size'
           );
           if (meta) cartonPackCount = Number(meta.value) || 1;
        }

        return {
          id: `preview_${idx}_${Date.now()}`,
          name,
          price: originalPrice,
          category,
          description: cleanDesc,
          image_url: imageUrl,
          brand: item.brand || (importerStoreType === 'woocommerce' ? "ووکامرس" : "وردپرس"),
          bulk_price: item.sale_price ? (Math.round(parseFloat(item.sale_price)) || originalPrice) : Math.round(originalPrice * bulkPriceFactor),
          consumer_price: item.regular_price ? (Math.round(parseFloat(item.regular_price)) || originalPrice) : Math.round(originalPrice * consumerPriceFactor),
          carton_pack_count: cartonPackCount,
          min_order_cartons: 1,
          unit: "عدد",
          sellerId: "imported_wp",
          sellerName: wpImportUrl.replace(/^https?:\/\//, '').split('/')[0],
          production_lead_time_days: 3,
          brandLogoUrl: ""
        };
      });

      setPreviewProducts(processed);
      setSelectedPreviewIds(processed.map((p: any) => p.id));
      setImportLogs(prev => [...prev, `پردازش انجام شد. ${processed.length} کالا آماده بارگذاری هستند.`]);
      setSuccessMsg(`تعداد ${toPersianNum(processed.length)} کالا با موفقیت واکشی شد.`);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(`خطا در واکشی محصولات: ${err.message}`);
      setImportLogs(prev => [...prev, `خطا در اجرای فرآیند: ${err.message}`]);
    } finally {
      setLoading(false);
    }
  };

  const handleBatchExecuteImport = async () => {
    const toImport = previewProducts.filter(p => selectedPreviewIds.includes(p.id));
    if (toImport.length === 0) {
      setErrorMsg("لطفا حداقل یک کالا را برای درون‌ریزی علامت‌گذاری کنید.");
      return;
    }
    setLoading(true);
    setImportProgress(1);
    setImportLogs(prev => [`شروع درون‌ریزی نهایی ${toImport.length} محصول به کاتالوگ انبار مرکزی...`, ...prev]);
    let successCount = 0;
    try {
      for (let i = 0; i < toImport.length; i++) {
        const item = toImport[i];
        if (i % 2 === 0) {
          await new Promise(resolve => setTimeout(resolve, 0));
        }
        
        const pct = Math.round(((i + 1) / toImport.length) * 100);
        if (i % 3 === 0 || i === toImport.length - 1) {
          setImportProgress(pct);
        }

        // Apply custom multipliers
        const finalPrice = Math.round(item.price);
        const finalBulkPrice = Math.round(item.price * bulkPriceFactor);
        const finalConsumerPrice = Math.round(item.price * consumerPriceFactor);

        await addDoc(collection(db, "products"), {
          name: item.name,
          brand: item.brand || "ووکامرس",
          brandLogoUrl: "",
          description: item.description || "",
          price: finalPrice,
          bulk_price: finalBulkPrice,
          consumer_price: finalConsumerPrice,
          carton_pack_count: item.carton_pack_count || 24,
          min_order_cartons: item.min_order_cartons || 5,
          category: item.category || "مواد غذایی",
          stock_quantity_cartons: 100,
          image_url: item.image_url || "https://images.unsplash.com/photo-1581798459219-318e76aecc7b?w=500",
          unit: item.unit || "بسته",
          sellerId: "wp_import",
          sellerName: "وارد شده از ووکامرس",
          production_lead_time_days: 2,
          createdAt: serverTimestamp()
        });
        successCount++;
        if (i % 5 === 0) {
          setImportLogs(prev => [`در حال ثبت [${i + 1}/${toImport.length}]: ${item.name}...`, ...prev.slice(0, 30)]);
        }
      }
      
      window.dispatchEvent(new Event("reload-products"));
      setSuccessMsg(`درون‌ریزی تمام شد! ${toPersianNum(successCount)} کالا با موفقیت به کاتالوگ عمده ثبت شد.`);
      setImportLogs(prev => [`عملیات درون‌ریزی با موفقیت خاتمه یافت. ثبت ${successCount} کالا.`, ...prev]);
      setPreviewProducts([]);
      setSelectedPreviewIds([]);
      setImportProgress(null);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(`بروز خطا در طول ثبت کالاها: ${err.message}`);
      setImportLogs(prev => [`خطای ثبت کالا: ${err.message}`, ...prev]);
      setImportProgress(null);
    } finally {
      setLoading(false);
    }
  };

  const getCsvFieldValue = (item: any, keys: string[]): string => {
    if (!item || typeof item !== 'object') return '';
    const itemKeys = Object.keys(item);
    
    for (const k of itemKeys) {
      const cleanK = k.replace(/^\uFEFF/, '').trim().toLowerCase();
      for (const keyPattern of keys) {
        if (cleanK === keyPattern.toLowerCase()) {
          const val = item[k];
          if (val !== undefined && val !== null) {
            const strVal = String(val).trim();
            if (strVal !== '') return strVal;
          }
        }
      }
    }

    for (const k of itemKeys) {
      const cleanK = k.replace(/^\uFEFF/, '').trim().toLowerCase();
      for (const keyPattern of keys) {
        if (cleanK.includes(keyPattern.toLowerCase())) {
          const val = item[k];
          if (val !== undefined && val !== null) {
            const strVal = String(val).trim();
            if (strVal !== '') return strVal;
          }
        }
      }
    }
    return '';
  };

  const parseWooCommerceCsvData = (rows: any[]) => {
    const parsed: any[] = [];
    let skippedCount = 0;

    rows.forEach((item: any, idx: number) => {
      if (!item || typeof item !== 'object') {
        skippedCount++;
        return;
      }

      let name = getCsvFieldValue(item, [
        'name', 'title', 'post_title', 'نام محصول', 'نام کالا', 'عنوان محصول', 'نام', 'عنوان', 'product_name'
      ]);

      let sku = getCsvFieldValue(item, [
        'sku', 'id', 'post_id', 'شناسه', 'شناسه محصول', 'کد کالا', 'کد_کالا', 'کد', 'بارکد', 'product_sku'
      ]);

      const hasAnyValue = Object.values(item).some(v => v !== null && v !== undefined && String(v).trim() !== '');
      if (!hasAnyValue) {
        skippedCount++;
        return;
      }

      if (!name && !sku) {
        name = `محصول وارداتی #${idx + 1}`;
        sku = `PRD-${1001 + idx}`;
      } else if (!name) {
        name = `محصول کد ${sku}`;
      } else if (!sku) {
        sku = `PRD-${1001 + idx}`;
      }

      const regPriceStr = getCsvFieldValue(item, [
        'regular price', 'regular_price', 'price', 'قیمت کارخانه', 'Factory Price', 'قیمت اصلی', 'قیمت'
      ]);
      const cleanPriceStr = regPriceStr.replace(/[۰-۹]/g, d => "۰۱۲۳۴۵۶۷۸۹".indexOf(d).toString()).replace(/,/g, '').replace(/[^\d.]/g, '');
      const regPrice = cleanPriceStr !== '' ? Number(cleanPriceStr) : 0;

      const bulkPriceStr = getCsvFieldValue(item, [
        'sale price', 'sale_price', 'قیمت فروش', 'Sales Price', 'قیمت عمده', 'قیمت بنکداری', 'wholesale_price', 'bulk_price'
      ]);
      const cleanBulkPriceStr = bulkPriceStr.replace(/[۰-۹]/g, d => "۰۱۲۳۴۵۶۷۸۹".indexOf(d).toString()).replace(/,/g, '').replace(/[^\d.]/g, '');
      const bulkPrice = cleanBulkPriceStr !== '' ? Number(cleanBulkPriceStr) : 0;

      const consumerPriceStr = getCsvFieldValue(item, [
        'consumer_price', 'msrp', 'قیمت مصرف کننده', 'Consumer Price', 'قیمت مصرف‌کننده', 'قیمت روی کالا', 'قیمت مصرف'
      ]);
      const cleanConsumerPriceStr = consumerPriceStr.replace(/[۰-۹]/g, d => "۰۱۲۳۴۵۶۷۸۹".indexOf(d).toString()).replace(/,/g, '').replace(/[^\d.]/g, '');
      const consumerPrice = cleanConsumerPriceStr !== '' ? Number(cleanConsumerPriceStr) : 0;

      const purchasePriceStr = getCsvFieldValue(item, [
        'purchase_price', 'cost', 'purchase_cost', 'قیمت خرید', 'هزینه خرید', 'قیمت تامین'
      ]);
      const cleanPurchasePriceStr = purchasePriceStr.replace(/[۰-۹]/g, d => "۰۱۲۳۴۵۶۷۸۹".indexOf(d).toString()).replace(/,/g, '').replace(/[^\d.]/g, '');
      const purchasePrice = cleanPurchasePriceStr !== '' ? Number(cleanPurchasePriceStr) : 0;

      const badge = getCsvFieldValue(item, [
        'badge', 'label', 'نشان', 'اتیکت', 'برچسب'
      ]);

      const isFavStr = getCsvFieldValue(item, [
        'isFavorite', 'favorite', 'علاقه مندی', 'برگزیده', 'محبوب'
      ]);
      const isFavorite = isFavStr === '1' || isFavStr.toLowerCase() === 'true' || isFavStr === 'yes' || isFavStr.includes('بله');

      const inStockStr = getCsvFieldValue(item, [
        'in stock?', 'in_stock', 'instock', 'موجود در انبار؟', 'وضعیت موجودی', 'موجود'
      ]);
      const isStockActive = inStockStr === '' || inStockStr === '1' || inStockStr.toLowerCase() === 'true' || inStockStr === 'yes' || inStockStr.includes('موجود');

      const stockStr = getCsvFieldValue(item, [
        'stock', 'stock_quantity', 'qty', 'موجودی', 'تعداد', 'تعداد موجودی انبار', 'موجودی انبار', 'موجودی_انبار'
      ]);
      const cleanStockStr = stockStr.replace(/[۰-۹]/g, d => "۰۱۲۳۴۵۶۷۸۹".indexOf(d).toString()).replace(/,/g, '').replace(/[^\d.]/g, '');
      const stock = isStockActive ? (cleanStockStr !== '' ? Number(cleanStockStr) : 0) : 0;

      const category = getCsvFieldValue(item, [
        'categories', 'category', 'دسته بندی ها', 'دسته بندی‌ها', 'دسته بندی', 'دسته', 'دسته‌بندی', 'دسته_بندی', 'گروه'
      ]) || "بدون دسته بندی";

      const imagesStr = getCsvFieldValue(item, [
        'images', 'image', 'تصاویر', 'تصویر', 'عکس', 'تصویر_محصول', 'image_url', 'featured image', 'عکس محصول', 'نشانی تصویر', 'تصویر شاخص', 'رسانه', 'آدرس تصویر'
      ]);
      let imageUrl = "";
      if (imagesStr) {
        let rawImgStr = imagesStr.trim();
        if (rawImgStr.startsWith('[') && rawImgStr.endsWith(']')) {
          try {
            const arr = JSON.parse(rawImgStr);
            if (Array.isArray(arr) && arr.length > 0) {
              rawImgStr = arr[0]?.src || arr[0]?.url || arr[0] || '';
            }
          } catch (e) {
            // ignore
          }
        }
        const splitted = rawImgStr.split(/[|,;]/)[0].trim();
        if (splitted) imageUrl = splitted;
      }

      if (imageUrl.startsWith('//')) {
        imageUrl = 'https:' + imageUrl;
      }

      if (!imageUrl || (!imageUrl.startsWith('http') && !imageUrl.startsWith('data:') && !imageUrl.startsWith('/') && !imageUrl.startsWith('.') && !imageUrl.includes('.'))) {
        imageUrl = "https://images.unsplash.com/photo-1581798459219-318e76aecc7b?w=500";
      }

      const shortDesc = getCsvFieldValue(item, [
        'short description', 'short_description', 'توضیحات کوتاه', 'توضیح کوتاه', 'چکیده'
      ]);
      let unit = "بسته";
      if (shortDesc.includes("عدد")) unit = "عدد";
      else if (shortDesc.includes("کیلوگرم") || shortDesc.includes("کیلو")) unit = "کیلوگرم";
      else if (shortDesc.includes("کارتن")) unit = "کارتن";
      else if (shortDesc.includes("بسته")) unit = "بسته";

      const description = getCsvFieldValue(item, [
        'description', 'توضیحات کامل', 'توضیحات', 'شرح'
      ]) || shortDesc || "محصول باکیفیت و استاندارد عمده.";

      const isFeaturedStr = getCsvFieldValue(item, [
        'is featured?', 'is_featured', 'ویژه؟', 'محصول ویژه'
      ]);
      const isFeatured = isFeaturedStr === '1' || isFeaturedStr.toLowerCase() === 'true';

      const cartonPackStr = getCsvFieldValue(item, [
        'carton_pack_count', 'units_per_carton', 'pack_size', 'تعداد در کارتن', 'تعداد در هر کارتن', 'تعداد در بسته', 'تعداد_در_کارتن'
      ]);
      const cleanCartonPackStr = cartonPackStr.replace(/[۰-۹]/g, d => "۰۱۲۳۴۵۶۷۸۹".indexOf(d).toString()).replace(/,/g, '').replace(/[^\d.]/g, '');
      const cartonPackCount = cleanCartonPackStr !== '' ? Number(cleanCartonPackStr) : 1;

      parsed.push({
        id: `csv_${idx}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        sku: String(sku).trim(),
        name: String(name).trim(),
        brand: getCsvFieldValue(item, ['brand', 'برند', 'کارخانه']) || "دست اول",
        description: String(description),
        short_description: String(shortDesc),
        price: regPrice,
        bulk_price: bulkPrice > 0 ? bulkPrice : (regPrice > 0 ? Math.round(regPrice * bulkPriceFactor) : 0),
        consumer_price: consumerPrice > 0 ? consumerPrice : (regPrice > 0 ? Math.round(regPrice * consumerPriceFactor) : 0),
        purchase_price: purchasePrice,
        badge: badge,
        isFavorite: isFavorite,
        carton_pack_count: cartonPackCount,
        min_order_cartons: 1,
        stock_quantity_cartons: stock,
        category: String(category).trim(),
        image_url: imageUrl,
        unit: unit,
        isFeatured: isFeatured,
        sellerId: "",
        sellerName: "تامین کننده مرکزی",
        production_lead_time_days: 2,
        brandLogoUrl: ""
      });
    });

    return { parsed, skippedCount };
  };

  const handleParseCsvFile = (file: File) => {
    setLoading(true);
    setUploadedFileName(file.name);
    setUploadedFileSize(`${(file.size / 1024).toFixed(1)} KB`);
    
    const isJson = file.name.toLowerCase().endsWith('.json') || importFormat === 'json';
    setImportLogs(prev => [`در حال بارگذاری و خواندن فایل ${isJson ? 'JSON انبار' : 'CSV ووکامرس'}: ${file.name}...`, ...prev]);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = (event.target?.result as string) || '';
      const cleanText = text.replace(/^\uFEFF/, '').trim();

      if (isJson || (cleanText.startsWith('{') || cleanText.startsWith('['))) {
        try {
          const jsonData = JSON.parse(cleanText);
          const productsArray = Array.isArray(jsonData) ? jsonData : (jsonData.products || jsonData.items || []);
          
          if (!Array.isArray(productsArray)) {
            throw new Error("ساختار JSON نامعتبر است. باید آرایه‌ای از محصولات یا شیئی با کلید 'products' باشد.");
          }

          const { parsed, skippedCount } = parseWooCommerceCsvData(productsArray);
          
          if (parsed.length === 0) {
            setErrorMsg("هیچ داده معتبری در فایل JSON یافت نشد.");
            setLoading(false);
            return;
          }

          setCsvParsedProducts(parsed);
          setSelectedCsvIndices(parsed.map((_, i) => i));
          setSuccessMsg(`تعداد ${toPersianNum(parsed.length)} کالا با موفقیت از JSON استخراج شد.`);
          setImportLogs(prev => [`[JSON_SUCCESS] Successfully extracted ${parsed.length} products from JSON file.`, ...prev]);
          setLoading(false);
          return;
        } catch (err: any) {
          setErrorMsg("خطا در پردازش JSON: " + err.message);
          setLoading(false);
          return;
        }
      }

      let papaConfig: any = { header: true, skipEmptyLines: 'greedy' };
      if (cleanText.includes(';') && !cleanText.includes(',')) {
        papaConfig.delimiter = ';';
      } else if (cleanText.includes('\t') && !cleanText.includes(',')) {
        papaConfig.delimiter = '\t';
      }

      Papa.parse(cleanText, {
        ...papaConfig,
        complete: (results) => {
          let rowsData = results.data || [];
          if (rowsData.length > 0 && Object.keys(rowsData[0]).length <= 1) {
            if (cleanText.includes(';')) {
              rowsData = Papa.parse(cleanText, { header: true, delimiter: ';', skipEmptyLines: 'greedy' }).data;
            } else if (cleanText.includes('\t')) {
              rowsData = Papa.parse(cleanText, { header: true, delimiter: '\t', skipEmptyLines: 'greedy' }).data;
            }
          }

          const { parsed, skippedCount } = parseWooCommerceCsvData(rowsData);
          if (parsed.length === 0) {
            setErrorMsg("هیچ داده معتبری در فایل CSV ووکامرس یافت نشد. لطفا ساختار فایل را بررسی کنید.");
            setImportLogs(prev => [`[WOO_CSV_ERROR] No valid rows parsed from CSV file.`, ...prev]);
            setLoading(false);
            return;
          }

          setCsvParsedProducts(parsed);
          setSelectedCsvIndices(parsed.map((_, i) => i));
          setSuccessMsg(`تعداد ${toPersianNum(parsed.length)} کالا بدون هیچ خطایی از CSV استخراج شد${skippedCount > 0 ? ` (${toPersianNum(skippedCount)} سطر کاملاً خالی نادیده گرفته شد)` : ''}. دکمه «شروع ادغام و همگام‌سازی نهایی با انبار» را کلیک کنید.`);
          setImportLogs(prev => [`[WOO_CSV_SUCCESS] Successfully extracted ${parsed.length} products from CSV file "${file.name}" (${(file.size / 1024).toFixed(1)} KB). Ready for batch sync.`, ...prev]);
          setLoading(false);
        },
        error: (err: any) => {
          setErrorMsg("خطا در پردازش CSV: " + err.message);
          setLoading(false);
        }
      });
    };
    reader.readAsText(file, 'UTF-8');
  };

  const handleParseCsvText = (content?: string) => {
    const textToParse = content || csvTextData;
    if (!textToParse || !textToParse.trim()) {
      setErrorMsg("لطفاً متن داده‌ها را وارد کنید.");
      return;
    }
    setLoading(true);
    
    const isJson = textToParse.trim().startsWith('{') || textToParse.trim().startsWith('[') || importFormat === 'json';
    setUploadedFileName(isJson ? "ورودی متنی JSON" : "ورودی متنی نمونه CSV");
    setUploadedFileSize(`${(textToParse.length / 1024).toFixed(1)} KB`);

    const cleanText = textToParse.replace(/^\uFEFF/, '').trim();

    if (isJson) {
      try {
        const jsonData = JSON.parse(cleanText);
        const productsArray = Array.isArray(jsonData) ? jsonData : (jsonData.products || jsonData.items || []);
        const { parsed } = parseWooCommerceCsvData(productsArray);
        setCsvParsedProducts(parsed);
        setSelectedCsvIndices(parsed.map((_, i) => i));
        setSuccessMsg(`تعداد ${toPersianNum(parsed.length)} کالا از متن JSON استخراج شد.`);
        setLoading(false);
        return;
      } catch (err: any) {
        // Fallback to CSV if JSON fails but it might have been intentional CSV
        if (importFormat === 'json') {
          setErrorMsg("خطا در پردازش JSON: " + err.message);
          setLoading(false);
          return;
        }
      }
    }

    let papaConfig: any = { header: true, skipEmptyLines: 'greedy' };
    if (cleanText.includes(';') && !cleanText.includes(',')) {
      papaConfig.delimiter = ';';
    } else if (cleanText.includes('\t') && !cleanText.includes(',')) {
      papaConfig.delimiter = '\t';
    }

    Papa.parse(cleanText, {
      ...papaConfig,
      complete: (results) => {
        let rowsData = results.data || [];
        if (rowsData.length > 0 && Object.keys(rowsData[0]).length <= 1) {
          if (cleanText.includes(';')) {
            rowsData = Papa.parse(cleanText, { header: true, delimiter: ';', skipEmptyLines: 'greedy' }).data;
          } else if (cleanText.includes('\t')) {
            rowsData = Papa.parse(cleanText, { header: true, delimiter: '\t', skipEmptyLines: 'greedy' }).data;
          }
        }

        const { parsed, skippedCount } = parseWooCommerceCsvData(rowsData);
        if (parsed.length === 0) {
          setErrorMsg("فرمت متن وارد شده معتبر نیست یا کالایی در آن یافت نشد.");
          setLoading(false);
          return;
        }

        setCsvParsedProducts(parsed);
        setSelectedCsvIndices(parsed.map((_, i) => i));
        setSuccessMsg(`تعداد ${toPersianNum(parsed.length)} کالا از متن CSV استخراج شد${skippedCount > 0 ? ` (${toPersianNum(skippedCount)} سطر خالی نادیده گرفته شد)` : ''}.`);
        setImportLogs(prev => [`[WOO_CSV_TEXT] Parsed ${parsed.length} products from CSV text sample (Skipped ${skippedCount} empty rows).`, ...prev]);
        setLoading(false);
      },
      error: (err: any) => {
        setErrorMsg("خطا در خواندن متن CSV: " + err.message);
        setLoading(false);
      }
    });
  };

  const handleBatchSaveCsvProducts = async () => {
    if (selectedCsvIndices.length === 0) {
      setErrorMsg("لطفاً حداقل یک کالا را برای درون‌ریزی انتخاب نمایید.");
      return;
    }
    setLoading(true);
    setImportProgress(0);
    setImportLogs(prev => [`شروع درون‌ریزی و همگام‌سازی نهایی ${selectedCsvIndices.length} کالا با انبار...`, ...prev]);

    const itemsToImport = selectedCsvIndices.map(i => csvParsedProducts[i]).filter(Boolean);
    let importedCount = 0;
    let updatedCount = 0;
    let newCategoriesCount = 0;

    try {
      // 1. Process & Auto-Create Missing Categories
      const currentCatNames = (b2bConfig.categories || []).map((c: any) => typeof c === 'string' ? c.trim().toLowerCase() : (c.name || '').trim().toLowerCase());
      const newCatsToRegister: any[] = [];

      itemsToImport.forEach(item => {
        if (item.category && typeof item.category === 'string') {
          const catList = item.category.split(/[,>]/).map(s => s.trim()).filter(Boolean);
          catList.forEach(cName => {
            const lower = cName.toLowerCase();
            if (!currentCatNames.includes(lower) && !newCatsToRegister.some(nc => nc.name.toLowerCase() === lower)) {
              newCatsToRegister.push({
                id: `cat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                name: cName,
                icon: "Package"
              });
              currentCatNames.push(lower);
            }
          });
        }
      });

      if (newCatsToRegister.length > 0) {
        const updatedB2bCats = [...(b2bConfig.categories || []), ...newCatsToRegister];
        setCategories(updatedB2bCats);
        await onUpdateB2bConfig({ ...b2bConfig, categories: updatedB2bCats });
        newCategoriesCount = newCatsToRegister.length;
        setImportLogs(prev => [`[AUTO_CATEGORY] Registered ${newCategoriesCount} new category/categories: ${newCatsToRegister.map(c => c.name).join(', ')}`, ...prev]);
      }

      // 2. Import & Override Products
      const updatedProductsList = [...products];
      for (let i = 0; i < itemsToImport.length; i++) {
        const p = itemsToImport[i];
        if (i % 2 === 0) {
          await new Promise(resolve => setTimeout(resolve, 0));
        }

        const pct = Math.round(((i + 1) / itemsToImport.length) * 100);
        if (i % 3 === 0 || i === itemsToImport.length - 1) {
          setImportProgress(pct);
        }

        // Search for existing by SKU or Name in updatedProductsList to prevent duplicates
        const existingIdx = updatedProductsList.findIndex(prod => 
          (p.sku && prod.sku && String(prod.sku).trim().toLowerCase() === String(p.sku).trim().toLowerCase()) ||
          (prod.name && String(prod.name).trim().toLowerCase() === String(p.name).trim().toLowerCase())
        );

        if (existingIdx >= 0 && updateExistingBySku) {
          const existing = updatedProductsList[existingIdx];
          updatedProductsList[existingIdx] = {
            ...existing,
            name: p.name,
            sku: p.sku || existing.sku,
            price: p.price,
            bulk_price: p.bulk_price,
            consumer_price: p.consumer_price,
            stock_quantity_cartons: p.stock_quantity_cartons,
            category: p.category,
            description: p.description || existing.description,
            image_url: p.image_url || existing.image_url,
            unit: p.unit || existing.unit,
            isFeatured: p.isFeatured
          };
          updatedCount++;
          if (i % 5 === 0) {
            setImportLogs(prev => [`[OVERRIDE_UPDATED] Product #${existing.id} (${p.sku || p.name}) refreshed.`, ...prev.slice(0, 30)]);
          }
        } else {
          const newId = `doc_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
          updatedProductsList.push({
            id: newId,
            sku: p.sku || `PRD-${Math.random().toString(36).substring(2, 7)}`,
            name: p.name,
            brand: p.brand || "دست اول",
            brandLogoUrl: "",
            description: p.description || "",
            price: p.price,
            bulk_price: p.bulk_price,
            consumer_price: p.consumer_price,
            carton_pack_count: p.carton_pack_count || 24,
            min_order_cartons: p.min_order_cartons || 5,
            category: p.category || "مواد غذایی",
            stock_quantity_cartons: p.stock_quantity_cartons || 25,
            image_url: p.image_url || "https://images.unsplash.com/photo-1581798459219-318e76aecc7b?w=500",
            unit: p.unit || "بسته",
            isFeatured: p.isFeatured,
            sellerId: "",
            sellerName: "تامین کننده مرکزی",
            production_lead_time_days: 2,
            updated_at: new Date().toLocaleDateString('fa-IR') + ' - ' + new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })
          });
          importedCount++;
          if (i % 5 === 0) {
            setImportLogs(prev => [`[NEW_CREATED] Product (${p.sku || p.name}) added to database.`, ...prev.slice(0, 30)]);
          }
        }
      }

      if (onBulkUpdateProducts) {
        await onBulkUpdateProducts(updatedProductsList);
      } else {
        for (const p of updatedProductsList) {
          const existing = products.find(ep => ep.id === p.id);
          if (existing) {
            await onUpdateProduct(p.id, p);
          } else {
            await onAddProduct(p);
          }
        }
      }

      window.dispatchEvent(new Event("reload-products"));

      setImportSummary({
        imported: importedCount,
        updated: updatedCount,
        newCats: newCategoriesCount,
        total: itemsToImport.length
      });
      setShowImportSuccessModal(true);
      setSuccessMsg(`عملیات ووکامرس تکمیل شد! ${toPersianNum(importedCount)} کالای جدید ثبت، ${toPersianNum(updatedCount)} کالای موجود اورواید/بروزرسانی شد${newCategoriesCount > 0 ? ` و ${toPersianNum(newCategoriesCount)} دسته‌بندی جدید ایجاد گردید.` : '.'}`);
      setImportLogs(prev => [`[COMPLETE] Woo CSV Sync Finished successfully. ${importedCount} created, ${updatedCount} updated, ${newCategoriesCount} new categories.`, ...prev]);
      setCsvParsedProducts([]);
      setSelectedCsvIndices([]);
      setImportProgress(null);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(`خطا در هنگام ثبت کالاها: ${err.message}`);
      setImportLogs(prev => [`[ERROR] ${err.message}`, ...prev]);
      setImportProgress(null);
    } finally {
      setLoading(false);
    }
  };

  const handleExportInventoryToWooCsv = () => {
    if (!products || products.length === 0) {
      setErrorMsg("هیچ محصولی در انبار یافت نشد.");
      return;
    }
    const wooRows = products.map((p, idx) => ({
      "SKU": p.sku || `PRD-${101 + idx}`,
      "Name": p.name || "",
      "Published": "1",
      "Is featured?": p.isFeatured ? "1" : "0",
      "Visibility in catalog": "visible",
      "Short description": `واحد: ${p.unit || 'بسته'}`,
      "Description": p.description || "",
      "In stock?": (p.stock_quantity_cartons ?? 0) > 0 ? "1" : "0",
      "Stock": p.stock_quantity_cartons ?? 0,
      "Regular price": p.price || 0,
      "Sale price": p.consumer_price || "",
      "Categories": p.category || "مواد غذایی",
      "Images": p.image_url || ""
    }));

    const csvString = "\uFEFF" + Papa.unparse(wooRows);
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `woocommerce_products_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setSuccessMsg(`خروجی خروجی استاندارد ووکامرس برای ${toPersianNum(products.length)} کالا با موفقیت ایجاد و دانلود شد.`);
    setImportLogs(prev => [`[EXPORT] Exported ${products.length} inventory products to WooCommerce CSV file.`, ...prev]);
  };

  const handleDownloadWooCsvSample = () => {
    const csvContent = `\uFEFFSKU,Name,Published,Is featured?,Visibility in catalog,Short description,Description,In stock?,Stock,Regular price,Sale price,Categories,Images
PRD-101,"کالای نمونه یک",1,0,visible,"واحد: عدد","توضیحات کامل محصول نمونه",1,25,150000,135000,"مواد غذایی","https://images.unsplash.com/photo-1581798459219-318e76aecc7b?w=500"
PRD-102,"کالای نمونه دو",1,0,visible,"واحد: بسته","شرح کالا",1,10,85000,,"لوازم مصرفی",""`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'woocommerce_products_sample.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleJsonGoodsImport = async () => {
    if (!jsonImportText.trim()) return;
    setLoading(true);
    try {
      const parsed = JSON.parse(jsonImportText);
      const items = Array.isArray(parsed) ? parsed : [parsed];
      for (const item of items) {
        if (!item.name || !item.brand || !item.price) {
          throw new Error("فیلدهای نام، برند و قیمت برای هر محصول الزامی هستند.");
        }
        await onAddProduct({
          name: item.name,
          brand: item.brand,
          brandLogoUrl: item.brandLogoUrl || "",
          description: item.description || "معرفی شده توسط واردکننده سیستمی",
          price: Number(item.price),
          bulk_price: Number(item.bulk_price || item.price * 0.8),
          consumer_price: Number(item.consumer_price || item.price * 1.2),
          carton_pack_count: Number(item.carton_pack_count || 24),
          min_order_cartons: Number(item.min_order_cartons || 5),
          category: item.category || "تنقلات و شکلات",
          stock_quantity_cartons: Number(item.stock_quantity_cartons || 100),
          image_url: item.image_url || "https://images.unsplash.com/photo-1550547660-d9450f859349?w=500",
          unit: item.unit || "بسته",
          sellerId: item.sellerId || "",
          sellerName: item.sellerName || "گروه صنعتی به‌آرا (چی‌توز)",
          production_lead_time_days: Number(item.production_lead_time_days || 2),
          isFeatured: !!item.isFeatured,
          isNew: !!item.isNew
        }, true);
      }
      if (onRefreshProducts) await onRefreshProducts();
      setSuccessMsg(`${items.length} کالا با موفقیت از کدهای JSON وارد پلتفرم و انبار مرکزی شدند.`);
      setJsonImportText("");
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      console.error("JSON Goods Import error:", err);
      setErrorMsg("قالب‌بندی کدهای JSON نادرست است: " + err.message);
      setTimeout(() => setErrorMsg(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  // Source Code ZIP Exporter
  const handleDownloadSourceZip = () => {
    try {
      setSuccessMsg("شروع دانلود فایل فشرده (ZIP) سورس کد کامل پروژه...");
      const form = document.createElement("form");
      form.method = "POST";
      form.action = `/api/admin/download-source?t=${Date.now()}`;
      form.style.display = "none";
      document.body.appendChild(form);
      form.submit();
      document.body.removeChild(form);
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (e: any) {
      setErrorMsg("خطا در ایجاد درخواست دانلود سورس کد: " + e.message);
    }
  };

  // Full backup exporter (Export products & orders)
  const handleExportSystemBackup = () => {
    try {
      const backupObj = {
        exportedAt: new Date().toISOString(),
        appName: b2bConfig.appName || "دست اول",
        products: products,
        orders: orders
      };
      const jsonString = JSON.stringify(backupObj, null, 2);
      
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `dastavval-b2b-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setSuccessMsg("فایل پشتیبان کامل سیستم با موفقیت ساخته و در سیستم شما دانلود شد.");
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (e: any) {
      setErrorMsg("ساخت فایل پشتیبان با خطا مواجه شد.");
    }
  };

  // Restore system backup
  const handleRestoreSystemBackup = async () => {
    if (!backupText.trim()) return;
    setLoading(true);
    try {
      const parsed = JSON.parse(backupText);
      if (parsed.products && Array.isArray(parsed.products)) {
        for (const item of parsed.products) {
          await onAddProduct({
            name: item.name,
            brand: item.brand,
            brandLogoUrl: item.brandLogoUrl || "",
            description: item.description || "معرفی شده توسط واردکننده بکاپ",
            price: Number(item.price),
            bulk_price: Number(item.bulk_price || item.price * 0.8),
            consumer_price: Number(item.consumer_price || item.price * 1.2),
            carton_pack_count: Number(item.carton_pack_count || 24),
            min_order_cartons: Number(item.min_order_cartons || 5),
            category: item.category || "تنقلات و شکلات",
            stock_quantity_cartons: Number(item.stock_quantity_cartons || 100),
            image_url: item.image_url || "https://images.unsplash.com/photo-1550547660-d9450f859349?w=500",
            unit: item.unit || "بسته",
            sellerId: item.sellerId || "",
            sellerName: item.sellerName || "گروه صنعتی به‌آرا (چی‌توز)",
            production_lead_time_days: Number(item.production_lead_time_days || 2),
            isFeatured: !!item.isFeatured,
            isNew: !!item.isNew
          }, true);
        }
      }
      if (onRefreshProducts) await onRefreshProducts();
      setSuccessMsg("بازیابی بکاپ با موفقیت انجام شد و محصولات به انبار مرکزی کارخانجات پیوند خوردند.");
      setBackupText("");
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg("قالب‌بندی فایل بکاپ نادرست است: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddFactoryClick = () => {
    setIsEditingFactory(null);
    setFactoryName("");
    setFactoryLogo("");
    setFactoryDesc("");
    setFactoryLocation("");
    setFactoryRating(4.5);
    setFactoryYear(1400);
    setFactoryPhone("");
    setFactoryIsActive(true);
    setFactoryIsFeatured(false);
    setFactoryCode(generateFactoryCode());
    setFactoryProfileDesignMode('simple');
    setFactoryCustomHtml("");
    setFactoryCustomCss("");
    setFactoryCustomJs("");
    setFactoryCatalogs([]);
    setShowFactoryForm(true);
  };

  const handleFactorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let updatedFactories = [...factories];
      if (isEditingFactory) {
        updatedFactories = updatedFactories.map(f => f.id === isEditingFactory ? {
          ...f,
          name: factoryName,
          factoryCode: factoryCode || f.factoryCode || generateFactoryCode(),
          category: factoryCategory,
          logoUrl: factoryLogo,
          coverUrl: factoryCover,
          cover: factoryCover,
          galleryImages: factoryGalleryImages,
          description: factoryDesc,
          location: factoryLocation,
          rating: Number(factoryRating),
          establishedYear: Number(factoryYear),
          contactPhone: factoryPhone,
          isActive: factoryIsActive,
          isFeatured: factoryIsFeatured,
          isPinned: factoryIsFeatured,
          catalogs: factoryCatalogs,
          profileDesignMode: factoryProfileDesignMode,
          customHtml: factoryCustomHtml,
          customCss: factoryCustomCss,
          customJs: factoryCustomJs
        } : f);
      } else {
        const newFactory = {
          id: generateId('f'),
          factoryCode: factoryCode || generateFactoryCode(),
          name: factoryName,
          category: factoryCategory,
          logoUrl: factoryLogo,
          coverUrl: factoryCover || "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=1200",
          cover: factoryCover || "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=1200",
          galleryImages: factoryGalleryImages,
          description: factoryDesc,
          location: factoryLocation,
          rating: Number(factoryRating),
          establishedYear: Number(factoryYear),
          contactPhone: factoryPhone,
          isActive: factoryIsActive,
          isFeatured: factoryIsFeatured,
          isPinned: factoryIsFeatured,
          catalogs: factoryCatalogs,
          mainProducts: [],
          isPremium: true,
          totalDeals: 0,
          profileDesignMode: factoryProfileDesignMode,
          customHtml: factoryCustomHtml,
          customCss: factoryCustomCss,
          customJs: factoryCustomJs
        };
        updatedFactories.push(newFactory);
      }
      
      // Auto-register brand when adding/editing factory
      let currentBrands = [...(b2bConfig?.brands || brands || [])];
      const brandNameClean = (factoryName || "").trim();
      if (brandNameClean && !currentBrands.some((b: any) => (b.name || "").trim().toLowerCase() === brandNameClean.toLowerCase())) {
        const newBrandObj: BrandItem = {
          id: `brand_fac_${Date.now()}`,
          name: brandNameClean,
          type: factoryCategory || "تولیدکننده رسمی",
          icon: "🏭",
          logoUrl: factoryLogo || ""
        };
        currentBrands.push(newBrandObj);
        setBrands(currentBrands);
      }

      const updatedConfig = {
        ...b2bConfig,
        factories: updatedFactories,
        brands: currentBrands
      };
      await onUpdateB2bConfig(updatedConfig);
      setFactories(updatedFactories);
      setSuccessMsg("اطلاعات کارخانه و برند رسمی با موفقیت ذخیره شد!");
      setShowFactoryForm(false);
      setIsEditingFactory(null);
    } catch (err: any) {
      setErrorMsg("خطا در ذخیره اطلاعات کارخانه.");
    } finally {
      setLoading(false);
    }
  };

  const handleEditFactory = (f: any) => {
    setIsEditingFactory(f.id);
    setFactoryName(f.name);
    setFactoryCode(f.factoryCode || generateFactoryCode());
    setFactoryCategory(f.category || "تنقلات و شکلات");
    setFactoryLogo(f.logoUrl || f.logo || "");
    setFactoryCover(f.coverUrl || f.cover || "");
    setFactoryGalleryImages(f.galleryImages || []);
    setFactoryDesc(f.description || f.desc || "");
    setFactoryLocation(f.location || "");
    setFactoryRating(f.rating || 4.5);
    setFactoryYear(f.establishedYear || f.established || 1380);
    setFactoryPhone(f.contactPhone || "");
    setFactoryIsActive(f.isActive !== false);
    setFactoryIsFeatured(!!(f.isFeatured || f.isPinned));
    setFactoryCatalogs(f.catalogs || []);
    setFactoryProfileDesignMode(f.profileDesignMode || 'simple');
    setFactoryCustomHtml(f.customHtml || "");
    setFactoryCustomCss(f.customCss || "");
    setFactoryCustomJs(f.customJs || "");
    setShowFactoryForm(true);
  };

  const fetchSafeBuyRequests = async () => {
    try {
      const q = query(collection(db, "safe_buy_requests"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      const fetched: any[] = [];
      querySnapshot.forEach((docSnap) => {
        fetched.push({ firebaseId: docSnap.id, ...docSnap.data() });
      });
      setSafeBuyRequests(fetched);
    } catch (e) {
      console.warn("Failed to fetch safe buy requests in AdminPanel:", e);
    }
  };

  const handleUpdateSafeBuyStatus = async (reqId: string, firebaseId: string | undefined, nextStatus: 'approved' | 'rejected' | 'pending') => {
    setLoading(true);
    try {
      if (firebaseId) {
        await updateDoc(doc(db, "safe_buy_requests", firebaseId), { status: nextStatus });
      } else {
        const q = query(collection(db, "safe_buy_requests"), where("id", "==", reqId));
        const snap = await getDocs(q);
        if (!snap.empty) {
          await updateDoc(doc(db, "safe_buy_requests", snap.docs[0].id), { status: nextStatus });
        }
      }
      setSuccessMsg(`وضعیت درخواست خرید امن بروزرسانی شد.`);
      fetchSafeBuyRequests();
    } catch (e) {
      setErrorMsg("خطا در بروزرسانی وضعیت خرید امن.");
    } finally {
      setLoading(false);
    }
  };

  const handleStartEditOrder = (order: any) => {
    // Jump to orders tab and potentially set a filter
    setOrdersSearch(order.trackingNumber || "");
    setActiveSubTab('orders');
  };

  const onUpdateOrders = async () => {
    await fetchOrders();
  };

  const onUpdateReps = async () => {
    try {
      let firestoreReps: any[] = [];
      try {
        const repsSnapshot = await getDocs(collection(db, "representatives"));
        if (repsSnapshot && !repsSnapshot.empty) {
          firestoreReps = repsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        }
      } catch (e) {
        console.warn("Firestore reps fetch error:", e);
      }

      let savedLocal: any[] = [];
      try {
        savedLocal = JSON.parse(localStorage.getItem("dastavval_representatives") || "[]");
      } catch (e) {
        savedLocal = [];
      }

      const map = new globalThis.Map<string, any>();
      [...savedLocal, ...firestoreReps].forEach(r => {
        if (r && (r.id || r.phone || r.agencyCode)) {
          const key = r.id || r.agencyCode || r.phone;
          map.set(key, { ...map.get(key), ...r });
        }
      });
      const combined = Array.from(map.values());

      setRepresentativesList(combined);
      localStorage.setItem("dastavval_representatives", JSON.stringify(combined));

      const updatedConfig = {
        ...b2bConfig,
        representatives: combined
      };
      await onUpdateB2bConfig(updatedConfig);
    } catch (err) {
      console.warn("Error in onUpdateReps:", err);
    }
  };

  const handleToggleFactoryActive = async (factoryId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/b2b/factories/${factoryId}/toggle-active`, {
        method: "PATCH"
      });
      const data = await res.json();
      if (data.success) {
        setFactories(data.factories);
        if (onUpdateB2bConfig) {
          onUpdateB2bConfig({ ...b2bConfig, factories: data.factories });
        }
        setSuccessMsg("وضعیت فعال‌سازی کارخانه با موفقیت تغییر یافت.");
      } else {
        throw new Error(data.error || "Failed to toggle status");
      }
    } catch (err: any) {
      console.error("Factory toggle error:", err);
      setErrorMsg("خطا در تغییر وضعیت فعال‌سازی کارخانه.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFactoryFeatured = async (factoryId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/b2b/factories/${factoryId}/toggle-featured`, {
        method: "PATCH"
      });
      const data = await res.json();
      if (data.success) {
        setFactories(data.factories);
        if (onUpdateB2bConfig) {
          onUpdateB2bConfig({ ...b2bConfig, factories: data.factories });
        }
        setSuccessMsg("وضعیت ویژه کارخانه بروزرسانی شد.");
      } else {
        throw new Error(data.error || "Failed to toggle featured");
      }
    } catch (err) {
      console.error("Factory featured toggle error:", err);
      setErrorMsg("خطا در تغییر وضعیت ویژه.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFactory = async (factoryId: string) => {
    confirmAction("حذف کارخانه", "آیا از حذف این کارخانه اطمینان دارید؟", async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/b2b/factories/${factoryId}`, {
          method: "DELETE"
        });
        const data = await res.json();
        if (data.success) {
          setFactories(data.factories);
          if (onUpdateB2bConfig) {
            onUpdateB2bConfig({ ...b2bConfig, factories: data.factories });
          }
          setSuccessMsg("کارخانه با موفقیت حذف شد.");
        } else {
          throw new Error(data.error || "Failed to delete factory");
        }
      } catch (err) {
        console.error("Factory delete error:", err);
        setErrorMsg("خطا در حذف کارخانه.");
      } finally {
        setLoading(false);
      }
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row rtl overflow-hidden font-sans">
      <aside className="hidden md:flex w-64 bg-white border-l border-slate-100 flex-col h-screen sticky top-0 shrink-0">
        <div className="p-6 flex flex-col h-full overflow-y-auto custom-scrollbar">
          <div className="space-y-6">
            <section>
              <p className="text-[10px] font-black text-slate-400 mb-4 px-2 uppercase tracking-tighter opacity-60 font-sans">SALES & ORDERS</p>
              <nav className="space-y-1.5">
                <button
                  onClick={() => setActiveSubTab('orders')}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-xs font-black transition-all cursor-pointer ${
                    activeSubTab === 'orders'
                      ? "bg-emerald-600 text-white shadow-xl shadow-emerald-600/25"
                      : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                  }`}
                >
                  <ClipboardList size={18} />
                  سفارشات عمده
                </button>
              </nav>
            </section>

            <section>
              <p className="text-[10px] font-black text-slate-400 mb-4 px-2 uppercase tracking-tighter opacity-60 font-sans">DISTRIBUTION & AI</p>
              <nav className="space-y-1.5">
                <button
                  onClick={() => { setShowImporterDashboard(true); setShowForm(false); setShowAiSettings(false); setIsSidebarOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-xs font-black transition-all cursor-pointer ${
                    showImporterDashboard
                      ? "bg-blue-600 text-white shadow-xl shadow-blue-600/25"
                      : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                  }`}
                >
                  <RefreshCw size={18} />
                  واردکننده هوشمند
                </button>
                
                <button
                  onClick={() => { setActiveSubTab('crm'); setShowForm(false); setShowAiSettings(false); setShowImporterDashboard(false); setIsSidebarOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-xs font-black transition-all cursor-pointer ${
                    activeSubTab === 'crm'
                      ? "bg-indigo-600 text-white shadow-xl shadow-indigo-600/25"
                      : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                  }`}
                >
                  <Users size={18} />
                  مشتریان (CRM)
                </button>
              </nav>
            </section>

            <section>
              <p className="text-[10px] font-black text-slate-400 mb-4 px-2 uppercase tracking-tighter opacity-60 font-sans">SETTINGS</p>
              <nav className="space-y-1.5">
                <button
                  onClick={() => { setActiveSubTab('sms'); setShowForm(false); setShowAiSettings(false); setShowImporterDashboard(false); setIsSidebarOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-xs font-black transition-all cursor-pointer ${
                    activeSubTab === 'sms'
                      ? "bg-rose-600 text-white shadow-xl shadow-rose-600/25"
                      : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                  }`}
                >
                  <Smartphone size={18} />
                  تنظیمات پنل پیامک (SMS)
                </button>
                <button
                  onClick={() => { setActiveSubTab('parspack_storage'); setShowForm(false); setShowAiSettings(false); setShowImporterDashboard(false); setIsSidebarOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-xs font-black transition-all cursor-pointer ${
                    activeSubTab === 'parspack_storage'
                      ? "bg-cyan-600 text-white shadow-xl shadow-cyan-600/25"
                      : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                  }`}
                >
                  <HardDrive size={18} />
                  مدیریت باکت پارس‌پک (S3)
                </button>

                <button
                  onClick={() => { setActiveSubTab('system'); setShowForm(false); setShowAiSettings(false); setShowImporterDashboard(false); setIsSidebarOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-xs font-black transition-all cursor-pointer ${
                    activeSubTab === 'system' && !showAiSettings && !showImporterDashboard
                      ? "bg-slate-100 text-slate-900 shadow-xl shadow-slate-200/25 border border-slate-200"
                      : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                  }`}
                >
                  <Server size={18} />
                  مدیریت سرور و زیرساخت
                </button>

                <button
                  onClick={() => { handleDownloadSourceZip(); setIsSidebarOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-xs font-black transition-all bg-gradient-to-r from-amber-500 to-emerald-600 text-slate-950 shadow-md hover:brightness-110 active:scale-95 cursor-pointer"
                >
                  <Download size={18} />
                  دانلود سورس کد (.ZIP)
                </button>

                <button
                  onClick={() => { setActiveSubTab('invoice'); setShowForm(false); setShowAiSettings(false); setShowImporterDashboard(false); setIsSidebarOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-xs font-black transition-all cursor-pointer ${
                    activeSubTab === 'invoice'
                      ? "bg-purple-600 text-white shadow-xl shadow-purple-600/25"
                      : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                  }`}
                >
                  <FileText size={18} />
                  تنظیمات فاکتور رسمی
                </button>

                <button
                  onClick={() => { setActiveSubTab('profile'); setShowForm(false); setShowAiSettings(false); setShowImporterDashboard(false); setIsSidebarOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-xs font-black transition-all cursor-pointer ${
                    activeSubTab === 'profile'
                      ? "bg-slate-100 text-slate-800 shadow-xl"
                      : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                  }`}
                >
                  <User size={18} />
                  پروفایل و امنیت
                </button>
                
                <button
                  onClick={() => { setShowAiSettings(true); setShowForm(false); setShowImporterDashboard(false); setIsSidebarOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-xs font-black transition-all cursor-pointer ${
                    showAiSettings
                      ? "bg-amber-600 text-white shadow-xl shadow-amber-600/25"
                      : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                  }`}
                >
                  <Cpu size={18} />
                  هسته هوش مصنوعی
                </button>

                <button
                  onClick={() => { setActiveSubTab('channel_posts'); setShowForm(false); setShowAiSettings(false); setShowImporterDashboard(false); setIsSidebarOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-xs font-black transition-all cursor-pointer ${
                    activeSubTab === 'channel_posts' && !showAiSettings && !showImporterDashboard
                      ? "bg-indigo-600 text-white shadow-xl shadow-indigo-600/25"
                      : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                  }`}
                >
                  <Megaphone size={18} />
                  کانال اطلاع‌رسانی
                </button>
              </nav>
            </section>
          </div>
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50/50 mt-auto">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-black text-xs shadow-sm">
              AD
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-[11px] font-black text-slate-800 truncate">مدیریت کل سامانه</p>
              <p className="text-[9px] text-slate-400 font-bold truncate">09914762406</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-[10px] font-black text-rose-500 hover transition-all cursor-pointer group border border-transparent hover"
          >
            <span className="flex items-center gap-2">
              <LogOut size={14} />
              خروج امن
            </span>
            <ChevronRight size={12} className="opacity-0 group-hover:opacity-100 transition-all -rotate-180" />
          </button>
        </div>
      </aside>

      {/* DYNAMIC CONTENT AREA */}
      <main className="flex-1 min-h-screen overflow-y-auto p-4 sm:p-8 lg:p-12 space-y-8 lg:space-y-10 custom-scrollbar pb-32">
        
        {/* DASHBOARD HEADER */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 lg:gap-8 mb-4">
          <div className="flex items-center gap-4 w-full lg:w-auto">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-3 bg-white border border-slate-200 rounded-2xl text-slate-600 shadow-sm active:scale-95 transition-all"
            >
              <Menu size={24} />
            </button>
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <div className="w-2 h-8 bg-emerald-600 rounded-full hidden sm:block" />
                <h2 className="text-xl sm lg font-black text-slate-800 tracking-tight">
                  {activeSubTab === 'dashboard' && !showImporterDashboard && !showAiSettings && "مانیتورینگ توزیع"}
                  {activeSubTab === 'approvals' && "صف تایید و مدیریت تقاضاها"}
                  {activeSubTab === 'representatives' && "مدیریت نمایندگان و شعب"}
                  {activeSubTab === 'products' && "مدیریت کاتالوگ"}
                  {activeSubTab === 'orders' && "سفارشات عمده"}
                  {activeSubTab === 'crm' && "باشگاه مشتریان"}
                  {activeSubTab === 'system' && !showAiSettings && !showImporterDashboard && "مدیریت سرور و زیرساخت"}
                  {activeSubTab === 'invoice' && "تنظیمات فاکتور رسمی"}
                  {activeSubTab === 'profile' && "تنظیمات پروفایل"}
                  {activeSubTab === 'channel_posts' && "مدیریت پست‌های کانال اطلاع‌رسانی"}
                  {showImporterDashboard && "واردکننده هوشمند"}
                  {showAiSettings && "هسته پردازش AI"}
                </h2>
              </div>
              <p className="text-[10px] sm text-slate-400 font-bold sm:mr-5 opacity-80">
                بروزرسانی: {toPersianNum(new Date().toLocaleTimeString('fa-IR'))}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full lg:w-auto">
            {(activeSubTab === 'products' || activeSubTab === 'dashboard') && (
              <AddAdButton variant="desktop" className="flex-1 sm:flex-none py-3.5 sm:py-4 rounded-2xl" />
            )}
            {activeSubTab === 'products' && (
              <button
                onClick={() => {
                  if (showForm) {
                    handleResetForm();
                  } else {
                    setIsEditing(null);
                    setShowForm(true);
                  }
                  setShowAiSettings(false);
                }}
                className="flex-1 sm:flex-none bg-emerald-600 hover text-white font-black text-[10px] sm px-5 sm:px-8 py-3.5 sm:py-4 rounded-2xl transition-all shadow-xl shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                {showForm ? <ArrowLeft size={16} /> : <PlusCircle size={16} />}
                {showForm ? "بازگشت" : "تعریف کالا"}
              </button>
            )}
            
            <div className="flex flex-col items-center sm:items-end gap-1.5 flex-1 sm:flex-none">
              <button
                onClick={handleDownloadSourceZip}
                className="w-full bg-gradient-to-r from-amber-500 via-amber-400 to-emerald-500 hover:brightness-105 text-slate-950 font-black text-xs px-4 sm:px-6 py-3.5 sm:py-4 rounded-2xl transition-all shadow-xl shadow-amber-500/25 flex items-center justify-center gap-2 cursor-pointer active:scale-95 border border-amber-300"
                title="دانلود مستقیم فایل ZIP سورس کد کامل پروژه"
              >
                <Download size={18} className="text-slate-950" />
                <span>دانلود سورس کد (.ZIP)</span>
              </button>
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[9px] font-black border border-emerald-200/60 shadow-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                سورس زنده و کامپایل‌شده: v4.1.0-Release
              </div>
            </div>

            <button
              onClick={() => onRefreshProducts?.()}
              className="flex-none bg-white border border-slate-200 text-slate-600 p-3.5 sm:p-4 rounded-2xl hover transition-all shadow-md group"
              title="بروزرسانی داده‌های سامانه"
            >
              <RefreshCw size={18} />
            </button>
          </div>
        </div>

        {/* Action Messages */}
        <AnimatePresence>
          {successMsg && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-2xl p-5 text-xs font-black flex items-center gap-4 shadow-xl shadow-emerald-600/5"
            >
              <CheckCircle size={18} className="text-emerald-600" />
              <span className="flex-1">{successMsg}</span>
              <button onClick={() => setSuccessMsg(null)}><X size={16} /></button>
            </motion.div>
          )}
          {errorMsg && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="bg-red-50 text-red-800 border border-red-200 rounded-2xl p-5 text-xs font-black flex items-center gap-4 shadow-xl shadow-red-600/5"
            >
              <ShieldAlert size={18} className="text-red-600" />
              <span className="flex-1">{errorMsg}</span>
              <button onClick={() => setErrorMsg(null)}><X size={16} /></button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* PENDING APPROVALS URGENT ALERT BANNER - ENSURES NO AD IS EVER LOST OR FORGOTTEN */}
        {(() => {
          const pendingAds = (sponsoredAds || []).filter((a: any) => !a.status || a.status === 'pending' || a.status === 'در حال بررسی').length;
          const pendingRaw = (rawMaterialAds || []).filter((a: any) => a.isPendingApproval || !a.status || a.status === 'pending' || a.status === 'در حال بررسی').length;
          const pendingEq = (equipmentAds || []).filter((a: any) => a.isPendingApproval || !a.status || a.status === 'pending' || a.status === 'در حال بررسی').length;
          const pendingSrv = (serviceAds || []).filter((a: any) => a.isPendingApproval || !a.status || a.status === 'pending' || a.status === 'در حال بررسی').length;
          const totalPending = pendingAds + pendingRaw + pendingEq + pendingSrv;
          if (totalPending > 0 && activeSubTab !== 'approvals') {
            return (
              <div className="bg-gradient-to-r from-amber-500 via-orange-600 to-amber-600 text-white p-5 rounded-3xl shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 border border-amber-400/40">
                <div className="flex items-center gap-3 text-right">
                  <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl text-white">
                    <Zap size={22} className="animate-bounce" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-black tracking-tight">
                      🔔 توجه مدیریت: ${totalPending} آگهی و تقاضای جدید در صف انتظار تأیید و انتشار است!
                    </h4>
                    <p className="text-[10px] text-amber-100 font-bold mt-0.5">
                      برای جلوگیری از گم شدن یا ماندن آگهی‌های کاربران، لطفاً صف تایید را بررسی و منتشر کنید.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => { setActiveSubTab('approvals'); setShowForm(false); setShowAiSettings(false); setShowImporterDashboard(false); }}
                  className="px-5 py-3 bg-white text-slate-950 hover:bg-amber-50 rounded-2xl text-xs font-black shadow-lg transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap active:scale-95"
                >
                  <span>بررسی فوری صف تایید</span>
                  <ArrowLeft size={16} />
                </button>
              </div>
            );
          }
          return null;
        })()}

        {/* ROLE SELECTOR BAR & PERMISSION NOTICE */}
        <div className="bg-slate-50 border border-slate-200 p-3 rounded-2xl shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-900">
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-emerald-600 shrink-0" />
            <span className="text-xs font-black text-slate-700">سطح دسترسی پنل:</span>
          </div>
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setPanelRole('sellers')}
              className={`flex-1 sm:flex-none px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
                panelRole === 'sellers'
                  ? "bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-600/30"
                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Users size={14} />
              <span>مدیریت کل (ادمین)</span>
            </button>

            <button
              onClick={() => setPanelRole('suppliers')}
              className={`flex-1 sm:flex-none px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
                panelRole === 'suppliers'
                  ? "bg-amber-500 border-amber-400 text-slate-950 shadow-lg shadow-amber-500/30"
                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Building2 size={14} />
              <span>کارخانه / تامین‌کننده</span>
            </button>

            <button
              onClick={() => setPanelRole('customers')}
              className={`flex-1 sm:flex-none px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
                panelRole === 'customers'
                  ? "bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/30"
                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              <ShoppingBag size={14} />
              <span>پرتال خریداران</span>
            </button>
          </div>
        </div>



        {panelRole === 'suppliers' && (
          <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl p-4 text-xs font-bold flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-2.5">
              <Building2 size={20} className="text-amber-700 shrink-0" />
              <div>
                <strong className="font-black text-amber-950 block">پنل اختصاصی کارخانه و تامین‌کنندگان کالا:</strong>
                <span>امکان افزودن و ویرایش کالاها و مشاهده سفارشات عمده فعال است. مشخصات مستقیم تماس خریدار توسط دفتر مرکزی سرپرستی می‌گردد.</span>
              </div>
            </div>
            <button
              onClick={() => { setActiveSubTab('products'); setShowForm(true); }}
              className="bg-amber-600 hover:bg-amber-700 text-white font-black text-[11px] px-4 py-2.5 rounded-xl transition-all shadow-md shrink-0 flex items-center gap-1.5 cursor-pointer"
            >
              <PlusCircle size={15} />
              افزودن محصول کارخانه
            </button>
          </div>
        )}

        {/* UNIFIED ADVANCED TOP NAVIGATION BAR CATEGORIES */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {/* CATEGORY 1: Monitoring */}
          <button
            onClick={() => { setAdminCategory('monitoring'); setActiveSubTab('dashboard'); setShowForm(false); setShowAiSettings(false); setShowImporterDashboard(false); }}
            className={`p-4 rounded-[1.25rem] border text-right transition-all duration-300 relative overflow-hidden group cursor-pointer ${
              adminCategory === 'monitoring'
                ? "bg-emerald-50/70 border-emerald-400 shadow-xs"
                : "bg-white border-slate-100 hover:border-slate-300"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className={`p-2 rounded-xl ${adminCategory === 'monitoring' ? 'bg-emerald-600 text-white' : 'bg-slate-50 text-slate-500'}`}>
                <Activity size={18} />
              </span>
              <span className="text-[10px] font-bold text-slate-400">۰۱</span>
            </div>
            <h3 className="text-xs font-black text-slate-800">آمارهای اصلی و پایش</h3>
            <p className="text-[9px] text-slate-400 font-medium mt-1">میزکار، گزارش‌ها، فروش</p>
            {adminCategory === 'monitoring' && <div className="absolute bottom-0 right-0 left-0 h-1 bg-emerald-600" />}
          </button>

          {/* CATEGORY 2: Catalog & Factories */}
          <button
            onClick={() => { setAdminCategory('catalog'); setActiveSubTab('products'); setShowForm(false); setShowAiSettings(false); setShowImporterDashboard(false); }}
            className={`p-4 rounded-[1.25rem] border text-right transition-all duration-300 relative overflow-hidden group cursor-pointer ${
              adminCategory === 'catalog'
                ? "bg-amber-50/70 border-amber-400 shadow-xs"
                : "bg-white border-slate-100 hover:border-slate-300"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className={`p-2 rounded-xl ${adminCategory === 'catalog' ? 'bg-amber-500 text-slate-950' : 'bg-slate-50 text-slate-500'}`}>
                <Package size={18} />
              </span>
              <span className="text-[10px] font-bold text-slate-400">۰۲</span>
            </div>
            <h3 className="text-xs font-black text-slate-800">محصولات و تولیدکنندگان</h3>
            <p className="text-[9px] text-slate-400 font-medium mt-1">کاتالوگ، دسته‌ها، کارخانجات</p>
            {adminCategory === 'catalog' && <div className="absolute bottom-0 right-0 left-0 h-1 bg-amber-500" />}
          </button>

          {/* CATEGORY 3: Sales & Commerce */}
          <button
            onClick={() => { setAdminCategory('sales'); setActiveSubTab('orders'); setShowForm(false); setShowAiSettings(false); setShowImporterDashboard(false); }}
            className={`p-4 rounded-[1.25rem] border text-right transition-all duration-300 relative overflow-hidden group cursor-pointer ${
              adminCategory === 'sales'
                ? "bg-indigo-50/70 border-indigo-400 shadow-xs"
                : "bg-white border-slate-100 hover:border-slate-300"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className={`p-2 rounded-xl ${adminCategory === 'sales' ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-500'}`}>
                <ClipboardList size={18} />
              </span>
              <span className="text-[10px] font-bold text-slate-400">۰۳</span>
            </div>
            <h3 className="text-xs font-black text-slate-800">عملیات تجاری و CRM</h3>
            <p className="text-[9px] text-slate-400 font-medium mt-1">سفارشات، باشگاه مشتریان، فاکتور</p>
            {adminCategory === 'sales' && <div className="absolute bottom-0 right-0 left-0 h-1 bg-indigo-600" />}
          </button>

          {/* CATEGORY 4: System & Infrastructure */}
          <button
            onClick={() => { setAdminCategory('system'); setActiveSubTab('system'); setShowForm(false); setShowAiSettings(false); setShowImporterDashboard(false); }}
            className={`p-4 rounded-[1.25rem] border text-right transition-all duration-300 relative overflow-hidden group cursor-pointer ${
              adminCategory === 'system'
                ? "bg-purple-50/70 border-purple-400 shadow-xs"
                : "bg-white border-slate-100 hover:border-slate-300"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className={`p-2 rounded-xl ${adminCategory === 'system' ? 'bg-purple-600 text-white' : 'bg-slate-50 text-slate-500'}`}>
                <Server size={18} />
              </span>
              <span className="text-[10px] font-bold text-slate-400">۰۴</span>
            </div>
            <h3 className="text-xs font-black text-slate-800">تنظیمات و زیرساخت</h3>
            <p className="text-[9px] text-slate-400 font-medium mt-1">پنل پیامک، باکت پارس‌پک، پشتیبان‌گیری و مالی</p>
            {adminCategory === 'system' && <div className="absolute bottom-0 right-0 left-0 h-1 bg-purple-600" />}
          </button>

          {/* CATEGORY 5: Ads Billboard */}
          <button
            onClick={() => { setAdminCategory('ads'); setActiveSubTab('ads'); setShowForm(false); setShowAiSettings(false); setShowImporterDashboard(false); }}
            className={`p-4 rounded-[1.25rem] border text-right transition-all duration-300 relative overflow-hidden group cursor-pointer ${
              adminCategory === 'ads'
                ? "bg-rose-50/70 border-rose-400 shadow-xs"
                : "bg-white border-slate-100 hover:border-slate-300 shadow-sm"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className={`p-2 rounded-xl ${adminCategory === 'ads' ? 'bg-rose-500 text-white shadow-lg shadow-rose-200' : 'bg-slate-50 text-slate-500'}`}>
                <Megaphone size={18} />
              </span>
              <span className="text-[10px] font-bold text-slate-400">۰۵</span>
            </div>
            <h3 className="text-xs font-black text-slate-800">پیشخوان آگهی‌ها</h3>
            <p className="text-[9px] text-slate-400 font-medium mt-1">کف قیمت بازار و تهاتر کالا</p>
            {adminCategory === 'ads' && <div className="absolute bottom-0 right-0 left-0 h-1 bg-rose-500" />}
          </button>
        </div>

        {/* SUB-PILLS BELONGING TO ACTIVE CATEGORY */}
        <div className="bg-slate-50/80 border border-slate-150 p-2 rounded-2xl flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {/* Category 1: Monitoring and Stats */}
            {adminCategory === 'monitoring' && (
              <>
                <button
                  onClick={() => { setActiveSubTab('dashboard'); setShowForm(false); setShowAiSettings(false); setShowImporterDashboard(false); }}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeSubTab === 'dashboard' && !showImporterDashboard && !showAiSettings
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "text-slate-600 hover:bg-slate-200/60"
                  }`}
                >
                  <Activity size={12} />
                  <span>مانیتورینگ و آمار اصلی</span>
                </button>
                <button
                  onClick={() => { setActiveSubTab('approvals'); setShowForm(false); setShowAiSettings(false); setShowImporterDashboard(false); }}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeSubTab === 'approvals'
                      ? "bg-amber-500 text-slate-950 shadow-xs font-black"
                      : "text-slate-600 hover:bg-slate-200/60"
                  }`}
                >
                  <Zap size={12} className={activeSubTab === 'approvals' ? "text-slate-950" : "text-amber-500"} />
                  <span>صف تایید درخواست‌ها</span>
                  <span className="px-1.5 py-0.2 rounded-md text-[9px] font-black bg-amber-100 text-amber-900">
                    اولویت‌دار
                  </span>
                </button>
                <button
                  onClick={() => { setActiveSubTab('reports' as any); setShowForm(false); setShowAiSettings(false); setShowImporterDashboard(false); }}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeSubTab === 'reports'
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "text-slate-600 hover:bg-slate-200/60"
                  }`}
                >
                  <BarChart2 size={12} />
                  <span>آنالیز هوشمند فروش</span>
                </button>
              </>
            )}

            
            {/* Category 5: Ads */}
            {adminCategory === 'ads' && (
              <>
                <button
                  onClick={() => { setActiveSubTab('ads'); setShowForm(false); setShowAiSettings(false); setShowImporterDashboard(false); }}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeSubTab === 'ads'
                      ? "bg-rose-500 text-white shadow-xs font-black"
                      : "text-slate-600 hover:bg-slate-200/60"
                  }`}
                >
                  <Megaphone size={12} />
                  <span>بیلبورد آگهی‌ها</span>
                </button>
                <button
                  onClick={() => { setActiveSubTab('safe_buy'); setShowForm(false); setShowAiSettings(false); setShowImporterDashboard(false); }}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeSubTab === 'safe_buy'
                      ? "bg-rose-500 text-white shadow-xs font-black"
                      : "text-slate-600 hover:bg-slate-200/60"
                  }`}
                >
                  <ShieldCheck size={12} />
                  <span>درخواست‌های خرید امن (Safe Buy)</span>
                </button>
              </>
            )}
            
            {/* Category 2: Catalog */}
            {adminCategory === 'catalog' && (
              <>
                <button
                  onClick={() => { setActiveSubTab('factory_audit' as any); setShowForm(false); setShowAiSettings(false); setShowImporterDashboard(false); }}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeSubTab === 'factory_audit'
                      ? "bg-amber-500 text-slate-950 shadow-xs font-black ring-2 ring-amber-400"
                      : "bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100"
                  }`}
                >
                  <Building2 size={12} className="text-amber-700" />
                  <span>🏢 محصولات ممیزی کارخانه‌ها</span>
                  {products.filter(p => (p.factoryName || p.factory_name || (p.sellerId && p.sellerId !== 'admin')) && (p.approvalStatus === 'pending' || (!p.approvalStatus && !p.isApproved)) && !p.disabled).length > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-rose-600 text-white animate-pulse">
                      {toPersianNum(products.filter(p => (p.factoryName || p.factory_name || (p.sellerId && p.sellerId !== 'admin')) && (p.approvalStatus === 'pending' || (!p.approvalStatus && !p.isApproved)) && !p.disabled).length)}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => { setActiveSubTab('products'); setShowForm(false); setShowAiSettings(false); setShowImporterDashboard(false); }}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeSubTab === 'products'
                      ? "bg-amber-500 text-slate-950 shadow-xs font-black"
                      : "text-slate-600 hover:bg-slate-200/60"
                  }`}
                >
                  <Package size={12} />
                  <span>انبار محصولات کاتالوگ</span>
                </button>
                <button
                  onClick={() => { setActiveSubTab('product_sync_status'); setShowForm(false); setShowAiSettings(false); setShowImporterDashboard(false); }}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeSubTab === 'product_sync_status'
                      ? "bg-emerald-600 text-white shadow-xs font-black"
                      : "text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
                  }`}
                >
                  <Activity size={12} />
                  <span>پایش بروزرسانی محصولات و باکت</span>
                </button>
                <button
                  onClick={() => { setActiveSubTab('categories'); setShowForm(false); setShowAiSettings(false); setShowImporterDashboard(false); }}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeSubTab === 'categories'
                      ? "bg-amber-500 text-slate-950 shadow-xs font-black"
                      : "text-slate-600 hover:bg-slate-200/60"
                  }`}
                >
                  <Layers size={12} />
                  <span>دسته‌بندی‌های کالا</span>
                </button>
                <button
                  onClick={() => { setActiveSubTab('brands'); setShowForm(false); setShowAiSettings(false); setShowImporterDashboard(false); }}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeSubTab === 'brands'
                      ? "bg-amber-500 text-slate-950 shadow-xs font-black"
                      : "text-slate-600 hover:bg-slate-200/60"
                  }`}
                >
                  <Award size={12} />
                  <span>برندهای همکار</span>
                </button>
                <button
                  onClick={() => { setActiveSubTab('factories'); setShowForm(false); setShowAiSettings(false); setShowImporterDashboard(false); }}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeSubTab === 'factories'
                      ? "bg-amber-500 text-slate-950 shadow-xs font-black"
                      : "text-slate-600 hover:bg-slate-200/60"
                  }`}
                >
                  <Building2 size={12} />
                  <span>مشخصات کارخانجات</span>
                </button>
                <button
                  onClick={() => { setActiveSubTab('branding'); setShowForm(false); setShowAiSettings(false); setShowImporterDashboard(false); }}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeSubTab === 'branding'
                      ? "bg-amber-500 text-slate-950 shadow-xs font-black"
                      : "text-slate-600 hover:bg-slate-200/60"
                  }`}
                >
                  <Settings size={12} />
                  <span>تنظیمات سود و کمیسیون</span>
                </button>
                <button
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeSubTab === 'ads'
                      ? "bg-amber-500 text-slate-950 shadow-xs font-black"
                      : "text-slate-600 hover:bg-slate-200/60"
                  }`}
                >
                  <Megaphone size={12} />
                  <span>مدیریت بیلبورد آگهی‌ها</span>
                </button>
              </>
            )}

            {/* Category 3: Commerce */}
            {adminCategory === 'sales' && (
              <>
                <button
                  onClick={() => { setActiveSubTab('approvals'); setShowForm(false); setShowAiSettings(false); setShowImporterDashboard(false); }}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeSubTab === 'approvals'
                      ? "bg-amber-500 text-slate-950 shadow-xs font-black"
                      : "text-slate-600 hover:bg-slate-200/60"
                  }`}
                >
                  <Zap size={12} className={activeSubTab === 'approvals' ? "text-slate-950" : "text-amber-500"} />
                  <span>صف تایید درخواست‌ها</span>
                  <span className="px-1.5 py-0.2 rounded-md text-[9px] font-black bg-amber-100 text-amber-900">
                    جدید
                  </span>
                </button>
                <button
                  onClick={() => { setActiveSubTab('orders'); setShowForm(false); setShowAiSettings(false); setShowImporterDashboard(false); }}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeSubTab === 'orders'
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "text-slate-600 hover:bg-slate-200/60"
                  }`}
                >
                  <ClipboardList size={12} />
                  <span>سفارشات عمده فعال</span>
                </button>
                <button
                  onClick={() => { setActiveSubTab('crm'); setShowForm(false); setShowAiSettings(false); setShowImporterDashboard(false); }}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeSubTab === 'crm'
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "text-slate-600 hover:bg-slate-200/60"
                  }`}
                >
                  <Users size={12} />
                  <span>مدیریت مشتریان (CRM)</span>
                </button>
                <button
                  onClick={() => { setActiveSubTab('representatives'); setShowForm(false); setShowAiSettings(false); setShowImporterDashboard(false); }}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeSubTab === 'representatives'
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "text-slate-600 hover:bg-slate-200/60"
                  }`}
                >
                  <Building2 size={12} />
                  <span>نمایندگان توزیع</span>
                </button>
                <button
                  onClick={() => { setActiveSubTab('invoice'); setShowForm(false); setShowAiSettings(false); setShowImporterDashboard(false); }}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeSubTab === 'invoice'
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "text-slate-600 hover:bg-slate-200/60"
                  }`}
                >
                  <FileText size={12} />
                  <span>تنظیمات فاکتور رسمی</span>
                </button>
                <button
                  onClick={() => { setActiveSubTab('barter'); setShowForm(false); setShowAiSettings(false); setShowImporterDashboard(false); }}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeSubTab === 'barter'
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "text-slate-600 hover:bg-slate-200/60"
                  }`}
                >
                  <RefreshCw size={12} />
                  <span>سامانه تهاتر کالا</span>
                </button>
              </>
            )}

            {/* Category 4: Infrastructure */}
            {adminCategory === 'system' && (
              <>
                <button
                  onClick={() => { setActiveSubTab('sms'); setShowForm(false); setShowAiSettings(false); setShowImporterDashboard(false); }}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-black transition-all flex items-center gap-1.5 cursor-pointer border ${
                    activeSubTab === 'sms'
                      ? "bg-rose-600 text-white border-rose-500 shadow-xs"
                      : "text-slate-600 bg-white border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <Smartphone size={12} />
                  <span>💬 تنظیمات پنل پیامک (SMS)</span>
                </button>
                <button
                  onClick={() => { setActiveSubTab('parspack_storage'); setShowForm(false); setShowAiSettings(false); setShowImporterDashboard(false); }}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-black transition-all flex items-center gap-1.5 cursor-pointer border ${
                    activeSubTab === 'parspack_storage'
                      ? "bg-cyan-600 text-white border-cyan-500 shadow-xs"
                      : "text-slate-600 bg-white border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <HardDrive size={12} />
                  <span>📦 باکت پارس‌پک (S3)</span>
                </button>
                <button
                  onClick={() => { setActiveSubTab('system'); setShowForm(false); setShowAiSettings(false); setShowImporterDashboard(false); }}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-black transition-all flex items-center gap-1.5 cursor-pointer border ${
                    activeSubTab === 'system' && !showAiSettings && !showImporterDashboard
                      ? "bg-purple-600 text-white border-purple-500 shadow-xs"
                      : "text-slate-600 bg-white border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <Server size={12} />
                  <span>⚙️ سایر تنظیمات و گیت‌هاب</span>
                </button>
                <button
                  onClick={() => { setShowImporterDashboard(true); setShowForm(false); setShowAiSettings(false); }}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                    showImporterDashboard
                      ? "bg-purple-600 text-white shadow-xs"
                      : "text-slate-600 hover:bg-slate-200/60"
                  }`}
                >
                  <RefreshCw size={12} />
                  <span>واردکننده هوشمند اکسل/CSV</span>
                </button>
                <button
                  onClick={() => { setShowAiSettings(true); setShowForm(false); setShowImporterDashboard(false); }}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                    showAiSettings
                      ? "bg-purple-600 text-white shadow-xs"
                      : "text-slate-600 hover:bg-slate-200/60"
                  }`}
                >
                  <Cpu size={12} />
                  <span>تنظیمات هوش مصنوعی</span>
                </button>
                <button
                  onClick={() => { setActiveSubTab('news'); setShowForm(false); setShowAiSettings(false); setShowImporterDashboard(false); }}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeSubTab === 'news'
                      ? "bg-purple-600 text-white shadow-xs"
                      : "text-slate-600 hover:bg-slate-200/60"
                  }`}
                >
                  <Newspaper size={12} />
                  <span>اخبار و وبلاگ سامانه</span>
                </button>
                <button
                  onClick={() => { setActiveSubTab('profile'); setShowForm(false); setShowAiSettings(false); setShowImporterDashboard(false); }}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeSubTab === 'profile'
                      ? "bg-purple-600 text-white shadow-xs"
                      : "text-slate-600 hover:bg-slate-200/60"
                  }`}
                >
                  <User size={12} />
                  <span>پروفایل و کلیدها</span>
                </button>
                <button
                  onClick={() => { setActiveSubTab('channel_posts'); setShowForm(false); setShowAiSettings(false); setShowImporterDashboard(false); }}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeSubTab === 'channel_posts'
                      ? "bg-purple-600 text-white shadow-xs"
                      : "text-slate-600 hover:bg-slate-200/60"
                  }`}
                >
                  <Megaphone size={12} />
                  <span>مدیریت کانال اطلاع‌رسانی</span>
                </button>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadSourceZip}
              className="px-3 py-1.5 rounded-xl text-[9px] font-black transition-all flex items-center gap-1.5 cursor-pointer bg-amber-400 text-slate-950 font-black shadow-xs hover:bg-amber-500 active:scale-95"
              title="دانلود مستقیم سورس کد کامل به صورت فایل فشرده زیپ"
            >
              <Download size={11} />
              <span>دانلود کامل سورس (.ZIP)</span>
            </button>
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[9px] font-black border border-emerald-150 shadow-xs">
              <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
              سورس: v4.1.0-Release
            </div>
          </div>
        </div>

      {/* AI config Form */}
      <AnimatePresence>
        {showAiSettings && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white text-white rounded-[2.5rem] border border-slate-800 p-6 sm:p-8 overflow-hidden shadow-material-xl"
          >
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-6">
              <Sparkles className="text-amber-500 animate-pulse" size={20} />
              <div>
                <h3 className="text-sm font-black text-slate-800">درگاه توزیع ابری هوش مصنوعی</h3>
                <p className="text-[10px] text-slate-500 font-bold">پیکربندی کلیدهای Google Gemini و یا GapGPT</p>
              </div>
            </div>

            <form onSubmit={handleAiConfigSubmit} className="space-y-6">
              {aiConfigMsg && (
                <div className="bg-amber-500/10 border border-amber-500/20 text-amber-600 p-3 rounded-xl text-xs font-bold text-center">
                  {aiConfigMsg}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-slate-500 block">سرویس‌دهنده هوشمند فعال:</label>
                  <select
                    value={aiProvider}
                    onChange={(e) => setAiProvider(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:border-amber-500 text-xs font-black text-slate-800 text-right outline-none transition-all"
                  >
                    <option value="gemini">Google Gemini Global</option>
                    <option value="gapgpt">GapGPT (درگاه محلی ایران)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-slate-500 block">کلید دسترسی امنیتی (API Key):</label>
                  <input
                    type="password"
                    placeholder="••••••••••••••••••••••••"
                    value={aiApiKey}
                    onChange={(e) => setAiApiKey(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:border-amber-500 text-xs font-mono text-left text-slate-800 outline-none transition-all"
                  />
                </div>

                {aiProvider === 'gapgpt' && (
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black text-slate-500 block">آدرس API Endpoint:</label>
                    <input
                      type="text"
                      placeholder="https://api.gapgpt.ir/v1"
                      value={aiEndpointUrl}
                      onChange={(e) => setAiEndpointUrl(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:border-amber-500 text-xs font-mono text-left text-slate-800 outline-none transition-all"
                    />
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleTestAiConnection}
                  disabled={aiLoading}
                  className="px-5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-black text-xs rounded-xl flex items-center gap-2 cursor-pointer transition-all"
                >
                  <Wand2 size={14} className="text-indigo-600" />
                  <span>تست زنده درگاه GapGPT / هوش مصنوعی</span>
                </button>
                <button
                  type="submit"
                  disabled={aiLoading}
                  className="px-6 py-2 bg-amber-600 hover:bg-amber-700 text-white font-black text-xs rounded-xl flex items-center gap-2 cursor-pointer transition-all shadow-md"
                >
                  {aiLoading && <RefreshCw className="animate-spin" size={12} />}
                  بروزرسانی درگاه هوش مصنوعی
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- EXECUTIVE DASHBOARD ENGINE FOR ALL THREE ROLES --- */}
      {activeSubTab === 'dashboard' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-500">
          
          {/* 📢 هدر اختصاصی عرضه بار فروشنده (ثبت فروش فوری نقدی) */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-6 sm:p-8 rounded-[2.5rem] text-white flex flex-col md:flex-row md:items-center md:justify-between gap-6 relative overflow-hidden border border-slate-800 shadow-xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-2xl" />
            
            <div className="space-y-2 relative z-10 text-right">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-full text-[10px] font-black">ابزار معاملاتی پنل فروشگاه</span>
                <h2 className="text-lg font-black text-white">عرضه بار نقدی و فروش فوری زیر قیمت صنف</h2>
              </div>
              <p className="text-slate-300 text-xs font-semibold max-w-xl leading-relaxed">
                با درج سریع کالای خود در تالار بیلبورد کف بازار دست‌اول، امکان معرفی محصول به بنکداران کل کشور و معامله امن به واسطه صندوق امانی پلتفرم را فراهم نمایید.
              </p>
            </div>
            
            <div className="relative z-10 shrink-0">
              <AddAdButton variant="inline" className="px-8 py-4 text-sm font-black shadow-lg shadow-amber-500/20" />
            </div>
          </div>

          {/* STATS BENTO GRID - ANIMATED */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, staggerChildren: 0.1 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 sm:gap-6"
          >
            {/* 1. Real-time Visitors (SIMULATED/SESSION) */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white border border-slate-100 p-5 rounded-[2.5rem] shadow-sm hover:shadow-md transition-all group overflow-hidden relative"
            >
              <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-red-500/5 rounded-full group-hover:scale-150 transition-transform duration-700" />
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-red-50 text-red-600 rounded-2xl group-hover:rotate-6 transition-transform">
                    <Activity size={20} />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    <span className="text-[10px] font-black text-red-600 uppercase tracking-tighter">زنده</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider">بازدیدکنندگان آنلاین</p>
                  <h3 className="text-xl font-black text-slate-800 tracking-tight">
                    {toPersianNum(liveVisitors)} <span className="text-[10px] text-slate-400 font-bold mr-1">نفر در لحظه</span>
                  </h3>
                </div>
              </div>
            </motion.div>

            {/* 2. Registered Users (Total) */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white border border-slate-100 p-5 rounded-[2.5rem] shadow-sm hover:shadow-md transition-all group overflow-hidden relative"
            >
              <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-indigo-500/5 rounded-full group-hover:scale-150 transition-transform duration-700" />
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl group-hover:rotate-6 transition-transform">
                    <UserPlus size={20} />
                  </div>
                  <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">کل کاربران</span>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider">کاربران پلتفرم</p>
                  <h3 className="text-xl font-black text-slate-800 tracking-tight">
                    {(() => {
                      const localUsersStr = localStorage.getItem("dastavval_local_users");
                      if (allUsers.length > 0) {
                        return toPersianNum(allUsers.length);
                      }
                      if (localUsersStr) {
                        try {
                          const parsed = JSON.parse(localUsersStr);
                          const seenIds = new Set();
                          const uniqueCount = Object.values(parsed).filter((u: any) => {
                            if (u && u.id && !seenIds.has(u.id)) {
                              seenIds.add(u.id);
                              return true;
                            }
                            return false;
                          }).length;
                          return toPersianNum(uniqueCount || Object.keys(parsed).length);
                        } catch (e) {
                          return toPersianNum(0);
                        }
                      }
                      return toPersianNum(0);
                    })()} <span className="text-[10px] text-slate-400 font-bold mr-1">عضو رسمی</span>
                  </h3>
                </div>
              </div>
            </motion.div>

            {/* 3. Inventory Value */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white border border-slate-100 p-5 rounded-[2.5rem] shadow-sm hover:shadow-md transition-all group overflow-hidden relative"
            >
              <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-emerald-500/5 rounded-full group-hover:scale-150 transition-transform duration-700" />
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:rotate-6 transition-transform">
                    <DollarSign size={20} />
                  </div>
                  <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">بروز</span>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider">ارزش کل کاتالوگ</p>
                  <h3 className="text-xl font-black text-slate-800 tracking-tight">
                    {toPersianNum(products.reduce((acc, p) => acc + (p.bulk_price || p.price || 0) * (p.stock_quantity_cartons || 10) * (p.carton_pack_count || 12), 0).toLocaleString())} 
                    <span className="text-[10px] text-slate-400 font-bold mr-1">ت</span>
                  </h3>
                </div>
              </div>
            </motion.div>

            {/* 4. Total Orders */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white border border-slate-100 p-5 rounded-[2.5rem] shadow-sm hover:shadow-md transition-all group overflow-hidden relative"
            >
              <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-blue-500/5 rounded-full group-hover:scale-150 transition-transform duration-700" />
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl group-hover:rotate-6 transition-transform">
                    <ShoppingCart size={20} />
                  </div>
                  <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">{toPersianNum(orders.length)} ثبت شده</span>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider">سفارشات عمده</p>
                  <h3 className="text-xl font-black text-slate-800 tracking-tight">
                    {toPersianNum(orders.length)} <span className="text-[10px] text-slate-400 font-bold mr-1">تراکنش نهایی</span>
                  </h3>
                </div>
              </div>
            </motion.div>

            {/* 5. Business Partners */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white border border-slate-100 p-5 rounded-[2.5rem] shadow-sm hover:shadow-md transition-all group overflow-hidden relative"
            >
              <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-amber-500/5 rounded-full group-hover:scale-150 transition-transform duration-700" />
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl group-hover:rotate-6 transition-transform">
                    <Building2 size={20} />
                  </div>
                  <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full">{toPersianNum(crmCustomers.filter(c => c.status === 'active').length)} فعال</span>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider">بنکداران و نمایندگی</p>
                  <h3 className="text-xl font-black text-slate-800 tracking-tight">
                    {toPersianNum(crmCustomers.length)} <span className="text-[10px] text-slate-400 font-bold mr-1">واحد تجاری</span>
                  </h3>
                </div>
              </div>
            </motion.div>

            {/* 6. Active Ads / Billboard */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-white border border-slate-100 p-5 rounded-[2.5rem] shadow-sm hover:shadow-md transition-all group overflow-hidden relative"
            >
              <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-purple-500/5 rounded-full group-hover:scale-150 transition-transform duration-700" />
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl group-hover:rotate-6 transition-transform">
                    <Megaphone size={20} />
                  </div>
                  <span className="text-[10px] font-black text-purple-600 bg-purple-50 px-2.5 py-1 rounded-full">در حال اکران</span>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider">بیلبورد کف بازار</p>
                  <h3 className="text-xl font-black text-slate-800 tracking-tight">
                    {toPersianNum(sponsoredAds.filter(a => a.status === 'approved').length)} <span className="text-[10px] text-slate-400 font-bold mr-1">آگهی فروش فوری</span>
                  </h3>
                </div>
              </div>
            </motion.div>          </motion.div>

          {/* ⚡ میز کار ویژه اقدامات و هماهنگی‌های مدیریت دست‌اول ⚡ */}
          <div className="bg-slate-50/70 border border-slate-100 p-6 sm:p-8 rounded-[2.5rem] space-y-6 my-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1 text-right">
                <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full uppercase tracking-wider">اقدامات مدیریتی دست‌اول</span>
                <h2 className="text-base font-black text-slate-800">میز کار هماهنگی، اصالت فاکتورها و تایید هویت</h2>
              </div>
              <p className="text-[10px] text-slate-400 font-bold max-w-xs text-right leading-relaxed">
                این بخش به صورت زنده ثبت‌نام‌های جدید و تنظیمات قانونی فاکتور رسمی را پایش می‌کند.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* بخش اول: تایید هویت نمایندگان جدید */}
              <div className="bg-white border border-slate-100 p-5 rounded-[2rem] shadow-xs flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                      <Users size={18} />
                    </div>
                    <h3 className="text-xs font-black text-slate-800">📋 ثبت‌نام‌های معلق عاملیت و نمایندگی</h3>
                  </div>
                  
                  {(() => {
                    const pendingReps = representativesList.filter(r => r.isApproved === false || r.status === 'pending');
                    if (pendingReps.length > 0) {
                      return (
                        <div className="space-y-2 text-right">
                          <p className="text-[10px] text-slate-500 font-medium">
                            تعداد <span className="font-bold text-indigo-600">{toPersianNum(pendingReps.length)} نماینده جدید</span> ثبت‌نام کرده و منتظر تایید است:
                          </p>
                          <div className="max-h-32 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                            {pendingReps.map((rep, idx) => (
                              <div key={rep.id || idx} className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between gap-2">
                                <div className="text-right">
                                  <p className="text-[10px] font-black text-slate-800">{rep.name || "نماینده ناشناس"}</p>
                                  <p className="text-[9px] text-slate-400 font-bold">{toPersianNum(rep.phone || "")} | {rep.city || "ثبت نشده"}</p>
                                </div>
                                <button 
                                  onClick={async () => {
                                    try {
                                      await handleUpdateRepStatus(rep.id, true);
                                      setSuccessMsg(`نمایندگی ${rep.name} با موفقیت تایید و فعال گردید.`);
                                      setTimeout(() => setSuccessMsg(null), 3000);
                                    } catch (err) {
                                      console.error(err);
                                    }
                                  }}
                                  className="px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-[9px] font-black rounded-md transition-colors whitespace-nowrap"
                                >
                                  تایید سریع
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    }
                    return (
                      <p className="text-[10px] text-slate-400 font-bold py-4 text-center leading-relaxed">
                        ✅ تمامی درخواست‌های عاملیت و نمایندگی بررسی شده و نماینده معلقی وجود ندارد.
                      </p>
                    );
                  })()}
                </div>
                
                <button 
                  onClick={() => { setActiveSubTab('representatives'); setIsSidebarOpen(false); }}
                  className="mt-4 w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-100 text-[10px] font-black rounded-xl transition-colors flex items-center justify-center gap-1"
                >
                  <span>مدیریت و مشاهده کل نمایندگان پلتفرم</span>
                  <ArrowLeft size={10} />
                </button>
              </div>

              {/* بخش دوم: تنظیم مهر و امضای رسمی فاکتورها */}
              <div className="bg-white border border-slate-100 p-5 rounded-[2rem] shadow-xs flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
                      <Award size={18} />
                    </div>
                    <h3 className="text-xs font-black text-slate-800">✍️ ثبت مهر و امضای رسمی مدیریت</h3>
                  </div>
                  
                  <p className="text-[10px] text-slate-500 leading-relaxed font-semibold text-right">
                    فاکتورهای صادر شده در حال حاضر از مهر و امضای فرضی دیجیتال سامانه استفاده می‌کنند.
                  </p>
                  
                  <p className="text-[9px] text-slate-400 leading-relaxed text-right">
                    جهت رسمی و معتبرسازی پیش‌فاکتورهای بنکداری، لطفا تصویر مهر یا امضای خطی مدیریت را از بخش تنظیمات ترسیم یا بارگذاری کنید تا جایگزین پیش‌فرض شود.
                  </p>
                </div>
                
                <button 
                  onClick={() => { setActiveSubTab('invoice'); setIsSidebarOpen(false); }}
                  className="mt-4 w-full py-2 bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-black rounded-xl transition-colors flex items-center justify-center gap-1 shadow-xs"
                >
                  <span>✍️ ثبت و طراحی مهر و امضای اختصاصی مدیر</span>
                  <ArrowLeft size={10} />
                </button>
              </div>

              {/* بخش سوم: اقدامات اضطراری و پاکسازی داده‌ها */}
              <div className="bg-white border border-slate-100 p-5 rounded-[2rem] shadow-xs flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl">
                      <Trash2 size={18} />
                    </div>
                    <h3 className="text-xs font-black text-slate-800">🧹 پاک‌سازی سفارشات فرضی و سمپل</h3>
                  </div>
                  
                  <p className="text-[10px] text-slate-500 leading-relaxed font-semibold text-right">
                    برای جلوگیری از تداخل فاکتورهای آزمایشی با سفارشات واقعی، پلتفرم امکان پاک‌سازی امن را فراهم آورده است.
                  </p>
                  
                  <p className="text-[9px] text-slate-400 leading-relaxed text-right">
                    سفارشات تست، تیکت‌های پشتیبانی آزمایشی و تراکنش‌های تستی را به طور کامل پاک کنید تا سیستم صرفاً داده‌های واقعی فروشگاه را پردازش کند.
                  </p>
                </div>
                
                <button 
                  onClick={handlePurgeMockData}
                  className="mt-4 w-full py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100 text-[10px] font-black rounded-xl transition-colors flex items-center justify-center gap-1"
                >
                  <span>🧹 پاک‌سازی کلیه سفارشات و داده‌های آزمایشی</span>
                </button>
              </div>
            </div>
          </div>

          {/* REAL-TIME PRIORITIZED PENDING APPROVALS QUEUE */}
          <AdminPendingApprovals
            orders={orders}
            onEditOrder={handleStartEditOrder}
            safeBuyRequests={safeBuyRequests}
            sponsoredAds={sponsoredAds}
            products={products}
            onUpdateProductStatus={async (id, isApproved, reason) => {
              await onUpdateProduct(id, {
                approvalStatus: isApproved ? 'approved' : 'rejected',
                isApproved: isApproved,
                rejectionReason: reason
              });
            }}
            rawMaterialAds={rawMaterialAds}
            equipmentAds={equipmentAds}
            serviceAds={serviceAds}
            barterDeals={barterDeals}
            representativesList={representativesList}
            onUpdateRepStatus={handleUpdateRepStatus}
            suppliersList={suppliersList}
            onUpdateSupplierStatus={handleUpdateSupplierStatus}
            callbackRequests={callbackRequests}
            supportTickets={supportTickets}
            onUpdateOrderStatus={handleUpdateOrderStatus}
            onUpdateSafeBuyStatus={handleUpdateSafeBuyStatus}
            onUpdateAdStatus={handleUpdateAdStatus}
            onEditAd={handleEditAdFromApprovals}
            onUpdateBarterStatus={handleUpdateBarterStatus}
            onUpdateCallback={handleUpdateCallback}
            onUpdateTicketStatus={handleUpdateTicketStatus}
            onNavigateTab={(tab) => {
              setActiveSubTab(tab as any);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />

          {/* GitHub & Cache Status Widget Banner */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border border-slate-200 p-8 rounded-[2.5rem] shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <Network size={160} className="text-slate-900" />
              </div>
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-4">
                    <div className="p-4 bg-indigo-50 text-indigo-600 rounded-[1.5rem]">
                      <Github size={32} />
                    </div>
                    <div>
                      <h4 className="text-lg font-black text-slate-900">وضعیت زیرساخت ابری و همگام‌سازی</h4>
                      <p className="text-[10px] text-slate-500 font-bold">مانیتورینگ زنده ارتباط با گیت‌هاب و دیتابیس محلی</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`text-[10px] font-black px-3 py-1 rounded-full flex items-center gap-2 ${cacheStatus.isHealthy ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-rose-50 text-rose-600 border border-rose-200'}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${cacheStatus.isHealthy ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                      IndexedDB Health: {cacheStatus.isHealthy ? 'Operational' : 'Critical'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-8 pt-8 border-t border-slate-100">
                  <div className="space-y-2">
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">آخرین سینک گیت‌هاب</p>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-50 rounded-xl text-slate-500">
                        <Clock size={16} />
                      </div>
                      <span className="text-sm font-black text-slate-700">
                        {b2bConfig.lastGithubUpdate ? new Date(b2bConfig.lastGithubUpdate).toLocaleTimeString('fa-IR') : 'ثبت نشده'}
                        <span className="text-[10px] text-slate-400 font-bold mr-2">
                          ({b2bConfig.lastGithubUpdate ? new Date(b2bConfig.lastGithubUpdate).toLocaleDateString('fa-IR') : '-'})
                        </span>
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">موجودی کش محصولات</p>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-50 rounded-xl text-slate-500">
                        <Layers size={16} />
                      </div>
                      <span className="text-sm font-black text-slate-700">
                        {toPersianNum(cacheStatus.itemCount)} <span className="text-[10px] text-slate-400 font-bold">آیتم فعال در IDB</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex gap-3">
                  <button 
                    onClick={() => window.dispatchEvent(new CustomEvent("change-admin-tab", { detail: { tab: 'system' } }))}
                    className="flex-1 py-3 bg-slate-50 hover:bg-slate-100 text-slate-600 text-[11px] font-black rounded-2xl transition-all border border-slate-200 flex items-center justify-center gap-2"
                  >
                    <Settings size={14} />
                    تنظیمات پیشرفته زیرساخت
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-20 transform translate-x-4 -translate-y-4">
                <Zap size={180} className="text-white" />
              </div>
              <div className="relative z-10 h-full flex flex-col justify-between">
                <div>
                  <h4 className="text-xl font-black text-white mb-2">میانبر بروزرسانی سریع</h4>
                  <p className="text-xs text-indigo-100 font-bold leading-relaxed opacity-80">
                    با یک کلیک تمام کدهای سامانه را با آخرین تغییرات مخزن مرکزی همگام‌سازی کنید.
                  </p>
                </div>
                <button 
                  onClick={() => window.dispatchEvent(new CustomEvent("change-admin-tab", { detail: { tab: 'system' } }))}
                  className="mt-8 py-4 bg-white text-indigo-600 font-black text-sm rounded-2xl shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                >
                  <RefreshCw size={18} />
                  همگام‌سازی لحظه‌ای با گیت‌هاب
                </button>
              </div>
            </div>
          </div>

          {/* DYNAMIC HIGH-FIDELITY RECHARTS VISUALIZATIONS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* CHART 1 */}
            <div className="bg-white border border-slate-100 p-6 sm:p-8 rounded-[2.5rem] shadow-xl space-y-6">
              <div className="flex justify-between items-center border-b border-slate-50 pb-4">
                <div className="space-y-1">
                  <h4 className="text-sm font-black text-slate-800">
                    {panelRole === 'sellers' && "روند مبادلات تجاری و حجم فروش کاتالوگ"}
                    {panelRole === 'suppliers' && "تحلیل راندمان کارخانه و توزیع هفتگی"}
                    {panelRole === 'customers' && "نمودار خط اعتباری و گردش مالی کیف‌پول"}
                  </h4>
                  <p className="text-[10px] text-slate-400 font-bold">تحلیل آماری شبیه‌سازی شده بر بستر شبکه استعلام عمده</p>
                </div>
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <Activity size={16} />
                </div>
              </div>
              
              <div className="h-[250px] w-full" dir="ltr">
                {panelRole === 'sellers' && (() => {
                  const chartData = [
                    { name: "فروردین", sales: 0, profit: 0 },
                    { name: "اردیبهشت", sales: 0, profit: 0 },
                    { name: "خرداد", sales: 0, profit: 0 },
                    { name: "تیر", sales: 0, profit: 0 },
                    { name: "مرداد", sales: 0, profit: 0 },
                    { name: "شهریور", sales: 0, profit: 0 },
                  ];
                  
                  if (orders.length > 0) {
                    const totalSales = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
                    const totalProfit = Math.round(totalSales * 0.12);
                    chartData[5].sales = totalSales;
                    chartData[5].profit = totalProfit;
                    chartData[4].sales = Math.round(totalSales * 0.6);
                    chartData[4].profit = Math.round(totalProfit * 0.6);
                    chartData[3].sales = Math.round(totalSales * 0.3);
                    chartData[3].profit = Math.round(totalProfit * 0.3);
                  }
                  
                  return (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                        <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                        <Tooltip formatter={(value: any) => toPersianNum((value ?? 0).toLocaleString()) + " تومان"} />
                        <Legend verticalAlign="top" height={36} iconType="circle" />
                        <Area type="monotone" name="ارزش معاملات (تومان)" dataKey="sales" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorSales)" />
                        <Area type="monotone" name="سود تجمعی" dataKey="profit" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorProfit)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  );
                })()}

                {panelRole === 'suppliers' && (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[
                      { name: "شنبه", capacity: 85, output: 80 },
                      { name: "یکشنبه", capacity: 90, output: 88 },
                      { name: "دوشنبه", capacity: 95, output: 92 },
                      { name: "سه‌شنبه", capacity: 95, output: 94 },
                      { name: "چهارشنبه", capacity: 80, output: 78 },
                      { name: "پنجشنبه", capacity: 60, output: 55 },
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                      <Tooltip />
                      <Legend verticalAlign="top" height={36} />
                      <Bar name="ظرفیت اسمی کارخانه (٪)" dataKey="capacity" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      <Bar name="تولید خروجی فعال" dataKey="output" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}

                {panelRole === 'customers' && (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={[
                      { name: "تراکنش ۱", wallet: 10000000, credit: 150000000 },
                      { name: "تراکنش ۲", wallet: 18000000, credit: 200000000 },
                      { name: "تراکنش ۳", wallet: 12000000, credit: 180000000 },
                      { name: "تراکنش ۴", wallet: 25000000, credit: 220000000 },
                      { name: "تراکنش ۵", wallet: 34500000, credit: 250000000 },
                    ]}>
                      <defs>
                        <linearGradient id="colorCredit" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} />
                      <YAxis stroke="#94a3b8" fontSize={10} />
                      <Tooltip />
                      <Legend verticalAlign="top" height={36} />
                      <Area type="monotone" name="مانده اعتبار ضمانت عمده (ریال)" dataKey="credit" stroke="#4f46e5" fillOpacity={1} fill="url(#colorCredit)" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* CHART 2 */}
            <div className="bg-white border border-slate-100 p-6 sm:p-8 rounded-[2.5rem] shadow-xl space-y-6">
              <div className="flex justify-between items-center border-b border-slate-50 pb-4">
                <div className="space-y-1">
                  <h4 className="text-sm font-black text-slate-800">
                    {panelRole === 'sellers' && "سهم دسته‌بندی‌های کاتالوگ در انبار"}
                    {panelRole === 'suppliers' && "سرعت پردازش کارخانه تا خروج بار لجستیک"}
                    {panelRole === 'customers' && "فراوانی کاتالوگ خریدهای عمده ثبت شده شما"}
                  </h4>
                  <p className="text-[10px] text-slate-400 font-bold">نمودار ساختاری توزیع تنوع لجستیکی</p>
                </div>
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                  <Layers2 size={16} />
                </div>
              </div>
              
              <div className="h-[250px] w-full" dir="ltr">
                {panelRole === 'sellers' && (() => {
                  const categoryCounts = products.reduce((acc: Record<string, number>, p) => {
                    const cat = p.category || "سایر";
                    acc[cat] = (acc[cat] || 0) + 1;
                    return acc;
                  }, {});
                  
                  const barData = Object.entries(categoryCounts).map(([name, count]) => ({
                    name,
                    count
                  }));

                  const finalData = barData.length > 0 ? barData : [{ name: "بدون کالا", count: 0 }];

                  return (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={finalData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} tickLine={false} />
                        <YAxis stroke="#94a3b8" fontSize={10} />
                        <Tooltip formatter={(value: any) => toPersianNum(value ?? 0) + " کالا"} />
                        <Bar name="تعداد اقلام ثبت شده" dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  );
                })()}

                {panelRole === 'suppliers' && (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={[
                      { week: "هفته ۱", speed: 4.2 },
                      { week: "هفته ۲", speed: 3.8 },
                      { week: "هفته ۳", speed: 3.1 },
                      { week: "هفته ۴", speed: 2.8 },
                      { week: "هفته ۵", speed: 2.4 },
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="week" stroke="#94a3b8" fontSize={10} />
                      <YAxis stroke="#94a3b8" fontSize={10} />
                      <Tooltip />
                      <Legend verticalAlign="top" height={36} />
                      <Line type="monotone" name="زمان پردازش (روز کاری)" dataKey="speed" stroke="#ec4899" strokeWidth={3} activeDot={{ r: 8 }} />
                    </LineChart>
                  </ResponsiveContainer>
                )}

                {panelRole === 'customers' && (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[
                      { name: "کارتن‌های خریداری شده", amount: 480 },
                      { name: "بسته‌بندی‌های تکی", amount: 11520 },
                      { name: "واحد کالا", amount: 620 },
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} />
                      <YAxis stroke="#94a3b8" fontSize={10} />
                      <Tooltip />
                      <Bar name="حجم آماری خریداری شده" dataKey="amount" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

          </div>

          {/* NEW SECTION: MONITORING INTERACTIVE CALLBACK REQUESTS & TICKETS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8" dir="rtl">
            
            {/* CALLBACK REQUESTS MONITOR */}
            <div className="bg-white border border-slate-100 p-6 sm:p-8 rounded-[2.5rem] shadow-xl space-y-6 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-slate-50 pb-4">
                  <div className="space-y-1">
                    <h4 className="text-sm font-black text-slate-800 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      درخواست‌های تماس فوری اخیر
                    </h4>
                    <p className="text-[10px] text-slate-400 font-bold">تماس‌های ثبت شده از بخش تماس فوری صفحه اصلی</p>
                  </div>
                  <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                    <Phone size={16} />
                  </div>
                </div>

                <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                  {callbackRequests.length === 0 ? (
                    <div className="text-center py-10 space-y-2">
                      <span className="text-3xl">☕</span>
                      <p className="text-xs text-slate-400 font-bold">هیچ درخواست تماسی ثبت نشده است.</p>
                    </div>
                  ) : (
                    callbackRequests.map((req, idx) => {
                      const isPending = req.status === 'pending';
                      const isCalled = req.status === 'called';
                      
                      return (
                        <div 
                          key={`admin-cb-req-${req.id || idx}-${idx}`} 
                          className={`p-4 rounded-2xl border transition-all ${
                            isPending 
                              ? "bg-amber-50/40 border-amber-200/50 shadow-sm shadow-amber-500/5" 
                              : isCalled 
                                ? "bg-emerald-50/20 border-emerald-100" 
                                : "bg-slate-50/50 border-slate-100 opacity-60"
                          }`}
                        >
                          <div className="flex justify-between items-start gap-2">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-black text-xs text-slate-800 select-all tracking-wider">
                                  {toPersianNum(req.phone)}
                                </span>
                                {isPending && (
                                  <span className="text-[9px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-md font-black">در انتظار تماس</span>
                                )}
                                {isCalled && (
                                  <span className="text-[9px] bg-emerald-100 text-emerald-850 px-1.5 py-0.5 rounded-md font-black">تماس گرفته شد</span>
                                )}
                                {req.status === 'archived' && (
                                  <span className="text-[9px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded-md font-black">بایگانی</span>
                                )}
                              </div>
                              <p className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                                <Building2 size={10} />
                                {req.factoryName || "مشاوره عمومی"}
                              </p>
                              <p className="text-[9px] text-slate-400 font-mono">
                                {toPersianNum(new Date(req.createdAt?.seconds ? req.createdAt.seconds * 1000 : req.createdAt || Date.now()).toLocaleDateString("fa-IR"))} - {toPersianNum(new Date(req.createdAt?.seconds ? req.createdAt.seconds * 1000 : req.createdAt || Date.now()).toLocaleTimeString("fa-IR", {hour: '2-digit', minute:'2-digit'}))}
                              </p>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              {isPending && (
                                <button
                                  onClick={() => handleUpdateCallback(req.id, 'called', req.notes)}
                                  title="علامت‌گذاری به عنوان تماس‌گرفته‌شد"
                                  className="w-7 h-7 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center justify-center cursor-pointer transition-colors"
                                >
                                  <Check size={14} />
                                </button>
                              )}
                              {req.status !== 'archived' && (
                                <button
                                  onClick={() => handleUpdateCallback(req.id, 'archived', req.notes)}
                                  title="بایگانی کردن درخواست"
                                  className="w-7 h-7 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg flex items-center justify-center cursor-pointer transition-colors"
                                >
                                  <ClipboardList size={14} />
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteCallback(req.id)}
                                title="حذف دائمی"
                                className="w-7 h-7 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg flex items-center justify-center cursor-pointer transition-colors"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>

                          <div className="mt-3 pt-2 border-t border-dashed border-slate-100 flex items-center gap-2">
                            <span className="text-[9px] text-slate-400 font-bold shrink-0">یادداشت مدیر:</span>
                            <input
                              type="text"
                              value={req.notes || ""}
                              placeholder="مثال: قیمت عمده مزمز رو خواستن..."
                              onChange={(e) => {
                                const val = e.target.value;
                                setCallbackRequests(prev => prev.map(item => item.id === req.id ? { ...item, notes: val } : item));
                              }}
                              onBlur={(e) => {
                                handleUpdateCallback(req.id, req.status, e.target.value);
                              }}
                              className="w-full bg-slate-50 border-none px-2 py-1 rounded text-[10px] font-bold text-slate-700 placeholder-slate-300 outline-none focus:bg-slate-100"
                            />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* SUPPORT TICKETS MONITOR */}
            <div className="bg-white border border-slate-100 p-6 sm:p-8 rounded-[2.5rem] shadow-xl space-y-6 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-slate-50 pb-4">
                  <div className="space-y-1">
                    <h4 className="text-sm font-black text-slate-800 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse"></span>
                      تیکت‌های پشتیبانی و استعلامات اخیر
                    </h4>
                    <p className="text-[10px] text-slate-400 font-bold">تیکت‌های ثبت شده از پرتال پشتیبانی خریداران</p>
                  </div>
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                    <MessageSquare size={16} />
                  </div>
                </div>

                <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                  {supportTickets.length === 0 ? (
                    <div className="text-center py-10 space-y-2">
                      <span className="text-3xl">📥</span>
                      <p className="text-xs text-slate-400 font-bold">تیکت یا استعلام فعالی وجود ندارد.</p>
                    </div>
                  ) : (
                    supportTickets.map((ticket, idx) => {
                      const isOpen = ticket.status === 'open' || !ticket.status;
                      const isProcessing = ticket.status === 'in_progress';
                      
                      return (
                        <div 
                          key={`admin-ticket-${ticket.id || idx}-${idx}`} 
                          className={`p-4 rounded-2xl border transition-all ${
                            isOpen 
                              ? "bg-indigo-50/20 border-indigo-100 shadow-sm" 
                              : isProcessing 
                                ? "bg-amber-50/20 border-amber-150" 
                                : "bg-slate-50/50 border-slate-100 opacity-60"
                          }`}
                        >
                          <div className="flex justify-between items-start gap-2">
                            <div className="space-y-1">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="font-black text-xs text-slate-800">
                                  {ticket.name}
                                </span>
                                <span className="text-[8px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-black">
                                  {ticket.category || "پشتیبانی"}
                                </span>
                                {isOpen && (
                                  <span className="text-[8px] bg-indigo-100 text-indigo-800 px-1 py-0.5 rounded font-black">جدید</span>
                                )}
                                {isProcessing && (
                                  <span className="text-[8px] bg-amber-100 text-amber-800 px-1 py-0.5 rounded font-black">در حال بررسی</span>
                                )}
                                {ticket.status === 'resolved' && (
                                  <span className="text-[8px] bg-emerald-100 text-emerald-800 px-1 py-0.5 rounded font-black">پاسخ داده شده</span>
                                )}
                              </div>
                              <p className="text-[10px] text-slate-400 font-mono tracking-wider">
                                تلفن: {toPersianNum(ticket.phone)}
                              </p>
                              <p className="text-[10px] bg-white border border-slate-100 p-2 rounded-xl text-slate-600 leading-relaxed font-bold select-all mt-1.5">
                                {ticket.message}
                              </p>
                            </div>

                            <div className="flex flex-col gap-1 items-end shrink-0">
                              <select
                                value={ticket.status || "open"}
                                onChange={(e) => handleUpdateTicketStatus(ticket.id, e.target.value)}
                                className="text-[9px] font-black bg-slate-100 border-none p-1 rounded-md cursor-pointer outline-none"
                              >
                                <option value="open">جدید</option>
                                <option value="in_progress">بررسی</option>
                                <option value="resolved">حل شده</option>
                                <option value="closed">بسته</option>
                              </select>
                              <span className="text-[8px] text-slate-400 font-mono mt-2">
                                {toPersianNum(new Date(ticket.createdAt || Date.now()).toLocaleDateString("fa-IR"))}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

          </div>

          {/* DYNAMIC CONSOLES ACCORDING TO ROLES */}
          <div className="grid grid-cols-1 gap-8">
            
            {/* SELLERS CONSOLE: WOOCOMMERCE & WP LIVE SYNC ENGINE */}
            {panelRole === 'sellers' && (
              <div className="bg-white border border-slate-100 p-6 sm:p-8 rounded-[2.5rem] shadow-xl space-y-8">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                      <FileSpreadsheet size={24} />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-slate-800">درون‌ریز و یکپارچه‌ساز ووکامرس (WooCommerce Native Product Importer)</h3>
                      <p className="text-xs text-slate-400 font-bold">ورود اطلاعات خروجی برنامه‌های انبارداری یا ووکامرس با فرمت CSV و همگام‌سازی زنده API</p>
                    </div>
                  </div>
                  <span className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-black px-4 py-2 rounded-xl flex items-center gap-1.5">
                    <CheckCircle size={14} />
                    ماژول درون‌ریزی بدون نیاز به افزونه
                  </span>
                </div>

                {/* MODE SELECTOR TABS */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 bg-slate-100 p-2 rounded-2xl border border-slate-200/80">
                  <button
                    type="button"
                    onClick={() => setImporterSourceMode('csv')}
                    className={`py-3.5 px-4 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-2 ${
                      importerSourceMode === 'csv'
                        ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20"
                        : "text-slate-500 hover"
                    }`}
                  >
                    <FileSpreadsheet size={16} />
                    درون‌ریزی فایل CSV
                  </button>
                  <button
                    type="button"
                    onClick={() => setImporterSourceMode('api')}
                    className={`py-3.5 px-4 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-2 ${
                      importerSourceMode === 'api'
                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                        : "text-slate-500 hover"
                    }`}
                  >
                    <RefreshCw size={16} />
                    اتصال زنده API
                  </button>
                </div>

                {/* MODE 1: NATIVE CSV IMPORTER */}
                {importerSourceMode === 'csv' && (
                  <div className="space-y-8 animate-in fade-in duration-300">
                    {/* BANNER & GUIDES */}
                    <div className="bg-gradient-to-r from-emerald-900/10 via-teal-900/10 to-slate-900/10 border border-emerald-500/20 p-6 rounded-3xl space-y-4">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-emerald-600">
                            <FileSpreadsheet size={20} />
                            <h4 className="text-base font-black">ماژول درون‌ریزی مستقیم محصولات (WooCommerce Native Product Importer)</h4>
                          </div>
                          <p className="text-xs text-slate-500 font-bold leading-relaxed">
                            کاملاً منطبق بر ماژول استاندارد درون‌ریزی محصولات ووکامرس (WooCommerce Native Product Importer) بدون نیاز به هیچ افزونه جانبی.
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setShowWarehouseGuideModal(!showWarehouseGuideModal)}
                            className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer shadow-md ${showWarehouseGuideModal ? 'bg-indigo-600 text-white shadow-indigo-600/20' : 'bg-white text-slate-600 border border-slate-100'}`}
                          >
                            <FileText size={15} />
                            راهنمای دیتای انبار (JSON)
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => setShowWooGuideModal(!showWooGuideModal)}
                            className="px-4 py-2.5 bg-white hover text-white rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer shadow-sm"
                          >
                            <HelpCircle size={15} />
                            {showWooGuideModal ? "بستن راهنمای فنی" : "📋 راهنمای فنی و نگاشت ستون‌ها"}
                          </button>
                          
                          <button
                            type="button"
                            onClick={handleDownloadWooCsvSample}
                            className="px-4 py-2.5 bg-emerald-600 hover text-white rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer shadow-md shadow-emerald-600/10"
                          >
                            <Download size={15} />
                            دانلود نمونه فایل CSV ووکامرس (.csv)
                          </button>

                          <button
                            type="button"
                            onClick={handleExportInventoryToWooCsv}
                            className="px-4 py-2.5 bg-indigo-600 hover text-white rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer shadow-md shadow-indigo-600/10"
                          >
                            <FileSpreadsheet size={15} />
                            دانلود خروجی انبار با فرمت ووکامرس (.csv)
                          </button>

                          <button
                            type="button"
                            onClick={handleDeleteAllProducts}
                            className="px-4 py-2.5 bg-rose-600 hover text-white rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer shadow-md shadow-rose-600/10 ml-auto"
                          >
                            <Trash2 size={15} />
                            حذف تمام محصولات و پاکسازی دیتابیس
                          </button>
                        </div>
                      </div>

                      {/* WAREHOUSE JSON GUIDE PANEL */}
                      {showWarehouseGuideModal && (
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-6 text-xs text-slate-700 leading-relaxed shadow-inner">
                          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                            <h5 className="font-black text-sm text-indigo-600 flex items-center gap-2">
                              🏢 راهنمای ساختار دیتای انبار (Warehouse JSON Schema)
                            </h5>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(`سلام، من به عنوان توسعه‌دهنده انبار به یک خروجی JSON از لیست محصولات نیاز دارم.
ساختار داده‌ها باید شامل فیلدهای زیر برای هر محصول باشد (ارقام به ریال یا تومان ثابت باشد):
فیلدها:
- sku: کد منحصر به فرد کالا (بارکد یا شناسه سیستم انبار)
- name: نام کامل تجاری کالا
- purchase_price: قیمت خرید ما از تامین‌کننده/کارخانه
- price: قیمت رسمی یا کارخانه درج شده روی کالا
- bulk_price: قیمت فروش عمده ما به بنکدار (قیمت پایه سامانه)
- consumer_price: قیمت مصرف‌کننده (درج شده روی کالا)
- carton_pack_count: تعداد واحد کالا در هر کارتن (مثلاً ۲۴)
- stock_quantity_cartons: موجودی فعلی انبار بر اساس تعداد کارتن
- unit: واحد سنجش (عدد، بسته، کیلوگرم)
- image_url: لینک مستقیم تصویر با کیفیت کالا
- badge: نشان اختصاصی (مثلاً "ویژه"، "جدید"، "تخفیف خورده")
- isFavorite: وضعیت علاقه‌مندی پیش‌فرض (true/false)

خروجی باید یک شیء JSON باشد که آرایه‌ای به نام "products" دارد.`);
                                setSuccessMsg("پرامپت تخصصی توسعه‌دهنده انبار کپی شد.");
                              }}
                              className="px-3 py-1.5 bg-indigo-50 hover text-indigo-700 rounded-lg text-[10px] font-black flex items-center gap-1.5 cursor-pointer border border-indigo-100"
                            >
                              <Cpu size={13} />
                              کپی پرامپت توسعه‌دهنده
                            </button>

                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(`{
  "products": [
    {
      "sku": "PRD-1001",
      "name": "نام کالا (مثلاً لواشک لوله‌ای ۱۰۰ گرمی)",
      "brand": "نام برند",
      "category": "دسته بندی",
      "purchase_price": 50000,
      "price": 60000,
      "bulk_price": 55000,
      "consumer_price": 75000,
      "carton_pack_count": 24,
      "stock_quantity_cartons": 10,
      "unit": "بسته",
      "image_url": "https://example.com/image.jpg",
      "badge": "ویژه",
      "isFavorite": false,
      "description": "توضیحات تکمیلی و مشخصات فنی کالا"
    }
  ]
}`);
                                setSuccessMsg("نمونه JSON تخصصی انبار کپی شد.");
                              }}
                              className="px-3 py-1.5 bg-slate-100 hover text-slate-700 rounded-lg text-[10px] font-black flex items-center gap-1.5 cursor-pointer"
                            >
                              <Copy size={13} />
                              کپی نمونه ساختار
                            </button>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-3">
                              <p className="font-black text-slate-800">توضیح فیلدهای اختصاصی:</p>
                              <ul className="space-y-2 pr-4 list-disc marker">
                                <li><code className="text-indigo-600 font-bold">purchase_price</code>: قیمت خرید شما از تامین‌کننده (ریال)</li>
                                <li><code className="text-indigo-600 font-bold">price</code>: قیمت رسمی یا پایه (ریال)</li>
                                <li><code className="text-indigo-600 font-bold">bulk_price</code>: قیمت فروش عمده شما به بنکدار (ریال)</li>
                                <li><code className="text-indigo-600 font-bold">consumer_price</code>: قیمت درج شده روی کالا برای مصرف‌کننده نهایی</li>
                                <li><code className="text-indigo-600 font-bold">carton_pack_count</code>: تعداد واحد کالا در هر کارتن</li>
                              </ul>
                            </div>
                            <div className="bg-white p-4 rounded-xl font-mono text-[10px] text-emerald-400 overflow-x-auto border border-slate-800">
                              <pre>{`{
  "products": [
    {
      "sku": "...",
      "name": "...",
      "purchase_price": 10000,
      "price": 12000,
      "bulk_price": 11000,
      "consumer_price": 15000,
      "carton_pack_count": 24,
      "stock_quantity_cartons": 50
    }
  ]
}`}</pre>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* TECHNICAL GUIDE PANEL */}
                      {showWooGuideModal && (
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-6 text-xs text-slate-700 leading-relaxed shadow-inner">
                          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                            <h5 className="font-black text-sm text-emerald-600 flex items-center gap-2">
                              📋 راهنمای فنی و ساختار خروجی محصولات برای توسعه‌دهنده وردپرس
                            </h5>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(`📋 راهنمای فنی و ساختار خروجی محصولات برای توسعه‌دهنده وردپرس
۱. مشخصات عمومی فایل خروجی:
فرمت فایل: CSV
کدگذاری کاراکترها (Encoding): UTF-8 with BOM
جداکننده (Delimiter): ویرگول انگلیسی ,

۲. ساختار ستون‌های فایل CSV و نگاشت (Mapping) در ووکامرس:
- SKU: شناسه محصول (SKU)
- Name: نام محصول (Product Name)
- Published: منتشر شده (1)
- Is featured?: ویژه؟ (0)
- Visibility in catalog: قابلیت دیدن در کاتالوگ (visible)
- Short description: توضیح کوتاه (شامل واحد کالا)
- Description: توضیحات کامل
- In stock?: موجود در انبار؟ (1)
- Stock: تعداد موجودی انبار
- Regular price: قیمت عادی به تومان
- Sale price: قیمت فروش فوق‌العاده
- Categories: دسته‌بندی‌ها
- Images: لینک تصاویر`);
                                setSuccessMsg("متن راهنمای فنی با موفقیت کپی شد.");
                              }}
                              className="px-3 py-1.5 bg-slate-100 hover text-slate-700 rounded-lg text-[10px] font-black flex items-center gap-1.5 cursor-pointer"
                            >
                              <Copy size={13} />
                              کپی متن راهنما
                            </button>
                          </div>

                          <div className="space-y-4">
                            <div>
                              <h6 className="font-black text-slate-900 mb-1">۱. مشخصات عمومی فایل خروجی</h6>
                              <ul className="list-disc list-inside text-slate-500 space-y-1 pr-2">
                                <li><strong className="text-slate-700">فرمت فایل:</strong> CSV</li>
                                <li><strong className="text-slate-700">کدگذاری کاراکترها (Encoding):</strong> UTF-8 with BOM (جهت پشتیبانی کامل از حروف فارسی و عدم به‌هم‌ریختگی)</li>
                                <li><strong className="text-slate-700">جداکننده (Delimiter):</strong> ویرگول انگلیسی <code className="bg-slate-100 px-1 py-0.5 rounded text-emerald-600">,</code></li>
                                <li><strong className="text-slate-700">قالب/سیستم سازگار:</strong> تمام قالب‌های وردپرس متصل به افزونه WooCommerce</li>
                              </ul>
                            </div>

                            <div>
                              <h6 className="font-black text-slate-900 mb-2">۲. ساختار ستون‌های فایل CSV و نگاشت (Mapping) در ووکامرس</h6>
                              <div className="overflow-x-auto">
                                <table className="w-full text-right border-collapse border border-slate-200 text-[11px]">
                                  <thead>
                                    <tr className="bg-slate-100 font-black text-slate-800">
                                      <th className="p-2.5 border border-slate-200">نام ستون در فایل CSV</th>
                                      <th className="p-2.5 border border-slate-200">عنوان معادل در ووکامرس</th>
                                      <th className="p-2.5 border border-slate-200">توضیحات دیتای ارسال‌شده</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100">
                                    <tr><td className="p-2 border font-mono font-bold text-emerald-600">SKU</td><td className="p-2 border font-bold">شناسه محصول (SKU)</td><td className="p-2 border text-slate-500">کد شناسه کالا / بارکد یا کد ساختاری نرم‌افزار (PRD-ID)</td></tr>
                                    <tr><td className="p-2 border font-mono font-bold text-emerald-600">Name</td><td className="p-2 border font-bold">نام محصول (Product Name)</td><td className="p-2 border text-slate-500">عنوان کامل کالا</td></tr>
                                    <tr><td className="p-2 border font-mono font-bold text-emerald-600">Published</td><td className="p-2 border font-bold">منتشر شده (Published)</td><td className="p-2 border text-slate-500">مقدار 1 (محصول مستقیماً روی سایت منتشر می‌شود)</td></tr>
                                    <tr><td className="p-2 border font-mono font-bold text-emerald-600">Is featured?</td><td className="p-2 border font-bold">ویژه؟ (Is Featured)</td><td className="p-2 border text-slate-500">مقدار 0</td></tr>
                                    <tr><td className="p-2 border font-mono font-bold text-emerald-600">Visibility in catalog</td><td className="p-2 border font-bold">قابلیت دیدن در کاتالوگ</td><td className="p-2 border text-slate-500">مقدار visible (قابل مشاهده در فروشگاه)</td></tr>
                                    <tr><td className="p-2 border font-mono font-bold text-emerald-600">Short description</td><td className="p-2 border font-bold">توضیح کوتاه (Short Description)</td><td className="p-2 border text-slate-500">شامل واحد کالا (مثلاً: واحد: عدد / کیلوگرم / بسته)</td></tr>
                                    <tr><td className="p-2 border font-mono font-bold text-emerald-600">Description</td><td className="p-2 border font-bold">توضیحات کامل (Description)</td><td className="p-2 border text-slate-500">شرح و توضیحات تکمیلی کالا</td></tr>
                                    <tr><td className="p-2 border font-mono font-bold text-emerald-600">In stock?</td><td className="p-2 border font-bold">موجود در انبار؟ (In Stock?)</td><td className="p-2 border text-slate-500">مقدار 1 برای کالاهای دارای موجودی، 0 برای ناموجود</td></tr>
                                    <tr><td className="p-2 border font-mono font-bold text-emerald-600">Stock</td><td className="p-2 border font-bold">تعداد موجودی انبار</td><td className="p-2 border text-slate-500">عدد دقیق موجودی فعلی در انبار نرم‌افزار</td></tr>
                                    <tr><td className="p-2 border font-mono font-bold text-emerald-600">Regular price</td><td className="p-2 border font-bold">قیمت عادی (Regular Price)</td><td className="p-2 border text-slate-500">قیمت فروش اصلی به تومان</td></tr>
                                    <tr><td className="p-2 border font-mono font-bold text-emerald-600">Sale price</td><td className="p-2 border font-bold">قیمت فروش فوق‌العاده (Sale Price)</td><td className="p-2 border text-slate-500">قیمت مصرف‌کننده / تخفیف‌خورده</td></tr>
                                    <tr><td className="p-2 border font-mono font-bold text-emerald-600">Categories</td><td className="p-2 border font-bold">دسته‌بندی‌ها (Categories)</td><td className="p-2 border text-slate-500">نام دسته‌بندی کالا در نرم‌افزار</td></tr>
                                    <tr><td className="p-2 border font-mono font-bold text-emerald-600">Images</td><td className="p-2 border font-bold">تصاویر (Images)</td><td className="p-2 border text-slate-500">آدرس لینک تصویر کالا</td></tr>
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* CONFIG OPTIONS & INPUT FORM */}
                    <div className="space-y-6">
                      {/* HIGH VISIBILITY ACTION BANNER WHEN CSV FILE IS PARSED */}
                      {csvParsedProducts.length > 0 && (
                        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 p-6 rounded-3xl text-white shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-300">
                          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-amber-300 animate-ping" />
                                <span className="bg-white/20 text-white font-black text-[10px] px-2.5 py-1 rounded-full uppercase tracking-wider">
                                  فایل بارگذاری شد
                                </span>
                                <h4 className="text-base font-black">
                                  {uploadedFileName || "فایل CSV ووکامرس"}
                                  {uploadedFileSize ? ` (${uploadedFileSize})` : ""}
                                </h4>
                              </div>
                              <p className="text-xs text-emerald-100 font-bold">
                                تعداد <span className="text-amber-300 font-black text-sm">{toPersianNum(csvParsedProducts.length)} کالا</span> با موفقیت خوانده و استخراج گردید. آمادۀ ادغام و ثبت در انبار دیتابیس!
                              </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-3">
                              <button
                                type="button"
                                onClick={() => {
                                  setCsvParsedProducts([]);
                                  setSelectedCsvIndices([]);
                                  setUploadedFileName('');
                                  setUploadedFileSize('');
                                  setSuccessMsg('فایل قبلی پاکسازی شد. می‌توانید فایل جدیدی بارگذاری کنید.');
                                }}
                                className="px-4 py-2.5 bg-white/10 hover text-white rounded-xl text-xs font-black transition-all cursor-pointer border border-white/20"
                              >
                                🔄 انتخاب فایل جدید
                              </button>

                              <button
                                type="button"
                                onClick={handleBatchSaveCsvProducts}
                                disabled={loading || selectedCsvIndices.length === 0}
                                className="px-6 py-3.5 bg-amber-400 hover text-slate-900 font-black text-xs rounded-2xl transition-all shadow-xl shadow-amber-400/20 flex items-center gap-2 cursor-pointer transform hover:scale-105 active:scale-95"
                              >
                                {loading ? <RefreshCw size={18} className="animate-spin" /> : <Upload size={18} />}
                                ⚡ ادغام و همگام‌سازی نهایی ({toPersianNum(selectedCsvIndices.length)} کالا)
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* INPUT CONTROLS */}
                        <div className="lg:col-span-1 space-y-6">
                          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/60 space-y-4">
                            <div className="flex p-1 bg-white rounded-xl border border-slate-100 mb-4">
                              <button 
                                onClick={() => setImportFormat('csv')}
                                className={`flex-1 py-2 text-[10px] font-black rounded-lg transition-all ${importFormat === 'csv' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' : 'text-slate-400'}`}
                              >
                                فایل CSV (ووکامرس)
                              </button>
                              <button 
                                onClick={() => setImportFormat('json')}
                                className={`flex-1 py-2 text-[10px] font-black rounded-lg transition-all ${importFormat === 'json' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-400'}`}
                              >
                                فایل JSON (انبار)
                              </button>
                            </div>

                            <label className="flex items-center gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={updateExistingBySku}
                                onChange={(e) => setUpdateExistingBySku(e.target.checked)}
                                className="w-4 h-4 rounded text-emerald-600 focus"
                              />
                              <span className="text-xs font-black text-slate-800">
                                محصولاتی که وجود دارند براساس SKU یا ID بروزرسانی شوند
                              </span>
                            </label>
                            <p className="text-[10px] text-slate-400 pr-7 font-bold">
                              در صورت فعال بودن، قیمت‌ها و موجودی کالاهایی که با بارکد یا شناسه مشابه قبلاً ثبت شده‌اند بروزرسانی می‌شوند.
                            </p>
                          </div>

                          {/* INPUT TABS */}
                          <div className="space-y-4">
                            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-black">
                              <button
                                type="button"
                                onClick={() => setCsvInputTab('upload')}
                                className={`flex-1 py-2 rounded-lg transition-all cursor-pointer ${
                                  csvInputTab === 'upload' ? (importFormat === 'csv' ? 'bg-emerald-600 text-white shadow' : 'bg-indigo-600 text-white shadow') : 'text-slate-500'
                                }`}
                              >
                                {importFormat === 'csv' ? 'آپلود فایل CSV (.csv)' : 'آپلود فایل JSON (.json)'}
                              </button>
                              <button
                                type="button"
                                onClick={() => setCsvInputTab('text')}
                                className={`flex-1 py-2 rounded-lg transition-all cursor-pointer ${
                                  csvInputTab === 'text' ? (importFormat === 'csv' ? 'bg-emerald-600 text-white shadow' : 'bg-indigo-600 text-white shadow') : 'text-slate-500'
                                }`}
                              >
                                {importFormat === 'csv' ? 'ورود متنی / نمونه CSV' : 'ورود متنی / دیتای JSON'}
                              </button>
                            </div>

                            {csvInputTab === 'upload' ? (
                              <div className="space-y-4">
                                {uploadedFileName && csvParsedProducts.length > 0 ? (
                                  <div className="border-2 border-emerald-500 bg-emerald-50/50 p-6 rounded-2xl text-center space-y-4 transition-all">
                                    <div className="w-12 h-12 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto shadow-md">
                                      <CheckCircle size={24} />
                                    </div>
                                    <div>
                                      <h5 className="text-xs font-black text-slate-900 flex items-center justify-center gap-1.5">
                                        <FileSpreadsheet size={16} className="text-emerald-600" />
                                        {uploadedFileName}
                                      </h5>
                                      <p className="text-[11px] text-emerald-700 font-bold mt-1">
                                        حجم: {uploadedFileSize} | تعداد: {toPersianNum(csvParsedProducts.length)} کالا استخراج گردید
                                      </p>
                                    </div>

                                    <div className="pt-2 flex flex-col gap-2">
                                      <button
                                        type="button"
                                        onClick={handleBatchSaveCsvProducts}
                                        disabled={loading || selectedCsvIndices.length === 0}
                                        className="w-full py-3 bg-emerald-600 hover text-white rounded-xl text-xs font-black cursor-pointer transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2"
                                      >
                                        <Upload size={16} />
                                        ادغام و بروزرسانی نهایی ({toPersianNum(selectedCsvIndices.length)} کالا)
                                      </button>
                                      <label
                                        htmlFor="woo-csv-file-input"
                                        className="w-full py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer transition-all hover flex items-center justify-center gap-1.5"
                                      >
                                        <RefreshCw size={14} />
                                        بارگذاری فایل جدید CSV
                                      </label>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="border-2 border-dashed border-slate-300 hover bg-slate-50 p-8 rounded-2xl text-center space-y-3 transition-all">
                                    <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                                      <Upload size={24} />
                                    </div>
                                    <div>
                                      <h5 className="text-xs font-black text-slate-800">
                                        {importFormat === 'csv' ? 'انتخاب فایل CSV خروجی ووکامرس' : 'انتخاب فایل JSON دیتای انبار'}
                                      </h5>
                                      <p className="text-[10px] text-slate-400 font-bold mt-1">
                                        {importFormat === 'csv' ? 'فایل .csv نرم‌افزار انبارداری یا ووکامرس را انتخاب کنید' : 'فایل .json شامل لیست محصولات انبار را انتخاب کنید'}
                                      </p>
                                    </div>
                                    <input
                                      type="file"
                                      accept={importFormat === 'csv' ? ".csv" : ".json"}
                                      id="woo-csv-file-input"
                                      className="hidden"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) handleParseCsvFile(file);
                                      }}
                                    />
                                    <label
                                      htmlFor="woo-csv-file-input"
                                      className={`inline-flex items-center gap-2 px-5 py-3 ${importFormat === 'csv' ? 'bg-emerald-600 hover' : 'bg-indigo-600 hover'} text-white rounded-xl text-xs font-black cursor-pointer transition-all shadow-md`}
                                    >
                                      {importFormat === 'csv' ? <FileSpreadsheet size={16} /> : <FileCode size={16} />}
                                      {importFormat === 'csv' ? 'انتخاب فایل CSV و شروع درون‌ریزی' : 'انتخاب فایل JSON و شروع درون‌ریزی'}
                                    </label>
                                  </div>
                                )}

                                <button
                                  type="button"
                                  onClick={() => handleParseCsvText()}
                                  className={`w-full py-3 ${importFormat === 'csv' ? 'bg-slate-100' : 'bg-indigo-50'} text-slate-700 font-black text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer`}
                                >
                                  {importFormat === 'csv' ? <FileText size={14} /> : <FileCode size={14} />}
                                  {importFormat === 'csv' ? 'درون‌ریزی مستقیم از کد/متن نمونه CSV' : 'درون‌ریزی مستقیم از کد JSON انبار'}
                                </button>
                              </div>
                            ) : (
                              <div className="space-y-3">
                                <label className="block text-xs font-bold text-slate-400">
                                  {importFormat === 'csv' ? 'متن نمونه فایل CSV ووکامرس:' : 'محتوای فایل JSON انبار:'}
                                </label>
                                <textarea
                                  rows={8}
                                  dir="ltr"
                                  value={csvTextData}
                                  onChange={(e) => setCsvTextData(e.target.value)}
                                  className={`w-full p-3 font-mono text-[11px] bg-slate-50 ${importFormat === 'csv' ? 'text-emerald-400 focus' : 'text-indigo-400 focus'} rounded-xl border border-slate-800 focus:outline-none focus`}
                                  placeholder={importFormat === 'csv' ? "SKU,Name,..." : '{ "products": [...] }'}
                                />
                                <button
                                  type="button"
                                  onClick={() => handleParseCsvText(csvTextData)}
                                  className={`w-full py-3.5 ${importFormat === 'csv' ? 'bg-emerald-600 hover shadow-emerald-600/10' : 'bg-indigo-600 hover shadow-indigo-600/10'} text-white font-black text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer`}
                                >
                                  <CheckCircle size={15} />
                                  {importFormat === 'csv' ? 'شروع آپلود و درون‌ریزی از کد CSV' : 'شروع آپلود و درون‌ریزی از کد JSON'}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* MONITORING LOGS TERMINAL & STATUS */}
                        <div className="lg:col-span-2 flex flex-col space-y-4">
                          <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                            <div className="flex items-center gap-2">
                              <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest">ترمینال خطایابی و لاگ مانیتورینگ زنده</h4>
                              {importLogs.length > 0 && (
                                <button
                                  type="button"
                                  onClick={() => setImportLogs([])}
                                  className="text-[10px] text-slate-400 hover font-bold px-2 py-0.5 rounded bg-slate-100 transition-all cursor-pointer"
                                >
                                  پاکسازی لاگ‌ها
                                </button>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 text-[9px] text-slate-400 font-mono">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                              WOOCOMMERCE CSV ENGINE
                            </div>
                          </div>

                          {/* TERMINAL */}
                          <div className="bg-slate-50 text-emerald-400 p-4 rounded-2xl font-mono text-[11px] leading-relaxed h-[220px] overflow-y-auto border border-slate-800 shadow-inner flex flex-col space-y-1 text-left" dir="ltr">
                            {importLogs.map((log, i) => (
                              <div key={`admin-import-log-${i}`} className="whitespace-pre-wrap">
                                <span className="text-slate-500">[{new Date().toLocaleTimeString()}]</span> <span className="text-emerald-500">WOO_CSV:</span> {log}
                              </div>
                            ))}
                            {importLogs.length === 0 && (
                              <div className="text-slate-500 italic">سیستم آماده دریافت فایل یا متن CSV خروجی ووکامرس است...</div>
                            )}
                          </div>

                          {/* PROGRESS BAR */}
                          {importProgress !== null && (
                            <div className="bg-slate-100 p-4 rounded-2xl border border-slate-200/50 space-y-2">
                              <div className="flex justify-between text-xs font-black text-slate-700">
                                <span>در حال درج و ثبت اطلاعات در انبار دیتابیس...</span>
                                <span>{toPersianNum(importProgress)}٪</span>
                              </div>
                              <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                                <div className="bg-emerald-600 h-full transition-all duration-300" style={{ width: `${importProgress}%` }} />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* EXTRACTED CSV PRODUCTS PREVIEW TABLE */}
                    {csvParsedProducts.length > 0 && (
                      <div className="border-t border-slate-100 pt-8 space-y-6">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200/50">
                          <div>
                            <h4 className="text-sm font-black text-slate-800 flex items-center gap-2">
                              <CheckCircle className="text-emerald-500" size={18} />
                              پیش‌نمایش کالاهای استخراج‌شده از CSV ({toPersianNum(csvParsedProducts.length)} کالا)
                            </h4>
                            <p className="text-[11px] text-slate-400 font-bold">
                              ستون‌های فایل CSV طبق استاندارد نگاشت شدند. کالاهای موردنظر را انتخاب نموده و دکمه شروع آپلود و درون‌ریزی نهایی را بزنید.
                            </p>
                          </div>

                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => {
                                if (selectedCsvIndices.length === csvParsedProducts.length) {
                                  setSelectedCsvIndices([]);
                                } else {
                                  setSelectedCsvIndices(csvParsedProducts.map((_, i) => i));
                                }
                              }}
                              className="bg-slate-200 hover text-slate-700 font-black text-xs px-4 py-2.5 rounded-xl transition-all cursor-pointer"
                            >
                              {selectedCsvIndices.length === csvParsedProducts.length ? "لغو انتخاب همه" : "انتخاب همه کالاها"}
                            </button>

                            <button
                              type="button"
                              onClick={handleBatchSaveCsvProducts}
                              disabled={loading || selectedCsvIndices.length === 0}
                              className="bg-emerald-600 hover text-white font-black text-xs px-6 py-2.5 rounded-xl transition-all shadow-lg shadow-emerald-600/10 flex items-center gap-2 cursor-pointer"
                            >
                              <Upload size={16} />
                              شروع آپلود و درون‌ریزی نهایی {toPersianNum(selectedCsvIndices.length)} کالا به انبار
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                          {csvParsedProducts.map((p, idx) => {
                            const isSelected = selectedCsvIndices.includes(idx);
                            return (
                              <div
                                key={`csv-prod-item-${p.id || idx}-${idx}`}
                                onClick={() => {
                                  if (isSelected) {
                                    setSelectedCsvIndices(prev => prev.filter(i => i !== idx));
                                  } else {
                                    setSelectedCsvIndices(prev => [...prev, idx]);
                                  }
                                }}
                                className={`bg-white border rounded-3xl p-4 space-y-4 shadow-md hover transition-all cursor-pointer relative ${
                                  isSelected ? "border-emerald-500 ring-2 ring-emerald-500/20" : "border-slate-200/60"
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200/60 flex items-center justify-center">
                                    <ProductImage 
                                      src={p.image_url} 
                                      alt={p.name} 
                                      className="w-full h-full object-cover" 
                                    />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center justify-between gap-1 mb-1">
                                      <span className="text-[10px] font-mono bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-md font-bold">
                                        {p.sku || "بدون کد"}
                                      </span>
                                      <span className="text-[9px] text-slate-400 font-bold">{p.category}</span>
                                    </div>
                                    <h5 className="text-xs font-black text-slate-800 line-clamp-1">{p.name}</h5>
                                    <p className="text-[10px] text-slate-400 font-bold mt-0.5">موجودی: {toPersianNum(p.stock_quantity_cartons)} {p.unit}</p>
                                  </div>
                                  <div className={`w-6 h-6 rounded-full flex items-center justify-center border transition-all shrink-0 ${
                                    isSelected ? "bg-emerald-600 border-emerald-600 text-white" : "bg-white/80 border-slate-300 text-transparent"
                                  }`}>
                                    <Check size={12} strokeWidth={3} />
                                  </div>
                                </div>

                                <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-[10px]">
                                  <div>
                                    <span className="text-slate-400 block font-bold">قیمت فروش اصلی</span>
                                    <span className="font-black text-slate-800">{toPersianNum(p.price.toLocaleString())} تومان</span>
                                  </div>
                                  {p.consumer_price > 0 && (
                                    <div className="text-left">
                                      <span className="text-emerald-500 block font-bold">قیمت تخفیف‌خورده</span>
                                      <span className="font-black text-emerald-600">{toPersianNum(p.consumer_price.toLocaleString())} تومان</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* MODE 2: REST API IMPORTER */}
                {importerSourceMode === 'api' && (
                  <div className="space-y-8 animate-in fade-in duration-300">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* CONFIG PANEL */}
                  <div className="lg:col-span-1 space-y-6">
                    <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest border-b border-slate-50 pb-2">تنظیمات درگاه سایت مبدا</h4>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs text-slate-400 font-bold mb-2">نوع سیستم وب‌سایت مبدا</label>
                        <div className="grid grid-cols-2 gap-2 bg-slate-50 p-1 rounded-xl border border-slate-200">
                          <button
                            type="button"
                            onClick={() => setImporterStoreType('woocommerce')}
                            className={`py-2 px-3 rounded-lg text-xs font-black transition-all cursor-pointer ${
                              importerStoreType === 'woocommerce'
                                ? "bg-emerald-600 text-white shadow-md"
                                : "text-slate-500 hover"
                            }`}
                          >
                            درگاه فروشگاهی WooCommerce
                          </button>
                          <button
                            type="button"
                            onClick={() => setImporterStoreType('wordpress')}
                            className={`py-2 px-3 rounded-lg text-xs font-black transition-all cursor-pointer ${
                              importerStoreType === 'wordpress'
                                ? "bg-indigo-600 text-white shadow-md"
                                : "text-slate-500 hover"
                            }`}
                          >
                            وردپرس عمومی (پست به محصول)
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs text-slate-400 font-bold mb-2">آدرس اینترنتی وب‌سایت مبدا (دامنه اصلی)</label>
                        <div className="relative">
                          <input
                            type="url"
                            dir="ltr"
                            placeholder="https://example.com"
                            value={wpImportUrl}
                            onChange={(e) => setWpImportUrl(e.target.value)}
                            className="w-full pl-3 pr-10 py-3 rounded-xl border border-slate-200 bg-slate-50 focus focus focus:outline-none text-xs text-slate-700 font-bold"
                          />
                          <Settings size={16} className="absolute right-3.5 top-3.5 text-slate-400" />
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1.5 font-bold">سامانه به طور خودکار فیلترهای امنیتی و مسیرهای /wp-json را بر اساس استاندارد هسته تنظیم می‌کند.</p>
                      </div>

                      {importerStoreType === 'woocommerce' && (
                        <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl space-y-4">
                          <div className="flex gap-2 items-center text-amber-600">
                            <ShieldAlert size={14} />
                            <span className="text-[10px] font-black">احرازهویت اختیاری WooCommerce (فروشگاه خصوصی)</span>
                          </div>
                          
                          <div className="grid grid-cols-1 gap-3">
                            <div>
                              <label className="block text-[10px] text-slate-400 font-bold mb-1">Consumer Key (CK)</label>
                              <input
                                type="text"
                                dir="ltr"
                                placeholder="ck_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                                value={wpCk}
                                onChange={(e) => setWpCk(e.target.value)}
                                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-[10px] text-slate-700 font-mono"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] text-slate-400 font-bold mb-1">Consumer Secret (CS)</label>
                              <input
                                type="password"
                                dir="ltr"
                                placeholder="cs_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                                value={wpCs}
                                onChange={(e) => setWpCs(e.target.value)}
                                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-[10px] text-slate-700 font-mono"
                              />
                            </div>
                          </div>
                          <p className="text-[9px] text-slate-400 font-medium leading-relaxed">در صورت عدم ورود CK/CS، سیستم با استفاده از ووکامرس عمومی (Public Store API) اطلاعات را واکشی خواهد کرد که برای اکثر سایت‌ها کارآمد است.</p>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-4 pt-2">
                        <div>
                          <label className="block text-[10px] text-slate-400 font-bold mb-1">ضریب سود عمده کاتالوگ</label>
                          <input
                            type="number"
                            step="0.05"
                            value={bulkPriceFactor}
                            onChange={(e) => setBulkPriceFactor(parseFloat(e.target.value) || 0.85)}
                            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-700 font-bold"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-400 font-bold mb-1">ضریب سود خرده‌فروشی</label>
                          <input
                            type="number"
                            step="0.05"
                            value={consumerPriceFactor}
                            onChange={(e) => setConsumerPriceFactor(parseFloat(e.target.value) || 1.25)}
                            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-700 font-bold"
                          />
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleWpFetchProducts}
                        disabled={loading}
                        className="w-full bg-emerald-600 hover text-white font-black text-xs py-3.5 rounded-xl transition-all shadow-lg shadow-emerald-600/10 flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {loading ? <RefreshCw size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                        ارتباط زنده و واکشی کاتالوگ مبدا
                      </button>

                    </div>
                  </div>

                  {/* MONITORING LOGS TERMINAL */}
                  <div className="lg:col-span-2 flex flex-col space-y-4">
                    <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                      <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest">ترمینال خطایابی و لاگ مانیتورینگ زنده</h4>
                      <div className="flex items-center gap-1.5 text-[9px] text-slate-400 font-mono">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                        LIVE BACKEND CONSOLE
                      </div>
                    </div>

                    {/* BLACK HACKER-STYLE TERMINAL VIEWPORT */}
                    <div className="bg-slate-50 text-emerald-400 p-4 rounded-2xl font-mono text-[11px] leading-relaxed h-[200px] overflow-y-auto border border-slate-800 shadow-inner flex flex-col space-y-1 text-left" dir="ltr">
                      {importLogs.map((log, i) => (
                        <div key={`admin-import-log-${i}`} className="whitespace-pre-wrap">
                          <span className="text-slate-500">[{new Date().toLocaleTimeString()}]</span> <span className="text-amber-500">SYS_API_NODE:</span> {log}
                        </div>
                      ))}
                      {importLogs.length === 0 && (
                        <div className="text-slate-500 italic">ترمینال آماده به کار است. آدرس سایت مبدا را وارد نموده و ارتباط را آغاز نمایید...</div>
                      )}
                    </div>

                    {/* LIVE IMPORT PROGRESS BAR */}
                    {importProgress !== null && (
                      <div className="bg-slate-100 p-4 rounded-2xl border border-slate-200/50 space-y-2">
                        <div className="flex justify-between text-xs font-black text-slate-700">
                          <span>در حال درج محصولات در دیتابیس انبار مرکزی سیستم...</span>
                          <span>{toPersianNum(importProgress)}٪</span>
                        </div>
                        <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                          <div className="bg-emerald-600 h-full transition-all duration-300" style={{ width: `${importProgress}%` }} />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* PREVIEW PRODUCTS GRID */}
                {previewProducts.length > 0 && (
                  <div className="border-t border-slate-100 pt-8 space-y-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200/50">
                      <div>
                        <h4 className="text-sm font-black text-slate-800">شبکه بازخوانی محصولات پیش‌نمایش</h4>
                        <p className="text-[11px] text-slate-400 font-bold">محصولات زیر از سایت مبدا شناسایی شده‌اند. تیک اقلام منتخب را گذاشته و دکمه تایید نهایی را فشار دهید.</p>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            if (selectedPreviewIds.length === previewProducts.length) {
                              setSelectedPreviewIds([]);
                            } else {
                              setSelectedPreviewIds(previewProducts.map(p => p.id));
                            }
                          }}
                          className="bg-slate-200 hover text-slate-700 font-black text-xs px-4 py-2 rounded-xl transition-all cursor-pointer"
                        >
                          {selectedPreviewIds.length === previewProducts.length ? "لغو انتخاب همه" : "انتخاب همه کالاها"}
                        </button>
                        
                        <button
                          type="button"
                          onClick={handleBatchExecuteImport}
                          disabled={loading || selectedPreviewIds.length === 0}
                          className="bg-emerald-600 hover text-white font-black text-xs px-6 py-2.5 rounded-xl transition-all shadow-lg shadow-emerald-600/10 flex items-center gap-2 cursor-pointer"
                        >
                          <CheckCircle size={14} />
                          درون‌ریزی نهایی {toPersianNum(selectedPreviewIds.length)} قلم کالا به انبار
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                      {previewProducts.map((p, idx) => {
                        const isSelected = selectedPreviewIds.includes(p.id);
                        return (
                          <div
                            key={`prev-prod-item-${p.id || idx}-${idx}`}
                            onClick={() => {
                              if (isSelected) {
                                setSelectedPreviewIds(prev => prev.filter(id => id !== p.id));
                              } else {
                                setSelectedPreviewIds(prev => [...prev, p.id]);
                              }
                            }}
                            className={`bg-white border rounded-3xl p-4 space-y-4 shadow-md hover transition-all cursor-pointer relative ${
                              isSelected ? "border-emerald-500 ring-2 ring-emerald-500/20" : "border-slate-200/60"
                            }`}
                          >
                            <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-100 flex items-center justify-center">
                              {p.image_url ? (
                                <img 
                                  src={getDisplayImageUrl(p.image_url)} 
                                  alt={p.name} 
                                  referrerPolicy="no-referrer" 
                                  className="w-full h-full object-cover" 
                                  onError={(e) => { e.currentTarget.style.display = "none"; }}
                                />
                              ) : (
                                <span className="text-[10px] font-black text-slate-400">بدون تصویر</span>
                              )}
                              <div className="absolute top-2 right-2 bg-white/80 backdrop-blur-sm px-2 py-0.5 rounded-lg text-[9px] text-slate-800 font-black">
                                {p.category}
                              </div>
                              <div className={`absolute top-2 left-2 w-5 h-5 rounded-full flex items-center justify-center border transition-all ${
                                isSelected ? "bg-emerald-600 border-emerald-600 text-white" : "bg-white/80 border-slate-300 text-transparent"
                              }`}>
                                <Check size={10} strokeWidth={3} />
                              </div>
                            </div>
                            
                            <div className="space-y-1">
                              <h5 className="text-xs font-black text-slate-800 line-clamp-1">{p.name}</h5>
                              <p className="text-[10px] text-slate-400 font-bold">بسته‌بندی: {toPersianNum(p.carton_pack_count)} {p.unit} در کارتن</p>
                            </div>

                            <div className="pt-3 border-t border-slate-50 flex justify-between items-center text-[10px]">
                              <div className="space-y-0.5 text-right">
                                <span className="text-slate-400 font-bold block">قیمت تک‌فروشی مبدا</span>
                                <span className="font-black text-slate-800">{toPersianNum(p.price.toLocaleString())} ریال</span>
                              </div>
                              <div className="space-y-0.5 text-left">
                                <span className="text-emerald-500 font-bold block text-[9px]">کارتنی عمده (پیش‌فرض)</span>
                                <span className="font-black text-emerald-600">{toPersianNum(Math.round(p.price * bulkPriceFactor).toLocaleString())} ریال</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

            {/* SUPPLIERS CONSOLE: CARRIER DEPLOYMENT & DISPATCH WIDGET */}
            {panelRole === 'suppliers' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* LOGISTICS CARRIER DISPATCH */}
                <div className="lg:col-span-2 bg-white border border-slate-100 p-6 sm:p-8 rounded-[2.5rem] shadow-xl space-y-6">
                  <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                      <Truck size={20} />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-800">درگاه اعزام آنلاین ناوگان ترانزیت جاده‌ای</h4>
                      <p className="text-[10px] text-slate-400 font-bold">باربری و حمل مستقیم سبد کالاهای فاکتور شده کارخانه به انبار خریدار</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/50 space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-slate-700">محموله شماره #۳۹۲۰</span>
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[9px] rounded-md font-black">در حال بارگیری</span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-medium">مبدا: کارخانه شبستر | مقصد: باربری مرکزی تهران</p>
                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-amber-500 h-full w-[40%]" />
                      </div>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/50 space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-slate-700">محموله شماره #۳۹۱۹</span>
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[9px] rounded-md font-black">تحویل نهایی</span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-medium">مبدا: کارخانه تبریز | مقصد: بنکداری اصفهان</p>
                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-emerald-500 h-full w-full" />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={() => alert("فرم بارنامه هوشمند جاده‌ای به سامانه همتا ارجاع داده شد.")}
                      className="bg-blue-600 hover text-white font-black text-xs px-5 py-3 rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-2"
                    >
                      <Plus size={14} />
                      صدور فیش بارنامه و درخواست راننده آنلاین
                    </button>
                  </div>
                </div>

                {/* FACTORY QUALITY RANKINGS */}
                <div className="lg:col-span-1 bg-white border border-slate-100 p-6 sm:p-8 rounded-[2.5rem] shadow-xl space-y-6">
                  <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest border-b border-slate-50 pb-2">شاخص امتیاز کیفی کارخانجات زنجیره</h4>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-[10px] font-black">۱</span>
                        <span className="text-xs font-black text-slate-700">کارخانجات شندآباد (شبستر)</span>
                      </div>
                      <span className="text-xs font-black text-emerald-600">★ ۴.۹</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-[10px] font-black">۲</span>
                        <span className="text-xs font-black text-slate-700">صنایع کنسرو تبریز کالا</span>
                      </div>
                      <span className="text-xs font-black text-emerald-600">★ ۴.۸</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-[10px] font-black">۳</span>
                        <span className="text-xs font-black text-slate-700">کشت و صنعت آذربایجان</span>
                      </div>
                      <span className="text-xs font-black text-emerald-600">★ ۴.۶</span>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* CUSTOMERS CONSOLE: WALLET CHARGE & TRANSIT MAP WIDGET */}
            {panelRole === 'customers' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* GUIDE TO AD BOARD / FLOOR PRICE */}
                <div className="lg:col-span-2 bg-gradient-to-br from-emerald-900 to-slate-900 text-white p-6 sm:p-8 rounded-[2.5rem] shadow-xl space-y-6 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center border border-emerald-500/30">
                      <TrendingDown size={24} />
                    </div>
                    <h4 className="text-base font-black text-white">تالار کف قیمت و آگهی‌های زیر بازار</h4>
                    <p className="text-xs text-emerald-100 font-bold leading-relaxed">
                      برای مشاهده لیست درخواست‌های خرید کالا زیر قیمت کف، استعلام بارهای مازاد کارخانجات و ثبت تقاضای عمده، از بخش «کف قیمت» در منوی اصلی بالای صفحه استفاده کنید. تمامی درخواست‌ها پس از تایید مدیریت در بیلبورد عمومی نمایش داده می‌شوند.
                    </p>
                  </div>
                  <div className="pt-4 border-t border-emerald-800/50 flex items-center justify-between">
                    <span className="text-[10px] text-emerald-300 font-bold">دسترسی سریع و امن با ضمانت واسطه‌گری</span>
                    <button
                      onClick={() => setActiveSubTab('ads')}
                      className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-[10px] font-black hover transition-all shadow-lg shadow-emerald-600/10 cursor-pointer"
                    >
                      ورود به تالار آگهی‌ها
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {activeSubTab === 'news' && (
        <AdminArticles
          articles={articles}
          products={products}
          b2bConfig={b2bConfig}
          setLoading={setLoading}
          setSuccessMsg={setSuccessMsg}
          setErrorMsg={setErrorMsg}
          confirmAction={confirmAction}
          onUpdateArticles={onUpdateArticles}
        />
      )}
      {activeSubTab === 'approvals' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <AdminPendingApprovals
            orders={orders}
            onEditOrder={handleStartEditOrder}
            safeBuyRequests={safeBuyRequests}
            sponsoredAds={sponsoredAds}
            products={products}
            onUpdateProductStatus={async (id, isApproved, reason) => {
              await onUpdateProduct(id, {
                approvalStatus: isApproved ? 'approved' : 'rejected',
                isApproved: isApproved,
                rejectionReason: reason
              });
            }}
            rawMaterialAds={rawMaterialAds}
            equipmentAds={equipmentAds}
            serviceAds={serviceAds}
            barterDeals={barterDeals}
            representativesList={representativesList}
            onUpdateRepStatus={handleUpdateRepStatus}
            suppliersList={suppliersList}
            onUpdateSupplierStatus={handleUpdateSupplierStatus}
            callbackRequests={callbackRequests}
            supportTickets={supportTickets}
            onUpdateOrderStatus={handleUpdateOrderStatus}
            onUpdateSafeBuyStatus={handleUpdateSafeBuyStatus}
            onUpdateAdStatus={handleUpdateAdStatus}
            onEditAd={handleEditAdFromApprovals}
            onUpdateBarterStatus={handleUpdateBarterStatus}
            onUpdateCallback={handleUpdateCallback}
            onUpdateTicketStatus={handleUpdateTicketStatus}
            onNavigateTab={(tab) => {
              setActiveSubTab(tab as any);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          />
        </div>
      )}
      {activeSubTab === 'representatives' && (
        <AdminRepresentatives
          representativesList={representativesList}
          allAvailableBrandsList={allAvailableBrandsList}
          setLoading={setLoading}
          setSuccessMsg={setSuccessMsg}
          setErrorMsg={setErrorMsg}
          confirmAction={confirmAction}
          setSelectedRepForCertificate={setSelectedRepForCertificate}
          onUpdateReps={onUpdateReps}
        />
      )}
      {activeSubTab === 'orders' && (
        <AdminOrders
          orders={orders}
          ordersLoading={ordersLoading}
          ordersSearch={ordersSearch}
          setOrdersSearch={setOrdersSearch}
          fetchOrders={fetchOrders}
          handleUpdateOrderStatus={handleUpdateOrderStatus}
          panelRole="admin"
          formatOrderDate={formatOrderDate}
          getStatusLabel={getStatusLabel}
          setLoading={setLoading}
          setSuccessMsg={setSuccessMsg}
          setErrorMsg={setErrorMsg}
          confirmAction={confirmAction}
          setShowPrintInvoice={setShowPrintInvoice}
        />
      )}
      {activeSubTab === 'crm' && (
        <AdminCRM
          crmCustomers={crmCustomers}
          crmLoading={crmLoading}
          products={products}
          setLoading={setLoading}
          setSuccessMsg={setSuccessMsg}
          setErrorMsg={setErrorMsg}
          confirmAction={confirmAction}
          loadCrmCustomers={loadCrmCustomers}
          onUpdateOrders={async () => { await fetchOrders(); }}
        />
      )}
      {(activeSubTab === 'invoice' || activeSubTab === 'accounting') && (
        <AdminInvoiceSettings
          b2bConfig={b2bConfig}
          onUpdateB2bConfig={onUpdateB2bConfig}
        />
      )}
      {activeSubTab === 'safe_buy' && (
        <AdminSafeBuy
          products={products}
          sponsoredAds={sponsoredAds}
          setSuccessMsg={setSuccessMsg}
          setErrorMsg={setErrorMsg}
          setLoading={setLoading}
        />
      )}
      {activeSubTab === 'ads' && (
        <AdminAdsManagement
          sponsoredAds={sponsoredAds}
          onUpdateAdStatus={handleUpdateAdStatus}
          onEditAd={handleEditAdFromApprovals}
          onUpdateB2bConfig={onUpdateB2bConfig}
          b2bConfig={b2bConfig}
          setSuccessMsg={setSuccessMsg}
          setErrorMsg={setErrorMsg}
        />
      )}
      {(activeSubTab as any) === 'product_sync_status' && (
        <ProductSyncStatusView products={products} b2bConfig={b2bConfig} onSaveB2bConfig={onUpdateB2bConfig} />
      )}
      {(activeSubTab as any) === 'factory_audit' && (
        <AdminFactoryProductAudit 
          products={products}
          onUpdateProduct={onUpdateProduct}
        />
      )}
      {activeSubTab === 'channel_posts' && (
        <AdminChannelPosts
          setSuccessMsg={setSuccessMsg}
          autoPostSettings={autoPostSettings}
          setAutoPostSettings={setAutoPostSettings}
        />
      )}
      {activeSubTab === 'dashboard' && <AdminSalesCharts />}
      {(activeSubTab as any) === 'system' && !showAiSettings && !showImporterDashboard && (
        <AdminSystemConfig
          b2bConfig={b2bConfig}
          onUpdateB2bConfig={onUpdateB2bConfig}
          products={products}
          orders={orders}
          articles={articles}
          onRefreshProducts={onRefreshProducts}
        />
      )}
      {(activeSubTab as any) === 'parspack_storage' && !showAiSettings && !showImporterDashboard && (
        <AdminSystemConfig
          defaultTab="parspack_storage"
          b2bConfig={b2bConfig}
          onUpdateB2bConfig={onUpdateB2bConfig}
          products={products}
          orders={orders}
          articles={articles}
          onRefreshProducts={onRefreshProducts}
        />
      )}
      {(activeSubTab as any) === 'sms' && !showAiSettings && !showImporterDashboard && (
        <AdminSystemConfig
          defaultTab="sms"
          b2bConfig={b2bConfig}
          onUpdateB2bConfig={onUpdateB2bConfig}
          products={products}
          orders={orders}
          articles={articles}
          onRefreshProducts={onRefreshProducts}
        />
      )}
      {(activeSubTab as any) === 'reports' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
            <div>
              <h3 className="text-xl font-black text-slate-900">گزارشات تحلیل بازار و فروش</h3>
              <p className="text-xs text-slate-400 font-bold mt-1">مانیتورینگ هوشمند عملکرد کارخانجات و توزیع‌کنندگان عمده</p>
            </div>
            <div className="flex gap-2">
              <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-100 rounded-2xl text-[11px] font-black text-slate-700 shadow-sm hover:shadow-md transition-all">
                <Download size={14} />
                خروجی PDF
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-2xl text-[11px] font-black shadow-md shadow-emerald-500/20 hover:bg-emerald-700 transition-all">
                <RefreshCw size={14} />
                بروزرسانی داده‌ها
              </button>
            </div>
          </div>
          <AdminSalesCharts />
        </div>
      )}
      {(activeSubTab as any) === 'profile' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-xl">
          <h3 className="text-sm font-black text-slate-900">مدیریت حساب کاربری و امنیت</h3>
          <div className="space-y-4">
            <input 
               type="text" 
               placeholder="نام نمایشی جدید" 
               value={newDisplayName}
              onChange={(e) => setNewDisplayName(e.target.value)}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black"
            />
            <button 
               onClick={() => updateDisplayName(newDisplayName)}
              className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-[10px] font-black"
            > 
              به‌روزرسانی نام
            </button>
          </div>
          <div className="space-y-4 pt-4 border-t border-gray-100">
            <input 
               type="password" 
               placeholder="رمز عبور جدید" 
               value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black"
            />
            <button 
               onClick={() => changePassword(newPassword)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black"
            >
              تغییر رمز عبور
            </button>
          </div>
          <div className="pt-4 border-t border-gray-100">
            <button 
               onClick={async () => {
                await logoutUser();
                if (onLogout) onLogout();
              }}
              className="px-4 py-2 bg-rose-600 hover transition-colors text-white rounded-xl text-[10px] font-black cursor-pointer"
            >
              خروج از حساب
            </button>
          </div>
        </div>
      )}
      {activeSubTab === 'categories' && (
        <div className="bg-white p-12 rounded-[3rem] border border-slate-100 shadow-xl text-center">
          <Layers size={64} className="mx-auto text-indigo-200 mb-6" />
          <h3 className="text-xl font-black text-slate-900">مدیریت دسته‌بندی‌های کالا</h3>
          <p className="text-sm text-slate-400 font-bold mt-4 max-w-md mx-auto">لیست دسته‌بندی‌ها به صورت خودکار از کاتالوگ محصولات استخراج می‌شود. بزودی امکان ویرایش دستی و تغییر آیکون‌ها فراهم می‌گردد.</p>
        </div>
      )}
      {activeSubTab === 'brands' && (
        <div className="bg-white p-12 rounded-[3rem] border border-slate-100 shadow-xl text-center">
          <Award size={64} className="mx-auto text-indigo-200 mb-6" />
          <h3 className="text-xl font-black text-slate-900">مدیریت برندهای تجاری</h3>
          <p className="text-sm text-slate-400 font-bold mt-4 max-w-md mx-auto">برندها بر اساس محصولات موجود در انبار دسته‌بندی می‌شوند. می‌توانید از بخش برندینگ برای مدیریت لوگوها استفاده کنید.</p>
        </div>
      )}
      {activeSubTab === 'barter' && (
        <div className="bg-white p-12 rounded-[3rem] border border-slate-100 shadow-xl text-center">
          <RefreshCw size={64} className="mx-auto text-indigo-200 mb-6" />
          <h3 className="text-xl font-black text-slate-900">سامانه تهاتر کالا و خدمات</h3>
          <p className="text-sm text-slate-400 font-bold mt-4 max-w-md mx-auto">بخش تهاتر هوشمند در حال توسعه است. فعلاً درخواست‌های تهاتر را از بخش صف تایید پیگیری کنید.</p>
        </div>
      )}
      {activeSubTab === 'products' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {batchProgress && (
            <ProgressIndicator 
              current={batchProgress.current} 
              total={batchProgress.total} 
              message={batchProgress.message} 
            />
          )}
          
          {/* IMPORT & BULK ACTIONS CONTROLS */}
          {!showForm && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 bg-white p-6 sm:p-8 rounded-[2.5rem] border border-gray-100 shadow-xl">
              <div className="space-y-6">
                <div className="flex items-center gap-3 border-b border-gray-50 pb-4">
                  <div className="p-2 bg-emerald-50 rounded-xl">
                    <RefreshCw size={20} className="text-emerald-600" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900">مدیریت هوشمند و عملیات گروهی</h4>
                    <p className="text-[10px] text-gray-400 font-bold">تغییر وضعیت، حذف و بروزرسانی قیمت دسته‌جمعی کالاها</p>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <button 
                    onClick={handleToggleSelectAll}
                    className="px-4 py-2 bg-slate-50 hover text-slate-600 rounded-xl text-[10px] font-black transition-all border border-slate-100"
                  >
                    {selectedProductIds.length === products.length ? "لغو انتخاب همه" : "انتخاب همه کالاها"}
                  </button>
                  {selectedProductIds.length > 0 && (
                    <>
                      <button 
                        onClick={() => handleBatchStatusToggle(false)}
                        className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-[10px] font-black hover transition-all shadow-lg shadow-emerald-600/10"
                      >
                        فعال‌سازی ({selectedProductIds.length})
                      </button>
                      <button 
                        onClick={() => handleBatchStatusToggle(true)}
                        className="px-4 py-2 bg-amber-500 text-white rounded-xl text-[10px] font-black hover transition-all shadow-lg shadow-amber-500/10"
                      >
                        غیرفعال‌سازی
                      </button>
                      <button 
                        onClick={handleBatchDelete}
                        className="px-4 py-2 bg-rose-600 text-white rounded-xl text-[10px] font-black hover transition-all shadow-lg shadow-rose-600/10"
                      >
                        حذف نهایی
                      </button>
                    </>
                  )}
                </div>

                {selectedProductIds.length > 0 && (
                  <div className="flex items-center gap-4 p-5 bg-blue-50 border border-blue-100 rounded-2xl relative overflow-hidden">
                    <div className="flex-1 space-y-1">
                      <p className="text-[10px] font-black text-blue-900">تغییر دسته جمعی قیمت (درصد):</p>
                      <input 
                        type="number"
                        value={batchPriceChange}
                        onChange={(e) => setBatchPriceChange(Number(e.target.value))}
                        placeholder="مثلا 5+ یا 10-"
                        className="w-full bg-white px-3 py-2 border border-blue-200 rounded-xl text-xs font-black outline-none focus focus"
                      />
                    </div>
                    <button 
                      onClick={handleBatchPriceUpdate}
                      className="bg-blue-600 hover text-white px-6 py-2.5 rounded-xl text-[10px] font-black shadow-lg shadow-blue-600/20 transition-all mt-4"
                    >
                      اعمال روی {selectedProductIds.length} کالا
                    </button>
                  </div>
                )}

                {/* Global Bulk Price Adjustment */}
                <div className="p-5 bg-amber-50/50 border border-amber-100 rounded-[1.5rem] space-y-3">
                  <div className="flex items-center gap-2">
                    <Percent size={16} className="text-amber-600 shrink-0" />
                    <div>
                      <h5 className="text-xs font-black text-amber-950">تغییر سراسری قیمت تمام کالاها</h5>
                      <p className="text-[9px] text-amber-800 font-medium">افزایش یا کاهش کلی قیمت تمام کالاها به صورت درصدی</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex-1 min-w-[120px]">
                      <input 
                        type="number"
                        min="1"
                        max="100"
                        placeholder="درصد تغییر (مثلا ۵)"
                        value={globalPriceChangePercent}
                        onChange={(e) => setGlobalPriceChangePercent(e.target.value)}
                        className="w-full bg-white px-3 py-2 border border-amber-200 rounded-xl text-xs font-black outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-center"
                      />
                    </div>
                    
                    <div className="flex bg-amber-100 p-1 rounded-xl gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => setGlobalPriceChangeDirection('increase')}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                          globalPriceChangeDirection === 'increase'
                            ? "bg-amber-600 text-white shadow-xs"
                            : "text-amber-800 hover:bg-amber-200"
                        }`}
                      >
                        📈 افزایش
                      </button>
                      <button
                        type="button"
                        onClick={() => setGlobalPriceChangeDirection('decrease')}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                          globalPriceChangeDirection === 'decrease'
                            ? "bg-rose-600 text-white shadow-xs"
                            : "text-amber-800 hover:bg-amber-200"
                        }`}
                      >
                        📉 کاهش
                      </button>
                    </div>
                    
                    <button
                      type="button"
                      onClick={handleGlobalPriceUpdate}
                      disabled={loading || !globalPriceChangePercent}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-amber-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-[10px] font-black transition-all cursor-pointer shadow-xs border border-slate-200"
                    >
                      اعمال سراسری
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-6 lg lg lg:pr-8">
                <div className="flex items-center gap-3 border-b border-gray-50 pb-4">
                  <div className="p-2 bg-blue-50 rounded-xl">
                    <Plus size={20} className="text-blue-600" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900">درون‌ریزی هوشمند (Import)</h4>
                    <p className="text-[10px] text-gray-400 font-bold">انتقال خودکار کالاها از وردپرس و یا فایل‌های JSON</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {/* JSON Catalog URL Sync Field */}
                  <div className="space-y-2 p-3 bg-emerald-50/60 rounded-2xl border border-emerald-100">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-black text-emerald-900 flex items-center gap-1">
                        <Globe size={12} className="text-emerald-600" />
                        <span>همگام‌سازی از لینک مستقیم JSON باکت (catalog.json):</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => { setActiveSubTab('product_sync_status'); }}
                        className="text-[9px] font-black text-emerald-700 hover:underline cursor-pointer"
                      >
                        مشاهده پنل پایش کامل ➔
                      </button>
                    </div>

                    <div className="flex gap-2">
                      <input 
                        type="text"
                        placeholder="https://c102393.parspack.net/c102393/catalog.json"
                        value={catalogJsonSyncUrl}
                        onChange={(e) => setCatalogJsonSyncUrl(e.target.value)}
                        className="flex-1 px-3 py-2 bg-white border border-emerald-200 rounded-xl text-[10px] font-mono dir-ltr text-left font-semibold"
                      />
                      <button 
                        onClick={handleCatalogJsonSyncFromUrl}
                        disabled={isSyncingCatalogJsonUrl}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-[10px] font-black transition-all shadow-md shadow-emerald-600/20 flex items-center gap-1 shrink-0 cursor-pointer"
                      >
                        {isSyncingCatalogJsonUrl ? <RefreshCw size={12} className="animate-spin" /> : <Zap size={12} />}
                        <span>{isSyncingCatalogJsonUrl ? "همگام‌سازی..." : "شروع همگام‌سازی JSON"}</span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-500">لینک API وردپرس یا WXR URL:</label>
                    <div className="flex gap-2">
                      <input 
                        type="text"
                        placeholder="https://mysite.com/wp-json/wp/v2/posts"
                        value={wpImportUrl}
                        onChange={(e) => setWpImportUrl(e.target.value)}
                        className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-mono"
                      />
                      <button 
                        onClick={handleWpFetchProducts}
                        className="px-4 py-2 bg-white text-white rounded-xl text-[9px] font-black hover transition-all"
                      >
                        شروع
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-500">درون‌ریزی فایل CSV:</label>
                    <input 
                      type="file"
                      accept=".csv"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          Papa.parse(file, {
                            header: true,
                            skipEmptyLines: true,
                            complete: async (results) => {
                              setLoading(true);
                              let importedCount = 0;
                              let skippedCount = 0;
                              try {
                                for (const item of results.data as any[]) {
                                  const name = item.name || item.title || item.نام || item.عنوان;
                                  const price = item.price || item.قیمت || item.cost;
                                  if (!name || !price) {
                                    skippedCount++;
                                    continue;
                                  }
                                  await onAddProduct({
                                    name: String(name),
                                    brand: item.brand || item.کارخانه || item.برند || "دست اول",
                                    description: item.description || item.توضیحات || "",
                                    price: Number(price),
                                    bulk_price: Number(item.bulk_price || item.price_bulk || item.قیمت_عمده || Number(price) * 0.85),
                                    consumer_price: Number(item.consumer_price || item.price_consumer || item.قیمت_مصرف_کننده || Number(price) * 1.25),
                                    carton_pack_count: Number(item.carton_pack_count || item.تعداد_در_کارتن || 24),
                                    min_order_cartons: Number(item.min_order_cartons || item.حداقل_سفارش || 5),
                                    category: item.category || item.دسته_بندی || "تنقلات و شکلات",
                                    stock_quantity_cartons: Number(item.stock_quantity_cartons || item.موجودی || 100),
                                    image_url: item.image_url || item.تصویر || "https://images.unsplash.com/photo-1550547660-d9450f859349?w=500",
                                    unit: item.unit || item.واحد || "بسته",
                                    sellerId: item.sellerId || "",
                                    sellerName: item.sellerName || "تامین کننده مرکزی",
                                    production_lead_time_days: Number(item.production_lead_time_days || 2),
                                    brandLogoUrl: ""
                                  }, true);
                                  importedCount++;
                                }
                                if (onRefreshProducts) await onRefreshProducts();
                                setSuccessMsg(`${importedCount} کالا وارد شد. ${skippedCount} مورد رد شد.`);
                              } catch (err: any) {
                                setErrorMsg("خطا در CSV: " + err.message);
                              } finally {
                                setLoading(false);
                              }
                            }
                          });
                        }
                      }}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

      {/* --- SYSTEM & INFRASTRUCTURE TAB --- */}

      {/* --- TAB 3: REPORTS --- */}

          {/* Form container */}
          <AnimatePresence>
            {showForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-white rounded-[2rem] border border-gray-100 shadow-lg p-6 sm:p-8 overflow-hidden"
              >
                <h3 className="text-base font-black text-slate-900 mb-6 flex items-center gap-2 border-b border-gray-100 pb-4">
                  <Layers2 className="text-indigo-600" size={18} />
                  {isEditing ? "ویرایش مشخصات فنی و بسته‌بندی کالا" : "افزودن کالای عمده جدید به انبار دست اول"}
                </h3>

                <form onSubmit={handleFormSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-[11px] font-black text-slate-500 block">نام کامل کالا:</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="نام کامل تجاری محصول"
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-2xl focus focus transition-all text-xs font-black text-slate-800 text-right"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-black text-slate-500 block">انتخاب برند کالا:</label>
                    <div className="space-y-2">
                      <select
                        value={brands.some(b => b.name === brand) ? brand : "__custom__"}
                        onChange={e => {
                          if (e.target.value !== "__custom__") {
                            setBrand(e.target.value);
                            const matchedBrand = brands.find(b => b.name === e.target.value);
                            if (matchedBrand && matchedBrand.logoUrl) {
                              setBrandLogoUrl(matchedBrand.logoUrl);
                            }
                          }
                        }}
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-2xl focus focus transition-all text-xs font-black text-slate-800 text-right cursor-pointer"
                      >
                        <option value="">-- انتخاب از لیست برندها --</option>
                        {brands.map((b, idx) => (
                          <option key={`admin-panel-brand-opt-${b.id || idx}-${idx}`} value={b.name}>
                            {b.name} ({b.type || "تولیدکننده"})
                          </option>
                        ))}
                        <option value="__custom__">+ برند سفارشی (تایپ دستی)</option>
                      </select>

                      <input
                        type="text"
                        required
                        value={brand}
                        onChange={e => setBrand(e.target.value)}
                        placeholder="نام برند (تایپ کنید)"
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-2xl focus focus transition-all text-xs font-black text-slate-800 text-right"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-black text-slate-500 block">لینک لوگوی برند (URL):</label>
                    <input
                      type="text"
                      value={brandLogoUrl}
                      onChange={e => setBrandLogoUrl(e.target.value)}
                      placeholder="https://example.com/logo.png"
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-2xl focus focus transition-all text-xs font-mono text-left"
                      dir="ltr"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-black text-slate-500 block">دسته‌بندی کالا:</label>
                    <select
                      value={category}
                      onChange={e => setCategory(e.target.value)}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-2xl focus focus transition-all text-xs font-black text-slate-800 text-right cursor-pointer"
                    >
                      {(() => {
                        const catList = (b2bConfig.categories && b2bConfig.categories.length > 0)
                          ? b2bConfig.categories
                          : (categories && categories.length > 0)
                            ? categories
                            : Array.from(new Set(products.map((p: any) => p.category).filter(Boolean))).map(c => ({ id: c, name: c }));
                        const names = catList.map((c: any) => typeof c === 'string' ? c : (c.name || c.id));
                        if (category && !names.includes(category)) {
                          names.push(category);
                        }
                        if (names.length === 0) {
                          names.push("دسته‌بندی جدید");
                        }
                        return names.map((catName: string, i: number) => (
                          <option key={`admin-panel-cat-opt-2-${catName}-${i}`} value={catName}>
                            {catName}
                          </option>
                        ));
                      })()}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-black text-slate-500 block">قیمت خرید (تومان/ریال):</label>
                    <input
                      type="text"
                      required
                      value={purchasePrice === 0 ? "" : purchasePrice}
                      onChange={e => {
                        const raw = e.target.value.replace(/[۰-۹]/g, d => "۰۱۲۳۴۵۶۷۸۹".indexOf(d).toString()).replace(/[^0-9]/g, "");
                        setPurchasePrice(raw === "" ? 0 : parseInt(raw, 10));
                      }}
                      placeholder="۰"
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-2xl focus focus transition-all text-xs font-mono font-bold text-slate-800 text-left"
                      dir="ltr"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-black text-slate-500 block">قیمت پایه تک‌فروشی (Base Retail Price):</label>
                    <input
                      type="text"
                      required
                      value={price === 0 ? "" : price}
                      onChange={e => {
                        const raw = e.target.value.replace(/[۰-۹]/g, d => "۰۱۲۳۴۵۶۷۸۹".indexOf(d).toString()).replace(/[^0-9]/g, "");
                        setPrice(raw === "" ? 0 : parseInt(raw, 10));
                      }}
                      placeholder="۰"
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-2xl focus focus transition-all text-xs font-mono font-bold text-slate-800 text-left"
                      dir="ltr"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-black text-slate-500 block">قیمت فروش عمده (Sale Price):</label>
                    <input
                      type="text"
                      required
                      value={bulkPrice === 0 ? "" : bulkPrice}
                      onChange={e => {
                        const raw = e.target.value.replace(/[۰-۹]/g, d => "۰۱۲۳۴۵۶۷۸۹".indexOf(d).toString()).replace(/[^0-9]/g, "");
                        setBulkPrice(raw === "" ? 0 : parseInt(raw, 10));
                      }}
                      placeholder="۰"
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-2xl focus focus transition-all text-xs font-mono font-bold text-slate-800 text-left"
                      dir="ltr"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-black text-slate-500 block">قیمت مصرف‌کننده (Consumer Price):</label>
                    <input
                      type="text"
                      required
                      value={consumerPrice === 0 ? "" : consumerPrice}
                      onChange={e => {
                        const raw = e.target.value.replace(/[۰-۹]/g, d => "۰۱۲۳۴۵۶۷۸۹".indexOf(d).toString()).replace(/[^0-9]/g, "");
                        setConsumerPrice(raw === "" ? 0 : parseInt(raw, 10));
                      }}
                      placeholder="۰"
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-2xl focus focus transition-all text-xs font-mono font-bold text-slate-800 text-left"
                      dir="ltr"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-black text-slate-500 block">قیمت کل کارتن (Calculated):</label>
                    <div className="w-full px-4 py-2 bg-emerald-50 border border-emerald-100 rounded-2xl text-xs font-mono font-black text-emerald-700 text-left">
                      {(bulkPrice * cartonPackCount).toLocaleString()} ریال
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-black text-slate-500 block">حاشیه سود بنکدار (Margin %):</label>
                    <div className={`w-full px-4 py-2 border rounded-2xl text-xs font-mono font-black text-left ${((consumerPrice - bulkPrice) / consumerPrice * 100) > 15 ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-amber-50 border-amber-100 text-amber-700'}`}>
                      {toPersianNum(((consumerPrice - bulkPrice) / consumerPrice * 100).toFixed(1))}٪ سود خالص
                    </div>
                  </div>

                  <div className="space-y-1 md:col-span-3">
                    <label className="text-[11px] font-black text-slate-500 block">توضیحات کوتاه فنی و بسته‌بندی:</label>
                    <textarea
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      placeholder="مثال: کارتن ۲۴ عددی، تاریخ انقضا ۱۲ ماه، شیرینگ شده..."
                      rows={2}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-2xl focus focus transition-all text-xs font-black text-slate-800 text-right"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-black text-slate-500 block">نشان کالا (Badge):</label>
                    <input
                      type="text"
                      value={badge}
                      onChange={e => setBadge(e.target.value)}
                      placeholder="مثال: پرفروش، ویژه، جدید"
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-2xl focus focus transition-all text-xs font-black text-slate-800 text-right"
                    />
                  </div>

                  {/* Health Apple & FDA Certifications Block */}
                  <div className="md:col-span-3 p-4 bg-emerald-50/80 rounded-2xl border border-emerald-200/80 space-y-3 my-2">
                    <h4 className="text-xs font-black text-emerald-950 flex items-center gap-2">
                      <span>🍏</span>
                      <span>گواهینامه‌های بهداشتی و سلامت کالا (سازمان غذا و دارو)</span>
                    </h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <label className="flex items-center gap-2 text-xs font-black text-emerald-900 bg-white p-2.5 rounded-xl border border-emerald-100 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={hasHealthApple}
                          onChange={e => setHasHealthApple(e.target.checked)}
                          className="w-4 h-4 text-emerald-600 rounded"
                        />
                        <span>دارای نشان رسمی سیب سلامت</span>
                      </label>

                      <label className="flex items-center gap-2 text-xs font-black text-emerald-900 bg-white p-2.5 rounded-xl border border-emerald-100 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isNatural}
                          onChange={e => setIsNatural(e.target.checked)}
                          className="w-4 h-4 text-emerald-600 rounded"
                        />
                        <span>محصول ۱۰۰٪ طبیعی (فاقد مواد شیمیایی)</span>
                      </label>

                      <label className="flex items-center gap-2 text-xs font-black text-emerald-900 bg-white p-2.5 rounded-xl border border-emerald-100 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isOrganic}
                          onChange={e => setIsOrganic(e.target.checked)}
                          className="w-4 h-4 text-emerald-600 rounded"
                        />
                        <span>محصول ارگانیک تایید شده</span>
                      </label>
                    </div>

                    <div className="pt-2 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                      <div>
                        <label className="text-[11px] font-black text-emerald-900 block mb-1">کد پروانه بهداشتی / شماره سیب سلامت:</label>
                        <input
                          type="text"
                          value={healthCertCode}
                          onChange={e => setHealthCertCode(e.target.value)}
                          placeholder="مثال: ۱۶/۱۲۴۵۸"
                          className="w-full sm:w-64 px-3 py-1.5 bg-white border border-emerald-200 rounded-xl text-xs font-mono font-black text-emerald-950 text-right"
                        />
                      </div>

                      <div className="flex-1 w-full">
                        <label className="text-[11px] font-black text-slate-800 block mb-1">تگ‌ها و کلیدواژه‌های سئو (با کاما جدا کنید):</label>
                        <input
                          type="text"
                          value={productTags}
                          onChange={e => setProductTags(e.target.value)}
                          placeholder="مثال: چیپس، باتو، تنقلات سیب زمینی، خرید عمده"
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1 flex flex-col gap-3 pt-2">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="isFavorite"
                        checked={isFavorite}
                        onChange={e => setIsFavorite(e.target.checked)}
                        className="w-5 h-5 rounded-lg border-slate-200 text-emerald-600 focus"
                      />
                      <label htmlFor="isFavorite" className="text-xs font-black text-slate-700 cursor-pointer select-none">افزودن به لیست علاقه‌مندی‌های پیش‌فرض</label>
                    </div>

                    <div className="flex items-center gap-3 bg-indigo-50/50 p-2.5 rounded-xl border border-indigo-100 w-max">
                      <input
                        type="checkbox"
                        id="chequeAllowedForm"
                        checked={chequeAllowed}
                        onChange={e => setChequeAllowed(e.target.checked)}
                        className="w-5 h-5 rounded-lg border-indigo-200 text-indigo-600 focus"
                      />
                      <label htmlFor="chequeAllowedForm" className="text-xs font-black text-indigo-950 cursor-pointer select-none">
                        ⚙️ فعال‌سازی فروش چکی برای این محصول (۵۰٪ نقد + ۵۰٪ چک صیادی)
                      </label>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-black text-slate-500 block">تعداد دانه در هر کارتن:</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      required
                      value={cartonPackCount === 0 ? "" : cartonPackCount}
                      onChange={e => {
                        const clean = toEnglishNum(e.target.value).replace(/[^0-9]/g, '');
                        setCartonPackCount(clean === "" ? 0 : parseInt(clean, 10));
                      }}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-2xl focus focus transition-all text-xs font-mono font-bold text-slate-800 text-left"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-black text-slate-500 block">حداقل سفارش کارتن (MOQ):</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      required
                      value={minOrderCartons === 0 ? "" : minOrderCartons}
                      onChange={e => {
                        const clean = toEnglishNum(e.target.value).replace(/[^0-9]/g, '');
                        setMinOrderCartons(clean === "" ? 0 : parseInt(clean, 10));
                      }}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-2xl focus focus transition-all text-xs font-mono font-bold text-slate-800 text-left"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-black text-slate-500 block">موجودی انبار (کارتن):</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      required
                      value={stockQuantityCartons === 0 ? "" : stockQuantityCartons}
                      onChange={e => {
                        const clean = toEnglishNum(e.target.value).replace(/[^0-9]/g, '');
                        setStockQuantityCartons(clean === "" ? 0 : parseInt(clean, 10));
                      }}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-2xl focus focus transition-all text-xs font-mono font-bold text-slate-800 text-left"
                    />
                  </div>

                  {/* Sales Unit & Weight Config Block */}
                  <div className="md:col-span-3 p-4 bg-indigo-50/70 rounded-2xl border border-indigo-150 space-y-3 my-1">
                    <h4 className="text-xs font-black text-indigo-950 flex items-center gap-2">
                      <Scale size={16} className="text-indigo-600" />
                      <span>تنظیم نحوه فروش و واحد سنجش کالا (اختیاز ادمین)</span>
                    </h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <label className="text-[11px] font-black text-slate-600 block">نوع واحد اصلی فروش:</label>
                        <select
                          value={salesUnitType}
                          onChange={e => setSalesUnitType(e.target.value as any)}
                          className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-xl text-xs font-black text-indigo-950 cursor-pointer"
                        >
                          <option value="carton">کارتنی / بسته‌ای (فروش بر اساس کارتن/جعبه)</option>
                          <option value="count">عددی / خرد (فروش بر اساس عدد، پاکت، قوطی)</option>
                          <option value="weight">وزنی / کیلویی (فروش بر اساس کیلوگرم، کیسه، حلب)</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-black text-slate-600 block">نام واحد خرد/فرعی کالا:</label>
                        <div className="flex gap-2">
                          <select
                            value={unit}
                            onChange={e => setUnit(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-xl text-xs font-black text-indigo-950 cursor-pointer"
                          >
                            <option value="پاکت">پاکت</option>
                            <option value="عدد">عدد</option>
                            <option value="قوطی">قوطی</option>
                            <option value="بطری">بطری</option>
                            <option value="شیشه">شیشه</option>
                            <option value="کیلوگرم">کیلوگرم</option>
                            <option value="کیسه">کیسه</option>
                            <option value="حلب">حلب</option>
                            <option value="بسته">بسته</option>
                            <option value="طاقه">طاقه</option>
                            <option value="کارتن">کارتن</option>
                          </select>
                          <input
                            type="text"
                            value={unit}
                            onChange={e => setUnit(e.target.value)}
                            placeholder="تایپ واحد"
                            className="w-28 px-2 py-2 bg-white border border-indigo-200 rounded-xl text-xs font-black text-indigo-950 text-center"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-black text-slate-600 block">وزن هر کارتن / کیسه (کیلوگرم):</label>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={weightPerCartonKg === 0 ? "" : weightPerCartonKg}
                          onChange={e => {
                            const clean = toEnglishNum(e.target.value).replace(/[^0-9.]/g, '');
                            setWeightPerCartonKg(clean === "" ? 0 : parseFloat(clean));
                          }}
                          placeholder="مثلاً ۲۰"
                          className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-xl text-xs font-mono font-bold text-indigo-950 text-left"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1 md:col-span-3">
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-[11px] font-black text-slate-500 block">تصویر محصول:</label>
                      <div className="flex gap-2">
                        <label className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg hover transition-all flex items-center gap-1.5 cursor-pointer">
                          <Upload size={12} />
                          آپلود فایل مستقیم
                          <input 
                            type="file" 
                            className="hidden" 
                            accept="image/*"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setLoading(true);
                                const result = await uploadToParsPackStorage(file, "products");
                                setLoading(false);
                                if (result.success && result.url) {
                                  setImageUrl(result.url);
                                  setSuccessMsg("تصویر با موفقیت در باکت پارس‌پک ذخیره شد.");
                                  setTimeout(() => setSuccessMsg(null), 3000);
                                } else {
                                  setErrorMsg(result.error || "خطا در آپلود عکس به باکت پارس‌پک");
                                }
                              }
                            }}
                          />
                        </label>
                        <button 
                          type="button"
                          onClick={() => setShowGallery(!showGallery)}
                          className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg hover transition-all flex items-center gap-1.5"
                        >
                          <Image size={12} />
                          {showGallery ? "بستن گالری" : "انتخاب از گالری تصاویر"}
                        </button>
                      </div>
                    </div>
                    <input
                      type="text"
                      required
                      value={imageUrl}
                      onChange={e => setImageUrl(e.target.value)}
                      placeholder="لینک مستقیم عکس محصول یا انتخاب فایل..."
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-2xl focus focus transition-all text-xs font-mono font-bold text-slate-800 text-left"
                    />
                    
                    <AnimatePresence>
                      {showGallery && (
                        <motion.div 
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="mt-3 p-4 bg-slate-50 border border-slate-200 rounded-2xl"
                        >
                          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                            {galleryImages.length > 0 ? (
                              galleryImages.map((img, idx) => (
                                <div 
                                  key={`gallery-${idx}`}
                                  onClick={() => { setImageUrl(img); setShowGallery(false); }}
                                  className="aspect-square rounded-xl overflow-hidden border-2 border-white shadow-sm hover cursor-pointer transition-all hover:scale-105"
                                >
                                  <img src={img} className="w-full h-full object-cover" alt="Gallery" />
                                </div>
                              ))
                            ) : (
                              <div className="col-span-full py-6 text-center">
                                <p className="text-[10px] text-slate-400 font-bold">هنوز تصویری در گالری ذخیره نشده است. با ثبت اولین محصولات، تصاویر آن‌ها به اینجا اضافه می‌شوند.</p>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="space-y-1 md:col-span-3">
                    <label className="text-[11px] font-black text-slate-500 block">مزایای تجاری کالا برای بنکداران:</label>
                    <textarea
                      rows={3}
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-2xl focus focus transition-all text-xs font-black text-slate-800 text-right"
                    />
                  </div>

                  <div className="md:col-span-3 flex justify-end gap-3 pt-4 border-t border-gray-100">
                    <button type="button" onClick={handleResetForm} className="px-5 py-2 bg-slate-150 hover text-slate-600 font-black text-xs rounded-xl cursor-pointer">انصراف</button>
                    <button type="submit" className="px-6 py-2 bg-emerald-600 hover text-white font-black text-xs rounded-xl cursor-pointer">ثبت و بروزرسانی</button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Catalog active view list */}
          <div className="bg-white rounded-[2rem] border border-gray-100 shadow-md p-6 overflow-hidden">
            <h3 className="text-sm sm font-black text-slate-900 mb-6 flex items-center gap-2">
              <Layers size={16} className="text-indigo-600" />
              کاتالوگ کالاهای تجاری عضو سامانه ({toPersianNum(products.length)} کالا)
            </h3>

            {/* Grid display table / Cards for mobile */}
            <div className="block lg:hidden space-y-4">
              {products.length === 0 ? (
                <div className="p-8 text-center text-slate-500 font-bold text-sm bg-slate-50 rounded-3xl">
                  هیچ کالایی یافت نشد.
                </div>
              ) : (
                products.map((p, idx) => (
                  <div 
                    key={`products-card-${p.id}-${idx}`}
                    className={`bg-white border rounded-3xl p-5 shadow-sm transition-all ${
                      selectedProductIds.includes(p.id) ? "border-emerald-500 bg-emerald-50/10" : "border-slate-100"
                    } ${p.disabled ? "opacity-60 grayscale" : ""}`}
                  >
                    <div className="flex gap-4 mb-4">
                      <div className="relative">
                        {p.image_url ? (
                          <img 
                            src={getDisplayImageUrl(p.image_url)} 
                            alt={p.name} 
                            className="w-20 h-20 rounded-2xl object-cover border border-slate-100 shadow-sm" 
                            referrerPolicy="no-referrer" 
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                          />
                        ) : (
                          <div className="w-20 h-20 rounded-2xl bg-slate-100 border border-slate-200/80 flex items-center justify-center text-[10px] font-black text-slate-400">
                            بدون تصویر
                          </div>
                        )}
                        <input 
                          type="checkbox" 
                          checked={selectedProductIds.includes(p.id)} 
                          onChange={() => handleToggleSelectProduct(p.id)}
                          className="absolute -top-2 -right-2 w-6 h-6 rounded-full border-slate-300 text-emerald-600 focus shadow-md bg-white"
                        />
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-1.5">
                            {p.isFavorite && <Sparkles className="text-amber-500" size={10} />}
                            <h4 className="text-sm font-black text-slate-900 leading-tight">{p.name}</h4>
                            {p.badge && (
                              <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-600 rounded text-[8px] font-black">{p.badge}</span>
                            )}
                          </div>
                          {p.disabled ? (
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-lg text-[8px] font-black">غیرفعال</span>
                          ) : (
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-lg text-[8px] font-black">فعال</span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 font-bold">{p.brand} • {p.category}</p>
                        <div className="pt-2 grid grid-cols-2 gap-x-4 gap-y-1">
                          <p className="text-[10px] font-black text-emerald-600">
                            فروش: {toPersianNum(p.bulk_price.toLocaleString())}
                          </p>
                          <p className="text-[10px] font-black text-indigo-600">
                            کارتن: {toPersianNum((p.bulk_price * p.carton_pack_count).toLocaleString())}
                          </p>
                          <p className="text-[9px] text-slate-400 font-bold">خرید: {toPersianNum((p.purchase_price || 0).toLocaleString())}</p>
                          <p className="text-[9px] text-slate-400 font-bold">موجودی: {toPersianNum(p.stock_quantity_cartons)} ک</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                      <div className="flex flex-wrap items-center gap-2">
                        <button 
                          onClick={() => onUpdateProduct(p.id, { isFeatured: !p.isFeatured })}
                          className={`px-2 py-1.5 rounded-xl text-[10px] font-black transition-all border ${
                            p.isFeatured 
                              ? "bg-rose-50 text-rose-600 border-rose-100" 
                              : "bg-slate-50 text-slate-400 border-slate-100"
                          }`}
                        >
                          {p.isFeatured ? "🌟 ویژه" : "⭐ عادی"}
                        </button>

                        <button 
                          onClick={() => handleToggleKafBazaar(p)}
                          className={`px-2 py-1.5 rounded-xl text-[10px] font-black transition-all border ${
                            p.isKafBazaar 
                              ? "bg-amber-50 text-amber-700 border-amber-200" 
                              : "bg-slate-50 text-slate-400 border-slate-100"
                          }`}
                          title="تغییر وضعیت کف بازار"
                        >
                          {p.isKafBazaar ? "📉 کف بازار" : "▫️ بازار"}
                        </button>

                        <button 
                          onClick={() => onUpdateProduct(p.id, { disabled: !p.disabled })}
                          className={`px-2 py-1.5 rounded-xl text-[10px] font-black transition-all border ${
                            p.disabled 
                              ? "bg-rose-50 text-rose-700 border-rose-200" 
                              : "bg-emerald-50 text-emerald-700 border-emerald-200"
                          }`}
                          title="فعال/غیرفعال کردن"
                        >
                          {p.disabled ? "🚫 غیرفعال" : "✅ فعال"}
                        </button>

                        <button 
                          onClick={() => onUpdateProduct(p.id, { chequeAllowed: p.chequeAllowed !== false ? false : true })}
                          className={`px-2 py-1.5 rounded-xl text-[10px] font-black transition-all border ${
                            p.chequeAllowed !== false 
                              ? "bg-indigo-50 text-indigo-700 border-indigo-200" 
                              : "bg-slate-50 text-slate-400 border-slate-100"
                          }`}
                          title="تغییر وضعیت امکان تسویه چکی"
                        >
                          {p.chequeAllowed !== false ? "✍️ چکی: بله" : "🚫 چکی: خیر"}
                        </button>

                        <div className="flex items-center bg-slate-50 rounded-xl border border-slate-100 p-0.5">
                          <button 
                            onClick={() => onUpdateProduct(p.id, { bulk_price: Math.max(0, Math.round(p.bulk_price * 0.95)) })}
                            className="w-8 h-8 flex items-center justify-center text-rose-600 text-[10px] font-black"
                          >
                            -۵٪
                          </button>
                          <div className="w-px h-4 bg-slate-200" />
                          <button 
                            onClick={() => onUpdateProduct(p.id, { bulk_price: Math.round(p.bulk_price * 1.05) })}
                            className="w-8 h-8 flex items-center justify-center text-emerald-600 text-[10px] font-black"
                          >
                            +۵٪
                          </button>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 shrink-0">
                        <button onClick={() => handleEditClick(p)} className="p-2.5 bg-slate-50 text-slate-500 hover rounded-xl transition-all">
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => handleDeleteClick(p.id)} className="p-2.5 bg-slate-50 text-rose-500 hover rounded-xl transition-all">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 text-[11px] font-black pb-3">
                    <th className="py-2.5 px-4 text-center">
                      <input 
                        type="checkbox" 
                        checked={selectedProductIds.length === products.length} 
                        onChange={handleToggleSelectAll}
                        className="rounded border-slate-300 text-emerald-600 focus"
                      />
                    </th>
                    <th className="py-2.5 px-4">تصویر</th>
                    <th className="py-2.5 px-4">مشخصات کالا و برند</th>
                    <th className="py-2.5 px-4">وضعیت</th>
                    <th className="py-2.5 px-4 text-center">خرید</th>
                    <th className="py-2.5 px-4 text-center">مصوب</th>
                    <th className="py-2.5 px-4 text-center">فروش</th>
                    <th className="py-2.5 px-4 text-center">قیمت کارتن</th>
                    <th className="py-2.5 px-4 text-center">مصرف‌کننده</th>
                    <th className="py-2.5 px-4 text-center">موجودی انبار</th>
                    <th className="py-2.5 px-4 text-center">عملیات</th>
                  </tr>
                </thead>
                <tbody>
                  {products.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-500 font-bold text-sm">
                        هیچ کالایی یافت نشد. می‌توانید با استفاده از بخش درون‌ریزی، کالاها را وارد کنید یا اولین محصول خود را ثبت نمایید.
                      </td>
                    </tr>
                  ) : (
                    products.map((p, idx) => (
                      <tr 
                        key={`products-admin-${p.id}-${idx}`} 
                        className={`border-b border-slate-50 hover text-xs font-bold transition-colors ${
                          selectedProductIds.includes(p.id) ? "bg-blue-50/30" : ""
                        } ${p.disabled ? "opacity-60 bg-slate-50/50" : "text-slate-800"}`}
                      >
                        <td className="py-3 px-4 text-center">
                          <input 
                            type="checkbox" 
                            checked={selectedProductIds.includes(p.id)} 
                            onChange={() => handleToggleSelectProduct(p.id)}
                            className="rounded border-slate-300 text-emerald-600 focus"
                          />
                        </td>
                        <td className="py-3 px-4">
                          {p.image_url ? (
                            <img 
                              src={getDisplayImageUrl(p.image_url)} 
                              alt={p.name} 
                              className="w-9 h-9 rounded-lg object-cover border border-slate-100 shadow-sm" 
                              referrerPolicy="no-referrer" 
                              onError={(e) => { e.currentTarget.style.display = 'none'; }}
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-[8px] font-bold text-slate-400">
                              بدون تصویر
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            {p.isFavorite && <Sparkles className="text-amber-500" size={10} />}
                            <div className="font-black text-slate-900">{p.name}</div>
                            {p.badge && (
                              <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-600 rounded text-[8px] font-black">{p.badge}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[9px] text-slate-400 font-black">{p.brand}</span>
                            <span className="text-[9px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">{p.category}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {p.disabled ? (
                            <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-lg text-[9px] font-black">غیرفعال</span>
                          ) : (
                            <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-[9px] font-black">فعال</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center font-mono">
                          <div className="text-[10px] text-slate-500">{(p.purchase_price || 0).toLocaleString()}</div>
                        </td>
                        <td className="py-3 px-4 text-center font-mono">
                          <div className="text-[10px] text-slate-500">{(p.price || 0).toLocaleString()}</div>
                        </td>
                        <td className="py-3 px-4 text-center font-mono">
                          <div className="font-black text-emerald-600">{(p.bulk_price || 0).toLocaleString()}</div>
                        </td>
                        <td className="py-3 px-4 text-center font-mono">
                          <div className="font-black text-indigo-600">{(p.bulk_price * p.carton_pack_count).toLocaleString()}</div>
                        </td>
                        <td className="py-3 px-4 text-center font-mono">
                          <div className="text-[10px] text-slate-500">{(p.consumer_price || (p.bulk_price * 1.3)).toLocaleString()}</div>
                        </td>
                        <td className="py-3 px-4 text-center font-mono text-slate-800">
                          <span className={p.stock_quantity_cartons < 10 ? "text-rose-600" : ""}>
                            {toPersianNum(p.stock_quantity_cartons)} کارتن
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex flex-col items-center gap-1.5">
                             {/* Special Offer Toggle */}
                            <div className="flex flex-col gap-1 w-full">
                              <button 
                                onClick={() => onUpdateProduct(p.id, { isFeatured: !p.isFeatured })}
                                className={`px-2 py-0.5 rounded-lg text-[8px] font-black transition-all flex items-center justify-center gap-1 cursor-pointer border ${
                                  p.isFeatured 
                                    ? "bg-rose-50 text-rose-600 border-rose-200" 
                                    : "bg-slate-50 text-slate-400 border-slate-200 hover"
                                }`}
                                title="تغییر وضعیت به فروش ویژه"
                              >
                                🌟 {p.isFeatured ? "ویژه" : "عادی"}
                              </button>

                              <button 
                                onClick={() => handleToggleKafBazaar(p)}
                                className={`px-2 py-0.5 rounded-lg text-[8px] font-black transition-all flex items-center justify-center gap-1 cursor-pointer border ${
                                  p.isKafBazaar 
                                    ? "bg-amber-50 text-amber-700 border-amber-200" 
                                    : "bg-slate-50 text-slate-400 border-slate-200 hover"
                                }`}
                                title="تغییر وضعیت به کف بازار"
                              >
                                📉 {p.isKafBazaar ? "کف بازار" : "عادی بازار"}
                              </button>

                              <button 
                                onClick={() => onUpdateProduct(p.id, { disabled: !p.disabled })}
                                className={`px-2 py-0.5 rounded-lg text-[8px] font-black transition-all flex items-center justify-center gap-1 cursor-pointer border ${
                                  p.disabled 
                                    ? "bg-rose-50 text-rose-700 border-rose-200" 
                                    : "bg-emerald-50 text-emerald-700 border-emerald-200"
                                }`}
                                title="تغییر وضعیت فعال‌سازی"
                              >
                                {p.disabled ? "🚫 غیرفعال" : "✅ فعال"}
                              </button>
                            </div>

                            {/* Price adjustment buttons */}
                            <div className="flex items-center gap-1">
                              <button 
                                onClick={() => onUpdateProduct(p.id, { bulk_price: Math.max(0, Math.round(p.bulk_price * 0.95)) })}
                                className="px-1.5 py-0.5 bg-slate-100 hover text-rose-600 text-[9px] font-black rounded flex items-center justify-center border border-slate-200 cursor-pointer"
                                title="کاهش قیمت ۵٪"
                              >
                                -۵٪
                              </button>
                              <button 
                                onClick={() => onUpdateProduct(p.id, { bulk_price: Math.round(p.bulk_price * 1.05) })}
                                className="px-1.5 py-0.5 bg-slate-100 hover text-emerald-600 text-[9px] font-black rounded flex items-center justify-center border border-slate-200 cursor-pointer"
                                title="افزایش قیمت ۵٪"
                              >
                                +۵٪
                              </button>
                            </div>

                            {/* Standard operations */}
                            <div className="flex items-center gap-1">
                              <button onClick={() => handleEditClick(p)} className="p-1 bg-white border border-slate-100 hover text-slate-600 rounded-lg cursor-pointer transition-all shadow-sm">
                                <Edit2 size={11} />
                              </button>
                              <button onClick={() => handleDeleteClick(p.id)} className="p-1 bg-white border border-slate-100 hover text-rose-500 rounded-lg cursor-pointer transition-all shadow-sm">
                                <Trash2 size={11} />
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      {activeSubTab === 'catalog' && (
        <div className="space-y-6">
          <div className="bg-white rounded-[2rem] border border-gray-100 shadow-xl p-12 text-center space-y-6">
            <div className="w-24 h-24 bg-amber-50 rounded-full flex items-center justify-center mx-auto">
              <ClipboardList size={48} className="text-amber-600" />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900">ساخت کاتالوگ دیجیتال و چاپی</h3>
              <p className="text-xs text-slate-400 font-bold mt-2 max-w-md mx-auto leading-relaxed">
                یک خروجی حرفه‌ای از تمام محصولات فعال در انبار (با آخرین قیمت‌ها و موجودی) برای ارائه به مشتریان و بنکداران همکار ایجاد کنید.
              </p>
            </div>
            
            <div className="flex justify-center gap-4 pt-4">
              <button 
                onClick={() => setShowCatalogPrint(true)}
                className="px-10 py-4 bg-white text-white rounded-2xl font-black text-sm shadow-xl shadow-slate-900/20 hover:scale-[1.02] transition-all flex items-center gap-3"
              >
                <Printer size={18} />
                پیش‌نمایش و چاپ کاتالوگ PDF
              </button>
            </div>

            <div className="pt-8 grid grid-cols-1 md:grid-cols-3 gap-6 text-right">
              <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                <h4 className="text-xs font-black text-slate-800 mb-2">فرمت استاندارد A4</h4>
                <p className="text-[10px] text-slate-400 font-bold">چیدمان بهینه برای چاپ و ارسال در شبکه‌های اجتماعی بصورت عمودی.</p>
              </div>
              <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                <h4 className="text-xs font-black text-slate-800 mb-2">بروزرسانی لحظه‌ای</h4>
                <p className="text-[10px] text-slate-400 font-bold">قیمت‌ها و موجودی کالاها بصورت خودکار از دیتابیس انبار استخراج می‌شود.</p>
              </div>
              <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                <h4 className="text-xs font-black text-slate-800 mb-2">هویت بصری یکپارچه</h4>
                <p className="text-[10px] text-slate-400 font-bold">لوگو، رنگ سازمانی و اطلاعات تماس شما در سربرگ تمام صفحات قرار می‌گیرد.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FULL SCREEN CATALOG PRINT MODAL */}
      <AnimatePresence>
        {showCatalogPrint && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-white overflow-y-auto"
          >
            <div className="sticky top-0 z-10 bg-white text-white p-4 flex justify-between items-center print:hidden">
              <div className="flex items-center gap-4">
                <button onClick={() => setShowCatalogPrint(false)} className="p-2 hover rounded-lg">
                  <ArrowLeft size={20} />
                </button>
                <span className="text-xs font-black">پیش‌نمایش چاپ کاتالوگ</span>
              </div>
              <button 
                onClick={() => window.print()}
                className="px-6 py-2 bg-emerald-600 rounded-xl text-xs font-black flex items-center gap-2"
              >
                <Printer size={16} />
                تایید و پرینت (PDF)
              </button>
            </div>
            <div className="p-4 sm:p-12">
              <CatalogPrintView products={products} config={b2bConfig} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- TAB: PROFILE & SECURITY --- */}
      {activeSubTab === 'profile' && (
        <div className="space-y-6" dir="rtl">
          <div className="bg-white rounded-[2rem] border border-gray-100 shadow-xl p-6 sm:p-10 space-y-8">
            <div className="flex items-center gap-4 pb-6 border-b border-gray-100">
              <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-xl shadow-lg shadow-indigo-600/20">
                مدیر
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">پروفایل کاربری و امنیت مدیریت</h3>
                <p className="text-xs text-slate-400 font-bold mt-1">مشخصات حساب ارشد، رمز عبور و تنظیمات دسترسی سامانه را ویرایش کنید.</p>
              </div>
            </div>

            {/* Profile Info Form */}
            <form onSubmit={(e) => { e.preventDefault(); setSuccessMsg("اطلاعات پروفایل با موفقیت بروزرسانی شد."); }} className="space-y-6">
              <h4 className="text-sm font-black text-slate-800 flex items-center gap-2">
                👤 مشخصات فردی و ارتباطی
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-600">نام و نام خانوادگی مدیر:</label>
                  <input 
                    type="text" 
                    defaultValue="" 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus focus"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-600">شماره همراه مستقیم:</label>
                  <input 
                    type="text" 
                    defaultValue="" 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 outline-none focus focus"
                    dir="ltr"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-600">پست الکترونیک (ایمیل):</label>
                  <input 
                    type="email" 
                    defaultValue="" 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 outline-none focus focus"
                    dir="ltr"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-600">سطح دسترسی و نقش:</label>
                  <input 
                    type="text" 
                    value="مدیریت کل سیستم (Full Access Administrator)" 
                    disabled 
                    className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-500"
                  />
                </div>
              </div>
              <button 
                type="submit" 
                className="px-6 py-3 bg-indigo-600 hover text-white text-xs font-black rounded-xl shadow-md cursor-pointer transition-all"
              >
                ذخیره تغییرات پروفایل
              </button>
            </form>

            {/* Password Change Form */}
            <form onSubmit={(e) => { e.preventDefault(); setSuccessMsg("کلمه عبور مدیریت با موفقیت تغییر یافت."); }} className="space-y-6 pt-6 border-t border-gray-100">
              <h4 className="text-sm font-black text-slate-800 flex items-center gap-2">
                🔑 تغییر رمز عبور ورود
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-600">رمز عبور فعلی:</label>
                  <input 
                    type="password" 
                    placeholder="••••••••" 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono outline-none focus focus"
                    dir="ltr"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-600">رمز عبور جدید:</label>
                  <input 
                    type="password" 
                    placeholder="••••••••" 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono outline-none focus focus"
                    dir="ltr"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-600">تکرار رمز عبور جدید:</label>
                  <input 
                    type="password" 
                    placeholder="••••••••" 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono outline-none focus focus"
                    dir="ltr"
                  />
                </div>
              </div>
              <button 
                type="submit" 
                className="px-6 py-3 bg-white hover text-white text-xs font-black rounded-xl shadow-md cursor-pointer transition-all"
              >
                تغییر کلمه عبور
              </button>
            </form>
          </div>
        </div>
      )}
      {activeSubTab === 'branding' && (
        <div className="space-y-8">
          <div className="bg-white rounded-[2rem] border border-gray-100 shadow-md p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-2">
              <div className="flex items-center gap-3">
                <Palette className="text-indigo-600" size={20} />
                <div>
                  <h3 className="text-sm sm font-black text-slate-900">تنظیمات تم رنگی و سفارشی‌سازی برندینگ</h3>
                  <p className="text-[10px] text-gray-400 font-bold">رنگ‌های شاخص کل سایت، دکمه‌ها و نشان‌واره را از این بخش مدیریت کنید.</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleBrandingSubmit} className="space-y-8">
            <div className="space-y-4">
              <label className="text-xs font-black text-slate-700 block">انتخاب رنگ اصلی پرتال تجاری (Primary Theme Accent Color):</label>
              
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedColor("emerald")}
                  className={`p-4 rounded-2xl border text-right transition-all cursor-pointer flex flex-col justify-between h-24 ${
                    selectedColor === 'emerald' ? "border-emerald-600 bg-emerald-50/40" : "border-slate-100 hover"
                  }`}
                >
                  <span className="w-5 h-5 bg-emerald-600 rounded-full block shadow-md" />
                  <div>
                    <span className="block text-xs font-black text-slate-900">سبز یشمی لوکس</span>
                    <span className="text-[9px] text-slate-400 font-bold mt-0.5 block">Jade Green (یشمی تیره)</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedColor("teal")}
                  className={`p-4 rounded-2xl border text-right transition-all cursor-pointer flex flex-col justify-between h-24 ${
                    selectedColor === 'teal' ? "border-teal-600 bg-teal-50/40" : "border-slate-100 hover"
                  }`}
                >
                  <span className="w-5 h-5 bg-teal-600 rounded-full block shadow-md" />
                  <div>
                    <span className="block text-xs font-black text-slate-900">سبز آبی متریال</span>
                    <span className="text-[9px] text-slate-400 font-bold mt-0.5 block">Sabz-Abi (سبز آبی خاص)</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedColor("indigo")}
                  className={`p-4 rounded-2xl border text-right transition-all cursor-pointer flex flex-col justify-between h-24 ${
                    selectedColor === 'indigo' ? "border-indigo-600 bg-indigo-50/40" : "border-slate-100 hover"
                  }`}
                >
                  <span className="w-5 h-5 bg-indigo-600 rounded-full block shadow-md" />
                  <div>
                    <span className="block text-xs font-black text-slate-900">نیلی مدرن</span>
                    <span className="text-[9px] text-slate-400 font-bold mt-0.5 block">رنگ استارتاپ‌های پیشرو</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedColor("amber")}
                  className={`p-4 rounded-2xl border text-right transition-all cursor-pointer flex flex-col justify-between h-24 ${
                    selectedColor === 'amber' ? "border-amber-600 bg-amber-50/40" : "border-slate-100 hover"
                  }`}
                >
                  <span className="w-5 h-5 bg-amber-600 rounded-full block shadow-md" />
                  <div>
                    <span className="block text-xs font-black text-slate-900">طلایی کهربایی</span>
                    <span className="text-[9px] text-slate-400 font-bold mt-0.5 block">رنگ طلا و بورس سنتی کالا</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedColor("sky")}
                  className={`p-4 rounded-2xl border text-right transition-all cursor-pointer flex flex-col justify-between h-24 ${
                    selectedColor === 'sky' ? "border-sky-600 bg-sky-50/40" : "border-slate-100 hover"
                  }`}
                >
                  <span className="w-5 h-5 bg-sky-600 rounded-full block shadow-md" />
                  <div>
                    <span className="block text-xs font-black text-slate-900">آبی آسمانی</span>
                    <span className="text-[9px] text-slate-400 font-bold mt-0.5 block">رنگ اعتماد و شفافیت</span>
                  </div>
                </button>
              </div>
            </div>

            <div className="bg-slate-50/60 p-5 rounded-[1.5rem] border border-slate-100/80 space-y-4">
              <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                ✏️ شخصی‌سازی عناوین و هویت بصری پلتفرم
              </h4>
              <p className="text-[10px] text-slate-400 font-bold leading-relaxed">
                این فیلدها مستقیما در سربرگ، کاتالوگ‌های دانلود، فاکتورها و پنل کاربری خریداران قرار می‌گیرند.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-slate-500 block">نام اختصاصی پلتفرم (مثلا: بازرگانی علی):</label>
                  <input
                    type="text"
                    value={customAppName}
                    onChange={(e) => setCustomAppName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-black text-slate-800 text-right"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-slate-500 block">شعار فرعی سامانه:</label>
                  <input
                    type="text"
                    value={customAppSub}
                    onChange={(e) => setCustomAppSub(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 text-right"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2 border-t border-slate-100 pt-4">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-black text-slate-500 block">متن اعلان نوار بالای سایت (Top Announcement Banner):</label>
                    <label className="flex items-center gap-2 text-xs font-black text-indigo-600 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={customShowTopAnnouncement} 
                        onChange={(e) => setCustomShowTopAnnouncement(e.target.checked)}
                        className="w-4 h-4 rounded text-indigo-600 focus"
                      />
                      نمایش اعلان بالای سایت
                    </label>
                  </div>
                  <input
                    type="text"
                    value={customTopAnnouncement}
                    onChange={(e) => setCustomTopAnnouncement(e.target.value)}
                    placeholder="متن اعلان بالای سایت را اینجا بنویسید..."
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 text-right"
                  />
                </div>

                <div className="space-y-4 sm:col-span-2 border-t border-slate-100 pt-4">
                  <h4 className="text-xs font-black text-indigo-700 flex items-center gap-2">
                    <MessageSquare size={14} />
                    تنظیمات جزئیات اعلان (Popup Content):
                  </h4>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-black text-slate-500 block">عنوان پاپ‌آپ اعلان:</label>
                      <input
                        type="text"
                        value={customTopAnnouncementPopupTitle}
                        onChange={(e) => setCustomTopAnnouncementPopupTitle(e.target.value)}
                        placeholder="عنوان پنجره بازشو..."
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 text-right"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-black text-slate-500 block">متن توضیحات کامل اعلان:</label>
                      <textarea
                        value={customTopAnnouncementPopupContent}
                        onChange={(e) => setCustomTopAnnouncementPopupContent(e.target.value)}
                        placeholder="متن کامل توضیحات..."
                        rows={3}
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 text-right min-h-[80px]"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4 sm:col-span-2 border-t border-slate-100 pt-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-indigo-700 flex items-center gap-2">
                      <Layers size={14} />
                      مدیریت اسلایدر هوم‌پیج (Slides):
                    </h4>
                    <button
                      onClick={() => {
                        const newSlide: SlideItem = {
                          id: Math.random().toString(36).substr(2, 9),
                          title: "عنوان اسلاید جدید",
                          subtitle: "توضیحات کوتاه اسلاید را اینجا بنویسید",
                          badge: "ویژه",
                          imageUrl: "https://images.unsplash.com/photo-1511381939415-e44015466834?auto=format&fit=crop&q=80&w=1200",
                          ctaText: "مشاهده محصولات",
                          ctaAction: "order",
                          accentColor: "bg-purple-600"
                        };
                        setCustomSlides([...customSlides, (newSlide as any)]);
                      }}
                      className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-[10px] font-black hover transition-colors flex items-center gap-1.5"
                    >
                      <Plus size={14} />
                      افزودن اسلاید
                    </button>
                  </div>

                  {customSlides.length === 0 ? (
                    <div className="p-8 border-2 border-dashed border-slate-200 rounded-2xl text-center">
                      <p className="text-[11px] font-bold text-slate-400">هیچ اسلایدی تعریف نشده است. از دکمه بالا برای افزودن استفاده کنید.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {customSlides.map((slide, index) => (
                        <div key={`admin-slide-${slide.id || index}`} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl relative group">
                          <button
                            onClick={() => setCustomSlides(customSlides.filter((_, i) => i !== index))}
                            className="absolute top-2 left-2 p-1.5 bg-red-50 text-red-600 rounded-lg hover transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                          >
                            <Trash2 size={14} />
                          </button>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-black text-slate-500">عنوان اصلی اسلاید:</label>
                              <input
                                type="text"
                                value={slide.title}
                                onChange={(e) => {
                                  const updated = [...customSlides];
                                  updated[index].title = e.target.value;
                                  setCustomSlides(updated);
                                }}
                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-[11px] font-bold"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-black text-slate-500">لینک تصویر اسلاید:</label>
                              <input
                                type="text"
                                value={slide.imageUrl}
                                onChange={(e) => {
                                  const updated = [...customSlides];
                                  updated[index].imageUrl = e.target.value;
                                  setCustomSlides(updated);
                                }}
                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-[11px] font-bold"
                              />
                            </div>
                            <div className="space-y-1.5 sm:col-span-2">
                              <label className="text-[10px] font-black text-slate-500">توضیحات فرعی:</label>
                              <input
                                type="text"
                                value={slide.subtitle}
                                onChange={(e) => {
                                  const updated = [...customSlides];
                                  updated[index].subtitle = e.target.value;
                                  setCustomSlides(updated);
                                }}
                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-[11px] font-bold"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-black text-slate-500">متن دکمه (CTA):</label>
                              <input
                                type="text"
                                value={slide.ctaText || ""}
                                onChange={(e) => {
                                  const updated = [...customSlides];
                                  updated[index].ctaText = e.target.value;
                                  setCustomSlides(updated);
                                }}
                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-[11px] font-bold"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-black text-slate-500">نشان (Badge):</label>
                              <input
                                type="text"
                                value={slide.badge || ""}
                                onChange={(e) => {
                                  const updated = [...customSlides];
                                  updated[index].badge = e.target.value;
                                  setCustomSlides(updated);
                                }}
                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-[11px] font-bold"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-[11px] font-black text-slate-500 block">لینک مستقیم کاتالوگ PDF رسمی (جهت دانلود کاربران):</label>
                  <input
                    type="text"
                    value={catalogPdfUrl}
                    onChange={(e) => setCatalogPdfUrl(e.target.value)}
                    placeholder="https://example.com/catalog.pdf"
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono text-left"
                    dir="ltr"
                  />
                </div>

                <div className="space-y-1.5 border-t border-slate-100 pt-4">
                  <label className="text-[11px] font-black text-slate-500 block">تصویر مهر و امضای رسمی (بارگذاری فایل یا URL):</label>
                  <div className="space-y-2">
                    <label className="w-full bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200 text-xs font-black py-2 px-3 rounded-xl cursor-pointer text-center transition-colors flex items-center justify-center gap-1.5 shadow-sm">
                      <Upload size={13} className="text-emerald-600" />
                      <span>بارگذاری فایل مهر/امضا (PNG شفاف)</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              if (event.target?.result) {
                                setOfficialSealUrl(event.target.result as string);
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                    <input
                      type="text"
                      value={officialSealUrl}
                      onChange={(e) => setOfficialSealUrl(e.target.value)}
                      placeholder="https://example.com/seal.png"
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono text-left"
                      dir="ltr"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 sm:col-span-2 border-t border-slate-100 pt-4">
                  <label className="text-[11px] font-black text-slate-500 block">تصویر لوگوی اصلی هدر پلتفرم (بارگذاری فایل یا URL):</label>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <label className="flex-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-black py-2.5 px-3 rounded-xl cursor-pointer text-center transition-colors flex items-center justify-center gap-1.5 shadow-sm">
                        <Upload size={14} className="text-amber-600" />
                        <span>بارگذاری لوگوی جدید از گالری دستگاه</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                if (event.target?.result) {
                                  setCustomLogoUrl(event.target.result as string);
                                }
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>

                      {customLogoUrl && (
                        <div className="h-10 px-3 bg-white rounded-xl border border-slate-200 flex items-center gap-2 shrink-0 shadow-sm">
                          <div className="bg-white p-0.5 rounded-lg border border-slate-100 flex items-center justify-center">
                            <img src={customLogoUrl} alt="Main Logo" className="h-7 w-auto object-contain" />
                          </div>
                          <button
                            type="button"
                            onClick={() => setCustomLogoUrl("")}
                            className="text-rose-500 hover:text-rose-700 text-[10px] font-black cursor-pointer"
                            title="حذف لوگو"
                          >
                            حذف
                          </button>
                        </div>
                      )}
                    </div>

                    <input
                      type="text"
                      value={customLogoUrl}
                      onChange={(e) => setCustomLogoUrl(e.target.value)}
                      placeholder="https://raw.githubusercontent.com/.../dastavval_logo.png"
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono text-left"
                      dir="ltr"
                    />
                  </div>
                </div>

                {/* Mascot Character Avatar */}
                <div className="space-y-2 sm:col-span-2 border-t border-slate-100 pt-4">
                  <label className="text-[11px] font-black text-slate-700 flex items-center justify-between">
                    <span>تصویر کاراکتر دستیار هوشمند (Mascot Avatar):</span>
                    <span className="text-[10px] text-slate-400 font-normal">نمایش در گفتگو و چت هوش مصنوعی</span>
                  </label>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <label className="flex items-center justify-center gap-1.5 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-black cursor-pointer border border-indigo-200 transition-all">
                      <Upload size={14} />
                      <span>بارگذاری کاراکتر از سیستم</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              if (event.target?.result) {
                                setMascotUrl(event.target.result as string);
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>

                    {mascotUrl && (
                      <div className="h-10 px-3 bg-white rounded-xl border border-slate-200 flex items-center gap-2 shrink-0 shadow-sm">
                        <img src={mascotUrl} alt="Mascot" className="h-7 w-7 rounded-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setMascotUrl("")}
                          className="text-rose-500 hover:text-rose-700 text-[10px] font-black cursor-pointer"
                        >
                          حذف
                        </button>
                      </div>
                    )}

                    <input
                      type="text"
                      value={mascotUrl}
                      onChange={(e) => setMascotUrl(e.target.value)}
                      placeholder="/assets/mascot_character.jpg"
                      className="flex-1 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono text-left"
                      dir="ltr"
                    />
                  </div>
                </div>

                {/* Social Media Links Management (مدیریت لینک‌های شبکه‌های اجتماعی) */}
                <div className="sm:col-span-2 border-t border-slate-200 pt-6 mt-4 space-y-4">
                  <div className="flex items-center gap-2 text-purple-700">
                    <Share2 size={20} />
                    <h4 className="font-black text-sm text-slate-800">لینک‌های شبکه‌های اجتماعی رسمی پلتفرم (روبیکا، تلگرام، واتساپ و اینستاگرام)</h4>
                  </div>
                  <p className="text-[11px] text-slate-500 font-bold leading-relaxed">
                    با ثبت این لینک‌ها، دکمه‌های هدایت مستقیم به شبکه‌های اجتماعی پلتفرم در بالای هدر، بخش تماس با ما و منوی کاربری فعال و به‌روز خواهند شد.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Rubika */}
                    <div className="p-4 bg-purple-50/40 border border-purple-100 rounded-2xl space-y-2">
                      <label className="text-[11px] font-black text-purple-900 block">آدرس کانال روبیکا:</label>
                      <input
                        type="url"
                        value={customRubikaUrl}
                        onChange={(e) => setCustomRubikaUrl(e.target.value)}
                        placeholder="https://rubika.ir/dastavval_official"
                        className="w-full px-4 py-2 bg-white border border-purple-200 rounded-xl text-xs font-semibold text-slate-800 text-left"
                        dir="ltr"
                      />
                    </div>

                    {/* Telegram */}
                    <div className="p-4 bg-sky-50/40 border border-sky-100 rounded-2xl space-y-2">
                      <label className="text-[11px] font-black text-sky-900 block">آدرس کانال تلگرام:</label>
                      <input
                        type="url"
                        value={customTelegramUrl}
                        onChange={(e) => setCustomTelegramUrl(e.target.value)}
                        placeholder="https://t.me/dastavval_official"
                        className="w-full px-4 py-2 bg-white border border-sky-200 rounded-xl text-xs font-semibold text-slate-800 text-left"
                        dir="ltr"
                      />
                    </div>

                    {/* WhatsApp */}
                    <div className="p-4 bg-emerald-50/40 border border-emerald-100 rounded-2xl space-y-2">
                      <label className="text-[11px] font-black text-emerald-900 block">لینک گروه/کانال واتساپ:</label>
                      <input
                        type="url"
                        value={customWhatsappUrl}
                        onChange={(e) => setCustomWhatsappUrl(e.target.value)}
                        placeholder="https://chat.whatsapp.com/..."
                        className="w-full px-4 py-2 bg-white border border-emerald-200 rounded-xl text-xs font-semibold text-slate-800 text-left"
                        dir="ltr"
                      />
                    </div>

                    {/* Instagram */}
                    <div className="p-4 bg-pink-50/40 border border-pink-100 rounded-2xl space-y-2">
                      <label className="text-[11px] font-black text-pink-900 block">لینک پیج اینستاگرام:</label>
                      <input
                        type="url"
                        value={customInstagramUrl}
                        onChange={(e) => setCustomInstagramUrl(e.target.value)}
                        placeholder="https://instagram.com/dastavval_official"
                        className="w-full px-4 py-2 bg-white border border-pink-200 rounded-xl text-xs font-semibold text-slate-800 text-left"
                        dir="ltr"
                      />
                    </div>
                  </div>
                </div>

                {/* Trust Symbols & Certificates (نمادهای اعتماد و ساماندهی) */}
                <div className="sm:col-span-2 border-t border-slate-200 pt-6 mt-2 space-y-4">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="text-emerald-600" size={20} />
                    <h4 className="font-black text-sm text-slate-800">مدیریت نمادهای قانونی، تصویر لوگوها و لینک‌های تاییدیه رسمی (ای‌نماد و ساماندهی)</h4>
                  </div>
                  <p className="text-[11px] text-slate-500 font-bold leading-relaxed">
                    می‌توانید تصویر اختصاصی لوگوی ای‌نماد و ساماندهی خود را بارگذاری کنید، آدرس مستقیم صفحه تاییدیه رسمی را وارد نمایید یا قطعه کد اسکریپت را قرار دهید.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* E-Namad Box */}
                    <div className="p-4 bg-emerald-50/50 border border-emerald-200/70 rounded-2xl space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-black text-xs text-emerald-900">۱. نماد اعتماد الکترونیکی (eNamad)</span>
                        <span className="text-[10px] text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md font-mono">enamad.ir</span>
                      </div>

                      {/* Image Upload for eNamad */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-600 block">بارگذاری لوگوی اختصاصی ای‌نماد (تصویر PNG / JPG):</label>
                        <div className="flex items-center gap-2">
                          <label className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[11px] font-black cursor-pointer transition-all shadow-sm">
                            <Upload size={13} />
                            <span>انتخاب عکس ای‌نماد</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onload = (event) => {
                                    if (event.target?.result) {
                                      setEnamadImage(event.target.result as string);
                                    }
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                            />
                          </label>
                          {enamadImage && (
                            <div className="flex items-center gap-2 bg-white px-2 py-1 rounded-lg border border-emerald-200">
                              <img src={enamadImage} alt="eNamad" className="h-6 w-auto object-contain" />
                              <button
                                type="button"
                                onClick={() => setEnamadImage("")}
                                className="text-rose-500 hover:text-rose-700 text-[10px] font-bold"
                              >
                                حذف عکس
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-600">لینک مستقیم هدایت به سایت ای‌نماد (URL):</label>
                        <input
                          type="text"
                          value={enamadUrl}
                          onChange={(e) => setEnamadUrl(e.target.value)}
                          placeholder="https://trustseal.enamad.ir/Verify.aspx?id=..."
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono text-left"
                          dir="ltr"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-600">یا قطعه کد Script / HTML ای‌نماد (اختیاری):</label>
                        <textarea
                          rows={2}
                          value={enamadCode}
                          onChange={(e) => setEnamadCode(e.target.value)}
                          placeholder='<a referrerpolicy="origin" target="_blank" href="https://trustseal.enamad.ir/...">'
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-mono text-left"
                          dir="ltr"
                        />
                      </div>
                    </div>

                    {/* Samandehi Box */}
                    <div className="p-4 bg-indigo-50/50 border border-indigo-200/70 rounded-2xl space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-black text-xs text-indigo-900">۲. نشان ساماندهی رسانه‌های دیجیتال</span>
                        <span className="text-[10px] text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-md font-mono">samandehi.ir</span>
                      </div>

                      {/* Image Upload for Samandehi */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-600 block">بارگذاری لوگوی اختصاصی ساماندهی (تصویر PNG / JPG):</label>
                        <div className="flex items-center gap-2">
                          <label className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[11px] font-black cursor-pointer transition-all shadow-sm">
                            <Upload size={13} />
                            <span>انتخاب عکس ساماندهی</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onload = (event) => {
                                    if (event.target?.result) {
                                      setSamandehiImage(event.target.result as string);
                                    }
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                            />
                          </label>
                          {samandehiImage && (
                            <div className="flex items-center gap-2 bg-white px-2 py-1 rounded-lg border border-indigo-200">
                              <img src={samandehiImage} alt="Samandehi" className="h-6 w-auto object-contain" />
                              <button
                                type="button"
                                onClick={() => setSamandehiImage("")}
                                className="text-rose-500 hover:text-rose-700 text-[10px] font-bold"
                              >
                                حذف عکس
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-600">لینک مستقیم هدایت به سایت ساماندهی (URL):</label>
                        <input
                          type="text"
                          value={samandehiUrl}
                          onChange={(e) => setSamandehiUrl(e.target.value)}
                          placeholder="https://logo.samandehi.ir/Verify.aspx?id=..."
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono text-left"
                          dir="ltr"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-600">یا قطعه کد Script / HTML ساماندهی (اختیاری):</label>
                        <textarea
                          rows={2}
                          value={samandehiCode}
                          onChange={(e) => setSamandehiCode(e.target.value)}
                          placeholder='<img src="https://logo.samandehi.ir/..." id="samandehi" />'
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-mono text-left"
                          dir="ltr"
                        />
                      </div>
                    </div>

                    {/* Trade Union License */}
                    <div className="p-4 bg-amber-50/50 border border-amber-200/70 rounded-2xl space-y-3 md:col-span-2">
                      <span className="font-black text-xs text-amber-900 block">۳. پروانه ثبت قانونی تعاونی / کسب‌وکارهای مجازی:</span>
                      
                      {/* Image Upload for Trade Union */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-600 block">بارگذاری لوگو یا عکس پروانه کسب (تصویر PNG / JPG):</label>
                        <div className="flex items-center gap-2">
                          <label className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-[11px] font-black cursor-pointer transition-all shadow-sm">
                            <Upload size={13} />
                            <span>انتخاب عکس پروانه</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onload = (event) => {
                                    if (event.target?.result) {
                                      setTradeUnionImage(event.target.result as string);
                                    }
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                            />
                          </label>
                          {tradeUnionImage && (
                            <div className="flex items-center gap-2 bg-white px-2 py-1 rounded-lg border border-amber-200">
                              <img src={tradeUnionImage} alt="Trade Union" className="h-6 w-auto object-contain" />
                              <button
                                type="button"
                                onClick={() => setTradeUnionImage("")}
                                className="text-rose-500 hover:text-rose-700 text-[10px] font-bold"
                              >
                                حذف عکس
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-600">کد شناسه ثبت پروانه:</label>
                          <input
                            type="text"
                            value={tradeUnionCode}
                            onChange={(e) => setTradeUnionCode(e.target.value)}
                            placeholder="IR-9044502"
                            className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-left"
                            dir="ltr"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-600">لینک صفحه استعلام پروانه (URL):</label>
                          <input
                            type="text"
                            value={tradeUnionUrl}
                            onChange={(e) => setTradeUnionUrl(e.target.value)}
                            placeholder="https://dastavval.com/license"
                            className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono text-left"
                            dir="ltr"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Badge Visibility Toggles & Custom Badges Manager */}
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-4 md:col-span-2">
                      <h5 className="text-xs font-black text-slate-900">تنظیمات نمایش و افزودن نمادهای دلخواه (۳ عدد در هر ردیف):</h5>
                      
                      {/* Toggles */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <label className="flex items-center gap-2 p-2.5 bg-white border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
                          <input 
                            type="checkbox" 
                            checked={!hideEnamad} 
                            onChange={(e) => setHideEnamad(!e.target.checked)} 
                            className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                          />
                          <span className="text-xs font-bold text-slate-800">نمایش ای‌نماد</span>
                        </label>
                        <label className="flex items-center gap-2 p-2.5 bg-white border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
                          <input 
                            type="checkbox" 
                            checked={!hideSamandehi} 
                            onChange={(e) => setHideSamandehi(!e.target.checked)} 
                            className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                          />
                          <span className="text-xs font-bold text-slate-800">نمایش ساماندهی</span>
                        </label>
                        <label className="flex items-center gap-2 p-2.5 bg-white border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
                          <input 
                            type="checkbox" 
                            checked={!hideTradeUnion} 
                            onChange={(e) => setHideTradeUnion(!e.target.checked)} 
                            className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
                          />
                          <span className="text-xs font-bold text-slate-800">نمایش پروانه کسب</span>
                        </label>
                        <label className="flex items-center gap-2 p-2.5 bg-white border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
                          <input 
                            type="checkbox" 
                            checked={!hideSsl} 
                            onChange={(e) => setHideSsl(!e.target.checked)} 
                            className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                          />
                          <span className="text-xs font-bold text-slate-800">نمایش پرداخت امن</span>
                        </label>
                      </div>

                      {/* Add Custom Badge */}
                      <div className="pt-3 border-t border-slate-200 space-y-3">
                        <span className="text-[11px] font-black text-slate-700 block">افزودن نماد یا گواهی جدید دلخواه:</span>
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                          <input
                            type="text"
                            value={newBadgeTitle}
                            onChange={(e) => setNewBadgeTitle(e.target.value)}
                            placeholder="عنوان نماد (مثلا گواهی ISO)"
                            className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold"
                          />
                          <input
                            type="text"
                            value={newBadgeSubtitle}
                            onChange={(e) => setNewBadgeSubtitle(e.target.value)}
                            placeholder="زیرمتن (مثلا استاندارد مدیریت)"
                            className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold"
                          />
                          <input
                            type="text"
                            value={newBadgeUrl}
                            onChange={(e) => setNewBadgeUrl(e.target.value)}
                            placeholder="لینک استعلام (URL)"
                            className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono text-left"
                            dir="ltr"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (!newBadgeTitle.trim()) return;
                              setCustomBadges([...customBadges, {
                                id: 'badge_' + Date.now(),
                                title: newBadgeTitle.trim(),
                                subtitle: newBadgeSubtitle.trim() || 'تایید شده',
                                url: newBadgeUrl.trim() || '#'
                              }]);
                              setNewBadgeTitle("");
                              setNewBadgeSubtitle("");
                              setNewBadgeUrl("");
                            }}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <span>افزودن به لیست</span>
                          </button>
                        </div>

                        {/* List of Custom Badges */}
                        {customBadges.length > 0 && (
                          <div className="space-y-2 mt-2">
                            {customBadges.map((b, idx) => (
                              <div key={`admin-custom-badge-${b.id || idx}-${idx}`} className="flex items-center justify-between p-2 bg-white border border-slate-200 rounded-xl text-xs">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-slate-800">{b.title}</span>
                                  <span className="text-slate-500 text-[10px]">({b.subtitle})</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setCustomBadges(customBadges.filter((_, i) => i !== idx))}
                                  className="text-rose-600 hover:text-rose-800 text-[11px] font-bold px-2 py-1 bg-rose-50 rounded-lg"
                                >
                                  حذف
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5 sm:col-span-2 border-t border-slate-100 pt-4">
                  <label className="text-[11px] font-black text-slate-500 block">کد مرچنت زرین‌پال (Zarinpal Merchant ID):</label>
                  <input
                    type="text"
                    value={zarinpalMerchantCode}
                    onChange={(e) => setZarinpalMerchantCode(e.target.value)}
                    placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono text-left"
                    dir="ltr"
                  />
                </div>

                <div className="space-y-1.5 border-t border-slate-100 pt-4">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-black text-slate-500 block">آدرس رسمی دفتر مرکزی / کارخانه:</label>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={hideHqAddress} 
                        onChange={(e) => setHideHqAddress(e.target.checked)}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" 
                      />
                      <span className="text-[10px] font-black text-red-600">غیرفعال‌سازی نمایش آدرس</span>
                    </label>
                  </div>
                  <input
                    type="text"
                    value={hqAddress}
                    onChange={(e) => setHqAddress(e.target.value)}
                    disabled={hideHqAddress}
                    placeholder="مثال: آذربایجان شرقی، شبستر، شهرک صنعتی شندآباد"
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 text-right disabled:opacity-50"
                  />
                </div>

                <div className="space-y-1.5 border-t border-slate-100 pt-4">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-black text-slate-500 block">تلفن مستقیم پشتیبانی واحد بازرگانی:</label>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={hideSupportPhone} 
                        onChange={(e) => setHideSupportPhone(e.target.checked)}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" 
                      />
                      <span className="text-[10px] font-black text-red-600">غیرفعال‌سازی نمایش تلفن</span>
                    </label>
                  </div>
                  <input
                    type="text"
                    value={supportPhone}
                    onChange={(e) => setSupportPhone(e.target.value)}
                    disabled={hideSupportPhone}
                    placeholder="مثال: ۰۹۰۴ ۴۵۰ ۲۹۰۰"
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 text-left disabled:opacity-50"
                    dir="ltr"
                  />
                </div>

                <div className="space-y-1.5 border-t border-slate-100 pt-4">
                  <label className="text-[11px] font-black text-slate-500 block">سقف اعتبار خرید کاربران نقره‌ای و طلایی (تومان):</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={buyerCredit === 0 ? "" : buyerCredit}
                    onChange={(e) => {
                      const clean = toEnglishNum(e.target.value).replace(/[^0-9]/g, '');
                      setBuyerCredit(clean === "" ? 0 : Number(clean));
                    }}
                    placeholder="مثال: ۲۵۰۰۰۰۰۰۰"
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 text-left"
                    dir="ltr"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2 border-t border-slate-100 pt-4">
                  <label className="text-[11px] font-black text-slate-500 block">آیین‌نامه، قوانین و نحوه تضمین وجه امانی معاملات (توضیحات مفصل برای تب قوانین):</label>
                  <textarea
                    value={termsAndConditions}
                    onChange={(e) => setTermsAndConditions(e.target.value)}
                    placeholder="متن کامل قوانین، شرایط حمل بار و تسویه حساب امانی دست اول را در اینجا بنویسید..."
                    className="w-full h-32 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 text-right leading-relaxed"
                  />
                </div>
              </div>
            </div>

            {/* B2B Roles, Commissions & Regional Sharing Rules Card */}
            <div className="bg-gradient-to-br from-indigo-50/60 to-purple-50/40 p-6 rounded-[2rem] border border-indigo-100/80 space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/10">
                  <span className="text-white text-lg font-black">%</span>
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900">تنظیمات نرخ‌گذاری نقش‌ها، سود بازاریاب و نماینده منطقه‌ای (B2B Multi-Role Rules)</h4>
                  <p className="text-[10px] text-indigo-600 font-bold">درصد افزایش قیمت، پورسانت‌ها، آستانه خرید نقدی و قوانین سهم سود نمایندگی عاملیت در شهرستان‌ها را تعیین کنید.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Customer Markup Percent */}
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-600 block">درصد افزایش قیمت خریدار خرد/مغازه نسبت به کاتالوگ:</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={customerMarkupPercent}
                      onChange={(e) => setCustomerMarkupPercent(Number(e.target.value))}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 pr-10"
                    />
                    <span className="absolute inset-y-0 right-3 flex items-center text-xs font-black text-slate-400 select-none">%</span>
                  </div>
                  <p className="text-[9px] text-slate-400 font-bold">قیمت خریداران خرد بر اساس کاتالوگ کارخانه به علاوه این درصد محاسبه می‌شود. پیش‌فرض: ۱۰٪</p>
                </div>

                {/* Marketer Commission Percent */}
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-600 block">درصد پورسانت بازاریاب از کل ارزش فاکتور معرفی‌شده:</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={marketerCommissionPercent}
                      onChange={(e) => setMarketerCommissionPercent(Number(e.target.value))}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 pr-10"
                    />
                    <span className="absolute inset-y-0 right-3 flex items-center text-xs font-black text-slate-400 select-none">%</span>
                  </div>
                  <p className="text-[9px] text-slate-400 font-bold">پورسانت نقدی بازاریاب از هر فروشی که به بنکداران و مغازه‌ها معرفی کند. پیش‌فرض: ۵٪</p>
                </div>

                {/* Rep Regional Profit Share Percent */}
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-600 block">درصد سهم سود نماینده از کل سود سفارشات منطقه خود:</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={repRegionalProfitSharePercent}
                      onChange={(e) => setRepRegionalProfitSharePercent(Number(e.target.value))}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 pr-10"
                    />
                    <span className="absolute inset-y-0 right-3 flex items-center text-xs font-black text-slate-400 select-none">%</span>
                  </div>
                  <p className="text-[9px] text-slate-400 font-bold">زمانی که مشتری از شهر تحت پوشش نماینده خرید می‌کند، این درصد از سود سفارش به حساب نماینده منظور می‌شود. پیش‌فرض: ۵۰٪</p>
                </div>

                {/* Rep Floor Sales Threshold */}
                <div className="space-y-2 lg:col-span-2">
                  <label className="text-[11px] font-black text-slate-600 block">حداقل مجموع خرید نقدی تجمعی جهت تایید سطح نمایندگی (تومان):</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={repFloorSalesThreshold.toLocaleString("fa-IR")}
                      onChange={(e) => {
                        const clean = toEnglishNum(e.target.value).replace(/[^0-9]/g, '');
                        setRepFloorSalesThreshold(clean === "" ? 0 : Number(clean));
                      }}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 text-left"
                      dir="ltr"
                    />
                  </div>
                  <p className="text-[9px] text-slate-400 font-bold">حداقل آستانه خرید نقدی اولیه نماینده جهت فعال‌سازی دائمی تخفیف خرید کف نمایندگی کارخانه. پیش‌فرض: ۳۰۰,۰۰۰,۰۰۰ تومان</p>
                </div>

                {/* Require Admin Approval for Rep */}
                <div className="space-y-2 flex flex-col justify-end">
                  <div className="flex items-center gap-2 p-3 bg-white/80 border border-slate-200 rounded-2xl h-11 shrink-0">
                    <input
                      type="checkbox"
                      id="require_admin_approval"
                      checked={requireAdminApprovalForRep}
                      onChange={(e) => setRequireAdminApprovalForRep(e.target.checked)}
                      className="w-4 h-4 text-indigo-600 rounded"
                    />
                    <label htmlFor="require_admin_approval" className="text-xs font-black text-slate-700 cursor-pointer">الزام به تایید ادمین برای فعال‌سازی نمایندگی</label>
                  </div>
                  <p className="text-[9px] text-slate-400 font-bold">فعال‌سازی عاملیت نماینده منوط به ثبت ضمانت‌نامه معتبر (چک صیاد یا ضمانت بانکی) و تایید دستی ادمین خواهد بود.</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-50/60 p-5 rounded-[1.5rem] border border-slate-100/80 space-y-4">
              <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                📥 سیستم واردکننده دسته‌ای کالاها با کدهای JSON
              </h4>
              <p className="text-[10px] text-slate-400 font-bold leading-relaxed">
                آرایه یا آبجکت معتبری از کدهای کالاها را در کارتن وارد کنید تا بصورت لحظه‌ای در خط تولید ثبت شوند.
              </p>
              <textarea
                value={jsonImportText}
                onChange={(e) => setJsonImportText(e.target.value)}
                className="w-full h-28 p-3 bg-white border border-slate-200 rounded-xl text-xs font-mono text-left"
                dir="ltr"
              />
              <button
                type="button"
                onClick={handleJsonGoodsImport}
                className="px-5 py-2.5 bg-indigo-600 hover text-white font-black text-[10px] rounded-lg cursor-pointer transition-all hover:scale-[1.02]"
              >
                تایید و وارد کردن اطلاعات کالاها
              </button>
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-100">
              <button
                type="submit"
                className="px-8 py-3 bg-indigo-600 hover text-white font-black text-xs rounded-xl flex items-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/10"
              >
                <Save size={14} />
                ذخیره نهایی تنظیمات و برندینگ جدید
              </button>
            </div>
          </form>
        </div>

        {/* CATEGORY CRUD SECTION */}
          <div className="bg-white rounded-[2rem] border border-gray-100 shadow-md p-6 sm:p-8 space-y-6 mt-8">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-50 rounded-xl">
                  <Tag className="text-amber-600" size={20} />
                </div>
                <div>
                  <h3 className="text-sm sm font-black text-slate-900">مدیریت گروه‌های کالا (دسته بندی‌ها)</h3>
                  <p className="text-[10px] text-gray-400 font-bold">نام، تصویر و توضیحات دسته‌های کاتالوگ را مدیریت کنید.</p>
                </div>
              </div>
              <button 
                onClick={() => { setShowCategoryForm(!showCategoryForm); setEditingCategoryId(null); }}
                className="flex items-center gap-2 px-5 py-2 bg-emerald-600 text-white rounded-xl text-[10px] font-black shadow-lg shadow-emerald-600/10"
              >
                {showCategoryForm ? "بستن فرم" : "افزودن دسته جدید"}
              </button>
            </div>

            <AnimatePresence>
              {showCategoryForm && (
                <motion.form 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  onSubmit={handleCategorySubmit} 
                  className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-6 rounded-2xl border border-slate-100 overflow-hidden"
                >
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500">نام دسته:</label>
                    <input value={catName} onChange={e => setCatName(e.target.value)} required className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-black" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500">لینک تصویر:</label>
                    <input value={catImage} onChange={e => setCatImage(e.target.value)} placeholder="URL..." className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono" dir="ltr" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500">توضیحات کوتاه:</label>
                    <input value={catDesc} onChange={e => setCatDesc(e.target.value)} className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold" />
                  </div>
                  <div className="md:col-span-3 flex justify-end">
                    <button type="submit" className="px-8 py-2 bg-emerald-600 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-600/10">
                      {editingCategoryId ? "بروزرسانی دسته" : "ذخیره دسته جدید"}
                    </button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
              {((categories && categories.length > 0) ? categories : (b2bConfig.categories && b2bConfig.categories.length > 0) ? b2bConfig.categories : [
                { id: '1', name: "تنقلات و شکلات", imageUrl: "https://images.unsplash.com/photo-1581798459219-318e76aecc7b?w=200" },
                { id: '2', name: "کیک، کلوچه و بیسکویت", imageUrl: "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=200" }
              ]).map((cat: any, idx: number) => {
                const safeCatKey = (cat && typeof cat === 'object') ? (cat.id || cat.name || idx) : `${cat}-${idx}`;
                return (
                <div key={`admin-cat-card-${safeCatKey}-${idx}`} className="group relative bg-white border border-slate-100 rounded-2xl overflow-hidden hover transition-all">
                  <div className="aspect-square bg-slate-100 relative">
                    <img src={cat.imageUrl || "https://images.unsplash.com/photo-1581798459219-318e76aecc7b?w=200"} alt={cat.name} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-white/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button 
                        onClick={() => {
                          setEditingCategoryId(cat.id);
                          setCatName(cat.name);
                          setCatImage(cat.imageUrl || "");
                          setCatDesc(cat.description || "");
                          setShowCategoryForm(true);
                        }}
                        className="p-2 bg-white rounded-lg text-slate-900 hover"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button 
                        onClick={() => {
                          confirmAction(
                            "حذف دسته‌بندی",
                            "حذف شود؟",
                            async () => {
                              const updated = categories.filter((c: any) => c.id !== cat.id);
                              setCategories(updated);
                              await onUpdateB2bConfig({ ...b2bConfig, categories: updated });
                            }
                          );
                        }}
                        className="p-2 bg-white rounded-lg text-rose-600 hover"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="p-3 text-center">
                    <p className="text-[10px] font-black text-slate-900">{cat.name}</p>
                  </div>
                </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
{/* --- TAB: FACTORY MANAGEMENT --- */}
            {(activeSubTab === 'vip-wallet' as any) && (
        <div className="bg-white p-12 rounded-[3rem] border border-slate-100 shadow-xl text-center">
          <CreditCard size={64} className="mx-auto text-indigo-200 mb-6" />
          <h3 className="text-xl font-black text-slate-900">مدیریت کیف پول VIP و اعتبار بنکداری</h3>
          <p className="text-sm text-slate-400 font-bold mt-4 max-w-md mx-auto">بزودی ابزارهای مدیریت خط اعتباری و تسویه حساب‌های عمده در این بخش فعال خواهد شد.</p>
        </div>
      )}
      {(activeSubTab === 'ai-marketing' as any) && (
        <div className="bg-white p-12 rounded-[3rem] border border-slate-100 shadow-xl text-center">
          <Bot size={64} className="mx-auto text-indigo-200 mb-6" />
          <h3 className="text-xl font-black text-slate-900">بازاریابی هوشمند (AI Marketing)</h3>
          <p className="text-sm text-slate-400 font-bold mt-4 max-w-md mx-auto">هسته هوش مصنوعی در حال یادگیری الگوهای خرید مشتریان شماست تا بهترین پیشنهادهای فروش را به صورت خودکار ارسال کند.</p>
        </div>
      )}
      {(activeSubTab === 'pages' as any) && (
        <div className="bg-white p-12 rounded-[3rem] border border-slate-100 shadow-xl text-center">
          <FileText size={64} className="mx-auto text-indigo-200 mb-6" />
          <h3 className="text-xl font-black text-slate-900">مدیریت صفحات ثابت و محتوا</h3>
          <p className="text-sm text-slate-400 font-bold mt-4 max-w-md mx-auto">امکان ویرایش صفحات «درباره ما»، «قوانین» و سایر صفحات اطلاع‌رسانی بزودی اضافه می‌شود.</p>
        </div>
      )}
      {activeSubTab === 'factories' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
            <div className="space-y-1 text-right">
              <h3 className="text-lg font-black text-slate-800">بانک اطلاعاتی کارخانجات و برندها</h3>
              <p className="text-[11px] text-slate-400 font-bold">مدیریت پروفایل‌های تولیدکننده، عکس‌های گالری و اطلاعات رسمی خطوط تولید</p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <button 
                type="button"
                disabled={loading}
                onClick={async () => {
                  setLoading(true);
                  setSuccessMsg(null);
                  setErrorMsg(null);
                  try {
                    const res = await fetch("/api/ai/factory-batch-fill", { method: "POST" });
                    const data = await res.json();
                    if (data.success) {
                      setFactories(data.factories || []);
                      if (onUpdateB2bConfig) {
                        onUpdateB2bConfig({ ...b2bConfig, factories: data.factories });
                      }
                      setSuccessMsg(`تعداد ${data.count || 0} کارخانه با اطلاعات و بیوگرافی هوشمند (GapGPT / Gemini) تکمیل و بروزرسانی شدند.`);
                      setTimeout(() => setSuccessMsg(null), 4000);
                    }
                  } catch (e: any) {
                    setErrorMsg("خطا در تکمیل هوشمند کارخانه‌ها: " + e.message);
                  } finally {
                    setLoading(false);
                  }
                }}
                className="px-5 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-2xl font-black text-xs flex items-center gap-2 transition-all shadow-lg shadow-purple-600/20 cursor-pointer"
              >
                <Sparkles size={16} />
                <span>پر کردن هوشمند تمام کارخانه‌ها با هوش مصنوعی (GapGPT)</span>
              </button>

              <button 
                onClick={handleAddFactoryClick}
                className="px-6 py-3 bg-emerald-600 text-white rounded-2xl font-black text-xs flex items-center gap-2 hover transition-all shadow-lg shadow-emerald-600/10 cursor-pointer"
              >
                <Plus size={16} />
                ثبت کارخانه / برند جدید
              </button>
            </div>
          </div>

          <AnimatePresence>
            {showFactoryForm && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-[2.5rem] border-2 border-emerald-500/20 p-8 shadow-2xl relative overflow-hidden text-right"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl -mr-10 -mt-10" />
                
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 border-b border-slate-100 pb-4">
                  <h4 className="text-base font-black text-slate-800 flex items-center gap-2">
                    {isEditingFactory ? "ویرایش اطلاعات کارخانه" : "ثبت پروفایل کارخانه جدید"}
                    <Building2 className="text-emerald-600" size={20} />
                  </h4>

                  <button
                    type="button"
                    disabled={aiFactoryLoading}
                    onClick={async () => {
                      if (!factoryName) {
                        alert("لطفاً ابتدا نام کارخانه را وارد کنید.");
                        return;
                      }
                      setAiFactoryLoading(true);
                      try {
                        const res = await fetch("/api/ai/factory-describe", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            name: factoryName,
                            category: factoryCategory,
                            city: factoryLocation,
                            establishedYear: factoryYear
                          })
                        });
                        const data = await res.json();
                        if (data.success) {
                          if (data.description) setFactoryDesc(data.description);
                          setSuccessMsg("توضیحات و مشخصات کارخانه با هوش مصنوعی با موفقیت تولید شد!");
                          setTimeout(() => setSuccessMsg(null), 3000);
                        }
                      } catch (e) {
                        console.error(e);
                      } finally {
                        setAiFactoryLoading(false);
                      }
                    }}
                    className="px-4 py-2 bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 font-black text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                  >
                    {aiFactoryLoading ? <RefreshCw className="animate-spin" size={14} /> : <Sparkles size={14} className="text-purple-600" />}
                    <span>تکمیل هوشمند این کارخانه با هوش مصنوعی (GapGPT)</span>
                  </button>
                </div>

                <form onSubmit={handleFactorySubmit} className="space-y-6 relative z-10">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-black text-slate-500 block">نام کارخانه / برند:</label>
                      <input 
                        type="text"
                        required
                        value={factoryName}
                        onChange={e => setFactoryName(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-black text-slate-500 block">دسته‌بندی صنعت:</label>
                      <select
                        value={factoryCategory}
                        onChange={e => setFactoryCategory(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                      >
                        {(() => {
                          const cats = (b2bConfig?.categories && b2bConfig.categories.length > 0)
                            ? b2bConfig.categories.map((c: any) => typeof c === 'string' ? c : (c.name || c.id))
                            : Array.from(new Set(factories.map((f: any) => f.category).filter(Boolean)));
                          if (!cats.includes("سایر صنایع")) cats.push("سایر صنایع");
                          return cats.map((catName: string, i: number) => (
                            <option key={`admin-panel-cat-opt-${catName}-${i}`} value={catName}>{catName}</option>
                          ));
                        })()}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-black text-slate-500 block">لینک لوگو (URL):</label>
                      <input 
                        type="text"
                        required
                        value={factoryLogo}
                        onChange={e => setFactoryLogo(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                        dir="ltr"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-black text-slate-500 block">تصویر کاور/بنر کارخانه (URL):</label>
                      <div className="flex gap-2">
                        <input 
                          type="text"
                          value={factoryCover}
                          onChange={e => setFactoryCover(e.target.value)}
                          placeholder="https://images.unsplash.com/photo-..."
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                          dir="ltr"
                        />
                        <button
                          type="button"
                          onClick={() => setFactoryCover("https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=1200&q=80")}
                          className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-black rounded-xl shrink-0 cursor-pointer"
                        >
                          پیش‌فرض
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-black text-slate-500 block">موقعیت جغرافیایی:</label>
                      <input 
                        type="text"
                        value={factoryLocation}
                        onChange={e => setFactoryLocation(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-black text-slate-500 block">سال تاسیس:</label>
                      <input 
                        type="number"
                        value={factoryYear}
                        onChange={e => setFactoryYear(Number(e.target.value))}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-black text-slate-500 block">امتیاز کیفی (۱ تا ۵):</label>
                      <input 
                        type="number"
                        step="0.1"
                        min="1"
                        max="5"
                        value={factoryRating}
                        onChange={e => setFactoryRating(Number(e.target.value))}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-black text-slate-500 block">تلفن تماس مستقیم (ویژه ادمین - مخفی از خریدار):</label>
                      <input 
                        type="text"
                        value={factoryPhone}
                        onChange={e => setFactoryPhone(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold font-mono"
                        placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                        dir="ltr"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-black text-slate-500 block">وضعیت فعالیت کارخانه:</label>
                      <select
                        value={factoryIsActive ? "active" : "inactive"}
                        onChange={e => setFactoryIsActive(e.target.value === "active")}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                      >
                        <option value="active">فعال و در دسترس خریداران</option>
                        <option value="inactive">غیرفعال‌سازی موقت</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-black text-slate-500 block">جایگاه ویژه / سنجاق بالادست:</label>
                      <select
                        value={factoryIsFeatured ? "featured" : "normal"}
                        onChange={e => setFactoryIsFeatured(e.target.value === "featured")}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                      >
                        <option value="normal">عادی</option>
                        <option value="featured">⭐ ویژه و سنجاق در ابتدای لیست</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-black text-slate-500 block">کد شناسایی کارخانه:</label>
                      <input 
                        type="text"
                        value={factoryCode}
                        onChange={e => setFactoryCode(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-mono"
                        dir="ltr"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black text-slate-500 block">توضیحات و بیوگرافی کامل کارخانه:</label>
                    <textarea 
                      rows={4}
                      value={factoryDesc}
                      onChange={e => setFactoryDesc(e.target.value)}
                      placeholder="متن کامل درباره امکانات، خطوط تولید و استانداردهای کارخانه..."
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold leading-relaxed"
                    />
                  </div>

                  {/* Gallery Photos Management */}
                  <div className="border-t border-slate-100 pt-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-black text-slate-700 block">گالری تصاویر و خطوط تولید کارخانه:</label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const sampleImages = [
                              { url: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=800&q=80", title: "خط تولید و بسته‌بندی اتوماتیک", category: "production" as const },
                              { url: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80", title: "دستگاه‌های مدرن آلمانی", category: "machinery" as const },
                              { url: "https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=800&q=80", title: "انبار مکانیزه مواد اولیه و کالا", category: "warehouse" as const },
                              { url: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80", title: "آزمایشگاه تخصصی کنترل کیفیت", category: "lab" as const }
                            ];
                            setFactoryGalleryImages(sampleImages);
                          }}
                          className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[10px] font-black rounded-xl border border-emerald-200 cursor-pointer"
                        >
                          + بارگذاری تصاویر پیشنهادی صنعت
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2">
                      <input 
                        type="text"
                        placeholder="لینک تصویر (URL)"
                        value={newGalleryUrl}
                        onChange={e => setNewGalleryUrl(e.target.value)}
                        className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                        dir="ltr"
                      />
                      <input 
                        type="text"
                        placeholder="عنوان عکس (مثال: سالن تولید)"
                        value={newGalleryTitle}
                        onChange={e => setNewGalleryTitle(e.target.value)}
                        className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                      />
                      <select
                        value={newGalleryCategory}
                        onChange={e => setNewGalleryCategory(e.target.value as any)}
                        className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                      >
                        <option value="production">خط تولید</option>
                        <option value="machinery">ماشین‌آلات</option>
                        <option value="warehouse">انبار</option>
                        <option value="lab">آزمایشگاه</option>
                        <option value="exterior">نمای بیرونی</option>
                      </select>
                      <button 
                        type="button"
                        onClick={() => {
                          if (!newGalleryUrl) {
                            alert("لطفا لینک تصویر را وارد کنید.");
                            return;
                          }
                          setFactoryGalleryImages(prev => [
                            ...prev, 
                            { url: newGalleryUrl, title: newGalleryTitle || "تصویر کارخانه", category: newGalleryCategory }
                          ]);
                          setNewGalleryUrl("");
                          setNewGalleryTitle("");
                        }}
                        className="px-4 py-2 bg-slate-100 text-slate-900 rounded-xl text-xs font-black hover:bg-slate-200 transition-all cursor-pointer border border-slate-200"
                      >
                        + افزودن عکس
                      </button>
                    </div>

                    {factoryGalleryImages.length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                        {factoryGalleryImages.map((img, idx) => (
                          <div key={`admin-panel-gallery-${img.url || idx}-${idx}`} className="relative group bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 h-28">
                            <img src={img.url} alt={img.title} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-white/60 opacity-0 group-hover:opacity-100 transition-opacity p-2 flex flex-col justify-between text-slate-900 backdrop-blur-xs">
                              <span className="text-[10px] font-black truncate">{img.title}</span>
                              <button
                                type="button"
                                onClick={() => setFactoryGalleryImages(prev => prev.filter((_, i) => i !== idx))}
                                className="self-end p-1 bg-red-600 rounded-lg text-white text-[10px] font-black cursor-pointer"
                              >
                                حذف
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="space-y-4 border-t border-slate-100 pt-6">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-[11px] font-black text-slate-500">حالت طراحی صفحه اخ�x��[[o�F~ﯘE-wCɲ��U$��A$A�i��`C�#�o )_V�b;�z�����ŉ���[�Ce���O�s����)��6+ 5�g�9�w.39������}r�.^�G��dw��j�mc���i�=��e׽%�S��t�tU��e�J��%bK�XCS����Wx�Pݡ�Y&�>!޶�����u]�=茪���F\�]�{��l�v����/����MK��W3l�.,����7�ooI��ޖ��tY�J<��IwK��=ҷLO��r���t5O�LI�u��ϙ�t:$���,�7�G���AYW�+ Pw +֦��E��@�ͥ���}�B��'�����?$�+P��d�T'�������y����E���J~k�����Q�7���t����Czq�m������	��X�񪙺fRb�R�B�,$����!��W_߼Q_�s��"`��V�����#R-�_�-���f �����Lҗ�������eH�eK�D:23���%��ޣ:�B��Գt(�PZ���D�miU0�`��~�S��T������V�8����ԣ�G6�F��� � \��
���k����ϴΦZ����P��ñ6���S�gC4v"�Z��e|�zQ?���l�Е&�i6D��`�*�j�%B^j�KW�ө���j�Z 	I�'��M�?~��me柛KI��	h�k9��+|n�g><���bX�Et*+��J��-�MN�`=�爟ґ0*a��� N}O���D�p.p�zl�)�����U�0�����gDϻ�9���N��lO��)	� :+b����������I@�g���Ӛn�ՅpXr[V)�aA�a�U�����Z�~ʠG��9�a�e��L/��6rV""I->@?��
#�c�/<��';����C2�O0�����d��?D�H�wJA�_`�'�����TI���k���;&!0�ϧ��f���k�uޝ�4���{$xu~�^1��?b�ß��l���E?�����b��[��5��A��c���?�>99FEL!��#��(��� �]�xKHp��V@jI:���{�Kbة,���f��8���/�x˝E.g��dT���˞뒛�	��;���"���kt)�
�%W��j�t�L���;�-�%��1����!��"�!b�(pę�����`�-v�Ȣ�.�5�z|T�p�|�����O0yƓ�u�*�;��J߁�#`�7�(&����"��!�L��	J����8���Y>H�\j��tn(��u����'�'��ߠ>F���?ܘG5�8��H3�������-����+�떫�j�#A���I�R/��Cr)��E���:u�*���op�Z��a��b�y�1�ю!FI.�w*�W�Y���)zF��b�ЧTm�n���B��ח!�5A$-��e2t�x#���	��e��x}�>?.���G��L;(�s������(I��{Cǵɶ4�3yf��G~1i��ST/S䎔^ө�z�F��kg���\���e*��Ff.�lW�=ٻL4e���7�����辬�)ٲIu	�K��K��f����Є_�Ǚ �[����ԥ�&�f�tgJ�Ň13ɣ�FST�gs/���O�],�pw�2���Z_�ai��A֬�F.u:L�t��$0��_���PM����0�d�2���Z�)��B����QA=�h#�=��FqH�	�@UXL��A�n���ܮ��R�O�0.ӫ�.~�oC�6'pLM%��V	7��%:Bx��e�w�f�k�cT����O&�Lbڈ�֚6-G�,fe)�w�p�;2��10�d��8>I�J��v��+�+wu�tF��R�r��l�kՌ�6~R"&�Ϛ�nD��u�U�����|�i��x��Fe��I���?bY�^����E����w��(�&ו|��Tǁs��O��놅�e�$`Ю��v�K�M�� 74�#V��-��e� �Ш����.�I�ec�L�DM��w�<j��z%+'S��P�d�EHX��GX��yg7�H��f\�)�}�uC�A[�x���Ѕ�d���#�_��ZVX�T�ȳnS��d���/�W~.���=���jւ��(=;��(Ȇ���:\:"˙��iM/y�l�D}������^�;�
di`(U �7jZ_B�E�Iz`�ʲ;x����~���q� u��XFE�Kt5�s�YP��S�b�~�Eds[��L8���<BG��_���$֧�}��n.'�'ɚb��M��gR���h�u"2�5\Ov���&g��F���
H��u@�wXX��+��W�:��znj��r�N��u�2��L�$j������d��-��Ѳf�2w��]�e8�O�:�-���;Ӓ��3�r(��ԁW�T�	�f�$�W�"��6ƶy��\�4��U ��+a��c�ޘ��2`�#�MeL�p�����ш�L����i@�8�H�T�Y.s-SSd�M���/z��AY������h��n�N�;h��u�0'��<�	[���H>�N�?��	BɟY�5�5"N<EE+6�����RU�T���q��X�쏁U���KNQ$�QB|~/��0�]�e��"Յ�Ȧ�S�W°��/y�󵕨Z4%o��EL�W��%���V�0|�J���4y�ax.B`"�'���L�L�|�1W�_[���P�}T1$+�+���T��Keי��N(��
�����sH�SIY��5�iSQa���~&��-d�Q���ʪ\��t��Q����̅䵋&Q�0�����!8���ԣ��4q�T4՚�]�3kvፄ���ʚyj[n���j��q$&�ۧ;��O�N��ɾ}�;kxl�K�S�N]�<6ZI��<�<n7�rF�[�����N������I��4��2���'����	/6�w�~0�/   �� 1Q$k