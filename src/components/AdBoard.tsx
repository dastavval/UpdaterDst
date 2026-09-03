import { useState, useEffect, useMemo } from "react";
import { uploadToParsPackStorage } from "../utils/storage";
import { motion, AnimatePresence } from "motion/react";
import { db } from "../lib/data-layer";
import { collection, addDoc } from "../lib/data-layer";
import SpecialPriceBagIcon from "./SpecialPriceBagIcon";
import { Product } from "../types";
import { getDisplayImageUrl } from "../lib/image-utils";
import { ProductImage } from "./ProductImage";
import { AdItem, getAdFallbackImage } from "../utils/ad-utils";
import { triggerAutoChannelPost } from "../utils/channel-utils";
import ImageLightbox from "./ImageLightbox";
import AddAdButton from "./AddAdButton";
import AdPosterPanel from "./AdPosterPanel";
import { getProductRolePricing, toPersianNum } from "../lib/pricing";
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
  Percent,
  Flag
} from "lucide-react";

const initialAds: AdItem[] = [];

const getPublisherBadge = (factoryName: string, publisherType?: "factory" | "individual" | "broker", textColorClass = "text-slate-700", iconColorClass = "text-slate-400") => {
  const iconSize = 12;
  if (publisherType === "individual") {
    return (
      <span className={`font-black flex items-center gap-1 ${textColorClass}`}>
        <UserCheck size={iconSize} className={iconColorClass} />
        <span>شخص حقیقی: {factoryName}</span>
      </span>
    );
  }
  if (publisherType === "broker") {
    return (
      <span className={`font-black flex items-center gap-1 ${textColorClass}`}>
        <Briefcase size={iconSize} className={iconColorClass} />
        <span>شرکت بازرگانی: {factoryName}</span>
      </span>
    );
  }
  return (
    <span className={`font-black flex items-center gap-1 ${textColorClass}`}>
      <Building2 size={iconSize} className={iconColorClass} />
      <span>{factoryName}</span>
    </span>
  );
};

interface AdBoardProps {
  onTriggerPayment?: (paymentInfo: {
    amount: number;
    description: string;
    callback: (success: boolean) => void;
  }) => void;
  isMini?: boolean;
  onNavigateToBillboard?: (subTab?: 'floor_deals' | 'ad_poster_panel') => void;
  onNavigateHome?: () => void;
  user?: any;
  products?: Product[];
  onSelectProduct?: (product: Product) => void;
  onSelectAd?: (ad: AdItem) => void;
  sponsoredAds?: AdItem[];
  onUpdateB2bConfig?: (updatedConfig: any) => Promise<void>;
  b2bConfig?: any;
  initialSubTab?: 'floor_deals' | 'ad_poster_panel';
  onSubTabChange?: (subTab: 'floor_deals' | 'ad_poster_panel') => void;
  onOpenAuth?: (role?: string) => void;
}

export default function AdBoard({ 
  onTriggerPayment, 
  isMini = false, 
  onNavigateToBillboard, 
  onNavigateHome, 
  user, 
  products, 
  onSelectProduct,
  onSelectAd,
  sponsoredAds = [],
  onUpdateB2bConfig,
  b2bConfig,
  initialSubTab = 'floor_deals',
  onSubTabChange,
  onOpenAuth
}: AdBoardProps) {
  const [activeHallTab, setActiveHallTab] = useState<'floor_deals' | 'ad_poster_panel'>(initialSubTab === 'ad_poster_panel' ? 'ad_poster_panel' : 'floor_deals');

  useEffect(() => {
    if (initialSubTab) {
      setActiveHallTab(initialSubTab === 'ad_poster_panel' ? 'ad_poster_panel' : 'floor_deals');
    }
  }, [initialSubTab]);

  const handleTabSwitch = (tab: 'floor_deals' | 'ad_poster_panel') => {
    setActiveHallTab(tab);
    onSubTabChange?.(tab);
  };

  const [ads, setAds] = useState<AdItem[]>(sponsoredAds);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingAd, setEditingAd] = useState<AdItem | null>(null);
  const [selectedAdDetail, setSelectedAdDetail] = useState<AdItem | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>("all");

  const configCategories = useMemo(() => {
    if (b2bConfig && Array.isArray(b2bConfig.categories) && b2bConfig.categories.length > 0) {
      return b2bConfig.categories.map((c: any, index: number) => {
        if (typeof c === 'string') {
          return { id: `cat-${index + 1}`, name: c, emoji: '🏷️' };
        }
        return {
          id: c.id || `cat-${index + 1}`,
          name: c.name || '',
          emoji: c.emoji || c.icon || '🏷️'
        };
      });
    }
    return [
      { id: "cat-1", name: "تنقلات و شکلات", emoji: "🍫" },
      { id: "cat-2", name: "کیک، کلوچه و بیسکویت", emoji: "🍪" },
      { id: "cat-3", name: "مواد غذایی و کنسروجات", emoji: "🥫" },
      { id: "cat-4", name: "نوشیدنی‌ها", emoji: "🥤" },
      { id: "cat-5", name: "شوینده و بهداشتی", emoji: "🧼" }
    ];
  }, [b2bConfig?.categories]);

  const filterChips = useMemo(() => {
    const base = [
      { value: "all", label: "✨ همه" },
      { value: "under_market", label: "📉 کف بازار" },
      { value: "liquid", label: "🔥 حراج مازاد" },
    ];
    
    const dynamic = configCategories.map(cat => ({
      value: cat.id,
      label: `${cat.emoji} ${cat.name}`
    }));
    
    return [...base, ...dynamic];
  }, [configCategories]);
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

  // Ad Reporting States
  const [showReportForm, setShowReportForm] = useState(false);
  const [reportReason, setReportReason] = useState("price_discrepancy");
  const [reportDesc, setReportDesc] = useState("");
  const [reportSubmitted, setReportSubmitted] = useState(false);

  // Form states (Proxying phone inputs internally and forbidding public publishing)
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [factoryName, setFactoryName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [quantity, setQuantity] = useState("");
  const [category, setCategory] = useState<"under_market" | "liquid" | "direct_supply" | "materials" | "services" | "equipment">("under_market");
  const [publisherType, setPublisherType] = useState<"factory" | "individual" | "broker">("factory");
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

  // Sync ads with props and storage when they change
  const loadAds = () => {
    let localList: AdItem[] = [];
    const adsMap: Record<string, AdItem> = {};
    const keys = ["dastavval_sponsored_ads_v2", "dastavval_industrial_equipment", "dastavval_industrial_materials", "dastavval_industrial_services"];
    
    keys.forEach(key => {
      const saved = localStorage.getItem(key);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            // Map category if it's from a specific key and not set
            const categoryMap: Record<string, any> = {
              "dastavval_industrial_equipment": "equipment",
              "dastavval_industrial_materials": "materials",
              "dastavval_industrial_services": "services"
            };
            
            const processed = parsed.map(item => ({
              ...item,
              category: item.category || categoryMap[key] || "under_market"
            })).filter((item: any) => !(item.id && typeof item.id === 'string' && item.id.startsWith("ad-init-")));
            
            localList = [...localList, ...processed];
          }
        } catch (e) {}
      }
    });

    // Also include ads from b2bConfig if available
    if (b2bConfig) {
      if (Array.isArray(b2bConfig.equipmentAds)) {
          b2bConfig.equipmentAds.forEach((ad: any) => { adsMap[ad.id] = { ...ad, category: ad.category || 'equipment' }; });
      }
      if (Array.isArray(b2bConfig.serviceAds)) {
          b2bConfig.serviceAds.forEach((ad: any) => { adsMap[ad.id] = { ...ad, category: ad.category || 'services' }; });
      }
      if (Array.isArray(b2bConfig.rawMaterialAds)) {
          b2bConfig.rawMaterialAds.forEach((ad: any) => { adsMap[ad.id] = { ...ad, category: ad.category || 'materials' }; });
      }
    }

    const propList = Array.isArray(sponsoredAds) ? sponsoredAds : [];

    propList.forEach(item => {
      if (item && item.id) {
        adsMap[String(item.id)] = item;
      }
    });

    localList.forEach(item => {
      if (item && item.id) {
        adsMap[String(item.id)] = item;
      }
    });

    setAds(Object.values(adsMap));
  };

  useEffect(() => {
    loadAds();
  }, [sponsoredAds]);

  useEffect(() => {
    loadAds();
    window.addEventListener("dastavval_ads_updated", loadAds);
    window.addEventListener("dastavval-ads-sync", loadAds);
    window.addEventListener("storage", loadAds);
    return () => {
      window.removeEventListener("dastavval_ads_updated", loadAds);
      window.removeEventListener("dastavval-ads-sync", loadAds);
      window.removeEventListener("storage", loadAds);
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

    // Auto-create account if it doesn't exist (using phone)
    const normalizedPhone = contactPhone.trim();
    if (normalizedPhone) {
      try {
        const localUsers = JSON.parse(localStorage.getItem("dastavval_local_users") || "{}");
        if (!localUsers[normalizedPhone]) {
          const newUser = {
            id: `usr-${Date.now()}`,
            name: contactPerson || factoryName || "آگهی‌دهنده جدید",
            phone: normalizedPhone,
            username: normalizedPhone,
            role: "ad_poster",
            company: factoryName || "شخصی",
            createdAt: new Date().toISOString(),
            status: "active",
            badge: 'bronze',
            password: normalizedPhone
          };
          localUsers[normalizedPhone] = newUser;
          localStorage.setItem("dastavval_local_users", JSON.stringify(localUsers));
          
          // If no user logged in, log this one in
          if (!localStorage.getItem("dastavval_user")) {
            localStorage.setItem("dastavval_user", JSON.stringify(newUser));
            // Trigger a refresh to show the user as logged in
            window.location.reload();
          }
        }
      } catch (e) {
        console.error("Auto account creation failed:", e);
      }
    }

    // Auto calculate buyer savings if empty
    const numericWholesale = parseInt(wholesalePrice.replace(/[^0-9]/g, "")) || 10000;
    const numericMarket = parseInt(marketPrice.replace(/[^0-9]/g, "")) || 15000;
    const savings = numericMarket - numericWholesale;
    const profitPercentage = Math.round((savings / numericMarket) * 100) || 30;
    const calculatedProfitText = `${profitPercentage}٪ سود ناخالص (${savings.toLocaleString()} تومان اختلاف)`;

    let finalBadge = "📦 تامین مستقیم";
    if (category === "under_market") finalBadge = "📉 زیر قیمت بازار";
    else if (category === "liquid") finalBadge = "🔥 حراج عمده";
    else if (category === "materials") finalBadge = "🧪 مواد اولیه";
    else if (category === "services") finalBadge = "🛠️ خدمات صنعتی";
    else if (category === "equipment") finalBadge = "⚙️ تجهیزات";

    const newAd: AdItem = {
      id: `ad-${Date.now()}`,
      title: finalTitle,
      description: finalDesc || "درخواست خرید کالا با شرایط توافقی و ضمانت پرداخت امن واسطه‌ای دست اول.",
      factoryName: factoryName || "متقاضی تامین مستقیم",
      contactPerson: contactPerson || "مدیریت مربوطه",
      contactPhone: normalizedPhone, // Saved privately for admin use
      creatorPhone: normalizedPhone, // Link to account
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
      specialRequestMessage: isSpecialRequested ? specialMessage : undefined,
      publisherType: publisherType,
      specialPaymentStatus: "none"
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
      setPublisherType("factory");
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

  // Filtering Logic: Include ONLY products explicitly marked as isKafBazaar or liquid/fire deals
  const rawKafProducts = (products || []).filter(p => !p.disabled && (p.isKafBazaar === true || (p as any).isLiquid === true || (p as any).isHotFireDeal === true));
  const effectiveKafProducts = rawKafProducts;

  const allOpportunities = [
    ...ads.filter(ad => !(ad.id && typeof ad.id === 'string' && ad.id.startsWith("ad-init-"))),
    ...effectiveKafProducts.map((p: any) => {
        const rolePricing = getProductRolePricing(p, user, (user?.badge || user?.tier) as any, b2bConfig);
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
    if (!ad) return false;
    const isApproved = ad.status === "approved";
    
    const searchLow = (searchQuery || "").toLowerCase();
    const matchesSearch = 
      (ad.title || "").toLowerCase().includes(searchLow) ||
      (ad.description ? ad.description.toLowerCase().includes(searchLow) : false) ||
      (ad.factoryName || "").toLowerCase().includes(searchLow);
    
    const matchesCategory = (() => {
      if (activeCategoryFilter === "all") return true;
      if (activeCategoryFilter === "under_market") return ad.category === "under_market";
      if (activeCategoryFilter === "liquid") return ad.category === "liquid";
      
      const selectedCat = configCategories.find(c => c.id === activeCategoryFilter || c.name === activeCategoryFilter);
      if (!selectedCat) return false;
      
      const catName = (selectedCat.name || "").toLowerCase();
      
      // 1. Check if ad has productCategory matching this category id or name
      if ((ad as any).productCategory === selectedCat.id || (ad as any).productCategory === selectedCat.name) return true;
      if ((ad as any).subCategory === selectedCat.id || (ad as any).subCategory === selectedCat.name) return true;
      
      // 2. Fallback to raw product category check
      if ((ad as any).rawProduct) {
        const pCat = ((ad as any).rawProduct.category || "").toLowerCase();
        if (pCat === selectedCat.id || pCat === catName) return true;
        if (pCat.includes(catName) || catName.includes(pCat)) return true;
      }
      
      // 3. Fallback to title/desc text matching
      const titleLow = (ad.title || "").toLowerCase();
      const descLow = (ad.description || "").toLowerCase();
      if (titleLow.includes(catName) || descLow.includes(catName)) return true;
      
      const cleanCatName = catName.replace(/[^آ-یa-zA-Z]/g, '').trim();
      if (cleanCatName && (titleLow.includes(cleanCatName) || descLow.includes(cleanCatName))) return true;
      
      // Smart fallbacks for default categories
      if (selectedCat.id === "cat-1" || catName.includes("شکلات") || catName.includes("تنقلات")) {
        return titleLow.includes("شکلات") || titleLow.includes("تنقلات") || titleLow.includes("بیسکویت") || titleLow.includes("کیک") || titleLow.includes("کلوچه") || ad.category === "food" || ad.category === "snacks";
      }
      if (selectedCat.id === "cat-2" || catName.includes("شوینده") || catName.includes("بهداشتی")) {
        return titleLow.includes("شوینده") || titleLow.includes("صابون") || titleLow.includes("مایع") || titleLow.includes("شامپو") || titleLow.includes("بهداشتی") || ad.category === "detergent";
      }
      if (selectedCat.id === "cat-3" || catName.includes("کنسرو") || catName.includes("غذایی")) {
        return titleLow.includes("کنسرو") || titleLow.includes("ماهی") || titleLow.includes("روغن") || titleLow.includes("رب") || titleLow.includes("غذا") || ad.category === "food";
      }
      if (selectedCat.id === "cat-4" || catName.includes("نوشیدنی")) {
        return titleLow.includes("نوشابه") || titleLow.includes("آبمیوه") || titleLow.includes("نوشیدنی") || titleLow.includes("لبنیات") || titleLow.includes("شیر") || ad.category === "drinks";
      }
      if (selectedCat.id === "cat-5" || catName.includes("مواد اولیه")) {
        return titleLow.includes("اولیه") || titleLow.includes("شیمیایی") || titleLow.includes("افزودنی") || ad.category === "raw" || ad.category === "materials";
      }
      
      return false;
    })();
    
    return isApproved && matchesSearch && matchesCategory;
  }).sort((a, b) => {
    if (a.isSponsored && !b.isSponsored) return -1;
    if (!a.isSponsored && b.isSponsored) return 1;
    return 0;
  });

  const featuredAds = useMemo(() => {
    return filteredAds.filter((ad) => ad.isSponsored === true || ad.isHotFireDeal === true || ad.specialRequest === true);
  }, [filteredAds]);

  const regularAds = useMemo(() => {
    return filteredAds.filter((ad) => !(ad.isSponsored === true || ad.isHotFireDeal === true || ad.specialRequest === true));
  }, [filteredAds]);

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

  const handleSendReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportDesc.trim()) return;

    const newReport = {
      id: `report-${Date.now()}`,
      adId: selectedAdDetail?.id,
      adTitle: selectedAdDetail?.title,
      reason: reportReason,
      description: reportDesc.trim(),
      date: new Date().toLocaleDateString("fa-IR"),
      userEmail: user?.email || "anonymous"
    };

    try {
      const existingReports = JSON.parse(localStorage.getItem("dastavval_reported_ads") || "[]");
      localStorage.setItem("dastavval_reported_ads", JSON.stringify([newReport, ...existingReports]));
    } catch (err) {}

    window.dispatchEvent(new CustomEvent("dastavval_admin_log", {
      detail: {
        action: `گزارش آگهی: ${selectedAdDetail?.title}`,
        category: "تخلفات",
        details: `علت: ${reportReason === "price_discrepancy" ? "مغایرت قیمت" : reportReason === "revealed_brand" ? "افشای برند تجاری" : "کالای نامناسب"} - توضیحات: ${reportDesc.trim()}`
      }
    }));

    setReportSubmitted(true);
    setTimeout(() => {
      setReportSubmitted(false);
      setShowReportForm(false);
      setReportDesc("");
    }, 3000);
  };

  const renderDetailModal = () => (
    <AnimatePresence>
      {selectedAdDetail && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-white/60 backdrop-blur-md overflow-y-auto animate-fade-in"
          onClick={() => {
            setSelectedAdDetail(null);
            setShowReportForm(false);
            setReportSubmitted(false);
          }}
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
              onClick={() => {
                setSelectedAdDetail(null);
                setShowReportForm(false);
                setReportSubmitted(false);
              }}
              className="absolute top-5 left-5 w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-all cursor-pointer"
            >
              <X size={16} />
            </button>

            <div className="space-y-6 mt-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="bg-emerald-600 text-white text-[10px] font-black px-3 py-1 rounded-full border border-emerald-100 flex items-center gap-1">
                  <ShieldCheck size={12} />
                  واسطه‌گری امن پلتفرم دست‌اول
                </span>
                <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                  <Calendar size={11} />
                  ثبت در {selectedAdDetail.date}
                </span>
              </div>

              {/* Product Image - Clean Large Crisp Frame */}
              <div 
                onClick={() => setPreviewImage(selectedAdDetail.imageUrl ? getDisplayImageUrl(selectedAdDetail.imageUrl) : getAdFallbackImage(selectedAdDetail.title, selectedAdDetail.category))}
                className="w-full h-64 sm:h-80 md:h-96 rounded-2xl overflow-hidden bg-slate-50 relative flex items-center justify-center border border-slate-200 shadow-xs group cursor-zoom-in"
              >
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
                <span className="text-[10px] text-emerald-600 font-black block mb-1">
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
                  <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-100/50 shadow-2xs">
                    <span className="text-[9px] text-amber-800 font-black block mb-1">حاشیه سود خریدار:</span>
                    <span className="text-[10px] font-black text-amber-700 block leading-tight">{selectedAdDetail.buyerProfit}</span>
                  </div>
                </div>

                {(selectedAdDetail as any).repPrice && (
                  <div className="p-2.5 bg-emerald-50/70 rounded-xl border border-emerald-100/70 flex items-center justify-between text-[11px] font-bold text-slate-900">
                    <span className="flex items-center gap-1.5 text-emerald-800">
                      <Percent size={13} className="text-emerald-600" />
                      <span>نرخ کف کارخانه برای عاملیت و نمایندگان رسمی ({toPersianNum((selectedAdDetail as any)?.customerMarkupPercent || b2bConfig?.customerMarkupPercent || 20)}٪ تخفیف مازاد):</span>
                    </span>
                    <span className="font-mono font-black text-emerald-900 bg-white px-2.5 py-0.5 rounded-lg border border-emerald-200 shadow-2xs">
                      {(selectedAdDetail as any).repPrice}
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-center text-[10px] text-slate-500 font-bold pt-1.5">
                  <span>میزان بار موجود جهت بارگیری:</span>
                  <span className="text-slate-800 font-black">📦 {selectedAdDetail.quantity}</span>
                </div>
              </div>

              {/* Clean Protection & Commission Details */}
              <div className="bg-slate-50 border border-slate-150 rounded-2xl p-4 space-y-3.5 text-right">
                <div className="flex gap-2 items-start">
                  <AlertTriangle className="text-emerald-700 shrink-0 mt-0.5" size={15} />
                  <div>
                    <h5 className="text-[11px] font-black text-slate-800">حفاظت از ارزش برند و شرایط معامله:</h5>
                    <p className="text-[10px] text-slate-500 font-semibold leading-relaxed mt-0.5">
                      مشخصات دقیق کارخانه پس از تایید واسطه امن ارائه می‌شود. خریدار ثمن معامله را در حساب امانی دست‌اول تودیع نموده و پس از تایید بارگیری و باسکول آزاد می‌گردد.
                    </p>
                  </div>
                </div>
              </div>

              {/* Ad Reporting Section (گزارش تخلف آگهی) */}
              <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-rose-800">
                    <Flag size={14} className="text-emerald-600 animate-pulse" />
                    <span className="text-[11px] font-black">آیا این آگهی نیاز به اصلاح یا گزارش دارد؟</span>
                  </div>
                  <button
                    onClick={() => setShowReportForm(!showReportForm)}
                    className="text-[10px] font-black text-emerald-700 hover:text-rose-900 bg-white hover:bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 transition-all cursor-pointer shadow-2xs"
                  >
                    {showReportForm ? "بستن فرم گزارش" : "ثبت گزارش تخلف"}
                  </button>
                </div>

                {showReportForm && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white p-3 rounded-xl border border-emerald-100 space-y-3 mt-2 text-right"
                  >
                    {reportSubmitted ? (
                      <div className="py-4 text-center space-y-2">
                        <CheckCircle2 size={24} className="text-emerald-600 mx-auto" />
                        <p className="text-xs font-black text-slate-900">گزارش شما با موفقیت ثبت شد.</p>
                        <p className="text-[10px] text-slate-500 font-bold">بخش بازرسی پلتفرم دست‌اول در اسرع وقت آگهی را بررسی خواهد کرد.</p>
                      </div>
                    ) : (
                      <form onSubmit={handleSendReport} className="space-y-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-700 block">علت اصلی گزارش تخلف:</label>
                          <select
                            value={reportReason}
                            onChange={(e) => setReportReason(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-[11px] font-bold focus:outline-none focus:border-rose-400"
                          >
                            <option value="price_discrepancy">مغایرت قیمت اعلامی با بازار یا فریبنده بودن</option>
                            <option value="revealed_brand">افشای نام تجاری و نقض حریم صیانت برند</option>
                            <option value="fake_availability">عدم موجودی واقعی بار یا فروش کالا به شخص دیگر</option>
                            <option value="inappropriate_content">اطلاعات غیرواقعی یا نامناسب</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-700 block">توضیحات تکمیلی گزارش:</label>
                          <textarea
                            required
                            rows={2}
                            value={reportDesc}
                            onChange={(e) => setReportDesc(e.target.value)}
                            placeholder="لطفاً جزییات تخلف یا مغایرت قیمت را شرح دهید..."
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-[11px] font-medium focus:outline-none focus:border-rose-400"
                          />
                        </div>
                        <button
                          type="submit"
                          className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 shadow-xs"
                        >
                          <ShieldAlert size={13} />
                          <span>ارسال گزارش نهایی جهت بازرسی</span>
                        </button>
                      </form>
                    )}
                  </motion.div>
                )}
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-black text-slate-400 block">شرح کامل درخواست و شرایط تحویل:</span>
                <p className="text-xs text-slate-600 leading-relaxed font-bold bg-slate-50 p-4 rounded-xl border border-slate-100 whitespace-pre-line">
                  {selectedAdDetail.description}
                </p>
              </div>

              {/* Contact Proxy & Site Mediation Block */}
              <div className="bg-emerald-50/60 border border-emerald-100 rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-emerald-900">
                  <LockKeyhole size={16} />
                  <span className="text-[11px] font-black">اطلاعات تماس مستقیم (پنهان به دستور پلتفرم):</span>
                </div>
                <p className="text-[10px] text-emerald-700 font-bold leading-relaxed">
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
                    <Phone size={15} className="text-emerald-600" />
                    <span>درخواست استعلام و مشاوره خرید</span>
                  </button>
                </div>

                <button
                  onClick={() => {
                    setSelectedAdDetail(null);
                    setShowReportForm(false);
                    setReportSubmitted(false);
                  }}
                  className="w-full py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 mt-1 cursor-pointer"
                >
                  <X size={15} />
                  <span>بستن و بازگشت به تالار معاملات</span>
                </button>
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
          <div className="absolute -top-16 -right-16 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>

          <div className="flex items-start sm:items-center gap-4 relative z-10">
            <div className="w-14 h-14 bg-emerald-600 text-white border border-emerald-200/80 rounded-2xl flex items-center justify-center shrink-0 shadow-sm">
              <SpecialPriceBagIcon size={26} className="text-emerald-600" animated={true} />
            </div>
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="bg-emerald-100/90 text-amber-900 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping"></span>
                  <span>حراج زنده کف بازار</span>
                </span>
                <span className="bg-emerald-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                  <ShieldCheck size={12} className="text-emerald-600" />
                  <span>تضمین امانی دست‌اول</span>
                </span>
              </div>
              <h3 className="font-black text-base sm:text-lg text-slate-900 tracking-tight flex items-center gap-2">
                <span>تالار معاملات فوری کفِ بازار</span>
                <span className="text-amber-800 text-xs font-black bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-lg hidden sm:inline-block">
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
              onClick={() => onNavigateToBillboard?.('floor_deals')}
              className="bg-white hover:bg-slate-50 text-slate-900 text-xs font-black px-5 py-3 rounded-2xl transition-all flex items-center gap-2 cursor-pointer border border-slate-300 shadow-sm active:scale-95"
            >
              <span>ورود به تالار کامل ({displayOpportunityCount} حراج)</span>
              <ChevronLeft size={16} />
            </button>
            <AddAdButton variant="desktop" />
          </div>
        </div>

        {/* 4 Columns Displaying Featured Items with Beautiful Material Styling */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-5">
          {(() => {
            const adsToDisplay = featuredAds.slice(0, 4);
            if (adsToDisplay.length === 0) return null;
            return adsToDisplay.map((ad, idx) => {
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

                    <h4 className="font-black text-xs text-slate-800 leading-relaxed group-hover:text-emerald-600 transition-colors line-clamp-1">
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
                    <span className="text-emerald-600 font-black">{ad.factoryName}</span>
                    <span className="flex items-center gap-1 text-emerald-600 font-black group-hover:translate-x-1 transition-transform">
                      <span>ثبت معامله امن</span>
                      <ArrowUpRight size={11} className="rotate-90" />
                    </span>
                  </div>
                </div>
              </div>
            );
          });
        })()}
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
      {/* 🏛️ CLEAN WHITE & RESPONSIVE TOP BAR */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-1.5 sm:p-2 mb-3 text-right w-full overflow-hidden">
        <div className="grid grid-cols-1 xs:grid-cols-2 gap-2 w-full">
          <button
            onClick={() => handleTabSwitch('floor_deals')}
            className={`flex items-center justify-center gap-1.5 sm:gap-2 py-2 px-2.5 sm:px-4 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer min-w-0 ${
              activeHallTab === 'floor_deals'
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-white text-slate-700 hover:text-slate-950 hover:bg-slate-50 border border-slate-200"
            }`}
          >
            <SpecialPriceBagIcon size={15} className={`shrink-0 ${activeHallTab === 'floor_deals' ? "text-amber-400" : "text-emerald-700"}`} />
            <span className="truncate">حراج‌ها و آگهی‌های کفِ بازار</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold shrink-0 ${
              activeHallTab === 'floor_deals' ? "bg-amber-400 text-slate-950" : "bg-slate-100 text-slate-700 border border-slate-200"
            }`}>
              {allOpportunities.length}
            </span>
          </button>

          <button
            onClick={() => handleTabSwitch('ad_poster_panel')}
            className={`flex items-center justify-center gap-1.5 sm:gap-2 py-2 px-2.5 sm:px-4 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer min-w-0 ${
              activeHallTab === 'ad_poster_panel'
                ? "bg-teal-700 text-white shadow-xs"
                : "bg-white text-slate-700 hover:text-slate-950 hover:bg-slate-50 border border-slate-200"
            }`}
          >
            <Megaphone size={14} className={`shrink-0 ${activeHallTab === 'ad_poster_panel' ? "text-white" : "text-teal-700"}`} />
            <span className="truncate">مدیریت آگهی‌های من</span>
          </button>
        </div>
      </div>

      {activeHallTab === 'ad_poster_panel' && (
        <AdPosterPanel
          user={user}
          onTriggerPayment={onTriggerPayment}
          onNavigateHome={onNavigateHome}
          onOpenAuth={onOpenAuth}
          onNavigateToBarter={() => {
            window.dispatchEvent(new CustomEvent("change-factories-subtab", { detail: { subTab: 'barter' } }));
            window.dispatchEvent(new CustomEvent("navigate-tab", { detail: { tab: 'factories' } }));
          }}
        />
      )}

      {activeHallTab === 'floor_deals' && (
        <>
          {/* 🌟 KAF BAZAAR HERO HEADER BOARD (CLEAN WHITE & COMPACT THEME) */}
          <div className="bg-white text-slate-900 rounded-2xl p-3 sm:p-3.5 border border-slate-200/90 mb-3.5 text-right relative overflow-hidden shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-slate-100">
              <div className="space-y-0.5">
                <h1 className="text-sm sm:text-base font-black text-slate-900 tracking-tight flex items-center gap-1.5">
                  <SpecialPriceBagIcon size={18} className="text-emerald-600 animate-pulse" animated={true} />
                  <span>تالار معاملات فوری کفِ بازار</span>
                </h1>
                {/* Clean, minimalist stats list on one single line */}
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] sm:text-xs text-slate-500 font-bold">
                  <span className="flex items-center gap-1 text-emerald-700 font-black">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping"></span>
                    {displayOpportunityCount} حراج فعال
                  </span>
                  <span>•</span>
                  <span>تا ۴۰٪ تخفیف زیر قیمت بازار</span>
                  <span>•</span>
                  <span className="text-slate-600">تسویه امانی ۱۰۰٪</span>
                </div>
              </div>

              {/* Action buttons on the side */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => {
                    loadAds();
                    setSearchQuery("");
                    setActiveCategoryFilter("all");
                  }}
                  className="p-1.5 sm:px-2.5 sm:py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer border border-slate-200 shadow-3xs"
                  title="به‌روزرسانی"
                >
                  <RefreshCw size={11} className="text-emerald-600" />
                  <span className="hidden xs:inline">به‌روزرسانی</span>
                </button>

                <button
                  onClick={() => setShowRulesModal(true)}
                  className="p-1.5 sm:px-2.5 sm:py-1.5 bg-slate-50 hover:bg-emerald-50 text-emerald-800 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer border border-emerald-200 shadow-3xs"
                >
                  <ShieldCheck size={12} className="text-emerald-600 shrink-0" />
                  <span className="hidden xs:inline">قوانین صیانت</span>
                </button>
              </div>
            </div>

            {/* Combined, smart search, toggle and unified filters */}
            <div className="pt-2.5 space-y-2.5">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full">
                {/* Search Bar */}
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="جستجوی کالا، برند یا کارخانه..."
                    className="w-full bg-slate-50/70 border border-slate-200 rounded-xl pr-8 pl-7 py-2 text-xs font-bold text-slate-900 placeholder-slate-400 outline-none focus:bg-white focus:border-emerald-500 transition-all text-right"
                  />
                  <Search size={13} className="absolute right-2.5 top-2.5 text-slate-400" />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute left-2.5 top-2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>

                {/* View Switcher & Action */}
                <div className="flex items-center justify-between sm:justify-start gap-1.5">
                  <div className="flex items-center bg-slate-50 p-0.5 rounded-xl border border-slate-200 shrink-0">
                    <button
                      onClick={() => setViewMode("list")}
                      className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                        viewMode === "list" ? "bg-white text-slate-900 shadow-xs border border-slate-200" : "text-slate-500 hover:text-slate-800"
                      }`}
                      title="نمایش لیستی"
                    >
                      <List size={13} />
                    </button>
                    <button
                      onClick={() => setViewMode("grid")}
                      className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                        viewMode === "grid" ? "bg-white text-slate-900 shadow-xs border border-slate-200" : "text-slate-500 hover:text-slate-800"
                      }`}
                      title="نمایش شبکه‌ای"
                    >
                      <LayoutGrid size={13} />
                    </button>
                  </div>

                  <div className="sm:hidden flex-1 flex justify-end">
                    <AddAdButton variant="desktop" />
                  </div>
                </div>
              </div>

              {/* Smart Unified Horizontal Filter Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {filterChips.map((filter, fIdx) => {
                  const isActive = activeCategoryFilter === filter.value;
                  return (
                    <button
                      key={`smart-filter-${filter.value}-${fIdx}`}
                      onClick={() => {
                        setActiveCategoryFilter(filter.value);
                        setSearchQuery("");
                      }}
                      className={`px-3 py-1 rounded-xl text-[10.5px] font-black transition-all whitespace-nowrap cursor-pointer border ${
                        isActive
                          ? "bg-emerald-700 text-white border-emerald-600 shadow-xs scale-102"
                          : "bg-white hover:bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      {filter.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>



      {/* PRODUCT LIST / GRID PRESENTATION */}
      <div className="w-full">
        {filteredAds.length === 0 ? (
          <div className="p-12 text-center text-slate-400 font-bold bg-white border border-slate-200 rounded-3xl shadow-xs">
            هیچ کالایی با فیلترهای انتخابی یافت نشد. می‌توانید با کلیک بر روی «ثبت بار زیر قیمت»، عرضه کالای خود را ثبت نمایید.
          </div>
        ) : viewMode === "grid" ? (
          /* Grid View Mode */
          <div className="space-y-10 animate-in fade-in duration-300">
            {/* 1. Featured Ads Section */}
            {featuredAds.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-orange-100 pb-2">
                  <div className="w-2.5 h-5 bg-orange-500 rounded-full"></div>
                  <h3 className="font-black text-sm sm:text-base text-slate-800">🔥 حراج‌های آتشی و پیشنهادهای طلایی کف بازار</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                  {featuredAds.map((ad, idx) => {
                    const adImg = ad.imageUrl ? getDisplayImageUrl(ad.imageUrl) : getAdFallbackImage(ad.title, ad.category);
                    return (
                      <div
                        key={`grid-feat-ad-${ad.id}-${idx}`}
                        onClick={() => setSelectedAdDetail(ad)}
                        className="rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 text-right cursor-pointer group flex flex-col justify-between relative bg-gradient-to-b from-white to-amber-50/15 border-2 border-orange-400 hover:border-orange-500"
                      >
                        {/* Clear Bright Image Banner */}
                        <div className="w-full h-56 sm:h-64 overflow-hidden bg-slate-50 relative shrink-0 border-b border-slate-100">
                          <img
                            src={adImg}
                            alt={ad.title}
                            loading="lazy"
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          {/* Floating Hot Deal Medallion */}
                          <div className="absolute top-2.5 left-2.5 z-30">
                            <SpecialPriceBagIcon size={20} animated={true} />
                          </div>
                          <div className="absolute bottom-2.5 right-2.5 bg-rose-600 text-white px-2.5 py-0.5 rounded-lg text-[9px] font-black shadow-2xs">
                            🔥 پیشنهاد طلایی
                          </div>
                          {ad.quantity && (
                            <div className="absolute bottom-2.5 left-2.5 bg-white/95 text-slate-800 px-2 py-0.5 rounded-lg text-[9px] font-black border border-orange-200 shadow-2xs">
                              موجودی: {ad.quantity}
                            </div>
                          )}
                        </div>

                        {/* Card Body */}
                        <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold">
                              <span>{ad.date}</span>
                              <span className="text-slate-700 font-black flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                                <Building2 size={11} className="text-orange-600" />
                                {ad.factoryName}
                              </span>
                            </div>

                            <h4 className="font-black text-xs sm:text-sm leading-snug text-slate-900 group-hover:text-orange-600 transition-colors line-clamp-2 min-h-[36px] pt-1">
                              {ad.title}
                            </h4>
                          </div>

                          {/* Pricing & Gain Block */}
                          <div className="space-y-2">
                            <div className="bg-amber-50/50 border border-amber-200/60 rounded-xl p-2.5 flex flex-col gap-1.5">
                              <div className="flex justify-between items-center text-[10px]">
                                <span className="text-slate-500 font-medium">قیمت بازار آزاد:</span>
                                <span className="text-slate-400 line-through font-mono">{ad.marketPrice}</span>
                              </div>
                              <div className="flex justify-between items-center border-t border-amber-200/40 pt-1.5">
                                <span className="text-[10.5px] font-black text-slate-700">قیمت کف بازار (سفارشی):</span>
                                <span className="font-black text-sm text-rose-600 font-mono">{ad.wholesalePrice}</span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between text-[10.5px] bg-amber-100 text-amber-950 px-2.5 py-1 rounded-xl border border-amber-200">
                              <span className="font-bold">سود خالص شما در خرید:</span>
                              <span className="font-black">{ad.buyerProfit}</span>
                            </div>
                          </div>

                          {/* Action Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEscrowModalAd(ad);
                            }}
                            className="w-full py-2.5 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-black rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
                          >
                            <ShieldCheck size={14} />
                            <span>خرید فوری با معامله امن دست اول</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 2. Regular Ads Section */}
            <div className="space-y-4">
              {featuredAds.length > 0 && (
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                  <div className="w-2.5 h-5 bg-emerald-500 rounded-full"></div>
                  <h3 className="font-black text-sm sm:text-base text-slate-800">📋 سایر فرصت‌های معاملاتی تالار</h3>
                </div>
              )}
              {regularAds.length === 0 ? (
                <div className="p-8 text-center text-slate-400 font-medium bg-slate-50 border border-slate-100 rounded-2xl">
                  مورد دیگری یافت نشد.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                  {regularAds.map((ad, idx) => {
                    const adImg = ad.imageUrl ? getDisplayImageUrl(ad.imageUrl) : getAdFallbackImage(ad.title, ad.category);
                    return (
                      <div
                        onClick={() => {
                            if (onSelectAd) onSelectAd(ad);
                            else setSelectedAdDetail(ad);
                        }}
                        key={`grid-reg-ad-${ad.id}-${idx}`}
                        className="bg-white rounded-2xl border border-slate-200/90 hover:border-emerald-300 hover:shadow-md transition-all duration-300 text-right cursor-pointer flex flex-col justify-between overflow-hidden group shadow-2xs"
                      >
                        {/* Compact Image Banner */}
                        <div className="w-full h-52 sm:h-56 overflow-hidden bg-slate-50 relative shrink-0 border-b border-slate-100">
                          <img
                            src={adImg}
                            alt={ad.title}
                            loading="lazy"
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute top-2.5 right-2.5 bg-slate-900/80 backdrop-blur-xs text-white px-2.5 py-0.5 rounded-lg text-[9px] font-black shadow-2xs">
                            {ad.category === "under_market" ? "📉 کف قیمت" : 
                             ad.category === "liquid" ? "🔥 حراج مازاد" : 
                             ad.category === "equipment" ? "⚙️ تجهیزات" :
                             ad.category === "materials" ? "🧱 مواد اولیه" :
                             ad.category === "services" ? "🛠️ خدمات" :
                             "📦 تامین کارخانه"}
                          </div>
                          {ad.quantity && (
                            <div className="absolute bottom-2.5 left-2.5 bg-white/95 text-slate-800 px-2 py-0.5 rounded-lg text-[9px] font-black border border-slate-150 shadow-2xs">
                              موجودی: {ad.quantity}
                            </div>
                          )}
                        </div>

                        {/* Card Body */}
                        <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold">
                              <span>{ad.date}</span>
                              <span className="text-slate-700 font-black flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
                                <Building2 size={11} className="text-emerald-600" />
                                {ad.factoryName}
                              </span>
                            </div>

                            <h4 className="font-black text-xs sm:text-sm leading-snug group-hover:text-emerald-700 transition-colors line-clamp-2 text-slate-900 pt-1 min-h-[36px]">
                              {ad.title}
                            </h4>
                          </div>

                          {/* Pricing Component - Very Simple & Readable */}
                          <div className="space-y-2">
                            <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5 flex flex-col gap-1.5">
                              <div className="flex justify-between items-center text-[10px]">
                                <span className="text-slate-500 font-medium">قیمت بازار آزاد:</span>
                                <span className="text-slate-400 line-through font-mono">{ad.marketPrice}</span>
                              </div>
                              <div className="flex justify-between items-center border-t border-slate-150 pt-1.5">
                                <span className="text-[10.5px] font-black text-slate-700">قیمت دست اول:</span>
                                <span className="font-black text-sm text-emerald-700 font-mono">{ad.wholesalePrice}</span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between text-[10.5px] bg-emerald-50 text-emerald-950 px-2.5 py-1 rounded-xl border border-emerald-100">
                              <span className="font-bold">سود خالص خریدار:</span>
                              <span className="font-black">{ad.buyerProfit}</span>
                            </div>
                          </div>

                          {/* Action Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEscrowModalAd(ad);
                            }}
                            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                          >
                            <ShieldCheck size={14} />
                            <span>شروع معامله امن</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* List View Mode (Clean & Fast Scannable with Square Image) */
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* 1. Featured Ads Section (List Mode) */}
            {featuredAds.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 border-b border-orange-100 pb-2">
                  <div className="w-2 h-4 bg-orange-500 rounded-full"></div>
                  <h3 className="font-black text-xs sm:text-sm text-slate-800">🔥 حراج‌های آتشی و پیشنهادهای طلایی</h3>
                </div>
                <div className="space-y-2.5">
                  {featuredAds.map((ad, idx) => {
                    const adImg = ad.imageUrl ? getDisplayImageUrl(ad.imageUrl) : getAdFallbackImage(ad.title, ad.category);
                    return (
                      <div
                        onClick={() => {
                          if (onSelectAd) onSelectAd(ad);
                          else setSelectedAdDetail(ad);
                        }}
                        key={`list-feat-ad-${ad.id}-${idx}`}
                        className="rounded-xl p-2.5 text-right flex flex-row items-stretch gap-3 transition-all duration-300 cursor-pointer shadow-xs hover:shadow-md group relative bg-white border-2 border-orange-400 hover:border-orange-500"
                      >
                        {/* Large Clear Image Box */}
                        <div className="w-24 h-24 xs:w-28 xs:h-28 sm:w-36 sm:h-36 rounded-lg overflow-hidden shrink-0 bg-slate-50 relative border border-slate-100 shadow-3xs">
                          <img
                            src={adImg}
                            alt={ad.title}
                            loading="lazy"
                            referrerPolicy="no-referrer"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewImage(adImg);
                            }}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 cursor-zoom-in"
                          />
                          <div className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded-md text-[8px] font-black text-white shadow-md bg-gradient-to-r from-orange-500 to-red-600 animate-pulse">
                            🔥 حراج طلایی
                          </div>
                        </div>

                        {/* Card Content */}
                        <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold">
                              <span>{ad.date}</span>
                              <span>•</span>
                              <span className="font-black text-orange-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-150 truncate max-w-[120px] xs:max-w-[160px] sm:max-w-none">
                                {ad.factoryName}
                              </span>
                            </div>

                            <h3 className="font-black text-xs xs:text-sm sm:text-base text-slate-900 group-hover:text-orange-600 transition-colors line-clamp-1">
                              {ad.title}
                            </h3>
                          </div>

                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1">
                            <div className="space-y-1">
                              {/* Prices inline */}
                              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] xs:text-[11px] sm:text-xs">
                                <span className="text-slate-400 font-bold">بازار: <span className="line-through font-mono">{ad.marketPrice}</span></span>
                                <span className="text-slate-300">|</span>
                                <span className="text-rose-600 font-black bg-rose-50 px-2 py-0.5 rounded-md border border-rose-100">
                                  قیمت طلایی: <strong className="font-mono">{ad.wholesalePrice}</strong>
                                </span>
                              </div>

                              {/* Stats */}
                              <div className="flex flex-wrap items-center gap-x-2 text-[10px] sm:text-[11px] text-slate-500 font-bold">
                                <span>موجودی: <strong className="text-slate-800 font-black">{ad.quantity}</strong></span>
                                {ad.buyerProfit && (
                                  <>
                                    <span className="text-slate-300">•</span>
                                    <span className="text-emerald-600">سود: <strong>{ad.buyerProfit.split(" ")[0]} سود</strong></span>
                                  </>
                                )}
                              </div>
                            </div>

                            {/* Secure Purchase Button */}
                            <div className="shrink-0 flex items-center justify-end">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEscrowModalAd(ad);
                                }}
                                className="px-3 py-1.5 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white rounded-lg text-[10px] sm:text-xs font-black transition-all flex items-center gap-1 cursor-pointer shadow-3xs active:scale-95"
                              >
                                <ShieldCheck size={11} className="shrink-0" />
                                <span>خرید امن</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 2. Regular Ads Section (List Mode) */}
            <div className="space-y-3">
              {featuredAds.length > 0 && (
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                  <div className="w-2 h-4 bg-emerald-500 rounded-full"></div>
                  <h3 className="font-black text-xs sm:text-sm text-slate-800">📋 سایر فرصت‌های معاملاتی تالار</h3>
                </div>
              )}
              {regularAds.length === 0 ? (
                <div className="p-8 text-center text-slate-400 font-medium bg-slate-50 border border-slate-100 rounded-2xl">
                  مورد دیگری یافت نشد.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {regularAds.map((ad, idx) => {
                    const adImg = ad.imageUrl ? getDisplayImageUrl(ad.imageUrl) : getAdFallbackImage(ad.title, ad.category);
                    return (
                      <div
                        onClick={() => {
                          if (onSelectAd) onSelectAd(ad);
                          else setSelectedAdDetail(ad);
                        }}
                        key={`list-reg-ad-${ad.id}-${idx}`}
                        className="rounded-xl p-2.5 text-right flex flex-row items-stretch gap-3 transition-all duration-300 cursor-pointer shadow-2xs hover:shadow-xs group relative bg-white border border-slate-200 hover:border-emerald-300"
                      >
                        {/* Large Clear Image Box */}
                        <div className="w-24 h-24 xs:w-28 xs:h-28 sm:w-36 sm:h-36 rounded-lg overflow-hidden shrink-0 bg-slate-50 relative border border-slate-100 shadow-3xs">
                          <img
                            src={adImg}
                            alt={ad.title}
                            loading="lazy"
                            referrerPolicy="no-referrer"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewImage(adImg);
                            }}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 cursor-zoom-in"
                          />
                          <div className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded-md text-[8px] font-black text-white shadow-md bg-emerald-600">
                            <span>
                              {ad.category === "under_market" ? "📉 کف قیمت" : 
                               ad.category === "liquid" ? "🔥 مازاد" : 
                               ad.category === "equipment" ? "⚙️ تجهیزات" :
                               ad.category === "materials" ? "🧱 مواد اولیه" :
                               ad.category === "services" ? "🛠️ خدمات" :
                               "📦 تامین کالا"}
                            </span>
                          </div>
                        </div>

                        {/* Card Content */}
                        <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold">
                              <span>{ad.date}</span>
                              <span>•</span>
                              <span className="font-black text-slate-700 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200 truncate max-w-[120px] xs:max-w-[160px] sm:max-w-none">
                                {ad.factoryName}
                              </span>
                            </div>

                            <h3 className="font-black text-xs xs:text-sm sm:text-base text-slate-900 group-hover:text-emerald-600 transition-colors line-clamp-1">
                              {ad.title}
                            </h3>
                          </div>

                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1">
                            <div className="space-y-1">
                              {/* Prices inline */}
                              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] xs:text-[11px] sm:text-xs">
                                <span className="text-slate-400 font-bold">بازار: <span className="line-through font-mono">{ad.marketPrice}</span></span>
                                <span className="text-slate-300">|</span>
                                <span className="text-emerald-700 font-black bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                                  قیمت کف: <strong className="font-mono">{ad.wholesalePrice}</strong>
                                </span>
                              </div>

                              {/* Stats */}
                              <div className="flex flex-wrap items-center gap-x-2 text-[10px] sm:text-[11px] text-slate-500 font-bold">
                                <span>موجودی: <strong className="text-slate-800 font-black">{ad.quantity}</strong></span>
                                {ad.buyerProfit && (
                                  <>
                                    <span className="text-slate-300">•</span>
                                    <span className="text-emerald-600">سود: <strong>{ad.buyerProfit.split(" ")[0]} سود</strong></span>
                                  </>
                                )}
                              </div>
                            </div>

                            {/* Secure Purchase Button */}
                            <div className="shrink-0 flex items-center justify-end">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEscrowModalAd(ad);
                                }}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] sm:text-xs font-black transition-all flex items-center gap-1 cursor-pointer shadow-3xs active:scale-95"
                              >
                                <ShieldCheck size={11} className="shrink-0" />
                                <span>خرید امن</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
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
                <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h3 className="font-black text-sm text-slate-900">قوانین و صیانت از اعتبار برندها در تالار کف بازار</h3>
                  <p className="text-[10px] text-slate-400 font-bold">اصول واسطه‌گری امین و معاملات امن پلتفرم دست‌اول</p>
                </div>
              </div>

              <div className="space-y-3.5 py-4 text-xs font-medium text-slate-700 leading-relaxed max-h-[60vh] overflow-y-auto pr-1">
                <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-xl p-3.5 space-y-1">
                  <h4 className="text-amber-900 font-black text-xs flex items-center gap-1.5">
                    <ShieldAlert size={14} className="text-amber-700" />
                    ۱. دستورالعمل صیانت از اعتبار برندها:
                  </h4>
                  <p className="text-[11px] text-amber-900/90 font-bold leading-relaxed">
                    ذکر مستقیم نام تجاری انحصاری در عناوین عمومی ممنوع است. کالاها به صورت عمومی (مانند «۵۰ تن قند کله شکسته») ثبت می‌شوند تا از ریزش قیمت نمایندگی‌های رسمی کارخانه در سراسر کشور جلوگیری گردد.
                  </p>
                </div>

                <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-3.5 space-y-2">
                  <h4 className="text-indigo-950 font-black text-xs flex items-center gap-1.5">
                    <Percent size={14} className="text-emerald-600" />
                    ۲. درصد کارمزد و کمیسیون شفاف پلتفرم:
                  </h4>
                  <div className="text-[11px] text-slate-700 leading-relaxed space-y-2">
                    <p>
                      کارمزد خدمات معامله امن و واسطه‌گری با توجه به نوع معامله تعیین شده و به صورت عادلانه بین خریدار و فروشنده تسهیم می‌گردد:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 font-bold text-[10px] text-center">
                      <div className="bg-white p-1.5 rounded border border-emerald-100">
                        📦 مواد اولیه/کالا: ۲٪
                      </div>
                      <div className="bg-white p-1.5 rounded border border-emerald-100">
                        🛠️ خدمات صنعتی: ۳٪
                      </div>
                      <div className="bg-white p-1.5 rounded border border-emerald-100">
                        ⚙️ ماشین‌آلات: ۱.۵٪
                      </div>
                    </div>
                    <ul className="list-disc list-inside space-y-1 mt-1 text-[10px] text-slate-600">
                      <li><strong>سهم فروشنده (تامین‌کننده): ۷۰٪ از کل کارمزد</strong> (در زمان آزادسازی نهایی از ثمن بار امانی کسر می‌شود).</li>
                      <li><strong>سهم خریدار (کارخانه): ۳۰٪ از کل کارمزد</strong> (در زمان واریز پیش‌پرداخت به مبلغ امانی اضافه می‌گردد).</li>
                    </ul>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200/70 rounded-xl p-3.5 space-y-2">
                  <h4 className="text-slate-900 font-black text-xs flex items-center gap-1.5">
                    <CheckCircle2 size={14} className="text-emerald-600" />
                    ۳. واسطه‌گری امن و پرداخت امانی:
                  </h4>
                  <p className="text-[11px] text-slate-600 font-bold leading-relaxed">
                    کلیه تسویه‌حساب‌ها در حساب امانی دست‌اول نگهداری شده و پس از بارگیری، تایید باسکول و تایید اصالت کالا توسط خریدار به حساب تامین‌کننده منتقل می‌گردد.
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-200/70 rounded-xl p-3.5 space-y-2">
                  <h4 className="text-slate-900 font-black text-xs flex items-center gap-1.5">
                    <Building2 size={14} className="text-emerald-600" />
                    ۴. ممیزی فنی و عقد قرارداد رسمی:
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
                  <div className="w-16 h-16 bg-emerald-600 text-white rounded-full flex items-center justify-center border border-emerald-100 animate-bounce">
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
                    <ShieldCheck className="text-emerald-600 animate-pulse" size={18} />
                    <h4 className="font-black text-slate-800 text-sm">شروع معامله امن (واسطه‌گری پلتفرم دست‌اول)</h4>
                  </div>

                  <p className="text-[11px] text-slate-500 font-bold leading-relaxed bg-emerald-50/50 p-3 rounded-xl border border-emerald-100/50">
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
                        className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-emerald-600 font-mono text-left"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 mb-1.5">پیام یا شرایط خاص درخواستی (اختیاری):</label>
                      <textarea
                        value={buyerMessage}
                        onChange={(e) => setBuyerMessage(e.target.value)}
                        placeholder="مثال: ترجیحاً تحویل در شهرک صنعتی توس مشهد"
                        rows={2}
                        className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-emerald-600 resize-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={escrowLoading}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                  >
                    {escrowLoading ? "در حال ثبت درخواست..." : "ارسال درخواست معامله به بخش نظارت پلتفرم"}
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      </>
      )}

      {/* Detail Modal */}
      {renderDetailModal()}

      {/* Submit Modal inside Full Page Mode */}
      <AnimatePresence>
        {isSubmitModalOpen && renderSubmitModal()}
      </AnimatePresence>

      {/* 📱 دکمه شناور همواره در دسترس مخصوص موبایل (Floating Action Button) */}
      <AddAdButton variant="mobile-fab" />

      {/* Image Lightbox Preview */}
      <ImageLightbox 
        isOpen={!!previewImage}
        onClose={() => setPreviewImage(null)}
        imageUrl={previewImage}
        title={selectedAdDetail?.title || "پیش‌نمایش تصویر"}
        subtitle={`تامین‌کننده: ${selectedAdDetail?.factoryName || "نامشخص"}`}
        footerRight={selectedAdDetail?.wholesalePrice}
      />
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
              <div className="w-20 h-20 bg-emerald-600 text-white rounded-full flex items-center justify-center border border-emerald-100 shadow-md shadow-emerald-100/50 animate-bounce">
                <CheckCircle2 size={40} />
              </div>
              <h4 className="font-black text-slate-900 text-base">درخواست شما با موفقیت ثبت گردید</h4>
              <p className="text-xs text-slate-500 font-bold max-w-sm leading-relaxed">
                اطلاعات با موفقیت ذخیره گردید و جهت تایید فنی در صف بررسی کارشناسان دست‌اول قرار گرفت. به محض تایید، آگهی شما فعال و قابل معامله امن خواهد شد.
              </p>
              <button
                onClick={() => setIsSubmitModalOpen(false)}
                className="w-full sm:w-auto px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-black transition-all cursor-pointer shadow-md flex items-center justify-center gap-2"
              >
                <X size={15} />
                <span>بستن و بازگشت به تالار معاملات</span>
              </button>
            </div>
          ) : (
            <form onSubmit={handleCreateAdAdminApproval} className="space-y-5 text-right">
              {/* Header Title */}
              <div className="flex items-center gap-3 pb-4 border-b border-slate-150">
                <div className="w-10 h-10 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                  <Package size={20} />
                </div>
                <div>
                  <h4 className="font-black text-slate-900 text-base">درج محصول جدید در تالار کف بازار</h4>
                  <p className="text-[10px] text-slate-400 font-bold mt-0.5">معرفی مستقیم کالا و فرصت‌های خرید زیر قیمت بازار به صنایع سراسر کشور</p>
                </div>
              </div>

              {/* Informative Security and Compliance Guideline Box */}
              <div className="bg-gradient-to-r from-emerald-50/70 to-emerald-100/70 border border-emerald-100/60 rounded-2xl p-4 flex gap-3 text-[11px] text-slate-900 font-medium leading-relaxed shadow-xs">
                <AlertTriangle className="text-emerald-600 shrink-0 mt-0.5" size={16} />
                <div>
                  <span className="font-black block text-emerald-900 mb-0.5">امنیت و واسطه‌گری امین دست‌اول:</span>
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
                          ? "bg-emerald-50/80 border-emerald-500 ring-2 ring-emerald-500/20 shadow-sm"
                          : "bg-slate-50 hover:bg-slate-100 border-slate-200"
                      }`}
                    >
                      <div className="flex justify-between items-center w-full">
                        <span className="text-xs font-black text-slate-800">🔥 حراج مازاد خط</span>
                        <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${category === "liquid" ? "border-emerald-600" : "border-slate-300"}`}>
                          {category === "liquid" && <div className="w-1.5 h-1.5 rounded-full bg-emerald-600" />}
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
                          ? "bg-emerald-50/80 border-[#10b981] ring-2 ring-[#10b981]/20 shadow-sm"
                          : "bg-slate-50 hover:bg-slate-100 border-slate-200"
                      }`}
                    >
                      <div className="flex justify-between items-center w-full">
                        <span className="text-xs font-black text-slate-800">📦 تامین مستقیم</span>
                        <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${category === "direct_supply" ? "border-[#10b981]" : "border-slate-300"}`}>
                          {category === "direct_supply" && <div className="w-1.5 h-1.5 rounded-full bg-[#10b981]" />}
                        </div>
                      </div>
                      <p className="text-[9px] text-slate-500 font-bold mt-1.5 leading-tight">
                        تامین مستقیم از انبار درب کارخانه
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCategory("materials")}
                      className={`p-3 rounded-2xl border text-right transition-all cursor-pointer relative flex flex-col justify-between ${
                        category === "materials"
                          ? "bg-purple-50/80 border-purple-500 ring-2 ring-purple-500/20 shadow-sm"
                          : "bg-slate-50 hover:bg-slate-100 border-slate-200"
                      }`}
                    >
                      <div className="flex justify-between items-center w-full">
                        <span className="text-xs font-black text-slate-800">🧪 مواد اولیه</span>
                        <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${category === "materials" ? "border-purple-600" : "border-slate-300"}`}>
                          {category === "materials" && <div className="w-1.5 h-1.5 rounded-full bg-purple-600" />}
                        </div>
                      </div>
                      <p className="text-[9px] text-slate-500 font-bold mt-1.5 leading-tight">
                        عرضه مواد اولیه تولیدی و شیمیایی
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCategory("services")}
                      className={`p-3 rounded-2xl border text-right transition-all cursor-pointer relative flex flex-col justify-between ${
                        category === "services"
                          ? "bg-emerald-50/80 border-emerald-500 ring-2 ring-emerald-500/20 shadow-sm"
                          : "bg-slate-50 hover:bg-slate-100 border-slate-200"
                      }`}
                    >
                      <div className="flex justify-between items-center w-full">
                        <span className="text-xs font-black text-slate-800">🛠️ خدمات فنی</span>
                        <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${category === "services" ? "border-emerald-600" : "border-slate-300"}`}>
                          {category === "services" && <div className="w-1.5 h-1.5 rounded-full bg-emerald-600" />}
                        </div>
                      </div>
                      <p className="text-[9px] text-slate-500 font-bold mt-1.5 leading-tight">
                        خدمات پیمانکاری و تولید قراردادی
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCategory("equipment")}
                      className={`p-3 rounded-2xl border text-right transition-all cursor-pointer relative flex flex-col justify-between ${
                        category === "equipment"
                          ? "bg-emerald-50/80 border-[#10b981] ring-2 ring-[#10b981]/20 shadow-sm"
                          : "bg-slate-50 hover:bg-slate-100 border-slate-200"
                      }`}
                    >
                      <div className="flex justify-between items-center w-full">
                        <span className="text-xs font-black text-slate-800">⚙️ تجهیزات</span>
                        <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${category === "equipment" ? "border-[#10b981]" : "border-slate-300"}`}>
                          {category === "equipment" && <div className="w-1.5 h-1.5 rounded-full bg-[#10b981]" />}
                        </div>
                      </div>
                      <p className="text-[9px] text-slate-500 font-bold mt-1.5 leading-tight">
                        ماشین‌آلات و تجهیزات خط تولید
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
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-3 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-emerald-600 transition-colors"
                  />
                  {phoneWarning && <span className="text-[10px] text-emerald-500 font-bold block mt-1">{phoneWarning}</span>}
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
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-3 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-emerald-600 transition-colors"
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
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-3 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-emerald-600"
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
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-3 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-emerald-600"
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
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-3 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-emerald-600"
                    />
                  </div>
                </div>

                {/* Secure Contact Information (Hidden publicly) */}
                <div className="grid grid-cols-2 gap-3 bg-emerald-50/30 p-4 rounded-2xl border border-emerald-100/20">
                  <div className="col-span-2 flex items-center gap-1.5 text-emerald-900 text-[10px] font-black mb-1">
                    <Lock size={12} className="text-emerald-600" />
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
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 outline-none focus:border-emerald-500"
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
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-850 outline-none focus:border-emerald-500 font-mono text-left"
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
                            className="absolute top-1 left-1 bg-emerald-600 hover:bg-emerald-700 text-white p-1 rounded-full transition-colors cursor-pointer shadow-sm"
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      ))}
                      {uploadedImages.length < 5 && (
                        <label className="border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center text-slate-500 hover:bg-slate-100 hover:border-emerald-400 cursor-pointer aspect-square transition-all">
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
                          ? "border-emerald-500 bg-emerald-50/50"
                          : "border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-emerald-400"
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
                          <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto"></div>
                          <span className="text-[10px] font-black text-emerald-600">در حال آپلود...</span>
                        </div>
                      ) : (
                        <>
                          <UploadCloud className="text-emerald-600 mx-auto" size={28} />
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
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-emerald-600 resize-none transition-colors"
                  />
                </div>

                {/* Special Escrow Brokerage Request Checkbox */}
                <div className="bg-emerald-50/40 border border-emerald-100/60 rounded-2xl p-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={isSpecialRequested}
                      onChange={(e) => setIsSpecialRequested(e.target.checked)}
                      className="w-4 h-4 rounded accent-emerald-600 cursor-pointer"
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
                        className="w-full bg-white border border-emerald-200 rounded-xl px-3 py-2 text-[10px] font-bold text-slate-800 outline-none focus:border-emerald-500 resize-none"
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
                  className="w-1/2 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-emerald-600/15"
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
