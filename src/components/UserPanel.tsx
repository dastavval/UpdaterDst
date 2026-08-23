import React, { useState, useEffect, useMemo } from "react";
import { 
  User, Building, Phone, MapPin, ShoppingBag, CreditCard, LogOut, 
  Trash2, Edit, CheckCircle2, Sparkles, Package, Clock, FileText, 
  ArrowLeft, ChevronRight, ShieldCheck, Tag, Store, Upload, AlertTriangle, 
  X, Printer, Bell, TrendingDown, Truck, Activity, Loader2, Plus, 
  RefreshCw, Award, DollarSign, Percent, Share2, Copy, Check, Briefcase, 
  Users, Target, TrendingUp, Download, Eye, Gift, Factory, Megaphone, 
  ShieldAlert, Layers, Box, CheckCircle, ExternalLink, Calendar
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { collection, query, where, getDocs, doc, updateDoc, deleteDoc, setDoc, serverTimestamp } from "../lib/data-layer";
import { db } from "../lib/data-layer";
import { Product, Order } from "../types";
import WholesaleInvoiceView from "./WholesaleInvoiceView";
import RepresentativeCertificateView from "./RepresentativeCertificateView";
import ConfirmModal from "./ConfirmModal";
import { generateProductCode } from "../lib/id-utils";
import FactoryManagementPortal from "./FactoryManagementPortal";
import RepresentativeManagementPortal from "./RepresentativeManagementPortal";
import { getRepCommissions } from "../lib/leads-store";

interface UserPanelProps {
  user: any;
  onLogout: () => void;
  b2bConfig: any;
  products: Product[];
  onAddToCart: (product: Product, quantityCartons: number) => void;
  setActiveTab: (tab: string) => void;
  onUpdateUser?: (updatedUser: any) => void;
  onUpdateB2bConfig?: (updatedConfig: any) => Promise<void>;
  onAddProduct?: (product: Omit<Product, 'id'>) => Promise<void>;
  onUpdateProduct?: (id: string, updatedFields: Partial<Product>) => Promise<void>;
  onDeleteProduct?: (id: string) => Promise<void>;
  currentSellerId?: string;
  setCurrentSeller?: (id: string, name: string) => void;
  onRefreshProducts?: () => void;
}

export default function UserPanel({
  user,
  onLogout,
  b2bConfig,
  products,
  onAddToCart,
  setActiveTab,
  onUpdateUser,
  onUpdateB2bConfig,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  currentSellerId,
  setCurrentSeller,
  onRefreshProducts
}: UserPanelProps) {
  const userRole = user?.role || 'customer';

  // Role-specific Active Tab
  const [factoryTab, setFactoryTab] = useState<'products' | 'add_product' | 'orders' | 'profile'>('products');
  const [marketerTab, setMarketerTab] = useState<'desk' | 'payout' | 'certificate' | 'referred_orders' | 'profile'>('desk');
  const [customerTab, setCustomerTab] = useState<'orders' | 'quick_order' | 'credit' | 'profile'>('orders');

  // Selected Order for Invoice modal
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<any | null>(null);
  const [showCertificateModal, setShowCertificateModal] = useState(false);

  // Orders State
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Price Alerts State
  const [priceAlerts, setPriceAlerts] = useState<any[]>([]);

  // Profile Form States
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [company, setCompany] = useState(user?.company || "");
  const [city, setCity] = useState(user?.city || "");
  const [address, setAddress] = useState(user?.address || "");
  const [iban, setIban] = useState(user?.iban || "");
  const [newPassword, setNewPassword] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Marketer Referral State
  const [copiedReferral, setCopiedReferral] = useState(false);
  const [settlementAmount, setSettlementAmount] = useState("");
  const [settlementSuccess, setSettlementSuccess] = useState<string | null>(null);

  // Etebarito Credit Report State
  const [etebaritoState, setEtebaritoState] = useState<any>(() => {
    try {
      return JSON.parse(localStorage.getItem("dastavval_user_etebarito") || "null");
    } catch {
      return null;
    }
  });
  const [etebaritoGradeInput, setEtebaritoGradeInput] = useState("A1");
  const [etebaritoScoreInput, setEtebaritoScoreInput] = useState("750");
  const [etebaritoMsg, setEtebaritoMsg] = useState<string | null>(null);
  const [payoutsHistory, setPayoutsHistory] = useState<any[]>(() => {
    try {
      const userKey = user?.id || user?.phone ? `dastavval_marketer_payouts_${user?.id || user?.phone}` : "dastavval_marketer_payouts";
      return JSON.parse(localStorage.getItem(userKey) || "[]");
    } catch {
      return [];
    }
  });

  // Factory Product Submission Form States
  const [prodTitle, setProdTitle] = useState("");
  const [prodBrand, setProdBrand] = useState(user?.company || "");
  const [prodCategory, setProdCategory] = useState("تنقلات و چیپس");
  const [prodBulkPrice, setProdBulkPrice] = useState<string>("");
  const [prodConsumerPrice, setProdConsumerPrice] = useState<string>("");
  const [prodMinOrder, setProdMinOrder] = useState<string>("5");
  const [prodUnitCount, setProdUnitCount] = useState<string>("24");
  const [prodLeadTime, setProdLeadTime] = useState<string>("2");
  const [prodImage, setProdImage] = useState("");
  const [prodDesc, setProdDesc] = useState("");
  const [isAddingProd, setIsAddingProd] = useState(false);
  const [prodSuccess, setProdSuccess] = useState<string | null>(null);
  const [prodError, setProdError] = useState<string | null>(null);

  // Edit Product Modal
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Helper: Convert to Persian Digits
  const toPersianNum = (num: number | string | undefined | null) => {
    if (num === undefined || num === null) return "";
    const s = String(num);
    const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
    return s.replace(/\d/g, (d) => persianDigits[parseInt(d, 10)]);
  };

  // Filter fake data (test orders, past activity history) and set default 'active' status for new registrations
  const filterFakeDataAndSetStatus = (ordersList: Order[]) => {
    // 1. If it is a new registration / user is new, default status to 'active'
    const userCreatedAt = user?.createdAt ? new Date(user.createdAt).getTime() : Date.now();
    const isNewUser = !user?.status || user?.status === 'pending' || (Date.now() - userCreatedAt < 2 * 3600 * 1000);

    if (user && (!user.status || user.status === 'pending')) {
      const updatedUser = {
        ...user,
        status: 'active'
      };
      
      localStorage.setItem("dastavval_user", JSON.stringify(updatedUser));
      
      // Update in local users registry too
      try {
        const localUsers = JSON.parse(localStorage.getItem("dastavval_local_users") || "{}");
        const trimmedEmail = (user.email || "").trim().toLowerCase();
        const phone = (user.phone || "").trim();
        if (trimmedEmail && localUsers[trimmedEmail]) {
          localUsers[trimmedEmail] = { ...localUsers[trimmedEmail], status: 'active' };
        }
        if (phone && localUsers[phone]) {
          localUsers[phone] = { ...localUsers[phone], status: 'active' };
        }
        localStorage.setItem("dastavval_local_users", JSON.stringify(localUsers));
      } catch (e) {
        console.warn("Could not sync default active status in local registry:", e);
      }

      if (onUpdateUser) {
        onUpdateUser(updatedUser);
      }
    }

    // 2. Clear pre-seeded activity logs for new users in localStorage (to prevent leakage from old sessions)
    if (isNewUser) {
      const keysToClear = [
        "dastavval_marketer_payouts",
        "dastavval_representative_guarantees"
      ];
      keysToClear.forEach(key => {
        try {
          if (localStorage.getItem(key)) {
            localStorage.removeItem(key);
          }
        } catch (e) {}
      });
    }

    // 3. Filter out orders containing test keywords or belonging to generic simulated buyers
    return ordersList.filter(order => {
      const buyerName = (order.buyerName || order.buyerInfo?.name || "").toLowerCase();
      const isTestKeyword = buyerName.includes("تست") || 
                            buyerName.includes("test") || 
                            buyerName.includes("نمونه") || 
                            buyerName.includes("fake") ||
                            (order.id && order.id.startsWith("test-"));

      // For new users, exclude test/mock orders entirely so they start with a pristine workspace
      if (isNewUser && isTestKeyword) {
        return false;
      }
      return true;
    });
  };

  // Fetch real orders from database / storage
  const fetchOrders = async () => {
    setLoadingOrders(true);
    try {
      const q = query(collection(db, "orders"));
      const snap = await getDocs(q);
      const ordersData = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Order[];
      const filtered = filterFakeDataAndSetStatus(ordersData);
      setAllOrders(filtered);
    } catch (e) {
      console.warn("Could not fetch orders:", e);
      try {
        const local = JSON.parse(localStorage.getItem("dastavval_orders_cache") || "[]");
        const filtered = filterFakeDataAndSetStatus(local);
        setAllOrders(filtered);
      } catch {
        setAllOrders([]);
      }
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const handleSync = () => {
      fetchOrders();
    };
    window.addEventListener("dastavval-manual-sync", handleSync);
    return () => {
      window.removeEventListener("dastavval-manual-sync", handleSync);
    };
  }, []);

  // Filter Factory Orders (Strictly orders containing this factory's products)
  const factoryOrders = useMemo(() => {
    if (!user || userRole !== 'factory') return [];
    const compName = (user.company || user.name || "").toLowerCase().trim();
    return allOrders.filter(order => {
      if (!order.items || !Array.isArray(order.items)) return false;
      return order.items.some((item: any) => {
        const itemFactory = (item.factoryName || item.factory_name || item.brand || item.sellerName || "").toLowerCase().trim();
        const sellerIdMatch = item.sellerId && (item.sellerId === user.id || item.sellerId === user.factoryCode);
        return sellerIdMatch || (compName && (itemFactory.includes(compName) || compName.includes(itemFactory)));
      });
    });
  }, [allOrders, user, userRole]);

  // Filter Customer Orders (Orders placed by this customer)
  const customerOrders = useMemo(() => {
    if (!user) return [];
    const uPhone = (user.phone || "").trim();
    const uEmail = (user.email || "").trim().toLowerCase();
    
    return allOrders.filter(order => {
      // 1. Match by explicit user ID
      if (order.userId && user.id && order.userId === user.id) return true;
      
      const buyerP = (order.buyerPhone || "").trim();
      const buyerE = (order.buyerEmail || "").trim().toLowerCase();
      
      // 2. Match by verified phone number
      if (uPhone && buyerP === uPhone) return true;
      
      // 3. Match by verified email address
      if (uEmail && buyerE === uEmail) return true;
      
      return false;
    });
  }, [allOrders, user]);

  // Filter Factory Products
  const factoryProducts = useMemo(() => {
    if (!user || userRole !== 'factory') return [];
    const compName = (user.company || user.name || "").toLowerCase().trim();
    return products.filter(p => {
      const pFactory = (p.factoryName || p.factory_name || p.brand || p.sellerName || "").toLowerCase().trim();
      const pSellerId = p.sellerId || "";
      return (
        (compName && (pFactory.includes(compName) || compName.includes(pFactory))) ||
        (user.id && pSellerId === user.id) ||
        (user.factoryCode && pSellerId === user.factoryCode)
      );
    });
  }, [products, user, userRole]);

  // Handle Save Profile
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const updatedUser = {
        ...user,
        name: name.trim(),
        phone: phone.trim(),
        company: company.trim(),
        city: city.trim(),
        address: address.trim(),
        iban: iban.trim()
      };

      if (newPassword.trim()) {
        updatedUser.password = newPassword.trim();
      }

      localStorage.setItem("dastavval_user", JSON.stringify(updatedUser));
      
      const localUsers = JSON.parse(localStorage.getItem("dastavval_local_users") || "{}");
      
      // Update by email
      if (user.email && localUsers[user.email]) {
        localUsers[user.email] = {
          ...localUsers[user.email],
          ...updatedUser
        };
      }
      
      // Update by phone/username
      const phoneKey = (user.phone || phone || "").trim();
      if (phoneKey && localUsers[phoneKey]) {
        localUsers[phoneKey] = {
          ...localUsers[phoneKey],
          ...updatedUser
        };
      }
      
      localStorage.setItem("dastavval_local_users", JSON.stringify(localUsers));

      if (onUpdateUser) {
        onUpdateUser(updatedUser);
      }

      setSuccessMsg(newPassword.trim() ? "اطلاعات حساب کاربری و کلمه عبور شما با موفقیت بروزرسانی شد." : "اطلاعات حساب کاربری شما با موفقیت بروزرسانی شد.");
      setNewPassword("");
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err: any) {
      setErrorMsg("خطا در ذخیره مشخصات: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Factory Product Submission
  const handleCreateFactoryProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodTitle.trim() || !prodBulkPrice) {
      setProdError("لطفاً عنوان کالا و قیمت هر کارتن را وارد نمایید.");
      return;
    }
    setIsAddingProd(true);
    setProdError(null);
    setProdSuccess(null);

    try {
      const cleanBulkPrice = Number(prodBulkPrice.replace(/,/g, ''));
      const cleanConsumerPrice = Number(prodConsumerPrice.replace(/,/g, '')) || Math.round(cleanBulkPrice * 1.25);
      const cleanMinOrder = Number(prodMinOrder) || 1;
      const cleanPackCount = Number(prodUnitCount) || 12;

      const newProductData: Omit<Product, 'id'> = {
        productCode: generateProductCode(),
        name: prodTitle.trim(),
        brand: prodBrand.trim() || user?.company || "کارخانه دست‌اول",
        category: prodCategory,
        price: cleanBulkPrice,
        bulk_price: cleanBulkPrice,
        consumer_price: cleanConsumerPrice,
        min_order_cartons: cleanMinOrder,
        carton_pack_count: cleanPackCount,
        stock_quantity_cartons: 100,
        unit: "کارتن",
        sellerId: user?.factoryCode || user?.id || "factory_user",
        sellerName: prodBrand.trim() || user?.company || "کارخانه تولیدی",
        production_lead_time_days: Number(prodLeadTime) || 2,
        image_url: prodImage.trim() || "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80",
        factory_name: prodBrand.trim() || user?.company || "کارخانه تولیدی",
        factoryName: prodBrand.trim() || user?.company || "کارخانه تولیدی",
        description: prodDesc.trim() || `کالای باکیفیت مستقیم از خط تولید ${prodBrand.trim() || user?.company}`,
        rating: 5.0,
        approvalStatus: 'pending', // PENDING APPROVAL AS REQUESTED
        isApproved: false
      };

      if (onAddProduct) {
        await onAddProduct(newProductData);
      } else {
        const existing = JSON.parse(localStorage.getItem("dastavval_products_custom") || "[]");
        existing.push(newProductData);
        localStorage.setItem("dastavval_products_custom", JSON.stringify(existing));
      }

      setProdSuccess("محصول شما با موفقیت ثبت شد و پس از ممیزی فنی و تایید ناظر پلتفرم دست‌اول، در ویترین بنکداران منتشر خواهد شد.");
      setProdTitle("");
      setProdBulkPrice("");
      setProdConsumerPrice("");
      setProdImage("");
      setProdDesc("");
      setTimeout(() => {
        setProdSuccess(null);
        setFactoryTab('products');
      }, 2500);
      onRefreshProducts?.();
    } catch (err: any) {
      setProdError("خطا در ثبت محصول: " + err.message);
    } finally {
      setIsAddingProd(false);
    }
  };

  // Marketer Referral Code and Dynamic Link
  const referralCode = user?.agencyCode || user?.userCode || `AGN-${(user?.phone || '2806').slice(-4)}`;
  const referralUrl = `https://dastavval.ir/?ref=${referralCode}`;

  const handleCopyReferral = () => {
    navigator.clipboard.writeText(referralUrl);
    setCopiedReferral(true);
    setTimeout(() => setCopiedReferral(false), 2000);
  };

  // Filter Real Marketer / Affiliate Referred Orders
  const marketerReferredOrders = useMemo(() => {
    if (!user) return [];
    const rCode = (referralCode || "").trim().toLowerCase();
    const uPhone = (user.phone || "").trim();
    const uId = (user.id || "").trim();
    
    return allOrders.filter(order => {
      const oRef = ((order as any).referralCode || (order as any).refCode || (order as any).marketerCode || (order as any).agentCode || "").trim().toLowerCase();
      const oMarketerId = ((order as any).marketerId || (order as any).agentId || "").trim();
      const oMarketerPhone = ((order as any).marketerPhone || "").trim();
      
      if (rCode && oRef === rCode) return true;
      if (uId && oMarketerId === uId) return true;
      if (uPhone && oMarketerPhone === uPhone) return true;
      return false;
    });
  }, [allOrders, user, referralCode]);

  // Marketer Total Sales Volume
  const marketerReferredVolume = useMemo(() => {
    return marketerReferredOrders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);
  }, [marketerReferredOrders]);

  // Marketer Recent Orders Count (Last 7 Days)
  const marketerRecentOrdersCount = useMemo(() => {
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return marketerReferredOrders.filter(o => {
      const rawDate = (o as any).createdAt || (o as any).date;
      const t = rawDate ? new Date(rawDate).getTime() : 0;
      return t >= oneWeekAgo;
    }).length;
  }, [marketerReferredOrders]);

  // Marketer Earned & Available Commission (2.5% pure commission rate)
  const repCommissions = useMemo(() => getRepCommissions(user?.id || user?.phone), [user]);
  const marketerCommissionRate = 2.5; // 2.5%
  const computedCommissionFromSales = Math.round(marketerReferredVolume * (marketerCommissionRate / 100));
  const totalMarketerCommission = (repCommissions.totalCommission || 0) + computedCommissionFromSales;

  // Marketer Settlement Request
  const handleRequestSettlement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!settlementAmount || Number(settlementAmount) <= 0) return;
    const newPayout = {
      id: `PAY-${Date.now().toString().slice(-4)}`,
      amount: Number(settlementAmount),
      date: new Date().toLocaleDateString('fa-IR'),
      status: 'در حال بررسی مالی',
      iban: iban || user?.iban || "IR120170000000123456789012"
    };
    const updated = [newPayout, ...payoutsHistory];
    setPayoutsHistory(updated);
    const userKey = user?.id || user?.phone ? `dastavval_marketer_payouts_${user?.id || user?.phone}` : "dastavval_marketer_payouts";
    localStorage.setItem(userKey, JSON.stringify(updated));
    setSettlementSuccess("درخواست تسویه پورسانت با موفقیت ثبت شد و ظرف ۲۴ ساعت کاری واریز می‌گردد.");
    setSettlementAmount("");
    setTimeout(() => setSettlementSuccess(null), 4000);
  };

  // Customer Loyalty Badge Info
  const getBadgeInfo = (badge?: string) => {
    switch (badge) {
      case 'vip': return { label: "همکار VIP (۱۰٪ تخفیف پلکانی)", color: "bg-purple-100 text-purple-800 border-purple-200" };
      case 'gold': return { label: "همکار طلایی (۷٪ تخفیف پلکانی)", color: "bg-amber-100 text-amber-800 border-amber-200" };
      case 'silver': return { label: "همکار نقره‌ای (۴٪ تخفیف پلکانی)", color: "bg-slate-100 text-slate-800 border-slate-200" };
      default: return { label: "همکار برنزی دست‌اول", color: "bg-emerald-100 text-emerald-800 border-emerald-200" };
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 text-right font-sans" dir="rtl">
      
      {/* ========================================================================= */}
      {/* 1. TOP HEADER BANNER - CLEAN WHITE THEME                                  */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs relative overflow-hidden">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-5">
          
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shrink-0 border ${
              userRole === 'factory' ? "bg-indigo-50 text-indigo-700 border-indigo-200" :
              userRole === 'representative' ? "bg-blue-50 text-blue-700 border-blue-200" :
              (userRole === 'agent' || userRole === 'marketer') ? "bg-amber-50 text-amber-700 border-amber-200" :
              "bg-emerald-50 text-emerald-700 border-emerald-200"
            }`}>
              {
                userRole === 'factory' ? '🏭' : 
                userRole === 'representative' ? '🏢' :
                (userRole === 'agent' || userRole === 'marketer') ? '📢' : '🛒'
              }
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-lg sm:text-xl font-black text-slate-900">
                  {user?.company || user?.name || "کاربر گرامی"}
                </h1>
                
                {/* Role Badge */}
                {userRole === 'factory' ? (
                  <span className="text-[11px] px-3 py-0.5 rounded-full font-black bg-indigo-100 text-indigo-900 border border-indigo-200">
                    🏬 کارخانه و واحد تولیدی رسمی
                  </span>
                ) : userRole === 'representative' ? (
                  <span className="text-[11px] px-3 py-0.5 rounded-full font-black bg-blue-100 text-blue-900 border border-blue-200">
                    🏢 عاملیت انحصاری و نمایندگی استانی
                  </span>
                ) : (userRole === 'agent' || userRole === 'marketer') ? (
                  <span className="text-[11px] px-3 py-0.5 rounded-full font-black bg-amber-100 text-amber-900 border border-amber-200">
                    📢 نماینده رسمی بازاریابی و فروش
                  </span>
                ) : (
                  <span className={`text-[11px] px-3 py-0.5 rounded-full font-black border ${getBadgeInfo(user?.badge).color}`}>
                    {getBadgeInfo(user?.badge).label}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3 text-xs text-slate-500 font-bold flex-wrap">
                <span>مسئول: {user?.name || "مدیریت"}</span>
                <span>•</span>
                <span>کد شناسایی: {user?.factoryCode || user?.agencyCode || user?.customerCode || user?.userCode || "USR-1001"}</span>
                {user?.city && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <MapPin size={13} className="text-slate-400" />
                      {user.city}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
            <button
              onClick={() => setActiveTab('order')}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-2xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer"
            >
              <ShoppingBag size={15} />
              <span>ویترین کالاها</span>
            </button>

            <button
              onClick={onLogout}
              className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-2xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut size={15} />
              <span>خروج از حساب</span>
            </button>
          </div>

        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. DEDICATED PORTAL 1: FACTORY DASHBOARD (کارخانه و تولیدکننده)          */}
      {/* ========================================================================= */}
      {userRole === 'factory' && (
        <FactoryManagementPortal
          user={user}
          products={products}
          orders={allOrders}
          onAddProduct={onAddProduct}
          onUpdateProduct={onUpdateProduct}
          onDeleteProduct={onDeleteProduct}
          onUpdateUser={onUpdateUser}
          onRefreshProducts={onRefreshProducts}
          b2bConfig={b2bConfig}
          onUpdateB2bConfig={onUpdateB2bConfig}
          onOpenInvoiceModal={(order) => setSelectedInvoiceOrder(order)}
          onAddToCart={onAddToCart}
        />
      )}

      {/* ========================================================================= */}
      {/* DEDICATED PORTAL 2: REPRESENTATIVE DASHBOARD (عاملیت انحصاری و نمایندگی)   */}
      {/* ========================================================================= */}
      {userRole === 'representative' && (
        <RepresentativeManagementPortal
          user={user}
          orders={allOrders}
          products={products}
          onAddToCart={onAddToCart}
          b2bConfig={b2bConfig}
          setActiveTab={setActiveTab}
          onUpdateUser={onUpdateUser}
          onOpenInvoiceModal={(order) => setSelectedInvoiceOrder(order)}
        />
      )}

      {/* ========================================================================= */}
      {/* 3. DEDICATED PORTAL 2: MARKETER DASHBOARD (بازاریاب و نماینده فروش)        */}
      {/* ========================================================================= */}
      {(userRole === 'agent' || userRole === 'marketer') && (
        <div className="space-y-6">
          
          {/* Sub-Tab Navigation Bar */}
          <div className="bg-white rounded-2xl p-1.5 border border-slate-200 shadow-2xs flex items-center gap-1.5 overflow-x-auto">
            <button
              onClick={() => setMarketerTab('desk')}
              className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                marketerTab === 'desk'
                  ? "bg-amber-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <Target size={16} />
              <span>میز کار بازاریابی و لینک اختصاصی</span>
            </button>

            <button
              onClick={() => setMarketerTab('payout')}
              className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                marketerTab === 'payout'
                  ? "bg-amber-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <DollarSign size={16} />
              <span>تسویه پورسانت و شماره شبا</span>
            </button>

            {(userRole === 'representative' || userRole === 'agent' || userRole === 'marketer' || user?.agencyApproved === true || user?.status === 'approved' || user?.role === 'agency') && (
              <button
                onClick={() => setShowCertificateModal(true)}
                className="px-4 py-2.5 rounded-xl text-xs font-black text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap"
              >
                <Award size={16} />
                <span>مشاهده و چاپ گواهی نمایندگی</span>
              </button>
            )}

            <button
              onClick={() => setMarketerTab('profile')}
              className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                marketerTab === 'profile'
                  ? "bg-amber-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <User size={16} />
              <span>مشخصات بازاریاب و منطقه</span>
            </button>
          </div>

          {/* TAB CONTENT: MARKETER DESK */}
          {marketerTab === 'desk' && (
            <div className="space-y-6">
              
              {/* Referral Link Generator Box */}
              <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-amber-50 text-amber-700 rounded-2xl flex items-center justify-center text-2xl">
                    🔗
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900">لینک اختصاصی بازاریابی شما</h3>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      این لینک را برای سوپرمارکت‌ها و بنکداران ارسال فرمایید. با هر ثبت سفارش، پورسانت نقدی به حساب شما منظور می‌گردد.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                  <div className="flex-1 bg-slate-50 border border-slate-200 px-4 py-3 rounded-2xl text-xs font-mono font-bold text-slate-800 text-left flex items-center justify-between overflow-x-auto">
                    <span>{referralUrl}</span>
                    <span className="text-[10px] text-amber-700 font-black bg-amber-100 px-2 py-0.5 rounded-md ml-2 shrink-0">کد: {referralCode}</span>
                  </div>
                  
                  <button
                    onClick={handleCopyReferral}
                    className="px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs shrink-0"
                  >
                    {copiedReferral ? <Check size={16} /> : <Copy size={16} />}
                    <span>{copiedReferral ? "کپی شد!" : "کپی لینک بازاریابی"}</span>
                  </button>
                </div>
              </div>

              {/* Performance Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-2">
                  <span className="text-xs font-bold text-slate-500">سفارشات معرفی شده:</span>
                  <div className="text-xl font-black text-slate-900">{toPersianNum(marketerReferredOrders.length)} فاکتور</div>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-md inline-block ${
                    marketerRecentOrdersCount > 0 
                      ? "text-emerald-700 bg-emerald-50" 
                      : "text-slate-600 bg-slate-100"
                  }`}>
                    {marketerRecentOrdersCount > 0 ? `+${toPersianNum(marketerRecentOrdersCount)} سفارش در این هفته` : "در انتظار اولین سفارش ارجاعی"}
                  </span>
                </div>

                <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-2">
                  <span className="text-xs font-bold text-slate-500">حجم کل فروش ارجاعی:</span>
                  <div className="text-xl font-black text-slate-900">{toPersianNum(marketerReferredVolume.toLocaleString('fa-IR'))} تومان</div>
                  <span className="text-[10px] text-indigo-700 font-black bg-indigo-50 px-2 py-0.5 rounded-md inline-block">
                    نرخ پورسانت: ۲.۵٪ خالص
                  </span>
                </div>

                <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-2">
                  <span className="text-xs font-bold text-slate-500">موجودی پورسانت قابل تسویه:</span>
                  <div className="text-xl font-black text-amber-700">{toPersianNum(totalMarketerCommission.toLocaleString('fa-IR'))} تومان</div>
                  <button
                    onClick={() => setMarketerTab('payout')}
                    className="text-[10px] text-amber-800 font-black hover:underline inline-block cursor-pointer"
                  >
                    درخواست واریز به شبا ←
                  </button>
                </div>
              </div>

              {/* Referred Orders Breakdown / Empty State */}
              {marketerReferredOrders.length === 0 ? (
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto text-xl">
                    📊
                  </div>
                  <h4 className="text-sm font-black text-slate-800">
                    هنوز سفارشی با لینک یا کد بازاریابی شما ثبت نشده است
                  </h4>
                  <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed font-medium">
                    لینک اختصاصی خود را در گروه‌ها، کانال‌ها یا برای سوپرمارکت‌ها و بنکداران ارسال فرمایید. به محض ثبت و تایید هر سفارش، مبلغ ۲.۵٪ از کل فاکتور به عنوان پورسانت نقدی در این پنل محاسبه و قابل تسویه به شماره شبا خواهد بود.
                  </p>
                </div>
              ) : (
                <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                      <FileText size={16} className="text-amber-600" />
                      <span>لیست فاکتورهای ارجاع شده ({toPersianNum(marketerReferredOrders.length)} مورد)</span>
                    </h4>
                    <span className="text-xs text-slate-500 font-bold">مجموع پورسانت: {toPersianNum(totalMarketerCommission.toLocaleString('fa-IR'))} تومان</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-right text-xs">
                      <thead>
                        <tr className="border-b border-slate-100 text-slate-400 font-bold">
                          <th className="pb-3 pr-2">شماره فاکتور</th>
                          <th className="pb-3">خریدار / فروشگاه</th>
                          <th className="pb-3">مبلغ کل سفارش</th>
                          <th className="pb-3">پورسانت شما (۲.۵٪)</th>
                          <th className="pb-3">وضعیت</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {marketerReferredOrders.map((ord, idx) => {
                          const ordTotal = Number(ord.totalAmount) || 0;
                          const comm = Math.round(ordTotal * 0.025);
                          return (
                            <tr key={ord.id || idx} className="hover:bg-slate-50/80 transition-colors">
                              <td className="py-3 pr-2 font-mono font-bold text-slate-700">#{ord.id ? ord.id.slice(-6).toUpperCase() : `ORD-${idx+1}`}</td>
                              <td className="py-3 font-bold text-slate-900">{ord.buyerName || ord.buyerInfo?.name || "فروشگاه همکار"}</td>
                              <td className="py-3 font-mono font-bold text-slate-900">{toPersianNum(ordTotal.toLocaleString('fa-IR'))} تومان</td>
                              <td className="py-3 font-mono font-bold text-emerald-600">+{toPersianNum(comm.toLocaleString('fa-IR'))} تومان</td>
                              <td className="py-3">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">تایید شده</span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* TAB CONTENT: MARKETER PAYOUT */}
          {marketerTab === 'payout' && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                <div className="w-12 h-12 bg-amber-50 text-amber-700 rounded-2xl flex items-center justify-center text-2xl">
                  💰
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">درخواست تسویه پورسانت بازاریابی</h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    مبلغ درخواستی از طریق سامانه پایا به شماره شبا ثبت‌شده شما واریز می‌گردد.
                  </p>
                </div>
              </div>

              {settlementSuccess && (
                <div className="bg-emerald-50 text-emerald-800 p-3.5 rounded-2xl text-xs font-black flex items-center gap-2 border border-emerald-200">
                  <CheckCircle2 size={16} className="text-emerald-600" />
                  <span>{settlementSuccess}</span>
                </div>
              )}

              <form onSubmit={handleRequestSettlement} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-black text-slate-800 block">مبلغ درخواستی جهت تسویه (تومان):</label>
                    <input
                      type="number"
                      required
                      value={settlementAmount}
                      onChange={(e) => setSettlementAmount(e.target.value)}
                      placeholder="مثال: 3000000"
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-2xl focus:border-amber-600 text-xs font-bold text-slate-900"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-black text-slate-800 block">شماره شبا بانکی (IR):</label>
                    <input
                      type="text"
                      required
                      value={iban || "IR120170000000123456789012"}
                      onChange={(e) => setIban(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-2xl focus:border-amber-600 text-xs font-mono font-bold text-slate-900 text-left"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-2xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 shadow-xs"
                  >
                    <DollarSign size={16} />
                    <span>ثبت درخواست واریز پورسانت</span>
                  </button>
                </div>
              </form>

              {/* Payout History */}
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <h4 className="text-xs font-black text-slate-800">سوابق درخواست‌های تسویه:</h4>
                <div className="space-y-2">
                  {payoutsHistory.length === 0 ? (
                    <p className="text-xs text-slate-400 font-bold py-2">هنوز درخواست تسویه‌ای ثبت نشده است.</p>
                  ) : (
                    payoutsHistory.map((p: any, pIdx: number) => (
                      <div key={`payout-hist-${p.id || pIdx}-${pIdx}`} className="flex justify-between items-center bg-slate-50 p-3 rounded-2xl text-xs">
                        <div>
                          <span className="font-black text-slate-900">{toPersianNum(p.amount?.toLocaleString('fa-IR'))} تومان</span>
                          <span className="text-[10px] text-slate-400 font-bold block">{p.date} - شبا: {p.iban}</span>
                        </div>
                        <span className="text-[10px] font-black bg-amber-100 text-amber-900 px-2.5 py-1 rounded-full">
                          {p.status}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB CONTENT: MARKETER PROFILE */}
          {marketerTab === 'profile' && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                <div className="w-12 h-12 bg-amber-50 text-amber-700 rounded-2xl flex items-center justify-center text-2xl">
                  👤
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">مشخصات بازاریاب و نماینده رسمی</h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    ویرایش اطلاعات فردی و شماره حساب جهت تسویه حساب.
                  </p>
                </div>
              </div>

              {successMsg && (
                <div className="bg-emerald-50 text-emerald-800 p-3.5 rounded-2xl text-xs font-black flex items-center gap-2 border border-emerald-200">
                  <CheckCircle2 size={16} className="text-emerald-600" />
                  <span>{successMsg}</span>
                </div>
              )}

              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-black text-slate-800 block">نام و نام خانوادگی:</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-2xl focus:border-amber-600 text-xs font-bold text-slate-900"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-black text-slate-800 block">شماره همراه:</label>
                    <input
                      type="text"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-2xl focus:border-amber-600 text-xs font-mono font-bold text-slate-900 text-left"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-black text-slate-800 block">استان و شهر فعالیت:</label>
                    <input
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-2xl focus:border-amber-600 text-xs font-bold text-slate-900"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-black text-slate-800 block">شماره شبا بانکی جهت تسویه:</label>
                    <input
                      type="text"
                      value={iban}
                      onChange={(e) => setIban(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-2xl focus:border-amber-600 text-xs font-mono font-bold text-slate-900 text-left"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-2xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 shadow-sm"
                  >
                    {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                    <span>ذخیره تغییرات</span>
                  </button>
                </div>
              </form>
            </div>
          )}

        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. DEDICATED PORTAL 3: CUSTOMER DASHBOARD (خریدار عمده و سوپرمارکت)       */}
      {/* ========================================================================= */}
      {(userRole === 'customer' || userRole === 'user') && (
        <div className="space-y-6">
          
          {/* Important Switch Banner for Dealership */}
          <div className="bg-gradient-to-r from-emerald-600/10 via-teal-500/5 to-transparent border border-emerald-500/20 rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-5 shadow-xs">
            <div className="flex items-center gap-4 text-right">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-600/20">
                <Briefcase size={24} />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-black">
                    ارتقای پنل کاربری
                  </span>
                  <span className="text-[11px] font-black text-slate-700">سوئیچ به پنل نمایندگان رسمی</span>
                </div>
                <p className="text-slate-500 text-xs font-bold max-w-2xl leading-relaxed">
                  مشتری گرامی، با ثبت درخواست نمایندگی و تایید سیستم توزیع شما، پنل کاربری‌تان به عاملیت رسمی تغییر یافته و از نرخ‌های کف کارخانه و سهمیه انحصاری استان بهره‌مند خواهید شد.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setActiveTab('dealership_request')}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center gap-2 shadow-md shadow-emerald-600/20 transition-all cursor-pointer whitespace-nowrap shrink-0"
            >
              <ShieldCheck size={16} />
              <span>ثبت درخواست و سوئیچ به نمایندگی</span>
            </button>
          </div>

          {/* Sub-Tab Navigation Bar */}
          <div className="bg-white rounded-2xl p-1.5 border border-slate-200 shadow-2xs flex items-center gap-1.5 overflow-x-auto">
            <button
              onClick={() => setCustomerTab('orders')}
              className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                customerTab === 'orders'
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <ShoppingBag size={16} />
              <span>سفارشات و فاکتورهای من ({toPersianNum(customerOrders.length)})</span>
            </button>

            <button
              onClick={() => setCustomerTab('quick_order')}
              className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                customerTab === 'quick_order'
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <TrendingDown size={16} />
              <span>سفارش‌گیری سریع و هشدارهای قیمت</span>
            </button>

            <button
              onClick={() => setCustomerTab('credit')}
              className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                customerTab === 'credit'
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <CreditCard size={16} />
              <span>اعتبار خرید و چک‌های ثبت شده</span>
            </button>

            <button
              onClick={() => setCustomerTab('profile')}
              className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                customerTab === 'profile'
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <Store size={16} />
              <span>مشخصات فروشگاه و آدرس تحویل</span>
            </button>
          </div>

          {/* TAB CONTENT: CUSTOMER ORDERS & INVOICES */}
          {customerTab === 'orders' && (
            <div className="space-y-4">
              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-slate-900">سفارشات خرید عمده و فاکتورهای امانی</h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    رهگیری وضعیت بار، دانلود فاکتور رسمی با مهر پلتفرم دست‌اول.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('order')}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus size={15} />
                  <span>ثبت سفارش جدید</span>
                </button>
              </div>

              {customerOrders.length === 0 ? (
                <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center space-y-3 shadow-xs">
                  <div className="w-16 h-16 bg-emerald-50 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto text-2xl">
                    🛍️
                  </div>
                  <h4 className="text-base font-black text-slate-800">هنوز سفارشی توسط شما ثبت نشده است</h4>
                  <p className="text-xs text-slate-500 font-medium max-w-md mx-auto leading-relaxed">
                    می‌توانید مستقیماً از ویترین دست‌اول کالاهای کارخانجات را به قیمت درب کارخانه و با تخفیف وفاداری سفارش دهید.
                  </p>
                  <button
                    onClick={() => setActiveTab('order')}
                    className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-black transition-all cursor-pointer inline-flex items-center gap-2"
                  >
                    <ShoppingBag size={16} />
                    <span>مشاهده ویترین محصولات و خرید عمده</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {customerOrders.map((order, oIdx) => (
                    <div key={`cust-order-${order.id || oIdx}-${oIdx}`} className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                        <div>
                          <div className="flex items-center gap-2.5">
                            <span className="text-sm font-black text-slate-900">سفارش {order.id}</span>
                            <span className="text-[10px] px-2.5 py-0.5 rounded-full font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                              {order.status === 'delivered' ? "تحویل شده" : "بارگیری از انبار دست‌اول"}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-400 font-bold mt-1 block">
                            تاریخ: {order.createdAt ? new Date(order.createdAt).toLocaleDateString('fa-IR') : "امروز"} | نحوه پرداخت: {order.paymentMethod || "نقدی با تخفیف"}
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-left">
                            <span className="text-xs text-slate-400 font-bold block">مبلغ کل فاکتور:</span>
                            <span className="text-sm font-black text-emerald-700">
                              {toPersianNum(order.totalAmount?.toLocaleString('fa-IR'))} تومان
                            </span>
                          </div>
                          <button
                            onClick={() => setSelectedInvoiceOrder(order)}
                            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer"
                          >
                            <Printer size={14} />
                            <span>چاپ فاکتور</span>
                          </button>
                        </div>
                      </div>

                      {/* Items */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                        {order.items?.map((item: any, idx: number) => (
                          <div key={`order-item-${item.productId || item.id || idx}-${idx}`} className="bg-slate-50 p-3 rounded-2xl text-xs flex justify-between items-center">
                            <span className="font-bold text-slate-800 line-clamp-1">{item.name}</span>
                            <span className="font-black text-slate-900 shrink-0 ml-2">{toPersianNum(item.quantityCartons)} کارتن</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB CONTENT: QUICK ORDER & PRICE ALERTS */}
          {customerTab === 'quick_order' && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-700 rounded-2xl flex items-center justify-center text-2xl">
                  ⚡
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">سفارش‌گیری سریع اقلام پرمصرف</h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    تکرار سفارش اقلام پرفروش با یک کلیک و ثبت هشدارهای کاهش قیمت کف بازار.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.slice(0, 6).map((p, pIdx) => (
                  <div key={`quick-order-p-${p.id || pIdx}-${pIdx}`} className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 flex flex-col justify-between gap-3">
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-black text-slate-400">{p.brand}</span>
                      <h4 className="text-xs font-black text-slate-900 line-clamp-1">{p.name}</h4>
                      <div className="text-xs font-black text-emerald-700">
                        {toPersianNum(p.bulk_price?.toLocaleString('fa-IR'))} تومان / کارتن
                      </div>
                    </div>
                    <button
                      onClick={() => onAddToCart(p, p.min_order_cartons || 1)}
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Plus size={14} />
                      <span>افزودن به سبد ({toPersianNum(p.min_order_cartons || 1)} کارتن)</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB CONTENT: CREDIT & FINANCIALS */}
          {customerTab === 'credit' && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-emerald-50 text-emerald-700 rounded-2xl flex items-center justify-center text-2xl">
                    💳
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900">اعتبار خرید و مدیریت رتبه اعتباری</h3>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      استعلام رتبه اعتباری از سامانه اعتباریتو، بارگذاری گواهی مالی و درخواست سقف خرید اعتباری.
                    </p>
                  </div>
                </div>

                <a
                  href="https://etebarito.ir"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-sm"
                >
                  <span>ورود به سامانه اعتباریتو</span>
                  <ExternalLink size={14} />
                </a>
              </div>

              {/* Dynamic Financial Overview */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-emerald-50/60 border border-emerald-200 p-5 rounded-3xl space-y-1">
                  <span className="text-xs font-bold text-emerald-800">سقف اعتبار خرید چکی:</span>
                  <div className="text-xl font-black text-emerald-950">
                    {etebaritoState?.status === 'verified' ? toPersianNum("۵۰,۰۰۰,۰۰۰ تومان") : toPersianNum("نیازمند استعلام اعتباریتو")}
                  </div>
                  <span className="text-[10px] text-emerald-700 font-bold">
                    {etebaritoState?.status === 'verified' ? "مهلت تسویه: ۳۰ تا ۶۰ روزه" : "پس از ثبت گواهی اعتباریتو فعال می‌شود"}
                  </span>
                </div>

                <div className="bg-slate-50 border border-slate-200 p-5 rounded-3xl space-y-1">
                  <span className="text-xs font-bold text-slate-500">اعتبار استفاده شده:</span>
                  <div className="text-xl font-black text-slate-900">{toPersianNum("۰")} تومان</div>
                  <span className="text-[10px] text-slate-400 font-bold">بدون بدهی جاری</span>
                </div>

                <div className="bg-slate-50 border border-slate-200 p-5 rounded-3xl space-y-1">
                  <span className="text-xs font-bold text-slate-500">رتبه اعتباری (اعتباریتو):</span>
                  <div className="text-xl font-black text-indigo-900 flex items-center gap-2">
                    {etebaritoState?.grade ? (
                      <span className="bg-indigo-100 text-indigo-800 px-2.5 py-0.5 rounded-lg text-sm">
                        رتبه {etebaritoState.grade}
                      </span>
                    ) : (
                      <span className="text-slate-400 text-sm font-bold">ثبت‌نشده</span>
                    )}
                  </div>
                  <span className={`text-[10px] font-bold ${etebaritoState ? 'text-emerald-700' : 'text-amber-600'}`}>
                    {etebaritoState ? 'گواهی بارگذاری شده است' : 'استعلام اولیه اعتباریتو الزامی است'}
                  </span>
                </div>
              </div>

              {/* Etebarito Inquiry & Report Upload Zone */}
              <div className="bg-slate-50/80 rounded-2xl border border-slate-200 p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/80">
                  <div className="space-y-1">
                    <h4 className="text-xs font-black text-slate-900 flex items-center gap-2">
                      <Award size={16} className="text-indigo-600" />
                      <span>استعلام و بارگذاری گواهی رتبه‌بندی اعتباریتو (Etebarito)</span>
                    </h4>
                    <p className="text-[11px] text-slate-500 font-medium">
                      برای فعال‌سازی تسویه چکی و سقف اعتباری، ابتدا با کلیک روی لینک زیر گزارش اعتبارسنجی خود را از سایت اعتباریتو دریافت کرده و فایل آن را در این قسمت آپلود نمایید.
                    </p>
                  </div>

                  <a
                    href="https://etebarito.ir"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all flex items-center gap-2 shrink-0 cursor-pointer shadow-sm"
                  >
                    <span>دریافت کارنامه از اعتباریتو</span>
                    <ExternalLink size={14} />
                  </a>
                </div>

                {etebaritoMsg && (
                  <div className="p-3 bg-emerald-100 border border-emerald-300 text-emerald-900 rounded-xl text-xs font-black flex items-center gap-2">
                    <CheckCircle size={16} className="text-emerald-600 shrink-0" />
                    <span>{etebaritoMsg}</span>
                  </div>
                )}

                {/* Upload Form */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end pt-1">
                  <div>
                    <label className="text-[11px] font-black text-slate-700 block mb-1">رتبه دریافتی از اعتباریتو:</label>
                    <select
                      value={etebaritoGradeInput}
                      onChange={(e) => setEtebaritoGradeInput(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800 focus:border-indigo-600 outline-none"
                    >
                      <option value="A1">رتبه A1 (ممتاز بی‌خطر)</option>
                      <option value="A2">رتبه A2 (بسیار خوش‌حساب)</option>
                      <option value="B1">رتبه B1 (خوش‌حساب استاندارد)</option>
                      <option value="B2">رتبه B2 (متوسط مثبت)</option>
                      <option value="C1">رتبه C1 (نیازمند وثیقه اضافه)</option>
                      <option value="C2">رتبه C2 (پرریسک)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-black text-slate-700 block mb-1">امتیاز اعتباری (از ۳۰۰ تا ۹۰۰):</label>
                    <input
                      type="number"
                      value={etebaritoScoreInput}
                      onChange={(e) => setEtebaritoScoreInput(e.target.value)}
                      placeholder="مثلا 750"
                      className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800 focus:border-indigo-600 outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-black text-slate-700 block mb-1">آپلود PDF یا تصویر گزارش اعتباریتو:</label>
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onload = (evt) => {
                            const certObj = {
                              grade: etebaritoGradeInput,
                              score: etebaritoScoreInput,
                              certName: file.name,
                              certUrl: evt.target?.result as string,
                              uploadDate: new Date().toLocaleDateString('fa-IR'),
                              status: 'verified'
                            };
                            localStorage.setItem("dastavval_user_etebarito", JSON.stringify(certObj));
                            setEtebaritoState(certObj);
                            setEtebaritoMsg("گزارش اعتباریتو با موفقیت آپلود و در سیستم ثبت شد.");
                            setTimeout(() => setEtebaritoMsg(null), 5000);
                          };
                          reader.readAsDataURL(file);
                        }}
                        className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                      />
                      <div className="w-full bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 rounded-xl p-2.5 text-xs font-black flex items-center justify-center gap-2 cursor-pointer transition-colors">
                        <Upload size={14} />
                        <span>{etebaritoState?.certName ? `تغییر فایل (${etebaritoState.certName})` : "انتخاب فایل گزارش اعتباریتو"}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {etebaritoState && (
                  <div className="mt-3 p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <FileText size={16} className="text-indigo-600" />
                      <span className="font-bold text-slate-800">گزارش فعلی: {etebaritoState.certName || "گواهی اعتباریتو"}</span>
                      <span className="text-[10px] text-slate-400">({etebaritoState.uploadDate})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-black rounded-md text-[10px]">
                        ثبت‌شده
                      </span>
                      <button
                        onClick={() => {
                          localStorage.removeItem("dastavval_user_etebarito");
                          setEtebaritoState(null);
                        }}
                        className="text-rose-600 hover:text-rose-700 font-bold text-[10px] cursor-pointer"
                      >
                        حذف
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB CONTENT: STORE PROFILE */}
          {customerTab === 'profile' && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-700 rounded-2xl flex items-center justify-center text-2xl">
                  🏪
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">مشخصات فروشگاه و آدرس تحویل سفارش</h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    این آدرس به عنوان مقصد تخلیه بار و صدور بارنامه رسمی جاده‌ای استفاده می‌شود.
                  </p>
                </div>
              </div>

              {successMsg && (
                <div className="bg-emerald-50 text-emerald-800 p-3.5 rounded-2xl text-xs font-black flex items-center gap-2 border border-emerald-200">
                  <CheckCircle2 size={16} className="text-emerald-600" />
                  <span>{successMsg}</span>
                </div>
              )}

              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-black text-slate-800 block">نام فروشگاه / سوپرمارکت:</label>
                    <input
                      type="text"
                      required
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-2xl focus:border-emerald-600 text-xs font-bold text-slate-900"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-black text-slate-800 block">نام صاحب فروشگاه:</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-2xl focus:border-emerald-600 text-xs font-bold text-slate-900"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-black text-slate-800 block">شماره همراه تماس و هماهنگی:</label>
                    <input
                      type="text"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-2xl focus:border-emerald-600 text-xs font-mono font-bold text-slate-900 text-left"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-black text-slate-800 block">شهر محل فروشگاه:</label>
                    <input
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-2xl focus:border-emerald-600 text-xs font-bold text-slate-900"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-800 block">آدرس دقیق محل تخلیه بار:</label>
                  <textarea
                    rows={2}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="خیابان، پلاک، طبقه یا جزئیات دسترسی راننده..."
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-2xl focus:border-emerald-600 text-xs font-bold text-slate-900"
                  />
                </div>

                <div className="space-y-1 pt-3 border-t border-slate-100">
                  <label className="text-xs font-black text-slate-800 block">تغییر کلمه عبور (اختیاری):</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="برای تغییر رمز فعلی، رمز جدید را وارد کنید..."
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-2xl focus:border-emerald-600 text-xs font-mono font-bold text-slate-900"
                  />
                  <p className="text-[10px] text-slate-500 font-bold mt-1">در صورت عدم نیاز به تغییر، این فیلد را خالی بگذارید.</p>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 shadow-sm"
                  >
                    {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                    <span>ذخیره مشخصات فروشگاه</span>
                  </button>
                </div>
              </form>
            </div>
          )}

        </div>
      )}

      {/* Invoice Modal View */}
      {selectedInvoiceOrder && (
        <WholesaleInvoiceView
          order={selectedInvoiceOrder}
          onClose={() => setSelectedInvoiceOrder(null)}
          b2bConfig={b2bConfig}
          isAdmin={false}
          isBuyer={userRole !== 'factory'}
          isFactoryView={userRole === 'factory'}
          factoryName={user?.company || user?.name || ''}
          factoryCode={user?.factoryCode || user?.id || ''}
        />
      )}

      {/* Representative Certificate Modal */}
      {showCertificateModal && (
        <RepresentativeCertificateView
          repName={user?.name || "نماینده دست اول"}
          companyName={user?.company || "عاملیت توزیع استانی"}
          city={user?.city || "تهران"}
          agencyCode={user?.agencyCode || "AGN-5001"}
          isApproved={user?.agencyApproved === true || user?.isApproved === true || user?.status === 'approved'}
          b2bConfig={b2bConfig}
          onClose={() => setShowCertificateModal(false)}
        />
      )}

    </div>
  );
}
