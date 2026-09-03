import React, { useState, useMemo, useEffect } from "react";
import { 
  MapPin, 
  ShoppingBag, 
  TrendingUp, 
  Percent, 
  Coins, 
  DollarSign, 
  CheckCircle2, 
  Clock, 
  Building2, 
  Search, 
  Filter, 
  Download, 
  BarChart3,
  Layers,
  Award,
  Sparkles,
  ShieldCheck,
  Compass,
  ArrowUpRight,
  Eye,
  Check,
  Plus,
  X,
  AlertCircle,
  Truck,
  RefreshCw,
  Maximize2,
  Minimize2,
  ChevronRight,
  ChevronLeft
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Order } from "../types";

export interface ProvinceData {
  id: string;
  name: string;
  enName: string;
  capital: string;
  cities?: string[];
  x: number;
  y: number;
  // SVG bounding box or polygon relative scale
  width?: number;
  height?: number;
  path?: string;
  orderCount: number;
  totalVolume: number; // in Toman
  commissionAmount: number; // in Toman
  isCoveredByRep: boolean;
  isPrimaryRepProvince: boolean;
  recentOrders: Order[];
  growthRate: number; // percent
}

interface IranProvinceOrdersMapWidgetProps {
  orders: Order[];
  user?: any;
  onUpdateUser?: (updatedUser: any) => void;
  markupPercent?: number;
  onSelectProvince?: (provinceName: string) => void;
  className?: string;
}

const toPersianNum = (num: number | string | undefined | null) => {
  if (num === undefined || num === null || num === "") return "۰";
  const s = typeof num === 'number' ? num.toLocaleString('fa-IR') : String(num);
  const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return s.replace(/\d/g, (d) => persianDigits[parseInt(d, 10)] || d);
};

// 31 Official Provinces of Iran with geographic anchor coordinates (Scale: 800 x 700)
const RAW_PROVINCES = [
  { id: "tehran", name: "تهران", enName: "Tehran", capital: "تهران", x: 370, y: 235, cities: ["تهران", "ری", "شمیرانات", "شهریار", "ورامین", "اسلامشهر", "دماوند", "پردیس", "قدس", "پاکدشت", "ملارد"] },
  { id: "alborz", name: "البرز", enName: "Alborz", capital: "کرج", x: 345, y: 220, cities: ["کرج", "فردیس", "ساوجبلاغ", "نظرآباد", "طالقان", "اشتهارد", "هشتگرد"] },
  { id: "isfahan", name: "اصفهان", enName: "Isfahan", capital: "اصفهان", x: 385, y: 360, cities: ["اصفهان", "کاشان", "نجف‌آباد", "شاهین‌شهر", "لنجان", "شهرضا", "خمینی‌شهر", "مبارکه", "گلپایگان", "نائین", "نطنز"] },
  { id: "fars", name: "فارس", enName: "Fars", capital: "شیراز", x: 420, y: 520, cities: ["شیراز", "مرودشت", "جهرم", "فسا", "کازرون", "لارستان", "داراب", "فیروزآباد", "آباده", "اقلید", "لامرد"] },
  { id: "khorasan_razavi", name: "خراسان رضوی", enName: "Khorasan Razavi", capital: "مشهد", x: 665, y: 200, cities: ["مشهد", "نیشابور", "سبزوار", "تربت حیدریه", "قوچان", "کاشمر", "گناباد", "تربت جام", "چناران", "سرخس"] },
  { id: "east_azerbaijan", name: "آذربایجان شرقی", enName: "East Azerbaijan", capital: "تبریز", x: 170, y: 115, cities: ["تبریز", "مراغه", "مرند", "میانه", "اهر", "بناب", "سراب", "شبستر", "آذرشهر"] },
  { id: "west_azerbaijan", name: "آذربایجان غربی", enName: "West Azerbaijan", capital: "ارومیه", x: 115, y: 135, cities: ["ارومیه", "خوی", "بوکان", "مهاباد", "میاندوآب", "سلماس", "پیرانشهر", "نقده", "ماکو", "سردشت"] },
  { id: "khuzestan", name: "خوزستان", enName: "Khuzestan", capital: "اهواز", x: 250, y: 440, cities: ["اهواز", "آبادان", "خرمشهر", "دزفول", "ماهشهر", "شوشتر", "اندیمشک", "بهبهان", "ایذه", "شوش", "مسجدسلیمان"] },
  { id: "mazandaran", name: "مازندران", enName: "Mazandaran", capital: "ساری", x: 400, y: 180, cities: ["ساری", "بابل", "آمل", "قائم‌شهر", "تنکابن", "چالوس", "بابلسر", "نوشهر", "نکا", "بهشهر", "رامسر"] },
  { id: "gilan", name: "گیلان", enName: "Gilan", capital: "رشت", x: 290, y: 150, cities: ["رشت", "انزلی", "بندر انزلی", "لاهیجان", "لنگرود", "تالش", "فومن", "رودسر", "صومعه سرا", "آستارا"] },
  { id: "kerman", name: "کرمان", enName: "Kerman", capital: "کرمان", x: 580, y: 475, cities: ["کرمان", "رفسنجان", "سیرجان", "جیرفت", "بم", "زرند", "کهنوج", "بافت", "شهربابک"] },
  { id: "yazd", name: "یزد", enName: "Yazd", capital: "یزد", x: 495, y: 400, cities: ["یزد", "میبد", "اردکان", "بافق", "مهریز", "ابرکوه", "تفت"] },
  { id: "hormozgan", name: "هرمزگان", enName: "Hormozgan", capital: "بندرعباس", x: 540, y: 625, cities: ["بندرعباس", "قشم", "کیش", "میناب", "بندرلنگه", "حاجی‌آباد", "جاسک", "رودان", "بستک"] },
  { id: "bushehr", name: "بوشهر", enName: "Bushehr", capital: "بوشهر", x: 340, y: 560, cities: ["بوشهر", "برازجان", "کنگان", "عسلویه", "گناوه", "دشتی", "جم", "دیر", "تنگستان"] },
  { id: "sistan", name: "سیستان و بلوچستان", enName: "Sistan and Baluchestan", capital: "زاهدان", x: 700, y: 520, cities: ["زاهدان", "زابل", "چابهار", "ایرانشهر", "سراوان", "خاش", "نیک‌شهر", "کنارک"] },
  { id: "qom", name: "قم", enName: "Qom", capital: "قم", x: 345, y: 285, cities: ["قم", "جعفریه", "کهک", "سلفچگان"] },
  { id: "qazvin", name: "قزوین", enName: "Qazvin", capital: "قزوین", x: 305, y: 205, cities: ["قزوین", "تاکستان", "بوئین‌زهرا", "الوند", "آبیک", "محمدیه"] },
  { id: "zanjan", name: "زنجان", enName: "Zanjan", capital: "زنجان", x: 245, y: 185, cities: ["زنجان", "ابهر", "خرمدره", "قیدار", "خدابنده", "طارم"] },
  { id: "semnan", name: "سمنان", enName: "Semnan", capital: "سمنان", x: 450, y: 240, cities: ["سمنان", "شاهرود", "دامغان", "گرمسار", "مهدی‌شهر", "ایوانکی"] },
  { id: "markazi", name: "مرکزی", enName: "Markazi", capital: "اراک", x: 300, y: 310, cities: ["اراک", "ساوه", "خمین", "محلات", "دلیجان", "زرندیه", "شازند", "تفرش"] },
  { id: "hamedan", name: "همدان", enName: "Hamedan", capital: "همدان", x: 245, y: 275, cities: ["همدان", "ملایر", "نهاوند", "تویسرکان", "اسدآباد", "کبودرآهنگ", "بهار"] },
  { id: "kermanshah", name: "کرمانشاه", enName: "Kermanshah", capital: "کرمانشاه", x: 185, y: 300, cities: ["کرمانشاه", "اسلام‌آباد غرب", "کنگاور", "سنقر", "جوانرود", "صحنه", "هرسین", "پاوه", "سرپل ذهاب"] },
  { id: "kurdistan", name: "کردستان", enName: "Kurdistan", capital: "سنندج", x: 190, y: 245, cities: ["سنندج", "سقز", "مریوان", "بانه", "قروه", "کامیاران", "بیجار", "دیواندره"] },
  { id: "lorestan", name: "لرستان", enName: "Lorestan", capital: "خرم‌آباد", x: 240, y: 340, cities: ["خرم‌آباد", "بروجرد", "دورود", "الیگودرز", "کوهدشت", "نورآباد", "ازنا", "پلدختر"] },
  { id: "ilam", name: "ایلام", enName: "Ilam", capital: "ایلام", x: 160, y: 335, cities: ["ایلام", "دهلران", "ایوان", "آبدانان", "دره‌شهر", "مهران", "سرابله"] },
  { id: "chaharmahal", name: "چهارمحال و بختیاری", enName: "Chaharmahal and Bakhtiari", capital: "شهرکرد", x: 345, y: 400, cities: ["شهرکرد", "بروجن", "فارسان", "لردگان", "فرخ‌شهر", "سامان"] },
  { id: "kohgiluyeh", name: "کهگیلویه و بویراحمد", enName: "Kohgiluyeh and Boyer-Ahmad", capital: "یاسوج", x: 375, y: 475, cities: ["یاسوج", "گچساران", "دوگنبدان", "دهدشت", "دنا", "سی‌سخت", "چرام"] },
  { id: "golestan", name: "گلستان", enName: "Golestan", capital: "گرگان", x: 480, y: 170, cities: ["گرگان", "گنبد کاووس", "علی‌آباد کتول", "بندر ترکمن", "آق‌قلا", "کلاله", "کردکوی", "مینودشت"] },
  { id: "north_khorasan", name: "خراسان شمالی", enName: "North Khorasan", capital: "بجنورد", x: 585, y: 140, cities: ["بجنورد", "شیروان", "اسفراین", "آشخانه", "فاروج", "جاجرم"] },
  { id: "south_khorasan", name: "خراسان جنوبی", enName: "South Khorasan", capital: "بیرجند", x: 650, y: 360, cities: ["بیرجند", "قائن", "طبس", "فردوس", "نهبندان", "سرایان", "بشرویه"] },
  { id: "ardabil", name: "اردبیل", enName: "Ardabil", capital: "اردبیل", x: 240, y: 110, cities: ["اردبیل", "پارس‌آباد", "مشگین‌شهر", "خلخال", "گرمی", "بیله‌سوار", "نمین"] }
];

export const IranProvinceOrdersMapWidget: React.FC<IranProvinceOrdersMapWidgetProps> = ({
  orders = [],
  user,
  onUpdateUser,
  markupPercent = 5,
  onSelectProvince,
  className = ""
}) => {
  const [activeTab, setActiveTab] = useState<"map" | "leaderboard" | "coverage">("map");
  const [displayMetric, setDisplayMetric] = useState<"orders" | "volume" | "commission">("orders");
  const [filterMode, setFilterMode] = useState<"all" | "covered" | "active">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProvinceId, setSelectedProvinceId] = useState<string>("tehran");
  const [hoveredProvinceId, setHoveredProvinceId] = useState<string | null>(null);
  const [isSavingCoverage, setIsSavingCoverage] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Determine user primary province & covered provinces list
  const primaryProvinceName = user?.agencyProvince || user?.province || user?.city || "تهران";

  // Rep's covered provinces list stored in user object or localStorage
  const [coveredProvinces, setCoveredProvinces] = useState<string[]>(() => {
    if (user?.coveredProvinces && Array.isArray(user.coveredProvinces)) {
      return user.coveredProvinces;
    }
    try {
      const stored = localStorage.getItem(`dastavval_covered_provinces_${user?.phone || user?.id || 'rep'}`);
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    // Default: User's primary province
    return [primaryProvinceName];
  });

  // Sync back to storage if updated
  const saveCoveredProvinces = (newCovered: string[]) => {
    setCoveredProvinces(newCovered);
    try {
      localStorage.setItem(
        `dastavval_covered_provinces_${user?.phone || user?.id || 'rep'}`,
        JSON.stringify(newCovered)
      );
    } catch (e) {}

    if (onUpdateUser && user) {
      setIsSavingCoverage(true);
      onUpdateUser({
        ...user,
        coveredProvinces: newCovered
      });
      setTimeout(() => {
        setIsSavingCoverage(false);
        setSuccessToast("محدوده مناطق تحت پوشش عاملیت با موفقیت بروزرسانی شد");
        setTimeout(() => setSuccessToast(null), 3000);
      }, 500);
    }
  };

  const toggleProvinceCoverage = (provinceName: string) => {
    let next: string[];
    if (coveredProvinces.includes(provinceName)) {
      if (coveredProvinces.length === 1 && coveredProvinces[0] === provinceName) {
        alert("حداقل یک استان باید تحت پوشش نمایندگی شما باشد.");
        return;
      }
      next = coveredProvinces.filter(p => p !== provinceName);
    } else {
      next = [...coveredProvinces, provinceName];
    }
    saveCoveredProvinces(next);
  };

  // Helper to map order address text to a province
  const detectProvinceFromOrder = (order: Order): string => {
    const rawText = [
      order.buyerInfo?.province,
      order.buyerInfo?.city,
      order.buyerInfo?.address,
      order.city,
      (order as any).province,
      order.buyerAddress,
      (order as any).shippingAddress
    ].filter(Boolean).join(" ").toLowerCase();

    // Direct match against province names
    for (const p of RAW_PROVINCES) {
      if (rawText.includes(p.name.toLowerCase())) return p.name;
    }

    // Match against major cities
    for (const p of RAW_PROVINCES) {
      for (const city of p.cities) {
        if (rawText.includes(city.toLowerCase())) return p.name;
      }
    }

    // Default fallback to primary or Tehran
    return primaryProvinceName;
  };

  // Aggregate orders by province
  const provinceStats = useMemo(() => {
    const map: Record<string, { count: number; volume: number; commission: number; orders: Order[] }> = {};
    
    // Initialize for all 31 provinces
    RAW_PROVINCES.forEach(p => {
      map[p.name] = { count: 0, volume: 0, commission: 0, orders: [] };
    });

    // Real aggregation from system orders
    (orders || []).forEach(order => {
      const pName = detectProvinceFromOrder(order);
      const items = order.items || [];
      const volume = Number(order.totalAmount) || items.reduce((sum, item: any) => {
        const p = Number(item.pricePerCarton ?? item.price ?? 0);
        const q = Number(item.quantityCartons ?? item.quantity ?? 1);
        return sum + (p * q);
      }, 0);
      const commission = Math.round(volume * (markupPercent / 100));

      if (map[pName]) {
        map[pName].count += 1;
        map[pName].volume += volume;
        map[pName].commission += commission;
        map[pName].orders.push(order);
      }
    });

    return RAW_PROVINCES.map((p) => {
      const real = map[p.name] || { count: 0, volume: 0, commission: 0, orders: [] };
      const isPrimary = p.name === primaryProvinceName;
      const isCovered = coveredProvinces.includes(p.name);

      return {
        ...p,
        orderCount: real.count,
        totalVolume: real.volume,
        commissionAmount: real.commission,
        isCoveredByRep: isCovered,
        isPrimaryRepProvince: isPrimary,
        recentOrders: real.orders,
        growthRate: 0
      } as ProvinceData;
    });
  }, [orders, primaryProvinceName, coveredProvinces, markupPercent]);

  // Overall KPI summaries
  const totalNationwideOrders = useMemo(() => provinceStats.reduce((sum, p) => sum + p.orderCount, 0), [provinceStats]);
  const totalNationwideVolume = useMemo(() => provinceStats.reduce((sum, p) => sum + p.totalVolume, 0), [provinceStats]);
  const totalCoveredOrders = useMemo(() => {
    return provinceStats.filter(p => p.isCoveredByRep).reduce((sum, p) => sum + p.orderCount, 0);
  }, [provinceStats]);
  const totalCoveredCommission = useMemo(() => {
    return provinceStats.filter(p => p.isCoveredByRep).reduce((sum, p) => sum + p.commissionAmount, 0);
  }, [provinceStats]);

  // Max for heatmap normalization
  const maxMetricValue = useMemo(() => {
    if (displayMetric === "orders") {
      return Math.max(...provinceStats.map(p => p.orderCount), 1);
    }
    if (displayMetric === "volume") {
      return Math.max(...provinceStats.map(p => p.totalVolume), 1);
    }
    return Math.max(...provinceStats.map(p => p.commissionAmount), 1);
  }, [provinceStats, displayMetric]);

  // Filtered list for leaderboard and search
  const filteredProvinces = useMemo(() => {
    return provinceStats.filter(p => {
      const matchesSearch = searchQuery === "" || 
        p.name.includes(searchQuery) || 
        p.capital.includes(searchQuery) || 
        p.enName.toLowerCase().includes(searchQuery.toLowerCase());
      
      if (!matchesSearch) return false;
      if (filterMode === "covered") return p.isCoveredByRep;
      if (filterMode === "active") return p.orderCount > 0;
      return true;
    }).sort((a, b) => {
      if (displayMetric === "orders") return b.orderCount - a.orderCount;
      if (displayMetric === "volume") return b.totalVolume - a.totalVolume;
      return b.commissionAmount - a.commissionAmount;
    });
  }, [provinceStats, searchQuery, filterMode, displayMetric]);

  const selectedProvince = useMemo(() => {
    return provinceStats.find(p => p.id === selectedProvinceId) || provinceStats[0];
  }, [provinceStats, selectedProvinceId]);

  // Color generator for heatmap based on relative intensity
  const getProvinceHeatColor = (p: ProvinceData, isHovered: boolean, isSelected: boolean) => {
    if (isSelected) return "#059669"; // Emerald 600
    if (isHovered) return "#10b981"; // Emerald 500

    const value = displayMetric === "orders" ? p.orderCount : displayMetric === "volume" ? p.totalVolume : p.commissionAmount;
    const ratio = Math.min(value / maxMetricValue, 1);

    if (p.isCoveredByRep) {
      // Warm emerald/blue gradient for covered zones
      if (ratio > 0.7) return "#047857";
      if (ratio > 0.4) return "#059669";
      if (ratio > 0.15) return "#10b981";
      return "#34d399";
    }

    // General nationwide provinces
    if (ratio > 0.7) return "#0284c7"; // Sky 600
    if (ratio > 0.4) return "#38bdf8"; // Sky 400
    if (ratio > 0.15) return "#94a3b8"; // Slate 400
    return "#cbd5e1"; // Slate 300
  };

  return (
    <div className={`bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col space-y-5 p-5 sm:p-7 ${className}`} dir="rtl">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {successToast && (
          <motion.div 
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="bg-emerald-700 text-white text-xs font-black px-4 py-2.5 rounded-2xl flex items-center justify-between shadow-lg mb-2"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-300" />
              <span>{successToast}</span>
            </div>
            <button onClick={() => setSuccessToast(null)} className="text-emerald-200 hover:text-white">
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header & Controls Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-black flex items-center gap-1.5">
              <Compass size={14} className="text-emerald-600 animate-spin-slow" />
              <span>ویجت رصد و توزیع سفارشات ۳۱ استان</span>
            </span>
            <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-800 border border-blue-200 text-[11px] font-bold flex items-center gap-1">
              <ShieldCheck size={13} className="text-blue-600" />
              <span>{toPersianNum(coveredProvinces.length)} استان تحت پوشش عاملیت</span>
            </span>
          </div>

          <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>نقشه جامع توزیع سفارشات و مدیریت مناطق تحت پوشش</span>
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            پایش لحظه‌ای سفارشات ثبت‌شده، توزیع جغرافیایی مشتریان عمده و تنظیم آسان حوزه‌های عاملیت انحصاری نماینده در سراسر کشور.
          </p>
        </div>

        {/* View Switcher Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Metrics toggle */}
          <div className="bg-slate-100 p-1 rounded-2xl flex items-center gap-1 border border-slate-200 text-xs font-bold">
            <button
              type="button"
              onClick={() => setDisplayMetric("orders")}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                displayMetric === "orders" 
                  ? "bg-white text-emerald-800 shadow-2xs font-black" 
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              تعداد سفارشات
            </button>
            <button
              type="button"
              onClick={() => setDisplayMetric("volume")}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                displayMetric === "volume" 
                  ? "bg-white text-emerald-800 shadow-2xs font-black" 
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              ارزش ریالی (فروش)
            </button>
            <button
              type="button"
              onClick={() => setDisplayMetric("commission")}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                displayMetric === "commission" 
                  ? "bg-white text-emerald-800 shadow-2xs font-black" 
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              پورسانت عاملیت ({toPersianNum(markupPercent)}٪)
            </button>
          </div>

          {/* Tab Switcher */}
          <div className="bg-slate-100 p-1 rounded-2xl flex items-center gap-1 border border-slate-200 text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveTab("map")}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === "map" 
                  ? "bg-emerald-600 text-white shadow-2xs font-black" 
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <MapPin size={14} />
              <span>نقشه زنده</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("leaderboard")}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === "leaderboard" 
                  ? "bg-emerald-600 text-white shadow-2xs font-black" 
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <BarChart3 size={14} />
              <span>رتبه‌بندی استانی</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("coverage")}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === "coverage" 
                  ? "bg-emerald-600 text-white shadow-2xs font-black" 
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <ShieldCheck size={14} />
              <span>تنظیم مناطق پوشش</span>
            </button>
          </div>
        </div>
      </div>

      {/* Top 4 KPI Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-1">
          <span className="text-[11px] text-slate-500 font-bold flex items-center gap-1">
            <ShoppingBag size={13} className="text-emerald-600" />
            کل سفارشات تحلیل‌شده
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-base sm:text-lg font-black text-slate-900 font-mono">
              {toPersianNum(totalNationwideOrders)} <span className="text-xs font-normal">سفارش</span>
            </span>
            <span className="text-[10px] text-emerald-700 bg-emerald-100/70 px-1.5 py-0.5 rounded font-bold">
              ۳۱ استان
            </span>
          </div>
        </div>

        <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-3.5 space-y-1">
          <span className="text-[11px] text-emerald-800 font-bold flex items-center gap-1">
            <ShieldCheck size={13} className="text-emerald-600" />
            سفارشات مناطق تحت پوشش شما
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-base sm:text-lg font-black text-emerald-950 font-mono">
              {toPersianNum(totalCoveredOrders)} <span className="text-xs font-normal">سفارش</span>
            </span>
            <span className="text-[10px] text-emerald-800 font-bold">
              {toPersianNum(Math.round((totalCoveredOrders / (totalNationwideOrders || 1)) * 100))}٪ سهم
            </span>
          </div>
        </div>

        <div className="bg-blue-50/70 border border-blue-200/80 rounded-2xl p-3.5 space-y-1">
          <span className="text-[11px] text-blue-800 font-bold flex items-center gap-1">
            <Coins size={13} className="text-blue-600" />
            پورسانت مناطق تحت پوشش
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-base sm:text-lg font-black text-blue-950 font-mono">
              {toPersianNum(totalCoveredCommission.toLocaleString())} <span className="text-xs font-normal">تومان</span>
            </span>
            <span className="text-[10px] text-blue-700 bg-blue-100/70 px-1.5 py-0.5 rounded font-bold">
              نرخ {toPersianNum(markupPercent)}٪
            </span>
          </div>
        </div>

        <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-3.5 space-y-1">
          <span className="text-[11px] text-amber-900 font-bold flex items-center gap-1">
            <Award size={13} className="text-amber-600" />
            استان رکورددار بیشترین سفارش
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-sm sm:text-base font-black text-amber-950">
              {provinceStats[0]?.name || "تهران"}
            </span>
            <span className="text-xs font-black font-mono text-amber-800">
              {toPersianNum(provinceStats[0]?.orderCount || 0)} خرید
            </span>
          </div>
        </div>
      </div>

      {/* Main Interactive Tab Content */}
      {activeTab === "map" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left / Center: Interactive Vector Map Stage */}
          <div className="lg:col-span-8 bg-slate-900 rounded-3xl p-4 sm:p-6 text-white border border-slate-800 shadow-inner relative flex flex-col justify-between overflow-hidden">
            
            {/* Map Top Bar */}
            <div className="flex items-center justify-between gap-2 z-10 mb-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-xs font-black text-slate-200">نقشه کارتوگرافی تعاملی ایران</span>
                <span className="text-[10px] text-slate-400 font-mono">(۳۱ استان کشور)</span>
              </div>

              {/* Legend */}
              <div className="flex items-center gap-3 text-[10px] font-bold text-slate-300">
                <div className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 border border-emerald-300" />
                  <span>مناطق تحت پوشش شما</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-full bg-sky-500 border border-sky-300" />
                  <span>سایر استان‌ها</span>
                </div>
              </div>
            </div>

            {/* SVG Iran Map Canvas */}
            <div className="relative w-full aspect-[4/3] max-h-[520px] flex items-center justify-center select-none">
              
              {/* Background Geographic Grids */}
              <svg 
                viewBox="0 0 800 700" 
                className="w-full h-full drop-shadow-2xl overflow-visible"
              >
                <defs>
                  <radialGradient id="mapGlow" cx="50%" cy="50%" r="60%">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="#0f172a" stopOpacity="0" />
                  </radialGradient>
                  
                  {/* Filter for glowing selected pin */}
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                    <feMerge>
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>

                {/* Caspian Sea Accent Line */}
                <path 
                  d="M 270 120 C 350 140, 430 150, 520 135" 
                  fill="none" 
                  stroke="#38bdf8" 
                  strokeWidth="2" 
                  strokeOpacity="0.4"
                  strokeDasharray="4 4"
                />
                <text x="375" y="130" fill="#7dd3fc" fontSize="10" fontWeight="bold" opacity="0.6">دریای خزر</text>

                {/* Persian Gulf & Oman Sea Accent Line */}
                <path 
                  d="M 310 580 C 400 600, 500 660, 680 670" 
                  fill="none" 
                  stroke="#38bdf8" 
                  strokeWidth="2" 
                  strokeOpacity="0.4"
                  strokeDasharray="4 4"
                />
                <text x="440" y="650" fill="#7dd3fc" fontSize="10" fontWeight="bold" opacity="0.6">خلیج همیشه فارس و دریای عمان</text>

                {/* Connecting Supply Chain Rays from Tehran/Isfahan Hub */}
                {provinceStats.filter(p => p.orderCount > 8).map((p, idx) => (
                  <line
                    key={`hub-line-${p.id}`}
                    x1="370"
                    y1="235"
                    x2={p.x}
                    y2={p.y}
                    stroke="#10b981"
                    strokeWidth="1"
                    strokeOpacity={p.isCoveredByRep ? "0.35" : "0.15"}
                    strokeDasharray="3 3"
                  />
                ))}

                {/* Interactive Province Nodes & Polygons */}
                {provinceStats.map((p) => {
                  const isSelected = selectedProvinceId === p.id;
                  const isHovered = hoveredProvinceId === p.id;
                  const fillColor = getProvinceHeatColor(p, isHovered, isSelected);

                  // Calculate visual radius based on order count
                  const baseRadius = isSelected ? 24 : isHovered ? 20 : 16;
                  const normalizedBonus = Math.min((p.orderCount / maxMetricValue) * 8, 8);
                  const radius = baseRadius + normalizedBonus;

                  return (
                    <g 
                      key={`prov-node-${p.id}`}
                      className="cursor-pointer transition-all duration-300"
                      onClick={() => {
                        setSelectedProvinceId(p.id);
                        if (onSelectProvince) onSelectProvince(p.name);
                      }}
                      onMouseEnter={() => setHoveredProvinceId(p.id)}
                      onMouseLeave={() => setHoveredProvinceId(null)}
                    >
                      {/* Outer pulse wave for top order nodes or primary rep province */}
                      {(p.isPrimaryRepProvince || p.orderCount > 10) && (
                        <circle
                          cx={p.x}
                          cy={p.y}
                          r={radius + 8}
                          fill="none"
                          stroke={p.isCoveredByRep ? "#10b981" : "#38bdf8"}
                          strokeWidth="1.5"
                          opacity="0.4"
                          className="animate-ping"
                          style={{ transformOrigin: `${p.x}px ${p.y}px` }}
                        />
                      )}

                      {/* Covered Region Highlight Ring */}
                      {p.isCoveredByRep && (
                        <circle
                          cx={p.x}
                          cy={p.y}
                          r={radius + 4}
                          fill="none"
                          stroke="#fbbf24"
                          strokeWidth="2"
                          strokeDasharray={isSelected ? "none" : "3 2"}
                        />
                      )}

                      {/* Main Province Node Circle */}
                      <circle
                        cx={p.x}
                        cy={p.y}
                        r={radius}
                        fill={fillColor}
                        stroke={isSelected ? "#ffffff" : p.isCoveredByRep ? "#34d399" : "#64748b"}
                        strokeWidth={isSelected ? "3" : "1.5"}
                        filter={isSelected ? "url(#glow)" : undefined}
                        className="transition-transform duration-200 hover:scale-110"
                      />

                      {/* Inner Order Count Text */}
                      <text
                        x={p.x}
                        y={p.y + 4}
                        textAnchor="middle"
                        fill="#ffffff"
                        fontSize={radius > 18 ? "12" : "10"}
                        fontWeight="900"
                        fontFamily="monospace"
                        className="pointer-events-none select-none"
                      >
                        {toPersianNum(p.orderCount)}
                      </text>

                      {/* Province Name Label */}
                      <text
                        x={p.x}
                        y={p.y + radius + 13}
                        textAnchor="middle"
                        fill={isSelected ? "#34d399" : isHovered ? "#ffffff" : p.isCoveredByRep ? "#fef08a" : "#94a3b8"}
                        fontSize="11"
                        fontWeight={isSelected || isHovered ? "bold" : "500"}
                        className="pointer-events-none select-none transition-colors"
                      >
                        {p.name}
                      </text>

                      {/* Covered Star Badge */}
                      {p.isPrimaryRepProvince && (
                        <text
                          x={p.x + radius - 2}
                          y={p.y - radius + 2}
                          fontSize="10"
                          className="pointer-events-none select-none"
                        >
                          👑
                        </text>
                      )}
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Quick Action Hint */}
            <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-[11px] text-slate-400 gap-2 z-10">
              <div className="flex items-center gap-1.5">
                <Sparkles size={13} className="text-amber-400" />
                <span>برای مشاهده جزئیات فاکتورها و وضعیت عاملیت، روی هر استان در نقشه کلیک فرمایید.</span>
              </div>
              <span className="font-mono text-emerald-400 font-bold">
                حلقه طلایی = تحت پوشش رسمی شما
              </span>
            </div>
          </div>

          {/* Right: Selected Province Detail Card & Actions */}
          <div className="lg:col-span-4 space-y-4">
            
            {/* Selected Province Details */}
            <div className="bg-slate-50 border border-slate-200 rounded-3xl p-5 space-y-4 shadow-2xs">
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-black text-slate-500">مشخصات استان انتخابی:</span>
                    {selectedProvince.isPrimaryRepProvince && (
                      <span className="text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-full">
                        دفتر مرکزی شما
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                    <MapPin size={20} className="text-emerald-600" />
                    <span>استان {selectedProvince.name}</span>
                  </h3>
                  <span className="text-xs text-slate-500 font-medium block">
                    مرکز: شهرستان {selectedProvince.capital} • {selectedProvince.enName}
                  </span>
                </div>

                {/* Coverage Toggle Button */}
                <button
                  type="button"
                  onClick={() => toggleProvinceCoverage(selectedProvince.name)}
                  disabled={isSavingCoverage}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95 ${
                    selectedProvince.isCoveredByRep
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                      : "bg-white hover:bg-slate-100 text-slate-700 border border-slate-300"
                  }`}
                >
                  {selectedProvince.isCoveredByRep ? (
                    <>
                      <Check size={14} />
                      <span>تحت پوشش شماست</span>
                    </>
                  ) : (
                    <>
                      <Plus size={14} />
                      <span>+ افزودن به پوشش من</span>
                    </>
                  )}
                </button>
              </div>

              {/* Province Metrics Grid */}
              <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-slate-200/80">
                <div className="bg-white p-3 rounded-2xl border border-slate-200/70 space-y-0.5">
                  <span className="text-[10px] font-bold text-slate-400 block">تعداد سفارشات</span>
                  <span className="text-base font-black text-slate-900 font-mono">
                    {toPersianNum(selectedProvince.orderCount)} <span className="text-[11px] font-normal">فاکتور</span>
                  </span>
                </div>

                <div className="bg-white p-3 rounded-2xl border border-slate-200/70 space-y-0.5">
                  <span className="text-[10px] font-bold text-slate-400 block">سهم از کل کشور</span>
                  <span className="text-base font-black text-emerald-600 font-mono">
                    {toPersianNum(Math.round((selectedProvince.orderCount / (totalNationwideOrders || 1)) * 100))}٪
                  </span>
                </div>

                <div className="bg-white p-3 rounded-2xl border border-slate-200/70 space-y-0.5 col-span-2">
                  <span className="text-[10px] font-bold text-slate-400 block">ارزش ناخالص سفارشات</span>
                  <span className="text-base font-black text-slate-900 font-mono">
                    {toPersianNum(selectedProvince.totalVolume.toLocaleString())} <span className="text-xs font-normal">تومان</span>
                  </span>
                </div>

                <div className="bg-emerald-50/80 border border-emerald-200 p-3 rounded-2xl space-y-0.5 col-span-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-emerald-800">پورسانت عاملیت این استان ({toPersianNum(markupPercent)}٪)</span>
                    <Coins size={14} className="text-emerald-700" />
                  </div>
                  <span className="text-lg font-black text-emerald-950 font-mono">
                    {toPersianNum(selectedProvince.commissionAmount.toLocaleString())} <span className="text-xs font-normal">تومان</span>
                  </span>
                </div>
              </div>

              {/* Major Cities Covered */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] font-black text-slate-600 block">شهرهای اصلی تحت نظارت در این استان:</span>
                <div className="flex flex-wrap gap-1.5">
                  {(selectedProvince.cities || []).map(c => (
                    <span key={c} className="text-[10.5px] font-bold bg-white text-slate-700 border border-slate-200 px-2.5 py-1 rounded-lg">
                      {c}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Buttons for Representative */}
              <div className="pt-2 border-t border-slate-200 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (onSelectProvince) onSelectProvince(selectedProvince.name);
                    setActiveTab("leaderboard");
                  }}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Eye size={14} />
                  <span>مشاهده گزارش سفارشات استان {selectedProvince.name}</span>
                </button>
              </div>
            </div>

            {/* Coverage Quick Helper Box */}
            <div className="bg-amber-50/80 border border-amber-200 rounded-3xl p-4 space-y-2 text-xs text-amber-900">
              <div className="flex items-center gap-1.5 font-black text-amber-950">
                <AlertCircle size={15} className="text-amber-700 shrink-0" />
                <span>راهنمای افزایش قلمرو و عاملیت استانی:</span>
              </div>
              <p className="leading-relaxed text-[11.5px]">
                با افزودن استان‌های همجوار به محدوده پوشش، سفارشات عمده ثبت‌شده در آن استان‌ها با کد نمایندگی شما تطبیق یافته و کارمزد ۵٪ مستقیماً به حساب شما منظور می‌گردد.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard Table View Tab */}
      {activeTab === "leaderboard" && (
        <div className="space-y-4">
          
          {/* Search & Filter Subbar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
            <div className="relative w-full sm:w-80">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="جستجوی نام استان یا شهر مرکز..."
                className="w-full bg-white border border-slate-200 rounded-xl pr-9 pl-4 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
              />
              <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
              <button
                type="button"
                onClick={() => setFilterMode("all")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-all ${
                  filterMode === "all" ? "bg-emerald-600 text-white" : "bg-white text-slate-600 border border-slate-200"
                }`}
              >
                همه ۳۱ استان ({provinceStats.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterMode("covered")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-all ${
                  filterMode === "covered" ? "bg-emerald-600 text-white" : "bg-white text-slate-600 border border-slate-200"
                }`}
              >
                فقط حوزه‌های من ({toPersianNum(coveredProvinces.length)})
              </button>
              <button
                type="button"
                onClick={() => setFilterMode("active")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-all ${
                  filterMode === "active" ? "bg-emerald-600 text-white" : "bg-white text-slate-600 border border-slate-200"
                }`}
              >
                استان‌های دارای سفارش
              </button>
            </div>
          </div>

          {/* Leaderboard Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-slate-50/80 text-slate-600 font-black border-b border-slate-200">
                    <th className="py-3 px-4">رتبه</th>
                    <th className="py-3 px-4">نام استان و مرکز</th>
                    <th className="py-3 px-4">وضعیت عاملیت</th>
                    <th className="py-3 px-4 text-center">تعداد سفارش</th>
                    <th className="py-3 px-4 text-center">سهم از کل</th>
                    <th className="py-3 px-4">ارزش ناخالص فاکتورها</th>
                    <th className="py-3 px-4">پورسانت عاملیت ({toPersianNum(markupPercent)}٪)</th>
                    <th className="py-3 px-4 text-center">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {filteredProvinces.map((p, idx) => {
                    const percentShare = Math.round((p.orderCount / (totalNationwideOrders || 1)) * 100);
                    return (
                      <tr 
                        key={`leader-${p.id}`}
                        className={`hover:bg-slate-50 transition-colors ${
                          p.id === selectedProvinceId ? "bg-emerald-50/50" : ""
                        }`}
                      >
                        <td className="py-3 px-4 font-mono font-black text-slate-400">
                          {idx === 0 ? "🥇 ۱" : idx === 1 ? "🥈 ۲" : idx === 2 ? "🥉 ۳" : toPersianNum(idx + 1)}
                        </td>

                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-black text-slate-900 text-sm">{p.name}</span>
                            <span className="text-[11px] text-slate-400">({p.capital})</span>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          {p.isPrimaryRepProvince ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-full">
                              👑 پایگاه اصلی
                            </span>
                          ) : p.isCoveredByRep ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-full">
                              <Check size={11} />
                              تحت پوشش شما
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-bold">
                              خارج از منطقه
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-center font-mono font-black text-slate-900">
                          {toPersianNum(p.orderCount)}
                        </td>

                        <td className="py-3 px-4">
                          <div className="w-24 mx-auto space-y-1">
                            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full ${p.isCoveredByRep ? "bg-emerald-500" : "bg-sky-500"}`}
                                style={{ width: `${Math.min(percentShare * 2.5, 100)}%` }}
                              />
                            </div>
                            <span className="text-[10px] font-mono text-slate-500 block text-center">
                              {toPersianNum(percentShare)}٪
                            </span>
                          </div>
                        </td>

                        <td className="py-3 px-4 font-mono font-black text-slate-800">
                          {toPersianNum(p.totalVolume.toLocaleString())} <span className="text-[10px] text-slate-400 font-normal">تومان</span>
                        </td>

                        <td className="py-3 px-4 font-mono font-black text-emerald-700">
                          {toPersianNum(p.commissionAmount.toLocaleString())} <span className="text-[10px] text-slate-400 font-normal">تومان</span>
                        </td>

                        <td className="py-3 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => toggleProvinceCoverage(p.name)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition-all cursor-pointer ${
                              p.isCoveredByRep
                                ? "bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200"
                                : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200"
                            }`}
                          >
                            {p.isCoveredByRep ? "حذف پوشش" : "+ افزودن پوشش"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Coverage Management Tab */}
      {activeTab === "coverage" && (
        <div className="space-y-5">
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-black text-slate-900">مدیریت استان‌های تحت عاملیت انحصاری</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                استان‌هایی که علامت تیک سبز دارند به عنوان محدوده رسمی توزیع و عاملیت شما ثبت شده و پورسانت سفارش‌های آن مناطق برای شما لحاظ می‌گردد.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => saveCoveredProvinces(RAW_PROVINCES.map(p => p.name))}
                className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-black transition-all cursor-pointer"
              >
                پوشش سراسری (همه ۳۱ استان)
              </button>
              <button
                type="button"
                onClick={() => saveCoveredProvinces([primaryProvinceName])}
                className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-black transition-all cursor-pointer"
              >
                تنها استان اصلی ({primaryProvinceName})
              </button>
            </div>
          </div>

          {/* 31 Province Grid Cards for easy toggle */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
            {provinceStats.map(p => {
              const isCovered = p.isCoveredByRep;
              return (
                <div
                  key={`cov-grid-${p.id}`}
                  onClick={() => toggleProvinceCoverage(p.name)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-2 relative select-none ${
                    isCovered
                      ? "bg-emerald-50/80 border-emerald-400 shadow-2xs"
                      : "bg-white border-slate-200 hover:border-slate-300 opacity-70 hover:opacity-100"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <span className="font-black text-slate-900 text-xs">{p.name}</span>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                      isCovered ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-400 border border-slate-200"
                    }`}>
                      {isCovered ? <Check size={12} /> : null}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-mono font-bold text-slate-500 pt-1 border-t border-slate-100">
                    <span>{toPersianNum(p.orderCount)} سفارش</span>
                    {p.isPrimaryRepProvince && (
                      <span className="text-[10px] text-amber-700 bg-amber-100 px-1.5 rounded">اصلی</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
};

export default IranProvinceOrdersMapWidget;
