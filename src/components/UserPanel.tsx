import React, { useState, useEffect, useMemo } from "react";
import { 
  User, Building, Phone, MapPin, ShoppingBag, CreditCard, LogOut, 
  Trash2, Edit, CheckCircle2, Sparkles, Package, Clock, FileText, 
  ArrowLeft, ChevronRight, ShieldCheck, Tag, Store, Upload, AlertTriangle, 
  X, Printer, Bell, TrendingDown, Truck, Activity, Loader2, Plus, 
  RefreshCw, Award, DollarSign, Percent, Share2, Copy, Check, Briefcase, 
  Users, Target, TrendingUp, Download, Eye, Gift, Factory, Megaphone, 
  ShieldAlert, Layers, Box, CheckCircle, ExternalLink, Calendar, Heart, Compass
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
import IranProvinceOrdersMapWidget from "./IranProvinceOrdersMapWidget";
import { getRepCommissions } from "../lib/leads-store";
import { ReferralRewardModal } from "./ReferralRewardModal";
import LoyaltyRewardsClub from "./LoyaltyRewardsClub";
import MyAdsManager from "./MyAdsManager";
import { getLoyaltySummary } from "../lib/loyalty-store";
import { ResilientVault } from "../lib/resilient-storage";
import { getUserReferralProfile } from "../lib/referral-system";
import ProfileScoreCard from "./ProfileScoreCard";
import RoleSelectionModal from "./RoleSelectionModal";
import { IRAN_PROVINCES_AND_CITIES } from "../utils/dealershipCityTiers";

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
  const userRole = (user?.role || 'customer').toLowerCase();

  // Role-specific Active Tab
  const [factoryTab, setFactoryTab] = useState<'products' | 'add_product' | 'orders' | 'profile' | 'ads'>('products');
  const [marketerTab, setMarketerTab] = useState<'desk' | 'payout' | 'certificate' | 'referred_orders' | 'profile' | 'ads'>('desk');
  const [customerTab, setCustomerTab] = useState<'orders' | 'loyalty' | 'quick_order' | 'wishlist' | 'credit' | 'referrals' | 'profile' | 'ads'>(userRole === 'ad_poster' ? 'ads' : 'orders');


  // Selected Order for Invoice modal
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<any | null>(null);
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showProvinceMapModal, setShowProvinceMapModal] = useState(false);

  // Orders State
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Price Alerts State
  const [priceAlerts, setPriceAlerts] = useState<any[]>([]);

  // Wishlist / Saved Items State
  const [wishlist, setWishlist] = useState<string[]>([]);

  // Profile Form States
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [company, setCompany] = useState(user?.company || "");
  const [province, setProvince] = useState(user?.province || IRAN_PROVINCES_AND_CITIES.find(p => p.cities.includes(user?.city))?.province || "تهران");
  const [city, setCity] = useState(user?.city || "تهران");
  const [address, setAddress] = useState(user?.address || "");
  const [iban, setIban] = useState(user?.iban || "");
  const [logoUrl, setLogoUrl] = useState(user?.logoUrl || user?.avatar || "");
  const [newPassword, setNewPassword] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const profileCitiesList = useMemo(() => {
    const match = IRAN_PROVINCES_AND_CITIES.find(p => p.province === province);
    return match ? match.cities : [city || "تهران"];
  }, [province, city]);

  const referralProfile = useMemo(() => getUserReferralProfile(user), [user]);

  const handleDeleteAccount = async () => {
    const rawPhone = (user?.phone || "").replace(/[^0-9]/g, "");
    if (rawPhone === "09999123001" || user?.isTestAccount) {
      alert("⚠️ این حساب کاربری (۰۹۹۹۹۱۲۳۰۰۱) به عنوان حساب تست دائمی و همه‌کاره سامانه «دست‌اول» ثبت شده است و جهت محافظت از فرآیند تست مستمر ممیزی، امکان حذف آن وجود ندارد.");
      return;
    }

    const confirmDelete = window.confirm(
      "آیا از حذف کامل و دائم حساب کاربری خود اطمینان دارید؟ تمامی اطلاعات، سفارشات و دسترسی‌های شما پاک می‌شوند و این عملیات قابل بازگشت نیست."
    );
    if (!confirmDelete) return;

    try {
      setIsSaving(true);
      if (db && user?.id) {
        try {
          await deleteDoc(doc(db, "users", user.id));
        } catch (e) {
          console.warn("Could not delete firestore user document:", e);
        }
      }
      localStorage.removeItem("dastavval_user");
      localStorage.removeItem("dastavval_user_role");
      localStorage.removeItem("dastavval_user_phone");
      localStorage.removeItem("dastavval_remember_me");
      
      alert("حساب کاربری شما با موفقیت و برای همیشه حذف گردید.");
      onLogout();
    } catch (err) {
      console.error("Account deletion failed:", err);
      onLogout();
    } finally {
      setIsSaving(false);
    }
  };

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
      const isTestKeyword = (order.id && typeof order.id === 'string' && order.id.startsWith("test-fake-demo-"));

      if (isNewUser && isTestKeyword) {
        return false;
      }
      return true;
    });
  };

  // Fetch real orders from database / storage / API
  const fetchOrders = async () => {
    setLoadingOrders(true);
    let combinedOrders: Order[] = [];
    const seenIds = new Set<string>();

    const addUnique = (list: any[]) => {
      if (!Array.isArray(list)) return;
      for (const item of list) {
        if (!item) continue;
        const id = item.id || item.trackingNumber || `ord_${Math.random()}`;
        if (!seenIds.has(id)) {
          seenIds.add(id);
          combinedOrders.push({ ...item, id });
        }
      }
    };

    // 1. Fetch from ResilientVault
    try {
      const vaultOrders = await ResilientVault.getOrders();
      addUnique(vaultOrders);
    } catch (e) {}

    // 2. Fetch from Firestore
    try {
      const q = query(collection(db, "orders"));
      const snap = await getDocs(q);
      const firestoreOrders = snap.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() })) as Order[];
      addUnique(firestoreOrders);
    } catch (e) {
      console.warn("Firestore orders fetch notice in UserPanel:", e);
    }

    // 3. Fetch from local caches & user-specific order storage
    try {
      const keys = ["dastavval_orders_cache", "dastavval_wholesale_orders", "dastavval_raw_orders"];
      keys.forEach(k => {
        const raw = localStorage.getItem(k);
        if (raw) addUnique(JSON.parse(raw));
      });

      const userPhone = user?.phone || user?.mobile || user?.username;
      if (userPhone) {
        const uOrders = localStorage.getItem(`dastavval_user_orders_${userPhone}`);
        if (uOrders) addUnique(JSON.parse(uOrders));
      }
    } catch (err) {}

    // 4. Always fetch from backend API endpoint to ensure all persistent server orders are loaded
    try {
      const res = await fetch("/api/b2b/orders");
      if (res.ok) {
        const apiOrders = await res.json();
        addUnique(apiOrders);
      }
    } catch (err) {}

    const filtered = filterFakeDataAndSetStatus(combinedOrders);
    setAllOrders(filtered);
    setLoadingOrders(false);
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
  }, [user]);

  // Load and sync wishlist
  const loadWishlist = () => {
    try {
      const saved = localStorage.getItem("dastavval_wishlist");
      if (saved) {
        setWishlist(JSON.parse(saved));
      } else {
        setWishlist([]);
      }
    } catch (e) {
      setWishlist([]);
    }
  };

  useEffect(() => {
    loadWishlist();
    window.addEventListener("dastavval-wishlist-changed", loadWishlist);
    return () => {
      window.removeEventListener("dastavval-wishlist-changed", loadWishlist);
    };
  }, []);

  // Filter products in wishlist
  const savedProducts = useMemo(() => {
    if (!Array.isArray(products)) return [];
    return products.filter(p => p && p.id && wishlist.includes(p.id));
  }, [products, wishlist]);

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

  // Filter Customer Orders (Strictly and securely matched to this authenticated user only)
  const customerOrders = useMemo(() => {
    if (!user) return [];
    
    // Normalize phone to last 10 digits e.g. 9121234567
    const extract10DigitSuffix = (num: string | number | null | undefined): string => {
      if (!num) return "";
      let cleaned = String(num)
        .replace(/[۰-۹]/g, d => "0123456789"["۰۱۲۳۴۵۶۷۸۹".indexOf(d)])
        .replace(/[٠-٩]/g, d => "0123456789"["٠١٢٣٤٥٦٧۸٩".indexOf(d)])
        .replace(/\D/g, "");
      if (cleaned.length >= 10) {
        return cleaned.slice(-10);
      }
      return cleaned.length >= 7 ? cleaned : "";
    };

    const userPhoneSuffixes = [
      extract10DigitSuffix(user.phone),
      extract10DigitSuffix(user.mobile),
      extract10DigitSuffix(user.username),
      extract10DigitSuffix(user.phone_number),
      extract10DigitSuffix(user.buyerPhone)
    ].filter(Boolean);

    const uEmail = (user.email || "").trim().toLowerCase();
    const uId = String(user.id || "").trim();

    return allOrders.filter(orderItem => {
      const order = orderItem as any;
      if (!order) return false;

      // 1. Match by explicit user ID
      if (order.userId && uId && String(order.userId) === uId) return true;

      // 2. Match by verified buyer phone suffix
      const buyerPhoneRaw = order.buyerPhone || order.customerPhone || order.phone || order.mobile || order.userPhone || order.buyerInfo?.phone || order.buyerInfo?.mobile || "";
      const buyerSuffix = extract10DigitSuffix(buyerPhoneRaw);
      if (buyerSuffix && userPhoneSuffixes.length > 0) {
        if (userPhoneSuffixes.some(p => p === buyerSuffix || (p.length >= 8 && buyerSuffix.endsWith(p)) || (buyerSuffix.length >= 8 && p.endsWith(buyerSuffix)))) {
          return true;
        }
      }

      // 3. Match by verified email address
      const buyerE = (order.buyerEmail || order.email || "").trim().toLowerCase();
      if (uEmail && buyerE && buyerE === uEmail) return true;

      // 4. Match by tracking number stored in local session for recently placed order
      try {
        const lastOrderTrack = localStorage.getItem("dastavval_last_order_tracking");
        const lastOrderId = localStorage.getItem("dastavval_last_order_id");
        if (lastOrderTrack && (order.id === lastOrderTrack || order.trackingNumber === lastOrderTrack)) return true;
        if (lastOrderId && (order.id === lastOrderId || order.trackingNumber === lastOrderId)) return true;
      } catch (e) {}

      return false;
    });
  }, [allOrders, user]);

  // Filter Factory Products strictly
  const factoryProducts = useMemo(() => {
    if (!user || userRole !== 'factory') return [];
    const compName = (user.company || "").toLowerCase().trim();
    const GENERIC_NAMES = [
      "کارخانه تولیدی",
      "فروشگاه پخش",
      "دست اول",
      "تولیدی",
      "کارخانه",
      "فروشگاه همکار",
      "فروشگاه همکار (ثبت نام آنی)",
      "مجموعه همکار",
      "خریدار عمده"
    ];
    const isGenericComp = !compName || compName.length < 3 || GENERIC_NAMES.some(g => g.toLowerCase() === compName);

    return products.filter(p => {
      const pFactory = (p.factoryName || p.factory_name || p.brand || p.sellerName || "").toLowerCase().trim();
      const pSellerId = (p.sellerId || "").toLowerCase().trim();
      const uId = (user.id || "").toLowerCase().trim();
      const fCode = (user.factoryCode || "").toLowerCase().trim();

      if (fCode && pSellerId === fCode) return true;
      if (uId && pSellerId === uId) return true;
      if (!isGenericComp && pFactory && (pFactory === compName || (pFactory.length >= 4 && pFactory.includes(compName)))) return true;
      return false;
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
        province: province.trim(),
        city: city.trim(),
        address: address.trim(),
        iban: iban.trim(),
        logoUrl: logoUrl.trim(),
        avatar: logoUrl.trim()
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
  const referralUrl = `https://dastavval.com/?ref=${referralCode}`;

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
      case 'gold': return { label: "همکار طلایی (۷٪ تخفیف پلکانی)", color: "bg-emerald-100 text-amber-800 border-emerald-200" };
      case 'silver': return { label: "همکار نقره‌ای (۴٪ تخفیف پلکانی)", color: "bg-slate-100 text-slate-800 border-slate-200" };
      default: return { label: "همکار برنزی دست‌اول", color: "bg-emerald-600 text-white border-emerald-200" };
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 text-right font-sans" dir="rtl">
      
      {/* ========================================================================= */}
      {/* 1. TOP HEADER BANNER - COHESIVE & ELEGANT USER CARD                      */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-2xs relative overflow-hidden space-y-4">
        {/* Profile Info Row */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center text-2xl sm:text-3xl shrink-0 border shadow-3xs ${
              userRole === 'factory' ? "bg-emerald-600 text-white border-emerald-700" :
              userRole === 'representative' ? "bg-blue-600 text-white border-blue-700" :
              (userRole === 'agent' || userRole === 'marketer') ? "bg-amber-600 text-white border-amber-700" :
              "bg-emerald-600 text-white border-emerald-700"
            }`}>
              {
                userRole === 'factory' ? '🏭' : 
                userRole === 'representative' ? '🏢' :
                (userRole === 'agent' || userRole === 'marketer') ? '📢' : '🛒'
              }
            </div>
            
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base sm:text-lg font-black text-slate-900 truncate">
                  {user?.company || user?.name || "کاربر گرامی"}
                </h1>
                
                {/* Role Badge */}
                {userRole === 'factory' ? (
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full font-black bg-emerald-50 text-emerald-800 border border-emerald-200/80">
                    🏬 کارخانه و واحد تولیدی رسمی
                  </span>
                ) : userRole === 'representative' ? (
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full font-black bg-blue-50 text-blue-800 border border-blue-200/80">
                    🏢 عاملیت انحصاری و نمایندگی استانی
                  </span>
                ) : (userRole === 'agent' || userRole === 'marketer') ? (
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full font-black bg-amber-50 text-amber-800 border border-amber-200/80">
                    📢 نماینده رسمی بازاریابی و فروش
                  </span>
                ) : (
                  <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-black border ${getBadgeInfo(user?.badge).color}`}>
                    {getBadgeInfo(user?.badge).label}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2.5 text-xs text-slate-500 font-bold flex-wrap">
                <span>مسئول: <strong className="text-slate-700">{user?.name || "مدیریت"}</strong></span>
                <span className="text-slate-300">•</span>
                <span>کد: <strong className="text-slate-700 dir-ltr">{user?.factoryCode || user?.agencyCode || user?.customerCode || user?.userCode || "USR-1001"}</strong></span>
                {user?.city && (
                  <>
                    <span className="text-slate-300">•</span>
                    <span className="flex items-center gap-1 text-slate-600">
                      <MapPin size={12} className="text-slate-400" />
                      {user.city}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ⚡ PENDING ROLE APPROVAL NOTIFICATION BANNER */}
        {user?.pendingRole && user?.isPendingRoleApproval && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-right">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5 sm:mt-0 font-black">
                ⏳
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-xs font-black text-amber-950">
                    درخواست ارتقا به نقش «{user.pendingRoleTitle || (user.pendingRole === 'factory' ? 'کارخانه تولیدی' : 'نمایندگی انحصاری')}» در حال بررسی است
                  </h4>
                  <span className="text-[10px] bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded-full font-bold">
                    در صف ممیزی مدیریت
                  </span>
                </div>
                <p className="text-[11px] text-amber-800 font-medium leading-relaxed">
                  به دلیل لزوم حفظ امنیت و استعلام پروانه بهره‌برداری، نقش‌های تولیدی پس از تأیید مدیر فعال می‌گردند. در این مدت دسترسی شما به عنوان خریدار عمده فعال است.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowRoleModal(true)}
              className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black shrink-0 transition-all cursor-pointer shadow-xs active:scale-95"
            >
              ویرایش مدارک و پیگیری
            </button>
          </div>
        )}

        {/* ⚡ INSTANT ROLE & PANEL SWITCHER */}
        <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 flex flex-col md:flex-row items-center justify-between gap-4 text-right">
          <div className="space-y-0.5">
            <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
              <Sparkles size={14} className="text-emerald-600 shrink-0" />
              <span>انتخاب و سوئیچ نقش کاربری</span>
            </span>
            <p className="text-[10px] text-slate-500 font-bold">نقش‌های خریدار عمده و بازاریاب آنی فعال می‌شوند؛ نقش‌های کارخانه و نمایندگی نیازمند تأیید مدیر هستند.</p>
          </div>
          
          <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full md:w-auto">
            {[
              { id: 'customer', label: '🛒 خریدار عمده', badge: 'bronze', restricted: false },
              { id: 'marketer', label: '📢 بازاریاب', badge: 'silver', restricted: false },
              { id: 'factory', label: '🏬 کارخانه تولیدی', badge: 'gold', restricted: true },
              { id: 'representative', label: '🏢 نمایندگی رسمی', badge: 'vip', restricted: true }
            ].map(r => {
              const isAllowed = !r.restricted || 
                user?.role === 'admin' || 
                (r.id === 'factory' && user?.isFactoryApproved) || 
                (r.id === 'representative' && user?.isRepresentativeApproved) ||
                (user?.approvedRoles && user.approvedRoles.includes(r.id));

              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={async () => {
                    if (r.restricted && !isAllowed) {
                      // Open role modal with strict message
                      setShowRoleModal(true);
                      return;
                    }

                    if (onUpdateUser) {
                      const updated = {
                        ...user,
                        role: r.id,
                        status: 'active',
                        badge: r.badge,
                        company: user?.company || (r.id === 'factory' ? 'کارخانه تولیدی' : r.id === 'representative' ? 'دفتر نمایندگی' : 'فروشگاه پخش'),
                      };
                      onUpdateUser(updated);
                      try {
                        const { saveUserSession } = await import("../lib/auth-helper");
                        saveUserSession(updated);
                      } catch (e) {
                        console.error("Error saving session:", e);
                      }
                    }
                  }}
                  className={`px-3 py-2 rounded-xl text-xs font-black transition-all cursor-pointer text-center flex-1 sm:flex-initial truncate flex items-center justify-center gap-1.5 ${
                    userRole === r.id
                      ? "bg-emerald-600 text-white shadow-xs"
                      : isAllowed
                      ? "bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-100 border border-slate-200"
                      : "bg-slate-100/80 text-slate-500 hover:bg-slate-200/80 border border-dashed border-slate-300"
                  }`}
                  title={!isAllowed ? "نیازمند تأیید مدیر" : undefined}
                >
                  <span>{r.label}</span>
                  {r.restricted && !isAllowed && (
                    <span className="text-[9px] px-1 rounded bg-amber-100 text-amber-800 font-normal">تأیید مدیر</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Cohesive Action Toolbar */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2.5">
          {/* Primary Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowRoleModal(true)}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
            >
              <Sparkles size={14} />
              <span>ارتقای نقش / تکمیل پروفایل</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (userRole === 'customer' || userRole === 'user') {
                  setCustomerTab('referrals');
                } else {
                  setShowReferralModal(true);
                }
              }}
              className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/80 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Gift size={14} />
              <span>دعوت از همکاران (پاداش)</span>
            </button>

            {(userRole === 'customer' || userRole === 'user') && (() => {
              const loyaltySum = getLoyaltySummary(user?.phone || user?.mobile || user?.id || "guest", allOrders);
              return (
                <button
                  type="button"
                  onClick={() => setCustomerTab('loyalty')}
                  className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200/80 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <Award size={14} className="text-amber-600" />
                  <span>باشگاه مشتریان: <strong className="font-sans font-black text-amber-700">{toPersianNum(loyaltySum.currentPoints)}</strong> امتیاز</span>
                </button>
              );
            })()}
          </div>

          {/* Secondary Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveTab('order')}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <ShoppingBag size={14} />
              <span>ویترین کالاها</span>
            </button>

            <button
              onClick={onLogout}
              className="px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut size={14} />
              <span>خروج</span>
            </button>

            <button
              onClick={handleDeleteAccount}
              className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center cursor-pointer"
              title="حذف کامل حساب کاربری"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Gamified Profile Score Card & Credit Level */}
      <ProfileScoreCard
        user={user}
        onOpenEditProfile={() => {
          if (userRole === 'factory') setFactoryTab('profile');
          else if (userRole === 'representative') setCustomerTab('profile');
          else if (userRole === 'agent' || userRole === 'marketer') setMarketerTab('profile');
          else setCustomerTab('profile');
        }}
        onChangeRole={() => setShowRoleModal(true)}
      />



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
                  ? "bg-emerald-600 text-white shadow-xs"
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
                  ? "bg-emerald-600 text-white shadow-xs"
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
              onClick={() => setMarketerTab('ads')}
              className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                marketerTab === 'ads'
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <Megaphone size={16} />
              <span>آگهی‌های من</span>
            </button>

            <button
              onClick={() => setMarketerTab('profile')}
              className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                marketerTab === 'profile'
                  ? "bg-emerald-600 text-white shadow-xs"
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
                  <div className="w-12 h-12 bg-emerald-50 text-amber-700 rounded-2xl flex items-center justify-center text-2xl">
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
                    <span className="text-[10px] text-amber-700 font-black bg-emerald-100 px-2 py-0.5 rounded-md ml-2 shrink-0">کد: {referralCode}</span>
                  </div>
                  
                  <button
                    onClick={handleCopyReferral}
                    className="px-6 py-3 bg-emerald-600 hover:bg-amber-700 text-white rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs shrink-0"
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
                  <span className="text-[10px] text-emerald-700 font-black bg-emerald-50 px-2 py-0.5 rounded-md inline-block">
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
                  <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mx-auto text-xl">
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
                      <FileText size={16} className="text-emerald-600" />
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
                            <tr key={`user-ref-ord-${ord.id || idx}-${idx}`} className="hover:bg-slate-50/80 transition-colors">
                              <td className="py-3 pr-2 font-mono font-bold text-slate-700">#{ord.id ? String(ord.id || "").slice(-6).toUpperCase() : `ORD-${idx+1}`}</td>
                              <td className="py-3 font-bold text-slate-900">{ord.buyerName || ord.buyerInfo?.name || "فروشگاه همکار"}</td>
                              <td className="py-3 font-mono font-bold text-slate-900">{toPersianNum(ordTotal.toLocaleString('fa-IR'))} تومان</td>
                              <td className="py-3 font-mono font-bold text-emerald-600">+{toPersianNum(comm.toLocaleString('fa-IR'))} تومان</td>
                              <td className="py-3">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-600 text-white">تایید شده</span>
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
                <div className="w-12 h-12 bg-emerald-50 text-amber-700 rounded-2xl flex items-center justify-center text-2xl">
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
                <div className="bg-emerald-600 text-white p-3.5 rounded-2xl text-xs font-black flex items-center gap-2 border border-emerald-200">
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
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-2xl focus:border-emerald-600 text-xs font-bold text-slate-900"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-black text-slate-800 block">شماره شبا بانکی (IR):</label>
                    <input
                      type="text"
                      required
                      value={iban || "IR120170000000123456789012"}
                      onChange={(e) => setIban(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-2xl focus:border-emerald-600 text-xs font-mono font-bold text-slate-900 text-left"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-amber-700 text-white rounded-2xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 shadow-xs"
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
                        <span className="text-[10px] font-black bg-emerald-100 text-amber-900 px-2.5 py-1 rounded-full">
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
                <div className="w-12 h-12 bg-emerald-50 text-amber-700 rounded-2xl flex items-center justify-center text-2xl">
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
                <div className="bg-emerald-600 text-white p-3.5 rounded-2xl text-xs font-black flex items-center gap-2 border border-emerald-200">
                  <CheckCircle2 size={16} className="text-emerald-600" />
                  <span>{successMsg}</span>
                </div>
              )}

              <form onSubmit={handleSaveProfile} className="space-y-4">
                {/* Avatar Selection Widget */}
                <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-3xl space-y-3">
                  <span className="text-xs font-black text-slate-850 block">تصویر پروفایل / نشان تجاری شما:</span>
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <div className="relative shrink-0">
                      <img
                        src={logoUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150"}
                        alt="Profile"
                        className="w-16 h-16 rounded-full object-cover border-2 border-emerald-500 shadow-xs"
                      />
                      <span className="absolute -bottom-1 -left-1 bg-emerald-600 text-white p-1 rounded-full text-[10px] font-black border-2 border-white shadow-2xs">
                        📸
                      </span>
                    </div>

                    <div className="flex-1 space-y-2 text-right">
                      <span className="text-[10px] text-slate-500 font-bold block">انتخاب از آواتارهای تجاری پیشنهادی دست‌اول یا پیوند عکس دلخواه:</span>
                      <div className="flex flex-wrap gap-2 justify-start">
                        {[
                          { url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200", label: "کاسب باسابقه" },
                          { url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200", label: "مدیر تولید" },
                          { url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200", label: "بازرگان جوان" },
                          { url: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=200", label: "نماینده فروش" },
                        ].map((preset, pIdx) => (
                          <button
                            key={pIdx}
                            type="button"
                            onClick={() => setLogoUrl(preset.url)}
                            className={`px-3 py-1.5 rounded-xl text-[10.5px] font-black border transition-all ${
                              logoUrl === preset.url
                                ? "bg-emerald-600 text-white border-emerald-500"
                                : "bg-white hover:bg-slate-100 text-slate-700 border-slate-200"
                            }`}
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>

                      <div className="pt-1.5">
                        <input
                          type="url"
                          value={logoUrl}
                          onChange={(e) => setLogoUrl(e.target.value)}
                          placeholder="پیوند (URL) تصویر دلخواه شما..."
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-[11px] font-bold outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-black text-slate-800 block">نام و نام خانوادگی:</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-2xl focus:border-emerald-600 text-xs font-bold text-slate-900"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-black text-slate-800 block">شماره همراه:</label>
                    <input
                      type="text"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-2xl focus:border-emerald-600 text-xs font-mono font-bold text-slate-900 text-left"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-black text-slate-800 block">استان و شهر فعالیت:</label>
                    <input
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-2xl focus:border-emerald-600 text-xs font-bold text-slate-900"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-black text-slate-800 block">شماره شبا بانکی جهت تسویه:</label>
                    <input
                      type="text"
                      value={iban}
                      onChange={(e) => setIban(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-2xl focus:border-emerald-600 text-xs font-mono font-bold text-slate-900 text-left"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-amber-700 text-white rounded-2xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 shadow-sm"
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
                  <span className="px-2 py-0.5 rounded-md bg-emerald-600 text-white text-[10px] font-black">
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
            {userRole !== 'ad_poster' && (
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
            )}

            {userRole !== 'ad_poster' && (
              <button
                onClick={() => setCustomerTab('loyalty')}
                className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                  customerTab === 'loyalty'
                    ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-xs"
                    : "text-amber-800 bg-emerald-50/70 hover:bg-emerald-100/70 hover:text-amber-900"
                }`}
              >
                <Award size={16} className={customerTab === 'loyalty' ? 'text-emerald-100' : 'text-emerald-600'} />
                <span>باشگاه مشتریان و امتیازها</span>
              </button>
            )}

            {userRole !== 'ad_poster' && (
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
            )}

            {userRole !== 'ad_poster' && (
              <button
                onClick={() => setCustomerTab('wishlist')}
                className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                  customerTab === 'wishlist'
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <Heart size={16} className={customerTab === 'wishlist' ? "fill-white text-white" : "text-rose-500"} />
                <span>کالاهای نشان‌شده ({toPersianNum(savedProducts.length)})</span>
              </button>
            )}

            {userRole !== 'ad_poster' && (
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
            )}

            {userRole !== 'ad_poster' && (
              <button
                onClick={() => setCustomerTab('referrals')}
                className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                  customerTab === 'referrals'
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <Gift size={16} className={customerTab === 'referrals' ? 'text-amber-300' : 'text-emerald-500'} />
                <span>دعوت از همکاران و پاداش خرید</span>
              </button>
            )}

            <button
              onClick={() => setCustomerTab('ads')}
              className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                customerTab === 'ads'
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-emerald-600 bg-emerald-50 hover:bg-emerald-100"
              }`}
            >
              <Megaphone size={16} />
              <span>مدیریت آگهی‌های من</span>
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
                  <div className="w-16 h-16 bg-emerald-600 text-white rounded-2xl flex items-center justify-center mx-auto text-2xl">
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
                            <span className="text-sm font-black text-slate-900">سفارش {order.trackingNumber || (order.id ? String(order.id || "").slice(-8).toUpperCase() : "جاری")}</span>
                            <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-black border ${
                              order.status === 'delivered' ? 'bg-emerald-600 text-white border-emerald-200' :
                              order.status === 'shipped' ? 'bg-purple-100 text-purple-800 border-purple-200' :
                              (order.status === 'processing' || order.status === 'confirmed') ? 'bg-blue-100 text-blue-800 border-blue-200' :
                              order.status === 'cancelled' ? 'bg-emerald-100 text-rose-800 border-emerald-200' :
                              'bg-emerald-100 text-amber-800 border-emerald-200'
                            }`}>
                              {order.status === 'delivered' ? "تحویل شده" :
                               order.status === 'shipped' ? "تحویل به باربری (در مسیر)" :
                               (order.status === 'processing' || order.status === 'confirmed') ? "تایید شده (در حال بارگیری)" :
                               order.status === 'cancelled' ? "لغو شده" : "در انتظار تایید کارخانه"}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-400 font-bold mt-1 block">
                            تاریخ: {(() => {
                              if (!order.createdAt) return "امروز";
                              try {
                                let dateObj: Date;
                                if (typeof order.createdAt === 'object' && 'seconds' in order.createdAt) {
                                  dateObj = new Date((order.createdAt as any).seconds * 1000);
                                } else {
                                  dateObj = new Date(order.createdAt as any);
                                }
                                if (isNaN(dateObj.getTime())) return "امروز";
                                
                                const dStr = dateObj.toLocaleDateString('fa-IR', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                });
                                const tStr = dateObj.toLocaleTimeString('fa-IR', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  second: '2-digit'
                                });
                                return `${dStr} ساعت ${tStr}`;
                              } catch {
                                return "امروز";
                              }
                            })()} | نحوه پرداخت: {order.paymentMethod === 'cash' ? "نقدی با تخفیف" : "چکی / امانی"}
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

          {/* TAB CONTENT: SAVED PRODUCTS / WISHLIST */}
          {customerTab === 'wishlist' && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
              {successMsg && (
                <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-2xl text-xs font-black text-right flex items-center gap-2">
                  <CheckCircle size={16} />
                  <span>{successMsg}</span>
                </div>
              )}

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center text-xl border border-rose-100">
                    ❤️
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900">کالاهای نشان‌شده و علاقه‌مندی‌ها</h3>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      اقلامی که ذخیره کرده‌اید را در اینجا مقایسه کرده و در قالب سبد خرید نهایی خود ثبت کنید.
                    </p>
                  </div>
                </div>

                {savedProducts.length > 0 && (
                  <button
                    onClick={() => {
                      savedProducts.forEach(p => onAddToCart(p, Math.max(5, p.min_order_cartons || 5)));
                      setSuccessMsg("تمامی اقلام نشان‌شده با موفقیت به سبد خرید شما افزوده شدند.");
                      setTimeout(() => setSuccessMsg(null), 4000);
                    }}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center gap-2 shadow-xs transition-all cursor-pointer"
                  >
                    <ShoppingBag size={14} />
                    <span>افزودن همه به سبد خرید</span>
                  </button>
                )}
              </div>

              {savedProducts.length === 0 ? (
                <div className="text-center py-12 space-y-3">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-2xl mx-auto border border-slate-100">
                    🔖
                  </div>
                  <h4 className="text-xs font-black text-slate-800">هیچ کالایی نشان‌گذاری نشده است</h4>
                  <p className="text-[10px] text-slate-400 font-bold max-w-sm mx-auto leading-relaxed">
                    با کلیک روی آیکون قلب در کارت‌های محصول تالار عرضه، اقلام مورد علاقه خود را در این بخش قرار دهید تا به راحتی خرید هفتگی خود را شارژ کنید.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 text-right" dir="rtl">
                  {savedProducts.map((p, idx) => {
                    const minLimit = Math.max(5, p.min_order_cartons || 5);
                    return (
                      <div key={`saved-p-${p.id || idx}`} className="py-4 flex flex-col md:flex-row items-center justify-between gap-4 first:pt-0 last:pb-0">
                        <div className="flex items-center gap-4 w-full md:w-auto text-right">
                          <img
                            src={p.image_url}
                            alt={p.name}
                            className="w-14 h-14 object-contain bg-white rounded-xl border border-slate-100 p-1 shrink-0"
                          />
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                                {p.category}
                              </span>
                              <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                {p.brand}
                              </span>
                            </div>
                            <h4 className="text-xs font-black text-slate-900 leading-relaxed line-clamp-1">
                              {p.name}
                            </h4>
                            <p className="text-[9px] text-slate-400 font-bold">
                              حداقل سفارش: {toPersianNum(minLimit)} کارتن
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto border-t md:border-t-0 border-slate-100 pt-3 md:pt-0">
                          <div className="text-right">
                            <span className="text-[9px] text-slate-400 font-bold block">قیمت کارتن:</span>
                            <span className="text-xs font-black text-slate-900">
                              {toPersianNum((p.bulk_price * (p.carton_pack_count || 24)).toLocaleString())} تومان
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                onAddToCart(p, minLimit);
                                setSuccessMsg(`کالای «${p.name}» به سبد خرید افزوده شد.`);
                                setTimeout(() => setSuccessMsg(null), 3000);
                              }}
                              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-3xs"
                            >
                              <Plus size={13} />
                              <span>خرید</span>
                            </button>
                            <button
                              onClick={() => {
                                try {
                                  const saved = localStorage.getItem("dastavval_wishlist");
                                  if (saved) {
                                    const filtered = JSON.parse(saved).filter((id: string) => id !== p.id);
                                    localStorage.setItem("dastavval_wishlist", JSON.stringify(filtered));
                                    window.dispatchEvent(new CustomEvent("dastavval-wishlist-changed"));
                                  }
                                } catch (e) {}
                              }}
                              className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all cursor-pointer border border-transparent hover:border-rose-100"
                              title="حذف از لیست"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB CONTENT: QUICK ORDER & PRICE ALERTS */}
          {customerTab === 'quick_order' && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                <div className="w-12 h-12 bg-emerald-600 text-white rounded-2xl flex items-center justify-center text-2xl">
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
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full text-xs font-black transition-all duration-200 hover:shadow-md active:scale-[0.95] flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
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
                  <div className="w-12 h-12 bg-emerald-600 text-white rounded-2xl flex items-center justify-center text-2xl">
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
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-sm"
                >
                  <span>ورود به سامانه اعتباریتو</span>
                  <ExternalLink size={14} />
                </a>
              </div>

              {/* Dynamic Financial Overview */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-emerald-50/60 border border-emerald-200 p-5 rounded-3xl space-y-1">
                  <span className="text-xs font-bold text-emerald-800">سقف اعتبار خرید چکی:</span>
                  <div className="text-xl font-black text-slate-900">
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
                      <span className="bg-emerald-100 text-indigo-800 px-2.5 py-0.5 rounded-lg text-sm">
                        رتبه {etebaritoState.grade}
                      </span>
                    ) : (
                      <span className="text-slate-400 text-sm font-bold">ثبت‌نشده</span>
                    )}
                  </div>
                  <span className={`text-[10px] font-bold ${etebaritoState ? 'text-emerald-700' : 'text-emerald-600'}`}>
                    {etebaritoState ? 'گواهی بارگذاری شده است' : 'استعلام اولیه اعتباریتو الزامی است'}
                  </span>
                </div>
              </div>

              {/* Etebarito Inquiry & Report Upload Zone */}
              <div className="bg-slate-50/80 rounded-2xl border border-slate-200 p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/80">
                  <div className="space-y-1">
                    <h4 className="text-xs font-black text-slate-900 flex items-center gap-2">
                      <Award size={16} className="text-emerald-600" />
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
                      className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800 focus:border-emerald-600 outline-none"
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
                      className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800 focus:border-emerald-600 outline-none"
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
                      <div className="w-full bg-emerald-50 hover:bg-emerald-100 text-indigo-800 border border-emerald-200 rounded-xl p-2.5 text-xs font-black flex items-center justify-center gap-2 cursor-pointer transition-colors">
                        <Upload size={14} />
                        <span>{etebaritoState?.certName ? `تغییر فایل (${etebaritoState.certName})` : "انتخاب فایل گزارش اعتباریتو"}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {etebaritoState && (
                  <div className="mt-3 p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <FileText size={16} className="text-emerald-600" />
                      <span className="font-bold text-slate-800">گزارش فعلی: {etebaritoState.certName || "گواهی اعتباریتو"}</span>
                      <span className="text-[10px] text-slate-400">({etebaritoState.uploadDate})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-emerald-600 text-white font-black rounded-md text-[10px]">
                        ثبت‌شده
                      </span>
                      <button
                        onClick={() => {
                          localStorage.removeItem("dastavval_user_etebarito");
                          setEtebaritoState(null);
                        }}
                        className="text-emerald-600 hover:text-emerald-700 font-bold text-[10px] cursor-pointer"
                      >
                        حذف
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB CONTENT: REFERRAL REWARDS / INVITE COLLEAGUES */}
          {customerTab === 'referrals' && (
            <div className="space-y-6">
              
              {/* Top Hero Banner */}
              <div className="bg-gradient-to-br from-emerald-800 via-teal-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-md border border-emerald-500/20">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
                
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-amber-300 text-xs font-black border border-emerald-500/30">
                      <Gift size={14} />
                      <span>طرح سراسری پورسانت، کارمزد و پاداش نقدی دست اول ({referralProfile.roleTitle})</span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-black text-white">
                      همکاران خود را دعوت کنید؛ پاداش میلیونی بگیرید و به آن‌ها تخفیف هدیه دهید!
                    </h3>
                    <p className="text-xs sm:text-sm text-emerald-100/90 font-medium max-w-2xl leading-relaxed">
                      {referralProfile.role === 'representative'
                        ? 'به عنوان نماینده رسمی، ۵٪ پورسانت مستقیم از کل فاکتور سفارش‌های مشتریان با کد نمایندگی شما محاسبه و واریز می‌شود و خریدار ۵٪ تخفیف عاملیت می‌گیرد.'
                        : referralProfile.role === 'marketer'
                        ? 'به ازای هر معرفی موفق، ۱,۰۰۰,۰۰۰ تومان پاداش نقدی و در صورت تبدیل شدن دعوت‌شده به نماینده رسمی، ۵٪ کارمزد مستمر دریافت کنید.'
                        : 'با دعوت از همکاران، ۵۰۰,۰۰۰ تومان پاداش نقدی در کیف پول دریافت کنید و دوست شما از ۳٪ تخفیف آنی فاکتور اول بهره‌مند می‌شود.'}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowReferralModal(true)}
                    className="px-5 py-3 bg-emerald-500 hover:bg-amber-400 text-slate-950 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer shadow-lg shadow-emerald-500/20 active:scale-95"
                  >
                    <Sparkles size={16} />
                    <span>مشاهده پاپ‌آپ و شرایط پاداش</span>
                  </button>
                </div>

                {/* KPI Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/10 relative z-10">
                  <div className="bg-white/10 backdrop-blur-xs rounded-2xl p-3.5 border border-white/10 text-center space-y-1">
                    <span className="text-[11px] text-emerald-200 block font-bold">نرخ پاداش شما</span>
                    <span className="text-sm sm:text-base font-black text-amber-300 font-mono">
                      {referralProfile.role === 'representative' ? '۵٪ پورسانت' : referralProfile.role === 'marketer' ? '۱,۰۰۰,۰۰۰ تومان' : '۵۰۰,۰۰۰ تومان'}
                    </span>
                  </div>

                  <div className="bg-white/10 backdrop-blur-xs rounded-2xl p-3.5 border border-white/10 text-center space-y-1">
                    <span className="text-[11px] text-emerald-200 block font-bold">تعداد دعوت‌های ثبت‌شده</span>
                    <span className="text-sm sm:text-base font-black text-white font-mono">
                      {toPersianNum(
                        JSON.parse(localStorage.getItem(`dastaval_referral_list_${user?.phone || user?.id}`) || "[]").length
                      )} همکار
                    </span>
                  </div>

                  <div className="bg-white/10 backdrop-blur-xs rounded-2xl p-3.5 border border-white/10 text-center space-y-1">
                    <span className="text-[11px] text-emerald-200 block font-bold">تخفیف خریدار دعوت‌شده</span>
                    <span className="text-sm sm:text-base font-black text-emerald-300 font-mono">
                      {referralProfile.role === 'representative' ? '۵٪ عاملیت' : '۳٪ تخفیف فاکتور'}
                    </span>
                  </div>

                  <div className="bg-white/10 backdrop-blur-xs rounded-2xl p-3.5 border border-white/10 text-center space-y-1">
                    <span className="text-[11px] text-emerald-200 block font-bold">سقف پاداش و درآمد</span>
                    <span className="text-sm sm:text-base font-black text-white">نامحدود و آنی</span>
                  </div>
                </div>
              </div>

              {/* Simplified Referral Center */}
              <div className="bg-white rounded-[2.5rem] p-6 sm:p-8 border border-slate-200 shadow-xl space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-emerald-600 text-white rounded-[1.5rem] flex items-center justify-center text-3xl shadow-lg shadow-emerald-600/20">
                    🔗
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-lg font-black text-slate-900">لینک اختصاصی و کد معرف شما</h3>
                    <p className="text-xs text-slate-500 font-bold leading-relaxed">
                      این لینک را برای همکاران و سوپرمارکت‌ها ارسال کنید. با هر ثبت سفارش، پورسانت و پاداش نقدی مستقیماً به حساب شما واریز می‌گردد.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                  <div className="w-full sm:flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-xs font-mono font-bold text-slate-800 text-left flex items-center justify-between overflow-hidden" dir="ltr">
                    <span className="truncate">{referralProfile.referralLink}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(referralProfile.referralLink);
                      setCopiedReferral(true);
                      setTimeout(() => setCopiedReferral(false), 2500);
                    }}
                    className="w-full sm:w-auto px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-600/10 active:scale-95"
                  >
                    {copiedReferral ? <Check size={18} className="text-emerald-200" /> : <Copy size={18} />}
                    <span>{copiedReferral ? "لینک کپی شد!" : "کپی لینک اختصاصی شما"}</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center space-y-1">
                    <span className="text-[10px] text-slate-400 font-black block uppercase">کد شناسایی معرف</span>
                    <span className="text-lg font-black text-slate-800 font-mono tracking-widest">{referralProfile.referralCode}</span>
                  </div>
                  <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 text-center space-y-1">
                    <span className="text-[10px] text-emerald-600 font-black block uppercase">نرخ پاداش فعال</span>
                    <span className="text-sm font-black text-emerald-700">
                      {referralProfile.role === 'representative' ? '۵٪ پورسانت نقدی' : '۳٪ تخفیف فاکتور'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Direct SMS Invitation Box */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-5">
                <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center">
                    <Users size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900">ارسال پیامک رایگان دعوت به همکار</h4>
                    <p className="text-xs text-slate-500 font-medium">
                      شماره موبایل همکار خود را وارد کنید تا پیامک دعوت با لینک اختصاصی شما به طور رایگان ارسال شود.
                    </p>
                  </div>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const form = e.currentTarget;
                    const peerName = (form.elements.namedItem('peerName') as HTMLInputElement).value;
                    const peerPhone = (form.elements.namedItem('peerPhone') as HTMLInputElement).value;
                    if (!peerPhone) return;

                    const storageKey = `dastaval_referral_list_${user?.phone || user?.id}`;
                    const currentList = JSON.parse(localStorage.getItem(storageKey) || "[]");
                    const newItem = {
                      id: `ref-${Date.now()}`,
                      name: peerName || "همکار گرامی",
                      phone: peerPhone,
                      date: new Date().toLocaleDateString('fa-IR'),
                      status: 'invited',
                      rewardStatus: 'pending'
                    };
                    currentList.unshift(newItem);
                    localStorage.setItem(storageKey, JSON.stringify(currentList));
                    
                    // Actually call the SMS API
                    fetch('/api/sms/send-invitation-sms', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        peerPhone,
                        peerName: peerName || "همکار گرامی",
                        userName: user?.company || user?.name || "همکار شما",
                        userPhone: user?.phone || user?.mobile || ""
                      })
                    }).catch(err => console.warn("Failed to send invitation SMS:", err));

                    alert(`✅ پیامک دعوت با موفقیت برای فروشگاه "${peerName || peerPhone}" ارسال شد. پس از ثبت اولین سفارش، پاداش ۱,۰۰۰,۰۰۰ تومانی برای شما شارژ خواهد شد.`);
                    form.reset();
                    // Trigger re-render
                    setCustomerTab('referrals');
                  }}
                  className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end"
                >
                  <div className="space-y-1">
                    <label className="text-xs font-black text-slate-700 block">نام فروشگاه یا همکار:</label>
                    <input
                      name="peerName"
                      type="text"
                      placeholder="مثلا هایپرمارکت البرز / آقای رضایی"
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-2xl focus:border-emerald-600 text-xs font-bold text-slate-900 outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-black text-slate-700 block">شماره موبایل همکار:</label>
                    <input
                      name="peerPhone"
                      type="tel"
                      required
                      placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-2xl focus:border-emerald-600 text-xs font-mono font-bold text-slate-900 outline-none text-left"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs active:scale-95"
                  >
                    <Gift size={15} />
                    <span>ارسال دعوت‌نامه پیامکی</span>
                  </button>
                </form>
              </div>

              {/* List of Invited Peers */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4">
                <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-600" />
                  <span>لیست همکاران دعوت‌شده و وضعیت پاداش</span>
                </h4>

                {(() => {
                  const storageKey = `dastaval_referral_list_${user?.phone || user?.id}`;
                  const currentList = JSON.parse(localStorage.getItem(storageKey) || "[]");

                  if (currentList.length === 0) {
                    return (
                      <div className="p-8 bg-slate-50 rounded-2xl border border-slate-150 text-center space-y-2">
                        <Gift size={32} className="text-slate-400 mx-auto" />
                        <p className="text-xs font-bold text-slate-600">هنوز همکاری را دعوت نکرده‌اید.</p>
                        <p className="text-[11px] text-slate-400">با ارسال لینک بالا یا ثبت شماره همکار، اولین پاداش خود را دریافت کنید.</p>
                      </div>
                    );
                  }

                  return (
                    <div className="overflow-x-auto">
                      <table className="w-full text-right text-xs">
                        <thead>
                          <tr className="border-b border-slate-100 text-slate-500 font-bold">
                            <th className="pb-3">نام همکار / فروشگاه</th>
                            <th className="pb-3">شماره تماس</th>
                            <th className="pb-3">تاریخ دعوت</th>
                            <th className="pb-3">وضعیت سفارش</th>
                            <th className="pb-3 text-left">مبلغ پاداش</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {currentList.map((item: any, idx: number) => (
                            <tr key={`peer-${item.id || idx}-${idx}`} className="hover:bg-slate-50/60">
                              <td className="py-3 font-black text-slate-800">{item.name}</td>
                              <td className="py-3 font-mono text-slate-600" dir="ltr">{item.phone}</td>
                              <td className="py-3 text-slate-500">{item.date}</td>
                              <td className="py-3">
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold border border-emerald-200">
                                  {item.rewardStatus === 'completed' ? "سفارش ثبت شد (پاداش منظور گردید)" : "دعوت‌نامه ارسال شد"}
                                </span>
                              </td>
                              <td className="py-3 text-left font-black text-emerald-700 font-mono">
                                ۱,۰۰۰,۰۰۰ تومان
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                })()}
              </div>

            </div>
          )}

          {/* TAB CONTENT: LOYALTY REWARDS CLUB */}
          {customerTab === 'loyalty' && (
            <LoyaltyRewardsClub
              user={user}
              orders={allOrders}
              setActiveTab={setActiveTab}
            />
          )}

          {/* TAB CONTENT: STORE PROFILE */}
          {customerTab === 'profile' && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                <div className="w-12 h-12 bg-emerald-600 text-white rounded-2xl flex items-center justify-center text-2xl">
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
                <div className="bg-emerald-600 text-white p-3.5 rounded-2xl text-xs font-black flex items-center gap-2 border border-emerald-200">
                  <CheckCircle2 size={16} className="text-emerald-600" />
                  <span>{successMsg}</span>
                </div>
              )}

              <form onSubmit={handleSaveProfile} className="space-y-4">
                {/* Avatar Selection Widget */}
                <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-3xl space-y-3">
                  <span className="text-xs font-black text-slate-850 block">تصویر پروفایل / نشان تجاری شما:</span>
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <div className="relative shrink-0">
                      <img
                        src={logoUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150"}
                        alt="Profile"
                        className="w-16 h-16 rounded-full object-cover border-2 border-emerald-500 shadow-xs"
                      />
                      <span className="absolute -bottom-1 -left-1 bg-emerald-600 text-white p-1 rounded-full text-[10px] font-black border-2 border-white shadow-2xs">
                        📸
                      </span>
                    </div>

                    <div className="flex-1 space-y-2 text-right">
                      <span className="text-[10px] text-slate-500 font-bold block">انتخاب از آواتارهای تجاری پیشنهادی دست‌اول یا پیوند عکس دلخواه:</span>
                      <div className="flex flex-wrap gap-2 justify-start">
                        {[
                          { url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200", label: "کاسب باسابقه" },
                          { url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200", label: "مدیر تولید" },
                          { url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200", label: "بازرگان جوان" },
                          { url: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=200", label: "نماینده فروش" },
                        ].map((preset, pIdx) => (
                          <button
                            key={pIdx}
                            type="button"
                            onClick={() => setLogoUrl(preset.url)}
                            className={`px-3 py-1.5 rounded-xl text-[10.5px] font-black border transition-all ${
                              logoUrl === preset.url
                                ? "bg-emerald-600 text-white border-emerald-500"
                                : "bg-white hover:bg-slate-100 text-slate-700 border-slate-200"
                            }`}
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>

                      <div className="pt-1.5">
                        <input
                          type="url"
                          value={logoUrl}
                          onChange={(e) => setLogoUrl(e.target.value)}
                          placeholder="پیوند (URL) تصویر دلخواه شما..."
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-[11px] font-bold outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>

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
                    <label className="text-xs font-black text-slate-800 block">استان محل فروشگاه / انبار:</label>
                    <select
                      value={province}
                      onChange={(e) => {
                        const newProv = e.target.value;
                        setProvince(newProv);
                        const match = IRAN_PROVINCES_AND_CITIES.find(p => p.province === newProv);
                        if (match && match.cities.length > 0) {
                          setCity(match.capital || match.cities[0]);
                        }
                      }}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-2xl focus:border-emerald-600 text-xs font-bold text-slate-900 cursor-pointer"
                    >
                      {IRAN_PROVINCES_AND_CITIES.map((p, pIdx) => (
                        <option key={`usr-prov-${p.province}-${pIdx}`} value={p.province}>{p.province}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-black text-slate-800 block">شهرستان محل فروشگاه / انبار:</label>
                    <select
                      value={profileCitiesList.includes(city) ? city : (profileCitiesList[0] || city)}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-2xl focus:border-emerald-600 text-xs font-bold text-slate-900 cursor-pointer"
                    >
                      {profileCitiesList.map((c, cIdx) => (
                        <option key={`usr-city-${c}-${cIdx}`} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-800 block">آدرس دقیق انبار یا مغازه جهت تخلیه بار:</label>
                  <textarea
                    rows={2}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="مثال: تهران، جاده خاوران، شهرک صنعتی خاوران، خیابان دوم، پلاک ۴۵، انبار مرکزی توزیع..."
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-2xl focus:border-emerald-600 text-xs font-bold text-slate-900"
                  />
                  <p className="text-[10px] text-slate-400 font-bold mt-1">💡 آدرس دقیق محل تخلیه به همراه شماره پلاک و شناسه انبار جهت صدور بارنامه رسمی</p>
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

              {/* Danger Zone: Account Deletion */}
              <div className="pt-6 border-t border-rose-100 bg-rose-50/50 p-4 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-rose-800">
                  <AlertTriangle size={16} />
                  <h4 className="text-xs font-black">مدیریت حساب کاربری و امنیت</h4>
                </div>
                <p className="text-[11px] text-rose-700 font-medium leading-relaxed">
                  در صورت تمایل می‌توانید حساب کاربری خود را به همراه تمام اطلاعات ثبت‌شده پاک کنید. این اقدام غیرقابل‌بازگشت است.
                </p>
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
                >
                  <Trash2 size={14} />
                  <span>حذف دائم حساب کاربری</span>
                </button>
              </div>
            </div>
          )}

        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. MY ADS MANAGEMENT VIEW (COMMON FOR ALL ROLES)                         */}
      {/* ========================================================================= */}
      {((userRole === 'factory' && factoryTab === 'ads') || 
        ((userRole === 'agent' || userRole === 'marketer') && marketerTab === 'ads') || 
        ((userRole === 'customer' || userRole === 'user' || userRole === 'ad_poster') && customerTab === 'ads')) && (
        <MyAdsManager user={user} setActiveTab={setActiveTab} />
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

      {/* Referral & Invite Reward Modal */}
      <ReferralRewardModal
        isOpen={showReferralModal}
        onClose={() => setShowReferralModal(false)}
        userPhone={user?.phone || user?.mobile || ""}
        user={user}
      />

      {/* Role Selection and Commercial Profile Completion Wizard */}
      <RoleSelectionModal
        isOpen={showRoleModal}
        onClose={() => setShowRoleModal(false)}
        user={user}
        b2bConfig={b2bConfig}
        onRoleSelected={(updatedUser) => {
          if (onUpdateUser) {
            onUpdateUser(updatedUser);
          }
          setName(updatedUser.name || name);
          setPhone(updatedUser.phone || phone);
          setCompany(updatedUser.company || company);
          setCity(updatedUser.city || city);
          setAddress(updatedUser.address || address);
          setIban(updatedUser.iban || iban);
          setShowRoleModal(false);
          setSuccessMsg("نقش و مشخصات تجاری شما با موفقیت به‌روزرسانی شد!");
          setTimeout(() => setSuccessMsg(null), 4000);
        }}
      />

    </div>
  );
}
