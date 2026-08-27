import { useState, useEffect } from "react";
import { uploadToParsPackStorage } from "../utils/storage";
import { motion, AnimatePresence } from "motion/react";
import { db } from "../lib/data-layer";
import { collection, addDoc } from "../lib/data-layer";
import SpecialPriceBagIcon from "./SpecialPriceBagIcon";
import { Product } from "../types";
import { getDisplayImageUrl } from "../lib/image-utils";
import { ProductImage } from "./ProductImage";
import { AdItem, getAdFallbackImage } from "../utils/ad-utils";
import AddAdButton from "./AddAdButton";
import { getProductRolePricing } from "../lib/pricing";
import {
  Sparkles, 
  Plus,
  Building2, 
  Phone, 
  Calendar, 
  CheckCircle2, 
  Eye, 
  FileText, 
  Search, 
  ShieldCheck, 
  Megaphone, 
  ArrowLeftRight, 
  ChevronLeft, 
  Info, 
  X, 
  ArrowUpRight, 
  Upload,
  AlertTriangle,
  BadgePercent,
  TrendingDown,
  Lock,
  Check,
  UserCheck,
  ShieldAlert,
  ChevronDown,
  LockKeyhole,
  Boxes,
  UploadCloud,
  Briefcase,
  Wrench,
  Trash2,
  Camera,
  Package,
  LayoutGrid,
  List,
  Flame,
  RefreshCw,
  Percent
} from "lucide-react";

const initialAds: AdItem[] = [];

interface AdBoardProps {
  onTriggerPayment?: (paymentInfo: {
    amount: number;
    description: string;
    callback: (success: boolean) => void;
  }) => void;
  isMini?: boolean;
  onNavigateToBillboard?: () => void;
  onNavigateHome?: () => void;
  user?: any;
  products?: Product[];
  onSelectProduct?: (product: Product) => void;
  sponsoredAds?: AdItem[];
  onUpdateB2bConfig?: (updatedConfig: any) => Promise<void>;
  b2bConfig?: any;
}

export default function AdBoard({ 
  onTriggerPayment, 
  isMini = false, 
  onNavigateToBillboard, 
  onNavigateHome, 
  user, 
  products, 
  onSelectProduct,
  sponsoredAds = [],
  onUpdateB2bConfig,
  b2bConfig
}: AdBoardProps) {
  const [ads, setAds] = useState<AdItem[]>(sponsoredAds);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingAd, setEditingAd] = useState<AdItem | null>(null);
  const [selectedAdDetail, setSelectedAdDetail] = useState<AdItem | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<"all" | "under_market" | "liquid" | "direct_supply">("all");
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [showRuleOverlay, setShowRuleOverlay] = useState(false);
  const [isIntroExpanded, setIsIntroExpanded] = useState(false);

  // Secure Escrow Interaction Modal State
  const [escrowModalAd, setEscrowModalAd] = useState<AdItem | null>(null);
  const [escrowSuccess, setEscrowSuccess] = useState(false);
  const [escrowLoading, setEscrowLoading] = useState(false);
  const [buyerPhoneInput, setBuyerPhoneInput] = useState("");
  const [buyerMessage, setBuyerMessage] = useState("");

  // Form states (Proxying phone inputs internally and forbidding public publishing)
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [factoryName, setFactoryName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [quantity, setQuantity] = useState("");
  const [category, setCategory] = useState<"under_market" | "liquid" | "direct_supply">("under_market");
  const [wholesalePrice, setWholesalePrice] = useState("");
  const [marketPrice, setMarketPrice] = useState("");
  const [buyerProfit, setBuyerProfit] = useState("");
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]); // Multiple image uploads
  const [isSpecialRequested, setIsSpecialRequested] = useState(false);
  const [specialMessage, setSpecialMessage] = useState("تماس فوری جهت تایید پلمپ");
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  // Validation Warnings
  const [phoneWarning, setPhoneWarning] = useState("");

  // Sync ads with props when they change
  useEffect(() => {
    setAds(sponsoredAds);
  }, [sponsoredAds]);

  const loadAds = () => {
    // We now prefer props, but keep local fallback for offline/temp state if needed
    if (sponsoredAds && sponsoredAds.length > 0) {
      setAds(sponsoredAds);
      return;
    }
    const savedAds = localStorage.getItem("dastavval_sponsored_ads_v2");
    if (savedAds) {
      try {
        const parsed = JSON.parse(savedAds);
        if (Array.isArray(parsed)) {
          const cleaned = parsed.filter((item: any) => !(item.id && typeof item.id === 'string' && item.id.startsWith("ad-init-")) && item.category !== ("service" as any) && item.category !== ("raw_material" as any) && item.category !== "equipment");
          setAds(cleaned);
        }
      } catch (e) {}
    }
  };

  useEffect(() => {
    loadAds();
    window.addEventListener("dastavval_ads_updated", loadAds);
    return () => {
      window.removeEventListener("dastavval_ads_updated", loadAds);
    };
  }, []);

  const saveAdsToStorage = async (newAds: AdItem[]) => {
    setAds(newAds);
    localStorage.setItem("dastavval_sponsored_ads_v2", JSON.stringify(newAds));
    
    // Sync with server via b2bConfig
    if (onUpdateB2bConfig && b2bConfig) {
      await onUpdateB2bConfig({
        ...b2bConfig,
        sponsoredAds: newAds
      });
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const result = await uploadToParsPackStorage(file, "ads");
      if (result.success && result.url) {
        setUploadedImage(result.url);
      } else {
        const reader = new FileReader();
        reader.onloadend = () => {
          setUploadedImage(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  // Helper to validate and clean phone number inputs in descriptions to ensure site mediation
  const detectAndScrubPhoneNumbers = (text: string) => {
    const phoneRegex = /(۰|0|۹|9)[۰-۹0-9]{9,10}/g;
    return text.replace(phoneRegex, "[تلفن مستقیم طبق قوانین حذف شد - معامله از طریق واسطه امن]");
  };

  const handleCreateAdAdminApproval = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !wholesalePrice || !marketPrice || !contactPhone) return;

    // Reject direct public display of phones and ensure rules are met
    const cleanTitle = detectAndScrubPhoneNumbers(title);
    const cleanDescription = detectAndScrubPhoneNumbers(description);

    // Rule enforcement: Check if user mentions a common forbidden brand to protect reputation
    const forbiddenBrands = ["چی‌توز", "مینو", "میهن", "تبرک", "یک‌ویک", "تبرک", "چی توز", "دامداران", "کاله"];
    let finalTitle = cleanTitle;
    let finalDesc = cleanDescription;
    
    forbiddenBrands.forEach(brand => {
      if (finalTitle.includes(brand) || finalDesc.includes(brand)) {
        finalTitle = finalTitle.replace(new RegExp(brand, "g"), "[برند تجاری طبق قوانین سانسور شد]");
        finalDesc = finalDesc.replace(new RegExp(brand, "g"), "[به منظور جلوگیری از آسیب به اعتبار نمایندگی‌های رسمی، نام برند تجاری حذف و با کلمه عمومی جایگزین گردید]");
      }
    });

    // Auto calculate buyer savings if empty
    const numericWholesale = parseInt(wholesalePrice.replace(/[^0-9]/g, "")) || 10000;
    const numericMarket = parseInt(marketPrice.replace(/[^0-9]/g, "")) || 15000;
    const savings = numericMarket - numericWholesale;
    const profitPercentage = Math.round((savings / numericMarket) * 100) || 30;
    const calculatedProfitText = `${profitPercentage}٪ سود ناخالص (${savings.toLocaleString()} تومان اختلاف)`;

    let finalBadge = "📦 تامین مستقیم";
    if (category === "under_market") finalBadge = "📉 زیر قیمت بازار";
    else if (category === "liquid") finalBadge = "🔥 حراج عمده";

    const newAd: AdItem = {
      id: `ad-${Date.now()}`,
      title: finalTitle,
      description: finalDesc || "درخواست خرید کالا با شرایط توافقی و ضمانت پرداخت امن واسطه‌ای دست اول.",
      factoryName: factoryName || "متقاضی تامین مستقیم",
      contactPerson: contactPerson || "مدیریت مربوطه",
      contactPhone: contactPhone, // Saved privately for admin use
      badgeText: finalBadge,
      category,
      quantity: quantity || "توافقی",
      wholesalePrice: wholesalePrice.includes("تومان") || wholesalePrice.includes("توافقی") ? wholesalePrice : `${wholesalePrice} تومان`,
      marketPrice: marketPrice.includes("تومان") || marketPrice.includes("توافقی") ? marketPrice : `${marketPrice} تومان`,
      buyerProfit: buyerProfit || calculatedProfitText,
      isSponsored: false,
      date: new Date().toLocaleDateString("fa-IR"),
      imageUrl: uploadedImages[0] || uploadedImage || getAdFallbackImage(finalTitle, category),
      imageUrls: uploadedImages.length > 0 ? uploadedImages : (uploadedImage ? [uploadedImage] : []),
      status: "pending", // Starts as pending, needs admin approval!
      specialRequest: isSpecialRequested,
      specialRequestMessage: isSpecialRequested ? specialMessage : undefined
    };

    const updated = [newAd, ...ads];
    saveAdsToStorage(updated);
    
    setSubmitSuccess(true);
    setTimeout(() => {
      setSubmitSuccess(false);
      setIsSubmitModalOpen(false);
      // Reset form
      setTitle("");
      setDescription("");
      setFactoryName("");
      setContactPerson("");
      setContactPhone("");
      setQuantity("");
      setWholesalePrice("");
      setMarketPrice("");
      setBuyerProfit("");
      setUploadedImage(null);
      setUploadedImages([]);
    }, 4500);
  };

  // Admin Actions to approve/reject
  const triggerAutoChannelPost = (title: string, content: string, category: string, actionLabel?: string, actionUrl?: string) => {
    try {
      const autoSettings = JSON.parse(localStorage.getItem("dastavval_autopost_settings") || "{}");
      // Default to true if not specified
      const isEnabled = autoSettings.new_ad !== false;
      if (!isEnabled) return;

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
      console.error("Auto post in AdBoard failed:", e);
    }
  };

  const handleApproveAd = (id: string) => {
    const adToApprove = ads.find(ad => ad.id === id);
    const updated = ads.map(ad => {
      if (ad.id === id) {
        return { 
          ...ad, 
          status: "approved" as const,
          badgeText: ad.category === "under_market" ? "📉 زیر قیمت بازار" : ad.category === "liquid" ? "🔥 حراج عمده" : "📦 تامین مستقیم" 
        };
      }
      return ad;
    });
    saveAdsToStorage(updated);

    if (adToApprove) {
      triggerAutoChannelPost(
        `📢 آگهی جدید همکار: ${adToApprove.title}`,
        `یک آگهی جدید با عنوان "${adToApprove.title}" با موفقیت تایید و در تالار بیلبورد دست اول قرار گرفت.\n\nتوضیحات: ${adToApprove.description || 'درخواست خرید مستقیم.'}\nقیمت اعلامی کف: ${adToApprove.wholesalePrice}`,
        "info",
        "مشاهده آگهی در تالار بیلبورد",
        `#billboard`
      );
    }
  };

  const handleRejectAd = (id: string, reason: string = "عدم انطباق با قوانین عدم افشای مستقیم برند") => {
    const updated = ads.map(ad => {
      if (ad.id === id) {
        return { ...ad, status: "rejected" as const, rejectionReason: reason };
      }
      return ad;
    });
    saveAdsToStorage(updated);
  };

  // Reset demo data to default to clean slate
  const handleResetDemoData = () => {
    saveAdsToStorage(initialAds);
  };

  // Helper to convert numbers to Persian digits
  const toPersianDigits = (num: number | string): string => {
    return String(num).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[parseInt(d, 10)]);
  };

  // Filtering Logic: Only include products that are EXPLICITLY marked as isKafBazaar
  const effectiveKafProducts = (products || []).filter(p => !p.disabled && p.isKafBazaar === true);

  const allOpportunities = [
    ...ads.filter(ad => !(ad.id && typeof ad.id === 'string' && ad.id.startsWith("ad-init-"))),
    ...effectiveKafProducts.map((p: any) => {
        const rolePricing = getProductRolePricing(p, user);
        const userWholesalePrice = rolePricing.unitWholesalePrice;
        const customerWholesalePrice = rolePricing.customerPrice;
        const repFloorPrice = rolePricing.representativeFloorPrice;
        const consumerPrice = rolePricing.consumerPrice;
        const profitPercent = rolePricing.profitMarginPercent || (consumerPrice > userWholesalePrice ? Math.round(((consumerPrice - userWholesalePrice) / consumerPrice) * 100) : 25);
        
        const isLiquid = !!(p.isLiquid);
        const category: "under_market" | "liquid" | "direct_supply" = isLiquid ? "liquid" : "under_market";
        const badgeText = isLiquid ? "🔥 حراج مازاد خط تولید" : "📉 کف قیمت بازار";

        return {
          id: `kaf-${p.id}`,
          title: p.name,
          description: p.description || `فروش ویژه با کف قیمت بازار مستقیم از کارخانه ${p.brand || p.factory_name || p.sellerName || "کارخانه همکار"}. بسته‌بندی ${p.carton_pack_count || p.unitsPerCarton || 24} عددی در هر کارتن. حداقل سفارش ${p.min_order_cartons || p.minOrderCartons || 2} کارتن.`,
          factoryName: p.brand || p.factory_name || p.sellerName || "کارخانه همکار",
          contactPerson: "پشتیبانی پلتفرم (معامله امن)",
          contactPhone: "",
          badgeText,
          category: category as any,
          quantity: `${p.stock_quantity_cartons || 300} کارتن`,
          wholesalePrice: `${userWholesalePrice.toLocaleString('fa-IR')} تومان`,
          customerPrice: `${customerWholesalePrice.toLocaleString('fa-IR')} تومان`,
          repPrice: `${repFloorPrice.toLocaleString('fa-IR')} تومان`,
          marketPrice: `${consumerPrice.toLocaleString('fa-IR')} تومان`,
          buyerProfit: `${profitPercent}٪ سود (${Math.max(0, consumerPrice - userWholesalePrice).toLocaleString('fa-IR')} ت)`,
          isSponsored: true,
          date: "۱۴۰۵/۰۵/۲۲",
          imageUrl: p.image_url,
          status: "approved" as const,
          specialRequest: true,
          isHotFireDeal: p.isHotFireDeal || p.isLiquid,
          rawProduct: p
        };
      })
  ];

  const filteredAds = allOpportunities.filter((ad) => {
    // Show only approved ones on the main public dashboard
    // We strictly exclude "rejected" or "pending" status for public view.
    const isApproved = ad.status === "approved";
    
    const searchLow = searchQuery.toLowerCase();
    const matchesSearch = 
      ad.title.toLowerCase().includes(searchLow) ||
      (ad.description && ad.description.toLowerCase().includes(searchLow)) ||
      ad.factoryName.toLowerCase().includes(searchLow);
    
    const matchesCategory = activeCategoryFilter === "all" || ad.category === activeCategoryFilter;
    
    return isApproved && matchesSearch && matchesCategory;
  }).sort((a, b) => {
    if (a.isSponsored && !b.isSponsored) return -1;
    if (!a.isSponsored && b.isSponsored) return 1;
    return 0;
  });

  // Calculate the exact real count of active approved opportunities
  const displayOpportunityCount = filteredAds.length;

  // Real Dynamic Calculations for Bento Metrics:
  const realTotalVolumeToman = allOpportunities.reduce((sum, item: any) => {
    let unitPrice = 0;
    let cartonCount = 200;

    if (item.rawProduct) {
      unitPrice = Number(item.rawProduct.price || item.rawProduct.bulk_price || item.rawProduct.wholesalePrice || 0);
      cartonCount = Number(item.rawProduct.stock_quantity_cartons || item.rawProduct.min_order_cartons || 250);
    } else {
      unitPrice = parseInt(String(item.wholesalePrice || '').replace(/[^0-9]/g, ''), 10) || 0;
      cartonCount = parseInt(String(item.quantity || '').replace(/[^0-9]/g, ''), 10) || 200;
    }

    const itemTotal = unitPrice * cartonCount;
    return sum + (itemTotal > 0 ? itemTotal : 20_000_000);
  }, 0);

  const formatRealVolumeText = (valInToman: number) => {
    if (valInToman <= 0) return "۱.۵ میلیارد تومان";
    if (valInToman >= 1_000_000_000) {
      const billions = (valInToman / 1_000_000_000).toFixed(1);
      return `${toPersianDigits(billions)} میلیارد تومان`;
    } else {
      const millions = Math.round(valInToman / 1_000_000);
      return `${toPersianDigits(millions.toLocaleString('fa-IR'))} میلیون تومان`;
    }
  };

  const realVolumeText = `${formatRealVolumeText(realTotalVolumeToman)} حجم بار فعال`;

  const realMaxProfitMarginPercent = allOpportunities.reduce((max, item: any) => {
    let profit = 0;
    if (item.rawProduct) {
      const consumer = Number(item.rawProduct.consumer_price || item.rawProduct.consumerPrice || 0);
      const wholesale = Number(item.rawProduct.price || item.rawProduct.bulk_price || item.rawProduct.wholesalePrice || 0);
      if (consumer > wholesale && consumer > 0) {
        profit = Math.round(((consumer - wholesale) / consumer) * 100);
      } else if (item.rawProduct.discount) {
        profit = Number(item.rawProduct.discount);
      }
    } else {
      const match = String(item.buyerProfit || '').match(/(\d+)٪/);
      if (match) profit = parseInt(match[1], 10);
    }
    return profit > max ? profit : max;
  }, 0);

  const realMaxProfitText = `تا ${toPersianDigits(realMaxProfitMarginPercent > 0 ? realMaxProfitMarginPercent : 35)}٪ سود خالص خرید نقدی`;

  const realFactoriesCount = new Set(allOpportunities.map(o => o.factoryName).filter(Boolean)).size;
  const realPhysicalText = allOpportunities.length > 0 
    ? `۱۰۰٪ فیزیکی مستقیم از ${toPersianDigits(realFactoriesCount > 0 ? realFactoriesCount : 1)} کارخانه کشور`
    : "۱۰۰٪ فیزیکی مستقیم از درب سوله";

  // Pending ads for admin view
  const pendingAds = ads.filter(ad => ad.status === "pending" || !ad.status);

  // Escrow Handler
  const handleEscrowSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!buyerPhoneInput || !escrowModalAd) return;
    setEscrowLoading(true);
    
    const newId = `SB-${Math.floor(1000 + Math.random() * 9000)}`;
    const newReq = {
      id: newId,
      adId: escrowModalAd.id || '',
      productTitle: escrowModalAd.title || 'کالای زیر قیمت',
      wholesalePrice: escrowModalAd.wholesalePrice || 'توافقی',
      marketPrice: escrowModalAd.marketPrice || '',
      buyerProfit: escrowModalAd.buyerProfit || '',
      quantity: escrowModalAd.quantity || 'نامشخص',
      brand: escrowModalAd.factoryName || 'نامشخص',
      description: escrowModalAd.description || '',
      buyerPhone: buyerPhoneInput,
      buyerMessage: buyerMessage || '',
      status: 'pending',
      date: new Date().toLocaleDateString('fa-IR'),
      createdAt: new Date().toISOString()
    };

    try {
      // 1. Save to mock/real Firestore
      await addDoc(collection(db, "safe_buy_requests"), newReq);
      
      // 2. Also save to localStorage as a fallback
      const existing = JSON.parse(localStorage.getItem("dastavval_safe_buy_requests") || "[]");
      localStorage.setItem("dastavval_safe_buy_requests", JSON.stringify([newReq, ...existing]));

      // 3. Trigger SMS notification to user and admin via send-callback-sms
      fetch("/api/sms/send-callback-sms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          phone: buyerPhoneInput, 
          details: `خرید امن: ${escrowModalAd.title || 'کالا'}` 
        })
      }).catch(err => console.warn("Safe Buy SMS trigger notice:", err));
    } catch (err) {
      console.error("Error saving safe buy request", err);
    }

    setTimeout(() => {
      setEscrowLoading(false);
      setEscrowSuccess(true);

      setTimeout(() => {
        setEscrowSuccess(false);
        setEscrowModalAd(null);
        setBuyerPhoneInput("");
        setBuyerMessage("");
      }, 3500);
    }, 1500);
  };

  const renderDetailModal = () => (
    <AnimatePresence>
      {selectedAdDetail && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-white/60 backdrop-blur-md overflow-y-auto animate-fade-in"
          onClick={() => setSelectedAdDetail(null)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-[2rem] p-6 sm:p-8 shadow-2xl w-full max-w-xl border border-slate-100 text-right relative overflow-y-auto max-h-[90vh]"
            dir="rtl"
          >
            <button
              onClick={() => setSelectedAdDetail(null)}
              className="absolute top-5 left-5 w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-all cursor-pointer"
            >
              <X size={16} />
            </button>

            <div className="space-y-6 mt-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="bg-emerald-50 text-emerald-700 text-[10px] font-black px-3 py-1 rounded-full border border-emerald-100 flex items-center gap-1">
                  <ShieldCheck size={12} />
                  واسطه‌گری امن پلتفرم دست‌اول
                </span>
                <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                  <Calendar size={11} />
                  ثبت در {selectedAdDetail.date}
                </span>
              </div>

              {/* Product Image - Clean Large Crisp Frame */}
              <div className="w-full h-64 sm:h-80 md:h-96 rounded-2xl overflow-hidden bg-slate-50 relative flex items-center justify-center border border-slate-200 shadow-xs group">
                <img
                  src={selectedAdDetail.imageUrl ? getDisplayImageUrl(selectedAdDetail.imageUrl) : getAdFallbackImage(selectedAdDetail.title, selectedAdDetail.category)}
                  alt={selectedAdDetail.title}
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-xs px-3 py-1.5 rounded-xl text-xs font-black text-slate-800 shadow-md border border-slate-100 flex items-center gap-1.5">
                  <span>{selectedAdDetail.category === "liquid" ? "🔥 حراج مازاد خط تولید" : selectedAdDetail.category === "under_market" ? "📉 کف قیمت بازار" : "📦 تامین کارخانه"}</span>
                </div>
                <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-xs text-slate-900 text-xs font-bold px-3 py-1.5 rounded-xl shadow-md flex items-center gap-1.5 border border-slate-200">
                  <Package size={14} className="text-emerald-400" />
                  <span>موجودی بار: {selectedAdDetail.quantity}</span>
                </div>
              </div>

              <div>
                <span className="text-[10px] text-indigo-600 font-black block mb-1">
                  🏢 کارخانه یا تامین‌کننده: {selectedAdDetail.factoryName}
                </span>
                <h4 className="font-black text-sm sm:text-base text-slate-900 leading-relaxed">
                  {selectedAdDetail.title}
                </h4>
              </div>

              {/* PRICING TABULAR CARD (WHOLSALE vs MARKET vs DIFFERENCE) */}
              <div className="bg-slate-50 rounded-2xl border border-slate-100 p-4 space-y-3.5">
                <div className="flex items-center gap-1.5 border-b border-slate-200/50 pb-2">
                  <BadgePercent size={16} className="text-emerald-600" />
                  <span className="text-xs font-black text-slate-800">شفاف‌سازی و تحلیل قیمت کالا (زیر قیمت بازار):</span>
                </div>

                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-2xs">
                    <span className="text-[9px] text-slate-400 font-black block mb-1">قیمت بازار آزاد:</span>
                    <span className="text-xs font-bold text-slate-500 line-through block">{selectedAdDetail.marketPrice}</span>
                  </div>
                  <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-100/50 shadow-2xs">
                    <span className="text-[9px] text-emerald-800 font-black block mb-1">قیمت خرید عمده:</span>
                    <span className="text-xs font-black text-emerald-700 block">{selectedAdDetail.wholesalePrice}</span>
                  </div>
                  <div className="bg-amber-50/50 p-3 rounded-xl border border-amber-100/50 shadow-2xs">
                    <span className="text-[9px] text-amber-800 font-black block mb-1">حاشیه سود خریدار:</span>
                    <span className="text-[10px] font-black text-amber-700 block leading-tight">{selectedAdDetail.buyerProfit}</span>
                  </div>
                </div>

                {(selectedAdDetail as any).repPrice && (
                  <div className="p-2.5 bg-indigo-50/70 rounded-xl border border-indigo-100/70 flex items-center justify-between text-[11px] font-bold text-indigo-950">
                    <span className="flex items-center gap-1.5 text-indigo-800">
                      <Percent size={13} className="text-indigo-600" />
                      <span>نرخ کف کارخانه برای عاملیت و نمایندگان رسمی (۱۰٪ تخفیف مازاد):</span>
                    </span>
                    <span className="font-mono font-black text-indigo-900 bg-white px-2.5 py-0.5 rounded-lg border border-indigo-200 shadow-2xs">
                      {(selectedAdDetail as any).repPrice}
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-center text-[10px] text-slate-500 font-bold pt-1.5">
                  <span>میزان بار موجود جهت بارگیری:</span>
                  <span className="text-slate-800 font-black">📦 {selectedAdDetail.quantity}</span>
                </div>
              </div>

              {/* Brand Protection Warning */}
              <div className="bg-amber-50/40 border border-amber-100 rounded-2xl p-4 flex gap-3 text-right">
                <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={16} />
                <div className="space-y-1">
                  <h5 className="text-[11px] font-black text-amber-900">سیاست صیانت و محافظت از ارزش برندهای تولیدی</h5>
                  <p className="text-[10px] text-amber-800/80 font-bold leading-relaxed">
                    به منظور ممانعت از ریزش ناگهانی قیمت رسمی و آسیب به شبکه نمایندگی‌های فعال کارخانه در کل کشور، مشخصات دقیق برند صرفاً به خریدار واقعی و پس از تایید توسط واسطه امن دست‌اول ارائه خواهد شد.
                  </p>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-black text-slate-400 block">شرح کامل درخواست و شرایط تحویل:</span>
                <p className="text-xs text-slate-600 leading-relaxed font-bold bg-slate-50 p-4 rounded-xl border border-slate-100 whitespace-pre-line">
                  {selectedAdDetail.description}
                </p>
              </div>

              {/* Contact Proxy & Site Mediation Block */}
              <div className="bg-indigo-50/60 border border-indigo-100 rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-indigo-800">
                  <LockKeyhole size={16} />
                  <span className="text-[11px] font-black">اطلاعات تماس مستقیم (پنهان به دستور پلتفرم):</span>
                </div>
                <p className="text-[10px] text-indigo-700 font-bold leading-relaxed">
                  طبق قوانین پیشگیری از تخلف و انحصار بازار، برای برقراری ارتباط با مالک کالا باید درخواست انجام معامله خود را از طریق دکمه واسطه زیر ثبت نمایید. کارشناسان ما تا ۱۵ دقیقه آینده جهت هماهنگی‌های لازم اقدام می‌کنند.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      if ((selectedAdDetail as any).rawProduct && onSelectProduct) {
                        onSelectProduct((selectedAdDetail as any).rawProduct);
                        setSelectedAdDetail(null);
                      } else {
                        setEscrowModalAd(selectedAdDetail);
                        setSelectedAdDetail(null);
                      }
                    }}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 cursor-pointer active:scale-95"
                  >
                    <ShieldCheck size={16} />
                    <span>{(selectedAdDetail as any).rawProduct ? "ثبت سفارش مستقیم این کالا" : "شروع معامله امن با واسطه‌گری"}</span>
                  </button>
                  <button
                    onClick={() => {
                      setEscrowModalAd(selectedAdDetail);
                      setSelectedAdDetail(null);
                    }}
                    className="w-full py-3 bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                  >
                    <Phone size={15} className="text-indigo-600" />
                    <span>درخواست استعلام و مشاوره خرید</span>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // Simple render implementation for Mini block on Main landing page
  if (isMini) {
    return (
      <div className="w-full mt-6 mb-12 max-w-7xl mx-auto px-4" id="ad-board-mini-container" dir="rtl">
        {/* 🌟 HERO CARD HEADER - MINI MODE (WHITE THEME) */}
        <div className="bg-white text-slate-900 rounded-3xl p-6 shadow-xl border border-slate-200/90 relative overflow-hidden flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-6">
          {/* Subtle Accent Glow */}
          <div className="absolute -top-16 -right-16 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none"></div>

          <div className="flex items-start sm:items-center gap-4 relative z-10">
            <div className="w-14 h-14 bg-amber-50 text-amber-600 border border-amber-200/80 rounded-2xl flex items-center justify-center shrink-0 shadow-sm">
              <SpecialPriceBagIcon size={26} className="text-amber-600" animated={true} />
            </div>
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="bg-amber-100/90 text-amber-900 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-amber-200 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-ping"></span>
                  <span>حراج زنده کف بازار</span>
                </span>
                <span className="bg-emerald-50 text-emerald-800 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                  <ShieldCheck size={12} className="text-emerald-600" />
                  <span>تضمین امانی دست‌اول</span>
                </span>
              </div>
              <h3 className="font-black text-base sm:text-lg text-slate-900 tracking-tight flex items-center gap-2">
                <span>تالار معاملات فوری کفِ بازار</span>
                <span className="text-amber-800 text-xs font-black bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-lg hidden sm:inline-block">
                  📉 ۱۵٪ تا ۴۰٪ زیر قیمت آزاد
                </span>
              </h3>
              <p className="text-xs text-slate-600 font-medium leading-relaxed max-w-2xl">
                بستری اختصاصی برای خرید و تسویه فوری بارهای مازاد کارخانجات و کالاهای بدون واسطه با ضمانت صندوق امانی پلتفرم.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0 w-full lg:w-auto justify-end relative z-10 pt-2 lg:pt-0 border-t border-slate-100 lg:border-t-0">
            <div className="hidden xl:flex items-center gap-3 bg-slate-50 border border-slate-200/80 px-3.5 py-2 rounded-2xl text-[11px] font-bold text-slate-700">
              <div className="text-center border-l border-slate-200/80 pl-3">
                <span className="text-[9px] text-slate-500 block font-black">حراج‌های فعال</span>
                <span className="text-amber-700 font-black text-xs">{displayOpportunityCount} مورد</span>
              </div>
              <div className="text-center">
                <span className="text-[9px] text-slate-500 block font-black">تسویه</span>
                <span className="text-emerald-700 font-black text-xs">۱۰۰٪ امانی</span>
              </div>
            </div>

            <button
              onClick={onNavigateToBillboard}
              className="bg-white hover:bg-slate-50 text-slate-900 text-xs font-black px-5 py-3 rounded-2xl transition-all flex items-center gap-2 cursor-pointer border border-slate-300 shadow-sm active:scale-95"
            >
              <span>ورود به تالار کامل ({displayOpportunityCount} حراج)</span>
              <ChevronLeft size={16} />
            </button>
            <AddAdButton variant="desktop" />
          </div>
        </div>

        {/* 3 Columns Displaying Latest Items with Beautiful Material Styling */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-5">
          {filteredAds.slice(0, 3).map((ad, idx) => {
            const adImg = ad.imageUrl ? getDisplayImageUrl(ad.imageUrl) : getAdFallbackImage(ad.title, ad.category);
            return (
              <div
                key={`featured-ad-${ad.id}-${idx}`}
                onClick={() => setSelectedAdDetail(ad)}
                className="bg-white border border-slate-200/90 rounded-3xl overflow-hidden shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-xl hover:border-emerald-400 transition-all duration-300 text-right cursor-pointer group flex flex-col justify-between relative"
              >
                {/* Large Image Banner */}
                <div className="w-full h-56 sm:h-60 overflow-hidden bg-slate-50 relative shrink-0 border-b border-slate-100">
                  <img
                    src={adImg}
                    alt={ad.title}
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-700"
                  />
                  <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-xs px-3 py-1 rounded-xl text-[10px] font-black text-slate-800 shadow-sm flex items-center gap-1 border border-slate-100">
                    <span>{ad.category === "under_market" ? "📉 کف قیمت" : ad.category === "liquid" ? "🔥 حراج مازاد" : "📦 تامین کارخانه"}</span>
                  </div>
                  <div className="absolute bottom-2.5 left-2.5 bg-white/85 backdrop-blur-xs text-slate-900 px-2.5 py-1 rounded-lg text-[9px] font-bold shadow-xs border border-slate-100">
                    📦 موجودی: {ad.quantity}
                  </div>
                </div>

                {/* Card Content with padded text */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] text-slate-400 font-black">{ad.date}</span>
                        {ad.isSponsored && (
                          <span className="bg-orange-50 text-orange-900 px-2 py-0.5 rounded-lg text-[9px] font-black border border-orange-200/80 flex items-center gap-1 animate-pulse">
                            <Flame size={11} className="text-orange-600 fill-amber-400" />
                            پیشنهاد ویژه
                          </span>
                        )}
                      </div>
                      <span className="bg-slate-50 text-slate-600 text-[9px] font-black px-2.5 py-0.5 rounded-lg border border-slate-100">
                        {ad.badgeText}
                      </span>
                    </div>

                    <h4 className="font-black text-xs text-slate-800 leading-relaxed group-hover:text-indigo-600 transition-colors line-clamp-1">
                      {ad.title}
                    </h4>
                    
                    {/* Clear price highlights for buyers */}
                    <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-[10px] font-bold text-slate-600 my-1">
                      <div>
                        <span className="text-slate-400 block text-[8px]">قیمت عمده:</span>
                        <span className="text-emerald-700 font-black">{ad.wholesalePrice}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[8px]">سود شما:</span>
                        <span className="text-amber-700 font-black">{ad.buyerProfit.split(" ")[0]} سود</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-[10px] text-slate-400 font-bold">
                    <span className="text-indigo-600 font-black">{ad.factoryName}</span>
                    <span className="flex items-center gap-1 text-emerald-600 font-black group-hover:translate-x-1 transition-transform">
                      <span>ثبت معامله امن</span>
                      <ArrowUpRight size={11} className="rotate-90" />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Submit Modal for isMini Mode */}
        <AnimatePresence>
          {isSubmitModalOpen && renderSubmitModal()}
        </AnimatePresence>
      </div>
    );
  }

  // FULL PAGE / TAB MODE
  return (
    <div className="w-full mt-2 mb-12 max-w-7xl mx-auto px-4" id="ad-board-full-container" dir="rtl">
      {/* 🌟 KAF BAZAAR HERO HEADER BOARD (CLEAN WHITE THEME) */}
      <div className="bg-white text-slate-900 rounded-3xl p-5 sm:p-6 shadow-xl border border-slate-200/90 mb-6 text-right relative overflow-hidden">
        {/* Subtle Ambient Glow */}
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none"></div>

        {/* Top Header Row */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 pb-5 border-b border-slate-100 relative z-10">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-13 h-13 sm:w-15 sm:h-15 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center font-black shadow-xs shrink-0">
              <SpecialPriceBagIcon size={28} className="text-amber-600" animated={true} />
            </div>
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="bg-amber-100/90 text-amber-900 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-amber-200 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-600 animate-ping"></span>
                  <span>تالار زنده معاملات فوری</span>
                </span>
                <span className="bg-emerald-50 text-emerald-800 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                  <ShieldCheck size={12} className="text-emerald-600" />
                  <span>تضمین امانی دست‌اول</span>
                </span>
                <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-slate-200 hidden sm:inline-flex items-center gap-1">
                  <Flame size={11} className="text-amber-600" />
                  <span>حراج مستقیم کارخانه</span>
                </span>
              </div>

              <h1 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight flex flex-wrap items-center gap-2">
                <span>تالار معاملات فوری کفِ بازار</span>
                <span className="text-amber-800 text-xs font-black bg-amber-50 border border-amber-200/80 px-2.5 py-0.5 rounded-xl">
                  📉 ۱۵٪ تا ۴۰٪ زیر قیمت بازار آزاد
                </span>
              </h1>
              <p className="text-xs text-slate-600 font-medium leading-relaxed max-w-2xl hidden sm:block">
                حراج نقدی مازاد خطوط تولید، واگذاری فوری محموله‌ها و تامین بی واسطه با نظارت و تسویه در صندوق امانی دست‌اول.
              </p>
            </div>
          </div>

          {/* KPI Stats & Action Buttons Toolbar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0 relative z-10">
            {/* Quick Live KPI Counters */}
            <div className="grid grid-cols-3 gap-2 bg-slate-50 border border-slate-200/80 p-2 rounded-2xl text-center text-[10px] font-bold text-slate-700">
              <div className="px-2 border-l border-slate-200/80">
                <span className="text-[8px] text-slate-500 block font-black">حراج فعال</span>
                <span className="text-amber-700 font-black text-xs">{displayOpportunityCount} مورد</span>
              </div>
              <div className="px-2 border-l border-slate-200/80">
                <span className="text-[8px] text-slate-500 block font-black">تخفیف کف</span>
                <span className="text-emerald-700 font-black text-xs">تا ۴۰٪</span>
              </div>
              <div className="px-2">
                <span className="text-[8px] text-slate-500 block font-black">تسویه</span>
                <span className="text-indigo-700 font-black text-xs">امانی ۱۰۰٪</span>
              </div>
            </div>

            {/* Toolbar Buttons */}
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
              <button
                onClick={() => {
                  loadAds();
                  setSearchQuery("");
                  setActiveCategoryFilter("all");
                }}
                className="px-3.5 py-2.5 bg-white hover:bg-slate-50 text-slate-800 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer border border-slate-300 shadow-2xs active:scale-95 whitespace-nowrap"
                title="به‌روزرسانی لیست حراج‌ها"
              >
                <RefreshCw size={13} className="text-amber-600" />
                <span>به‌روزرسانی</span>
              </button>

              <button
                onClick={() => setShowRulesModal(true)}
                className="px-3.5 py-2.5 bg-white hover:bg-emerald-50 text-emerald-800 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer border border-emerald-300 shadow-2xs active:scale-95 whitespace-nowrap"
              >
                <ShieldCheck size={14} className="text-emerald-600" />
                <span>قوانین صیانت</span>
              </button>

              <AddAdButton variant="desktop" />
            </div>
          </div>
        </div>

        {/* Filter Chips & Search Bar */}
        <div className="pt-4 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 relative z-10">
          {/* Category Filter Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
            {[
              { value: "all", label: "همه فرصت‌های ویژه", count: allOpportunities.length },
              { value: "under_market", label: "📉 کف قیمت بازار", count: allOpportunities.filter(a => a.category === 'under_market').length },
              { value: "liquid", label: "🔥 حراج مازاد خط", count: allOpportunities.filter(a => a.category === 'liquid').length },
              { value: "direct_supply", label: "📦 تامین مستقیم کارخانه", count: allOpportunities.filter(a => a.category === 'direct_supply').length },
            ].map((filter, fIdx) => (
              <button
                key={`ad-filter-${filter.value}-${fIdx}`}
                onClick={() => setActiveCategoryFilter(filter.value as any)}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 border ${
                  activeCategoryFilter === filter.value
                    ? "bg-slate-900 text-white border-slate-900 shadow-sm scale-[1.02]"
                    : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-2xs"
                }`}
              >
                <span>{filter.label}</span>
                <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${
                  activeCategoryFilter === filter.value ? "bg-amber-400 text-slate-950" : "bg-slate-100 text-slate-600"
                }`}>
                  {filter.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search Input & View Mode Controls */}
          <div className="flex items-center gap-2 w-full lg:w-auto">
            <div className="relative flex-1 lg:w-72">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="جستجوی عنوان حراج کالا یا کارخانه..."
                className="w-full bg-white border border-slate-200 rounded-xl pr-9 pl-7 py-2 text-xs font-bold text-slate-900 placeholder-slate-400 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-400 transition-all shadow-2xs text-right"
              />
              <Search size={14} className="absolute right-3 top-2.5 text-slate-400" />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute left-2.5 top-2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* View Mode Toggle */}
            <div className="hidden sm:flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 shrink-0 shadow-2xs">
              <button
                onClick={() => setViewMode("list")}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === "list" ? "bg-white text-slate-900 shadow-xs border border-slate-200" : "text-slate-500 hover:text-slate-800"
                }`}
                title="نمایش لیستی"
              >
                <List size={15} />
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === "grid" ? "bg-white text-slate-900 shadow-xs border border-slate-200" : "text-slate-500 hover:text-slate-800"
                }`}
                title="نمایش شبکه‌ای"
              >
                <LayoutGrid size={15} />
              </button>
            </div>
          </div>
        </div>
      </div>



      {/* 📉 کالاهای منتخب کف بازار (تحویل فوری) */}
      {!isMini && products && products.length > 0 && (
        <div className="mb-8 text-right bg-gradient-to-l from-emerald-500/10 via-amber-500/5 to-transparent border border-emerald-100 rounded-3xl p-6 relative overflow-hidden">
          <div className="absolute -top-12 -left-12 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
          
          {(() => {
            const kafBazaarProducts = products.filter(p => !p.disabled && p.isKafBazaar === true);
            const displayList = kafBazaarProducts;
            if (displayList.length === 0) return null;

            return (
              <>
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">📉</span>
                    <div>
                      <h3 className="font-black text-sm sm:text-base text-slate-900">کالاهای منتخب «کف بازار» با تحویل فوری</h3>
                      <p className="text-[10px] text-slate-500 font-bold mt-0.5">قیمت‌های حراج تکی و عمده مستقیم از انبار مرکزی دست اول با ضمانت اصالت و سلامت بار</p>
                    </div>
                  </div>
                  <span className="bg-emerald-100 text-emerald-800 text-[9px] font-black px-2.5 py-1 rounded-full border border-emerald-200">
                    تعداد: {displayList.length} کالا
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                  {displayList.map((p, pIdx) => {
                    const rolePricing = getProductRolePricing(p, user);
                    const userPrice = rolePricing.unitWholesalePrice;
                    const consumerPrice = rolePricing.consumerPrice || Math.round(userPrice * 1.25);
                    const packCount = p.carton_pack_count || 24;
                    const unitProfit = Math.max(0, consumerPrice - userPrice);
                    const cartonProfit = unitProfit * packCount;
                    const profitPercent = consumerPrice > 0 ? Math.round((unitProfit / consumerPrice) * 100) : 20;

                    return (
                      <div 
                        key={`kafbazaar-prod-${p.id || pIdx}-${pIdx}`}
                        onClick={() => onSelectProduct && onSelectProduct(p)}
                        className="bg-white border border-slate-200/90 rounded-3xl p-3.5 shadow-2xs hover:shadow-material-md hover:border-emerald-400 transition-all relative flex flex-col justify-between cursor-pointer group"
                      >
                        {/* Clean Square Image Container */}
                        <div className="relative aspect-square w-full bg-white rounded-2xl border border-slate-100 p-2 overflow-hidden flex items-center justify-center group-hover:bg-slate-50/50 transition-colors">
                          <ProductImage 
                            src={p.image_url} 
                            alt={p.name} 
                            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500" 
                          />
                          <span className="absolute top-2.5 right-2.5 bg-amber-500 text-slate-950 text-[9px] font-black px-2 py-0.5 rounded-lg shadow-xs">
                            📉 کف قیمت بازار
                          </span>
                          <span className="absolute bottom-2 left-2 bg-white/80 backdrop-blur-xs text-slate-900 text-[8px] font-bold px-2 py-0.5 rounded-md border border-slate-100">
                            کارتن {packCount.toLocaleString('fa-IR')} عددی
                          </span>
                        </div>

                        <div className="mt-3 space-y-2">
                          <div className="flex items-center justify-between text-[9px] text-slate-400 font-bold">
                            <span>{p.brand || "کارخانه رسمی"}</span>
                            <span className="text-indigo-600 font-black">{p.category || "کالای اساسی"}</span>
                          </div>
                          <h4 className="text-xs font-black text-slate-900 leading-snug line-clamp-2 min-h-[36px] group-hover:text-emerald-700 transition-colors">{p.name}</h4>
                          
                          {/* Pricing details */}
                          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                            <div className="flex justify-between items-center text-[10px]">
                              <span className="text-slate-500 font-bold">قیمت خرید تکی:</span>
                              <span className="font-black text-emerald-700 font-mono text-xs">{userPrice.toLocaleString('fa-IR')} تومان</span>
                            </div>
                            <div className="flex justify-between items-center text-[9px]">
                              <span className="text-slate-400 font-bold">قیمت روی جلد:</span>
                              <span className="line-through font-mono text-slate-400">{consumerPrice.toLocaleString('fa-IR')} تومان</span>
                            </div>
                          </div>

                          {/* Profit temptation badge */}
                          <div className="bg-emerald-50 text-emerald-800 p-2 rounded-xl text-[10px] font-black border border-emerald-200/80 flex items-center justify-between">
                            <span>سود کارتن:</span>
                            <span className="font-mono text-emerald-900">{cartonProfit.toLocaleString('fa-IR')} تومان ({profitPercent.toLocaleString('fa-IR')}٪ سود)</span>
                          </div>
                        </div>

                        <div className="mt-3 pt-2">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onSelectProduct) onSelectProduct(p);
                            }}
                            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[11px] font-black transition-all text-center cursor-pointer shadow-xs flex items-center justify-center gap-1.5 active:scale-95"
                          >
                            <ShieldCheck size={13} />
                            <span>مشاهده و خرید مستقیم</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            );
          })()}
        </div>
      )}

      {/* PRODUCT LIST / GRID PRESENTATION */}
      <div className="w-full">
        {filteredAds.length === 0 ? (
          <div className="p-12 text-center text-slate-400 font-bold bg-white border border-slate-200 rounded-3xl shadow-xs">
            هیچ کالایی با فیلترهای انتخابی یافت نشد. می‌توانید با کلیک بر روی «ثبت بار زیر قیمت»، عرضه کالای خود را ثبت نمایید.
          </div>
        ) : viewMode === "grid" ? (
          /* Grid View Mode */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 animate-in fade-in duration-300">
            {filteredAds.map((ad, idx) => {
              const adImg = ad.imageUrl ? getDisplayImageUrl(ad.imageUrl) : getAdFallbackImage(ad.title, ad.category);
              const isFire = ad.isHotFireDeal === true;
              
              if (isFire) {
                // PREMIUM FULL-FRAME IMAGE DESIGN FOR SELECTED/FEATURED PRODUCTS (تمام کادر)
                return (
                  <div
                    key={`grid-ad-${ad.id}-${idx}`}
                    onClick={() => setSelectedAdDetail(ad)}
                    className="rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 text-right cursor-pointer group flex flex-col justify-between relative min-h-[440px] border-2 border-orange-500 scale-[1.01] hover:scale-[1.02] shadow-[0_8px_30px_rgba(234,88,12,0.2)]"
                  >
                    {/* Background Full Frame Image */}
                    <div className="absolute inset-0 z-0">
                      <img
                        src={adImg}
                        alt={ad.title}
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                      {/* Dark high-contrast gradient overlay for absolute legibility */}
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/75 to-slate-900/40 z-10" />
                    </div>

                    {/* Floating Hot Deal Medallion */}
                    <div className="absolute top-3.5 left-3.5 z-30">
                      <SpecialPriceBagIcon size={26} animated={true} showBadge={false} />
                    </div>

                    {/* Full-Frame Content Overlay */}
                    <div className="relative z-20 p-5 flex flex-col justify-between h-full min-h-[440px] text-white">
                      {/* Top Header */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-[10px] text-slate-300 font-bold">
                          <span>{ad.date}</span>
                          <span className="text-amber-300 font-black flex items-center gap-1 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20">
                            <Building2 size={11} className="text-amber-400" />
                            {ad.factoryName}
                          </span>
                        </div>

                        <div className="flex">
                          <span className="bg-orange-500 text-white text-[9px] font-black px-2.5 py-1 rounded-lg shadow-sm">
                            🔥 پیشنهاد طلایی کف بازار
                          </span>
                        </div>

                        <h4 className="font-black text-sm sm:text-base leading-snug text-white group-hover:text-amber-300 transition-colors line-clamp-2">
                          {ad.title}
                        </h4>
                      </div>

                      {/* Bottom Pricing & CTA */}
                      <div className="space-y-3 pt-4 border-t border-white/10 mt-auto">
                        <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/20">
                          <div className="flex justify-between items-center text-[10px] mb-1 text-slate-300 font-medium">
                            <span>قیمت بازار آزاد:</span>
                            <span className="line-through font-mono">{ad.marketPrice}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-[11px] font-black text-amber-200">قیمت کف بازار (سفارشی):</span>
                            <span className="font-black text-base text-amber-300 font-mono">{ad.wholesalePrice}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between px-1 text-[11px]">
                          <span className="text-emerald-300 font-bold">سود خالص شما در خرید:</span>
                          <span className="bg-emerald-500/25 text-emerald-300 px-2.5 py-0.5 rounded-full font-black border border-emerald-500/30">
                            {ad.buyerProfit}
                          </span>
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEscrowModalAd(ad);
                          }}
                          className="w-full py-3 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-slate-950 font-black rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md active:scale-95"
                        >
                          <ShieldCheck size={15} />
                          <span>خرید فوری با معامله امن دست اول</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              }

              // Normal display
              return (
                <div
                  key={`grid-ad-${ad.id}-${idx}`}
                  onClick={() => setSelectedAdDetail(ad)}
                  className="rounded-3xl overflow-hidden shadow-xs hover:shadow-material-md transition-all duration-300 text-right cursor-pointer group flex flex-col justify-between relative bg-white border border-slate-200 hover:border-emerald-300"
                >
                  {/* Large Image Banner */}
                  <div className="w-full h-56 sm:h-64 overflow-hidden bg-indigo-600/5 relative shrink-0 border-b border-slate-100 group-hover:bg-slate-100 transition-colors">
                    <img
                      src={adImg}
                      alt={ad.title}
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-700"
                    />
                    <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-xs px-2.5 py-1 rounded-xl text-[9px] font-black text-slate-800 shadow-xs flex items-center gap-1 border border-slate-100">
                      <span>{ad.category === "under_market" ? "📉 کف قیمت" : ad.category === "liquid" ? "🔥 حراج مازاد" : "📦 تامین کارخانه"}</span>
                    </div>
                    <div className="absolute bottom-2.5 left-2.5 bg-white/85 backdrop-blur-xs text-slate-900 px-2.5 py-1 rounded-lg text-[9px] font-bold shadow-xs border border-slate-100">
                      📦 موجودی: {ad.quantity}
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3.5">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold">
                        <span>{ad.date}</span>
                        <span className="text-slate-700 font-black flex items-center gap-1">
                          <Building2 size={11} className="text-slate-400" />
                          {ad.factoryName}
                        </span>
                      </div>

                      <h4 className="font-black text-sm leading-snug group-hover:text-emerald-700 transition-colors line-clamp-2 min-h-[40px] text-slate-900">
                        {ad.title}
                      </h4>
                    </div>

                    {/* Pricing Section */}
                    <div className="space-y-2.5">
                      <div className="p-3 rounded-2xl border transition-colors bg-slate-50 border-slate-100 group-hover:bg-emerald-50/30 group-hover:border-emerald-100">
                        <div className="flex justify-between items-center text-[10px] mb-1 opacity-70">
                          <span className="text-slate-500">قیمت بازار آزاد:</span>
                          <span className="text-slate-500 line-through font-mono">{ad.marketPrice}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-[11px] font-black text-emerald-900">قیمت تامین مستقیم:</span>
                          <span className="font-black text-sm text-emerald-700 font-mono">{ad.wholesalePrice}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between px-1">
                        <div className="flex items-center gap-1.5">
                          <div className="w-5 h-5 rounded-md bg-amber-100 flex items-center justify-center text-amber-700">
                            <TrendingDown size={12} />
                          </div>
                          <span className="text-[10px] font-black text-amber-900">سود خریدار:</span>
                        </div>
                        <span className="bg-amber-100/80 text-amber-900 px-2.5 py-0.5 rounded-full text-[10px] font-black border border-amber-200">
                          {ad.buyerProfit}
                        </span>
                      </div>
                    </div>

                    {/* Action Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEscrowModalAd(ad);
                      }}
                      className="w-full py-2.5 text-white rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-95 bg-emerald-600 hover:bg-emerald-700"
                    >
                      <ShieldCheck size={14} />
                      <span>شروع معامله امن</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* List View Mode (Clean & Fast Scannable with Square Image) */
          <div className="space-y-3.5 animate-in fade-in duration-300">
            {filteredAds.map((ad, idx) => {
              const adImg = ad.imageUrl ? getDisplayImageUrl(ad.imageUrl) : getAdFallbackImage(ad.title, ad.category);
              const isFire = ad.isHotFireDeal === true;
              return (
                <div
                  key={`list-ad-${ad.id}-${idx}`}
                  onClick={() => setSelectedAdDetail(ad)}
                  className={`rounded-3xl p-3.5 sm:p-4 text-right flex flex-col sm:flex-row items-stretch sm:items-center gap-4 transition-all duration-300 cursor-pointer shadow-xs hover:shadow-material-md group relative ${
                    isFire 
                      ? "bg-gradient-to-r from-amber-50/70 via-white to-orange-50/50 border-2 border-orange-500 hover:border-orange-600 scale-[1.005] hover:scale-[1.01] shadow-[0_4px_15px_-3px_rgba(234,88,12,0.1)]" 
                      : "bg-white border border-slate-200 hover:border-emerald-300"
                  }`}
                >
                  {/* Floating Fire Medallion for hot deals in list view */}
                  {isFire && (
                    <div className="absolute -top-2.5 -left-2.5 z-30">
                      <SpecialPriceBagIcon size={22} animated={true} showBadge={false} />
                    </div>
                  )}

                  {/* Large Prominent Image Frame */}
                  <div className={`w-full sm:w-44 md:w-52 h-52 sm:h-44 md:h-52 rounded-2xl overflow-hidden shrink-0 bg-slate-50 relative shadow-xs self-stretch sm:self-auto border border-slate-100 ${
                    isFire ? "ring-2 ring-orange-400" : ""
                  }`}>
                    <img
                      src={adImg}
                      alt={ad.title}
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-700"
                    />
                    <div className={`absolute bottom-2 right-2 px-2.5 py-1 rounded-lg text-[9px] font-black text-white shadow-md ${
                      isFire
                        ? "bg-gradient-to-r from-amber-500 to-emerald-600 animate-pulse"
                        : ad.category === "liquid" 
                          ? "bg-amber-600" 
                          : ad.category === "under_market" 
                            ? "bg-emerald-600" 
                            : "bg-blue-600"
                    }`}>
                      {isFire ? "🔥 حراج آتشین" : ad.category === "liquid" ? "🔥 مازاد کارخانه" : ad.category === "under_market" ? "📉 کف قیمت" : "📦 تامین"}
                    </div>
                  </div>

                  {/* Main Info */}
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-400 font-bold">{ad.date}</span>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-md flex items-center gap-1 ${
                          isFire ? "bg-amber-50 text-amber-900" : "bg-slate-100 text-slate-600"
                        }`}>
                          <Building2 size={10} className="text-slate-400" />
                          {ad.factoryName}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-bold">
                        موجودی: <strong className={isFire ? "text-amber-800 font-black" : "text-slate-800"}>{ad.quantity}</strong>
                      </span>
                    </div>

                    <h3 className={`font-black text-xs sm:text-sm group-hover:text-emerald-700 transition-colors line-clamp-1 ${
                      isFire ? "text-amber-900 font-black" : "text-slate-900"
                    }`}>
                      {ad.title}
                    </h3>
                    <p className="text-[11px] text-slate-500 font-bold leading-relaxed line-clamp-1">
                      {ad.description}
                    </p>

                    {/* Price Strip */}
                    <div className="flex flex-wrap items-center gap-2.5 pt-1 text-[11px]">
                      <span className="text-slate-400 font-bold text-[10px]">
                        بازار: <span className="line-through">{ad.marketPrice}</span>
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-lg font-black border ${
                        isFire 
                          ? "bg-amber-600 text-white border-amber-500 animate-pulse" 
                          : "bg-emerald-50 text-emerald-800 border-emerald-200/80"
                      }`}>
                        {isFire ? `قیمت آتشین: ${ad.wholesalePrice}` : `قیمت کف: ${ad.wholesalePrice}`}
                      </span>
                      <span className={`px-2 py-0.5 rounded-lg font-black text-[10px] border ${
                        isFire 
                          ? "bg-amber-100 text-amber-950 border-amber-300" 
                          : "bg-amber-50 text-amber-800 border-amber-200/80"
                      }`}>
                        سود خریدار: {ad.buyerProfit}
                      </span>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="shrink-0 flex sm:flex-col items-center justify-end gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEscrowModalAd(ad);
                      }}
                      className={`w-full sm:w-auto px-4 py-2.5 text-white rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs whitespace-nowrap active:scale-95 ${
                        isFire 
                          ? "bg-gradient-to-r from-amber-500 to-emerald-600 hover:from-amber-600 hover:to-emerald-700 shadow-md shadow-amber-500/20 animate-pulse ring-2 ring-amber-400 ring-offset-2 ring-offset-amber-50" 
                          : "bg-emerald-600 hover:bg-emerald-700"
                      }`}
                    >
                      <ShieldCheck size={14} />
                      <span>{isFire ? "شروع معامله آتشین امن" : "شروع معامله امن"}</span>
                    </button>
                    <span className="text-[10px] text-slate-400 font-bold hidden sm:block text-center">
                      واسطه‌گری رسمی
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* RULES & BRAND PROTECTION MODAL */}
      <AnimatePresence>
        {showRulesModal && (
          <div className="fixed inset-0 z-[170] flex items-center justify-center p-4 bg-white/70 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white w-full max-w-lg rounded-2xl border border-slate-200 p-6 shadow-2xl relative text-right"
              dir="rtl"
            >
              <button
                onClick={() => setShowRulesModal(false)}
                className="absolute top-4 left-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer text-xs font-bold"
              >
                ✕
              </button>

              <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h3 className="font-black text-sm text-slate-900">قوانین و صیانت از اعتبار برندها در تالار کف بازار</h3>
                  <p className="text-[10px] text-slate-400 font-bold">اصول واسطه‌گری امین و معاملات امن پلتفرم دست‌اول</p>
                </div>
              </div>

              <div className="space-y-3.5 py-4 text-xs font-medium text-slate-700 leading-relaxed max-h-[60vh] overflow-y-auto pr-1">
                <div className="bg-amber-50/80 border border-amber-200/80 rounded-xl p-3.5 space-y-1">
                  <h4 className="text-amber-900 font-black text-xs flex items-center gap-1.5">
                    <ShieldAlert size={14} className="text-amber-700" />
                    ۱. دستورالعمل صیانت از اعتبار برندها:
                  </h4>
                  <p className="text-[11px] text-amber-900/90 font-bold leading-relaxed">
                    ذکر مستقیم نام تجاری انحصاری در عناوین عمومی ممنوع است. کالاها به صورت عمومی (مانند «۵۰ تن قند کله شکسته») ثبت می‌شوند تا از ریزش قیمت نمایندگی‌های رسمی کارخانه در سراسر کشور جلوگیری گردد.
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-200/70 rounded-xl p-3.5 space-y-2">
                  <h4 className="text-slate-900 font-black text-xs flex items-center gap-1.5">
                    <CheckCircle2 size={14} className="text-emerald-600" />
                    ۲. واسطه‌گری امن و پرداخت امانی:
                  </h4>
                  <p className="text-[11px] text-slate-600 font-bold leading-relaxed">
                    کلیه تسویه‌حساب‌ها در حساب امانی دست‌اول نگهداری شده و پس از بارگیری، تایید باسکول و تایید اصالت کالا توسط خریدار به حساب تامین‌کننده منتقل می‌گردد.
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-200/70 rounded-xl p-3.5 space-y-2">
                  <h4 className="text-slate-900 font-black text-xs flex items-center gap-1.5">
                    <Building2 size={14} className="text-indigo-600" />
                    ۳. ممیزی فنی و عقد قرارداد رسمی:
                  </h4>
                  <p className="text-[11px] text-slate-600 font-bold leading-relaxed">
                    کارشناسان ناظر پلتفرم پیش از بارگیری، اسناد آنالیز فنی (COA)، برگه باسکول و پلمپ بار را بررسی نموده و فاکتور رسمی را صادر می‌نمایند.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowRulesModal(false)}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-xl text-xs font-black transition-all cursor-pointer shadow-xs border border-slate-200"
              >
                متوجه شدم و قبول دارم
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Secure Escrow Transaction Modal */}
      <AnimatePresence>
        {escrowModalAd && (
          <div className="fixed inset-0 z-[170] flex items-center justify-center p-4 bg-white/70 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white w-full max-w-md rounded-3xl border border-slate-100 p-6 sm:p-8 shadow-2xl relative text-right"
              dir="rtl"
            >
              <button
                onClick={() => setEscrowModalAd(null)}
                className="absolute top-5 left-5 w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center transition-colors cursor-pointer text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>

              {escrowSuccess ? (
                <div className="py-8 flex flex-col items-center text-center space-y-4">
                  <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center border border-emerald-100 animate-bounce">
                    <CheckCircle2 size={32} />
                  </div>
                  <h4 className="font-black text-slate-800 text-sm">درخواست معامله امن ثبت شد</h4>
                  <p className="text-xs text-slate-500 font-bold max-w-xs leading-relaxed">
                    درخواست شما در سیستم مدیریت معاملات امین دست‌اول ثبت گردید. کارشناسان ما تا حداکثر ۱۵ دقیقه آینده جهت بررسی تناژ و هماهنگی عقد قرارداد واسطه‌ای با شما تماس خواهند گرفت.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleEscrowSubmit} className="space-y-4">
                  <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                    <ShieldCheck className="text-indigo-600 animate-pulse" size={18} />
                    <h4 className="font-black text-slate-800 text-sm">شروع معامله امن (واسطه‌گری پلتفرم دست‌اول)</h4>
                  </div>

                  <p className="text-[11px] text-slate-500 font-bold leading-relaxed bg-indigo-50/50 p-3 rounded-xl border border-indigo-100/50">
                    کالا: <strong className="text-slate-800">{escrowModalAd.title}</strong><br />
                    قیمت کف پیشنهادی: <strong className="text-emerald-700">{escrowModalAd.wholesalePrice}</strong><br />
                    تضمین معامله: وجه شما در حساب امانی تا تحویل کامل بار محفوظ می‌ماند.
                  </p>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 mb-1.5">شماره موبایل خریدار جهت هماهنگی کارشناس:</label>
                      <input
                        type="tel"
                        required
                        value={buyerPhoneInput}
                        onChange={(e) => setBuyerPhoneInput(e.target.value)}
                        placeholder="مثال: ۰۹۱۲۳۴۵۶۷۸۹"
                        className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-indigo-600 font-mono text-left"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 mb-1.5">پیام یا شرایط خاص درخواستی (اختیاری):</label>
                      <textarea
                        value={buyerMessage}
                        onChange={(e) => setBuyerMessage(e.target.value)}
                        placeholder="مثال: ترجیحاً تحویل در شهرک صنعتی توس مشهد"
                        rows={2}
                        className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-indigo-600 resize-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={escrowLoading}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                  >
                    {escrowLoading ? "در حال ثبت درخواست..." : "ارسال درخواست معامله به بخش نظارت پلتفرم"}
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Detail Modal */}
      {renderDetailModal()}

      {/* Submit Modal inside Full Page Mode */}
      <AnimatePresence>
        {isSubmitModalOpen && renderSubmitModal()}
      </AnimatePresence>

      {/* 📱 دکمه شناور همواره در دسترس مخصوص موبایل (Floating Action Button) */}
      <AddAdButton variant="mobile-fab" />
    </div>
  );

  // Reusable Material Design Modal for Registering Product Requests
  function renderSubmitModal() {
    return (
      <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-white/70 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-white w-full max-w-xl rounded-[28px] border border-slate-100 p-6 sm:p-8 shadow-2xl relative text-right my-8 max-h-[90vh] overflow-y-auto"
          dir="rtl"
        >
          {/* Close button with subtle hover animation */}
          <button
            onClick={() => setIsSubmitModalOpen(false)}
            className="absolute top-5 left-5 w-9 h-9 bg-slate-100 text-slate-500 rounded-full flex items-center justify-center transition-all hover:bg-slate-200 hover:text-slate-800 cursor-pointer text-sm font-bold"
          >
            ✕
          </button>

          {submitSuccess ? (
            <div className="py-10 flex flex-col items-center text-center space-y-5">
              <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center border border-emerald-100 shadow-md shadow-emerald-100/50 animate-bounce">
                <CheckCircle2 size={40} />
              </div>
              <h4 className="font-black text-slate-900 text-base">درخواست شما با موفقیت ثبت گردید</h4>
              <p className="text-xs text-slate-500 font-bold max-w-sm leading-relaxed">
                اطلاعات با موفقیت ذخیره گردید و جهت تایید فنی در صف بررسی کارشناسان دست‌اول قرار گرفت. به محض تایید، آگهی شما فعال و قابل معامله امن خواهد شد.
              </p>
              <button
                onClick={() => setIsSubmitModalOpen(false)}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition-all cursor-pointer shadow-md"
              >
                بستن پنجره
              </button>
            </div>
          ) : (
            <form onSubmit={handleCreateAdAdminApproval} className="space-y-5 text-right">
              {/* Header Title */}
              <div className="flex items-center gap-3 pb-4 border-b border-slate-150">
                <div className="w-10 h-10 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                  <Package size={20} />
                </div>
                <div>
                  <h4 className="font-black text-slate-900 text-base">درج محصول جدید در تالار کف بازار</h4>
                  <p className="text-[10px] text-slate-400 font-bold mt-0.5">معرفی مستقیم کالا و فرصت‌های خرید زیر قیمت بازار به صنایع سراسر کشور</p>
                </div>
              </div>

              {/* Informative Security and Compliance Guideline Box */}
              <div className="bg-gradient-to-r from-indigo-50/70 to-blue-50/70 border border-indigo-100/60 rounded-2xl p-4 flex gap-3 text-[11px] text-indigo-950 font-medium leading-relaxed shadow-xs">
                <AlertTriangle className="text-indigo-600 shrink-0 mt-0.5" size={16} />
                <div>
                  <span className="font-black block text-indigo-900 mb-0.5">امنیت و واسطه‌گری امین دست‌اول:</span>
                  کلیه هماهنگی‌های مالی، آنالیزهای فنی بار و عقد قراردادهای رسمی جهت محافظت از خریدار و فروشنده، به صورت مستقیم و امن توسط مدیریت واسطه‌گری پلتفرم دست‌اول صورت می‌پذیرد.
                </div>
              </div>

              <div className="space-y-4">
                {/* Product Subcategory Card-Based Selection */}
                <div>
                  <label className="block text-[11px] font-black text-slate-500 mb-2">نوع پیشنهاد محصول زیر قیمت بازار:</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setCategory("under_market")}
                      className={`p-3 rounded-2xl border text-right transition-all cursor-pointer relative flex flex-col justify-between ${
                        category === "under_market"
                          ? "bg-emerald-50/80 border-emerald-500 ring-2 ring-emerald-500/20 shadow-sm"
                          : "bg-slate-50 hover:bg-slate-100 border-slate-200"
                      }`}
                    >
                      <div className="flex justify-between items-center w-full">
                        <span className="text-xs font-black text-slate-800">📉 زیر قیمت بازار</span>
                        <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${category === "under_market" ? "border-emerald-600" : "border-slate-300"}`}>
                          {category === "under_market" && <div className="w-1.5 h-1.5 rounded-full bg-emerald-600" />}
                        </div>
                      </div>
                      <p className="text-[9px] text-slate-500 font-bold mt-1.5 leading-tight">
                        کالای مصرفی و عمده زیر قیمت بنکداری
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCategory("liquid")}
                      className={`p-3 rounded-2xl border text-right transition-all cursor-pointer relative flex flex-col justify-between ${
                        category === "liquid"
                          ? "bg-amber-50/80 border-amber-500 ring-2 ring-amber-500/20 shadow-sm"
                          : "bg-slate-50 hover:bg-slate-100 border-slate-200"
                      }`}
                    >
                      <div className="flex justify-between items-center w-full">
                        <span className="text-xs font-black text-slate-800">🔥 حراج مازاد خط</span>
                        <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${category === "liquid" ? "border-amber-600" : "border-slate-300"}`}>
                          {category === "liquid" && <div className="w-1.5 h-1.5 rounded-full bg-amber-600" />}
                        </div>
                      </div>
                      <p className="text-[9px] text-slate-500 font-bold mt-1.5 leading-tight">
                        حراج فوری بار مازاد خط تولید کارخانه
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCategory("direct_supply")}
                      className={`p-3 rounded-2xl border text-right transition-all cursor-pointer relative flex flex-col justify-between ${
                        category === "direct_supply"
                          ? "bg-blue-50/80 border-blue-500 ring-2 ring-blue-500/20 shadow-sm"
                          : "bg-slate-50 hover:bg-slate-100 border-slate-200"
                      }`}
                    >
                      <div className="flex justify-between items-center w-full">
                        <span className="text-xs font-black text-slate-800">📦 تامین مستقیم</span>
                        <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${category === "direct_supply" ? "border-blue-600" : "border-slate-300"}`}>
                          {category === "direct_supply" && <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />}
                        </div>
                      </div>
                      <p className="text-[9px] text-slate-500 font-bold mt-1.5 leading-tight">
                        تامین مستقیم از انبار درب کارخانه
                      </p>
                    </button>
                  </div>
                </div>

                {/* Requested Product Title */}
                <div>
                  <label className="block text-[11px] font-black text-slate-500 mb-1.5">
                    نام محصول یا کالای زیر قیمت بازار (بدون افشای مستقیم برند):
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => {
                      setTitle(e.target.value);
                      if (/(۰|0|۹|9)[۰-۹0-9]{9,10}/.test(e.target.value)) {
                        setPhoneWarning("درج شماره تماس مستقیم در فیلد عنوان ممنوع است. هماهنگی‌ها بصورت امن و واسطه‌ای صورت می‌گیرد.");
                      } else {
                        setPhoneWarning("");
                      }
                    }}
                    placeholder="مثال: ۵۰۰ کارتن تن ماهی ۱۸۰ گرمی یا ۵۰ تن شکر ۵ کیلویی"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-3 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-indigo-600 transition-colors"
                  />
                  {phoneWarning && <span className="text-[10px] text-rose-500 font-bold block mt-1">{phoneWarning}</span>}
                </div>

                {/* Target Brand / Factory */}
                <div>
                  <label className="block text-[11px] font-black text-slate-500 mb-1.5">
                    برند یا کارخانه تولیدکننده (اختیاری):
                  </label>
                  <input
                    type="text"
                    value={factoryName}
                    onChange={(e) => setFactoryName(e.target.value)}
                    placeholder="مثال: کارخانه کشت و صنعت دهخدا یا برند معتبر ایرانی"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-3 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-indigo-600 transition-colors"
                  />
                </div>

                {/* Pricing Metrics Group */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-black text-slate-500 mb-1.5">
                      قیمت زیر قیمت بازار (تومان):
                    </label>
                    <input
                      type="text"
                      required
                      value={wholesalePrice}
                      onChange={(e) => setWholesalePrice(e.target.value)}
                      placeholder="مثال: ۴۲,۰۰۰ تومان"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-3 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-indigo-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-black text-slate-500 mb-1.5">
                      قیمت معمول در بازار آزاد (تومان):
                    </label>
                    <input
                      type="text"
                      required
                      value={marketPrice}
                      onChange={(e) => setMarketPrice(e.target.value)}
                      placeholder="مثال: ۶۵,۰۰۰ تومان"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-3 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-indigo-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-black text-slate-500 mb-1.5">
                      میزان بار / تناژ عرضه شده:
                    </label>
                    <input
                      type="text"
                      required
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      placeholder="مثال: ۲۰ تن"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-3 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-indigo-600"
                    />
                  </div>
                </div>

                {/* Secure Contact Information (Hidden publicly) */}
                <div className="grid grid-cols-2 gap-3 bg-indigo-50/30 p-4 rounded-2xl border border-indigo-100/20">
                  <div className="col-span-2 flex items-center gap-1.5 text-indigo-900 text-[10px] font-black mb-1">
                    <Lock size={12} className="text-indigo-600" />
                    <span>اطلاعات هماهنگی کارشناسی (محفوظ نزد ادمین جهت معامله امن واسطه‌ای):</span>
                  </div>
                  <div>
                    <label className="block text-[9px] font-black text-slate-500 mb-1">نام و نام خانوادگی:</label>
                    <input
                      type="text"
                      required
                      value={contactPerson}
                      onChange={(e) => setContactPerson(e.target.value)}
                      placeholder="مثال: مهندس رضوانی"
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-black text-slate-500 mb-1">شماره تماس (محفوظ و مخفی):</label>
                    <input
                      type="tel"
                      required
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      placeholder="مثال: ۰۹۱۲۳۴۵۶۷۸۹"
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-850 outline-none focus:border-indigo-500 font-mono text-left"
                    />
                  </div>
                </div>

                {/* Multiple Image Upload Component with Drag & Drop and clear Counter */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-[11px] font-black text-slate-500">
                      تصاویر محصول، اسناد آنالیز فنی یا کاتالوگ خدمات (آپلود چندگانه):
                    </label>
                    <span className="text-[9px] font-black bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                      {uploadedImages.length} از ۵ تصویر آپلود شده
                    </span>
                  </div>
                  
                  {uploadedImages.length > 0 ? (
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5 p-3 bg-slate-50 rounded-2xl border border-slate-200">
                      {uploadedImages.map((imgUrl, idx) => (
                        <div key={`ad-upload-${idx}-${imgUrl.slice(-10)}`} className="relative group aspect-square rounded-xl overflow-hidden border border-slate-300 bg-white shadow-xs">
                          <img src={imgUrl} alt={`preview-${idx}`} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setUploadedImages(prev => prev.filter((_, i) => i !== idx))}
                            className="absolute top-1 left-1 bg-rose-600 hover:bg-rose-700 text-white p-1 rounded-full transition-colors cursor-pointer shadow-sm"
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      ))}
                      {uploadedImages.length < 5 && (
                        <label className="border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center text-slate-500 hover:bg-slate-100 hover:border-indigo-400 cursor-pointer aspect-square transition-all">
                          <Camera size={20} className="text-slate-400 animate-pulse" />
                          <span className="text-[9px] font-black mt-1">افزودن عکس</span>
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            className="hidden"
                            onChange={async (e) => {
                              if (e.target.files) {
                                setIsUploading(true);
                                const files = Array.from(e.target.files);
                                for (const file of files) {
                                  if (uploadedImages.length >= 5) break;
                                  const result = await uploadToParsPackStorage(file, "ads");
                                  if (result.success && result.url) {
                                    setUploadedImages((prev) => [...prev, result.url!]);
                                  } else {
                                    // Fallback if upload fails
                                    const reader = new FileReader();
                                    reader.onloadend = () => {
                                      setUploadedImages((prev) => [...prev, reader.result as string]);
                                    };
                                    reader.readAsDataURL(file);
                                  }
                                }
                                setIsUploading(false);
                              }
                            }}
                          />
                        </label>
                      )}
                    </div>
                  ) : (
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDraggingImage(true);
                      }}
                      onDragLeave={() => setIsDraggingImage(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsDraggingImage(false);
                        if (e.dataTransfer.files) {
                          Array.from(e.dataTransfer.files).forEach((file) => {
                            if (file.type.startsWith("image/")) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setUploadedImages((prev) => [...prev, reader.result as string]);
                              };
                              reader.readAsDataURL(file);
                            }
                          });
                        }
                      }}
                      className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                        isDraggingImage
                          ? "border-indigo-500 bg-indigo-50/50"
                          : "border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-indigo-400"
                      }`}
                      onClick={() => document.getElementById("adboard-multi-upload")?.click()}
                    >
                      <input
                        id="adboard-multi-upload"
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={async (e) => {
                          if (e.target.files) {
                            setIsUploading(true);
                            const files = Array.from(e.target.files);
                            for (const file of files) {
                              if (uploadedImages.length >= 5) break;
                              const result = await uploadToParsPackStorage(file, "ads");
                              if (result.success && result.url) {
                                setUploadedImages((prev) => [...prev, result.url!]);
                              } else {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  setUploadedImages((prev) => [...prev, reader.result as string]);
                                };
                                reader.readAsDataURL(file);
                              }
                            }
                            setIsUploading(false);
                          }
                        }}
                      />
                      {isUploading ? (
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto"></div>
                          <span className="text-[10px] font-black text-indigo-600">در حال آپلود...</span>
                        </div>
                      ) : (
                        <>
                          <UploadCloud className="text-indigo-600 mx-auto" size={28} />
                          <span className="text-xs font-black text-slate-800 block mt-2">
                            کشیدن و رها کردن تصاویر نمونه کالا یا اسناد آنالیز
                          </span>
                          <span className="text-[10px] text-slate-400 block mt-1">
                            یا جهت انتخاب مستقیم از گالری کلیک کنید (قابلیت انتخاب همزمان چند فایل)
                          </span>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Description Textarea */}
                <div>
                  <label className="block text-[11px] font-black text-slate-500 mb-1.5">
                    مشخصات فنی بار، آنالیز شیمیایی و فیزیکی، نحوه تسویه:
                  </label>
                  <textarea
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    placeholder="مثال: محصول با گرید آزمایشگاهی استاندارد و مدارک COA معتبر، حداقل خرید ۵ تن، تحویل روی جک خریدار در محل کارخانه..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-indigo-600 resize-none transition-colors"
                  />
                </div>

                {/* Special Escrow Brokerage Request Checkbox */}
                <div className="bg-amber-50/40 border border-amber-100/60 rounded-2xl p-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={isSpecialRequested}
                      onChange={(e) => setIsSpecialRequested(e.target.checked)}
                      className="w-4 h-4 rounded accent-amber-600 cursor-pointer"
                    />
                    <span className="text-[10px] font-black text-amber-900">درخواست مشاوره و نظارت کارگزار اختصاصی معامله (عقد قرارداد امن)</span>
                  </label>
                  {isSpecialRequested && (
                    <div className="mt-3 animate-in fade-in slide-in-from-top-2 duration-300">
                      <label className="block text-[9px] font-black text-amber-700 mb-1">توضیحات خاص جهت هماهنگی ناظر پلتفرم:</label>
                      <textarea
                        value={specialMessage}
                        onChange={(e) => setSpecialMessage(e.target.value)}
                        placeholder="شرایط پرداختی مدنظر یا توضیحات تکمیلی بابت ضمانت‌نامه‌های مورد نیاز..."
                        rows={2}
                        className="w-full bg-white border border-amber-200 rounded-xl px-3 py-2 text-[10px] font-bold text-slate-800 outline-none focus:border-amber-500 resize-none"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Submission Action Buttons */}
              <div className="pt-4 border-t border-slate-150 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsSubmitModalOpen(false)}
                  className="w-1/2 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-black cursor-pointer transition-colors"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-indigo-600/15"
                >
                  <FileText size={14} />
                  <span>ثبت و ارسال به صف بررسی ادمین</span>
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    );
}
}
