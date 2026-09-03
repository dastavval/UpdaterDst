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
  Cpu,
  MessageSquare,
  ThumbsUp,
  Award,
  Crown,
  Medal,
  TrendingUp,
  CheckCircle2,
  PackageCheck,
  Truck,
  Pin,
  Boxes,
  Layers,
  Send,
  Lock,
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
  LayoutGrid,
  List,
  ShieldAlert,
  Briefcase,
  Wrench,
  Calculator,
  Paintbrush,
  FileCheck,
  CheckSquare,
  Handshake,
  ArrowLeftRight,
  HelpCircle,
  Megaphone,
  Plus,
  ShoppingCart,
  SlidersHorizontal,
  RotateCcw
} from "lucide-react";
import { 
  INITIAL_RAW_MATERIALS, 
  INITIAL_RAW_SUPPLIERS, 
  RawMaterial, 
  RawMaterialSupplier 
} from "../data/rawMaterialsData";
import { Product, FactoryProfile } from "../types";
import FactoryDedicatedPage from "./FactoryDedicatedPage";
import { isWarehouseBrand } from "../utils/api-utils";
import BarterHall from "./BarterHall";
import { LUXURY_PRESET_BADGES, DEFAULT_INDUSTRIAL_PARKS, DEFAULT_PROVINCES } from "./AdminFactoriesManagement";

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
  isNationalBrand?: boolean;
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
  emptyCapacityPercent?: number;
  factoryHealthLicense?: string;
  // Enhanced Factory Customization & Badges
  industrialPark?: string;
  isFirstHand?: boolean;
  badge?: string;
  selectedBadges?: string[];
  factoryCode?: string;
  personnelCount?: number;
  activeProductionLines?: number;
  factoryArea?: string;
  isoCertificates?: string[];
  ownedBrands?: string[];
  province?: string;
  city?: string;
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
  initialSubTab?: 'factories' | 'raw_materials' | 'services' | 'equipment' | 'barter' | 'rfqs' | 'capacity_ads';
  theme?: 'light' | 'dark';
  userBadge?: string;
  user?: any;
  onUpdateB2bConfig?: (updatedConfig: any) => Promise<void>;
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
  status?: string;
  rejectionReason?: string;
}

export interface IndustrialEquipmentItem {
  id: string;
  title: string;
  category: string;
  factoryName: string;
  contactPerson: string;
  contactPhone: string;
  location: string;
  quantity: string;
  wholesalePrice: string;
  marketPrice: string;
  buyerProfit: string;
  description: string;
  imageUrl?: string;
  isPendingApproval?: boolean;
  status?: string;
  rejectionReason?: string;
}

const EQUIPMENT_CATEGORIES = [
  "همه تجهیزات",
  "ماشین‌آلات بسته‌بندی",
  "میکسر و بلندر صنعتی",
  "خطوط تولید و مخازن استیل",
  "پرکن و لیبل‌زن",
  "تجهیزات حرارتی و برودتی",
  "سایر قطعات و ملزومات خط"
];

const INITIAL_EQUIPMENT: IndustrialEquipmentItem[] = [
  {
    id: "eq-1",
    title: "دستگاه پیلوپک افقی فول اتوماتیک بسته‌بندی کیک، کلوچه و شکلات",
    category: "ماشین‌آلات بسته‌بندی",
    factoryName: "ماشین‌سازی تکنوپک تبریز",
    contactPerson: "مهندس صادقی",
    contactPhone: "۰۹۱۲۱۱۱۴۴۵۵",
    location: "تبریز - شهرک صنعتی سلیمی",
    quantity: "۲ دستگاه آماده تحویل",
    wholesalePrice: "۲۸۰,۰۰۰,۰۰۰ تومان",
    marketPrice: "۳۴۰,۰۰۰,۰۰۰ تومان",
    buyerProfit: "۶۰,۰۰۰,۰۰۰ تومان",
    description: "مجهز به سیستم هوشمند PLC دلتا، سروو موتور سه‌محوره، چشم الکترونیک تشخیص فتوسل و بدنه تمام استیل ۳۰۴ ضدزنگ با سرعت بسته‌بندی ۱۲۰ بسته در دقیقه.",
    imageUrl: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=600",
    status: "approved",
    isPendingApproval: false
  },
  {
    id: "eq-2",
    title: "میکسر هموژنایزر تحت خلاء ۵۰۰ لیتری صنایع غذایی و سس",
    category: "میکسر و بلندر صنعتی",
    factoryName: "استیل‌سازان پیشرو پارس",
    contactPerson: "مهندس مرادی",
    contactPhone: "۰۹۱۲۳۳۳۷۷۸۸",
    location: "اصفهان - شهرک صنعتی جی",
    quantity: "۱ دستگاه نو",
    wholesalePrice: "۴۲۰,۰۰۰,۰۰۰ تومان",
    marketPrice: "۵۱۰,۰۰۰,۰۰۰ تومان",
    buyerProfit: "۹۰,۰۰۰,۰۰۰ تومان",
    description: "مخزن سه‌جداره استیل ۳۱۶ با سیستم خلاء و هیدرولیک، مناسب فرآوری انواع سس، امولسیون، شکلات صبحانه و ژل خوراکی با گارانتی ۱۸ ماهه.",
    imageUrl: "https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&q=80&w=600",
    status: "approved",
    isPendingApproval: false
  },
  {
    id: "eq-3",
    title: "خط کامل پرکن و درب‌بند مایعات رقیق و غلیظ ۴ نازله اتوماتیک",
    category: "پرکن و لیبل‌زن",
    factoryName: "صنایع ماشین‌سازی پارس فیلر",
    contactPerson: "مهندس موسوی",
    contactPhone: "۰۹۱۲۴۴۴۹۹۰۰",
    location: "تهران - شهرک صنعتی شمس‌آباد",
    quantity: "۱ خط کامل",
    wholesalePrice: "۳۶۰,۰۰۰,۰۰۰ تومان",
    marketPrice: "۴۴۰,۰۰۰,۰۰۰ تومان",
    buyerProfit: "۸۰,۰۰۰,۰۰۰ تومان",
    description: "دارای سیستم سیلندر پیستونی فوق دقیق بدون چکه، مناسب انواع آبمیوه، روغن خوراکی، شربت، سرکه و گلاب با نوار نقاله استیل ۶ متری.",
    imageUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=600",
    status: "approved",
    isPendingApproval: false
  }
];

const SERVICE_CATEGORIES = [
  "همه خدمات صنعتی",
  "طراحی صنعتی و بسته‌بندی",
  "ترخیص کالا و امور گمرکی",
  "تبلیغات، برندینگ و مارکتینگ",
  "حسابداری، حسابرسی و مالیات",
  "آزمایشگاه و کنترل کیفیت",
  "حمل‌ونقل، لجستیک و ترانزیت"
];

const INITIAL_INDUSTRIAL_SERVICES: IndustrialServiceItem[] = [
  {
    id: "srv-1",
    title: "طراحی و مهندسی قالب‌های بادی و تزریقی ظروف و پریفرم مواد غذایی",
    category: "طراحی صنعتی و بسته‌بندی",
    providerName: "قالب‌سازی پیشرو صنعت البرز",
    location: "کرج - شهرک بهارستان",
    rating: 5,
    deliveryDays: "۷ روز کاری",
    rate: "پروژه‌ای / تعرفه رسمی کارشناسی",
    description: "طراحی سه‌بعدی CAD/CAM، ساخت و ماشین‌کاری CNC فوق دقیق ۵ محوره انواع قالب‌های بطری، جار، درب آسان‌بازشو و ظروف IML.",
    capabilities: ["طراحی سه‌بعدی پیشرفته CAD/CAM", "ماشین‌کاری CNC ۵ محوره", "ارائه نمونه اولیه ۳D Print قبل از ساخت"],
    imageUrl: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&q=80&w=600",
    status: "approved",
    isPendingApproval: false
  },
  {
    id: "srv-2",
    title: "ترخیص تخصصی مواد اولیه و اسانس از گمرک بازرگان، رجایی و فرودگاه امام",
    category: "ترخیص کالا و امور گمرکی",
    providerName: "شرکت ترخیص و بازرگانی آریا ترانزیت",
    location: "تهران / هرمزگان",
    rating: 4.9,
    deliveryDays: "۳ تا ۵ روز کاری",
    rate: "کارمزد ۲٪ ارزش CIF",
    description: "اخذ فوری ثبت سفارش، دریافت سریع تاییدیه سازمان غذا و دارو (سیب سلامت وارداتی) و بارگیری مستقیم به انبار کارخانه با کد ترخیص اختصاصی.",
    capabilities: ["کارت بازرگانی حقوقی معتبر", "اخذ مجوز بهداشت و استاندارد فوری", "حمل اختصاصی ترانزیت جاده‌ای با پلمپ گمرکی"],
    imageUrl: "https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&q=80&w=600",
    status: "approved",
    isPendingApproval: false
  },
  {
    id: "srv-3",
    title: "آزمایشگاه همکار استاندارد، کنترل کیفیت و آزمون‌های تخصصی COA",
    category: "آزمایشگاه و کنترل کیفیت",
    providerName: "آزمایشگاه جامع کنترل کیفیت رازی",
    location: "تهران - پژوهشگاه صنایع غذایی",
    rating: 5,
    deliveryDays: "۲۴ تا ۴۸ ساعت",
    rate: "بر اساس تعرفه مصوب آزمون‌ها",
    description: "انجام کلیه آزمون‌های میکروبیولوژی، شیمیایی، سنجش فلزات سنگین، باقیمانده سموم و آفلاتوکسین و صدور برگه COA رسمی جهت صادرات و اخذ مجوز.",
    capabilities: ["دارای گواهینامه ISO 17025", "سیستم نمونه‌برداری از درب کارخانه", "صدور نتایج الکترونیکی معتبر بین‌المللی"],
    imageUrl: "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&q=80&w=600",
    status: "approved",
    isPendingApproval: false
  },
  {
    id: "srv-4",
    title: "خدمات چاپ تخصصی هلیوگراور و فلکسو لمینت ۳ لایه ساشه و پاکت زیپ‌دار",
    category: "طراحی صنعتی و بسته‌بندی",
    providerName: "مجتمع چاپ و بسته‌بندی آرین‌پک",
    location: "اصفهان - شهرک صنعتی جی",
    rating: 4.8,
    deliveryDays: "۵ روز کاری",
    rate: "محاسبه بر اساس مترمربع / تناژ سفارش",
    description: "چاپ هلیو تا ۱۰ رنگ با کیفیت فتوگرافیک، لمینت سالونت‌لس غذایی Food Grade و تولید پاکت‌های سه‌طرف دوخت، ایستاده زیپ‌دار و وکیوم.",
    capabilities: ["چاپ هلیو ۱۰ رنگ HD", "لمینت سالونت‌لس فودگرید بدون حلال", "تولید پاکت گاست‌دار و ایستاده زیپ‌کیپ"],
    imageUrl: "https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&q=80&w=600",
    status: "approved",
    isPendingApproval: false
  }
];

// Initial mock reviews
const INITIAL_REVIEWS: Record<string, FactoryReviewItem[]> = {};

// Factory Card Component - Redesigned to be Clean, Elegant, Creative, Responsive & Competitively Ranked
const FactoryCard = React.memo(({ factory, idx, onSelect, onOrder, b2bConfig, onQuickView }: { 
  factory: any; 
  idx: number; 
  onSelect: (f: any) => void; 
  onOrder: (name: string) => void;
  b2bConfig?: any;
  onQuickView?: (f: any) => void;
}) => {
  const cover = getDisplayImageUrl(factory.coverUrl || "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800");
  const desc = factory.description || factory.desc || "تولیدکننده رسمی محصولات استاندارد با پروانه بهره‌برداری وزارت صمت و خطوط مکانیزه تولید.";
  const categoryLabel = factory.category || "صنایع غذایی و مصرفی";
  const established = factory.establishedYear || factory.established || "۱۳۸۰";
  const location = factory.city || factory.location || factory.province || "شهرک صنعتی";
  const isFeatured = factory.isFeatured || factory.isPinned || factory.isPremium || factory.isNationalBrand;
  const ratingScore = factory.rating || 5;
  const logo = getDisplayImageUrl(factory.logoUrl || factory.logo || "🏭");
  const isFirstHand = factory.isFirstHand !== false;
  const industrialPark = factory.industrialPark || (factory.location?.includes("شهرک صنعتی") ? factory.location : location);

  // Competitive gamification & standing metrics
  const rank = idx + 1;
  const competitiveScore = useMemo(() => {
    if (rank === 1) return 99;
    if (rank === 2) return 97;
    if (rank === 3) return 95;
    return Math.max(82, 94 - idx * 2);
  }, [rank, idx]);

  const capacity = factory.emptyCapacityPercent !== undefined 
    ? Number(factory.emptyCapacityPercent) 
    : (idx % 3 === 0 ? 35 : (idx % 3 === 1 ? 20 : 15));

  const dispatchSpeed = idx % 2 === 0 ? "۲۴ الی ۴۸ ساعت" : "حداکثر ۷۲ ساعت";

  const competitiveEdge = useMemo(() => {
    if (rank === 1) return "صدرنشین تامین و سفارشات تکراری پلتفرم";
    if (rank === 2) return "بیشترین نرخ تکمیل سفارش در ۲۴ ساعت";
    if (rank === 3) return "کف قیمت مصوب کارخانه با تخفیف نقدی";
    if (isFeatured) return "برند ملی برگزیده با گرید A+ وزارت صمت";
    if (capacity > 25) return `تخفیف پله‌ای تا ۵٪ با سفارش پالتی (${toPersianNum(capacity)}٪ ظرفیت آزاد)`;
    return "ارسال مستقیم پای بارگیر با بارنامه رسمی صمت";
  }, [rank, isFeatured, capacity]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "80px" }}
      whileHover={{ y: -6 }}
      onClick={() => onSelect(factory)}
      className={`factory-card group relative bg-white rounded-2xl sm:rounded-3xl border transition-all duration-300 overflow-hidden flex flex-col justify-between text-right cursor-pointer shadow-xs hover:shadow-xl ${
        isFeatured 
          ? "border-amber-400/90 shadow-amber-500/10 ring-2 ring-amber-400/20 hover:border-amber-500" 
          : "border-slate-200/90 hover:border-emerald-500/80 hover:shadow-emerald-900/5"
      }`}
    >
      {/* Top Media Section: Balanced Height Cover with Integrated Floating Badges */}
      <div className="relative h-36 sm:h-40 shrink-0 overflow-hidden bg-slate-950">
        <img 
          src={cover} 
          alt={factory.name} 
          loading="lazy"
          className="w-full h-full object-cover opacity-75 group-hover:scale-105 group-hover:opacity-85 transition-all duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/30 to-slate-950/60" />

        {/* Top Header Bar: Competitive League Badge + Direct Producer Status */}
        <div className="absolute top-3 inset-x-3.5 flex items-center justify-between z-20">
          {/* League Rank Badge */}
          {rank === 1 ? (
            <div className="bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-slate-950 px-2.5 py-1 rounded-xl text-[10px] font-black flex items-center gap-1.5 shadow-md border border-amber-200/60">
              <Crown size={12} className="fill-slate-950" />
              <span>رتبه ۱ کشوری</span>
            </div>
          ) : rank === 2 ? (
            <div className="bg-gradient-to-r from-slate-100 to-slate-200 text-slate-900 px-2.5 py-1 rounded-xl text-[10px] font-black flex items-center gap-1.5 shadow-md border border-white/70">
              <Medal size={12} className="text-slate-700" />
              <span>رتبه ۲ رقابتی</span>
            </div>
          ) : rank === 3 ? (
            <div className="bg-gradient-to-r from-amber-700 to-amber-800 text-amber-50 px-2.5 py-1 rounded-xl text-[10px] font-black flex items-center gap-1.5 shadow-md border border-amber-600/40">
              <Medal size={12} className="text-amber-200" />
              <span>رتبه ۳ رقابتی</span>
            </div>
          ) : (
            <div className="bg-slate-900/80 backdrop-blur-md text-emerald-400 border border-white/15 px-2.5 py-1 rounded-xl text-[10px] font-black flex items-center gap-1 shadow-sm">
              <TrendingUp size={11} className="text-emerald-400" />
              <span>رتبه #{toPersianNum(rank)} لیگ</span>
            </div>
          )}

          {/* First-Hand / Verified Tag */}
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-black backdrop-blur-md border ${
            isFirstHand 
              ? "bg-emerald-950/70 text-emerald-200 border-emerald-400/30" 
              : "bg-black/50 text-slate-200 border-white/10"
          }`}>
            {isFirstHand ? <Sparkles size={11} className="text-amber-400" /> : <Factory size={11} />}
            <span>{isFirstHand ? "تولیدکننده مستقیم" : "تامین‌کننده تایید شده"}</span>
          </span>
        </div>

        {/* Industrial Park / Location Badge at Cover Bottom-Left */}
        <div className="absolute bottom-2.5 left-3.5 z-20">
          <span className="inline-flex items-center gap-1 text-[10px] font-black text-white/90 bg-black/50 backdrop-blur-md px-2.5 py-0.5 rounded-lg border border-white/10">
            <MapPin size={11} className="text-emerald-400 shrink-0" />
            <span className="truncate max-w-[140px]">{industrialPark}</span>
          </span>
        </div>

        {/* Floating Brand Logo Badge at Cover Bottom-Right */}
        <div className="absolute -bottom-4 right-3.5 z-30 w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white p-2 shadow-lg border border-slate-100 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
          {logo && typeof logo === 'string' && (logo.startsWith('http') || logo.startsWith('data:image/') || logo.includes('.')) ? (
            <img 
              src={logo} 
              alt={factory.name} 
              className="w-full h-full object-contain mix-blend-multiply" 
              referrerPolicy="no-referrer"
            />
          ) : (
            <Building2 size={32} className="text-slate-300 group-hover:text-emerald-600 transition-colors" />
          )}
          
          {/* Verified Official Tick */}
          <div className="absolute -top-1.5 -left-1.5 bg-white rounded-full p-0.5 shadow-sm border border-slate-100">
            <CheckCircle2 size={13} className="text-emerald-600 fill-emerald-100" />
          </div>
        </div>
      </div>

      {/* Main Content Body */}
      <div className="p-4 sm:p-5 pt-6 flex-1 flex flex-col justify-between gap-3.5">
        <div className="space-y-3">
          {/* Title & Category Row */}
          <div>
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-base sm:text-lg font-black text-slate-900 group-hover:text-emerald-700 transition-colors truncate">
                {factory.name}
              </h3>
              <div className="flex items-center gap-1 bg-amber-50 text-amber-800 border border-amber-200/80 px-2 py-0.5 rounded-lg text-[10px] font-black shrink-0">
                <Star size={10} fill="currentColor" className="text-amber-500" />
                <span>{toPersianNum(ratingScore)}</span>
              </div>
            </div>

            <div className="flex items-center flex-wrap gap-1.5 mt-1.5 text-[10px] font-black text-slate-500">
              <span className="bg-slate-100 px-2 py-0.5 rounded-md text-slate-600 border border-slate-200/60">
                {categoryLabel}
              </span>
              <span>•</span>
              <span>تاسیس {toPersianNum(established)}</span>
              <span>•</span>
              <span className="text-slate-400">{factory.factoryCode || `FAC-${1000 + idx}`}</span>
            </div>
          </div>

          {/* Short Factory Description */}
          <p className="text-[12px] text-slate-500 font-medium leading-relaxed line-clamp-2">
            {desc}
          </p>

          {/* Competitive Platform Score Micro-Bar */}
          <div className="space-y-1 bg-slate-50/70 p-2.5 rounded-xl border border-slate-150">
            <div className="flex items-center justify-between text-[10.5px] font-bold">
              <span className="text-slate-600 flex items-center gap-1">
                <TrendingUp size={12} className="text-emerald-600" />
                شاخص رقابت‌پذیری تامین
              </span>
              <span className="font-black text-emerald-700">٪{toPersianNum(competitiveScore)} ممتاز</span>
            </div>
            <div className="w-full h-1.5 bg-slate-200/70 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-l from-emerald-500 via-teal-500 to-emerald-600 rounded-full transition-all duration-700" 
                style={{ width: `${competitiveScore}%` }} 
              />
            </div>
          </div>

          {/* 3-Column Competitive Metric Strip */}
          <div className="grid grid-cols-3 gap-1.5 p-2 rounded-xl bg-slate-50/80 border border-slate-150 text-center">
            <div className="flex flex-col items-center justify-center">
              <span className="text-[9px] font-bold text-slate-400">تحویل بار</span>
              <span className="text-[11px] font-black text-slate-800 truncate max-w-full">{dispatchSpeed}</span>
            </div>
            <div className="flex flex-col items-center justify-center border-x border-slate-200/80 px-1">
              <span className="text-[9px] font-bold text-slate-400">ظرفیت خط</span>
              <span className="text-[11px] font-black text-emerald-700">٪{toPersianNum(capacity)} آزاد</span>
            </div>
            <div className="flex flex-col items-center justify-center">
              <span className="text-[9px] font-bold text-slate-400">تضمین نرخ</span>
              <span className="text-[11px] font-black text-slate-800">کف کارخانه</span>
            </div>
          </div>

          {/* Dynamic Competitive Edge Banner */}
          <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-emerald-50/80 border border-emerald-200/70 text-[11px] font-bold text-emerald-800">
            <span className="truncate">{competitiveEdge}</span>
            <Zap size={13} className="text-amber-500 shrink-0 mr-1" />
          </div>
        </div>

        {/* Footer Actions: High-Contrast Touch Friendly Buttons */}
        <div className="pt-3 border-t border-slate-100 flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onSelect(factory); }}
            className={`flex-1 flex items-center justify-center gap-1 py-2.5 px-2.5 rounded-xl sm:rounded-2xl text-[11px] sm:text-[12.5px] font-black transition-all active:scale-95 shadow-xs cursor-pointer ${
              isFeatured 
                ? "bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/20" 
                : "bg-slate-900 hover:bg-emerald-600 text-white shadow-slate-900/10"
            }`}
          >
            <Eye size={14} />
            <span className="whitespace-nowrap">ورود به غرفه</span>
          </button>

          <button
            type="button"
            id={`quick-view-btn-${factory.id || idx}`}
            onClick={(e) => { e.stopPropagation(); onQuickView?.(factory); }}
            className="flex-1 flex items-center justify-center gap-1 py-2.5 px-2.5 rounded-xl sm:rounded-2xl text-[11px] sm:text-[12.5px] font-black transition-all active:scale-95 border border-slate-200 bg-slate-50 hover:bg-slate-150 hover:text-slate-900 text-slate-700 cursor-pointer shadow-2xs"
          >
            <Search size={13} />
            <span className="whitespace-nowrap">مشاهده سریع</span>
          </button>

          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onOrder(factory.name); }}
            className="w-10 h-9 sm:w-11 sm:h-10 flex items-center justify-center rounded-xl sm:rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-black transition-all active:scale-95 cursor-pointer shadow-xs shrink-0"
            title="ثبت استعلام یا سفارش مستقیم"
          >
            <ShoppingBag size={15} />
          </button>
        </div>
      </div>
    </motion.div>
  );
});

// Compact List View Item - Competitive & Responsive
const FactoryListRow = React.memo(({ factory, idx, onSelect, onOrder, onQuickView }: { 
  factory: any; 
  idx: number; 
  onSelect: (f: any) => void; 
  onOrder: (name: string) => void;
  onQuickView?: (f: any) => void;
}) => {
  const isFeatured = factory.isFeatured || factory.isPinned || factory.isPremium || factory.isNationalBrand;
  const logo = getDisplayImageUrl(factory.logoUrl || factory.logo || "🏭");
  const location = factory.city || factory.location || factory.province || "قطب صنعتی";
  const capacity = factory.emptyCapacityPercent !== undefined 
    ? Number(factory.emptyCapacityPercent) 
    : (idx % 3 === 0 ? 35 : (idx % 3 === 1 ? 20 : 15));

  const rank = idx + 1;
  const competitiveScore = rank === 1 ? 99 : rank === 2 ? 97 : rank === 3 ? 95 : Math.max(82, 94 - idx * 2);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 15 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ scale: 1.005 }}
      onClick={() => onSelect(factory)}
      className={`group bg-white rounded-2xl p-3.5 sm:p-4 border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer mb-3 ${
        isFeatured 
          ? "border-amber-400 shadow-md ring-1 ring-amber-400/20" 
          : "border-slate-200 hover:border-emerald-500 shadow-xs hover:shadow-md"
      }`}
    >
      <div className="flex items-center gap-3.5 min-w-0">
        {/* League Rank Pin */}
        <div className="shrink-0">
          {rank === 1 ? (
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-500 text-slate-950 flex items-center justify-center font-black shadow-xs">
              <Crown size={15} />
            </div>
          ) : rank === 2 ? (
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-slate-200 to-slate-300 text-slate-800 flex items-center justify-center font-black shadow-xs">
              <Medal size={15} />
            </div>
          ) : rank === 3 ? (
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-700 to-amber-800 text-amber-50 flex items-center justify-center font-black shadow-xs">
              <Medal size={15} />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center font-black text-xs border border-slate-200">
              #{toPersianNum(rank)}
            </div>
          )}
        </div>

        {/* Inset Logo Frame */}
        <div className="w-14 h-14 rounded-2xl p-1.5 bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-xs">
          {logo && typeof logo === 'string' && (logo.startsWith('http') || logo.includes('.')) ? (
            <img src={logo} alt={factory.name} className="w-full h-full object-contain mix-blend-multiply" />
          ) : (
            <Building2 size={24} className="text-slate-300" />
          )}
        </div>

        {/* Main Info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-sm sm:text-base font-black text-slate-900 group-hover:text-emerald-700 transition-colors truncate">
              {factory.name}
            </h3>
            {isFeatured && (
              <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md text-[10px] font-black border border-amber-200 shrink-0">
                برند ملی
              </span>
            )}
          </div>
          <div className="flex items-center flex-wrap gap-2.5 text-[11px] font-bold text-slate-500">
            <span className="flex items-center gap-1 text-slate-700">
              <MapPin size={12} className="text-emerald-600" />
              {location}
            </span>
            <span>•</span>
            <span>{factory.category || "صنایع غذایی"}</span>
            <span>•</span>
            <span className="text-emerald-700 font-black">شاخص رقابت ٪{toPersianNum(competitiveScore)}</span>
          </div>
        </div>
      </div>

      {/* Right Side Stats & Actions */}
      <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0">
        <div className="flex flex-col items-start sm:items-end text-[10px] font-black text-slate-400">
          <span>ظرفیت آزاد OEM</span>
          <span className="text-emerald-700 font-black text-xs">٪{toPersianNum(capacity)}</span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onQuickView?.(factory); }}
            className="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            title="مشاهده سریع اطلاعات کارخانه"
          >
            <Search size={15} />
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onSelect(factory); }}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition-colors cursor-pointer ${
              isFeatured ? "bg-amber-600 text-white hover:bg-amber-700" : "bg-slate-900 text-white hover:bg-emerald-600"
            }`}
          >
            مشاهده غرفه
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onOrder(factory.name); }}
            className="w-9 h-9 flex items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors cursor-pointer"
            title="خرید عمده مستقیم"
          >
            <ShoppingBag size={16} />
          </button>
        </div>
      </div>
    </motion.div>
  );
});

const INITIAL_RFQS: any[] = [];

export default function FactoriesView({ 
  factories = [], 
  products = [],
  b2bConfig,
  onSelectFactoryForOrder,
  onSelectProductForOrder,
  initialFactoryId,
  initialSubTab = 'factories',
  theme = 'light',
  userBadge,
  user,
  onUpdateB2bConfig
}: FactoriesViewProps) {
  // Main Sub-Tab State: 'factories' | 'raw_materials' | 'services' | 'equipment' | 'barter' | 'rfqs' | 'capacity_ads'
  const [activeSubTab, setActiveSubTab] = useState<'factories' | 'raw_materials' | 'services' | 'equipment' | 'barter' | 'rfqs' | 'capacity_ads'>(initialSubTab);

  useEffect(() => {
    if (initialSubTab) {
      setActiveSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  useEffect(() => {
    const handleSubTabEvent = (e: any) => {
      if (e.detail?.subTab) {
        setActiveSubTab(e.detail.subTab);
      }
    };
    window.addEventListener("change-factories-subtab", handleSubTabEvent);
    return () => window.removeEventListener("change-factories-subtab", handleSubTabEvent);
  }, []);

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

  // Factory Filter States - Enhanced with Industrial Park, Province, First-Hand, and Sorting
  const [selectedCategory, setSelectedCategory] = useState("همه صنایع");
  const [selectedIndustrialPark, setSelectedIndustrialPark] = useState("همه شهرک‌ها");
  const [selectedProvince, setSelectedProvince] = useState("همه استان‌ها");
  const [onlyFirstHand, setOnlyFirstHand] = useState(false);
  const [onlyLuxuryBadges, setOnlyLuxuryBadges] = useState(false);
  const [sortBy, setSortBy] = useState<'featured' | 'capacity' | 'rating' | 'personnel'>('featured');
  const [searchQuery, setSearchQuery] = useState("");
  const [viewLayout, setViewLayout] = useState<'grid' | 'list'>('grid');
  const [onlyWithEmptyCapacity, setOnlyWithEmptyCapacity] = useState(false);
  const [selectedFactoryModal, setSelectedFactoryModal] = useState<FactoryItem | null>(null);
  const [quickViewFactory, setQuickViewFactory] = useState<any | null>(null);

  // EMPTY CAPACITY ADS STATES
  const [capacityAdsList, setCapacityAdsList] = useState<any[]>(() => {
    if (b2bConfig?.capacityAds && Array.isArray(b2bConfig.capacityAds)) {
      return b2bConfig.capacityAds;
    }
    try {
      const saved = localStorage.getItem("dastavval_capacity_ads");
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return [];
  });

  const [selectedCapCategory, setSelectedCapCategory] = useState("همه صنایع");
  const [searchCapQuery, setSearchCapQuery] = useState("");
  const [showAddCapacityModal, setShowAddCapacityModal] = useState(false);
  const [showSubmitCooperationModal, setShowSubmitCooperationModal] = useState(false);
  const [selectedCapacityAd, setSelectedCapacityAd] = useState<any | null>(null);

  // New Capacity Ad form
  const [newCapTitle, setNewCapTitle] = useState("");
  const [newCapFactoryName, setNewCapFactoryName] = useState("");
  const [newCapCat, setNewCapCat] = useState("نوشیدنی و آبمیوه");
  const [newCapLocation, setNewCapLocation] = useState("");
  const [newCapPhone, setNewCapPhone] = useState("");
  const [newCapMinQty, setNewCapMinQty] = useState("");
  const [newCapDetails, setNewCapDetails] = useState("");
  const [newCapDesc, setNewCapDesc] = useState("");
  const [uploadedCapImageBase64, setUploadedCapImageBase64] = useState<string | null>(null);
  const [capAdSuccessMsg, setCapAdSuccessMsg] = useState("");

  // New Cooperation Request form
  const [reqCoopBrand, setReqCoopBrand] = useState("");
  const [reqCoopContact, setReqCoopContact] = useState("");
  const [reqCoopPhone, setReqCoopPhone] = useState("");
  const [reqCoopProduct, setReqCoopProduct] = useState("");
  const [reqCoopQty, setReqCoopQty] = useState("");
  const [reqCoopNotes, setReqCoopNotes] = useState("");
  const [coopSubmittedCode, setCoopSubmittedCode] = useState<string | null>(null);

  // Raw Materials States with persistence
  const [rawMaterialsList, setRawMaterialsList] = useState<RawMaterial[]>(() => {
    if (b2bConfig?.rawMaterialAds && Array.isArray(b2bConfig.rawMaterialAds)) {
      return b2bConfig.rawMaterialAds;
    }
    try {
      const saved = localStorage.getItem("dastavval_raw_materials");
      if (saved !== null) return JSON.parse(saved);
    } catch (e) {}
    return INITIAL_RAW_MATERIALS;
  });

  const [suppliersList, setSuppliersList] = useState<RawMaterialSupplier[]>(() => {
    try {
      const saved = localStorage.getItem("dastavval_raw_suppliers");
      if (saved !== null) return JSON.parse(saved);
    } catch (e) {}
    return INITIAL_RAW_SUPPLIERS;
  });

  const [selectedRawCategory, setSelectedRawCategory] = useState("همه مواد اولیه");
  const [searchRawQuery, setSearchRawQuery] = useState("");

  // Industrial & Commercial Services States with persistence
  const [servicesList, setServicesList] = useState<IndustrialServiceItem[]>(() => {
    if (b2bConfig?.serviceAds && Array.isArray(b2bConfig.serviceAds)) {
      return b2bConfig.serviceAds;
    }
    try {
      const saved = localStorage.getItem("dastavval_industrial_services");
      if (saved !== null) return JSON.parse(saved);
    } catch (e) {}
    return INITIAL_INDUSTRIAL_SERVICES;
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
  const [isDraggingSrvImage, setIsDraggingSrvImage] = useState(false);

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

  // Industrial Equipment States with persistence
  const [equipmentList, setEquipmentList] = useState<IndustrialEquipmentItem[]>(() => {
    if (b2bConfig?.equipmentAds && Array.isArray(b2bConfig.equipmentAds)) {
      return b2bConfig.equipmentAds;
    }
    try {
      const saved = localStorage.getItem("dastavval_industrial_equipment");
      if (saved !== null) return JSON.parse(saved);
    } catch (e) {}
    return INITIAL_EQUIPMENT;
  });

  const [selectedEquipmentCategory, setSelectedEquipmentCategory] = useState("همه تجهیزات");
  const [searchEquipmentQuery, setSearchEquipmentQuery] = useState("");
  const [targetEquipment, setTargetEquipment] = useState<IndustrialEquipmentItem | null>(null);
  const [showOrderEquipmentModal, setShowOrderEquipmentModal] = useState(false);
  const [showAddEquipmentModal, setShowAddEquipmentModal] = useState(false);

  // New Equipment Form State
  const [newEqTitle, setNewEqTitle] = useState("");
  const [newEqCat, setNewEqCat] = useState("ماشین‌آلات بسته‌بندی");
  const [newEqFactory, setNewEqFactory] = useState("");
  const [newEqContactPerson, setNewEqContactPerson] = useState("");
  const [newEqContactPhone, setNewEqContactPhone] = useState("");
  const [newEqLocation, setNewEqLocation] = useState("");
  const [newEqQuantity, setNewEqQuantity] = useState("۱ دستگاه");
  const [newEqWholesalePrice, setNewEqWholesalePrice] = useState("");
  const [newEqMarketPrice, setNewEqMarketPrice] = useState("");
  const [newEqBuyerProfit, setNewEqBuyerProfit] = useState("");
  const [newEqDesc, setNewEqDesc] = useState("");
  const [eqSuccessMsg, setEqSuccessMsg] = useState("");
  const [uploadedEqImageBase64, setUploadedEqImageBase64] = useState<string | null>(null);

  // Equipment Order Request State
  const [reqEqFactoryName, setReqEqFactoryName] = useState("");
  const [reqEqContactPhone, setReqEqContactPhone] = useState("");
  const [reqEqCity, setReqEqCity] = useState("");
  const [reqEqDetails, setReqEqDetails] = useState("");

  // RFQ (Request For Quote) & Supplier Bids State
  const [rfqOrders, setRfqOrders] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem("dastavval_raw_orders");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter(r => r && !r.id?.startsWith("RFQ-9041") && !r.id?.startsWith("RFQ-8812") && !r.id?.startsWith("RFQ-7520"));
        }
      }
    } catch (e) {}
    return [];
  });

  const [selectedRfqForBid, setSelectedRfqForBid] = useState<any | null>(null);
  const [showSubmitBidModal, setShowSubmitBidModal] = useState(false);
  const [bidSupplierName, setBidSupplierName] = useState("");
  const [bidSupplierPhone, setBidSupplierPhone] = useState("");
  const [bidPrice, setBidPrice] = useState("");
  const [bidDeliveryDays, setBidDeliveryDays] = useState("۳ روز کاری");
  const [bidNotes, setBidNotes] = useState("");
  const [bidSuccessMsg, setBidSuccessMsg] = useState("");
  const [rfqSearchQuery, setRfqSearchQuery] = useState("");
  const [rfqTypeFilter, setRfqTypeFilter] = useState("همه");

  // Sync effect from localStorage / Admin Panel actions
  useEffect(() => {
    const handleSync = () => {
      try {
        if (b2bConfig?.rawMaterialAds && Array.isArray(b2bConfig.rawMaterialAds)) {
          setRawMaterialsList(b2bConfig.rawMaterialAds);
        } else {
          const savedMat = localStorage.getItem("dastavval_raw_materials");
          if (savedMat !== null) setRawMaterialsList(JSON.parse(savedMat));
        }

        if (b2bConfig?.serviceAds && Array.isArray(b2bConfig.serviceAds)) {
          setServicesList(b2bConfig.serviceAds);
        } else {
          const savedSrv = localStorage.getItem("dastavval_industrial_services");
          if (savedSrv !== null) setServicesList(JSON.parse(savedSrv));
        }

        if (b2bConfig?.equipmentAds && Array.isArray(b2bConfig.equipmentAds)) {
          setEquipmentList(b2bConfig.equipmentAds);
        } else {
          const savedEq = localStorage.getItem("dastavval_industrial_equipment");
          if (savedEq !== null) setEquipmentList(JSON.parse(savedEq));
        }

        if (b2bConfig?.capacityAds && Array.isArray(b2bConfig.capacityAds)) {
          setCapacityAdsList(b2bConfig.capacityAds);
        } else {
          const savedCap = localStorage.getItem("dastavval_capacity_ads");
          if (savedCap !== null) setCapacityAdsList(JSON.parse(savedCap));
        }

        const savedRfqs = localStorage.getItem("dastavval_raw_orders");
        if (savedRfqs) {
          const parsed = JSON.parse(savedRfqs);
          if (Array.isArray(parsed)) {
            const real = parsed.filter(r => r && !r.id?.startsWith("RFQ-9041") && !r.id?.startsWith("RFQ-8812") && !r.id?.startsWith("RFQ-7520"));
            setRfqOrders(real);
          }
        }
      } catch (e) {}
    };

    handleSync();

    window.addEventListener("dastavval-ads-sync", handleSync);
    window.addEventListener("dastavval_ads_updated", handleSync);
    window.addEventListener("dastavval_orders_updated", handleSync);
    window.addEventListener("storage", handleSync);
    return () => {
      window.removeEventListener("dastavval-ads-sync", handleSync);
      window.removeEventListener("dastavval_ads_updated", handleSync);
      window.removeEventListener("dastavval_orders_updated", handleSync);
      window.removeEventListener("storage", handleSync);
    };
  }, [b2bConfig]);

  // Pre-fill user information into all modals and requests automatically
  useEffect(() => {
    if (user) {
      const userComp = user.company || user.name || "";
      const userPh = user.phone || user.mobile || "";
      const userCt = user.city || "";
      const userName = user.name || user.company || "";

      setBuyerFactoryName(prev => prev || userComp);
      setBuyerPhone(prev => prev || userPh);
      setBuyerCity(prev => prev || userCt);

      setReqFactoryName(prev => prev || userComp);
      setReqContactPhone(prev => prev || userPh);
      setReqCity(prev => prev || userCt);

      setReqEqFactoryName(prev => prev || userComp);
      setReqEqContactPhone(prev => prev || userPh);
      setReqEqCity(prev => prev || userCt);

      setNewMatSupName(prev => prev || userComp);
      setNewMatPhone(prev => prev || userPh);
      setNewMatSupLocation(prev => prev || userCt);

      setNewSrvProvider(prev => prev || userComp);
      setNewSrvPhone(prev => prev || userPh);
      setNewSrvLocation(prev => prev || userCt);

      setNewEqFactory(prev => prev || userComp);
      setNewEqContactPerson(prev => prev || userName);
      setNewEqContactPhone(prev => prev || userPh);
      setNewEqLocation(prev => prev || userCt);

      setBidSupplierName(prev => prev || userComp);
      setBidSupplierPhone(prev => prev || userPh);
    }
  }, [user]);

  const filteredRfqOrders = useMemo(() => {
    return rfqOrders.filter(rfq => {
      // Type Filter
      if (rfqTypeFilter === "مواد اولیه" && rfq.type !== "raw_material") return false;
      if (rfqTypeFilter === "تجهیزات صنعتی" && rfq.type !== "equipment") return false;
      if (rfqTypeFilter === "خدمات صنعتی" && rfq.type !== "service") return false;

      // Search Query
      if (!rfqSearchQuery.trim()) return true;
      const q = rfqSearchQuery.toLowerCase();
      const titleMatch = (rfq.materialName || rfq.title || "").toLowerCase().includes(q);
      const buyerMatch = (rfq.buyerFactoryName || rfq.requester || "").toLowerCase().includes(q);
      const cityMatch = (rfq.buyerCity || "").toLowerCase().includes(q);
      const codeMatch = String(rfq.id || "").toLowerCase().includes(q);

      return titleMatch || buyerMatch || cityMatch || codeMatch;
    });
  }, [rfqOrders, rfqTypeFilter, rfqSearchQuery]);

  const handleSubmitBidForRfq = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRfqForBid || !bidSupplierName.trim() || !bidSupplierPhone.trim() || !bidPrice.trim()) return;

    const currentCommissionRate = b2bConfig?.commissionRate ?? (() => {
      try {
        const saved = localStorage.getItem("dastavval_b2b_config");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (typeof parsed.commissionRate === 'number') return parsed.commissionRate;
        }
      } catch(e){}
      return 5;
    })();

    const newBid = {
      id: `bid-${Date.now()}`,
      supplierName: bidSupplierName.trim(),
      supplierPhone: bidSupplierPhone.trim(),
      proposedPrice: bidPrice.trim(),
      deliveryDays: bidDeliveryDays.trim() || "۳ روز کاری",
      notes: bidNotes.trim() || "کالا/خدمت موجود و آماده ارائه پس از هماهنگی واسطه‌گری دست‌اول.",
      createdAt: new Date().toLocaleDateString('fa-IR'),
      status: "pending",
      approved: false
    };

    const updatedRfqs = rfqOrders.map(rfq => {
      if (String(rfq.id) === String(selectedRfqForBid.id)) {
        const existingBids = Array.isArray(rfq.bids) ? rfq.bids : [];
        return {
          ...rfq,
          bids: [newBid, ...existingBids],
          updatedAt: new Date().toISOString()
        };
      }
      return rfq;
    });

    setRfqOrders(updatedRfqs);
    try {
      localStorage.setItem("dastavval_raw_orders", JSON.stringify(updatedRfqs));
    } catch (err) {}

    window.dispatchEvent(new CustomEvent("dastavval_ads_updated"));
    window.dispatchEvent(new CustomEvent("dastavval_orders_updated"));

    setBidSuccessMsg("پیشنهاد تامین شما با موفقیت ثبت شد و جهت بررسی به مدیریت ارسال گردید. پس از تایید ادمین، پیشنهاد شما در تالار عمومی منتشر و قابل مشاهده خواهد بود.");
    setTimeout(() => {
      setShowSubmitBidModal(false);
      setSelectedRfqForBid(null);
      setBidSuccessMsg("");
      setBidSupplierName("");
      setBidSupplierPhone("");
      setBidPrice("");
      setBidDeliveryDays("۳ روز کاری");
      setBidNotes("");
    }, 2500);
  };
  const [eqOrderSubmittedCode, setEqOrderSubmittedCode] = useState<string | null>(null);

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

  const handleSrvImageFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("لطفاً فقط فایل تصویر معتبر انتخاب کنید.");
      return;
    }
    const result = await uploadToParsPackStorage(file, "services");
    if (result.success && result.url) {
      setUploadedSrvImageBase64(result.url);
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result && typeof e.target.result === "string") {
          setUploadedSrvImageBase64(e.target.result);
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

    if (onUpdateB2bConfig && b2bConfig) {
      const existingRawAds = Array.isArray(b2bConfig.rawMaterialAds) ? b2bConfig.rawMaterialAds : [];
      onUpdateB2bConfig({
        ...b2bConfig,
        rawMaterialAds: [newMat, ...existingRawAds]
      }).catch(e => console.error("Failed to sync raw material ad with server:", e));
    }

    window.dispatchEvent(new CustomEvent("dastavval_ads_updated"));

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
    let list: FactoryItem[] = [];
    if (factories && factories.length > 0) {
      list = factories;
    } else if (b2bConfig?.factories && Array.isArray(b2bConfig.factories) && b2bConfig.factories.length > 0) {
      list = b2bConfig.factories.filter((f: any) => f && f.isActive !== false);
    } else if (products && products.length > 0) {
      const validBrands = Array.from(new Set(products.map(p => p.brand).filter(Boolean)))
        .filter(b => !isWarehouseBrand(b))
        .filter(b => {
          // Robust matching: trim and lowercase for comparison
          const brandName = b.toString().trim().toLowerCase();
          const configMatch = b2bConfig?.factories?.find((f: any) => {
            const fName = (f.name || "").toString().trim().toLowerCase();
            return fName === brandName || fName.includes(brandName) || brandName.includes(fName);
          });
          return configMatch ? configMatch.isActive !== false : true;
        });

      list = validBrands.map((bName, idx) => {
        const sample = products.find(p => p.brand === bName);
        const fullName = bName.startsWith("صنایع") || bName.startsWith("گروه") || bName.startsWith("کارخانه")
          ? bName
          : `گروه صنایع ${bName}`;

        let park = DEFAULT_INDUSTRIAL_PARKS[idx % DEFAULT_INDUSTRIAL_PARKS.length];
        let prov = DEFAULT_PROVINCES[idx % DEFAULT_PROVINCES.length];
        let cName = "شهرک صنعتی";
        let badges = ["first-hand-origin"];

        const bLower = bName.toLowerCase();
        if (bLower.includes("چی‌توز") || bLower.includes("دینا")) {
          park = "شهرک صنعتی شمس‌آباد";
          prov = "تهران";
          cName = "ری";
          badges = ["first-hand-origin", "amin-al-zarb", "brand-melli"];
        } else if (bLower.includes("شیرین عسل")) {
          park = "شهرک صنعتی شهید سلیمی تبریز";
          prov = "آذربایجان شرقی";
          cName = "تبریز";
          badges = ["first-hand-origin", "amin-al-zarb", "national-standard"];
        } else if (bLower.includes("سن‌ایچ") || bLower.includes("عالیفرد")) {
          park = "شهرک صنعتی کاوه ساوه";
          prov = "مرکزی";
          cName = "ساوه";
          badges = ["first-hand-origin", "sib-salalamat", "brand-melli"];
        } else if (bLower.includes("زر") || bLower.includes("ماکارون")) {
          park = "شهرک صنعتی اشتهارد";
          prov = "البرز";
          cName = "اشتهارد";
          badges = ["first-hand-origin", "industry-4", "national-standard"];
        } else if (bLower.includes("میهن")) {
          park = "شهرک صنعتی بهارستان";
          prov = "تهران";
          cName = "اسلامشهر";
          badges = ["first-hand-origin", "brand-melli", "industry-4"];
        } else if (bLower.includes("پگاه")) {
          park = "شهرک صنعتی مورچه‌خورت اصفهان";
          prov = "اصفهان";
          cName = "شاهین‌شهر";
          badges = ["first-hand-origin", "sib-salalamat", "national-standard"];
        } else if (bLower.includes("گلرنگ")) {
          park = "شهرک صنعتی اشتهارد";
          prov = "البرز";
          cName = "اشتهارد";
          badges = ["first-hand-origin", "amin-al-zarb", "brand-melli"];
        } else if (bLower.includes("رامک")) {
          park = "شهرک صنعتی بزرگ شیراز";
          prov = "فارس";
          cName = "شیراز";
          badges = ["first-hand-origin", "sib-salalamat", "brand-melli"];
        } else {
          badges = ["first-hand-origin", idx % 2 === 0 ? "amin-al-zarb" : "sib-salalamat"];
        }

        return {
          id: `fac-auto-${idx}`,
          factoryCode: `FAC-${1000 + idx}`,
          name: fullName,
          rating: 4.8 + ((idx * 3) % 3) * 0.1,
          reviewsCount: 42 + (idx * 9) % 50,
          location: `${prov}، ${park}`,
          province: prov,
          city: cName,
          industrialPark: park,
          isFirstHand: true,
          badge: badges[0],
          selectedBadges: badges,
          personnelCount: 180 + (idx * 45) % 400,
          activeProductionLines: 4 + (idx * 2) % 8,
          factoryArea: `${15000 + (idx * 3500) % 35000} مترمربع`,
          emptyCapacityPercent: (idx % 3 === 0) ? 35 : (idx % 3 === 1 ? 20 : 0),
          logoUrl: sample?.brandLogoUrl || sample?.image_url,
          category: sample?.category || "صنایع غذایی و بهداشتی",
          establishedYear: 1375 + (idx * 3) % 30,
          description: `تولیدکننده رسمی محصولات ${bName} در ${park} با پروانه بهره‌برداری وزارت صمت، خطوط پیشرفته و تضمین تامین دست اول بدون واسطه.`,
          capacity: "ظرفیت تولید کامل صنعتی",
          mainProducts: products.filter(p => p.brand === bName).map(p => p.name).slice(0, 3)
        };
      });
    }
    try {
      const localUsers = JSON.parse(localStorage.getItem("dastavval_local_users") || "{}");
      const localUsersList = Object.values(localUsers).filter((u: any) => u.userRole === 'factory' || u.role === 'factory' || u.status === 'active');
      
      const finalResult = list.map((f: any, idx: number) => {
        // Find matching local user by factoryCode, id, or company name
        const matchingUser = localUsersList.find((u: any) => 
          u.factoryCode === f.factoryCode || 
          u.id === f.id || 
          (u.company && f.name && u.company.trim().toLowerCase() === f.name.trim().toLowerCase()) ||
          (u.name && f.name && u.name.trim().toLowerCase() === f.name.trim().toLowerCase())
        ) as any;

        const defaultPark = DEFAULT_INDUSTRIAL_PARKS[idx % DEFAULT_INDUSTRIAL_PARKS.length];
        const defaultProv = DEFAULT_PROVINCES[idx % DEFAULT_PROVINCES.length];

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
            location: matchingUser.city || f.location || f.city || defaultProv,
            province: f.province || matchingUser.province || defaultProv,
            city: matchingUser.city || f.city || "شهرک صنعتی",
            industrialPark: f.industrialPark || matchingUser.industrialPark || defaultPark,
            isFirstHand: matchingUser.isFirstHand !== undefined ? matchingUser.isFirstHand : (f.isFirstHand !== undefined ? f.isFirstHand : true),
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
            factoryHealthLicense: matchingUser.factoryHealthLicense,
            badge: f.badge || matchingUser.badge || "first-hand-origin",
            selectedBadges: (f.selectedBadges && f.selectedBadges.length > 0) ? f.selectedBadges : (matchingUser.selectedBadges || (f.badge ? [f.badge] : ["first-hand-origin", "amin-al-zarb"])),
            personnelCount: f.personnelCount || matchingUser.personnelCount || 260,
            activeProductionLines: f.activeProductionLines || matchingUser.activeProductionLines || 5,
            factoryArea: f.factoryArea || matchingUser.factoryArea || "۲۲,۰۰۰ مترمربع",
            isoCertificates: f.isoCertificates || matchingUser.isoCertificates,
            ownedBrands: f.ownedBrands || matchingUser.ownedBrands,
            factoryCode: f.factoryCode || matchingUser.factoryCode
          };
        }
        return {
          ...f,
          industrialPark: f.industrialPark || defaultPark,
          province: f.province || f.location || defaultProv,
          city: f.city || "شهرک صنعتی",
          isFirstHand: f.isFirstHand !== undefined ? f.isFirstHand : true,
          badge: f.badge || "first-hand-origin",
          selectedBadges: (f.selectedBadges && f.selectedBadges.length > 0) ? f.selectedBadges : (f.badge ? [f.badge] : ["first-hand-origin", "amin-al-zarb"]),
          personnelCount: f.personnelCount || 240,
          activeProductionLines: f.activeProductionLines || 6,
          factoryArea: f.factoryArea || "۲۵,۰۰۰ مترمربع"
        };
      });

      return finalResult.filter((f: any) => f && f.isActive !== false);
    } catch (e) {
      console.warn("Could not merge local factory users:", e);
      return list.filter((f: any) => f && f.isActive !== false);
    }
  }, [factories, b2bConfig?.factories, products]);

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
      type: targetRawMaterial ? "raw_material" : "raw_material",
      materialName: targetRawMaterial ? targetRawMaterial.name : "درخواست عمومی مواد اولیه",
      supplierName: targetRawMaterial ? targetRawMaterial.supplierName : "ارسال به کلیه تامین‌کنندگان",
      buyerFactoryName: buyerFactoryName.trim(),
      buyerPhone: buyerPhone.trim(),
      buyerQty: buyerQty.trim(),
      buyerCity: buyerCity.trim() || "تعیین نشده",
      buyerNotes: buyerNotes.trim(),
      createdAt: new Date().toLocaleDateString('fa-IR'),
      status: "در حال دریافت پیشنهاد تامین",
      bids: []
    };

    const updated = [newOrder, ...rfqOrders];
    setRfqOrders(updated);

    // Save in localStorage for persistence
    try {
      localStorage.setItem("dastavval_raw_orders", JSON.stringify(updated));
    } catch (e) {}

    window.dispatchEvent(new CustomEvent("dastavval_orders_updated"));
    window.dispatchEvent(new CustomEvent("dastavval_ads_updated"));

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

  // Filter factories with Industrial Park, Province, First-Hand, and Capacity filters
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

    // Industrial Park Filter
    const matchesPark = selectedIndustrialPark === "همه شهرک‌ها" || 
      fac.industrialPark === selectedIndustrialPark || 
      (fac.location && fac.location.includes(selectedIndustrialPark));

    // Province Filter
    const matchesProvince = selectedProvince === "همه استان‌ها" || 
      fac.province === selectedProvince || 
      (fac.location && fac.location.includes(selectedProvince));

    // First Hand Filter
    const matchesFirstHand = !onlyFirstHand || fac.isFirstHand !== false;

    // Luxury Badges Filter
    const matchesLuxury = !onlyLuxuryBadges || (
      (fac.selectedBadges && fac.selectedBadges.length > 0) || Boolean(fac.badge)
    );

    const q = searchQuery.trim().toLowerCase();
    const matchesSearch = !q || (
      facName.toLowerCase().includes(q) ||
      (fac.industrialPark && fac.industrialPark.toLowerCase().includes(q)) ||
      (fac.province && fac.province.toLowerCase().includes(q)) ||
      (fac.city && fac.city.toLowerCase().includes(q)) ||
      (fac.location && fac.location.toLowerCase().includes(q)) ||
      (fac.description && fac.description.toLowerCase().includes(q)) ||
      (fac.desc && fac.desc.toLowerCase().includes(q)) ||
      (fac.mainProducts && Array.isArray(fac.mainProducts) && fac.mainProducts.some(p => typeof p === 'string' && p.toLowerCase().includes(q)))
    );

    // Empty capacity check
    const capacityPercent = fac.emptyCapacityPercent !== undefined 
      ? Number(fac.emptyCapacityPercent) 
      : (fac.id === "fac-1" ? 40 : (fac.id === "fac-2" ? 0 : 35));
    const matchesCapacity = !onlyWithEmptyCapacity || capacityPercent > 0;

    return matchesCategory && matchesPark && matchesProvince && matchesFirstHand && matchesLuxury && matchesSearch && matchesCapacity && fac.isActive !== false;
  });

  // SORTING RULE: Featured / Pinned / Premium factories ALWAYS come FIRST, then sorted by user selection
  const sortedFactories = [...filteredFactories].sort((a, b) => {
    if (!a || !b) return 0;
    const aFeatured = (a.isFeatured || a.isPinned || a.isPremium || a.isNationalBrand) ? 1 : 0;
    const bFeatured = (b.isFeatured || b.isPinned || b.isPremium || b.isNationalBrand) ? 1 : 0;
    if (bFeatured !== aFeatured) return bFeatured - aFeatured;

    if (sortBy === 'capacity') {
      const aCap = a.emptyCapacityPercent !== undefined ? Number(a.emptyCapacityPercent) : 0;
      const bCap = b.emptyCapacityPercent !== undefined ? Number(b.emptyCapacityPercent) : 0;
      return bCap - aCap;
    }

    if (sortBy === 'rating') {
      const aRating = a.rating || 5;
      const bRating = b.rating || 5;
      return bRating - aRating;
    }

    if (sortBy === 'personnel') {
      const aPersonnel = Number(a.personnelCount) || 0;
      const bPersonnel = Number(b.personnelCount) || 0;
      return bPersonnel - aPersonnel;
    }

    const aViews = (a.id && viewsMap[a.id]) || a.viewsCount || 1000;
    const bViews = (b.id && viewsMap[b.id]) || b.viewsCount || 1000;
    return bViews - aViews;
  });

  // Filter Raw Materials (ONLY APPROVED items appear publicly)
  const filteredRawMaterials = rawMaterialsList.filter(mat => {
    const isApproved = mat.status === 'approved' || (!mat.isPendingApproval && mat.status !== 'pending' && mat.status !== 'در حال بررسی' && mat.status !== 'rejected');
    const matchesCategory = selectedRawCategory === "همه مواد اولیه" || mat.category === selectedRawCategory;
    const q = searchRawQuery.trim().toLowerCase();
    const matchesSearch = !q || (
      mat.name.toLowerCase().includes(q) ||
      mat.supplierName.toLowerCase().includes(q) ||
      mat.description.toLowerCase().includes(q)
    );
    return isApproved && matchesCategory && matchesSearch;
  });

  // Filter Industrial Services (ONLY APPROVED items appear publicly)
  const filteredServices = servicesList.filter(srv => {
    const isApproved = srv.status === 'approved' || (!srv.isPendingApproval && srv.status !== 'pending' && srv.status !== 'در حال بررسی' && srv.status !== 'rejected');
    const matchesCategory = selectedServiceCategory === "همه خدمات صنعتی" || srv.category === selectedServiceCategory;
    const q = searchServiceQuery.trim().toLowerCase();
    const matchesSearch = !q || (
      srv.title.toLowerCase().includes(q) ||
      srv.providerName.toLowerCase().includes(q) ||
      srv.description.toLowerCase().includes(q) ||
      srv.location.toLowerCase().includes(q)
    );
    return isApproved && matchesCategory && matchesSearch;
  });

  // Filter Industrial Equipment (ONLY APPROVED items appear publicly)
  const filteredEquipment = equipmentList.filter(eq => {
    const isApproved = eq.status === 'approved' || (!eq.isPendingApproval && eq.status !== 'pending' && eq.status !== 'در حال بررسی' && eq.status !== 'rejected');
    const matchesCategory = selectedEquipmentCategory === "همه تجهیزات" || eq.category === selectedEquipmentCategory;
    const q = searchEquipmentQuery.trim().toLowerCase();
    const matchesSearch = !q || (
      eq.title.toLowerCase().includes(q) ||
      eq.factoryName.toLowerCase().includes(q) ||
      eq.description.toLowerCase().includes(q) ||
      eq.location.toLowerCase().includes(q)
    );
    return isApproved && matchesCategory && matchesSearch;
  });

  // Handle Register Industrial Equipment
  const handleRegisterEquipment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEqTitle.trim() || !newEqFactory.trim() || !newEqWholesalePrice.trim()) return;

    const sampleEqImages: Record<string, string> = {
      "ماشین‌آلات بسته‌بندی": "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=600",
      "میکسر و بلندر صنعتی": "https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&q=80&w=600",
      "پرکن و لیبل‌زن": "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=600",
      "خطوط تولید و مخازن استیل": "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=600",
      "تجهیزات حرارتی و برودتی": "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=600",
      "سایر قطعات و ملزومات خط": "https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&q=80&w=600"
    };

    const newEq: IndustrialEquipmentItem = {
      id: `eq-${Date.now()}`,
      title: newEqTitle.trim(),
      category: newEqCat,
      factoryName: newEqFactory.trim(),
      contactPerson: newEqContactPerson.trim() || "مدیر فروش",
      contactPhone: newEqContactPhone.trim(),
      location: newEqLocation.trim() || "ایران",
      quantity: newEqQuantity.trim() || "۱ دستگاه",
      wholesalePrice: newEqWholesalePrice.trim(),
      marketPrice: newEqMarketPrice.trim() || "توافقی",
      buyerProfit: newEqBuyerProfit.trim() || "تخفیف عالی خرید مستقیم و بدون واسطه",
      description: newEqDesc.trim() || "فروش تجهیزات صنعتی کارکرده یا نو کارخانه به شرط سلامت فنی کامل.",
      imageUrl: uploadedEqImageBase64 || sampleEqImages[newEqCat] || "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=600",
      isPendingApproval: true
    };

    const updated = [newEq, ...equipmentList];
    setEquipmentList(updated);
    try {
      localStorage.setItem("dastavval_industrial_equipment", JSON.stringify(updated));
    } catch (err) {}

    if (onUpdateB2bConfig && b2bConfig) {
      const existingEqAds = Array.isArray(b2bConfig.equipmentAds) ? b2bConfig.equipmentAds : [];
      onUpdateB2bConfig({
        ...b2bConfig,
        equipmentAds: [newEq, ...existingEqAds]
      }).catch(e => console.error("Failed to sync equipment ad with server:", e));
    }

    window.dispatchEvent(new CustomEvent("dastavval_ads_updated"));

    setEqSuccessMsg("تجهیز صنعتی شما با موفقیت ثبت شد و پس از بررسی مدارک مالکیت و تایید فنی توسط کارشناسان دست‌اول در تالار تجهیزات صنعتی منتشر خواهد شد.");
    setTimeout(() => {
      setShowAddEquipmentModal(false);
      setEqSuccessMsg("");
      setNewEqTitle("");
      setNewEqFactory("");
      setNewEqContactPerson("");
      setNewEqContactPhone("");
      setNewEqLocation("");
      setNewEqQuantity("۱ دستگاه");
      setNewEqWholesalePrice("");
      setNewEqMarketPrice("");
      setNewEqBuyerProfit("");
      setNewEqDesc("");
      setUploadedEqImageBase64(null);
    }, 3500);
  };

  // Handle Order / Purchase Request for Industrial Equipment
  const handleOrderEquipmentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqEqFactoryName.trim() || !reqEqContactPhone.trim()) return;

    const trackingCode = `EQ-REQ-${Math.floor(100000 + Math.random() * 900000)}`;

    const newRfq: any = {
      id: trackingCode,
      trackingNumber: trackingCode,
      type: "equipment",
      materialName: `درخواست خرید و کارشناسی تجهیز: ${reqEqFactoryName.trim()}`,
      title: `درخواست خرید و کارشناسی تجهیز: ${reqEqFactoryName.trim()}`,
      buyerFactoryName: reqEqFactoryName.trim(),
      requester: reqEqFactoryName.trim(),
      buyerPhone: reqEqContactPhone.trim(),
      buyerCity: reqEqCity.trim() || "تعیین نشده",
      buyerNotes: reqEqDetails.trim(),
      createdAt: new Date().toLocaleDateString('fa-IR'),
      status: "در حال بررسی و قیمت‌دهی تامین‌کننده",
      bids: [],
      items: [
        {
          productId: "eq-rfq-item",
          name: `درخواست خرید تجهیز صنعتی: ${reqEqFactoryName.trim()}`,
          quantityCartons: 1,
          pricePerCarton: 0,
          totalItems: 1,
          notes: reqEqDetails.trim()
        }
      ]
    };

    // Update state & localStorage
    const updatedRfqs = [newRfq, ...rfqOrders];
    setRfqOrders(updatedRfqs);
    try {
      localStorage.setItem("dastavval_raw_orders", JSON.stringify(updatedRfqs));
    } catch (err) {}

    // Dispatch events to notify other views (Admin, etc.)
    window.dispatchEvent(new CustomEvent("dastavval_orders_updated"));
    window.dispatchEvent(new CustomEvent("dastavval_ads_updated"));

    setEqOrderSubmittedCode(trackingCode);
  };

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

    if (onUpdateB2bConfig && b2bConfig) {
      const existingSrvAds = Array.isArray(b2bConfig.serviceAds) ? b2bConfig.serviceAds : [];
      onUpdateB2bConfig({
        ...b2bConfig,
        serviceAds: [newSrv, ...existingSrvAds]
      }).catch(e => console.error("Failed to sync service ad with server:", e));
    }

    window.dispatchEvent(new CustomEvent("dastavval_ads_updated"));

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

  const filteredCapacityAds = useMemo(() => {
    return capacityAdsList.filter(ad => {
      if (selectedCapCategory !== "همه صنایع" && ad.category !== selectedCapCategory) return false;
      if (!searchCapQuery.trim()) return true;
      const q = searchCapQuery.toLowerCase();
      return (
        (ad.title || "").toLowerCase().includes(q) ||
        (ad.factoryName || "").toLowerCase().includes(q) ||
        (ad.location || "").toLowerCase().includes(q) ||
        (ad.capacityDetails || "").toLowerCase().includes(q) ||
        (ad.description || "").toLowerCase().includes(q)
      );
    });
  }, [capacityAdsList, selectedCapCategory, searchCapQuery]);

  const handleRegisterCapacityAd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCapTitle.trim() || !newCapFactoryName.trim() || !newCapPhone.trim()) return;

    const sampleImages: Record<string, string> = {
      "نوشیدنی و آبمیوه": "https://images.unsplash.com/photo-1607344645866-009c320c5ab8?auto=format&fit=crop&w=400&q=80",
      "کیک، کلوچه و بیسکویت": "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=400&q=80",
      "شوینده و بهداشتی": "https://images.unsplash.com/photo-1553456558-aff63285bdd1?auto=format&fit=crop&w=400&q=80",
      "مواد غذایی و کنسروجات": "https://images.unsplash.com/photo-1548907040-4d42b52125ca?auto=format&fit=crop&w=400&q=80",
      "لبنیات و فرآورده‌ها": "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=400&q=80"
    };

    const newAd = {
      id: `cap-${Date.now()}`,
      title: newCapTitle.trim(),
      factoryName: newCapFactoryName.trim(),
      factoryId: user?.id || `fac-custom-${Date.now()}`,
      category: newCapCat,
      location: newCapLocation.trim() || "ایران، خط تولید",
      contactPhone: newCapPhone.trim(),
      minOrderQty: newCapMinQty.trim() || "توافقی",
      capacityDetails: newCapDetails.trim() || "خطوط مجهز و مدرن با اخذ مجوزهای لازم بهداشتی.",
      description: newCapDesc.trim() || "توضیحات تکمیلی ثبت نشده است.",
      imageUrl: uploadedCapImageBase64 || sampleImages[newCapCat] || "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800",
      createdAt: new Date().toLocaleDateString('fa-IR'),
      status: "approved",
      isPendingApproval: false,
      cooperationRequests: []
    };

    const updated = [newAd, ...capacityAdsList];
    setCapacityAdsList(updated);
    try {
      localStorage.setItem("dastavval_capacity_ads", JSON.stringify(updated));
    } catch (err) {}

    if (onUpdateB2bConfig && b2bConfig) {
      const existingCapAds = Array.isArray(b2bConfig.capacityAds) ? b2bConfig.capacityAds : [];
      onUpdateB2bConfig({
        ...b2bConfig,
        capacityAds: [newAd, ...existingCapAds]
      }).catch(e => console.error("Failed to sync capacity ad with server:", e));
    }

    window.dispatchEvent(new CustomEvent("dastavval_ads_updated"));

    setCapAdSuccessMsg("آگهی ظرفیت خالی خط تولید شما با موفقیت ثبت و با تایید کارشناسان پلتفرم در تالار عمومی منتشر گردید.");
    setTimeout(() => {
      setShowAddCapacityModal(false);
      setCapAdSuccessMsg("");
      setNewCapTitle("");
      setNewCapFactoryName("");
      setNewCapLocation("");
      setNewCapPhone("");
      setNewCapMinQty("");
      setNewCapDetails("");
      setNewCapDesc("");
      setUploadedCapImageBase64(null);
    }, 3000);
  };

  const handleRegisterCooperationRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCapacityAd || !reqCoopBrand.trim() || !reqCoopPhone.trim()) return;

    const trackingCode = `OPR-${Math.floor(100000 + Math.random() * 900000)}`;

    const newRequest = {
      id: `coop-${Date.now()}`,
      adId: selectedCapacityAd.id,
      buyerName: reqCoopBrand.trim(),
      buyerPhone: reqCoopPhone.trim(),
      contactPerson: reqCoopContact.trim() || "مدیر بازرگانی",
      productRequested: reqCoopProduct.trim() || selectedCapacityAd.title,
      estimatedQty: reqCoopQty.trim() || "توافقی",
      notes: reqCoopNotes.trim() || "متقاضی عقد قرارداد تولید کارمزدی ظرفیت خالی کارخانه.",
      createdAt: new Date().toLocaleDateString('fa-IR'),
      status: "pending"
    };

    const updatedAds = capacityAdsList.map(ad => {
      if (ad.id === selectedCapacityAd.id) {
        const reqs = Array.isArray(ad.cooperationRequests) ? ad.cooperationRequests : [];
        return {
          ...ad,
          cooperationRequests: [newRequest, ...reqs]
        };
      }
      return ad;
    });

    setCapacityAdsList(updatedAds);
    try {
      localStorage.setItem("dastavval_capacity_ads", JSON.stringify(updatedAds));
    } catch (err) {}

    if (onUpdateB2bConfig && b2bConfig) {
      onUpdateB2bConfig({
        ...b2bConfig,
        capacityAds: updatedAds
      }).catch(e => console.error("Failed to sync cooperation request with server:", e));
    }

    window.dispatchEvent(new CustomEvent("dastavval_ads_updated"));

    setCoopSubmittedCode(trackingCode);
  };

  const handleCapImageUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("لطفاً فقط فایل تصویر معتبر انتخاب کنید.");
      return;
    }
    const result = await uploadToParsPackStorage(file, "capacity_ads");
    if (result.success && result.url) {
      setUploadedCapImageBase64(result.url);
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result && typeof e.target.result === "string") {
          setUploadedCapImageBase64(e.target.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-8 pb-16 text-right font-sans" dir="rtl">
      {/* Streamlined Responsive Header Card (White Theme) */}
      <div className="relative overflow-hidden bg-white text-slate-900 rounded-[2rem] p-5 sm:p-7 shadow-md border border-slate-200/90 space-y-4">
        {/* Subtle Ambient Glow accents */}
        <div className="absolute -top-20 -left-20 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

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
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full text-[10px] font-black text-emerald-800">
                <Factory size={12} className="text-emerald-600" />
                <span>کارخانجات و واحدهای تولیدی مستقیم</span>
              </div>
              <h1 className="text-base sm:text-xl font-black text-slate-900 leading-snug">
                فهرست تولیدکنندگان و تامین‌کنندگان صنایع غذایی
              </h1>
            </div>
          </div>

          {/* Clean Segmented Sub-Tab Switcher - Light Background */}
          <div className="w-full lg:w-auto flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 overflow-x-auto custom-scrollbar shrink-0">
            <button
              onClick={() => setActiveSubTab('factories')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1 whitespace-nowrap cursor-pointer ${
                activeSubTab === 'factories'
                  ? "bg-emerald-600 text-white font-black"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
              }`}
            >
              <Factory size={13} />
              <span>کارخانجات ({toPersianNum(allFactories.length)})</span>
            </button>

            <button
              onClick={() => setActiveSubTab('capacity_ads')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1 whitespace-nowrap cursor-pointer ${
                activeSubTab === 'capacity_ads'
                  ? "bg-emerald-600 text-white font-black"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
              }`}
            >
              <Megaphone size={13} />
              <span>ظرفیت خالی ({toPersianNum(capacityAdsList.filter(a => a.status === "approved" || (!a.isPendingApproval && a.status !== "pending" && a.status !== "rejected")).length)})</span>
            </button>

            <button
              onClick={() => setActiveSubTab('raw_materials')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1 whitespace-nowrap cursor-pointer ${
                activeSubTab === 'raw_materials'
                  ? "bg-emerald-600 text-white font-black"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
              }`}
            >
              <Boxes size={13} />
              <span>مواد اولیه ({toPersianNum(rawMaterialsList.filter(m => m.status === "approved" || (!m.isPendingApproval && m.status !== "pending" && m.status !== "در حال بررسی" && m.status !== "rejected")).length)})</span>
            </button>

            <button
              onClick={() => setActiveSubTab('services')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1 whitespace-nowrap cursor-pointer ${
                activeSubTab === 'services'
                  ? "bg-emerald-600 text-white font-black"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
              }`}
            >
              <Briefcase size={13} />
              <span>خدمات صنعتی ({toPersianNum(servicesList.filter(s => s.status === "approved" || (!s.isPendingApproval && s.status !== "pending" && s.status !== "در حال بررسی" && s.status !== "rejected")).length)})</span>
            </button>

            <button
              onClick={() => setActiveSubTab('equipment')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1 whitespace-nowrap cursor-pointer ${
                activeSubTab === 'equipment'
                  ? "bg-emerald-600 text-white font-black"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
              }`}
            >
              <Wrench size={13} />
              <span>تجهیزات ({toPersianNum(equipmentList.filter(e => e.status === "approved" || (!e.isPendingApproval && e.status !== "pending" && e.status !== "در حال بررسی" && e.status !== "rejected")).length)})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Dedicated Notification Banner for Logged-in Factory Users */}
      {user?.role === 'factory' && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2.5 text-right">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-lg shrink-0">
              🏭
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-black text-slate-900">حساب کارخانه شما فعال است: {user.company || user.name}</h3>
                <span className="text-[9.5px] bg-emerald-600 text-white px-2 py-0.5 rounded-md font-black">واحد رسمی</span>
              </div>
              <p className="text-[11px] text-slate-600 font-medium mt-0.5">
                برای مدیریت محصولات و خط تولید وارد پنل مدیریت شوید.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              window.dispatchEvent(new CustomEvent("change-nav-tab", { detail: { tab: 'user' } }));
            }}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs transition-all shadow-2xs shrink-0 flex items-center gap-1.5 cursor-pointer"
          >
            <span>پنل مدیریت کارخانه</span>
            <ArrowLeft size={13} />
          </button>
        </div>
      )}

      {/* SUB-TAB 1: FACTORIES DIRECTORY */}
      {activeSubTab === 'factories' && (
        <div className="space-y-4">
          {/* Category Filter Tabs & Search Bar */}
          {/* Category Filter Tabs, Industrial Park & Province Selectors, Search & Special Flags */}
          <div className="bg-white border-2 border-slate-200/80 rounded-3xl p-4 sm:p-5 shadow-sm space-y-4 text-right" dir="rtl">
            {/* Row 1: Search & Primary Filters */}
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 text-emerald-600" size={16} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="جستجوی نام کارخانه، شهرک صنعتی، شهر، برند یا محصولات..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl pr-10 pl-4 py-2.5 text-xs font-black focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-800 transition-all placeholder:text-slate-400 placeholder:font-normal"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery("")}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Geographical & Industrial Park Selectors */}
              <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
                {/* Industrial Park Dropdown */}
                <div className="relative min-w-[170px] flex-1 sm:flex-initial">
                  <select
                    value={selectedIndustrialPark}
                    onChange={(e) => setSelectedIndustrialPark(e.target.value)}
                    className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-2xl pr-3.5 pl-8 py-2.5 text-xs font-black text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                  >
                    <option value="همه شهرک‌ها">🏭 همه شهرک‌های صنعتی</option>
                    {Array.from(new Set([...DEFAULT_INDUSTRIAL_PARKS, ...(allFactories || []).map((f: any) => f.industrialPark).filter(Boolean)])).map((park) => (
                      <option key={`opt-park-${park}`} value={park}>
                        {park}
                      </option>
                    ))}
                  </select>
                  <Filter size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>

                {/* Province Dropdown */}
                <div className="relative min-w-[130px] flex-1 sm:flex-initial">
                  <select
                    value={selectedProvince}
                    onChange={(e) => setSelectedProvince(e.target.value)}
                    className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-2xl pr-3.5 pl-8 py-2.5 text-xs font-black text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                  >
                    <option value="همه استان‌ها">📍 همه استان‌ها</option>
                    {Array.from(new Set([...DEFAULT_PROVINCES, ...(allFactories || []).map((f: any) => f.province).filter(Boolean)])).map((prov) => (
                      <option key={`opt-prov-${prov}`} value={prov}>
                        استان {prov}
                      </option>
                    ))}
                  </select>
                  <MapPin size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>

                {/* Sort By Dropdown */}
                <div className="relative min-w-[140px] flex-1 sm:flex-initial">
                  <select
                    value={sortBy}
                    onChange={(e: any) => setSortBy(e.target.value)}
                    className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-2xl pr-3.5 pl-8 py-2.5 text-xs font-black text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                  >
                    <option value="featured">⭐ برگزیدگان و ممتازین</option>
                    <option value="capacity">⚡ بیشترین ظرفیت خالی</option>
                    <option value="rating">🏆 بالاترین امتیاز کیفی</option>
                    <option value="personnel">👥 مقیاس و پرسنل کارخانه</option>
                  </select>
                  <SlidersHorizontal size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Row 2: Special Filtering Quick-Chips */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100">
              <div className="flex flex-wrap items-center gap-2">
                {/* First Hand Toggle */}
                <button
                  onClick={() => setOnlyFirstHand(!onlyFirstHand)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[11px] font-black transition-all cursor-pointer whitespace-nowrap shadow-2xs ${
                    onlyFirstHand 
                      ? "bg-amber-500 text-slate-950 border-amber-400 ring-2 ring-amber-300/40" 
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <span className="text-[13px]">👑</span>
                  <span>فقط تولیدکنندگان دست اول</span>
                </button>

                {/* Luxury / Honor Badges Toggle */}
                <button
                  onClick={() => setOnlyLuxuryBadges(!onlyLuxuryBadges)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[11px] font-black transition-all cursor-pointer whitespace-nowrap shadow-2xs ${
                    onlyLuxuryBadges 
                      ? "bg-gradient-to-r from-amber-600 to-amber-700 text-white border-amber-600 ring-2 ring-amber-400/30" 
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <Award size={13} className={onlyLuxuryBadges ? "text-amber-200" : "text-amber-600"} />
                  <span>دارای نشان امین‌الضرب / نمادهای رسمی</span>
                </button>

                {/* Empty Capacity Toggle */}
                <button
                  onClick={() => setOnlyWithEmptyCapacity(!onlyWithEmptyCapacity)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[11px] font-black transition-all cursor-pointer whitespace-nowrap shadow-2xs ${
                    onlyWithEmptyCapacity 
                      ? "bg-emerald-600 text-white border-emerald-600 ring-2 ring-emerald-400/30" 
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <div className={`w-2 h-2 rounded-full ${onlyWithEmptyCapacity ? "bg-white animate-pulse" : "bg-emerald-500"}`} />
                  <span>دارای ظرفیت خالی خط (OEM)</span>
                </button>
              </div>

              {/* Layout Toggle & Status counter */}
              <div className="flex items-center justify-between w-full lg:w-auto gap-4">
                <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
                  <button
                    onClick={() => setViewLayout('grid')}
                    className={`p-1.5 rounded-lg transition-all cursor-pointer ${viewLayout === 'grid' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-400 hover:text-slate-600'}`}
                    title="نمای شبکه‌ای"
                  >
                    <LayoutGrid size={16} />
                  </button>
                  <button
                    onClick={() => setViewLayout('list')}
                    className={`p-1.5 rounded-lg transition-all cursor-pointer ${viewLayout === 'list' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-400 hover:text-slate-600'}`}
                    title="نمای لیستی"
                  >
                    <List size={16} />
                  </button>
                </div>

                <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500">
                <span>
                  نمایش <span className="text-emerald-700 font-black">{toPersianNum(sortedFactories.length)}</span> کارخانه از <span className="font-black">{toPersianNum(allFactories.length)}</span>
                </span>
                {(selectedCategory !== "همه صنایع" || selectedIndustrialPark !== "همه شهرک‌ها" || selectedProvince !== "همه استان‌ها" || onlyFirstHand || onlyLuxuryBadges || onlyWithEmptyCapacity || searchQuery) && (
                  <button
                    onClick={() => {
                      setSelectedCategory("همه صنایع");
                      setSelectedIndustrialPark("همه شهرک‌ها");
                      setSelectedProvince("همه استان‌ها");
                      setOnlyFirstHand(false);
                      setOnlyLuxuryBadges(false);
                      setOnlyWithEmptyCapacity(false);
                      setSearchQuery("");
                    }}
                    className="text-rose-600 hover:text-rose-700 font-black flex items-center gap-0.5 underline cursor-pointer"
                  >
                    <RotateCcw size={11} />
                    <span>حذف فیلترها</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Row 3: Industry Category Pills */}
            <div className="border-t border-slate-100 pt-2 flex items-center gap-2 overflow-x-auto scrollbar-none">
              {(() => {
                let dynamicCats: string[] = [];
                if (b2bConfig?.categories && b2bConfig.categories.length > 0) {
                  dynamicCats = b2bConfig.categories.map((c: any) => typeof c === 'string' ? c : (c.name || c.id));
                } else {
                  dynamicCats = Array.from(new Set(allFactories.map((f: any) => f.category).filter(Boolean)));
                }
                
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
                      className={`px-3 py-1.5 rounded-xl text-[11px] font-black transition-all shrink-0 cursor-pointer flex items-center gap-1 ${
                        isSelected
                          ? "bg-slate-900 text-white shadow-sm"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
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
              <div className="w-16 h-16 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mx-auto">
                <Factory size={32} />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-black text-slate-800">کارخانه‌ای با این مشخصات یافت نشد</h3>
                <p className="text-xs text-slate-400 font-bold max-w-md mx-auto">
                  تولیدکنندگان جدید پس از احراز هویت توسط مدیریت ثبت خواهند شد. می‌توانید فیلتر شهرک صنعتی، استان یا دسته‌بندی را تغییر دهید.
                </p>
              </div>
              <button
                onClick={() => { 
                  setSelectedCategory("همه صنایع"); 
                  setSelectedIndustrialPark("همه شهرک‌ها");
                  setSelectedProvince("همه استان‌ها");
                  setOnlyFirstHand(false);
                  setOnlyLuxuryBadges(false);
                  setOnlyWithEmptyCapacity(false);
                  setSearchQuery(""); 
                }}
                className="px-5 py-2.5 bg-emerald-600 text-white text-xs font-black rounded-xl hover:bg-emerald-700 transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
              >
                نمایش همه کارخانه‌ها و بازنشانی فیلترها
              </button>
            </div>
          ) : (
            <div id="factories-container" className={viewLayout === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 pb-10" : "flex flex-col gap-2 pb-10"}>
              {sortedFactories.map((factory, idx) => (
                <LazyViewport key={`fact-view-card-${factory.id || idx}-${idx}`} height={viewLayout === 'grid' ? "480px" : "95px"}>
                  {viewLayout === 'grid' ? (
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
                      onQuickView={setQuickViewFactory}
                    />
                  ) : (
                    <FactoryListRow
                      factory={factory}
                      idx={idx}
                      onSelect={(f) => setSelectedDedicatedFactory(f as FactoryProfile)}
                      onOrder={(name) => {
                        if (onSelectFactoryForOrder) {
                          onSelectFactoryForOrder(name);
                        }
                      }}
                      onQuickView={setQuickViewFactory}
                    />
                  )}
                </LazyViewport>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB: EMPTY CAPACITY ADS (آگهی‌های ظرفیت خالی خط تولید) */}
      {activeSubTab === 'capacity_ads' && (
        <div className="space-y-6">
          {/* Top Banner & Post Ad CTA */}
          <div className="relative overflow-hidden bg-white rounded-[2.5rem] p-6 sm:p-8 text-slate-900 border border-slate-200 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-6">
            <div className="absolute -top-10 -left-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="space-y-2 max-w-2xl text-right z-10" dir="rtl">
              <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 text-[11px] font-black px-3 py-1 rounded-full border border-emerald-200 shadow-2xs">
                <Megaphone size={14} className="text-emerald-600 animate-bounce" />
                <span>سامانه برون‌سپاری تولید و ظرفیت خالی کارخانجات (OEM/Contract Manufacturing)</span>
              </span>
              <h2 className="text-lg sm:text-2xl font-black text-slate-900 leading-snug">
                تالار واگذاری و پذیرش ظرفیت خالی خطوط تولید کشور
              </h2>
              <p className="text-xs text-slate-600 font-medium leading-relaxed font-sans">
                کارخانجات مجهز کشور، ظرفیت‌های خالی شیفت‌های تولیدی، ماشین‌آلات بسته‌بندی، فرها و فرمولاسیون اختصاصی خود را در این بخش جهت برون‌سپاری اعلام کرده‌اند. اگر شما صاحب برند، بازرگان یا متقاضی تولید هستید، بدون دغدغه احداث کارخانه، سفارش تولید کارمزدی خود را به واحدهای رسمی ارجاع دهید.
              </p>
            </div>

            <button
              onClick={() => {
                if (user?.role === "factory") {
                  setNewCapFactoryName(user.company || user.name || "");
                }
                setShowAddCapacityModal(true);
              }}
              className="px-6 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-xs sm:text-sm transition-all shadow-lg shadow-emerald-600/20 flex items-center gap-2 cursor-pointer relative z-10 hover:scale-[1.02] active:scale-[0.98]"
            >
              <PlusCircle size={18} />
              <span>📢 ثبت آگهی ظرفیت خالی کارخانه من</span>
            </button>
          </div>

          {/* Category Selector & Live Search */}
          <div className="bg-white border border-slate-200 p-6 rounded-[2.5rem] shadow-3xs space-y-4 text-right">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="space-y-1">
                <h3 className="text-xs sm:text-sm font-black text-slate-800">فیلتر و پایش آگهی‌های ظرفیت خالی</h3>
                <p className="text-[10px] text-slate-400 font-bold">بسته‌بندی قوطی، سلفون، ظروف پت، کیسه‌پرکنی و فرمولاسیون انواع صنایع</p>
              </div>

              <div className="relative w-full md:w-80">
                <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                <input
                  type="text"
                  value={searchCapQuery}
                  onChange={(e) => setSearchCapQuery(e.target.value)}
                  placeholder="جستجوی عنوان تولید، نام کارخانه، شهر یا دستگاه..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl pr-10 pl-4 py-3 text-xs font-black focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white focus:border-emerald-500 shadow-2xs transition-all text-slate-800"
                />
                {searchCapQuery && (
                  <button onClick={() => setSearchCapQuery("")} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* Categories scrollbar */}
            <div className="border-t border-slate-100 pt-3 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {["همه صنایع", "نوشیدنی و آبمیوه", "کیک، کلوچه و بیسکویت", "شوینده و بهداشتی", "مواد غذایی و کنسروجات", "لبنیات و فرآورده‌ها"].map((cat) => (
                <button
                  key={`cap-cat-btn-${cat}`}
                  onClick={() => setSelectedCapCategory(cat)}
                  className={`px-4 py-2 rounded-2xl text-xs font-black transition-all shrink-0 cursor-pointer ${
                    selectedCapCategory === cat
                      ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                      : "bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100/50"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Grid of Capacity Ads */}
          {filteredCapacityAds.length === 0 ? (
            <div className="bg-white rounded-[2.5rem] border border-slate-200 p-12 text-center space-y-4 shadow-sm">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto text-2xl">
                📢
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-black text-slate-800">هیچ آگهی ظرفیت خالی پیدا نشد</h3>
                <p className="text-xs text-slate-400 font-bold max-w-md mx-auto">
                  می‌توانید فیلتر دسته‌بندی را تغییر داده یا از نوار جستجو استفاده نمایید. همچنین خودتان می‌توانید آگهی ثبت کنید.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCapacityAds.map((ad, aIdx) => (
                <motion.div
                  key={`cap-ad-card-${ad.id || aIdx}-${aIdx}`}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-[2.5rem] border border-slate-200 hover:border-emerald-300 hover:shadow-xl transition-all p-6 flex flex-col justify-between text-right space-y-4"
                  dir="rtl"
                >
                  <div className="space-y-3">
                    <div className="relative aspect-video rounded-3xl overflow-hidden bg-slate-100 border border-slate-200 shadow-3xs">
                      <img src={ad.imageUrl || "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=600"} alt={ad.title} className="w-full h-full object-cover" />
                      <span className="absolute top-3 right-3 bg-white/90 backdrop-blur-md text-emerald-800 font-black text-[10px] px-3 py-1.5 rounded-full border border-emerald-200">
                        {ad.category}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5 text-emerald-700 text-[10px] font-black">
                        <Building2 size={13} />
                        <span>{ad.factoryName}</span>
                      </div>
                      <h3 className="text-sm font-black text-slate-900 leading-snug line-clamp-2 hover:text-emerald-700 transition-colors">
                        {ad.title}
                      </h3>
                      <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold">
                        <MapPin size={11} className="text-emerald-500" />
                        <span>{ad.location}</span>
                        <span className="w-1 h-1 rounded-full bg-slate-200" />
                        <span>انتشار: {ad.createdAt}</span>
                      </div>
                    </div>

                    {/* Specs info */}
                    <div className="bg-slate-50/70 border border-slate-100 rounded-2xl p-3 space-y-2 text-xs">
                      <div className="flex justify-between items-center text-[10px] text-slate-500">
                        <span className="font-bold">حداقل حجم پذیرش سفارش:</span>
                        <span className="font-black text-slate-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">{ad.minOrderQty}</span>
                      </div>
                      <div className="text-[10px] text-slate-600 leading-relaxed font-bold border-t border-slate-100/60 pt-2 line-clamp-2">
                        <strong className="text-slate-800">دستگاه‌ها و خطوط:</strong> {ad.capacityDetails}
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-500 font-medium leading-relaxed line-clamp-3">
                      {ad.description}
                    </p>
                  </div>

                  {/* Footer & CTA */}
                  <div className="pt-2 border-t border-slate-100 space-y-3">
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold">
                      <span>کد آگهی: {toPersianNum(ad.id)}</span>
                      <span className="text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg font-black">
                        {toPersianNum(Array.isArray(ad.cooperationRequests) ? ad.cooperationRequests.length : 0)} پیشنهاد ثبت شده
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedCapacityAd(ad);
                        setReqCoopProduct(ad.title);
                        setShowSubmitCooperationModal(true);
                      }}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3 rounded-2xl text-[11px] sm:text-xs transition-all shadow-md shadow-emerald-500/10 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                    >
                      <Handshake size={15} />
                      <span>🤝 ثبت درخواست تولید کارمزدی / همکاری</span>
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 3: RAW MATERIALS & SUPPLIES DIRECTORY */}
      {activeSubTab === 'raw_materials' && (
        <div className="space-y-6 animate-in fade-in duration-300 text-right" dir="rtl">
          {/* Top Banner */}
          <div className="relative overflow-hidden bg-white rounded-[2.5rem] p-6 sm:p-8 text-slate-900 border border-slate-200 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl z-10">
              <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-900 text-[11px] font-black px-3.5 py-1 rounded-full border border-emerald-200">
                <Boxes size={14} className="text-emerald-600" />
                <span>بورس سراسری مواد اولیه و ملزومات صنایع غذایی با تضمین امانی دست‌اول</span>
              </span>
              <h2 className="text-base sm:text-xl font-black text-slate-900">
                خرید و فروش بی‌واسطه مواد اولیه با گواهی آنالیز آزمایشگاهی (COA) و قرارداد امن
              </h2>
              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                کلیه سفارشات مواد اولیه تحت نظارت کارشناسان کنترل کیفیت دست‌اول و با سازوکار تسویه حساب امانی معامله می‌شوند تا از خلوص و تطابق نمونه اطمینان حاصل گردد.
              </p>
            </div>

            <div className="flex flex-wrap sm:flex-nowrap gap-3 w-full lg:w-auto shrink-0 z-10">
              <button
                onClick={() => {
                  setTargetRawMaterial(null);
                  setShowOrderRawModal(true);
                }}
                className="flex-1 sm:flex-initial bg-emerald-600 hover:bg-emerald-700 text-white font-black px-5 py-3 rounded-2xl text-xs transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Send size={15} />
                <span>✍️ ثبت استعلام خرید (RFQ)</span>
              </button>
              <button
                onClick={() => setShowAddRawMaterialModal(true)}
                className="flex-1 sm:flex-initial bg-slate-900 hover:bg-slate-800 text-white font-black px-5 py-3 rounded-2xl text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <Plus size={15} />
                <span>📦 ثبت و فروش ماده اولیه</span>
              </button>
              <button
                onClick={() => setShowAddSupplierModal(true)}
                className="flex-1 sm:flex-initial bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-black px-4 py-3 rounded-2xl text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Building2 size={15} className="text-emerald-600" />
                <span>ثبت‌نام تامین‌کننده</span>
              </button>
            </div>
          </div>

          {/* Search & Category Filter */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-4 shadow-xs">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-6 rounded-full bg-emerald-600" />
                <h3 className="text-sm sm:text-base font-black text-slate-900">
                  فهرست مواد اولیه فعال ({toPersianNum(filteredRawMaterials.length)} قلم کالا)
                </h3>
              </div>

              <div className="relative w-full sm:w-80">
                <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="text"
                  value={searchRawQuery}
                  onChange={(e) => setSearchRawQuery(e.target.value)}
                  placeholder="جستجوی نام ماده اولیه، تامین‌کننده یا آنالیز..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl pr-10 pl-4 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {RAW_MATERIAL_CATEGORIES.map((cat, idx) => (
                <button
                  key={`raw-filter-pill-${idx}`}
                  onClick={() => setSelectedRawCategory(cat)}
                  className={`px-4 py-2 rounded-2xl text-xs font-black transition-all shrink-0 cursor-pointer ${
                    selectedRawCategory === cat
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Raw Materials Grid */}
          {filteredRawMaterials.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-3">
              <Boxes size={48} className="mx-auto text-slate-300" />
              <h4 className="text-base font-black text-slate-800">ماده اولیه‌ای با این مشخصات یافت نشد</h4>
              <p className="text-xs text-slate-400">می‌توانید دسته‌بندی دیگری را انتخاب کنید یا استعلام خرید اختصاصی ثبت فرمایید.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRawMaterials.map((mat, idx) => (
                <motion.div
                  key={`mat-card-${mat.id || idx}-${idx}`}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-[2.5rem] border border-slate-200 hover:border-emerald-300 hover:shadow-xl transition-all p-6 flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-100 border border-slate-100">
                      <img
                        src={mat.imageUrl || "https://images.unsplash.com/photo-1587735243615-c03f25aaff15?auto=format&fit=crop&q=80&w=600"}
                        alt={mat.name}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute top-3 right-3 bg-white/95 backdrop-blur-md text-emerald-800 font-black text-[10px] px-3 py-1 rounded-full border border-emerald-200">
                        {mat.category}
                      </span>
                      {mat.escrowGuaranteed && (
                        <span className="absolute bottom-3 right-3 bg-emerald-600/90 text-white font-black text-[9px] px-2.5 py-0.5 rounded-full flex items-center gap-1">
                          <ShieldCheck size={11} />
                          <span>ضمانت امانی</span>
                        </span>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 text-emerald-700 font-black">
                          <Building2 size={13} />
                          <span>{mat.supplierName}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-medium">{mat.supplierLocation}</span>
                      </div>
                      <h4 className="text-sm font-black text-slate-900 leading-snug line-clamp-2">
                        {mat.name}
                      </h4>
                    </div>

                    {/* Specs / Price Table */}
                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 space-y-2 text-xs">
                      <div className="flex justify-between items-center text-slate-600">
                        <span className="font-medium">نرخ تقریبی:</span>
                        <span className="font-black text-emerald-700 font-mono text-xs">{mat.priceEstimate}</span>
                      </div>
                      <div className="flex justify-between items-center text-slate-600 border-t border-slate-100 pt-1.5">
                        <span className="font-medium">حداقل سفارش:</span>
                        <span className="font-bold text-slate-800">{mat.minOrder} ({mat.unit})</span>
                      </div>
                      <div className="flex justify-between items-center text-slate-600 border-t border-slate-100 pt-1.5">
                        <span className="font-medium">زمان تحویل:</span>
                        <span className="font-bold text-slate-800">{mat.deliveryDays}</span>
                      </div>
                    </div>

                    {/* Specs Tags */}
                    {mat.specs && mat.specs.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {mat.specs.map((sp, sIdx) => (
                          <span key={`mat-spec-${mat.id}-${sIdx}`} className="text-[10px] bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded-lg border border-emerald-100">
                            ✓ {sp}
                          </span>
                        ))}
                      </div>
                    )}

                    <p className="text-[11px] text-slate-500 font-medium leading-relaxed line-clamp-2">
                      {mat.description}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100">
                    <button
                      onClick={() => {
                        setTargetRawMaterial(mat);
                        setShowOrderRawModal(true);
                      }}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3 rounded-2xl text-xs transition-all shadow-md shadow-emerald-500/10 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                    >
                      <ShoppingCart size={15} />
                      <span>استعلام قیمت و خرید رسمی</span>
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 4: INDUSTRIAL & COMMERCIAL SERVICES DIRECTORY */}
      {activeSubTab === 'services' && (
        <div className="space-y-6 animate-in fade-in duration-300 text-right" dir="rtl">
          {/* Top Banner */}
          <div className="relative overflow-hidden bg-white rounded-[2.5rem] p-6 sm:p-8 text-slate-900 border border-slate-200 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl z-10">
              <span className="inline-flex items-center gap-1.5 bg-teal-50 text-teal-900 text-[11px] font-black px-3.5 py-1 rounded-full border border-teal-200">
                <Briefcase size={14} className="text-teal-600" />
                <span>سامانه خدمات صنعتی، بازرگانی، گمرکی و آزمایشگاهی دست‌اول</span>
              </span>
              <h2 className="text-base sm:text-xl font-black text-slate-900">
                ارائه و برون‌سپاری خدمات تخصصی کارخانجات با قرارداد و نظارت فنی رسمی
              </h2>
              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                از طراحی قالب و سلفون تا ترخیص گمرکی، آزمون‌های کنترل کیفی COA و حسابداری صنعتی با ضمانت امانی تحویل دست‌اول.
              </p>
            </div>

            <div className="flex flex-wrap sm:flex-nowrap gap-3 w-full lg:w-auto shrink-0 z-10">
              <button
                onClick={() => {
                  setTargetService(null);
                  setShowOrderServiceModal(true);
                }}
                className="flex-1 sm:flex-initial bg-teal-700 hover:bg-teal-800 text-white font-black px-5 py-3 rounded-2xl text-xs transition-all shadow-md shadow-teal-700/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Send size={15} />
                <span>✍️ استعلام و سفارش خدمت صنعتی</span>
              </button>
              <button
                onClick={() => setShowAddServiceModal(true)}
                className="flex-1 sm:flex-initial bg-slate-900 hover:bg-slate-800 text-white font-black px-5 py-3 rounded-2xl text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <Plus size={15} />
                <span>🛠️ ثبت و معرفی خدمت جدید</span>
              </button>
            </div>
          </div>

          {/* Search & Filter */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-4 shadow-xs">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-6 rounded-full bg-teal-600" />
                <h3 className="text-sm sm:text-base font-black text-slate-900">
                  فهرست خدمات صنعتی فعال ({toPersianNum(filteredServices.length)} خدمت)
                </h3>
              </div>

              <div className="relative w-full sm:w-80">
                <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="text"
                  value={searchServiceQuery}
                  onChange={(e) => setSearchServiceQuery(e.target.value)}
                  placeholder="جستجوی عنوان خدمت، مجری یا شهر..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl pr-10 pl-4 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {SERVICE_CATEGORIES.map((cat, idx) => (
                <button
                  key={`srv-filter-pill-${idx}`}
                  onClick={() => setSelectedServiceCategory(cat)}
                  className={`px-4 py-2 rounded-2xl text-xs font-black transition-all shrink-0 cursor-pointer ${
                    selectedServiceCategory === cat
                      ? "bg-teal-700 text-white shadow-sm"
                      : "bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Services Grid */}
          {filteredServices.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-3">
              <Briefcase size={48} className="mx-auto text-slate-300" />
              <h4 className="text-base font-black text-slate-800">خدمت صنعتی با این مشخصات یافت نشد</h4>
              <p className="text-xs text-slate-400">می‌توانید دسته‌بندی دیگری را انتخاب کنید یا درخواست استعلام اختصاصی ثبت فرمایید.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredServices.map((srv, idx) => (
                <motion.div
                  key={`srv-card-${srv.id || idx}-${idx}`}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-[2.5rem] border border-slate-200 hover:border-teal-300 hover:shadow-xl transition-all p-6 flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-100 border border-slate-100">
                      <img
                        src={srv.imageUrl || "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&q=80&w=600"}
                        alt={srv.title}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute top-3 right-3 bg-white/95 backdrop-blur-md text-teal-800 font-black text-[10px] px-3 py-1 rounded-full border border-teal-200">
                        {srv.category}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 text-teal-800 font-black">
                          <Building2 size={13} />
                          <span>{srv.providerName}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-medium">{srv.location}</span>
                      </div>
                      <h4 className="text-sm font-black text-slate-900 leading-snug line-clamp-2">
                        {srv.title}
                      </h4>
                    </div>

                    {/* Details Box */}
                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 space-y-2 text-xs">
                      <div className="flex justify-between items-center text-slate-600">
                        <span className="font-medium">تعرفه و نرخ:</span>
                        <span className="font-black text-teal-800 text-xs">{srv.rate || "استعلامی / توافقی"}</span>
                      </div>
                      <div className="flex justify-between items-center text-slate-600 border-t border-slate-100 pt-1.5">
                        <span className="font-medium">مدت زمان اجرا:</span>
                        <span className="font-bold text-slate-800">{srv.deliveryDays || "۳ تا ۵ روز کاری"}</span>
                      </div>
                    </div>

                    {/* Capabilities Tags */}
                    {srv.capabilities && srv.capabilities.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {srv.capabilities.map((cap, cIdx) => (
                          <span key={`srv-cap-${srv.id}-${cIdx}`} className="text-[10px] bg-teal-50 text-teal-800 font-bold px-2 py-0.5 rounded-lg border border-teal-100">
                            ✓ {cap}
                          </span>
                        ))}
                      </div>
                    )}

                    <p className="text-[11px] text-slate-500 font-medium leading-relaxed line-clamp-2">
                      {srv.description}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100">
                    <button
                      onClick={() => {
                        setTargetService(srv);
                        setShowOrderServiceModal(true);
                      }}
                      className="w-full bg-teal-700 hover:bg-teal-800 text-white font-black py-3 rounded-2xl text-xs transition-all shadow-md shadow-teal-700/10 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                    >
                      <Send size={15} />
                      <span>درخواست استعلام و اجرای خدمت</span>
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 5: INDUSTRIAL EQUIPMENT & MACHINERY DIRECTORY */}
      {activeSubTab === 'equipment' && (
        <div className="space-y-6 animate-in fade-in duration-300 text-right" dir="rtl">
          {/* Top Banner */}
          <div className="relative overflow-hidden bg-white rounded-[2.5rem] p-6 sm:p-8 text-slate-900 border border-slate-200 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl z-10">
              <span className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-900 text-[11px] font-black px-3.5 py-1 rounded-full border border-indigo-200">
                <Wrench size={14} className="text-indigo-600" />
                <span>بورس واگذاری ماشین‌آلات و خطوط تولید مازاد با کارشناسی فنی</span>
              </span>
              <h2 className="text-base sm:text-xl font-black text-slate-900">
                خرید و فروش بی‌واسطه تجهیزات صنعتی و دستگاه‌های فرآوری و بسته‌بندی
              </h2>
              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                ارائه مستقیم ماشین‌آلات نو و کارکرده سالم کارخانجات همراه با امکان بازدید حضوری، تست سلامت و تسویه از طریق حساب امانی امن دست‌اول.
              </p>
            </div>

            <div className="flex flex-wrap sm:flex-nowrap gap-3 w-full lg:w-auto shrink-0 z-10">
              <button
                onClick={() => {
                  setTargetEquipment(null);
                  setShowOrderEquipmentModal(true);
                }}
                className="flex-1 sm:flex-initial bg-indigo-600 hover:bg-indigo-700 text-white font-black px-5 py-3 rounded-2xl text-xs transition-all shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Send size={15} />
                <span>✍️ استعلام و درخواست خرید دستگاه</span>
              </button>
              <button
                onClick={() => setShowAddEquipmentModal(true)}
                className="flex-1 sm:flex-initial bg-slate-900 hover:bg-slate-800 text-white font-black px-5 py-3 rounded-2xl text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <Plus size={15} />
                <span>⚙️ ثبت آگهی فروش تجهیزات</span>
              </button>
            </div>
          </div>

          {/* Search & Filter */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-4 shadow-xs">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-6 rounded-full bg-indigo-600" />
                <h3 className="text-sm sm:text-base font-black text-slate-900">
                  فهرست ماشین‌آلات فعال ({toPersianNum(filteredEquipment.length)} دستگاه)
                </h3>
              </div>

              <div className="relative w-full sm:w-80">
                <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="text"
                  value={searchEquipmentQuery}
                  onChange={(e) => setSearchEquipmentQuery(e.target.value)}
                  placeholder="جستجوی عنوان دستگاه، کارخانه یا شهر..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl pr-10 pl-4 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {EQUIPMENT_CATEGORIES.map((cat, idx) => (
                <button
                  key={`eq-filter-pill-${idx}`}
                  onClick={() => setSelectedEquipmentCategory(cat)}
                  className={`px-4 py-2 rounded-2xl text-xs font-black transition-all shrink-0 cursor-pointer ${
                    selectedEquipmentCategory === cat
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Equipment Grid */}
          {filteredEquipment.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-3">
              <Wrench size={48} className="mx-auto text-slate-300" />
              <h4 className="text-base font-black text-slate-800">تجهیز صنعتی با این مشخصات یافت نشد</h4>
              <p className="text-xs text-slate-400">می‌توانید دسته‌بندی دیگری را انتخاب کنید یا درخواست خرید دستگاه موردنظر را ثبت فرمایید.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEquipment.map((eq, idx) => (
                <motion.div
                  key={`eq-card-${eq.id || idx}-${idx}`}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-[2.5rem] border border-slate-200 hover:border-indigo-300 hover:shadow-xl transition-all p-6 flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-100 border border-slate-100">
                      <img
                        src={eq.imageUrl || "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=600"}
                        alt={eq.title}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute top-3 right-3 bg-white/95 backdrop-blur-md text-indigo-800 font-black text-[10px] px-3 py-1 rounded-full border border-indigo-200">
                        {eq.category}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 text-indigo-800 font-black">
                          <Building2 size={13} />
                          <span>{eq.factoryName}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-medium">{eq.location}</span>
                      </div>
                      <h4 className="text-sm font-black text-slate-900 leading-snug line-clamp-2">
                        {eq.title}
                      </h4>
                    </div>

                    {/* Price and Specs Box */}
                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 space-y-2 text-xs">
                      <div className="flex justify-between items-center text-slate-600">
                        <span className="font-medium">قیمت واگذاری:</span>
                        <span className="font-black text-indigo-900 font-mono text-xs">{eq.wholesalePrice}</span>
                      </div>
                      {eq.marketPrice && (
                        <div className="flex justify-between items-center text-slate-500 border-t border-slate-100 pt-1.5 text-[11px]">
                          <span>قیمت نو در بازار:</span>
                          <span className="line-through font-mono">{eq.marketPrice}</span>
                        </div>
                      )}
                      {eq.buyerProfit && (
                        <div className="flex justify-between items-center bg-emerald-50 border border-emerald-100 p-1.5 rounded-xl text-emerald-800 text-[10px] font-black">
                          <span>سود / صرفه‌جویی خریدار:</span>
                          <span className="font-mono">{eq.buyerProfit}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center text-slate-600 border-t border-slate-100 pt-1.5">
                        <span className="font-medium">موجودی / تعداد:</span>
                        <span className="font-bold text-slate-800">{eq.quantity || "۱ دستگاه"}</span>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-500 font-medium leading-relaxed line-clamp-2">
                      {eq.description}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100">
                    <button
                      onClick={() => {
                        setTargetEquipment(eq);
                        setShowOrderEquipmentModal(true);
                      }}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-3 rounded-2xl text-xs transition-all shadow-md shadow-indigo-600/10 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                    >
                      <Search size={15} />
                      <span>درخواست استعلام و بازدید فنی</span>
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeSubTab === 'barter' && (
        <div className="animate-in fade-in duration-300">
          <BarterHall user={user || { name: "میهمان", company: "کاربر دست‌اول", city: "تهران" }} />
        </div>
      )}

      {activeSubTab === 'rfqs' && (
        <div className="space-y-6">
          {/* Top Header Banner for RFQ Hall */}
          <div className="relative overflow-hidden bg-white rounded-[2.5rem] p-6 text-slate-900 border border-slate-200 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-6">
            <div className="absolute -top-10 -left-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="space-y-2 max-w-xl text-right z-10" dir="rtl">
              <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-amber-900 text-[11px] font-black px-3 py-1 rounded-full border border-emerald-200">
                <FileText size={14} className="text-emerald-600" />
                <span>تالار سراسری استعلام‌های خرید (RFQ) و تقاضای کارخانجات</span>
              </span>
              <h2 className="text-base sm:text-xl font-black text-slate-900">
                درخواست‌های خرید، تامین کالا و خدمات صادرشده توسط واحدهای تولیدی
              </h2>
              <p className="text-xs text-slate-600 font-medium leading-relaxed font-sans">
                کارخانجات خریدار نیازهای خط تولید خود را در این بخش اعلام کرده‌اند. اگر شما تامین‌کننده، تولیدکننده یا پیمانکار هستید، با کلیک بر روی <strong className="text-emerald-700 font-black">«اعلام تامین به ادمین»</strong> پیشنهاد قیمت و توانمندی خود را ثبت فرمایید تا کارشناسان دست‌اول هماهنگی معامله را انجام دهند.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto shrink-0 relative z-10">
              <button
                onClick={() => {
                  setTargetRawMaterial(null);
                  setShowOrderRawModal(true);
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-5 py-3.5 rounded-2xl text-xs transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Send size={15} />
                <span>✍️ ثبت استعلام خرید جدید (RFQ)</span>
              </button>
            </div>
          </div>

          {/* Search & Category Filter */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-7 rounded-full bg-emerald-500" />
                <h3 className="text-lg font-black text-slate-900">لیست استعلام‌های فعال خرید</h3>
              </div>

              <div className="relative w-full sm:w-80">
                <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="text"
                  value={rfqSearchQuery}
                  onChange={(e) => setRfqSearchQuery(e.target.value)}
                  placeholder="جستجوی عنوان، نام کارخانه، شهر یا کد استعلام..."
                  className="w-full bg-white border border-slate-200 rounded-2xl pr-10 pl-4 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-sm"
                />
              </div>
            </div>

            {/* Filter Chips */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              {["همه", "مواد اولیه", "تجهیزات صنعتی", "خدمات صنعتی"].map((cat, idx) => (
                <button
                  key={`rfq-filter-chip-${idx}`}
                  onClick={() => setRfqTypeFilter(cat)}
                  className={`px-4 py-2 rounded-2xl text-xs font-black transition-all shrink-0 cursor-pointer ${
                    rfqTypeFilter === cat
                      ? "bg-slate-900 text-white shadow-md"
                      : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* RFQ Items Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRfqOrders.length === 0 ? (
              <div className="col-span-full bg-white rounded-3xl p-12 text-center border border-slate-200/80 space-y-3">
                <FileText size={40} className="mx-auto text-slate-300" />
                <h4 className="text-sm font-black text-slate-700">هیچ استعلام خریدی با این مشخصات یافت نشد</h4>
                <p className="text-xs text-slate-400">می‌توانید عبارات دیگری را جستجو کنید یا استعلام خرید جدیدی ثبت فرمایید.</p>
              </div>
            ) : (
              filteredRfqOrders.map((rfq, rIdx) => {
                const allBids = Array.isArray(rfq.bids) ? rfq.bids : [];
                const approvedBids = allBids.filter((bid: any) => bid.approved === true || bid.status === "approved");
                const pendingBidsCount = allBids.filter((bid: any) => bid.status === "pending" || (!bid.status && !bid.approved)).length;

                return (
                  <motion.div
                    key={`rfq-card-${rfq.id || rIdx}-${rIdx}`}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-[2.5rem] border border-slate-200/90 p-6 space-y-5 hover:border-amber-400 hover:shadow-xl transition-all flex flex-col justify-between"
                  >
                    <div className="space-y-4">
                      {/* Header Badge & Tracking Code */}
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <span className="text-[10px] font-mono font-black bg-slate-100 text-slate-800 px-3 py-1 rounded-full border border-slate-200">
                          کد: #{rfq.id}
                        </span>
                        <span className="text-[10px] font-black bg-emerald-50 text-amber-900 border border-emerald-200 px-3 py-1 rounded-full flex items-center gap-1">
                          <Clock size={12} className="text-emerald-600" />
                          <span>{rfq.status || "در حال دریافت پیشنهاد"}</span>
                        </span>
                      </div>

                      {/* RFQ Title & Buyer */}
                      <div>
                        <h4 className="text-base font-black text-slate-900 leading-snug">
                          {rfq.materialName || rfq.title || "درخواست خرید کالا"}
                        </h4>
                        <div className="flex items-center gap-2 mt-2 text-xs font-bold text-slate-600">
                          <Building2 size={14} className="text-slate-400 shrink-0" />
                          <span>متقاضی: <strong className="text-slate-900">{rfq.buyerFactoryName || rfq.requester || "واحد تولیدی معتبر"}</strong></span>
                        </div>
                        {rfq.buyerCity && (
                          <div className="flex items-center gap-2 mt-1 text-xs font-medium text-slate-500">
                            <MapPin size={14} className="text-slate-400 shrink-0" />
                            <span>محل تحویل: {rfq.buyerCity}</span>
                          </div>
                        )}
                      </div>

                      {/* Quantity & Spec details */}
                      <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/70 space-y-2 text-xs">
                        <div className="flex justify-between items-center text-slate-700 font-black border-b border-slate-200/60 pb-2">
                          <span>میزان / حجم مورد نیاز:</span>
                          <span className="bg-emerald-100 text-emerald-900 px-2.5 py-0.5 rounded-lg font-mono">{rfq.buyerQty || "تعیین‌نشده"}</span>
                        </div>
                        {rfq.buyerNotes && (
                          <p className="text-[11px] text-slate-600 font-medium leading-relaxed pt-1">
                            <strong className="text-slate-800 font-bold block mb-0.5">توضیحات خریدار:</strong>
                            {rfq.buyerNotes}
                          </p>
                        )}
                      </div>

                      {/* Received Bids Count */}
                      <div className="flex items-center justify-between text-xs bg-emerald-50/70 border border-emerald-100 rounded-2xl p-3">
                        <span className="text-indigo-950 font-bold flex items-center gap-1.5">
                          <CheckCircle2 size={15} className="text-emerald-600" />
                          <span>پیشنهادهای تامین تاییدشده:</span>
                        </span>
                        <span className="font-black bg-emerald-600 text-white px-2.5 py-0.5 rounded-full text-[11px]">
                          {toPersianNum(approvedBids.length)} پیشنهاد
                        </span>
                      </div>

                      {/* Display Approved Bids */}
                      {approvedBids.length > 0 ? (
                        <div className="space-y-2 text-xs border-t border-slate-100 pt-3">
                          <span className="text-[11px] font-black text-slate-700 block mb-1">پیشنهادهای تاییدشده توسط مدیریت:</span>
                          {approvedBids.map((bid: any, bIdx: number) => (
                            <div key={`rfq-bid-${rfq.id}-${bIdx}`} className="bg-emerald-50/60 border border-emerald-100 p-2.5 rounded-xl text-[11px] space-y-1">
                              <div className="flex justify-between items-center">
                                <span className="font-black text-slate-900">{bid.supplierName}</span>
                                <span className="font-black text-emerald-800 bg-white px-2 py-0.5 rounded-md border border-emerald-200 font-mono">
                                  {bid.proposedPrice}
                                </span>
                              </div>
                              <div className="text-[10px] text-slate-500 font-medium flex justify-between">
                                <span>تحویل: {bid.deliveryDays}</span>
                                <span>ثبت: {bid.createdAt}</span>
                              </div>
                              {bid.notes && (
                                <p className="text-[10px] text-slate-600 bg-white/80 p-1.5 rounded-md border border-emerald-100/60 mt-1">
                                  {bid.notes}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-[11px] text-slate-500 font-medium bg-slate-50 border border-slate-100 p-2.5 rounded-xl text-center">
                          {pendingBidsCount > 0 ? (
                            <span className="text-amber-800 font-bold">
                              ⏳ {toPersianNum(pendingBidsCount)} پیشنهاد تامین ثبت‌شده و در انتظار بررسی و تایید مدیریت می‌باشد.
                            </span>
                          ) : (
                            <span>هنوز پیشنهادی برای این استعلام در تالار عمومی منتشر نشده است.</span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Action Button: Supplier Bid Trigger */}
                    <div className="pt-2">
                      <button
                        onClick={() => {
                          setSelectedRfqForBid(rfq);
                          setShowSubmitBidModal(true);
                        }}
                        className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black py-3 rounded-2xl text-xs transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Handshake size={16} />
                        <span>🤝 من این کالا/خدمت را دارم (اعلام تامین به ادمین)</span>
                      </button>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>
      )}
      <AnimatePresence>
        {quickViewFactory && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-[8px] text-right" 
            dir="rtl"
          >
            <motion.div
              initial={{ opacity: 0, y: 45, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 25, scale: 0.97 }}
              transition={{ type: "spring", damping: 28, stiffness: 220 }}
              className="rounded-3xl max-w-lg w-full p-6 space-y-6 shadow-2xl max-h-[85vh] overflow-y-auto bg-white/70 backdrop-blur-[20px]"
              style={{
                border: "2px solid transparent",
                backgroundImage: `linear-gradient(to bottom, rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0.45)), linear-gradient(135deg, ${
                  (quickViewFactory.isFeatured || quickViewFactory.isPinned || quickViewFactory.isPremium || quickViewFactory.isNationalBrand) ? "#d97706" : "#10b981"
                } 0%, rgba(255, 255, 255, 0.1) 100%)`,
                backgroundOrigin: "border-box",
                backgroundClip: "padding-box, border-box",
              }}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-4 border-b border-white/35 pb-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-14 h-14 rounded-2xl bg-white/50 border border-white/50 p-2.5 shrink-0 flex items-center justify-center shadow-2xs backdrop-blur-[4px]">
                    {quickViewFactory.logoUrl || quickViewFactory.logo ? (
                      <img 
                        src={getDisplayImageUrl(quickViewFactory.logoUrl || quickViewFactory.logo)} 
                        alt={quickViewFactory.name} 
                        className="w-full h-full object-contain mix-blend-multiply"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <Building2 size={24} className="text-slate-300" />
                    )}
                  </div>
                  <div>
                    <span className="bg-emerald-50/80 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-md border border-emerald-100/50 backdrop-blur-[2px]">
                      {quickViewFactory.category || "صنایع و معادن"}
                    </span>
                    <h3 className="text-base sm:text-lg font-black text-slate-900 mt-1">{quickViewFactory.name}</h3>
                    <p className="text-[11px] text-slate-400 font-bold mt-0.5">کد کارخانه: {quickViewFactory.factoryCode || `FAC-${quickViewFactory.id || '1001'}`}</p>
                  </div>
                </div>
                <button
                  onClick={() => setQuickViewFactory(null)}
                  className="w-8 h-8 rounded-full bg-white/50 hover:bg-white/80 border border-white/40 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Main Content Sections */}
              <div className="space-y-5">
                {/* 1. Location Details */}
                <div className="space-y-2.5">
                  <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5 border-r-3 border-emerald-500 pr-2">
                    <MapPin size={13.5} className="text-emerald-600" />
                    موقعیت جغرافیایی و کارخانه
                  </h4>
                  <div className="bg-white/45 backdrop-blur-[8px] rounded-2xl p-3.5 border border-white/40 space-y-2 text-xs text-slate-600 leading-relaxed shadow-3xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-400 min-w-[70px]">استان/شهر:</span>
                      <span className="font-black text-slate-800">
                        {quickViewFactory.province || "آذربایجان شرقی"}، {quickViewFactory.city || quickViewFactory.location || "تبریز"}
                      </span>
                    </div>
                    {quickViewFactory.industrialPark && (
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-400 min-w-[70px]">شهرک صنعتی:</span>
                        <span className="font-black text-slate-800">{quickViewFactory.industrialPark}</span>
                      </div>
                    )}
                    <div className="flex items-start gap-2">
                      <span className="font-bold text-slate-400 min-w-[70px] mt-0.5">نشانی دقیق:</span>
                      <span className="font-bold text-slate-700">
                        {quickViewFactory.address || `${quickViewFactory.province || "آذربایجان شرقی"}، ${quickViewFactory.city || "تبریز"}، ${quickViewFactory.industrialPark || "شهرک صنعتی دولتی"}`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2. Key Contact Details */}
                <div className="space-y-2.5">
                  <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5 border-r-3 border-emerald-500 pr-2">
                    <PhoneCall size={13.5} className="text-emerald-600" />
                    اطلاعات تماس مستقیم و مدیریت سفارشات
                  </h4>
                  <div className="bg-white/45 backdrop-blur-[8px] rounded-2xl p-3.5 border border-white/40 space-y-3.5 text-xs shadow-3xs">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-slate-400 font-bold block mb-1">مدیر فروش / رابط:</span>
                        <span className="text-slate-800 font-black flex items-center gap-1">
                          <Building2 size={12} className="text-slate-400" />
                          {quickViewFactory.managerName || quickViewFactory.contact || "مهندس بازرگانی"}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-bold block mb-1">شماره تماس ثابت/همراه:</span>
                        <span className="text-slate-800 font-black flex items-center gap-1" dir="ltr">
                          <PhoneCall size={12} className="text-emerald-600" />
                          {quickViewFactory.contactPhone || quickViewFactory.phone || "۰۲۱-۶۶۵۵۴۴۳۳"}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/30">
                      <div>
                        <span className="text-slate-400 font-bold block mb-1">پست الکترونیک:</span>
                        <span className="text-slate-700 font-bold break-all">
                          {quickViewFactory.email || "info@dastavval.com"}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-bold block mb-1">سایت رسمی:</span>
                        <span className="text-emerald-600 font-black flex items-center gap-1">
                          <ExternalLink size={12} className="text-emerald-500" />
                          <a href={quickViewFactory.website || "#"} target="_blank" rel="noreferrer" className="hover:underline">
                            {quickViewFactory.website ? quickViewFactory.website.replace(/^https?:\/\//, '') : "dastavval.com"}
                          </a>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Top Performing Brands */}
                <div className="space-y-2.5">
                  <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5 border-r-3 border-emerald-500 pr-2">
                    <Sparkles size={13.5} className="text-amber-500" />
                    برندهای برتر و تحت مالکیت کارخانه
                  </h4>
                  <div className="bg-white/45 backdrop-blur-[8px] rounded-2xl p-3.5 border border-white/40 space-y-3 shadow-3xs">
                    <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                      این مجموعه تولیدی مسئولیت تولید، فرآوری، تضمین اصالت و تامین بارهای مستقیم با برندهای تجاری زیر را بر عهده دارد:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {((quickViewFactory.ownedBrands && quickViewFactory.ownedBrands.length > 0) ? quickViewFactory.ownedBrands : [quickViewFactory.name]).map((bName: string, bIdx: number) => (
                        <div 
                          key={`qv-brand-${bIdx}`} 
                          className="bg-white/80 border border-emerald-200/50 rounded-xl px-3 py-1.5 flex items-center gap-2 shadow-3xs hover:border-emerald-400 transition-colors backdrop-blur-[2px]"
                        >
                          <div className="w-5 h-5 rounded-md bg-emerald-50/80 border border-emerald-100/50 flex items-center justify-center text-[10px] font-black text-emerald-700">
                            🏷️
                          </div>
                          <span className="text-xs font-black text-slate-800">{bName}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Footer */}
              <div className="pt-4 border-t border-white/35 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setQuickViewFactory(null);
                    setSelectedDedicatedFactory(quickViewFactory as FactoryProfile);
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 py-3 px-4 rounded-xl sm:rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-[13px] font-black transition-all active:scale-95 shadow-md shadow-emerald-600/10 cursor-pointer"
                >
                  <Eye size={15} />
                  <span>ورود به غرفه تخصصی کارخانه</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const name = quickViewFactory.name;
                    setQuickViewFactory(null);
                    if (onSelectFactoryForOrder) {
                      onSelectFactoryForOrder(name);
                    }
                  }}
                  className="py-3 px-5 rounded-xl sm:rounded-2xl border border-white/40 hover:border-emerald-500/50 bg-white/50 hover:bg-emerald-50/50 text-slate-700 hover:text-emerald-700 text-xs sm:text-[13px] font-black transition-all active:scale-95 cursor-pointer shadow-3xs"
                >
                  ثبت استعلام مستقیم
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
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

              {/* Luxury Badges in Modal */}
              {((selectedFactoryModal.selectedBadges && selectedFactoryModal.selectedBadges.length > 0) || selectedFactoryModal.badge) && (
                <div className="bg-gradient-to-r from-amber-500/10 via-yellow-500/5 to-amber-500/10 rounded-2xl p-3.5 border border-amber-300/80 flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-black text-amber-950 bg-amber-200/80 px-2 py-0.5 rounded-md flex items-center gap-1">
                    <Award size={12} className="text-amber-800" />
                    <span>نشان‌های عالی ملی:</span>
                  </span>
                  {selectedFactoryModal.selectedBadges && selectedFactoryModal.selectedBadges.length > 0 ? (
                    selectedFactoryModal.selectedBadges.map((bName: string, bIdx: number) => {
                      const preset = LUXURY_PRESET_BADGES.find(p => p.label === bName);
                      return (
                        <span 
                          key={`modal-badge-${bIdx}`}
                          className="bg-white text-amber-950 font-black text-[10px] px-2.5 py-1 rounded-lg border border-amber-200 shadow-2xs flex items-center gap-1"
                        >
                          <span>{preset ? preset.badgeText : bName}</span>
                        </span>
                      );
                    })
                  ) : (
                    <span className="bg-white text-amber-950 font-black text-[10px] px-2.5 py-1 rounded-lg border border-amber-200 shadow-2xs">
                      🏆 {selectedFactoryModal.badge}
                    </span>
                  )}
                </div>
              )}

              {/* Description */}
              <p className="text-xs text-slate-700 font-medium leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100">
                {selectedFactoryModal.description || selectedFactoryModal.desc}
              </p>

              {/* Technical Specifications Grid in Modal */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/70 text-right">
                  <span className="text-[10px] text-slate-400 font-bold block">ظرفیت تولید:</span>
                  <span className="text-xs font-black text-slate-900 block mt-0.5">
                    {selectedFactoryModal.dailyCapacity || selectedFactoryModal.capacity || "۵,۰۰۰ کارتن/روز"}
                  </span>
                </div>
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/70 text-right">
                  <span className="text-[10px] text-slate-400 font-bold block">پرسنل فعال:</span>
                  <span className="text-xs font-black text-slate-900 block mt-0.5">
                    {selectedFactoryModal.personnelCount ? `${toPersianNum(selectedFactoryModal.personnelCount)} نفر` : "۱۸۰ نفر متخصص"}
                  </span>
                </div>
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/70 text-right">
                  <span className="text-[10px] text-slate-400 font-bold block">خطوط مکانیزه:</span>
                  <span className="text-xs font-black text-slate-900 block mt-0.5">
                    {selectedFactoryModal.activeProductionLines ? `${toPersianNum(selectedFactoryModal.activeProductionLines)} خط تمام خودکار` : "۴ خط مکانیزه"}
                  </span>
                </div>
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/70 text-right">
                  <span className="text-[10px] text-slate-400 font-bold block">عرصه کارخانه:</span>
                  <span className="text-xs font-black text-slate-900 block mt-0.5">
                    {selectedFactoryModal.factoryArea ? toPersianNum(selectedFactoryModal.factoryArea) : "۱۴,۰۰۰ متر"}
                  </span>
                </div>
              </div>

              {/* Main Products */}
              {selectedFactoryModal.mainProducts && selectedFactoryModal.mainProducts.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-black text-slate-900">محصولات و خطوط اصلی تولید:</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedFactoryModal.mainProducts.map((p, idx) => (
                      <span key={`fact-modal-prod-${idx}-${p.slice(0, 10)}`} className="text-xs bg-emerald-50 text-emerald-900 px-3 py-1 rounded-xl font-bold border border-emerald-100">
                        ✓ {p}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* ISO Certifications in Modal */}
              {((selectedFactoryModal.isoCertificates && selectedFactoryModal.isoCertificates.length > 0) || selectedFactoryModal.factoryHealthLicense || selectedFactoryModal.healthLicense) && (
                <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100">
                  <span className="text-[10px] font-black text-slate-500">استانداردها:</span>
                  {selectedFactoryModal.isoCertificates && selectedFactoryModal.isoCertificates.map((iso: string, idx: number) => (
                    <span key={`modal-iso-${idx}`} className="bg-blue-50 text-blue-900 border border-blue-200 text-[10px] font-black px-2.5 py-0.5 rounded-lg">
                      {iso}
                    </span>
                  ))}
                  {(selectedFactoryModal.factoryHealthLicense || selectedFactoryModal.healthLicense) && (
                    <span className="bg-emerald-50 text-emerald-900 border border-emerald-200 text-[10px] font-black px-2.5 py-0.5 rounded-lg">
                      سیب سلامت: {toPersianNum(selectedFactoryModal.factoryHealthLicense || selectedFactoryModal.healthLicense || "")}
                    </span>
                  )}
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
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl transition-all cursor-pointer shadow-sm"
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

              {/* Bottom Action CTAs */}
              <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => {
                    const targetFac = selectedFactoryModal;
                    setSelectedFactoryModal(null);
                    setSelectedDedicatedFactory(targetFac as unknown as FactoryProfile);
                  }}
                  className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-black py-3 rounded-xl text-xs transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer"
                >
                  <ExternalLink size={15} />
                  <span>مشاهده صفحه کامل کارخانه و خطوط تولید</span>
                </button>

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
                  <span>ثبت سفارش مستقیم از کارخانه</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: ORDER RAW MATERIAL MODAL (استعلام و سفارش مواد اولیه) */}
      <AnimatePresence>
        {showOrderRawModal && (
          <div className="fixed inset-0 z-50 flex justify-center items-start sm:items-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[2rem] sm:rounded-[2.5rem] max-w-xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-100 my-auto max-h-[85vh] sm:max-h-[90vh] overflow-y-auto scrollbar-thin text-right"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black">
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
                    <h4 className="text-base font-black text-slate-900">استعلام خرید با موفقیت ثبت شد</h4>
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
                    className="w-full py-3 bg-emerald-600 text-white font-black text-xs rounded-xl hover:bg-emerald-700 transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
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
          <div className="fixed inset-0 z-50 flex justify-center items-start sm:items-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[2rem] sm:rounded-[2.5rem] max-w-xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-100 my-auto max-h-[85vh] sm:max-h-[90vh] overflow-y-auto scrollbar-thin text-right"
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
                    className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
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
          <div className="fixed inset-0 z-50 flex justify-center items-start sm:items-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[2rem] sm:rounded-[2.5rem] max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-100 my-auto max-h-[85vh] sm:max-h-[90vh] overflow-y-auto scrollbar-thin text-right"
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
              <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex items-start gap-3">
                <ShieldCheck className="text-emerald-600 shrink-0 mt-0.5" size={18} />
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
                                className="text-[10px] bg-emerald-600 text-white px-2.5 py-1 rounded-md font-bold hover:bg-emerald-100 transition-colors"
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
          <div className="fixed inset-0 z-50 flex justify-center items-start sm:items-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[2rem] sm:rounded-[2.5rem] max-w-xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-100 my-auto max-h-[85vh] sm:max-h-[90vh] overflow-y-auto scrollbar-thin text-right"
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
                  <div className="bg-emerald-50/80 border border-emerald-200/80 p-4 rounded-2xl space-y-2">
                    <div className="flex items-center gap-2 text-indigo-900 font-black text-xs">
                      <ShieldCheck size={16} className="text-emerald-600 shrink-0" />
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
          <div className="fixed inset-0 z-50 flex justify-center items-start sm:items-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[2rem] sm:rounded-[2.5rem] max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-100 my-auto max-h-[85vh] sm:max-h-[90vh] overflow-y-auto scrollbar-thin text-right"
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
                    <label className="text-xs font-black text-slate-800 block">تصویر نمونه خدمت / مجوز / کارگاه (آپلود مستقیم یا آدرس اینترنتی):</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Drag and Drop Box */}
                      <div
                        onDragOver={(e) => {
                          e.preventDefault();
                          setIsDraggingSrvImage(true);
                        }}
                        onDragLeave={() => setIsDraggingSrvImage(false)}
                        onDrop={(e) => {
                          e.preventDefault();
                          setIsDraggingSrvImage(false);
                          if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                            handleSrvImageFile(e.dataTransfer.files[0]);
                          }
                        }}
                        className={`border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                          isDraggingSrvImage
                            ? "border-teal-500 bg-teal-50"
                            : "border-slate-300 hover:border-teal-400 hover:bg-slate-50"
                        }`}
                        onClick={() => document.getElementById("srv-file-upload-input")?.click()}
                      >
                        <input
                          id="srv-file-upload-input"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              handleSrvImageFile(e.target.files[0]);
                            }
                          }}
                        />
                        {uploadedSrvImageBase64 ? (
                          <div className="space-y-2">
                            <img
                              src={uploadedSrvImageBase64}
                              alt="پیش‌نمایش"
                              className="w-16 h-16 object-cover rounded-lg mx-auto border border-slate-200"
                            />
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setUploadedSrvImageBase64(null);
                              }}
                              className="text-[10px] bg-emerald-600 text-white px-2.5 py-1 rounded-md font-bold hover:bg-emerald-100 transition-colors"
                            >
                              حذف و تغییر عکس
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <UploadCloud className="text-slate-400 mx-auto" size={24} />
                            <span className="text-[11px] font-black text-slate-700 block">
                              آپلود مستقیم تصویر خدمت (Drag & Drop)
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
                            value={uploadedSrvImageBase64 || ""}
                            onChange={(e) => {
                              setUploadedSrvImageBase64(e.target.value);
                            }}
                            placeholder="https://example.com/service-image.jpg"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                          />
                        </div>
                        <div className="text-[9px] text-slate-400 leading-normal bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          * برای نمایش مطلوب‌تر، تصویری از کارگاه، دستگاه، خودروی لجستیک یا نمونه قرارداد قبلی خود بارگذاری نمایید. در صورت عدم انتخاب، تصویر پیش‌فرض مناسب این حوزه به کار گرفته می‌شود.
                        </div>
                      </div>
                    </div>
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
                  <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-xl text-[11px] text-amber-900 space-y-1 font-medium">
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

      {/* MODAL 6: ORDER INDUSTRIAL EQUIPMENT (RFQ) WITH ESCROW */}
      <AnimatePresence>
        {showOrderEquipmentModal && (
          <div className="fixed inset-0 z-50 flex justify-center items-start sm:items-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[2rem] sm:rounded-[2.5rem] max-w-xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-100 my-auto max-h-[85vh] sm:max-h-[90vh] overflow-y-auto scrollbar-thin text-right"
              dir="rtl"
            >
              <div className="relative border-b border-slate-100 pb-4">
                <div className="pl-10">
                  <div className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full text-[10px] font-black text-indigo-800 mb-2 max-w-full flex-wrap">
                    <Wrench size={12} className="text-emerald-600 shrink-0" />
                    <span className="leading-normal">درخواست استعلام خرید تجهیز صنعتی با نظارت دست‌اول</span>
                  </div>
                  <h3 className="text-lg font-black text-slate-900 leading-snug">
                    {targetEquipment ? `استعلام: ${targetEquipment.title}` : "فرم استعلام و سفارش خرید تجهیزات صنعتی"}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-1 font-sans">
                    {targetEquipment ? `مالک: ${targetEquipment.factoryName} | موقعیت: ${targetEquipment.location}` : "درخواست شما برای کارخانجات دارنده ماشین‌آلات ارسال خواهد شد"}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowOrderEquipmentModal(false);
                    setEqOrderSubmittedCode(null);
                  }}
                  className="absolute top-0 left-0 p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors cursor-pointer"
                  title="بستن"
                >
                  <X size={18} />
                </button>
              </div>

              {eqOrderSubmittedCode ? (
                <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-3xl text-center space-y-4 font-sans">
                  <div className="w-16 h-16 bg-emerald-600 text-white rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-emerald-600/30 animate-bounce">
                    <CheckCircle2 size={32} />
                  </div>
                  <h4 className="text-base font-black text-slate-900">درخواست کارشناسی و خرید با موفقیت ثبت شد</h4>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-2 text-xs font-medium text-emerald-800">
                    <span>کد پیگیری درخواست شما:</span>
                    <span className="font-mono font-black text-sm bg-white px-3 py-1.5 rounded-lg border border-emerald-300 inline-block tracking-wider whitespace-nowrap text-slate-950 shadow-inner" dir="ltr">
                      {eqOrderSubmittedCode}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 font-medium leading-relaxed">
                    کارشناس فنی و ناظر دست‌اول ظرف حداکثر ۲ ساعت کاری جهت هماهنگی بازدید حضوری، تست سلامت دستگاه و تنظیم قرارداد امانی واسطه‌ای با شما تماس خواهد گرفت.
                  </p>
                  <button
                    onClick={() => {
                      setShowOrderEquipmentModal(false);
                      setEqOrderSubmittedCode(null);
                    }}
                    className="w-full py-3 bg-indigo-650 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md transition-all cursor-pointer"
                  >
                    متوجه شدم
                  </button>
                </div>
              ) : (
                <form onSubmit={handleOrderEquipmentSubmit} className="space-y-4">
                  {/* Escrow Guarantee Box */}
                  <div className="bg-emerald-50/80 border border-emerald-200/80 p-4 rounded-2xl space-y-2">
                    <div className="flex items-center gap-2 text-indigo-900 font-black text-xs">
                      <ShieldCheck size={16} className="text-emerald-600 shrink-0" />
                      <span>تضمین معامله امن و کارشناسی سلامت ماشین‌آلات</span>
                    </div>
                    <p className="text-[11px] text-indigo-800 leading-relaxed font-medium">
                      مبلغ معامله تا زمان تحویل فیزیکی دستگاه به کارخانه شما، تست کامل قطعات برقی و مکانیکی و رضایت قطعی خریدار، در حساب امانی دست‌اول نزد بانک محفوظ می‌ماند.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-black text-slate-800 block">نام کارخانه یا شرکت متقاضی خرید:</label>
                      <input
                        type="text"
                        required
                        value={reqEqFactoryName}
                        onChange={(e) => setReqEqFactoryName(e.target.value)}
                        placeholder="مثال: کارتن‌سازی البرز نو"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-black text-slate-800 block">شماره تماس جهت هماهنگی بازدید:</label>
                      <input
                        type="tel"
                        required
                        value={reqEqContactPhone}
                        onChange={(e) => setReqEqContactPhone(e.target.value)}
                        placeholder="۰۹۱۲..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono text-left"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-800 block">شهر و محل دقیق نصب تجهیز:</label>
                    <input
                      type="text"
                      required
                      value={reqEqCity}
                      onChange={(e) => setReqEqCity(e.target.value)}
                      placeholder="مثال: قزوین - شهرک صنعتی لیا"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-800 block">توضیحات فنی، نیاز به اورهال یا شروط تست:</label>
                    <textarea
                      rows={3}
                      required
                      value={reqEqDetails}
                      onChange={(e) => setReqEqDetails(e.target.value)}
                      placeholder="لطفاً مواردی نظیر برق مصرفی (تک فاز/سه فاز)، متریال بدنه، ابعاد، یا شروط ضمانت و گارانتی مدنظر خود را شرح دهید..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 bg-indigo-650 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-lg shadow-emerald-600/20 transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <ShieldCheck size={16} />
                    <span>ثبت درخواست بازدید فنی و خرید کارشناسی‌شده</span>
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 7: ADD INDUSTRIAL EQUIPMENT (SELL MACHINE) */}
      <AnimatePresence>
        {showAddEquipmentModal && (
          <div className="fixed inset-0 z-50 flex justify-center items-start sm:items-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[2rem] sm:rounded-[2.5rem] max-w-xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-100 my-auto max-h-[85vh] sm:max-h-[90vh] overflow-y-auto scrollbar-thin text-right"
              dir="rtl"
            >
              <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-lg font-black text-slate-900">واگذاری و فروش تجهیزات و ماشین‌آلات مازاد</h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5 font-sans">تجهیزات صنعتی مازاد کارگاه یا خط تولید خود را بدون واسطه به همکاران بفروشید</p>
                </div>
                <button
                  onClick={() => setShowAddEquipmentModal(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              {eqSuccessMsg ? (
                <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-3xl text-center space-y-4 font-sans text-emerald-900">
                  <div className="w-16 h-16 bg-emerald-600 text-white rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-emerald-600/30">
                    <CheckCircle2 size={32} />
                  </div>
                  <h4 className="text-base font-black text-slate-900">تجهیز صنعتی با موفقیت ثبت شد</h4>
                  <p className="text-xs text-slate-600 font-medium leading-relaxed">
                    درخواست فروش شما ثبت گردید. پس از کارشناسی مدارک مالکیت و صحت فیزیکی تجهیز توسط کارشناسان دست‌اول، کالا با ضمانت در تالار تجهیزات صنعتی منتشر خواهد شد.
                  </p>
                  <button
                    onClick={() => setShowAddEquipmentModal(false)}
                    className="w-full py-3 bg-emerald-650 text-white font-black text-xs rounded-xl shadow-md transition-all cursor-pointer"
                  >
                    بستن پنجره
                  </button>
                </div>
              ) : (
                <form onSubmit={handleRegisterEquipment} className="space-y-4 font-sans">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-black text-slate-800 block">عنوان یا نام دقیق دستگاه / تجهیز:</label>
                      <input
                        type="text"
                        required
                        value={newEqTitle}
                        onChange={(e) => setNewEqTitle(e.target.value)}
                        placeholder="مثال: دیگ بخار ۳ تنی استیل"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-black text-slate-800 block">دسته‌بندی تجهیز صنعتی:</label>
                      <select
                        value={newEqCat}
                        onChange={(e) => setNewEqCat(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      >
                        {EQUIPMENT_CATEGORIES.filter(c => c !== "همه تجهیزات").map((cat, idx) => (
                          <option key={`add-eq-cat-opt-${idx}`} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-black text-slate-800 block">نام کارخانه، شرکت یا شخص حقیقی مالک / فروشنده:</label>
                      <input
                        type="text"
                        required
                        value={newEqFactory}
                        onChange={(e) => setNewEqFactory(e.target.value)}
                        placeholder="مثال: صنایع غذایی بهارستان یا احمدی (شخص حقیقی)"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-black text-slate-800 block">موقعیت مکانی دستگاه (استان/شهر):</label>
                      <input
                        type="text"
                        required
                        value={newEqLocation}
                        onChange={(e) => setNewEqLocation(e.target.value)}
                        placeholder="مثال: البرز - شهرک صنعتی اشتهارد"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-black text-slate-800 block">موجودی / تعداد دستگاه:</label>
                      <input
                        type="text"
                        required
                        value={newEqQuantity}
                        onChange={(e) => setNewEqQuantity(e.target.value)}
                        placeholder="مثال: ۱ دستگاه"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-black text-slate-800 block">نام و نام خانوادگی مسئول فروش:</label>
                      <input
                        type="text"
                        required
                        value={newEqContactPerson}
                        onChange={(e) => setNewEqContactPerson(e.target.value)}
                        placeholder="مثال: مهندس صادقی"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-black text-slate-800 block">شماره تماس (محفوظ نزد ناظر):</label>
                      <input
                        type="tel"
                        required
                        value={newEqContactPhone}
                        onChange={(e) => setNewEqContactPhone(e.target.value)}
                        placeholder="۰۹۱۲..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-left font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-black text-slate-800 block">قیمت واگذاری زیر بازار (تومان):</label>
                      <input
                        type="text"
                        required
                        value={newEqWholesalePrice}
                        onChange={(e) => setNewEqWholesalePrice(e.target.value)}
                        placeholder="مثال: ۱۵۰,۰۰۰,۰۰۰ تومان"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-black text-slate-800 block">قیمت نو / بازار آزاد (تومان):</label>
                      <input
                        type="text"
                        required
                        value={newEqMarketPrice}
                        onChange={(e) => setNewEqMarketPrice(e.target.value)}
                        placeholder="مثال: ۱۹۰,۰۰۰,۰۰۰ تومان"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-black text-slate-800 block">منفعت نقدی خریدار (اختلاف قیمت):</label>
                      <input
                        type="text"
                        required
                        value={newEqBuyerProfit}
                        onChange={(e) => setNewEqBuyerProfit(e.target.value)}
                        placeholder="مثال: ۴۰ میلیون سود واگذاری فوری"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-800 block">تصویر تجهیز، کاتالوگ یا برگه کارشناسی:</label>
                    <div className="border-2 border-dashed border-slate-300 hover:border-indigo-400 bg-slate-50 hover:bg-emerald-50/40 rounded-2xl p-4 text-center cursor-pointer transition-all relative">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          if (e.target.files?.[0]) {
                            const file = e.target.files[0];
                            const result = await uploadToParsPackStorage(file, "factories");
                            if (result.success && result.url) {
                              setUploadedEqImageBase64(result.url);
                            } else {
                              const reader = new FileReader();
                              reader.onload = (readerEvent) => {
                                if (readerEvent.target?.result && typeof readerEvent.target.result === "string") {
                                  setUploadedEqImageBase64(readerEvent.target.result);
                                }
                              };
                              reader.readAsDataURL(file);
                            }
                          }
                        }}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      />
                      {uploadedEqImageBase64 ? (
                        <div className="flex flex-col items-center justify-center space-y-2 relative z-20">
                          <img src={uploadedEqImageBase64} alt="پیش‌نمایش تجهیز" className="w-24 h-24 object-cover rounded-xl border border-slate-200 shadow-sm" />
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">✓ تصویر آپلود شد</span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setUploadedEqImageBase64(null);
                              }}
                              className="text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded-md font-bold hover:bg-emerald-100 transition-colors z-30"
                            >
                              حذف و تغییر
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1.5 py-1">
                          <UploadCloud className="text-emerald-500 mx-auto" size={32} />
                          <span className="text-xs font-black text-slate-800 block">
                            انتخاب یا کشیدن تصویر تجهیز / کاتالوگ (Drag & Drop)
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium block">
                            فرمت‌های مجاز: JPG, PNG, WEBP (جهت رویت ادمین و خریداران)
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-800 block">توضیحات تکمیلی، شرایط تست و علت واگذاری:</label>
                    <textarea
                      rows={3}
                      value={newEqDesc}
                      onChange={(e) => setNewEqDesc(e.target.value)}
                      placeholder="علت فروش دستگاه، وضعیت کارکرد، سرویس‌های انجام شده و گواهی سلامت ماشین‌آلات را اینجا شرح دهید..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>

                  {/* Escrow Guarantee Notice */}
                  <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-xl text-[11px] text-amber-900 space-y-1 font-medium">
                    <div className="font-black flex items-center gap-1.5 text-amber-950">
                      <ShieldCheck size={14} className="text-amber-700" />
                      <span>قوانین واسطه‌گری امن و کارشناسی تجهیزات در دست‌اول:</span>
                    </div>
                    <p className="text-[10px] text-amber-800 leading-relaxed">
                      کارشناس ناظر دست‌اول حضورتان می‌رسد و پس از تایید فیزیکی، آن را با گارانتی امانی به همکاران عرضه می‌دارد. تا پایان زمان آزمون خریدار، مبلغ نزد پلتفرم امانت خواهد ماند.
                    </p>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-lg shadow-emerald-600/20 transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <ShieldCheck size={16} />
                    <span>تایید مشخصات تجهیز و ارسال جهت بررسی و انتشار کارشناسی</span>
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 7: SUPPLIER BID SUBMISSION FOR RFQ */}
      <AnimatePresence>
        {showSubmitBidModal && selectedRfqForBid && (
          <div className="fixed inset-0 z-[110] flex justify-center items-start sm:items-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[2rem] sm:rounded-[2.5rem] max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-2xl border border-slate-100 my-auto max-h-[85vh] sm:max-h-[90vh] overflow-y-auto scrollbar-thin text-right"
              dir="rtl"
            >
              <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                <div>
                  <span className="text-[10px] font-black bg-emerald-100 text-amber-900 px-3 py-1 rounded-full border border-emerald-200">
                    پاسخ و اعلام تامین به مدیریت
                  </span>
                  <h3 className="text-base font-black text-slate-900 mt-2">
                    اعلام موجودی و ثبت پیشنهاد قیمت برای {selectedRfqForBid.materialName || selectedRfqForBid.title}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-1">
                    کد استعلام: #{selectedRfqForBid.id} | خریدار: {selectedRfqForBid.buyerFactoryName || "واحد تولیدی"}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowSubmitBidModal(false);
                    setSelectedRfqForBid(null);
                  }}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              {bidSuccessMsg ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center space-y-3 my-4">
                  <CheckCircle2 size={40} className="mx-auto text-emerald-600" />
                  <h4 className="text-sm font-black text-slate-900">ثبت موفقیت‌آمیز پیشنهاد تامین</h4>
                  <p className="text-xs text-emerald-800 leading-relaxed font-medium">
                    {bidSuccessMsg}
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmitBidForRfq} className="space-y-4">
                  <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl text-xs space-y-1 text-indigo-950">
                    <div className="font-black flex items-center gap-1.5 text-indigo-900">
                      <ShieldCheck size={16} className="text-emerald-600" />
                      <span>واسطه‌گری امن و کمیسیون مصوب {toPersianNum(b2bConfig?.commissionRate || 5)}٪ دست‌اول:</span>
                    </div>
                    <p className="text-[11px] text-indigo-800 leading-relaxed font-medium">
                      پیشنهاد شما ابتدا جهت بررسی و تایید به ادمین ارسال می‌شود و پس از تایید مدیریت، در تالار عمومی و به خریدار نمایش داده خواهد شد.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-800 mb-1.5">
                      نام شرکت / کارخانه یا تامین‌کننده <span className="text-emerald-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={bidSupplierName}
                      onChange={(e) => setBidSupplierName(e.target.value)}
                      placeholder="مثال: بازرگانی پارس قند / کارخانه مواد اولیه نوین"
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-800 mb-1.5">
                      شماره تماس مستقیم پاسخگو (جهت ارتباط ادمین) <span className="text-emerald-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={bidSupplierPhone}
                      onChange={(e) => setBidSupplierPhone(e.target.value)}
                      placeholder="۰۹۱۲..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-black text-slate-800 mb-1.5">
                        قیمت پیشنهادی فی / کل (تومان) <span className="text-emerald-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={bidPrice}
                        onChange={(e) => setBidPrice(e.target.value)}
                        placeholder="مثال: ۴۸,۵۰۰ / کیلوگرم یا توافقی"
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-black text-slate-800 mb-1.5">
                        زمان آمادگی و تحویل بار
                      </label>
                      <input
                        type="text"
                        value={bidDeliveryDays}
                        onChange={(e) => setBidDeliveryDays(e.target.value)}
                        placeholder="مثال: ۲ روز کاری / فوری"
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-800 mb-1.5">
                      توضیحات آنالیز، برند و نحوه تسویه
                    </label>
                    <textarea
                      rows={3}
                      value={bidNotes}
                      onChange={(e) => setBidNotes(e.target.value)}
                      placeholder="توضیحات در خصوص کیفیت، برند کالا، آنالیز آزمایشگاهی و شرایط باربری..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>

                  <div className="pt-3">
                    <button
                      type="submit"
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3.5 rounded-2xl text-xs transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Send size={16} />
                      <span>ثبت و ارسال پیشنهاد تامین به ادمین پلتفرم</span>
                    </button>
                  </div>
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

      {/* NEW MODAL: REGISTER CAPACITY AD (ثبت آگهی ظرفیت خالی جدید) */}
      <AnimatePresence>
        {showAddCapacityModal && (
          <div className="fixed inset-0 z-50 flex justify-center items-start sm:items-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[2rem] sm:rounded-[2.5rem] max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-100 my-auto max-h-[85vh] sm:max-h-[90vh] overflow-y-auto scrollbar-thin text-right"
              dir="rtl"
            >
              <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                <div>
                  <div className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full text-[10px] font-black text-emerald-800 mb-2">
                    <Megaphone size={12} className="text-emerald-600 animate-pulse" />
                    <span>واگذاری ظرفیت مازاد و شیفت تولید قراردادی</span>
                  </div>
                  <h3 className="text-lg font-black text-slate-900">
                    ثبت آگهی ظرفیت خالی و تولید کارمزدی
                  </h3>
                </div>
                <button
                  onClick={() => setShowAddCapacityModal(false)}
                  className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {capAdSuccessMsg ? (
                <div className="p-6 text-center space-y-4">
                  <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-emerald-600">
                    <CheckCircle size={36} />
                  </div>
                  <h4 className="text-base font-black text-slate-950">ثبت با موفقیت انجام شد</h4>
                  <p className="text-xs text-slate-600 font-medium max-w-md mx-auto leading-relaxed">
                    {capAdSuccessMsg}
                  </p>
                </div>
              ) : (
                <form onSubmit={handleRegisterCapacityAd} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-black text-slate-800 mb-1.5">
                        عنوان آگهی ظرفیت خالی <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={newCapTitle}
                        onChange={(e) => setNewCapTitle(e.target.value)}
                        placeholder="مثال: ظرفیت خالی خط پرکنی و پاستوریزاتور قوطی"
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black text-slate-800 mb-1.5">
                        نام کارخانه / واحد تولیدی <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={newCapFactoryName}
                        onChange={(e) => setNewCapFactoryName(e.target.value)}
                        placeholder="مثال: صنایع غذایی گل سرخ البرز"
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-black text-slate-800 mb-1.5">
                        صنعت / حوزه فعالیت <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={newCapCat}
                        onChange={(e) => setNewCapCat(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800"
                      >
                        <option value="نوشیدنی و آبمیوه">نوشیدنی و آبمیوه</option>
                        <option value="کیک، کلوچه و بیسکویت">کیک، کلوچه و بیسکویت</option>
                        <option value="شوینده و بهداشتی">شوینده و بهداشتی</option>
                        <option value="مواد غذایی و کنسروجات">مواد غذایی و کنسروجات</option>
                        <option value="لبنیات و فرآورده‌ها">لبنیات و فرآورده‌ها</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-black text-slate-800 mb-1.5">
                        موقعیت جغرافیایی کارخانه <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={newCapLocation}
                        onChange={(e) => setNewCapLocation(e.target.value)}
                        placeholder="مثال: اصفهان، شهرک صنعتی رازی"
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-black text-slate-800 mb-1.5">
                        شماره تماس مستقیم مسئول خط <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={newCapPhone}
                        onChange={(e) => setNewCapPhone(e.target.value)}
                        placeholder="مثال: ۰۹۱۲۳۴۵۶۷۸۹"
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800 text-left"
                        dir="ltr"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black text-slate-800 mb-1.5">
                        حداقل حجم سفارش قابل پذیرش
                      </label>
                      <input
                        type="text"
                        value={newCapMinQty}
                        onChange={(e) => setNewCapMinQty(e.target.value)}
                        placeholder="مثال: ۲۰,۰۰۰ عدد یا توافقی"
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-800 mb-1.5">
                      مشخصات ماشین‌آلات و ظرفیت خط تولید <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      rows={2}
                      required
                      value={newCapDetails}
                      onChange={(e) => setNewCapDetails(e.target.value)}
                      placeholder="مثال: خط پرکنی اتوماتیک مایعات رقیق مجهز به جت‌پرینتر، لیبل‌زن صنعتی دورو و شیرینگ پک تونلی مجهز به کوره حرارتی..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800 leading-relaxed"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-800 mb-1.5">
                      توضیحات تکمیلی، استانداردها و شرایط همکاری <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={newCapDesc}
                      onChange={(e) => setNewCapDesc(e.target.value)}
                      placeholder="لطفا استانداردها، مجوزهای بهداشتی، سیب سلامت، پروانه ساخت و نحوه تامین ملزومات (کارتن، سلفون، مواد اولیه) و شرایط پرداخت را با جزئیات بنویسید..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800 leading-relaxed"
                    />
                  </div>

                  {/* Drag and Drop Image Selector */}
                  <div>
                    <label className="block text-xs font-black text-slate-800 mb-1.5">
                      تصویر گالری خط تولید یا ماشین‌آلات
                    </label>
                    <div 
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                          handleCapImageUpload(e.dataTransfer.files[0]);
                        }
                      }}
                      className="border-2 border-dashed border-slate-200 rounded-2xl p-4 text-center cursor-pointer hover:border-emerald-500 transition-colors bg-slate-50 relative flex flex-col items-center justify-center gap-1.5"
                    >
                      <input 
                        type="file" 
                        accept="image/*"
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleCapImageUpload(e.target.files[0]);
                          }
                        }}
                      />
                      {uploadedCapImageBase64 ? (
                        <div className="flex items-center gap-3 w-full">
                          <img src={uploadedCapImageBase64} alt="Preview" className="w-14 h-14 object-cover rounded-xl border border-slate-200" />
                          <div className="text-right">
                            <span className="text-[10px] text-emerald-600 font-black block">تصویر با موفقیت انتخاب شد</span>
                            <span className="text-[9px] text-slate-400 font-bold block">برای تغییر، مجدد کلیک کنید</span>
                          </div>
                        </div>
                      ) : (
                        <>
                          <UploadCloud size={24} className="text-slate-400" />
                          <span className="text-[10px] text-slate-600 font-black">انتخاب تصویر خط تولید (کلیک کنید یا تصویر را به این کادر بکشید)</span>
                          <span className="text-[9px] text-slate-400 font-bold">فرمت‌های مجاز: JPG, PNG. در غیر اینصورت از تصویر پیش‌فرض صنعت استفاده می‌شود.</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3.5 rounded-2xl text-xs transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
                    >
                      <Send size={16} />
                      <span>ثبت و انتشار آگهی ظرفیت خالی در پورتال دست‌اول</span>
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* NEW MODAL: SUBMIT COOPERATION REQUEST (ثبت درخواست همکاری تولید کارمزدی) */}
      <AnimatePresence>
        {showSubmitCooperationModal && selectedCapacityAd && (
          <div className="fixed inset-0 z-50 flex justify-center items-start sm:items-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[2rem] sm:rounded-[2.5rem] max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-100 my-auto text-right"
              dir="rtl"
            >
              <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                <div>
                  <div className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full text-[10px] font-black text-emerald-800 mb-2">
                    <Handshake size={12} className="text-emerald-600" />
                    <span>ارتباط امن مستقیم با کارخانه تحت نظارت دست‌اول</span>
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900">
                    ارسال پیشنهاد تولید و همکاری کارمزدی
                  </h3>
                </div>
                <button
                  onClick={() => {
                    setShowSubmitCooperationModal(false);
                    setCoopSubmittedCode(null);
                    setReqCoopBrand("");
                    setReqCoopContact("");
                    setReqCoopPhone("");
                    setReqCoopQty("");
                    setReqCoopNotes("");
                  }}
                  className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {coopSubmittedCode ? (
                <div className="p-4 sm:p-6 text-center space-y-5">
                  <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-emerald-600 shadow-2xs">
                    <CheckCircle2 size={32} />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-base font-black text-slate-950">درخواست همکاری شما با موفقیت ثبت شد</h4>
                    <p className="text-xs text-slate-600 font-bold max-w-sm mx-auto leading-relaxed">
                      کارشناسان پلتفرم دست‌اول جهت هماهنگی و بررسی ظرفیت فنی با شما و مدیر کارخانه تماس خواهند گرفت.
                    </p>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
                    <span className="text-[10px] text-slate-400 font-bold block">کد پیگیری انحصاری درخواست شما:</span>
                    <strong className="text-base font-mono text-emerald-700 tracking-wider block font-black">{coopSubmittedCode}</strong>
                    <span className="text-[9px] text-slate-400 font-bold block">لطفاً جهت پیگیری‌های بعدی این کد را یادداشت فرمایید.</span>
                  </div>

                  <button
                    onClick={() => {
                      setShowSubmitCooperationModal(false);
                      setCoopSubmittedCode(null);
                      setReqCoopBrand("");
                      setReqCoopContact("");
                      setReqCoopPhone("");
                      setReqCoopQty("");
                      setReqCoopNotes("");
                    }}
                    className="w-full bg-slate-950 hover:bg-slate-900 text-white font-black py-3 rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    متوجه شدم - بستن کادر
                  </button>
                </div>
              ) : (
                <form onSubmit={handleRegisterCooperationRequest} className="space-y-4">
                  {/* Summary of target factory */}
                  <div className="bg-slate-50/95 border border-slate-200 rounded-2xl p-4 text-xs space-y-2">
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-black">
                      <span>واحد تولیدی هدف:</span>
                      <span className="text-emerald-700 font-black">{selectedCapacityAd.factoryName}</span>
                    </div>
                    <h4 className="text-xs font-black text-slate-800 leading-snug line-clamp-1">
                      {selectedCapacityAd.title}
                    </h4>
                    <div className="flex justify-between items-center text-[10px] text-slate-400 pt-1 border-t border-slate-200/60 font-bold">
                      <span>حداقل پذیرش: {selectedCapacityAd.minOrderQty}</span>
                      <span>محل کارخانه: {selectedCapacityAd.location}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-black text-slate-800 mb-1.5">
                        نام برند / شرکت متقاضی <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={reqCoopBrand}
                        onChange={(e) => setReqCoopBrand(e.target.value)}
                        placeholder="مثال: بستنی میهن / برند بازرگانی نوین"
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black text-slate-800 mb-1.5">
                        نام و نام خانوادگی مسئول پیگیری <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={reqCoopContact}
                        onChange={(e) => setReqCoopContact(e.target.value)}
                        placeholder="مثال: علیرضا احمدی (مدیر تامین)"
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-black text-slate-800 mb-1.5">
                        شماره تماس مستقیم جهت هماهنگی <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={reqCoopPhone}
                        onChange={(e) => setReqCoopPhone(e.target.value)}
                        placeholder="مثال: ۰۹۱۲۳۴۵۶۷۸۹"
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800 text-left"
                        dir="ltr"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black text-slate-800 mb-1.5">
                        محصول مد نظر جهت تولید
                      </label>
                      <input
                        type="text"
                        value={reqCoopProduct}
                        onChange={(e) => setReqCoopProduct(e.target.value)}
                        placeholder="مثال: رانی هلو ۲۴۰ سی‌سی"
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-800 mb-1.5">
                      حجم یا برآورد تعداد سفارش ماهانه
                    </label>
                    <input
                      type="text"
                      value={reqCoopQty}
                      onChange={(e) => setReqCoopQty(e.target.value)}
                      placeholder="مثال: ۱۰۰,۰۰۰ قوطی در ماه"
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-800 mb-1.5">
                      توضیحات تکمیلی، شرایط تسویه و مواد اولیه پیشنهادی
                    </label>
                    <textarea
                      rows={3}
                      value={reqCoopNotes}
                      onChange={(e) => setReqCoopNotes(e.target.value)}
                      placeholder="آیا تامین فویل، کارتن، قوطی یا شکر بر عهده خودتان است؟ در صورت نیاز مشخص کنید..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800 leading-relaxed"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3.5 rounded-xl text-xs transition-colors shadow-lg shadow-emerald-500/10 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Send size={15} />
                      <span>ثبت و ارسال رسمی پیشنهاد به مدیر کارخانه</span>
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
