import React, { useState, useEffect, useMemo } from "react";
import { getDisplayImageUrl } from "../lib/image-utils";
import { uploadToParsPackStorage } from "../utils/storage";
import { motion, AnimatePresence } from "motion/react";
import StarRating from "./StarRating";
import LazyViewport from "./LazyViewport";
import DastavvalLogo from "./DastavvalLogo";
import { 
  Building2, 
  MapPin, 
  ShieldCheck, 
  ShoppingBag, 
  Star, 
  Search, 
  FileText, 
  Download, 
  Sparkles, 
  ExternalLink,
  X,
  Factory,
  Eye,
  MessageSquare,
  ThumbsUp,
  Award,
  CheckCircle2,
  PackageCheck,
  Truck,
  Pin,
  Boxes,
  Layers,
  Send,
  PlusCircle,
  PhoneCall,
  CheckCircle,
  Clock,
  Filter,
  QrCode,
  UploadCloud,
  Share2,
  ChevronDown,
  Zap,
  ArrowLeft,
  ShieldAlert,
  Briefcase,
  Wrench,
  Calculator,
  Paintbrush,
  FileCheck,
  CheckSquare
} from "lucide-react";
import { 
  INITIAL_RAW_MATERIALS, 
  INITIAL_RAW_SUPPLIERS, 
  RawMaterial, 
  RawMaterialSupplier 
} from "../data/rawMaterialsData";
import { Product, FactoryProfile } from "../types";
import FactoryDedicatedPage from "./FactoryDedicatedPage";

const toPersianNum = (num: number | string) => {
  if (num === undefined || num === null) return "";
  const farsiDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return num
    .toString()
    .replace(/\d/g, x => farsiDigits[parseInt(x)]);
};

export interface FactoryItem {
  id: string;
  name: string;
  logoUrl?: string;
  logo?: string;
  coverUrl?: string;
  description?: string;
  desc?: string;
  rating?: number;
  location?: string;
  establishedYear?: number | string;
  established?: string;
  category?: string;
  mainProducts?: string[];
  specs?: string[];
  capacity?: string;
  contact?: string;
  contactPhone?: string;
  isActive?: boolean;
  isFeatured?: boolean;
  isPinned?: boolean;
  isPremium?: boolean;
  viewsCount?: number;
  qualityScore?: number;
  packagingScore?: number;
  deliverySpeedScore?: number;
  reviewsCount?: number;
  catalogs?: { name: string; url: string }[];
  galleryImages?: { url: string; title: string; category?: 'production' | 'machinery' | 'warehouse' | 'lab' | 'exterior' }[];
  certificates?: { name: string; issuer?: string; year?: string }[];
  factoryExteriorPhoto?: string;
  productionLinePhoto?: string;
  warehousePhoto?: string;
  certificatesPhoto?: string;
  factoryDescription?: string;
  dailyCapacity?: string;
  healthLicense?: string;
  factoryHealthLicense?: string;
}

interface FactoryReviewItem {
  id: string;
  userName: string;
  userCity?: string;
  rating: number; // 1-5
  qualityRating?: number;
  packagingRating?: number;
  deliveryRating?: number;
  comment: string;
  createdAt: string;
  isVerifiedBuyer?: boolean;
}

interface FactoriesViewProps {
  factories?: FactoryItem[];
  products?: Product[];
  b2bConfig?: any;
  onSelectFactoryForOrder?: (factoryName: string) => void;
  onSelectProductForOrder?: (product: Product) => void;
  initialFactoryId?: string | null;
  theme?: 'light' | 'dark';
  userBadge?: string;
  user?: any;
}

const DEFAULT_CATEGORIES = [
  "همه صنایع",
  "تنقلات و شکلات",
  "کیک، کلوچه و بیسکویت",
  "نوشیدنی و آبمیوه",
  "مواد غذایی و کنسروجات",
  "شوینده و بهداشتی",
  "لبنیات و فرآورده‌ها"
];

const RAW_MATERIAL_CATEGORIES = [
  "همه مواد اولیه",
  "مواد اولیه شیرینی و شکلات",
  "آرد و غلات صنعتی",
  "روغن و چربی‌های تخصصی",
  "بسته‌بندی و ملزومات چاپ",
  "کنسروجات و عصاره‌های صنعتی",
  "پودرهای لبنی و افزودنی"
];

export interface IndustrialServiceItem {
  id: string;
  title: string;
  category: string;
  providerName: string;
  location: string;
  rating: number;
  deliveryDays: string;
  rate: string;
  description: string;
  capabilities: string[];
  imageUrl: string;
  isPendingApproval?: boolean;
}

const SERVICE_CATEGORIES = [
  "همه خدمات صنعتی",
  "طراحی صنعتی و بسته‌بندی",
  "ترخیص کالا و امور گمرکی",
  "تبلیغات، برندینگ و مارکتینگ",
  "حسابداری، حسابرسی و مالیات",
  "آزمایشگاه و کنترل کیفیت",
  "حمل‌ونقل، لجستیک و ترانزیت"
];

const INITIAL_INDUSTRIAL_SERVICES: IndustrialServiceItem[] = [];

// Initial mock reviews
const INITIAL_REVIEWS: Record<string, FactoryReviewItem[]> = {};

// Factory Card Component - Memoized for performance
const FactoryCard = React.memo(({ factory, idx, onSelect, onOrder, b2bConfig }: { 
  factory: any; 
  idx: number; 
  onSelect: (f: any) => void; 
  onOrder: (name: string) => void;
  b2bConfig?: any;
}) => {
  const cover = getDisplayImageUrl(factory.coverUrl || "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800");
  const desc = factory.description || factory.desc || "تولیدکننده رسمی محصولات استاندارد مواد غذایی با سیب سلامت و استانداردهای کیفی.";
  const categoryLabel = factory.category || "صنایع غذایی و مصرفی";
  const established = factory.establishedYear || factory.established || "۱۳۸۰";
  const location = factory.location || "شهرک صنعتی";
  const isFeatured = factory.isFeatured || factory.isPinned || factory.isPremium;
  const ratingScore = factory.rating || 5;
  const logo = getDisplayImageUrl(factory.logoUrl || factory.logo || "🏭");

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: "150px" }}
      whileHover={{ y: -8 }}
      onClick={() => onSelect(factory)}
      className="group relative bg-white rounded-[2.5rem] border border-slate-200/60 shadow-[0_20px_50px_rgba(0,0,0,0.02)] hover:shadow-[0_30px_60px_rgba(0,0,0,0.08)] hover:border-emerald-350 transition-all duration-500 overflow-hidden flex flex-col h-[480px] text-right cursor-pointer"
    >
      {/* Visual Header Section */}
      <div className="relative h-44 shrink-0 bg-slate-100">
        <img 
          src={cover} 
          alt={factory.name} 
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 opacity-90 rounded-t-[2.5rem]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/10 to-transparent rounded-t-[2.5rem]" />
        
        {/* Top Badges */}
        <div className="absolute top-4 right-4 flex flex-wrap gap-2 z-10">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 px-3 py-1.5 rounded-2xl flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] font-black text-white">{categoryLabel}</span>
          </div>
          {isFeatured && (
            <div className="bg-amber-400 border border-amber-500 px-3 py-1.5 rounded-2xl flex items-center gap-1 shadow-lg shadow-amber-500/20">
              <Sparkles size={10} className="text-amber-900" />
              <span className="text-[10px] font-black text-amber-900">برند برتر</span>
            </div>
          )}
        </div>

        {/* Floating ID / Year */}
        <div className="absolute bottom-4 left-4 bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/20">
          <span className="text-[10px] text-white/90 font-bold">تاسیس {toPersianNum(established)}</span>
        </div>

        {/* Floating Factory Logo Badge */}
        <div className="absolute -bottom-5 right-6 w-14 h-14 bg-white rounded-2xl shadow-xl border-4 border-white flex items-center justify-center text-xl z-20 overflow-hidden ring-1 ring-slate-100">
          {logo && typeof logo === 'string' && (logo.startsWith('http') || logo.startsWith('data:image/') || logo.startsWith('/') || logo.startsWith('.') || logo.includes('.') || logo.includes('/') || logo.includes('%2F')) ? (
            <img 
              src={logo} 
              alt={factory.name} 
              className="w-10 h-10 object-contain rounded-lg p-0.5" 
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const parent = target.parentNode as HTMLElement;
                if (parent && !parent.querySelector('.img-fallback-text')) {
                  const fallback = document.createElement('span');
                  fallback.innerText = '🏭';
                  fallback.className = 'img-fallback-text select-none font-black text-slate-700 text-xl';
                  parent.appendChild(fallback);
                }
              }}
            />
          ) : (
            <span className="select-none font-black text-slate-700 text-xl">{logo || "🏭"}</span>
          )}
        </div>
      </div>

      {/* Main Content Body */}
      <div className="p-6 flex-1 flex flex-col justify-between relative">
        <div className="space-y-4">
          {/* Identity Header */}
          <div className="flex flex-col gap-1.5 pt-1">
            <div className="flex items-center gap-2">
              <h3 
                className="text-sm sm:text-base font-black text-slate-900 hover:text-emerald-700 transition-colors line-clamp-1 flex items-center gap-1.5"
              >
                {factory.name}
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
              </h3>
            </div>

            {/* Prominent Brand Badge */}
            {(() => {
              const bList: string[] = [];
              if (factory.brand) {
                if (typeof factory.brand === 'string') bList.push(factory.brand);
                else if (Array.isArray(factory.brand)) bList.push(...factory.brand);
              }
              if (factory.brandName && typeof factory.brandName === 'string') bList.push(factory.brandName);
              if (factory.brands && Array.isArray(factory.brands)) {
                bList.push(...factory.brands.map((b: any) => typeof b === 'string' ? b : (b.name || '')));
              }
              if (factory.mainProducts && Array.isArray(factory.mainProducts)) bList.push(...factory.mainProducts);
              if (factory.name && typeof factory.name === 'string') {
                const match = factory.name.match(/\(([^)]+)\)/);
                if (match && match[1] && match[1].trim()) bList.unshift(match[1].trim());
              }
              const factoryBrands = Array.from(new Set(bList.map(b => String(b).trim()).filter(Boolean)));
              const primaryBrand = factoryBrands[0] || "برند معتبر کارخانه";
              const brandLogo = factory.brandLogoUrl || b2bConfig?.brands?.find((b: any) => b.name === primaryBrand)?.logoUrl;

              return (
                <div className="flex items-center gap-2 my-0.5">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-900 border border-amber-200/80 text-[10px] font-black shadow-2xs">
                    {brandLogo ? (
                      <img 
                        src={getDisplayImageUrl(brandLogo)} 
                        alt={primaryBrand} 
                        className="w-4 h-4 object-contain rounded-sm"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    ) : (
                      <span>🏷️</span>
                    )}
                    <span>برند: {primaryBrand}</span>
                  </span>
                </div>
              );
            })()}
            
            <div className="flex items-center gap-3 text-[11px] font-bold text-slate-400">
              <div className="flex items-center gap-1 text-emerald-600/80">
                <MapPin size={12} />
                <span>{location}</span>
              </div>
              <div className="w-1 h-1 rounded-full bg-slate-200" />
              <span>کد شناسایی: {toPersianNum(1000 + idx)}</span>
            </div>
          </div>

          {/* Core Description */}
          <div className="space-y-3">
            <p className="text-[11px] text-slate-500 font-medium leading-relaxed line-clamp-2">
              {desc}
            </p>

            {/* Brands Produced Box (Fixed missing branding info) */}
            {factory.mainProducts && factory.mainProducts.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {factory.mainProducts.slice(0, 3).map((brandName: string, i: number) => (
                  <div key={`fact-view-prod-${brandName}-${i}`} className="bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                    <div className="w-1 h-1 rounded-full bg-slate-300" />
                    <span className="text-[9px] font-black text-slate-600">{brandName}</span>
                  </div>
                ))}
                {factory.mainProducts.length > 3 && (
                  <div className="text-[9px] font-bold text-slate-400 self-center">
                    +{toPersianNum(factory.mainProducts.length - 3)} برند دیگر
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Industrial Status Panel */}
          <div className="bg-slate-50/50 border border-slate-100 rounded-3xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[10px] font-black text-slate-600">
                <Zap size={14} className="text-amber-500" />
                <span>بهره‌وری خط تولید:</span>
              </div>
              <span className="text-[10px] font-black text-emerald-700">{factory.id === "fac-1" ? "۹۵٪" : "۸۸٪"} فعال</span>
            </div>
            
            <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                whileInView={{ width: factory.id === "fac-1" ? "95%" : "88%" }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="h-full bg-emerald-500 rounded-full" 
              />
            </div>

            <div className="flex justify-between items-center pt-1">
              <div className="flex items-center gap-1 text-[9px] font-bold text-slate-400">
                <ShieldCheck size={12} className="text-indigo-500" />
                <span>ضمانت اصالت بار</span>
              </div>
              <div className="flex items-center gap-1 text-[9px] font-bold text-slate-400">
                <Truck size={12} className="text-emerald-500" />
                <span>تحویل درب انبار</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Metrics & Actions */}
        <div className="mt-auto pt-4 space-y-4">
          <div className="flex items-center justify-between border-t border-slate-100 pt-4">
            <div className="flex items-center gap-1.5">
              <div className="flex text-amber-400">
                {[...Array(5)].map((_, i) => <Star key={`fact-view-star-${i}`} size={11} fill={i < Math.floor(ratingScore) ? "currentColor" : "none"} />)}
              </div>
              <span className="text-[10px] font-black text-slate-900">{ratingScore.toFixed(1)}</span>
            </div>
            <div className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-2.5 py-0.5 rounded-lg text-[9px] font-black">
              استاندارد ملی فعال
            </div>
          </div>

          <div className="w-full">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOrder(factory.name);
              }}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 rounded-2xl text-[12px] font-black transition-all active:scale-95 cursor-pointer shadow-lg shadow-emerald-500/20"
            >
              <ShoppingBag size={16} />
              <span>ثبت سفارش مستقیم از درب کارخانه</span>
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
});

export default function FactoriesView({ 
  factories = [], 
  products = [],
  b2bConfig,
  onSelectFactoryForOrder,
  onSelectProductForOrder,
  initialFactoryId,
  theme = 'light',
  userBadge,
  user
}: FactoriesViewProps) {
  // Main Sub-Tab State: 'factories' | 'raw_materials' | 'services'
  const [activeSubTab, setActiveSubTab] = useState<'factories' | 'raw_materials' | 'services'>('factories');

  // Dedicated Factory Full-Page state
  const [selectedDedicatedFactory, setSelectedDedicatedFactory] = useState<FactoryProfile | null>(null);

  // Auto-open dedicated factory page if initialFactoryId prop provided
  useEffect(() => {
    if (initialFactoryId && factories.length > 0) {
      const match = factories.find(f => f.id === initialFactoryId || f.name === initialFactoryId);
      if (match) {
        setSelectedDedicatedFactory(match as FactoryProfile);
      }
    }
  }, [initialFactoryId, factories]);

  // Factory Filter States
  const [selectedCategory, setSelectedCategory] = useState("همه صنایع");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFactoryModal, setSelectedFactoryModal] = useState<FactoryItem | null>(null);

  // Raw Materials States with persistence
  const [rawMaterialsList, setRawMaterialsList] = useState<RawMaterial[]>(() => {
    try {
      const saved = localStorage.getItem("dastavval_raw_materials");
      return saved ? JSON.parse(saved) : INITIAL_RAW_MATERIALS;
    } catch (e) {
      return INITIAL_RAW_MATERIALS;
    }
  });

  const [suppliersList, setSuppliersList] = useState<RawMaterialSupplier[]>(() => {
    try {
      const saved = localStorage.getItem("dastavval_raw_suppliers");
      return saved ? JSON.parse(saved) : INITIAL_RAW_SUPPLIERS;
    } catch (e) {
      return INITIAL_RAW_SUPPLIERS;
    }
  });

  const [selectedRawCategory, setSelectedRawCategory] = useState("همه مواد اولیه");
  const [searchRawQuery, setSearchRawQuery] = useState("");

  // Industrial & Commercial Services States with persistence
  const [servicesList, setServicesList] = useState<IndustrialServiceItem[]>(() => {
    try {
      const saved = localStorage.getItem("dastavval_industrial_services");
      return saved ? JSON.parse(saved) : INITIAL_INDUSTRIAL_SERVICES;
    } catch (e) {
      return INITIAL_INDUSTRIAL_SERVICES;
    }
  });

  const [selectedServiceCategory, setSelectedServiceCategory] = useState("همه خدمات صنعتی");
  const [searchServiceQuery, setSearchServiceQuery] = useState("");
  const [targetService, setTargetService] = useState<IndustrialServiceItem | null>(null);
  const [showOrderServiceModal, setShowOrderServiceModal] = useState(false);
  const [showAddServiceModal, setShowAddServiceModal] = useState(false);

  // New Service Form State
  const [newSrvTitle, setNewSrvTitle] = useState("");
  const [newSrvCat, setNewSrvCat] = useState("طراحی صنعتی و بسته‌بندی");
  const [newSrvProvider, setNewSrvProvider] = useState("");
  const [newSrvLocation, setNewSrvLocation] = useState("");
  const [newSrvPhone, setNewSrvPhone] = useState("");
  const [newSrvRate, setNewSrvRate] = useState("");
  const [newSrvDays, setNewSrvDays] = useState("۳ تا ۷ روز کاری");
  const [newSrvCapabilities, setNewSrvCapabilities] = useState("");
  const [newSrvDesc, setNewSrvDesc] = useState("");
  const [srvSuccessMsg, setSrvSuccessMsg] = useState("");
  const [uploadedSrvImageBase64, setUploadedSrvImageBase64] = useState<string | null>(null);

  // Service Order Request State
  const [reqFactoryName, setReqFactoryName] = useState("");
  const [reqContactPhone, setReqContactPhone] = useState("");
  const [reqCity, setReqCity] = useState("");
  const [reqDetails, setReqDetails] = useState("");
  const [serviceOrderSubmittedCode, setServiceOrderSubmittedCode] = useState<string | null>(null);

  // New Raw Material Form States (Selling Panel)
  const [showAddRawMaterialModal, setShowAddRawMaterialModal] = useState(false);
  const [newMatName, setNewMatName] = useState("");
  const [newMatCat, setNewMatCat] = useState("مواد اولیه شیرینی و شکلات");
  const [newMatPrice, setNewMatPrice] = useState("");
  const [newMatMinOrder, setNewMatMinOrder] = useState("");
  const [newMatDeliveryDays, setNewMatDeliveryDays] = useState("۳ روز کاری");
  const [newMatSpecs, setNewMatSpecs] = useState("");
  const [newMatDesc, setNewMatDesc] = useState("");
  const [newMatSupName, setNewMatSupName] = useState("");
  const [newMatSupLocation, setNewMatSupLocation] = useState("");
  const [newMatPhone, setNewMatPhone] = useState("");
  const [newMatImageUrl, setNewMatImageUrl] = useState("");
  const [uploadedImageBase64, setUploadedImageBase64] = useState<string | null>(null);
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const [matSuccessMsg, setMatSuccessMsg] = useState("");

  const handleImageFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("لطفاً فقط فایل تصویر معتبر انتخاب کنید.");
      return;
    }
    const result = await uploadToParsPackStorage(file, "factories");
    if (result.success && result.url) {
      setUploadedImageBase64(result.url);
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result && typeof e.target.result === "string") {
          setUploadedImageBase64(e.target.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle Submit Raw Material For Sale
  const handleRegisterRawMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMatName.trim() || !newMatSupName.trim() || !newMatPrice.trim()) return;

    const sampleImages: Record<string, string> = {
      "مواد اولیه شیرینی و شکلات": "https://images.unsplash.com/photo-1622484211148-716598e09141?auto=format&fit=crop&w=400&q=80",
      "آرد و غلات صنعتی": "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=400&q=80",
      "روغن و چربی‌های تخصصی": "https://images.unsplash.com/photo-1548907040-4d42b52125ca?auto=format&fit=crop&w=400&q=80",
      "بسته‌بندی و ملزومات چاپ": "https://images.unsplash.com/photo-1607344645866-009c320c5ab8?auto=format&fit=crop&w=400&q=80",
      "کنسروجات و عصاره‌های صنعتی": "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=400&q=80",
      "پودرهای لبنی و افزودنی": "https://images.unsplash.com/photo-1553456558-aff63285bdd1?auto=format&fit=crop&w=400&q=80"
    };

    const newMat: RawMaterial = {
      id: `raw-${Date.now()}`,
      name: newMatName.trim(),
      category: newMatCat,
      supplierName: newMatSupName.trim(),
      supplierLocation: newMatSupLocation.trim() || "ایران",
      unit: "تن",
      minOrder: newMatMinOrder.trim() || "۱ تن",
      priceEstimate: newMatPrice.trim(),
      deliveryDays: newMatDeliveryDays.trim(),
      specs: newMatSpecs ? newMatSpecs.split("،").map(s => s.trim()) : ["تایید کیفیت آزمایشگاهی", "ضمانت امانی دست‌اول"],
      description: newMatDesc.trim() || "تامین مستقیم ماده اولیه با تضمین کیفیت و تسویه حساب امانی امن دست‌اول.",
      imageUrl: uploadedImageBase64 || newMatImageUrl.trim() || sampleImages[newMatCat] || "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800",
      isVerified: false,
      isPendingApproval: true,
      escrowGuaranteed: true
    };

    const updated = [newMat, ...rawMaterialsList];
    setRawMaterialsList(updated);
    try {
      localStorage.setItem("dastavval_raw_materials", JSON.stringify(updated));
    } catch (err) {}

    const exists = suppliersList.some(s => s.companyName.toLowerCase() === newMatSupName.trim().toLowerCase());
    if (!exists) {
      const newSup: RawMaterialSupplier = {
        id: `sup-${Date.now()}`,
        companyName: newMatSupName.trim(),
        category: newMatCat,
        location: newMatSupLocation.trim() || "ایران",
        contactPhone: newMatPhone.trim() || "۰۲۱",
        establishedYear: 1405,
        mainProducts: [newMatName.trim()],
        description: `تامین‌کننده تایید شده ماده اولیه ${newMatName.trim()} با ضمانت امانی دست‌اول.`,
        isVerified: true,
        rating: 5,
        logoUrl: "https://images.unsplash.com/photo-1581441363689-1f3c3c414635?auto=format&fit=crop&w=200&q=80"
      };
      const updatedSups = [newSup, ...suppliersList];
      setSuppliersList(updatedSups);
      try {
        localStorage.setItem("dastavval_raw_suppliers", JSON.stringify(updatedSups));
      } catch (err) {}
    }

    setMatSuccessMsg("محصول شما با موفقیت ثبت شد و در وضعیت در انتظار بررسی و تایید فنی دست‌اول قرار گرفت. معامله پس از ممیزی تحت پرداخت امن امانی دست‌اول فعال خواهد شد.");
    setTimeout(() => {
      setShowAddRawMaterialModal(false);
      setMatSuccessMsg("");
      setNewMatName("");
      setNewMatPrice("");
      setNewMatMinOrder("");
      setNewMatSpecs("");
      setNewMatDesc("");
      setNewMatSupName("");
      setNewMatSupLocation("");
      setNewMatPhone("");
      setNewMatImageUrl("");
      setUploadedImageBase64(null);
    }, 4000);
  };

  // Order Raw Material Modal (RFQ) State
  const [showOrderRawModal, setShowOrderRawModal] = useState(false);
  const [targetRawMaterial, setTargetRawMaterial] = useState<RawMaterial | null>(null);
  const [buyerFactoryName, setBuyerFactoryName] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [buyerQty, setBuyerQty] = useState("");
  const [buyerCity, setBuyerCity] = useState("");
  const [buyerNotes, setBuyerNotes] = useState("");
  const [submittedOrderCode, setSubmittedOrderCode] = useState<string | null>(null);

  // Register New Supplier Modal State
  const [showAddSupplierModal, setShowAddSupplierModal] = useState(false);
  const [newSupName, setNewSupName] = useState("");
  const [newSupCat, setNewSupCat] = useState("تامین‌کننده مواد اولیه غذایی");
  const [newSupLocation, setNewSupLocation] = useState("");
  const [newSupPhone, setNewSupPhone] = useState("");
  const [newSupProducts, setNewSupProducts] = useState("");
  const [newSupDesc, setNewSupDesc] = useState("");
  const [supSuccessMsg, setSupSuccessMsg] = useState("");

  // Real-time trackable views and reviews map
  const [viewsMap, setViewsMap] = useState<Record<string, number>>({});
  const [reviewsMap, setReviewsMap] = useState<Record<string, FactoryReviewItem[]>>(INITIAL_REVIEWS);

  // Review Modal state
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newReviewerName, setNewReviewerName] = useState("");
  const [newReviewerCity, setNewReviewerCity] = useState("");
  const [newRating, setNewRating] = useState(5);
  const [newQuality, setNewQuality] = useState(5);
  const [newPackaging, setNewPackaging] = useState(5);
  const [newDelivery, setNewDelivery] = useState(5);
  const [newComment, setNewComment] = useState("");

  // Fallback to b2bConfig factories if available, with dynamic merging of registered factory profiles
  const allFactories: FactoryItem[] = useMemo(() => {
    const list = factories.length > 0 ? factories : (b2bConfig?.factories || []);
    try {
      const localUsers = JSON.parse(localStorage.getItem("dastavval_local_users") || "{}");
      const localUsersList = Object.values(localUsers).filter((u: any) => u.userRole === 'factory' || u.role === 'factory' || u.status === 'active');
      
      return list.map((f: any) => {
        // Find matching local user by factoryCode, id, or company name
        const matchingUser = localUsersList.find((u: any) => 
          u.factoryCode === f.factoryCode || 
          u.id === f.id || 
          (u.company && f.name && u.company.trim().toLowerCase() === f.name.trim().toLowerCase()) ||
          (u.name && f.name && u.name.trim().toLowerCase() === f.name.trim().toLowerCase())
        ) as any;

        if (matchingUser) {
          const extPhoto = matchingUser.factoryExteriorPhoto || matchingUser.coverUrl;
          const prodPhoto = matchingUser.productionLinePhoto;
          const whPhoto = matchingUser.warehousePhoto;
          const certPhoto = matchingUser.certificatesPhoto;
          
          const builtGallery = [];
          if (extPhoto) builtGallery.push({ url: extPhoto, title: "عکس محوطه و نمای کارخانه", category: "exterior" as const });
          if (prodPhoto) builtGallery.push({ url: prodPhoto, title: "خط تولید و ماشین‌آلات", category: "production" as const });
          if (whPhoto) builtGallery.push({ url: whPhoto, title: "انبار مرکزی و نگهداری کالا", category: "warehouse" as const });
          if (certPhoto) builtGallery.push({ url: certPhoto, title: "ایزوها و گواهینامه‌ها", category: "lab" as const });

          return {
            ...f,
            name: matchingUser.company || matchingUser.name || f.name,
            location: matchingUser.city || f.location || f.city,
            city: matchingUser.city || f.city,
            phone: matchingUser.phone || f.phone,
            logoUrl: matchingUser.logoUrl || f.logoUrl,
            coverUrl: extPhoto || f.coverUrl,
            description: matchingUser.factoryDescription || matchingUser.description || f.description,
            establishedYear: matchingUser.establishedYear || f.establishedYear,
            capacity: matchingUser.dailyCapacity || f.capacity,
            specs: matchingUser.productionTech ? [matchingUser.productionTech] : (f.specs || []),
            galleryImages: builtGallery.length > 0 ? builtGallery : (f.galleryImages || []),
            // Keep direct property links too so FactoryDedicatedPage can read them easily
            factoryExteriorPhoto: matchingUser.factoryExteriorPhoto,
            productionLinePhoto: matchingUser.productionLinePhoto,
            warehousePhoto: matchingUser.warehousePhoto,
            certificatesPhoto: matchingUser.certificatesPhoto,
            factoryDescription: matchingUser.factoryDescription,
            dailyCapacity: matchingUser.dailyCapacity,
            healthLicense: matchingUser.healthLicense,
            factoryHealthLicense: matchingUser.factoryHealthLicense
          };
        }
        return f;
      });
    } catch (e) {
      console.warn("Could not merge local factory users:", e);
      return list;
    }
  }, [factories, b2bConfig?.factories]);

  // Open modal and track view count
  const handleOpenFactoryModal = (factory: FactoryItem) => {
    setSelectedFactoryModal(factory);
    setViewsMap(prev => ({
      ...prev,
      [factory.id]: (prev[factory.id] || factory.viewsCount || 1250) + 1
    }));
  };

  // Submit review logic
  const handleAddReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFactoryModal || !newReviewerName.trim() || !newComment.trim()) return;

    const newRev: FactoryReviewItem = {
      id: `rev-${Date.now()}`,
      userName: newReviewerName.trim(),
      userCity: newReviewerCity.trim() || "بنکدار همکار",
      rating: newRating,
      qualityRating: newQuality,
      packagingRating: newPackaging,
      deliveryRating: newDelivery,
      comment: newComment.trim(),
      createdAt: new Date().toLocaleDateString('fa-IR'),
      isVerifiedBuyer: true
    };

    const targetId = selectedFactoryModal.id;
    setReviewsMap(prev => ({
      ...prev,
      [targetId]: [newRev, ...(prev[targetId] || prev['default'] || [])]
    }));

    setShowReviewForm(false);
    setNewReviewerName("");
    setNewReviewerCity("");
    setNewComment("");
  };

  // Handle Order Raw Material Form Submit
  const handleOrderRawSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!buyerFactoryName.trim() || !buyerPhone.trim() || !buyerQty.trim()) return;

    const orderCode = `RFQ-${Math.floor(1000 + Math.random() * 9000)}`;
    const newOrder = {
      id: orderCode,
      materialName: targetRawMaterial ? targetRawMaterial.name : "درخواست عمومی مواد اولیه",
      supplierName: targetRawMaterial ? targetRawMaterial.supplierName : "ارسال به کلیه تامین‌کنندگان",
      buyerFactoryName: buyerFactoryName.trim(),
      buyerPhone: buyerPhone.trim(),
      buyerQty: buyerQty.trim(),
      buyerCity: buyerCity.trim() || "تعیین نشده",
      buyerNotes: buyerNotes.trim(),
      createdAt: new Date().toLocaleDateString('fa-IR'),
      status: "در حال بررسی و قیمت‌دهی تامین‌کننده"
    };

    // Save in localStorage for persistence
    try {
      const saved = JSON.parse(localStorage.getItem("dastavval_raw_orders") || "[]");
      saved.unshift(newOrder);
      localStorage.setItem("dastavval_raw_orders", JSON.stringify(saved));
    } catch (e) {}

    setSubmittedOrderCode(orderCode);
    setBuyerNotes("");
  };

  // Handle Register Supplier Form Submit
  const handleRegisterSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSupName.trim() || !newSupPhone.trim()) return;

    const newSup: RawMaterialSupplier = {
      id: `sup-${Date.now()}`,
      companyName: newSupName.trim(),
      category: newSupCat,
      location: newSupLocation.trim() || "ایران",
      contactPhone: newSupPhone.trim(),
      establishedYear: 1400,
      mainProducts: newSupProducts ? newSupProducts.split("،").map(p => p.trim()) : ["مواد اولیه تخصصی"],
      description: newSupDesc.trim() || "تامین‌کننده تاییدشده مواد اولیه در سامانه دست‌اول.",
      isVerified: true,
      rating: 5,
      logoUrl: "https://images.unsplash.com/photo-1581441363689-1f3c3c414635?auto=format&fit=crop&w=200&q=80"
    };

    setSuppliersList(prev => [newSup, ...prev]);
    setSupSuccessMsg("شرکت شما با موفقیت به عنوان تامین‌کننده مواد اولیه ثبت گردید.");
    setTimeout(() => {
      setShowAddSupplierModal(false);
      setSupSuccessMsg("");
      setNewSupName("");
      setNewSupPhone("");
      setNewSupLocation("");
      setNewSupProducts("");
      setNewSupDesc("");
    }, 2000);
  };

  // Filter factories
  const filteredFactories = (allFactories || []).filter(fac => {
    if (!fac) return false;
    const facCat = fac.category || "سایر صنایع";
    const facName = fac.name || "";
    const matchesCategory = selectedCategory === "همه صنایع" || facCat === selectedCategory || (
      selectedCategory === "تنقلات و شکلات" && (facName.includes("شکلات") || facName.includes("چیپس") || facName.includes("پفک"))
    ) || (
      selectedCategory === "کیک، کلوچه و بیسکویت" && (facName.includes("کیک") || facName.includes("کلوچه") || facName.includes("بیسکویت"))
    ) || (
      selectedCategory === "نوشیدنی و آبمیوه" && (facName.includes("آبمیوه") || facName.includes("نوشابه") || facName.includes("سن‌ایچ"))
    );

    const q = searchQuery.trim().toLowerCase();
    const matchesSearch = !q || (
      facName.toLowerCase().includes(q) ||
      (fac.location && fac.location.toLowerCase().includes(q)) ||
      (fac.description && fac.description.toLowerCase().includes(q)) ||
      (fac.desc && fac.desc.toLowerCase().includes(q)) ||
      (fac.mainProducts && Array.isArray(fac.mainProducts) && fac.mainProducts.some(p => typeof p === 'string' && p.toLowerCase().includes(q)))
    );

    return matchesCategory && matchesSearch;
  });

  // SORTING RULE: Featured / Pinned / Premium factories ALWAYS come FIRST
  const sortedFactories = [...filteredFactories].sort((a, b) => {
    if (!a || !b) return 0;
    const aFeatured = (a.isFeatured || a.isPinned || a.isPremium) ? 1 : 0;
    const bFeatured = (b.isFeatured || b.isPinned || b.isPremium) ? 1 : 0;
    if (bFeatured !== aFeatured) return bFeatured - aFeatured;

    const aViews = (a.id && viewsMap[a.id]) || a.viewsCount || 1000;
    const bViews = (b.id && viewsMap[b.id]) || b.viewsCount || 1000;
    return bViews - aViews;
  });

  // Filter Raw Materials
  const filteredRawMaterials = rawMaterialsList.filter(mat => {
    const matchesCategory = selectedRawCategory === "همه مواد اولیه" || mat.category === selectedRawCategory;
    const q = searchRawQuery.trim().toLowerCase();
    const matchesSearch = !q || (
      mat.name.toLowerCase().includes(q) ||
      mat.supplierName.toLowerCase().includes(q) ||
      mat.description.toLowerCase().includes(q)
    );
    return matchesCategory && matchesSearch;
  });

  // Filter Industrial Services
  const filteredServices = servicesList.filter(srv => {
    const matchesCategory = selectedServiceCategory === "همه خدمات صنعتی" || srv.category === selectedServiceCategory;
    const q = searchServiceQuery.trim().toLowerCase();
    const matchesSearch = !q || (
      srv.title.toLowerCase().includes(q) ||
      srv.providerName.toLowerCase().includes(q) ||
      srv.description.toLowerCase().includes(q) ||
      srv.location.toLowerCase().includes(q)
    );
    return matchesCategory && matchesSearch;
  });

  // Handle Register Industrial Service
  const handleRegisterService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSrvTitle.trim() || !newSrvProvider.trim()) return;

    const sampleSrvImages: Record<string, string> = {
      "طراحی صنعتی و بسته‌بندی": "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=500&q=80",
      "ترخیص کالا و امور گمرکی": "https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=500&q=80",
      "تبلیغات، برندینگ و مارکتینگ": "https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=500&q=80",
      "حسابداری، حسابرسی و مالیات": "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=500&q=80",
      "آزمایشگاه و کنترل کیفیت": "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=500&q=80",
      "حمل‌ونقل، لجستیک و ترانزیت": "https://images.unsplash.com/photo-1519003722824-194d4455a60c?auto=format&fit=crop&w=500&q=80"
    };

    const newSrv: IndustrialServiceItem = {
      id: `srv-${Date.now()}`,
      title: newSrvTitle.trim(),
      category: newSrvCat,
      providerName: newSrvProvider.trim(),
      location: newSrvLocation.trim() || "ایران",
      rating: 5.0,
      deliveryDays: newSrvDays.trim(),
      rate: newSrvRate.trim() || "توافقی با فاکتور رسمی",
      description: newSrvDesc.trim() || "ارائه خدمات تخصصی خطوط تولید و کارخانجات با تضمین کیفیت و واسطه‌گری امن دست‌اول.",
      capabilities: newSrvCapabilities ? newSrvCapabilities.split("،").map(c => c.trim()) : ["تضمین کیفیت خدمات", "نظارت مستقیم کارشناس پلتفرم"],
      imageUrl: uploadedSrvImageBase64 || sampleSrvImages[newSrvCat] || "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=500&q=80",
      isPendingApproval: true
    };

    const updated = [newSrv, ...servicesList];
    setServicesList(updated);
    try {
      localStorage.setItem("dastavval_industrial_services", JSON.stringify(updated));
    } catch (err) {}

    setSrvSuccessMsg("خدمت شما با موفقیت ثبت شد و پس از بررسی مدارک و تایید کارشناس ناظر دست‌اول در تالار خدمات صنعتی منتشر خواهد شد.");
    setTimeout(() => {
      setShowAddServiceModal(false);
      setSrvSuccessMsg("");
      setNewSrvTitle("");
      setNewSrvProvider("");
      setNewSrvLocation("");
      setNewSrvPhone("");
      setNewSrvRate("");
      setNewSrvCapabilities("");
      setNewSrvDesc("");
      setUploadedSrvImageBase64(null);
    }, 3500);
  };

  // Handle Order / RFQ for Industrial Service
  const handleOrderServiceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqFactoryName.trim() || !reqContactPhone.trim()) return;

    const trackingCode = `SRV-REQ-${Math.floor(100000 + Math.random() * 900000)}`;
    setServiceOrderSubmittedCode(trackingCode);
  };

  // Helper for rendering 5 stars
  const renderStars = (rating: number = 5) => {
    return <StarRating rating={rating} size={14} interactive={true} showScore={true} />;
  };

  return (
    <div className="space-y-8 pb-16 text-right font-sans" dir="rtl">
      {/* Streamlined Responsive Header Card (White Theme) */}
      <div className="relative overflow-hidden bg-white text-slate-900 rounded-[2rem] p-5 sm:p-7 shadow-md border border-slate-200/90 space-y-4">
        {/* Subtle Ambient Glow accents */}
        <div className="absolute -top-20 -left-20 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-60 h-60 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            {b2bConfig?.logoUrl ? (
              <img 
                src={b2bConfig.logoUrl} 
                alt={b2bConfig.appName || "دست اول"} 
                className="w-16 h-16 object-contain bg-white p-2 rounded-2xl border border-slate-200/60 shrink-0 shadow-xs"
              />
            ) : (
              <DastavvalLogo size={52} showText={false} className="flex bg-slate-50 p-2.5 rounded-2xl border border-slate-200/60 shrink-0 shadow-xs" />
            )}
            <div className="space-y-1.5 max-w-2xl">
              <div className="inline-flex items-center gap-1.5 bg-amber-50 border border-amber-200/90 px-3 py-1 rounded-full text-[10px] font-black text-amber-900 shadow-2xs">
                <Award size={13} className="text-amber-600" />
                <span>ارتباط مستقیم بنکداران، کارخانجات و زنجیره خدمات تولید</span>
              </div>
              <h1 className="text-lg sm:text-2xl font-black text-slate-900 leading-snug">
                سامانه کارخانجات، مواد اولیه و خدمات صنعتی
              </h1>
              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                خرید مستقیم به قیمت درب کارخانه، تامین مطمئن مواد اولیه و سفارش خدمات طراحی، ترخیص گمرکی، تبلیغات و حسابداری با واسطه‌گری امن دست‌اول
              </p>
            </div>
          </div>

          {/* Clean Segmented Sub-Tab Switcher - Light Background */}
          <div className="w-full lg:w-auto flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200/80 overflow-x-auto custom-scrollbar shrink-0">
            <button
              onClick={() => setActiveSubTab('factories')}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeSubTab === 'factories'
                  ? "bg-amber-400 text-slate-950 shadow-sm shadow-amber-400/20 font-black"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
              }`}
            >
              <Factory size={14} />
              <span>کارخانجات ({toPersianNum(allFactories.length)})</span>
            </button>

            <button
              onClick={() => setActiveSubTab('raw_materials')}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeSubTab === 'raw_materials'
                  ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/20 font-black"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
              }`}
            >
              <Boxes size={14} />
              <span>مواد اولیه ({toPersianNum(rawMaterialsList.length)})</span>
            </button>

            <button
              onClick={() => setActiveSubTab('services')}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeSubTab === 'services'
                  ? "bg-teal-600 text-white shadow-sm shadow-teal-600/20 font-black"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
              }`}
            >
              <Briefcase size={14} />
              <span>خدمات صنعتی ({toPersianNum(servicesList.length)})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Dedicated Notification Banner for Logged-in Factory Users */}
      {user?.role === 'factory' && (
        <div className="bg-indigo-50/90 border border-indigo-200 rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3.5 text-right">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center text-2xl shrink-0 shadow-sm">
              🏭
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-indigo-950">حساب کارخانه شما فعال است: {user.company || user.name}</h3>
                <span className="text-[10px] bg-indigo-600 text-white px-2.5 py-0.5 rounded-full font-black">واحد تولیدی رسمی</span>
              </div>
              <p className="text-xs text-indigo-800 font-medium mt-1">
                شما به عنوان واحد تولیدی در پلتفرم دست‌اول ثبت شده‌اید و نیازی به ثبت‌نام مجدد ندارید. برای ثبت کالای جدید و مدیریت خط تولید وارد پنل شوید.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              window.dispatchEvent(new CustomEvent("change-nav-tab", { detail: { tab: 'user' } }));
            }}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-xs transition-all shadow-sm shrink-0 flex items-center gap-2 cursor-pointer"
          >
            <span>ورود به پنل مدیریت کارخانه</span>
            <ArrowLeft size={14} />
          </button>
        </div>
      )}

      {/* SUB-TAB 1: FACTORIES DIRECTORY */}
      {activeSubTab === 'factories' && (
        <div className="space-y-6">
          {/* Category Filter Tabs & Search Bar */}
          <div className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-[0_8px_30px_rgba(0,0,0,0.02)] space-y-4 text-right" dir="rtl">
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-6 rounded-full bg-emerald-650 animate-pulse" />
                  <h2 className="text-sm sm:text-base font-black text-slate-900">رصد هوشمند خطوط ترانزیت و تولیدکنندگان فعال صنایع غذایی</h2>
                </div>
                <p className="text-[10px] text-slate-400 font-bold leading-relaxed">
                  پایش زنده کارخانجات فعال، رهگیری پلمپ جاده‌ای و ثبت فاکتورهای رسمی در بستر شبکه یکپارچه دست‌اول.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                {/* Live Active Factories Counter Card */}
                <div className="bg-slate-50 border border-slate-100/80 px-4 py-2 rounded-2xl flex items-center justify-between gap-4 shrink-0">
                  <div className="space-y-0.5">
                    <span className="text-[8px] text-slate-400 font-bold block">تعداد کارخانجات پورتال:</span>
                    <span className="text-xs font-black text-slate-800">{toPersianNum(sortedFactories.length)} واحد فعال</span>
                  </div>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping shrink-0" />
                </div>

                <div className="relative w-full sm:w-72">
                  <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="جستجوی نام کارخانه، شهر یا کالا..."
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl pr-10 pl-4 py-3 text-xs font-black focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white focus:border-emerald-500 shadow-2xs transition-all text-slate-800"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery("")}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Separator */}
            <div className="border-t border-slate-100 pt-3 flex flex-wrap items-center gap-2">
              <span className="text-[9px] text-slate-400 font-black shrink-0">صنایع تحت پایش:</span>
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none flex-1">
              {(() => {
                // Determine categories from config or defaults
                let dynamicCats: string[] = [];
                if (b2bConfig?.categories && b2bConfig.categories.length > 0) {
                  dynamicCats = b2bConfig.categories.map((c: any) => typeof c === 'string' ? c : (c.name || c.id));
                } else {
                  // Fallback to distinct categories from existing factories
                  dynamicCats = Array.from(new Set(allFactories.map((f: any) => f.category).filter(Boolean)));
                }
                
                // Ensure default fallback categories if still empty
                if (dynamicCats.length === 0) {
                  dynamicCats = ["تنقلات و شکلات", "کیک، کلوچه و بیسکویت", "نوشیدنی و آبمیوه", "مواد غذایی و کنسروجات"];
                }

                const catsToRender = ["همه صنایع", ...dynamicCats];
                
                return catsToRender.map((cat, idx) => {
                  const isSelected = selectedCategory === cat;
                  return (
                    <button
                      key={`fact-cat-btn-${cat}-${idx}`}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-4 py-2 rounded-2xl text-xs font-black transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                        isSelected
                          ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 scale-105"
                          : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <span>{cat}</span>
                    </button>
                  );
                });
              })()}
              </div>
            </div>
          </div>

          {/* Factory List Grid */}
          {sortedFactories.length === 0 ? (
            <div className="bg-white rounded-[2.5rem] border border-dashed border-slate-200 p-12 text-center space-y-4 shadow-sm">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                <Factory size={32} />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-black text-slate-800">کارخانه‌ای با این مشخصات یافت نشد</h3>
                <p className="text-xs text-slate-400 font-bold max-w-md mx-auto">
                  تولیدکنندگان جدید پس از احراز هویت توسط مدیریت ثبت خواهند شد. می‌توانید فیلتر دسته‌بندی را تغییر دهید.
                </p>
              </div>
              <button
                onClick={() => { setSelectedCategory("همه صنایع"); setSearchQuery(""); }}
                className="px-5 py-2.5 bg-indigo-600 text-white text-xs font-black rounded-xl hover:bg-indigo-700 transition-all shadow-md shadow-indigo-600/20 cursor-pointer"
              >
                نمایش همه کارخانه‌ها
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 pb-10">
              {sortedFactories.map((factory, idx) => (
                <LazyViewport key={`fact-view-card-${factory.id || idx}-${idx}`} height="480px">
                  <FactoryCard 
                    factory={factory} 
                    idx={idx} 
                    b2bConfig={b2bConfig}
                    onSelect={(f) => setSelectedDedicatedFactory(f as FactoryProfile)} 
                    onOrder={(name) => {
                      if (onSelectFactoryForOrder) {
                        onSelectFactoryForOrder(name);
                      }
                    }} 
                  />
                </LazyViewport>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 2: RAW MATERIALS CATALOG (مواد اولیه و ملزومات تولید) */}
      {activeSubTab === 'raw_materials' && (
        <div className="space-y-6">
          {/* Top Info Banner & Request Custom Raw Material CTA (White Theme) */}
          <div className="relative overflow-hidden bg-white rounded-[2.5rem] p-6 text-slate-900 border border-slate-200 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-6">
            {/* Subtle Ambient Glow accents */}
            <div className="absolute -top-10 -left-10 w-40 h-40 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

            <div className="space-y-2 max-w-2xl relative z-10">
              <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full text-[11px] font-black text-emerald-700">
                <Boxes size={14} className="text-emerald-600" />
                <span>تامین مستقیم مواد اولیه کارخانجات تولیدی</span>
              </div>
              <h2 className="text-xl font-black text-slate-900">
                سامانه تامین شکر، آرد، روغن، کاکائو، سلفون و ملزومات خطوط تولید
              </h2>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                کارخانجات می‌توانند مواد اولیه مورد نیاز خطوط تولید خود را مستقیماً از تامین‌کنندگان معتبر استعلام و سفارش دهند.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto shrink-0 relative z-10">
              <button
                onClick={() => {
                  setTargetRawMaterial(null);
                  setShowOrderRawModal(true);
                }}
                className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black px-5 py-3.5 rounded-2xl text-xs transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Send size={14} />
                <span>✍️ استعلام خرید مواد اولیه (RFQ)</span>
              </button>

              <button
                onClick={() => {
                  setShowAddRawMaterialModal(true);
                }}
                className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black px-5 py-3.5 rounded-2xl text-xs transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                <PlusCircle size={14} />
                <span>📦 فروش ماده اولیه (ضمانت امانی دست‌اول)</span>
              </button>
            </div>
          </div>

          {/* Search & Category Filter */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-7 rounded-full bg-amber-500" />
                <h3 className="text-lg font-black text-slate-900">کاتالوگ مواد اولیه و افزودنی‌های تولید</h3>
              </div>

              <div className="relative w-full sm:w-80">
                <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="text"
                  value={searchRawQuery}
                  onChange={(e) => setSearchRawQuery(e.target.value)}
                  placeholder="جستجوی شکر، آرد، کاکائو، سلفون..."
                  className="w-full bg-white border border-slate-200 rounded-2xl pr-10 pl-4 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-sm"
                />
              </div>
            </div>

            {/* Category Filter Chips */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              {RAW_MATERIAL_CATEGORIES.map((cat, idx) => (
                <button
                  key={`fact-raw-cat-${cat}-${idx}`}
                  onClick={() => setSelectedRawCategory(cat)}
                  className={`px-4 py-2 rounded-2xl text-xs font-black transition-all shrink-0 cursor-pointer ${
                    selectedRawCategory === cat
                      ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                      : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Raw Materials Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRawMaterials.map((mat, mIdx) => (
              <motion.div
                key={`fact-raw-mat-${mat.id || mIdx}-${mIdx}`}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-[2.5rem] border border-slate-200/80 p-6 space-y-4 hover:border-emerald-400 hover:shadow-xl transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="relative h-44 rounded-2xl overflow-hidden bg-slate-100 border border-slate-100">
                    <img src={getDisplayImageUrl(mat.imageUrl)} alt={mat.name} className="w-full h-full object-cover" />
                    <span className="absolute top-3 right-3 bg-white/90 backdrop-blur-md text-amber-600 font-black text-[10px] px-3 py-1 rounded-full border border-amber-200">
                      {mat.category}
                    </span>

                    {/* Dastavval Verification / Pending Badges Overlay */}
                    {mat.isPendingApproval ? (
                      <span className="absolute bottom-3 right-3 bg-amber-500/95 backdrop-blur-md text-slate-950 font-black text-[9px] px-2.5 py-1 rounded-lg border border-amber-400 flex items-center gap-1 shadow-sm">
                        <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-ping" />
                        ⏳ در انتظار بررسی و تایید دست‌اول
                      </span>
                    ) : (
                      <span className="absolute bottom-3 right-3 bg-emerald-600/95 backdrop-blur-md text-white font-black text-[9px] px-2.5 py-1 rounded-lg border border-emerald-400 flex items-center gap-1 shadow-sm">
                        <CheckCircle2 size={10} className="text-emerald-300" />
                        ✓ تایید رسمی دست‌اول
                      </span>
                    )}
                  </div>

                  <div>
                    <h4 className="text-sm font-black text-slate-900 leading-snug">
                      {mat.name}
                    </h4>
                    <p className="text-[11px] text-slate-500 font-bold mt-1">
                      تامین‌کننده: <span className="text-slate-800 font-black">{mat.supplierName}</span> ({mat.supplierLocation})
                    </p>
                  </div>

                  {/* Escrow Guarantee Badge */}
                  <div className="flex flex-col gap-1.5 bg-indigo-50 border border-indigo-100/60 p-2.5 rounded-xl text-[9px] font-black text-indigo-900 shadow-3xs">
                    <div className="flex items-center gap-1.5">
                      <ShieldCheck size={13} className="text-indigo-600 shrink-0" />
                      <span>پرداخت امن امانی دست‌اول (تسویه پس از تایید آنالیز و تخلیه بار)</span>
                    </div>
                    {mat.isPendingApproval ? (
                      <p className="text-[8px] text-amber-700 font-bold leading-normal border-t border-indigo-100/40 pt-1">
                        ⚠️ این کالا جدید است و ممیزی فنی آن در جریان است. معامله تحت حفاظت کامل حساب امانی دست‌اول انجام خواهد شد.
                      </p>
                    ) : (
                      <p className="text-[8px] text-indigo-700/80 font-bold leading-normal border-t border-indigo-100/40 pt-1 font-medium">
                        ✓ آنالیز فنی، پروانه ساخت و هویت حقوقی تامین‌کننده توسط واحد بازرسی دست‌اول ممیزی و تایید نهایی شده است.
                      </p>
                    )}
                  </div>

                  <p className="text-xs text-slate-600 font-medium line-clamp-2 leading-relaxed">
                    {mat.description}
                  </p>

                  {/* Specs Tags */}
                  <div className="flex flex-wrap gap-1 pt-1">
                    {mat.specs.map((sp, idx) => (
                      <span key={`fact-raw-sp-${idx}-${sp.slice(0, 10)}`} className="text-[9px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-md font-extrabold">
                        ✓ {sp}
                      </span>
                    ))}
                  </div>

                  {/* Quick Specs Grid */}
                  <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-100 text-[11px] font-bold text-slate-700">
                    <div>
                      <span className="text-slate-400 block text-[9px]">حداقل سفارش:</span>
                      <span className="text-slate-900 font-black">{mat.minOrder}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px]">زمان تحویل:</span>
                      <span className="text-emerald-700 font-black">{mat.deliveryDays}</span>
                    </div>
                  </div>
                </div>

                {/* Ordering CTA Button */}
                <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                  <button
                    onClick={() => {
                      setTargetRawMaterial(mat);
                      setShowOrderRawModal(true);
                    }}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3 rounded-xl text-xs transition-colors shadow-lg shadow-emerald-600/10 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <ShoppingBag size={16} />
                    <span>سفارش مستقیم این ماده اولیه</span>
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB 3: INDUSTRIAL SERVICES (خدمات صنعتی و بازرگانی کارخانجات) */}
      {activeSubTab === 'services' && (
        <div className="space-y-6">
          {/* Top Info Banner & CTA (White Theme) */}
          <div className="relative overflow-hidden bg-white rounded-[2.5rem] p-6 text-slate-900 border border-slate-200 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-6">
            {/* Subtle Ambient Glow accents */}
            <div className="absolute -top-10 -left-10 w-40 h-40 bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

            <div className="space-y-2 max-w-2xl relative z-10">
              <div className="inline-flex items-center gap-2 bg-teal-50 border border-teal-100 px-3 py-1 rounded-full text-[11px] font-black text-teal-700">
                <Briefcase size={14} className="text-teal-600" />
                <span>سامانه خدمات صنعتی، طراحی، ترخیص و حسابداری کارخانجات</span>
              </div>
              <h2 className="text-xl font-black text-slate-900">
                زنجیره خدمات تخصصی خطوط تولید و بازرگانی صنایع کشور
              </h2>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                انجام خدمات طراحی قالب و بسته‌بندی، ترخیص گمرکی، تبلیغات B2B و حسابداری صنعتی با نظارت مستقیم و تسویه امن دست‌اول.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto shrink-0 relative z-10">
              <button
                onClick={() => {
                  setTargetService(null);
                  setShowOrderServiceModal(true);
                }}
                className="bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-black px-5 py-3.5 rounded-2xl text-xs transition-all shadow-lg shadow-amber-400/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Send size={14} />
                <span>✍️ استعلام و درخواست خدمت برای کارخانه (RFQ)</span>
              </button>

              <button
                onClick={() => {
                  setShowAddServiceModal(true);
                }}
                className="bg-teal-500 hover:bg-teal-600 text-slate-950 font-black px-5 py-3.5 rounded-2xl text-xs transition-all shadow-lg shadow-teal-500/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                <PlusCircle size={14} />
                <span>🛠️ ثبت ارائه خدمت صنعتی (واسطه‌گری امن)</span>
              </button>
            </div>
          </div>

          {/* Search & Category Filter */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-7 rounded-full bg-teal-500" />
                <h3 className="text-lg font-black text-slate-900">کاتالوگ خدمات فنی، بازرگانی و مشاوره‌ای</h3>
              </div>

              <div className="relative w-full sm:w-80">
                <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="text"
                  value={searchServiceQuery}
                  onChange={(e) => setSearchServiceQuery(e.target.value)}
                  placeholder="جستجوی طراحی، ترخیص، حسابداری، آزمایشگاه..."
                  className="w-full bg-white border border-slate-200 rounded-2xl pr-10 pl-4 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 shadow-sm"
                />
              </div>
            </div>

            {/* Category Filter Chips */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              {SERVICE_CATEGORIES.map((cat, idx) => (
                <button
                  key={`fact-srv-cat-${cat}-${idx}`}
                  onClick={() => setSelectedServiceCategory(cat)}
                  className={`px-4 py-2 rounded-2xl text-xs font-black transition-all shrink-0 cursor-pointer ${
                    selectedServiceCategory === cat
                      ? "bg-teal-600 text-white shadow-md shadow-teal-600/20"
                      : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Services Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredServices.map((srv, sIdx) => (
              <motion.div
                key={`fact-srv-item-${srv.id || sIdx}-${sIdx}`}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-[2.5rem] border border-slate-200/80 p-6 space-y-4 hover:border-teal-400 hover:shadow-xl transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="relative h-44 rounded-2xl overflow-hidden bg-slate-100 border border-slate-100">
                    <img src={getDisplayImageUrl(srv.imageUrl)} alt={srv.title} className="w-full h-full object-cover" />
                    <span className="absolute top-3 right-3 bg-white/90 backdrop-blur-md text-teal-600 font-black text-[10px] px-3 py-1 rounded-full border border-teal-200">
                      {srv.category}
                    </span>

                    {/* Verification Overlay */}
                    {srv.isPendingApproval ? (
                      <span className="absolute bottom-3 right-3 bg-amber-500/95 backdrop-blur-md text-slate-950 font-black text-[9px] px-2.5 py-1 rounded-lg border border-amber-400 flex items-center gap-1 shadow-sm">
                        <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-ping" />
                        ⏳ در انتظار بررسی مدارک فنی
                      </span>
                    ) : (
                      <span className="absolute bottom-3 right-3 bg-teal-600/95 backdrop-blur-md text-white font-black text-[9px] px-2.5 py-1 rounded-lg border border-teal-400 flex items-center gap-1 shadow-sm">
                        <CheckCircle2 size={10} className="text-teal-200" />
                        ✓ ارائه‌دهنده تایید شده دست‌اول
                      </span>
                    )}
                  </div>

                  <div>
                    <h4 className="text-sm font-black text-slate-900 leading-snug">
                      {srv.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 font-bold mt-1">
                      مجری: <span className="text-slate-800 font-black">{srv.providerName}</span> ({srv.location})
                    </p>
                  </div>

                  {/* Escrow Guarantee Badge */}
                  <div className="flex flex-col gap-1.5 bg-indigo-50 border border-indigo-100/60 p-2.5 rounded-xl text-[9px] font-black text-indigo-900 shadow-3xs">
                    <div className="flex items-center gap-1.5">
                      <ShieldCheck size={13} className="text-indigo-600 shrink-0" />
                      <span>انجام خدمات با واسطه‌گری امن و تسویه امانی دست‌اول</span>
                    </div>
                    <p className="text-[8px] text-indigo-700/80 font-bold leading-normal border-t border-indigo-100/40 pt-1">
                      ✓ تسویه مالی خدمت پس از تحویل نهایی خروجی به کارخانه و تایید حسن انجام کار صورت می‌پذیرد.
                    </p>
                  </div>

                  <p className="text-xs text-slate-600 font-medium line-clamp-2 leading-relaxed">
                    {srv.description}
                  </p>

                  {/* Capabilities Tags */}
                  <div className="flex flex-wrap gap-1 pt-1">
                    {srv.capabilities.map((cap, idx) => (
                      <span key={`fact-srv-cap-${idx}-${cap.slice(0, 10)}`} className="text-[9px] bg-teal-50 text-teal-800 border border-teal-200 px-2 py-0.5 rounded-md font-extrabold">
                        ✓ {cap}
                      </span>
                    ))}
                  </div>

                  {/* Quick Specs Grid */}
                  <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-100 text-[11px] font-bold text-slate-700">
                    <div>
                      <span className="text-slate-400 block text-[9px]">تعرفه / نرخ:</span>
                      <span className="text-slate-900 font-black truncate block">{srv.rate}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px]">مدت اجرا:</span>
                      <span className="text-teal-700 font-black truncate block">{srv.deliveryDays}</span>
                    </div>
                  </div>
                </div>

                {/* Ordering CTA Button */}
                <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                  <button
                    onClick={() => {
                      setTargetService(srv);
                      setShowOrderServiceModal(true);
                    }}
                    className="w-full bg-teal-600 hover:bg-teal-700 text-white font-black py-3 rounded-xl text-xs transition-colors shadow-lg shadow-teal-600/10 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Briefcase size={16} />
                    <span>درخواست این خدمت برای کارخانه</span>
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}



      {/* MODAL 1: FACTORY DETAILS MODAL */}
      <AnimatePresence>
        {selectedFactoryModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-400/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[2.5rem] max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 p-2 shrink-0 flex items-center justify-center">
                    {selectedFactoryModal.logoUrl || selectedFactoryModal.logo ? (
                      <img 
                        src={getDisplayImageUrl(selectedFactoryModal.logoUrl || selectedFactoryModal.logo)} 
                        alt={selectedFactoryModal.name} 
                        className="w-full h-full object-contain rounded-lg"
                      />
                    ) : (
                      <Building2 size={28} className="text-slate-400" />
                    )}
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md">
                      {selectedFactoryModal.category || "خط تولید"}
                    </span>
                    <h3 className="text-base font-black text-slate-900 mt-1">{selectedFactoryModal.name}</h3>
                    <p className="text-xs text-slate-500 font-medium">موقعیت: {selectedFactoryModal.location || "شهرک صنعتی"}</p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedFactoryModal(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Description */}
              <p className="text-xs text-slate-700 font-medium leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100">
                {selectedFactoryModal.description || selectedFactoryModal.desc}
              </p>

              {/* Main Products */}
              {selectedFactoryModal.mainProducts && selectedFactoryModal.mainProducts.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-black text-slate-900">محصولات و خطوط اصلی تولید:</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedFactoryModal.mainProducts.map((p, idx) => (
                      <span key={`fact-modal-prod-${idx}-${p.slice(0, 10)}`} className="text-xs bg-emerald-50 text-emerald-800 px-3 py-1 rounded-xl font-bold border border-emerald-100">
                        ✓ {p}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Reviews Section */}
              <div className="space-y-4 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquare size={16} className="text-emerald-600" />
                    <h4 className="text-sm font-black text-slate-900">نظرات و تجربیات خرید ثبت‌شده همکاران</h4>
                  </div>
                  <button
                    onClick={() => setShowReviewForm(!showReviewForm)}
                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl transition-all cursor-pointer shadow-sm"
                  >
                    {showReviewForm ? "انصراف" : "✍️ ثبت تجربه خرید"}
                  </button>
                </div>

                {/* Reviews List */}
                <div className="space-y-3">
                  {(reviewsMap[selectedFactoryModal.id] || reviewsMap['default'] || []).map((rev, rIdx) => (
                    <div key={`fact-modal-rev-${rev.id || rIdx}-${rIdx}`} className="bg-slate-50 border border-slate-100 p-3.5 rounded-2xl space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-black text-slate-900">{rev.userName} ({rev.userCity})</span>
                        {renderStars(rev.rating)}
                      </div>
                      <p className="text-slate-600 font-medium leading-relaxed">{rev.comment}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom Order CTA */}
              <div className="pt-4 border-t border-slate-100 flex gap-3">
                <button
                  onClick={() => {
                    if (onSelectFactoryForOrder) {
                      onSelectFactoryForOrder(selectedFactoryModal.name);
                    }
                    setSelectedFactoryModal(null);
                  }}
                  className="flex-1 bg-emerald-600 text-white font-black py-3 rounded-xl text-xs hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/10 cursor-pointer"
                >
                  <ShoppingBag size={16} />
                  <span>ثبت سفارش مستقیم از این کارخانه</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: ORDER RAW MATERIAL MODAL (استعلام و سفارش مواد اولیه) */}
      <AnimatePresence>
        {showOrderRawModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-400/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[2.5rem] max-w-xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-100"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black">
                    <Boxes size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900">
                      {targetRawMaterial ? `سفارش ${targetRawMaterial.name}` : "فرم استعلام خرید مواد اولیه (RFQ)"}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      {targetRawMaterial ? `تامین‌کننده: ${targetRawMaterial.supplierName}` : "ارسال به تامین‌کنندگان معتبر مواد اولیه"}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setShowOrderRawModal(false);
                    setSubmittedOrderCode(null);
                  }}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              {submittedOrderCode ? (
                <div className="bg-emerald-50 border border-emerald-200 p-6 rounded-3xl text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-emerald-600/30">
                    <CheckCircle size={32} />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-base font-black text-emerald-950">استعلام خرید با موفقیت ثبت شد</h4>
                    <p className="text-xs text-emerald-800 font-bold">
                      کد پیگیری استعلام خرید شما: <span className="font-mono text-base font-black bg-white px-3 py-1 rounded-lg border border-emerald-300 inline-block mt-1">{submittedOrderCode}</span>
                    </p>
                  </div>
                  <p className="text-xs text-slate-600 font-medium leading-relaxed">
                    تامین‌کننده مربوطه پس از بررسی آنالیز و حجم درخواستی، پیش‌فاکتور و تعرفه حمل را از طریق تماس تلفنی با کارخانه شما هماهنگ خواهد نمود.
                  </p>
                  <button
                    onClick={() => {
                      setShowOrderRawModal(false);
                      setSubmittedOrderCode(null);
                    }}
                    className="w-full py-3 bg-indigo-600 text-white font-black text-xs rounded-xl hover:bg-indigo-700 transition-all shadow-md shadow-indigo-600/20 cursor-pointer"
                  >
                    متوجه شدم / بازگشت
                  </button>
                </div>
              ) : (
                <form onSubmit={handleOrderRawSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-800 block">نام کارخانه / شرکت خریدار:</label>
                    <input
                      type="text"
                      required
                      value={buyerFactoryName}
                      onChange={(e) => setBuyerFactoryName(e.target.value)}
                      placeholder="مثال: صنایع غذایی و شکلات رزطلا"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-black text-slate-800 block">شماره تماس مسئول خرید:</label>
                      <input
                        type="tel"
                        required
                        value={buyerPhone}
                        onChange={(e) => setBuyerPhone(e.target.value)}
                        placeholder="۰۹۱۲..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-black text-slate-800 block">حجم و مقدار مورد نیاز:</label>
                      <input
                        type="text"
                        required
                        value={buyerQty}
                        onChange={(e) => setBuyerQty(e.target.value)}
                        placeholder="مثال: ۱۰ تن / ۵۰ کیسه"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-800 block">شهر و محل تحویل بار:</label>
                    <input
                      type="text"
                      value={buyerCity}
                      onChange={(e) => setBuyerCity(e.target.value)}
                      placeholder="مثال: تبریز - شهرک صنعتی سلیمی"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-800 block">توضیحات آنالیز، گواهی یا مهلت تحویل:</label>
                    <textarea
                      rows={3}
                      value={buyerNotes}
                      onChange={(e) => setBuyerNotes(e.target.value)}
                      placeholder="توضیحات در خصوص آنالیز درخواستی، درصد خلوص، برند یا شروط پرداخت..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-lg shadow-emerald-600/20 transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Send size={16} />
                    <span>ثبت نهایی و ارسال استعلام به تامین‌کننده</span>
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 3: REGISTER SUPPLIER MODAL */}
      <AnimatePresence>
        {showAddSupplierModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-400/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[2.5rem] max-w-xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-100"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-base font-black text-slate-900">ثبت‌نام تامین‌کننده مواد اولیه و ملزومات</h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">ثبت شرکت شما در فهرست رسمی تامین‌کنندگان دست‌اول</p>
                </div>
                <button
                  onClick={() => setShowAddSupplierModal(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              {supSuccessMsg ? (
                <div className="bg-emerald-50 border border-emerald-200 p-6 rounded-3xl text-center space-y-2 text-emerald-900 font-black text-sm">
                  ✓ {supSuccessMsg}
                </div>
              ) : (
                <form onSubmit={handleRegisterSupplier} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-800 block">نام شرکت / بازرگانی تامین‌کننده:</label>
                    <input
                      type="text"
                      required
                      value={newSupName}
                      onChange={(e) => setNewSupName(e.target.value)}
                      placeholder="مثال: بازرگانی طعم و اسانس مهر"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-black text-slate-800 block">تلفن تماس / واحد فروش:</label>
                      <input
                        type="tel"
                        required
                        value={newSupPhone}
                        onChange={(e) => setNewSupPhone(e.target.value)}
                        placeholder="۰۲۱..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-black text-slate-800 block">استان و شهر فعالیت:</label>
                      <input
                        type="text"
                        value={newSupLocation}
                        onChange={(e) => setNewSupLocation(e.target.value)}
                        placeholder="مثال: تهران - بازار بزرگ"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-800 block">اقلام و مواد اولیه تولیدی/تامین (با کاما جدا کنید):</label>
                    <input
                      type="text"
                      value={newSupProducts}
                      onChange={(e) => setNewSupProducts(e.target.value)}
                      placeholder="مثال: اسانس وانیل، پودر کاکائو، گلیسیرین خوراکی"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-800 block">توضیحات سابقه و ظرفیت تامین:</label>
                    <textarea
                      rows={3}
                      value={newSupDesc}
                      onChange={(e) => setNewSupDesc(e.target.value)}
                      placeholder="خلاصه‌ای از سابقه شرکت، استانداردهای اخذ شده و ظرفیت تحویل روزانه..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow-lg shadow-indigo-600/20 transition-all cursor-pointer"
                  >
                    ثبت نهایی تامین‌کننده
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 4: SELL RAW MATERIAL MODAL */}
      <AnimatePresence>
        {showAddRawMaterialModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-400/50 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[2.5rem] max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-100 my-8 text-right"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                    <ShieldCheck className="text-emerald-600" size={20} />
                    <span>ثبت و فروش ماده اولیه با ضمانت امن دست اول</span>
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">ثبت بار و فروش مستقیم بدون واسطه به کارخانجات سراسر کشور</p>
                </div>
                <button
                  onClick={() => setShowAddRawMaterialModal(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Secure Escrow Education Box */}
              <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-2xl flex items-start gap-3">
                <ShieldCheck className="text-indigo-600 shrink-0 mt-0.5" size={18} />
                <div className="space-y-1">
                  <span className="text-[11px] font-black text-indigo-950 block">مکانیزم تسویه حساب امانی امن (Escrow) دست‌اول:</span>
                  <p className="text-[10px] text-indigo-900 font-medium leading-relaxed">
                    جهت تضمین سلامت معامله، مبلغ واریزی خریدار نزد حساب امانی موقت دست‌اول مسدود می‌شود. پس از ارسال بار، آزمایش کیفیت توسط خریدار و تایید نهایی تخلیه، وجه معامله بدون ریسک کلاهبرداری یا عدم تطابق کالا به حساب تامین‌کننده آزاد می‌گردد.
                  </p>
                </div>
              </div>

              {matSuccessMsg ? (
                <div className="bg-emerald-50 border border-emerald-200 p-6 rounded-3xl text-center space-y-2 text-emerald-900 font-black text-sm">
                  ✓ {matSuccessMsg}
                </div>
              ) : (
                <form onSubmit={handleRegisterRawMaterial} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-black text-slate-800 block">نام ماده اولیه / کاتالوگ فروش:</label>
                      <input
                        type="text"
                        required
                        value={newMatName}
                        onChange={(e) => setNewMatName(e.target.value)}
                        placeholder="مثال: آرد گندم صنعتی ستاره نول ۲۱٪"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-black text-slate-800 block">دسته‌بندی ماده اولیه:</label>
                      <select
                        value={newMatCat}
                        onChange={(e) => setNewMatCat(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-black focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      >
                        {RAW_MATERIAL_CATEGORIES.filter(c => c !== "همه مواد اولیه").map((cat, idx) => (
                          <option key={`fact-raw-opt-${cat}-${idx}`} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-black text-slate-800 block">نام شرکت / بازرگانی تامین‌کننده:</label>
                      <input
                        type="text"
                        required
                        value={newMatSupName}
                        onChange={(e) => setNewMatSupName(e.target.value)}
                        placeholder="مثال: بازرگانی توسعه غلات البرز"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-black text-slate-800 block">تلفن تماس مستقیم فروش:</label>
                      <input
                        type="tel"
                        required
                        value={newMatPhone}
                        onChange={(e) => setNewMatPhone(e.target.value)}
                        placeholder="مثال: ۰۲۱۸۸۹۹۰۰۱۱"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-black text-slate-800 block">قیمت هر واحد (مثلاً هر تن):</label>
                      <input
                        type="text"
                        required
                        value={newMatPrice}
                        onChange={(e) => setNewMatPrice(e.target.value)}
                        placeholder="مثال: ۴۲,۵۰۰ تومان"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-black text-slate-800 block">حداقل سفارش قابل تامین:</label>
                      <input
                        type="text"
                        required
                        value={newMatMinOrder}
                        onChange={(e) => setNewMatMinOrder(e.target.value)}
                        placeholder="مثال: ۵ تن"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-black text-slate-800 block">زمان تحویل پس از خرید:</label>
                      <input
                        type="text"
                        required
                        value={newMatDeliveryDays}
                        onChange={(e) => setNewMatDeliveryDays(e.target.value)}
                        placeholder="مثال: ۳ روز کاری"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-black text-slate-800 block">استان و محل بارگیری بار:</label>
                      <input
                        type="text"
                        required
                        value={newMatSupLocation}
                        onChange={(e) => setNewMatSupLocation(e.target.value)}
                        placeholder="مثال: خراسان رضوی - مشهد"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-black text-slate-800 block">تصویر محصول (آپلود مستقیم یا آدرس اینترنتی):</label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Drag and Drop Box */}
                        <div
                          onDragOver={(e) => {
                            e.preventDefault();
                            setIsDraggingImage(true);
                          }}
                          onDragLeave={() => setIsDraggingImage(false)}
                          onDrop={(e) => {
                            e.preventDefault();
                            setIsDraggingImage(false);
                            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                              handleImageFile(e.dataTransfer.files[0]);
                            }
                          }}
                          className={`border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                            isDraggingImage
                              ? "border-emerald-500 bg-emerald-50"
                              : "border-slate-300 hover:border-emerald-400 hover:bg-slate-50"
                          }`}
                          onClick={() => document.getElementById("file-upload-input")?.click()}
                        >
                          <input
                            id="file-upload-input"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                handleImageFile(e.target.files[0]);
                              }
                            }}
                          />
                          {uploadedImageBase64 ? (
                            <div className="space-y-2">
                              <img
                                src={uploadedImageBase64}
                                alt="پیش‌نمایش"
                                className="w-16 h-16 object-cover rounded-lg mx-auto border border-slate-200"
                              />
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setUploadedImageBase64(null);
                                }}
                                className="text-[10px] bg-rose-50 text-rose-600 px-2.5 py-1 rounded-md font-bold hover:bg-rose-100 transition-colors"
                              >
                                حذف و تغییر عکس
                              </button>
                            </div>
                          ) : (
                            <div className="space-y-1">
                              <UploadCloud className="text-slate-400 mx-auto" size={24} />
                              <span className="text-[11px] font-black text-slate-700 block">
                                آپلود مستقیم تصویر کالا (Drag & Drop)
                              </span>
                              <span className="text-[9px] text-slate-400 block">
                                یا جهت انتخاب فایل کلیک کنید
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Text URL Option */}
                        <div className="flex flex-col justify-between space-y-1.5">
                          <div>
                            <span className="text-[10px] text-slate-400 block mb-1">یا آدرس مستقیم تصویر (اختیاری):</span>
                            <input
                              type="text"
                              value={newMatImageUrl}
                              onChange={(e) => {
                                setNewMatImageUrl(e.target.value);
                                if (e.target.value) {
                                  setUploadedImageBase64(null); // Clear file upload if text URL is entered
                                }
                              }}
                              placeholder="https://example.com/image.jpg"
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                            />
                          </div>
                          <p className="text-[9px] text-slate-400 leading-normal font-medium">
                            تصویر باکیفیت و واضح به جلب اعتماد خریداران و تسریع فرآیند تایید نهایی توسط ناظران کارگاه دست‌اول کمک شایانی خواهد کرد.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-800 block">ویژگی‌های فنی و آنالیز (با کامای فارسی «،» جدا کنید):</label>
                    <input
                      type="text"
                      value={newMatSpecs}
                      onChange={(e) => setNewMatSpecs(e.target.value)}
                      placeholder="مثال: گلوتن حداقل ۲۷٪، خاکستر زیر ۰.۴٪، رطوبت کمتر از ۱۲٪"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-800 block">توضیحات تکمیلی و شرایط تحویل بار:</label>
                    <textarea
                      rows={3}
                      value={newMatDesc}
                      onChange={(e) => setNewMatDesc(e.target.value)}
                      placeholder="توضیحات در مورد نحوه نمونه‌گیری آزمایشگاهی کالا، بسته‌بندی، ظرفیت‌های فصلی و فاکتور رسمی..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-lg shadow-emerald-600/20 transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <ShieldCheck size={16} />
                    <span>تایید مشخصات و انتشار بار با ضمانت امن دست‌اول</span>
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 5: ORDER INDUSTRIAL SERVICE (RFQ) WITH ESCROW */}
      <AnimatePresence>
        {showOrderServiceModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-400/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[2.5rem] max-w-xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto text-right"
              dir="rtl"
            >
              <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                <div>
                  <div className="inline-flex items-center gap-1.5 bg-teal-50 border border-teal-200 px-3 py-1 rounded-full text-[10px] font-black text-teal-800 mb-2">
                    <Briefcase size={12} className="text-teal-600" />
                    <span>درخواست استعلام خدمت صنعتی با نظارت دست‌اول</span>
                  </div>
                  <h3 className="text-lg font-black text-slate-900">
                    {targetService ? `استعلام: ${targetService.title}` : "فرم استعلام و سفارش خدمات صنعتی و بازرگانی"}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-1">
                    {targetService ? `مجری: ${targetService.providerName}` : "درخواست شما برای مجریان برتر و تایید شده ارسال خواهد شد"}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowOrderServiceModal(false);
                    setServiceOrderSubmittedCode(null);
                  }}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {serviceOrderSubmittedCode ? (
                <div className="p-6 bg-teal-50 border border-teal-200 rounded-3xl text-center space-y-4">
                  <div className="w-16 h-16 bg-teal-600 text-white rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-teal-600/30">
                    <CheckCircle2 size={32} />
                  </div>
                  <h4 className="text-base font-black text-teal-900">درخواست خدمت با موفقیت ثبت شد</h4>
                  <p className="text-xs text-teal-800 font-medium leading-relaxed">
                    کد پیگیری درخواست شما: <span className="font-mono font-black text-sm bg-white px-3 py-1 rounded-lg border border-teal-300">{serviceOrderSubmittedCode}</span>
                  </p>
                  <p className="text-xs text-slate-600 font-medium">
                    کارشناس ناظر دست‌اول ظرف حداکثر ۲ ساعت کاری جهت هماهنگی جلسه فنی و صدور پیش‌فاکتور رسمی با شما تماس خواهد گرفت. کلیه تعهدات و تسویه‌ها تحت ضمانت امانی پلتفرم دست‌اول انجام می‌پذیرد.
                  </p>
                  <button
                    onClick={() => {
                      setShowOrderServiceModal(false);
                      setServiceOrderSubmittedCode(null);
                    }}
                    className="w-full py-3 bg-teal-700 hover:bg-teal-800 text-white font-black text-xs rounded-xl shadow-md transition-all"
                  >
                    متوجه شدم
                  </button>
                </div>
              ) : (
                <form onSubmit={handleOrderServiceSubmit} className="space-y-4">
                  {/* Escrow Guarantee Box */}
                  <div className="bg-indigo-50/80 border border-indigo-200/80 p-4 rounded-2xl space-y-2">
                    <div className="flex items-center gap-2 text-indigo-900 font-black text-xs">
                      <ShieldCheck size={16} className="text-indigo-600 shrink-0" />
                      <span>تضمین حسن انجام کار و امنیت مالی توسط دست‌اول</span>
                    </div>
                    <p className="text-[11px] text-indigo-800 leading-relaxed font-medium">
                      هزینه خدمت تا زمان تحویل کامل خروجی، تایید آزمون و رضایت قطعی کارخانه در حساب امانی دست‌اول نزد بانک بلوکه می‌ماند و بدون تایید شما به مجری پرداخت نخواهد شد.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-black text-slate-800 block">نام کارخانه یا شرکت متقاضی:</label>
                      <input
                        type="text"
                        required
                        value={reqFactoryName}
                        onChange={(e) => setReqFactoryName(e.target.value)}
                        placeholder="مثال: صنایع غذایی بهپخش"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-black text-slate-800 block">تلفن همراه مسئول خرید / سفارش:</label>
                      <input
                        type="tel"
                        required
                        value={reqContactPhone}
                        onChange={(e) => setReqContactPhone(e.target.value)}
                        placeholder="مثال: ۰۹۱۲۳۴۵۶۷۸۹"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-800 block">شهرک صنعتی / استان کارخانه:</label>
                    <input
                      type="text"
                      required
                      value={reqCity}
                      onChange={(e) => setReqCity(e.target.value)}
                      placeholder="مثال: تهران - شهرک صنعتی عباس‌آباد"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-800 block">شرح نیاز فنی، ابعاد پروژه یا پرسش‌های شما:</label>
                    <textarea
                      rows={3}
                      required
                      value={reqDetails}
                      onChange={(e) => setReqDetails(e.target.value)}
                      placeholder="توضیح دهید به چه خدماتی (مثلاً طراحی قالب سلفون، ترخیص مواد اولیه از گمرک بندرعباس، اصلاح دفاتر مالیاتی، کمپین پخش) با چه مهلت زمانی نیاز دارید..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 bg-teal-600 hover:bg-teal-700 text-white font-black text-xs rounded-xl shadow-lg shadow-teal-600/20 transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Send size={16} />
                    <span>ارسال درخواست و دریافت پیش‌فاکتور با نظارت دست‌اول</span>
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 6: REGISTER INDUSTRIAL SERVICE (ارائه خدمت با واسطه‌گری امن) */}
      <AnimatePresence>
        {showAddServiceModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-400/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[2.5rem] max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto text-right"
              dir="rtl"
            >
              <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                <div>
                  <div className="inline-flex items-center gap-1.5 bg-teal-50 border border-teal-200 px-3 py-1 rounded-full text-[10px] font-black text-teal-800 mb-2">
                    <PlusCircle size={12} className="text-teal-600" />
                    <span>ثبت معرفی خدمت صنعتی (بدون نیاز به پنل پیچیده)</span>
                  </div>
                  <h3 className="text-lg font-black text-slate-900">
                    معرفی و ثبت خدمات صنعتی برای کارخانجات کشور
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-1">
                    خدمت شما پس از تایید توسط ادمین دست‌اول منتشر شده و قراردادها از طریق سیستم واسطه‌گری امن اجرا می‌گردد.
                  </p>
                </div>
                <button
                  onClick={() => setShowAddServiceModal(false)}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {srvSuccessMsg ? (
                <div className="p-6 bg-teal-50 border border-teal-200 rounded-3xl text-center space-y-3">
                  <div className="w-14 h-14 bg-teal-600 text-white rounded-2xl flex items-center justify-center mx-auto shadow-md">
                    <CheckCircle2 size={30} />
                  </div>
                  <h4 className="text-base font-black text-teal-900">خدمت با موفقیت ثبت شد</h4>
                  <p className="text-xs text-teal-800 font-medium leading-relaxed">
                    {srvSuccessMsg}
                  </p>
                </div>
              ) : (
                <form onSubmit={handleRegisterService} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-black text-slate-800 block">عنوان خدمت صنعتی:</label>
                      <input
                        type="text"
                        required
                        value={newSrvTitle}
                        onChange={(e) => setNewSrvTitle(e.target.value)}
                        placeholder="مثال: ترخیص مواد اولیه پودر کاکائو از گمرک بازرگان"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-black text-slate-800 block">دسته‌بندی خدمت:</label>
                      <select
                        value={newSrvCat}
                        onChange={(e) => setNewSrvCat(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                      >
                        {SERVICE_CATEGORIES.filter(c => c !== "همه خدمات صنعتی").map((c, idx) => (
                          <option key={`fact-srv-opt-${c}-${idx}`} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-black text-slate-800 block">نام شرکت / شخص ارائه‌دهنده خدمت:</label>
                      <input
                        type="text"
                        required
                        value={newSrvProvider}
                        onChange={(e) => setNewSrvProvider(e.target.value)}
                        placeholder="مثال: گروه مهندسی و بازرگانی آریا"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-black text-slate-800 block">شماره تماس مستقیم کارشناس:</label>
                      <input
                        type="tel"
                        required
                        value={newSrvPhone}
                        onChange={(e) => setNewSrvPhone(e.target.value)}
                        placeholder="مثال: ۰۹۱۲۱۱۱۱۱۱۱"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-black text-slate-800 block">شهر / منطقه فعالیت:</label>
                      <input
                        type="text"
                        required
                        value={newSrvLocation}
                        onChange={(e) => setNewSrvLocation(e.target.value)}
                        placeholder="مثال: تهران / گمرکات جنوب"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-black text-slate-800 block">تعرفه و نرخ تقریبی:</label>
                      <input
                        type="text"
                        value={newSrvRate}
                        onChange={(e) => setNewSrvRate(e.target.value)}
                        placeholder="مثال: کارمزد ۲٪ / استعلامی"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-black text-slate-800 block">مدت زمان اجرا / تحویل:</label>
                      <input
                        type="text"
                        value={newSrvDays}
                        onChange={(e) => setNewSrvDays(e.target.value)}
                        placeholder="مثال: ۵ روز کاری"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-800 block">ویژگی‌ها و قابلیت‌های کلیدی (با کامای فارسی «،» جدا کنید):</label>
                    <input
                      type="text"
                      value={newSrvCapabilities}
                      onChange={(e) => setNewSrvCapabilities(e.target.value)}
                      placeholder="مثال: کارت بازرگانی معتبر، ضمانت حسن انجام کار، فاکتور رسمی با ارزش‌افزوده"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-800 block">شرح کامل سوابق و خدمات:</label>
                    <textarea
                      rows={3}
                      value={newSrvDesc}
                      onChange={(e) => setNewSrvDesc(e.target.value)}
                      placeholder="سوابق اجرایی در حوزه کارخانجات و واحدهای تولیدی را به طور خلاصه شرح دهید..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                    />
                  </div>

                  {/* Escrow Guarantee Notice */}
                  <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-xl text-[11px] text-amber-900 space-y-1 font-medium">
                    <div className="font-black flex items-center gap-1.5 text-amber-950">
                      <ShieldCheck size={14} className="text-amber-700" />
                      <span>نحوه همکاری و انجام خرید/خدمات کارخانه به واسطه ادمین دست‌اول:</span>
                    </div>
                    <p className="text-[10px] text-amber-800 leading-relaxed">
                      کارخانجات سفارشات خود را به صورت امن در سامانه ثبت می‌کنند؛ ادمین دست‌اول صحت مدارک و کیفیت خروجی را بررسی کرده و تسویه حساب با ارائه‌دهنده خدمت را پس از تایید نهایی کارخانه خریدار به انجام می‌رساند.
                    </p>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 bg-teal-600 hover:bg-teal-700 text-white font-black text-xs rounded-xl shadow-lg shadow-teal-600/20 transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <ShieldCheck size={16} />
                    <span>تایید و ارسال مشخصات خدمت جهت تایید ادمین</span>
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DEDICATED FACTORY PAGE OVERLAY */}
      <AnimatePresence>
        {selectedDedicatedFactory && (
          <FactoryDedicatedPage
            factory={selectedDedicatedFactory}
            products={products}
            onClose={() => setSelectedDedicatedFactory(null)}
            onSelectProductForOrder={onSelectProductForOrder}
            onDirectOrderFactory={onSelectFactoryForOrder}
            b2bConfig={b2bConfig}
            userBadge={userBadge}
            user={user}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
