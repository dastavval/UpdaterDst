import { useState, useEffect } from "react";
import { Plus, Menu, Edit2, Trash2, CheckCircle, XCircle, Package, Layers, Image, DollarSign, RefreshCw, BarChart2, ShieldAlert, ArrowLeft, Layers2, Sparkles, Cpu, MapPin, Palette, Edit3, Settings, Save, Users, Search, Phone, Building2, Map, Tag, ShoppingBag, ClipboardList, Check, Clock, Truck, ShieldCheck, CreditCard, Activity, Printer, X, Award, ChevronRight, Percent, UserPlus, User, BookOpen, LogOut, PlusCircle, Zap, Calendar, Newspaper, FileSpreadsheet, Download, Upload, FileText, Copy, HelpCircle, FileCode, MessageSquare, Eye, Code2, Server, Terminal, Network, Share2, Github, Megaphone, TrendingDown, HardDrive, Globe, Pin } from "lucide-react";
import Papa from "papaparse";
import { logoutUser, changePassword, updateDisplayName } from "../lib/auth-helper";
import { motion, AnimatePresence } from "motion/react";
import { Product, B2BConfig, OrderItem, SlideItem, BrandItem } from "../types";
import { fetchCRMCustomers, CRMCustomer, updateCRMCustomer, deleteCRMCustomer, addCRMCustomer } from "../lib/crm-helper";
import { fetchCallbackRequests, updateCallbackStatus, deleteCallbackRequest } from "../lib/callback-helper";
import { db } from "../lib/firebase";
import { collection, getDocs, doc, updateDoc, query, orderBy, addDoc, deleteDoc, serverTimestamp, where } from "../lib/firebase-mock";
import WholesaleInvoiceView from "./WholesaleInvoiceView";
import RepresentativeCertificateView from "./RepresentativeCertificateView";
import CatalogPrintView from "./CatalogPrintView";
import AdminInvoiceSettings from "./AdminInvoiceSettings";
import AdminSystemConfig from "./AdminSystemConfig";
import AdminPendingApprovals from "./AdminPendingApprovals";
import AdminFactoryProductAudit from "./AdminFactoryProductAudit";
import ProgressIndicator from "./ProgressIndicator";
import ConfirmModal from "./ConfirmModal";
import { generateId, generateProductCode, generateFactoryCode, generateUserCode, generateCategoryCode } from "../lib/id-utils";
import { uploadToParsPackStorage } from "../utils/storage";
import { getDisplayImageUrl } from "../lib/image-utils";
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
import { getCacheStatus, CacheStatus } from "../lib/db";
import ProductSyncStatusView from "./ProductSyncStatusView";

type SubTab = 'dashboard' | 'approvals' | 'products' | 'factory_audit' | 'branding' | 'crm' | 'factories' | 'orders' | 'accounting' | 'system' | 'pages' | 'catalog' | 'profile' | 'reports' | 'categories' | 'barter' | 'news' | 'invoice' | 'brands' | 'representatives' | 'ads' | 'safe_buy' | 'parspack_storage' | 'product_sync_status' | 'channel_posts';

export default function AdminPanel({ 
  products, 
  onAddProduct, 
  onUpdateProduct, 
  onDeleteProduct,
  onBatchDeleteProducts,
  onRefreshProducts,
  articles = [],
  onUpdateArticles,
  b2bConfig,
  onUpdateB2bConfig,
  language,
  onLogout
}: AdminPanelProps) {
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
  const [orders, setOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersSearch, setOrdersSearch] = useState("");

  const fetchOrders = async () => {
    setOrdersLoading(true);
    try {
      const ordersQuery = query(collection(db, "orders"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(ordersQuery);
      const fetchedOrders: any[] = [];
      querySnapshot.forEach((doc) => {
        fetchedOrders.push({ id: doc.id, ...doc.data() });
      });
      setOrders(fetchedOrders);
    } catch (e) {
      console.error("Error fetching orders:", e);
    } finally {
      setOrdersLoading(false);
    }
  };

  const fetchSafeBuyRequests = async () => {
    try {
      const q = query(collection(db, "safe_buy_requests"));
      const querySnapshot = await getDocs(q);
      const fetched: any[] = [];
      querySnapshot.forEach((docSnap) => {
        fetched.push({ firebaseId: docSnap.id, ...docSnap.data() });
      });
      
      if (fetched.length > 0) {
        fetched.sort((a, b) => {
          const idA = a.id || '';
          const idB = b.id || '';
          return idB.localeCompare(idA);
        });
        setSafeBuyRequests(fetched);
        localStorage.setItem("dastavval_safe_buy_requests", JSON.stringify(fetched));
      } else {
        const local = localStorage.getItem("dastavval_safe_buy_requests");
        if (local) {
          const parsed = JSON.parse(local);
          setSafeBuyRequests(parsed);
          for (const req of parsed) {
            await addDoc(collection(db, "safe_buy_requests"), req);
          }
        } else {
          const defaultRequests: any[] = [];
          setSafeBuyRequests(defaultRequests);
          localStorage.setItem("dastavval_safe_buy_requests", JSON.stringify(defaultRequests));
          for (const req of defaultRequests) {
            await addDoc(collection(db, "safe_buy_requests"), req);
          }
        }
      }
    } catch (e) {
      console.error("Error fetching safe buy requests:", e);
      const local = localStorage.getItem("dastavval_safe_buy_requests");
      if (local) {
        try { setSafeBuyRequests(JSON.parse(local)); } catch (err) {}
      }
    }
  };

  const handleUpdateSafeBuyStatus = async (reqId: string, firebaseId: string | undefined, nextStatus: 'approved' | 'rejected' | 'pending') => {
    try {
      const updated = safeBuyRequests.map(item => item.id === reqId ? { ...item, status: nextStatus } : item);
      setSafeBuyRequests(updated);
      localStorage.setItem("dastavval_safe_buy_requests", JSON.stringify(updated));

      if (firebaseId) {
        const docRef = doc(db, "safe_buy_requests", firebaseId);
        await updateDoc(docRef, { status: nextStatus });
      } else {
        const q = query(collection(db, "safe_buy_requests"));
        const snapshot = await getDocs(q);
        let foundAndUpdated = false;
        snapshot.forEach(async (docSnap) => {
          const data = docSnap.data();
          if (data.id === reqId) {
            const docRef = doc(db, "safe_buy_requests", docSnap.id);
            await updateDoc(docRef, { status: nextStatus });
            foundAndUpdated = true;
          }
        });
        
        // If it wasn't found in mock firestore, we can add it or let it persist locally
        if (!foundAndUpdated) {
          const match = updated.find(item => item.id === reqId);
          if (match) {
            await addDoc(collection(db, "safe_buy_requests"), match);
          }
        }
      }

      setSuccessMsg(nextStatus === 'approved' ? "درخواست خرید امن تایید شد." : "درخواست خرید امن رد شد.");
      setTimeout(() => setSuccessMsg(null), 2500);
    } catch (e) {
      console.error("Error updating safe buy status:", e);
      setErrorMsg("خطا در به روز رسانی وضعیت در دیتابیس.");
      setTimeout(() => setErrorMsg(null), 2500);
    }
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
      fetchSafeBuyRequests();
    } else if (activeSubTab === 'dashboard' || activeSubTab === 'approvals') {
      fetchOrders();
      fetchSafeBuyRequests();
      loadCallbackRequests();
      loadSupportTickets();
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

    const handleNewCallback = () => {
      loadCallbackRequests();
    };

    window.addEventListener("dastavval_callback_added", handleNewCallback);
    return () => window.removeEventListener("dastavval_callback_added", handleNewCallback);
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
  const [crmSearch, setCrmSearch] = useState("");
  const [crmBadgeFilter, setCrmBadgeFilter] = useState<string>("all");
  const [crmLoading, setCrmLoading] = useState(false);
  const [selectedCrmIds, setSelectedCrmIds] = useState<string[]>([]);
  const [showCrmBatchEditModal, setShowCrmBatchEditModal] = useState(false);
  const [batchCrmBadge, setBatchCrmBadge] = useState<string>("");
  const [batchCrmStatus, setBatchCrmStatus] = useState<string>("");
  const [batchCrmCity, setBatchCrmCity] = useState<string>("");

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

  useEffect(() => {
    const checkCache = async () => {
      const status = await getCacheStatus();
      setCacheStatus(status);
    };
    if (activeSubTab === 'dashboard') {
      checkCache();
    }
  }, [activeSubTab]);

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
  const [tradeUnionCode, setTradeUnionCode] = useState("IR-9044502");
  const [tradeUnionUrl, setTradeUnionUrl] = useState("https://dastavval.com/license");
  const [zarinpalMerchantCode, setZarinpalMerchantCode] = useState("");
  const [officialSealUrl, setOfficialSealUrl] = useState("");
  const [brandImages, setBrandImages] = useState<any[]>([]);
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
      } catch (e) {}
    };
    loadAds();
    window.addEventListener("storage", loadAds);
    window.addEventListener("dastavval_ads_updated", loadAds);
    return () => {
      window.removeEventListener("storage", loadAds);
      window.removeEventListener("dastavval_ads_updated", loadAds);
    };
  }, []);
  const [safeBuyRequests, setSafeBuyRequests] = useState<any[]>([]);
  const [safeBuyFilter, setSafeBuyFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [selectedSafeBuyDetail, setSelectedSafeBuyDetail] = useState<any | null>(null);

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

  const updateAdsState = (newAds: any[], msg: string) => {
    setSponsoredAds(newAds);
    localStorage.setItem("dastavval_sponsored_ads_v2", JSON.stringify(newAds));
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

  const handleUpdateAdStatus = (adId: string, status: 'approved' | 'rejected' | 'pending', rejectionReason?: string) => {
    const newAds = sponsoredAds.map(a => a.id === adId ? { ...a, status, rejectionReason: rejectionReason || '' } : a);
    updateAdsState(newAds, status === 'approved' ? "آگهی با موفقیت تایید و در تالار منتشر شد." : "وضعیت آگهی بروزرسانی شد.");
  };

  const handleUpdateRepStatus = (id: string, isApproved: boolean) => {
    const updated = representativesList.map(r => (r.id === id || r.agencyCode === id) ? { ...r, isApproved } : r);
    setRepresentativesList(updated);
    localStorage.setItem("dastavval_representatives", JSON.stringify(updated));
    setSuccessMsg(isApproved ? "درخواست عاملیت و نمایندگی با موفقیت تایید شد." : "درخواست نمایندگی رد شد.");
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
  const [editingOrder, setEditingOrder] = useState<any | null>(null);
  const [editBuyerName, setEditBuyerName] = useState("");
  const [editBuyerPhone, setEditBuyerPhone] = useState("");
  const [editBuyerCompany, setEditBuyerCompany] = useState("");
  const [editBuyerAddress, setEditBuyerAddress] = useState("");
  const [editTotalAmount, setEditTotalAmount] = useState<number>(0);
  const [editPaymentStatus, setEditPaymentStatus] = useState("paid");
  const [editOrderItems, setEditOrderItems] = useState<OrderItem[]>([]);
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
  const [showCrmModal, setShowCrmModal] = useState(false);
  const [editingCrmCustomer, setEditingCrmCustomer] = useState<any | null>(null);
  const [crmName, setCrmName] = useState("");
  const [crmPhone, setCrmPhone] = useState("");
  const [crmCompany, setCrmCompany] = useState("");
  const [crmCity, setCrmCity] = useState("");
  const [crmYear, setCrmYear] = useState(1400);
  const [crmBadge, setCrmBadge] = useState<'bronze' | 'silver' | 'gold' | 'vip'>("bronze");
  const [crmStatus, setCrmStatus] = useState<'active' | 'pending_verification' | 'suspended' | 'vip_candidate'>("active");
  const [crmNotes, setCrmNotes] = useState("");
  const [crmTotalOrders, setCrmTotalOrders] = useState(0);
  const [crmTotalPurchase, setCrmTotalPurchase] = useState(0);
  const [crmRole, setCrmRole] = useState<'customer' | 'representative' | 'marketer' | 'factory'>("customer");
  const [crmRoleFilter, setCrmRoleFilter] = useState<'all' | 'customer' | 'representative' | 'marketer' | 'factory'>("all");

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
  const [showRepModal, setShowRepModal] = useState(false);
  const [editingRep, setEditingRep] = useState<any | null>(null);
  const [repCity, setRepCity] = useState("");
  const [repName, setRepName] = useState("");
  const [repPhone, setRepPhone] = useState("");
  const [repTel, setRepTel] = useState("");
  const [repAddress, setRepAddress] = useState("");
  const [repBadge, setRepBadge] = useState("نماینده فعال");
  const [repIsApproved, setRepIsApproved] = useState(true);
  const [repAgencyCode, setRepAgencyCode] = useState("");
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
  const [showNotificationModal, setShowNotificationModal] = useState<any | null>(null);
  const [notificationTitle, setNotificationTitle] = useState("");
  const [notificationBody, setNotificationBody] = useState("");

  // Create Direct Invoice States
  const [showDirectInvoiceModal, setShowDirectInvoiceModal] = useState<any | null>(null);
  const [directInvoiceItems, setDirectInvoiceItems] = useState<{ product: any; quantity: number }[]>([]);

  useEffect(() => {
    if (activeSubTab === 'dashboard' || activeSubTab === 'reports') {
      setAdminCategory('monitoring');
    } else if (activeSubTab === 'products' || activeSubTab === 'categories' || activeSubTab === 'brands' || activeSubTab === 'factories' || activeSubTab === 'catalog' || activeSubTab === 'branding') {
      setAdminCategory('catalog');
    } else if (activeSubTab === 'orders' || activeSubTab === 'crm' || activeSubTab === 'representatives' || activeSubTab === 'invoice' || activeSubTab === 'accounting' || activeSubTab === 'barter' || activeSubTab === ('vip-wallet' as any) || activeSubTab === ('ai-marketing' as any)) {
      setAdminCategory('sales');
    } else {
      setAdminCategory('system');
    }
  }, [activeSubTab]);

  useEffect(() => {
    if (showImporterDashboard || showAiSettings) {
      setAdminCategory('system');
    }
  }, [showImporterDashboard, showAiSettings]);

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
  const [directPaymentStatus, setDirectPaymentStatus] = useState("pending");
  const [directShippingMethod, setDirectShippingMethod] = useState("barbari");
  const [directAddress, setDirectAddress] = useState("");

  // News & Articles States
  const [isAddingNews, setIsAddingNews] = useState(false);
  const [editingNewsId, setEditingNewsId] = useState<string | null>(null);
  const [newsTitle, setNewsTitle] = useState("");
  const [newsSummary, setNewsSummary] = useState("");
  const [newsContent, setNewsContent] = useState("");
  const [newsCategory, setNewsCategory] = useState<any>("تنظیم بازار");
  const [newsImage, setNewsImage] = useState("");
  const [newsSource, setNewsSource] = useState("مدیریت سامانه");

  // Channel Posts States
  const [editingChannelPostId, setEditingChannelPostId] = useState<string | null>(null);
  const [channelPostTitle, setChannelPostTitle] = useState("");
  const [channelPostContent, setChannelPostContent] = useState("");
  const [channelPostCategory, setChannelPostCategory] = useState("info");
  const [channelPostActionLabel, setChannelPostActionLabel] = useState("");
  const [channelPostActionUrl, setChannelPostActionUrl] = useState("");

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
  const [leadTimeDays, setLeadTimeDays] = useState(0);
  const [purchasePrice, setPurchasePrice] = useState(0);
  const [badge, setBadge] = useState("");
  const [isFavorite, setIsFavorite] = useState(false);
  const [hasHealthApple, setHasHealthApple] = useState(false);
  const [isNatural, setIsNatural] = useState(false);
  const [isOrganic, setIsOrganic] = useState(false);
  const [healthCertCode, setHealthCertCode] = useState("");

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
    setPackDescription("");
    setShippingOrigin("");
    setCartonPackCount(24);
    setMinOrderCartons(10);
    setCategory(categories.length > 0 ? (typeof categories[0] === 'string' ? categories[0] : categories[0].name) : "تنقلات و شکلات");
    setStockQuantityCartons(100);
    setImageUrl("");
    setUnit("بسته");
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
      setTradeUnionCode((b2bConfig as any).tradeUnionCode || "IR-9044502");
      setTradeUnionUrl((b2bConfig as any).tradeUnionUrl || "https://dastavval.com/license");
      setZarinpalMerchantCode((b2bConfig as any).zarinpalMerchantCode || "");
      setOfficialSealUrl((b2bConfig as any).officialSealUrl || "");
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
    setUnit(p.unit);
    setLeadTimeDays(p.production_lead_time_days);
    setPurchasePrice(p.purchase_price || 0);
    setBadge(p.badge || "");
    setIsFavorite(p.isFavorite || false);
    setHasHealthApple(p.hasHealthApple !== false);
    setIsNatural(p.isNatural !== false);
    setIsOrganic(!!p.isOrganic);
    setHealthCertCode(p.healthCertCode || "۱۶/۱۲۴۵۸");
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
      unit,
      sellerId: "hq_admin",
      sellerName: "مدیریت مرکزی دست اول",
      production_lead_time_days: Number(leadTimeDays) || 2,
      purchase_price: Number(purchasePrice) || 0,
      badge,
      isFavorite,
      hasHealthApple,
      isNatural,
      isOrganic,
      healthCertCode
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
        tradeUnionCode: tradeUnionCode,
        tradeUnionUrl: tradeUnionUrl,
        zarinpalMerchantCode: zarinpalMerchantCode,
        officialSealUrl: officialSealUrl,
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
      const { doc: orderDoc, updateDoc: orderUpdate } = await import("../lib/firebase-mock");
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
        }
      } catch (e) {}

      if (!rawData) {
        const directRes = await fetch(catalogJsonSyncUrl.trim());
        if (directRes.ok) {
          rawData = await directRes.json();
        }
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

      for (const incItem of incomingProducts) {
        const sku = incItem.sku || String(incItem.id) || `PRD-${Math.random().toString(36).substring(2, 7)}`;
        const existing = products.find(p => p.sku === sku || String(p.id) === String(incItem.id) || p.sku === String(incItem.id) || p.name === incItem.name);

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

        if (existing) {
          await onUpdateProduct(existing.id, {
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
          });
          updatedCount++;
        } else {
          await onAddProduct({
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
      for (let i = 0; i < itemsToImport.length; i++) {
        const p = itemsToImport[i];
        if (i % 2 === 0) {
          await new Promise(resolve => setTimeout(resolve, 0));
        }

        const pct = Math.round(((i + 1) / itemsToImport.length) * 100);
        if (i % 3 === 0 || i === itemsToImport.length - 1) {
          setImportProgress(pct);
        }

        // Search for existing by SKU or Name
        const existing = products.find(prod => 
          (p.sku && prod.sku && String(prod.sku).trim().toLowerCase() === String(p.sku).trim().toLowerCase()) ||
          (prod.name && String(prod.name).trim().toLowerCase() === String(p.name).trim().toLowerCase())
        );

        if (existing && updateExistingBySku) {
          const productRef = doc(db, "products", existing.id);
          await updateDoc(productRef, {
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
          });
          updatedCount++;
          if (i % 5 === 0) {
            setImportLogs(prev => [`[OVERRIDE_UPDATED] Product #${existing.id} (${p.sku || p.name}) refreshed.`, ...prev.slice(0, 30)]);
          }
        } else {
          await addDoc(collection(db, "products"), {
            sku: p.sku,
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
            createdAt: serverTimestamp()
          });
          importedCount++;
          if (i % 5 === 0) {
            setImportLogs(prev => [`[NEW_CREATED] Product (${p.sku || p.name}) added to database.`, ...prev.slice(0, 30)]);
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
      
      const updatedConfig = {
        ...b2bConfig,
        factories: updatedFactories
      };
      await onUpdateB2bConfig(updatedConfig);
      setFactories(updatedFactories);
      setSuccessMsg("اطلاعات کارخانه با موفقیت ذخیره شد!");
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

  const handleToggleFactoryActive = async (factoryId: string) => {
    setLoading(true);
    try {
      const updatedFactories = factories.map(f => f.id === factoryId ? { ...f, isActive: f.isActive === undefined ? false : !f.isActive } : f);
      const updatedConfig = {
        ...b2bConfig,
        factories: updatedFactories
      };
      await onUpdateB2bConfig(updatedConfig);
      setFactories(updatedFactories);
      setSuccessMsg("وضعیت فعال‌سازی کارخانه با موفقیت تغییر یافت.");
    } catch (err: any) {
      setErrorMsg("خطا در تغییر وضعیت فعال‌سازی کارخانه.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFactoryFeatured = async (factoryId: string) => {
    setLoading(true);
    try {
      const updatedFactories = factories.map(f => f.id === factoryId ? { ...f, isFeatured: !f.isFeatured, isPinned: !f.isFeatured } : f);
      const updatedConfig = {
        ...b2bConfig,
        factories: updatedFactories
      };
      await onUpdateB2bConfig(updatedConfig);
      setFactories(updatedFactories);
      setSuccessMsg("وضعیت نشان ویژه/سنجاق کارخانه با موفقیت تغییر یافت.");
    } catch (err: any) {
      setErrorMsg("خطا در تغییر نشان ویژه کارخانه.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFactory = async (id: string) => {
    confirmAction(
      "حذف کارخانه",
      "آیا از حذف این کارخانه اطمینان دارید؟",
      async () => {
        setLoading(true);
        try {
          const updatedFactories = factories.filter(f => f.id !== id);
          const updatedConfig = {
            ...b2bConfig,
            factories: updatedFactories
          };
          await onUpdateB2bConfig(updatedConfig);
          setFactories(updatedFactories);
          setSuccessMsg("کارخانه با موفقیت حذف شد.");
        } catch (err: any) {
          setErrorMsg("خطا در حذف کارخانه.");
        } finally {
          setLoading(false);
        }
      }
    );
  };

  // --- CRM & Notification Handlers ---
  const handleCreateOrUpdateNews = async () => {
    if (!newsTitle || !newsContent) {
      setErrorMsg("لطفاً عنوان و متن خبر را وارد کنید.");
      return;
    }

    setLoading(true);
    try {
      const newId = editingNewsId || `news-${Date.now()}`;
      const payload = {
        id: newId,
        title: newsTitle,
        summary: newsSummary,
        content: newsContent,
        category: newsCategory,
        imageUrl: newsImage || "https://images.unsplash.com/photo-1504711432869-efd5973e8a48?auto=format&fit=crop&q=80&w=1000",
        source: newsSource,
        date: new Date().toLocaleDateString('fa-IR'),
        createdAt: new Date().toISOString()
      };

      try {
        if (editingNewsId) {
          await updateDoc(doc(db, "news", editingNewsId), payload);
        } else {
          await addDoc(collection(db, "news"), {
            ...payload,
            createdAt: serverTimestamp()
          });
        }
      } catch (e) {
        console.warn("Firestore news update failed, saving locally:", e);
      }

      // Update local storage articles
      const saved = localStorage.getItem("dastavval_news_articles");
      let currentArticles: any[] = saved !== null ? JSON.parse(saved) : (articles || []);
      if (editingNewsId) {
        currentArticles = currentArticles.map(a => a.id === editingNewsId ? { ...a, ...payload } : a);
      } else {
        currentArticles.unshift(payload);
      }
      localStorage.setItem("dastavval_news_articles", JSON.stringify(currentArticles));

      setSuccessMsg(editingNewsId ? "خبر با موفقیت بروزرسانی شد." : "خبر جدید با موفقیت منتشر شد.");
      setIsAddingNews(false);
      setEditingNewsId(null);
      setNewsTitle("");
      setNewsSummary("");
      setNewsContent("");
      setNewsImage("");
      
      if (onUpdateArticles) await onUpdateArticles();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setErrorMsg("خطا در انتشار خبر: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditNewsClick = (article: any) => {
    setIsAddingNews(true);
    setEditingNewsId(article.id);
    setNewsTitle(article.title || "");
    setNewsSummary(article.summary || "");
    setNewsContent(article.content || "");
    setNewsCategory(article.category || "اطلاعیه تامین");
    setNewsImage(article.imageUrl || "");
    setNewsSource(article.source || "مدیریت سامانه");
  };

  const handleDeleteNews = async (id: string, index?: number) => {
    confirmAction(
      "حذف خبر",
      "آیا از حذف این خبر اطمینان دارید؟",
      async () => {
        setLoading(true);
        try {
          if (id) {
            try {
              await deleteDoc(doc(db, "news", id));
            } catch (e) {
              console.warn("Firestore delete failed, deleting locally:", e);
            }
          }

          const saved = localStorage.getItem("dastavval_news_articles");
          let currentArticles: any[] = saved !== null ? JSON.parse(saved) : (articles || []);
          currentArticles = currentArticles.filter((a, idx) => a.id ? a.id !== id : idx !== index);
          localStorage.setItem("dastavval_news_articles", JSON.stringify(currentArticles));

          setSuccessMsg("خبر با موفقیت حذف شد.");
          if (onUpdateArticles) await onUpdateArticles();
          setTimeout(() => setSuccessMsg(null), 3000);
        } catch (err: any) {
          setErrorMsg("خطا در حذف خبر.");
        } finally {
          setLoading(false);
        }
      }
    );
  };

  // Representative Management Handlers
  const handleOpenRepModal = (rep?: any) => {
    if (rep) {
      setEditingRep(rep);
      setRepCity(rep.city || "");
      setRepName(rep.name || "");
      setRepPhone(rep.phone || "");
      setRepTel(rep.tel || "");
      setRepAddress(rep.address || "");
      setRepBadge(rep.badge || "نماینده فعال");
      setRepIsApproved(rep.isApproved !== false);
      setRepAgencyCode(rep.agencyCode || "");
    } else {
      setEditingRep(null);
      setRepCity("");
      setRepName("");
      setRepPhone("");
      setRepTel("");
      setRepAddress("");
      setRepBadge("نماینده فعال");
      setRepIsApproved(true);
      setRepAgencyCode("");
    }
    setShowRepModal(true);
  };

  const handleSaveRepresentative = () => {
    if (!repCity || !repName || !repPhone) {
      setErrorMsg("لطفاً شهر، نام مدیر و شماره تماس نماینده را وارد کنید.");
      return;
    }

    let updated: any[];
    if (editingRep) {
      updated = representativesList.map(r => r.id === editingRep.id ? {
        ...r,
        city: repCity,
        name: repName,
        phone: repPhone,
        tel: repTel,
        address: repAddress,
        badge: repBadge,
        isApproved: repIsApproved,
        agencyCode: repAgencyCode || r.agencyCode || `AGN-1405-${Math.floor(1000 + Math.random() * 9000)}`
      } : r);
      setSuccessMsg("مشخصات نماینده با موفقیت بروزرسانی شد.");
    } else {
      const newRep = {
        id: `rep-${Date.now()}`,
        city: repCity,
        name: repName,
        phone: repPhone,
        tel: repTel,
        address: repAddress,
        badge: repBadge,
        isApproved: repIsApproved,
        agencyCode: repAgencyCode || `AGN-1405-${Math.floor(1000 + Math.random() * 9000)}`
      };
      updated = [newRep, ...representativesList];
      setSuccessMsg("نماینده جدید با موفقیت اضافه شد.");
    }

    setRepresentativesList(updated);
    localStorage.setItem("dastavval_representatives", JSON.stringify(updated));
    window.dispatchEvent(new Event("dastavval_reps_updated"));
    setShowRepModal(false);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleDeleteRepresentative = (id: string) => {
    confirmAction(
      "حذف نماینده",
      "آیا از حذف این دفتر/نماینده اطمینان دارید؟",
      () => {
        const updated = representativesList.filter(r => r.id !== id);
        setRepresentativesList(updated);
        localStorage.setItem("dastavval_representatives", JSON.stringify(updated));
        window.dispatchEvent(new Event("dastavval_reps_updated"));
        setSuccessMsg("نماینده با موفقیت حذف شد.");
        setTimeout(() => setSuccessMsg(null), 3000);
      }
    );
  };

  const handleFastApproveRep = (rep: any) => {
    const updated = representativesList.map(r => r.id === rep.id ? {
      ...r,
      isApproved: true,
      agencyCode: r.agencyCode || `AGN-1405-${Math.floor(1000 + Math.random() * 9000)}`
    } : r);
    setRepresentativesList(updated);
    localStorage.setItem("dastavval_representatives", JSON.stringify(updated));
    window.dispatchEvent(new Event("dastavval_reps_updated"));
    setSuccessMsg("دفتر نمایندگی با موفقیت تایید و گواهی رسمی صادر شد.");
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleAddCrmClick = () => {
    setEditingCrmCustomer(null);
    setCrmName("");
    setCrmPhone("");
    setCrmCompany("");
    setCrmCity("تهران");
    setCrmYear(1400);
    setCrmBadge("bronze");
    setCrmStatus("active");
    setCrmNotes("");
    setCrmTotalOrders(0);
    setCrmTotalPurchase(0);
    setCrmRole("customer");
    setShowCrmModal(true);
  };

  const handleEditCrmClick = (c: any) => {
    setEditingCrmCustomer(c);
    setCrmName(c.name || "");
    setCrmPhone(c.phone || "");
    setCrmCompany(c.company || "");
    setCrmCity(c.city || "تهران");
    setCrmYear(c.establishedYear || 1400);
    setCrmBadge(c.badge || "bronze");
    setCrmStatus(c.status || "active");
    setCrmNotes(c.notes || "");
    setCrmTotalOrders(c.totalOrdersCount || 0);
    setCrmTotalPurchase(c.totalPurchaseValue || 0);
    setCrmRole(c.role || "customer");
    setShowCrmModal(true);
  };

  const handleCrmSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        name: crmName,
        phone: crmPhone,
        company: crmCompany,
        city: crmCity,
        establishedYear: Number(crmYear),
        badge: crmBadge,
        status: crmStatus,
        notes: crmNotes,
        totalOrdersCount: Number(crmTotalOrders),
        totalPurchaseValue: Number(crmTotalPurchase),
        role: crmRole
      };

      if (editingCrmCustomer) {
        await updateCRMCustomer(editingCrmCustomer.id, payload);
        setSuccessMsg("اطلاعات کاربر با موفقیت بروزرسانی شد.");
      } else {
        await addCRMCustomer(payload);
        setSuccessMsg("کاربر جدید با موفقیت اضافه شد.");
      }
      setShowCrmModal(false);
      setEditingCrmCustomer(null);
      loadCrmCustomers();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg("خطا در ذخیره اطلاعات مشتری.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCrmCustomer = async (id: string) => {
    confirmAction(
      "حذف بنکدار",
      "آیا از حذف این بنکدار از باشگاه مشتریان اطمینان دارید؟",
      async () => {
        setLoading(true);
        try {
          await deleteCRMCustomer(id);
          setSuccessMsg("بنکدار با موفقیت از سیستم حذف شد.");
          loadCrmCustomers();
          setTimeout(() => setSuccessMsg(null), 4000);
        } catch (err: any) {
          setErrorMsg("خطا در حذف بنکدار.");
        } finally {
          setLoading(false);
        }
      }
    );
  };

  const handleToggleSelectCrm = (id: string) => {
    setSelectedCrmIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAllCrm = (filteredCustomers: CRMCustomer[]) => {
    const filteredIds = filteredCustomers.map(c => c.id);
    const allSelected = filteredIds.every(id => selectedCrmIds.includes(id));
    if (allSelected) {
      setSelectedCrmIds(prev => prev.filter(id => !filteredIds.includes(id)));
    } else {
      setSelectedCrmIds(prev => Array.from(new Set([...prev, ...filteredIds])));
    }
  };

  const handleBatchDeleteCrm = async () => {
    if (selectedCrmIds.length === 0) return;
    confirmAction(
      "حذف گروهی بنکداران",
      `آیا از حذف ${selectedCrmIds.length} بنکدار انتخاب شده از باشگاه مشتریان اطمینان دارید؟ این عمل غیرقابل بازگشت است.`,
      async () => {
        setLoading(true);
        try {
          for (const id of selectedCrmIds) {
            await deleteCRMCustomer(id);
          }
          setSuccessMsg(`تعداد ${selectedCrmIds.length} بنکدار با موفقیت حذف شدند.`);
          setSelectedCrmIds([]);
          loadCrmCustomers();
          setTimeout(() => setSuccessMsg(null), 4000);
        } catch (err) {
          setErrorMsg("خطا در حذف گروهی بنکداران.");
        } finally {
          setLoading(false);
        }
      }
    );
  };

  const handleBatchUpdateCrm = async () => {
    if (selectedCrmIds.length === 0) return;
    setLoading(true);
    try {
      const updates: Partial<CRMCustomer> = {};
      if (batchCrmBadge) updates.badge = batchCrmBadge as any;
      if (batchCrmStatus) updates.status = batchCrmStatus as any;
      if (batchCrmCity) updates.city = batchCrmCity;

      for (const id of selectedCrmIds) {
        await updateCRMCustomer(id, updates);
      }

      setSuccessMsg(`اطلاعات ${selectedCrmIds.length} بنکدار با موفقیت ویرایش گروهی شد.`);
      setSelectedCrmIds([]);
      setShowCrmBatchEditModal(false);
      setBatchCrmBadge("");
      setBatchCrmStatus("");
      setBatchCrmCity("");
      loadCrmCustomers();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      setErrorMsg("خطا در ویرایش گروهی بنکداران.");
    } finally {
      setLoading(false);
    }
  };

  const handleExportCrmCsv = (listToExport: CRMCustomer[]) => {
    if (listToExport.length === 0) {
      alert("هیچ بنکداری برای خروجی گرفتن وجود ندارد.");
      return;
    }
    const headers = ["نام بنکدار", "نام شرکت / فروشگاه", "شماره تماس", "شهر", "وضعیت", "رتبه/نشان", "تعداد سفارشات", "مجموع خرید (تومان)"];
    const rows = listToExport.map(c => [
      `"${c.name || ''}"`,
      `"${c.company || ''}"`,
      `"${c.phone || ''}"`,
      `"${c.city || ''}"`,
      `"${c.status === 'active' ? 'فعال' : c.status === 'pending_verification' ? 'در انتظار تایید' : c.status === 'vip_candidate' ? 'کاندید VIP' : 'تعلیق شده'}"`,
      `"${c.badge === 'vip' ? 'ویژه VIP' : c.badge === 'gold' ? 'طلایی' : c.badge === 'silver' ? 'نقره‌ای' : 'برنزی'}"`,
      c.totalOrdersCount || 0,
      c.totalPurchaseValue || 0
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `DastAvval_CRM_Customers_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSendNotificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notificationTitle || !notificationBody) {
      alert("لطفا عنوان و متن اعلان را وارد کنید.");
      return;
    }
    setLoading(true);
    try {
      await addDoc(collection(db, "notifications"), {
        customerId: showNotificationModal.id,
        customerName: showNotificationModal.name,
        company: showNotificationModal.company,
        title: notificationTitle,
        body: notificationBody,
        createdAt: new Date(),
        isRead: false
      });
      setSuccessMsg(`اعلان با موفقیت برای شرکت «${showNotificationModal.company}» ارسال و ثبت شد.`);
      setShowNotificationModal(null);
      setNotificationTitle("");
      setNotificationBody("");
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg("خطا در ارسال اعلان.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDirectInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (directInvoiceItems.length === 0) {
      alert("لطفا حداقل یک کالا به فاکتور اضافه کنید.");
      return;
    }
    setLoading(true);
    try {
      const orderItems = directInvoiceItems.map(item => ({
        productId: item.product.id,
        name: item.product.name,
        quantityCartons: item.quantity,
        pricePerCarton: item.product.bulkPrice || item.product.price,
        totalItems: item.quantity * (item.product.cartonPackCount || 24)
      }));

      const totalSum = orderItems.reduce((sum, item) => sum + (item.pricePerCarton * item.quantityCartons), 0);
      const firstProduct = directInvoiceItems[0].product;

      const newOrder = {
        trackingNumber: `DO-${Math.floor(100000 + Math.random() * 900000)}`,
        buyerName: showDirectInvoiceModal.name,
        buyerPhone: showDirectInvoiceModal.phone,
        buyerCompany: showDirectInvoiceModal.company,
        buyerAddress: directAddress || showDirectInvoiceModal.city,
        sellerName: firstProduct.sellerName || "دفتر فروش مرکزی",
        sellerId: firstProduct.sellerId || "factory_direct",
        items: orderItems,
        totalAmount: totalSum,
        status: 'order_received',
        paymentStatus: directPaymentStatus,
        shippingMethod: directShippingMethod,
        createdAt: new Date()
      };

      await addDoc(collection(db, "orders"), newOrder);
      setSuccessMsg(`فاکتور رسمی با موفقیت برای شرکت «${showDirectInvoiceModal.company}» صادر شد.`);
      setShowDirectInvoiceModal(null);
      setDirectInvoiceItems([]);
      setDirectAddress("");
      fetchOrders();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg("خطا در صدور مستقیم فاکتور.");
    } finally {
      setLoading(false);
    }
  };

  const toPersianNum = (num: number | string) => {
    if (num === undefined || num === null) return "";
    const persian: Record<string, string> = {
      "0": "۰", "1": "۱", "2": "۲", "3": "۳", "4": "۴", "5": "۵", "6": "۶", "7": "۷", "8": "۸", "9": "۹"
    };
    return num.toString().replace(/[0-9]/g, (w) => persian[w] || w);
  };

  const toEnglishNum = (str: string | number): string => {
    if (str === undefined || str === null) return "";
    const persianDigits = [/۰/g, /۱/g, /۲/g, /۳/g, /۴/g, /۵/g, /۶/g, /۷/g, /۸/g, /۹/g];
    const arabicDigits = [/٠/g, /١/g, /٢/g, /٣/g, /٤/g, /٥/g, /٦/g, /٧/g, /٨/g, /٩/g];
    let cleaned = str.toString();
    for (let i = 0; i < 10; i++) {
      cleaned = cleaned.replace(persianDigits[i], i.toString()).replace(arabicDigits[i], i.toString());
    }
    return cleaned;
  };

  // Color classes for active visual settings indicators
  const borderColors: Record<string, string> = {
    emerald: "border-emerald-500",
    indigo: "border-indigo-500",
    amber: "border-amber-500",
    sky: "border-sky-500",
    violet: "border-violet-500"
  };

  const textColors: Record<string, string> = {
    emerald: "text-emerald-600",
    indigo: "text-indigo-600",
    amber: "text-amber-600",
    sky: "text-sky-600",
    violet: "text-violet-600"
  };

  const activeText = textColors[selectedColor] || textColors.emerald;
  const activeBorder = borderColors[selectedColor] || borderColors.emerald;

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <>
    <ConfirmModal 
      isOpen={confirmDialog.isOpen}
      title={confirmDialog.title}
      message={confirmDialog.message}
      onConfirm={confirmDialog.onConfirm}
      onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
    />
    <div className="flex min-h-screen bg-slate-50 text-right font-vazir relative overflow-hidden selection selection" dir="rtl">
      
      {/* MOBILE OVERLAY */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-white/60 backdrop-blur-sm z-30 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* PROFESSIONAL DASHBOARD SIDEBAR */}
      <aside className={`
        fixed inset-y-0 right-0 z-40 w-72 bg-white border-l border-slate-200 flex flex-col shadow-2xl transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:h-screen
        ${isSidebarOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"}
      `}>
        <div className="p-8 pb-4 flex-1 overflow-y-auto custom-scrollbar">
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-3 group cursor-pointer">
              <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-xl shadow-emerald-600/30 group-hover:rotate-6 transition-transform">
                <Layers2 className="text-white" size={24} />
              </div>
              <div>
                <h1 className="text-xl font-black text-slate-800 leading-tight">پنل ادمین توزیع</h1>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-0.5 opacity-80 font-sans">Distribution Hub</p>
              </div>
            </div>
            <button 
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden p-2 text-slate-400 hover transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="space-y-8">
            <section>
              <p className="text-[10px] font-black text-slate-400 mb-4 px-2 uppercase tracking-tighter opacity-60 font-sans">CORE MANAGEMENT</p>
              <nav className="space-y-1.5">
                <button
                  onClick={() => { setActiveSubTab('dashboard'); setShowForm(false); setShowAiSettings(false); setShowImporterDashboard(false); setIsSidebarOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-xs font-black transition-all cursor-pointer ${
                    activeSubTab === 'dashboard' && !showImporterDashboard
                      ? "bg-emerald-600 text-white shadow-xl shadow-emerald-600/25 animate-pulse"
                      : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                  }`}
                >
                  <Activity size={18} />
                  میزکار مانیتورینگ
                </button>

                <button
                  onClick={() => { setActiveSubTab('products'); setShowForm(false); setShowAiSettings(false); setShowImporterDashboard(false); setIsSidebarOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-xs font-black transition-all cursor-pointer ${
                    activeSubTab === 'products'
                      ? "bg-emerald-600 text-white shadow-xl shadow-emerald-600/25"
                      : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                  }`}
                >
                  <Package size={18} />
                  کاتالوگ و انبار کالا
                </button>
                
                <button
                  onClick={() => { setActiveSubTab('orders'); setShowForm(false); setShowAiSettings(false); setShowImporterDashboard(false); setIsSidebarOpen(false); }}
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
            <p className="text-[9px] text-slate-400 font-medium mt-1">بروزرسانی گیت‌هاب، هوش مصنوعی</p>
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
                  <span>بروزرسانی از گیت‌هاب</span>
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
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4 mb-6">
              <Sparkles className="text-amber-500 animate-pulse" size={20} />
              <div>
                <h3 className="text-sm sm font-black text-white">درگاه توزیع ابری هوش مصنوعی</h3>
                <p className="text-[10px] text-slate-400 font-bold">پیکربندی کلیدهای Google Gemini و یا GapGPT</p>
              </div>
            </div>

            <form onSubmit={handleAiConfigSubmit} className="space-y-6">
              {aiConfigMsg && (
                <div className="bg-amber-500/10 border border-amber-500/20 text-amber-300 p-3 rounded-xl text-xs font-bold text-center">
                  {aiConfigMsg}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-slate-400 block">سرویس‌دهنده هوشمند فعال:</label>
                  <select
                    value={aiProvider}
                    onChange={(e) => setAiProvider(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-800 rounded-2xl focus focus text-xs font-black text-white text-right outline-none transition-all"
                  >
                    <option value="gemini">Google Gemini Global</option>
                    <option value="gapgpt">GapGPT (درگاه محلی ایران)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-slate-400 block">کلید دسترسی امنیتی (API Key):</label>
                  <input
                    type="password"
                    placeholder="••••••••••••••••••••••••"
                    value={aiApiKey}
                    onChange={(e) => setAiApiKey(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-800 rounded-2xl focus focus text-xs font-mono text-left text-white outline-none transition-all"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="submit"
                  disabled={aiLoading}
                  className="px-6 py-2 bg-amber-600 hover text-white font-black text-xs rounded-xl flex items-center gap-2 cursor-pointer"
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

          {/* STATS BENTO GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="bg-white border border-slate-100 p-6 rounded-[2.5rem] shadow-sm hover transition-all group overflow-hidden relative">
              <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-emerald-500/5 rounded-full group-hover:scale-150 transition-transform duration-700" />
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:rotate-6 transition-transform">
                    <DollarSign size={20} />
                  </div>
                  <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">بروز</span>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider">ارزش کل انبار</p>
                  <h3 className="text-xl font-black text-slate-800 tracking-tight">
                    {toPersianNum(products.reduce((acc, p) => acc + (p.bulk_price || p.price || 0) * (p.stock_quantity_cartons || 0) * (p.carton_pack_count || 24), 0).toLocaleString())} 
                    <span className="text-[10px] text-slate-400 font-bold mr-1">تومان</span>
                  </h3>
                </div>
                <div className="mt-4 h-8 w-full opacity-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={[{v:10}, {v:15}, {v:13}, {v:20}, {v:18}, {v:25}]}>
                      <Area type="monotone" dataKey="v" stroke="#10b981" fill="#10b98133" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-100 p-6 rounded-[2.5rem] shadow-sm hover transition-all group overflow-hidden relative">
              <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-blue-500/5 rounded-full group-hover:scale-150 transition-transform duration-700" />
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl group-hover:rotate-6 transition-transform">
                    <Package size={20} />
                  </div>
                  <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">{toPersianNum(products.length)} مدل</span>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider">تنوع کاتالوگ</p>
                  <h3 className="text-xl font-black text-slate-800 tracking-tight">
                    {toPersianNum(products.length)} <span className="text-[10px] text-slate-400 font-bold mr-1">کد کالایی</span>
                  </h3>
                </div>
                <div className="mt-4 h-8 w-full opacity-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[{v:5}, {v:8}, {v:6}, {v:10}, {v:7}, {v:12}]}>
                      <Bar dataKey="v" fill="#3b82f6" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-100 p-6 rounded-[2.5rem] shadow-sm hover transition-all group overflow-hidden relative">
              <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-amber-500/5 rounded-full group-hover:scale-150 transition-transform duration-700" />
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl group-hover:rotate-6 transition-transform">
                    <Percent size={20} />
                  </div>
                  <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full">واقعی</span>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider">میانگین تخفیف</p>
                  <h3 className="text-xl font-black text-slate-800 tracking-tight">
                    {(() => {
                      const avg = products.length > 0 
                        ? Math.round(
                            products.reduce((acc, p) => {
                              const pPrice = p.consumer_price || p.price || 0;
                              const pBulk = p.bulk_price || 0;
                              if (pPrice > 0 && pBulk > 0) {
                                return acc + (((pPrice - pBulk) / pPrice) * 100);
                              }
                              return acc;
                            }, 0) / products.length
                          )
                        : 0;
                      return toPersianNum(`${avg}٪`);
                    })()} <span className="text-[10px] text-slate-400 font-bold mr-1">روی قیمت کارخانه</span>
                  </h3>
                </div>
                <div className="mt-4 h-8 w-full opacity-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={[
                      {v: 0},
                      {v: products.length > 0 ? Math.round(products.reduce((acc, p) => acc + (p.bulk_price ? 5 : 0), 0) / products.length) : 0}
                    ]}>
                      <Line type="monotone" dataKey="v" stroke="#f59e0b" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-100 p-6 rounded-[2.5rem] shadow-sm hover transition-all group overflow-hidden relative">
              <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-indigo-500/5 rounded-full group-hover:scale-150 transition-transform duration-700" />
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl group-hover:rotate-6 transition-transform">
                    <Users size={20} />
                  </div>
                  <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">{toPersianNum(crmCustomers.filter(c => c.status === 'active').length)} فعال</span>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider">همکاران تجاری</p>
                  <h3 className="text-xl font-black text-slate-800 tracking-tight">
                    {toPersianNum(crmCustomers.length)} <span className="text-[10px] text-slate-400 font-bold mr-1">بنکدار ثبت شده</span>
                  </h3>
                </div>
                <div className="mt-4 h-8 w-full opacity-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={[
                      {v: 0},
                      {v: crmCustomers.length}
                    ]}>
                      <Area type="monotone" dataKey="v" stroke="#6366f1" fill="#6366f133" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>

          {/* REAL-TIME PRIORITIZED PENDING APPROVALS QUEUE */}
          <AdminPendingApprovals
            orders={orders}
            safeBuyRequests={safeBuyRequests}
            sponsoredAds={sponsoredAds}
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
                        <Tooltip formatter={(value: any) => toPersianNum(value.toLocaleString()) + " تومان"} />
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
                        <Tooltip formatter={(value: any) => toPersianNum(value.toString()) + " کالا"} />
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
                    callbackRequests.map((req) => {
                      const isPending = req.status === 'pending';
                      const isCalled = req.status === 'called';
                      
                      return (
                        <div 
                          key={req.id} 
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
                    supportTickets.map((ticket) => {
                      const isOpen = ticket.status === 'open' || !ticket.status;
                      const isProcessing = ticket.status === 'in_progress';
                      
                      return (
                        <div 
                          key={ticket.id} 
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
                                key={p.id}
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
                                    {p.image_url ? (
                                      <img 
                                        src={p.image_url} 
                                        alt={p.name} 
                                        referrerPolicy="no-referrer" 
                                        className="w-full h-full object-cover" 
                                        onError={(e) => { e.currentTarget.style.display = "none"; }}
                                      />
                                    ) : (
                                      <span className="text-[9px] font-black text-slate-400">بدون تصویر</span>
                                    )}
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
                        <div key={i} className="whitespace-pre-wrap">
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
                      {previewProducts.map((p) => {
                        const isSelected = selectedPreviewIds.includes(p.id);
                        return (
                          <div
                            key={p.id}
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
                                  src={p.image_url} 
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
                      className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl transition-all shadow-md cursor-pointer"
                    >
                      مدیریت و تایید آگهی‌های کف قیمت
                    </button>
                  </div>
                </div>

                {/* VIP WALLET CHARGER */}
                <div className="lg:col-span-1 bg-white border border-slate-100 p-6 sm:p-8 rounded-[2.5rem] shadow-xl space-y-6">
                  <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest border-b border-slate-50 pb-2">افزایش اعتبار فوری کیف‌پول VIP</h4>
                  
                  <div className="space-y-4">
                    <p className="text-[10px] text-slate-400 font-bold leading-relaxed">افزایش فوری موجودی جهت سفارش‌گذاری بدون محدودیت سقفی فاکتورها</p>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setBuyerCredit(prev => prev + 50000000);
                          setSuccessMsg("مبلغ ۵۰,۰۰۰,۰۰۰ ریال به کیف‌پول شما اضافه شد (محیط شبیه‌ساز پرداخت).");
                        }}
                        className="p-3 bg-slate-50 border border-slate-200/50 hover hover rounded-2xl text-[10px] font-black transition-all cursor-pointer"
                      >
                        + ۵ میلیون تومان
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setBuyerCredit(prev => prev + 200000000);
                          setSuccessMsg("مبلغ ۲۰۰,۰۰۰,۰۰۰ ریال به کیف‌پول شما اضافه شد (محیط شبیه‌ساز پرداخت).");
                        }}
                        className="p-3 bg-slate-50 border border-slate-200/50 hover hover rounded-2xl text-[10px] font-black transition-all cursor-pointer"
                      >
                        + ۲۰ میلیون تومان
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const amount = prompt("لطفا مبلغ شارژ سفارشی را به ریال وارد کنید:");
                        if (amount) {
                          setBuyerCredit(prev => prev + (Number(amount) || 0));
                          setSuccessMsg(`اعتبار با موفقیت به میزان ${toPersianNum(Number(amount).toLocaleString())} ریال افزایش یافت.`);
                        }
                      }}
                      className="w-full bg-indigo-600 hover text-white font-black text-xs py-3 rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
                    >
                      <Plus size={14} />
                      افزایش اعتبار با مبالغ دیگر
                    </button>
                  </div>
                </div>

              </div>
            )}

          </div>

        </div>
      )}

      {/* --- TAB: FACTORY PRODUCT AUDIT (ممیزی و تایید کالای کارخانه) --- */}
      {(activeSubTab as any) === 'factory_audit' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <AdminFactoryProductAudit
            products={products}
            onUpdateProduct={async (productId, updatedFields) => {
              await onUpdateProduct(productId, updatedFields);
              if (onRefreshProducts) await onRefreshProducts();
            }}
            onDeleteProduct={async (productId) => {
              await onDeleteProduct(productId);
              if (onRefreshProducts) await onRefreshProducts();
            }}
          />
        </div>
      )}

      {/* --- TAB: BARTER SYSTEM (تهاتر) --- */}
      {activeSubTab === 'barter' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 text-right" dir="rtl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-teal-500 rounded-3xl text-white shadow-material-lg">
                <RefreshCw size={28} className="animate-spin-slow" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 font-sans tracking-tight">پیشخوان مدیریت تهاتر (پایاپای)</h3>
                <p className="text-xs text-slate-400 font-bold mt-1">مدیریت تبادل مواد اولیه کارخانجات در ازای محصولات نهایی (B2B Barter)</p>
              </div>
            </div>
            
            <button 
              onClick={() => { setIsAddingBarter(!isAddingBarter); setEditingBarterId(null); }}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-teal-600 hover text-white rounded-2xl text-xs font-black transition-all shadow-material-md hover active:scale-95"
            >
              {isAddingBarter ? <X size={16} /> : <PlusCircle size={16} />}
              {isAddingBarter ? "انصراف از ثبت" : "ثبت قرارداد تهاتر جدید"}
            </button>
          </div>

          {isAddingBarter && (
            <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-material-xl animate-in zoom-in-95 duration-300">
              <div className="flex items-center gap-3 mb-8 pb-4 border-b border-slate-50">
                <div className="w-2 h-8 bg-teal-500 rounded-full" />
                <h4 className="text-base font-black text-slate-800">
                  {editingBarterId ? "ویرایش جزئیات قرارداد تهاتر" : "تعریف فرآیند تهاتر جدید"}
                </h4>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <div className="space-y-2 text-right">
                  <label className="block text-[11px] font-black text-slate-400 mr-2 uppercase tracking-widest">کارخانه مقصد (تولیدکننده)</label>
                  <input 
                    type="text"
                    value={bFormFactory}
                    onChange={(e) => setBFormFactory(e.target.value)}
                    placeholder="نام کارخانه یا واحد صنعتی..."
                    className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm focus focus transition-all font-bold placeholder"
                  />
                </div>
                
                <div className="space-y-2 text-right">
                  <label className="block text-[11px] font-black text-slate-400 mr-2 uppercase tracking-widest">تأمین‌کننده مواد اولیه</label>
                  <input 
                    type="text"
                    value={bFormSupplier}
                    onChange={(e) => setBFormSupplier(e.target.value)}
                    placeholder="نام شرکت بازرگانی یا تأمین‌کننده..."
                    className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm focus focus transition-all font-bold placeholder"
                  />
                </div>

                <div className="space-y-2 text-right">
                  <label className="block text-[11px] font-black text-slate-400 mr-2 uppercase tracking-widest">نوع ماده اولیه ورودی</label>
                  <select 
                    value={bFormMaterialId}
                    onChange={(e) => setBFormMaterialId(e.target.value)}
                    className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm focus focus transition-all font-bold"
                  >
                    {rawMaterials.map(rm => (
                      <option key={rm.id} value={rm.id}>{rm.name} ({rm.unit})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2 text-right">
                  <label className="block text-[11px] font-black text-slate-400 mr-2 uppercase tracking-widest">مقدار عددی ماده اولیه</label>
                  <input 
                    type="number"
                    value={bFormMaterialQty}
                    onChange={(e) => setBFormMaterialQty(Number(e.target.value))}
                    className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm focus focus transition-all font-bold"
                  />
                </div>

                <div className="space-y-2 text-right">
                  <label className="block text-[11px] font-black text-slate-400 mr-2 uppercase tracking-widest">کالا/محصول خروجی (جهت تسویه)</label>
                  <select 
                    value={bFormProductId}
                    onChange={(e) => setBFormProductId(e.target.value)}
                    className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm focus focus transition-all font-bold"
                  >
                    <option value="">انتخاب محصول نهایی...</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2 text-right">
                  <label className="block text-[11px] font-black text-slate-400 mr-2 uppercase tracking-widest">وضعیت فعلی قرارداد</label>
                  <select 
                    value={bFormStatus}
                    onChange={(e) => setBFormStatus(e.target.value)}
                    className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm focus focus transition-all font-bold"
                  >
                    <option value="در انتظار تایید مدارک">در انتظار تایید مدارک</option>
                    <option value="تایید نهایی شده">تایید نهایی شده</option>
                    <option value="در حال لجستیک">در حال لجستیک</option>
                    <option value="اتمام فرآیند و تسویه">اتمام فرآیند و تسویه</option>
                  </select>
                </div>
              </div>

              <div className="mt-8 space-y-2 text-right">
                <label className="block text-[11px] font-black text-slate-400 mr-2 uppercase tracking-widest">توضیحات و شروط اختصاصی تهاتر</label>
                <textarea 
                  value={bFormDesc}
                  onChange={(e) => setBFormDesc(e.target.value)}
                  placeholder="مثال: نرخ تبدیل بر اساس قیمت روز بورس کالا محاسبه می‌گردد..."
                  className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm focus focus transition-all font-bold h-32 placeholder"
                />
              </div>

              <div className="mt-10 flex justify-start">
                <button 
                  onClick={handleCreateOrUpdateBarter}
                  className="px-10 py-4 bg-teal-600 hover text-white rounded-2xl text-sm font-black transition-all shadow-material-lg hover:-translate-y-1"
                >
                  {editingBarterId ? "بروزرسانی نهایی قرارداد" : "ثبت و ارسال به کارتابل تهاتر"}
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {barterDeals.map((deal) => (
              <div 
                key={deal.id} 
                className="bg-white rounded-[2rem] border border-slate-100 p-8 shadow-material-md hover transition-all duration-500 group relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-32 h-32 bg-teal-50 rounded-full -ml-16 -mt-16 group-hover:scale-150 transition-transform duration-700 opacity-50" />
                
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center shadow-inner">
                        <Package size={24} />
                      </div>
                      <div>
                        <h5 className="text-sm font-black text-slate-900 mb-1">{deal.factoryName}</h5>
                        <p className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                          <Calendar size={10} />
                          ثبت شده در: {deal.dealDate}
                        </p>
                      </div>
                    </div>
                    <span className={`px-4 py-1.5 rounded-full text-[9px] font-black ${
                      deal.status === 'اتمام فرآیند و تسویه' ? 'bg-emerald-100 text-emerald-700' :
                      deal.status === 'در حال لجستیک' ? 'bg-blue-100 text-blue-700' :
                      deal.status === 'تایید نهایی شده' ? 'bg-teal-100 text-teal-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {deal.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-50">
                      <p className="text-[9px] font-black text-slate-400 mb-2 uppercase tracking-tighter">ورودی (ماده اولیه)</p>
                      <p className="text-xs font-black text-slate-800 mb-1">{deal.materialName}</p>
                      <p className="text-[11px] font-bold text-teal-600">{deal.materialQty} {deal.materialUnit}</p>
                    </div>
                    <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-50">
                      <p className="text-[9px] font-black text-slate-400 mb-2 uppercase tracking-tighter">خروجی (کالا جهت تسویه)</p>
                      <p className="text-xs font-black text-slate-800 mb-1">{deal.requestedProductName}</p>
                      <p className="text-[11px] font-bold text-teal-600">{deal.requestedQtyCartons.toLocaleString()} کارتن</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleEditBarterClick(deal)}
                        className="p-3 bg-slate-50 text-slate-500 hover hover rounded-xl transition-colors"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDeleteBarter(deal.id)}
                        className="p-3 bg-slate-50 text-slate-500 hover hover rounded-xl transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-[9px] font-black text-slate-400 mb-1">ارزش کل مبادله (برآوردی)</p>
                      <p className="text-sm font-black text-slate-900">
                        {deal.totalMaterialValue.toLocaleString()} <span className="text-[10px] text-slate-400 mr-1">ریال</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-amber-50 border border-amber-100 p-6 rounded-3xl flex gap-4 items-start shadow-material-sm">
            <div className="p-2 bg-white rounded-xl text-amber-600 shadow-sm">
              <Zap size={20} />
            </div>
            <div>
              <p className="text-xs font-black text-amber-900 mb-1">راهنمای هوشمند تهاتر:</p>
              <p className="text-[11px] text-amber-800/80 font-bold leading-relaxed">
                در سیستم تهاتر، کارخانجات می‌توانند مواد اولیه مورد نیاز خود را از تأمین‌کنندگان سامانه دریافت کرده و هزینه آن را از طریق واگذاری محصولات تولیدی خود (فاکتور عمده) تسویه نمایند. سامانه بصورت هوشمند نرخ تبدیل و ارزش افزوده مبادله را بر اساس قیمت‌های مصوب کاتالوگ محاسبه می‌کند.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB: DEDICATED REAL-TIME PRIORITIZED APPROVALS QUEUE --- */}
      {activeSubTab === 'approvals' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 text-right" dir="rtl">
          <AdminPendingApprovals
            orders={orders}
            safeBuyRequests={safeBuyRequests}
            sponsoredAds={sponsoredAds}
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
            onUpdateBarterStatus={handleUpdateBarterStatus}
            onUpdateCallback={handleUpdateCallback}
            onUpdateTicketStatus={handleUpdateTicketStatus}
            onNavigateTab={(tab) => {
              setActiveSubTab(tab as any);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        </div>
      )}

      {/* --- TAB: NEWS & ARTICLES MANAGEMENT --- */}
      {activeSubTab === 'news' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 text-right" dir="rtl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-rose-500 rounded-3xl text-white shadow-material-lg">
                <Newspaper size={28} />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 font-sans tracking-tight">مدیریت اخبار و مقالات سامانه</h3>
                <p className="text-xs text-slate-400 font-bold mt-1">انتشار اطلاعیه‌ها، اخبار بازار و راهنماهای آموزشی برای بنکداران</p>
              </div>
            </div>
            
            <button 
              onClick={() => { setIsAddingNews(!isAddingNews); setEditingNewsId(null); }}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-rose-600 hover text-white rounded-2xl text-xs font-black transition-all shadow-material-md hover active:scale-95"
            >
              {isAddingNews ? <X size={16} /> : <PlusCircle size={16} />}
              {isAddingNews ? "انصراف از ثبت" : "انتشار مطلب جدید"}
            </button>
          </div>

          {isAddingNews && (
            <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-material-xl animate-in zoom-in-95 duration-300">
              <div className="flex items-center gap-3 mb-8 pb-4 border-b border-slate-50">
                <div className="w-2 h-8 bg-rose-500 rounded-full" />
                <h4 className="text-base font-black text-slate-800">
                  {editingNewsId ? "ویرایش مقاله / خبر" : "ایجاد محتوای جدید"}
                </h4>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2 text-right">
                  <label className="block text-[11px] font-black text-slate-400 mr-2 uppercase tracking-widest">عنوان اصلی خبر</label>
                  <input 
                    type="text"
                    value={newsTitle}
                    onChange={(e) => setNewsTitle(e.target.value)}
                    placeholder="تیتر جذاب خبری..."
                    className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm focus focus transition-all font-bold placeholder"
                  />
                </div>
                
                <div className="space-y-2 text-right">
                  <label className="block text-[11px] font-black text-slate-400 mr-2 uppercase tracking-widest">دسته موضوعی</label>
                  <select 
                    value={newsCategory}
                    onChange={(e) => setNewsCategory(e.target.value)}
                    className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm focus focus transition-all font-bold"
                  >
                    <option value="تنظیم بازار">تنظیم بازار و سهمیه</option>
                    <option value="خط تولید">اخبار خط تولید</option>
                    <option value="توزیع">لجستیک و توزیع</option>
                    <option value="گزارش مالی">گزارشات مالی و سود</option>
                    <option value="تخفیف ویژه">جشنواره و تخفیفات</option>
                  </select>
                </div>

                <div className="space-y-2 text-right md:col-span-2">
                  <label className="block text-[11px] font-black text-slate-400 mr-2 uppercase tracking-widest">خلاصه کوتاه (جهت نمایش در کارت)</label>
                  <input 
                    type="text"
                    value={newsSummary}
                    onChange={(e) => setNewsSummary(e.target.value)}
                    placeholder="یک یا دو جمله توضیح کوتاه..."
                    className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm focus focus transition-all font-bold placeholder"
                  />
                </div>

                <div className="space-y-2 text-right">
                  <label className="block text-[11px] font-black text-slate-400 mr-2 uppercase tracking-widest">تصویر شاخص (URL)</label>
                  <input 
                    type="text"
                    value={newsImage}
                    onChange={(e) => setNewsImage(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm focus focus transition-all font-bold placeholder"
                  />
                </div>

                <div className="space-y-2 text-right">
                  <label className="block text-[11px] font-black text-slate-400 mr-2 uppercase tracking-widest">منبع خبر</label>
                  <input 
                    type="text"
                    value={newsSource}
                    onChange={(e) => setNewsSource(e.target.value)}
                    placeholder="مثال: روابط عمومی دست اول"
                    className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm focus focus transition-all font-bold placeholder"
                  />
                </div>
              </div>

              <div className="mt-8 space-y-2 text-right">
                <label className="block text-[11px] font-black text-slate-400 mr-2 uppercase tracking-widest">متن کامل مقاله / خبر</label>
                <textarea 
                  value={newsContent}
                  onChange={(e) => setNewsContent(e.target.value)}
                  placeholder="محتوای اصلی را اینجا بنویسید..."
                  className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm focus focus transition-all font-bold h-64 placeholder"
                />
              </div>

              <div className="mt-10 flex justify-start">
                <button 
                  onClick={handleCreateOrUpdateNews}
                  className="px-10 py-4 bg-rose-600 hover text-white rounded-2xl text-sm font-black transition-all shadow-material-lg hover:-translate-y-1"
                >
                  {editingNewsId ? "بروزرسانی نهایی مطلب" : "انتشار و نمایش"}
                </button>
              </div>
            </div>
          )}

          {articles.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-sm">
              <Newspaper className="mx-auto text-slate-300 mb-3" size={40} />
              <p className="text-sm font-black text-slate-700">هیچ خبری یا مقاله‌ای ثبت نشده است</p>
              <p className="text-xs text-slate-400 font-bold mt-1">جهت افزودن خبر جدید روی دکمه «افزودن خبر جدید» کلیک کنید.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {articles.map((article, idx) => (
                <div 
                  key={article.id || `news-${idx}`} 
                  className="bg-white rounded-[2rem] border border-slate-100 p-6 shadow-material-md hover transition-all duration-500 group flex gap-6"
                >
                  <div className="w-32 h-32 rounded-2xl overflow-hidden shrink-0 shadow-inner border border-slate-50">
                    <img src={article.imageUrl} alt={article.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" referrerPolicy="no-referrer" />
                  </div>
                  
                  <div className="flex flex-col justify-between flex-1">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <span className="px-3 py-1 bg-rose-50 text-rose-600 rounded-full text-[9px] font-black uppercase tracking-tighter">
                          {article.category}
                        </span>
                        <p className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                          <Calendar size={10} />
                          {article.date}
                        </p>
                      </div>
                      <h5 className="text-sm font-black text-slate-900 mb-2 line-clamp-1">{article.title}</h5>
                      <p className="text-[11px] text-slate-500 font-bold line-clamp-2 leading-relaxed">{article.summary}</p>
                    </div>

                    <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-50">
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleEditNewsClick(article)}
                          className="p-2.5 bg-slate-50 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors cursor-pointer"
                          title="ویرایش مطلب"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button 
                          onClick={() => handleDeleteNews(article.id, idx)}
                          className="p-2.5 bg-slate-50 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                          title="حذف مطلب"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      
                      <div className="text-right">
                        <p className="text-[9px] font-black text-slate-400">منبع: {article.source}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="bg-rose-50 border border-rose-100 p-6 rounded-3xl flex gap-4 items-start shadow-material-sm">
            <div className="p-2 bg-white rounded-xl text-rose-600 shadow-sm">
              <Zap size={20} />
            </div>
            <div>
              <p className="text-xs font-black text-rose-900 mb-1">راهنمای تولید محتوا:</p>
              <p className="text-[11px] text-rose-800/80 font-bold leading-relaxed">
                انتشار اخبار و مقالات آموزشی باعث افزایش درگیری بنکداران با سامانه می‌شود. مطالبی در مورد تغییرات قیمت، تخفیفات دوره‌ای کارخانجات و راهنماهای سودآوری بیشترین بازدید را دارند.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB: REPRESENTATIVES MANAGEMENT --- */}
      {activeSubTab === 'representatives' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 text-right" dir="rtl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/15 text-teal-600 flex items-center justify-center shrink-0">
                <Building2 size={24} />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">مدیریت دفاتر و نمایندگان سراسری</h3>
                <p className="text-xs text-slate-400 font-bold mt-0.5">مشخصات، تلفن و آدرس نمایندگان رسمی توزیع در استان‌های کشور را ویرایش و مدیریت کنید.</p>
              </div>
            </div>

            <button
              onClick={() => handleOpenRepModal()}
              className="px-5 py-3 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-black flex items-center justify-center gap-2 transition-all shadow-lg shadow-teal-600/20 cursor-pointer shrink-0"
            >
              <Plus size={16} />
              <span>افزودن نماینده جدید</span>
            </button>
          </div>

          {/* Representatives Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {representativesList.map((rep) => (
              <div
                key={rep.id}
                className="bg-white rounded-3xl border border-slate-150 p-5 shadow-sm hover:shadow-md transition-all relative overflow-hidden flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-md bg-teal-500/10 text-teal-700 text-[9px] font-black border border-teal-500/15">
                        {rep.badge || "نماینده فعال"}
                      </span>
                      {rep.isApproved !== false ? (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[9px] font-black border border-emerald-100">
                          تایید شده
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 text-[9px] font-black border border-amber-100 animate-pulse">
                          در انتظار تایید
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-black text-slate-800 flex items-center gap-1">
                      <MapPin size={13} className="text-teal-600" />
                      {rep.city}
                    </span>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                      <Users size={14} className="text-slate-400" />
                      {rep.name}
                    </h4>
                    {rep.agencyCode && (
                      <p className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5">
                        <span className="text-slate-400">کد نمایندگی:</span>
                        <span className="font-mono bg-slate-50 px-2 py-0.5 rounded border border-slate-100 font-black text-indigo-700">{rep.agencyCode}</span>
                      </p>
                    )}
                    <p className="text-xs font-mono font-black text-emerald-600 flex items-center gap-1.5">
                      <Phone size={13} className="text-emerald-500" />
                      {rep.phone}
                    </p>
                    {rep.address && (
                      <p className="text-[11px] font-bold text-slate-500 leading-relaxed pt-1">
                        آدرس: {rep.address}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100 gap-2">
                  <div className="flex items-center gap-1">
                    {rep.isApproved !== false ? (
                      <button
                        onClick={() => setSelectedRepForCertificate(rep)}
                        className="px-2.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-[10px] font-black flex items-center gap-1 transition-all cursor-pointer"
                      >
                        <Award size={13} />
                        <span>برگه نمایندگی</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleFastApproveRep(rep)}
                        className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black flex items-center gap-1 transition-all cursor-pointer"
                      >
                        <Check size={13} />
                        <span>تایید فوری</span>
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenRepModal(rep)}
                      className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-black flex items-center gap-1 transition-all cursor-pointer"
                    >
                      <Edit3 size={13} />
                      <span>ویرایش</span>
                    </button>
                    <button
                      onClick={() => handleDeleteRepresentative(rep.id)}
                      className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 text-[10px] font-black flex items-center gap-1 transition-all cursor-pointer"
                    >
                      <Trash2 size={13} />
                      <span>حذف</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Add / Edit Modal */}
          <AnimatePresence>
            {showRepModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-white/60 backdrop-blur-sm">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white w-full max-w-lg rounded-3xl p-6 border border-slate-100 shadow-2xl space-y-5 text-right"
                  dir="rtl"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                      <Building2 size={18} className="text-teal-600" />
                      {editingRep ? "ویرایش مشخصات نماینده" : "افزودن نماینده جدید"}
                    </h4>
                    <button
                      onClick={() => setShowRepModal(false)}
                      className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-all cursor-pointer"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  <div className="space-y-3.5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-black text-slate-500 mb-1">استان و شهر:</label>
                        <input
                          type="text"
                          value={repCity}
                          onChange={(e) => setRepCity(e.target.value)}
                          placeholder="مثال: اصفهان"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold focus:border-teal-500 outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-black text-slate-500 mb-1">نام مدیر دفتر / نماینده:</label>
                        <input
                          type="text"
                          value={repName}
                          onChange={(e) => setRepName(e.target.value)}
                          placeholder="مثال: حاج رضا مهدوی"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold focus:border-teal-500 outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-black text-slate-500 mb-1">شماره همراه / پشتیبانی:</label>
                        <input
                          type="text"
                          value={repPhone}
                          onChange={(e) => setRepPhone(e.target.value)}
                          placeholder="مثال: ۰۹۱۲۳۴۵۶۷۸۹"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold font-mono focus:border-teal-500 outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-black text-slate-500 mb-1">نوع نمایندگی / نشان:</label>
                        <select
                          value={repBadge}
                          onChange={(e) => setRepBadge(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold focus:border-teal-500 outline-none"
                        >
                          <option value="نماینده فعال">نماینده فعال</option>
                          <option value="دفتر مرکزی">دفتر مرکزی</option>
                          <option value="نماینده انحصاری">نماینده انحصاری</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-slate-500 mb-1">آدرس کامل دفتر / انبار پخش:</label>
                      <textarea
                        rows={3}
                        value={repAddress}
                        onChange={(e) => setRepAddress(e.target.value)}
                        placeholder="خیابان، میدان، مجتمع، پلاک..."
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold focus:border-teal-500 outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="block text-[10px] font-black text-slate-500 mb-1">وضعیت تایید نمایندگی:</label>
                        <select
                          value={repIsApproved ? "approved" : "pending"}
                          onChange={(e) => setRepIsApproved(e.target.value === "approved")}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold focus:border-teal-500 outline-none"
                        >
                          <option value="approved">تایید شده رسمی</option>
                          <option value="pending">در انتظار تایید مدارک</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-black text-slate-500 mb-1">کد رسمی نمایندگی:</label>
                        <input
                          type="text"
                          value={repAgencyCode}
                          onChange={(e) => setRepAgencyCode(e.target.value)}
                          placeholder="مثال: AGN-1405-5001"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold font-mono focus:border-teal-500 outline-none"
                        />
                        <span className="text-[9px] text-slate-400 font-bold block mt-1">در صورت خالی بودن، به صورت خودکار صادر می‌شود.</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                    <button
                      onClick={() => setShowRepModal(false)}
                      className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-600 text-xs font-black hover:bg-slate-200 transition-all cursor-pointer"
                    >
                      انصراف
                    </button>
                    <button
                      onClick={handleSaveRepresentative}
                      className="px-6 py-2.5 rounded-xl bg-teal-600 text-white text-xs font-black hover:bg-teal-700 transition-all shadow-md shadow-teal-600/20 cursor-pointer"
                    >
                      ذخیره اطلاعات
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* --- TAB 1: PRODUCT CATALOG & STOCK --- */}
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

      {/* --- SYSTEM & INFRASTRUCTURE TAB --- */}
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

      {/* --- TAB 3: REPORTS --- */}
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
                  <Layers2 className={activeText} size={18} />
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

                    <div className="pt-2">
                      <label className="text-[11px] font-black text-emerald-900 block mb-1">کد پروانه بهداشتی / شماره سیب سلامت:</label>
                      <input
                        type="text"
                        value={healthCertCode}
                        onChange={e => setHealthCertCode(e.target.value)}
                        placeholder="مثال: ۱۶/۱۲۴۵۸"
                        className="w-full sm:w-64 px-3 py-1.5 bg-white border border-emerald-200 rounded-xl text-xs font-mono font-black text-emerald-950 text-right"
                      />
                    </div>
                  </div>

                  <div className="space-y-1 flex items-center gap-3 pt-2">
                    <input
                      type="checkbox"
                      id="isFavorite"
                      checked={isFavorite}
                      onChange={e => setIsFavorite(e.target.checked)}
                      className="w-5 h-5 rounded-lg border-slate-200 text-emerald-600 focus"
                    />
                    <label htmlFor="isFavorite" className="text-xs font-black text-slate-700 cursor-pointer select-none">افزودن به لیست علاقه‌مندی‌های پیش‌فرض</label>
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
              <Layers size={16} className={activeText} />
              کاتالوگ کالاهای تجاری عضو سامانه ({toPersianNum(products.length)} کالا)
            </h3>

            {/* Grid display table / Cards for mobile */}
            <div className="block lg:hidden space-y-4">
              {products.length === 0 ? (
                <div className="p-8 text-center text-slate-500 font-bold text-sm bg-slate-50 rounded-3xl">
                  هیچ کالایی یافت نشد.
                </div>
              ) : (
                products.map((p) => (
                  <div 
                    key={`products-card-${p.id}`}
                    className={`bg-white border rounded-3xl p-5 shadow-sm transition-all ${
                      selectedProductIds.includes(p.id) ? "border-emerald-500 bg-emerald-50/10" : "border-slate-100"
                    } ${p.disabled ? "opacity-60 grayscale" : ""}`}
                  >
                    <div className="flex gap-4 mb-4">
                      <div className="relative">
                        {p.image_url ? (
                          <img 
                            src={p.image_url} 
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
                    products.map((p) => (
                      <tr 
                        key={`products-admin-${p.id}`} 
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
                              src={p.image_url} 
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

                        {/* --- TAB: SITE BUILDER / PAGES --- */}
      {activeSubTab === 'pages' && (
        <div className="space-y-6">
          <div className="bg-white rounded-[2rem] border border-gray-100 shadow-xl overflow-hidden p-8">
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-50">
              <div>
                <h3 className="text-base font-black text-slate-900">مدیریت محتوای صفحات و نوشته‌ها</h3>
                <p className="text-[10px] text-gray-400 font-bold">متن‌ها، تصاویر و چیدمان صفحات سایت را ویرایش کنید.</p>
              </div>
              <button className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-black shadow-lg shadow-indigo-600/10 hover transition-all">
                <Plus size={16} />
                ایجاد صفحه جدید
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {/* Sidebar: Page List */}
              <div className="md:col-span-1 space-y-2 border-l border-gray-50 pl-6">
                <p className="text-[10px] font-black text-slate-400 mb-4 px-2 uppercase tracking-widest">لیست صفحات فعال</p>
                {sitePages.map(page => (
                  <button
                    key={page.id}
                    onClick={() => {
                      setActivePageId(page.id);
                      setPageEditorContent(page.content);
                    }}
                    className={`w-full text-right p-4 rounded-2xl transition-all flex items-center justify-between group ${
                      activePageId === page.id 
                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/10" 
                        : "bg-slate-50 text-slate-600 hover"
                    }`}
                  >
                    <span className="text-xs font-black">{page.title}</span>
                    <ChevronRight size={14} className={activePageId === page.id ? "opacity-100" : "opacity-0 group-hover:opacity-100"} />
                  </button>
                ))}
              </div>

              {/* Main: Editor Area */}
              <div className="md:col-span-3">
                {activePageId ? (
                  <div className="space-y-6 animate-in fade-in duration-500">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-black text-slate-900">ویرایشگر محتوا: {sitePages.find(p => p.id === activePageId)?.title}</h4>
                      <div className="flex gap-2">
                        <button onClick={() => setActivePageId(null)} className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black">انصراف</button>
                        <button onClick={handleSavePage} className="px-6 py-2 bg-emerald-600 text-white rounded-xl text-[10px] font-black flex items-center gap-2 shadow-lg shadow-emerald-600/10">
                          <Save size={14} />
                          ذخیره نهایی صفحه
                        </button>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 flex items-center gap-3">
                        <Sparkles size={20} className="text-amber-500" />
                        <p className="text-[10px] font-bold text-amber-900">می‌توانید از تگ‌های HTML و یا متون ساده برای ویرایش استفاده کنید. بزودی ویرایشگر بصری کامل فعال می‌شود.</p>
                      </div>
                      
                      <textarea
                        value={pageEditorContent}
                        onChange={(e) => setPageEditorContent(e.target.value)}
                        className="w-full min-h-[400px] p-6 bg-slate-50 border border-slate-100 rounded-3xl font-mono text-xs leading-relaxed focus focus outline-none"
                        placeholder="محتوای صفحه را اینجا وارد کنید..."
                      />
                    </div>
                  </div>
                ) : (
                  <div className="h-full min-h-[400px] flex flex-col items-center justify-center space-y-4 text-center p-12 bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-200">
                    <div className="p-4 bg-white rounded-full shadow-sm">
                      <Edit3 size={32} className="text-slate-300" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-800">هیچ صفحه‌ای برای ویرایش انتخاب نشده است</h4>
                      <p className="text-xs text-slate-400 font-bold mt-1">یک صفحه از لیست سمت راست انتخاب کنید تا ویرایشگر بارگذاری شود.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      {/* --- TAB: PRODUCT SYNC & BUCKET STATUS --- */}
      {activeSubTab === 'product_sync_status' && (
        <ProductSyncStatusView
          products={products}
          onUpdateProducts={(updatedProds) => {
            updatedProds.forEach(p => {
              const existing = products.find(oldP => oldP.id === p.id || oldP.sku === p.sku);
              if (existing) {
                onUpdateProduct(p.id, p);
              } else {
                onAddProduct(p);
              }
            });
          }}
          b2bConfig={{ catalogPdfUrl }}
          onSaveB2bConfig={async (cfg) => {
            if (cfg.catalogPdfUrl) setCatalogPdfUrl(cfg.catalogPdfUrl);
            try {
              await fetch("/api/admin/b2b-config", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...b2bConfig, catalogPdfUrl: cfg.catalogPdfUrl })
              });
            } catch (e) {}
          }}
        />
      )}

      {/* --- TAB: CATALOG GENERATION --- */}
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
                <Palette className={activeText} size={20} />
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
                        <div key={slide.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl relative group">
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
                      <div className="text-[11px] font-black text-slate-500">حالت طراحی صفحه اختصاصی کارخانه:</div>
                      <div className="flex bg-slate-100 p-1 rounded-xl">
                        <button
                          type="button"
                          onClick={() => setFactoryProfileDesignMode('simple')}
                          className={`px-4 py-1.5 rounded-lg text-[10px] font-black transition-all ${factoryProfileDesignMode === 'simple' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500'}`}
                        >
                          حالت ساده (پیش‌فرض)
                        </button>
                        <button
                          type="button"
                          onClick={() => setFactoryProfileDesignMode('advanced')}
                          className={`px-4 py-1.5 rounded-lg text-[10px] font-black transition-all ${factoryProfileDesignMode === 'advanced' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
                        >
                          <Code2 size={12} className="inline ml-1" />
                          حالت پیشرفته (HTML/CSS)
                        </button>
                      </div>
                    </div>

                    {factoryProfileDesignMode === 'advanced' && (
                      <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 flex items-center gap-1">
                              کدهای سفارشی HTML:
                            </label>
                            <textarea 
                              rows={8}
                              value={factoryCustomHtml}
                              onChange={e => setFactoryCustomHtml(e.target.value)}
                              placeholder="<div>...</div>"
                              className="w-full px-4 py-3 bg-slate-50 text-emerald-700 border border-slate-200 rounded-xl text-xs font-mono leading-relaxed"
                              dir="ltr"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 flex items-center gap-1">
                              کدهای سفارشی CSS:
                            </label>
                            <textarea 
                              rows={8}
                              value={factoryCustomCss}
                              onChange={e => setFactoryCustomCss(e.target.value)}
                              placeholder=".custom-class { ... }"
                              className="w-full px-4 py-3 bg-slate-50 text-blue-700 border border-slate-200 rounded-xl text-xs font-mono leading-relaxed"
                              dir="ltr"
                            />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-400 flex items-center gap-1">
                            کدهای سفارشی JavaScript:
                          </label>
                          <textarea 
                            rows={3}
                            value={factoryCustomJs}
                            onChange={e => setFactoryCustomJs(e.target.value)}
                            placeholder="console.log('Factory Page Loaded');"
                            className="w-full px-4 py-3 bg-slate-50 text-amber-700 border border-slate-200 rounded-xl text-xs font-mono leading-relaxed"
                            dir="ltr"
                          />
                        </div>
                        <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-[10px] text-blue-700 font-bold leading-relaxed">
                          در حالت پیشرفته، شما می‌توانید ساختار نمایشی پروفایل کارخانه را کاملاً تغییر دهید. این کدها در صفحه اختصاصی کارخانه رندر خواهند شد.
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black text-slate-500 block">توضیحات و بیوگرافی تولیدکننده:</label>
                    <textarea 
                      rows={3}
                      value={factoryDesc}
                      onChange={e => setFactoryDesc(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold leading-relaxed"
                    />
                  </div>

                  {/* Catalogs Manager Section */}
                  <div className="border-t border-slate-100 pt-6 space-y-4">
                    <label className="text-[11px] font-black text-slate-500 block">افزودن و مدیریت کاتالوگ‌های کارخانه:</label>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <input 
                        type="text"
                        placeholder="عنوان کاتالوگ (مثال: کاتالوگ تخصصی تیرماه)"
                        value={newCatalogName}
                        onChange={e => setNewCatalogName(e.target.value)}
                        className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                      />
                      <input 
                        type="text"
                        placeholder="لینک دانلود کاتالوگ (URL)"
                        value={newCatalogUrl}
                        onChange={e => setNewCatalogUrl(e.target.value)}
                        className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                        dir="ltr"
                      />
                      <button 
                        type="button"
                        onClick={() => {
                          if (!newCatalogName || !newCatalogUrl) {
                            alert("لطفا هر دو فیلد نام و لینک کاتالوگ را پر کنید.");
                            return;
                          }
                          setFactoryCatalogs(prev => [...prev, { name: newCatalogName, url: newCatalogUrl }]);
                          setNewCatalogName("");
                          setNewCatalogUrl("");
                        }}
                        className="px-4 py-2 bg-slate-100 text-white rounded-xl text-xs font-black hover transition-all cursor-pointer"
                      >
                        + افزودن کاتالوگ
                      </button>
                    </div>

                    {factoryCatalogs.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                        {factoryCatalogs.map((cat, idx) => (
                          <div key={`admin-panel-cat-item-${cat.name || idx}-${idx}`} className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl border border-slate-150">
                            <button 
                              type="button"
                              onClick={() => setFactoryCatalogs(prev => prev.filter((_, i) => i !== idx))}
                              className="text-red-500 hover text-[10px] font-black bg-white shadow-sm px-2.5 py-1.5 rounded-lg border border-slate-100 cursor-pointer"
                            >
                              حذف
                            </button>
                            <div className="text-[11px] font-black text-slate-700 flex items-center gap-1.5">
                              <span>📄</span>
                              <span>{cat.name}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                    <button 
                      type="button"
                      onClick={() => setShowFactoryForm(false)}
                      className="px-6 py-2.5 rounded-xl text-xs font-black text-slate-400 hover transition-all cursor-pointer"
                    >
                      انصراف
                    </button>
                    <button 
                      type="submit"
                      className="px-8 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-600/20 cursor-pointer"
                    >
                      {isEditingFactory ? "بروزرسانی پروفایل کارخانه" : "ثبت نهایی در دیتابیس"}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-right">
            {factories.map((f) => {
              const activeProducts = products.filter(p => p.brand === f.name || (p.sellerName && p.sellerName.includes(f.name)));
              const isCurrentlyActive = f.isActive !== false;

              return (
                <motion.div 
                  key={f.id}
                  className={`bg-white border rounded-[2rem] p-6 shadow-sm hover transition-all group relative overflow-hidden flex flex-col justify-between ${
                    isCurrentlyActive ? 'border-slate-100' : 'border-rose-200 bg-rose-50/5'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-4 mb-4">
                      <span className={`text-[9px] font-black px-2.5 py-1 rounded-full ${
                        isCurrentlyActive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-100 text-rose-600'
                      }`}>
                        {isCurrentlyActive ? '🟢 فعال در پرتال' : '🔴 غیرفعال موقت'}
                      </span>
                      <div className="flex items-center gap-4">
                        <div className="space-y-1">
                          <h4 className="text-sm font-black text-slate-800">{f.name}</h4>
                          <p className="text-[10px] text-slate-400 font-bold">{f.location}</p>
                        </div>
                        <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 p-2 flex items-center justify-center overflow-hidden shrink-0 shadow-2xs">
                          <img 
                            src={getDisplayImageUrl(f.logoUrl)} 
                            alt={f.name} 
                            className="w-full h-full object-contain" 
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                          />
                        </div>
                      </div>
                    </div>

                    <p className="text-[10px] text-slate-500 font-bold leading-relaxed mb-6 line-clamp-2">
                      {f.description}
                    </p>

                    {/* Admin-only direct phone box */}
                    {f.contactPhone && (
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-150 text-[10px] font-bold text-slate-600 mb-4 flex justify-between items-center">
                        <span className="font-mono text-xs text-indigo-600 font-black" dir="ltr">{f.contactPhone}</span>
                        <span className="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded text-[8px] font-black">ویژه ادمین (مخفی از مشتری)</span>
                      </div>
                    )}

                    {/* Catalogs List */}
                    {f.catalogs && f.catalogs.length > 0 && (
                      <div className="space-y-1.5 mb-4 border-t border-slate-100 pt-3">
                        <span className="block text-[9px] text-slate-400 font-black">کاتالوگ‌های ضمیمه شده:</span>
                        <div className="flex flex-wrap gap-1">
                          {f.catalogs.map((cat: any, i: number) => (
                            <a 
                              key={`admin-panel-f-cat-${cat.id || i}-${i}`} 
                              href={cat.url} 
                              target="_blank" 
                              rel="referrer" 
                              className="text-[9px] font-black bg-blue-50 text-blue-600 border border-blue-100 px-2 py-0.5 rounded-lg flex items-center gap-1 hover transition-all"
                            >
                              📥 {cat.name}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-3 pt-4 border-t border-slate-50">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-black text-amber-500 bg-amber-50 px-2 py-0.5 rounded-lg flex items-center gap-1">
                          {f.rating} ⭐
                        </span>
                        <span className="text-[10px] font-bold text-slate-400">تاسیس {f.establishedYear}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-bold">
                        {toPersianNum(activeProducts.length)} محصول متصل
                      </span>
                    </div>

                    <div className="flex justify-between items-center gap-2">
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={() => handleToggleFactoryActive(f.id)}
                          className={`px-2.5 py-1.5 text-[9px] font-black rounded-lg transition-all border ${
                            isCurrentlyActive 
                              ? 'bg-rose-50 hover text-rose-600 border-rose-100' 
                              : 'bg-emerald-50 hover text-emerald-600 border-emerald-100'
                          } cursor-pointer`}
                        >
                          {isCurrentlyActive ? 'غیرفعال‌سازی' : 'فعال‌سازی'}
                        </button>
                        <button 
                          onClick={() => handleToggleFactoryFeatured(f.id)}
                          className={`px-2.5 py-1.5 text-[9px] font-black rounded-lg transition-all border ${
                            f.isFeatured || f.isPinned
                              ? 'bg-amber-50 text-amber-700 border-amber-200' 
                              : 'bg-slate-50 text-slate-500 border-slate-200'
                          } cursor-pointer`}
                        >
                          {f.isFeatured || f.isPinned ? '⭐ ویژه (سنجاق)' : '⭐ عادی'}
                        </button>
                        <button 
                          onClick={() => setSelectedFactoryForProducts(f)}
                          className="px-2.5 py-1.5 bg-slate-50 hover text-slate-600 border border-slate-200 text-[9px] font-black rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                        >
                          🔍 کالاها
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button 
                          onClick={() => handleEditFactory(f)}
                          className="p-2 bg-slate-50 text-slate-400 hover hover rounded-lg transition-all cursor-pointer"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button 
                          onClick={() => handleDeleteFactory(f.id)}
                          className="p-2 bg-slate-50 text-slate-400 hover hover rounded-lg transition-all cursor-pointer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* --- TAB: CRM --- */}
      {activeSubTab === 'crm' && (
        <div className="space-y-6" dir="rtl">
          {/* CRM Quick Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 font-bold block mb-0.5">کل بنکداران ثبت‌شده</span>
                <span className="text-xl font-black text-slate-900">{toPersianNum(crmCustomers.length)} نفر</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black">
                <Users size={20} />
              </div>
            </div>

            <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 font-bold block mb-0.5">اعضای ویژه & طلایی</span>
                <span className="text-xl font-black text-amber-600">
                  {toPersianNum(crmCustomers.filter(c => c.badge === 'vip' || c.badge === 'gold').length)} نفر
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-black">
                ⭐
              </div>
            </div>

            <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 font-bold block mb-0.5">وضعیت فعال تاییدشده</span>
                <span className="text-xl font-black text-emerald-600">
                  {toPersianNum(crmCustomers.filter(c => c.status === 'active').length)} نفر
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black">
                <ShieldCheck size={20} />
              </div>
            </div>

            <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 font-bold block mb-0.5">شهرهای فعال شبکه</span>
                <span className="text-xl font-black text-sky-600">
                  {toPersianNum(new Set(crmCustomers.map(c => c.city).filter(Boolean)).size)} شهر
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-black">
                <MapPin size={20} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl p-6 md:p-8 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
              <button 
                onClick={handleAddCrmClick}
                className="px-5 py-3 bg-indigo-600 text-white rounded-2xl font-black text-xs flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/10 cursor-pointer"
              >
                <Plus size={16} />
                افزودن مشتری (بنکدار) جدید
              </button>

              <button 
                type="button"
                onClick={() => handleExportCrmCsv(crmCustomers)}
                className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-black text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                title="دانلود خروجی فایل اکسل/CSV"
              >
                <Download size={16} />
                خروجی CSV/اکسل
              </button>
            </div>

            <div className="relative w-full md:w-80">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text"
                placeholder="جستجوی نام بنکدار، شرکت پخش یا شماره..."
                value={crmSearch}
                onChange={e => setCrmSearch(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl pr-12 pl-4 py-3 text-xs text-slate-800 focus:bg-white transition-all outline-none text-right font-bold"
              />
            </div>

            <div className="space-y-1 text-right">
              <h3 className="text-xl font-black text-slate-900 flex items-center gap-2 justify-end">
                باشگاه مشتریان و مدیریت بنکداران
                <Users className="text-indigo-600" size={22} />
              </h3>
              <p className="text-[11px] text-slate-400 font-bold">تحلیل رفتار خرید، دسته‌بندی هوشمند و خروجی لیست عمده‌فروشان کشور</p>
            </div>
          </div>

          {/* CRM Filter Pills */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2 bg-white border border-slate-100 p-2.5 rounded-2xl shadow-sm">
              <span className="text-xs font-black text-slate-500 ml-2">فیلتر بر اساس نشان:</span>
              {[
                { id: 'all', label: 'همه نشان‌ها' },
                { id: 'vip', label: '👑 ویژه VIP' },
                { id: 'gold', label: '🥇 طلایی' },
                { id: 'silver', label: '🥈 نقره‌ای' },
                { id: 'bronze', label: '🥉 برنزی' }
              ].map((pill) => (
                <button
                  key={pill.id}
                  type="button"
                  onClick={() => setCrmBadgeFilter(pill.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    crmBadgeFilter === pill.id
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/60'
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2 bg-white border border-slate-100 p-2.5 rounded-2xl shadow-sm">
              <span className="text-xs font-black text-slate-500 ml-2">فیلتر بر اساس نقش کاربر:</span>
              {[
                { id: 'all', label: 'همه نقش‌ها' },
                { id: 'customer', label: '👥 مشتری' },
                { id: 'representative', label: '🛡️ نماینده' },
                { id: 'marketer', label: '📣 بازاریاب' },
                { id: 'factory', label: '🏭 کارخانه' }
              ].map((pill) => {
                const count = crmCustomers.filter(c => pill.id === 'all' || c.role === pill.id || (!c.role && pill.id === 'customer')).length;
                return (
                  <button
                    key={pill.id}
                    type="button"
                    onClick={() => setCrmRoleFilter(pill.id as any)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                      crmRoleFilter === pill.id
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/60'
                    }`}
                  >
                    {pill.label} ({toPersianNum(count)})
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {crmLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <RefreshCw className="animate-spin text-indigo-500" size={40} />
                <span className="text-xs font-black text-slate-400">در حال فراخوانی پایگاه داده کاربران...</span>
              </div>
            ) : (() => {
              const filteredCrmList = crmCustomers.filter(c => {
                const matchesSearch = 
                  (c.name || '').toLowerCase().includes(crmSearch.toLowerCase()) || 
                  (c.company || '').toLowerCase().includes(crmSearch.toLowerCase()) || 
                  (c.phone || '').toLowerCase().includes(crmSearch.toLowerCase()) ||
                  (c.city || '').toLowerCase().includes(crmSearch.toLowerCase());
                
                const matchesBadge = crmBadgeFilter === 'all' || c.badge === crmBadgeFilter;
                const matchesRole = crmRoleFilter === 'all' || c.role === crmRoleFilter || (!c.role && crmRoleFilter === 'customer');
                return matchesSearch && matchesBadge && matchesRole;
              });
              return (
                <>
                  {/* CRM Batch Actions Toolbar */}
                  {filteredCrmList.length > 0 && (
                    <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 animate-fade-in">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => handleToggleSelectAllCrm(filteredCrmList)}
                          className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 font-bold border border-slate-200 rounded-xl text-xs transition-all flex items-center gap-2 cursor-pointer shadow-sm"
                        >
                          <input
                            type="checkbox"
                            className="rounded border-slate-300 pointer-events-none cursor-pointer"
                            checked={filteredCrmList.length > 0 && filteredCrmList.every(c => selectedCrmIds.includes(c.id))}
                            readOnly
                          />
                          <span>
                            {filteredCrmList.every(c => selectedCrmIds.includes(c.id)) ? "لغو انتخاب همه" : "انتخاب همه این لیست"}
                          </span>
                        </button>

                        {selectedCrmIds.length > 0 && (
                          <span className="text-xs text-indigo-700 font-black">
                            {toPersianNum(selectedCrmIds.length)} بنکدار انتخاب شده است
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {selectedCrmIds.length > 0 && (
                          <>
                            <button
                              type="button"
                              onClick={() => setShowCrmBatchEditModal(true)}
                              className="px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-black border border-indigo-200/50 rounded-xl text-[10px] sm:text-xs transition-all flex items-center gap-1.5 cursor-pointer"
                            >
                              <Edit3 size={14} />
                              ویرایش گروهی ({toPersianNum(selectedCrmIds.length)})
                            </button>
                            <button
                              type="button"
                              onClick={() => handleExportCrmCsv(crmCustomers.filter(c => selectedCrmIds.includes(c.id)))}
                              className="px-4 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-black border border-emerald-200/50 rounded-xl text-[10px] sm:text-xs transition-all flex items-center gap-1.5 cursor-pointer"
                            >
                              <Download size={14} />
                              خروجی اکسل انتخاب‌شده‌ها
                            </button>
                            <button
                              type="button"
                              onClick={handleBatchDeleteCrm}
                              className="px-4 py-2 bg-red-50 text-red-700 hover:bg-red-100 font-black border border-red-200/50 rounded-xl text-[10px] sm:text-xs transition-all flex items-center gap-1.5 cursor-pointer"
                            >
                              <Trash2 size={14} />
                              حذف گروهی ({toPersianNum(selectedCrmIds.length)})
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {filteredCrmList.length === 0 ? (
                    <div className="text-center py-10 text-slate-400 font-bold text-xs">
                      هیچ بنکداری با این مشخصات یافت نشد.
                    </div>
                  ) : (
                    filteredCrmList.map((customer) => {
                      const isSelected = selectedCrmIds.includes(customer.id);
                      return (
                        <motion.div 
                          layout
                          key={customer.id}
                          className={`border rounded-[2.5rem] p-5 sm:p-6 hover transition-all group shadow-sm text-right ${
                            isSelected ? 'border-indigo-400 bg-indigo-50/10' : 'bg-white border-gray-100'
                          }`}
                        >
                          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                            <div className="flex items-center gap-3 sm:gap-4 w-full lg:w-auto">
                              {/* Checkbox selector */}
                              <div 
                                onClick={() => handleToggleSelectCrm(customer.id)}
                                className="w-10 h-10 flex items-center justify-center cursor-pointer hover:bg-slate-100 rounded-xl shrink-0"
                              >
                                <input 
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => {}}
                                  className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                />
                              </div>

                              <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-[1.2rem] sm:rounded-[1.5rem] flex items-center justify-center text-xl sm shadow-xl shrink-0 ${
                                customer.badge === 'vip' ? 'bg-purple-100 text-purple-600 shadow-purple-500/10' :
                                customer.badge === 'gold' ? 'bg-amber-100 text-amber-600 shadow-amber-500/10' :
                                customer.badge === 'silver' ? 'bg-slate-100 text-slate-600 shadow-slate-500/10' :
                                'bg-orange-100 text-orange-600 shadow-orange-500/10'
                              }`}>
                                {customer.badge === 'vip' ? '👑' : customer.badge === 'gold' ? '🥇' : customer.badge === 'silver' ? '🥈' : '🥉'}
                              </div>
                              <div className="space-y-1 text-right overflow-hidden">
                                <div className="flex items-center gap-2 justify-end">
                                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-full shrink-0 ${
                                    customer.role === 'representative' ? 'bg-indigo-100 text-indigo-700' :
                                    customer.role === 'marketer' ? 'bg-amber-100 text-amber-700' :
                                    customer.role === 'factory' ? 'bg-pink-100 text-pink-700' :
                                    'bg-slate-100 text-slate-700'
                                  }`}>
                                    {customer.role === 'representative' ? '🛡️ نماینده' :
                                     customer.role === 'marketer' ? '📣 بازاریاب' :
                                     customer.role === 'factory' ? '🏭 کارخانه' :
                                     '👥 مشتری'}
                                  </span>
                                  <h4 className="text-sm font-black text-slate-800 group-hover transition-colors truncate">{customer.company}</h4>
                                </div>
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-slate-400 font-bold justify-end">
                                   <span className="flex items-center gap-1">{customer.city} <MapPin size={10} /></span>
                                   <span className="flex items-center gap-1" dir="ltr">{customer.phone} <Phone size={10} /></span>
                                   <span className="flex items-center gap-1">{customer.name} <Users size={10} /></span>
                                </div>
                              </div>
                            </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-8 w-full lg:w-auto border-t lg border-gray-100 pt-4 lg:pt-0">
                      <div className="text-center lg">
                        <span className="block text-[9px] text-slate-400 font-black mb-1">تعداد سفارشات</span>
                        <span className="text-[10px] sm font-black text-indigo-600 bg-indigo-50 px-2 sm:px-3 py-1 rounded-lg">{toPersianNum(customer.totalOrdersCount)} فاکتور</span>
                      </div>
                      <div className="text-center lg">
                        <span className="block text-[9px] text-slate-400 font-black mb-1">حجم مبادلات</span>
                        <span className="text-[10px] sm font-black text-emerald-600 truncate">{toPersianNum((customer.totalPurchaseValue || 0).toLocaleString())} ت</span>
                      </div>
                      <div className="hidden sm:block text-center lg">
                        <span className="block text-[9px] text-slate-400 font-black mb-1">وضعیت حساب</span>
                        <span className={`text-[9px] font-black px-2 py-1 rounded-lg ${
                          customer.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 
                          customer.status === 'pending_verification' ? 'bg-amber-50 text-amber-600' :
                          'bg-red-50 text-red-600'
                        }`}>
                          {customer.status === 'active' ? 'تایید شده' : 
                           customer.status === 'pending_verification' ? 'در انتظار' : 'مسدود'}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto pt-2 lg:pt-0">
                      <button 
                        onClick={() => handleEditCrmClick(customer)}
                        className="flex-1 lg:flex-none px-3 py-2 bg-slate-50 hover hover text-slate-600 rounded-xl text-[9px] font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Edit3 size={12} />
                        ویرایش
                      </button>
                      <button 
                        onClick={() => {
                          setShowDirectInvoiceModal(customer);
                          setDirectInvoiceItems([]);
                          setDirectAddress(customer.city || "");
                        }}
                        className="flex-1 lg:flex-none px-3 py-2 bg-white hover text-white rounded-xl text-[9px] font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                      >
                        <FileText size={12} />
                        صدور فاکتور
                      </button>
                      <button 
                        onClick={() => handleDeleteCrmCustomer(customer.id)}
                        className="p-2 bg-red-50 text-red-600 hover hover rounded-xl transition-all cursor-pointer"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                  
                  {customer.notes && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                      <p className="text-[10px] text-slate-500 leading-relaxed font-bold italic text-right">
                        📝 یادداشت سیستمی ادمین: {customer.notes}
                      </p>
                    </div>
                  )}
                </motion.div>
                      );
                    })
                  )}
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* --- TAB: ORDERS MANAGEMENT --- */}
      {activeSubTab === 'orders' && (
        <div className="space-y-8" dir="rtl">
          {/* Stat Cards Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-white border border-gray-100 rounded-[2rem] p-6 shadow-sm text-right flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 font-black">کل فاکتورهای عمده دریافتی</span>
                <h4 className="text-2xl font-black text-slate-800">{toPersianNum(orders.length)} فاکتور</h4>
              </div>
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center text-xl">
                📋
              </div>
            </div>

            <div className="bg-white border border-gray-100 rounded-[2rem] p-6 shadow-sm text-right flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 font-black">کل ارزش مبادلات (تومان)</span>
                <h4 className="text-xl font-black text-emerald-600">
                  {toPersianNum(orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0).toLocaleString())} تومان
                </h4>
              </div>
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center text-xl">
                💰
              </div>
            </div>

            <div className="bg-white border border-gray-100 rounded-[2rem] p-6 shadow-sm text-right flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 font-black">سفارشات در حال انتقال و تحویل</span>
                <h4 className="text-2xl font-black text-amber-600">
                  {toPersianNum(orders.filter(o => o.status !== 'delivered').length)} سفارش فعال
                </h4>
              </div>
              <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center text-xl">
                🚚
              </div>
            </div>
          </div>

          {/* Search Header */}
          <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl p-6 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="space-y-2 text-right">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2 justify-end">
                مدیریت فاکتورهای عمده و رهگیری تولید
                <ClipboardList className="text-emerald-600 animate-pulse" />
              </h3>
              <p className="text-xs text-slate-400 font-bold">تغییر وضعیت زنجیره تامین کالا، کنترل پرداخت‌ها و هماهنگی ترابری جاده‌ای کارخانه</p>
            </div>
            <div className="relative w-full md:w-96">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text"
                placeholder="جستجوی کد رهگیری، نام بنکدار یا شماره تماس..."
                value={ordersSearch}
                onChange={e => setOrdersSearch(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl pr-12 pl-4 py-3.5 text-xs text-slate-800 focus focus transition-all outline-none text-right"
              />
            </div>
          </div>

          {/* Orders list container */}
          <div className="space-y-6">
            {ordersLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <RefreshCw className="animate-spin text-emerald-600" size={40} />
                <span className="text-xs font-black text-slate-400">در حال دریافت لیست فاکتورها از سرور ابر...</span>
              </div>
            ) : orders.length === 0 ? (
              <div className="bg-white rounded-[2.5rem] p-16 text-center border border-gray-100 shadow-sm">
                <ShoppingBag className="mx-auto text-gray-300 mb-4" size={48} />
                <h3 className="text-base font-black text-gray-850">هنوز سفارشی ثبت نشده است</h3>
                <p className="text-xs text-gray-400 font-bold mt-2">سفارشاتی که بنکداران و خریداران از پرتال ثبت کنند در این بخش نمایش داده می‌شود.</p>
              </div>
            ) : (
              orders
                .filter(o => 
                  o.trackingNumber?.includes(ordersSearch) || 
                  o.buyerName?.includes(ordersSearch) || 
                  o.buyerPhone?.includes(ordersSearch) ||
                  o.buyerCompany?.includes(ordersSearch)
                )
                .map((order) => {
                  const statusInfo = getStatusLabel(order.status);
                  const isDelivered = order.status === 'delivered';

                  return (
                    <motion.div 
                      layout
                      key={order.id}
                      className="bg-white border border-gray-100 rounded-[2.5rem] p-6 sm:p-8 hover transition-all shadow-md text-right relative overflow-hidden"
                    >
                      {/* Top Bar inside Invoice Card */}
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 pb-5 mb-5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-black text-slate-800 bg-slate-100 px-3.5 py-1.5 rounded-xl">
                            کد رهگیری فاکتور: <span className="font-mono text-emerald-600 font-black">{order.trackingNumber}</span>
                          </span>
                          <span className="text-xs font-bold text-slate-400">
                            {formatOrderDate(order.createdAt)}
                          </span>
                        </div>
                        <div className={`text-xs font-black px-4 py-2 rounded-xl border ${statusInfo.color}`}>
                          {statusInfo.text}
                        </div>
                      </div>

                      {/* Customer Info Box */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/60 p-5 rounded-[1.5rem] border border-slate-100 mb-6">
                        {panelRole === 'suppliers' ? (
                          <div className="space-y-2">
                            <div className="text-xs font-black text-slate-500">🏢 اطلاعات خریدار (محفوظ نزد دفتر مرکزی)</div>
                            <div className="text-sm font-black text-slate-800">کد مشتری: CST-{(order.id || order.trackingNumber || '849201').slice(-6)}</div>
                            <div className="text-[11px] font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 inline-block">
                              🔒 مشخصات مستقیم تماس خریدار توسط دفتر مرکزی سرپرستی می‌گردد
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <div className="text-xs font-black text-slate-500">🏢 اطلاعات بنکدار / کارفرما</div>
                            <div className="text-sm font-black text-slate-800">{order.buyerCompany}</div>
                            <div className="text-xs font-bold text-slate-600 flex items-center gap-2">
                              <span>{order.buyerName}</span>
                              <span>•</span>
                              <span className="font-mono">{order.buyerPhone}</span>
                            </div>
                          </div>
                        )}
                        <div className="space-y-2">
                          <div className="text-xs font-black text-slate-500">📍 مقصد بارگیری و ارسال باربری</div>
                          <div className="text-xs font-bold text-slate-700 leading-relaxed">
                            {panelRole === 'suppliers' 
                              ? (order.buyerAddress ? `استان/شهر: ${order.buyerAddress.split('،')[0]} (جزئیات دقیق آدرس پس از بارگیری تحویل راننده می‌شود)` : 'تحویل باربری مرکزی')
                              : order.buyerAddress}
                          </div>
                          <div className="text-[10px] text-emerald-600 font-bold">🏢 تولیدکننده: {order.sellerName}</div>
                        </div>
                      </div>

                      {/* Items Ordered */}
                      <div className="space-y-3 mb-6">
                        <div className="text-xs font-black text-slate-500">🛒 جزئیات اقلام فاکتور عمده</div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-right text-xs min-w-[500px]">
                            <thead>
                              <tr className="border-b border-gray-100 text-slate-400 font-black pb-2">
                                <th className="pb-2 text-right">نام کالا / محصول کارخانه‌ای</th>
                                <th className="pb-2 text-center">تعداد</th>
                                <th className="pb-2 text-center">قیمت واحد</th>
                                <th className="pb-2 text-left">جمع کل (تومان)</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                              {order.items?.map((item: any, idx: number) => (
                                <tr key={`admin-panel-order-item-${item.id || item.productId || idx}-${idx}`} className="text-slate-800 font-bold">
                                  <td className="py-2.5 text-right font-black text-[10px] sm">{item.name}</td>
                                  <td className="py-2.5 text-center font-mono text-emerald-600">{toPersianNum(item.quantityCartons)} ک</td>
                                  <td className="py-2.5 text-center font-mono">{(item.pricePerCarton || 0).toLocaleString()}</td>
                                  <td className="py-2.5 text-left font-mono text-slate-900">
                                    {((item.pricePerCarton || 0) * (item.quantityCartons || 0)).toLocaleString()}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Financial summary breakdown */}
                      <div className="border-t border-gray-100 pt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                        <div className="flex flex-wrap gap-4 text-[10px] font-bold text-slate-400">
                          {order.discountBreakdown?.badge > 0 && (
                            <span className="bg-amber-50 text-amber-700 px-2.5 py-1 rounded-lg">
                              تخفیف وفاداری مشتری: {toPersianNum(order.discountBreakdown.badge.toLocaleString())} تومان
                            </span>
                          )}
                          {order.discountBreakdown?.bulk > 0 && (
                            <span className="bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-lg">
                              تخفیف حجم خرید ({toPersianNum(order.discountBreakdown.bulkPercent)}٪): {toPersianNum(order.discountBreakdown.bulk.toLocaleString())} تومان
                            </span>
                          )}
                        </div>
                        <div className="text-right">
                          <span className="text-xs text-slate-400 font-black ml-2">مبلغ پرداختی نهایی فاکتور:</span>
                          <span className="text-lg font-black text-emerald-600 font-mono">
                            {toPersianNum((order.totalAmount || 0).toLocaleString())} تومان
                          </span>
                        </div>
                      </div>

                      {/* Status Management Quick-buttons */}
                      <div className="bg-slate-50 rounded-2xl p-4 border border-gray-100 mb-6">
                        <div className="text-xs font-black text-slate-500 mb-3 flex items-center gap-1">
                          <Activity size={12} className="text-emerald-600" />
                          <span>مدیریت وضعیت و پردازش فاکتور:</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {[
                            { key: 'order_received', label: "۱. در انتظار بررسی", color: "bg-blue-600" },
                            { key: 'payment_verified', label: "۲. تایید مالی", color: "bg-indigo-600" },
                            { key: 'warehouse_packing', label: "۳. بسته‌بندی انبار", color: "bg-amber-600" },
                            { key: 'loading_freight', label: "۴. بارگیری باربری", color: "bg-purple-600" },
                            { key: 'in_transit', label: "۵. در حال ارسال", color: "bg-teal-600" },
                            { key: 'delivered', label: "۶. تحویل شد", color: "bg-emerald-600" },
                            { key: 'cancelled', label: "لغو فاکتور", color: "bg-rose-600" }
                          ].map((step, idx) => (
                            <button
                              key={`admin-panel-order-step-${step.key}-${idx}`}
                              onClick={() => handleUpdateOrderStatus(order.id, step.key)}
                              className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all border ${
                                order.status === step.key 
                                  ? `${step.color} text-white border-transparent shadow-sm` 
                                  : "bg-white text-slate-600 border-gray-200 hover"
                              }`}
                            >
                              {step.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Action quick-buttons */}
                      <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setEditingOrder(order);
                              setEditBuyerName(order.buyerName || "");
                              setEditBuyerPhone(order.buyerPhone || "");
                              setEditBuyerCompany(order.buyerCompany || "");
                              setEditBuyerAddress(order.buyerAddress || "");
                              setEditTotalAmount(order.totalAmount || 0);
                              setEditPaymentStatus(order.paymentStatus || "pending");
                              setEditOrderItems(order.items || []);
                            }}
                            className="px-4 py-2 bg-slate-100 hover text-slate-700 font-black text-xs rounded-xl transition-all flex items-center gap-1"
                          >
                            <Edit3 size={14} />
                            ویرایش دستی فاکتور
                          </button>
                          <button
                            onClick={() => setShowPrintInvoice(order)}
                            className="px-4 py-2 bg-slate-100 hover text-white font-black text-xs rounded-xl transition-all flex items-center gap-1 shadow-md"
                          >
                            <Printer size={14} />
                            چاپ فاکتور رسمی (مهر و امضا)
                          </button>
                        </div>
                        <div className="flex gap-2">
                          {order.paymentStatus !== 'paid' && (
                            <button
                              onClick={async () => {
                                const orderRef = doc(db, "orders", order.id);
                                await updateDoc(orderRef, { paymentStatus: 'paid' });
                                fetchOrders();
                              }}
                              className="px-4 py-2 bg-emerald-600 hover text-white font-black text-xs rounded-xl transition-all shadow-md flex items-center gap-1"
                            >
                              <CheckCircle size={14} />
                              تایید تسویه مالی
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })
            )}
          </div>
        </div>
      )}

      {/* Invoice & Seal Settings Tab */}
      {activeSubTab === 'invoice' && (
        <AdminInvoiceSettings 
          b2bConfig={b2bConfig} 
          onUpdateB2bConfig={onUpdateB2bConfig} 
        />
      )}

      {/* Accounting and Finance Tab */}
      {activeSubTab === 'accounting' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
              <div className="text-xs font-black text-slate-400 mb-2">کل فروش ناخالص</div>
              <div className="text-2xl font-black text-slate-800 font-mono">
                {toPersianNum(orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0).toLocaleString())} <span className="text-xs">تومان</span>
              </div>
            </div>
            <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
              <div className="text-xs font-black text-slate-400 mb-2">سود ناخالص تخمینی (۱۵٪)</div>
              <div className="text-2xl font-black text-emerald-600 font-mono">
                {toPersianNum(Math.round(orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0) * 0.15).toLocaleString())} <span className="text-xs">تومان</span>
              </div>
            </div>
            <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
              <div className="text-xs font-black text-slate-400 mb-2">تعداد فاکتورهای جاری</div>
              <div className="text-2xl font-black text-blue-600 font-mono">{toPersianNum(orders.length)}</div>
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm overflow-hidden">
            <h3 className="text-sm font-black text-slate-800 mb-6 flex items-center gap-2">
              <Activity size={18} className="text-blue-600" />
              تراز مالی و جریان وجوه نقد
            </h3>
            <div className="space-y-4">
              {orders.slice(0, 10).map((o, idx) => (
                <div key={`admin-panel-fin-order-${o.id || idx}-${idx}`} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${o.paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                      <DollarSign size={20} />
                    </div>
                    <div>
                      <div className="text-xs font-black text-slate-800">{o.buyerCompany || "خریدار ناشناس"}</div>
                      <div className="text-[10px] text-slate-400 font-bold">{formatOrderDate(o.createdAt)}</div>
                    </div>
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-black text-slate-900 font-mono">
                      {o.paymentMethod === 'cash' ? '+' : ''}{toPersianNum(o.totalAmount.toLocaleString())}
                    </div>
                    <div className={`text-[10px] font-black ${o.paymentStatus === 'paid' ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {o.paymentStatus === 'paid' ? 'وصول شده' : 'در انتظار واریز'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* --- TAB: PARSPACK BUCKET STORAGE --- */}
      {activeSubTab === 'parspack_storage' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 text-right" dir="rtl">
          <AdminSystemConfig
            b2bConfig={b2bConfig}
            onUpdateB2bConfig={onUpdateB2bConfig}
            products={products}
            orders={orders}
            articles={articles}
            onRefreshProducts={onRefreshProducts}
            defaultTab="parspack_storage"
          />
        </div>
      )}

      {/* --- TAB: SYSTEM MANAGEMENT --- */}
      {activeSubTab === 'system' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 text-right" dir="rtl">
          <AdminSystemConfig
            b2bConfig={b2bConfig}
            onUpdateB2bConfig={onUpdateB2bConfig}
            products={products}
            orders={orders}
            articles={articles}
            onRefreshProducts={onRefreshProducts}
          />
        </div>
      )}

      {/* AI Marketing Suite Tab (Sellers Role) */}
      {activeSubTab === ('ai-marketing' as any) && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-white rounded-[2.5rem] p-8 border border-slate-800 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
            
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-6 border-b border-slate-800">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full text-amber-400 text-xs font-black">
                  <Sparkles size={12} className="animate-pulse" />
                  دستیار تبلیغات و مارکتینگ مجهز به هوش مصنوعی (Gemini API)
                </div>
                <h3 className="text-xl font-black">اتاق عملیات مارکتینگ و سناریونویسی هوشمند</h3>
                <p className="text-slate-400 text-xs font-bold">برای هر کدام از کالاهای کاتالوگ خود، متن تبلیغاتی و راهنمای سود بنویسید</p>
              </div>
            </div>

            <div className="mt-8 space-y-6 relative z-10">
              <div className="bg-white/60 border border-slate-800 rounded-2xl p-6 space-y-4">
                <h4 className="text-sm font-black text-amber-400">۱. محصول مورد نظر را جهت تحلیل انتخاب کنید</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-xs font-black text-slate-400">کالاهای فعال در انبار شما:</label>
                    <select
                      value={aiMarketingProduct}
                      onChange={(e) => setAiMarketingProduct(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-800 rounded-xl px-4 py-3.5 text-xs font-bold outline-none text-white focus transition-colors"
                    >
                      <option value="">-- انتخاب یک کالا از انبار بازرگانی --</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.brand}) • قیمت عمده: {toPersianNum(p.bulk_price.toLocaleString())} تومان
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={handleGenerateAiMarketing}
                    disabled={aiMarketingLoading || !aiMarketingProduct}
                    className="w-full bg-amber-600 hover disabled:opacity-35 text-white font-black py-4 px-6 rounded-xl transition-all shadow-lg shadow-amber-600/15 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {aiMarketingLoading ? <RefreshCw size={16} className="animate-spin" /> : <Sparkles size={16} />}
                    {aiMarketingLoading ? "در حال دریافت ایده..." : "تحلیل و تولید محتوای مارکتینگ"}
                  </button>
                </div>
              </div>

              {/* Loader */}
              {aiMarketingLoading && (
                <div className="py-12 flex flex-col items-center justify-center space-y-4 bg-white/30 rounded-2xl border border-dashed border-slate-800">
                  <div className="w-12 h-12 rounded-full border-4 border-amber-500/20 border-t-amber-500 animate-spin" />
                  <div className="text-center space-y-1">
                    <div className="text-xs font-black text-white">در حال تجزیه و تحلیل ویژگی‌های کالا با مدل هوش مصنوعی...</div>
                    <div className="text-[10px] text-slate-500 font-bold">ما هم‌زمان سه سناریوی کاتالوگ، پیامک و سوددهی را استخراج می‌کنیم.</div>
                  </div>
                </div>
              )}

              {/* RESULTS BLOCK */}
              {!aiMarketingLoading && (aiMarketingDesc || aiMarketingPitch || aiMarketingAdvice) && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-500 text-right" dir="rtl">
                  
                  {/* ADVANCED B2B CATALOG COPY */}
                  <div className="bg-slate-50/80 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                        <span className="text-[11px] font-black text-amber-400">توصیف کاتالوگ عمده B2B</span>
                        <span className="text-[8px] bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-full font-bold">برای خریداران</span>
                      </div>
                      <p className="text-[10px] text-slate-300 leading-relaxed min-h-[12rem] text-justify whitespace-pre-wrap">
                        {aiMarketingDesc || "توصیفی تولید نشد."}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(aiMarketingDesc);
                          setSuccessMsg("متن کاتالوگ عمده با موفقیت کپی شد.");
                          setTimeout(() => setSuccessMsg(null), 3000);
                        }}
                        className="flex-1 bg-slate-100 hover text-white text-[10px] font-bold py-2.5 rounded-lg transition-all cursor-pointer"
                      >
                        کپی متن کاتالوگ
                      </button>
                      <button
                        onClick={handleApplyAiDescription}
                        className="flex-1 bg-emerald-600 hover text-white text-[10px] font-black py-2.5 rounded-lg transition-all cursor-pointer"
                      >
                        اعمال روی کالا
                      </button>
                    </div>
                  </div>

                  {/* SMS / TELEGRAM CAMPAIGN SCRIPT */}
                  <div className="bg-slate-50/80 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                        <span className="text-[11px] font-black text-blue-400">سناریوی پیامک / تلگرام عمده‌فروشان</span>
                        <span className="text-[8px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full font-bold">کمپین توزیع مویرگی</span>
                      </div>
                      <p className="text-[10px] text-slate-300 leading-relaxed min-h-[12rem] text-justify whitespace-pre-wrap font-mono">
                        {aiMarketingPitch || "پیچی تولید نشد."}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(aiMarketingPitch);
                        setSuccessMsg("متن پیامک تبلیغاتی کپی شد.");
                        setTimeout(() => setSuccessMsg(null), 3000);
                      }}
                      className="w-full bg-slate-100 hover text-white text-[10px] font-bold py-2.5 rounded-lg transition-all cursor-pointer"
                    >
                      کپی سناریوی تبلیغاتی
                    </button>
                  </div>

                  {/* STRATEGIC PRICING ADVISORY */}
                  <div className="bg-slate-50/80 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                        <span className="text-[11px] font-black text-rose-400">تحلیل سودآوری و ترفندهای توزیع</span>
                        <span className="text-[8px] bg-rose-500/10 text-rose-400 px-2 py-0.5 rounded-full font-bold">مشاوره Gemini</span>
                      </div>
                      <p className="text-[10px] text-slate-300 leading-relaxed min-h-[12rem] text-justify whitespace-pre-wrap">
                        {aiMarketingAdvice || "مشاوره‌ای ثبت نشد."}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(aiMarketingAdvice);
                        setSuccessMsg("راهنمای مشاور کپی شد.");
                        setTimeout(() => setSuccessMsg(null), 3000);
                      }}
                      className="w-full bg-slate-100 hover text-white text-[10px] font-bold py-2.5 rounded-lg transition-all cursor-pointer"
                    >
                      کپی تحلیل راهبردی
                    </button>
                  </div>

                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* VIP Wholesaler Wallet Tab (Customers Role) */}
      {activeSubTab === ('vip-wallet' as any) && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* VIP CO BRANDED CARD */}
            <div className="bg-gradient-to-tr from-amber-600 via-amber-700 to-yellow-500 text-white p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden flex flex-col justify-between min-h-[16rem]">
              <div className="absolute top-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
              
              <div className="flex justify-between items-start relative z-10">
                <div>
                  <div className="text-[10px] font-black tracking-widest text-amber-100 uppercase">عضویت طلایی همکاران</div>
                  <h4 className="text-lg font-black mt-1">دست اول • VIP GOLD</h4>
                </div>
                <div className="w-10 h-8 bg-amber-400/20 backdrop-blur-md rounded-lg border border-amber-300/30 flex items-center justify-center text-xs font-black">
                  VIP
                </div>
              </div>

              <div className="my-6 relative z-10">
                <div className="text-xs text-amber-100 font-bold mb-1">کارت اعتباری متمرکز دست اول</div>
                <div className="text-xl font-black font-mono tracking-widest text-center" dir="ltr">
                  ۶۲۷۴ - ۱۹۲۸ - ۳۳۰۴ - ۰۰۴۲
                </div>
              </div>

              <div className="flex justify-between items-end relative z-10">
                <div>
                  <div className="text-[8px] text-amber-200">دارنده اعتبار:</div>
                  <div className="text-xs font-black">جناب آقای حاج علیرضا اکبری</div>
                </div>
                <div className="text-left">
                  <div className="text-[8px] text-amber-200">کد شناسه:</div>
                  <div className="text-xs font-black font-mono">D1-8402</div>
                </div>
              </div>
            </div>

            {/* WALLET METRICS */}
            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col justify-between">
                <div className="space-y-1">
                  <span className="text-[10px] font-black bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-full">تسهیلات بانکی تجاری</span>
                  <div className="text-xs font-black text-slate-400 mt-3">حد اعتباری خرید امانی (چکی)</div>
                </div>
                <div className="text-xl font-black text-slate-800 font-mono mt-4">
                  {toPersianNum("۵۰۰,۰۰۰,۰۰۰")} <span className="text-xs font-black">تومان</span>
                </div>
                <p className="text-[8px] text-emerald-600 font-bold mt-1">● دارای تاییدیه رسمی از بانک تجارت</p>
              </div>

              <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col justify-between">
                <div className="space-y-1">
                  <span className="text-[10px] font-black bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-full">سود انباشته خرید مستقیم</span>
                  <div className="text-xs font-black text-slate-400 mt-3">صرفه‌جویی کل خریدها (حذف واسطه)</div>
                </div>
                <div className="text-xl font-black text-emerald-600 font-mono mt-4">
                  {toPersianNum("۴۲,۸۰۰,۰۰۰")} <span className="text-xs font-black">تومان</span>
                </div>
                <p className="text-[8px] text-slate-400 font-bold mt-1">میانگین ۲۸٪ سود بیشتر در هر خرید</p>
              </div>

              <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col justify-between">
                <div className="space-y-1">
                  <span className="text-[10px] font-black bg-amber-50 text-amber-600 px-2.5 py-1 rounded-full">باشگاه مشتریان ممتاز</span>
                  <div className="text-xs font-black text-slate-400 mt-3">امتیاز وفاداری دست اول</div>
                </div>
                <div className="text-xl font-black text-amber-600 font-mono mt-4">
                  {toPersianNum("۲,۴۵۰")} <span className="text-xs font-black">امتیاز</span>
                </div>
                <p className="text-[8px] text-indigo-500 font-bold mt-1">تراز سطح طلایی فعال</p>
              </div>
            </div>

          </div>

          {/* ACTIVE DISCOUNTS CODES */}
          <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm text-right" dir="rtl">
            <h3 className="text-sm font-black text-slate-800 mb-6 flex items-center gap-2">
              <Award size={18} className="text-amber-500" />
              کدهای تخفیف فعال و اعتباری اختصاصی شما
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { code: "CHEE-TOZ-VIP", title: "۱۰٪ تخفیف کل بار چی‌توز", desc: "ویژه خریدهای بالای ۵۰ کارتن", expires: "تا ۳ روز دیگر" },
                { code: "MAZMAZ-GOLD", title: "۸٪ تخفیف بار مزمز", desc: "بدون محدودیت حداقل سفارش", expires: "تا انتهای هفته" },
                { code: "SUNICH-VIP", title: "۱۲٪ تخفیف اختصاصی سن‌ایچ", desc: "ویژه خریدهای نقدی خط تولید", expires: "تا فردا شب" }
              ].map((c, i) => (
                <div key={`admin-panel-discount-${c.code}-${i}`} className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex flex-col justify-between space-y-3">
                  <div>
                    <h4 className="text-xs font-black text-slate-800">{c.title}</h4>
                    <p className="text-[9px] text-slate-400 font-bold mt-1">{c.desc}</p>
                  </div>
                  <div className="flex justify-between items-center bg-white p-2 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-mono font-bold text-slate-600">{c.code}</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(c.code);
                        setSuccessMsg("کد تخفیف با موفقیت کپی شد.");
                        setTimeout(() => setSuccessMsg(null), 3000);
                      }}
                      className="text-[9px] font-black text-amber-600 hover cursor-pointer"
                    >
                      کپی کد
                    </button>
                  </div>
                  <div className="text-[8px] text-rose-500 font-bold text-left">{c.expires}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* --- TAB: CATEGORIES MANAGEMENT (Enhanced) --- */}
      {activeSubTab === 'categories' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 bg-white p-6 sm:p-10 rounded-[3rem] border border-slate-100 shadow-2xl text-right" dir="rtl">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-slate-50">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-fuchsia-50 text-fuchsia-600 rounded-2xl shadow-inner">
                <Layers size={24} />
              </div>
              <div>
                <h3 className="text-lg sm font-black text-slate-900 font-sans">معماری دسته‌بندی کاتالوگ مرکزی</h3>
                <p className="text-[11px] text-slate-400 font-bold mt-1">ساختار درختی و بصری گروه‌های کالایی سامانه را با دقت مهندسی کنید.</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="bg-emerald-50 text-emerald-600 text-[10px] font-black px-3 py-1 rounded-full border border-emerald-100">
                {((b2bConfig.categories && b2bConfig.categories.length > 0) ? b2bConfig.categories : [1,2,3,4,5]).length} دسته فعال
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 items-start">
            
            {/* List of Existing Categories */}
            <div className="lg:col-span-3 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <h4 className="text-xs font-black text-slate-500 font-sans flex items-center gap-2">
                  لیست گروه‌های کالایی ثبت شده ({toPersianNum((b2bConfig.categories || []).length)} دسته):
                </h4>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={async () => {
                      setLoading(true);
                      try {
                        const pCatSet = new Set<string>();
                        products.forEach((p: any) => {
                          if (p.category && p.category.trim()) pCatSet.add(p.category.trim());
                          if (p.tags && Array.isArray(p.tags)) {
                            p.tags.forEach((t: string) => { if (t && t.trim()) pCatSet.add(t.trim()); });
                          }
                        });
                        const currentCats = b2bConfig.categories || [];
                        const catMap = new globalThis.Map<string, any>();
                        currentCats.forEach((c: any) => {
                          const name = typeof c === 'string' ? c : (c.name || c.id);
                          if (name) catMap.set(name.trim(), typeof c === 'object' ? c : { id: name, name });
                        });
                        pCatSet.forEach(catName => {
                          if (!catMap.has(catName)) {
                            catMap.set(catName, {
                              id: `cat-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
                              name: catName,
                              icon: "🏷️",
                              description: "استخراج شده از کاتالوگ محصولات"
                            });
                          }
                        });
                        const mergedArray = Array.from(catMap.values());
                        await onUpdateB2bConfig({ ...b2bConfig, categories: mergedArray as any });
                        setSuccessMsg("دسته‌بندی‌ها با موفقیت بر اساس محصولات همگام‌سازی شدند!");
                        setTimeout(() => setSuccessMsg(null), 3000);
                      } catch (e) {
                        console.error(e);
                      }
                      setLoading(false);
                    }}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-black transition-all cursor-pointer flex items-center gap-1 shadow-sm"
                  >
                    <RefreshCw size={12} />
                    <span>همگام‌سازی با محصولات</span>
                  </button>

                  <button 
                    onClick={() => {
                      const list = b2bConfig.categories || [];
                      const allCats = list.map((c: any) => typeof c === 'string' ? c : (c.name || c.id));
                      if (selectedCategoryNames.length === allCats.length) {
                        setSelectedCategoryNames([]);
                      } else {
                        setSelectedCategoryNames(allCats);
                      }
                    }}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[10px] font-black transition-all cursor-pointer"
                  >
                    {selectedCategoryNames.length > 0 ? "لغو انتخاب" : "انتخاب همه"}
                  </button>
                  {selectedCategoryNames.length > 0 && (
                    <>
                      <button
                        onClick={() => {
                          setBulkCatEmoji("");
                          setBulkCatDesc("");
                          setBulkCatImageUrl("");
                          setShowBulkEditCatModal(true);
                        }}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-black transition-all shadow-md cursor-pointer flex items-center gap-1"
                      >
                        <Edit2 size={11} />
                        ویرایش گروهی ({toPersianNum(selectedCategoryNames.length)})
                      </button>

                      <button 
                        onClick={() => {
                          confirmAction(
                            "حذف دسته‌جمعی",
                            `آیا از حذف دسته جمعی ${selectedCategoryNames.length} گروه کالایی مطمئن هستید؟`,
                            async () => {
                              setLoading(true);
                              try {
                                const currentList = b2bConfig.categories || [];
                                const updatedCats = currentList.filter(
                                  (c: any) => {
                                    const name = typeof c === 'string' ? c : (c.name || c.id);
                                    const id = typeof c === 'object' ? c.id : c;
                                    return !selectedCategoryNames.includes(name) && !selectedCategoryNames.includes(id) && !selectedCategoryNames.includes(c);
                                  }
                                );
                                await onUpdateB2bConfig({ ...b2bConfig, categories: updatedCats });
                                setSelectedCategoryNames([]);
                                setSuccessMsg(`${toPersianNum(selectedCategoryNames.length)} گروه کالایی با موفقیت حذف شدند.`);
                                setTimeout(() => setSuccessMsg(null), 3000);
                              } catch (err: any) {
                                setErrorMsg("خطا در حذف دسته جمعی گروه‌ها.");
                              } finally {
                                setLoading(false);
                              }
                            }
                          );
                        }}
                        className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-[10px] font-black transition-all shadow-md cursor-pointer flex items-center gap-1"
                      >
                        <Trash2 size={11} />
                        حذف گروهی ({toPersianNum(selectedCategoryNames.length)})
                      </button>
                    </>
                  )}
                </div>
              </div>

              {(b2bConfig.categories || []).length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-300 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-200/80 text-slate-600 flex items-center justify-center mx-auto">
                    <Tag size={20} />
                  </div>
                  <h4 className="text-xs font-black text-slate-700">هیچ دسته‌بندی فعالی یافت نشد!</h4>
                  <p className="text-[10px] text-slate-500 font-bold max-w-sm mx-auto leading-relaxed">
                    دسته‌بندی‌های قبلی پاک شده‌اند. می‌توانید از فرم زیر دسته‌بندی‌های جدید و اختصاصی خود را وارد کرده یا روی «همگام‌سازی با محصولات» کلیک کنید.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[550px] overflow-y-auto pr-2 custom-scrollbar">
                  {(b2bConfig.categories || []).map((cat: any, idx: number) => {
                  const catKey = cat.name || cat.id || cat;
                  const isCatSelected = selectedCategoryNames.includes(catKey);

                  return (
                    <div 
                      key={`b2b-cat-${cat.id || cat.name || idx}-${idx}`} 
                      className={`group relative p-4 rounded-3xl border transition-all flex flex-col gap-3 ${
                        isCatSelected ? "bg-amber-50/60 border-amber-400 shadow-md" : "bg-white border-slate-200 hover:border-slate-300 shadow-sm"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <input 
                            type="checkbox"
                            checked={isCatSelected}
                            onChange={() => {
                              setSelectedCategoryNames(prev => 
                                prev.includes(catKey) ? prev.filter(k => k !== catKey) : [...prev, catKey]
                              );
                            }}
                            className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                          />
                          <div className="w-12 h-12 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                            <img 
                              src={cat.imageUrl || "https://images.unsplash.com/photo-1581798459219-318e76aecc7b?w=200"} 
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                              alt={cat.name} 
                            />
                          </div>
                          <div>
                            <span className="text-sm font-black text-slate-800 block">{cat.name}</span>
                            <span className="text-[9px] text-slate-400 font-bold block mt-0.5">{cat.description || "بدون توضیحات فنی"}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => {
                              setEditingCategory(cat);
                              setNewCatName(cat.name);
                              setNewCatIcon(cat.imageUrl || "");
                              setNewCatEmoji(cat.icon || "🏷️");
                              setNewCatDesc(cat.description || "");
                            }}
                            className="p-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-xl transition-all cursor-pointer"
                            title="ویرایش"
                          >
                            <Edit2 size={12} />
                          </button>
                          <button 
                            onClick={() => {
                              confirmAction(
                                "حذف دسته‌بندی",
                                'آیا از حذف این دسته مطمئن هستید؟',
                                async () => {
                                  const updatedCats = (b2bConfig.categories || []).filter((c: any) => (c.id || c.name || c) !== (cat.id || cat.name || cat));
                                  setLoading(true);
                                  try {
                                    await onUpdateB2bConfig({ ...b2bConfig, categories: updatedCats });
                                    setSuccessMsg("دسته با موفقیت حذف شد.");
                                    setTimeout(() => setSuccessMsg(null), 3000);
                                  } catch (err: any) {
                                    setErrorMsg("خطا در حذف دسته.");
                                  } finally {
                                    setLoading(false);
                                  }
                                }
                              );
                            }}
                            className="p-2 bg-rose-50 text-rose-500 hover:bg-rose-100 rounded-xl transition-all cursor-pointer"
                            title="حذف"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              )}
            </div>

            {/* Add/Edit Form */}
            <div className="lg:col-span-2 sticky top-6">
              <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 shadow-inner space-y-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-fuchsia-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-fuchsia-600/20">
                    {editingCategory ? <Edit3 size={18} /> : <PlusCircle size={18} />}
                  </div>
                  <h4 className="text-sm font-black text-slate-800 font-sans">
                    {editingCategory ? "ویرایش مشخصات گروه" : "ایجاد دسته‌بندی جدید"}
                  </h4>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-500 font-black flex items-center gap-1.5">
                      <Tag size={10} /> نام فارسی دسته‌بندی:
                    </label>
                    <input 
                      type="text" 
                      value={newCatName}
                      onChange={e => setNewCatName(e.target.value)}
                      placeholder="مثال: تنقلات و شکلات"
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-black outline-none focus focus transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-slate-500 font-black flex items-center gap-1.5">
                        <Sparkles size={10} /> ایموجی/آیکون (اختیاری):
                      </label>
                      <input 
                        type="text" 
                        value={newCatEmoji}
                        onChange={e => setNewCatEmoji(e.target.value)}
                        placeholder="🍿"
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs text-center font-black outline-none focus focus transition-all"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] text-slate-500 font-black flex items-center gap-1.5">
                        <Image size={10} /> تصویر دسته‌بندی (انتخاب فایل یا URL):
                      </label>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <label className="flex-1 bg-fuchsia-50 hover:bg-fuchsia-100 text-fuchsia-800 border border-fuchsia-200 text-[11px] font-black py-2 px-3 rounded-xl cursor-pointer text-center transition-colors flex items-center justify-center gap-1.5 shadow-sm">
                            <Upload size={13} />
                            <span>بارگذاری تصویر از گالری</span>
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
                                      setNewCatIcon(event.target.result as string);
                                    }
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                            />
                          </label>

                          {newCatIcon && (
                            <div className="w-10 h-10 rounded-xl overflow-hidden border border-slate-200 shrink-0 bg-white p-0.5 shadow-sm">
                              <img src={newCatIcon} alt="Category" className="w-full h-full object-cover rounded-lg" />
                            </div>
                          )}
                        </div>

                        <input 
                          type="text" 
                          dir="ltr"
                          value={newCatIcon}
                          onChange={e => setNewCatIcon(e.target.value)}
                          placeholder="یا وارد کردن لینک https://..."
                          className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono outline-none focus transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-500 font-black flex items-center gap-1.5">
                      <ClipboardList size={10} /> شرح مختصر کاربردی:
                    </label>
                    <textarea 
                      value={newCatDesc}
                      onChange={e => setNewCatDesc(e.target.value)}
                      rows={2}
                      placeholder="توضیح کوتاهی برای نمایش در کاتالوگ..."
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-bold outline-none focus focus transition-all"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  {editingCategory && (
                    <button 
                      onClick={() => {
                        setEditingCategory(null);
                        setNewCatName("");
                        setNewCatIcon("");
                        setNewCatEmoji("");
                        setNewCatDesc("");
                      }}
                      className="flex-1 py-3 bg-slate-200 text-slate-600 rounded-2xl text-xs font-black transition-all cursor-pointer hover"
                    >
                      انصراف
                    </button>
                  )}
                  <button 
                    onClick={async () => {
                      if (!newCatName.trim()) {
                        setErrorMsg("نام دسته الزامی است.");
                        return;
                      }
                      
                      setLoading(true);
                      try {
                        let updatedCats = [];
                        const catPayload = {
                          name: newCatName,
                          icon: newCatEmoji || "🏷️",
                          imageUrl: newCatIcon,
                          description: newCatDesc
                        };

                        if (editingCategory) {
                          updatedCats = (b2bConfig.categories || []).map((c: any) => 
                            (c.id === editingCategory.id || c.name === editingCategory.name) 
                              ? { ...c, ...catPayload }
                              : c
                          );
                        } else {
                          updatedCats = [
                            ...(b2bConfig.categories || []),
                            { id: Date.now().toString(), ...catPayload }
                          ];
                        }
                        
                        await onUpdateB2bConfig({ ...b2bConfig, categories: updatedCats });
                        setSuccessMsg(editingCategory ? "تغییرات با موفقیت اعمال شد." : "دسته جدید در کاتالوگ ثبت گردید.");
                        setEditingCategory(null);
                        setNewCatName("");
                        setNewCatIcon("");
                        setNewCatEmoji("");
                        setNewCatDesc("");
                        setTimeout(() => setSuccessMsg(null), 3000);
                      } catch (err: any) {
                        setErrorMsg("خطا در ذخیره‌سازی داده‌های جدید.");
                      } finally {
                        setLoading(false);
                      }
                    }}
                    className="flex-[2] py-3 bg-fuchsia-600 hover:bg-fuchsia-700 text-white rounded-2xl text-xs font-black shadow-lg shadow-fuchsia-600/20 cursor-pointer transition-all flex items-center justify-center gap-2"
                  >
                    {loading ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                    {editingCategory ? "بروزرسانی نهایی دسته" : "ثبت دسته در هسته مرکزی"}
                  </button>
                </div>
              </div>
            </div>

          </div>

          {/* Bulk Edit Category Modal */}
          <AnimatePresence>
            {showBulkEditCatModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-white/70 backdrop-blur-md">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 text-right space-y-5"
                  dir="rtl"
                >
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl">
                        <Edit2 size={20} />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-slate-900">ویرایش گروهی دسته‌بندی‌ها</h4>
                        <p className="text-[11px] text-slate-500 font-bold">
                          اعمال تغییرات روی {toPersianNum(selectedCategoryNames.length)} گروه کالایی انتخاب شده
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowBulkEditCatModal(false)}
                      className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 cursor-pointer"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[11px] font-black text-slate-700 block">آیکون / ایموجی جدید (در صورت نیاز به تغییر):</label>
                      <input
                        type="text"
                        value={bulkCatEmoji}
                        onChange={e => setBulkCatEmoji(e.target.value)}
                        placeholder="مثال: 📦 (خالی بگذارید تا تغییر نکند)"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-black text-slate-700 block">تصویر شاخص جدید (URL):</label>
                      <input
                        type="text"
                        value={bulkCatImageUrl}
                        onChange={e => setBulkCatImageUrl(e.target.value)}
                        placeholder="https://... (خالی بگذارید تا تغییر نکند)"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:border-indigo-500 text-left dir-ltr"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-black text-slate-700 block">شرح یا توضیحات جدید:</label>
                      <textarea
                        value={bulkCatDesc}
                        onChange={e => setBulkCatDesc(e.target.value)}
                        rows={2}
                        placeholder="توضیح جدید برای گروه‌های انتخابی (خالی بگذارید تا تغییر نکند)..."
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
                    <button
                      onClick={async () => {
                        if (!bulkCatEmoji.trim() && !bulkCatDesc.trim() && !bulkCatImageUrl.trim()) {
                          setErrorMsg("حداقل یکی از فیلدها را برای اعمال تغییرات گروهی تکمیل نمایید.");
                          return;
                        }

                        setLoading(true);
                        try {
                          const currentList = b2bConfig.categories || [];
                          const updatedCats = currentList.map((c: any) => {
                            const name = typeof c === 'string' ? c : (c.name || c.id);
                            const id = typeof c === 'object' ? c.id : c;
                            const isMatch = selectedCategoryNames.includes(name) || selectedCategoryNames.includes(id) || selectedCategoryNames.includes(c);
                            
                            if (isMatch) {
                              const baseObj = typeof c === 'object' ? c : { id: name, name };
                              return {
                                ...baseObj,
                                icon: bulkCatEmoji.trim() ? bulkCatEmoji.trim() : baseObj.icon,
                                imageUrl: bulkCatImageUrl.trim() ? bulkCatImageUrl.trim() : baseObj.imageUrl,
                                description: bulkCatDesc.trim() ? bulkCatDesc.trim() : baseObj.description
                              };
                            }
                            return c;
                          });

                          await onUpdateB2bConfig({ ...b2bConfig, categories: updatedCats });
                          setShowBulkEditCatModal(false);
                          setSelectedCategoryNames([]);
                          setSuccessMsg(`تغییرات با موفقیت روی ${toPersianNum(selectedCategoryNames.length)} گروه کالایی اعمال گردید.`);
                          setTimeout(() => setSuccessMsg(null), 3500);
                        } catch (err) {
                          setErrorMsg("خطا در بروزرسانی گروهی دسته‌بندی‌ها.");
                        } finally {
                          setLoading(false);
                        }
                      }}
                      className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-md cursor-pointer transition-all flex items-center justify-center gap-2"
                    >
                      <Save size={15} />
                      <span>اعمال تغییرات روی گروه‌های انتخابی</span>
                    </button>
                    
                    <button
                      onClick={() => setShowBulkEditCatModal(false)}
                      className="px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-black hover:bg-slate-200 cursor-pointer"
                    >
                      انصراف
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* --- TAB: BRANDS MANAGEMENT --- */}
      {activeSubTab === 'brands' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 bg-white p-6 sm:p-10 rounded-[3rem] border border-slate-100 shadow-2xl text-right" dir="rtl">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-slate-50">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl shadow-inner">
                <Award size={24} />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 font-sans">مدیریت برندها و کارخانجات همکار</h3>
                <p className="text-[11px] text-slate-400 font-bold mt-1">برندهای تجاری فعال در سامانه دست اول را تعریف، ویرایش و مدیریت کنید.</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={async () => {
                  const productBrands = Array.from(new Set(products.map(p => p.brand).filter(Boolean)));
                  const currentNames = new Set(brands.map(b => b.name));
                  const newBrands: BrandItem[] = [...brands];
                  let addedCount = 0;

                  productBrands.forEach((bName, idx) => {
                    if (!currentNames.has(bName)) {
                      newBrands.push({
                        id: `brand_auto_${Date.now()}_${idx}`,
                        name: bName,
                        type: "تولیدکننده رسمی",
                        icon: "🏬"
                      });
                      addedCount++;
                    }
                  });

                  setBrands(newBrands);
                  await onUpdateB2bConfig({ ...b2bConfig, brands: newBrands });
                  setSuccessMsg(`تعداد ${toPersianNum(addedCount)} برند جدید از کاتالوگ استخراج و ذخیره گردید.`);
                  setTimeout(() => setSuccessMsg(null), 3500);
                }}
                className="px-3.5 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-xs font-black rounded-xl cursor-pointer transition-all flex items-center gap-1.5"
              >
                <Sparkles size={14} />
                <span>استخراج خودکار برندها از محصولات ({toPersianNum(brands.length)})</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 items-start">
            
            {/* List of Existing Brands */}
            <div className="lg:col-span-3 space-y-4">
              <h4 className="text-xs font-black text-slate-500 font-sans flex items-center gap-2">
                لیست برندهای ثبت‌شده در ویترین کارخانجات ({toPersianNum(brands.length)} برند):
              </h4>

              {brands.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl space-y-2">
                  <p className="text-xs font-bold text-slate-500">هیچ برندی ثبت نشده است.</p>
                  <p className="text-[11px] text-slate-400">از فرم مقابل برای اضافه کردن اولین برند استفاده کنید.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {brands.map((brand, idx) => (
                    <div 
                      key={`admin-brand-${brand.id || brand.name || idx}-${idx}`}
                      className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 hover:bg-white hover:border-amber-400 hover:shadow-md transition-all flex items-center justify-between gap-3 group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-11 h-11 rounded-xl bg-white border border-slate-200 p-1 flex items-center justify-center shrink-0 shadow-sm text-2xl overflow-hidden">
                          {brand.logoUrl ? (
                            <img src={getDisplayImageUrl(brand.logoUrl)} alt={brand.name} className="w-full h-full object-contain" />
                          ) : (
                            <span>{brand.icon || "🏬"}</span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h5 className="text-xs font-black text-slate-900 truncate flex items-center gap-1.5">
                            <span>{brand.name}</span>
                          </h5>
                          <p className="text-[10px] text-slate-500 font-bold truncate mt-0.5">{brand.type || "صنایع غذایی"}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => {
                            window.dispatchEvent(new CustomEvent("search-brand", { detail: { brand: brand.name } }));
                          }}
                          className="p-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl transition-all cursor-pointer"
                          title="مشاهده کالاهای این برند در کاتالوگ"
                        >
                          <Eye size={13} />
                        </button>
                        <button
                          onClick={() => {
                            setEditingBrandId(brand.id);
                            setBrandFormName(brand.name);
                            setBrandFormType(brand.type || "");
                            setBrandFormIcon(brand.icon || "🏭");
                            setBrandFormLogoUrl(brand.logoUrl || "");
                          }}
                          className="p-2 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-xl transition-all cursor-pointer"
                          title="ویرایش برند"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={async () => {
                            confirmAction(
                              "حذف برند",
                              `آیا از حذف برند "${brand.name}" مطمئن هستید؟`,
                              async () => {
                                const updated = brands.filter(b => (b.id || b.name) !== (brand.id || brand.name));
                                setBrands(updated);
                                await onUpdateB2bConfig({ ...b2bConfig, brands: updated });
                                setSuccessMsg("برند با موفقیت حذف گردید.");
                                setTimeout(() => setSuccessMsg(null), 3000);
                              }
                            );
                          }}
                          className="p-2 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl transition-all cursor-pointer"
                          title="حذف برند"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add/Edit Brand Form */}
            <div className="lg:col-span-2 bg-slate-50/70 p-6 rounded-3xl border border-slate-200/80 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <h4 className="text-xs font-black text-slate-900 font-sans flex items-center gap-2">
                  <PlusCircle size={16} className="text-amber-500" />
                  {editingBrandId ? "ویرایش مشخصات برند" : "ثبت برند جدید"}
                </h4>
                {editingBrandId && (
                  <button
                    onClick={() => {
                      setEditingBrandId(null);
                      setBrandFormName("");
                      setBrandFormType("");
                      setBrandFormIcon("🏭");
                      setBrandFormLogoUrl("");
                    }}
                    className="text-[10px] text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded-md hover:bg-rose-100"
                  >
                    انصراف
                  </button>
                )}
              </div>

              <div className="space-y-3.5">
                <div>
                  <label className="text-[11px] font-black text-slate-700 block mb-1">نام برند تجاری (الزامی):</label>
                  <input
                    type="text"
                    value={brandFormName}
                    onChange={(e) => setBrandFormName(e.target.value)}
                    placeholder="مثال: چی‌توز، کاله، سن‌ایچ..."
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-black text-slate-700 block mb-1">نام شرکت / کارخانه مادر:</label>
                  <input
                    type="text"
                    value={brandFormType}
                    onChange={(e) => setBrandFormType(e.target.value)}
                    placeholder="مثال: صنایع دینا، سولیکو کاله..."
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-black text-slate-700 block mb-1">ایموجی / آیکون:</label>
                    <input
                      type="text"
                      value={brandFormIcon}
                      onChange={(e) => setBrandFormIcon(e.target.value)}
                      placeholder="🍿"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 text-center focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-black text-slate-700 block mb-1">پیش‌نمایش:</label>
                    <div className="h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-xl">
                      {brandFormLogoUrl ? (
                        <img src={brandFormLogoUrl} alt="Logo" className="h-7 w-auto object-contain" />
                      ) : (
                        <span>{brandFormIcon || "🏭"}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-black text-slate-700 block mb-1">لوگوی برند (بارگذاری فایل PNG یا URL):</label>
                  <div className="space-y-2">
                    <label className="w-full bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-black py-2.5 px-3 rounded-xl cursor-pointer text-center transition-colors flex items-center justify-center gap-2 shadow-sm">
                      <Upload size={14} className="text-amber-600" />
                      <span>بارگذاری لوگوی PNG/JPG از گالری دستگاه</span>
                      <input
                        type="file"
                        accept="image/png, image/jpeg, image/webp, image/svg+xml, image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              if (event.target?.result) {
                                setBrandFormLogoUrl(event.target.result as string);
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>

                    <input
                      type="text"
                      value={brandFormLogoUrl}
                      onChange={(e) => setBrandFormLogoUrl(e.target.value)}
                      placeholder="یا وارد کردن مستقیم لینک https://.../logo.png"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-amber-500 text-left dir-ltr"
                    />
                  </div>
                </div>

                <button
                  onClick={async () => {
                    if (!brandFormName.trim()) {
                      setErrorMsg("لطفا نام برند را وارد نمایید.");
                      return;
                    }

                    let updated: BrandItem[] = [];
                    if (editingBrandId) {
                      updated = brands.map(b => b.id === editingBrandId ? {
                        ...b,
                        name: brandFormName.trim(),
                        type: brandFormType.trim() || "صنایع غذایی",
                        icon: brandFormIcon || "🏭",
                        logoUrl: brandFormLogoUrl.trim()
                      } : b);
                    } else {
                      const newB: BrandItem = {
                        id: `brand_${Date.now()}`,
                        name: brandFormName.trim(),
                        type: brandFormType.trim() || "صنایع غذایی",
                        icon: brandFormIcon || "🏭",
                        logoUrl: brandFormLogoUrl.trim()
                      };
                      updated = [newB, ...brands];

                      if (autoPostSettings.new_factory) {
                        triggerAutoChannelPost(
                          `🏭 کارخانه جدید همکار: ${brandFormName.trim()}`,
                          `برند تجاری و کارخانه تولیدی جدید "${brandFormName.trim()}" به خانواده بزرگ تولیدکنندگان بدون واسطه سامانه دست اول پیوست.\n\nنوع تولیدات: ${brandFormType.trim() || "صنایع غذایی"}\nهم‌اکنون بنکداران و مراجعین محترم می‌توانند کالاهای بی‌واسطه خط تولید این کارخانه را در کاتالوگ سامانه به طور زنده دنبال کنند.`,
                          "system",
                          "مشاهده کاتالوگ محصولات",
                          `#brands`
                        );
                      }
                    }

                    setBrands(updated);
                    setLoading(true);
                    try {
                      await onUpdateB2bConfig({ ...b2bConfig, brands: updated });
                      setSuccessMsg(editingBrandId ? "مشخصات برند با موفقیت به روز شد." : "برند جدید با موفقیت اضافه شد.");
                      setEditingBrandId(null);
                      setBrandFormName("");
                      setBrandFormType("");
                      setBrandFormIcon("🏭");
                      setBrandFormLogoUrl("");
                      setTimeout(() => setSuccessMsg(null), 3000);
                    } catch (err) {
                      setErrorMsg("خطا در ذخیره‌سازی اطلاعات برند.");
                    } finally {
                      setLoading(false);
                    }
                  }}
                  className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-2xl text-xs font-black shadow-lg shadow-amber-500/20 cursor-pointer transition-all flex items-center justify-center gap-2"
                >
                  <Save size={15} />
                  <span>{editingBrandId ? "ذخیره تغییرات برند" : "افزودن برند به لیست"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'ads' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 bg-white p-6 sm:p-10 rounded-[3rem] border border-slate-100 shadow-2xl text-right" dir="rtl">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-slate-50">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl shadow-inner">
                <Megaphone size={24} />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 font-sans">مدیریت بیلبورد آگهی‌ها</h3>
                <p className="text-[11px] text-slate-400 font-bold mt-1">تایید، رد، ویرایش و حذف گروهی آگهی‌های ثبت شده کاربران.</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex bg-slate-100 p-1 rounded-xl">
                {[
                  { id: 'pending', label: 'در انتظار تایید', count: sponsoredAds.filter(a => (a.status || 'pending') === 'pending').length },
                  { id: 'approved', label: 'تایید شده', count: sponsoredAds.filter(a => a.status === 'approved').length },
                  { id: 'rejected', label: 'رد شده', count: sponsoredAds.filter(a => a.status === 'rejected').length },
                  { id: 'all', label: 'همه', count: sponsoredAds.length },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setAdsFilter(f.id as any)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                      adsFilter === f.id 
                        ? "bg-white text-indigo-600 shadow-sm" 
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    {f.label} ({f.count})
                  </button>
                ))}
              </div>

              <div className="flex bg-slate-100 p-1 rounded-xl">
                {[
                  { id: 'all', label: 'همه دسته‌ها' },
                  { id: 'under_market', label: '📉 زیر قیمت' },
                  { id: 'buy', label: '📥 خرید' },
                  { id: 'sell', label: '📤 فروش' },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setAdsCategoryFilter(f.id as any)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                      adsCategoryFilter === f.id 
                        ? "bg-white text-rose-600 shadow-sm" 
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
               <button
                 onClick={() => {
                   const adsRaw = localStorage.getItem("dastavval_sponsored_ads_v2");
                   if (adsRaw) {
                     try { setSponsoredAds(JSON.parse(adsRaw)); } catch(e){}
                     setSuccessMsg("اطلاعات آگهی‌ها مجددا بارگیری شد.");
                     setTimeout(() => setSuccessMsg(null), 3000);
                   }
                 }}
                 className="p-2 bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200 rounded-xl cursor-pointer transition-all"
                 title="بروزرسانی"
               >
                 <RefreshCw size={14} />
               </button>
            </div>
          </div>

          {/* Batch Operations Bar */}
          {selectedAdIds.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4 animate-in fade-in">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-xl bg-amber-500 text-white flex items-center justify-center text-xs font-black">
                  {selectedAdIds.length}
                </span>
                <span className="text-xs font-black text-amber-900">آگهی انتخاب شده</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => {
                    if (autoPostSettings.new_ad) {
                      selectedAdIds.forEach(id => {
                        const ad = sponsoredAds.find(a => a.id === id);
                        if (ad && ad.status !== 'approved') {
                          triggerAutoChannelPost(
                            `📢 آگهی جدید همکار: ${ad.title}`,
                            `یک آگهی همکار جدید تایید و در سامانه منتشر شد:\n\nعنوان: "${ad.title}"\nتوسط: ${ad.factoryName}\nتوضیحات: ${ad.description}`,
                            "announcement",
                            "مشاهده جزئیات آگهی",
                            `#ads`
                          );
                        }
                      });
                    }

                    const newAds = sponsoredAds.map(a => selectedAdIds.includes(a.id) ? { ...a, status: 'approved', rejectionReason: undefined } : a);
                    localStorage.setItem("dastavval_sponsored_ads_v2", JSON.stringify(newAds));
                    setSponsoredAds(newAds);
                    window.dispatchEvent(new Event("storage"));
                    window.dispatchEvent(new CustomEvent("dastavval_ads_updated"));
                    setSuccessMsg(`${selectedAdIds.length} آگهی با موفقیت تایید و منتشر شدند.`);
                    setSelectedAdIds([]);
                    setTimeout(() => setSuccessMsg(null), 3000);
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle size={14} />
                  <span>تایید گروهی</span>
                </button>
                <button
                  onClick={() => {
                    const newAds = sponsoredAds.map(a => selectedAdIds.includes(a.id) ? { ...a, status: 'rejected', rejectionReason: 'رد گروهی توسط مدیریت' } : a);
                    localStorage.setItem("dastavval_sponsored_ads_v2", JSON.stringify(newAds));
                    setSponsoredAds(newAds);
                    window.dispatchEvent(new Event("storage"));
                    window.dispatchEvent(new CustomEvent("dastavval_ads_updated"));
                    setSuccessMsg(`${selectedAdIds.length} آگهی رد شدند.`);
                    setSelectedAdIds([]);
                    setTimeout(() => setSuccessMsg(null), 3000);
                  }}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <XCircle size={14} />
                  <span>رد گروهی</span>
                </button>
                <button
                  onClick={() => {
                    if (window.confirm(`آیا از حذف ${selectedAdIds.length} آگهی انتخاب شده اطمینان دارید؟`)) {
                      const newAds = sponsoredAds.filter(a => !selectedAdIds.includes(a.id));
                      localStorage.setItem("dastavval_sponsored_ads_v2", JSON.stringify(newAds));
                      setSponsoredAds(newAds);
                      window.dispatchEvent(new Event("storage"));
                      window.dispatchEvent(new CustomEvent("dastavval_ads_updated"));
                      setSuccessMsg(`${selectedAdIds.length} آگهی حذف شدند.`);
                      setSelectedAdIds([]);
                      setTimeout(() => setSuccessMsg(null), 3000);
                    }
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-xl text-xs font-black shadow-sm transition-all flex items-center gap-1.5 cursor-pointer border border-slate-200"
                >
                  <Trash2 size={14} />
                  <span>حذف گروهی</span>
                </button>
                <button
                  onClick={() => setSelectedAdIds([])}
                  className="px-4 py-2 bg-white text-slate-600 hover:bg-slate-100 border border-amber-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  لغو انتخاب
                </button>
              </div>
            </div>
          )}
          
          <div className="overflow-x-auto">
            <table className="w-full text-right border-separate border-spacing-y-2">
              <thead>
                <tr className="text-[10px] font-black text-slate-400">
                  <th className="px-3 py-2 w-10 text-center">
                    {(() => {
                      const filtered = sponsoredAds.filter(ad => {
                        const statusMatch = adsFilter === 'all' || (ad.status || 'pending') === adsFilter;
                        const categoryMatch = adsCategoryFilter === 'all' || ad.category === adsCategoryFilter;
                        return statusMatch && categoryMatch;
                      });
                      const allIds = filtered.map(a => a.id);
                      const isAllSelected = allIds.length > 0 && allIds.every(id => selectedAdIds.includes(id));
                      return (
                        <input 
                          type="checkbox"
                          checked={isAllSelected}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedAdIds(allIds);
                            } else {
                              setSelectedAdIds([]);
                            }
                          }}
                          className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                          title="انتخاب همه این لیست"
                        />
                      );
                    })()}
                  </th>
                  <th className="px-4 py-2 font-black text-right">تصویر</th>
                  <th className="px-4 py-2 font-black text-right">عنوان آگهی / کاربر</th>
                  <th className="px-4 py-2 font-black text-right">دسته‌بندی و قیمت</th>
                  <th className="px-4 py-2 font-black text-right">وضعیت</th>
                  <th className="px-4 py-2 font-black text-right">ویژه</th>
                  <th className="px-4 py-2 font-black text-left">عملیات</th>
                </tr>
              </thead>
              <tbody className="text-xs">
                {(() => {
                  const filtered = sponsoredAds.filter(ad => {
                    const statusMatch = adsFilter === 'all' || (ad.status || 'pending') === adsFilter;
                    const categoryMatch = adsCategoryFilter === 'all' || ad.category === adsCategoryFilter;
                    return statusMatch && categoryMatch;
                  });

                  if (filtered.length === 0) {
                    return <tr><td colSpan={7} className="text-center py-12 text-slate-400 font-bold">هیچ آگهی در این وضعیت یافت نشد.</td></tr>;
                  }

                  return filtered.map((ad: any) => {
                    const isSelected = selectedAdIds.includes(ad.id);
                    return (
                      <tr key={ad.id} className={`transition-colors ${isSelected ? 'bg-amber-50/70 border-amber-300' : 'bg-slate-50/50 hover:bg-slate-50'}`}>
                        <td className="px-3 py-3 rounded-r-2xl border-y border-r border-slate-100 text-center">
                          <input 
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedAdIds(prev => [...prev, ad.id]);
                              } else {
                                setSelectedAdIds(prev => prev.filter(id => id !== ad.id));
                              }
                            }}
                            className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                          />
                        </td>
                        <td className="px-4 py-3 border-y border-slate-100">
                          <div className="relative group">
                            <img 
                              src={ad.imageUrl} 
                              alt={ad.title} 
                              className="w-12 h-12 rounded-xl object-cover border border-slate-200 shadow-sm" 
                              referrerPolicy="no-referrer"
                            />
                            {ad.specialRequest && (
                              <div className="absolute -top-1 -right-1 bg-amber-500 text-white p-1 rounded-full border-2 border-white shadow-sm" title="درخواست ویژه سازی">
                                <Sparkles size={8} />
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 border-y border-slate-100">
                          <div className="font-black text-slate-800 text-sm">{ad.title}</div>
                          <div className="text-[10px] text-slate-500 font-bold mt-1 flex items-center gap-2">
                            <span>👤 {ad.factoryName}</span>
                            <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                            <span>📞 {ad.contactPhone}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 border-y border-slate-100">
                          <div className="flex flex-col gap-1.5">
                            <span className={`inline-block w-fit px-2 py-1 rounded-lg text-[10px] font-black ${
                              ad.category === "under_market" ? "bg-rose-50 text-rose-700" : "bg-slate-100 text-slate-600"
                            }`}>
                              {ad.category === "under_market" ? "📉 زیر قیمت بازار" : ad.category === "liquid" ? "🔄 تهاتر" : ad.category === "buy" ? "📥 خرید" : ad.category === "sell" ? "📤 فروش" : ad.category === "jobs" ? "💼 استخدام" : ad.category === "services" ? "🛠️ خدمات" : ad.category}
                            </span>
                            {(ad.wholesalePrice || ad.marketPrice) && (
                              <div className="text-[10px] font-bold text-indigo-700 flex items-center gap-2">
                                <span>💰 عمده: {ad.wholesalePrice}</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 border-y border-slate-100">
                          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black border ${
                            (ad.status || 'pending') === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-200' : 
                            ad.status === 'rejected' ? 'bg-rose-50 text-rose-700 border-rose-200' : 
                            'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${
                              (ad.status || 'pending') === 'pending' ? 'bg-amber-500' : 
                              ad.status === 'rejected' ? 'bg-rose-500' : 
                              'bg-emerald-500'
                            }`} />
                            {(ad.status || 'pending') === 'pending' ? 'در انتظار تایید' : 
                             ad.status === 'rejected' ? 'رد شده' : 'تایید شده'}
                          </div>
                        </td>
                        <td className="px-4 py-3 border-y border-slate-100">
                          <button
                            onClick={() => {
                               const newAds = sponsoredAds.map(a => a.id === ad.id ? {...a, isSponsored: !a.isSponsored} : a);
                               localStorage.setItem("dastavval_sponsored_ads_v2", JSON.stringify(newAds));
                               setSponsoredAds(newAds);
                               setSuccessMsg(ad.isSponsored ? "آگهی از حالت ویژه خارج شد." : "آگهی ویژه شد.");
                               setTimeout(() => setSuccessMsg(null), 2000);
                            }}
                            className={`px-3 py-1.5 rounded-xl text-[10px] font-black transition-all border flex items-center gap-1.5 cursor-pointer ${ad.isSponsored ? 'bg-amber-500 text-white border-amber-600 shadow-sm' : 'bg-white text-slate-400 border-slate-200 hover:border-amber-300 hover:text-amber-600'}`}
                          >
                            <Sparkles size={12} />
                            {ad.isSponsored ? "ویژه" : "عادی"}
                          </button>
                        </td>
                        <td className="px-4 py-3 rounded-l-2xl border-y border-l border-slate-100 text-left">
                          <div className="flex items-center gap-2 justify-end">
                            <button
                              onClick={() => setSelectedAdForView(ad)}
                              className="p-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-colors shadow-sm cursor-pointer"
                              title="مشاهده جزئیات و تایید"
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              onClick={() => {
                                setAdToEdit(ad);
                                setEditAdForm({...ad});
                              }}
                              className="p-2 bg-amber-50 text-amber-600 rounded-xl hover:bg-amber-100 transition-colors shadow-sm cursor-pointer"
                              title="ویرایش سریع آگهی"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                               onClick={() => {
                                  if(window.confirm("آیا از حذف این آگهی مطمئن هستید؟")) {
                                     const newAds = sponsoredAds.filter(a => a.id !== ad.id);
                                     localStorage.setItem("dastavval_sponsored_ads_v2", JSON.stringify(newAds));
                                     setSponsoredAds(newAds);
                                     window.dispatchEvent(new Event("storage"));
                                     window.dispatchEvent(new CustomEvent("dastavval_ads_updated"));
                                     setSuccessMsg("آگهی حذف شد.");
                                     setTimeout(() => setSuccessMsg(null), 2000);
                                  }
                               }}
                               className="p-2 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-100 transition-colors shadow-sm cursor-pointer"
                               title="حذف آگهی"
                            >
                               <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  });
                })()}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Ad Modal */}
      {adToEdit && editAdForm && (
        <div className="fixed inset-0 bg-white/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4" dir="rtl">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl border border-slate-100"
          >
            <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-amber-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500 text-white rounded-xl">
                  <Edit2 size={20} />
                </div>
                <h3 className="text-sm font-black text-slate-800">ویرایش آگهی: {adToEdit.title}</h3>
              </div>
              <button onClick={() => setAdToEdit(null)} className="p-2 hover:bg-white rounded-full transition-colors text-slate-400">
                <X size={20} />
              </button>
            </div>

            <div className="p-8 space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 block px-1">عنوان آگهی کالا</label>
                <input 
                  type="text" 
                  value={editAdForm.title}
                  onChange={(e) => setEditAdForm({...editAdForm, title: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 block px-1">قیمت پیشنهادی عمده</label>
                  <input 
                    type="text" 
                    value={editAdForm.wholesalePrice}
                    onChange={(e) => setEditAdForm({...editAdForm, wholesalePrice: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                    placeholder="مثال: ۱۲۵,۰۰۰ تومان"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 block px-1">قیمت کف بازار</label>
                  <input 
                    type="text" 
                    value={editAdForm.marketPrice}
                    onChange={(e) => setEditAdForm({...editAdForm, marketPrice: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                    placeholder="مثال: ۱۵۰,۰۰۰ تومان"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 block px-1">دسته‌بندی</label>
                <select 
                  value={editAdForm.category}
                  onChange={(e) => setEditAdForm({...editAdForm, category: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                >
                  <option value="under_market">📉 زیر قیمت بازار</option>
                  <option value="liquid">🔥 حراج مازاد</option>
                  <option value="direct_supply">📦 تامین مستقیم</option>
                  <option value="barter">🔄 تهاتر کالا</option>
                  <option value="sell">📤 فروش عادی</option>
                  <option value="buy">📥 درخواست خرید</option>
                </select>
              </div>
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
              <button 
                onClick={() => setAdToEdit(null)}
                className="px-6 py-3 rounded-2xl text-xs font-bold text-slate-500 hover:bg-white transition-all"
              >
                انصراف
              </button>
              <button 
                onClick={handleUpdateAd}
                className="px-10 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl text-xs font-black shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2"
              >
                <Save size={16} />
                <span>ذخیره تغییرات آگهی</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
      {showPrintInvoice && (
        <WholesaleInvoiceView 
          order={showPrintInvoice} 
          b2bConfig={b2bConfig} 
          onClose={() => setShowPrintInvoice(null)} 
          isAdmin={true}
        />
      )}

      {selectedAdForView && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6 bg-white/60 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row text-right font-sans"
            dir="rtl"
          >
            {/* Ad Image Container */}
            <div className="w-full md:w-1/2 h-64 md:h-auto relative bg-slate-100 overflow-hidden group">
              <img 
                src={selectedAdForView.imageUrl} 
                alt={selectedAdForView.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <button 
                onClick={() => setSelectedAdForView(null)}
                className="absolute top-6 right-6 p-2.5 bg-white/90 backdrop-blur-md rounded-2xl shadow-xl hover:bg-white transition-all md:hidden text-slate-800"
              >
                <X size={20} />
              </button>
            </div>

            {/* Ad Content Container */}
            <div className="w-full md:w-1/2 p-6 sm:p-10 flex flex-col overflow-y-auto max-h-[60vh] md:max-h-none custom-scrollbar">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="bg-indigo-600 text-white text-[10px] font-black px-4 py-1.5 rounded-full shadow-md shadow-indigo-600/20">
                      {selectedAdForView.category === "under_market" ? "📉 زیر قیمت بازار" : selectedAdForView.category === "liquid" ? "🔥 حراج مازاد" : selectedAdForView.category === "direct_supply" ? "📦 تامین مستقیم" : selectedAdForView.category === "barter" ? "🔄 تهاتر" : selectedAdForView.category === "buy" ? "📥 خرید" : selectedAdForView.category === "sell" ? "📤 فروش" : selectedAdForView.category === "jobs" ? "💼 استخدام" : "🛠️ خدمات"}
                    </span>
                    {selectedAdForView.isSponsored && (
                      <span className="bg-amber-100 text-amber-700 text-[10px] font-black px-4 py-1.5 rounded-full border border-amber-200 flex items-center gap-1.5 animate-pulse">
                        <Sparkles size={12} />
                        آگهی ویژه
                      </span>
                    )}
                    {selectedAdForView.specialRequest && (
                      <span className="bg-rose-50 text-rose-700 text-[10px] font-black px-4 py-1.5 rounded-full border border-rose-100">
                        🔔 درخواست ارتقا به ویژه
                      </span>
                    )}
                  </div>
                  <button 
                    onClick={() => setSelectedAdForView(null)}
                    className="hidden md:block p-3 hover:bg-slate-100 rounded-2xl transition-all cursor-pointer text-slate-400 hover:text-slate-600"
                  >
                    <X size={20} />
                  </button>
                </div>

                <h3 className="text-2xl font-black text-slate-800 mb-6 leading-tight">
                  {selectedAdForView.title}
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                  <div className="bg-slate-50 p-4 rounded-[1.5rem] border border-slate-100">
                    <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 mb-2">
                      <Building2 size={14} className="text-indigo-500" />
                      <span>واحد تجاری / کارفرما</span>
                    </div>
                    <div className="text-sm font-black text-slate-700">{selectedAdForView.factoryName}</div>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-[1.5rem] border border-slate-100">
                    <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 mb-2">
                      <Phone size={14} className="text-indigo-500" />
                      <span>شماره تماس مستقیم</span>
                    </div>
                    <div className="text-sm font-black text-slate-700 font-mono tracking-wider">{selectedAdForView.contactPhone}</div>
                  </div>
                  {/* Pricing metrics for Under Market Price items */}
                  {selectedAdForView.wholesalePrice && (
                    <div className="bg-emerald-50/50 p-4 rounded-[1.5rem] border border-emerald-100">
                      <div className="flex items-center gap-2 text-[10px] font-black text-emerald-600 mb-2">
                        <DollarSign size={14} />
                        <span>قیمت عمده پیشنهادی</span>
                      </div>
                      <div className="text-sm font-black text-emerald-700">{selectedAdForView.wholesalePrice}</div>
                    </div>
                  )}
                  {selectedAdForView.marketPrice && (
                    <div className="bg-rose-50/50 p-4 rounded-[1.5rem] border border-rose-100">
                      <div className="flex items-center gap-2 text-[10px] font-black text-rose-600 mb-2">
                        <Tag size={14} />
                        <span>قیمت بازار آزاد</span>
                      </div>
                      <div className="text-sm font-black text-rose-700 line-through opacity-70">{selectedAdForView.marketPrice}</div>
                    </div>
                  )}
                </div>

                {selectedAdForView.specialRequest && selectedAdForView.specialRequestMessage && (
                  <div className="bg-amber-50 border border-amber-100 p-5 rounded-[1.5rem] mb-8">
                    <div className="flex items-center gap-2 text-[10px] font-black text-amber-600 mb-3 uppercase tracking-tighter">
                      <Sparkles size={14} />
                      <span>پیام درخواست ویژه سازی:</span>
                    </div>
                    <p className="text-xs font-bold text-amber-800 leading-relaxed italic">
                      " {selectedAdForView.specialRequestMessage} "
                    </p>
                  </div>
                )}

                <div className="bg-slate-50 p-6 rounded-[1.5rem] border border-slate-100">
                  <label className="block text-[10px] font-black text-slate-400 mb-4 flex items-center gap-2">
                    <FileText size={14} className="text-slate-400" />
                    شرح جزئیات و شرایط آگهی:
                  </label>
                  <div className="text-xs font-bold text-slate-600 leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto custom-scrollbar pr-1">
                    {selectedAdForView.description}
                  </div>
                </div>

                {selectedAdForView.rejectionReason && (
                   <div className="bg-rose-50 border border-rose-100 p-5 rounded-[1.5rem] mt-6">
                    <div className="flex items-center gap-2 text-[10px] font-black text-rose-600 mb-3">
                      <ShieldAlert size={14} />
                      <span>دلیل رد قبلی:</span>
                    </div>
                    <p className="text-xs font-bold text-rose-800 leading-relaxed">
                      {selectedAdForView.rejectionReason}
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-10 pt-6 border-t border-slate-100 flex items-center gap-4">
                <button
                  onClick={() => {
                    const wasApproved = selectedAdForView.status === "approved";
                    const newAds = sponsoredAds.map(a => a.id === selectedAdForView.id ? {...a, status: "approved", rejectionReason: undefined} : a);
                    localStorage.setItem("dastavval_sponsored_ads_v2", JSON.stringify(newAds));
                    setSponsoredAds(newAds);
                    setSelectedAdForView({...selectedAdForView, status: "approved", rejectionReason: undefined});
                    setSuccessMsg("آگهی با موفقیت تایید و منتشر شد.");

                    if (!wasApproved && autoPostSettings.new_ad) {
                      triggerAutoChannelPost(
                        `📢 آگهی جدید همکار: ${selectedAdForView.title}`,
                        `یک آگهی همکار جدید تایید و در سامانه منتشر شد:\n\nعنوان: "${selectedAdForView.title}"\nتوسط: ${selectedAdForView.factoryName}\nتوضیحات: ${selectedAdForView.description}`,
                        "announcement",
                        "مشاهده جزئیات آگهی",
                        `#ads`
                      );
                    }

                    setTimeout(() => setSuccessMsg(null), 2000);
                  }}
                  className={`flex-1 py-4 rounded-2xl text-[13px] font-black transition-all shadow-xl flex items-center justify-center gap-2.5 ${selectedAdForView.status === 'approved' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200 cursor-default' : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30 hover:-translate-y-0.5 cursor-pointer active:translate-y-0'}`}
                >
                  {selectedAdForView.status === 'approved' ? <CheckCircle size={18} /> : null}
                  {selectedAdForView.status === 'approved' ? "آگهی تایید شده" : "تایید و انتشار آگهی"}
                </button>
                <button
                  onClick={() => {
                    setAdToReject(selectedAdForView);
                    setShowRejectionReasonModal(true);
                  }}
                  className={`flex-1 py-4 rounded-2xl text-[13px] font-black transition-all border flex items-center justify-center gap-2.5 ${selectedAdForView.status === 'rejected' ? 'bg-rose-50 text-rose-600 border-rose-100 cursor-default' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-rose-300 hover:text-rose-600 cursor-pointer'}`}
                >
                  {selectedAdForView.status === 'rejected' ? <XCircle size={18} /> : null}
                  {selectedAdForView.status === 'rejected' ? "رد شده" : "رد و اعلام نقص"}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {showRejectionReasonModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-white/40 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white w-full max-w-md rounded-[2rem] p-8 shadow-2xl text-right" dir="rtl"
          >
            <h4 className="text-lg font-black text-slate-800 mb-2">علت رد آگهی</h4>
            <p className="text-[10px] text-slate-400 font-bold mb-6">دلیل رد یا موارد اصلاحی را برای کاربر بنویسید:</p>
            
            <textarea
              value={rejectionReasonInput}
              onChange={(e) => setRejectionReasonInput(e.target.value)}
              placeholder="مثال: تصویر آگهی نامناسب است یا اطلاعات تماس اشتباه وارد شده..."
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-bold text-slate-800 outline-none focus:border-rose-500 h-32 resize-none mb-6"
              autoFocus
            />

            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  if (!rejectionReasonInput.trim()) return;
                  const newAds = sponsoredAds.map(a => a.id === adToReject.id ? {...a, status: "rejected", rejectionReason: rejectionReasonInput} : a);
                  localStorage.setItem("dastavval_sponsored_ads_v2", JSON.stringify(newAds));
                  setSponsoredAds(newAds);
                  if (selectedAdForView && selectedAdForView.id === adToReject.id) {
                    setSelectedAdForView({...selectedAdForView, status: "rejected", rejectionReason: rejectionReasonInput});
                  }
                  setShowRejectionReasonModal(false);
                  setRejectionReasonInput("");
                  setAdToReject(null);
                  setSuccessMsg("آگهی رد و علت ثبت شد.");
                  setTimeout(() => setSuccessMsg(null), 2000);
                }}
                className="flex-1 bg-rose-600 text-white py-3.5 rounded-2xl text-xs font-black hover:bg-rose-700 transition-all shadow-lg shadow-rose-600/20"
              >
                تایید نهایی رد آگهی
              </button>
              <button
                onClick={() => {
                  setShowRejectionReasonModal(false);
                  setRejectionReasonInput("");
                  setAdToReject(null);
                }}
                className="flex-1 bg-slate-100 text-slate-600 py-3.5 rounded-2xl text-xs font-black hover:bg-slate-200 transition-all"
              >
                انصراف
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Representative Certificate Print View */}
      {selectedRepForCertificate && (
        <RepresentativeCertificateView
          repName={selectedRepForCertificate.name}
          companyName={selectedRepForCertificate.company || selectedRepForCertificate.badge || "شرکت پخش همکار"}
          city={selectedRepForCertificate.city}
          agencyCode={selectedRepForCertificate.agencyCode || `AGN-1405-${Math.floor(1000 + Math.random() * 9000)}`}
          badge={selectedRepForCertificate.badge || "نماینده انحصاری توزیع"}
          isApproved={selectedRepForCertificate.isApproved}
          onClose={() => setSelectedRepForCertificate(null)}
          b2bConfig={b2bConfig}
        />
      )}

      {/* Invoice Editing Modal */}
      <AnimatePresence>
        {selectedFactoryForProducts && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-white/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden text-right font-sans"
              dir="rtl"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-slate-50">
                <button onClick={() => setSelectedFactoryForProducts(null)} className="p-2 hover rounded-full transition-all cursor-pointer">
                  <X size={20} className="text-slate-500" />
                </button>
                <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                  📦 لیست محصولات کارخانه «{selectedFactoryForProducts.name}»
                </h3>
              </div>
              <div className="p-8 space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
                {products.filter(p => p.brand === selectedFactoryForProducts.name || (p.sellerName && p.sellerName.includes(selectedFactoryForProducts.name))).length === 0 ? (
                  <p className="text-center text-xs font-bold text-slate-400 py-8">هیچ محصولی در کاتالوگ جاری برای این تولیدکننده یافت نشد.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {products.filter(p => p.brand === selectedFactoryForProducts.name || (p.sellerName && p.sellerName.includes(selectedFactoryForProducts.name))).map(p => (
                      <div key={p.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-150 flex items-center gap-3">
                        <img src={p.image_url} alt={p.name} className="w-12 h-12 object-cover rounded-xl border shrink-0" referrerPolicy="no-referrer" />
                        <div className="space-y-1">
                          <h4 className="text-xs font-black text-slate-800">{p.name}</h4>
                          <p className="text-[9px] text-slate-400 font-bold">بسته‌بندی: {toPersianNum(p.carton_pack_count || 24)} عددی</p>
                          <p className="text-[10px] text-indigo-600 font-black">{toPersianNum((p.bulk_price || p.price || 0).toLocaleString())} تومان</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}

        {showCrmModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-white/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden text-right font-sans"
              dir="rtl"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-slate-50">
                <button onClick={() => setShowCrmModal(false)} className="p-2 hover rounded-full transition-all cursor-pointer">
                  <X size={20} className="text-slate-500" />
                </button>
                <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                  👤 {editingCrmCustomer ? "ویرایش اطلاعات بنکدار" : "افزودن بنکدار به باشگاه مشتریان"}
                </h3>
              </div>
              <form onSubmit={handleCrmSubmit} className="p-8 space-y-5 max-h-[70vh] overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400">نام کامل بنکدار / نماینده:</label>
                    <input 
                      type="text" 
                      required 
                      value={crmName} 
                      onChange={e => setCrmName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-black outline-none focus focus" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400">نام شرکت / پخش:</label>
                    <input 
                      type="text" 
                      required 
                      value={crmCompany} 
                      onChange={e => setCrmCompany(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-black outline-none focus focus" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400">شماره تلفن همراه:</label>
                    <input 
                      type="text" 
                      required 
                      value={crmPhone} 
                      onChange={e => setCrmPhone(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-mono outline-none focus focus" 
                      placeholder="0912..."
                      dir="ltr"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400">شهر محل فعالیت:</label>
                    <input 
                      type="text" 
                      required 
                      value={crmCity} 
                      onChange={e => setCrmCity(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-black outline-none focus focus" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400">سال تاسیس کسب و کار:</label>
                    <input 
                      type="number" 
                      required 
                      value={crmYear} 
                      onChange={e => setCrmYear(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold outline-none focus focus" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400">نقش کاربر:</label>
                    <select 
                      value={crmRole} 
                      onChange={e => setCrmRole(e.target.value as any)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold outline-none focus focus"
                    >
                      <option value="customer">👥 مشتری (بنکدار)</option>
                      <option value="representative">🛡️ نماینده رسمی فروش</option>
                      <option value="marketer">📣 بازاریاب و معرف</option>
                      <option value="factory">🏭 کارخانه / تولیدکننده</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400">سطح وفاداری بنکدار:</label>
                    <select 
                      value={crmBadge} 
                      onChange={e => setCrmBadge(e.target.value as any)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold outline-none focus focus"
                    >
                      <option value="vip">تاج طلایی (VIP)</option>
                      <option value="gold">رتبه عالی (طلا)</option>
                      <option value="silver">رتبه همکار (نقره)</option>
                      <option value="bronze">عضو جدید (برنز)</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400">وضعیت حساب:</label>
                    <select 
                      value={crmStatus} 
                      onChange={e => setCrmStatus(e.target.value as any)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold outline-none focus focus"
                    >
                      <option value="active">فعال و مورد تایید سیستم</option>
                      <option value="pending_verification">در انتظار احراز مدارک</option>
                      <option value="blocked">مسدود به علت بدهی</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400">تعداد کل فاکتورها:</label>
                    <input 
                      type="number" 
                      value={crmTotalOrders} 
                      onChange={e => setCrmTotalOrders(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold outline-none focus focus" 
                    />
                  </div>
                  <div className="space-y-1 col-span-2">
                    <label className="text-[10px] font-black text-slate-400">حجم مبادلات کل (تومان):</label>
                    <input 
                      type="number" 
                      value={crmTotalPurchase} 
                      onChange={e => setCrmTotalPurchase(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold outline-none focus focus" 
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400">یادداشت اداری / سوابق اعتباری:</label>
                  <textarea 
                    rows={3} 
                    value={crmNotes} 
                    onChange={e => setCrmNotes(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold outline-none focus focus" 
                  />
                </div>
                <div className="flex gap-2 pt-4">
                  <button 
                    type="submit" 
                    className="flex-1 bg-indigo-600 hover text-white font-black py-3 rounded-xl text-xs transition-all cursor-pointer"
                  >
                    ثبت نهایی بنکدار
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setShowCrmModal(false)}
                    className="px-6 bg-slate-100 hover text-slate-600 font-bold py-3 rounded-xl text-xs transition-all cursor-pointer"
                  >
                    انصراف
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {showNotificationModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-white/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden text-right font-sans"
              dir="rtl"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-slate-50">
                <button onClick={() => setShowNotificationModal(null)} className="p-2 hover rounded-full transition-all cursor-pointer">
                  <X size={20} className="text-slate-500" />
                </button>
                <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                  🔔 ارسال اعلان اختصاصی به {showNotificationModal.company}
                </h3>
              </div>
              <form onSubmit={handleSendNotificationSubmit} className="p-8 space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400">عنوان پیام اعلان:</label>
                  <input 
                    type="text" 
                    required 
                    value={notificationTitle} 
                    onChange={e => setNotificationTitle(e.target.value)}
                    placeholder="مثال: کد تخفیف ویژه خریدهای نقدی خط تولید"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-black outline-none focus focus" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400">متن تفصیلی پیام:</label>
                  <textarea 
                    rows={4} 
                    required 
                    value={notificationBody} 
                    onChange={e => setNotificationBody(e.target.value)}
                    placeholder="متن پیام شما به بنکدار در پنل کاربری وی ظاهر خواهد شد..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold outline-none focus focus" 
                  />
                </div>
                <button 
                  type="submit" 
                  className="w-full bg-amber-500 hover text-white font-black py-3 rounded-xl text-xs transition-all cursor-pointer shadow-lg shadow-amber-500/10"
                >
                  ارسال سریع اعلان
                </button>
              </form>
            </motion.div>
          </div>
        )}

        {showCrmBatchEditModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-white/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden text-right font-sans"
              dir="rtl"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-slate-50">
                <button onClick={() => setShowCrmBatchEditModal(false)} className="p-2 hover rounded-full transition-all cursor-pointer">
                  <X size={20} className="text-slate-500" />
                </button>
                <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                  ✏️ ویرایش گروهی ({toPersianNum(selectedCrmIds.length)} بنکدار)
                </h3>
              </div>
              <div className="p-8 space-y-5">
                <p className="text-xs text-slate-500 font-bold leading-relaxed">
                  تغییرات زیر به صورت همزمان روی کل {toPersianNum(selectedCrmIds.length)} بنکدار انتخاب شده اعمال خواهد شد. فیلدهایی که خالی رها شوند تغییری نخواهند کرد.
                </p>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400">نشان بنکداری (Badge):</label>
                  <select 
                    value={batchCrmBadge} 
                    onChange={e => setBatchCrmBadge(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-black outline-none focus focus"
                  >
                    <option value="">-- بدون تغییر --</option>
                    <option value="bronze">🥉 نشان برنزی</option>
                    <option value="silver">🥈 نشان نقره‌ای</option>
                    <option value="gold">🥇 نشان طلایی</option>
                    <option value="vip">👑 نشان ویژه VIP</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400">وضعیت تایید حساب:</label>
                  <select 
                    value={batchCrmStatus} 
                    onChange={e => setBatchCrmStatus(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-black outline-none focus focus"
                  >
                    <option value="">-- بدون تغییر --</option>
                    <option value="active">✅ فعال و تایید شده</option>
                    <option value="pending_verification">⏳ در انتظار تایید</option>
                    <option value="suspended">🚫 مسدود شده</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400">شهر محل فعالیت:</label>
                  <input 
                    type="text" 
                    value={batchCrmCity} 
                    onChange={e => setBatchCrmCity(e.target.value)}
                    placeholder="مثال: تبریز (خالی رها کنید تا تغییر نکند)"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold outline-none focus focus" 
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button 
                    onClick={handleBatchUpdateCrm}
                    disabled={!batchCrmBadge && !batchCrmStatus && !batchCrmCity}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-black py-3 rounded-xl text-xs transition-all cursor-pointer shadow-lg shadow-indigo-600/10 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ذخیره تغییرات گروهی
                  </button>
                  <button 
                    onClick={() => setShowCrmBatchEditModal(false)}
                    className="px-5 bg-slate-100 hover text-slate-600 font-bold py-3 rounded-xl text-xs transition-all cursor-pointer"
                  >
                    انصراف
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {showDirectInvoiceModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-white/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden text-right font-sans"
              dir="rtl"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-slate-50">
                <button onClick={() => setShowDirectInvoiceModal(null)} className="p-2 hover rounded-full transition-all cursor-pointer">
                  <X size={20} className="text-slate-500" />
                </button>
                <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                  🧾 صدور مستقیم فاکتور کارخانه‌ای برای {showDirectInvoiceModal.company}
                </h3>
              </div>
              <form onSubmit={handleCreateDirectInvoice} className="p-8 space-y-5 max-h-[75vh] overflow-y-auto custom-scrollbar">
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400">نحوه تسویه مالی فاکتور:</label>
                    <select 
                      value={directPaymentStatus} 
                      onChange={e => setDirectPaymentStatus(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold outline-none focus focus font-sans"
                    >
                      <option value="pending">در انتظار پرداخت حواله</option>
                      <option value="paid">تسویه نقدی کامل</option>
                      <option value="unpaid">فروش امانی / چک صیادی</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400">شرکت باربری و روش ارسال:</label>
                    <select 
                      value={directShippingMethod} 
                      onChange={e => setDirectShippingMethod(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold outline-none focus focus font-sans"
                    >
                      <option value="باربری همکار">باربری تخصصی و معتبر (سراسری)</option>
                      <option value="تحویل درب کارخانه">تحویل مستقیم درب کارخانه (EXW)</option>
                      <option value="پست پیشتاز">ارسال فوری پست پیشتاز</option>
                    </select>
                  </div>
                  <div className="col-span-full space-y-1">
                    <label className="text-[10px] font-black text-slate-400">آدرس دقیق تخلیه و تحویل بار:</label>
                    <input 
                      type="text" 
                      required 
                      value={directAddress} 
                      onChange={e => setDirectAddress(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-black outline-none focus focus" 
                    />
                  </div>
                </div>

                {/* Add Item Builder */}
                <div className="border-t border-slate-100 pt-4 space-y-3">
                  <label className="text-xs font-black text-slate-800">افزودن کالا به فاکتور صادر شده:</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <select 
                      id="direct-product-selector"
                      className="col-span-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-black font-sans"
                    >
                      {products.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.brand}) • {toPersianNum((p.bulk_price || p.price || 0).toLocaleString())} تومان
                        </option>
                      ))}
                    </select>
                    <div className="flex gap-1">
                      <input 
                        type="number" 
                        id="direct-product-quantity"
                        defaultValue={10} 
                        min={1}
                        className="w-16 bg-slate-50 border border-slate-200 rounded-xl px-2 py-1 text-xs font-black font-mono text-center" 
                      />
                      <button 
                        type="button"
                        onClick={() => {
                          const select = document.getElementById("direct-product-selector") as HTMLSelectElement;
                          const qtyInput = document.getElementById("direct-product-quantity") as HTMLInputElement;
                          const pId = select.value;
                          const qty = Number(qtyInput.value);
                          const prod = products.find(p => p.id === pId);
                          if (prod) {
                            setDirectInvoiceItems(prev => [...prev, { product: prod, quantity: qty }]);
                          }
                        }}
                        className="flex-1 bg-emerald-600 hover text-white rounded-xl text-xs font-black transition-all cursor-pointer"
                      >
                        + افزودن
                      </button>
                    </div>
                  </div>
                </div>

                {/* Added items list */}
                {directInvoiceItems.length > 0 && (
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150 space-y-2">
                    <span className="block text-[10px] text-slate-400 font-black">کالاهای موجود در پیش‌نویس فاکتور:</span>
                    <div className="space-y-1.5 max-h-36 overflow-y-auto">
                      {directInvoiceItems.map((item, idx) => (
                        <div key={`admin-panel-draft-item-${(item as any).id || (item as any).product?.id || idx}-${idx}`} className="flex justify-between items-center bg-white p-2.5 rounded-xl border border-slate-100 font-sans">
                          <button 
                            type="button"
                            onClick={() => setDirectInvoiceItems(prev => prev.filter((_, i) => i !== idx))}
                            className="text-rose-600 hover text-[10px] font-black bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-100 cursor-pointer"
                          >
                            حذف
                          </button>
                          <div className="text-right">
                            <span className="text-xs font-black text-slate-800 block">{item.product.name}</span>
                            <span className="text-[10px] text-slate-400 block font-bold">
                              تعداد: {toPersianNum(item.quantity)} کارتن • فی: {toPersianNum((item.product.bulk_price || item.product.price || 0).toLocaleString())} تومان
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-xs font-black text-indigo-600">
                      <span>جمع کل فاکتور:</span>
                      <span>
                        {toPersianNum(directInvoiceItems.reduce((sum, item) => sum + ((item.product.bulk_price || item.product.price || 0) * item.quantity), 0).toLocaleString())} تومان
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-4">
                  <button 
                    type="submit" 
                    className="flex-1 bg-white hover text-white font-black py-3 rounded-xl text-xs transition-all cursor-pointer shadow-lg shadow-slate-950/15"
                  >
                    ثبت و صدور نهایی فاکتور رسمی
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setShowDirectInvoiceModal(null)}
                    className="px-6 bg-slate-150 hover text-slate-600 font-bold py-3 rounded-xl text-xs transition-all cursor-pointer"
                  >
                    انصراف
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}

        {editingOrder && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-white/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden text-right"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-slate-50">
                <button onClick={() => setEditingOrder(null)} className="p-2 hover rounded-full transition-all">
                  <X size={20} className="text-slate-500" />
                </button>
                <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                  <Edit3 size={18} className="text-emerald-600" />
                  ویرایش و اصلاح فاکتور رسمی
                </h3>
              </div>
              <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 mb-1.5 mr-2">نام تحویل‌گیرنده</label>
                    <input 
                      value={editBuyerName} 
                      onChange={e => setEditBuyerName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs font-bold outline-none focus focus"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 mb-1.5 mr-2">نام فروشگاه / شرکت</label>
                    <input 
                      value={editBuyerCompany} 
                      onChange={e => setEditBuyerCompany(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs font-bold outline-none focus focus"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 mb-1.5 mr-2">شماره تماس</label>
                    <input 
                      value={editBuyerPhone} 
                      onChange={e => setEditBuyerPhone(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs font-bold outline-none focus focus font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 mb-1.5 mr-2">مبلغ کل فاکتور (تومان)</label>
                    <input 
                      type="number"
                      value={editTotalAmount} 
                      onChange={e => setEditTotalAmount(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs font-bold outline-none focus focus font-mono"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 mb-1.5 mr-2">آدرس تحویل و تخلیه بار</label>
                  <textarea 
                    value={editBuyerAddress} 
                    onChange={e => setEditBuyerAddress(e.target.value)}
                    rows={3}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs font-bold outline-none focus focus"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 mb-1.5 mr-2">وضعیت تسویه مالی</label>
                  <select
                    value={editPaymentStatus}
                    onChange={e => setEditPaymentStatus(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs font-bold outline-none focus focus"
                  >
                    <option value="pending">در انتظار پرداخت</option>
                    <option value="paid">تسویه شده کامل</option>
                    <option value="unpaid">پرداخت نشده / چک</option>
                  </select>
                </div>

                <div className="border-t border-slate-100 pt-6">
                  <label className="block text-[10px] font-black text-slate-400 mb-3 mr-2">ویرایش اقلام و تعداد فاکتور عمده:</label>
                  <div className="space-y-3">
                    {editOrderItems.map((item, idx) => (
                      <div key={`admin-panel-edit-order-${(item as any).id || (item as any).productId || idx}-${idx}`} className="flex gap-3 items-center bg-slate-50 p-3 rounded-2xl border border-slate-100">
                        <div className="flex-1 text-[11px] font-black text-slate-700">{item.name}</div>
                        <div className="flex items-center gap-2">
                          <input 
                            type="number" 
                            value={item.quantityCartons} 
                            onChange={e => {
                              const next = [...editOrderItems];
                              next[idx].quantityCartons = Number(e.target.value);
                              setEditOrderItems(next);
                              // Recalculate total if needed, or let admin edit manually
                            }}
                            className="w-16 bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-mono text-center"
                          />
                          <span className="text-[10px] text-slate-400 font-bold">کارتن</span>
                        </div>
                        <button 
                          onClick={() => setEditOrderItems(prev => prev.filter((_, i) => i !== idx))}
                          className="p-1.5 text-rose-500 hover rounded-lg transition-all"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                    <button 
                      onClick={() => {
                        // Add a dummy item for editing
                        setEditOrderItems(prev => [...prev, { productId: 'manual', name: 'کالای دستی', quantityCartons: 1, pricePerCarton: 0, totalItems: 0 }]);
                      }}
                      className="w-full py-2 border-2 border-dashed border-slate-200 rounded-xl text-[10px] font-black text-slate-400 hover hover transition-all"
                    >
                      + افزودن ردیف کالای جدید به فاکتور
                    </button>
                  </div>
                </div>
              </div>
              <div className="p-6 bg-slate-50 border-t border-gray-100 flex gap-3">
                <button
                  onClick={async () => {
                    setLoading(true);
                    try {
                      const orderRef = doc(db, "orders", editingOrder.id);
                      await updateDoc(orderRef, {
                        buyerName: editBuyerName,
                        buyerPhone: editBuyerPhone,
                        buyerCompany: editBuyerCompany,
                        buyerAddress: editBuyerAddress,
                        totalAmount: Number(editTotalAmount),
                        paymentStatus: editPaymentStatus,
                        items: editOrderItems
                      });
                      setSuccessMsg("تغییرات فاکتور با موفقیت ذخیره شد.");
                      setEditingOrder(null);
                      fetchOrders();
                      setTimeout(() => setSuccessMsg(null), 4000);
                    } catch (e) {
                      setErrorMsg("خطا در ذخیره فاکتور.");
                    } finally {
                      setLoading(false);
                    }
                  }}
                  disabled={loading}
                  className="flex-1 bg-emerald-600 hover text-white font-black py-4 rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2"
                >
                  {loading ? <RefreshCw size={18} className="animate-spin" /> : <Save size={18} />}
                  ذخیره و اصلاح نهایی فاکتور
                </button>
                <button
                  onClick={() => setEditingOrder(null)}
                  className="px-8 bg-white border border-gray-200 text-slate-600 font-black py-4 rounded-2xl hover transition-all"
                >
                  انصراف
                </button>
              </div>
            </motion.div>
          </div>
        )}
        {/* IMPORT SUCCESS SUMMARY MODAL */}
        {showImportSuccessModal && importSummary && (
          <div className="fixed inset-0 bg-slate-50/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-slate-200 shadow-2xl space-y-6 text-center"
            >
              <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle size={44} />
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-black text-slate-900">
                  عملیات درون‌ریزی و همگام‌سازی با موفقیت انجام شد!
                </h3>
                <p className="text-xs text-slate-500 font-bold">
                  اطلاعات فایل CSV ووکامرس در دیتابیس انبار مرکزی بروزرسانی گردید.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-right">
                <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 space-y-1">
                  <span className="text-[10px] text-emerald-600 font-black">کالاهای جدید ثبت‌شده</span>
                  <div className="text-xl font-black text-emerald-700 font-mono">
                    {toPersianNum(importSummary.imported)} کالا
                  </div>
                </div>

                <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 space-y-1">
                  <span className="text-[10px] text-amber-600 font-black">کالاهای بروزرسانی/اورواید شده</span>
                  <div className="text-xl font-black text-amber-700 font-mono">
                    {toPersianNum(importSummary.updated)} کالا
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 space-y-1">
                  <span className="text-[10px] text-blue-600 font-black">دسته‌بندی‌های جدید</span>
                  <div className="text-xl font-black text-blue-700 font-mono">
                    {toPersianNum(importSummary.newCats)} دسته
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1">
                  <span className="text-[10px] text-slate-500 font-black">مجموع پردازش‌شده</span>
                  <div className="text-xl font-black text-slate-800 font-mono">
                    {toPersianNum(importSummary.total)} کالا
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowImportSuccessModal(false);
                  setActiveSubTab('products');
                }}
                className="w-full py-4 bg-emerald-600 hover text-white font-black text-sm rounded-2xl transition-all shadow-xl shadow-emerald-600/20 cursor-pointer"
              >
                مشاهده لیست کالاهای انبار
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>



      {activeSubTab === 'safe_buy' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 bg-white p-6 sm:p-10 rounded-[3rem] border border-slate-100 shadow-2xl text-right" dir="rtl">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-slate-50">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl shadow-inner">
                <ShieldCheck size={24} />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 font-sans">مدیریت درخواست‌های خرید امن (Safe Buy / زیر قیمت کف)</h3>
                <p className="text-[11px] text-slate-400 font-bold mt-1">بررسی، تایید یا رد درخواست‌های خرید ثبت‌شده توسط کاربران از طریق سیستم واسطه‌گری امن.</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex bg-slate-100 p-1 rounded-xl">
                {[
                  { id: 'pending', label: 'در انتظار', count: safeBuyRequests.filter(r => (r.status || 'pending') === 'pending').length },
                  { id: 'approved', label: 'تایید شده', count: safeBuyRequests.filter(r => r.status === 'approved').length },
                  { id: 'rejected', label: 'رد شده', count: safeBuyRequests.filter(r => r.status === 'rejected').length },
                  { id: 'all', label: 'همه', count: safeBuyRequests.length },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setSafeBuyFilter(f.id as any)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                      safeBuyFilter === f.id 
                        ? "bg-white text-emerald-700 shadow-sm" 
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    {f.label} ({f.count})
                  </button>
                ))}
              </div>
              <button
                onClick={() => {
                  const saved = localStorage.getItem("dastavval_safe_buy_requests");
                  if (saved) {
                    try { setSafeBuyRequests(JSON.parse(saved)); } catch(e){}
                    setSuccessMsg("درخواست‌ها مجدداً بارگیری شد.");
                    setTimeout(() => setSuccessMsg(null), 2000);
                  }
                }}
                className="p-2 bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200 rounded-xl cursor-pointer transition-all"
                title="بروزرسانی"
              >
                <RefreshCw size={14} />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right border-separate border-spacing-y-2">
              <thead>
                <tr className="text-[10px] font-black text-slate-400">
                  <th className="px-4 py-2 font-black text-right">شناسه / تاریخ</th>
                  <th className="px-4 py-2 font-black text-right">عنوان کالا / قیمت پیشنهادی</th>
                  <th className="px-4 py-2 font-black text-right">اطلاعات خریدار</th>
                  <th className="px-4 py-2 font-black text-right">توضیحات خریدار</th>
                  <th className="px-4 py-2 font-black text-right">وضعیت</th>
                  <th className="px-4 py-2 font-black text-left">عملیات نظارت</th>
                </tr>
              </thead>
              <tbody className="text-xs">
                {(() => {
                  const filtered = safeBuyRequests.filter(r => safeBuyFilter === 'all' || (r.status || 'pending') === safeBuyFilter);
                  if (filtered.length === 0) {
                    return <tr><td colSpan={6} className="text-center py-12 text-slate-400 font-bold">هیچ درخواست خرید امنی در این وضعیت یافت نشد.</td></tr>;
                  }
                  return filtered.map((req: any) => (
                    <tr key={req.id} className="bg-slate-50/50 hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 rounded-r-2xl border-y border-r border-slate-100">
                        <div className="font-mono font-black text-slate-800">{req.id}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{req.date}</div>
                      </td>
                      <td className="px-4 py-3 border-y border-slate-100">
                        <div className="font-black text-slate-900 text-sm">{req.productTitle}</div>
                        <div className="text-[11px] text-emerald-700 font-black mt-1">قیمت کف: {req.wholesalePrice}</div>
                      </td>
                      <td className="px-4 py-3 border-y border-slate-100">
                        <div className="font-bold text-slate-800">📞 {req.buyerPhone}</div>
                      </td>
                      <td className="px-4 py-3 border-y border-slate-100">
                        <div className="text-[11px] text-slate-600 font-medium max-w-xs truncate">{req.buyerMessage || 'بدون توضیحات تکمیلی'}</div>
                      </td>
                      <td className="px-4 py-3 border-y border-slate-100">
                        <span className={`inline-block px-3 py-1 rounded-xl text-[10px] font-black ${
                          req.status === 'approved' ? "bg-emerald-50 text-emerald-700 border border-emerald-200/50" :
                          req.status === 'rejected' ? "bg-rose-50 text-rose-700 border border-rose-200/50" :
                          "bg-amber-50 text-amber-700 border border-amber-200/50"
                        }`}>
                          {req.status === 'approved' ? 'تایید شده' : req.status === 'rejected' ? 'رد شده' : 'در انتظار بررسی'}
                        </span>
                      </td>
                      <td className="px-4 py-3 rounded-l-2xl border-y border-l border-slate-100 text-left">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedSafeBuyDetail(req)}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-[10px] rounded-xl transition-all cursor-pointer flex items-center gap-1"
                          >
                            <Eye size={12} /> جزئیات کالا
                          </button>
                          <button
                            onClick={() => handleUpdateSafeBuyStatus(req.id, req.firebaseId, 'approved')}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1"
                          >
                            <Check size={12} /> تایید
                          </button>
                          <button
                            onClick={() => handleUpdateSafeBuyStatus(req.id, req.firebaseId, 'rejected')}
                            className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-black text-[10px] rounded-xl transition-all cursor-pointer flex items-center gap-1"
                          >
                            <X size={12} /> رد
                          </button>
                        </div>
                      </td>
                    </tr>
                  ));
                })()}
              </tbody>
            </table>
          </div>

          {/* SAFE BUY REQUEST DETAILS MODAL */}
          <AnimatePresence>
            {selectedSafeBuyDetail && (() => {
              const details = getProductDetailsForSafeBuy(selectedSafeBuyDetail);
              return (
                <div className="fixed inset-0 bg-white/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" dir="rtl">
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    className="bg-white rounded-[2.5rem] w-full max-w-lg p-6 sm:p-8 shadow-2xl border border-slate-100 text-right space-y-6 relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
                    
                    {/* Header */}
                    <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                          <ShieldCheck size={20} />
                        </div>
                        <div>
                          <h4 className="text-base font-black text-slate-800">جزئیات کامل درخواست خرید امن</h4>
                          <p className="text-[10px] text-slate-400 font-bold mt-0.5">شناسه معامله: {selectedSafeBuyDetail.id}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => setSelectedSafeBuyDetail(null)}
                        className="p-1.5 bg-slate-50 text-slate-400 hover:bg-slate-100 rounded-lg transition-all cursor-pointer"
                      >
                        <X size={18} />
                      </button>
                    </div>

                    {/* Details List */}
                    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                      
                      {/* CATEGORY 1: Product Specifications */}
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
                        <div className="flex items-center gap-2 text-emerald-700 font-black text-[11px] uppercase tracking-wider">
                          <Package size={14} />
                          <span>مشخصات عمومی و برند کالا</span>
                        </div>
                        
                        <div className="flex gap-4 items-start bg-white p-3 rounded-xl border border-slate-100/80">
                          {details.imageUrl && (
                            <img 
                              src={details.imageUrl} 
                              alt={details.title} 
                              className="w-16 h-16 object-cover rounded-xl border border-slate-200 shrink-0 mt-0.5" 
                              referrerPolicy="no-referrer"
                            />
                          )}
                          <div className="space-y-1">
                            <h5 className="font-black text-slate-800 text-xs leading-relaxed">{details.title}</h5>
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 mt-1">
                              <Building2 size={12} className="text-slate-400" />
                              <span>برند: {details.brand}</span>
                            </div>
                          </div>
                        </div>

                        <div className="text-xs space-y-2 mt-2 pt-2 border-t border-slate-200/40">
                          <div className="flex flex-col gap-1">
                            <span className="text-slate-400 font-bold">توضیحات و مشخصات فنی کالا:</span>
                            <span className="text-slate-600 leading-relaxed font-bold bg-white p-2.5 rounded-xl border border-slate-100/80 mt-1">
                              {details.description}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* CATEGORY 2: Financials & Conditions */}
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
                        <div className="flex items-center gap-2 text-emerald-700 font-black text-[11px] uppercase tracking-wider">
                          <DollarSign size={14} />
                          <span>شرایط قیمت‌گذاری و تعداد درخواستی</span>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-white p-3 rounded-xl border border-slate-100 space-y-1">
                            <span className="text-[10px] font-bold text-slate-400 block">قیمت پیشنهادی کاربر:</span>
                            <span className="text-xs font-black text-emerald-600 block">{details.wholesalePrice}</span>
                          </div>
                          
                          <div className="bg-white p-3 rounded-xl border border-slate-100 space-y-1">
                            <span className="text-[10px] font-bold text-slate-400 block">تعداد درخواستی خریدار:</span>
                            <span className="text-xs font-black text-slate-800 block">{details.quantity}</span>
                          </div>

                          <div className="bg-white p-3 rounded-xl border border-slate-100 space-y-1">
                            <span className="text-[10px] font-bold text-slate-400 block">قیمت بازار آزاد (مصرف‌کننده):</span>
                            <span className="text-xs font-bold text-slate-500 line-through block">{details.marketPrice || 'ثبت نشده'}</span>
                          </div>

                          <div className="bg-white p-3 rounded-xl border border-slate-100 space-y-1">
                            <span className="text-[10px] font-bold text-slate-400 block">سود ناخالص خریدار:</span>
                            <span className="text-xs font-black text-amber-600 block">{details.buyerProfit}</span>
                          </div>
                        </div>
                      </div>

                      {/* CATEGORY 3: Submission & Buyer Details */}
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
                        <div className="flex items-center gap-2 text-emerald-700 font-black text-[11px] uppercase tracking-wider">
                          <ClipboardList size={14} />
                          <span>اطلاعات ثبت درخواست و متقاضی</span>
                        </div>

                        <div className="space-y-2 text-xs">
                          <div className="flex justify-between items-center bg-white px-3 py-2 rounded-xl border border-slate-100">
                            <span className="text-slate-400 font-bold flex items-center gap-1.5">
                              <Calendar size={13} className="text-slate-400" />
                              تاریخ ثبت تقاضا:
                            </span>
                            <span className="text-slate-800 font-black">{selectedSafeBuyDetail.date || '۱۴۰۵/۰۵/۲۴'}</span>
                          </div>

                          <div className="flex justify-between items-center bg-white px-3 py-2 rounded-xl border border-slate-100">
                            <span className="text-slate-400 font-bold flex items-center gap-1.5">
                              <Phone size={13} className="text-slate-400" />
                              شماره تماس خریدار:
                            </span>
                            <span className="text-slate-800 font-black select-all" dir="ltr">{selectedSafeBuyDetail.buyerPhone}</span>
                          </div>

                          <div className="flex justify-between items-center bg-white px-3 py-2 rounded-xl border border-slate-100">
                            <span className="text-slate-400 font-bold flex items-center gap-1.5">
                              <Activity size={13} className="text-slate-400" />
                              وضعیت در سیستم:
                            </span>
                            <span className={`inline-block px-2.5 py-0.5 rounded-lg text-[10px] font-black ${
                              selectedSafeBuyDetail.status === 'approved' ? 'bg-emerald-50 text-emerald-700' :
                              selectedSafeBuyDetail.status === 'rejected' ? 'bg-rose-50 text-rose-700' :
                              'bg-amber-50 text-amber-700'
                            }`}>
                              {selectedSafeBuyDetail.status === 'approved' ? 'تایید شده' :
                               selectedSafeBuyDetail.status === 'rejected' ? 'رد شده' : 'در انتظار بررسی'}
                            </span>
                          </div>

                          <div className="flex flex-col gap-1 pt-2 border-t border-slate-200/40">
                            <span className="text-slate-400 font-bold">پیام و توضیحات تکمیلی خریدار:</span>
                            <p className="text-slate-700 leading-relaxed font-medium bg-white p-3 rounded-xl border border-slate-100 mt-1">
                              {selectedSafeBuyDetail.buyerMessage || 'هیچ توضیحات یا پیامی توسط خریدار ثبت نشده است.'}
                            </p>
                          </div>
                        </div>
                      </div>

                    </div>

                    {/* Action Controls */}
                    <div className="flex gap-3 pt-2">
                      <button
                        onClick={() => {
                          handleUpdateSafeBuyStatus(selectedSafeBuyDetail.id, selectedSafeBuyDetail.firebaseId, 'approved');
                          setSelectedSafeBuyDetail(null);
                        }}
                        className="flex-1 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <Check size={14} /> تایید معامله امن
                      </button>
                      <button
                        onClick={() => {
                          handleUpdateSafeBuyStatus(selectedSafeBuyDetail.id, selectedSafeBuyDetail.firebaseId, 'rejected');
                          setSelectedSafeBuyDetail(null);
                        }}
                        className="flex-1 py-3.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-black text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <X size={14} /> رد درخواست
                      </button>
                    </div>
                  </motion.div>
                </div>
              );
            })()}
          </AnimatePresence>
        </div>
      )}

      {activeSubTab === 'channel_posts' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 bg-white p-6 sm:p-10 rounded-[3rem] border border-slate-100 shadow-2xl text-right animate-fade-in" dir="rtl">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-slate-100">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl shadow-inner">
                <Megaphone size={24} />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 font-sans">مدیریت کانال اطلاع‌رسانی دست اول</h3>
                <p className="text-[11px] text-slate-400 font-bold mt-1">ایجاد، ویرایش و حذف اطلاعیه‌ها، اخبار فوری و فراخوان‌های ویژه کاربران سامانه.</p>
              </div>
            </div>
          </div>

          {/* Form and Channel List Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Form Column */}
            <div className="lg:col-span-1 space-y-6">
              {/* Manual Form */}
              <div className="bg-slate-50/50 p-6 rounded-3xl border border-slate-150 space-y-4">
                <h4 className="font-black text-xs text-slate-800 border-b border-slate-200 pb-2">
                  {editingChannelPostId ? "📝 ویرایش اطلاعیه" : "✨ انتشار پیام جدید در کانال"}
                </h4>
                
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-slate-500 block">عنوان پیام:</label>
                  <input
                    type="text"
                    value={channelPostTitle}
                    onChange={(e) => setChannelPostTitle(e.target.value)}
                    placeholder="مثلاً: شروع فروش حراج زعفران قائنات"
                    className="w-full bg-white border border-slate-250 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-slate-500 block">دسته‌بندی:</label>
                  <select
                    value={channelPostCategory}
                    onChange={(e) => setChannelPostCategory(e.target.value)}
                    className="w-full bg-white border border-slate-250 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  >
                    <option value="info">📣 عمومی / اطلاع‌رسانی</option>
                    <option value="urgent">🔴 فوری / حراج ویژه</option>
                    <option value="festival">🎉 جشنواره تخفیف کارخانجات</option>
                    <option value="system">⚙️ اطلاعیه فنی و سیستمی</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-slate-500 block">متن کامل پیام:</label>
                  <textarea
                    rows={6}
                    value={channelPostContent}
                    onChange={(e) => setChannelPostContent(e.target.value)}
                    placeholder="متن پیام خود را با جزئیات کامل، قیمت‌ها و نحوه سفارش وارد کنید..."
                    className="w-full bg-white border border-slate-250 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-800 outline-none leading-relaxed focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  />
                </div>

                <div className="space-y-1.5 border-t border-slate-200/50 pt-3 mt-2">
                  <span className="text-[10px] font-black text-indigo-600 block mb-1">🔗 دکمه اکشن / پیوند دکمه (اختیاری)</span>
                  
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 block">متن دکمه:</label>
                    <input
                      type="text"
                      value={channelPostActionLabel}
                      onChange={(e) => setChannelPostActionLabel(e.target.value)}
                      placeholder="مثلاً: ورود به صفحه خرید ویژه"
                      className="w-full bg-white border border-slate-250 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-800 outline-none focus:border-indigo-500 transition-all"
                    />
                  </div>

                  <div className="space-y-1 pt-1">
                    <label className="text-[10px] font-bold text-slate-400 block">لینک یا آدرس اینترنتی (URL):</label>
                    <input
                      type="text"
                      value={channelPostActionUrl}
                      onChange={(e) => setChannelPostActionUrl(e.target.value)}
                      placeholder="مثلاً: https://dastavval.com/special"
                      className="w-full bg-white border border-slate-250 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-700 outline-none focus:border-indigo-500 transition-all text-left"
                      dir="ltr"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (!channelPostTitle.trim() || !channelPostContent.trim()) {
                        alert("لطفا عنوان و متن پیام را کامل کنید.");
                        return;
                      }

                      const saved = localStorage.getItem("dastavval_announcements");
                      let currentPosts = [];
                      if (saved) {
                        currentPosts = JSON.parse(saved);
                      } else {
                        currentPosts = [
                          {
                            id: "ann-1",
                            title: "📣 راه‌اندازی کانال رسمی اطلاع‌رسانی دست اول",
                            content: "به کانال رسمی دست اول خوش آمدید! از این پس کلیه حراج‌های کف بازار، جشنواره‌های تخفیف خط تولید کارخانجات، شرایط اعطای نمایندگی استانی و اطلاعیه‌های مهم صنف مواد غذایی و بهداشتی را به صورت مستقیم و آنی در این کانال دریافت خواهید کرد.",
                            category: "system",
                            createdAt: "۱۴۰۵/۰۵/۲۸"
                          },
                          {
                            id: "ann-2",
                            title: "🔥 جشنواره تخفیف ۲۲٪ ویژه محصولات شوینده",
                            content: "جشنواره استثنایی فروش مستقیم از درب کارخانه برای انواع مایع دستشویی، ظرفشویی و پودرهای لباسشویی کلید خورد. تمامی بنکداران با سطح نقره‌ای به بالا می‌توانند سفارشات خود را با تخفیف مضاعف در سبد خرید ثبت نمایند.",
                            category: "festival",
                            createdAt: "۱۴۰۵/۰۵/۲۷"
                          },
                          {
                            id: "ann-3",
                            title: "⚡ اعلام شرایط دریافت نمایندگی شهر و شهرستان",
                            content: "با توجه به درخواست‌های مکرر، جدول سطوح نمایندگی فعال شد. هر فرد با دستیابی به سقف فروش مشخص (۳۰۰ میلیون، ۱ میلیارد، ۲ میلیارد و ۵ میلیارد تومان) می‌تواند لوح تقدیر گرافیکی آنلاین دریافت کرده و مدارک خود را ثبت کند.",
                            category: "urgent",
                            createdAt: "۱۴۰۵/۰۵/۲۶"
                          }
                        ];
                      }

                      if (editingChannelPostId) {
                        // Edit mode
                        currentPosts = currentPosts.map((p: any) => p.id === editingChannelPostId ? {
                          ...p,
                          title: channelPostTitle.trim(),
                          content: channelPostContent.trim(),
                          category: channelPostCategory,
                          actionLabel: channelPostActionLabel.trim() || undefined,
                          actionUrl: channelPostActionUrl.trim() || undefined
                        } : p);
                        setEditingChannelPostId(null);
                        setSuccessMsg("اطلاعیه با موفقیت ویرایش شد.");
                      } else {
                        // Add mode
                        const newP = {
                          id: `ann_${Date.now()}`,
                          title: channelPostTitle.trim(),
                          content: channelPostContent.trim(),
                          category: channelPostCategory,
                          actionLabel: channelPostActionLabel.trim() || undefined,
                          actionUrl: channelPostActionUrl.trim() || undefined,
                          createdAt: new Date().toLocaleDateString('fa-IR')
                        };
                        currentPosts = [newP, ...currentPosts];
                        setSuccessMsg("پیام جدید با موفقیت در کانال اطلاع‌رسانی منتشر شد.");
                      }

                      localStorage.setItem("dastavval_announcements", JSON.stringify(currentPosts));
                      window.dispatchEvent(new CustomEvent("dastavval_announcements_updated"));
                      
                      // Reset fields
                      setChannelPostTitle("");
                      setChannelPostContent("");
                      setChannelPostCategory("info");
                      setChannelPostActionLabel("");
                      setChannelPostActionUrl("");
                      
                      setTimeout(() => setSuccessMsg(null), 3000);
                    }}
                    className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Save size={14} />
                    <span>{editingChannelPostId ? "ذخیره تغییرات" : "انتشار فوری در کانال"}</span>
                  </button>
                  
                  {editingChannelPostId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingChannelPostId(null);
                        setChannelPostTitle("");
                        setChannelPostContent("");
                        setChannelPostCategory("info");
                        setChannelPostActionLabel("");
                        setChannelPostActionUrl("");
                      }}
                      className="px-4 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 font-black text-xs rounded-xl transition-all cursor-pointer"
                    >
                      انصراف
                    </button>
                  )}
                </div>
              </div>

              {/* Auto-Post Settings Panel */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4 text-right" dir="rtl">
                <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                    <Settings size={16} />
                  </div>
                  <div>
                    <h4 className="font-black text-xs text-slate-800">تنظیمات انتشار خودکار کانال</h4>
                    <p className="text-[10px] text-slate-400 font-bold">فعال/غیرفعال‌سازی ارسال پیام خودکار سیستم</p>
                  </div>
                </div>

                <div className="space-y-3 pt-1">
                  {/* Toggle 1: New Product */}
                  <div className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 border border-slate-100">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[11px] font-black text-slate-700">📦 محصولات جدید</span>
                      <span className="text-[9px] text-slate-400 font-bold">انتشار خودکار با ثبت محصول جدید</span>
                    </div>
                    <button
                      onClick={() => setAutoPostSettings(prev => ({ ...prev, new_product: !prev.new_product }))}
                      className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        autoPostSettings.new_product ? "bg-indigo-600" : "bg-slate-200"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          autoPostSettings.new_product ? "-translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Toggle 2: New Discount */}
                  <div className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 border border-slate-100">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[11px] font-black text-slate-700">🔥 تخفیفات جدید</span>
                      <span className="text-[9px] text-slate-400 font-bold">انتشار خودکار کاهش قیمت‌های گروهی</span>
                    </div>
                    <button
                      onClick={() => setAutoPostSettings(prev => ({ ...prev, new_discount: !prev.new_discount }))}
                      className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        autoPostSettings.new_discount ? "bg-indigo-600" : "bg-slate-200"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          autoPostSettings.new_discount ? "-translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Toggle 3: New Ad */}
                  <div className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 border border-slate-100">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[11px] font-black text-slate-700">📢 آگهی‌های همکار</span>
                      <span className="text-[9px] text-slate-400 font-bold">انتشار خودکار تایید آگهی‌های بیلبورد</span>
                    </div>
                    <button
                      onClick={() => setAutoPostSettings(prev => ({ ...prev, new_ad: !prev.new_ad }))}
                      className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        autoPostSettings.new_ad ? "bg-indigo-600" : "bg-slate-200"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          autoPostSettings.new_ad ? "-translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Toggle 4: New Factory */}
                  <div className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 border border-slate-100">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[11px] font-black text-slate-700">🏭 کارخانجات جدید</span>
                      <span className="text-[9px] text-slate-400 font-bold">انتشار خودکار عضویت کارخانه جدید</span>
                    </div>
                    <button
                      onClick={() => setAutoPostSettings(prev => ({ ...prev, new_factory: !prev.new_factory }))}
                      className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        autoPostSettings.new_factory ? "bg-indigo-600" : "bg-slate-200"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          autoPostSettings.new_factory ? "-translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* List and Statistics */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-[11px] font-black text-slate-400">لیست آخرین پیام‌های منتشر شده در کانال</span>
                <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-mono">
                  {toPersianNum((() => {
                    const saved = localStorage.getItem("dastavval_announcements");
                    if (saved) {
                      try { return JSON.parse(saved).length; } catch(e){}
                    }
                    return 3;
                  })())} پیام فعال
                </span>
              </div>

              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1 custom-scrollbar">
                {(() => {
                  const saved = localStorage.getItem("dastavval_announcements");
                  let posts = [];
                  if (saved) {
                    try { posts = JSON.parse(saved); } catch(e){}
                  } else {
                    posts = [
                      {
                        id: "ann-1",
                        title: "📣 راه‌اندازی کانال رسمی اطلاع‌رسانی دست اول",
                        content: "به کانال رسمی دست اول خوش آمدید! از این پس کلیه حراج‌های کف بازار، جشنواره‌های تخفیف خط تولید کارخانجات، شرایط اعطای نمایندگی استانی و اطلاعیه‌های مهم صنف مواد غذایی و بهداشتی را به صورت مستقیم و آنی در این کانال دریافت خواهید کرد.",
                        category: "system",
                        createdAt: "۱۴۰۵/۰۵/۲۸"
                      },
                      {
                        id: "ann-2",
                        title: "🔥 جشنواره تخفیف ۲۲٪ ویژه محصولات شوینده",
                        content: "جشنواره استثنایی فروش مستقیم از درب کارخانه برای انواع مایع دستشویی، ظرفشویی و پودرهای لباسشویی کلید خورد. تمامی بنکداران با سطح نقره‌ای به بالا می‌توانند سفارشات خود را با تخفیف مضاعف در سبد خرید ثبت نمایند.",
                        category: "festival",
                        createdAt: "۱۴۰۵/۰۵/۲۷"
                      },
                      {
                        id: "ann-3",
                        title: "⚡ اعلام شرایط دریافت نمایندگی شهر و شهرستان",
                        content: "با توجه به درخواست‌های مکرر، جدول سطوح نمایندگی فعال شد. هر فرد با دستیابی به سقف فروش مشخص (۳۰۰ میلیون، ۱ میلیارد، ۲ میلیارد و ۵ میلیارد تومان) می‌تواند لوح تقدیر گرافیکی آنلاین دریافت کرده و مدارک خود را ثبت کند.",
                        category: "urgent",
                        createdAt: "۱۴۰۵/۰۵/۲۶"
                      }
                    ];
                  }

                  // Sort: pinned first, then normal descending
                  const sortedPosts = [...posts].sort((a: any, b: any) => {
                    const aPinned = !!a.pinned;
                    const bPinned = !!b.pinned;
                    if (aPinned && !bPinned) return -1;
                    if (!aPinned && bPinned) return 1;
                    return 0; // maintain relative order
                  });

                  if (sortedPosts.length === 0) {
                    return (
                      <div className="text-center py-16 text-slate-400 font-bold text-xs space-y-2 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                        <Megaphone size={36} className="mx-auto text-slate-300" />
                        <p>هیچ پیامی در کانال وجود ندارد. همین حالا اولین پیام خود را منتشر کنید.</p>
                      </div>
                    );
                  }

                  return sortedPosts.map((post: any) => (
                    <div 
                      key={post.id} 
                      className={`bg-white border transition-all p-5 rounded-2xl shadow-2xs space-y-3 relative overflow-hidden group text-right ${
                        post.pinned ? 'border-amber-300/80 bg-amber-50/5 ring-1 ring-amber-200' : 'border-slate-150 hover:border-slate-250'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-2">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                            post.category === 'urgent' ? 'bg-red-100 text-red-750 border border-red-200/50' :
                            post.category === 'festival' ? 'bg-amber-100 text-amber-800 border border-amber-200/50' :
                            post.category === 'system' ? 'bg-indigo-100 text-indigo-700 border border-indigo-200/50' :
                            'bg-slate-100 text-slate-750'
                          }`}>
                            {post.category === 'urgent' ? '🔴 فوری' :
                             post.category === 'festival' ? '🎉 جشنواره' :
                             post.category === 'system' ? '⚙️ سیستمی' :
                             '📣 عمومی'}
                          </span>
                          
                          {post.pinned && (
                            <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-850 border border-amber-250 flex items-center gap-1 shrink-0">
                              <Pin size={9} className="fill-amber-600 text-amber-600" />
                              <span>سنجاق شده</span>
                            </span>
                          )}

                          <h5 className="font-black text-xs text-slate-900 leading-tight mr-1">{post.title}</h5>
                        </div>
                        <span className="text-[9px] font-bold text-slate-400 font-mono shrink-0">{toPersianNum(post.createdAt)}</span>
                      </div>

                      <p className="text-[11px] text-slate-600 font-medium leading-relaxed whitespace-pre-line text-right">
                        {post.content}
                      </p>

                      {post.actionUrl && (
                        <div className="pt-1 text-left">
                          <span className="inline-block px-3 py-1 bg-slate-100 text-slate-600 text-[9px] font-black rounded-lg">
                            🔗 دکمه اکشن: {post.actionLabel || "مشاهده پیوند"}
                          </span>
                        </div>
                      )}

                      {/* Controls on Hover */}
                      <div className="flex justify-end gap-1.5 pt-2 border-t border-slate-50">
                        <button
                          onClick={() => {
                            const updated = posts.map((p: any) => {
                              if (p.id === post.id) {
                                return { ...p, pinned: !p.pinned };
                              }
                              // Set other posts to unpinned if we're pinning this one
                              return p.pinned && !post.pinned ? { ...p, pinned: false } : p;
                            });
                            localStorage.setItem("dastavval_announcements", JSON.stringify(updated));
                            window.dispatchEvent(new CustomEvent("dastavval_announcements_updated"));
                            setSuccessMsg(post.pinned ? "پیام از حالت پین خارج شد." : "پیام با موفقیت به بالای کانال سنجاق شد.");
                            setTimeout(() => setSuccessMsg(null), 3000);
                          }}
                          className={`px-2 py-1 bg-slate-50 hover:bg-slate-100 border text-[9px] font-black rounded-lg transition-all cursor-pointer flex items-center gap-1 shrink-0 ${
                            post.pinned ? 'border-amber-200 text-amber-800' : 'border-slate-200 text-slate-600'
                          }`}
                        >
                          <Pin size={11} className={post.pinned ? "fill-amber-600 text-amber-600" : ""} />
                          <span>{post.pinned ? "برداشتن پین" : "سنجاق پیام"}</span>
                        </button>

                        <button
                          onClick={() => {
                            setEditingChannelPostId(post.id);
                            setChannelPostTitle(post.title);
                            setChannelPostContent(post.content);
                            setChannelPostCategory(post.category);
                            setChannelPostActionLabel(post.actionLabel || "");
                            setChannelPostActionUrl(post.actionUrl || "");
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          }}
                          className="px-2 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg text-[9px] font-black transition-all cursor-pointer flex items-center gap-1 shrink-0"
                        >
                          <Edit2 size={11} />
                          <span>ویرایش</span>
                        </button>

                        <button
                          onClick={() => {
                            if (window.confirm("آیا از حذف این اطلاعیه از کانال رسمی مطمئن هستید؟")) {
                              const updated = posts.filter((p: any) => p.id !== post.id);
                              localStorage.setItem("dastavval_announcements", JSON.stringify(updated));
                              window.dispatchEvent(new CustomEvent("dastavval_announcements_updated"));
                              setSuccessMsg("اطلاعیه با موفقیت حذف گردید.");
                              setTimeout(() => setSuccessMsg(null), 3000);
                            }
                          }}
                          className="px-2 py-1 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg text-[9px] font-black transition-all cursor-pointer flex items-center gap-1 shrink-0"
                        >
                          <Trash2 size={11} />
                          <span>حذف</span>
                        </button>
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </div>
          </div>
        </div>
      )}



      </main>
    </div>
    </>
  );
}
