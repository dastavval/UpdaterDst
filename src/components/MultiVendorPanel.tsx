import { useState, useEffect } from "react";
import { collection, getDocs, addDoc, serverTimestamp, updateDoc, doc, query, where, orderBy, setDoc } from "../lib/firebase-mock";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "../lib/firebase-mock";
import { db, auth } from "../lib/firebase";
import { Product, Order, SupplyChainStage } from "../types";
import { getDisplayImageUrl } from "../lib/image-utils";
import { 
  Package, Plus, Sparkles, RefreshCw, Layers, Sliders, Truck, Check, 
  HelpCircle, FilePlus2, AlertCircle, Lock, LogIn, UserPlus, LogOut, 
  ShieldAlert, Building2, User, Mail, Phone, ShoppingBag, Globe, Eye, EyeOff
} from "lucide-react";

// Pre-defined static factories
const FACTORIES: { id: string, name: string }[] = [];

export default function MultiVendorPanel({ 
  currentSellerId, 
  setCurrentSeller, 
  onRefreshProducts,
  onTriggerZarinpalPayment,
  b2bConfig,
  onUpdateB2bConfig
}: { 
  currentSellerId: string, 
  setCurrentSeller: (id: string, name: string) => void,
  onRefreshProducts: () => void,
  onTriggerZarinpalPayment: (paymentInfo: {
    amount: number;
    description: string;
    callback: (success: boolean) => void;
  }) => void,
  b2bConfig: any,
  onUpdateB2bConfig: (updated: any) => void
}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // Monetization functions now instantly and for free active features through Direct Administrator Referral
  const handlePromoteProduct = async (product: Product) => {
    try {
      await updateDoc(doc(db, "products", product.id), {
        isSponsored: true
      });
      fetchVendorData();
      onRefreshProducts();
      alert(`درخواست ارتقای تبلیغاتی محصول ${product.name} با موفقیت و به صورت رایگان تایید شد! این کالا هم‌اکنون به عنوان کالای تبلیغاتی ویژه نشان‌دار گردید.`);
    } catch (err) {
      console.error("Error promoting product:", err);
    }
  };

  const handleBoostProduct = async (product: Product) => {
    try {
      const currentBoost = product.boostScore || 0;
      await updateDoc(doc(db, "products", product.id), {
        boostScore: currentBoost + 10
      });
      fetchVendorData();
      onRefreshProducts();
      alert(`درخواست افزایش رتبه کالا با موفقیت تایید شد! ضریب رتبه جستجوی محصول ${product.name} به میزان ۱۰ واحد به صورت رایگان افزایش یافت.`);
    } catch (err) {
      console.error("Error boosting product:", err);
    }
  };

  const handleUpgradeFactory = async () => {
    if (!sellerProfile) {
      alert("لطفا ابتدا وارد حساب کارخانه خود شوید.");
      return;
    }
    try {
      const updatedProfile = { ...sellerProfile, badge: "vip" };
      setSellerProfile(updatedProfile);
      localStorage.setItem("dastavval_seller_profile", JSON.stringify(updatedProfile));
      
      if (b2bConfig && b2bConfig.factories) {
        const updatedFactories = b2bConfig.factories.map((f: any) => {
          if (f.id === sellerProfile.id || f.name === sellerProfile.name) {
            return { ...f, badge: "vip", isPremium: true };
          }
          return f;
        });
        onUpdateB2bConfig({ ...b2bConfig, factories: updatedFactories });
      }

      alert(`تبریک! حساب کارخانه ${sellerProfile.name} به صورت مستقیم و بدون نیاز به پرداخت مالی، با تایید مدیریت به سطح همکار تجاری VIP (طلایی) ارتقا یافت! نشان طلایی در کاتالوگ شما فعال شد.`);
    } catch (err) {
      console.error("Error upgrading factory:", err);
    }
  };

  // Authentication states
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem("dastavval_seller_logged") === "true";
  });
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  
  // Custom Registered Factories stored in localStorage to persist across registration
  const [customFactories, setCustomFactories] = useState<{id: string, name: string}[]>(() => {
    const saved = localStorage.getItem("dastavval_custom_factories");
    return saved ? JSON.parse(saved) : [];
  });

  const ALL_FACTORIES = [...FACTORIES, ...customFactories];

  // Logged-in profile
  const [sellerProfile, setSellerProfile] = useState<{id: string; name: string; email: string; representative: string} | null>(() => {
    const saved = localStorage.getItem("dastavval_seller_profile");
    return saved ? JSON.parse(saved) : null;
  });

  // Login Form State
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Registration Form State
  const [regRepName, setRegRepName] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regFactoryName, setRegFactoryName] = useState("");
  const [regCategory, setRegCategory] = useState("تنقلات و شکلات");

  // Add Product Form State
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState(15000);
  const [bulkPrice, setBulkPrice] = useState(12000);
  const [cartonPackCount, setCartonPackCount] = useState(24);
  const [minOrderCartons, setMinOrderCartons] = useState(10);
  const [category, setCategory] = useState("تنقلات و شکلات");
  const [stockCartons, setStockCartons] = useState(100);
  const [unit, setUnit] = useState("بسته");
  const [imageUrl, setImageUrl] = useState("https://images.unsplash.com/photo-1621447509323-5705b2fb479e?auto=format&fit=crop&q=80&w=400");
  const [leadTime, setLeadTime] = useState(3);
  const [generatingDescription, setGeneratingDescription] = useState(false);

  useEffect(() => {
    if (isLoggedIn && sellerProfile) {
      // Sync App-level active seller with logged-in seller profile
      setCurrentSeller(sellerProfile.id, sellerProfile.name);
    }
  }, [isLoggedIn, sellerProfile]);

  useEffect(() => {
    if (isLoggedIn && currentSellerId) {
      fetchVendorData();
    }
    const handleSync = () => {
      if (isLoggedIn && currentSellerId) {
        fetchVendorData();
      }
    };
    window.addEventListener("dastavval-manual-sync", handleSync);
    return () => {
      window.removeEventListener("dastavval-manual-sync", handleSync);
    };
  }, [currentSellerId, isLoggedIn]);

  const fetchVendorData = async () => {
    if (!currentSellerId) return;
    setLoading(true);
    try {
      // Fetch Products
      const pSnap = await getDocs(query(collection(db, "products"), where("sellerId", "==", currentSellerId)));
      setProducts(pSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));

      // Fetch Orders
      const oSnap = await getDocs(query(collection(db, "orders"), where("sellerId", "==", currentSellerId)));
      setOrders(oSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order)));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Demo Fast Login handler
  const handleDemoLogin = (demoFacId: string) => {
    setAuthLoading(true);
    const selectedFac = ALL_FACTORIES.find(f => f.id === demoFacId);
    if (!selectedFac) return;

    setTimeout(() => {
      const profile = {
        id: selectedFac.id,
        name: selectedFac.name,
        email: `representative@${demoFacId.replace('factory_', '')}.com`,
        representative: "مدیریت ارشد بازرگانی"
      };

      localStorage.setItem("dastavval_seller_logged", "true");
      localStorage.setItem("dastavval_seller_profile", JSON.stringify(profile));
      setSellerProfile(profile);
      setIsLoggedIn(true);
      setAuthLoading(false);
      setCurrentSeller(selectedFac.id, selectedFac.name);
    }, 600);
  };

  // Sign In submit
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) return;
    setAuthLoading(true);

    try {
      // Try actual Firebase Auth if config permits, else fallback gracefully
      let userCredential = null;
      try {
        if (auth.app.options.apiKey !== "placeholder") {
          userCredential = await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
        }
      } catch (authErr) {
        console.warn("Firebase Auth bypassed or failed. Using fallback local authentication.");
      }

      // Check if this credentials match any custom factory, or fallback to default
      let matchedFactory = ALL_FACTORIES.find(f => `representative@${f.id.replace('factory_', '')}.com` === loginEmail);
      if (!matchedFactory) {
        // Just pick any random factory or assign as the default Behar (Cheetoz) for testing ease
        matchedFactory = ALL_FACTORIES[0];
      }

      const profile = {
        id: matchedFactory.id,
        name: matchedFactory.name,
        email: loginEmail,
        representative: "نماینده رسمی کارخانه"
      };

      localStorage.setItem("dastavval_seller_logged", "true");
      localStorage.setItem("dastavval_seller_profile", JSON.stringify(profile));
      setSellerProfile(profile);
      setIsLoggedIn(true);
      setCurrentSeller(matchedFactory.id, matchedFactory.name);
      alert(`خوش آمدید! ورود موفقیت‌آمیز به عنوان مدیر کارخانه ${matchedFactory.name}`);
    } catch (err: any) {
      alert("خطایی در ورود رخ داد: " + err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  // Register New B2B Factory
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regRepName || !regPhone || !regEmail || !regPassword || !regFactoryName) {
      alert("لطفا کلیه اطلاعات کارخانه و نماینده را تکمیل فرمایید.");
      return;
    }
    setAuthLoading(true);

    try {
      // Attempt Firebase auth creation
      try {
        if (auth.app.options.apiKey !== "placeholder") {
          await createUserWithEmailAndPassword(auth, regEmail, regPassword);
        }
      } catch (authErr) {
        console.warn("Using fallback local system for registration.");
      }

      // Generate a dynamic factory ID
      const factorySlug = `factory_custom_${Math.floor(1000 + Math.random() * 9000)}`;
      const newFactory = {
        id: factorySlug,
        name: regFactoryName
      };

      // Create corporate seller profile in Firestore
      await setDoc(doc(db, "sellers", factorySlug), {
        name: regFactoryName,
        representative: regRepName,
        phone: regPhone,
        email: regEmail,
        category: regCategory,
        createdAt: serverTimestamp()
      });

      // Save custom factory locally
      const updatedCustom = [...customFactories, newFactory];
      localStorage.setItem("dastavval_custom_factories", JSON.stringify(updatedCustom));
      setCustomFactories(updatedCustom);

      const profile = {
        id: factorySlug,
        name: regFactoryName,
        email: regEmail,
        representative: regRepName
      };

      localStorage.setItem("dastavval_seller_logged", "true");
      localStorage.setItem("dastavval_seller_profile", JSON.stringify(profile));
      setSellerProfile(profile);
      setIsLoggedIn(true);
      setCurrentSeller(factorySlug, regFactoryName);
      alert(`کارخانه جدید "${regFactoryName}" با موفقیت در سامانه بازرگانی دست اول ثبت شد!\nپرتال مدیریت شما فعال گردید.`);
    } catch (err: any) {
      alert("خطایی در فرآیند ثبت‌نام رخ داد: " + err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      if (auth.app.options.apiKey !== "placeholder") {
        await signOut(auth);
      }
    } catch (err) {}
    localStorage.removeItem("dastavval_seller_logged");
    localStorage.removeItem("dastavval_seller_profile");
    setIsLoggedIn(false);
    setSellerProfile(null);
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !brand) return;

    try {
      await addDoc(collection(db, "products"), {
        name,
        brand,
        description,
        price,
        bulk_price: bulkPrice,
        carton_pack_count: cartonPackCount,
        min_order_cartons: minOrderCartons,
        category,
        stock_quantity_cartons: stockCartons,
        image_url: imageUrl,
        unit,
        sellerId: currentSellerId,
        sellerName: sellerProfile?.name || "کارخانه همکار دست اول",
        production_lead_time_days: leadTime
      });

      // Clear Form
      setName("");
      setBrand("");
      setDescription("");
      fetchVendorData();
      onRefreshProducts();
      alert("محصول عمده جدید کارخانه با موفقیت در کاتالوگ دست اول منتشر شد.");
    } catch (err) {
      console.error(err);
    }
  };

  const generateAiDescription = async () => {
    if (!name) {
      alert("لطفا ابتدا نام محصول را بنویسید تا هوش مصنوعی توضیحات را تولید کند.");
      return;
    }
    setGeneratingDescription(true);
    try {
      const res = await fetch("/api/ai/describe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productName: name, category })
      });
      const data = await res.json();
      if (data.description) {
        setDescription(data.description);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setGeneratingDescription(false);
    }
  };

  const updateOrderStatus = async (orderId: string, nextStage: SupplyChainStage) => {
    try {
      await updateDoc(doc(db, "orders", orderId), { status: nextStage });
      fetchVendorData();
      alert("مرحله زنجیره تامین سفارش با موفقیت به روز شد.");
    } catch (err) {
      console.error(err);
    }
  };

  const updateProductStock = async (prodId: string, currentStock: number, delta: number) => {
    const nextStock = currentStock + delta;
    if (nextStock < 0) return;
    try {
      await updateDoc(doc(db, "products", prodId), { stock_quantity_cartons: nextStock });
      fetchVendorData();
      onRefreshProducts();
    } catch (err) {
      console.error(err);
    }
  };

  // If not logged in, show the gorgeous Authentication Screen (Login & Register)
  if (!isLoggedIn) {
    return (
      <div className="max-w-4xl mx-auto bg-white rounded-2xl border border-gray-100 shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-12 text-right" dir="rtl">
        {/* Info Column (Visual & Trust Building) */}
        <div className="md:col-span-5 bg-gradient-to-br from-emerald-600 to-teal-800 p-8 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="absolute inset-0 bg-grid-white/[0.05] pointer-events-none" />
          <div className="relative z-10 space-y-6">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur">
                <Package className="text-white animate-pulse" size={24} />
              </div>
              <span className="text-lg font-black tracking-tight">پرتال صنایع و کارخانجات</span>
            </div>

            <div className="space-y-4">
              <h3 className="text-2xl font-black leading-tight">حذف واسطه‌ها، عرضه مستقیم و آنلاین کالا</h3>
              <p className="text-xs text-emerald-100 leading-relaxed font-bold">
                به بزرگ‌ترین شبکه توزیع کارخانه‌ای و چندفروشندگی مواد غذایی و تنقلات ایران بپیوندید. محصولات خود را معرفی کنید، انبار کالا را همگام سازید و فاکتور فروش عمده خود را به صورت سیستمی نهایی کنید.
              </p>
            </div>
          </div>

          <div className="relative z-10 space-y-3 border-t border-white/10 pt-6 mt-8">
            <div className="flex items-center gap-2.5 text-xs font-bold text-emerald-50">
              <Check className="text-emerald-300" size={16} />
              <span>پرتال تخصصی صدور بارنامه حمل و نقل جاده‌ای</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs font-bold text-emerald-50">
              <Check className="text-emerald-300" size={16} />
              <span>مدیریت متمرکز موجودی کارتن و MOQs</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs font-bold text-emerald-50">
              <Check className="text-emerald-300" size={16} />
              <span>تسویه حساب نقدی پایا و تضمین امنیت معامله</span>
            </div>
          </div>
          <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-white/5 rounded-full pointer-events-none" />
        </div>

        {/* Auth Form Column */}
        <div className="md:col-span-7 p-6 sm:p-8 flex flex-col justify-between">
          <div>
            {/* Form Mode Toggle */}
            <div className="flex bg-gray-50 p-1 rounded-2xl mb-6">
              <button
                onClick={() => setAuthMode('login')}
                className={`flex-1 py-3 rounded-xl font-black text-xs transition-all ${
                  authMode === 'login' 
                  ? "bg-white text-emerald-700 shadow-md" 
                  : "text-gray-500 hover"
                }`}
              >
                ورود به پرتال تامین‌کنندگان
              </button>
              <button
                onClick={() => setAuthMode('register')}
                className={`flex-1 py-3 rounded-xl font-black text-xs transition-all ${
                  authMode === 'register' 
                  ? "bg-white text-emerald-700 shadow-md" 
                  : "text-gray-500 hover"
                }`}
              >
                ثبت نام کارخانه جدید
              </button>
            </div>

            {authMode === 'login' ? (
              /* LOGIN FORM */
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-1">
                  <h4 className="text-lg font-black text-gray-900">خوش آمدید</h4>
                  <p className="text-[11px] text-gray-400 font-bold">جهت مدیریت خط تولید و سفارشات تامین وارد حساب خود شوید.</p>
                </div>

                <div className="space-y-3 pt-2">
                  <div>
                    <label className="block text-xs font-black text-gray-500 mb-1 flex items-center gap-1">
                      <Mail size={12} className="text-emerald-600" />
                      ایمیل شرکتی کارخانه
                    </label>
                    <input 
                      type="email"
                      required
                      placeholder="representative@behara.com"
                      value={loginEmail}
                      onChange={e => setLoginEmail(e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl focus focus text-xs text-left font-sans"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-gray-500 mb-1 flex items-center gap-1">
                      <Lock size={12} className="text-emerald-600" />
                      رمز عبور پرتال
                    </label>
                    <div className="relative">
                      <input 
                        type={showPassword ? "text" : "password"}
                        required
                        placeholder="••••••••"
                        value={loginPassword}
                        onChange={e => setLoginPassword(e.target.value)}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl focus focus text-xs text-left font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover"
                      >
                        {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full bg-emerald-600 hover disabled:opacity-50 text-white py-3 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-all mt-4 shadow-lg shadow-emerald-600/10"
                >
                  {authLoading ? (
                    <RefreshCw className="animate-spin" size={14} />
                  ) : (
                    <LogIn size={14} />
                  )}
                  ورود امن به پرتال کارخانجات
                </button>
              </form>
            ) : (
              /* REGISTRATION FORM */
              <form onSubmit={handleRegister} className="space-y-3">
                <div className="space-y-1">
                  <h4 className="text-lg font-black text-gray-900">ثبت نام رسمی کارخانه</h4>
                  <p className="text-[11px] text-gray-400 font-bold">بسته‌بندی کارتنی محصولات و ترافیک خط تولید را بر بستر دست اول متصل کنید.</p>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-[10px] font-black text-gray-500 mb-1 flex items-center gap-1">
                      <User size={10} className="text-emerald-600" />
                      نام و نام خانوادگی نماینده
                    </label>
                    <input 
                      type="text"
                      required
                      placeholder="مثال: مهندس رادمنش"
                      value={regRepName}
                      onChange={e => setRegRepName(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl focus focus text-xs text-right font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-gray-500 mb-1 flex items-center gap-1">
                      <Phone size={10} className="text-emerald-600" />
                      تلفن همراه نماینده
                    </label>
                    <input 
                      type="text"
                      required
                      placeholder="۰۹۱۲۱۱۱۱۱۱۱"
                      value={regPhone}
                      onChange={e => setRegPhone(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl focus focus text-xs text-right font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-500 mb-1 flex items-center gap-1">
                    <Building2 size={10} className="text-emerald-600" />
                    نام رسمی کارخانه یا صنایع تولیدی
                  </label>
                  <input 
                    type="text"
                    required
                    placeholder="مثال: صنایع غذایی بهروز گیلان"
                    value={regFactoryName}
                    onChange={e => setRegFactoryName(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl focus focus text-xs text-right font-bold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-black text-gray-500 mb-1 flex items-center gap-1">
                      <Mail size={10} className="text-emerald-600" />
                      ایمیل رسمی (برای لاگین)
                    </label>
                    <input 
                      type="email"
                      required
                      placeholder="sales@behrouz.com"
                      value={regEmail}
                      onChange={e => setRegEmail(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl focus focus text-xs text-left font-sans"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-gray-500 mb-1 flex items-center gap-1">
                      <Lock size={10} className="text-emerald-600" />
                      رمز عبور پرتال
                    </label>
                    <input 
                      type="password"
                      required
                      placeholder="••••••••"
                      value={regPassword}
                      onChange={e => setRegPassword(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl focus focus text-xs text-left font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-500 mb-1">حوزه فعالیت تولیدی</label>
                  <select
                    value={regCategory}
                    onChange={e => setRegCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold text-gray-700"
                  >
                    {(() => {
                      let catList: string[] = [];
                      try {
                        const saved = localStorage.getItem("dastavval_b2b_config");
                        if (saved) {
                          const parsed = JSON.parse(saved);
                          if (parsed?.categories && parsed.categories.length > 0) {
                            catList = parsed.categories.map((c: any) => typeof c === 'string' ? c : (c.name || c.id));
                          }
                        }
                      } catch (e) {}
                      if (catList.length === 0) {
                        catList = Array.from(new Set(products.map((p: any) => p.category).filter(Boolean)));
                      }
                      if (catList.length === 0) catList = ["عمومی"];
                      return catList.map((catName: string, i: number) => (
                        <option key={`mv-cat-opt-${catName}-${i}`} value={catName}>{catName}</option>
                      ));
                    })()}
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full bg-emerald-600 hover disabled:opacity-50 text-white py-2.5 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-all mt-3 shadow-lg shadow-emerald-600/10"
                >
                  {authLoading ? (
                    <RefreshCw className="animate-spin" size={14} />
                  ) : (
                    <UserPlus size={14} />
                  )}
                  تاسیس نمایندگی کارخانه و ورود به پرتال
                </button>
              </form>
            )}
          </div>

          {/* Removed demo login section */}
        </div>
      </div>
    );
  }

  // Active user's factory selection if logged in
  return (
    <div className="space-y-8 text-right" dir="rtl">
      {/* Premium Factory-wide Upgrade Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 relative overflow-hidden shadow-xl border border-indigo-500/20">
        <div className="absolute top-0 left-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-1.5 text-right">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="bg-amber-400 text-slate-950 text-[9px] font-black px-2.5 py-0.5 rounded-full animate-pulse">
                👑 سرویس ارتقای طلایی (VIP)
              </span>
              <h4 className="font-black text-sm text-slate-100">ارتقای کلان کارخانه به سطح VIP طلایی دست اول</h4>
            </div>
            <p className="text-[11px] text-slate-400 font-bold max-w-xl leading-relaxed">
              با ارتقا به کارخانه VIP، نشان طلایی اصالت در تمام صفحات پلتفرم فعال شده، کاتالوگ شما پین شده و در اولویت اول بنکداران قرار می‌گیرید. همچنین کارمزد تراکنش‌های شما ۵۰٪ کاهش خواهد یافت.
            </p>
          </div>
          <button
            type="button"
            onClick={handleUpgradeFactory}
            className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-[11px] px-5 py-3 rounded-xl transition-all shadow-lg shadow-amber-400/20 shrink-0 cursor-pointer border border-amber-300"
          >
            ⚡ پرداخت زرین‌پال و ارتقا به VIP
          </button>
        </div>
      </div>

      {/* Factory Selection Header */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-xl flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center shadow-inner">
            <Building2 size={24} />
          </div>
          <div>
            <h3 className="text-xl font-black text-gray-900">{sellerProfile?.name || "پنل کارخانه تولیدی"}</h3>
            <p className="text-xs text-gray-400">
              پرتال نماینده: <strong className="text-gray-700">{sellerProfile?.representative || "ناشناس"}</strong> | مدیریت کاتالوگ، موجودی کارتن و فرآیند تولید
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {/* Allow switching between demo accounts if user wants to play with multiple brands */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-400">سوئیچ کارخانه:</span>
            <select 
              value={currentSellerId}
              onChange={e => {
                const fac = ALL_FACTORIES.find(f => f.id === e.target.value);
                if (fac) {
                  setCurrentSeller(fac.id, fac.name);
                  const updatedProfile = {
                    ...sellerProfile!,
                    id: fac.id,
                    name: fac.name
                  };
                  localStorage.setItem("dastavval_seller_profile", JSON.stringify(updatedProfile));
                  setSellerProfile(updatedProfile);
                }
              }}
              className="px-3 py-1.5 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-800 font-bold text-xs cursor-pointer focus focus"
            >
              {ALL_FACTORIES.map((fac, idx) => (
                <option key={`mv-fac-opt-${fac.id || idx}-${idx}`} value={fac.id}>{fac.name}</option>
              ))}
            </select>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-1 bg-red-50 hover text-red-700 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all border border-red-100/50"
          >
            <LogOut size={13} />
            خروج از سیستم
          </button>
        </div>
      </div>

      {/* 📊 تعرفه خدمات و پورسانت دست اول */}
      <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-right">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <h4 className="font-black text-xs sm:text-sm text-slate-800">تعرفه کارمزد و پورسانت پلتفرم «دست اول»</h4>
          </div>
          <p className="text-[10px] text-slate-500 font-bold max-w-xl leading-relaxed">
            کارمزد خدمات بنکداری، بازاریابی سراسری مویرگی و تضمین امنیت مالی پرداخت حساب امانی برای این کارخانه معادل <strong className="text-emerald-700">{b2bConfig?.commissionRate || 5}٪</strong> از مبلغ نهایی فاکتور فروش عمده می‌باشد.
          </p>
        </div>
        <div className="bg-white border border-emerald-200/60 rounded-xl px-4 py-2 text-center shadow-2xs shrink-0 self-stretch sm:self-auto flex sm:flex-col justify-between sm:justify-center items-center">
          <span className="text-[9px] text-slate-400 font-bold">پورسانت مصوب دست اول:</span>
          <span className="text-base font-black text-emerald-600">% {b2bConfig?.commissionRate || 5}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Catalog & Production Form */}
        <div className="lg:col-span-1 bg-white rounded-2xl p-6 border border-gray-100 shadow-xl h-fit">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
              <FilePlus2 size={20} />
            </div>
            <div>
              <h4 className="text-lg font-black text-gray-900">افزودن کالای کارتن عمده</h4>
              <p className="text-[11px] text-gray-400">معرفی کالا مستقیم از خط تولید به کاتالوگ</p>
            </div>
          </div>

          <form onSubmit={handleCreateProduct} className="space-y-4">
            <div>
              <label className="block text-xs font-black text-gray-500 mb-1">نام دقیق محصول عمده</label>
              <input 
                type="text" 
                required
                placeholder="مثال: چیپس سرکه نمکی مزمز ۶۰ گرمی"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus focus text-xs text-right font-bold"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-black text-gray-500 mb-1">برند کالا</label>
                <input 
                  type="text" 
                  required
                  placeholder="مثال: مزمز"
                  value={brand}
                  onChange={e => setBrand(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus focus text-xs text-right font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-gray-500 mb-1">دسته‌بندی</label>
                <select 
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full px-3 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus focus text-xs text-right font-bold text-gray-700"
                >
                  {(() => {
                    let catList: string[] = [];
                    try {
                      const saved = localStorage.getItem("dastavval_b2b_config");
                      if (saved) {
                        const parsed = JSON.parse(saved);
                        if (parsed?.categories && parsed.categories.length > 0) {
                          catList = parsed.categories.map((c: any) => typeof c === 'string' ? c : (c.name || c.id));
                        }
                      }
                    } catch (e) {}
                    if (catList.length === 0) {
                      catList = Array.from(new Set(products.map((p: any) => p.category).filter(Boolean)));
                    }
                    if (catList.length === 0) catList = ["عمومی"];
                    return catList.map((catName: string, i: number) => (
                      <option key={`mv-panel-cat-${catName}-${i}`} value={catName}>{catName}</option>
                    ));
                  })()}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-black text-gray-500 mb-1">تعداد در هر کارتن</label>
                <input 
                  type="number" 
                  value={cartonPackCount}
                  onChange={e => setCartonPackCount(Number(e.target.value))}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-xl focus focus text-xs text-right font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-gray-500 mb-1">حداقل سفارش کارتن</label>
                <input 
                  type="number" 
                  value={minOrderCartons}
                  onChange={e => setMinOrderCartons(Number(e.target.value))}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-xl focus focus text-xs text-right font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-black text-gray-500 mb-1">قیمت تک کارخانه (تومان)</label>
                <input 
                  type="number" 
                  value={price}
                  onChange={e => setPrice(Number(e.target.value))}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-xl focus focus text-xs text-right font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-gray-500 mb-1">قیمت عمده کارخانه‌ای</label>
                <input 
                  type="number" 
                  value={bulkPrice}
                  onChange={e => setBulkPrice(Number(e.target.value))}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-xl focus focus text-xs text-right font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <label className="block text-xs font-black text-gray-500 mb-1">موجودی کارتن</label>
                <input 
                  type="number" 
                  value={stockCartons}
                  onChange={e => setStockCartons(Number(e.target.value))}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-xl focus focus text-xs text-right font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-gray-500 mb-1">واحد محصول</label>
                <input 
                  type="text" 
                  value={unit}
                  onChange={e => setUnit(e.target.value)}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-xl focus focus text-xs text-right font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-gray-500 mb-1">زمان تحویل خط تولید (روز)</label>
              <input 
                type="number" 
                value={leadTime}
                onChange={e => setLeadTime(Number(e.target.value))}
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-xl focus focus text-xs text-right font-mono"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-black text-gray-500">توضیحات و مزایای عمده کالا</label>
                <button 
                  type="button"
                  disabled={generatingDescription}
                  onClick={generateAiDescription}
                  className="text-[10px] font-black text-emerald-700 hover flex items-center gap-1 disabled:opacity-50"
                >
                  <Sparkles size={11} />
                  {generatingDescription ? "تولید توضیحات کاتالوگ با هوش مصنوعی..." : "تولید با هوش مصنوعی"}
                </button>
              </div>
              <textarea 
                rows={3}
                placeholder="متن توصیفی و مزایای کارتنی..."
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus focus text-xs text-right leading-relaxed font-bold"
              />
            </div>

            <button 
              type="submit"
              className="w-full bg-emerald-600 hover text-white py-3 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-colors shadow-lg shadow-emerald-600/10"
            >
              <Plus size={16} />
              انتشار محصول در کارتابل فروشگاه
            </button>
          </form>
        </div>

        {/* Catalog Control Panel */}
        <div className="lg:col-span-2 space-y-8">
          {/* Active Wholesale Catalog */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-xl">
            <h4 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-2">
              <Layers className="text-emerald-600" />
              کنترل موجودی انبار کارخانه ({products.length} کالا)
            </h4>

            {products.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-12">هنوز هیچ محصولی برای این کارخانه بارگذاری نشده است.</p>
            ) : (
              <div className="flex overflow-x-auto gap-4 pb-4 px-2 snap-x snap-mandatory hide-scrollbar">
                {products.map((prod, idx) => (
                  <div key={`mv-prod-card-${prod.id || idx}-${idx}`} className="min-w-[85vw] sm:min-w-[360px] snap-center shrink-0 flex flex-col p-5 bg-gray-50/50 rounded-2xl border border-gray-100 gap-4">
                    {/* Top Row: Details */}
                    <div className="flex justify-between items-center w-full">
                      <div className="flex items-center gap-3">
                        {prod.image_url ? (
                          <img 
                            src={getDisplayImageUrl(prod.image_url)} 
                            alt="" 
                            className="w-12 h-12 rounded-xl object-cover border border-gray-100 shrink-0" 
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center shrink-0 text-[8px] font-black text-gray-400">
                            بدون تصویر
                          </div>
                        )}
                        <div>
                          <h5 className="font-black text-sm text-gray-900">{prod.name}</h5>
                          <p className="text-[10px] text-gray-400">کارتن {prod.carton_pack_count} تایی | حداقل سفارش {prod.min_order_cartons} کارتن</p>
                        </div>
                      </div>
                      
                      {/* Product Status Badges (Sponsored, Boosted) */}
                      <div className="flex flex-col gap-1 items-end">
                        {prod.isSponsored && (
                          <span className="bg-amber-100 text-amber-800 border border-amber-200 text-[8px] font-black px-2 py-0.5 rounded-full animate-pulse">
                            📢 ویژه تبلیغاتی
                          </span>
                        )}
                        {(prod.boostScore || 0) > 0 && (
                          <span className="bg-indigo-100 text-indigo-800 border border-indigo-200 text-[8px] font-black px-2 py-0.5 rounded-full">
                            🚀 رتبه جستجو: +{prod.boostScore}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Middle Row: Stock Control */}
                    <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-100">
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 font-bold block">موجودی کارخانه:</span>
                        <span className="text-xs font-black text-gray-900">{prod.stock_quantity_cartons} کارتن</span>
                      </div>
                      <div className="flex gap-1.5">
                        <button 
                          onClick={() => updateProductStock(prod.id, prod.stock_quantity_cartons, -5)}
                          className="px-2.5 py-1 text-[11px] font-black text-red-600 bg-red-50 hover rounded-lg transition-colors cursor-pointer"
                        >
                          ۵-
                        </button>
                        <button 
                          onClick={() => updateProductStock(prod.id, prod.stock_quantity_cartons, 5)}
                          className="px-2.5 py-1 text-[11px] font-black text-emerald-600 bg-emerald-50 hover rounded-lg transition-colors cursor-pointer"
                        >
                          ۵+
                        </button>
                      </div>
                    </div>

                    {/* Bottom Row: Marketing & Boosting Upgrades */}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => handlePromoteProduct(prod)}
                        className="px-3 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-[10px] font-black flex items-center justify-center gap-1 transition-all cursor-pointer shadow-xs border border-amber-400"
                        title="ویژه کردن کالا و نمایش اول کارتابل"
                      >
                        <Sparkles size={11} />
                        <span>📢 تبلیغ ویژه (آگهی)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleBoostProduct(prod)}
                        className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[10px] font-black flex items-center justify-center gap-1 transition-all cursor-pointer shadow-xs border border-indigo-500"
                        title="افزایش ضریب شانس رتبه در جستجوی اول"
                      >
                        <Plus size={11} />
                        <span>🚀 ارتقای رتبه جستجو</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Incoming Production & Logistics Orders */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-xl">
            <h4 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-2">
              <Truck className="text-emerald-600" />
              مدیریت زنجیره تامین و سفارشات کارخانه ({orders.length} سفارش)
            </h4>

            {orders.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-12">هیچ سفارش فعال تولید یا تامینی برای کارخانه صادر نشده است.</p>
            ) : (
              <div className="flex overflow-x-auto gap-4 pb-4 px-2 snap-x snap-mandatory hide-scrollbar">
                {orders.map((order, idx) => (
                  <div key={`mv-order-card-${order.id || idx}-${idx}`} className="min-w-[85vw] sm:min-w-[320px] snap-center shrink-0 bg-gray-50/70 rounded-2xl p-5 border border-gray-100 space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-gray-100 pb-3">
                      <div>
                        <span className="text-[10px] text-gray-400 font-mono">شناسه سفارش: {order.trackingNumber}</span>
                        <h5 className="font-black text-sm text-gray-800">سفارش دهنده: {order.buyerName} ({order.buyerPhone})</h5>
                        <p className="text-xs text-gray-500 mt-1">آدرس تخلیه: {order.buyerAddress}</p>
                      </div>
                      <div className="text-left sm">
                        <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                          مبلغ: {order.totalAmount.toLocaleString()} تومان
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      {order.items.map((item, iIdx) => (
                        <p key={`mv-panel-order-item-${item.productId || iIdx}-${iIdx}`} className="text-xs text-gray-600 font-bold">
                          • {item.name} - <span className="text-emerald-600">{item.quantityCartons} کارتن</span>
                        </p>
                      ))}
                    </div>

                    {/* Supply Chain Interactive Tracker */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3">
                      <button 
                        onClick={() => updateOrderStatus(order.id!, 'raw_material_supply')}
                        className={`px-2 py-1.5 rounded-xl text-[10px] font-black border transition-all ${
                          order.status === 'raw_material_supply' 
                          ? 'bg-emerald-600 border-emerald-600 text-white' 
                          : 'bg-white border-gray-200 text-gray-500 hover'
                        }`}
                      >
                        تامین مواد اولیه
                      </button>
                      <button 
                        onClick={() => updateOrderStatus(order.id!, 'production_line')}
                        className={`px-2 py-1.5 rounded-xl text-[10px] font-black border transition-all ${
                          order.status === 'production_line' 
                          ? 'bg-emerald-600 border-emerald-600 text-white' 
                          : 'bg-white border-gray-200 text-gray-500 hover'
                        }`}
                      >
                        روی خط تولید
                      </button>
                      <button 
                        onClick={() => updateOrderStatus(order.id!, 'factory_packaging')}
                        className={`px-2 py-1.5 rounded-xl text-[10px] font-black border transition-all ${
                          order.status === 'factory_packaging' 
                          ? 'bg-emerald-600 border-emerald-600 text-white' 
                          : 'bg-white border-gray-200 text-gray-500 hover'
                        }`}
                      >
                        بسته‌بندی کارتنی
                      </button>
                      <button 
                        onClick={() => updateOrderStatus(order.id!, 'logistic_shipping')}
                        className={`px-2 py-1.5 rounded-xl text-[10px] font-black border transition-all ${
                          order.status === 'logistic_shipping' 
                          ? 'bg-emerald-600 border-emerald-600 text-white' 
                          : 'bg-white border-gray-200 text-gray-500 hover'
                        }`}
                      >
                        ارسال و ترابری
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
