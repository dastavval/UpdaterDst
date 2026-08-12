import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import StarRating from "./StarRating";
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
  Share2
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

// Initial mock reviews
const INITIAL_REVIEWS: Record<string, FactoryReviewItem[]> = {};

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
  // Main Sub-Tab State: 'factories' | 'raw_materials' | 'suppliers'
  const [activeSubTab, setActiveSubTab] = useState<'factories' | 'raw_materials' | 'suppliers'>('factories');

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

  // Raw Materials States
  const [rawMaterialsList, setRawMaterialsList] = useState<RawMaterial[]>(INITIAL_RAW_MATERIALS);
  const [suppliersList, setSuppliersList] = useState<RawMaterialSupplier[]>(INITIAL_RAW_SUPPLIERS);
  const [selectedRawCategory, setSelectedRawCategory] = useState("همه مواد اولیه");
  const [searchRawQuery, setSearchRawQuery] = useState("");

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

  // Fallback to b2bConfig factories if available
  const allFactories: FactoryItem[] = factories.length > 0 
    ? factories 
    : (b2bConfig?.factories || []);

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
          <div className="space-y-1.5 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 bg-amber-50 border border-amber-200/90 px-3 py-1 rounded-full text-[10px] font-black text-amber-900 shadow-2xs">
              <Award size={13} className="text-amber-600" />
              <span>ارتباط مستقیم بنکداران و کارخانجات کشور</span>
            </div>
            <h1 className="text-lg sm:text-2xl font-black text-slate-900 leading-snug">
              فهرست کارخانجات و واحدهای تولیدی معتبر
            </h1>
            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              خرید مستقیم به قیمت درب کارخانه، دریافت کاتالوگ و QR کد اختصاصی تولیدکنندگان کشور
            </p>
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
              onClick={() => setActiveSubTab('suppliers')}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeSubTab === 'suppliers'
                  ? "bg-teal-600 text-white shadow-sm shadow-teal-600/20 font-black"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
              }`}
            >
              <Building2 size={14} />
              <span>تامین‌کنندگان ({toPersianNum(suppliersList.length)})</span>
            </button>
          </div>
        </div>
      </div>

      {/* SUB-TAB 1: FACTORIES DIRECTORY */}
      {activeSubTab === 'factories' && (
        <div className="space-y-6">
          {/* Category Filter Tabs & Search Bar */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-7 rounded-full bg-emerald-600" />
                <h2 className="text-lg font-black text-slate-900">دسته‌بندی صنایع و کارخانجات</h2>
              </div>

              <div className="relative w-full sm:w-72">
                <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="جستجوی نام کارخانه، شهر یا کالا..."
                  className="w-full bg-white border border-slate-200 rounded-2xl pr-10 pl-4 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-sm"
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

            {/* Categories Chips */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none pt-1">
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
                
                return catsToRender.map((cat) => {
                  const isSelected = selectedCategory === cat;
                  return (
                    <button
                      key={cat}
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
                className="px-5 py-2.5 bg-slate-900 text-white text-xs font-black rounded-xl hover:bg-slate-800 transition-all cursor-pointer"
              >
                نمایش همه کارخانه‌ها
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
              {sortedFactories.map((factory) => {
                const logo = factory.logoUrl || factory.logo;
                const cover = factory.coverUrl || "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800";
                const desc = factory.description || factory.desc || "تولیدکننده رسمی محصولات استاندارد مواد غذایی با سیب سلامت و استانداردهای کیفی.";
                const categoryLabel = factory.category || "صنایع غذایی و مصرفی";
                const established = factory.establishedYear || factory.established || "۱۳۸۰";
                const location = factory.location || "شهرک صنعتی";
                const isFeatured = factory.isFeatured || factory.isPinned || factory.isPremium;
                const ratingScore = factory.rating || 5;

                return (
                  <motion.div
                    key={factory.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`overflow-hidden bg-white rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between transition-all duration-300 hover:shadow-lg hover:border-emerald-300 relative group`}
                  >
                    {/* Factory Cover Photo Banner */}
                    <div className="relative h-36 sm:h-40 w-full bg-slate-900 overflow-hidden cursor-pointer" onClick={() => setSelectedDedicatedFactory(factory as FactoryProfile)}>
                      <img 
                        src={cover} 
                        alt={factory.name} 
                        onError={(e) => {
                          e.currentTarget.src = "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=1200&q=80";
                        }}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent" />
                      <span className="absolute top-3 right-3 text-[10px] font-black text-emerald-800 bg-white/95 backdrop-blur-md px-3 py-1 rounded-xl border border-white/60 shadow-md">
                        {categoryLabel}
                      </span>
                      {isFeatured && (
                        <span className="absolute top-3 left-3 text-[10px] font-black text-amber-950 bg-amber-400 px-2.5 py-1 rounded-xl shadow-md border border-amber-300">
                          ⭐ ویژه کارخانه
                        </span>
                      )}
                    </div>

                    <div className="p-4 pt-0 -mt-10 relative z-10">
                      {/* Brand & Category Header Row */}
                      <div className="flex items-end justify-between gap-3 mb-3" dir="rtl">
                        <div className="flex items-end gap-3 min-w-0">
                          <div 
                            onClick={() => setSelectedDedicatedFactory(factory as FactoryProfile)}
                            className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-white border-2 border-emerald-200 p-2 shrink-0 flex items-center justify-center overflow-hidden cursor-pointer shadow-xl group-hover:border-emerald-500 transition-all relative"
                          >
                            {logo ? (
                              <img 
                                src={logo} 
                                alt={factory.name} 
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                  const parent = e.currentTarget.parentElement;
                                  if (parent) {
                                    const fb = parent.querySelector('.fac-vector-fallback');
                                    if (fb) (fb as HTMLElement).style.display = 'flex';
                                  }
                                }}
                                className="w-full h-full object-contain rounded-xl p-0.5 group-hover:scale-105 transition-transform clean-logo-filter" 
                              />
                            ) : null}
                            <div 
                              className="fac-vector-fallback hidden absolute inset-0 bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 text-white flex-col items-center justify-center p-2 rounded-xl text-center shadow-inner"
                              style={{ display: !logo ? 'flex' : 'none' }}
                            >
                              <span className="text-2xl mb-0.5">🏭</span>
                              <span className="text-[9px] font-black leading-tight text-amber-300 line-clamp-1">{factory.name}</span>
                            </div>
                          </div>

                          <div className="min-w-0 text-right pb-1">
                            <h3 
                              onClick={() => setSelectedDedicatedFactory(factory as FactoryProfile)}
                              className="text-sm sm:text-base font-black text-slate-900 leading-tight truncate cursor-pointer hover:text-emerald-700 transition-colors flex items-center gap-1.5"
                            >
                              <span className="truncate">{factory.name}</span>
                              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                            </h3>
                            <p className="text-xs font-bold text-slate-400 truncate flex items-center gap-1 mt-1">
                              <MapPin size={12} className="text-slate-400 shrink-0" />
                              <span className="truncate">{location}</span>
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-[11px] text-slate-500 font-medium line-clamp-2 leading-relaxed mb-2 text-right" dir="rtl">
                        {desc}
                      </p>

                      {/* Interactive Star Rating Row */}
                      <div className="flex items-center justify-between my-2 px-2.5 py-1 rounded-xl bg-amber-50/70 border border-amber-200/60" dir="rtl">
                        <span className="text-[10px] font-black text-amber-900">رتبه‌بندی ۵ ستاره:</span>
                        <StarRating rating={ratingScore} size={13} interactive={true} showScore={true} />
                      </div>

                      {/* Products Preview Chips */}
                      {factory.mainProducts && factory.mainProducts.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-3 justify-start" dir="rtl">
                          {factory.mainProducts.slice(0, 3).map((prod, idx) => (
                            <span key={idx} className="text-[9px] bg-slate-50 text-slate-600 px-2 py-0.5 rounded-lg font-bold border border-slate-100 truncate max-w-[120px]">
                              {prod}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 relative z-0">
                      <button
                        onClick={() => setSelectedDedicatedFactory(factory as FactoryProfile)}
                        className="bg-emerald-800 hover:bg-emerald-900 text-white font-black py-2 px-3 rounded-xl text-[10px] transition-all flex items-center justify-center gap-1 cursor-pointer active:scale-95"
                        title="صفحه اختصاصی کارخانه"
                      >
                        <Eye size={12} className="text-amber-300 shrink-0" />
                        <span className="truncate">مشاهده کارخانه</span>
                      </button>

                      <button
                        onClick={() => {
                          if (onSelectFactoryForOrder) {
                            onSelectFactoryForOrder(factory.name);
                          }
                        }}
                        className="bg-amber-400 hover:bg-amber-500 text-slate-950 font-black py-2 px-3 rounded-xl text-[10px] transition-all flex items-center justify-center gap-1 active:scale-95 cursor-pointer"
                        title="ثبت سفارش مستقیم"
                      >
                        <ShoppingBag size={12} className="shrink-0" />
                        <span>ثبت سفارش</span>
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 2: RAW MATERIALS CATALOG (مواد اولیه و ملزومات تولید) */}
      {activeSubTab === 'raw_materials' && (
        <div className="space-y-6">
          {/* Top Info Banner & Request Custom Raw Material CTA */}
          <div className="bg-gradient-to-r from-emerald-900 via-slate-900 to-emerald-950 rounded-[2.5rem] p-6 text-white border border-emerald-500/30 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 bg-emerald-500/20 border border-emerald-400/30 px-3 py-1 rounded-full text-[11px] font-black text-emerald-300">
                <Boxes size={14} />
                <span>تامین مستقیم مواد اولیه کارخانجات تولیدی</span>
              </div>
              <h2 className="text-xl font-black text-white">
                سامانه تامین شکر، آرد، روغن، کاکائو، سلفون و ملزومات خطوط تولید
              </h2>
              <p className="text-xs text-slate-300 font-medium leading-relaxed">
                کارخانجات می‌توانند مواد اولیه مورد نیاز خطوط تولید خود را مستقیماً از تامین‌کنندگان معتبر استعلام و سفارش دهند.
              </p>
            </div>

            <button
              onClick={() => {
                setTargetRawMaterial(null);
                setShowOrderRawModal(true);
              }}
              className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black px-6 py-3.5 rounded-2xl text-xs transition-all shadow-lg shadow-amber-500/20 shrink-0 flex items-center gap-2 cursor-pointer"
            >
              <Send size={16} />
              <span>✍️ ثبت استعلام خرید مواد اولیه (RFQ)</span>
            </button>
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
              {RAW_MATERIAL_CATEGORIES.map((cat) => (
                <button
                  key={cat}
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
            {filteredRawMaterials.map((mat) => (
              <motion.div
                key={mat.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-[2.5rem] border border-slate-200/80 p-6 space-y-4 hover:border-emerald-400 hover:shadow-xl transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="relative h-44 rounded-2xl overflow-hidden bg-slate-100 border border-slate-100">
                    <img src={mat.imageUrl} alt={mat.name} className="w-full h-full object-cover" />
                    <span className="absolute top-3 right-3 bg-slate-900/90 backdrop-blur-md text-amber-300 font-black text-[10px] px-3 py-1 rounded-full border border-amber-400/30">
                      {mat.category}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-sm font-black text-slate-900 leading-snug">
                      {mat.name}
                    </h4>
                    <p className="text-[11px] text-slate-500 font-bold mt-1">
                      تامین‌کننده: <span className="text-slate-800 font-black">{mat.supplierName}</span> ({mat.supplierLocation})
                    </p>
                  </div>

                  <p className="text-xs text-slate-600 font-medium line-clamp-2 leading-relaxed">
                    {mat.description}
                  </p>

                  {/* Specs Tags */}
                  <div className="flex flex-wrap gap-1 pt-1">
                    {mat.specs.map((sp, idx) => (
                      <span key={idx} className="text-[9px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-md font-extrabold">
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

      {/* SUB-TAB 3: SUPPLIERS DIRECTORY (تامین‌کنندگان مواد اولیه) */}
      {activeSubTab === 'suppliers' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm">
            <div>
              <h2 className="text-lg font-black text-slate-900">فهرست تامین‌کنندگان معتبر مواد اولیه و ملزومات</h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                تامین‌کنندگان رسمی و احراز هویت شده شکر، آرد، کاکائو، روغن، اسانس و سلفون.
              </p>
            </div>

            <button
              onClick={() => setShowAddSupplierModal(true)}
              className="bg-slate-900 hover:bg-slate-800 text-white font-black px-5 py-3 rounded-2xl text-xs transition-all shrink-0 flex items-center gap-2 cursor-pointer shadow-md"
            >
              <PlusCircle size={16} className="text-amber-400" />
              <span>ثبت‌نام به عنوان تامین‌کننده مواد اولیه</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {suppliersList.map((sup) => (
              <div key={sup.id} className="bg-white rounded-[2.5rem] p-6 border border-slate-200/80 space-y-4 hover:border-emerald-400 transition-all shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-md inline-block">
                      {sup.category}
                    </span>
                    <h3 className="text-base font-black text-slate-900">{sup.companyName}</h3>
                    <div className="flex items-center gap-2 text-xs text-slate-500 font-bold">
                      <MapPin size={13} className="text-slate-400" />
                      <span>{sup.location}</span>
                      <span>•</span>
                      <span>تاسیس {sup.establishedYear}</span>
                    </div>
                  </div>

                  <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 p-1.5 shrink-0 flex items-center justify-center overflow-hidden">
                    {sup.logoUrl ? (
                      <img src={sup.logoUrl} alt={sup.companyName} className="w-full h-full object-cover rounded-md" />
                    ) : (
                      <Building2 size={24} className="text-slate-400" />
                    )}
                  </div>
                </div>

                <p className="text-xs text-slate-600 font-medium leading-relaxed">
                  {sup.description}
                </p>

                {/* Supplied Products Tags */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-black text-slate-500 block">اقلام و مواد اولیه تولیدی:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {sup.mainProducts.map((prod, idx) => (
                      <span key={idx} className="text-[10px] bg-slate-100 text-slate-800 px-2.5 py-0.5 rounded-lg font-bold">
                        {prod}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Action Bar */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                  {(() => {
                    const isVIP = userBadge === 'vip' || userBadge === 'admin';
                    if (isVIP) {
                      return (
                        <a
                          href={`tel:${sup.contactPhone}`}
                          className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-black text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <PhoneCall size={14} className="text-emerald-600" />
                          <span>{sup.contactPhone}</span>
                        </a>
                      );
                    } else {
                      return (
                        <button
                          type="button"
                          onClick={() => {
                            alert("🔒 همکار گرامی، اطلاعات تماس مستقیم تامین‌کنندگان مواد اولیه و شرکای کارخانجات جهت حفظ امنیت اطلاعات تجاری، منحصراً برای اعضای VIP فعال می‌باشد. شما می‌توانید رتبه کاربری خود را در پنل مدیریت به VIP تغییر دهید.");
                          }}
                          className="px-4 py-2.5 bg-purple-50 hover:bg-purple-100 text-purple-700 font-black text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <PhoneCall size={14} className="text-purple-600" />
                          <span className="blur-[3px] select-none">{sup.contactPhone ? sup.contactPhone.replace(/\d/g, "*") : "*********"}</span>
                          <span className="text-[8px] bg-purple-200 px-1 py-0.5 rounded text-purple-850">VIP</span>
                        </button>
                      );
                    }
                  })()}

                  <button
                    onClick={() => {
                      setTargetRawMaterial({
                        id: `gen-${sup.id}`,
                        name: `درخواست مواد اولیه از ${sup.companyName}`,
                        category: sup.category,
                        supplierName: sup.companyName,
                        supplierLocation: sup.location,
                        unit: "حجم درخواستی",
                        minOrder: "استعلام متغیر",
                        priceEstimate: "استعلام مستقیم",
                        deliveryDays: "۲ الی ۴ روز",
                        specs: [],
                        description: sup.description,
                        imageUrl: "",
                        isVerified: true
                      });
                      setShowOrderRawModal(true);
                    }}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-md"
                  >
                    <Send size={14} />
                    <span>ارسال مستقیم استعلام خرید</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL 1: FACTORY DETAILS MODAL */}
      <AnimatePresence>
        {selectedFactoryModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
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
                        src={selectedFactoryModal.logoUrl || selectedFactoryModal.logo} 
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
                      <span key={idx} className="text-xs bg-emerald-50 text-emerald-800 px-3 py-1 rounded-xl font-bold border border-emerald-100">
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
                  {(reviewsMap[selectedFactoryModal.id] || reviewsMap['default'] || []).map((rev) => (
                    <div key={rev.id} className="bg-slate-50 border border-slate-100 p-3.5 rounded-2xl space-y-2 text-xs">
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
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
                    className="w-full py-3 bg-slate-900 text-white font-black text-xs rounded-xl hover:bg-slate-800 transition-all cursor-pointer"
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
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
                    className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs rounded-xl shadow-lg transition-all cursor-pointer"
                  >
                    ثبت نهایی تامین‌کننده
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
