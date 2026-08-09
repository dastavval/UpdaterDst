import { useState, useEffect } from "react";
import { Product, PaymentMethod } from "../types";
import { 
  Percent, TrendingUp, DollarSign, MapPin, Phone, ShieldCheck, 
  HelpCircle, RefreshCw, Calculator, FileText, LayoutDashboard, 
  CreditCard, Award, ArrowLeftRight, Printer, Receipt, ChevronLeft, 
  UserCheck, FileCheck, Truck, Search, Calendar, Clock, CheckCircle2, 
  Upload, X, Building2, AlertCircle, Eye, Check, User as UserIcon, MessageSquare, Bell, LogOut
} from "lucide-react";
import WholesaleInvoiceView from "./WholesaleInvoiceView";
import RepresentativeCertificateView from "./RepresentativeCertificateView";
import { t, Language } from "../lib/translations";
import { ProfileManagement, SupportTicketSystem, SystemNotifications } from "./PortalModules";

interface B2BBusinessDashboardProps {
  products: Product[];
  theme: 'light' | 'dark' | 'classic';
  language: Language;
  userBadge?: 'bronze' | 'silver' | 'gold' | 'vip' | 'admin';
  user?: any;
  lastOrderTracking?: string;
  lastOrderAmount?: number;
  transitRoutes?: any[];
  b2bConfig?: any;
  onLogout?: () => void;
  onUpdateUser?: (updatedUser: any) => void;
  onUpdateB2bConfig?: (updatedConfig: any) => void;
}

const STAGES = [
  { key: 'order_received', label: "ثبت فاکتور در پلتفرم دست اول", desc: "سفارش شما تایید و فاکتور خرید امانی با مهر پلتفرم دست اول صادر شد.", icon: <FileText size={16} /> },
  { key: 'dastavval_warehouse_prep', label: "تجمیع و خروج از انبار مرکزی دست اول", desc: "محصولات مستقیماً از انبار توزیع انحصاری دست اول و جهت حمل بارگیری شدند.", icon: <Building2 size={16} /> },
  { key: 'platform_logistics', label: "حمل و ترانزیت جاده‌ای مسقف", desc: "ناوگان جاده‌ای دست اول بار بارگیری شده را تحت پوشش بیمه کامل به استان مقصد منتقل می‌کند.", icon: <Truck size={16} /> },
  { key: 'representative_delivery', label: "توزیع توسط نماینده معتمد استانی", desc: "محموله جهت ترخیص نهایی و بازرسی سلامت فیزیکی به نماینده معتمد دست اول در منطقه شما تحویل شد.", icon: <ShieldCheck size={16} /> },
  { key: 'delivered', label: "تحویل نهایی و امضای فاکتور امانی", desc: "بار به سلامت کامل تخلیه گردید و با تایید نماینده، فاکتور امانی ثبت نهایی شد.", icon: <CheckCircle2 size={16} /> },
];

export default function B2BBusinessDashboard({ 
  products, 
  theme, 
  language,
  userBadge = "bronze", 
  user,
  lastOrderTracking = "",
  lastOrderAmount = 0,
  transitRoutes = [],
  b2bConfig,
  onLogout,
  onUpdateUser,
  onUpdateB2bConfig
}: B2BBusinessDashboardProps) {

  // Active Main tab of the partner portal
  const [activeTab, setActiveTab] = useState<'overview' | 'tracking' | 'roi' | 'agents' | 'profile' | 'tickets' | 'notifications'>('overview');

  useEffect(() => {
    const handleTabChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ tab: string }>;
      if (customEvent.detail?.tab) {
        setActiveTab(customEvent.detail.tab as any);
      }
    };
    window.addEventListener("change-portal-tab", handleTabChange);
    return () => window.removeEventListener("change-portal-tab", handleTabChange);
  }, []);
  
  // Credit Limit Request Modal / Form states
  const [isCreditModalOpen, setIsCreditModalOpen] = useState(false);
  const [requestAmount, setRequestAmount] = useState<string>("50000000");
  const [licenseFile, setLicenseFile] = useState<File | null>(null);
  const [isSubmittingCredit, setIsSubmittingCredit] = useState(false);
  const [creditSuccess, setCreditSuccess] = useState(false);

  // Selected Order for Invoice modal
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<any | null>(null);

  // Calculator States
  const [selectedProductId, setSelectedProductId] = useState<string>(products[0]?.id || "");
  const [calcCartons, setCalcCartons] = useState<number>(10);
  const [customRetailPrice, setCustomRetailPrice] = useState<number>(0);

  // Shipment Tracker States
  const [searchCode, setSearchCode] = useState(lastOrderTracking);
  const [activeTracking, setActiveTracking] = useState<any>(null);
  const [trackerError, setTrackerError] = useState("");
  const [agentRequestSubmitted, setAgentRequestSubmitted] = useState(false);
  const [licenseUploadStatus, setLicenseUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [showAgentCertificate, setShowAgentCertificate] = useState(false);

  const selectedProduct = products.find(p => p.id === selectedProductId) || products[0];

  // Sync custom retail price with product consumer price
  const activeConsumerPrice = customRetailPrice > 0 
    ? customRetailPrice 
    : (selectedProduct?.consumer_price || (selectedProduct?.bulk_price * 1.5 || 0));

  // Calculations
  const packCount = selectedProduct?.carton_pack_count || 1;
  const unitBuyPrice = selectedProduct?.bulk_price || 0;
  
  const totalBuyPrice = unitBuyPrice * packCount * calcCartons;
  const totalSellPrice = activeConsumerPrice * packCount * calcCartons;
  const netProfit = totalSellPrice - totalBuyPrice;
  const profitMarginPercent = totalBuyPrice > 0 ? ((netProfit / totalBuyPrice) * 100).toFixed(1) : "0";
  const roiPercent = totalBuyPrice > 0 ? ((netProfit / totalBuyPrice) * 100).toFixed(1) : "0";

  const handleProductChange = (id: string) => {
    setSelectedProductId(id);
    const prod = products.find(p => p.id === id);
    if (prod) {
      setCalcCartons(prod.min_order_cartons);
      setCustomRetailPrice(prod.consumer_price || prod.bulk_price * 1.5);
    }
  };

  // Convert numbers to Persian
  const toPersianNum = (num: number | string) => {
    if (num === undefined || num === null) return "";
    const persian = {
      "0": "۰", "1": "۱", "2": "۲", "3": "۳", "4": "۴", "5": "۵", "6": "۶", "7": "۷", "8": "۸", "9": "۹"
    };
    return num.toString().replace(/[0-9]/g, (w) => (persian as any)[w]);
  };

  const PROVINCE_AGENTS = [
    { province: "تهران و البرز", agent: "مهندس علیرضا رضایی", company: "بازرگانی دست اول پایتخت", phone: "۰۲۱-۸۸۸۸۴۴۴۴", address: "تهران، میدان ونک، برج فناوری تجارت ملی", status: "فعال و مستقل" },
    { province: "اصفهان", agent: "حاج عباس احمدی", company: "توزیع گستر اصفهان سهند", phone: "۰۳۱-۳۳۳۳۲۲۲۲", address: "اصفهان، شهرک صنعتی جی، خیابان چهارم", status: "فعال و مستقل" },
    { province: "خراسان رضوی", agent: "سید محمد موسوی", company: "پخش و توزیع شرق خراسان", phone: "۰۵۱-۳۸۸۸۷۷۷۷", address: "مشهد، بزرگراه کلانتری، مجتمع تجاری اطلس", status: "فعال و مستقل" },
    { province: "فارس", agent: "خانم مهندس سلطانی", company: "توزیع تخصصی جنوب شیراز", phone: "۰۷۱-۳۲۲۲۵۵۵۵", address: "شیراز، بلوار امیرکبیر، کوچه ۱۲", status: "فعال و مستقل" },
    { province: "آذربایجان شرقی", agent: "کربلایی یعقوب نوری", company: "صنایع پخش بنکداری سهند تبریز", phone: "۰۴۱-۳۶۶۶۹۹۹۹", address: "تبریز، جاده صوفیان، مجتمع پخش انبارها", status: "فعال و مستقل" },
    { province: "خوزستان", agent: "آقای امین کریمی", company: "بازرگانی توزیع کارون اهواز", phone: "۰۶۱-۳۲۲۲۱۱۱۱", address: "اهواز، جاده اندیمشک، شهرک انبارداران", status: "فعال و مستقل" },
    { province: "مازندران و گیلان", agent: "مهندس حسن یوسفی", company: "پخش خزر ساحل شمال", phone: "۰۱۱-۳۲۲۲۹۹۹۹", address: "ساری، کمربندی شرقی، روبروی ترمینال", status: "فعال و مستقل" }
  ];

  const getBadgeTranslation = (badge: string) => {
    switch (badge) {
      case 'vip': return language === 'en' ? 'VIP Elite' : language === 'ar' ? 'النخبة VIP' : 'نماینده ویژه VIP';
      case 'gold': return language === 'en' ? 'Gold Partner' : language === 'ar' ? 'شريك ذهبي' : 'همکار طلایی';
      case 'silver': return language === 'en' ? 'Silver Partner' : language === 'ar' ? 'شريك فضي' : 'همکار نقره‌ای';
      case 'admin': return language === 'en' ? 'HQ Admin' : language === 'ar' ? 'المدير العام' : 'مدیر ارشد مرکزی';
      default: return language === 'en' ? 'Bronze Partner' : language === 'ar' ? 'شريك برونزي' : 'همکار برنزی';
    }
  };

  const getBadgeClass = (badge: string) => {
    switch (badge) {
      case 'vip': return "bg-purple-500 text-white shadow-md shadow-purple-500/20";
      case 'gold': return "bg-amber-500 text-slate-900 shadow-md shadow-amber-500/20";
      case 'silver': return "bg-slate-400 text-slate-900 shadow-md shadow-slate-400/20";
      case 'admin': return "bg-rose-600 text-white shadow-md shadow-rose-600/20";
      default: return "bg-emerald-700 text-white shadow-md shadow-emerald-700/20";
    }
  };

  // Simulated Past Wholesale Orders
  const SIMULATED_ORDERS = [
    {
      id: "ord-102",
      trackingNumber: lastOrderTracking || "TRK-88540",
      totalAmount: lastOrderAmount || 24500000,
      paymentMethod: "half_check" as PaymentMethod,
      status: lastOrderTracking ? "production_line" : "quality_assurance",
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000 * 1), // 1 day ago
      companyName: user?.company || "شرکت پخش زرین تهران",
      taxId: "14015694200",
      items: [
        {
          id: products[0]?.id || "p1",
          name: products[0]?.name || "چیپس کتل سنتی نمک دریایی",
          brand: products[0]?.brand || "مزمز",
          bulk_price: products[0]?.bulk_price || 18500,
          carton_pack_count: products[0]?.carton_pack_count || 24,
          quantity: 12, // cartons
          category: products[0]?.category || "تنقلات و شکلات",
          image_url: products[0]?.image_url || "https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=300&q=80",
          consumer_price: products[0]?.consumer_price || 25000,
          min_order_cartons: 5
        }
      ]
    },
    {
      id: "ord-101",
      trackingNumber: "TRK-99432",
      totalAmount: 48600000,
      paymentMethod: "cash" as PaymentMethod,
      status: "delivered",
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000 * 12), // 12 days ago
      companyName: user?.company || "شرکت پخش زرین تهران",
      taxId: "14015694200",
      items: [
        {
          id: products[1]?.id || "p2",
          name: products[1]?.name || "کلوچه خرمایی ویژه سنتی",
          brand: products[1]?.brand || "نظری",
          bulk_price: products[1]?.bulk_price || 12500,
          carton_pack_count: products[1]?.carton_pack_count || 36,
          quantity: 15,
          category: products[1]?.category || "کیک، کلوچه و بیسکویت",
          image_url: products[1]?.image_url || "https://images.unsplash.com/photo-1558961309-dbdf71799f5a?auto=format&fit=crop&w=300&q=80",
          consumer_price: products[1]?.consumer_price || 18000,
          min_order_cartons: 8
        }
      ]
    }
  ];

  const getOrderStatusBadge = (status: string) => {
    switch (status) {
      case 'delivered': 
        return <span className="bg-teal-50 text-teal-700 px-3 py-1 rounded-full text-[10px] font-black border border-teal-100">تحویل شد / تخلیه در انبار</span>;
      case 'quality_assurance': 
        return <span className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-[10px] font-black border border-emerald-100">در حال ترانزیت / کنترل کیفی</span>;
      case 'production_line': 
        return <span className="bg-amber-50 text-amber-700 px-3 py-1 rounded-full text-[10px] font-black border border-amber-100 animate-pulse">در خط تولید کارخانه</span>;
      default: 
        return <span className="bg-slate-50 text-slate-600 px-3 py-1 rounded-full text-[10px] font-black border border-slate-100">در حال بررسی نهایی</span>;
    }
  };

  const handleSearchTracking = (e: React.FormEvent) => {
    e.preventDefault();
    setTrackerError("");
    setActiveTracking(null);

    const trimmed = searchCode.trim().toUpperCase();
    if (!trimmed) {
      setTrackerError("لطفاً یک کد پیگیری معتبر وارد نمایید.");
      return;
    }

    if (trimmed === lastOrderTracking.toUpperCase() && lastOrderTracking) {
      setActiveTracking({
        code: lastOrderTracking,
        origin: "کارخانه مرکزی دست اول - خط تولید جور",
        destination: user?.company || "انبار ثبت‌شده شما در سامانه",
        status: "production_line",
        operator: "ترابری لجستیک ملی دست اول",
        amount: lastOrderAmount,
        date: "۱۴۰۲/۰۴/۱۶"
      });
    } else if (trimmed.startsWith("TRK-") || trimmed.length > 5) {
      const seed = trimmed.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const stageIdx = seed % STAGES.length;
      const statusKey = STAGES[stageIdx].key;
      
      setActiveTracking({
        code: trimmed,
        origin: "مجتمع صنایع غذایی نظری - البرز",
        destination: "باربری بنکداری سراسری همکاران",
        status: statusKey,
        operator: "باربری تندباد آریا",
        amount: 24500000,
        date: "۱۴۰۲/۰۴/۱۵"
      });
    } else {
      setTrackerError("شناسه سفارش یافت نشد. لطفاً کد پیگیری فاکتور خرید یا شماره بارنامه خود را وارد نمایید.");
    }
  };

  const getStageIndex = (statusKey: string) => {
    return STAGES.findIndex(s => s.key === statusKey);
  };

  const activeStageIdx = activeTracking ? getStageIndex(activeTracking.status) : -1;

  const defaultRoutes = transitRoutes.length > 0 ? transitRoutes : [
    {
      id: "r1",
      origin: "صنایع غذایی مزمز - تهران شمس‌آباد",
      destination: user?.company || "بنکداری همکار - شیراز دروازه اصفهان",
      status: "in_transit",
      operator: "باربری تندباد آریا",
      estimatedDays: 2
    },
    {
      id: "r2",
      origin: "مجتمع صنایع غذایی شیرین‌عسل - تبریز",
      destination: "انبار توزیع بنکداری سراسری - مشهد",
      status: "loading",
      operator: "پیشگامان ترابری البرز",
      estimatedDays: 3
    }
  ];

  const handleCreditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingCredit(true);
    setTimeout(() => {
      setIsSubmittingCredit(false);
      setCreditSuccess(true);
      setTimeout(() => {
        setCreditSuccess(false);
        setIsCreditModalOpen(false);
      }, 3000);
    }, 2000);
  };

  return (
    <div className="space-y-6 text-right pb-16" dir="rtl">
      
      {/* 1. Header Banner & Profile Status */}
      <div className="bg-white text-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-150 shadow-sm relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="absolute top-[-20%] left-[-10%] w-[35%] h-[35%] bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="space-y-3 relative z-10 text-center md">
          <div className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full text-emerald-700 text-[10px] font-black uppercase">
            <UserCheck size={12} />
            {t("پورتال مدیریت اعتباری و خرید عمده بنکداران", language)}
          </div>
          <h2 className="text-xl sm font-black text-slate-900">
            {t("میز کار ", language)} {user?.name || t("خریدار عمده و همکار گرامی", language)}
          </h2>
          <p className="text-slate-500 text-xs font-bold leading-relaxed max-w-xl">
            {t("خوش آمدید. در این بخش می‌توانید اعتبار خرید کارخانه‌ای، فاکتورها، رهگیری زنده خط ترانزیت بار و سودآوری فروش را بررسی کنید.", language)}
          </p>
        </div>

        <div className="flex flex-row md:flex-col items-center gap-3 shrink-0 relative z-10 w-full md:w-auto justify-center">
          <div className={`px-5 py-3 rounded-2xl flex items-center gap-3 ${getBadgeClass(userBadge)} w-full md:w-auto justify-center`}>
            <Award size={20} className="animate-pulse" />
            <div className="text-right text-white">
              <span className="text-[9px] opacity-80 block font-bold">{t("رتبه اعتباری شما", language)}</span>
              <span className="text-xs font-black">{getBadgeTranslation(userBadge)}</span>
            </div>
          </div>
          <div className="bg-slate-50 border border-slate-150 px-5 py-3 rounded-2xl flex items-center gap-3 text-slate-800 w-full md:w-auto justify-center">
            <ShieldCheck size={20} className="text-emerald-600" />
            <div className="text-right">
              <span className="text-[9px] text-slate-400 block font-bold">{t("وضعیت حساب", language)}</span>
              <span className="text-xs font-black text-emerald-600">{t("تایید شده", language)}</span>
            </div>
          </div>
          {onLogout && (
            <button 
              onClick={onLogout}
              className="bg-rose-50 hover hover border border-rose-200 text-rose-700 px-5 py-3 rounded-2xl flex items-center gap-3 transition-all cursor-pointer w-full md:w-auto justify-center text-xs font-black group"
            >
              <LogOut size={16} className="text-rose-500 group-hover" />
              <span>خروج از حساب</span>
            </button>
          )}
        </div>
      </div>

      {/* 1.5 Representative Official Badge & Certificate Callout */}
      {user?.role === 'agent' && (
        <div className="bg-gradient-to-r from-amber-500/10 via-yellow-500/5 to-transparent border border-amber-500/20 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
          <div className="flex items-center gap-4 text-right">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-600 border border-amber-500/15 shrink-0">
              <Award size={32} className="animate-bounce" />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-1 rounded-md bg-amber-500 text-slate-950 text-[9px] font-black uppercase tracking-wider">
                  {t("نماینده رسمی و انحصاری", language)}
                </span>
                <span className="font-mono bg-slate-100 px-2.5 py-0.5 rounded border border-slate-200 text-[10px] font-black text-indigo-700">
                  {toPersianNum(user?.agencyCode || "AGN-5001")}
                </span>
              </div>
              <h3 className="text-sm font-black text-slate-900">
                {t("حکم رسمی اعطای نمایندگی انحصاری توزیع استانی صادر گردید", language)}
              </h3>
              <p className="text-slate-500 text-xs font-bold leading-relaxed max-w-2xl">
                {t("مدارک حقوقی و شایستگی لجستیکی شما توسط مدیریت ارشد دست اول بررسی و تایید نهایی گردید. هم‌اکنون می‌توانید گواهی رسمی ممهور نمایندگی خود را مشاهده، چاپ و دانلود کنید.", language)}
              </p>
            </div>
          </div>

          <button 
            onClick={() => setShowAgentCertificate(true)}
            className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-2xl text-xs font-black flex items-center gap-2 shadow-lg shadow-amber-500/25 transition-all cursor-pointer whitespace-nowrap"
          >
            <Award size={16} />
            <span>{t("مشاهده و دریافت گواهی رسمی نمایندگی", language)}</span>
          </button>
        </div>
      )}

      {/* 2. Responsive Sub-Tab Selector */}
      <div className="bg-white border border-slate-100 p-2 rounded-2xl flex flex-wrap gap-2 shadow-sm">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all ${
            activeTab === 'overview'
              ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
              : "text-slate-500 hover"
          }`}
        >
          <LayoutDashboard size={14} />
          {t("خلاصه وضعیت مالی و تجاری", language)}
        </button>
        <button
          onClick={() => {
            setActiveTab('tracking');
            // pre-load tracking if order code exists
            if (lastOrderTracking && !activeTracking) {
              setActiveTracking({
                code: lastOrderTracking,
                origin: "کارخانه مرکزی دست اول - خط تولید جور",
                destination: user?.company || "انبار ثبت‌شده شما در سامانه",
                status: "production_line",
                operator: "ترابری لجستیک ملی دست اول",
                amount: lastOrderAmount,
                date: "۱۴۰۲/۰۴/۱۶"
              });
            }
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all ${
            activeTab === 'tracking'
              ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
              : "text-slate-500 hover"
          }`}
        >
          <Truck size={14} />
          {t("لجستیک و رهگیری زنده بار", language)}
        </button>
        <button
          onClick={() => setActiveTab('roi')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all ${
            activeTab === 'roi'
              ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
              : "text-slate-500 hover"
          }`}
        >
          <Calculator size={14} />
          {t("آنالیزر سود بنکداری و ROI", language)}
        </button>
        <button
          onClick={() => setActiveTab('agents')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all ${
            activeTab === 'agents'
              ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
              : "text-slate-500 hover"
          }`}
        >
          <MapPin size={14} />
          {t("شبکه نمایندگان و شعب استانی", language)}
        </button>
        
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all ${
            activeTab === 'profile'
              ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
              : "text-slate-500 hover"
          }`}
        >
          <UserIcon size={14} />
          {t("ویرایش مشخصات و انبارها", language)}
        </button>

        <button
          onClick={() => setActiveTab('tickets')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all ${
            activeTab === 'tickets'
              ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
              : "text-slate-500 hover"
          }`}
        >
          <MessageSquare size={14} />
          {t("تیکت پشتیبانی عمده", language)}
        </button>

        <button
          onClick={() => setActiveTab('notifications')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all ${
            activeTab === 'notifications'
              ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
              : "text-slate-500 hover"
          }`}
        >
          <Bell size={14} />
          {t("اعلان‌ها", language)}
        </button>
      </div>

      {/* 3. Tab Contents */}
      <div className="transition-all duration-300">
        
        {/* --- OVERVIEW TAB --- */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            
            {/* Financial Overview Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Credit Limit Card */}
              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between h-40">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block mb-1">{t("اعتبار خرید فعال", language)}</span>
                    <span className="text-xl font-black text-slate-900 font-mono">
                      {(b2bConfig?.buyerCredit || 250000000).toLocaleString()} <span className="text-xs font-normal text-slate-500">{t("تومان", language)}</span>
                    </span>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                    <CreditCard size={18} />
                  </div>
                </div>
                <div className="space-y-2 mt-4">
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full w-2/3" />
                  </div>
                  <div className="flex justify-between items-center text-[9px] font-black">
                    <button 
                      onClick={() => setIsCreditModalOpen(true)}
                      className="text-emerald-600 hover font-black cursor-pointer"
                    >
                      {t("ثبت تقاضای افزایش اعتبار ↑", language)}
                    </button>
                    <span className="text-slate-400">
                      {t("باقیمانده:", language)} {Math.round((b2bConfig?.buyerCredit || 250000000) * 0.34).toLocaleString()} ت
                    </span>
                  </div>
                </div>
              </div>

              {/* Badges/Class Card */}
              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between h-40">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block mb-1">{t("تخفیف پیش‌فرض همکار", language)}</span>
                    <span className="text-xl font-black text-slate-900 font-mono">
                      {userBadge === 'vip' ? '٪۸' : userBadge === 'gold' ? '٪۵' : userBadge === 'silver' ? '٪۲' : '٪۰'}
                    </span>
                    <span className="text-[9px] font-bold text-slate-400 block mt-1">{t("تخفیف ثابت بر کل فاکتورها", language)}</span>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                    <Percent size={18} />
                  </div>
                </div>
                <p className="text-[9px] text-slate-400 font-bold leading-relaxed">
                  {t("با خرید بالای ۱,۰۰۰ کارتن در ماه به عضویت طلایی (۵٪ تخفیف کل فاکتور) ارتقا می‌یابید.", language)}
                </p>
              </div>

              {/* Compliance / Document verification Card */}
              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between h-40">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block mb-1">{t("تایید پروانه کسب و فعالیت", language)}</span>
                    <span className="text-sm font-black text-emerald-600 block">{t("احراز هویت شده", language)}</span>
                    <span className="text-[9px] font-bold text-slate-400 block mt-1">{t("سامانه توزیع مستقیم کشوری", language)}</span>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600">
                    <FileCheck size={18} />
                  </div>
                </div>
                <div className="text-[10px] font-black text-slate-500 bg-slate-50 p-2 rounded-lg text-center border border-slate-100">
                  {t("شناسه کسب", language)}: {toPersianNum("0421598402")}
                </div>
              </div>

              {/* Transactions Sum */}
              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between h-40">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block mb-1">{t("مجموع خرید مستقیم", language)}</span>
                    <span className="text-xl font-black text-slate-900 font-mono">۷۳,۱۰۰,۰۰۰ <span className="text-xs font-normal text-slate-500">{t("تومان", language)}</span></span>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                    <Receipt size={18} />
                  </div>
                </div>
                <div className="flex justify-between items-center text-[10px] font-black text-slate-400">
                  <span>{t("تعداد فاکتور: ۲ عدد", language)}</span>
                  <span className="text-emerald-600">{t("خرید نقدی / چکی", language)}</span>
                </div>
              </div>
            </div>

            {/* B2B Action Portal & Simulated Past Invoices */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Previous Official Invoices List */}
              <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-150 p-5 shadow-sm space-y-4">
                <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                  <FileText className="text-emerald-600" size={16} />
                  {t("لیست فاکتورهای خرید کارتنی از درب کارخانه", language)}
                </h3>

                {/* Desktop view: Standard table with explicit paddings and no wrapping */}
                <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-150">
                  <table className="w-full min-w-[720px] table-auto text-right text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-150 text-slate-500 font-bold">
                        <th className="px-5 py-3 whitespace-nowrap">{t("شماره پیگیری", language)}</th>
                        <th className="px-5 py-3 whitespace-nowrap">{t("تاریخ فاکتور", language)}</th>
                        <th className="px-5 py-3 whitespace-nowrap">{t("مبلغ نهایی (تومان)", language)}</th>
                        <th className="px-5 py-3 whitespace-nowrap">{t("روش پرداخت", language)}</th>
                        <th className="px-5 py-3 whitespace-nowrap text-center">{t("وضعیت بار", language)}</th>
                        <th className="px-5 py-3 whitespace-nowrap text-left">{t("عملیات", language)}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-bold bg-white">
                      {SIMULATED_ORDERS.map((order, idx) => (
                        <tr key={idx} className="hover transition-colors">
                          <td className="px-5 py-4 whitespace-nowrap font-mono text-emerald-600 font-black">{order.trackingNumber}</td>
                          <td className="px-5 py-4 whitespace-nowrap text-slate-600">{toPersianNum(order.createdAt.toLocaleDateString("fa-IR"))}</td>
                          <td className="px-5 py-4 whitespace-nowrap font-mono">{order.totalAmount.toLocaleString()}</td>
                          <td className="px-5 py-4 whitespace-nowrap text-slate-500 font-medium">
                            {order.paymentMethod === 'cash' ? t("خرید نقدی (پیش‌فاکتور)", language) : t("نصف نقد / نصف چک", language)}
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap text-center">
                            <span className="inline-block whitespace-nowrap">
                              {getOrderStatusBadge(order.status)}
                            </span>
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap text-left">
                            <button
                              onClick={() => setSelectedInvoiceOrder(order)}
                              className="px-3 py-1.5 bg-slate-100 hover hover text-slate-700 rounded-lg text-[10px] font-black flex items-center gap-1.5 inline-flex transition-all cursor-pointer"
                            >
                              <Eye size={12} />
                              {t("مشاهده فاکتور خرید", language)}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile / Tablet view: Clean stacked grids with absolutely no overlaps */}
                <div className="md:hidden space-y-4">
                  {SIMULATED_ORDERS.map((order, idx) => (
                    <div 
                      key={idx} 
                      className="bg-white border border-slate-150 rounded-xl p-4.5 space-y-3.5 shadow-sm"
                    >
                      <div className="grid grid-cols-2 gap-y-2.5 gap-x-4 text-xs font-bold">
                        <div className="text-slate-400 text-right">{t("شماره پیگیری", language)}:</div>
                        <div className="font-mono text-emerald-600 font-black text-left">{order.trackingNumber}</div>
                        
                        <div className="text-slate-400 text-right">{t("تاریخ فاکتور", language)}:</div>
                        <div className="text-slate-700 text-left">{toPersianNum(order.createdAt.toLocaleDateString("fa-IR"))}</div>
                        
                        <div className="text-slate-400 text-right">{t("مبلغ نهایی", language)}:</div>
                        <div className="font-mono text-slate-800 font-black text-left">{order.totalAmount.toLocaleString()} {t("تومان", language)}</div>
                        
                        <div className="text-slate-400 text-right">{t("روش پرداخت", language)}:</div>
                        <div className="text-slate-600 font-medium text-left">
                          {order.paymentMethod === 'cash' ? t("خرید نقدی", language) : t("نصف نقد / نصف چک", language)}
                        </div>
                      </div>

                      <div className="h-px bg-slate-100" />

                      <div className="flex flex-row items-center justify-between gap-2 pt-1">
                        <div className="shrink-0">
                          {getOrderStatusBadge(order.status)}
                        </div>
                        <button
                          onClick={() => setSelectedInvoiceOrder(order)}
                          className="px-3 py-2 bg-slate-100 hover hover text-slate-700 rounded-lg text-[10px] font-black flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                          <Eye size={12} />
                          <span>{t("مشاهده فاکتور خرید", language)}</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Actions & Licensing Doc Submissions */}
              <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex flex-col justify-between">
                <div className="space-y-4">
                  <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                    <Upload className="text-emerald-600" size={16} />
                    {t("بارگذاری اسناد فعالیت و پروانه جدید", language)}
                  </h3>
                  <p className="text-[10px] text-slate-400 leading-relaxed font-bold">
                    {t("اگر آدرس مغازه، انبار بارگیری یا رسته پروانه کسب شما تغییر کرده است، تصویر جدید سند را جهت بروزرسانی سطح اعتباری ارسال کنید.", language)}
                  </p>

                  <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover transition-colors relative group">
                    <input 
                      type="file" 
                      onChange={(e) => setLicenseFile(e.target.files ? e.target.files[0] : null)}
                      className="absolute inset-0 opacity-0 cursor-pointer" 
                    />
                    <Upload className="mx-auto text-slate-400 group-hover transition-colors mb-2" size={24} />
                    <span className="text-xs text-slate-700 font-black block">
                      {licenseFile ? licenseFile.name : t("درگ یا کلیک جهت بارگذاری سند", language)}
                    </span>
                    <span className="text-[9px] text-slate-400 font-bold block mt-1">{t("فرمت‌های مجاز: JPG, PNG, PDF (حداکثر ۵ مگابایت)", language)}</span>
                  </div>
                </div>

                {licenseUploadStatus === 'success' && (
                  <div className="mt-3 p-2.5 text-[10px] text-emerald-700 bg-emerald-50 rounded-xl border border-emerald-100 font-black text-center">
                    ✓ {t("پروانه کسب ارسال شد و حداکثر در ۲ ساعت آینده توسط کارشناسان پشتیبانی تایید خواهد شد.", language)}
                  </div>
                )}
                {licenseUploadStatus === 'error' && (
                  <div className="mt-3 p-2.5 text-[10px] text-rose-700 bg-rose-50 rounded-xl border border-rose-100 font-black text-center">
                    ⚠ {t("لطفاً ابتدا فایلی را برای بارگذاری انتخاب کنید.", language)}
                  </div>
                )}

                <button
                  onClick={() => {
                    if (licenseFile) {
                      setLicenseUploadStatus('success');
                      setLicenseFile(null);
                    } else {
                      setLicenseUploadStatus('error');
                    }
                  }}
                  className="w-full mt-4 py-2.5 bg-emerald-600 hover text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-600/10 cursor-pointer text-center"
                >
                  {t("ارسال نهایی برای بخش بررسی اعتباری", language)}
                </button>
              </div>
            </div>

            {/* Platform Advantages Banner */}
            <div className="bg-slate-50 border border-slate-100 p-6 rounded-3xl flex flex-col md:flex-row items-center gap-4 text-center md">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                <ShieldCheck size={24} />
              </div>
              <div className="flex-1 space-y-1">
                <h4 className="text-xs font-black text-slate-900">{t("طرح گارانتی ۱۰۰٪ تضمین سلامت کامل و کسر باربری", language)}</h4>
                <p className="text-[10px] text-slate-400 leading-relaxed font-bold">
                  {t("بازرگانی دست اول تضمین می‌کند در صورت بروز هرگونه آسیب فیزیکی به کارتن‌ها، مغایرت در تعداد سفارش تحویل‌شده و یا کسر فله باربری جاده‌ای، هزینه خسارت بی‌قیدوشرط تا ۴ ساعت پس از تخلیه پرداخت یا کالا مرجوع شود.", language)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* --- TRACKING TAB --- */}
        {activeTab === 'tracking' && (
          <div className="space-y-6">
            
            {/* Search Input Card */}
            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-4">
              <div className="max-w-2xl space-y-2">
                <span className="text-[10px] bg-emerald-500/10 text-emerald-600 px-2.5 py-1 rounded-md font-black uppercase tracking-wider inline-flex items-center gap-1">
                  <Truck size={12} className="animate-bounce" />
                  {t("سامانه رهگیری زنده ناوگان و ترانزیت جاده‌ای", language)}
                </span>
                <h3 className="text-lg font-black text-slate-900">{t("وضعیت زنده تولید فیزیکی و تحویل باربری", language)}</h3>
                <p className="text-slate-400 text-[10px] font-bold">
                  {language === 'en' ? "Enter your bulk tracking ID (e.g. TRK-88540) to query current status." :
                   language === 'ar' ? "أدخل رقم تتبع الشحنة الكبيرة (مثل TRK-88540) للاستعلام عن الحالة الحالية." :
                   language === 'ru' ? "Введите код отслеживания оптовой партии (например, TRK-88540) для проверки статуса." :
                   "شناسه سفارش عمده کارگاهی خود را جهت استعلام زنده خط پخت، شیرینگ، آزمایشگاه بهداشت سیب سلامت و کامیون ترابری وارد کنید."}
                </p>
              </div>

              <form onSubmit={handleSearchTracking} className="flex flex-col sm:flex-row gap-3 max-w-xl">
                <div className="relative flex-1">
                  <input 
                    type="text" 
                    value={searchCode}
                    onChange={(e) => setSearchCode(e.target.value)}
                    placeholder={t("کد پیگیری ترانزیت یا شناسه فاکتور را وارد کنید...", language)} 
                    className="w-full bg-white border border-slate-200 rounded-2xl pr-12 pl-4 py-3 text-xs focus:outline-none focus focus font-black tracking-wider text-center"
                  />
                  <Search className="absolute right-4 top-3.5 text-slate-400" size={16} />
                </div>
                <button 
                  type="submit"
                  className="bg-emerald-600 hover text-white py-3 px-8 rounded-2xl text-xs font-black shadow-lg shadow-emerald-600/20 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
                >
                  {t("استعلام زنده ناوگان", language)}
                </button>
              </form>
              {trackerError && <p className="text-rose-500 text-[11px] font-black">{trackerError}</p>}
            </div>

            {/* Interactive Timeline of Stages */}
            {activeTracking && (
              <div className="bg-white border border-slate-100 p-6 sm:p-8 rounded-3xl space-y-6 shadow-sm">
                
                {/* Header Information Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pb-6 border-b border-slate-100 text-xs font-bold">
                  <div className="p-3 rounded-xl bg-slate-50">
                    <span className="text-[10px] text-slate-400 block mb-1">{t("شناسه یکتای مرسوله", language)}</span>
                    <span className="text-emerald-600 font-mono font-black text-sm tracking-widest">{activeTracking.code}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50">
                    <span className="text-[10px] text-slate-400 block mb-1">{t("کارگاه مبدا بارگیری", language)}</span>
                    <span className="text-slate-700 truncate block">{t(activeTracking.origin, language)}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50">
                    <span className="text-[10px] text-slate-400 block mb-1">{t("مقصد نهایی انبار", language)}</span>
                    <span className="text-slate-700 truncate block">{activeTracking.destination}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50">
                    <span className="text-[10px] text-slate-400 block mb-1">{t("باربری و متصدی ترابری", language)}</span>
                    <span className="text-slate-700 truncate block">{t(activeTracking.operator, language)}</span>
                  </div>
                </div>

                {/* Vertical Stepper Timeline */}
                <div className="relative pt-2">
                  <h4 className="font-black text-xs text-slate-400 mb-6 uppercase tracking-wider">{t("مراحل زمان‌بندی زنده آماده‌سازی و ارسال بار:", language)}</h4>
                  <div className="relative border-r-2 border-slate-100 pr-6 mr-3 space-y-8">
                    {STAGES.map((stage, idx) => {
                      const isPassed = idx < activeStageIdx;
                      const isCurrent = idx === activeStageIdx;

                      return (
                        <div key={stage.key} className="relative flex flex-col sm:flex-row items-start gap-4">
                          <div className={`absolute -right-[31px] top-1.5 w-4 h-4 rounded-full border-4 flex items-center justify-center transition-all ${
                            isPassed 
                              ? 'bg-emerald-500 border-white scale-110 shadow-lg shadow-emerald-500/20' 
                              : isCurrent 
                              ? 'bg-amber-500 border-white scale-125 shadow-lg shadow-amber-500/20 ring-4 ring-amber-500/10'
                              : 'bg-slate-200 border-white'
                          }`} />

                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border transition-all ${
                            isPassed 
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-600' 
                              : isCurrent 
                              ? 'bg-amber-50 border-amber-200 text-amber-600 font-bold'
                              : 'bg-slate-50 border-slate-100 text-slate-400'
                          }`}>
                            {stage.icon}
                          </div>

                          <div className="space-y-1 text-right flex-1">
                            <h5 className={`text-xs md font-black ${
                              isPassed 
                                ? 'text-emerald-700' 
                                : isCurrent 
                                ? 'text-amber-700 font-black'
                                : 'text-slate-400'
                            }`}>
                              {t(stage.label, language)}
                              {isCurrent && <span className="mr-2 text-[9px] bg-amber-500/10 text-amber-600 px-2 py-0.5 rounded-full font-black animate-pulse">{t("درحال کار", language)}</span>}
                              {isPassed && <span className="mr-2 text-[9px] bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded-full font-black">{t("پایان یافته", language)}</span>}
                            </h5>
                            <p className="text-[10px] md text-slate-500 max-w-xl leading-relaxed">
                              {t(stage.desc, language)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Active Fleets on road list */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              <div className="lg:col-span-2 space-y-4">
                <h3 className="font-black text-sm text-slate-800 flex items-center gap-2">
                  <span>🚚</span>
                  {t("ناوگان فعال ترابری و بارهای مواصلاتی در جریان پلتفرم", language)}
                </h3>
                <div className="space-y-3">
                  {defaultRoutes.map((route, idx) => (
                    <div 
                      key={route.id || idx}
                      className="p-4 bg-white border border-slate-100 rounded-2xl relative overflow-hidden shadow-sm"
                    >
                      <div className="absolute bottom-0 right-0 left-0 h-1 bg-slate-100">
                        <div 
                          className={`h-full bg-gradient-to-l ${route.status === 'in_transit' ? 'from-emerald-500 to-emerald-400 animate-pulse w-2/3' : 'from-amber-500 to-amber-400 w-1/4'}`}
                        />
                      </div>
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-right">
                        <div className="space-y-1">
                          <span className={`text-[8px] font-black px-2 py-0.5 rounded ${
                            route.status === 'in_transit' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                          }`}>
                            {route.status === 'in_transit' ? t("بین راهی (در جاده)", language) : t("در حال تخلیه / بارگیری", language)}
                          </span>
                          <h4 className="text-xs font-black text-slate-800 mt-1">{t(route.origin, language)} ← {t(route.destination, language)}</h4>
                          <span className="text-[10px] text-slate-400 font-bold block">{t("متصدی", language)}: {t(route.operator, language)}</span>
                        </div>
                        <div className="text-right sm shrink-0">
                          <span className="text-[9px] text-slate-400 font-bold block mb-0.5">{t("مدت زمان تخمینی", language)}</span>
                          <span className="text-xs font-mono font-black text-emerald-600 flex items-center gap-1">
                            <Calendar size={12} />
                            {route.estimatedDays} {t("روز کاری", language)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cargo Safety Standard Card */}
              <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-100">
                  <ShieldCheck size={24} />
                </div>
                <div className="space-y-2 text-center">
                  <h4 className="text-xs font-black text-slate-800">{t("سیستم رهگیری هوشمند باربری", language)}</h4>
                  <p className="text-[10px] text-slate-400 leading-relaxed font-bold">
                    {t("تمامی محصولات با شماره رهگیری هوشمند ثبت جاده‌ای می‌شوند. راننده حق تخلیه خارج از محدوده انبار خریدار در سامانه را نداشته و سلامت بهداشتی بار ۱۰۰٪ بیمه است.", language)}
                  </p>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-center text-[10px] font-mono font-bold text-slate-500">
                  {t("کد رهگیری امروز", language)}: DSL-TRACK-88942-IR
                </div>
              </div>

            </div>

          </div>
        )}

        {/* --- Calculator ROI TAB --- */}
        {activeTab === 'roi' && selectedProduct && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Input Form */}
            <div className="lg:col-span-1 space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-100">
              <h4 className="font-black text-sm text-slate-900 flex items-center gap-1.5 border-b border-slate-200/60 pb-3 mb-2">
                <Calculator className="text-emerald-600" size={16} />
                {t("پارامترهای سود خرده‌فروشی", language)}
              </h4>

              <div>
                <label className="block text-[11px] text-slate-500 font-bold mb-1.5">{t("انتخاب کالا جهت آنالیز سود:", language)}</label>
                <select
                  value={selectedProductId}
                  onChange={e => handleProductChange(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl focus focus text-xs font-bold text-slate-700 text-right"
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.brand} - {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-slate-500 font-bold mb-1.5">{t("حجم سفارش مد نظر (کارتن):", language)}</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={selectedProduct.min_order_cartons}
                    value={calcCartons}
                    onChange={e => setCalcCartons(Math.max(selectedProduct.min_order_cartons, parseInt(e.target.value) || 1))}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus focus text-xs font-black text-center font-mono"
                  />
                  <span className="text-[10px] text-slate-400 font-bold whitespace-nowrap">
                    ({t("حداقل:", language)} {selectedProduct.min_order_cartons})
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-slate-500 font-bold mb-1.5">{t("قیمت فروش مصرف‌کننده واحد (تومان):", language)}</label>
                <input
                  type="number"
                  value={customRetailPrice > 0 ? customRetailPrice : activeConsumerPrice}
                  onChange={e => setCustomRetailPrice(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus focus text-xs font-black text-center font-mono text-emerald-700"
                />
                <p className="text-[9px] text-slate-400 font-bold mt-1.5">
                  {t("پیش‌فرض قیمت چاپی روی کالا:", language)} {selectedProduct.consumer_price?.toLocaleString()} {t("تومان", language)}
                </p>
              </div>

              <div className="bg-emerald-50/50 p-3.5 rounded-xl text-emerald-800 text-[11px] leading-relaxed font-bold border border-emerald-100">
                💡 {t("با خرید کارتنی از دست اول، کالا را با قیمت همکاری (پایه) دریافت می‌کنید و حاشیه سود شما تا آخرین حد مجاز بازار عمده افزایش می‌یابد.", language)}
              </div>
            </div>

            {/* Simulated ROI Results */}
            <div className="lg:col-span-2 flex flex-col justify-between gap-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm text-right flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 flex-shrink-0">
                    <DollarSign size={20} />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">{t("مجموع فاکتور خرید کارخانه‌ای (پرداختی شما):", language)}</span>
                    <span className="text-xl font-black text-slate-900 font-mono block mt-1">
                      {totalBuyPrice.toLocaleString()}{" "}
                      <span className="text-xs font-normal text-slate-500">{t("تومان", language)}</span>
                    </span>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm text-right flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 flex-shrink-0">
                    <TrendingUp size={20} />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">{t("ارزش فروش کل مصرف‌کننده (درآمد مغازه):", language)}</span>
                    <span className="text-xl font-black text-slate-900 font-mono block mt-1">
                      {totalSellPrice.toLocaleString()}{" "}
                      <span className="text-xs font-normal text-slate-500">{t("تومان", language)}</span>
                    </span>
                  </div>
                </div>

                <div className="bg-emerald-50/20 p-5 rounded-2xl border border-emerald-100/50 text-right flex items-start gap-4 col-span-1 md:col-span-2">
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 flex-shrink-0">
                    <Percent size={24} />
                  </div>
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <span className="text-[10px] text-emerald-700/80 font-black block">{t("سود خالص شما از این بار:", language)}</span>
                      <span className="text-2xl font-black text-emerald-800 font-mono mt-1 block">
                        {netProfit.toLocaleString()}{" "}
                        <span className="text-xs font-normal font-sans">{t("تومان", language)}</span>
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-emerald-700/80 font-black block">{t("حاشیه سود واقعی همکاری:", language)}</span>
                      <span className="text-2xl font-black text-emerald-800 font-mono mt-1 block">
                        ٪{toPersianNum(profitMarginPercent)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-emerald-700/80 font-black block">{t("بازگشت سرمایه (ROI):", language)}</span>
                      <span className="text-2xl font-black text-emerald-800 font-mono mt-1 block">
                        ٪{toPersianNum(roiPercent)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Graphical representation/Meter */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                <div className="flex justify-between items-center text-xs font-black text-slate-500 mb-2">
                  <span>{t("سود ناخالص فروشنده", language)}</span>
                  <span>{t("هزینه خرید پایه", language)}</span>
                </div>
                <div className="h-4 bg-slate-200 rounded-full overflow-hidden flex flex-row-reverse">
                  <div 
                    className="h-full bg-emerald-500 transition-all duration-500" 
                    style={{ width: `${Math.min(100, (netProfit / totalSellPrice) * 100)}%` }}
                  />
                  <div 
                    className="h-full bg-slate-400 transition-all duration-500" 
                    style={{ width: `${Math.max(0, 100 - (netProfit / totalSellPrice) * 100)}%` }}
                  />
                </div>
                <p className="text-[10px] text-slate-400 font-bold mt-2.5 leading-relaxed text-center">
                  {language === 'en' ? `Your retail profit is equivalent to ${toPersianNum(((netProfit / totalSellPrice) * 100).toFixed(1))}% of consumer sales. Excellent deal!` :
                   language === 'ar' ? `ربح التجزئة الخاص بك يعادل ${toPersianNum(((netProfit / totalSellPrice) * 100).toFixed(1))}% من مبيعات المستهلك. صفقة ممتازة!` :
                   language === 'ru' ? `Ваша розничная прибыль эквивалентна ${toPersianNum(((netProfit / totalSellPrice) * 100).toFixed(1))}% от розничных продаж.` :
                   `سود خرده‌فروشی شما معادل ${toPersianNum(((netProfit / totalSellPrice) * 100).toFixed(1))}% از کل حجم فروش مصرف‌کننده است. این به معنای یک معامله بی‌نظیر است!`}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* --- REGIONAL AGENTS TAB --- */}
        {activeTab === 'agents' && (
          <div>
            <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
              <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                <MapPin className="text-emerald-600" />
                {t("شبکه توزیع استانی و باربری‌های معتمد دست اول", language)}
              </h3>
              <span className="text-[10px] bg-emerald-50 text-emerald-700 font-black px-3 py-1 rounded-full border border-emerald-100">
                {toPersianNum(7)} {t("نماینده توزیع فعال و معتمد", language)}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {PROVINCE_AGENTS.map((item, idx) => (
                <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover transition-all flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-xs bg-emerald-50 text-emerald-700 font-black px-2.5 py-1 rounded-lg">
                        {t("استان", language)} {t(item.province, language)}
                      </span>
                      <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                        <ShieldCheck size={12} />
                        {t(item.status, language)}
                      </span>
                    </div>

                    <h4 className="font-black text-sm text-slate-900 mb-1">{t(item.company, language)}</h4>
                    <p className="text-[11px] text-slate-500 font-bold">{t("مسئول فنی", language)}: {t(item.agent, language)}</p>
                    <p className="text-[11px] text-slate-400 font-medium leading-relaxed mt-2">{t(item.address, language)}</p>
                  </div>

                  <div className="border-t border-dashed border-slate-100 mt-4 pt-3 flex justify-between items-center">
                    <span className="text-[10px] text-slate-400 font-bold">{t("تلفن هماهنگی باربری:", language)}</span>
                    {(() => {
                      const isVIP = userBadge === 'vip' || userBadge === 'admin';
                      if (isVIP) {
                        return (
                          <span className="font-mono font-black text-xs text-emerald-600 flex items-center gap-1">
                            <Phone size={10} />
                            {toPersianNum(item.phone)}
                          </span>
                        );
                      } else {
                        return (
                          <button
                            type="button"
                            onClick={() => {
                              alert("🔒 همکار گرامی، اطلاعات تماس مستقیم هماهنگی باربری نمایندگان جهت حفظ امنیت اطلاعات تجاری، منحصراً برای اعضای VIP فعال می‌باشد. شما می‌توانید رتبه کاربری خود را در پنل مدیریت به VIP تغییر دهید تا شماره‌ها فعال شوند.");
                            }}
                            className="font-mono font-black text-xs text-purple-600 hover:text-purple-700 flex items-center gap-1 bg-purple-50 px-2 py-0.5 rounded cursor-pointer"
                          >
                            <Phone size={10} className="text-purple-500" />
                            <span className="blur-[3px] select-none">{toPersianNum(item.phone.replace(/\d/g, "*"))}</span>
                            <span className="text-[9px] bg-purple-200 text-purple-800 px-1 rounded">VIP</span>
                          </button>
                        );
                      }
                    })()}
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl mt-8 text-center max-w-2xl mx-auto space-y-3">
              <h4 className="font-black text-sm text-slate-900">{t("مایل به درخواست اخذ نمایندگی توزیع هستید؟", language)}</h4>
              <p className="text-xs text-slate-400 leading-relaxed max-w-lg mx-auto font-bold">
                {t("اگر دارای سیستم لجستیک توزیع محلی، پروانه انبار تجاری و مجوز پخش بنکداری مواد غذایی هستید، می‌توانید تقاضای خود را ارسال نمایید.", language)}
              </p>
              
              {agentRequestSubmitted ? (
                <div className="text-emerald-600 font-black text-xs p-3 bg-emerald-50 rounded-xl max-w-md mx-auto border border-emerald-200/30 animate-fade-in">
                  ✓ {t("درخواست اولیه نمایندگی ثبت شد. کارشناسان پشتیبانی جهت بررسی انبار تماس خواهند گرفت.", language)}
                </div>
              ) : (
                <button 
                  onClick={() => setAgentRequestSubmitted(true)}
                  className="bg-emerald-600 hover text-white font-black text-xs px-5 py-2.5 rounded-xl shadow-lg shadow-emerald-600/10 cursor-pointer inline-flex items-center gap-2 transition-all active:scale-95"
                >
                  <ShieldCheck size={14} />
                  {t("ارسال مدارک و تقاضای نمایندگی توزیع", language)}
                </button>
              )}
            </div>
          </div>
        )}

        {/* --- PROFILE, ADDRESS & PASSWORD TAB --- */}
        {activeTab === 'profile' && (
          <div className="animate-in fade-in duration-300">
            <ProfileManagement 
              user={user} 
              onUpdateUser={onUpdateUser} 
              language={language}
              b2bConfig={b2bConfig}
              onUpdateB2bConfig={onUpdateB2bConfig}
            />
          </div>
        )}

        {/* --- SUPPORT TICKETS TAB --- */}
        {activeTab === 'tickets' && (
          <div className="animate-in fade-in duration-300">
            <SupportTicketSystem />
          </div>
        )}

        {/* --- NOTIFICATIONS TAB --- */}
        {activeTab === 'notifications' && (
          <div className="animate-in fade-in duration-300">
            <SystemNotifications />
          </div>
        )}

      </div>

      {/* 4. MODAL: PREVIOUS ORDER OFFICIAL A4 INVOICE */}
      {selectedInvoiceOrder && (
        <WholesaleInvoiceView 
          order={selectedInvoiceOrder}
          b2bConfig={{
            appName: t("بازرگانی دست اول", language),
            appSub: t("مرجع مبادلات مستقیم و تامین کالای عمده", language),
            logoUrl: "" // uses fallback inside Invoice
          }}
          onClose={() => setSelectedInvoiceOrder(null)}
          isBuyer={true}
        />
      )}

      {/* 4.5. MODAL: REPRESENTATIVE OFFICIAL CERTIFICATE */}
      {showAgentCertificate && (
        <RepresentativeCertificateView
          repName={user?.name || t("نماینده رسمی استان (خراسان)", language)}
          companyName={user?.company || t("پخش انحصاری توس", language)}
          city={user?.city || t("خراسان رضوی", language)}
          agencyCode={user?.agencyCode || "AGN-5001"}
          badge={t("نماینده انحصاری توزیع استانی", language)}
          onClose={() => setShowAgentCertificate(false)}
          b2bConfig={b2bConfig}
        />
      )}

      {/* 5. MODAL: REQUEST CREDIT INCREASE */}
      {isCreditModalOpen && (
        <div className="fixed inset-0 z-[120] bg-white/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl relative border border-slate-100 text-right">
            <button 
              onClick={() => setIsCreditModalOpen(false)}
              className="absolute top-4 left-4 p-1 hover text-slate-400 rounded-full cursor-pointer"
            >
              <X size={18} />
            </button>

            <h3 className="font-black text-sm text-slate-900 flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
              <CreditCard className="text-emerald-600" size={18} />
              {t("درخواست تمدید یا افزایش اعتبار خرید کارخانه‌ای", language)}
            </h3>

            {creditSuccess ? (
              <div className="py-8 text-center space-y-4">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 size={28} />
                </div>
                <h4 className="font-black text-emerald-600 text-sm">{t("درخواست با موفقیت ثبت گردید", language)}</h4>
                <p className="text-[10px] text-slate-400 max-w-xs mx-auto leading-relaxed">
                  {language === 'en' ? `Your request for a credit increase of ${parseInt(requestAmount).toLocaleString()} tomans was submitted successfully.` :
                   language === 'ar' ? `تم تقديم طلب زيادة الائتمان بمبلغ ${parseInt(requestAmount).toLocaleString()} تومان بنجاح.` :
                   language === 'ru' ? `Запрос на увеличение лимита на сумму ${parseInt(requestAmount).toLocaleString()} томанов успешно отправлен.` :
                   `تقاضای افزایش اعتبار به مبلغ ${parseInt(requestAmount).toLocaleString()} تومان برای واحد بازرسی اعتباری مرکزی صادر شد و ظرف چند ساعت آینده اعمال خواهد شد.`}
                </p>
              </div>
            ) : (
              <form onSubmit={handleCreditSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold mb-1.5">{t("مبلغ درخواستی افزایش اعتبار (تومان):", language)}</label>
                  <input 
                    type="number" 
                    value={requestAmount}
                    onChange={(e) => setRequestAmount(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-black text-center font-mono"
                    required
                  />
                  <p className="text-[8px] text-slate-400 mt-1">
                    {t("حداکثر اعتبار مجاز درخواستی جدید: ۵۰۰,۰۰۰,۰۰۰ تومان", language)}
                  </p>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 font-bold mb-1.5">{t("بارگذاری تصویر آخرین گردش حساب یا چک صیاد:", language)}</label>
                  <div className="border border-dashed border-slate-200 rounded-xl p-4 text-center bg-slate-50 relative">
                    <Upload className="mx-auto text-slate-400 mb-1" size={18} />
                    <span className="text-[10px] text-slate-700 font-black block">{t("فایل فاکتور یا گردش حساب را بکشید", language)}</span>
                    <span className="text-[8px] text-slate-400 block mt-0.5">{t("فرمت‌ها: JPG, PNG, PDF", language)}</span>
                  </div>
                </div>

                <div className="bg-amber-50 p-3 rounded-xl flex items-start gap-2 text-[9px] text-amber-700 font-bold border border-amber-100">
                  <AlertCircle size={14} className="shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    {t("توجه: فرآیند تخصیص اعتبار خرید مستقیم از انبار کارخانه‌ها نیاز به چک صیادی تایید شده بنکداری دارد. لطفا فیزیک چک را به شعب منتخب باربری تحویل دهید.", language)}
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingCredit}
                  className="w-full py-2.5 bg-emerald-600 hover text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-600/10 cursor-pointer flex items-center justify-center gap-2"
                >
                  {isSubmittingCredit ? (
                    <>
                      <RefreshCw className="animate-spin" size={14} />
                      {t("در حال ثبت تقاضا...", language)}
                    </>
                  ) : (
                    t("ارسال تقاضا به بخش مالی کارخانه", language)
                  )}
                </button>
              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
