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
  RotateCcw,
  Flame,
  TrendingDown,
  BadgePercent,
  Tag,
  AlertCircle,
  Archive,
  FileSpreadsheet
} from "lucide-react";
import SmsPhoneVerifier from "./SmsPhoneVerifier";
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

const renderStars = (rating: number = 5) => {
  return (
    <div className="flex items-center gap-0.5 text-amber-400">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={12}
          className={star <= rating ? "fill-amber-400 text-amber-400" : "text-slate-300"}
        />
      ))}
    </div>
  );
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
  initialSubTab?: 'factories' | 'raw_materials' | 'sediment' | 'surplus' | 'barter' | 'rfqs' | string;
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

export const RAW_MATERIAL_CATEGORIES = [
  "همه مواد اولیه",
  "شیرین‌کننده‌ها و نشاسته صنعتی",
  "آرد و غلات صنعتی",
  "روغن و چربی‌های تخصصی",
  "پودر کاکائو، شیرخشک و پودرهای لبنی",
  "اسانس، طعم‌دهنده و رنگ‌های خوراکی",
  "افزودنی‌ها، استابیلایزر و نگهدارنده‌ها",
  "کنسروجات، رب اسپتیک و عصاره صنعتی",
  "سلفون، لفاف و فیلم‌های بسته‌بندی",
  "پریفرم، بطری پت و ملزومات پلاستیک",
  "کارتن، جعبه و ملزومات چاپ",
  "گوشت، خمیر مرغ و مواد اولیه پروتئینی",
  "ادویه‌جات، نمک صنعتی و سبزیجات خشک"
];

// Compatibility stubs
export interface IndustrialServiceItem { [key: string]: any; }
export interface IndustrialEquipmentItem { [key: string]: any; }

// SEDIMENT GOODS (کالاهای رسوب‌کرده و انباشته انبار با تخفیف نقد شوندگی)
export interface SedimentItem {
  id: string;
  title: string;
  factoryName: string;
  brand: string;
  category: string;
  location: string;
  stockCartons: number;
  minOrderCartons: number;
  originalPrice: number; // قیمت معمول کارخانه (تومان)
  sedimentPrice: number; // قیمت ویژه رسوب‌زدایی (تومان)
  discountPercent: number; // درصد تخفیف رسوب‌زدایی
  sedimentDuration: string; // مدت دپو در انبار
  shelfLifeRemaining: string; // تاریخ انقضا / اعتبار
  description?: string;
  imageUrl?: string;
  phone?: string;
  unitsPerCarton?: number;
  status?: string;
  isPendingApproval?: boolean;
}

export const SEDIMENT_CATEGORIES = [
  "همه کالاهای رسوب‌کرده",
  "کیک، کلوچه و بیسکویت",
  "شکلات و تنقلات",
  "کنسروجات و رب",
  "نوشیدنی و آبمیوه",
  "مواد شوینده و بهداشتی",
  "لبنیات و فرآورده‌ها"
];

export const INITIAL_SEDIMENT_GOODS: SedimentItem[] = [];

// SURPLUS PRODUCTION (مازاد خط تولید کارخانجات، شیفت مازاد و لغو سفارشات صادراتی)
export interface SurplusItem {
  id: string;
  title: string;
  factoryName: string;
  brand: string;
  category: string;
  location: string;
  readyCartons: number;
  minOrderCartons: number;
  originalPrice: number; // قیمت پایه خط (تومان)
  surplusPrice: number; // قیمت کف خط مازاد (تومان)
  discountPercent: number; // درصد تخفیف مازاد
  productionDate: string; // تاریخ تولید / شیفت
  cause: string; // علت مازاد تولید
  deliveryCondition: string; // شرایط بارگیری و تحویل
  deliveryMethod?: string;
  description?: string;
  imageUrl?: string;
  phone?: string;
  unitsPerCarton?: number;
  status?: string;
  isPendingApproval?: boolean;
}

export const SURPLUS_CATEGORIES = [
  "همه مازادهای تولید",
  "تولید شیفت شب",
  "مازاد سهمیه صادراتی",
  "مازاد خط تنقلات و شکلات",
  "مازاد خط نوشیدنی و آبمیوه",
  "مازاد کیک و بیسکویت",
  "مازاد شوینده و بهداشتی"
];

export const INITIAL_SURPLUS_GOODS: SurplusItem[] = [
  {
    id: "surp-4",
    title: "نوشابه قوطی ۳۳۰ میل کوکاکولا و زیرو خوشگوار (بسته ۲۴ عددی)",
    factoryName: "شرکت خوشگوار مشهد",
    brand: "کوکاکولا",
    category: "مازاد خط نوشیدنی و آبمیوه",
    location: "خراسان رضوی، مشهد",
    readyCartons: 600,
    minOrderCartons: 25,
    originalPrice: 420000,
    surplusPrice: 348000,
    discountPercent: 17,
    productionDate: "تولید روز گذشته خط کن قوطی",
    cause: "تولید بیش از تعهد قرارداد نمایندگی استان",
    deliveryCondition: "بارگیری از انبار کارخانه خوشگوار مشهد با بارنامه دولتی",
    description: "قوطی ۳۳۰ سی‌سی با تاریخ انقضای ۱۲ ماهه کامل، تخفیف استثنایی مازاد خط جهت توزیع استانی و پخش عمده.",
    imageUrl: "https://c102393.parspack.net/c102393/products/prd_12.webp",
    phone: "۰۹۱۵۹۹۹۸۸۷۷",
    unitsPerCarton: 24,
    status: "approved"
  },
  {
    id: "surp-5",
    title: "کنسرو ماهی تن در روغن زیتون شیلانه ۱۸۰ گرمی (باکس ۲۴ عددی)",
    factoryName: "صنایع صید و کنسرو شیلانه",
    brand: "شیلانه",
    category: "مازاد سهمیه صادراتی",
    location: "قزوین، شهرک صنعتی البرز",
    readyCartons: 350,
    minOrderCartons: 10,
    originalPrice: 1850000,
    surplusPrice: 1424000,
    discountPercent: 23,
    productionDate: "تولید هفته جاری با برگه آنالیز آزمایشگاهی",
    cause: "مازاد سهمیه تولید شیفت دوخت قوطی آسان‌بازشو",
    deliveryCondition: "بارگیری مستقیم از درب کارخانه قزوین با ۲۳٪ تخفیف مازاد",
    description: "کنسرو فیله ماهی هوور ممتاز در روغن زیتون طبیعی با برگه آزمایشگاه COA و ضمانت کیفیت ۱۰۰ درصد کارخانه.",
    imageUrl: "https://c102393.parspack.net/c102393/products/prd_10.webp",
    phone: "۰۹۱۲۵۵۵۶۶۷۷",
    unitsPerCarton: 24,
    status: "approved"
  },
  {
    id: "surp-6",
    title: "مایع ظرفشویی ۴ لیتری گلیسیرینه پریل (کارتن ۴ عددی)",
    factoryName: "شرکت هنکل پاک‌وش",
    brand: "پریل",
    category: "مازاد شوینده و بهداشتی",
    location: "قزوین، شهر صنعتی البرز",
    readyCartons: 400,
    minOrderCartons: 15,
    originalPrice: 490000,
    surplusPrice: 392000,
    discountPercent: 20,
    productionDate: "تولید شیفت عصر روز گذشته",
    cause: "مازاد تولید خط گالن‌پرکنی اتوماتیک",
    deliveryCondition: "تحویل درب کارخانه با تسویه نقدی و بارنامه رسمی",
    description: "مایع ظرفشویی غلیظ پریل گالن ۴ لیتری کارتن ۴ تایی، تخفیف ۲۰٪ ویژه مازاد خط جهت تسویه نقدی.",
    imageUrl: "https://c102393.parspack.net/c102393/products/prd_20.webp",
    phone: "۰۹۱۲۳۳۳۴۴۸۸",
    unitsPerCarton: 4,
    status: "approved"
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

          {/* First-Hand / Verified Tag & Special Badge */}
          <div className="flex items-center gap-1.5">
            {isFeatured && (
              <span className="bg-emerald-600 text-white px-2.5 py-1 rounded-xl text-[10px] font-black flex items-center gap-1 shadow-md border border-emerald-500">
                <Sparkles size={11} className="fill-white text-white" />
                <span>ویژه 🌟</span>
              </span>
            )}
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-black backdrop-blur-md border ${
              isFirstHand 
                ? "bg-emerald-950/70 text-emerald-200 border-emerald-400/30" 
                : "bg-black/50 text-slate-200 border-white/10"
            }`}>
              {isFirstHand ? <Sparkles size={11} className="text-amber-400" /> : <Factory size={11} />}
              <span>{isFirstHand ? "تولیدکننده مستقیم" : "تامین‌کننده تایید شده"}</span>
            </span>
          </div>
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
              <span className="bg-emerald-600 text-white px-2 py-0.5 rounded-lg text-[10px] font-black border border-emerald-500 shadow-2xs shrink-0 flex items-center gap-1">
                <Sparkles size={11} className="fill-white text-white" />
                <span>ویژه 🌟</span>
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
  // Main Sub-Tab State: 'factories' | 'sediment' | 'surplus' | 'raw_materials' | 'barter' | 'rfqs'
  const [activeSubTab, setActiveSubTab] = useState<'factories' | 'sediment' | 'surplus' | 'raw_materials' | 'barter' | 'rfqs' | string>(initialSubTab || 'factories');

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

  // ==========================================
  // 1. SEDIMENT GOODS STATES (کالاهای رسوب‌کرده)
  // ==========================================
  const [sedimentList, setSedimentList] = useState<SedimentItem[]>(() => {
    try {
      const saved = localStorage.getItem("dastavval_sediment_goods");
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter(item => item && !item.id?.startsWith("sed-1") && !item.id?.startsWith("sed-2") && !item.id?.startsWith("sed-3") && !item.id?.startsWith("sed-4") && !item.id?.startsWith("sed-5") && !item.id?.startsWith("sed-6"));
        }
      }
    } catch (e) {}
    return [];
  });

  const [selectedSedimentCategory, setSelectedSedimentCategory] = useState("همه کالاهای رسوب‌کرده");
  const [searchSedimentQuery, setSearchSedimentQuery] = useState("");
  const [sortSedimentBy, setSortSedimentBy] = useState<'discount' | 'price_asc' | 'stock_desc'>('discount');
  const [selectedSedimentForOrder, setSelectedSedimentForOrder] = useState<SedimentItem | null>(null);
  const [showOrderSedimentModal, setShowOrderSedimentModal] = useState(false);
  const [showAddSedimentModal, setShowAddSedimentModal] = useState(false);

  // New Sediment Item Form
  const [newSedTitle, setNewSedTitle] = useState("");
  const [newSedFactory, setNewSedFactory] = useState("");
  const [newSedBrand, setNewSedBrand] = useState("");
  const [newSedCat, setNewSedCat] = useState("کیک، کلوچه و بیسکویت");
  const [newSedLocation, setNewSedLocation] = useState("");
  const [newSedStock, setNewSedStock] = useState("");
  const [newSedMinOrder, setNewSedMinOrder] = useState("۱۰");
  const [newSedOriginalPrice, setNewSedOriginalPrice] = useState("");
  const [newSedPrice, setNewSedPrice] = useState("");
  const [newSedDuration, setNewSedDuration] = useState("۲ ماه دپو در انبار");
  const [newSedShelfLife, setNewSedShelfLife] = useState("۶ ماه تا انقضا");
  const [newSedPhone, setNewSedPhone] = useState("");
  const [newSedDesc, setNewSedDesc] = useState("");
  const [uploadedSedImageBase64, setUploadedSedImageBase64] = useState<string | null>(null);
  const [isSedPhoneVerified, setIsSedPhoneVerified] = useState(false);
  const [sedSuccessMsg, setSedSuccessMsg] = useState("");

  // Sediment Order Form
  const [orderSedBuyerName, setOrderSedBuyerName] = useState("");
  const [orderSedBuyerPhone, setOrderSedBuyerPhone] = useState("");
  const [orderSedBuyerCity, setOrderSedBuyerCity] = useState("");
  const [orderSedQty, setOrderSedQty] = useState("");
  const [orderSedNotes, setOrderSedNotes] = useState("");
  const [orderSedSubmittedCode, setOrderSedSubmittedCode] = useState<string | null>(null);

  // ==========================================
  // 2. SURPLUS PRODUCTION STATES (مازاد تولید)
  // ==========================================
  const [surplusList, setSurplusList] = useState<SurplusItem[]>(() => {
    try {
      const saved = localStorage.getItem("dastavval_surplus_goods");
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter(item => item && !item.id?.startsWith("surp-1") && !item.id?.startsWith("surp-2") && !item.id?.startsWith("surp-3"));
        }
      }
    } catch (e) {}
    return [];
  });

  const [selectedSurplusCategory, setSelectedSurplusCategory] = useState("همه مازادهای تولید");
  const [searchSurplusQuery, setSearchSurplusQuery] = useState("");
  const [sortSurplusBy, setSortSurplusBy] = useState<'discount' | 'newest' | 'price_asc'>('discount');
  const [selectedSurplusForOrder, setSelectedSurplusForOrder] = useState<SurplusItem | null>(null);
  const [showOrderSurplusModal, setShowOrderSurplusModal] = useState(false);
  const [showAddSurplusModal, setShowAddSurplusModal] = useState(false);

  // New Surplus Item Form
  const [newSurpTitle, setNewSurpTitle] = useState("");
  const [newSurpFactory, setNewSurpFactory] = useState("");
  const [newSurpBrand, setNewSurpBrand] = useState("");
  const [newSurpCat, setNewSurpCat] = useState("مازاد خط تنقلات و شکلات");
  const [newSurpLocation, setNewSurpLocation] = useState("");
  const [newSurpReadyCartons, setNewSurpReadyCartons] = useState("");
  const [newSurpMinOrder, setNewSurpMinOrder] = useState("۱۰");
  const [newSurpOriginalPrice, setNewSurpOriginalPrice] = useState("");
  const [newSurpPrice, setNewSurpPrice] = useState("");
  const [newSurpDate, setNewSurpDate] = useState("تولید شیفت روز گذشته");
  const [newSurpCause, setNewSurpCause] = useState("مازاد شیفت تولید روزانه خط");
  const [newSurpDelivery, setNewSurpDelivery] = useState("تحویل فوری درب کارخانه با بارنامه رسمی");
  const [newSurpPhone, setNewSurpPhone] = useState("");
  const [newSurpDesc, setNewSurpDesc] = useState("");
  const [uploadedSurpImageBase64, setUploadedSurpImageBase64] = useState<string | null>(null);
  const [isSurpPhoneVerified, setIsSurpPhoneVerified] = useState(false);
  const [surpSuccessMsg, setSurpSuccessMsg] = useState("");

  // Surplus Order Form
  const [orderSurpBuyerName, setOrderSurpBuyerName] = useState("");
  const [orderSurpBuyerPhone, setOrderSurpBuyerPhone] = useState("");
  const [orderSurpBuyerCity, setOrderSurpBuyerCity] = useState("");
  const [orderSurpQty, setOrderSurpQty] = useState("");
  const [orderSurpNotes, setOrderSurpNotes] = useState("");
  const [orderSurpSubmittedCode, setOrderSurpSubmittedCode] = useState<string | null>(null);

  // ==========================================
  // 3. RAW MATERIALS STATES (مواد اولیه کارخانجات)
  // ==========================================
  const [rawMaterialsList, setRawMaterialsList] = useState<RawMaterial[]>(() => {
    try {
      const saved = localStorage.getItem("dastavval_raw_materials");
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return INITIAL_RAW_MATERIALS;
  });

  const [suppliersList, setSuppliersList] = useState<RawMaterialSupplier[]>(() => {
    try {
      const saved = localStorage.getItem("dastavval_raw_suppliers");
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return INITIAL_RAW_SUPPLIERS;
  });

  const [selectedRawCategory, setSelectedRawCategory] = useState("همه مواد اولیه");
  const [searchRawQuery, setSearchRawQuery] = useState("");
  const [showAddRawMaterialModal, setShowAddRawMaterialModal] = useState(false);
  const [newMatName, setNewMatName] = useState("");
  const [newMatCat, setNewMatCat] = useState("مواد اولیه صنایع غذایی");
  const [newMatPrice, setNewMatPrice] = useState("");
  const [newMatMinOrder, setNewMatMinOrder] = useState("");
  const [newMatDeliveryDays, setNewMatDeliveryDays] = useState("۳ روز کاری");
  const [newMatSupName, setNewMatSupName] = useState("");
  const [newMatSupLocation, setNewMatSupLocation] = useState("");
  const [newMatPhone, setNewMatPhone] = useState("");
  const [newMatSpecs, setNewMatSpecs] = useState("");
  const [newMatDesc, setNewMatDesc] = useState("");
  const [newMatImageUrl, setNewMatImageUrl] = useState("");
  const [uploadedImageBase64, setUploadedImageBase64] = useState<string | null>(null);
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const [isRawMatPhoneVerified, setIsRawMatPhoneVerified] = useState(false);
  const [matSuccessMsg, setMatSuccessMsg] = useState("");
  const [isFiltersCollapsed, setIsFiltersCollapsed] = useState(false);

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

      setBuyerFactoryName(prev => prev || userComp);
      setBuyerPhone(prev => prev || userPh);
      setBuyerCity(prev => prev || userCt);

      setNewMatSupName(prev => prev || userComp);
      setNewMatPhone(prev => prev || userPh);
      setNewMatSupLocation(prev => prev || userCt);

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

  // Handle Submit Raw Material For Sale
  const handleRegisterRawMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMatName.trim() || !newMatSupName.trim() || !newMatPrice.trim()) return;
    if (!isRawMatPhoneVerified) {
      alert("جهت حفظ امنیت و اصالت، تأیید پیامکی شماره همراه الزامی است.");
      return;
    }

    const sampleImages: Record<string, string> = {
      "شیرین‌کننده‌ها و نشاسته صنعتی": "https://c102393.parspack.net/c102393/products/prd_100.webp",
      "آرد و غلات صنعتی": "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=400&q=80",
      "روغن و چربی‌های تخصصی": "https://c102393.parspack.net/c102393/products/prd_120.webp",
      "پودر کاکائو، شیرخشک و پودرهای لبنی": "https://c102393.parspack.net/c102393/products/prd_110.webp",
      "اسانس، طعم‌دهنده و رنگ‌های خوراکی": "https://c102393.parspack.net/c102393/products/prd_105.webp",
      "افزودنی‌ها، استابیلایزر و نگهدارنده‌ها": "https://c102393.parspack.net/c102393/products/prd_115.webp",
      "کنسروجات، رب اسپتیک و عصاره صنعتی": "https://c102393.parspack.net/c102393/products/prd_105.webp",
      "سلفون، لفاف و فیلم‌های بسته‌بندی": "https://c102393.parspack.net/c102393/products/prd_130.webp",
      "پریفرم، بطری پت و ملزومات پلاستیک": "https://c102393.parspack.net/c102393/products/prd_125.webp",
      "کارتن، جعبه و ملزومات چاپ": "https://images.unsplash.com/photo-1607344645866-009c320c5ab8?auto=format&fit=crop&w=400&q=80",
      "گوشت، خمیر مرغ و مواد اولیه پروتئینی": "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=400&q=80",
      "ادویه‌جات، نمک صنعتی و سبزیجات خشک": "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=400&q=80"
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
      status: "pending",
      contactPhone: newMatPhone.trim() || "۰۲۱",
      phone: newMatPhone.trim() || "۰۲۱",
      createdAt: new Date().toISOString(),
      escrowGuaranteed: true
    };

    const updated = [newMat, ...rawMaterialsList];
    setRawMaterialsList(updated);
    try {
      localStorage.setItem("dastavval_raw_materials", JSON.stringify(updated));
      const pendingRaw = JSON.parse(localStorage.getItem("dastavval_pending_raw_materials") || "[]");
      localStorage.setItem("dastavval_pending_raw_materials", JSON.stringify([newMat, ...pendingRaw]));
    } catch (err) {}

    // Post to server backend API
    try {
      fetch("/api/v1/dev/raw-materials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newMat)
      }).catch(e => console.error("Failed to post raw material to API:", e));
    } catch (e) {}

    if (onUpdateB2bConfig && b2bConfig) {
      const existingRawAds = Array.isArray(b2bConfig.rawMaterialAds) ? b2bConfig.rawMaterialAds : [];
      onUpdateB2bConfig({
        ...b2bConfig,
        rawMaterialAds: [newMat, ...existingRawAds]
      }).catch(e => console.error("Failed to sync raw material ad with server:", e));
    }

    window.dispatchEvent(new CustomEvent("dastavval_ads_updated"));
    window.dispatchEvent(new CustomEvent("dastavval_data_refreshed"));

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

  // Filter Sediment Goods (کالاهای رسوب‌کرده)
  const allSedimentList = useMemo(() => {
    // Dynamic products from catalog marked as sediment
    const dynamicFromProducts: SedimentItem[] = (products || [])
      .filter((p: any) => p.isSediment || p.sedimentStatus === 'approved')
      .map((p: any) => {
        const orgPrice = p.bulk_price || p.price || 100000;
        const discount = p.sedimentDiscountPercent || 20;
        const sedPrice = p.sedimentPrice || Math.round(orgPrice * (1 - discount / 100));
        return {
          id: p.id,
          title: p.name,
          factoryName: p.factory_name || p.supplier || p.brand || "کارخانه تولیدی",
          brand: p.brand || p.name.split(' ')[0] || "تولیدکننده برتر",
          category: p.category || "کیک، کلوچه و بیسکویت",
          location: p.location || "ایران",
          stockCartons: p.sedimentQuantityCartons || p.stock_quantity_cartons || p.stock || 50,
          minOrderCartons: p.min_order_cartons || 5,
          originalPrice: orgPrice,
          sedimentPrice: sedPrice,
          discountPercent: discount,
          sedimentDuration: p.sedimentDuration || "۲ ماه دپو در انبار",
          shelfLifeRemaining: p.shelfLifeRemaining || "۶ ماه تا انقضا",
          description: p.sedimentDescription || p.description || "کالای رسوب‌کرده انبار کارخانه با تخفیف نقدشوندگی و تحویل فوری.",
          imageUrl: p.image_url || p.imageUrl || "https://c102393.parspack.net/c102393/products/prd_84.webp",
          phone: p.phone || "۰۹۰۴۴۵۰۲۹۰۰",
          unitsPerCarton: p.carton_pack_count || 24,
          status: "approved" as const
        };
      });

    // Combine avoiding duplicate IDs
    const seen = new Set<string>();
    const combined: SedimentItem[] = [];
    
    [...dynamicFromProducts, ...sedimentList].forEach(item => {
      if (!seen.has(item.id)) {
        seen.add(item.id);
        combined.push(item);
      }
    });

    return combined;
  }, [products, sedimentList]);

  const filteredSedimentGoods = useMemo(() => {
    let list = allSedimentList.filter(item => {
      const isApproved = item.status === 'approved' || (!item.isPendingApproval && item.status !== 'pending' && item.status !== 'rejected');
      const matchesCat = selectedSedimentCategory === "همه کالاهای رسوب‌کرده" || item.category === selectedSedimentCategory;
      const q = searchSedimentQuery.trim().toLowerCase();
      const matchesSearch = !q || (
        item.title.toLowerCase().includes(q) ||
        item.factoryName.toLowerCase().includes(q) ||
        item.brand.toLowerCase().includes(q) ||
        (item.description && item.description.toLowerCase().includes(q))
      );
      return isApproved && matchesCat && matchesSearch;
    });

    if (sortSedimentBy === 'discount') {
      list = [...list].sort((a, b) => b.discountPercent - a.discountPercent);
    } else if (sortSedimentBy === 'price_asc') {
      list = [...list].sort((a, b) => a.sedimentPrice - b.sedimentPrice);
    } else if (sortSedimentBy === 'stock_desc') {
      list = [...list].sort((a, b) => b.stockCartons - a.stockCartons);
    }
    return list;
  }, [allSedimentList, selectedSedimentCategory, searchSedimentQuery, sortSedimentBy]);

  // Upload Helpers for Sediment and Surplus
  const handleSedImageUpload = (file: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) setUploadedSedImageBase64(e.target.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSurpImageUpload = (file: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) setUploadedSurpImageBase64(e.target.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Handle Register Sediment Item
  const handleRegisterSediment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSedTitle.trim() || !newSedFactory.trim() || !newSedPrice.trim()) return;
    if (!isSedPhoneVerified) {
      alert("جهت حفظ امنیت معاملات و اصالت کارخانه، تأیید پیامکی شماره همراه الزامی است.");
      return;
    }

    const orgPrice = Number(newSedOriginalPrice) || Math.round(Number(newSedPrice) * 1.25);
    const sedPrice = Number(newSedPrice);
    const discount = Math.max(5, Math.round(((orgPrice - sedPrice) / orgPrice) * 100));

    const newItem: SedimentItem = {
      id: `sed-${Date.now()}`,
      title: newSedTitle.trim(),
      factoryName: newSedFactory.trim(),
      brand: newSedBrand.trim() || newSedFactory.trim(),
      category: newSedCat,
      location: newSedLocation.trim() || "ایران",
      stockCartons: Number(newSedStock) || 100,
      minOrderCartons: Number(newSedMinOrder) || 10,
      originalPrice: orgPrice,
      sedimentPrice: sedPrice,
      discountPercent: discount,
      sedimentDuration: newSedDuration.trim() || "دپو در انبار کارخانه",
      shelfLifeRemaining: newSedShelfLife.trim() || "دارای تاریخ انقضای معتبر",
      description: newSedDesc.trim() || "کالای رسوب‌کرده انبار کارخانه جهت آزادسازی فضا و نقدشوندگی سرمایه.",
      imageUrl: uploadedSedImageBase64 || "https://c102393.parspack.net/c102393/products/prd_84.webp",
      phone: newSedPhone.trim(),
      status: "approved"
    };

    const updated = [newItem, ...sedimentList];
    setSedimentList(updated);
    try {
      localStorage.setItem("dastavval_sediment_goods", JSON.stringify(updated));
    } catch (err) {}

    window.dispatchEvent(new CustomEvent("dastavval_ads_updated"));

    setSedSuccessMsg("کالای رسوب‌کرده کارخانه با موفقیت ثبت شد و در تالار ویژه جهت خرید بنکداران و عمده‌فروشان نمایش داده می‌شود.");
    setTimeout(() => {
      setShowAddSedimentModal(false);
      setSedSuccessMsg("");
      setNewSedTitle("");
      setNewSedFactory("");
      setNewSedBrand("");
      setNewSedLocation("");
      setNewSedStock("");
      setNewSedOriginalPrice("");
      setNewSedPrice("");
      setNewSedPhone("");
      setNewSedDesc("");
      setUploadedSedImageBase64(null);
    }, 2500);
  };

  // Handle Order Sediment Submit
  const handleOrderSedimentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderSedBuyerName.trim() || !orderSedBuyerPhone.trim()) return;

    const trackingCode = `SED-REQ-${Math.floor(100000 + Math.random() * 900000)}`;

    const newRfq: any = {
      id: trackingCode,
      trackingNumber: trackingCode,
      type: "sediment",
      materialName: `استعلام خرید کالای رسوب‌کرده: ${selectedSedimentForOrder?.title || "کالای انبار"}`,
      title: `استعلام خرید کالای رسوب‌کرده: ${selectedSedimentForOrder?.title || "کالای انبار"}`,
      buyerFactoryName: orderSedBuyerName.trim(),
      requester: orderSedBuyerName.trim(),
      buyerPhone: orderSedBuyerPhone.trim(),
      buyerCity: orderSedBuyerCity.trim() || "سراسر کشور",
      buyerNotes: orderSedNotes.trim(),
      createdAt: new Date().toLocaleDateString('fa-IR'),
      status: "در حال بررسی و تایید تسویه کارخانه",
      bids: [],
      items: [
        {
          productId: selectedSedimentForOrder?.id || "sed-item",
          name: selectedSedimentForOrder?.title || "کالای رسوب کرده",
          quantityCartons: Number(orderSedQty) || selectedSedimentForOrder?.minOrderCartons || 10,
          pricePerCarton: selectedSedimentForOrder?.sedimentPrice || 0,
          totalItems: Number(orderSedQty) || 10,
          notes: orderSedNotes.trim()
        }
      ]
    };

    const updatedRfqs = [newRfq, ...rfqOrders];
    setRfqOrders(updatedRfqs);
    try {
      localStorage.setItem("dastavval_raw_orders", JSON.stringify(updatedRfqs));
    } catch (err) {}

    window.dispatchEvent(new CustomEvent("dastavval_orders_updated"));
    setOrderSedSubmittedCode(trackingCode);
  };

  // Filter Surplus Production Goods (مازاد خط تولید)
  const allSurplusList = useMemo(() => {
    // Dynamic products from catalog marked as surplus
    const dynamicFromProducts: SurplusItem[] = (products || [])
      .filter((p: any) => p.isSurplus || p.surplusStatus === 'approved')
      .map((p: any) => {
        const orgPrice = p.bulk_price || p.price || 100000;
        const discount = p.surplusDiscountPercent || 22;
        const surpPrice = p.surplusPrice || Math.round(orgPrice * (1 - discount / 100));
        return {
          id: p.id,
          title: p.name,
          factoryName: p.factory_name || p.supplier || p.brand || "کارخانه تولیدی",
          brand: p.brand || p.name.split(' ')[0] || "تولیدکننده برتر",
          category: p.category ? `مازاد خط ${p.category}` : "مازاد خط تنقلات و شکلات",
          location: p.location || "ایران",
          readyCartons: p.surplusQuantityCartons || p.stock_quantity_cartons || p.stock || 80,
          minOrderCartons: p.min_order_cartons || 5,
          originalPrice: orgPrice,
          surplusPrice: surpPrice,
          discountPercent: discount,
          productionDate: "تولید شیفت روز گذشته",
          cause: "مازاد شیفت تولید و افزایش راندمان خط",
          deliveryCondition: "تحویل فوری درب کارخانه با بارنامه رسمی",
          deliveryMethod: "تحویل فوری درب کارخانه با بارنامه رسمی",
          description: p.surplusDescription || p.description || "مازاد خط تولید با بارگیری فوری و کیفیت تضمین‌شده استاندارد.",
          imageUrl: p.image_url || p.imageUrl || "https://c102393.parspack.net/c102393/products/prd_84.webp",
          phone: p.phone || "۰۹۰۴۴۵۰۲۹۰۰",
          unitsPerCarton: p.carton_pack_count || 24,
          status: "approved" as const
        };
      });

    // Combine avoiding duplicate IDs
    const seen = new Set<string>();
    const combined: SurplusItem[] = [];
    
    [...dynamicFromProducts, ...surplusList].forEach(item => {
      if (!seen.has(item.id)) {
        seen.add(item.id);
        combined.push(item);
      }
    });

    return combined;
  }, [products, surplusList]);

  const filteredSurplusGoods = useMemo(() => {
    let list = allSurplusList.filter(item => {
      const isApproved = item.status === 'approved' || (!item.isPendingApproval && item.status !== 'pending' && item.status !== 'rejected');
      const matchesCat = selectedSurplusCategory === "همه مازادهای تولید" || item.category === selectedSurplusCategory;
      const q = searchSurplusQuery.trim().toLowerCase();
      const matchesSearch = !q || (
        item.title.toLowerCase().includes(q) ||
        item.factoryName.toLowerCase().includes(q) ||
        item.brand.toLowerCase().includes(q) ||
        (item.cause && item.cause.toLowerCase().includes(q)) ||
        (item.description && item.description.toLowerCase().includes(q))
      );
      return isApproved && matchesCat && matchesSearch;
    });

    if (sortSurplusBy === 'discount') {
      list = [...list].sort((a, b) => b.discountPercent - a.discountPercent);
    } else if (sortSurplusBy === 'price_asc') {
      list = [...list].sort((a, b) => a.surplusPrice - b.surplusPrice);
    } else if (sortSurplusBy === 'newest') {
      list = [...list].reverse();
    }
    return list;
  }, [allSurplusList, selectedSurplusCategory, searchSurplusQuery, sortSurplusBy]);

  // Handle Register Surplus Item
  const handleRegisterSurplus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSurpTitle.trim() || !newSurpFactory.trim() || !newSurpPrice.trim()) return;
    if (!isSurpPhoneVerified) {
      alert("جهت حفظ امنیت و اصالت کارخانه، تأیید پیامکی شماره همراه الزامی است.");
      return;
    }

    const orgPrice = Number(newSurpOriginalPrice) || Math.round(Number(newSurpPrice) * 1.25);
    const surpPrice = Number(newSurpPrice);
    const discount = Math.max(5, Math.round(((orgPrice - surpPrice) / orgPrice) * 100));

    const newItem: SurplusItem = {
      id: `surp-${Date.now()}`,
      title: newSurpTitle.trim(),
      factoryName: newSurpFactory.trim(),
      brand: newSurpBrand.trim() || newSurpFactory.trim(),
      category: newSurpCat,
      location: newSurpLocation.trim() || "ایران",
      readyCartons: Number(newSurpReadyCartons) || 100,
      minOrderCartons: Number(newSurpMinOrder) || 10,
      originalPrice: orgPrice,
      surplusPrice: surpPrice,
      discountPercent: discount,
      productionDate: newSurpDate.trim() || "تولید روز جاری",
      cause: newSurpCause.trim() || "مازاد خط تولید و تکمیل سهمیه شیفت",
      deliveryCondition: newSurpDelivery.trim() || "تحویل فوری درب کارخانه",
      description: newSurpDesc.trim() || "بار تازه و اعلا مستقیماً از انتهای خط بسته‌بندی کارخانه با تخفیف ویژه نقدی.",
      imageUrl: uploadedSurpImageBase64 || "https://c102393.parspack.net/c102393/products/prd_5.webp",
      phone: newSurpPhone.trim(),
      status: "approved"
    };

    const updated = [newItem, ...surplusList];
    setSurplusList(updated);
    try {
      localStorage.setItem("dastavval_surplus_goods", JSON.stringify(updated));
    } catch (err) {}

    window.dispatchEvent(new CustomEvent("dastavval_ads_updated"));

    setSurpSuccessMsg("مازاد خط تولید کارخانه با موفقیت اعلام شد و در تالار مازاد تولید برای خریداران عمده فعال گردید.");
    setTimeout(() => {
      setShowAddSurplusModal(false);
      setSurpSuccessMsg("");
      setNewSurpTitle("");
      setNewSurpFactory("");
      setNewSurpBrand("");
      setNewSurpLocation("");
      setNewSurpReadyCartons("");
      setNewSurpOriginalPrice("");
      setNewSurpPrice("");
      setNewSurpPhone("");
      setNewSurpDesc("");
      setUploadedSurpImageBase64(null);
    }, 2500);
  };

  // Handle Order Surplus Submit
  const handleOrderSurplusSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderSurpBuyerName.trim() || !orderSurpBuyerPhone.trim()) return;

    const trackingCode = `SURP-REQ-${Math.floor(100000 + Math.random() * 900000)}`;

    const newRfq: any = {
      id: trackingCode,
      trackingNumber: trackingCode,
      type: "surplus",
      materialName: `استعلام خرید مازاد خط تولید: ${selectedSurplusForOrder?.title || "مازاد خط"}`,
      title: `استعلام خرید مازاد خط تولید: ${selectedSurplusForOrder?.title || "مازاد خط"}`,
      buyerFactoryName: orderSurpBuyerName.trim(),
      requester: orderSurpBuyerName.trim(),
      buyerPhone: orderSurpBuyerPhone.trim(),
      buyerCity: orderSurpBuyerCity.trim() || "سراسر کشور",
      buyerNotes: orderSurpNotes.trim(),
      createdAt: new Date().toLocaleDateString('fa-IR'),
      status: "در حال بررسی و بارگیری کارخانه",
      bids: [],
      items: [
        {
          productId: selectedSurplusForOrder?.id || "surp-item",
          name: selectedSurplusForOrder?.title || "مازاد خط تولید",
          quantityCartons: Number(orderSurpQty) || selectedSurplusForOrder?.minOrderCartons || 10,
          pricePerCarton: selectedSurplusForOrder?.surplusPrice || 0,
          totalItems: Number(orderSurpQty) || 10,
          notes: orderSurpNotes.trim()
        }
      ]
    };

    const updatedRfqs = [newRfq, ...rfqOrders];
    setRfqOrders(updatedRfqs);
    try {
      localStorage.setItem("dastavval_raw_orders", JSON.stringify(updatedRfqs));
    } catch (err) {}

    window.dispatchEvent(new CustomEvent("dastavval_orders_updated"));
    setOrderSurpSubmittedCode(trackingCode);
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
              onClick={() => setActiveSubTab('sediment')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1 whitespace-nowrap cursor-pointer ${
                activeSubTab === 'sediment'
                  ? "bg-rose-600 text-white font-black"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
              }`}
            >
              <Archive size={13} />
              <span>کالاهای رسوب‌کرده ({toPersianNum(allSedimentList.length)})</span>
            </button>

            <button
              onClick={() => setActiveSubTab('surplus')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1 whitespace-nowrap cursor-pointer ${
                activeSubTab === 'surplus'
                  ? "bg-amber-600 text-white font-black"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
              }`}
            >
              <Flame size={13} />
              <span>مازاد تولید ({toPersianNum(allSurplusList.length)})</span>
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
              onClick={() => setActiveSubTab('barter')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1 whitespace-nowrap cursor-pointer ${
                activeSubTab === 'barter'
                  ? "bg-emerald-600 text-white font-black"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
              }`}
            >
              <ArrowLeftRight size={13} />
              <span>تهاتر صنعتی</span>
            </button>

            <button
              onClick={() => setActiveSubTab('rfqs')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1 whitespace-nowrap cursor-pointer ${
                activeSubTab === 'rfqs'
                  ? "bg-emerald-600 text-white font-black"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
              }`}
            >
              <FileSpreadsheet size={13} />
              <span>استعلام خرید</span>
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
          {/* Category Filter Tabs, Industrial Park & Province Selectors, Search & Special Flags */}
          <div className="bg-white border-2 border-slate-200/80 rounded-3xl p-4 sm:p-5 shadow-sm space-y-3 text-right" dir="rtl">
            {/* Always-visible Header Bar: Search + Collapsible Filter Toggle */}
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

              {/* Action Buttons: Toggle Collapsible Drawer & Layout */}
              <div className="flex items-center gap-2 justify-between lg:justify-end">
                <button
                  onClick={() => setIsFiltersCollapsed(!isFiltersCollapsed)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer border shadow-2xs ${
                    !isFiltersCollapsed 
                      ? "bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-600/20" 
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <Filter size={15} className={!isFiltersCollapsed ? "text-white animate-spin" : "text-emerald-600"} />
                  <span>{isFiltersCollapsed ? "🎛️ فیلترهای پیشرفته و شهرک‌ها" : "بستن پنل فیلترها"}</span>
                  {(selectedCategory !== "همه صنایع" || selectedIndustrialPark !== "همه شهرک‌ها" || selectedProvince !== "همه استان‌ها" || onlyFirstHand || onlyLuxuryBadges || onlyWithEmptyCapacity) && (
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  )}
                  <ChevronDown size={14} className={`transition-transform duration-300 ${!isFiltersCollapsed ? "rotate-180" : ""}`} />
                </button>

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
              </div>
            </div>

            {/* Collapsible Filter Panel (Drawer) */}
            <AnimatePresence>
              {!isFiltersCollapsed && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4 pt-3 border-t border-slate-100 overflow-hidden"
                >
                  {/* Geographical & Industrial Park Selectors */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {/* Industrial Park Dropdown */}
                    <div className="relative">
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
                    <div className="relative">
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
                    <div className="relative">
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

                  {/* Special Filtering Quick-Chips */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                    <div className="flex flex-wrap items-center gap-2">
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
                </motion.div>
              )}
            </AnimatePresence>
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

      {/* SUB-TAB: SEDIMENT GOODS (کالاهای رسوب‌کرده کارخانجات) */}
      {activeSubTab === 'sediment' && (
        <div className="space-y-6 animate-in fade-in duration-300 text-right" dir="rtl">
          {/* Top Banner & Post Ad CTA */}
          <div className="relative overflow-hidden bg-white rounded-[2.5rem] p-6 sm:p-8 text-slate-900 border border-slate-200 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-6">
            <div className="absolute -top-10 -left-10 w-40 h-40 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="space-y-2 max-w-2xl text-right z-10" dir="rtl">
              <span className="inline-flex items-center gap-1.5 bg-rose-50 text-rose-800 text-[11px] font-black px-3 py-1 rounded-full border border-rose-200 shadow-2xs">
                <Archive size={14} className="text-rose-600 animate-pulse" />
                <span>سامانه آزادسازی انبار و نقدشوندگی کالاهای رسوب‌کرده کارخانجات</span>
              </span>
              <h2 className="text-lg sm:text-2xl font-black text-slate-900 leading-snug">
                تالار حراج و ترخیص کالاهای رسوب‌کرده و انبارداری کارخانجات
              </h2>
              <p className="text-xs text-slate-600 font-medium leading-relaxed font-sans">
                کالاهای استاندارد و دارای پروانه بهداشتی دپو شده در انبار کارخانجات معتبر با تخفیف‌های استثنایی نقدی (تا ۵۰٪ زیر قیمت عمده کارخانه) جهت آزادسازی انبار و تامین فوری نقدینگی، ویژه بنکداران و عمده‌فروشان سراسر کشور.
              </p>
            </div>

            <button
              onClick={() => {
                if (user?.role === "factory") {
                  setNewSedFactory(user.company || user.name || "");
                }
                setShowAddSedimentModal(true);
              }}
              className="px-6 py-4 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-black text-xs sm:text-sm transition-all shadow-lg shadow-rose-600/20 flex items-center gap-2 cursor-pointer relative z-10 hover:scale-[1.02] active:scale-[0.98] shrink-0"
            >
              <PlusCircle size={18} />
              <span>ثبت کالای رسوب‌کرده کارخانه من</span>
            </button>
          </div>

          {/* Category Selector & Live Search */}
          <div className="bg-white border border-slate-200 p-6 rounded-[2.5rem] shadow-3xs space-y-4 text-right">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="space-y-1">
                <h3 className="text-xs sm:text-sm font-black text-slate-800">فیلتر و پایش کالاهای رسوب‌کرده</h3>
                <p className="text-[10px] text-slate-400 font-bold">حراج اقلام دپو شده با تخفیف بالا، مجوز بهداشتی کامل و تحویل فوری از انبار</p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full md:w-auto">
                <div className="relative w-full sm:w-72">
                  <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                  <input
                    type="text"
                    value={searchSedimentQuery}
                    onChange={(e) => setSearchSedimentQuery(e.target.value)}
                    placeholder="جستجوی عنوان کالا، برند یا کارخانه..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl pr-10 pl-4 py-3 text-xs font-black focus:outline-none focus:ring-1 focus:ring-rose-500 focus:bg-white focus:border-rose-500 shadow-2xs transition-all text-slate-800"
                  />
                  {searchSedimentQuery && (
                    <button onClick={() => setSearchSedimentQuery("")} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                      <X size={14} />
                    </button>
                  )}
                </div>

                <select
                  value={sortSedimentBy}
                  onChange={(e) => setSortSedimentBy(e.target.value as any)}
                  className="bg-slate-50 text-slate-800 text-xs rounded-2xl px-3 py-3 border border-slate-200 focus:outline-none font-bold cursor-pointer w-full sm:w-auto"
                >
                  <option value="discount">بیشترین تخفیف (%)</option>
                  <option value="price_asc">ارزان‌ترین قیمت کارتن</option>
                  <option value="stock_desc">بیشترین موجودی انبار</option>
                </select>
              </div>
            </div>

            {/* Categories scrollbar */}
            <div className="border-t border-slate-100 pt-3 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {["همه کالاهای رسوب‌کرده", "کیک، کلوچه و بیسکویت", "شوینده و بهداشتی", "نوشیدنی و آبمیوه", "مواد غذایی و کنسروجات", "روغن و چربی‌های خوراکی"].map((cat) => (
                <button
                  key={`sed-cat-btn-${cat}`}
                  onClick={() => setSelectedSedimentCategory(cat)}
                  className={`px-4 py-2 rounded-2xl text-xs font-black transition-all shrink-0 cursor-pointer ${
                    selectedSedimentCategory === cat
                      ? "bg-rose-600 text-white shadow-md shadow-rose-600/20"
                      : "bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100/50"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Grid of Sediment Goods */}
          {filteredSedimentGoods.length === 0 ? (
            <div className="bg-white rounded-[2.5rem] border border-slate-200 p-12 text-center space-y-4 shadow-sm">
              <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center mx-auto text-2xl">
                📦
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-black text-slate-800">هیچ کالای رسوب‌کرده‌ای مطابق فیلتر یافت نشد</h3>
                <p className="text-xs text-slate-400 font-bold max-w-md mx-auto">
                  می‌توانید فیلتر دسته‌بندی را تغییر داده یا از نوار جستجو استفاده نمایید. همچنین کارخانجات می‌توانند اقلام دپو شده را ثبت کنند.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSedimentGoods.map((item, idx) => (
                <motion.div
                  key={`sed-card-${item.id || idx}`}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-[2.5rem] border border-slate-200 hover:border-rose-300 hover:shadow-xl transition-all p-6 flex flex-col justify-between text-right space-y-4"
                  dir="rtl"
                >
                  <div className="space-y-3">
                    <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-white border border-slate-200 p-2.5 flex items-center justify-center shadow-3xs group/img">
                      <img src={item.imageUrl} alt={item.title} className="w-full h-full object-contain p-1" referrerPolicy="no-referrer" />
                      <div className="absolute top-2.5 right-2.5 flex flex-col gap-1 items-end z-10">
                        <span className="bg-rose-600 text-white text-[10px] font-black px-2 py-0.5 rounded-lg shadow-md flex items-center gap-1">
                          <TrendingDown size={11} />
                          <span>%{toPersianNum(item.discountPercent)} تخفیف انبار</span>
                        </span>
                        <span className="bg-slate-900/80 backdrop-blur-xs text-white text-[9.5px] font-bold px-2 py-0.5 rounded-md">
                          دپو: {item.sedimentDuration}
                        </span>
                      </div>
                      <span className="absolute bottom-2.5 left-2.5 bg-white/90 backdrop-blur-md text-amber-800 font-black text-[9.5px] px-2 py-0.5 rounded-full border border-amber-200 flex items-center gap-1 z-10">
                        <Clock size={10} className="text-amber-600" />
                        <span>{item.shelfLifeRemaining}</span>
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5 text-rose-700 text-[10px] font-black">
                        <Building2 size={13} />
                        <span>{item.factoryName}</span>
                        {item.brand && <span className="text-slate-400 font-bold">({item.brand})</span>}
                      </div>
                      <h3 className="text-sm font-black text-slate-900 leading-snug line-clamp-2 hover:text-rose-700 transition-colors">
                        {item.title}
                      </h3>
                      <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold">
                        <MapPin size={11} className="text-rose-500" />
                        <span>{item.location}</span>
                        <span className="w-1 h-1 rounded-full bg-slate-200" />
                        <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600">{item.category}</span>
                      </div>
                    </div>

                    {/* Stock and Min order */}
                    <div className="bg-slate-50/80 border border-slate-100 rounded-2xl p-3 space-y-1.5 text-xs">
                      <div className="flex justify-between items-center text-[11px] text-slate-600">
                        <span className="font-bold">موجودی انبار کارخانه:</span>
                        <span className="font-black text-slate-900 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-100">{toPersianNum(item.stockCartons)} کارتن</span>
                      </div>
                      <div className="flex justify-between items-center text-[11px] text-slate-600">
                        <span className="font-bold">حداقل سفارش:</span>
                        <span className="font-black text-slate-800">{toPersianNum(item.minOrderCartons)} کارتن</span>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-500 font-medium leading-relaxed line-clamp-2">
                      {item.description}
                    </p>
                  </div>

                  {/* Pricing and Order Button */}
                  <div className="pt-2 border-t border-slate-100 space-y-3">
                    <div className="flex items-end justify-between">
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block line-through">
                          قیمت کارخانه: {toPersianNum(item.originalPrice.toLocaleString())} ت
                        </span>
                        <span className="text-[11px] font-bold text-rose-600">
                          قیمت حراج رسوب انبار:
                        </span>
                      </div>
                      <div className="text-left">
                        <span className="text-base font-black text-rose-600">
                          {toPersianNum(item.sedimentPrice.toLocaleString())}
                        </span>
                        <span className="text-[10px] text-slate-500 font-medium mr-1">تومان / کارتن</span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedSedimentForOrder(item);
                        setOrderSedQty(String(item.minOrderCartons || 10));
                        setOrderSedSubmittedCode(null);
                        setShowOrderSedimentModal(true);
                      }}
                      className="w-full bg-rose-600 hover:bg-rose-700 text-white font-black py-3 rounded-2xl text-[11px] sm:text-xs transition-all shadow-md shadow-rose-600/10 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                    >
                      <ShoppingCart size={15} />
                      <span>ثبت سفارش و خرید نقدی با تخفیف</span>
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB: SURPLUS PRODUCTION (مازاد خط تولید کارخانجات) */}
      {activeSubTab === 'surplus' && (
        <div className="space-y-6 animate-in fade-in duration-300 text-right" dir="rtl">
          {/* Top Banner & Post Surplus CTA */}
          <div className="relative overflow-hidden bg-white rounded-[2.5rem] p-6 sm:p-8 text-slate-900 border border-slate-200 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-6">
            <div className="absolute -top-10 -left-10 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="space-y-2 max-w-2xl text-right z-10" dir="rtl">
              <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-900 text-[11px] font-black px-3 py-1 rounded-full border border-amber-200 shadow-2xs">
                <Flame size={14} className="text-amber-600 animate-bounce" />
                <span>سامانه عرضه مستقیم مازاد خطوط تولید و شیفت‌های مازاد کارخانجات</span>
              </span>
              <h2 className="text-lg sm:text-2xl font-black text-slate-900 leading-snug">
                تالار خرید بی‌واسطه مازاد تولید روزانه، شیفت‌های اضافی و لغو سفارشات صادراتی
              </h2>
              <p className="text-xs text-slate-600 font-medium leading-relaxed font-sans">
                محصولات داغ و تازه‌تولید که به دلیل تکمیل زودهنگام ظرفیت روزانه خط یا کنسلی پارت‌های صادراتی با قیمت کف خط تولید و تخفیف نقدی استثنایی مستقیماً از انتهای خط کارخانه واگذار می‌شوند.
              </p>
            </div>

            <button
              onClick={() => {
                if (user?.role === "factory") {
                  setNewSurpFactory(user.company || user.name || "");
                }
                setShowAddSurplusModal(true);
              }}
              className="px-6 py-4 bg-amber-600 hover:bg-amber-700 text-white rounded-2xl font-black text-xs sm:text-sm transition-all shadow-lg shadow-amber-600/20 flex items-center gap-2 cursor-pointer relative z-10 hover:scale-[1.02] active:scale-[0.98] shrink-0"
            >
              <PlusCircle size={18} />
              <span>اعلام مازاد خط تولید کارخانه</span>
            </button>
          </div>

          {/* Search & Filter Bar */}
          <div className="bg-white border border-slate-200 p-6 rounded-[2.5rem] shadow-3xs space-y-4 text-right">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="space-y-1">
                <h3 className="text-xs sm:text-sm font-black text-slate-800">فیلتر و پایش اقلام مازاد تولید</h3>
                <p className="text-[10px] text-slate-400 font-bold">بارگیری مستقیم از درب کارخانه، تاریخ کاملاً روز و تخفیف نقدی کف خط</p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full md:w-auto">
                <div className="relative w-full sm:w-72">
                  <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                  <input
                    type="text"
                    value={searchSurplusQuery}
                    onChange={(e) => setSearchSurplusQuery(e.target.value)}
                    placeholder="جستجوی عنوان مازاد، کارخانه، برند یا علت..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl pr-10 pl-4 py-3 text-xs font-black focus:outline-none focus:ring-1 focus:ring-amber-500 focus:bg-white focus:border-amber-500 shadow-2xs transition-all text-slate-800"
                  />
                  {searchSurplusQuery && (
                    <button onClick={() => setSearchSurplusQuery("")} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                      <X size={14} />
                    </button>
                  )}
                </div>

                <select
                  value={sortSurplusBy}
                  onChange={(e) => setSortSurplusBy(e.target.value as any)}
                  className="bg-slate-50 text-slate-800 text-xs rounded-2xl px-3 py-3 border border-slate-200 focus:outline-none font-bold cursor-pointer w-full sm:w-auto"
                >
                  <option value="discount">بیشترین تخفیف (%)</option>
                  <option value="newest">تازه‌ترین تولیدات</option>
                  <option value="price_asc">ارزان‌ترین قیمت کارتن</option>
                </select>
              </div>
            </div>

            {/* Category Pills */}
            <div className="border-t border-slate-100 pt-3 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {SURPLUS_CATEGORIES.map((cat) => (
                <button
                  key={`surp-cat-btn-${cat}`}
                  onClick={() => setSelectedSurplusCategory(cat)}
                  className={`px-4 py-2 rounded-2xl text-xs font-black transition-all shrink-0 cursor-pointer ${
                    selectedSurplusCategory === cat
                      ? "bg-amber-600 text-white shadow-md shadow-amber-600/20"
                      : "bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100/50"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Grid of Surplus Goods */}
          {filteredSurplusGoods.length === 0 ? (
            <div className="bg-white rounded-[2.5rem] border border-slate-200 p-12 text-center space-y-4 shadow-sm">
              <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center mx-auto text-2xl">
                🔥
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-black text-slate-800">هیچ مازاد تولیدی مطابق فیلتر یافت نشد</h3>
                <p className="text-xs text-slate-400 font-bold max-w-md mx-auto">
                  می‌توانید فیلتر دسته‌بندی را تغییر داده یا از نوار جستجو استفاده نمایید. همچنین کارخانجات می‌توانند مازاد شیفت خود را ثبت کنند.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSurplusGoods.map((item, idx) => (
                <motion.div
                  key={`surp-card-${item.id || idx}`}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-[2.5rem] border border-slate-200 hover:border-amber-300 hover:shadow-xl transition-all p-6 flex flex-col justify-between text-right space-y-4"
                  dir="rtl"
                >
                  <div className="space-y-3">
                    <div className="w-full h-44 rounded-2xl overflow-hidden relative bg-slate-100 border border-slate-100">
                      <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      <div className="absolute top-3 right-3 flex flex-col gap-1.5 items-end">
                        <span className="bg-amber-600 text-white text-[11px] font-black px-2.5 py-1 rounded-xl shadow-md flex items-center gap-1">
                          <TrendingDown size={12} />
                          <span>%{toPersianNum(item.discountPercent)} تخفیف مازاد خط</span>
                        </span>
                        <span className="bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-lg">
                          {item.productionDate}
                        </span>
                      </div>
                      <span className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-md text-slate-800 font-black text-[10px] px-2.5 py-1 rounded-full border border-slate-200 flex items-center gap-1">
                        <Truck size={11} className="text-amber-600" />
                        <span>تحویل فوری درب کارخانه</span>
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5 text-amber-700 text-[10px] font-black">
                        <Building2 size={13} />
                        <span>{item.factoryName}</span>
                        {item.brand && <span className="text-slate-400 font-bold">({item.brand})</span>}
                      </div>
                      <h3 className="text-sm font-black text-slate-900 leading-snug line-clamp-2 hover:text-amber-700 transition-colors">
                        {item.title}
                      </h3>
                      <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold">
                        <MapPin size={11} className="text-amber-500" />
                        <span>{item.location}</span>
                        <span className="w-1 h-1 rounded-full bg-slate-200" />
                        <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600">{item.category}</span>
                      </div>
                    </div>

                    {/* Cause & Ready Stock */}
                    <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-3 space-y-1.5 text-xs">
                      <div className="flex justify-between items-center text-[11px] text-slate-700">
                        <span className="font-bold text-amber-900">علت عرضه مازاد:</span>
                        <span className="font-bold text-slate-800 text-[10px]">{item.cause}</span>
                      </div>
                      <div className="flex justify-between items-center text-[11px] text-slate-600 border-t border-amber-100/60 pt-1.5">
                        <span className="font-bold">موجودی آماده بارگیری:</span>
                        <span className="font-black text-amber-800 bg-amber-100/60 px-2 py-0.5 rounded-md">{toPersianNum(item.readyCartons)} کارتن</span>
                      </div>
                      <div className="flex justify-between items-center text-[11px] text-slate-600">
                        <span className="font-bold">حداقل خرید:</span>
                        <span className="font-black text-slate-800">{toPersianNum(item.minOrderCartons)} کارتن</span>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-500 font-medium leading-relaxed line-clamp-2">
                      {item.description}
                    </p>
                  </div>

                  {/* Pricing and Order Button */}
                  <div className="pt-2 border-t border-slate-100 space-y-3">
                    <div className="flex items-end justify-between">
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block line-through">
                          قیمت معمول خط: {toPersianNum(item.originalPrice.toLocaleString())} ت
                        </span>
                        <span className="text-[11px] font-bold text-amber-700">
                          قیمت مازاد تولید (تسویه نقدی):
                        </span>
                      </div>
                      <div className="text-left">
                        <span className="text-base font-black text-amber-700">
                          {toPersianNum(item.surplusPrice.toLocaleString())}
                        </span>
                        <span className="text-[10px] text-slate-500 font-medium mr-1">تومان / کارتن</span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedSurplusForOrder(item);
                        setOrderSurpQty(String(item.minOrderCartons || 10));
                        setOrderSurpSubmittedCode(null);
                        setShowOrderSurplusModal(true);
                      }}
                      className="w-full bg-amber-600 hover:bg-amber-700 text-white font-black py-3 rounded-2xl text-[11px] sm:text-xs transition-all shadow-md shadow-amber-600/10 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                    >
                      <ShoppingCart size={15} />
                      <span>ثبت سفارش و خرید مازاد خط تولید</span>
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
                    <div className="space-y-1.5 sm:col-span-2">
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
                  </div>

                  {/* Mandatory Phone Verification */}
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
                    <label className="font-black text-slate-800 text-xs block mb-2">شماره تماس مستقیم و تایید پیامکی تامین‌کننده:</label>
                    <SmsPhoneVerifier
                      phone={newMatPhone}
                      onPhoneChange={(phone) => setNewMatPhone(phone)}
                      onVerificationSuccess={(verifiedPhone) => {
                        setIsRawMatPhoneVerified(true);
                        setNewMatPhone(verifiedPhone);
                      }}
                      isVerified={isRawMatPhoneVerified}
                    />
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
                    disabled={!isRawMatPhoneVerified}
                    className={`w-full py-3.5 rounded-xl font-black text-xs shadow-lg transition-all flex items-center justify-center gap-2 ${
                      isRawMatPhoneVerified
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20 cursor-pointer active:scale-95"
                        : "bg-slate-200 text-slate-400 cursor-not-allowed"
                    }`}
                  >
                    <ShieldCheck size={16} />
                    <span>{isRawMatPhoneVerified ? "تایید مشخصات و انتشار بار با ضمانت امن دست‌اول" : "تایید پیامکی شماره همراه الزامی است"}</span>
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

      {/* MODAL 1: ORDER SEDIMENT GOOD (ثبت سفارش خرید کالای رسوب‌کرده) */}
      <AnimatePresence>
        {showOrderSedimentModal && selectedSedimentForOrder && (
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
                  <div className="inline-flex items-center gap-1.5 bg-rose-50 border border-rose-200 px-3 py-1 rounded-full text-[10px] font-black text-rose-800 mb-2">
                    <Archive size={12} className="text-rose-600" />
                    <span>خرید با تخفیف رسوب‌زدایی نقدی</span>
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900">
                    استعلام و خرید کالای رسوب‌کرده انبار
                  </h3>
                </div>
                <button
                  onClick={() => {
                    setShowOrderSedimentModal(false);
                    setOrderSedSubmittedCode(null);
                  }}
                  className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {orderSedSubmittedCode ? (
                <div className="p-4 sm:p-6 text-center space-y-5">
                  <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-emerald-600 shadow-2xs">
                    <CheckCircle2 size={32} />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-base font-black text-slate-950">سفارش شما با موفقیت ثبت شد</h4>
                    <p className="text-xs text-slate-600 font-bold max-w-sm mx-auto leading-relaxed">
                      درخواست خرید شما با کارخانه <strong className="text-slate-900 font-black">{selectedSedimentForOrder.factoryName}</strong> هماهنگ شد. کارشناسان پلتفرم دست‌اول جهت نهایی‌سازی تسویه امانی و صدور بارنامه با شما تماس خواهند گرفت.
                    </p>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
                    <span className="text-[10px] text-slate-400 font-bold block">کد پیگیری اختصاصی:</span>
                    <strong className="text-base font-mono text-emerald-700 tracking-wider block font-black">{orderSedSubmittedCode}</strong>
                    <span className="text-[9px] text-slate-400 font-bold block">این سفارش در بخش «استعلام‌های خرید» نیز در دسترس شماست.</span>
                  </div>

                  <button
                    onClick={() => {
                      setShowOrderSedimentModal(false);
                      setOrderSedSubmittedCode(null);
                    }}
                    className="w-full bg-slate-950 hover:bg-slate-900 text-white font-black py-3 rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    متوجه شدم - بستن پنجره
                  </button>
                </div>
              ) : (
                <form onSubmit={handleOrderSedimentSubmit} className="space-y-4">
                  {/* Selected Item Summary */}
                  <div className="bg-rose-50/40 border border-rose-100 rounded-2xl p-4 text-xs space-y-2">
                    <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold">
                      <span className="text-rose-700 font-black">{selectedSedimentForOrder.factoryName}</span>
                      <span className="bg-rose-600 text-white px-2 py-0.5 rounded font-black text-[10px]">
                        %{toPersianNum(selectedSedimentForOrder.discountPercent)} تخفیف
                      </span>
                    </div>
                    <h4 className="text-xs font-black text-slate-900 leading-snug">
                      {selectedSedimentForOrder.title}
                    </h4>
                    <div className="flex justify-between items-center text-[11px] pt-2 border-t border-rose-100 font-bold">
                      <span className="text-slate-500">قیمت تخفیف‌خورده:</span>
                      <span className="text-rose-700 font-black text-sm">
                        {toPersianNum(selectedSedimentForOrder.sedimentPrice.toLocaleString())} تومان / کارتن
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-black text-slate-800 mb-1.5">
                        نام خریدار / شرکت / بنکداری <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={orderSedBuyerName}
                        onChange={(e) => setOrderSedBuyerName(e.target.value)}
                        placeholder="مثال: بازرگانی پارس / فروشگاه مرکزی"
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black text-slate-800 mb-1.5">
                        شماره تماس مستقیم <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={orderSedBuyerPhone}
                        onChange={(e) => setOrderSedBuyerPhone(e.target.value)}
                        placeholder="مثال: ۰۹۱۲۳۴۵۶۷۸۹"
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-slate-800 text-left"
                        dir="ltr"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-black text-slate-800 mb-1.5">
                        شهر مقصد تحویل بار
                      </label>
                      <input
                        type="text"
                        value={orderSedBuyerCity}
                        onChange={(e) => setOrderSedBuyerCity(e.target.value)}
                        placeholder="مثال: اصفهان / شیراز"
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black text-slate-800 mb-1.5">
                        تعداد کارتن درخواستی (حداقل {toPersianNum(selectedSedimentForOrder.minOrderCartons)})
                      </label>
                      <input
                        type="number"
                        min={selectedSedimentForOrder.minOrderCartons || 1}
                        max={selectedSedimentForOrder.stockCartons || 9999}
                        required
                        value={orderSedQty}
                        onChange={(e) => setOrderSedQty(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs font-black focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-slate-800"
                      />
                    </div>
                  </div>

                  {/* Calculated Estimate */}
                  {Number(orderSedQty) > 0 && (
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-600">برآورد کل سفارش با احتساب تخفیف:</span>
                      <span className="font-black text-rose-700 text-sm">
                        {toPersianNum((Number(orderSedQty) * selectedSedimentForOrder.sedimentPrice).toLocaleString())} تومان
                      </span>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-black text-slate-800 mb-1.5">
                      توضیحات و نیازمندی‌های بارگیری
                    </label>
                    <textarea
                      rows={2}
                      value={orderSedNotes}
                      onChange={(e) => setOrderSedNotes(e.target.value)}
                      placeholder="در صورت تمایل به ارسال نمونه یا تحویل در انبار مقصد، در این قسمت درج فرمایید..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-slate-800"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="w-full bg-rose-600 hover:bg-rose-700 text-white font-black py-3.5 rounded-xl text-xs transition-colors shadow-lg shadow-rose-600/20 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Send size={15} />
                      <span>ثبت نهایی سفارش خرید با ضمانت امانی دست‌اول</span>
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: ADD NEW SEDIMENT GOOD (ثبت کالای رسوب‌کرده کارخانه) */}
      <AnimatePresence>
        {showAddSedimentModal && (
          <div className="fixed inset-0 z-50 flex justify-center items-start sm:items-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[2rem] sm:rounded-[2.5rem] max-w-xl w-full p-6 sm:p-8 space-y-5 shadow-2xl border border-slate-100 my-auto text-right max-h-[90vh] overflow-y-auto"
              dir="rtl"
            >
              <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                <div>
                  <div className="inline-flex items-center gap-1.5 bg-rose-50 border border-rose-200 px-3 py-1 rounded-full text-[10px] font-black text-rose-800 mb-2">
                    <PlusCircle size={12} className="text-rose-600" />
                    <span>آزادسازی انبار و نقدشوندگی سریع سرمایه کارخانه</span>
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900">
                    اعلام کالای رسوب‌کرده / مازاد انبار کارخانه
                  </h3>
                </div>
                <button
                  onClick={() => setShowAddSedimentModal(false)}
                  className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {sedSuccessMsg ? (
                <div className="p-6 text-center space-y-4">
                  <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-emerald-600 shadow-2xs">
                    <CheckCircle2 size={32} />
                  </div>
                  <h4 className="text-base font-black text-slate-950">کالا با موفقیت ثبت شد</h4>
                  <p className="text-xs text-slate-600 font-bold leading-relaxed">{sedSuccessMsg}</p>
                </div>
              ) : (
                <form onSubmit={handleRegisterSediment} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-black text-slate-800 mb-1">
                        عنوان کالا و نوع بسته‌بندی <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={newSedTitle}
                        onChange={(e) => setNewSedTitle(e.target.value)}
                        placeholder="مثال: بیسکویت کرمدار کاکائویی ۲۴ عددی"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black text-slate-800 mb-1">
                        نام کارخانه / واحد تولیدی <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={newSedFactory}
                        onChange={(e) => setNewSedFactory(e.target.value)}
                        placeholder="مثال: صنایع غذایی مینو"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    <div>
                      <label className="block text-xs font-black text-slate-800 mb-1">نام برند</label>
                      <input
                        type="text"
                        value={newSedBrand}
                        onChange={(e) => setNewSedBrand(e.target.value)}
                        placeholder="مثال: مینو"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black text-slate-800 mb-1">دسته‌بندی</label>
                      <select
                        value={newSedCat}
                        onChange={(e) => setNewSedCat(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold focus:outline-none cursor-pointer"
                      >
                        {SEDIMENT_CATEGORIES.filter(c => c !== "همه کالاهای رسوب‌کرده").map(cat => (
                          <option key={`sed-cat-${cat}`} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-black text-slate-800 mb-1">محل انبار / استان و شهر</label>
                      <input
                        type="text"
                        value={newSedLocation}
                        onChange={(e) => setNewSedLocation(e.target.value)}
                        placeholder="مثال: زنجان، خرمدره"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
                    <div>
                      <label className="block text-xs font-black text-slate-800 mb-1">موجودی (کارتن)</label>
                      <input
                        type="number"
                        value={newSedStock}
                        onChange={(e) => setNewSedStock(e.target.value)}
                        placeholder="مثال: ۴۰۰"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black text-slate-800 mb-1">حداقل سفارش</label>
                      <input
                        type="number"
                        value={newSedMinOrder}
                        onChange={(e) => setNewSedMinOrder(e.target.value)}
                        placeholder="مثال: ۱۰"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black text-slate-800 mb-1">قیمت معمول (تومان)</label>
                      <input
                        type="number"
                        value={newSedOriginalPrice}
                        onChange={(e) => setNewSedOriginalPrice(e.target.value)}
                        placeholder="مثال: ۳۸۰۰۰۰"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black text-slate-800 mb-1">
                        قیمت با تخفیف (تومان) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        required
                        value={newSedPrice}
                        onChange={(e) => setNewSedPrice(e.target.value)}
                        placeholder="مثال: ۲۹۵۰۰۰"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-black text-rose-700 focus:outline-none focus:border-rose-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-black text-slate-800 mb-1">مدت دپو در انبار</label>
                      <input
                        type="text"
                        value={newSedDuration}
                        onChange={(e) => setNewSedDuration(e.target.value)}
                        placeholder="مثال: ۳ ماه دپو در انبار مرکزی"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black text-slate-800 mb-1">تاریخ و اعتبار انقضا</label>
                      <input
                        type="text"
                        value={newSedShelfLife}
                        onChange={(e) => setNewSedShelfLife(e.target.value)}
                        placeholder="مثال: ۷ ماه تا انقضا"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Mandatory Phone Verification */}
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
                    <label className="font-black text-slate-800 text-xs block mb-2">شماره تماس مستقیم و تایید پیامکی کارخانه:</label>
                    <SmsPhoneVerifier
                      phone={newSedPhone}
                      onPhoneChange={(phone) => setNewSedPhone(phone)}
                      onVerificationSuccess={(verifiedPhone) => {
                        setIsSedPhoneVerified(true);
                        setNewSedPhone(verifiedPhone);
                      }}
                      isVerified={isSedPhoneVerified}
                    />
                  </div>

                  {/* Image Upload */}
                  <div>
                    <label className="block text-xs font-black text-slate-800 mb-1.5">تصویر محصول / پالت انبار</label>
                    <div
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                          handleSedImageUpload(e.dataTransfer.files[0]);
                        }
                      }}
                      className="border-2 border-dashed border-slate-200 rounded-2xl p-4 text-center cursor-pointer hover:border-rose-500 transition-colors bg-slate-50 relative flex flex-col items-center justify-center gap-1.5"
                    >
                      <input
                        type="file"
                        accept="image/*"
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleSedImageUpload(e.target.files[0]);
                          }
                        }}
                      />
                      {uploadedSedImageBase64 ? (
                        <div className="flex items-center gap-3 w-full">
                          <img src={uploadedSedImageBase64} alt="Preview" className="w-14 h-14 object-cover rounded-xl border border-slate-200" />
                          <div className="text-right">
                            <span className="text-[10px] text-rose-600 font-black block">تصویر انتخاب شد</span>
                            <span className="text-[9px] text-slate-400 font-bold block">جهت تغییر تصویر دوباره کلیک کنید</span>
                          </div>
                        </div>
                      ) : (
                        <>
                          <UploadCloud size={24} className="text-slate-400" />
                          <span className="text-[10px] text-slate-600 font-black">انتخاب تصویر کالا (کلیک کنید یا تصویر را بکشید)</span>
                          <span className="text-[9px] text-slate-400 font-bold">فرمت‌های مجاز: JPG, PNG</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-800 mb-1">توضیحات تکمیلی و شرایط تسویه</label>
                    <textarea
                      rows={2}
                      value={newSedDesc}
                      onChange={(e) => setNewSedDesc(e.target.value)}
                      placeholder="وضعیت سلامت کارتن‌ها، نحوه بارگیری از انبار کارخانه و شرایط پرداخت نقدی..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium focus:outline-none"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={!isSedPhoneVerified}
                      className={`w-full font-black py-3.5 rounded-xl text-xs transition-colors shadow-lg flex items-center justify-center gap-2 cursor-pointer ${
                        isSedPhoneVerified
                          ? "bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20"
                          : "bg-slate-200 text-slate-400 cursor-not-allowed"
                      }`}
                    >
                      <Send size={15} />
                      <span>{isSedPhoneVerified ? "ثبت و انتشار کالای رسوب‌کرده در تالار فروش" : "تایید پیامکی شماره کارخانه الزامی است"}</span>
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 3: ORDER SURPLUS GOOD (ثبت سفارش خرید مازاد خط تولید) */}
      <AnimatePresence>
        {showOrderSurplusModal && selectedSurplusForOrder && (
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
                  <div className="inline-flex items-center gap-1.5 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full text-[10px] font-black text-amber-800 mb-2">
                    <Flame size={12} className="text-amber-600" />
                    <span>خرید مازاد خط تولید با قیمت کف</span>
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900">
                    استعلام و خرید مازاد خط تولید کارخانه
                  </h3>
                </div>
                <button
                  onClick={() => {
                    setShowOrderSurplusModal(false);
                    setOrderSurpSubmittedCode(null);
                  }}
                  className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {orderSurpSubmittedCode ? (
                <div className="p-4 sm:p-6 text-center space-y-5">
                  <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-emerald-600 shadow-2xs">
                    <CheckCircle2 size={32} />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-base font-black text-slate-950">سفارش مازاد تولید با موفقیت ثبت شد</h4>
                    <p className="text-xs text-slate-600 font-bold max-w-sm mx-auto leading-relaxed">
                      درخواست شما با کارخانه <strong className="text-slate-900 font-black">{selectedSurplusForOrder.factoryName}</strong> هماهنگ گردید. هماهنگی بارگیری مستقیم از درب کارخانه از طریق کارشناسان دست‌اول انجام خواهد شد.
                    </p>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
                    <span className="text-[10px] text-slate-400 font-bold block">کد رهگیری اختصاصی سفارش:</span>
                    <strong className="text-base font-mono text-emerald-700 tracking-wider block font-black">{orderSurpSubmittedCode}</strong>
                    <span className="text-[9px] text-slate-400 font-bold block">این سفارش در تابلوی استعلام‌های خرید شما ثبت گردید.</span>
                  </div>

                  <button
                    onClick={() => {
                      setShowOrderSurplusModal(false);
                      setOrderSurpSubmittedCode(null);
                    }}
                    className="w-full bg-slate-950 hover:bg-slate-900 text-white font-black py-3 rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    متوجه شدم - بستن پنجره
                  </button>
                </div>
              ) : (
                <form onSubmit={handleOrderSurplusSubmit} className="space-y-4">
                  {/* Selected Item Summary */}
                  <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-4 text-xs space-y-2">
                    <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold">
                      <span className="text-amber-800 font-black">{selectedSurplusForOrder.factoryName}</span>
                      <span className="bg-amber-600 text-white px-2 py-0.5 rounded font-black text-[10px]">
                        %{toPersianNum(selectedSurplusForOrder.discountPercent)} تخفیف مازاد
                      </span>
                    </div>
                    <h4 className="text-xs font-black text-slate-900 leading-snug">
                      {selectedSurplusForOrder.title}
                    </h4>
                    <div className="flex justify-between items-center text-[11px] pt-2 border-t border-amber-100 font-bold">
                      <span className="text-slate-500">قیمت کف خط:</span>
                      <span className="text-amber-700 font-black text-sm">
                        {toPersianNum(selectedSurplusForOrder.surplusPrice.toLocaleString())} تومان / کارتن
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-black text-slate-800 mb-1.5">
                        نام خریدار / بنکداری / فروشگاه <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={orderSurpBuyerName}
                        onChange={(e) => setOrderSurpBuyerName(e.target.value)}
                        placeholder="مثال: بنکداری اتحاد / فروشگاه‌های زنجیره‌ای"
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black text-slate-800 mb-1.5">
                        شماره تماس مستقیم <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={orderSurpBuyerPhone}
                        onChange={(e) => setOrderSurpBuyerPhone(e.target.value)}
                        placeholder="مثال: ۰۹۱۲۳۴۵۶۷۸۹"
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-slate-800 text-left"
                        dir="ltr"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-black text-slate-800 mb-1.5">
                        شهر مقصد تحویل بار
                      </label>
                      <input
                        type="text"
                        value={orderSurpBuyerCity}
                        onChange={(e) => setOrderSurpBuyerCity(e.target.value)}
                        placeholder="مثال: تهران / تبریز / مشهد"
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black text-slate-800 mb-1.5">
                        تعداد کارتن درخواستی (حداقل {toPersianNum(selectedSurplusForOrder.minOrderCartons)})
                      </label>
                      <input
                        type="number"
                        min={selectedSurplusForOrder.minOrderCartons || 1}
                        max={selectedSurplusForOrder.readyCartons || 9999}
                        required
                        value={orderSurpQty}
                        onChange={(e) => setOrderSurpQty(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs font-black focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-slate-800"
                      />
                    </div>
                  </div>

                  {/* Calculated Estimate */}
                  {Number(orderSurpQty) > 0 && (
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-600">برآورد هزینه سفارش با قیمت کف خط:</span>
                      <span className="font-black text-amber-700 text-sm">
                        {toPersianNum((Number(orderSurpQty) * selectedSurplusForOrder.surplusPrice).toLocaleString())} تومان
                      </span>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-black text-slate-800 mb-1.5">
                      توضیحات و هماهنگی بارگیری
                    </label>
                    <textarea
                      rows={2}
                      value={orderSurpNotes}
                      onChange={(e) => setOrderSurpNotes(e.target.value)}
                      placeholder="نوع کامیون یا خاور بارگیری، زمان تحویل و نیازمندی‌های بارنامه..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-slate-800"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="w-full bg-amber-600 hover:bg-amber-700 text-white font-black py-3.5 rounded-xl text-xs transition-colors shadow-lg shadow-amber-600/20 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Send size={15} />
                      <span>ثبت سفارش و خرید مازاد خط با ضمانت امانی دست‌اول</span>
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 4: ADD NEW SURPLUS GOOD (ثبت مازاد خط تولید کارخانه) */}
      <AnimatePresence>
        {showAddSurplusModal && (
          <div className="fixed inset-0 z-50 flex justify-center items-start sm:items-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[2rem] sm:rounded-[2.5rem] max-w-xl w-full p-6 sm:p-8 space-y-5 shadow-2xl border border-slate-100 my-auto text-right max-h-[90vh] overflow-y-auto"
              dir="rtl"
            >
              <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                <div>
                  <div className="inline-flex items-center gap-1.5 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full text-[10px] font-black text-amber-800 mb-2">
                    <Flame size={12} className="text-amber-600" />
                    <span>عرضه مستقیم مازاد خطوط تولید و شیفت شب</span>
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900">
                    اعلام مازاد خط تولید / شیفت اضافه کارخانه
                  </h3>
                </div>
                <button
                  onClick={() => setShowAddSurplusModal(false)}
                  className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {surpSuccessMsg ? (
                <div className="p-6 text-center space-y-4">
                  <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-emerald-600 shadow-2xs">
                    <CheckCircle2 size={32} />
                  </div>
                  <h4 className="text-base font-black text-slate-950">مازاد خط با موفقیت ثبت شد</h4>
                  <p className="text-xs text-slate-600 font-bold leading-relaxed">{surpSuccessMsg}</p>
                </div>
              ) : (
                <form onSubmit={handleRegisterSurplus} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-black text-slate-800 mb-1">
                        عنوان محصول مازاد تولید <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={newSurpTitle}
                        onChange={(e) => setNewSurpTitle(e.target.value)}
                        placeholder="مثال: کروسان مغزدار شکلاتی ۲۴ عددی"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black text-slate-800 mb-1">
                        نام کارخانه / برند <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={newSurpFactory}
                        onChange={(e) => setNewSurpFactory(e.target.value)}
                        placeholder="مثال: صنایع غذایی پچ‌پچ"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    <div>
                      <label className="block text-xs font-black text-slate-800 mb-1">نام برند</label>
                      <input
                        type="text"
                        value={newSurpBrand}
                        onChange={(e) => setNewSurpBrand(e.target.value)}
                        placeholder="مثال: پچ‌پچ"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black text-slate-800 mb-1">دسته‌بندی مازاد</label>
                      <select
                        value={newSurpCat}
                        onChange={(e) => setNewSurpCat(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold focus:outline-none cursor-pointer"
                      >
                        {SURPLUS_CATEGORIES.filter(c => c !== "همه مازادهای تولید").map(cat => (
                          <option key={`surp-cat-${cat}`} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-black text-slate-800 mb-1">محل کارخانه / شهرک صنعتی</label>
                      <input
                        type="text"
                        value={newSurpLocation}
                        onChange={(e) => setNewSurpLocation(e.target.value)}
                        placeholder="مثال: البرز، شهرک صنعتی هشتگرد"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
                    <div>
                      <label className="block text-xs font-black text-slate-800 mb-1">موجودی آماده (کارتن)</label>
                      <input
                        type="number"
                        value={newSurpReadyCartons}
                        onChange={(e) => setNewSurpReadyCartons(e.target.value)}
                        placeholder="مثال: ۳۰۰"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black text-slate-800 mb-1">حداقل سفارش</label>
                      <input
                        type="number"
                        value={newSurpMinOrder}
                        onChange={(e) => setNewSurpMinOrder(e.target.value)}
                        placeholder="مثال: ۱۰"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black text-slate-800 mb-1">قیمت معمول خط (تومان)</label>
                      <input
                        type="number"
                        value={newSurpOriginalPrice}
                        onChange={(e) => setNewSurpOriginalPrice(e.target.value)}
                        placeholder="مثال: ۴۸۰۰۰۰"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black text-slate-800 mb-1">
                        قیمت کف مازاد (تومان) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        required
                        value={newSurpPrice}
                        onChange={(e) => setNewSurpPrice(e.target.value)}
                        placeholder="مثال: ۳۸۸۰۰۰"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-black text-amber-700 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    <div>
                      <label className="block text-xs font-black text-slate-800 mb-1">تاریخ شیفت تولید</label>
                      <input
                        type="text"
                        value={newSurpDate}
                        onChange={(e) => setNewSurpDate(e.target.value)}
                        placeholder="مثال: تولید شیفت شب گذشته"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black text-slate-800 mb-1">علت مازاد خط</label>
                      <input
                        type="text"
                        value={newSurpCause}
                        onChange={(e) => setNewSurpCause(e.target.value)}
                        placeholder="مثال: لغو حواله صادراتی / اضافه تولید روزانه"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black text-slate-800 mb-1">شرایط تحویل و بارگیری</label>
                      <input
                        type="text"
                        value={newSurpDelivery}
                        onChange={(e) => setNewSurpDelivery(e.target.value)}
                        placeholder="مثال: تحویل فوری درب کارخانه با بارنامه رسمی"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Mandatory Phone Verification */}
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
                    <label className="font-black text-slate-800 text-xs block mb-2">شماره تماس مستقیم و تایید پیامکی کارخانه:</label>
                    <SmsPhoneVerifier
                      phone={newSurpPhone}
                      onPhoneChange={(phone) => setNewSurpPhone(phone)}
                      onVerificationSuccess={(verifiedPhone) => {
                        setIsSurpPhoneVerified(true);
                        setNewSurpPhone(verifiedPhone);
                      }}
                      isVerified={isSurpPhoneVerified}
                    />
                  </div>

                  {/* Image Upload */}
                  <div>
                    <label className="block text-xs font-black text-slate-800 mb-1.5">تصویر بار و بسته‌بندی خط تولید</label>
                    <div
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                          handleSurpImageUpload(e.dataTransfer.files[0]);
                        }
                      }}
                      className="border-2 border-dashed border-slate-200 rounded-2xl p-4 text-center cursor-pointer hover:border-amber-500 transition-colors bg-slate-50 relative flex flex-col items-center justify-center gap-1.5"
                    >
                      <input
                        type="file"
                        accept="image/*"
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleSurpImageUpload(e.target.files[0]);
                          }
                        }}
                      />
                      {uploadedSurpImageBase64 ? (
                        <div className="flex items-center gap-3 w-full">
                          <img src={uploadedSurpImageBase64} alt="Preview" className="w-14 h-14 object-cover rounded-xl border border-slate-200" />
                          <div className="text-right">
                            <span className="text-[10px] text-amber-600 font-black block">تصویر انتخاب شد</span>
                            <span className="text-[9px] text-slate-400 font-bold block">جهت تغییر تصویر مجدد کلیک کنید</span>
                          </div>
                        </div>
                      ) : (
                        <>
                          <UploadCloud size={24} className="text-slate-400" />
                          <span className="text-[10px] text-slate-600 font-black">انتخاب تصویر مازاد خط (کلیک کنید یا تصویر را بکشید)</span>
                          <span className="text-[9px] text-slate-400 font-bold">فرمت‌های مجاز: JPG, PNG</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-800 mb-1">توضیحات تکمیلی</label>
                    <textarea
                      rows={2}
                      value={newSurpDesc}
                      onChange={(e) => setNewSurpDesc(e.target.value)}
                      placeholder="توضیحات در خصوص پالت‌بندی، تاریخ دقیق تولید و شرایط تسویه حساب نقدی..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium focus:outline-none"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={!isSurpPhoneVerified}
                      className={`w-full font-black py-3.5 rounded-xl text-xs transition-colors shadow-lg flex items-center justify-center gap-2 cursor-pointer ${
                        isSurpPhoneVerified
                          ? "bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/20"
                          : "bg-slate-200 text-slate-400 cursor-not-allowed"
                      }`}
                    >
                      <Send size={15} />
                      <span>{isSurpPhoneVerified ? "ثبت و انتشار مازاد تولید در تالار دست‌اول" : "تایید پیامکی شماره کارخانه الزامی است"}</span>
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
