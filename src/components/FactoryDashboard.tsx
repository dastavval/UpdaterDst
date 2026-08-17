import React, { useState, useEffect, useMemo } from "react";
import { 
  Building2, 
  Package, 
  Plus, 
  Truck, 
  Layers, 
  DollarSign, 
  TrendingUp, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ShieldCheck, 
  LogOut, 
  FileSpreadsheet, 
  RefreshCw, 
  Search, 
  Edit3, 
  Trash2, 
  Eye, 
  ChevronRight, 
  BarChart3, 
  SlidersHorizontal,
  Award,
  Zap,
  Phone,
  Mail,
  MapPin,
  FilePlus2,
  Check,
  X,
  UserCheck
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Product, Order, SupplyChainStage } from "../types";
import { db, auth } from "../lib/firebase";
import { collection, getDocs, addDoc, updateDoc, doc, query, where, serverTimestamp, setDoc } from "../lib/firebase-mock";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "../lib/firebase-mock";

interface FactoryDashboardProps {
  currentSellerId: string;
  setCurrentSeller: (id: string, name: string) => void;
  products: Product[];
  onRefreshProducts: () => void;
  b2bConfig?: any;
  onUpdateB2bConfig?: (updated: any) => void;
}

export default function FactoryDashboard({
  currentSellerId,
  setCurrentSeller,
  products: globalProducts,
  onRefreshProducts,
  b2bConfig,
  onUpdateB2bConfig
}: FactoryDashboardProps) {
  // Tabs for Factory Dashboard
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'new_product' | 'orders' | 'settings'>('overview');

  // Authentication State
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem("dastavval_seller_logged") === "true";
  });
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Form states for login / register
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [regRepName, setRegRepName] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regFactoryName, setRegFactoryName] = useState("");
  const [regCategory, setRegCategory] = useState("تنقلات و شکلات");
  const [regCity, setRegCity] = useState("شبستر - شهرک صنعتی شندآباد");

  // Factory profile stored in storage
  const [sellerProfile, setSellerProfile] = useState<{
    id: string;
    name: string;
    email: string;
    representative: string;
    phone?: string;
    city?: string;
    badge?: string;
  } | null>(() => {
    try {
      const saved = localStorage.getItem("dastavval_seller_profile");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Local data states
  const [factoryProducts, setFactoryProducts] = useState<Product[]>([]);
  const [factoryOrders, setFactoryOrders] = useState<Order[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // Product Add / Edit form
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [prodName, setProdName] = useState("");
  const [prodBrand, setProdBrand] = useState("");
  const [prodCategory, setProdCategory] = useState("تنقلات و شکلات");
  const [prodBulkPrice, setProdBulkPrice] = useState<number | "">(120000);
  const [prodConsumerPrice, setProdConsumerPrice] = useState<number | "">(165000);
  const [prodCartonPack, setProdCartonPack] = useState<number>(24);
  const [prodMinOrder, setProdMinOrder] = useState<number>(5);
  const [prodStock, setProdStock] = useState<number>(100);
  const [prodUnit, setProdUnit] = useState("بسته");
  const [prodLeadTime, setProdLeadTime] = useState<number>(3);
  const [prodImageUrl, setProdImageUrl] = useState("");
  const [prodOrigin, setProdOrigin] = useState("");
  const [prodDescription, setProdDescription] = useState("");
  const [generatingAiDesc, setGeneratingAiDesc] = useState(false);
  const [savingProduct, setSavingProduct] = useState(false);
  const [productSuccess, setProductSuccess] = useState<string | null>(null);
  const [productSearch, setProductSearch] = useState("");

  // Filter products for this specific factory
  const currentFactoryName = sellerProfile?.name || "صنایع غذایی";
  
  const myProducts = useMemo(() => {
    if (!sellerProfile) return [];
    return globalProducts.filter(p => {
      const pSeller = (p.sellerId || "").toLowerCase();
      const pBrand = (p.brand || "").toLowerCase();
      const sId = (sellerProfile.id || "").toLowerCase();
      const sName = (sellerProfile.name || "").toLowerCase();
      return pSeller === sId || pBrand.includes(sName) || sName.includes(pBrand);
    });
  }, [globalProducts, sellerProfile]);

  // Load Factory Orders
  useEffect(() => {
    if (isLoggedIn && sellerProfile) {
      loadFactoryOrders();
    }
  }, [isLoggedIn, sellerProfile]);

  const loadFactoryOrders = async () => {
    setLoadingData(true);
    try {
      const q = query(collection(db, "orders"));
      const snap = await getDocs(q);
      const allOrders = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Order[];
      
      const sName = (sellerProfile?.name || "").toLowerCase();
      const sId = (sellerProfile?.id || "").toLowerCase();

      const matchedOrders = allOrders.filter(ord => {
        if (ord.sellerId === sId) return true;
        if (ord.items && Array.isArray(ord.items)) {
          return ord.items.some((it: any) => {
            const itBrand = (it.brand || it.factoryName || "").toLowerCase();
            return sName && (itBrand.includes(sName) || sName.includes(itBrand));
          });
        }
        return false;
      });

      setFactoryOrders(matchedOrders.length > 0 ? matchedOrders : allOrders.slice(0, 8));
    } catch (e) {
      console.warn("Error loading factory orders:", e);
    } finally {
      setLoadingData(false);
    }
  };

  // Sync profile values when editing
  const handleStartEdit = (prod: Product) => {
    setEditingProduct(prod);
    setProdName(prod.name);
    setProdBrand(prod.brand || sellerProfile?.name || "");
    setProdCategory(prod.category || "تنقلات و شکلات");
    setProdBulkPrice(prod.bulk_price);
    setProdConsumerPrice(prod.consumer_price || Math.round(prod.bulk_price * 1.3));
    setProdCartonPack(prod.carton_pack_count || 24);
    setProdMinOrder(prod.min_order_cartons || 5);
    setProdStock(prod.stock_quantity_cartons || 50);
    setProdUnit(prod.unit || "بسته");
    setProdLeadTime(prod.production_lead_time_days || 3);
    setProdImageUrl(prod.image_url || "");
    setProdOrigin(prod.shipping_origin || sellerProfile?.city || "");
    setProdDescription(prod.description || prod.pack_description || "");
    setActiveTab('new_product');
  };

  const handleResetForm = () => {
    setEditingProduct(null);
    setProdName("");
    setProdBrand(sellerProfile?.name || "");
    setProdCategory("تنقلات و شکلات");
    setProdBulkPrice(120000);
    setProdConsumerPrice(165000);
    setProdCartonPack(24);
    setProdMinOrder(5);
    setProdStock(100);
    setProdUnit("بسته");
    setProdLeadTime(3);
    setProdImageUrl("");
    setProdOrigin(sellerProfile?.city || "شبستر");
    setProdDescription("");
    setProductSuccess(null);
  };

  // Sign In Handler
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);

    try {
      const profile = {
        id: `factory_${loginEmail.replace(/[^a-zA-Z0-9]/g, '_')}`,
        name: loginEmail.includes('behrouz') ? 'صنایع غذایی بهروز' :
              loginEmail.includes('cheetoz') ? 'صنایع غذایی چی‌توز' :
              loginEmail.includes('nazari') ? 'کیک و بیسکویت نظری' :
              'کارخانه تولیدی همکار دست اول',
        email: loginEmail,
        representative: "مدیر بازرگانی و فروش",
        city: "منطقه صنعتی البرز",
        badge: "gold"
      };

      localStorage.setItem("dastavval_seller_logged", "true");
      localStorage.setItem("dastavval_seller_profile", JSON.stringify(profile));
      setSellerProfile(profile);
      setIsLoggedIn(true);
      setCurrentSeller(profile.id, profile.name);
    } catch (err: any) {
      setAuthError("خطا در ورود: " + err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  // Register Factory Handler
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regFactoryName || !regPhone || !regEmail) {
      setAuthError("لطفا اطلاعات الزامی را تکمیل کنید.");
      return;
    }
    setAuthLoading(true);
    setAuthError(null);

    try {
      const factoryId = `factory_${Date.now()}`;
      const profile = {
        id: factoryId,
        name: regFactoryName,
        email: regEmail,
        representative: regRepName || "مدیریت بازرگانی",
        phone: regPhone,
        city: regCity,
        badge: "standard"
      };

      await setDoc(doc(db, "sellers", factoryId), {
        ...profile,
        category: regCategory,
        createdAt: serverTimestamp()
      });

      localStorage.setItem("dastavval_seller_logged", "true");
      localStorage.setItem("dastavval_seller_profile", JSON.stringify(profile));
      setSellerProfile(profile);
      setIsLoggedIn(true);
      setCurrentSeller(factoryId, regFactoryName);
    } catch (err: any) {
      setAuthError("خطا در ایجاد پرتال کارخانه: " + err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("dastavval_seller_logged");
    localStorage.removeItem("dastavval_seller_profile");
    setIsLoggedIn(false);
    setSellerProfile(null);
  };

  // Save or Update Product
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName.trim() || !prodBulkPrice) {
      alert("لطفا نام کالا و قیمت عمده را وارد کنید.");
      return;
    }
    setSavingProduct(true);
    setProductSuccess(null);

    try {
      const productPayload = {
        name: prodName.trim(),
        brand: prodBrand.trim() || sellerProfile?.name || "کارخانه همکار",
        category: prodCategory,
        bulk_price: Number(prodBulkPrice),
        consumer_price: Number(prodConsumerPrice) || Math.round(Number(prodBulkPrice) * 1.3),
        carton_pack_count: Number(prodCartonPack) || 24,
        min_order_cartons: Number(prodMinOrder) || 1,
        stock_quantity_cartons: Number(prodStock) || 0,
        unit: prodUnit || "بسته",
        production_lead_time_days: Number(prodLeadTime) || 3,
        image_url: prodImageUrl || "https://images.unsplash.com/photo-1581798459219-318e76aecc7b?auto=format&fit=crop&q=80&w=400",
        shipping_origin: prodOrigin || sellerProfile?.city || "ارسال مستقیم درب کارخانه",
        description: prodDescription,
        pack_description: `${prodCartonPack} ${prodUnit} در کارتن محکم صادراتی`,
        sellerId: sellerProfile?.id,
        sellerName: sellerProfile?.name
      };

      if (editingProduct?.id) {
        await updateDoc(doc(db, "products", editingProduct.id), productPayload);
        setProductSuccess("اطلاعات کالا با موفقیت بروزرسانی شد.");
      } else {
        await addDoc(collection(db, "products"), {
          ...productPayload,
          createdAt: serverTimestamp()
        });
        setProductSuccess("محصول جدید با موفقیت به کاتالوگ کارخانه اضافه و منتشر گردید.");
      }

      onRefreshProducts();
      setTimeout(() => {
        handleResetForm();
        setActiveTab('products');
      }, 1500);
    } catch (err: any) {
      alert("خطا در ثبت کالا: " + err.message);
    } finally {
      setSavingProduct(false);
    }
  };

  // Fast AI Generator for Catalog Description
  const handleGenerateAiDesc = async () => {
    if (!prodName) {
      alert("لطفا ابتدا نام محصول را مشخص کنید.");
      return;
    }
    setGeneratingAiDesc(true);
    try {
      const res = await fetch("/api/ai/describe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productName: prodName, category: prodCategory })
      });
      const data = await res.json();
      if (data.description) {
        setProdDescription(data.description);
      }
    } catch {
      setProdDescription(`تولیدشده با مرغوب‌ترین مواد اولیه صنعتی، دارای نشان استاندارد ملی و سیب سلامت. بسته‌بندی ویژه کارتن‌های مقاوم جهت ترانزیت جاده‌ای و پخش مویرگی بنکداری سراسر کشور.`);
    } finally {
      setGeneratingAiDesc(false);
    }
  };

  // Stock quick adjustment
  const handleQuickStockChange = async (prodId: string, currentVal: number, delta: number) => {
    const newVal = Math.max(0, currentVal + delta);
    try {
      await updateDoc(doc(db, "products", prodId), { stock_quantity_cartons: newVal });
      onRefreshProducts();
    } catch (e) {
      console.warn("Stock update error:", e);
    }
  };

  // Supply Chain Order Stage
  const handleUpdateOrderStatus = async (orderId: string, stage: SupplyChainStage) => {
    try {
      await updateDoc(doc(db, "orders", orderId), { status: stage });
      loadFactoryOrders();
      alert("مرحله لجستیک و تولید سفارش بروزرسانی شد.");
    } catch (e) {
      console.warn(e);
    }
  };

  // Filtered Products for Table
  const filteredMyProducts = useMemo(() => {
    if (!productSearch.trim()) return myProducts;
    const q = productSearch.toLowerCase();
    return myProducts.filter(p => p.name.toLowerCase().includes(q) || (p.category && p.category.toLowerCase().includes(q)));
  }, [myProducts, productSearch]);

  // Overview Stats
  const totalStockCartons = myProducts.reduce((acc, p) => acc + (p.stock_quantity_cartons || 0), 0);
  const totalFactoryRevenue = factoryOrders.reduce((acc, o) => acc + (o.totalAmount || 0), 0);

  // If not logged in, render clean corporate login
  if (!isLoggedIn) {
    return (
      <div className="max-w-4xl mx-auto bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden text-right" dir="rtl">
        <div className="grid grid-cols-1 md:grid-cols-12">
          {/* Brand Info Banner */}
          <div className="md:col-span-5 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-8 text-white flex flex-col justify-between relative overflow-hidden">
            <div className="space-y-6 relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
                  <Building2 size={24} />
                </div>
                <div>
                  <h3 className="font-black text-lg text-white">پرتال صنایع و کارخانجات</h3>
                  <p className="text-[10px] text-indigo-300 font-bold">زیرساخت عرضه مستقیم و فروش عمده</p>
                </div>
              </div>

              <div className="space-y-3">
                <h2 className="text-xl font-black leading-snug">ارتباط مستقیم خط تولید با ۵۰,۰۰۰ بنکدار و خریدار کلان</h2>
                <p className="text-xs text-slate-300 leading-relaxed font-medium">
                  با عضویت در پرتال کارخانجات بازرگانی دست اول، محصولات خود را به قیمت درب کارخانه بدون واسطه به سراسر کشور عرضه نمایید.
                </p>
              </div>

              <div className="space-y-2.5 pt-4 border-t border-white/10 text-xs font-bold text-slate-200">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                  <span>تضمین تسویه نقدی پایا و چک‌های صیادی معتبر</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                  <span>مدیریت هوشمند موجودی انبار کارخانه و کارتن</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                  <span>پنل رهگیری بارگیری و خروج ترانزیت جاده‌ای</span>
                </div>
              </div>
            </div>

            <div className="mt-8 text-[11px] text-slate-400 border-t border-white/10 pt-4">
              سامانه یکپارچه تامین کالا دست اول | پشتیبانی کارخانجات: ۰۹۰۴۴۵۰۲۹۰۰
            </div>
          </div>

          {/* Form Side */}
          <div className="md:col-span-7 p-6 sm:p-8 flex flex-col justify-between">
            <div>
              <div className="flex bg-slate-100 p-1 rounded-2xl mb-6">
                <button
                  type="button"
                  onClick={() => setAuthMode('login')}
                  className={`flex-1 py-2.5 rounded-xl font-black text-xs transition-all cursor-pointer ${
                    authMode === 'login' ? "bg-white text-indigo-900 shadow-sm" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  ورود مدیران کارخانه
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMode('register')}
                  className={`flex-1 py-2.5 rounded-xl font-black text-xs transition-all cursor-pointer ${
                    authMode === 'register' ? "bg-white text-indigo-900 shadow-sm" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  ثبت‌نام کارخانه جدید
                </button>
              </div>

              {authError && (
                <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-black rounded-xl">
                  {authError}
                </div>
              )}

              {authMode === 'login' ? (
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div>
                    <label className="block text-xs font-black text-slate-700 mb-1.5">ایمیل یا شناسه پرتال کارخانه:</label>
                    <div className="relative">
                      <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="email"
                        required
                        value={loginEmail}
                        onChange={e => setLoginEmail(e.target.value)}
                        placeholder="factory@brand.com"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 outline-none focus:border-indigo-600 focus:bg-white text-left font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-700 mb-1.5">رمز عبور امنیتی:</label>
                    <input
                      type="password"
                      required
                      value={loginPassword}
                      onChange={e => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 outline-none focus:border-indigo-600 focus:bg-white text-left font-mono"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-black text-xs py-3 rounded-xl shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
                  >
                    {authLoading ? <RefreshCw size={14} className="animate-spin" /> : <UserCheck size={16} />}
                    <span>ورود به کارتابل صنعتی کارخانه</span>
                  </button>
                </form>
              ) : (
                <form onSubmit={handleRegister} className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-black text-slate-700 mb-1">نام رسمی واحد تولیدی یا برند:</label>
                    <input
                      type="text"
                      required
                      value={regFactoryName}
                      onChange={e => setRegFactoryName(e.target.value)}
                      placeholder="مثال: صنایع غذایی شندآباد شبستر"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-800 outline-none focus:border-indigo-600 focus:bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-black text-slate-700 mb-1">نام مدیر فروش:</label>
                      <input
                        type="text"
                        required
                        value={regRepName}
                        onChange={e => setRegRepName(e.target.value)}
                        placeholder="نام و نام خانوادگی"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-800 outline-none focus:border-indigo-600 focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-black text-slate-700 mb-1">تلفن همراه مسئول:</label>
                      <input
                        type="tel"
                        required
                        value={regPhone}
                        onChange={e => setRegPhone(e.target.value)}
                        placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-800 outline-none focus:border-indigo-600 focus:bg-white font-mono text-left"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-black text-slate-700 mb-1">ایمیل کارخانه:</label>
                      <input
                        type="email"
                        required
                        value={regEmail}
                        onChange={e => setRegEmail(e.target.value)}
                        placeholder="info@factory.com"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-800 outline-none focus:border-indigo-600 focus:bg-white font-mono text-left"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-black text-slate-700 mb-1">رمز عبور پرتال:</label>
                      <input
                        type="password"
                        required
                        value={regPassword}
                        onChange={e => setRegPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-800 outline-none focus:border-indigo-600 focus:bg-white font-mono text-left"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black text-xs py-3 rounded-xl shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
                  >
                    {authLoading ? <RefreshCw size={14} className="animate-spin" /> : <Building2 size={16} />}
                    <span>تاسیس پرتال و شروع همکاری کارخانه</span>
                  </button>
                </form>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 text-center">
              <span className="text-[11px] text-slate-500 font-bold">
                حساب تستی سریع: جهت ورود آزمایشی هر ایمیلی را وارد فرمایید.
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Active Factory Dashboard
  return (
    <div className="space-y-6 text-right font-sans" dir="rtl">
      {/* Top Factory Header Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden border border-indigo-500/20">
        <div className="absolute top-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-indigo-600/30 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shadow-inner shrink-0">
              <Building2 size={32} />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-black text-white">{sellerProfile?.name || "کارخانه همکار"}</h1>
                <span className="bg-amber-400 text-slate-950 font-black text-[10px] px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <Award size={12} />
                  <span>تامین‌کننده تاییدشده</span>
                </span>
              </div>
              <p className="text-xs text-indigo-200/80 font-bold">
                نماینده مسئول: {sellerProfile?.representative || "مدیریت"} | موقعیت انبار: {sellerProfile?.city || "شبستر"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <button
              onClick={() => {
                handleResetForm();
                setActiveTab('new_product');
              }}
              className="flex-1 md:flex-initial bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus size={16} />
              <span>افزودن کالای جدید</span>
            </button>
            <button
              onClick={handleLogout}
              className="bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
            >
              <LogOut size={15} />
              <span>خروج</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 mt-8 pt-4 border-t border-white/10 overflow-x-auto custom-scrollbar">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'overview' ? "bg-white text-slate-900 shadow-md" : "text-white/80 hover:text-white"
            }`}
          >
            <BarChart3 size={15} />
            <span>آمار و شاخص‌های کارخانه</span>
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'products' ? "bg-white text-slate-900 shadow-md" : "text-white/80 hover:text-white"
            }`}
          >
            <Package size={15} />
            <span>مدیریت محصولات و انبار ({myProducts.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'orders' ? "bg-white text-slate-900 shadow-md" : "text-white/80 hover:text-white"
            }`}
          >
            <Truck size={15} />
            <span>سفارشات عمده و بارگیری ({factoryOrders.length})</span>
          </button>
          <button
            onClick={() => {
              handleResetForm();
              setActiveTab('new_product');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'new_product' ? "bg-emerald-400 text-slate-950 shadow-md" : "text-emerald-300 hover:text-white"
            }`}
          >
            <FilePlus2 size={15} />
            <span>{editingProduct ? "ویرایش کالا" : "ثبت محصول در خط توزیع"}</span>
          </button>
        </div>
      </div>

      {/* TAB 1: OVERVIEW & METRICS */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-bold">تعداد کالاهای فعال</span>
                <Package size={18} className="text-indigo-600" />
              </div>
              <div className="text-2xl font-black text-slate-900">{myProducts.length} <span className="text-xs text-slate-500 font-bold">قلم کالا</span></div>
              <p className="text-[10px] text-emerald-600 font-bold">منتشر شده در کاتالوگ کشوری</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-bold">موجودی آماده انبار</span>
                <Layers size={18} className="text-amber-500" />
              </div>
              <div className="text-2xl font-black text-slate-900">{totalStockCartons.toLocaleString()} <span className="text-xs text-slate-500 font-bold">کارتن</span></div>
              <p className="text-[10px] text-slate-500 font-bold">پلمپ و آماده بارگیری فوری</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-bold">سفارشات دریافتی</span>
                <Truck size={18} className="text-emerald-600" />
              </div>
              <div className="text-2xl font-black text-slate-900">{factoryOrders.length} <span className="text-xs text-slate-500 font-bold">حواله خرید</span></div>
              <p className="text-[10px] text-indigo-600 font-bold">صادره توسط خریداران کلان</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-bold">گردش مالی تخمینی</span>
                <DollarSign size={18} className="text-purple-600" />
              </div>
              <div className="text-xl font-black text-slate-900">{totalFactoryRevenue.toLocaleString()} <span className="text-xs text-slate-500 font-bold">تومان</span></div>
              <p className="text-[10px] text-purple-600 font-bold">تسویه با تضمین بازرگانی دست اول</p>
            </div>
          </div>

          {/* 📊 تعرفه خدمات و پورسانت دست اول */}
          <div className="bg-emerald-50/60 border border-emerald-100 rounded-2xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-right">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <h4 className="font-black text-xs sm:text-sm text-slate-800">کمیسیون و پورسانت خدمات پلتفرم «دست اول»</h4>
              </div>
              <p className="text-[10px] text-slate-500 font-bold max-w-xl leading-relaxed">
                پورسانت مصوب خدمات بنکداری، بازاریابی و تضمین پرداخت‌های امانی برای محصولات تولیدی شما برابر با <strong className="text-emerald-700">{b2bConfig?.commissionRate || 5}٪</strong> می‌باشد که در محاسبات تسویه حساب منظور خواهد گردید.
              </p>
            </div>
            <div className="bg-white border border-emerald-200/60 rounded-xl px-4 py-2 text-center shadow-2xs shrink-0 self-stretch sm:self-auto flex sm:flex-col justify-between sm:justify-center items-center">
              <span className="text-[9px] text-slate-400 font-bold">میزان پورسانت دست اول:</span>
              <span className="text-sm font-black text-emerald-600">% {b2bConfig?.commissionRate || 5}</span>
            </div>
          </div>

          {/* Quick Action Panel */}
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 p-6 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md">
                <Sparkles size={24} />
              </div>
              <div>
                <h3 className="font-black text-slate-900 text-sm">ارسال مستقیم بار به باربری سراسری انبار شبستر</h3>
                <p className="text-xs text-slate-600 font-medium mt-0.5">
                  کارخانجات طرف قرارداد می‌توانند بارهای عمده را مستقیماً به انبار مرکزی تحویل داده تا توسط ناوگان ترانزیت دست اول در سراسر کشور توزیع گردد.
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('new_product')}
              className="bg-emerald-700 hover:bg-emerald-800 text-white px-5 py-2.5 rounded-xl font-black text-xs transition-all shadow-md shrink-0 cursor-pointer"
            >
              افزودن محصول به کاتالوگ
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: PRODUCTS MANAGEMENT */}
      {activeTab === 'products' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                <Package size={18} className="text-indigo-600" />
                <span>لیست محصولات و مدیریت موجودی کارخانه</span>
              </h3>
              <p className="text-xs text-slate-400 font-bold mt-0.5">کنترل قیمت عمده، حاشیه سود و موجودی کارتن‌ها</p>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search size={14} className="absolute right-3 top-3 text-slate-400" />
                <input
                  type="text"
                  value={productSearch}
                  onChange={e => setProductSearch(e.target.value)}
                  placeholder="جستجوی نام کالا..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-9 pl-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-indigo-600 focus:bg-white"
                />
              </div>
              <button
                onClick={() => {
                  handleResetForm();
                  setActiveTab('new_product');
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1 shrink-0 cursor-pointer"
              >
                <Plus size={14} />
                <span>کالای جدید</span>
              </button>
            </div>
          </div>

          {filteredMyProducts.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-3">
              <Package size={36} className="mx-auto text-slate-400" />
              <p className="text-xs font-bold text-slate-600">هنوز محصولی برای این کارخانه ثبت نشده یا با جستجو منطبق نیست.</p>
              <button
                onClick={() => {
                  handleResetForm();
                  setActiveTab('new_product');
                }}
                className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-black"
              >
                اولین محصول کارخانه را معرفی کنید
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-[11px] font-black text-slate-500 bg-slate-50">
                    <th className="p-3">کالا و مشخصات</th>
                    <th className="p-3">قیمت عمده کارخانه</th>
                    <th className="p-3">قیمت مصرف‌کننده</th>
                    <th className="p-3 text-center">بسته‌بندی</th>
                    <th className="p-3 text-center">موجودی کارتن</th>
                    <th className="p-3 text-center">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-bold text-slate-800">
                  {filteredMyProducts.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={p.image_url || "https://images.unsplash.com/photo-1581798459219-318e76aecc7b?auto=format&fit=crop&q=80&w=100"}
                            alt={p.name}
                            className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0"
                          />
                          <div>
                            <div className="font-black text-slate-900">{p.name}</div>
                            <div className="text-[10px] text-slate-400">{p.category} | حداقل: {p.min_order_cartons || 1} کارتن</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 font-mono font-black text-emerald-700">
                        {p.bulk_price.toLocaleString()} تومان
                      </td>
                      <td className="p-3 font-mono text-slate-500">
                        {(p.consumer_price || Math.round(p.bulk_price * 1.3)).toLocaleString()} تومان
                      </td>
                      <td className="p-3 text-center">
                        <span className="bg-slate-100 px-2 py-0.5 rounded-md text-[10px] font-bold">
                          {p.carton_pack_count} {p.unit || 'بسته'}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleQuickStockChange(p.id, p.stock_quantity_cartons || 0, -10)}
                            className="w-6 h-6 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-md font-black text-[10px] flex items-center justify-center cursor-pointer"
                          >
                            -۱۰
                          </button>
                          <span className="font-mono font-black px-2 py-1 bg-slate-50 rounded-md text-xs min-w-12 text-center">
                            {p.stock_quantity_cartons || 0}
                          </span>
                          <button
                            onClick={() => handleQuickStockChange(p.id, p.stock_quantity_cartons || 0, 10)}
                            className="w-6 h-6 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-md font-black text-[10px] flex items-center justify-center cursor-pointer"
                          >
                            +۱۰
                          </button>
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => handleStartEdit(p)}
                          className="p-1.5 bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-700 rounded-lg transition-colors cursor-pointer"
                          title="ویرایش مشخصات"
                        >
                          <Edit3 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: ADD OR EDIT PRODUCT */}
      {activeTab === 'new_product' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                <FilePlus2 size={18} className="text-emerald-600" />
                <span>{editingProduct ? `ویرایش محصول: ${editingProduct.name}` : "معرفی محصول جدید در خط توزیع"}</span>
              </h3>
              <p className="text-xs text-slate-400 font-bold mt-0.5">اطلاعات کارتن، قیمت‌گذاری همکاری و تصاویر کالا</p>
            </div>
            {editingProduct && (
              <button
                onClick={handleResetForm}
                className="text-xs font-black text-slate-500 hover:text-slate-800 bg-slate-100 px-3 py-1.5 rounded-xl cursor-pointer"
              >
                لغو ویرایش و ثبت کالای جدید
              </button>
            )}
          </div>

          {productSuccess && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-xs font-black flex items-center gap-2">
              <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
              <span>{productSuccess}</span>
            </div>
          )}

          <form onSubmit={handleSaveProduct} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1.5">نام رسمی کالا:</label>
                <input
                  type="text"
                  required
                  value={prodName}
                  onChange={e => setProdName(e.target.value)}
                  placeholder="مثال: کیک پذیرایی لایه‌ای کاکائویی"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 outline-none focus:border-indigo-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 mb-1.5">برند تولیدی:</label>
                <input
                  type="text"
                  required
                  value={prodBrand}
                  onChange={e => setProdBrand(e.target.value)}
                  placeholder={sellerProfile?.name || "نام برند"}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 outline-none focus:border-indigo-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 mb-1.5">دسته‌بندی کالا:</label>
                <select
                  value={prodCategory}
                  onChange={e => setProdCategory(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 outline-none focus:border-indigo-600 focus:bg-white cursor-pointer"
                >
                  <option value="تنقلات و شکلات">تنقلات و شکلات</option>
                  <option value="کیک، بیسکویت و کلوچه">کیک، بیسکویت و کلوچه</option>
                  <option value="نوشیدنی و آبمیوه">نوشیدنی و آبمیوه</option>
                  <option value="کنسروجات و ترشیجات">کنسروجات و ترشیجات</option>
                  <option value="روغن و چاشنی">روغن و چاشنی</option>
                  <option value="شوینده و بهداشتی">شوینده و بهداشتی</option>
                  <option value="خشکبار و حبوبات">خشکبار و حبوبات</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1.5">قیمت عمده هر بسته (تومان):</label>
                <input
                  type="number"
                  required
                  value={prodBulkPrice}
                  onChange={e => setProdBulkPrice(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 outline-none focus:border-indigo-600 focus:bg-white font-mono text-left"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 mb-1.5">قیمت مصرف‌کننده روی جلد (تومان):</label>
                <input
                  type="number"
                  value={prodConsumerPrice}
                  onChange={e => setProdConsumerPrice(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 outline-none focus:border-indigo-600 focus:bg-white font-mono text-left"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 mb-1.5">تعداد در هر کارتن:</label>
                <input
                  type="number"
                  required
                  value={prodCartonPack}
                  onChange={e => setProdCartonPack(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 outline-none focus:border-indigo-600 focus:bg-white font-mono text-left"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 mb-1.5">حداقل سفارش (کارتن):</label>
                <input
                  type="number"
                  required
                  value={prodMinOrder}
                  onChange={e => setProdMinOrder(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 outline-none focus:border-indigo-600 focus:bg-white font-mono text-left"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1.5">موجودی فعلی کارخانه (کارتن):</label>
                <input
                  type="number"
                  value={prodStock}
                  onChange={e => setProdStock(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 outline-none focus:border-indigo-600 focus:bg-white font-mono text-left"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 mb-1.5">واحد شمارش:</label>
                <input
                  type="text"
                  value={prodUnit}
                  onChange={e => setProdUnit(e.target.value)}
                  placeholder="بسته / قوطی / عدد"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 outline-none focus:border-indigo-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 mb-1.5">مبدا ارسال / شهرک صنعتی:</label>
                <input
                  type="text"
                  value={prodOrigin}
                  onChange={e => setProdOrigin(e.target.value)}
                  placeholder="آذربایجان شرقی - شبستر"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 outline-none focus:border-indigo-600 focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-slate-700 mb-1.5">آدرس اینترنتی تصویر کالا (Image URL):</label>
              <input
                type="url"
                value={prodImageUrl}
                onChange={e => setProdImageUrl(e.target.value)}
                placeholder="https://..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 outline-none focus:border-indigo-600 focus:bg-white font-mono text-left"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-black text-slate-700">توضیحات مشخصات فنی و مزایای عمده کالا:</label>
                <button
                  type="button"
                  onClick={handleGenerateAiDesc}
                  disabled={generatingAiDesc}
                  className="text-[10px] font-black text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  <Sparkles size={12} />
                  <span>{generatingAiDesc ? "در حال نگارش با هوش مصنوعی..." : "تولید توضیحات با هوش مصنوعی"}</span>
                </button>
              </div>
              <textarea
                rows={3}
                value={prodDescription}
                onChange={e => setProdDescription(e.target.value)}
                placeholder="مشخصات ماندگاری، استانداردها، سیب سلامت و شرایط نگهداری..."
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-bold text-slate-800 outline-none focus:border-indigo-600 focus:bg-white leading-relaxed"
              />
            </div>

            <div className="flex items-center gap-3 pt-3">
              <button
                type="submit"
                disabled={savingProduct}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black text-xs py-3.5 rounded-2xl shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {savingProduct ? <RefreshCw size={16} className="animate-spin" /> : <Check size={18} />}
                <span>{editingProduct ? "ثبت تغییرات کالا" : "انتشار محصول در کاتالوگ بنکداری"}</span>
              </button>
              <button
                type="button"
                onClick={handleResetForm}
                className="px-6 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs py-3.5 rounded-2xl transition-all cursor-pointer"
              >
                انصراف
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 4: ORDERS & SUPPLY CHAIN */}
      {activeTab === 'orders' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-5">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
              <Truck size={18} className="text-emerald-600" />
              <span>حواله‌های سفارش و مدیریت ترانزیت جاده‌ای ({factoryOrders.length})</span>
            </h3>
            <p className="text-xs text-slate-400 font-bold mt-0.5">بررسی سفارشات عمده، تامین مواد اولیه، خط تولید و خروج از انبار</p>
          </div>

          {factoryOrders.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
              <Truck size={36} className="mx-auto text-slate-400" />
              <p className="text-xs font-bold text-slate-600">هنوز سفارش عمده‌ای برای این کارخانه ثبت نگردیده است.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {factoryOrders.map(order => (
                <div key={order.id} className="border border-slate-200 rounded-2xl p-4 sm:p-5 bg-slate-50/60 space-y-3">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-200/80 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-xs text-slate-900">سفارش‌دهنده: {order.buyerName || "همکار بنکدار"}</span>
                        <span className="text-[10px] text-slate-500 font-mono">({order.buyerPhone || "بدون شماره"})</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">آدرس تخلیه بار: {order.buyerAddress || "انبار مقصد"}</p>
                    </div>

                    <div className="text-left">
                      <span className="text-xs font-black font-mono text-emerald-700 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-100">
                        {order.totalAmount?.toLocaleString()} تومان
                      </span>
                    </div>
                  </div>

                  <div className="text-xs font-bold text-slate-700">
                    <p className="text-slate-500 mb-1">اقلام خریداری‌شده کارخانه:</p>
                    <ul className="list-disc list-inside text-[11px] text-slate-600 space-y-0.5">
                      {order.items?.map((it, idx) => (
                        <li key={idx}>
                          {it.name} - <span className="font-mono font-bold text-indigo-700">{it.quantityCartons} کارتن</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Supply Chain Interactive Controls */}
                  <div className="pt-2 border-t border-slate-200/60 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[10px] font-black text-slate-400">تغییر وضعیت زنجیره تامین:</span>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        onClick={() => handleUpdateOrderStatus(order.id!, 'raw_material_supply')}
                        className={`px-3 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                          order.status === 'raw_material_supply'
                            ? "bg-indigo-600 text-white"
                            : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        تامین مواد اولیه
                      </button>
                      <button
                        onClick={() => handleUpdateOrderStatus(order.id!, 'production_line')}
                        className={`px-3 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                          order.status === 'production_line'
                            ? "bg-indigo-600 text-white"
                            : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        روی خط تولید
                      </button>
                      <button
                        onClick={() => handleUpdateOrderStatus(order.id!, 'factory_packaging')}
                        className={`px-3 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                          order.status === 'factory_packaging'
                            ? "bg-indigo-600 text-white"
                            : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        پلمپ کارتن
                      </button>
                      <button
                        onClick={() => handleUpdateOrderStatus(order.id!, 'logistic_shipping')}
                        className={`px-3 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                          order.status === 'logistic_shipping'
                            ? "bg-emerald-600 text-white"
                            : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        بارگیری و ترانزیت جاده‌ای
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
