import React, { useState, useMemo, useEffect } from "react";
import { 
  Building2, 
  Package, 
  Plus, 
  Truck, 
  DollarSign, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Search, 
  Edit3, 
  Trash2, 
  Boxes, 
  Camera, 
  FileText, 
  Phone, 
  MapPin, 
  Check, 
  X, 
  Sparkles,
  ShieldCheck,
  Award,
  Layers,
  ArrowLeft,
  Loader2,
  Flame,
  Tag,
  TrendingDown,
  Megaphone,
  ArrowUpRight,
  Filter,
  Eye,
  EyeOff,
  RefreshCw,
  ShoppingBag,
  SlidersHorizontal,
  Headphones,
  History,
  Info,
  Link2,
  Percent,
  TrendingUp
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Product, Order } from "../types";
import { getEffectiveProductTags } from "../utils/api-utils";
import ParsPackImageUploader from "./ParsPackImageUploader";
import FactorySalesSettingsTab from "./factory/FactorySalesSettingsTab";
import FactoryTicketsTab from "./factory/FactoryTicketsTab";
import FactoryHistoryTab from "./factory/FactoryHistoryTab";
import AddAdButton from "./AddAdButton";
import MyAdsManager from "./MyAdsManager";
import FactoryProductLinkModal from "./FactoryProductLinkModal";
import { StrictCityProvinceSelector } from "./StrictCityProvinceSelector";

export interface FloorMarketDeal {
  id: string;
  title: string;
  description: string;
  factoryName: string;
  factoryCode?: string;
  category: string;
  quantity: string;
  regularPrice: number;
  floorPrice: number;
  discountPercent: number;
  badgeText: string;
  dealType: "surplus" | "urgent_cash" | "direct_supply" | "raw_material";
  batchDate?: string;
  expiryDate?: string;
  city?: string;
  imageUrl?: string;
  status: "active" | "sold" | "reserved" | "rejected" | "pending";
  createdAt: string;
}

export interface FloorMarketRequest {
  id: string;
  title: string;
  description: string;
  factoryName: string;
  factoryCode?: string;
  quantityNeeded: string;
  targetPrice?: string;
  deliveryCity: string;
  deadlineDays?: string;
  status: "open" | "fulfilled" | "cancelled";
  createdAt: string;
}

interface FactoryManagementPortalProps {
  user: any;
  products: Product[];
  orders: Order[];
  onAddProduct?: (product: Partial<Product>) => Promise<void>;
  onUpdateProduct?: (id: string, updatedFields: Partial<Product>) => Promise<void>;
  onDeleteProduct?: (id: string) => Promise<void>;
  onUpdateUser?: (user: any) => void;
  onRefreshProducts?: () => void;
  b2bConfig?: any;
  onUpdateB2bConfig?: (updatedConfig: any) => void;
  onOpenInvoiceModal?: (order: any) => void;
  onAddToCart?: (product: Product, quantityCartons: number) => void;
}

export default function FactoryManagementPortal({
  user,
  products,
  orders,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onUpdateUser,
  onRefreshProducts,
  b2bConfig,
  onUpdateB2bConfig,
  onOpenInvoiceModal
}: FactoryManagementPortalProps) {
  // Main tabs: 1. Products list, 2. Add product, 3. Orders, 4. Floor Market (کف بازار), 5. Sales Settings, 6. Tickets, 7. History, 8. Factory profile, 9. Brands
  const [activeTab, setActiveTab] = useState<'products' | 'add_product' | 'orders' | 'floor_market' | 'sales_settings' | 'tickets' | 'history' | 'profile' | 'ads' | 'capacity_ads' | 'brands'>('products');

  // Helper: Convert numbers to Persian Digits
  const toPersianNum = (num: number | string | undefined | null) => {
    if (num === undefined || num === null || num === "") return "۰";
    const s = String(num);
    const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
    return s.replace(/\d/g, (d) => persianDigits[parseInt(d, 10)]);
  };

  const currentFactoryName = user?.company || user?.name || "کارخانه تولیدی";
  const factoryCode = user?.factoryCode || user?.id || "FAC-1001";

  // Portal Capacity Ads and Cooperation Requests States with auto-sync
  const [portalCapacityAds, setPortalCapacityAds] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem("dastavval_capacity_ads");
      if (saved) return JSON.parse(saved);
    } catch(e){}
    return [];
  });

  useEffect(() => {
    const handleStorageChange = () => {
      try {
        const saved = localStorage.getItem("dastavval_capacity_ads");
        if (saved) setPortalCapacityAds(JSON.parse(saved));
      } catch(e){}
    };
    window.addEventListener("dastavval_ads_updated", handleStorageChange);
    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("dastavval_ads_updated", handleStorageChange);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  // Form states for inline registering capacity ads in Factory Portal
  const [showPortalAddAd, setShowPortalAddAd] = useState(false);
  const [portalNewTitle, setPortalNewTitle] = useState("");
  const [portalNewCat, setPortalNewCat] = useState("نوشیدنی و آبمیوه");
  const [portalNewMinQty, setPortalNewMinQty] = useState("");
  const [portalNewLocation, setPortalNewLocation] = useState(user?.city || "");
  const [portalNewPhone, setPortalNewPhone] = useState(user?.mobile || user?.username || "");
  const [portalNewDetails, setPortalNewDetails] = useState("");
  const [portalNewDesc, setPortalNewDesc] = useState("");
  const [portalNewImage, setPortalNewImage] = useState("");

  // Brand Management States
  const [newBrandName, setNewBrandName] = useState("");
  const [newBrandType, setNewBrandType] = useState("کنسرو و مواد غذایی");
  const [newBrandLogoUrl, setNewBrandLogoUrl] = useState("");
  const [newBrandProvince, setNewBrandProvince] = useState(user?.province || "تهران");
  const [newBrandDescription, setNewBrandDescription] = useState("");
  const [newBrandRegNumber, setNewBrandRegNumber] = useState("");
  const [brandSubmitMsg, setBrandSubmitMsg] = useState("");
  const [isBrandSubmitting, setIsBrandSubmitting] = useState(false);

  const handlePortalAddBrand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBrandName.trim()) {
      setBrandSubmitMsg("❌ لطفاً نام برند را وارد نمایید.");
      return;
    }
    
    setIsBrandSubmitting(true);
    setBrandSubmitMsg("");

    setTimeout(() => {
      const newBrand = {
        id: "brand-" + Date.now(),
        name: newBrandName.trim(),
        type: newBrandType,
        category: newBrandType,
        icon: "🏷️",
        bg: "bg-emerald-500",
        text: "text-white",
        logoUrl: newBrandLogoUrl.trim() || "https://images.unsplash.com/photo-1541167760496-1628856ab772?q=80&w=200&auto=format&fit=crop",
        factoryId: user?.id || user?.userCode || "FAC-GEN",
        factoryName: currentFactoryName,
        description: newBrandDescription.trim() || `برند رسمی محصولات باکیفیت ${currentFactoryName}`,
        province: newBrandProvince,
        badge: "در انتظار تایید ادمین",
        status: "pending",
        regNumber: newBrandRegNumber.trim()
      };

      let existingBrands = [];
      if (b2bConfig?.brands && Array.isArray(b2bConfig.brands)) {
        existingBrands = [...b2bConfig.brands];
      } else {
        try {
          const saved = localStorage.getItem("dastavval_custom_brands_v2");
          if (saved) existingBrands = JSON.parse(saved);
        } catch (err) {}
      }

      const updatedBrands = [newBrand, ...existingBrands];

      localStorage.setItem("dastavval_custom_brands_v2", JSON.stringify(updatedBrands));
      if (onUpdateB2bConfig) {
        onUpdateB2bConfig({
          ...b2bConfig,
          brands: updatedBrands
        });
      }

      window.dispatchEvent(new CustomEvent("dastavval_brands_updated", { detail: { brands: updatedBrands } }));

      setNewBrandName("");
      setNewBrandLogoUrl("");
      setNewBrandDescription("");
      setNewBrandRegNumber("");
      setIsBrandSubmitting(false);
      setBrandSubmitMsg("✅ درخواست ثبت برند شما با موفقیت ثبت شد و پس از تایید مدیریت فعال خواهد شد.");

      setTimeout(() => setBrandSubmitMsg(""), 6000);
    }, 800);
  };

  const handlePortalAddCapacityAd = (e: React.FormEvent) => {
    e.preventDefault();
    const newAd = {
      id: "cap-ad-" + Date.now(),
      factoryId: user?.id || "FAC-GEN",
      factoryName: currentFactoryName,
      title: portalNewTitle,
      category: portalNewCat,
      location: portalNewLocation,
      phone: portalNewPhone,
      minOrderQty: portalNewMinQty || "توافقی",
      machineryDetails: portalNewDetails,
      description: portalNewDesc,
      imageUrl: portalNewImage || "",
      createdAt: new Date().toLocaleDateString("fa-IR"),
      cooperationRequests: []
    };

    const updated = [newAd, ...portalCapacityAds];
    setPortalCapacityAds(updated);
    localStorage.setItem("dastavval_capacity_ads", JSON.stringify(updated));
    window.dispatchEvent(new Event("dastavval_ads_updated"));

    // Reset Form
    setPortalNewTitle("");
    setPortalNewMinQty("");
    setPortalNewLocation(user?.city || "");
    setPortalNewPhone(user?.mobile || user?.username || "");
    setPortalNewDetails("");
    setPortalNewDesc("");
    setPortalNewImage("");
    setShowPortalAddAd(false);
  };

  const handleUpdateCoopStatus = (adId: string, reqIndex: number, newStatus: string) => {
    const updated = portalCapacityAds.map(ad => {
      if (ad.id === adId && ad.cooperationRequests) {
        const reqs = [...ad.cooperationRequests];
        reqs[reqIndex] = { ...reqs[reqIndex], status: newStatus };
        return { ...ad, cooperationRequests: reqs };
      }
      return ad;
    });
    setPortalCapacityAds(updated);
    localStorage.setItem("dastavval_capacity_ads", JSON.stringify(updated));
    window.dispatchEvent(new Event("dastavval_ads_updated"));
  };

  const handleDeleteCapacityAd = (adId: string) => {
    if (window.confirm("آیا از حذف این آگهی ظرفیت خالی اطمینان دارید؟")) {
      const updated = portalCapacityAds.filter(ad => ad.id !== adId);
      setPortalCapacityAds(updated);
      localStorage.setItem("dastavval_capacity_ads", JSON.stringify(updated));
      window.dispatchEvent(new Event("dastavval_ads_updated"));
    }
  };

  // -------------------------------------------------------------
  // Dynamic Categories from Admin Config (b2bConfig.categories)
  // -------------------------------------------------------------
  const availableCategories = useMemo(() => {
    let list: string[] = [];
    if (b2bConfig?.categories && Array.isArray(b2bConfig.categories)) {
      list = b2bConfig.categories
        .map((c: any) => typeof c === 'string' ? c : (c.name || c.title || ''))
        .filter(Boolean);
    }
    // Also merge with categories present in products
    if (products && Array.isArray(products)) {
      products.forEach(p => {
        if (p.category && !list.includes(p.category)) {
          list.push(p.category);
        }
      });
    }
    // Fallback standard categories if empty
    if (list.length === 0) {
      list = [
        "تنقلات و چیپس",
        "شکلات و بیسکویت",
        "کیک و کلوچه",
        "روغن و چاشنی",
        "کنسرویجات و رب",
        "نوشیدنی و آبمیوه",
        "حبوبات و غلات",
        "شوینده و بهداشتی"
      ];
    }
    return Array.from(new Set(list));
  }, [b2bConfig, products]);

  // Load and memoize brands belonging to this factory
  const allBrandsInSystem = useMemo(() => {
    if (b2bConfig?.brands && Array.isArray(b2bConfig.brands)) {
      return b2bConfig.brands;
    }
    try {
      const saved = localStorage.getItem("dastavval_custom_brands_v2");
      if (saved) return JSON.parse(saved);
    } catch (err) {}
    return [];
  }, [b2bConfig?.brands]);

  const myBrands = useMemo(() => {
    return allBrandsInSystem.filter((b: any) => {
      const fid = (b.factoryId || "").toLowerCase().trim();
      const uid = (user?.id || "").toLowerCase().trim();
      const fname = (b.factoryName || "").toLowerCase().trim();
      const cname = (user?.company || user?.name || "").toLowerCase().trim();
      return (fid && fid === uid) || (fname && cname && fname === cname);
    });
  }, [allBrandsInSystem, user]);

  // Filter products belonging strictly to this factory
  const myProducts = useMemo(() => {
    if (!user) return [];
    const comp = currentFactoryName.toLowerCase().trim();
    const fCode = (factoryCode || "").toLowerCase().trim();
    const uId = (user.id || "").toLowerCase().trim();

    const GENERIC_NAMES = [
      "کارخانه تولیدی",
      "فروشگاه پخش",
      "دست اول",
      "تولیدی",
      "کارخانه",
      "فروشگاه همکار",
      "فروشگاه همکار (ثبت نام آنی)",
      "مجموعه همکار",
      "خریدار عمده",
      "خریدار عمده (ثبت نام آنی)"
    ];

    const isGenericComp = !comp || comp.length < 3 || GENERIC_NAMES.some(g => g.toLowerCase() === comp);

    return products.filter(p => {
      const pFact = (p.factoryName || p.factory_name || p.brand || p.sellerName || "").toLowerCase().trim();
      const pSeller = (p.sellerId || "").toLowerCase().trim();
      const pCreatedBy = ((p as any).createdById || (p as any).userId || "").toLowerCase().trim();

      // Check direct seller ID or user ID match
      if (fCode && pSeller === fCode) return true;
      if (uId && (pSeller === uId || pCreatedBy === uId)) return true;

      // Check exact non-generic company name match
      if (!isGenericComp && pFact && (pFact === comp || (pFact.length >= 4 && (pFact.includes(comp) || comp.includes(pFact))))) {
        return true;
      }

      return false;
    });
  }, [products, user, currentFactoryName, factoryCode]);

  // Filter orders for this factory
  const myOrders = useMemo(() => {
    if (!user) return [];
    const comp = currentFactoryName.toLowerCase().trim();
    const fCode = (factoryCode || "").toLowerCase().trim();
    const uId = (user.id || "").toLowerCase().trim();

    const GENERIC_NAMES = [
      "کارخانه تولیدی",
      "فروشگاه پخش",
      "دست اول",
      "تولیدی",
      "کارخانه",
      "فروشگاه همکار",
      "مجموعه همکار"
    ];
    const isGenericComp = !comp || comp.length < 3 || GENERIC_NAMES.some(g => g.toLowerCase() === comp);

    return orders.filter(order => {
      if (!order.items || !Array.isArray(order.items)) return false;
      return order.items.some((item: any) => {
        const itemFact = (item.factoryName || item.factory_name || item.brand || item.sellerName || "").toLowerCase().trim();
        const sellerId = (item.sellerId || "").toLowerCase().trim();
        if (fCode && sellerId === fCode) return true;
        if (uId && sellerId === uId) return true;
        if (!isGenericComp && itemFact && (itemFact === comp || itemFact.includes(comp))) return true;
        return false;
      });
    });
  }, [orders, user, currentFactoryName, factoryCode]);

  // Product Filter & Search
  const [productSearch, setProductSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<'all' | 'approved' | 'pending'>('all');

  const filteredProducts = useMemo(() => {
    return myProducts.filter(p => {
      const matchesSearch = !productSearch || 
        p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
        p.brand.toLowerCase().includes(productSearch.toLowerCase());

      const isApproved = p.approvalStatus === 'approved' || p.isApproved === true;
      if (filterStatus === 'approved' && !isApproved) return false;
      if (filterStatus === 'pending' && isApproved) return false;

      return matchesSearch;
    });
  }, [myProducts, productSearch, filterStatus]);

  const handleQuickStatusChange = async (productId: string, action: 'activate' | 'deactivate' | 'out_of_stock' | 'charge_50' | 'charge_200') => {
    if (!onUpdateProduct) return;
    try {
      let fields: Partial<Product> = {};
      if (action === 'activate') {
        fields = { disabled: false, isApproved: true, approvalStatus: 'approved' };
      } else if (action === 'deactivate') {
        fields = { disabled: true };
      } else if (action === 'out_of_stock') {
        fields = { stock_quantity_cartons: 0 };
      } else if (action === 'charge_50') {
        fields = { stock_quantity_cartons: 50 };
      } else if (action === 'charge_200') {
        fields = { stock_quantity_cartons: 200 };
      }
      // Instant optimistic update: do not wait for server response or trigger expensive re-fetch
      onUpdateProduct(productId, fields);
    } catch (err) {
      console.error("Error in quick status change:", err);
    }
  };

  // -------------------------------------------------------------
  // Streamlined Product Form (No consumer price, using admin categories)
  // -------------------------------------------------------------
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [prodName, setProdName] = useState("");
  const [prodBrand, setProdBrand] = useState("");
  const [prodCategory, setProdCategory] = useState("");
  const [prodBulkPrice, setProdBulkPrice] = useState<string>("");
  const [prodCartonPack, setProdCartonPack] = useState<string>("24");
  const [prodMinOrder, setProdMinOrder] = useState<string>("5");
  const [prodStock, setProdStock] = useState<string>("100");
  const [prodWeight, setProdWeight] = useState<string>("");
  const [prodUnit, setProdUnit] = useState<string>("کارتن");
  const [prodImageUrl, setProdImageUrl] = useState<string>("");
  const [prodDescription, setProdDescription] = useState<string>("");
  const [prodTags, setProdTags] = useState<string>("");

  const [isSubmittingProd, setIsSubmittingProd] = useState(false);
  const [prodFormSuccess, setProdFormSuccess] = useState<string | null>(null);
  const [prodFormError, setProdFormError] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // -------------------------------------------------------------
  // Factory Production Surplus State & Handlers (مازاد خط تولید)
  // -------------------------------------------------------------
  const [surplusProductModal, setSurplusProductModal] = useState<Product | null>(null);
  const [surplusQuantityCartons, setSurplusQuantityCartons] = useState<number>(50);
  const [surplusDiscountPercent, setSurplusDiscountPercent] = useState<number>(15);
  const [surplusPrice, setSurplusPrice] = useState<number>(0);
  const [surplusDescription, setSurplusDescription] = useState<string>("");
  const [surplusReason, setSurplusReason] = useState<string>("تولید مازاد شیفت و تخلیه انبار");
  const [isSubmittingSurplus, setIsSubmittingSurplus] = useState<boolean>(false);

  const handleSubmitSurplus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!surplusProductModal || !onUpdateProduct) return;
    setIsSubmittingSurplus(true);
    try {
      const baseBulk = surplusProductModal.bulk_price || surplusProductModal.price || 10000;
      const calculatedPrice = surplusPrice > 0 
        ? surplusPrice 
        : Math.round(baseBulk * (1 - surplusDiscountPercent / 100));

      await onUpdateProduct(surplusProductModal.id, {
        isSurplus: true,
        surplusStatus: 'pending',
        surplusQuantityCartons: Number(surplusQuantityCartons),
        surplusDiscountPercent: Number(surplusDiscountPercent),
        surplusPrice: calculatedPrice,
        surplusDescription: `${surplusReason ? `علت: ${surplusReason} | ` : ''}${surplusDescription}`.trim(),
      });

      alert(`درخواست اعلام مازاد خط کالا «${surplusProductModal.name}» ثبت شد و برای تأیید مدیر سایت ارسال گردید.`);
      setSurplusProductModal(null);
    } catch (err: any) {
      alert("خطا در ثبت مازاد خط: " + (err?.message || ""));
    } finally {
      setIsSubmittingSurplus(false);
    }
  };

  // Set default category when available
  useEffect(() => {
    if (!prodCategory && availableCategories.length > 0) {
      setProdCategory(availableCategories[0]);
    }
  }, [availableCategories, prodCategory]);

  // -------------------------------------------------------------
  // Floor Market (کف بازار) State & Handlers
  // -------------------------------------------------------------
  const [floorTab, setFloorTab] = useState<'my_deals' | 'my_requests' | 'explore'>('my_deals');
  const [floorDeals, setFloorDeals] = useState<FloorMarketDeal[]>(() => {
    try {
      const saved = localStorage.getItem("dastavval_floor_market_deals");
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });

  const [floorRequests, setFloorRequests] = useState<FloorMarketRequest[]>(() => {
    try {
      const saved = localStorage.getItem("dastavval_floor_market_requests");
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });

  // Modal forms for floor market
  const [showSellLotModal, setShowSellLotModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [floorSuccessMsg, setFloorSuccessMsg] = useState<string | null>(null);

  // Catalog linking modal state
  const [showCatalogLinkModal, setShowCatalogLinkModal] = useState(false);

  // Quick price editing state
  const [quickPriceProduct, setQuickPriceProduct] = useState<Product | null>(null);
  const [quickPriceVal, setQuickPriceVal] = useState<number | "">("");
  const [isSavingQuickPrice, setIsSavingQuickPrice] = useState(false);

  // Save quick price update
  const handleSaveQuickPrice = async () => {
    if (!quickPriceProduct || quickPriceVal === "" || Number(quickPriceVal) <= 0) {
      alert("لطفاً مبلغ معتبر وارد کنید.");
      return;
    }

    setIsSavingQuickPrice(true);
    try {
      const newP = Number(quickPriceVal);
      if (onUpdateProduct) {
        await onUpdateProduct(quickPriceProduct.id, {
          bulk_price: newP,
          price: newP
        });
      }
      if (onRefreshProducts) {
        await onRefreshProducts();
      }
      setQuickPriceProduct(null);
      setQuickPriceVal("");
    } catch (err: any) {
      alert("خطا در ذخیره قیمت: " + (err.message || "لطفاً دوباره تلاش کنید."));
    } finally {
      setIsSavingQuickPrice(false);
    }
  };

  // Factory profile representation for linking modal
  const currentFactoryProfile = useMemo(() => {
    return {
      id: user?.id || factoryCode || "factory_user",
      name: currentFactoryName,
      factoryCode: factoryCode || user?.factoryCode || "FAC",
      province: user?.province || "",
      city: user?.city || "",
      logoUrl: user?.logoUrl || user?.avatar || "",
      ownedBrands: myBrands.map(b => b.name),
      isFirstHand: true
    };
  }, [user, currentFactoryName, factoryCode, myBrands]);

  // Form for selling in floor market
  const [selectedLotProdId, setSelectedLotProdId] = useState<string>("");
  const [lotTitle, setLotTitle] = useState("");
  const [lotCategory, setLotCategory] = useState("");
  const [lotQuantity, setLotQuantity] = useState("");
  const [lotRegularPrice, setLotRegularPrice] = useState("");
  const [lotFloorPrice, setLotFloorPrice] = useState("");
  const [lotDealType, setLotDealType] = useState<FloorMarketDeal['dealType']>("surplus");
  const [lotDescription, setLotDescription] = useState("");
  const [lotBatchDate, setLotBatchDate] = useState("");
  const [lotImageUrl, setLotImageUrl] = useState("");

  // Form for submitting procurement request in floor market
  const [reqTitle, setReqTitle] = useState("");
  const [reqQuantity, setReqQuantity] = useState("");
  const [reqTargetPrice, setReqTargetPrice] = useState("");
  const [reqDeliveryCity, setReqDeliveryCity] = useState(user?.city || "");
  const [reqDeadlineDays, setReqDeadlineDays] = useState("۷");
  const [reqDescription, setReqDescription] = useState("");

  // Populate lot form when selecting existing product
  const handleSelectProductForLot = (prodId: string) => {
    setSelectedLotProdId(prodId);
    if (!prodId) return;
    const found = myProducts.find(p => p.id === prodId);
    if (found) {
      setLotTitle(`بار مازاد ${found.name}`);
      setLotCategory(found.category || availableCategories[0]);
      setLotRegularPrice(String(found.bulk_price || found.price || ""));
      const discountVal = Math.round((found.bulk_price || found.price || 0) * 0.85);
      setLotFloorPrice(String(discountVal));
      setLotQuantity("۲۰۰ کارتن");
      setLotImageUrl(found.image_url || "");
      setLotDescription(`عرضه مستقیم و حراج نقدی از خط تولید ${found.brand || currentFactoryName}. آماده بارگیری فوری از انبار کارخانه.`);
    }
  };

  // Save new Floor Market Sale Deal
  const handleSaveFloorDeal = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanRegular = parseInt(lotRegularPrice.replace(/[^0-9]/g, ""), 10) || 0;
    const cleanFloor = parseInt(lotFloorPrice.replace(/[^0-9]/g, ""), 10) || 0;
    if (!lotTitle.trim() || cleanFloor <= 0) {
      alert("لطفاً عنوان کالا و قیمت کف بازار را وارد فرمایید.");
      return;
    }

    const discountPct = cleanRegular > 0 ? Math.round(((cleanRegular - cleanFloor) / cleanRegular) * 100) : 15;

    const newDeal: FloorMarketDeal = {
      id: "fmd-" + Date.now(),
      title: lotTitle.trim(),
      description: lotDescription.trim() || "بار مازاد کارخانه آماده بارگیری مستقیم",
      factoryName: currentFactoryName,
      factoryCode: factoryCode,
      category: lotCategory || availableCategories[0] || "تنقلات و چیپس",
      quantity: lotQuantity.trim() || "۱۰۰ کارتن",
      regularPrice: cleanRegular || cleanFloor,
      floorPrice: cleanFloor,
      discountPercent: discountPct > 0 ? discountPct : 15,
      badgeText: lotDealType === 'surplus' ? "📉 مازاد خط تولید" : lotDealType === 'urgent_cash' ? "⚡ حراج نقدینگی" : "🏭 بار مستقیم کارخانه",
      dealType: lotDealType,
      batchDate: lotBatchDate.trim() || "تولید روز",
      city: user?.city || "انبار مرکزی کارخانه",
      imageUrl: lotImageUrl.trim() || (selectedLotProdId ? myProducts.find(p => p.id === selectedLotProdId)?.image_url : undefined),
      status: "active",
      createdAt: new Date().toLocaleDateString('fa-IR')
    };

    const updated = [newDeal, ...floorDeals];
    setFloorDeals(updated);
    localStorage.setItem("dastavval_floor_market_deals", JSON.stringify(updated));

    // Also sync to global dastavval_ads for broad visibility
    try {
      const existingAds = JSON.parse(localStorage.getItem("dastavval_ads") || "[]");
      const adFormatted = {
        id: newDeal.id,
        title: newDeal.title,
        description: newDeal.description,
        factoryName: newDeal.factoryName,
        contactPerson: user?.name || "مدیر فروش کارخانه",
        contactPhone: user?.phone || "۰۹۱۲۳۴۵۶۷۸۹",
        badgeText: newDeal.badgeText,
        category: lotDealType === 'surplus' ? "under_market" : lotDealType === 'urgent_cash' ? "liquid" : "direct_supply",
        quantity: newDeal.quantity,
        wholesalePrice: `${toPersianNum(newDeal.floorPrice.toLocaleString('fa-IR'))} تومان`,
        marketPrice: `${toPersianNum((newDeal.floorPrice * 1.3).toLocaleString('fa-IR'))} تومان`,
        buyerProfit: `${toPersianNum(discountPct)}٪ تخفیف نقدی کف بازار`,
        date: newDeal.createdAt,
        imageUrl: newDeal.imageUrl,
        status: "pending",
        isHotFireDeal: true
      };
      localStorage.setItem("dastavval_ads", JSON.stringify([adFormatted, ...existingAds]));
      
      const existingSponsored = JSON.parse(localStorage.getItem("dastavval_sponsored_ads_v2") || "[]");
      const newSponsoredAd = {
        id: newDeal.id,
        title: newDeal.title,
        description: newDeal.description,
        factoryName: newDeal.factoryName,
        contactPerson: user?.name || "مدیر فروش کارخانه",
        contactPhone: user?.phone || "۰۹۱۲۳۴۵۶۷۸۹",
        badgeText: newDeal.badgeText,
        category: lotDealType === 'surplus' ? "under_market" : lotDealType === 'urgent_cash' ? "liquid" : "direct_supply",
        quantity: newDeal.quantity,
        wholesalePrice: `${toPersianNum(newDeal.floorPrice.toLocaleString('fa-IR'))} تومان`,
        marketPrice: `${toPersianNum((newDeal.floorPrice * 1.3).toLocaleString('fa-IR'))} تومان`,
        buyerProfit: `${toPersianNum(discountPct)}٪ تخفیف نقدی کف بازار`,
        isSponsored: false,
        date: newDeal.createdAt,
        imageUrl: newDeal.imageUrl,
        imageUrls: newDeal.imageUrl ? [newDeal.imageUrl] : [],
        status: "pending"
      };
      localStorage.setItem("dastavval_sponsored_ads_v2", JSON.stringify([newSponsoredAd, ...existingSponsored]));
      window.dispatchEvent(new CustomEvent("dastavval_ads_updated"));

    } catch (e) {}

    setFloorSuccessMsg("آگهی فروش بار مازاد با موفقیت در بخش کف بازار منتشر شد.");
    setShowSellLotModal(false);
    // Reset Form
    setSelectedLotProdId("");
    setLotTitle("");
    setLotRegularPrice("");
    setLotFloorPrice("");
    setLotQuantity("");
    setLotDescription("");
    setLotImageUrl("");
    setTimeout(() => setFloorSuccessMsg(null), 4000);
  };

  // Save new Floor Market Procurement Request
  const handleSaveFloorRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqTitle.trim() || !reqQuantity.trim()) {
      alert("لطفاً عنوان کالای درخواستی و حجم مورد نیاز را وارد فرمایید.");
      return;
    }

    const newReq: FloorMarketRequest = {
      id: "fmr-" + Date.now(),
      title: reqTitle.trim(),
      description: reqDescription.trim() || "استعلام خرید مستقیم و تسویه فوری",
      factoryName: currentFactoryName,
      factoryCode: factoryCode,
      quantityNeeded: reqQuantity.trim(),
      targetPrice: reqTargetPrice.trim() || "توافقی / نقدی",
      deliveryCity: reqDeliveryCity.trim() || user?.city || "درب کارخانه",
      deadlineDays: reqDeadlineDays.trim() || "۷",
      status: "open",
      createdAt: new Date().toLocaleDateString('fa-IR')
    };

    const updated = [newReq, ...floorRequests];
    setFloorRequests(updated);
    localStorage.setItem("dastavval_floor_market_requests", JSON.stringify(updated));

    setFloorSuccessMsg("درخواست تامین / استعلام کالا با موفقیت در بخش کف بازار ثبت گردید.");
    setShowRequestModal(false);
    // Reset Form
    setReqTitle("");
    setReqQuantity("");
    setReqTargetPrice("");
    setReqDescription("");
    setTimeout(() => setFloorSuccessMsg(null), 4000);
  };

  // Toggle deal status
  const handleToggleDealStatus = (id: string, newStatus: FloorMarketDeal['status']) => {
    const updated = floorDeals.map(d => d.id === id ? { ...d, status: newStatus } : d);
    setFloorDeals(updated);
    localStorage.setItem("dastavval_floor_market_deals", JSON.stringify(updated));
  };

  // Delete deal
  const handleDeleteFloorDeal = (id: string) => {
    const updated = floorDeals.filter(d => d.id !== id);
    setFloorDeals(updated);
    localStorage.setItem("dastavval_floor_market_deals", JSON.stringify(updated));
  };

  // Delete request
  const handleDeleteFloorRequest = (id: string) => {
    const updated = floorRequests.filter(r => r.id !== id);
    setFloorRequests(updated);
    localStorage.setItem("dastavval_floor_market_requests", JSON.stringify(updated));
  };

  // -------------------------------------------------------------
  // Factory Profile Form States (Saved once & Rich Optional Info)
  // -------------------------------------------------------------
  const [companyName, setCompanyName] = useState(user?.company || "");
  const [repName, setRepName] = useState(user?.name || "");
  const [repPhone, setRepPhone] = useState(user?.phone || "");
  const [factoryCity, setFactoryCity] = useState(user?.city || "");
  const [factoryAddress, setFactoryAddress] = useState(user?.address || "");
  const [factoryIban, setFactoryIban] = useState(user?.iban || "");
  const [factoryHealthLicense, setFactoryHealthLicense] = useState(user?.healthLicense || "");
  const [factoryLogoUrl, setFactoryLogoUrl] = useState(user?.logoUrl || "");

  // Optional Rich Factory Profile Info
  const [factoryExteriorPhoto, setFactoryExteriorPhoto] = useState(user?.factoryExteriorPhoto || "");
  const [productionLinePhoto, setProductionLinePhoto] = useState(user?.productionLinePhoto || "");
  const [warehousePhoto, setWarehousePhoto] = useState(user?.warehousePhoto || "");
  const [certificatesPhoto, setCertificatesPhoto] = useState(user?.certificatesPhoto || "");
  const [factoryDescription, setFactoryDescription] = useState(user?.factoryDescription || user?.description || "");
  const [establishedYear, setEstablishedYear] = useState(user?.establishedYear || "");
  const [dailyCapacity, setDailyCapacity] = useState(user?.dailyCapacity || "");
  const [productionTech, setProductionTech] = useState(user?.productionTech || "");
  const [storageConditions, setStorageConditions] = useState(user?.storageConditions || "");
  const [emptyCapacityPercent, setEmptyCapacityPercent] = useState<number>(user?.emptyCapacityPercent !== undefined ? Number(user.emptyCapacityPercent) : 40);

  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState<string | null>(null);

  // Populate Edit Product Form
  const handleStartEdit = (prod: Product) => {
    setEditingProductId(prod.id);
    setProdName(prod.name);
    setProdBrand(prod.brand || "");
    setProdCategory(prod.category || availableCategories[0]);
    setProdBulkPrice(String(prod.bulk_price || prod.price || ""));
    setProdCartonPack(String(prod.carton_pack_count || "24"));
    setProdMinOrder(String(prod.min_order_cartons || "5"));
    setProdStock(String(prod.stock_quantity_cartons ?? "100"));
    setProdWeight((prod as any).weight || "");
    setProdUnit((prod as any).unit || "کارتن");
    setProdImageUrl(prod.image_url || "");
    setProdDescription(prod.description || "");
    setProdTags(prod.tags && Array.isArray(prod.tags) ? prod.tags.join("، ") : "");
    setActiveTab('add_product');
  };

  // Reset Product Form
  const handleResetForm = () => {
    setEditingProductId(null);
    setProdName("");
    setProdBrand("");
    setProdCategory(availableCategories[0] || "تنقلات و چیپس");
    setProdBulkPrice("");
    setProdCartonPack("24");
    setProdMinOrder("5");
    setProdStock("100");
    setProdWeight("");
    setProdUnit("کارتن");
    setProdImageUrl("");
    setProdDescription("");
    setProdTags("");
    setProdFormError(null);
    setProdFormSuccess(null);
  };

  // AI Description Generator
  const handleGenerateAiDescription = () => {
    if (!prodName) {
      setProdFormError("لطفاً ابتدا نام کالا را بنویسید.");
      return;
    }
    setProdDescription(`تولید مستقیم و تازه در خط تولید ${user?.company || currentFactoryName}. بسته‌بندی مکانیزه استاندارد با تضمین کیفیت و حاشیه سود مناسب برای پخش عمده و بنکداران.`);
  };

  // Submit Product Form
  const handleSubmitProductForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setProdFormError(null);
    setProdFormSuccess(null);

    const cleanBulkPrice = parseInt(prodBulkPrice.replace(/[^0-9]/g, ""), 10);
    if (!cleanBulkPrice || cleanBulkPrice <= 0) {
      setProdFormError("لطفاً قیمت عمده کارخانه را به تومان وارد نمایید.");
      return;
    }

    if (!prodImageUrl) {
      setProdFormError("لطفاً عکس محصول را از گالری انتخاب فرمایید.");
      return;
    }

    setIsSubmittingProd(true);

    try {
      const cleanPack = parseInt(prodCartonPack, 10) || 24;
      const cleanMin = parseInt(prodMinOrder, 10) || 5;
      const cleanStock = parseInt(prodStock, 10) || 100;
      const cleanConsumerPrice = Math.round(cleanBulkPrice * 1.25);

      const customTagsList = prodTags ? prodTags.split(/[\n،,]+/).map(t => t.trim()).filter(Boolean) : [];
      const computedTags = getEffectiveProductTags({
        name: prodName.trim(),
        brand: prodBrand || user?.company || currentFactoryName,
        category: prodCategory || availableCategories[0],
        tags: customTagsList
      });

      const productPayload: Partial<Product> = {
        name: prodName.trim(),
        brand: prodBrand || user?.company || currentFactoryName,
        category: prodCategory || availableCategories[0],
        price: cleanBulkPrice,
        bulk_price: cleanBulkPrice,
        consumer_price: cleanConsumerPrice, // Maintained internally for calculations
        carton_pack_count: cleanPack,
        min_order_cartons: cleanMin,
        stock_quantity_cartons: cleanStock,
        unit: prodUnit || "کارتن",
        image_url: prodImageUrl,
        description: prodDescription.trim(),
        tags: computedTags,
        factoryName: user?.company || currentFactoryName,
        factory_name: user?.company || currentFactoryName,
        sellerId: factoryCode,
        sellerName: user?.company || currentFactoryName,
        weight: prodWeight.trim() || undefined,
        healthLicense: user?.healthLicense || undefined, // Automatically inherits factory license
      };

      if (editingProductId) {
        const oldProduct = myProducts.find(p => p.id === editingProductId);
        const oldPrice = oldProduct?.bulk_price || oldProduct?.price || 0;
        if (oldPrice > 0 && oldPrice !== cleanBulkPrice) {
          const diffPercent = Math.round(((cleanBulkPrice - oldPrice) / oldPrice) * 100);
          const newRecord = {
            id: `ph-${Date.now()}`,
            productId: editingProductId,
            productName: prodName.trim(),
            oldPrice,
            newPrice: cleanBulkPrice,
            changePercent: diffPercent,
            changedAt: new Date().toLocaleDateString('fa-IR') + " - " + new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
            note: "بروزرسانی نرخ مصوب توسط کارخانه"
          };
          try {
            const existingHist = JSON.parse(localStorage.getItem("dastavval_factory_price_history") || "[]");
            localStorage.setItem("dastavval_factory_price_history", JSON.stringify([newRecord, ...existingHist]));
          } catch (e) {}
        }

        if (onUpdateProduct) {
          await onUpdateProduct(editingProductId, productPayload);
        }
        setProdFormSuccess("مشخصات کالا با موفقیت بروزرسانی شد.");
      } else {
        // New Product - requires review before public listing
        productPayload.approvalStatus = 'pending';
        productPayload.isApproved = false;

        if (onAddProduct) {
          await onAddProduct(productPayload);
        }
        setProdFormSuccess("کالای جدید با موفقیت ثبت شد و پس از بررسی واحد ممیزی در ویترین قرار می‌گیرد.");
      }

      onRefreshProducts?.();
      setTimeout(() => {
        handleResetForm();
        setActiveTab('products');
      }, 1500);
    } catch (err: any) {
      setProdFormError("خطا در ثبت کالا: " + (err.message || err));
    } finally {
      setIsSubmittingProd(false);
    }
  };

  // Delete Product with strict ownership verification
  const handleDeleteProduct = async (id: string) => {
    try {
      // Security ownership check
      const targetProd = products.find(p => p.id === id);
      if (!targetProd) return;

      const uId = (user?.id || "").toLowerCase().trim();
      const fCode = (factoryCode || user?.factoryCode || "").toLowerCase().trim();
      const pSeller = (targetProd.sellerId || "").toLowerCase().trim();
      const pCreatedBy = ((targetProd as any).createdById || (targetProd as any).userId || "").toLowerCase().trim();
      const userComp = (currentFactoryName || user?.company || "").toLowerCase().trim();
      const pFact = (targetProd.factoryName || targetProd.factory_name || targetProd.brand || "").toLowerCase().trim();

      const isAdmin = user?.role === 'admin';
      const isOwner = (uId && (pSeller === uId || pCreatedBy === uId)) ||
                      (fCode && pSeller === fCode) ||
                      (userComp && userComp.length >= 4 && (pFact === userComp || pFact.includes(userComp)));

      if (!isAdmin && !isOwner) {
        alert("⛔ خطای امنیت: شما مجاز به حذف این کالا نیستید زیرا این محصول متعلق به کارخانه شما نمی‌باشد.");
        setDeleteConfirmId(null);
        return;
      }

      if (onDeleteProduct) {
        await onDeleteProduct(id);
      }
      setDeleteConfirmId(null);
      onRefreshProducts?.();
    } catch (err) {
      console.error("Error deleting product:", err);
    }
  };

  // Save Factory Profile
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setProfileSuccessMsg(null);

    try {
      const updatedProfile = {
        ...user,
        company: companyName.trim(),
        name: repName.trim(),
        phone: repPhone.trim(),
        city: factoryCity.trim(),
        address: factoryAddress.trim(),
        iban: factoryIban.trim(),
        healthLicense: factoryHealthLicense.trim(),
        logoUrl: factoryLogoUrl.trim(),
        // Optional rich info
        factoryExteriorPhoto: factoryExteriorPhoto.trim(),
        productionLinePhoto: productionLinePhoto.trim(),
        warehousePhoto: warehousePhoto.trim(),
        certificatesPhoto: certificatesPhoto.trim(),
        factoryDescription: factoryDescription.trim(),
        establishedYear: establishedYear.trim(),
        dailyCapacity: dailyCapacity.trim(),
        productionTech: productionTech.trim(),
        storageConditions: storageConditions.trim(),
        emptyCapacityPercent: Number(emptyCapacityPercent),
      };

      localStorage.setItem("dastavval_user", JSON.stringify(updatedProfile));

      const localUsers = JSON.parse(localStorage.getItem("dastavval_local_users") || "{}");
      if (user?.email && localUsers[user.email]) {
        localUsers[user.email] = {
          ...localUsers[user.email],
          ...updatedProfile
        };
        localStorage.setItem("dastavval_local_users", JSON.stringify(localUsers));
      }

      if (onUpdateUser) {
        onUpdateUser(updatedProfile);
      }

      // Update b2bConfig factories list if onUpdateB2bConfig is available
      if (onUpdateB2bConfig && b2bConfig?.factories) {
        const factoryId = user?.factoryCode || user?.id;
        const updatedFactories = b2bConfig.factories.map((f: any) => {
          if (f.id === factoryId || f.factoryCode === factoryId || f.name === user?.company || f.name === user?.name) {
            return {
              ...f,
              name: companyName.trim(),
              location: factoryCity.trim(),
              city: factoryCity.trim(),
              phone: repPhone.trim(),
              logoUrl: factoryLogoUrl.trim() || f.logoUrl,
              coverUrl: factoryExteriorPhoto.trim() || f.coverUrl,
              description: factoryDescription.trim() || f.description,
              establishedYear: establishedYear.trim() || f.establishedYear,
              capacity: dailyCapacity.trim() || f.capacity,
              emptyCapacityPercent: Number(emptyCapacityPercent),
              specs: productionTech.trim() ? [productionTech.trim()] : (f.specs || []),
              galleryImages: [
                ...(factoryExteriorPhoto.trim() ? [{ url: factoryExteriorPhoto.trim(), title: "عکس محوطه و نمای کارخانه", category: "exterior" }] : []),
                ...(productionLinePhoto.trim() ? [{ url: productionLinePhoto.trim(), title: "خط تولید و ماشین‌آلات", category: "production" }] : []),
                ...(warehousePhoto.trim() ? [{ url: warehousePhoto.trim(), title: "انبار مرکزی و نگهداری کالا", category: "warehouse" }] : []),
                ...(certificatesPhoto.trim() ? [{ url: certificatesPhoto.trim(), title: "ایزوها و گواهینامه‌ها", category: "lab" }] : [])
              ]
            };
          }
          return f;
        });
        
        onUpdateB2bConfig({
          ...b2bConfig,
          factories: updatedFactories
        });
      }

      setProfileSuccessMsg("اطلاعات و پروانه‌های کارخانه با موفقیت ذخیره شد.");
      setTimeout(() => setProfileSuccessMsg(null), 3500);
    } catch (err: any) {
      alert("خطا در ذخیره مشخصات: " + (err.message || err));
    } finally {
      setIsSavingProfile(false);
    }
  };

  const totalApproved = myProducts.filter(p => p.approvalStatus === 'approved' || p.isApproved === true).length;
  const totalPending = myProducts.filter(p => p.approvalStatus === 'pending' || (p.approvalStatus !== 'approved' && p.isApproved !== true)).length;

  const isUserPendingApproval = user?.role === 'factory' && (
    user?.status === 'pending_verification' || 
    user?.isApproved === false || 
    user?.isFactoryApproved === false
  );

  return (
    <div className="space-y-6 text-right font-sans" dir="rtl">
      
      {/* Pending Admin Verification Banner */}
      {isUserPendingApproval && (
        <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-amber-500/10 border-2 border-amber-500/30 rounded-3xl p-5 shadow-sm text-right flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fade-in">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-700 flex items-center justify-center shrink-0">
              <Clock size={24} className="animate-pulse" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-amber-900">
                  ⏳ حساب کاربری در انتظار تایید مدیریت سایت
                </h3>
                <span className="bg-amber-100 text-amber-800 text-[10px] font-black px-2 py-0.5 rounded-full border border-amber-300">
                  بررسی مدارک
                </span>
              </div>
              <p className="text-xs text-amber-800 font-bold leading-relaxed">
                نقش انتخاب شده نیاز به احراز هویت توسط مدیر سایت دارد. مدارک شما در صف تایید مدیریت قرار دارد و به محض بررسی، قابلیت انتشار محصولات فعال می‌گردد.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Top Banner / Factory Header */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 overflow-hidden shrink-0 shadow-2xs">
            {user?.logoUrl ? (
              <img src={user.logoUrl} alt="لوگوی کارخانه" className="w-full h-full object-cover" />
            ) : (
              <Building2 size={28} />
            )}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-black text-slate-900">{user?.company || "کارخانه تولیدی"}</h2>
              <span className="bg-emerald-600 text-white text-[11px] font-black px-2.5 py-0.5 rounded-full border border-emerald-100">
                پنل اختصاصی کارخانه
              </span>
              <span className="bg-slate-100 text-slate-600 text-[10px] font-mono font-black px-2 py-0.5 rounded-lg border border-slate-200">
                ID: {user?.factoryCode || user?.userCode || user?.id || "FAC-1001"}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              مسئول هماهنگی: {user?.name || "ثبت نشده"} | تلفن بارگیری: {user?.phone || "ثبت نشده"}
            </p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="bg-slate-50 px-4 py-2 rounded-2xl border border-slate-200 text-center flex-1 md:flex-initial">
            <span className="text-[10px] text-slate-500 font-bold block">کالاهای فعال ویترین</span>
            <span className="text-base font-black text-emerald-700">{toPersianNum(totalApproved)} کالا</span>
          </div>
          <div className="bg-slate-50 px-4 py-2 rounded-2xl border border-slate-200 text-center flex-1 md:flex-initial">
            <span className="text-[10px] text-slate-500 font-bold block">در انتظار تایید</span>
            <span className="text-base font-black text-amber-700">{toPersianNum(totalPending)} کالا</span>
          </div>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="bg-white rounded-2xl p-1.5 border border-slate-200 shadow-xs flex items-center gap-1.5 overflow-x-auto">
        <button
          onClick={() => setActiveTab('products')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'products'
              ? "bg-emerald-600 text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          <Package size={16} />
          <span>محصولات کارخانه ({toPersianNum(myProducts.length)})</span>
        </button>

        <button
          onClick={() => {
            handleResetForm();
            setActiveTab('add_product');
          }}
          className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'add_product'
              ? "bg-emerald-600 text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          <Plus size={16} />
          <span>{editingProductId ? "ویرایش کالا" : "افزودن محصول جدید"}</span>
        </button>

        <button
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'orders'
              ? "bg-emerald-600 text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          <Truck size={16} />
          <span>سفارشات عمده ({toPersianNum(myOrders.length)})</span>
        </button>

        <button
          onClick={() => setActiveTab('floor_market')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'floor_market'
              ? "bg-emerald-600 text-white shadow-xs"
              : "text-amber-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/50"
          }`}
        >
          <Flame size={16} className={activeTab === 'floor_market' ? "text-white" : "text-emerald-600"} />
          <span>کف بازار (فروش مازاد و تقاضا)</span>
          {floorDeals.length > 0 && (
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${activeTab === 'floor_market' ? 'bg-amber-800 text-white' : 'bg-emerald-200 text-amber-900'}`}>
              {toPersianNum(floorDeals.length)}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('sales_settings')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'sales_settings'
              ? "bg-emerald-600 text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          <SlidersHorizontal size={16} />
          <span>تنظیمات فروش و توزیع</span>
        </button>

        <button
          onClick={() => setActiveTab('tickets')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'tickets'
              ? "bg-emerald-600 text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          <Headphones size={16} />
          <span>تیکت‌ها و مکاتبات</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'history'
              ? "bg-emerald-600 text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          <History size={16} />
          <span>تاریخچه و لاگ‌ها</span>
        </button>

        <button
          onClick={() => setActiveTab('ads')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'ads'
              ? "bg-emerald-600 text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          <Megaphone size={16} />
          <span>آگهی‌های من</span>
        </button>

        <button
          onClick={() => setActiveTab('capacity_ads')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'capacity_ads'
              ? "bg-emerald-600 text-white shadow-xs"
              : "text-amber-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/50"
          }`}
        >
          <Megaphone size={16} className={activeTab === 'capacity_ads' ? "text-white" : "text-emerald-600"} />
          <span>📢 ظرفیت خالی تولید (OEM)</span>
        </button>

        <button
          onClick={() => setActiveTab('brands')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'brands'
              ? "bg-emerald-600 text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          <Award size={16} />
          <span>🏷️ برندهای من</span>
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'profile'
              ? "bg-emerald-600 text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          <Building2 size={16} />
          <span>مشخصات کارخانه و پروانه‌ها</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 1. TAB: PRODUCTS LIST & INVENTORY                                        */}
      {/* ========================================================================= */}
      {activeTab === 'products' && (
        <div className="space-y-4">
          
          {/* Action Bar */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="جستجوی نام کالا در لیست..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="w-full pr-10 pl-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-emerald-600 transition-all"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold">
                <button
                  onClick={() => setFilterStatus('all')}
                  className={`px-3 py-1.5 rounded-lg cursor-pointer transition-all ${filterStatus === 'all' ? 'bg-white text-slate-900 shadow-2xs font-black' : 'text-slate-500'}`}
                >
                  همه ({toPersianNum(myProducts.length)})
                </button>
                <button
                  onClick={() => setFilterStatus('approved')}
                  className={`px-3 py-1.5 rounded-lg cursor-pointer transition-all ${filterStatus === 'approved' ? 'bg-white text-emerald-700 shadow-2xs font-black' : 'text-slate-500'}`}
                >
                  تایید شده ({toPersianNum(totalApproved)})
                </button>
                <button
                  onClick={() => setFilterStatus('pending')}
                  className={`px-3 py-1.5 rounded-lg cursor-pointer transition-all ${filterStatus === 'pending' ? 'bg-white text-amber-700 shadow-2xs font-black' : 'text-slate-500'}`}
                >
                  در انتظار تایید ({toPersianNum(totalPending)})
                </button>
              </div>

              <button
                onClick={() => setShowCatalogLinkModal(true)}
                className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shrink-0 shadow-2xs"
                title="اتصال کالا از کاتالوگ پلتفرم یا تنظیم دسته‌جمعی قیمت‌ها"
              >
                <Link2 size={15} />
                <span>اتصال کالا از کاتالوگ</span>
              </button>

              <button
                onClick={() => {
                  handleResetForm();
                  setActiveTab('add_product');
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shrink-0 shadow-2xs"
              >
                <Plus size={15} />
                <span>کالای جدید</span>
              </button>
            </div>
          </div>

          {/* Products Grid */}
          {filteredProducts.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-xs space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mx-auto text-2xl">
                📦
              </div>
              <h4 className="text-sm font-black text-slate-900">محصولی در این لیست یافت نشد</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                شما می‌توانید به سادگی با انتخاب عکس از گالری و مشخص کردن تعداد در کارتن، کالاهای خط تولید خود را اضافه فرمایید.
              </p>
              <button
                onClick={() => {
                  handleResetForm();
                  setActiveTab('add_product');
                }}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all inline-flex items-center gap-2 cursor-pointer shadow-xs mt-2"
              >
                <Plus size={16} />
                <span>افزودن اولین محصول خط تولید</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredProducts.map((product, idx) => {
                const isApproved = product.approvalStatus === 'approved' || product.isApproved === true;
                const bulkPrice = product.bulk_price || product.price || 0;

                return (
                  <div
                    key={`fact-prod-${product.id || idx}-${idx}`}
                    className="bg-white rounded-3xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between space-y-3 group hover:border-indigo-300 transition-all"
                  >
                    <div className="space-y-3">
                      {/* Product Image */}
                      <div className="relative w-full h-44 bg-slate-50 rounded-2xl overflow-hidden border border-slate-100 flex items-center justify-center">
                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <Package className="text-slate-300" size={40} />
                        )}
                        
                        {/* Approval & Surplus Badges */}
                        <div className="absolute top-2.5 right-2.5 flex flex-col gap-1 items-end">
                          {isApproved ? (
                            <span className="bg-emerald-600 text-white text-[10px] font-black px-2.5 py-1 rounded-xl border border-emerald-200/80 flex items-center gap-1 shadow-2xs">
                              <CheckCircle2 size={12} className="text-white" />
                              <span>تایید شده در ویترین</span>
                            </span>
                          ) : (
                            <span className="bg-emerald-50 text-amber-800 text-[10px] font-black px-2.5 py-1 rounded-xl border border-emerald-200/80 flex items-center gap-1 shadow-2xs">
                              <Clock size={12} className="text-amber-600" />
                              <span>در انتظار تایید ممیزی</span>
                            </span>
                          )}

                          {product.isSurplus && (
                            <span className={`text-[9.5px] font-black px-2 py-0.5 rounded-lg flex items-center gap-1 shadow-2xs ${
                              product.surplusStatus === 'approved'
                                ? "bg-emerald-500 text-white"
                                : product.surplusStatus === 'rejected'
                                ? "bg-rose-500 text-white"
                                : "bg-amber-400 text-amber-950 font-black animate-pulse"
                            }`}>
                              <TrendingDown size={11} />
                              <span>
                                {product.surplusStatus === 'approved' 
                                  ? `مازاد خط تایید شده (${toPersianNum(product.surplusQuantityCartons || 0)} کارتن)`
                                  : product.surplusStatus === 'rejected'
                                  ? "مازاد خط رد شده"
                                  : `مازاد خط (در انتظار بررسی مدیر)`}
                              </span>
                            </span>
                          )}
                        </div>

                        {/* Carton Pack Badge */}
                        <div className="absolute bottom-2.5 left-2.5 bg-slate-400/50 backdrop-blur-sm text-white text-[10px] font-black px-2 py-0.5 rounded-lg">
                          هر کارتن: {toPersianNum(product.carton_pack_count || 24)} عدد
                        </div>
                      </div>

                      {/* Product Details */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] text-slate-400 font-bold">
                          <span>دسته‌بندی: {product.category || "تنقلات"}</span>
                          <span>حداقل سفارش: {toPersianNum(product.min_order_cartons || 5)} کارتن</span>
                        </div>
                        <h4 className="text-xs font-black text-slate-900 line-clamp-1">
                          {product.name}
                        </h4>
                      </div>

                      {/* Wholesale Price Tag (Factory Gate Only) */}
                      <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-100 flex items-center justify-between">
                        <span className="text-[11px] text-slate-500 font-bold">قیمت عمده کارخانه:</span>
                        <div className="text-left">
                          <span className="text-xs font-black text-emerald-700">
                            {toPersianNum(bulkPrice.toLocaleString('fa-IR'))}
                          </span>
                          <span className="text-[10px] text-slate-500 font-bold mr-1">تومان / کارتن</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-100">
                      {/* Quick Status Toggles Row (4-5 Icons) */}
                      <div className="flex items-center justify-between bg-slate-50 p-1.5 rounded-xl border border-slate-150 gap-1 mb-1">
                        <span className="text-[9px] font-black text-slate-400 select-none mr-1">تنظیم سریع:</span>
                        <div className="flex items-center gap-1">
                          {/* 1. Activate */}
                          <button
                            type="button"
                            onClick={() => handleQuickStatusChange(product.id, 'activate')}
                            className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                              !product.disabled && (product.isApproved || product.approvalStatus === 'approved')
                                ? "bg-emerald-600 text-white shadow-2xs"
                                : "bg-white text-slate-400 hover:text-emerald-600 border border-slate-200"
                            }`}
                            title="فعال‌سازی و نمایش در ویترین"
                          >
                            <Eye size={12} />
                          </button>

                          {/* 2. Deactivate */}
                          <button
                            type="button"
                            onClick={() => handleQuickStatusChange(product.id, 'deactivate')}
                            className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                              product.disabled
                                ? "bg-rose-600 text-white shadow-2xs"
                                : "bg-white text-slate-400 hover:text-rose-600 border border-slate-200"
                            }`}
                            title="غیرفعال‌سازی و مخفی کردن"
                          >
                            <EyeOff size={12} />
                          </button>

                          {/* 3. Out of stock */}
                          <button
                            type="button"
                            onClick={() => handleQuickStatusChange(product.id, 'out_of_stock')}
                            className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                              product.stock_quantity_cartons === 0
                                ? "bg-amber-500 text-slate-950 shadow-2xs"
                                : "bg-white text-slate-400 hover:text-amber-600 border border-slate-200"
                            }`}
                            title="ناموجود کردن کالا"
                          >
                            <AlertCircle size={12} />
                          </button>

                          {/* 4. Charge 50 */}
                          <button
                            type="button"
                            onClick={() => handleQuickStatusChange(product.id, 'charge_50')}
                            className={`px-1.5 py-1 rounded-lg transition-all text-[9px] font-black cursor-pointer flex items-center gap-0.5 ${
                              product.stock_quantity_cartons === 50
                                ? "bg-indigo-600 text-white shadow-2xs"
                                : "bg-white text-slate-500 hover:text-indigo-600 border border-slate-200"
                            }`}
                            title="شارژ سریع ۵۰ کارتن"
                          >
                            <Package size={10} />
                            <span>۵۰</span>
                          </button>

                          {/* 5. Charge 200 */}
                          <button
                            type="button"
                            onClick={() => handleQuickStatusChange(product.id, 'charge_200')}
                            className={`px-1.5 py-1 rounded-lg transition-all text-[9px] font-black cursor-pointer flex items-center gap-0.5 ${
                              product.stock_quantity_cartons === 200
                                ? "bg-violet-600 text-white shadow-2xs"
                                : "bg-white text-slate-500 hover:text-violet-600 border border-slate-200"
                            }`}
                            title="شارژ سریع ۲۰۰ کارتن"
                          >
                            <Boxes size={10} />
                            <span>۲۰۰</span>
                          </button>
                        </div>
                      </div>

                      {/* Primary Actions Row */}
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleStartEdit(product)}
                          className="flex-1 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Edit3 size={13} />
                          <span>ویرایش کالا</span>
                        </button>

                        <button
                          onClick={() => {
                            handleSelectProductForLot(product.id);
                            setActiveTab('floor_market');
                            setShowSellLotModal(true);
                          }}
                          title="فروش مازاد این کالا در کف بازار"
                          className="p-2 bg-emerald-50 hover:bg-emerald-100 text-amber-700 rounded-xl transition-all cursor-pointer"
                        >
                          <Flame size={15} />
                        </button>

                        <button
                          onClick={() => setDeleteConfirmId(product.id)}
                          className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl transition-all cursor-pointer"
                          title="حذف کالا"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>

                      {/* Factory Surplus Proposal Button */}
                      <button
                        type="button"
                        onClick={() => {
                          setSurplusProductModal(product);
                          setSurplusQuantityCartons(product.surplusQuantityCartons || 50);
                          setSurplusDiscountPercent(product.surplusDiscountPercent || 15);
                          setSurplusPrice(product.surplusPrice || Math.round((product.bulk_price || product.price || 0) * 0.85));
                          setSurplusDescription(product.surplusDescription || "");
                        }}
                        className={`w-full py-1.5 px-2 rounded-xl text-[11px] font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
                          product.isSurplus && product.surplusStatus === 'pending'
                            ? "bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100"
                            : product.isSurplus && product.surplusStatus === 'approved'
                            ? "bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100"
                            : "bg-rose-50/70 hover:bg-rose-100 text-rose-700 border-rose-200"
                        }`}
                      >
                        <TrendingDown size={13} className={product.isSurplus ? "text-amber-600" : "text-rose-600"} />
                        <span>
                          {product.isSurplus 
                            ? (product.surplusStatus === 'pending' ? "⏳ ویرایش مازاد خط (در حال بررسی)" : "📉 ویرایش مازاد خط تولید")
                            : "📉 انتخاب به عنوان مازاد خط تولید"}
                        </span>
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>
          )}

        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. TAB: ADD / EDIT PRODUCT FORM (Streamlined with Admin Categories)        */}
      {/* ========================================================================= */}
      {activeTab === 'add_product' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
          
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="space-y-0.5">
              <h3 className="text-base font-black text-slate-900">
                {editingProductId ? "ویرایش مشخصات کالای خط تولید" : "افزودن محصول جدید به خط تولید"}
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                مشخصات پروانه بهداشت از پروفایل کارخانه فراخوانی می‌شود و فقط کافیست عکس، نام کالا و قیمت عمده را ثبت فرمایید.
              </p>
            </div>

            {editingProductId && (
              <button
                onClick={handleResetForm}
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black transition-all flex items-center gap-1 cursor-pointer"
              >
                <X size={14} />
                <span>لغو ویرایش</span>
              </button>
            )}
          </div>

          {prodFormSuccess && (
            <div className="bg-emerald-600 text-white p-3.5 rounded-2xl text-xs font-black flex items-center gap-2 border border-emerald-200">
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
              <span>{prodFormSuccess}</span>
            </div>
          )}

          {prodFormError && (
            <div className="bg-emerald-600 text-white p-3.5 rounded-2xl text-xs font-black flex items-center gap-2 border border-emerald-200">
              <AlertCircle size={16} className="text-emerald-600 shrink-0" />
              <span>{prodFormError}</span>
            </div>
          )}

          <form onSubmit={handleSubmitProductForm} className="space-y-5">
            
            {/* 1. Photo Upload (Simple Gallery Picker with auto-upload) */}
            <div className="space-y-1.5">
              <ParsPackImageUploader
                label="عکس محصول (انتخاب از گالری یا دستگاه):"
                subLabel="عکس واضح روی بسته‌بندی کالا"
                value={prodImageUrl}
                onChange={setProdImageUrl}
                folder="products"
                aspectRatio="square"
                required
              />
            </div>

            {/* 2. Product Name & Category (Synced with Admin Categories) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              
              <div className="space-y-1">
                <label className="text-xs font-black text-slate-800 block">نام محصول:</label>
                <input
                  type="text"
                  required
                  value={prodName}
                  onChange={(e) => setProdName(e.target.value)}
                  placeholder="مثال: چیپس سرکه‌ای ۶۰ گرمی"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:border-emerald-600 text-xs font-bold text-slate-900"
                />
              </div>

              {myBrands.length > 0 && (
                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-800 block">برند تجاری محصول:</label>
                  <select
                    value={prodBrand}
                    onChange={(e) => setProdBrand(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:border-emerald-600 text-xs font-bold text-slate-900 cursor-pointer"
                  >
                    <option value="">{user?.company || currentFactoryName} (بدون زیربرند)</option>
                    {myBrands.filter((b: any) => b.status === 'approved' || b.badge?.includes("رسمی")).map((b: any) => (
                      <option key={b.id} value={b.name}>{b.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-black text-slate-800 block">دسته‌بندی اصلی کالا:</label>
                <select
                  value={prodCategory}
                  onChange={(e) => setProdCategory(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:border-emerald-600 text-xs font-bold text-slate-900 cursor-pointer"
                >
                  {availableCategories.map((catName, cIdx) => (
                    <option key={`fact-mgmt-cat-opt-${catName}-${cIdx}`} value={catName}>
                      {catName}
                    </option>
                  ))}
                </select>
              </div>

            </div>

            {/* Pricing Policy Clarification Notice */}
            <div className="bg-blue-50/70 border border-blue-200/80 rounded-2xl p-4 space-y-1.5 text-xs text-slate-700">
              <div className="flex items-center gap-2 font-black text-blue-950">
                <Info size={16} className="text-emerald-600 shrink-0" />
                <span>خط‌مشی تعیین نرخ و قیمت‌گذاری در سامانه دست‌اول:</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                قیمت ثبت‌شده توسط کارخانه، <strong>«قیمت خالص مصوب تحویل درب کارخانه»</strong> (مبلغ خالص واریزی به تولیدکننده) است. تعیین درصد تخفیف، هزینه بازاریابی و قیمت نهایی فروش به خریداران در ویترین سایت بر عهده مدیریت بازرگانی دست‌اول است و شما هر زمان مایل باشید می‌توانید نرخ پایه عمده خود را تغییر دهید.
              </p>
            </div>

            {/* 3. Pricing & Packaging (Only Factory Gate Wholesale Price) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-3xl border border-slate-200/80">
              
              <div className="space-y-1">
                <label className="text-xs font-black text-slate-800 block">قیمت عمده کارخانه (تومان / کارتن):</label>
                <input
                  type="text"
                  required
                  value={prodBulkPrice}
                  onChange={(e) => setProdBulkPrice(e.target.value)}
                  placeholder="مثال: 450000"
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-2xl focus:border-emerald-600 text-xs font-bold text-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black text-slate-800 block">تعداد در هر کارتن:</label>
                <input
                  type="number"
                  required
                  value={prodCartonPack}
                  onChange={(e) => setProdCartonPack(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-2xl focus:border-emerald-600 text-xs font-bold text-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black text-slate-800 block">حداقل سفارش (کارتن):</label>
                <input
                  type="number"
                  required
                  value={prodMinOrder}
                  onChange={(e) => setProdMinOrder(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-2xl focus:border-emerald-600 text-xs font-bold text-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black text-slate-800 block">موجودی انبار کارخانه (کارتن):</label>
                <input
                  type="number"
                  value={prodStock}
                  onChange={(e) => setProdStock(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-2xl focus:border-emerald-600 text-xs font-bold text-slate-900"
                />
              </div>

            </div>

            {/* 4. Packaging, Weight & Description */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50/50 p-4 rounded-3xl border border-slate-100">
              <div className="space-y-1">
                <label className="text-xs font-black text-slate-800 block">نوع بسته‌بندی:</label>
                <select
                  value={prodUnit}
                  onChange={(e) => setProdUnit(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-2xl focus:border-emerald-600 text-xs font-bold text-slate-900 cursor-pointer"
                >
                  {["کارتن", "کیسه", "باکس", "بشکه", "پالت", "قوطی", "شیشه", "پت", "حلب", "سلفون", "گونی", "بسته", "دبه", "شل"].map(u => (
                    <option key={`fact-prod-unit-${u}`} value={u}>{u}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black text-slate-800 block">وزن هر بسته تکی (اختیاری):</label>
                <input
                  type="text"
                  value={prodWeight}
                  onChange={(e) => setProdWeight(e.target.value)}
                  placeholder="مثال: ۶۰ گرم"
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-2xl focus:border-emerald-600 text-xs font-bold text-slate-900"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-slate-800 block">توضیحات کوتاه محصول (اختیاری):</label>
                  <button
                    type="button"
                    onClick={handleGenerateAiDescription}
                    className="text-[11px] font-black text-emerald-600 hover:text-indigo-800 bg-emerald-50 px-2.5 py-1 rounded-xl flex items-center gap-1 cursor-pointer transition-all"
                  >
                    <Sparkles size={12} />
                    <span>تولید متن خودکار</span>
                  </button>
                </div>

                <textarea
                  rows={2}
                  value={prodDescription}
                  onChange={(e) => setProdDescription(e.target.value)}
                  placeholder="توضیحات مختصر در مورد ترکیبات و کیفیت محصول..."
                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-2xl focus:border-emerald-600 text-xs font-bold text-slate-900"
                />
              </div>

              <div className="md:col-span-2 space-y-1">
                <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                  <Tag size={13} className="text-emerald-600" />
                  <span>تگ‌ها و کلیدواژه‌های سئو و جستجو (با کاما یا اینتر جدا کنید):</span>
                </label>
                <input
                  type="text"
                  value={prodTags}
                  onChange={(e) => setProdTags(e.target.value)}
                  placeholder="مثال: چیپس، باتو، تنقلات سیب زمینی، خرید عمده چیپس"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:border-emerald-600 text-xs font-bold text-slate-900"
                />
                <p className="text-[10px] text-slate-400 font-bold">
                  کلیدواژه‌های سئو به خریداران کمک می‌کنند کالای شما را آسان‌تر در موتورهای جستجو و نوار جستجوی سامانه پیدا کنند.
                </p>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  handleResetForm();
                  setActiveTab('products');
                }}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-black transition-all cursor-pointer"
              >
                انصراف
              </button>

              <button
                type="submit"
                disabled={isSubmittingProd}
                className="px-7 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
              >
                {isSubmittingProd ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    <span>در حال ذخیره...</span>
                  </>
                ) : (
                  <>
                    <Check size={15} />
                    <span>{editingProductId ? "ذخیره تغییرات محصول" : "ثبت و انتشار محصول"}</span>
                  </>
                )}
              </button>
            </div>

          </form>

        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. TAB: FACTORY ORDERS & INVOICES (Dispatches with no consumer prices)    */}
      {/* ========================================================================= */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Truck size={18} className="text-emerald-600" />
              <h3 className="text-xs font-black text-slate-900">سفارشات عمده دریافتی کارخانه</h3>
            </div>
            <span className="text-xs text-slate-500 font-bold">
              تعداد سفارشات: {toPersianNum(myOrders.length)}
            </span>
          </div>

          {myOrders.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-xs space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mx-auto text-2xl">
                🚚
              </div>
              <h4 className="text-sm font-black text-slate-900">هنوز سفارش عمده‌ای ثبت نشده است</h4>
              <p className="text-xs text-slate-500">
                به محض اینکه خریداران از کالاهای خط تولید شما سفارش دهند، اقلام و حواله بارگیری انبار در اینجا قرار می‌گیرد.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {myOrders.map((order, oIdx) => {
                // Filter only items belonging to this factory
                const comp = currentFactoryName.toLowerCase().trim();
                const fCode = factoryCode.toLowerCase().trim();
                
                const factoryItems = (order.items || []).filter((item: any) => {
                  const itemFact = (item.factoryName || item.factory_name || item.brand || item.sellerName || "").toLowerCase().trim();
                  const sellerId = (item.sellerId || "").toLowerCase().trim();
                  return (fCode && sellerId === fCode) || (comp && (itemFact.includes(comp) || comp.includes(itemFact)));
                });

                const displayItems = factoryItems.length > 0 ? factoryItems : order.items || [];
                
                const factoryOrderTotal = displayItems.reduce((sum: number, it: any) => {
                  const q = Number(it.quantityCartons || it.quantity || 1);
                  const p = Number(it.pricePerCarton || it.price || 0);
                  return sum + (q * p);
                }, 0);

                const totalCartons = displayItems.reduce((sum: number, it: any) => {
                  return sum + Number(it.quantityCartons || it.quantity || 1);
                }, 0);

                const buyerCode = (order as any).buyerInfo?.customerCode || (order.id ? `CST-${String(order.id || "").slice(-5).toUpperCase()}` : 'CST-2048');
                const buyerCity = (order as any).buyerInfo?.city || order.city || (order as any).buyerInfo?.province || 'مقصد تایید شده';

                // Cloned factory-specific order for invoice view
                const factoryOrderPayload: Order = {
                  ...order,
                  items: displayItems,
                  totalAmount: factoryOrderTotal,
                  buyerName: `کد مشتری: ${buyerCode}`,
                  buyerCompany: "خریدار عضو سامانه دست‌اول (تایید هویت شده)",
                  buyerPhone: "محرمانه (پشتیبانی و بیمه باربری دست‌اول)",
                  buyerAddress: `مقصد تحویل: ${buyerCity} (آدرس دقیق در بارنامه حمل)`,
                  buyerInfo: {
                    name: `کد مشتری: ${buyerCode}`,
                    company: "خریدار عضو سامانه دست‌اول",
                    phone: "محرمانه (ثبت شده در سامانه مرکزی)",
                    address: `مقصد تحویل: ${buyerCity} (آدرس انبار در حواله بارگیری)`,
                    city: buyerCity
                  }
                };

                return (
                  <div 
                    key={`fact-ord-${order.id || oIdx}-${oIdx}`}
                    className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4"
                  >
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-slate-900">
                            کد سفارش: #{String(order.id || "").slice(-6)}
                          </span>
                          <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-emerald-600 text-white">
                            {order.status === 'completed' ? 'تکمیل شده' : 'آماده بارگیری'}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">
                          تاریخ سفارش: {order.createdAt ? (typeof order.createdAt === 'string' ? order.createdAt : new Date(order.createdAt).toLocaleDateString('fa-IR')) : 'امروز'}
                        </span>
                      </div>

                      <div className="text-left">
                        <span className="text-[11px] text-slate-500 font-bold block">مبلغ تسویه اقلام این کارخانه:</span>
                        <span className="text-sm font-black text-emerald-700">
                          {toPersianNum(factoryOrderTotal.toLocaleString('fa-IR'))} تومان
                        </span>
                      </div>
                    </div>

                    {/* Confidential Buyer Badge */}
                    <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                          <ShieldCheck size={18} />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-black text-slate-900">خریدار: خریدار تایید شده سامانه</span>
                            <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-bold">
                              {buyerCode}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-500 font-medium block mt-0.5">
                            شهر مقصد تخلیه بار: <strong className="text-slate-700">{buyerCity}</strong>
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200/60 self-start sm:self-auto">
                        <span>🔒 اطلاعات تماس خریدار محرمانه است</span>
                      </div>
                    </div>

                    {/* Factory Items List */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] font-black text-slate-500 px-1">
                        <span>اقلام سفارش داده شده از خط تولید شما ({toPersianNum(displayItems.length)} ردیف):</span>
                        <span>مجموع: {toPersianNum(totalCartons)} کارتن</span>
                      </div>

                      <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-2">
                        {displayItems.map((item: any, idx: number) => {
                          const itemQty = Number(item.quantityCartons || item.quantity || 1);
                          const itemPrice = Number(item.pricePerCarton || item.price || 0);
                          const itemTotal = itemQty * itemPrice;

                          return (
                            <div key={`fact-mgmt-order-item-${item.id || item.productId || idx}-${idx}`} className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs py-1.5 border-b border-slate-200/50 last:border-0">
                              <div className="flex items-center gap-2">
                                <span className="w-5 h-5 rounded-md bg-emerald-100 text-indigo-800 font-bold text-[10px] flex items-center justify-center">
                                  {toPersianNum(idx + 1)}
                                </span>
                                <span className="font-bold text-slate-900">{item.name || item.title}</span>
                              </div>
                              <div className="flex items-center gap-4 text-slate-600 text-left self-end sm:self-auto">
                                <span className="font-black text-slate-800">
                                  {toPersianNum(itemQty)} کارتن
                                </span>
                                <span className="font-black text-emerald-700">
                                  {toPersianNum(itemTotal.toLocaleString('fa-IR'))} تومان
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Order Actions */}
                    <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100">
                      {onOpenInvoiceModal && (
                        <button
                          onClick={() => onOpenInvoiceModal(factoryOrderPayload)}
                          className="px-5 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer shadow-2xs"
                        >
                          <FileText size={15} />
                          <span>مشاهده و چاپ حواله خروج و بارگیری انبار</span>
                        </button>
                      )}
                    </div>

                  </div>
                );
              })}
            </div>
          )}

        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. TAB: FLOOR MARKET (کف بازار - فروش بار مازاد و ثبت تقاضای کالا)       */}
      {/* ========================================================================= */}
      {activeTab === 'floor_market' && (
        <div className="space-y-6">
          
          {/* Header & Quick Action Card */}
          <div className="bg-linear-to-r from-emerald-500 via-emerald-600 to-orange-600 rounded-3xl p-6 text-white shadow-md space-y-4">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <Flame size={24} className="text-emerald-200 animate-pulse" />
                  <h3 className="text-lg font-black">بخش کف بازار و حراج مازاد خط تولید</h3>
                  <span className="bg-amber-400/25 border border-white/20 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full">
                    مبادلات نقدی و سریع
                  </span>
                </div>
                <p className="text-xs text-emerald-100 font-medium max-w-2xl leading-relaxed">
                  در این قسمت می‌توانید بارهای مازاد شیفت، خریدهای عمده نقدی با تخفیف ویژه یا محموله‌های فوری را در تالار کف بازار سراسری عرضه کنید و یا درخواست خرید مواد اولیه ثبت نمایید.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
                <AddAdButton 
                  variant="desktop" 
                  onAdAdded={() => {
                    // Trigger refresh if needed
                    window.dispatchEvent(new CustomEvent("dastavval_floor_deals_updated"));
                  }}
                />

                <button
                  onClick={() => setShowRequestModal(true)}
                  className="flex-1 md:flex-initial px-5 py-2.5 bg-amber-900/60 hover:bg-amber-900/80 text-white border border-amber-400/40 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Megaphone size={16} />
                  <span>ثبت استعلام / تقاضا</span>
                </button>
              </div>
            </div>

            {/* Quick stats ribbon */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 border-t border-white/15 text-center">
              <div className="bg-black/10 rounded-2xl p-2.5">
                <span className="text-[10px] text-emerald-200 font-bold block">آگهی‌های عرضه کارخانه من:</span>
                <span className="text-base font-black">{toPersianNum(floorDeals.length)} آگهی فعال</span>
              </div>
              <div className="bg-black/10 rounded-2xl p-2.5">
                <span className="text-[10px] text-emerald-200 font-bold block">استعلام‌های ثبت شده من:</span>
                <span className="text-base font-black">{toPersianNum(floorRequests.length)} تقاضا</span>
              </div>
              <div className="bg-black/10 rounded-2xl p-2.5 col-span-2 sm:col-span-1">
                <span className="text-[10px] text-emerald-200 font-bold block">تسویه و پرداخت:</span>
                <span className="text-base font-black">ضمانت امانی دست‌اول</span>
              </div>
            </div>
          </div>

          {floorSuccessMsg && (
            <div className="bg-emerald-600 text-white p-4 rounded-2xl text-xs font-black flex items-center gap-2 border border-emerald-200">
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
              <span>{floorSuccessMsg}</span>
            </div>
          )}

          {/* Sub Tab Navigation */}
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
            <button
              onClick={() => setFloorTab('my_deals')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                floorTab === 'my_deals'
                  ? "bg-emerald-500 text-white shadow-2xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              کالاهای عرضه شده من در کف بازار ({toPersianNum(floorDeals.length)})
            </button>

            <button
              onClick={() => setFloorTab('my_requests')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                floorTab === 'my_requests'
                  ? "bg-emerald-500 text-white shadow-2xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              استعلام‌ها و تقاضاهای تامین من ({toPersianNum(floorRequests.length)})
            </button>
          </div>

          {/* SUBTAB 1: MY ACTIVE DEALS IN FLOOR MARKET */}
          {floorTab === 'my_deals' && (
            <div className="space-y-4">
              {floorDeals.length === 0 ? (
                <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-xs space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mx-auto text-2xl">
                    🏷️
                  </div>
                  <h4 className="text-sm font-black text-slate-900">هنوز محصولی در بخش کف بازار عرضه نکرده‌اید</h4>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    اگر بار مازاد خط تولید، حراج نقدی پایان ماه، یا بسته‌بندی با تخفیف ویژه دارید، با فشردن دکمه زیر آن را در کف بازار آگهی کنید تا بنکداران سراسر کشور مستقیماً خریداری نمایند.
                  </p>
                  <AddAdButton 
                    variant="inline" 
                    className="max-w-xs mx-auto"
                    onAdAdded={() => {
                      window.dispatchEvent(new CustomEvent("dastavval_floor_deals_updated"));
                    }}
                  />
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {floorDeals.filter(d => d.status !== 'rejected').map((deal, dIdx) => (
                    <div
                      key={`fact-deal-${deal.id || dIdx}-${dIdx}`}
                      className="bg-white rounded-3xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between space-y-3"
                    >
                      <div className="space-y-2.5">
                        <div className="relative w-full h-40 bg-slate-50 rounded-2xl overflow-hidden border border-slate-100 flex items-center justify-center">
                          {deal.imageUrl ? (
                            <img src={deal.imageUrl} alt={deal.title} className="w-full h-full object-contain p-2" />
                          ) : (
                            <Boxes className="text-slate-300" size={40} />
                          )}
                          <div className="absolute top-2.5 right-2.5 bg-emerald-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-xs">
                            {deal.badgeText}
                          </div>
                          <div className="absolute bottom-2.5 left-2.5 bg-emerald-600/80 text-white text-[10px] font-black px-2 py-0.5 rounded-lg">
                            موجودی: {deal.quantity}
                          </div>
                        </div>

                        <div>
                          <span className="text-[10px] text-slate-400 font-bold block">{deal.category}</span>
                          <h4 className="text-xs font-black text-slate-900 line-clamp-1">{deal.title}</h4>
                          <p className="text-[11px] text-slate-500 line-clamp-2 mt-1">{deal.description}</p>
                        </div>

                        <div className="bg-emerald-50/70 p-2.5 rounded-2xl border border-emerald-200/60 space-y-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-500 font-bold">قیمت عمده عادی:</span>
                            <span className="text-slate-400 line-through font-mono">
                              {toPersianNum(deal.regularPrice.toLocaleString('fa-IR'))} ت
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-xs font-black text-amber-900">
                            <span>قیمت حراج کف بازار:</span>
                            <span className="text-sm font-black text-amber-700">
                              {toPersianNum(deal.floorPrice.toLocaleString('fa-IR'))} تومان
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                        <select
                          value={deal.status}
                          onChange={(e) => handleToggleDealStatus(deal.id, e.target.value as any)}
                          className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-bold text-slate-800 cursor-pointer"
                        >
                          <option value="active">🟢 در حال عرضه (فعال)</option>
                          <option value="reserved">🟡 رزرو مشتری</option>
                          <option value="sold">⚪ فروخته شد / مختومه</option>
                        </select>

                        <button
                          onClick={() => handleDeleteFloorDeal(deal.id)}
                          className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all cursor-pointer"
                          title="حذف آگهی"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SUBTAB 2: MY PROCUREMENT REQUESTS */}
          {floorTab === 'my_requests' && (
            <div className="space-y-4">
              {floorRequests.length === 0 ? (
                <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-xs space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mx-auto text-2xl">
                    📢
                  </div>
                  <h4 className="text-sm font-black text-slate-900">درخواست تامینی ثبت نکرده‌اید</h4>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    اگر کارخانه شما به خرید مواد اولیه (مانند کارتن، شکر فله، روغن، کنسانتره یا سلفون) با قیمت مناسب نیاز دارد، در اینجا استعلام دهید.
                  </p>
                  <button
                    onClick={() => setShowRequestModal(true)}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-amber-700 text-white rounded-2xl text-xs font-black transition-all inline-flex items-center gap-2 cursor-pointer shadow-xs"
                  >
                    <Plus size={16} />
                    <span>ثبت استعلام خرید و تقاضا</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {floorRequests.map((req, rIdx) => (
                    <div
                      key={`fact-req-${req.id || rIdx}-${rIdx}`}
                      className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-black text-slate-900">{req.title}</span>
                          <span className="bg-emerald-100 text-amber-800 text-[10px] font-black px-2 py-0.5 rounded-md">
                            حجم: {req.quantityNeeded}
                          </span>
                          <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-md">
                            تحویل: {req.deliveryCity}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">{req.description}</p>
                        <span className="text-[10px] text-slate-400 font-mono block">تاریخ ثبت: {req.createdAt}</span>
                      </div>

                      <div className="flex items-center gap-3 self-end sm:self-auto">
                        <div className="text-left">
                          <span className="text-[10px] text-slate-400 block font-bold">بودجه پیشنهادی:</span>
                          <span className="text-xs font-black text-emerald-700">{req.targetPrice}</span>
                        </div>

                        <button
                          onClick={() => handleDeleteFloorRequest(req.id)}
                          className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all cursor-pointer"
                          title="حذف تقاضا"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      )}

      {/* ========================================================================= */}
      {/* BRAND MANAGEMENT TAB (برندهای من - تعریف و مدیریت برند برای کارخانه) */}
      {/* ========================================================================= */}
      {activeTab === 'brands' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full blur-2xl" />
            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1">
                <h3 className="text-lg font-black font-sans flex items-center gap-2">
                  <Award className="text-amber-300" />
                  مدیریت برندها و نشان‌های تجاری
                </h3>
                <p className="text-xs text-emerald-100 font-bold max-w-xl leading-relaxed">
                  برندها و مارک‌های تجاری ثبت شده خود را در این بخش تعریف و مدیریت کنید. برندها پس از ثبت با وضعیت "در انتظار تایید مدیریت" ثبت می‌شوند و پس از تایید توسط ادمین مرکزی، در لیست برندهای رسمی کالا و کل فاکتورهای سامانه به کار می‌روند.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Form to Request/Add Brand */}
            <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-5">
              <h4 className="text-xs font-black text-slate-800 pb-3 border-b border-slate-100 flex items-center gap-1.5">
                <span>➕ درخواست ثبت نشان (برند) جدید</span>
              </h4>

              <form onSubmit={handlePortalAddBrand} className="space-y-4">
                {brandSubmitMsg && (
                  <div className={`p-4 rounded-2xl text-xs font-bold leading-relaxed ${brandSubmitMsg.includes('❌') ? 'bg-rose-50 text-rose-800 border border-rose-100' : 'bg-emerald-50 text-emerald-800 border border-emerald-100'}`}>
                    {brandSubmitMsg}
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-700 block">نام نشان تجاری (فارسی / انگلیسی):</label>
                  <input
                    type="text"
                    value={newBrandName}
                    onChange={(e) => setNewBrandName(e.target.value)}
                    placeholder="مثال: چی‌توز، میهن، سن‌ایچ..."
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 rounded-2xl px-4 py-3 text-xs font-bold transition-all text-slate-800"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-700 block">دسته بندی محصولات برند:</label>
                  <select
                    value={newBrandType}
                    onChange={(e) => setNewBrandType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 rounded-2xl px-4 py-3 text-xs font-bold transition-all text-slate-800 cursor-pointer"
                  >
                    <option value="کنسرو و مواد غذایی">🥫 کنسرو و مواد غذایی</option>
                    <option value="تنقلات و شکلات">🍫 تنقلات و شکلات</option>
                    <option value="کیک، کلوچه و بیسکویت">🍪 کیک، کلوچه و بیسکویت</option>
                    <option value="نوشیدنی‌ها">🥤 نوشیدنی‌ها</option>
                    <option value="شوینده و بهداشتی">🧼 شوینده و بهداشتی</option>
                    <option value="لبنیات">🥛 لبنیات و پنیر</option>
                    <option value="روغن و چربی‌ها">🛢️ روغن‌های خوراکی</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-700 block">استان مبدا و ثبت برند:</label>
                  <input
                    type="text"
                    value={newBrandProvince}
                    onChange={(e) => setNewBrandProvince(e.target.value)}
                    placeholder="مثال: تهران، اصفهان، خراسان رضوی..."
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 rounded-2xl px-4 py-3 text-xs font-bold transition-all text-slate-800"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-700 block">شماره ثبت رسمی علامت تجاری (اختیاری):</label>
                  <input
                    type="text"
                    value={newBrandRegNumber}
                    onChange={(e) => setNewBrandRegNumber(e.target.value)}
                    placeholder="مثال: ۳۸۴۹۲۱"
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 rounded-2xl px-4 py-3 text-xs font-bold transition-all text-slate-800 text-left font-mono"
                    dir="ltr"
                  />
                </div>

                <div className="space-y-1.5">
                  <ParsPackImageUploader
                    label="تصویر نشان تجاری / لوگوی برند:"
                    subLabel="لوگوی مربع با پس‌زمینه سفید یا شفاف پیشنهاد می‌شود."
                    value={newBrandLogoUrl}
                    onChange={(url) => setNewBrandLogoUrl(url)}
                    folder="brands"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-700 block">توضیحات و پیشینه برند:</label>
                  <textarea
                    rows={3}
                    value={newBrandDescription}
                    onChange={(e) => setNewBrandDescription(e.target.value)}
                    placeholder="توضیحاتی کوتاه درباره تاسیس برند، گواهینامه‌ها و سهم بازار محصولات بنویسید..."
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 rounded-2xl px-4 py-3 text-xs font-bold transition-all text-slate-800 leading-relaxed"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isBrandSubmitting}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-xs shadow-md shadow-emerald-600/10 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isBrandSubmitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>در حال ثبت اطلاعات...</span>
                    </>
                  ) : (
                    <>
                      <Award size={16} />
                      <span>ثبت درخواست و ارسال به مدیریت</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* List of Current Brands */}
            <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
              <h4 className="text-xs font-black text-slate-800 pb-3 border-b border-slate-100 flex items-center justify-between">
                <span>📋 برندهای تایید شده و درخواست‌های اخیر</span>
                <span className="text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-full font-black">
                  {toPersianNum(myBrands.length)} برند
                </span>
              </h4>

              {myBrands.length === 0 ? (
                <div className="p-12 text-center space-y-3">
                  <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mx-auto text-xl">
                    🏷️
                  </div>
                  <h5 className="text-xs font-black text-slate-800">هنوز برندی ثبت نکرده‌اید</h5>
                  <p className="text-[11px] text-slate-400 max-w-xs mx-auto leading-relaxed">
                    با استفاده از فرم روبرو اولین برند تولیدی یا بازرگانی خود را جهت تایید و نمایش در سایت ثبت کنید.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {myBrands.map((b: any) => {
                    const isPending = b.status === "pending" || b.badge?.includes("انتظار");
                    return (
                      <div
                        key={b.id}
                        className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 flex flex-col justify-between gap-3 relative hover:shadow-xs transition-all"
                      >
                        <div className="flex items-start gap-3">
                          <img
                            src={b.logoUrl || "https://images.unsplash.com/photo-1541167760496-1628856ab772?q=80&w=200&auto=format&fit=crop"}
                            alt={b.name}
                            className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0 bg-white"
                            referrerPolicy="no-referrer"
                          />
                          <div className="space-y-1">
                            <h5 className="text-xs font-black text-slate-800">{b.name}</h5>
                            <span className="text-[10px] text-slate-400 font-bold block">{b.type || b.category}</span>
                            <span className="text-[9px] text-slate-500 font-mono block">استان: {b.province}</span>
                          </div>
                        </div>

                        {b.description && (
                          <p className="text-[10px] text-slate-500 font-medium leading-relaxed line-clamp-2">
                            {b.description}
                          </p>
                        )}

                        <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
                          <span className="text-[9px] font-bold text-slate-400">
                            {b.regNumber ? `شماره ثبت: ${toPersianNum(b.regNumber)}` : "فاقد شماره ثبت"}
                          </span>
                          
                          {isPending ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1 shrink-0 animate-pulse">
                              <span>⏱️ در انتظار تایید</span>
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1 shrink-0">
                              <span>✓ تایید رسمی</span>
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. TAB: FACTORY PROFILE & RICH INFORMATION (Configured Once / Optional) */}
      {/* ========================================================================= */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-8">
          
          <div className="pb-4 border-b border-slate-100 space-y-0.5">
            <h3 className="text-base font-black text-slate-900">مشخصات هویتی، پروانه‌ها و اطلاعات تکمیلی کارخانه</h3>
            <p className="text-xs text-slate-500 font-medium">
              اطلاعات پروانه بهداشت و مشخصات کارخانه یکبار در اینجا ثبت شده و به تمام کالاهای تولیدی شما متصل می‌گردد. ثبت عکس‌های کارخانه و خط تولید کاملاً اختیاری است.
            </p>
          </div>

          {profileSuccessMsg && (
            <div className="bg-emerald-600 text-white p-3.5 rounded-2xl text-xs font-black flex items-center gap-2 border border-emerald-200">
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
              <span>{profileSuccessMsg}</span>
            </div>
          )}

          <form onSubmit={handleSaveProfile} className="space-y-8">
            
            {/* Section 1: Basic Information & Health Licenses */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <Building2 size={18} className="text-emerald-600" />
                <h4 className="text-xs font-black text-slate-900">۱. مشخصات پایه و پروانه بهداشت کارخانه</h4>
              </div>

              {/* Factory Logo */}
              <div className="bg-slate-50 p-4 rounded-3xl border border-slate-200">
                <ParsPackImageUploader
                  label="لوگو و نشان رسمی کارخانه (انتخاب از گالری):"
                  subLabel="در هدر پنل و ویترین محصولات نمایش داده می‌شود"
                  value={factoryLogoUrl}
                  onChange={setFactoryLogoUrl}
                  folder="brands"
                  aspectRatio="logo"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-800 block">نام کامل کارخانه / شرکت تولیدی:</label>
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="مثال: شرکت صنایع غذایی مزمز"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:border-emerald-600 text-xs font-bold text-slate-900"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-800 block">شماره پروانه بهداشت / سیب سلامت کارخانه:</label>
                  <input
                    type="text"
                    value={factoryHealthLicense}
                    onChange={(e) => setFactoryHealthLicense(e.target.value)}
                    placeholder="مثال: ۲۱/۱۴۸۹۲"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:border-emerald-600 text-xs font-bold text-slate-900 font-mono text-left"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-800 block">نام مسئول هماهنگی / مدیر بارگیری:</label>
                  <input
                    type="text"
                    value={repName}
                    onChange={(e) => setRepName(e.target.value)}
                    placeholder="نام و نام خانوادگی"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:border-emerald-600 text-xs font-bold text-slate-900"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-800 block">تلفن هماهنگی بارگیری انبار:</label>
                  <input
                    type="tel"
                    value={repPhone}
                    onChange={(e) => setRepPhone(e.target.value)}
                    placeholder="0912..."
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:border-emerald-600 text-xs font-bold text-slate-900 text-left font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-800 block">شهر / شهرک صنعتی محل کارخانه:</label>
                  <input
                    type="text"
                    value={factoryCity}
                    onChange={(e) => setFactoryCity(e.target.value)}
                    placeholder="مثال: مشهد، شهرک صنعتی چناران"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:border-emerald-600 text-xs font-bold text-slate-900"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-800 block">شماره شبا جهت تسویه سفارشات:</label>
                  <input
                    type="text"
                    value={factoryIban}
                    onChange={(e) => setFactoryIban(e.target.value)}
                    placeholder="IR..."
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:border-emerald-600 text-xs font-bold text-slate-900 text-left font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black text-slate-800 block">آدرس دقیق انبار کارخانه برای اعزام خودروهای بارگیری:</label>
                <textarea
                  rows={2}
                  value={factoryAddress}
                  onChange={(e) => setFactoryAddress(e.target.value)}
                  placeholder="استان، شهر، شهرک صنعتی، فاز، خیابان، پلاک انبار مرکزی..."
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:border-emerald-600 text-xs font-bold text-slate-900"
                />
              </div>
            </div>

            {/* Section 2: Optional Rich Media (Factory Photos) */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Camera size={18} className="text-emerald-600" />
                  <h4 className="text-xs font-black text-slate-900">۲. تصاویر کارخانه و خط تولید (کاملاً اختیاری)</h4>
                </div>
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                  اعتبارسنجی سازمانی
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-3xl border border-slate-200">
                  <ParsPackImageUploader
                    label="عکس محوطه، تابلو یا نمای کارخانه:"
                    subLabel="نمای کلی واحد تولیدی یا تابلو ورودی"
                    value={factoryExteriorPhoto}
                    onChange={setFactoryExteriorPhoto}
                    folder="factories/exterior"
                    aspectRatio="video"
                  />
                </div>

                <div className="bg-slate-50 p-4 rounded-3xl border border-slate-200">
                  <ParsPackImageUploader
                    label="عکس خط تولید و ماشین‌آلات:"
                    subLabel="دستگاه‌های بسته‌بندی، فرآوری یا خط مکانیزه"
                    value={productionLinePhoto}
                    onChange={setProductionLinePhoto}
                    folder="factories/production"
                    aspectRatio="video"
                  />
                </div>

                <div className="bg-slate-50 p-4 rounded-3xl border border-slate-200">
                  <ParsPackImageUploader
                    label="عکس انبار و سوله نگهداری کالا:"
                    subLabel="محل چیدمان پالت‌ها و بارگیری کامیون‌ها"
                    value={warehousePhoto}
                    onChange={setWarehousePhoto}
                    folder="factories/warehouse"
                    aspectRatio="video"
                  />
                </div>

                <div className="bg-slate-50 p-4 rounded-3xl border border-slate-200">
                  <ParsPackImageUploader
                    label="عکس لوح‌های افتخار، ایزو و گواهینامه‌ها:"
                    subLabel="گواهی استاندارد، ISO، HACCP و تقدیرنامه‌ها"
                    value={certificatesPhoto}
                    onChange={setCertificatesPhoto}
                    folder="factories/certificates"
                    aspectRatio="video"
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Optional Technical Specs */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <Layers size={18} className="text-emerald-600" />
                <h4 className="text-xs font-black text-slate-900">۳. مشخصات فنی، ظرفیت و معرفی کارخانه (اختیاری)</h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-800 block">سال تأسیس واحد تولیدی (اختیاری):</label>
                  <input
                    type="text"
                    value={establishedYear}
                    onChange={(e) => setEstablishedYear(e.target.value)}
                    placeholder="مثال: ۱۳۸۴"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:border-emerald-600 text-xs font-bold text-slate-900 text-left font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-800 block">ظرفیت تولید روزانه (اختیاری):</label>
                  <input
                    type="text"
                    value={dailyCapacity}
                    onChange={(e) => setDailyCapacity(e.target.value)}
                    placeholder="مثال: ۲,۰۰۰ کارتن در روز"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:border-emerald-600 text-xs font-bold text-slate-900"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-800 block">درصد ظرفیت تولید خالی (جهت قراردادهای جدید):</label>
                  <select
                    value={emptyCapacityPercent}
                    onChange={(e) => setEmptyCapacityPercent(Number(e.target.value))}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:border-emerald-600 text-xs font-bold text-slate-900 cursor-pointer"
                  >
                    <option value={0}>۰٪ (ظرفیت خط تولید کاملاً تکمیل است)</option>
                    <option value={10}>۱۰٪ (ظرفیت خالی محدود)</option>
                    <option value={20}>۲۰٪ (ظرفیت خالی محدود)</option>
                    <option value={30}>۳۰٪ (ظرفیت خالی متوسط)</option>
                    <option value={40}>۴۰٪ (ظرفیت خالی متوسط)</option>
                    <option value={50}>۵۰٪ (ظرفیت خالی متوسط)</option>
                    <option value={60}>۶۰٪ (ظرفیت خالی بالا)</option>
                    <option value={70}>۷۰٪ (ظرفیت خالی بالا)</option>
                    <option value={80}>۸۰٪ (ظرفیت خالی بالا)</option>
                    <option value={90}>۹۰٪ (ظرفیت خالی بالا)</option>
                    <option value={100}>۱۰۰٪ (آماده پذیرش کامل خطوط تولید جدید)</option>
                  </select>
                </div>

                <div className="space-y-1 sm:col-span-2 lg:col-span-1">
                  <label className="text-xs font-black text-slate-800 block">تجهیزات و فناوری خط تولید (اختیاری):</label>
                  <input
                    type="text"
                    value={productionTech}
                    onChange={(e) => setProductionTech(e.target.value)}
                    placeholder="مثال: خط تمام اتوماتیک بسته‌بندی تحت گاز ازت"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:border-emerald-600 text-xs font-bold text-slate-900"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black text-slate-800 block">درباره کارخانه و سابقه تولید (اختیاری):</label>
                <textarea
                  rows={3}
                  value={factoryDescription}
                  onChange={(e) => setFactoryDescription(e.target.value)}
                  placeholder="تاریخچه، افتخارات و استانداردهای کیفی این واحد تولیدی..."
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:border-emerald-600 text-xs font-bold text-slate-900"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                disabled={isSavingProfile}
                className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
              >
                {isSavingProfile ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>در حال ذخیره اطلاعات...</span>
                  </>
                ) : (
                  <>
                    <Check size={16} />
                    <span>ذخیره مشخصات و اطلاعات تکمیلی کارخانه</span>
                  </>
                )}
              </button>
            </div>

          </form>

        </div>
      )}

      {/* ========================================================================= */}
      {/* 5.6 TAB: CAPACITY ADS & COOPERATION REQUESTS (ظرفیت خالی تولید و OEM)     */}
      {/* ========================================================================= */}
      {activeTab === 'capacity_ads' && (
        <div className="space-y-6 text-right" dir="rtl">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-slate-900 to-teal-950 rounded-[2rem] p-6 sm:p-8 text-white relative overflow-hidden shadow-xl border border-teal-500/20">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-teal-500/10 rounded-full blur-2xl -ml-10 -mb-10 pointer-events-none" />
            
            <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 bg-emerald-500/20 border border-emerald-500/30 px-3 py-1 rounded-full text-[10px] font-black text-emerald-300">
                  <Megaphone size={12} className="text-emerald-400" />
                  <span>سامانه مدیریت تولید قراردادی و برون‌سپاری صنعتی (OEM)</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  مدیریت ظرفیت‌های خالی و پذیرش سفارش تولید
                </h2>
                <p className="text-xs text-slate-300 font-medium max-w-2xl leading-relaxed">
                  در این بخش می‌توانید شیفت‌های خالی تولید، خطوط فعال مازاد و توانمندی‌های بسته‌بندی کارخانه خود را آگهی کنید تا برندهای تجاری و مالکان محصولات با شما قرارداد تولید امضا کنند.
                </p>
              </div>
              <button
                onClick={() => setShowPortalAddAd(!showPortalAddAd)}
                className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs px-5 py-3 rounded-xl transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
              >
                <Plus size={16} />
                <span>{showPortalAddAd ? "انصراف و بستن فرم" : "ثبت آگهی ظرفیت خالی جدید"}</span>
              </button>
            </div>
          </div>

          {/* Inline Add Ad Form (Collapsible) */}
          {showPortalAddAd && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-md space-y-6"
            >
              <div className="flex items-center gap-2 pb-4 border-b border-slate-100">
                <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
                  <Plus size={18} />
                </div>
                <h3 className="text-sm font-black text-slate-900">مشخصات خط تولید و آگهی ظرفیت مازاد</h3>
              </div>

              <form onSubmit={handlePortalAddCapacityAd} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black text-slate-800 mb-1.5">
                      عنوان آگهی ظرفیت خالی <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={portalNewTitle}
                      onChange={(e) => setPortalNewTitle(e.target.value)}
                      placeholder="مثال: ظرفیت خالی بچ تانک و پرکنی ساشه مواد آرایشی"
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-800 mb-1.5">
                      حوزه فعالیت و صنعت <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={portalNewCat}
                      onChange={(e) => setPortalNewCat(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    >
                      <option value="نوشیدنی و آبمیوه">نوشیدنی و آبمیوه</option>
                      <option value="کیک، کلوچه و بیسکویت">کیک، کلوچه و بیسکویت</option>
                      <option value="شوینده و بهداشتی">شوینده و بهداشتی</option>
                      <option value="مواد غذایی و کنسروجات">مواد غذایی و کنسروجات</option>
                      <option value="لبنیات و فرآورده‌ها">لبنیات و فرآورده‌ها</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-black text-slate-800 mb-1.5">
                      حداقل حجم سفارش قابل پذیرش <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={portalNewMinQty}
                      onChange={(e) => setPortalNewMinQty(e.target.value)}
                      placeholder="مثال: ۵۰,۰۰۰ عدد"
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs font-bold focus:outline-none focus:ring-2"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-800 mb-1.5">
                      موقعیت کارخانه (استان و شهر مستقر) <span className="text-red-500">*</span>
                    </label>
                    <StrictCityProvinceSelector
                      selectedCity={portalNewLocation.includes('،') ? portalNewLocation.split('،')[0]?.trim() : portalNewLocation}
                      selectedProvince={portalNewLocation.includes('،') ? portalNewLocation.split('،')[1]?.trim() : "تهران"}
                      onSelect={(city, province) => {
                        setPortalNewLocation(`${city}، ${province}`);
                      }}
                      variant="button"
                      className="w-full text-right"
                      placeholder="برای تغییر استان و شهر کلیک کنید..."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-800 mb-1.5">
                      تلفن مستقیم هماهنگی خط <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={portalNewPhone}
                      onChange={(e) => setPortalNewPhone(e.target.value)}
                      placeholder="مثال: ۰۹۱۲۳۴۵۶۷۸۹"
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs font-bold focus:outline-none focus:ring-2 text-left"
                      dir="ltr"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-800 mb-1.5">
                    تجهیزات، ماشین‌آلات و مشخصات خط تولید <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={portalNewDetails}
                    onChange={(e) => setPortalNewDetails(e.target.value)}
                    placeholder="امکانات میکسرها، ظرفیت مخازن، نوع پرکن‌ها، جنس ظروف (پت، شیشه، پاکت)، شیوه درب‌بندی و..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs font-medium focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-800 mb-1.5">
                    استانداردها، مجوزهای بهداشتی و شرايط عقد قرارداد تولید <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={portalNewDesc}
                    onChange={(e) => setPortalNewDesc(e.target.value)}
                    placeholder="سیب سلامت، پروانه‌های ساخت موجود کارخانه، نحوه خرید فویل یا کارتن، شرایط تحویل محصول نهایی..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs font-medium focus:outline-none"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowPortalAddAd(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-black text-slate-600 cursor-pointer"
                  >
                    انصراف
                  </button>
                  <button
                    type="submit"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl text-xs font-black transition-all shadow-md cursor-pointer"
                  >
                    ثبت و انتشار فوری آگهی ظرفیت
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {/* Main List Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* List of My Ads */}
            <div className="lg:col-span-5 space-y-4">
              <h3 className="text-xs font-black text-slate-500 px-1 flex items-center gap-1.5">
                <Megaphone size={14} className="text-teal-600" />
                <span>آگهی‌های ثبت‌شده کارخانه شما ({toPersianNum(portalCapacityAds.filter(ad => ad.factoryId === user?.id || ad.factoryName.includes(currentFactoryName)).length)})</span>
              </h3>

              {portalCapacityAds.filter(ad => ad.factoryId === user?.id || ad.factoryName.includes(currentFactoryName)).length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center space-y-4">
                  <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto text-slate-400">
                    <Info size={20} />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-black text-slate-900">هیچ آگهی ظرفیت خالی ثبت نکرده‌اید</h4>
                    <p className="text-[11px] text-slate-400 font-bold leading-relaxed max-w-xs mx-auto">
                      برای جذب پیشنهادهای تولید و برندهای متقاضی، مشخصات خط تولید خود را آگهی کنید.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowPortalAddAd(true)}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-black text-[11px] px-4 py-2 rounded-xl transition-all cursor-pointer"
                  >
                    ثبت اولین آگهی ظرفیت خالی
                  </button>
                </div>
              ) : (
                <div className="space-y-3.5">
                  {portalCapacityAds
                    .filter(ad => ad.factoryId === user?.id || ad.factoryName.includes(currentFactoryName))
                    .map((ad, idx) => {
                      const reqsCount = ad.cooperationRequests?.length || 0;
                      return (
                        <div key={`fac-mgmt-cap-ad-${ad.id || idx}-${idx}`} className="bg-white border border-slate-200 hover:border-slate-300 rounded-2xl p-4 transition-all relative group shadow-2xs">
                          <div className="flex items-start justify-between">
                            <span className="inline-block px-2.5 py-0.5 bg-slate-100 border border-slate-200 text-[9px] font-black rounded-full text-slate-600">
                              {ad.category}
                            </span>
                            <button
                              onClick={() => handleDeleteCapacityAd(ad.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 transition-all cursor-pointer"
                              title="حذف آگهی"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>

                          <h4 className="text-xs font-black text-slate-900 mt-2 leading-snug">
                            {ad.title}
                          </h4>

                          <div className="text-[10px] text-slate-500 space-y-1 mt-2.5 font-bold border-b border-slate-100 pb-3">
                            <div className="flex items-center gap-1">
                              <MapPin size={11} className="text-slate-400" />
                              <span>موقعیت: {ad.location}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Boxes size={11} className="text-slate-400" />
                              <span>حداقل پذیرش: {ad.minOrderQty}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Phone size={11} className="text-slate-400" />
                              <span>شماره تماس: {ad.phone}</span>
                            </div>
                          </div>

                          <div className="pt-3 flex justify-between items-center text-[10px]">
                            <span className="text-slate-400 font-bold">تاریخ: {ad.createdAt}</span>
                            <span className="px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 font-black rounded-lg text-[9px]">
                              {toPersianNum(reqsCount)} پیشنهاد همکاری دریافتی
                            </span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>

            {/* List of Cooperation Requests received */}
            <div className="lg:col-span-7 space-y-4">
              <h3 className="text-xs font-black text-slate-500 px-1 flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-emerald-600 animate-pulse" />
                <span>کل درخواست‌های همکاری دریافتی از برندها ({toPersianNum(portalCapacityAds.filter(ad => ad.factoryId === user?.id || ad.factoryName.includes(currentFactoryName)).reduce((acc, current) => acc + (current.cooperationRequests?.length || 0), 0))})</span>
              </h3>

              {portalCapacityAds.filter(ad => ad.factoryId === user?.id || ad.factoryName.includes(currentFactoryName)).reduce((acc, current) => acc + (current.cooperationRequests?.length || 0), 0) === 0 ? (
                <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center space-y-4">
                  <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-emerald-500">
                    <CheckCircle2 size={24} />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-black text-slate-900">هیچ پیشنهاد همکاری ثبت نشده است</h4>
                    <p className="text-[11px] text-slate-400 font-bold leading-relaxed max-w-sm mx-auto">
                      زمانی که برندها پیشنهاد تولید روی آگهی‌های ظرفیت خالی شما را ارسال کنند، با مشخصات کامل خریدار و شرایط در این ستون نمایش داده می‌شود.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3.5">
                  {portalCapacityAds
                    .filter(ad => ad.factoryId === user?.id || ad.factoryName.includes(currentFactoryName))
                    .flatMap(ad => (ad.cooperationRequests || []).map((req: any, index: number) => ({ ...req, adId: ad.id, adTitle: ad.title, index })))
                    .map((req, i) => (
                      <div key={`fac-mgmt-coop-req-${req.trackingCode || i}-${i}`} className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 hover:border-slate-300 transition-all space-y-4 shadow-2xs">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                          <div className="space-y-1">
                            <span className="text-[10px] text-teal-600 font-black block">روی آگهی: {req.adTitle}</span>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-black text-slate-900">{req.brandName}</span>
                              <span className="text-[9px] bg-slate-100 border border-slate-200 text-slate-500 px-2 py-0.5 rounded-md font-bold">کد پیگیری: {req.trackingCode}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className={`text-[9px] font-black px-2.5 py-0.5 rounded-full ${
                              req.status === 'بررسی شده' 
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                                : req.status === 'رد پیشنهاد' 
                                ? 'bg-red-50 text-red-800 border border-red-200' 
                                : 'bg-amber-50 text-amber-800 border border-amber-200'
                            }`}>
                              {req.status || 'در انتظار بررسی'}
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          <div className="bg-slate-50 px-3 py-2 rounded-xl border border-slate-100 space-y-1">
                            <span className="text-[10px] text-slate-400 font-bold block">رابط بازرگانی و تماس خریدار:</span>
                            <div className="font-black text-slate-800 text-[11px]">{req.contactPerson}</div>
                            <div className="font-bold text-teal-700 text-left text-[11px]" dir="ltr">{req.phone}</div>
                          </div>

                          <div className="bg-slate-50 px-3 py-2 rounded-xl border border-slate-100 space-y-1">
                            <span className="text-[10px] text-slate-400 font-bold block">محصول و حجم تولید درخواستی:</span>
                            <div className="font-black text-slate-800 text-[11px]">محصول: {req.targetProduct || "طبق تفاهم"}</div>
                            <div className="font-bold text-slate-600 text-[11px]">حجم ماهانه: {req.estimatedMonthlyQty || "نامشخص"}</div>
                          </div>
                        </div>

                        {req.notes && (
                          <div className="bg-slate-50/50 p-3 rounded-xl border border-dashed border-slate-200 text-xs text-slate-600 font-medium leading-relaxed">
                            <span className="text-[10px] text-slate-400 font-bold block mb-1">توضیحات و شرایط پیشنهادی برند متقاضی:</span>
                            {req.notes}
                          </div>
                        )}

                        <div className="flex items-center justify-between gap-3 pt-2 text-[10px] border-t border-slate-100">
                          <span className="text-slate-400 font-bold">تاریخ ارسال پیشنهاد: {req.createdAt}</span>
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleUpdateCoopStatus(req.adId, req.index, "بررسی شده")}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 border border-slate-200 hover:border-emerald-200 text-slate-600 font-black rounded-lg cursor-pointer transition-colors"
                            >
                              تغییر به بررسی شده
                            </button>
                            <button
                              onClick={() => handleUpdateCoopStatus(req.adId, req.index, "رد پیشنهاد")}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-red-50 hover:text-red-800 border border-slate-200 hover:border-red-200 text-slate-600 font-black rounded-lg cursor-pointer transition-colors"
                            >
                              رد پیشنهاد
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. TAB: FACTORY SALES & LOGISTICS SETTINGS (تنظیمات فروش و توزیع)          */}
      {/* ========================================================================= */}
      {activeTab === 'sales_settings' && (
        <FactorySalesSettingsTab 
          user={user} 
          onUpdateUser={onUpdateUser} 
        />
      )}

      {/* ========================================================================= */}
      {/* 7. TAB: FACTORY SUPPORT TICKETS (تیکت‌ها و مکاتبات بازرگانی)               */}
      {/* ========================================================================= */}
      {activeTab === 'tickets' && (
        <FactoryTicketsTab 
          user={user} 
        />
      )}

      {/* ========================================================================= */}
      {/* 8. TAB: FACTORY LOGS & HISTORY (تاریخچه قیمت‌ها، تسویه‌ها و بارگیری)      */}
      {/* ========================================================================= */}
      {activeTab === 'history' && (
        <FactoryHistoryTab 
          user={user} 
          products={myProducts} 
          orders={myOrders} 
        />
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: SELL SURPLUS LOT IN FLOOR MARKET                                */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {showSellLotModal && (
          <div className="fixed inset-0 z-50 bg-slate-400/50 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 max-w-lg w-full border border-slate-200 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Flame size={20} className="text-emerald-600" />
                  <h4 className="text-sm font-black text-slate-900">عرضه کالا و بار مازاد در کف بازار</h4>
                </div>
                <button
                  onClick={() => setShowSellLotModal(false)}
                  className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-xl cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveFloorDeal} className="space-y-4">
                
                {/* Select from existing products */}
                {myProducts.length > 0 && (
                  <div className="space-y-1 bg-emerald-50/60 p-3 rounded-2xl border border-emerald-200/50">
                    <label className="text-xs font-black text-amber-900 block">
                      انتخاب از کالاهای ثبت شده شما (پر کردن خودکار):
                    </label>
                    <select
                      value={selectedLotProdId}
                      onChange={(e) => handleSelectProductForLot(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-emerald-200 rounded-xl text-xs font-bold text-slate-800 cursor-pointer"
                    >
                      <option value="">-- انتخاب محصول یا نوشتن دستی --</option>
                      {myProducts.map((p, pIdx) => (
                        <option key={`fact-mgmt-prod-${p.id || pIdx}-${pIdx}`} value={p.id}>
                          {p.name} ({toPersianNum(p.bulk_price || p.price)} ت)
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-800 block">عنوان آگهی کف بازار:</label>
                  <input
                    type="text"
                    required
                    value={lotTitle}
                    onChange={(e) => setLotTitle(e.target.value)}
                    placeholder="مثال: بار مازاد چیپس سرکه‌ای ۶۰ گرمی (تولید شیفت شب)"
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:border-emerald-600 text-xs font-bold text-slate-900"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-black text-slate-800 block">دسته‌بندی:</label>
                    <select
                      value={lotCategory}
                      onChange={(e) => setLotCategory(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 cursor-pointer"
                    >
                      {availableCategories.map((c, cIdx) => (
                        <option key={`fact-mgmt-lot-opt-${c}-${cIdx}`} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-black text-slate-800 block">نوع عرضه:</label>
                    <select
                      value={lotDealType}
                      onChange={(e) => setLotDealType(e.target.value as any)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 cursor-pointer"
                    >
                      <option value="surplus">📉 مازاد خط تولید</option>
                      <option value="urgent_cash">⚡ فروش فوری و نقدینگی</option>
                      <option value="direct_supply">🏭 تامین مستقیم کارخانه</option>
                      <option value="raw_material">📦 مواد اولیه و فله</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-black text-slate-800 block">قیمت عمده عادی (تومان):</label>
                    <input
                      type="text"
                      value={lotRegularPrice}
                      onChange={(e) => setLotRegularPrice(e.target.value)}
                      placeholder="مثال: 450000"
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:border-emerald-600 text-xs font-bold text-slate-900"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-black text-amber-900 block">قیمت حراج کف بازار (تومان):</label>
                    <input
                      type="text"
                      required
                      value={lotFloorPrice}
                      onChange={(e) => setLotFloorPrice(e.target.value)}
                      placeholder="مثال: 380000"
                      className="w-full px-4 py-2 bg-emerald-50 border border-amber-300 rounded-2xl focus:bg-white focus:border-emerald-600 text-xs font-black text-amber-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-black text-slate-800 block">حجم بار موجود (کارتن / تن):</label>
                    <input
                      type="text"
                      required
                      value={lotQuantity}
                      onChange={(e) => setLotQuantity(e.target.value)}
                      placeholder="مثال: ۳۰۰ کارتن یا ۵ تن"
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:border-emerald-600 text-xs font-bold text-slate-900"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-black text-slate-800 block">تاریخ تولید و انقضا:</label>
                    <input
                      type="text"
                      value={lotBatchDate}
                      onChange={(e) => setLotBatchDate(e.target.value)}
                      placeholder="مثال: تولید روز - انقضا ۱ سال"
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:border-emerald-600 text-xs font-bold text-slate-900"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-800 block">توضیحات و شرایط تحویل بار مازاد:</label>
                  <textarea
                    rows={2}
                    value={lotDescription}
                    onChange={(e) => setLotDescription(e.target.value)}
                    placeholder="علت تخفیف، شرایط بارگیری فوری از انبار کارخانه..."
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:border-emerald-600 text-xs font-bold text-slate-900"
                  />
                </div>

                {/* Photo */}
                <ParsPackImageUploader
                  label="عکس بار مازاد (اختیاری):"
                  value={lotImageUrl}
                  onChange={setLotImageUrl}
                  folder="floor_market"
                  aspectRatio="square"
                />

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowSellLotModal(false)}
                    className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-black cursor-pointer"
                  >
                    انصراف
                  </button>

                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Check size={16} />
                    <span>انتشار در کف بازار</span>
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL 2: PROCUREMENT / INQUIRY REQUEST IN FLOOR MARKET                   */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {showRequestModal && (
          <div className="fixed inset-0 z-50 bg-slate-400/50 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 max-w-lg w-full border border-slate-200 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Megaphone size={20} className="text-emerald-600" />
                  <h4 className="text-sm font-black text-slate-900">ثبت استعلام و تقاضای کالا در کف بازار</h4>
                </div>
                <button
                  onClick={() => setShowRequestModal(false)}
                  className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-xl cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveFloorRequest} className="space-y-4">
                
                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-800 block">عنوان کالا یا مواد اولیه درخواستی:</label>
                  <input
                    type="text"
                    required
                    value={reqTitle}
                    onChange={(e) => setReqTitle(e.target.value)}
                    placeholder="مثال: خرید کارتن ۵ لایه دایکاتی / خرید شکر فله سفید"
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:border-emerald-600 text-xs font-bold text-slate-900"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-black text-slate-800 block">حجم مورد نیاز:</label>
                    <input
                      type="text"
                      required
                      value={reqQuantity}
                      onChange={(e) => setReqQuantity(e.target.value)}
                      placeholder="مثال: ۱۰ تن یا ۵,۰۰۰ کارتن"
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:border-emerald-600 text-xs font-bold text-slate-900"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-black text-slate-800 block">بودجه یا قیمت پیشنهادی:</label>
                    <input
                      type="text"
                      value={reqTargetPrice}
                      onChange={(e) => setReqTargetPrice(e.target.value)}
                      placeholder="مثال: نقدی / هر کیلو ۳۵ هزار تومان"
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:border-emerald-600 text-xs font-bold text-slate-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-black text-slate-800 block">محل تحویل بار:</label>
                    <input
                      type="text"
                      value={reqDeliveryCity}
                      onChange={(e) => setReqDeliveryCity(e.target.value)}
                      placeholder="مثال: انبار کارخانه در مشهد"
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:border-emerald-600 text-xs font-bold text-slate-900"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-black text-slate-800 block">مهلت تامین (روز):</label>
                    <input
                      type="text"
                      value={reqDeadlineDays}
                      onChange={(e) => setReqDeadlineDays(e.target.value)}
                      placeholder="مثال: ۷ روز"
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:border-emerald-600 text-xs font-bold text-slate-900"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-800 block">توضیحات و مشخصات فنی:</label>
                  <textarea
                    rows={2}
                    value={reqDescription}
                    onChange={(e) => setReqDescription(e.target.value)}
                    placeholder="مشخصات کیفی، استاندارد مورد نیاز، شرایط تسویه حساب..."
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:border-emerald-600 text-xs font-bold text-slate-900"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowRequestModal(false)}
                    className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-black cursor-pointer"
                  >
                    انصراف
                  </button>

                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Check size={16} />
                    <span>ثبت تقاضا در کف بازار</span>
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL 3: FACTORY SURPLUS PRODUCTION PROPOSAL (مازاد خط تولید جهت تایید مدیر) */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {surplusProductModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full border-2 border-rose-500 shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
                    <TrendingDown size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900">اعلام و ثبت مازاد خط تولید کارخانه</h4>
                    <p className="text-[11px] text-slate-400 font-bold">جهت بررسی و تأیید انتشار توسط مدیر سایت در کف بازار و آفرها</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSurplusProductModal(null)}
                  className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-xl cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Product Quick Info Card */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center gap-3">
                {surplusProductModal.image_url ? (
                  <img
                    src={surplusProductModal.image_url}
                    alt={surplusProductModal.name}
                    className="w-14 h-14 object-contain rounded-xl bg-white p-1 border border-slate-200 shrink-0"
                  />
                ) : (
                  <div className="w-14 h-14 bg-slate-200 rounded-xl flex items-center justify-center shrink-0">
                    <Package size={24} className="text-slate-400" />
                  </div>
                )}
                <div className="min-w-0 flex-1 space-y-1">
                  <h5 className="text-xs font-black text-slate-900 truncate">{surplusProductModal.name}</h5>
                  <div className="flex items-center gap-3 text-[11px] text-slate-500 font-bold">
                    <span>برند: {surplusProductModal.brand || currentFactoryName}</span>
                    <span>قیمت پایه خط: {toPersianNum((surplusProductModal.bulk_price || surplusProductModal.price || 0).toLocaleString())} ت</span>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmitSurplus} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-black text-slate-800 block">
                      تعداد کارتن مازاد خط تولید: *
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={surplusQuantityCartons}
                      onChange={(e) => setSurplusQuantityCartons(Number(e.target.value))}
                      placeholder="مثلاً ۱۰۰"
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-slate-900 text-center"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-black text-slate-800 block">
                      درصد تخفیف مازاد نسبت به قیمت خط: *
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        max="80"
                        value={surplusDiscountPercent}
                        onChange={(e) => {
                          const pct = Number(e.target.value);
                          setSurplusDiscountPercent(pct);
                          const base = surplusProductModal.bulk_price || surplusProductModal.price || 10000;
                          setSurplusPrice(Math.round(base * (1 - pct / 100)));
                        }}
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-rose-600 text-center"
                      />
                      <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">٪</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-black text-emerald-900 flex items-center justify-between">
                    <span>قیمت پیشنهادی هر عدد برای بار مازاد (تومان):</span>
                    <span className="text-[11px] text-emerald-600 font-bold">
                      {surplusDiscountPercent}% تخفیف اعمال شد
                    </span>
                  </label>
                  <input
                    type="number"
                    value={surplusPrice || Math.round((surplusProductModal.bulk_price || surplusProductModal.price || 0) * (1 - surplusDiscountPercent / 100))}
                    onChange={(e) => setSurplusPrice(Number(e.target.value))}
                    className="w-full px-3.5 py-2 bg-emerald-50 border border-emerald-300 rounded-xl text-xs font-black font-mono text-emerald-800"
                  />
                  <span className="text-[10px] text-slate-400 block">
                    مجموع قیمت هر کارتن: {toPersianNum(((surplusPrice || Math.round((surplusProductModal.bulk_price || surplusProductModal.price || 0) * (1 - surplusDiscountPercent / 100))) * (surplusProductModal.carton_pack_count || 24)).toLocaleString())} تومان
                  </span>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-800 block">علت اعلام مازاد خط:</label>
                  <select
                    value={surplusReason}
                    onChange={(e) => setSurplusReason(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                  >
                    <option value="تولید مازاد شیفت و تخلیه فوری انبار">تولید مازاد شیفت و تخلیه فوری انبار</option>
                    <option value="تغییر خط بسته‌بندی یا تاریخ انقضای ۵ ماهه">تغییر خط بسته‌بندی یا تاریخ انقضای ۵ ماهه</option>
                    <option value="تسویه نقدی فوری کارخانه">تسویه نقدی فوری کارخانه</option>
                    <option value="لغو سفارش عمده‌فروش پیشین و بارگیری آماده">لغو سفارش عمده‌فروش پیشین و بارگیری آماده</option>
                    <option value="تخفیف ویژه جشنواره فصلی کارخانه">تخفیف ویژه جشنواره فصلی کارخانه</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-800 block">توضیحات تکمیلی و شرایط بارگیری:</label>
                  <textarea
                    rows={2}
                    value={surplusDescription}
                    onChange={(e) => setSurplusDescription(e.target.value)}
                    placeholder="مثال: بار حاضر در پالت، امکان تحویل ۱ ساعته از درب کارخانه، بارگیری رایگان..."
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                  />
                </div>

                <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200/80 text-[11px] text-amber-950 flex items-start gap-2">
                  <Info size={16} className="text-amber-600 shrink-0 mt-0.5" />
                  <p className="leading-relaxed font-bold">
                    پس از ارسال، درخواست مازاد در کارتابل مدیریت دست اول بررسی شده و پس از تأیید در تالار «کف بازار» و بخش «آفرها و تخفیف‌های ویژه» با نشان کارخانه منتشر خواهد شد.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setSurplusProductModal(null)}
                    className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-black cursor-pointer"
                  >
                    انصراف
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmittingSurplus}
                    className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-rose-600/20"
                  >
                    {isSubmittingSurplus ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                    <span>ارسال درخواست مازاد به مدیر سایت</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirmId && (
          <div className="fixed inset-0 z-50 bg-slate-400/50 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 max-w-sm w-full border border-slate-200 shadow-xl space-y-4 text-center"
            >
              <div className="w-12 h-12 bg-emerald-600 text-white rounded-2xl flex items-center justify-center mx-auto text-xl">
                ⚠️
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-black text-slate-900">آیا از حذف این کالا اطمینان دارید؟</h4>
                <p className="text-xs text-slate-500 font-medium">این کالا از خط تولید و ویترین سراسری حذف خواهد شد.</p>
              </div>
              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-black cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  onClick={() => handleDeleteProduct(deleteConfirmId)}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black cursor-pointer"
                >
                  بله، حذف شود
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      {/* 🚀 Unified Fixed Add Ad Button (FAB) for Seller Portal */}
      <AddAdButton 
        variant="mobile-fab" 
        onAdAdded={() => {
          window.dispatchEvent(new CustomEvent("dastavval_floor_deals_updated"));
        }}
      />

      {/* Catalog Product Link & Batch Price Modal for Factory */}
      {showCatalogLinkModal && (
        <FactoryProductLinkModal
          factory={currentFactoryProfile as any}
          allProducts={products}
          onClose={() => setShowCatalogLinkModal(false)}
          onUpdateProduct={onUpdateProduct}
          onRefreshProducts={onRefreshProducts}
        />
      )}

    </div>
  );
}
