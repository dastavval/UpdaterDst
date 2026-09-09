import React, { useState, useMemo, useEffect } from "react";
import { 
  Plus, 
  Trash2, 
  Edit2, 
  Award, 
  Save, 
  Check, 
  X, 
  Sparkles, 
  Search, 
  Building2, 
  Package, 
  Globe, 
  MapPin, 
  Phone, 
  Percent, 
  Tag, 
  Star,
  ToggleLeft, 
  ToggleRight, 
  CheckCircle2, 
  ShieldAlert,
  Sliders,
  Calendar,
  Layers,
  ShoppingBag,
  Link2
} from "lucide-react";
import { B2BConfig, Product, FactoryProfile, BrandItem } from "../types";
import { toPersianDigits } from "../lib/pricing";
import ParsPackImageUploader from "./ParsPackImageUploader";
import { DEFAULT_BRANDS } from "./AdminBrandsManagement";
import FactoryProductLinkModal from "./FactoryProductLinkModal";
import { StrictCityProvinceSelector } from "./StrictCityProvinceSelector";

export interface ExtendedFactoryProfile extends FactoryProfile {
  productsSalesEnabled?: boolean;
  priceAdjustmentPercent?: number;
  commissionPercent?: number;
  ownedBrands?: string[];
  isActive?: boolean;
  personnelCount?: number;
  dailyCapacity?: string;
  factoryArea?: string;
  activeProductionLines?: number;
  isoCertificates?: string[];
  selectedBadges?: string[];
}

interface AdminFactoriesManagementProps {
  b2bConfig: B2BConfig;
  products?: Product[];
  onUpdateB2bConfig: (updated: Partial<B2BConfig>) => Promise<void>;
  onUpdateProduct?: (id: string, updatedFields: Partial<Product>) => Promise<any> | void;
  onRefreshProducts?: () => Promise<void> | void;
}

export const DEFAULT_PROVINCES = [
  "تهران", "آذربایجان شرقی", "آذربایجان غربی", "اصفهان", "خراسان رضوی", 
  "فارس", "خوزستان", "مازندران", "گیلان", "البرز", "قزوین", "همدان", "یزد", "مرکزی", "قم", "سمنان"
];

export const getStoredProvinces = (b2bConfig?: B2BConfig): string[] => {
  let list = [...DEFAULT_PROVINCES];
  try {
    const saved = localStorage.getItem("dastavval_provinces_v2");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) list = Array.from(new Set([...list, ...parsed]));
    }
  } catch (e) {}
  if (b2bConfig?.customProvinces && Array.isArray(b2bConfig.customProvinces)) {
    list = Array.from(new Set([...list, ...b2bConfig.customProvinces]));
  }
  if (b2bConfig?.factories && Array.isArray(b2bConfig.factories)) {
    b2bConfig.factories.forEach(f => {
      if (f.province && !list.includes(f.province)) list.push(f.province);
      if (f.location && !list.includes(f.location)) list.push(f.location);
    });
  }
  return list;
};

export const getStoredIndustrialParks = (b2bConfig?: B2BConfig): string[] => {
  let list = [...DEFAULT_INDUSTRIAL_PARKS];
  try {
    const saved = localStorage.getItem("dastavval_industrial_parks_v2");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) list = Array.from(new Set([...list, ...parsed]));
    }
  } catch (e) {}
  if (b2bConfig?.customIndustrialParks && Array.isArray(b2bConfig.customIndustrialParks)) {
    list = Array.from(new Set([...list, ...b2bConfig.customIndustrialParks]));
  }
  if (b2bConfig?.factories && Array.isArray(b2bConfig.factories)) {
    b2bConfig.factories.forEach(f => {
      if (f.industrialPark && !list.includes(f.industrialPark)) list.push(f.industrialPark);
    });
  }
  return list;
};

export const DEFAULT_INDUSTRIAL_PARKS = [
  "شهرک صنعتی شمس‌آباد",
  "شهرک صنعتی عباس‌آباد",
  "شهرک صنعتی چرمشهر و سالاریه",
  "شهرک صنعتی پرند",
  "شهرک صنعتی نصیرآباد",
  "شهرک صنعتی خوارزمی",
  "شهرک صنعتی سیمین‌دشت",
  "شهرک صنعتی اشتهارد",
  "شهرک صنعتی بهارستان",
  "شهرک صنعتی کاسپین قزوین",
  "شهرک صنعتی لیا قزوین",
  "شهرک صنعتی شکوهیه قم",
  "شهرک صنعتی محمودآباد قم",
  "شهرک صنعتی مورچه‌خورت اصفهان",
  "شهرک صنعتی رازی اصفهان",
  "شهرک صنعتی جی اصفهان",
  "شهرک صنعتی محمودآباد اصفهان",
  "شهرک صنعتی توس مشهد",
  "شهرک صنعتی چناران",
  "شهرک صنعتی کلات مشهد",
  "شهرک صنعتی بزرگ شیراز",
  "شهرک صنعتی شهید سلیمی تبریز",
  "شهرک صنعتی عالی نسب تبریز",
  "شهرک صنعتی کاوه ساوه",
  "شهرک صنعتی ایوانکی",
  "شهرک صنعتی بزرگ زنجان",
  "شهرک صنعتی یزد",
  "شهرک صنعتی سمنان",
  "شهرک صنعتی بیرجند",
  "شهرک صنعتی بجنورد",
  "شهرک صنعتی سنندج",
  "شهرک صنعتی زاهدان",
  "شهرک صنعتی کرمان",
  "شهرک صنعتی گرگان",
  "شهرک صنعتی رشت (سپیدرود)",
  "شهرک صنعتی ساری",
  "شهرک صنعتی اهواز (شماره ۴)",
  "شهرک صنعتی سلمان فارسی اهواز",
  "شهرک صنعتی اراک (خیرآباد)",
  "شهرک صنعتی شماره یک همدان",
  "شهرک صنعتی خرم‌آباد (شماره ۲)",
  "شهرک صنعتی اردبیل (شماره ۲)",
  "شهرک صنعتی بوشهر (شماره ۲)",
  "شهرک صنعتی شهرکرد",
  "شهرک صنعتی یاسوج",
  "شهرک صنعتی ایلام",
  "منطقه ویژه اقتصادی ارگ جدید بم",
  "منطقه آزاد تجاری ارس",
  "منطقه آزاد تجاری انزلی",
  "منطقه آزاد تجاری چابهار"
];

export const DEFAULT_CATEGORIES = [
  "صنایع غذایی و مصرفی", "نوشیدنی و آبمیوه", "کیک، کلوچه و بیسکویت", 
  "شوینده و بهداشتی", "لبنیات و فرآورده‌ها", "روغن و برنج", "کنسروجات و مواد غذایی", "تنقلات و شکلات"
];

export const LUXURY_PRESET_BADGES = [
  {
    id: "first-hand-origin",
    label: "نشان رسمی تولیدکننده دست اول و مبدأ مستقیم کارخانه 👑🏭",
    title: "تولیدکننده دست اول",
    badgeText: "👑 دست اول و مبدأ مستقیم",
    description: "تامین‌کننده اصلی و بدون واسطه با تضمین قیمت پایه کارخانه و تحویل مستقیم از خط تولید",
    color: "from-emerald-700 via-emerald-600 to-teal-600",
    textColor: "text-emerald-800",
    bgClass: "bg-emerald-50/80 border-emerald-300 shadow-emerald-500/10"
  },
  {
    id: "amin-al-zarb",
    label: "نشان عالی و لوح زرین امین‌الضرب اتاق بازرگانی 🏛️✨",
    title: "امین‌الضرب اتاق بازرگانی",
    badgeText: "🏛️ امین‌الضرب",
    description: "بالاترین نشان عالی کارآفرینی و اصالت صنعتی کشور با تاییدیه اتاق بازرگانی ایران",
    color: "from-amber-600 via-amber-500 to-yellow-500",
    textColor: "text-amber-800",
    bgClass: "bg-amber-50/70 border-amber-300 shadow-amber-500/10"
  },
  {
    id: "sib-salalamat",
    label: "تندیس سیب سلامت پلاتینیوم سازمان غذا و دارو 🍎💎",
    title: "سیب سلامت پلاتینیوم",
    badgeText: "🍎 سیب سلامت ممتاز",
    description: "بالاترین نشان انطباق ممتاز بهداشتی، سلامت مصرف‌کننده و استاندارد مواد اولیه",
    color: "from-emerald-600 via-emerald-500 to-teal-500",
    textColor: "text-emerald-800",
    bgClass: "bg-emerald-50/70 border-emerald-300 shadow-emerald-500/10"
  },
  {
    id: "brand-melli",
    label: "تندیس زرین برند ملی و محبوبیت عمومی مصرف‌کنندگان 🏆👑",
    title: "برند ملی ممتاز ایران",
    badgeText: "🏆 برند ملی ممتاز",
    description: "تندیس زرین حامی برگزیده حقوق مصرف‌کنندگان کشور و اصالت برند در بازار بین‌المللی",
    color: "from-yellow-600 via-amber-500 to-yellow-500",
    textColor: "text-amber-900",
    bgClass: "bg-amber-50/90 border-yellow-400 shadow-amber-500/15"
  },
  {
    id: "national-standard",
    label: "نشان ملی استاندارد ممتاز و واحد نمونه صنعتی کشور 🏅✨",
    title: "استاندارد ملی ممتاز",
    badgeText: "🏅 استاندارد ممتاز کشوری",
    description: "تاییدیه رسمی کیفیت آزمایشگاهی برتر و رعایت کامل پروتکل‌های استاندارد ملی ایران",
    color: "from-blue-600 via-indigo-500 to-indigo-600",
    textColor: "text-blue-800",
    bgClass: "bg-blue-50/70 border-blue-300 shadow-blue-500/10"
  },
  {
    id: "industry-4",
    label: "پروانه فناوری برتر خطوط رباتیک هوشمند نسل ۴ صنعتی ⚙️🔱",
    title: "اتوماسیون هوشمند نسل ۴",
    badgeText: "⚙️ نسل ۴ رباتیک",
    description: "کارخانه هوشمند مجهز به خطوط رباتیک، تحقیق و توسعه مداوم (R&D) و فرآیندهای تمام خودکار",
    color: "from-slate-700 via-slate-600 to-slate-800",
    textColor: "text-slate-800",
    bgClass: "bg-slate-50/70 border-slate-300 shadow-slate-500/10"
  },
  {
    id: "green-factory",
    label: "گواهینامه بین‌المللی مرجع سبز و ارگانیک اتحادیه اروپا 🌿💎",
    title: "صنایع سبز و ارگانیک مرجع",
    badgeText: "🌿 صنایع سبز مرجع",
    description: "تعهد کامل زیست‌محیطی، بدون آلایندگی صنعتی، کشت ارگانیک و استفاده از انرژی‌های پاک",
    color: "from-lime-600 via-emerald-500 to-emerald-600",
    textColor: "text-lime-800",
    bgClass: "bg-lime-50/70 border-lime-300 shadow-lime-500/10"
  }
];

export default function AdminFactoriesManagement({
  b2bConfig,
  products = [],
  onUpdateB2bConfig,
  onUpdateProduct,
  onRefreshProducts
}: AdminFactoriesManagementProps) {
  // Linking modal state
  const [linkingFactory, setLinkingFactory] = useState<ExtendedFactoryProfile | null>(null);

  // Helper to count linked products for any factory
  const getFactoryLinkedCount = (f: ExtendedFactoryProfile) => {
    if (!products || products.length === 0) return 0;
    const fId = (f.id || "").toLowerCase().trim();
    const fCode = (f.factoryCode || "").toLowerCase().trim();
    const fName = (f.name || "").toLowerCase().trim();
    const fBrands = (f.ownedBrands || []).map(b => b.toLowerCase().trim());
    return products.filter(p => {
      const pSeller = (p.sellerId || "").toLowerCase().trim();
      const pFactId = ((p as any).factoryId || "").toLowerCase().trim();
      const pFactName = (p.factoryName || (p as any).factory_name || "").toLowerCase().trim();
      const pBrand = (p.brand || "").toLowerCase().trim();
      if (fId && (pSeller === fId || pFactId === fId)) return true;
      if (fCode && (pSeller === fCode || pFactId === fCode)) return true;
      if (fName && (pFactName === fName || (pFactName.length >= 3 && fName.includes(pFactName)) || (fName.length >= 3 && pFactName.includes(fName)))) return true;
      if (fBrands.length > 0 && fBrands.some(b => b && (pBrand === b || (pBrand.length >= 3 && pBrand.includes(b)) || (b.length >= 3 && b.includes(pBrand))))) return true;
      return false;
    }).length;
  };

  // Load factories from config or default empty array
  const [factories, setFactories] = useState<ExtendedFactoryProfile[]>(() => {
    if (b2bConfig?.factories && Array.isArray(b2bConfig.factories)) {
      return b2bConfig.factories as ExtendedFactoryProfile[];
    }
    return [];
  });

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Form states
  const [name, setName] = useState("");
  const [factoryCode, setFactoryCode] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [description, setDescription] = useState("");
  const [province, setProvince] = useState("");
  const [city, setCity] = useState("");
  const [industrialPark, setIndustrialPark] = useState("");
  const [isFirstHand, setIsFirstHand] = useState<boolean>(true);
  const [establishedYear, setEstablishedYear] = useState("");
  const [category, setCategory] = useState("");
  const [contact, setContact] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [emptyCapacityPercent, setEmptyCapacityPercent] = useState<number | "">("");
  
  // Customizable Engineering & Industrial Capacity specifications
  const [personnelCount, setPersonnelCount] = useState<number | "">("");
  const [dailyCapacity, setDailyCapacity] = useState("");
  const [factoryArea, setFactoryArea] = useState("");
  const [activeProductionLines, setActiveProductionLines] = useState<number | "">("");
  const [isoCertificates, setIsoCertificates] = useState<string[]>([]);
  const [newIsoCert, setNewIsoCert] = useState("");
  
  // Custom business rules
  const [productsSalesEnabled, setProductsSalesEnabled] = useState<boolean>(true);
  const [priceAdjustmentPercent, setPriceAdjustmentPercent] = useState<number | "">("");
  const [commissionPercent, setCommissionPercent] = useState<number | "">("");
  const [ownedBrands, setOwnedBrands] = useState<string[]>([]);
  const [badge, setBadge] = useState("");
  const [selectedBadges, setSelectedBadges] = useState<string[]>([]);
  const [isActive, setIsActive] = useState<boolean>(true);
  const [isFeatured, setIsFeatured] = useState<boolean>(false);
  const [isNationalBrand, setIsNationalBrand] = useState<boolean>(false);
  
  // Multiple Gallery Images State
  const [galleryImages, setGalleryImages] = useState<{ url: string; title: string; category?: 'production' | 'machinery' | 'warehouse' | 'lab' | 'exterior' }[]>([]);
  const [newGalleryUrl, setNewGalleryUrl] = useState("");
  const [newGalleryTitle, setNewGalleryTitle] = useState("");
  const [newGalleryCategory, setNewGalleryCategory] = useState<'production' | 'machinery' | 'warehouse' | 'lab' | 'exterior'>("production");

  const [editingId, setEditingId] = useState<string | null>(null);

  // Status messages
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Dynamic Provinces & Industrial Parks lists (stored in config and localStorage)
  const [provincesList, setProvincesList] = useState<string[]>(() => getStoredProvinces(b2bConfig));
  const [industrialParksList, setIndustrialParksList] = useState<string[]>(() => getStoredIndustrialParks(b2bConfig));
  const [showAddProvinceInline, setShowAddProvinceInline] = useState(false);
  const [newProvinceInput, setNewProvinceInput] = useState("");
  const [showAddParkInline, setShowAddParkInline] = useState(false);
  const [newParkInput, setNewParkInput] = useState("");

  // Search state for owned brands selection
  const [brandSearchQuery, setBrandSearchQuery] = useState("");
  const [showAddBrandInline, setShowAddBrandInline] = useState(false);
  const [newBrandNameInput, setNewBrandNameInput] = useState("");
  const [newBrandTypeInput, setNewBrandTypeInput] = useState("صنایع غذایی و مصرفی");
  const [newBrandLogoInput, setNewBrandLogoInput] = useState("");

  // Complete pool of brands from config, localStorage, and defaults
  const [allBrandsPool, setAllBrandsPool] = useState<BrandItem[]>(() => {
    let pool: BrandItem[] = [...DEFAULT_BRANDS];
    try {
      const saved = localStorage.getItem("dastavval_custom_brands_v2");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) pool = parsed;
      }
    } catch (e) {}
    if (b2bConfig?.brands && Array.isArray(b2bConfig.brands) && b2bConfig.brands.length > 0) {
      const byName = new Map<string, BrandItem>();
      pool.forEach(b => byName.set(b.name, b));
      b2bConfig.brands.forEach(b => byName.set(b.name, b));
      pool = Array.from(byName.values());
    }
    return pool;
  });

  // Sync with b2bConfig.brands and global events
  useEffect(() => {
    if (b2bConfig?.brands && Array.isArray(b2bConfig.brands) && b2bConfig.brands.length > 0) {
      setAllBrandsPool(prev => {
        const byName = new Map<string, BrandItem>();
        prev.forEach(b => byName.set(b.name, b));
        b2bConfig.brands!.forEach(b => byName.set(b.name, b));
        return Array.from(byName.values());
      });
    }
  }, [b2bConfig?.brands]);

  useEffect(() => {
    const handleBrandsUpdate = (e: any) => {
      if (e.detail?.brands && Array.isArray(e.detail.brands)) {
        setAllBrandsPool(e.detail.brands);
      }
    };
    const handleLocationsUpdate = () => {
      setProvincesList(getStoredProvinces(b2bConfig));
      setIndustrialParksList(getStoredIndustrialParks(b2bConfig));
    };
    window.addEventListener("dastavval_brands_updated", handleBrandsUpdate);
    window.addEventListener("dastavval_locations_updated", handleLocationsUpdate);
    return () => {
      window.removeEventListener("dastavval_brands_updated", handleBrandsUpdate);
      window.removeEventListener("dastavval_locations_updated", handleLocationsUpdate);
    };
  }, [b2bConfig]);

  // List of active brands in B2B Config to choose for Owned Brands list
  const availableBrands = useMemo<BrandItem[]>(() => {
    const map = new Map<string, BrandItem>();
    allBrandsPool.forEach(b => map.set(b.name, b));
    products.forEach(p => {
      if (p.brand && !map.has(p.brand)) {
        map.set(p.brand, {
          id: `prod-brand-${p.brand}`,
          name: p.brand,
          type: "کالای موجود در انبار",
          icon: "🏭",
          logoUrl: p.brandLogoUrl || p.image_url
        });
      }
    });
    return Array.from(map.values());
  }, [allBrandsPool, products]);

  // Filtered brands based on search
  const filteredBrandsForSelection = useMemo<BrandItem[]>(() => {
    return availableBrands.filter(b => 
      b.name.toLowerCase().includes(brandSearchQuery.toLowerCase()) ||
      (b.type && b.type.toLowerCase().includes(brandSearchQuery.toLowerCase()))
    );
  }, [availableBrands, brandSearchQuery]);

  const handleAddInlineProvince = async () => {
    const cleanProv = newProvinceInput.trim();
    if (!cleanProv) return;
    if (!provincesList.includes(cleanProv)) {
      const updated = [...provincesList, cleanProv];
      setProvincesList(updated);
      try {
        localStorage.setItem("dastavval_provinces_v2", JSON.stringify(updated));
      } catch (e) {}
      await onUpdateB2bConfig({
        ...b2bConfig,
        customProvinces: updated
      });
      window.dispatchEvent(new CustomEvent("dastavval_locations_updated"));
    }
    setProvince(cleanProv);
    setNewProvinceInput("");
    setShowAddProvinceInline(false);
  };

  const handleAddInlineIndustrialPark = async () => {
    const cleanPark = newParkInput.trim();
    if (!cleanPark) return;
    if (!industrialParksList.includes(cleanPark)) {
      const updated = [...industrialParksList, cleanPark];
      setIndustrialParksList(updated);
      try {
        localStorage.setItem("dastavval_industrial_parks_v2", JSON.stringify(updated));
      } catch (e) {}
      await onUpdateB2bConfig({
        ...b2bConfig,
        customIndustrialParks: updated
      });
      window.dispatchEvent(new CustomEvent("dastavval_locations_updated"));
    }
    setIndustrialPark(cleanPark);
    setNewParkInput("");
    setShowAddParkInline(false);
  };

  const handleAddInlineBrand = async () => {
    const cleanBrand = newBrandNameInput.trim();
    if (!cleanBrand) return;
    if (!ownedBrands.includes(cleanBrand)) {
      setOwnedBrands(prev => [...prev, cleanBrand]);
    }
    const newBrandItem: BrandItem = {
      id: `brand-${Date.now()}`,
      name: cleanBrand,
      type: newBrandTypeInput.trim() || "صنعتی",
      icon: "🏭",
      logoUrl: newBrandLogoInput.trim() || "",
      factoryName: name.trim() || undefined,
      factoryId: editingId || undefined
    };
    const updatedPool = [newBrandItem, ...allBrandsPool.filter(b => b.name !== cleanBrand)];
    setAllBrandsPool(updatedPool);
    try {
      localStorage.setItem("dastavval_custom_brands_v2", JSON.stringify(updatedPool));
    } catch (e) {}
    await onUpdateB2bConfig({
      ...b2bConfig,
      brands: updatedPool
    });
    window.dispatchEvent(new CustomEvent("dastavval_brands_updated", { detail: { brands: updatedPool } }));
    setNewBrandNameInput("");
    setNewBrandLogoInput("");
    setShowAddBrandInline(false);
  };

  // Filtered factories
  const filteredFactories = useMemo(() => {
    return factories.filter(f => {
      const matchSearch = !searchQuery.trim() || 
        f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (f.description && f.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (f.factoryCode && f.factoryCode.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchCategory = categoryFilter === "all" || f.category === categoryFilter;
      return matchSearch && matchCategory;
    });
  }, [factories, searchQuery, categoryFilter]);

  const handleSaveFactories = async (updatedList: ExtendedFactoryProfile[]) => {
    setSaving(true);
    try {
      setFactories(updatedList);
      await onUpdateB2bConfig({
        ...b2bConfig,
        factories: updatedList as FactoryProfile[]
      });
      setSuccessMsg("اطلاعات کارخانجات با موفقیت ذخیره و در سیستم اعمال شد.");
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setErrorMsg("خطا در ذخیره‌سازی کارخانجات: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleResetForm = () => {
    setName("");
    setFactoryCode("");
    setLogoUrl("");
    setCoverUrl("");
    setDescription("");
    setProvince("");
    setCity("");
    setIndustrialPark("");
    setIsFirstHand(true);
    setEstablishedYear("");
    setCategory("");
    setContact("");
    setContactPhone("");
    setEmptyCapacityPercent("");
    setPersonnelCount("");
    setDailyCapacity("");
    setFactoryArea("");
    setActiveProductionLines("");
    setIsoCertificates([]);
    setNewIsoCert("");
    setProductsSalesEnabled(true);
    setPriceAdjustmentPercent("");
    setCommissionPercent("");
    setOwnedBrands([]);
    setBadge("");
    setSelectedBadges([]);
    setIsActive(true);
    setIsFeatured(false);
    setIsNationalBrand(false);
    setGalleryImages([]);
    setNewGalleryUrl("");
    setNewGalleryTitle("");
    setNewGalleryCategory("production");
    setEditingId(null);
    setErrorMsg(null);
  };

  const handleEdit = (f: ExtendedFactoryProfile) => {
    setEditingId(f.id);
    setName(f.name);
    setFactoryCode(f.factoryCode || "");
    setLogoUrl(f.logoUrl || "");
    setCoverUrl(f.coverUrl || "");
    setDescription(f.description || "");
    setProvince(f.province || f.location || "");
    setCity(f.city || "");
    setIndustrialPark(f.industrialPark || "");
    setIsFirstHand(f.isFirstHand !== false);
    setEstablishedYear(f.establishedYear ? String(f.establishedYear) : "");
    setCategory(f.category || "");
    setContact(f.contact || "");
    setContactPhone(f.contactPhone || "");
    setEmptyCapacityPercent(f.emptyCapacityPercent !== undefined ? f.emptyCapacityPercent : "");
    
    // Load customizable engineering and industrial details
    setPersonnelCount(f.personnelCount !== undefined ? f.personnelCount : "");
    setDailyCapacity(f.dailyCapacity || "");
    setFactoryArea(f.factoryArea || "");
    setActiveProductionLines(f.activeProductionLines !== undefined ? f.activeProductionLines : "");
    setIsoCertificates(f.isoCertificates || []);
    setNewIsoCert("");

    setProductsSalesEnabled(f.productsSalesEnabled !== false);
    setPriceAdjustmentPercent(f.priceAdjustmentPercent !== undefined ? f.priceAdjustmentPercent : "");
    setCommissionPercent(f.commissionPercent !== undefined ? f.commissionPercent : "");
    setOwnedBrands(f.ownedBrands || []);
    setBadge(f.badge || "");
    setSelectedBadges(f.selectedBadges || (f.badge ? [f.badge] : []));
    setIsActive(f.isActive !== false);
    setIsFeatured(!!f.isFeatured);
    setIsNationalBrand(!!f.isNationalBrand);
    setGalleryImages(f.galleryImages || []);
    setNewGalleryUrl("");
    setNewGalleryTitle("");
    setNewGalleryCategory("production");
    window.scrollTo({ top: 100, behavior: "smooth" });
  };

  const handleDelete = async (id: string) => {
    const target = factories.find(f => f.id === id);
    if (!target) return;

    if (window.confirm(`آیا از حذف کارخانه «${target.name}» از سامانه اطمینان دارید؟ تمامی اطلاعات مرتبط معلق خواهد شد.`)) {
      const updated = factories.filter(f => f.id !== id);
      await handleSaveFactories(updated);
      if (editingId === id) handleResetForm();
    }
  };

  const handleToggleStatus = async (id: string) => {
    const updated = factories.map(f => {
      if (f.id === id) {
        return { ...f, isActive: !f.isActive };
      }
      return f;
    });
    await handleSaveFactories(updated);
  };

  const handleToggleNationalBrand = async (id: string) => {
    const updated = factories.map(f => {
      if (f.id === id) {
        return { ...f, isNationalBrand: !f.isNationalBrand };
      }
      return f;
    });
    await handleSaveFactories(updated);
  };

  const handleToggleBrandSelection = (brandName: string) => {
    setOwnedBrands(prev => 
      prev.includes(brandName) 
        ? prev.filter(b => b !== brandName) 
        : [...prev, brandName]
    );
  };

  const handleAddGalleryImage = () => {
    if (!newGalleryUrl.trim()) {
      alert("لطفاً ابتدا تصویر مورد نظر خود را آپلود کنید یا آدرس آن را مستقیماً وارد نمایید.");
      return;
    }
    setGalleryImages(prev => [
      ...prev,
      {
        url: newGalleryUrl.trim(),
        title: newGalleryTitle.trim() || "تصویر بخش گالری کارخانه",
        category: newGalleryCategory
      }
    ]);
    setNewGalleryUrl("");
    setNewGalleryTitle("");
    setNewGalleryCategory("production");
  };

  const handleRemoveGalleryImage = (index: number) => {
    setGalleryImages(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg("نام کارخانه الزامی است.");
      return;
    }

    setSaving(true);
    try {
      const cleanName = name.trim();
      let updatedList: ExtendedFactoryProfile[];

      const payload: ExtendedFactoryProfile = {
        id: editingId || `factory-${Date.now()}`,
        name: cleanName,
        factoryCode: factoryCode.trim() || `FAC-${Math.floor(1000 + Math.random() * 9000)}`,
        logoUrl: logoUrl.trim(),
        coverUrl: coverUrl.trim(),
        description: description.trim(),
        location: province.trim(),
        province: province.trim(),
        city: city.trim(),
        industrialPark: industrialPark.trim(),
        isFirstHand: isFirstHand,
        establishedYear: establishedYear.trim(),
        category: category,
        contact: contact.trim(),
        contactPhone: contactPhone.trim(),
        emptyCapacityPercent: Number(emptyCapacityPercent) || 0,
        
        // Custom engineering specs
        personnelCount: personnelCount !== "" ? Number(personnelCount) : undefined,
        dailyCapacity: dailyCapacity.trim() || undefined,
        factoryArea: factoryArea.trim() || undefined,
        activeProductionLines: activeProductionLines !== "" ? Number(activeProductionLines) : undefined,
        isoCertificates: isoCertificates,

        productsSalesEnabled,
        priceAdjustmentPercent: Number(priceAdjustmentPercent) || 0,
        commissionPercent: Number(commissionPercent) || 0,
        ownedBrands: ownedBrands,
        badge: selectedBadges.length > 0 ? selectedBadges[0] : "",
        selectedBadges: selectedBadges,
        isActive,
        isFeatured,
        isNationalBrand,
        galleryImages: galleryImages,
        rating: editingId ? (factories.find(f => f.id === editingId)?.rating || 5) : 5
      };

      if (editingId) {
        updatedList = factories.map(f => f.id === editingId ? payload : f);
      } else {
        updatedList = [payload, ...factories];
      }

      // Sync Province to persistent list if new
      let updatedProvinces = provincesList;
      if (province.trim() && !provincesList.includes(province.trim())) {
        updatedProvinces = [...provincesList, province.trim()];
        setProvincesList(updatedProvinces);
        try {
          localStorage.setItem("dastavval_provinces_v2", JSON.stringify(updatedProvinces));
        } catch (e) {}
      }

      // Sync Industrial Park to persistent list if new
      let updatedIndustrialParks = industrialParksList;
      if (industrialPark.trim() && !industrialParksList.includes(industrialPark.trim())) {
        updatedIndustrialParks = [...industrialParksList, industrialPark.trim()];
        setIndustrialParksList(updatedIndustrialParks);
        try {
          localStorage.setItem("dastavval_industrial_parks_v2", JSON.stringify(updatedIndustrialParks));
        } catch (e) {}
      }

      // Sync connected brands so their factoryId & factoryName point to this factory
      const updatedBrandsPool = allBrandsPool.map(b => {
        if (ownedBrands.includes(b.name)) {
          return {
            ...b,
            factoryId: payload.id,
            factoryName: payload.name
          };
        }
        return b;
      });
      setAllBrandsPool(updatedBrandsPool);
      try {
        localStorage.setItem("dastavval_custom_brands_v2", JSON.stringify(updatedBrandsPool));
      } catch (e) {}

      // Save factories, brands, and custom location lists in B2BConfig
      setFactories(updatedList);
      await onUpdateB2bConfig({
        ...b2bConfig,
        factories: updatedList as FactoryProfile[],
        brands: updatedBrandsPool,
        customProvinces: updatedProvinces,
        customIndustrialParks: updatedIndustrialParks
      });

      window.dispatchEvent(new CustomEvent("dastavval_brands_updated", { detail: { brands: updatedBrandsPool } }));
      window.dispatchEvent(new CustomEvent("dastavval_locations_updated"));

      setSuccessMsg("اطلاعات کارخانه، شهرک صنعتی، استان و برندهای متصل با موفقیت ذخیره گردید.");
      setTimeout(() => setSuccessMsg(null), 3000);
      handleResetForm();
    } catch (err: any) {
      setErrorMsg("خطا در ذخیره‌سازی: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300" dir="rtl">
      {/* Top Title Section */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center font-black">
            <Building2 size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black text-slate-900 font-sans">مدیریت همه‌جانبه کارخانجات تولیدی</h2>
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-emerald-200">
                {toPersianDigits(factories.length)} کارخانه فعال
              </span>
            </div>
            <p className="text-xs text-slate-500 font-bold mt-0.5">
              تنظیم درصد تخفیف، نرخ کارمزد سیستم، برندهای تحت مالکیت، ظرفیت تولید و وضعیت معامله
            </p>
          </div>
        </div>

        {/* Quick Search */}
        <div className="relative min-w-[240px]">
          <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جستجوی کارخانه بر اساس نام یا کد..."
            className="w-full pr-9 pl-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-emerald-500 outline-none transition-all"
          />
        </div>
      </div>



      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* RIGHT COLUMN: FACTORY FORM (5 cols) */}
        <div className="lg:col-span-5 bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4 h-fit">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Building2 size={16} className="text-emerald-600" />
              <span>{editingId ? "ویرایش مشخصات کامل کارخانه" : "ثبت کارخانه تولیدی جدید"}</span>
            </h3>
            {editingId && (
              <button
                type="button"
                onClick={handleResetForm}
                className="text-xs font-bold text-rose-600 hover:underline"
              >
                انصراف و لغو
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Name & Code */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-black text-slate-700 mb-1">نام کامل کارخانه *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثال: صنایع غذایی مانا"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-emerald-500 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-[11px] font-black text-slate-700 mb-1">کد شناسایی اختصاصی</label>
                <input
                  type="text"
                  value={factoryCode}
                  onChange={(e) => setFactoryCode(e.target.value)}
                  placeholder="مثال: FAC-1004"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-left text-slate-800 focus:bg-white focus:border-emerald-500 outline-none transition-all"
                />
              </div>
            </div>

            {/* Category & Established */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-black text-slate-700 mb-1">حوزه فعالیت</label>
                <input
                  type="text"
                  list="categories-list"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="مثال: شوینده، صنایع غذایی..."
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-emerald-500 outline-none transition-all"
                />
                <datalist id="categories-list">
                  {DEFAULT_CATEGORIES.map(cat => (
                    <option key={cat} value={cat} />
                  ))}
                </datalist>
              </div>
              <div>
                <label className="block text-[11px] font-black text-slate-700 mb-1">سال تاسیس کارخانه</label>
                <input
                  type="text"
                  value={establishedYear}
                  onChange={(e) => setEstablishedYear(e.target.value)}
                  placeholder="مثال: ۱۳۷۸"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-emerald-500 outline-none transition-all"
                />
              </div>
            </div>

            {/* Province & City */}
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3.5 space-y-2">
              <label className="block text-[11px] font-black text-slate-700">استان و شهر مستقر کارخانه *</label>
              <StrictCityProvinceSelector
                selectedCity={city || "تهران"}
                selectedProvince={province || "تهران"}
                onSelect={(c, p) => {
                  setCity(c);
                  setProvince(p);
                }}
                variant="button"
                className="w-full text-right"
                placeholder="برای تغییر استان و شهر کارخانه کلیک کنید..."
              />
            </div>

            {/* Industrial Park & First-Hand Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-emerald-50/40 p-3.5 rounded-2xl border border-emerald-100">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-black text-slate-800 flex items-center gap-1">
                    <span>🏭 نام شهرک صنعتی مستقر</span>
                    <span className="text-[10px] text-emerald-600 font-bold">(فیلتر کلیدی)</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowAddParkInline(!showAddParkInline)}
                    className="text-[10.5px] text-emerald-700 hover:text-emerald-900 font-black cursor-pointer flex items-center gap-1 transition-colors"
                  >
                    <Plus size={11} />
                    <span>{showAddParkInline ? "انصراف" : "+ افزودن شهرک جدید"}</span>
                  </button>
                </div>

                {showAddParkInline && (
                  <div className="p-2.5 mb-2 bg-emerald-100/70 border border-emerald-200 rounded-xl space-y-2 animate-in fade-in">
                    <span className="text-[10px] font-black text-emerald-950 block">تعریف شهرک صنعتی جدید و اضافه شدن به لیست فیلترها:</span>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        value={newParkInput}
                        onChange={(e) => setNewParkInput(e.target.value)}
                        placeholder="نام شهرک صنعتی جدید..."
                        className="w-full px-2.5 py-1.5 bg-white border border-emerald-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleAddInlineIndustrialPark}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-black shrink-0 cursor-pointer shadow-xs"
                      >
                        ثبت و انتخاب
                      </button>
                    </div>
                  </div>
                )}

                <select
                  value={industrialPark}
                  onChange={(e) => setIndustrialPark(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white border border-emerald-200 rounded-xl text-xs font-bold text-slate-800 focus:border-emerald-500 outline-none transition-all shadow-2xs"
                >
                  <option value="">انتخاب شهرک صنعتی مستقر...</option>
                  {industrialParksList.map(park => (
                    <option key={park} value={park}>{park}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col justify-center">
                <label className="block text-[11px] font-black text-slate-800 mb-1">وضعیت مبدأ مستقیم</label>
                <label className="flex items-center gap-2.5 p-2 bg-white rounded-xl border border-emerald-200 cursor-pointer hover:bg-emerald-50/60 transition-all">
                  <input
                    type="checkbox"
                    checked={isFirstHand}
                    onChange={(e) => setIsFirstHand(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer accent-emerald-600"
                  />
                  <div className="text-right">
                    <span className="text-xs font-black text-emerald-950 block">👑 تولیدکننده دست اول و مبدأ مستقیم</span>
                    <span className="text-[10px] text-slate-500 block">بدون واسطه / تضمین کف قیمت فاکتور کارخانه</span>
                  </div>
                </label>
              </div>
            </div>

            {/* Contacts */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-black text-slate-700 mb-1">نام مدیر عامل / مسئول</label>
                <input
                  type="text"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder="مثال: مهندس رضوانی"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-emerald-500 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-[11px] font-black text-slate-700 mb-1">شماره تماس مستقیم کارخانه</label>
                <input
                  type="text"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="مثال: 02144556677"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-left text-slate-800 focus:bg-white focus:border-emerald-500 outline-none transition-all"
                />
              </div>
            </div>

            {/* Dynamic S3 PNG Logo Uploader & Gallery Selection */}
            <div className="space-y-3 p-3 bg-slate-50 border border-slate-200 rounded-2xl">
              <ParsPackImageUploader
                label="لوگو / تصویر لوگوی رسمی کارخانه"
                subLabel="تصویر PNG با پس‌زمینه شفاف"
                value={logoUrl}
                onChange={(url) => setLogoUrl(url)}
                folder="factories"
                aspectRatio="logo"
              />

              {/* Cover Photo */}
              <ParsPackImageUploader
                label="تصویر هدر / بنر کارخانه (Cover)"
                subLabel="عکس از سالن تولید یا سالن پخت"
                value={coverUrl}
                onChange={(url) => setCoverUrl(url)}
                folder="factories_covers"
                aspectRatio="banner"
              />

              {/* Multi-Gallery Images Manager */}
              <div className="pt-3.5 border-t border-slate-200/60 mt-3 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-black text-slate-800 flex items-center gap-1.5">
                    <span>تصاویر گالری رسمی کارخانه</span>
                  </label>
                  {galleryImages.length > 0 && (
                    <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-black">
                      {toPersianDigits(galleryImages.length)} تصویر
                    </span>
                  )}
                </div>

                {/* Form to add a new gallery item */}
                <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-2.5 shadow-2xs">
                  <p className="text-[9.5px] text-slate-500 font-bold">آپلود عکس جدید برای انبار، خط تولید یا گواهینامه‌ها:</p>
                  
                  <ParsPackImageUploader
                    label="آپلود عکس سالن، انبار یا تجهیزات"
                    subLabel="اندازه افقی بهینه برای نمایش گالری"
                    value={newGalleryUrl}
                    onChange={(url) => setNewGalleryUrl(url)}
                    folder="factories_gallery"
                    aspectRatio="banner"
                  />

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[9px] font-black text-slate-500 mb-1">عنوان تصویر (کپشن)</label>
                      <input
                        type="text"
                        placeholder="مثال: خط تولید شماره ۳ مجهز به بسته بندی بومی"
                        value={newGalleryTitle}
                        onChange={(e) => setNewGalleryTitle(e.target.value)}
                        className="w-full px-2.5 py-2 bg-slate-50 border border-slate-150 rounded-lg text-[10.5px] font-bold text-slate-800 focus:bg-white focus:border-emerald-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-black text-slate-500 mb-1">دسته‌بندی بخش تصویر</label>
                      <select
                        value={newGalleryCategory}
                        onChange={(e) => setNewGalleryCategory(e.target.value as any)}
                        className="w-full px-2.5 py-2 bg-slate-50 border border-slate-150 rounded-lg text-[10.5px] font-bold text-slate-800 focus:bg-white focus:border-emerald-500 outline-none"
                      >
                        <option value="production">خط تولید و سالن پخت</option>
                        <option value="machinery">تجهیزات و ماشین‌آلات صنعتی</option>
                        <option value="warehouse">انبار مرکزی و لجستیک کالا</option>
                        <option value="lab">کنترل کیفیت و آزمایشگاه</option>
                        <option value="exterior">نمای بیرونی و محوطه کارخانه</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddGalleryImage}
                    className="w-full py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-[10.5px] font-black flex items-center justify-center gap-1 shadow-2xs transition-all cursor-pointer"
                  >
                    <Plus size={12} strokeWidth={3} />
                    <span>افزودن این عکس به گالری کارخانه</span>
                  </button>
                </div>

                {/* Display/Manage existing gallery images */}
                {galleryImages.length > 0 && (
                  <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto pt-1">
                    {galleryImages.map((img, index) => (
                      <div key={index} className="relative group rounded-xl overflow-hidden border border-slate-200 bg-white p-1.5 flex flex-col gap-1.5 shadow-2xs">
                        <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-slate-100">
                          <img
                            src={img.url}
                            alt={img.title}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                          <span className="absolute top-1 right-1 text-[8px] font-black bg-slate-900/85 text-white px-1.5 py-0.5 rounded-md">
                            {img.category === "production" && "خط تولید"}
                            {img.category === "machinery" && "ماشین‌آلات"}
                            {img.category === "warehouse" && "انبار"}
                            {img.category === "lab" && "آزمایشگاه"}
                            {img.category === "exterior" && "محوطه بیرونی"}
                          </span>
                        </div>
                        <div className="flex items-start justify-between gap-1 min-w-0">
                          <div className="min-w-0 text-right">
                            <p className="text-[10px] font-black text-slate-800 truncate" title={img.title}>
                              {img.title || "تصویر بدون عنوان"}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveGalleryImage(index)}
                            className="p-1 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-md transition-colors shrink-0 cursor-pointer"
                            title="حذف از گالری"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Engineering & Industrial Specifications */}
            <div className="border border-slate-200 bg-white p-4 rounded-2xl space-y-3.5 shadow-2xs">
              <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                <Sliders size={14} className="text-slate-700" />
                <span>مشخصات فنی، ظرفیت تولیدی و استانداردها (سفارشی)</span>
              </h4>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-slate-700 mb-1">تعداد پرسنل و کادر فنی فعال</label>
                  <input
                    type="number"
                    placeholder="مثال: ۲۵۰"
                    value={personnelCount}
                    onChange={(e) => setPersonnelCount(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-slate-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-700 mb-1">تعداد کل خطوط تولید فعال</label>
                  <input
                    type="number"
                    placeholder="مثال: ۸"
                    value={activeProductionLines}
                    onChange={(e) => setActiveProductionLines(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-slate-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-slate-700 mb-1">وسعت کل اراضی و سالن‌ها</label>
                  <input
                    type="text"
                    placeholder="مثال: ۱۲,۵۰۰ متر مربع"
                    value={factoryArea}
                    onChange={(e) => setFactoryArea(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-slate-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-700 mb-1">ظرفیت تولید روزانه</label>
                  <input
                    type="text"
                    placeholder="مثال: ۵۰ تن مایعات بهداشتی"
                    value={dailyCapacity}
                    onChange={(e) => setDailyCapacity(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-slate-500 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Tag Manager for ISO Certificates & Standards */}
              <div className="space-y-2 pt-1">
                <label className="block text-[10px] font-black text-slate-700">گواهینامه‌ها و استانداردهای بین‌المللی (ISO)</label>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    placeholder="مثال: ISO 9001:2015 یا HACCP"
                    value={newIsoCert}
                    onChange={(e) => setNewIsoCert(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        if (newIsoCert.trim() && !isoCertificates.includes(newIsoCert.trim())) {
                          setIsoCertificates(prev => [...prev, newIsoCert.trim()]);
                          setNewIsoCert("");
                        }
                      }
                    }}
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-slate-500 outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newIsoCert.trim() && !isoCertificates.includes(newIsoCert.trim())) {
                        setIsoCertificates(prev => [...prev, newIsoCert.trim()]);
                        setNewIsoCert("");
                      }
                    }}
                    className="px-3 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-black cursor-pointer transition-all shrink-0"
                  >
                    افزودن
                  </button>
                </div>

                {isoCertificates.length > 0 && (
                  <div className="flex flex-wrap gap-1 bg-slate-50/50 p-2 rounded-xl border border-slate-150 min-h-8">
                    {isoCertificates.map((cert, index) => (
                      <span key={index} className="inline-flex items-center gap-1 text-[10px] font-black bg-slate-100 text-slate-700 px-2 py-0.5 rounded-lg border border-slate-200">
                        <span>{cert}</span>
                        <button
                          type="button"
                          onClick={() => setIsoCertificates(prev => prev.filter((_, idx) => idx !== index))}
                          className="text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                        >
                          <X size={10} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Custom Business Rules - Sales, Price adjustments, Commissions */}
            <div className="border border-emerald-100 bg-emerald-50/20 p-4 rounded-2xl space-y-3">
              <h4 className="text-xs font-black text-emerald-900 flex items-center gap-1.5 border-b border-emerald-100 pb-1.5">
                <Sliders size={14} className="text-emerald-700" />
                <span>تنظیمات تجاری و مارجین مالی کارخانه</span>
              </h4>

              {/* Product Sales Enabled Toggle */}
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-800">امکان فروش مستقیم محصولات کاتالوگ:</span>
                <button
                  type="button"
                  onClick={() => setProductsSalesEnabled(!productsSalesEnabled)}
                  className="focus:outline-none"
                >
                  {productsSalesEnabled ? (
                    <ToggleRight className="text-emerald-600 w-11 h-6" />
                  ) : (
                    <ToggleLeft className="text-slate-400 w-11 h-6" />
                  )}
                </button>
              </div>

              {/* Price adjustment percentage */}
              <div>
                <label className="block text-[11px] font-black text-slate-700 mb-1 flex items-center justify-between">
                  <span>درصد افزایش یا تعدیل قیمت کالاها (منفی برای تخفیف):</span>
                  <span className="text-emerald-700 font-black">{priceAdjustmentPercent !== "" ? `${toPersianDigits(priceAdjustmentPercent)}٪` : "۰٪"}</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="any"
                    placeholder="مثال: -5.5 (کاهش قیمت) یا 12 (افزایش قیمت)"
                    value={priceAdjustmentPercent}
                    onChange={(e) => setPriceAdjustmentPercent(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full pl-7 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:border-emerald-500 focus:bg-white outline-none"
                  />
                  <Percent size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
                <p className="text-[9px] text-slate-400 font-medium mt-1">
                  مقدارهای منفی (مثلاً ۵.۵-٪) یعنی فروش ارزان‌تر از قیمت مصوب بنکداری به عنوان تخفیف مستقیم درب کارخانه و مقادیر مثبت یعنی افزایش قیمت.
                </p>
              </div>

              {/* Commission Percentage */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[10px] font-black text-slate-700 mb-1">درصد کمیسیون سیستم:</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="any"
                      placeholder="مثال: 4.5"
                      value={commissionPercent}
                      onChange={(e) => setCommissionPercent(e.target.value === "" ? "" : Number(e.target.value))}
                      className="w-full pl-7 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:border-emerald-500 focus:bg-white outline-none"
                    />
                    <Percent size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-700 mb-1">ظرفیت خالی تولید (OEM):</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="any"
                      placeholder="مثال: 40"
                      value={emptyCapacityPercent}
                      onChange={(e) => setEmptyCapacityPercent(e.target.value === "" ? "" : Number(e.target.value))}
                      className="w-full pl-7 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:border-emerald-500 focus:bg-white outline-none"
                    />
                    <Percent size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>
              </div>
            </div>

            {/* Owned Brands Selection with Search & Logos */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="text-[11px] font-black text-slate-800 flex items-center gap-1.5">
                  <Tag size={13} className="text-emerald-600" />
                  <span>انتخاب و اتصال برندهای متعلق به این کارخانه</span>
                </label>
                <div className="flex items-center gap-2">
                  {ownedBrands.length > 0 && (
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-black border border-emerald-200">
                      {toPersianDigits(ownedBrands.length)} برند متصل
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowAddBrandInline(!showAddBrandInline)}
                    className="text-[10.5px] text-emerald-700 hover:text-emerald-900 bg-emerald-100/70 hover:bg-emerald-100 border border-emerald-300 px-2.5 py-1 rounded-xl font-black cursor-pointer flex items-center gap-1 transition-all"
                  >
                    <Plus size={12} />
                    <span>{showAddBrandInline ? "بستن فرم" : "+ تعریف برند جدید"}</span>
                  </button>
                </div>
              </div>

              {/* Inline Brand Creation Form */}
              {showAddBrandInline && (
                <div className="p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-2xl space-y-2.5 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black text-emerald-950 flex items-center gap-1">
                      <span>🏷️ ایجاد برند جدید و اتصال مستقیم به این کارخانه</span>
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={newBrandNameInput}
                      onChange={(e) => setNewBrandNameInput(e.target.value)}
                      placeholder="نام برند جدید (مثلاً مزمز طلایی)..."
                      className="w-full px-3 py-2 bg-white border border-emerald-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none"
                    />
                    <input
                      type="text"
                      value={newBrandTypeInput}
                      onChange={(e) => setNewBrandTypeInput(e.target.value)}
                      placeholder="گروه تخصصی (مثلاً تنقلات)..."
                      className="w-full px-3 py-2 bg-white border border-emerald-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none"
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={newBrandLogoInput}
                      onChange={(e) => setNewBrandLogoInput(e.target.value)}
                      placeholder="آدرس اینترنتی لوگو (اختیاری)..."
                      className="w-full px-3 py-2 bg-white border border-emerald-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleAddInlineBrand}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shrink-0 cursor-pointer shadow-xs transition-colors"
                    >
                      ثبت و اتصال به کارخانه
                    </button>
                  </div>
                </div>
              )}

              {/* Currently connected brands chips */}
              {ownedBrands.length > 0 && (
                <div className="p-2.5 bg-white rounded-xl border border-emerald-200/80 space-y-1.5">
                  <span className="text-[10px] font-black text-slate-500 block">برندهای در حال حاضر متصل به این واحد تولیدی:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {ownedBrands.map((bName) => (
                      <span
                        key={bName}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-900 border border-emerald-300 rounded-lg text-xs font-black"
                      >
                        <span>{bName}</span>
                        <button
                          type="button"
                          onClick={() => handleToggleBrandSelection(bName)}
                          className="text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                          title="حذف اتصال این برند"
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Brand Search Bar */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="جستجو در بین تمامی برندهای موجود..."
                  value={brandSearchQuery}
                  onChange={(e) => setBrandSearchQuery(e.target.value)}
                  className="w-full pl-3 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-emerald-500 outline-none transition-all placeholder:text-slate-400"
                />
                <Search size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                {brandSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setBrandSearchQuery("")}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>

              {availableBrands.length === 0 ? (
                <p className="text-[10px] text-slate-400 font-bold text-center py-2">هیچ برندی در سیستم ثبت نشده است.</p>
              ) : filteredBrandsForSelection.length === 0 ? (
                <p className="text-[10px] text-slate-400 font-bold text-center py-2">برندی با این نام یافت نشد.</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-52 overflow-y-auto p-1.5 bg-white rounded-xl border border-slate-150">
                  {filteredBrandsForSelection.map(br => {
                    const isSelected = ownedBrands.includes(br.name);
                    return (
                      <button
                        key={br.id}
                        type="button"
                        onClick={() => handleToggleBrandSelection(br.name)}
                        className={`p-2 rounded-xl text-[10.5px] font-black transition-all flex items-center justify-between text-right cursor-pointer border ${
                          isSelected 
                            ? "bg-emerald-50 border-emerald-500 shadow-2xs text-emerald-950 ring-1 ring-emerald-400" 
                            : "bg-slate-50/70 text-slate-700 border-slate-200/80 hover:bg-slate-100"
                        }`}
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          <div className="w-7 h-7 rounded-lg overflow-hidden bg-white border border-slate-100 flex items-center justify-center p-0.5 shrink-0">
                            {br.logoUrl ? (
                              <img 
                                src={br.logoUrl} 
                                alt={br.name} 
                                className="max-w-full max-h-full object-contain" 
                                referrerPolicy="no-referrer"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = `https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=100`;
                                }}
                              />
                            ) : (
                              <span className="text-[9px] font-black text-slate-400">{br.name.charAt(0)}</span>
                            )}
                          </div>
                          <div className="text-right min-w-0">
                            <p className="font-black text-slate-800 text-[11px] truncate">{br.name}</p>
                            <p className="text-[9px] text-slate-400 font-bold truncate">{br.type || "صنعتی"}</p>
                          </div>
                        </div>
                        <div className={`w-4.5 h-4.5 rounded-md flex items-center justify-center border transition-all ${
                          isSelected 
                            ? "bg-emerald-600 border-emerald-600 text-white" 
                            : "bg-white border-slate-200"
                        }`}>
                          {isSelected && <Check size={11} strokeWidth={3} />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Award Luxury Special Badges & Symbols (Multiple Checkable Luxury Cards) */}
            <div className="p-4 bg-gradient-to-br from-amber-50/25 to-slate-50/30 border border-amber-200/55 rounded-2xl space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-black text-slate-800 flex items-center gap-1.5">
                  <Award size={13} className="text-amber-600" />
                  <span>اعطای تندیس‌ها، گواهینامه‌ها و نشان‌های ویژه ملی (چندین انتخاب)</span>
                </label>
                {selectedBadges.length > 0 && (
                  <span className="text-[9.5px] bg-amber-100 text-amber-950 border border-amber-300 px-2.5 py-0.5 rounded-full font-black animate-pulse">
                    ✨ {toPersianDigits(selectedBadges.length)} نشان لاکچری فعال
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {LUXURY_PRESET_BADGES.map(lBadge => {
                  const isChecked = selectedBadges.includes(lBadge.label);
                  return (
                    <button
                      key={lBadge.id}
                      type="button"
                      onClick={() => {
                        setSelectedBadges(prev => 
                          prev.includes(lBadge.label)
                            ? prev.filter(b => b !== lBadge.label)
                            : [...prev, lBadge.label]
                        );
                      }}
                      className={`p-3 rounded-2xl border text-right transition-all cursor-pointer relative overflow-hidden group flex flex-col justify-between h-28 ${
                        isChecked 
                          ? `${lBadge.bgClass} scale-[1.01] ring-1 ring-amber-400` 
                          : "bg-white/80 hover:bg-slate-50 border-slate-200"
                      }`}
                    >
                      <div className="space-y-1 z-10">
                        <div className="flex items-center justify-between gap-1.5">
                          <p className="font-black text-slate-900 text-[11px] leading-tight truncate">
                            {lBadge.title}
                          </p>
                          <div className={`w-5 h-5 rounded-lg flex items-center justify-center transition-all ${
                            isChecked ? "bg-amber-600 text-white" : "bg-slate-100 text-slate-400"
                          }`}>
                            <Check size={12} strokeWidth={3} />
                          </div>
                        </div>
                        <p className="text-[9px] text-slate-500 font-bold leading-normal">
                          {lBadge.description}
                        </p>
                      </div>

                      {/* Display luxury tag ribbon */}
                      <div className="pt-2 flex items-center justify-between border-t border-dashed border-slate-200/60 z-10">
                        <span className={`text-[9.5px] font-black px-2 py-0.5 rounded-md bg-gradient-to-r ${lBadge.color} text-white`}>
                          {lBadge.badgeText}
                        </span>
                        <span className="text-[8px] text-slate-400 font-bold">بخش تجاری رتبه الف</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Factory Description */}
            <div>
              <label className="block text-[11px] font-black text-slate-700 mb-1">معرفی رسمی و جزئیات فعالیت کارخانه</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="توضیحاتی پیرامون استانداردهای بهداشتی، تعداد خطوط تولید فعال و گستره توزیع..."
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:border-emerald-500 outline-none transition-all"
              />
            </div>

            {/* Features (IsActive, IsFeatured) */}
            <div className="flex flex-wrap items-center gap-4 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <label className="flex items-center gap-1.5 text-xs font-black text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span>وضعیت کارخانه (فعال در سامانه)</span>
              </label>

              <label className="flex items-center gap-1.5 text-xs font-black text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span>کارخانه برگزیده (نمایش در هدر)</span>
              </label>

              <label className="flex items-center gap-1.5 text-xs font-black text-amber-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isNationalBrand}
                  onChange={(e) => setIsNationalBrand(e.target.checked)}
                  className="rounded text-amber-600 focus:ring-amber-500"
                />
                <span>برند ملی برتر (نمای لوکس طلایی)</span>
              </label>
            </div>

            {/* Error & Success Messages */}
            {errorMsg && (
              <p className="text-xs text-rose-600 font-bold bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                {errorMsg}
              </p>
            )}

            {successMsg && (
              <p className="text-xs text-emerald-700 font-bold bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
                {successMsg}
              </p>
            )}

            {/* Form Action Buttons */}
            <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Save size={15} />
                <span>{saving ? "در حال ثبت..." : editingId ? "ذخیره تغییرات کارخانه" : "ثبت کارخانه تولیدی"}</span>
              </button>

              {editingId && (
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  انصراف
                </button>
              )}
            </div>

          </form>
        </div>

        {/* LEFT COLUMN: FACTORIES CATALOG/LIST (7 cols) */}
        <div className="lg:col-span-7 bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Layers size={16} className="text-emerald-600" />
              <span>لیست کاتالوگ کارخانجات عضو سامانه</span>
            </h3>

            {/* Category selection */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-black text-slate-700 focus:bg-white focus:outline-none cursor-pointer"
            >
              <option value="all">همه دسته‌بندی‌ها</option>
              {DEFAULT_CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {filteredFactories.length === 0 ? (
            <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-3xl text-slate-400 font-bold text-xs space-y-2">
              <Building2 className="mx-auto text-slate-300" size={32} />
              <p>هیچ کارخانه‌ای با فیلترهای مشخص‌شده یافت نشد.</p>
              <button 
                onClick={() => { setSearchQuery(""); setCategoryFilter("all"); }}
                className="text-emerald-600 text-[11px] underline font-black"
              >
                پاک کردن فیلترها
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredFactories.map((f, idx) => {
                const isSelected = editingId === f.id;
                return (
                  <div 
                    key={`admin-factory-row-${f.id}-${idx}`}
                    className={`border rounded-3xl p-5 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                      isSelected 
                        ? "border-emerald-600 bg-emerald-50/15 ring-2 ring-emerald-500/20" 
                        : f.isActive === false 
                          ? "border-slate-200 bg-slate-50/70 opacity-75"
                          : "border-slate-200 hover:border-slate-300 bg-white shadow-2xs hover:shadow-xs"
                    }`}
                  >
                    {/* Factory general details */}
                    <div className="flex items-start gap-4">
                      <div className="w-20 h-20 rounded-2xl bg-white border border-slate-150 p-2 flex items-center justify-center shrink-0 overflow-hidden relative shadow-sm ring-8 ring-slate-50/30">
                        {f.logoUrl ? (
                          <img src={f.logoUrl} alt={f.name} className="w-full h-full object-contain mix-blend-multiply brightness-105" referrerPolicy="no-referrer" />
                        ) : (
                          <Building2 size={32} className="text-slate-300" />
                        )}
                      </div>

                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <h4 className="text-sm font-black text-slate-900 leading-none">{f.name}</h4>
                          <span className="text-[10px] bg-slate-100 text-slate-600 font-mono px-1.5 py-0.2 rounded-md">
                            {f.factoryCode}
                          </span>
                          
                          {/* Render Multiple Luxurious Badges */}
                          {f.selectedBadges && f.selectedBadges.length > 0 ? (
                            f.selectedBadges.map((badgeLabel, bIdx) => {
                              const foundPreset = LUXURY_PRESET_BADGES.find(lp => lp.label === badgeLabel);
                              const badgeText = foundPreset ? foundPreset.badgeText : badgeLabel;
                              const badgeColor = foundPreset ? foundPreset.textColor : "text-amber-800";
                              const badgeBg = foundPreset ? foundPreset.bgClass : "bg-amber-50 border-amber-200";
                              return (
                                <span key={bIdx} className={`text-[9px] font-black border px-2 py-0.5 rounded-full ${badgeBg} ${badgeColor} shadow-2xs`}>
                                  {badgeText}
                                </span>
                              );
                            })
                          ) : f.badge ? (
                            <span className="text-[9px] font-black bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full">
                              {f.badge}
                            </span>
                          ) : null}

                          {f.isFeatured && (
                            <span className="text-[9px] font-black bg-emerald-50 text-emerald-800 border border-emerald-100 px-2 py-0.5 rounded-full">
                              پیشنهاد ادمین
                            </span>
                          )}
                        </div>

                        <p className="text-[11px] text-slate-500 font-semibold leading-normal flex flex-wrap items-center gap-1.5 mt-0.5">
                          <span>{f.category}</span>
                          <span>•</span>
                          <span>تاسیس {toPersianDigits(f.establishedYear || "۱۳۸۵")}</span>
                          <span>•</span>
                          <span className="text-slate-700 font-black">استان {f.province || f.location || "تهران"} {f.city ? `(${f.city})` : ""}</span>
                          {f.industrialPark && (
                            <>
                              <span>•</span>
                              <span className="text-emerald-700 font-black bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded-md">
                                🏭 {f.industrialPark}
                              </span>
                            </>
                          )}
                          <span className="text-amber-700 font-black bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded-md mr-auto flex items-center gap-1">
                            <span>⭐ {toPersianDigits((f.rating || 5).toFixed(1))}</span>
                            <span className="text-slate-400 font-normal text-[9.5px]">({toPersianDigits(f.reviewsCount || 0)} نظر)</span>
                          </span>
                        </p>

                        {/* Custom Customizable Engineering Specifications */}
                        {(f.personnelCount || f.activeProductionLines || f.dailyCapacity || f.factoryArea || (f.isoCertificates && f.isoCertificates.length > 0)) && (
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 bg-slate-50/70 border border-slate-150 p-2 rounded-xl mt-1.5 text-[10px] text-slate-600 font-medium">
                            {f.personnelCount && (
                              <div className="flex items-center gap-1">
                                <span className="text-slate-400 font-bold">👥 پرسنل:</span>
                                <span className="font-black text-slate-800">{toPersianDigits(f.personnelCount)} نفر</span>
                              </div>
                            )}
                            {f.activeProductionLines && (
                              <div className="flex items-center gap-1">
                                <span className="text-slate-400 font-bold">⚙️ خطوط فعال:</span>
                                <span className="font-black text-slate-800">{toPersianDigits(f.activeProductionLines)} خط</span>
                              </div>
                            )}
                            {f.factoryArea && (
                              <div className="flex items-center gap-1">
                                <span className="text-slate-400 font-bold">📐 مساحت:</span>
                                <span className="font-black text-slate-800">{toPersianDigits(f.factoryArea)}</span>
                              </div>
                            )}
                            {f.dailyCapacity && (
                              <div className="flex items-center gap-1 md:col-span-2">
                                <span className="text-slate-400 font-bold">⚡ ظرفیت تولید:</span>
                                <span className="font-black text-slate-800">{toPersianDigits(f.dailyCapacity)}</span>
                              </div>
                            )}
                            {f.isoCertificates && f.isoCertificates.length > 0 && (
                              <div className="col-span-full flex flex-wrap items-center gap-1 border-t border-slate-200/55 pt-1.5 mt-0.5">
                                <span className="text-[9px] text-slate-400 font-bold shrink-0">🎗️ استانداردهای معتبر:</span>
                                {f.isoCertificates.map((cert, cIdx) => (
                                  <span key={cIdx} className="bg-white border border-slate-200 text-[8.5px] font-black text-slate-700 px-1.5 py-0.2 rounded">
                                    {cert}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Custom fields display */}
                        <div className="flex flex-wrap gap-2 pt-1.5">
                          {f.ownedBrands && f.ownedBrands.length > 0 && (
                            <div className="flex items-center gap-1 text-[10px] text-slate-500 bg-slate-100/80 px-2 py-0.5 rounded-md font-bold">
                              <Tag size={10} />
                              <span>برندها: {f.ownedBrands.join("، ")}</span>
                            </div>
                          )}

                          <div className="flex items-center gap-1 text-[10px] text-slate-500 bg-slate-100/80 px-2 py-0.5 rounded-md font-bold">
                            <Percent size={10} />
                            <span>کمیسیون: {toPersianDigits(f.commissionPercent || 5)}٪</span>
                          </div>

                          <div className="flex items-center gap-1 text-[10px] text-slate-500 bg-slate-100/80 px-2 py-0.5 rounded-md font-bold">
                            <ShoppingBag size={10} />
                            <span>فروش کالا: {f.productsSalesEnabled !== false ? "✅ فعال" : "❌ غیرفعال"}</span>
                          </div>

                          {f.priceAdjustmentPercent !== 0 && (
                            <div className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md font-bold ${
                              f.priceAdjustmentPercent! < 0 ? "bg-emerald-50 text-emerald-800 border border-emerald-100" : "bg-rose-50 text-rose-800 border border-rose-100"
                            }`}>
                              <span>تعدیل قیمت: {toPersianDigits(f.priceAdjustmentPercent || 0)}٪</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions and Status Control */}
                    <div className="flex items-center gap-2 md:self-center shrink-0 w-full md:w-auto justify-end border-t border-slate-100 pt-3 md:pt-0 md:border-0">
                      {/* Products Link & Manage Button */}
                      <button
                        type="button"
                        onClick={() => setLinkingFactory(f)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/90 rounded-xl text-xs font-black transition-all cursor-pointer shadow-2xs"
                        title="مدیریت و اتصال محصولات به این کارخانه"
                      >
                        <Link2 size={13} className="text-emerald-700" />
                        <span>محصولات ({toPersianDigits(getFactoryLinkedCount(f))})</span>
                      </button>

                      {/* National Brand / Featured Toggle */}
                      <button
                        type="button"
                        onClick={() => handleToggleNationalBrand(f.id)}
                        className={`p-2 rounded-xl transition-all cursor-pointer border ${
                          f.isNationalBrand 
                            ? "bg-amber-100 text-amber-700 border-amber-300 shadow-sm" 
                            : "bg-slate-100 text-slate-400 border-slate-200 hover:bg-amber-50 hover:text-amber-600"
                        }`}
                        title={f.isNationalBrand ? "حذف از لیست برندهای ملی برتر" : "تبدیل به برند ملی برتر (ویژه)"}
                      >
                        <Star size={14} fill={f.isNationalBrand ? "currentColor" : "none"} />
                      </button>

                      {/* Active Toggle Status Button */}
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(f.id)}
                        className={`text-[11px] font-black px-2.5 py-1.5 rounded-xl transition-all cursor-pointer border ${
                          f.isActive !== false 
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100" 
                            : "bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200"
                        }`}
                        title={f.isActive !== false ? "غیرفعال کردن موقت کارخانه" : "فعال کردن مجدد کارخانه"}
                      >
                        {f.isActive !== false ? "🟢 فعال" : "🔴 غیرفعال"}
                      </button>

                      {/* Edit button */}
                      <button
                        type="button"
                        onClick={() => handleEdit(f)}
                        className="p-2 bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 rounded-xl transition-all cursor-pointer"
                        title="ویرایش جزئیات کارخانه"
                      >
                        <Edit2 size={13} />
                      </button>

                      {/* Delete button */}
                      <button
                        type="button"
                        onClick={() => handleDelete(f.id)}
                        className="p-2 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 rounded-xl transition-all cursor-pointer"
                        title="حذف کامل کارخانه"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>
          )}

          {/* Business Guide / Tip */}
          <div className="bg-emerald-50/40 p-4 rounded-3xl border border-emerald-100 flex items-start gap-3 text-emerald-900 text-[11px] leading-relaxed">
            <ShieldAlert size={18} className="text-emerald-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <strong className="font-black">راهنمای کسب‌وکار دست اول:</strong>
              <p className="font-bold">
                کارخانجاتی که غیرفعال می‌شوند، محصولاتشان موقتاً از بخش ویترین کارخانجات و خریدهای مستقیم کاربران پنهان می‌شود اما تراکنش‌های مالی پیشین سالم باقی خواهند ماند. تعیین درصد تعدیل قیمت کارخانه به‌طور آنی روی تمامی قیمت‌های خروجی محاسباتی محصولات کارخانه در فاکتورهای عمده اثر می‌گذارد.
              </p>
            </div>
          </div>

        </div>

      </div>

      {/* Factory Product Link & Manage Modal */}
      {linkingFactory && (
        <FactoryProductLinkModal
          factory={linkingFactory}
          allProducts={products}
          onClose={() => setLinkingFactory(null)}
          onUpdateProduct={onUpdateProduct}
          onRefreshProducts={onRefreshProducts}
        />
      )}

    </div>
  );
}
