import React, { useState, useEffect } from "react";
import { 
  User, 
  Building, 
  Phone, 
  MapPin, 
  ShoppingBag, 
  CreditCard, 
  LogOut, 
  Trash2, 
  Edit, 
  CheckCircle2, 
  Sparkles, 
  Package, 
  Clock, 
  FileText, 
  ArrowLeft,
  ChevronRight,
  ShieldCheck,
  Tag,
  Store,
  Upload,
  AlertTriangle,
  X,
  Printer,
  Bell,
  TrendingDown,
  Truck,
  Activity,
  Loader2,
  Plus,
  RefreshCw,
  Award,
  DollarSign,
  Percent,
  Share2,
  Copy,
  Check,
  Briefcase,
  Users,
  Target,
  TrendingUp,
  Download,
  Eye,
  Gift
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { collection, query, where, getDocs } from "../lib/firebase-mock";
import { db } from "../lib/firebase";
import { Product, Order } from "../types";
import WholesaleInvoiceView from "./WholesaleInvoiceView";
import RepresentativeCertificateView from "./RepresentativeCertificateView";
import ConfirmModal from "./ConfirmModal";
import MultiVendorPanel from "./MultiVendorPanel";

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
  currentSellerId,
  setCurrentSeller,
  onRefreshProducts
}: UserPanelProps) {
  const [activeSubTab, setActiveSubTab] = useState<'profile' | 'orders' | 'price_alerts' | 'supplier' | 'representative' | 'marketer'>('profile');
  
  // Certificate Modal State
  const [showCertificateModal, setShowCertificateModal] = useState(false);

  // Marketer / Affiliate States
  const [copiedReferral, setCopiedReferral] = useState(false);
  const [settlementAmount, setSettlementAmount] = useState("");
  const [settlementSuccess, setSettlementSuccess] = useState<string | null>(null);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [ibanNumber, setIbanNumber] = useState(user?.iban || "IR120170000000123456789012");

  // Price Alerts State
  const [priceAlerts, setPriceAlerts] = useState<any[]>([]);

  const loadPriceAlerts = () => {
    try {
      const saved = localStorage.getItem("dastavval_price_alerts");
      if (saved) {
        const parsed = JSON.parse(saved);
        // Sync with current product prices to update isTriggered status
        const updated = parsed.map((alert: any) => {
          const matchProduct = products.find(p => p.id === alert.productId);
          const currentPrice = matchProduct ? matchProduct.bulk_price : alert.currentPrice;
          return {
            ...alert,
            currentPrice,
            isTriggered: matchProduct ? matchProduct.bulk_price <= alert.targetPrice : alert.isTriggered
          };
        });
        setPriceAlerts(updated);
      } else {
        setPriceAlerts([]);
      }
    } catch (e) {
      setPriceAlerts([]);
    }
  };

  useEffect(() => {
    loadPriceAlerts();
    const handleAlertChange = () => loadPriceAlerts();
    window.addEventListener("dastavval-price-alert-changed", handleAlertChange);
    return () => window.removeEventListener("dastavval-price-alert-changed", handleAlertChange);
  }, [products]);

  const handleDeletePriceAlert = (alertId: string) => {
    const filtered = priceAlerts.filter(a => a.id !== alertId);
    setPriceAlerts(filtered);
    localStorage.setItem("dastavval_price_alerts", JSON.stringify(filtered));
    window.dispatchEvent(new CustomEvent("dastavval-price-alert-changed"));
  };
  
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

  // Profile editing form states
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [company, setCompany] = useState(user?.company || "");
  const [address, setAddress] = useState(user?.address || "");
  const [city, setCity] = useState(user?.city || "");
  
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Orders history state
  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<Order | null>(null);

  // Account deletion modal state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Explore & Factory Product creation states (removed from UI, keeping cleanup simple)

  // Is Supplier or Factory owner check
  const isSupplier = user?.role === 'factory' || user?.role === 'admin' || user?.badge === 'vip' || (user?.company && (user.company.includes('کارخانه') || user.company.includes('صنایع') || user.company.includes('گروه')));

  // Supplier / Factory Portal States
  const [supplierTab, setSupplierTab] = useState<'products' | 'orders' | 'profile'>('products');
  const [showAddProdForm, setShowAddProdForm] = useState(false);
  const [prodTitle, setProdTitle] = useState("");
  const [prodBrand, setProdBrand] = useState(user?.company || "صنایع غذایی همکار");
  const [prodCategory, setProdCategory] = useState("تنقلات و شکلات");
  const [prodBulkPrice, setProdBulkPrice] = useState<number | "">(1250000);
  const [prodConsumerPrice, setProdConsumerPrice] = useState<number | "">(1650000);
  const [prodMinOrder, setProdMinOrder] = useState<number>(5);
  const [prodUnitCount, setProdUnitCount] = useState<number>(24);
  const [prodImage, setProdImage] = useState("");
  const [prodOrigin, setProdOrigin] = useState(user?.city || "تهران");
  const [prodDesc, setProdDesc] = useState("");
  const [isAddingProd, setIsAddingProd] = useState(false);
  const [prodSuccess, setProdSuccess] = useState<string | null>(null);
  const [prodError, setProdError] = useState<string | null>(null);

  const [factoryOrders, setFactoryOrders] = useState<Order[]>([]);
  const [loadingFactoryOrders, setLoadingFactoryOrders] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setPhone(user.phone || "");
      setCompany(user.company || "");
      setAddress(user.address || "");
      setCity(user.city || "");
      fetchMyOrders();
      if (isSupplier) {
        fetchFactoryOrders();
      }
    }
  }, [user]);

  const fetchFactoryOrders = async () => {
    setLoadingFactoryOrders(true);
    try {
      const q = query(collection(db, "orders"));
      const snap = await getDocs(q);
      const all = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Order[];
      
      const compName = (user?.company || "").trim().toLowerCase();
      // Filter orders where items match factory name, or all orders if user is factory role
      const filtered = all.filter(o => {
        if (!o.items || !Array.isArray(o.items)) return false;
        if (user?.role === 'factory' || user?.role === 'admin') return true;
        return o.items.some((it: any) => {
          const fn = (it.factoryName || it.factory_name || it.brand || "").toLowerCase();
          return compName && (fn.includes(compName) || compName.includes(fn));
        });
      });
      setFactoryOrders(filtered.length > 0 ? filtered : all.slice(0, 10));
    } catch (e) {
      console.warn("Could not fetch factory orders:", e);
    } finally {
      setLoadingFactoryOrders(false);
    }
  };

  const handleCreateFactoryProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodTitle.trim() || !prodBulkPrice) {
      setProdError("لطفا نام کالا و قیمت هر کارتن را وارد نمایید.");
      return;
    }
    setIsAddingProd(true);
    setProdError(null);
    setProdSuccess(null);

    try {
      const newProductData: Omit<Product, 'id'> = {
        name: prodTitle.trim(),
        brand: prodBrand.trim() || user?.company || "کارخانه دست اول",
        category: prodCategory,
        price: Number(prodBulkPrice),
        bulk_price: Number(prodBulkPrice),
        consumer_price: Number(prodConsumerPrice) || Number(prodBulkPrice) * 1.25,
        min_order_cartons: Number(prodMinOrder) || 1,
        carton_pack_count: Number(prodUnitCount) || 12,
        stock_quantity_cartons: 100,
        unit: "کارتن",
        sellerId: user?.id || "factory_user",
        sellerName: prodBrand.trim() || user?.company || "کارخانه دست اول",
        production_lead_time_days: 2,
        image_url: prodImage.trim() || "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80",
        factory_name: prodBrand.trim() || user?.company || "کارخانه دست اول",
        factoryName: prodBrand.trim() || user?.company || "کارخانه دست اول",
        description: prodDesc.trim() || `کالای باکیفیت مستقیم از خط تولید ${prodBrand}`,
        rating: 5.0,
      };

      if (onAddProduct) {
        await onAddProduct(newProductData);
      } else {
        // Fallback local storage update
        try {
          const existing = JSON.parse(localStorage.getItem("dastavval_products_custom") || "[]");
          existing.push(newProductData);
          localStorage.setItem("dastavval_products_custom", JSON.stringify(existing));
        } catch (e) {
          console.error("Localstorage save failed:", e);
        }
      }

      setProdSuccess("محصول جدید با موفقیت به ویترین کالای عمده کارخانه اضافه شد.");
      setProdTitle("");
      setProdImage("");
      setProdDesc("");
      setShowAddProdForm(false);
      setTimeout(() => setProdSuccess(null), 4000);
    } catch (err: any) {
      setProdError("خطا در ثبت محصول: " + err.message);
    } finally {
      setIsAddingProd(false);
    }
  };

  const fetchMyOrders = async () => {
    if (!user) return;
    setLoadingOrders(true);
    try {
      const q = query(collection(db, "orders"));
      const snap = await getDocs(q);
      const allOrders = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Order[];
      
      // Filter orders by phone or name matching current user
      const filtered = allOrders.filter(o => 
        (o.buyerPhone && user.phone && o.buyerPhone.trim() === user.phone.trim()) ||
        (o.buyerName && user.name && o.buyerName.trim() === user.name.trim()) ||
        (user.email && o.buyerPhone === user.email)
      );
      
      setMyOrders(filtered);
    } catch (e) {
      console.warn("Could not fetch user orders:", e);
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const updatedUser = {
        ...user,
        name,
        phone,
        company,
        address,
        city
      };

      // Save to localStorage
      localStorage.setItem("dastavval_user", JSON.stringify(updatedUser));
      
      // Update local storage registry
      const localUsers = JSON.parse(localStorage.getItem("dastavval_local_users") || "{}");
      if (user.email && localUsers[user.email]) {
        localUsers[user.email] = {
          ...localUsers[user.email],
          name,
          phone,
          company,
          address,
          city
        };
        localStorage.setItem("dastavval_local_users", JSON.stringify(localUsers));
      }

      if (onUpdateUser) {
        onUpdateUser(updatedUser);
      }

      setSuccessMsg("مشخصات حساب کاربری شما با موفقیت بروزرسانی شد.");
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg("خطا در ذخیره مشخصات: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = () => {
    try {
      if (user?.email) {
        const localUsers = JSON.parse(localStorage.getItem("dastavval_local_users") || "{}");
        delete localUsers[user.email];
        localStorage.setItem("dastavval_local_users", JSON.stringify(localUsers));
      }
      localStorage.removeItem("dastavval_user");
      alert("حساب کاربری شما با موفقیت و به طور کامل پاکسازی شد.");
      onLogout();
    } catch (e) {
      alert("خطا در حذف حساب کاربری.");
    }
  };

  const getBadgeColor = (badge?: string) => {
    switch (badge) {
      case 'vip': return "bg-purple-100 text-purple-800 border-purple-200";
      case 'gold': return "bg-amber-100 text-amber-800 border-amber-200";
      case 'silver': return "bg-slate-200 text-slate-800 border-slate-300";
      default: return "bg-emerald-100 text-emerald-800 border-emerald-200";
    }
  };

  const getBadgeLabel = (badge?: string) => {
    switch (badge) {
      case 'vip': return "همکار VIP - ۱۰٪ تخفیف";
      case 'gold': return "همکار طلایی - ۷٪ تخفیف";
      case 'silver': return "همکار نقره‌ای - ۴٪ تخفیف";
      default: return "همکار برنزی - ثبت‌نامی";
    }
  };

  return (
    <>
    <ConfirmModal 
      isOpen={confirmDialog.isOpen}
      title={confirmDialog.title}
      message={confirmDialog.message}
      onConfirm={confirmDialog.onConfirm}
      onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
    />
    <div className="max-w-6xl mx-auto space-y-8 text-right font-sans" dir="rtl">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-3xl shrink-0">
              👤
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm font-black">{user?.name || "کاربر گرامی"}</h1>
                <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-black border ${getBadgeColor(user?.badge)}`}>
                  {getBadgeLabel(user?.badge)}
                </span>
              </div>
              <p className="text-xs text-emerald-200/90 font-bold">{user?.company || "فروشگاه همکار"} | {user?.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <button
              onClick={onLogout}
              className="flex-1 md:flex-initial bg-rose-500/20 hover text-rose-200 border border-rose-400/30 px-4 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogOut size={16} />
              <span>خروج از حساب</span>
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="bg-slate-100/60 hover text-slate-300 hover border border-slate-700 px-3 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
              title="حذف حساب"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        {/* Sub Navigation Bar */}
        <div className="flex items-center gap-2 mt-8 pt-4 border-t border-white/10 overflow-x-auto custom-scrollbar">
          <button
            onClick={() => setActiveSubTab('profile')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeSubTab === 'profile' ? "bg-white text-slate-900 shadow-lg" : "text-white/80 hover:text-white"
            }`}
          >
            <User size={15} />
            <span>ویرایش مشخصات</span>
          </button>

          <button
            onClick={() => setActiveSubTab('orders')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeSubTab === 'orders' ? "bg-white text-slate-900 shadow-lg" : "text-white/80 hover:text-white"
            }`}
          >
            <ShoppingBag size={15} />
            <span>تاریخچه سفارش‌ها و فاکتورها ({myOrders.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('representative')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeSubTab === 'representative' ? "bg-amber-400 text-slate-950 font-black shadow-lg shadow-amber-400/20" : "text-amber-200 hover:text-white"
            }`}
          >
            <Award size={15} />
            <span>میز کار نمایندگی انحصاری</span>
          </button>

          <button
            onClick={() => setActiveSubTab('marketer')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeSubTab === 'marketer' ? "bg-emerald-400 text-slate-950 font-black shadow-lg shadow-emerald-400/20" : "text-emerald-200 hover:text-white"
            }`}
          >
            <Briefcase size={15} />
            <span>میز کار بازاریاب و معرف</span>
          </button>

          <button
            onClick={() => setActiveSubTab('supplier')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeSubTab === 'supplier' ? "bg-indigo-600 text-white shadow-lg" : "text-indigo-200 hover:text-indigo-100"
            }`}
          >
            <Store size={15} />
            <span>پنل کارخانجات و تولیدکنندگان</span>
          </button>

          <button
            onClick={() => setActiveSubTab('price_alerts')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer relative ${
              activeSubTab === 'price_alerts' ? "bg-white text-slate-900 shadow-lg" : "text-white/80 hover:text-white"
            }`}
          >
            <Bell size={15} className="fill-current" />
            <span>هشدارهای قیمت ({priceAlerts.length})</span>
            {priceAlerts.some(a => a.isTriggered) && (
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping absolute top-1.5 right-1.5" />
            )}
          </button>
        </div>
      </div>

      {/* Main Content Sections */}
      {activeSubTab === 'profile' && (
        <div className="space-y-6">
          {/* Social Channel Banner inside Profile */}
          <div className="bg-white text-slate-900 rounded-3xl p-5 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center font-black text-xl shrink-0">
                📡
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-[10px] font-black">
                    کانال‌های رسمی اطلاع‌رسانی
                  </span>
                  <span className="text-[10px] text-slate-500 font-bold">ویژه ثبت سفارش بنکداری</span>
                </div>
                <h3 className="text-sm font-black text-slate-900">عضویت در کانال‌های رسمی روبیکا و تلگرام</h3>
                <p className="text-[11px] text-slate-600 font-bold">با عضویت در کانال‌های رسمی، از قیمت‌های لحظه‌ای و اطلاعیه‌های بارگیری مطلع شوید.</p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
              <a
                href={b2bConfig?.rubikaChannelUrl || "https://rubika.ir/dastavval_official"}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-black transition-all shadow-sm text-center cursor-pointer"
              >
                عضویت در روبیکا
              </a>
              <a
                href={b2bConfig?.telegramChannelUrl || "https://t.me/dastavval_official"}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-black transition-all shadow-sm text-center cursor-pointer"
              >
                عضویت در تلگرام
              </a>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <User className="text-emerald-600" size={20} />
              <span>ویرایش مشخصات کامل حساب کاربری</span>
            </h2>
            <span className="text-[10px] text-slate-400 font-bold">اطلاعات جهت صدور فاکتور رسمی و ارسال بار</span>
          </div>

          {successMsg && (
            <div className="bg-emerald-50 text-emerald-800 p-4 rounded-2xl text-xs font-black flex items-center gap-2 border border-emerald-200/50">
              <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="bg-rose-50 text-rose-800 p-4 rounded-2xl text-xs font-black flex items-center gap-2 border border-rose-200/50">
              <AlertTriangle size={18} className="text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSaveProfile} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-600 block">نام و نام خانوادگی مدیر خرید:</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus focus"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-600 block">نام فروشگاه / شرکت / بنکداری:</label>
                <div className="relative">
                  <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="text"
                    required
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus focus"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-600 block">شماره همراه تحویل‌گیرنده سفارش:</label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono font-bold text-slate-800 focus:outline-none focus focus"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-600 block">شهر / استان مقصد:</label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus focus"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-600 block">آدرس دقیق انبار تخلیه بار عمده:</label>
              <textarea
                rows={3}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="آدرس دقیق انبار یا فروشگاه جهت تحویل بار را وارد کنید..."
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus focus leading-relaxed"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSaving}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-black px-8 py-3.5 rounded-2xl text-xs transition-all shadow-lg shadow-emerald-600/20 cursor-pointer disabled:opacity-50 flex items-center gap-2"
              >
                {isSaving && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                <span>ذخیره تغییرات مشخصات</span>
              </button>
            </div>
          </form>
        </div>
        </div>
      )}

      {/* Orders & Payments History Section */}
      {activeSubTab === 'orders' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <ShoppingBag className="text-emerald-600" size={20} />
              <span>تاریخچه سفارش‌های ثبت شده و فاکتورها</span>
            </h2>
            <button
              onClick={fetchMyOrders}
              className="text-xs text-emerald-600 hover font-bold flex items-center gap-1 cursor-pointer"
            >
              <span>بروزرسانی لیست</span>
            </button>
          </div>

          {loadingOrders ? (
            <div className="py-12 text-center text-slate-400 font-bold text-xs space-y-2">
              <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p>در حال فراخوانی سوابق سفارشات شما از دیتابیس...</p>
            </div>
          ) : myOrders.length === 0 ? (
            <div className="py-12 text-center space-y-4">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-3xl mx-auto text-slate-400">
                📦
              </div>
              <p className="text-sm font-black text-slate-700">هیچ سفارشی به نام شما یافت نشد.</p>
              <button
                onClick={() => setActiveTab('order')}
                className="bg-emerald-600 text-white font-black px-6 py-2.5 rounded-2xl text-xs hover transition-colors shadow-lg cursor-pointer inline-flex items-center gap-2"
              >
                <span>ثبت اولین سفارش عمده</span>
                <ChevronRight size={16} />
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {myOrders.map((ord) => {
                const getOrderStatusDetails = (status: string) => {
                  switch (status) {
                    case 'order_received':
                      return { text: 'ثبت اولیه سفارش', color: 'bg-blue-50 text-blue-700 border-blue-100' };
                    case 'payment_verified':
                      return { text: 'تایید پرداخت و فاکتور', color: 'bg-indigo-50 text-indigo-700 border-indigo-100' };
                    case 'warehouse_packing':
                      return { text: 'بسته‌بندی و پلمپ', color: 'bg-amber-50 text-amber-700 border-amber-100' };
                    case 'loading_freight':
                      return { text: 'بارگیری و ترخیص حمل', color: 'bg-purple-50 text-purple-700 border-purple-100' };
                    case 'in_transit':
                      return { text: 'در حال ارسال جاده‌ای', color: 'bg-teal-50 text-teal-700 border-teal-100' };
                    case 'delivered':
                      return { text: 'تحویل نهایی', color: 'bg-emerald-50 text-emerald-700 border-emerald-100' };
                    case 'cancelled':
                      return { text: 'لغو شده', color: 'bg-rose-50 text-rose-700 border-rose-100' };
                    default:
                      return { text: 'در حال پردازش', color: 'bg-slate-50 text-slate-700 border-slate-100' };
                  }
                };

                const statusInfo = getOrderStatusDetails(ord.status || 'order_received');

                return (
                  <div 
                    key={ord.id}
                    className="border border-slate-200 rounded-2xl p-4 sm:p-5 hover transition-all space-y-3 bg-slate-50/50"
                  >
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-200 pb-3">
                      <div>
                        <span className="text-xs font-black text-slate-900 block">
                          کد پیگیری: <span className="font-mono text-emerald-600">{ord.trackingNumber || ord.id}</span>
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold">
                          تامین‌کننده: {ord.sellerName || "کارخانه دست اول"}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-xl text-[10px] font-black border ${statusInfo.color}`}>
                          {statusInfo.text}
                        </span>
                        <span className="text-xs font-black font-mono text-slate-800">
                          {ord.totalAmount?.toLocaleString()} تومان
                        </span>
                      </div>
                    </div>

                    <div className="text-xs text-slate-600 space-y-1">
                      <p className="font-bold">اقلام سفارش ({ord.items?.length || 0} قلم):</p>
                      <ul className="list-disc list-inside text-[11px] text-slate-500 space-y-0.5">
                        {ord.items?.map((item, idx) => (
                          <li key={idx}>
                            {item.name} - <span className="font-mono font-bold">{item.quantityCartons} کارتن</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Real-time Order Tracking Stepper */}
                    <div className="bg-white rounded-2xl p-4 border border-slate-150/80 space-y-4 my-4">
                      <div className="flex justify-between items-center pb-2 border-b border-slate-50">
                        <span className="text-[10px] font-black text-slate-400 flex items-center gap-1">
                          <Activity size={12} className="text-emerald-600 animate-pulse shrink-0" />
                          رهگیری لحظه‌ای وضعیت فاکتور و موقعیت ترانزیت جاده‌ای
                        </span>
                        {ord.status === 'cancelled' ? (
                          <span className="text-[9px] font-black text-rose-600 bg-rose-50 px-2.5 py-1 rounded-lg">
                            ❌ لغو شده
                          </span>
                        ) : (
                          <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">
                            🟢 فعال در سیستم
                          </span>
                        )}
                      </div>

                      {ord.status !== 'cancelled' ? (
                        <div className="relative pt-2 pb-6">
                          {/* Connecting Line background */}
                          <div className="absolute top-[26px] right-[10%] left-[10%] h-1 bg-slate-100 rounded-full" />
                          
                          {/* Completed progress line */}
                          <div 
                            className="absolute top-[26px] right-[10%] h-1 bg-gradient-to-l from-emerald-500 to-indigo-600 rounded-full transition-all duration-700"
                            style={{
                              width: `${
                                ord.status === 'order_received' ? '0%' :
                                ord.status === 'payment_verified' ? '33%' :
                                ord.status === 'warehouse_packing' ? '66%' :
                                ord.status === 'loading_freight' ? '75%' :
                                ord.status === 'in_transit' ? '85%' :
                                ord.status === 'delivered' ? '100%' : '0%'
                              }`,
                              left: 'auto',
                              right: '10%'
                            }}
                          />

                          {/* Steps wrapper */}
                          <div className="flex justify-between relative z-10">
                            {[
                              {
                                label: "تایید سفارش",
                                icon: ShieldCheck,
                                isCompleted: ['payment_verified', 'warehouse_packing', 'loading_freight', 'in_transit', 'delivered'].includes(ord.status || ''),
                                isActive: ord.status === 'order_received' || ord.status === 'payment_verified',
                                desc: ord.status === 'order_received' ? "در انتظار بررسی" : "تایید مالی شد"
                              },
                              {
                                label: "بسته‌بندی انبار",
                                icon: Package,
                                isCompleted: ['warehouse_packing', 'loading_freight', 'in_transit', 'delivered'].includes(ord.status || ''),
                                isActive: ord.status === 'warehouse_packing',
                                desc: ['warehouse_packing', 'loading_freight', 'in_transit', 'delivered'].includes(ord.status || '') ? "پلمپ کارتن‌ها" : ord.status === 'payment_verified' ? "در صف بسته‌بندی" : "منتظر تایید"
                              },
                              {
                                label: "ارسال جاده‌ای",
                                icon: Truck,
                                isCompleted: ['in_transit', 'delivered'].includes(ord.status || ''),
                                isActive: ord.status === 'loading_freight' || ord.status === 'in_transit',
                                desc: ord.status === 'delivered' ? "خروج ترانزیت" : ord.status === 'in_transit' ? "در مسیر جاده" : ord.status === 'loading_freight' ? "در حال بارگیری" : "منتظر لجستیک"
                              },
                              {
                                label: "تحویل انبار",
                                icon: CheckCircle2,
                                isCompleted: ord.status === 'delivered',
                                isActive: ord.status === 'delivered',
                                desc: ord.status === 'delivered' ? "تایید وصول بار" : "منتظر تخلیه بار"
                              }
                            ].map((step, idx) => {
                              const IconComponent = step.icon;
                              return (
                                <div key={idx} className="flex flex-col items-center w-24 text-center">
                                  {/* Node circle */}
                                  <div 
                                    className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-500 border-2 ${
                                      step.isCompleted 
                                        ? "bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-500/20" 
                                        : step.isActive 
                                          ? "bg-white border-indigo-600 text-indigo-600 ring-4 ring-indigo-50 font-black animate-pulse" 
                                          : "bg-white border-slate-200 text-slate-400"
                                    }`}
                                  >
                                    <IconComponent size={15} />
                                  </div>
                                  
                                  {/* Label and description */}
                                  <div className="mt-2 space-y-0.5">
                                    <p className={`text-[10px] font-black ${step.isCompleted ? "text-emerald-600" : step.isActive ? "text-indigo-600" : "text-slate-500"}`}>
                                      {step.label}
                                    </p>
                                    <p className="text-[8px] text-slate-400 font-bold leading-none">
                                      {step.desc}
                                    </p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        <div className="py-3 px-4 bg-rose-50 rounded-xl text-right border border-rose-100 flex items-center gap-2 text-rose-800 text-[10px] font-black">
                          <AlertTriangle size={14} className="shrink-0 text-rose-600" />
                          <span>این فاکتور توسط مدیریت لغو گردیده و از زنجیره تولید و پلمپ ترانزیت برداشته شده است.</span>
                        </div>
                      )}
                    </div>

                  <div className="pt-3 border-t border-slate-200 flex flex-wrap justify-between items-center gap-2">
                    <button
                      onClick={() => setSelectedInvoiceOrder(ord as Order)}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-black rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <Printer size={14} />
                      <span>مشاهده و چاپ فاکتور کارخانه</span>
                    </button>

                    {ord.receiptUrl && (
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-amber-600 font-black">فیش/چک:</span>
                        <a 
                          href={ord.receiptUrl} 
                          target="_blank" 
                          rel="noreferrer"
                          className="text-[10px] text-indigo-600 underline font-bold"
                        >
                          مشاهده تصویر
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

          {/* User Invoice View Modal */}
          {selectedInvoiceOrder && (
            <WholesaleInvoiceView
              order={selectedInvoiceOrder}
              b2bConfig={b2bConfig}
              onClose={() => setSelectedInvoiceOrder(null)}
              isBuyer={true}
            />
          )}
        </div>
      )}

      {/* Price Alerts Tab Section */}
      {activeSubTab === 'price_alerts' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-100 pb-4 gap-4">
            <div>
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Bell className="text-amber-500 fill-amber-500" size={20} />
                <span>هشدارهای قیمت فعال من</span>
              </h2>
              <p className="text-[10px] text-slate-400 font-bold mt-1">به محض این‌که قیمت عمده محصولی به حد نصاب انتخابی شما برسد، در این قسمت آگاه می‌شوید</p>
            </div>
          </div>

          {priceAlerts.length === 0 ? (
            <div className="py-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-3">
              <Bell className="mx-auto text-amber-400" size={32} />
              <p className="text-xs font-bold text-slate-600">هنوز هیچ هشدار قیمتی ثبت نکرده‌اید.</p>
              <p className="text-[10px] text-slate-400">می‌توانید روی آیکون زنگوله 🔔 روی کارت هر کالا در صفحه اصلی کلیک کنید تا هشدار قیمت تنظیم شود.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {priceAlerts.some(a => a.isTriggered) && (
                <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl flex items-center gap-3 text-rose-900">
                  <div className="p-2.5 bg-rose-500 text-white rounded-xl shadow-md animate-bounce">
                    <TrendingDown size={20} />
                  </div>
                  <div className="text-xs font-bold">
                    <span className="font-black text-rose-800">کاهش قیمت ویژه! </span>
                    قیمت عمده یک یا چند کالا به حد نصاب شما رسیده است! اکنون می‌توانید با قیمت ارزان‌تر سفارش دهید.
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {priceAlerts.map((alert: any) => (
                  <div
                    key={alert.id}
                    className={`border rounded-2xl p-4 flex gap-3 transition-all relative ${
                      alert.isTriggered
                        ? "bg-amber-50/60 border-amber-300 ring-2 ring-amber-400/40"
                        : "bg-slate-50/60 border-slate-200"
                    }`}
                  >
                    <div className="w-20 h-20 bg-white rounded-xl overflow-hidden border border-slate-200 shrink-0">
                      <img src={alert.productImage} alt={alert.productName} className="w-full h-full object-cover" />
                    </div>

                    <div className="flex-1 flex flex-col justify-between text-right">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-black text-slate-400">{alert.brand}</span>
                          {alert.isTriggered && (
                            <span className="bg-rose-600 text-white text-[8px] font-black px-2 py-0.5 rounded-full animate-pulse">
                              🔥 کاهش قیمت!
                            </span>
                          )}
                        </div>
                        <h4 className="text-xs font-black text-slate-900 line-clamp-1 mt-0.5">{alert.productName}</h4>
                      </div>

                      <div className="space-y-1 text-[10px] font-bold bg-white p-2 rounded-xl border border-slate-100 my-1">
                        <div className="flex justify-between">
                          <span className="text-slate-400">قیمت موقع ثبت:</span>
                          <span className="font-mono text-slate-600">{alert.originalPrice?.toLocaleString()} ت</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">قیمت هدف شما:</span>
                          <span className="font-mono text-amber-700 font-black">{alert.targetPrice?.toLocaleString()} ت</span>
                        </div>
                        <div className="flex justify-between pt-1 border-t border-slate-100">
                          <span className="text-slate-500">قیمت عمده فعلی:</span>
                          <span className={`font-mono font-black ${alert.isTriggered ? "text-emerald-700 font-extrabold" : "text-slate-800"}`}>
                            {alert.currentPrice?.toLocaleString()} ت
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <button
                          onClick={() => handleDeletePriceAlert(alert.id)}
                          className="text-[10px] font-bold text-rose-600 hover:text-rose-800 flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 size={12} />
                          حذف هشدار
                        </button>

                        <button
                          onClick={() => {
                            setActiveTab?.('home');
                          }}
                          className="text-[10px] font-black bg-slate-900 hover:bg-slate-800 text-amber-300 px-3 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <span>مشاهده و سفارش</span>
                          <ArrowLeft size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}



      {/* Supplier / Factory Exclusive Portal Tab */}
      {activeSubTab === 'supplier' && (
        <div className="space-y-6 bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-3xl border border-slate-200/85 dark:border-slate-800 shadow-sm">
          <MultiVendorPanel
            currentSellerId={currentSellerId || user?.id || ""}
            setCurrentSeller={setCurrentSeller || (() => {})}
            onRefreshProducts={onRefreshProducts || (() => {})}
            onTriggerZarinpalPayment={() => {}}
            b2bConfig={b2bConfig}
            onUpdateB2bConfig={onUpdateB2bConfig || (() => {})}
          />
        </div>
      )}

      {/* Representative (Exclusive Agency) Tab */}
      {activeSubTab === 'representative' && (
        <div className="space-y-6">
          {/* Representative Header Card */}
          <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-amber-900 text-white rounded-3xl p-6 sm:p-8 border border-amber-500/30 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 relative z-10">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black text-3xl shrink-0 shadow-lg shadow-amber-500/20">
                  <Award size={32} />
                </div>
                <div className="space-y-1 text-right">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-lg sm:text-xl font-black text-white">{user?.name || "نماینده محترم استانی"}</h2>
                    <span className="px-3 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[11px] font-black">
                      نمایندگی انحصاری فعال B2B
                    </span>
                  </div>
                  <p className="text-xs text-amber-200/90 font-bold">
                    حوزه فعالیت: {user?.city ? `استان و شهرستان ${user.city}` : "سراسر کشور"} | کد عاملیت: <span className="font-mono text-amber-300">REP-{(user?.phone || "0912").slice(-4)}</span>
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                <button
                  onClick={() => setShowCertificateModal(true)}
                  className="flex-1 sm:flex-initial bg-amber-400 hover:bg-amber-500 text-slate-950 px-5 py-3 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-400/20 cursor-pointer active:scale-95"
                >
                  <Award size={16} />
                  <span>مشاهده و دانلود حکم رسمی نمایندگی (PDF)</span>
                </button>
                <button
                  onClick={() => setActiveTab('order')}
                  className="flex-1 sm:flex-initial bg-white/10 hover:bg-white/20 text-white border border-white/20 px-5 py-3 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ShoppingBag size={16} />
                  <span>ثبت سفارش سهمیه کارخانه</span>
                </button>
              </div>
            </div>

            {/* Representative Key Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mt-6 pt-6 border-t border-white/10 text-right">
              <div className="bg-white/5 backdrop-blur-sm p-3.5 rounded-2xl border border-white/10">
                <span className="text-[10px] text-amber-200/80 font-bold block">سهمیه ماهیانه منطقه:</span>
                <span className="text-base font-black text-white font-mono mt-0.5 block">۲,۵۰۰ کارتن</span>
                <span className="text-[9px] text-emerald-400 font-bold mt-0.5 block">۸۲٪ محقق شده</span>
              </div>

              <div className="bg-white/5 backdrop-blur-sm p-3.5 rounded-2xl border border-white/10">
                <span className="text-[10px] text-amber-200/80 font-bold block">فروشگاه‌های تحت پوشش:</span>
                <span className="text-base font-black text-white font-mono mt-0.5 block">۴۸ بنکداری و مارکت</span>
                <span className="text-[9px] text-amber-300 font-bold mt-0.5 block">+۴ نقطه در این ماه</span>
              </div>

              <div className="bg-white/5 backdrop-blur-sm p-3.5 rounded-2xl border border-white/10">
                <span className="text-[10px] text-amber-200/80 font-bold block">تخفیف انحصاری کارخانه:</span>
                <span className="text-base font-black text-amber-400 font-mono mt-0.5 block">تا ۱۵٪ زیر قیمت عمده</span>
                <span className="text-[9px] text-slate-300 font-bold mt-0.5 block">حاشیه سود تضمینی</span>
              </div>

              <div className="bg-white/5 backdrop-blur-sm p-3.5 rounded-2xl border border-white/10">
                <span className="text-[10px] text-amber-200/80 font-bold block">وضعیت ناوگان و بارگیری:</span>
                <span className="text-base font-black text-emerald-400 mt-0.5 block">ارسال اولویت‌دار VIP</span>
                <span className="text-[9px] text-slate-300 font-bold mt-0.5 block">حمل مستقیم از خط تولید</span>
              </div>
            </div>
          </div>

          {/* Representative Management Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-right">
            {/* Column 1 & 2: Retailer Network & Orders */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <Building className="text-amber-600" size={18} />
                    <span>فروشگاه‌ها و بنکداران تحت پوشش نمایندگی</span>
                  </h3>
                  <span className="text-[11px] font-black bg-amber-50 text-amber-800 px-3 py-1 rounded-full border border-amber-200">
                    ثبت خودکار کمیسیون توزیع
                  </span>
                </div>

                <div className="space-y-3">
                  {[
                    { name: "بنکداری و پخش برادران حسینی", city: user?.city || "مرکز استان", volume: "۳۵۰ کارتن در ماه", status: "فعال و منظم", lastOrder: "۲ روز پیش" },
                    { name: "هایپرمارکت بزرگ میلاد", city: user?.city || "مرکز استان", volume: "۱۸۰ کارتن در ماه", status: "فعال", lastOrder: "هفته گذشته" },
                    { name: "فروشگاه زنجیره‌ای الماس", city: user?.city || "مرکز استان", volume: "۵۲۰ کارتن در ماه", status: "سفارش عمده پالتی", lastOrder: "امروز" },
                    { name: "پخش مواد غذایی نوین", city: user?.city || "حومه استان", volume: "۲۱۰ کارتن در ماه", status: "فعال", lastOrder: "۴ روز پیش" },
                  ].map((store, i) => (
                    <div key={i} className="p-4 bg-slate-50 hover:bg-amber-50/40 rounded-2xl border border-slate-200/70 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          <h4 className="text-xs font-black text-slate-900">{store.name}</h4>
                          <span className="text-[10px] text-slate-400 font-bold">({store.city})</span>
                        </div>
                        <p className="text-[11px] text-slate-500 font-bold">حجم خرید: <strong className="text-slate-800">{store.volume}</strong> | آخرین سفارش: {store.lastOrder}</p>
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                        <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-lg">
                          {store.status}
                        </span>
                        <button
                          onClick={() => setActiveTab('order')}
                          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[10px] font-black transition-all cursor-pointer"
                        >
                          ثبت سفارش برای همکار
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Column 3: Representative Support & Liaison */}
            <div className="space-y-6">
              <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                  <ShieldCheck className="text-emerald-600" size={18} />
                  <span>پشتیبانی اختصاصی امور نمایندگان</span>
                </h3>
                
                <p className="text-xs text-slate-600 font-bold leading-relaxed">
                  مدیر امور نمایندگی‌های کارخانجات دست اول به صورت مستقیم آماده پاسخگویی به درخواست‌های سهمیه و پشتیبانی بار شماست.
                </p>

                <div className="space-y-2.5 bg-amber-50/60 p-4 rounded-2xl border border-amber-200/60 text-xs font-bold">
                  <div className="flex justify-between items-center text-slate-700">
                    <span className="text-slate-500">شماره خط ویژه نمایندگان:</span>
                    <span className="font-mono font-black text-amber-900">{b2bConfig?.adminPhone || "09121234567"}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-700">
                    <span className="text-slate-500">ساعت پاسخگویی:</span>
                    <span className="text-slate-800">۸ صبح الی ۲۰ شب</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-700">
                    <span className="text-slate-500">واحد هماهنگی حمل:</span>
                    <span className="text-emerald-700 font-black">باربری سراسری مسقف</span>
                  </div>
                </div>

                <a
                  href={`tel:${b2bConfig?.adminPhone || "09121234567"}`}
                  className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Phone size={15} />
                  <span>تماس مستقیم با مدیریت نمایندگی‌ها</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Marketer & Affiliate Workstation Tab */}
      {activeSubTab === 'marketer' && (
        <div className="space-y-6">
          {/* Marketer Header */}
          <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 text-white rounded-3xl p-6 sm:p-8 border border-emerald-500/30 shadow-xl relative overflow-hidden text-right">
            <div className="absolute top-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 relative z-10">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-emerald-500 text-white flex items-center justify-center font-black text-3xl shrink-0 shadow-lg shadow-emerald-500/20">
                  <Briefcase size={32} />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-lg sm:text-xl font-black text-white">{user?.name || "ویزیتور / بازاریاب محترم"}</h2>
                    <span className="px-3 py-0.5 rounded-full bg-emerald-400 text-slate-950 text-[11px] font-black">
                      سیستم همکاری در فروش B2B
                    </span>
                  </div>
                  <p className="text-xs text-emerald-200/90 font-bold">
                    کد معرف اختصاصی شما: <span className="font-mono text-amber-300 font-bold">REF-{(user?.phone || "0912").slice(-4)}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full lg:w-auto">
                <button
                  onClick={() => setShowPayoutModal(true)}
                  className="w-full sm:w-auto bg-emerald-400 hover:bg-emerald-500 text-slate-950 px-5 py-3 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-400/20 cursor-pointer active:scale-95"
                >
                  <DollarSign size={16} />
                  <span>درخواست تسویه حساب و واریز نقدی پایا</span>
                </button>
              </div>
            </div>

            {/* Marketer Wallet Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mt-6 pt-6 border-t border-white/10">
              <div className="bg-white/5 backdrop-blur-sm p-3.5 rounded-2xl border border-white/10">
                <span className="text-[10px] text-emerald-200/80 font-bold block">موجودی قابل تسویه:</span>
                <span className="text-base font-black text-amber-300 font-mono mt-0.5 block">۴,۸۵۰,۰۰۰ تومان</span>
                <span className="text-[9px] text-emerald-300 font-bold mt-0.5 block">آماده واریز آنی</span>
              </div>

              <div className="bg-white/5 backdrop-blur-sm p-3.5 rounded-2xl border border-white/10">
                <span className="text-[10px] text-emerald-200/80 font-bold block">کل پورسانت‌های دریافتی:</span>
                <span className="text-base font-black text-white font-mono mt-0.5 block">۲۴,۶۰۰,۰۰۰ تومان</span>
                <span className="text-[9px] text-slate-300 font-bold mt-0.5 block">از ۱۸ سفارش موفق</span>
              </div>

              <div className="bg-white/5 backdrop-blur-sm p-3.5 rounded-2xl border border-white/10">
                <span className="text-[10px] text-emerald-200/80 font-bold block">فروشگاه‌های معرفی‌شده:</span>
                <span className="text-base font-black text-white font-mono mt-0.5 block">۱۴ مشتری فعال</span>
                <span className="text-[9px] text-emerald-400 font-bold mt-0.5 block">پورسانت مادام‌العمر</span>
              </div>

              <div className="bg-white/5 backdrop-blur-sm p-3.5 rounded-2xl border border-white/10">
                <span className="text-[10px] text-emerald-200/80 font-bold block">نرخ پورسانت پایه:</span>
                <span className="text-base font-black text-emerald-400 font-mono mt-0.5 block">۳٪ از فاکتور کل</span>
                <span className="text-[9px] text-slate-300 font-bold mt-0.5 block">+۲٪ پاداش حجم فروش بالا</span>
              </div>
            </div>
          </div>

          {/* Referral Link & Marketing Tools */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-right">
            <div className="lg:col-span-2 space-y-6">
              {/* Unique Link Card */}
              <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                  <Share2 className="text-emerald-600" size={18} />
                  <span>لینک و کد معرف اختصاصی شما جهت ثبت سفارش سوپرمارکت‌ها</span>
                </h3>

                <p className="text-xs text-slate-600 font-bold leading-relaxed">
                  این لینک را برای مغازه‌داران، سوپرمارکت‌ها و بنکداران شهر خود ارسال کنید. هر سفارشی که با این لینک ثبت شود، ۳٪ تا ۵٪ پورسانت مستقیم به حساب شما واریز خواهد شد.
                </p>

                <div className="flex flex-col sm:flex-row items-center gap-2.5 p-3 bg-slate-50 rounded-2xl border border-slate-200">
                  <input
                    type="text"
                    readOnly
                    value={`${window.location.origin}/?ref=${user?.phone || "09121234567"}`}
                    className="w-full bg-white px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono text-slate-700 text-left outline-none font-bold"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/?ref=${user?.phone || "09121234567"}`);
                      setCopiedReferral(true);
                      setTimeout(() => setCopiedReferral(false), 3000);
                    }}
                    className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer shadow-md shadow-emerald-600/10"
                  >
                    {copiedReferral ? <Check size={16} /> : <Copy size={16} />}
                    <span>{copiedReferral ? "کپی شد!" : "کپی لینک معرف"}</span>
                  </button>
                </div>
              </div>

              {/* Commission Matrix */}
              <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                  <Percent className="text-amber-600" size={18} />
                  <span>جدول محاسبه پورسانت و پاداش ویزیتوری</span>
                </h3>

                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                        <th className="p-3">حجم سفارش مشتری</th>
                        <th className="p-3">درصد پورسانت</th>
                        <th className="p-3">میانگین درآمد در هر سفارش</th>
                        <th className="p-3">نحوه تسویه</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-bold text-slate-700">
                      <tr>
                        <td className="p-3">۱۰ الی ۵۰ کارتن (خرده‌عمده)</td>
                        <td className="p-3 text-emerald-600 font-mono font-black">۲.۵ ٪</td>
                        <td className="p-3 font-mono">۴۵۰,۰۰۰ الی ۱,۵۰۰,۰۰۰ تومان</td>
                        <td className="p-3 text-[11px] text-slate-400">پس از تحویل بار</td>
                      </tr>
                      <tr className="bg-emerald-50/30">
                        <td className="p-3">۵۰ الی ۲۰۰ کارتن (بنکداری)</td>
                        <td className="p-3 text-emerald-600 font-mono font-black">۳.۵ ٪</td>
                        <td className="p-3 font-mono">۲,۰۰۰,۰۰۰ الی ۶,۵۰۰,۰۰۰ تومان</td>
                        <td className="p-3 text-[11px] text-emerald-700">واریز روزانه پایا</td>
                      </tr>
                      <tr>
                        <td className="p-3">بیش از ۲۰۰ کارتن / پالتی مستقیم</td>
                        <td className="p-3 text-amber-600 font-mono font-black">۵.۰ ٪</td>
                        <td className="p-3 font-mono">۱۰,۰۰۰,۰۰۰+ تومان</td>
                        <td className="p-3 text-[11px] text-amber-700">آنی با تایید فاکتور</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Fast Visit Recording Tool */}
            <div className="space-y-6">
              <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                  <Target className="text-emerald-600" size={18} />
                  <span>ثبت ویزیت حضوری مغازه جدید</span>
                </h3>

                <p className="text-xs text-slate-500 font-bold">
                  اطلاعات سوپرمارکتی که ویزیت کرده‌اید را ثبت کنید تا سیستم خودکار به نام شما پیگیری کند:
                </p>

                <div className="space-y-3 text-xs font-bold">
                  <input
                    type="text"
                    placeholder="نام سوپرمارکت یا فروشگاه..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                  />
                  <input
                    type="tel"
                    placeholder="شماره همراه مغازه‌دار..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-mono text-left"
                  />
                  <textarea
                    rows={2}
                    placeholder="اقلام مورد نیاز (مثلا: بیسکویت، کیک و شکلات)..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none resize-none"
                  />
                  <button
                    onClick={() => alert("✅ ویزیت جدید با موفقیت در کارتابل بازاریابی شما ثبت گردید.")}
                    className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-black text-xs transition-all cursor-pointer shadow-md"
                  >
                    ثبت ویزیت در سیستم
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payout / Settlement Modal for Marketers */}
      <AnimatePresence>
        {showPayoutModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-6 max-w-md w-full border border-slate-200 space-y-4 shadow-2xl text-right"
              dir="rtl"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <DollarSign className="text-emerald-600" size={20} />
                  <span>درخواست تسویه و واریز پورسانت بازاریابی</span>
                </h3>
                <button onClick={() => setShowPayoutModal(false)} className="p-1 text-slate-400 hover:text-slate-700">
                  <X size={18} />
                </button>
              </div>

              {settlementSuccess ? (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-black flex items-center gap-2">
                  <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                  <span>{settlementSuccess}</span>
                </div>
              ) : (
                <div className="space-y-4 text-xs font-bold text-slate-700">
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 flex justify-between items-center">
                    <span className="text-slate-500">موجودی در دسترس جهت تسویه:</span>
                    <span className="font-mono font-black text-emerald-700 text-sm">۴,۸۵۰,۰۰۰ تومان</span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-slate-800">مبلغ درخواستی (تومان):</label>
                    <input
                      type="number"
                      placeholder="مثلا: ۴۸۵۰۰۰۰"
                      value={settlementAmount}
                      onChange={e => setSettlementAmount(e.target.value)}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-left font-bold outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-slate-800">شماره شبای بانکی (با IR):</label>
                    <input
                      type="text"
                      value={ibanNumber}
                      onChange={e => setIbanNumber(e.target.value)}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-left font-bold outline-none"
                    />
                  </div>

                  <button
                    onClick={() => {
                      if (!settlementAmount) {
                        alert("لطفا مبلغ مورد نظر را وارد نمایید.");
                        return;
                      }
                      setSettlementSuccess("درخواست تسویه با موفقیت ثبت شد. مبلغ حداکثر ظرف ۲۴ ساعت از طریق چرخه پایا به شماره شبای شما واریز خواهد شد.");
                      setTimeout(() => {
                        setSettlementSuccess(null);
                        setShowPayoutModal(false);
                      }, 3500);
                    }}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
                  >
                    تایید و ثبت نهایی درخواست تسویه
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Official Certificate Modal for Representative */}
      {showCertificateModal && (
        <RepresentativeCertificateView
          repName={user?.name || "همکار گرامی"}
          companyName={user?.company || "نمایندگی رسمی پخش استانی"}
          city={user?.city || "مرکز استان"}
          agencyCode={`REP-${(user?.phone || "0912").slice(-4)}`}
          badge={user?.badge || "نماینده انحصاری توزیع"}
          onClose={() => setShowCertificateModal(false)}
          b2bConfig={b2bConfig}
        />
      )}

      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-50/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-6 max-w-md w-full border border-slate-200 space-y-4 shadow-2xl text-right"
            >
              <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center text-xl">
                ⚠️
              </div>
              <h3 className="text-base font-black text-slate-900">آیا از حذف کامل حساب کاربری اطمینان دارید؟</h3>
              <p className="text-xs text-slate-500 font-bold leading-relaxed">
                با تایید این گزینه، تمام اطلاعات حساب کاربری و سوابق شما از حافظه دستگاه پاک خواهد شد و این عمل غیرقابل بازگشت است.
              </p>
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={handleDeleteAccount}
                  className="flex-1 bg-rose-600 hover text-white font-black py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
                >
                  بله، حذف حساب
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-5 py-2.5 bg-slate-100 hover text-slate-700 font-black rounded-xl text-xs transition-colors cursor-pointer"
                >
                  انصراف
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
    </>
  );
}
