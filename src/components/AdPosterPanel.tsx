import React, { useState, useEffect, useMemo } from "react";
import { 
  Megaphone, Plus, Trash2, Edit3, TrendingUp, Sparkles, MessageCircle, 
  Search, Filter, Calendar, Eye, ShieldCheck, Zap, ArrowUpRight, 
  Package, Building2, CheckCircle2, Clock, CreditCard, ChevronRight,
  Flame, List, LayoutGrid, X, Camera, MapPin, Phone, AlertTriangle, RefreshCw,
  Repeat, ArrowLeftRight, UserPlus, LogIn, UploadCloud, Check, HelpCircle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { AdItem, getAdFallbackImage } from "../utils/ad-utils";
import { db } from "../lib/data-layer";
import { collection, query, where, getDocs, deleteDoc, doc, setDoc, updateDoc } from "../lib/data-layer";
import { uploadToParsPackStorage } from "../utils/storage";
import { getApiUrl } from "../utils/api-utils";
import { StrictCityProvinceSelector } from "./StrictCityProvinceSelector";
import SmsPhoneVerifier from "./SmsPhoneVerifier";
import AdEditUpgradeModal from "./AdEditUpgradeModal";
import { MASTER_CATEGORIES, getAllCategoriesMerged } from "../data/categoriesData";

interface AdPosterPanelProps {
  user: any;
  onTriggerPayment?: (paymentInfo: {
    amount: number;
    description: string;
    callback: (success: boolean) => void;
  }) => void;
  onNavigateHome?: () => void;
  onOpenAuth?: (role?: string) => void;
  onNavigateToBarter?: () => void;
}

export const AdPosterPanel: React.FC<AdPosterPanelProps> = ({ 
  user, 
  onTriggerPayment, 
  onNavigateHome,
  onOpenAuth,
  onNavigateToBarter
}) => {
  const [activeTab, setActiveTab] = useState<'my_ads' | 'requests' | 'stats' | 'barter_offers'>('my_ads');
  const [ads, setAds] = useState<AdItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddingAd, setIsAddingAd] = useState(false);
  const [editingAd, setEditingAd] = useState<AdItem | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [selectedUpgradeModalAd, setSelectedUpgradeModalAd] = useState<AdItem | null>(null);
  const [selectedUpgradeModalMode, setSelectedUpgradeModalMode] = useState<"edit" | "upgrade" | "delete">("edit");

  const handleModalAdUpdated = (updatedAd: AdItem) => {
    setAds(prev => prev.map(a => a.id === updatedAd.id ? updatedAd : a));
    showToast("آگهی با موفقیت به‌روزرسانی شد.");
  };

  const handleModalAdDeleted = (deletedId: string) => {
    setAds(prev => prev.filter(a => a.id !== deletedId));
    showToast("آگهی با موفقیت حذف گردید.");
  };

  // Load dynamic categories merging saved b2b_config categories with all 27 MASTER_CATEGORIES
  const dynamicCategories = useMemo(() => {
    let savedCategories: any[] = [];
    try {
      const saved = localStorage.getItem("dastavval_b2b_config");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.categories)) {
          savedCategories = parsed.categories;
        }
      }
    } catch (e) {}

    const merged = getAllCategoriesMerged(savedCategories);
    return merged.map(c => ({
      id: c.id,
      name: c.name,
      emoji: c.emoji,
      sector: c.sector,
      type: c.type
    }));
  }, []);

  // Form State
  const [adForm, setAdForm] = useState({
    title: "",
    category: "under_market" as "under_market" | "liquid" | "direct_supply" | "materials" | "services" | "equipment",
    productCategory: dynamicCategories[0]?.name || "",
    factoryName: user?.company || user?.name || "",
    wholesalePrice: "",
    marketPrice: "",
    quantity: "",
    contactPerson: user?.name || "",
    contactPhone: user?.phone || "",
    city: user?.city || "تهران",
    province: user?.province || "تهران",
    description: "",
    imageUrl: "",
    isBarterAllowed: false,
    minOrderQty: "۱۰ کارتن"
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchUserAds = async () => {
    setLoading(true);
    try {
      const userKey = user?.uid || user?.id || user?.phone || "guest_ad_poster";
      
      // Check local storage first - EXCLUDE all mock/seed items
      const localAds = JSON.parse(localStorage.getItem("dastavval_user_ads") || "[]");
      const matched = localAds.filter((a: any) => 
        !a.id?.startsWith("ad-seed-") && 
        !a.isSeed && 
        (
          a.user_id === userKey || 
          (user?.phone && a.contactPhone === user.phone) ||
          (user?.email && a.userEmail === user.email)
        )
      );

      setAds(matched);

      // Clean storage if it contained seed ads
      const cleanedStorage = localAds.filter((a: any) => !a.id?.startsWith("ad-seed-") && !a.isSeed);
      if (cleanedStorage.length !== localAds.length) {
        localStorage.setItem("dastavval_user_ads", JSON.stringify(cleanedStorage));
      }

      // Try fetching from firestore
      try {
        if (user?.id || user?.uid) {
          const adsRef = collection(db, "ads");
          const q = query(adsRef, where("user_id", "==", user.uid || user.id));
          const querySnapshot = await getDocs(q);
          const userAds: AdItem[] = [];
          querySnapshot.forEach((doc) => {
            userAds.push({ id: doc.id, ...doc.data() } as AdItem);
          });
          if (userAds.length > 0) {
            setAds(userAds);
          }
        }
      } catch (dbErr) {
        console.warn("Firestore ad fetch:", dbErr);
      }
    } catch (error) {
      console.error("Error fetching user ads:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserAds();
  }, [user]);

  // Open Form for Adding or Editing
  const openAddModal = () => {
    setAdForm({
      title: "",
      category: "under_market",
      productCategory: dynamicCategories[0]?.name || "",
      factoryName: user?.company || user?.name || "",
      wholesalePrice: "",
      marketPrice: "",
      quantity: "",
      contactPerson: user?.name || "",
      contactPhone: user?.phone || "",
      city: user?.city || "تهران",
      province: user?.province || "تهران",
      description: "",
      imageUrl: "",
      isBarterAllowed: false,
      minOrderQty: "۱۰ کارتن"
    });
    setEditingAd(null);
    setIsAddingAd(true);
  };

  const openEditModal = (ad: AdItem) => {
    setEditingAd(ad);
    setAdForm({
      title: ad.title,
      category: (ad.category as any) || "under_market",
      productCategory: (ad as any).productCategory || dynamicCategories[0]?.name || "",
      factoryName: ad.factoryName,
      wholesalePrice: ad.wholesalePrice,
      marketPrice: (ad as any).marketPrice || "",
      quantity: (ad as any).quantity || "۱۰۰ کارتن",
      contactPerson: (ad as any).contactPerson || user?.name || "",
      contactPhone: (ad as any).contactPhone || user?.phone || "",
      city: (ad as any).city || "تهران",
      province: (ad as any).province || "تهران",
      description: ad.description,
      imageUrl: ad.imageUrl || "",
      isBarterAllowed: (ad as any).isBarterAllowed || false,
      minOrderQty: (ad as any).minOrderQty || "۱۰ کارتن"
    });
    setIsAddingAd(true);
  };

  // Image Upload Handler
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    try {
      const res = await uploadToParsPackStorage(file, "ads");
      setAdForm(prev => ({ ...prev, imageUrl: res.url }));
      showToast("تصویر کالا با موفقیت بارگذاری شد.");
    } catch (err) {
      // Fallback object URL
      const objectUrl = URL.createObjectURL(file);
      setAdForm(prev => ({ ...prev, imageUrl: objectUrl }));
      showToast("تصویر با موفقیت انتخاب گردید.");
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Save Ad (Create or Update)
  const handleSaveAd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adForm.title || !adForm.wholesalePrice || !adForm.contactPhone) {
      alert("لطفاً عنوان کالا، قیمت عمده و شماره تماس را وارد فرمایید.");
      return;
    }

    if (!editingAd && !isPhoneVerified) {
      alert("جهت حفظ امنیت و اصالت آگهی، تأیید پیامکی شماره همراه الزامی است.");
      return;
    }

    const userKey = user?.uid || user?.id || user?.phone || "guest_ad_poster";
    let badge = "📉 زیر قیمت بازار";
    if (adForm.category === "liquid") badge = "🔥 حراج و مازاد";
    else if (adForm.category === "direct_supply") badge = "📦 تامین مستقیم";

    if (editingAd) {
      // Update
      const updatedAd: AdItem = {
        ...editingAd,
        title: adForm.title,
        category: adForm.category,
        productCategory: adForm.productCategory,
        factoryName: adForm.factoryName || "تامین‌کننده تاییدشده",
        wholesalePrice: adForm.wholesalePrice,
        imageUrl: adForm.imageUrl || editingAd.imageUrl || getAdFallbackImage(adForm.title, adForm.category),
        description: adForm.description,
        badgeText: badge,
        quantity: adForm.quantity || "۱۰۰ کارتن",
        marketPrice: adForm.marketPrice || "",
        buyerProfit: "تخفیف ویژه کارخانه",
        contactPerson: adForm.contactPerson || user?.name || "",
        contactPhone: adForm.contactPhone || user?.phone || "",
        city: adForm.city,
        province: adForm.province,
        date: "امروز"
      };

      const updatedList = ads.map(a => a.id === editingAd.id ? updatedAd : a);
      setAds(updatedList);

      const allLocal = JSON.parse(localStorage.getItem("dastavval_user_ads") || "[]");
      const synced = allLocal.map((a: any) => a.id === editingAd.id ? updatedAd : a);
      localStorage.setItem("dastavval_user_ads", JSON.stringify(synced));

      try {
        await updateDoc(doc(db, "ads", editingAd.id), updatedAd as any);
      } catch (dbErr) {
        console.warn("Firestore update:", dbErr);
      }

      showToast("آگهی با موفقیت ویرایش شد.");
    } else {
      // Create New
      const newAd: AdItem = {
        id: `ad-${Date.now()}`,
        title: adForm.title,
        category: adForm.category,
        productCategory: adForm.productCategory,
        factoryName: adForm.factoryName || user?.company || "تامین‌کننده دست اول",
        wholesalePrice: adForm.wholesalePrice,
        marketPrice: adForm.marketPrice || "",
        buyerProfit: "تخفیف ویژه کارخانه",
        quantity: adForm.quantity || "۱۰۰ کارتن",
        contactPerson: adForm.contactPerson || user?.name || "مدیریت فروش",
        contactPhone: adForm.contactPhone,
        imageUrl: adForm.imageUrl || getAdFallbackImage(adForm.title, adForm.category),
        description: adForm.description || "فروش مستقیم بدون واسطه با تضمین سلامت و بارنامه رسمی پلتفرم.",
        badgeText: badge,
        status: "approved",
        city: adForm.city,
        province: adForm.province,
        date: "امروز",
        isSponsored: false
      };

      const updatedList = [newAd, ...ads];
      setAds(updatedList);

      const allLocal = JSON.parse(localStorage.getItem("dastavval_user_ads") || "[]");
      allLocal.unshift(newAd);
      localStorage.setItem("dastavval_user_ads", JSON.stringify(allLocal));

      // Also publish to general ads pool so it appears in the AdBoard/Billboard
      try {
        const publicAds = JSON.parse(localStorage.getItem("dastavval_user_ads_pool") || "[]");
        publicAds.unshift(newAd);
        localStorage.setItem("dastavval_user_ads_pool", JSON.stringify(publicAds));
      } catch (e) {
        console.warn("Pool save error:", e);
      }

      try {
        await setDoc(doc(db, "ads", newAd.id), newAd);
      } catch (dbErr) {
        console.warn("Firestore insert:", dbErr);
      }

      // Dispatch SMS confirmation to advertiser and alert to admin
      const contactPhone = adForm.contactPhone || user?.phone;
      if (contactPhone) {
        try {
          fetch(getApiUrl("/api/sms/send-ad-created-sms"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              phone: contactPhone,
              userName: adForm.contactPerson || user?.name || "آگهی‌دهنده محترم",
              adTitle: newAd.title,
              adId: newAd.id
            })
          }).catch(err => console.warn("Ad creation SMS notice:", err));
        } catch (e) {}
      }

      showToast("آگهی جدید با موفقیت ثبت و در تالار کف بازار منتشر گردید.");
    }

    setIsAddingAd(false);
    setEditingAd(null);
  };

  const handleDeleteAd = async (adId: string) => {
    if (!window.confirm("آیا از حذف این آگهی اطمینان دارید؟")) return;
    
    try {
      await deleteDoc(doc(db, "ads", adId));
    } catch (error) {
      console.warn("Error deleting ad from firestore:", error);
    }
    
    const updated = ads.filter(a => a.id !== adId);
    setAds(updated);
    
    const localAds = JSON.parse(localStorage.getItem("dastavval_user_ads") || "[]");
    localStorage.setItem("dastavval_user_ads", JSON.stringify(localAds.filter((a: any) => a.id !== adId)));

    showToast("آگهی مورد نظر حذف شد.");
  };

  const handlePromoteAd = (ad: AdItem) => {
    if (!onTriggerPayment) {
      // Demo immediate promote
      const updated = ads.map(a => a.id === ad.id ? { ...a, isSponsored: true } : a);
      setAds(updated);
      showToast("آگهی شما با موفقیت به بخش ویژه منتقل و در صدر تالار قرار گرفت.");
      return;
    }
    
    onTriggerPayment({
      amount: 150000, // 15,000 Tomans
      description: `ویژه کردن و نردبان آگهی: ${ad.title}`,
      callback: async (success) => {
        if (success) {
          try {
            const adRef = doc(db, "ads", ad.id);
            await updateDoc(adRef, { 
              isSponsored: true,
              sponsoredUntil: Date.now() + (30 * 24 * 60 * 60 * 1000)
            });
            fetchUserAds();
            showToast("آگهی شما با موفقیت ویژه گردید و در صدر نتایج قرار گرفت.");
          } catch (e) {
            console.error("Error promoting ad:", e);
          }
        }
      }
    });
  };

  const filteredAds = useMemo(() => {
    return ads.filter(ad => 
      ad.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ad.factoryName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [ads, searchTerm]);

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8 space-y-6 text-right" dir="rtl">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-5 left-1/2 -translate-x-1/2 z-[200] bg-emerald-800 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-emerald-500 font-bold text-xs"
          >
            <CheckCircle2 size={18} className="text-emerald-300" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Guest / Non-registered Notice Banner */}
      {!user && (
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-3xl p-5 sm:p-6 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shrink-0">
              <UserPlus size={24} />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black">ثبت‌نام و عضویت سریع به عنوان آگهی‌دهنده رسمی</h3>
              <p className="text-xs text-emerald-100 font-medium mt-0.5">
                با عضویت رایگان، آگهی‌های شما مادام‌العمر در پنل شما ذخیره شده و گزارش آمار بازدید و خریداران را به صورت پیامکی دریافت خواهید کرد.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
            <button
              onClick={() => onOpenAuth?.("ad_poster")}
              className="px-5 py-2.5 bg-white text-emerald-900 hover:bg-emerald-50 rounded-xl font-black text-xs shadow-md transition-all cursor-pointer"
            >
              عضویت / ورود با شماره همراه
            </button>
          </div>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-600/20">
            <Megaphone size={28} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-900">پنل مدیریت آگهی‌دهندگان و فروشندگان</h1>
              <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md border border-emerald-200">
                {user ? (user.name || "کاربر احراز هویت شده") : "حالت مهمان"}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-bold mt-1">مدیریت محصولات مازاد، آگهی‌های کف بازار و ارتباط با بنکداران کشور</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <button 
            onClick={openAddModal}
            className="flex-1 md:flex-none px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer"
          >
            <Plus size={18} />
            <span>ثبت آگهی جدید</span>
          </button>

          {onNavigateToBarter && (
            <button
              onClick={onNavigateToBarter}
              className="px-4 py-3 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-xl font-black text-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Repeat size={16} />
              <span>تالار تهاتر کارخانه‌ای</span>
            </button>
          )}

          <button 
            onClick={onNavigateHome}
            className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-black text-xs transition-all cursor-pointer"
          >
            <ChevronRight size={18} className="rotate-180" />
          </button>
        </div>
      </div>

      {/* Stats Quick View */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "آگهی‌های ثبت‌شده شما", value: `${ads.length} کالا`, icon: Package, color: "text-emerald-700", bg: "bg-emerald-50" },
          { label: "مجموع بازدید خریداران", value: ads.length > 0 ? `${ads.length * 42} نفر` : "۰ نفر", icon: Eye, color: "text-teal-700", bg: "bg-teal-50" },
          { label: "استعلام‌های دریافتی", value: "۰ پیام جدید", icon: MessageCircle, color: "text-cyan-700", bg: "bg-cyan-50" },
          { label: "سطح اعتبار آگهی‌گذار", value: user ? "تاییدشده" : "احراز هویت اولیه", icon: ShieldCheck, color: "text-amber-700", bg: "bg-amber-50" },
        ].map((stat, idx) => (
          <div key={idx} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3.5">
            <div className={`w-11 h-11 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center shrink-0`}>
              <stat.icon size={22} />
            </div>
            <div>
              <div className="text-[10.5px] text-slate-400 font-bold">{stat.label}</div>
              <div className="text-sm font-black text-slate-900 mt-0.5">{stat.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-px overflow-x-auto">
        {[
          { id: 'my_ads', label: 'آگهی‌های من', icon: List, count: ads.length },
          { id: 'requests', label: 'استعلام‌ها و تماس‌ها', icon: MessageCircle, count: 0 },
          { id: 'stats', label: 'آمار و گزارش بازدید', icon: TrendingUp },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-5 py-3 text-xs sm:text-sm font-black transition-all flex items-center gap-2 relative shrink-0 cursor-pointer ${
              activeTab === tab.id 
                ? 'text-emerald-700' 
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <tab.icon size={16} />
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                activeTab === tab.id ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
              }`}>
                {tab.count}
              </span>
            )}
            {activeTab === tab.id && (
              <motion.div 
                layoutId="activeTabUnderlinePoster" 
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600 rounded-full" 
              />
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === 'my_ads' && (
          <div className="space-y-4">
            {/* Search & Actions Bar */}
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
              <div className="relative w-full sm:w-80">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                <input 
                  type="text" 
                  placeholder="جستجو در نام آگهی یا کارخانه..." 
                  className="w-full pr-10 pl-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-600"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button 
                  onClick={openAddModal}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus size={16} />
                  <span>آگهی جدید</span>
                </button>
                <button 
                  onClick={fetchUserAds}
                  className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-all cursor-pointer"
                  title="به‌روزرسانی لیست"
                >
                  <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                </button>
              </div>
            </div>

            {/* Ads List */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-white rounded-3xl p-4 border border-slate-100 shadow-sm animate-pulse h-48" />
                ))}
              </div>
            ) : filteredAds.length === 0 ? (
              <div className="bg-white rounded-3xl p-16 text-center border border-dashed border-slate-300 space-y-4">
                <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto text-emerald-600">
                  <Package size={32} />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-800">هیچ آگهی فعالی ثبت نشده است</h3>
                  <p className="text-xs text-slate-400 font-bold mt-1">همین حالا کالای مازاد یا تولید کارخانه خود را به هزاران بنکدار معرفی کنید.</p>
                </div>
                <button 
                  onClick={openAddModal}
                  className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs shadow-lg shadow-emerald-600/20 cursor-pointer"
                >
                  ثبت اولین آگهی فروش
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAds.map((ad, idx) => (
                  <motion.div 
                    layout
                    key={`ad-poster-card-${ad.id || idx}-${idx}`}
                    className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl transition-all group flex flex-col justify-between"
                  >
                    {/* Image Area */}
                    <div className="relative h-44 bg-slate-100 overflow-hidden">
                      <img 
                        src={ad.imageUrl || getAdFallbackImage(ad.category, ad.title)} 
                        alt={ad.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute top-3 right-3 flex flex-col gap-1.5">
                        {ad.isSponsored && (
                          <span className="bg-emerald-600 text-white text-[10px] font-black px-2.5 py-1 rounded-lg shadow-lg flex items-center gap-1 border border-emerald-500">
                            <Sparkles size={12} className="fill-white text-white" />
                            <span>ویژه 🌟</span>
                          </span>
                        )}
                        <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg shadow-lg ${
                          ad.status === 'approved' ? 'bg-emerald-600 text-white' :
                          ad.status === 'pending' ? 'bg-amber-500 text-white' : 'bg-rose-500 text-white'
                        }`}>
                          {ad.status === 'approved' ? 'تایید شده و فعال' : ad.status === 'pending' ? 'در حال بررسی' : 'نیازمند اصلاح'}
                        </span>
                      </div>
                    </div>

                    {/* Content Area */}
                    <div className="p-4 flex-1 space-y-3">
                      <div className="flex justify-between items-start gap-2">
                        <h4 className="text-xs sm:text-sm font-black text-slate-900 line-clamp-2 leading-snug">{ad.title}</h4>
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-slate-500 font-bold">
                        <Building2 size={13} className="text-slate-400 shrink-0" />
                        <span className="truncate">{ad.factoryName}</span>
                      </div>

                      <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed font-medium">
                        {ad.description}
                      </p>

                      <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold block">قیمت عمده کف:</span>
                          <span className="text-xs font-black text-emerald-800 font-mono">{ad.wholesalePrice} تومان</span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button 
                            onClick={() => {
                              setSelectedUpgradeModalAd(ad);
                              setSelectedUpgradeModalMode("edit");
                            }}
                            className="p-2 text-emerald-700 hover:bg-emerald-50 rounded-xl transition-colors cursor-pointer"
                            title="ویرایش مشخصات آگهی"
                          >
                            <Edit3 size={16} />
                          </button>
                          <button 
                            onClick={() => {
                              setSelectedUpgradeModalAd(ad);
                              setSelectedUpgradeModalMode("upgrade");
                            }}
                            className="p-2 text-amber-600 hover:bg-amber-50 rounded-xl transition-colors cursor-pointer"
                            title="نردبان و ویژه کردن"
                          >
                            <TrendingUp size={16} />
                          </button>
                          <button 
                            onClick={() => {
                              setSelectedUpgradeModalAd(ad);
                              setSelectedUpgradeModalMode("delete");
                            }}
                            className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                            title="حذف آگهی"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Actions Area */}
                    {!ad.isSponsored && (
                      <button 
                        onClick={() => {
                          setSelectedUpgradeModalAd(ad);
                          setSelectedUpgradeModalMode("upgrade");
                        }}
                        className="w-full py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 text-[11px] font-black transition-all flex items-center justify-center gap-1.5 border-t border-amber-200 cursor-pointer"
                      >
                        <Zap size={14} className="text-amber-600" />
                        <span>ویژه کردن این آگهی و نمایش در صدر</span>
                      </button>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Requests & Inquiries Tab */}
        {activeTab === 'requests' && (
          <div className="space-y-4">
            <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 text-center space-y-3">
              <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto">
                <MessageCircle size={28} />
              </div>
              <h3 className="text-sm sm:text-base font-black text-slate-900">هنوز استعلام جدیدی ثبت نشده است</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto font-medium">
                پس از انتشار آگهی‌های فروش شما در تالار کف بازار، استعلام‌ها و خریداران مستقیماً از طریق پیامک و این بخش اطلاع‌رسانی خواهند شد.
              </p>
            </div>
          </div>
        )}

        {/* Stats Tab */}
        {activeTab === 'stats' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 space-y-3">
              <h4 className="text-xs font-black text-slate-900">نمودار بازدید روزانه از آگهی‌ها</h4>
              <div className="h-44 bg-slate-50 rounded-2xl flex items-end justify-between p-4 gap-2 border border-slate-100">
                {['شنبه', '۱شنبه', '۲شنبه', '۳شنبه', '۴شنبه', '۵شنبه', 'جمعه'].map((day, dIdx) => (
                  <div key={dIdx} className="flex-1 flex flex-col items-center gap-2">
                    <div 
                      className="w-full bg-emerald-500 rounded-t-lg transition-all" 
                      style={{ height: `${(dIdx + 2) * 14}%` }} 
                    />
                    <span className="text-[10px] font-bold text-slate-400">{day}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 space-y-4">
              <h4 className="text-xs font-black text-slate-900">نکات افزایش فروش و تماس خریداران</h4>
              <div className="space-y-2.5 text-xs text-slate-600 font-medium">
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-start gap-2">
                  <Check size={16} className="text-emerald-700 shrink-0 mt-0.5" />
                  <span>درج تصاویر واقعی از کارتن و بسته‌بندی کالا تماس خریداران را ۳ برابر می‌کند.</span>
                </div>
                <div className="p-3 bg-teal-50 rounded-xl border border-teal-200 flex items-start gap-2">
                  <Check size={16} className="text-teal-700 shrink-0 mt-0.5" />
                  <span>فعال کردن گزینه «امکان تهاتر» برای کالاهای مازاد خط تولید منجر به تسویه سریع‌تر موجودی می‌شود.</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ADD / EDIT AD MODAL */}
      <AnimatePresence>
        {isAddingAd && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs overflow-y-auto" dir="rtl">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl relative max-h-[90vh] flex flex-col my-auto"
            >
              {/* Modal Header */}
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-emerald-50 to-white shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-600 text-white rounded-2xl flex items-center justify-center shadow-md">
                    {editingAd ? <Edit3 size={20} /> : <Plus size={20} />}
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900">
                      {editingAd ? "ویرایش مشخصات آگهی" : "ثبت آگهی جدید فروش در تالار کف بازار"}
                    </h3>
                    <p className="text-[11px] text-slate-500 font-bold">اطلاعات کالا به همراه قیمت کف کارخانه را وارد فرمایید</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsAddingAd(false)}
                  className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Form Content */}
              <form onSubmit={handleSaveAd} className="p-6 overflow-y-auto flex-1 space-y-4 text-xs">
                {/* Title */}
                <div className="space-y-1.5">
                  <label className="font-black text-slate-800 block">عنوان آگهی کالا یا خدمات عمده:</label>
                  <input 
                    type="text"
                    required
                    value={adForm.title}
                    onChange={e => setAdForm({ ...adForm, title: e.target.value })}
                    placeholder="مثال: فروش عمده ۴۰۰ کارتن کیک دوقلو با تخفیف ویژه نقدی"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:bg-white focus:border-emerald-600 outline-none"
                  />
                </div>

                {/* Category & Location */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="font-black text-slate-800 block">نوع آگهی و دسته‌بندی:</label>
                    <select
                      value={adForm.category}
                      onChange={e => setAdForm({ ...adForm, category: e.target.value as any })}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:bg-white focus:border-emerald-600 outline-none"
                    >
                      <option value="under_market">📉 زیر قیمت بازار (کف قیمت)</option>
                      <option value="liquid">🔥 حراج و تسویه فوری مازاد تولید</option>
                      <option value="direct_supply">📦 تامین مستقیم و بدون واسطه خط تولید</option>
                      <option value="materials">🧪 مواد اولیه و مواد شیمیایی خوراکی</option>
                      <option value="equipment">⚙️ ماشین‌آلات و خطوط تولید صنعتی</option>
                      <option value="services">🛠️ خدمات صنعتی، چاپ و بسته‌بندی</option>
                      <option value="barter">🔄 معاوضه و تهاتر کارخانه‌ای</option>
                    </select>
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="font-black text-slate-800 block">استان و شهر محل بارگیری:</label>
                    <StrictCityProvinceSelector
                      selectedCity={adForm.city}
                      selectedProvince={adForm.province}
                      onSelect={(c, p) => setAdForm({ ...adForm, city: c, province: p })}
                      variant="button"
                      className="w-full text-right font-bold"
                      placeholder="کلیک کنید تا استان و شهر بارگیری کالا را انتخاب کنید"
                    />
                  </div>
                </div>

                {/* Dynamic Product Category Selection */}
                <div className="space-y-1.5">
                  <label className="font-black text-slate-800 block">دسته‌بندی موضوعی کالا:</label>
                  <select
                    value={adForm.productCategory}
                    onChange={e => setAdForm({ ...adForm, productCategory: e.target.value })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:bg-white focus:border-emerald-600 outline-none cursor-pointer"
                  >
                    {dynamicCategories.map((cat) => (
                      <option key={cat.id} value={cat.name}>
                        {cat.emoji} {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Pricing Box */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl">
                  <div className="space-y-1">
                    <label className="font-black text-emerald-900 block">قیمت عمده کف (تومان):</label>
                    <input 
                      type="text"
                      required
                      value={adForm.wholesalePrice}
                      onChange={e => setAdForm({ ...adForm, wholesalePrice: e.target.value })}
                      placeholder="مثال: ۱۴۵,۰۰۰"
                      className="w-full p-2.5 bg-white border border-emerald-300 rounded-xl font-mono font-bold outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-black text-emerald-900 block">قیمت مصرف‌کننده روی جلد:</label>
                    <input 
                      type="text"
                      value={adForm.marketPrice}
                      onChange={e => setAdForm({ ...adForm, marketPrice: e.target.value })}
                      placeholder="مثال: ۲۲۰,۰۰۰"
                      className="w-full p-2.5 bg-white border border-emerald-300 rounded-xl font-mono font-bold outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-black text-emerald-900 block">موجودی / حداقل سفارش:</label>
                    <input 
                      type="text"
                      value={adForm.quantity}
                      onChange={e => setAdForm({ ...adForm, quantity: e.target.value })}
                      placeholder="مثال: ۵۰۰ کارتن (حداقل ۱۰)"
                      className="w-full p-2.5 bg-white border border-emerald-300 rounded-xl font-bold outline-none"
                    />
                  </div>
                </div>

                {/* Image Upload Area */}
                <div className="space-y-2">
                  <label className="font-black text-slate-800 block">تصویر شاخص آگهی:</label>
                  <div className="flex items-center gap-3">
                    <label className="px-4 py-3 bg-slate-100 hover:bg-slate-200 border border-dashed border-slate-300 rounded-2xl flex items-center gap-2 cursor-pointer transition-all">
                      <Camera size={18} className="text-slate-500" />
                      <span className="font-bold text-slate-700">
                        {isUploadingImage ? "در حال آپلود..." : "انتخاب یا آپلود عکس"}
                      </span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleImageFileChange}
                        className="hidden" 
                      />
                    </label>

                    {adForm.imageUrl && (
                      <div className="w-12 h-12 rounded-xl border border-slate-200 overflow-hidden shrink-0">
                        <img src={adForm.imageUrl} alt="preview" className="w-full h-full object-cover" />
                      </div>
                    )}

                    <input 
                      type="text"
                      value={adForm.imageUrl}
                      onChange={e => setAdForm({ ...adForm, imageUrl: e.target.value })}
                      placeholder="یا آدرس اینترنتی تصویر (URL)"
                      className="flex-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-[11px] outline-none"
                      dir="ltr"
                    />
                  </div>
                </div>

                {/* Company & Contact */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-black text-slate-700 block">نام کارخانه یا فروشگاه:</label>
                    <input 
                      type="text"
                      value={adForm.factoryName}
                      onChange={e => setAdForm({ ...adForm, factoryName: e.target.value })}
                      placeholder="مثال: بازرگانی البرز"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-black text-slate-700 block">نام مسئول پاسخگو:</label>
                    <input 
                      type="text"
                      value={adForm.contactPerson}
                      onChange={e => setAdForm({ ...adForm, contactPerson: e.target.value })}
                      placeholder="مثال: مهندس حسینی"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none"
                    />
                  </div>
                </div>

                {/* Mandatory Phone Verification */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
                  <label className="font-black text-slate-800 text-xs block mb-2">شماره تماس مستقیم و تایید پیامکی مالک آگهی:</label>
                  <SmsPhoneVerifier
                    phone={adForm.contactPhone}
                    onPhoneChange={(phone) => setAdForm(prev => ({ ...prev, contactPhone: phone }))}
                    onVerificationSuccess={(verifiedPhone) => {
                      setIsPhoneVerified(true);
                      setAdForm(prev => ({ ...prev, contactPhone: verifiedPhone }));
                      showToast("شماره همراه شما با موفقیت تایید شد.");
                    }}
                    isVerified={isPhoneVerified || !!editingAd}
                  />
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label className="font-black text-slate-800 block">توضیحات و مشخصات کالا:</label>
                  <textarea 
                    rows={3}
                    value={adForm.description}
                    onChange={e => setAdForm({ ...adForm, description: e.target.value })}
                    placeholder="مشخصات انقضا، دارا بودن سیب سلامت، نحوه بسته‌بندی و شرایط ارسال را وارد نمایید..."
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:bg-white focus:border-emerald-600 outline-none resize-none"
                  />
                </div>

                {/* Barter Option Checkbox */}
                <label className="flex items-center gap-2.5 p-3 bg-teal-50/80 border border-teal-200 rounded-2xl cursor-pointer select-none">
                  <input 
                    type="checkbox"
                    checked={adForm.isBarterAllowed}
                    onChange={e => setAdForm({ ...adForm, isBarterAllowed: e.target.checked })}
                    className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500"
                  />
                  <div className="text-xs">
                    <span className="font-black text-teal-950">امکان تهاتر و معاوضه با مواد اولیه یا اقلام دیگر وجود دارد</span>
                    <span className="text-[10px] text-teal-700 block font-medium">این آگهی در تالار تهاتر نیز نمایش داده خواهد شد</span>
                  </div>
                </label>

                {/* Action Buttons */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsAddingAd(false)}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-black cursor-pointer"
                  >
                    انصراف
                  </button>
                  <button
                    type="submit"
                    disabled={!editingAd && !isPhoneVerified}
                    className={`px-6 py-2.5 rounded-xl font-black shadow-md flex items-center gap-2 cursor-pointer ${
                      editingAd || isPhoneVerified
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white active:scale-95"
                        : "bg-slate-200 text-slate-400 cursor-not-allowed"
                    }`}
                  >
                    <Check size={16} />
                    <span>{editingAd ? "ذخیره تغییرات" : isPhoneVerified ? "تایید و انتشار آگهی" : "نیاز به تایید پیامکی شماره"}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit / Upgrade / Delete Modal */}
      <AdEditUpgradeModal
        isOpen={!!selectedUpgradeModalAd}
        onClose={() => setSelectedUpgradeModalAd(null)}
        ad={selectedUpgradeModalAd}
        mode={selectedUpgradeModalMode}
        onAdUpdated={handleModalAdUpdated}
        onAdDeleted={handleModalAdDeleted}
        currentUser={user}
      />
    </div>
  );
};

export default AdPosterPanel;
